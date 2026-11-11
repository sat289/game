// ST GAMES: THE PARADISE - Progressive Difficulty Campaign
// Police start slow on Level 1 (guardSpeed: 19) and slowly increase speed on every level (+1.3 per level).
// Levels 1 to 4 have NO Watchtowers; Watchtowers start after Level 4 (from Level 5+).
window.PARADISE_LEVELS = [
  {
    level: 1,
    title: "Level 1: Easy Village Start",
    passRadiusRatio: 0.28,
    carrierSpeed: 18,
    wanderSpeed: 20,
    guardSpeed: 19.0,
    policeDelay: 3.5,
    villagers: [
      { id: "mother", name: "Laxmi", x: 0.36, y: 0.46, hasBaby: false },
      { id: "leader", name: "Nani",  x: 0.48, y: 0.50, hasBaby: false },
      { id: "crow",   name: "Kaaka", x: 0.46, y: 0.35, hasBaby: false },
      { id: "tribal", name: "Bheem", x: 0.58, y: 0.52, hasBaby: true },
      { id: "dog",    name: "Simba", x: 0.69, y: 0.38, hasBaby: false },
      { id: "rebel",  name: "Suri",  x: 0.74, y: 0.50, hasBaby: false }
    ],
    guards: [
      { x: -0.04, y: 0.58, weapon: "pistol", speedMul: 0.95, spawnDelay: 3.5 }
    ],
    obstacles: [],
    towers: []
  },
  {
    level: 2,
    title: "Level 2: Crossroad Patrol",
    passRadiusRatio: 0.25,
    carrierSpeed: 18,
    wanderSpeed: 20,
    guardSpeed: 20.3,
    policeDelay: 3.2,
    villagers: [
      { id: "mother", name: "Laxmi", x: 0.24, y: 0.34, hasBaby: true },
      { id: "rebel",  name: "Suri",  x: 0.40, y: 0.32, hasBaby: false },
      { id: "crow",   name: "Kaaka", x: 0.54, y: 0.40, hasBaby: false },
      { id: "leader", name: "Nani",  x: 0.48, y: 0.64, hasBaby: false },
      { id: "dog",    name: "Simba", x: 0.60, y: 0.66, hasBaby: false },
      { id: "tribal", name: "Bheem", x: 0.71, y: 0.52, hasBaby: false }
    ],
    guards: [
      { x: -0.04, y: 0.28, weapon: "pistol", speedMul: 0.98, spawnDelay: 3.2 },
      { x: -0.05, y: 0.72, weapon: "pistol", speedMul: 0.95, spawnDelay: 4.4 }
    ],
    obstacles: [
      { x: 0.46, y: 0.50, w: 38, h: 14 }
    ],
    towers: []
  },
  {
    level: 3,
    title: "Level 3: Garrison Siege",
    passRadiusRatio: 0.24,
    carrierSpeed: 18,
    wanderSpeed: 20,
    guardSpeed: 21.6,
    policeDelay: 3.0,
    villagers: [
      { id: "mother", name: "Laxmi", x: 0.22, y: 0.64, hasBaby: true },
      { id: "tribal", name: "Bheem", x: 0.30, y: 0.44, hasBaby: false },
      { id: "crow",   name: "Kaaka", x: 0.44, y: 0.32, hasBaby: false },
      { id: "dog",    name: "Simba", x: 0.54, y: 0.38, hasBaby: false },
      { id: "rebel",  name: "Suri",  x: 0.56, y: 0.58, hasBaby: false },
      { id: "leader", name: "Nani",  x: 0.70, y: 0.50, hasBaby: false }
    ],
    guards: [
      { x: -0.04, y: 0.64, weapon: "pistol",  speedMul: 1.0,  spawnDelay: 3.0 },
      { x: -0.05, y: 0.28, weapon: "pistol",  speedMul: 0.96, spawnDelay: 4.1 },
      { x: -0.06, y: 0.82, weapon: "bazooka", speedMul: 0.94, spawnDelay: 5.2 }
    ],
    obstacles: [
      { x: 0.38, y: 0.56, w: 40, h: 14 },
      { x: 0.60, y: 0.28, w: 40, h: 14 }
    ],
    towers: []
  },
  {
    level: 4,
    title: "Level 4: Bridge Blockade",
    passRadiusRatio: 0.23,
    carrierSpeed: 18,
    wanderSpeed: 20,
    guardSpeed: 22.9,
    policeDelay: 3.0,
    villagers: [
      { id: "leader", name: "Nani",  x: 0.18, y: 0.74, hasBaby: true },
      { id: "mother", name: "Laxmi", x: 0.32, y: 0.58, hasBaby: false },
      { id: "tribal", name: "Bheem", x: 0.38, y: 0.36, hasBaby: false },
      { id: "crow",   name: "Kaaka", x: 0.52, y: 0.28, hasBaby: false },
      { id: "rebel",  name: "Suri",  x: 0.62, y: 0.52, hasBaby: false },
      { id: "dog",    name: "Simba", x: 0.72, y: 0.44, hasBaby: false }
    ],
    guards: [
      { x: -0.04, y: 0.74, weapon: "pistol",  speedMul: 1.0,  spawnDelay: 3.0 },
      { x: -0.05, y: 0.35, weapon: "bazooka", speedMul: 0.98, spawnDelay: 4.0 },
      { x: -0.06, y: 0.55, weapon: "pistol",  speedMul: 0.98, spawnDelay: 5.0 },
      { x: -0.05, y: 0.18, weapon: "bazooka", speedMul: 0.95, spawnDelay: 6.0 }
    ],
    obstacles: [
      { x: 0.28, y: 0.45, w: 42, h: 14 },
      { x: 0.52, y: 0.64, w: 42, h: 14 }
    ],
    towers: []
  },
  {
    level: 5,
    title: "Level 5: Watchtower Sniper Alert",
    passRadiusRatio: 0.22,
    carrierSpeed: 18,
    wanderSpeed: 20,
    guardSpeed: 24.2,
    policeDelay: 3.0,
    villagers: [
      { id: "leader", name: "Nani",  x: 0.16, y: 0.48, hasBaby: true },
      { id: "mother", name: "Laxmi", x: 0.30, y: 0.32, hasBaby: false },
      { id: "tribal", name: "Bheem", x: 0.34, y: 0.66, hasBaby: false },
      { id: "dog",    name: "Simba", x: 0.48, y: 0.48, hasBaby: false },
      { id: "crow",   name: "Kaaka", x: 0.61, y: 0.34, hasBaby: false },
      { id: "rebel",  name: "Suri",  x: 0.71, y: 0.54, hasBaby: false }
    ],
    guards: [
      { x: -0.04, y: 0.46, weapon: "bazooka", speedMul: 1.0,  spawnDelay: 3.0 },
      { x: -0.05, y: 0.18, weapon: "pistol",  speedMul: 0.98, spawnDelay: 4.1 },
      { x: -0.05, y: 0.82, weapon: "pistol",  speedMul: 0.98, spawnDelay: 5.2 }
    ],
    obstacles: [
      { x: 0.36, y: 0.48, w: 44, h: 14 },
      { x: 0.58, y: 0.46, w: 44, h: 14 }
    ],
    towers: [
      { x: 0.36, y: 0.16, buildStart: 2.2, buildDuration: 2.2, aimDuration: 3.8 }
    ]
  }
];

