import React, { useMemo, useEffect } from 'react';
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
  avatarCache: Record<string, string>;
  onRequestAvatar: (platform: Platform, user: User) => void;
}

// Improved Badge Styling: Larger size (20px), consistent spacing, and alignment correction
const BADGE_CLASS = "h-5 w-auto min-w-[20px] mr-1.5 inline-block align-middle select-none object-contain hover:brightness-125 hover:scale-110 transition-transform duration-200 ease-out-expo";

// Fallback Twitch badges (if API not connected)
const FALLBACK_TWITCH_BADGES: Record<string, string> = {
  'broadcaster': 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2',
  'moderator': 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2',
  'vip': 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2',
  'subscriber': 'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2',
  'premium': 'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/2',
  'turbo': 'https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e3428d80f/2',
};

// Inline SVGs for Kick Badges - High Definition & Vibrant Colors
const KickBadgeSVG: React.FC<{ type: string }> = ({ type }) => {
  const props = { className: BADGE_CLASS, viewBox: "0 0 24 24", fill: "currentColor" };
  
  switch (type) {
    case 'broadcaster':
      return (
         <svg {...props} className={`${BADGE_CLASS} text-[#53FC18] drop-shadow-[0_0_8px_rgba(83,252,24,0.4)]`}>
             <title>Broadcaster</title>
             <path d="M12 2L15 8H9L12 2ZM18 8H22V14H18V8ZM2 8H6V14H2V8ZM9 10H15V16H9V10ZM12 22C14.2091 22 16 20.2091 16 18H8C8 20.2091 9.79086 22 12 22Z" />
         </svg>
      );
    case 'moderator':
      return (
        <svg {...props} className={`${BADGE_CLASS} text-[#00E572] drop-shadow-[0_0_5px_rgba(0,229,114,0.3)]`}>
           <title>Moderator</title>
           <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H7V10.01H12V7.48L15.41 11L12 14.52V11.99Z" />
        </svg>
      ); 
    case 'vip':
      return (
        <svg {...props} fill="none" className={`${BADGE_CLASS} text-[#FF4081]`}>
             <title>VIP</title>
             <path d="M12 2L2 9L12 22L22 9L12 2Z" fill="currentColor" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );
    case 'verified':
      return (
        <svg {...props} className={`${BADGE_CLASS} text-[#53FC18]`}>
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
    onUserClick,
    avatarCache,
    onRequestAvatar
}) => {
  const isSystem = message.platform === Platform.SYSTEM;

  // Determine Avatar URL
  const avatarKey = `${message.platform}-${message.user.username}`;
  const displayAvatar = message.user.avatarUrl || avatarCache[avatarKey];

  // Effect: Fetch Avatar if missing and not hidden
  useEffect(() => {
    if (!settings.hideAvatars && !displayAvatar && !isSystem) {
       onRequestAvatar(message.platform, message.user);
    }
  }, [settings.hideAvatars, displayAvatar, isSystem, message.platform, message.user, onRequestAvatar]);


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
          if (message.platform === Platform.KICK) {
             if (['broadcaster', 'moderator', 'vip', 'verified', 'founder'].includes(badge.type)) {
                 return <KickBadgeSVG key={`${message.id}-badge-${idx}`} type={badge.type} />;
             }
             if (badge.type === 'subscriber' && kickBadges?.['subscriber']) {
                 const url = kickBadges['subscriber'][badge.version || '1'];
                 if (url) return <img key={idx} src={url} className={BADGE_CLASS} alt="sub" />;
             }
             if (badge.type === 'subscriber') {
                  // Fallback Text Badge for Kick Sub if image not loaded
                  return <span key={idx} className="bg-kick/20 text-kick border border-kick/30 text-[9px] px-1.5 rounded mr-1.5 font-bold inline-block align-middle h-5 leading-5 select-none">SUB</span>;
             }
             return null;
          }
          
          if (message.platform === Platform.TWITCH) {
              if (channelBadges && channelBadges[badge.type] && channelBadges[badge.type][badge.version || '1']) {
                  return <img key={idx} src={channelBadges[badge.type][badge.version || '1']} className={BADGE_CLASS} alt={badge.type} />;
              }
              if (globalBadges && globalBadges[badge.type] && globalBadges[badge.type][badge.version || '1']) {
                   return <img key={idx} src={globalBadges[badge.type][badge.version || '1']} className={BADGE_CLASS} alt={badge.type} />;
              }
              if (FALLBACK_TWITCH_BADGES[badge.type]) {
                  return <img key={idx} src={FALLBACK_TWITCH_BADGES[badge.type]} className={BADGE_CLASS} alt={badge.type} />;
              }
          }
          return null;
      });
  };

  // --- COMPLEX MESSAGE CONTENT PARSING ---
  // Handles: Twitch Native Ranges, Kick Regex [emote:id:name], and 7TV Words
  const renderContent = useMemo(() => {
      if (message.isDeleted) {
          if (settings.deletedMessageBehavior === 'hide') return null;
          return <span className="text-gray-500 italic line-through text-xs">&lt;mensagem deletada&gt;</span>;
      }

      // 1. Build an array of segments (text or react nodes)
      // If we have native twitch emotes, we must split by index
      let parts: (string | React.ReactNode)[] = [message.content];

      // --- PASS 1: NATIVE TWITCH EMOTES (by index) ---
      if (message.platform === Platform.TWITCH && message.emotes) {
          const sortedEmotes: { id: string, start: number, end: number }[] = [];
          Object.entries(message.emotes).forEach(([id, positions]) => {
              positions.forEach(pos => {
                  const [start, end] = pos.split('-').map(Number);
                  sortedEmotes.push({ id, start, end });
              });
          });
          
          // Sort descending to replace from end to start without messing up indices
          sortedEmotes.sort((a, b) => b.start - a.start);

          let currentText = message.content;
          const newParts: (string | React.ReactNode)[] = [];
          
          // We iterate through the string and carve out emotes
          // But actually, it's easier to map character array or use a library, 
          // For simplicity/perf in React, we'll assume non-overlapping ranges (guaranteed by Twitch)
          
          // Re-approach: split string by ranges
          // To do this efficiently in React, we need to build the array from start to end
          // So let's sort Ascending
          sortedEmotes.sort((a, b) => a.start - b.start);
          
          const result: (string | React.ReactNode)[] = [];
          let cursor = 0;

          sortedEmotes.forEach((emote, i) => {
               // Push text before emote
               if (emote.start > cursor) {
                   result.push(message.content.substring(cursor, emote.start));
               }
               
               // Push Emote
               const sizeClass = settings.largeEmotes ? "h-8" : "h-5";
               result.push(
                   <img 
                       key={`twitch-emote-${emote.id}-${i}`}
                       src={`https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`}
                       alt="emote"
                       className={`inline-block mx-0.5 align-middle hover:scale-110 transition-transform ${sizeClass}`}
                   />
               );
               
               cursor = emote.end + 1;
          });

          // Push remaining text
          if (cursor < message.content.length) {
              result.push(message.content.substring(cursor));
          }
          
          parts = result.length > 0 ? result : [message.content];
      }

      // --- PASS 2: KICK NATIVE EMOTES (Regex) ---
      // Pattern: [emote:1234:name]
      const processKickEmotes = (segment: string | React.ReactNode): (string | React.ReactNode)[] => {
          if (typeof segment !== 'string') return [segment];
          
          const kickRegex = /\[emote:(\d+):([\w\s-]+)\]/g;
          const split = segment.split(kickRegex);
          
          if (split.length === 1) return [segment];

          const res: (string | React.ReactNode)[] = [];
          let match;
          
          for (let i = 0; i < split.length; i++) {
              const part = split[i];
              
              if (i % 3 === 0) {
                  if (part) res.push(part);
              } else if (i % 3 === 1) {
                  const id = part;
                  const name = split[i+1]; // Next is name
                  const sizeClass = settings.largeEmotes ? "h-8" : "h-5";
                  res.push(
                       <img 
                           key={`kick-emote-${id}-${i}`}
                           src={`https://files.kick.com/emotes/${id}/fullsize`}
                           alt={name}
                           title={name}
                           className={`inline-block mx-0.5 align-middle hover:scale-110 transition-transform ${sizeClass}`}
                       />
                  );
              }
          }
          return res;
      };

      if (message.platform === Platform.KICK) {
          parts = parts.flatMap(processKickEmotes);
      }

      // --- PASS 3: 7TV EMOTES (Word replacement) ---
      // We only split STRINGS by space. Existing Nodes (images) are left alone.
      const process7TV = (segment: string | React.ReactNode): (string | React.ReactNode)[] => {
          if (typeof segment !== 'string') return [segment];
          
          const words = segment.split(' ');
          return words.map((word, i) => {
              const emoteUrl = sevenTVEmotes?.[word];
              if (emoteUrl) {
                  const sizeClass = settings.largeEmotes ? "h-8" : "h-5";
                  // Add a space after if it's not the last word, to maintain spacing
                  return (
                      <React.Fragment key={`7tv-${i}`}>
                        <img 
                            src={emoteUrl} 
                            alt={word} 
                            title={word}
                            className={`inline-block mx-0.5 align-middle hover:scale-110 transition-transform ${sizeClass}`} 
                        />
                        {i < words.length - 1 ? ' ' : ''}
                      </React.Fragment>
                  );
              }
              return i < words.length - 1 ? word + ' ' : word;
          });
      };

      return parts.flatMap(process7TV);
  }, [message.content, message.emotes, message.platform, message.isDeleted, sevenTVEmotes, settings.largeEmotes, settings.deletedMessageBehavior]);

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

  const initial = message.user.username.charAt(0).toUpperCase();

  const AvatarComponent = (
       <div className="flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all" onClick={handleAvatarClick}>
            {displayAvatar ? (
                <img src={displayAvatar} alt={message.user.username} className="w-[28px] h-[28px] rounded-full object-cover bg-gray-800" loading="lazy" />
            ) : (
                <div 
                className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[10px] font-bold text-white text-shadow-sm shadow-inner" 
                style={{ backgroundColor: usernameColor }}
                >
                    {initial}
                </div>
            )}
        </div>
  );

  // --- SPECIAL RENDER FOR SUBSCRIPTIONS ---
  if (message.isSubscription) {
      const isTwitch = message.platform === Platform.TWITCH;
      const subStyle = isTwitch 
        ? "bg-[#9146FF]/10 border-[#9146FF]" 
        : "bg-[#53FC18]/10 border-[#53FC18]";

      return (
        <div className={`group flex items-start gap-3 py-3 px-3 mx-1 my-2 rounded-lg border-l-4 relative transition-all animate-fade-in ${subStyle}`}>
             {/* Left: Avatar */}
             {!settings.hideAvatars && AvatarComponent}

             {/* Right: Content */}
             <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl leading-none">🎉</span>
                      <span className="font-bold text-white text-sm">
                          {message.user.username}
                          <span className={`opacity-80 font-medium ml-2 text-xs uppercase tracking-wide px-1.5 py-0.5 rounded ${isTwitch ? 'bg-[#9146FF]/30 text-[#d8b4fe]' : 'bg-[#53FC18]/30 text-[#a3f78a]'}`}>
                                {message.subMonths ? `Sub x${message.subMonths}` : 'Novo Sub'}
                          </span>
                      </span>
                  </div>
                  
                  {/* Badge Row */}
                  <div className="mb-1 opacity-90 scale-100 origin-left">
                      {renderBadges()}
                  </div>

                  {/* Message Body */}
                  <div className={`text-white/90 break-words leading-snug font-medium text-sm`}>
                       {renderContent}
                  </div>
             </div>
        </div>
      );
  }

  // --- STANDARD RENDER ---
  return (
    <div className={`group flex items-start gap-2 py-1 px-2 transition-colors relative ${zebraClass} ${hoverClass} ${mentionClass} ${deletedClass}`}>
      
      {/* 1. LEFT: AVATAR */}
      {!settings.hideAvatars && AvatarComponent}

      {/* 2. RIGHT: CONTENT */}
      <div className="flex-1 min-w-0 overflow-hidden">

          {/* Reply Context Block - CLEANER STYLE */}
          {message.replyTo && (
              <div className="flex items-center gap-1.5 mb-0.5 ml-0.5 opacity-60 select-none group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1 bg-white/5 rounded-md pl-1 pr-2 py-0.5 border-l-2 border-gray-500">
                      <span className="text-[10px] text-gray-400">↪</span>
                      <span className="text-[10px] font-bold text-gray-300">@{message.replyTo.username}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 italic truncate max-w-[200px]">
                       {message.replyTo.content}
                  </span>
              </div>
          )}
          
          {/* Main Message Line - INLINE FLOW */}
          <div className={`break-words leading-snug ${textSizeClass} ${fontClass}`}>
              
              {/* Metadata Wrapper */}
              <span className="inline-block mr-1.5 select-none align-middle">
                  {/* Timestamp */}
                  {settings.showTimestamps && (
                      <span className="text-[10px] text-gray-500 font-mono mr-1.5">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                  )}

                  {/* Platform Icon */}
                  <span className="opacity-40 group-hover:opacity-100 transition-opacity inline-block mr-1.5 align-middle">
                      <PlatformIcon platform={platformIcon} className="w-3.5 h-3.5" />
                  </span>

                  {/* Badges - Rendered Inline */}
                  {renderBadges()}
              </span>
              
              {/* Username */}
              <button 
                  onClick={() => onReply(message.user.username)}
                  className={`font-bold hover:underline cursor-pointer align-middle mr-0.5 ${settings.rainbowUsernames ? 'rainbow-text' : ''}`}
                  style={{ color: settings.rainbowUsernames ? undefined : usernameColor }}
              >
                  {message.user.username}
              </button>

              {/* First Message Badge - TEXT TAG */}
              {message.isFirstMessage && (
                   <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[9px] px-1.5 rounded-sm uppercase font-bold tracking-wider ml-2 inline-block align-middle select-none whitespace-nowrap">
                     Primeira interação
                   </span>
              )}

              {/* Separator */}
              <span className="mr-1.5 text-white/40 font-normal align-middle">:</span>

              {/* Message Content */}
              <span className="text-white/90 align-middle">
                   {renderContent}
              </span>
          </div>
      </div>

      {/* Separator Line (Optional) */}
      {settings.showSeparator && (
          <div className="absolute bottom-0 left-2 right-2 h-px bg-white/5"></div>
      )}
    </div>
  );
});
