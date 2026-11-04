const viewport = document.getElementById('game-viewport');
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
let levelLength = 260;

// --- 1. WEB AUDIO SYNTHESIZER (BUILT-IN SOUND EFFECTS) ---
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;

  if (type === 'gate') {
    // Bright power-up chime
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.18);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'hit') {
    // Pop / splat impact sound
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } else if (type === 'clash') {
    // Battle sword/punch clack
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320 + Math.random() * 120, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } else if (type === 'win') {
    // Victory fanfare arpeggio
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.2, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.25);
    });
  }
}

soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
});

function triggerScreenShake() {
  viewport.classList.remove('shake-screen');
  void viewport.offsetWidth;
  viewport.classList.add('shake-screen');
}

// --- 2. SCENE, CAMERA & RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xbae6fd, 0.0028);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 600);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.85));
const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.75);
dirLight.position.set(-20, 55, 35);
dirLight.castShadow = true;
scene.add(dirLight);

// --- 3. VISUAL EFFECTS (3D SHOCKWAVES, SPLATTERS & PARTICLES) ---
const effectsGroup = new THREE.Group();
scene.add(effectsGroup);
const activeParticles = [];
const activeShockwaves = [];

function spawnParticles(worldPos, colorHex, count = 8, withShockwave = false) {
  const geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  const mat = new THREE.MeshLambertMaterial({ color: colorHex });

  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(geo, mat);
    p.position.copy(worldPos);
    p.position.y += 0.8;
    p.userData = {
      vx: (Math.random() - 0.5) * 0.34,
      vy: 0.16 + Math.random() * 0.24,
      vz: (Math.random() - 0.5) * 0.34,
      life: 1.0
    };
    effectsGroup.add(p);
    activeParticles.push(p);
  }

  // Floor color splat
  const splat = new THREE.Mesh(
    new THREE.CircleGeometry(0.42 + Math.random() * 0.2, 10),
    new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
  );
  splat.rotation.x = -Math.PI / 2;
  splat.position.set(worldPos.x + (Math.random() - 0.5) * 0.5, 0.03, worldPos.z + (Math.random() - 0.5) * 0.5);
  effectsGroup.add(splat);

  // Expanding 3D Shockwave Ring
  if (withShockwave) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.75, 24),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(worldPos.x, 0.08, worldPos.z);
    ring.userData = { scale: 1, opacity: 0.9 };
    effectsGroup.add(ring);
    activeShockwaves.push(ring);
  }
}

function updateVisualEffects() {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.position.x += p.userData.vx;
    p.position.y += p.userData.vy;
    p.position.z += p.userData.vz;
    p.userData.vy -= 0.015;
    p.rotation.x += 0.15;
    p.rotation.y += 0.15;
    p.userData.life -= 0.04;
    p.scale.setScalar(Math.max(0.01, p.userData.life));

    if (p.userData.life <= 0 || p.position.y < 0) {
      effectsGroup.remove(p);
      activeParticles.splice(i, 1);
    }
  }

  for (let i = activeShockwaves.length - 1; i >= 0; i--) {
    const sw = activeShockwaves[i];
    sw.userData.scale += 0.35;
    sw.userData.opacity -= 0.06;
    sw.scale.setScalar(sw.userData.scale);
    sw.material.opacity = Math.max(0, sw.userData.opacity);
    if (sw.userData.opacity <= 0) {
      effectsGroup.remove(sw);
      activeShockwaves.splice(i, 1);
    }
  }
}

function showGainPopup(text) {
  gainPopup.textContent = text;
  gainPopup.classList.remove('hidden');
  gainPopup.style.animation = 'none';
  void gainPopup.offsetWidth;
  gainPopup.style.animation = 'floatUp 0.75s ease-out forwards';
}

// --- 4. ULTRA-CLEAR HD 3D AVATAR BUILDER (EYES, PUPILS, SHOULDERS, SHADOW RING) ---
const avatarGeos = {
  shadow: new THREE.CircleGeometry(0.34, 12),
  head: new THREE.SphereGeometry(0.33, 16, 16),
  eyeWhite: new THREE.SphereGeometry(0.085, 10, 10),
  pupil: new THREE.SphereGeometry(0.045, 8, 8),
  headband: new THREE.CylinderGeometry(0.335, 0.335, 0.1, 14),
  torso: new THREE.CylinderGeometry(0.21, 0.26, 0.68, 12),
  chestBadge: new THREE.BoxGeometry(0.22, 0.22, 0.08),
  belt: new THREE.CylinderGeometry(0.27, 0.27, 0.12, 12),
  limb: new THREE.CylinderGeometry(0.09, 0.08, 0.38, 8),
  hand: new THREE.SphereGeometry(0.11, 8, 8),
  shoe: new THREE.BoxGeometry(0.18, 0.13, 0.28),
  crown: new THREE.ConeGeometry(0.24, 0.34, 5)
};

