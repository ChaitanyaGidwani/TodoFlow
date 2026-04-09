'use client';

import React from 'react';
import { useProfile } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';

/**
 * A wrapper component that applies the user's selected pattern globally
 * to the entire page background.
 */
export function ThemePatternWrapper({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const patternClass = profile?.pattern ? `pattern-${profile.pattern}` : '';

  return (
    <div className={cn(
      "min-h-screen w-full transition-all duration-700 ease-in-out",
      patternClass
    )}>
      {children}
    </div>
  );
}