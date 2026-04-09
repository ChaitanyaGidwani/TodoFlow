"use client";

import { useState, useMemo } from "react";
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
  parseISO
} from "date-fns";
import { useTodos } from "@/hooks/use-todos";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeddyIcon } from "@/components/TeddyIcons";
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { collection, serverTimestamp } from "firebase/firestore";
import { useFirestore, useUser, addDocumentNonBlocking } from "@/firebase";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  
  const { todos, loading } = useTodos();
  const { profile } = useProfile();
  const { user } = useUser();
  const db = useFirestore();

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayTodos = (day: Date) => {
    return todos.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), day));
  };

  const getDayStatus = (day: Date) => {
    const dayTodos = getDayTodos(day);
    const completed = dayTodos.filter(t => t.completed);
    const hasDaily = dayTodos.some(t => t.isDaily);
    const hasBadge = dayTodos.some(t => t.streakDays && t.streakDays >= 7);
    
    return {
      hasTasks: dayTodos.length > 0,
      allDone: dayTodos.length > 0 && completed.length === dayTodos.length,
      hasDaily,
      hasBadge
    };
  };

  const handleAddTodo = () => {
    if (!newTodoTitle.trim() || !selectedDay || !user || !db) return;
    
    const colRef = collection(db, "users", user.uid, "todos");
    addDocumentNonBlocking(colRef, {
      title: newTodoTitle,
      completed: false,
      userId: user.uid,
      createdAt: serverTimestamp(),
      dueDate: selectedDay.toISOString(),
      priority: 'medium',
      isDaily: false,
      streakDays: 0
    });
    
    setNewTodoTitle("");
    setSelectedDay(null);
  };

  if (loading) return (
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
          <div className="p-4 bg-primary/10 rounded-3xl shadow-lg animate-teddy">
            <TeddyIcon variant="calendar" size={40} color={profile?.teddyColor} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-primary">Teddy Timeline</h1>
            <p className="text-muted-foreground font-medium">Visualize your flow, day by day! 🐻</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/40 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-xl">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="hover:bg-primary/10 rounded-xl">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <span className="font-black px-6 min-w-[160px] text-center text-lg">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="hover:bg-primary/10 rounded-xl">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <Card className="todo-card border-none shadow-2xl overflow-hidden rounded-[2rem]">
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/30 backdrop-blur-xl text-center py-5 font-black text-xs uppercase tracking-widest text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const status = getDayStatus(day);
            const isTodayDate = isSameDay(day, new Date());
            const isSelectedMonth = isSameMonth(day, currentMonth);

            return (
              <Dialog key={day.toString()} open={selectedDay ? isSameDay(selectedDay, day) : false} onOpenChange={(open) => open ? setSelectedDay(day) : setSelectedDay(null)}>
                <DialogTrigger asChild>
                  <div 
                    className={cn(
                      "min-h-[110px] sm:min-h-[140px] p-3 border-r border-b border-white/10 relative cursor-pointer hover:bg-white/50 transition-all group",
                      !isSelectedMonth && "opacity-20",
                      isTodayDate && "bg-primary/5"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-black h-8 w-8 flex items-center justify-center rounded-xl transition-all",
                      isTodayDate ? "bg-primary text-white scale-110 shadow-xl" : "text-foreground/60"
                    )}>
                      {format(day, 'd')}
                    </span>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {status.hasTasks && (
                        <div className="animate-in zoom-in duration-300">
                          <TeddyIcon variant="paw" size={18} color={profile?.teddyColor} />
                        </div>
                      )}
                      {status.allDone && (
                        <div className="animate-in zoom-in duration-300">
                          <TeddyIcon variant="todos" size={18} color="#10b981" />
                        </div>
                      )}
                      {status.hasDaily && (
                        <div className="animate-in zoom-in duration-300">
                          <TeddyIcon variant="flame" size={18} color="#f59e0b" />
                        </div>
                      )}
                      {status.hasBadge && (
                        <div className="animate-in zoom-in duration-300">
                          <TeddyIcon variant="star" size={18} color="#8b5cf6" />
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-1.5 bg-primary/20 rounded-xl">
                        <Plus className="h-3 w-3 text-primary" />
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="todo-card border-none sm:max-w-md rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl font-black">
                      <TeddyIcon variant="calendar" size={28} color={profile?.teddyColor} />
                      {format(day, 'MMMM do')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="space-y-3 max-h-[300px] overflow-auto pr-2">
                      {getDayTodos(day).length === 0 ? (
                        <div className="text-center py-8 space-y-2">
                          <TeddyIcon variant="paw" size={48} className="mx-auto opacity-20" color={profile?.teddyColor} />
                          <p className="text-muted-foreground font-bold">No tasks planned for this day! 🐻</p>
                        </div>
                      ) : (
                        getDayTodos(day).map(t => (
                          <div key={t.id} className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-white/20 shadow-sm">
                            <TeddyIcon variant={t.completed ? "todos" : "paw"} size={20} color={t.completed ? "#10b981" : profile?.teddyColor} />
                            <span className={cn("font-bold text-sm", t.completed && "line-through opacity-50")}>{t.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Quick add task..." 
                        value={newTodoTitle}
                        onChange={(e) => setNewTodoTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                        className="bg-white/60 border-white/20 h-12 rounded-2xl font-bold"
                      />
                      <Button onClick={handleAddTodo} className="gradient-btn h-12 px-6 rounded-2xl font-black">Add</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
