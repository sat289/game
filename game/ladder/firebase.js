// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBzLchy5M2fLne4c7Ghw1KNN8wVrlZdd8M",
    authDomain: "friendsgame-872f5.firebaseapp.com",
    databaseURL: "https://friendsgame-872f5-default-rtdb.firebaseio.com",
    projectId: "friendsgame-872f5",
    storageBucket: "friendsgame-872f5.firebasestorage.app",
    messagingSenderId: "522534013233",
    appId: "1:522534013233:web:f5faa6e6795023d0420810",
    measurementId: "G-PW5H3G97QR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, setDoc, getDoc, updateDoc, increment };
