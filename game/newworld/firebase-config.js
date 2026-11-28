import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
  getDatabase,
  ref,
  onValue,
  update,
  push,
  set,
  remove,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const ADMIN_UID = "8lcgTTcPxrOSAdyv2NTe2FwCUC93";

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

const app = initializeApp(firebaseConfig);
try {
  getAnalytics(app);
} catch (e) {
  console.warn("Analytics skipped:", e.message);
}

export const db = getDatabase(app);
export const auth = getAuth(app);

export {
  ref,
  onValue,
  update,
  push,
  set,
  remove,
  runTransaction,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
