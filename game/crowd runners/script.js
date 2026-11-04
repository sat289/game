const container = document.getElementById('canvas-container');
const playerBadge = document.getElementById('player-badge');
const enemyBadgesContainer = document.getElementById('enemy-badges-container');
const progressFill = document.getElementById('progress-fill');
const levelBadge = document.getElementById('current-level-badge');
const coinAmountEl = document.getElementById('coin-amount');
const statusOverlay = document.getElementById('status-overlay'); 
const battleBanner = document.getElementById('battle-banner');
const gainPopup = document.getElementById('gain-popup');
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

const MAX_LEVELS = 50;
let currentLevel = 1;
let coins = 200;
let bonusStartCrowd = 0;
let upgradeCost = 50;

let playerCount = 20;
let isRunning = false;
let isPaused = false;
let activeBattleGroup = null;
let levelLength = 250;

// --- 1. SCENE, CAMERA & RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xbae6fd, 0.003);

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 600);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.82));
const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.72);
dirLight.position.set(-22, 55, 32);
dirLight.castShadow = true;
scene.add(dirLight);

// --- 2. KILL EXPLOSION & GATE CELEBRATION PARTICLES ---
const effectsGroup = new THREE.Group();
scene.add(effectsGroup);
const activeParticles = [];

function spawnParticles(worldPos, colorHex, count = 8) {
  const geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  const mat = new THREE.MeshLambertMaterial({ color: colorHex });

  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(geo, mat);
    p.position.copy(worldPos);
    p.position.y += 0.8;
    p.userData = {
      vx: (Math.random() - 0.5) * 0.32,
      vy: 0.16 + Math.random() * 0.22,
      vz: (Math.random() - 0.5) * 0.32,
      life: 1.0
    };
    effectsGroup.add(p);
    activeParticles.push(p);
  }
}

function updateParticles() {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.position.x += p.userData.vx;
    p.position.y += p.userData.vy;
    p.position.z += p.userData.vz;
    p.userData.vy -= 0.015;
    p.rotation.x += 0.14;
    p.rotation.y += 0.14;
    p.userData.life -= 0.04;
    p.scale.setScalar(Math.max(0.01, p.userData.life));

    if (p.userData.life <= 0 || p.position.y < 0) {
      effectsGroup.remove(p);
      activeParticles.splice(i, 1);
    }
  }
}

function showGainPopup(text) {
  gainPopup.textContent = text;
  gainPopup.classList.remove('hidden');
  gainPopup.style.animation = 'none';
  void gainPopup.offsetWidth; // Trigger reflow
  gainPopup.style.animation = 'floatUp 0.7s ease-out forwards';
}

// --- 3. ATTRACTIVE STYLIZED 3D AVATAR BUILDER ---
// Shared geometries & materials for smooth 60fps performance
const sharedAvatarGeos = {
  head: new THREE.SphereGeometry(0.32, 14, 14),
  visor: new THREE.BoxGeometry(0.38, 0.14, 0.22),
  torso: new THREE.CylinderGeometry(0.2, 0.26, 0.66, 12),
  belt: new THREE.CylinderGeometry(0.265, 0.265, 0.12, 12),
  limb: new THREE.CylinderGeometry(0.085, 0.075, 0.38, 8),
  hand: new THREE.SphereGeometry(0.1, 8, 8),
  shoe: new THREE.BoxGeometry(0.17, 0.12, 0.26),
  crown: new THREE.ConeGeometry(0.22, 0.3, 5)
};

const sharedAvatarMats = {
  blueBody: new THREE.MeshPhongMaterial({ color: 0x0ea5e9, shininess: 95, specular: 0xbae6fd }),
  blueDark: new THREE.MeshLambertMaterial({ color: 0x0369a1 }),
  redBody: new THREE.MeshPhongMaterial({ color: 0xef4444, shininess: 95, specular: 0xfecaca }),
  redDark: new THREE.MeshLambertMaterial({ color: 0x991b1b }),
  visorGlow: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
  whiteMat: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  goldCrown: new THREE.MeshPhongMaterial({ color: 0xfacc15, shininess: 100 })
};

