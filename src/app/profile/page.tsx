"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { useProfile, UserProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeddyIcon } from "@/components/TeddyIcons";
import { useTheme } from "@/components/ThemeProvider";
import { useTodos } from "@/hooks/use-todos";
import { 
  LogOut, 
  Sun, 
  Moon, 
  Palette,
  Trophy,
  Loader2,
  Camera,
  Layout,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";

const TEDDY_VARIANTS = [
  'dashboard', 'todos', 'calendar', 'streaks', 'profile', 
  'flame', 'star', 'moon', 'paw', 'gradient'
];

const PATTERNS = [
  { id: 'none', label: 'Solid' },
  { id: 'paws', label: 'Paw Prints' },
  { id: 'dots', label: 'Polka Dots' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'stars', label: 'Magic Stars' }
];

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { todos } = useTodos();

  useEffect(() => { setMounted(true); }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `users/${user.uid}/avatar/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateProfile({ avatarUrl: url });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const stats = {
    total: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
    avgStreak: todos.length > 0 ? (todos.reduce((acc, curr) => acc + (curr.streakDays || 0), 0) / todos.length).toFixed(1) : 0
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
      "max-w-5xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-700 min-h-screen", 
      profile?.pattern && `pattern-${profile.pattern}`
    )}>
      <header className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="h-28 w-28 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white/40 backdrop-blur">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10">
                  <TeddyIcon size={56} variant="profile" color={profile?.teddyColor} />
                </div>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform border border-primary/20">
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4 text-primary" />}
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-primary">Hi, {profile?.displayName || 'Bear'}! ✨</h1>
            <p className="text-muted-foreground font-medium">Customize your perfect productivity space.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-2xl h-12 w-12 bg-white/50">
            {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={async () => { await signOut(auth!); router.push("/"); }} className="text-destructive h-12 w-12 rounded-2xl bg-white/50 border border-white/20">
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="todo-card border-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Bear Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <span className="text-sm font-bold text-muted-foreground uppercase">Tasks Done</span>
                <span className="text-2xl font-black text-primary">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/5 rounded-2xl border border-secondary/10">
                <span className="text-sm font-bold text-muted-foreground uppercase">Avg Streak</span>
                <span className="text-2xl font-black text-secondary">{stats.avgStreak}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="todo-card border-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" /> Signature Color
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={profile?.teddyColor || '#8b5cf6'} 
                  onChange={(e) => updateProfile({ teddyColor: e.target.value })}
                  className="h-12 w-full rounded-xl border-none cursor-pointer bg-white/40 p-1"
                />
                <Button variant="outline" className="rounded-xl h-12" onClick={() => updateProfile({ teddyColor: '#8b5cf6' })}>Reset</Button>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center font-bold">This updates all teddy icons!</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="todo-card border-none">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Layout className="h-6 w-6 text-primary" /> Personalized Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Display Name</h3>
                <Input 
                  value={profile?.displayName || ''} 
                  onChange={(e) => updateProfile({ displayName: e.target.value })}
                  placeholder="What's your bear name?"
                  className="h-12 rounded-2xl bg-white/40 border-primary/10"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Teddy Avatar Variant</h3>
                <div className="grid grid-cols-5 gap-3">
                  {TEDDY_VARIANTS.map(v => (
                    <button
                      key={v}
                      onClick={() => updateProfile({ teddyVariant: v })}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all hover:scale-105 flex items-center justify-center",
                        profile?.teddyVariant === v ? "border-primary bg-primary/10" : "border-white/20 bg-white/30"
                      )}
                    >
                      <TeddyIcon variant={v as any} size={32} color={profile?.teddyColor} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Background Pattern</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {PATTERNS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => updateProfile({ pattern: p.id as any })}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all text-sm font-bold uppercase tracking-tighter",
                        profile?.pattern === p.id ? "border-primary bg-primary/10" : "border-white/20 bg-white/30"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
