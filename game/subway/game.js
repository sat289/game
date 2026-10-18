// ================= 1. REAL 3D GLB HUMAN AVATARS & BOARDS CONFIG =================
const AVATAR_CATALOG = [
  {
    id: "michelle",
    name: "Street Dancer (3D)",
    price: 0,
    glbUrl: "https://threejs.org/examples/models/gltf/Michelle.glb",
    scale: 1.35,
    rotY: Math.PI
  },
  {
    id: "soldier",
    name: "Metro Commando (3D)",
    price: 500,
    glbUrl: "https://threejs.org/examples/models/gltf/Soldier.glb",
    scale: 1.35,
    rotY: 0
  },
  {
    id: "xbot",
    name: "Cyber Runner (3D)",
    price: 1000,
    glbUrl: "https://threejs.org/examples/models/gltf/Xbot.glb",
    scale: 1.35,
    rotY: Math.PI
  }
];

const POLICE_GLB_URL = "https://threejs.org/examples/models/gltf/Soldier.glb";

const BOARD_SKIN_CATALOG = [
  { id: "flame", name: "Flame Cruiser", price: 0, deckColor: 0xff3300, rimColor: 0xffd700 },
  { id: "bouncer", name: "Neon Cyberdeck", price: 400, deckColor: 0x00ffcc, rimColor: 0xff00aa },
  { id: "stealth", name: "Carbon Stealth", price: 900, deckColor: 0x1c1c1c, rimColor: 0x00ff66 }
];

const savedProfile = JSON.parse(localStorage.getItem("carracing_profile") || "null");
window.playerProfile = Object.assign(
  {
    coins: 300,
    diamonds: 25, // Starts with 25 diamonds so you can test the 5-diamond Revive immediately
    boards: 5,
    unlockedAvatars: ["michelle"],
    unlockedBoardSkins: ["flame"],
    selectedAvatar: "michelle",
    selectedBoard: "flame"
  },
  savedProfile || {}
);

if (typeof window.playerProfile.diamonds !== "number") {
  window.playerProfile.diamonds = 25;
}

// ================= 2. WEB AUDIO SOUND SYNTHESIZER =================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === "suspended") audioCtx.resume();
}
function playTone(freq, type = "sine", duration = 0.12, vol = 0.15, slideFreq = null) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (slideFreq) osc.frequency.exponentialRampToValueAtTime(slideFreq, audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
const SFX = {
  coin: () => { playTone(987, "sine", 0.08, 0.12); setTimeout(() => playTone(1318, "sine", 0.14, 0.12), 55); },
  jump: () => playTone(260, "triangle", 0.18, 0.15, 580),
  roll: () => playTone(380, "triangle", 0.15, 0.15, 140),
  swoosh: () => playTone(320, "sine", 0.09, 0.12, 480),
  whistle: () => {
    playTone(2650, "triangle", 0.18, 0.18, 2850);
    setTimeout(() => playTone(2750, "triangle", 0.25, 0.18, 2450), 200);
  },
  bark: () => {
    playTone(210, "sawtooth", 0.1, 0.18, 120);
    setTimeout(() => playTone(230, "sawtooth", 0.12, 0.18, 110), 140);
  },
  crash: () => playTone(105, "sawtooth", 0.35, 0.25, 40),
  powerup: () => {
    playTone(440, "square", 0.1, 0.12, 660);
    setTimeout(() => playTone(660, "square", 0.2, 0.12, 990), 100);
  }
};

// ================= 3. THREE.JS SCENE & TRACK ENVIRONMENT =================
const canvas = document.getElementById("gameCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.outputEncoding = THREE.sRGBEncoding;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x28133b);
scene.fog = new THREE.FogExp2(0x28133b, 0.0075);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 240);

const hemiLight = new THREE.HemisphereLight(0xffd6ff, 0x2b1d3d, 1.15);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff0dd, 1.2);
dirLight.position.set(20, 40, 25);
dirLight.castShadow = true;
scene.add(dirLight);

const LANES = [-3.6, 0, 3.6];

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(70, 420),
  new THREE.MeshStandardMaterial({ color: 0x3a3242, roughness: 0.9 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -160;
ground.receiveShadow = true;
scene.add(ground);

const railMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.85, roughness: 0.2 });
LANES.forEach(laneX => {
  [-0.75, 0.75].forEach(offset => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 420), railMat);
    rail.position.set(laneX + offset, 0.08, -160);
    scene.add(rail);
  });
});

const scrollingProps = [];
const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.8 });
const poleMat = new THREE.MeshStandardMaterial({ color: 0x607d8b, metalness: 0.7, roughness: 0.3 });
const buildingMat = new THREE.MeshStandardMaterial({ color: 0x241434, roughness: 0.7 });
const winMat = new THREE.MeshBasicMaterial({ color: 0xffcc66 });

for (let z = 20; z > -240; z -= 4) {
  const row = new THREE.Group();
  row.position.z = z;

  LANES.forEach(lx => {
    const sleeper = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.09, 0.45), sleeperMat);
    sleeper.position.set(lx, 0.04, 0);
    row.add(sleeper);
  });

  if (Math.abs(z) % 20 === 0) {
    [-6.5, 6.5].forEach(px => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 9.5, 8), poleMat);
      mast.position.set(px, 4.75, 0);
      row.add(mast);
    });
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.22, 0.22), poleMat);
    crossBeam.position.set(0, 9.1, 0);
    row.add(crossBeam);

    [-1, 1].forEach(side => {
      const h = 14 + (Math.abs(z * side) % 10);
      const b = new THREE.Mesh(new THREE.BoxGeometry(6, h, 8), buildingMat);
      b.position.set(side * 12, h / 2, 0);
      row.add(b);

      for (let wy = 3; wy < h - 2; wy += 3) {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), winMat);
        w.position.set(side * 8.98, wy, 0);
        w.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        row.add(w);
      }
    });
  }

  scene.add(row);
  scrollingProps.push(row);
}

