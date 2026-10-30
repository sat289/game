 const FRUITS = [
  { tier: 0, name: "Grape",      radius: 15, score: 2,   color1: "#a855f7", color2: "#6b21a8", rim: "#581c87", face: "cute",    crown: "dot" },
  { tier: 1, name: "Cherry",     radius: 21, score: 4,   color1: "#fb7185", color2: "#e11d48", rim: "#9f1239", face: "happy",   crown: "stem" },
  { tier: 2, name: "Blueberry",  radius: 28, score: 8,   color1: "#60a5fa", color2: "#2563eb", rim: "#1e40af", face: "open",    crown: "star" },
  { tier: 3, name: "Strawberry", radius: 35, score: 16,  color1: "#f43f5e", color2: "#be123c", rim: "#881337", face: "blush",   crown: "leaves", seeds: true },
  { tier: 4, name: "Green Apple",radius: 43, score: 32,  color1: "#a3e635", color2: "#65a30d", rim: "#3f6212", face: "wink",    crown: "AppleLeaf" },
  { tier: 5, name: "Lemon Peach",radius: 52, score: 64,  color1: "#fde047", color2: "#eab308", rim: "#a16207", face: "pout",    crown: "AppleLeaf" },
  { tier: 6, name: "Tangerine",  radius: 61, score: 128, color1: "#fb923c", color2: "#ea580c", rim: "#9a3412", face: "smile",   crown: "AppleLeaf" },
  { tier: 7, name: "Red Apple",  radius: 71, score: 256, color1: "#ef4444", color2: "#b91c1c", rim: "#7f1d1d", face: "squint",  crown: "AppleLeaf" },
  { tier: 8, name: "Pineapple",  radius: 82, score: 512, color1: "#facc15", color2: "#ca8a04", rim: "#854d0e", face: "excited", crown: "tuft",     grid: true },
  { tier: 9, name: "Honey Melon",radius: 94, score: 1024,color1: "#bef264", color2: "#84cc16", rim: "#4d7c0f", face: "happy",   crown: "stem",     melon: true },
  { tier: 10,name: "Watermelon", radius: 108,score: 2048,color1: "#22c55e", color2: "#15803d", rim: "#14532d", face: "king",    crown: "none",     stripes: true }
];

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const JAR = { left: 22, right: 338, top: 72, bottom: 448, dangerY: 108 };

let balls = [], particles = [], popups = [], shockwaves = [];
let score = 0, bestScore = 0, currentTier = 0, nextTier = 1;
let aimX = 180, canDrop = true, isPointerDown = false, isGameOver = false, hammerMode = false, dangerTimer = 0;
let boosters = { hammer: 2, shake: 2, swap: 3 };
let soundMuted = localStorage.getItem("st_fruit_mute") === "true";
let audioCtx = null;

