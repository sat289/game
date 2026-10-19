import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

const { db, getPlayerName } = window._tttFirebase;

// Unlockable Skins Map
const SKINS = {
  classic: { X: "X", O: "O", req: 0 },
  cyber:   { X: "⚡", O: "🛡️", req: 5 },
  element: { X: "🔥", O: "❄️", req: 15 },
  royale:  { X: "👑", O: "💎", req: 30 }
};

let selectedSkin = localStorage.getItem("tictactoe_skin") || "classic";

// Core Game State
let gameMode = "bot"; // 'online' | 'bot' | 'pvp'
let ruleMode = "classic"; // 'classic' | 'infinity' | 'big5x5'
let botDifficulty = "impossible";
let boardSize = 9;
let board = Array(9).fill(null);
let moveHistory = { X: [], O: [] };
let isXNext = true;
let isBotThinking = false;
let scores = { X: 0, O: 0, ties: 0 };
let winStreak = 0;

// Power-Up State (1 per match)
let bombAvailable = true;
let doubleTurnAvailable = true;
let bombModeActive = false;
let extraTurnQueued = false;

// Audio State
let soundEnabled = true;
let musicPlaying = false;
const bgMusic = document.getElementById("bgMusic");
const musicToggleBtn = document.getElementById("musicToggleBtn");
const soundToggleBtn = document.getElementById("soundToggleBtn");

// Shot Clock Timer
let turnTimeLeft = 10;
let turnTimerInterval = null;

// Online Multiplayer State
let roomCode = null;
let mySymbol = "X";
let roomRef = null;
let opponentConnected = false;
let matchAwarded = false;
let lastReactionTimestamp = 0;

// DOM Elements
const mainMenuScreen = document.getElementById("mainMenuScreen");
const onlineLobbyScreen = document.getElementById("onlineLobbyScreen");
const botMenuScreen = document.getElementById("botMenuScreen");
const gameScreen = document.getElementById("gameScreen");
const ruleSelectorBar = document.getElementById("ruleSelectorBar");
const subHeaderText = document.getElementById("subHeaderText");
const modeRuleHint = document.getElementById("modeRuleHint");
const powerUpBar = document.getElementById("powerUpBar");
const emojiBar = document.getElementById("emojiBar");
const emojiFloatContainer = document.getElementById("emojiFloatContainer");
const streakBadge = document.getElementById("streakBadge");
const skinSelector = document.getElementById("skinSelector");

const btnPowerBomb = document.getElementById("btnPowerBomb");
const btnPowerDouble = document.getElementById("btnPowerDouble");

const btnCreateRoom = document.getElementById("btnCreateRoom");
const createdRoomBox = document.getElementById("createdRoomBox");
const generatedCodeText = document.getElementById("generatedCodeText");
const btnCopyCode = document.getElementById("btnCopyCode");
const joinCodeInput = document.getElementById("joinCodeInput");
const btnJoinRoom = document.getElementById("btnJoinRoom");
const lobbyErrorMsg = document.getElementById("lobbyErrorMsg");

const boardGrid = document.getElementById("boardGrid");
const statusBanner = document.getElementById("statusBanner");
const activeModeBadge = document.getElementById("activeModeBadge");
const labelPlayerX = document.getElementById("labelPlayerX");
const labelPlayerO = document.getElementById("labelPlayerO");
const cardPlayerX = document.getElementById("cardPlayerX");
const cardPlayerO = document.getElementById("cardPlayerO");
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const scoreTiesEl = document.getElementById("scoreTies");
const timerText = document.getElementById("timerText");
const timerBar = document.getElementById("timerBar");
const btnResetBoard = document.getElementById("btnResetBoard");

/* ==================== SKIN UNLOCK HANDLER ==================== */
function refreshSkinOptions() {
  const currentPts = typeof window.score === "number" ? window.score : 0;
  Array.from(skinSelector.options).forEach((opt) => {
    const key = opt.value;
    const req = SKINS[key]?.req || 0;
    const unlocked = currentPts >= req;
    opt.disabled = !unlocked;
  });

  if (currentPts < (SKINS[selectedSkin]?.req || 0)) {
    selectedSkin = "classic";
  }
  skinSelector.value = selectedSkin;
}

window.onScoreUpdated = () => {
  refreshSkinOptions();
};

