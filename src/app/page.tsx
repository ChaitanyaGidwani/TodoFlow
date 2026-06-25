"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

type AuthMode = 'login' | 'signup' | 'forgot';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user && !loading) {
      router.push("/dashboard");
    }
  }, [mounted, user, router, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        if (db) {
          const userRef = doc(db, "users", auth.currentUser!.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              email: auth.currentUser!.email,
              updatedAt: serverTimestamp(),
              userId: auth.currentUser!.uid
            }, { merge: true });
          }
        }
      } else if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (db) {
          await setDoc(doc(db, "users", userCredential.user.uid), {
            email: userCredential.user.email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            userId: userCredential.user.uid
          });
        }
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        toast({
          title: "Check your email",
          description: "If an account exists, a reset link has been sent. Please check your spam folder.",
        });
        setMode('login');
      }
    } catch (error: any) {
      let message = "An unexpected error occurred.";
      if (error.code === 'auth/invalid-api-key') {
        message = "Invalid Firebase configuration.";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Invalid email or password.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "This email is already registered.";
      } else if (error.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      } else if (error.code === 'auth/invalid-email') {
        message = "Please enter a valid email address.";
      }
      
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary">TodoFlow</h1>
        </div>
        <p className="text-muted-foreground text-lg">Streamline your productivity with AI-powered task management.</p>
      </div>

      <Card className="w-full max-w-md todo-card animate-in fade-in zoom-in-95 duration-500">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            {mode === 'login' ? "Welcome Back" : mode === 'signup' ? "Create Account" : "Reset Password"}
          </CardTitle>
          <CardDescription>
            {mode === 'login' ? "Sign in to access your persistent todo list." 
              : mode === 'signup' ? "Sign up to start organizing your life effortlessly."
              : "Enter your email to receive a reset link."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                suppressHydrationWarning
              />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? "current-password" : "new-password"}
                  suppressHydrationWarning
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full gradient-btn h-12 text-lg font-semibold" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mode === 'login' ? "Login" : mode === 'signup' ? "Sign Up" : "Send Reset Link"}
            </Button>
            
            <div className="flex flex-col gap-2 w-full text-center">
              <Button 
                type="button" 
                variant="link" 
                className="text-secondary"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                disabled={loading}
              >
                {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
              </Button>
              {mode === 'login' && (
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-xs text-muted-foreground"
                  onClick={() => setMode('forgot')}
                  disabled={loading}
                >
                  Forgot password?
                </Button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
