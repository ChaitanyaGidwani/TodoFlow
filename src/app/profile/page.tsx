"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth, useUser } from "@/firebase";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { TeddyIcon, IconVariant } from "@/components/TeddyIcons";
import { useTheme } from "@/components/ThemeProvider";
import { useTodos } from "@/hooks/use-todos";
import { 
  LogOut, 
  Sun, 
  Moon, 
  Loader2, 
  Sparkles,
  Palette,
  Layout,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_GALLERY: IconVariant[] = [
  'cat-glasses', 'polar-bear', 'fox-smile', 'bunny-crown', 'panda-bamboo', 'frog-hat',
  'unicorn', 'rainbow-kitty', 'strawberry-bear', 'coffee-fox', 'rockstar-bunny', 'magic-panda'
];

const PATTERNS = [
  { id: 'none', label: 'Solid' },
  { id: 'paws', label: 'Paws' },
  { id: 'dots', label: 'Dots' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'stars', label: 'Magic' }
];

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { todos } = useTodos();

  useEffect(() => { setMounted(true); }, []);

  const stats = {
    total: todos.filter(t => t.completed).length,
    streak: Math.max(...todos.map(t => t.streakDays || 0), 0)
  };

  if (!mounted || isUserLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-[calc(100vh-8rem)] flex flex-col items-center gap-8 py-8 animate-in fade-in duration-700",
      profile?.pattern && `pattern-${profile.pattern}`
    )}>
      <div className="w-full max-w-lg space-y-8">
        {/* Profile Card */}
        <div className="todo-card p-8 flex flex-col items-center gap-6 text-center">
          <div className="relative group">
            <div className="p-8 bg-white/5 rounded-full border-4 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)] group-hover:scale-105 transition-transform">
              <TeddyIcon variant={profile?.teddyVariant as any || 'magic-panda'} size={100} color={profile?.teddyColor} />
            </div>
            <div className="absolute -top-4 -right-4 neon-badge">
              <Crown className="h-4 w-4 mr-2" /> Level {Math.floor(stats.total / 10) + 1}
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-black text-gradient">Hi, {profile?.displayName || 'Todoist'}! ✨</h1>
            <p className="text-muted-foreground font-bold text-sm mt-1 uppercase tracking-widest">Productivity Master</p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Achievements</p>
              <p className="text-2xl font-black">{stats.total}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Best Streak</p>
              <p className="text-2xl font-black">{stats.streak}d</p>
            </div>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="todo-card p-8 space-y-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Avatar Gallery
            </h3>
            <div className="icon-gallery flex overflow-x-auto pb-4 gap-4 snap-x">
              {ICON_GALLERY.map(v => (
                <button
                  key={v}
                  onClick={() => updateProfile({ teddyVariant: v })}
                  className={cn(
                    "shrink-0 p-5 rounded-3xl border-2 transition-all snap-center",
                    profile?.teddyVariant === v 
                      ? "border-primary bg-primary/20 scale-110 shadow-lg shadow-primary/20" 
                      : "border-white/5 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <TeddyIcon variant={v} size={48} color={profile?.teddyColor} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary">Signature Color</h3>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={profile?.teddyColor || '#a855f7'} 
                  onChange={(e) => updateProfile({ teddyColor: e.target.value })}
                  className="w-16 h-16 rounded-3xl border-4 border-white dark:border-zinc-800 shadow-xl cursor-pointer bg-transparent overflow-hidden"
                />
                <div className="space-y-1">
                  <p className="text-xs font-bold">Pick your vibe</p>
                  <p className="text-[10px] text-muted-foreground">This color will sync everywhere!</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary">Background Pattern</h3>
              <div className="grid grid-cols-2 gap-2">
                {PATTERNS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => updateProfile({ pattern: p.id as any })}
                    className={cn(
                      "py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-tight transition-all",
                      profile?.pattern === p.id 
                        ? "border-primary bg-primary/20" 
                        : "border-white/5 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
            <Button 
              variant="destructive" 
              className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-xl"
              onClick={() => signOut(auth!)}
            >
              <LogOut className="h-5 w-5 mr-2" /> Logout Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}