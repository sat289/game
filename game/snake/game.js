// Dynamically load PeerJS for instant Online Room Code multiplayer
const peerScript = document.createElement("script");
peerScript.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
document.head.appendChild(peerScript);

const getPlayerName = () => {
  if (window._snakeFirebase && typeof window._snakeFirebase.getPlayerName === "function") {
    return window._snakeFirebase.getPlayerName();
  }
  return localStorage.getItem("guestName") || localStorage.getItem("username") || "Guest Viper";
};

// Snake Skins Map
const SKINS = {
  viper:  { head: "#2ecc71", body: "#10b981", glow: "rgba(46,204,113,0.7)", icon: "🐍", req: 0 },
  lava:   { head: "#ff4757", body: "#ff7f50", glow: "rgba(255,71,87,0.7)",  icon: "🔥", req: 50 },
  plasma: { head: "#00f0ff", body: "#0072ff", glow: "rgba(0,240,255,0.7)",  icon: "⚡", req: 120 },
  dragon: { head: "#ffd700", body: "#f59e0b", glow: "rgba(255,215,0,0.8)",  icon: "👑", req: 250 }
};

let selectedSkin = localStorage.getItem("snake_skin") || "viper";

// Grid Constants (16x16 Grid on 320x320 Canvas)
const GRID_COUNT = 16;
const TILE_SIZE = 20;

// Game State
let gameMode = "bot"; // 'online' | 'bot' | 'solo'
let currentMap = "classic"; // 'classic' | 'portal' | 'maze' | 'custom'
let botDifficulty = "medium"; // 'easy' | 'medium' | 'impossible'
let hardcoreMode = false;

let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };

let botSnake = [];
let botDir = { x: -1, y: 0 };
let botFrozenUntil = 0;

let apple = { x: 10, y: 8, golden: false };
let poisonSkulls = [];
let obstacles = [];
let customMiniCells = Array(50).fill(false);
let particles = [];

let currentScore = 0;
let rivalScore = 0;
let applesEaten = 0;
let winStreak = 0;
let isGameOver = false;
let gameStarted = false;
let gameLoopTimer = null;
let countdownTimers = [];

// Feature 1: Frenzy Combo Meter
let frenzyCount = 0;
const FRENZY_TARGET = 5;
let frenzyActive = false;
let lastAppleTime = 0;

// Feature 2: Power-Ups & Sabotages
let magnetAvailable = true;
let magnetUntil = 0;
let fogAvailable = true;
let shockAvailable = true;

// Online PeerJS State
let peer = null;
let conn = null;
let roomCode = null;
let opponentConnected = false;

// Audio State
let soundEnabled = true;
let musicPlaying = false;
const bgMusic = document.getElementById("bgMusic");
const musicToggleBtn = document.getElementById("musicToggleBtn");
const soundToggleBtn = document.getElementById("soundToggleBtn");

// DOM Elements
const canvas = document.getElementById("snakeCanvas");
const ctx = canvas.getContext("2d");
const arenaWrapper = document.getElementById("arenaWrapper");
const hazardBanner = document.getElementById("hazardBanner");
const fogOverlay = document.getElementById("fogOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const gameOverTitle = document.getElementById("gameOverTitle");
const finalScoreEl = document.getElementById("finalScore");
const finalApplesEl = document.getElementById("finalApples");
const btnPlayAgain = document.getElementById("btnPlayAgain");

const mainMenuScreen = document.getElementById("mainMenuScreen");
const onlineLobbyScreen = document.getElementById("onlineLobbyScreen");
const botMenuScreen = document.getElementById("botMenuScreen");
const leaderboardScreen = document.getElementById("leaderboardScreen");
const gameScreen = document.getElementById("gameScreen");
const mapSelectorBar = document.getElementById("mapSelectorBar");
const subHeaderText = document.getElementById("subHeaderText");
const activeModeBadge = document.getElementById("activeModeBadge");
const hardcoreActiveTag = document.getElementById("hardcoreActiveTag");

const skinSelector = document.getElementById("skinSelector");
const rankBadge = document.getElementById("rankBadge");
const streakBadge = document.getElementById("streakBadge");

const customMapBox = document.getElementById("customMapBox");
const customMapGrid = document.getElementById("customMapGrid");
const btnClearCustomMap = document.getElementById("btnClearCustomMap");
const hardcoreToggleBtn = document.getElementById("hardcoreToggleBtn");

const btnOpenLeaderboard = document.getElementById("btnOpenLeaderboard");
const leaderboardList = document.getElementById("leaderboardList");
const btnBackFromLeaderboard = document.getElementById("btnBackFromLeaderboard");

const btnCreateRoom = document.getElementById("btnCreateRoom");
const createdRoomBox = document.getElementById("createdRoomBox");
const generatedCodeText = document.getElementById("generatedCodeText");
const btnCopyCode = document.getElementById("btnCopyCode");
const joinCodeInput = document.getElementById("joinCodeInput");
const btnJoinRoom = document.getElementById("btnJoinRoom");
const lobbyErrorMsg = document.getElementById("lobbyErrorMsg");

const lightRed = document.getElementById("lightRed");
const lightYellow = document.getElementById("lightYellow");
const lightGreen = document.getElementById("lightGreen");
const gameStatusText = document.getElementById("gameStatusText");
const liveScoreEl = document.getElementById("liveScore");
const rivalScoreEl = document.getElementById("rivalScore");
const rivalScoreWrap = document.getElementById("rivalScoreWrap");

const frenzyStatusLabel = document.getElementById("frenzyStatusLabel");
const frenzyMultiplierBadge = document.getElementById("frenzyMultiplierBadge");
const frenzyBarFill = document.getElementById("frenzyBarFill");

const btnPowerMagnet = document.getElementById("btnPowerMagnet");
const btnPowerFog = document.getElementById("btnPowerFog");
const fogBtnLabel = document.getElementById("fogBtnLabel");
const btnPowerShock = document.getElementById("btnPowerShock");
const shockBtnLabel = document.getElementById("shockBtnLabel");
const emojiBar = document.getElementById("emojiBar");
const emojiFloatContainer = document.getElementById("emojiFloatContainer");

/* ==================== ARCADE WEB AUDIO SFX ENGINE ==================== */
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioContextClass ? new AudioContextClass() : null;

function playTone(freq, type = "sine", duration = 0.09, gainVal = 0.12, slideToFreq = null) {
  if (!soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, audioCtx.currentTime + duration);
    }
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

const SFX = {
  click: () => playTone(620, "sine", 0.06, 0.1),
  turn: () => playTone(340, "triangle", 0.04, 0.06, 420),
  eat: (combo = 1) => {
    const base = 520 + Math.min(350, combo * 45);
    playTone(base, "triangle", 0.09, 0.15);
    setTimeout(() => playTone(base * 1.25, "sine", 0.11, 0.14), 55);
  },
  goldenEat: () => {
    [587.33, 783.99, 987.77, 1174.66].forEach((f, i) => {
      setTimeout(() => playTone(f, "sine", 0.14, 0.16), i * 55);
    });
  },
  frenzy: () => {
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      setTimeout(() => playTone(f, "sawtooth", 0.16, 0.12), i * 60);
    });
  },
  magnet: () => {
    playTone(300, "sine", 0.25, 0.15, 880);
  },
  fog: () => {
    playTone(420, "sawtooth", 0.3, 0.15, 140);
  },
  shockwave: () => {
    playTone(180, "sawtooth", 0.35, 0.24, 45);
  },
  win: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => playTone(f, "triangle", 0.18, 0.16), i * 85);
    });
  },
  crash: () => {
    playTone(220, "sawtooth", 0.18, 0.22, 90);
    setTimeout(() => playTone(130, "sawtooth", 0.3, 0.25, 45), 120);
  }
};

soundToggleBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggleBtn.textContent = soundEnabled ? "🔊" : "🔇";
  if (soundEnabled) SFX.click();
});

musicToggleBtn.addEventListener("click", () => {
  SFX.click();
  if (!bgMusic) return;
  if (musicPlaying) {
    bgMusic.pause();
    musicPlaying = false;
    musicToggleBtn.textContent = "🎵 OFF";
    musicToggleBtn.className = "bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-full text-[10px] font-bold transition";
  } else {
    bgMusic.volume = 0.35;
    bgMusic.play().then(() => {
      musicPlaying = true;
      musicToggleBtn.textContent = "🎵 ON";
      musicToggleBtn.className = "bg-[#2ecc71]/20 border border-[#2ecc71] text-[#2ecc71] px-2 py-1 rounded-full text-[10px] font-bold transition";
    }).catch(() => {
      alert("Place song.mp3 inside creazy/song.mp3 or snake/song.mp3!");
    });
  }
});

/* ==================== FEATURE 6: VIPER RANKS & SKINS ==================== */
function getRankDetails(bestPts) {
  if (bestPts >= 250) {
    return { title: "💎 Dragon Legend", cls: "text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full whitespace-nowrap" };
  }
  if (bestPts >= 120) {
    return { title: "🥇 Cyber Cobra", cls: "text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full whitespace-nowrap" };
  }
  if (bestPts >= 50) {
    return { title: "🥈 Neon Viper", cls: "text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full whitespace-nowrap" };
  }
  return { title: "🥉 Garden Worm", cls: "text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full whitespace-nowrap" };
}

function refreshSkinAndRank() {
  const bestPts = typeof window.score === "number" ? window.score : 0;

  if (rankBadge) {
    const r = getRankDetails(bestPts);
    rankBadge.textContent = r.title;
    rankBadge.className = r.cls;
  }

  if (!skinSelector) return;
  Array.from(skinSelector.options).forEach((opt) => {
    const key = opt.value;
    const req = SKINS[key]?.req || 0;
    opt.disabled = bestPts < req;
  });

  if (bestPts < (SKINS[selectedSkin]?.req || 0)) {
    selectedSkin = "viper";
  }
  skinSelector.value = selectedSkin;
}

window.onScoreUpdated = () => {
  refreshSkinAndRank();
};

if (skinSelector) {
  skinSelector.addEventListener("change", (e) => {
    const chosen = e.target.value;
    const bestPts = typeof window.score === "number" ? window.score : 0;
    if (bestPts >= (SKINS[chosen]?.req || 0)) {
      selectedSkin = chosen;
      localStorage.setItem("snake_skin", chosen);
      SFX.click();
      drawArena();
    }
  });
}

refreshSkinAndRank();

/* ==================== FEATURE 5: CUSTOM MAP CREATOR & HARDCORE ==================== */
function renderCustomMiniGrid() {
  if (!customMapGrid) return;
  customMapGrid.innerHTML = "";
  customMiniCells.forEach((active, idx) => {
    const cell = document.createElement("button");
    cell.className = `h-3.5 rounded-sm border transition ${
      active
        ? "bg-[#2ecc71] border-[#2ecc71] shadow-[0_0_6px_#2ecc71]"
        : "bg-white/5 border-white/10 hover:bg-white/15"
    }`;
    cell.addEventListener("click", () => {
      customMiniCells[idx] = !customMiniCells[idx];
      SFX.click();
      renderCustomMiniGrid();
    });
    customMapGrid.appendChild(cell);
  });
}

renderCustomMiniGrid();

if (btnClearCustomMap) {
  btnClearCustomMap.addEventListener("click", () => {
    SFX.click();
    customMiniCells = Array(50).fill(false);
    renderCustomMiniGrid();
  });
}

document.querySelectorAll(".map-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    SFX.click();
    currentMap = btn.getAttribute("data-map") || "classic";
    document.querySelectorAll(".map-btn").forEach((b) => {
      b.className = "map-btn py-1.5 rounded-xl text-[10px] font-black transition text-white/60 hover:text-white";
    });
    btn.className = "map-btn py-1.5 rounded-xl text-[10px] font-black transition bg-[#2ecc71] text-slate-950 shadow";

    if (customMapBox) {
      customMapBox.classList.toggle("hidden", currentMap !== "custom");
    }
  });
});

