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
const bossTitleText = document.getElementById('boss-title-text');
const bossHpText = document.getElementById('boss-hp-text');
const bossBarFill = document.getElementById('boss-bar-fill');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const scoreBreakdown = document.getElementById('score-breakdown');
const scSurvivors = document.getElementById('sc-survivors');
const scBalloons = document.getElementById('sc-balloons');
const scMult = document.getElementById('sc-mult');
const scCoins = document.getElementById('sc-coins');

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
let levelLength = 240;

// Finale & Score Tracking State
let isEndingFinale = false;
let poppedBalloonsCount = 0;
let reachedMultiplier = 1;
let survivorsAtFinish = 0;

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
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.16);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.start(now);
    osc.stop(now + 0.18);
  } else if (type === 'balloon') {
    // Crisp Balloon Pop Sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.start(now);
    osc.stop(now + 0.09);
  } else if (type === 'hit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'clash') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(280 + Math.random() * 80, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'win') {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, now + idx * 0.08);
      g.gain.setValueAtTime(0.2, now + idx * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(now + idx * 0.08);
      o.stop(now + idx * 0.08 + 0.22);
    });
  }
}

soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
});

// --- 2. SCENE, CAMERA & RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xbae6fd, 0.0022);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 360);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.78);
dirLight.position.set(-20, 55, 30);
scene.add(dirLight);

// --- 3. CONFETTI & PARTICLE EFFECTS ---
const effectsGroup = new THREE.Group();
scene.add(effectsGroup);
const activeParticles = [];
const pGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
const pMats = {
  blue: new THREE.MeshBasicMaterial({ color: 0x0ea5e9 }),
  red: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  gold: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
  green: new THREE.MeshBasicMaterial({ color: 0x22c55e }),
  pink: new THREE.MeshBasicMaterial({ color: 0xec4899 })
};

