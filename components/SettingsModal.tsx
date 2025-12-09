import React, { useState, useEffect } from 'react';
import { TwitchCreds, ChatSettings } from '../types';
import { PlatformIcon } from './Icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveTwitch: (creds: TwitchCreds) => void;
  currentCreds: TwitchCreds;
  kickUsername: string;
  onSaveKick: (username: string, token: string) => void;
  kickAccessToken?: string;
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
    kickAccessToken = '',
    chatSettings,
    onUpdateSettings
}) => {
  const [clientId, setClientId] = useState(currentCreds.clientId || '');
  const [accessToken, setAccessToken] = useState(currentCreds.accessToken || '');
  
  const [localKickUser, setLocalKickUser] = useState(kickUsername || '');
  const [localKickToken, setLocalKickToken] = useState(kickAccessToken || '');
  
  // Local Settings State
  const [settings, setSettings] = useState<ChatSettings>(chatSettings);
  
  // Local Blocklist State (as string for textarea)
  const [blockedUsersStr, setBlockedUsersStr] = useState(chatSettings.ignoredUsers.join(', '));
  const [blockedKeywordsStr, setBlockedKeywordsStr] = useState(chatSettings.ignoredKeywords.join(', '));

  useEffect(() => {
    setClientId(currentCreds.clientId);
    setAccessToken(currentCreds.accessToken);
    setLocalKickUser(kickUsername);
    setLocalKickToken(kickAccessToken);
    setSettings(chatSettings);
    setBlockedUsersStr(chatSettings.ignoredUsers.join(', '));
    setBlockedKeywordsStr(chatSettings.ignoredKeywords.join(', '));
  }, [currentCreds, kickUsername, kickAccessToken, isOpen, chatSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
      onSaveTwitch({ clientId, accessToken });
      onSaveKick(localKickUser, localKickToken);
      
      // Parse blocklists
      const usersList = blockedUsersStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
      const keywordsList = blockedKeywordsStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
      
      onUpdateSettings({
          ...settings,
          ignoredUsers: usersList,
          ignoredKeywords: keywordsList
      });
      onClose();
  };
  
  const toggleSetting = (key: keyof ChatSettings) => {
      setSettings(prev => ({...prev, [key]: !prev[key]}));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-500 ease-out-expo" onClick={onClose}></div>
      
      {/* Modal Container - Using New Liquid Modal Class without opaque background override */}
      <div className="liquid-modal w-full max-w-5xl p-0 rounded-3xl relative z-10 animate-slide-in max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
        
        {/* Header - Semi-transparent */}
        <div className="sticky top-0 bg-black/40 backdrop-blur-md border-b border-white/5 p-6 z-20 flex justify-between items-center shrink-0">
             <div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                    Painel de Controle
                </h2>
                <p className="text-xs text-gray-400 mt-1">Conexões, aparência e ferramentas de chat</p>
             </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">
                ✕
            </button>
        </div>
        
        <div className="p-6 md:p-8 space-y-8">
            
            {/* --- SECTION 1: APARÊNCIA & FERRAMENTAS --- */}
            <div className="border border-white/5 bg-white/5 rounded-2xl p-6">
                 <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                    <span>✨</span> BetterTTV / 7TV / Mo'Kick
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     
                     {/* General Options */}
                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5">
                        <span className="text-sm text-gray-300">Timestamps (Horário)</span>
                        <input type="checkbox" checked={settings.showTimestamps} onChange={() => toggleSetting('showTimestamps')} className="accent-twitch w-4 h-4" />
                     </label>

                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5">
                        <span className="text-sm text-gray-300">Modo Limpo (Sem Avatar)</span>
                        <input type="checkbox" checked={settings.hideAvatars} onChange={() => toggleSetting('hideAvatars')} className="accent-twitch w-4 h-4" />
                     </label>
                     
                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5">
                        <span className="text-sm text-gray-300">Linhas Alternadas (Zebra)</span>
                        <input type="checkbox" checked={settings.alternatingBackground} onChange={() => toggleSetting('alternatingBackground')} className="accent-twitch w-4 h-4" />
                     </label>

                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5">
                        <span className="text-sm text-gray-300">Linhas de Separação</span>
                        <input type="checkbox" checked={settings.showSeparator} onChange={() => toggleSetting('showSeparator')} className="accent-twitch w-4 h-4" />
                     </label>

                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5">
                        <span className="text-sm text-gray-300">Destacar Menções (@)</span>
                        <input type="checkbox" checked={settings.highlightMentions} onChange={() => toggleSetting('highlightMentions')} className="accent-twitch w-4 h-4" />
                     </label>

                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5">
                        <span className="text-sm text-gray-300">Nicks Coloridos (Rainbow)</span>
                        <input type="checkbox" checked={settings.rainbowUsernames} onChange={() => toggleSetting('rainbowUsernames')} className="accent-twitch w-4 h-4" />
                     </label>

                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5">
                        <span className="text-sm text-gray-300">Emotes Grandes</span>
                        <input type="checkbox" checked={settings.largeEmotes} onChange={() => toggleSetting('largeEmotes')} className="accent-twitch w-4 h-4" />
                     </label>
                     
                      <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5">
                        <span className="text-sm text-gray-300">Smooth Scroll (Suave)</span>
                        <input type="checkbox" checked={settings.smoothScroll} onChange={() => toggleSetting('smoothScroll')} className="accent-twitch w-4 h-4" />
                     </label>

                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5 border-l-4 border-l-orange-500">
                        <div className="flex flex-col">
                             <span className="text-sm text-gray-300 font-bold">Modo Desempenho</span>
                             <span className="text-[9px] text-gray-500">Renderiza menos msgs (Leve)</span>
                        </div>
                        <input type="checkbox" checked={settings.performanceMode} onChange={() => toggleSetting('performanceMode')} className="accent-twitch w-4 h-4" />
                     </label>

                     <label className="flex items-center justify-between p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5">
                        <span className="text-sm text-gray-300">Modo Cinema (Esconder Topo)</span>
                        <input type="checkbox" checked={settings.cinemaMode} onChange={() => toggleSetting('cinemaMode')} className="accent-twitch w-4 h-4" />
                     </label>

                     {/* Dropdowns */}
                     <div className="p-3 bg-black/40 rounded-xl flex items-center justify-between border border-white/5">
                         <span className="text-sm text-gray-300">Msgs Deletadas</span>
                         <select 
                            value={settings.deletedMessageBehavior}
                            onChange={(e) => setSettings({...settings, deletedMessageBehavior: e.target.value as any})}
                            className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-twitch"
                         >
                             <option value="strikethrough">Riscado (BTTV)</option>
                             <option value="hide">Ocultar Totalmente</option>
                         </select>
                     </div>

                      <div className="p-3 bg-black/40 rounded-xl flex items-center justify-between border border-white/5">
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

                     <div className="p-3 bg-black/40 rounded-xl flex items-center justify-between border border-white/5">
                         <span className="text-sm text-gray-300">Tipo de Fonte</span>
                         <select 
                            value={settings.fontFamily}
                            onChange={(e) => setSettings({...settings, fontFamily: e.target.value as any})}
                            className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-twitch"
                         >
                             <option value="sans">Padrão (Sans)</option>
                             <option value="mono">Dev / Terminal</option>
                         </select>
                     </div>
                 </div>
            </div>

            {/* --- SECTION 1.5: FILTRO DE BADGES (NOVO) --- */}
            <div className="border border-white/5 bg-white/5 rounded-2xl p-6">
                 <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                    <span>🎖️</span> Visibilidade de Badges
                 </h3>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                     <label className="flex flex-col items-center justify-center p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5 gap-2">
                        <span className="text-xs font-bold text-gray-300">Broadcaster</span>
                        <input type="checkbox" checked={settings.showBadgeBroadcaster} onChange={() => toggleSetting('showBadgeBroadcaster')} className="accent-twitch w-4 h-4" />
                     </label>
                     
                     <label className="flex flex-col items-center justify-center p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5 gap-2">
                        <span className="text-xs font-bold text-gray-300">Mods</span>
                        <input type="checkbox" checked={settings.showBadgeMod} onChange={() => toggleSetting('showBadgeMod')} className="accent-twitch w-4 h-4" />
                     </label>

                     <label className="flex flex-col items-center justify-center p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5 gap-2">
                        <span className="text-xs font-bold text-gray-300">VIPs</span>
                        <input type="checkbox" checked={settings.showBadgeVip} onChange={() => toggleSetting('showBadgeVip')} className="accent-twitch w-4 h-4" />
                     </label>

                     <label className="flex flex-col items-center justify-center p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5 gap-2">
                        <span className="text-xs font-bold text-gray-300">Subs</span>
                        <input type="checkbox" checked={settings.showBadgeSub} onChange={() => toggleSetting('showBadgeSub')} className="accent-twitch w-4 h-4" />
                     </label>

                     <label className="flex flex-col items-center justify-center p-3 bg-black/40 rounded-xl cursor-pointer hover:bg-black/60 transition-colors border border-white/5 gap-2">
                        <span className="text-xs font-bold text-gray-300">Founders/OG</span>
                        <input type="checkbox" checked={settings.showBadgeFounder} onChange={() => toggleSetting('showBadgeFounder')} className="accent-twitch w-4 h-4" />
                     </label>
                 </div>
            </div>

            {/* --- SECTION 2: MODERAÇÃO / BLOCKLIST --- */}
            <div className="border border-white/5 bg-white/5 rounded-2xl p-6">
                 <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                    <span>🛡️</span> Bloqueio e Moderação
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                         <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2 block">Usuários Bloqueados</label>
                         <textarea 
                             value={blockedUsersStr}
                             onChange={(e) => setBlockedUsersStr(e.target.value)}
                             placeholder="bot1, spammer2, usuario3 (separar por vírgula)"
                             className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs focus:border-red-500/50 outline-none text-white h-24 resize-none placeholder-white/20"
                         />
                         <p className="text-[10px] text-gray-500 mt-1">Mensagens destes usuários serão ocultadas totalmente.</p>
                     </div>
                     <div>
                         <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2 block">Palavras Bloqueadas (Blacklist)</label>
                         <textarea 
                             value={blockedKeywordsStr}
                             onChange={(e) => setBlockedKeywordsStr(e.target.value)}
                             placeholder="spoiler, palavra1, palavra2 (separar por vírgula)"
                             className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs focus:border-red-500/50 outline-none text-white h-24 resize-none placeholder-white/20"
                         />
                         <p className="text-[10px] text-gray-500 mt-1">Mensagens contendo estas palavras serão ocultadas.</p>
                     </div>
                 </div>
            </div>

            {/* --- CONNECTIONS SECTION (SPLIT) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative">
                
                {/* --- LEFT: KICK SECTION --- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-kick/10 flex items-center justify-center shadow-[0_0_20px_rgba(83,252,24,0.1)]">
                            <PlatformIcon platform="kick" variant="default" className="w-7 h-7" />
                        </div>
                        <div>
                             <h3 className="font-bold text-xl text-white">Kick</h3>
                             <p className="text-xs text-gray-400">Integração Avançada</p>
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2 block">Seu Username</label>
                            <input 
                                type="text" 
                                value={localKickUser}
                                onChange={e => setLocalKickUser(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm focus:border-kick/50 outline-none text-white font-mono placeholder-white/20"
                                placeholder="Ex: UserKick123"
                            />
                            <p className="text-[10px] text-gray-500 mt-2">
                                * Necessário para destacar quando te mencionarem.
                            </p>
                        </div>
                        
                        <div>
                             <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2 block">Access Token (Bearer)</label>
                             <input 
                                 type="password" 
                                 value={localKickToken}
                                 onChange={e => setLocalKickToken(e.target.value)}
                                 className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs focus:border-kick/50 outline-none text-white font-mono placeholder-white/20"
                                 placeholder="ey..."
                             />
                             <div className="mt-2 text-[10px] text-gray-500">
                                 <p className="mb-1">* Permite enviar mensagens no chat.</p>
                                 <a 
                                    href="https://docs.kick.com/getting-started/generating-tokens-oauth2-flow" 
                                    target="_blank" 
                                    className="text-kick underline hover:text-white"
                                 >
                                    Documentação Oficial OAuth2 ↗
                                 </a>
                             </div>
                        </div>
                    </div>
                </div>

                {/* DIVIDER */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2"></div>
                <div className="lg:hidden w-full h-px bg-white/10 my-2"></div>

                {/* --- RIGHT: TWITCH SECTION --- */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-twitch/10 flex items-center justify-center shadow-[0_0_20px_rgba(145,70,255,0.1)]">
                            <PlatformIcon platform="twitch" variant="default" className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-white">Twitch</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${clientId && accessToken ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-600'}`}></span>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                                    {clientId && accessToken ? 'Conectado' : 'Desconectado'}
                                </p>
                             </div>
                        </div>
                    </div>

                    {/* Tutorial Step-by-Step */}
                    {!accessToken && (
                        <div className="bg-twitch/5 rounded-2xl p-5 border border-twitch/10">
                             <h4 className="text-twitch font-bold text-xs uppercase tracking-wide mb-3 flex items-center gap-2">
                                 <span className="bg-twitch text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">?</span>
                                 Passo a Passo
                             </h4>
                             <ol className="space-y-3 text-xs text-gray-300 list-decimal list-inside marker:text-twitch font-medium">
                                 <li className="pl-1">
                                     Acesse o gerador de tokens seguro: <br/>
                                     <a href="https://twitchtokengenerator.com/" target="_blank" className="text-twitch underline hover:text-white mt-1 inline-block">Twitch Token Generator ↗</a>
                                 </li>
                                 <li className="pl-1">Selecione "Custom Scope Token".</li>
                                 <li className="pl-1">Ative: <code className="bg-black px-1 rounded text-gray-400">chat:read</code> e <code className="bg-black px-1 rounded text-gray-400">chat:edit</code>.</li>
                                 <li className="pl-1">Copie o <strong>Client ID</strong> e <strong>Access Token</strong> abaixo.</li>
                             </ol>
                        </div>
                    )}

                    <div className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Client ID</label>
                            <input 
                                type="text" 
                                value={clientId} 
                                onChange={e => setClientId(e.target.value)} 
                                placeholder="gp762..."
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-mono focus:border-twitch/50 outline-none text-white transition-all" 
                            />
                        </div>
                        <div className="space-y-1 relative">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Access Token (Senha)</label>
                            <input 
                                type="password" 
                                value={accessToken} 
                                onChange={e => setAccessToken(e.target.value)} 
                                placeholder="oauth:..."
                                autoComplete="new-password"
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-mono focus:border-twitch/50 outline-none text-white transition-all" 
                            />
                            <p className="text-[9px] text-gray-500 mt-1.5 text-right">
                                * Salvo localmente no seu navegador. Nunca compartilhado.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/40 backdrop-blur-md mt-auto shrink-0 sticky bottom-0 z-30">
            <button 
                type="button"
                onClick={handleSave}
                className="w-full py-4 rounded-2xl text-sm font-bold bg-white text-black hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <span>Salvar & Aplicar</span>
                <span className="text-lg">⚡</span>
            </button>
        </div>
      </div>
    </div>
  );
};