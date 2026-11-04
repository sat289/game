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
let coins = 300;
let bonusStartCrowd = 0;
let upgradeCost = 40;

let playerCount = 20;
let isRunning = false;
let isPaused = false;
let soundEnabled = true;
let activeBattleGroup = null;
let levelLength = 250;
let isEndingCelebration = false;

// --- 1. WEB AUDIO SYNTHESIZER ---
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
    osc.frequency.exponentialRampYToValueAtTime ? osc.frequency.exponentialRampToValueAtTime(980, now + 0.16) : osc.frequency.setValueAtTime(980, now + 0.16);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.18);
  } else if (type === 'hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'win') {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, now + idx * 0.08);
      g.gain.setValueAtTime(0.2, now + idx * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(now + idx * 0.08);
      o.stop(now + idx * 0.08 + 0.2);
    });
  }
}

soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
});

// --- 2. 3D SCENE & RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xbae6fd, 0.0025);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 350);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
dirLight.position.set(-20, 50, 30);
scene.add(dirLight);

// --- 3. PARTICLES SYSTEM ---
const effectsGroup = new THREE.Group();
scene.add(effectsGroup);
const activeParticles = [];
const pGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
const blueMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
const goldMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

function spawnParticles(pos, type = 'blue', count = 5) {
  if (activeParticles.length > 55) return;
  const mat = type === 'blue' ? blueMat : (type === 'red' ? redMat : goldMat);
  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(pGeo, mat);
    p.position.set(pos.x, pos.y + 0.8, pos.z);
    p.userData = {
      vx: (Math.random() - 0.5) * 0.32,
      vy: 0.15 + Math.random() * 0.22,
      vz: (Math.random() - 0.5) * 0.32,
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

// --- 4. ATTRACTIVE HD 3D AVATARS ---
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
  bossMain: new THREE.MeshLambertMaterial({ color: 0x7e22ce }),
  bossDark: new THREE.MeshLambertMaterial({ color: 0x3b0764 }),
  white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  black: new THREE.MeshBasicMaterial({ color: 0x0f172a }),
  gold: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
  glowYellow: new THREE.MeshBasicMaterial({ color: 0xfef08a })
};

function createClearAvatar(isPlayer, isLeader = false, isBoss = false) {
  const group = new THREE.Group();
  const mainMat = isBoss ? avatarMats.bossMain : (isPlayer ? avatarMats.blueMain : avatarMats.redMain);
  const darkMat = isBoss ? avatarMats.bossDark : (isPlayer ? avatarMats.blueDark : avatarMats.redDark);
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
    const eyeW = new THREE.Mesh(avatarGeos.eyeWhite, isBoss ? avatarMats.glowYellow : avatarMats.white);
    eyeW.position.set(eyeX, 1.44, faceDir * 0.27);
    const pupil = new THREE.Mesh(avatarGeos.pupil, avatarMats.black);
    pupil.position.set(eyeX, 1.44, faceDir * 0.33);
    bodyRig.add(eyeW, pupil);
  });

  if (isLeader && !isBoss) {
    const crown = new THREE.Mesh(avatarGeos.crown, avatarMats.gold);
    crown.position.set(0, 1.84, 0);
    bodyRig.add(crown);
  }

  if (isBoss) {
    const leftH = new THREE.Mesh(avatarGeos.horn, avatarMats.gold);
    leftH.position.set(-0.28, 1.78, 0); leftH.rotation.z = 0.45;
    const rightH = new THREE.Mesh(avatarGeos.horn, avatarMats.gold);
    rightH.position.set(0.28, 1.78, 0); rightH.rotation.z = -0.45;
    bodyRig.add(leftH, rightH);
  }

  const torso = new THREE.Mesh(avatarGeos.torso, mainMat);
  torso.position.y = 0.84;
  bodyRig.add(torso);

  const belt = new THREE.Mesh(avatarGeos.belt, darkMat);
  belt.position.y = 0.56;
  bodyRig.add(belt);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.29, 1.06, 0);
  const leftArm = new THREE.Mesh(avatarGeos.limb, mainMat); leftArm.position.y = -0.18;
  const leftGlove = new THREE.Mesh(avatarGeos.hand, avatarMats.white); leftGlove.position.y = -0.38;
  leftArmPivot.add(leftArm, leftGlove);
  bodyRig.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.29, 1.06, 0);
  const rightArm = new THREE.Mesh(avatarGeos.limb, mainMat); rightArm.position.y = -0.18;
  const rightGlove = new THREE.Mesh(avatarGeos.hand, avatarMats.white); rightGlove.position.y = -0.38;
  rightArmPivot.add(rightArm, rightGlove);

  if (isBoss) {
    const club = new THREE.Group();
    const stick = new THREE.Mesh(avatarGeos.clubStick, avatarMats.bossDark);
    const cHead = new THREE.Mesh(avatarGeos.clubHead, avatarMats.gold); cHead.position.y = 0.6;
    club.add(stick, cHead); club.rotation.x = Math.PI / 2; club.position.set(0, -0.38, 0.5);
    rightArmPivot.add(club);
  }
  bodyRig.add(rightArmPivot);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.12, 0.48, 0);
  const leftLeg = new THREE.Mesh(avatarGeos.limb, darkMat); leftLeg.position.y = -0.2;
  const leftShoe = new THREE.Mesh(avatarGeos.shoe, avatarMats.white); leftShoe.position.set(0, -0.4, faceDir * 0.04);
  leftLegPivot.add(leftLeg, leftShoe);
  bodyRig.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.12, 0.48, 0);
  const rightLeg = new THREE.Mesh(avatarGeos.limb, darkMat); rightLeg.position.y = -0.2;
  const rightShoe = new THREE.Mesh(avatarGeos.shoe, avatarMats.white); rightShoe.position.set(0, -0.4, faceDir * 0.04);
  rightLegPivot.add(rightLeg, rightShoe);
  bodyRig.add(rightLegPivot);

  if (isLeader && !isBoss) group.scale.setScalar(1.22);
  if (isBoss) group.scale.setScalar(3.4);

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
    rig.leftLegPivot.rotation.x = 0; rig.rightLegPivot.rotation.x = 0;
    rig.leftArmPivot.rotation.x = Math.sin(elapsed * 3 + phase) * 0.12;
    rig.rightArmPivot.rotation.x = -Math.sin(elapsed * 3 + phase) * 0.12;
    rig.bodyRig.rotation.x = 0; rig.bodyRig.position.y = 0;
  }
}

