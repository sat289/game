// Safe Lazy-Initialized Web Audio Synthesizer (Never crashes on mobile load)
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'sine', duration = 0.08, delay = 0) {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
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
    } catch (e) {}
  }
  diceRoll() { [220, 340, 280, 440].forEach((f, i) => this.playTone(f, 'triangle', 0.05, i * 40)); }
  tickStep() { this.playTone(820, 'square', 0.045); } // Crisp "Tip Tip" step sound
  capture() { [540, 380, 220].forEach((f, i) => this.playTone(f, 'sawtooth', 0.12, i * 80)); }
  winGame() { [523, 659, 783, 1046].forEach((f, i) => this.playTone(f, 'triangle', 0.22, i * 110)); }
}

const sfx = new SoundFX();

const MODE_MAP = {
  '1v1': ['red', 'yellow'],
  '2v2': ['red', 'green', 'yellow', 'blue'],
  '1v3': ['red', 'green', 'yellow', 'blue'],
  '4player': ['red', 'green', 'yellow', 'blue'],
  'rush': ['red', 'green', 'yellow', 'blue']
};

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

// Exact integer grid cells inside the 4 white yards
const BASE_POSITIONS = {
  red:    [[2, 2], [2, 3], [3, 2], [3, 3]],
  green:  [[2, 11], [2, 12], [3, 11], [3, 12]],
  yellow: [[11, 11], [11, 12], [12, 11], [12, 12]],
  blue:   [[11, 2], [11, 3], [12, 2], [12, 3]]
};

const PROFILE_KEY = 'PRO_LUDO_PROFILE_V12';
let profile = { coins: 500, xp: 0 };
try {
  const savedProf = localStorage.getItem(PROFILE_KEY);
  if (savedProf) profile = JSON.parse(savedProf);
} catch (e) {}

let state = {
  playerMode: '4player',
  mode: 'bot',
  turnIndex: 0,
  sixStreak: 0,
  diceValue: null,
  waitingForMove: false,
  isAnimating: false,
  score: 0,
  tokens: {
    red:    [-1, -1, -1, -1],
    green:  [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue:   [-1, -1, -1, -1]
  }
};

let activeRoomRef = null;
let isRemoteSync = false;
let turnTimer = null;
let timeLeft = 15;

// ==========================================
// GLOBAL FUNCTIONS FOR DIRECT HTML ONCLICK
// ==========================================
window.startLudoGame = function() {
  sfx.initContext();
  sfx.tickStep();

  const selectPlayerMode = document.getElementById('select-player-mode');
  if (selectPlayerMode) {
    state.playerMode = selectPlayerMode.value;
  }

  document.getElementById('home-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');

  buildBoardGrid();
  startNewGame();
};

window.backToHome = function() {
  clearInterval(turnTimer);
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('home-screen').classList.remove('hidden');
};

window.changeConnectionMode = function(val) {
  state.mode = val;
  const lobby = document.getElementById('online-lobby');
  if (lobby) lobby.classList.toggle('hidden', val !== 'online');
};

window.changeBoardTheme = function(val) {
  document.body.dataset.theme = val;
};

window.toggleSound = function() {
  sfx.muted = !sfx.muted;
  const btn = document.getElementById('sound-toggle-btn');
  if (btn) btn.textContent = sfx.muted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
};

window.triggerEmoji = function(emoji) {
  const floater = document.getElementById('emoji-floater');
  if (!floater) return;
  floater.textContent = emoji;
  floater.classList.remove('pop');
  void floater.offsetWidth;
  floater.classList.add('pop');
};

window.claimDailyBonus = function() {
  profile.coins += 250;
  localStorage.setItem('LUDO_DAILY_DATE', new Date().toDateString());
  updateEconomyUI();
  document.getElementById('daily-bonus-modal').classList.add('hidden');
};

window.createOnlineRoom = function() {
  if (!window.LudoFirebase) { alert("Firebase connection not ready!"); return; }
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById('room-input-code').value = code;
  document.getElementById('room-code-label').textContent = `ROOM: ${code}`;
  connectToRoom(code);
};

window.joinOnlineRoom = function() {
  if (!window.LudoFirebase) { alert("Firebase connection not ready!"); return; }
  const code = document.getElementById('room-input-code').value.trim().toUpperCase();
  if (code.length === 6) {
    document.getElementById('room-code-label').textContent = `ROOM: ${code}`;
    connectToRoom(code);
  } else {
    alert("Please enter a valid 6-digit room code.");
  }
};

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
  setStatus(`Connected to Room ${code}!`);
}

