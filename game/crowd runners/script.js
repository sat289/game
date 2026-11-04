const viewport = document.getElementById('game-viewport');
const container = document.getElementById('canvas-container');
const playerBadge = document.getElementById('player-badge');
const enemyBadgesContainer = document.getElementById('enemy-badges-container');
const progressFill = document.getElementById('progress-fill');
const levelBadge = document.getElementById('current-level-badge');
const finishIcon = document.getElementById('finish-icon');
const coinAmountEl = document.getElementById('coin-amount');
const statusOverlay = document.getElementById('status-overlay');
const battleBanner = document.getElementById('battle-banner');
const gainPopup = document.getElementById('gain-popup');
const upgradeBar = document.getElementById('upgrade-bar');
const upgradeCrowdBtn = document.getElementById('upgrade-crowd-btn');
const upgradeCostEl = document.getElementById('upgrade-cost');

const bossHud = document.getElementById('boss-hud');
const bossHpText = document.getElementById('boss-hp-text');
const bossBarFill = document.getElementById('boss-bar-fill');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const exitBtn = document.getElementById('exit-btn');
const soundBtn = document.getElementById('sound-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');

const MAX_LEVELS = 50;
let currentLevel = 1;
let coins = 250;
let bonusStartCrowd = 0;
let upgradeCost = 50;

let playerCount = 20;
let isRunning = false;
let isPaused = false;
let soundEnabled = true;
let activeBattleGroup = null;
let levelLength = 240;

// --- 1. LIGHTWEIGHT WEB AUDIO SYNTHESIZER ---
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
  if (!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'gate') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.16);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.18);
  } else if (type === 'hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'clash') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(260 + Math.random() * 100, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'win') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.1);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
  }
}

soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
});

// --- 2. ULTRA-SMOOTH ZERO-LAG SCENE & RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xbae6fd, 0.003);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 350);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
// Capping pixelRatio to 1.5 eliminates mobile GPU lag while keeping visuals crisp
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.88));
const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.72);
dirLight.position.set(-18, 45, 28);
scene.add(dirLight);

// --- 3. POOLED PARTICLES (ZERO GARBAGE COLLECTION LAG) ---
const effectsGroup = new THREE.Group();
scene.add(effectsGroup);
const activeParticles = [];
const particleGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
const blueParticleMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
const redParticleMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
const goldParticleMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

function spawnParticles(worldPos, type = 'blue', count = 5) {
  if (activeParticles.length > 60) return; // Cap active particles for 60fps
  const mat = type === 'blue' ? blueParticleMat : (type === 'red' ? redParticleMat : goldParticleMat);

  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(particleGeo, mat);
    p.position.set(worldPos.x, worldPos.y + 0.8, worldPos.z);
    p.userData = {
      vx: (Math.random() - 0.5) * 0.3,
      vy: 0.14 + Math.random() * 0.2,
      vz: (Math.random() - 0.5) * 0.3,
      life: 1.0
    };
    effectsGroup.add(p);
    activeParticles.push(p);
  }
}

function updateParticles(dt) {
  const step = dt * 60;
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.position.x += p.userData.vx * step;
    p.position.y += p.userData.vy * step;
    p.position.z += p.userData.vz * step;
    p.userData.vy -= 0.015 * step;
    p.userData.life -= 0.045 * step;
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
  void gainPopup.offsetWidth;
  gainPopup.style.animation = 'floatUp 0.65s ease-out forwards';
}

// --- 4. OPTIMIZED CLEAR 3D AVATARS & GIANT BOSS MODEL ---
const avatarGeos = {
  shadow: new THREE.CircleGeometry(0.34, 8),
  head: new THREE.SphereGeometry(0.32, 10, 10),
  eyeWhite: new THREE.SphereGeometry(0.08, 6, 6),
  pupil: new THREE.SphereGeometry(0.04, 6, 6),
  headband: new THREE.CylinderGeometry(0.33, 0.33, 0.09, 10),
  torso: new THREE.CylinderGeometry(0.2, 0.25, 0.66, 8),
  belt: new THREE.CylinderGeometry(0.26, 0.26, 0.11, 8),
  limb: new THREE.CylinderGeometry(0.085, 0.075, 0.38, 6),
  hand: new THREE.SphereGeometry(0.1, 6, 6),
  shoe: new THREE.BoxGeometry(0.17, 0.12, 0.26),
  crown: new THREE.ConeGeometry(0.22, 0.32, 5),
  horn: new THREE.ConeGeometry(0.18, 0.55, 6),
  clubStick: new THREE.CylinderGeometry(0.09, 0.09, 1.4, 6),
  clubHead: new THREE.CylinderGeometry(0.28, 0.18, 0.9, 8)
};

