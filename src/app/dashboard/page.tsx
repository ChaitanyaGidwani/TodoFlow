
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { 
  collection, 
  doc, 
  serverTimestamp,
  orderBy,
  query,
  Timestamp
} from "firebase/firestore";
import { 
  useAuth, 
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  LogOut, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Circle,
  Wand2,
  Trophy,
  Zap,
  Calendar,
  AlertCircle,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from "recharts";
import { aiTaskBreakdown } from "@/ai/flows/ai-task-breakdown";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, parseISO, startOfDay, differenceInDays } from "date-fns";

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
  lastCompletedDate?: any;
}

const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-700 border-blue-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-rose-100 text-rose-700 border-rose-200",
};

const COLORS = ["#5C2EB3", "#2666D9", "#fed6e3", "#a8edea"];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [isDaily, setIsDaily] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const todosQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "todos"),
      orderBy("createdAt", "desc")
    );
  }, [db, user]);

  const { data: todos, isLoading: isTodosLoading } = useCollection<Todo>(todosQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push("/");
    }
  }, [mounted, user, isUserLoading, router]);

  const stats = useMemo(() => {
    if (!todos) return null;
    const completedCount = todos.filter(t => t.completed).length;
    const pendingCount = todos.length - completedCount;
    const dueTodayCount = todos.filter(t => t.dueDate && isToday(parseISO(t.dueDate))).length;
    const maxStreak = Math.max(...todos.map(t => t.streakDays || 0), 0);
    
    const chartData = [
      { name: "Completed", value: completedCount },
      { name: "Pending", value: pendingCount }
    ];

    const streakHistory = todos
      .filter(t => t.isDaily)
      .slice(0, 7)
      .map(t => ({ name: t.title.substring(0, 10), streak: t.streakDays || 0 }));

    return { completedCount, pendingCount, dueTodayCount, maxStreak, chartData, streakHistory };
  }, [todos]);

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
      streakDays: 0,
      lastCompletedDate: null
    });
    
    setNewTodo("");
    setDueDate("");
    setAdding(false);
  };

  const toggleTodo = (todo: Todo) => {
    if (!db || !user) return;
    const docRef = doc(db, "users", user.uid, "todos", todo.id);
    const now = new Date();
    
    let updates: Partial<Todo> = { completed: !todo.completed };

    if (!todo.completed && todo.isDaily) {
      const lastDate = todo.lastCompletedDate?.toDate ? todo.lastCompletedDate.toDate() : null;
      let newStreak = todo.streakDays || 0;

      if (!lastDate) {
        newStreak = 1;
      } else if (isYesterday(lastDate)) {
        newStreak += 1;
      } else if (!isToday(lastDate)) {
        newStreak = 1;
      }
      
      updates.streakDays = newStreak;
      updates.lastCompletedDate = serverTimestamp();
    }

    updateDocumentNonBlocking(docRef, updates);
  };

  const getBadge = (streak: number) => {
    if (streak >= 365) return { name: "Platinum", color: "bg-slate-400" };
    if (streak >= 100) return { name: "Gold", color: "bg-yellow-400" };
    if (streak >= 30) return { name: "Silver", color: "bg-slate-300" };
    if (streak >= 7) return { name: "Bronze", color: "bg-amber-600" };
    return null;
  };

  const filteredTodos = todos?.filter(t => {
    if (filter === "completed") return t.completed;
    if (filter === "pending") return !t.completed;
    if (filter === "daily") return t.isDaily;
    return true;
  });

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push("/");
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary font-headline">TodoFlow</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium bg-white/50 backdrop-blur px-3 py-1.5 rounded-full border border-white/20">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="todo-card border-none shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl"><Zap className="text-primary h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Top Streak</p>
                <p className="text-2xl font-bold">{stats?.maxStreak || 0} Days</p>
              </div>
            </CardContent>
          </Card>
          <Card className="todo-card border-none shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl"><CheckCircle2 className="text-green-600 h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold">{stats?.completedCount || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="todo-card border-none shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-secondary/10 rounded-xl"><Calendar className="text-secondary h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Due Today</p>
                <p className="text-2xl font-bold">{stats?.dueTodayCount || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="todo-card border-none shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl"><Trophy className="text-amber-600 h-6 w-6" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Flow</p>
                <p className="text-2xl font-bold">{todos?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="todo-card border-none shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Streak Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.streakHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line type="monotone" dataKey="streak" stroke="#5C2EB3" strokeWidth={3} dot={{r: 4, fill: '#5C2EB3'}} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="todo-card border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-secondary" /> Flow Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Add Task Card */}
        <Card className="todo-card border-none shadow-xl overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleAddTodo} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input 
                  placeholder="Focus on what matters most..." 
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  className="h-12 border-none bg-muted/30 focus-visible:ring-primary text-base flex-1"
                  disabled={adding}
                />
                <Button type="submit" className="h-12 px-8 gradient-btn font-semibold" disabled={adding}>
                  {adding ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                  Add Task
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger className="w-[120px] h-9 bg-white/50 border-white/20">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-md border border-white/20">
                  <Checkbox id="daily" checked={isDaily} onCheckedChange={(v: any) => setIsDaily(v)} />
                  <label htmlFor="daily" className="text-sm font-medium cursor-pointer">Daily Task</label>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    value={dueDate} 
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-9 w-[160px] bg-white/50 border-white/20"
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Main List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Your Flow
            </h2>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[130px] h-9 bg-white/50 border-white/20">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="daily">Daily Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {isTodosLoading && (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                </div>
              )}
              {!isTodosLoading && filteredTodos?.length === 0 && (
                <div className="text-center py-20 bg-white/30 backdrop-blur rounded-3xl border border-dashed border-primary/20">
                  <Sparkles className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks match your current filter.</p>
                </div>
              )}
              {filteredTodos?.map((todo) => {
                const badge = todo.isDaily ? getBadge(todo.streakDays || 0) : null;
                return (
                  <Card 
                    key={todo.id} 
                    className={cn(
                      "todo-card transition-all duration-300 group hover:translate-x-1 border-l-4",
                      todo.completed ? "border-l-green-500 opacity-70" : 
                      todo.priority === 'high' ? "border-l-rose-500" :
                      todo.priority === 'medium' ? "border-l-amber-500" : "border-l-blue-500"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <button 
                          onClick={() => toggleTodo(todo)}
                          className={cn(
                            "mt-1 shrink-0 transition-colors",
                            todo.completed ? "text-green-500" : "text-muted-foreground hover:text-primary"
                          )}
                        >
                          {todo.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <p className={cn(
                              "text-lg font-medium break-words",
                              todo.completed && "line-through text-muted-foreground"
                            )}>
                              {todo.title}
                            </p>
                            {todo.priority && (
                              <Badge variant="outline" className={cn("text-[10px] h-5 uppercase px-2", PRIORITY_COLORS[todo.priority])}>
                                {todo.priority}
                              </Badge>
                            )}
                            {todo.isDaily && (
                              <Badge variant="secondary" className="text-[10px] h-5 bg-primary/10 text-primary border-none flex items-center gap-1">
                                <Zap className="h-2.5 w-2.5" /> {todo.streakDays || 0} Streak
                              </Badge>
                            )}
                            {badge && (
                              <Badge className={cn("text-[10px] h-5 border-none text-white flex items-center gap-1", badge.color)}>
                                <Trophy className="h-2.5 w-2.5" /> {badge.name}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {todo.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Due: {format(parseISO(todo.dueDate), 'MMM d, yyyy')}
                              </span>
                            )}
                            <span className="opacity-60">{format(todo.createdAt?.toDate ? todo.createdAt.toDate() : new Date(), 'HH:mm')}</span>
                          </div>

                          {todo.subtasks && todo.subtasks.length > 0 && (
                            <div className="mt-3 space-y-1 pl-2 border-l-2 border-primary/20">
                              {todo.subtasks.map((st, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground py-0.5">
                                  <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                                  <span>{st}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={async () => {
                              setBreakingDownId(todo.id);
                              try {
                                const subtasks = await aiTaskBreakdown(todo.title);
                                const docRef = doc(db!, "users", user!.uid, "todos", todo.id);
                                updateDocumentNonBlocking(docRef, { subtasks });
                              } catch (e) {
                                toast({ variant: "destructive", title: "AI Error", description: "Could not split task." });
                              } finally {
                                setBreakingDownId(null);
                              }
                            }}
                            disabled={breakingDownId === todo.id || todo.completed}
                            className="text-secondary hover:bg-secondary/10"
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
                            className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