const avatarMats = {
  shadow: new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.28, side: THREE.DoubleSide }),
  blueMain: new THREE.MeshPhongMaterial({ color: 0x0ea5e9, shininess: 100, specular: 0xe0f2fe }),
  blueDark: new THREE.MeshLambertMaterial({ color: 0x0369a1 }),
  redMain: new THREE.MeshPhongMaterial({ color: 0xef4444, shininess: 100, specular: 0xfecaca }),
  redDark: new THREE.MeshLambertMaterial({ color: 0x991b1b }),
  white: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  black: new THREE.MeshBasicMaterial({ color: 0x0f172a }),
  gold: new THREE.MeshPhongMaterial({ color: 0xfacc15, shininess: 100 })
};

function createClearAvatar(isPlayer, isLeader = false) {
  const group = new THREE.Group();
  const mainMat = isPlayer ? avatarMats.blueMain : avatarMats.redMain;
  const darkMat = isPlayer ? avatarMats.blueDark : avatarMats.redDark;
  const faceDir = isPlayer ? -1 : 1;

  // Ground contact shadow ring so every single avatar stands out clearly against the white road
  const shadow = new THREE.Mesh(avatarGeos.shadow, avatarMats.shadow);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  const bodyRig = new THREE.Group();
  group.add(bodyRig);

  // Head + Headband + Distinct Eyes & Pupils
  const head = new THREE.Mesh(avatarGeos.head, mainMat);
  head.position.y = 1.42;
  bodyRig.add(head);

  const headband = new THREE.Mesh(avatarGeos.headband, avatarMats.gold);
  headband.position.y = 1.52;
  bodyRig.add(headband);

  [-0.12, 0.12].forEach(eyeX => {
    const eyeW = new THREE.Mesh(avatarGeos.eyeWhite, avatarMats.white);
    eyeW.position.set(eyeX, 1.44, faceDir * 0.27);
    const pupil = new THREE.Mesh(avatarGeos.pupil, avatarMats.black);
    pupil.position.set(eyeX, 1.44, faceDir * 0.33);
    bodyRig.add(eyeW, pupil);
  });

  if (isLeader) {
    const crown = new THREE.Mesh(avatarGeos.crown, avatarMats.gold);
    crown.position.set(0, 1.85, 0);
    bodyRig.add(crown);
  }

  // Torso, Golden Chest Emblem & Belt
  const torso = new THREE.Mesh(avatarGeos.torso, mainMat);
  torso.position.y = 0.84;
  bodyRig.add(torso);

  const badge = new THREE.Mesh(avatarGeos.chestBadge, avatarMats.gold);
  badge.position.set(0, 0.9, faceDir * 0.21);
  bodyRig.add(badge);

  const belt = new THREE.Mesh(avatarGeos.belt, darkMat);
  belt.position.y = 0.56;
  bodyRig.add(belt);

  // Arms & White Gloves
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.3, 1.06, 0);
  const leftArm = new THREE.Mesh(avatarGeos.limb, mainMat);
  leftArm.position.y = -0.18;
  const leftGlove = new THREE.Mesh(avatarGeos.hand, avatarMats.white);
  leftGlove.position.y = -0.38;
  leftArmPivot.add(leftArm, leftGlove);
  bodyRig.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.3, 1.06, 0);
  const rightArm = new THREE.Mesh(avatarGeos.limb, mainMat);
  rightArm.position.y = -0.18;
  const rightGlove = new THREE.Mesh(avatarGeos.hand, avatarMats.white);
  rightGlove.position.y = -0.38;
  rightArmPivot.add(rightArm, rightGlove);
  bodyRig.add(rightArmPivot);

  // Legs & White Sneakers
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.13, 0.48, 0);
  const leftLeg = new THREE.Mesh(avatarGeos.limb, darkMat);
  leftLeg.position.y = -0.2;
  const leftShoe = new THREE.Mesh(avatarGeos.shoe, avatarMats.white);
  leftShoe.position.set(0, -0.4, faceDir * 0.04);
  leftLegPivot.add(leftLeg, leftShoe);
  bodyRig.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.13, 0.48, 0);
  const rightLeg = new THREE.Mesh(avatarGeos.limb, darkMat);
  rightLeg.position.y = -0.2;
  const rightShoe = new THREE.Mesh(avatarGeos.shoe, avatarMats.white);
  rightShoe.position.set(0, -0.4, faceDir * 0.04);
  rightLegPivot.add(rightLeg, rightShoe);
  bodyRig.add(rightLegPivot);

  if (isLeader) group.scale.setScalar(1.25);

  group.userData.rig = { bodyRig, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot };
  return group;
}

