
import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
type ToastType = 'success' | 'error' | 'info' | 'twitch' | 'kick';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast Component
const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return '✨';
            case 'error': return '⚠️';
            case 'info': return 'ℹ️';
            case 'twitch': return (
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </svg>
            );
            case 'kick': return (
                <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 4h6v16H5V4zm6 5h4v6h-4V9zm4-5h5v5h-5V4zm0 11h5v5h-5v-5z" />
                </svg>
            );
            default: return '✨';
        }
    };

    const getColors = (type: ToastType) => {
        switch (type) {
            case 'success': return 'border-green-500/50 bg-green-500/10 text-green-200';
            case 'error': return 'border-red-500/50 bg-red-500/10 text-red-200';
            case 'twitch': return 'border-[var(--color-twitch)]/50 bg-[var(--color-twitch)]/10 text-[#d3b8ff]';
            case 'kick': return 'border-[var(--color-kick)]/50 bg-[var(--color-kick)]/10 text-[#a9ff8e]';
            default: return 'border-white/20 bg-white/5 text-gray-200';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`
                relative flex items-center gap-3 px-4 py-3 min-w-[300px] rounded-xl border backdrop-blur-xl shadow-2xl
                ${getColors(toast.type)}
            `}
        >
            <div className="text-lg">{getIcon(toast.type)}</div>
            <div className="flex-1 text-xs font-bold font-sans tracking-wide">{toast.message}</div>
            <button
                onClick={() => onRemove(toast.id)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-50 hover:opacity-100"
            >
                ✕
            </button>

            {/* Progress bar animation */}
            <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-[2px] ${toast.type === 'twitch' ? 'bg-(--color-twitch)' : toast.type === 'kick' ? 'bg-(--color-kick)' : 'bg-current opacity-30'}`}
            />
        </motion.div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <div key={toast.id} className="pointer-events-auto">
                            <ToastItem toast={toast} onRemove={removeToast} />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