const avatarMats = {
  shadow: new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.25 }),
  blueMain: new THREE.MeshLambertMaterial({ color: 0x0ea5e9 }),
  blueDark: new THREE.MeshLambertMaterial({ color: 0x0369a1 }),
  redMain: new THREE.MeshLambertMaterial({ color: 0xef4444 }),
  redDark: new THREE.MeshLambertMaterial({ color: 0x991b1b }),
  bossMain: new THREE.MeshLambertMaterial({ color: 0xb91c1c }),
  bossDark: new THREE.MeshLambertMaterial({ color: 0x450a0a }),
  white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  black: new THREE.MeshBasicMaterial({ color: 0x0f172a }),
  gold: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
  glowYellow: new THREE.MeshBasicMaterial({ color: 0xfef08a })
};

function createClearAvatar(isPlayer, isLeader = false, isGiantBoss = false) {
  const group = new THREE.Group();
  const mainMat = isGiantBoss ? avatarMats.bossMain : (isPlayer ? avatarMats.blueMain : avatarMats.redMain);
  const darkMat = isGiantBoss ? avatarMats.bossDark : (isPlayer ? avatarMats.blueDark : avatarMats.redDark);
  const faceDir = isPlayer ? -1 : 1;

  const shadow = new THREE.Mesh(avatarGeos.shadow, avatarMats.shadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  const bodyRig = new THREE.Group();
  group.add(bodyRig);

  const head = new THREE.Mesh(avatarGeos.head, mainMat);
  head.position.y = 1.42;
  bodyRig.add(head);

  const headband = new THREE.Mesh(avatarGeos.headband, avatarMats.gold);
  headband.position.y = 1.52;
  bodyRig.add(headband);

  [-0.11, 0.11].forEach(eyeX => {
    const eyeW = new THREE.Mesh(avatarGeos.eyeWhite, isGiantBoss ? avatarMats.glowYellow : avatarMats.white);
    eyeW.position.set(eyeX, 1.44, faceDir * 0.27);
    const pupil = new THREE.Mesh(avatarGeos.pupil, avatarMats.black);
    pupil.position.set(eyeX, 1.44, faceDir * 0.33);
    bodyRig.add(eyeW, pupil);
  });

  if (isLeader && !isGiantBoss) {
    const crown = new THREE.Mesh(avatarGeos.crown, avatarMats.gold);
    crown.position.set(0, 1.84, 0);
    bodyRig.add(crown);
  }

  // Giant Boss Horns
  if (isGiantBoss) {
    const leftHorn = new THREE.Mesh(avatarGeos.horn, avatarMats.gold);
    leftHorn.position.set(-0.28, 1.78, 0);
    leftHorn.rotation.z = 0.45;
    const rightHorn = new THREE.Mesh(avatarGeos.horn, avatarMats.gold);
    rightHorn.position.set(0.28, 1.78, 0);
    rightHorn.rotation.z = -0.45;
    bodyRig.add(leftHorn, rightHorn);
  }

  const torso = new THREE.Mesh(avatarGeos.torso, mainMat);
  torso.position.y = 0.84;
  bodyRig.add(torso);

  const belt = new THREE.Mesh(avatarGeos.belt, darkMat);
  belt.position.y = 0.56;
  bodyRig.add(belt);

  // Arms
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.29, 1.06, 0);
  const leftArm = new THREE.Mesh(avatarGeos.limb, mainMat);
  leftArm.position.y = -0.18;
  const leftGlove = new THREE.Mesh(avatarGeos.hand, avatarMats.white);
  leftGlove.position.y = -0.38;
  leftArmPivot.add(leftArm, leftGlove);
  bodyRig.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.29, 1.06, 0);
  const rightArm = new THREE.Mesh(avatarGeos.limb, mainMat);
  rightArm.position.y = -0.18;
  const rightGlove = new THREE.Mesh(avatarGeos.hand, avatarMats.white);
  rightGlove.position.y = -0.38;
  rightArmPivot.add(rightArm, rightGlove);

  // Boss Giant Spiked War-Club in Right Hand
  if (isGiantBoss) {
    const club = new THREE.Group();
    const stick = new THREE.Mesh(avatarGeos.clubStick, avatarMats.bossDark);
    const cHead = new THREE.Mesh(avatarGeos.clubHead, avatarMats.gold);
    cHead.position.y = 0.6;
    club.add(stick, cHead);
    club.rotation.x = Math.PI / 2;
    club.position.set(0, -0.38, 0.5);
    rightArmPivot.add(club);
  }
  bodyRig.add(rightArmPivot);

  // Legs
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.12, 0.48, 0);
  const leftLeg = new THREE.Mesh(avatarGeos.limb, darkMat);
  leftLeg.position.y = -0.2;
  const leftShoe = new THREE.Mesh(avatarGeos.shoe, avatarMats.white);
  leftShoe.position.set(0, -0.4, faceDir * 0.04);
  leftLegPivot.add(leftLeg, leftShoe);
  bodyRig.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.12, 0.48, 0);
  const rightLeg = new THREE.Mesh(avatarGeos.limb, darkMat);
  rightLeg.position.y = -0.2;
  const rightShoe = new THREE.Mesh(avatarGeos.shoe, avatarMats.white);
  rightShoe.position.set(0, -0.4, faceDir * 0.04);
  rightLegPivot.add(rightLeg, rightShoe);
  bodyRig.add(rightLegPivot);

  if (isLeader && !isGiantBoss) group.scale.setScalar(1.22);
  if (isGiantBoss) group.scale.setScalar(3.4); // Massive Boss Scale!

  group.userData.rig = { bodyRig, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot };
  return group;
}