skinSelector.addEventListener("change", (e) => {
  const chosen = e.target.value;
  const currentPts = typeof window.score === "number" ? window.score : 0;
  if (currentPts >= SKINS[chosen].req) {
    selectedSkin = chosen;
    localStorage.setItem("tictactoe_skin", chosen);
    playTone(640, "sine", 0.1);
    renderBoard();
  }
});

refreshSkinOptions();

/* ==================== SOUND & MUSIC ==================== */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type = "sine", duration = 0.12, gainVal = 0.12) {
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

function sfxMove(player) {
  playTone(player === "X" ? 540 : 420, "triangle", 0.1, 0.15);
}

function sfxWin() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
    setTimeout(() => playTone(f, "sine", 0.18, 0.15), idx * 90);
  });
}

function sfxTie() {
  playTone(300, "sawtooth", 0.15, 0.08);
  setTimeout(() => playTone(240, "sawtooth", 0.2, 0.08), 120);
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
      musicToggleBtn.className = "bg-[#00f2fe]/20 border border-[#00f2fe] text-[#00f2fe] px-2 py-1 rounded-full text-[10px] font-bold transition";
    }).catch(() => {
      alert("Place song.mp3 inside creazy/song.mp3 or tictactoe/song.mp3!");
    });
  }
});

/* ==================== RULE VARIANT SWITCHER ==================== */
document.querySelectorAll(".rule-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    ruleMode = btn.getAttribute("data-rule");
    document.querySelectorAll(".rule-btn").forEach((b) => {
      b.className = "rule-btn py-1.5 rounded-xl text-[10px] font-black transition text-white/60 hover:text-white";
    });
    btn.className = "rule-btn py-1.5 rounded-xl text-[10px] font-black transition bg-[#00f2fe] text-slate-950 shadow";
    playTone(620, "sine", 0.08);
  });
});

/* ==================== DYNAMIC WINNING LINES (3x3 & 5x5) ==================== */
function getWinningLines() {
  if (ruleMode !== "big5x5") {
    return [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
  }
  // 5x5 Grid (4 in a row to win)
  const lines = [];
  const size = 5;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 4; c++) {
      const i = r * size + c;
      lines.push([i, i + 1, i + 2, i + 3]);
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - 4; r++) {
      const i = r * size + c;
      lines.push([i, i + size, i + size * 2, i + size * 3]);
    }
  }
  for (let r = 0; r <= size - 4; r++) {
    for (let c = 0; c <= size - 4; c++) {
      const i = r * size + c;
      lines.push([i, i + size + 1, i + (size + 1) * 2, i + (size + 1) * 3]);
    }
    for (let c = 3; c < size; c++) {
      const i = r * size + c;
      lines.push([i, i + size - 1, i + (size - 1) * 2, i + (size - 1) * 3]);
    }
  }
  return lines;
}

function checkWinner(squares) {
  const lines = getWinningLines();
  for (const line of lines) {
    const first = squares[line[0]];
    if (first && line.every((idx) => squares[idx] === first)) {
      return { winner: first, line };
    }
  }
  if (ruleMode !== "infinity" && squares.every((sq) => sq !== null && sq !== "")) {
    return { winner: "Tie", line: null };
  }
  return null;
}

/* ==================== NAVIGATION ==================== */
function showScreen(screenName) {
  mainMenuScreen.classList.add("hidden");
  onlineLobbyScreen.classList.add("hidden");
  botMenuScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  ruleSelectorBar.classList.add("hidden");

  if (screenName === "menu") {
    stopTurnTimer();
    mainMenuScreen.classList.remove("hidden");
    ruleSelectorBar.classList.remove("hidden");
    subHeaderText.textContent = "Select Game Mode";
  } else if (screenName === "lobby") {
    onlineLobbyScreen.classList.remove("hidden");
    onlineLobbyScreen.classList.add("flex");
    subHeaderText.textContent = "Online Multiplayer Lobby";
  } else if (screenName === "botMenu") {
    botMenuScreen.classList.remove("hidden");
    botMenuScreen.classList.add("flex");
    ruleSelectorBar.classList.remove("hidden");
    subHeaderText.textContent = "Choose AI Difficulty";
  } else if (screenName === "game") {
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("flex");

    if (ruleMode === "infinity") {
      modeRuleHint.innerHTML = "♾️ <b>Infinity Mode:</b> Max 3 marks each! Dimmed mark vanishes next move.";
      modeRuleHint.classList.remove("hidden");
    } else if (ruleMode === "big5x5") {
      modeRuleHint.innerHTML = "🔥 <b>5x5 Big Board:</b> Connect <b>4 in a row</b> horizontally, vertically, or diagonally!";
      modeRuleHint.classList.remove("hidden");
    } else {
      modeRuleHint.classList.add("hidden");
    }

    powerUpBar.classList.toggle("hidden", gameMode === "online");
    powerUpBar.classList.toggle("flex", gameMode !== "online");
    emojiBar.classList.toggle("hidden", gameMode !== "online");
    emojiBar.classList.toggle("flex", gameMode === "online");

    subHeaderText.textContent =
      gameMode === "online" ? `Room Code: ${roomCode}` : `${ruleMode.toUpperCase()} ARENA`;
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
  startOfflineOrBotGame("pvp");
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
    startOfflineOrBotGame("bot");
  });
});