if (hardcoreToggleBtn) {
  hardcoreToggleBtn.addEventListener("click", () => {
    hardcoreMode = !hardcoreMode;
    hardcoreToggleBtn.textContent = hardcoreMode ? "ON ☠️" : "OFF";
    hardcoreToggleBtn.className = hardcoreMode
      ? "bg-red-500 text-white border border-red-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase transition shadow-[0_0_12px_rgba(239,68,68,0.5)]"
      : "bg-white/10 border border-white/20 text-white/60 px-3 py-1 rounded-lg text-[10px] font-black uppercase transition";
    playTone(hardcoreMode ? 740 : 340, "sine", 0.1);
  });
}

function buildMapObstacles() {
  obstacles = [];
  if (currentMap === "maze") {
    const coords = [
      [4, 4], [5, 4], [10, 4], [11, 4],
      [4, 11], [5, 11], [10, 11], [11, 11],
      [7, 7], [8, 7], [7, 8], [8, 8]
    ];
    coords.forEach(([x, y]) => obstacles.push({ x, y }));
  } else if (currentMap === "custom") {
    customMiniCells.forEach((active, idx) => {
      if (active) {
        const x = (idx % 10) + 3;
        const y = Math.floor(idx / 10) + 5;
        obstacles.push({ x, y });
      }
    });
  }
}

/* ==================== FEATURE 4: GLOBAL LEADERBOARD ==================== */
if (btnOpenLeaderboard) {
  btnOpenLeaderboard.addEventListener("click", async () => {
    SFX.click();
    showScreen("leaderboard");
    leaderboardList.innerHTML = `<div class="text-xs text-white/50 text-center py-6 animate-pulse">⏳ Loading top vipers...</div>`;

    const records = window._snakeFirebase?.fetchLeaderboard
      ? await window._snakeFirebase.fetchLeaderboard()
      : [];

    if (!records.length) {
      leaderboardList.innerHTML = `<div class="text-xs text-white/50 text-center py-6">No scores yet. Play a match to claim #1!</div>`;
      return;
    }

    leaderboardList.innerHTML = "";
    records.forEach((rec, idx) => {
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
      const skinIcon = SKINS[rec.skin]?.icon || "🐍";
      const rankInfo = getRankDetails(rec.score);
      const row = document.createElement("div");
      row.className = "flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs";
      row.innerHTML = `
        <div class="flex items-center gap-2.5">
          <span class="font-black text-sm w-6">${medal}</span>
          <span class="text-base">${skinIcon}</span>
          <div>
            <div class="font-bold text-white flex items-center gap-1">
              <span>${rec.name || "Viper"}</span>
              <span class="text-[9px] text-white/40">${rec.isCloud ? "☁️" : "👤"}</span>
            </div>
            <div class="text-[9px] text-emerald-300/80 font-semibold">${rankInfo.title} • 🍎 ${rec.apples || 0}</div>
          </div>
        </div>
        <div class="font-['Orbitron'] font-black text-sm text-[#ffd700]">${rec.score} <span class="text-[9px] text-white/50">PTS</span></div>
      `;
      leaderboardList.appendChild(row);
    });
  });
}

btnBackFromLeaderboard.addEventListener("click", () => {
  SFX.click();
  showScreen("menu");
});

/* ==================== SCREEN NAVIGATION ==================== */
function showScreen(screenName) {
  mainMenuScreen.classList.add("hidden");
  onlineLobbyScreen.classList.add("hidden");
  botMenuScreen.classList.add("hidden");
  leaderboardScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  mapSelectorBar.classList.add("hidden");

  if (screenName === "menu") {
    stopGameLoop();
    clearAllCountdowns();
    mainMenuScreen.classList.remove("hidden");
    mapSelectorBar.classList.remove("hidden");
    subHeaderText.textContent = "Select Battle Mode";
  } else if (screenName === "lobby") {
    onlineLobbyScreen.classList.remove("hidden");
    onlineLobbyScreen.classList.add("flex");
    mapSelectorBar.classList.remove("hidden");
    subHeaderText.textContent = "Online Multiplayer Lobby";
  } else if (screenName === "botMenu") {
    botMenuScreen.classList.remove("hidden");
    botMenuScreen.classList.add("flex");
    mapSelectorBar.classList.remove("hidden");
    subHeaderText.textContent = "Choose AI Snake Difficulty";
  } else if (screenName === "leaderboard") {
    leaderboardScreen.classList.remove("hidden");
    leaderboardScreen.classList.add("flex");
    subHeaderText.textContent = "Global Top 10 Vipers";
  } else if (screenName === "game") {
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("flex");
    subHeaderText.textContent = gameMode === "online" ? `Room Code: ${roomCode}` : `${currentMap.toUpperCase()} ARENA`;
    if (hardcoreActiveTag) hardcoreActiveTag.classList.toggle("hidden", !hardcoreMode);
    if (fogBtnLabel) fogBtnLabel.textContent = gameMode === "online" ? "Fog Cloud" : "Freeze Bot";
    if (shockBtnLabel) shockBtnLabel.textContent = gameMode === "online" ? "Shockwave" : "Trim Tail";
    rivalScoreWrap.classList.toggle("hidden", gameMode === "solo");
    emojiBar.classList.toggle("hidden", gameMode !== "online");
    emojiBar.classList.toggle("flex", gameMode === "online");
  }
}

document.getElementById("btnGoOnline").addEventListener("click", () => {
  SFX.click();
  createdRoomBox.classList.add("hidden");
  lobbyErrorMsg.classList.add("hidden");
  showScreen("lobby");
});

document.getElementById("btnGoBot").addEventListener("click", () => {
  SFX.click();
  showScreen("botMenu");
});

