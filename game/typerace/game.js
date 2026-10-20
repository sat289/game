// Dynamically load PeerJS for instant online multiplayer room codes
const peerScript = document.createElement("script");
peerScript.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
document.head.appendChild(peerScript);

const getPlayerName = () => {
  if (window._trFirebase && typeof window._trFirebase.getPlayerName === "function") {
    return window._trFirebase.getPlayerName();
  }
  return localStorage.getItem("guestName") || localStorage.getItem("username") || "Guest Racer";
};

// Ride Skins
const SKINS = {
  f1: { icon: "🏎️", req: 0 },
  rocket: { icon: "🚀", req: 40 },
  ufo: { icon: "🛸", req: 65 },
  lightning: { icon: "⚡", req: 85 }
};

let selectedSkin = localStorage.getItem("typerace_skin") || "f1";

// Quote Categories
const TRACK_QUOTES = {
  classic: [
    "Speed and precision make a true racing champion on every track.",
    "The quick brown fox jumps over the lazy dog and races to the finish line.",
    "Never give up because great things take time, focus, and persistent effort.",
    "Champions keep playing until they get it right on every single lap."
  ],
  sprint: [
    "Push the nitro and fly past the checkered flag instantly.",
    "Quick reflexes separate the winners from the rest of the pack.",
    "Drift through every corner with absolute focus and confidence."
  ],
  coding: [
    "const speed = wpm * accuracy; console.log(speed);",
    "async function raceToFinish() { await nitroBoost(); }",
    "git commit -m \"Victory lap and new high score record!\""
  ]
};

// Core Race State
let currentTrack = "classic";
let targetText = TRACK_QUOTES.classic[0];
let typedText = "";
let startTime = null;
let wpm = 0;
let accuracy = 100;
let mistakes = 0;
let isFinished = false;
let raceStarted = false;
let winStreak = 0;
let countdownTimers = [];

// Feature 1: Combo Drift Meter State
let comboStreak = 0;
const DRIFT_TARGET = 15;
let driftBoostActive = false;
let bonusWordsEarned = 0;

// Feature 3: Hardcore Engine Stall State
let hardcoreMode = false;
let isStalled = false;
let stallTimeout = null;

// Feature 2: Power-Up & Sabotage State (1 per race)
let nitroAvailable = true;
let empAvailable = true;
let shockAvailable = true;

// Bot Race State
let gameMode = "bot"; // 'online' | 'bot' | 'pvp'
let botDifficulty = "medium"; // 'easy' | 'medium' | 'impossible'
let bot1Progress = 0;
let bot2Progress = 0;
let bot3Progress = 0;
let botInterval = null;
let empFrozenUntil = 0;

// Online Multiplayer State (PeerJS WebRTC)
let peer = null;
let conn = null;
let roomCode = null;
let opponentConnected = false;
let onlineNames = { host: "Host", guest: "Friend" };

// Audio State
let soundEnabled = true;
let musicPlaying = false;
const bgMusic = document.getElementById("bgMusic");
const musicToggleBtn = document.getElementById("musicToggleBtn");
const soundToggleBtn = document.getElementById("soundToggleBtn");

// DOM Elements
const mainMenuScreen = document.getElementById("mainMenuScreen");
const onlineLobbyScreen = document.getElementById("onlineLobbyScreen");
const botMenuScreen = document.getElementById("botMenuScreen");
const leaderboardScreen = document.getElementById("leaderboardScreen");
const gameScreen = document.getElementById("gameScreen");
const trackSelectorBar = document.getElementById("trackSelectorBar");
const subHeaderText = document.getElementById("subHeaderText");
const activeModeBadge = document.getElementById("activeModeBadge");
const hardcoreActiveTag = document.getElementById("hardcoreActiveTag");

const skinSelector = document.getElementById("skinSelector");
const rankBadge = document.getElementById("rankBadge");
const streakBadge = document.getElementById("streakBadge");

const customTrackBox = document.getElementById("customTrackBox");
const customTrackInput = document.getElementById("customTrackInput");
const customCharCount = document.getElementById("customCharCount");
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

const playerCar = document.getElementById("playerCar");
const bot1Car = document.getElementById("bot1Car");
const bot2Car = document.getElementById("bot2Car");
const bot3Car = document.getElementById("bot3Car");
const lane1Label = document.getElementById("lane1Label");
const lane2Label = document.getElementById("lane2Label");
const lane3Label = document.getElementById("lane3Label");
const lane4Label = document.getElementById("lane4Label");
const lane3Row = document.getElementById("lane3Row");
const lane4Row = document.getElementById("lane4Row");

const quoteBox = document.getElementById("quoteBox");
const hazardBanner = document.getElementById("hazardBanner");
const typedTextSpan = document.getElementById("typedTextSpan");
const currentCharSpan = document.getElementById("currentCharSpan");
const remainingTextSpan = document.getElementById("remainingTextSpan");
const typeInput = document.getElementById("typeInput");

