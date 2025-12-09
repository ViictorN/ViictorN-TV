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
      
      {/* Modal Container */}
      <div className="liquid-glass w-full max-w-5xl p-0 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5 relative z-10 animate-slide-in max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col bg-[#080808]">
        
        {/* Header */}
        <div className="sticky top-0 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5 p-6 z-20 flex justify-between items-center shrink-0">
             <div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                    Conexões de Chat
                </h2>
                <p className="text-xs text-gray-400 mt-1">Configure suas contas para interagir na stream</p>
             </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">
                ✕
            </button>
        </div>
        
        <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative">
                
                {/* --- LEFT: KICK SECTION --- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-kick/10 flex items-center justify-center text-kick shadow-[0_0_20px_rgba(83,252,24,0.1)]">
                            <KickLogo className="w-7 h-7" />
                        </div>
                        <div>
                             <h3 className="font-bold text-xl text-white">Kick</h3>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Leitura Ativa</p>
                             </div>
                        </div>
                    </div>
                    
                    {/* Kick Status Box */}
                    <div className="bg-yellow-500/5 p-5 rounded-2xl border border-yellow-500/10 flex gap-4">
                        <div className="text-2xl">🔒</div>
                        <div>
                            <h4 className="text-yellow-500 font-bold text-sm uppercase tracking-wide mb-1">Modo Espectador</h4>
                            <p className="text-xs text-yellow-500/70 leading-relaxed">
                                A API da Kick protege contra bots. Você pode ver todas as mensagens, mas para responder, utilize o chat oficial em outra aba ou o app móvel. 
                                <br/><br/>
                                <strong>Nota:</strong> Em breve, suporte a login oficial se a Kick liberar OAuth público.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Destacar Menções (Username)</label>
                        <input 
                            type="text" 
                            value={localKickUser}
                            onChange={e => setLocalKickUser(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-kick/50 focus:shadow-[0_0_20px_rgba(83,252,24,0.1)] outline-none transition-all duration-300 text-white placeholder-gray-700 font-mono"
                            placeholder="SeuNickKick"
                        />
                    </div>
                </div>

                {/* DIVIDER */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2"></div>
                <div className="lg:hidden w-full h-px bg-white/10 my-2"></div>

                {/* --- RIGHT: TWITCH SECTION --- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-twitch/10 flex items-center justify-center text-twitch shadow-[0_0_20px_rgba(145,70,255,0.1)]">
                            <TwitchLogo className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-white">Twitch</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${clientId && accessToken ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-600'}`}></span>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                                    {clientId && accessToken ? 'Conectado e Pronto' : 'Aguardando Token'}
                                </p>
                             </div>
                        </div>
                    </div>

                    {!accessToken ? (
                        /* --- GUIDE: IF NO TOKEN --- */
                        <div className="bg-twitch/5 rounded-2xl p-5 border border-twitch/10">
                             <h4 className="text-twitch font-bold text-sm uppercase tracking-wide mb-4">Como Conectar (3 Passos)</h4>
                             
                             <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-twitch text-white flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                    <div className="text-xs text-gray-300">
                                        Acesse o gerador de token seguro.
                                        <a 
                                            href="https://twitchtokengenerator.com/" 
                                            target="_blank" 
                                            rel="noopener noreferrer nofollow"
                                            className="block mt-2 text-twitch hover:text-white underline decoration-twitch/30 hover:decoration-white transition-all"
                                        >
                                            Abrir TwitchTokenGenerator.com ↗
                                        </a>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-twitch/20 text-twitch flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                    <div className="text-xs text-gray-300">
                                        Escolha <strong>"Bot Chat Token"</strong> (permite ler e escrever). Autorize com sua conta da Twitch.
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-twitch/20 text-twitch flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                    <div className="text-xs text-gray-300">
                                        Copie o <strong>Client ID</strong> e o <strong>Access Token</strong> gerados e cole abaixo.
                                    </div>
                                </div>
                             </div>
                        </div>
                    ) : (
                         /* --- SUCCESS STATE --- */
                        <div className="bg-green-500/10 rounded-2xl p-5 border border-green-500/20 flex items-center gap-4">
                            <div className="text-3xl">🎉</div>
                            <div>
                                <h4 className="text-green-400 font-bold text-sm uppercase tracking-wide">Configurado com Sucesso!</h4>
                                <p className="text-xs text-green-400/70">Você já pode enviar mensagens no chat da Twitch.</p>
                            </div>
                            <button 
                                onClick={() => { setAccessToken(''); setClientId(''); }}
                                className="ml-auto text-[10px] text-red-400 hover:text-red-300 underline"
                            >
                                Desconectar
                            </button>
                        </div>
                    )}

                    <div className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Client ID</label>
                            <input 
                                type="text" 
                                value={clientId}
                                onChange={e => setClientId(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs md:text-sm focus:border-twitch/50 focus:shadow-[0_0_20px_rgba(145,70,255,0.1)] outline-none transition-all duration-300 text-white placeholder-gray-700 font-mono"
                                placeholder="gp762..."
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Access Token</label>
                            <input 
                                type="password" 
                                value={accessToken}
                                onChange={e => setAccessToken(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs md:text-sm focus:border-twitch/50 focus:shadow-[0_0_20px_rgba(145,70,255,0.1)] outline-none transition-all duration-300 text-white placeholder-gray-700 font-mono"
                                placeholder="oauth:..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-[#0a0a0a] mt-auto shrink-0 sticky bottom-0 z-30">
            <button 
                type="button"
                onClick={handleSave}
                className="w-full py-4 rounded-2xl text-sm font-bold bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <span>Salvar e Conectar</span>
                <span className="text-lg">⚡</span>
            </button>
        </div>
      </div>
    </div>
  );
};