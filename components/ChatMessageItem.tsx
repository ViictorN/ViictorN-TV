import React, { useMemo } from 'react';
import { ChatMessage, Platform, Badge, BadgeMap, EmoteMap } from '../types';
import { KickLogo, TwitchLogo } from './Icons';

interface Props {
  message: ChatMessage;
  globalBadges?: BadgeMap;
  channelBadges?: BadgeMap;
  sevenTVEmotes?: EmoteMap;
}

// Fallback Twitch badges (if API not connected)
const FALLBACK_TWITCH_BADGES: Record<string, string> = {
  'broadcaster': 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2',
  'moderator': 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2',
  'vip': 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2',
  'subscriber': 'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2',
  'premium': 'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/2',
};

const BadgeIcon: React.FC<{ badge: Badge; platform: Platform; globalBadges?: BadgeMap; channelBadges?: BadgeMap }> = ({ badge, platform, globalBadges, channelBadges }) => {
  
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
      // FIX: Altura fixa (h-5 / 20px) para alinhar com o ícone da plataforma
      return <img src={url} alt={badge.type} className="h-5 w-auto mr-1 inline-block object-contain align-middle" />;
    }
    
    return null;
  }

  // --- KICK RENDERING ---
  if (platform === Platform.KICK) {
    // FIX: Usando altura fixa e alinhamento flex para imitar o tamanho das badges da twitch
    const commonClasses = "mr-1 inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-bold rounded uppercase tracking-tighter border border-transparent shadow-sm align-middle";
    
    if (badge.type === 'broadcaster') {
        return <span className={`${commonClasses} bg-kick text-black border-kick/50`}>HOST</span>;
    }
    if (badge.type === 'moderator') {
        return <span className={`${commonClasses} bg-[#00D26A] text-white border-[#004e27]`}>MOD</span>;
    }
    if (badge.type === 'vip') {
        return <span className={`${commonClasses} bg-white text-black`}>VIP</span>;
    }
    if (badge.type === 'subscriber') {
        return <span className={`${commonClasses} bg-[#FFD700] text-black border-yellow-600`}>SUB</span>;
    }
    if (badge.type === 'og') {
        return <span className={`${commonClasses} bg-[#FF4500] text-white`}>OG</span>;
    }
    if (badge.type === 'verified') {
         return <span className={`${commonClasses} bg-blue-500 text-white`}>VER</span>;
    }
  }

  return null;
};

const PlatformBadge: React.FC<{ platform: Platform }> = ({ platform }) => {
  if (platform === Platform.TWITCH) {
    return (
      <div className="inline-flex items-center justify-center w-5 h-5 mr-1 align-middle" title="Twitch User">
        <TwitchLogo className="w-4 h-4 text-twitch" />
      </div>
    );
  }
  if (platform === Platform.KICK) {
     return (
      <div className="inline-flex items-center justify-center w-5 h-5 mr-1 align-middle" title="Kick User">
        <KickLogo className="w-4 h-4 text-kick" />
      </div>
    );
  }
  return null;
};

// Helper component to render text with 7TV emote replacement
const SevenTVTextRenderer: React.FC<{ text: string; emoteMap?: EmoteMap }> = ({ text, emoteMap }) => {
    if (!emoteMap) return <>{text}</>;

    const words = text.split(' ');
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
                                className="inline-block align-middle mx-0.5 h-8 w-auto object-contain transform -translate-y-0.5"
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

const ParsedContent: React.FC<{ message: ChatMessage; sevenTVEmotes?: EmoteMap }> = ({ message, sevenTVEmotes }) => {
  const parsedElements = useMemo(() => {
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
                parts.push(<SevenTVTextRenderer key={`txt-${i}`} text={textPart} emoteMap={sevenTVEmotes} />);
            }

            parts.push(
                <img 
                    key={`${message.id}-twitch-${i}`}
                    src={`https://static-cdn.jtvnw.net/emoticons/v2/${rep.id}/default/dark/1.0`}
                    alt="emote"
                    className="inline-block align-middle mx-0.5 h-7 w-auto object-contain transform -translate-y-0.5"
                />
            );

            lastIndex = rep.end + 1;
        });

        if (lastIndex < message.content.length) {
            // The remaining text might contain 7TV emotes
            const textPart = message.content.substring(lastIndex);
             parts.push(<SevenTVTextRenderer key={`txt-end`} text={textPart} emoteMap={sevenTVEmotes} />);
        }

        return parts;
    } 
    
    // 2. If no native emotes, just parse for 7TV
    return <SevenTVTextRenderer text={message.content} emoteMap={sevenTVEmotes} />;

  }, [message.content, message.emotes, message.id, sevenTVEmotes]);

  return <span className="text-[13px] text-gray-200 font-medium break-words inline leading-6">{parsedElements}</span>;
};

export const ChatMessageItem = React.memo<Props>(({ message, globalBadges, channelBadges, sevenTVEmotes }) => {
  const isTwitch = message.platform === Platform.TWITCH;
  const isSystem = message.platform === Platform.SYSTEM;

  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-3 animate-slide-in">
        <div className="py-0.5 px-3 text-[10px] uppercase tracking-widest text-gray-500 bg-glass border border-glass-border rounded-full shadow-sm backdrop-blur-md">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative py-1 px-2 mb-0.5 rounded hover:bg-white/5 transition-colors duration-200 flex items-start`}>
      <div className="flex-1 min-w-0">
        <div className="inline-block align-top leading-6">
            
            {/* 1. Platform Icon */}
            <PlatformBadge platform={message.platform} />
            
            {/* 2. Badges (Subs, Mods, etc) */}
            {message.user.badges.map((badge, idx) => (
                <BadgeIcon 
                    key={`${badge.type}-${idx}`} 
                    badge={badge} 
                    platform={message.platform} 
                    globalBadges={globalBadges}
                    channelBadges={channelBadges}
                />
            ))}

            {/* 3. Username */}
            <span 
                className="font-bold text-sm hover:underline cursor-pointer mr-2 align-baseline"
                style={{ 
                    color: message.user.color || (isTwitch ? '#a970ff' : '#53FC18'),
                }}
            >
                {message.user.username}
                <span className="text-gray-500 font-normal opacity-50 ml-0.5">:</span>
            </span>
             
            {/* 4. Message Content */}
            <ParsedContent message={message} sevenTVEmotes={sevenTVEmotes} />
        </div>
      </div>
    </div>
  );
}, (prev, next) => prev.message.id === next.message.id);