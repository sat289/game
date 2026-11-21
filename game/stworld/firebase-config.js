// ST GAMES — ST Virtual World Firebase configuration
// Firebase web configuration is intended to be used by the browser.
// Keep Firestore Security Rules restrictive and never publish admin passwords.
export const firebaseConfig = {
  apiKey: "AIzaSyBzLchy5M2fLne4c7Ghw1KNN8wVrlZdd8M",
  authDomain: "friendsgame-872f5.firebaseapp.com",
  databaseURL: "https://friendsgame-872f5-default-rtdb.firebaseio.com",
  projectId: "friendsgame-872f5",
  storageBucket: "friendsgame-872f5.firebasestorage.app",
  messagingSenderId: "522534013233",
  appId: "1:522534013233:web:f5faa6e6795023d0420810",
  measurementId: "G-PW5H3G97QR"
};

// Replace after creating your admin login. Use the same UID in firestore.rules.
export const ADMIN_UID = "8lcgTTcPxrOSAdyv2NTe2FwCUC93";