document.getElementById("btnGoOffline").addEventListener("click", () => {
  SFX.click();
  gameMode = "solo";
  activeModeBadge.textContent = "SOLO ARCADE";
  showScreen("game");
  startCountdownSequence();
});

document.getElementById("btnBackFromLobby").addEventListener("click", () => {
  SFX.click();
  cleanupOnlineRoom();
  showScreen("menu");
});

document.getElementById("btnBackFromBot").addEventListener("click", () => {
  SFX.click();
  showScreen("menu");
});

document.getElementById("btnLeaveGame").addEventListener("click", () => {
  SFX.click();
  cleanupOnlineRoom();
  showScreen("menu");
});

document.querySelectorAll(".bot-diff-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    SFX.click();
    botDifficulty = btn.getAttribute("data-diff") || "medium";
    gameMode = "bot";
    activeModeBadge.textContent = `VS BOT (${botDifficulty.toUpperCase()})`;
    showScreen("game");
    startCountdownSequence();
  });
});

/* ==================== FEATURE 1: FRENZY COMBO METER ==================== */
function updateFrenzyUI() {
  const pct = Math.min(100, Math.round((frenzyCount / FRENZY_TARGET) * 100));
  if (frenzyBarFill) frenzyBarFill.style.width = `${pct}%`;

  if (frenzyActive) {
    frenzyStatusLabel.textContent = `🔥 OVERDRIVE ACTIVE! (${frenzyCount} STREAK)`;
    frenzyStatusLabel.className = "text-[#ffd700] uppercase tracking-wider animate-pulse";
    frenzyMultiplierBadge.textContent = "⚡ 2x SCORE BOOST";
    frenzyMultiplierBadge.className = "text-[#00f0ff] font-black";
    arenaWrapper.classList.add("arena-frenzy-glow");
  } else {
    frenzyStatusLabel.textContent = `🔥 Frenzy Combo Meter (${frenzyCount}/${FRENZY_TARGET})`;
    frenzyStatusLabel.className = "text-white/60 uppercase tracking-wider";
    frenzyMultiplierBadge.textContent = "1x Points";
    frenzyMultiplierBadge.className = "text-white/40";
    arenaWrapper.classList.remove("arena-frenzy-glow");
  }
}

/* ==================== FEATURE 2: POWER-UPS & ONLINE SABOTAGES ==================== */
function resetPowerUps() {
  magnetAvailable = true;
  magnetUntil = 0;
  fogAvailable = true;
  shockAvailable = true;
  botFrozenUntil = 0;
  fogOverlay.classList.add("hidden");
  arenaWrapper.classList.remove("shockwave-shake");
  hazardBanner.classList.add("hidden");
  updatePowerUpUI();
}

function updatePowerUpUI() {
  btnPowerMagnet.disabled = !magnetAvailable;
  btnPowerMagnet.style.opacity = magnetAvailable ? "1" : "0.35";
  btnPowerFog.disabled = !fogAvailable;
  btnPowerFog.style.opacity = fogAvailable ? "1" : "0.35";
  btnPowerShock.disabled = !shockAvailable;
  btnPowerShock.style.opacity = shockAvailable ? "1" : "0.35";
}

function showHazardAlert(text, bgClass = "bg-red-600/90", duration = 2200) {
  hazardBanner.textContent = text;
  hazardBanner.className = `absolute inset-x-0 top-0 ${bgClass} text-white text-[10px] font-black text-center py-1 uppercase tracking-widest z-30`;
  setTimeout(() => hazardBanner.classList.add("hidden"), duration);
}

// 1. Magnet Power-Up
btnPowerMagnet.addEventListener("click", () => {
  if (!magnetAvailable || isGameOver || !gameStarted) return;
  magnetAvailable = false;
  magnetUntil = Date.now() + 5000;
  updatePowerUpUI();
  SFX.magnet();
  if (typeof window.triggerBgPulse === "function") window.triggerBgPulse("#ffd700");
  showHazardAlert("🧲 APPLE MAGNET ACTIVE FOR 5s!", "bg-amber-600/90", 2000);
});

// 2. Fog Sabotage (Online) / Freeze Bot Snake (Bot Mode)
btnPowerFog.addEventListener("click", () => {
  if (!fogAvailable || isGameOver || !gameStarted) return;
  fogAvailable = false;
  updatePowerUpUI();
  SFX.fog();
  if (typeof window.triggerBgPulse === "function") window.triggerBgPulse("#00f0ff");

  if (gameMode === "online" && conn && conn.open) {
    conn.send({ type: "SABOTAGE", weapon: "FOG" });
    showHazardAlert("🌫️ SENT FOG CLOUD TO FRIEND!", "bg-cyan-600/90", 1800);
  } else {
    botFrozenUntil = Date.now() + 4500;
    showHazardAlert("❄️ RIVAL BOT FROZEN FOR 4.5s!", "bg-cyan-600/90", 2000);
  }
});

// 3. Shockwave Sabotage (Online) / Trim Own Tail to Escape (Solo/Bot)
btnPowerShock.addEventListener("click", () => {
  if (!shockAvailable || isGameOver || !gameStarted) return;
  shockAvailable = false;
  updatePowerUpUI();
  SFX.shockwave();
  if (typeof window.triggerBgPulse === "function") window.triggerBgPulse("#a855f7");

  if (gameMode === "online" && conn && conn.open) {
    conn.send({ type: "SABOTAGE", weapon: "SHOCK" });
    showHazardAlert("💥 SENT SHOCKWAVE TO FRIEND!", "bg-purple-600/90", 1800);
  } else {
    if (snake.length > 4) {
      snake.splice(-3, 3);
    }
    showHazardAlert("✂️ SHED 3 TAIL SEGMENTS FOR SPEED!", "bg-purple-600/90", 2000);
  }
});

