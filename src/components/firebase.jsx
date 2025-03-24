// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCD1xerDXXXWzlyNtLu1rjBat9GYTQxGdM",
  authDomain: "stockmonitoring-3ba24.firebaseapp.com",
  projectId: "stockmonitoring-3ba24",
  storageBucket: "stockmonitoring-3ba24.firebasestorage.app",
  messagingSenderId: "183653387311",
  appId: "1:183653387311:web:33343b055975739aca0ada",
  measurementId: "G-5WXPMQ101W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };