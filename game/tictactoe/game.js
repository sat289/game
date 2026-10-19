import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  onDisconnect
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

const { db } = window._tttFirebase;

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// Core Game State
let gameMode = "bot"; // 'online' | 'bot' | 'pvp'
let ruleMode = "classic"; // 'classic' | 'infinity'
let botDifficulty = "impossible"; // 'easy' | 'medium' | 'impossible'
let board = Array(9).fill(null);
let moveHistory = { X: [], O: [] }; // Tracks move order for Infinity Mode
let isXNext = true;
let isBotThinking = false;
let scores = { X: 0, O: 0, ties: 0 };
let winStreak = 0;

// Audio State
let soundEnabled = true;
let musicPlaying = false;
const bgMusic = document.getElementById("bgMusic");
const musicToggleBtn = document.getElementById("musicToggleBtn");
const soundToggleBtn = document.getElementById("soundToggleBtn");

// Turn Timer State
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
const infinityHint = document.getElementById("infinityHint");
const emojiBar = document.getElementById("emojiBar");
const emojiFloatContainer = document.getElementById("emojiFloatContainer");
const streakBadge = document.getElementById("streakBadge");

const ruleClassicBtn = document.getElementById("ruleClassicBtn");
const ruleInfinityBtn = document.getElementById("ruleInfinityBtn");

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

/* ==================== MUSIC & WEB AUDIO SFX ==================== */
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
    musicToggleBtn.className = "bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition";
  } else {
    bgMusic.volume = 0.35;
    bgMusic.play().then(() => {
      musicPlaying = true;
      musicToggleBtn.textContent = "🎵 ON";
      musicToggleBtn.className = "bg-[#00f2fe]/20 border border-[#00f2fe] text-[#00f2fe] px-2.5 py-1.5 rounded-full text-[11px] font-bold transition";
    }).catch(() => {
      alert("Place song.mp3 inside creazy/song.mp3 or tictactoe/song.mp3!");
    });
  }
});

/* ==================== RULE VARIANT SWITCHER ==================== */
ruleClassicBtn.addEventListener("click", () => {
  ruleMode = "classic";
  ruleClassicBtn.className = "flex-1 py-1.5 rounded-xl text-[11px] font-black transition bg-[#00f2fe] text-slate-950 shadow";
  ruleInfinityBtn.className = "flex-1 py-1.5 rounded-xl text-[11px] font-black transition text-white/60 hover:text-white";
  playTone(580, "sine", 0.08);
});

ruleInfinityBtn.addEventListener("click", () => {
  ruleMode = "infinity";
  ruleInfinityBtn.className = "flex-1 py-1.5 rounded-xl text-[11px] font-black transition bg-amber-400 text-slate-950 shadow";
  ruleClassicBtn.className = "flex-1 py-1.5 rounded-xl text-[11px] font-black transition text-white/60 hover:text-white";
  playTone(680, "sine", 0.08);
});

/* ==================== SCREEN NAVIGATION ==================== */
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
    infinityHint.classList.toggle("hidden", ruleMode !== "infinity");
    emojiBar.classList.toggle("hidden", gameMode !== "online");
    emojiBar.classList.toggle("flex", gameMode === "online");
    subHeaderText.textContent =
      gameMode === "online" ? `Room Code: ${roomCode}` : `${ruleMode.toUpperCase()} MATCH`;
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

