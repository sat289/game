/* =========================================================
   Pro Cricket Gameplay Engine (v3 — Bug-Fixed Batting Physics)
   - Zero swing-lock bugs: bat always swings cleanly on tap!
   - Strict front-only strike zone [348 .. 468]: balls behind batsman NEVER get hit!
   - Instant blade-to-ball contact sync + exact arc ballistics
   ========================================================= */

class CricketMatchEngine {
  constructor(renderer, callbacks) {
    this.renderer = renderer;
    this.cb = callbacks;
    this.rafId = null;
    this.lastTs = 0;
    this.running = false;
    this.paused = false;

    this.state = this.createEmptyState();
  }

  createEmptyState() {
    return {
      elapsed: 0,
      playerTeam: CWC_CONFIG.TEAMS[0],
      oppTeam: CWC_CONFIG.TEAMS[7],
      groundY: 656,
      stumpsX: 214,
      batsmanX: 320,

      // STRICT FRONT-ONLY STRIKE ZONE (Never behind the batsman!)
      strikeMinX: 348,
      sweetSpotX: 400,
      strikeMaxX: 468,

      initialTarget: 24,
      targetRemaining: 24,
      runsScored: 0,
      ballsTotal: 12,
      ballsLeft: 12,
      ballsBowled: 0,
      wicketsTotal: 2,
      wicketsLeft: 2,
      wicketsLost: 0,
      fours: 0,
      sixes: 0,
      recentBalls: [],
      matchOver: false,

      countdown: 3.0,
      lastCountdownInt: 4,
      betweenBallsTimer: 0,
      hitStopTimer: 0,
      cameraZoom: 1.0,
      targetZoom: 1.0,
      delivery: null,

      bowler: {
        visible: true,
        phase: 'idle',
        x: 1175,
        jumpY: 0,
        runCycle: 0,
        armAngle: 1.1,
        holdingBall: true,
        phaseTime: 0
      },

      // Responsive Batsman Swing State (NO PERMANENT SWING LOCK!)
      swingActive: false,
      swingElapsed: 0,
      swingDuration: 0.36,
      hitConnectedThisSwing: false,
      backliftBlend: 0,

      umpireSignal: 'idle',
      umpireTimer: 0,

      ball: {
        visible: false,
        phase: 'idle',
        x: 1050,
        prevX: 1050,
        y: 520,
        vx: 0,
        vy: 0,
        gravity: 1480,
        radius: 13.5,
        rotation: 0,
        bounced: false,
        bounceRest: 0.62,
        trail: [],
        trailColor: 'rgba(255, 255, 255, ALPHA)',
        plannedRuns: 0,
        arcScored: false
      },

      stumpsBroken: false,
      brokenPieces: [],

      highlightedZone: null,
      zoneFlashTimer: 0,
      calloutText: '',
      calloutSub: '',
      calloutColor: '#ffffff',
      calloutTimer: 0,
      calloutMax: 1.25,
      shakeTime: 0,
      shakeMag: 0,
      flashAlpha: 0,
      flashColor: 'rgba(255, 255, 255, ALPHA)',
      shockwaves: [],
      particles: []
    };
  }

  startMatch(playerTeam, oppTeam, overs, targetScore) {
    const mode = CWC_CONFIG.OVERS_MODES[overs] || CWC_CONFIG.OVERS_MODES[2];
    this.state = this.createEmptyState();
    this.state.playerTeam = playerTeam;
    this.state.oppTeam = oppTeam;
    this.state.initialTarget = targetScore;
    this.state.targetRemaining = targetScore;
    this.state.ballsTotal = mode.balls;
    this.state.ballsLeft = mode.balls;
    this.state.wicketsTotal = mode.wickets;
    this.state.wicketsLeft = mode.wickets;

    this.paused = false;
    this.running = true;
    soundEngine.startAmbience();
    this.cb.onHudUpdate(this.state, '');
    this.cb.onDeliveryChange(null);

    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame((ts) => this.loop(ts));
  }