function spawnParticles(pos, type = 'blue', count = 6) {
  if (activeParticles.length > 75) return;
  const keys = ['gold', 'green', 'pink', 'blue', 'red'];
  for (let i = 0; i < count; i++) {
    const mat = type === 'confetti' ? pMats[keys[i % keys.length]] : (pMats[type] || pMats.gold);
    const p = new THREE.Mesh(pGeo, mat);
    p.position.set(pos.x, pos.y + 1.0, pos.z);
    p.userData = {
      vx: (Math.random() - 0.5) * 0.36,
      vy: 0.16 + Math.random() * 0.26,
      vz: (Math.random() - 0.5) * 0.36,
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
    p.userData.vy -= 0.014 * step;
    p.rotation.x += 0.12 * step;
    p.rotation.y += 0.12 * step;
    p.userData.life -= 0.04 * step;
    p.scale.setScalar(Math.max(0.01, p.userData.life));
    if (p.userData.life <= 0 || p.position.y < -2) {
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

// --- 4. CLEAR HD 3D AVATARS & BOSS MODELS (MINI-BOSS & MEGA-BOSS) ---
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
  miniBossMain: new THREE.MeshLambertMaterial({ color: 0xea580c }),
  miniBossDark: new THREE.MeshLambertMaterial({ color: 0x7c2d12 }),
  megaBossMain: new THREE.MeshLambertMaterial({ color: 0x9333ea }),
  megaBossDark: new THREE.MeshLambertMaterial({ color: 0x3b0764 }),
  white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  black: new THREE.MeshBasicMaterial({ color: 0x0f172a }),
  gold: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
  glowYellow: new THREE.MeshBasicMaterial({ color: 0xfef08a })
};

function createClearAvatar(isPlayer, isLeader = false, bossType = 'none') {
  const group = new THREE.Group();
  const isBoss = bossType !== 'none';
  let mainMat = isPlayer ? avatarMats.blueMain : avatarMats.redMain;
  let darkMat = isPlayer ? avatarMats.blueDark : avatarMats.redDark;

  if (bossType === 'mini') {
    mainMat = avatarMats.miniBossMain;
    darkMat = avatarMats.miniBossDark;
  } else if (bossType === 'mega') {
    mainMat = avatarMats.megaBossMain;
    darkMat = avatarMats.megaBossDark;
  }

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
    const stick = new THREE.Mesh(avatarGeos.clubStick, darkMat);
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
  if (bossType === 'mini') group.scale.setScalar(2.5);
  if (bossType === 'mega') group.scale.setScalar(3.5);

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

// --- 5. REALISTIC 3D ANIMATED TREES, GRASS MEADOWS, FLOWERS & LANTERNS ---
const envGroup = new THREE.Group();
scene.add(envGroup);
const animatedTrees = [];

const treeMats = {
  bark: new THREE.MeshLambertMaterial({ color: 0x78350f }),
  oakLeaf1: new THREE.MeshLambertMaterial({ color: 0x16a34a, flatShading: true }),
  oakLeaf2: new THREE.MeshLambertMaterial({ color: 0x22c55e, flatShading: true }),
  pineLeaf: new THREE.MeshLambertMaterial({ color: 0x15803d, flatShading: true }),
  cherryLeaf: new THREE.MeshLambertMaterial({ color: 0xf472b6, flatShading: true }),
  grassBank: new THREE.MeshLambertMaterial({ color: 0x4ade80 }),
  bush: new THREE.MeshLambertMaterial({ color: 0x16a34a, flatShading: true }),
  flowerRed: new THREE.MeshBasicMaterial({ color: 0xf43f5e }),
  flowerYellow: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
  lanternPost: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
  lanternGlow: new THREE.MeshBasicMaterial({ color: 0xfef08a })
};

function createRealistic3DTree(typeIndex) {
  const tree = new THREE.Group();

  if (typeIndex === 0) {
    // 1. Realistic Multi-Branch Oak Tree (Wood trunk, side branches & lush spherical canopy clusters)
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, 4.5, 7), treeMats.bark);
    trunk.position.y = 2.25;
    tree.add(trunk);

    const branchLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 2.2, 6), treeMats.bark);
    branchLeft.position.set(-0.8, 3.6, 0);
    branchLeft.rotation.z = 0.6;
    const branchRight = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 2.0, 6), treeMats.bark);
    branchRight.position.set(0.8, 3.4, 0.3);
    branchRight.rotation.z = -0.55;
    tree.add(branchLeft, branchRight);

    const canopyOffsets = [
      [0, 5.6, 0, 2.5, treeMats.oakLeaf1],
      [-1.5, 4.7, 0.4, 1.8, treeMats.oakLeaf2],
      [1.5, 4.6, -0.3, 1.8, treeMats.oakLeaf2],
      [0.3, 4.8, 1.3, 1.7, treeMats.oakLeaf1],
      [-0.4, 4.9, -1.2, 1.6, treeMats.oakLeaf2]
    ];
    canopyOffsets.forEach(([cx, cy, cz, r, mat]) => {
      const leaf Puff = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
      leafPuff.position.set(cx, cy, cz);
      tree.add(leafPuff);
    });
  } else if (typeIndex === 1) {
    // 2. Realistic 4-Tier Layered Forest Pine Tree
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.65, 3.5, 7), treeMats.bark);
    trunk.position.y = 1.75;
    tree.add(trunk);

    for (let l = 0; l < 4; l++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(2.8 - l * 0.5, 2.8, 7),
        treeMats.pineLeaf
      );
      cone.position.y = 3.2 + l * 1.65;
      tree.add(cone);
    }
  } else {
    // 3. Attractive Pink Blossom Tree
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.65, 4.2, 7), treeMats.bark);
    trunk.position.y = 2.1;
    tree.add(trunk);

    const blossomOffsets = [
      [0, 5.2, 0, 2.3],
      [-1.4, 4.4, 0.3, 1.6],
      [1.4, 4.5, -0.3, 1.6]
    ];
    blossomOffsets.forEach(([bx, by, bz, br]) => {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(br, 1), treeMats.cherryLeaf);
      puff.position.set(bx, by, bz);
      tree.add(puff);
    });
  }

  return tree;
}

