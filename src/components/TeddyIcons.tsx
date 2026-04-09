
"use client";

import { cn } from "@/lib/utils";

interface TeddyIconProps {
  className?: string;
  size?: number;
  variant?: 'dashboard' | 'todos' | 'streaks' | 'profile' | 'paw' | 'calendar' | 'star' | 'moon' | 'flame' | 'gradient';
  color?: string;
}

export function TeddyIcon({ className, size = 24, variant = 'dashboard', color }: TeddyIconProps) {
  const gradientId = `teddy-grad-${variant}`;
  const effectiveColor1 = color || 'var(--teddy-color-1)';
  const effectiveColor2 = color || 'var(--teddy-color-2)';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("teddy-icon-svg transition-all", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={effectiveColor1} />
          <stop offset="100%" stopColor={effectiveColor2} />
        </linearGradient>
      </defs>

      {/* Base Teddy Head */}
      <g stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="7" />
        <circle cx="7" cy="7" r="2.5" />
        <circle cx="17" cy="7" r="2.5" />
        <circle cx="12" cy="14" r="1.2" fill={variant === 'paw' ? `url(#${gradientId})` : 'none'} />
      </g>
      
      {/* Feature Paths */}
      <g stroke={`url(#${gradientId})`} strokeWidth="1.2" strokeLinecap="round">
        {variant === 'dashboard' && (
          <path d="M9 11h2v4H9z M13 9h2v6h-2z" />
        )}
        {variant === 'todos' && (
          <path d="M9 11h6M9 14h4" />
        )}
        {variant === 'calendar' && (
          <path d="M8 9v2M16 9v2M8 13h8M8 16h5" />
        )}
        {variant === 'streaks' && (
          <path d="M12 9c0 1.5-1 2.5-1.5 3.5s-.5 1.5.5 2 1.5.5 2-1-.5-1.5-1-3z" fill={`url(#${gradientId})`} />
        )}
        {variant === 'flame' && (
          <path d="M12 7c-2 2-3 4-3 6a3 3 0 006 0c0-2-1-4-3-6z" fill={`url(#${gradientId})`} />
        )}
        {variant === 'star' && (
          <path d="M12 9l1 2h2l-1.5 1.5.5 2.5-2-1.5-2 1.5.5-2.5L10 11h2z" fill={`url(#${gradientId})`} />
        )}
        {variant === 'moon' && (
          <path d="M15 13a4 4 0 01-4-4 4 4 0 004 4z" fill={`url(#${gradientId})`} />
        )}
        {variant === 'profile' && (
          <>
            <circle cx="12" cy="13" r="2" />
            <path d="M12 10v1M12 15v1M10 13H9M15 13h-1" />
          </>
        )}
        {variant === 'paw' && (
          <>
            <circle cx="9" cy="9" r="1" fill="currentColor" opacity="0.5" />
            <circle cx="12" cy="8" r="1" fill="currentColor" opacity="0.5" />
            <circle cx="15" cy="9" r="1" fill="currentColor" opacity="0.5" />
          </>
        )}
      </g>
    </svg>
  );
}
