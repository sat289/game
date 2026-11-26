/* =========================================================
   Canvas 2D Stadium & Cricket Broadcast Renderer (1280x720 Virtual)
   ========================================================= */

class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = {};
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setAssets(assets) {
    this.assets = assets;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.dpr = dpr;

    const vw = CWC_CONFIG.VIRTUAL_W;
    const vh = CWC_CONFIG.VIRTUAL_H;
    // Cover-style smart framing: keep full horizontal pitch & right run-arc visible
    const scaleX = w / vw;
    const scaleY = h / vh;
    this.scale = Math.min(scaleX, scaleY);
    this.offsetX = (w - vw * this.scale) / 2;
    this.offsetY = (h - vh * this.scale) / 2;
  }

  render(state) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const vw = CWC_CONFIG.VIRTUAL_W;
    const vh = CWC_CONFIG.VIRTUAL_H;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#07050a';
    ctx.fillRect(0, 0, w, h);

    // Camera Shake
    const sx = state.shakeTime > 0 ? (Math.random() - 0.5) * state.shakeMag : 0;
    const sy = state.shakeTime > 0 ? (Math.random() - 0.5) * state.shakeMag : 0;

    ctx.scale(this.dpr, this.dpr);
    ctx.translate(this.offsetX + sx, this.offsetY + sy);
    ctx.scale(this.scale, this.scale);

    // Clip to virtual 1280x720 arena
    ctx.beginPath();
    ctx.rect(0, 0, vw, vh);
    ctx.clip();

    // 1. Stadium Background
    if (this.assets.stadium) {
      ctx.drawImage(this.assets.stadium, 0, 0, vw, vh);
    }

    // 2. Floating Hot-Air Balloons (top-left atmospheric detail)
    if (this.assets.balloons) {
      const bobY = Math.sin(state.elapsed * 1.1) * 7;
      ctx.drawImage(this.assets.balloons, 178, 8 + bobY, 152, 124);
    }

    // 3. Live Stadium Electronic Scoreboard Glow
    this.drawStadiumScoreboard(ctx, state);

    // 4. Subtle Pitch Hitting Zone Marker (helps new players read bounce & timing!)
    this.drawPitchZone(ctx, state);

    // 5. Right-Side Curved Run Arc Meter (1, 2, 3, 4, 6)
    this.drawRunArc(ctx, state);

    // 6. Stumps (Upright OR Physically Shattered & Flying!)
    this.drawStumps(ctx, state);

    // 7. Batsman 5-Frame Sprite Animation
    this.drawBatsman(ctx, state);

    // 8. Cricket Ball + Shadow + Motion Trail
    this.drawBall(ctx, state);

    // 9. Particles (Hit Sparks, Boundary Confetti, Dust)
    this.drawParticles(ctx, state);

    // 10. Floating Shot Callout ("SIX!", "FOUR!", "BOWLED!")
    this.drawCallout(ctx, state);

    // 11. 3-2-1 Countdown Overlay
    if (state.countdown > 0) {
      this.drawCountdown(ctx, state);
    }

    // 12. Red Bowled / Gold Boundary Screen Edge Flash
    if (state.flashAlpha > 0) {
      ctx.fillStyle = state.flashColor.replace('ALPHA', state.flashAlpha.toFixed(3));
      ctx.fillRect(0, 0, vw, vh);
    }

    ctx.restore();
  }

  drawStadiumScoreboard(ctx, state) {
    // Overlay real-time score numbers onto the green central stadium screen
    ctx.save();
    ctx.fillStyle = '#155c2b';
    ctx.fillRect(584, 458, 112, 72);
    ctx.fillStyle = '#e8ffe0';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.playerTeam.short + ' ' + state.runsScored + '/' + state.wicketsLost, 640, 480);
    ctx.fillStyle = '#ffd43b';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('NEED ' + Math.max(0, state.targetRemaining), 640, 502);
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.fillText('BALLS ' + state.ballsLeft, 640, 521);
    ctx.restore();
  }

  drawPitchZone(ctx, state) {
    // Draw subtle sweet-spot oval right in front of batsman when ball is approaching
    if (state.ball.phase === 'bowled') {
      const dist = Math.abs(state.ball.x - state.sweetSpotX);
      const proximity = Math.max(0, 1 - dist / 160);
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(state.sweetSpotX, state.groundY + 6, 46, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 220, 75, ${(0.08 + proximity * 0.28).toFixed(3)})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 235, 130, ${(0.18 + proximity * 0.55).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  drawRunArc(ctx, state) {
    // Exact curved white meter along the right side of the stadium (like video_1.mp4!)
    const arcCx = 540;
    const arcCy = 520;
    const radius = 560;

    ctx.save();
    const zones = CWC_CONFIG.ARC_ZONES;

    // Outer dark backing track
    ctx.beginPath();
    ctx.arc(arcCx, arcCy, radius, (zones[0].startDeg * Math.PI) / 180, (zones[zones.length - 1].endDeg * Math.PI) / 180);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 22;
    ctx.stroke();

    // Draw each numbered segment
    zones.forEach((z) => {
      const a0 = (z.startDeg * Math.PI) / 180;
      const a1 = (z.endDeg * Math.PI) / 180;
      const isLit = state.highlightedZone === z.runs && state.zoneFlashTimer > 0;

      ctx.beginPath();
      ctx.arc(arcCx, arcCy, radius, a0, a1);
      ctx.strokeStyle = isLit ? z.color : '#ffffff';
      ctx.lineWidth = isLit ? 20 : 12;
      if (isLit) {
        ctx.shadowColor = z.color;
        ctx.shadowBlur = 24;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Divider tick notch
      const tx0 = arcCx + Math.cos(a0) * (radius - 12);
      const ty0 = arcCy + Math.sin(a0) * (radius - 12);
      const tx1 = arcCx + Math.cos(a0) * (radius + 12);
      const ty1 = arcCy + Math.sin(a0) * (radius + 12);
      ctx.beginPath();
      ctx.moveTo(tx0, ty0);
      ctx.lineTo(tx1, ty1);
      ctx.strokeStyle = '#181a22';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Zone Run Number Label (slightly inward from the white arc!)
      const midA = (a0 + a1) / 2;
      const lx = arcCx + Math.cos(midA) * (radius - 42);
      const ly = arcCy + Math.sin(midA) * (radius - 42);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.font = isLit ? 'italic 900 44px Impact, sans-serif' : 'italic 900 34px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#090b10';
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
        ctx.drawImage(this.assets.stumps, state.stumpsX - 30, state.groundY - 124, 62, 128);
      }
    } else {
      // Draw flying broken stumps & bails with physics!
      state.brokenPieces.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        const img = p.type === 'bail' ? this.assets.bail : this.assets.stumpSingle;
        if (img) {
          ctx.drawImage(img, -p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      });
    }
  }

  drawBatsman(ctx, state) {
    const sheet = this.assets.batsmen && this.assets.batsmen[state.playerTeam.id];
    if (!sheet) return;
    const frameW = 256;
    const frameH = 320;
    const f = state.batsmanFrame;
    const bob = f === 0 ? Math.sin(state.elapsed * 4.2) * 2.5 : 0;

    // Batsman positioned right in front of the left crease
    const drawW = 220;
    const drawH = 275;
    const dx = state.batsmanX - drawW * 0.44;
    const dy = state.groundY - drawH + 28 + bob;

    ctx.drawImage(sheet, f * frameW, 0, frameW, frameH, dx, dy, drawW, drawH);
  }

  drawBall(ctx, state) {
    const b = state.ball;
    if (!b.visible) return;

    // Ground shadow beneath ball
    const heightAboveGround = Math.max(0, state.groundY - b.y);
    const shadowScale = Math.max(0.25, 1 - heightAboveGround / 380);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(b.x, state.groundY + 8, 18 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 0, 0, ${(0.42 * shadowScale).toFixed(3)})`;
    ctx.fill();
    ctx.restore();

    // Motion Trail
    if (b.trail.length > 1) {
      ctx.save();
      for (let i = 1; i < b.trail.length; i++) {
        const p0 = b.trail[i - 1];
        const p1 = b.trail[i];
        const frac = i / b.trail.length;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = b.trailColor.replace('ALPHA', (frac * 0.72).toFixed(3));
        ctx.lineWidth = Math.max(2, b.radius * 1.45 * frac);
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }

    // Spinning Cricket Ball Sprite
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);
    const sz = b.radius * 2;
    if (this.assets.ball) {
      ctx.drawImage(this.assets.ball, -sz / 2, -sz / 2, sz, sz);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#e5252e';
      ctx.fill();
    }
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
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
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
    const popScale = t > 0.8 ? 0.6 + ((1 - t) / 0.2) * 0.55 : 1.0 + Math.sin(t * Math.PI) * 0.08;
    const alpha = Math.min(1, t * 2.5);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(640, 260 - (1 - t) * 42);
    ctx.scale(popScale, popScale);
    ctx.font = 'italic 900 72px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#090b10';
    ctx.strokeText(state.calloutText, 0, 0);
    ctx.fillStyle = state.calloutColor;
    ctx.fillText(state.calloutText, 0, 0);

    if (state.calloutSub) {
      ctx.font = 'bold 24px Trebuchet MS, sans-serif';
      ctx.lineWidth = 5;
      ctx.strokeText(state.calloutSub, 0, 50);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(state.calloutSub, 0, 50);
    }
    ctx.restore();
  }

  drawCountdown(ctx, state) {
    const num = Math.ceil(state.countdown);
    const frac = state.countdown - Math.floor(state.countdown);
    const sc = 0.85 + frac * 0.45;
    ctx.save();
    ctx.translate(640, 310);
    ctx.scale(sc, sc);
    ctx.font = 'italic 900 128px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeText(String(num), 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(num), 0, 0);
    ctx.restore();
  }
}

window.GameRenderer = GameRenderer;