function createForestSurroundings(totalLen) {
  while (envGroup.children.length > 0) envGroup.remove(envGroup.children[0]);
  animatedTrees.length = 0;

  // Lush Green Grass Meadows along Left & Right sides of the Road
  [-1, 1].forEach(side => {
    const meadow = new THREE.Mesh(
      new THREE.BoxGeometry(55, 2, totalLen + 140),
      treeMats.grassBank
    );
    meadow.position.set(side * 35.5, -1.2, -totalLen / 2);
    envGroup.add(meadow);
  });

  // Populate Realistic 3D Trees, Flower Bushes & Roadside Lanterns
  for (let z = 12; z > -totalLen - 90; z -= 14) {
    [-1, 1].forEach(side => {
      // Near Row of 3D Trees
      const treeType = Math.abs(Math.floor(z * side)) % 3;
      const tree1 = createRealistic3DTree(treeType);
      const scale1 = 0.85 + Math.random() * 0.45;
      tree1.scale.setScalar(scale1);
      tree1.position.set(side * (11.5 + Math.random() * 4.5), -0.2, z + (Math.random() * 5 - 2.5));
      tree1.userData = { phase: Math.random() * Math.PI * 2, speed: 1.6 + Math.random() * 0.8 };
      envGroup.add(tree1);
      animatedTrees.push(tree1);

      // Outer Background Forest Row
      if (Math.random() > 0.25) {
        const tree2 = createRealistic3DTree((treeType + 1) % 3);
        tree2.scale.setScalar(1.1 + Math.random() * 0.5);
        tree2.position.set(side * (19 + Math.random() * 10), -0.2, z - 6);
        tree2.userData = { phase: Math.random() * Math.PI * 2, speed: 1.5 };
        envGroup.add(tree2);
        animatedTrees.push(tree2);
      }

      // Roadside Flowering Shrubs & Glowing Lanterns every 28 units
      if (Math.abs(z) % 28 === 0) {
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 1), treeMats.bush);
        bush.position.set(side * 9.5, 0.4, z);
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 6, 6),
          side > 0 ? treeMats.flowerRed : treeMats.flowerYellow
        );
        flower.position.set(0, 0.9, 0.3);
        bush.add(flower);
        envGroup.add(bush);

        // Glowing Roadside Lamp Post
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 4.2, 6), treeMats.lanternPost);
        post.position.set(side * 8.3, 2.1, z + 6);
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), treeMats.lanternGlow);
        bulb.position.y = 2.2;
        post.add(bulb);
        envGroup.add(post);
      }
    });
  }
}

// --- 6. LEVEL BUILDER: BOSS EVERY 3 & 5 LEVELS + END BALLOON TRAPS & SCORE STAIRS ---
const levelGroup = new THREE.Group();
scene.add(levelGroup);

let gates = [];
let obstacles = [];
let enemyGroups = [];
let bonusStairs = [];
let balloonTraps = [];
let finishChest = null;

function createTextBannerTexture(label, bgColor, borderColor = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = borderColor;
  ctx.fillRect(0, 0, 256, 8); ctx.fillRect(0, 120, 256, 8);
  ctx.font = '900 66px "Segoe UI", Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 128, 66);
  return new THREE.CanvasTexture(canvas);
}

// Single Clean Obstacle per Step
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
    return { modelType: 'sawPillar', mesh: pillarGroup, z, range: 4.2, phase: stepIdx, hitX: 0, radius: 1.3 };
  } else if (type === 1) {
    const group = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 2.0, 12), new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
    hub.position.y = 1.0;
    const blades = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.4, 0.5), new THREE.MeshLambertMaterial({ color: 0xf97316 }));
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

// Create 3D Floating Balloon Trap for Finale
function createBalloonTrap(x, y, z, colorHex, bonusCoins) {
  const bGroup = new THREE.Group();

  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(0.95, 12, 12),
    new THREE.MeshPhongMaterial({ color: colorHex, shininess: 90 })
  );
  balloon.scale.set(1, 1.22, 1);
  balloon.position.y = 2.4;

  const knot = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.25, 6),
    new THREE.MeshLambertMaterial({ color: colorHex })
  );
  knot.position.y = 1.2;

  const string = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.4, 4),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  string.position.y = 0.7;

  bGroup.add(balloon, knot, string);
  bGroup.position.set(x, y, z);
  levelGroup.add(bGroup);

  return {
    mesh: bGroup,
    x,
    baseY: y,
    z,
    bonusCoins,
    phase: Math.random() * Math.PI * 2,
    popped: false
  };
}

