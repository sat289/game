// ================= 1. AVATARS & TRAINS CATALOG =================
const AVATAR_CATALOG = [
  { id: "michelle", name: "Street Dancer (3D)", price: 0, glbUrl: "https://threejs.org/examples/models/gltf/Michelle.glb", scale: 1.35, rotY: Math.PI },
  { id: "soldier", name: "Metro Commando (3D)", price: 500, glbUrl: "https://threejs.org/examples/models/gltf/Soldier.glb", scale: 1.35, rotY: 0 },
  { id: "xbot", name: "Cyber Runner (3D)", price: 1000, glbUrl: "https://threejs.org/examples/models/gltf/Xbot.glb", scale: 1.35, rotY: Math.PI }
];

const POLICE_GLB_URL = "https://threejs.org/examples/models/gltf/Soldier.glb";

const BOARD_SKIN_CATALOG = [
  { id: "flame", name: "Flame Cruiser", price: 0, deckColor: 0xff3300, rimColor: 0xffd700 },
  { id: "bouncer", name: "Neon Cyberdeck", price: 400, deckColor: 0x00ffcc, rimColor: 0xff00aa },
  { id: "stealth", name: "Carbon Stealth", price: 900, deckColor: 0x1c1c1c, rimColor: 0x00ff66 }
];

const TRAIN_MODEL_CATALOG = [
  { id: "train1", name: "Animated Steam Train", glbUrl: "models/train1.glb", scale: 1.2, isGlb: true },
  { id: "train2", name: "Express Bullet", glbUrl: "models/train2.glb", scale: 1.2, isGlb: true },
  { id: "train3", name: "Metro Commuter", glbUrl: "models/train3.glb", scale: 1.2, isGlb: true },
  { id: "train4", name: "Freight Hauler", glbUrl: "models/train4.glb", scale: 1.2, isGlb: true },
  { id: "train5", name: "Alpine Express", glbUrl: "models/train5.glb", scale: 1.2, isGlb: true },
  { id: "procedural_express", name: "High-Speed Express", isGlb: false, skinType: "high_speed_express" }
];

const savedProfile = JSON.parse(localStorage.getItem("carracing_profile") || "null");
window.playerProfile = Object.assign(
  {
    coins: 300,
    diamonds: 25,
    boards: 5,
    unlockedAvatars: ["michelle"],
    unlockedBoardSkins: ["flame"],
    selectedAvatar: "michelle",
    selectedBoard: "flame",
    displayName: "",
    lastLoginDate: "",
    loginStreak: 0,
    claimedStreakToday: false,
    missions: [
      { id: "m1", title: "Run 500 meters", target: 500, current: 0, rewardCoins: 250, claimed: false },
      { id: "m2", title: "Run 2,000 meters", target: 2000, current: 0, rewardCoins: 1000, claimed: false },
      { id: "m3", title: "Collect 20 coins", target: 20, current: 0, rewardCoins: 300, claimed: false },
      { id: "m4", title: "Collect 500 coins in a game", target: 500, current: 0, rewardCoins: 2500, claimed: false },
      { id: "m5", title: "Collect 5 diamonds", target: 5, current: 0, rewardCoins: 1500, claimed: false },
      { id: "m6", title: "Use 5 skateboards", target: 5, current: 0, rewardCoins: 1000, claimed: false }
    ],
    streakGifts: Array.from({ length: 10 }, (_, i) => ({
      day: i + 1,
      reward: i === 9 ? { type: "diamonds", amount: 10 } : { type: "coins", amount: (i + 1) * 10 },
      claimed: false
    }))
  },
  savedProfile || {}
);

if (typeof window.playerProfile.diamonds !== "number") window.playerProfile.diamonds = 25;

