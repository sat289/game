// Dynamically load PeerJS for instant online multiplayer room codes
const peerScript = document.createElement("script");
peerScript.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
document.head.appendChild(peerScript);

const { getPlayerName } = window._trFirebase || {
  getPlayerName: () => "Racer"
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

let currentTrack = "classic";
let targetText = TRACK_QUOTES.classic[0];
let typedText = '';
let startTime = null;
let wpm = 0;
let accuracy = 100;
let mistakes = 0;
let isFinished = false;
let raceStarted = false;
let countdownTimeouts = [];

// Power-Up State (1 per race)
let nitroAvailable = true;
let empAvailable = true;

// Bot Race State
let gameMode = "bot"; // 'online' | 'bot' | 'pvp'
let botDifficulty = "medium"; // 'easy' | 'medium' | 'impossible'
let bot1Progress = 0;
let bot2Progress = 0;
let bot3Progress = 0;
let botInterval = null;

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
const gameScreen = document.getElementById("gameScreen");
const trackSelectorBar = document.getElementById("trackSelectorBar");
const subHeaderText = document.getElementById("subHeaderText");
const activeModeBadge = document.getElementById("activeModeBadge");

const skinSelector = document.getElementById("skinSelector");
const scoreElem = document.getElementById("score");

const btnCreateRoom = document.getElementById("btnCreateRoom");
const createdRoomBox = document.getElementById("createdRoomBox");
const generatedCodeText = document.getElementById("generatedCodeText");
const btnCopyCode = document.getElementById("btnCopyCode");
const joinCodeInput = document.getElementById("joinCodeInput");
const btnJoinRoom = document.getElementById("btnJoinRoom");
const lobbyErrorMsg = document.getElementById("lobbyErrorMsg");

const playerWpmLabel = document.getElementById("playerWpmLabel");
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

const typedTextSpan = document.getElementById("typedTextSpan");
const currentCharSpan = document.getElementById("currentCharSpan");
const remainingTextSpan = document.getElementById("remainingTextSpan");
const typeInput = document.getElementById("typeInput");

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
const emojiBar = document.getElementById("emojiBar");
const emojiFloatContainer = document.getElementById("emojiFloatContainer");

const activeControls = document.getElementById("activeControls");
const finishedBanner = document.getElementById("finishedBanner");
const finishHeadline = document.getElementById("finishHeadline");
const finalWpm = document.getElementById("finalWpm");
const finalAcc = document.getElementById("finalAcc");
const changeQuoteBtn = document.getElementById("changeQuoteBtn");
const nextRaceBtn = document.getElementById("nextRaceBtn");

/* ==================== SKIN UNLOCK HANDLER ==================== */
function refreshSkinOptions() {
  const bestW = typeof window.score === "number" ? window.score : 0;
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

window.onScoreUpdated = (val) => {
  refreshSkinOptions();
};

skinSelector.addEventListener("change", (e) => {
  const chosen = e.target.value;
  const bestW = typeof window.score === "number" ? window.score : 0;
  if (bestW >= SKINS[chosen].req) {
    selectedSkin = chosen;
    localStorage.setItem("typerace_skin", chosen);
    playTone(650, "sine", 0.1);
    updateTracksUI();
  }
});

refreshSkinOptions();

/* ==================== SOUND & MUSIC ==================== */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type = "sine", duration = 0.08, gainVal = 0.1) {
  if (!soundEnabled) return;
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

soundToggleBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggleBtn.textContent = soundEnabled ? "🔊" : "🔇";
});

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

/* ==================== TRACK CATEGORY SWITCHER ==================== */
document.querySelectorAll(".track-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentTrack = btn.getAttribute("data-track");
    document.querySelectorAll(".track-btn").forEach((b) => {
      b.className = "track-btn py-1.5 rounded-xl text-[10px] font-black transition text-white/60 hover:text-white";
    });
    btn.className = "track-btn py-1.5 rounded-xl text-[10px] font-black transition bg-[#00f0ff] text-slate-950 shadow";
    playTone(550, "sine", 0.08);
  });
});

/* ==================== SCREEN NAVIGATION ==================== */
function showScreen(screenName) {
  mainMenuScreen.classList.add("hidden");
  onlineLobbyScreen.classList.add("hidden");
  botMenuScreen.classList.add("hidden");
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
  } else if (screenName === "game") {
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("flex");
    powerUpBar.classList.toggle("hidden", gameMode === "online");
    powerUpBar.classList.toggle("flex", gameMode !== "online");
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
    botDifficulty = btn.getAttribute("data-diff");
    startBotRaceGame();
  });
});

/* ==================== POWER-UPS ==================== */
function resetPowerUps() {
  nitroAvailable = true;
  empAvailable = true;
  updatePowerUpUI();
}

function updatePowerUpUI() {
  btnPowerNitro.disabled = !nitroAvailable;
  btnPowerNitro.style.opacity = nitroAvailable ? "1" : "0.35";
  btnPowerEmp.disabled = !empAvailable;
  btnPowerEmp.style.opacity = empAvailable ? "1" : "0.35";
}

