const container = document.getElementById('canvas-container');
const playerBadge = document.getElementById('player-badge');
const enemyBadge = document.getElementById('enemy-badge');
const progressFill = document.getElementById('progress-fill');

// --- 1. SCENE, CAMERA & RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xbce6ff, 0.0045);

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  500
);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// --- 2. LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfffdf8, 0.65);
dirLight.position.set(-25, 50, 30);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 200;
const d = 60;
dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;
scene.add(dirLight);

// --- 3. TRACK / BRIDGE ---
const TRACK_WIDTH = 16;
const TRACK_LENGTH = 260;

const roadGroup = new THREE.Group();
scene.add(roadGroup);

// Main White Road Surface
const roadGeo = new THREE.BoxGeometry(TRACK_WIDTH, 2, TRACK_LENGTH);
const roadMat = new THREE.MeshLambertMaterial({ color: 0xf4f7f9 });
const roadMesh = new THREE.Mesh(roadGeo, roadMat);
roadMesh.position.set(0, -1, -70);
roadMesh.receiveShadow = true;
roadGroup.add(roadMesh);

// Subtle Gray Curbs
const curbGeo = new THREE.BoxGeometry(0.45, 2.25, TRACK_LENGTH);
const curbMat = new THREE.MeshLambertMaterial({ color: 0xd0d9e0 });

const leftCurb = new THREE.Mesh(curbGeo, curbMat);
leftCurb.position.set(-TRACK_WIDTH / 2 - 0.22, -0.95, -70);
roadGroup.add(leftCurb);

const rightCurb = new THREE.Mesh(curbGeo, curbMat);
rightCurb.position.set(TRACK_WIDTH / 2 + 0.22, -0.95, -70);
roadGroup.add(rightCurb);

