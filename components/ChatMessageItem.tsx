import React, { useMemo } from 'react';
import { ChatMessage, Platform, Badge, BadgeMap, EmoteMap, ChatSettings } from '../types';
import { KickLogo, TwitchLogo } from './Icons';

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
}

// Fallback Twitch badges (if API not connected)
const FALLBACK_TWITCH_BADGES: Record<string, string> = {
  'broadcaster': 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2',
  'moderator': 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2',
  'vip': 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2',
  'subscriber': 'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2',
  'premium': 'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/2',
};

// Common Kick Badge Assets
const KICK_GLOBAL_BADGES: Record<string, string> = {
    'broadcaster': 'https://raw.githubusercontent.com/BotRix/kick-badges/main/broadcaster.png',
    'moderator': 'https://raw.githubusercontent.com/BotRix/kick-badges/main/moderator.png',
    'vip': 'https://raw.githubusercontent.com/BotRix/kick-badges/main/vip.png',
    'og': 'https://raw.githubusercontent.com/BotRix/kick-badges/main/og.png',
    'verified': 'https://raw.githubusercontent.com/BotRix/kick-badges/main/verified.png',
    'founder': 'https://raw.githubusercontent.com/BotRix/kick-badges/main/founder.png',
    'subscriber': 'https://raw.githubusercontent.com/BotRix/kick-badges/main/sub.png'
};

const BadgeIcon: React.FC<{ badge: Badge; platform: Platform; globalBadges?: BadgeMap; channelBadges?: BadgeMap; kickBadges?: BadgeMap }> = ({ badge, platform, globalBadges, channelBadges, kickBadges }) => {
  
  // --- TWITCH RENDERING ---
  if (platform === Platform.TWITCH) {
    let url = '';

    // 1. Try Channel Specific Badge (e.g. Subscriber)
    if (channelBadges && channelBadges[badge.type] && channelBadges[badge.type][badge.version || '0']) {
        url = channelBadges[badge.type][badge.version || '0'];
    } 
    // 2. Try Global API Badge
    else if (globalBadges && globalBadges[badge.type] && globalBadges[badge.type][badge.version || '0']) {
        url = globalBadges[badge.type][badge.version || '0'];
    }
    // 3. Fallback to hardcoded
    else {
        url = FALLBACK_TWITCH_BADGES[badge.type];
    }

    if (url) {
      return <img src={url} alt={badge.type} className="h-4 w-auto mr-1 inline-block object-contain align-middle select-none" draggable={false} />;
    }
    
    return null;
  }

  // --- KICK RENDERING ---
  if (platform === Platform.KICK) {
    let url = KICK_GLOBAL_BADGES[badge.type];

    // Try Channel Subscriber Badge (with version/months logic)
    if (badge.type === 'subscriber' && kickBadges && kickBadges['subscriber']) {
        // 1. Try exact match (e.g. "6" months)
        if (kickBadges['subscriber'][badge.version]) {
            url = kickBadges['subscriber'][badge.version];
        } else {
             // 2. Fallback: Find closest lower month badge
             const months = parseInt(badge.version);
             if (!isNaN(months)) {
                 const availableMonths = Object.keys(kickBadges['subscriber']).map(Number).sort((a,b) => a - b);
                 const bestFit = availableMonths.reverse().find(m => m <= months);
                 if (bestFit) {
                     url = kickBadges['subscriber'][String(bestFit)];
                 }
             }
        }
    }

    if (url) {
        return <img src={url} alt={badge.type} className="h-4 w-auto mr-1 inline-block object-contain align-middle select-none" draggable={false} title={badge.type.toUpperCase()} />;
    }

    // Fallback Text Badge if image fails
    const commonClasses = "mr-1 inline-flex items-center justify-center h-4 px-1 text-[9px] font-bold rounded uppercase tracking-tighter border border-transparent shadow-sm align-middle";
    if (badge.type === 'broadcaster') return <span className={`${commonClasses} bg-kick text-black border-kick/50`}>HOST</span>;
    if (badge.type === 'moderator') return <span className={`${commonClasses} bg-[#00D26A] text-white border-[#004e27]`}>MOD</span>;
    if (badge.type === 'vip') return <span className={`${commonClasses} bg-white text-black`}>VIP</span>;
    if (badge.type === 'subscriber') return <span className={`${commonClasses} bg-[#FFD700] text-black border-yellow-600`}>SUB</span>;
    if (badge.type === 'og') return <span className={`${commonClasses} bg-[#FF4500] text-white`}>OG</span>;
    
    return null;
  }

  return null;
};

