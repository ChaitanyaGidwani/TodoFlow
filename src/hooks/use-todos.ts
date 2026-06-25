'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  DocumentData,
  FirestoreError,
  Timestamp
} from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Timestamp | string | null;
  userId: string;
  subtasks?: string[];
  isDaily?: boolean;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  streakDays?: number;
  lastCompletedDate?: Timestamp | string | null;
}

/**
 * A robust, simplified hook for todos that prevents app crashes on permission errors.
 */
export function useTodos() {
  const { user } = useUser();
  const db = useFirestore();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Explicit path: users/{uid}/todos
    const todosRef = collection(db, 'users', user.uid, 'todos');
    const q = query(todosRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as Todo[];
        setTodos(data);
        setLoading(false);
        setError(null);
      }, 
      (err: FirestoreError) => {
        // Silently catch and log instead of throwing to prevent app crash
        console.warn('Firestore Permission/Query Error:', err.message);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, user]);

  return { todos, loading, error };
}