function buildLevel(lvl) {
  while (levelGroup.children.length > 0) levelGroup.remove(levelGroup.children[0]);
  while (effectsGroup.children.length > 0) effectsGroup.remove(effectsGroup.children[0]);
  enemyBadgesContainer.innerHTML = '';
  gates = []; obstacles = []; enemyGroups = []; bonusStairs = []; balloonTraps = [];
  isEndingFinale = false;
  poppedBalloonsCount = 0;
  reachedMultiplier = 1;

  // Boss Task Check: Mega-Boss every 5 levels, Mini-Boss every 3 levels!
  const isMegaBoss = (lvl % 5 === 0);
  const isMiniBoss = (!isMegaBoss && lvl % 3 === 0);
  const hasBossTask = isMegaBoss || isMiniBoss;

  viewport.classList.toggle('boss-theme', hasBossTask);
  finishIcon.textContent = hasBossTask ? '👹' : '🎈';
  bossHud.classList.add('hidden');

  const totalSteps = 3;
  const STEP_SPACING = 68;
  levelLength = totalSteps * STEP_SPACING + 45;
  const TRACK_WIDTH = 15.4;
  const FINALE_LENGTH = 85;

  // Main Road & Curbs
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(TRACK_WIDTH, 2, levelLength + FINALE_LENGTH + 40),
    new THREE.MeshLambertMaterial({ color: 0xf8fafc })
  );
  road.position.set(0, -1, -(levelLength + FINALE_LENGTH) / 2 + 15);
  levelGroup.add(road);

  const curbMat = new THREE.MeshLambertMaterial({ color: hasBossTask ? 0xf59e0b : 0x16a34a });
  const leftCurb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.3, levelLength + FINALE_LENGTH + 40), curbMat);
  leftCurb.position.set(-TRACK_WIDTH / 2 - 0.25, -0.9, -(levelLength + FINALE_LENGTH) / 2 + 15);
  const rightCurb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.3, levelLength + FINALE_LENGTH + 40), curbMat);
  rightCurb.position.set(TRACK_WIDTH / 2 + 0.25, -0.9, -(levelLength + FINALE_LENGTH) / 2 + 15);
  levelGroup.add(leftCurb, rightCurb);

  // Track Steps (Gates, Single Obstacle, Enemy / Boss Task)
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
    if (hasBossTask && step === totalSteps) {
      const bossHp = isMegaBoss ? (75 + lvl * 10) : (50 + lvl * 7);
      spawnBossTask(0, enemyZ, bossHp, isMegaBoss ? 'mega' : 'mini');
    } else {
      spawnEnemyCrowd((step % 2 === 0 ? 2.2 : -2.2), enemyZ, Math.min(80, 12 + lvl * 2 + step * 3));
    }
  }

  // --- END-OF-LEVEL SCORE STAIRS, BALLOON TRAPS & TREASURE CHEST ---
  const finishStartZ = -levelLength + 12;
  const stairColors = [0x38bdf8, 0x22c55e, 0x84cc16, 0xeab308, 0xf97316, 0xef4444, 0xec4899, 0xa855f7, 0x6366f1, 0xfacc15];
  const balloonColors = [0xef4444, 0xf59e0b, 0x10b981, 0xec4899, 0x8b5cf6];

  for (let s = 0; s < 10; s++) {
    const stepMult = s + 1;
    const stepZ = finishStartZ - s * 7.0;
    const stepY = s * 0.55;

    // Colored Multiplier Step Platform
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(TRACK_WIDTH - 0.6, 0.55, 6.8),
      new THREE.MeshLambertMaterial({ color: stairColors[s] })
    );
    platform.position.set(0, stepY + 0.27, stepZ);
    levelGroup.add(platform);

    // Side Multiplier Sign Banner (x1, x2 ... x10)
    const signBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.6),
      new THREE.MeshBasicMaterial({
        map: createTextBannerTexture(`x${stepMult}`, '#0f172a', '#facc15'),
        side: THREE.DoubleSide
      })
    );
    signBanner.position.set(s % 2 === 0 ? -5.2 : 5.2, stepY + 1.6, stepZ + 2.5);
    levelGroup.add(signBanner);

    bonusStairs.push({
      z: stepZ,
      y: stepY + 0.55,
      multiplier: stepMult,
      cost: Math.max(2, Math.floor(2 + s * 1.2)),
      reached: false
    });

    // Spawn 3 Colorful Balloon Traps on Each Step!
    [-3.2, 0, 3.2].forEach((bx, bIdx) => {
      const bColor = balloonColors[(s + bIdx) % balloonColors.length];
      balloonTraps.push(createBalloonTrap(bx, stepY + 0.55, stepZ, bColor, 15 + s * 5));
    });
  }

  // Grand Golden Treasure Chest at the Top of x10 Stairs
  const chestGroup = new THREE.Group();
  const chestBase = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 2.4, 3.0),
    new THREE.MeshLambertMaterial({ color: 0xb45309 })
  );
  chestBase.position.y = 1.2;
  const chestGoldTrim = new THREE.Mesh(
    new THREE.BoxGeometry(4.7, 0.6, 3.2),
    new THREE.MeshLambertMaterial({ color: 0xfacc15 })
  );
  chestGoldTrim.position.y = 2.1;
  chestGroup.add(chestBase, chestGoldTrim);
  chestGroup.position.set(0, 10 * 0.55, finishStartZ - 10 * 7.0);
  levelGroup.add(chestGroup);
  finishChest = chestGroup;

  createForestSurroundings(levelLength + FINALE_LENGTH);
}