function animateAvatar(avatar, elapsed, isMoving, speed = 13, isPlayer = true) {
  const rig = avatar.userData.rig;
  if (!rig) return;
  const phase = avatar.userData.phase || 0;

  if (isMoving) {
    const swing = Math.sin(elapsed * speed + phase) * 0.88;
    rig.leftLegPivot.rotation.x = swing;
    rig.rightLegPivot.rotation.x = -swing;
    rig.leftArmPivot.rotation.x = -swing * 0.95;
    rig.rightArmPivot.rotation.x = swing * 0.95;

    rig.bodyRig.rotation.x = isPlayer ? -0.18 : 0.18;
    rig.bodyRig.rotation.z = Math.cos(elapsed * speed + phase) * 0.09;
    rig.bodyRig.position.y = Math.abs(Math.sin(elapsed * speed + phase)) * 0.25;
  } else {
    rig.leftLegPivot.rotation.x = 0;
    rig.rightLegPivot.rotation.x = 0;
    rig.leftArmPivot.rotation.x = Math.sin(elapsed * 3 + phase) * 0.1;
    rig.rightArmPivot.rotation.x = -Math.sin(elapsed * 3 + phase) * 0.1;
    rig.bodyRig.rotation.x = 0;
    rig.bodyRig.rotation.z = 0;
    rig.bodyRig.position.y = Math.abs(Math.sin(elapsed * 3 + phase)) * 0.05;
  }
}

// --- 5. SURROUNDINGS (ICY MOUNTAINS & FLOATING CLOUDS) ---
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

// --- 6. LEVEL BUILDER: 5 UNIQUE OBSTACLE MODELS & MIXED ALTERNATING GATES ---
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

  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  if (isMultiply) {
    // Golden-Orange highlight for ×2 so players can spot it clearly as it swaps sides
    grad.addColorStop(0, 'rgba(245, 158, 11, 0.55)');
    grad.addColorStop(1, 'rgba(217, 119, 6, 0.78)');
  } else {
    // Vibrant Cyan-Blue for +10 / +15
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
    grad.addColorStop(1, 'rgba(2, 132, 199, 0.78)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 7);
  ctx.fillRect(0, 121, 256, 7);

  ctx.font = '900 68px "Segoe UI", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.strokeStyle = isMultiply ? '#78350f' : '#0369a1';
  ctx.strokeText(label, 128, 66);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 128, 66);

  return new THREE.CanvasTexture(canvas);
}

// --- 5 DIFFERENT OBSTACLE MODELS ---
// Model 1: Swinging Overhead Giant Pendulum Axe
function createSwingingAxeObstacle(z) {
  const group = new THREE.Group();
  const postMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
  const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 9, 12), postMat);
  lp.position.set(-7.2, 4.5, 0);
  const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 9, 12), postMat);
  rp.position.set(7.2, 4.5, 0);
  const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 15, 12), postMat);
  topBar.rotation.z = Math.PI / 2;
  topBar.position.set(0, 8.8, 0);
  group.add(lp, rp, topBar);

  const pivot = new THREE.Group();
  pivot.position.set(0, 8.8, 0);
  const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 7.2, 10),
    new THREE.MeshLambertMaterial({ color: 0x94a3b8 })
  );
  rod.position.y = -3.6;

  const axeBlade = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 2.0, 0.35),
    new THREE.MeshPhongMaterial({ color: 0xef4444, shininess: 90 })
  );
  axeBlade.position.y = -7.2;

  const axeEdge = new THREE.Mesh(
    new THREE.BoxGeometry(4.0, 0.4, 0.42),
    new THREE.MeshLambertMaterial({ color: 0xfef08a })
  );
  axeEdge.position.y = -8.1;

  pivot.add(rod, axeBlade, axeEdge);
  group.add(pivot);
  group.position.set(0, 0, z);
  levelGroup.add(group);

  return {
    modelType: 'pendulumAxe',
    mesh: group,
    pivot: pivot,
    z: z,
    phase: Math.random() * Math.PI * 2,
    hitX: 0,
    radius: 2.1
  };
}