/* ==================== SHOT CLOCK TIMER ==================== */
function resetTurnTimer() {
  stopTurnTimer();
  if (checkWinner(board)) {
    timerText.textContent = "--";
    timerBar.style.width = "0%";
    return;
  }

  turnTimeLeft = 10;
  updateTimerUI();

  turnTimerInterval = setInterval(() => {
    if (gameMode === "online" && !opponentConnected) return;
    turnTimeLeft--;
    updateTimerUI();

    if (turnTimeLeft <= 0) {
      stopTurnTimer();
      if (gameMode !== "online" || (isXNext ? "X" : "O") === mySymbol) {
        const emptyIndices = board
          .map((v, i) => (v === null ? i : null))
          .filter((v) => v !== null);
        if (emptyIndices.length > 0 && !isBotThinking) {
          const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          handleCellClick(randomIdx);
        }
      }
    }
  }, 1000);
}

function stopTurnTimer() {
  if (turnTimerInterval) {
    clearInterval(turnTimerInterval);
    turnTimerInterval = null;
  }
}

function updateTimerUI() {
  timerText.textContent = `${turnTimeLeft}s`;
  timerBar.style.width = `${(turnTimeLeft / 10) * 100}%`;
}

/* ==================== SCORE SAVING (FIREBASE OR GUEST STORAGE) ==================== */
function recordPlayerWin() {
  winStreak++;
  streakBadge.textContent = `🔥 ${winStreak} Streak`;
  streakBadge.classList.remove("hidden");

  let basePoints = 1;
  if (gameMode === "bot") {
    basePoints = botDifficulty === "impossible" ? 5 : botDifficulty === "medium" ? 2 : 1;
  } else if (gameMode === "online") {
    basePoints = 3;
  }

  const bonus = winStreak > 1 ? winStreak - 1 : 0;
  const newTotal = (typeof window.score === "number" ? window.score : 0) + basePoints + bonus;

  window.score = newTotal;
  if (typeof window.submitScore === "function") {
    window.submitScore(newTotal, {
      streak: winStreak,
      skin: selectedSkin,
      lastMode: gameMode
    });
  }
  refreshSkinOptions();

  if (typeof confetti === "function") {
    confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
  }
  sfxWin();
}

function resetWinStreak() {
  winStreak = 0;
  streakBadge.classList.add("hidden");
}

/* ==================== POWER-UPS (BOMB & DOUBLE TURN) ==================== */
function resetPowerUps() {
  bombAvailable = true;
  doubleTurnAvailable = true;
  bombModeActive = false;
  extraTurnQueued = false;
  updatePowerUpUI();
}

function updatePowerUpUI() {
  btnPowerBomb.disabled = !bombAvailable;
  btnPowerBomb.style.opacity = bombAvailable ? "1" : "0.35";
  btnPowerBomb.classList.toggle("ring-2", bombModeActive);
  btnPowerBomb.classList.toggle("ring-red-400", bombModeActive);

  btnPowerDouble.disabled = !doubleTurnAvailable;
  btnPowerDouble.style.opacity = doubleTurnAvailable ? "1" : "0.35";
  btnPowerDouble.classList.toggle("ring-2", extraTurnQueued);
  btnPowerDouble.classList.toggle("ring-purple-400", extraTurnQueued);
}

