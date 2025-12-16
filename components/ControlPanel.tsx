import React from 'react';
import { AuthState, StreamStats } from '../types';
import { SettingsIcon, ViictorNLogo, PlatformIcon, SplitScreenIcon } from './Icons';
import { motion } from 'framer-motion';

interface Props {
  authState: AuthState;
  onToggleAuth: (platform: 'twitch' | 'kick') => void;
  streamStats: StreamStats;
  onOpenSettings: () => void;
  activePlayer: 'twitch' | 'kick' | 'dual' | 'none';
  onSetPlayer: (player: 'twitch' | 'kick' | 'dual' | 'none') => void;
  chatFilter: 'all' | 'twitch' | 'kick';
  onSetChatFilter: (filter: 'all' | 'twitch' | 'kick') => void;
  onSync: () => void;
  cinemaMode: boolean;
  onToggleCinema: () => void;
  onOpenBookmarks?: () => void;
  hasCloudAccess?: boolean;
}

export const ControlPanel: React.FC<Props> = ({ 
    authState, 
    onToggleAuth, 
    streamStats, 
    onOpenSettings,
    activePlayer,
    onSetPlayer,
    chatFilter,
    onSetChatFilter,
    onSync,
    cinemaMode,
    onToggleCinema,
    onOpenBookmarks,
    hasCloudAccess
}) => {
  
  const totalViewers = (streamStats.kickViewers || 0) + (streamStats.twitchViewers || 0);
  
  const formatViewers = (num: number | null) => {
      if (num === null) return '-';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
  };

  const springTransition = { type: "spring", stiffness: 400, damping: 30 };

  return (
    <div className={`w-full liquid-glass border-b border-white/5 flex flex-row items-center justify-between px-3 md:px-4 z-50 sticky top-0 transition-all duration-500 ease-out-expo shrink-0 ${cinemaMode ? 'h-0 opacity-0 overflow-hidden py-0 border-none' : 'h-[52px] md:h-[72px]'}`}>
      
      {/* Logo Area */}
      <div className="flex items-center md:w-auto md:justify-start shrink-0 gap-3 md:gap-4">
        <div className="flex items-center gap-3 group cursor-default">
            <ViictorNLogo className="w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_20px_rgba(145,70,255,0.4)] transition-all duration-500" />
            <div className="flex flex-col justify-center">
                <h1 className="font-display font-bold text-base leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-400 animate-pulse tracking-wide hidden sm:block">ViictorN7</h1>
                <div className="relative overflow-hidden hidden sm:block">
                    <span className="text-[10px] font-medium text-white/30 lowercase tracking-widest group-hover:text-twitch transition-colors relative z-10">gabepeixe</span>
                    <span className="text-[10px] font-medium text-twitch/50 lowercase tracking-widest absolute top-0 left-0 animate-pulse opacity-0 group-hover:opacity-100 blur-[1px]">gabepeixe</span>
                </div>
            </div>
        </div>
      </div>

      {/* Center Controls */}
      <div className="flex-1 flex items-center justify-center gap-2">
        
        {/* Player Selector - Animated Segmented Control */}
        <div className="flex p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-inner relative z-0">
            {[
                { id: 'twitch', label: 'Twitch', icon: 'platform', platformId: 'twitch', color: 'bg-[#9146FF]' },
                { id: 'kick', label: 'Kick', icon: 'platform', platformId: 'kick', color: 'bg-[#53FC18]' },
                { id: 'dual', label: 'Dual', icon: 'dual', mobileLabel: 'Dual', desktopLabel: 'Multi', color: 'bg-white/20' },
                { id: 'none', label: 'Chat', icon: false, mobileLabel: 'Chat', desktopLabel: 'Apenas Chat', color: 'bg-white' }
            ].map((tab) => {
                const isActive = activePlayer === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onSetPlayer(tab.id as any)}
                        className={`relative z-10 flex items-center justify-center md:justify-start gap-0 md:gap-2 w-8 md:w-auto px-0 md:px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 ${isActive ? (tab.id === 'kick' || tab.id === 'none' ? 'text-black' : 'text-white') : 'text-gray-400 hover:text-white'}`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="player-active-bg"
                                className={`absolute inset-0 rounded-full ${tab.color} shadow-lg`}
                                transition={springTransition}
                                style={{ zIndex: -1 }}
                            />
                        )}
                        {tab.icon === 'platform' && (
                            <PlatformIcon 
                                platform={tab.platformId as any} 
                                variant={isActive ? (tab.id === 'twitch' ? 'white' : 'default') : 'subdued'} 
                                className="w-3.5 h-3.5 relative z-10" 
                            />
                        )}
                        {tab.icon === 'dual' && (
                             <SplitScreenIcon className="w-3.5 h-3.5 relative z-10" />
                        )}
                        <span className="relative z-10 hidden md:inline">{tab.desktopLabel || tab.label}</span>
                        {!tab.icon && <span className="relative z-10 md:hidden">{tab.mobileLabel}</span>}
                    </button>
                );
            })}
        </div>

        {/* Chat Filters - Animated Segmented Control (Desktop Only) */}
        <div className="hidden md:flex p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-inner relative z-0">
             {[
                 { id: 'all', label: 'All', icon: null },
                 { id: 'twitch', label: null, icon: 'twitch' },
                 { id: 'kick', label: null, icon: 'kick' }
             ].map((filter) => {
                 const isActive = chatFilter === filter.id;
                 let activeBg = 'bg-white/20 border-white/10';
                 if (filter.id === 'twitch') activeBg = 'bg-[#9146FF]/20 border-[#9146FF]/30';
                 if (filter.id === 'kick') activeBg = 'bg-[#53FC18]/20 border-[#53FC18]/30';

                 return (
                    <button 
                        key={filter.id}
                        onClick={() => onSetChatFilter(filter.id as any)} 
                        className={`relative z-10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 flex items-center justify-center min-w-[36px] ${isActive ? (filter.id === 'twitch' ? 'text-[#9146FF]' : filter.id === 'kick' ? 'text-[#53FC18]' : 'text-white') : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {isActive && (
                             <motion.div
                                layoutId="filter-active-bg"
                                className={`absolute inset-0 rounded-full border ${activeBg}`}
                                transition={springTransition}
                                style={{ zIndex: -1 }}
                            />
                        )}
                        {filter.label && <span className="relative z-10">{filter.label}</span>}
                        {filter.icon && <PlatformIcon platform={filter.icon as any} className="w-4 h-4 relative z-10" />}
                    </button>
                 );
             })}
        </div>
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3 justify-end shrink-0">
         <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenSettings} className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 border border-white/5 backdrop-blur-md"><SettingsIcon className="w-4 h-4" /></motion.button>
        
        <div className="hidden md:flex items-center gap-4">
            {activePlayer !== 'none' && (
                <motion.button 
                    whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.3)" }} 
                    whileTap={{ scale: 0.95 }} 
                    onClick={onSync} 
                    className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-black/40 text-gray-400 hover:text-white rounded-lg border border-white/10 transition-all shadow-sm group" 
                    title="Corrigir Atraso / Delay"
                >
                    <span className="w-2 h-2 rounded-full bg-red-500 group-hover:animate-pulse shadow-[0_0_8px_#ef4444]"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Delay</span>
                </motion.button>
            )}
            
            {/* Viewer Count Pill */}
            <div className="hidden xl:flex items-center bg-black/40 backdrop-blur-sm rounded-full border border-white/10 shadow-lg cursor-default select-none overflow-hidden h-9">
                <div className="px-3 h-full flex flex-col justify-center bg-white/5 border-r border-white/5">
                     <span className="text-[8px] font-bold text-gray-500 leading-none mb-0.5 uppercase">Total</span>
                     <motion.span key={totalViewers} initial={{ opacity: 0.5, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-mono font-bold text-white leading-none">{formatViewers(totalViewers)}</motion.span>
                </div>
                <div className="flex items-center gap-3 px-3">
                    <div className="flex items-center gap-1.5 opacity-80" title="Twitch Viewers">
                        <PlatformIcon platform="twitch" variant={streamStats.isLiveTwitch ? 'default' : 'subdued'} className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono font-medium text-gray-400">{formatViewers(streamStats.twitchViewers)}</span>
                    </div>
                    <div className="w-px h-3 bg-white/10"></div>
                    <div className="flex items-center gap-1.5 opacity-80" title="Kick Viewers">
                        <PlatformIcon platform="kick" variant={streamStats.isLiveKick ? 'default' : 'subdued'} className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono font-medium text-gray-400">{formatViewers(streamStats.kickViewers)}</span>
                    </div>
                </div>
            </div>

            <div className="hidden xl:block h-6 w-px bg-white/5"></div>
            <div className="flex items-center gap-2">
                {hasCloudAccess && onOpenBookmarks && (
                    <motion.button 
                        whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)", boxShadow: "0 0 15px rgba(255,215,0,0.2)" }} 
                        whileTap={{ scale: 0.9 }} 
                        onClick={onOpenBookmarks} 
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 text-yellow-500/70 hover:text-yellow-400 border border-white/10 shadow-lg transition-colors" 
                        title="Mensagens Salvas"
                    >
                        <span className="text-lg">★</span>
                    </motion.button>
                )}
                <motion.button 
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }} 
                    whileTap={{ scale: 0.9 }} 
                    onClick={onToggleCinema} 
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 text-gray-400 border border-white/10 shadow-lg hover:text-white transition-colors" 
                    title="Cinema Mode"
                >
                    <span className="text-lg">↕</span>
                </motion.button>
                <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "rgba(255,255,255,0.1)" }} 
                    whileTap={{ scale: 0.9, rotate: 0 }} 
                    onClick={onOpenSettings} 
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 text-gray-400 border border-white/10 shadow-lg hover:text-white transition-colors" 
                    title="Settings"
                >
                    <SettingsIcon className="w-5 h-5" />
                </motion.button>
            </div>
        </div>
      </div>
    </div>
  );
};