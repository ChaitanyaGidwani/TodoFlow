"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth, useUser } from "@/firebase";
import { useProfile, UserProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { TeddyIcon, IconVariant } from "@/components/TeddyIcons";
import { useTheme } from "@/components/ThemeProvider";
import { useTodos } from "@/hooks/use-todos";
import { Input } from "@/components/ui/input";
import { 
  LogOut, 
  Sun, 
  Moon, 
  Loader2, 
  Sparkles,
  Palette,
  Layout,
  Crown,
  MousePointer2,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_GALLERY: IconVariant[] = [
  'cat-glasses', 'polar-bear', 'fox-smile', 'bunny-crown', 'panda-bamboo', 'frog-hat',
  'unicorn', 'rainbow-kitty', 'strawberry-bear', 'coffee-fox', 'rockstar-bunny', 'magic-panda'
];

const PATTERNS = [
  { id: 'none', label: 'Solid', icon: '✨' },
  { id: 'paws', label: 'Paws', icon: '🐾' },
  { id: 'dots', label: 'Dots', icon: '⦿' },
  { id: 'stripes', label: 'Stripes', icon: '//' },
  { id: 'stars', label: 'Magic', icon: '⭐' },
  { id: 'waves', label: 'Waves', icon: '⌇' },
  { id: 'hexagons', label: 'Hex', icon: '⬢' }
];

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { theme } = useTheme();
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

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center gap-8 py-8 animate-in fade-in duration-700">
      <div className="w-full max-w-lg space-y-8">
        {/* Profile Card */}
        <div className="todo-card p-8 flex flex-col items-center gap-6 text-center border-white/20 dark:border-purple-500/30">
          <div className="relative group">
            <div className="p-8 bg-white/5 rounded-full border-4 border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)] group-hover:scale-105 transition-transform duration-500">
              <TeddyIcon variant={profile?.teddyVariant as any || 'magic-panda'} size={100} color={profile?.teddyColor} />
            </div>
            <div className="absolute -top-4 -right-4 neon-badge">
              <Crown className="h-4 w-4 mr-2" /> Level {Math.floor(stats.total / 10) + 1}
            </div>
          </div>
          
          <div className="w-full space-y-4">
            <div>
              <h1 className="text-3xl font-black text-gradient">Hi, {profile?.displayName || 'Todoist'}! ✨</h1>
              <p className="text-muted-foreground font-bold text-xs mt-1 uppercase tracking-widest flex items-center justify-center gap-2">
                <Sparkles className="h-3 w-3" /> Master of Flow
              </p>
            </div>
            
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">
                <User className="h-3 w-3" /> Your Display Name
              </label>
              <Input 
                value={profile?.displayName || ''} 
                onChange={(e) => updateProfile({ displayName: e.target.value })}
                placeholder="How should we call you?"
                className="bg-white/10 border-white/10 h-12 rounded-2xl font-bold text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-white/5 dark:bg-black/20 rounded-2xl p-4 border border-white/10 dark:border-purple-500/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Achievements</p>
              <p className="text-2xl font-black text-foreground">{stats.total}</p>
            </div>
            <div className="bg-white/5 dark:bg-black/20 rounded-2xl p-4 border border-white/10 dark:border-purple-500/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Best Streak</p>
              <p className="text-2xl font-black text-foreground">{stats.streak}d</p>
            </div>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="todo-card p-8 space-y-8 border-white/20 dark:border-purple-500/30">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
              <MousePointer2 className="h-3 w-3" /> Pick Your Avatar
            </h3>
            <div className="icon-gallery flex overflow-x-auto pb-4 gap-4 snap-x">
              {ICON_GALLERY.map(v => (
                <button
                  key={v}
                  onClick={() => updateProfile({ teddyVariant: v })}
                  className={cn(
                    "shrink-0 p-5 rounded-3xl border-2 transition-all duration-300 snap-center",
                    profile?.teddyVariant === v 
                      ? "border-primary bg-primary/20 scale-110 shadow-lg shadow-primary/40 dark:shadow-purple-500/30" 
                      : "border-white/5 bg-white/5 hover:bg-white/10 dark:hover:bg-purple-500/10"
                  )}
                >
                  <TeddyIcon variant={v} size={48} color={profile?.teddyColor} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Signature Color</h3>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={profile?.teddyColor || '#a855f7'} 
                  onChange={(e) => updateProfile({ teddyColor: e.target.value })}
                  className="w-16 h-16 rounded-3xl border-4 border-white dark:border-purple-900/50 shadow-xl cursor-pointer bg-transparent overflow-hidden transition-transform hover:scale-110"
                />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Pick your vibe</p>
                  <p className="text-[10px] text-muted-foreground">Syncs globally!</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Background Pattern</h3>
              <div className="grid grid-cols-2 gap-2">
                {PATTERNS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => updateProfile({ pattern: p.id as UserProfile['pattern'] })}
                    className={cn(
                      "py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-tight transition-all duration-300 flex items-center justify-center gap-2",
                      profile?.pattern === p.id 
                        ? "border-primary bg-primary/20 text-foreground" 
                        : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 dark:hover:bg-purple-500/10"
                    )}
                  >
                    <span className="text-xs opacity-60">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 dark:border-purple-500/20">
            <Button 
              variant="destructive" 
              className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all hover:brightness-110"
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