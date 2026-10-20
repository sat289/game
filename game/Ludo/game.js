class SoundFX {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.muted = false;
  }
  playTone(freq, type = 'sine', duration = 0.08, delay = 0) {
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
  diceRoll() { [200, 320, 260, 410].forEach((f, i) => this.playTone(f, 'triangle', 0.04, i * 40)); }
  tickStep() { this.playTone(850, 'square', 0.04); } // "Tick Tick" step sound
  capture() { [520, 390, 250].forEach((f, i) => this.playTone(f, 'sawtooth', 0.12, i * 80)); }
  winGame() { [523, 659, 783, 1046].forEach((f, i) => this.playTone(f, 'triangle', 0.2, i * 110)); }
}
const sfx = new SoundFX();

// Dynamic Player Mode Configuration mapping
const MODE_MAP = {
  '1v1': ['red', 'yellow'],
  '2v2': ['red', 'green', 'yellow', 'blue'], // Team: Red+Yellow vs Green+Blue
  '1v3': ['red', 'green', 'yellow', 'blue'], // Solo Red vs 3 Bots
  '4player': ['red', 'green', 'yellow', 'blue']
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

const BASE_POSITIONS = {
  red:    [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  green:  [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],
  yellow: [[10.5, 10.5], [10.5, 12.5], [13.5, 10.5], [13.5, 12.5]],
  blue:   [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]]
};

const STORAGE_KEY = 'PRO_LUDO_CUSTOM_MODE_V1';

let state = {
  playerMode: '1v1',
  mode: 'bot',
  turnIndex: 0,
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

const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
const boardEl = document.getElementById('ludo-board');
const rollBtn = document.getElementById('roll-dice-btn');
const diceCube = document.getElementById('dice-cube');
const turnBadge = document.getElementById('turn-indicator');
const scoreTracker = document.getElementById('score-tracker');
const selectPlayerMode = document.getElementById('select-player-mode');
const gameModeSelect = document.getElementById('game-mode-select');
const onlineLobby = document.getElementById('online-lobby');
const roomInputCode = document.getElementById('room-input-code');
const roomCodeLabel = document.getElementById('room-code-label');

function init() {
  buildBoardGrid();
  loadState();

  const startBtn = document.getElementById('main-start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (selectPlayerMode) {
        state.playerMode = selectPlayerMode.value;
      }
      homeScreen.classList.add('hidden');
      gameScreen.classList.remove('hidden');
      startNewGame();
    });
  }

  const backHomeBtn = document.getElementById('back-home-btn');
  if (backHomeBtn) {
    backHomeBtn.addEventListener('click', () => {
      gameScreen.classList.add('hidden');
      homeScreen.classList.remove('hidden');
    });
  }

  if (rollBtn) {
    rollBtn.addEventListener('click', handleRollDice);
  }

  if (gameModeSelect) {
    gameModeSelect.addEventListener('change', (e) => {
      state.mode = e.target.value;
      if (onlineLobby) onlineLobby.classList.toggle('hidden', state.mode !== 'online');
      saveState();
    });
  }

  const createRoomBtn = document.getElementById('create-room-btn');
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
      if (!window.LudoFirebase) { alert("Firebase not loaded!"); return; }
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      if (roomInputCode) roomInputCode.value = code;
      if (roomCodeLabel) roomCodeLabel.textContent = `ROOM: ${code}`;
      connectToRoom(code);
    });
  }

  const joinRoomBtn = document.getElementById('join-room-btn');
  if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', () => {
      if (!window.LudoFirebase) { alert("Firebase not loaded!"); return; }
      const code = roomInputCode.value.trim().toUpperCase();
      if (code.length === 6) {
        if (roomCodeLabel) roomCodeLabel.textContent = `ROOM: ${code}`;
        connectToRoom(code);
      } else {
        alert("Please enter a valid 6-digit room code.");
      }
    });
  }

  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => triggerEmoji(btn.dataset.emoji));
  });

  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', (e) => {
      sfx.muted = !sfx.muted;
      e.target.textContent = sfx.muted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
    });
  }
}

function getActivePlayers() {
  return MODE_MAP[state.playerMode] || ['red', 'yellow'];
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
  alert(`Successfully connected to Room: ${code}`);
}

function syncState() {
  saveState();
  if (typeof window.submitScore === 'function') {
    window.submitScore(state.score);
  }
  if (state.mode === 'online' && activeRoomRef && !isRemoteSync) {
    const { set } = window.LudoFirebase;
    set(activeRoomRef, state);
  }
}

function triggerEmoji(emoji) {
  const floater = document.getElementById('emoji-floater');
  if (!floater) return;
  floater.textContent = emoji;
  floater.classList.remove('pop');
  void floater.offsetWidth;
  floater.classList.add('pop');
}

function buildBoardGrid() {
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
  drawWhiteYardBoxes();
}