const driftStatusLabel = document.getElementById("driftStatusLabel");
const driftMultiplierBadge = document.getElementById("driftMultiplierBadge");
const driftBarFill = document.getElementById("driftBarFill");

const liveWpm = document.getElementById("liveWpm");
const liveAcc = document.getElementById("liveAcc");
const mistakeCounter = document.getElementById("mistakeCounter");
const raceStatusText = document.getElementById("raceStatusText");
const lightRed = document.getElementById("lightRed");
const lightYellow = document.getElementById("lightYellow");
const lightGreen = document.getElementById("lightGreen");

const powerUpBar = document.getElementById("powerUpBar");
const btnPowerNitro = document.getElementById("btnPowerNitro");
const btnPowerEmp = document.getElementById("btnPowerEmp");
const empBtnLabel = document.getElementById("empBtnLabel");
const btnPowerShock = document.getElementById("btnPowerShock");
const emojiBar = document.getElementById("emojiBar");
const emojiFloatContainer = document.getElementById("emojiFloatContainer");

const activeControls = document.getElementById("activeControls");
const finishedBanner = document.getElementById("finishedBanner");
const finishHeadline = document.getElementById("finishHeadline");
const finalWpm = document.getElementById("finalWpm");
const finalAcc = document.getElementById("finalAcc");
const changeQuoteBtn = document.getElementById("changeQuoteBtn");
const nextRaceBtn = document.getElementById("nextRaceBtn");

/* ==================== FEATURE 6: RACER RANK BADGE & SKINS ==================== */
function getRankDetails(bestWpm) {
  if (bestWpm >= 85) {
    return { title: "💎 Cyber Legend", cls: "text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full whitespace-nowrap" };
  }
  if (bestWpm >= 60) {
    return { title: "🥇 Nitro Master", cls: "text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full whitespace-nowrap" };
  }
  if (bestWpm >= 35) {
    return { title: "🥈 Drift Pro", cls: "text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full whitespace-nowrap" };
  }
  return { title: "🥉 Street Rookie", cls: "text-[10px] font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full whitespace-nowrap" };
}

function refreshSkinAndRank() {
  const bestW = typeof window.score === "number" ? window.score : 0;

  if (rankBadge) {
    const r = getRankDetails(bestW);
    rankBadge.textContent = r.title;
    rankBadge.className = r.cls;
  }

  if (!skinSelector) return;
  Array.from(skinSelector.options).forEach((opt) => {
    const key = opt.value;
    const req = SKINS[key]?.req || 0;
    opt.disabled = bestW < req;
  });

  if (bestW < (SKINS[selectedSkin]?.req || 0)) {
    selectedSkin = "f1";
  }
  skinSelector.value = selectedSkin;
}

window.onScoreUpdated = () => {
  refreshSkinAndRank();
};

if (skinSelector) {
  skinSelector.addEventListener("change", (e) => {
    const chosen = e.target.value;
    const bestW = typeof window.score === "number" ? window.score : 0;
    if (bestW >= (SKINS[chosen]?.req || 0)) {
      selectedSkin = chosen;
      localStorage.setItem("typerace_skin", chosen);
      playTone(650, "sine", 0.1);
      updateTracksUI();
    }
  });
}

refreshSkinAndRank();

/* ==================== SOUND & DYNAMIC ENGINE AUDIO ==================== */
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioContextClass ? new AudioContextClass() : null;

function playTone(freq, type = "sine", duration = 0.08, gainVal = 0.1) {
  if (!soundEnabled || !audioCtx) return;
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// Dynamic Engine Pitch scales with WPM & Combo Streak
function playEngineKeystrokeSound() {
  const basePitch = 360 + Math.min(450, wpm * 3.5) + (comboStreak * 8);
  playTone(basePitch, driftBoostActive ? "sawtooth" : "triangle", 0.045, 0.06);
}

if (soundToggleBtn) {
  soundToggleBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.textContent = soundEnabled ? "🔊" : "🔇";
  });
}

if (musicToggleBtn) {
  musicToggleBtn.addEventListener("click", () => {
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
        musicToggleBtn.className = "bg-[#00f0ff]/20 border border-[#00f0ff] text-[#00f0ff] px-2 py-1 rounded-full text-[10px] font-bold transition";
      }).catch(() => {
        alert("Place song.mp3 inside creazy/song.mp3 or typerace/song.mp3!");
      });
    }
  });
}

/* ==================== FEATURE 5: CUSTOM TRACK & HARDCORE TOGGLE ==================== */
document.querySelectorAll(".track-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentTrack = btn.getAttribute("data-track") || "classic";
    document.querySelectorAll(".track-btn").forEach((b) => {
      b.className = "track-btn py-1.5 rounded-xl text-[10px] font-black transition text-white/60 hover:text-white";
    });
    btn.className = "track-btn py-1.5 rounded-xl text-[10px] font-black transition bg-[#00f0ff] text-slate-950 shadow";

    if (customTrackBox) {
      customTrackBox.classList.toggle("hidden", currentTrack !== "custom");
    }
    playTone(550, "sine", 0.08);
  });
});

