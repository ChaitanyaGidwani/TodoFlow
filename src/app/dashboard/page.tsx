"use client";

import { useState, useEffect, useMemo } from "react";
import { doc, serverTimestamp } from "firebase/firestore";
import { 
  useFirestore, 
  useUser, 
  updateDocumentNonBlocking
} from "@/firebase";
import { useTodos } from "@/hooks/use-todos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  CheckCircle2, 
  Circle,
  Wand2,
  Trophy,
  Zap,
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Clock,
  Loader2,
  Flame,
  Star,
  Sparkles
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
  Bar,
  AreaChart,
  Area
} from "recharts";
import { aiTaskBreakdown } from "@/ai/flows/ai-task-breakdown";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, parseISO, eachDayOfInterval, subDays } from "date-fns";
import { TeddyIcon } from "@/components/TeddyIcons";
import { useProfile } from "@/hooks/use-profile";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";

const COLORS = ["#A855F7", "#3B82F6", "#EC4899", "#10B981"];

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    
    const duration = 1500;
    const stepTime = Math.abs(Math.floor(duration / (end || 1))) || 20;
    
    const timer = setInterval(() => {
      start += Math.ceil(end / 40) || 1;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { profile } = useProfile();
  const { todos, loading: isTodosLoading } = useTodos();

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
      { name: "Done", value: completedCount },
      { name: "Active", value: pendingCount }
    ];

    const streakHistory = todos
      .filter(t => t.isDaily)
      .slice(0, 7)
      .reverse()
      .map(t => ({ 
        name: t.title.substring(0, 8), 
        streak: t.streakDays || 0 
      }));

    const weeklyData = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    }).map(day => {
      const count = todos.filter(t => {
        const createdDate = t.createdAt?.toDate ? t.createdAt.toDate() : parseISO(t.createdAt);
        return format(createdDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      }).length;
      return {
        day: format(day, 'EEE'),
        tasks: count
      };
    });

    return { completedCount, pendingCount, dueTodayCount, maxStreak, chartData, streakHistory, weeklyData };
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

  const statItems = [
    { label: "Top Streak", value: stats?.maxStreak || 0, icon: Flame, color: "text-purple-500" },
    { label: "Done Tasks", value: stats?.completedCount || 0, icon: CheckCircle2, color: "text-green-500" },
    { label: "Due Today", value: stats?.dueTodayCount || 0, icon: Calendar, color: "text-blue-500" },
    { label: "Total Goals", value: todos?.length || 0, icon: Star, color: "text-amber-500" }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-foreground flex items-center gap-4">
            Flow State <TeddyIcon variant="paw" size={40} color={profile?.teddyColor} className="animate-teddy" />
          </h1>
          <p className="text-muted-foreground font-bold mt-2 uppercase tracking-widest text-xs flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" /> Welcome back, {profile?.displayName || 'User'}!
          </p>
        </div>
        <div className="neon-badge px-6 py-2 flex items-center">
          <Clock className="h-4 w-4 mr-2" /> {format(new Date(), 'EEEE, MMMM do')}
        </div>
      </header>

      {/* STAT CARDS MOBILE CAROUSEL */}
      <div className="md:hidden">
        <Carousel className="w-full">
          <CarouselContent>
            {statItems.map((item, idx) => (
              <CarouselItem key={idx} className="basis-[85%]">
                <Card className="graph-card animate-shimmer h-full">
                  <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                    <div className={cn("p-4 bg-white/10 rounded-[1.5rem] shadow-inner", item.color)}>
                      <item.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">{item.label}</p>
                      <p className="text-4xl font-black"><AnimatedNumber value={item.value} /></p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* STAT CARDS DESKTOP GRID */}
      <div className="hidden md:grid grid-cols-4 gap-6">
        {statItems.map((item, idx) => (
          <Card key={idx} className="graph-card group hover:scale-[1.05] transition-all animate-shimmer">
            <CardContent className="p-6 flex items-center gap-5">
              <div className={cn("p-4 bg-white/10 rounded-2xl group-hover:rotate-12 transition-transform", item.color)}>
                <item.icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">{item.label}</p>
                <p className="text-3xl font-black"><AnimatedNumber value={item.value} /></p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GRAPHS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="graph-card lg:col-span-1 min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-purple-500" /> Streak Momentum
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.streakHistory || []}>
                <defs>
                  <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888', fontWeight: 900}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '1.5rem', border: 'none', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="streak" 
                  stroke="#A855F7" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorStreak)" 
                  dot={{r: 5, fill: '#A855F7', strokeWidth: 2, stroke: '#fff'}}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="graph-card lg:col-span-1 min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-blue-500" /> Weekly Output
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.weeklyData || []}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888', fontWeight: 900}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '1.5rem', border: 'none' }}
                />
                <Bar dataKey="tasks" radius={[10, 10, 10, 10]}>
                  {(stats?.weeklyData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#colorBar)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="graph-card min-h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-3">
              <PieChartIcon className="h-5 w-5 text-pink-500" /> Focus Ratio
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-white/10 p-4 rounded-full backdrop-blur-md animate-spin-slow">
                <TeddyIcon variant={profile?.teddyVariant as any || 'magic-panda'} size={48} color={profile?.teddyColor} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.chartData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={85}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {(stats?.chartData || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TODO LIST */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black flex items-center gap-3">
            <TrendingUp className="h-7 w-7 text-primary" /> Active Flow
          </h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] graph-card border-none h-12 rounded-2xl font-bold px-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isTodosLoading && (
              <div className="col-span-full flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
              </div>
            )}
            {!isTodosLoading && filteredTodos?.length === 0 && (
              <div className="col-span-full text-center py-24 graph-card border-dashed">
                <TeddyIcon variant="todos" size={64} className="mx-auto opacity-20 mb-4" />
                <p className="text-muted-foreground font-black">All clear! Relax and enjoy. 🐻☕</p>
              </div>
            )}
            {filteredTodos?.map((todo) => (
              <Card 
                key={todo.id} 
                className={cn(
                  "graph-card group hover:translate-y-[-4px] transition-all duration-300",
                  todo.completed && "opacity-60 grayscale-[0.5]"
                )}
              >
                <CardContent className="p-6 flex items-center gap-5">
                  <button 
                    onClick={() => toggleTodo(todo)}
                    className={cn(
                      "shrink-0 transition-all transform hover:scale-125",
                      todo.completed ? "text-green-500" : "text-zinc-500"
                    )}
                  >
                    {todo.completed ? <CheckCircle2 className="h-8 w-8" /> : <Circle className="h-8 w-8" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <p className={cn(
                        "text-lg font-black truncate",
                        todo.completed && "line-through text-muted-foreground"
                      )}>
                        {todo.title}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
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
                    className="text-primary hover:bg-primary/20 rounded-2xl w-12 h-12"
                  >
                    {breakingDownId === todo.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-6 w-6" />}
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