// --- 5. ATTRACTIVE SIDE SURROUNDINGS (CRYSTAL PEAKS & FLOATING GEMS) ---
const envGroup = new THREE.Group();
scene.add(envGroup);

function createSurroundings(isBossLvl) {
  while (envGroup.children.length > 0) envGroup.remove(envGroup.children[0]);
  const mainColor = isBossLvl ? 0xa855f7 : 0x0ea5e9;

  for (let z = 10; z > -levelLength - 100; z -= 30) {
    [-1, 1].forEach(side => {
      const x = side * (19 + Math.random() * 12);
      const height = 48 + Math.random() * 22;
      const radius = 6 + Math.random() * 4;

      const peak = new THREE.Group();
      const rock = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 6),
        new THREE.MeshLambertMaterial({ color: mainColor, flatShading: true })
      );
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(radius * 0.5, height * 0.45, 6),
        new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true })
      );
      cap.position.y = height * 0.28;
      peak.add(rock, cap);
      peak.position.set(x, height / 2 - 32, z);
      envGroup.add(peak);
    });
  }
}

// --- 6. LEVEL BUILDER: ATTRACTIVE ENDING CASTLE & CLEAN OBSTACLES ---
const levelGroup = new THREE.Group();
scene.add(levelGroup);

let gates = [];
let obstacles = [];
let enemyGroups = [];
let castleWalls = [];

function createGateTexture(label, isMultiply) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = isMultiply ? 'rgba(245, 158, 11, 0.75)' : 'rgba(2, 132, 199, 0.75)';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 8); ctx.fillRect(0, 120, 256, 8);
  ctx.font = '900 68px "Segoe UI", Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 128, 66);
  return new THREE.CanvasTexture(canvas);
}

