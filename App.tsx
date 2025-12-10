import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ChatMessageItem } from './components/ChatMessageItem';
import { SettingsModal } from './components/SettingsModal';
import { OfflineScreen } from './components/OfflineScreen';
import { UserCard } from './components/UserCard';
import { BookmarksModal } from './components/BookmarksModal'; 
import { EmotePicker } from './components/EmotePicker'; 
import { SendIcon, PlatformIcon, SmileyIcon } from './components/Icons';
import { ChatMessage, AuthState, Platform, StreamStats, TwitchCreds, BadgeMap, EmoteMap, ChatSettings, User, TwitchEmote } from './types';
import { TwitchConnection, KickConnection } from './services/chatConnection';
import { analyzeChatVibe } from './services/geminiService';
import { fetch7TVEmotes } from './services/sevenTVService';
import { handleKickCallback, fetchKickUserProfile } from './services/kickAuthService';
import { isBackendConfigured, getUserProfile, updateUserProfile, saveMessage, getClient } from './services/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_MESSAGES = 500;
const STREAMER_SLUG = 'gabepeixe';
const TWITCH_USER_LOGIN = 'gabepeixe';

// Default Settings
const DEFAULT_SETTINGS: ChatSettings = {
    showTimestamps: false,
    hideAvatars: true,
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
    
    smoothScroll: true,
    pauseOnHover: false,
    cinemaMode: false,
    performanceMode: false,
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

  // Cloud State
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);

  // Settings State
  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('chat_settings');
          return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
      }
      return DEFAULT_SETTINGS;
  });

  const [activePlayer, setActivePlayer] = useState<'twitch' | 'kick' | 'none'>(() => {
      return (localStorage.getItem('active_player') as any) || 'twitch';
  });

  const [chatFilter, setChatFilter] = useState<'all' | 'twitch' | 'kick'>(() => {
      return (localStorage.getItem('chat_filter') as any) || 'all';
  });
  
  const [selectedUser, setSelectedUser] = useState<{user: User, platform: Platform} | null>(null);
  const [playerKey, setPlayerKey] = useState(0);

  const [commentPlatform, setCommentPlatform] = useState<'twitch' | 'kick'>('twitch');
  const [chatInput, setChatInput] = useState('');
  
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [isPaused, setIsPaused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [streamStats, setStreamStats] = useState<StreamStats>({ 
    kickViewers: null, 
    twitchViewers: null,
    isLiveKick: null, 
    isLiveTwitch: null 
  });
  
  const [forcePlay, setForcePlay] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isEmotePickerOpen, setIsEmotePickerOpen] = useState(false);
  
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

  const [globalBadges, setGlobalBadges] = useState<BadgeMap>({});
  const [channelBadges, setChannelBadges] = useState<BadgeMap>({});
  const [kickBadges, setKickBadges] = useState<BadgeMap>({});
  const [sevenTVEmotes, setSevenTVEmotes] = useState<EmoteMap>({});
  
  const [twitchEmotes, setTwitchEmotes] = useState<TwitchEmote[]>([]);
  const fetchedEmoteSets = useRef<Set<string>>(new Set());

  const [avatarCache, setAvatarCache] = useState<Record<string, string>>({});
  const pendingAvatars = useRef<Set<string>>(new Set());

  const seenUsers = useRef<Set<string>>(new Set());

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const twitchRef = useRef<TwitchConnection | null>(null);
  const kickRef = useRef<KickConnection | null>(null);
  const messageQueue = useRef<ChatMessage[]>([]);
  
  // --- CLOUD SYNC & AUTH INITIALIZATION ---
  useEffect(() => {
    const initCloud = async () => {
        if (isBackendConfigured()) {
            const supabase = getClient();
            if (!supabase) return;

            // Helper: Integrates Twitch Token found in Supabase Session
            const integrateCloudToken = async (session: any) => {
                if (!session?.provider_token) return;

                console.log("[Auth] Found Twitch Cloud Token. Validating...");
                
                try {
                    // Tenta validar para pegar o Client ID e Login
                    // Usamos corsproxy para garantir que funcione em qualquer domínio (Vercel/Localhost)
                    const res = await fetch(`https://corsproxy.io/?https://id.twitch.tv/oauth2/validate`, {
                        headers: { 'Authorization': `OAuth ${session.provider_token}` }
                    });
                    
                    let newCreds: TwitchCreds = { clientId: '', accessToken: session.provider_token };
                    let login = '';

                    if (res.ok) {
                        const data = await res.json();
                        if (data.client_id && data.login) {
                            console.log(`[Auth] Authenticated as ${data.login}`);
                            newCreds.clientId = data.client_id;
                            login = data.login;
                        }
                    } else {
                        console.warn("[Auth] Validation failed, attempting to use cached Client ID or fallback.");
                        // Fallback: Se a validação falhar mas tivermos um Client ID salvo anteriormente
                        const saved = localStorage.getItem('twitch_creds');
                        if (saved) {
                            const parsed = JSON.parse(saved);
                            if (parsed.clientId) newCreds.clientId = parsed.clientId;
                        }
                        // Se não tiver Client ID, algumas funções da API da Twitch podem falhar,
                        // mas o chat (IRC) deve funcionar apenas com o token.
                    }

                    // ATUALIZA O ESTADO
                    setTwitchCreds(newCreds);
                    localStorage.setItem('twitch_creds', JSON.stringify(newCreds));
                    
                    if (login) {
                        setAuthState(prev => ({ ...prev, twitch: true, twitchUsername: login }));
                    } else {
                         setAuthState(prev => ({ ...prev, twitch: true }));
                         // O fetchTwitchDataAuthenticated vai tentar pegar o username depois
                    }

                } catch (e) {
                    console.error("[Auth] Fatal error integrating token", e);
                }
            };

            // 1. Check Initial Session
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setCloudUserId(session.user.id);
                // Important: Only integrate token if we have one, otherwise don't overwrite local creds yet
                if (session.provider_token) {
                    await integrateCloudToken(session);
                }

                // Fetch Profile Settings
                const profile = await getUserProfile(session.user.id);
                if (profile) {
                    if (profile.settings) setChatSettings(prev => ({ ...prev, ...profile.settings }));
                    
                    // Restore Kick Creds from Cloud
                    if (profile.kick_creds) {
                        setKickUsername(profile.kick_creds.username || '');
                        setKickAccessToken(profile.kick_creds.token || '');
                    }
                }
            }

            // 2. Listen for Auth Changes (Login/Logout)
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log(`[Supabase Auth Event] ${event}`);
                
                if (event === 'SIGNED_IN' && session) {
                    setCloudUserId(session.user.id);
                    await integrateCloudToken(session);
                } else if (event === 'SIGNED_OUT') {
                    setCloudUserId(null);
                    setAuthState(prev => ({ ...prev, twitch: false, twitchUsername: '' }));
                    // Don't necessarily wipe creds immediately to avoid annoyance, 
                    // but usually sign out means clear everything.
                }
            });

            return () => subscription.unsubscribe();
        }
    };
    initCloud();
  }, []);

  // --- CLOUD AUTO-SAVE (Debounced) ---
  useEffect(() => {
    if (cloudUserId) {
        const timeout = setTimeout(() => {
            updateUserProfile(cloudUserId, {
                settings: chatSettings,
                twitch_creds: twitchCreds, // Backs up creds to cloud
                kick_creds: { username: kickUsername, token: kickAccessToken }
            });
        }, 3000);
        return () => clearTimeout(timeout);
    }
  }, [chatSettings, twitchCreds, kickUsername, kickAccessToken, cloudUserId]);


  // Init logic
  useEffect(() => {
    // Restore Seen Users
    try {
        const saved = localStorage.getItem('seen_users');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) parsed.forEach(u => seenUsers.current.add(u));
        }
    } catch(e) {}

    // --- POPUP HANDLER (Manual Login) ---
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

    // --- KICK AUTH CALLBACK HANDLER ---
    const urlParams = new URLSearchParams(window.location.search);
    const kickCode = urlParams.get('code');
    
    if (kickCode) {
        window.history.replaceState({}, document.title, window.location.pathname);
        handleKickCallback(kickCode)
            .then(async (data) => {
                if (data.access_token) {
                    const profile = await fetchKickUserProfile(data.access_token);
                    setKickAccessToken(data.access_token);
                    localStorage.setItem('kick_access_token', data.access_token);
                    if (profile) {
                        setKickUsername(profile.username);
                        localStorage.setItem('kick_username', profile.username);
                    }
                    setIsSettingsOpen(true);
                }
            })
            .catch(err => alert("Erro no Login Kick: " + err.message));
    }

    // --- PARENT WINDOW HANDLER ---
    const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data && event.data.type === 'TWITCH_AUTH_SUCCESS') {
            const { accessToken } = event.data;
            handleSaveTwitchCreds({ ...twitchCreds, accessToken });
            setIsSettingsOpen(true);
        }
    };
    window.addEventListener('message', handleMessage);

    // Initial Data
    fetchStats();
    fetch7TVEmotes().then(map => setSevenTVEmotes(map));
    fetchTwitchBadgesNoAuth(); 

    const poll = setInterval(fetchStats, 30000);
    const buffer = setInterval(flushBuffer, 300);

    return () => {
        clearInterval(poll);
        clearInterval(buffer);
        window.removeEventListener('message', handleMessage);
    };
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('chat_settings', JSON.stringify(chatSettings)); }, [chatSettings]);
  useEffect(() => { localStorage.setItem('active_player', activePlayer); }, [activePlayer]);
  useEffect(() => { localStorage.setItem('chat_filter', chatFilter); }, [chatFilter]);

  // Sync Auth State & Fetch Authenticated Data
  useEffect(() => {
    localStorage.setItem('twitch_creds', JSON.stringify(twitchCreds));
    
    // We consider it "Ready" if we have an access token.
    const isTwitchReady = !!twitchCreds.accessToken;
    setAuthState(prev => ({ ...prev, twitch: isTwitchReady }));

    if (isTwitchReady) {
        // Se tivermos Client ID, busca tudo
        if (twitchCreds.clientId) {
            fetchTwitchDataAuthenticated();
        } else {
            // Se não tiver Client ID (raro se veio do cloud), tenta buscar profile pra descobrir
            // Mas a API oficial exige Client-ID no header.
            // O componente de Chat (IRC) funciona sem Client-ID se o token for valido.
        }
    }
  }, [twitchCreds]);

  useEffect(() => {
      localStorage.setItem('kick_username', kickUsername);
      localStorage.setItem('kick_access_token', kickAccessToken);

      setAuthState(prev => ({ 
          ...prev, 
          kick: !!kickUsername, 
          kickUsername: kickUsername,
          kickAccessToken: kickAccessToken
      }));
  }, [kickUsername, kickAccessToken]);


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
        if (isPaused) setUnreadCount(c => c + messageQueue.current.length);
        messageQueue.current = [];
        return newMsgs;
      });
    }
  };

  const handleSaveMessage = async (msg: ChatMessage) => {
      if (!cloudUserId) return;
      const avatarKey = `${msg.platform}-${msg.user.username}`;
      const savedAvatar = msg.user.avatarUrl || avatarCache[avatarKey];

      try {
          await saveMessage({
              platform: msg.platform,
              author: msg.user.username,
              content: msg.content,
              timestamp: msg.timestamp,
              avatar_url: savedAvatar
          });
      } catch(e) { console.error("Failed to save message", e); }
  };

  const requestAvatar = useCallback(async (platform: Platform, user: User) => {
      const key = `${platform}-${user.username}`;
      if (avatarCache[key] || pendingAvatars.current.has(key)) return;
      if (user.avatarUrl && !user.avatarUrl.includes('null')) return;

      pendingAvatars.current.add(key);

      try {
          let url: string | null = null;
          if (platform === Platform.KICK && user.id) {
               try {
                   const res = await fetch(`https://7tv.io/v3/users/kick/${user.id}`);
                   if (res.ok) {
                       const data = await res.json();
                       if (data.user?.avatar_url) url = data.user.avatar_url.startsWith('//') ? `https:${data.user.avatar_url}` : data.user.avatar_url;
                   }
               } catch (e) {}
               if (!url) url = `https://files.kick.com/images/user_profile_pics/${user.id}/image.webp`;
          }
          else if (platform === Platform.TWITCH) {
              if (user.id) {
                  try {
                      const res = await fetch(`https://7tv.io/v3/users/twitch/${user.id}`);
                      if (res.ok) {
                          const data = await res.json();
                          if (data.user?.avatar_url) url = data.user.avatar_url.startsWith('//') ? `https:${data.user.avatar_url}` : data.user.avatar_url;
                      }
                  } catch (e) {}
              }
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
          if (url) setAvatarCache(prev => ({ ...prev, [key]: url! }));
      } catch (e) {} finally { pendingAvatars.current.delete(key); }
  }, [avatarCache]);

  const handleScroll = () => {
      if (!chatContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      if (distanceFromBottom > 250) { if (!isPaused) setIsPaused(true); } 
      else if (distanceFromBottom < 100) { if (isPaused) { setIsPaused(false); setUnreadCount(0); } }
  };

  useEffect(() => {
    if (chatContainerRef.current && !isPaused) {
        const scrollContainer = chatContainerRef.current;
        requestAnimationFrame(() => {
            const { scrollHeight, clientHeight } = scrollContainer;
            scrollContainer.scrollTo({ top: scrollHeight - clientHeight, behavior: chatSettings.smoothScroll ? 'smooth' : 'auto' });
        });
    }
  }, [messages, isPaused, chatSettings.smoothScroll]);

  const scrollToBottom = () => {
      setIsPaused(false);
      setUnreadCount(0);
      if (chatContainerRef.current) {
          const { scrollHeight, clientHeight } = chatContainerRef.current;
          chatContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'auto' });
      }
  };

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
            if (data.subscriber_badges) {
                const subBadges: Record<string, string> = {};
                data.subscriber_badges.forEach((b: any) => { subBadges[String(b.months)] = b.badge_image.src; });
                setKickBadges(prev => ({ ...prev, 'subscriber': subBadges }));
            }
        }
    } catch (e) {}

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
        } catch (e) {}
    }
  };

  const handleEmoteSetsReceived = useCallback(async (sets: string[]) => {
      if (!twitchCreds.accessToken || !twitchCreds.clientId) return;
      const newSets = sets.filter(s => !fetchedEmoteSets.current.has(s) && s !== '0');
      if (newSets.length === 0) return;
      newSets.forEach(s => fetchedEmoteSets.current.add(s));
      try {
          const idsToFetch = newSets.slice(0, 20);
          const queryString = idsToFetch.map(id => `emote_set_id=${id}`).join('&');
          const res = await fetch(`https://api.twitch.tv/helix/chat/emotes/set?${queryString}`, {
              headers: { 'Client-ID': twitchCreds.clientId, 'Authorization': `Bearer ${twitchCreds.accessToken}` }
          });
          if (res.ok) {
              const data = await res.json();
              if (data.data) {
                  setTwitchEmotes(prev => {
                      const existingIds = new Set(prev.map(e => e.id));
                      const uniqueNew = data.data.filter((e: TwitchEmote) => !existingIds.has(e.id));
                      return [...prev, ...uniqueNew];
                  });
              }
          }
      } catch (e) {}
  }, [twitchCreds]);

  const fetchTwitchDataAuthenticated = async () => {
    if (!twitchCreds.accessToken || !twitchCreds.clientId) return;
    try {
        const headers = { 'Client-ID': twitchCreds.clientId, 'Authorization': `Bearer ${twitchCreds.accessToken}` };
        
        const myUserRes = await fetch(`https://api.twitch.tv/helix/users`, { headers });
        const myData = await myUserRes.json();
        if (myData.data && myData.data.length > 0) {
            setAuthState(prev => ({ ...prev, twitchUsername: myData.data[0].display_name }));
        }

        const streamerRes = await fetch(`https://api.twitch.tv/helix/users?login=${TWITCH_USER_LOGIN}`, { headers });
        const streamerData = await streamerRes.json();
        const streamerId = streamerData.data?.[0]?.id;

        if (streamerId) {
             const cbRes = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${streamerId}`, { headers });
             const cbData = await cbRes.json();
             if (cbData.data) setChannelBadges(parseHelixBadges(cbData.data));

             const emotesRes = await fetch(`https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${streamerId}`, { headers });
             const emotesData = await emotesRes.json();
             if (emotesData.data) {
                 setTwitchEmotes(prev => {
                     const existingIds = new Set(prev.map(e => e.id));
                     const uniqueNew = emotesData.data.filter((e: TwitchEmote) => !existingIds.has(e.id));
                     return [...prev, ...uniqueNew];
                 });
             }
        }
        const gbRes = await fetch(`https://api.twitch.tv/helix/chat/badges/global`, { headers });
        const gbData = await gbRes.json();
        if (gbData.data) setGlobalBadges(parseHelixBadges(gbData.data));

        const geRes = await fetch(`https://api.twitch.tv/helix/chat/emotes/global`, { headers });
        const geData = await geRes.json();
        if (geData.data) {
             setTwitchEmotes(prev => {
                 const existingIds = new Set(prev.map(e => e.id));
                 const uniqueNew = geData.data.filter((e: TwitchEmote) => !existingIds.has(e.id));
                 return [...prev, ...uniqueNew];
             });
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

  const fetchTwitchBadgesNoAuth = async () => {
      try {
          const proxy = 'https://corsproxy.io/?';
          const globalRes = await fetch(`${proxy}${encodeURIComponent('https://api.ivr.fi/v2/twitch/badges/global')}`);
          if (globalRes.ok) {
              const data = await globalRes.json();
              setGlobalBadges(prev => Object.keys(prev).length === 0 ? parseIvrBadges(data) : prev);
          }
          const channelRes = await fetch(`${proxy}${encodeURIComponent(`https://api.ivr.fi/v2/twitch/badges/channel/${TWITCH_USER_LOGIN}`)}`);
           if (channelRes.ok) {
              const data = await channelRes.json();
              setChannelBadges(prev => Object.keys(prev).length === 0 ? parseIvrBadges(data) : prev);
          }
      } catch (e) {}
  };

  const parseIvrBadges = (data: any[]): BadgeMap => {
      const map: BadgeMap = {};
      if (!data) return map;
      data.forEach((set: any) => {
          const versions: Record<string, string> = {};
          set.versions.forEach((v: any) => { versions[v.id] = v.image_url_2x || v.image_url_1x; });
          map[set.set_id] = versions;
      });
      return map;
  };

  const handleNewMessage = (msg: ChatMessage) => {
    const userKey = `${msg.platform}-${msg.user.username.toLowerCase()}`;
    if (!seenUsers.current.has(userKey)) {
        if (msg.platform === Platform.KICK || msg.isFirstMessage === undefined) msg.isFirstMessage = true;
        seenUsers.current.add(userKey);
        try { localStorage.setItem('seen_users', JSON.stringify(Array.from(seenUsers.current))); } catch(e) {}
    } else { if (!msg.isFirstMessage) msg.isFirstMessage = false; }
    messageQueue.current.push(msg);
  };
  
  const handleDeleteMessage = (msgId: string) => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDeleted: true } : m));
  };
  
  const handleReply = (username: string) => {
      setChatInput(prev => {
          if (prev.endsWith(' ')) return `${prev}@${username} `;
          if (prev.length > 0) return `${prev} @${username} `;
          return `@${username} `;
      });
  };
  
  const handleEmoteSelect = (emoteCode: string) => {
      setChatInput(prev => {
          if (prev.endsWith(' ')) return `${prev}${emoteCode} `;
          if (prev.length > 0) return `${prev} ${emoteCode} `;
          return `${emoteCode} `;
      });
  };

  const handleUserClick = (user: User, platform: Platform) => { setSelectedUser({ user, platform }); };
  const handleSyncPlayer = () => { setPlayerKey(prev => prev + 1); };
  const toggleCinemaMode = () => { setChatSettings(prev => ({ ...prev, cinemaMode: !prev.cinemaMode })); };

  useEffect(() => {
    if (twitchRef.current) { twitchRef.current.disconnect(); twitchRef.current = null; addSystemMsg('Twitch', false); }
    twitchRef.current = new TwitchConnection(
        STREAMER_SLUG, handleNewMessage, handleDeleteMessage,
        twitchCreds.accessToken || undefined, authState.twitchUsername || undefined, handleEmoteSetsReceived
    );
    twitchRef.current.connect();
    const mode = authState.twitch ? 'Autenticado' : 'Anônimo (Leitura)';
    handleNewMessage({
      id: crypto.randomUUID(), platform: Platform.SYSTEM, user: { username: 'System', badges: [] },
      content: `Conectado à Twitch em modo: ${mode}.`, timestamp: Date.now()
    });
    return () => { if (twitchRef.current) { twitchRef.current.disconnect(); twitchRef.current = null; } };
  }, [twitchCreds.accessToken, authState.twitchUsername, handleEmoteSetsReceived]);

  useEffect(() => {
    if (!kickRef.current) {
      kickRef.current = new KickConnection(STREAMER_SLUG, handleNewMessage, handleDeleteMessage, kickAccessToken);
      kickRef.current.connect();
      addSystemMsg('Kick', true);
    } else {
         kickRef.current.disconnect();
         kickRef.current = new KickConnection(STREAMER_SLUG, handleNewMessage, handleDeleteMessage, kickAccessToken);
         kickRef.current.connect();
    }
    return () => { if (kickRef.current) { kickRef.current.disconnect(); kickRef.current = null; } };
  }, [kickAccessToken]);

  const addSystemMsg = (platform: string, connected: boolean) => {
    handleNewMessage({
      id: crypto.randomUUID(), platform: Platform.SYSTEM, user: { username: 'System', badges: [] },
      content: connected ? `Conectado ao servidor da ${platform}.` : `Desconectado da ${platform}.`, timestamp: Date.now()
    });
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setInputHistory(prev => [chatInput, ...prev.filter(i => i !== chatInput)].slice(0, 50));
    setHistoryIndex(-1);

    if (commentPlatform === 'twitch') {
        if (!twitchRef.current || !twitchCreds.accessToken) {
            alert('Você está em modo anônimo. Conecte sua conta da Twitch nas configurações (engrenagem) para enviar mensagens.');
            return;
        }
        twitchRef.current.sendMessage(chatInput);
        handleNewMessage({
            id: crypto.randomUUID(), platform: Platform.TWITCH, user: { username: authState.twitchUsername || 'Eu', badges: [], color: '#a970ff' },
            content: chatInput, timestamp: Date.now()
        });
        setChatInput('');
    } 
    else if (commentPlatform === 'kick') {
        if (!kickAccessToken) { alert('Para enviar mensagens na Kick, você precisa de um Access Token.'); return; }
        if (!kickRef.current) return;
        try {
            await kickRef.current.sendMessage(chatInput);
            handleNewMessage({
                id: crypto.randomUUID(), platform: Platform.KICK, user: { username: authState.kickUsername || 'Eu', badges: [], color: '#53FC18' },
                content: chatInput, timestamp: Date.now()
            });
            setChatInput('');
        } catch (error: any) { alert(`Falha ao enviar para Kick: ${error.message}`); }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); }
      if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (historyIndex < inputHistory.length - 1) { const newIndex = historyIndex + 1; setHistoryIndex(newIndex); setChatInput(inputHistory[newIndex]); }
      }
      if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex > 0) { const newIndex = historyIndex - 1; setHistoryIndex(newIndex); setChatInput(inputHistory[newIndex]); } else if (historyIndex === 0) { setHistoryIndex(-1); setChatInput(''); }
      }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try { const result = await analyzeChatVibe(messages); setAiAnalysis(result); setTimeout(() => setAiAnalysis(null), 20000); } catch (e) { } finally { setIsAnalyzing(false); }
  };

  const getParentDomain = () => {
      const currentHost = window.location.hostname;
      const parents = new Set<string>();
      if (currentHost) parents.add(currentHost);
      if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') parents.add('localhost'); 
      return Array.from(parents).map(domain => `&parent=${domain}`).join('');
  };

  const saveKickSettings = (username: string, token: string) => { handleSaveKickCreds(username, token); };

  const isGlobalOffline = streamStats.isLiveTwitch === false && streamStats.isLiveKick === false;
  const showOfflineScreen = isGlobalOffline && activePlayer !== 'none' && !forcePlay;
  const visibleMessages = chatSettings.performanceMode ? messages.slice(-100) : messages;
  const canChat = Boolean(authState.twitch || authState.kickAccessToken);

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
        onForceLoadCloud={() => { window.location.reload(); }}
      />
      <BookmarksModal isOpen={isBookmarksOpen} onClose={() => setIsBookmarksOpen(false)} />
      {chatSettings.cinemaMode && (
         <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleCinemaMode} className="fixed top-4 right-4 z-[999] bg-black/60 hover:bg-black/90 text-white/70 hover:text-white p-3 rounded-full backdrop-blur-md border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)] group">
           <div className="group-hover:rotate-180 transition-transform duration-500"><span className="text-xl leading-none block">✕</span></div>
         </motion.button>
      )}
      {selectedUser && ( <UserCard user={selectedUser.user} platform={selectedUser.platform} messages={messages} onClose={() => setSelectedUser(null)} twitchCreds={twitchCreds} /> )}
      <ControlPanel 
        authState={authState} onToggleAuth={() => setIsSettingsOpen(true)} onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} streamStats={streamStats}
        onOpenSettings={() => setIsSettingsOpen(true)} activePlayer={activePlayer} onSetPlayer={setActivePlayer} chatFilter={chatFilter} onSetChatFilter={setChatFilter}
        onSync={handleSyncPlayer} cinemaMode={chatSettings.cinemaMode} onToggleCinema={toggleCinemaMode} onOpenBookmarks={() => setIsBookmarksOpen(true)} hasCloudAccess={!!cloudUserId}
      />
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative z-0">
        <div className={`bg-black relative shrink-0 transition-all duration-500 ease-out-expo overflow-hidden ${activePlayer === 'none' ? 'md:w-0 w-full h-0 md:h-auto opacity-0' : 'w-full md:flex-1 aspect-video md:aspect-auto md:h-auto opacity-100'}`}>
            {showOfflineScreen ? (
                 <OfflineScreen twitchCreds={twitchCreds} streamerSlug={STREAMER_SLUG} onForcePlay={() => setForcePlay(true)} />
            ) : (
                <>
                    {activePlayer === 'twitch' && (
                    <div className="relative w-full h-full group">
                        <iframe key={`twitch-${playerKey}`} src={`https://player.twitch.tv/?channel=${STREAMER_SLUG}${getParentDomain()}&muted=true&autoplay=true`} className="w-full h-full border-none" allowFullScreen scrolling="no" referrerPolicy="origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write" title="Twitch Player"></iframe>
                        <a href={`https://www.twitch.tv/${STREAMER_SLUG}`} target="_blank" rel="noopener noreferrer" className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/60 hover:bg-twitch text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 backdrop-blur-md flex items-center gap-2"><span>Assistir na Twitch ↗</span></a>
                    </div>
                    )}
                    {activePlayer === 'kick' && ( <iframe key={`kick-${playerKey}`} src={`https://player.kick.com/${STREAMER_SLUG}?autoplay=true&muted=false`} className="w-full h-full border-none" allowFullScreen scrolling="no" allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope" title="Kick Player"></iframe> )}
                    {activePlayer === 'none' && ( <div className="w-full h-full bg-black"></div> )}
                </>
            )}
          {aiAnalysis && (
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 max-w-2xl w-[90%] liquid-glass-strong p-6 rounded-3xl z-50 animate-slide-in shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5">
                <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2"><span className="text-xl">🤖</span><h3 className="font-display font-bold text-lg text-white">Analysis</h3></div>
                    <button onClick={() => setAiAnalysis(null)} className="text-white/50 hover:text-white transition-colors">✕</button>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">{aiAnalysis}</p>
            </div>
          )}
        </div>
        <div className={`${activePlayer === 'none' ? 'w-full flex-1' : 'md:w-[380px] xl:w-[420px] w-full flex-1 md:flex-none'} bg-[#000000] border-t md:border-t-0 ${activePlayer !== 'none' ? 'md:border-l border-white/5' : ''} flex flex-col z-10 transition-all duration-500 ease-out-expo min-h-0 relative`}>
          <div className={`flex-1 overflow-y-auto custom-scrollbar relative px-2 pt-0 scroll-smooth ${canChat ? 'pb-2' : 'pb-4'}`} ref={chatContainerRef} onScroll={handleScroll}>
            <div className="min-h-full flex flex-col justify-end">
                {visibleMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/20 space-y-2"><div className="text-2xl animate-pulse">⚡</div><p className="text-xs font-medium tracking-widest">CONECTANDO...</p></div>
                ) : (
                visibleMessages.filter(msg => {
                        if (chatFilter === 'twitch' && msg.platform !== Platform.TWITCH) return false;
                        if (chatFilter === 'kick' && msg.platform !== Platform.KICK) return false;
                        if (chatSettings.ignoredUsers.length > 0 && chatSettings.ignoredUsers.includes(msg.user.username.toLowerCase())) return false;
                        if (chatSettings.ignoredKeywords.length > 0) { const contentLower = msg.content.toLowerCase(); if (chatSettings.ignoredKeywords.some(kw => contentLower.includes(kw))) return false; }
                        return true;
                    }).map((msg, idx) => (
                    <ChatMessageItem key={msg.id} message={msg} index={idx} globalBadges={globalBadges} channelBadges={channelBadges} kickBadges={kickBadges} sevenTVEmotes={sevenTVEmotes} settings={chatSettings} currentUser={{ twitch: authState.twitchUsername, kick: authState.kickUsername }} onReply={handleReply} onUserClick={handleUserClick} avatarCache={avatarCache} onRequestAvatar={requestAvatar} onSaveMessage={handleSaveMessage} canSave={!!cloudUserId} />
                )))}
            </div>
            <AnimatePresence>
            {isPaused && (
                <div className="sticky bottom-4 flex justify-center w-full z-20 pointer-events-none">
                    <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={scrollToBottom} className="pointer-events-auto bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs font-bold group">
                        {unreadCount > 0 ? ( <><span className="text-twitch group-hover:animate-pulse">↓</span><span>Ver {unreadCount} novas mensagens</span></> ) : ( <><span className="text-gray-400">⏸</span><span>Chat Pausado</span></> )}
                    </motion.button>
                </div>
            )}
            </AnimatePresence>
          </div>
          {canChat && (
              <div className="w-full z-30 bg-black/60 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] shrink-0">
                 <div className="p-3">
                    <div className={`relative flex items-center bg-black/40 rounded-2xl border transition-all duration-300 ease-out-expo ${commentPlatform === 'twitch' ? 'border-twitch/30 focus-within:border-twitch/80 shadow-[0_0_20px_rgba(145,70,255,0.05)]' : 'border-kick/30 focus-within:border-kick/80 shadow-[0_0_20px_rgba(83,252,24,0.05)]'}`}>
                        <EmotePicker isOpen={isEmotePickerOpen} onClose={() => setIsEmotePickerOpen(false)} onSelect={handleEmoteSelect} sevenTVEmotes={sevenTVEmotes} twitchEmotes={twitchEmotes} />
                        <div className="pl-1.5 pr-1 py-1">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCommentPlatform(prev => prev === 'twitch' ? 'kick' : 'twitch')} className={`p-2 rounded-xl transition-colors ${commentPlatform === 'twitch' ? 'bg-twitch/10 text-twitch hover:bg-twitch/20' : 'bg-kick/10 text-kick hover:bg-kick/20'}`}>
                                <PlatformIcon platform={commentPlatform} variant={commentPlatform === 'twitch' ? 'white' : 'default'} className="w-4 h-4" />
                            </motion.button>
                        </div>
                        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Enviar mensagem na ${commentPlatform}...`} className="w-full bg-transparent text-white px-2 py-3 text-sm focus:outline-none placeholder-white/20" />
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsEmotePickerOpen(!isEmotePickerOpen)} className={`p-2 transition-colors ${isEmotePickerOpen ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}><SmileyIcon className="w-5 h-5" /></motion.button>
                        <motion.button whileHover={{ scale: 1.1, rotate: -10 }} whileTap={{ scale: 0.9, rotate: 0 }} onClick={handleSendMessage} disabled={!chatInput.trim()} className={`p-2 mr-1 rounded-xl transition-colors ${chatInput.trim() ? (commentPlatform === 'twitch' ? 'text-twitch hover:bg-twitch/10' : 'text-kick hover:bg-kick/10') : 'text-white/20 cursor-not-allowed'}`}><SendIcon className="w-5 h-5" /></motion.button>
                    </div>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}