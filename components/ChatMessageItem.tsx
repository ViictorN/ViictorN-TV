import React, { useMemo, useEffect, useState } from 'react';
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

// Improved Badge Styling: Clean, no shadow, consistent size
const BADGE_CLASS = "h-[18px] w-auto min-w-[18px] mr-1 inline-block align-middle select-none object-contain hover:scale-110 transition-transform duration-200 ease-out-expo";

// Fallback Twitch badges
const FALLBACK_TWITCH_BADGES: Record<string, string> = {
  'broadcaster': 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2',
  'moderator': 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2',
  'vip': 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2',
  'subscriber': 'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2',
  'premium': 'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/2',
  'turbo': 'https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e3428d80f/2',
};

// --- KICK OFFICIAL SVG BADGES ---
// Re-created as SVGs to ensure they never break and look crisp.
const KickBadgeSVG: React.FC<{ type: string }> = ({ type }) => {
    switch(type) {
        case 'broadcaster': // Host / Anchor
            return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <title>Broadcaster</title>
                    <rect width="20" height="20" rx="4" fill="#53FC18"/>
                    <path d="M10 5V15M7 8L10 5L13 8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        case 'moderator': // Green Shield with Swords
             return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <title>Moderator</title>
                     <path d="M10 2L3 5V11C3 15.5 6 18.5 10 19.5C14 18.5 17 15.5 17 11V5L10 2Z" fill="#00E572"/>
                     <path d="M10 6V14M7 9L13 9" stroke="black" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
             );
        case 'vip': // Pink Diamond
            return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <title>VIP</title>
                    <path d="M10 2L18 8L10 18L2 8L10 2Z" fill="#FF4081"/>
                    <path d="M10 2L10 18M2 8L18 8" stroke="white" strokeWidth="0.5" strokeOpacity="0.5"/>
                </svg>
            );
        case 'verified': // Green Check
            return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <title>Verified</title>
                     <path d="M10 2L12.4 4.6L16 5.2L15.6 8.8L18 11.5L15.6 14.2L16 17.8L12.4 18.4L10 21L7.6 18.4L4 17.8L4.4 14.2L2 11.5L4.4 8.8L4 5.2L7.6 4.6L10 2Z" fill="#53FC18"/>
                     <path d="M7 11L9 13L13 8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        case 'founder': // OG Badge
             return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <title>Founder</title>
                    <rect width="20" height="20" rx="4" fill="#F5C400"/>
                    <path d="M5 10C5 7.23858 7.23858 5 10 5C12.7614 5 15 7.23858 15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10ZM10 7C8.34315 7 7 8.34315 7 10C7 11.6569 8.34315 13 10 13C11.6569 13 13 11.6569 13 10C13 8.34315 11.6569 7 10 7Z" fill="black"/>
                </svg>
            );
        case 'subscriber': // Subscriber Star
            return (
                 <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <title>Subscriber</title>
                    <rect width="20" height="20" rx="4" fill="#53FC18" fillOpacity="0.2"/>
                    <path d="M10 2L12.5 7L18 8L14 12L15 17L10 14.5L5 17L6 12L2 8L7.5 7L10 2Z" fill="#53FC18"/>
                </svg>
            );
        case 'sub_gifter':
            return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <title>Gifter</title>
                     <rect width="20" height="20" rx="4" fill="#9146FF"/>
                     <path d="M10 5V15M5 10H15" stroke="white" strokeWidth="2"/>
                </svg>
            );
        default:
            return null;
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
  const [imageError, setImageError] = useState(false);
  const isSystem = message.platform === Platform.SYSTEM;

  // Determine Avatar URL
  const avatarKey = `${message.platform}-${message.user.username}`;
  let displayAvatar = message.user.avatarUrl || avatarCache[avatarKey];

  // FIX FOR KICK AVATARS:
  // We use wsrv.nl proxy to bypass CORS on files.kick.com.
  // We check if it is already proxied to avoid double-wrapping.
  if (message.platform === Platform.KICK && displayAvatar && !displayAvatar.includes('wsrv.nl')) {
      // Decode potential double encoding
      const cleanUrl = decodeURIComponent(displayAvatar);
      displayAvatar = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=64&h=64&fit=cover&output=webp`;
  }

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
          // --- KICK BADGES ---
          if (message.platform === Platform.KICK) {
             const key = `${message.id}-kbadge-${idx}`;
             
             // Check if we have an official SVG for this badge type
             if (['broadcaster', 'moderator', 'vip', 'verified', 'founder', 'sub_gifter'].includes(badge.type)) {
                 return <KickBadgeSVG key={key} type={badge.type} />;
             }
             
             // Subscriber Badge (Try dynamic image first, then fallback to SVG)
             if (badge.type === 'subscriber') {
                 if (kickBadges?.['subscriber'] && kickBadges['subscriber'][badge.version || '1']) {
                     const url = kickBadges['subscriber'][badge.version || '1'];
                     return <img key={key} src={url} className={BADGE_CLASS} alt="sub" />;
                 }
                 // Fallback SVG if image fails or not loaded
                 return <KickBadgeSVG key={key} type="subscriber" />;
             }
             
             return null;
          }
          
          // --- TWITCH BADGES ---
          if (message.platform === Platform.TWITCH) {
              const key = `${message.id}-tbadge-${idx}`;
              if (channelBadges && channelBadges[badge.type] && channelBadges[badge.type][badge.version || '1']) {
                  return <img key={key} src={channelBadges[badge.type][badge.version || '1']} className={BADGE_CLASS} alt={badge.type} />;
              }
              if (globalBadges && globalBadges[badge.type] && globalBadges[badge.type][badge.version || '1']) {
                   return <img key={key} src={globalBadges[badge.type][badge.version || '1']} className={BADGE_CLASS} alt={badge.type} />;
              }
              if (FALLBACK_TWITCH_BADGES[badge.type]) {
                  return <img key={key} src={FALLBACK_TWITCH_BADGES[badge.type]} className={BADGE_CLASS} alt={badge.type} />;
              }
          }
          return null;
      });
  };

  // --- COMPLEX MESSAGE CONTENT PARSING ---
  const renderContent = useMemo(() => {
      if (message.isDeleted) {
          if (settings.deletedMessageBehavior === 'hide') return null;
          return <span className="text-gray-500 italic line-through text-xs">&lt;mensagem deletada&gt;</span>;
      }

      let parts: (string | React.ReactNode)[] = [message.content];

      // --- PASS 1: NATIVE TWITCH EMOTES ---
      if (message.platform === Platform.TWITCH && message.emotes) {
          const sortedEmotes: { id: string, start: number, end: number }[] = [];
          Object.entries(message.emotes).forEach(([id, positions]) => {
              (positions as string[]).forEach(pos => {
                  const [start, end] = pos.split('-').map(Number);
                  sortedEmotes.push({ id, start, end });
              });
          });
          
          sortedEmotes.sort((a, b) => a.start - b.start);
          
          const result: (string | React.ReactNode)[] = [];
          let cursor = 0;

          sortedEmotes.forEach((emote, i) => {
               if (emote.start > cursor) {
                   result.push(message.content.substring(cursor, emote.start));
               }
               
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

          if (cursor < message.content.length) {
              result.push(message.content.substring(cursor));
          }
          parts = result.length > 0 ? result : [message.content];
      }

      // --- PASS 2: KICK NATIVE EMOTES ---
      const processKickEmotes = (segment: string | React.ReactNode): (string | React.ReactNode)[] => {
          if (typeof segment !== 'string') return [segment];
          
          const kickRegex = /\[emote:(\d+):([\w\s-]+)\]/g;
          const split = segment.split(kickRegex);
          
          if (split.length === 1) return [segment];

          const res: (string | React.ReactNode)[] = [];
          
          for (let i = 0; i < split.length; i++) {
              const part = split[i];
              if (i % 3 === 0) {
                  if (part) res.push(part);
              } else if (i % 3 === 1) {
                  const id = part;
                  const name = split[i+1];
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

      // --- PASS 3: 7TV EMOTES ---
      const process7TV = (segment: string | React.ReactNode): (string | React.ReactNode)[] => {
          if (typeof segment !== 'string') return [segment];
          if (!sevenTVEmotes || Object.keys(sevenTVEmotes).length === 0) return [segment];

          const words = segment.split(' ');
          const result: (string | React.ReactNode)[] = [];
          
          words.forEach((word, i) => {
              const emoteUrl = sevenTVEmotes[word];
              if (emoteUrl) {
                   const sizeClass = settings.largeEmotes ? "h-8" : "h-5";
                   result.push(
                       <img 
                           key={`7tv-${i}-${word}`}
                           src={emoteUrl} 
                           alt={word} 
                           title={word}
                           className={`inline-block mx-0.5 align-middle hover:scale-110 transition-transform ${sizeClass}`} 
                       />
                   );
                   if (i < words.length - 1) result.push(' ');
              } else {
                   result.push(word + (i < words.length - 1 ? ' ' : ''));
              }
          });
          return result;
      };

      return parts.flatMap(process7TV);
  }, [message.content, message.emotes, message.platform, message.isDeleted, sevenTVEmotes, settings.largeEmotes, settings.deletedMessageBehavior]);

  // --- STYLES ---
  const isMention = settings.highlightMentions && (
      (currentUser.twitch && message.content.toLowerCase().includes(currentUser.twitch.toLowerCase())) ||
      (currentUser.kick && message.content.toLowerCase().includes(currentUser.kick.toLowerCase()))
  );

  const zebraClass = settings.alternatingBackground && index % 2 === 0 ? 'bg-white/[0.02]' : '';
  const hoverClass = 'hover:liquid-glass transition-all duration-300';
  
  // Updated Mention Class: Glass effect instead of flat red
  const mentionClass = isMention ? 'liquid-glass border-l-2 border-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]' : 'border-l-2 border-transparent';
  const deletedClass = message.isDeleted && settings.deletedMessageBehavior === 'hide' ? 'hidden' : '';

  const usernameColor = message.user.color || (message.platform === Platform.TWITCH ? '#9146FF' : '#53FC18');
  const platformIcon = message.platform === Platform.TWITCH ? 'twitch' : 'kick';
  
  let textSizeClass = "text-sm";
  if (settings.fontSize === 'small') textSizeClass = "text-xs";
  if (settings.fontSize === 'large') textSizeClass = "text-base";
  
  const fontClass = settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans';

  // Avatar Logic
  const handleAvatarClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onUserClick(message.user, message.platform);
  };

  const initial = message.user.username.charAt(0).toUpperCase();

  const AvatarComponent = (
       <div className="flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-80 active:scale-95 transition-all" onClick={handleAvatarClick}>
            {displayAvatar && !imageError ? (
                <img 
                    src={displayAvatar} 
                    alt={message.user.username} 
                    className="w-[28px] h-[28px] rounded-full object-cover bg-gray-800 shadow-sm" 
                    loading="lazy" 
                    onError={() => setImageError(true)}
                />
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

  // --- SUBSCRIPTIONS ---
  if (message.isSubscription) {
      const isTwitch = message.platform === Platform.TWITCH;
      const subStyle = isTwitch 
        ? "liquid-glass border-l-4 border-l-[#9146FF]" 
        : "liquid-glass border-l-4 border-l-[#53FC18]";

      return (
        <div className={`group flex items-start gap-3 py-3 px-3 mx-1 my-2 rounded-lg relative transition-all animate-fade-in shadow-lg ${subStyle}`}>
             {!settings.hideAvatars && AvatarComponent}
             <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl leading-none">🎉</span>
                      <span className="font-bold text-white text-sm">
                          {message.user.username}
                          <span className={`opacity-80 font-medium ml-2 text-xs uppercase tracking-wide px-1.5 py-0.5 rounded shadow-sm ${isTwitch ? 'bg-[#9146FF] text-white' : 'bg-[#53FC18] text-black'}`}>
                                {message.subMonths ? `Sub x${message.subMonths}` : 'Novo Sub'}
                          </span>
                      </span>
                  </div>
                  <div className="mb-1 opacity-90 scale-100 origin-left">
                      {renderBadges()}
                  </div>
                  <div className={`text-white/90 break-words leading-snug font-medium text-sm`}>
                       {renderContent}
                  </div>
             </div>
        </div>
      );
  }

  // --- STANDARD RENDER ---
  return (
    <div className={`group flex items-start gap-2 py-1 px-2 relative border-b border-transparent hover:border-white/5 ${zebraClass} ${hoverClass} ${mentionClass} ${deletedClass}`}>
      
      {!settings.hideAvatars && AvatarComponent}

      <div className="flex-1 min-w-0 overflow-hidden">
          {message.replyTo && (
              <div className="flex items-center gap-2 mb-1 ml-0.5">
                  {/* Connector Line */}
                  <div className="w-3 h-3 border-l-2 border-t-2 border-gray-500 rounded-tl-lg mt-2"></div>
                  
                  {/* Reply Bubble - UPDATED TO LIQUID GLASS */}
                  <div className="flex items-center gap-2 liquid-glass rounded-md pl-1.5 pr-2 py-1 max-w-full backdrop-blur-md">
                      <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-gray-400 select-none">@</span>
                          <span className="text-[10px] font-bold text-white">{message.replyTo.username}</span>
                      </div>
                      <span className="text-[10px] text-gray-300 truncate max-w-[150px] md:max-w-[250px] border-l border-white/20 pl-2">
                           {message.replyTo.content}
                      </span>
                  </div>
              </div>
          )}
          
          <div className={`break-words leading-snug ${textSizeClass} ${fontClass}`}>
              
              <span className="inline-block mr-1.5 select-none align-middle">
                  {settings.showTimestamps && (
                      <span className="text-[10px] text-gray-500 font-mono mr-1.5">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                  )}

                  <span className="opacity-80 group-hover:opacity-100 transition-opacity inline-block mr-1.5 align-middle">
                      <PlatformIcon platform={platformIcon} variant="glow" className="w-3.5 h-3.5" />
                  </span>

                  {renderBadges()}
              </span>
              
              <button 
                  onClick={() => onReply(message.user.username)}
                  className={`font-bold hover:underline cursor-pointer align-middle mr-0.5 ${settings.rainbowUsernames ? 'rainbow-text' : ''}`}
                  style={{ color: settings.rainbowUsernames ? undefined : usernameColor }}
              >
                  {message.user.username}
              </button>

              {message.isFirstMessage && message.platform !== Platform.KICK && (
                   <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[9px] px-1.5 rounded-sm uppercase font-bold tracking-wider ml-2 inline-block align-middle select-none whitespace-nowrap">
                     Primeira interação
                   </span>
              )}

              <span className="mr-1.5 text-white/40 font-normal align-middle">:</span>

              <span className="text-white/90 align-middle">
                   {renderContent}
              </span>
          </div>
      </div>

      {settings.showSeparator && (
          <div className="absolute bottom-0 left-2 right-2 h-px bg-white/5"></div>
      )}
    </div>
  );
});