// Only ONE clean obstacle per step so the track looks neat and attractive
function createSingleObstacle(stepIdx, z) {
  const type = stepIdx % 3;
  if (type === 0) {
    const pillarGroup = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.75, 12), new THREE.MeshLambertMaterial({ color: 0x7e22ce }));
      cyl.position.y = i * 0.85 + 0.4;
      pillarGroup.add(cyl);
    }
    pillarGroup.position.set(0, 0, z);
    levelGroup.add(pillarGroup);
    return { modelType: 'sawPillar', mesh: pillarGroup, z, range: 4.0, phase: stepIdx, hitX: 0, radius: 1.3 };
  } else if (type === 1) {
    const group = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.0, 12), new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
    hub.position.y = 1.0;
    const blades = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 0.5), new THREE.MeshLambertMaterial({ color: 0xf97316 }));
    blades.position.y = 1.0;
    group.add(hub, blades);
    group.position.set(0, 0, z);
    levelGroup.add(group);
    return { modelType: 'crossSaw', mesh: group, bladesGroup: blades, z, hitX: 0, radius: 2.8 };
  } else {
    const sideX = stepIdx % 2 === 0 ? -2.8 : 2.8;
    const group = new THREE.Group();
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 4.8, 12), new THREE.MeshLambertMaterial({ color: 0xb91c1c }));
    log.rotation.z = Math.PI / 2; log.position.y = 1.0;
    group.add(log); group.position.set(sideX, 0, z);
    levelGroup.add(group);
    return { modelType: 'spikeRoller', mesh: group, z, hitX: sideX, radius: 2.4 };
  }
}

function buildLevel(lvl) {
  while (levelGroup.children.length > 0) levelGroup.remove(levelGroup.children[0]);
  while (effectsGroup.children.length > 0) effectsGroup.remove(effectsGroup.children[0]);
  enemyBadgesContainer.innerHTML = '';
  gates = []; obstacles = []; enemyGroups = []; castleWalls = [];
  isEndingCelebration = false;

  const isBossLevel = (lvl % 5 === 0);
  viewport.classList.toggle('boss-theme', isBossLevel);
  finishIcon.textContent = isBossLevel ? '👹' : '🏰';
  bossHud.classList.add('hidden');

  const totalSteps = 3;
  const STEP_SPACING = 70;
  levelLength = totalSteps * STEP_SPACING + 60;
  const TRACK_WIDTH = 15.4;

  const road = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH, 2, levelLength + 50), new THREE.MeshLambertMaterial({ color: 0xf8fafc }));
  road.position.set(0, -1, -levelLength / 2 + 10);
  levelGroup.add(road);

  const curbMat = new THREE.MeshLambertMaterial({ color: isBossLevel ? 0xa855f7 : 0x0ea5e9 });
  const leftCurb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.3, levelLength + 50), curbMat);
  leftCurb.position.set(-TRACK_WIDTH / 2 - 0.22, -0.9, -levelLength / 2 + 10);
  const rightCurb = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.3, levelLength + 50), curbMat);
  rightCurb.position.set(TRACK_WIDTH / 2 + 0.22, -0.9, -levelLength / 2 + 10);
  levelGroup.add(leftCurb, rightCurb);

  // --- ATTRACTIVE ENDING CASTLE WALLS (MULTIPLIER WALLS AT FINISH LINE) ---
  const wallZ = -levelLength + 15;
  const multipliers = [10, 5, 3, 2, 1];
  const wallColors = [0xef4444, 0xf97316, 0xfacc15, 0x34d399, 0x38bdf8];

  for (let w = 0; w < multipliers.length; w++) {
    const wGroup = new THREE.Group();
    const wallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(TRACK_WIDTH, 3.8, 1.2),
      new THREE.MeshLambertMaterial({ color: wallColors[w] })
    );
    wallMesh.position.y = 1.9;
    wGroup.add(wallMesh);

    wGroup.position.set(0, 0, wallZ - (w * 5));
    levelGroup.add(wGroup);
    castleWalls.push({ mesh: wGroup, multiplier: multipliers[w], z: wallZ - (w * 5), broken: false });
  }

  for (let step = 1; step <= totalSteps; step++) {
    const baseZ = -step * STEP_SPACING + 30;
    const addValue = step % 2 === 0 ? 15 : 10;
    const isMultiplyLeft = (step + lvl) % 2 === 1;

    if (isMultiplyLeft) {
      spawnGate(-3.7, baseZ, 7.1, '×2', 'multiply', 2, true, step);
      spawnGate(3.7, baseZ, 7.1, `+${addValue}`, 'add', addValue, false, step);
    } else {
      spawnGate(-3.7, baseZ, 7.1, `+${addValue}`, 'add', addValue, false, step);
      spawnGate(3.7, baseZ, 7.1, '×2', 'multiply', 2, true, step);
    }

    const obsZ = baseZ - 22;
    obstacles.push(createSingleObstacle(step + lvl, obsZ));

    const enemyZ = baseZ - 45;
    if (isBossLevel && step === totalSteps) {
      spawnGiantBoss(0, enemyZ, 80 + lvl * 10);
    } else {
      spawnEnemyCrowd((step % 2 === 0 ? 2.2 : -2.2), enemyZ, Math.min(80, 12 + lvl * 2 + step * 3));
    }
  }

  createSurroundings(isBossLevel);
}