function animateAvatar(avatar, elapsed, isMoving, speed = 13, isPlayer = true) {
  const rig = avatar.userData.rig;
  if (!rig) return;
  const phase = avatar.userData.phase || 0;

  if (isMoving) {
    const swing = Math.sin(elapsed * speed + phase) * 0.82;
    rig.leftLegPivot.rotation.x = swing;
    rig.rightLegPivot.rotation.x = -swing;
    rig.leftArmPivot.rotation.x = -swing * 0.9;
    rig.rightArmPivot.rotation.x = swing * 0.9;
    rig.bodyRig.rotation.x = isPlayer ? -0.15 : 0.15;
    rig.bodyRig.position.y = Math.abs(Math.sin(elapsed * speed + phase)) * 0.22;
  } else {
    rig.leftLegPivot.rotation.x = 0;
    rig.rightLegPivot.rotation.x = 0;
    rig.leftArmPivot.rotation.x = Math.sin(elapsed * 3 + phase) * 0.12;
    rig.rightArmPivot.rotation.x = -Math.sin(elapsed * 3 + phase) * 0.12;
    rig.bodyRig.rotation.x = 0;
    rig.bodyRig.position.y = 0;
  }
}

// --- 5. CLEAN SURROUNDINGS ---
const envGroup = new THREE.Group();
scene.add(envGroup);

function createSurroundings(isBossLvl) {
  while (envGroup.children.length > 0) envGroup.remove(envGroup.children[0]);
  const rockColor = isBossLvl ? 0x991b1b : 0x38bdf8;

  for (let z = 10; z > -levelLength - 80; z -= 36) {
    [-1, 1].forEach(side => {
      const x = side * (19 + Math.random() * 12);
      const height = 44 + Math.random() * 20;
      const radius = 7 + Math.random() * 3;

      const peak = new THREE.Group();
      const rock = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 5),
        new THREE.MeshLambertMaterial({ color: rockColor, flatShading: true })
      );
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(radius * 0.45, height * 0.4, 5),
        new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true })
      );
      cap.position.y = height * 0.3;
      peak.add(rock, cap);
      peak.position.set(x, height / 2 - 35, z);
      envGroup.add(peak);
    });
  }
}

