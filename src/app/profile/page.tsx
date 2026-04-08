"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, query, where, orderBy } from "firebase/firestore";
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TeddyIcon } from "@/components/TeddyIcons";
import { useTheme } from "@/components/ThemeProvider";
import { 
  LogOut, 
  Sun, 
  Moon, 
  History,
  Shield,
  Palette,
  Download,
  Search,
  Calendar,
  Trophy,
  ArrowRight,
  Loader2
} from "lucide-react";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: any;
  lastCompletedDate?: any;
  streakDays?: number;
}

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  const historyQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // Strictly path-based subcollection query
    return query(
      collection(db, "users", user.uid, "todos"),
      where("completed", "==", true),
      orderBy("lastCompletedDate", "desc")
    );
  }, [db, user]);

  const { data: history, isLoading } = useCollection<Todo>(historyQuery);

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    return history.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!startDate && !endDate) return matchesSearch;
      
      const itemDate = item.lastCompletedDate?.toDate ? item.lastCompletedDate.toDate() : new Date();
      const start = startDate ? startOfDay(parseISO(startDate)) : new Date(0);
      const end = endDate ? endOfDay(parseISO(endDate)) : new Date();
      
      return matchesSearch && isWithinInterval(itemDate, { start, end });
    });
  }, [history, searchTerm, startDate, endDate]);

  const stats = useMemo(() => {
    if (!history) return { total: 0, avgStreak: 0, maxStreak: 0 };
    const total = history.length;
    const totalStreak = history.reduce((acc, curr) => acc + (curr.streakDays || 0), 0);
    const maxStreak = Math.max(...history.map(h => h.streakDays || 0), 0);
    return {
      total,
      avgStreak: total > 0 ? (totalStreak / total).toFixed(1) : 0,
      maxStreak
    };
  }, [history]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/");
  };

  const exportCSV = () => {
    if (!filteredHistory.length) return;
    const headers = ["Task", "Date Completed", "Streak Earned"];
    const rows = filteredHistory.map(item => [
      `"${item.title}"`,
      format(item.lastCompletedDate?.toDate ? item.lastCompletedDate.toDate() : new Date(), "yyyy-MM-dd"),
      item.streakDays || 0
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `todoflow_log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) { 
    router.push("/"); 
    return null; 
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <TeddyIcon variant="profile" size={36} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hi, {user.email?.split('@')[0]} 🐻</h1>
            <p className="text-muted-foreground text-sm">Your productivity archive.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="todo-card border-none bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Bear Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/40 rounded-xl text-center">
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Done</p>
              </div>
              <div className="p-3 bg-white/40 rounded-xl text-center">
                <p className="text-2xl font-bold text-secondary">{stats.avgStreak}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Avg Streak</p>
              </div>
            </CardContent>
          </Card>

          <Card className="todo-card border-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" /> Display
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="font-medium text-sm">Dark Mode</span>
              <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-xl">
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="todo-card border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <History className="h-6 w-6 text-primary" /> Completion History
              </CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search past tasks..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white/10 border-white/10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white/10 border-white/10 text-xs h-10"
                  />
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white/10 border-white/10 text-xs h-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {isLoading && (
                    <div className="flex justify-center py-20">
                      <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                    </div>
                  )}
                  {!isLoading && filteredHistory.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-primary/20 rounded-3xl">
                      <p className="text-muted-foreground italic">No history matches these filters.</p>
                    </div>
                  )}
                  {filteredHistory.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-between group hover:bg-white/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <History className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(item.lastCompletedDate?.toDate ? item.lastCompletedDate.toDate() : new Date(), "PPP")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                        Streak +{item.streakDays || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}