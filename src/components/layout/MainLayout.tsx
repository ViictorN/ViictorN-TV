import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { motion } from 'framer-motion';

interface MainLayoutProps {
    children: React.ReactNode;
    chatSidebar: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, chatSidebar }) => {
    const { settings } = useSettings();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="flex flex-col md:flex-row h-dvh w-screen bg-(--color-dark) text-white overflow-hidden font-sans relative selection:bg-(--color-twitch)/30 selection:text-white bg-noise">

            {/* Ambient Glows */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-(--color-twitch)/5 blur-[120px] mix-blend-screen animate-pulse-glow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-(--color-kick)/5 blur-[120px] mix-blend-screen animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
            </div>

            {/* MAIN CONTENT AREA */}
            <main
                className={`
                    relative z-10 flex flex-col min-w-0 min-h-0
                    order-1
                    flex-1
                    transition-all duration-300
                `}
            >
                <div className="w-full h-full relative">
                    {children}
                </div>
            </main>

            {/* CHAT SIDEBAR */}
            <aside
                className={`
                    relative z-20 flex flex-col order-2
                    bg-black/40 backdrop-blur-xl border-white/5
                    overflow-hidden transition-all duration-300 ease-in-out
                    
                    /* MOBILE STYLES */
                    w-full
                    ${settings.cinemaMode ? 'h-0 border-none' : 'h-[45dvh] border-t'}

                    /* DESKTOP STYLES */
                    md:h-full md:border-t-0 md:border-l
                    ${settings.cinemaMode ? 'md:w-0 md:border-none' : 'md:w-[400px]'}
                `}
            >
                <div className={`h-full w-full flex flex-col ${settings.cinemaMode ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                    {chatSidebar}
                </div>
            </aside>

            {/* CINEMA MODE HINT (Desktop Only) */}
            {settings.cinemaMode && (
                <div className="hidden md:flex absolute right-0 top-0 bottom-0 w-4 z-50 hover:bg-white/5 transition-colors cursor-pointer items-center justify-center group" title="Show Chat">
                    <div className="w-1 h-12 rounded-full bg-white/20 group-hover:bg-white/40 transition-colors" />
                </div>
            )}
        </div>
    );
};
