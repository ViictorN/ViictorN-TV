import React, { useState, useEffect } from 'react';
import { TwitchCreds, ChatSettings } from '../types';
import { TwitchLogo, KickLogo } from './Icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveTwitch: (creds: TwitchCreds) => void;
  currentCreds: TwitchCreds;
  kickUsername: string;
  onSaveKick: (username: string) => void;
  chatSettings: ChatSettings;
  onUpdateSettings: (s: ChatSettings) => void;
}

export const SettingsModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    onSaveTwitch, 
    currentCreds,
    kickUsername,
    onSaveKick,
    chatSettings,
    onUpdateSettings
}) => {
  const [clientId, setClientId] = useState(currentCreds.clientId || '');
  const [accessToken, setAccessToken] = useState(currentCreds.accessToken || '');
  const [localKickUser, setLocalKickUser] = useState(kickUsername || '');
  
  // Local Settings State
  const [settings, setSettings] = useState<ChatSettings>(chatSettings);

  useEffect(() => {
    setClientId(currentCreds.clientId);
    setAccessToken(currentCreds.accessToken);
    setLocalKickUser(kickUsername);
    setSettings(chatSettings);
  }, [currentCreds, kickUsername, isOpen, chatSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
      onSaveTwitch({ clientId, accessToken });
      onSaveKick(localKickUser);
      onUpdateSettings(settings);
      onClose();
  };
  
  const toggleSetting = (key: keyof ChatSettings) => {
      setSettings(prev => ({...prev, [key]: !prev[key]}));
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
                    Configurações
                </h2>
                <p className="text-xs text-gray-400 mt-1">Conexões de conta e preferências de chat</p>
             </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">
                ✕
            </button>
        </div>
        
        <div className="p-6 md:p-8 space-y-8">
            
            {/* --- SECTION 1: PREFERÊNCIAS DE CHAT (BTTV Style) --- */}
            <div className="border border-white/5 bg-white/5 rounded-2xl p-6">
                 <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                    <span>🎨</span> Aparência do Chat (BetterChat)
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     
                     {/* Timestamps */}
                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors">
                        <span className="text-sm text-gray-300">Mostrar Horário (Timestamps)</span>
                        <input type="checkbox" checked={settings.showTimestamps} onChange={() => toggleSetting('showTimestamps')} className="accent-twitch" />
                     </label>

                     {/* Clean Mode */}
                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors">
                        <span className="text-sm text-gray-300">Ocultar Ícones/Avatares (Modo Limpo)</span>
                        <input type="checkbox" checked={settings.hideAvatars} onChange={() => toggleSetting('hideAvatars')} className="accent-twitch" />
                     </label>

                     {/* System Messages */}
                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors">
                        <span className="text-sm text-gray-300">Ocultar Msgs de Sistema (Mo'Kick)</span>
                        <input type="checkbox" checked={settings.hideSystemMessages} onChange={() => toggleSetting('hideSystemMessages')} className="accent-twitch" />
                     </label>

                     {/* Deleted Messages Behavior */}
                     <div className="p-3 bg-black/40 rounded-xl flex items-center justify-between">
                         <span className="text-sm text-gray-300">Mensagens Deletadas</span>
                         <select 
                            value={settings.deletedMessageBehavior}
                            onChange={(e) => setSettings({...settings, deletedMessageBehavior: e.target.value as any})}
                            className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-twitch"
                         >
                             <option value="strikethrough">Riscado (BTTV)</option>
                             <option value="hide">Ocultar Totalmente</option>
                         </select>
                     </div>

                      {/* Font Size */}
                      <div className="p-3 bg-black/40 rounded-xl flex items-center justify-between">
                         <span className="text-sm text-gray-300">Tamanho da Fonte</span>
                         <select 
                            value={settings.fontSize}
                            onChange={(e) => setSettings({...settings, fontSize: e.target.value as any})}
                            className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-twitch"
                         >
                             <option value="small">Pequeno</option>
                             <option value="medium">Médio</option>
                             <option value="large">Grande</option>
                         </select>
                     </div>
                 </div>
            </div>


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
                    
                    <div className="bg-yellow-500/5 p-5 rounded-2xl border border-yellow-500/10 flex gap-4">
                        <div className="text-2xl">🔒</div>
                        <div>
                            <h4 className="text-yellow-500 font-bold text-sm uppercase tracking-wide mb-1">Modo Espectador</h4>
                            <p className="text-xs text-yellow-500/70 leading-relaxed">
                                A API da Kick protege contra bots. Você pode ver todas as mensagens, mas para responder, utilize o chat oficial.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Destacar Menções (Username)</label>
                        <input 
                            type="text" 
                            value={localKickUser}
                            onChange={e => setLocalKickUser(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-kick/50 outline-none text-white font-mono"
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
                                    {clientId && accessToken ? 'Conectado' : 'Aguardando Token'}
                                </p>
                             </div>
                        </div>
                    </div>

                    {!accessToken ? (
                        <div className="bg-twitch/5 rounded-2xl p-5 border border-twitch/10">
                             <h4 className="text-twitch font-bold text-sm uppercase tracking-wide mb-4">Como Conectar</h4>
                             <a 
                                href="https://twitchtokengenerator.com/" 
                                target="_blank" 
                                className="block text-center bg-twitch hover:bg-twitch/80 text-white py-2 rounded-xl text-xs font-bold transition-colors"
                            >
                                Gerar Token ↗
                            </a>
                        </div>
                    ) : (
                        <div className="bg-green-500/10 rounded-2xl p-5 border border-green-500/20 flex items-center gap-4">
                            <div className="text-2xl">🎉</div>
                            <div>
                                <h4 className="text-green-400 font-bold text-sm uppercase tracking-wide">Configurado!</h4>
                            </div>
                            <button onClick={() => { setAccessToken(''); setClientId(''); }} className="ml-auto text-[10px] text-red-400 underline">Desconectar</button>
                        </div>
                    )}

                    <div className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Client ID</label>
                            <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs font-mono" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Access Token</label>
                            <input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs font-mono" />
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
                <span>Salvar Configurações</span>
                <span className="text-lg">⚡</span>
            </button>
        </div>
      </div>
    </div>
  );
};