// Model 2: Rotating 4-Blade Cross Saw Windmill
function createRotatingCrossSaw(x, z) {
  const group = new THREE.Group();
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 2.2, 16),
    new THREE.MeshPhongMaterial({ color: 0xdc2626 })
  );
  hub.position.y = 1.1;

  const bladesGroup = new THREE.Group();
  bladesGroup.position.y = 1.0;
  const bladeMat = new THREE.MeshPhongMaterial({ color: 0xf97316, shininess: 80 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.45, 0.55), bladeMat);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 7.6), bladeMat);
  bladesGroup.add(b1, b2);

  group.add(hub, bladesGroup);
  group.position.set(x, 0, z);
  levelGroup.add(group);

  return {
    modelType: 'crossSaw',
    mesh: group,
    bladesGroup: bladesGroup,
    z: z,
    hitX: x,
    radius: 3.5
  };
}

// Model 3: Rolling Spiked Crusher Log
function createRollingSpikeLog(x, z, range, phase) {
  const group = new THREE.Group();
  const roller = new THREE.Group();
  roller.position.y = 1.1;

  const log = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.0, 6.2, 16),
    new THREE.MeshPhongMaterial({ color: 0xb91c1c })
  );
  log.rotation.z = Math.PI / 2;
  roller.add(log);

  const spikeMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });
  for (let lx = -2.4; lx <= 2.4; lx += 1.2) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 6), spikeMat);
      spike.position.set(lx, Math.cos(a) * 1.15, Math.sin(a) * 1.15);
      spike.rotation.x = a;
      roller.add(spike);
    }
  }

  group.add(roller);
  group.position.set(x, 0, z);
  levelGroup.add(group);

  return {
    modelType: 'spikeRoller',
    mesh: group,
    roller: roller,
    baseX: x,
    z: z,
    range: range,
    phase: phase,
    hitX: x,
    radius: 3.1
  };
}

// Model 4: Up-and-Down Smashing Thumper Hammers
function createSmashingHammer(x, z, phase) {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 6.5, 10),
    new THREE.MeshLambertMaterial({ color: 0x334155 })
  );
  frame.position.set(0, 3.25, -1.2);
  group.add(frame);

  const headGroup = new THREE.Group();
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 2.2, 2.2),
    new THREE.MeshPhongMaterial({ color: 0x9333ea })
  );
  const warnStripe = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.45, 2.3),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  warnStripe.position.y = -0.8;
  headGroup.add(block, warnStripe);
  headGroup.position.y = 1.2;
  group.add(headGroup);

  group.position.set(x, 0, z);
  levelGroup.add(group);

  return {
    modelType: 'thumper',
    mesh: group,
    headGroup: headGroup,
    z: z,
    phase: phase,
    hitX: x,
    isDown: true,
    radius: 1.9
  };
}

// Model 5: Sliding Purple Saw Pillars
function createSlidingSawPillar(x, z, range, phase) {
  const pillarGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 0.75, 14),
      new THREE.MeshPhongMaterial({ color: 0x7e22ce, shininess: 70 })
    );
    cyl.position.y = i * 0.85 + 0.4;
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(1.08, 1.08, 0.12, 8),
      new THREE.MeshLambertMaterial({ color: 0xe9d5ff })
    );
    ring.position.y = i * 0.85 + 0.8;
    pillarGroup.add(cyl, ring);
  }
  pillarGroup.position.set(x, 0, z);
  levelGroup.add(pillarGroup);

  return {
    modelType: 'sawPillar',
    mesh: pillarGroup,
    baseX: x,
    z: z,
    range: range,
    phase: phase,
    hitX: x,
    radius: 1.4
  };
}

