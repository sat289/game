// ==========================================
// 1. FIREBASE SETUP (Optional Online Sync)
// ==========================================
// Replace with your Firebase project config to enable live online sync
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID"
};

let dbRef = null;
// Uncomment below if you add valid Firebase credentials:
/*
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
dbRef = ref(db, 'matches/room_1');
*/

// ==========================================
// 2. BOARD COORDINATES & CONSTANTS
// ==========================================
const PLAYERS = ['red', 'green', 'yellow', 'blue'];

// 52-step clockwise perimeter track (row, col)
const MAIN_TRACK = [
  [6,1],[6,2],[6,3],[6,4],[6,5],
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
  [0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  [7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
  [14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
  [7,0],[6,0]
];

const START_INDEX = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

const HOME_PATHS = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  yellow: [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  blue:   [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]]
};

const BASE_POSITIONS = {
  red:    [[1,1],[1,4],[4,1],[4,4]],
  green:  [[1,10],[1,13],[4,10],[4,13]],
  yellow: [[10,10],[10,13],[13,10],[13,13]],
  blue:   [[10,1],[10,4],[13,1],[13,4]]
};

// ==========================================
// 3. GAME STATE & STORAGE
// ==========================================
const STORAGE_KEY = 'PRO_LUDO_STATE_V1';

let state = {
  mode: 'bot', // 'bot', 'local', 'online'
  turnIndex: 0,
  diceValue: null,
  waitingForMove: false,
  tokens: {
    red:    [-1, -1, -1, -1], // -1 = base, 0-50 = main track, 51-56 = home stretch (56 = finished)
    green:  [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue:   [-1, -1, -1, -1]
  }
};

// ==========================================
// 4. DOM ELEMENTS & INITIALIZATION
// ==========================================
const boardEl = document.getElementById('ludo-board');
const rollBtn = document.getElementById('roll-btn');
const diceCube = document.getElementById('dice-cube');
const turnBadge = document.getElementById('turn-indicator');
const statusMsg = document.getElementById('status-message');
const modeSelect = document.getElementById('game-mode');

function init() {
  buildBoardGrid();
  loadState();
  renderState();

  rollBtn.addEventListener('click', handleRollDice);
  document.getElementById('new-game-btn').addEventListener('click', startNewGame);
  document.getElementById('clear-save-btn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    startNewGame();
  });
  modeSelect.addEventListener('change', (e) => {
    state.mode = e.target.value;
    saveState();
  });
}

function buildBoardGrid() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.r = r;
      cell.dataset.c = c;

      // Color 6x6 bases
      if (r < 6 && c < 6) cell.classList.add('bg-red');
      if (r < 6 && c > 8) cell.classList.add('bg-green');
      if (r > 8 && c > 8) cell.classList.add('bg-yellow');
      if (r > 8 && c < 6) cell.classList.add('bg-blue');

      // Center 3x3 home triangle area
      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) cell.classList.add('bg-center');

      // Color Home stretches
      if (r === 7 && c >= 1 && c <= 5) cell.classList.add('bg-red');
      if (c === 7 && r >= 1 && r <= 5) cell.classList.add('bg-green');
      if (r === 7 && c >= 9 && c <= 13) cell.classList.add('bg-yellow');
      if (c === 7 && r >= 9 && r <= 13) cell.classList.add('bg-blue');

      // Color starting squares & safe stars
      SAFE_INDICES.forEach(idx => {
        const [sr, sc] = MAIN_TRACK[idx];
        if (sr === r && sc === c) cell.classList.add('safe-star');
      });

      if (r === 6 && c === 1) cell.classList.add('bg-red');
      if (r === 1 && c === 8) cell.classList.add('bg-green');
      if (r === 8 && c === 13) cell.classList.add('bg-yellow');
      if (r === 13 && c === 6) cell.classList.add('bg-blue');

      boardEl.appendChild(cell);
    }
  }
}