function drawWhiteYardBoxes() {
  const yards = [
    { rStart: 1, cStart: 1 }, { rStart: 1, cStart: 10 },
    { rStart: 10, cStart: 10 }, { rStart: 10, cStart: 1 }
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
  const active = getActivePlayers();
  return active[state.turnIndex % active.length];
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
  sfx.diceRoll();
  animate3DDice(roll);

  setTimeout(() => {
    const player = getCurrentPlayer();
    const movable = getMovableTokens(player, roll);

    if (movable.length === 0) {
      setTimeout(nextTurn, 900);
    } else if (movable.length === 1 && (state.mode === 'bot' && player !== 'red')) {
      moveToken(player, movable[0]);
    } else {
      state.waitingForMove = true;
      renderState();
      if (state.mode === 'bot' && player !== 'red') {
        const isBotActive = state.playerMode === '1v3' ? player !== 'red' : player !== 'red';
        if(isBotActive) {
          setTimeout(() => runBotTurn(player, movable), 500);
        }
      }
    }
  }, 750);
}

function animate3DDice(roll) {
  const rotations = {
    1: 'rotateY(0deg)',
    2: 'rotateY(180deg)',
    3: 'rotateY(-90deg)',
    4: 'rotateY(90deg)',
    5: 'rotateX(-90deg)',
    6: 'rotateX(90deg)'
  };
  diceCube.style.transform = `translateZ(-38px) rotateX(720deg) rotateY(720deg) ${rotations[roll]}`;
  const frontFace = diceCube.querySelector('.cube__face--1');
  if (frontFace) frontFace.textContent = roll;
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
    await new Promise(r => setTimeout(r, 160));
  } else {
    for (let s = 1; s <= roll; s++) {
      state.tokens[color][tokenIdx]++;
      sfx.tickStep(); // "Tick Tick" step sound
      state.score += 1;
      renderState(color, tokenIdx);
      await new Promise(r => setTimeout(r, 140));
    }
  }

  state.isAnimating = false;
  const newStep = state.tokens[color][tokenIdx];
  let captured = false;

  if (newStep >= 0 && newStep <= 50) {
    const globalIdx = (START_INDEX[color] + newStep) % 52;
    if (!SAFE_INDICES.includes(globalIdx)) {
      const activePlayers = getActivePlayers();
      activePlayers.forEach(opp => {
        if (opp === color) return;
        // 2v2 team check: teammates cannot capture each other
        if (state.playerMode === '2v2') {
          if ((color === 'red' || color === 'yellow') && (opp === 'red' || opp === 'yellow')) return;
          if ((color === 'green' || color === 'blue') && (opp === 'green' || opp === 'blue')) return;
        }

        state.tokens[opp].forEach((oppStep, oppIdx) => {
          if (oppStep >= 0 && oppStep <= 50) {
            const oppGlobalIdx = (START_INDEX[opp] + oppStep) % 52;
            if (oppGlobalIdx === globalIdx) {
              state.tokens[opp][oppIdx] = -1;
              captured = true;
              state.score += 20;
            }
          }
        });
      });
    }
  }

  if (captured) {
    sfx.capture();
    const boardWrap = document.getElementById('board-container');
    if (boardWrap) {
      boardEl.classList.add('shake');
      setTimeout(() => boardEl.classList.remove('shake'), 400);
    }
  }

  syncState();
  renderState();

  const activePlayers = getActivePlayers();
  let hasWon = false;
  if (state.playerMode === '2v2') {
    const team1Done = state.tokens.red.every(s => s === 56) && state.tokens.yellow.every(s => s === 56);
    const team2Done = state.tokens.green.every(s => s === 56) && state.tokens.blue.every(s => s === 56);
    if (team1Done || team2Done) hasWon = true;
  } else {
    hasWon = state.tokens[color].every(s => s === 56);
  }

  if (hasWon) {
    sfx.winGame();
    if (typeof confetti === 'function') {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
    rollBtn.disabled = true;
    return;
  }

  if (roll === 6 || captured || newStep === 56) {
    rollBtn.disabled = false;
    const currentPlayer = getCurrentPlayer();
    if (state.mode === 'bot' && currentPlayer !== 'red') {
      setTimeout(handleRollDice, 800);
    }
  } else {
    nextTurn();
  }
}

function nextTurn() {
  const activePlayers = getActivePlayers();
  state.turnIndex = (state.turnIndex + 1) % activePlayers.length;
  state.diceValue = null;
  state.waitingForMove = false;
  syncState();
  renderState();

  const currentPlayer = getCurrentPlayer();
  if (state.mode === 'bot' && currentPlayer !== 'red') {
    rollBtn.disabled = true;
    setTimeout(handleRollDice, 700);
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
    if (step === -1 && roll === 6) score = 90;
    else if (step + roll === 56) score = 120;
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
  if (turnBadge) {
    turnBadge.textContent = `${currentPlayer.toUpperCase()}'S TURN`;
    turnBadge.className = `turn-badge ${currentPlayer}`;
  }
  if (scoreTracker) {
    scoreTracker.textContent = `Score: ${state.score}`;
  }

  const activePlayers = getActivePlayers();

  PLAYERS.forEach(color => {
    // If a color is not in the active mode (e.g. green/blue in 1v1), skip rendering its tokens
    if (!activePlayers.includes(color)) return;

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
      if (gameModeSelect) gameModeSelect.value = state.mode;
      if (selectPlayerMode) selectPlayerMode.value = state.playerMode;
      if (onlineLobby) onlineLobby.classList.toggle('hidden', state.mode !== 'online');
    } catch (e) {
      console.error(e);
    }
  }
}

function startNewGame() {
  state = {
    playerMode: selectPlayerMode ? selectPlayerMode.value : '1v1',
    mode: gameModeSelect ? gameModeSelect.value : 'bot',
    turnIndex: 0,
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
  rollBtn.disabled = false;
  syncState();
  renderState();
}

init();