// ================= 4. REAL HUMANS (SCULPTED + GLTFLOADER RIGGED HUMANS) =================
function createSculptedHuman(shirtHex = 0x2277ff, pantsHex = 0x223344, isPolice = false) {
  const root = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.6 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: isPolice ? 0x1b263b : shirtHex, roughness: 0.5 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: isPolice ? 0x0d1b2a : pantsHex, roughness: 0.6 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.95, 16), shirtMat);
  torso.position.y = 1.45;
  torso.castShadow = true;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), skinMat);
  head.position.y = 2.18;
  root.add(head);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: isPolice ? 0x0a1128 : 0xe63946 })
  );
  cap.position.y = 2.34;
  root.add(cap);

  function makeLimb(radiusTop, radiusBottom, len, mat, hasShoe = false) {
    const pivot = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, len, 14), mat);
    mesh.position.y = -len / 2;
    mesh.castShadow = true;
    pivot.add(mesh);
    if (hasShoe) {
      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.42), shoeMat);
      shoe.position.set(0, -len, -0.08);
      pivot.add(shoe);
    }
    return pivot;
  }

  const leftLeg = makeLimb(0.15, 0.11, 0.92, pantsMat, true);
  leftLeg.position.set(-0.17, 0.95, 0);
  const rightLeg = makeLimb(0.15, 0.11, 0.92, pantsMat, true);
  rightLeg.position.set(0.17, 0.95, 0);

  const leftArm = makeLimb(0.11, 0.08, 0.78, shirtMat, false);
  leftArm.position.set(-0.46, 1.85, 0);
  const rightArm = makeLimb(0.11, 0.08, 0.78, shirtMat, false);
  rightArm.position.set(0.46, 1.85, 0);

  const sprayCan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.26, 12),
    new THREE.MeshStandardMaterial({ color: 0x00f5d4, metalness: 0.5 })
  );
  sprayCan.position.set(0, -0.78, -0.08);
  rightArm.add(sprayCan);

  root.add(leftLeg, rightLeg, leftArm, rightArm);
  root.userData = { leftLeg, rightLeg, leftArm, rightArm, sprayCan };
  return root;
}

const playerGroup = new THREE.Group();
scene.add(playerGroup);

const fallbackHuman = createSculptedHuman();
playerGroup.add(fallbackHuman);

let activeGlbHuman = null;
let playerMixer = null;
let playerActions = { idle: null, run: null };
const glbCache = {};
const gltfLoader = new THREE.GLTFLoader();

// Hoverboard Mesh
const boardGroup = new THREE.Group();
const boardDeck = new THREE.Mesh(
  new THREE.BoxGeometry(1.15, 0.1, 2.2),
  new THREE.MeshStandardMaterial({ color: 0xff3300, metalness: 0.4, roughness: 0.3 })
);
const boardRim = new THREE.Mesh(
  new THREE.BoxGeometry(1.24, 0.06, 2.28),
  new THREE.MeshBasicMaterial({ color: 0xffd700 })
);
boardGroup.add(boardRim, boardDeck);
boardGroup.position.y = 0.07;
boardGroup.visible = false;
playerGroup.add(boardGroup);

// Jetpack Thrusters
const jetpackGroup = new THREE.Group();
[-0.22, 0.22].forEach(ox => {
  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.75, 12),
    new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.7, roughness: 0.2 })
  );
  cyl.position.set(ox, 1.4, 0.28);
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 1.3, 10),
    new THREE.MeshBasicMaterial({ color: 0xff4500 })
  );
  flame.rotation.x = Math.PI;
  flame.position.set(ox, 0.45, 0.28);
  jetpackGroup.add(cyl, flame);
});
jetpackGroup.visible = false;
playerGroup.add(jetpackGroup);

// Dizzy Stars Overhead
const dizzyStarsGroup = new THREE.Group();
dizzyStarsGroup.position.y = 2.75;
for (let i = 0; i < 4; i++) {
  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.15, 0),
    new THREE.MeshBasicMaterial({ color: 0xffea00 })
  );
  const angle = (i / 4) * Math.PI * 2;
  star.position.set(Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55);
  dizzyStarsGroup.add(star);
}
dizzyStarsGroup.visible = false;
playerGroup.add(dizzyStarsGroup);

// Police Inspector + Dog
const chaserGroup = new THREE.Group();
const fallbackPolice = createSculptedHuman(0x1b263b, 0x0d1b2a, true);
fallbackPolice.userData.sprayCan.visible = false;
chaserGroup.add(fallbackPolice);

let policeMixer = null;
gltfLoader.load(POLICE_GLB_URL, (gltf) => {
  glbCache[POLICE_GLB_URL] = gltf;
  const officer = THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(gltf.scene) : gltf.scene.clone();
  officer.scale.set(1.42, 1.42, 1.42);
  officer.rotation.y = 0;
  chaserGroup.add(officer);
  fallbackPolice.visible = false;
  policeMixer = new THREE.AnimationMixer(officer);
  const runClip = THREE.AnimationClip.findByName(gltf.animations, "Run") || gltf.animations[1] || gltf.animations[0];
  if (runClip) policeMixer.clipAction(runClip).play();
});

const dogGroup = new THREE.Group();
const dogFurMat = new THREE.MeshStandardMaterial({ color: 0xc29b61, roughness: 0.7 });
const dogDarkMat = new THREE.MeshStandardMaterial({ color: 0x2b2118, roughness: 0.8 });
const dTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.85, 12), dogFurMat);
dTorso.rotation.x = Math.PI / 2;
dTorso.position.y = 0.48;
const dHead = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 14), dogFurMat);
dHead.position.set(0, 0.72, -0.42);
const dSnout = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.25, 10), dogDarkMat);
dSnout.rotation.x = Math.PI / 2;
dSnout.position.set(0, 0.68, -0.6);
const dLegs = [];
[[-0.14, -0.28], [0.14, -0.28], [-0.14, 0.28], [0.14, 0.28]].forEach(([lx, lz]) => {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.45, 8), dogFurMat);
  leg.position.set(lx, 0.22, lz);
  dogGroup.add(leg);
  dLegs.push(leg);
});
dogGroup.add(dTorso, dHead, dSnout);
dogGroup.position.set(0.95, 0, 0.25);
chaserGroup.add(dogGroup);
scene.add(chaserGroup);

