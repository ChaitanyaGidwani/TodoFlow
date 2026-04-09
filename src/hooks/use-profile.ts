
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';

export interface UserProfile {
  userId: string;
  displayName: string;
  avatarUrl: string;
  teddyVariant: string;
  teddyColor: string;
  pattern: 'none' | 'paws' | 'dots' | 'stripes';
  updatedAt: any;
}

export function useProfile() {
  const { user } = useUser();
  const db = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      setLoading(false);
      return;
    }

    const profileRef = doc(db, 'users', user.uid, 'profile', 'settings');
    const unsubscribe = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile);
      } else {
        // Initial profile
        const initial = {
          userId: user.uid,
          displayName: user.email?.split('@')[0] || 'User',
          avatarUrl: '',
          teddyVariant: 'dashboard',
          teddyColor: '#8b5cf6',
          pattern: 'none',
          updatedAt: serverTimestamp()
        };
        setDoc(profileRef, initial);
        setProfile(initial as any);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, user]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!db || !user) return;
    const profileRef = doc(db, 'users', user.uid, 'profile', 'settings');
    await setDoc(profileRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  };

  return { profile, loading, updateProfile };
}
