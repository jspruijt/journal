// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db, analytics};