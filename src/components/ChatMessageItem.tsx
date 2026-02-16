import React, { useMemo, useEffect, useState } from 'react';
import { ChatMessage, Platform, Badge, BadgeMap, EmoteMap, ChatSettings, User } from '../types';
import { PlatformIcon, KickBadgeModerator, KickBadgeVIP, KickBadgeFounder, KickBadgeVerified, KickBadgeBroadcaster, KickBadgeOG, KickBadgeSub } from './Icons';
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

const BADGE_CLASS = "h-[16px] w-auto min-w-[16px] mr-1.5 inline-block align-middle select-none object-contain hover:scale-110 transition-transform duration-200 ease-out-expo drop-shadow-sm";

// Fallback Twitch badges
const FALLBACK_TWITCH_BADGES: Record<string, string> = {
    'broadcaster': 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2',
    'moderator': 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2',
    'vip': 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2',
    'subscriber': 'https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/2',
    'premium': 'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/2',
    'turbo': 'https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e3428d80f/2',
};

// --- SVG KICK BADGE RENDERER ---
const RenderKickBadge: React.FC<{ type: string, className: string }> = ({ type, className }) => {
    const t = type.toLowerCase();

    if (t === 'moderator') return <KickBadgeModerator className={className} />;
    if (t === 'vip') return <KickBadgeVIP className={className} />;
    if (t === 'founder') return <KickBadgeFounder className={className} />;
    if (t === 'verified') return <KickBadgeVerified className={className} />;
    if (t === 'broadcaster') return <KickBadgeBroadcaster className={className} />;
    if (t === 'og') return <KickBadgeOG className={className} />;
    if (t === 'subscriber' || t === 'sub_gifter') return <KickBadgeSub className={className} />;

    return null;
};

