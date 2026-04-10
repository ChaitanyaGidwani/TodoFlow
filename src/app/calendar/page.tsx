"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO,
  startOfDay
} from "date-fns";
import { useTodos } from "@/hooks/use-todos";
import { useProfile } from "@/hooks/use-profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeddyIcon } from "@/components/TeddyIcons";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Circle,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { collection, serverTimestamp } from "firebase/firestore";
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase";

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  
  const { todos, loading } = useTodos();
  const { profile } = useProfile();
  const { user } = useUser();
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const todosByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    todos.forEach(t => {
      if (t.dueDate) {
        try {
          const dateKey = format(parseISO(t.dueDate), 'yyyy-MM-dd');
          if (!map[dateKey]) map[dateKey] = [];
          map[dateKey].push(t);
        } catch (e) {
          // Fallback for invalid dates
        }
      }
    });
    return map;
  }, [todos]);

  const handleAddTodo = useCallback(() => {
    if (!newTodoTitle.trim() || !selectedDay || !user || !db) return;
    
    const colRef = collection(db, "users", user.uid, "todos");
    const dateToSave = startOfDay(selectedDay).toISOString();
    
    addDocumentNonBlocking(colRef, {
      title: newTodoTitle,
      completed: false,
      userId: user.uid,
      createdAt: serverTimestamp(),
      dueDate: dateToSave,
      priority: 'medium',
      isDaily: false,
      streakDays: 0
    });
    
    setNewTodoTitle("");
    setSelectedDay(null);
  }, [newTodoTitle, selectedDay, user, db]);

  const handleDaySelect = (e: React.MouseEvent, day: Date) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDay(day);
  };

  const getDayStatus = useCallback((day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayTodos = todosByDate[dateKey] || [];
    
    if (dayTodos.length === 0) return 'empty';
    
    const allCompleted = dayTodos.length > 0 && dayTodos.every(t => t.completed);
    if (allCompleted) return 'completed';
    
    const hasStreak = dayTodos.some(t => t.isDaily && (t.streakDays || 0) > 0);
    if (hasStreak) return 'streak';
    
    return 'pending';
  }, [todosByDate]);

  if (!mounted || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className={cn(
      "max-w-5xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-700 pb-24", 
      profile?.pattern && `pattern-${profile.pattern}`
    )}>
      <header className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 glass-card rounded-[2.5rem] shadow-xl animate-teddy border-primary/30">
            <TeddyIcon variant="calendar" size={44} color={profile?.teddyColor} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-high-contrast">Teddy Timeline</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary" /> Visualizing your pawsitive flow! 🐻
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 p-4 glass-card rounded-2xl shadow-lg text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            <span>Streak</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            <span>Goal</span>
          </div>
        </div>

        <div className="flex items-center gap-2 glass-card p-2 rounded-2xl shadow-lg">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="hover:bg-primary/10 rounded-xl">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <span className="font-black px-6 min-w-[160px] text-center text-lg text-high-contrast">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="hover:bg-primary/10 rounded-xl">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <Card className="glass-card border-none overflow-hidden rounded-[2.5rem] shadow-2xl">
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/20 text-center py-5 font-black text-xs uppercase tracking-widest text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const status = getDayStatus(day);
            const isTodayDate = isSameDay(day, new Date());
            const isSelectedMonth = isSameMonth(day, currentMonth);

            return (
              <div 
                key={day.toString()}
                onClick={(e) => handleDaySelect(e, day)}
                className={cn(
                  "calendar-cell min-h-[120px] sm:min-h-[150px] p-3 border-r border-b border-white/10 group relative transition-all duration-300",
                  !isSelectedMonth && "opacity-20",
                  isTodayDate && "bg-primary/5",
                  status === 'completed' && "bg-emerald-500/5",
                  status === 'streak' && "bg-orange-500/5",
                  status === 'pending' && "bg-primary/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-black h-9 w-9 flex items-center justify-center rounded-2xl transition-all",
                    isTodayDate ? "gradient-btn scale-110 shadow-xl" : "text-foreground/60 bg-white/20 group-hover:bg-primary/20",
                    status === 'completed' && !isTodayDate && "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
                    status === 'streak' && !isTodayDate && "text-orange-600 bg-orange-100 dark:bg-orange-900/30"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Status Icons */}
                  <div className="transition-all transform group-hover:scale-125">
                    {status === 'completed' && <CheckCircle2 className="h-5 w-5 text-emerald-500 drop-shadow-lg" />}
                    {status === 'streak' && <Flame className="h-5 w-5 text-orange-500 drop-shadow-lg animate-pulse" />}
                    {status === 'pending' && <Circle className="h-4 w-4 text-primary/40" />}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(todosByDate[format(day, 'yyyy-MM-dd')] || []).slice(0, 3).map((t, i) => (
                    <div 
                      key={t.id} 
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        t.completed ? "bg-emerald-400" : "bg-primary/40"
                      )} 
                    />
                  ))}
                </div>

                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                  <div className="p-2 bg-primary/20 rounded-2xl border border-primary/30 shadow-inner">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                </div>

                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none blur-sm" />
              </div>
            );
          })}
        </div>
      </Card>

      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="glass-card border-none sm:max-w-md rounded-[2.5rem] fixed top-[20%] translate-y-0 z-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-2xl font-black text-high-contrast">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <TeddyIcon variant="calendar" size={32} color={profile?.teddyColor} />
              </div>
              {selectedDay && format(selectedDay, 'MMMM do')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-3 max-h-[350px] overflow-auto pr-2">
              {selectedDay && (todosByDate[format(selectedDay, 'yyyy-MM-dd')] || []).length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="bg-primary/5 p-6 rounded-full w-fit mx-auto animate-teddy">
                    <TeddyIcon variant="paw" size={56} className="opacity-30" color={profile?.teddyColor} />
                  </div>
                  <p className="text-muted-foreground font-black">No tasks planned! 🐻</p>
                </div>
              ) : (
                selectedDay && (todosByDate[format(selectedDay, 'yyyy-MM-dd')] || []).map(t => (
                  <div key={t.id} className="flex items-center gap-4 p-5 bg-white/40 dark:bg-black/20 rounded-[1.5rem] border border-white/20 dark:border-purple-500/10 shadow-sm hover:scale-[1.02] transition-transform">
                    <div className={cn(
                      "p-2 rounded-xl",
                      t.completed ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"
                    )}>
                      {t.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-primary/40" />
                      )}
                    </div>
                    <span className={cn(
                      "font-black text-base text-high-contrast", 
                      t.completed && "line-through opacity-50"
                    )}>
                      {t.title}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-3">
              <Input 
                placeholder="Add task for this day..." 
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                className="bg-white/40 dark:bg-black/30 border-white/20 dark:border-purple-500/20 h-14 rounded-2xl font-black px-6 shadow-inner focus-visible:ring-primary"
              />
              <Button onClick={handleAddTodo} className="gradient-btn h-14 px-8 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0">Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
