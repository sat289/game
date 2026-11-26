/* =========================================================
   Core Cricket Batting Gameplay, Physics & Timing Engine
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
      groundY: 660,
      stumpsX: 222,
      batsmanX: 332,
      sweetSpotX: 382,

      // Match Rules & Live Score
      initialTarget: 24,
      targetRemaining: 24,
      runsScored: 0,
      ballsTotal: 12,
      ballsLeft: 12,
      wicketsTotal: 2,
      wicketsLeft: 2,
      wicketsLost: 0,
      fours: 0,
      sixes: 0,
      matchOver: false,

      // Countdown & Delivery Sequencing
      countdown: 3.0,
      lastCountdownInt: 3,
      betweenBallsTimer: 0,
      delivery: null,

      // Batsman Animation
      batsmanFrame: 0,      // 0: stance, 1: backlift, 2: contact, 3: follow, 4: bowled
      swingTimer: 0,
      swingActive: false,
      swingLocked: false,   // 1 swing per delivery

      // Ball Object
      ball: {
        visible: false,
        phase: 'idle',      // idle | bowled | hit | dead
        x: 1180,
        y: 520,
        vx: 0,
        vy: 0,
        gravity: 1650,
        radius: 14,
        rotation: 0,
        bounced: false,
        bounceRestitution: 0.65,
        trail: [],
        trailColor: 'rgba(255, 255, 255, ALPHA)',
        plannedRuns: 0,
        scoredHit: false
      },

      // Stumps Break Physics
      stumpsBroken: false,
      brokenPieces: [],

      // Juice & VFX
      highlightedZone: null,
      zoneFlashTimer: 0,
      calloutText: '',
      calloutSub: '',
      calloutColor: '#ffffff',
      calloutTimer: 0,
      calloutMax: 1.3,
      shakeTime: 0,
      shakeMag: 0,
      flashAlpha: 0,
      flashColor: 'rgba(255, 255, 255, ALPHA)',
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
    this.state.countdown = 3.0;
    this.state.lastCountdownInt = 4;

    this.paused = false;
    this.running = true;
    this.cb.onHudUpdate(this.state, '');
    this.cb.onDeliveryChange(null);

    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame((ts) => this.loop(ts));
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  setPaused(val) {
    this.paused = val;
    if (!val && this.running) {
      this.lastTs = performance.now();
    }
  }

  // Called when player taps screen / clicks canvas / presses Space
  triggerSwing() {
    const s = this.state;
    if (!this.running || this.paused || s.matchOver) return;
    if (s.countdown > 0) return;
    if (s.swingLocked) return;

    s.swingLocked = true;
    s.swingActive = true;
    s.swingTimer = 0.44;
    s.batsmanFrame = 1;
    soundEngine.playSwingWhoosh();

    // Evaluate bat-ball contact immediately if ball is in flight
    if (s.ball.phase === 'bowled') {
      const dx = s.ball.x - s.sweetSpotX; // positive = early (ball still ahead), negative = late

      // Generous, crisp arcade hitting window: -62px (late) to +118px (early)
      if (dx >= -62 && dx <= 118) {
        this.resolveHit(dx);
      } else if (dx > 118 && dx <= 190) {
        // Swung way too early!
        this.showCallout('TOO EARLY!', 'WAIT FOR THE BOUNCE', '#ff8787', 0.85);
      }
    }
  }

  resolveHit(dx) {
    const s = this.state;
    const b = s.ball;
    b.phase = 'hit';
    b.scoredHit = true;
    s.batsmanFrame = 2;

    // Timing accuracy: 0 = dead center sweet spot!
    const absOffset = Math.abs(dx - 8);
    let runs = 1;
    let timingLabel = 'EDGE';
    let callout = '1 RUN';
    let calloutCol = '#ffffff';
    let launchDeg = 18;
    let launchSpeed = 860;

    if (absOffset <= 18) {
      runs = 6;
      timingLabel = 'PERFECT TIMING!';
      callout = 'MASSIVE SIX!';
      calloutCol = '#FFD43B';
      launchDeg = -52;
      launchSpeed = 1320;
      b.trailColor = 'rgba(255, 212, 59, ALPHA)';
    } else if (absOffset <= 36) {
      runs = 4;
      timingLabel = 'CRACKING SHOT!';
      callout = 'FOUR!';
      calloutCol = '#38D9F5';
      launchDeg = -32;
      launchSpeed = 1220;
      b.trailColor = 'rgba(56, 217, 245, ALPHA)';
    } else if (absOffset <= 56) {
      runs = 3;
      timingLabel = 'GREAT TIMING';
      callout = '3 RUNS';
      calloutCol = '#69DB7C';
      launchDeg = -13;
      launchSpeed = 1080;
      b.trailColor = 'rgba(105, 219, 124, ALPHA)';
    } else if (absOffset <= 78) {
      runs = 2;
      timingLabel = 'GOOD SHOT';
      callout = '2 RUNS';
      calloutCol = '#FFA94D';
      launchDeg = 4;
      launchSpeed = 980;
      b.trailColor = 'rgba(255, 169, 77, ALPHA)';
    } else {
      runs = 1;
      timingLabel = dx > 0 ? 'SLIGHTLY EARLY' : 'SLIGHTLY LATE';
      callout = '1 RUN';
      calloutCol = '#E9ECEF';
      launchDeg = 20;
      launchSpeed = 880;
      b.trailColor = 'rgba(255, 255, 255, ALPHA)';
    }

    const rad = (launchDeg * Math.PI) / 180;
    b.vx = Math.cos(rad) * launchSpeed;
    b.vy = Math.sin(rad) * launchSpeed;
    b.gravity = runs >= 6 ? 420 : runs >= 4 ? 540 : 880;
    b.plannedRuns = runs;
    b.trail = [{ x: b.x, y: b.y }];

    // Update score immediately on clean connection (with visual confirmation as ball crosses arc)
    s.runsScored += runs;
    s.targetRemaining = Math.max(0, s.targetRemaining - runs);
    s.ballsLeft = Math.max(0, s.ballsLeft - 1);
    if (runs === 4) s.fours++;
    if (runs === 6) s.sixes++;

    s.highlightedZone = runs;
    s.zoneFlashTimer = 1.25;
    s.shakeTime = runs >= 6 ? 0.28 : runs >= 4 ? 0.16 : 0.08;
    s.shakeMag = runs >= 6 ? 12 : runs >= 4 ? 7 : 3;

    if (runs >= 6) {
      s.flashAlpha = 0.25;
      s.flashColor = 'rgba(255, 212, 59, ALPHA)';
      this.spawnParticles(b.x, b.y, 26, ['#FFD43B', '#ffffff', '#FF7A00'], 'circle');
      this.spawnConfetti(42);
    } else if (runs === 4) {
      s.flashAlpha = 0.16;
      s.flashColor = 'rgba(56, 217, 245, ALPHA)';
      this.spawnParticles(b.x, b.y, 18, ['#38D9F5', '#ffffff'], 'circle');
    } else {
      this.spawnParticles(b.x, b.y, 10, ['#ffffff', '#ffe066'], 'circle');
    }

    soundEngine.playBatHit(runs);
    this.showCallout(callout, timingLabel, calloutCol, 1.15);
    this.cb.onHudUpdate(s, String(runs));

    // Check immediate match win!
    if (s.targetRemaining <= 0) {
      this.scheduleMatchEnd(true, 1.15);
    } else if (s.ballsLeft <= 0) {
      this.scheduleMatchEnd(false, 1.25);
    }
  }

  resolveBowled() {
    const s = this.state;
    const b = s.ball;
    b.phase = 'dead';
    b.vx = -220;
    b.vy = -190;

    s.stumpsBroken = true;
    s.batsmanFrame = 4;
    s.wicketsLeft = Math.max(0, s.wicketsLeft - 1);
    s.wicketsLost++;
    s.ballsLeft = Math.max(0, s.ballsLeft - 1);

    // Create 3 flying stumps + 2 flying bails!
    s.brokenPieces = [
      { type: 'stump', x: s.stumpsX - 16, y: s.groundY - 62, vx: -180 - Math.random() * 140, vy: -360 - Math.random() * 160, angle: 0, vAng: -7.5, w: 22, h: 112 },
      { type: 'stump', x: s.stumpsX,      y: s.groundY - 62, vx: -260 - Math.random() * 150, vy: -450 - Math.random() * 180, angle: 0, vAng: 9.2,  w: 22, h: 112 },
      { type: 'stump', x: s.stumpsX + 16, y: s.groundY - 62, vx: -130 - Math.random() * 120, vy: -290 - Math.random() * 140, angle: 0, vAng: -5.4, w: 22, h: 112 },
      { type: 'bail',  x: s.stumpsX - 10, y: s.groundY - 122, vx: -220 - Math.random() * 180, vy: -520 - Math.random() * 140, angle: 0, vAng: 14.0, w: 30, h: 12 },
      { type: 'bail',  x: s.stumpsX + 10, y: s.groundY - 122, vx: -160 - Math.random() * 180, vy: -560 - Math.random() * 140, angle: 0, vAng: -13.0, w: 30, h: 12 }
    ];

    s.shakeTime = 0.35;
    s.shakeMag = 14;
    s.flashAlpha = 0.32;
    s.flashColor = 'rgba(229, 37, 46, ALPHA)';
    this.spawnParticles(s.stumpsX, s.groundY - 70, 22, ['#ff4757', '#FFD43B', '#ffffff'], 'circle');

    soundEngine.playBowled();
    this.showCallout('BOWLED!', 'CLEAN THROUGH THE GATE!', '#ff4757', 1.35);
    this.cb.onHudUpdate(s, 'OUT');

    if (s.wicketsLeft <= 0 || s.ballsLeft <= 0) {
      this.scheduleMatchEnd(false, 1.45);
    } else {
      s.betweenBallsTimer = 1.65;
    }
  }

  scheduleMatchEnd(won, delaySec) {
    const s = this.state;
    s.matchOver = true;
    setTimeout(() => {
      if (!this.running) return;
      soundEngine.playMatchResult(won);
      if (won) this.spawnConfetti(70);
      this.cb.onMatchEnd(won, {
        runsScored: s.runsScored,
        wicketsLost: s.wicketsLost,
        ballsUsed: s.ballsTotal - s.ballsLeft,
        fours: s.fours,
        sixes: s.sixes,
        target: s.initialTarget
      });
    }, delaySec * 1000);
  }

  bowlNextBall() {
    const s = this.state;
    if (s.matchOver || s.ballsLeft <= 0 || s.wicketsLeft <= 0) return;

    // Pick a varied delivery scaled slightly by opponent bowling strength
    const pool = CWC_CONFIG.DELIVERY_TYPES;
    const d = pool[Math.floor(Math.random() * pool.length)];
    const spdFactor = 0.94 + Math.random() * 0.14 + (s.oppTeam.strength - 1) * 0.35;
    const speed = d.speed * spdFactor;
    const kmh = Math.round(d.kmhMin + Math.random() * (d.kmhMax - d.kmhMin));

    s.delivery = { name: d.name, kmh };
    this.cb.onDeliveryChange(s.delivery);

    s.stumpsBroken = false;
    s.brokenPieces = [];
    s.batsmanFrame = 0;
    s.swingLocked = false;
    s.swingActive = false;

    const b = s.ball;
    b.visible = true;
    b.phase = 'bowled';
    b.x = 1210;
    b.y = 485 + Math.random() * 24;
    b.vx = -speed;
    // Aim pitch bounce naturally at bounceX
    const timeToBounce = Math.max(0.32, (b.x - d.bounceX) / speed);
    const dy = (s.groundY - b.radius) - b.y;
    b.gravity = d.gravity;
    b.vy = (dy - 0.5 * b.gravity * timeToBounce * timeToBounce) / timeToBounce;
    b.bounced = false;
    b.bounceRestitution = d.bounceHeight;
    b.trail = [];
    b.trailColor = 'rgba(255, 240, 220, ALPHA)';
    b.scoredHit = false;
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
      const spd = 120 + Math.random() * 440;
      this.state.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 90,
        gravity: 780,
        size: 4 + Math.random() * 6,
        color: colors[i % colors.length],
        shape,
        rot: Math.random() * 6.28,
        vRot: (Math.random() - 0.5) * 10,
        life: 0.55 + Math.random() * 0.45,
        maxLife: 1.0
      });
    }
  }

  spawnConfetti(count) {
    const colors = ['#FFD43B', '#38D9F5', '#ff4757', '#69DB7C', '#ffffff', '#FF7A00'];
    for (let i = 0; i < count; i++) {
      this.state.particles.push({
        x: 200 + Math.random() * 880,
        y: -20 - Math.random() * 140,
        vx: (Math.random() - 0.5) * 180,
        vy: 140 + Math.random() * 240,
        gravity: 220,
        size: 8 + Math.random() * 8,
        color: colors[i % colors.length],
        shape: 'rect',
        rot: Math.random() * 6.28,
        vRot: (Math.random() - 0.5) * 12,
        life: 1.8 + Math.random() * 1.1,
        maxLife: 2.8
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

    // Timers & Juice Decay
    if (s.shakeTime > 0) s.shakeTime = Math.max(0, s.shakeTime - dt);
    if (s.flashAlpha > 0) s.flashAlpha = Math.max(0, s.flashAlpha - dt * 0.85);
    if (s.zoneFlashTimer > 0) s.zoneFlashTimer = Math.max(0, s.zoneFlashTimer - dt);
    if (s.calloutTimer > 0) s.calloutTimer = Math.max(0, s.calloutTimer - dt);

    // 1. Pre-match 3-2-1 Countdown
    if (s.countdown > 0) {
      s.countdown = Math.max(0, s.countdown - dt);
      const curInt = Math.ceil(s.countdown);
      if (curInt < s.lastCountdownInt && curInt > 0) {
        s.lastCountdownInt = curInt;
        soundEngine.playCountdown(false);
      }
      if (s.countdown === 0) {
        soundEngine.playCountdown(true);
        this.bowlNextBall();
      }
      return;
    }

    // 2. Batsman Swing Frame Sequence
    if (s.swingActive) {
      s.swingTimer -= dt;
      if (s.swingTimer > 0.34) {
        s.batsmanFrame = 1; // Backlift
      } else if (s.swingTimer > 0.22) {
        s.batsmanFrame = 2; // Power Contact
      } else if (s.swingTimer > 0.0) {
        s.batsmanFrame = 3; // Lofted Follow-Through
      } else {
        s.swingActive = false;
        if (!s.stumpsBroken) s.batsmanFrame = 0;
      }
    }

    // 3. Between-Balls Delay
    if (s.betweenBallsTimer > 0) {
      s.betweenBallsTimer -= dt;
      if (s.betweenBallsTimer <= 0 && !s.matchOver) {
        this.bowlNextBall();
      }
    }

    // 4. Ball Physics
    const b = s.ball;
    if (b.visible && b.phase !== 'idle') {
      b.x += b.vx * dt;
      b.vy += b.gravity * dt;
      b.y += b.vy * dt;
      b.rotation += (b.vx / 28) * dt;

      // Record trail
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 18) b.trail.shift();

      // Pitch Bounce
      if (b.y >= s.groundY - b.radius) {
        b.y = s.groundY - b.radius;
        if (b.phase === 'bowled') {
          if (!b.bounced) {
            b.bounced = true;
            b.vy = -Math.abs(b.vy) * b.bounceRestitution;
            // Subtle turf dust puff on pitch bounce
            this.spawnParticles(b.x, s.groundY, 5, ['#d9c698', '#bfa972'], 'circle');
          } else {
            b.vy = -Math.abs(b.vy) * 0.45;
          }
        } else {
          b.vy = -Math.abs(b.vy) * 0.52;
        }
      }

      // Check Stumps Collision (Bowled!)
      if (b.phase === 'bowled' && b.x <= s.stumpsX + 20) {
        if (b.y >= s.groundY - 135) {
          this.resolveBowled();
        } else if (b.x < -30) {
          // High bouncer passed over stumps -> Dot ball
          b.phase = 'dead';
          b.visible = false;
          s.ballsLeft = Math.max(0, s.ballsLeft - 1);
          this.showCallout('DOT BALL', 'MISSED THE BOUNCER', '#ced4da', 0.95);
          this.cb.onHudUpdate(s, '0');
          if (s.ballsLeft <= 0) {
            this.scheduleMatchEnd(false, 1.1);
          } else {
            s.betweenBallsTimer = 1.05;
          }
        }
      }

      // Check Hit Ball Exiting Right Side (after crossing run arc)
      if (b.phase === 'hit' && (b.x > CWC_CONFIG.VIRTUAL_W + 70 || b.y < -120)) {
        b.phase = 'idle';
        b.visible = false;
        if (!s.matchOver) {
          s.betweenBallsTimer = 0.85;
        }
      }

      // Dead ball off-screen cleanup
      if (b.phase === 'dead' && b.x < -80) {
        b.visible = false;
      }
    }

    // 5. Broken Stumps & Bails Physics
    if (s.stumpsBroken) {
      s.brokenPieces.forEach((p) => {
        p.x += p.vx * dt;
        p.vy += 1450 * dt;
        p.y += p.vy * dt;
        p.angle += p.vAng * dt;
        if (p.y > s.groundY) {
          p.y = s.groundY;
          p.vy = -Math.abs(p.vy) * 0.35;
          p.vx *= 0.72;
          p.vAng *= 0.65;
        }
      });
    }

    // 6. Particles Update
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
