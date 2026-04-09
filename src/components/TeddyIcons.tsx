"use client";

import { cn } from "@/lib/utils";

export type IconVariant = 
  | 'dashboard' | 'todos' | 'streaks' | 'profile' | 'paw' | 'calendar' | 'star' | 'moon' | 'flame' | 'gradient'
  | 'cat-glasses' | 'polar-bear' | 'fox-smile' | 'bunny-crown' | 'panda-bamboo' | 'frog-hat' 
  | 'unicorn' | 'rainbow-kitty' | 'strawberry-bear' | 'coffee-fox' | 'rockstar-bunny' | 'magic-panda';

interface TeddyIconProps {
  className?: string;
  size?: number;
  variant?: IconVariant;
  color?: string;
}

export function TeddyIcon({ className, size = 24, variant = 'dashboard', color }: TeddyIconProps) {
  const gradientId = `icon-grad-${variant}-${color?.replace('#', '')}`;
  const effectiveColor = color || '#a855f7';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-all teddy-icon-glow", className)}
      style={{ color: effectiveColor }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={effectiveColor} />
          <stop offset="100%" stopColor={effectiveColor} stopOpacity={0.6} />
        </linearGradient>
      </defs>

      <g stroke={variant.includes('-') ? effectiveColor : `url(#${gradientId})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Core Logic Icons */}
        {variant === 'dashboard' && <path d="M3 3v18h18M7 16l4-4 4 4 5-8" />}
        {variant === 'todos' && <path d="M9 11h6M9 14h4M3 21h18M3 7V5a2 2 0 012-2h14a2 2 0 012 2v2M3 7h18M3 7v14a2 2 0 002 2h14a2 2 0 002-2V7" />}
        {variant === 'calendar' && <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />}
        {variant === 'streaks' && <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />}
        {variant === 'flame' && <path d="M12 2c0 10-8 6-8 12a8 8 0 0016 0c0-6-8-2-8-12z" />}
        {variant === 'star' && <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />}
        
        {/* Animal Gallery Icons */}
        {variant === 'cat-glasses' && (
          <>
            <path d="M3 8l3-3 4 2h4l4-2 3 3v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            <path d="M7 12a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM9 14h6" />
            <path d="M5 8c0-2 2-3 4-3s4 1 4 3m6 0c0-2-2-3-4-3s-4 1-4 3" />
          </>
        )}
        {variant === 'polar-bear' && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 11a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
            <path d="M10 15h4v1a2 2 0 01-4 0v-1z" />
            <path d="M4 8l-1-1m17 1l1-1" />
          </>
        )}
        {variant === 'fox-smile' && (
          <>
            <path d="M12 21l-9-7V7l4-2 5 3 5-3 4 2v7l-9 7z" />
            <path d="M8 11a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
            <path d="M9 16c1 1 5 1 6 0" />
          </>
        )}
        {variant === 'bunny-crown' && (
          <>
            <path d="M7 10c0-4 1-8 5-8s5 4 5 8" />
            <circle cx="12" cy="15" r="7" />
            <path d="M9 13h1m5 0h1m-5 4s1 1 2 1 2-1 2-1" />
            <path d="M10 8l2-2 2 2" fill={effectiveColor} fillOpacity="0.2" />
          </>
        )}
        {variant === 'panda-bamboo' && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8 11a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z" fill={effectiveColor} fillOpacity="0.3" />
            <path d="M11 15h2" />
            <path d="M20 6l-2 2m-14 0l-2-2" strokeWidth="2.5" />
          </>
        )}
        {variant === 'frog-hat' && (
          <>
            <path d="M3 14c0-5 4-9 9-9s9 4 9 9v4H3v-4z" />
            <circle cx="7" cy="7" r="3" strokeOpacity="0.5" />
            <circle cx="17" cy="7" r="3" strokeOpacity="0.5" />
            <path d="M8 14s2 2 4 2 4-2 4-2" />
          </>
        )}
        {variant === 'unicorn' && (
          <>
            <path d="M12 2l2 6-2 2-2-2 2-6z" fill={effectiveColor} fillOpacity="0.4" />
            <path d="M5 20c0-6 3-10 7-10s7 4 7 10" />
            <path d="M9 15h1m5 0h1" />
          </>
        )}
        {variant === 'rainbow-kitty' && (
          <>
            <path d="M4 12c0-4 3-7 8-7s8 3 8 7v6H4v-6z" />
            <path d="M6 7l-2-3m14 3l2-3" />
            <path d="M9 13h1m5 0h1m-5 3s1 1 2 1 2-1 2-1" />
          </>
        )}
        {variant === 'strawberry-bear' && (
          <>
            <path d="M12 4l-1 2m2-2l1 2" stroke="#10b981" />
            <circle cx="12" cy="13" r="8" fill={effectiveColor} fillOpacity="0.2" />
            <path d="M12 5c-4 0-7 3-7 8s3 8 7 8 7-3 7-8-3-8-7-8z" />
          </>
        )}
        {variant === 'coffee-fox' && (
          <>
            <path d="M8 8l4-4 4 4v8H8V8z" />
            <path d="M16 12h3a2 2 0 010 4h-3" />
            <path d="M10 11h1m3 0h1" />
          </>
        )}
        {variant === 'rockstar-bunny' && (
          <>
            <path d="M8 8V3l2 2 2-2 2 2 2-2v5" />
            <circle cx="12" cy="14" r="7" />
            <path d="M9 18l6-2" strokeWidth="2.5" />
          </>
        )}
        {variant === 'magic-panda' && (
          <>
            <path d="M12 2v4m0 0l-2-2m2 2l2-2" strokeOpacity="0.8" />
            <circle cx="12" cy="13" r="8" />
            <path d="M9 12a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" fill={effectiveColor} fillOpacity="0.4" />
          </>
        )}
      </g>
    </svg>
  );
}