window.loadSelectedHumanAvatar = function () {
  const av = AVATAR_CATALOG.find(a => a.id === window.playerProfile.selectedAvatar) || AVATAR_CATALOG[0];
  const badge = document.getElementById("modelStatusBadge");
  fallbackHuman.visible = true;

  if (activeGlbHuman) {
    playerGroup.remove(activeGlbHuman);
    activeGlbHuman = null;
    playerMixer = null;
  }

  const setupClonedGlb = (gltf) => {
    if (activeGlbHuman) playerGroup.remove(activeGlbHuman);
    const clone = THREE.SkeletonUtils ? THREE.SkeletonUtils.clone(gltf.scene) : gltf.scene.clone();
    clone.scale.set(av.scale, av.scale, av.scale);
    clone.rotation.y = av.rotY;
    clone.traverse(node => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    playerGroup.add(clone);
    activeGlbHuman = clone;
    fallbackHuman.visible = false;

    playerMixer = new THREE.AnimationMixer(clone);
    const clips = gltf.animations || [];
    const runClip = THREE.AnimationClip.findByName(clips, "Run") || clips.find(c => /run|walk|salsa|dance/i.test(c.name)) || clips[0];
    const idleClip = THREE.AnimationClip.findByName(clips, "Idle") || clips[0];

    if (runClip) playerActions.run = playerMixer.clipAction(runClip);
    if (idleClip) playerActions.idle = playerMixer.clipAction(idleClip);

    if (gameState === "PLAYING" && playerActions.run) {
      playerActions.run.reset().play();
    } else if (playerActions.idle) {
      playerActions.idle.reset().play();
    }
    if (badge) badge.innerText = `🧍 3D Model: ${av.name}`;
  };

  if (glbCache[av.glbUrl]) {
    setupClonedGlb(glbCache[av.glbUrl]);
  } else {
    if (badge) badge.innerText = `⏳ Loading ${av.name}...`;
    gltfLoader.load(
      av.glbUrl,
      (gltf) => {
        glbCache[av.glbUrl] = gltf;
        setupClonedGlb(gltf);
      },
      undefined,
      () => {
        if (badge) badge.innerText = `🧍 3D Sculpted Mode`;
      }
    );
  }

  const skin = BOARD_SKIN_CATALOG.find(b => b.id === window.playerProfile.selectedBoard) || BOARD_SKIN_CATALOG[0];
  boardDeck.material.color.setHex(skin.deckColor);
  boardRim.material.color.setHex(skin.rimColor);
};

// ================= 5. 4 DIFFERENT REALISTIC 3D TRAIN MODELS =================
function createTrainSideTexture(styleType) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext("2d");

  if (styleType === "bullet") {
    // Model 1: High-Speed Aerodynamic Bullet Train (White & Electric Blue)
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = "#0077b6";
    ctx.fillRect(0, 130, 1024, 32);
    ctx.fillStyle = "#03045e";
    ctx.fillRect(0, 210, 1024, 46);
    // Continuous Sleek Tinted Window Strip
    ctx.fillStyle = "#023e8a";
    ctx.fillRect(30, 62, 964, 52);
    for (let x = 50; x < 960; x += 110) {
      ctx.fillStyle = "rgba(144, 224, 239, 0.75)";
      ctx.fillRect(x, 68, 85, 40);
    }
  } else if (styleType === "steam") {
    // Model 2: Transylvania Gothic Vintage Express (Crimson & Gold)
    ctx.fillStyle = "#590d22";
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = "#ffb703";
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 1000, 232);
    for (let x = 55; x < 960; x += 150) {
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(x, 55, 80, 95);
      ctx.strokeStyle = "#2b0912";
      ctx.lineWidth = 6;
      ctx.strokeRect(x, 55, 80, 95);
    }
  } else if (styleType === "cargo") {
    // Model 3: Heavy Corrugated Industrial Freight Container Train
    ctx.fillStyle = "#d97706";
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = "#92400e";
    for (let x = 0; x < 1024; x += 32) {
      ctx.fillRect(x, 20, 14, 216);
    }
    ctx.fillStyle = "#fef3c7";
    ctx.font = "bold 44px Impact, sans-serif";
    ctx.fillText("CARGO EXPRESS • HEAVY FREIGHT", 190, 145);
  } else {
    // Model 4: City Metro Commuter Subway Coach (Silver & Red/Yellow Stripe)
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#d8dee9");
    grad.addColorStop(0.5, "#eceff4");
    grad.addColorStop(1, "#2b2d42");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = "#ef233c";
    ctx.fillRect(0, 152, 1024, 18);

    for (let x = 40; x < 980; x += 155) {
      if (x % 310 === 40) {
        ctx.fillStyle = "#8d99ae";
        ctx.fillRect(x, 38, 66, 175);
        ctx.fillStyle = "#a8dadc";
        ctx.fillRect(x + 8, 52, 20, 65);
        ctx.fillRect(x + 38, 52, 20, 65);
      } else {
        ctx.fillStyle = "rgba(255, 230, 150, 0.85)";
        ctx.fillRect(x - 10, 55, 85, 62);
      }
    }
  }
  return new THREE.CanvasTexture(c);
}

const TRAIN_TEXTURES = {
  metro: createTrainSideTexture("metro"),
  bullet: createTrainSideTexture("bullet"),
  steam: createTrainSideTexture("steam"),
  cargo: createTrainSideTexture("cargo")
};

function createRealistic3DTrain(length = 16, hasRamp = false, isMoving = false, forcedModelType = null) {
  const group = new THREE.Group();
  const wheels = [];

  const modelTypes = ["metro", "bullet", "steam", "cargo"];
  const modelType = forcedModelType || modelTypes[Math.floor(Math.random() * modelTypes.length)];
  const sideTex = TRAIN_TEXTURES[modelType];

  const roofHex = modelType === "bullet" ? 0xffffff : modelType === "steam" ? 0x3c0919 : modelType === "cargo" ? 0x78350f : 0xced4da;
  const frontHex = modelType === "bullet" ? 0x0077b6 : modelType === "steam" ? 0x800f2f : modelType === "cargo" ? 0xb45309 : 0x1d3557;

  const bodyMaterials = [
    new THREE.MeshStandardMaterial({ map: sideTex, metalness: 0.5, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ map: sideTex, metalness: 0.5, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ color: roofHex, metalness: 0.6, roughness: 0.35 }),
    new THREE.MeshStandardMaterial({ color: 0x1b1b1e, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: frontHex, metalness: 0.6, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ color: 0x2b2d42, metalness: 0.5, roughness: 0.5 })
  ];

  // Main Coach Body
  const coach = new THREE.Mesh(new THREE.BoxGeometry(2.75, 2.95, length), bodyMaterials);
  coach.position.y = 1.85;
  coach.castShadow = true;
  coach.receiveShadow = true;
  group.add(coach);

  // Undercarriage & Rotating Steel Bogie Wheels
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.38, length - 0.6),
    new THREE.MeshStandardMaterial({ color: 0x161a1d, metalness: 0.6, roughness: 0.7 })
  );
  chassis.position.y = 0.25;
  group.add(chassis);

  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.18, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0xadb5bd, metalness: 0.9, roughness: 0.2 });
  for (let wz = -length / 2 + 2; wz <= length / 2 - 2; wz += 3.6) {
    [-1.15, 1.15].forEach(wx => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.32, wz);
      group.add(w);
      wheels.push(w);
    });
  }

  // Distinct Front Noses & Roof Details for Each of the 4 Train Models
  if (modelType === "bullet") {
    // Sleek Aerodynamic Bullet Nose Cone
    const aeroNose = new THREE.Mesh(
      new THREE.ConeGeometry(1.38, 2.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xf8f9fa, metalness: 0.5, roughness: 0.2 })
    );
    aeroNose.rotation.x = Math.PI / 2;
    aeroNose.position.set(0, 1.5, length / 2 + 1.1);
    group.add(aeroNose);

    const cockpitGlass = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.65, 0.9),
      new THREE.MeshStandardMaterial({ color: 0x00b4d8, emissive: 0x0077b6, emissiveIntensity: 0.5 })
    );
    cockpitGlass.position.set(0, 2.35, length / 2 + 0.15);
    cockpitGlass.rotation.x = 0.35;
    group.add(cockpitGlass);
  } else if (modelType === "steam") {
    // Classic Steam Locomotive Cylindrical Boiler + Smokestack + Central Lantern
    const boiler = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.1, 1.6, 18),
      new THREE.MeshStandardMaterial({ color: 0x2b0912, metalness: 0.7, roughness: 0.3 })
    );
    boiler.rotation.x = Math.PI / 2;
    boiler.position.set(0, 1.6, length / 2 + 0.4);
    group.add(boiler);

    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.2, 0.95, 12),
      new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.8 })
    );
    chimney.position.set(0, 3.55, length / 2 - 0.8);
    group.add(chimney);

    const lantern = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 16),
      new THREE.MeshBasicMaterial({ color: 0xffea00 })
    );
    lantern.position.set(0, 1.6, length / 2 + 1.22);
    group.add(lantern);
  } else {
    // Metro & Cargo Cabins
    const nose = new THREE.Mesh(
      new THREE.BoxGeometry(2.72, 1.45, 0.8),
      new THREE.MeshStandardMaterial({ color: frontHex, metalness: 0.5, roughness: 0.3 })
    );
    nose.position.set(0, 1.15, length / 2 + 0.25);
    nose.rotation.x = -0.18;
    group.add(nose);

    const windshield = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x90e0ef, emissive: 0x0077b6, emissiveIntensity: 0.4 })
    );
    windshield.position.set(0, 2.38, length / 2 + 0.02);
    group.add(windshield);
  }

  // Twin LED Headlights
  [-0.85, 0.85].forEach(hx => {
    const hl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.12, 14),
      new THREE.MeshBasicMaterial({ color: 0xffffcc })
    );
    hl.rotation.x = Math.PI / 2;
    hl.position.set(hx, 0.92, length / 2 + 0.55);
    group.add(hl);
  });

  // Optional Boarding Ramp Attached to Front of Train
  let rampLength = 0;
  if (hasRamp) {
    rampLength = 4.6;
    const ramp = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 0.28, 5.3),
      new THREE.MeshStandardMaterial({ color: 0xffb703, metalness: 0.4, roughness: 0.4 })
    );
    ramp.position.set(0, 1.65, length / 2 + 2.2);
    ramp.rotation.x = Math.atan2(3.35, 4.6);
    group.add(ramp);
  }

  group.userData = {
    type: "train",
    modelType,
    length,
    height: 3.35,
    hasRamp,
    rampLength,
    isMoving,
    speedOffset: isMoving ? (modelType === "bullet" ? 20 : 14) : 0,
    wheels
  };
  return group;
}

