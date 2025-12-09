import React from 'react';

export const ViictorNLogo = ({ className }: { className?: string }) => (
  <svg className={`${className} animate-logo-float`} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="glassGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="white" stopOpacity="0.2" />
        <stop offset="100%" stopColor="white" stopOpacity="0.05" />
      </linearGradient>
       <linearGradient id="accentGradient" x1="10" y1="30" x2="30" y2="10" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9146FF" />
        <stop offset="100%" stopColor="#53FC18" />
      </linearGradient>
    </defs>
    
    <rect x="4" y="4" width="32" height="32" rx="8" fill="url(#glassGradient)" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
    <path d="M14 14L20 28L26 14" stroke="url(#accentGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="drop-shadow(0 0 4px rgba(255,255,255,0.5))" />
  </svg>
);

export const TwitchLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
     <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
  </svg>
);

export const KickLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M4 0C1.79086 0 0 1.79086 0 4V20C0 22.2091 1.79086 24 4 24H20C22.2091 24 24 22.2091 24 20V4C24 1.79086 22.2091 0 20 0H4ZM8.5 6H11.5L14.5 10.5L18 6H21.5L16.5 12.5L21.5 19H18L13.5 13.5L11.5 16V19H8.5V6Z" />
  </svg>
);

export const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

export const UsersIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
    </svg>
);

// --- REUSABLE PLATFORM COMPONENT ---

type PlatformType = 'twitch' | 'kick' | 'none';
type Variant = 'default' | 'glow' | 'subdued' | 'white';

interface PlatformIconProps {
    platform: PlatformType;
    className?: string;
    variant?: Variant;
}

export const PlatformIcon: React.FC<PlatformIconProps> = ({ platform, className = '', variant = 'default' }) => {
    
    // Base Colors
    const twitchColor = 'text-[#9146FF]';
    const kickColor = 'text-[#53FC18]';
    
    // Shadows
    const twitchGlow = 'drop-shadow-[0_0_8px_rgba(145,70,255,0.6)]';
    const kickGlow = 'drop-shadow-[0_0_8px_rgba(83,252,24,0.6)]';

    let finalClass = className;

    // Apply Variant Styling
    if (variant === 'default') {
        if (platform === 'twitch') finalClass += ` ${twitchColor}`;
        if (platform === 'kick') finalClass += ` ${kickColor}`;
    } else if (variant === 'glow') {
        if (platform === 'twitch') finalClass += ` ${twitchColor} ${twitchGlow}`;
        if (platform === 'kick') finalClass += ` ${kickColor} ${kickGlow}`;
    } else if (variant === 'white') {
        finalClass += ' text-white';
    } else if (variant === 'subdued') {
        finalClass += ' text-gray-400';
    }

    if (platform === 'twitch') return <TwitchLogo className={finalClass} />;
    if (platform === 'kick') return <KickLogo className={finalClass} />;
    
    return null;
};