btnPowerBomb.addEventListener("click", () => {
  if (!bombAvailable || isBotThinking || checkWinner(board)) return;
  const oppSymbol = isXNext ? "O" : "X";
  if (!board.includes(oppSymbol)) return; // Need at least 1 opponent tile to bomb
  bombModeActive = !bombModeActive;
  playTone(400, "sawtooth", 0.1);
  updatePowerUpUI();
  renderBoard();
});

btnPowerDouble.addEventListener("click", () => {
  if (!doubleTurnAvailable || isBotThinking || checkWinner(board)) return;
  doubleTurnAvailable = false;
  extraTurnQueued = true;
  playTone(780, "sine", 0.14);
  updatePowerUpUI();
  renderBoard();
});

/* ==================== APPLY MOVE ==================== */
function applyMoveToState(player, idx) {
  board[idx] = player;
  moveHistory[player].push(idx);

  if (ruleMode === "infinity" && moveHistory[player].length > 3) {
    const oldestIdx = moveHistory[player].shift();
    if (oldestIdx !== undefined && oldestIdx !== idx) {
      board[oldestIdx] = null;
    }
  }
}

/* ==================== ONLINE MULTIPLAYER ==================== */
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
  btn.addEventListener("click", async () => {
    const emoji = btn.getAttribute("data-emoji");
    if (gameMode === "online" && roomRef) {
      await update(roomRef, {
        reaction: { emoji, sender: mySymbol, ts: Date.now() }
      });
    } else {
      spawnFloatingEmoji(emoji);
    }
  });
});

btnCreateRoom.addEventListener("click", async () => {
  cleanupOnlineRoom();
  lobbyErrorMsg.classList.add("hidden");

  roomCode = generateRoomCode();
  mySymbol = "X";
  boardSize = ruleMode === "big5x5" ? 25 : 9;
  roomRef = ref(db, `tictactoe_rooms/${roomCode}`);

  const initialRoomData = {
    board: Array(boardSize).fill(""),
    historyX: [],
    historyO: [],
    ruleMode: ruleMode,
    hostName: getPlayerName(),
    guestName: "Friend",
    turn: "X",
    status: "waiting",
    scores: { X: 0, O: 0, ties: 0 },
    updatedAt: Date.now()
  };

  try {
    await set(roomRef, initialRoomData);
    onDisconnect(roomRef).remove();

    generatedCodeText.textContent = roomCode;
    createdRoomBox.classList.remove("hidden");
    playTone(700, "sine", 0.12);

    listenToRoomChanges();
  } catch (err) {
    lobbyErrorMsg.textContent = "Could not create room. Check connection.";
    lobbyErrorMsg.classList.remove("hidden");
  }
});

btnCopyCode.addEventListener("click", () => {
  if (!roomCode) return;
  navigator.clipboard.writeText(roomCode);
  btnCopyCode.textContent = "✅ Copied!";
  setTimeout(() => (btnCopyCode.textContent = "📋 Copy"), 1500);
});

btnJoinRoom.addEventListener("click", async () => {
  const inputCode = joinCodeInput.value.trim().toUpperCase();
  if (inputCode.length !== 6) {
    lobbyErrorMsg.textContent = "Please enter a valid 6-character code.";
    lobbyErrorMsg.classList.remove("hidden");
    return;
  }

  cleanupOnlineRoom();
  lobbyErrorMsg.classList.add("hidden");

  roomCode = inputCode;
  mySymbol = "O";
  roomRef = ref(db, `tictactoe_rooms/${roomCode}`);

  try {
    const snap = await get(roomRef);
    if (!snap.exists()) {
      lobbyErrorMsg.textContent = "Room not found! Check the code.";
      lobbyErrorMsg.classList.remove("hidden");
      return;
    }

    const data = snap.val();
    ruleMode = data.ruleMode || "classic";
    boardSize = ruleMode === "big5x5" ? 25 : 9;

    await update(roomRef, {
      status: "playing",
      guestName: getPlayerName(),
      updatedAt: Date.now()
    });
    listenToRoomChanges();
    startOnlineGameUI(data.hostName || "Host", getPlayerName());
  } catch (err) {
    lobbyErrorMsg.textContent = "Error joining room.";
    lobbyErrorMsg.classList.remove("hidden");
  }
});