function buildLevel(lvl) {
  while (levelGroup.children.length > 0) levelGroup.remove(levelGroup.children[0]);
  while (effectsGroup.children.length > 0) effectsGroup.remove(effectsGroup.children[0]);
  enemyBadgesContainer.innerHTML = '';
  gates = [];
  obstacles = [];
  enemyGroups = [];

  levelLength = 230 + lvl * 16;
  const TRACK_WIDTH = 15.4;

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

  let stepIndex = 0;
  for (let z = -24; z > -levelLength + 34; z -= 40) {
    stepIndex++;

    // --- MIXED & ALTERNATING GATES (+10/+15 and ×2) ---
    // Pattern alternates every step so ×2 is never stuck on one side, plus some gates slide left-to-right!
    const addValue = stepIndex % 2 === 0 ? 15 : 10;
    const isMultiplyOnLeft = (stepIndex + lvl) % 2 === 1;
    const isSlidingGateStep = stepIndex % 3 === 0;

    if (isSlidingGateStep) {
      // Staggered sliding gates that move left and right!
      spawnGate(-2.0, z, 6.2, '×2', 'multiply', 2, true, stepIndex, true, 0);
      spawnGate(2.0, z - 4.5, 6.2, `+${addValue}`, 'add', addValue, false, stepIndex, true, Math.PI);
    } else if (isMultiplyOnLeft) {
      // Left = ×2, Right = +10 or +15
      spawnGate(-3.7, z, 7.1, '×2', 'multiply', 2, true, stepIndex, false, 0);
      spawnGate(3.7, z, 7.1, `+${addValue}`, 'add', addValue, false, stepIndex, false, 0);
    } else {
      // Left = +10 or +15, Right = ×2
      spawnGate(-3.7, z, 7.1, `+${addValue}`, 'add', addValue, false, stepIndex, false, 0);
      spawnGate(3.7, z, 7.1, '×2', 'multiply', 2, true, stepIndex, false, 0);
    }

    // --- DIFFERENT OBSTACLE MODEL FOR EVERY STEP ---
    const obsZ = z - 15;
    const obstacleTypeIndex = (stepIndex + lvl) % 5;

    if (obstacleTypeIndex === 0) {
      // Step Type 1: Giant Overhead Swinging Pendulum Axe + Side Saw Pillar
      obstacles.push(createSwingingAxeObstacle(obsZ));
      obstacles.push(createSlidingSawPillar(0, obsZ - 5, 4.5, 0));
    } else if (obstacleTypeIndex === 1) {
      // Step Type 2: Twin Rotating 4-Blade Cross Saws
      obstacles.push(createRotatingCrossSaw(-3.6, obsZ));
      obstacles.push(createRotatingCrossSaw(3.6, obsZ - 5.5));
    } else if (obstacleTypeIndex === 2) {
      // Step Type 3: Rolling Spiked Crusher Log + Opposite Saw Pillar
      obstacles.push(createRollingSpikeLog(0, obsZ, 3.2, 0));
      obstacles.push(createSlidingSawPillar(0, obsZ - 5.5, 4.2, Math.PI));
    } else if (obstacleTypeIndex === 3) {
      // Step Type 4: Twin Smashing Thumper Hammers + Center Rotating Cross Saw
      obstacles.push(createSmashingHammer(-3.8, obsZ, 0));
      obstacles.push(createSmashingHammer(3.8, obsZ, Math.PI));
      obstacles.push(createRotatingCrossSaw(0, obsZ - 5.5));
    } else {
      // Step Type 5: Triple Criss-Cross Sliding Purple Saw Pillars
      obstacles.push(createSlidingSawPillar(-3.5, obsZ, 3.8, 0));
      obstacles.push(createSlidingSawPillar(3.5, obsZ - 3.5, 3.8, Math.PI));
      obstacles.push(createSlidingSawPillar(0, obsZ - 7.0, 4.5, 1.5));
    }

    // --- RED ENEMY CROWD SQUAD (STOP & FIGHT) ---
    if (z > -levelLength + 54) {
      const enemyZ = z - 28;
      const count = Math.min(140, 16 + lvl * 4 + stepIndex * 3);
      spawnEnemyCrowd((Math.random() - 0.5) * 4, enemyZ, count);
    }
  }

  createSurroundings();
}

