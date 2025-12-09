import React from 'react';
import { AuthState, StreamStats } from '../types';
import { KickLogo, TwitchLogo, SettingsIcon, ViictorNLogo } from './Icons';

interface Props {
  authState: AuthState;
  onToggleAuth: (platform: 'twitch' | 'kick') => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  streamStats: StreamStats;
  onOpenSettings: () => void;
  activePlayer: 'twitch' | 'kick' | 'none';
  onSetPlayer: (player: 'twitch' | 'kick' | 'none') => void;
}

export const ControlPanel: React.FC<Props> = ({ 
    authState, 
    onToggleAuth, 
    onAnalyze, 
    isAnalyzing, 
    streamStats, 
    onOpenSettings,
    activePlayer,
    onSetPlayer
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
      <div className="flex-1 md:flex-none flex justify-center max-w-[280px] md:max-w-none mx-auto">
        <div className="flex p-0.5 md:p-1 bg-black rounded-full border border-white/5 w-full md:w-auto shadow-inner shadow-white/5">
            <button
                onClick={() => onSetPlayer('twitch')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-500 ease-out-expo ${activePlayer === 'twitch' ? 'bg-[#9146FF] text-white shadow-[0_0_20px_rgba(145,70,255,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <TwitchLogo className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="inline">Twitch</span>
            </button>
            <button
                onClick={() => onSetPlayer('kick')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-500 ease-out-expo ${activePlayer === 'kick' ? 'bg-[#53FC18] text-black shadow-[0_0_20px_rgba(83,252,24,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
                <KickLogo className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="inline">Kick</span>
            </button>
            <button
                onClick={() => onSetPlayer('none')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-500 ease-out-expo ${activePlayer === 'none' ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Chat
            </button>
        </div>
      </div>
      
      {/* 3. RIGHT: Stats & Desktop Tools */}
      <div className="flex items-center gap-2 justify-end shrink-0 ml-2">
        
        {/* Mobile Settings Trigger */}
         <button
            onClick={onOpenSettings}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 active:scale-95 transition-transform"
        >
            <SettingsIcon className="w-4 h-4" />
        </button>

        {/* Desktop Stats & Tools */}
        <div className="hidden md:flex items-center gap-4">
            {/* Stats Pill */}
            <div className="flex items-center gap-3 bg-black px-4 py-2 rounded-2xl border border-white/5">
                <div className="flex flex-col items-center min-w-[30px]">
                    <span className="text-[9px] font-bold text-gray-500 mb-0.5">TOT</span>
                    <span className="text-xs font-mono font-bold text-white text-shadow-sm">{formatViewers(totalViewers)}</span>
                </div>
                <div className="w-px h-5 bg-white/10"></div>
                <div className="flex items-center gap-1.5 opacity-80">
                    <TwitchLogo className={`w-3 h-3 ${streamStats.isLiveTwitch ? 'text-twitch' : 'text-gray-700'}`} />
                    <span className="text-[10px] font-mono font-medium text-gray-400">{formatViewers(streamStats.twitchViewers)}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-80">
                    <KickLogo className={`w-3 h-3 ${streamStats.isLiveKick ? 'text-kick' : 'text-gray-700'}`} />
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
                className="w-10 h-10 rounded-full flex items-center justify-center bg-black hover:bg-white/5 text-gray-400 hover:text-white transition-all duration-300 border border-white/5 hover:border-white/10 active:scale-90"
                title="AI Analysis"
                >
                    {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : '✨'}
                </button>

                <button
                onClick={onOpenSettings}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-black hover:bg-white/5 text-gray-400 hover:text-white transition-all duration-300 border border-white/5 hover:border-white/10 active:scale-90"
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