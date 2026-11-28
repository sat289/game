const AudioFX = {
  ctx: null,
  play(freq, type = 'square', dur = 0.08, vol = 0.06) {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, this.ctx.currentTime);
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch {}
  }
};

const Game = {
  save: {
    coins: 3099,
    gems: 200,
    selectedShip: 'cobra',
    shipLevels: { cobra: 1, seraphim: 1, azure: 1, crimson: 1, cryo: 1 },
    unlockedLevel: 0,
    stars: {},
    bestScores: {}
  },

  canvas: null,
  ctx: null,
  activeScreen: 'loading',
  running: false,
  paused: false,
  levelIndex: 0,
  waveIndex: 0,
  score: 0,
  startTime: 0,
  lastFire: 0,
  totalSpawned: 0,
  totalKilled: 0,
  shake: 0,

  player: { x: 200, y: 650, shipId: 'cobra', power: 1, bombs: 1, invuln: 0 },
  bullets: [],
  enemyBullets: [],
  enemies: [],
  powerups: [],
  particles: [],
  shockwaves: [],
  starsBg: [],

  async init() {
    await this.loadProgress();
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindControls();

    // 3-layer parallax starfield
    for (let i = 0; i < 95; i++) {
      const layer = i % 3;
      this.starsBg.push({
        x: Math.random() * 430,
        y: Math.random() * 900,
        s: layer === 2 ? 2.2 : layer === 1 ? 1.4 : 0.8,
        v: layer === 2 ? 2.4 : layer === 1 ? 1.2 : 0.45,
        a: layer === 2 ? 0.9 : layer === 1 ? 0.55 : 0.3
      });
    }

    // Loading bar animation
    let pct = 0;
    const bar = document.getElementById('loading-bar');
    const timer = setInterval(() => {
      pct += 14;
      bar.style.width = Math.min(pct, 100) + '%';
      if (pct >= 100) {
        clearInterval(timer);
        this.showScreen('home');
        requestAnimationFrame(t => this.uiLoop(t));
      }
    }, 90);
  },

  resize() {
    const app = document.getElementById('app');
    this.canvas.width = app.clientWidth;
    this.canvas.height = app.clientHeight;
    const bg = document.getElementById('home-bg-canvas');
    if (bg) {
      bg.width = app.clientWidth;
      bg.height = app.clientHeight;
    }
  },

  async loadProgress() {
    try {
      const res = await fetch('/api/save');
      if (res.ok) this.save = Object.assign(this.save, await res.json());
    } catch {
      const local = localStorage.getItem('space_shooter_save');
      if (local) this.save = Object.assign(this.save, JSON.parse(local));
    }
    this.updateTopBar();
  },

  async saveProgress() {
    localStorage.setItem('space_shooter_save', JSON.stringify(this.save));
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.save)
      });
    } catch {}
    this.updateTopBar();
  },

  updateTopBar() {
    document.getElementById('ui-coins').textContent = this.save.coins;
    document.getElementById('ui-gems').textContent = this.save.gems;
  },

  showScreen(name) {
    this.activeScreen = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${name}`).classList.add('active');
    const showTop = ['home', 'hangar', 'map'].includes(name);
    document.getElementById('top-bar').classList.toggle('hidden', !showTop);

    if (name === 'hangar') this.renderHangar();
    if (name === 'map') this.renderMap();
  },

  drawSpaceBg(ctx, W, H, t) {
    ctx.fillStyle = '#050714';
    ctx.fillRect(0, 0, W, H);

    // Soft glowing nebula clouds
    const n1 = ctx.createRadialGradient(W * 0.25, H * 0.3, 10, W * 0.25, H * 0.3, W * 0.65);
    n1.addColorStop(0, 'rgba(99, 102, 241, 0.20)');
    n1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = n1;
    ctx.fillRect(0, 0, W, H);

    const n2 = ctx.createRadialGradient(W * 0.8, H * 0.72, 10, W * 0.8, H * 0.72, W * 0.6);
    n2.addColorStop(0, 'rgba(14, 165, 233, 0.16)');
    n2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = n2;
    ctx.fillRect(0, 0, W, H);

    // 3-layer scrolling stars
    ctx.fillStyle = '#ffffff';
    this.starsBg.forEach(s => {
      s.y += s.v;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      ctx.globalAlpha = s.a;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    });
    ctx.globalAlpha = 1;
  },

  // Live animation loop for Home & Hangar ship previews
  uiLoop(t) {
    if (this.activeScreen === 'home') {
      const bg = document.getElementById('home-bg-canvas');
      if (bg) this.drawSpaceBg(bg.getContext('2d'), bg.width, bg.height, t);

      const c = document.getElementById('home-ship-canvas');
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      const hoverY = Math.sin(t * 0.003) * 6;
      SHIPS[this.save.selectedShip].draw(ctx, c.width / 2, c.height / 2 + hoverY, 2.25, t);
    } else if (this.activeScreen === 'hangar') {
      const c = document.getElementById('hangar-canvas');
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      const hoverY = Math.sin(t * 0.0035) * 4;
      SHIPS[this.save.selectedShip].draw(ctx, c.width / 2, c.height / 2 + hoverY, 2.0, t);
    }
    requestAnimationFrame(nextT => this.uiLoop(nextT));
  },

  renderHangar() {
    const ship = SHIPS[this.save.selectedShip];
    const lv = this.save.shipLevels[ship.id] || 1;
    document.getElementById('hangar-ship-name').textContent = ship.name;
    document.getElementById('hangar-ship-level').textContent = `LV. ${lv}`;
    document.getElementById('stat-atk').textContent = Math.round(ship.baseAtk + (lv - 1) * 5);
    document.getElementById('stat-rate').textContent = (1000 / ship.fireDelay).toFixed(1) + '/s';
    document.getElementById('stat-special').textContent = ship.special;
    document.getElementById('upgrade-cost').textContent = lv * 100;

    const grid = document.getElementById('hangar-grid');
    grid.innerHTML = '';
    Object.values(SHIPS).forEach(s => {
      const card = document.createElement('div');
      card.className = 'ship-card' + (s.id === this.save.selectedShip ? ' selected' : '');
      card.innerHTML = `<div class="ship-card-name">${s.name}</div><div class="ship-card-lv">LV.${this.save.shipLevels[s.id] || 1}</div>`;
      card.onclick = () => {
        this.save.selectedShip = s.id;
        this.saveProgress();
        this.renderHangar();
      };
      grid.appendChild(card);
    });
  },

  upgradeSelectedShip() {
    const id = this.save.selectedShip;
    const lv = this.save.shipLevels[id] || 1;
    const cost = lv * 100;
    if (this.save.coins >= cost) {
      this.save.coins -= cost;
      this.save.shipLevels[id] = lv + 1;
      AudioFX.play(660, 'triangle', 0.15, 0.1);
      this.saveProgress();
      this.renderHangar();
    }
  },

  claimDailyBonus() {
    this.save.coins += 250;
    AudioFX.play(880, 'sine', 0.2, 0.1);
    this.saveProgress();
    alert('🎁 Claimed +250 Coins!');
  },

  renderMap() {
    const container = document.getElementById('map-nodes');
    container.innerHTML = '';
    let totalStars = 0;
    LEVELS.forEach((lvl, idx) => {
      const unlocked = idx <= this.save.unlockedLevel;
      const st = this.save.stars[lvl.id] || 0;
      totalStars += st;
      const node = document.createElement('div');
      node.className = `level-node ${unlocked ? '' : 'locked'} ${lvl.isBoss ? 'boss' : ''}`;
      node.innerHTML = `
        <div class="level-node-id">${unlocked ? lvl.id : '🔒'}</div>
        <div class="level-node-stars">${'⭐'.repeat(st)}${'☆'.repeat(3 - st)}</div>
      `;
      if (unlocked) node.onclick = () => this.startLevel(idx);
      container.appendChild(node);
    });
    document.getElementById('map-unlocked').textContent = Math.min(this.save.unlockedLevel + 1, LEVELS.length);
    document.getElementById('map-stars').textContent = totalStars;
  },

  spawnExplosion(x, y, color = '#fb923c', count = 18, big = false) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (Math.random() * (big ? 6.5 : 3.8)) + 0.8;
      this.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        decay: 0.025 + Math.random() * 0.03,
        size: (Math.random() * (big ? 5 : 3)) + 1.5,
        color
      });
    }
    this.shockwaves.push({ x, y, r: 4, maxR: big ? 95 : 38, life: 1, color });
  },

  startLevel(idx) {
    this.levelIndex = idx;
    this.waveIndex = 0;
    this.score = 0;
    this.totalSpawned = 0;
    this.totalKilled = 0;
    this.shake = 0;
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.shockwaves = [];

    this.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 100,
      shipId: this.save.selectedShip,
      power: 1,
      bombs: 1,
      invuln: 120
    };

    document.getElementById('pause-modal').classList.add('hidden');
    document.getElementById('result-modal').classList.add('hidden');
    this.showScreen('game');
    this.running = true;
    this.paused = false;
    this.startTime = performance.now();
    this.updateHUD();
    this.spawnWave();
    requestAnimationFrame(t => this.loop(t));
  },

  spawnWave() {
    const lvl = LEVELS[this.levelIndex];
    if (this.waveIndex >= lvl.waves.length) {
      this.endLevel(true);
      return;
    }

    const wave = lvl.waves[this.waveIndex];
    const banner = document.getElementById('wave-banner');
    banner.textContent = wave.type === 'boss' ? 'WARNING: BOSS!' : `WAVE ${this.waveIndex + 1}/${lvl.waves.length}`;
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 1500);

    const W = this.canvas.width;
    const def = ENEMIES[wave.type];

    for (let i = 0; i < wave.count; i++) {
      let tx = W / 2, ty = 120;
      if (wave.formation === 'grid') {
        const cols = 5;
        const col = i % cols;
        const row = Math.floor(i / cols);
        tx = (W / (cols + 1)) * (col + 1);
        ty = 95 + row * 56;
      } else if (wave.formation === 'v_shape') {
        const mid = Math.floor(wave.count / 2);
        const offset = i - mid;
        tx = W / 2 + offset * 34;
        ty = 180 - Math.abs(offset) * 24;
      } else if (wave.formation === 'circle') {
        const ang = (i / wave.count) * Math.PI * 2;
        tx = W / 2 + Math.cos(ang) * 115;
        ty = 190 + Math.sin(ang) * 75;
      } else if (wave.formation === 'boss') {
        tx = W / 2;
        ty = 150;
      }

      this.enemies.push({
        type: wave.type,
        x: tx,
        y: -60 - i * 22,
        tx,
        ty,
        hp: def.hp,
        maxHp: def.hp,
        radius: def.radius,
        phase: i * 0.5,
        hitFlash: 0
      });
      this.totalSpawned++;
    }
  },

  bindControls() {
    const move = (clientX, clientY) => {
      if (!this.running || this.paused) return;
      const rect = this.canvas.getBoundingClientRect();
      this.player.x = Math.max(24, Math.min(this.canvas.width - 24, clientX - rect.left));
      this.player.y = Math.max(60, Math.min(this.canvas.height - 30, clientY - rect.top - 30));
    };

    this.canvas.addEventListener('pointermove', e => {
      if (e.buttons > 0 || e.pointerType === 'touch') move(e.clientX, e.clientY);
    });
    this.canvas.addEventListener('pointerdown', e => move(e.clientX, e.clientY));
  },

  triggerBomb() {
    if (!this.running || this.paused || this.player.bombs <= 0) return;
    this.player.bombs--;
    this.enemyBullets = [];
    this.shake = 16;
    this.spawnExplosion(this.canvas.width / 2, this.canvas.height / 2, '#facc15', 40, true);
    this.enemies.forEach(e => { e.hp -= 260; e.hitFlash = 4; });
    AudioFX.play(110, 'sawtooth', 0.35, 0.15);
    this.updateHUD();
  },

  togglePause() {
    if (!this.running) return;
    this.paused = !this.paused;
    document.getElementById('pause-modal').classList.toggle('hidden', !this.paused);
    if (!this.paused) requestAnimationFrame(t => this.loop(t));
  },

  quitToMap() {
    this.running = false;
    this.showScreen('map');
  },

  nextLevel() {
    if (this.levelIndex + 1 < LEVELS.length) {
      this.startLevel(this.levelIndex + 1);
    } else {
      this.showScreen('map');
    }
  },

  updateHUD() {
    document.getElementById('hud-score').textContent = this.score;
    document.getElementById('hud-bombs').textContent = this.player.bombs;
    const pips = document.getElementById('hud-power-pips');
    pips.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div');
      d.className = 'pip' + (i < this.player.power ? ' active' : '');
      pips.appendChild(d);
    }
  },

  endLevel(won) {
    this.running = false;
    const lvl = LEVELS[this.levelIndex];
    const ratio = this.totalSpawned ? this.totalKilled / this.totalSpawned : 0;
    let earnedStars = 0;

    const list = document.getElementById('result-tasks');
    list.innerHTML = '';
    lvl.tasks.forEach(t => {
      const ok = won && ratio >= t.pct;
      if (ok) earnedStars++;
      const li = document.createElement('li');
      li.textContent = `${ok ? '⭐' : '☆'} ${t.label}`;
      list.appendChild(li);
    });

    const coins = won ? lvl.rewardCoins + earnedStars * 50 : Math.floor(this.score * 0.05);
    this.save.coins += coins;
    const prevBest = this.save.bestScores[lvl.id] || 0;
    if (this.score > prevBest) this.save.bestScores[lvl.id] = this.score;
    if (won) {
      this.save.stars[lvl.id] = Math.max(this.save.stars[lvl.id] || 0, earnedStars);
      if (this.levelIndex >= this.save.unlockedLevel) {
        this.save.unlockedLevel = Math.min(LEVELS.length - 1, this.levelIndex + 1);
      }
    }
    this.saveProgress();

    document.getElementById('result-title').textContent = won ? 'WIN' : 'DEFEAT';
    document.getElementById('result-stars').textContent = '⭐'.repeat(earnedStars) + '☆'.repeat(3 - earnedStars);
    document.getElementById('result-score').textContent = this.score;
    document.getElementById('result-best').textContent = this.save.bestScores[lvl.id] || this.score;
    document.getElementById('result-coins').textContent = coins;
    document.getElementById('btn-next-level').classList.toggle('hidden', !won);
    document.getElementById('result-modal').classList.remove('hidden');
  },

  loop(t) {
    if (!this.running || this.paused) return;

    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    const sec = Math.floor((t - this.startTime) / 1000);
    document.getElementById('hud-time').textContent =
      `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
      this.shake *= 0.88;
      if (this.shake < 0.5) this.shake = 0;
    }

    this.drawSpaceBg(ctx, W, H, t);

    // Auto-fire
    const ship = SHIPS[this.player.shipId];
    const lv = this.save.shipLevels[ship.id] || 1;
    const dmg = ship.baseAtk + (lv - 1) * 5;
    if (t - this.lastFire > ship.fireDelay) {
      ship.fire(this.bullets, this.player.x, this.player.y, this.player.power, dmg);
      AudioFX.play(520, 'triangle', 0.04, 0.025);
      this.lastFire = t;
    }

    // Glowing additive player bullets
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx; b.y += b.vy;
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x - b.w * 0.25, b.y - b.h * 0.4, b.w * 0.5, b.h * 0.8);
      if (b.y < -40) this.bullets.splice(i, 1);
    }
    ctx.restore();

    // Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const def = ENEMIES[e.type];
      e.y += (e.ty - e.y) * 0.05;
      e.x = e.tx + Math.sin(t * 0.002 + e.phase) * (e.type === 'boss' ? 85 : 22);
      if (e.hitFlash > 0) e.hitFlash--;

      if (Math.random() < def.fireChance) {
        this.enemyBullets.push({ x: e.x, y: e.y + e.radius, vx: 0, vy: 4.5 });
      }

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 8) {
          e.hp -= b.dmg;
          e.hitFlash = 2;
          this.spawnExplosion(b.x, b.y, b.color, 3, false);
          this.bullets.splice(j, 1);
          if (e.hp <= 0) break;
        }
      }

      if (e.hp <= 0) {
        this.score += def.score;
        this.totalKilled++;
        const isBoss = e.type === 'boss';
        if (isBoss) this.shake = 22;
        this.spawnExplosion(e.x, e.y, isBoss ? '#c084fc' : '#fb923c', isBoss ? 48 : 18, isBoss);
        AudioFX.play(isBoss ? 90 : 180, 'sawtooth', isBoss ? 0.35 : 0.09, 0.07);
        if (Math.random() < 0.22) {
          const shipIds = Object.keys(SHIPS);
          const isTransform = Math.random() < 0.35;
          this.powerups.push({
            x: e.x,
            y: e.y,
            kind: isTransform ? 'ship' : 'power',
            shipId: shipIds[Math.floor(Math.random() * shipIds.length)]
          });
        }
        this.enemies.splice(i, 1);
        this.updateHUD();
        continue;
      }

      def.draw(ctx, e.x, e.y, t, e.hitFlash);

      if (e.hp < e.maxHp) {
        const bw = e.type === 'boss' ? 90 : 36;
        ctx.fillStyle = '#334155';
        ctx.fillRect(e.x - bw / 2, e.y - e.radius - 10, bw, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(e.x - bw / 2, e.y - e.radius - 10, bw * (e.hp / e.maxHp), 5);
      }
    }

    // Power-ups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += 2.2;
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.kind === 'ship' ? '#38bdf8' : '#facc15';
      ctx.fillStyle = p.kind === 'ship' ? '#38bdf8' : '#facc15';
      ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.kind === 'ship' ? '✈' : '▲', p.x, p.y + 4);
      ctx.restore();

      if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < 30) {
        if (p.kind === 'ship') this.player.shipId = p.shipId;
        else this.player.power = Math.min(6, this.player.power + 1);
        AudioFX.play(740, 'sine', 0.12, 0.08);
        this.powerups.splice(i, 1);
        this.updateHUD();
      } else if (p.y > H + 20) {
        this.powerups.splice(i, 1);
      }
    }

    // Enemy bullets (glowing orbs)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.y += eb.vy;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f43f5e';
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(eb.x, eb.y, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(eb.x, eb.y, 2.5, 0, Math.PI * 2); ctx.fill();

      if (this.player.invuln <= 0 && Math.hypot(eb.x - this.player.x, eb.y - this.player.y) < 18) {
        this.spawnExplosion(this.player.x, this.player.y, '#38bdf8', 32, true);
        this.endLevel(false);
        ctx.restore();
        ctx.restore();
        return;
      }
      if (eb.y > H + 20) this.enemyBullets.splice(i, 1);
    }
    ctx.restore();

    // Particles & Shockwaves
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx; pt.y += pt.vy;
      pt.life -= pt.decay;
      if (pt.life <= 0) { this.particles.splice(i, 1); continue; }
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.r += (sw.maxR - sw.r) * 0.18;
      sw.life -= 0.06;
      if (sw.life <= 0) { this.shockwaves.splice(i, 1); continue; }
      ctx.globalAlpha = sw.life;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();

    // Draw player
    if (this.player.invuln > 0) this.player.invuln--;
    ship.draw(ctx, this.player.x, this.player.y, 1, t);

    ctx.restore();

    // Next wave check
    if (this.enemies.length === 0) {
      this.waveIndex++;
      this.spawnWave();
    }

    requestAnimationFrame(nextT => this.loop(nextT));
  }
};

window.addEventListener('DOMContentLoaded', () => Game.init());