function spawnGate(x, z, width, text, operation, value, isMultiply, pairId) {
  const gateGroup = new THREE.Group();
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(width, 3.6),
    new THREE.MeshBasicMaterial({ map: createGateTexture(text, isMultiply), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  banner.position.y = 1.8;
  gateGroup.add(banner);

  const postMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 3.8, 8), postMat); lp.position.set(-width / 2, 1.9, 0);
  const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 3.8, 8), postMat); rp.position.set(width / 2, 1.9, 0);
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
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.03;
  group.add(disc);

  const avatars = [];
  const visualCount = Math.min(count, 35);
  for (let i = 0; i < visualCount; i++) {
    const redMan = createClearAvatar(false, i === 0, false);
    const r = 0.48 * Math.sqrt(i); const a = i * 2.39996;
    redMan.position.set(r * Math.cos(a), 0, r * Math.sin(a));
    redMan.userData.phase = Math.random() * Math.PI * 2;
    group.add(redMan); avatars.push(redMan);
  }
  group.position.set(x, 0, z);
  levelGroup.add(group);

  const badge = document.createElement('div');
  badge.className = 'crowd-badge red-badge';
  badge.textContent = count;
  enemyBadgesContainer.appendChild(badge);

  enemyGroups.push({ isBoss: false, mesh: group, disc, avatars, badge, x, z, count, maxCount: count, engaged: false, defeated: false });
}

function spawnGiantBoss(x, z, bossHp) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(4.8, 24),
    new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.03;
  group.add(disc);

  const giantBoss = createClearAvatar(false, true, true);
  group.add(giantBoss);
  group.position.set(x, 0, z);
  levelGroup.add(group);

  const badge = document.createElement('div');
  badge.className = 'crowd-badge boss-badge';
  badge.textContent = `👹 BOSS: ${bossHp}`;
  enemyBadgesContainer.appendChild(badge);

  enemyGroups.push({ isBoss: true, mesh: group, disc, avatars: [giantBoss], badge, x, z, count: bossHp, maxCount: bossHp, engaged: false, defeated: false });
}

// --- 7. PLAYER CROWD ---
const playerCrowdGroup = new THREE.Group();
scene.add(playerCrowdGroup);
const playerAvatars = [];

function assignFormationTargets() {
  for (let i = 0; i < playerAvatars.length; i++) {
    const r = 0.48 * Math.sqrt(i); const theta = i * 2.39996;
    playerAvatars[i].userData.targetX = r * Math.cos(theta);
    playerAvatars[i].userData.targetZ = r * Math.sin(theta);
  }
}

function syncPlayerCrowdMeshes() {
  const visualCap = Math.max(0, Math.min(playerCount, 65));
  while (playerAvatars.length < visualCap) {
    const isLeader = playerAvatars.length === 0;
    const man = createClearAvatar(true, isLeader, false);
    man.userData.phase = Math.random() * Math.PI * 2;
    playerCrowdGroup.add(man); playerAvatars.push(man);
  }
  while (playerAvatars.length > visualCap) {
    playerCrowdGroup.remove(playerAvatars.pop());
  }
  assignFormationTargets();
  playerBadge.textContent = Math.max(0, playerCount);
}

function killOnePlayerAvatar(worldPos, isHit = false) {
  if (playerCount <= 0) return;
  playerCount--;
  syncPlayerCrowdMeshes();
  if (worldPos) spawnParticles(worldPos, 'blue', 4);
  if (isHit) playSound('hit');
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
    while (eg.avatars.length > Math.min(eg.count, 35)) {
      eg.mesh.remove(eg.avatars.pop());
    }
    spawnParticles(eg.mesh.position, 'red', 3);
  }
}

// --- 8. CONTROLS ---
function resetLevelState() {
  const isBossLvl = (currentLevel % 5 === 0);
  playerCount = 20 + bonusStartCrowd + (currentLevel - 1) * 2;
  playerCrowdGroup.position.set(0, 0, 8);
  targetX = 0; isRunning = false; isPaused = false; activeBattleGroup = null;
  battleBanner.classList.add('hidden'); upgradeBar.classList.remove('hidden');

  levelBadge.textContent = currentLevel;
  progressFill.style.width = '0%';
  statusOverlay.textContent = isBossLvl ? `⚠️ BOSS LEVEL ${currentLevel}! Touch & Drag` : `Touch & Drag to Run (Level ${currentLevel} of ${MAX_LEVELS})`;

  while (playerAvatars.length > 0) playerCrowdGroup.remove(playerAvatars.pop());
  syncPlayerCrowdMeshes();
  buildLevel(currentLevel);
}

