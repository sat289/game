import { GameAudioFX } from "./audio-fx.js?v=34";

/**
 * 🕹️ SHERU BHAI ARCADE — 3 ULTRA-SMOOTH 60FPS LOW-RAM HTML5 CANVAS GAMES (v33)
 * Uses zero images & <15MB RAM so it runs locked 60fps on 2GB-4GB Android phones!
 * 1. Sheru Highway Rush (Neon 3-lane highway dodge + nitro)
 * 2. ISRO Rocket Tap (Precision thrust booster avoiding meteors)
 * 3. Sheru Super Over Cricket (6-ball power timing SIXER smasher!)
 */

const canvas = document.getElementById("arc-canvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const scoreEl = document.getElementById("arc-score");
const infoEl = document.getElementById("arc-info");
const bestEl = document.getElementById("arc-best");
const audio = new GameAudioFX();

let activeGame = "highway";
let state = null;
let particles = [];

function getBest(key) {
  try { return Number(localStorage.getItem(`st_arc_${key}`) || 0); } catch { return 0; }
}
function saveBest(key, val) {
  if (val > getBest(key)) {
    try { localStorage.setItem(`st_arc_${key}`, String(val)); } catch {}
  }
}

function burst(x, y, color, count = 14) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 140;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.65, color });
  }
}

function initGame(name) {
  activeGame = name;
  particles = [];
  if (name === "highway") {
    state = {
      running: true,
      over: false,
      lane: 1,
      x: W / 2,
      speed: 250,
      score: 0,
      roadOffset: 0,
      enemies: [],
      spawnT: 0
    };
    infoEl.textContent = "◀ / ▶ to Dodge!";
  } else if (name === "rocket") {
    state = {
      running: true,
      over: false,
      x: 92,
      y: H * 0.5,
      vy: 0,
      score: 0,
      pipes: [],
      spawnT: 0
    };
    infoEl.textContent = "Tap ⚡ HIT / Canvas to Thrust!";
  } else {
    state = {
      running: true,
      over: false,
      ballsLeft: 6,
      runs: 0,
      meter: 0,
      meterDir: 1,
      banner: "TIME THE GREEN ZONE!",
      bannerT: 1.5,
      ballAnim: 0
    };
    infoEl.textContent = "Tap ⚡ HIT in Gold/Green!";
  }
  bestEl.textContent = `Best: ${getBest(activeGame)}`;
}

function triggerLeft() {
  if (!state) return;
  if (state.over) { initGame(activeGame); return; }
  if (activeGame === "highway") {
    state.lane = Math.max(0, state.lane - 1);
    audio.playStep();
  } else if (activeGame === "rocket") {
    state.vy = -255;
    audio.playNitro();
  }
}

function triggerRight() {
  if (!state) return;
  if (state.over) { initGame(activeGame); return; }
  if (activeGame === "highway") {
    state.lane = Math.min(2, state.lane + 1);
    audio.playStep();
  } else if (activeGame === "rocket") {
    state.vy = -255;
    audio.playNitro();
  }
}

function triggerAction() {
  if (!state || state.over) {
    initGame(activeGame);
    return;
  }
  if (activeGame === "highway") {
    state.speed = Math.min(480, state.speed + 55);
    burst(state.x, H - 56, "#22d3ee", 8);
    audio.playNitro();
  } else if (activeGame === "rocket") {
    state.vy = -265;
    burst(state.x - 10, state.y + 16, "#f97316", 7);
    audio.playNitro();
  } else if (activeGame === "cricket") {
    if (state.ballsLeft <= 0) { initGame("cricket"); return; }
    state.ballsLeft--;
    state.ballAnim = 0.6;
    const dist = Math.abs(state.meter - 0.5);
    let gained = 0;
    if (dist < 0.08) {
      gained = 6;
      state.banner = "🔥 MASSIVE SIXER! +6";
      burst(W / 2, H * 0.35, "#facc15", 24);
      audio.playDoorOpen();
    } else if (dist < 0.17) {
      gained = 4;
      state.banner = "⚡ CRACKING FOUR! +4";
      burst(W / 2, H * 0.35, "#22d3ee", 14);
      audio.playDoorOpen();
    } else if (dist < 0.28) {
      gained = 2;
      state.banner = "👍 QUICK TWO! +2";
      audio.playStep();
    } else {
      gained = 0;
      state.banner = "😅 DOT BALL! (0)";
      audio.playHorn();
    }
    state.runs += gained;
    state.bannerT = 1.1;
    if (state.ballsLeft === 0) {
      state.over = true;
      saveBest("cricket", state.runs);
      infoEl.textContent = `Over Done! Scored ${state.runs} Runs!`;
    }
  }
}

