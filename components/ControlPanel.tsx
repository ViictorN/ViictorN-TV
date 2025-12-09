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
    <div className="w-full bg-[#09090b]/95 backdrop-blur-xl border-b border-glass-border flex flex-col md:flex-row items-center justify-between px-3 md:px-6 py-2 md:py-0 md:h-20 z-50 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)] gap-2 md:gap-0">
      
      {/* 1. TOP ROW (Mobile) / LEFT (Desktop): Brand & Total */}
      <div className="flex items-center justify-between w-full md:w-auto md:justify-start md:gap-6">
        <div className="flex items-center gap-3">
            <ViictorNLogo className="w-8 h-8 md:w-11 md:h-11 shadow-lg drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
            <div className="flex flex-col">
                <h1 className="font-display font-bold text-base md:text-lg leading-none tracking-tight text-white mb-0.5">
                ViictorN TV
                </h1>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest hidden md:block">Gabepeixe HQ</span>
            </div>
        </div>

        {/* GLOBAL COUNTER (Visible on Mobile & Desktop) */}
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 md:hidden">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</span>
            <span className="text-sm font-mono font-bold text-white text-shadow-neon">{formatViewers(totalViewers)}</span>
        </div>
      </div>

      {/* 2. CENTER: Player Selection & Desktop Stats */}
      <div className="flex items-center gap-4 md:absolute md:left-1/2 md:top-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 w-full md:w-auto justify-center">
        
        {/* Detailed Stats (Desktop Only) */}
        <div className="hidden lg:flex items-center gap-4 bg-black/40 px-5 py-2 rounded-full border border-white/5 backdrop-blur-md shadow-inner">
             {/* Total */}
             <div className="flex flex-col items-center leading-none min-w-[50px]">
                <span className="text-[10px] font-bold text-gray-400 mb-0.5">TOTAL</span>
                <span className="text-sm font-mono font-bold text-white">{formatViewers(totalViewers)}</span>
             </div>
             
             <div className="w-px h-6 bg-white/10"></div>

             {/* Twitch Stats */}
             <div className="flex flex-col items-center leading-none min-w-[50px]">
                <div className="flex items-center gap-1 mb-0.5">
                   <TwitchLogo className={`w-3 h-3 ${streamStats.isLiveTwitch ? 'text-twitch' : 'text-gray-600'}`} />
                   <span className={`text-[10px] font-bold ${streamStats.isLiveTwitch ? 'text-twitch' : 'text-gray-600'}`}>TW</span>
                </div>
                <span className={`text-sm font-mono font-bold ${streamStats.isLiveTwitch ? 'text-white' : 'text-gray-500'}`}>
                    {formatViewers(streamStats.twitchViewers)}
                </span>
             </div>

             <div className="w-px h-6 bg-white/10"></div>

             {/* Kick Stats */}
             <div className="flex flex-col items-center leading-none min-w-[50px]">
                <div className="flex items-center gap-1 mb-0.5">
                   <KickLogo className={`w-3 h-3 ${streamStats.isLiveKick ? 'text-kick' : 'text-gray-600'}`} />
                   <span className={`text-[10px] font-bold ${streamStats.isLiveKick ? 'text-kick' : 'text-gray-600'}`}>KICK</span>
                </div>
                <span className={`text-sm font-mono font-bold ${streamStats.isLiveKick ? 'text-white' : 'text-gray-500'}`}>
                    {formatViewers(streamStats.kickViewers)}
                </span>
             </div>
        </div>

        {/* Player Switcher (Responsive) */}
        <div className="flex items-center bg-black/40 rounded-full border border-white/5 p-1 w-full md:w-auto justify-between md:justify-start">
            <button
                onClick={() => onSetPlayer('twitch')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all ${activePlayer === 'twitch' ? 'bg-twitch text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                <TwitchLogo className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="md:inline">Player</span>
            </button>
            <button
                onClick={() => onSetPlayer('kick')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all ${activePlayer === 'kick' ? 'bg-kick text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                <KickLogo className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="md:inline">Player</span>
            </button>
            <button
                onClick={() => onSetPlayer('none')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all ${activePlayer === 'none' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Só Chat
            </button>
        </div>

      </div>
      
      {/* 3. RIGHT: Actions (Hidden on really small screens if crowded, or adjusted) */}
      <div className="hidden md:flex items-center gap-2 md:gap-3 justify-end w-auto md:w-[200px]">
        
        {/* Connection Toggles */}
        <div className="flex items-center gap-2">
            <button 
                onClick={() => onToggleAuth('twitch')}
                className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all ${authState.twitch ? 'bg-twitch/10 border-twitch text-twitch' : 'bg-white/5 border-transparent text-gray-500'}`}
                title="Status Twitch"
            >
                <TwitchLogo className="w-4 h-4" />
            </button>
             <button 
                onClick={() => onToggleAuth('kick')}
                className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all ${authState.kick ? 'bg-kick/10 border-kick text-kick' : 'bg-white/5 border-transparent text-gray-500'}`}
                title="Status Kick"
            >
                <KickLogo className="w-4 h-4" />
            </button>
        </div>

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        {/* Utility Buttons */}
        <div className="flex items-center gap-2">
            <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5"
            >
                {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : '✨'}
            </button>

            <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-dark hover:bg-white/5 text-gray-400 hover:text-white transition-colors border border-glass-border"
            >
                <SettingsIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
      
      {/* Mobile Settings Button (Absolute position for saving space) */}
       <button
            onClick={onOpenSettings}
            className="md:hidden absolute right-3 top-3.5 p-2 text-gray-400 hover:text-white"
        >
            <SettingsIcon className="w-5 h-5" />
        </button>
    </div>
  );
};