function createAttractiveAvatar(isPlayer, isLeader = false) {
  const group = new THREE.Group();
  const bodyMat = isPlayer ? sharedAvatarMats.blueBody : sharedAvatarMats.redBody;
  const darkMat = isPlayer ? sharedAvatarMats.blueDark : sharedAvatarMats.redDark;

  // Inner rig for tilting forward while running
  const bodyRig = new THREE.Group();
  group.add(bodyRig);

  // 1. Head + Glowing Visor Goggles
  const head = new THREE.Mesh(sharedAvatarGeos.head, bodyMat);
  head.position.y = 1.38;
  bodyRig.add(head);

  const visor = new THREE.Mesh(sharedAvatarGeos.visor, sharedAvatarMats.visorGlow);
  visor.position.set(0, 1.4, isPlayer ? -0.22 : 0.22);
  bodyRig.add(visor);

  // Optional Golden Crown for Squad Leader
  if (isLeader) {
    const crown = new THREE.Mesh(sharedAvatarGeos.crown, sharedAvatarMats.goldCrown);
    crown.position.set(0, 1.78, 0);
    bodyRig.add(crown);
  }

  // 2. Torso & Belt
  const torso = new THREE.Mesh(sharedAvatarGeos.torso, bodyMat);
  torso.position.y = 0.82;
  bodyRig.add(torso);

  const belt = new THREE.Mesh(sharedAvatarGeos.belt, darkMat);
  belt.position.y = 0.55;
  bodyRig.add(belt);

  // 3. Pivoted Left & Right Arms with White Gloves
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.28, 1.05, 0);
  const leftArm = new THREE.Mesh(sharedAvatarGeos.limb, bodyMat);
  leftArm.position.y = -0.18;
  const leftGlove = new THREE.Mesh(sharedAvatarGeos.hand, sharedAvatarMats.whiteMat);
  leftGlove.position.y = -0.38;
  leftArmPivot.add(leftArm, leftGlove);
  bodyRig.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.28, 1.05, 0);
  const rightArm = new THREE.Mesh(sharedAvatarGeos.limb, bodyMat);
  rightArm.position.y = -0.18;
  const rightGlove = new THREE.Mesh(sharedAvatarGeos.hand, sharedAvatarMats.whiteMat);
  rightGlove.position.y = -0.38;
  rightArmPivot.add(rightArm, rightGlove);
  bodyRig.add(rightArmPivot);

  // 4. Pivoted Left & Right Legs with White Sneakers
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.12, 0.48, 0);
  const leftLeg = new THREE.Mesh(sharedAvatarGeos.limb, darkMat);
  leftLeg.position.y = -0.2;
  const leftShoe = new THREE.Mesh(sharedAvatarGeos.shoe, sharedAvatarMats.whiteMat);
  leftShoe.position.set(0, -0.4, isPlayer ? -0.04 : 0.04);
  leftLegPivot.add(leftLeg, leftShoe);
  bodyRig.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.12, 0.48, 0);
  const rightLeg = new THREE.Mesh(sharedAvatarGeos.limb, darkMat);
  rightLeg.position.y = -0.2;
  const rightShoe = new THREE.Mesh(sharedAvatarGeos.shoe, sharedAvatarMats.whiteMat);
  rightShoe.position.set(0, -0.4, isPlayer ? -0.04 : 0.04);
  rightLegPivot.add(rightLeg, rightShoe);
  bodyRig.add(rightLegPivot);

  if (isLeader) {
    group.scale.setScalar(1.22);
  }

  group.userData.rig = {
    bodyRig,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot
  };
  return group;
}