// --- 6. LEVEL BUILDER: REDUCED OBSTACLES & BOSS EVERY 5 LEVELS ---
const levelGroup = new THREE.Group();
scene.add(levelGroup);

let gates = [];
let obstacles = [];
let enemyGroups = [];

function createGateTexture(label, isMultiply) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = isMultiply ? 'rgba(245, 158, 11, 0.72)' : 'rgba(2, 132, 199, 0.72)';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 7);
  ctx.fillRect(0, 121, 256, 7);

  ctx.font = '900 68px "Segoe UI", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 128, 66);

  return new THREE.CanvasTexture(canvas);
}

// Clean Single Obstacles (1 per step so track is never cluttered!)
function createSingleObstacle(stepIdx, z) {
  const type = stepIdx % 4;

  if (type === 0) {
    // 1. Single Sliding Purple Saw Pillar
    const pillarGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, 0.75, 12),
        new THREE.MeshLambertMaterial({ color: 0x7e22ce })
      );
      cyl.position.y = i * 0.85 + 0.4;
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(1.08, 1.08, 0.12, 8),
        new THREE.MeshBasicMaterial({ color: 0xe9d5ff })
      );
      ring.position.y = i * 0.85 + 0.8;
      pillarGroup.add(cyl, ring);
    }
    pillarGroup.position.set(0, 0, z);
    levelGroup.add(pillarGroup);
    return { modelType: 'sawPillar', mesh: pillarGroup, z, range: 4.5, phase: stepIdx, hitX: 0, radius: 1.35 };
  } else if (type === 1) {
    // 2. Single Overhead Swinging Pendulum Axe
    const group = new THREE.Group();
    const postMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 9, 8), postMat);
    lp.position.set(-7.2, 4.5, 0);
    const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 9, 8), postMat);
    rp.position.set(7.2, 4.5, 0);
    const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 15, 8), postMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.set(0, 8.8, 0);
    group.add(lp, rp, topBar);

    const pivot = new THREE.Group();
    pivot.position.set(0, 8.8, 0);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 7.2, 8), postMat);
    rod.position.y = -3.6;
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 1.8, 0.32),
      new THREE.MeshLambertMaterial({ color: 0xef4444 })
    );
    blade.position.y = -7.2;
    pivot.add(rod, blade);
    group.add(pivot);
    group.position.set(0, 0, z);
    levelGroup.add(group);
    return { modelType: 'pendulumAxe', mesh: group, pivot, z, phase: stepIdx, hitX: 0, radius: 1.9 };
  } else if (type === 2) {
    // 3. Single Center Rotating Cross Saw
    const group = new THREE.Group();
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 2.0, 12),
      new THREE.MeshLambertMaterial({ color: 0xdc2626 })
    );
    hub.position.y = 1.0;
    const bladesGroup = new THREE.Group();
    bladesGroup.position.y = 1.0;
    const bMat = new THREE.MeshLambertMaterial({ color: 0xf97316 });
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.4, 0.5), bMat);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 6.8), bMat);
    bladesGroup.add(b1, b2);
    group.add(hub, bladesGroup);
    group.position.set(0, 0, z);
    levelGroup.add(group);
    return { modelType: 'crossSaw', mesh: group, bladesGroup, z, hitX: 0, radius: 3.1 };
  } else {
    // 4. Single Narrow Spiked Roller on One Side (Easy to steer around!)
    const sideX = stepIdx % 2 === 0 ? -3.0 : 3.0;
    const group = new THREE.Group();
    const roller = new THREE.Group();
    roller.position.y = 1.0;
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 5.2, 12),
      new THREE.MeshLambertMaterial({ color: 0xb91c1c })
    );
    log.rotation.z = Math.PI / 2;
    roller.add(log);
    group.add(roller);
    group.position.set(sideX, 0, z);
    levelGroup.add(group);
    return { modelType: 'spikeRoller', mesh: group, roller, z, hitX: sideX, radius: 2.6 };
  }
}

