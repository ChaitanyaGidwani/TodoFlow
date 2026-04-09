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
  AreaChart, 
  Area, 
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
import { format, isToday, isYesterday, parseISO, eachDayOfInterval, subDays } from "date-fns";
import { TeddyIcon } from "@/components/TeddyIcons";
import { useProfile } from "@/hooks/use-profile";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem 
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
    
    const duration = 1000;
    const stepTime = Math.abs(Math.floor(duration / (end || 1))) || 20;
    
    const timer = setInterval(() => {
      start += Math.ceil(end / 20) || 1;
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
    { label: "Top Streak", value: stats?.maxStreak || 0, icon: Flame, color: "text-purple-600 dark:text-purple-400" },
    { label: "Done Tasks", value: stats?.completedCount || 0, icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
    { label: "Due Today", value: stats?.dueTodayCount || 0, icon: Calendar, color: "text-blue-600 dark:text-blue-400" },
    { label: "Total Goals", value: todos?.length || 0, icon: Star, color: "text-amber-600 dark:text-amber-400" }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl md:text-6xl font-black text-high-contrast flex items-center gap-6">
            Flow State <div className="p-4 bg-primary/20 rounded-[2.5rem] border-2 border-primary/30 shadow-xl"><TeddyIcon variant="paw" size={56} color={profile?.teddyColor} className="animate-teddy" /></div>
          </h1>
          <p className="text-muted-foreground font-black mt-4 uppercase tracking-[0.25em] text-xs flex items-center gap-3">
            <div className="p-1.5 bg-primary/10 rounded-lg"><Sparkles className="h-4 w-4 text-primary animate-pulse" /></div> Welcome back, {profile?.displayName || 'User'}!
          </p>
        </div>
        <div className="neon-badge px-8 py-4 flex items-center shadow-2xl rounded-[2rem] border-2 border-white/20">
          <Clock className="h-5 w-5 mr-3" /> {format(new Date(), 'EEEE, MMMM do')}
        </div>
      </header>

      {/* STAT CARDS MOBILE CAROUSEL */}
      <div className="md:hidden">
        <Carousel className="w-full">
          <CarouselContent>
            {statItems.map((item, idx) => (
              <CarouselItem key={idx} className="basis-[85%]">
                <Card className="graph-card animate-shimmer h-full">
                  <CardContent className="p-10 flex flex-col items-center text-center gap-8">
                    <div className={cn("p-6 bg-white/30 dark:bg-black/30 rounded-[2.5rem] shadow-inner border-2 border-white/40 dark:border-purple-500/20", item.color)}>
                      <item.icon className="h-12 w-12 drop-shadow-lg" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-3">{item.label}</p>
                      <p className="text-6xl font-black text-high-contrast"><AnimatedNumber value={item.value} /></p>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* STAT CARDS DESKTOP GRID */}
      <div className="hidden md:grid grid-cols-4 gap-10">
        {statItems.map((item, idx) => (
          <Card key={idx} className="graph-card group animate-shimmer">
            <CardContent className="p-10 flex items-center gap-8">
              <div className={cn("p-6 bg-white/30 dark:bg-black/30 rounded-[2rem] group-hover:rotate-12 transition-transform border-2 border-white/40 dark:border-purple-500/20 shadow-xl", item.color)}>
                <item.icon className="h-10 w-10 drop-shadow-lg" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2">{item.label}</p>
                <p className="text-5xl font-black text-high-contrast"><AnimatedNumber value={item.value} /></p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GRAPHS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <Card className="graph-card lg:col-span-1 min-h-[500px]">
          <CardHeader className="pt-8 px-8">
            <CardTitle className="text-2xl font-black flex items-center gap-4 text-high-contrast">
              <div className="p-3 bg-purple-500/10 rounded-2xl"><TrendingUp className="h-8 w-8 text-purple-500" /></div> Streak Momentum
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full mt-6 px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.streakHistory || []}>
                <defs>
                  <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888', fontWeight: 900}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: '2rem', border: '2px solid rgba(168,85,247,0.5)', backdropFilter: 'blur(20px)' }}
                  itemStyle={{ color: '#fff', fontWeight: 900 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="streak" 
                  stroke="#A855F7" 
                  strokeWidth={6} 
                  fillOpacity={1} 
                  fill="url(#colorStreak)" 
                  dot={{r: 8, fill: '#A855F7', strokeWidth: 4, stroke: '#fff'}}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="graph-card lg:col-span-1 min-h-[500px]">
          <CardHeader className="pt-8 px-8">
            <CardTitle className="text-2xl font-black flex items-center gap-4 text-high-contrast">
              <div className="p-3 bg-blue-500/10 rounded-2xl"><BarChart3 className="h-8 w-8 text-blue-500" /></div> Weekly Output
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full mt-6 px-4">
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
                  cursor={{fill: 'rgba(255,255,255,0.1)'}}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: '2rem', border: '2px solid rgba(59,130,246,0.5)' }}
                />
                <Bar dataKey="tasks" radius={[15, 15, 15, 15]}>
                  {(stats?.weeklyData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="url(#colorBar)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="graph-card min-h-[500px]">
          <CardHeader className="pt-8 px-8">
            <CardTitle className="text-2xl font-black flex items-center gap-4 text-high-contrast">
              <div className="p-3 bg-pink-500/10 rounded-2xl"><PieChartIcon className="h-8 w-8 text-pink-500" /></div> Focus Ratio
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-white/40 dark:bg-black/40 p-6 rounded-full backdrop-blur-3xl animate-spin-slow border-4 border-white/60 dark:border-purple-500/30 shadow-2xl">
                <TeddyIcon variant={profile?.teddyVariant as any || 'magic-panda'} size={72} color={profile?.teddyColor} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.chartData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={105}
                  outerRadius={140}
                  paddingAngle={12}
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
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-black flex items-center gap-6 text-high-contrast">
            <div className="p-3 bg-primary/10 rounded-2xl"><TrendingUp className="h-8 w-8 text-primary" /></div> Active Flow
          </h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[220px] graph-card border-none h-16 rounded-[1.5rem] font-black px-8 shadow-2xl">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="glass-card border-none shadow-2xl rounded-[1.5rem]">
              <SelectItem value="all">Everything</SelectItem>
              <SelectItem value="pending">Waiting</SelectItem>
              <SelectItem value="completed">Finished</SelectItem>
              <SelectItem value="daily">Habits</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {isTodosLoading && (
              <div className="col-span-full flex justify-center py-32">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
            )}
            {!isTodosLoading && filteredTodos?.length === 0 && (
              <div className="col-span-full text-center py-40 graph-card border-dashed border-4">
                <div className="bg-primary/5 p-10 rounded-full w-fit mx-auto mb-8 animate-teddy">
                  <TeddyIcon variant="todos" size={84} className="opacity-30" />
                </div>
                <p className="text-muted-foreground font-black text-xl">All clear! Relax and enjoy. 🐻☕</p>
              </div>
            )}
            {filteredTodos?.map((todo) => (
              <Card 
                key={todo.id} 
                className={cn(
                  "todo-card group transition-all duration-300",
                  todo.completed && "opacity-60 grayscale-[0.4]"
                )}
              >
                <CardContent className="p-10 flex items-center gap-8">
                  <button 
                    onClick={() => toggleTodo(todo)}
                    className={cn(
                      "shrink-0 transition-all transform hover:scale-125",
                      todo.completed ? "text-green-500" : "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    {todo.completed ? <CheckCircle2 className="h-12 w-12 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> : <Circle className="h-12 w-12" />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-3 mb-3">
                      <p className={cn(
                        "text-2xl font-black truncate text-high-contrast",
                        todo.completed && "line-through opacity-50"
                      )}>
                        {todo.title}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-6 text-[12px] text-muted-foreground font-black uppercase tracking-widest">
                      {todo.dueDate && (
                        <span className="flex items-center gap-2 bg-white/30 px-3 py-1.5 rounded-xl border border-white/20">
                          <Calendar className="h-4 w-4 text-blue-500" /> {format(parseISO(todo.dueDate), 'MMM d')}
                        </span>
                      )}
                      {todo.isDaily && (
                        <span className="flex items-center gap-2 text-purple-600 dark:text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">
                          <Zap className="h-4 w-4" /> {todo.streakDays || 0} Streak
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
                    className="text-primary hover:bg-primary/20 rounded-[1.5rem] w-16 h-16 shadow-lg border-2 border-primary/20"
                  >
                    {breakingDownId === todo.id ? <Loader2 className="h-7 w-7 animate-spin" /> : <Wand2 className="h-8 w-8" />}
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