function animateAvatar(avatar, elapsed, isMoving, speed = 13, isPlayer = true) {
  const rig = avatar.userData.rig;
  if (!rig) return;
  const phase = avatar.userData.phase || 0;

  if (isMoving) {
    const swing = Math.sin(elapsed * speed + phase) * 0.85;
    rig.leftLegPivot.rotation.x = swing;
    rig.rightLegPivot.rotation.x = -swing;
    rig.leftArmPivot.rotation.x = -swing * 0.9;
    rig.rightArmPivot.rotation.x = swing * 0.9;

    // Energetic forward lean and side-to-side head bob
    rig.bodyRig.rotation.x = isPlayer ? -0.18 : 0.18;
    rig.bodyRig.rotation.z = Math.cos(elapsed * speed + phase) * 0.08;
    avatar.position.y = Math.abs(Math.sin(elapsed * speed + phase)) * 0.26;
  } else {
    // Smooth idle breathing animation
    rig.leftLegPivot.rotation.x = 0;
    rig.rightLegPivot.rotation.x = 0;
    rig.leftArmPivot.rotation.x = Math.sin(elapsed * 3 + phase) * 0.1;
    rig.rightArmPivot.rotation.x = -Math.sin(elapsed * 3 + phase) * 0.1;
    rig.bodyRig.rotation.x = 0;
    rig.bodyRig.rotation.z = 0;
    avatar.position.y = Math.abs(Math.sin(elapsed * 3 + phase)) * 0.05;
  }
}

// --- 4. SURROUNDINGS (ICY PEAKS & FLOATING CLOUDS) ---
const envGroup = new THREE.Group();
scene.add(envGroup);
const clouds = [];

function createSurroundings() {
  while (envGroup.children.length > 0) envGroup.remove(envGroup.children[0]);
  clouds.length = 0;

  for (let z = 20; z > -levelLength - 100; z -= 24) {
    [-1, 1].forEach(side => {
      const x = side * (18 + Math.random() * 14);
      const height = 45 + Math.random() * 25;
      const radius = 7 + Math.random() * 4;

      const peak = new THREE.Group();
      const rock = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 6),
        new THREE.MeshLambertMaterial({ color: 0x38bdf8, flatShading: true })
      );
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(radius * 0.45, height * 0.4, 6),
        new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true })
      );
      cap.position.y = height * 0.3;
      peak.add(rock, cap);
      peak.position.set(x, height / 2 - 35, z);
      envGroup.add(peak);
    });
  }

  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 20; i++) {
    const cloud = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4 + Math.random(), 1), cloudMat);
      puff.position.set(j * 2 - 2, Math.random() * 0.5, 0);
      cloud.add(puff);
    }
    cloud.position.set(
      (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 20),
      16 + Math.random() * 10,
      -Math.random() * levelLength
    );
    cloud.userData = { baseY: cloud.position.y, phase: Math.random() * 5 };
    envGroup.add(cloud);
    clouds.push(cloud);
  }
}

// --- 5. LEVEL BUILDER (STRICTLY ×2 ONE SIDE, +10 OR +15 OTHER SIDE) ---
const levelGroup = new THREE.Group();
scene.add(levelGroup);

let gates = [];
let obstacles = [];
let enemyGroups = [];

