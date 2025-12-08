import React, { useState, useEffect } from 'react';
import { TwitchCreds } from '../types';
import { TwitchLogo, KickLogo } from './Icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveTwitch: (creds: TwitchCreds) => void;
  currentCreds: TwitchCreds;
  kickUsername: string;
  onSaveKick: (username: string) => void;
}

export const SettingsModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    onSaveTwitch, 
    currentCreds,
    kickUsername,
    onSaveKick 
}) => {
  const [clientId, setClientId] = useState(currentCreds.clientId || '');
  const [accessToken, setAccessToken] = useState(currentCreds.accessToken || '');
  const [localKickUser, setLocalKickUser] = useState(kickUsername || '');

  // Update local state when props change
  useEffect(() => {
    setClientId(currentCreds.clientId);
    setAccessToken(currentCreds.accessToken);
    setLocalKickUser(kickUsername);
  }, [currentCreds, kickUsername, isOpen]);

  if (!isOpen) return null;

  const handleTwitchLogin = () => {
    if (!clientId) {
        alert("Por favor, insira um Client ID primeiro.");
        return;
    }
    // Implicit Grant Flow
    const redirectUri = window.location.origin; // e.g., http://localhost:5173
    const scope = 'chat:read user:read:email';
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
    
    window.location.href = authUrl;
  };

  const handleSave = () => {
      onSaveTwitch({ clientId, accessToken });
      onSaveKick(localKickUser);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#0f0f11] border border-glass-border w-full max-w-lg p-6 rounded-2xl shadow-2xl relative z-10 animate-slide-in">
        <h2 className="text-2xl font-display font-bold mb-6 text-white">
           Contas & Conexões
        </h2>
        
        <div className="space-y-8">
            {/* TWITCH SECTION */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <TwitchLogo className="w-5 h-5 text-twitch" />
                    <h3 className="font-bold text-lg text-gray-200">Twitch</h3>
                </div>

                <div className="bg-twitch/5 p-4 rounded-xl border border-twitch/10">
                    <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase tracking-wider">Client ID</label>
                    <input 
                        type="text" 
                        value={clientId}
                        onChange={e => setClientId(e.target.value)}
                        className="w-full bg-black/50 border border-glass-border rounded-lg p-3 text-sm focus:border-twitch outline-none transition-colors mb-3"
                        placeholder="Insira seu Client ID da Twitch Dev"
                    />
                    
                    {accessToken ? (
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-400/10 p-2 rounded">
                            <span>✓ Conectado com sucesso</span>
                            <button onClick={() => setAccessToken('')} className="text-xs text-gray-500 hover:text-white underline ml-auto">Desconectar</button>
                        </div>
                    ) : (
                        <button 
                            type="button"
                            onClick={handleTwitchLogin}
                            className="w-full py-2.5 rounded-lg bg-twitch text-white font-medium hover:bg-twitch/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-twitch/20"
                        >
                            <TwitchLogo className="w-4 h-4" />
                            Entrar com a Twitch
                        </button>
                    )}
                    <p className="text-[10px] text-gray-500 mt-2">
                        Necessário para ler Badges e Viewers reais. O token é salvo no seu navegador.
                        <a href="https://dev.twitch.tv/console" target="_blank" className="text-twitch hover:underline ml-1">Obter Client ID</a>
                    </p>
                </div>
            </div>

            {/* KICK SECTION */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <KickLogo className="w-5 h-5 text-kick" />
                    <h3 className="font-bold text-lg text-gray-200">Kick</h3>
                </div>
                
                <div className="bg-kick/5 p-4 rounded-xl border border-kick/10">
                    <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase tracking-wider">Seu Username na Kick</label>
                    <input 
                        type="text" 
                        value={localKickUser}
                        onChange={e => setLocalKickUser(e.target.value)}
                        className="w-full bg-black/50 border border-glass-border rounded-lg p-3 text-sm focus:border-kick outline-none transition-colors"
                        placeholder="Ex: ViictorN"
                    />
                    <p className="text-[10px] text-gray-500 mt-2">
                        Usado para identificar sua sessão. A Kick não possui login público.
                    </p>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
            <button 
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
                Cancelar
            </button>
            <button 
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-gray-200 transition-colors shadow-lg"
            >
                Salvar Alterações
            </button>
        </div>
      </div>
    </div>
  );
};