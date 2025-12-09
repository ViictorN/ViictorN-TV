import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ChatMessageItem } from './components/ChatMessageItem';
import { SettingsModal } from './components/SettingsModal';
import { OfflineScreen } from './components/OfflineScreen';
import { UserCard } from './components/UserCard';
import { SendIcon, PlatformIcon } from './components/Icons';
import { ChatMessage, AuthState, Platform, StreamStats, TwitchCreds, BadgeMap, EmoteMap, ChatSettings, User } from './types';
import { TwitchConnection, KickConnection } from './services/chatConnection';
import { analyzeChatVibe } from './services/geminiService';
import { fetch7TVEmotes } from './services/sevenTVService';

const MAX_MESSAGES = 500;
const STREAMER_SLUG = 'gabepeixe';
const TWITCH_USER_LOGIN = 'gabepeixe';

// Default Settings
const DEFAULT_SETTINGS: ChatSettings = {
    showTimestamps: false,
    hideAvatars: true, // Changed to true by default per user request
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
    ignoredKeywords: [],
    
    // New Defaults
    smoothScroll: true,
    pauseOnHover: false,
    cinemaMode: false,
    performanceMode: false, // Default: keep 500 msgs visible
    showBadgeBroadcaster: true,
    showBadgeMod: true,
    showBadgeVip: true,
    showBadgeSub: true,
    showBadgeFounder: true
};

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Auth state
  const [authState, setAuthState] = useState<AuthState>({ 
    twitch: false, 
    kick: false,
    twitchUsername: '',
    kickUsername: '',
    kickAccessToken: ''
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
  
  // User Card Selection
  const [selectedUser, setSelectedUser] = useState<{user: User, platform: Platform} | null>(null);
  
  // Player Refresh Key (for Sync)
  const [playerKey, setPlayerKey] = useState(0);

  const [commentPlatform, setCommentPlatform] = useState<'twitch' | 'kick'>('twitch');
  const [chatInput, setChatInput] = useState('');
  
  // Chat History (Arrow Keys)
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Scroll / Pause State
  const [isPaused, setIsPaused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Stats / Offline Logic - Initialize as null to prevent premature offline screen
  const [streamStats, setStreamStats] = useState<StreamStats>({ 
    kickViewers: null, 
    twitchViewers: null,
    isLiveKick: null, 
    isLiveTwitch: null 
  });
  
  // Force play bypass for offline screen
  const [forcePlay, setForcePlay] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
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

  const [kickAccessToken, setKickAccessToken] = useState(() => {
     return localStorage.getItem('kick_access_token') || '';
  });

  // Assets
  const [globalBadges, setGlobalBadges] = useState<BadgeMap>({});
  const [channelBadges, setChannelBadges] = useState<BadgeMap>({});
  const [kickBadges, setKickBadges] = useState<BadgeMap>({});
  const [sevenTVEmotes, setSevenTVEmotes] = useState<EmoteMap>({});
  
  // Avatar Cache
  const [avatarCache, setAvatarCache] = useState<Record<string, string>>({});
  const pendingAvatars = useRef<Set<string>>(new Set());

  // Session Tracking for First Interactions (Persisted in LOCALSTORAGE to survive refreshes/close)
  const seenUsers = useRef<Set<string>>(new Set());

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const twitchRef = useRef<TwitchConnection | null>(null);
  const kickRef = useRef<KickConnection | null>(null);
  const messageQueue = useRef<ChatMessage[]>([]);
  
  // Init logic
  useEffect(() => {
    // Initialize Seen Users from LOCAL STORAGE
    try {
        const saved = localStorage.getItem('seen_users');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                parsed.forEach(u => seenUsers.current.add(u));
            }
        }
    } catch(e) {}

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
            handleSaveTwitchCreds({ ...twitchCreds, accessToken }); // Use secure save
            setIsSettingsOpen(true);
        }
    };
    window.addEventListener('message', handleMessage);

    // Initial Data
    fetchStats();
    fetch7TVEmotes().then(map => setSevenTVEmotes(map));
    
    // Always try to load Public badges first (fastest)
    fetchTwitchBadgesNoAuth(); 

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

  // Sync Auth State & Fetch Authenticated Data
  useEffect(() => {
    // Although we save explicitly, this effect ensures sync if state changes from elsewhere
    localStorage.setItem('twitch_creds', JSON.stringify(twitchCreds));
    
    const isTwitchReady = !!(twitchCreds.accessToken && twitchCreds.clientId);
    setAuthState(prev => ({ ...prev, twitch: isTwitchReady }));

    // If we have credentials, use the Official API to overwrite/improve badges
    if (isTwitchReady) {
        fetchTwitchDataAuthenticated();
    }
  }, [twitchCreds]);

  useEffect(() => {
      // Although we save explicitly, this effect ensures sync
      localStorage.setItem('kick_username', kickUsername);
      localStorage.setItem('kick_access_token', kickAccessToken);

      setAuthState(prev => ({ 
          ...prev, 
          kick: !!kickUsername, 
          kickUsername: kickUsername,
          kickAccessToken: kickAccessToken
      }));
  }, [kickUsername, kickAccessToken]);


  // --- EXPLICIT SAVE HANDLERS (Passed to SettingsModal) ---
  const handleSaveTwitchCreds = (creds: TwitchCreds) => {
      setTwitchCreds(creds);
      localStorage.setItem('twitch_creds', JSON.stringify(creds));
  };

  const handleSaveKickCreds = (username: string, token: string) => {
      setKickUsername(username);
      setKickAccessToken(token);
      localStorage.setItem('kick_username', username);
      localStorage.setItem('kick_access_token', token);
  };


  const flushBuffer = () => {
    if (messageQueue.current.length > 0) {
      setMessages(prev => {
        const newMsgs = [...prev, ...messageQueue.current].slice(-MAX_MESSAGES);
        
        // Handle Unread Count if Paused
        if (isPaused) {
            setUnreadCount(c => c + messageQueue.current.length);
        }

        messageQueue.current = [];
        return newMsgs;
      });
    }
  };

  // --- AVATAR FETCH SERVICE ---
  const requestAvatar = useCallback(async (platform: Platform, user: User) => {
      const key = `${platform}-${user.username}`;
      
      // Prevent redundant fetches
      if (avatarCache[key] || pendingAvatars.current.has(key)) return;
      // If user object already has a valid URL, skip
      if (user.avatarUrl && !user.avatarUrl.includes('null')) return;

      pendingAvatars.current.add(key);

      try {
          let url: string | null = null;
          
          // --- KICK AVATAR STRATEGY ---
          if (platform === Platform.KICK && user.id) {
               // Strategy 1: 7TV API (Preferred - Bypass CORS)
               // The direct Kick CDN often fails due to CORS or requires headers we can't send
               try {
                   const res = await fetch(`https://7tv.io/v3/users/kick/${user.id}`);
                   if (res.ok) {
                       const data = await res.json();
                       if (data.user?.avatar_url) {
                           url = data.user.avatar_url.startsWith('//') 
                             ? `https:${data.user.avatar_url}` 
                             : data.user.avatar_url;
                       }
                   }
               } catch (e) {}

               // Strategy 2: Direct Kick CDN (Fallback)
               // Only use this if 7TV failed.
               if (!url) {
                   url = `https://files.kick.com/images/user_profile_pics/${user.id}/image.webp`;
               }
          }

          // --- TWITCH AVATAR STRATEGY ---
          else if (platform === Platform.TWITCH) {
              // 1. 7TV (Cross-check)
              if (user.id) {
                  try {
                      const res = await fetch(`https://7tv.io/v3/users/twitch/${user.id}`);
                      if (res.ok) {
                          const data = await res.json();
                          if (data.user?.avatar_url) {
                               url = data.user.avatar_url.startsWith('//') 
                                 ? `https:${data.user.avatar_url}` 
                                 : data.user.avatar_url;
                          }
                      }
                  } catch (e) {}
              }

              // 2. IVR API (Username based, reliable public API)
              if (!url) {
                  try {
                    const res = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${user.username}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data[0] && data[0].logo) url = data[0].logo;
                    }
                  } catch(e) {}
              }
          }

          if (url) {
              setAvatarCache(prev => ({ ...prev, [key]: url! }));
          }
      } catch (e) {
          // Silent fail
      } finally {
          pendingAvatars.current.delete(key);
      }
  }, [avatarCache]);

  // --- SCROLL HANDLER (Chat Freeze) ---
  const handleScroll = () => {
      if (!chatContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // If user scrolls up more than 50px, pause chat
      if (distanceFromBottom > 50) {
          if (!isPaused) setIsPaused(true);
      } else {
          // If user is at bottom, resume
          if (isPaused) {
              setIsPaused(false);
              setUnreadCount(0);
          }
      }
  };

  // Auto-scroll Effect
  useEffect(() => {
    if (chatContainerRef.current && !isPaused) {
        const { scrollHeight, clientHeight } = chatContainerRef.current;
        chatContainerRef.current.scrollTo({
            top: scrollHeight - clientHeight,
            behavior: chatSettings.smoothScroll ? 'smooth' : 'auto'
        });
    }
  }, [messages, isPaused, chatSettings.smoothScroll]);

  const scrollToBottom = () => {
      if (chatContainerRef.current) {
          const { scrollHeight, clientHeight } = chatContainerRef.current;
          chatContainerRef.current.scrollTop = scrollHeight - clientHeight;
          setIsPaused(false);
          setUnreadCount(0);
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
    } catch (e) { 
        // If fetch fails (mobile CORS?), don't force false, keep previous state or assume unknown if it was null
        // However, to fix "false offline", if we fail we might just not update status or set to null
        console.warn("Kick stats fail", e); 
    }

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

  // --- AUTHENTICATED TWITCH DATA FETCH (Official API) ---
  const fetchTwitchDataAuthenticated = async () => {
    if (!twitchCreds.accessToken) return;
    try {
        const headers = { 'Client-ID': twitchCreds.clientId, 'Authorization': `Bearer ${twitchCreds.accessToken}` };
        
        // 1. Get Logged In User
        const myUserRes = await fetch(`https://api.twitch.tv/helix/users`, { headers });
        const myData = await myUserRes.json();
        if (myData.data && myData.data.length > 0) {
            setAuthState(prev => ({ ...prev, twitchUsername: myData.data[0].display_name }));
        }

        // 2. Get Broadcaster ID (Gabepeixe) for Channel Badges
        // IMPORTANT: We need Gabepeixe's ID to get HIS badges, not the logged in user's badges
        const streamerRes = await fetch(`https://api.twitch.tv/helix/users?login=${TWITCH_USER_LOGIN}`, { headers });
        const streamerData = await streamerRes.json();
        const streamerId = streamerData.data?.[0]?.id;

        // 3. Fetch Channel Badges (Official Helix)
        if (streamerId) {
             const cbRes = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${streamerId}`, { headers });
             const cbData = await cbRes.json();
             if (cbData.data) {
                setChannelBadges(parseHelixBadges(cbData.data));
             }
        }

        // 4. Fetch Global Badges (Official Helix)
        const gbRes = await fetch(`https://api.twitch.tv/helix/chat/badges/global`, { headers });
        const gbData = await gbRes.json();
        if (gbData.data) {
            setGlobalBadges(parseHelixBadges(gbData.data));
        }

    } catch (e) { console.error("Twitch Authenticated Data Error", e); }
  };

  const parseHelixBadges = (data: any[]): BadgeMap => {
     const map: BadgeMap = {};
     if (!data) return map;
     data.forEach((set: any) => {
         const versions: Record<string, string> = {};
         set.versions.forEach((v: any) => { versions[v.id] = v.image_url_2x || v.image_url_1x; });
         map[set.set_id] = versions;
     });
     return map;
  };

  // --- PUBLIC TWITCH DATA FETCH (IVR Fallback) ---
  const fetchTwitchBadgesNoAuth = async () => {
      try {
          // Using CORS Proxy to avoid direct fetch issues with IVR
          const proxy = 'https://corsproxy.io/?';

          // 1. Global Badges
          const globalRes = await fetch(`${proxy}${encodeURIComponent('https://api.ivr.fi/v2/twitch/badges/global')}`);
          if (globalRes.ok) {
              const data = await globalRes.json();
              setGlobalBadges(prev => Object.keys(prev).length === 0 ? parseIvrBadges(data) : prev);
          }

          // 2. Channel Badges (Gabepeixe)
          const channelRes = await fetch(`${proxy}${encodeURIComponent(`https://api.ivr.fi/v2/twitch/badges/channel/${TWITCH_USER_LOGIN}`)}`);
           if (channelRes.ok) {
              const data = await channelRes.json();
              setChannelBadges(prev => Object.keys(prev).length === 0 ? parseIvrBadges(data) : prev);
          }
      } catch (e) {
          // Suppress error to avoid console noise for users, as this is a fallback
      }
  };

  const parseIvrBadges = (data: any[]): BadgeMap => {
      const map: BadgeMap = {};
      if (!data) return map;
      data.forEach((set: any) => {
          const versions: Record<string, string> = {};
          set.versions.forEach((v: any) => {
              // IVR returns 'image_url_2x' or 'image_url_1x'
              versions[v.id] = v.image_url_2x || v.image_url_1x; 
          });
          map[set.set_id] = versions;
      });
      return map;
  };

  // --- HANDLERS ---

  const handleNewMessage = (msg: ChatMessage) => {
    // Logic for "First Message" Tracking (PERSISTED via localStorage)
    // Create a unique key for the user per platform (LOWERCASE to ensure consistency)
    const userKey = `${msg.platform}-${msg.user.username.toLowerCase()}`;
    
    // If not seen in HISTORY (across sessions)
    if (!seenUsers.current.has(userKey)) {
        // If Twitch sends the flag, respect it. 
        // If Kick (or flag missing), assume session-first is "First Interaction"
        if (msg.platform === Platform.KICK || msg.isFirstMessage === undefined) {
             msg.isFirstMessage = true;
        }
        seenUsers.current.add(userKey);
        
        // Update LOCALSTORAGE
        try {
            localStorage.setItem('seen_users', JSON.stringify(Array.from(seenUsers.current)));
        } catch(e) {}

    } else {
        // If seen, ensure flag is false (unless platform insists otherwise, but usually sequential)
        // Twitch might send isFirstMessage=true only once, so we don't overwrite if true
        if (!msg.isFirstMessage) msg.isFirstMessage = false;
    }

    messageQueue.current.push(msg);
  };
  
  const handleDeleteMessage = (msgId: string) => {
      setMessages(prev => prev.map(m => 
          m.id === msgId ? { ...m, isDeleted: true } : m
      ));
  };
  
  const handleReply = (username: string) => {
      // Append if input exists, otherwise set
      setChatInput(prev => {
          if (prev.endsWith(' ')) return `${prev}@${username} `;
          if (prev.length > 0) return `${prev} @${username} `;
          return `@${username} `;
      });
  };

  const handleUserClick = (user: User, platform: Platform) => {
      setSelectedUser({ user, platform });
  };

  const handleSyncPlayer = () => {
    setPlayerKey(prev => prev + 1);
  };

  const toggleCinemaMode = () => {
      setChatSettings(prev => ({ ...prev, cinemaMode: !prev.cinemaMode }));
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
      // Re-initialize if token changes
      kickRef.current = new KickConnection(STREAMER_SLUG, handleNewMessage, handleDeleteMessage, kickAccessToken);
      kickRef.current.connect();
      addSystemMsg('Kick', true);
    } else {
         kickRef.current.disconnect();
         kickRef.current = new KickConnection(STREAMER_SLUG, handleNewMessage, handleDeleteMessage, kickAccessToken);
         kickRef.current.connect();
    }
    
    return () => {
        if (kickRef.current) {
            kickRef.current.disconnect();
            kickRef.current = null;
        }
    };
  }, [kickAccessToken]);

  const addSystemMsg = (platform: string, connected: boolean) => {
    handleNewMessage({
      id: crypto.randomUUID(),
      platform: Platform.SYSTEM,
      user: { username: 'System', badges: [] },
      content: connected ? `Conectado ao servidor da ${platform}.` : `Desconectado da ${platform}.`,
      timestamp: Date.now()
    });
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    // Add to History
    setInputHistory(prev => [chatInput, ...prev.filter(i => i !== chatInput)].slice(0, 50));
    setHistoryIndex(-1);

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
        if (!kickAccessToken) {
            alert('Para enviar mensagens na Kick, você precisa de um Access Token. Vá em Configurações > Kick > Access Token.');
            return;
        }

        if (!kickRef.current) return;

        try {
            await kickRef.current.sendMessage(chatInput);
             
            // Optimistic UI Update
            handleNewMessage({
                id: crypto.randomUUID(),
                platform: Platform.KICK,
                user: { 
                    username: authState.kickUsername || 'Eu', 
                    badges: [], 
                    color: '#53FC18' 
                },
                content: chatInput,
                timestamp: Date.now()
            });
            setChatInput('');

        } catch (error: any) {
            alert(`Falha ao enviar para Kick: ${error.message}\n\nNota: A API da Kick pode bloquear envios diretos do navegador (CORS).`);
        }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleSendMessage();
      }
      
      // Input History Logic
      if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (historyIndex < inputHistory.length - 1) {
              const newIndex = historyIndex + 1;
              setHistoryIndex(newIndex);
              setChatInput(inputHistory[newIndex]);
          }
      }
      if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex > 0) {
              const newIndex = historyIndex - 1;
              setHistoryIndex(newIndex);
              setChatInput(inputHistory[newIndex]);
          } else if (historyIndex === 0) {
              setHistoryIndex(-1);
              setChatInput('');
          }
      }
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

  // Robust parent detection for Twitch Embeds in Brave/Modern Browsers
  const getParentDomain = () => {
      const currentHost = window.location.hostname;
      // Use Set to avoid duplicates
      const parents = new Set<string>();
      
      if (currentHost) parents.add(currentHost);
      
      // Fallback domains for dev environments where hostname might differ internally
      // or to ensure localhost works
      if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
          parents.add('localhost'); 
      }
      
      return Array.from(parents).map(domain => `&parent=${domain}`).join('');
  };

  const saveKickSettings = (username: string, token: string) => {
      handleSaveKickCreds(username, token); // Use secure save
  };

  // Detect Offline Status
  // STRICT CHECK: Only show offline if explicitly false. If null (checking) or undefined, show nothing/loading.
  const isGlobalOffline = streamStats.isLiveTwitch === false && streamStats.isLiveKick === false;
  const showOfflineScreen = isGlobalOffline && activePlayer !== 'none' && !forcePlay;

  // Filter messages based on Performance Mode
  // If performance mode is ON, show only last 100 messages in the DOM.
  // Otherwise show MAX_MESSAGES (500).
  const visibleMessages = chatSettings.performanceMode 
      ? messages.slice(-100) 
      : messages;

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden font-sans bg-black relative">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        currentCreds={twitchCreds}
        onSaveTwitch={handleSaveTwitchCreds}
        kickUsername={kickUsername}
        kickAccessToken={kickAccessToken}
        onSaveKick={saveKickSettings}
        chatSettings={chatSettings}
        onUpdateSettings={setChatSettings}
      />

      {/* FLOATING BUTTON: Exit Cinema Mode */}
      {chatSettings.cinemaMode && (
         <button 
           onClick={toggleCinemaMode}
           className="fixed top-4 right-4 z-[999] bg-black/60 hover:bg-black/90 text-white/70 hover:text-white p-3 rounded-full backdrop-blur-md transition-all border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 group animate-fade-in"
           title="Sair do Modo Cinema (Mostrar Cabeçalho)"
         >
           <div className="group-hover:rotate-180 transition-transform duration-500">
             <span className="text-xl leading-none block">✕</span>
           </div>
         </button>
      )}

      {/* USER CARD POPUP */}
      {selectedUser && (
        <UserCard 
            user={selectedUser.user}
            platform={selectedUser.platform}
            messages={messages}
            onClose={() => setSelectedUser(null)}
            twitchCreds={twitchCreds}
        />
      )}

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
        onSync={handleSyncPlayer}
        cinemaMode={chatSettings.cinemaMode}
        onToggleCinema={toggleCinemaMode}
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
            {/* OFFLINE SCREEN LAYER */}
            {showOfflineScreen ? (
                 <OfflineScreen 
                    twitchCreds={twitchCreds}
                    streamerSlug={STREAMER_SLUG}
                    onForcePlay={() => setForcePlay(true)}
                 />
            ) : (
                <>
                    {activePlayer === 'twitch' && (
                    <div className="relative w-full h-full group">
                        <iframe
                            key={`twitch-${playerKey}`}
                            src={`https://player.twitch.tv/?channel=${STREAMER_SLUG}${getParentDomain()}&muted=true&autoplay=true`}
                            className="w-full h-full border-none"
                            allowFullScreen
                            scrolling="no"
                            referrerPolicy="origin-when-cross-origin"
                            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write"
                            title="Twitch Player"
                        ></iframe>
                        
                        {/* Fallback / External Link Button */}
                        <a 
                            href={`https://www.twitch.tv/${STREAMER_SLUG}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 hover:bg-twitch text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 backdrop-blur-md flex items-center gap-2"
                        >
                            <span>Assistir na Twitch ↗</span>
                        </a>

                        {/* Brave Warning Tooltip */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            <div className="bg-black/90 backdrop-blur-md text-white text-[10px] p-3 rounded-xl border border-white/10 max-w-[220px] shadow-xl">
                                <p className="mb-1 font-bold text-orange-400 flex items-center gap-1">
                                    <span>⚠️</span> Problemas com Play?
                                </p>
                                <p className="text-gray-300 leading-relaxed">
                                    Se o player não iniciar:<br/>
                                    1. Desative o <strong className="text-white">Brave Shields</strong> (Leão)<br/>
                                    2. Ou clique em "Assistir na Twitch"
                                </p>
                            </div>
                        </div>
                    </div>
                    )}

                    {activePlayer === 'kick' && (
                        <iframe
                            key={`kick-${playerKey}`}
                            src={`https://player.kick.com/${STREAMER_SLUG}?autoplay=true&muted=false`}
                            className="w-full h-full border-none"
                            allowFullScreen
                            scrolling="no"
                            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
                            title="Kick Player"
                        ></iframe>
                    )}

                    {activePlayer === 'none' && (
                        <div className="w-full h-full bg-black"></div>
                    )}
                </>
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
          <div 
            className="flex-1 overflow-y-auto custom-scrollbar relative px-2 pt-2 scroll-smooth" 
            ref={chatContainerRef}
            onScroll={handleScroll}
            >
            <div className="min-h-full flex flex-col justify-end pb-2">
                {visibleMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/20 space-y-2">
                    <div className="text-2xl animate-pulse">⚡</div>
                    <p className="text-xs font-medium tracking-widest">CONECTANDO...</p>
                </div>
                ) : (
                visibleMessages
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
                        onUserClick={handleUserClick}
                        avatarCache={avatarCache}
                        onRequestAvatar={requestAvatar}
                    />
                ))
                )}
            </div>
          </div>
          
          {/* PAUSE / UNREAD INDICATOR */}
          {isPaused && (
              <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20 pointer-events-none">
                  <button 
                    onClick={scrollToBottom}
                    className="pointer-events-auto liquid-glass px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 animate-slide-up hover:bg-white/10 active:scale-95 transition-all text-white border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                  >
                      {unreadCount > 0 ? (
                        <>
                            <span className="text-twitch">●</span>
                            <span>Ver {unreadCount} novas mensagens</span>
                            <span className="text-white/60 ml-1">⬇</span>
                        </>
                      ) : (
                        <span>Chat Pausado</span>
                      )}
                  </button>
              </div>
          )}

          {/* Input Area */}
          {(authState.twitch || authState.kickAccessToken) && (
              <div className="bg-black border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
                 <div className="p-3">
                    <div className={`relative flex items-center bg-white/5 rounded-2xl border transition-all duration-300 ease-out-expo ${commentPlatform === 'twitch' ? 'border-twitch/30 focus-within:border-twitch/80 shadow-[0_0_20px_rgba(145,70,255,0.05)]' : 'border-kick/30 focus-within:border-kick/80 shadow-[0_0_20px_rgba(83,252,24,0.05)]'}`}>
                        {/* Platform Selector */}
                        <div className="pl-1.5 pr-1 py-1">
                            <button 
                                onClick={() => setCommentPlatform(prev => prev === 'twitch' ? 'kick' : 'twitch')}
                                className={`p-2 rounded-xl transition-all duration-300 ${commentPlatform === 'twitch' ? 'bg-twitch/10 text-twitch hover:bg-twitch/20' : 'bg-kick/10 text-kick hover:bg-kick/20'}`}
                            >
                                <PlatformIcon platform={commentPlatform} variant={commentPlatform === 'twitch' ? 'white' : 'default'} className="w-4 h-4" />
                            </button>
                        </div>

                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Enviar mensagem na ${commentPlatform}...`}
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
                    
                    {commentPlatform === 'kick' && !kickAccessToken && (
                        <div className="text-[10px] text-yellow-500/60 mt-2 px-1 text-center font-medium tracking-wide">
                            Configure o Access Token para enviar mensagens na Kick.
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