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
    <div className="w-full liquid-glass-strong border-b border-glass-border flex flex-col md:flex-row items-center justify-between px-4 py-3 md:py-0 md:h-[72px] z-50 sticky top-0 gap-3 md:gap-0">
      
      {/* 1. LEFT: Brand & Mobile Stats */}
      <div className="flex items-center justify-between w-full md:w-auto md:justify-start">
        <div className="flex items-center gap-3">
            <ViictorNLogo className="w-10 h-10 drop-shadow-lg" />
            <div className="flex flex-col justify-center">
                <h1 className="font-display font-bold text-base leading-tight text-white tracking-wide">
                  ViictorN
                </h1>
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-widest">Multi-Chat</span>
            </div>
        </div>
        
        {/* Mobile Settings Trigger */}
        <button
            onClick={onOpenSettings}
            className="md:hidden p-2 rounded-full bg-white/5 text-white/70 hover:bg-white/10"
        >
            <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 2. CENTER: Player Selection (Glass Pill) */}
      <div className="w-full md:w-auto flex justify-center">
        <div className="flex p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/5 w-full md:w-auto">
            <button
                onClick={() => onSetPlayer('twitch')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${activePlayer === 'twitch' ? 'bg-[#9146FF] text-white shadow-lg shadow-purple-900/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <TwitchLogo className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Twitch</span>
            </button>
            <button
                onClick={() => onSetPlayer('kick')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${activePlayer === 'kick' ? 'bg-[#53FC18] text-black shadow-lg shadow-green-900/40' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                <KickLogo className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kick</span>
            </button>
            <button
                onClick={() => onSetPlayer('none')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 ${activePlayer === 'none' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                Chat
            </button>
        </div>
      </div>
      
      {/* 3. RIGHT: Stats & Desktop Tools */}
      <div className="hidden md:flex items-center gap-4 justify-end w-auto">
        
        {/* Stats Pill */}
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
             <div className="flex flex-col items-center min-w-[30px]">
                <span className="text-[9px] font-bold text-white/40 mb-0.5">TOT</span>
                <span className="text-xs font-mono font-bold text-white">{formatViewers(totalViewers)}</span>
             </div>
             <div className="w-px h-5 bg-white/10"></div>
             <div className="flex items-center gap-1.5 opacity-80">
                <TwitchLogo className={`w-3 h-3 ${streamStats.isLiveTwitch ? 'text-twitch' : 'text-gray-600'}`} />
                <span className="text-[10px] font-mono font-medium text-white/70">{formatViewers(streamStats.twitchViewers)}</span>
             </div>
             <div className="flex items-center gap-1.5 opacity-80">
                <KickLogo className={`w-3 h-3 ${streamStats.isLiveKick ? 'text-kick' : 'text-gray-600'}`} />
                <span className="text-[10px] font-mono font-medium text-white/70">{formatViewers(streamStats.kickViewers)}</span>
             </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-white/10"></div>

        {/* Tools */}
        <div className="flex items-center gap-2">
            <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5 active:scale-95"
            title="AI Analysis"
            >
                {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : '✨'}
            </button>

            <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5 active:scale-95"
            title="Settings"
            >
                <SettingsIcon className="w-5 h-5" />
            </button>
        </div>
      </div>

    </div>
  );
};