document.querySelectorAll(".arc-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".arc-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    initGame(btn.dataset.game);
  });
});

document.getElementById("arc-left").addEventListener("pointerdown", (e) => { e.preventDefault(); triggerLeft(); });
document.getElementById("arc-right").addEventListener("pointerdown", (e) => { e.preventDefault(); triggerRight(); });
document.getElementById("arc-action").addEventListener("pointerdown", (e) => { e.preventDefault(); triggerAction(); });
canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (activeGame === "highway") {
    const r = canvas.getBoundingClientRect();
    if (e.clientX - r.left < r.width / 2) triggerLeft();
    else triggerRight();
  } else {
    triggerAction();
  }
});

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") triggerLeft();
  if (e.code === "ArrowRight" || e.code === "KeyD") triggerRight();
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); triggerAction(); }
});

let lastT = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;

  ctx.clearRect(0, 0, W, H);

  if (activeGame === "highway") {
    const laneXs = [95, 190, 285];
    if (!state.over) {
      state.speed = Math.min(460, state.speed + dt * 10);
      state.roadOffset = (state.roadOffset + state.speed * dt) % 48;
      state.score += Math.floor(dt * state.speed * 0.12);
      state.x += (laneXs[state.lane] - state.x) * Math.min(1, dt * 15);
      state.spawnT -= dt;
      if (state.spawnT <= 0) {
        state.spawnT = Math.max(0.48, 1.05 - state.speed * 0.0011);
        const l = Math.floor(Math.random() * 3);
        const cols = ["#38bdf8", "#facc15", "#a855f7", "#10b981"];
        state.enemies.push({ lane: l, x: laneXs[l], y: -55, col: cols[Math.floor(Math.random() * cols.length)] });
      }
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const en = state.enemies[i];
        en.y += state.speed * 0.92 * dt;
        if (Math.abs(en.x - state.x) < 34 && Math.abs(en.y - (H - 80)) < 54) {
          state.over = true;
          saveBest("highway", state.score);
          burst(state.x, H - 80, "#ef4444", 24);
          audio.playHorn();
          infoEl.textContent = "CRASH! Tap ⚡ PLAY to Restart";
        }
        if (en.y > H + 70) state.enemies.splice(i, 1);
      }
    }

    // Draw Neon Cyber Highway
    ctx.fillStyle = "#090d1a";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(48, 0, W - 96, H);
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(46, 0, 4, H);
    ctx.fillRect(W - 50, 0, 4, H);

    ctx.fillStyle = "rgba(248,250,252,0.55)";
    for (let y = -48 + state.roadOffset; y < H; y += 48) {
      ctx.fillRect(142, y, 4, 24);
      ctx.fillRect(236, y, 4, 24);
    }

    // Traffic Cars
    for (const en of state.enemies) {
      ctx.fillStyle = en.col;
      ctx.fillRect(en.x - 19, en.y - 30, 38, 60);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(en.x - 14, en.y - 16, 28, 22);
    }

    // Player Neon Sports Car
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(state.x - 20, H - 110, 40, 64);
    ctx.fillStyle = "#fef08a";
    ctx.fillRect(state.x - 16, H - 114, 10, 6);
    ctx.fillRect(state.x + 6, H - 114, 10, 6);
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(state.x - 14, H - 94, 28, 22);

    scoreEl.textContent = `Score: ${state.score}`;
    bestEl.textContent = `Best: ${Math.max(getBest("highway"), state.score)}`;
  } else if (activeGame === "rocket") {
    if (!state.over) {
      state.vy += 640 * dt;
      state.y += state.vy * dt;
      state.spawnT -= dt;
      if (state.spawnT <= 0) {
        state.spawnT = 1.45;
        const gapY = 115 + Math.random() * (H - 230);
        state.pipes.push({ x: W + 35, gapY, gapH: 132, passed: false });
      }
      for (let i = state.pipes.length - 1; i >= 0; i--) {
        const p = state.pipes[i];
        p.x -= 165 * dt;
        if (!p.passed && p.x < state.x) {
          p.passed = true;
          state.score++;
          audio.playDoorOpen();
        }
        if (Math.abs(p.x - state.x) < 28 && (state.y < p.gapY - p.gapH / 2 + 12 || state.y > p.gapY + p.gapH / 2 - 12)) {
          state.over = true;
          saveBest("rocket", state.score);
          burst(state.x, state.y, "#f97316", 22);
          audio.playHorn();
          infoEl.textContent = "MISSION FAILED! Tap ⚡ PLAY";
        }
        if (p.x < -50) state.pipes.splice(i, 1);
      }
      if (state.y < 14 || state.y > H - 14) {
        state.over = true;
        saveBest("rocket", state.score);
        infoEl.textContent = "OFF COURSE! Tap ⚡ PLAY";
      }
    }

    // Space Background
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fef9c3";
    for (let s = 0; s < 24; s++) {
      ctx.fillRect((s * 53) % W, (s * 89) % H, 2, 2);
    }

    // Space Obstacles
    for (const p of state.pipes) {
      ctx.fillStyle = "#334155";
      ctx.fillRect(p.x - 20, 0, 40, p.gapY - p.gapH / 2);
      ctx.fillRect(p.x - 20, p.gapY + p.gapH / 2, 40, H);
      ctx.fillStyle = "#f97316";
      ctx.fillRect(p.x - 22, p.gapY - p.gapH / 2 - 8, 44, 8);
      ctx.fillRect(p.x - 22, p.gapY + p.gapH / 2, 44, 8);
    }

    // ISRO Rocket Sprite
    ctx.save();
    ctx.translate(state.x, state.y);
    ctx.rotate(Math.max(-0.5, Math.min(0.6, state.vy * 0.002)));
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(-16, -9, 32, 18);
    ctx.fillStyle = "#f97316";
    ctx.fillRect(-10, -9, 5, 18);
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(-2, -9, 5, 18);
    ctx.beginPath();
    ctx.moveTo(16, -9);
    ctx.lineTo(28, 0);
    ctx.lineTo(16, 9);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.restore();

    scoreEl.textContent = `Alt: ${state.score}`;
    bestEl.textContent = `Best: ${Math.max(getBest("rocket"), state.score)}`;
  } else {
    // Sheru Super Over Cricket
    if (!state.over) {
      state.meter += state.meterDir * dt * 1.45;
      if (state.meter >= 1) { state.meter = 1; state.meterDir = -1; }
      if (state.meter <= 0) { state.meter = 0; state.meterDir = 1; }
    }
    if (state.bannerT > 0) state.bannerT -= dt;
    if (state.ballAnim > 0) state.ballAnim -= dt;

    // Stadium Field
    ctx.fillStyle = "#064e3b";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#15803d";
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.48, 165, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d6b588";
    ctx.fillRect(W / 2 - 22, H * 0.25, 44, 185);
    // Stumps
    ctx.fillStyle = "#facc15";
    ctx.fillRect(W / 2 - 12, H * 0.24, 24, 6);
    ctx.fillRect(W / 2 - 12, H * 0.63, 24, 6);

    // Ball flying when hit!
    const by = state.ballAnim > 0 ? H * 0.6 - (0.6 - state.ballAnim) * 420 : H * 0.56;
    ctx.beginPath();
    ctx.arc(W / 2, by, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#dc2626";
    ctx.fill();

    // Power Timing Bar
    const barX = 34, barY = H - 78, barW = W - 68, barH = 28;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(barX + barW * 0.33, barY, barW * 0.34, barH);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(barX + barW * 0.42, barY, barW * 0.16, barH);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(barX + state.meter * barW - 4, barY - 6, 8, barH + 12);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`BALLS LEFT: ${state.ballsLeft}`, W / 2, 46);
    if (state.bannerT > 0 || state.over) {
      ctx.fillStyle = "#fde047";
      ctx.font = "900 24px sans-serif";
      ctx.fillText(state.over ? `FINAL: ${state.runs} RUNS!` : state.banner, W / 2, 92);
    }

    scoreEl.textContent = `Runs: ${state.runs}`;
    bestEl.textContent = `Best: ${Math.max(getBest("cricket"), state.runs)}`;
  }

  // Render Shared Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.life -= dt;
    if (pt.life <= 0) { particles.splice(i, 1); continue; }
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    ctx.globalAlpha = Math.max(0, pt.life / 0.65);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
}

initGame("highway");
requestAnimationFrame(loop);
