"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TeddyIcon } from "@/components/TeddyIcons";
import { useTheme } from "@/components/ThemeProvider";
import { 
  LogOut, 
  Settings, 
  User as UserIcon, 
  Sun, 
  Moon, 
  History,
  Shield,
  Palette
} from "lucide-react";

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted || isUserLoading) return null;
  if (!user) { router.push("/"); return null; }

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <TeddyIcon variant="profile" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground text-sm">Customize your Teddy experience.</p>
        </div>
      </header>

      <Card className="todo-card border-none overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/30 to-secondary/30" />
        <CardContent className="p-6 -mt-12">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-card border-4 border-background flex items-center justify-center shadow-xl">
              <TeddyIcon size={48} variant="profile" />
            </div>
            <h2 className="text-2xl font-bold mt-4">{user.email?.split('@')[0]}</h2>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="todo-card border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-medium">Dark Mode</span>
              <span className="text-xs text-muted-foreground">Toggle between Day and Night themes</span>
            </div>
            <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-xl">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </CardContent>
        </Card>

        <Card className="todo-card border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-secondary" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl hover:bg-white/10">
              <History className="h-5 w-5" /> Completion History
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl hover:bg-white/10">
              <Settings className="h-5 w-5" /> Settings
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start gap-3 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" /> Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