if (customTrackInput) {
  customTrackInput.addEventListener("input", () => {
    if (customCharCount) {
      customCharCount.textContent = `${customTrackInput.value.length}/180`;
    }
  });
}

if (hardcoreToggleBtn) {
  hardcoreToggleBtn.addEventListener("click", () => {
    hardcoreMode = !hardcoreMode;
    hardcoreToggleBtn.textContent = hardcoreMode ? "ON 🔥" : "OFF";
    hardcoreToggleBtn.className = hardcoreMode
      ? "bg-red-500 text-white border border-red-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase transition shadow-[0_0_12px_rgba(239,68,68,0.5)]"
      : "bg-white/10 border border-white/20 text-white/60 px-3 py-1 rounded-lg text-[10px] font-black uppercase transition";
    playTone(hardcoreMode ? 740 : 340, "sine", 0.1);
  });
}

function getSelectedQuote() {
  if (currentTrack === "custom" && customTrackInput) {
    const cleaned = customTrackInput.value.trim().replace(/\s+/g, " ");
    if (cleaned.length >= 15) return cleaned;
  }
  const quotesList = TRACK_QUOTES[currentTrack] || TRACK_QUOTES.classic;
  return quotesList[Math.floor(Math.random() * quotesList.length)];
}

/* ==================== FEATURE 4: GLOBAL TOP 10 LEADERBOARD ==================== */
if (btnOpenLeaderboard) {
  btnOpenLeaderboard.addEventListener("click", async () => {
    playTone(620, "sine", 0.08);
    showScreen("leaderboard");
    leaderboardList.innerHTML = `<div class="text-xs text-white/50 text-center py-6 animate-pulse">⏳ Fetching global records...</div>`;

    const records = window._trFirebase?.fetchLeaderboard
      ? await window._trFirebase.fetchLeaderboard()
      : [];

    if (!records.length) {
      leaderboardList.innerHTML = `<div class="text-xs text-white/50 text-center py-6">No races recorded yet. Finish a race to claim #1!</div>`;
      return;
    }

    leaderboardList.innerHTML = "";
    records.forEach((rec, idx) => {
      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
      const carIcon = SKINS[rec.skin]?.icon || "🏎️";
      const rankInfo = getRankDetails(rec.wpm);
      const row = document.createElement("div");
      row.className = "flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs";
      row.innerHTML = `
        <div class="flex items-center gap-2.5">
          <span class="font-black text-sm w-6">${medal}</span>
          <span class="text-base">${carIcon}</span>
          <div>
            <div class="font-bold text-white flex items-center gap-1">
              <span>${rec.name || "Racer"}</span>
              <span class="text-[9px] text-white/40">${rec.isCloud ? "☁️" : "👤"}</span>
            </div>
            <div class="text-[9px] text-cyan-300/80 font-semibold">${rankInfo.title} • Acc: ${rec.acc || 100}%</div>
          </div>
        </div>
        <div class="font-['Orbitron'] font-black text-sm text-[#ffd700]">${rec.wpm} <span class="text-[9px] text-white/50">WPM</span></div>
      `;
      leaderboardList.appendChild(row);
    });
  });
}

if (btnBackFromLeaderboard) {
  btnBackFromLeaderboard.addEventListener("click", () => {
    showScreen("menu");
  });
}

/* ==================== SCREEN NAVIGATION ==================== */
function showScreen(screenName) {
  mainMenuScreen.classList.add("hidden");
  onlineLobbyScreen.classList.add("hidden");
  botMenuScreen.classList.add("hidden");
  leaderboardScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  trackSelectorBar.classList.add("hidden");

  if (screenName === "menu") {
    stopBotSimulation();
    clearAllCountdowns();
    mainMenuScreen.classList.remove("hidden");
    trackSelectorBar.classList.remove("hidden");
    subHeaderText.textContent = "Select Race Mode";
  } else if (screenName === "lobby") {
    onlineLobbyScreen.classList.remove("hidden");
    onlineLobbyScreen.classList.add("flex");
    trackSelectorBar.classList.remove("hidden");
    subHeaderText.textContent = "Online Multiplayer Lobby";
  } else if (screenName === "botMenu") {
    botMenuScreen.classList.remove("hidden");
    botMenuScreen.classList.add("flex");
    trackSelectorBar.classList.remove("hidden");
    subHeaderText.textContent = "Choose Bot Difficulty";
  } else if (screenName === "leaderboard") {
    leaderboardScreen.classList.remove("hidden");
    leaderboardScreen.classList.add("flex");
    subHeaderText.textContent = "Global Leaderboard";
  } else if (screenName === "game") {
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("flex");
    subHeaderText.textContent = gameMode === "online" ? `Room Code: ${roomCode}` : "Live Speed Track";
    if (hardcoreActiveTag) hardcoreActiveTag.classList.toggle("hidden", !hardcoreMode);
    if (empBtnLabel) empBtnLabel.textContent = gameMode === "online" ? "Smoke Fog" : "EMP Freeze";
    emojiBar.classList.toggle("hidden", gameMode !== "online");
    emojiBar.classList.toggle("flex", gameMode === "online");
  }
}