// Intro Parked Train for Spray-Painting Scene
const introTrainGroup = createRealistic3DTrain(15, false, false, "metro");
introTrainGroup.position.set(-3.6, 0, -2.5);

const grafCanvas = document.createElement("canvas");
grafCanvas.width = 512;
grafCanvas.height = 256;
const gCtx = grafCanvas.getContext("2d");
gCtx.fillStyle = "rgba(25, 10, 40, 0.85)";
gCtx.fillRect(0, 0, 512, 256);
gCtx.font = "bold italic 60px Impact, sans-serif";
gCtx.fillStyle = "#a8ff00";
gCtx.strokeStyle = "#ff006e";
gCtx.lineWidth = 8;
gCtx.strokeText("SUBWAY 3D", 90, 150);
gCtx.fillText("SUBWAY 3D", 90, 150);

const grafPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(5.5, 2.1),
  new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(grafCanvas), transparent: true })
);
grafPlane.rotation.y = Math.PI / 2;
grafPlane.position.set(1.39, 1.9, 1.0);
introTrainGroup.add(grafPlane);
scene.add(introTrainGroup);

// ================= 6. BARRIERS, COINS, DIAMONDS & POWER-UPS =================
let obstacles = [];
let coins = [];
let powerups = [];

function createBarrierMesh(highBarrier = false) {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x495057, metalness: 0.7 });
  [-1.1, 1.1].forEach(px => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, highBarrier ? 2.75 : 1.25, 10), postMat);
    post.position.set(px, (highBarrier ? 2.75 : 1.25) / 2, 0);
    group.add(post);
  });

  const bar = new THREE.Mesh(
    new THREE.BoxGeometry(2.45, 0.6, 0.22),
    new THREE.MeshStandardMaterial({ color: 0xef233c, roughness: 0.4 })
  );
  bar.position.y = highBarrier ? 2.3 : 0.95;
  group.add(bar);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.2, 0.24),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  stripe.position.y = bar.position.y;
  group.add(stripe);

  group.userData = {
    type: highBarrier ? "highBarrier" : "lowBarrier",
    length: 0.6,
    height: highBarrier ? 2.75 : 1.25
  };
  return group;
}

const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 20);
const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.2, emissive: 0x442200 });

function spawnCoinArc(laneIndex, startZ, count = 5, baseHeight = 0.95, arcHeight = 0) {
  for (let i = 0; i < count; i++) {
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.rotation.z = Math.PI / 2;
    const t = count > 1 ? i / (count - 1) : 0;
    const yOffset = Math.sin(t * Math.PI) * arcHeight;
    coin.position.set(LANES[laneIndex], baseHeight + yOffset, startZ - i * 2.2);
    scene.add(coin);
    coins.push(coin);
  }
}

function spawnPowerup(laneIndex, y, z) {
  const types = ["jetpack", "magnet", "boardPickup", "diamondPickup"];
  const kind = types[Math.floor(Math.random() * types.length)];
  const colorMap = {
    jetpack: 0xff4500,
    magnet: 0x00e5ff,
    boardPickup: 0x7cfc00,
    diamondPickup: 0x00f5d4
  };
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.MeshStandardMaterial({ color: colorMap[kind], emissive: colorMap[kind], emissiveIntensity: 0.5 })
  );
  mesh.position.set(LANES[laneIndex], y, z);
  mesh.userData = { kind };
  scene.add(mesh);
  powerups.push(mesh);
}

let nextSpawnZ = -45;
function spawnWave(zPos) {
  const usedLanes = new Set();
  const numObstacles = Math.random() < 0.65 ? 2 : 1;

  for (let i = 0; i < numObstacles; i++) {
    let lane = Math.floor(Math.random() * 3);
    if (usedLanes.has(lane)) lane = (lane + 1) % 3;
    usedLanes.add(lane);

    if (Math.random() < 0.65) {
      const hasRamp = Math.random() < 0.45;
      const isMoving = !hasRamp && Math.random() < 0.48;
      const trainLength = 15 + Math.floor(Math.random() * 5);
      const train = createRealistic3DTrain(trainLength, hasRamp, isMoving);
      train.position.set(LANES[lane], 0, zPos - trainLength / 2);
      scene.add(train);
      obstacles.push(train);

      if (hasRamp || Math.random() < 0.5) {
        spawnCoinArc(lane, zPos - 2, 5, 4.2, 0);
      }
    } else {
      const isHigh = Math.random() < 0.4;
      const barrier = createBarrierMesh(isHigh);
      barrier.position.set(LANES[lane], 0, zPos);
      scene.add(barrier);
      obstacles.push(barrier);
      spawnCoinArc(lane, zPos + 3, 5, 0.95, isHigh ? 0 : 2.1);
    }
  }

  for (let lane = 0; lane < 3; lane++) {
    if (!usedLanes.has(lane)) {
      if (Math.random() < 0.25) {
        spawnPowerup(lane, 1.1, zPos - 4);
      } else {
        spawnCoinArc(lane, zPos, 6, 0.95, 0);
      }
    }
  }
}

