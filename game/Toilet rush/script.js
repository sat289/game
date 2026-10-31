const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: true });

const urlParams = new URLSearchParams(window.location.search);
let currentLevel = parseInt(urlParams.get('level') || localStorage.getItem('toiletRushLevel') || '1', 10);
if (isNaN(currentLevel) || currentLevel < 1 || currentLevel > TOTAL_LEVELS) currentLevel = 1;

let timeLeft = 30;
let timerId = null;
let state = 'DRAW'; // DRAW, WALK, WIN, FAIL
let hintActive = false;

let doors = [];
let chars = [];
let walls = [];
let drawingChar = null;
let canvasRect = null;

function updateCanvasRect() {
  canvasRect = canvas.getBoundingClientRect();
}
window.addEventListener('resize', updateCanvasRect);

function initLevel(lvl) {
  currentLevel = lvl;
  localStorage.setItem('toiletRushLevel', lvl);
  clearInterval(timerId);
  timeLeft = 30;
  state = 'DRAW';
  hintActive = false;
  drawingChar = null;

  document.getElementById('lvl-val').innerText = lvl;
  document.getElementById('time-val').innerText = timeLeft + 's';
  document.getElementById('modal').style.display = 'none';

  const config = getLevelConfig(lvl);
  doors = config.doors;
  chars = config.chars;
  walls = config.walls;

  updateCanvasRect();

  timerId = setInterval(() => {
    if (state === 'DRAW' || state === 'WALK') {
      timeLeft--;
      document.getElementById('time-val').innerText = timeLeft + 's';
      if (timeLeft <= 0) finishLevel(false);
    }
  }, 1000);
}

function toggleHint() {
  hintActive = !hintActive;
}

function getCanvasCoords(e) {
  if (!canvasRect) updateCanvasRect();
  const touch = e.touches && e.touches[0] ? e.touches[0] : e;
  return {
    x: (touch.clientX - canvasRect.left) * (canvas.width / canvasRect.width),
    y: (touch.clientY - canvasRect.top) * (canvas.height / canvasRect.height)
  };
}

function onStart(e) {
  if (state !== 'DRAW') return;
  const p = getCanvasCoords(e);
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (!c.ready && Math.hypot(p.x - c.x, p.y - c.y) < 48) {
      drawingChar = c;
      c.path = [{ x: c.x, y: c.y }];
      break;
    }
  }
}

function onMove(e) {
  if (!drawingChar || state !== 'DRAW') return;
  e.preventDefault();
  const p = getCanvasCoords(e);
  const prev = drawingChar.path[drawingChar.path.length - 1];

  // Prevent drawing through walls
  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    if (p.x > w.x - 6 && p.x < w.x + w.w + 6 && p.y > w.y - 6 && p.y < w.y + w.h + 6) {
      return;
    }
  }

  // Distance filter to avoid lag from too many points
  if (Math.hypot(p.x - prev.x, p.y - prev.y) > 8) {
    drawingChar.path.push({ x: p.x, y: p.y });
  }
}

function onEnd() {
  if (!drawingChar) return;
  const last = drawingChar.path[drawingChar.path.length - 1];
  const door = doors.find(d => d.id === drawingChar.id);

  if (Math.hypot(last.x - door.x, last.y - door.y) < 60) {
    drawingChar.path.push({ x: door.x, y: door.y });
    drawingChar.ready = true;
  } else {
    drawingChar.path = [];
  }
  drawingChar = null;

  if (chars.every(c => c.ready)) {
    beginWalk();
  }
}

canvas.addEventListener('pointerdown', onStart, { passive: true });
canvas.addEventListener('pointermove', onMove, { passive: false });
window.addEventListener('pointerup', onEnd, { passive: true });

function buildSteps(path, speed = 3.2) {
  const pts = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(d / speed));
    for (let s = 0; s < n; s++) {
      pts.push({
        x: a.x + (b.x - a.x) * (s / n),
        y: a.y + (b.y - a.y) * (s / n)
      });
    }
  }
  pts.push(path[path.length - 1]);
  return pts;
}

function beginWalk() {
  state = 'WALK';
  chars.forEach(c => {
    c.steps = buildSteps(c.path, 3.2);
    c.idx = 0;
  });
}

function finishLevel(isWin) {
  if (state === 'WIN' || state === 'FAIL') return;
  state = isWin ? 'WIN' : 'FAIL';
  clearInterval(timerId);

  setTimeout(() => {
    const modal = document.getElementById('modal');
    const icon = document.getElementById('m-icon');
    const banner = document.getElementById('m-banner');
    const btn = document.getElementById('m-btn');

    modal.style.display = 'flex';
    if (isWin) {
      icon.innerText = '🏆';
      banner.innerText = 'YOU WIN';
      banner.className = 'banner win';
      btn.innerText = '» NEXT';
    } else {
      icon.innerText = '🥈';
      banner.innerText = 'FAILED';
      banner.className = 'banner fail';
      btn.innerText = '↻ Replay';
    }
  }, 500);
}

function handleModalBtn() {
  if (state === 'WIN') {
    const next = currentLevel < TOTAL_LEVELS ? currentLevel + 1 : 1;
    initLevel(next);
  } else {
    initLevel(currentLevel);
  }
}

