// =====================================================
// 1. SYNTHESIZED WEB AUDIO ENGINE (No MP3s Required)
// =====================================================
class SoundFX {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.muted = false;
  }

  playTone(freq, type = 'sine', duration = 0.12, delay = 0) {
    if (this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    setTimeout(() => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }, delay);
  }

  dice() {
    [220, 330, 280, 400].forEach((f, i) => this.playTone(f, 'triangle', 0.06, i * 60));
  }
  hop() {
    this.playTone(480, 'sine', 0.09);
  }
  capture() {
    [520, 380, 240].forEach((f, i) => this.playTone(f, 'sawtooth', 0.14, i * 90));
  }
  win() {
    [523, 659, 783, 1046].forEach((f, i) => this.playTone(f, 'triangle', 0.22, i * 130));
  }
}

const sfx = new SoundFX();

// =====================================================
// 2. BOARD COORDINATES & CONSTANTS
// =====================================================
const PLAYERS = ['red', 'green', 'yellow', 'blue'];

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

// =====================================================
// 3. STATE, ECONOMY & TIMER VARIABLES
// =====================================================
const STORAGE_KEY = 'PRO_LUDO_ULTIMATE_V2';
const PROFILE_KEY = 'PRO_LUDO_PROFILE_V2';

let profile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || { coins: 100, wins: 0 };