function spawnGate(x, z, width, text, operation, value, isMultiply, pairId) {
  const gateGroup = new THREE.Group();
  const bgCol = isMultiply ? 'rgba(245, 158, 11, 0.8)' : 'rgba(2, 132, 199, 0.8)';
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(width, 3.6),
    new THREE.MeshBasicMaterial({ map: createTextBannerTexture(text, bgCol), transparent: true, side: THREE.DoubleSide, depthWrite: false })
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
    const redMan = createClearAvatar(false, i === 0, 'none');
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

  enemyGroups.push({ isBoss: false, bossType: 'none', mesh: group, disc, avatars, badge, x, z, count, maxCount: count, engaged: false, defeated: false });
}

function spawnBossTask(x, z, bossHp, bossType) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(4.8, 24),
    new THREE.MeshBasicMaterial({ color: bossType === 'mega' ? 0xa855f7 : 0xf97316, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.03;
  group.add(disc);

  const bossAvatar = createClearAvatar(false, true, bossType);
  group.add(bossAvatar);
  group.position.set(x, 0, z);
  levelGroup.add(group);

  const labelPrefix = bossType === 'mega' ? '👹 MEGA BOSS' : '⚔️ MINI BOSS';
  const badge = document.createElement('div');
  badge.className = 'crowd-badge boss-badge';
  badge.textContent = `${labelPrefix}: ${bossHp}`;
  enemyBadgesContainer.appendChild(badge);

  enemyGroups.push({ isBoss: true, bossType, labelPrefix, mesh: group, disc, avatars: [bossAvatar], badge, x, z, count: bossHp, maxCount: bossHp, engaged: false, defeated: false });
}

// --- 7. COHESIVE PLAYER CROWD ---
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
    const man = createClearAvatar(true, isLeader, 'none');
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
    eg.badge.textContent = `${eg.labelPrefix}: ${Math.max(0, eg.count)}`;
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

// --- 8. RESET, UPGRADES & SCORE SUMMARY MODAL ---
function showEndLevelScoreModal() {
  isPaused = true;
  playSound('win');

  const baseCoins = 40 + currentLevel * 10;
  const balloonBonus = poppedBalloonsCount * 15;
  const totalEarned = (baseCoins + survivorsAtFinish * 2 + balloonBonus) * reachedMultiplier;

  coins += totalEarned;
  coinAmountEl.textContent = coins;

  modalTitle.textContent = `🎉 Level ${currentLevel} Complete!`;
  modalSubtitle.textContent = `अद्भुతమైన విజయం! స్కోర్ వివరాలు చూడండి:`;
  scSurvivors.textContent = survivorsAtFinish;
  scBalloons.textContent = `${poppedBalloonsCount} (+${balloonBonus}$)`;
  scMult.textContent = `x${reachedMultiplier}`;
  scCoins.textContent = `+${totalEarned} $`;
  scoreBreakdown.classList.remove('hidden');

  resumeBtn.textContent = currentLevel < MAX_LEVELS ? 'Next Level ➔' : 'Play Again';
  modalOverlay.classList.remove('hidden');
}

function resetLevelState() {
  const isMegaBoss = (currentLevel % 5 === 0);
  const isMiniBoss = (!isMegaBoss && currentLevel % 3 === 0);

  playerCount = 20 + bonusStartCrowd + (currentLevel - 1) * 2;
  playerCrowdGroup.position.set(0, 0, 8);
  targetX = 0; isRunning = false; isPaused = false; activeBattleGroup = null;
  battleBanner.classList.add('hidden');
  upgradeBar.classList.remove('hidden');
  scoreBreakdown.classList.add('hidden');

  levelBadge.textContent = currentLevel;
  progressFill.style.width = '0%';

  if (isMegaBoss) {
    statusOverlay.textContent = `👹 MEGA-BOSS TASK (Level ${currentLevel})! Drag to Run`;
  } else if (isMiniBoss) {
    statusOverlay.textContent = `⚔️ MINI-BOSS TASK (Level ${currentLevel})! Drag to Run`;
  } else {
    statusOverlay.textContent = `Touch & Drag to Run (Level ${currentLevel} of ${MAX_LEVELS})`;
  }

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
  scoreBreakdown.classList.add('hidden');
  modalTitle.textContent = 'Game Paused ⏸️';
  modalSubtitle.textContent = `Level ${currentLevel} / ${MAX_LEVELS}`;
  resumeBtn.textContent = 'Resume';
  modalOverlay.classList.remove('hidden');
});
exitBtn.addEventListener('click', () => {
  isPaused = true;
  scoreBreakdown.classList.add('hidden');
  modalTitle.textContent = 'Exit Game? 🚪';
  modalSubtitle.textContent = `Level ${currentLevel} / ${MAX_LEVELS}`;
  resumeBtn.textContent = 'Continue';
  modalOverlay.classList.remove('hidden');
});
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
});