btnPowerNitro.addEventListener("click", () => {
  if (!nitroAvailable || isFinished || !raceStarted) return;
  nitroAvailable = false;
  updatePowerUpUI();
  playTone(880, "triangle", 0.2, 0.2);

  const targetLen = targetText.length;
  const currentLen = typedText.length;
  const advance = Math.min(targetLen, currentLen + Math.floor(targetLen * 0.15));
  typedText = targetText.slice(0, advance);
  updateTextUI();
  updateTracksUI();
});

btnPowerEmp.addEventListener("click", () => {
  if (!empAvailable || isFinished || !raceStarted) return;
  empAvailable = false;
  updatePowerUpUI();
  playTone(150, "sawtooth", 0.3, 0.2);

  bot1Progress = Math.max(0, bot1Progress - 12);
  bot2Progress = Math.max(0, bot2Progress - 12);
  bot3Progress = Math.max(0, bot3Progress - 12);
  updateTracksUI();
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
    lobbyErrorMsg.classList.add("hidden");
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

      const quotesList = TRACK_QUOTES[currentTrack];
      targetText = quotesList[Math.floor(Math.random() * quotesList.length)];

      conn.send({
        type: "START",
        currentTrack,
        targetText,
        hostName: onlineNames.host,
        guestName: onlineNames.guest
      });

      startOnlineRaceUI(onlineNames.host, onlineNames.guest);
    } else if (data.type === "START") {
      currentTrack = data.currentTrack || "classic";
      targetText = data.targetText;
      onlineNames.host = data.hostName || "Host";
      onlineNames.guest = data.guestName || "Friend";

      startOnlineRaceUI(onlineNames.host, onlineNames.guest);
    } else if (data.type === "PROGRESS") {
      bot1Progress = data.progress;
      updateTracksUI();
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

function startOnlineRaceUI(hostName, guestName) {
  gameMode = "online";
  activeModeBadge.textContent = `ONLINE • 1V1 RACE`;
  lane1Label.textContent = `${getPlayerName()} (0 WPM)`;
  lane2Label.textContent = hostName === getPlayerName() ? guestName : hostName;
  lane3Row.classList.add("hidden");
  lane4Row.classList.add("hidden");

  showScreen("game");
  startCountdownSequence();
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
  startCountdownSequence();
}

function startOfflineOrGhostGame() {
  cleanupOnlineRoom();
  gameMode = "pvp";
  activeModeBadge.textContent = `1V1 GHOST CHALLENGE`;
  lane1Label.textContent = `${getPlayerName()} (0 WPM)`;
  lane2Label.textContent = "Ghost Racer";
  lane3Row.classList.add("hidden");
  lane4Row.classList.add("hidden");

  showScreen("game");
  startCountdownSequence();
}

/* ==================== COUNTDOWN & START SEQUENCE ==================== */
function clearAllCountdowns() {
  countdownTimeouts.forEach((t) => clearTimeout(t));
  countdownTimeouts = [];
}

function startCountdownSequence() {
  clearAllCountdowns();
  stopBotSimulation();

  const quotesList = TRACK_QUOTES[currentTrack];
  targetText = quotesList[Math.floor(Math.random() * quotesList.length)];
  typedText = '';
  startTime = null;
  wpm = 0;
  accuracy = 100;
  mistakes = 0;
  isFinished = false;
  raceStarted = false;
  bot1Progress = 0;
  bot2Progress = 0;
  bot3Progress = 0;
  resetPowerUps();

  lightRed.className = "w-3 h-3 rounded-full bg-red-500 border border-red-500 shadow-[0_0_10px_#ef4444]";
  lightYellow.className = "w-3 h-3 rounded-full bg-amber-400/30 border border-amber-400/50";
  lightGreen.className = "w-3 h-3 rounded-full bg-emerald-400/30 border border-emerald-400/50";
  raceStatusText.textContent = "READY...";
  raceStatusText.className = "text-xs font-black text-red-400 ml-1";

  typeInput.value = "";
  typeInput.disabled = true;
  updateTextUI();
  updateTracksUI();
  mistakeCounter.textContent = "Mistakes: 0";
  finishedBanner.classList.add('hidden');
  activeControls.classList.remove('hidden');

  playTone(300, "sine", 0.15);

  const t1 = setTimeout(() => {
    lightYellow.className = "w-3 h-3 rounded-full bg-amber-400 border border-amber-400 shadow-[0_0_10px_#fbbf24]";
    raceStatusText.textContent = "SET...";
    raceStatusText.className = "text-xs font-black text-amber-400 ml-1";
    playTone(450, "sine", 0.15);
  }, 1000);

  const t2 = setTimeout(() => {
    lightGreen.className = "w-3 h-3 rounded-full bg-emerald-400 border border-emerald-400 shadow-[0_0_10px_#2ecc71]";
    raceStatusText.textContent = "GO! RACE!";
    raceStatusText.className = "text-xs font-black text-[#2ecc71] ml-1";
    playTone(880, "sine", 0.25, 0.2);

    raceStarted = true;
    typeInput.disabled = false;
    typeInput.focus();
  }, 2000);

  countdownTimeouts.push(t1, t2);
}

/* ==================== BOT SIMULATION ENGINE ==================== */
function startBotSimulation() {
  if (botInterval) clearInterval(botInterval);

  let speedMult = botDifficulty === "easy" ? 0.9 : botDifficulty === "medium" ? 1.4 : 1.9;

  botInterval = setInterval(() => {
    if (!startTime || isFinished) return;

    bot1Progress = Math.min(100, bot1Progress + (Math.random() * 2.2 + 1.1) * speedMult);
    bot2Progress = Math.min(100, bot2Progress + (Math.random() * 2.5 + 1.0) * speedMult);
    bot3Progress = Math.min(100, bot3Progress + (Math.random() * 2.0 + 1.4) * speedMult);

    updateTracksUI();

    if (bot1Progress >= 100 || bot2Progress >= 100 || bot3Progress >= 100) {
      if (!isFinished) {
        isFinished = true;
        typeInput.disabled = true;
        stopBotSimulation();
        finishHeadline.textContent = "🏁 RACE OVER - BOT WINS!";
        finishHeadline.className = "text-sm font-black text-red-400 flex items-center justify-center gap-1.5 mb-1";
        finalWpm.textContent = `${wpm} WPM`;
        finalAcc.textContent = `${accuracy}%`;
        activeControls.classList.add('hidden');
        finishedBanner.classList.remove('hidden');
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

function updateTracksUI() {
  const skin = SKINS[selectedSkin] || SKINS.f1;
  playerCar.textContent = skin.icon;

  const playerProgress = targetText.length > 0 ? (typedText.length / targetText.length) * 100 : 0;
  playerCar.style.left = `calc(${playerProgress}% - 22px)`;
  bot1Car.style.left = `calc(${bot1Progress}% - 22px)`;
  bot2Car.style.left = `calc(${bot2Progress}% - 22px)`;
  bot3Car.style.left = `calc(${bot3Progress}% - 22px)`;

  playerWpmLabel.textContent = `${getPlayerName()} (${wpm} WPM)`;
  liveWpm.textContent = `${wpm} WPM`;
  liveAcc.textContent = `${accuracy}%`;
}

function updateTextUI() {
  typedTextSpan.textContent = typedText;
  if (typedText.length < targetText.length) {
    currentCharSpan.textContent = targetText[typedText.length];
    remainingTextSpan.textContent = targetText.slice(typedText.length + 1);
  } else {
    currentCharSpan.textContent = "";
    remainingTextSpan.textContent = "";
  }
}

/* ==================== TYPING INPUT EVENT ==================== */
typeInput.addEventListener('input', (e) => {
  if (!raceStarted || isFinished) return;
  const val = e.target.value;

  if (!startTime && val.length > 0) {
    startTime = Date.now();
    if (gameMode === "bot") startBotSimulation();
  }

  if (targetText.startsWith(val)) {
    typedText = val;
    playTone(520, "triangle", 0.04, 0.05);

    if (startTime) {
      const elapsedMin = (Date.now() - startTime) / 60000;
      const words = val.length / 5;
      wpm = Math.round(words / Math.max(0.01, elapsedMin));
    }

    updateTextUI();
    updateTracksUI();

    if (gameMode === "online" && conn && conn.open) {
      const playerProgress = (typedText.length / targetText.length) * 100;
      conn.send({ type: "PROGRESS", progress: playerProgress });
    }

    if (val === targetText) {
      isFinished = true;
      typeInput.disabled = true;
      stopBotSimulation();

      finishHeadline.textContent = "🏆 1ST PLACE VICTORY!";
      finishHeadline.className = "text-sm font-black text-[#2ecc71] flex items-center justify-center gap-1.5 mb-1";
      finalWpm.textContent = `${wpm} WPM`;
      finalAcc.textContent = `${accuracy}%`;
      activeControls.classList.add('hidden');
      finishedBanner.classList.remove('hidden');

      if (typeof window.submitScore === "function") {
        window.submitScore(wpm);
      }
      refreshSkinOptions();

      if (typeof confetti === "function") confetti();
      playTone(1046.5, "sine", 0.3, 0.2);
    }
  } else {
    mistakes++;
    mistakeCounter.textContent = `Mistakes: ${mistakes}`;
    accuracy = Math.max(20, Math.round(100 - (mistakes / targetText.length) * 100));
    liveAcc.textContent = `${accuracy}%`;
    playTone(160, "sawtooth", 0.1, 0.12);
    e.target.value = typedText;
  }
});

changeQuoteBtn.addEventListener('click', startCountdownSequence);
nextRaceBtn.addEventListener('click', startCountdownSequence);

// Initialize default view
updateTextUI();
updateTracksUI();