function listenToRoomChanges() {
  if (!roomRef) return;

  onValue(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      if (gameMode === "online" && !gameScreen.classList.contains("hidden")) {
        alert("Opponent left the room.");
        cleanupOnlineRoom();
        showScreen("menu");
      }
      return;
    }

    const data = snapshot.val();

    if (data.status === "playing" && !onlineLobbyScreen.classList.contains("hidden")) {
      startOnlineGameUI(data.hostName || "Host", data.guestName || "Guest");
    }

    if (data.reaction && data.reaction.ts > lastReactionTimestamp) {
      lastReactionTimestamp = data.reaction.ts;
      spawnFloatingEmoji(data.reaction.emoji);
    }

    opponentConnected = data.status === "playing";
    ruleMode = data.ruleMode || "classic";
    boardSize = ruleMode === "big5x5" ? 25 : 9;
    board = (data.board || Array(boardSize).fill("")).map((v) => (v === "" ? null : v));
    moveHistory.X = data.historyX || [];
    moveHistory.O = data.historyO || [];
    isXNext = data.turn === "X";
    scores = data.scores || { X: 0, O: 0, ties: 0 };

    labelPlayerX.textContent = `X (${data.hostName || "Host"})`;
    labelPlayerO.textContent = `O (${data.guestName || "Friend"})`;

    const result = checkWinner(board);
    if (!result) {
      matchAwarded = false;
      resetTurnTimer();
    } else if (!matchAwarded) {
      matchAwarded = true;
      stopTurnTimer();
      if (result.winner === mySymbol) {
        recordPlayerWin();
      } else if (result.winner === "Tie") {
        sfxTie();
      } else {
        resetWinStreak();
        sfxTie();
      }
    }

    renderBoard();
  });
}

function startOnlineGameUI(hostName, guestName) {
  gameMode = "online";
  matchAwarded = false;
  activeModeBadge.textContent = `ONLINE • ${ruleMode.toUpperCase()} (${mySymbol})`;
  labelPlayerX.textContent = `X (${hostName})`;
  labelPlayerO.textContent = `O (${guestName})`;
  showScreen("game");
  playTone(880, "sine", 0.15);
}

function cleanupOnlineRoom() {
  stopTurnTimer();
  if (roomRef) {
    off(roomRef);
    roomRef = null;
  }
  roomCode = null;
  opponentConnected = false;
}

/* ==================== LOCAL & BOT MODES ==================== */
function startOfflineOrBotGame(mode) {
  cleanupOnlineRoom();
  gameMode = mode;
  boardSize = ruleMode === "big5x5" ? 25 : 9;
  board = Array(boardSize).fill(null);
  moveHistory = { X: [], O: [] };
  isXNext = true;
  isBotThinking = false;
  scores = { X: 0, O: 0, ties: 0 };
  resetPowerUps();

  const pName = getPlayerName();
  if (mode === "bot") {
    activeModeBadge.textContent = `BOT (${botDifficulty.toUpperCase()})`;
    labelPlayerX.textContent = `X (${pName})`;
    labelPlayerO.textContent = "BOT (O)";
  } else {
    activeModeBadge.textContent = "1V1 OFFLINE";
    labelPlayerX.textContent = `X (${pName})`;
    labelPlayerO.textContent = "FRIEND (O)";
  }

  showScreen("game");
  resetTurnTimer();
  renderBoard();
}

function findImmediateMove(player) {
  const lines = getWinningLines();
  for (const line of lines) {
    const vals = line.map((idx) => board[idx]);
    const countPlayer = vals.filter((v) => v === player).length;
    const countEmpty = vals.filter((v) => v === null).length;
    if (countPlayer === line.length - 1 && countEmpty === 1) {
      return line[vals.indexOf(null)];
    }
  }
  return null;
}

function minimax(newBoard, depth, isMaximizing) {
  const res = checkWinner(newBoard);
  if (res?.winner === "O") return 10 - depth;
  if (res?.winner === "X") return depth - 10;
  if (res?.winner === "Tie" || depth >= 5) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < boardSize; i++) {
      if (!newBoard[i]) {
        newBoard[i] = "O";
        const evaluation = minimax(newBoard, depth + 1, false);
        newBoard[i] = null;
        maxEval = Math.max(maxEval, evaluation);
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < boardSize; i++) {
      if (!newBoard[i]) {
        newBoard[i] = "X";
        const evaluation = minimax(newBoard, depth + 1, true);
        newBoard[i] = null;
        minEval = Math.min(minEval, evaluation);
      }
    }
    return minEval;
  }
}

