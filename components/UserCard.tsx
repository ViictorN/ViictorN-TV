import React, { useState, useEffect } from 'react';
import { User, ChatMessage, Platform, TwitchCreds } from '../types';
import { PlatformIcon } from './Icons';

interface Props {
  user: User;
  platform: Platform;
  messages: ChatMessage[]; // To calculate stats
  onClose: () => void;
  twitchCreds: TwitchCreds;
}

export const UserCard: React.FC<Props> = ({ user, platform, messages, onClose, twitchCreds }) => {
  const [fetchedAvatar, setFetchedAvatar] = useState<string | null>(null);

  // Stats Logic
  const userMessages = messages.filter(m => m.user.username.toLowerCase() === user.username.toLowerCase() && m.platform === platform);
  const messageCount = userMessages.length;
  const lastMessage = userMessages[userMessages.length - 1];
  const lastSeen = lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString() : 'N/A';
  const lastDate = lastMessage ? new Date(lastMessage.timestamp).toLocaleDateString() : '';

  // Calculate Roles string from badges
  const roles = user.badges.map(b => b.type).join(', ') || 'user';

  // Fetch Twitch Avatar if authenticated
  useEffect(() => {
      if (platform === Platform.TWITCH && !user.avatarUrl && twitchCreds.accessToken && user.id) {
          fetch(`https://api.twitch.tv/helix/users?id=${user.id}`, {
              headers: {
                  'Client-ID': twitchCreds.clientId,
                  'Authorization': `Bearer ${twitchCreds.accessToken}`
              }
          })
          .then(res => res.json())
          .then(data => {
              if (data.data && data.data[0]) {
                  setFetchedAvatar(data.data[0].profile_image_url);
              }
          })
          .catch(err => console.error("Failed to fetch twitch profile", err));
      }
  }, [user, platform, twitchCreds]);

  // Display Image
  const displayAvatar = fetchedAvatar || user.avatarUrl;
  
  // Default Avatar Color
  const initial = user.username.charAt(0).toUpperCase();
  const bgColor = user.color || (platform === Platform.TWITCH ? '#9146FF' : '#53FC18');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        
        {/* Card */}
        <div className="relative bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up">
            
            {/* Header / Banner area could go here, for now using solid color */}
            <div className="h-24 w-full bg-gradient-to-r from-gray-900 to-black relative border-b border-white/5">
                 <button onClick={onClose} className="absolute top-2 right-2 p-2 text-white/50 hover:text-white transition-colors">✕</button>
            </div>

            <div className="px-6 pb-6 -mt-12 relative">
                {/* Avatar */}
                <div className="flex justify-between items-end mb-4">
                    <div className="w-24 h-24 rounded-full border-4 border-[#18181b] bg-[#18181b] overflow-hidden shadow-lg relative">
                        {displayAvatar ? (
                             <img src={displayAvatar} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/90" style={{ backgroundColor: bgColor }}>
                                {initial}
                            </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black rounded-full p-1 border border-white/10">
                            <PlatformIcon platform={platform === Platform.TWITCH ? 'twitch' : 'kick'} className="w-4 h-4" variant="default" />
                        </div>
                    </div>
                    <div className="text-right">
                         <span className="text-xs font-mono text-gray-500 block mb-0.5">ID: {user.id || 'N/A'}</span>
                         <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] uppercase font-bold text-gray-400">
                             {roles}
                         </span>
                    </div>
                </div>

                {/* Name */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {user.username}
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></span>
                    </h2>
                    <a 
                        href={platform === Platform.TWITCH ? `https://twitch.tv/${user.username}` : `https://kick.com/${user.username}`}
                        target="_blank"
                        rel="noreferrer" 
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline break-all"
                    >
                        {platform === Platform.TWITCH ? `https://twitch.tv/${user.username}` : `https://kick.com/${user.username}`}
                    </a>
                </div>

                {/* Stats Grid */}
                <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-xs text-gray-400">Mensagens na sessão</span>
                        <span className="text-sm font-mono font-bold text-white">{messageCount}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-xs text-gray-400">Última vez visto</span>
                        <span className="text-xs text-white">{lastDate} às {lastSeen}</span>
                    </div>
                    
                    <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Última Mensagem</span>
                        <p className="text-sm text-gray-300 italic bg-white/5 p-2 rounded border border-white/5">
                            "{lastMessage?.content || '...'}"
                        </p>
                    </div>
                </div>

                {/* Debug Info (Like Axel Chat) */}
                 <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-gray-600 font-mono break-all">
                    <p>Folder: services/{platform.toLowerCase()}/authors/{user.username.toLowerCase()}</p>
                    <p>Avatar: {displayAvatar || 'null'}</p>
                 </div>

            </div>
        </div>
    </div>
  );
};
