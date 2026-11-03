const container = document.getElementById('canvas-container');
const playerBadge = document.getElementById('player-badge');
const enemyBadgesContainer = document.getElementById('enemy-badges-container');
const progressFill = document.getElementById('progress-fill');
const levelBadge = document.getElementById('current-level-badge');
const coinAmountEl = document.getElementById('coin-amount');
const statusOverlay = document.getElementById('status-overlay');
const battleBanner = document.getElementById('battle-banner');
const upgradeBar = document.getElementById('upgrade-bar');
const upgradeCrowdBtn = document.getElementById('upgrade-crowd-btn');
const upgradeCostEl = document.getElementById('upgrade-cost');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const exitBtn = document.getElementById('exit-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');

// --- GAME STATE (50 HARD LEVELS + UPGRADES) ---
const MAX_LEVELS = 50;
let currentLevel = 1;
let coins = 150;
let bonusStartCrowd = 0;
let upgradeCost = 50;

let playerCount = 20;
let isRunning = false;
let isPaused = false;
let activeBattleGroup = null; // Holds enemy group when stopped for battle
let levelLength = 240;

// --- 1. SCENE, CAMERA & RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x8fd3f4, 0.0035);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 600);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// --- 2. LIGHTING ---
scene.add(new THREE.AmbientLight(0xffffff, 0.78));
const dirLight = new THREE.DirectionalLight(0xfffdf8, 0.65);
dirLight.position.set(-25, 60, 35);
dirLight.castShadow = true;
scene.add(dirLight);

// --- 3. KILL ANIMATION SYSTEM (PARTICLES & FLOOR SPLATTERS) ---
const effectsGroup = new THREE.Group();
scene.add(effectsGroup);

const activeParticles = [];

function spawnKillExplosion(worldPos, colorHex) {
  // 1. Flying 3D Cube Particles
  const count = 9;
  const geo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
  const mat = new THREE.MeshLambertMaterial({ color: colorHex });

  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(geo, mat);
    p.position.copy(worldPos);
    p.position.y += 0.8;
    p.userData = {
      vx: (Math.random() - 0.5) * 0.28,
      vy: 0.14 + Math.random() * 0.22,
      vz: (Math.random() - 0.5) * 0.28,
      life: 1.0
    };
    effectsGroup.add(p);
    activeParticles.push(p);
  }

  // 2. Floor Paint / Splat Mark
  const splatGeo = new THREE.CircleGeometry(0.45 + Math.random() * 0.25, 10);
  const splatMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide
  });
  const splat = new THREE.Mesh(splatGeo, splatMat);
  splat.rotation.x = -Math.PI / 2;
  splat.position.set(worldPos.x, 0.03, worldPos.z);
  effectsGroup.add(splat);
}

function updateKillParticles() {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.position.x += p.userData.vx;
    p.position.y += p.userData.vy;
    p.position.z += p.userData.vz;
    p.userData.vy -= 0.016; // Gravity
    p.rotation.x += 0.15;
    p.rotation.y += 0.15;
    p.userData.life -= 0.04;
    p.scale.setScalar(Math.max(0.01, p.userData.life));

    if (p.userData.life <= 0 || p.position.y < 0) {
      effectsGroup.remove(p);
      activeParticles.splice(i, 1);
    }
  }
}

// --- 4. ANIMATED SURROUNDINGS (MOUNTAINS, CLOUDS, SNOW) ---
const envGroup = new THREE.Group();
scene.add(envGroup);
const clouds = [];

