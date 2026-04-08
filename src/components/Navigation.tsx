
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TeddyIcon } from "./TeddyIcons";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Flame, 
  User, 
  Sun, 
  Moon 
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: "Dash", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, teddy: "dashboard" },
    { label: "Todos", href: "/todos", icon: <CheckSquare className="h-5 w-5" />, teddy: "todos" },
    { label: "Streaks", href: "/streaks", icon: <Flame className="h-5 w-5" />, teddy: "streaks" },
    { label: "Me", href: "/profile", icon: <User className="h-5 w-5" />, teddy: "profile" },
  ];

  if (pathname === "/" || pathname === "/login") return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-20 bg-card/80 backdrop-blur-xl border-r border-white/20 z-50">
        <div className="flex-1 flex flex-col items-center py-8 gap-8">
          <div className="p-2 bg-primary/10 rounded-2xl animate-teddy">
            <TeddyIcon size={32} variant="paw" />
          </div>
          
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "nav-item group relative",
                  pathname === item.href && "nav-item-active"
                )}
              >
                <TeddyIcon variant={item.teddy as any} size={24} />
                <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.label}
                </span>
                {pathname === item.href && (
                  <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="pb-8 flex flex-col items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="rounded-full"
            suppressHydrationWarning
          >
            {mounted && (theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
          </Button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
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
            <TeddyIcon variant={item.teddy as any} size={22} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