function buildLevel(lvl) {
  while (levelGroup.children.length > 0) levelGroup.remove(levelGroup.children[0]);
  while (effectsGroup.children.length > 0) effectsGroup.remove(effectsGroup.children[0]);
  enemyBadgesContainer.innerHTML = '';
  gates = [];
  obstacles = [];
  enemyGroups = [];

  const isBossLevel = (lvl % 5 === 0);
  viewport.classList.toggle('boss-theme', isBossLevel);
  finishIcon.textContent = isBossLevel ? '👹' : '🏁';
  bossHud.classList.add('hidden');

  // Spacious 3-section track so objects never pile up on screen
  const totalSteps = 3;
  const STEP_SPACING = 68;
  levelLength = totalSteps * STEP_SPACING + 45;
  const TRACK_WIDTH = 15.4;

  // Road & Curbs
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(TRACK_WIDTH, 2, levelLength + 45),
    new THREE.MeshLambertMaterial({ color: 0xf8fafc })
  );
  road.position.set(0, -1, -levelLength / 2 + 10);
  levelGroup.add(road);

  const curbGeo = new THREE.BoxGeometry(0.45, 2.3, levelLength + 45);
  const curbMat = new THREE.MeshLambertMaterial({ color: isBossLevel ? 0xef4444 : 0x94a3b8 });
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

  for (let step = 1; step <= totalSteps; step++) {
    const baseZ = -step * STEP_SPACING + 32;

    // 1. Alternating Gates (+10 / +15 and ×2)
    const addValue = step % 2 === 0 ? 15 : 10;
    const isMultiplyLeft = (step + lvl) % 2 === 1;

    if (isMultiplyLeft) {
      spawnGate(-3.7, baseZ, 7.1, '×2', 'multiply', 2, true, step);
      spawnGate(3.7, baseZ, 7.1, `+${addValue}`, 'add', addValue, false, step);
    } else {
      spawnGate(-3.7, baseZ, 7.1, `+${addValue}`, 'add', addValue, false, step);
      spawnGate(3.7, baseZ, 7.1, '×2', 'multiply', 2, true, step);
    }

    // 2. ONLY ONE Obstacle per step (Clean, spacious, and easy to read!)
    const obsZ = baseZ - 22;
    obstacles.push(createSingleObstacle(step + lvl, obsZ));

    // 3. Enemy Squad OR Giant Boss on the final step of Boss Levels (5, 10, 15... 50)
    const enemyZ = baseZ - 44;
    if (isBossLevel && step === totalSteps) {
      const bossHp = 80 + lvl * 12;
      spawnGiantBoss(0, enemyZ, bossHp);
    } else {
      const count = Math.min(90, 12 + lvl * 2 + step * 3);
      spawnEnemyCrowd(( step % 2 === 0 ? 2.2 : -2.2 ), enemyZ, count);
    }
  }

  createSurroundings(isBossLevel);
}

function spawnGate(x, z, width, text, operation, value, isMultiply, pairId) {
  const gateGroup = new THREE.Group();
  const height = 3.6;
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: createGateTexture(text, isMultiply),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  banner.position.y = height / 2;
  gateGroup.add(banner);

  const postGeo = new THREE.CylinderGeometry(0.24, 0.24, height + 0.2, 8);
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

function spawnEnemyCrowd(x, z, count) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 20),
    new THREE.MeshBasicMaterial({ color: 0xfca5a5, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.03;
  group.add(disc);

  const avatars = [];
  const visualCount = Math.min(count, 35);
  for (let i = 0; i < visualCount; i++) {
    const redMan = createClearAvatar(false, i === 0, false);
    const r = 0.48 * Math.sqrt(i);
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
    isBoss: false,
    mesh: group,
    disc,
    avatars,
    badge,
    x,
    z,
    count,
    maxCount: count,
    engaged: false,
    defeated: false
  });
}