document.getElementById("btnGoOnline").addEventListener("click", () => {
  playTone(600, "sine", 0.08);
  createdRoomBox.classList.add("hidden");
  lobbyErrorMsg.classList.add("hidden");
  showScreen("lobby");
});

document.getElementById("btnGoBot").addEventListener("click", () => {
  playTone(600, "sine", 0.08);
  showScreen("botMenu");
});

document.getElementById("btnGoOffline").addEventListener("click", () => {
  playTone(600, "sine", 0.08);
  startOfflineOrGhostGame();
});

document.getElementById("btnBackFromLobby").addEventListener("click", () => {
  cleanupOnlineRoom();
  showScreen("menu");
});

document.getElementById("btnBackFromBot").addEventListener("click", () => {
  showScreen("menu");
});

document.getElementById("btnLeaveGame").addEventListener("click", () => {
  cleanupOnlineRoom();
  showScreen("menu");
});

document.querySelectorAll(".bot-diff-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    botDifficulty = btn.getAttribute("data-diff") || "medium";
    startBotRaceGame();
  });
});

/* ==================== FEATURE 1: COMBO DRIFT METER ==================== */
function updateDriftUI() {
  const pct = Math.min(100, Math.round((comboStreak / DRIFT_TARGET) * 100));
  if (driftBarFill) driftBarFill.style.width = `${pct}%`;

  if (driftBoostActive) {
    if (driftStatusLabel) {
      driftStatusLabel.textContent = `🔥 DRIFT OVERDRIVE ACTIVE! (${comboStreak} STREAK)`;
      driftStatusLabel.className = "text-[#ffd700] uppercase tracking-wider animate-pulse";
    }
    if (driftMultiplierBadge) {
      driftMultiplierBadge.textContent = "⚡ 1.25x WPM BOOST";
      driftMultiplierBadge.className = "text-[#00f0ff] font-black";
    }
    if (playerCar) playerCar.classList.add("car-drift-boost");
  } else {
    if (driftStatusLabel) {
      driftStatusLabel.textContent = `🔥 Combo Drift Meter (${comboStreak}/${DRIFT_TARGET})`;
      driftStatusLabel.className = "text-white/60 uppercase tracking-wider";
    }
    if (driftMultiplierBadge) {
      driftMultiplierBadge.textContent = "1.0x Speed";
      driftMultiplierBadge.className = "text-white/40";
    }
    if (playerCar) playerCar.classList.remove("car-drift-boost");
  }
}

/* ==================== FEATURE 2: POWER-UPS & ONLINE SABOTAGES ==================== */
function resetPowerUps() {
  nitroAvailable = true;
  empAvailable = true;
  shockAvailable = true;
  empFrozenUntil = 0;
  remainingTextSpan.classList.remove("smoke-fog");
  quoteBox.classList.remove("shockwave-shake", "stall-flash");
  hazardBanner.classList.add("hidden");
  updatePowerUpUI();
}

function updatePowerUpUI() {
  if (btnPowerNitro) {
    btnPowerNitro.disabled = !nitroAvailable;
    btnPowerNitro.style.opacity = nitroAvailable ? "1" : "0.35";
  }
  if (btnPowerEmp) {
    btnPowerEmp.disabled = !empAvailable;
    btnPowerEmp.style.opacity = empAvailable ? "1" : "0.35";
  }
  if (btnPowerShock) {
    btnPowerShock.disabled = !shockAvailable;
    btnPowerShock.style.opacity = shockAvailable ? "1" : "0.35";
  }
}

function showHazardAlert(text, bgClass, durationMs) {
  if (!hazardBanner) return;
  hazardBanner.textContent = text;
  hazardBanner.className = `absolute inset-x-0 top-0 ${bgClass} text-white text-[10px] font-black text-center py-0.5 uppercase tracking-widest z-20`;
  setTimeout(() => {
    hazardBanner.classList.add("hidden");
  }, durationMs);
}

// 1. Nitro Word Power-Up
btnPowerNitro.addEventListener("click", () => {
  if (!nitroAvailable || isFinished || !raceStarted) return;
  nitroAvailable = false;
  updatePowerUpUI();
  playTone(880, "triangle", 0.2, 0.2);

  if (!startTime) {
    startTime = Date.now();
    if (gameMode === "bot" || gameMode === "pvp") startBotSimulation();
  }

  const remaining = targetText.slice(typedText.length);
  const nextSpaceIdx = remaining.indexOf(" ");
  if (nextSpaceIdx !== -1) {
    typedText += remaining.slice(0, nextSpaceIdx + 1);
  } else {
    typedText = targetText;
  }

  typeInput.value = typedText;
  updateTextUI();
  updateTracksUI();
  syncOnlineProgress();
  checkRaceCompletion();
  typeInput.focus();
});

