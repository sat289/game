const ENEMIES = {
  wasp: {
    hp: 45,
    score: 100,
    radius: 17,
    fireChance: 0.004,
    draw(ctx, x, y, t, hitFlash = 0) {
      ctx.save();
      ctx.translate(x, y);
      const flap = Math.sin(t * 0.025) * 5;

      // Translucent metallic wings
      ctx.fillStyle = hitFlash > 0 ? '#ffffff' : 'rgba(241,245,249,0.88)';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(-15, -4 + flap, 11, 5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(15, -4 + flap, 11, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 3D shaded orange carapace
      const g = ctx.createRadialGradient(-3, -4, 2, 0, 0, 14);
      g.addColorStop(0, hitFlash > 0 ? '#ffffff' : '#fde047');
      g.addColorStop(0.6, hitFlash > 0 ? '#ffffff' : '#f59e0b');
      g.addColorStop(1, '#9a3412');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      // Glowing red eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-6, -2, 4, 4);
      ctx.fillRect(2, -2, 4, 4);
      ctx.restore();
    }
  },

  beetle: {
    hp: 95,
    score: 200,
    radius: 20,
    fireChance: 0.007,
    draw(ctx, x, y, t, hitFlash = 0) {
      ctx.save();
      ctx.translate(x, y);

      // Metallic wing plates
      ctx.fillStyle = hitFlash > 0 ? '#ffffff' : '#cbd5e1';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-15, -6); ctx.lineTo(-24, 9); ctx.lineTo(-10, 13); ctx.closePath();
      ctx.moveTo(15, -6); ctx.lineTo(24, 9); ctx.lineTo(10, 13); ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Armored emerald shell
      const g = ctx.createRadialGradient(-4, -5, 3, 0, 0, 20);
      g.addColorStop(0, hitFlash > 0 ? '#ffffff' : '#4ade80');
      g.addColorStop(0.65, hitFlash > 0 ? '#ffffff' : '#16a34a');
      g.addColorStop(1, '#14532d');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Glowing core
      ctx.fillStyle = '#bef264';
      ctx.beginPath(); ctx.arc(0, 2, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  },

  cyberfly: {
    hp: 75,
    score: 180,
    radius: 18,
    fireChance: 0.009,
    draw(ctx, x, y, t, hitFlash = 0) {
      ctx.save();
      ctx.translate(x, y);
      const flap = Math.cos(t * 0.03) * 6;

      ctx.fillStyle = hitFlash > 0 ? '#ffffff' : 'rgba(56,189,248,0.85)';
      ctx.beginPath();
      ctx.ellipse(-15, -2 + flap, 12, 5, -0.3, 0, Math.PI * 2);
      ctx.ellipse(15, -2 + flap, 12, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();

      const g = ctx.createLinearGradient(-10, -14, 10, 14);
      g.addColorStop(0, hitFlash > 0 ? '#ffffff' : '#60a5fa');
      g.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -15); ctx.lineTo(11, 8); ctx.lineTo(0, 15); ctx.lineTo(-11, 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-4, -4, 8, 4);
      ctx.restore();
    }
  },

  boss: {
    hp: 1800,
    score: 3000,
    radius: 56,
    fireChance: 0.035,
    draw(ctx, x, y, t, hitFlash = 0) {
      ctx.save();
      ctx.translate(x, y);

      // Metallic bio-mech hull
      const g = ctx.createRadialGradient(0, -10, 10, 0, 5, 62);
      g.addColorStop(0, hitFlash > 0 ? '#ffffff' : '#a855f7');
      g.addColorStop(0.6, hitFlash > 0 ? '#ffffff' : '#6b21a8');
      g.addColorStop(1, '#2e1065');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -46);
      ctx.lineTo(56, -10);
      ctx.lineTo(44, 38);
      ctx.lineTo(0, 54);
      ctx.lineTo(-44, 38);
      ctx.lineTo(-56, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Armor ribs
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.moveTo(-36, -6); ctx.lineTo(-22, 30);
      ctx.moveTo(36, -6); ctx.lineTo(22, 30);
      ctx.stroke();

      // Pulsing glowing eyes
      const pulse = 0.65 + Math.sin(t * 0.012) * 0.35;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.beginPath(); ctx.arc(-20, 4, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(20, 4, 10, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 22, 13, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.restore();
    }
  }
};