const todayStr = new Date().toDateString();
if (window.playerProfile.lastLoginDate !== todayStr) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (window.playerProfile.lastLoginDate === yesterday.toDateString()) {
    window.playerProfile.loginStreak = (window.playerProfile.loginStreak || 0) + 1;
  } else {
    window.playerProfile.loginStreak = 1;
  }
  window.playerProfile.lastLoginDate = todayStr;
  window.playerProfile.claimedStreakToday = false;
  window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
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

// ================= 3. THREE.JS SCENE & ENVIRONMENT =================
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

// ================= 4. REAL HUMANS & GLB AVATARS =================
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
  };

  if (glbCache[av.glbUrl]) {
    setupClonedGlb(glbCache[av.glbUrl]);
  } else {
    gltfLoader.load(
      av.glbUrl,
      (gltf) => {
        glbCache[av.glbUrl] = gltf;
        setupClonedGlb(gltf);
      },
      undefined,
      () => {}
    );
  }

  const skin = BOARD_SKIN_CATALOG.find(b => b.id === window.playerProfile.selectedBoard) || BOARD_SKIN_CATALOG[0];
  boardDeck.material.color.setHex(skin.deckColor);
  boardRim.material.color.setHex(skin.rimColor);
};

// ================= 5. TRAIN1 TO TRAIN5 & GROUNDING LOGIC =================
const trainGlbCache = {};

function createRealistic3DTrain(length = 16, hasRamp = false, isMoving = false, forcedIndex = null) {
  const group = new THREE.Group();
  const wheels = [];

  const trainConfig = forcedIndex !== null 
    ? TRAIN_MODEL_CATALOG[forcedIndex % TRAIN_MODEL_CATALOG.length]
    : TRAIN_MODEL_CATALOG[Math.floor(Math.random() * TRAIN_MODEL_CATALOG.length)];

  if (trainConfig.isGlb) {
    if (trainGlbCache[trainConfig.glbUrl]) {
      const clone = trainGlbCache[trainConfig.glbUrl].clone();
      clone.scale.set(trainConfig.scale, trainConfig.scale, trainConfig.scale);
      clone.position.set(0, 0, 0);
      group.add(clone);
    } else {
      gltfLoader.load(
        trainConfig.glbUrl,
        (gltf) => {
          trainGlbCache[trainConfig.glbUrl] = gltf.scene;
          const clone = gltf.scene.clone();
          clone.scale.set(trainConfig.scale, trainConfig.scale, trainConfig.scale);
          clone.position.set(0, 0, 0);
          group.add(clone);
        },
        undefined,
        () => {
          const fallbackCoach = new THREE.Mesh(
            new THREE.BoxGeometry(2.75, 2.95, length),
            new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.3 })
          );
          fallbackCoach.position.y = 1.85;
          group.add(fallbackCoach);
        }
      );
    }
  } else {
    const sideTex = new THREE.CanvasTexture((() => {
      const c = document.createElement("canvas");
      c.width = 1024; c.height = 256;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#d90429"; ctx.fillRect(0, 0, 1024, 256);
      return c;
    })());
    const bodyMaterials = [
      new THREE.MeshStandardMaterial({ map: sideTex }),
      new THREE.MeshStandardMaterial({ map: sideTex }),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
      new THREE.MeshStandardMaterial({ color: 0x1b1b1e }),
      new THREE.MeshStandardMaterial({ color: 0xd90429 }),
      new THREE.MeshStandardMaterial({ color: 0x2b2d42 })
    ];
    const coach = new THREE.Mesh(new THREE.BoxGeometry(2.75, 2.95, length), bodyMaterials);
    coach.position.y = 1.85;
    coach.castShadow = true;
    coach.receiveShadow = true;
    group.add(coach);
  }

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

  group.position.y = 0; // Lock perfectly to tracks

  group.userData = {
    type: "train",
    length,
    height: 3.35,
    hasRamp,
    rampLength,
    isMoving,
    speedOffset: isMoving ? 18 : 0,
    wheels
  };
  return group;
}