window.getParadiseLevelConfig = function(levelIndex) {
  if (levelIndex >= 0 && levelIndex < window.PARADISE_LEVELS.length) {
    return window.PARADISE_LEVELS[levelIndex];
  }
  const lvlNum = levelIndex + 1;
  const seed = lvlNum * 1337;
  const rand = (n) => {
    const x = Math.sin(seed + n * 79.19) * 10000;
    return x - Math.floor(x);
  };

  const roles = [
    { id: "leader", name: "Nani" },
    { id: "mother", name: "Laxmi" },
    { id: "tribal", name: "Bheem" },
    { id: "rebel",  name: "Suri" },
    { id: "dog",    name: "Simba" },
    { id: "crow",   name: "Kaaka" }
  ];

  const villagers = roles.map((r, i) => {
    const baseX = 0.16 + (i / 5) * 0.55 + (rand(i) - 0.5) * 0.06;
    const baseY = 0.22 + rand(i + 10) * 0.56;
    return {
      id: r.id,
      name: r.name,
      x: Math.max(0.14, Math.min(0.73, baseX)),
      y: Math.max(0.18, Math.min(0.82, baseY)),
      hasBaby: i === 0
    };
  });

  const guardCount = Math.min(6, 3 + Math.floor(lvlNum / 3));
  const weapons = ["pistol", "bazooka"];
  const guards = [];
  for (let g = 0; g < guardCount; g++) {
    guards.push({
      x: -0.04 - g * 0.02,
      y: 0.16 + ((g * 0.23 + rand(g + 20) * 0.2) % 0.70),
      weapon: weapons[g % weapons.length],
      speedMul: 1.0,
      spawnDelay: 3.0 + g * 1.0
    });
  }

  const obstacles = [
    { x: 0.34 + rand(1) * 0.08, y: 0.38 + rand(2) * 0.24, w: 44, h: 14 },
    { x: 0.54 + rand(3) * 0.08, y: 0.32 + rand(4) * 0.32, w: 44, h: 14 }
  ];

  const towers = [
    { x: 0.30 + rand(5) * 0.15, y: 0.16, buildStart: 2.0, buildDuration: 2.2, aimDuration: Math.max(2.9, 3.8 - (lvlNum - 5) * 0.08) }
  ];
  if (lvlNum >= 7) {
    towers.push({
      x: 0.52 + rand(6) * 0.15, y: 0.82, buildStart: 3.8, buildDuration: 2.2, aimDuration: Math.max(2.9, 3.8 - (lvlNum - 5) * 0.08)
    });
  }

  // Police speed increases slowly by +1.3 per level (capped at 32.0 so it never gets unfairly fast)
  return {
    level: lvlNum,
    title: "Paradise Frontier " + lvlNum,
    passRadiusRatio: 0.22,
    carrierSpeed: 18,
    wanderSpeed: 20,
    guardSpeed: Math.min(32.0, 19.0 + (lvlNum - 1) * 1.3),
    policeDelay: 3.0,
    villagers,
    guards,
    obstacles,
    towers
  };
};