/* ==================== ONLINE MULTIPLAYER (PEERJS) ==================== */
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function spawnFloatingEmoji(emoji) {
  const el = document.createElement("div");
  el.className = "floating-emoji";
  el.textContent = emoji;
  el.style.left = `${20 + Math.random() * 60}%`;
  emojiFloatContainer.appendChild(el);
  playTone(720, "sine", 0.08, 0.08);
  setTimeout(() => el.remove(), 2000);
}

document.querySelectorAll(".emoji-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const emoji = btn.getAttribute("data-emoji");
    spawnFloatingEmoji(emoji);
    if (gameMode === "online" && conn && conn.open) {
      conn.send({ type: "EMOJI", emoji });
    }
  });
});

btnCreateRoom.addEventListener("click", () => {
  if (typeof window.Peer === "undefined") {
    lobbyErrorMsg.textContent = "Loading multiplayer engine... Tap again in 1s.";
    lobbyErrorMsg.classList.remove("hidden");
    return;
  }

  cleanupOnlineRoom();
  lobbyErrorMsg.classList.add("hidden");
  btnCreateRoom.textContent = "⏳ Generating Code...";
  btnCreateRoom.disabled = true;

  roomCode = generateRoomCode();
  peer = new window.Peer(`sat289-snk-${roomCode}`);

  peer.on("open", () => {
    btnCreateRoom.textContent = "⚡ Generate Room Code";
    btnCreateRoom.disabled = false;
    generatedCodeText.textContent = roomCode;
    createdRoomBox.classList.remove("hidden");
    SFX.click();
  });

  peer.on("connection", (incomingConn) => {
    conn = incomingConn;
    setupPeerConnection();
  });

  peer.on("error", (err) => {
    btnCreateRoom.textContent = "⚡ Generate Room Code";
    btnCreateRoom.disabled = false;
    lobbyErrorMsg.textContent = "Error: " + (err.type || "Try again.");
    lobbyErrorMsg.classList.remove("hidden");
  });
});

btnCopyCode.addEventListener("click", () => {
  if (!roomCode) return;
  SFX.click();
  navigator.clipboard.writeText(roomCode);
  btnCopyCode.textContent = "✅ Copied!";
  setTimeout(() => (btnCopyCode.textContent = "📋 Copy"), 1500);
});

btnJoinRoom.addEventListener("click", () => {
  const inputCode = joinCodeInput.value.trim().toUpperCase();
  if (inputCode.length !== 6) {
    lobbyErrorMsg.textContent = "Enter a valid 6-character code.";
    lobbyErrorMsg.classList.remove("hidden");
    return;
  }

  if (typeof window.Peer === "undefined") {
    lobbyErrorMsg.textContent = "Loading multiplayer engine... Tap again in 1s.";
    lobbyErrorMsg.classList.remove("hidden");
    return;
  }

  cleanupOnlineRoom();
  lobbyErrorMsg.classList.add("hidden");
  btnJoinRoom.textContent = "⏳...";
  btnJoinRoom.disabled = true;

  roomCode = inputCode;
  peer = new window.Peer();

  peer.on("open", () => {
    conn = peer.connect(`sat289-snk-${roomCode}`, { reliable: true });
    setupPeerConnection();
  });

  peer.on("error", () => {
    btnJoinRoom.textContent = "JOIN";
    btnJoinRoom.disabled = false;
    lobbyErrorMsg.textContent = "Room not found! Check the code.";
    lobbyErrorMsg.classList.remove("hidden");
  });
});

function setupPeerConnection() {
  if (!conn) return;

  conn.on("open", () => {
    btnJoinRoom.textContent = "JOIN";
    btnJoinRoom.disabled = false;
    opponentConnected = true;
    conn.send({ type: "HELLO", name: getPlayerName() });
  });

  conn.on("data", (data) => {
    if (!data || !data.type) return;

    if (data.type === "HELLO") {
      opponentConnected = true;
      conn.send({
        type: "START",
        currentMap,
        hardcoreMode,
        customMiniCells
      });
      startOnlineBattleUI();
    } else if (data.type === "START") {
      currentMap = data.currentMap || "classic";
      hardcoreMode = !!data.hardcoreMode;
      if (Array.isArray(data.customMiniCells)) {
        customMiniCells = data.customMiniCells;
      }
      startOnlineBattleUI();
    } else if (data.type === "SCORE_SYNC") {
      rivalScore = data.score || 0;
      rivalScoreEl.textContent = rivalScore;
      if (Array.isArray(data.snake)) {
        botSnake = data.snake;
      }
    } else if (data.type === "SABOTAGE") {
      if (data.weapon === "FOG") {
        fogOverlay.classList.remove("hidden");
        showHazardAlert("🌫️ FRIEND BLINDED YOU WITH FOG!", "bg-cyan-700/90", 3500);
        SFX.fog();
        setTimeout(() => fogOverlay.classList.add("hidden"), 3500);
      } else if (data.weapon === "SHOCK") {
        arenaWrapper.classList.add("shockwave-shake");
        showHazardAlert("💥 HIT BY FRIEND'S SHOCKWAVE!", "bg-purple-700/90", 2500);
        SFX.shockwave();
        setTimeout(() => arenaWrapper.classList.remove("shockwave-shake"), 2500);
      }
    } else if (data.type === "OPPONENT_CRASHED") {
      showHazardAlert("🏆 FRIEND CRASHED! YOU WIN THE ROUND!", "bg-emerald-600/90", 3000);
      SFX.win();
      if (typeof confetti === "function") confetti();
    } else if (data.type === "EMOJI") {
      spawnFloatingEmoji(data.emoji);
    }
  });

  conn.on("close", () => {
    if (gameMode === "online" && !gameScreen.classList.contains("hidden")) {
      alert("Friend disconnected from the room.");
      cleanupOnlineRoom();
      showScreen("menu");
    }
  });
}

function startOnlineBattleUI() {
  gameMode = "online";
  activeModeBadge.textContent = "ONLINE • 1V1 ARENA";
  showScreen("game");
  startCountdownSequence();
}

