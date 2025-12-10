import React, { useState, useEffect } from 'react';
import { TwitchCreds, ChatSettings, AuthMode } from '../types';
import { PlatformIcon, SettingsIcon, UsersIcon } from './Icons';
import { motion } from 'framer-motion';
import { signInWithTwitch } from '../services/supabaseService';
import { initiateKickLogin } from '../services/kickAuthService';

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
  onForceLoadCloud?: () => void;
}

type Tab = 'accounts' | 'appearance' | 'moderation';

// --- INTERNAL UI COMPONENTS ---

const ToggleSwitch = ({ checked, onChange, label, description }: { checked: boolean, onChange: () => void, label: string, description?: string }) => (
    <div className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer group active:scale-[0.98]" onClick={onChange}>
        <div className="flex flex-col pr-4">
            <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{label}</span>
            {description && <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">{description}</span>}
        </div>
        <div className={`shrink-0 w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${checked ? 'bg-twitch' : 'bg-gray-700'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
    </div>
);

const SectionHeader = ({ title, icon }: { title: string, icon?: React.ReactNode }) => (
    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2 mt-6 first:mt-0 pb-2 border-b border-white/5">
        {icon}
        {title}
    </h3>
);

// ------------------------------

export const SettingsModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    onSaveTwitch, 
    currentCreds,
    kickUsername,
    onSaveKick,
    kickAccessToken = '',
    chatSettings,
    onUpdateSettings,
    onForceLoadCloud
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('accounts');
  const [authMode, setAuthMode] = useState<AuthMode>('cloud');
  
  // Auth Inputs
  const [clientId, setClientId] = useState(currentCreds.clientId || '');
  const [accessToken, setAccessToken] = useState(currentCreds.accessToken || '');
  
  // Settings State
  const [settings, setSettings] = useState<ChatSettings>(chatSettings);
  
  // Blocklist State
  const [blockedUsersStr, setBlockedUsersStr] = useState(chatSettings.ignoredUsers.join(', '));
  const [blockedKeywordsStr, setBlockedKeywordsStr] = useState(chatSettings.ignoredKeywords.join(', '));

  // Sync state when opening
  useEffect(() => {
    setClientId(currentCreds.clientId);
    setAccessToken(currentCreds.accessToken);
    setSettings(chatSettings);
    setBlockedUsersStr(chatSettings.ignoredUsers.join(', '));
    setBlockedKeywordsStr(chatSettings.ignoredKeywords.join(', '));
  }, [currentCreds, kickUsername, isOpen, chatSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
      onSaveTwitch({ clientId, accessToken });
      
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

  const handleCloudLogin = async () => {
      try { await signInWithTwitch(); } catch (e: any) { alert("Erro: " + e.message); }
  };

  const handleTwitchPopupLogin = () => {
      if (!clientId) return alert("Por favor, insira um Client ID válido para usar o login Manual.");
      const redirect = window.location.origin;
      // Scopes: reading chat and sending messages
      const url = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirect}&response_type=token&scope=chat:read+chat:edit`;
      window.open(url, 'Twitch Auth', 'width=600,height=700');
  };

  // AUTOMATIC KICK LOGIN
  const handleKickLogin = () => {
      initiateKickLogin();
  };

  const handleKickLogout = () => {
      onSaveKick('', '');
      localStorage.removeItem('kick_access_token');
      localStorage.removeItem('kick_username');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-300" onClick={onClose}></div>
      
      <div className="liquid-modal w-full sm:max-w-4xl h-full sm:h-[85vh] sm:rounded-3xl relative z-10 animate-slide-in flex flex-col md:flex-row overflow-hidden border-0 sm:border border-white/10 bg-[#09090b]">
        
        {/* --- SIDEBAR --- */}
        <div className="w-full md:w-64 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">
            <div className="p-4 md:p-6 flex items-center justify-between">
                <div>
                    <h2 className="text-lg md:text-xl font-display font-bold text-white tracking-tight">Ajustes</h2>
                    <p className="text-[10px] text-gray-500 hidden md:block mt-1">ViictorN TV v2.2</p>
                </div>
                <button onClick={onClose} className="md:hidden p-2 bg-white/5 rounded-full text-white/50 hover:text-white">✕</button>
            </div>
            
            <nav className="px-4 pb-0 md:pb-4 overflow-x-auto md:overflow-visible flex flex-row md:flex-col gap-2 custom-scrollbar no-scrollbar-mobile">
                {[
                    { id: 'accounts', label: 'Contas & Login', icon: <UsersIcon className="w-4 h-4"/> },
                    { id: 'appearance', label: 'Chat & Aparência', icon: <SettingsIcon className="w-4 h-4"/> },
                    { id: 'moderation', label: 'Moderação', icon: <span className="w-4 h-4 font-bold text-center leading-none">🛡️</span> },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as Tab)}
                        className={`
                            flex items-center gap-3 px-4 py-3 rounded-t-xl md:rounded-xl text-xs font-bold transition-all whitespace-nowrap border-b-2 md:border-b-0 md:border-l-2
                            ${activeTab === item.id 
                                ? 'bg-twitch/10 text-twitch border-twitch shadow-[inset_0_-2px_0_0_rgba(145,70,255,0.5)] md:shadow-[inset_10px_0_20px_-10px_rgba(145,70,255,0.2)]' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent'}
                        `}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="p-6 hidden md:block mt-auto border-t border-white/5">
                <button 
                    onClick={handleSave}
                    className="w-full py-3 rounded-xl text-xs font-bold bg-white hover:bg-gray-200 text-black transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2"
                >
                    <span>Salvar Alterações</span>
                </button>
            </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#09090b]/50 relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32 md:pb-8">
                
                {/* 1. ACCOUNTS TAB */}
                {activeTab === 'accounts' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-8 max-w-2xl mx-auto md:mx-0">
                        
                        {/* KICK SECTION (Automatic) */}
                        <section>
                            <SectionHeader title="Kick.com" icon={<PlatformIcon platform="kick" className="w-4 h-4" />} />
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6 space-y-4">
                                {kickUsername ? (
                                    <div className="flex flex-col items-center gap-4 py-4 animate-fade-in bg-black/20 rounded-xl border border-white/5">
                                         <div className="relative">
                                             <div className="w-20 h-20 rounded-full bg-[#53FC18] flex items-center justify-center text-black text-2xl font-bold border-4 border-[#53FC18]/20 shadow-[0_0_30px_rgba(83,252,24,0.3)]">
                                                 {kickUsername.charAt(0).toUpperCase()}
                                             </div>
                                             <div className="absolute bottom-0 right-0 bg-black text-white p-1 rounded-full border border-white/10">
                                                 <PlatformIcon platform="kick" className="w-4 h-4" />
                                             </div>
                                         </div>
                                         
                                         <div className="text-center">
                                             <h3 className="font-bold text-white text-lg">{kickUsername}</h3>
                                             <div className="flex items-center justify-center gap-2 mt-1">
                                                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                 <p className="text-gray-400 text-xs font-mono">Conectado via App Oficial</p>
                                             </div>
                                         </div>
                                         
                                         <button 
                                            onClick={handleKickLogout}
                                            className="mt-2 px-6 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors"
                                         >
                                             Desconectar
                                         </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-kick/5 border border-kick/10 rounded-lg p-4 text-xs text-gray-300 flex items-start gap-3">
                                            <span className="text-xl">🚀</span>
                                            <div>
                                                <p className="font-bold text-kick mb-1 text-sm">Login Automático</p>
                                                <p className="leading-relaxed text-gray-400">
                                                    Clique no botão abaixo. Uma janela da Kick será aberta pedindo autorização (igual ao Botrix).
                                                </p>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleKickLogin} 
                                            className="w-full py-4 bg-[#53FC18] hover:bg-[#42db0f] text-black rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(83,252,24,0.2)] hover:shadow-[0_0_30px_rgba(83,252,24,0.4)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                        >
                                            <PlatformIcon platform="kick" variant="default" className="w-6 h-6 text-black" />
                                            Conectar com Kick
                                        </button>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* TWITCH SECTION */}
                        <section>
                            <SectionHeader title="Twitch.tv" icon={<PlatformIcon platform="twitch" className="w-4 h-4" />} />
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6">
                                 <div className="flex gap-2 mb-4">
                                    <button onClick={() => setAuthMode('cloud')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === 'cloud' ? 'bg-twitch/20 text-twitch border border-twitch/30' : 'bg-black/20 text-gray-500 border border-white/5'}`}>
                                        Cloud (Supabase)
                                    </button>
                                    <button onClick={() => setAuthMode('local')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === 'local' ? 'bg-white/10 text-white border border-white/20' : 'bg-black/20 text-gray-500 border border-white/5'}`}>
                                        Manual / Popup
                                    </button>
                                </div>

                                {authMode === 'local' && (
                                     <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Client ID</label>
                                            <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white" placeholder="Insira seu Client ID..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Access Token (Opcional)</label>
                                            <input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white" placeholder="Cole o token ou use o botão abaixo" />
                                        </div>
                                        
                                        <div className="pt-2">
                                            <button 
                                                onClick={handleTwitchPopupLogin}
                                                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-white/10"
                                            >
                                                <span>Gerar Token via Popup ↗</span>
                                            </button>
                                            <p className="text-[10px] text-gray-500 mt-2 text-center">
                                                Requer que seu Client ID esteja configurado para permitir redirecionamento para este domínio.
                                            </p>
                                        </div>
                                     </div>
                                )}
                                {authMode === 'cloud' && (
                                    <div className="space-y-3">
                                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <p className="text-[11px] text-blue-200 leading-relaxed">
                                                Usa o servidor do app para autenticar. Pode falhar se você estiver usando um domínio de teste não registrado (como AIStudio). Se falhar, use o modo Manual.
                                            </p>
                                        </div>
                                        <button onClick={handleCloudLogin} className="w-full py-3 bg-[#9146FF] hover:bg-[#7c3aed] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2">
                                            <PlatformIcon platform="twitch" variant="white" className="w-4 h-4"/>
                                            Login com Twitch (Cloud)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>
                    </motion.div>
                )}

                {/* 2. APPEARANCE TAB (Restored) */}
                {activeTab === 'appearance' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <div>
                                <SectionHeader title="Estilo do Chat" />
                                <div className="space-y-2">
                                    <ToggleSwitch checked={settings.showTimestamps} onChange={() => toggleSetting('showTimestamps')} label="Horário (Timestamps)" />
                                    <ToggleSwitch checked={settings.hideAvatars} onChange={() => toggleSetting('hideAvatars')} label="Modo Compacto" description="Oculta fotos de perfil." />
                                    <ToggleSwitch checked={settings.alternatingBackground} onChange={() => toggleSetting('alternatingBackground')} label="Fundo Alternado (Zebra)" description="Linhas com cores diferentes." />
                                    <ToggleSwitch checked={settings.showSeparator} onChange={() => toggleSetting('showSeparator')} label="Linhas de Separação" />
                                    <ToggleSwitch checked={settings.rainbowUsernames} onChange={() => toggleSetting('rainbowUsernames')} label="Nicks Coloridos (Rainbow)" description="Animação RGB nos nomes." />
                                </div>
                            </div>
                            <div>
                                <SectionHeader title="Comportamento" />
                                <div className="space-y-2">
                                    <ToggleSwitch checked={settings.smoothScroll} onChange={() => toggleSetting('smoothScroll')} label="Rolagem Suave" />
                                    <ToggleSwitch checked={settings.highlightMentions} onChange={() => toggleSetting('highlightMentions')} label="Destacar Menções (@)" />
                                    <ToggleSwitch checked={settings.largeEmotes} onChange={() => toggleSetting('largeEmotes')} label="Emotes Grandes" />
                                    <ToggleSwitch checked={settings.cinemaMode} onChange={() => toggleSetting('cinemaMode')} label="Modo Cinema" description="Esconde o topo inicialmente." />
                                    <ToggleSwitch checked={settings.performanceMode} onChange={() => toggleSetting('performanceMode')} label="Modo Desempenho" description="Reduz carga no processador." />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 3. MODERATION TAB (Restored) */}
                 {activeTab === 'moderation' && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-3xl">
                         <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-6">
                             <h4 className="text-red-400 font-bold text-sm mb-1">Nota Importante</h4>
                             <p className="text-xs text-gray-400">Esses filtros funcionam localmente no seu navegador.</p>
                         </div>
                         <div className="space-y-6">
                             <div>
                                 <SectionHeader title="Usuários Bloqueados" />
                                 <textarea 
                                     value={blockedUsersStr}
                                     onChange={(e) => setBlockedUsersStr(e.target.value)}
                                     placeholder="Separe os nomes por vírgula. Ex: bot1, spammer123"
                                     className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xs text-white focus:border-red-500/50 outline-none h-32 resize-none leading-relaxed font-mono"
                                 />
                             </div>
                             <div>
                                 <SectionHeader title="Palavras Bloqueadas" />
                                 <textarea 
                                     value={blockedKeywordsStr}
                                     onChange={(e) => setBlockedKeywordsStr(e.target.value)}
                                     placeholder="Separe as palavras por vírgula. Mensagens contendo estas palavras serão ocultadas."
                                     className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xs text-white focus:border-red-500/50 outline-none h-32 resize-none leading-relaxed font-mono"
                                 />
                             </div>
                         </div>
                     </motion.div>
                )}
            </div>

            {/* Mobile Save */}
            <div className="p-4 md:hidden border-t border-white/5 bg-[#09090b]">
                 <button onClick={handleSave} className="w-full py-3 rounded-xl text-sm font-bold bg-white text-black">Salvar</button>
            </div>
        </div>
      </div>
    </div>
  );
};