// --- 4. LOW-POLY ICE MOUNTAINS ---
function createIcePeak(x, z, radius, height) {
  const peakGroup = new THREE.Group();

  // Base cyan/blue crystal rock
  const rockGeo = new THREE.ConeGeometry(radius, height, 6);
  const rockMat = new THREE.MeshLambertMaterial({
    color: 0x67b7dc,
    flatShading: true
  });
  const rock = new THREE.Mesh(rockGeo, rockMat);
  peakGroup.add(rock);

  // White/Ice snow cap on top
  const capGeo = new THREE.ConeGeometry(radius * 0.46, height * 0.44, 6);
  const capMat = new THREE.MeshLambertMaterial({
    color: 0xdff6ff,
    flatShading: true
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = height * 0.285;
  cap.rotation.y = 0.05;
  peakGroup.add(cap);

  peakGroup.position.set(x, height / 2 - 38, z);
  peakGroup.rotation.y = Math.random() * Math.PI;
  scene.add(peakGroup);
}

// Place mountains matching the video composition
const mountainLayout = [
  [-17, 10, 6.5, 42], [18, 12, 7, 41],
  [-28, -5, 9, 55], [27, -12, 8.5, 50],
  [-16, -28, 7, 48], [16, -35, 6.5, 46],
  [-32, -48, 11, 64], [30, -55, 10, 60],
  [-19, -75, 8.5, 54], [20, -82, 8, 52],
  [-35, -105, 13, 68], [34, -110, 12, 65],
  [-18, -130, 8, 50], [18, -135, 8, 50]
];
mountainLayout.forEach(m => createIcePeak(m[0], m[1], m[2], m[3]));

// --- 5. GATES (+ / x MULTIPLIERS) ---
const gates = [];

function createGateTexture(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Semi-transparent cyan forcefield
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(60, 210, 255, 0.28)');
  grad.addColorStop(1, 'rgba(0, 175, 255, 0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Top & bottom glowing border lines
  ctx.fillStyle = 'rgba(180, 245, 255, 0.8)';
  ctx.fillRect(0, 0, 512, 8);
  ctx.fillRect(0, 248, 512, 8);

  // Outlined 3D-style text
  ctx.font = '900 130px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(0, 110, 170, 0.85)';
  ctx.strokeText(label, 256, 132);
  ctx.fillStyle = 'rgba(210, 250, 255, 0.95)';
  ctx.fillText(label, 256, 132);

  return new THREE.CanvasTexture(canvas);
}

function addGate(x, z, width, text, operation, value) {
  const gateGroup = new THREE.Group();
  const height = 3.6;

  // Translucent Banner
  const planeGeo = new THREE.PlaneGeometry(width, height);
  const planeMat = new THREE.MeshBasicMaterial({
    map: createGateTexture(text),
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const banner = new THREE.Mesh(planeGeo, planeMat);
  banner.position.y = height / 2;
  gateGroup.add(banner);

  // Dark Gray Side Posts
  const postGeo = new THREE.CylinderGeometry(0.28, 0.28, height + 0.3, 16);
  const postMat = new THREE.MeshLambertMaterial({ color: 0x374151 });

  const leftPost = new THREE.Mesh(postGeo, postMat);
  leftPost.position.set(-width / 2, height / 2, 0);
  gateGroup.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, postMat);
  rightPost.position.set(width / 2, height / 2, 0);
  gateGroup.add(rightPost);

  gateGroup.position.set(x, 0, z);
  scene.add(gateGroup);

  gates.push({
    mesh: gateGroup,
    x, z, width,
    operation, value,
    triggered: false
  });
}

// Foreground Gate: "x3" on the left (matching 00:00 frame)
addGate(-3.8, 17.5, 7.6, 'x3', 'multiply', 3);

// Midground Gate: "+50" on the left
addGate(-3.8, -14, 7.6, '+50', 'add', 50);

// Far Double Gates: "+80" and "+70"
addGate(-3.9, -68, 7.7, '+80', 'add', 80);
addGate(3.9, -68, 7.7, '+70', 'add', 70);

// --- 6. PURPLE ROTATING SAW BARRELS ---
const obstacles = [];

function createPurplePillars(zPos) {
  const xs = [1.2, 3.6, 6.0];
  xs.forEach(x => {
    const pillarGroup = new THREE.Group();
    const segments = 5;
    const segHeight = 0.85;

    for (let i = 0; i < segments; i++) {
      // Purple Cylinder Drum
      const cylGeo = new THREE.CylinderGeometry(0.82, 0.82, segHeight * 0.86, 16);
      const cylMat = new THREE.MeshPhongMaterial({
        color: 0x7e22ce,
        shininess: 60
      });
      const cyl = new THREE.Mesh(cylGeo, cylMat);
      cyl.position.y = i * segHeight + segHeight / 2;
      cyl.castShadow = true;
      pillarGroup.add(cyl);

      // Metallic Saw-tooth Ring
      const ringGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.1, 10);
      const ringMat = new THREE.MeshLambertMaterial({ color: 0xc084fc });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = i * segHeight + segHeight;
      pillarGroup.add(ring);
    }

    // Yellow Top Cap
    const topCapGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16);
    const topCapMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const topCap = new THREE.Mesh(topCapGeo, topCapMat);
    topCap.position.y = segments * segHeight + 0.08;
    pillarGroup.add(topCap);

    pillarGroup.position.set(x, 0, zPos);
    scene.add(pillarGroup);
    obstacles.push(pillarGroup);
  });
}

createPurplePillars(-11.5);

// --- 7. STICKMAN CROWD GENERATOR ---
function createStickmanMesh(colorHex) {
  const charGroup = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({
    color: colorHex,
    shininess: 70
  });

  // Head
  const headGeo = new THREE.SphereGeometry(0.32, 12, 12);
  const head = new THREE.Mesh(headGeo, mat);
  head.position.y = 1.25;
  head.castShadow = true;
  charGroup.add(head);

  // Rounded Body
  const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.85, 10);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = 0.62;
  body.castShadow = true;
  charGroup.add(body);

  return charGroup;
}

// Player Blue Crowd (Starts with 67 stickmen as shown in the video)
let playerCount = 67;
const playerCrowdGroup = new THREE.Group();
playerCrowdGroup.position.set(-1.9, 0, 5.5);
scene.add(playerCrowdGroup);

const playerStickmen = [];

function rebuildPlayerCrowd(targetCount) {
  targetCount = Math.max(0, Math.min(targetCount, 220)); // Cap for smooth FPS
  while (playerStickmen.length < targetCount) {
    const idx = playerStickmen.length;
    const man = createStickmanMesh(0x38bdf8);

    // Golden-angle phyllotaxis spiral for tight natural clustering
    const radius = 0.36 * Math.sqrt(idx);
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

  while (playerStickmen.length > targetCount) {
    const removed = playerStickmen.pop();
    playerCrowdGroup.remove(removed);
  }
}

rebuildPlayerCrowd(playerCount);

// Red Enemy Crowd + Circular Red Arena Zone
const enemyCrowdGroup = new THREE.Group();
enemyCrowdGroup.position.set(0.3, 0, -42);
scene.add(enemyCrowdGroup);

// Red Target Ring on the Floor
const ringGeo = new THREE.RingGeometry(3.4, 3.7, 32);
const ringMat = new THREE.MeshBasicMaterial({
  color: 0xf87171,
  side: THREE.DoubleSide
});
const zoneRing = new THREE.Mesh(ringGeo, ringMat);
zoneRing.rotation.x = -Math.PI / 2;
zoneRing.position.y = 0.04;
enemyCrowdGroup.add(zoneRing);

const zoneDiscGeo = new THREE.CircleGeometry(3.4, 32);
const zoneDiscMat = new THREE.MeshBasicMaterial({
  color: 0xfecaca,
  transparent: true,
  opacity: 0.45,
  side: THREE.DoubleSide
});
const zoneDisc = new THREE.Mesh(zoneDiscGeo, zoneDiscMat);
zoneDisc.rotation.x = -Math.PI / 2;
zoneDisc.position.y = 0.02;
enemyCrowdGroup.add(zoneDisc);

// Populate Red Stickmen
let enemyCount = 35;
for (let i = 0; i < enemyCount; i++) {
  const redMan = createStickmanMesh(0xef4444);
  const r = 0.34 * Math.sqrt(i);
  const a = i * 2.39996;
  redMan.position.set(r * Math.cos(a), 0, r * Math.sin(a));
  redMan.userData = { phase: Math.random() * Math.PI * 2 };
  enemyCrowdGroup.add(redMan);
}

// Floating Pink '?' Mystery Box above track
const boxGeo = new THREE.BoxGeometry(1.3, 1.3, 1.3);
const boxMat = new THREE.MeshLambertMaterial({ color: 0xf472b6 });
const mysteryBox = new THREE.Mesh(boxGeo, boxMat);
mysteryBox.position.set(0.3, 6.2, -48);
scene.add(mysteryBox);

// --- 8. INTERACTIVITY & CAMERA CONTROLS ---
let targetX = playerCrowdGroup.position.x;
let isRunning = false;

window.addEventListener('mousemove', (e) => {
  const rect = container.getBoundingClientRect();
  if (e.clientX >= rect.left) {
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    targetX = normX * 5.2;
  }
});

window.addEventListener('mousedown', () => { isRunning = true; });
window.addEventListener('touchstart', () => { isRunning = true; });
window.addEventListener('touchmove', (e) => {
  const rect = container.getBoundingClientRect();
  const touch = e.touches[0];
  const normX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
  targetX = Math.max(-5.5, Math.min(5.5, normX * 5.5));
});

// Helper to project 3D coordinates to 2D HUD screen coordinates
function updateFloatingBadge(badgeEl, worldPos, yOffset) {
  const pos = worldPos.clone();
  pos.y += yOffset;
  pos.project(camera);

  const halfW = container.clientWidth / 2;
  const halfH = container.clientHeight / 2;

  const screenX = (pos.x * halfW) + halfW;
  const screenY = -(pos.y * halfH) + halfH;

  badgeEl.style.left = `${screenX}px`;
  badgeEl.style.top = `${screenY}px`;
}

// --- 9. ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  // Smooth horizontal steering
  playerCrowdGroup.position.x += (targetX - playerCrowdGroup.position.x) * 0.1;

  // Optional forward movement when user clicks/touches
  if (isRunning && playerCrowdGroup.position.z > -90) {
    playerCrowdGroup.position.z -= 0.16;

    // Update top level progress bar
    const progress = Math.min(100, Math.max(15, ((20 - playerCrowdGroup.position.z) / 110) * 100));
    progressFill.style.width = `${progress}%`;
  }

  // Check gate collisions
  gates.forEach(g => {
    if (!g.triggered && Math.abs(playerCrowdGroup.position.z - g.z) < 1.2) {
      if (Math.abs(playerCrowdGroup.position.x - g.x) < g.width / 2 + 1.2) {
        g.triggered = true;
        g.mesh.visible = false;
        if (g.operation === 'multiply') playerCount *= g.value;
        if (g.operation === 'add') playerCount += g.value;
        playerBadge.textContent = playerCount;
        rebuildPlayerCrowd(playerCount);
      }
    }
  });

  // Subtle idle/run bounce for stickmen
  playerStickmen.forEach(man => {
    man.position.y = Math.abs(Math.sin(elapsed * 8 + man.userData.phase)) * 0.22;
  });

  // Rotate purple obstacle pillars and floating mystery box
  obstacles.forEach(p => { p.rotation.y += 0.04; });
  mysteryBox.rotation.y += 0.02;
  mysteryBox.position.y = 6.2 + Math.sin(elapsed * 3) * 0.35;

  // Keep camera locked at the exact angle from the screenshot
  camera.position.set(0, 15.5, playerCrowdGroup.position.z + 23.5);
  camera.lookAt(0, 1.0, playerCrowdGroup.position.z - 22);

  // Sync 2D HTML number badge above the 3D blue crowd
  updateFloatingBadge(playerBadge, playerCrowdGroup.position, 3.2);

  renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

animate();