// 2. EMP Freeze (Solo) / Smoke Screen Fog (Online PvP)
btnPowerEmp.addEventListener("click", () => {
  if (!empAvailable || isFinished || !raceStarted) return;
  empAvailable = false;
  updatePowerUpUI();
  playTone(220, "sawtooth", 0.25, 0.18);

  if (gameMode === "online" && conn && conn.open) {
    conn.send({ type: "SABOTAGE", weapon: "SMOKE" });
  } else {
    empFrozenUntil = Date.now() + 3500;
    showHazardAlert("❄️ BOTS FROZEN FOR 3.5 SECONDS!", "bg-cyan-600/90", 2000);
  }
  typeInput.focus();
});

// 3. Shockwave Sabotage (Shakes online friend's screen OR pushes bots back 12%)
btnPowerShock.addEventListener("click", () => {
  if (!shockAvailable || isFinished || !raceStarted) return;
  shockAvailable = false;
  updatePowerUpUI();
  playTone(140, "sawtooth", 0.3, 0.22);

  if (gameMode === "online" && conn && conn.open) {
    conn.send({ type: "SABOTAGE", weapon: "SHOCKWAVE" });
  } else {
    bot1Progress = Math.max(0, bot1Progress - 12);
    bot2Progress = Math.max(0, bot2Progress - 12);
    bot3Progress = Math.max(0, bot3Progress - 12);
    updateTracksUI();
    showHazardAlert("💥 SHOCKWAVE PUSHED BOTS BACK!", "bg-purple-600/90", 2000);
  }
  typeInput.focus();
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
    lobbyErrorMsg.textContent = "Loading multiplayer engine... Tap again in 1 second.";
    lobbyErrorMsg.classList.remove("hidden");
    return;
  }

  cleanupOnlineRoom();
  lobbyErrorMsg.classList.add("hidden");
  btnCreateRoom.textContent = "⏳ Generating Code...";
  btnCreateRoom.disabled = true;

  roomCode = generateRoomCode();
  peer = new window.Peer(`sat289-tr-${roomCode}`);

  peer.on("open", () => {
    btnCreateRoom.textContent = "⚡ Generate Room Code";
    btnCreateRoom.disabled = false;
    generatedCodeText.textContent = roomCode;
    createdRoomBox.classList.remove("hidden");
    playTone(700, "sine", 0.12);
  });

  peer.on("connection", (incomingConn) => {
    conn = incomingConn;
    setupPeerConnection();
  });

  peer.on("error", (err) => {
    btnCreateRoom.textContent = "⚡ Generate Room Code";
    btnCreateRoom.disabled = false;
    lobbyErrorMsg.textContent = "Error: " + (err.type || "Try generating again.");
    lobbyErrorMsg.classList.remove("hidden");
  });
});

btnCopyCode.addEventListener("click", () => {
  if (!roomCode) return;
  navigator.clipboard.writeText(roomCode);
  btnCopyCode.textContent = "✅ Copied!";
  setTimeout(() => (btnCopyCode.textContent = "📋 Copy"), 1500);
});

