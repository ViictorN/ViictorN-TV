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
}

export interface ChatSettings {
  showTimestamps: boolean;
  hideAvatars: boolean;
  fontSize: 'small' | 'medium' | 'large';
  hideSystemMessages: boolean;
  deletedMessageBehavior: 'hide' | 'strikethrough';
  // New BTTV/7TV Style features
  alternatingBackground: boolean; // Zebra striping
  highlightMentions: boolean; // Highlight your name
  fontFamily: 'sans' | 'mono';
  showSeparator: boolean; // Line between messages
  rainbowUsernames: boolean; // Animated gradient usernames
  
  // New Moderation & Visual features
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