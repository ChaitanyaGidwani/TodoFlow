
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TeddyIcon } from "./TeddyIcons";
import { cn } from "@/lib/utils";
import { 
  Sun, 
  Moon,
  Loader2
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
    { label: "Dashboard", href: "/dashboard", variant: "dashboard" as const },
    { label: "Todos", href: "/todos", variant: "todos" as const },
    { label: "Calendar", href: "/calendar", variant: "calendar" as const },
    { label: "Streaks", href: "/streaks", variant: "streaks" as const },
    { label: "Profile", href: "/profile", variant: "profile" as const },
  ];

  if (pathname === "/" || pathname === "/login") return null;

  const teddyColor = profile?.teddyColor;

  return (
    <>
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-20 bg-card/80 backdrop-blur-xl border-r border-white/20 z-50">
        <div className="flex-1 flex flex-col items-center py-8 gap-10">
          <Link href="/dashboard" className="p-2 bg-primary/10 rounded-2xl animate-teddy">
            <TeddyIcon size={32} variant="paw" color={teddyColor} />
          </Link>
          
          <div className="flex flex-col gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "nav-item group relative",
                  pathname === item.href && "nav-item-active"
                )}
              >
                <TeddyIcon variant={item.variant} size={28} color={teddyColor} />
                <span className="text-[10px] font-bold mt-1 scale-0 group-hover:scale-100 transition-transform">
                  {item.label}
                </span>
                {pathname === item.href && (
                  <div className="absolute left-[-8px] w-1.5 h-8 bg-primary rounded-r-full" />
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="pb-8 flex flex-col items-center gap-4">
          <Link href="/profile">
            <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary transition-all">
              <AvatarImage src={profile?.avatarUrl} />
              <AvatarFallback className="bg-primary/10">
                <TeddyIcon size={20} variant="profile" color={teddyColor} />
              </AvatarFallback>
            </Avatar>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="rounded-full"
          >
            {mounted && (theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
          </Button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-2xl border-t border-white/20 z-50 flex items-center justify-around px-2">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={cn(
              "nav-item flex-1",
              pathname === item.href && "nav-item-active"
            )}
          >
            <TeddyIcon variant={item.variant} size={24} color={teddyColor} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
