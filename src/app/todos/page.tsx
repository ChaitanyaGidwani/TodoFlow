"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  collection, 
  doc, 
  serverTimestamp
} from "firebase/firestore";
import { 
  useFirestore, 
  useUser, 
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from "@/firebase";
import { useTodos } from "@/hooks/use-todos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Circle,
  Wand2,
  Calendar,
  Search,
  Sparkles
} from "lucide-react";
import { TeddyIcon } from "@/components/TeddyIcons";
import { aiTaskBreakdown } from "@/ai/flows/ai-task-breakdown";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-700",
};

export default function TodosPage() {
  const [mounted, setMounted] = useState(false);
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isDaily, setIsDaily] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const { todos, loading: isLoading } = useTodos();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) { 
    router.push("/"); 
    return null; 
  }

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !user || !db) return;

    setAdding(true);
    const colRef = collection(db, "users", user.uid, "todos");
    
    addDocumentNonBlocking(colRef, {
      title: newTodo,
      completed: false,
      userId: user.uid,
      createdAt: serverTimestamp(),
      priority,
      isDaily,
      dueDate: dueDate || null,
      streakDays: 0
    });
    
    setNewTodo("");
    setDueDate("");
    setAdding(false);
  };

  const toggleTodo = (todo: any) => {
    if (!db || !user) return;
    const docRef = doc(db, "users", user.uid, "todos", todo.id);
    updateDocumentNonBlocking(docRef, { completed: !todo.completed });
  };

  const filteredTodos = todos?.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "daily" && t.isDaily) || (filter === "completed" && t.completed) || (filter === "pending" && !t.completed);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/20 rounded-[2rem] shadow-xl animate-teddy">
            <TeddyIcon variant="todos" size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-high-contrast">Focus Central</h1>
            <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary" /> Pawsitive productivity starts here!
            </p>
          </div>
        </div>
      </header>

      <Card className="todo-card border-none group shadow-2xl">
        <CardContent className="p-8">
          <form onSubmit={handleAddTodo} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input 
                placeholder="What's the goal for today?" 
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                className="h-14 border-none bg-white/40 dark:bg-black/20 focus-visible:ring-primary text-lg px-6 font-bold rounded-2xl"
                disabled={adding}
              />
              <Button type="submit" className="h-14 px-10 gradient-btn shadow-2xl" disabled={adding}>
                {adding ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6 mr-2" />}
                Add Task
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="w-[140px] h-11 bg-white/40 dark:bg-black/20 border-white/30 dark:border-purple-500/30 font-black rounded-xl">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="glass-card">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3 bg-white/40 dark:bg-black/20 px-4 py-2.5 rounded-xl border border-white/30 dark:border-purple-500/30">
                <Checkbox id="daily" checked={isDaily} onCheckedChange={(v: any) => setIsDaily(v)} className="w-5 h-5 rounded-md" />
                <label htmlFor="daily" className="text-sm font-black cursor-pointer text-high-contrast">Daily Habit</label>
              </div>
              <div className="flex items-center gap-3 bg-white/40 dark:bg-black/20 px-4 py-2.5 rounded-xl border border-white/30 dark:border-purple-500/30 flex-1 md:flex-none">
                <Calendar className="h-4 w-4 text-primary" />
                <Input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-6 border-none bg-transparent p-0 w-[130px] font-bold text-sm"
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 bg-white/40 dark:bg-black/20 border-white/30 dark:border-purple-500/30 rounded-2xl font-bold"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px] h-12 bg-white/40 dark:bg-black/20 border-white/30 dark:border-purple-500/30 rounded-2xl font-black">
            <SelectValue placeholder="All Tasks" />
          </SelectTrigger>
          <SelectContent className="glass-card">
            <SelectItem value="all">Everything</SelectItem>
            <SelectItem value="pending">Waiting</SelectItem>
            <SelectItem value="completed">Done</SelectItem>
            <SelectItem value="daily">Daily Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[650px] pr-4">
        <div className="space-y-4">
          {isLoading && (
            <div className="flex justify-center py-32">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          {!isLoading && filteredTodos?.length === 0 && (
            <div className="text-center py-32 bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-[3rem] border-4 border-dashed border-white/30 dark:border-purple-500/20">
              <TeddyIcon variant="todos" size={80} className="mx-auto opacity-20 mb-6" />
              <p className="text-muted-foreground font-black text-lg">No tasks found. Time to add some goals?</p>
            </div>
          )}
          {filteredTodos?.map((todo) => (
            <Card 
              key={todo.id} 
              className={cn(
                "todo-card transition-all duration-300 group hover:translate-x-2 border-l-[6px] shadow-xl",
                todo.completed ? "border-l-green-500 opacity-60" : 
                todo.priority === 'high' ? "border-l-rose-500" :
                todo.priority === 'medium' ? "border-l-amber-500" : "border-l-blue-500"
              )}
            >
              <CardContent className="p-6 flex items-center gap-6">
                <button 
                  onClick={() => toggleTodo(todo)}
                  className={cn(
                    "shrink-0 transition-all transform hover:scale-125",
                    todo.completed ? "text-green-500" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {todo.completed ? <CheckCircle2 className="h-9 w-9" /> : <Circle className="h-9 w-9" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-3">
                    <span className={cn(
                      "text-xl font-black truncate text-high-contrast",
                      todo.completed && "line-through opacity-50"
                    )}>
                      {todo.title}
                    </span>
                    {todo.priority && (
                      <Badge className={cn("text-[10px] h-6 uppercase font-black px-3 rounded-lg border-2", PRIORITY_COLORS[todo.priority as keyof typeof PRIORITY_COLORS])}>
                        {todo.priority}
                      </Badge>
                    )}
                  </div>
                  {todo.dueDate && (
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground mt-2">
                      <Calendar className="h-3.5 w-3.5" /> Due: {format(parseISO(todo.dueDate), 'MMM d')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={async () => {
                      setBreakingDownId(todo.id);
                      try {
                        const subtasks = await aiTaskBreakdown(todo.title);
                        const docRef = doc(db!, "users", user!.uid, "todos", todo.id);
                        updateDocumentNonBlocking(docRef, { subtasks });
                      } finally {
                        setBreakingDownId(null);
                      }
                    }}
                    disabled={breakingDownId === todo.id || todo.completed}
                    className="w-12 h-12 rounded-xl hover:bg-primary/20 text-primary shadow-sm"
                  >
                    {breakingDownId === todo.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      const docRef = doc(db!, "users", user!.uid, "todos", todo.id);
                      deleteDocumentNonBlocking(docRef);
                    }}
                    className="w-12 h-12 rounded-xl text-destructive hover:bg-destructive/10 shadow-sm"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
