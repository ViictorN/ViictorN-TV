import React from 'react';
import { AuthState, StreamStats } from '../types';
import { SettingsIcon, ViictorNLogo, PlatformIcon } from './Icons';
import { motion } from 'framer-motion';

interface Props {
  authState: AuthState;
  onToggleAuth: (platform: 'twitch' | 'kick') => void;
  streamStats: StreamStats;
  onOpenSettings: () => void;
  activePlayer: 'twitch' | 'kick' | 'none';
  onSetPlayer: (player: 'twitch' | 'kick' | 'none') => void;
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
        
        {/* Player Selector - Visible on Mobile & Desktop */}
        <div className="flex p-0.5 md:p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-inner">
            <button onClick={() => onSetPlayer('twitch')} className={`relative flex items-center justify-center md:justify-start gap-0 md:gap-2 w-8 md:w-auto px-0 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${activePlayer === 'twitch' ? 'bg-[#9146FF] text-white shadow-lg shadow-[#9146FF]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <PlatformIcon platform="twitch" variant={activePlayer === 'twitch' ? 'white' : 'subdued'} className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Twitch</span>
            </button>
            <button onClick={() => onSetPlayer('kick')} className={`relative flex items-center justify-center md:justify-start gap-0 md:gap-2 w-8 md:w-auto px-0 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${activePlayer === 'kick' ? 'bg-[#53FC18] text-black shadow-lg shadow-[#53FC18]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <PlatformIcon platform="kick" variant={activePlayer === 'kick' ? 'default' : 'subdued'} className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Kick</span>
            </button>
            <button onClick={() => onSetPlayer('none')} className={`relative flex items-center justify-center md:justify-start gap-0 md:gap-2 w-10 md:w-auto px-0 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all duration-300 ${activePlayer === 'none' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <span className="md:hidden">Chat</span>
                <span className="hidden md:inline">Apenas Chat</span>
            </button>
        </div>

        {/* Chat Filters - HIDDEN ON MOBILE (Moved to floating bar in App.tsx) */}
        <div className="hidden md:flex p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-inner">
             <button onClick={() => onSetChatFilter('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${chatFilter === 'all' ? 'bg-white/20 text-white border border-white/10' : 'text-gray-500 hover:text-gray-300'}`}>All</button>
             <button onClick={() => onSetChatFilter('twitch')} className={`px-3 py-1.5 rounded-full transition-all duration-300 ${chatFilter === 'twitch' ? 'bg-[#9146FF]/20 text-[#9146FF] border border-[#9146FF]/30' : 'text-gray-500 hover:text-gray-300'}`}><PlatformIcon platform="twitch" className="w-4 h-4" /></button>
             <button onClick={() => onSetChatFilter('kick')} className={`px-3 py-1.5 rounded-full transition-all duration-300 ${chatFilter === 'kick' ? 'bg-[#53FC18]/20 text-[#53FC18] border border-[#53FC18]/30' : 'text-gray-500 hover:text-gray-300'}`}><PlatformIcon platform="kick" className="w-4 h-4" /></button>
        </div>
      </div>
      
      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3 justify-end shrink-0">
         <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenSettings} className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 border border-white/5 backdrop-blur-md"><SettingsIcon className="w-4 h-4" /></motion.button>
        
        <div className="hidden md:flex items-center gap-4">
            {activePlayer !== 'none' && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onSync} className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-black/40 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-all shadow-sm" title="Corrigir Atraso / Delay">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Delay</span>
                </motion.button>
            )}
            
            {/* Viewer Count Pill */}
            <div className="hidden xl:flex items-center bg-black/40 backdrop-blur-sm rounded-full border border-white/10 shadow-lg cursor-default select-none overflow-hidden h-9">
                <div className="px-3 h-full flex flex-col justify-center bg-white/5 border-r border-white/5">
                     <span className="text-[8px] font-bold text-gray-500 leading-none mb-0.5 uppercase">Total</span>
                     <motion.span key={totalViewers} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} className="text-xs font-mono font-bold text-white leading-none">{formatViewers(totalViewers)}</motion.span>
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
                    <motion.button whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.9 }} onClick={onOpenBookmarks} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 text-yellow-500/70 hover:text-yellow-400 border border-white/10 shadow-lg" title="Mensagens Salvas"><span className="text-lg">★</span></motion.button>
                )}
                <motion.button whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.9 }} onClick={onToggleCinema} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 text-gray-400 border border-white/10 shadow-lg" title="Cinema Mode"><span className="text-lg">↕</span></motion.button>
                <motion.button whileHover={{ scale: 1.1, rotate: 45, backgroundColor: "rgba(255,255,255,0.05)" }} whileTap={{ scale: 0.9, rotate: 0 }} onClick={onOpenSettings} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 text-gray-400 border border-white/10 shadow-lg" title="Settings"><SettingsIcon className="w-5 h-5" /></motion.button>
            </div>
        </div>
      </div>
    </div>
  );
};