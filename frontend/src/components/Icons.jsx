import React from 'react';

export function TelegramIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

export function InstagramIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function ChannelBadge({ channel, showLabel = true, className = "" }) {
  const isTG = channel === 'telegram';
  return (
    <span 
      className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
        isTG 
          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30' 
          : 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30'
      } ${className}`}
      title={isTG ? "Telegram бот (@topvpnhelp_bot)" : "Instagram Direct"}
    >
      {isTG ? (
        <TelegramIcon className="w-3 h-3 text-sky-500 shrink-0" />
      ) : (
        <InstagramIcon className="w-3 h-3 text-pink-500 shrink-0" />
      )}
      {showLabel && (
        <span>{isTG ? 'Telegram' : 'Instagram'}</span>
      )}
    </span>
  );
}