const PlatformBadge: React.FC<{ platform: Platform }> = ({ platform }) => {
  if (platform === Platform.TWITCH) {
    return (
      <div className="inline-flex items-center justify-center w-5 h-5 mr-1.5 align-middle select-none" title="Twitch User">
        <TwitchLogo className="w-3.5 h-3.5 text-twitch drop-shadow-[0_0_8px_rgba(145,70,255,0.6)]" />
      </div>
    );
  }
  if (platform === Platform.KICK) {
     return (
      <div className="inline-flex items-center justify-center w-5 h-5 mr-1.5 align-middle select-none" title="Kick User">
        <KickLogo className="w-3.5 h-3.5 text-kick drop-shadow-[0_0_8px_rgba(83,252,24,0.6)]" />
      </div>
    );
  }
  return null;
};

const SevenTVTextRenderer: React.FC<{ text: string; emoteMap?: EmoteMap; largeEmotes: boolean }> = ({ text, emoteMap, largeEmotes }) => {
    if (!emoteMap) return <>{text}</>;

    const words = text.split(' ');
    const emoteSize = largeEmotes ? 'h-10' : 'h-7'; // 7TV size

    return (
        <>
            {words.map((word, index) => {
                const emoteUrl = emoteMap[word];
                if (emoteUrl) {
                    return (
                        <span key={index}>
                            <img 
                                src={emoteUrl} 
                                alt={word} 
                                title={word}
                                className={`inline-block align-middle mx-0.5 ${emoteSize} w-auto object-contain transform -translate-y-0.5 select-none`}
                            />
                            {index < words.length - 1 && ' '}
                        </span>
                    );
                }
                return <span key={index}>{word}{index < words.length - 1 ? ' ' : ''}</span>;
            })}
        </>
    );
};

const ParsedContent: React.FC<{ message: ChatMessage; sevenTVEmotes?: EmoteMap; fontSize: string; largeEmotes: boolean }> = ({ message, sevenTVEmotes, fontSize, largeEmotes }) => {
  const parsedElements = useMemo(() => {
    
    const twitchEmoteSize = largeEmotes ? 'h-9' : 'h-6';

    // 1. If there are Twitch native emotes (positional)
    if (message.emotes && Object.keys(message.emotes).length > 0) {
        const replacements: { start: number; end: number; id: string }[] = [];
        const emotes = message.emotes as Record<string, string[]>;
        
        Object.entries(emotes).forEach(([id, positions]) => {
            positions.forEach(pos => {
                const [start, end] = pos.split('-').map(Number);
                replacements.push({ start, end, id });
            });
        });

        replacements.sort((a, b) => a.start - b.start);

        const parts: React.ReactNode[] = [];
        let lastIndex = 0;

        replacements.forEach((rep, i) => {
            if (rep.start > lastIndex) {
                // The text BEFORE the twitch emote might contain 7TV emotes
                const textPart = message.content.substring(lastIndex, rep.start);
                parts.push(<SevenTVTextRenderer key={`txt-${i}`} text={textPart} emoteMap={sevenTVEmotes} largeEmotes={largeEmotes} />);
            }

            parts.push(
                <img 
                    key={`${message.id}-twitch-${i}`}
                    src={`https://static-cdn.jtvnw.net/emoticons/v2/${rep.id}/default/dark/1.0`}
                    alt="emote"
                    className={`inline-block align-middle mx-0.5 ${twitchEmoteSize} w-auto object-contain transform -translate-y-0.5 select-none`}
                />
            );

            lastIndex = rep.end + 1;
        });

        if (lastIndex < message.content.length) {
            // The remaining text might contain 7TV emotes
            const textPart = message.content.substring(lastIndex);
             parts.push(<SevenTVTextRenderer key={`txt-end`} text={textPart} emoteMap={sevenTVEmotes} largeEmotes={largeEmotes} />);
        }

        return parts;
    } 
    
    // 2. If no native emotes, just parse for 7TV
    return <SevenTVTextRenderer text={message.content} emoteMap={sevenTVEmotes} largeEmotes={largeEmotes} />;

  }, [message.content, message.emotes, message.id, sevenTVEmotes, largeEmotes]);

  return <span className={`${fontSize} text-gray-200 font-medium break-words whitespace-pre-wrap leading-6 ${message.isDeleted ? 'line-through text-gray-500' : ''}`}>{parsedElements}</span>;
};

