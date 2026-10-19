class SoundFX {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.muted = false;
  }
  playTone(freq, type = 'sine', duration = 0.1, delay = 0) {
    if (this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    setTimeout(() => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }, delay);
  }
  dice() { [200, 300, 250, 380].forEach((f, i) => this.playTone(f, 'triangle', 0.05, i * 50)); }
  hop() { this.playTone(500, 'sine', 0.08); }
  capture() { [500, 350, 200].forEach((f, i) => this.playTone(f, 'sawtooth', 0.12, i * 80)); }
  win() { [523, 659, 783, 1046].forEach((f, i) => this.playTone(f, 'triangle', 0.2, i * 120)); }
}
const sfx = new SoundFX();

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
  red:    [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  green:  [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],
  yellow: [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]],
  blue:   [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]]
};

const STORAGE_KEY = 'PRO_LUDO_GAME_STATE';

let state = {
  mode: 'bot',
  turnIndex: 0,
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

let activeRoomRef = null;
let isRemoteSync = false;

const boardEl = document.getElementById('ludo-board');
const rollBtn = document.getElementById('roll-btn');
const diceCube = document.getElementById('dice-cube');
const turnBadge = document.getElementById('turn-indicator');
const statusMsg = document.getElementById('status-message');
const modeSelect = document.getElementById('game-mode');
const roomPanel = document.getElementById('room-panel');
const roomInputCode = document.getElementById('room-input-code');
const displayRoomCode = document.getElementById('display-room-code');

function init() {
  buildBoardGrid();
  loadState();
  renderState();

  rollBtn.addEventListener('click', handleRollDice);
  document.getElementById('new-game-btn').addEventListener('click', startNewGame);

  modeSelect.addEventListener('change', (e) => {
    state.mode = e.target.value;
    roomPanel.classList.toggle('hidden', state.mode !== 'online');
    saveState();
  });

  // Room Code Generator / Join Handlers
  document.getElementById('create-room-btn').addEventListener('click', () => {
    if (!window.LudoFirebase) { alert("Firebase module not loaded."); return; }
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    roomInputCode.value = code;
    displayRoomCode.textContent = code;
    connectToRoom(code);
  });

  document.getElementById('join-room-btn').addEventListener('click', () => {
    if (!window.LudoFirebase) { alert("Firebase module not loaded."); return; }
    const code = roomInputCode.value.trim().toUpperCase();
    if (code.length === 6) {
      displayRoomCode.textContent = code;
      connectToRoom(code);
    } else {
      alert("Please enter a valid 6-digit room code.");
    }
  });
}

function connectToRoom(code) {
  const { db, ref, onValue, set } = window.LudoFirebase;
  activeRoomRef = ref(db, `ludo_rooms/${code}`);

  onValue(activeRoomRef, (snapshot) => {
    const data = snapshot.val();
    if (data && !state.isAnimating) {
      isRemoteSync = true;
      state = data;
      renderState();
      isRemoteSync = false;
    }
  });

  set(activeRoomRef, state);
  statusMsg.textContent = `Connected to Room: ${code}`;
}

function syncState() {
  saveState();
  // Conditional Storage: Save score check & sync to Firebase if online room is active
  if (typeof window.submitScore === 'function') {
    let totalProgress = Object.values(state.tokens).flat().reduce((a, b) => a + Math.max(0, b), 0);
    window.submitScore(totalProgress);
  }

  if (state.mode === 'online' && activeRoomRef && !isRemoteSync) {
    const { set } = window.LudoFirebase;
    set(activeRoomRef, state);
  }
}

function buildBoardGrid() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.r = r;
      cell.dataset.c = c;

      if (r < 6 && c < 6) cell.classList.add('yard-red');
      else if (r < 6 && c > 8) cell.classList.add('yard-green');
      else if (r > 8 && c > 8) cell.classList.add('yard-yellow');
      else if (r > 8 && c < 6) cell.classList.add('yard-blue');
      else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) cell.classList.add('bg-center');
      else if (r === 7 && c >= 1 && c <= 5) cell.classList.add('path-red');
      else if (c === 7 && r >= 1 && r <= 5) cell.classList.add('path-green');
      else if (r === 7 && c >= 9 && c <= 13) cell.classList.add('path-yellow');
      else if (c === 7 && r >= 9 && r <= 13) cell.classList.add('path-blue');

      SAFE_INDICES.forEach(idx => {
        const [sr, sc] = MAIN_TRACK[idx];
        if (sr === r && sc === c) cell.classList.add('safe-star');
      });

      if (r === 6 && c === 1) cell.classList.add('path-red');
      if (r === 1 && c === 8) cell.classList.add('path-green');
      if (r === 8 && c === 13) cell.classList.add('path-yellow');
      if (r === 13 && c === 6) cell.classList.add('path-blue');

      boardEl.appendChild(cell);
    }
  }
  drawWhiteYardBoxes();
}