const introTrainGroup = createRealistic3DTrain(15, false, false, 0);
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

// ================= 6. BARRIERS, COINS & DUAL ESCAPE ROUTES =================
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
  const colorMap = { jetpack: 0xff4500, magnet: 0x00e5ff, boardPickup: 0x7cfc00, diamondPickup: 0x00f5d4 };
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
  // DUAL ESCAPE ROUTE LOGIC: Block at most 1 lane so that at least 2 lanes are ALWAYS open!
  const blockedLane = Math.floor(Math.random() * 3);

  for (let lane = 0; lane < 3; lane++) {
    if (lane === blockedLane) {
      // Spawn obstacle or moving train in this blocked lane
      if (Math.random() < 0.6) {
        const hasRamp = Math.random() < 0.35;
        const isMoving = !hasRamp && Math.random() < 0.4;
        const trainLength = 15 + Math.floor(Math.random() * 5);
        const train = createRealistic3DTrain(trainLength, hasRamp, isMoving);
        train.position.set(LANES[lane], 0, zPos - trainLength / 2);
        scene.add(train);
        obstacles.push(train);
      } else {
        const isHigh = Math.random() < 0.4;
        const barrier = createBarrierMesh(isHigh);
        barrier.position.set(LANES[lane], 0, zPos);
        scene.add(barrier);
        obstacles.push(barrier);
      }
    } else {
      // Open escape lanes get coins or powerups
      if (Math.random() < 0.3) {
        spawnPowerup(lane, 1.1, zPos - 4);
      } else {
        spawnCoinArc(lane, zPos, 5, 0.95, 0);
      }
    }
  }
}

// ================= 7. GAME STATE, MISSIONS & POLICE LOGIC =================
let gameState = "IDLE_INTRO";
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
  updateMissionsProgress(0, 0, 0, 1);
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

function updateMissionsProgress(distDelta, coinsDelta, diamondsDelta = 0, boardsDelta = 0) {
  if (!window.playerProfile.missions) return;
  let updated = false;
  window.playerProfile.missions.forEach(m => {
    if (!m.claimed) {
      if (m.id === "m1" || m.id === "m2") {
        m.current = Math.min(m.target, m.current + distDelta);
      } else if (m.id === "m3") {
        m.current = Math.min(m.target, m.current + coinsDelta);
      } else if (m.id === "m4") {
        m.current = Math.min(m.target, runCoins);
      } else if (m.id === "m5") {
        m.current = Math.min(m.target, m.current + diamondsDelta);
      } else if (m.id === "m6") {
        m.current = Math.min(m.target, m.current + boardsDelta);
      }
      updated = true;
    }
  });
  if (updated) {
    window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
    updateMissionsRedDot();
  }
}

function updateMissionsRedDot() {
  const dot = document.getElementById("missionsRedDot");
  if (!dot) return;
  const hasClaimableMissions = window.playerProfile.missions.some(m => m.current >= m.target && !m.claimed);
  const hasClaimableGifts = window.playerProfile.streakGifts.some(g => g.day <= window.playerProfile.loginStreak && !g.claimed);
  
  const totalRedDot = hasClaimableMissions || hasClaimableGifts;
  dot.style.display = totalRedDot ? "block" : "none";
  
  const giftDot = document.getElementById("giftsRedDot");
  if (giftDot) giftDot.style.display = hasClaimableGifts ? "block" : "none";
}

