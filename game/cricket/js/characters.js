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
   60fps Smooth Articulated Skeletal Cricket Characters (v3)
   Instant-Whip Batsman Swing, Animated Bowler, Keeper & Umpire
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

    // Bright visible swing whoosh arc trail when bat whips forward!
    if (showTrail) {
      ctx.save();
      for (let i = 1; i <= 6; i++) {
        const a = rad + i * 0.16;
        ctx.beginPath();
        ctx.moveTo(hx + Math.cos(a) * 26, hy + Math.sin(a) * 26);
        ctx.lineTo(hx + Math.cos(a) * 108, hy + Math.sin(a) * 108);
        ctx.strokeStyle = `rgba(255, 232, 135, ${(0.42 - i * 0.06).toFixed(3)})`;
        ctx.lineWidth = 19 - i * 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(rad);

    ctx.fillStyle = '#1e2430';
    ctx.strokeStyle = '#0e1118';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-2, -4, 30, 8, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = secColor;
    ctx.fillRect(6, -3.5, 9, 7);

    const wood = ctx.createLinearGradient(26, -10, 26, 10);
    wood.addColorStop(0, '#f5d9a8');
    wood.addColorStop(0.5, '#e2b878');
    wood.addColorStop(1, '#ba8848');
    ctx.fillStyle = wood;
    ctx.strokeStyle = '#181c26';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(26, -7.5);
    ctx.lineTo(106, -10.5);
    ctx.quadraticCurveTo(112, 0, 106, 10.5);
    ctx.lineTo(26, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(130, 82, 28, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.lineTo(102, 0);
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

    ctx.fillStyle = team.skin;
    ctx.strokeStyle = '#141926';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(8, -1, 3.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141926';
    ctx.beginPath();
    ctx.arc(9, -1, 1.5, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.beginPath();
    ctx.moveTo(10, -7);
    ctx.lineTo(29, -3);
    ctx.lineTo(25, 2);
    ctx.lineTo(10, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = team.secondary;
    ctx.beginPath();
    ctx.arc(6, -13, 3.4, 0, Math.PI * 2);
    ctx.fill();

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
  // 1. INSTANT-RESPONSE ARTICULATED BATSMAN (v3 FIX!)
  // =========================================================
  function drawBatsman(ctx, state) {
    const team = state.playerTeam;
    const x = state.batsmanX;
    const y = state.groundY;
    const t = state.elapsed;

    let lean = 8;
    let stride = 8;
    let hipDrop = 0;
    let handX = 22;
    let handY = -104;
    let batDeg = 108;
    let showTrail = false;

    if (state.stumpsBroken) {
      lean = -14;
      stride = 2;
      hipDrop = 6;
      handX = -10;
      handY = -92;
      batDeg = 142;
    } else if (state.swingActive) {
      const p = Math.min(1, state.swingElapsed / state.swingDuration);
      if (p < 0.48) {
        const k = p / 0.48;
        const ease = 1 - Math.pow(1 - k, 2.0);
        lean = lerp(-6, 26, ease);
        stride = lerp(14, 34, ease);
        hipDrop = lerp(7, 10, ease);
        handX = lerp(-12, 44, ease);
        handY = lerp(-136, -118, ease);
        batDeg = lerp(178, -60, ease);
        showTrail = true;
      } else if (p < 0.74) {
        lean = 24;
        stride = 32;
        hipDrop = 8;
        handX = 42;
        handY = -126;
        batDeg = -60;
        showTrail = false;
      } else {
        const k = (p - 0.74) / 0.26;
        lean = lerp(24, 8, k);
        stride = lerp(32, 8, k);
        hipDrop = lerp(8, 2, k);
        handX = lerp(42, 22, k);
        handY = lerp(-126, -104, k);
        batDeg = lerp(-60, 108, k);
      }
    } else if (state.ball.phase === 'bowled') {
      const coil = Math.min(1, state.backliftBlend);
      lean = lerp(10, -6, coil);
      stride = lerp(8, 14, coil);
      hipDrop = lerp(4, 7, coil);
      handX = lerp(24, -12, coil);
      handY = lerp(-104, -136, coil);
      batDeg = lerp(112, 178, coil);
    } else {
      const tap = Math.sin(t * 5.2);
      const alert = state.bowler.phase === 'runup' || state.bowler.phase === 'release';
      hipDrop = alert ? 6 + tap * 1.5 : 2 + Math.sin(t * 2.4) * 1.5;
      lean = alert ? 11 : 7;
      batDeg = alert ? 118 + tap * 9 : 106 + Math.sin(t * 2.4) * 3;
      handX = alert ? 20 : 24;
      handY = -104 + hipDrop * 0.6;
    }

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 6, 56, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    const hipX = x + lean * 0.35;
    const hipY = y - 104 + hipDrop;
    const shX = x + lean * 1.05;
    const shY = y - 172 + hipDrop;

    const bKneeX = x - 18 - stride * 0.25;
    const bKneeY = y - 52 + hipDrop * 0.5;
    const bFootX = x - 26 - stride * 0.35;
    const bFootY = y - 4;
    drawLimb(ctx, hipX - 8, hipY, bKneeX, bKneeY, 20, shadeHex(team.primary, 0.76));
    drawPad(ctx, bKneeX, bKneeY, bFootX, bFootY, false, team.primary, team.secondary);
    drawBoot(ctx, bFootX, bFootY, 1, team.secondary);

    const fKneeX = x + 18 + stride * 0.75;
    const fKneeY = y - 52 + hipDrop * 0.5;
    const fFootX = x + 22 + stride;
    const fFootY = y - 3;
    drawLimb(ctx, hipX + 8, hipY, fKneeX, fKneeY, 21, team.primary);
    drawPad(ctx, fKneeX, fKneeY, fFootX, fFootY, true, team.primary, team.secondary);
    drawBoot(ctx, fFootX, fFootY, 1, team.secondary);

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

    ctx.fillStyle = team.secondary;
    ctx.beginPath();
    ctx.moveTo(lerp(shX - 20, hipX - 18, 0.32), lerp(shY, hipY, 0.32));
    ctx.lineTo(lerp(shX + 22, hipX + 18, 0.32), lerp(shY + 4, hipY, 0.32));
    ctx.lineTo(lerp(shX + 21, hipX + 18, 0.56), lerp(shY + 4, hipY, 0.56));
    ctx.lineTo(lerp(shX - 19, hipX - 18, 0.56), lerp(shY, hipY, 0.56));
    ctx.closePath();
    ctx.fill();

    drawHelmetHead(ctx, shX + 6, shY - 24, 1, team);

    const gx = x + handX;
    const gy = y + handY;
    drawCricketBat(ctx, gx, gy, batDeg, team.secondary, showTrail);

    const elbowX = (shX + 6 + gx) * 0.5 - 10;
    const elbowY = (shY + 12 + gy) * 0.5 + 12;
    drawLimb(ctx, shX + 6, shY + 12, elbowX, elbowY, 15, team.primary);
    drawLimb(ctx, elbowX, elbowY, gx, gy, 12, team.skin);

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
  // 2. ANIMATED OPPONENT BOWLER
  // =========================================================
  function drawBowler(ctx, state) {
    const bw = state.bowler;
    if (!bw.visible) return;
    const team = state.oppTeam;
    const x = bw.x;
    const y = state.groundY + bw.jumpY;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
    ctx.beginPath();
    ctx.ellipse(x, state.groundY + 5, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y);
    ctx.scale(0.84, 0.84);

    const strideA = Math.sin(bw.runCycle);
    const hipY = -98;
    const shY = -164;
    const lean = bw.phase === 'runup' ? -14 : bw.phase === 'release' ? -22 : -10;

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

    ctx.fillStyle = team.secondary;
    ctx.fillRect(lean - 12, shY + 24, 30, 12);

    const hx = lean - 2;
    const hy = shY - 22;
    ctx.fillStyle = team.skin;
    ctx.strokeStyle = '#121620';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(hx, hy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1c1816';
    ctx.beginPath();
    ctx.arc(hx + 2, hy - 5, 16, Math.PI * 0.95, Math.PI * 2.15);
    ctx.fill();

    const frontArmAng = bw.phase === 'release' ? 1.8 : 2.3 + strideA * 0.6;
    drawLimb(ctx, lean - 8, shY + 12, lean - 8 + Math.cos(frontArmAng) * 44, shY + 12 + Math.sin(frontArmAng) * 44, 12, team.skin);

    const armRad = bw.armAngle;
    const handX = lean + 6 + Math.cos(armRad) * 58;
    const handY = shY + 10 + Math.sin(armRad) * 58;
    drawLimb(ctx, lean + 6, shY + 10, handX, handY, 13, team.skin);

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
  // 3. WICKETKEEPER
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

    drawPad(ctx, -12, -52 + rise * 0.5, -18, -4, false, team.primary, team.secondary);
    drawPad(ctx, 14, -52 + rise * 0.5, 16, -4, true, team.primary, team.secondary);

    ctx.fillStyle = team.primary;
    ctx.strokeStyle = '#121620';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.roundRect(-20, -112 + rise, 42, 62, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = team.secondary;
    ctx.fillRect(-18, -88 + rise, 38, 12);

    drawHelmetHead(ctx, 8, -130 + rise, 1, team);

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
  // 4. UMPIRE
  // =========================================================
  function drawUmpire(ctx, state) {
    const x = 640;
    const y = 594;
    const sig = state.umpireSignal;
    const t = state.elapsed;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y);
    ctx.scale(0.54, 0.54);

    drawLimb(ctx, -10, -74, -12, -4, 15, '#1b2234');
    drawLimb(ctx, 10, -74, 12, -4, 15, '#1b2234');

    ctx.fillStyle = '#f2f4f8';
    ctx.strokeStyle = '#141926';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.roundRect(-22, -142, 44, 72, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d92632';
    ctx.fillRect(-16, -138, 32, 14);

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

    if (sig === 'six') {
      drawLimb(ctx, -22, -132, -32, -206, 12, '#f2f4f8');
      drawLimb(ctx, 22, -132, 32, -206, 12, '#f2f4f8');
    } else if (sig === 'four') {
      const wave = Math.sin(t * 14) * 34;
      drawLimb(ctx, -22, -132, -24, -84, 12, '#f2f4f8');
      drawLimb(ctx, 22, -132, 42 + wave, -124, 12, '#f2f4f8');
    } else if (sig === 'out') {
      drawLimb(ctx, -22, -132, -24, -84, 12, '#f2f4f8');
      drawLimb(ctx, 22, -132, 26, -206, 12, '#f2f4f8');
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.arc(26, -212, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      drawLimb(ctx, -22, -132, -26, -84, 12, '#f2f4f8');
      drawLimb(ctx, 22, -132, 26, -84, 12, '#f2f4f8');
    }

    ctx.restore();
  }

  return { drawBatsman, drawBowler, drawWicketkeeper, drawUmpire };
})();
