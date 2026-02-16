import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsAccountTab } from './settings/SettingsAccountTab';
import { SettingsChatTab } from './settings/SettingsChatTab';
import { SettingsAppearanceTab } from './settings/SettingsAppearanceTab';

interface SettingsTab {
    id: string;
    label: string;
    icon: string;
}

const TABS: SettingsTab[] = [
    { id: 'account', label: 'Accounts', icon: '👤' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    // { id: 'about', label: 'About', icon: 'ℹ️' },
];

export const SettingsModal: React.FC = () => {
    const { isSettingsOpen, setSettingsOpen } = useSettings();
    const [activeTab, setActiveTab] = useState('account');

    if (!isSettingsOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setSettingsOpen(false)}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                className="relative bg-[#09090b] w-full max-w-2xl h-[600px] max-h-[90vh] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/10 ring-1 ring-white/5"
            >
                {/* Close Button Mobile */}
                <button
                    onClick={() => setSettingsOpen(false)}
                    className="absolute top-4 right-4 md:hidden p-2 bg-white/10 rounded-full text-white/70 z-20"
                >
                    ✕
                </button>

                {/* Sidebar */}
                <aside className="w-full md:w-64 bg-black/20 border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col shrink-0">
                    <div className="mb-8 hidden md:block">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
                        <p className="text-xs text-white/40 mt-1">Configure your experience</p>
                    </div>

                    <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                                        ${isActive ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeSettingsTab"
                                            className="absolute inset-0 bg-white/5 rounded-xl border border-white/5"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 text-lg">{tab.icon}</span>
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="mt-auto hidden md:block">
                        <div className="p-4 rounded-xl bg-linear-to-br from-(--color-twitch)/10 to-transparent border border-white/5">
                            <p className="text-xs text-white/50 mb-2">ViictorN TV <span className="text-white/30">v1.0.0</span></p>
                            <div className="flex gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Systems Nominal</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Content */}
                <main className="flex-1 relative overflow-y-auto custom-scrollbar p-6 md:p-8 bg-[#09090b]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {activeTab === 'account' && <SettingsAccountTab />}
                            {activeTab === 'chat' && <SettingsChatTab />}
                            {activeTab === 'appearance' && <SettingsAppearanceTab />}
                            {activeTab === 'about' && (
                                <div className="text-center py-20 text-white/30">
                                    <p>Built with 💜 by the Community</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </motion.div>
        </div>
    );
};