function cleanupOnlineRoom() {
  stopGameLoop();
  clearAllCountdowns();
  if (conn) {
    try { conn.close(); } catch (e) {}
    conn = null;
  }
  if (peer) {
    try { peer.destroy(); } catch (e) {}
    peer = null;
  }
  roomCode = null;
  opponentConnected = false;
}

/* ==================== COUNTDOWN & GAME INITIALIZATION ==================== */
function clearAllCountdowns() {
  countdownTimers.forEach((t) => clearTimeout(t));
  countdownTimers = [];
}

function resetArenaEntities() {
  buildMapObstacles();

  snake = [
    { x: 4, y: 8 },
    { x: 3, y: 8 },
    { x: 2, y: 8 }
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };

  if (gameMode === "bot") {
    botSnake = [
      { x: 11, y: 4 },
      { x: 12, y: 4 },
      { x: 13, y: 4 }
    ];
    botDir = { x: -1, y: 0 };
  } else {
    botSnake = [];
  }

  currentScore = 0;
  rivalScore = 0;
  applesEaten = 0;
  frenzyCount = 0;
  frenzyActive = false;
  lastAppleTime = 0;
  poisonSkulls = [];
  particles = [];
  isGameOver = false;
  gameStarted = false;

  liveScoreEl.textContent = "0";
  rivalScoreEl.textContent = "0";
  gameOverOverlay.classList.add("hidden");
  resetPowerUps();
  updateFrenzyUI();
  spawnApple();
  if (hardcoreMode) spawnPoisonSkull();
  drawArena();
}

function startCountdownSequence() {
  clearAllCountdowns();
  stopGameLoop();
  resetArenaEntities();

  lightRed.className = "w-2.5 h-2.5 rounded-full bg-red-500 border border-red-500 shadow-[0_0_10px_#ef4444]";
  lightYellow.className = "w-2.5 h-2.5 rounded-full bg-amber-400/30 border border-amber-400/50";
  lightGreen.className = "w-2.5 h-2.5 rounded-full bg-emerald-400/30 border border-emerald-400/50";
  gameStatusText.textContent = "READY...";
  gameStatusText.className = "text-[11px] font-black text-red-400 ml-1";
  playTone(320, "sine", 0.12);

  const t1 = setTimeout(() => {
    lightYellow.className = "w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-400 shadow-[0_0_10px_#fbbf24]";
    gameStatusText.textContent = "SET...";
    gameStatusText.className = "text-[11px] font-black text-amber-400 ml-1";
    playTone(480, "sine", 0.12);
  }, 650);

  const t2 = setTimeout(() => {
    activateGreenStart();
  }, 1300);

  countdownTimers.push(t1, t2);
}

function activateGreenStart() {
  if (gameStarted || isGameOver) return;
  clearAllCountdowns();
  lightRed.className = "w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/50";
  lightYellow.className = "w-2.5 h-2.5 rounded-full bg-amber-400/30 border border-amber-400/50";
  lightGreen.className = "w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-400 shadow-[0_0_12px_#2ecc71]";
  gameStatusText.textContent = "GO! SLITHER!";
  gameStatusText.className = "text-[11px] font-black text-[#2ecc71] ml-1";
  playTone(880, "sine", 0.2, 0.16);

  gameStarted = true;
  scheduleNextTick();
}

function stopGameLoop() {
  if (gameLoopTimer) {
    clearTimeout(gameLoopTimer);
    gameLoopTimer = null;
  }
}

function scheduleNextTick() {
  stopGameLoop();
  if (isGameOver || !gameStarted) return;

  let baseSpeed = hardcoreMode ? 115 : 135;
  const speedReduction = Math.min(45, applesEaten * 2);
  const delay = Math.max(75, baseSpeed - speedReduction);

  gameLoopTimer = setTimeout(() => {
    updateGameTick();
    scheduleNextTick();
  }, delay);
}

/* ==================== SPAWN HELPERS ==================== */
function isCellOccupied(x, y) {
  if (snake.some((s) => s.x === x && s.y === y)) return true;
  if (botSnake.some((s) => s.x === x && s.y === y)) return true;
  if (obstacles.some((o) => o.x === x && o.y === y)) return true;
  if (poisonSkulls.some((p) => p.x === x && p.y === y)) return true;
  return false;
}

function spawnApple() {
  for (let tries = 0; tries < 100; tries++) {
    const x = Math.floor(Math.random() * GRID_COUNT);
    const y = Math.floor(Math.random() * GRID_COUNT);
    if (!isCellOccupied(x, y)) {
      apple = { x, y, golden: Math.random() < 0.2 };
      return;
    }
  }
}

function spawnPoisonSkull() {
  if (poisonSkulls.length >= 3) return;
  for (let tries = 0; tries < 60; tries++) {
    const x = Math.floor(Math.random() * GRID_COUNT);
    const y = Math.floor(Math.random() * GRID_COUNT);
    if (!isCellOccupied(x, y) && (x !== apple.x || y !== apple.y)) {
      poisonSkulls.push({ x, y });
      return;
    }
  }
}

function createBurstParticles(gridX, gridY, color) {
  const cx = gridX * TILE_SIZE + TILE_SIZE / 2;
  const cy = gridY * TILE_SIZE + TILE_SIZE / 2;
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: cx,
      y: cy,
      vx: (Math.random() - 0.5) * 5.5,
      vy: (Math.random() - 0.5) * 5.5,
      life: 1,
      color
    });
  }
}