function renderDoor(d, charInside) {
  ctx.fillStyle = '#bde5ff';
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 3.5;
  ctx.fillRect(d.x - d.w/2, d.y - d.h/2, d.w, d.h);
  ctx.strokeRect(d.x - d.w/2, d.y - d.h/2, d.w, d.h);

  ctx.fillStyle = '#666';
  ctx.beginPath();
  ctx.arc(d.x - d.w/2 + 10, d.y + 5, 3.5, 0, Math.PI * 2);
  ctx.fill();

  if (!charInside) {
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(d.x, d.y - 24, 6.5, 0, Math.PI * 2);
    ctx.fill();

    if (d.id === 'girl') {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - 16);
      ctx.lineTo(d.x - 10, d.y + 4);
      ctx.lineTo(d.x + 10, d.y + 4);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(d.x - 6.5, d.y - 15, 13, 17);
    }
    ctx.fillRect(d.x - 4.5, d.y + 2, 3.5, 13);
    ctx.fillRect(d.x + 1, d.y + 2, 3.5, 13);
  }
}

// Fast Vector Face Bubble (Zero Emoji Lag on Mobile)
function drawStatusBubble(isHappy) {
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(-22, -28, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffcc33';
  ctx.beginPath();
  ctx.arc(-22, -28, 7.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  if (isHappy) {
    ctx.arc(-22, -27, 4, 0, Math.PI);
  } else {
    ctx.arc(-22, -24, 3.5, Math.PI, 0);
  }
  ctx.stroke();
}

function renderChar(c) {
  ctx.save();
  ctx.translate(c.x, c.y);

  if (state === 'FAIL') {
    ctx.fillStyle = '#3ce8ff';
    ctx.beginPath();
    ctx.ellipse(0, 26, 28, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#ffe1c4';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -14, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (c.id === 'boy') {
    ctx.fillStyle = '#5c3824';
    ctx.beginPath();
    ctx.arc(0, -17, 13, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#1e5be0';
    ctx.fillRect(-15, -23, 22, 6);

    ctx.fillStyle = '#ffde33';
    ctx.fillRect(-9, -1, 18, 12);
    ctx.fillStyle = '#1e5be0';
    ctx.fillRect(-9, 8, 18, 12);
    ctx.strokeRect(-9, -1, 18, 21);
  } else {
    ctx.fillStyle = '#ffdf38';
    ctx.beginPath();
    ctx.arc(0, -15, 14.5, Math.PI * 0.8, Math.PI * 0.2);
    ctx.fill();

    ctx.fillStyle = '#e01b24';
    ctx.beginPath();
    ctx.moveTo(-7, -1);
    ctx.lineTo(7, -1);
    ctx.lineTo(12, 20);
    ctx.lineTo(-12, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-4, -13, 1.8, 0, Math.PI * 2);
  ctx.arc(4, -13, 1.8, 0, Math.PI * 2);
  ctx.fill();

  if (state === 'DRAW' || c.done) {
    drawStatusBubble(c.done);
  }

  ctx.restore();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (hintActive && state === 'DRAW') {
    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 4.5;

    const girl = chars.find(c => c.id === 'girl');
    const gDoor = doors.find(d => d.id === 'girl');
    ctx.strokeStyle = 'rgba(214, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.moveTo(girl.sx, girl.sy);
    ctx.lineTo(gDoor.x, gDoor.y);
    ctx.stroke();

    const boy = chars.find(c => c.id === 'boy');
    const bDoor = doors.find(d => d.id === 'boy');
    ctx.strokeStyle = 'rgba(0, 50, 214, 0.45)';
    ctx.beginPath();
    ctx.moveTo(boy.sx, boy.sy);
    ctx.bezierCurveTo(boy.sx + 95, boy.sy + 85, boy.sx - 65, boy.sy + 95, boy.sx + 40, boy.sy);
    ctx.lineTo(bDoor.x, bDoor.y);
    ctx.stroke();
    ctx.restore();
  }

  for (let i = 0; i < doors.length; i++) {
    const d = doors[i];
    const c = chars.find(ch => ch.id === d.id);
    renderDoor(d, c && c.done);
  }

  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    if (w.vx) {
      w.x += w.vx;
      if (w.x < w.minX || w.x > w.maxX) w.vx *= -1;
    }
    if (w.monster) {
      ctx.fillStyle = '#eeeeee';
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 3.5;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = '#d60000';
      ctx.fillRect(w.x + 12, w.y + 25, 20, 14);
      ctx.fillRect(w.x + w.w - 32, w.y + 25, 20, 14);
    } else {
      ctx.fillStyle = '#444';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2.5;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    }
  }

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c.path.length > 1) {
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(c.path[0].x, c.path[0].y);
      for (let j = 1; j < c.path.length; j++) {
        ctx.lineTo(c.path[j].x, c.path[j].y);
      }
      ctx.stroke();
    }
  }

  if (state === 'WALK') {
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (c.idx < c.steps.length - 1) {
        c.idx++;
        c.x = c.steps[c.idx].x;
        c.y = c.steps[c.idx].y;
      } else {
        c.done = true;
      }

      for (let j = 0; j < walls.length; j++) {
        const w = walls[j];
        if (c.x > w.x - 12 && c.x < w.x + w.w + 12 && c.y > w.y - 12 && c.y < w.y + w.h + 12) {
          finishLevel(false);
        }
      }
    }

    const c1 = chars[0], c2 = chars[1];
    if (Math.hypot(c1.x - c2.x, c1.y - c2.y) < 30) {
      finishLevel(false);
    }

    if (chars.every(c => c.done)) {
      finishLevel(true);
    }
  }

  for (let i = 0; i < chars.length; i++) {
    renderChar(chars[i]);
  }

  requestAnimationFrame(gameLoop);
}

initLevel(currentLevel);
requestAnimationFrame(gameLoop);
