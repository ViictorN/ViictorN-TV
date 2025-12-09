import React, { useMemo } from 'react';
import { ChatMessage, Platform, Badge, BadgeMap, EmoteMap, ChatSettings, User } from '../types';
import { PlatformIcon } from './Icons';

interface Props {
  message: ChatMessage;
  index: number;
  globalBadges?: BadgeMap;
  channelBadges?: BadgeMap;
  kickBadges?: BadgeMap;
  sevenTVEmotes?: EmoteMap;
  settings: ChatSettings;
  currentUser: {
      twitch?: string;
      kick?: string;
  };
  onReply: (username: string) => void;
  onUserClick: (user: User, platform: Platform) => void;
}

// Unified Badge Styling
const BADGE_CLASS = "h-4 w-auto mr-1 inline-block align-middle select-none object-contain";

// Fallback Twitch badges (if API not connected)
const FALLBACK_TWITCH_BADGES: Record<string, string> = {
  'broadcaster': 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2',
  'moderator': 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2',
  'vip': 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2',
  'subscriber': 'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2',
  'premium': 'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/2',
  'turbo': 'https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e3428d80f/2',
};

// Inline SVGs for Kick Badges
const KickBadgeSVG: React.FC<{ type: string }> = ({ type }) => {
  const props = { className: BADGE_CLASS, viewBox: "0 0 24 24", fill: "currentColor" };
  
  switch (type) {
    case 'broadcaster':
      return (
         <svg {...props} className={`${BADGE_CLASS} text-kick`}>
             <title>Broadcaster</title>
             <path d="M12 2L15 8H9L12 2ZM18 8H22V14H18V8ZM2 8H6V14H2V8ZM9 10H15V16H9V10ZM12 22C14.2091 22 16 20.2091 16 18H8C8 20.2091 9.79086 22 12 22Z" />
         </svg>
      );
    case 'moderator':
      return (
        <svg {...props} className={`${BADGE_CLASS} text-[#00D26A]`}>
           <title>Moderator</title>
           <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H7V10.01H12V7.48L15.41 11L12 14.52V11.99Z" />
        </svg>
      ); 
    case 'vip':
      return (
        <svg {...props} fill="none" className={`${BADGE_CLASS} text-[#F06292]`}>
             <title>VIP</title>
             <path d="M12 2L2 9L12 22L22 9L12 2Z" fill="currentColor" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );
    case 'verified':
      return (
        <svg {...props} className={`${BADGE_CLASS} text-kick`}>
            <title>Verified</title>
            <path d="M23 12L20.56 9.21L20.9 5.52L17.29 4.7L15.4 1.5L12 2.96L8.6 1.5L6.71 4.69L3.1 5.5L3.44 9.2L1 12L3.44 14.79L3.1 18.49L6.71 19.31L8.6 22.5L12 21.03L15.4 22.49L17.29 19.3L20.9 18.48L20.56 14.79L23 12ZM10.09 16.72L6.29 12.91L7.7 11.5L10.09 13.88L16.29 7.69L17.7 9.1L10.09 16.72Z" />
        </svg>
      );
    case 'founder':
      return (
        <svg {...props} className={`${BADGE_CLASS} text-[#FF5252]`}>
            <title>Founder</title>
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="white" strokeWidth="1" />
        </svg>
      );
    default: return null;
  }
};

