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

  useEffect(() => {
    setClientId(currentCreds.clientId);
    setAccessToken(currentCreds.accessToken);
    setLocalKickUser(kickUsername);
  }, [currentCreds, kickUsername, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
      onSaveTwitch({ clientId, accessToken });
      onSaveKick(localKickUser);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-500 ease-out-expo" onClick={onClose}></div>
      
      {/* Modal Container: Increased width for side-by-side layout */}
      <div className="liquid-glass w-full max-w-4xl p-0 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5 relative z-10 animate-slide-in max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col bg-[#050505]">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 p-6 z-20 flex justify-between items-center shrink-0">
             <div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                    Configurações
                </h2>
                <p className="text-xs text-gray-400 mt-1">Gerencie suas conexões de chat</p>
             </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">
                ✕
            </button>
        </div>
        
        <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                
                {/* --- LEFT: KICK SECTION --- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-kick/10 flex items-center justify-center text-kick shadow-[0_0_15px_rgba(83,252,24,0.1)]">
                            <KickLogo className="w-6 h-6" />
                        </div>
                        <div>
                             <h3 className="font-bold text-lg text-white">Kick</h3>
                             <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Conectado (Leitura)</p>
                             </div>
                        </div>
                    </div>
                    
                    <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10">
                        <p className="text-xs text-yellow-500/80 leading-relaxed font-medium">
                            🔒 <strong>Modo Leitura:</strong> A API oficial da Kick não permite envio de mensagens por apps de terceiros no momento. Você verá o chat normalmente, mas não poderá responder por aqui.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Seu Username Kick (Opcional)</label>
                        <input 
                            type="text" 
                            value={localKickUser}
                            onChange={e => setLocalKickUser(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm focus:border-kick/50 focus:shadow-[0_0_15px_rgba(83,252,24,0.1)] outline-none transition-all duration-300 text-white placeholder-gray-700 font-mono"
                            placeholder="Ex: ViictorN"
                        />
                         <p className="text-[10px] text-gray-600 pl-1">Usado apenas para destacar quando você for mencionado.</p>
                    </div>
                </div>

                {/* DIVIDER (Vertical on Desktop, Horizontal on Mobile) */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2"></div>
                <div className="md:hidden w-full h-px bg-white/10 my-2"></div>

                {/* --- RIGHT: TWITCH SECTION --- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-twitch/10 flex items-center justify-center text-twitch shadow-[0_0_15px_rgba(145,70,255,0.1)]">
                            <TwitchLogo className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Twitch</h3>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${clientId && accessToken ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                                    {clientId && accessToken ? 'Autenticado (Leitura + Escrita)' : 'Anônimo (Leitura)'}
                                </p>
                             </div>
                        </div>
                    </div>

                    <div className="bg-twitch/5 p-4 rounded-xl border border-twitch/10">
                         <p className="text-xs text-twitch/80 leading-relaxed font-medium">
                            Para enviar mensagens na Twitch, você precisa gerar um Token de acesso. Isso garante que o app possa falar em seu nome com segurança.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <a 
                            href="https://twitchtokengenerator.com/" 
                            target="_blank" 
                            rel="noopener noreferrer nofollow"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-[#00f0ff]/5 text-[#00f0ff] border border-[#00f0ff]/20 hover:bg-[#00f0ff]/10 rounded-xl text-xs font-bold transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.1)] group"
                        >
                            <span>🔗 Gerar Token (Site Externo)</span>
                            <span className="opacity-50 group-hover:opacity-100 transition-opacity">↗</span>
                        </a>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Client ID</label>
                                <input 
                                    type="text" 
                                    value={clientId}
                                    onChange={e => setClientId(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs md:text-sm focus:border-twitch/50 focus:shadow-[0_0_15px_rgba(145,70,255,0.1)] outline-none transition-all duration-300 text-white placeholder-gray-700 font-mono"
                                    placeholder="Cole o Client ID aqui"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Access Token</label>
                                <input 
                                    type="password" 
                                    value={accessToken}
                                    onChange={e => setAccessToken(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs md:text-sm focus:border-twitch/50 focus:shadow-[0_0_15px_rgba(145,70,255,0.1)] outline-none transition-all duration-300 text-white placeholder-gray-700 font-mono"
                                    placeholder="Cole o Access Token aqui (oauth:...)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-black mt-auto shrink-0">
            <button 
                type="button"
                onClick={handleSave}
                className="w-full py-4 rounded-2xl text-sm font-bold bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.99] flex items-center justify-center gap-2"
            >
                <span>Salvar Configurações</span>
                <span className="text-lg">💾</span>
            </button>
        </div>
      </div>
    </div>
  );
};