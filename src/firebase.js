// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth'; // Voor auth
import { getFirestore, initializeFirestore, persistentLocalCache } from "firebase/firestore"; // Voeg initializeFirestore en persistentLocalCache toe

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCX8g2c5jzORlgQKz57vahIsO-TP1nGX5E",
  authDomain: "journal-ddaf4.firebaseapp.com",
  projectId: "journal-ddaf4",
  storageBucket: "journal-ddaf4.firebasestorage.app",
  messagingSenderId: "136356893420",
  appId: "1:136356893420:web:5162103d01918488e84bc9",
  measurementId: "G-25Y1KHZNNP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);


// Initialiseer Firestore met offline persistence ingeschakeld
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabSynchronization: true }) // Gebruik persistentLocalCache voor offline persistence
});

export { db, auth, analytics };