function createAnimatedSurroundings() {
  while (envGroup.children.length > 0) envGroup.remove(envGroup.children[0]);
  clouds.length = 0;

  for (let z = 20; z > -levelLength - 90; z -= 22) {
    [-1, 1].forEach(side => {
      const x = side * (16 + Math.random() * 16);
      const height = 42 + Math.random() * 28;
      const radius = 6 + Math.random() * 5;

      const peakGroup = new THREE.Group();
      const rock = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 6),
        new THREE.MeshLambertMaterial({ color: 0x4ca6cf, flatShading: true })
      );
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(radius * 0.46, height * 0.44, 6),
        new THREE.MeshLambertMaterial({ color: 0xe6f8ff, flatShading: true })
      );
      cap.position.y = height * 0.285;
      peakGroup.add(rock, cap);
      peakGroup.position.set(x, height / 2 - 36, z + (Math.random() * 8 - 4));
      peakGroup.rotation.y = Math.random() * Math.PI;
      envGroup.add(peakGroup);
    });
  }

  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.88 });
  for (let i = 0; i < 24; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 + Math.random() * 1.5, 1), cloudMat);
      puff.position.set(j * 2.1 - 2.1, Math.random() * 0.6, Math.random() * 0.8);
      cloud.add(puff);
    }
    cloud.position.set(
      (Math.random() > 0.5 ? 1 : -1) * (15 + Math.random() * 30),
      14 + Math.random() * 12,
      -Math.random() * (levelLength + 60)
    );
    cloud.userData = { baseY: cloud.position.y, phase: Math.random() * 6 };
    envGroup.add(cloud);
    clouds.push(cloud);
  }
}

// --- 5. ANIMATED AVATAR MESH (WITH RUNNING ARMS & LEGS) ---
function createAvatarMesh(colorHex) {
  const charGroup = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({ color: colorHex, shininess: 70 });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), mat);
  head.position.y = 1.32;

  // Torso
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.68, 8), mat);
  body.position.y = 0.78;

  // Left & Right Legs
  const legGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.45, 6);
  const leftLeg = new THREE.Mesh(legGeo, mat);
  leftLeg.position.set(-0.11, 0.25, 0);
  const rightLeg = new THREE.Mesh(legGeo, mat);
  rightLeg.position.set(0.11, 0.25, 0);

  // Left & Right Arms
  const armGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.42, 6);
  const leftArm = new THREE.Mesh(armGeo, mat);
  leftArm.position.set(-0.28, 0.82, 0);
  const rightArm = new THREE.Mesh(armGeo, mat);
  rightArm.position.set(0.28, 0.82, 0);

  charGroup.add(head, body, leftLeg, rightLeg, leftArm, rightArm);
  charGroup.userData.limbs = { leftLeg, rightLeg, leftArm, rightArm };
  return charGroup;
}

function animateAvatarLimbs(avatar, elapsed, speedMultiplier = 10) {
  const limbs = avatar.userData.limbs;
  if (!limbs) return;
  const angle = Math.sin(elapsed * speedMultiplier + (avatar.userData.phase || 0)) * 0.65;
  limbs.leftLeg.rotation.x = angle;
  limbs.rightLeg.rotation.x = -angle;
  limbs.leftArm.rotation.x = -angle;
  limbs.rightArm.rotation.x = angle;
}

// --- 6. LEVEL BUILDER (DIVERSE MOVING OBSTACLES & ENEMY SQUADS) ---
const levelGroup = new THREE.Group();
scene.add(levelGroup);

let gates = [];
let obstacles = [];
let enemyGroups = [];

function createGateTexture(label, isPositive) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = isPositive ? 'rgba(0, 185, 255, 0.5)' : 'rgba(244, 63, 94, 0.55)';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(0, 0, 256, 6);
  ctx.fillRect(0, 122, 256, 6);

  ctx.font = '900 62px "Segoe UI", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 128, 66);

  return new THREE.CanvasTexture(canvas);
}