// ================= 7. GAME STATE, REVIVE ("SAVE ME!") & POLICE LOGIC =================
let gameState = "AGE_GATE"; // AGE_GATE | IDLE_INTRO | PLAYING | REVIVE_PROMPT | GAMEOVER
let currentLane = 1;
let previousLane = 1;
let playerY = 0;
let playerVelY = 0;
let groundHeight = 0;
let isRolling = false;
let rollTimer = 0;

let speed = 22;
let distanceRun = 0;
window.score = 0;
let runCoins = 0;
let scoreMultiplier = 1;

let policeTimer = 0;
let dizzyTimer = 0;
let hoverboardTimer = 0;
let jetpackTimer = 0;
let magnetTimer = 0;

// 5-Second Revive Countdown State
let reviveCountdown = 5.0;
let pendingDeathReason = "CAUGHT BY INSPECTOR!";

function showCallout(text) {
  const el = document.getElementById("calloutText");
  el.innerText = text;
  el.classList.add("show");
  clearTimeout(el._hideTimeout);
  el._hideTimeout = setTimeout(() => el.classList.remove("show"), 1300);
}

function triggerPoliceChase(isStumble = false) {
  if (isStumble) {
    SFX.crash();
    SFX.whistle();
    SFX.bark();
    if (policeTimer > 0) {
      promptReviveOrGameOver("CAUGHT BY THE INSPECTOR!");
      return;
    }
    dizzyTimer = 2.5;
    showCallout("Inspector Chasing for 5s!");
  } else {
    SFX.whistle();
    SFX.bark();
  }
  policeTimer = 5.0;
}

function activateHoverboard() {
  if (gameState !== "PLAYING" || hoverboardTimer > 0 || jetpackTimer > 0) return;
  if (window.playerProfile.boards <= 0) {
    showCallout("No Hoverboards Left! Buy in Store");
    return;
  }
  window.playerProfile.boards--;
  window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
  hoverboardTimer = 30.0;
  boardGroup.visible = true;
  SFX.powerup();
  showCallout("Hoverboard Active! 🛹");
  updateHudUI();
}

function switchPlayerAnimation(mode) {
  if (!playerMixer) return;
  if (mode === "run" && playerActions.run) {
    if (playerActions.idle) playerActions.idle.stop();
    playerActions.run.reset().play();
  } else if (mode === "idle" && playerActions.idle) {
    if (playerActions.run) playerActions.run.stop();
    playerActions.idle.reset().play();
  }
}

// Show 5-Second Rotating Revive ("Save Me!") Popup When Player Is Out
function promptReviveOrGameOver(reasonText) {
  SFX.crash();
  SFX.whistle();
  pendingDeathReason = reasonText;
  gameState = "REVIVE_PROMPT";
  reviveCountdown = 5.0;
  switchPlayerAnimation("idle");

  // Place Inspector next to player
  chaserGroup.visible = true;
  chaserGroup.position.set(playerGroup.position.x - 0.75, playerGroup.position.y, 0.5);

  document.getElementById("reviveDiamondsCount").innerText = window.playerProfile.diamonds;
  document.getElementById("reviveModal").style.display = "flex";
}

// If Player Clicks Revive (Costs 5 Diamonds) -> Resume Exact Score, Coins & Distance!
function handleReviveClick() {
  if (gameState !== "REVIVE_PROMPT") return;
  if (window.playerProfile.diamonds < 5) {
    alert("You need 5 Diamonds (💎) to Revive! You can buy Diamonds in the Store.");
    return;
  }

  window.playerProfile.diamonds -= 5;
  window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();

  // Clear nearby obstacles so the player doesn't crash immediately on revive
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].position.z > -45) {
      scene.remove(obstacles[i]);
      obstacles.splice(i, 1);
    }
  }

  document.getElementById("reviveModal").style.display = "none";
  playerY = 0;
  playerVelY = 0;
  groundHeight = 0;
  dizzyTimer = 0;
  policeTimer = 0; // Police drops back
  chaserGroup.visible = false;

  gameState = "PLAYING";
  switchPlayerAnimation("run");
  SFX.powerup();
  showCallout("REVIVED! Keep Running! 💎");
  updateHudUI();
}

// If Player Clicks "No Thanks" or 5-Second Timer Expires -> Final Game Over Summary
function finalizeGameOver() {
  document.getElementById("reviveModal").style.display = "none";
  gameState = "GAMEOVER";

  // Bank the coins collected in this run and sync to Firebase
  window.playerProfile.coins += runCoins;
  const finalScoreInt = Math.floor(window.score);
  window.submitScore && window.submitScore(finalScoreInt);
  window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();

  document.getElementById("hud").style.display = "none";
  document.getElementById("gameOverTitle").innerText = pendingDeathReason;
  document.getElementById("finalScore").innerText = finalScoreInt.toLocaleString();
  document.getElementById("goHighScore").innerText = (window.getHighScore ? window.getHighScore() : finalScoreInt).toLocaleString();
  document.getElementById("goDistance").innerText = Math.floor(distanceRun) + "m";
  document.getElementById("goCoins").innerText = runCoins;
  document.getElementById("goTotalCoins").innerText = window.playerProfile.coins;
  document.getElementById("goDiamonds").innerText = window.playerProfile.diamonds;
  document.getElementById("gameOverModal").style.display = "flex";
}

function resetGameWorld() {
  obstacles.forEach(o => scene.remove(o));
  coins.forEach(c => scene.remove(c));
  powerups.forEach(p => scene.remove(p));
  obstacles = [];
  coins = [];
  powerups = [];

  currentLane = 1;
  previousLane = 1;
  playerGroup.position.set(0, 0, 0);
  playerGroup.rotation.y = 0;
  playerY = 0;
  playerVelY = 0;
  groundHeight = 0;
  isRolling = false;
  speed = 22;
  distanceRun = 0;
  window.score = 0;
  runCoins = 0;
  hoverboardTimer = 0;
  jetpackTimer = 0;
  magnetTimer = 0;
  dizzyTimer = 0;
  boardGroup.visible = false;
  jetpackGroup.visible = false;
  dizzyStarsGroup.visible = false;
  nextSpawnZ = -40;
}

function startNewRun() {
  ensureAudio();
  resetGameWorld();
  gameState = "PLAYING";
  introTrainGroup.visible = false;
  fallbackHuman.userData.sprayCan.visible = false;
  switchPlayerAnimation("run");

  document.getElementById("startOverlay").style.display = "none";
  document.getElementById("gameOverModal").style.display = "none";
  document.getElementById("reviveModal").style.display = "none";
  document.getElementById("hud").style.display = "block";

  for (let z = -40; z >= -180; z -= 30) {
    spawnWave(z);
    nextSpawnZ = z - 30;
  }

  chaserGroup.visible = true;
  chaserGroup.position.set(0, 0, 2.2);
  triggerPoliceChase(false);
  updateHudUI();
}

