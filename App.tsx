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
  const [authState, setAuthState] = useState<AuthState>({ twitch: false, kick: false });
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
    // Carrega do localStorage na inicialização (Persistência)
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('twitch_creds');
        return saved ? JSON.parse(saved) : { clientId: '', accessToken: '' };
    }
    return { clientId: '', accessToken: '' };
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
    // 1. Player Twitch - Robustez no 'parent'
    // A Twitch exige que o parent seja exato e inclua o domínio onde o site está rodando.
    const hostname = window.location.hostname;
    const parents = new Set(['localhost', '127.0.0.1']);
    
    // Adiciona o hostname atual se não for localhost
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        parents.add(hostname);
    }

    const parentQuery = Array.from(parents).map(p => `parent=${p}`).join('&');
    // Adiciona parent dinâmico para garantir funcionamento em qualquer host
    const url = `https://player.twitch.tv/?channel=${STREAMER_SLUG}&${parentQuery}&muted=false&autoplay=true`;
    setPlayerUrl(url);

    // 2. Load Initial Data
    fetchStats(); // Fetch inicial
    
    // 3. Load 7TV Emotes
    fetch7TVEmotes().then(map => {
        setSevenTVEmotes(map);
    });

    const poll = setInterval(fetchStats, 30000); // Polling a cada 30s
    const buffer = setInterval(flushBuffer, 300);

    return () => {
        clearInterval(poll);
        clearInterval(buffer);
    };
  }, []);

  // Recarregar dados da Twitch sempre que as credenciais mudarem
  useEffect(() => {
    localStorage.setItem('twitch_creds', JSON.stringify(twitchCreds));
    if (twitchCreds.accessToken && twitchCreds.clientId) {
        fetchTwitchData();
        fetchStats(); // Tenta buscar stats imediatamente após salvar
    }
  }, [twitchCreds]);

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
        console.warn("[Kick Stats] Falha ao obter dados (bloqueio de CORS/Cloudflare comum na Kick)");
        // Não reseta para 0 para evitar flicker se já tiver dados antigos
    }

    // Twitch Stats (Somente se autenticado)
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

        // 1. Get User ID
        const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${TWITCH_USER_LOGIN}`, { headers });
        const userData = await userRes.json();
        const userId = userData.data?.[0]?.id;

        if (userId) {
             // 2. Fetch Channel Badges
             const channelBadgesRes = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${userId}`, { headers });
             const cbData = await channelBadgesRes.json();
             setChannelBadges(parseBadgeSet(cbData.data));
        }

        // 3. Fetch Global Badges
        const globalBadgesRes = await fetch(`https://api.twitch.tv/helix/chat/badges/global`, { headers });
        const gbData = await globalBadgesRes.json();
        setGlobalBadges(parseBadgeSet(gbData.data));

    } catch (e) {
        console.error("[Twitch Badges] Erro ao carregar badges reais", e);
    }
  };

  const parseBadgeSet = (data: any[]): BadgeMap => {
     const map: BadgeMap = {};
     if (!data) return map;
     data.forEach((set: any) => {
         const versions: Record<string, string> = {};
         set.versions.forEach((v: any) => {
             versions[v.id] = v.image_url_2x || v.image_url_1x; // Prefer high res
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
    if (authState.twitch && !twitchRef.current) {
      twitchRef.current = new TwitchConnection(STREAMER_SLUG, handleNewMessage);
      twitchRef.current.connect();
      addSystemMsg('Twitch', true);
    } else if (!authState.twitch && twitchRef.current) {
      twitchRef.current.disconnect();
      twitchRef.current = null;
      addSystemMsg('Twitch', false);
    }

    if (authState.kick && !kickRef.current) {
      kickRef.current = new KickConnection(STREAMER_SLUG, handleNewMessage);
      kickRef.current.connect();
      addSystemMsg('Kick', true);
    } else if (!authState.kick && kickRef.current) {
      kickRef.current.disconnect();
      kickRef.current = null;
      addSystemMsg('Kick', false);
    }
  }, [authState]);

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
    setAuthState(prev => ({ ...prev, [platform]: !prev[platform] }));
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
        onSave={setTwitchCreds}
      />

      <ControlPanel 
        authState={authState} 
        onToggleAuth={handleToggleAuth}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        streamStats={streamStats}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 bg-black relative flex flex-col items-center justify-center">
            {playerUrl && (
              <iframe
                  src={playerUrl}
                  className="w-full h-full border-none"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture"
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

        <div className="w-full md:w-[380px] lg:w-[420px] bg-[#09090b] border-l border-glass-border flex flex-col z-10 shadow-2xl">
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
                  <input type="text" placeholder="Chat em modo leitura" disabled className="w-full bg-transparent text-gray-500 px-3 py-2 text-xs focus:outline-none cursor-not-allowed" />
                  <button disabled className="p-2 text-gray-600"><SendIcon className="w-4 h-4" /></button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}