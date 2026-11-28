// Preload PNG ship sprites from assets/
const SHIP_SPRITES = {};
['cobra', 'seraphim', 'azure', 'crimson', 'cryo'].forEach(id => {
  const img = new Image();
  img.src = `assets/${id}.png`;
  SHIP_SPRITES[id] = img;
});

function drawShipSprite(ctx, id, x, y, scale, fallbackColor) {
  const img = SHIP_SPRITES[id];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -36, -36, 72, 72);
  } else {
    // Fallback triangle while image loads
    ctx.fillStyle = fallbackColor;
    ctx.beginPath();
    ctx.moveTo(0, -26); ctx.lineTo(22, 18); ctx.lineTo(-22, 18); ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

const SHIPS = {
  cobra: {
    id: 'cobra',
    name: 'Cobra',
    baseAtk: 22,
    fireDelay: 170,
    special: 'Green Twin Pulse',
    color: '#22c55e',
    draw(ctx, x, y, scale = 1) {
      drawShipSprite(ctx, 'cobra', x, y, scale, '#22c55e');
    },
    fire(bullets, x, y, power, dmg) {
      const lanes = power >= 5 ? [-16, 0, 16] : power >= 2 ? [-10, 10] : [0];
      lanes.forEach(dx => {
        bullets.push({ x: x + dx, y: y - 26, vx: 0, vy: -12, dmg, color: '#4ade80', w: 5, h: 20, type: 'bolt' });
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
      drawShipSprite(ctx, 'seraphim', x, y, scale, '#f59e0b');
    },
    fire(bullets, x, y, power, dmg) {
      const lanes = power >= 4 ? [-18, 0, 18] : [-10, 10];
      lanes.forEach(dx => {
        bullets.push({ x: x + dx, y: y - 28, vx: 0, vy: -16, dmg: dmg * 1.15, color: '#fb923c', w: 7, h: 34, type: 'laser' });
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
      drawShipSprite(ctx, 'azure', x, y, scale, '#38bdf8');
    },
    fire(bullets, x, y, power, dmg) {
      const spread = power >= 4 ? [-16, -6, 6, 16] : [-9, 9];
      spread.forEach(dx => {
        bullets.push({ x: x + dx, y: y - 24, vx: 0, vy: -14, dmg, color: '#38bdf8', w: 5, h: 26, type: 'bolt' });
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
      drawShipSprite(ctx, 'crimson', x, y, scale, '#ef4444');
    },
    fire(bullets, x, y, power, dmg) {
      const offsets = power >= 4 ? [-18, -6, 6, 18] : [-12, 0, 12];
      offsets.forEach(dx => {
        bullets.push({ x: x + dx, y: y - 26, vx: dx * 0.03, vy: -11, dmg: dmg * 1.25, color: '#f97316', w: 10, h: 26, type: 'missile' });
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
      drawShipSprite(ctx, 'cryo', x, y, scale, '#60a5fa');
    },
    fire(bullets, x, y, power, dmg) {
      const angles = power >= 4 ? [-1.5, -0.5, 0.5, 1.5] : [-0.8, 0, 0.8];
      angles.forEach(vx => {
        bullets.push({ x, y: y - 26, vx, vy: -12.5, dmg: dmg * 1.2, color: '#60a5fa', w: 9, h: 24, type: 'shard' });
      });
    }
  }
};
