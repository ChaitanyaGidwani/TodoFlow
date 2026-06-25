"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  useUser, 
  useFirestore 
} from "@/firebase";
import { useTodos } from "@/hooks/use-todos";
import { useProfile } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Flame, 
  CheckCircle, 
  Calendar, 
  Star, 
  Sparkles, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Loader2
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
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { format, isToday, parseISO, eachDayOfInterval, subDays } from "date-fns";
import { TeddyIcon } from "@/components/TeddyIcons";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem 
} from "@/components/ui/carousel";

const COLORS = ["#A855F7", "#3B82F6", "#EC4899", "#10B981"];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { profile } = useProfile();
  const { todos, loading: isTodosLoading } = useTodos();

  useEffect(() => {
    setMounted(true);
  }, []);

  const statsData = useMemo(() => {
    if (!todos || todos.length === 0) return { streak: 0, completedToday: 0, dueToday: 0, badges: 0 };

    const dailyHabits = todos.filter(t => t.isDaily);
    const maxStreak = dailyHabits.length > 0 ? Math.max(...dailyHabits.map(t => t.streakDays || 0)) : 0;

    const completedToday = todos.filter(t => t.completed && t.dueDate && isToday(parseISO(t.dueDate))).length;
    const dueToday = todos.filter(t => t.dueDate && isToday(parseISO(t.dueDate)) && !t.completed).length;

    const totalCompletions = todos.filter(t => t.completed).length;
    const badgeCount = Math.floor(totalCompletions / 10);

    return { streak: maxStreak, completedToday, dueToday, badges: badgeCount };
  }, [todos]);

  const chartData = useMemo(() => {
    if (!todos) return { weekly: [], split: [] };

    const weekly = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    }).map(day => {
      const count = todos.filter(t => {
        if (!t.createdAt) return false;
        const d = typeof t.createdAt === 'object' && 'toDate' in t.createdAt
          ? t.createdAt.toDate()
          : parseISO(t.createdAt as string);
        return format(d, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      }).length;
      return { name: format(day, 'EEE'), value: count };
    });

    const split = [
      { name: "Done", value: todos.filter(t => t.completed).length },
      { name: "Pending", value: todos.filter(t => !t.completed).length }
    ];

    return { weekly, split };
  }, [todos]);

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

  const statItems = [
    { 
      icon: Flame, 
      label: 'Current Streak', 
      value: statsData.streak, 
      color: 'from-orange-400 to-orange-600',
      suffix: 'days'
    },
    { 
      icon: CheckCircle, 
      label: 'Completed Today', 
      value: statsData.completedToday, 
      color: 'from-emerald-400 to-emerald-600'
    },
    { 
      icon: Calendar, 
      label: 'Tasks Due', 
      value: statsData.dueToday, 
      color: 'from-blue-400 to-blue-600' 
    },
    { 
      icon: Star, 
      label: 'Total Badges', 
      value: statsData.badges, 
      color: 'from-yellow-400 to-yellow-600'
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <header className="glass-card p-12 rounded-[2.5rem] text-center border-white/20 dark:border-purple-500/30">
        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight drop-shadow-sm">
          Welcome to <span className="text-6xl">TodoFlow</span> 🐻✨
        </h1>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-200/50 backdrop-blur-sm">
            <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
          </div>
          <div className="text-xl md:text-2xl font-black text-high-contrast tracking-tight">
            Welcome back, {profile?.displayName || 'Superstar'}! ✨
          </div>
        </div>
      </header>

      {/* STATS GRID - Carousel on mobile, Grid on desktop */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-8">
        {statItems.map((item, idx) => (
          <Card key={idx} className="glass-card group hover:scale-[1.05] transition-all duration-300 overflow-hidden border-none shadow-2xl animate-shimmer">
            <CardContent className="p-10 flex flex-col items-center text-center">
              <div className={cn(
                "p-6 rounded-[2rem] bg-gradient-to-br shadow-xl mb-6 group-hover:rotate-12 transition-transform",
                item.color
              )}>
                <item.icon className="h-10 w-10 text-white drop-shadow-md" />
              </div>
              <div className="text-5xl font-black text-high-contrast mb-2">
                {item.value} <span className="text-lg opacity-60 font-bold">{item.suffix || ''}</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                {item.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="sm:hidden">
        <Carousel className="w-full">
          <CarouselContent>
            {statItems.map((item, idx) => (
              <CarouselItem key={idx}>
                <Card className="glass-card border-none shadow-2xl mx-1">
                  <CardContent className="p-10 flex flex-col items-center text-center">
                    <div className={cn("p-6 rounded-[2rem] bg-gradient-to-br shadow-xl mb-6", item.color)}>
                      <item.icon className="h-10 w-10 text-white drop-shadow-md" />
                    </div>
                    <div className="text-5xl font-black text-high-contrast mb-2">
                      {item.value} <span className="text-lg opacity-60 font-bold">{item.suffix || ''}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                      {item.label}
                    </p>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Card className="graph-card h-[500px]">
          <CardHeader className="pt-8 px-8">
            <CardTitle className="text-2xl font-black flex items-center gap-4 text-high-contrast">
              <div className="p-3 bg-blue-500/10 rounded-2xl"><TrendingUp className="h-8 w-8 text-blue-500" /></div> Weekly Momentum
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full mt-6 px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.weekly}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888', fontWeight: 900}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: '1.5rem', border: 'none', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#fff', fontWeight: 900 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#A855F7" 
                  strokeWidth={6} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  dot={{r: 6, fill: '#A855F7', strokeWidth: 3, stroke: '#fff'}}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="graph-card h-[500px]">
          <CardHeader className="pt-8 px-8">
            <CardTitle className="text-2xl font-black flex items-center gap-4 text-high-contrast">
              <div className="p-3 bg-pink-500/10 rounded-2xl"><PieChartIcon className="h-8 w-8 text-pink-500" /></div> Flow Ratio
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-white/40 dark:bg-black/40 p-6 rounded-full backdrop-blur-3xl animate-teddy border-4 border-white/60 dark:border-purple-500/30 shadow-2xl">
                <TeddyIcon variant={profile?.teddyVariant as any || 'magic-panda'} size={72} color={profile?.teddyColor} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.split}
                  cx="50%"
                  cy="50%"
                  innerRadius={110}
                  outerRadius={140}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.split.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