btnJoinRoom.addEventListener("click", () => {
  const inputCode = joinCodeInput.value.trim().toUpperCase();
  if (inputCode.length !== 6) {
    lobbyErrorMsg.textContent = "Please enter a valid 6-character code.";
    lobbyErrorMsg.classList.remove("hidden");
    return;
  }

  if (typeof window.Peer === "undefined") {
    lobbyErrorMsg.textContent = "Loading multiplayer engine... Tap again in 1 second.";
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
    conn = peer.connect(`sat289-tr-${roomCode}`, { reliable: true });
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

    conn.send({
      type: "HELLO",
      name: getPlayerName()
    });
  });

  conn.on("data", (data) => {
    if (!data || !data.type) return;

    if (data.type === "HELLO") {
      onlineNames.guest = data.name || "Friend";
      onlineNames.host = getPlayerName();
      opponentConnected = true;

      targetText = getSelectedQuote();

      conn.send({
        type: "START",
        currentTrack,
        targetText,
        hardcoreMode,
        hostName: onlineNames.host,
        guestName: onlineNames.guest
      });

      startOnlineRaceUI(onlineNames.host, onlineNames.guest, false);
    } else if (data.type === "START") {
      currentTrack = data.currentTrack || "classic";
      targetText = data.targetText;
      hardcoreMode = !!data.hardcoreMode;
      onlineNames.host = data.hostName || "Host";
      onlineNames.guest = data.guestName || "Friend";

      startOnlineRaceUI(onlineNames.host, onlineNames.guest, false);
    } else if (data.type === "PROGRESS") {
      bot1Progress = data.progress || 0;
      if (data.wpm) {
        const oppName = onlineNames.host === getPlayerName() ? onlineNames.guest : onlineNames.host;
        lane2Label.textContent = `${oppName} (${data.wpm} WPM)`;
      }
      updateTracksUI();

      if (bot1Progress >= 100 && !isFinished) {
        isFinished = true;
        finishHeadline.textContent = "🏁 FRIEND FINISHED FIRST!";
        finishHeadline.className = "text-sm font-black text-amber-400 flex items-center justify-center gap-1.5 mb-1";
        finalWpm.textContent = `${wpm} WPM`;
        finalAcc.textContent = `${accuracy}%`;
        activeControls.classList.add("hidden");
        finishedBanner.classList.remove("hidden");
      }
    } else if (data.type === "SABOTAGE") {
      if (data.weapon === "SMOKE") {
        remainingTextSpan.classList.add("smoke-fog");
        showHazardAlert("🌫️ HIT BY SMOKE SCREEN! (3s)", "bg-cyan-700/90", 3000);
        playTone(190, "sawtooth", 0.3, 0.2);
        setTimeout(() => remainingTextSpan.classList.remove("smoke-fog"), 3000);
      } else if (data.weapon === "SHOCKWAVE") {
        quoteBox.classList.add("shockwave-shake");
        showHazardAlert("💥 HIT BY SHOCKWAVE!", "bg-purple-700/90", 2500);
        playTone(130, "sawtooth", 0.35, 0.25);
        setTimeout(() => quoteBox.classList.remove("shockwave-shake"), 2500);
      }
    } else if (data.type === "EMOJI") {
      spawnFloatingEmoji(data.emoji);
    }
  });

  conn.on("close", () => {
    if (gameMode === "online" && !gameScreen.classList.contains("hidden")) {
      alert("Friend disconnected from the race.");
      cleanupOnlineRoom();
      showScreen("menu");
    }
  });
}

function syncOnlineProgress() {
  if (gameMode === "online" && conn && conn.open) {
    const playerProgress = (typedText.length / targetText.length) * 100;
    conn.send({ type: "PROGRESS", progress: playerProgress, wpm });
  }
}

function startOnlineRaceUI(hostName, guestName, pickRandom = true) {
  gameMode = "online";
  activeModeBadge.textContent = "ONLINE • 1V1 RACE";
  lane1Label.textContent = `${getPlayerName()} (0 WPM)`;
  lane2Label.textContent = hostName === getPlayerName() ? guestName : hostName;
  lane3Row.classList.add("hidden");
  lane4Row.classList.add("hidden");

  showScreen("game");
  startCountdownSequence(pickRandom);
}

