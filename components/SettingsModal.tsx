import React, { useState } from 'react';
import { TwitchCreds } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (creds: TwitchCreds) => void;
  currentCreds: TwitchCreds;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, onSave, currentCreds }) => {
  const [clientId, setClientId] = useState(currentCreds.clientId || '');
  const [accessToken, setAccessToken] = useState(currentCreds.accessToken || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ clientId, accessToken });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#0f0f11] border border-glass-border w-full max-w-md p-6 rounded-xl shadow-2xl relative z-10 animate-slide-in">
        <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
           <span className="text-twitch">API</span> Configuração
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-twitch/10 border border-twitch/20 rounded-lg text-xs text-gray-300">
                <p className="mb-2 font-bold text-twitch">Por que isso é necessário?</p>
                <p>Para ver o <strong>Contador de Viewers da Twitch</strong> e as <strong>Badges Reais</strong> (Inscritos, etc.), a API oficial da Twitch exige autenticação.</p>
                <p className="mt-2 text-gray-400">Seus dados ficam salvos apenas no seu navegador.</p>
            </div>

            <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">CLIENT ID</label>
                <input 
                    type="text" 
                    name="clientId"
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full bg-black/50 border border-glass-border rounded p-2 text-sm focus:border-twitch outline-none"
                    placeholder="Ex: gp762nuuoqcoxypju8c569v9xflm4r"
                    autoComplete="username"
                />
            </div>

            <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">ACCESS TOKEN (OAUTH)</label>
                <input 
                    type="password" 
                    name="accessToken"
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                    className="w-full bg-black/50 border border-glass-border rounded p-2 text-sm focus:border-twitch outline-none"
                    placeholder="Ex: 2gbdx6oar67tqtcmt49t3wpcgy..."
                    autoComplete="current-password"
                />
                <a href="https://twitchtokengenerator.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline mt-1 block">
                    Gerar Token (Use 'Custom Scope' -&gt; Selecione nada ou 'user:read:email')
                </a>
            </div>

            <div className="flex justify-end gap-2 mt-6">
                <button 
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5"
                >
                    Cancelar
                </button>
                <button 
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm bg-twitch hover:bg-twitch/80 text-white font-medium shadow-lg shadow-twitch/20"
                >
                    Salvar & Conectar
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};