function buildLevel(lvl) {
  while (levelGroup.children.length > 0) levelGroup.remove(levelGroup.children[0]);
  while (effectsGroup.children.length > 0) effectsGroup.remove(effectsGroup.children[0]);
  enemyBadgesContainer.innerHTML = '';
  gates = [];
  obstacles = [];
  enemyGroups = [];

  levelLength = 210 + lvl * 15;
  const TRACK_WIDTH = 15.5;

  // Road & Curbs
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(TRACK_WIDTH, 2, levelLength + 50),
    new THREE.MeshLambertMaterial({ color: 0xf8fafc })
  );
  road.position.set(0, -1, -levelLength / 2 + 10);
  levelGroup.add(road);

  const curbGeo = new THREE.BoxGeometry(0.45, 2.3, levelLength + 50);
  const curbMat = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
  const leftCurb = new THREE.Mesh(curbGeo, curbMat);
  leftCurb.position.set(-TRACK_WIDTH / 2 - 0.22, -0.9, -levelLength / 2 + 10);
  const rightCurb = new THREE.Mesh(curbGeo, curbMat);
  rightCurb.position.set(TRACK_WIDTH / 2 + 0.22, -0.9, -levelLength / 2 + 10);
  levelGroup.add(leftCurb, rightCurb);

  // End-of-Level Bonus Multiplier Stairs
  const stairColors = [0x38bdf8, 0x34d399, 0xfacc15, 0xf97316, 0xef4444];
  for (let s = 0; s < 5; s++) {
    const stair = new THREE.Mesh(
      new THREE.BoxGeometry(TRACK_WIDTH, 0.5, 4),
      new THREE.MeshLambertMaterial({ color: stairColors[s] })
    );
    stair.position.set(0, 0.25, -levelLength + 10 - s * 4);
    levelGroup.add(stair);
  }

  // Generate Dynamic Sections Along Track
  for (let z = -22; z > -levelLength + 34; z -= 38) {
    // 1. Gates (Mix of +, x, and hazardous - gates on higher levels)
    const addVal = Math.floor(10 + lvl * 2 + Math.random() * 20);
    const multVal = Math.random() > 0.68 ? 3 : 2;
    const hasPenaltyGate = lvl >= 2 && Math.random() > 0.45;

    if (hasPenaltyGate) {
      const penVal = Math.floor(8 + lvl * 2.5);
      const leftIsGood = Math.random() > 0.5;
      if (leftIsGood) {
        spawnGate(-3.7, z, 7.1, `+${addVal}`, 'add', addVal, true);
        spawnGate(3.7, z, 7.1, `-${penVal}`, 'sub', penVal, false);
      } else {
        spawnGate(-3.7, z, 7.1, `-${penVal}`, 'sub', penVal, false);
        spawnGate(3.7, z, 7.1, `x${multVal}`, 'multiply', multVal, true);
      }
    } else {
      spawnGate(-3.7, z, 7.1, `+${addVal}`, 'add', addVal, true);
      spawnGate(3.7, z, 7.1, `x${multVal}`, 'multiply', multVal, true);
    }

    // 2. Collaborated Left/Right Moving & Spinning Obstacles
    const obsZ = z - 13;
    const pattern = Math.floor(Math.random() * 3);

    if (pattern === 0) {
      // Two Purple Saws sliding Left & Right in opposite directions
      obstacles.push(createPurplePillar(-3.5, obsZ, true, 0, 4.2));
      obstacles.push(createPurplePillar(3.5, obsZ - 4.5, true, Math.PI, 4.2));
    } else if (pattern === 1) {
      // Zig-Zag Trio across Left, Center, Right + 1 Moving Slider
      obstacles.push(createPurplePillar(-4.8, obsZ, false, 0, 0));
      obstacles.push(createPurplePillar(4.8, obsZ, false, 0, 0));
      obstacles.push(createPurplePillar(0, obsZ - 4.5, true, 1.2, 3.8));
    } else {
      // Rotating Red Horizontal Hammer Bar + Side Pillars
      obstacles.push(createSpinningHammer(0, obsZ));
      obstacles.push(createPurplePillar(-5.2, obsZ - 4, false, 0, 0));
      obstacles.push(createPurplePillar(5.2, obsZ - 4, false, 0, 0));
    }

    // 3. Red Enemy Crowd Zone (Triggers Stop & Fight)
    const enemyZ = z - 26;
    const enemyCount = Math.min(130, Math.floor(14 + lvl * 4.5 + Math.random() * 10));
    const enemyX = (Math.random() - 0.5) * 4.5;
    spawnEnemyCrowd(enemyX, enemyZ, enemyCount);
  }

  createAnimatedSurroundings();
}

function spawnGate(x, z, width, text, operation, value, isPositive) {
  const gateGroup = new THREE.Group();
  const height = 3.5;
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: createGateTexture(text, isPositive),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  banner.position.y = height / 2;
  gateGroup.add(banner);

  const postGeo = new THREE.CylinderGeometry(0.24, 0.24, height + 0.2, 12);
  const postMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const lp = new THREE.Mesh(postGeo, postMat);
  lp.position.set(-width / 2, height / 2, 0);
  const rp = new THREE.Mesh(postGeo, postMat);
  rp.position.set(width / 2, height / 2, 0);
  gateGroup.add(lp, rp);

  gateGroup.position.set(x, 0, z);
  levelGroup.add(gateGroup);
  gates.push({ mesh: gateGroup, x, z, width, operation, value, triggered: false });
}

