import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Platform, User } from '../../types';
import { PlatformIcon } from '../Icons';
import { motion } from 'framer-motion';

export const SettingsAccountTab: React.FC = () => {
    const {
        settings, updateSettings,
        currentUser,
        twitchStatus, kickStatus,
        loginTwitch, logoutTwitch,
        loginKick, logoutKick
    } = useSettings();

    const renderAccountCard = (platform: Platform) => {
        const isTwitch = platform === Platform.TWITCH;
        const status = isTwitch ? twitchStatus : kickStatus;
        const user = isTwitch ? currentUser.twitch : currentUser.kick;
        const userAvatar = isTwitch ? currentUser.twitchAvatar : currentUser.kickAvatar;
        const themeColor = isTwitch ? 'var(--color-twitch)' : 'var(--color-kick)';
        const bgGradient = isTwitch ? 'from-(--color-twitch)/10 to-transparent' : 'from-(--color-kick)/10 to-transparent';

        return (
            <div className={`
                relative p-5 rounded-2xl border border-white/5 overflow-hidden group hover:border-white/10 transition-colors
                ${status === 'connected' ? 'bg-gradient-to-br ' + bgGradient : 'bg-white/5'}
            `}>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <PlatformIcon platform={isTwitch ? 'twitch' : 'kick'} className="w-24 h-24 transform rotate-12" variant="default" />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`
                            w-14 h-14 rounded-full flex items-center justify-center relative
                            ${status === 'connected' ? 'ring-2 ring-offset-2 ring-offset-[#09090b] ring-' + (isTwitch ? 'purple-500' : 'green-500') : 'bg-white/10'}
                        `}>
                            {status === 'connected' && userAvatar ? (
                                <img src={userAvatar} alt={user} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <PlatformIcon platform={isTwitch ? 'twitch' : 'kick'} className="w-6 h-6 opacity-50" variant="default" />
                            )}

                            {status === 'connected' && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#09090b]" />
                            )}
                        </div>

                        <div>
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                {isTwitch ? 'Twitch' : 'Kick'}
                                {status === 'connected' && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 font-bold uppercase tracking-wider border border-green-500/20">
                                        Connected
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-white/50">
                                {status === 'connected' ? `Logged in as ${user}` : 'Not connected'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={isTwitch ? (status === 'connected' ? logoutTwitch : loginTwitch) : (status === 'connected' ? logoutKick : loginKick)}
                        disabled={status === 'loading'}
                        className={`
                            px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                            ${status === 'connected'
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                : `bg-${isTwitch ? '[#9146FF]' : '[#53FC18]'} text-black hover:brightness-110 shadow-lg shadow-${isTwitch ? 'purple' : 'green'}-500/20`
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        {status === 'loading' ? 'Values...' : status === 'connected' ? 'Disconnect' : 'Connect'}
                    </button>
                </div>

                {status === 'connected' && (
                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                        <div className="bg-black/20 rounded-lg p-3">
                            <span className="block text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Status</span>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-mono text-white/80">Online</span>
                            </div>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3">
                            <span className="block text-[10px] text-white/40 uppercase tracking-wider font-bold mb-1">Permissions</span>
                            <span className="text-xs font-mono text-white/80">Chat, Read</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Accounts</h2>
                <p className="text-sm text-white/50">Manage your connected platforms to enable chat and synchronization features.</p>
            </div>

            {/* Platform Cards */}
            <div className="space-y-4">
                {renderAccountCard(Platform.TWITCH)}
                {renderAccountCard(Platform.KICK)}
            </div>

            {/* Global Settings */}
            <div className="pt-6 border-t border-white/5">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider opacity-80">Sync Settings</h3>
                
                <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${settings.syncSettings ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-white group-hover:text-white transition-colors">Cloud Sync</span>
                                <span className="block text-xs text-white/40">Sync your settings across devices</span>
                            </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors ${settings.syncSettings ? 'bg-blue-600' : 'bg-white/10'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.syncSettings ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={settings.syncSettings}
                            onChange={(e) => updateSettings({ syncSettings: e.target.checked })}
                        />
                    </label>

                     <label className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${settings.lowLatencyMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/40'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-white group-hover:text-white transition-colors">Low Latency Mode</span>
                                <span className="block text-xs text-white/40">Optimize for speed over quality (Experimental)</span>
                            </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors ${settings.lowLatencyMode ? 'bg-yellow-600' : 'bg-white/10'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.lowLatencyMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={settings.lowLatencyMode}
                            onChange={(e) => updateSettings({ lowLatencyMode: e.target.checked })}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};
