import React, { useState, useEffect } from 'react';
import { User, ChatMessage, Platform, TwitchCreds } from '../types';
import { PlatformIcon } from './Icons';
import { motion } from 'framer-motion';
import { useUserCardData } from '../hooks/useUserCardData';

interface Props {
    user: User;
    platform: Platform;
    messages: ChatMessage[]; // To calculate stats
    onClose: () => void;
    twitchCreds: TwitchCreds;
}

export const UserCard: React.FC<Props> = ({ user, platform, messages, onClose, twitchCreds }) => {
    const { fetchedAvatar, note, setNote, savingNote, handleSaveNote, hasBackend } = useUserCardData(user, platform, twitchCreds);

    // Stats Logic
    const userMessages = messages.filter(m => m.user.username.toLowerCase() === user.username.toLowerCase() && m.platform === platform);
    const messageCount = userMessages.length;
    const lastMessage = userMessages[userMessages.length - 1];
    const lastSeen = lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString() : 'N/A';
    const lastDate = lastMessage ? new Date(lastMessage.timestamp).toLocaleDateString() : '';

    // Calculate Roles string from badges
    const roles = user.badges.map(b => b.type).join(', ') || 'user';

    // Display Image Logic
    let displayAvatar = fetchedAvatar || user.avatarUrl;

    // Apply Kick Proxy Fix (Same as ChatMessageItem to prevent broken images)
    if (platform === Platform.KICK && displayAvatar && !displayAvatar.includes('wsrv.nl')) {
        // If it's a Kick file URL or similar that needs proxying for CORS
        if (displayAvatar.includes('kick.com') || displayAvatar.includes('kick-files')) {
            const cleanUrl = decodeURIComponent(displayAvatar);
            displayAvatar = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=128&h=128&fit=cover&output=webp`;
        }
    }

    // Default Avatar Color
    const initial = user.username.charAt(0).toUpperCase();
    const bgColor = user.color || (platform === Platform.TWITCH ? '#9146FF' : '#53FC18');
    const platformColor = platform === Platform.TWITCH ? 'var(--color-twitch)' : 'var(--color-kick)';

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="relative bg-[#09090b] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >

                {/* Header / Banner */}
                <div className="h-28 w-full relative shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-black via-transparent to-transparent z-10" />
                    <div className="absolute inset-0 opacity-40" style={{ backgroundColor: bgColor }} />
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/50 text-white/70 hover:text-white rounded-full transition-all z-20 backdrop-blur-sm"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-6 pb-6 -mt-14 relative overflow-y-auto custom-scrollbar">
                    {/* Avatar & Identity */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-28 h-28 rounded-full border-[6px] border-[#09090b] bg-[#09090b] overflow-hidden shadow-2xl relative shrink-0 group">
                            {displayAvatar ? (
                                <img src={displayAvatar} alt={user.username} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white/90" style={{ backgroundColor: bgColor }}>
                                    {initial}
                                </div>
                            )}
                            <div className="absolute bottom-2 right-2 bg-black rounded-full p-1.5 border border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                                <PlatformIcon platform={platform === Platform.TWITCH ? 'twitch' : 'kick'} className="w-4 h-4" variant="default" />
                            </div>
                        </div>

                        <div className="mt-3 text-center">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2 justify-center tracking-tight">
                                {user.username}
                                {/* Verified / Status indicator could go here */}
                            </h2>

                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                    {user.id || 'ID Hidden'}
                                </span>
                                {roles && (
                                    <span className="px-2 py-0.5 rounded-full bg-(--color-twitch)/10 border border-(--color-twitch)/20 text-[10px] font-bold text-(--color-twitch) uppercase tracking-wider">
                                        {roles}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cloud Notes Section */}
                    {hasBackend && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mb-6 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                    <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Mod Notes</label>
                                </div>
                                {savingNote && <span className="text-[9px] text-green-400 font-bold">SAVED</span>}
                            </div>
                            <textarea
                                className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-xs text-white/90 outline-none focus:border-yellow-500/30 transition-all resize-none placeholder-white/10 font-medium"
                                rows={3}
                                placeholder="Add private moderation notes..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                onBlur={handleSaveNote}
                            />
                        </motion.div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                            <span className="text-2xl font-display font-bold text-white">{messageCount}</span>
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">Messages</span>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                            <span className="text-xs font-bold text-white mb-1">{lastSeen}</span>
                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{lastDate}</span>
                        </div>
                    </div>

                    {/* Last Message Preview */}
                    <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mb-2 opacity-70">Last Message</span>
                        <p className="text-sm text-gray-300 italic leading-relaxed">
                            "{lastMessage?.content || 'No messages recorded in this session.'}"
                        </p>
                    </div>

                    {/* Footer Action */}
                    <div className="mt-6 flex gap-2">
                        <a
                            href={platform === Platform.TWITCH ? `https://twitch.tv/${user.username}` : `https://kick.com/${user.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-3 bg-white text-black rounded-xl text-xs font-bold text-center hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
                        >
                            View Profile
                        </a>
                    </div>

                </div>
            </motion.div>
        </div>
    );
};
