const ENEMIES = {
  wasp: {
    hp: 45,
    score: 100,
    radius: 17,
    fireChance: 0.004,
    draw(ctx, x, y, t) {
      ctx.save();
      ctx.translate(x, y);
      const flap = Math.sin(t * 0.025) * 5;

      // White wings
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(-15, -4 + flap, 10, 5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(15, -4 + flap, 10, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Golden/orange body
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-6, -3, 4, 4);
      ctx.fillRect(2, -3, 4, 4);
      ctx.restore();
    }
  },

  beetle: {
    hp: 95,
    score: 200,
    radius: 20,
    fireChance: 0.007,
    draw(ctx, x, y) {
      ctx.save();
      ctx.translate(x, y);

      // Green armored shell
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 19, 0, 0, Math.PI * 2);
      ctx.fill();

      // White wing plates
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(-16, -6); ctx.lineTo(-22, 8); ctx.lineTo(-10, 12); ctx.closePath();
      ctx.moveTo(16, -6); ctx.lineTo(22, 8); ctx.lineTo(10, 12); ctx.closePath();
      ctx.fill();

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
    draw(ctx, x, y, t) {
      ctx.save();
      ctx.translate(x, y);
      const flap = Math.cos(t * 0.03) * 6;

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(-14, -2 + flap, 11, 5, -0.3, 0, Math.PI * 2);
      ctx.ellipse(14, -2 + flap, 11, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(10, 8); ctx.lineTo(0, 14); ctx.lineTo(-10, 8);
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
    draw(ctx, x, y, t) {
      ctx.save();
      ctx.translate(x, y);

      // Bio-mechanical purple hull
      ctx.fillStyle = '#6b21a8';
      ctx.beginPath();
      ctx.moveTo(0, -45);
      ctx.lineTo(54, -10);
      ctx.lineTo(42, 38);
      ctx.lineTo(0, 52);
      ctx.lineTo(-42, 38);
      ctx.lineTo(-54, -10);
      ctx.closePath();
      ctx.fill();

      // Glowing eyes
      const pulse = 0.6 + Math.sin(t * 0.01) * 0.4;
      ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.beginPath(); ctx.arc(-20, 4, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(20, 4, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 20, 12, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
    }
  }
};
