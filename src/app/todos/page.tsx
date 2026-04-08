"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  collection, 
  doc, 
  serverTimestamp,
  orderBy,
  query
} from "firebase/firestore";
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from "@/firebase";
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
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  Circle,
  Wand2,
  Calendar,
  Zap,
  Search
} from "lucide-react";
import { TeddyIcon } from "@/components/TeddyIcons";
import { aiTaskBreakdown } from "@/ai/flows/ai-task-breakdown";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: any;
  userId: string;
  subtasks?: string[];
  isDaily?: boolean;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  streakDays?: number;
}

const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
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
  const { toast } = useToast();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const todosQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // Strictly path-based subcollection query
    return query(
      collection(db, "users", user.uid, "todos"),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: todos, isLoading } = useCollection<Todo>(todosQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !user || !db) return;

    setAdding(true);
    const colRef = collection(db, "users", user.uid, "todos");
    
    addDocumentNonBlocking(colRef, {
      title: newTodo,
      completed: false,
      userId: user.uid, // Required for security rules
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

  const toggleTodo = (todo: Todo) => {
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
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <TeddyIcon variant="todos" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Focus Central</h1>
            <p className="text-muted-foreground text-sm">Pawsitive productivity starts here!</p>
          </div>
        </div>
      </header>

      <Card className="todo-card border-none overflow-hidden group">
        <CardContent className="p-6">
          <form onSubmit={handleAddTodo} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input 
                placeholder="What's the goal for today?" 
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                className="h-12 border-none bg-muted/30 focus-visible:ring-primary text-base px-4"
                disabled={adding}
              />
              <Button type="submit" className="h-12 px-8 gradient-btn font-semibold" disabled={adding}>
                {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                Add Task
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="w-[120px] h-9 bg-white/10 border-white/10">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <Checkbox id="daily" checked={isDaily} onCheckedChange={(v: any) => setIsDaily(v)} />
                <label htmlFor="daily" className="text-sm font-medium cursor-pointer">Daily Habit</label>
              </div>
              <Input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 w-[160px] bg-white/10 border-white/10"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-white/10 border-white/10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px] bg-white/10 border-white/10">
            <SelectValue placeholder="All Tasks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Done</SelectItem>
            <SelectItem value="daily">Daily Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[600px] rounded-3xl">
        <div className="space-y-3">
          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
            </div>
          )}
          {!isLoading && filteredTodos?.length === 0 && (
            <div className="text-center py-20 bg-white/10 backdrop-blur rounded-3xl border border-dashed border-white/20">
              <p className="text-muted-foreground">No tasks found. Time to add some goals?</p>
            </div>
          )}
          {filteredTodos?.map((todo) => (
            <Card 
              key={todo.id} 
              className={cn(
                "todo-card border-none transition-all duration-300 group hover:translate-x-1 border-l-4",
                todo.completed ? "border-l-green-500 opacity-70" : 
                todo.priority === 'high' ? "border-l-rose-500" :
                todo.priority === 'medium' ? "border-l-amber-500" : "border-l-blue-500"
              )}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <button 
                  onClick={() => toggleTodo(todo)}
                  className={cn(
                    "shrink-0 transition-colors",
                    todo.completed ? "text-green-500" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {todo.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={cn(
                      "text-lg font-medium truncate",
                      todo.completed && "line-through text-muted-foreground"
                    )}>
                      {todo.title}
                    </span>
                    {todo.priority && (
                      <Badge variant="outline" className={cn("text-[10px] h-5 uppercase", PRIORITY_COLORS[todo.priority])}>
                        {todo.priority}
                      </Badge>
                    )}
                  </div>
                  {todo.dueDate && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" /> Due: {format(parseISO(todo.dueDate), 'MMM d')}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  >
                    {breakingDownId === todo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      const docRef = doc(db!, "users", user!.uid, "todos", todo.id);
                      deleteDocumentNonBlocking(docRef);
                    }}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
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