/* ==================== MAIN GAME TICK & AI PATHFINDING ==================== */
function updateGameTick() {
  dir = { ...nextDir };

  // Magnet Pull Effect
  if (Date.now() < magnetUntil && snake.length > 0) {
    const head = snake[0];
    const dx = Math.sign(head.x - apple.x);
    const dy = Math.sign(head.y - apple.y);
    const nx = apple.x + dx;
    const ny = apple.y + dy;
    if (!obstacles.some((o) => o.x === nx && o.y === ny)) {
      apple.x = nx;
      apple.y = ny;
    }
  }

  // Calculate Player Next Head
  let newHead = {
    x: snake[0].x + dir.x,
    y: snake[0].y + dir.y
  };

  // Wall Wrapping vs Deadly Walls
  const allowWrap = currentMap === "portal" && !hardcoreMode;
  if (allowWrap) {
    newHead.x = (newHead.x + GRID_COUNT) % GRID_COUNT;
    newHead.y = (newHead.y + GRID_COUNT) % GRID_COUNT;
  } else {
    if (newHead.x < 0 || newHead.x >= GRID_COUNT || newHead.y < 0 || newHead.y >= GRID_COUNT) {
      return triggerGameOver("CRASHED INTO WALL!");
    }
  }

  // Check Obstacle Collision
  if (obstacles.some((o) => o.x === newHead.x && o.y === newHead.y)) {
    return triggerGameOver("HIT AN OBSTACLE BLOCK!");
  }

  // Check Self or Bot Collision
  if (snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
    return triggerGameOver("BIT YOUR OWN TAIL!");
  }

  if (gameMode === "bot" && botSnake.some((b) => b.x === newHead.x && b.y === newHead.y)) {
    return triggerGameOver("CRASHED INTO RIVAL BOT!");
  }

  // Check Poison Skull Collision (Hardcore Mode)
  const skullIdx = poisonSkulls.findIndex((p) => p.x === newHead.x && p.y === newHead.y);
  if (skullIdx !== -1) {
    return triggerGameOver("☠️ ATE A POISON SKULL!");
  }

  snake.unshift(newHead);

  // Check Apple Eaten
  if (newHead.x === apple.x && newHead.y === apple.y) {
    applesEaten++;
    const wasGolden = apple.golden;
    const now = Date.now();
    const justTriggeredFrenzy = !frenzyActive && (now - lastAppleTime <= 4500) && (frenzyCount + 1 >= FRENZY_TARGET);

    if (now - lastAppleTime <= 4500) {
      frenzyCount++;
      if (frenzyCount >= FRENZY_TARGET) frenzyActive = true;
    } else {
      frenzyCount = 1;
      frenzyActive = false;
    }
    lastAppleTime = now;
    updateFrenzyUI();

    const basePts = wasGolden ? 25 : 10;
    const earned = frenzyActive ? basePts * 2 : basePts;
    currentScore += earned;
    liveScoreEl.textContent = currentScore;

    // Trigger SFX & 2D Background Pulse Ring
    if (justTriggeredFrenzy) {
      SFX.frenzy();
      if (typeof window.triggerBgPulse === "function") window.triggerBgPulse("#ffd700");
    } else if (wasGolden) {
      SFX.goldenEat();
      if (typeof window.triggerBgPulse === "function") window.triggerBgPulse("#ffd700");
    } else {
      SFX.eat(frenzyCount);
      if (typeof window.triggerBgPulse === "function") window.triggerBgPulse("#2ecc71");
    }

    createBurstParticles(apple.x, apple.y, wasGolden ? "#ffd700" : "#ff4757");
    spawnApple();
    if (hardcoreMode && applesEaten % 3 === 0) spawnPoisonSkull();
  } else {
    snake.pop();
    if (lastAppleTime > 0 && Date.now() - lastAppleTime > 4500 && frenzyCount > 0) {
      frenzyCount = 0;
      frenzyActive = false;
      updateFrenzyUI();
    }
  }

  // Update AI Bot Snake in Bot Mode
  if (gameMode === "bot" && Date.now() >= botFrozenUntil) {
    updateBotSnake();
  }

  // Sync Online Progress
  if (gameMode === "online" && conn && conn.open) {
    conn.send({
      type: "SCORE_SYNC",
      score: currentScore,
      snake: snake.slice(0, 12)
    });
  }

  drawArena();
}

function updateBotSnake() {
  if (!botSnake.length) return;
  const bHead = botSnake[0];
  const possibleDirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ].filter((d) => !(d.x === -botDir.x && d.y === -botDir.y));

  const safeDirs = possibleDirs.filter((d) => {
    const nx = (bHead.x + d.x + GRID_COUNT) % GRID_COUNT;
    const ny = (bHead.y + d.y + GRID_COUNT) % GRID_COUNT;
    if (obstacles.some((o) => o.x === nx && o.y === ny)) return false;
    if (botSnake.some((s) => s.x === nx && s.y === ny)) return false;
    if (snake.some((s) => s.x === nx && s.y === ny)) return false;
    return true;
  });

  const choices = safeDirs.length > 0 ? safeDirs : possibleDirs;
  const smartChance = botDifficulty === "easy" ? 0.5 : botDifficulty === "medium" ? 0.8 : 0.96;

  if (Math.random() < smartChance) {
    choices.sort((a, b) => {
      const distA = Math.abs(bHead.x + a.x - apple.x) + Math.abs(bHead.y + a.y - apple.y);
      const distB = Math.abs(bHead.x + b.x - apple.x) + Math.abs(bHead.y + b.y - apple.y);
      return distA - distB;
    });
  }

  botDir = choices[0];
  const nextBotHead = {
    x: (bHead.x + botDir.x + GRID_COUNT) % GRID_COUNT,
    y: (bHead.y + botDir.y + GRID_COUNT) % GRID_COUNT
  };

  botSnake.unshift(nextBotHead);
  if (nextBotHead.x === apple.x && nextBotHead.y === apple.y) {
    rivalScore += apple.golden ? 25 : 10;
    rivalScoreEl.textContent = rivalScore;
    createBurstParticles(apple.x, apple.y, "#ff007f");
    spawnApple();
  } else {
    botSnake.pop();
  }
}

