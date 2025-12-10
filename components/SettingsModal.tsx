import React, { useState, useEffect } from 'react';
import { TwitchCreds, ChatSettings, AuthMode } from '../types';
import { PlatformIcon, CloudIcon, DatabaseIcon, SettingsIcon, UsersIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { isBackendConfigured, signInWithTwitch, getSession, signOut } from '../services/supabaseService';
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
  onForceLoadCloud?: () => void; // New Prop
}

type Tab = 'accounts' | 'appearance' | 'moderation';

// --- INTERNAL UI COMPONENTS ---

const ToggleSwitch = ({ checked, onChange, label, description }: { checked: boolean, onChange: () => void, label: string, description?: string }) => (
    <div className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer group" onClick={onChange}>
        <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{label}</span>
            {description && <span className="text-[10px] text-gray-500 mt-0.5">{description}</span>}
        </div>
        <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${checked ? 'bg-twitch' : 'bg-gray-700'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
    </div>
);

const SectionHeader = ({ title, icon }: { title: string, icon?: React.ReactNode }) => (
    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2 mt-6 first:mt-0 pb-2 border-b border-white/5">
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
  const [authMode, setAuthMode] = useState<AuthMode>('local');
  const [hasBackend, setHasBackend] = useState(false);
  const [cloudUser, setCloudUser] = useState<any>(null);

  // Auth Inputs
  const [clientId, setClientId] = useState(currentCreds.clientId || '');
  const [accessToken, setAccessToken] = useState(currentCreds.accessToken || '');
  const [localKickUser, setLocalKickUser] = useState(kickUsername || '');
  const [localKickToken, setLocalKickToken] = useState(kickAccessToken || '');
  const [kickClientId, setKickClientId] = useState(() => localStorage.getItem('kick_client_id') || '');

  // Settings State
  const [settings, setSettings] = useState<ChatSettings>(chatSettings);
  
  // Blocklist State
  const [blockedUsersStr, setBlockedUsersStr] = useState(chatSettings.ignoredUsers.join(', '));
  const [blockedKeywordsStr, setBlockedKeywordsStr] = useState(chatSettings.ignoredKeywords.join(', '));

  // Init Effects
  useEffect(() => {
    setHasBackend(isBackendConfigured());
    const checkSession = async () => {
        if (isBackendConfigured()) {
            const session = await getSession();
            if (session?.user) {
                setCloudUser(session.user);
                setAuthMode('cloud');
            }
        }
    };
    checkSession();
  }, [currentCreds.accessToken]);

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
      localStorage.setItem('kick_client_id', kickClientId);
      
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

  const handleCloudLogout = async () => {
      await signOut();
      setCloudUser(null);
      setAuthMode('local');
  };

  const handleKickLogin = () => {
      if (!kickClientId) return alert("Insira o Client ID.");
      localStorage.setItem('kick_client_id_temp', kickClientId);
      initiateKickLogin(kickClientId, window.location.origin);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-300" onClick={onClose}></div>
      
      <div className="liquid-modal w-full max-w-5xl h-[85vh] rounded-3xl relative z-10 animate-slide-in flex flex-col md:flex-row overflow-hidden border border-white/10 bg-[#09090b]">
        
        {/* --- SIDEBAR (Desktop) / TOPBAR (Mobile) --- */}
        <div className="w-full md:w-64 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-row md:flex-col shrink-0">
            <div className="p-6 md:mb-4 shrink-0 flex items-center justify-between md:block">
                <div>
                    <h2 className="text-xl font-display font-bold text-white tracking-tight">Ajustes</h2>
                    <p className="text-[10px] text-gray-500 hidden md:block mt-1">ViictorN TV v2.0</p>
                </div>
                {/* Mobile Close Button */}
                <button onClick={onClose} className="md:hidden p-2 text-white/50 hover:text-white">✕</button>
            </div>
            
            <nav className="flex-1 px-4 pb-4 md:py-0 overflow-x-auto md:overflow-visible flex flex-row md:flex-col gap-2 custom-scrollbar">
                {[
                    { id: 'accounts', label: 'Contas & Login', icon: <UsersIcon className="w-4 h-4"/> },
                    { id: 'appearance', label: 'Chat & Aparência', icon: <SettingsIcon className="w-4 h-4"/> },
                    { id: 'moderation', label: 'Moderação', icon: <span className="w-4 h-4 font-bold text-center leading-none">🛡️</span> },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as Tab)}
                        className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                            ${activeTab === item.id 
                                ? 'bg-twitch/10 text-twitch border-l-2 border-twitch shadow-[inset_10px_0_20px_-10px_rgba(145,70,255,0.2)]' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'}
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

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#09090b]/50 relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-24 md:pb-10">
                
                {/* TAB: ACCOUNTS */}
                {activeTab === 'accounts' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-8 max-w-2xl">
                        
                        {/* Auth Mode Switcher */}
                         <div className="p-1 bg-black/40 rounded-xl border border-white/10 w-fit flex gap-1 mb-8">
                             <button onClick={() => setAuthMode('local')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${authMode === 'local' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>
                                 <DatabaseIcon className="w-3 h-3" /> Manual
                             </button>
                             <button onClick={() => setAuthMode('cloud')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${authMode === 'cloud' ? 'bg-twitch/20 text-twitch' : 'text-gray-500'}`}>
                                 <CloudIcon className="w-3 h-3" /> Cloud
                             </button>
                         </div>

                        {/* Kick Section */}
                        <section>
                            <SectionHeader title="Kick.com" icon={<PlatformIcon platform="kick" className="w-4 h-4" />} />
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">Username</label>
                                        <input type="text" value={localKickUser} onChange={e => setLocalKickUser(e.target.value)} 
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-kick/50 outline-none" placeholder="UserKick" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-gray-500">Access Token (Bearer)</label>
                                        <input type="password" value={localKickToken} onChange={e => setLocalKickToken(e.target.value)} 
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-kick/50 outline-none font-mono" placeholder="ey..." />
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-white/5">
                                     <h4 className="text-xs font-bold text-kick mb-2">Login Automático (OAuth)</h4>
                                     <div className="flex gap-2">
                                         <input type="text" value={kickClientId} onChange={e => setKickClientId(e.target.value)} 
                                            className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-kick/50 outline-none" placeholder="Client ID do Kick Developers" />
                                         <button onClick={handleKickLogin} className="px-4 py-2 bg-kick text-black rounded-lg text-xs font-bold hover:bg-green-400">Conectar</button>
                                     </div>
                                </div>
                            </div>
                        </section>

                        {/* Twitch Section */}
                        <section>
                            <SectionHeader title="Twitch.tv" icon={<PlatformIcon platform="twitch" className="w-4 h-4" />} />
                            <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
                                {authMode === 'local' ? (
                                    <div className="space-y-4">
                                         <div className="p-3 bg-twitch/10 border border-twitch/20 rounded-lg text-xs text-twitch mb-2">
                                            Use o <a href="https://twitchtokengenerator.com/" target="_blank" className="underline font-bold">Token Generator</a> para pegar os dados.
                                         </div>
                                         <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-gray-500">Client ID</label>
                                            <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} 
                                                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-twitch/50 outline-none font-mono" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-gray-500">OAuth Token</label>
                                            <input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} 
                                                className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:border-twitch/50 outline-none font-mono" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        {!hasBackend ? (
                                            <div className="text-gray-500 text-xs">Backend (Supabase) não configurado.</div>
                                        ) : cloudUser ? (
                                            <div className="flex flex-col items-center gap-3">
                                                <img src={cloudUser.user_metadata.avatar_url} className="w-12 h-12 rounded-full border-2 border-twitch"/>
                                                <div className="text-center">
                                                    <p className="font-bold text-lg">{cloudUser.user_metadata.full_name}</p>
                                                    <p className="text-xs text-gray-500">Conectado e Sincronizando</p>
                                                </div>
                                                
                                                <div className="flex gap-2 mt-2">
                                                    {onForceLoadCloud && (
                                                        <button 
                                                            onClick={onForceLoadCloud}
                                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold border border-white/10"
                                                        >
                                                            Forçar Recarregamento
                                                        </button>
                                                    )}
                                                    <button onClick={handleCloudLogout} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/20">
                                                        Sair
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button onClick={handleCloudLogin} className="w-full py-3 bg-[#9146FF] hover:bg-[#7c3aed] text-white rounded-xl font-bold text-sm shadow-lg shadow-twitch/20 flex items-center justify-center gap-2">
                                                <PlatformIcon platform="twitch" variant="white" className="w-5 h-5" />
                                                Entrar com Twitch
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </motion.div>
                )}

                {/* TAB: APPEARANCE */}
                {activeTab === 'appearance' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-8">
                        
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Visuals */}
                            <div>
                                <SectionHeader title="Estilo do Chat" />
                                <div className="space-y-2">
                                    <ToggleSwitch checked={settings.showTimestamps} onChange={() => toggleSetting('showTimestamps')} label="Horário (Timestamps)" />
                                    <ToggleSwitch checked={settings.hideAvatars} onChange={() => toggleSetting('hideAvatars')} label="Modo Compacto (Sem Avatars)" description="Esconde as fotos de perfil para economizar espaço." />
                                    <ToggleSwitch checked={settings.alternatingBackground} onChange={() => toggleSetting('alternatingBackground')} label="Fundo Alternado (Zebra)" description="Linhas com cores levemente diferentes." />
                                    <ToggleSwitch checked={settings.showSeparator} onChange={() => toggleSetting('showSeparator')} label="Linhas de Separação" />
                                    <ToggleSwitch checked={settings.rainbowUsernames} onChange={() => toggleSetting('rainbowUsernames')} label="Nicks Coloridos (Rainbow)" description="Animação RGB nos nomes dos usuários." />
                                </div>
                            </div>

                            {/* Behavior */}
                            <div>
                                <SectionHeader title="Comportamento" />
                                <div className="space-y-2">
                                    <ToggleSwitch checked={settings.smoothScroll} onChange={() => toggleSetting('smoothScroll')} label="Rolagem Suave" />
                                    <ToggleSwitch checked={settings.highlightMentions} onChange={() => toggleSetting('highlightMentions')} label="Destacar Menções (@)" />
                                    <ToggleSwitch checked={settings.largeEmotes} onChange={() => toggleSetting('largeEmotes')} label="Emotes Grandes" />
                                    <ToggleSwitch checked={settings.cinemaMode} onChange={() => toggleSetting('cinemaMode')} label="Modo Cinema (Padrão)" description="Começar sempre com o topo escondido." />
                                    <ToggleSwitch checked={settings.performanceMode} onChange={() => toggleSetting('performanceMode')} label="Modo Desempenho" description="Renderiza menos mensagens para PCs fracos." />
                                </div>
                            </div>
                        </div>

                        {/* Dropdowns */}
                        <section>
                            <SectionHeader title="Tipografia & Badges" />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Tamanho da Fonte</label>
                                    <select value={settings.fontSize} onChange={(e) => setSettings({...settings, fontSize: e.target.value as any})}
                                        className="w-full bg-black/50 text-white text-xs rounded p-2 outline-none border border-white/10">
                                        <option value="small">Pequeno</option>
                                        <option value="medium">Médio</option>
                                        <option value="large">Grande</option>
                                    </select>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Tipo de Fonte</label>
                                    <select value={settings.fontFamily} onChange={(e) => setSettings({...settings, fontFamily: e.target.value as any})}
                                        className="w-full bg-black/50 text-white text-xs rounded p-2 outline-none border border-white/10">
                                        <option value="sans">Moderna (Sans)</option>
                                        <option value="mono">Developer (Mono)</option>
                                    </select>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Mensagens Deletadas</label>
                                    <select value={settings.deletedMessageBehavior} onChange={(e) => setSettings({...settings, deletedMessageBehavior: e.target.value as any})}
                                        className="w-full bg-black/50 text-white text-xs rounded p-2 outline-none border border-white/10">
                                        <option value="strikethrough">Riscado</option>
                                        <option value="hide">Ocultar</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                <span className="text-xs font-bold text-gray-400 mb-3 block">Badges Visíveis:</span>
                                <div className="flex flex-wrap gap-2">
                                     {['Broadcaster', 'Mod', 'Vip', 'Sub', 'Founder'].map(b => {
                                         const key = `showBadge${b}` as keyof ChatSettings;
                                         return (
                                             <button 
                                                key={b}
                                                onClick={() => toggleSetting(key)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${settings[key] ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-gray-600'}`}
                                             >
                                                 {b}
                                             </button>
                                         );
                                     })}
                                </div>
                            </div>
                        </section>
                    </motion.div>
                )}

                {/* TAB: MODERATION */}
                {activeTab === 'moderation' && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="space-y-6 max-w-3xl">
                         <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-6">
                             <h4 className="text-red-400 font-bold text-sm mb-1">Nota Importante</h4>
                             <p className="text-xs text-gray-400">Esses filtros funcionam localmente no seu navegador. Eles não banem usuários no chat real, apenas escondem as mensagens para você.</p>
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
                                 <SectionHeader title="Palavras Proibidas (Blacklist)" />
                                 <textarea 
                                     value={blockedKeywordsStr}
                                     onChange={(e) => setBlockedKeywordsStr(e.target.value)}
                                     placeholder="Separe as palavras por vírgula. Ex: spoiler, palavra feia"
                                     className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xs text-white focus:border-red-500/50 outline-none h-32 resize-none leading-relaxed font-mono"
                                 />
                             </div>
                         </div>
                     </motion.div>
                )}

            </div>

            {/* Sticky Save Button Mobile */}
            <div className="p-4 md:hidden border-t border-white/5 bg-black/80 backdrop-blur-md absolute bottom-0 left-0 right-0">
                 <button 
                    onClick={handleSave}
                    className="w-full py-3 rounded-xl text-xs font-bold bg-white text-black transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                    <span>Salvar Alterações</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};