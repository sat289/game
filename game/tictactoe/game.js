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

// Winning Combinations
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Game State
let gameMode = "bot"; // 'online' | 'bot' | 'pvp'
let botDifficulty = "impossible"; // 'easy' | 'medium' | 'impossible'
let board = Array(9).fill(null);
let isXNext = true;
let isBotThinking = false;
let scores = { X: 0, O: 0, ties: 0 };
let soundEnabled = true;

// Online Multiplayer State
let roomCode = null;
let mySymbol = "X"; // Host = 'X', Guest = 'O'
let roomRef = null;
let opponentConnected = false;
let matchAwarded = false; // Prevents double-counting wins on firebase snapshot updates

// DOM Elements - Screens
const mainMenuScreen = document.getElementById("mainMenuScreen");
const onlineLobbyScreen = document.getElementById("onlineLobbyScreen");
const botMenuScreen = document.getElementById("botMenuScreen");
const gameScreen = document.getElementById("gameScreen");
const subHeaderText = document.getElementById("subHeaderText");

// DOM Elements - Online Lobby
const btnCreateRoom = document.getElementById("btnCreateRoom");
const createdRoomBox = document.getElementById("createdRoomBox");
const generatedCodeText = document.getElementById("generatedCodeText");
const btnCopyCode = document.getElementById("btnCopyCode");
const joinCodeInput = document.getElementById("joinCodeInput");
const btnJoinRoom = document.getElementById("btnJoinRoom");
const lobbyErrorMsg = document.getElementById("lobbyErrorMsg");

// DOM Elements - Game Screen
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
const btnResetBoard = document.getElementById("btnResetBoard");
const soundToggleBtn = document.getElementById("soundToggleBtn");

/* ==================== SOUND SYNTHESIZER (WEB AUDIO API) ==================== */
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

