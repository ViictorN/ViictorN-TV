import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useChat } from '../contexts/ChatContext';
import { SettingsIcon, PlatformIcon } from './Icons';
import { motion } from 'framer-motion';

export const ControlPanel: React.FC = () => {
    const {
        settings, updateSettings, setSettingsOpen,
        activePlayer, setActivePlayer,
        triggerPlayerRefresh
    } = useSettings();

    const handleToggleCinema = () => {
        updateSettings({ cinemaMode: !settings.cinemaMode });
    };

    return (
        <div className={`w-full bg-black/40 backdrop-blur-md border-b border-white/5 flex flex-row items-center justify-between px-4 z-50 sticky top-0 transition-all duration-500 shrink-0 ${settings.cinemaMode ? 'h-0 opacity-0 overflow-hidden py-0 border-none' : 'h-[64px]'}`}>

            {/* Brand */}
            <div className="flex items-center gap-4">
                <h1 className="font-bold text-2xl tracking-tighter text-white flex items-center gap-1 group cursor-default select-none" style={{ fontFamily: 'var(--font-heading)' }}>
                    ViictorN<span className="text-(--color-twitch) group-hover:text-(--color-kick) transition-colors duration-500">TV</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-(--color-kick) animate-pulse ml-1"></span>
                </h1>
            </div>

            {/* Center Controls */}
            <div className="flex-1 flex items-center justify-center gap-3">
                <div className="flex p-1.5 bg-black/60 rounded-full border border-white/10 shadow-lg">
                    {[
                        { id: 'twitch', label: 'Twitch', icon: 'twitch' },
                        { id: 'kick', label: 'Kick', icon: 'kick' },
                        { id: 'none', label: 'Chat Only', icon: false }
                    ].map((tab) => {
                        const isActive = activePlayer === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActivePlayer(tab.id as any)}
                                className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 overflow-hidden group ${isActive ? 'text-white shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]' : 'text-white/40 hover:text-white'}`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className={`absolute inset-0 opacity-100 ${tab.id === 'kick' ? 'bg-(--color-kick) text-black' : tab.id === 'twitch' ? 'bg-(--color-twitch)' : 'bg-white/10'}`}
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        style={{ borderRadius: 999 }}
                                    />
                                )}

                                <div className="relative z-10 flex items-center gap-2">
                                    {tab.icon && (
                                        <PlatformIcon
                                            platform={tab.icon as any}
                                            className={`w-3.5 h-3.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                                            variant={isActive ? 'white' : 'white'}
                                        />
                                    )}
                                    <span>{tab.label}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 justify-end">
                <button
                    onClick={() => setSettingsOpen(true)}
                    className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white/70 transition-colors"
                >
                    <SettingsIcon className="w-5 h-5" />
                </button>

                <div className="hidden md:flex items-center gap-3">
                    {activePlayer !== 'none' && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={triggerPlayerRefresh}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg border border-white/5 text-xs font-bold transition-colors uppercase tracking-wider"
                        >
                            Refresh
                        </motion.button>
                    )}

                    <div className="w-px h-8 bg-white/10 mx-1" />

                    <motion.button
                        whileHover={{ scale: 1.1, color: "#fff" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleToggleCinema}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-white/50 hover:bg-white/5 transition-colors"
                        title="Cinema Mode"
                    >
                        <span className="text-xl leading-none">↕</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90, color: "#fff" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSettingsOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-white/50 hover:bg-white/5 transition-all duration-300"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