function getAudio() {
  if (soundMuted) return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playDropSound() {
  const c = getAudio();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const now = c.currentTime;
  osc.type = "sine";
  osc.frequency.setValueAtTime(320, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
  osc.connect(gain); gain.connect(c.destination);
  osc.start(now); osc.stop(now + 0.1);
}

function playMergeSound(tier) {
  const c = getAudio();
  if (!c) return;
  const now = c.currentTime;
  const base = 340 + tier * 55;
  [base, base * 1.25, base * 1.5].forEach((f, idx) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const start = now + idx * 0.035;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(f, start);
    gain.gain.setValueAtTime(0.16, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(start); osc.stop(start + 0.15);
  });
}

function toggleMute() {
  soundMuted = !soundMuted;
  localStorage.setItem("st_fruit_mute", String(soundMuted));
  document.getElementById("muteIcon").className = soundMuted ? "fa-solid fa-volume-xmark text-sm text-rose-500" : "fa-solid fa-volume-high text-sm text-amber-800";
}

function drawFruit(ctx, x, y, radius, tierIndex, angle = 0, isScared = false) {
  const f = FRUITS[tierIndex] || FRUITS[0];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, radius * 0.1, 0, 0, radius);
  grad.addColorStop(0, f.color1);
  grad.addColorStop(0.85, f.color2);
  grad.addColorStop(1, f.rim);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = Math.max(2, radius * 0.055);
  ctx.strokeStyle = f.rim;
  ctx.stroke();

  // Kawaii Face
  ctx.fillStyle = "#1e1b4b";
  const er = Math.max(2.2, radius * 0.115);
  [-radius * 0.3, radius * 0.3].forEach(ex => {
    ctx.beginPath();
    ctx.arc(ex, radius * 0.06, er, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function randomSpawnTier() {
  const w = [0, 0, 0, 1, 1, 1, 2, 2, 3, 4];
  return w[Math.floor(Math.random() * w.length)];
}

function updateBoosterUI() {
  document.getElementById("hammerCount").textContent = boosters.hammer;
  document.getElementById("shakeCount").textContent = boosters.shake;
  document.getElementById("swapCount").textContent = boosters.swap;
  document.getElementById("btnHammer").classList.toggle("active-mode", hammerMode);
  document.getElementById("hammerNotice").classList.toggle("hidden", !hammerMode);
}

function renderNextFruitPreview() {
  const nCanvas = document.getElementById("nextFruitCanvas");
  const nCtx = nCanvas.getContext("2d");
  nCtx.clearRect(0, 0, nCanvas.width, nCanvas.height);
  const f = FRUITS[nextTier];
  document.getElementById("nextFruitName").textContent = f.name;
  drawFruit(nCtx, 21, 22, Math.min(15, f.radius * 0.65), nextTier, 0, false);
}

function renderEvolutionChain() {
  const eCanvas = document.getElementById("evoChainCanvas");
  const eCtx = eCanvas.getContext("2d");
  eCtx.clearRect(0, 0, eCanvas.width, eCanvas.height);
  FRUITS.forEach((f, idx) => {
    drawFruit(eCtx, 10 + idx * 19, 14, 7.5, idx, 0, false);
  });
}

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height)
  };
}

function clampAim(x) {
  const r = FRUITS[currentTier].radius;
  return Math.max(JAR.left + r + 4, Math.min(JAR.right - r - 4, x));
}

canvas.addEventListener("pointerdown", e => {
  e.preventDefault();
  if (isGameOver) return;
  const pos = getCanvasCoords(e);

  if (hammerMode) {
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      if (Math.hypot(pos.x - b.x, pos.y - b.y) <= b.radius + 8) {
        playMergeSound(b.tier);
        balls.splice(i, 1);
        boosters.hammer--;
        hammerMode = false;
        updateBoosterUI();
        return;
      }
    }
    hammerMode = false;
    updateBoosterUI();
    return;
  }

  isPointerDown = true;
  aimX = clampAim(pos.x);
}, { passive: false });

canvas.addEventListener("pointermove", e => {
  e.preventDefault();
  if (!isPointerDown || isGameOver || hammerMode) return;
  aimX = clampAim(getCanvasCoords(e).x);
}, { passive: false });

window.addEventListener("pointerup", () => {
  if (!isPointerDown || isGameOver || hammerMode) return;
  isPointerDown = false;
  if (!canDrop) return;
  canDrop = false;
  playDropSound();

  const f = FRUITS[currentTier];
  balls.push({
    x: clampAim(aimX), y: JAR.top - 10,
    vx: 0, vy: 1.5, radius: f.radius, tier: currentTier, angle: 0, va: 0, age: 0, merged: false
  });

  currentTier = nextTier;
  nextTier = randomSpawnTier();
  renderNextFruitPreview();
  setTimeout(() => { canDrop = true; }, 420);
});

function updatePhysics() {
  if (isGameOver) return;
  const SUBSTEPS = 6;
  const gravity = 0.36 / SUBSTEPS;

  for (let s = 0; s < SUBSTEPS; s++) {
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      b.vy += gravity;
      b.x += b.vx; b.y += b.vy;
      if (b.x - b.radius < JAR.left) { b.x = JAR.left + b.radius; b.vx *= -0.35; }
      if (b.x + b.radius > JAR.right) { b.x = JAR.right - b.radius; b.vx *= -0.35; }
      if (b.y + b.radius > JAR.bottom) { b.y = JAR.bottom - b.radius; b.vy *= -0.22; }
    }

    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i], b = balls[j];
        if (a.merged || b.merged) continue;
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;
        if (dist < minDist && dist > 0.0001) {
          if (a.tier === b.tier && a.tier < FRUITS.length - 1) {
            a.merged = true; b.merged = true;
            const newTier = a.tier + 1;
            balls.push({
              x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5,
              vx: 0, vy: -1.5, radius: FRUITS[newTier].radius, tier: newTier, angle: 0, va: 0, age: 10, merged: false
            });
            score += FRUITS[newTier].score;
            document.getElementById("scoreVal").textContent = score;
            if (score > bestScore) { bestScore = score; document.getElementById("bestScoreVal").textContent = bestScore; }
            playMergeSound(newTier);
            window.FruitStorage.recordProgress({ score });
            continue;
          }
          const overlap = minDist - dist;
          const nx = dx / dist, ny = dy / dist;
          a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5;
          b.x += nx * overlap * 0.5; b.y += ny * overlap * 0.5;
        }
      }
    }
    balls = balls.filter(b => !b.merged);
  }
}

function renderScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(JAR.left, JAR.top, JAR.right - JAR.left, JAR.bottom - JAR.top);

  if (canDrop && !isGameOver && !hammerMode) {
    const cx = clampAim(aimX);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath(); ctx.moveTo(cx, JAR.top); ctx.lineTo(cx, JAR.bottom); ctx.stroke();
    drawFruit(ctx, cx, JAR.top - 12, FRUITS[currentTier].radius, currentTier);
  }

  balls.forEach(b => drawFruit(ctx, b.x, b.y, b.radius, b.tier, b.angle));

  ctx.strokeStyle = "#fff"; ctx.lineWidth = 4;
  ctx.strokeRect(JAR.left, JAR.top, JAR.right - JAR.left, JAR.bottom - JAR.top);
}

function gameLoop() {
  updatePhysics();
  renderScene();
  requestAnimationFrame(gameLoop);
}

function activateHammer() { if (boosters.hammer > 0) { hammerMode = !hammerMode; updateBoosterUI(); } }
function activateShake() { if (boosters.shake > 0) { boosters.shake--; updateBoosterUI(); balls.forEach(b => b.vy -= 5); } }
function activateSwap() { if (boosters.swap > 0) { boosters.swap--; const t = currentTier; currentTier = nextTier; nextTier = t; renderNextFruitPreview(); updateBoosterUI(); } }
function restartGame() { balls = []; score = 0; isGameOver = false; hammerMode = false; document.getElementById("scoreVal").textContent = "0"; document.getElementById("gameOverModal").classList.add("hidden"); }
function openLeaderboard() { document.getElementById("leaderboardModal").classList.remove("hidden"); }
function closeLeaderboard() { document.getElementById("leaderboardModal").classList.add("hidden"); }

window.addEventListener("DOMContentLoaded", async () => {
  renderEvolutionChain();
  const stats = await window.FruitStorage.init();
  bestScore = stats.highScore || 0;
  document.getElementById("bestScoreVal").textContent = bestScore;
  currentTier = randomSpawnTier();
  nextTier = randomSpawnTier();
  renderNextFruitPreview();
  updateBoosterUI();

  const loader = document.getElementById("loadingScreen");
  setTimeout(() => loader.classList.add("hidden"), 800);
  requestAnimationFrame(gameLoop);
});