// Giant Boss Generator for Every 5th Level (5, 10, 15, 20... 50)
function spawnGiantBoss(x, z, bossHp) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(4.8, 24),
    new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.03;
  group.add(disc);

  const giantBossMesh = createClearAvatar(false, true, true);
  giantBossMesh.userData.phase = 0;
  group.add(giantBossMesh);

  group.position.set(x, 0, z);
  levelGroup.add(group);

  const badge = document.createElement('div');
  badge.className = 'crowd-badge boss-badge';
  badge.textContent = `👹 BOSS: ${bossHp}`;
  enemyBadgesContainer.appendChild(badge);

  enemyGroups.push({
    isBoss: true,
    mesh: group,
    disc,
    avatars: [giantBossMesh],
    badge,
    x,
    z,
    count: bossHp,
    maxCount: bossHp,
    engaged: false,
    defeated: false
  });
}

// --- 7. ZERO-LAG COHESIVE PLAYER CROWD ---
const playerCrowdGroup = new THREE.Group();
scene.add(playerCrowdGroup);
const playerAvatars = [];

function assignFormationTargets() {
  for (let i = 0; i < playerAvatars.length; i++) {
    const r = 0.48 * Math.sqrt(i);
    const theta = i * 2.39996;
    playerAvatars[i].userData.targetX = r * Math.cos(theta);
    playerAvatars[i].userData.targetZ = r * Math.sin(theta);
  }
}