/* ==================== TURN SHOT CLOCK (10s) ==================== */
function resetTurnTimer() {
  stopTurnTimer();
  const res = checkWinner(board);
  if (res) {
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
      // Auto-move if local/bot or if it's my online turn
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

/* ==================== WIN CHECK & FIREBASE SCORE SYNC ==================== */
function checkWinner(squares) {
  for (const [a, b, c] of WINNING_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  if (ruleMode === "classic" && squares.every((sq) => sq !== null && sq !== "")) {
    return { winner: "Tie", line: null };
  }
  return null;
}

function recordPlayerWin() {
  winStreak++;
  streakBadge.textContent = `🔥 ${winStreak}`;
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
  const scoreEl = document.getElementById("score");
  if (scoreEl) scoreEl.innerText = newTotal;
  if (typeof window.submitScore === "function") {
    window.submitScore(newTotal);
  }
  if (typeof confetti === "function") {
    confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
  }
  sfxWin();
}

function resetWinStreak() {
  winStreak = 0;
  streakBadge.classList.add("hidden");
}

/* ==================== APPLY MOVE (WITH INFINITY 3-MARK LOGIC) ==================== */
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

/* ==================== ONLINE MULTIPLAYER & EMOJI REACTIONS ==================== */
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
  roomRef = ref(db, `tictactoe_rooms/${roomCode}`);

  const initialRoomData = {
    board: Array(9).fill(""),
    historyX: [],
    historyO: [],
    ruleMode: ruleMode,
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

    await update(roomRef, { status: "playing", updatedAt: Date.now() });
    listenToRoomChanges();
    startOnlineGameUI();
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
      startOnlineGameUI();
    }

    if (data.reaction && data.reaction.ts > lastReactionTimestamp) {
      lastReactionTimestamp = data.reaction.ts;
      spawnFloatingEmoji(data.reaction.emoji);
    }

    opponentConnected = data.status === "playing";
    ruleMode = data.ruleMode || "classic";
    board = (data.board || Array(9).fill("")).map((v) => (v === "" ? null : v));
    moveHistory.X = data.historyX || [];
    moveHistory.O = data.historyO || [];
    isXNext = data.turn === "X";
    scores = data.scores || { X: 0, O: 0, ties: 0 };

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

function startOnlineGameUI() {
  gameMode = "online";
  matchAwarded = false;
  activeModeBadge.textContent = `ONLINE • ${ruleMode.toUpperCase()} (${mySymbol})`;
  labelPlayerX.textContent = mySymbol === "X" ? "X (YOU)" : "X (FRIEND)";
  labelPlayerO.textContent = mySymbol === "O" ? "O (YOU)" : "O (FRIEND)";
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
  board = Array(9).fill(null);
  moveHistory = { X: [], O: [] };
  isXNext = true;
  isBotThinking = false;
  scores = { X: 0, O: 0, ties: 0 };

  if (mode === "bot") {
    activeModeBadge.textContent = `BOT (${botDifficulty.toUpperCase()})`;
    labelPlayerX.textContent = "X (YOU)";
    labelPlayerO.textContent = "BOT (O)";
  } else {
    activeModeBadge.textContent = "1V1 OFFLINE";
    labelPlayerX.textContent = "PLAYER X";
    labelPlayerO.textContent = "PLAYER O";
  }

  showScreen("game");
  resetTurnTimer();
  renderBoard();
}

function minimax(newBoard, depth, isMaximizing) {
  const res = checkWinner(newBoard);
  if (res?.winner === "O") return 10 - depth;
  if (res?.winner === "X") return depth - 10;
  if (res?.winner === "Tie" || depth >= 6) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < 9; i++) {
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
    for (let i = 0; i < 9; i++) {
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

  let move;
  const randomChance =
    botDifficulty === "easy" ? 0.75 : botDifficulty === "medium" ? 0.35 : 0;

  if (Math.random() < randomChance) {
    move = available[Math.floor(Math.random() * available.length)];
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

/* ==================== CELL CLICK & RESET LOGIC ==================== */
async function handleCellClick(idx) {
  const result = checkWinner(board);
  if (board[idx] || result || isBotThinking) return;

  if (gameMode === "online") {
    if (!opponentConnected) return;
    const currentTurn = isXNext ? "X" : "O";
    if (currentTurn !== mySymbol) return;

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

  const currentPlayer = isXNext ? "X" : "O";
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

  if (gameMode === "bot") {
    isXNext = false;
    isBotThinking = true;
    resetTurnTimer();
    renderBoard();
    setTimeout(makeBotMove, 420);
  } else {
    isXNext = !isXNext;
    resetTurnTimer();
    renderBoard();
  }
}

btnResetBoard.addEventListener("click", async () => {
  playTone(500, "sine", 0.08);
  if (gameMode === "online" && roomRef) {
    await update(roomRef, {
      board: Array(9).fill(""),
      historyX: [],
      historyO: [],
      turn: "X",
      updatedAt: Date.now()
    });
    return;
  }
  board = Array(9).fill(null);
  moveHistory = { X: [], O: [] };
  isXNext = true;
  isBotThinking = false;
  resetTurnTimer();
  renderBoard();
});

/* ==================== UI RENDERER ==================== */
function renderBoard() {
  const result = checkWinner(board);

  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreTiesEl.textContent = scores.ties;

  cardPlayerX.classList.toggle("active-turn-x", !result && isXNext);
  cardPlayerO.classList.toggle("active-turn-o", !result && !isXNext);

  // Identify which cell is about to vanish in Infinity Mode
  let vanishingIdx = null;
  if (ruleMode === "infinity" && !result) {
    const activeTurnPlayer = isXNext ? "X" : "O";
    if (moveHistory[activeTurnPlayer].length === 3) {
      vanishingIdx = moveHistory[activeTurnPlayer][0];
    }
  }

  boardGrid.innerHTML = "";
  board.forEach((cell, idx) => {
    const isWinCell = result?.line?.includes(idx);
    const btn = document.createElement("button");

    let cls = "cell-3d rounded-xl text-3xl font-black flex items-center justify-center border ";
    if (cell === "X") {
      cls += "cell-x ";
    } else if (cell === "O") {
      cls += "cell-o ";
    } else {
      cls += "bg-white/5 border-white/10 hover:bg-white/10 ";
    }

    if (idx === vanishingIdx) cls += "cell-vanish-warning ";
    if (isWinCell) cls += "cell-win ";

    btn.className = cls;
    btn.textContent = cell || "";
    btn.addEventListener("click", () => handleCellClick(idx));
    boardGrid.appendChild(btn);
  });

  if (result) {
    if (result.winner === "Tie") {
      statusBanner.innerHTML = `<span class="text-[#ffd700]">🤝 Round Tied!</span>`;
    } else {
      const winColor = result.winner === "X" ? "text-[#00f2fe]" : "text-[#ff007f]";
      statusBanner.innerHTML = `<span class="${winColor}">🎉 Player ${result.winner} Wins!</span>`;
    }
  } else if (gameMode === "online") {
    const currentTurn = isXNext ? "X" : "O";
    if (!opponentConnected) {
      statusBanner.innerHTML = `<span class="text-[#ffd700] animate-pulse">⏳ Waiting for friend...</span>`;
    } else if (currentTurn === mySymbol) {
      statusBanner.innerHTML = `<span class="text-[#2ecc71]">⚡ Your Turn (${mySymbol})</span>`;
    } else {
      statusBanner.innerHTML = `<span class="text-white/60">⏳ Friend's Turn (${currentTurn})...</span>`;
    }
  } else {
    const turnColor = isXNext ? "text-[#00f2fe]" : "text-[#ff007f]";
    statusBanner.innerHTML = `Turn: <span class="${turnColor}">${
      isBotThinking ? "🤖 Bot thinking..." : `Player ${isXNext ? "X" : "O"}`
    }</span>`;
  }
}
