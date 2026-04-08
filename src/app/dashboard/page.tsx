
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  LogOut, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Circle,
  Wand2 
} from "lucide-react";
import { aiTaskBreakdown } from "@/ai/flows/ai-task-breakdown";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Timestamp;
  userId: string;
  subtasks?: string[];
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [adding, setAdding] = useState(false);
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        const q = query(
          collection(db, "todos"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const unsubTodos = onSnapshot(q, (snapshot) => {
          const items: Todo[] = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as Todo);
          });
          setTodos(items);
        });
        return () => unsubTodos();
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !user) return;

    setAdding(true);
    try {
      await addDoc(collection(db, "todos"), {
        text: newTodo,
        completed: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewTodo("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setAdding(false);
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, "todos", id), { completed: !completed });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "todos", id));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleAIBreakdown = async (todo: Todo) => {
    setBreakingDownId(todo.id);
    try {
      const subtasks = await aiTaskBreakdown(todo.text);
      await updateDoc(doc(db, "todos", todo.id), { subtasks });
      toast({ title: "AI Magic!", description: "Task broken down into actionable steps." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate breakdown." });
    } finally {
      setBreakingDownId(null);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary font-headline">TodoFlow</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-muted-foreground font-medium">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Input area */}
        <Card className="todo-card animate-in fade-in zoom-in-95 duration-500 border-none shadow-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleAddTodo} className="flex gap-2">
              <Input 
                placeholder="What needs to be done? (Try something complex for AI breakdown)" 
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                className="h-12 border-none bg-muted/50 focus-visible:ring-primary text-base"
              />
              <Button type="submit" size="icon" className="h-12 w-12 gradient-btn shrink-0" disabled={adding}>
                {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-6 w-6" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List area */}
        <ScrollArea className="h-[calc(100vh-320px)] rounded-xl">
          <div className="space-y-3">
            {todos.length === 0 && !adding && (
              <div className="text-center py-20 animate-in fade-in duration-1000">
                <div className="flex justify-center mb-4">
                  <Circle className="h-12 w-12 text-muted-foreground opacity-20" />
                </div>
                <p className="text-muted-foreground text-lg">Your flow is empty. Start by adding a task!</p>
              </div>
            )}
            {todos.map((todo) => (
              <Card 
                key={todo.id} 
                className={cn(
                  "todo-card transition-all duration-300 group hover:translate-x-1 border-l-4",
                  todo.completed ? "border-l-green-500 opacity-70" : "border-l-primary"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <button 
                      onClick={() => toggleTodo(todo.id, todo.completed)}
                      className={cn(
                        "mt-1 shrink-0 transition-colors",
                        todo.completed ? "text-green-500" : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      {todo.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-lg font-medium break-words",
                        todo.completed && "line-through text-muted-foreground"
                      )}>
                        {todo.text}
                      </p>
                      
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
                      {!todo.subtasks && !todo.completed && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleAIBreakdown(todo)}
                          disabled={breakingDownId === todo.id}
                          className="text-secondary hover:text-secondary hover:bg-secondary/10"
                        >
                          {breakingDownId === todo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteTodo(todo.id)}
                        className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
