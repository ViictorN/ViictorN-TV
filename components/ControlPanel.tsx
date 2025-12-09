import React from 'react';
import { AuthState, StreamStats } from '../types';
import { KickLogo, TwitchLogo, SettingsIcon, ViictorNLogo, UsersIcon } from './Icons';

interface Props {
  authState: AuthState;
  onToggleAuth: (platform: 'twitch' | 'kick') => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  streamStats: StreamStats;
  onOpenSettings: () => void;
  activePlayer: 'twitch' | 'kick' | 'none';
  onSetPlayer: (player: 'twitch' | 'kick' | 'none') => void;
  chatFilter: 'all' | 'twitch' | 'kick';
  onSetChatFilter: (filter: 'all' | 'twitch' | 'kick') => void;
}

export const ControlPanel: React.FC<Props> = ({ 
    authState, 
    onToggleAuth, 
    onAnalyze, 
    isAnalyzing, 
    streamStats, 
    onOpenSettings,
    activePlayer,
    onSetPlayer,
    chatFilter,
    onSetChatFilter
}) => {
  
  const totalViewers = (streamStats.kickViewers || 0) + (streamStats.twitchViewers || 0);
  
  const formatViewers = (num: number | null) => {
      if (num === null) return '-';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
  };

  return (
    <div className="w-full liquid-glass-strong border-b border-white/5 flex flex-row items-center justify-between px-3 md:px-4 h-[52px] md:h-[72px] z-50 sticky top-0 transition-all duration-500 ease-out-expo shrink-0">
      
      {/* 1. LEFT: Brand (Mobile: Icon only, Desktop: Full) */}
      <div className="flex items-center md:w-auto md:justify-start shrink-0 mr-2">
        <div className="flex items-center gap-3 group cursor-default">
            <ViictorNLogo className="w-7 h-7 md:w-10 md:h-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_20px_rgba(145,70,255,0.4)] transition-all duration-500" />
            <div className="hidden md:flex flex-col justify-center">
                <h1 className="font-display font-bold text-base leading-tight text-white tracking-wide">
                  ViictorN
                </h1>
                <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest group-hover:text-twitch transition-colors">Multi-Chat</span>
            </div>
        </div>
      </div>

      {/* 2. CENTER: Player Selection (Neon Pill) - Mobile Optimized */}
      <div className="flex-1 md:flex-none flex justify-center max-w-[280px] md:max-w-none mx-auto gap-2">
        {/* PLAYER SELECTOR */}
        <div className="flex p-0.5 md:p-1 bg-black rounded-full border border-white/10 w-auto shadow-inner shadow-white/5">
            <button
                onClick={() => onSetPlayer('twitch')}
                className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-500 ease-out-expo ${activePlayer === 'twitch' ? 'bg-[#9146FF] text-white shadow-[0_0_20px_rgba(145,70,255,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}
                title="Assistir Twitch"
            >
                <TwitchLogo className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            <button
                onClick={() => onSetPlayer('kick')}
                className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-500 ease-out-expo ${activePlayer === 'kick' ? 'bg-[#53FC18] text-black shadow-[0_0_20px_rgba(83,252,24,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}
                title="Assistir Kick"
            >
                <KickLogo className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            <button
                onClick={() => onSetPlayer('none')}
                className={`flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-500 ease-out-expo ${activePlayer === 'none' ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
                title="Modo Apenas Chat"
            >
                Chat
            </button>
        </div>

        {/* CHAT FILTER (VISIBLE ALWAYS on Desktop) */}
        <div className="hidden sm:flex p-0.5 md:p-1 bg-black rounded-full border border-white/10 w-auto ml-2">
             <button 
                onClick={() => onSetChatFilter('all')} 
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${chatFilter === 'all' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-400'}`}
             >
                 All
             </button>
             <button 
                onClick={() => onSetChatFilter('twitch')} 
                className={`px-2 py-1.5 rounded-full text-[10px] ${chatFilter === 'twitch' ? 'text-twitch bg-twitch/10' : 'text-gray-600 hover:text-gray-400'}`}
             >
                 <TwitchLogo className="w-3.5 h-3.5" />
             </button>
             <button 
                onClick={() => onSetChatFilter('kick')} 
                className={`px-2 py-1.5 rounded-full text-[10px] ${chatFilter === 'kick' ? 'text-kick bg-kick/10' : 'text-gray-600 hover:text-gray-400'}`}
             >
                 <KickLogo className="w-3.5 h-3.5" />
             </button>
        </div>
      </div>
      
      {/* 3. RIGHT: Stats & Desktop Tools */}
      <div className="flex items-center gap-2 justify-end shrink-0 ml-2">
        
        {/* Mobile Settings Trigger */}
         <button
            onClick={onOpenSettings}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 active:scale-95 transition-transform border border-white/5"
        >
            <SettingsIcon className="w-4 h-4" />
        </button>

        {/* Desktop Stats & Tools */}
        <div className="hidden md:flex items-center gap-4">
            {/* Stats Pill */}
            <div className="flex items-center gap-3 bg-black px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
                <div className="flex flex-col items-center min-w-[30px]">
                    <span className="text-[9px] font-bold text-gray-500 mb-0.5">TOT</span>
                    <span className="text-xs font-mono font-bold text-white text-shadow-sm">{formatViewers(totalViewers)}</span>
                </div>
                <div className="w-px h-5 bg-white/10"></div>
                <div className="flex items-center gap-1.5 opacity-80">
                    <TwitchLogo className={`w-3.5 h-3.5 ${streamStats.isLiveTwitch ? 'text-twitch' : 'text-gray-700'}`} />
                    <span className="text-[10px] font-mono font-medium text-gray-400">{formatViewers(streamStats.twitchViewers)}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-80">
                    <KickLogo className={`w-3.5 h-3.5 ${streamStats.isLiveKick ? 'text-kick' : 'text-gray-700'}`} />
                    <span className="text-[10px] font-mono font-medium text-gray-400">{formatViewers(streamStats.kickViewers)}</span>
                </div>
            </div>

            {/* Separator */}
            <div className="h-6 w-px bg-white/5"></div>

            {/* Tools */}
            <div className="flex items-center gap-2">
                <button
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-black hover:bg-white/5 text-gray-400 hover:text-white transition-all duration-300 border border-white/10 hover:border-white/20 active:scale-90 shadow-lg"
                title="AI Analysis"
                >
                    {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : '✨'}
                </button>

                <button
                onClick={onOpenSettings}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-black hover:bg-white/5 text-gray-400 hover:text-white transition-all duration-300 border border-white/10 hover:border-white/20 active:scale-90 shadow-lg"
                title="Settings"
                >
                    <SettingsIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>

    </div>
  );
};