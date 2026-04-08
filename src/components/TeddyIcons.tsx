"use client";

import { cn } from "@/lib/utils";

interface TeddyIconProps {
  className?: string;
  size?: number;
  variant?: 'dashboard' | 'todos' | 'streaks' | 'profile' | 'paw';
}

export function TeddyIcon({ className, size = 24, variant = 'dashboard' }: TeddyIconProps) {
  const color = "var(--teddy-color)";

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn("transition-colors", className)}
    >
      {/* Base Teddy Head */}
      <circle cx="12" cy="13" r="7" stroke={color} fill={variant === 'paw' ? color : 'none'} />
      <circle cx="7" cy="7" r="2.5" stroke={color} />
      <circle cx="17" cy="7" r="2.5" stroke={color} />
      <circle cx="12" cy="14" r="1.5" stroke={color} /> {/* Nose */}
      
      {/* Variant Overlays */}
      {variant === 'dashboard' && (
        <path d="M10 10h4v2h-4v-2zM8 12h8v2H8v-2z" stroke={color} strokeWidth="1.5" />
      )}
      {variant === 'todos' && (
        <path d="M9 10h6M9 13h6" stroke={color} strokeWidth="1.5" />
      )}
      {variant === 'streaks' && (
        <path d="M12 8c0 2-1 3-2 4s-1 2 0 3 2 1 3 0 1-2 0-3-1-2-1-4z" stroke={color} fill={color} />
      )}
      {variant === 'profile' && (
        <path d="M9 18a3 3 0 0 1 6 0" stroke={color} />
      )}
      {variant === 'paw' && (
        <>
          <circle cx="12" cy="13" r="4" fill="white" />
          <circle cx="8" cy="8" r="1.5" fill="white" />
          <circle cx="12" cy="7" r="1.5" fill="white" />
          <circle cx="16" cy="8" r="1.5" fill="white" />
        </>
      )}
    </svg>
  );
}
