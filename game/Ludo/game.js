// Web Audio API Sound Synthesizer ("Tick Tick" sound for smooth hopping)
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
  tickStep() { this.playTone(850, 'square', 0.04); } // "Tick Tick" hop sound
  capture() { [520, 390, 250].forEach((f, i) => this.playTone(f, 'sawtooth', 0.12, i * 80)); }
  winGame() { [523, 659, 783, 1046].forEach((f, i) => this.playTone(f, 'triangle', 0.2, i * 110)); }
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

const STORAGE_KEY = 'PRO_LUDO_ULTIMATE_STATE_V6';
const PROFILE_KEY = 'PRO_LUDO_PROFILE_V6';

let profile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || { coins: 500, xp: 0 };

let state = {
  mode: 'bot',
  matchType: 'classic', // 'classic', 'rush', 'teams'
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

const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
const boardEl = document.getElementById('ludo-board');
const rollBtn = document.getElementById('roll-dice-btn');
const diceCube = document.getElementById('dice-cube');
const turnBadge = document.getElementById('turn-indicator');
const scoreTracker = document.getElementById('score-tracker');
const gameModeSelect = document.getElementById('game-mode-select');
const matchTypeSelect = document.getElementById('match-type-select');
const onlineLobby = document.getElementById('online-lobby');
const roomInputCode = document.getElementById('room-input-code');
const roomCodeLabel = document.getElementById('room-code-label');
const timerSecEl = document.getElementById('timer-sec');
const timerBarEl = document.getElementById('timer-bar');
const coinEl = document.getElementById('coin-count');
const xpEl = document.getElementById('xp-count');

function init() {
  checkDailyBonus();
  buildBoardGrid();
  loadState();
  updateEconomyUI();

  const startBtn = document.getElementById('main-start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
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

  if (matchTypeSelect) {
    matchTypeSelect.addEventListener('change', (e) => {
      state.matchType = e.target.value;
      startNewGame();
    });
  }

  document.getElementById('theme-select').addEventListener('change', (e) => {
    document.body.dataset.theme = e.target.value;
  });

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

function checkDailyBonus() {
  const lastClaim = localStorage.getItem('LUDO_LAST_CLAIM');
  const today = new Date().toDateString();
  if (lastClaim !== today) {
    document.getElementById('daily-bonus-modal').classList.remove('hidden');
    document.getElementById('claim-bonus-btn').addEventListener('click', () => {
      profile.coins += 250;
      localStorage.setItem('LUDO_LAST_CLAIM', today);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      updateEconomyUI();
      document.getElementById('daily-bonus-modal').classList.add('hidden');
    });
  } else {
    document.getElementById('daily-bonus-modal').classList.add('hidden');
  }
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

function resetTurnTimer() {
  clearInterval(turnTimer);
  timeLeft = 15;
  if (timerSecEl) timerSecEl.textContent = timeLeft;
  if (timerBarEl) timerBarEl.style.width = '100%';

  turnTimer = setInterval(() => {
    if (state.isAnimating) return;
    timeLeft--;
    if (timerSecEl) timerSecEl.textContent = timeLeft;
    if (timerBarEl) timerBarEl.style.width = `${(timeLeft / 15) * 100}%`;

    if (timeLeft <= 0) {
      clearInterval(turnTimer);
      if (!state.waitingForMove) {
        handleRollDice();
      } else {
        const player = getCurrentPlayer();
        const movable = getMovableTokens(player, state.diceValue);
        if (movable.length > 0) runBotTurn(player, movable);
        else nextTurn();
      }
    }
  }, 1000);
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
  sfx.diceRoll();
  animate3DDice(roll);

  setTimeout(() => {
    const player = getCurrentPlayer();

    // Three 6s penalty rule
    if (roll === 6) {
      state.sixStreak++;
      if (state.sixStreak === 3) {
        state.sixStreak = 0;
        setTimeout(nextTurn, 900);
        return;
      }
    } else {
      state.sixStreak = 0;
    }

    const movable = getMovableTokens(player, roll);
    if (movable.length === 0) {
      setTimeout(nextTurn, 900);
    } else if (movable.length === 1 && (state.mode === 'bot' && player !== 'red')) {
      moveToken(player, movable[0]);
    } else {
      state.waitingForMove = true;
      renderState();
      if (state.mode === 'bot' && player !== 'red') {
        setTimeout(() => runBotTurn(player, movable), 500);
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
  diceCube.style.transform = `translateZ(-34px) rotateX(720deg) rotateY(720deg) ${rotations[roll]}`;
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

  // Capture & Wall Blockade check
  if (newStep >= 0 && newStep <= 50) {
    const globalIdx = (START_INDEX[color] + newStep) % 52;
    if (!SAFE_INDICES.includes(globalIdx)) {
      PLAYERS.forEach(opp => {
        if (opp === color) {
          if (state.matchType === 'teams' && ((color === 'red' && opp === 'yellow') || (color === 'green' && opp === 'blue'))) return;
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
    if(boardWrap) {
      boardEl.classList.add('shake');
      setTimeout(() => boardEl.classList.remove('shake'), 400);
    }
    profile.coins += 15;
    profile.xp += 30;
  }

  syncState();
  updateEconomyUI();
  renderState();

  const winLimit = state.matchType === 'rush' ? 2 : 4;
  const finishedCount = state.tokens[color].filter(s => s === 56).length;
  if (finishedCount >= winLimit) {
    sfx.winGame();
    clearInterval(turnTimer);
    profile.coins += 100;
    profile.xp += 100;
    updateEconomyUI();
    rollBtn.disabled = true;
    return;
  }

  if (roll === 6 || captured || newStep === 56) {
    resetTurnTimer();
    rollBtn.disabled = false;
    if (state.mode === 'bot' && color !== 'red') {
      setTimeout(handleRollDice, 800);
    }
  } else {
    nextTurn();
  }
}

function nextTurn() {
  state.turnIndex = (state.turnIndex + 1) % PLAYERS.length;
  state.diceValue = null;
  state.waitingForMove = false;
  syncState();
  renderState();
  resetTurnTimer();

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
  document.querySelectorAll('.wall-badge').forEach(w => w.remove());

  const currentPlayer = getCurrentPlayer();
  if (turnBadge) {
    turnBadge.textContent = `${currentPlayer.toUpperCase()}'S TURN`;
    turnBadge.className = `turn-badge ${currentPlayer}`;
  }
  if (scoreTracker) {
    scoreTracker.textContent = `Score: ${state.score}`;
  }

  // Track positions to detect Walls (2 tokens of same color on same cell)
  const cellTokenMap = {};

  PLAYERS.forEach(color => {
    state.tokens[color].forEach((step, idx) => {
      let r, c;
      if (step === -1) {
        [r, c] = BASE_POSITIONS[color][idx];
      } else {
        [r, c] = getCoordinates(color, step);
      }

      const cellKey = `${Math.floor(r)}_${Math.floor(c)}`;
      if (!cellTokenMap[cellKey]) cellTokenMap[cellKey] = [];
      cellTokenMap[cellKey].push({ color, idx, step });
    });
  });

  // Render tokens & check Wall blockades
  Object.keys(cellTokenMap).forEach(key => {
    const tokensOnCell = cellTokenMap[key];
    const [r, c] = key.split('_').map(Number);
    const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (!cell) return;

    // Check if 2 tokens of the same color share the cell (Wall Blockade)
    const colorGroups = {};
    tokensOnCell.forEach(t => {
      if (!colorGroups[t.color]) colorGroups[t.color] = 0;
      colorGroups[t.color]++;
    });

    tokensOnCell.forEach(t => {
      const token = document.createElement('div');
      token.classList.add('token', t.color);

      if (t.color === hoppingColor && t.idx === hoppingIdx) {
        token.classList.add('hopping');
      }

      if (state.waitingForMove && t.color === currentPlayer && canTokenMove(t.color, t.idx, state.diceValue)) {
        // If an opponent has a wall on target track cell, block movement
        if (t.step >= 0 && t.step <= 50) {
          const targetGlobal = (START_INDEX[t.color] + t.step + state.diceValue) % 52;
          let isBlocked = false;
          Object.keys(cellTokenMap).forEach(k => {
            cellTokenMap[k].forEach(other => {
              if (other.color !== t.color && other.step >= 0 && other.step <= 50) {
                const otherGlobal = (START_INDEX[other.color] + other.step) % 52;
                if (otherGlobal === targetGlobal && colorGroups[other.color] >= 2) {
                  isBlocked = true;
                }
              }
            });
          });
          if (!isBlocked) {
            token.classList.add('movable');
            token.addEventListener('click', () => moveToken(t.color, t.idx));
          }
        } else {
          token.classList.add('movable');
          token.addEventListener('click', () => moveToken(t.color, t.idx));
        }
      }

      cell.appendChild(token);
    });

    // Add visual Wall badge if 2+ tokens are stacked
    Object.keys(colorGroups).forEach(col => {
      if (colorGroups[col] >= 2) {
        const wallBadge = document.createElement('div');
        wallBadge.classList.add('wall-badge');
        wallBadge.textContent = 'WALL';
        cell.appendChild(wallBadge);
      }
    });
  });
}

function updateEconomyUI() {
  if (coinEl) coinEl.textContent = profile.coins;
  if (xpEl) xpEl.textContent = profile.xp;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
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
      if (matchTypeSelect) matchTypeSelect.value = state.matchType;
      if (onlineLobby) onlineLobby.classList.toggle('hidden', state.mode !== 'online');
    } catch (e) {
      console.error(e);
    }
  }
}

function startNewGame() {
  const isRush = state.matchType === 'rush';
  const initTokens = isRush ? [0, 0, -1, -1] : [-1, -1, -1, -1];

  state = {
    mode: gameModeSelect ? gameModeSelect.value : 'bot',
    matchType: matchTypeSelect ? matchTypeSelect.value : 'classic',
    turnIndex: 0,
    sixStreak: 0,
    diceValue: null,
    waitingForMove: false,
    isAnimating: false,
    score: 0,
    tokens: {
      red:    [...initTokens],
      green:  [...initTokens],
      yellow: [...initTokens],
      blue:   [...initTokens]
    }
  };
  rollBtn.disabled = false;
  syncState();
  renderState();
  resetTurnTimer();
}

init();
