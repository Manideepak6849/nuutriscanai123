import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBfRAPey8LyV25P3E7j-_WuhpFGz2n-bIc",
  authDomain: "nutrisavvy-ai.firebaseapp.com",
  projectId: "nutrisavvy-ai",
  storageBucket: "nutrisavvy-ai.firebasestorage.app",
  messagingSenderId: "398937738732",
  appId: "1:398937738732:web:2a0c0e8042b37dc7ec04c9",
  measurementId: "G-C304H3BWX0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
export const appId = "1:398937738732:web:2a0c0e8042b37dc7ec04c9";
