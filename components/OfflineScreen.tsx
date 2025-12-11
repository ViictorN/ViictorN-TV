import React, { useState, useEffect } from 'react';
import { TwitchCreds } from '../types';
import { PlatformIcon } from './Icons';
import { motion } from 'framer-motion';

interface Props {
  twitchCreds: TwitchCreds;
  streamerSlug: string;
  onForcePlay: () => void;
}

interface Clip {
  id: string;
  url: string;
  embed_url: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  created_at: string;
}

export const OfflineScreen: React.FC<Props> = ({ twitchCreds, streamerSlug, onForcePlay }) => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClips = async () => {
      if (!twitchCreds.clientId || !twitchCreds.accessToken) return;

      setLoading(true);
      try {
        const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${streamerSlug}`, {
          headers: { 'Client-ID': twitchCreds.clientId, 'Authorization': `Bearer ${twitchCreds.accessToken}` }
        });
        const userData = await userRes.json();
        const userId = userData.data?.[0]?.id;

        if (userId) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          
          const clipsRes = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=4&started_at=${startDate.toISOString()}`, {
             headers: { 'Client-ID': twitchCreds.clientId, 'Authorization': `Bearer ${twitchCreds.accessToken}` }
          });
          const clipsData = await clipsRes.json();
          if (clipsData.data) {
             setClips(clipsData.data);
          }
        }
      } catch (e) {
        console.error("Failed to fetch clips", e);
      } finally {
        setLoading(false);
      }
    };

    fetchClips();
  }, [twitchCreds, streamerSlug]);

  return (
    <div className="w-full h-full bg-black relative flex flex-col items-center justify-center overflow-hidden p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-twitch/10 via-black to-black opacity-50"></div>
        
        <div className="z-10 flex flex-col items-center w-full max-w-5xl">
            
            <div className="text-center mb-6 md:mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-xs font-bold tracking-widest uppercase text-gray-300">Offline</span>
                </div>
                <h2 className="text-2xl md:text-5xl font-display font-bold text-white mb-2 tracking-tight leading-tight">
                    {streamerSlug} está offline
                </h2>
                <p className="text-white/40 text-xs md:text-base px-4">
                    A live acabou ou ainda não começou. Confira os destaques abaixo.
                </p>
            </div>

            {clips.length > 0 && (
                <div className="w-full mb-8">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2 justify-center md:justify-start">
                         <PlatformIcon platform="twitch" className="w-3 h-3 text-twitch" />
                         Clipes do Mês
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                         {clips.map(clip => (
                             <motion.a 
                                whileHover={{ scale: 1.05 }}
                                key={clip.id} 
                                href={clip.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="group relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-white/10 transition-colors"
                             >
                                 <img src={clip.thumbnail_url} alt={clip.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex flex-col justify-end">
                                     <p className="text-xs font-bold text-white line-clamp-2 leading-tight mb-1">{clip.title}</p>
                                     <p className="text-[10px] text-gray-400">{clip.view_count.toLocaleString()} visualizações</p>
                                 </div>
                                 <div className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                 </div>
                             </motion.a>
                         ))}
                     </div>
                </div>
            )}

            <div className="flex flex-wrap justify-center gap-4">
                <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={`https://www.twitch.tv/${streamerSlug}/videos`} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-xl bg-[#9146FF]/10 hover:bg-[#9146FF]/20 text-[#9146FF] border border-[#9146FF]/20 hover:border-[#9146FF]/50 transition-colors font-bold text-xs md:text-sm flex items-center gap-2">
                    <PlatformIcon platform="twitch" className="w-4 h-4" /> VODs Twitch
                </motion.a>
                <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={`https://kick.com/${streamerSlug}/videos`} target="_blank" rel="noopener noreferrer" className="px-5 py-3 rounded-xl bg-[#53FC18]/10 hover:bg-[#53FC18]/20 text-[#53FC18] border border-[#53FC18]/20 hover:border-[#53FC18]/50 transition-colors font-bold text-xs md:text-sm flex items-center gap-2">
                    <PlatformIcon platform="kick" className="w-4 h-4" /> VODs Kick
                </motion.a>
            </div>

            <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onForcePlay}
                className="mt-8 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all flex items-center gap-2"
            >
                <span>⚠️</span>
                <span>Forçar Carregamento do Player</span>
            </motion.button>
        </div>
    </div>
  );
};