function makeBotMove() {
  const available = board
    .map((v, idx) => (v === null ? idx : null))
    .filter((v) => v !== null);
  if (available.length === 0) return;

  let move = null;
  const randomChance =
    botDifficulty === "easy" ? 0.75 : botDifficulty === "medium" ? 0.3 : 0;

  if (Math.random() < randomChance) {
    move = available[Math.floor(Math.random() * available.length)];
  } else if (ruleMode === "big5x5") {
    // Tactical heuristic for 5x5 board
    move = findImmediateMove("O") ?? findImmediateMove("X");
    if (move === null) {
      const center = 12;
      move = board[center] === null ? center : available[Math.floor(Math.random() * available.length)];
    }
  } else {
    let bestScore = -Infinity;
    move = available[0];
    for (const idx of available) {
      board[idx] = "O";
      const score = minimax(board, 0, false);
      board[idx] = null;
      if (score > bestScore) {
        bestScore = score;
        move = idx;
      }
    }
  }

  applyMoveToState("O", move);
  sfxMove("O");
  isXNext = true;
  isBotThinking = false;

  const check = checkWinner(board);
  if (check?.winner === "O") {
    scores.O++;
    resetWinStreak();
    stopTurnTimer();
    sfxTie();
  } else if (check?.winner === "Tie") {
    scores.ties++;
    stopTurnTimer();
    sfxTie();
  } else {
    resetTurnTimer();
  }
  renderBoard();
}

/* ==================== CELL CLICK & POWER-UP EXECUTION ==================== */
async function handleCellClick(idx) {
  const result = checkWinner(board);
  if (result || isBotThinking) return;

  const currentPlayer = isXNext ? "X" : "O";
  const oppSymbol = isXNext ? "O" : "X";

  // Handle Bomb Power-Up Click
  if (bombModeActive) {
    if (board[idx] === oppSymbol) {
      board[idx] = null;
      moveHistory[oppSymbol] = moveHistory[oppSymbol].filter((i) => i !== idx);
      bombAvailable = false;
      bombModeActive = false;
      playTone(190, "sawtooth", 0.22, 0.2);
      updatePowerUpUI();
      renderBoard();
    }
    return;
  }

  if (board[idx]) return;

  // Online Mode Handler
  if (gameMode === "online") {
    if (!opponentConnected) return;
    if (currentPlayer !== mySymbol) return;

    applyMoveToState(mySymbol, idx);
    sfxMove(mySymbol);

    const check = checkWinner(board);
    const updatedScores = { ...scores };
    if (check?.winner === "X") updatedScores.X++;
    else if (check?.winner === "O") updatedScores.O++;
    else if (check?.winner === "Tie") updatedScores.ties++;

    await update(roomRef, {
      board: board.map((c) => c || ""),
      historyX: moveHistory.X,
      historyO: moveHistory.O,
      turn: mySymbol === "X" ? "O" : "X",
      scores: updatedScores,
      updatedAt: Date.now()
    });
    return;
  }

  // Local / Bot Move Execution
  applyMoveToState(currentPlayer, idx);
  sfxMove(currentPlayer);

  const check = checkWinner(board);
  if (check) {
    stopTurnTimer();
    if (check.winner === "X") {
      scores.X++;
      recordPlayerWin();
    } else if (check.winner === "O") {
      scores.O++;
      if (gameMode === "pvp") recordPlayerWin();
      else {
        resetWinStreak();
        sfxTie();
      }
    } else if (check.winner === "Tie") {
      scores.ties++;
      sfxTie();
    }
    renderBoard();
    return;
  }

  // Check if Double Turn Power-Up is active
  if (extraTurnQueued) {
    extraTurnQueued = false;
    updatePowerUpUI();
    resetTurnTimer();
    renderBoard();
    return;
  }

  if (gameMode === "bot") {
    isXNext = false;
    isBotThinking = true;
    resetTurnTimer();
    renderBoard();
    setTimeout(makeBotMove, 400);
  } else {
    isXNext = !isXNext;
    resetTurnTimer();
    renderBoard();
  }
}

