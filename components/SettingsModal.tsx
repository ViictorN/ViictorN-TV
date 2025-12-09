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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#0f0f11] border border-glass-border w-full max-w-xl p-6 rounded-2xl shadow-2xl relative z-10 animate-slide-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-2xl font-display font-bold mb-6 text-white sticky top-0 bg-[#0f0f11] py-2 z-20">
           Contas & Conexões
        </h2>
        
        <div className="space-y-8">
            {/* TWITCH SECTION */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                        <TwitchLogo className="w-6 h-6 text-twitch" />
                        <h3 className="font-bold text-xl text-gray-200">Twitch</h3>
                    </div>
                </div>

                <div className="flex p-1 bg-black/50 rounded-lg border border-white/5 mb-4">
                    <button
                        onClick={() => setAuthMethod('manual')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${authMethod === 'manual' ? 'bg-twitch text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Gerador (Fácil)
                    </button>
                    <button
                        onClick={() => setAuthMethod('auto')}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${authMethod === 'auto' ? 'bg-twitch text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        App Próprio (Avançado)
                    </button>
                </div>

                <div className="bg-twitch/5 p-5 rounded-xl border border-twitch/10">
                    {authMethod === 'manual' && (
                        <div className="animate-slide-in">
                            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                Use o site <strong>TwitchTokenGenerator</strong> para criar suas credenciais.
                            </p>
                            
                            <a 
                                href="https://twitchtokengenerator.com/" 
                                target="_blank" 
                                rel="noopener noreferrer nofollow"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 hover:bg-[#00f0ff]/20 rounded-lg text-xs font-bold mb-5 transition-all"
                            >
                                🔗 Abrir Gerador de Token
                            </a>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase tracking-wider font-bold">Client ID</label>
                                    <input 
                                        type="text" 
                                        value={clientId}
                                        onChange={e => setClientId(e.target.value)}
                                        className="w-full bg-black/50 border border-glass-border rounded-lg p-2.5 text-sm focus:border-twitch outline-none transition-colors"
                                        placeholder="Cole o Client ID"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase tracking-wider font-bold">Access Token</label>
                                    <input 
                                        type="password" 
                                        value={accessToken}
                                        onChange={e => setAccessToken(e.target.value)}
                                        className="w-full bg-black/50 border border-glass-border rounded-lg p-2.5 text-sm focus:border-twitch outline-none transition-colors"
                                        placeholder="Cole o Access Token"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {authMethod === 'auto' && (
                        <div className="animate-slide-in">
                             <div className="mb-4 p-3 bg-black/30 rounded border border-white/5">
                                <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase tracking-wider font-bold">Redirect URL Obrigatória</label>
                                <div className="flex items-center gap-2">
                                    <code className="text-[10px] text-green-400 font-mono break-all select-all">{currentUrl}</code>
                                </div>
                            </div>

                            <label className="block text-[10px] font-mono text-gray-500 mb-1 uppercase tracking-wider font-bold">Seu Client ID</label>
                            <input 
                                type="text" 
                                value={clientId}
                                onChange={e => setClientId(e.target.value)}
                                className="w-full bg-black/50 border border-glass-border rounded-lg p-3 text-sm focus:border-twitch outline-none transition-colors mb-4"
                                placeholder="Client ID do App"
                            />
                            
                            {!accessToken && (
                                <button 
                                    type="button"
                                    onClick={handleTwitchLogin}
                                    className="w-full py-3 rounded-lg bg-twitch text-white font-bold text-xs hover:bg-twitch/90 transition-all shadow-lg shadow-twitch/20"
                                >
                                    Autenticar via Popup
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* KICK SECTION */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <KickLogo className="w-6 h-6 text-kick" />
                    <h3 className="font-bold text-xl text-gray-200">Kick</h3>
                </div>
                
                <div className="bg-kick/5 p-5 rounded-xl border border-kick/10">
                    <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-[11px] text-yellow-200 font-medium">
                            ⚠️ <strong>Aviso Importante:</strong> A Kick não possui login público (OAuth). 
                            O chat funcionará em modo <strong>Apenas Leitura</strong> aqui no site.
                        </p>
                    </div>

                    <label className="block text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider font-bold">Seu Nick (Apenas para salvar preferências)</label>
                    <input 
                        type="text" 
                        value={localKickUser}
                        onChange={e => setLocalKickUser(e.target.value)}
                        className="w-full bg-black/50 border border-glass-border rounded-lg p-3 text-base focus:border-kick outline-none transition-colors placeholder-gray-700"
                        placeholder="Ex: ViictorN"
                    />
                </div>
            </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8 pt-4 border-t border-white/10">
            <button 
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
                Cancelar
            </button>
            <button 
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold bg-white text-black hover:bg-gray-200 transition-colors shadow-lg active:scale-[0.98]"
            >
                Salvar Tudo
            </button>
        </div>
      </div>
    </div>
  );
};