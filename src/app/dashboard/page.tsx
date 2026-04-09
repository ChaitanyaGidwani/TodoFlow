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
  BarChart3,
  Clock
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
import { TeddyIcon } from "@/components/TeddyIcons";
import { useProfile } from "@/hooks/use-profile";

const PRIORITY_COLORS = {
  low: "border-blue-500/50 text-blue-500",
  medium: "border-amber-500/50 text-amber-500",
  high: "border-rose-500/50 text-rose-500",
};

const COLORS = ["#A855F7", "#3B82F6", "#EC4899", "#10B981"];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { profile } = useProfile();
  
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

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
            Welcome back! <TeddyIcon variant="paw" size={32} color={profile?.teddyColor} className="animate-bounce" />
          </h1>
          <p className="text-muted-foreground font-medium">Here's how your day is shaping up. 🐻✨</p>
        </div>
        <div className="neon-badge">
          <Clock className="h-3 w-3 mr-2" /> {format(new Date(), 'EEEE, MMMM do')}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Top Streak", value: `${stats?.maxStreak || 0} Days`, icon: Zap, color: "text-purple-500" },
          { label: "Completed", value: stats?.completedCount || 0, icon: CheckCircle2, color: "text-green-500" },
          { label: "Due Today", value: stats?.dueTodayCount || 0, icon: Calendar, color: "text-blue-500" },
          { label: "Total Tasks", value: todos?.length || 0, icon: Trophy, color: "text-amber-500" }
        ].map((item, idx) => (
          <Card key={idx} className="todo-card group hover:scale-[1.02] transition-transform">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors", item.color)}>
                <item.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{item.label}</p>
                <p className="text-2xl font-black">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="todo-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Streak History
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.streakHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#555" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="streak" 
                  stroke="#A855F7" 
                  strokeWidth={4} 
                  dot={{r: 6, fill: '#A855F7', strokeWidth: 2, stroke: '#fff'}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="todo-card">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-secondary" /> Flow Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
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
          <h2 className="text-2xl font-black flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" /> Next Up
          </h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] glass-card border-none h-10 rounded-xl font-bold">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="glass-card">
              <SelectItem value="all">Everything</SelectItem>
              <SelectItem value="pending">Waiting</SelectItem>
              <SelectItem value="completed">Finished</SelectItem>
              <SelectItem value="daily">Habits</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {isTodosLoading && (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
              </div>
            )}
            {!isTodosLoading && filteredTodos?.length === 0 && (
              <div className="text-center py-24 glass-card border-dashed">
                <TeddyIcon variant="todos" size={64} className="mx-auto opacity-20 mb-4" />
                <p className="text-muted-foreground font-black">All clear! Relax and enjoy. 🐻☕</p>
              </div>
            )}
            {filteredTodos?.map((todo) => (
              <Card 
                key={todo.id} 
                className={cn(
                  "todo-card group hover:translate-x-2 transition-all duration-300",
                  todo.completed && "opacity-60"
                )}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <button 
                    onClick={() => toggleTodo(todo)}
                    className={cn(
                      "shrink-0 transition-all transform hover:scale-125",
                      todo.completed ? "text-green-500" : "text-zinc-500"
                    )}
                  >
                    {todo.completed ? <CheckCircle2 className="h-7 w-7" /> : <Circle className="h-7 w-7" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <p className={cn(
                        "text-lg font-bold truncate",
                        todo.completed && "line-through text-muted-foreground"
                      )}>
                        {todo.title}
                      </p>
                      {todo.priority && (
                        <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full border", PRIORITY_COLORS[todo.priority as keyof typeof PRIORITY_COLORS])}>
                          {todo.priority}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      {todo.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {format(parseISO(todo.dueDate), 'MMM d')}
                        </span>
                      )}
                      {todo.isDaily && (
                        <span className="flex items-center gap-1 text-purple-400">
                          <Zap className="h-3 w-3" /> {todo.streakDays || 0} Streak
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
                    className="text-primary hover:bg-primary/10 rounded-xl"
                  >
                    {breakingDownId === todo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}