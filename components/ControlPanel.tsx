import React from 'react';
import { AuthState, StreamStats } from '../types';
import { KickLogo, TwitchLogo, SettingsIcon, UsersIcon, ViictorNLogo } from './Icons';

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

  return (
    <div className="w-full h-16 md:h-20 bg-[#09090b]/95 backdrop-blur-xl border-b border-glass-border flex items-center justify-between px-4 md:px-6 z-50 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      
      {/* 1. ESQUERDA: Brand */}
      <div className="flex items-center gap-3 w-auto md:w-[200px]">
        <ViictorNLogo className="w-9 h-9 md:w-11 md:h-11 shadow-lg drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
        <div className="hidden md:flex flex-col">
            <h1 className="font-display font-bold text-lg leading-none tracking-tight text-white mb-0.5">
              ViictorN TV
            </h1>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Gabepeixe HQ</span>
        </div>
      </div>

      {/* 2. CENTRO: Controls & Stats */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-6">
        
        {/* View Counters */}
        <div className="flex items-center gap-4 bg-black/40 px-5 py-2 rounded-full border border-white/5 backdrop-blur-md shadow-inner">
             
             {/* Twitch Stats */}
             <div className="flex flex-col items-center leading-none min-w-[50px]">
                <div className="flex items-center gap-1 mb-0.5">
                   <TwitchLogo className={`w-3 h-3 ${streamStats.isLiveTwitch ? 'text-twitch' : 'text-gray-600'}`} />
                   <span className={`text-[10px] font-bold ${streamStats.isLiveTwitch ? 'text-twitch' : 'text-gray-600'}`}>TWITCH</span>
                </div>
                <span className={`text-sm font-mono font-bold ${streamStats.isLiveTwitch ? 'text-white' : 'text-gray-500'}`}>
                    {streamStats.twitchViewers !== null ? (streamStats.twitchViewers / 1000).toFixed(1) + 'k' : '-'}
                </span>
             </div>

             <div className="w-px h-8 bg-white/10"></div>

             {/* Kick Stats */}
             <div className="flex flex-col items-center leading-none min-w-[50px]">
                <div className="flex items-center gap-1 mb-0.5">
                   <KickLogo className={`w-3 h-3 ${streamStats.isLiveKick ? 'text-kick' : 'text-gray-600'}`} />
                   <span className={`text-[10px] font-bold ${streamStats.isLiveKick ? 'text-kick' : 'text-gray-600'}`}>KICK</span>
                </div>
                <span className={`text-sm font-mono font-bold ${streamStats.isLiveKick ? 'text-white' : 'text-gray-500'}`}>
                    {streamStats.kickViewers !== null ? (streamStats.kickViewers / 1000).toFixed(1) + 'k' : '-'}
                </span>
             </div>
        </div>

        {/* Player Selection */}
        <div className="flex items-center bg-black/40 rounded-full border border-white/5 p-1">
            <button
                onClick={() => onSetPlayer('twitch')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activePlayer === 'twitch' ? 'bg-twitch text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                <TwitchLogo className="w-3.5 h-3.5" />
                Player
            </button>
            <button
                onClick={() => onSetPlayer('kick')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activePlayer === 'kick' ? 'bg-kick text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                <KickLogo className="w-3.5 h-3.5" />
                Player
            </button>
            <button
                onClick={() => onSetPlayer('none')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activePlayer === 'none' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Só Chat
            </button>
        </div>

      </div>
      
      {/* 3. DIREITA: Botões de Conexão */}
      <div className="flex items-center gap-2 md:gap-3 justify-end w-auto md:w-[200px]">
        
        {/* Toggle Buttons (Mobile only simplified, Desktop full) */}
        <div className="flex items-center gap-2">
            {/* Twitch Button */}
            <button 
                onClick={() => onToggleAuth('twitch')}
                className={`group relative h-9 w-9 md:h-10 md:w-auto md:px-3 flex items-center justify-center gap-2 rounded-xl border transition-all duration-200 ${
                    authState.twitch 
                    ? 'bg-twitch/10 border-twitch text-twitch shadow-[0_0_15px_rgba(145,70,255,0.2)]' 
                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                }`}
                title="Conexão Twitch"
            >
                <TwitchLogo className="w-5 h-5" />
                <span className={`hidden md:block text-xs font-bold ${authState.twitch ? 'text-twitch' : 'text-gray-400'}`}>
                    {authState.twitch ? 'ON' : 'OFF'}
                </span>
            </button>

            {/* Kick Button */}
            <button 
                onClick={() => onToggleAuth('kick')}
                className={`group relative h-9 w-9 md:h-10 md:w-auto md:px-3 flex items-center justify-center gap-2 rounded-xl border transition-all duration-200 ${
                    authState.kick
                    ? 'bg-kick/10 border-kick text-kick shadow-[0_0_15px_rgba(83,252,24,0.2)]' 
                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                }`}
                title="Conexão Kick"
            >
                <KickLogo className="w-5 h-5" />
                 <span className={`hidden md:block text-xs font-bold ${authState.kick ? 'text-kick' : 'text-gray-400'}`}>
                    {authState.kick ? 'ON' : 'OFF'}
                </span>
            </button>
        </div>

        <div className="h-6 md:h-8 w-px bg-white/10 mx-1"></div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
            <button
            onClick={onAnalyze}
            disabled={isAnalyzing || (!authState.twitch && !authState.kick)}
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-30 border border-white/5 active:scale-95"
            title="IA Analysis"
            >
                {isAnalyzing ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                ) : (
                <span className="text-lg">✨</span>
                )}
            </button>

            <button
            onClick={onOpenSettings}
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-dark hover:bg-white/5 text-gray-400 hover:text-white transition-colors border border-glass-border shadow-sm active:scale-95"
            title="Configurações"
            >
                <SettingsIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );
};