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
}

export const ControlPanel: React.FC<Props> = ({ authState, onToggleAuth, onAnalyze, isAnalyzing, streamStats, onOpenSettings }) => {
  
  const totalViewers = (streamStats.kickViewers || 0) + (streamStats.twitchViewers || 0);

  return (
    <div className="w-full h-16 bg-[#09090b]/95 backdrop-blur-xl border-b border-glass-border flex items-center justify-between px-6 z-40 sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      
      {/* 1. ESQUERDA: Brand */}
      <div className="flex items-center gap-3 w-[200px]">
        <ViictorNLogo className="w-10 h-10 shadow-lg drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
        <div className="hidden sm:flex flex-col">
            <h1 className="font-display font-bold text-base leading-none tracking-tight text-white mb-0.5">
              ViictorN TV
            </h1>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Gabepeixe HQ</span>
        </div>
      </div>

      {/* 2. CENTRO: View Counters (Moved to center) */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md shadow-inner">
             
             {/* Twitch Stats */}
             <div className="flex flex-col items-center leading-none min-w-[40px]">
                <span className={`text-[9px] font-bold mb-0.5 ${streamStats.isLiveTwitch ? 'text-twitch' : 'text-gray-600'}`}>TWITCH</span>
                <span className={`text-xs font-mono font-bold ${streamStats.isLiveTwitch ? 'text-white' : 'text-gray-500'}`}>
                    {streamStats.twitchViewers !== null ? (streamStats.twitchViewers / 1000).toFixed(1) + 'k' : '-'}
                </span>
             </div>

             <div className="w-px h-6 bg-white/10"></div>

             {/* Kick Stats */}
             <div className="flex flex-col items-center leading-none min-w-[40px]">
                <span className={`text-[9px] font-bold mb-0.5 ${streamStats.isLiveKick ? 'text-kick' : 'text-gray-600'}`}>KICK</span>
                <span className={`text-xs font-mono font-bold ${streamStats.isLiveKick ? 'text-white' : 'text-gray-500'}`}>
                    {streamStats.kickViewers !== null ? (streamStats.kickViewers / 1000).toFixed(1) + 'k' : '-'}
                </span>
             </div>
             
             <div className="w-px h-6 bg-white/10"></div>
             
             {/* Total */}
             <div className="flex items-center gap-2 min-w-[50px] justify-center">
                <UsersIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-mono font-bold text-white">
                    {totalViewers > 0 ? (totalViewers / 1000).toFixed(1) + 'k' : '-'}
                </span>
             </div>
        </div>
      </div>
      
      {/* 3. DIREITA: Botões de Conexão e Configs (Moved to right) */}
      <div className="flex items-center gap-2 justify-end w-[200px]">
        
        {/* Toggle Buttons */}
        <div className="flex items-center gap-1 mr-2">
            <button 
                onClick={() => onToggleAuth('twitch')}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-200 ${
                    authState.twitch 
                    ? 'bg-twitch border-twitch text-white shadow-[0_0_12px_rgba(145,70,255,0.4)]' 
                    : 'bg-white/5 border-transparent text-gray-600 hover:bg-white/10'
                }`}
                title="Ativar chat Twitch"
            >
                <TwitchLogo className="w-5 h-5" />
            </button>

            <button 
                onClick={() => onToggleAuth('kick')}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-200 ${
                    authState.kick
                    ? 'bg-kick border-kick text-black shadow-[0_0_12px_rgba(83,252,24,0.4)]' 
                    : 'bg-white/5 border-transparent text-gray-600 hover:bg-white/10'
                }`}
                title="Ativar chat Kick"
            >
                <KickLogo className="w-5 h-5" />
            </button>
        </div>

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || (!authState.twitch && !authState.kick)}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-30 border border-white/5"
          title="IA Analysis"
        >
            {isAnalyzing ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
            ) : (
              <span className="text-lg grayscale hover:grayscale-0 transition-all">✨</span>
            )}
        </button>

        <button
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-twitch/10 hover:bg-twitch/20 text-twitch transition-colors border border-twitch/20 shadow-sm"
          title="Configurações API"
        >
            <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};