/* ==================== NAVIGATION ==================== */
function showScreen(screenName) {
  mainMenuScreen.classList.add("hidden");
  onlineLobbyScreen.classList.add("hidden");
  botMenuScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");

  if (screenName === "menu") {
    mainMenuScreen.classList.remove("hidden");
    subHeaderText.textContent = "Select Game Mode";
  } else if (screenName === "lobby") {
    onlineLobbyScreen.classList.remove("hidden");
    onlineLobbyScreen.classList.add("flex");
    subHeaderText.textContent = "Online Multiplayer Lobby";
  } else if (screenName === "botMenu") {
    botMenuScreen.classList.remove("hidden");
    botMenuScreen.classList.add("flex");
    subHeaderText.textContent = "Choose AI Difficulty";
  } else if (screenName === "game") {
    gameScreen.classList.remove("hidden");
    gameScreen.classList.add("flex");
    subHeaderText.textContent =
      gameMode === "online" ? `Room Code: ${roomCode}` : "Match In Progress";
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

/* ==================== WIN CHECK & FIREBASE SCORE INCREMENT ==================== */
function checkWinner(squares) {
  for (const [a, b, c] of WINNING_LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  if (squares.every((sq) => sq !== null && sq !== "")) {
    return { winner: "Tie", line: null };
  }
  return null;
}

function recordPlayerWin() {
  const currentTotal = (typeof window.score === "number" ? window.score : 0) + 1;
  window.score = currentTotal;
  const scoreEl = document.getElementById("score");
  if (scoreEl) scoreEl.innerText = currentTotal;
  if (typeof window.submitScore === "function") {
    window.submitScore(currentTotal);
  }
  if (typeof confetti === "function") {
    confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
  }
  sfxWin();
}

/* ==================== ONLINE MULTIPLAYER (ROOM CODE SYSTEM) ==================== */
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

btnCreateRoom.addEventListener("click", async () => {
  cleanupOnlineRoom();
  lobbyErrorMsg.classList.add("hidden");

  roomCode = generateRoomCode();
  mySymbol = "X";
  roomRef = ref(db, `tictactoe_rooms/${roomCode}`);

  const initialRoomData = {
    board: Array(9).fill(""),
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

    // Transition host from lobby into game once guest joins
    if (data.status === "playing" && !onlineLobbyScreen.classList.contains("hidden")) {
      startOnlineGameUI();
    }

    opponentConnected = data.status === "playing";
    board = (data.board || Array(9).fill("")).map((v) => (v === "" ? null : v));
    isXNext = data.turn === "X";
    scores = data.scores || { X: 0, O: 0, ties: 0 };

    const result = checkWinner(board);
    if (!result) {
      matchAwarded = false;
    } else if (!matchAwarded) {
      matchAwarded = true;
      if (result.winner === mySymbol) {
        recordPlayerWin();
      } else if (result.winner === "Tie") {
        sfxTie();
      }
    }

    renderBoard();
  });
}

function startOnlineGameUI() {
  gameMode = "online";
  matchAwarded = false;
  activeModeBadge.textContent = `ONLINE • YOU ARE ${mySymbol}`;
  labelPlayerX.textContent = mySymbol === "X" ? "X (YOU)" : "X (FRIEND)";
  labelPlayerO.textContent = mySymbol === "O" ? "O (YOU)" : "O (FRIEND)";
  showScreen("game");
  playTone(880, "sine", 0.15);
}

function cleanupOnlineRoom() {
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
  renderBoard();
}

function minimax(newBoard, depth, isMaximizing) {
  const res = checkWinner(newBoard);
  if (res?.winner === "O") return 10 - depth;
  if (res?.winner === "X") return depth - 10;
  if (res?.winner === "Tie") return 0;

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

  board[move] = "O";
  sfxMove("O");
  isXNext = true;
  isBotThinking = false;

  const check = checkWinner(board);
  if (check?.winner === "O") {
    scores.O++;
    sfxTie();
  } else if (check?.winner === "Tie") {
    scores.ties++;
    sfxTie();
  }
  renderBoard();
}

/* ==================== CELL CLICK & RESET LOGIC ==================== */
async function handleCellClick(idx) {
  const result = checkWinner(board);
  if (board[idx] || result || isBotThinking) return;

  // Online Mode Handler
  if (gameMode === "online") {
    if (!opponentConnected) return;
    const currentTurn = isXNext ? "X" : "O";
    if (currentTurn !== mySymbol) return; // Not your turn!

    board[idx] = mySymbol;
    sfxMove(mySymbol);

    const check = checkWinner(board);
    const updatedScores = { ...scores };
    if (check?.winner === "X") updatedScores.X++;
    else if (check?.winner === "O") updatedScores.O++;
    else if (check?.winner === "Tie") updatedScores.ties++;

    await update(roomRef, {
      board: board.map((c) => c || ""),
      turn: mySymbol === "X" ? "O" : "X",
      scores: updatedScores,
      updatedAt: Date.now()
    });
    return;
  }

  // Bot & Offline 1v1 Handler
  const currentPlayer = isXNext ? "X" : "O";
  board[idx] = currentPlayer;
  sfxMove(currentPlayer);

  const check = checkWinner(board);
  if (check) {
    if (check.winner === "X") {
      scores.X++;
      recordPlayerWin();
    } else if (check.winner === "O") {
      scores.O++;
      if (gameMode === "pvp") recordPlayerWin();
      else sfxTie();
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
    renderBoard();
    setTimeout(makeBotMove, 380);
  } else {
    isXNext = !isXNext;
    renderBoard();
  }
}

btnResetBoard.addEventListener("click", async () => {
  playTone(500, "sine", 0.08);
  if (gameMode === "online" && roomRef) {
    await update(roomRef, {
      board: Array(9).fill(""),
      turn: "X",
      updatedAt: Date.now()
    });
    return;
  }
  board = Array(9).fill(null);
  isXNext = true;
  isBotThinking = false;
  renderBoard();
});

/* ==================== UI RENDERER ==================== */
function renderBoard() {
  const result = checkWinner(board);

  // Update Scoreboard numbers
  scoreXEl.textContent = scores.X;
  scoreOEl.textContent = scores.O;
  scoreTiesEl.textContent = scores.ties;

  // Highlight active player's card
  cardPlayerX.classList.toggle("active-turn-x", !result && isXNext);
  cardPlayerO.classList.toggle("active-turn-o", !result && !isXNext);

  // Render 9 cells
  boardGrid.innerHTML = "";
  board.forEach((cell, idx) => {
    const isWinCell = result?.line?.includes(idx);
    const btn = document.createElement("button");

    let cls =
      "cell-3d rounded-xl text-3xl font-black flex items-center justify-center border ";
    if (cell === "X") {
      cls += "cell-x ";
    } else if (cell === "O") {
      cls += "cell-o ";
    } else {
      cls += "bg-white/5 border-white/10 hover:bg-white/10 ";
    }

    if (isWinCell) cls += "cell-win ";

    btn.className = cls;
    btn.textContent = cell || "";
    btn.addEventListener("click", () => handleCellClick(idx));
    boardGrid.appendChild(btn);
  });

  // Update Status Banner
  if (result) {
    if (result.winner === "Tie") {
      statusBanner.innerHTML = `<span class="text-[#ffd700]">🤝 Round Tied! Tap Next Round</span>`;
    } else {
      const winColor = result.winner === "X" ? "text-[#00f2fe]" : "text-[#ff007f]";
      statusBanner.innerHTML = `<span class="${winColor}">🎉 Player ${result.winner} Wins the Round!</span>`;
    }
  } else if (gameMode === "online") {
    const currentTurn = isXNext ? "X" : "O";
    if (!opponentConnected) {
      statusBanner.innerHTML = `<span class="text-[#ffd700] animate-pulse">⏳ Waiting for friend to join...</span>`;
    } else if (currentTurn === mySymbol) {
      statusBanner.innerHTML = `<span class="text-[#2ecc71]">⚡ Your Turn (${mySymbol})</span>`;
    } else {
      statusBanner.innerHTML = `<span class="text-white/60">⏳ Opponent's Turn (${currentTurn})...</span>`;
    }
  } else {
    const turnColor = isXNext ? "text-[#00f2fe]" : "text-[#ff007f]";
    statusBanner.innerHTML = `Turn: <span class="${turnColor}">${
      isBotThinking ? "🤖 Bot is thinking..." : `Player ${isXNext ? "X" : "O"}`
    }</span>`;
  }
}