upgradeCrowdBtn.addEventListener('click', () => {
  initAudio();
  if (coins >= upgradeCost) {
    coins -= upgradeCost; bonusStartCrowd += 5; upgradeCost += 25; playerCount += 5;
    coinAmountEl.textContent = coins; upgradeCostEl.textContent = upgradeCost;
    syncPlayerCrowdMeshes(); playSound('gate');
    spawnParticles(playerCrowdGroup.position, 'gold', 8);
  }
});

let targetX = 0;
function handlePointerMove(clientX) {
  if (isPaused || activeBattleGroup || isEndingCelebration) return;
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

pauseBtn.addEventListener('click', () => { isPaused = true; modalTitle.textContent = 'Game Paused ⏸️'; modalOverlay.classList.remove('hidden'); });
exitBtn.addEventListener('click', () => { isPaused = true; modalTitle.textContent = 'Exit Game? 🚪'; modalOverlay.classList.remove('hidden'); });
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
});

resumeBtn.addEventListener('click', () => {
  modalOverlay.classList.add('hidden'); isPaused = false;
  if (playerCrowdGroup.position.z <= -levelLength + 10) {
    currentLevel = currentLevel < MAX_LEVELS ? currentLevel + 1 : 1;
    resetLevelState();
  } else if (playerCount <= 0) resetLevelState();
});

restartBtn.addEventListener('click', () => { modalOverlay.classList.add('hidden'); resetLevelState(); });

// --- 9. ANIMATION LOOP ---
const clock = new THREE.Clock();
let lastDamageTime = 0; let lastBattleTime = 0;

