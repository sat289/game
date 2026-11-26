// Safe roundRect polyfill for older mobile WebViews
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rad = Array.isArray(r) ? r[0] : (r || 0);
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}

/* =========================================================
   60fps Smooth Articulated Skeletal Cricket Characters
   Batsman (Fluid Swing), Bowler (Run-Up + Windmill), Keeper & Umpire
   ========================================================= */

window.CharacterDrawer = (function () {
  function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }

  function shadeHex(hex, factor) {
    const c = hex.replace('#', '');
    const r = Math.min(255, Math.max(0, Math.round(parseInt(c.substr(0, 2), 16) * factor)));
    const g = Math.min(255, Math.max(0, Math.round(parseInt(c.substr(2, 2), 16) * factor)));
    const b = Math.min(255, Math.max(0, Math.round(parseInt(c.substr(4, 2), 16) * factor)));
    return `rgb(${r},${g},${b})`;
  }

  function drawLimb(ctx, x1, y1, x2, y2, w, fill, outline = '#121620') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = outline;
    ctx.lineWidth = w + 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = fill;
    ctx.lineWidth = w;
    ctx.stroke();
  }

  function drawPad(ctx, kx, ky, fx, fy, isFront, teamPrimary, teamSecondary) {
    const ang = Math.atan2(fy - ky, fx - kx);
    const len = Math.hypot(fx - kx, fy - ky);
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(ang);

    // 3D cylindrical shaded batting pad
    const grad = ctx.createLinearGradient(0, -13, 0, 13);
    grad.addColorStop(0, isFront ? '#ffffff' : '#dce2ee');
    grad.addColorStop(0.55, isFront ? '#edf1f8' : '#c4ccdc');
    grad.addColorStop(1, isFront ? '#c5cede' : '#9ca7bc');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#141926';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(-8, -12, len + 12, 24, 9);
    ctx.fill();
    ctx.stroke();

    // Knee roll & team trim straps
    ctx.strokeStyle = 'rgba(20,25,38,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, -11);
    ctx.lineTo(10, 11);
    ctx.stroke();

    ctx.fillStyle = teamPrimary;
    ctx.fillRect(len * 0.42, -11, 5, 22);
    ctx.fillStyle = teamSecondary;
    ctx.fillRect(len * 0.56, -11, 3.5, 22);
    ctx.restore();
  }

  function drawBoot(ctx, x, y, dir, accent) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.fillStyle = '#f8f9fc';
    ctx.strokeStyle = '#141926';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-10, -7, 29, 13, [4, 9, 4, 4]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.fillRect(-6, 1, 21, 3.5);
    ctx.restore();
  }

  function drawCricketBat(ctx, hx, hy, angleDeg, secColor, showTrail) {
    const rad = (angleDeg * Math.PI) / 180;

    // Broadcast motion-blur swing smear when swinging fast!
    if (showTrail) {
      ctx.save();
      for (let i = 1; i <= 5; i++) {
        const a = rad - i * 0.14;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(a) * 26, hy + Math.sin(a) * 26);
        ctx.lineTo(hx + Math.cos(a) * 104, hy + Math.sin(a) * 104);
        ctx.strokeStyle = `rgba(255, 238, 175, ${(0.34 - i * 0.06).toFixed(3)})`;
        ctx.lineWidth = 17 - i * 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(rad);

    // Rubber handle grip
    ctx.fillStyle = '#1e2430';
    ctx.strokeStyle = '#0e1118';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-2, -4, 30, 8, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = secColor;
    ctx.fillRect(6, -3.5, 9, 7);

    // Sculpted English Willow Blade with wood gradient & pro sticker
    const wood = ctx.createLinearGradient(26, -10, 26, 10);
    wood.addColorStop(0, '#f5d9a8');
    wood.addColorStop(0.5, '#e2b878');
    wood.addColorStop(1, '#ba8848');
    ctx.fillStyle = wood;
    ctx.strokeStyle = '#181c26';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(26, -7.5);
    ctx.lineTo(104, -10);
    ctx.quadraticCurveTo(110, 0, 104, 10);
    ctx.lineTo(26, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sweet-spot ridge & pro red/gold sticker
    ctx.strokeStyle = 'rgba(130, 82, 28, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(100, 0);
    ctx.stroke();

    ctx.fillStyle = '#d92632';
    ctx.fillRect(46, -6.5, 22, 13);
    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(54, -6.5, 6, 13);

    ctx.restore();
  }

  function drawHelmetHead(ctx, hx, hy, dir, team) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.scale(dir, 1);

    // Neck & lower face
    ctx.fillStyle = team.skin;
    ctx.strokeStyle = '#141926';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Focused eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(8, -1, 3.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141926';
    ctx.beginPath();
    ctx.arc(9, -1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Glossy Helmet Shell
    const hGrad = ctx.createRadialGradient(-5, -10, 2, 0, -4, 24);
    hGrad.addColorStop(0, shadeHex(team.helmet, 1.55));
    hGrad.addColorStop(0.6, team.helmet);
    hGrad.addColorStop(1, shadeHex(team.helmet, 0.65));

    ctx.fillStyle = hGrad;
    ctx.strokeStyle = '#10141e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-1, -4, 19.5, Math.PI * 0.92, Math.PI * 2.08);
    ctx.lineTo(14, 1);
    ctx.lineTo(-17, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Helmet Peak Visor
    ctx.beginPath();
    ctx.moveTo(10, -7);
    ctx.lineTo(29, -3);
    ctx.lineTo(25, 2);
    ctx.lineTo(10, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Team Crest Dot on front of helmet
    ctx.fillStyle = team.secondary;
    ctx.beginPath();
    ctx.arc(6, -13, 3.4, 0, Math.PI * 2);
    ctx.fill();

    // Metallic Protective Grill
    ctx.strokeStyle = '#cfd8e8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(23, 1);
    ctx.lineTo(20, 16);
    ctx.lineTo(4, 16);
    ctx.moveTo(8, 9);
    ctx.lineTo(22, 9);
    ctx.stroke();

    ctx.restore();
  }

  // =========================================================
  // 1. SMOOTH 60FPS ARTICULATED BATSMAN
  // =========================================================
  function drawBatsman(ctx, state) {
    const team = state.playerTeam;
    const x = state.batsmanX;
    const y = state.groundY;
    const t = state.elapsed;

    // Determine smooth continuous pose parameters
    let lean = 8;
    let stride = 8;
    let hipDrop = 0;
    let handX = 24;
    let handY = -102;
    let batDeg = 104;
    let showTrail = false;

    if (state.stumpsBroken) {
      // Bowled / stunned lean back
      lean = -14;
      stride = 2;
      hipDrop = 6;
      handX = -10;
      handY = -92;
      batDeg = 138;
    } else if (state.swingActive) {
      // Continuous fluid bat-swing curve (p from 0 -> 1 over 0.48s)
      const p = Math.min(1, state.swingElapsed / state.swingDuration);
      if (p < 0.16) {
        // Fast coiled backlift
        const k = p / 0.16;
        lean = lerp(8, -12, k);
        stride = lerp(8, 16, k);
        hipDrop = lerp(0, 6, k);
        handX = lerp(24, -18, k);
        handY = lerp(-102, -142, k);
        batDeg = lerp(104, 212, k);
      } else if (p < 0.56) {
        // Explosive active downswing & contact arc!
        const k = (p - 0.16) / 0.40;
        const ease = 1 - Math.pow(1 - k, 2.2);
        lean = lerp(-12, 24, ease);
        stride = lerp(16, 32, ease);
        hipDrop = lerp(6, 10, ease);
        handX = lerp(-18, 42, ease);
        handY = lerp(-142, -122, ease);
        // Smooth sweep from 212 deg -> 90 deg -> 12 deg -> -58 deg (high follow through!)
        batDeg = lerp(205, -52, ease);
        showTrail = true;
      } else {
        // Follow-through hold & graceful recovery to stance
        const k = (p - 0.56) / 0.44;
        lean = lerp(24, 8, k);
        stride = lerp(32, 8, k);
        hipDrop = lerp(10, 0, k);
        handX = lerp(42, 24, k);
        handY = lerp(-122, -102, k);
        batDeg = lerp(-52, 104, k);
      }
    } else {
      // Realistic alive batting stance: gentle knee flex + bat tap as bowler runs in!
      const tap = Math.sin(t * 5.2);
      const ready = state.bowler.phase === 'runup' || state.ball.phase === 'bowled';
      hipDrop = ready ? 7 + tap * 1.8 : 2 + Math.sin(t * 2.5) * 1.5;
      lean = ready ? 13 : 7;
      batDeg = ready ? 112 + tap * 8 : 104 + Math.sin(t * 2.5) * 3;
      handX = 24 + (ready ? 4 : 0);
      handY = -102 + hipDrop * 0.7;
    }

    ctx.save();
    // Ground contact shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 6, 56, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    const hipX = x + lean * 0.35;
    const hipY = y - 104 + hipDrop;
    const shX = x + lean * 1.05;
    const shY = y - 172 + hipDrop;

    // Back leg (left)
    const bKneeX = x - 18 - stride * 0.25;
    const bKneeY = y - 52 + hipDrop * 0.5;
    const bFootX = x - 26 - stride * 0.35;
    const bFootY = y - 4;
    drawLimb(ctx, hipX - 8, hipY, bKneeX, bKneeY, 20, shadeHex(team.primary, 0.76));
    drawPad(ctx, bKneeX, bKneeY, bFootX, bFootY, false, team.primary, team.secondary);
    drawBoot(ctx, bFootX, bFootY, 1, team.secondary);

    // Front leg (right, striding toward pitch)
    const fKneeX = x + 18 + stride * 0.75;
    const fKneeY = y - 52 + hipDrop * 0.5;
    const fFootX = x + 22 + stride;
    const fFootY = y - 3;
    drawLimb(ctx, hipX + 8, hipY, fKneeX, fKneeY, 21, team.primary);
    drawPad(ctx, fKneeX, fKneeY, fFootX, fFootY, true, team.primary, team.secondary);
    drawBoot(ctx, fFootX, fFootY, 1, team.secondary);

    // Sculpted Athletic Torso Jersey
    const jGrad = ctx.createLinearGradient(shX - 24, shY, shX + 26, hipY);
    jGrad.addColorStop(0, shadeHex(team.primary, 1.18));
    jGrad.addColorStop(1, shadeHex(team.primary, 0.78));
    ctx.fillStyle = jGrad;
    ctx.strokeStyle = '#121620';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(shX - 21, shY);
    ctx.quadraticCurveTo(shX + 4, shY - 8, shX + 24, shY + 6);
    ctx.lineTo(hipX + 18, hipY + 4);
    ctx.lineTo(hipX - 18, hipY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Jersey chest band & team accent
    ctx.fillStyle = team.secondary;
    ctx.beginPath();
    ctx.moveTo(lerp(shX - 20, hipX - 18, 0.32), lerp(shY, hipY, 0.32));
    ctx.lineTo(lerp(shX + 22, hipX + 18, 0.32), lerp(shY + 4, hipY, 0.32));
    ctx.lineTo(lerp(shX + 21, hipX + 18, 0.56), lerp(shY + 4, hipY, 0.56));
    ctx.lineTo(lerp(shX - 19, hipX - 18, 0.56), lerp(shY, hipY, 0.56));
    ctx.closePath();
    ctx.fill();

    // Helmeted Head
    drawHelmetHead(ctx, shX + 6, shY - 24, 1, team);

    // Bat + Arms + Batting Gloves
    const gx = x + handX;
    const gy = y + handY;
    drawCricketBat(ctx, gx, gy, batDeg, team.secondary, showTrail);

    const elbowX = (shX + 6 + gx) * 0.5 - 10;
    const elbowY = (shY + 12 + gy) * 0.5 + 12;
    drawLimb(ctx, shX + 6, shY + 12, elbowX, elbowY, 15, team.primary);
    drawLimb(ctx, elbowX, elbowY, gx, gy, 12, team.skin);

    // Pro white batting gloves
    ctx.fillStyle = '#f8faff';
    ctx.strokeStyle = '#141926';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(gx, gy, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = team.primary;
    ctx.beginPath();
    ctx.arc(gx, gy, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================
  // 2. ANIMATED OPPONENT BOWLER (RUN-UP + LEAP + WINDMILL RELEASE!)
  // =========================================================
  function drawBowler(ctx, state) {
    const bw = state.bowler;
    if (!bw.visible) return;
    const team = state.oppTeam;
    const x = bw.x;
    const y = state.groundY + bw.jumpY;

    ctx.save();
    // Shadow stays on ground!
    ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
    ctx.beginPath();
    ctx.ellipse(x, state.groundY + 5, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Slightly smaller scale for subtle broadcast depth perspective
    ctx.translate(x, y);
    ctx.scale(0.84, 0.84);

    const strideA = Math.sin(bw.runCycle);
    const hipY = -98;
    const shY = -164;
    const lean = bw.phase === 'runup' ? -14 : bw.phase === 'release' ? -22 : -10;

    // Legs (athletic sprint cycle!)
    const lFootX = strideA * 34;
    const lFootY = -4 - Math.max(0, -strideA * 22);
    const rFootX = -strideA * 34;
    const rFootY = -4 - Math.max(0, strideA * 22);

    drawLimb(ctx, 4, hipY, lFootX * 0.55 - 8, -50, 17, shadeHex(team.primary, 0.72));
    drawLimb(ctx, lFootX * 0.55 - 8, -50, lFootX, lFootY, 14, shadeHex(team.primary, 0.72));
    drawBoot(ctx, lFootX, lFootY, -1, team.secondary);

    drawLimb(ctx, -4, hipY, rFootX * 0.55 - 8, -50, 18, team.primary);
    drawLimb(ctx, rFootX * 0.55 - 8, -50, rFootX, rFootY, 15, team.primary);
    drawBoot(ctx, rFootX, rFootY, -1, team.secondary);

    // Bowler Torso Jersey
    ctx.fillStyle = team.primary;
    ctx.strokeStyle = '#121620';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(lean - 20, shY);
    ctx.lineTo(lean + 20, shY + 4);
    ctx.lineTo(15, hipY + 4);
    ctx.lineTo(-16, hipY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Jersey stripe
    ctx.fillStyle = team.secondary;
    ctx.fillRect(lean - 12, shY + 24, 30, 12);

    // Head + Hair (bowlers wear no helmet!)
    const hx = lean - 2;
    const hy = shY - 22;
    ctx.fillStyle = team.skin;
    ctx.strokeStyle = '#121620';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(hx, hy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Hair
    ctx.fillStyle = '#1c1816';
    ctx.beginPath();
    ctx.arc(hx + 2, hy - 5, 16, Math.PI * 0.95, Math.PI * 2.15);
    ctx.fill();

    // Front balancing arm
    const frontArmAng = bw.phase === 'release' ? 1.8 : 2.3 + strideA * 0.6;
    drawLimb(ctx, lean - 8, shY + 12, lean - 8 + Math.cos(frontArmAng) * 44, shY + 12 + Math.sin(frontArmAng) * 44, 12, team.skin);

    // Bowling arm (full overhead windmill rotation during delivery!)
    const armRad = bw.armAngle;
    const handX = lean + 6 + Math.cos(armRad) * 58;
    const handY = shY + 10 + Math.sin(armRad) * 58;
    drawLimb(ctx, lean + 6, shY + 10, handX, handY, 13, team.skin);

    // Show red leather ball in bowler's hand before release!
    if (bw.holdingBall) {
      ctx.fillStyle = '#d9222c';
      ctx.strokeStyle = '#40060a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(handX, handY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================
  // 3. WICKETKEEPER (CROUCHED BEHIND LEFT STUMPS)
  // =========================================================
  function drawWicketkeeper(ctx, state) {
    const team = state.oppTeam;
    const x = 118;
    const y = state.groundY - 4;
    const standUp = state.stumpsBroken || state.ball.phase === 'hit' ? 1 : 0;
    const rise = standUp ? -24 : Math.sin(state.elapsed * 3) * 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 32, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y);
    ctx.scale(0.76, 0.76);

    // Crouched keeping pads
    drawPad(ctx, -12, -52 + rise * 0.5, -18, -4, false, team.primary, team.secondary);
    drawPad(ctx, 14, -52 + rise * 0.5, 16, -4, true, team.primary, team.secondary);

    // Torso crouched low
    ctx.fillStyle = team.primary;
    ctx.strokeStyle = '#121620';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.roundRect(-20, -112 + rise, 42, 62, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = team.secondary;
    ctx.fillRect(-18, -88 + rise, 38, 12);

    // Keeper Helmet
    drawHelmetHead(ctx, 8, -130 + rise, 1, team);

    // Big keeping gloves ready in front
    drawLimb(ctx, 12, -96 + rise, 34, -76 + rise, 13, team.skin);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#121620';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(38, -74 + rise, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = team.secondary;
    ctx.beginPath();
    ctx.arc(40, -74 + rise, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // =========================================================
  // 4. ANIMATED UMPIRE (SIGNALS SIX / FOUR / OUT!)
  // =========================================================
  function drawUmpire(ctx, state) {
    const x = 640;
    const y = 594;
    const sig = state.umpireSignal; // 'idle' | 'six' | 'four' | 'out'
    const t = state.elapsed;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y);
    ctx.scale(0.54, 0.54);

    // Dark trousers
    drawLimb(ctx, -10, -74, -12, -4, 15, '#1b2234');
    drawLimb(ctx, 10, -74, 12, -4, 15, '#1b2234');

    // Iconic Bright Red/White International Umpire Coat
    ctx.fillStyle = '#f2f4f8';
    ctx.strokeStyle = '#141926';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.roundRect(-22, -142, 44, 72, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d92632';
    ctx.fillRect(-16, -138, 32, 14);

    // Head + Classic Wide-Brim Sun Hat
    ctx.fillStyle = '#d8a684';
    ctx.beginPath();
    ctx.arc(0, -162, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -172, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -174, 14, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dynamic Umpire Arm Signals!
    if (sig === 'six') {
      // Both arms raised straight up!
      drawLimb(ctx, -22, -132, -32, -206, 12, '#f2f4f8');
      drawLimb(ctx, 22, -132, 32, -206, 12, '#f2f4f8');
    } else if (sig === 'four') {
      // Sweeping arm across chest
      const wave = Math.sin(t * 14) * 34;
      drawLimb(ctx, -22, -132, -24, -84, 12, '#f2f4f8');
      drawLimb(ctx, 22, -132, 42 + wave, -124, 12, '#f2f4f8');
    } else if (sig === 'out') {
      // Iconic single raised finger of doom!
      drawLimb(ctx, -22, -132, -24, -84, 12, '#f2f4f8');
      drawLimb(ctx, 22, -132, 26, -206, 12, '#f2f4f8');
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(26, -212, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Relaxed arms at sides
      drawLimb(ctx, -22, -132, -26, -84, 12, '#f2f4f8');
      drawLimb(ctx, 22, -132, 26, -84, 12, '#f2f4f8');
    }

    ctx.restore();
  }

  return { drawBatsman, drawBowler, drawWicketkeeper, drawUmpire };
})();
