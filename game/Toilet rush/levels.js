const TOTAL_LEVELS = 50;

function getLevelConfig(lvl) {
  let doors = [];
  let chars = [];
  let walls = [];

  if (lvl === 1) {
    doors = [
      { id: 'girl', color: '#d60000', x: 105, y: 265, w: 62, h: 95 },
      { id: 'boy',  color: '#0032d6', x: 285, y: 265, w: 62, h: 95 }
    ];
    chars = [
      { id: 'boy',  color: '#0032d6', x: 105, y: 525, sx: 105, sy: 525, path: [], ready: false, done: false },
      { id: 'girl', color: '#d60000', x: 285, y: 525, sx: 285, sy: 525, path: [], ready: false, done: false }
    ];
  } else if (lvl === 2) {
    doors = [
      { id: 'girl', color: '#d60000', x: 68,  y: 520, w: 62, h: 95 },
      { id: 'boy',  color: '#0032d6', x: 322, y: 230, w: 62, h: 95 }
    ];
    chars = [
      { id: 'boy',  color: '#0032d6', x: 68,  y: 230, sx: 68,  sy: 230, path: [], ready: false, done: false },
      { id: 'girl', color: '#d60000', x: 300, y: 520, sx: 300, sy: 520, path: [], ready: false, done: false }
    ];
    walls.push({ x: 145, y: 310, w: 100, h: 150, vx: 0, monster: true });
  } else {
    const flip = (lvl % 2 === 0);
    doors = [
      { id: flip ? 'boy' : 'girl', color: flip ? '#0032d6' : '#d60000', x: 95,  y: 245, w: 62, h: 95 },
      { id: flip ? 'girl' : 'boy', color: flip ? '#d60000' : '#0032d6', x: 295, y: 245, w: 62, h: 95 }
    ];
    chars = [
      { id: 'boy',  color: '#0032d6', x: 95,  y: 545, sx: 95,  sy: 545, path: [], ready: false, done: false },
      { id: 'girl', color: '#d60000', x: 295, y: 545, sx: 295, sy: 545, path: [], ready: false, done: false }
    ];

    const mode = lvl % 6;
    if (mode === 3) {
      walls.push({ x: 135, y: 390, w: 120, h: 22, vx: 0 });
    } else if (mode === 4) {
      walls.push({ x: 35,  y: 350, w: 120, h: 20, vx: 0 });
      walls.push({ x: 235, y: 430, w: 120, h: 20, vx: 0 });
    } else if (mode === 5) {
      walls.push({ x: 140, y: 390, w: 95, h: 22, vx: 2.2, minX: 45, maxX: 250 });
    } else if (mode === 0) {
      walls.push({ x: 184, y: 325, w: 22, h: 145, vx: 0 });
      walls.push({ x: 50,  y: 400, w: 75, h: 20, vx: 1.8, minX: 25, maxX: 105 });
    } else if (mode === 1) {
      walls.push({ x: 90,  y: 345, w: 80, h: 20, vx: 2.0, minX: 40, maxX: 220 });
      walls.push({ x: 210, y: 445, w: 80, h: 20, vx: -2.0, minX: 90, maxX: 260 });
    } else {
      walls.push({ x: 145, y: 365, w: 100, h: 60, vx: 1.5, minX: 60, maxX: 230, monster: true });
    }
  }

  return { doors, chars, walls };
}
