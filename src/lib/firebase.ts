import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbqnKIMDKuahFA7OVoj2hAr9ZOMSLhBO4",
  authDomain: "ai-video-call-1f1e5.firebaseapp.com",
  projectId: "ai-video-call-1f1e5",
  storageBucket: "ai-video-call-1f1e5.firebasestorage.app",
  messagingSenderId: "696246577287",
  appId: "1:696246577287:web:d53f87c6e65e545fe63022",
  measurementId: "G-7DR9PVXR86"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
