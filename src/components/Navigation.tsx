"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TeddyIcon } from "./TeddyIcons";
import { cn } from "@/lib/utils";
import { 
  Sun, 
  Moon,
  Loader2,
  Settings,
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Flame
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { useProfile } from "@/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { profile, loading: profileLoading } = useProfile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, variant: "dashboard" as const },
    { label: "Todos", href: "/todos", icon: CheckSquare, variant: "todos" as const },
    { label: "Calendar", href: "/calendar", icon: CalendarDays, variant: "calendar" as const },
    { label: "Streaks", href: "/streaks", icon: Flame, variant: "streaks" as const },
    { label: "Profile", href: "/profile", icon: Settings, variant: "profile" as const },
  ];

  if (pathname === "/" || pathname === "/login") return null;

  const teddyColor = profile?.teddyColor;

  return (
    <>
      {/* Global Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/10 dark:bg-black/40 backdrop-blur-xl border-b border-white/20 z-50 px-4 md:px-8">
        <div className="h-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="relative group">
              <Avatar className="h-10 w-10 border-2 border-purple-300 dark:border-purple-500 shadow-lg transition-transform group-hover:scale-105">
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback className="bg-primary/20">
                  <TeddyIcon size={24} variant={profile?.teddyVariant as any || 'magic-panda'} color={teddyColor} />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900" />
            </Link>
            <span className="font-black text-lg md:text-xl text-gradient truncate max-w-[150px] md:max-w-none">
              {profile?.displayName ? `${profile.displayName}'s TodoFlow` : 'TodoFlow'}
            </span>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="rounded-full bg-white/20 hover:bg-white/40 dark:bg-white/10 dark:hover:bg-white/20 text-foreground"
          >
            {mounted && (theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
          </Button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] w-20 bg-white/5 dark:bg-black/20 backdrop-blur-md border-r border-white/10 z-40 py-8 items-center gap-8">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "p-3 rounded-2xl transition-all duration-300 group relative",
              pathname === item.href 
                ? "bg-primary/20 text-primary scale-110" 
                : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
              {item.label}
            </span>
            {pathname === item.href && (
              <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full -ml-[1px]" />
            )}
          </Link>
        ))}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/20 dark:bg-zinc-950/80 backdrop-blur-2xl border-t border-white/10 z-50 flex items-center justify-around px-2">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-1 transition-all",
              pathname === item.href 
                ? "text-primary scale-110" 
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}