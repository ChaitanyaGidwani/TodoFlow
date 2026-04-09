"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { 
  doc, 
  serverTimestamp
} from "firebase/firestore";
import { 
  useAuth, 
  useFirestore, 
  useUser, 
  updateDocumentNonBlocking
} from "@/firebase";
import { useTodos } from "@/hooks/use-todos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  LogOut, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Circle,
  Wand2,
  Trophy,
  Zap,
  Calendar,
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
  Cell
} from "recharts";
import { aiTaskBreakdown } from "@/ai/flows/ai-task-breakdown";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, parseISO } from "date-fns";

const PRIORITY_COLORS = {
  low: "bg-blue-100 text-blue-700 border-blue-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-rose-100 text-rose-700 border-rose-200",
};

const COLORS = ["#5C2EB3", "#2666D9", "#fed6e3", "#a8edea"];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const { todos, loading: isTodosLoading, error: queryError } = useTodos();

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = useMemo(() => {
    if (!todos.length) return null;
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

  const toggleTodo = (todo: any) => {
    if (!db || !user) return;
    const docRef = doc(db, "users", user.uid, "todos", todo.id);
    
    let updates: any = { completed: !todo.completed };

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

        {queryError && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-4 text-destructive text-sm flex items-center gap-2">
              🐻 We hit a snag syncing tasks. Please refresh.
            </CardContent>
          </Card>
        )}

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
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Tasks</p>
                <p className="text-2xl font-bold">{todos?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="todo-card border-none shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Streak Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.streakHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="streak" stroke="#5C2EB3" strokeWidth={3} dot={{r: 4, fill: '#5C2EB3'}} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="todo-card border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-secondary" /> Flow Ratio
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
                    {stats?.chartData?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Active Tasks
            </h2>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[130px] h-9 bg-white/50 border-white/20">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Done</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
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
              {filteredTodos?.map((todo) => (
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
                            <Badge variant="outline" className={cn("text-[10px] h-5 uppercase px-2", PRIORITY_COLORS[todo.priority as keyof typeof PRIORITY_COLORS])}>
                              {todo.priority}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {todo.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {format(parseISO(todo.dueDate), 'MMM d')}
                            </span>
                          )}
                          {todo.isDaily && (
                            <span className="flex items-center gap-1 text-primary">
                              <Zap className="h-3 w-3" /> Streak: {todo.streakDays || 0}
                            </span>
                          )}
                        </div>
                      </div>

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
                        className="text-secondary hover:bg-secondary/10"
                      >
                        {breakingDownId === todo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}