btnResetBoard.addEventListener("click", async () => {
  playTone(500, "sine", 0.08);
  boardSize = ruleMode === "big5x5" ? 25 : 9;

  if (gameMode === "online" && roomRef) {
    await update(roomRef, {
      board: Array(boardSize).fill(""),
      historyX: [],
      historyO: [],
      turn: "X",
      updatedAt: Date.now()
    });
    return;
  }
  board = Array(boardSize).fill(null);
  moveHistory = { X: [], O: [] };
  isXNext = true;
  isBotThinking = false;
  resetPowerUps();
  resetTurnTimer();
  renderBoard();
});

/* ==================== UI RENDERER ==================== */
function renderBoard() {
  const result = checkWinner(board);
  const skin = SKINS[selectedSkin] || SKINS.classic;

  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreTiesEl.textContent = scores.ties;

  cardPlayerX.classList.toggle("active-turn-x", !result && isXNext);
  cardPlayerO.classList.toggle("active-turn-o", !result && !isXNext);

  let vanishingIdx = null;
  if (ruleMode === "infinity" && !result) {
    const activeTurnPlayer = isXNext ? "X" : "O";
    if (moveHistory[activeTurnPlayer].length === 3) {
      vanishingIdx = moveHistory[activeTurnPlayer][0];
    }
  }

  // Adjust Grid Columns for 3x3 vs 5x5
  boardGrid.className =
    ruleMode === "big5x5"
      ? "board-3d grid grid-cols-5 gap-1.5 p-2.5 rounded-2xl bg-gradient-to-br from-[#1b2438] to-[#0a0e18] border border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.7)] w-full aspect-square max-w-[295px]"
      : "board-3d grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-gradient-to-br from-[#1b2438] to-[#0a0e18] border border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.7)] w-full aspect-square max-w-[280px]";

  const oppSymbol = isXNext ? "O" : "X";

  boardGrid.innerHTML = "";
  board.forEach((cell, idx) => {
    const isWinCell = result?.line?.includes(idx);
    const btn = document.createElement("button");

    const fontSize = ruleMode === "big5x5" ? "text-xl" : "text-3xl";
    let cls = `cell-3d rounded-xl ${fontSize} font-black flex items-center justify-center border `;

    if (cell === "X") {
      cls += "cell-x ";
    } else if (cell === "O") {
      cls += "cell-o ";
    } else {
      cls += "bg-white/5 border-white/10 hover:bg-white/10 ";
    }

    if (idx === vanishingIdx) cls += "cell-vanish-warning ";
    if (bombModeActive && cell === oppSymbol) cls += "cell-bomb-target ";
    if (isWinCell) cls += "cell-win ";

    btn.className = cls;
    btn.textContent = cell === "X" ? skin.X : cell === "O" ? skin.O : "";
    btn.addEventListener("click", () => handleCellClick(idx));
    boardGrid.appendChild(btn);
  });

  if (bombModeActive) {
    statusBanner.innerHTML = `<span class="text-red-400 animate-pulse">💣 Tap an opponent mark to destroy it!</span>`;
  } else if (extraTurnQueued) {
    statusBanner.innerHTML = `<span class="text-purple-400">⚡ Double Turn Active! Place 2 marks!</span>`;
  } else if (result) {
    if (result.winner === "Tie") {
      statusBanner.innerHTML = `<span class="text-[#ffd700]">🤝 Round Tied!</span>`;
    } else {
      const winColor = result.winner === "X" ? "text-[#00f2fe]" : "text-[#ff007f]";
      statusBanner.innerHTML = `<span class="${winColor}">🎉 Player ${skin[result.winner]} Wins!</span>`;
    }
  } else if (gameMode === "online") {
    const currentTurn = isXNext ? "X" : "O";
    if (!opponentConnected) {
      statusBanner.innerHTML = `<span class="text-[#ffd700] animate-pulse">⏳ Waiting for friend...</span>`;
    } else if (currentTurn === mySymbol) {
      statusBanner.innerHTML = `<span class="text-[#2ecc71]">⚡ Your Turn (${skin[mySymbol]})</span>`;
    } else {
      statusBanner.innerHTML = `<span class="text-white/60">⏳ Friend's Turn (${skin[currentTurn]})...</span>`;
    }
  } else {
    const turnColor = isXNext ? "text-[#00f2fe]" : "text-[#ff007f]";
    statusBanner.innerHTML = `Turn: <span class="${turnColor}">${
      isBotThinking ? "🤖 Bot thinking..." : `Player ${isXNext ? skin.X : skin.O}`
    }</span>`;
  }
}
