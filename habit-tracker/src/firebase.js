import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // ✅ ADD THIS

const firebaseConfig = {
  apiKey: "AIzaSyDTY-SbffD9RammESLKZIglC_RT_ivKDcM",
  authDomain: "habit-tracker-47b9f.firebaseapp.com",
  projectId: "habit-tracker-47b9f",
  storageBucket: "habit-tracker-47b9f.firebasestorage.app",
  messagingSenderId: "1070401085093",
  appId: "1:1070401085093:web:69fcfc723dceb233d6f74c"
};

const app = initializeApp(firebaseConfig);

// ✅ ADD THESE 2 LINES
const db = getFirestore(app);
export { db };