function createGateTexture(label, isMultiplier) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Vibrant Cyan-Blue for +10/+15 and Golden-Cyan for ×2
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  if (isMultiplier) {
    grad.addColorStop(0, 'rgba(14, 165, 233, 0.45)');
    grad.addColorStop(1, 'rgba(37, 99, 235, 0.72)');
  } else {
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    grad.addColorStop(1, 'rgba(2, 132, 199, 0.72)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  // Glowing top and bottom borders
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 7);
  ctx.fillRect(0, 121, 256, 7);

  ctx.font = '900 68px "Segoe UI", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(3, 105, 161, 0.9)';
  ctx.strokeText(label, 128, 66);
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

  levelLength = 220 + lvl * 15;
  const TRACK_WIDTH = 15.2;

  // Road & Curbs
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(TRACK_WIDTH, 2, levelLength + 45),
    new THREE.MeshLambertMaterial({ color: 0xf8fafc })
  );
  road.position.set(0, -1, -levelLength / 2 + 10);
  levelGroup.add(road);

  const curbGeo = new THREE.BoxGeometry(0.45, 2.3, levelLength + 45);
  const curbMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
  const leftCurb = new THREE.Mesh(curbGeo, curbMat);
  leftCurb.position.set(-TRACK_WIDTH / 2 - 0.22, -0.9, -levelLength / 2 + 10);
  const rightCurb = new THREE.Mesh(curbGeo, curbMat);
  rightCurb.position.set(TRACK_WIDTH / 2 + 0.22, -0.9, -levelLength / 2 + 10);
  levelGroup.add(leftCurb, rightCurb);

  // Finish Line Stairs
  const stairColors = [0x38bdf8, 0x34d399, 0xfacc15, 0xf97316, 0xef4444];
  for (let s = 0; s < 5; s++) {
    const stair = new THREE.Mesh(
      new THREE.BoxGeometry(TRACK_WIDTH, 0.5, 4),
      new THREE.MeshLambertMaterial({ color: stairColors[s] })
    );
    stair.position.set(0, 0.25, -levelLength + 10 - s * 4);
    levelGroup.add(stair);
  }

  let pairCounter = 0;
  for (let z = -24; z > -levelLength + 32; z -= 38) {
    pairCounter++;
    // Strictly ONLY ×2 on one side, and +10 or +15 on the other side!
    const addValue = pairCounter % 2 === 0 ? 15 : 10;
    const leftSideIsMultiply = Math.random() > 0.5;
    const pairId = pairCounter;

    if (leftSideIsMultiply) {
      spawnGate(-3.65, z, 7.1, '×2', 'multiply', 2, true, pairId);
      spawnGate(3.65, z, 7.1, `+${addValue}`, 'add', addValue, false, pairId);
    } else {
      spawnGate(-3.65, z, 7.1, `+${addValue}`, 'add', addValue, false, pairId);
      spawnGate(3.65, z, 7.1, '×2', 'multiply', 2, true, pairId);
    }

    // Collaborated Left & Right Moving Purple Obstacles
    const obsZ = z - 14;
    obstacles.push(createMovingObstacle(-3.4, obsZ, 3.8, 0));
    obstacles.push(createMovingObstacle(3.4, obsZ - 4.2, 3.8, Math.PI));

    // Red Enemy Crowd Squad (Triggers Stop & Fight)
    if (z > -levelLength + 52) {
      const enemyZ = z - 25;
      const count = Math.min(130, 16 + lvl * 4);
      spawnEnemyCrowd((Math.random() - 0.5) * 4, enemyZ, count);
    }
  }

  createSurroundings();
}

function spawnGate(x, z, width, text, operation, value, isMultiplier, pairId) {
  const gateGroup = new THREE.Group();
  const height = 3.6;
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: createGateTexture(text, isMultiplier),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  banner.position.y = height / 2;
  gateGroup.add(banner);

  const postGeo = new THREE.CylinderGeometry(0.25, 0.25, height + 0.25, 12);
  const postMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const lp = new THREE.Mesh(postGeo, postMat);
  lp.position.set(-width / 2, height / 2, 0);
  const rp = new THREE.Mesh(postGeo, postMat);
  rp.position.set(width / 2, height / 2, 0);
  gateGroup.add(lp, rp);

  gateGroup.position.set(x, 0, z);
  levelGroup.add(gateGroup);
  gates.push({ mesh: gateGroup, x, z, width, text, operation, value, pairId, triggered: false });
}

function createMovingObstacle(x, z, range, phase) {
  const pillarGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 0.75, 14),
      new THREE.MeshPhongMaterial({ color: 0x7e22ce, shininess: 70 })
    );
    cyl.position.y = i * 0.85 + 0.4;
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(1.06, 1.06, 0.12, 8),
      new THREE.MeshLambertMaterial({ color: 0xe9d5ff })
    );
    ring.position.y = i * 0.85 + 0.8;
    pillarGroup.add(cyl, ring);
  }
  const topCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.15, 12),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  topCap.position.y = 3.5;
  pillarGroup.add(topCap);

  pillarGroup.position.set(x, 0, z);
  levelGroup.add(pillarGroup);

  return {
    mesh: pillarGroup,
    baseX: x,
    z: z,
    range: range,
    phase: phase,
    radius: 1.4
  };
}