function triggerGameOver(reason) {
  isGameOver = true;
  gameStarted = false;
  stopGameLoop();
  SFX.crash();
  if (typeof window.triggerBgPulse === "function") window.triggerBgPulse("#ff3838");

  if (gameMode === "online" && conn && conn.open) {
    conn.send({ type: "OPPONENT_CRASHED" });
  }

  const wonMatch = gameMode === "solo" ? currentScore >= 50 : currentScore >= rivalScore;
  if (wonMatch && currentScore > 0) {
    winStreak++;
    if (streakBadge) {
      streakBadge.textContent = `🔥 ${winStreak}`;
      streakBadge.classList.remove("hidden");
    }
    setTimeout(() => SFX.win(), 350);
    if (typeof confetti === "function") confetti({ particleCount: 60, spread: 60 });
  } else {
    winStreak = 0;
    if (streakBadge) streakBadge.classList.add("hidden");
  }

  gameOverTitle.textContent = reason;
  finalScoreEl.textContent = currentScore;
  finalApplesEl.textContent = applesEaten;
  gameOverOverlay.classList.remove("hidden");

  if (typeof window.submitScore === "function") {
    window.submitScore(currentScore, {
      apples: applesEaten,
      streak: winStreak,
      skin: selectedSkin
    });
  }
  refreshSkinAndRank();
}

/* ==================== RENDER FLAT 2D ARENA CANVAS ==================== */
function drawArena() {
  ctx.fillStyle = "#09131f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle Cyber Grid Lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(i * TILE_SIZE, 0);
    ctx.lineTo(i * TILE_SIZE, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * TILE_SIZE);
    ctx.lineTo(canvas.width, i * TILE_SIZE);
    ctx.stroke();
  }

  // Draw Obstacles
  obstacles.forEach((o) => {
    ctx.fillStyle = "#334155";
    ctx.fillRect(o.x * TILE_SIZE + 1, o.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    ctx.strokeStyle = "#64748b";
    ctx.strokeRect(o.x * TILE_SIZE + 2, o.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  });

  // Draw Poison Skulls (Hardcore Mode)
  poisonSkulls.forEach((p) => {
    ctx.font = "15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("☠️", p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2 + 1);
  });

  // Draw Apple
  ctx.save();
  const ax = apple.x * TILE_SIZE + TILE_SIZE / 2;
  const ay = apple.y * TILE_SIZE + TILE_SIZE / 2;
  ctx.shadowColor = apple.golden ? "#ffd700" : "#ff4757";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(ax, ay, TILE_SIZE * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = apple.golden ? "#ffd700" : "#ff4757";
  ctx.fill();
  ctx.restore();

  // Draw Rival / Online Ghost Snake
  botSnake.forEach((seg, idx) => {
    ctx.fillStyle = idx === 0 ? "#ff007f" : "#be185d";
    ctx.beginPath();
    ctx.roundRect(seg.x * TILE_SIZE + 2, seg.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4, 5);
    ctx.fill();
  });

  // Draw Player Snake
  const skin = SKINS[selectedSkin] || SKINS.viper;
  snake.forEach((seg, idx) => {
    ctx.save();
    if (idx === 0) {
      ctx.shadowColor = frenzyActive ? "#ffd700" : skin.glow;
      ctx.shadowBlur = frenzyActive ? 16 : 10;
      ctx.fillStyle = frenzyActive ? "#ffd700" : skin.head;
    } else {
      ctx.fillStyle = skin.body;
    }
    ctx.beginPath();
    ctx.roundRect(seg.x * TILE_SIZE + 1.5, seg.y * TILE_SIZE + 1.5, TILE_SIZE - 3, TILE_SIZE - 3, idx === 0 ? 6 : 4);
    ctx.fill();

    // Eyes on Snake Head
    if (idx === 0) {
      ctx.fillStyle = "#070b14";
      ctx.beginPath();
      ctx.arc(seg.x * TILE_SIZE + 7, seg.y * TILE_SIZE + 7, 2, 0, Math.PI * 2);
      ctx.arc(seg.x * TILE_SIZE + 13, seg.y * TILE_SIZE + 7, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });

  // Update & Draw Burst Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.life -= 0.08;
    if (pt.life <= 0) {
      particles.splice(i, 1);
    } else {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life;
      ctx.fillRect(pt.x, pt.y, 3, 3);
      ctx.globalAlpha = 1;
    }
  }
}

/* ==================== CONTROLS (KEYBOARD, D-PAD & TOUCH SWIPE) ==================== */
function setDirection(newDirStr) {
  if (!gameStarted && !isGameOver && !gameScreen.classList.contains("hidden")) {
    activateGreenStart();
  }
  let changed = false;
  if (newDirStr === "UP" && dir.y === 0) { nextDir = { x: 0, y: -1 }; changed = true; }
  else if (newDirStr === "DOWN" && dir.y === 0) { nextDir = { x: 0, y: 1 }; changed = true; }
  else if (newDirStr === "LEFT" && dir.x === 0) { nextDir = { x: -1, y: 0 }; changed = true; }
  else if (newDirStr === "RIGHT" && dir.x === 0) { nextDir = { x: 1, y: 0 }; changed = true; }

  if (changed) SFX.turn();
}

window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (key === "arrowup" || key === "w") { e.preventDefault(); setDirection("UP"); }
  else if (key === "arrowdown" || key === "s") { e.preventDefault(); setDirection("DOWN"); }
  else if (key === "arrowleft" || key === "a") { e.preventDefault(); setDirection("LEFT"); }
  else if (key === "arrowright" || key === "d") { e.preventDefault(); setDirection("RIGHT"); }
});

document.querySelectorAll(".dpad-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const d = btn.getAttribute("data-dir");
    setDirection(d);
  });
});

// Touch Swipe on Canvas
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

canvas.addEventListener("touchend", (e) => {
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    setDirection(dx > 0 ? "RIGHT" : "LEFT");
  } else {
    setDirection(dy > 0 ? "DOWN" : "UP");
  }
}, { passive: true });

btnPlayAgain.addEventListener("click", () => {
  SFX.click();
  startCountdownSequence();
});

// Render initial preview board
resetArenaEntities();