export const ChatMessageItem: React.FC<Props> = React.memo(({
    message, index, globalBadges, channelBadges, kickBadges, sevenTVEmotes, settings, currentUser, onReply, onUserClick, avatarCache, onRequestAvatar, onSaveMessage, canSave
}) => {
    const [imageError, setImageError] = useState(false);
    const isSystem = message.platform === Platform.SYSTEM;

    // Determine Avatar URL
    const avatarKey = `${message.platform}-${message.user.username}`;
    let displayAvatar = message.user.avatarUrl || avatarCache[avatarKey];

    if (message.platform === Platform.KICK && displayAvatar) {
        if (!displayAvatar.includes('wsrv.nl')) {
            let cleanUrl = displayAvatar;
            try { cleanUrl = decodeURIComponent(displayAvatar); } catch (e) { }
            displayAvatar = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=64&h=64&fit=cover&output=webp&n=-1`;
        }
    }

    useEffect(() => {
        if (!settings.hideAvatars && !displayAvatar && !isSystem) {
            onRequestAvatar(message.platform, message.user);
        }
    }, [settings.hideAvatars, displayAvatar, isSystem, message.platform, message.user, onRequestAvatar]);

    const handleMessageClick = (e: React.MouseEvent) => {
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

    if (isSystem) {
        if (settings.hideSystemMessages) return null;
        return (
            <div className="py-2 px-4 text-xs font-mono text-gray-500 flex items-center gap-3 hover:bg-white/5 transition-colors border-l-2 border-transparent">
                <span className="opacity-50">System &gt;</span>
                {message.content}
            </div>
        );
    }

    const renderBadges = () => {
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
                if (badge.type === 'subscriber') {
                    if (kickBadges?.['subscriber'] && kickBadges['subscriber'][badge.version || '1']) {
                        return <img key={key} src={kickBadges['subscriber'][badge.version || '1']} className={BADGE_CLASS} alt={badge.type} title={`Sub (${badge.version} months)`} loading="lazy" onError={(e) => e.currentTarget.style.display = 'none'} />;
                    }
                    return <KickBadgeSub key={key} className={BADGE_CLASS} />;
                }
                return <RenderKickBadge key={key} type={badge.type} className={BADGE_CLASS} />;
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

    const renderContent = useMemo(() => {
        if (message.isDeleted) {
            if (settings.deletedMessageBehavior === 'hide') return null;
            return <span className="text-white/20 italic line-through text-xs ml-2">deleted</span>;
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
                if (emote.start > cursor) result.push(message.content.substring(cursor, emote.start));

                const sizeClass = settings.largeEmotes ? "h-8" : "h-6";
                result.push(
                    <img
                        key={`twitch-emote-${emote.id}-${i}`}
                        src={`https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/1.0`}
                        alt="emote"
                        className={`inline-block mx-1 align-middle hover:scale-110 transition-transform filter drop-shadow-md ${sizeClass}`}
                    />
                );
                cursor = emote.end + 1;
            });

            if (cursor < message.content.length) result.push(message.content.substring(cursor));
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
                    const name = split[i + 1];
                    const sizeClass = settings.largeEmotes ? "h-8" : "h-6";
                    res.push(
                        <img
                            key={`kick-emote-${id}-${i}`}
                            src={`https://files.kick.com/emotes/${id}/fullsize`}
                            alt={name} title={name}
                            className={`inline-block mx-1 align-middle hover:scale-110 transition-transform filter drop-shadow-md ${sizeClass}`}
                        />
                    );
                }
            }
            return res;
        };

        if (message.platform === Platform.KICK) parts = parts.flatMap(processKickEmotes);

        // --- PASS 3: 7TV EMOTES ---
        const process7TV = (segment: string | React.ReactNode): (string | React.ReactNode)[] => {
            if (typeof segment !== 'string') return [segment];
            if (!sevenTVEmotes || Object.keys(sevenTVEmotes).length === 0) return [segment];

            const words = segment.split(' ');
            const result: (string | React.ReactNode)[] = [];

            words.forEach((word, i) => {
                const emoteUrl = sevenTVEmotes[word];
                if (emoteUrl) {
                    const sizeClass = settings.largeEmotes ? "h-8" : "h-6";
                    result.push(
                        <img
                            key={`7tv-${i}-${word}`}
                            src={emoteUrl} alt={word} title={word}
                            className={`inline-block mx-1 align-middle hover:scale-110 transition-transform filter drop-shadow-md ${sizeClass}`}
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

    const zebraClass = settings.alternatingBackground && index % 2 === 0 ? 'bg-white/[0.015]' : '';
    const hoverClass = 'hover:bg-white/[0.03] transition-colors duration-200';
    const mentionClass = isMention ? 'bg-[var(--color-twitch)]/10 border-l-2 border-[var(--color-twitch)] !shadow-none' : 'border-l-2 border-transparent';
    const deletedClass = message.isDeleted && settings.deletedMessageBehavior === 'hide' ? 'hidden' : '';

    const usernameColor = message.user.color || (message.platform === Platform.TWITCH ? '#9146FF' : '#53FC18');

    let textSizeClass = "text-[13px]";
    let lineHeightClass = "leading-[1.4]";
    if (settings.fontSize === 'small') { textSizeClass = "text-[11px]"; lineHeightClass = "leading-[1.3]"; }
    if (settings.fontSize === 'large') { textSizeClass = "text-[15px]"; lineHeightClass = "leading-[1.5]"; }

    const fontClass = settings.fontFamily === 'mono' ? 'font-mono' : 'font-sans';

    // Avatar Logic
    const handleAvatarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUserClick(message.user, message.platform);
    };

    const initial = message.user.username.charAt(0).toUpperCase();

    const AvatarComponent = (
        <div className="shrink-0 mt-0.5 cursor-pointer hover:opacity-100 opacity-90 active:scale-95 transition-all group-hover:scale-105" onClick={handleAvatarClick}>
            {displayAvatar && !imageError ? (
                <img
                    src={displayAvatar}
                    alt={message.user.username}
                    className="w-7 h-7 rounded-full object-cover shadow-sm ring-2 ring-transparent group-hover:ring-white/10 transition-all"
                    loading="lazy"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-black/50 text-shadow-none shadow-inner bg-linear-to-br from-white/20 to-transparent"
                    style={{ backgroundColor: usernameColor }}
                >
                    <span className="text-white mix-blend-overlay">{initial}</span>
                </div>
            )}
        </div>
    );

    // --- SUBSCRIPTIONS ---
    if (message.isSubscription) {
        const isTwitch = message.platform === Platform.TWITCH;
        const themeColor = isTwitch ? 'var(--color-twitch)' : 'var(--color-kick)';

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative flex items-start gap-3 py-4 px-4 mx-2 my-4 rounded-xl overflow-hidden border border-white/5 backdrop-blur-md shadow-2xl`}
            >
                <div className={`absolute inset-0 opacity-10 bg-[${themeColor}]`} />
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-[${themeColor}]`} />

                {!settings.hideAvatars && AvatarComponent}
                <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-white text-base" style={{ fontFamily: 'var(--font-heading)' }}>
                            {message.user.username}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[${themeColor}] text-black`}>
                            {message.subMonths ? `Sub x${message.subMonths}` : 'New Sub'}
                        </span>
                    </div>
                    <div className={`text-white/80 wrap-break-word font-medium text-sm`}>
                        {renderContent}
                    </div>
                </div>
            </motion.div>
        );
    }

    // --- STANDARD RENDER ---
    return (
        <div
            className={`group flex items-start gap-3 py-1.5 px-3 relative border-b border-white/2 ${zebraClass} ${hoverClass} ${mentionClass} ${deletedClass}`}
            onClick={handleMessageClick}
            onDoubleClick={handleDoubleClick}
        >
            {!settings.hideAvatars && AvatarComponent}

            <div className="flex-1 min-w-0 overflow-hidden">
                {message.replyTo && (
                    <div className="flex items-center gap-2 mb-1 ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 border-l border-t border-white/30 rounded-tl-md mt-1.5"></div>
                        <div className="flex items-center gap-1.5 bg-white/5 rounded pl-1.5 pr-2 py-0.5 text-xs">
                            <span className="font-bold text-white/70">{message.replyTo.username}</span>
                            <span className="text-white/40 truncate max-w-[120px]">{message.replyTo.content}</span>
                        </div>
                    </div>
                )}

                <div className={`wrap-break-word ${lineHeightClass} ${textSizeClass} ${fontClass} text-white/90`}>

                    <div className="inline relative top-px mr-2">
                        {settings.showTimestamps && (
                            <span className="text-[10px] text-white/20 font-mono mr-2 align-middle">
                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <span className="inline-block align-middle">{renderBadges()}</span>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); onReply(message.user.username); }}
                        className={`font-bold hover:underline cursor-pointer align-middle mr-1 ${settings.rainbowUsernames ? 'rainbow-text' : ''}`}
                        style={{ color: settings.rainbowUsernames ? undefined : usernameColor, textShadow: '0 0 10px rgba(0,0,0,0.5)' }}
                    >
                        {message.user.username}
                    </button>

                    <span className="mr-2 text-white/30 align-middle font-light">|</span>

                    <span className="align-middle drop-shadow-sm font-light">
                        {renderContent}
                    </span>
                </div>
            </div>
        </div>
    );
});
