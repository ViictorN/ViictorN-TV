import React, { useState } from 'react';
import { EmoteMap, TwitchEmote } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (emoteCode: string) => void;
    sevenTVEmotes: EmoteMap;
    twitchEmotes: TwitchEmote[];
}

type Tab = '7tv' | 'twitch';

export const EmotePicker: React.FC<Props> = ({ isOpen, onClose, onSelect, sevenTVEmotes, twitchEmotes }) => {
    const [activeTab, setActiveTab] = useState<Tab>('twitch');
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

    // Filter 7TV
    const filtered7TV = Object.entries(sevenTVEmotes).filter(([name]) =>
        name.toLowerCase().includes(search.toLowerCase())
    );

    // Filter Twitch
    const filteredTwitch = twitchEmotes.filter(emote =>
        emote.name.toLowerCase().includes(search.toLowerCase())
    );

    // Categorize Twitch (Roughly)
    // NOTE: Ideally we'd separate by emote_set_id if we had labels for them, 
    // but for now we separate "Global" (usually id 0) from "Sub/Channel".
    const twitchGlobal = filteredTwitch.filter(e => e.emote_set_id === '0');
    const twitchChannel = filteredTwitch.filter(e => e.emote_set_id !== '0');

    // Categorize 7TV (Roughly)
    // We can't distinguish set origin easily without API changes in sevenTVService, 
    // but we can at least show a clean grid.
    // In V2 we should update the service to categorize them.

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute bottom-14 right-2 w-80 h-96 bg-[#050505]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-90 ring-1 ring-white/5"
            >

                {/* Header / Tabs */}
                <div className="flex items-center p-1.5 gap-1 bg-black/40 border-b border-white/5 select-none">
                    {['twitch', '7tv'].map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as Tab)}
                                className={`relative flex-1 py-2 text-xs font-bold rounded-lg transition-colors overflow-hidden ${isActive ? 'text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeEmoteTab"
                                        className="absolute inset-0 bg-white/10"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{tab === 'twitch' ? 'Twitch' : '7TV (Global)'}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Search */}
                <div className="p-2 border-b border-white/5 bg-black/20">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-linear-to-r from-(--color-twitch)/20 to-(--color-kick)/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                        <input
                            type="text"
                            placeholder="Search emotes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                            className="relative w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 placeholder-white/20 transition-all"
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">

                    {/* 7TV CONTENT */}
                    {activeTab === '7tv' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                            <div className="text-[10px] font-bold text-white/30 uppercase mb-2 px-1 tracking-wider">7TV Global</div>
                            <div className="grid grid-cols-5 gap-1.5">
                                {filtered7TV.map(([name, url]) => (
                                    <button
                                        key={name}
                                        onClick={() => onSelect(name)}
                                        className="aspect-square flex items-center justify-center hover:bg-white/10 rounded-md transition-all p-1 group relative"
                                        title={name}
                                    >
                                        <img src={url} alt={name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-lg" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                            {filtered7TV.length === 0 && <div className="text-center text-white/20 text-xs py-10 font-medium">No emotes found.</div>}
                        </motion.div>
                    )}

                    {/* TWITCH CONTENT */}
                    {activeTab === 'twitch' && (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                            {/* Channel / Sub Emotes */}
                            {twitchChannel.length > 0 && (
                                <div>
                                    <div className="text-[10px] font-bold text-(--color-twitch) uppercase mb-2 px-1 tracking-wider flex items-center gap-2">
                                        Channel
                                        <div className="h-px flex-1 bg-(--color-twitch)/20" />
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {twitchChannel.map((emote) => (
                                            <button
                                                key={emote.id}
                                                onClick={() => onSelect(emote.name)}
                                                className="aspect-square flex items-center justify-center hover:bg-white/10 rounded-md transition-all p-1 group"
                                                title={emote.name}
                                            >
                                                <img src={emote.images.url_2x || emote.images.url_1x} alt={emote.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md" loading="lazy" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Global Emotes */}
                            {twitchGlobal.length > 0 && (
                                <div>
                                    <div className="text-[10px] font-bold text-white/30 uppercase mb-2 px-1 tracking-wider flex items-center gap-2">
                                        Global
                                        <div className="h-px flex-1 bg-white/10" />
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {twitchGlobal.map((emote) => (
                                            <button
                                                key={emote.id}
                                                onClick={() => onSelect(emote.name)}
                                                className="aspect-square flex items-center justify-center hover:bg-white/10 rounded-md transition-all p-1 group"
                                                title={emote.name}
                                            >
                                                <img src={emote.images.url_2x || emote.images.url_1x} alt={emote.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-sm" loading="lazy" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredTwitch.length === 0 && (
                                <div className="text-center text-white/20 text-xs py-10 font-medium">No emotes found.</div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Footer Close */}
                <button onClick={onClose} className="p-3 text-xs text-center font-bold text-white/30 hover:text-white hover:bg-white/5 border-t border-white/5 transition-colors uppercase tracking-widest bg-black/20">
                    Close
                </button>
            </motion.div>
        </AnimatePresence>
    );
};
