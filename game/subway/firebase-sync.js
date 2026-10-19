import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, child } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

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
const auth = getAuth(app);
const db = getDatabase(app);

const GAME_KEY = "subway";

let currentUser = null;
let currentHighScore = parseInt(localStorage.getItem(`${GAME_KEY}_hi`) || "0", 10);

window.syncPlayerProfileToCloud = async function () {
  if (!window.playerProfile) return;
  localStorage.setItem(`${GAME_KEY}_profile`, JSON.stringify(window.playerProfile));
  if (currentUser) {
    try {
      await update(ref(db, `scores/${currentUser.uid}`), {
        [`${GAME_KEY}_high`]: currentHighScore,
        [`${GAME_KEY}_coins`]: window.playerProfile.coins,
        [`${GAME_KEY}_diamonds`]: window.playerProfile.diamonds,
        [`${GAME_KEY}_boards`]: window.playerProfile.boards,
        [`${GAME_KEY}_avatars`]: window.playerProfile.unlockedAvatars,
        [`${GAME_KEY}_boardSkins`]: window.playerProfile.unlockedBoardSkins,
        [`${GAME_KEY}_selectedAvatar`]: window.playerProfile.selectedAvatar,
        [`${GAME_KEY}_selectedBoard`]: window.playerProfile.selectedBoard,
        [`${GAME_KEY}_displayName`]: window.playerProfile.displayName
      });
    } catch (err) {
      console.error("Firebase profile sync error:", err);
    }
  }
};

onAuthStateChanged(auth, async (user) => {
  const statusBadge = document.getElementById("firebaseStatus");
  if (user) {
    currentUser = user;
    if (statusBadge) statusBadge.innerText = "☁️ Cloud Synced";
    try {
      const snapshot = await get(child(ref(db), `scores/${user.uid}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const cloudScore = parseInt(data[`${GAME_KEY}_high`], 10) || 0;
        if (cloudScore > currentHighScore) {
          currentHighScore = cloudScore;
          localStorage.setItem(`${GAME_KEY}_hi`, currentHighScore.toString());
        }

        if (window.playerProfile) {
          if (typeof data[`${GAME_KEY}_coins`] === "number") window.playerProfile.coins = Math.max(window.playerProfile.coins, data[`${GAME_KEY}_coins`]);
          if (typeof data[`${GAME_KEY}_diamonds`] === "number") window.playerProfile.diamonds = Math.max(window.playerProfile.diamonds, data[`${GAME_KEY}_diamonds`]);
          if (typeof data[`${GAME_KEY}_boards`] === "number") window.playerProfile.boards = Math.max(window.playerProfile.boards, data[`${GAME_KEY}_boards`]);
          if (data[`${GAME_KEY}_displayName`]) window.playerProfile.displayName = data[`${GAME_KEY}_displayName`];
          window.updateMenuUI && window.updateMenuUI();
        }
      } else if (currentHighScore > 0) {
        window.syncPlayerProfileToCloud();
      }
    } catch (err) {
      console.error("Firebase sync error:", err);
    }
  } else {
    if (statusBadge) statusBadge.innerText = "☁️ Local Mode";
  }
});

window.submitScore = function (newScore) {
  const val = parseInt(newScore, 10);
  if (isNaN(val)) return;

  if (val > currentHighScore) {
    currentHighScore = val;
    localStorage.setItem(`${GAME_KEY}_hi`, currentHighScore.toString());
    if (currentUser) {
      set(ref(db, `scores/${currentUser.uid}/${GAME_KEY}_high`), currentHighScore);
    }
  }
  window.syncPlayerProfileToCloud();
};

window.getHighScore = () => currentHighScore;
