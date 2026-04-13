import { initializeApp } from "firebase/app";
<<<<<<< HEAD
import { getFirestore } from "firebase/firestore";
=======
import { getFirestore } from "firebase/firestore"; // ✅ ADD THIS
>>>>>>> dev

const firebaseConfig = {
  apiKey: "AIzaSyDTY-SbffD9RammESLKZIglC_RT_ivKDcM",
  authDomain: "habit-tracker-47b9f.firebaseapp.com",
  projectId: "habit-tracker-47b9f",
};

const app = initializeApp(firebaseConfig);

<<<<<<< HEAD
// ✅ MUST EXPORT LIKE THIS
const db = getFirestore(app);

=======
// ✅ ADD THESE 2 LINES
const db = getFirestore(app);
>>>>>>> dev
export { db };