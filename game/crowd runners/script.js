const container = document.getElementById('canvas-container');
const playerBadge = document.getElementById('player-badge');  
const progressFill = document.getElementById('progress-fill');
const levelBadge = document.getElementById('current-level-badge');
const coinAmountEl = document.getElementById('coin-amount');
const statusOverlay = document.getElementById('status-overlay');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const exitBtn = document.getElementById('exit-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');

// --- GAME STATE (50 LEVELS) ---
const MAX_LEVELS = 50;
let currentLevel = 1;
let coins = 144;
let playerCount = 25;
let isRunning = false;
let isPaused = false;
let levelLength = 220;

// --- 1. SCENE, CAMERA & RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x9be2fe, 0.0038);

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

// --- 3. ANIMATED SURROUNDINGS (MOUNTAINS, CLOUDS, SNOW) ---
const envGroup = new THREE.Group();
scene.add(envGroup);

const clouds = [];
function createAnimatedSurroundings() {
  // Clear previous surroundings
  while (envGroup.children.length > 0) envGroup.remove(envGroup.children[0]);
  clouds.length = 0;

  // Ice Mountains along the entire level length
  for (let z = 20; z > -levelLength - 80; z -= 22) {
    [-1, 1].forEach(side => {
      const x = side * (16 + Math.random() * 16);
      const height = 42 + Math.random() * 28;
      const radius = 6 + Math.random() * 5;

      const peakGroup = new THREE.Group();
      const rock = new THREE.Mesh(
        new THREE.ConeGeometry(radius, height, 6),
        new THREE.MeshLambertMaterial({ color: 0x5ab1d8, flatShading: true })
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

  // Floating 3D Low-Poly Clouds
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
    cloud.userData = { speed: 0.02 + Math.random() * 0.03, baseY: cloud.position.y, phase: Math.random() * 6 };
    envGroup.add(cloud);
    clouds.push(cloud);
  }
}

// Falling Snow Particles
const snowGeo = new THREE.BufferGeometry();
const snowCount = 450;
const snowPositions = new Float32Array(snowCount * 3);
for (let i = 0; i < snowCount * 3; i += 3) {
  snowPositions[i] = (Math.random() - 0.5) * 70;
  snowPositions[i + 1] = Math.random() * 40;
  snowPositions[i + 2] = -Math.random() * 260;
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
const snowParticles = new THREE.Points(
  snowGeo,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.45, transparent: true, opacity: 0.8 })
);
scene.add(snowParticles);

// --- 4. LEVEL BUILDER (1 TO 50 LEVELS) ---
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

  ctx.fillStyle = isPositive ? 'rgba(0, 185, 255, 0.48)' : 'rgba(244, 63, 94, 0.48)';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(0, 0, 256, 6);
  ctx.fillRect(0, 122, 256, 6);

  ctx.font = '900 64px "Segoe UI", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 128, 66);

  return new THREE.CanvasTexture(canvas);
}

function createStickmanMesh(colorHex) {
  const charGroup = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({ color: colorHex, shininess: 65 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), mat);
  head.position.y = 1.25;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.85, 8), mat);
  body.position.y = 0.62;
  charGroup.add(head, body);
  return charGroup;
}

function buildLevel(lvl) {
  while (levelGroup.children.length > 0) levelGroup.remove(levelGroup.children[0]);
  gates = [];
  obstacles = [];
  enemyGroups = [];

  // Level length increases with level number
  levelLength = 180 + lvl * 12;
  const TRACK_WIDTH = 15;

  // Road & Curbs
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(TRACK_WIDTH, 2, levelLength + 40),
    new THREE.MeshLambertMaterial({ color: 0xf8fafc })
  );
  road.position.set(0, -1, -levelLength / 2 + 10);
  levelGroup.add(road);

  const curbGeo = new THREE.BoxGeometry(0.45, 2.3, levelLength + 40);
  const curbMat = new THREE.MeshLambertMaterial({ color: 0xcbd5e1 });
  const leftCurb = new THREE.Mesh(curbGeo, curbMat);
  leftCurb.position.set(-TRACK_WIDTH / 2 - 0.22, -0.9, -levelLength / 2 + 10);
  const rightCurb = new THREE.Mesh(curbGeo, curbMat);
  rightCurb.position.set(TRACK_WIDTH / 2 + 0.22, -0.9, -levelLength / 2 + 10);
  levelGroup.add(leftCurb, rightCurb);

  // Finish Line Checkerboard
  const finishGeo = new THREE.BoxGeometry(TRACK_WIDTH, 0.1, 4);
  const finishMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const finishLine = new THREE.Mesh(finishGeo, finishMat);
  finishLine.position.set(0, 0.05, -levelLength + 10);
  levelGroup.add(finishLine);

  // Spawn Gates, Spinning Purple Obstacles & Enemy Crowds dynamically
  for (let z = -18; z > -levelLength + 28; z -= 32) {
    // 1. Gates
    const leftVal = Math.floor(10 + lvl * 3 + Math.random() * 25);
    const rightMult = Math.random() > 0.65 ? 2 : 3;
    spawnGate(-3.6, z, 7.0, `+${leftVal}`, 'add', leftVal);
    spawnGate(3.6, z, 7.0, `x${rightMult}`, 'multiply', rightMult);

    // 2. Purple Rotating Saw Pillars
    const obsZ = z - 12;
    const pillarCount = Math.min(3, 1 + Math.floor(lvl / 4));
    for (let i = 0; i < pillarCount; i++) {
      const px = (i - 1) * 3.4 + (Math.random() * 1.5 - 0.75);
      const pillar = createPurplePillar(px, obsZ);
      levelGroup.add(pillar);
      obstacles.push(pillar);
    }

    // 3. Red Enemy Crowd Zone
    if (z < -40) {
      const enemyZ = z - 22;
      const count = Math.min(60, 12 + lvl * 2);
      spawnEnemyCrowd((Math.random() - 0.5) * 4, enemyZ, count);
    }
  }

  createAnimatedSurroundings();
}

