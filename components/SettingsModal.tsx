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
  const [authMethod, setAuthMethod] = useState<'auto' | 'manual'>('manual');

  useEffect(() => {
    setClientId(currentCreds.clientId);
    setAccessToken(currentCreds.accessToken);
    setLocalKickUser(kickUsername);
  }, [currentCreds, kickUsername, isOpen]);

  if (!isOpen) return null;

  const currentUrl = window.location.origin + window.location.pathname;

  const handleTwitchLogin = () => {
    if (!clientId) {
        alert("Por favor, insira um Client ID primeiro.");
        return;
    }
    const redirectUri = window.location.origin; 
    const scope = 'chat:read chat:edit user:read:email';
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
    
    const width = 500;
    const height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
        authUrl, 
        'TwitchLogin', 
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes,resizable=yes`
    );
  };

  const handleSave = () => {
      onSaveTwitch({ clientId, accessToken });
      onSaveKick(localKickUser);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-500 ease-out-expo" onClick={onClose}></div>
      <div className="liquid-glass w-full max-w-xl p-0 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5 relative z-10 animate-slide-in max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col bg-[#050505]">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 p-6 z-20 flex justify-between items-center">
             <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                Contas & Conexões
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">
                ✕
            </button>
        </div>
        
        <div className="p-6 space-y-8">
            {/* TWITCH SECTION */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-twitch/10 flex items-center justify-center text-twitch shadow-[0_0_15px_rgba(145,70,255,0.1)]">
                        <TwitchLogo className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">Twitch</h3>
                        <p className="text-xs text-gray-400">Opcional: Necessário apenas para enviar mensagens</p>
                    </div>
                </div>

                <div className="bg-twitch/5 p-4 rounded-xl border border-twitch/10">
                    <p className="text-xs text-twitch/80 leading-relaxed font-medium">
                        ℹ️ O chat já está funcionando em modo leitura. Conecte sua conta abaixo apenas se quiser interagir/falar no chat.
                    </p>
                </div>

                <div className="bg-black border border-white/5 p-1 rounded-xl flex gap-1">
                    <button
                        onClick={() => setAuthMethod('manual')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${authMethod === 'manual' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white/70'}`}
                    >
                        Gerador (Fácil)
                    </button>
                    <button
                        onClick={() => setAuthMethod('auto')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${authMethod === 'auto' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white/70'}`}
                    >
                        App Próprio
                    </button>
                </div>

                <div className="space-y-4">
                    {authMethod === 'manual' && (
                        <div className="animate-fade-in space-y-4">
                             <a 
                                href="https://twitchtokengenerator.com/" 
                                target="_blank" 
                                rel="noopener noreferrer nofollow"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[#00f0ff]/5 text-[#00f0ff] border border-[#00f0ff]/20 hover:bg-[#00f0ff]/10 rounded-xl text-xs font-bold transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                            >
                                🔗 Abrir Gerador de Token
                            </a>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Client ID</label>
                                    <input 
                                        type="text" 
                                        value={clientId}
                                        onChange={e => setClientId(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-twitch/50 focus:shadow-[0_0_15px_rgba(145,70,255,0.1)] outline-none transition-all duration-300 text-white placeholder-gray-700"
                                        placeholder="Cole o Client ID"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Access Token</label>
                                    <input 
                                        type="password" 
                                        value={accessToken}
                                        onChange={e => setAccessToken(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-twitch/50 focus:shadow-[0_0_15px_rgba(145,70,255,0.1)] outline-none transition-all duration-300 text-white placeholder-gray-700"
                                        placeholder="Cole o Access Token"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {authMethod === 'auto' && (
                        <div className="animate-fade-in space-y-4">
                            <div className="p-3 bg-black rounded-xl border border-white/10">
                                <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase tracking-wider font-bold">Redirect URL</label>
                                <code className="text-[11px] text-green-400 font-mono break-all select-all">{currentUrl}</code>
                            </div>
                            <input 
                                type="text" 
                                value={clientId}
                                onChange={e => setClientId(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-twitch/50 outline-none transition-colors text-white"
                                placeholder="Client ID do App"
                            />
                            {!accessToken && (
                                <button 
                                    type="button"
                                    onClick={handleTwitchLogin}
                                    className="w-full py-3 rounded-xl bg-twitch text-white font-bold text-xs hover:bg-twitch/90 transition-all shadow-lg shadow-twitch/20"
                                >
                                    Autenticar via Popup
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="h-px w-full bg-white/5"></div>

            {/* KICK SECTION */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-kick/10 flex items-center justify-center text-kick shadow-[0_0_15px_rgba(83,252,24,0.1)]">
                        <KickLogo className="w-6 h-6" />
                    </div>
                    <div>
                         <h3 className="font-bold text-lg text-white">Kick</h3>
                         <p className="text-xs text-gray-500">Somente Leitura</p>
                    </div>
                </div>
                
                <div className="bg-yellow-900/10 p-4 rounded-xl border border-yellow-500/10">
                    <p className="text-xs text-yellow-500/80 leading-relaxed font-medium">
                        A Kick não permite login via API pública. O chat funcionará apenas para leitura.
                    </p>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Seu Username (Opcional)</label>
                    <input 
                        type="text" 
                        value={localKickUser}
                        onChange={e => setLocalKickUser(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-kick/50 focus:shadow-[0_0_15px_rgba(83,252,24,0.1)] outline-none transition-all duration-300 text-white placeholder-gray-700"
                        placeholder="Ex: ViictorN"
                    />
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-black">
            <button 
                type="button"
                onClick={handleSave}
                className="w-full py-4 rounded-2xl text-sm font-bold bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.99]"
            >
                Salvar Alterações
            </button>
        </div>
      </div>
    </div>
  );
};