// Return to Home Screen (Tap to Play, Store, Coins, Diamonds, Graffiti Intro)
function goToHomeScreen() {
  resetGameWorld();
  gameState = "IDLE_INTRO";
  introTrainGroup.visible = true;
  fallbackHuman.userData.sprayCan.visible = true;
  switchPlayerAnimation("idle");

  document.getElementById("gameOverModal").style.display = "none";
  document.getElementById("reviveModal").style.display = "none";
  document.getElementById("hud").style.display = "none";
  document.getElementById("startOverlay").style.display = "flex";
  window.updateMenuUI();
}

// ================= 8. INPUT CONTROLS =================
function changeLane(dir) {
  if (gameState !== "PLAYING") return;
  const target = currentLane + dir;
  if (target >= 0 && target <= 2) {
    previousLane = currentLane;
    currentLane = target;
    SFX.swoosh();
  }
}

function jump() {
  if (gameState !== "PLAYING" || jetpackTimer > 0) return;
  if (playerY <= groundHeight + 0.08) {
    playerVelY = 13.8;
    isRolling = false;
    SFX.jump();
  }
}

function roll() {
  if (gameState !== "PLAYING" || jetpackTimer > 0) return;
  isRolling = true;
  rollTimer = 0.65;
  if (playerY > groundHeight + 0.1) {
    playerVelY = -22;
  }
  SFX.roll();
}

window.addEventListener("keydown", e => {
  if (gameState === "IDLE_INTRO" && (e.code === "Space" || e.code === "Enter")) {
    startNewRun();
    return;
  }
  if (gameState !== "PLAYING") return;
  if (e.code === "ArrowLeft" || e.code === "KeyA") changeLane(-1);
  if (e.code === "ArrowRight" || e.code === "KeyD") changeLane(1);
  if (e.code === "ArrowUp" || e.code === "KeyW") jump();
  if (e.code === "ArrowDown" || e.code === "KeyS") roll();
  if (e.code === "Space" || e.code === "KeyE") activateHoverboard();
});

let touchStartX = 0, touchStartY = 0, lastTapTime = 0;
canvas.addEventListener("touchstart", e => {
  if (gameState !== "PLAYING") return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  const now = performance.now();
  if (now - lastTapTime < 280) activateHoverboard();
  lastTapTime = now;
}, { passive: true });

canvas.addEventListener("touchend", e => {
  if (gameState !== "PLAYING") return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 25 && Math.abs(dy) < 25) return;
  if (Math.abs(dx) > Math.abs(dy)) changeLane(dx > 0 ? 1 : -1);
  else {
    if (dy < 0) jump();
    else roll();
  }
}, { passive: true });

// ================= 9. UI & STORE BINDINGS =================
window.updateMenuUI = function () {
  document.getElementById("menuCoins").innerText = window.playerProfile.coins;
  document.getElementById("menuDiamonds").innerText = window.playerProfile.diamonds;
  document.getElementById("menuBoards").innerText = window.playerProfile.boards;
  document.getElementById("menuHighScore").innerText = window.getHighScore ? window.getHighScore() : 0;

  document.getElementById("shopCoins").innerText = window.playerProfile.coins;
  document.getElementById("shopDiamonds").innerText = window.playerProfile.diamonds;
  document.getElementById("shopBoards").innerText = window.playerProfile.boards;
  renderShopItems();
};

function updateHudUI() {
  document.getElementById("score").innerText = String(Math.floor(window.score)).padStart(6, "0");
  document.getElementById("hudCoins").innerText = runCoins;
  document.getElementById("hudDiamonds").innerText = window.playerProfile.diamonds;
  document.getElementById("hudDistance").innerText = Math.floor(distanceRun);
  document.getElementById("boardCountHud").innerText = window.playerProfile.boards;

  const policeBadge = document.getElementById("policeWarningBadge");
  if (policeTimer > 0) {
    policeBadge.style.display = "block";
    document.getElementById("policeCountdown").innerText = policeTimer.toFixed(1);
  } else {
    policeBadge.style.display = "none";
  }

  const boardBar = document.getElementById("boardHudBar");
  boardBar.style.display = hoverboardTimer > 0 ? "flex" : "none";
  if (hoverboardTimer > 0) {
    document.getElementById("boardBarFill").style.width = ((hoverboardTimer / 30) * 100) + "%";
  }

  const jetBar = document.getElementById("jetpackHudBar");
  jetBar.style.display = jetpackTimer > 0 ? "flex" : "none";
  if (jetpackTimer > 0) {
    document.getElementById("jetpackBarFill").style.width = ((jetpackTimer / 8) * 100) + "%";
  }

  const magBar = document.getElementById("magnetHudBar");
  magBar.style.display = magnetTimer > 0 ? "flex" : "none";
  if (magnetTimer > 0) {
    document.getElementById("magnetBarFill").style.width = ((magnetTimer / 10) * 100) + "%";
  }
}

function renderShopItems() {
  const avGrid = document.getElementById("avatarShopGrid");
  avGrid.innerHTML = "";
  AVATAR_CATALOG.forEach(av => {
    const unlocked = window.playerProfile.unlockedAvatars.includes(av.id);
    const equipped = window.playerProfile.selectedAvatar === av.id;
    const card = document.createElement("div");
    card.className = "shop-item" + (equipped ? " active" : "");
    card.innerHTML = `
      <div>🧍 <b>${av.name}</b></div>
      <button class="shop-btn ${equipped ? 'equipped' : ''}">
        ${equipped ? "Equipped ✓" : unlocked ? "Select" : `Buy (${av.price} 🪙)`}
      </button>
    `;
    card.querySelector("button").onclick = () => {
      if (unlocked) {
        window.playerProfile.selectedAvatar = av.id;
      } else if (window.playerProfile.coins >= av.price) {
        window.playerProfile.coins -= av.price;
        window.playerProfile.unlockedAvatars.push(av.id);
        window.playerProfile.selectedAvatar = av.id;
        SFX.powerup();
      } else {
        alert("Not enough coins!");
        return;
      }
      window.loadSelectedHumanAvatar();
      window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
      window.updateMenuUI();
    };
    avGrid.appendChild(card);
  });

  const skinGrid = document.getElementById("boardSkinShopGrid");
  skinGrid.innerHTML = "";
  BOARD_SKIN_CATALOG.forEach(sk => {
    const unlocked = window.playerProfile.unlockedBoardSkins.includes(sk.id);
    const equipped = window.playerProfile.selectedBoard === sk.id;
    const card = document.createElement("div");
    card.className = "shop-item" + (equipped ? " active" : "");
    card.innerHTML = `
      <div>🛹 <b>${sk.name}</b></div>
      <button class="shop-btn ${equipped ? 'equipped' : ''}">
        ${equipped ? "Equipped ✓" : unlocked ? "Select" : `Buy (${sk.price} 🪙)`}
      </button>
    `;
    card.querySelector("button").onclick = () => {
      if (unlocked) {
        window.playerProfile.selectedBoard = sk.id;
      } else if (window.playerProfile.coins >= sk.price) {
        window.playerProfile.coins -= sk.price;
        window.playerProfile.unlockedBoardSkins.push(sk.id);
        window.playerProfile.selectedBoard = sk.id;
        SFX.powerup();
      } else {
        alert("Not enough coins!");
        return;
      }
      window.loadSelectedHumanAvatar();
      window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
      window.updateMenuUI();
    };
    skinGrid.appendChild(card);
  });
}

