import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDTY-SbffD9RammESLKZIglC_RT_ivKDcM",
  authDomain: "habit-tracker-47b9f.firebaseapp.com",
  projectId: "habit-tracker-47b9f",
};

const app = initializeApp(firebaseConfig);

// ✅ MUST EXPORT LIKE THIS
const db = getFirestore(app);

export { db };