function spawnEnemyCrowd(x, z, count) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(3.6, 28),
    new THREE.MeshBasicMaterial({ color: 0xfca5a5, transparent: true, opacity: 0.48, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.03;
  group.add(disc);

  const avatars = [];
  const visualCount = Math.min(count, 60);
  for (let i = 0; i < visualCount; i++) {
    const redMan = createAttractiveAvatar(false, i === 0);
    const r = 0.38 * Math.sqrt(i);
    const a = i * 2.39996;
    redMan.position.set(r * Math.cos(a), 0, r * Math.sin(a));
    redMan.userData.phase = Math.random() * Math.PI * 2;
    group.add(redMan);
    avatars.push(redMan);
  }

  group.position.set(x, 0, z);
  levelGroup.add(group);

  const badge = document.createElement('div');
  badge.className = 'crowd-badge red-badge';
  badge.textContent = count;
  enemyBadgesContainer.appendChild(badge);

  enemyGroups.push({
    mesh: group,
    disc,
    avatars,
    badge,
    x,
    z,
    count,
    engaged: false,
    defeated: false
  });
}

// --- 6. COHESIVE PLAYER CROWD ---
const playerCrowdGroup = new THREE.Group();
scene.add(playerCrowdGroup);
const playerAvatars = [];

function assignFormationTargets() {
  for (let i = 0; i < playerAvatars.length; i++) {
    const r = 0.37 * Math.sqrt(i);
    const theta = i * 2.39996;
    playerAvatars[i].userData.targetX = r * Math.cos(theta);
    playerAvatars[i].userData.targetZ = r * Math.sin(theta);
  }
}

function syncPlayerCrowdMeshes() {
  const visualCap = Math.max(0, Math.min(playerCount, 120));
  while (playerAvatars.length < visualCap) {
    const isLeader = playerAvatars.length === 0;
    const man = createAttractiveAvatar(true, isLeader);
    man.userData.phase = Math.random() * Math.PI * 2;
    man.position.set((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4);
    playerCrowdGroup.add(man);
    playerAvatars.push(man);
  }
  while (playerAvatars.length > visualCap) {
    playerCrowdGroup.remove(playerAvatars.pop());
  }
  assignFormationTargets();
  playerBadge.textContent = Math.max(0, playerCount);
}

function killOnePlayerAvatar(worldPos) {
  if (playerCount <= 0) return;
  playerCount--;
  if (playerAvatars.length > 0) {
    const victim = playerAvatars.pop();
    const vWorld = new THREE.Vector3();
    victim.getWorldPosition(vWorld);
    if (!worldPos) worldPos = vWorld;
    playerCrowdGroup.remove(victim);
  }
  if (worldPos) spawnParticles(worldPos, 0x0ea5e9, 7);
  assignFormationTargets();
  playerBadge.textContent = Math.max(0, playerCount);
}

function killOneEnemyAvatar(eg) {
  if (eg.count <= 0) return;
  eg.count--;
  eg.badge.textContent = Math.max(0, eg.count);
  if (eg.avatars.length > 0) {
    const victim = eg.avatars.pop();
    const vWorld = new THREE.Vector3();
    victim.getWorldPosition(vWorld);
    spawnParticles(vWorld, 0xef4444, 7);
    eg.mesh.remove(victim);
  }
}

// --- 7. RESET & CONTROLS ---
function resetLevelState() {
  playerCount = 20 + bonusStartCrowd + (currentLevel - 1) * 2;
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

  while (playerAvatars.length > 0) playerCrowdGroup.remove(playerAvatars.pop());
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
    spawnParticles(playerCrowdGroup.position, 0xfacc15, 12);
  }
});

let targetX = 0;
function handlePointerMove(clientX) {
  if (isPaused || activeBattleGroup) return;
  const normX = (clientX / window.innerWidth) * 2 - 1;
  targetX = Math.max(-5.6, Math.min(5.6, normX * 6.0));
}