export const ChatMessageItem: React.FC<Props> = React.memo(({ 
    message, 
    index, 
    globalBadges, 
    channelBadges, 
    kickBadges, 
    sevenTVEmotes, 
    settings, 
    currentUser, 
    onReply,
    onUserClick
}) => {
  const isSystem = message.platform === Platform.SYSTEM;

  // Render System Message
  if (isSystem) {
      if (settings.hideSystemMessages) return null;
      return (
          <div className="py-1 px-4 text-xs text-gray-500 italic flex items-center gap-2 border-l-2 border-transparent hover:bg-white/5 transition-colors">
              <span>⚙️</span>
              {message.content}
          </div>
      );
  }

  // --- BADGE RENDERING LOGIC ---
  const renderBadges = () => {
      // 1. Filter Badges based on Settings
      const filteredBadges = message.user.badges.filter(b => {
          if (!settings.showBadgeBroadcaster && b.type === 'broadcaster') return false;
          if (!settings.showBadgeMod && b.type === 'moderator') return false;
          if (!settings.showBadgeVip && b.type === 'vip') return false;
          if (!settings.showBadgeSub && (b.type === 'subscriber' || b.type === 'founder')) return false;
          if (!settings.showBadgeFounder && b.type === 'founder') return false;
          return true;
      });

      return filteredBadges.map((badge, idx) => {
          // KICK BADGES
          if (message.platform === Platform.KICK) {
             // 1. Native Kick Badges (SVG)
             if (['broadcaster', 'moderator', 'vip', 'verified', 'founder'].includes(badge.type)) {
                 return <KickBadgeSVG key={`${message.id}-badge-${idx}`} type={badge.type} />;
             }
             // 2. Kick Subscriber (Image from API)
             if (badge.type === 'subscriber' && kickBadges?.['subscriber']) {
                 const months = parseInt(badge.version || '1');
                 // Find closest month badge (logic: find badge <= months)
                 // Simple approach: direct lookup or default
                 const url = kickBadges['subscriber'][badge.version || '1'];
                 if (url) return <img key={idx} src={url} className={BADGE_CLASS} alt="sub" />;
             }
             // Fallback Kick Sub
             if (badge.type === 'subscriber') {
                  return <span key={idx} className="bg-kick text-black text-[9px] px-1 rounded mr-1 font-bold">SUB</span>;
             }
             return null;
          }
          
          // TWITCH BADGES
          if (message.platform === Platform.TWITCH) {
              // 1. Try Channel Badges (Sub, Bits)
              if (channelBadges && channelBadges[badge.type] && channelBadges[badge.type][badge.version || '1']) {
                  return <img key={idx} src={channelBadges[badge.type][badge.version || '1']} className={BADGE_CLASS} alt={badge.type} />;
              }
              // 2. Try Global Badges (Turbo, Prime, etc)
              if (globalBadges && globalBadges[badge.type] && globalBadges[badge.type][badge.version || '1']) {
                   return <img key={idx} src={globalBadges[badge.type][badge.version || '1']} className={BADGE_CLASS} alt={badge.type} />;
              }
              // 3. Fallback to Hardcoded URLs (if API failed)
              if (FALLBACK_TWITCH_BADGES[badge.type]) {
                  return <img key={idx} src={FALLBACK_TWITCH_BADGES[badge.type]} className={BADGE_CLASS} alt={badge.type} />;
              }
          }
          return null;
      });
  };

  // --- MESSAGE CONTENT PARSING (7TV) ---
  const renderContent = () => {
      if (message.isDeleted) {
          if (settings.deletedMessageBehavior === 'hide') return null;
          return <span className="text-gray-500 italic line-through text-xs">&lt;mensagem deletada&gt;</span>;
      }

      // 1. Check for 7TV Emotes (Split by words)
      const words = message.content.split(' ');
      
      return words.map((word, i) => {
          // Check if word is a 7TV emote
          if (sevenTVEmotes && sevenTVEmotes[word]) {
               const sizeClass = settings.largeEmotes ? "h-8" : "h-5";
               return (
                   <img 
                    key={i} 
                    src={sevenTVEmotes[word]} 
                    alt={word} 
                    title={word}
                    className={`inline-block mx-0.5 align-middle hover:scale-110 transition-transform ${sizeClass}`} 
                   />
               );
          }

          // Check if word is a Native Twitch Emote (if provided in payload)
          // Twitch IRC sends parsing info, but we also just have text. 
          // If native parsing was robust we'd use parsing ranges.
          // For now, text fallback is fine, assuming 7TV covers most visual needs.

          return <span key={i}>{word} </span>;
      });
  };

  // --- STYLES ---
  const isMention = settings.highlightMentions && (
      (currentUser.twitch && message.content.toLowerCase().includes(currentUser.twitch.toLowerCase())) ||
      (currentUser.kick && message.content.toLowerCase().includes(currentUser.kick.toLowerCase()))
  );

  const zebraClass = settings.alternatingBackground && index % 2 === 0 ? 'bg-white/[0.02]' : '';
  const hoverClass = 'hover:bg-white/5';
  const mentionClass = isMention ? 'bg-red-500/20 border-l-2 border-red-500' : 'border-l-2 border-transparent';
  const deletedClass = message.isDeleted && settings.deletedMessageBehavior === 'hide' ? 'hidden' : '';

  const usernameColor = message.user.color || (message.platform === Platform.TWITCH ? '#9146FF' : '#53FC18');
  const platformIcon = message.platform === Platform.TWITCH ? 'twitch' : 'kick';
  
  // Font Size
  let textSizeClass = "text-sm";
  if (settings.fontSize === 'small') textSizeClass = "text-xs";
  if (settings.fontSize === 'large') textSizeClass = "text-base";
  
  // Font Family
  const fontClass = settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans';

  // Avatar Logic
  const handleAvatarClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onUserClick(message.user, message.platform);
  };

  const avatarUrl = message.user.avatarUrl;
  const initial = message.user.username.charAt(0).toUpperCase();

  return (
    <div className={`group flex items-start gap-2 py-1 px-2 transition-colors relative ${zebraClass} ${hoverClass} ${mentionClass} ${deletedClass}`}>
      
      {/* 1. LEFT: AVATAR (NEW) */}
      {!settings.hideAvatars && (
          <div className="flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all" onClick={handleAvatarClick}>
               {avatarUrl ? (
                   <img src={avatarUrl} alt={message.user.username} className="w-[28px] h-[28px] rounded-full object-cover bg-gray-800" />
               ) : (
                   <div 
                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-bold text-white text-shadow-sm shadow-inner" 
                    style={{ backgroundColor: usernameColor }}
                   >
                       {initial}
                   </div>
               )}
          </div>
      )}

      {/* 2. RIGHT: CONTENT */}
      <div className="flex-1 min-w-0 overflow-hidden">
          
          {/* Metadata Line */}
          <div className="flex items-center flex-wrap gap-x-1 leading-snug">
              
              {/* Timestamp */}
              {settings.showTimestamps && (
                  <span className="text-[10px] text-gray-500 font-mono mr-1">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
              )}

              {/* Platform Icon (Small indicator) */}
              <div className="opacity-50 group-hover:opacity-100 transition-opacity">
                  <PlatformIcon platform={platformIcon} className="w-3 h-3 inline-block mr-1 align-middle" />
              </div>

              {/* Badges */}
              <span className="inline-flex items-center align-middle">{renderBadges()}</span>
              
              {/* Username */}
              <button 
                  onClick={() => onReply(message.user.username)}
                  className={`font-bold hover:underline cursor-pointer align-middle mr-1 ${settings.rainbowUsernames ? 'rainbow-text' : ''}`}
                  style={{ color: settings.rainbowUsernames ? undefined : usernameColor }}
              >
                  {message.user.username}
              </button>
              
              {/* Reply Indicator (if exists) */}
              {message.replyTo && (
                  <span className="text-[10px] text-gray-500 bg-white/5 px-1 rounded flex items-center gap-1 align-middle">
                      <span>↪</span>
                      <span>{message.replyTo.username}</span>
                  </span>
              )}
          </div>
          
          {/* Message Content */}
          <div className={`text-white/90 break-words leading-snug mt-0.5 ${textSizeClass} ${fontClass} ${message.isSubscription ? 'text-yellow-300 font-bold' : ''}`}>
               {renderContent()}
          </div>
      </div>

      {/* Separator Line (Optional) */}
      {settings.showSeparator && (
          <div className="absolute bottom-0 left-2 right-2 h-px bg-white/5"></div>
      )}
    </div>
  );
});
