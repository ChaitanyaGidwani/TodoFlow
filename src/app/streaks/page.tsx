"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, orderBy, query } from "firebase/firestore";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeddyIcon } from "@/components/TeddyIcons";
import { Trophy, Zap, Calendar, Medal, Star, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  title: string;
  isDaily?: boolean;
  streakDays?: number;
}

export default function StreaksPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const todosQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "todos"), orderBy("streakDays", "desc"));
  }, [db, user]);

  const { data: todos } = useCollection<Todo>(todosQuery);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted || isUserLoading) return null;
  if (!user) { router.push("/"); return null; }

  const dailyTodos = todos?.filter(t => t.isDaily) || [];
  const maxStreak = Math.max(...dailyTodos.map(t => t.streakDays || 0), 0);

  const badges = [
    { name: "Bronze", days: 7, icon: <Medal className="h-6 w-6 text-amber-600" />, color: "bg-amber-100" },
    { name: "Silver", days: 30, icon: <Medal className="h-6 w-6 text-slate-400" />, color: "bg-slate-100" },
    { name: "Gold", days: 100, icon: <Star className="h-6 w-6 text-yellow-500" />, color: "bg-yellow-100" },
    { name: "Platinum", days: 365, icon: <ShieldCheck className="h-6 w-6 text-slate-300" />, color: "bg-slate-200" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <TeddyIcon variant="streaks" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Streak Sanctuary</h1>
          <p className="text-muted-foreground text-sm">Consistency is your superpower, Bear!</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="todo-card border-none bg-gradient-to-br from-primary/20 to-secondary/20">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-white/20 rounded-full mb-4">
              <Zap className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-4xl font-bold mb-1">{maxStreak} Days</h3>
            <p className="text-muted-foreground font-medium">Longest Streak</p>
          </CardContent>
        </Card>

        <Card className="todo-card border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Milestone Badges
            </CardTitle>
            <CardDescription>Keep going to unlock them all!</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {badges.map((badge) => {
              const unlocked = maxStreak >= badge.days;
              return (
                <div 
                  key={badge.name} 
                  className={cn(
                    "p-4 rounded-2xl flex flex-col items-center text-center transition-all",
                    unlocked ? badge.color + " scale-100" : "bg-muted grayscale opacity-40 scale-95"
                  )}
                >
                  {badge.icon}
                  <p className="text-xs font-bold mt-2">{badge.name}</p>
                  <p className="text-[10px] opacity-60">{badge.days} Days</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="todo-card border-none">
        <CardHeader>
          <CardTitle>Daily Habits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dailyTodos.length === 0 && (
            <p className="text-center py-10 text-muted-foreground italic">No daily habits tracked yet.</p>
          )}
          {dailyTodos.map((todo) => (
            <div key={todo.id} className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <TeddyIcon size={20} />
                </div>
                <span className="font-medium">{todo.title}</span>
              </div>
              <Badge variant="secondary" className="px-3 py-1 bg-primary/20 text-primary border-none">
                <Flame className="h-3 w-3 mr-1" /> {todo.streakDays || 0} Days
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