resumeBtn.addEventListener('click', () => {
  modalOverlay.classList.add('hidden'); isPaused = false;
  if (isEndingFinale) {
    currentLevel = currentLevel < MAX_LEVELS ? currentLevel + 1 : 1;
    resetLevelState();
  } else if (playerCount <= 0) {
    resetLevelState();
  }
});

restartBtn.addEventListener('click', () => { modalOverlay.classList.add('hidden'); resetLevelState(); });

// --- 9. MAIN ANIMATION LOOP ---
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

  // Gentle Wind Sway Animation on Realistic 3D Trees
  animatedTrees.forEach(tree => {
    tree.rotation.z = Math.sin(elapsed * tree.userData.speed + tree.userData.phase) * 0.045;
  });

  // Floating Balloon Bobbing Animation
  balloonTraps.forEach(b => {
    if (!b.popped) {
      b.mesh.position.y = b.baseY + Math.sin(elapsed * 3.0 + b.phase) * 0.25;
      b.mesh.rotation.y += 1.5 * dt;
    }
  });

  // Obstacle Animations
  obstacles.forEach(obs => {
    if (obs.modelType === 'crossSaw') obs.bladesGroup.rotation.y += 4.5 * dt;
    else if (obs.modelType === 'sawPillar') {
      obs.mesh.rotation.y += 4.0 * dt;
      obs.hitX = Math.sin(elapsed * 2.0 + obs.phase) * obs.range;
      obs.mesh.position.x = obs.hitX;
    }
  });

  if (!isPaused) {
    const isMovingNow = isRunning || Boolean(activeBattleGroup) || isEndingFinale;
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

    // --- STATE A: END-OF-LEVEL BALLOON TRAPS & SCORE STAIRS FINALE ---
    if (isEndingFinale) {
      playerCrowdGroup.position.x += (targetX - playerCrowdGroup.position.x) * Math.min(1, dt * 10);
      playerCrowdGroup.position.z -= 13.5 * dt;

      // Pop Balloon Traps when avatars touch them!
      balloonTraps.forEach(b => {
        if (!b.popped && Math.abs(playerCrowdGroup.position.z - b.z) < 1.8) {
          if (Math.abs(playerCrowdGroup.position.x - b.x) < 2.6) {
            b.popped = true;
            b.mesh.visible = false;
            poppedBalloonsCount++;
            playSound('balloon');
            spawnParticles(b.mesh.position, 'confetti', 10);
            showGainPopup(`🎈 +${b.bonusCoins}$`);
          }
        }
      });

      // Climb Multiplier Stairs (x1 to x10)
      bonusStairs.forEach(st => {
        if (!st.reached && playerCrowdGroup.position.z <= st.z + 2.5) {
          st.reached = true;
          reachedMultiplier = st.multiplier;
          playerCrowdGroup.position.y = st.y;
          battleBanner.textContent = `🎈 SCORE MULTIPLIER: x${reachedMultiplier}! 🎈`;
          spawnParticles(playerCrowdGroup.position, 'confetti', 8);

          // Leave avatars behind on each step to check how high your crowd score reaches!
          playerCount = Math.max(0, playerCount - st.cost);
          syncPlayerCrowdMeshes();

          if (playerCount <= 0 || st.multiplier === 10) {
            if (finishChest && st.multiplier === 10) {
              spawnParticles(finishChest.position, 'confetti', 25);
            }
            showEndLevelScoreModal();
          }
        }
      });
    }
    // --- STATE B: BOSS TASK / CLASH BATTLE MODE ---
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
          scoreBreakdown.classList.add('hidden');
          modalTitle.textContent = eg.isBoss ? 'Boss Task Failed! 👹' : 'Defeated in Battle! 💀';
          modalSubtitle.textContent = `Upgrade +5 Start Avatars & Retry Level ${currentLevel}`;
          resumeBtn.textContent = 'Retry Level'; modalOverlay.classList.remove('hidden');
        }
      }
    }
    // --- STATE C: NORMAL RUNNING MODE ---
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
            battleBanner.textContent = eg.isBoss ? `${eg.labelPrefix} FIGHT!` : '⚔️ CLASH BATTLE! ⚔️';
            battleBanner.classList.remove('hidden');
            if (eg.isBoss) {
              bossTitleText.innerHTML = `${eg.labelPrefix} (<span id="boss-hp-text">${eg.count}</span> HP)`;
              bossBarFill.style.width = '100%';
              bossHud.classList.remove('hidden');
            }
          }
        }
      });

      if (playerCount <= 0) {
        isPaused = true;
        scoreBreakdown.classList.add('hidden');
        modalTitle.textContent = 'Crowd Eliminated! 💥';
        modalSubtitle.textContent = `Try Level ${currentLevel} Again`;
        resumeBtn.textContent = 'Retry Level';
        modalOverlay.classList.remove('hidden');
      }

      // Enter Balloon & Score Stairs Finale!
      if (playerCrowdGroup.position.z <= -levelLength + 14) {
        isEndingFinale = true;
        survivorsAtFinish = playerCount;
        battleBanner.textContent = '🎈 POP BALLOONS & CLIMB SCORE STAIRS! 🎈';
        battleBanner.classList.remove('hidden');
        playSound('win');
      }
    }
  }

  // Smooth Camera Tracking (Follows vertical stair climb too!)
  camera.position.set(0, playerCrowdGroup.position.y + 14.2, playerCrowdGroup.position.z + 19.5);
  camera.lookAt(0, playerCrowdGroup.position.y + 1.2, playerCrowdGroup.position.z - 16);

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
