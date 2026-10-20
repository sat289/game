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

// 1. Set the game name here
const GAME_KEY = "snake";
const GUEST_SCORE_KEY = `${GAME_KEY}_guest_hi`;
const GUEST_STATS_KEY = `${GAME_KEY}_guest_stats`;

// Persistent Guest ID for Leaderboard
let guestId = localStorage.getItem("snake_guest_id");
if (!guestId) {
  guestId = "guest_" + Math.random().toString(36).substring(2, 9);
  localStorage.setItem("snake_guest_id", guestId);
}

let currentUser = null;
let localMainScore = parseInt(localStorage.getItem(`${GAME_KEY}_hi`) || "0", 10);
let guestScore = parseInt(localStorage.getItem(GUEST_SCORE_KEY) || "0", 10);
let currentHighScore = Math.max(localMainScore, guestScore);

// Uses your unlocked tictactoe_rooms path so Global Leaderboard works for everyone
const LEADERBOARD_PATH = "tictactoe_rooms/snake_leaderboard";

async function syncEntryToGlobalLeaderboard(scoreVal, extraStats = {}) {
  if (!scoreVal || scoreVal <= 0) return;
  const playerId = currentUser ? currentUser.uid : guestId;
  const playerName = window._snakeFirebase.getPlayerName();
  const skin = localStorage.getItem("snake_skin") || "viper";
  try {
    await set(ref(db, `${LEADERBOARD_PATH}/${playerId}`), {
      name: playerName,
      score: scoreVal,
      apples: extraStats?.apples || Math.floor(scoreVal / 10),
      skin: extraStats?.skin || skin,
      isCloud: !!currentUser,
      updatedAt: Date.now()
    });
  } catch (e) {}
}

window._snakeFirebase = {
  app,
  auth,
  db,
  getPlayerName: () => {
    if (currentUser) {
      return currentUser.displayName || currentUser.email?.split("@")[0] || "Cloud Viper";
    }
    return localStorage.getItem("guestName") || localStorage.getItem("username") || "Guest Viper";
  },
  isLoggedIn: () => !!currentUser,
  fetchLeaderboard: async () => {
    try {
      const snap = await get(ref(db, LEADERBOARD_PATH));
      if (!snap.exists()) return [];
      const data = snap.val();
      return Object.values(data)
        .filter((item) => item && typeof item.score === "number")
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } catch (e) {
      return [];
    }
  }
};

const scoreElem = document.getElementById("score");
const storageBadge = document.getElementById("storageStatusBadge");
const storageIcon = document.getElementById("storageIcon");
const storageText = document.getElementById("storageText");

function updateScoreUI(val) {
  window.score = val;
  if (scoreElem) scoreElem.innerText = val;
  if (typeof window.onScoreUpdated === "function") {
    window.onScoreUpdated(val);
  }
}

function setStorageBadgeUI(isCloud, name) {
  if (!storageBadge) return;
  if (isCloud) {
    storageBadge.className = "flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide";
    storageIcon.textContent = "☁️";
    storageText.textContent = `Cloud: ${name}`;
  } else {
    storageBadge.className = "flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide";
    storageIcon.textContent = "👤";
    storageText.textContent = "Guest Storage";
  }
}

updateScoreUI(currentHighScore);
setStorageBadgeUI(false);

// 2. Automatically listen to user login state from Home Page
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const displayName = user.displayName || user.email?.split("@")[0] || "Player";
    setStorageBadgeUI(true, displayName);

    try {
      const snapshot = await get(child(ref(db), `scores/${user.uid}/${GAME_KEY}_high`));
      const cloudScore = snapshot.exists() ? (parseInt(snapshot.val(), 10) || 0) : 0;

      if (cloudScore > currentHighScore) {
        currentHighScore = cloudScore;
      } else if (currentHighScore > cloudScore) {
        await set(ref(db, `scores/${user.uid}/${GAME_KEY}_high`), currentHighScore);
      }

      localStorage.setItem(`${GAME_KEY}_hi`, currentHighScore.toString());
      localStorage.setItem(GUEST_SCORE_KEY, currentHighScore.toString());
      updateScoreUI(currentHighScore);

      if (currentHighScore > 0) {
        syncEntryToGlobalLeaderboard(currentHighScore);
      }
    } catch (err) {
      console.error("Firebase sync error:", err);
    }
  } else {
    currentUser = null;
    setStorageBadgeUI(false);
    localStorage.setItem(GUEST_SCORE_KEY, currentHighScore.toString());
    localStorage.setItem(`${GAME_KEY}_hi`, currentHighScore.toString());
    updateScoreUI(currentHighScore);
  }
});

// 3. Global helper function to submit scores
window.submitScore = function(newScore, extraStats = null) {
  const val = parseInt(newScore, 10);
  if (isNaN(val)) return;

  if (val > currentHighScore) {
    currentHighScore = val;
  }

  localStorage.setItem(`${GAME_KEY}_hi`, currentHighScore.toString());
  localStorage.setItem(GUEST_SCORE_KEY, currentHighScore.toString());
  if (extraStats) {
    localStorage.setItem(GUEST_STATS_KEY, JSON.stringify(extraStats));
  }

  updateScoreUI(currentHighScore);
  syncEntryToGlobalLeaderboard(currentHighScore, extraStats || {});

  if (currentUser) {
    set(ref(db, `scores/${currentUser.uid}/${GAME_KEY}_high`), currentHighScore);
    if (extraStats) {
      update(ref(db, `scores/${currentUser.uid}/${GAME_KEY}_stats`), {
        ...extraStats,
        updatedAt: Date.now()
      });
    }
  }
};

// 4. Fallback Auto-Scanner
setInterval(() => {
  let detected = 0;
  if (typeof window.score === "number") detected = window.score;
  const elem = document.getElementById("score") || document.getElementById("finalScore");
  if (elem) {
    const parsed = parseInt(elem.innerText.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(parsed)) detected = Math.max(detected, parsed);
  }
  if (detected > currentHighScore) {
    window.submitScore(detected);
  }
}, 1000);
