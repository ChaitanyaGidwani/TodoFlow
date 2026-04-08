
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDummyKey-For-Demo-Purposes-Only",
  authDomain: "todoflow-demo.firebaseapp.com",
  projectId: "todoflow-demo",
  storageBucket: "todoflow-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Persistence failed: multiple tabs open");
    } else if (err.code === "unimplemented") {
      console.warn("Persistence is not available in this browser");
    }
  });
}

export { auth, db };