let state = {
  mode: 'bot',
  ruleMode: 'classic',
  roomCode: null,
  turnIndex: 0,
  sixStreak: 0,
  diceValue: null,
  waitingForMove: false,
  isAnimating: false,
  tokens: {
    red:    [-1, -1, -1, -1],
    green:  [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue:   [-1, -1, -1, -1]
  }
};

let turnTimer = null;
let timeLeft = 15;

// =====================================================
// 4. DOM REFERENCES & SETUP
// =====================================================
const boardEl = document.getElementById('ludo-board');
const rollBtn = document.getElementById('roll-btn');
const diceCube = document.getElementById('dice-cube');
const turnBadge = document.getElementById('turn-indicator');
const statusMsg = document.getElementById('status-message');
const timerSecEl = document.getElementById('timer-sec');
const timerBarEl = document.getElementById('timer-bar');
const coinEl = document.getElementById('coin-count');
const winEl = document.getElementById('win-count');
const modeSelect = document.getElementById('game-mode');
const ruleSelect = document.getElementById('rule-mode');
const roomBox = document.getElementById('room-box');
const roomInput = document.getElementById('room-input');

function init() {
  buildBoardGrid();
  loadState();
  updateProfileUI();
  renderState();
  resetTurnTimer();

  rollBtn.addEventListener('click', handleRollDice);
  document.getElementById('new-game-btn').addEventListener('click', startNewGame);

  modeSelect.addEventListener('change', (e) => {
    state.mode = e.target.value;
    roomBox.classList.toggle('hidden', state.mode !== 'online');
    saveState();
  });

  ruleSelect.addEventListener('change', (e) => {
    state.ruleMode = e.target.value;
    startNewGame();
  });

  document.getElementById('theme-select').addEventListener('change', (e) => {
    document.body.dataset.theme = e.target.value;
  });

  document.getElementById('toggle-3d-btn').addEventListener('click', (e) => {
    const tilted = boardEl.classList.toggle('tilted-3d');
    e.target.textContent = `🧊 3D Tilt: ${tilted ? 'ON' : 'OFF'}`;
  });

  document.getElementById('mute-btn').addEventListener('click', (e) => {
    sfx.muted = !sfx.muted;
    e.target.textContent = sfx.muted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
  });

  // Emoji Reactions
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => triggerEmoji(btn.dataset.emoji));
  });

  // Online Room Generator
  document.getElementById('create-room-btn').addEventListener('click', () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    roomInput.value = code;
    state.roomCode = code;
    statusMsg.textContent = `Room ${code} created! Share with friends.`;
  });

  document.getElementById('join-room-btn').addEventListener('click', () => {
    if (roomInput.value.trim().length === 6) {
      state.roomCode = roomInput.value.trim().toUpperCase();
      statusMsg.textContent = `Joined Room ${state.roomCode}!`;
    }
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

      if (r < 6 && c < 6) cell.classList.add('bg-red');
      if (r < 6 && c > 8) cell.classList.add('bg-green');
      if (r > 8 && c > 8) cell.classList.add('bg-yellow');
      if (r > 8 && c < 6) cell.classList.add('bg-blue');
      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) cell.classList.add('bg-center');

      if (r === 7 && c >= 1 && c <= 5) cell.classList.add('bg-red');
      if (c === 7 && r >= 1 && r <= 5) cell.classList.add('bg-green');
      if (r === 7 && c >= 9 && c <= 13) cell.classList.add('bg-yellow');
      if (c === 7 && r >= 9 && r <= 13) cell.classList.add('bg-blue');

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

// =====================================================
// 5. TURN TIMER & EMOJI FX
// =====================================================
function resetTurnTimer() {
  clearInterval(turnTimer);
  timeLeft = 15;
  timerSecEl.textContent = timeLeft;
  timerBarEl.style.width = '100%';

  turnTimer = setInterval(() => {
    if (state.isAnimating) return;
    timeLeft--;
    timerSecEl.textContent = timeLeft;
    timerBarEl.style.width = `${(timeLeft / 15) * 100}%`;

    if (timeLeft <= 0) {
      clearInterval(turnTimer);
      statusMsg.textContent = '⏰ Time up! Auto-playing...';
      if (!state.waitingForMove) {
        handleRollDice();
      } else {
        const player = getCurrentPlayer();
        const movable = getMovableTokens(player, state.diceValue);
        if (movable.length > 0) runBotTurn(player, movable);
      }
    }
  }, 1000);
}

function triggerEmoji(emoji) {
  const floater = document.getElementById('emoji-floater');
  floater.textContent = emoji;
  floater.classList.remove('pop');
  void floater.offsetWidth; // Reflow
  floater.classList.add('pop');
}

// =====================================================
// 6. CORE GAMEPLAY, THREE-6s RULE & STEP HOPPING
// =====================================================
function getCurrentPlayer() {
  return PLAYERS[state.turnIndex];
}

function getCoordinates(color, step) {
  if (step === -1) return null;
  if (step <= 50) return MAIN_TRACK[(START_INDEX[color] + step) % 52];
  return HOME_PATHS[color][step - 51];
}

function canTokenMove(color, tokenIdx, roll) {
  const step = state.tokens[color][tokenIdx];
  if (step === -1) return roll === 6;
  return step + roll <= 56;
}

function getMovableTokens(color, roll) {
  return state.tokens[color]
    .map((_, i) => i)
    .filter(i => canTokenMove(color, i, roll));
}

function handleRollDice() {
  if (state.waitingForMove || state.isAnimating) return;
  rollBtn.disabled = true;

  const roll = Math.floor(Math.random() * 6) + 1;
  state.diceValue = roll;
  sfx.dice();
  if (navigator.vibrate) navigator.vibrate(35);
  animate3DDice(roll);

  setTimeout(() => {
    const player = getCurrentPlayer();

    // Check Three Consecutive Sixes Penalty
    if (roll === 6) {
      state.sixStreak++;
      if (state.sixStreak === 3) {
        statusMsg.textContent = `Rolled three 6s in a row! Turn forfeited.`;
        setTimeout(nextTurn, 1100);
        return;
      }
    } else {
      state.sixStreak = 0;
    }

    const movable = getMovableTokens(player, roll);

    if (movable.length === 0) {
      statusMsg.textContent = `Rolled ${roll}. No valid moves!`;
      setTimeout(nextTurn, 1000);
    } else if (movable.length === 1) {
      // Auto-move if only 1 valid token exists
      moveToken(player, movable[0]);
    } else {
      state.waitingForMove = true;
      statusMsg.textContent = `Rolled ${roll}! Choose a token.`;
      renderState();

      if (state.mode === 'bot' && player !== 'red') {
        setTimeout(() => runBotTurn(player, movable), 600);
      }
    }
  }, 800);
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
  diceCube.style.transform = `translateZ(-38px) rotateX(720deg) rotateY(720deg) ${rotations[roll]}`;
}

async function moveToken(color, tokenIdx) {
  if (state.isAnimating) return;
  const roll = state.diceValue;
  if (!canTokenMove(color, tokenIdx, roll)) return;

  state.waitingForMove = false;
  state.isAnimating = true;
  let currentStep = state.tokens[color][tokenIdx];

  // Step-by-Step Hopping Animation
  if (currentStep === -1 && roll === 6) {
    state.tokens[color][tokenIdx] = 0;
    sfx.hop();
    renderState(color, tokenIdx);
    await new Promise(r => setTimeout(r, 180));
  } else {
    for (let s = 1; s <= roll; s++) {
      state.tokens[color][tokenIdx]++;
      sfx.hop();
      renderState(color, tokenIdx);
      await new Promise(r => setTimeout(r, 155));
    }
  }

  state.isAnimating = false;
  const newStep = state.tokens[color][tokenIdx];
  let capturedOpponent = false;

  // Capture Check
  if (newStep >= 0 && newStep <= 50) {
    const globalIdx = (START_INDEX[color] + newStep) % 52;
    if (!SAFE_INDICES.includes(globalIdx)) {
      PLAYERS.forEach(oppColor => {
        if (oppColor === color) return;
        state.tokens[oppColor].forEach((oppStep, oppIdx) => {
          if (oppStep >= 0 && oppStep <= 50) {
            const oppGlobalIdx = (START_INDEX[oppColor] + oppStep) % 52;
            if (oppGlobalIdx === globalIdx) {
              state.tokens[oppColor][oppIdx] = -1;
              capturedOpponent = true;
            }
          }
        });
      });
    }
  }

  if (capturedOpponent) {
    sfx.capture();
    boardEl.classList.add('shake');
    setTimeout(() => boardEl.classList.remove('shake'), 450);
    if (color === 'red') addCoins(10);
  }

  saveState();
  renderState();

  // Win Check
  if (state.tokens[color].every(s => s === 56)) {
    sfx.win();
    clearInterval(turnTimer);
    statusMsg.textContent = `🏆 ${color.toUpperCase()} WINS THE MATCH!`;
    if (color === 'red') {
      profile.wins++;
      addCoins(100);
    }
    rollBtn.disabled = true;
    return;
  }

  // Bonus Turn Check
  if (roll === 6 || capturedOpponent || newStep === 56) {
    statusMsg.textContent = `${color.toUpperCase()} earns a bonus roll!`;
    resetTurnTimer();
    rollBtn.disabled = false;
    if (state.mode === 'bot' && color !== 'red') {
      setTimeout(handleRollDice, 850);
    }
  } else {
    nextTurn();
  }
}

function nextTurn() {
  state.turnIndex = (state.turnIndex + 1) % 4;
  state.sixStreak = 0;
  state.diceValue = null;
  state.waitingForMove = false;
  saveState();
  renderState();
  resetTurnTimer();

  const currentPlayer = getCurrentPlayer();
  if (state.mode === 'bot' && currentPlayer !== 'red') {
    rollBtn.disabled = true;
    setTimeout(handleRollDice, 750);
  } else {
    rollBtn.disabled = false;
  }
}

// =====================================================
// 7. BOT AI & PERSISTENCE
// =====================================================
function runBotTurn(botColor, movableIndices) {
  const roll = state.diceValue;
  let bestToken = movableIndices[0];
  let bestScore = -1;

  movableIndices.forEach(idx => {
    const step = state.tokens[botColor][idx];
    let score = 0;

    if (step === -1 && roll === 6) score = 85;
    else if (step + roll === 56) score = 110;
    else if (step + roll <= 50) {
      const targetGlobal = (START_INDEX[botColor] + step + roll) % 52;
      if (!SAFE_INDICES.includes(targetGlobal)) {
        PLAYERS.forEach(opp => {
          if (opp !== botColor) {
            state.tokens[opp].forEach(oppStep => {
              if (oppStep >= 0 && oppStep <= 50 && (START_INDEX[opp] + oppStep) % 52 === targetGlobal) {
                score = 100;
              }
            });
          }
        });
      }
      if (SAFE_INDICES.includes(targetGlobal)) score = Math.max(score, 65);
    }
    score += step;

    if (score > bestScore) {
      bestScore = score;
      bestToken = idx;
    }
  });

  moveToken(botColor, bestToken);
}

function renderState(hoppingColor = null, hoppingIdx = null) {
  document.querySelectorAll('.token').forEach(t => t.remove());

  const currentPlayer = getCurrentPlayer();
  turnBadge.textContent = `${currentPlayer.toUpperCase()}'S TURN`;
  turnBadge.className = `turn-badge ${currentPlayer}`;

  PLAYERS.forEach(color => {
    state.tokens[color].forEach((step, idx) => {
      const [r, c] = step === -1 ? BASE_POSITIONS[color][idx] : getCoordinates(color, step);
      const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      if (!cell) return;

      const token = document.createElement('div');
      token.classList.add('token', color);

      if (color === hoppingColor && idx === hoppingIdx) {
        token.classList.add('hopping');
      }

      if (state.waitingForMove && color === currentPlayer && canTokenMove(color, idx, state.diceValue)) {
        token.classList.add('movable');
        token.addEventListener('click', () => moveToken(color, idx));
      }

      cell.appendChild(token);
    });
  });
}

function addCoins(amount) {
  profile.coins += amount;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  updateProfileUI();
}

function updateProfileUI() {
  coinEl.textContent = profile.coins;
  winEl.textContent = profile.wins;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      state = { ...state, ...JSON.parse(saved), isAnimating: false };
      modeSelect.value = state.mode;
      ruleSelect.value = state.ruleMode;
    } catch (e) {
      console.error(e);
    }
  }
}

function startNewGame() {
  const isQuick = ruleSelect.value === 'quick';
  const startTokens = () => isQuick ? [0, 0, -1, -1] : [-1, -1, -1, -1];

  state = {
    mode: modeSelect.value,
    ruleMode: ruleSelect.value,
    roomCode: state.roomCode,
    turnIndex: 0,
    sixStreak: 0,
    diceValue: null,
    waitingForMove: false,
    isAnimating: false,
    tokens: {
      red: startTokens(),
      green: startTokens(),
      yellow: startTokens(),
      blue: startTokens()
    }
  };

  rollBtn.disabled = false;
  statusMsg.textContent = isQuick
    ? '⚡ Quick Ludo started! 2 tokens unlocked.'
    : 'New Classic match started! Roll the dice.';
  saveState();
  renderState();
  resetTurnTimer();
}

init();