// ==========================================
// 5. CORE GAMEPLAY & LOGIC
// ==========================================
function getCurrentPlayer() {
  return PLAYERS[state.turnIndex];
}

function getCoordinates(color, step) {
  if (step === -1) return null; // Handled by BASE_POSITIONS
  if (step <= 50) {
    const trackIdx = (START_INDEX[color] + step) % 52;
    return MAIN_TRACK[trackIdx];
  }
  const homeIdx = step - 51;
  return HOME_PATHS[color][homeIdx];
}

function canTokenMove(color, tokenIdx, roll) {
  const step = state.tokens[color][tokenIdx];
  if (step === -1) return roll === 6;
  return step + roll <= 56;
}

function getMovableTokens(color, roll) {
  return state.tokens[color]
    .map((_, idx) => idx)
    .filter(idx => canTokenMove(color, idx, roll));
}

function handleRollDice() {
  if (state.waitingForMove) return;
  rollBtn.disabled = true;

  const roll = Math.floor(Math.random() * 6) + 1;
  state.diceValue = roll;
  animate3DDice(roll);

  setTimeout(() => {
    const player = getCurrentPlayer();
    const movable = getMovableTokens(player, roll);

    if (movable.length === 0) {
      statusMsg.textContent = `Rolled ${roll}. No valid moves!`;
      setTimeout(nextTurn, 1000);
    } else if (movable.length === 1 && (state.mode === 'bot' && player !== 'red')) {
      moveToken(player, movable[0]);
    } else {
      state.waitingForMove = true;
      statusMsg.textContent = `Rolled ${roll}! Select a highlighted token.`;
      renderState();

      // Trigger Bot Decision
      if (state.mode === 'bot' && player !== 'red') {
        setTimeout(() => runBotTurn(player, movable), 600);
      }
    }
  }, 850);
}

function animate3DDice(roll) {
  const rotations = {
    1: 'rotateX(0deg) rotateY(0deg)',
    2: 'rotateX(0deg) rotateY(-180deg)',
    3: 'rotateX(0deg) rotateY(-90deg)',
    4: 'rotateX(0deg) rotateY(90deg)',
    5: 'rotateX(-90deg) rotateY(0deg)',
    6: 'rotateX(90deg) rotateY(0deg)'
  };
  const extraSpins = `rotateX(${360 * 2}deg) rotateY(${360 * 2}deg) `;
  diceCube.style.transform = `translateZ(-40px) ${extraSpins} ${rotations[roll]}`;
}

function moveToken(color, tokenIdx) {
  if (!state.waitingForMove && !(state.mode === 'bot' && color !== 'red')) return;
  const roll = state.diceValue;
  if (!canTokenMove(color, tokenIdx, roll)) return;

  state.waitingForMove = false;
  let currentStep = state.tokens[color][tokenIdx];

  if (currentStep === -1 && roll === 6) {
    state.tokens[color][tokenIdx] = 0;
  } else {
    state.tokens[color][tokenIdx] += roll;
  }

  const newStep = state.tokens[color][tokenIdx];
  let capturedOpponent = false;

  // Check Captures on Main Track
  if (newStep >= 0 && newStep <= 50) {
    const globalIdx = (START_INDEX[color] + newStep) % 52;
    if (!SAFE_INDICES.includes(globalIdx)) {
      PLAYERS.forEach(oppColor => {
        if (oppColor === color) return;
        state.tokens[oppColor].forEach((oppStep, oppIdx) => {
          if (oppStep >= 0 && oppStep <= 50) {
            const oppGlobalIdx = (START_INDEX[oppColor] + oppStep) % 52;
            if (oppGlobalIdx === globalIdx) {
              state.tokens[oppColor][oppIdx] = -1; // Send back to base
              capturedOpponent = true;
            }
          }
        });
      });
    }
  }

  saveState();
  renderState();

  // Check Win Condition
  if (state.tokens[color].every(s => s === 56)) {
    statusMsg.textContent = `${color.toUpperCase()} WINS THE GAME! 🎉`;
    rollBtn.disabled = true;
    return;
  }

  // Bonus Roll on 6, Capture, or Reaching Home (56)
  if (roll === 6 || capturedOpponent || newStep === 56) {
    statusMsg.textContent = `${color.toUpperCase()} gets a bonus roll!`;
    rollBtn.disabled = false;
    if (state.mode === 'bot' && color !== 'red') {
      setTimeout(handleRollDice, 900);
    }
  } else {
    nextTurn();
  }
}