function spawnGate(x, z, width, text, operation, value) {
  const gateGroup = new THREE.Group();
  const height = 3.5;
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: createGateTexture(text, true),
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

function createPurplePillar(x, z) {
  const pillarGroup = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.75, 14),
      new THREE.MeshPhongMaterial({ color: 0x7e22ce })
    );
    cyl.position.y = i * 0.85 + 0.4;
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 0.95, 0.1, 8),
      new THREE.MeshLambertMaterial({ color: 0xd8b4fe })
    );
    ring.position.y = i * 0.85 + 0.8;
    pillarGroup.add(cyl, ring);
  }
  pillarGroup.position.set(x, 0, z);
  return pillarGroup;
}

function spawnEnemyCrowd(x, z, count) {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(3.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xfca5a5, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.03;
  group.add(disc);

  for (let i = 0; i < Math.min(count, 45); i++) {
    const redMan = createStickmanMesh(0xef4444);
    const r = 0.35 * Math.sqrt(i);
    const a = i * 2.39996;
    redMan.position.set(r * Math.cos(a), 0, r * Math.sin(a));
    group.add(redMan);
  }
  group.position.set(x, 0, z);
  levelGroup.add(group);
  enemyGroups.push({ mesh: group, x, z, count, triggered: false });
}

// --- 5. PLAYER CROWD ---
const playerCrowdGroup = new THREE.Group();
scene.add(playerCrowdGroup);
const playerStickmen = [];

function rebuildPlayerCrowd(targetCount) {
  const visualCap = Math.max(0, Math.min(targetCount, 180));
  while (playerStickmen.length < visualCap) {
    const idx = playerStickmen.length;
    const man = createStickmanMesh(0x29b6f6);
    const radius = 0.35 * Math.sqrt(idx);
    const theta = idx * 2.39996;
    man.userData = {
      baseX: radius * Math.cos(theta),
      baseZ: radius * Math.sin(theta),
      phase: Math.random() * Math.PI * 2
    };
    man.position.set(man.userData.baseX, 0, man.userData.baseZ);
    playerCrowdGroup.add(man);
    playerStickmen.push(man);
  }
  while (playerStickmen.length > visualCap) {
    playerCrowdGroup.remove(playerStickmen.pop());
  }
  playerBadge.textContent = Math.max(0, targetCount);
}

function resetLevelState() {
  playerCount = 20 + currentLevel * 2;
  playerCrowdGroup.position.set(0, 0, 8);
  targetX = 0;
  isRunning = false;
  isPaused = false;
  levelBadge.textContent = currentLevel;
  progressFill.style.width = '0%';
  statusOverlay.textContent = `Touch & Drag to Run (Level ${currentLevel} of ${MAX_LEVELS})`;
  rebuildPlayerCrowd(playerCount);
  buildLevel(currentLevel);
}

// --- 6. CONTROLS (STEERING, PAUSE, EXIT, FULLSCREEN) ---
let targetX = 0;

function handlePointerMove(clientX) {
  if (isPaused) return;
  const normX = (clientX / window.innerWidth) * 2 - 1;
  targetX = Math.max(-5.5, Math.min(5.5, normX * 6.0));
}

window.addEventListener('mousemove', e => handlePointerMove(e.clientX));
window.addEventListener('mousedown', (e) => {
  if (e.target.closest('#hud-top') || e.target.closest('#modal-overlay')) return;
  if (!isPaused) isRunning = true;
});

window.addEventListener('touchstart', (e) => {
  if (e.target.closest('#hud-top') || e.target.closest('#modal-overlay')) return;
  if (!isPaused) isRunning = true;
  handlePointerMove(e.touches[0].clientX);
});
window.addEventListener('touchmove', e => handlePointerMove(e.touches[0].clientX));

// Top-Left Pause Button
pauseBtn.addEventListener('click', () => {
  isPaused = true;
  modalTitle.textContent = 'Game Paused ⏸️';
  modalSubtitle.textContent = `Level ${currentLevel} / ${MAX_LEVELS}`;
  resumeBtn.textContent = 'Resume Game';
  modalOverlay.classList.remove('hidden');
});

// Top-Left Exit Button
exitBtn.addEventListener('click', () => {
  isPaused = true;
  modalTitle.textContent = 'Exit Game? 🚪';
  modalSubtitle.textContent = `Current Progress: Level ${currentLevel} of ${MAX_LEVELS}`;
  resumeBtn.textContent = 'Continue Playing';
  modalOverlay.classList.remove('hidden');
});

// Top-Left Fullscreen Toggle Button
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
    // Advance to next level
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

// --- 7. MAIN ANIMATION LOOP ---
const clock = new THREE.Clock();

function updateBadgePosition() {
  const pos = playerCrowdGroup.position.clone();
  pos.y += 3.0;
  pos.project(camera);
  const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-(pos.y * 0.5) + 0.5) * window.innerHeight;
  playerBadge.style.left = `${x}px`;
  playerBadge.style.top = `${y}px`;
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  // Animate Floating Clouds & Snow
  clouds.forEach(c => {
    c.position.y = c.userData.baseY + Math.sin(elapsed * 1.5 + c.userData.phase) * 0.6;
  });

  const snowAttr = snowGeo.getAttribute('position');
  for (let i = 1; i < snowAttr.count * 3; i += 3) {
    snowAttr.array[i] -= 0.12;
    if (snowAttr.array[i] < -5) snowAttr.array[i] = 38;
  }
  snowAttr.needsUpdate = true;

  // Rotate Obstacles
  obstacles.forEach(p => { p.rotation.y += 0.05; });

  if (!isPaused) {
    playerCrowdGroup.position.x += (targetX - playerCrowdGroup.position.x) * 0.12;

    if (isRunning) {
      const speed = 0.24 + currentLevel * 0.004;
      playerCrowdGroup.position.z -= speed;

      // Update Progress Bar
      const pct = Math.min(100, Math.max(0, ((8 - playerCrowdGroup.position.z) / (levelLength - 4)) * 100));
      progressFill.style.width = `${pct}%`;

      // Gate Collisions
      gates.forEach(g => {
        if (!g.triggered && Math.abs(playerCrowdGroup.position.z - g.z) < 1.2) {
          if (Math.abs(playerCrowdGroup.position.x - g.x) < g.width / 2 + 1.0) {
            g.triggered = true;
            g.mesh.visible = false;
            if (g.operation === 'multiply') playerCount *= g.value;
            if (g.operation === 'add') playerCount += g.value;
            rebuildPlayerCrowd(playerCount);
          }
        }
      });

      // Purple Saw Obstacle Collisions
      obstacles.forEach(obs => {
        if (
          Math.abs(playerCrowdGroup.position.z - obs.position.z) < 1.1 &&
          Math.abs(playerCrowdGroup.position.x - obs.position.x) < 1.8
        ) {
          playerCount = Math.max(0, playerCount - 1);
          rebuildPlayerCrowd(playerCount);
        }
      });

      // Enemy Crowd Collisions
      enemyGroups.forEach(eg => {
        if (!eg.triggered && Math.abs(playerCrowdGroup.position.z - eg.z) < 2.2) {
          if (Math.abs(playerCrowdGroup.position.x - eg.x) < 3.8) {
            eg.triggered = true;
            eg.mesh.visible = false;
            playerCount -= eg.count;
            rebuildPlayerCrowd(playerCount);
          }
        }
      });

      // Check Game Over
      if (playerCount <= 0) {
        isPaused = true;
        modalTitle.textContent = 'Level Failed! 💥';
        modalSubtitle.textContent = `Try Level ${currentLevel} Again`;
        resumeBtn.textContent = 'Retry Level';
        modalOverlay.classList.remove('hidden');
      }

      // Check Level Complete
      if (playerCrowdGroup.position.z <= -levelLength + 10) {
        isPaused = true;
        coins += 50 + currentLevel * 10;
        coinAmountEl.textContent = coins;
        modalTitle.textContent = `Level ${currentLevel} Complete! 🎉`;
        modalSubtitle.textContent = currentLevel < MAX_LEVELS
          ? `Ready for Level ${currentLevel + 1} / ${MAX_LEVELS}`
          : 'You Beat All 50 Levels! 🏆';
        resumeBtn.textContent = currentLevel < MAX_LEVELS ? 'Next Level ➔' : 'Play Again';
        modalOverlay.classList.remove('hidden');
      }
    }

    // Bounce Stickmen
    playerStickmen.forEach(man => {
      man.position.y = Math.abs(Math.sin(elapsed * 9 + man.userData.phase)) * 0.24;
    });
  }

  // Follow Camera
  camera.position.set(0, 15.5, playerCrowdGroup.position.z + 22.5);
  camera.lookAt(0, 1.0, playerCrowdGroup.position.z - 20);
  snowParticles.position.z = playerCrowdGroup.position.z;

  updateBadgePosition();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

resetLevelState();
animate();
