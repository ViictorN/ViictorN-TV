import React, { useState, useEffect, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ChatMessageItem } from './components/ChatMessageItem';
import { SettingsModal } from './components/SettingsModal';
import { SendIcon, TwitchLogo, KickLogo, ViictorNLogo } from './components/Icons';
import { ChatMessage, AuthState, Platform, StreamStats, TwitchCreds, BadgeMap, EmoteMap } from './types';
import { TwitchConnection, KickConnection } from './services/chatConnection';
import { analyzeChatVibe } from './services/geminiService';
import { fetch7TVEmotes } from './services/sevenTVService';

const MAX_MESSAGES = 500;
const STREAMER_SLUG = 'gabepeixe';
const TWITCH_USER_LOGIN = 'gabepeixe';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Auth state
  const [authState, setAuthState] = useState<AuthState>({ 
    twitch: false, 
    kick: false,
    twitchUsername: '',
    kickUsername: ''
  });

  // UI State
  const [activePlayer, setActivePlayer] = useState<'twitch' | 'kick' | 'none'>('twitch');
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

  // Sync Auth State
  useEffect(() => {
    localStorage.setItem('twitch_creds', JSON.stringify(twitchCreds));
    
    const isTwitchReady = !!(twitchCreds.accessToken && twitchCreds.clientId);
    setAuthState(prev => ({ ...prev, twitch: isTwitchReady }));

    if (isTwitchReady) {
        fetchTwitchData();
        fetchStats();
    }
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
      if (scrollHeight - scrollTop - clientHeight < 400) {
        chatContainerRef.current.scrollTop = scrollHeight;
      }
    }
  }, [messages]);

  const handleNewMessage = (msg: ChatMessage) => {
    messageQueue.current.push(msg);
  };

  useEffect(() => {
    // Twitch Connection
    if (authState.twitch && !twitchRef.current) {
      twitchRef.current = new TwitchConnection(STREAMER_SLUG, handleNewMessage, twitchCreds.accessToken, authState.twitchUsername);
      twitchRef.current.connect();
      addSystemMsg('Twitch', true);
    } else if (!authState.twitch && twitchRef.current) {
      twitchRef.current.disconnect();
      twitchRef.current = null;
      addSystemMsg('Twitch', false);
    }

    // Kick Connection
    if (authState.kick && !kickRef.current) {
      kickRef.current = new KickConnection(STREAMER_SLUG, handleNewMessage);
      kickRef.current.connect();
      addSystemMsg('Kick', true);
    } else if (!authState.kick && kickRef.current) {
      kickRef.current.disconnect();
      kickRef.current = null;
      addSystemMsg('Kick', false);
    }
  }, [authState.twitch, authState.kick]);

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
            alert('Você precisa conectar sua conta da Twitch para enviar mensagens.');
            return;
        }
        // Send via WebSocket
        twitchRef.current.sendMessage(chatInput);
        
        // Optimistic UI Update (IRC doesn't always echo fast enough)
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
        // Kick does not support sending messages via frontend-only WebSocket without auth cookies
        // which are HttpOnly and protected by Cloudflare. 
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

  // Helper for Iframe Parents
  const getParentDomain = () => {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') return '';
      return `&parent=${hostname}`;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-dark text-white font-sans">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentCreds={twitchCreds}
        onSaveTwitch={setTwitchCreds}
        kickUsername={kickUsername}
        onSaveKick={setKickUsername}
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
      />

      {/* Main Layout */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative z-20">
        
        {/* Player Area */}
        <div className={`w-full lg:flex-1 bg-black relative shrink-0 transition-all duration-300 ${activePlayer === 'none' ? 'hidden lg:block lg:flex-[0.01] lg:opacity-0' : 'h-[35vh] lg:h-auto'}`}>
            
            {activePlayer === 'twitch' && (
              <iframe
                  src={`https://player.twitch.tv/?channel=${STREAMER_SLUG}${getParentDomain()}&muted=false&autoplay=true`}
                  className="w-full h-full border-none"
                  allowFullScreen
                  title="Twitch Player"
              ></iframe>
            )}

            {activePlayer === 'kick' && (
                <iframe
                    src={`https://player.kick.com/${STREAMER_SLUG}?autoplay=true&muted=false`}
                    className="w-full h-full border-none"
                    allowFullScreen
                    title="Kick Player"
                ></iframe>
            )}

            {activePlayer === 'none' && (
                <div className="w-full h-full flex items-center justify-center bg-[#050505]">
                    <ViictorNLogo className="w-20 h-20 opacity-10 grayscale" />
                </div>
            )}
          
          {aiAnalysis && (
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 max-w-2xl w-[90%] bg-dark/90 backdrop-blur-xl border border-glass-border p-6 rounded-2xl shadow-2xl z-50 animate-slide-in">
                <div className="flex justify-between items-start mb-3 border-b border-glass-border pb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🤖</span>
                        <h3 className="font-display font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Analysis</h3>
                    </div>
                    <button onClick={() => setAiAnalysis(null)} className="text-gray-500 hover:text-white">✕</button>
                </div>
                <p className="text-gray-300 text-sm">{aiAnalysis}</p>
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className={`w-full ${activePlayer === 'none' ? 'lg:w-full' : 'lg:w-[380px] xl:w-[420px]'} flex-1 lg:flex-none lg:h-auto bg-[#09090b] border-t lg:border-t-0 lg:border-l border-glass-border flex flex-col z-10 shadow-2xl transition-all duration-300`}>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative px-1 pt-2" ref={chatContainerRef}>
            <div className="min-h-full flex flex-col justify-end pb-2">
                {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50 space-y-2">
                    <div className="text-2xl animate-pulse">⚡</div>
                    <p className="text-xs font-mono">CONECTANDO...</p>
                </div>
                ) : (
                messages.map((msg) => (
                    <ChatMessageItem 
                        key={msg.id} 
                        message={msg} 
                        globalBadges={globalBadges}
                        channelBadges={channelBadges}
                        sevenTVEmotes={sevenTVEmotes}
                    />
                ))
                )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 bg-[#09090b] border-t border-glass-border">
             <div className={`relative flex items-center bg-[#121214] rounded-lg border transition-all duration-300 ${commentPlatform === 'twitch' ? 'border-twitch/40 focus-within:border-twitch shadow-[0_0_10px_rgba(145,70,255,0.05)]' : 'border-kick/40 focus-within:border-kick shadow-[0_0_10px_rgba(83,252,24,0.05)]'}`}>
                  
                  {/* Platform Selector */}
                  <div className="pl-1.5 pr-1 py-1">
                      <button 
                        onClick={() => setCommentPlatform(prev => prev === 'twitch' ? 'kick' : 'twitch')}
                        className={`p-1.5 rounded-md transition-colors ${commentPlatform === 'twitch' ? 'bg-twitch/10 text-twitch hover:bg-twitch/20' : 'bg-kick/10 text-kick hover:bg-kick/20'}`}
                        title={`Enviar como: ${commentPlatform === 'twitch' ? 'Twitch' : 'Kick'}`}
                      >
                          {commentPlatform === 'twitch' ? <TwitchLogo className="w-4 h-4" /> : <KickLogo className="w-4 h-4" />}
                      </button>
                  </div>

                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Enviar mensagem na ${commentPlatform === 'twitch' ? 'Twitch' : 'Kick'}...`}
                    className="w-full bg-transparent text-gray-200 px-2 py-3 text-sm focus:outline-none placeholder-gray-600" 
                  />
                  
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className={`p-2 mr-1 rounded-md transition-all ${chatInput.trim() ? (commentPlatform === 'twitch' ? 'text-twitch hover:bg-twitch/10' : 'text-kick hover:bg-kick/10') : 'text-gray-600 cursor-not-allowed'}`}
                  >
                      <SendIcon className="w-5 h-5" />
                  </button>
             </div>
             
             {/* Info/Warning footer */}
             {commentPlatform === 'kick' && (
                 <div className="text-[10px] text-yellow-500/80 mt-1.5 px-1 text-center font-mono">
                     ⚠️ Envio para Kick limitado via web
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}