function projectToScreen(worldPos, yOffset, badgeEl, maxDist = 200) {
  if (Math.abs(playerCrowdGroup.position.z - worldPos.z) > maxDist) { badgeEl.style.display = 'none'; return; }
  const pos = worldPos.clone(); pos.y += yOffset; pos.project(camera);
  if (pos.z > 1) { badgeEl.style.display = 'none'; return; }
  badgeEl.style.display = 'block';
  badgeEl.style.left = `${(pos.x * 0.5 + 0.5) * window.innerWidth}px`;
  badgeEl.style.top = `${(-(pos.y * 0.5) + 0.5) * window.innerHeight}px`;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  updateParticles(dt);

  obstacles.forEach(obs => {
    if (obs.modelType === 'crossSaw') obs.bladesGroup.rotation.y += 4.5 * dt;
    else if (obs.modelType === 'sawPillar') {
      obs.mesh.rotation.y += 4.0 * dt;
      obs.hitX = Math.sin(elapsed * 2.0 + obs.phase) * obs.range;
      obs.mesh.position.x = obs.hitX;
    }
  });

  if (!isPaused) {
    const isMovingNow = isRunning || Boolean(activeBattleGroup) || isEndingCelebration;
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

    // --- ENDING CASTLE WALL CELEBRATION ---
    if (isEndingCelebration) {
      playerCrowdGroup.position.z -= 12.0 * dt;
      castleWalls.forEach(cw => {
        if (!cw.broken && Math.abs(playerCrowdGroup.position.z - cw.z) < 1.5) {
          cw.broken = true;
          cw.mesh.visible = false;
          playerCount *= cw.multiplier;
          syncPlayerCrowdMeshes();
          playSound('win');
          spawnParticles(playerCrowdGroup.position, 'gold', 20);
          showGainPopup(`×${cw.multiplier} BONUS!`);
        }
      });

      if (playerCrowdGroup.position.z <= -levelLength - 30) {
        isPaused = true;
        playSound('win');
        const reward = 100 + currentLevel * 20 + playerCount;
        coins += reward; coinAmountEl.textContent = coins;
        modalTitle.textContent = `🎉 FINISH LINE VICTORY! 🏆`;
        modalSubtitle.textContent = `+${reward} Coins Earned! (${playerCount} Final Crowd)`;
        resumeBtn.textContent = currentLevel < MAX_LEVELS ? 'Next Level ➔' : 'Play Again';
        modalOverlay.classList.remove('hidden');
      }
    }
    // --- BATTLE MODE ---
    else if (activeBattleGroup) {
      const eg = activeBattleGroup;
      playerCrowdGroup.position.x += (eg.x - playerCrowdGroup.position.x) * (dt * 6);
      playerCrowdGroup.position.z += ((eg.z + 2.2) - playerCrowdGroup.position.z) * (dt * 6);

      if (elapsed - lastBattleTime > 0.055) {
        lastBattleTime = elapsed;
        playSound('clash');
        const stepKills = Math.max(1, Math.ceil(Math.min(playerCount, eg.count) / 20));
        for (let k = 0; k < stepKills; k++) {
          if (playerCount > 0 && eg.count > 0) {
            killOnePlayerAvatar(null, false);
            damageEnemyOrBoss(eg);
          }
        }

        if (eg.count <= 0) {
          eg.defeated = true; eg.disc.visible = false; eg.mesh.visible = false;
          eg.badge.style.display = 'none'; bossHud.classList.add('hidden');
          activeBattleGroup = null; battleBanner.classList.add('hidden');
          spawnParticles(playerCrowdGroup.position, 'gold', 15);
          playSound('win'); targetX = playerCrowdGroup.position.x;
        }

        if (playerCount <= 0) {
          activeBattleGroup = null; battleBanner.classList.add('hidden'); isPaused = true;
          modalTitle.textContent = eg.isBoss ? 'Crushed by the Boss! 👹' : 'Defeated in Battle! 💀';
          resumeBtn.textContent = 'Retry Level'; modalOverlay.classList.remove('hidden');
        }
      }
    }
    // --- RUNNING MODE ---
    else if (isRunning) {
      playerCrowdGroup.position.x += (targetX - playerCrowdGroup.position.x) * Math.min(1, dt * 10);
      playerCrowdGroup.position.z -= (15.0 + currentLevel * 0.15) * dt;

      const pct = Math.min(100, Math.max(0, ((8 - playerCrowdGroup.position.z) / (levelLength - 4)) * 100));
      progressFill.style.width = `${pct}%`;

      gates.forEach(g => {
        if (!g.triggered && Math.abs(playerCrowdGroup.position.z - g.z) < 1.4) {
          if (Math.abs(playerCrowdGroup.position.x - g.x) < g.width / 2 + 0.85) {
            gates.forEach(s => { if (s.pairId === g.pairId) s.triggered = true; });
            g.mesh.visible = false;
            if (g.operation === 'multiply') playerCount *= g.value;
            if (g.operation === 'add') playerCount += g.value;
            playSound('gate'); showGainPopup(g.text);
            spawnParticles(playerCrowdGroup.position, 'gold', 8);
            syncPlayerCrowdMeshes();
          }
        }
      });

      obstacles.forEach(obs => {
        if (Math.abs(playerCrowdGroup.position.z - obs.z) < 1.25 && Math.abs(playerCrowdGroup.position.x - obs.hitX) < obs.radius + 0.8) {
          if (elapsed - lastDamageTime > 0.08) {
            lastDamageTime = elapsed;
            killOnePlayerAvatar(new THREE.Vector3(obs.hitX, 0.5, obs.z), true);
          }
        }
      });

      enemyGroups.forEach(eg => {
        if (!eg.defeated && !eg.engaged) {
          if (Math.abs(playerCrowdGroup.position.z - eg.z) < 4.5) {
            eg.engaged = true; activeBattleGroup = eg;
            battleBanner.textContent = eg.isBoss ? '👹 GIANT BOSS FIGHT! 👹' : '⚔️ CLASH BATTLE! ⚔️';
            battleBanner.classList.remove('hidden');
            if (eg.isBoss) { bossHpText.textContent = eg.count; bossBarFill.style.width = '100%'; bossHud.classList.remove('hidden'); }
          }
        }
      });

      if (playerCount <= 0) {
        isPaused = true; modalTitle.textContent = 'Crowd Eliminated! 💥';
        resumeBtn.textContent = 'Retry Level'; modalOverlay.classList.remove('hidden');
      }

      // Trigger Castle Ending Celebration when reaching finish line
      if (playerCrowdGroup.position.z <= -levelLength + 20) {
        isEndingCelebration = true;
      }
    }
  }

  camera.position.set(0, 14.2, playerCrowdGroup.position.z + 19.5);
  camera.lookAt(0, 1.0, playerCrowdGroup.position.z - 16);

  projectToScreen(playerCrowdGroup.position, 3.2, playerBadge, 300);
  enemyGroups.forEach(eg => {
    if (!eg.defeated) projectToScreen(eg.mesh.position, eg.isBoss ? 5.6 : 3.0, eg.badge, 75);
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