function getActivePlayers() {
  return MODE_MAP[state.playerMode] || ['red', 'green', 'yellow', 'blue'];
}

function getCurrentPlayer() {
  const active = getActivePlayers();
  return active[state.turnIndex % active.length];
}

function setStatus(msg) {
  const el = document.getElementById('status-msg');
  if (el) el.textContent = msg;
}

function updateEconomyUI() {
  const cEl = document.getElementById('coin-count');
  const xEl = document.getElementById('xp-count');
  if (cEl) cEl.textContent = profile.coins;
  if (xEl) xEl.textContent = profile.xp;
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {}
}

function buildBoardGrid() {
  const boardEl = document.getElementById('ludo-board');
  if (!boardEl) return;
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
      else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) cell.classList.add('center-home');
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

  // White Inner Yard Boxes & Base Token Spots
  const yards = [
    { rStart: 1, cStart: 1 }, { rStart: 1, cStart: 10 },
    { rStart: 10, cStart: 10 }, { rStart: 10, cStart: 1 }
  ];
  yards.forEach(y => {
    for (let r = y.rStart; r <= y.rStart + 3; r++) {
      for (let c = y.cStart; c <= y.cStart + 3; c++) {
        const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        if (cell) cell.classList.add('yard-white');
      }
    }
  });

  Object.values(BASE_POSITIONS).flat().forEach(([r, c]) => {
    const cell = boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (cell) cell.classList.add('base-spot');
  });
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

window.handleRollDice = function() {
  const rollBtn = document.getElementById('roll-dice-btn');
  if (state.waitingForMove || state.isAnimating) return;
  if (rollBtn) rollBtn.disabled = true;

  const roll = Math.floor(Math.random() * 6) + 1;
  state.diceValue = roll;
  sfx.diceRoll();
  animate3DDice(roll);

  setTimeout(() => {
    const player = getCurrentPlayer();

    // 3 Consecutive Sixes Penalty
    if (roll === 6) {
      state.sixStreak++;
      if (state.sixStreak === 3) {
        state.sixStreak = 0;
        setStatus(`Rolled three 6s! Turn forfeited.`);
        setTimeout(nextTurn, 1000);
        return;
      }
    } else {
      state.sixStreak = 0;
    }

    const movable = getMovableTokens(player, roll);
    if (movable.length === 0) {
      setStatus(`Rolled ${roll}. No valid moves!`);
      setTimeout(nextTurn, 950);
    } else if (movable.length === 1) {
      // Auto move when only 1 token can move
      moveToken(player, movable[0]);
    } else {
      state.waitingForMove = true;
      setStatus(`Rolled ${roll}! Tap a glowing token to move.`);
      renderState();
      if (state.mode === 'bot' && player !== 'red') {
        setTimeout(() => runBotTurn(player, movable), 550);
      }
    }
  }, 700);
};

function animate3DDice(roll) {
  const diceCube = document.getElementById('dice-cube');
  if (!diceCube) return;
  const rotations = {
    1: 'rotateX(0deg) rotateY(0deg)',
    2: 'rotateX(0deg) rotateY(-180deg)',
    3: 'rotateX(0deg) rotateY(-90deg)',
    4: 'rotateX(0deg) rotateY(90deg)',
    5: 'rotateX(-90deg) rotateY(0deg)',
    6: 'rotateX(90deg) rotateY(0deg)'
  };
  const spin = (Math.floor(Math.random() * 2) + 2) * 360;
  diceCube.style.transform = `translateZ(-36px) rotateX(${spin}deg) rotateY(${spin}deg) ${rotations[roll]}`;
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
    sfx.tickStep();
    state.score += 5;
    renderState(color, tokenIdx);
    await new Promise(r => setTimeout(r, 170));
  } else {
    for (let s = 1; s <= roll; s++) {
      state.tokens[color][tokenIdx]++;
      sfx.tickStep();
      state.score += 1;
      renderState(color, tokenIdx);
      await new Promise(r => setTimeout(r, 145));
    }
  }

  state.isAnimating = false;
  const newStep = state.tokens[color][tokenIdx];
  let captured = false;

  // Capture Check (Respects Safe Stars & 2v2
