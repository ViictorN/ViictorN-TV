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
    
    // New Defaults
    smoothScroll: true,
    pauseOnHover: false,
    cinemaMode: false,
    performanceMode: false,
    clickToReply: true,
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

  // Stats / Offline Logic
  const [streamStats, setStreamStats] = useState<StreamStats>({ 
    kickViewers: null, 
    twitchViewers: null,
    isLiveKick: null, 
    isLiveTwitch: null 
  });
  
  // Force play bypass for offline screen
  // DEFAULT TRUE: Ensures player loads immediately regardless of API status
  const [forcePlay, setForcePlay] = useState(true);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // New: Bookmarks Modal State
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

  // Assets
  const [globalBadges, setGlobalBadges] = useState<BadgeMap>({});
  const [channelBadges, setChannelBadges] = useState<BadgeMap>({});
  const [kickBadges, setKickBadges] = useState<BadgeMap>({});
  const [sevenTVEmotes, setSevenTVEmotes] = useState<EmoteMap>({});
  
  // Emotes State
  const [twitchEmotes, setTwitchEmotes] = useState<TwitchEmote[]>([]);
  const fetchedEmoteSets = useRef<Set<string>>(new Set());

  // Avatar Cache
  const [avatarCache, setAvatarCache] = useState<Record<string, string>>({});
  const pendingAvatars = useRef<Set<string>>(new Set());

  // Session Tracking for First Interactions
  const seenUsers = useRef<Set<string>>(new Set());

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const twitchRef = useRef<TwitchConnection | null>(null);
  const kickRef = useRef<KickConnection | null>(null);
  const messageQueue = useRef<ChatMessage[]>([]);
  
  // --- TOKEN VALIDATION HELPER ---
  const validateTwitchToken = async (token: string): Promise<boolean> => {
      try {
          const res = await fetch('https://id.twitch.tv/oauth2/validate', {
              headers: { 'Authorization': `OAuth ${token}` }
          });
          return res.ok;
      } catch (e) {
          return false;
      }
  };

  // --- SESSION REFRESH HELPER ---
  const tryRefreshSession = async () => {
      if (!isBackendConfigured()) return false;
      const supabase = getClient();
      if (!supabase) return false;

      console.log("[Auth] Attempting to refresh Twitch Session...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (data.session && data.session.provider_token) {
           console.log("[Auth] Session refreshed successfully.");
           const newCreds = { ...twitchCreds, accessToken: data.session.provider_token };
           setTwitchCreds(newCreds); // This triggers the useEffect persistence
           setAuthState(prev => ({ ...prev, twitch: true }));
           return true;
      } else {
           console.warn("[Auth] Refresh failed or no provider token.", error);
           return false;
      }
  };

  // --- CLOUD SYNC INITIALIZATION ---
  useEffect(() => {
    const initCloud = async () => {
        if (isBackendConfigured()) {
            const supabase = getClient();
            if (!supabase) return;

            // 1. Check current session
            const { data: { session } } = await supabase.auth.getSession();
            
            const integrateCloudToken = async (sessionData: any) => {
                if (sessionData?.provider_token) {
                    const isValid = await validateTwitchToken(sessionData.provider_token);
                    if (isValid) {
                        try {
                            const res = await fetch('https://id.twitch.tv/oauth2/validate', {
                                headers: { 'Authorization': `OAuth ${sessionData.provider_token}` }
                            });
                            if (res.ok) {
                                const data = await res.json();
                                if (data.client_id && data.login) {
                                    const newCreds = { clientId: data.client_id, accessToken: sessionData.provider_token };
                                    setTwitchCreds(newCreds);
                                    setAuthState(prev => ({ ...prev, twitch: true, twitchUsername: data.login }));
                                    localStorage.setItem('twitch_creds', JSON.stringify(newCreds));
                                }
                            }
                        } catch (e) {}
                    } else {
                         console.log("[Auth] Initial token invalid, trying refresh...");
                         await tryRefreshSession();
                    }
                }
            };

            if (session?.user) {
                setCloudUserId(session.user.id);
                await integrateCloudToken(session);
                const profile = await getUserProfile(session.user.id);
                if (profile) {
                    if (profile.settings) setChatSettings(prev => ({ ...prev, ...profile.settings }));
                    if (!session.provider_token && profile.twitch_creds) {
                         setTwitchCreds(prev => ({ ...prev, ...profile.twitch_creds }));
                    }
                    if (profile.kick_creds) {
                        setKickUsername(profile.kick_creds.username || '');
                        setKickAccessToken(profile.kick_creds.token || '');
                    }
                }
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                    setCloudUserId(session.user.id);
                    await integrateCloudToken(session);
                } else if (event === 'SIGNED_OUT') {
                    setCloudUserId(null);
                    setAuthState(prev => ({ ...prev, twitch: false, twitchUsername: '' }));
                    setTwitchCreds({ clientId: '', accessToken: '' });
                }
            });

            return () => subscription.unsubscribe();
        }
    };
    initCloud();
  }, []);

  // --- AUTO-VALIDATION LOOP ---
  // Checks token health every 15 minutes to prevent "hours later" failures
  useEffect(() => {
      const checkHealth = setInterval(async () => {
          if (twitchCreds.accessToken) {
              const isValid = await validateTwitchToken(twitchCreds.accessToken);
              if (!isValid) {
                  console.warn("[Auth] Token expired in background. Refreshing...");
                  const refreshed = await tryRefreshSession();
                  if (!refreshed) {
                      // Optionally mark auth as invalid visually, but usually better to let the user keep reading chat
                      console.error("[Auth] Could not refresh token in background.");
                  }
              }
          }
      }, 1000 * 60 * 15); // 15 Minutes
      return () => clearInterval(checkHealth);
  }, [twitchCreds.accessToken]);


  // --- CLOUD AUTO-SAVE ---
  useEffect(() => {
    if (cloudUserId) {
        const timeout = setTimeout(() => {
            updateUserProfile(cloudUserId, {
                settings: chatSettings,
                twitch_creds: twitchCreds,
                kick_creds: { username: kickUsername, token: kickAccessToken }
            });
        }, 3000);
        return () => clearTimeout(timeout);
    }
  }, [chatSettings, twitchCreds, kickUsername, kickAccessToken, cloudUserId]);


  // Init logic
  useEffect(() => {
    try {
        const saved = localStorage.getItem('seen_users');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) parsed.forEach(u => seenUsers.current.add(u));
        }
    } catch(e) {}

    // --- POPUP HANDLER ---
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
        const savedClientId = localStorage.getItem('kick_client_id_temp');
        if (savedClientId) {
            window.history.replaceState({}, document.title, window.location.pathname);
            handleKickCallback(kickCode, savedClientId, window.location.origin)
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
                        alert("Kick Login com Sucesso!");
                    }
                })
                .catch(err => { alert("Erro no Login Kick: " + err.message); })
                .finally(() => { localStorage.removeItem('kick_client_id_temp'); });
        }
    }

    // --- MAIN APP HANDLER ---
    const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data && event.data.type === 'TWITCH_AUTH_SUCCESS') {
            const { accessToken } = event.data;
            handleSaveTwitchCreds({ ...twitchCreds, accessToken });
            setIsSettingsOpen(true);
        }
    };
    window.addEventListener('message', handleMessage);

    fetchStats();
    fetch7TVEmotes().then(map => setSevenTVEmotes(map));
    
    // Always call IVR/NoAuth fetcher as a base.
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

  // Sync Auth
  useEffect(() => {
    localStorage.setItem('twitch_creds', JSON.stringify(twitchCreds));
    const isTwitchReady = !!twitchCreds.accessToken;
    setAuthState(prev => ({ ...prev, twitch: isTwitchReady }));
    if (isTwitchReady && twitchCreds.clientId) {
        fetchTwitchDataAuthenticated();
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
        if (isPaused) {
            setUnreadCount(c => c + messageQueue.current.length);
        }
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

  // --- AVATAR FETCH ---
  const requestAvatar = useCallback(async (platform: Platform, user: User) => {
      const key = `${platform}-${user.username}`;
      if (avatarCache[key] || pendingAvatars.current.has(key)) return;

      // Ensure we cache if user has a valid URL already, and it's not a generic/null string
      if (user.avatarUrl && !user.avatarUrl.includes('null') && !user.avatarUrl.includes('undefined')) {
           setAvatarCache(prev => ({ ...prev, [key]: user.avatarUrl! }));
           return;
      }

      pendingAvatars.current.add(key);
      try {
          let url: string | null = null;
          
          if (platform === Platform.KICK && user.id) {
               // 1. Try 7TV (Sometimes better quality)
               try {
                   const res = await fetch(`https://7tv.io/v3/users/kick/${user.id}`);
                   if (res.ok) {
                       const data = await res.json();
                       if (data.user?.avatar_url) {
                           url = data.user.avatar_url.startsWith('//') ? `https:${data.user.avatar_url}` : data.user.avatar_url;
                       }
                   }
               } catch (e) {}

               // 2. Fallback to standard Kick URL construction
               if (!url) url = `https://files.kick.com/images/user_profile_pics/${user.id}/image.webp`;

               // 3. APPLY KICK PROXY IMMEDIATELY
               // Kick images often have strict CORS or hotlink protection. Using wsrv.nl here fixes it globally.
               if (url) {
                   url = `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=64&h=64&fit=cover&output=webp`;
               }
          }
          else if (platform === Platform.TWITCH) {
              // 1. Helix (Authenticated - Most Reliable)
              if (twitchCreds.accessToken && twitchCreds.clientId) {
                  try {
                      const res = await fetch(`https://api.twitch.tv/helix/users?login=${user.username}`, {
                          headers: { 'Client-ID': twitchCreds.clientId, 'Authorization': `Bearer ${twitchCreds.accessToken}` }
                      });
                      
                      // 401 Handler in Avatar Fetch
                      if (res.status === 401) {
                          const refreshed = await tryRefreshSession();
                          if (refreshed && twitchCreds.accessToken) {
                              // Retry once
                              const retryRes = await fetch(`https://api.twitch.tv/helix/users?login=${user.username}`, {
                                  headers: { 'Client-ID': twitchCreds.clientId, 'Authorization': `Bearer ${twitchCreds.accessToken}` }
                              });
                              if (retryRes.ok) {
                                  const data = await retryRes.json();
                                  if (data.data && data.data[0]) url = data.data[0].profile_image_url;
                              }
                          }
                      } else if (res.ok) {
                          const data = await res.json();
                          if (data.data && data.data[0] && data.data[0].profile_image_url) {
                              url = data.data[0].profile_image_url;
                          }
                      }
                  } catch(e) {}
              }

              // 2. IVR (Public Fallback)
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
  }, [avatarCache, twitchCreds]);

  // --- SCROLL ---
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

  // --- API ---
  const processKickStats = (data: any) => {
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
  };

  const fetchStats = async () => {
    // KICK STATS STRATEGY (Multi-Proxy)
    let kickSuccess = false;
    const kickUrl = `https://kick.com/api/v1/channels/${STREAMER_SLUG}`;

    // 1. Try CorsProxy
    try {
        const response = await fetch(`https://corsproxy.io/?${kickUrl}`);
        if (response.ok) {
            const data = await response.json();
            processKickStats(data);
            kickSuccess = true;
        }
    } catch (e) {}

    // 2. Try AllOrigins (Fallback if 1 failed)
    if (!kickSuccess) {
        try {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(kickUrl)}`);
            if (response.ok) {
                const json = await response.json();
                if (json.contents) {
                     const data = JSON.parse(json.contents);
                     processKickStats(data);
                }
            }
        } catch(e) {}
    }

    // TWITCH STATS
    if (twitchCreds.accessToken && twitchCreds.clientId) {
        try {
            const res = await fetch(`https://api.twitch.tv/helix/streams?user_login=${TWITCH_USER_LOGIN}`, {
                headers: { 'Client-ID': twitchCreds.clientId, 'Authorization': `Bearer ${twitchCreds.accessToken}` }
            });
            
            // 401 ERROR HANDLING (Token Expired)
            if (res.status === 401) {
                console.warn("[Twitch API] 401 Unauthorized in fetchStats. Attempting refresh...");
                await tryRefreshSession();
                // Return here, next cycle will pick up new token
                return;
            }

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
        // Fetch Current User
        let myUserRes = await fetch(`https://api.twitch.tv/helix/users`, { headers });
        
        // 401 ERROR HANDLING FOR AUTHENTICATED DATA
        if (myUserRes.status === 401) {
             console.warn("[Twitch API] 401 in fetchTwitchDataAuthenticated. Refreshing...");
             const refreshed = await tryRefreshSession();
             if (!refreshed) return;
             // Retry with new token immediately if possible, or wait for next effect cycle.
             // For simplicity, we exit, and let the state update trigger this effect again.
             return; 
        }

        const myData = await myUserRes.json();
        if (myData.data && myData.data.length > 0) {
            setAuthState(prev => ({ ...prev, twitchUsername: myData.data[0].display_name }));
        }

        // Fetch Streamer ID 
        const streamerRes = await fetch(`https://api.twitch.tv/helix/users?login=${TWITCH_USER_LOGIN}`, { headers });
        const streamerData = await streamerRes.json();
        const streamerId = streamerData.data?.[0]?.id;

        if (streamerId) {
             // RESTORED: Fetch Channel Badges via Helix if authenticated
             // This is critical for authenticated users to see sub badges correctly
             try {
                const cbRes = await fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${streamerId}`, { headers });
                const cbData = await cbRes.json();
                if (cbData.data) {
                    setChannelBadges(prev => ({ ...prev, ...parseHelixBadges(cbData.data) }));
                }
             } catch(e) { console.error("Helix Badge Fetch Error", e); }
             
             // Fetch Channel Emotes
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
        
        // Fetch Global Emotes (Helix)
        const geRes = await fetch(`https://api.twitch.tv/helix/chat/emotes/global`, { headers });
        const geData = await geRes.json();
        if (geData.data) {
             setTwitchEmotes(prev => {
                 const existingIds = new Set(prev.map(e => e.id));
                 const uniqueNew = geData.data.filter((e: TwitchEmote) => !existingIds.has(e.id));
                 return [...prev, ...uniqueNew];
             });
        }
    } catch (e) {}
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
              setGlobalBadges(prev => {
                  const newMap = parseIvrBadges(data);
                  return { ...prev, ...newMap };
              });
          }
          const channelRes = await fetch(`${proxy}${encodeURIComponent(`https://api.ivr.fi/v2/twitch/badges/channel/${TWITCH_USER_LOGIN}`)}`);
           if (channelRes.ok) {
              const data = await channelRes.json();
              setChannelBadges(prev => {
                   const newMap = parseIvrBadges(data);
                   return { ...prev, ...newMap };
              });
          }
      } catch (e) {
          console.error("IVR Badge Fetch Error", e);
      }
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
         <motion.button 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)" }} 
            whileTap={{ scale: 0.95 }} 
            onClick={toggleCinemaMode} 
            className="fixed top-4 right-4 z-[999] w-10 h-10 liquid-glass-strong text-white/50 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 group"
            title="Sair do Modo Cinema"
         >
           <span className="text-sm font-bold group-hover:rotate-90 transition-transform duration-300">✕</span>
         </motion.button>
      )}
      {selectedUser && ( <UserCard user={selectedUser.user} platform={selectedUser.platform} messages={messages} onClose={() => setSelectedUser(null)} twitchCreds={twitchCreds} /> )}
      
      <ControlPanel 
        authState={authState} onToggleAuth={() => setIsSettingsOpen(true)}
        streamStats={streamStats}
        onOpenSettings={() => setIsSettingsOpen(true)} activePlayer={activePlayer} onSetPlayer={setActivePlayer} chatFilter={chatFilter} onSetChatFilter={setChatFilter}
        onSync={handleSyncPlayer} cinemaMode={chatSettings.cinemaMode} onToggleCinema={toggleCinemaMode} onOpenBookmarks={() => setIsBookmarksOpen(true)} hasCloudAccess={!!cloudUserId}
      />
      
      {/* --- MOBILE FLOATING CHAT FILTER (Only Visible on Mobile & when Player is 'Chat') --- */}
      <AnimatePresence>
        {activePlayer === 'none' && (
          <div className="md:hidden absolute top-[60px] left-0 right-0 z-40 flex justify-center pointer-events-none">
              <motion.div 
                 initial={{ opacity: 0, y: -20, scale: 0.9 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: -20, scale: 0.9 }}
                 transition={{ type: "spring", stiffness: 300, damping: 25 }}
                 className="pointer-events-auto"
              >
                  {/* Filter Pills - Animated Segmented Control for Mobile */}
                  <div className="flex items-center p-1.5 bg-black/70 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl relative z-0">
                     {[
                         { id: 'all', label: 'All', icon: null },
                         { id: 'twitch', label: null, icon: 'twitch' },
                         { id: 'kick', label: null, icon: 'kick' }
                     ].map((filter) => {
                         const isActive = chatFilter === filter.id;
                         let activeBg = 'bg-white/20 border-white/10';
                         if (filter.id === 'twitch') activeBg = 'bg-[#9146FF]/20 border-[#9146FF]/30';
                         if (filter.id === 'kick') activeBg = 'bg-[#53FC18]/20 border-[#53FC18]/30';
                         
                         return (
                             <button
                                key={filter.id}
                                onClick={() => setChatFilter(filter.id as any)}
                                className={`relative z-10 px-4 py-1.5 rounded-full text-[10px] font-bold transition-colors duration-200 flex items-center justify-center min-w-[40px] ${isActive ? (filter.id === 'twitch' ? 'text-[#9146FF]' : filter.id === 'kick' ? 'text-[#53FC18]' : 'text-white') : 'text-gray-400'}`}
                             >
                                 {isActive && (
                                     <motion.div
                                        layoutId="mobile-filter-active-bg"
                                        className={`absolute inset-0 rounded-full border ${activeBg} shadow-sm`}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        style={{ zIndex: -1 }}
                                     />
                                 )}
                                 {filter.label && <span className="relative z-10">{filter.label}</span>}
                                 {filter.icon && <PlatformIcon platform={filter.icon as any} className="w-3.5 h-3.5 relative z-10" />}
                             </button>
                         );
                     })}
                  </div>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        </div>

        <div className={`${activePlayer === 'none' ? 'w-full flex-1' : 'md:w-[380px] xl:w-[420px] w-full flex-1 md:flex-none'} bg-[#000000] border-t md:border-t-0 ${activePlayer !== 'none' ? 'md:border-l border-white/5' : ''} flex flex-col z-10 transition-all duration-500 ease-out-expo min-h-0 relative`}>
          <div className={`flex-1 overflow-y-auto custom-scrollbar relative px-2 pt-0 scroll-smooth ${canChat ? 'pb-[80px]' : 'pb-4'}`} ref={chatContainerRef} onScroll={handleScroll}>
            <div className="min-h-full flex flex-col justify-end">
                {visibleMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/20 space-y-2"><div className="text-2xl animate-pulse">⚡</div><p className="text-xs font-medium tracking-widest">CONECTANDO...</p></div>
                ) : (
                visibleMessages.filter(msg => {
                        if (chatFilter === 'twitch' && msg.platform !== Platform.TWITCH) return false;
                        if (chatFilter === 'kick' && msg.platform !== Platform.KICK) return false;
                        if (chatSettings.ignoredUsers.includes(msg.user.username.toLowerCase())) return false;
                        if (chatSettings.ignoredKeywords.some(kw => msg.content.toLowerCase().includes(kw))) return false;
                        return true;
                    }).map((msg, idx) => (
                    <ChatMessageItem key={msg.id} message={msg} index={idx} globalBadges={globalBadges} channelBadges={channelBadges} kickBadges={kickBadges} sevenTVEmotes={sevenTVEmotes} settings={chatSettings} currentUser={{ twitch: authState.twitchUsername, kick: authState.kickUsername }} onReply={handleReply} onUserClick={handleUserClick} avatarCache={avatarCache} onRequestAvatar={requestAvatar} onSaveMessage={handleSaveMessage} canSave={!!cloudUserId} />
                )))}
            </div>
            
            {/* Chat Paused Indicator - Moved closer to input */}
            <AnimatePresence>
            {isPaused && (
                <div className="sticky bottom-2 flex justify-center w-full z-20 pointer-events-none">
                    <motion.button initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={scrollToBottom} className="pointer-events-auto liquid-glass-strong px-6 py-2.5 rounded-full flex items-center gap-2 text-xs font-bold group hover:border-white/40 transition-colors">
                        {unreadCount > 0 ? ( <><span className="text-twitch group-hover:animate-pulse">↓</span><span>Ver {unreadCount} novas mensagens</span></> ) : ( <><span className="text-gray-400">⏸</span><span>Chat Pausado</span></> )}
                    </motion.button>
                </div>
            )}
            </AnimatePresence>
          </div>
          
          {canChat && (
              <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <div className={`relative flex items-center liquid-glass-strong rounded-full transition-all duration-300 ease-out-expo shadow-2xl ${commentPlatform === 'twitch' ? 'focus-within:border-twitch/50 focus-within:shadow-[0_0_30px_rgba(145,70,255,0.15)]' : 'focus-within:border-kick/50 focus-within:shadow-[0_0_30px_rgba(83,252,24,0.15)]'}`}>
                        <EmotePicker isOpen={isEmotePickerOpen} onClose={() => setIsEmotePickerOpen(false)} onSelect={handleEmoteSelect} sevenTVEmotes={sevenTVEmotes} twitchEmotes={twitchEmotes} />
                        <div className="pl-2 pr-1 py-1">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCommentPlatform(prev => prev === 'twitch' ? 'kick' : 'twitch')} className={`p-2 rounded-full transition-colors ${commentPlatform === 'twitch' ? 'bg-twitch/10 text-twitch hover:bg-twitch/20' : 'bg-kick/10 text-kick hover:bg-kick/20'}`}>
                                <PlatformIcon platform={commentPlatform} variant={commentPlatform === 'twitch' ? 'white' : 'default'} className="w-4 h-4" />
                            </motion.button>
                        </div>
                        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Enviar mensagem na ${commentPlatform}...`} className="w-full bg-transparent text-white px-2 py-3.5 text-sm focus:outline-none placeholder-white/30" />
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsEmotePickerOpen(!isEmotePickerOpen)} className={`p-2 transition-colors ${isEmotePickerOpen ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}><SmileyIcon className="w-5 h-5" /></motion.button>
                        <motion.button whileHover={{ scale: 1.1, rotate: -10 }} whileTap={{ scale: 0.9, rotate: 0 }} onClick={handleSendMessage} disabled={!chatInput.trim()} className={`p-2 mr-2 rounded-full transition-colors ${chatInput.trim() ? (commentPlatform === 'twitch' ? 'text-twitch hover:bg-twitch/10' : 'text-kick hover:bg-kick/10') : 'text-white/20 cursor-not-allowed'}`}><SendIcon className="w-5 h-5" /></motion.button>
                    </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}