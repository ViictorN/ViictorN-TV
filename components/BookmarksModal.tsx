import React, { useEffect, useState } from 'react';
import { SavedMessage } from '../types';
import { getSavedMessages, deleteSavedMessage } from '../services/supabaseService';
import { PlatformIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BookmarksModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [bookmarks, setBookmarks] = useState<SavedMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setLoading(true);
        getSavedMessages()
            .then(setBookmarks)
            .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleDelete = async (id: string) => {
      // Optimistic update
      setBookmarks(prev => prev.filter(b => b.id !== id));
      await deleteSavedMessage(id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="liquid-modal w-full max-w-2xl h-[70vh] rounded-2xl relative z-10 animate-slide-up flex flex-col overflow-hidden">
         
         <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
             <div className="flex items-center gap-2">
                 <span className="text-yellow-400 text-lg">★</span>
                 <h2 className="text-white font-bold font-display">Mensagens Salvas (Cloud)</h2>
             </div>
             <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#09090b]">
             {loading ? (
                 <div className="text-center text-white/30 py-10">Carregando...</div>
             ) : bookmarks.length === 0 ? (
                 <div className="text-center text-white/30 py-10 flex flex-col items-center gap-2">
                     <span className="text-3xl grayscale opacity-30">★</span>
                     <p>Nenhuma mensagem salva.</p>
                     <p className="text-xs">Passe o mouse sobre uma mensagem no chat e clique na estrela para salvar.</p>
                 </div>
             ) : (
                 <div className="space-y-2">
                     <AnimatePresence>
                     {bookmarks.map(b => (
                         <motion.div 
                            key={b.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors flex gap-3 group"
                         >
                             <div className="shrink-0 pt-1">
                                 {b.avatar_url ? (
                                     <img src={b.avatar_url} className="w-8 h-8 rounded-full bg-gray-800" alt={b.author} />
                                 ) : (
                                     <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-xs">{b.author[0]}</div>
                                 )}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-0.5">
                                     <PlatformIcon platform={b.platform === 'Twitch' ? 'twitch' : 'kick'} className="w-3 h-3" />
                                     <span className="font-bold text-sm text-gray-200">{b.author}</span>
                                     <span className="text-[10px] text-gray-600 ml-auto font-mono">{new Date(b.timestamp).toLocaleString()}</span>
                                 </div>
                                 <p className="text-sm text-white/80 break-words">{b.content}</p>
                             </div>
                             <button 
                                onClick={() => handleDelete(b.id)}
                                className="self-start text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remover"
                             >
                                 ✕
                             </button>
                         </motion.div>
                     ))}
                     </AnimatePresence>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};