function createPurplePillar(x, z, isMoving, phase, range) {
  const pillarGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 0.75, 14),
      new THREE.MeshPhongMaterial({ color: 0x7e22ce })
    );
    cyl.position.y = i * 0.85 + 0.4;
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(1.05, 1.05, 0.12, 8),
      new THREE.MeshLambertMaterial({ color: 0xd8b4fe })
    );
    ring.position.y = i * 0.85 + 0.8;
    pillarGroup.add(cyl, ring);
  }
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.15, 12),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  cap.position.y = 3.5;
  pillarGroup.add(cap);

  pillarGroup.position.set(x, 0, z);
  levelGroup.add(pillarGroup);

  return {
    type: 'pillar',
    mesh: pillarGroup,
    baseX: x,
    z: z,
    isMoving,
    phase,
    range,
    radius: 1.45
  };
}

function createSpinningHammer(x, z) {
  const group = new THREE.Group();
  const centerPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 2.2, 14),
    new THREE.MeshPhongMaterial({ color: 0xb91c1c })
  );
  centerPost.position.y = 1.1;

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(8.5, 0.45, 0.45),
    new THREE.MeshPhongMaterial({ color: 0xef4444 })
  );
  arm.position.y = 0.9;

  group.add(centerPost, arm);
  group.position.set(x, 0, z);
  levelGroup.add(group);

  return {
    type: 'hammer',
    mesh: group,
    baseX: x,
    z: z,
    isMoving: false,
    radius: 3.8
  };
}

function spawnEnemyCrowd(x, z, count) {
  const group = new THREE.Group();

  // Red Circular Arena Floor
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(3.6, 28),
    new THREE.MeshBasicMaterial({ color: 0xfca5a5, transparent: true, opacity: 0.48, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.03;
  group.add(disc);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3.45, 3.7, 28),
    new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);

  const avatars = [];
  const visualCount = Math.min(count, 65);
  for (let i = 0; i < visualCount; i++) {
    const redMan = createAvatarMesh(0xef4444);
    const r = 0.36 * Math.sqrt(i);
    const a = i * 2.39996;
    redMan.userData.baseX = r * Math.cos(a);
    redMan.userData.baseZ = r * Math.sin(a);
    redMan.userData.phase = Math.random() * Math.PI * 2;
    redMan.position.set(redMan.userData.baseX, 0, redMan.userData.baseZ);
    group.add(redMan);
    avatars.push(redMan);
  }

  group.position.set(x, 0, z);
  levelGroup.add(group);

  // Floating HTML Badge for Red Enemy Squad
  const badge = document.createElement('div');
  badge.className = 'crowd-badge red-badge';
  badge.textContent = count;
  enemyBadgesContainer.appendChild(badge);

  enemyGroups.push({
    mesh: group,
    disc,
    ring,
    avatars,
    badge,
    x,
    z,
    count,
    engaged: false,
    defeated: false
  });
}

// --- 7. COHESIVE PLAYER CROWD (TIGHT GROUP FORMATION) ---
const playerCrowdGroup = new THREE.Group();
scene.add(playerCrowdGroup);
const playerStickmen = [];

function assignFormationTargets() {
  for (let i = 0; i < playerStickmen.length; i++) {
    const r = 0.35 * Math.sqrt(i);
    const theta = i * 2.39996; // Golden angle spiral
    playerStickmen[i].userData.targetX = r * Math.cos(theta);
    playerStickmen[i].userData.targetZ = r * Math.sin(theta);
  }
}

