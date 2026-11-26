/* =========================================================
   Real-Game Broadcast 16:9 Canvas Renderer (v3)
   Timing Ring aligned 1:1 with exact front-only strike zone!
   ========================================================= */

class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = {};
    this.dpr = 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setAssets(assets) {
    this.assets = assets;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(320, this.canvas.clientWidth || rect.width);
    const cssH = Math.max(180, this.canvas.clientHeight || rect.height);
    this.canvas.width = Math.floor(cssW * dpr);
    this.canvas.height = Math.floor(cssH * dpr);
    this.dpr = dpr;
  }

  render(state) {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const vw = CWC_CONFIG.VIRTUAL_W;
    const vh = CWC_CONFIG.VIRTUAL_H;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#04060c';
    ctx.fillRect(0, 0, cw, ch);

    const sxScale = cw / vw;
    const syScale = ch / vh;
    ctx.scale(sxScale, syScale);

    const shakeX = state.shakeTime > 0 ? (Math.random() - 0.5) * state.shakeMag : 0;
    const shakeY = state.shakeTime > 0 ? (Math.random() - 0.5) * state.shakeMag : 0;
    const zoom = state.cameraZoom || 1;
    ctx.translate(vw * 0.5 + shakeX, vh * 0.58 + shakeY);
    ctx.scale(zoom, zoom);
    ctx.translate(-vw * 0.5, -vh * 0.58);

    if (this.assets.stadium) {
      ctx.drawImage(this.assets.stadium, 0, 0, vw, vh);
    }

    if (this.assets.balloons) {
      const bx = 260 + Math.sin(state.elapsed * 0.16) * 90;
      const by = 22 + Math.sin(state.elapsed * 0.9) * 5;
      ctx.drawImage(this.assets.balloons, bx, by, 165, 82);
    }

    this.drawCrowdFlashes(ctx, state);
    this.drawStadiumJumbotron(ctx, state);
    CharacterDrawer.drawUmpire(ctx, state);
    this.drawPitchMarkers(ctx, state);
    this.drawRunArc(ctx, state);
    CharacterDrawer.drawWicketkeeper(ctx, state);
    this.drawStumps(ctx, state);
    CharacterDrawer.drawBowler(ctx, state);
    CharacterDrawer.drawBatsman(ctx, state);
    this.drawBall(ctx, state);
    this.drawShockwaves(ctx, state);
    this.drawParticles(ctx, state);
    this.drawCallout(ctx, state);

    if (state.countdown > 0) {
      this.drawCountdown(ctx, state);
    }

    if (state.flashAlpha > 0) {
      ctx.fillStyle = state.flashColor.replace('ALPHA', state.flashAlpha.toFixed(3));
      ctx.fillRect(0, 0, vw, vh);
    }

    ctx.restore();
  }

  drawCrowdFlashes(ctx, state) {
    ctx.save();
    for (let i = 0; i < 8; i++) {
      const phase = Math.sin(state.elapsed * (3.5 + i * 0.7) + i * 19.3);
      if (phase > 0.94) {
        const fx = 90 + ((i * 173) % 1100);
        const fy = 405 + ((i * 47) % 88);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(fx, fy, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawStadiumJumbotron(ctx, state) {
    ctx.save();
    const x = 570, y = 415, w = 140, h = 78;
    ctx.fillStyle = '#0c2c1b';
    ctx.fillRect(x, y, w, h);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(`${state.playerTeam.short} ${state.runsScored}/${state.wicketsLost}`, 640, y + 25);

    ctx.fillStyle = '#ffd43b';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`NEED ${Math.max(0, state.targetRemaining)}`, 640, y + 48);

    ctx.fillStyle = '#38d9f5';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`BALLS: ${state.ballsLeft}`, 640, y + 67);
    ctx.restore();
  }

  drawPitchMarkers(ctx, state) {
    if (state.ball.phase === 'bowled' && !state.ball.bounced && state.delivery) {
      const pulse = 0.55 + 0.45 * Math.sin(state.elapsed * 16);
      const bx = state.delivery.bounceX;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(bx, state.groundY + 2, 22, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 75, 85, ${(0.24 + pulse * 0.25).toFixed(3)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 220, 90, ${(0.65 + pulse * 0.35).toFixed(3)})`;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }

    // Front-Only Strike Zone Timing Ring (disappears immediately once ball passes strikeMinX!)
    if (state.ball.phase === 'bowled' && state.ball.x >= state.strikeMinX) {
      const dist = state.ball.x - state.sweetSpotX;
      if (dist < 360) {
        const inZone = state.ball.x <= state.strikeMaxX && state.ball.x >= state.strikeMinX;
        const perfect = Math.abs(dist) <= 22;
        const shrink = Math.max(0, Math.min(1, Math.max(0, dist) / 260));
        const r = 18 + shrink * 36;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(state.sweetSpotX, state.groundY + 5, 52, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = perfect
          ? 'rgba(255, 212, 59, 0.36)'
          : inZone
          ? 'rgba(61, 220, 132, 0.25)'
          : 'rgba(255, 255, 255, 0.10)';
        ctx.fill();
        ctx.strokeStyle = perfect ? '#ffd43b' : inZone ? '#3ddc84' : 'rgba(255, 255, 255, 0.42)';
        ctx.lineWidth = perfect ? 3.2 : 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(state.sweetSpotX, state.groundY - 62, r, 0, Math.PI * 2);
        ctx.strokeStyle = perfect
          ? 'rgba(255, 212, 59, 0.96)'
          : inZone
          ? 'rgba(61, 220, 132, 0.88)'
          : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = perfect ? 4 : 2.5;
        ctx.stroke();

        if (perfect) {
          ctx.font = 'italic 900 17px Impact, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffd43b';
          ctx.fillText('HIT NOW!', state.sweetSpotX, state.groundY - 94);
        }
        ctx.restore();
      }
    }
  }

  drawRunArc(ctx, state) {
    const { cx, cy, radius } = CWC_CONFIG.ARC;
    const zones = CWC_CONFIG.ARC_ZONES;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, (zones[0].startDeg * Math.PI) / 180, (zones[zones.length - 1].endDeg * Math.PI) / 180);
    ctx.strokeStyle = 'rgba(4, 8, 18, 0.56)';
    ctx.lineWidth = 24;
    ctx.stroke();

    zones.forEach((z) => {
      const a0 = (z.startDeg * Math.PI) / 180;
      const a1 = (z.endDeg * Math.PI) / 180;
      const isLit = state.highlightedZone === z.runs && state.zoneFlashTimer > 0;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, a0, a1);
      ctx.strokeStyle = isLit ? z.color : 'rgba(255, 255, 255, 0.92)';
      ctx.lineWidth = isLit ? 22 : 12;
      if (isLit) {
        ctx.shadowColor = z.color;
        ctx.shadowBlur = 28;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a0) * (radius - 14), cy + Math.sin(a0) * (radius - 14));
      ctx.lineTo(cx + Math.cos(a0) * (radius + 14), cy + Math.sin(a0) * (radius + 14));
      ctx.strokeStyle = '#0e1320';
      ctx.lineWidth = 4;
      ctx.stroke();

      const midA = (a0 + a1) * 0.5;
      const lx = cx + Math.cos(midA) * (radius - 44);
      const ly = cy + Math.sin(midA) * (radius - 44);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.font = isLit ? 'italic 900 46px Impact, sans-serif' : 'italic 900 34px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#070a12';
      ctx.strokeText(z.label, 0, 0);
      ctx.fillStyle = isLit ? z.color : '#ffffff';
      ctx.fillText(z.label, 0, 0);
      ctx.restore();
    });

    ctx.restore();
  }

  drawStumps(ctx, state) {
    if (!state.stumpsBroken) {
      if (this.assets.stumps) {
        ctx.drawImage(this.assets.stumps, state.stumpsX - 31, state.groundY - 122, 62, 126);
      }
    } else {
      state.brokenPieces.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        const img = p.type === 'bail' ? this.assets.bail : this.assets.stumpSingle;
        if (img) ctx.drawImage(img, -p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
    }
  }

  drawBall(ctx, state) {
    const b = state.ball;
    if (!b.visible) return;

    const hAbove = Math.max(0, state.groundY - b.y);
    const shScale = Math.max(0.22, 1 - hAbove / 400);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(b.x, state.groundY + 7, 17 * shScale, 5 * shScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 0, 0, ${(0.44 * shScale).toFixed(3)})`;
    ctx.fill();
    ctx.restore();

    if (b.trail.length > 1) {
      ctx.save();
      for (let i = 1; i < b.trail.length; i++) {
        const p0 = b.trail[i - 1];
        const p1 = b.trail[i];
        const frac = i / b.trail.length;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = b.trailColor.replace('ALPHA', (frac * 0.78).toFixed(3));
        ctx.lineWidth = Math.max(2, b.radius * 1.45 * frac);
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);
    const sz = b.radius * 2;
    if (this.assets.ball) {
      ctx.drawImage(this.assets.ball, -sz / 2, -sz / 2, sz, sz);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#e62630';
      ctx.fill();
    }
    ctx.restore();
  }

  drawShockwaves(ctx, state) {
    ctx.save();
    state.shockwaves.forEach((sw) => {
      const a = Math.max(0, sw.life / sw.maxLife);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color.replace('ALPHA', (a * 0.85).toFixed(3));
      ctx.lineWidth = 6 * a;
      ctx.stroke();
    });
    ctx.restore();
  }

  drawParticles(ctx, state) {
    ctx.save();
    state.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  drawCallout(ctx, state) {
    if (!state.calloutText || state.calloutTimer <= 0) return;
    const t = state.calloutTimer / state.calloutMax;
    const sc = t > 0.8 ? 0.55 + ((1 - t) / 0.2) * 0.6 : 1.0 + Math.sin(t * Math.PI) * 0.08;
    const alpha = Math.min(1, t * 2.6);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(640, 240 - (1 - t) * 44);
    ctx.scale(sc, sc);
    ctx.font = 'italic 900 76px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 11;
    ctx.strokeStyle = '#070a12';
    ctx.strokeText(state.calloutText, 0, 0);
    ctx.fillStyle = state.calloutColor;
    ctx.fillText(state.calloutText, 0, 0);

    if (state.calloutSub) {
      ctx.font = 'bold 24px Trebuchet MS, sans-serif';
      ctx.lineWidth = 5;
      ctx.strokeText(state.calloutSub, 0, 52);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(state.calloutSub, 0, 52);
    }
    ctx.restore();
  }

  drawCountdown(ctx, state) {
    const num = Math.ceil(state.countdown);
    const frac = state.countdown - Math.floor(state.countdown);
    const sc = 0.85 + frac * 0.45;
    ctx.save();
    ctx.translate(640, 290);
    ctx.scale(sc, sc);
    ctx.font = 'italic 900 132px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(4, 7, 16, 0.88)';
    ctx.strokeText(String(num), 0, 0);
    ctx.fillStyle = '#ffd43b';
    ctx.fillText(String(num), 0, 0);
    ctx.restore();
  }
}

window.GameRenderer = GameRenderer;