window.openMissionsModal = function() {
  const container = document.getElementById("missionsListContainer");
  container.innerHTML = "";

  window.playerProfile.missions.forEach(m => {
    const isReady = m.current >= m.target && !m.claimed;
    const item = document.createElement("div");
    item.className = "shop-item";
    item.style.flexDirection = "row";
    item.style.alignItems = "center";
    item.style.justifyContent = "space-between";
    item.innerHTML = `
      <div style="text-align:left;">
        <b>${m.title}</b><br>
        <small>${Math.floor(m.current)} / ${m.target}</small>
      </div>
      <button class="shop-btn ${m.claimed ? 'equipped' : ''}" style="${isReady ? 'background:#62c435; color:#fff;' : ''}">
        ${m.claimed ? "Claimed ✓" : isReady ? "CLAIM (+" + m.rewardCoins + " 🪙)" : "In Progress"}
      </button>
    `;
    item.querySelector("button").onclick = () => {
      if (isReady && !m.claimed) {
        m.claimed = true;
        window.playerProfile.coins += m.rewardCoins;
        SFX.powerup();
        window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
        window.updateMenuUI();
        window.openMissionsModal();
      }
    };
    container.appendChild(item);
  });

  document.getElementById("missionsModal").style.display = "flex";
};

window.closeMissionsModal = function() {
  document.getElementById("missionsModal").style.display = "none";
};

window.openGiftsModal = function() {
  const container = document.getElementById("giftsGridContainer");
  container.innerHTML = "";

  window.playerProfile.streakGifts.forEach(g => {
    const unlocked = g.day <= window.playerProfile.loginStreak;
    const isReady = unlocked && !g.claimed;
    const rewardText = g.reward.type === "diamonds" ? `${g.reward.amount} 💎` : `${g.reward.amount} 🪙`;

    const card = document.createElement("div");
    card.className = "shop-item" + (g.claimed ? " active" : "");
    card.innerHTML = `
      <div><b>Day ${g.day}</b></div>
      <div style="font-size:20px; margin:6px 0;">🎁</div>
      <div>${rewardText}</div>
      <button class="shop-btn ${g.claimed ? 'equipped' : ''}" style="${isReady ? 'background:#62c435; color:#fff;' : ''}">
        ${g.claimed ? "Claimed ✓" : isReady ? "CLAIM" : "Locked"}
      </button>
    `;
    card.querySelector("button").onclick = () => {
      if (isReady && !g.claimed) {
        g.claimed = true;
        if (g.reward.type === "diamonds") {
          window.playerProfile.diamonds += g.reward.amount;
        } else {
          window.playerProfile.coins += g.reward.amount;
        }
        SFX.powerup();
        window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
        window.updateMenuUI();
        window.openGiftsModal();
      }
    };
    container.appendChild(card);
  });

  document.getElementById("giftsModal").style.display = "flex";
};

window.closeGiftsModal = function() {
  document.getElementById("giftsModal").style.display = "none";
};

window.openEventsModal = function() {
  document.getElementById("eventsModal").style.display = "flex";
};
window.closeEventsModal = function() {
  document.getElementById("eventsModal").style.display = "none";
};

window.openAccountModal = function() {
  const nameInput = document.getElementById("editNameInput");
  nameInput.value = window.playerProfile.displayName || "";

  if (window.playerProfile.displayName) {
    document.getElementById("accountLoggedOutView").style.display = "none";
    document.getElementById("accountLoggedInView").style.display = "block";
    document.getElementById("accountDisplayName").innerText = window.playerProfile.displayName;
  } else {
    document.getElementById("accountLoggedOutView").style.display = "block";
    document.getElementById("accountLoggedInView").style.display = "none";
  }

  const avatarGrid = document.getElementById("accountAvatarSelectorGrid");
  avatarGrid.innerHTML = "";
  AVATAR_CATALOG.forEach(av => {
    const isSelected = window.playerProfile.selectedAvatar === av.id;
    const btn = document.createElement("button");
    btn.className = "shop-btn" + (isSelected ? " equipped" : "");
    btn.innerText = av.name.split(" ")[0];
    btn.style.fontSize = "11px";
    btn.onclick = () => {
      window.playerProfile.selectedAvatar = av.id;
      window.loadSelectedHumanAvatar();
      window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
      window.openAccountModal();
    };
    avatarGrid.appendChild(btn);
  });

  document.getElementById("accountModal").style.display = "flex";
};