function spawnGate(x, z, width, text, operation, value, isMultiply, pairId, isMoving, phase) {
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

  const postGeo = new THREE.CylinderGeometry(0.25, 0.25, height + 0.25, 12);
  const postMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const lp = new THREE.Mesh(postGeo, postMat);
  lp.position.set(-width / 2, height / 2, 0);
  const rp = new THREE.Mesh(postGeo, postMat);
  rp.position.set(width / 2, height / 2, 0);
  gateGroup.add(lp, rp);

  gateGroup.position.set(x, 0, z);
  levelGroup.add(gateGroup);
  gates.push({
    mesh: gateGroup,
    baseX: x,
    x,
    z,
    width,
    text,
    operation,
    value,
    pairId,
    isMoving,
    phase,
    triggered: false
  });
}

function spawnEnemyCrowd(x, z, count) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(3.8, 28),
    new THREE.MeshBasicMaterial({ color: 0xfca5a5, transparent: true, opacity: 0.48, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.03;
  group.add(disc);

  const avatars = [];
  const visualCount = Math.min(count, 60);
  for (let i = 0; i < visualCount; i++) {
    const redMan = createClearAvatar(false, i === 0);
    // Wider spacing (0.48) so every red avatar is clearly visible
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

// --- 7. COHESIVE & CLEAR PLAYER CROWD ---
const playerCrowdGroup = new THREE.Group();
scene.add(playerCrowdGroup);
const playerAvatars = [];

function assignFormationTargets() {
  for (let i = 0; i < playerAvatars.length; i++) {
    // 0.48 spacing ensures avatars stay in one cohesive group while every single character remains clearly visible
    const r = 0.48 * Math.sqrt(i);
    const theta = i * 2.39996;
    playerAvatars[i].userData.targetX = r * Math.cos(theta);
    playerAvatars[i].userData.targetZ = r * Math.sin(theta);
  }
}

function syncPlayerCrowdMeshes() {
  const visualCap = Math.max(0, Math.min(playerCount, 110));
  while (playerAvatars.length < visualCap) {
    const isLeader = playerAvatars.length === 0;
    const man = createClearAvatar(true, isLeader);
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
  if (playerAvatars.length > 0) {
    const victim = playerAvatars.pop();
    const vWorld = new THREE.Vector3();
    victim.getWorldPosition(vWorld);
    if (!worldPos) worldPos = vWorld;
    playerCrowdGroup.remove(victim);
  }
  if (worldPos) spawnParticles(worldPos, 0x0ea5e9, 7, false);
  if (isObstacleHit) {
    playSound('hit');
    triggerScreenShake();
  }
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
    spawnParticles(vWorld, 0xef4444, 7, false);
    eg.mesh.remove(victim);
  }
}

// --- 8. RESET & CONTROLS ---
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
    spawnParticles(playerCrowdGroup.position, 0xfacc15, 12, true);
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

// --- 9. MAIN ANIMATION LOOP ---
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

  updateVisualEffects();

  clouds.forEach(c => {
    c.position.y = c.userData.baseY + Math.sin(elapsed * 1.5 + c.userData.phase) * 0.5;
  });

  // Animate Moving Gates
  gates.forEach(g => {
    if (g.isMoving && !g.triggered) {
      g.x = Math.sin(elapsed * 2.0 + g.phase) * 3.6;
      g.mesh.position.x = g.x;
    }
  });

  // Animate All 5 Obstacle Models
  obstacles.forEach((obs) => {
    if (obs.modelType === 'pendulumAxe') {
      const swingAngle = Math.sin(elapsed * 2.8 + obs.phase) * 0.72;
      obs.pivot.rotation.z = swingAngle;
      obs.hitX = Math.sin(swingAngle) * 7.5;
    } else if (obs.modelType === 'crossSaw') {
      obs.bladesGroup.rotation.y += 0.085;
    } else if (obs.modelType === 'spikeRoller') {
      obs.roller.rotation.x -= 0.1;
      obs.hitX = obs.baseX + Math.sin(elapsed * 2.1 + obs.phase) * obs.range;
      obs.mesh.position.x = obs.hitX;
    } else if (obs.modelType === 'thumper') {
      const lift = Math.max(0, Math.sin(elapsed * 3.6 + obs.phase));
      obs.headGroup.position.y = 1.1 + lift * 3.8;
      obs.isDown = lift < 0.35;
    } else if (obs.modelType === 'sawPillar') {
      obs.mesh.rotation.y += 0.065;
      obs.hitX = obs.baseX + Math.sin(elapsed * 2.4 + obs.phase) * obs.range;
      obs.mesh.position.x = obs.hitX;
    }
  });

  if (!isPaused) {
    const isMovingNow = isRunning || Boolean(activeBattleGroup);
    const animSpeed = activeBattleGroup ? 18 : 13;

    playerAvatars.forEach(man => {
      man.position.x += (man.userData.targetX - man.position.x) * 0.2;
      man.position.z += (man.userData.targetZ - man.position.z) * 0.2;
      animateAvatar(man, elapsed, isMovingNow, animSpeed, true);
    });

    enemyGroups.forEach(eg => {
      if (!eg.defeated && eg !== activeBattleGroup) {
        eg.avatars.forEach(redMan => animateAvatar(redMan, elapsed, false, 10, false));
      }
    });

    // --- STOP & FIGHT CLASH MODE ---
    if (activeBattleGroup) {
      const eg = activeBattleGroup;
      playerCrowdGroup.position.x += (eg.x - playerCrowdGroup.position.x) * 0.1;
      playerCrowdGroup.position.z += ((eg.z + 1.8) - playerCrowdGroup.position.z) * 0.1;

      eg.avatars.forEach(redMan => {
        redMan.position.z += 0.035;
        animateAvatar(redMan, elapsed, true, 18, false);
      });

      if (elapsed - lastBattleTime > 0.055) {
        lastBattleTime = elapsed;
        playSound('clash');
        const stepKills = Math.max(1, Math.ceil(Math.min(playerCount, eg.count) / 18));
        for (let k = 0; k < stepKills; k++) {
          if (playerCount > 0 && eg.count > 0) {
            killOnePlayerAvatar(null, false);
            killOneEnemyAvatar(eg);
          }
        }

        if (eg.count <= 0) {
          eg.defeated = true;
          eg.disc.visible = false;
          eg.badge.style.display = 'none';
          activeBattleGroup = null;
          battleBanner.classList.add('hidden');
          spawnParticles(playerCrowdGroup.position, 0xfacc15, 14, true);
          playSound('gate');
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

      // Gate Collisions
      gates.forEach(g => {
        if (!g.triggered && Math.abs(playerCrowdGroup.position.z - g.z) < 1.35) {
          if (Math.abs(playerCrowdGroup.position.x - g.x) < g.width / 2 + 0.85) {
            gates.forEach(sibling => {
              if (sibling.pairId === g.pairId) sibling.triggered = true;
            });
            g.mesh.visible = false;

            if (g.operation === 'multiply') playerCount *= g.value;
            if (g.operation === 'add') playerCount += g.value;

            playSound('gate');
            showGainPopup(g.text);
            spawnParticles(playerCrowdGroup.position, 0xfacc15, 14, true);
            syncPlayerCrowdMeshes();
          }
        }
      });

      // Multi-Model Obstacle Collisions
      obstacles.forEach(obs => {
        if (obs.modelType === 'thumper' && !obs.isDown) return;
        const dz = Math.abs(playerCrowdGroup.position.z - obs.z);
        const dx = Math.abs(playerCrowdGroup.position.x - obs.hitX);
        if (dz < 1.3 && dx < obs.radius + 1.0) {
          if (elapsed - lastDamageTime > 0.065) {
            lastDamageTime = elapsed;
            killOnePlayerAvatar(new THREE.Vector3(obs.hitX, 0.5, obs.z), true);
          }
        }
      });

      // Engage Enemy Squad -> Stop & Fight
      enemyGroups.forEach(eg => {
        if (!eg.defeated && !eg.engaged) {
          if (Math.abs(playerCrowdGroup.position.z - eg.z) < 4.4) {
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
        playSound('win');
        const reward = 60 + currentLevel * 15 + playerCount;
        coins += reward;
        coinAmountEl.textContent = coins;
        modalTitle.textContent = `Level ${currentLevel} Victory! 🏆`;
        modalSubtitle.textContent = `+${reward} Coins Earned! (${playerCount} Avatars)`;
        resumeBtn.textContent = currentLevel < MAX_LEVELS ? 'Next Level ➔' : 'Play Again';
        modalOverlay.classList.remove('hidden');
      }
    }
  }

  // Slightly closer, clearer camera angle so every avatar detail pops out
  camera.position.set(0, 14.2, playerCrowdGroup.position.z + 19.5);
  camera.lookAt(0, 1.2, playerCrowdGroup.position.z - 16);

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
