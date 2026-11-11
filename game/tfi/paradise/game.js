// ST GAMES: THE PARADISE - Main Gameplay Engine (with Police Watchtower Sniper & Progressive Obstacles)
class ParadiseGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.passes = 0;
    this.paused = false;
    this.gameOver = false;
    this.levelWon = false;
    this.levelElapsed = 0;
    this.policeAlertShown = false;

    this.villagers = [];
    this.guards = [];
    this.obstacles = [];
    this.towers = [];
    this.bulletTracers = [];
    this.floatingTexts = [];
    this.rainDrops = [];
    this.puddles = [];
    this.passArc = null;
    this.alertBannerTimer = 0;
    this.alertBannerText = '';

    this.houses = [
      { x: 0.22, y: 0.18 },
      { x: 0.60, y: 0.20 },
      { x: 0.35, y: 0.44 },
      { x: 0.44, y: 0.80 },
      { x: 0.74, y: 0.78 },
      { x: 0.18, y: 0.62 }
    ];
    this.trees = [
      { x: 0.15, y: 0.82 },
      { x: 0.30, y: 0.58 },
      { x: 0.49, y: 0.46 },
      { x: 0.64, y: 0.38 },
      { x: 0.56, y: 0.68 }
    ];
    this.puddles = [
      { x: 0.28, y: 0.32, rx: 12, ry: 3.5 },
      { x: 0.54, y: 0.62, rx: 14, ry: 4 },
      { x: 0.68, y: 0.30, rx: 11, ry: 3.5 },
      { x: 0.24, y: 0.72, rx: 13, ry: 3.8 }
    ];

    const savedState = this.loadProgress();
    this.unlockedLevel = savedState.unlockedLevel;
    this.currentLevelIndex = savedState.currentLevelIndex;

    this.initRain();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindCanvasInput();

    this.loadLevel(this.currentLevelIndex);

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('st_games_paradise_save');
      if (saved) {
        const parsed = JSON.parse(saved);
        const curIdx = typeof parsed.currentLevelIndex === 'number' && parsed.currentLevelIndex >= 0
          ? parsed.currentLevelIndex
          : 0;
        const unlocked = typeof parsed.unlockedLevel === 'number' && parsed.unlockedLevel >= 1
          ? parsed.unlockedLevel
          : curIdx + 1;
        return { currentLevelIndex: curIdx, unlockedLevel: unlocked };
      }
    } catch (e) {}
    return { currentLevelIndex: 0, unlockedLevel: 1 };
  }

  saveProgress(currentIndex, unlockedNum) {
    try {
      if (unlockedNum > this.unlockedLevel) {
        this.unlockedLevel = unlockedNum;
      }
      localStorage.setItem(
        'st_games_paradise_save',
        JSON.stringify({
          currentLevelIndex: currentIndex,
          currentLevelNumber: currentIndex + 1,
          unlockedLevel: this.unlockedLevel,
          updatedAt: Date.now()
        })
      );
      localStorage.setItem('paradise_current_level', String(currentIndex + 1));
      localStorage.setItem('paradise_unlocked_level', String(this.unlockedLevel));
    } catch (e) {}
  }

  initRain() {
    this.rainDrops = [];
    for (let i = 0; i < 115; i++) {
      this.rainDrops.push({
        x: Math.random(),
        y: Math.random(),
        len: 10 + Math.random() * 10,
        speed: 0.36 + Math.random() * 0.24
      });
    }
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(320, rect.width);
    this.height = Math.max(220, rect.height);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (this.villagers.length > 0) {
      this.villagers.forEach((v) => {
        v.x = v.nx * this.width;
        v.y = v.ny * this.height;
        v.targetX = v.ntx * this.width;
        v.targetY = v.nty * this.height;
      });
      this.guards.forEach((g) => {
        g.x = g.nx * this.width;
        g.y = g.ny * this.height;
      });
      this.obstacles.forEach((ob) => {
        ob.x = ob.nx * this.width;
        ob.y = ob.ny * this.height;
      });
      this.towers.forEach((tw) => {
        tw.x = tw.nx * this.width;
        tw.y = tw.ny * this.height;
      });
    }
  }

  pickRandomWanderPoint(v) {
    const ntx = 0.12 + Math.random() * 0.67;
    const nty = 0.12 + Math.random() * 0.76;
    v.ntx = ntx;
    v.nty = nty;
    v.targetX = ntx * this.width;
    v.targetY = nty * this.height;
    v.wanderTimer = 2.5 + Math.random() * 3.5;
  }

  loadLevel(index) {
    this.currentLevelIndex = Math.max(0, index);
    const cfg = window.getParadiseLevelConfig(this.currentLevelIndex);
    this.currentConfig = cfg;

    this.saveProgress(this.currentLevelIndex, this.currentLevelIndex + 1);

    this.passes = 0;
    this.gameOver = false;
    this.levelWon = false;
    this.passArc = null;
    this.floatingTexts = [];
    this.bulletTracers = [];
    this.levelElapsed = 0;
    this.policeAlertShown = false;
    this.alertBannerTimer = 0;

    this.villagers = cfg.villagers.map((v, i) => {
      const ntx = 0.14 + Math.random() * 0.65;
      const nty = 0.14 + Math.random() * 0.72;
      return {
        ...v,
        nx: v.x,
        ny: v.y,
        x: v.x * this.width,
        y: v.y * this.height,
        ntx,
        nty,
        targetX: ntx * this.width,
        targetY: nty * this.height,
        vx: 0,
        vy: 0,
        wanderTimer: 1.5 + Math.random() * 2.5,
        seed: i * 1.37
      };
    });

    this.guards = (cfg.guards || []).map((g, i) => ({
      ...g,
      nx: g.x,
      ny: g.y,
      x: g.x * this.width,
      y: g.y * this.height,
      spawnDelay: typeof g.spawnDelay === 'number' ? g.spawnDelay : 3.0,
      active: false,
      seed: i * 2.13
    }));

    this.obstacles = (cfg.obstacles || []).map((ob) => ({
      ...ob,
      nx: ob.x,
      ny: ob.y,
      x: ob.x * this.width,
      y: ob.y * this.height
    }));

    this.towers = (cfg.towers || []).map((tw, i) => ({
      ...tw,
      nx: tw.x,
      ny: tw.y,
      x: tw.x * this.width,
      y: tw.y * this.height,
      state: 'waiting', // 'waiting' -> 'building' -> 'active'
      buildProgress: 0,
      aimProgress: 0,
      buildAlerted: false,
      readyAlerted: false,
      seed: i * 1.7
    }));

    this.hideModals();
    this.updateHUD();
    if (window.paradiseAudio && window.paradiseAudio.soundOn) {
      window.paradiseAudio.tryAutoStart();
    }
  }

  updateHUD() {
    const lvlEl = document.getElementById('hudLevel');
    const vilEl = document.getElementById('hudVillagers');
    const pasEl = document.getElementById('hudPasses');
    if (lvlEl) lvlEl.textContent = String(this.currentLevelIndex + 1);
    if (vilEl) vilEl.textContent = `${this.villagers.length}/6`;
    if (pasEl) pasEl.textContent = String(this.passes);
  }

  getCarrierIndex() {
    return this.villagers.findIndex((v) => v.hasBaby);
  }

  bindCanvasInput() {
    const getPos = (e) => {
      const r = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - r.left,
        y: e.clientY - r.top
      };
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.gameOver || this.levelWon || this.paused) return;
      if (window.paradiseAudio && window.paradiseAudio.soundOn) {
        window.paradiseAudio.initContext();
      }
      const pos = getPos(e);

      let clickedIdx = -1;
      let bestDist = 42;
      this.villagers.forEach((v, idx) => {
        const d = Math.hypot(v.x - pos.x, v.y - pos.y);
        if (d < bestDist) {
          bestDist = d;
          clickedIdx = idx;
        }
      });

      const carrierIdx = this.getCarrierIndex();
      if (clickedIdx !== -1 && clickedIdx !== carrierIdx && carrierIdx !== -1 && !this.passArc) {
        this.tryPassToVillager(carrierIdx, clickedIdx);
      }
    });
  }

  getPassRadiusPx() {
    const cfg = this.currentConfig || window.getParadiseLevelConfig(this.currentLevelIndex);
    const ratio = cfg.passRadiusRatio || 0.23;
    const refSpan = Math.min(this.width, this.height * 1.15);
    return Math.max(80, Math.min(165, refSpan * ratio));
  }

  tryPassToVillager(fromIdx, toIdx) {
    const fromV = this.villagers[fromIdx];
    const toV = this.villagers[toIdx];
    const dist = Math.hypot(toV.x - fromV.x, toV.y - fromV.y);
    const maxR = this.getPassRadiusPx();

    if (dist <= maxR) {
      fromV.hasBaby = false;
      this.pickRandomWanderPoint(fromV);
      this.passes += 1;
      this.updateHUD();

      // Reset any active Watchtower sniper lock-on when the baby is passed!
      this.towers.forEach((tw) => {
        if (tw.state === 'active' && tw.aimProgress > 0.15) {
          tw.aimProgress = 0;
          this.spawnFloatingText(tw.x, tw.y - 38, 'Sniper Dodged!', '#0284c7');
        } else {
          tw.aimProgress = 0;
        }
      });

      this.passArc = {
        fromX: fromV.x,
        fromY: fromV.y - 4,
        toX: toV.x,
        toY: toV.y - 4,
        t: 0,
        targetIdx: toIdx
      };
      this.spawnFloatingText(fromV.x, fromV.y - 28, 'clean!', '#2d6a4f');
      const shouts = window.PARADISE_DIALOGUES.babyChangeShouts || ['Ee desham manadhe!', 'Ee jaaga manadhe!'];
      const chosenShout = shouts[(this.passes - 1) % shouts.length];
      this.spawnFloatingText(toV.x, toV.y - 34, chosenShout, '#1e293b');
      window.paradiseAudio.playPass(toV.id);
    } else {
      this.spawnFloatingText(toV.x, toV.y - 28, 'too far', '#dc2626');
      window.paradiseAudio.playTooFar();
    }
  }

  spawnFloatingText(x, y, text, color) {
    this.floatingTexts.push({ x, y, text, color, life: 1.1 });
  }

  triggerAlertBanner(text, duration = 2.6) {
    this.alertBannerText = text;
    this.alertBannerTimer = duration;
  }

  showWinModal() {
    if (this.levelWon) return;
    this.levelWon = true;
    window.paradiseAudio.playLevelClear();
    this.saveProgress(this.currentLevelIndex + 1, this.currentLevelIndex + 2);
    const modal = document.getElementById('winModal');
    const passesText = document.getElementById('winPassesText');
    if (passesText) passesText.textContent = `Passes used: ${this.passes}`;
    if (modal) modal.classList.add('active');
  }

  showLoseModal(byTower = false) {
    if (this.gameOver) return;
    this.gameOver = true;
    window.paradiseAudio.playGameOver();
    this.saveProgress(this.currentLevelIndex, this.unlockedLevel);
    const modal = document.getElementById('loseModal');
    const titleEl = document.getElementById('loseTitleText');
    const subEl = document.getElementById('loseSubText');
    const loseLvl = document.getElementById('loseLevelText');
    if (titleEl) {
      titleEl.textContent = byTower
        ? window.PARADISE_DIALOGUES.towerLoseTitle
        : window.PARADISE_DIALOGUES.levelLoseTitle;
    }
    if (subEl) {
      subEl.textContent = byTower
        ? window.PARADISE_DIALOGUES.towerLoseSub
        : window.PARADISE_DIALOGUES.levelLoseSub;
    }
    if (loseLvl) loseLvl.textContent = `Level ${this.currentLevelIndex + 1}`;
    if (modal) modal.classList.add('active');
  }

  hideModals() {
    const winM = document.getElementById('winModal');
    const loseM = document.getElementById('loseModal');
    if (winM) winM.classList.remove('active');
    if (loseM) loseM.classList.remove('active');
  }

  update(dt, time) {
    this.rainDrops.forEach((r) => {
      r.x -= dt * 0.07;
      r.y += dt * r.speed;
      if (r.y > 1.05) {
        r.y = -0.05;
        r.x = Math.random();
      }
      if (r.x < -0.05) r.x = 1.02;
    });

    if (this.alertBannerTimer > 0) {
      this.alertBannerTimer = Math.max(0, this.alertBannerTimer - dt);
    }

    this.bulletTracers.forEach((b) => {
      b.life -= dt * 3.2;
    });
    this.bulletTracers = this.bulletTracers.filter((b) => b.life > 0);

    if (this.paused || this.gameOver || this.levelWon) return;

    this.levelElapsed += dt;

    const cfg = this.currentConfig || window.getParadiseLevelConfig(this.currentLevelIndex);
    const paradiseHouseX = this.width * 0.90;
    const paradiseHouseY = this.height * 0.48;
    const paradiseLineX = this.width * 0.84;

    const carrierSpeedPx = (18 / 600) * this.width;
    const wanderSpeedPx = (20 / 600) * this.width;

    const carrierIdx = this.getCarrierIndex();

    // 1. Update Villagers (with obstacle/barricade avoidance)
    this.villagers.forEach((v, idx) => {
      if (idx === carrierIdx && !this.passArc) {
        let dx = paradiseHouseX - v.x;
        let dy = (paradiseHouseY - v.y) * 0.45;
        const dist = Math.hypot(dx, dy) || 1;
        let vx = (dx / dist) * carrierSpeedPx;
        let vy = (dy / dist) * carrierSpeedPx;

        // Steer around barricades/obstacles
        this.obstacles.forEach((ob) => {
          const ox = v.x - ob.x;
          const oy = v.y - ob.y;
          const od = Math.hypot(ox, oy);
          if (od < 42 && od > 0.1) {
            vy += (oy >= 0 ? 1 : -1) * carrierSpeedPx * 0.9;
          }
        });

        v.vx = vx;
        v.vy = vy;
        v.x += v.vx * dt;
        v.y += v.vy * dt;
        v.y = Math.max(28, Math.min(this.height - 28, v.y));
        v.nx = v.x / this.width;
        v.ny = v.y / this.height;

        if (v.x >= paradiseLineX + 10) {
          this.showWinModal();
        }
      } else {
        v.wanderTimer -= dt;
        const distToTarget = Math.hypot(v.targetX - v.x, v.targetY - v.y);
        if (v.wanderTimer <= 0 || distToTarget < 16) {
          this.pickRandomWanderPoint(v);
        }

        let dirX = v.targetX - v.x;
        let dirY = v.targetY - v.y;
        const dLen = Math.hypot(dirX, dirY) || 1;
        dirX /= dLen;
        dirY /= dLen;

        this.villagers.forEach((other, oIdx) => {
          if (oIdx === idx) return;
          const sx = v.x - other.x;
          const sy = v.y - other.y;
          const sDist = Math.hypot(sx, sy);
          if (sDist > 0.1 && sDist < 48) {
            dirX += (sx / sDist) * 0.6;
            dirY += (sy / sDist) * 0.6;
          }
        });

        this.obstacles.forEach((ob) => {
          const ox = v.x - ob.x;
          const oy = v.y - ob.y;
          const od = Math.hypot(ox, oy);
          if (od < 44 && od > 0.1) {
            dirX += (ox / od) * 0.8;
            dirY += (oy / od) * 0.8;
          }
        });

        const finalLen = Math.hypot(dirX, dirY) || 1;
        const spd = wanderSpeedPx * (v.id === 'crow' ? 1.12 : v.id === 'dog' ? 1.08 : 1.0);
        v.vx = (dirX / finalLen) * spd;
        v.vy = (dirY / finalLen) * spd;
        v.x += v.vx * dt;
        v.y += v.vy * dt;

        const minX = this.width * 0.08;
        const maxX = this.width * 0.80;
        const minY = 28;
        const maxY = this.height - 28;
        if (v.x < minX || v.x > maxX || v.y < minY || v.y > maxY) {
          v.x = Math.max(minX, Math.min(maxX, v.x));
          v.y = Math.max(minY, Math.min(maxY, v.y));
          this.pickRandomWanderPoint(v);
        }
        v.nx = v.x / this.width;
        v.ny = v.y / this.height;
      }
    });

    // 2. Update flying baby pass arc
    if (this.passArc) {
      const receiver = this.villagers[this.passArc.targetIdx];
      if (receiver) {
        this.passArc.toX = receiver.x;
        this.passArc.toY = receiver.y - 4;
      }
      this.passArc.t += dt * 2.5;
      if (this.passArc.t >= 1) {
        if (receiver) {
          receiver.hasBaby = true;
        }
        this.passArc = null;
      }
    }

    // 3. Determine current baby position
    let babyPos = null;
    const activeCarrierIdx = this.getCarrierIndex();
    if (activeCarrierIdx !== -1) {
      babyPos = {
        x: this.villagers[activeCarrierIdx].x,
        y: this.villagers[activeCarrierIdx].y
      };
    } else if (this.passArc) {
      const t = this.passArc.t;
      babyPos = {
        x: this.passArc.fromX + (this.passArc.toX - this.passArc.fromX) * t,
        y: this.passArc.fromY + (this.passArc.toY - this.passArc.fromY) * t
      };
    }

    // 4. Update Police Watchtowers (Build Phase -> Alert -> Sniper Laser Lock-On -> Gunfire!)
    this.towers.forEach((tw) => {
      if (tw.state === 'waiting' && this.levelElapsed >= (tw.buildStart || 2.0)) {
        tw.state = 'building';
        if (!tw.buildAlerted) {
          tw.buildAlerted = true;
          this.spawnFloatingText(tw.x, tw.y - 30, window.PARADISE_DIALOGUES.onTowerBuild, '#d97706');
          this.triggerAlertBanner(window.PARADISE_DIALOGUES.onTowerBuild, 2.2);
        }
      } else if (tw.state === 'building') {
        tw.buildProgress += dt / (tw.buildDuration || 2.0);
        if (tw.buildProgress >= 1.0) {
          tw.buildProgress = 1.0;
          tw.state = 'active';
          if (!tw.readyAlerted) {
            tw.readyAlerted = true;
            window.paradiseAudio.playTowerAlert();
            this.spawnFloatingText(tw.x, tw.y - 38, '🚨 Sniper Tower Ready!', '#dc2626');
            this.triggerAlertBanner(window.PARADISE_DIALOGUES.onTowerReady, 3.0);
          }
        }
      } else if (tw.state === 'active') {
        if (activeCarrierIdx !== -1 && babyPos && !this.passArc) {
          tw.aimProgress += dt / (tw.aimDuration || 3.4);
          if (tw.aimProgress >= 0.72 && (!tw.lastBeep || time - tw.lastBeep > 0.45)) {
            tw.lastBeep = time;
            window.paradiseAudio.playProximityAlert();
          }
          if (tw.aimProgress >= 1.0) {
            // Police Tower Fires Gun at Carrier!
            tw.aimProgress = 1.0;
            window.paradiseAudio.playGunshot();
            this.bulletTracers.push({
              x1: tw.x,
              y1: tw.y - 26,
              x2: babyPos.x,
              y2: babyPos.y,
              life: 1.0
            });
            this.spawnFloatingText(babyPos.x, babyPos.y - 30, '💥 SHOT!', '#dc2626');
            this.showLoseModal(true);
          }
        } else {
          tw.aimProgress = Math.max(0, tw.aimProgress - dt * 0.5);
        }
      }
    });

    // 5. Update Foot Police chasing the baby carrier
    const baseGuardSpeed = ((cfg.guardSpeed || 52) / 600) * this.width;

    this.guards.forEach((g) => {
      if (!g.active && this.levelElapsed >= g.spawnDelay) {
        g.active = true;
        const isFirst = !this.policeAlertShown;
        this.policeAlertShown = true;
        window.paradiseAudio.playDanger(isFirst);
        const pAlerts = window.PARADISE_DIALOGUES.onPoliceComing || ['🚨 Police!'];
        const alertMsg = pAlerts[Math.floor(g.seed * 10) % pAlerts.length];
        this.spawnFloatingText(Math.max(48, g.x + 42), Math.max(32, Math.min(this.height - 32, g.y - 18)), alertMsg, '#dc2626');
      }
      if (!g.active || !babyPos) return;

      const dx = babyPos.x - g.x;
      const dy = babyPos.y - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const spd = baseGuardSpeed * (g.speedMul || 1) * dt;
        g.x += (dx / dist) * spd;
        g.y += (dy / dist) * spd;
        g.nx = g.x / this.width;
        g.ny = g.y / this.height;
      }

      if (activeCarrierIdx !== -1 && dist < 58 && (!g.lastWarn || time - g.lastWarn > 2.4)) {
        g.lastWarn = time;
        window.paradiseAudio.playProximityAlert();
        this.spawnFloatingText(babyPos.x, babyPos.y - 34, 'Pass fast!', '#dc2626');
      }
      if (activeCarrierIdx !== -1 && dist < 20) {
        this.showLoseModal(false);
      }
    });

    // 6. Floating text popups
    this.floatingTexts.forEach((ft) => {
      ft.y -= dt * 24;
      ft.life -= dt * 1.1;
    });
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);
  }

  render2D(time) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 1. Notebook paper background
    ctx.fillStyle = '#e8eef2';
    ctx.fillRect(0, 0, w, h);

    // 2. Ruled horizontal lines
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    const lineSpacing = Math.max(16, h / 24);
    for (let y = lineSpacing; y < h; y += lineSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3. Left pink margin line + punch holes
    const marginX = w * 0.062;
    ctx.strokeStyle = '#e2a8b4';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(marginX, 0);
    ctx.lineTo(marginX, h);
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    [0.20, 0.50, 0.80].forEach((py) => {
      ctx.beginPath();
      ctx.arc(marginX * 0.45, h * py, 5.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Right-hand "The Paradise" Sanctuary Zone
    const paradiseX = w * 0.84;
    ctx.save();
    ctx.beginPath();
    ctx.rect(paradiseX, 0, w - paradiseX, h);
    ctx.clip();

    ctx.strokeStyle = 'rgba(74, 144, 104, 0.34)';
    ctx.lineWidth = 1.4;
    for (let diag = -h; diag < w - paradiseX + h; diag += 8) {
      ctx.beginPath();
      ctx.moveTo(paradiseX + diag, 0);
      ctx.lineTo(paradiseX + diag - h * 0.7, h);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#2d6a4f';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(paradiseX, 0);
    ctx.lineTo(paradiseX, h);
    ctx.stroke();
    ctx.restore();

    this.drawParadiseMonument(ctx, paradiseX + (w - paradiseX) * 0.5, h * 0.47, time);

    // 5. Puddles, houses, trees, and barricades/obstacles
    this.puddles.forEach((p) => {
      ctx.save();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.32)';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.14)';
      ctx.beginPath();
      ctx.ellipse(p.x * w, p.y * h, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
    this.houses.forEach((hs) => this.drawSketchedHouse(ctx, hs.x * w, hs.y * h));
    this.trees.forEach((tr) => this.drawSketchedTree(ctx, tr.x * w, tr.y * h));
    this.obstacles.forEach((ob) => this.drawBarricade(ctx, ob.x, ob.y, ob.w, ob.h));

    // 6. Smaller Dashed Green Pass Radius Circle around current baby carrier
    const carrierIdx = this.getCarrierIndex();
    if (carrierIdx !== -1) {
      const carrier = this.villagers[carrierIdx];
      const rad = this.getPassRadiusPx();
      ctx.save();
      ctx.strokeStyle = 'rgba(45, 106, 79, 0.68)';
      ctx.lineWidth = 1.7;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(carrier.x, carrier.y, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 7. Draw Police Watchtowers + Red Sniper Laser Sight & Target Lock-On Ring!
    const carrierObj = carrierIdx !== -1 ? this.villagers[carrierIdx] : null;
    this.towers.forEach((tw) => {
      this.drawPoliceTower(ctx, tw, time, carrierObj);
    });

    // 8. Bullet tracers if sniper fired
    this.bulletTracers.forEach((b) => {
      ctx.save();
      ctx.strokeStyle = `rgba(220, 38, 38, ${b.life})`;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();
    });

    // 9. Curved Pass Arc trajectory & flying baby when mid-pass
    if (this.passArc) {
      const a = this.passArc;
      const midX = (a.fromX + a.toX) / 2;
      const midY = Math.min(a.fromY, a.toY) - 42;

      ctx.save();
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(a.fromX, a.fromY);
      ctx.quadraticCurveTo(midX, midY, a.toX, a.toY);
      ctx.stroke();
      ctx.restore();

      const t = a.t;
      const bx = (1 - t) * (1 - t) * a.fromX + 2 * (1 - t) * t * midX + t * t * a.toX;
      const by = (1 - t) * (1 - t) * a.fromY + 2 * (1 - t) * t * midY + t * t * a.toY;
      window.ParadiseCharacters.drawBabyBundle(ctx, bx, by);
    }

    // 10. Draw all 6 real Paradise villagers
    const sortedVillagers = this.villagers.map((v, idx) => ({ v, idx })).sort((a, b) => a.v.y - b.v.y);
    sortedVillagers.forEach(({ v, idx }) => {
      window.ParadiseCharacters.drawVillager(ctx, v, time, idx === carrierIdx && !this.passArc);
    });

    // 11. Draw khaki police chasing the baby
    this.guards.forEach((g) => {
      window.ParadiseCharacters.drawGuard(ctx, g, time, carrierObj);
    });

    // 12. Floating status text ("clean!", "Ee desham manadhe!", "Ee jaaga manadhe!", "too far")
    this.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.font = 'bold 14px "Comic Neue", cursive, sans-serif';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    // 13. Top Alert Banner when Police Build Watchtower / Sniper Locks On
    if (this.alertBannerTimer > 0 && this.alertBannerText) {
      const pulse = 0.82 + 0.18 * Math.sin(time * 14);
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.alertBannerTimer * 2) * pulse;
      ctx.fillStyle = '#dc2626';
      const bw = Math.min(w - 24, 380);
      const bx = (w - bw) / 2;
      ctx.beginPath();
      ctx.roundRect(bx, 8, bw, 26, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Comic Neue", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.alertBannerText, w / 2, 25);
      ctx.restore();
    }

    // 14. Diagonal falling rain streaks
    ctx.save();
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.34)';
    ctx.lineWidth = 1.1;
    this.rainDrops.forEach((r) => {
      const rx = r.x * w;
      const ry = r.y * h;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3, ry + r.len);
      ctx.stroke();
    });
    ctx.restore();
  }

  drawBarricade(ctx, x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#9a6b3b';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.3;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    // Hazard stripes
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    for (let sx = -w / 2 + 6; sx < w / 2 - 4; sx += 10) {
      ctx.beginPath();
      ctx.moveTo(sx, -h / 2 + 2);
      ctx.lineTo(sx + 5, h / 2 - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPoliceTower(ctx, tw, time, carrierObj) {
    if (tw.state === 'waiting') return;
    ctx.save();
    ctx.translate(tw.x, tw.y);

    const prog = tw.state === 'building' ? tw.buildProgress : 1.0;
    const towerH = 44 * prog;

    // Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wooden/Steel Watchtower X-braced legs rising up
    ctx.strokeStyle = '#5c4028';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-14, 16);
    ctx.lineTo(-9, 16 - towerH);
    ctx.moveTo(14, 16);
    ctx.lineTo(9, 16 - towerH);
    // Cross braces
    ctx.moveTo(-12, 16 - towerH * 0.3);
    ctx.lineTo(10, 16 - towerH * 0.75);
    ctx.moveTo(12, 16 - towerH * 0.3);
    ctx.lineTo(-10, 16 - towerH * 0.75);
    ctx.stroke();

    // Watchtower Top Platform & Sandbag Guardrail
    ctx.fillStyle = '#785532';
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 1.4;
    ctx.fillRect(-14, 12 - towerH, 28, 7);
    ctx.strokeRect(-14, 12 - towerH, 28, 7);

    if (tw.state === 'building') {
      // Construction progress bar above tower
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-20, -towerH - 8, 40, 5);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-20, -towerH - 8, 40 * prog, 5);
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#b45309';
      ctx.textAlign = 'center';
      ctx.fillText('Building Tower...', 0, -towerH - 12);
    } else if (tw.state === 'active') {
      // Roof canopy
      ctx.strokeStyle = '#3e2723';
      ctx.fillStyle = '#a3894c';
      ctx.beginPath();
      ctx.moveTo(-16, -2 - towerH);
      ctx.lineTo(0, -13 - towerH);
      ctx.lineTo(16, -2 - towerH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Police Sniper perched inside tower
      ctx.fillStyle = '#856d3b';
      ctx.fillRect(-5, 2 - towerH, 10, 10);
      ctx.fillStyle = '#d4945a';
      ctx.beginPath();
      ctx.arc(0, -1 - towerH, 4, 0, Math.PI * 2);
      ctx.fill();

      // Sniper Rifle Barrel pointing toward baby carrier
      let angle = 0;
      if (carrierObj) {
        angle = Math.atan2(carrierObj.y - (tw.y + 4 - towerH), carrierObj.x - tw.x);
      }
      ctx.save();
      ctx.translate(0, 4 - towerH);
      ctx.rotate(angle);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();
      ctx.restore();

      // Flashing Red Siren Beacon on top of Watchtower
      const blink = Math.sin(time * 16) > 0;
      ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
      ctx.beginPath();
      ctx.arc(0, -15 - towerH, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw Red Sniper Laser Line & Lock-On Crosshair on the Baby Carrier!
    if (tw.state === 'active' && carrierObj && !this.passArc) {
      const gunX = tw.x;
      const gunY = tw.y - 26;
      const aimRatio = Math.min(1, tw.aimProgress);

      ctx.save();
      ctx.strokeStyle = aimRatio > 0.7 ? 'rgba(220, 38, 38, 0.88)' : 'rgba(239, 68, 68, 0.55)';
      ctx.lineWidth = aimRatio > 0.7 ? 2.2 : 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(gunX, gunY);
      ctx.lineTo(carrierObj.x, carrierObj.y - 4);
      ctx.stroke();
      ctx.restore();

      // Sniper Crosshair & Lock-On Progress Ring around Carrier
      ctx.save();
      ctx.translate(carrierObj.x, carrierObj.y - 4);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * aimRatio);
      ctx.stroke();
      // Crosshair ticks
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-21, 0);
      ctx.lineTo(-13, 0);
      ctx.moveTo(13, 0);
      ctx.lineTo(21, 0);
      ctx.moveTo(0, -21);
      ctx.lineTo(0, -13);
      ctx.moveTo(0, 13);
      ctx.lineTo(0, 21);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawSketchedHouse(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.85, 0.85);
    ctx.strokeStyle = '#7c8b99';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-22, -4);
    ctx.lineTo(0, -22);
    ctx.lineTo(22, -4);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeRect(-16, -4, 32, 22);
    ctx.strokeRect(-5, 5, 8, 13);
    ctx.strokeRect(6, 2, 6, 6);
    ctx.restore();
  }

  drawSketchedTree(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.85, 0.85);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, 19);
    ctx.stroke();
    ctx.fillStyle = 'rgba(134, 189, 150, 0.42)';
    ctx.beginPath();
    ctx.arc(0, -2, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawParadiseMonument(ctx, x, y, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.88, 0.88);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.0;

    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(0, -56);
    ctx.stroke();

    const wave = Math.sin(time * 5) * 1.5;
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.lineTo(26, -54 + wave);
    ctx.lineTo(26, -39 + wave);
    ctx.lineTo(0, -41);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(13, -47 + wave * 0.5, 3.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-32, -4);
    ctx.lineTo(0, -26);
    ctx.lineTo(32, -4);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeRect(-24, -4, 48, 32);
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-8, 28);
    ctx.moveTo(8, -4);
    ctx.lineTo(8, 28);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-32, 28);
    ctx.lineTo(32, 28);
    ctx.stroke();

    ctx.font = 'bold 14px "Comic Neue", cursive, sans-serif';
    ctx.fillStyle = '#2d6a4f';
    ctx.textAlign = 'center';
    ctx.fillText('The Paradise', 0, 46);
    ctx.restore();
  }

  loop(now) {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    const sec = now / 1000;

    this.update(dt, sec);
    this.render2D(sec);

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.ParadiseCharacters.initSprites();
  window.paradiseControls = new ParadiseControls();
  window.paradiseGame = new ParadiseGame();
});
