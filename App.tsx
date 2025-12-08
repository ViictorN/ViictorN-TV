import React, { useState, useEffect, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ChatMessageItem } from './components/ChatMessageItem';
import { SettingsModal } from './components/SettingsModal';
import { SendIcon } from './components/Icons';
import { ChatMessage, AuthState, Platform, StreamStats, TwitchCreds, BadgeMap, EmoteMap } from './types';
import { TwitchConnection, KickConnection } from './services/chatConnection';
import { analyzeChatVibe } from './services/geminiService';
import { fetch7TVEmotes } from './services/sevenTVService';

const MAX_MESSAGES = 500;
const STREAMER_SLUG = 'gabepeixe';
const TWITCH_USER_LOGIN = 'gabepeixe';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Auth state now tracks connection status
  const [authState, setAuthState] = useState<AuthState>({ 
    twitch: false, 
    kick: false,
    twitchUsername: '',
    kickUsername: ''
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [playerUrl, setPlayerUrl] = useState<string>('');
  
  // Real Stats & API State
  const [streamStats, setStreamStats] = useState<StreamStats>({ 
    kickViewers: null, 
    twitchViewers: null,
    isLiveKick: false, 
    isLiveTwitch: false 
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [twitchCreds, setTwitchCreds] = useState<TwitchCreds>(() => {
    // Persistência
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('twitch_creds');
        return saved ? JSON.parse(saved) : { clientId: '', accessToken: '' };
    }
    return { clientId: '', accessToken: '' };
  });
  
  const [kickUsername, setKickUsername] = useState(() => {
     return localStorage.getItem('kick_username') || '';
  });

  // Asset storage
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
    // If this window is a popup opened by the main app and has a hash (OAuth return)
    if (window.opener && window.location.hash.includes('access_token')) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        
        if (accessToken) {
            // Send token back to main window
            window.opener.postMessage({ type: 'TWITCH_AUTH_SUCCESS', accessToken }, window.location.origin);
            window.close(); // Close this popup
        }
        return; // Stop rendering the full app in the popup
    }

    // --- MAIN APP HANDLER (PARENT) ---
    const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data && event.data.type === 'TWITCH_AUTH_SUCCESS') {
            const { accessToken } = event.data;
            setTwitchCreds(prev => ({ ...prev, accessToken }));
            setIsSettingsOpen(true); // Re-open settings to show success state
        }
    };
    window.addEventListener('message', handleMessage);

    // 1. Player Twitch - Robustez no 'parent'
    const hostname = window.location.hostname;
    const parents = new Set(['localhost', '127.0.0.1']);
    
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        parents.add(hostname);
    }

    const parentQuery = Array.from(parents).map(p => `parent=${p}`).join('&');
    const url = `https://player.twitch.tv/?channel=${STREAMER_SLUG}&${parentQuery}&muted=false&autoplay=true`;
    setPlayerUrl(url);

    // 2. Load Initial Data
    fetchStats();
    
    // 3. Load 7TV Emotes
    fetch7TVEmotes().then(map => {
        setSevenTVEmotes(map);
    });

    const poll = setInterval(fetchStats, 30000);
    const buffer = setInterval(flushBuffer, 300);

    return () => {
        clearInterval(poll);
        clearInterval(buffer);
        window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Update Auth State based on Creds
  useEffect(() => {
    localStorage.setItem('twitch_creds', JSON.stringify(twitchCreds));
    
    const isTwitchReady = !!(twitchCreds.accessToken && twitchCreds.clientId);
    setAuthState(prev => ({ ...prev, twitch: isTwitchReady }));

    if (isTwitchReady) {
        fetchTwitchData();
        fetchStats();
    }
  }, [twitchCreds]);

  // Update Kick Auth State
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

  // --- API FETCHING ---

  const fetchStats = async () => {
    // Kick Stats
    try {
        const response = await fetch(`https://corsproxy.io/?https://kick.com/api/v1/channels/${STREAMER_SLUG}`);
        if (response.ok) {
            const data = await response.json();
            if (data && data.livestream) {
                setStreamStats(prev => ({
                    ...prev,
                    kickViewers: data.livestream.viewer_count,
                    isLiveKick: true
                }));
            } else {
                setStreamStats(prev => ({ ...prev, kickViewers: 0, isLiveKick: false }));
            }
        }
    } catch (e) {
        console.warn("[Kick Stats] Falha ao obter dados");
    }

    // Twitch Stats
    if (twitchCreds.accessToken && twitchCreds.clientId) {
        try {
            const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_USER_LOGIN}`, {
                headers: {
                    'Client-ID': twitchCreds.clientId,
                    'Authorization': `Bearer ${twitchCreds.accessToken}`
                }
            });
            
            if (res.status === 401) {
                console.error("Twitch Token Inválido");
                return;
            }

            const data = await res.json();
            if (data.data && data.data.length > 0) {
                setStreamStats(prev => ({
                    ...prev,
                    twitchViewers: data.data[0].viewer_count,
                    isLiveTwitch: true
                }));
            } else {
                 setStreamStats(prev => ({ ...prev, twitchViewers: 0, isLiveTwitch: false }));
            }
        } catch (e) {
            console.error("[Twitch Stats] Error", e);
        }
    }
  };

  const fetchTwitchData = async () => {
    if (!twitchCreds.accessToken) return;

    try {
        const headers = {
            'Client-ID': twitchCreds.clientId,
            'Authorization': `Bearer ${twitchCreds.accessToken}`
        };

        // 1. Get User ID (Gabepeixe)
        const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${TWITCH_USER_LOGIN}`, { headers });
        const userData = await userRes.json();
        const userId = userData.data?.[0]?.id;

        // 2. Get My User Info (for AuthState)
        const myUserRes = await fetch(`https://api.twitch.tv/helix/users`, { headers });
        const myData = await myUserRes.json();
        if (myData.data && myData.data.length > 0) {
            setAuthState(prev => ({ ...prev, twitchUsername: myData.data[0].display_name }));
        }

        if (userId) {
             const channelBadgesRes = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${userId}`, { headers });
             const cbData = await channelBadgesRes.json();
             setChannelBadges(parseBadgeSet(cbData.data));
        }

        const globalBadgesRes = await fetch(`https://api.twitch.tv/helix/chat/badges/global`, { headers });
        const gbData = await globalBadgesRes.json();
        setGlobalBadges(parseBadgeSet(gbData.data));

    } catch (e) {
        console.error("[Twitch Badges] Erro ao carregar dados", e);
    }
  };

  const parseBadgeSet = (data: any[]): BadgeMap => {
     const map: BadgeMap = {};
     if (!data) return map;
     data.forEach((set: any) => {
         const versions: Record<string, string> = {};
         set.versions.forEach((v: any) => {
             versions[v.id] = v.image_url_2x || v.image_url_1x;
         });
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

  // Connection management
  useEffect(() => {
    // Twitch Connection
    if (authState.twitch && !twitchRef.current) {
      twitchRef.current = new TwitchConnection(STREAMER_SLUG, handleNewMessage);
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
  }, [authState.twitch, authState.kick]); // Depend on flags specifically

  const addSystemMsg = (platform: string, connected: boolean) => {
    handleNewMessage({
      id: crypto.randomUUID(),
      platform: Platform.SYSTEM,
      user: { username: 'System', badges: [] },
      content: connected ? `Conectado ao servidor da ${platform}.` : `Desconectado da ${platform}.`,
      timestamp: Date.now()
    });
  };

  const handleToggleAuth = (platform: 'twitch' | 'kick') => {
    // Opens settings to login/logout instead of simple toggle
    setIsSettingsOpen(true);
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
        onToggleAuth={handleToggleAuth}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        streamStats={streamStats}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Layout */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative z-20">
        
        {/* Player */}
        <div className="w-full lg:flex-1 h-[35vh] lg:h-auto bg-black relative shrink-0">
            {playerUrl && (
              <iframe
                  src={playerUrl}
                  className="w-full h-full border-none"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; popups; fullscreen"
                  sandbox="allow-modals allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
                  title="Twitch Player"
              ></iframe>
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

        {/* Chat */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex-1 lg:flex-none lg:h-auto bg-[#09090b] border-t lg:border-t-0 lg:border-l border-glass-border flex flex-col z-10 shadow-2xl">
          <div className="flex-1 overflow-y-auto custom-scrollbar relative px-1 pt-2" ref={chatContainerRef}>
            <div className="min-h-full flex flex-col justify-end pb-2">
                {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50 space-y-2">
                    <div className="text-2xl animate-pulse">⚡</div>
                    <p className="text-xs font-mono">AGUARDANDO CONEXÃO</p>
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

          <div className="p-3 bg-[#09090b] border-t border-glass-border">
             <div className="relative flex items-center bg-[#121214] rounded border border-glass-border opacity-70">
                  <input type="text" placeholder="Chat em modo leitura (Login via backend em breve)" disabled className="w-full bg-transparent text-gray-500 px-3 py-2 text-xs focus:outline-none cursor-not-allowed" />
                  <button disabled className="p-2 text-gray-600"><SendIcon className="w-4 h-4" /></button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}