  stop() {
    this.running = false;
    soundEngine.stopAmbience();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  setPaused(val) {
    this.paused = val;
    if (!val && this.running) {
      this.lastTs = performance.now();
    }
  }

  triggerSwing() {
    const s = this.state;
    if (!this.running || this.paused || s.matchOver) return;
    if (s.countdown > 0) return;

    // Only block while a swing is currently mid-motion, or after stumps broke / ball already hit
    if (s.swingActive || s.stumpsBroken || s.ball.phase === 'hit') return;

    s.swingActive = true;
    s.swingElapsed = 0;
    s.hitConnectedThisSwing = false;
    soundEngine.playSwingWhoosh();

    // If the ball ALREADY passed behind the batsman (< 348), bat swings cleanly & whiffs!
    if (s.ball.phase === 'bowled' && s.ball.x < s.strikeMinX) {
      this.showCallout('TOO LATE!', 'BALL PASSED THE BAT', '#ff6b6b', 0.8);
      return;
    }

    this.checkBatBallCollision();
  }

  checkBatBallCollision() {
    const s = this.state;
    const b = s.ball;
    if (!s.swingActive || s.hitConnectedThisSwing || b.phase !== 'bowled') return;

    // Active blade contact window strictly synced with forward whip (0.00s -> 0.16s)
    if (s.swingElapsed > 0.16) return;

    // HARD GUARD: NEVER hit any ball that has passed behind the batsman (x < 348)!
    if (b.x < s.strikeMinX) return;

    // Ensure ball is within hittable vertical reach
    if (b.y < s.groundY - 185) return;

    const minBallX = Math.min(b.x, b.prevX);
    const maxBallX = Math.max(b.x, b.prevX);

    if (maxBallX >= s.strikeMinX && minBallX <= s.strikeMaxX) {
      const contactX = Math.max(s.strikeMinX, Math.min(s.strikeMaxX, b.x));
      const dx = contactX - s.sweetSpotX;
      this.resolveHit(dx);
    }
  }

  resolveHit(dx) {
    const s = this.state;
    const b = s.ball;
    s.hitConnectedThisSwing = true;
    b.phase = 'hit';
    b.arcScored = false;

    // Snap bat visually to the exact contact frame so blade physically strikes the ball!
    if (s.swingElapsed < 0.09) {
      s.swingElapsed = 0.09;
    }

    const absDx = Math.abs(dx);
    let runs = 1;
    let timingLabel = 'DEFENSIVE PUSH';
    let callout = '1 RUN';
    let calloutCol = '#E9ECEF';
    let trailCol = 'rgba(255, 255, 255, ALPHA)';

    if (absDx <= 20) {
      runs = 6;
      timingLabel = 'PERFECT SWEET SPOT!';
      callout = 'MASSIVE SIX!';
      calloutCol = '#FFD43B';
      trailCol = 'rgba(255, 212, 59, ALPHA)';
    } else if (absDx <= 36) {
      runs = 4;
      timingLabel = 'CRACKING COVER DRIVE!';
      callout = 'SUPER FOUR!';
      calloutCol = '#38D9F5';
      trailCol = 'rgba(56, 217, 245, ALPHA)';
    } else if (absDx <= 48) {
      runs = 3;
      timingLabel = 'GREAT TIMING!';
      callout = '3 RUNS!';
      calloutCol = '#69DB7C';
      trailCol = 'rgba(105, 219, 124, ALPHA)';
    } else if (absDx <= 58) {
      runs = 2;
      timingLabel = 'GOOD PLACEMENT';
      callout = '2 RUNS';
      calloutCol = '#FFA94D';
      trailCol = 'rgba(255, 169, 77, ALPHA)';
    } else {
      runs = 1;
      timingLabel = dx > 0 ? 'EARLY SHOT' : 'LATE EDGE';
      callout = '1 RUN';
      calloutCol = '#E9ECEF';
      trailCol = 'rgba(255, 255, 255, ALPHA)';
    }

    const zone = CWC_CONFIG.ARC_ZONES.find((z) => z.runs === runs) || CWC_CONFIG.ARC_ZONES[4];
    const midDeg = (zone.startDeg + zone.endDeg) * 0.5 + (Math.random() - 0.5) * 3.5;
    const midRad = (midDeg * Math.PI) / 180;
    const targetX = CWC_CONFIG.ARC.cx + Math.cos(midRad) * CWC_CONFIG.ARC.radius;
    const targetY = CWC_CONFIG.ARC.cy + Math.sin(midRad) * CWC_CONFIG.ARC.radius;

    const flightTime = runs >= 6 ? 0.50 : runs >= 4 ? 0.55 : 0.62;
    const gHit = runs >= 6 ? 640 : runs >= 4 ? 760 : 940;
    b.gravity = gHit;
    b.vx = (targetX - b.x) / flightTime;
    b.vy = (targetY - b.y - 0.5 * gHit * flightTime * flightTime) / flightTime;
    b.plannedRuns = runs;
    b.trail = [{ x: b.x, y: b.y }];
    b.trailColor = trailCol;

    soundEngine.playBatHit(runs);
    s.hitStopTimer = runs >= 6 ? 0.04 : runs >= 4 ? 0.025 : 0.01;
    s.shakeTime = runs >= 6 ? 0.28 : runs >= 4 ? 0.16 : 0.08;
    s.shakeMag = runs >= 6 ? 12 : runs >= 4 ? 7 : 3;
    s.targetZoom = runs >= 6 ? 1.045 : 1.02;

    s.shockwaves.push({
      x: b.x, y: b.y, r: 10, maxR: runs >= 6 ? 115 : 70,
      color: trailCol, life: 0.30, maxLife: 0.30
    });
    this.spawnParticles(b.x, b.y, runs >= 6 ? 26 : 14, [calloutCol, '#ffffff'], 'circle');

    s.pendingHitInfo = { runs, callout, timingLabel, calloutCol };
  }

  finalizeArcScore(hitX, hitY) {
    const s = this.state;
    const b = s.ball;
    if (b.arcScored) return;
    b.arcScored = true;

    const info = s.pendingHitInfo || { runs: b.plannedRuns, callout: b.plannedRuns + ' RUNS', timingLabel: '', calloutCol: '#ffffff' };
    const runs = info.runs;

    s.runsScored += runs;
    s.targetRemaining = Math.max(0, s.targetRemaining - runs);
    s.ballsLeft = Math.max(0, s.ballsLeft - 1);
    s.ballsBowled++;
    s.recentBalls.push(String(runs));
    if (s.recentBalls.length > 6) s.recentBalls.shift();
    if (runs === 4) s.fours++;
    if (runs === 6) s.sixes++;

    s.highlightedZone = runs;
    s.zoneFlashTimer = 1.3;
    s.targetZoom = 1.0;

    if (runs >= 6) {
      s.umpireSignal = 'six';
      s.umpireTimer = 1.6;
      s.flashAlpha = 0.24;
      s.flashColor = 'rgba(255, 212, 59, ALPHA)';
      this.spawnConfetti(48);
    } else if (runs === 4) {
      s.umpireSignal = 'four';
      s.umpireTimer = 1.5;
      s.flashAlpha = 0.16;
      s.flashColor = 'rgba(56, 217, 245, ALPHA)';
    }

    s.shockwaves.push({
      x: hitX, y: hitY, r: 12, maxR: runs >= 4 ? 130 : 80,
      color: b.trailColor, life: 0.38, maxLife: 0.38
    });
    this.spawnParticles(hitX, hitY, runs >= 4 ? 24 : 12, [info.calloutCol, '#ffffff'], 'circle');

    soundEngine.playZoneScore(runs);
    this.showCallout(info.callout, info.timingLabel, info.calloutCol, 1.2);
    this.cb.onHudUpdate(s, String(runs));

    if (s.targetRemaining <= 0) {
      this.scheduleMatchEnd(true, 1.1);
    } else if (s.ballsLeft <= 0) {
      this.scheduleMatchEnd(false, 1.2);
    }
  }

  resolveBowled() {
    const s = this.state;
    const b = s.ball;
    b.phase = 'dead';
    b.vx = -220;
    b.vy = -195;

    s.stumpsBroken = true;
    s.swingActive = false;
    s.wicketsLeft = Math.max(0, s.wicketsLeft - 1);
    s.wicketsLost++;
    s.ballsLeft = Math.max(0, s.ballsLeft - 1);
    s.ballsBowled++;
    s.recentBalls.push('W');
    if (s.recentBalls.length > 6) s.recentBalls.shift();

    s.umpireSignal = 'out';
    s.umpireTimer = 1.8;

    s.brokenPieces = [
      { type: 'stump', x: s.stumpsX - 15, y: s.groundY - 62, vx: -180 - Math.random() * 140, vy: -370 - Math.random() * 150, angle: 0, vAng: -7.5, w: 22, h: 112 },
      { type: 'stump', x: s.stumpsX,      y: s.groundY - 62, vx: -270 - Math.random() * 140, vy: -460 - Math.random() * 160, angle: 0, vAng: 9.2,  w: 22, h: 112 },
      { type: 'stump', x: s.stumpsX + 15, y: s.groundY - 62, vx: -135 - Math.random() * 110, vy: -300 - Math.random() * 140, angle: 0, vAng: -5.5, w: 22, h: 112 },
      { type: 'bail',  x: s.stumpsX - 10, y: s.groundY - 122, vx: -220 - Math.random() * 160, vy: -520 - Math.random() * 140, angle: 0, vAng: 14.5, w: 34, h: 15 },
      { type: 'bail',  x: s.stumpsX + 10, y: s.groundY - 122, vx: -165 - Math.random() * 160, vy: -560 - Math.random() * 140, angle: 0, vAng: -13.5, w: 34, h: 15 }
    ];

    s.hitStopTimer = 0.04;
    s.shakeTime = 0.36;
    s.shakeMag = 15;
    s.flashAlpha = 0.30;
    s.flashColor = 'rgba(230, 38, 48, ALPHA)';
    s.targetZoom = 1.035;
    this.spawnParticles(s.stumpsX, s.groundY - 72, 26, ['#ff4757', '#FFD43B', '#ffffff'], 'circle');

    soundEngine.playBowled();
    this.showCallout('BOWLED!', 'LED STUMPS SHATTERED!', '#ff4757', 1.35);
    this.cb.onHudUpdate(s, 'OUT');

    if (s.wicketsLeft <= 0 || s.ballsLeft <= 0) {
      this.scheduleMatchEnd(false, 1.45);
    } else {
      s.betweenBallsTimer = 1.7;
    }
  }

  scheduleMatchEnd(won, delaySec) {
    const s = this.state;
    s.matchOver = true;
    setTimeout(() => {
      if (!this.running) return;
      soundEngine.playMatchResult(won);
      if (won) this.spawnConfetti(75);
      this.cb.onMatchEnd(won, {
        runsScored: s.runsScored,
        wicketsLost: s.wicketsLost,
        ballsUsed: s.ballsBowled,
        fours: s.fours,
        sixes: s.sixes,
        target: s.initialTarget
      });
    }, delaySec * 1000);
  }

  startBowlerRunUp() {
    const s = this.state;
    if (s.matchOver || s.ballsLeft <= 0 || s.wicketsLeft <= 0) return;

    const pool = CWC_CONFIG.DELIVERY_TYPES;
    const d = pool[Math.floor(Math.random() * pool.length)];
    const spdFactor = 0.95 + Math.random() * 0.10 + (s.oppTeam.strength - 1) * 0.22;
    const speed = d.speed * spdFactor;
    const kmh = Math.round(d.kmhMin + Math.random() * (d.kmhMax - d.kmhMin));

    s.delivery = {
      name: d.name,
      kmh,
      speed,
      bounceX: d.bounceX + (Math.random() - 0.5) * 28,
      bounceRest: d.bounceRest,
      gravity: d.gravity,
      bowlerName: s.oppTeam.bowler
    };
    this.cb.onDeliveryChange(s.delivery);

    s.stumpsBroken = false;
    s.brokenPieces = [];
    s.swingActive = false;
    s.hitConnectedThisSwing = false;
    s.backliftBlend = 0;
    s.targetZoom = 1.02;

    const bw = s.bowler;
    bw.visible = true;
    bw.phase = 'runup';
    bw.x = 1235;
    bw.jumpY = 0;
    bw.runCycle = 0;
    bw.armAngle = 0.8;
    bw.holdingBall = true;
    bw.phaseTime = 0;

    s.ball.visible = false;
    s.ball.phase = 'idle';
  }

  releaseBallFromBowler(rx, ry) {
    const s = this.state;
    const d = s.delivery;
    const b = s.ball;

    b.visible = true;
    b.phase = 'bowled';
    b.x = rx;
    b.prevX = rx;
    b.y = ry;
    b.vx = -d.speed;

    const tBounce = Math.max(0.32, (b.x - d.bounceX) / d.speed);
    const dy = (s.groundY - b.radius) - b.y;
    b.gravity = d.gravity;
    b.vy = (dy - 0.5 * b.gravity * tBounce * tBounce) / tBounce;
    b.bounced = false;
    b.bounceRest = d.bounceRest;
    b.trail = [{ x: rx, y: ry }];
    b.trailColor = 'rgba(255, 240, 225, ALPHA)';
    b.arcScored = false;
  }

  showCallout(text, sub, color, duration) {
    const s = this.state;
    s.calloutText = text;
    s.calloutSub = sub || '';
    s.calloutColor = color;
    s.calloutTimer = duration;
    s.calloutMax = duration;
  }

  spawnParticles(x, y, count, colors, shape) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 110 + Math.random() * 440;
      this.state.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 90,
        gravity: 780,
        size: 3.5 + Math.random() * 5.5,
        color: colors[i % colors.length],
        shape,
        rot: Math.random() * 6.28,
        vRot: (Math.random() - 0.5) * 10,
        life: 0.5 + Math.random() * 0.45,
        maxLife: 0.95
      });
    }
  }

  spawnConfetti(count) {
    const colors = ['#FFD43B', '#38D9F5', '#ff4757', '#69DB7C', '#ffffff', '#FF7A00'];
    for (let i = 0; i < count; i++) {
      this.state.particles.push({
        x: 160 + Math.random() * 960,
        y: -20 - Math.random() * 140,
        vx: (Math.random() - 0.5) * 190,
        vy: 150 + Math.random() * 250,
        gravity: 210,
        size: 8 + Math.random() * 8,
        color: colors[i % colors.length],
        shape: 'rect',
        rot: Math.random() * 6.28,
        vRot: (Math.random() - 0.5) * 12,
        life: 1.9 + Math.random() * 1.1,
        maxLife: 3.0
      });
    }
  }

  loop(ts) {
    if (!this.running) return;
    const rawDt = (ts - this.lastTs) / 1000;
    this.lastTs = ts;
    const dt = Math.min(rawDt, 0.05);

    if (!this.paused) {
      this.update(dt);
    }
    this.renderer.render(this.state);
    this.rafId = requestAnimationFrame((nextTs) => this.loop(nextTs));
  }

  update(dt) {
    const s = this.state;
    s.elapsed += dt;

    s.cameraZoom += (s.targetZoom - s.cameraZoom) * Math.min(1, dt * 6);

    if (s.hitStopTimer > 0) {
      s.hitStopTimer = Math.max(0, s.hitStopTimer - dt);
      return;
    }

    if (s.shakeTime > 0) s.shakeTime = Math.max(0, s.shakeTime - dt);
    if (s.flashAlpha > 0) s.flashAlpha = Math.max(0, s.flashAlpha - dt * 0.85);
    if (s.zoneFlashTimer > 0) s.zoneFlashTimer = Math.max(0, s.zoneFlashTimer - dt);
    if (s.calloutTimer > 0) s.calloutTimer = Math.max(0, s.calloutTimer - dt);
    if (s.umpireTimer > 0) {
      s.umpireTimer -= dt;
      if (s.umpireTimer <= 0) s.umpireSignal = 'idle';
    }

    // 1. Pre-Match 3-2-1 Countdown
    if (s.countdown > 0) {
      s.countdown = Math.max(0, s.countdown - dt);
      const curInt = Math.ceil(s.countdown);
      if (curInt < s.lastCountdownInt && curInt > 0) {
        s.lastCountdownInt = curInt;
        soundEngine.playCountdown(false);
      }
      if (s.countdown === 0) {
        soundEngine.playCountdown(true);
        this.startBowlerRunUp();
      }
      return;
    }

    // 2. Bowler Run-Up & Delivery Animation
    const bw = s.bowler;
    if (bw.phase === 'runup') {
      bw.phaseTime += dt;
      bw.x -= 285 * dt;
      bw.runCycle += 16 * dt;
      bw.armAngle = 0.7 + Math.sin(bw.runCycle) * 0.45;
      if (bw.x <= 1045) {
        bw.phase = 'release';
        bw.phaseTime = 0;
      }
    } else if (bw.phase === 'release') {
      bw.phaseTime += dt;
      const p = Math.min(1, bw.phaseTime / 0.24);
      bw.x -= 130 * dt;
      bw.jumpY = -Math.sin(p * Math.PI) * 26;
      bw.armAngle = 1.2 - p * 3.15;
      if (p >= 0.78 && bw.holdingBall) {
        bw.holdingBall = false;
        const releaseX = bw.x - 16;
        const releaseY = s.groundY + bw.jumpY - 168;
        this.releaseBallFromBowler(releaseX, releaseY);
      }
      if (p >= 1) {
        bw.phase = 'follow';
        bw.jumpY = 0;
        bw.phaseTime = 0;
      }
    } else if (bw.phase === 'follow') {
      bw.phaseTime += dt;
      const decel = Math.max(0, 1 - bw.phaseTime / 0.45);
      bw.x -= 150 * decel * dt;
      bw.runCycle += 12 * decel * dt;
      bw.armAngle = -1.95 - (1 - decel) * 0.65;
      if (bw.phaseTime >= 0.65) {
        bw.phase = 'idle';
      }
    }

    // 3. Smooth Ready Backlift Coil + Active Bat Swing Progress
    if (s.ball.phase === 'bowled' && !s.swingActive) {
      s.backliftBlend = Math.min(1, s.backliftBlend + dt * 4.5);
    }
    if (s.swingActive) {
      s.swingElapsed += dt;
      if (s.swingElapsed >= s.swingDuration) {
        s.swingActive = false;
      }
    }

    // 4. Between-Balls Delay
    if (s.betweenBallsTimer > 0) {
      s.betweenBallsTimer -= dt;
      if (s.betweenBallsTimer <= 0 && !s.matchOver) {
        s.targetZoom = 1.0;
        this.startBowlerRunUp();
      }
    }

    // 5. Ball Physics & Strict Front-Only Bat Collision
    const b = s.ball;
    if (b.visible && b.phase !== 'idle') {
      b.prevX = b.x;
      b.x += b.vx * dt;
      b.vy += b.gravity * dt;
      b.y += b.vy * dt;
      b.rotation += (b.vx / 26) * dt;

      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 20) b.trail.shift();

      if (b.phase === 'bowled') {
        this.checkBatBallCollision();
      }

      if (b.y >= s.groundY - b.radius) {
        b.y = s.groundY - b.radius;
        if (b.phase === 'bowled') {
          if (!b.bounced) {
            b.bounced = true;
            b.vy = -Math.abs(b.vy) * b.bounceRest;
            soundEngine.playPitchBounce();
            this.spawnParticles(b.x, s.groundY, 6, ['#decb9b', '#bda670'], 'circle');
          } else {
            b.vy = -Math.abs(b.vy) * 0.48;
          }
        } else {
          b.vy = -Math.abs(b.vy) * 0.56;
        }
      }

      if (b.phase === 'bowled') {
        if (b.x <= s.stumpsX + 20 && b.x >= s.stumpsX - 18 && b.y >= s.groundY - 134) {
          this.resolveBowled();
        } else if (b.x <= 132) {
          b.phase = 'dead';
          b.visible = false;
          s.ballsLeft = Math.max(0, s.ballsLeft - 1);
          s.ballsBowled++;
          s.recentBalls.push('•');
          if (s.recentBalls.length > 6) s.recentBalls.shift();
          this.showCallout('DOT BALL', 'COLLECTED BY KEEPER', '#ced4da', 1.0);
          this.cb.onHudUpdate(s, '0');
          if (s.ballsLeft <= 0) {
            this.scheduleMatchEnd(false, 1.15);
          } else {
            s.betweenBallsTimer = 1.05;
          }
        }
      }

      if (b.phase === 'hit') {
        const distFromArcCenter = Math.hypot(b.x - CWC_CONFIG.ARC.cx, b.y - CWC_CONFIG.ARC.cy);
        if (!b.arcScored && distFromArcCenter >= CWC_CONFIG.ARC.radius - 12 && b.x > 700) {
          this.finalizeArcScore(b.x, b.y);
        }
        if (b.x > CWC_CONFIG.VIRTUAL_W + 80 || b.y < -140) {
          if (!b.arcScored) this.finalizeArcScore(CWC_CONFIG.VIRTUAL_W - 80, Math.max(120, b.y));
          b.phase = 'idle';
          b.visible = false;
          if (!s.matchOver) s.betweenBallsTimer = 0.85;
        }
      }

      if (b.phase === 'dead' && b.x < -80) {
        b.visible = false;
      }
    }

    // 6. Broken LED Zing Stumps & Bails Physics
    if (s.stumpsBroken) {
      s.brokenPieces.forEach((p) => {
        p.x += p.vx * dt;
        p.vy += 1450 * dt;
        p.y += p.vy * dt;
        p.angle += p.vAng * dt;
        if (p.y > s.groundY) {
          p.y = s.groundY;
          p.vy = -Math.abs(p.vy) * 0.36;
          p.vx *= 0.72;
          p.vAng *= 0.65;
        }
      });
    }

    // 7. Shockwaves Update
    for (let i = s.shockwaves.length - 1; i >= 0; i--) {
      const sw = s.shockwaves[i];
      sw.life -= dt;
      if (sw.life <= 0) {
        s.shockwaves.splice(i, 1);
      } else {
        sw.r = sw.maxR * (1 - sw.life / sw.maxLife);
      }
    }

    // 8. Particles Update
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        s.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.vy += p.gravity * dt;
      p.y += p.vy * dt;
      p.rot += p.vRot * dt;
    }
  }
}

window.CricketMatchEngine = CricketMatchEngine;