function syncPlayerCrowdMeshes() {
  const visualCap = Math.max(0, Math.min(playerCount, 120));
  while (playerStickmen.length < visualCap) {
    const man = createAvatarMesh(0x0284c7);
    man.userData.phase = Math.random() * Math.PI * 2;
    man.position.set((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5);
    playerCrowdGroup.add(man);
    playerStickmen.push(man);
  }
  while (playerStickmen.length > visualCap) {
    const removed = playerStickmen.pop();
    playerCrowdGroup.remove(removed);
  }
  assignFormationTargets();
  playerBadge.textContent = Math.max(0, playerCount);
}

// Kill single player stickman with 3D particle burst
function killOnePlayerAvatar(worldImpactPos) {
  if (playerCount <= 0) return;
  playerCount--;
  let burstPos = worldImpactPos;

  if (playerStickmen.length > 0) {
    const victim = playerStickmen.pop();
    const vWorld = new THREE.Vector3();
    victim.getWorldPosition(vWorld);
    if (!burstPos) burstPos = vWorld;
    playerCrowdGroup.remove(victim);
  }

  if (burstPos) spawnKillExplosion(burstPos, 0x0284c7);
  assignFormationTargets();
  playerBadge.textContent = Math.max(0, playerCount);
}

// Kill single red enemy stickman with 3D particle burst
function killOneEnemyAvatar(eg) {
  if (eg.count <= 0) return;
  eg.count--;
  eg.badge.textContent = Math.max(0, eg.count);

  if (eg.avatars.length > 0) {
    const victim = eg.avatars.pop();
    const vWorld = new THREE.Vector3();
    victim.getWorldPosition(vWorld);
    spawnKillExplosion(vWorld, 0xef4444);
    eg.mesh.remove(victim);
  }
}

// --- 8. RESET & UPGRADE HANDLERS ---
function resetLevelState() {
  playerCount = 20 + bonusStartCrowd + (currentLevel - 1) * 3;
  playerCrowdGroup.position.set(0, 0, 8);
  targetX = 0;
  isRunning = false;
  isPaused = false;
  activeBattleGroup = null;
  battleBanner.classList.add('hidden');
  upgradeBar.classList.remove('hidden');

  levelBadge.textContent = currentLevel;
  progressFill.style.width = '0%';
  statusOverlay.textContent = `Touch & Drag to Run (Level ${currentLevel} of ${MAX_LEVELS})`;

  while (playerStickmen.length > 0) playerCrowdGroup.remove(playerStickmen.pop());
  syncPlayerCrowdMeshes();
  buildLevel(currentLevel);
}

upgradeCrowdBtn.addEventListener('click', () => {
  if (coins >= upgradeCost) {
    coins -= upgradeCost;
    bonusStartCrowd += 5;
    upgradeCost += 25;
    playerCount += 5;
    coinAmountEl.textContent = coins;
    upgradeCostEl.textContent = upgradeCost;
    syncPlayerCrowdMeshes();
  }
});

// --- 9. CONTROLS (STEERING, PAUSE, EXIT, FULLSCREEN) ---
let targetX = 0;

function handlePointerMove(clientX) {
  if (isPaused || activeBattleGroup) return; // Lock steering during battle
  const normX = (clientX / window.innerWidth) * 2 - 1;
  targetX = Math.max(-5.8, Math.min(5.8, normX * 6.2));
}

window.addEventListener('mousemove', e => handlePointerMove(e.clientX));
window.addEventListener('mousedown', (e) => {
  if (e.target.closest('#hud-top') || e.target.closest('#modal-overlay') || e.target.closest('#upgrade-bar')) return;
  if (!isPaused) {
    isRunning = true;
    upgradeBar.classList.add('hidden');
  }
});

window.addEventListener('touchstart', (e) => {
  if (e.target.closest('#hud-top') || e.target.closest('#modal-overlay') || e.target.closest('#upgrade-bar')) return;
  if (!isPaused) {
    isRunning = true;
    upgradeBar.classList.add('hidden');
  }
  handlePointerMove(e.touches[0].clientX);
});
window.addEventListener('touchmove', e => handlePointerMove(e.touches[0].clientX));

pauseBtn.addEventListener('click', () => {
  isPaused = true;
  modalTitle.textContent = 'Game Paused ⏸️';
  modalSubtitle.textContent = `Level ${currentLevel} / ${MAX_LEVELS}`;
  resumeBtn.textContent = 'Resume Game';
  modalOverlay.classList.remove('hidden');
});

exitBtn.addEventListener('click', () => {
  isPaused = true;
  modalTitle.textContent = 'Exit to Main Menu? 🚪';
  modalSubtitle.textContent = `Current Level: ${currentLevel} of ${MAX_LEVELS}`;
  resumeBtn.textContent = 'Continue Playing';
  modalOverlay.classList.remove('hidden');
});

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

resumeBtn.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
  isPaused = false;
  if (playerCrowdGroup.position.z <= -levelLength + 12) {
    currentLevel = currentLevel < MAX_LEVELS ? currentLevel + 1 : 1;
    resetLevelState();
  } else if (playerCount <= 0) {
    resetLevelState();
  }
});

