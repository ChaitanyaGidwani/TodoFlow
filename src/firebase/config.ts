// Firebase configuration loaded from environment variables.
// Fallback values are provided for backwards compatibility but should be
// replaced by setting NEXT_PUBLIC_FIREBASE_* variables in .env.local.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyChS0HmGFgoXXYxL4V31Tw-d15YyWzYHbE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-1649342616-5bc76.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-1649342616-5bc76",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-1649342616-5bc76.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "406746389346",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:406746389346:web:aef7cbc3df5e9a3444ea3b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};