window.addEventListener('mousemove', e => handlePointerMove(e.clientX));
window.addEventListener('mousedown', (e) => {
  if (e.target.closest('#hud-top') || e.target.closest('#modal-overlay') || e.target.closest('#upgrade-bar')) return;
  if (!isPaused) { isRunning = true; upgradeBar.classList.add('hidden'); }
});
window.addEventListener('touchstart', (e) => {
  if (e.target.closest('#hud-top') || e.target.closest('#modal-overlay') || e.target.closest('#upgrade-bar')) return;
  if (!isPaused) { isRunning = true; upgradeBar.classList.add('hidden'); }
  handlePointerMove(e.touches[0].clientX);
});
window.addEventListener('touchmove', e => handlePointerMove(e.touches[0].clientX));

pauseBtn.addEventListener('click', () => {
  isPaused = true;
  modalTitle.textContent = 'Game Paused ⏸️';
  modalSubtitle.textContent = `Level ${currentLevel} / ${MAX_LEVELS}`;
  modalOverlay.classList.remove('hidden');
});
exitBtn.addEventListener('click', () => {
  isPaused = true;
  modalTitle.textContent = 'Exit Game? 🚪';
  modalSubtitle.textContent = `Level ${currentLevel} / ${MAX_LEVELS}`;
  modalOverlay.classList.remove('hidden');
});
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
});

resumeBtn.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
  isPaused = false;
  if (playerCrowdGroup.position.z <= -levelLength + 10) {
    currentLevel = currentLevel < MAX_LEVELS ? currentLevel + 1 : 1;
    resetLevelState();
  } else if (playerCount <= 0) resetLevelState();
});

restartBtn.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
  resetLevelState();
});

// --- 8. MAIN ANIMATION LOOP ---
const clock = new THREE.Clock();
let lastDamageTime = 0;
let lastBattleTime = 0;

