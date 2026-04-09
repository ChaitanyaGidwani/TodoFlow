
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
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
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

  return (
    <div className={cn("max-w-5xl mx-auto p-4 sm:p-8 space-y-8", profile?.pattern && `pattern-${profile.pattern}`)}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <TeddyIcon variant="calendar" size={32} color={profile?.teddyColor} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teddy Timeline</h1>
            <p className="text-muted-foreground text-sm">Visualize your flow, day by day! 🐻</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/50 backdrop-blur p-1 rounded-xl border border-white/20">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-bold px-4 min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <Card className="todo-card border-none shadow-2xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/20 backdrop-blur text-center py-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">
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
                      "min-h-[100px] sm:min-h-[120px] p-2 border-r border-b border-white/10 relative cursor-pointer hover:bg-white/40 transition-all group",
                      !isSelectedMonth && "opacity-30",
                      isTodayDate && "bg-primary/5"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full transition-all",
                      isTodayDate && "bg-primary text-white scale-110 shadow-lg"
                    )}>
                      {format(day, 'd')}
                    </span>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {status.hasTasks && (
                        <div className="animate-in zoom-in-50 duration-300">
                          <TeddyIcon variant="paw" size={16} color={profile?.teddyColor} />
                        </div>
                      )}
                      {status.allDone && (
                        <div className="animate-in zoom-in-50 duration-300">
                          <TeddyIcon variant="todos" size={16} color="#10b981" />
                        </div>
                      )}
                      {status.hasDaily && (
                        <div className="animate-in zoom-in-50 duration-300">
                          <TeddyIcon variant="flame" size={16} color="#f59e0b" />
                        </div>
                      )}
                      {status.hasBadge && (
                        <div className="animate-in zoom-in-50 duration-300">
                          <TeddyIcon variant="star" size={16} color="#8b5cf6" />
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-1 bg-primary/20 rounded-full">
                        <Plus className="h-3 w-3 text-primary" />
                      </div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="todo-card border-none sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <TeddyIcon variant="calendar" size={24} color={profile?.teddyColor} />
                      Tasks for {format(day, 'MMMM do')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      {getDayTodos(day).length === 0 ? (
                        <p className="text-center text-muted-foreground italic py-4">No tasks planned for this day 🐻</p>
                      ) : (
                        getDayTodos(day).map(t => (
                          <div key={t.id} className="flex items-center gap-2 p-3 bg-white/40 rounded-xl border border-white/20">
                            <TeddyIcon variant={t.completed ? "todos" : "paw"} size={16} color={t.completed ? "#10b981" : profile?.teddyColor} />
                            <span className={cn(t.completed && "line-through opacity-50")}>{t.title}</span>
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
                        className="bg-white/50 border-white/20"
                      />
                      <Button onClick={handleAddTodo} className="gradient-btn">Add</Button>
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
