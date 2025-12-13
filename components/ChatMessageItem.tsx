import React, { useMemo, useEffect, useState } from 'react';
import { ChatMessage, Platform, Badge, BadgeMap, EmoteMap, ChatSettings, User } from '../types';
import { PlatformIcon } from './Icons';
import { motion } from 'framer-motion';

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
  onSaveMessage?: (msg: ChatMessage) => void; 
  canSave?: boolean; 
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

// --- KICK BADGES (SVG RE-IMPLEMENTATION) ---
// Restoring SVGs to prevent broken images, styled to match Kick's Pixel Art aesthetic
const KickBadgeSVG: React.FC<{ type: string }> = ({ type }) => {
    switch(type) {
        case 'broadcaster': // Pink/Purple Microphone
            return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <title>Broadcaster</title>
                    <path d="M7 3H13V11H7V3Z" fill="#D32CE6"/>
                    <path d="M9 11V13H11V11H9Z" fill="#D32CE6"/>
                    <path d="M6 13H14V14H6V13Z" fill="#D32CE6"/>
                    <path d="M6 3H7V11H6V3Z" fill="#9014A8"/> {/* Shading */}
                </svg>
            );
        case 'moderator': // Green Sword
             return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <title>Moderator</title>
                     {/* Blade */}
                     <path d="M14 4L16 2L17 3L15 5L14 4Z" fill="#00E572"/>
                     <path d="M13 5L15 3L6 12L4 10L13 5Z" fill="#00E572"/>
                     {/* Hilt */}
                     <path d="M3 11L6 14L5 15L2 12L3 11Z" fill="#00A855"/> 
                     <path d="M5 13L7 11L8 12L6 14L5 13Z" fill="#00E572"/>
                </svg>
             );
        case 'vip': // Orange/Gold Crown
            return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <title>VIP</title>
                    <path d="M4 6L6 14H14L16 6L10 9L4 6Z" fill="#FFC107"/>
                    <rect x="4" y="14" width="12" height="2" fill="#FFA000"/>
                </svg>
            );
        case 'verified': // Green Check
            return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <title>Verified</title>
                     <path d="M10 2L12.5 4.5L16 5L15.5 8.5L18 11L15.5 13.5L16 17L12.5 17.5L10 20L7.5 17.5L4 17L4.5 13.5L2 11L4.5 8.5L4 5L7.5 4.5L10 2Z" fill="#00E572"/>
                     <path d="M7 10L9 12L13 8" stroke="black" strokeWidth="2.5" strokeLinecap="square"/>
                </svg>
            );
        case 'founder': // Gold Square with 1
             return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <title>Founder</title>
                    {/* Gold Base */}
                    <rect x="3" y="3" width="14" height="14" rx="2" fill="#F5C400"/>
                    <rect x="3" y="15" width="14" height="2" rx="1" fill="#C99C00"/> {/* Shadow */}
                    {/* Number 1 */}
                    <rect x="9" y="6" width="2" height="8" fill="white"/>
                    <rect x="8" y="6" width="1" height="2" fill="white"/>
                    <rect x="8" y="13" width="4" height="1" fill="white"/>
                </svg>
            );
        case 'og': // OG Badge
             return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <title>OG</title>
                    <rect x="2" y="5" width="16" height="10" rx="2" fill="#00E572"/>
                    <path d="M6 7H9V12H6V7Z" stroke="black" strokeWidth="2"/>
                    <path d="M11 7H14V12H12V10H13V8H11V12Z" stroke="black" strokeWidth="2"/> {/* Crude G */}
                </svg>
            );
        case 'subscriber': // Subscriber Star Fallback
            return (
                 <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <title>Subscriber</title>
                    <path d="M10 2L12.5 7L18 8L14 12L15 17L10 14.5L5 17L6 12L2 8L7.5 7L10 2Z" fill="#53FC18"/>
                </svg>
            );
        case 'sub_gifter':
            return (
                <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <title>Gifter</title>
                     <rect x="4" y="5" width="12" height="10" fill="#9146FF"/>
                     <rect x="4" y="8" width="12" height="2" fill="#B785FF"/>
                     <rect x="9" y="5" width="2" height="10" fill="#B785FF"/>
                </svg>
            );
        case 'staff':
             return (
                 <svg className={BADGE_CLASS} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <title>Staff</title>
                     <rect x="3" y="3" width="14" height="14" rx="2" fill="#000000"/>
                     <path d="M10 20L5 15H15L10 20Z" fill="#00E572"/> {/* Placeholder Staff Shape */}
                     <text x="10" y="14" textAnchor="middle" fill="#00E572" fontSize="10" fontWeight="bold">K</text>
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
    onRequestAvatar,
    onSaveMessage,
    canSave
}) => {
  const [imageError, setImageError] = useState(false);
  const isSystem = message.platform === Platform.SYSTEM;

  // Determine Avatar URL
  const avatarKey = `${message.platform}-${message.user.username}`;
  let displayAvatar = message.user.avatarUrl || avatarCache[avatarKey];

  // FIX FOR KICK AVATARS:
  if (message.platform === Platform.KICK && displayAvatar && !displayAvatar.includes('wsrv.nl')) {
      const cleanUrl = decodeURIComponent(displayAvatar);
      displayAvatar = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=64&h=64&fit=cover&output=webp`;
  }

  // Effect: Fetch Avatar if missing and not hidden
  useEffect(() => {
    if (!settings.hideAvatars && !displayAvatar && !isSystem) {
       onRequestAvatar(message.platform, message.user);
    }
  }, [settings.hideAvatars, displayAvatar, isSystem, message.platform, message.user, onRequestAvatar]);

  // Handle Interactions (Double Click / Alt Click)
  const handleMessageClick = (e: React.MouseEvent) => {
      // Alt + Click to Copy Message Content
      if (e.altKey) {
          e.preventDefault();
          navigator.clipboard.writeText(message.content);
          return;
      }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
      if (settings.clickToReply) {
          e.preventDefault();
          onReply(message.user.username);
      }
  };


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
             
             // Handle Subscriber Badges (Channel Specific vs Generic)
             if (badge.type === 'subscriber') {
                 // Try to find channel specific badge (Fish, Pufferfish, etc.)
                 if (kickBadges?.['subscriber'] && kickBadges['subscriber'][badge.version || '1']) {
                     const url = kickBadges['subscriber'][badge.version || '1'];
                     return <img key={key} src={url} className={BADGE_CLASS} alt={`Sub ${badge.version}`} title={`Subscriber (${badge.version} months)`} />;
                 }
                 // Fallback to generic Green Star
                 return <KickBadgeSVG key={key} type="subscriber" />;
             }
             
             // Handle Global Roles (SVG)
             return <KickBadgeSVG key={key} type={badge.type} />;
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
      // REACTIVATED GRADIENT: Increased opacity from /20 to /40 and removed 'liquid-glass' to prevent conflict
      const subStyle = isTwitch 
        ? "border border-white/10 border-l-4 border-l-[#9146FF] bg-gradient-to-r from-[#9146FF]/40 via-[#9146FF]/10 to-transparent shadow-[inset_0_0_20px_rgba(145,70,255,0.2)] backdrop-blur-sm" 
        : "border border-white/10 border-l-4 border-l-[#53FC18] bg-gradient-to-r from-[#53FC18]/40 via-[#53FC18]/10 to-transparent shadow-[inset_0_0_20px_rgba(83,252,24,0.2)] backdrop-blur-sm";

      return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`group flex items-start gap-3 py-3 px-3 mx-1 my-2 rounded-lg relative transition-all shadow-lg ${subStyle}`}
        >
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
        </motion.div>
      );
  }

  // --- STANDARD RENDER ---
  return (
    <div 
        className={`group flex items-start gap-2 py-1 px-2 relative border-b border-transparent hover:border-white/5 ${zebraClass} ${hoverClass} ${mentionClass} ${deletedClass}`}
        onClick={handleMessageClick}
        onDoubleClick={handleDoubleClick}
    >
      
      {/* CLOUD SAVE BUTTON (On Hover) */}
      {canSave && onSaveMessage && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSaveMessage(message); }}
            className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-yellow-400 p-1"
            title="Salvar na Nuvem"
          >
             <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </button>
      )}

      {!settings.hideAvatars && AvatarComponent}

      <div className="flex-1 min-w-0 overflow-hidden">
          {message.replyTo && (
              <div className="flex items-center gap-2 mb-1 ml-0.5">
                  <div className="w-3 h-3 border-l-2 border-t-2 border-gray-500 rounded-tl-lg mt-2"></div>
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
                  onClick={(e) => { e.stopPropagation(); onReply(message.user.username); }}
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