function projectToScreen(worldPos, yOffset, badgeEl) {
  const pos = worldPos.clone();
  pos.y += yOffset;
  pos.project(camera);
  if (pos.z > 1) { badgeEl.style.display = 'none'; return; }
  badgeEl.style.display = 'block';
  const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(pos.y * 0.5) + 0.5) * window.innerHeight;
  badgeEl.style.left = `${x}px`;
  badgeEl.style.top = `${y}px`;
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  updateParticles();

  clouds.forEach(c => {
    c.position.y = c.userData.baseY + Math.sin(elapsed * 1.5 + c.userData.phase) * 0.5;
  });

  obstacles.forEach((obs) => {
    obs.mesh.rotation.y += 0.06;
    obs.mesh.position.x = obs.baseX + Math.sin(elapsed * 2.3 + obs.phase) * obs.range;
  });

  if (!isPaused) {
    // Keep all avatars in a tight cohesive group & run limb animations
    const isMovingNow = isRunning || Boolean(activeBattleGroup);
    const animSpeed = activeBattleGroup ? 18 : 13;

    playerAvatars.forEach(man => {
      man.position.x += (man.userData.targetX - man.position.x) * 0.2;
      man.position.z += (man.userData.targetZ - man.position.z) * 0.2;
      animateAvatar(man, elapsed, isMovingNow, animSpeed, true);
    });

    // Idle animation for unengaged enemy crowds
    enemyGroups.forEach(eg => {
      if (!eg.defeated && eg !== activeBattleGroup) {
        eg.avatars.forEach(redMan => animateAvatar(redMan, elapsed, false, 10, false));
      }
    });

    // --- STOP & FIGHT CLASH MODE ---
    if (activeBattleGroup) {
      const eg = activeBattleGroup;
      playerCrowdGroup.position.x += (eg.x - playerCrowdGroup.position.x) * 0.1;
      playerCrowdGroup.position.z += ((eg.z + 1.6) - playerCrowdGroup.position.z) * 0.1;

      eg.avatars.forEach(redMan => {
        redMan.position.z += 0.035;
        animateAvatar(redMan, elapsed, true, 18, false);
      });

      if (elapsed - lastBattleTime > 0.05) {
        lastBattleTime = elapsed;
        const stepKills = Math.max(1, Math.ceil(Math.min(playerCount, eg.count) / 20));
        for (let k = 0; k < stepKills; k++) {
          if (playerCount > 0 && eg.count > 0) {
            killOnePlayerAvatar();
            killOneEnemyAvatar(eg);
          }
        }

        if (eg.count <= 0) {
          eg.defeated = true;
          eg.disc.visible = false;
          eg.badge.style.display = 'none';
          activeBattleGroup = null;
          battleBanner.classList.add('hidden');
          targetX = playerCrowdGroup.position.x;
        }

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
    // --- FORWARD RUNNING MODE ---
    else if (isRunning) {
      playerCrowdGroup.position.x += (targetX - playerCrowdGroup.position.x) * 0.15;
      playerCrowdGroup.position.z -= 0.25 + currentLevel * 0.003;

      const pct = Math.min(100, Math.max(0, ((8 - playerCrowdGroup.position.z) / (levelLength - 4)) * 100));
      progressFill.style.width = `${pct}%`;

      // Gate Collisions (Strictly ×2 or +10/+15, locks sibling gate once passed)
      gates.forEach(g => {
        if (!g.triggered && Math.abs(playerCrowdGroup.position.z - g.z) < 1.3) {
          if (Math.abs(playerCrowdGroup.position.x - g.x) < g.width / 2 + 0.9) {
            // Lock both gates in this pair so only one side can be claimed
            gates.forEach(sibling => {
              if (sibling.pairId === g.pairId) sibling.triggered = true;
            });
            g.mesh.visible = false;

            if (g.operation === 'multiply') playerCount *= g.value;
            if (g.operation === 'add') playerCount += g.value;

            showGainPopup(g.text);
            spawnParticles(playerCrowdGroup.position, 0x38bdf8, 12);
            syncPlayerCrowdMeshes();
          }
        }
      });

      // Moving Purple Saw Obstacle Collisions
      obstacles.forEach(obs => {
        const dz = Math.abs(playerCrowdGroup.position.z - obs.z);
        const dx = Math.abs(playerCrowdGroup.position.x - obs.mesh.position.x);
        if (dz < 1.25 && dx < obs.radius + 1.05) {
          if (elapsed - lastDamageTime > 0.06) {
            lastDamageTime = elapsed;
            killOnePlayerAvatar(new THREE.Vector3(obs.mesh.position.x, 0.5, obs.z));
          }
        }
      });

      // Engage Enemy Squad -> Stop & Fight
      enemyGroups.forEach(eg => {
        if (!eg.defeated && !eg.engaged) {
          if (Math.abs(playerCrowdGroup.position.z - eg.z) < 4.2) {
            eg.engaged = true;
            activeBattleGroup = eg;
            battleBanner.classList.remove('hidden');
          }
        }
      });

      if (playerCount <= 0) {
        isPaused = true;
        modalTitle.textContent = 'Crowd Eliminated! 💥';
        modalSubtitle.textContent = `Try Level ${currentLevel} Again`;
        resumeBtn.textContent = 'Retry Level';
        modalOverlay.classList.remove('hidden');
      }

      if (playerCrowdGroup.position.z <= -levelLength + 10) {
        isPaused = true;
        const reward = 50 + currentLevel * 15 + playerCount;
        coins += reward;
        coinAmountEl.textContent = coins;
        modalTitle.textContent = `Level ${currentLevel} Victory! 🏆`;
        modalSubtitle.textContent = `+${reward} Coins Earned! (${playerCount} Avatars)`;
        resumeBtn.textContent = currentLevel < MAX_LEVELS ? 'Next Level ➔' : 'Play Again';
        modalOverlay.classList.remove('hidden');
      }
    }
  }

  camera.position.set(0, 15.2, playerCrowdGroup.position.z + 21.5);
  camera.lookAt(0, 1.0, playerCrowdGroup.position.z - 18);

  projectToScreen(playerCrowdGroup.position, 3.2, playerBadge);
  enemyGroups.forEach(eg => {
    if (!eg.defeated) projectToScreen(eg.mesh.position, 3.0, eg.badge);
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
