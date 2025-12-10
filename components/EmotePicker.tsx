import React, { useState } from 'react';
import { EmoteMap, TwitchEmote } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoteCode: string) => void;
  sevenTVEmotes: EmoteMap;
  twitchEmotes: TwitchEmote[];
}

type Tab = '7tv' | 'twitch';

export const EmotePicker: React.FC<Props> = ({ isOpen, onClose, onSelect, sevenTVEmotes, twitchEmotes }) => {
  const [activeTab, setActiveTab] = useState<Tab>('twitch');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Filter 7TV
  const filtered7TV = Object.entries(sevenTVEmotes).filter(([name]) => 
    name.toLowerCase().includes(search.toLowerCase())
  );

  // Filter Twitch
  const filteredTwitch = twitchEmotes.filter(emote => 
    emote.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
    <div className="absolute bottom-14 right-2 w-80 h-96 bg-[#0c0c0e]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[90]">
        
        {/* Header / Tabs */}
        <div className="flex items-center bg-black/40 border-b border-white/10 p-1">
            <button 
                onClick={() => setActiveTab('twitch')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'twitch' ? 'bg-[#9146FF]/20 text-[#9146FF] shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Twitch ({twitchEmotes.length})
            </button>
            <button 
                onClick={() => setActiveTab('7tv')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === '7tv' ? 'bg-white/10 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300'}`}
            >
                7TV ({Object.keys(sevenTVEmotes).length})
            </button>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-white/5 bg-black/20">
            <input 
                type="text" 
                placeholder="Buscar emote..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 placeholder-white/20"
            />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-gradient-to-b from-transparent to-black/20">
            <div className="grid grid-cols-5 gap-2">
                {activeTab === '7tv' && filtered7TV.map(([name, url]) => (
                    <button
                        key={name}
                        onClick={() => onSelect(name)}
                        className="aspect-square flex items-center justify-center hover:bg-white/10 rounded-lg transition-all p-1 group"
                        title={name}
                    >
                        <img src={url} alt={name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" loading="lazy"/>
                    </button>
                ))}

                {activeTab === 'twitch' && filteredTwitch.map((emote) => (
                    <button
                        key={emote.id}
                        onClick={() => onSelect(emote.name)}
                        className="aspect-square flex items-center justify-center hover:bg-white/10 rounded-lg transition-all p-1 group"
                        title={emote.name}
                    >
                        <img src={emote.images.url_2x || emote.images.url_1x} alt={emote.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" loading="lazy"/>
                    </button>
                ))}
            </div>
            
            {activeTab === '7tv' && filtered7TV.length === 0 && (
                <div className="text-center text-white/30 text-xs py-10">Nenhum emote encontrado.</div>
            )}
             {activeTab === 'twitch' && filteredTwitch.length === 0 && (
                <div className="text-center text-white/30 text-xs py-10">Nenhum emote encontrado.</div>
            )}
        </div>
        
        {/* Footer Close */}
        <button onClick={onClose} className="p-3 text-xs text-center font-bold text-white/40 hover:text-white hover:bg-white/5 border-t border-white/10 transition-colors">
            Fechar
        </button>
    </div>
    </AnimatePresence>
  );
};