export const ChatMessageItem = React.memo<Props>(({ message, index, globalBadges, channelBadges, kickBadges, sevenTVEmotes, settings, currentUser, onReply }) => {
  const isTwitch = message.platform === Platform.TWITCH;
  const isSystem = message.platform === Platform.SYSTEM;

  // SYSTEM MESSAGES FILTER
  if (isSystem) {
    if (settings.hideSystemMessages) return null;
    return (
      <div className="flex items-center justify-center my-3 animate-slide-in">
        <div className="py-0.5 px-3 text-[10px] uppercase tracking-widest text-gray-500 bg-glass border border-glass-border rounded-full shadow-sm backdrop-blur-md">
          {message.content}
        </div>
      </div>
    );
  }

  // DELETED MESSAGES
  if (message.isDeleted && settings.deletedMessageBehavior === 'hide') {
      return null;
  }

  // FONT SIZE MAP
  const fontSizeClass = {
      small: 'text-[12px]',
      medium: 'text-[13px]',
      large: 'text-[15px]'
  }[settings.fontSize];

  // BACKGROUND STRIPING (Zebra)
  const bgClass = settings.alternatingBackground && index % 2 !== 0 
    ? 'bg-white/[0.03]' 
    : 'bg-transparent';

  // HIGHLIGHT MENTIONS
  const isMentioned = useMemo(() => {
      if (!settings.highlightMentions) return false;
      const contentLower = message.content.toLowerCase();
      // Check for current user mentions
      if (isTwitch && currentUser.twitch && contentLower.includes(currentUser.twitch.toLowerCase())) return true;
      if (!isTwitch && currentUser.kick && contentLower.includes(currentUser.kick.toLowerCase())) return true;
      return false;
  }, [message.content, settings.highlightMentions, currentUser]);

  const highlightClass = isMentioned 
    ? (isTwitch ? 'bg-twitch/10 border-l-2 border-twitch pl-1' : 'bg-kick/10 border-l-2 border-kick pl-1') 
    : '';

  // FONT FAMILY
  const fontClass = settings.fontFamily === 'mono' ? 'font-mono tracking-tight' : 'font-sans';
  
  // SEPARATOR
  const separatorClass = settings.showSeparator ? 'border-b border-white/5 pb-1 mb-1' : 'mb-0.5';

  return (
    <div className={`group relative py-1 px-2 rounded transition-colors duration-200 flex flex-col items-start ${bgClass} ${highlightClass} ${separatorClass} ${message.isDeleted ? 'opacity-50' : ''} hover:bg-white/5`}>
      
      {/* --- REPLY HEADER --- */}
      {message.replyTo && (
          <div className="flex items-center gap-1.5 ml-8 mb-0.5 opacity-60">
              <div className="w-6 h-2 border-t-2 border-l-2 border-gray-600 rounded-tl-lg absolute left-3 top-3"></div>
              <span className="text-[10px] bg-white/10 px-1.5 rounded text-gray-300 flex items-center gap-1">
                 <span className="font-bold">@{message.replyTo.username}</span>
                 <span className="truncate max-w-[150px] italic font-normal text-gray-400">{message.replyTo.content}</span>
              </span>
          </div>
      )}

      <div className={`flex-1 min-w-0 w-full ${fontClass}`}>
        <div className="inline-block align-top leading-6 w-full break-words">
            
            {/* 0. Timestamp */}
            {settings.showTimestamps && (
                <span className="text-[10px] text-gray-500 mr-2 font-mono tabular-nums select-none">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            )}

            {/* 1. Platform Icon (Fully Opaque Now) */}
            <PlatformBadge platform={message.platform} />
            
            {/* 2. Badges */}
            {!settings.hideAvatars && message.user.badges.map((badge, idx) => (
                <BadgeIcon 
                    key={`${badge.type}-${idx}`} 
                    badge={badge} 
                    platform={message.platform} 
                    globalBadges={globalBadges}
                    channelBadges={channelBadges}
                    kickBadges={kickBadges}
                />
            ))}

            {/* 3. Username (Click to Reply + Rainbow) */}
            <span 
                className={`font-bold text-sm cursor-pointer mr-2 align-baseline hover:underline ${settings.rainbowUsernames ? 'rainbow-text' : ''}`}
                style={!settings.rainbowUsernames ? { 
                    color: message.isDeleted ? '#888' : (message.user.color || (isTwitch ? '#a970ff' : '#53FC18')),
                } : {}}
                onClick={() => onReply(message.user.username)}
                title="Clique para responder"
            >
                {message.user.username}
                <span className="text-gray-500 font-normal opacity-50 ml-0.5">:</span>
            </span>
             
            {/* 4. Message Content */}
            <ParsedContent 
                message={message} 
                sevenTVEmotes={sevenTVEmotes} 
                fontSize={fontSizeClass}
                largeEmotes={settings.largeEmotes}
            />
            
            {message.isDeleted && <span className="text-[10px] text-gray-500 italic ml-2">(deletado)</span>}
        </div>
      </div>
    </div>
  );
}, (prev, next) => 
    prev.message.id === next.message.id && 
    prev.message.isDeleted === next.message.isDeleted && 
    prev.settings === next.settings &&
    prev.index === next.index &&
    prev.kickBadges === next.kickBadges
);