function nextTurn() {
  state.turnIndex = (state.turnIndex + 1) % 4;
  state.diceValue = null;
  state.waitingForMove = false;
  saveState();
  renderState();

  const currentPlayer = getCurrentPlayer();
  if (state.mode === 'bot' && currentPlayer !== 'red') {
    rollBtn.disabled = true;
    setTimeout(handleRollDice, 800);
  } else {
    rollBtn.disabled = false;
  }
}

// ==========================================
// 6. SMART BOT AI
// ==========================================
function runBotTurn(botColor, movableIndices) {
  const roll = state.diceValue;
  let bestToken = movableIndices[0];
  let bestScore = -1;

  movableIndices.forEach(idx => {
    const step = state.tokens[botColor][idx];
    let score = 0;

    // Priority 1: Unlock token from base
    if (step === -1 && roll === 6) score = 80;
    // Priority 2: Enter home triangle
    else if (step + roll === 56) score = 100;
    // Priority 3: Capture an opponent
    else if (step + roll <= 50) {
      const targetGlobal = (START_INDEX[botColor] + step + roll) % 52;
      if (!SAFE_INDICES.includes(targetGlobal)) {
        PLAYERS.forEach(opp => {
          if (opp !== botColor) {
            state.tokens[opp].forEach(oppStep => {
              if (oppStep >= 0 && oppStep <= 50 && (START_INDEX[opp] + oppStep) % 52 === targetGlobal) {
                score = 95;
              }
            });
          }
        });
      }
      // Priority 4: Land on a safe star
      if (SAFE_INDICES.includes(targetGlobal)) score = Math.max(score, 60);
    }
    // Default: Advance furthest token
    score += step;

    if (score > bestScore) {
      bestScore = score;
      bestToken = idx;
    }
  });

  moveToken(botColor, bestToken);
}

// ==========================================
// 7. RENDER & PERSISTENCE
// ==========================================
function renderState() {
  document.querySelectorAll('.token').forEach(t => t.remove());

  const currentPlayer = getCurrentPlayer();
  turnBadge.textContent = `${currentPlayer.toUpperCase()}'S TURN`;
  turnBadge.className = `turn-badge ${currentPlayer}`;
  modeSelect.value = state.mode;

  PLAYERS.forEach(color => {
    state.tokens[color].forEach((step, idx) => {
      const [r, c] = step === -1 ? BASE_POSITIONS[color][idx] : getCoordinates(color, step);
      const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      if (!cell) return;

      const token = document.createElement('div');
      token.classList.add('token', color);

      if (state.waitingForMove && color === currentPlayer && canTokenMove(color, idx, state.diceValue)) {
        token.classList.add('movable');
        token.addEventListener('click', () => moveToken(color, idx));
      }

      cell.appendChild(token);
    });
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (state.mode === 'online' && dbRef) {
    // Sync with Firebase if configured
    // set(dbRef, state);
  }
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      state = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved state', e);
    }
  }
}

function startNewGame() {
  state = {
    mode: modeSelect.value,
    turnIndex: 0,
    diceValue: null,
    waitingForMove: false,
    tokens: {
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1]
    }
  };
  rollBtn.disabled = false;
  statusMsg.textContent = 'New game started! Roll the dice.';
  saveState();
  renderState();
}

init();