window.closeAccountModal = function() {
  document.getElementById("accountModal").style.display = "none";
};

document.getElementById("googleLoginBtn").onclick = () => {
  const defaultName = prompt("Enter your Display Name:", "Satish Kommana");
  if (defaultName) {
    window.playerProfile.displayName = defaultName;
    window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
    window.openAccountModal();
  }
};

window.saveAccountProfile = function() {
  const nameInput = document.getElementById("editNameInput").value.trim();
  if (nameInput) {
    window.playerProfile.displayName = nameInput;
    window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();
    alert("Profile saved successfully!");
    window.openAccountModal();
  } else {
    alert("Please enter a valid display name.");
  }
};

function promptReviveOrGameOver(reasonText) {
  SFX.crash();
  SFX.whistle();
  pendingDeathReason = reasonText;
  gameState = "REVIVE_PROMPT";
  reviveCountdown = 5.0;
  switchPlayerAnimation("idle");

  chaserGroup.visible = true;
  chaserGroup.position.set(playerGroup.position.x - 0.75, playerGroup.position.y, 0.5);

  document.getElementById("reviveDiamondsCount").innerText = window.playerProfile.diamonds;
  document.getElementById("reviveModal").style.display = "flex";
}

function handleReviveClick() {
  if (gameState !== "REVIVE_PROMPT") return;
  if (window.playerProfile.diamonds < 5) {
    alert("You need 5 Diamonds (💎) to Revive!");
    return;
  }

  window.playerProfile.diamonds -= 5;
  window.syncPlayerProfileToCloud && window.syncPlayerProfileToCloud();

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
  policeTimer = 0;
  chaserGroup.visible = false;

  gameState = "PLAYING";
  switchPlayerAnimation("run");
  SFX.powerup();
  showCallout("REVIVED! Keep Running! 💎");
  updateHudUI();
}

let summaryRenderer = null;
let summaryScene = null;
let summaryCamera = null;
let summaryAvatarClone = null;

function renderSummaryAvatar() {
  const container = document.getElementById("summaryAvatarPreviewContainer");
  container.innerHTML = "";

  const width = container.clientWidth || 140;
  const height = container.clientHeight || 200;

  summaryScene = new THREE.Scene();
  summaryScene.background = new THREE.Color(0x19283d);

  summaryCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 10);
  summaryCamera.position.set(0, 1.4, 3.2);
  summaryCamera.lookAt(0, 1.2, 0);

  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(2, 4, 3);
  summaryScene.add(light);
  summaryScene.add(new THREE.AmbientLight(0xffffff, 0.8));

  summaryRenderer = new THREE.WebGLRenderer({ antialias: true });
  summaryRenderer.setSize(width, height);
  summaryRenderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(summaryRenderer.domElement);

  if (activeGlbHuman) {
    summaryAvatarClone = activeGlbHuman.clone();
    summaryAvatarClone.position.set(0, 0, 0);
    summaryAvatarClone.rotation.y = 0;
    summaryScene.add(summaryAvatarClone);
  } else {
    const fClone = fallbackHuman.clone();
    fClone.position.set(0, 0, 0);
    summaryScene.add(fClone);
    summaryAvatarClone = fClone;
  }

  summaryRenderer.render(summaryScene, summaryCamera);
}