// Button Listeners
const ageSlider = document.getElementById("ageSlider");
const ageValue = document.getElementById("ageValue");
ageSlider.oninput = () => (ageValue.innerText = ageSlider.value);
document.getElementById("confirmAgeBtn").onclick = () => {
  ensureAudio();
  document.getElementById("ageModal").style.display = "none";
  document.getElementById("startOverlay").style.display = "flex";
  gameState = "IDLE_INTRO";
  window.updateMenuUI();
};

document.getElementById("tapToPlayBtn").onclick = startNewRun;
document.getElementById("replayBtn").onclick = startNewRun;
document.getElementById("homeBtn").onclick = goToHomeScreen;
document.getElementById("boardTriggerBtn").onclick = activateHoverboard;

// Revive & No Thanks Buttons
document.getElementById("reviveActionBtn").onclick = handleReviveClick;
document.getElementById("noThanksBtn").onclick = finalizeGameOver;

document.getElementById("openShopBtn").onclick = () => {
  window.updateMenuUI();
  document.getElementById("shopModal").style.display = "flex";
};
document.getElementById("closeShopBtn").onclick = () => {
  document.getElementById("shopModal").style.display = "none";
};

document.getElementById("buyBoardConsumableBtn").onclick = () => {
  if (window.playerProfile.coins >= 300) {
    window.playerProfile.coins -= 300;
    window.playerProfile.boards += 1;
    SFX.coin();
    window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
    window.updateMenuUI();
  } else alert("Need 300 Coins!");
};

document.getElementById("buyDiamondsBtn").onclick = () => {
  if (window.playerProfile.coins >= 500) {
    window.playerProfile.coins -= 500;
    window.playerProfile.diamonds += 5;
    SFX.powerup();
    window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
    window.updateMenuUI();
  } else alert("Need 500 Coins!");
};

window.loadSelectedHumanAvatar();

