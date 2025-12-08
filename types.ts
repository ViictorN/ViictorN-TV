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

export interface ChatMessage {
  id: string;
  platform: Platform;
  user: User;
  content: string;
  timestamp: number;
  emotes?: Record<string, string[]>;
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
}

// Map: BadgeSetID -> VersionID -> ImageURL
export type BadgeMap = Record<string, Record<string, string>>;

// Map: EmoteName -> ImageURL
export type EmoteMap = Record<string, string>;

export interface TwitchCreds {
  clientId: string;
  accessToken: string;
}