function finalizeGameOver() {
  document.getElementById("reviveModal").style.display = "none";
  gameState = "GAMEOVER";

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
  document.getElementById("goDiamonds").innerText = window.playerProfile.diamonds;
  document.getElementById("gameOverModal").style.display = "flex";

  setTimeout(renderSummaryAvatar, 50);
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

function forceStartGame() {
  if (gameState === "IDLE_INTRO") {
    ensureAudio();
    startNewRun();
  }
}
window.forceStartGame = forceStartGame;

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
  document.getElementById("missionsModal").style.display = "none";
  document.getElementById("giftsModal").style.display = "none";
  document.getElementById("eventsModal").style.display = "none";
  document.getElementById("accountModal").style.display = "none";
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

canvas.addEventListener("pointerdown", e => {
  if (gameState === "IDLE_INTRO") {
    ensureAudio();
    startNewRun();
    return;
  }
  if (gameState !== "PLAYING") return;
  touchStartX = e.clientX;
  touchStartY = e.clientY;
  const now = performance.now();
  if (now - lastTapTime < 280) activateHoverboard();
  lastTapTime = now;
});

canvas.addEventListener("pointerup", e => {
  if (gameState !== "PLAYING") return;
  const dx = e.clientX - touchStartX;
  const dy = e.clientY - touchStartY;
  if (Math.abs(dx) < 25 && Math.abs(dy) < 25) return;
  if (Math.abs(dx) > Math.abs(dy)) changeLane(dx > 0 ? 1 : -1);
  else {
    if (dy < 0) jump();
    else roll();
  }
});

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
  updateMissionsRedDot();
};

window.openShopModal = function() {
  window.updateMenuUI();
  document.getElementById("shopModal").style.display = "flex";
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

document.getElementById("replayBtn").onclick = startNewRun;
document.getElementById("homeBtn").onclick = goToHomeScreen;
document.getElementById("boardTriggerBtn").onclick = activateHoverboard;

document.getElementById("reviveActionBtn").onclick = handleReviveClick;
document.getElementById("noThanksBtn").onclick = finalizeGameOver;

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
window.updateMenuUI();

// ================= 10. MAIN ANIMATION & PHYSICS LOOP =================
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  const t = now * 0.001;

  if (playerMixer) playerMixer.update(dt * (gameState === "PLAYING" ? speed / 18 : 1));
  if (policeMixer) policeMixer.update(dt * (speed / 16));

  if (gameState === "IDLE_INTRO") {
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

  if (gameState === "GAMEOVER") {
    if (summaryRenderer && summaryScene && summaryCamera && summaryAvatarClone) {
      summaryAvatarClone.rotation.y += dt * 1.2;
      summaryRenderer.render(summaryScene, summaryCamera);
    }
    return;
  }

  if (gameState === "PLAYING") {
    playerGroup.rotation.y = 0;

    speed = Math.min(42, speed + dt * 0.38);
    const stepZ = speed * dt;
    const distDelta = stepZ * 0.45;
    distanceRun += distDelta;
    window.score += distDelta * 2.2 * scoreMultiplier;

    updateMissionsProgress(distDelta, 0, 0, 0);

    scrollingProps.forEach(row => {
      row.position.z += stepZ;
      if (row.position.z > 24) row.position.z -= 260;
    });

    nextSpawnZ += stepZ;
    if (nextSpawnZ > -185) {
      spawnWave(nextSpawnZ - 30);
      nextSpawnZ -= 30;
    }

    const targetX = LANES[currentLane];
    playerGroup.position.x += (targetX - playerGroup.position.x) * Math.min(1, dt * 14);

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

    if (policeTimer > 0) {
      policeTimer -= dt;
      chaserGroup.visible = true;
      chaserGroup.position.z += (2.1 - chaserGroup.position.z) * dt * 5;
      chaserGroup.position.x += (playerGroup.position.x - playerGroup.position.x) * dt * 8;
      chaserGroup.position.y = playerGroup.position.y;
    } else {
      chaserGroup.position.z += (11.5 - chaserGroup.position.z) * dt * 2.5;
      if (chaserGroup.position.z > 9.8) chaserGroup.visible = false;
    }

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
        updateMissionsProgress(0, 1, 0, 0);
        continue;
      }
      if (c.position.z > 12) {
        scene.remove(c);
        coins.splice(i, 1);
      }
    }

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
          updateMissionsProgress(0, 0, 2, 0);
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
