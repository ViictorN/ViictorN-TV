import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const STREAMER_SLUG = 'gabepeixe';

import { motion, AnimatePresence } from 'framer-motion';



export const VideoPlayer: React.FC = () => {
    const { activePlayer, playerRefreshKey } = useSettings();
    const [isLoading, setIsLoading] = useState(true);

    const handleLoad = () => {
        setTimeout(() => setIsLoading(false), 1000);
    };

    // Reset loading on player change
    React.useEffect(() => {
        setIsLoading(true);
    }, [activePlayer, playerRefreshKey]);

    // Simple parent domain calculation for Twitch embedding
    const getParentDomain = () => {
        const currentHost = window.location.hostname;
        const parents = new Set<string>();
        if (currentHost) parents.add(currentHost);
        if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') parents.add('localhost');
        return Array.from(parents).map(domain => `&parent=${domain}`).join('');
    };

    if (activePlayer === 'none') {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center z-10 p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-xl"
                >
                    <span className="text-4xl mb-4 block animate-pulse">💬</span>
                    <h2 className="text-white/20 font-bold tracking-[0.2em] uppercase text-sm">Chat Only Mode</h2>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="bg-black relative w-full h-full overflow-hidden group">
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-black"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className={`w-12 h-12 rounded-full border-4 border-t-transparent animate-spin ${activePlayer === 'twitch' ? 'border-(--color-twitch)' : 'border-(--color-kick)'}`} />
                            <p className="text-[10px] text-white/50 font-mono animate-pulse uppercase tracking-widest">Connecting Stream...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {activePlayer === 'twitch' && (
                <iframe
                    key={`twitch-${playerRefreshKey}`}
                    src={`https://player.twitch.tv/?channel=${STREAMER_SLUG}${getParentDomain()}&muted=false&autoplay=true`}
                    className="w-full h-full border-none relative z-10"
                    allowFullScreen
                    scrolling="no"
                    onLoad={handleLoad}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write"
                />
            )}

            {activePlayer === 'kick' && (
                <iframe
                    key={`kick-${playerRefreshKey}`}
                    src={`https://player.kick.com/${STREAMER_SLUG}?autoplay=true&muted=false`}
                    className="w-full h-full border-none relative z-10"
                    allowFullScreen
                    scrolling="no"
                    onLoad={handleLoad}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
                />
            )}

            {/* Ambient Glow behind player */}
            <div className={`absolute inset-0 z-0 opacity-20 pointer-events-none transition-colors duration-1000 ${activePlayer === 'twitch' ? 'bg-[radial-gradient(ellipse_at_center,var(--color-twitch-dark),transparent_70%)]' : 'bg-[radial-gradient(ellipse_at_center,var(--color-kick-dark),transparent_70%)]'}`} />
        </div>
    );
};
