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
import { ChevronLeft, ChevronRight, Plus, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
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

  // Stable calculation of days in the grid
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Memoize todos grouped by date string to prevent O(n) lookup inside the cell loop
  const todosByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    todos.forEach(t => {
      if (t.dueDate) {
        const dateKey = format(parseISO(t.dueDate), 'yyyy-MM-dd');
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(t);
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

  if (!mounted || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className={cn(
      "max-w-5xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-700", 
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
              <Sparkles className="h-3 w-3 text-primary" /> Visualize your flow, day by day! 🐻
            </p>
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
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTodos = todosByDate[dateKey] || [];
            const completed = dayTodos.filter(t => t.completed);
            const status = {
              hasTasks: dayTodos.length > 0,
              allDone: dayTodos.length > 0 && completed.length === dayTodos.length,
              hasDaily: dayTodos.some(t => t.isDaily),
              hasBadge: dayTodos.some(t => t.streakDays && t.streakDays >= 7)
            };
            
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
                  status.hasTasks && "bg-gradient-to-br from-primary/5 to-transparent"
                )}
              >
                <span className={cn(
                  "text-sm font-black h-9 w-9 flex items-center justify-center rounded-2xl transition-all",
                  isTodayDate ? "gradient-btn scale-110 shadow-xl" : "text-foreground/60 bg-white/20 group-hover:bg-primary/20"
                )}>
                  {format(day, 'd')}
                </span>

                <div className="mt-4 flex flex-wrap gap-2">
                  {status.hasTasks && (
                    <div className="drop-shadow-lg transition-transform group-hover:scale-125">
                      <TeddyIcon variant="paw" size={22} color={profile?.teddyColor} />
                    </div>
                  )}
                  {status.allDone && (
                    <div className="transition-transform group-hover:scale-125">
                      <TeddyIcon variant="todos" size={22} color="#10b981" />
                    </div>
                  )}
                  {status.hasDaily && (
                    <div className="transition-transform group-hover:scale-125">
                      <TeddyIcon variant="flame" size={22} color="#f59e0b" />
                    </div>
                  )}
                  {status.hasBadge && (
                    <div className="transition-transform group-hover:scale-125">
                      <TeddyIcon variant="star" size={22} color="#8b5cf6" />
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                  <div className="p-2 bg-primary/20 rounded-2xl border border-primary/30 shadow-inner">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                </div>

                {/* Subtle Hover Glow */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Stable Dialog Overlay */}
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
                  <p className="text-muted-foreground font-black">No tasks planned for this day! 🐻</p>
                </div>
              ) : (
                selectedDay && (todosByDate[format(selectedDay, 'yyyy-MM-dd')] || []).map(t => (
                  <div key={t.id} className="flex items-center gap-4 p-5 bg-white/40 dark:bg-black/20 rounded-[1.5rem] border border-white/20 dark:border-purple-500/10 shadow-sm hover:scale-[1.02] transition-transform">
                    <div className={cn(
                      "p-2 rounded-xl",
                      t.completed ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"
                    )}>
                      {t.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <TeddyIcon variant="paw" size={20} color={profile?.teddyColor} />
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
                placeholder="Quick add task..." 
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                className="bg-white/40 dark:bg-black/30 border-white/20 dark:border-purple-500/20 h-14 rounded-2xl font-black px-6 shadow-inner focus-visible:ring-primary"
              />
              <Button onClick={handleAddTodo} className="gradient-btn h-14 px-8 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