restartBtn.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
  resetLevelState();
});

// --- 10. MAIN GAME & BATTLE LOOP ---
const clock = new THREE.Clock();
let lastObstacleDamageTime = 0;
let lastBattleTickTime = 0;

function projectToScreen(worldPos, yOffset, badgeEl) {
  const pos = worldPos.clone();
  pos.y += yOffset;
  pos.project(camera);
  if (pos.z > 1) {
    badgeEl.style.display = 'none';
    return;
  }
  badgeEl.style.display = 'block';
  const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(pos.y * 0.5) + 0.5) * window.innerHeight;
  badgeEl.style.left = `${x}px`;
  badgeEl.style.top = `${y}px`;
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  updateKillParticles();

  // Animate Floating Clouds
  clouds.forEach(c => {
    c.position.y = c.userData.baseY + Math.sin(elapsed * 1.5 + c.userData.phase) * 0.6;
  });

  // Animate Rotating & Moving Obstacles
  obstacles.forEach(obs => {
    obs.mesh.rotation.y += obs.type === 'hammer' ? 0.085 : 0.06;
    if (obs.isMoving) {
      obs.mesh.position.x = obs.baseX + Math.sin(elapsed * 2.4 + obs.phase) * obs.range;
    }
  });

  if (!isPaused) {
    // Cohesive Crowd Swarm Physics: Smoothly pull every blue stickman to its tight spiral slot
    playerStickmen.forEach(man => {
      man.position.x += (man.userData.targetX - man.position.x) * 0.18;
      man.position.z += (man.userData.targetZ - man.position.z) * 0.18;

      if (isRunning || activeBattleGroup) {
        const animSpeed = activeBattleGroup ? 18 : 11;
        man.position.y = Math.abs(Math.sin(elapsed * animSpeed + man.userData.phase)) * 0.25;
        animateAvatarLimbs(man, elapsed, animSpeed);
      } else {
        man.position.y = 0;
      }
    });

    // --- STATE A: STOPPED FOR RED CROWD CLASH BATTLE ---
    if (activeBattleGroup) {
      const eg = activeBattleGroup;

      // Pull both crowds toward the clash center
      playerCrowdGroup.position.x += (eg.x - playerCrowdGroup.position.x) * 0.08;
      playerCrowdGroup.position.z += ((eg.z + 1.8) - playerCrowdGroup.position.z) * 0.08;

      // Animate Red Avatars charging toward Blue Crowd
      eg.avatars.forEach(redMan => {
        redMan.position.z += 0.04;
        redMan.position.y = Math.abs(Math.sin(elapsed * 18 + redMan.userData.phase)) * 0.25;
        animateAvatarLimbs(redMan, elapsed, 18);
      });

      // Clash Kill Tick (Mutual attrition with 3D explosion bursts)
      if (elapsed - lastBattleTickTime > 0.055) {
        lastBattleTickTime = elapsed;
        const killsPerTick = Math.max(1, Math.ceil(Math.min(playerCount, eg.count) / 18));

        for (let k = 0; k < killsPerTick; k++) {
          if (playerCount > 0 && eg.count > 0) {
            killOnePlayerAvatar();
            killOneEnemyAvatar(eg);
          }
        }

        // Did Red Squad get wiped out?
        if (eg.count <= 0) {
          eg.defeated = true;
          eg.disc.visible = false;
          eg.ring.visible = false;
          eg.badge.style.display = 'none';
          activeBattleGroup = null;
          battleBanner.classList.add('hidden');
          targetX = playerCrowdGroup.position.x; // Resume running smoothly
        }

        // Did Player Crowd get wiped out?
        if (playerCount <= 0) {
          activeBattleGroup = null;
          battleBanner.classList.add('hidden');
          isPaused = true;
          modalTitle.textContent = 'Defeated in Battle! 💀';
          modalSubtitle.textContent = `Red Squad won on Level ${currentLevel}`;
          resumeBtn.textContent = 'Retry Level';
          modalOverlay.classList.remove('hidden');
        }
      }
    }

    // --- STATE B: NORMAL FORWARD RUNNING ---
    else if (isRunning) {
      playerCrowdGroup.position.x += (targetX - playerCrowdGroup.position.x) * 0.14;
      const runSpeed = 0.25 + currentLevel * 0.0035;
      playerCrowdGroup.position.z -= runSpeed;

      // Update Progress Bar
      const pct = Math.min(100, Math.max(0, ((8 - playerCrowdGroup.position.z) / (levelLength - 4)) * 100));
      progressFill.style.width = `${pct}%`;

      // 1. Check Gate Collisions
      gates.forEach(g => {
        if (!g.triggered && Math.abs(playerCrowdGroup.position.z - g.z) < 1.3) {
          if (Math.abs(playerCrowdGroup.position.x - g.x) < g.width / 2 + 1.0) {
            g.triggered = true;
            g.mesh.visible = false;
            if (g.operation === 'multiply') playerCount *= g.value;
            if (g.operation === 'add') playerCount += g.value;
            if (g.operation === 'sub') {
              const loss = Math.min(playerCount, g.value);
              for (let i = 0; i < Math.min(loss, 8); i++) {
                spawnKillExplosion(playerCrowdGroup.position, 0x0284c7);
              }
              playerCount = Math.max(0, playerCount - g.value);
            }
            syncPlayerCrowdMeshes();
          }
        }
      });

      // 2. Check Collaborated / Moving Obstacle Collisions (With Kill Particle Burst)
      const crowdRadius = Math.min(2.8, 0.35 * Math.sqrt(playerStickmen.length));
      obstacles.forEach(obs => {
        const dz = Math.abs(playerCrowdGroup.position.z - obs.z);
        const dx = Math.abs(playerCrowdGroup.position.x - obs.mesh.position.x);

        if (dz < 1.35 && dx < obs.radius + crowdRadius * 0.65) {
          if (elapsed - lastObstacleDamageTime > 0.065) {
            lastObstacleDamageTime = elapsed;
            const hitPos = new THREE.Vector3(
              (playerCrowdGroup.position.x + obs.mesh.position.x) * 0.5,
              0.5,
              obs.z
            );
            killOnePlayerAvatar(hitPos);
          }
        }
      });

      // 3. Check Red Enemy Squad Proximity -> STOP & FIGHT!
      enemyGroups.forEach(eg => {
        if (!eg.defeated && !eg.engaged) {
          const dz = Math.abs(playerCrowdGroup.position.z - eg.z);
          if (dz < 4.5) {
            eg.engaged = true;
            activeBattleGroup = eg;
            battleBanner.classList.remove('hidden');
          }
        }
      });

      // Check Game Over from Obstacles
      if (playerCount <= 0) {
        isPaused = true;
        modalTitle.textContent = 'Crowd Eliminated! 💥';
        modalSubtitle.textContent = `Try Level ${currentLevel} Again`;
        resumeBtn.textContent = 'Retry Level';
        modalOverlay.classList.remove('hidden');
      }

      // Check Level Complete
      if (playerCrowdGroup.position.z <= -levelLength + 10) {
        isPaused = true;
        const reward = 60 + currentLevel * 15 + playerCount * 2;
        coins += reward;
        coinAmountEl.textContent = coins;
        modalTitle.textContent = `Level ${currentLevel} Victory! 🏆`;
        modalSubtitle.textContent = `+${reward} Coins Earned! (${playerCount} Survivors)`;
        resumeBtn.textContent = currentLevel < MAX_LEVELS ? 'Next Level ➔' : 'Play Again';
        modalOverlay.classList.remove('hidden');
      }
    }
  }

  // Smooth Follow Camera
  camera.position.set(0, 16.0, playerCrowdGroup.position.z + 23.0);
  camera.lookAt(0, 1.0, playerCrowdGroup.position.z - 18);

  // Update 2D Floating Badges for Player & Active Enemy Squads
  projectToScreen(playerCrowdGroup.position, 3.1, playerBadge);
  enemyGroups.forEach(eg => {
    if (!eg.defeated) {
      projectToScreen(eg.mesh.position, 3.0, eg.badge);
    }
  });

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

resetLevelState();
animate();