function cleanupOnlineRoom() {
  stopBotSimulation();
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

/* ==================== BOT & OFFLINE MODES ==================== */
function startBotRaceGame() {
  cleanupOnlineRoom();
  gameMode = "bot";
  activeModeBadge.textContent = `VS BOTS (${botDifficulty.toUpperCase()})`;
  lane1Label.textContent = `${getPlayerName()} (0 WPM)`;
  lane2Label.textContent = "Bot Apex";
  lane3Label.textContent = "Bot Turbo";
  lane4Label.textContent = "Bot Nitro";
  lane3Row.classList.remove("hidden");
  lane4Row.classList.remove("hidden");

  showScreen("game");
  startCountdownSequence(true);
}

function startOfflineOrGhostGame() {
  cleanupOnlineRoom();
  gameMode = "pvp";
  activeModeBadge.textContent = "1V1 GHOST CHALLENGE";
  lane1Label.textContent = `${getPlayerName()} (0 WPM)`;
  const targetGhostWpm = Math.max(35, typeof window.score === "number" && window.score > 0 ? window.score : 45);
  lane2Label.textContent = `Ghost (${targetGhostWpm} WPM)`;
  lane3Row.classList.add("hidden");
  lane4Row.classList.add("hidden");

  showScreen("game");
  startCountdownSequence(true);
}

/* ==================== COUNTDOWN & START SEQUENCE ==================== */
function clearAllCountdowns() {
  countdownTimers.forEach((t) => clearTimeout(t));
  countdownTimers = [];
  if (stallTimeout) {
    clearTimeout(stallTimeout);
    stallTimeout = null;
  }
}

function activateGreenLight() {
  clearAllCountdowns();
  lightRed.className = "w-3 h-3 rounded-full bg-red-500/30 border border-red-500/50";
  lightYellow.className = "w-3 h-3 rounded-full bg-amber-400/30 border border-amber-400/50";
  lightGreen.className = "w-3 h-3 rounded-full bg-emerald-400 border border-emerald-400 shadow-[0_0_12px_#2ecc71]";
  raceStatusText.textContent = "GO! TYPE NOW!";
  raceStatusText.className = "text-[11px] font-black text-[#2ecc71] ml-1 animate-pulse";
  playTone(880, "sine", 0.22, 0.18);

  raceStarted = true;
  typeInput.disabled = false;
  typeInput.placeholder = "Start typing here...";
  typeInput.focus();
}

function startCountdownSequence(pickNewQuote = true) {
  clearAllCountdowns();
  stopBotSimulation();

  if (pickNewQuote) {
    targetText = getSelectedQuote();
  }

  typedText = "";
  startTime = null;
  wpm = 0;
  accuracy = 100;
  mistakes = 0;
  comboStreak = 0;
  driftBoostActive = false;
  bonusWordsEarned = 0;
  isStalled = false;
  isFinished = false;
  raceStarted = false;
  bot1Progress = 0;
  bot2Progress = 0;
  bot3Progress = 0;
  resetPowerUps();
  updateDriftUI();

  typeInput.disabled = false;
  typeInput.value = "";
  typeInput.placeholder = "Get ready... Green light in 1.5s!";

  lightRed.className = "w-3 h-3 rounded-full bg-red-500 border border-red-500 shadow-[0_0_10px_#ef4444]";
  lightYellow.className = "w-3 h-3 rounded-full bg-amber-400/30 border border-amber-400/50";
  lightGreen.className = "w-3 h-3 rounded-full bg-emerald-400/30 border border-emerald-400/50";
  raceStatusText.textContent = "READY...";
  raceStatusText.className = "text-[11px] font-black text-red-400 ml-1";

  mistakeCounter.textContent = "Mistakes: 0";
  finishedBanner.classList.add("hidden");
  activeControls.classList.remove("hidden");

  updateTextUI();
  updateTracksUI();
  playTone(320, "sine", 0.12);

  const t1 = setTimeout(() => {
    lightYellow.className = "w-3 h-3 rounded-full bg-amber-400 border border-amber-400 shadow-[0_0_10px_#fbbf24]";
    raceStatusText.textContent = "SET...";
    raceStatusText.className = "text-[11px] font-black text-amber-400 ml-1";
    playTone(480, "sine", 0.12);
  }, 750);

  const t2 = setTimeout(() => {
    activateGreenLight();
  }, 1500);

  countdownTimers.push(t1, t2);
}

/* ==================== BOT SIMULATION ENGINE ==================== */
function startBotSimulation() {
  if (botInterval) clearInterval(botInterval);

  let speedMult = botDifficulty === "easy" ? 0.75 : botDifficulty === "medium" ? 1.25 : 1.75;
  if (gameMode === "pvp") {
    const best = typeof window.score === "number" && window.score > 0 ? window.score : 45;
    speedMult = best / 45;
  }

  botInterval = setInterval(() => {
    if (!startTime || isFinished) return;
    if (Date.now() < empFrozenUntil) return;

    bot1Progress = Math.min(100, bot1Progress + (Math.random() * 1.8 + 0.9) * speedMult);
    if (gameMode === "bot") {
      bot2Progress = Math.min(100, bot2Progress + (Math.random() * 2.1 + 0.8) * speedMult);
      bot3Progress = Math.min(100, bot3Progress + (Math.random() * 1.7 + 1.1) * speedMult);
    }

    updateTracksUI();

    if (bot1Progress >= 100 || bot2Progress >= 100 || bot3Progress >= 100) {
      if (!isFinished) {
        isFinished = true;
        stopBotSimulation();
        finishHeadline.textContent = "🏁 RACE OVER - BOT FINISHED FIRST!";
        finishHeadline.className = "text-sm font-black text-red-400 flex items-center justify-center gap-1.5 mb-1";
        finalWpm.textContent = `${wpm} WPM`;
        finalAcc.textContent = `${accuracy}%`;
        activeControls.classList.add("hidden");
        finishedBanner.classList.remove("hidden");
      }
    }
  }, 350);
}

function stopBotSimulation() {
  if (botInterval) {
    clearInterval(botInterval);
    botInterval = null;
  }
}

/* ==================== UI UPDATERS ==================== */
function updateTracksUI() {
  const skin = SKINS[selectedSkin] || SKINS.f1;
  if (playerCar) playerCar.textContent = skin.icon;

  const playerProgress = targetText.length > 0 ? (typedText.length / targetText.length) * 100 : 0;
  if (playerCar) playerCar.style.left = `calc(${playerProgress}% - 22px)`;
  if (bot1Car) bot1Car.style.left = `calc(${bot1Progress}% - 22px)`;
  if (bot2Car) bot2Car.style.left = `calc(${bot2Progress}% - 22px)`;
  if (bot3Car) bot3Car.style.left = `calc(${bot3Progress}% - 22px)`;

  if (lane1Label) lane1Label.textContent = `${getPlayerName()} (${wpm} WPM)`;
  if (liveWpm) liveWpm.textContent = `${wpm} WPM`;
  if (liveAcc) liveAcc.textContent = `${accuracy}%`;
}

function updateTextUI() {
  if (!typedTextSpan || !currentCharSpan || !remainingTextSpan) return;
  typedTextSpan.textContent = typedText;
  if (typedText.length < targetText.length) {
    currentCharSpan.textContent = targetText[typedText.length];
    remainingTextSpan.textContent = targetText.slice(typedText.length + 1);
  } else {
    currentCharSpan.textContent = "";
    remainingTextSpan.textContent = "";
  }
}

function checkRaceCompletion() {
  if (typedText === targetText && !isFinished) {
    isFinished = true;
    stopBotSimulation();

    winStreak++;
    if (streakBadge) {
      streakBadge.textContent = `🔥 ${winStreak}`;
      streakBadge.classList.remove("hidden");
    }

    finishHeadline.textContent = "🏆 1ST PLACE VICTORY!";
    finishHeadline.className = "text-sm font-black text-[#2ecc71] flex items-center justify-center gap-1.5 mb-1";
    finalWpm.textContent = `${wpm} WPM`;
    finalAcc.textContent = `${accuracy}%`;
    activeControls.classList.add("hidden");
    finishedBanner.classList.remove("hidden");

    if (typeof window.submitScore === "function") {
      window.submitScore(wpm, { accuracy, streak: winStreak, skin: selectedSkin });
    }
    refreshSkinAndRank();

    if (typeof confetti === "function") confetti();
    playTone(1046.5, "sine", 0.3, 0.2);
  }
}

/* ==================== TYPING INPUT EVENT ==================== */
typeInput.addEventListener("input", (e) => {
  if (isFinished) return;

  // Ignore typing while Engine is Stalled in Hardcore Mode
  if (isStalled) {
    e.target.value = typedText;
    return;
  }

  if (!raceStarted) {
    activateGreenLight();
  }

  const val = e.target.value;

  if (!startTime && val.length > 0) {
    startTime = Date.now();
    if (gameMode === "bot" || gameMode === "pvp") startBotSimulation();
  }

  // Check if typed string matches target prefix
  if (targetText.startsWith(val)) {
    const addedChars = Math.max(1, val.length - typedText.length);
    typedText = val;

    // Increment Combo Drift Meter
    comboStreak += addedChars;
    if (comboStreak >= DRIFT_TARGET) {
      if (!driftBoostActive) {
        driftBoostActive = true;
        playTone(960, "triangle", 0.15, 0.15);
      }
      bonusWordsEarned += addedChars * 0.05; // 1.25x WPM boost while drifting
    }
    updateDriftUI();
    playEngineKeystrokeSound();

    if (startTime) {
      const elapsedMin = (Date.now() - startTime) / 60000;
      const effectiveWords = (val.length / 5) + bonusWordsEarned;
      wpm = Math.round(effectiveWords / Math.max(0.01, elapsedMin));
    }

    updateTextUI();
    updateTracksUI();
    syncOnlineProgress();
    checkRaceCompletion();
  } else {
    // Mistake made -> Reset Combo Drift Meter
    mistakes++;
    comboStreak = 0;
    driftBoostActive = false;
    updateDriftUI();

    mistakeCounter.textContent = `Mistakes: ${mistakes}`;
    accuracy = Math.max(20, Math.round(100 - (mistakes / targetText.length) * 100));
    liveAcc.textContent = `${accuracy}%`;
    playTone(150, "sawtooth", 0.12, 0.14);
    e.target.value = typedText;

    // Feature 3: Hardcore Engine Stall Penalty (1.5s lock)
    if (hardcoreMode && !isStalled) {
      isStalled = true;
      quoteBox.classList.add("stall-flash");
      showHazardAlert("🛑 ENGINE STALLED! LOCKED FOR 1.5s!", "bg-red-600/95", 1500);
      playTone(110, "sawtooth", 0.35, 0.25);

      stallTimeout = setTimeout(() => {
        isStalled = false;
        quoteBox.classList.remove("stall-flash");
      }, 1500);
    }
  }
});

changeQuoteBtn.addEventListener("click", () => {
  if (gameMode === "online" && conn && conn.open) {
    targetText = getSelectedQuote();
    conn.send({
      type: "START",
      currentTrack,
      targetText,
      hardcoreMode,
      hostName: onlineNames.host,
      guestName: onlineNames.guest
    });
    startCountdownSequence(false);
  } else {
    startCountdownSequence(true);
  }
});

nextRaceBtn.addEventListener("click", () => {
  if (gameMode === "online" && conn && conn.open) {
    targetText = getSelectedQuote();
    conn.send({
      type: "START",
      currentTrack,
      targetText,
      hardcoreMode,
      hostName: onlineNames.host,
      guestName: onlineNames.guest
    });
    startCountdownSequence(false);
  } else {
    startCountdownSequence(true);
  }
});

// Initialize default view
updateTextUI();
updateTracksUI();
