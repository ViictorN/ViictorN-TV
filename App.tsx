import React, { useState, useEffect, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ChatMessageItem } from './components/ChatMessageItem';
import { SettingsModal } from './components/SettingsModal';
import { SendIcon, TwitchLogo, KickLogo } from './components/Icons';
import { ChatMessage, AuthState, Platform, StreamStats, TwitchCreds, BadgeMap, EmoteMap, ChatSettings } from './types';
import { TwitchConnection, KickConnection } from './services/chatConnection';
import { analyzeChatVibe } from './services/geminiService';
import { fetch7TVEmotes } from './services/sevenTVService';

const MAX_MESSAGES = 500;
const STREAMER_SLUG = 'gabepeixe';
const TWITCH_USER_LOGIN = 'gabepeixe';

// Default Settings
const DEFAULT_SETTINGS: ChatSettings = {
    showTimestamps: false,
    hideAvatars: false,
    fontSize: 'medium',
    hideSystemMessages: false,
    deletedMessageBehavior: 'strikethrough',
    alternatingBackground: false,
    highlightMentions: true,
    fontFamily: 'sans',
    showSeparator: false,
    rainbowUsernames: false,
    largeEmotes: false,
    ignoredUsers: [],
    ignoredKeywords: []
};

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Auth state
  const [authState, setAuthState] = useState<AuthState>({ 
    twitch: false, 
    kick: false,
    twitchUsername: '',
    kickUsername: ''
  });

  // Settings State (Persisted)
  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('chat_settings');
          return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
      }
      return DEFAULT_SETTINGS;
  });

  // UI State (Persisted)
  const [activePlayer, setActivePlayer] = useState<'twitch' | 'kick' | 'none'>(() => {
      return (localStorage.getItem('active_player') as any) || 'twitch';
  });

  const [chatFilter, setChatFilter] = useState<'all' | 'twitch' | 'kick'>(() => {
      return (localStorage.getItem('chat_filter') as any) || 'all';
  });
  
  const [commentPlatform, setCommentPlatform] = useState<'twitch' | 'kick'>('twitch');
  const [chatInput, setChatInput] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  
  // Stats
  const [streamStats, setStreamStats] = useState<StreamStats>({ 
    kickViewers: null, 
    twitchViewers: null,
    isLiveKick: false, 
    isLiveTwitch: false 
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [twitchCreds, setTwitchCreds] = useState<TwitchCreds>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('twitch_creds');
        return saved ? JSON.parse(saved) : { clientId: '', accessToken: '' };
    }
    return { clientId: '', accessToken: '' };
  });
  
  const [kickUsername, setKickUsername] = useState(() => {
     return localStorage.getItem('kick_username') || '';
  });

  // Assets
  const [globalBadges, setGlobalBadges] = useState<BadgeMap>({});
  const [channelBadges, setChannelBadges] = useState<BadgeMap>({});
  const [kickBadges, setKickBadges] = useState<BadgeMap>({});
  const [sevenTVEmotes, setSevenTVEmotes] = useState<EmoteMap>({});

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const twitchRef = useRef<TwitchConnection | null>(null);
  const kickRef = useRef<KickConnection | null>(null);
  const messageQueue = useRef<ChatMessage[]>([]);

  // Init logic
  useEffect(() => {
    // --- POPUP HANDLER (CHILD) ---
    if (window.opener && window.location.hash.includes('access_token')) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        
        if (accessToken) {
            window.opener.postMessage({ type: 'TWITCH_AUTH_SUCCESS', accessToken }, window.location.origin);
            window.close();
        }
        return;
    }

    // --- MAIN APP HANDLER (PARENT) ---
    const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data && event.data.type === 'TWITCH_AUTH_SUCCESS') {
            const { accessToken } = event.data;
            setTwitchCreds(prev => ({ ...prev, accessToken }));
            setIsSettingsOpen(true);
        }
    };
    window.addEventListener('message', handleMessage);

    // Initial Data
    fetchStats();
    fetch7TVEmotes().then(map => setSevenTVEmotes(map));

    const poll = setInterval(fetchStats, 30000);
    const buffer = setInterval(flushBuffer, 300);

    return () => {
        clearInterval(poll);
        clearInterval(buffer);
        window.removeEventListener('message', handleMessage);
    };
  }, []);

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    localStorage.setItem('chat_settings', JSON.stringify(chatSettings));
  }, [chatSettings]);

  useEffect(() => {
    localStorage.setItem('active_player', activePlayer);
  }, [activePlayer]);

  useEffect(() => {
    localStorage.setItem('chat_filter', chatFilter);
  }, [chatFilter]);

  // Sync Auth State & Fetch Data ONLY if creds exist
  useEffect(() => {
    localStorage.setItem('twitch_creds', JSON.stringify(twitchCreds));
    
    const isTwitchReady = !!(twitchCreds.accessToken && twitchCreds.clientId);
    setAuthState(prev => ({ ...prev, twitch: isTwitchReady }));

    if (isTwitchReady) {
        fetchTwitchData();
    }
    // Always fetch stats regardless of auth
    fetchStats();
  }, [twitchCreds]);

  useEffect(() => {
      localStorage.setItem('kick_username', kickUsername);
      setAuthState(prev => ({ 
          ...prev, 
          kick: !!kickUsername, 
          kickUsername: kickUsername 
      }));
  }, [kickUsername]);


  const flushBuffer = () => {
    if (messageQueue.current.length > 0) {
      setMessages(prev => {
        const combined = [...prev, ...messageQueue.current];
        messageQueue.current = [];
        return combined.slice(-MAX_MESSAGES);
      });
    }
  };

  // --- API ---

  const fetchStats = async () => {
    try {
        const response = await fetch(`https://corsproxy.io/?https://kick.com/api/v1/channels/${STREAMER_SLUG}`);
        if (response.ok) {
            const data = await response.json();
            if (data && data.livestream) {
                setStreamStats(prev => ({ ...prev, kickViewers: data.livestream.viewer_count, isLiveKick: true }));
            } else {
                setStreamStats(prev => ({ ...prev, kickViewers: 0, isLiveKick: false }));
            }

            // Fetch Kick Badges (Subscriber images)
            if (data.subscriber_badges) {
                const subBadges: Record<string, string> = {};
                data.subscriber_badges.forEach((b: any) => {
                    subBadges[String(b.months)] = b.badge_image.src;
                });
                setKickBadges(prev => ({ ...prev, 'subscriber': subBadges }));
            }
        }
    } catch (e) { console.warn("Kick stats fail"); }

    if (twitchCreds.accessToken && twitchCreds.clientId) {
        try {
            const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_USER_LOGIN}`, {
                headers: { 'Client-ID': twitchCreds.clientId, 'Authorization': `Bearer ${twitchCreds.accessToken}` }
            });
            const data = await res.json();
            if (data.data && data.data.length > 0) {
                setStreamStats(prev => ({ ...prev, twitchViewers: data.data[0].viewer_count, isLiveTwitch: true }));
            } else {
                 setStreamStats(prev => ({ ...prev, twitchViewers: 0, isLiveTwitch: false }));
            }
        } catch (e) { console.error("Twitch stats fail", e); }
    }
  };

  const fetchTwitchData = async () => {
    if (!twitchCreds.accessToken) return;
    try {
        const headers = { 'Client-ID': twitchCreds.clientId, 'Authorization': `Bearer ${twitchCreds.accessToken}` };
        
        const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${TWITCH_USER_LOGIN}`, { headers });
        const userData = await userRes.json();
        const userId = userData.data?.[0]?.id;

        const myUserRes = await fetch(`https://api.twitch.tv/helix/users`, { headers });
        const myData = await myUserRes.json();
        if (myData.data && myData.data.length > 0) {
            setAuthState(prev => ({ ...prev, twitchUsername: myData.data[0].display_name }));
        }

        if (userId) {
             const cbData = await (await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${userId}`, { headers })).json();
             setChannelBadges(parseBadgeSet(cbData.data));
        }
        const gbData = await (await fetch(`https://api.twitch.tv/helix/chat/badges/global`, { headers })).json();
        setGlobalBadges(parseBadgeSet(gbData.data));

    } catch (e) { console.error("Twitch Data Error", e); }
  };

  const parseBadgeSet = (data: any[]): BadgeMap => {
     const map: BadgeMap = {};
     if (!data) return map;
     data.forEach((set: any) => {
         const versions: Record<string, string> = {};
         set.versions.forEach((v: any) => { versions[v.id] = v.image_url_2x || v.image_url_1x; });
         map[set.set_id] = versions;
     });
     return map;
  };

  // --- HANDLERS ---

  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // If user is near bottom (< 400px), auto-scroll
      if (scrollHeight - scrollTop - clientHeight < 400) {
        chatContainerRef.current.scrollTop = scrollHeight;
      }
    }
  }, [messages]);

  const handleNewMessage = (msg: ChatMessage) => {
    messageQueue.current.push(msg);
  };
  
  const handleDeleteMessage = (msgId: string) => {
      // Direct state update for deletion
      setMessages(prev => prev.map(m => 
          m.id === msgId ? { ...m, isDeleted: true } : m
      ));
  };
  
  const handleReply = (username: string) => {
      setChatInput(prev => `${prev}@${username} `);
  };

  // Twitch Connection Logic
  useEffect(() => {
    if (twitchRef.current) {
        twitchRef.current.disconnect();
        twitchRef.current = null;
        addSystemMsg('Twitch', false);
    }

    twitchRef.current = new TwitchConnection(
        STREAMER_SLUG, 
        handleNewMessage, 
        handleDeleteMessage,
        twitchCreds.accessToken || undefined, 
        authState.twitchUsername || undefined
    );
    twitchRef.current.connect();
    
    const mode = authState.twitch ? 'Autenticado' : 'Anônimo (Leitura)';
    handleNewMessage({
      id: crypto.randomUUID(),
      platform: Platform.SYSTEM,
      user: { username: 'System', badges: [] },
      content: `Conectado à Twitch em modo: ${mode}.`,
      timestamp: Date.now()
    });

    return () => {
        if (twitchRef.current) {
            twitchRef.current.disconnect();
            twitchRef.current = null;
        }
    };
  }, [twitchCreds.accessToken, authState.twitchUsername]);

  // Kick Connection Logic
  useEffect(() => {
    if (!kickRef.current) {
      kickRef.current = new KickConnection(STREAMER_SLUG, handleNewMessage, handleDeleteMessage);
      kickRef.current.connect();
      addSystemMsg('Kick', true);
    }
    
    return () => {
        if (kickRef.current) {
            kickRef.current.disconnect();
            kickRef.current = null;
        }
    };
  }, []);

  const addSystemMsg = (platform: string, connected: boolean) => {
    handleNewMessage({
      id: crypto.randomUUID(),
      platform: Platform.SYSTEM,
      user: { username: 'System', badges: [] },
      content: connected ? `Conectado ao servidor da ${platform}.` : `Desconectado da ${platform}.`,
      timestamp: Date.now()
    });
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    if (commentPlatform === 'twitch') {
        if (!twitchRef.current || !authState.twitch) {
            alert('Você está em modo anônimo. Conecte sua conta da Twitch nas configurações (engrenagem) para enviar mensagens.');
            return;
        }
        twitchRef.current.sendMessage(chatInput);
        
        handleNewMessage({
            id: crypto.randomUUID(),
            platform: Platform.TWITCH,
            user: { username: authState.twitchUsername || 'Eu', badges: [], color: '#a970ff' },
            content: chatInput,
            timestamp: Date.now()
        });
        setChatInput('');
    } 
    else if (commentPlatform === 'kick') {
        alert('O envio de mensagens para a Kick diretamente pelo navegador está bloqueado por segurança (CORS/Cloudflare). Apenas leitura é suportada nesta versão web.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSendMessage();
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeChatVibe(messages);
      setAiAnalysis(result);
      setTimeout(() => setAiAnalysis(null), 20000);
    } catch (e) { console.error(e); } 
    finally { setIsAnalyzing(false); }
  };

  const getParentDomain = () => {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') return '';
      return `&parent=${hostname}`;
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden font-sans bg-black">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentCreds={twitchCreds}
        onSaveTwitch={setTwitchCreds}
        kickUsername={kickUsername}
        onSaveKick={setKickUsername}
        chatSettings={chatSettings}
        onUpdateSettings={setChatSettings}
      />

      <ControlPanel 
        authState={authState} 
        onToggleAuth={() => setIsSettingsOpen(true)}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        streamStats={streamStats}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activePlayer={activePlayer}
        onSetPlayer={setActivePlayer}
        chatFilter={chatFilter}
        onSetChatFilter={setChatFilter}
      />

      {/* Main Layout */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative z-0">
        
        {/* Player Area */}
        <div className={`bg-black relative shrink-0 transition-all duration-500 ease-out-expo overflow-hidden
            ${activePlayer === 'none' 
              ? 'md:w-0 w-full h-0 md:h-auto opacity-0' 
              : 'w-full md:flex-1 aspect-video md:aspect-auto md:h-auto opacity-100'
            }`}
        >
            {activePlayer === 'twitch' && (
              <iframe
                  src={`https://player.twitch.tv/?channel=${STREAMER_SLUG}${getParentDomain()}&muted=false&autoplay=true`}
                  className="w-full h-full border-none"
                  allowFullScreen
                  scrolling="no"
                  allow="autoplay; fullscreen; picture-in-picture"
                  title="Twitch Player"
              ></iframe>
            )}

            {activePlayer === 'kick' && (
                <iframe
                    src={`https://player.kick.com/${STREAMER_SLUG}?autoplay=true&muted=false`}
                    className="w-full h-full border-none"
                    allowFullScreen
                    scrolling="no"
                    allow="autoplay; fullscreen; picture-in-picture"
                    title="Kick Player"
                ></iframe>
            )}

            {activePlayer === 'none' && (
                <div className="w-full h-full bg-black"></div>
            )}
          
          {aiAnalysis && (
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 max-w-2xl w-[90%] liquid-glass-strong p-6 rounded-3xl z-50 animate-slide-in shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5">
                <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🤖</span>
                        <h3 className="font-display font-bold text-lg text-white">Analysis</h3>
                    </div>
                    <button onClick={() => setAiAnalysis(null)} className="text-white/50 hover:text-white transition-colors">✕</button>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">{aiAnalysis}</p>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className={`
            ${activePlayer === 'none' ? 'w-full flex-1' : 'md:w-[380px] xl:w-[420px] w-full'}
            bg-[#000000] border-t md:border-t-0 
            ${activePlayer !== 'none' ? 'md:border-l border-white/5' : ''}
            flex flex-col z-10 transition-all duration-500 ease-out-expo min-h-0 relative
        `}>
          
           {/* Mobile Chat Filter */}
           <div className={`md:hidden flex justify-center py-2 bg-black border-b border-white/5 ${activePlayer !== 'none' ? 'hidden' : ''}`}>
               <div className="flex p-1 bg-white/5 rounded-full border border-white/5">
                   <button onClick={() => setChatFilter('all')} className={`px-4 py-1 rounded-full text-xs ${chatFilter === 'all' ? 'bg-white/20' : 'text-gray-500'}`}>All</button>
                   <button onClick={() => setChatFilter('twitch')} className={`px-4 py-1 rounded-full text-xs ${chatFilter === 'twitch' ? 'bg-twitch/20 text-twitch' : 'text-gray-500'}`}>Twitch</button>
                   <button onClick={() => setChatFilter('kick')} className={`px-4 py-1 rounded-full text-xs ${chatFilter === 'kick' ? 'bg-kick/20 text-kick' : 'text-gray-500'}`}>Kick</button>
               </div>
           </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative px-2 pt-2" ref={chatContainerRef}>
            <div className="min-h-full flex flex-col justify-end pb-2">
                {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/20 space-y-2">
                    <div className="text-2xl animate-pulse">⚡</div>
                    <p className="text-xs font-medium tracking-widest">CONECTANDO...</p>
                </div>
                ) : (
                messages
                    .filter(msg => {
                        // 1. Platform Filter
                        if (chatFilter === 'twitch' && msg.platform !== Platform.TWITCH) return false;
                        if (chatFilter === 'kick' && msg.platform !== Platform.KICK) return false;
                        
                        // 2. Blocked Users
                        if (chatSettings.ignoredUsers.length > 0 && chatSettings.ignoredUsers.includes(msg.user.username.toLowerCase())) return false;
                        
                        // 3. Blocked Keywords
                        if (chatSettings.ignoredKeywords.length > 0) {
                            const contentLower = msg.content.toLowerCase();
                            if (chatSettings.ignoredKeywords.some(kw => contentLower.includes(kw))) return false;
                        }

                        return true;
                    })
                    .map((msg, idx) => (
                    <ChatMessageItem 
                        key={msg.id} 
                        message={msg} 
                        index={idx}
                        globalBadges={globalBadges}
                        channelBadges={channelBadges}
                        kickBadges={kickBadges}
                        sevenTVEmotes={sevenTVEmotes}
                        settings={chatSettings}
                        currentUser={{
                            twitch: authState.twitchUsername,
                            kick: authState.kickUsername
                        }}
                        onReply={handleReply}
                    />
                ))
                )}
            </div>
          </div>

          {/* Input Area */}
          {authState.twitch && (
              <div className="bg-black border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
                 <div className="p-3">
                    <div className={`relative flex items-center bg-white/5 rounded-2xl border transition-all duration-300 ease-out-expo ${commentPlatform === 'twitch' ? 'border-twitch/30 focus-within:border-twitch/80 shadow-[0_0_20px_rgba(145,70,255,0.05)]' : 'border-kick/30 focus-within:border-kick/80 shadow-[0_0_20px_rgba(83,252,24,0.05)]'}`}>
                        {/* Platform Selector */}
                        <div className="pl-1.5 pr-1 py-1">
                            <button 
                                onClick={() => setCommentPlatform(prev => prev === 'twitch' ? 'kick' : 'twitch')}
                                className={`p-2 rounded-xl transition-all duration-300 ${commentPlatform === 'twitch' ? 'bg-twitch/10 text-twitch hover:bg-twitch/20' : 'bg-kick/10 text-kick hover:bg-kick/20'}`}
                            >
                                {commentPlatform === 'twitch' ? <TwitchLogo className="w-4 h-4" /> : <KickLogo className="w-4 h-4" />}
                            </button>
                        </div>

                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enviar mensagem..."
                            className="w-full bg-transparent text-white px-2 py-3 text-sm focus:outline-none placeholder-white/20"
                        />
                        
                        <button 
                            onClick={handleSendMessage}
                            disabled={!chatInput.trim()}
                            className={`p-2 mr-1 rounded-xl transition-all duration-300 ${chatInput.trim() ? (commentPlatform === 'twitch' ? 'text-twitch hover:bg-twitch/10' : 'text-kick hover:bg-kick/10') : 'text-white/20 cursor-not-allowed'}`}
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {commentPlatform === 'kick' && (
                        <div className="text-[10px] text-yellow-500/60 mt-2 px-1 text-center font-medium tracking-wide">
                            Leitura apenas (Modo Espectador)
                        </div>
                    )}
                 </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}