// ================= 10. MAIN ANIMATION & PHYSICS LOOP =================
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  const t = now * 0.001;

  if (playerMixer) playerMixer.update(dt * (gameState === "PLAYING" ? speed / 18 : 1));
  if (policeMixer) policeMixer.update(dt * (speed / 16));

  if (gameState === "AGE_GATE" || gameState === "IDLE_INTRO") {
    introTrainGroup.visible = true;
    playerGroup.position.set(-1.3, 0, -0.8);
    playerGroup.rotation.y = -Math.PI / 2;
    fallbackHuman.userData.rightArm.rotation.x = -0.9 + Math.sin(t * 10) * 0.35;

    chaserGroup.visible = true;
    chaserGroup.position.set(-1.0, 0, 2.5);

    camera.position.set(1.7, 2.5, 3.8);
    camera.lookAt(-1.8, 1.7, -1.2);
    renderer.render(scene, camera);
    return;
  }

  // Handle 5-Second Rotating Revive Countdown Ring
  if (gameState === "REVIVE_PROMPT") {
    reviveCountdown -= dt;
    const progress = Math.max(0, reviveCountdown / 5.0);
    const circle = document.getElementById("reviveRingCircle");
    if (circle) {
      const circumference = 364.4;
      circle.style.strokeDashoffset = circumference * (1 - progress);
    }
    const secLabel = document.getElementById("reviveCountdownText");
    if (secLabel) {
      secLabel.innerText = Math.ceil(Math.max(0, reviveCountdown)) + "s";
    }
    if (reviveCountdown <= 0) {
      finalizeGameOver();
    }
    renderer.render(scene, camera);
    return;
  }

  if (gameState === "PLAYING") {
    playerGroup.rotation.y = 0;

    // 1. Speed, Distance & Score
    speed = Math.min(42, speed + dt * 0.38);
    const stepZ = speed * dt;
    distanceRun += stepZ * 0.45;
    window.score += stepZ * 2.2 * scoreMultiplier;

    // 2. Scroll Track & City Buildings
    scrollingProps.forEach(row => {
      row.position.z += stepZ;
      if (row.position.z > 24) row.position.z -= 260;
    });

    // 3. Spawn New Waves
    nextSpawnZ += stepZ;
    if (nextSpawnZ > -185) {
      spawnWave(nextSpawnZ - 30);
      nextSpawnZ -= 30;
    }

    // 4. Smooth Lane Switching
    const targetX = LANES[currentLane];
    playerGroup.position.x += (targetX - playerGroup.position.x) * Math.min(1, dt * 14);

    // 5. Power-Up Timers
    if (hoverboardTimer > 0) {
      hoverboardTimer -= dt;
      if (hoverboardTimer <= 0) {
        hoverboardTimer = 0;
        boardGroup.visible = false;
      }
    }
    if (magnetTimer > 0) {
      magnetTimer -= dt;
      if (magnetTimer < 0) magnetTimer = 0;
    }

    // 6. 3D Train & Barrier Collisions
    groundHeight = 0;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      const obsStep = (speed + (obs.userData.speedOffset || 0)) * dt;
      obs.position.z += obsStep;

      if (obs.userData.wheels) {
        obs.userData.wheels.forEach(w => (w.rotation.x += obsStep * 1.5));
      }

      const dx = Math.abs(playerGroup.position.x - obs.position.x);
      const halfLen = obs.userData.length / 2;
      const frontZ = obs.position.z + halfLen;
      const backZ = obs.position.z - halfLen;

      if (jetpackTimer <= 0 && dx < 1.2) {
        if (obs.userData.type === "train") {
          const rampFrontZ = frontZ + (obs.userData.hasRamp ? obs.userData.rampLength : 0);

          if (obs.userData.hasRamp && frontZ >= -0.8 && rampFrontZ >= -0.5 && backZ <= 0.5) {
            groundHeight = Math.max(groundHeight, obs.userData.height);
            if (playerY < obs.userData.height) {
              playerY = obs.userData.height;
              playerVelY = 0;
            }
          } else if (frontZ >= -0.55 && backZ <= 0.55) {
            if (playerY >= obs.userData.height - 0.45) {
              groundHeight = Math.max(groundHeight, obs.userData.height);
            } else {
              const isSideSwipe = Math.abs(targetX - playerGroup.position.x) > 0.28 && previousLane !== currentLane;
              if (isSideSwipe) {
                currentLane = previousLane;
                playerGroup.position.x = LANES[currentLane];
                triggerPoliceChase(true);
              } else if (hoverboardTimer > 0) {
                hoverboardTimer = 0;
                boardGroup.visible = false;
                SFX.crash();
                showCallout("Hoverboard Saved You!");
                scene.remove(obs);
                obstacles.splice(i, 1);
                continue;
              } else {
                promptReviveOrGameOver("HIT BY EXPRESS TRAIN!");
                return;
              }
            }
          }
        } else if (obs.userData.type === "lowBarrier") {
          if (Math.abs(obs.position.z) < 0.55 && playerY < 1.15) {
            if (hoverboardTimer > 0) {
              hoverboardTimer = 0;
              boardGroup.visible = false;
              SFX.crash();
              scene.remove(obs);
              obstacles.splice(i, 1);
              continue;
            } else {
              scene.remove(obs);
              obstacles.splice(i, 1);
              triggerPoliceChase(true);
              continue;
            }
          }
        } else if (obs.userData.type === "highBarrier") {
          if (Math.abs(obs.position.z) < 0.55 && !isRolling && playerY > -0.1) {
            if (hoverboardTimer > 0) {
              hoverboardTimer = 0;
              boardGroup.visible = false;
              SFX.crash();
              scene.remove(obs);
              obstacles.splice(i, 1);
              continue;
            } else {
              promptReviveOrGameOver("CRASHED INTO BARRIER!");
              return;
            }
          }
        }
      }

      if (obs.position.z > 26) {
        scene.remove(obs);
        obstacles.splice(i, 1);
      }
    }

    // 7. Jump, Gravity & Jetpack Physics
    if (jetpackTimer > 0) {
      jetpackTimer -= dt;
      jetpackGroup.visible = true;
      playerY += (7.8 - playerY) * dt * 6;
      playerVelY = 0;
      if (Math.random() < 0.35) spawnCoinArc(currentLane, -35, 1, 7.8, 0);
      if (jetpackTimer <= 0) {
        jetpackTimer = 0;
        jetpackGroup.visible = false;
      }
    } else {
      if (playerY > groundHeight || playerVelY !== 0) {
        playerY += playerVelY * dt;
        playerVelY -= 35 * dt;
        if (playerY <= groundHeight) {
          playerY = groundHeight;
          playerVelY = 0;
        }
      } else {
        playerY = groundHeight;
      }
    }

    if (isRolling) {
      rollTimer -= dt;
      playerGroup.scale.y = 0.52;
      if (rollTimer <= 0) {
        isRolling = false;
        playerGroup.scale.y = 1;
      }
    } else {
      playerGroup.scale.y = 1;
    }

    playerGroup.position.y = playerY;

    // 8. Fallback Limb & Guard Dog Animations
    const runCycle = t * speed * 0.65;
    fallbackHuman.userData.leftLeg.rotation.x = Math.sin(runCycle) * 0.85;
    fallbackHuman.userData.rightLeg.rotation.x = -Math.sin(runCycle) * 0.85;
    fallbackHuman.userData.leftArm.rotation.x = -Math.sin(runCycle) * 0.75;
    fallbackHuman.userData.rightArm.rotation.x = Math.sin(runCycle) * 0.75;

    fallbackPolice.userData.leftLeg.rotation.x = Math.sin(runCycle * 1.1) * 0.9;
    fallbackPolice.userData.rightLeg.rotation.x = -Math.sin(runCycle * 1.1) * 0.9;
    dLegs.forEach((leg, idx) => {
      leg.rotation.x = Math.sin(runCycle * 1.4 + (idx < 2 ? 0 : Math.PI)) * 0.7;
    });

    if (dizzyTimer > 0) {
      dizzyTimer -= dt;
      dizzyStarsGroup.visible = true;
      dizzyStarsGroup.rotation.y += dt * 6;
    } else {
      dizzyStarsGroup.visible = false;
    }

    // 9. Police & Dog 5-Second Chase Behavior
    if (policeTimer > 0) {
      policeTimer -= dt;
      chaserGroup.visible = true;
      chaserGroup.position.z += (2.1 - chaserGroup.position.z) * dt * 5;
      chaserGroup.position.x += (playerGroup.position.x - chaserGroup.position.x) * dt * 8;
      chaserGroup.position.y = playerGroup.position.y;
    } else {
      chaserGroup.position.z += (11.5 - chaserGroup.position.z) * dt * 2.5;
      if (chaserGroup.position.z > 9.8) chaserGroup.visible = false;
    }

    // 10. Coins & Magnet
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.position.z += stepZ;
      c.rotation.x += dt * 4;

      if (magnetTimer > 0 && c.position.z > -18 && c.position.z < 2) {
        c.position.x += (playerGroup.position.x - c.position.x) * dt * 10;
        c.position.y += (playerGroup.position.y + 1.2 - c.position.y) * dt * 10;
      }

      const dist = Math.hypot(
        c.position.x - playerGroup.position.x,
        c.position.y - (playerGroup.position.y + 1.1),
        c.position.z
      );
      if (dist < 1.35) {
        runCoins++;
        window.score += 15;
        SFX.coin();
        scene.remove(c);
        coins.splice(i, 1);
        continue;
      }
      if (c.position.z > 12) {
        scene.remove(c);
        coins.splice(i, 1);
      }
    }

    // 11. Power-ups & Diamond Pickups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.position.z += stepZ;
      p.rotation.y += dt * 3;
      const dist = Math.hypot(
        p.position.x - playerGroup.position.x,
        p.position.y - (playerGroup.position.y + 1.1),
        p.position.z
      );
      if (dist < 1.45) {
        SFX.powerup();
        if (p.userData.kind === "jetpack") {
          jetpackTimer = 8.0;
          showCallout("Jetpack Activated! 🚀");
        } else if (p.userData.kind === "magnet") {
          magnetTimer = 10.0;
          showCallout("Coin Magnet! 🧲");
        } else if (p.userData.kind === "boardPickup") {
          window.playerProfile.boards++;
          showCallout("+1 Hoverboard! 🛹");
        } else if (p.userData.kind === "diamondPickup") {
          window.playerProfile.diamonds += 2;
          showCallout("+2 Diamonds! 💎");
        }
        scene.remove(p);
        powerups.splice(i, 1);
        continue;
      }
      if (p.position.z > 12) {
        scene.remove(p);
        powerups.splice(i, 1);
      }
    }

    // 12. Camera Follow
    const targetCamX = playerGroup.position.x * 0.45;
    const targetCamY = 4.7 + playerGroup.position.y * 0.65;
    camera.position.x += (targetCamX - camera.position.x) * dt * 8;
    camera.position.y += (targetCamY - camera.position.y) * dt * 6;
    camera.position.z = 7.5;
    camera.lookAt(playerGroup.position.x * 0.3, 1.8 + playerGroup.position.y * 0.4, -8);

    updateHudUI();
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

requestAnimationFrame(animate);