function syncPlayerCrowdMeshes() {
  // Capping visual 3D avatars at 65 guarantees silky-smooth 60 FPS on any phone while the counter shows full score!
  const visualCap = Math.max(0, Math.min(playerCount, 65));
  while (playerAvatars.length < visualCap) {
    const isLeader = playerAvatars.length === 0;
    const man = createClearAvatar(true, isLeader, false);
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

function killOnePlayerAvatar(worldPos, isObstacleHit = false) {
  if (playerCount <= 0) return;
  playerCount--;
  syncPlayerCrowdMeshes();

  if (worldPos) spawnParticles(worldPos, 'blue', 4);
  if (isObstacleHit) playSound('hit');
}

function damageEnemyOrBoss(eg) {
  if (eg.count <= 0) return;
  eg.count--;

  if (eg.isBoss) {
    eg.badge.textContent = `👹 BOSS: ${Math.max(0, eg.count)}`;
    bossHpText.textContent = Math.max(0, eg.count);
    bossBarFill.style.width = `${Math.max(0, (eg.count / eg.maxCount) * 100)}%`;
    spawnParticles(eg.mesh.position, 'red', 3);
  } else {
    eg.badge.textContent = Math.max(0, eg.count);
    const targetVisual = Math.min(eg.count, 35);
    while (eg.avatars.length > targetVisual) {
      const victim = eg.avatars.pop();
      eg.mesh.remove(victim);
    }
    spawnParticles(eg.mesh.position, 'red', 3);
  }
}

// --- 8. RESET & CONTROLS ---
function resetLevelState() {
  const isBossLvl = (currentLevel % 5 === 0);
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
  statusOverlay.textContent = isBossLvl
    ? `⚠️ BOSS LEVEL ${currentLevel}! Touch & Drag to Run`
    : `Touch & Drag to Run (Level ${currentLevel} of ${MAX_LEVELS})`;

  while (playerAvatars.length > 0) playerCrowdGroup.remove(playerAvatars.pop());
  syncPlayerCrowdMeshes();
  buildLevel(currentLevel);
}

upgradeCrowdBtn.addEventListener('click', () => {
  initAudio();
  if (coins >= upgradeCost) {
    coins -= upgradeCost;
    bonusStartCrowd += 5;
    upgradeCost += 25;
    playerCount += 5;
    coinAmountEl.textContent = coins;
    upgradeCostEl.textContent = upgradeCost;
    syncPlayerCrowdMeshes();
    playSound('gate');
    spawnParticles(playerCrowdGroup.position, 'gold', 8);
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
  initAudio();
  if (e.target.closest('#hud-top') || e.target.closest('#modal-overlay') || e.target.closest('#upgrade-bar')) return;
  if (!isPaused) { isRunning = true; upgradeBar.classList.add('hidden'); }
});
window.addEventListener('touchstart', (e) => {
  initAudio();
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

// --- 9. DELTA-TIME SMOOTH ANIMATION LOOP (NO LAG) ---
const clock = new THREE.Clock();
let lastDamageTime = 0;
let lastBattleTime = 0;

function projectToScreen(worldPos, yOffset, badgeEl, maxVisibleDist = 200) {
  const distZ = Math.abs(playerCrowdGroup.position.z - worldPos.z);
  // Hide far-away red badges so they never stack up on top of each other!
  if (distZ > maxVisibleDist) {
    badgeEl.style.display = 'none';
    return;
  }
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
  const dt = Math.min(clock.getDelta(), 0.05); // Clamped delta-time prevents frame jumps
  const elapsed = clock.getElapsedTime();

  updateParticles(dt);

  // Animate Single Clean Obstacles
  obstacles.forEach((obs) => {
    if (obs.modelType === 'pendulumAxe') {
      const swingAngle = Math.sin(elapsed * 2.5 + obs.phase) * 0.7;
      obs.pivot.rotation.z = swingAngle;
      obs.hitX = Math.sin(swingAngle) * 7.4;
    } else if (obs.modelType === 'crossSaw') {
      obs.bladesGroup.rotation.y += 4.5 * dt;
    } else if (obs.modelType === 'spikeRoller') {
      obs.roller.rotation.x -= 5.0 * dt;
    } else if (obs.modelType === 'sawPillar') {
      obs.mesh.rotation.y += 4.0 * dt;
      obs.hitX = Math.sin(elapsed * 2.1 + obs.phase) * obs.range;
      obs.mesh.position.x = obs.hitX;
    }
  });

  if (!isPaused) {
    const isMovingNow = isRunning || Boolean(activeBattleGroup);
    const animSpeed = activeBattleGroup ? 17 : 13;
    const lerpFactor = Math.min(1, dt * 12);

    playerAvatars.forEach(man => {
      man.position.x += (man.userData.targetX - man.position.x) * lerpFactor;
      man.position.z += (man.userData.targetZ - man.position.z) * lerpFactor;
      animateAvatar(man, elapsed, isMovingNow, animSpeed, true);
    });

    enemyGroups.forEach(eg => {
      if (!eg.defeated && eg !== activeBattleGroup) {
        eg.avatars.forEach(redMan => animateAvatar(redMan, elapsed, false, 8, false));
      }
    });

    // --- STOP & FIGHT CLASH / BOSS BATTLE MODE ---
    if (activeBattleGroup) {
      const eg = activeBattleGroup;
      playerCrowdGroup.position.x += (eg.x - playerCrowdGroup.position.x) * (dt * 6);
      playerCrowdGroup.position.z += ((eg.z + 2.2) - playerCrowdGroup.position.z) * (dt * 6);

      eg.avatars.forEach(redMan => {
        if (!eg.isBoss) redMan.position.z += dt * 1.8;
        animateAvatar(redMan, elapsed, true, 18, false);
      });

      if (elapsed - lastBattleTime > 0.055) {
        lastBattleTime = elapsed;
        playSound('clash');
        const stepKills = Math.max(1, Math.ceil(Math.min(playerCount, eg.count) / 22));
        for (let k = 0; k < stepKills; k++) {
          if (playerCount > 0 && eg.count > 0) {
            killOnePlayerAvatar(null, false);
            damageEnemyOrBoss(eg);
          }
        }

        if (eg.count <= 0) {
          eg.defeated = true;
          eg.disc.visible = false;
          eg.mesh.visible = false;
          eg.badge.style.display = 'none';
          bossHud.classList.add('hidden');
          activeBattleGroup = null;
          battleBanner.classList.add('hidden');
          spawnParticles(playerCrowdGroup.position, 'gold', 12);
          playSound('win');
          targetX = playerCrowdGroup.position.x;
        }

        if (playerCount <= 0) {
          activeBattleGroup = null;
          battleBanner.classList.add('hidden');
          isPaused = true;
          modalTitle.textContent = eg.isBoss ? 'Crushed by the Boss! 👹' : 'Defeated in Battle! 💀';
          modalSubtitle.textContent = `Upgrade your start avatars & retry Level ${currentLevel}`;
          resumeBtn.textContent = 'Retry Level';
          modalOverlay.classList.remove('hidden');
        }
      }
    }
    // --- SMOOTH FORWARD RUNNING MODE ---
    else if (isRunning) {
      playerCrowdGroup.position.x += (targetX - playerCrowdGroup.position.x) * Math.min(1, dt * 10);
      const forwardSpeed = 15.0 + currentLevel * 0.15;
      playerCrowdGroup.position.z -= forwardSpeed * dt;

      const pct = Math.min(100, Math.max(0, ((8 - playerCrowdGroup.position.z) / (levelLength - 4)) * 100));
      progressFill.style.width = `${pct}%`;

      // Gate Collisions
      gates.forEach(g => {
        if (!g.triggered && Math.abs(playerCrowdGroup.position.z - g.z) < 1.4) {
          if (Math.abs(playerCrowdGroup.position.x - g.x) < g.width / 2 + 0.85) {
            gates.forEach(sibling => {
              if (sibling.pairId === g.pairId) sibling.triggered = true;
            });
            g.mesh.visible = false;

            if (g.operation === 'multiply') playerCount *= g.value;
            if (g.operation === 'add') playerCount += g.value;

            playSound('gate');
            showGainPopup(g.text);
            spawnParticles(playerCrowdGroup.position, 'gold', 8);
            syncPlayerCrowdMeshes();
          }
        }
      });

      // Single Clean Obstacle Collisions
      obstacles.forEach(obs => {
        const dz = Math.abs(playerCrowdGroup.position.z - obs.z);
        const dx = Math.abs(playerCrowdGroup.position.x - obs.hitX);
        if (dz < 1.25 && dx < obs.radius + 0.9) {
          if (elapsed - lastDamageTime > 0.085) {
            lastDamageTime = elapsed;
            killOnePlayerAvatar(new THREE.Vector3(obs.hitX, 0.5, obs.z), true);
          }
        }
      });

      // Engage Enemy Squad or Giant Boss -> Stop & Fight
      enemyGroups.forEach(eg => {
        if (!eg.defeated && !eg.engaged) {
          if (Math.abs(playerCrowdGroup.position.z - eg.z) < 4.5) {
            eg.engaged = true;
            activeBattleGroup = eg;
            battleBanner.textContent = eg.isBoss ? '👹 GIANT BOSS FIGHT! 👹' : '⚔️ CLASH BATTLE! ⚔️';
            battleBanner.classList.remove('hidden');
            if (eg.isBoss) {
              bossHpText.textContent = eg.count;
              bossBarFill.style.width = '100%';
              bossHud.classList.remove('hidden');
            }
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
        playSound('win');
        const isBossLvl = (currentLevel % 5 === 0);
        const reward = (isBossLvl ? 150 : 60) + currentLevel * 15 + playerCount;
        coins += reward;
        coinAmountEl.textContent = coins;
        modalTitle.textContent = isBossLvl
          ? `👹 BOSS LEVEL ${currentLevel} CLEARED! 🏆`
          : `Level ${currentLevel} Victory! 🏆`;
        modalSubtitle.textContent = `+${reward} Coins Earned! (${playerCount} Survivors)`;
        resumeBtn.textContent = currentLevel < MAX_LEVELS ? 'Next Level ➔' : 'Play Again';
        modalOverlay.classList.remove('hidden');
      }
    }
  }

  camera.position.set(0, 14.5, playerCrowdGroup.position.z + 20.0);
  camera.lookAt(0, 1.0, playerCrowdGroup.position.z - 16);

  projectToScreen(playerCrowdGroup.position, 3.2, playerBadge, 300);
  enemyGroups.forEach(eg => {
    if (!eg.defeated) {
      // Only show enemy/boss badge when within 75 units so badges never overlap!
      projectToScreen(eg.mesh.position, eg.isBoss ? 5.6 : 3.0, eg.badge, 75);
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