function drawWhiteYardBoxes() {
  const yards = [
    { rStart: 1, cStart: 1 },
    { rStart: 1, cStart: 10 },
    { rStart: 10, cStart: 10 },
    { rStart: 10, cStart: 1 }
  ];
  yards.forEach(y => {
    for (let r = y.rStart; r <= y.rStart + 3; r++) {
      for (let c = y.cStart; c <= y.cStart + 3; c++) {
        const cell = boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
        if (cell) cell.style.background = '#ffffff';
      }
    }
  });
}

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
      statusMsg.textContent = `Rolled ${roll}! Select a token.`;
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
  diceCube.style.transform = `translateZ(-37.5px) rotateX(720deg) rotateY(720deg) ${rotations[roll]}`;
}

async function moveToken(color, tokenIdx) {
  if (state.isAnimating) return;
  const roll = state.diceValue;
  if (!canTokenMove(color, tokenIdx, roll)) return;

  state.waitingForMove = false;
  state.isAnimating = true;
  let currentStep = state.tokens[color][tokenIdx];

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
      await new Promise(r => setTimeout(r, 150));
    }
  }

  state.isAnimating = false;
  const newStep = state.tokens[color][tokenIdx];
  let captured = false;

  if (newStep >= 0 && newStep <= 50) {
    const globalIdx = (START_INDEX[color] + newStep) % 52;
    if (!SAFE_INDICES.includes(globalIdx)) {
      PLAYERS.forEach(opp => {
        if (opp === color) return;
        state.tokens[opp].forEach((oppStep, oppIdx) => {
          if (oppStep >= 0 && oppStep <= 50) {
            const oppGlobalIdx = (START_INDEX[opp] + oppStep) % 52;
            if (oppGlobalIdx === globalIdx) {
              state.tokens[opp][oppIdx] = -1;
              captured = true;
            }
          }
        });
      });
    }
  }

  if (captured) sfx.capture();

  syncState();
  renderState();

  if (state.tokens[color].every(s => s === 56)) {
    sfx.win();
    statusMsg.textContent = `🏆 ${color.toUpperCase()} WINS THE GAME!`;
    rollBtn.disabled = true;
    return;
  }

  if (roll === 6 || captured || newStep === 56) {
    statusMsg.textContent = `${color.toUpperCase()} gets another turn!`;
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
  state.diceValue = null;
  state.waitingForMove = false;
  syncState();
  renderState();

  const currentPlayer = getCurrentPlayer();
  if (state.mode === 'bot' && currentPlayer !== 'red') {
    rollBtn.disabled = true;
    setTimeout(handleRollDice, 750);
  } else {
    rollBtn.disabled = false;
  }
}

function runBotTurn(botColor, movableIndices) {
  const roll = state.diceValue;
  let bestToken = movableIndices[0];
  let bestScore = -1;

  movableIndices.forEach(idx => {
    const step = state.tokens[botColor][idx];
    let score = step;
    if (step === -1 && roll === 6) score = 80;
    else if (step + roll === 56) score = 100;
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
      let r, c;
      if (step === -1) {
        [r, c] = BASE_POSITIONS[color][idx];
      } else {
        [r, c] = getCoordinates(color, step);
      }

      const cell = document.querySelector(`.cell[data-r="${Math.floor(r)}"][data-c="${Math.floor(c)}"]`);
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

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      state = { ...state, ...JSON.parse(saved), isAnimating: false };
    } catch (e) {
      console.error(e);
    }
  }
}

function startNewGame() {
  state = {
    mode: modeSelect.value,
    turnIndex: 0,
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
  rollBtn.disabled = false;
  statusMsg.textContent = 'New game started! Roll the dice.';
  syncState();
  renderState();
}

init();
