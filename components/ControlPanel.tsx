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
      
      <div className="flex items-center md:w-auto md:justify-start shrink-0 mr-2 gap-4">
        <div className="flex items-center gap-3 group cursor-default">
            <ViictorNLogo className="w-7 h-7 md:w-10 md:h-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_20px_rgba(145,70,255,0.4)] transition-all duration-500" />
            <div className="hidden lg:flex flex-col justify-center">
                <h1 className="font-display font-bold text-base leading-tight text-white tracking-wide">ViictorN7</h1>
                <span className="text-[10px] font-medium text-white/30 lowercase tracking-widest group-hover:text-twitch transition-colors">gabepeixe</span>
            </div>
        </div>
      </div>

      <div className="flex-1 md:flex-none flex justify-center max-w-[280px] md:max-w-none mx-auto gap-2">
        <div className="flex p-0.5 md:p-1 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 w-auto shadow-inner shadow-white/5">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSetPlayer('twitch')} className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-colors ${activePlayer === 'twitch' ? 'bg-[#9146FF] text-white shadow-[0_0_20px_rgba(145,70,255,0.4)]' : 'text-gray-500 hover:text-gray-300'}`} title="Assistir Twitch">
                <PlatformIcon platform="twitch" variant={activePlayer === 'twitch' ? 'white' : 'default'} className="w-3 h-3 md:w-4 md:h-4" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSetPlayer('kick')} className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-colors ${activePlayer === 'kick' ? 'bg-[#53FC18] text-black shadow-[0_0_20px_rgba(83,252,24,0.4)]' : 'text-gray-500 hover:text-gray-300'}`} title="Assistir Kick">
                <PlatformIcon platform="kick" variant={activePlayer === 'kick' ? 'default' : 'default'} className="w-3 h-3 md:w-4 md:h-4 text-inherit" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSetPlayer('none')} className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-colors ${activePlayer === 'none' ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`} title="Modo Apenas Chat">Chat</motion.button>
        </div>

        <div className="hidden sm:flex p-0.5 md:p-1 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 w-auto ml-2">
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSetChatFilter('all')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${chatFilter === 'all' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-400'}`}>All</motion.button>
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSetChatFilter('twitch')} className={`px-2 py-1.5 rounded-full text-[10px] ${chatFilter === 'twitch' ? 'bg-twitch/10' : 'hover:text-gray-400'}`}><PlatformIcon platform="twitch" variant={chatFilter === 'twitch' ? 'default' : 'subdued'} className="w-3.5 h-3.5" /></motion.button>
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSetChatFilter('kick')} className={`px-2 py-1.5 rounded-full text-[10px] ${chatFilter === 'kick' ? 'bg-kick/10' : 'hover:text-gray-400'}`}><PlatformIcon platform="kick" variant={chatFilter === 'kick' ? 'default' : 'subdued'} className="w-3.5 h-3.5" /></motion.button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 justify-end shrink-0 ml-2">
         <motion.button whileTap={{ scale: 0.9 }} onClick={onOpenSettings} className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 border border-white/5"><SettingsIcon className="w-4 h-4" /></motion.button>
        <div className="hidden md:flex items-center gap-4">
            {activePlayer !== 'none' && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onSync} className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg border border-red-500/20 hover:border-red-500/40" title="Sincronizar Player">
                    <span className="text-sm">⚡</span><span className="text-[10px] font-bold uppercase tracking-wider">Sync</span>
                </motion.button>
            )}
            <div className="hidden xl:flex items-center gap-3 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10 shadow-lg cursor-default select-none">
                <div className="flex flex-col items-center min-w-[30px]"><span className="text-[9px] font-bold text-gray-500 mb-0.5">TOT</span><motion.span key={totalViewers} initial={{ scale: 1.2, color: '#fff' }} animate={{ scale: 1, color: '#fff' }} className="text-xs font-mono font-bold text-white text-shadow-sm">{formatViewers(totalViewers)}</motion.span></div>
                <div className="w-px h-5 bg-white/10"></div>
                <div className="flex items-center gap-1.5 opacity-80"><PlatformIcon platform="twitch" variant={streamStats.isLiveTwitch ? 'default' : 'subdued'} className="w-3.5 h-3.5" /><span className="text-[10px] font-mono font-medium text-gray-400">{formatViewers(streamStats.twitchViewers)}</span></div>
                <div className="flex items-center gap-1.5 opacity-80"><PlatformIcon platform="kick" variant={streamStats.isLiveKick ? 'default' : 'subdued'} className="w-3.5 h-3.5" /><span className="text-[10px] font-mono font-medium text-gray-400">{formatViewers(streamStats.kickViewers)}</span></div>
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