
export enum Platform {
  TWITCH = 'Twitch',
  KICK = 'Kick',
  SYSTEM = 'System'
}

export interface Badge {
  type: string;
  version?: string;
  url?: string; // URL for the specific badge image
}

export interface User {
  username: string;
  badges: Badge[]; 
  color?: string;
}

export interface ReplyInfo {
  id: string;
  username: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  platform: Platform;
  user: User;
  content: string;
  timestamp: number;
  emotes?: Record<string, string[]>;
  replyTo?: ReplyInfo;
  isDeleted?: boolean;
  
  // New flags
  isFirstMessage?: boolean; // Highlight first time chatters in session
  isSubscription?: boolean; // Highlight sub/resub events
  subMonths?: number; // Context for subs
}

export interface ChatSettings {
  showTimestamps: boolean;
  hideAvatars: boolean;
  fontSize: 'small' | 'medium' | 'large';
  hideSystemMessages: boolean;
  deletedMessageBehavior: 'hide' | 'strikethrough';
  
  // BTTV/7TV Style features
  alternatingBackground: boolean; // Zebra striping
  highlightMentions: boolean; // Highlight your name
  fontFamily: 'sans' | 'mono';
  showSeparator: boolean; // Line between messages
  rainbowUsernames: boolean; // Animated gradient usernames
  
  // New Features
  smoothScroll: boolean; // Toggle smooth vs instant scroll
  pauseOnHover: boolean; // (Optional logic)
  
  // Badge Filters
  showBadgeBroadcaster: boolean;
  showBadgeMod: boolean;
  showBadgeVip: boolean;
  showBadgeSub: boolean;
  showBadgeFounder: boolean;
  
  // Moderation & Visual features
  largeEmotes: boolean;
  ignoredUsers: string[];
  ignoredKeywords: string[];
}

export interface StreamStats {
  kickViewers: number | null;
  twitchViewers: number | null;
  isLiveKick: boolean;
  isLiveTwitch: boolean;
}

export interface AuthState {
  twitch: boolean;
  kick: boolean;
  twitchUsername?: string;
  kickUsername?: string;
  kickAccessToken?: string; // Token for API calls (OAuth)
}

// Map: BadgeSetID -> VersionID -> ImageURL
export type BadgeMap = Record<string, Record<string, string>>;

// Map: EmoteName -> ImageURL
export type EmoteMap = Record<string, string>;

export interface TwitchCreds {
  clientId: string;
  accessToken: string;
}
