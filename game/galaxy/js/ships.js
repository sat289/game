const SHIPS = {
  cobra: {
    id: 'cobra',
    name: 'Cobra',
    baseAtk: 22,
    fireDelay: 170,
    special: 'Green Twin Pulse',
    color: '#22c55e',
    draw(ctx, x, y, scale = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Green energy wing orbs
      ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
      ctx.beginPath(); ctx.arc(-20, 4, 11, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(20, 4, 11, 0, Math.PI * 2); ctx.fill();

      // Main white/silver fuselage
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(14, 10);
      ctx.lineTo(24, 16);
      ctx.lineTo(10, 24);
      ctx.lineTo(0, 16);
      ctx.lineTo(-10, 24);
      ctx.lineTo(-24, 16);
      ctx.lineTo(-14, 10);
      ctx.closePath();
      ctx.fill();

      // Green armor stripes
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(-5, -14, 10, 24);

      // Cockpit
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(0, -6, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    fire(bullets, x, y, power, dmg) {
      const lanes = power >= 5 ? [-16, 0, 16] : power >= 2 ? [-10, 10] : [0];
      lanes.forEach(dx => {
        bullets.push({ x: x + dx, y: y - 24, vx: 0, vy: -11, dmg, color: '#4ade80', w: 5, h: 18, type: 'bolt' });
      });
    }
  },

  seraphim: {
    id: 'seraphim',
    name: 'Seraphim',
    baseAtk: 34,
    fireDelay: 120,
    special: 'Triple Flame Lasers',
    color: '#f59e0b',
    draw(ctx, x, y, scale = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Golden angel wings
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(34, 8);
      ctx.lineTo(24, 22);
      ctx.lineTo(0, 10);
      ctx.lineTo(-24, 22);
      ctx.lineTo(-34, 8);
      ctx.closePath();
      ctx.fill();

      // White armored core
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(12, 8);
      ctx.lineTo(0, 20);
      ctx.lineTo(-12, 8);
      ctx.closePath();
      ctx.fill();

      // Gold crest
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI * 2); ctx.fill();

      ctx.restore();
    },
    fire(bullets, x, y, power, dmg) {
      const lanes = power >= 4 ? [-18, 0, 18] : [-10, 10];
      lanes.forEach(dx => {
        bullets.push({ x: x + dx, y: y - 26, vx: 0, vy: -15, dmg: dmg * 1.15, color: '#fb923c', w: 7, h: 32, type: 'laser' });
      });
    }
  },

  azure: {
    id: 'azure',
    name: 'Azure Striker',
    baseAtk: 28,
    fireDelay: 140,
    special: 'Cyan Twin Beams',
    color: '#38bdf8',
    draw(ctx, x, y, scale = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(28, 6);
      ctx.lineTo(14, 20);
      ctx.lineTo(0, 12);
      ctx.lineTo(-14, 20);
      ctx.lineTo(-28, 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(8, 6);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    },
    fire(bullets, x, y, power, dmg) {
      const spread = power >= 4 ? [-16, -6, 6, 16] : [-9, 9];
      spread.forEach(dx => {
        bullets.push({ x: x + dx, y: y - 22, vx: 0, vy: -13, dmg, color: '#38bdf8', w: 5, h: 24, type: 'bolt' });
      });
    }
  },

  crimson: {
    id: 'crimson',
    name: 'Crimson Rocket',
    baseAtk: 38,
    fireDelay: 190,
    special: 'Heavy Red Missiles',
    color: '#ef4444',
    draw(ctx, x, y, scale = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(22, 12);
      ctx.lineTo(18, 22);
      ctx.lineTo(-18, 22);
      ctx.lineTo(-22, 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-16, 4, 8, 16);
      ctx.fillRect(8, 4, 8, 16);
      ctx.fillRect(-4, -18, 8, 22);

      ctx.restore();
    },
    fire(bullets, x, y, power, dmg) {
      const offsets = power >= 4 ? [-18, -6, 6, 18] : [-12, 0, 12];
      offsets.forEach(dx => {
        bullets.push({ x: x + dx, y: y - 24, vx: dx * 0.03, vy: -10, dmg: dmg * 1.25, color: '#f97316', w: 8, h: 22, type: 'missile' });
      });
    }
  },

  cryo: {
    id: 'cryo',
    name: 'Cryo Nova',
    baseAtk: 42,
    fireDelay: 165,
    special: 'Blue Plasma Shards',
    color: '#60a5fa',
    draw(ctx, x, y, scale = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(20, 4);
      ctx.lineTo(16, 22);
      ctx.lineTo(-16, 22);
      ctx.lineTo(-20, 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(0, -2, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    fire(bullets, x, y, power, dmg) {
      const angles = power >= 4 ? [-1.5, -0.5, 0.5, 1.5] : [-0.8, 0, 0.8];
      angles.forEach(vx => {
        bullets.push({ x, y: y - 24, vx, vy: -12, dmg: dmg * 1.2, color: '#3b82f6', w: 10, h: 22, type: 'shard' });
      });
    }
  }
};
