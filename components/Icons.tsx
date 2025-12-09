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
     <path fillRule="evenodd" clipRule="evenodd" d="M5.14286 0L1.71429 3.42857V18H6.85714V21.4286H10.2857L13.7143 18H18L22.2857 13.7143V0H5.14286ZM20.5714 12.8571L17.1429 16.2857H12.8571L10.2857 18.8571V16.2857H6.85714V1.71429H20.5714V12.8571ZM10.2857 8.57143H12V5.14286H10.2857V8.57143ZM15.4286 8.57143H17.1429V5.14286H15.4286V8.57143Z" />
  </svg>
);

export const KickLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M4 0C1.79086 0 0 1.79086 0 4V20C0 22.2091 1.79086 24 4 24H20C22.2091 24 24 22.2091 24 20V4C24 1.79086 22.2091 0 20 0H4ZM7 5H10.5V10.5L14.5 5H19L13.5 11.5L19.5 19H15.5L11 13V19H7V5Z" />
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