import React from 'react';

export const ViictorNLogo = ({ className }: { className?: string }) => (
  <svg className={`${className} animate-logo-float`} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="glassGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="white" stopOpacity="0.15" />
        <stop offset="100%" stopColor="white" stopOpacity="0.02" />
      </linearGradient>
       <linearGradient id="accentGradient" x1="8" y1="32" x2="32" y2="8" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9146FF" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#53FC18" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Background Shape */}
    <rect x="4" y="4" width="32" height="32" rx="10" fill="url(#glassGradient)" stroke="white" strokeOpacity="0.15" strokeWidth="1" />
    
    {/* Stylized V7 Shape */}
    <path 
        d="M11 11L19.5 28L29 9" 
        stroke="url(#accentGradient)" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        filter="url(#glow)"
    />
  </svg>
);

export const TwitchLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
     <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
  </svg>
);

export const KickLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sharp Black Background (Square) */}
    <rect width="24" height="24" fill="#000000"/>
    {/* Pixelated/Blocky 'K' Shape - Constructed of 4 connecting rectangles */}
    {/* Left Bar: 5-11, Middle: 11-15, TopRight: 15-20, BotRight: 15-20 */}
    <path d="M5 4h6v16H5V4zm6 5h4v6h-4V9zm4-5h5v5h-5V4zm0 11h5v5h-5v-5z" fill="#53FC18"/>
  </svg>
);

export const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export const SmileyIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
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

export const DatabaseIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
    </svg>
);

export const CloudIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
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
    
    // Shadows - Intensified for Neon Effect
    const twitchGlow = 'drop-shadow-[0_0_8px_rgba(145,70,255,1)] filter brightness-125';
    // Remove glow for Kick if it causes issues, or keep it subtle
    const kickGlow = 'drop-shadow-[0_0_8px_rgba(83,252,24,0.6)] filter brightness-110';

    let finalClass = className;

    // Apply Variant Styling
    if (variant === 'default') {
        if (platform === 'twitch') finalClass += ` ${twitchColor}`;
        if (platform === 'kick') finalClass += ` ${kickColor}`;
    } else if (variant === 'glow') {
        if (platform === 'twitch') finalClass += ` ${twitchColor} ${twitchGlow}`;
        if (platform === 'kick') finalClass += ` ${kickColor}`;
    } else if (variant === 'white') {
        finalClass += ' text-white';
    } else if (variant === 'subdued') {
        finalClass += ' text-gray-400';
    }

    if (platform === 'twitch') return <TwitchLogo className={finalClass} />;
    if (platform === 'kick') return <KickLogo className={finalClass} />;
    
    return null;
};
