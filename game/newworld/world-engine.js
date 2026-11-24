import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const EIGHT_PLOT_TYPES = new Set(["ground", "audi_showroom"]);

export const FOUR_PLOT_TYPES = new Set([
  "police_station",
  "hospital",
  "school",
  "bus_stand",
  "auto_stand",
  "petrol_bunk",
  "srmt_mall",
  "apple_store",
  "reliance_store",
  "gym",
  "iti_college"
]);

export const TWO_PLOT_TYPES = new Set(["photo_studio"]);

export const BUILDING_LABELS = {
  house_blue: "🏡 Ivory & Slate Villa",
  house_coral: "🏠 Terracotta & Cream Duplex",
  house_mint: "🏡 Sage & Teak House",
  house_gold: "🏢 Sandstone Luxury Duplex",
  tower_brick: "🏢 5-Floor Brick Balcony Tower",
  tower_cube: "🏢 5-Floor Modern Cube Tower",
  tower_led: "🏢 5-Floor Luxury LED Tower",
  tower_gold: "🏢 6-Floor Golden Glass Penthouse",
  shop: "☕ టీ & టిఫిన్ • SHOP",
  cafe: "☕ కేఫ్ • COFFEE CAFE",
  ground: "🏏 గ్రౌండ్ • MEGA CRICKET STADIUM (8 PLOTS)",
  audi_showroom: "🚘 ఆడి షోరూమ్ • AUDI SHOWROOM (8 PLOTS)",
  gym: "🏋️ జిమ్ • FITNESS GYM (4 PLOTS)",
  iti_college: "🏫 ఐటిఐ కాలేజ్ • ITI COLLEGE (4 PLOTS)",
  photo_studio: "📸 ఫోటో స్టూడియో • PHOTO STUDIO (2 PLOTS)",
  school: "🏫 పాఠశాల • GRAND SCHOOL (4 PLOTS)",
  hospital: "🏥 ఆసుపత్రి • SUPER HOSPITAL (4 PLOTS)",
  bus_stand: "🚌 బస్ స్టాండ్ • APSRTC TERMINAL (4 PLOTS)",
  auto_stand: "🛺 ఆటో స్టాండ్ • TRANSPORT OFFICE (4 PLOTS)",
  police_station: "🚓 పోలీస్ స్టేషన్ • POLICE HQ (4 PLOTS)",
  petrol_bunk: "⛽ పెట్రోల్ బంక్ • FUEL PLAZA (4 PLOTS)",
  srmt_mall: "🏬 SRMT మాల్ • SRMT MALL (4 PLOTS)",
  apple_store: "🍎 ఆపిల్ స్టోర్ • APPLE STORE (4 PLOTS)",
  reliance_store: "🛒 రిలయన్స్ • RELIANCE DIGITAL & SMART (4 PLOTS)",
  empty: "OPEN LAND"
};

export function getRequiredSize(type) {
  if (EIGHT_PLOT_TYPES.has(type)) return 8;
  if (FOUR_PLOT_TYPES.has(type)) return 4;
  if (TWO_PLOT_TYPES.has(type)) return 2;
  return 1;
}

const SPIRAL_COORDS = [];
const COORD_TO_BLOCK = new Map();

(function buildSpiralTable(maxBlocks = 1200) {
  for (let i = 0; i < maxBlocks; i++) {
    const n = i + 1; // +1 skips (0,0) -> reserved for ST JUNCTION STATUE!
    let k = Math.ceil((Math.sqrt(n + 1) - 1) / 2);
    let t = 2 * k + 1;
    let m = t * t;
    t -= 1;
    let bx, bz;
    if (n >= m - t) {
      bx = k - (m - n);
      bz = -k;
    } else {
      m -= t;
      if (n >= m - t) {
        bx = -k;
        bz = -k + (m - n);
      } else {
        m -= t;
        if (n >= m - t) {
          bx = -k + (m - n);
          bz = k;
        } else {
          bx = k;
          bz = k - (m - n - t);
        }
      }
    }
    SPIRAL_COORDS.push({ bx, bz });
    COORD_TO_BLOCK.set(`${bx},${bz}`, i);
  }
})();

export function blockIdxToCoord(blockIdx) {
  return SPIRAL_COORDS[blockIdx] || { bx: 1, bz: 0 };
}

export function coordToBlockIdx(bx, bz) {
  const res = COORD_TO_BLOCK.get(`${bx},${bz}`);
  return res === undefined ? -1 : res;
}

export function getBlockPlotIdsByBlockIdx(blockIdx) {
  const base = blockIdx * 4 + 1;
  return {
    blockIdx,
    anchorId: `plot_${String(base).padStart(4, "0")}`,
    siblings: [
      `plot_${String(base).padStart(4, "0")}`,
      `plot_${String(base + 1).padStart(4, "0")}`,
      `plot_${String(base + 2).padStart(4, "0")}`,
      `plot_${String(base + 3).padStart(4, "0")}`
    ]
  };
}

export function getBlockPlotIds(plotId) {
  const num = parseInt(plotId.replace("plot_", ""), 10);
  const blockIdx = Math.floor((num - 1) / 4);
  return getBlockPlotIdsByBlockIdx(blockIdx);
}

/**
 * 2-Plot Side-by-Side Row Helper (faces North road for subIdx 0/1, South road for subIdx 2/3)
 */
export function getTwoPlotGroup(plotId) {
  const num = parseInt(plotId.replace("plot_", ""), 10);
  const idx0 = Math.max(0, num - 1);
  const blockIdx = Math.floor(idx0 / 4);
  const subIdx = idx0 % 4;
  const isNorthRow = subIdx < 2;
  const base = blockIdx * 4 + (isNorthRow ? 1 : 3);
  const pA = `plot_${String(base).padStart(4, "0")}`;
  const pB = `plot_${String(base + 1).padStart(4, "0")}`;
  return {
    blockIdx,
    isNorthRow,
    rotY: isNorthRow ? Math.PI : 0,
    anchorId: pA,
    siblings: [pA, pB]
  };
}

export function getEightPlotGroup(plotId) {
  const num = parseInt(plotId.replace("plot_", ""), 10);
  const blockIdx = Math.floor((num - 1) / 4);
  const { bx, bz } = blockIdxToCoord(blockIdx);

  let rightIdx = coordToBlockIdx(bx + 1, bz);
  let leftIdx = blockIdx;

  if (rightIdx === -1) {
    const prevIdx = coordToBlockIdx(bx - 1, bz);
    if (prevIdx !== -1) {
      leftIdx = prevIdx;
      rightIdx = blockIdx;
    }
  }

  const leftInfo = getBlockPlotIdsByBlockIdx(leftIdx);
  const rightInfo = getBlockPlotIdsByBlockIdx(rightIdx);

  return {
    leftBlockIdx: leftIdx,
    rightBlockIdx: rightIdx,
    anchorId: leftInfo.anchorId,
    partnerAnchorId: rightInfo.anchorId,
    siblings: [...leftInfo.siblings, ...rightInfo.siblings]
  };
}

export class FollowerTownEngine {
  constructor(container, onPlotSelected) {
    this.container = container;
    this.onPlotSelected = onPlotSelected;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    // Very light fog so buildings stay crystal clear and visible from afar!
    this.scene.fog = new THREE.Fog(0x87ceeb, 320, 920);

    const initW = container.clientWidth || window.innerWidth || 360;
    const initH = container.clientHeight || window.innerHeight || 640;
    const aspect = initW / initH;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 1.0, 1450);
    this.camera.position.set(62, 68, 62);

    // AUTO LOW-RAM DETECTION (2GB–4GB phones get zero-crash ultra-lite mode automatically!)
    const devMem = navigator.deviceMemory || 4;
    const cpuCores = navigator.hardwareConcurrency || 4;
    this.isLowRam = devMem <= 4 || cpuCores <= 4;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isLowRam,
      powerPreference: "high-performance",
      precision: "mediump"
    });
    this.renderer.setSize(initW, initH);
    this.renderer.setPixelRatio(this.isLowRam ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.35));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    container.appendChild(this.renderer.domElement);

    // FREE-ROAM GOOGLE-MAPS PAN & ZOOM
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.screenSpacePanning = false;
    this.controls.panSpeed = 1.25;
    this.controls.zoomSpeed = 1.2;
    this.controls.zoomToCursor = true;
    this.controls.maxPolarAngle = Math.PI / 2.22;
    this.controls.minPolarAngle = 0.25;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 480;
    this.controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_ROTATE
    };
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    };
    this.controls.target.set(0, 0, 0);

    this.controls.addEventListener("start", () => {
      this.cameraGoal = null;
      if (this.proReelTour.active) this.stopProReelTour();
      if (this.droneTour.active) this.stopDroneView();
      if (this.buildReelTour.active) this.stopBuildReelTour();
    });

    this.PLOT_SIZE = 7.4;
    this.ROAD_WIDTH = 4.2;
    this.BLOCK_STEP = this.PLOT_SIZE * 2 + this.ROAD_WIDTH; // 19.0
    this.BLOCK_FOOTPRINT = this.PLOT_SIZE * 2; // 14.8
    this.EIGHT_PLOT_WIDTH = this.BLOCK_FOOTPRINT * 2 + this.ROAD_WIDTH; // 33.8
    this.RING_ROAD_WIDTH = 7.2;

    this.currentGridRadius = 0;
    this.townName = "FOLLOWER NAGARAM";
    this.plotDataMap = new Map();
    this.plotMeshes = new Map();
    this.landmarkCoveredPlots = new Set();
    this.plotHitboxes = [];
    this.lampBulbs = [];
    this.vehicleHeadlights = [];
    this.fountainJets = [];
    this.airportSim = null;
    this.airportX = 110;
    this.beachSim = null;
    this.beachX = -108;
    this.beachOwner = "@follower_beach";
    this.railwaySim = null;
    this.railwayZ = -65;
    this.railwayOwner = "@_ur_bunny_108_";
    this.airportHouseOwner = "@urs_bazigar";
    this.turntableRotors = [];
    this.studioFlashes = [];
    this.skyClouds = [];
    this.cloudMat = null;
    this.starField = null;
    this.plotSigns = [];
    this.colorMatCache = new Map();
    this.signTexCache = new Map();
    this._cullAccum = 0;
    this.sirenLights = [];
    this.landmarkActors = [];
    this.petrolSimulations = [];
    this.busSimulations = [];
    this.autoSimulations = [];
    this.policeSimulations = [];
    this.ambulanceSimulations = [];
    this.blockedRoadZones = [];
    this.vehicles = [];
    this.ringVehicles = [];
    this.workers = [];
    this.postman = null;
    this.constructions = [];

    this.proReelTour = {
      active: false,
      stops: [],
      idx: 0,
      timer: 0,
      onStopChange: null,
      onComplete: null
    };

    this.droneTour = {
      active: false,
      curve: null,
      t: 0,
      speed: 0.032,
      onStop: null
    };

    this.buildReelTour = {
      active: false,
      stops: [],
      idx: 0,
      timer: 0,
      onStopChange: null,
      onComplete: null
    };

    this.cityGroup = new THREE.Group();
    this.plotsGroup = new THREE.Group();
    this.trafficGroup = new THREE.Group();
    this.workersGroup = new THREE.Group();
    this.scene.add(this.cityGroup, this.plotsGroup, this.trafficGroup, this.workersGroup);

    this.highlightBeacon = null;
    this.cameraGoal = null;
    this.autoSpin = false;
    this.lifeEnabled = true;
    this.timeOfDay = "day";
    this.clock = new THREE.Clock();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerDownPos = { x: 0, y: 0 };

    this._initLights();
    this._buildSkyDecor();
    this._initSharedMaterials();
    this._initSharedGeometries();
    this._initEvents();

    this.ensureCapacity(36);
    this._animate();
  }

  _initLights() {
    // Bright, crisp 3-point lighting so every building face is clearly visible without heavy shadows!
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x3f6212, 0.95);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.15);
    this.sunLight.position.set(80, 120, 60);
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0xdbeafe, 0.45);
    this.fillLight.position.set(-70, 50, -60);
    this.scene.add(this.fillLight);
  }

  _initSharedMaterials() {
    this.mat = {
      grass: new THREE.MeshLambertMaterial({ color: 0x65a30d }),
      turf: new THREE.MeshLambertMaterial({ color: 0x16a34a }),
      pitch: new THREE.MeshLambertMaterial({ color: 0xd6b588 }),
      road: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      highway: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      median: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      sidewalk: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      concrete: new THREE.MeshLambertMaterial({ color: 0xcbd5e1 }),
      marble: new THREE.MeshLambertMaterial({ color: 0xf1f5f9 }),
      bronze: new THREE.MeshLambertMaterial({ color: 0xd97706 }),
      gold: new THREE.MeshLambertMaterial({ color: 0xfbbf24 }),
      water: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }),
      stripe: new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
      wood: new THREE.MeshLambertMaterial({ color: 0x92400e }),
      darkWood: new THREE.MeshLambertMaterial({ color: 0x5c2d0c }),
      brickRed: new THREE.MeshLambertMaterial({ color: 0xb4533c }),
      stoneDark: new THREE.MeshLambertMaterial({ color: 0x475569 }),
      charcoal: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      balconyPlant: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      roofDark: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      roofRed: new THREE.MeshLambertMaterial({ color: 0xb91c1c }),
      roofOrange: new THREE.MeshLambertMaterial({ color: 0xc2410c }),
      wallWhite: new THREE.MeshLambertMaterial({ color: 0xf8fafc }),
      wallCream: new THREE.MeshLambertMaterial({ color: 0xfef3c7 }),
      wallWarmStone: new THREE.MeshLambertMaterial({ color: 0xe7e0d3 }),
      wallKhaki: new THREE.MeshLambertMaterial({ color: 0xd6c39c }),
      wallBlue: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }),
      wallCoral: new THREE.MeshLambertMaterial({ color: 0xfb7185 }),
      wallMint: new THREE.MeshLambertMaterial({ color: 0x34d399 }),
      wallGold: new THREE.MeshLambertMaterial({ color: 0xfbbf24 }),
      glass: new THREE.MeshLambertMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.72 }),
      darkGlass: new THREE.MeshLambertMaterial({ color: 0x1e3a5f }),
      appleSilver: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }),
      relianceBlue: new THREE.MeshLambertMaterial({ color: 0x1d4ed8 }),
      srmtPurple: new THREE.MeshLambertMaterial({ color: 0x7e22ce }),
      srmtMagenta: new THREE.MeshLambertMaterial({ color: 0xdb2777 }),
      teal: new THREE.MeshLambertMaterial({ color: 0x0d9488 }),
      navy: new THREE.MeshLambertMaterial({ color: 0x1e3a8a }),
      petrolRed: new THREE.MeshLambertMaterial({ color: 0xdc2626 }),
      petrolYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      treeTrunk: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      treeLeaf: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      lampPole: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      lampBulbDay: new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }),
      lampBulbNight: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
      ledStripNight: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
      headlightBeam: new THREE.MeshBasicMaterial({ color: 0xfef9c3, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
      taillight: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
      windowDay: new THREE.MeshLambertMaterial({ color: 0x3b6ea5 }),
      windowNight: new THREE.MeshBasicMaterial({ color: 0xfde047 }),
      scaffolding: new THREE.MeshLambertMaterial({ color: 0xd97706, wireframe: true }),
      skin: new THREE.MeshLambertMaterial({ color: 0xfdba74 }),
      khakiUniform: new THREE.MeshLambertMaterial({ color: 0xc2a36b }),
      darkPants: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      whiteCoat: new THREE.MeshLambertMaterial({ color: 0xf8fafc }),
      blueUniform: new THREE.MeshLambertMaterial({ color: 0x2563eb }),
      jerseyRed: new THREE.MeshLambertMaterial({ color: 0xef4444 }),
      jerseyYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      jerseyBlue: new THREE.MeshLambertMaterial({ color: 0x0ea5e9 }),
      ballRed: new THREE.MeshBasicMaterial({ color: 0xdc2626 }),
      wheelBlack: new THREE.MeshLambertMaterial({ color: 0x0f172a }),
      rimSilver: new THREE.MeshLambertMaterial({ color: 0xcbd5e1 }),
      autoYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      autoGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      autoCanopy: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      busWindshield: new THREE.MeshLambertMaterial({ color: 0x0f172a }),
      busLedBoard: new THREE.MeshBasicMaterial({ color: 0xf59e0b }),
      chrome: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }),
      clothBlue: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }),
      stuccoIvory: new THREE.MeshLambertMaterial({ color: 0xf4efe6 }),
      stuccoCream: new THREE.MeshLambertMaterial({ color: 0xf7eedc }),
      stuccoSage: new THREE.MeshLambertMaterial({ color: 0xcbd5c0 }),
      stuccoSandstone: new THREE.MeshLambertMaterial({ color: 0xe6d5b8 }),
      plinthGrey: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      slateTrim: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      terracottaRoof: new THREE.MeshLambertMaterial({ color: 0x9a3412 }),
      teakWood: new THREE.MeshLambertMaterial({ color: 0x7c4a21 }),
      warmTaupe: new THREE.MeshLambertMaterial({ color: 0x9c8c79 }),
      tankBlack: new THREE.MeshLambertMaterial({ color: 0x1f2937 }),
      gateMetal: new THREE.MeshLambertMaterial({ color: 0x27272a }),
      winFrame: new THREE.MeshLambertMaterial({ color: 0x475569 }),
      sunglasses: new THREE.MeshBasicMaterial({ color: 0x09090b }),
      // Airport, Diamond Vehicle & Live Sheru Bhai Royal Materials
      diamondCrystal: new THREE.MeshPhongMaterial({
        color: 0xe0f2fe,
        emissive: 0x0284c7,
        emissiveIntensity: 0.3,
        specular: 0xffffff,
        shininess: 145,
        flatShading: true
      }),
      diamondAccent: new THREE.MeshPhongMaterial({
        color: 0x7dd3fc,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.5,
        specular: 0xffffff,
        shininess: 160,
        flatShading: true
      }),
      diamondGlow: new THREE.MeshBasicMaterial({ color: 0x67e8f9 }),
      richVelvetRed: new THREE.MeshLambertMaterial({ color: 0x991b1b }),
      richRoyalPurple: new THREE.MeshLambertMaterial({ color: 0x581c87 }),
      richGoldTrim: new THREE.MeshPhongMaterial({
        color: 0xfacc15,
        emissive: 0xb45309,
        emissiveIntensity: 0.28,
        specular: 0xffffff,
        shininess: 120
      }),
      lionFurGold: new THREE.MeshLambertMaterial({ color: 0xf5c06b }),
      lionManeRich: new THREE.MeshLambertMaterial({ color: 0x92400e }),
      runwayAsphalt: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      tarmacGrey: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      runwayBlueLight: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      beaconRed: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
      beaconGreen: new THREE.MeshBasicMaterial({ color: 0x22c55e }),
      vipCarpet: new THREE.MeshLambertMaterial({ color: 0xb91c1c }),
      heliGlass: new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 }),
      planeWhite: new THREE.MeshLambertMaterial({ color: 0xf8fafc }),
      planeBlue: new THREE.MeshLambertMaterial({ color: 0x0284c7 }),
      rotorBlade: new THREE.MeshLambertMaterial({ color: 0x0f172a }),
      // Beach, Audi Showroom, Gym & Photo Studio Materials
      beachSand: new THREE.MeshLambertMaterial({ color: 0xfde68a }),
      beachSandWet: new THREE.MeshLambertMaterial({ color: 0xeab308 }),
      oceanDeep: new THREE.MeshLambertMaterial({ color: 0x0284c7 }),
      oceanShallow: new THREE.MeshLambertMaterial({ color: 0x06b6d4 }),
      seaFoam: new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.8 }),
      tropicalShirt: new THREE.MeshLambertMaterial({ color: 0x0ea5e9 }),
      tropicalShorts: new THREE.MeshLambertMaterial({ color: 0xf43f5e }),
      audiSilver: new THREE.MeshPhongMaterial({ color: 0xe2e8f0, specular: 0xffffff, shininess: 110 }),
      audiRed: new THREE.MeshPhongMaterial({ color: 0xdc2626, specular: 0xffffff, shininess: 120 }),
      audiBlue: new THREE.MeshPhongMaterial({ color: 0x1d4ed8, specular: 0xffffff, shininess: 120 }),
      audiBlack: new THREE.MeshPhongMaterial({ color: 0x111827, specular: 0x94a3b8, shininess: 110 }),
      audiWhite: new THREE.MeshPhongMaterial({ color: 0xf8fafc, specular: 0xffffff, shininess: 125 }),
      audiGlass: new THREE.MeshLambertMaterial({ color: 0x0f172a, transparent: true, opacity: 0.85 }),
      gymOrange: new THREE.MeshBasicMaterial({ color: 0xf97316 }),
      gymBlack: new THREE.MeshLambertMaterial({ color: 0x18181b }),
      gymSteel: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      studioCyan: new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
      studioFlash: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      // Railway, Train, Mountain Tunnel, ITI College & Cafe Materials
      railSteel: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      railSleeper: new THREE.MeshLambertMaterial({ color: 0x57534e }),
      railBallast: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      trainBlue: new THREE.MeshLambertMaterial({ color: 0x1d4ed8 }),
      trainDarkBlue: new THREE.MeshLambertMaterial({ color: 0x1e3a8a }),
      trainYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      trainRoof: new THREE.MeshLambertMaterial({ color: 0xcbd5e1 }),
      mountainRock: new THREE.MeshLambertMaterial({ color: 0x57534e }),
      mountainGreen: new THREE.MeshLambertMaterial({ color: 0x166534 }),
      tunnelVoid: new THREE.MeshBasicMaterial({ color: 0x020617 }),
      stationRoof: new THREE.MeshLambertMaterial({ color: 0x0369a1 }),
      cafeBrown: new THREE.MeshLambertMaterial({ color: 0x451a03 }),
      cafeCream: new THREE.MeshLambertMaterial({ color: 0xfef3c7 }),
      itiWorkshop: new THREE.MeshLambertMaterial({ color: 0x0284c7 })
    };
  }

  /**
   * SHARED GEOMETRY POOL (Massive RAM & GPU boost for 400+ plots on low-end devices!)
   */
  _initSharedGeometries() {
    const s = this.PLOT_SIZE - 0.7;
    this.geo = {
      hit1: new THREE.BoxGeometry(this.PLOT_SIZE - 0.3, 6.5, this.PLOT_SIZE - 0.3),
      base1: new THREE.BoxGeometry(this.PLOT_SIZE - 0.3, 0.14, this.PLOT_SIZE - 0.3),
      fenceH: new THREE.BoxGeometry(s, 0.45, 0.12),
      fenceV: new THREE.BoxGeometry(0.12, 0.45, s),
      post: new THREE.BoxGeometry(0.14, 1.1, 0.14),
      board: new THREE.BoxGeometry(1.5, 0.6, 0.1),

      // Classic 1-plot house shared geometries
      houseBody1: new THREE.BoxGeometry(4.5, 2.5, 4.2),
      houseBody2: new THREE.BoxGeometry(4.5, 3.8, 4.2),
      parapet: new THREE.BoxGeometry(4.75, 0.38, 4.45),
      mumty: new THREE.BoxGeometry(1.5, 0.9, 1.5),
      pathway: new THREE.BoxGeometry(1.3, 0.08, 1.5),
      porch: new THREE.BoxGeometry(1.8, 0.18, 0.8),
      door: new THREE.BoxGeometry(0.9, 1.45, 0.12),
      win: new THREE.BoxGeometry(0.88, 0.85, 0.12),
      winFrameGeo: new THREE.BoxGeometry(1.04, 1.0, 0.14),
      chajjaGeo: new THREE.BoxGeometry(1.22, 0.1, 0.42),
      plinthGeo: new THREE.BoxGeometry(4.95, 0.36, 4.55),
      compWallFront: new THREE.BoxGeometry(2.1, 0.65, 0.14),
      compWallSide: new THREE.BoxGeometry(0.14, 0.65, 6.2),
      compWallBack: new THREE.BoxGeometry(6.4, 0.65, 0.14),
      gatePillar: new THREE.BoxGeometry(0.32, 0.92, 0.32),
      verandaCol: new THREE.BoxGeometry(0.22, 2.2, 0.22),
      sintexTank: new THREE.CylinderGeometry(0.34, 0.34, 0.68, 8),
      frontBush: new THREE.DodecahedronGeometry(0.36, 0),
      slopedRoof: new THREE.ConeGeometry(3.65, 1.15, 4),
      balconyRail: new THREE.BoxGeometry(2.3, 0.48, 0.08),
      stepGeo: new THREE.BoxGeometry(1.4, 0.18, 0.45),

      // 5-Floor Modern Tower shared geometries
      towerCore5: new THREE.BoxGeometry(4.6, 6.4, 4.1),
      towerSlab: new THREE.BoxGeometry(4.95, 0.14, 0.82),
      towerWinL: new THREE.BoxGeometry(1.3, 0.82, 0.1),
      towerRailL: new THREE.BoxGeometry(1.35, 0.4, 0.08),
      towerWinR: new THREE.BoxGeometry(1.65, 0.82, 0.1),
      towerPlantR: new THREE.BoxGeometry(1.6, 0.34, 0.25),
      cubeBlock: new THREE.BoxGeometry(3.3, 1.24, 3.6),
      cubeGlass: new THREE.BoxGeometry(1.5, 0.92, 0.14),
      cubeBalc: new THREE.BoxGeometry(1.7, 0.14, 0.65),
      ledFrame: new THREE.BoxGeometry(2.7, 0.18, 0.85),
      ledWin: new THREE.BoxGeometry(2.1, 0.92, 0.12),
      ledRail: new THREE.BoxGeometry(2.4, 0.44, 0.08),
      ledBush: new THREE.BoxGeometry(0.45, 0.44, 0.35),
      goldTrim: new THREE.BoxGeometry(4.8, 0.16, 4.5),
      goldWin: new THREE.BoxGeometry(4.1, 0.82, 0.12),

      // Character shared geometries
      cLegs: new THREE.BoxGeometry(0.32, 0.46, 0.22),
      cTorso: new THREE.BoxGeometry(0.4, 0.5, 0.25),
      cHead: new THREE.BoxGeometry(0.28, 0.28, 0.28),
      cCap: new THREE.BoxGeometry(0.34, 0.14, 0.34)
    };
  }

  // Cached color material pool (saves RAM across vehicles & flowers)
  _getColorMat(hex) {
    if (!this.colorMatCache.has(hex)) {
      this.colorMatCache.set(hex, new THREE.MeshLambertMaterial({ color: hex }));
    }
    return this.colorMatCache.get(hex);
  }

  // Crisp, RAM-cached architectural facade signboard mounted directly on landmark buildings!
  _makeBuildingBoard(title, subtitle, bgHex = "#1e3a8a", accentHex = "#facc15", w = 6.4, h = 1.15) {
    const key = `${title}|${subtitle}|${bgHex}|${accentHex}`;
    let mat = this.signTexCache.get(key);
    if (!mat) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 64;
      const ctx = c.getContext("2d");
      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, 256, 64);
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 4;
      ctx.strokeRect(3, 3, 250, 58);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(title, 128, subtitle ? 24 : 33);
      if (subtitle) {
        ctx.fillStyle = accentHex;
        ctx.font = "bold 14px sans-serif";
        ctx.fillText(subtitle, 128, 48);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      mat = new THREE.MeshBasicMaterial({ map: tex });
      this.signTexCache.set(key, mat);
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  }

  // Frees GPU texture memory for unique sprite labels when a plot is rebuilt or cleared
  _disposePlotGroup(group) {
    if (!group) return;
    group.traverse((obj) => {
      if (obj.isSprite && obj.material) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    });
  }

  // Ultra-Lightweight Starfield (Night Only — 1 draw call) + Soft Drifting Sky Clouds (Day/Sunset)
  _buildSkyDecor() {
    const starCount = this.isLowRam ? 140 : 240;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 140 + Math.random() * 220;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = 85 + Math.random() * 110;
      positions[i * 3 + 2] = Math.sin(theta) * radius;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xfef9c3, size: 2.0, sizeAttenuation: true });
    this.starField = new THREE.Points(starGeo, starMat);
    this.starField.visible = false;
    this.scene.add(this.starField);

    this.cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    const puffGeo = new THREE.DodecahedronGeometry(3.8, 0);
    const cloudCount = this.isLowRam ? 5 : 8;
    for (let c = 0; c < cloudCount; c++) {
      const cg = new THREE.Group();
      const p1 = new THREE.Mesh(puffGeo, this.cloudMat);
      const p2 = new THREE.Mesh(puffGeo, this.cloudMat);
      p2.position.set(3.2, 0.4, 0.4);
      p2.scale.set(0.85, 0.78, 0.85);
      const p3 = new THREE.Mesh(puffGeo, this.cloudMat);
      p3.position.set(-3.0, -0.2, -0.3);
      p3.scale.set(0.75, 0.7, 0.75);
      cg.add(p1, p2, p3);

      const startX = -140 + (c / cloudCount) * 280;
      const startZ = -110 + ((c * 67) % 220);
      const y = 66 + (c % 3) * 9;
      cg.position.set(startX, y, startZ);
      cg.scale.set(1.3, 0.65, 1.0);
      this.scene.add(cg);
      this.skyClouds.push({ mesh: cg, speed: 1.4 + (c % 3) * 0.55 });
    }
  }

  _initEvents() {
    window.addEventListener("resize", () => {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    const dom = this.renderer.domElement;
    dom.addEventListener("pointerdown", (e) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener("pointerup", (e) => {
      const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (dist > 8) return;

      const rect = dom.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.plotHitboxes, false);
      if (hits.length > 0) {
        const plotId = hits[0].object.userData.plotId;
        if (plotId === "ST_JUNCTION") {
          this.cameraGoal = {
            target: new THREE.Vector3(0, 3.5, 0),
            camPos: new THREE.Vector3(24, 26, 24),
            speed: 0.1
          };
          if (this.onPlotSelected) {
            this.onPlotSelected("ST_JUNCTION", {
              status: "junction",
              ownerName: "🗽 ST JUNCTION",
              role: "Official City Center • Tap below to visit stgames.online!",
              website: "https://stgames.online/"
            });
          }
          return;
        }
        this.focusPlot(plotId);
        if (this.onPlotSelected) {
          this.onPlotSelected(plotId, this.plotDataMap.get(plotId) || null);
        }
      }
    });
  }

  setTownName(name) {
    const clean = (name || "FOLLOWER NAGARAM").trim();
    if (clean !== this.townName) {
      this.townName = clean;
      if (this.currentGridRadius > 0) this._rebuildRoadsAndRingRoad();
    }
  }

  setBeachOwner(ownerName) {
    const clean = (ownerName || "@follower_beach").trim();
    if (clean !== this.beachOwner) {
      this.beachOwner = clean;
      if (this.currentGridRadius > 0) this._rebuildRoadsAndRingRoad();
    }
  }

  setRailwayOwner(ownerName) {
    const clean = (ownerName || "@_ur_bunny_108_").trim();
    if (clean !== this.railwayOwner) {
      this.railwayOwner = clean;
      if (this.currentGridRadius > 0) this._rebuildRoadsAndRingRoad();
    }
  }

  setAirportHouseOwner(ownerName) {
    const clean = (ownerName || "@urs_bazigar").trim();
    if (clean !== this.airportHouseOwner) {
      this.airportHouseOwner = clean;
      if (this.currentGridRadius > 0) this._rebuildRoadsAndRingRoad();
    }
  }

  syncLandmarkFootprints(allPlotsObj) {
    this.landmarkCoveredPlots.clear();
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (p && p.status === "built") {
        const req = getRequiredSize(p.buildingType);
        if (req >= 2) {
          const grp = req === 8 ? getEightPlotGroup(pid) : req === 4 ? getBlockPlotIds(pid) : getTwoPlotGroup(pid);
          grp.siblings.forEach((sib) => {
            if (sib !== pid) this.landmarkCoveredPlots.add(sib);
          });
        }
      }
    });
  }

  getPlotPosition(plotIndex) {
    const blockIdx = Math.floor(plotIndex / 4);
    const subIdx = plotIndex % 4;
    const { bx, bz } = blockIdxToCoord(blockIdx);

    const blockCenterX = bx * this.BLOCK_STEP;
    const blockCenterZ = bz * this.BLOCK_STEP;
    const half = this.PLOT_SIZE / 2;

    const offsets = [
      { x: -half, z: -half, rotY: Math.PI },
      { x: half, z: -half, rotY: Math.PI },
      { x: -half, z: half, rotY: 0 },
      { x: half, z: half, rotY: 0 }
    ];

    return {
      x: blockCenterX + offsets[subIdx].x,
      z: blockCenterZ + offsets[subIdx].z,
      blockCenterX,
      blockCenterZ,
      rotY: offsets[subIdx].rotY,
      subIdx,
      bx,
      bz
    };
  }

  ensureCapacity(totalPlots) {
    const neededBlocks = Math.ceil(Math.max(totalPlots, 36) / 4) + 1;
    const neededRadius = Math.max(1, Math.ceil((Math.sqrt(neededBlocks) - 1) / 2));

    if (neededRadius > this.currentGridRadius) {
      this.currentGridRadius = neededRadius;
      this._rebuildRoadsAndRingRoad();
      this._spawnVehicles();
      this._spawnRoamingWorkersAndPostman();
    }

    const totalSlots = (Math.pow(this.currentGridRadius * 2 + 1, 2) - 1) * 4;
    for (let i = 0; i < totalSlots; i++) {
      const plotId = `plot_${String(i + 1).padStart(4, "0")}`;
      if (!this.plotMeshes.has(plotId)) {
        this.renderPlot(plotId, { status: "empty", ownerName: "", buildingType: "empty", role: "", builtDay: 1 }, false);
      }
    }
  }

  _rebuildRoadsAndRingRoad() {
    while (this.cityGroup.children.length > 0) {
      this.cityGroup.remove(this.cityGroup.children[0]);
    }
    this.lampBulbs = [];
    this.plotHitboxes = this.plotHitboxes.filter((h) => h.userData.plotId !== "ST_JUNCTION" && h.userData.plotId !== "AIRPORT" && h.userData.plotId !== "BEACH" && h.userData.plotId !== "RAILWAY_STATION");
    this.airportSim = null;
    this.beachSim = null;
    this.railwaySim = null;

    const r = this.currentGridRadius;
    const gridCount = r * 2 + 1;
    const innerSpan = gridCount * this.BLOCK_STEP;
    const ringRadius = innerSpan / 2 + 10.5;
    this.ringRadius = ringRadius;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(ringRadius * 2 + 440, ringRadius * 2 + 260),
      this.mat.grass
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.06, 0);
    this.cityGroup.add(ground);

    const roadLines = [];
    for (let i = -r; i <= r + 1; i++) {
      roadLines.push((i - 0.5) * this.BLOCK_STEP);
    }

    const roadLen = innerSpan + this.ROAD_WIDTH;
    const roadGeoH = new THREE.BoxGeometry(roadLen, 0.08, this.ROAD_WIDTH);
    const roadGeoV = new THREE.BoxGeometry(this.ROAD_WIDTH, 0.08, roadLen);

    // Collect dash matrices into ONE InstancedMesh (cuts hundreds of draw calls down to 1!)
    const dashTransforms = [];
    roadLines.forEach((pos) => {
      const roadH = new THREE.Mesh(roadGeoH, this.mat.road);
      roadH.position.set(0, 0.01, pos);
      this.cityGroup.add(roadH);

      const roadV = new THREE.Mesh(roadGeoV, this.mat.road);
      roadV.position.set(pos, 0.01, 0);
      this.cityGroup.add(roadV);

      for (let d = -roadLen / 2 + 3; d < roadLen / 2 - 3; d += 6.0) {
        dashTransforms.push({ x: d, z: pos, rot: 0 });
        dashTransforms.push({ x: pos, z: d, rot: Math.PI / 2 });
      }
    });

    const dashGeo = new THREE.PlaneGeometry(2.0, 0.18);
    dashGeo.rotateX(-Math.PI / 2);
    const dashInst = new THREE.InstancedMesh(dashGeo, this.mat.stripe, dashTransforms.length);
    const dummy = new THREE.Object3D();
    dashTransforms.forEach((dt, idx) => {
      dummy.position.set(dt.x, 0.06, dt.z);
      dummy.rotation.set(0, dt.rot, 0);
      dummy.updateMatrix();
      dashInst.setMatrixAt(idx, dummy.matrix);
    });
    dashInst.instanceMatrix.needsUpdate = true;
    this.cityGroup.add(dashInst);

    // 4 Connector roads to Outer Ring Road
    const connLen = ringRadius - innerSpan / 2 + 2;
    const connMid = innerSpan / 2 + connLen / 2 - 1;
    const cNS = new THREE.BoxGeometry(this.ROAD_WIDTH + 1.2, 0.08, connLen);
    const cEW = new THREE.BoxGeometry(connLen, 0.08, this.ROAD_WIDTH + 1.2);
    [[0, connMid, cNS], [0, -connMid, cNS], [connMid, 0, cEW], [-connMid, 0, cEW]].forEach(([x, z, geo]) => {
      const m = new THREE.Mesh(geo, this.mat.road);
      m.position.set(x, 0.015, z);
      this.cityGroup.add(m);
    });

    // Outer Ring Road
    const rw = this.RING_ROAD_WIDTH;
    const outerLen = ringRadius * 2 + rw;

    const rrTop = new THREE.Mesh(new THREE.BoxGeometry(outerLen, 0.1, rw), this.mat.highway);
    rrTop.position.set(0, 0.02, -ringRadius);
    const rrBot = rrTop.clone();
    rrBot.position.z = ringRadius;
    const rrLeft = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.1, outerLen), this.mat.highway);
    rrLeft.position.set(-ringRadius, 0.02, 0);
    const rrRight = rrLeft.clone();
    rrRight.position.x = ringRadius;
    this.cityGroup.add(rrTop, rrBot, rrLeft, rrRight);

    const medLen = ringRadius * 2 - rw * 0.4;
    const mH = new THREE.BoxGeometry(medLen, 0.24, 0.7);
    const mV = new THREE.BoxGeometry(0.7, 0.24, medLen);
    const medN = new THREE.Mesh(mH, this.mat.median);
    medN.position.set(0, 0.14, -ringRadius);
    const medS = medN.clone();
    medS.position.z = ringRadius;
    const medW = new THREE.Mesh(mV, this.mat.median);
    medW.position.set(-ringRadius, 0.14, 0);
    const medE = medW.clone();
    medE.position.x = ringRadius;
    this.cityGroup.add(medN, medS, medW, medE);

    for (let p = -ringRadius + 10; p <= ringRadius - 10; p += 20) {
      this._addHighwayLamp(p, -ringRadius);
      this._addHighwayLamp(p, ringRadius);
      this._addHighwayLamp(-ringRadius, p);
      this._addHighwayLamp(ringRadius, p);

      if (p < -10 || p > 10) this._addPalmTree(p, -(ringRadius + 7));
      this._addPalmTree(p, ringRadius + 7);
      if (p < -10 || p > 10) this._addPalmTree(-(ringRadius + 7), p);
      if (p < 8 || p > 28) this._addPalmTree(ringRadius + 7, p);
    }

    this._addWelcomeArch(0, ringRadius - rw / 2 - 2.2);

    // Instanced Sidewalk Pads (1 draw call for the entire city!)
    const padSize = this.PLOT_SIZE * 2 + 0.8;
    const padCoords = [];
    for (let bx = -r; bx <= r; bx++) {
      for (let bz = -r; bz <= r; bz++) {
        if (bx === 0 && bz === 0) continue;
        padCoords.push({ cx: bx * this.BLOCK_STEP, cz: bz * this.BLOCK_STEP, bx, bz });
      }
    }
    const padInst = new THREE.InstancedMesh(
      new THREE.BoxGeometry(padSize, 0.12, padSize),
      this.mat.sidewalk,
      padCoords.length
    );
    padCoords.forEach((p, idx) => {
      dummy.position.set(p.cx, 0.02, p.cz);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      padInst.setMatrixAt(idx, dummy.matrix);
      if ((p.bx + p.bz) % 3 === 0) {
        this._addStreetLamp(p.cx + padSize / 2 - 0.3, p.cz + padSize / 2 - 0.3);
      }
    });
    padInst.instanceMatrix.needsUpdate = true;
    this.cityGroup.add(padInst);

    this._buildSTJunctionStatue();
    this._buildInternationalAirport(ringRadius);
    this._buildSheruBhaiBeach(ringRadius);
    this._buildRailwaySystem(ringRadius);
    this.setTimeOfDay(this.timeOfDay);
  }

  /**
   * GRAND "SHERU BHAI STATUE" at ST JUNCTION (0, 0) — Middle of the City!
   * Features marble roundabout, blue water fountain, granite & gold pedestal with
   * "SHERU BHAI" name plaque, heroic bronze/gold statue with cool sunglasses, stylish jacket
   * & proud raised-hand salute! Clicking opens stgames.online popup.
   */
  /**
   * GRAND WHITE MARBLE LION "SHERU BHAI STATUE" at ST JUNCTION (0, 0) — Middle of the City!
   * Matches the White Marble Lion statue: full sculpted lion mane, black sunglasses,
   * white 3-piece suit (buttoned vest, open blazer & lapels, hands gripping lapels),
   * chunky gold chain, round marble base, animated water fountain jets & flower beds!
   */
  _buildSTJunctionStatue() {
    const g = new THREE.Group();

    const basePad = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.16, 15.2), this.mat.marble);
    basePad.position.y = 0.08;

    const gardenRing = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 7.0, 0.28, 24), this.mat.turf);
    gardenRing.position.y = 0.2;

    const poolRim = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 4.9, 0.45, 22), this.mat.marble);
    poolRim.position.y = 0.45;
    const water = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.48, 22), this.mat.water);
    water.position.y = 0.46;

    // Monumental Stepped Granite & Gold Pedestal
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.9, 4.4), this.mat.marble);
    step1.position.y = 1.05;
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.5, 3.2), this.mat.charcoal);
    step2.position.y = 2.75;
    const goldCollar = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.32, 3.5), this.mat.gold);
    goldCollar.position.y = 4.12;

    // Engraved "SHERU BHAI" Gold Plaque on Pedestal Front & Back
    const pCanvas = document.createElement("canvas");
    pCanvas.width = 256;
    pCanvas.height = 96;
    const pCtx = pCanvas.getContext("2d");
    pCtx.fillStyle = "#1e293b";
    pCtx.fillRect(0, 0, 256, 96);
    pCtx.strokeStyle = "#fbbf24";
    pCtx.lineWidth = 6;
    pCtx.strokeRect(4, 4, 248, 88);
    pCtx.fillStyle = "#fbbf24";
    pCtx.font = "bold 34px sans-serif";
    pCtx.textAlign = "center";
    pCtx.fillText("SHERU BHAI", 128, 48);
    pCtx.fillStyle = "#f8fafc";
    pCtx.font = "bold 18px sans-serif";
    pCtx.fillText("ST JUNCTION", 128, 76);
    const pTex = new THREE.CanvasTexture(pCanvas);
    pTex.generateMipmaps = false;
    const pMat = new THREE.MeshBasicMaterial({ map: pTex });
    const plaqueF = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.95), pMat);
    plaqueF.position.set(0, 2.8, 1.62);
    const plaqueB = plaqueF.clone();
    plaqueB.rotation.y = Math.PI;
    plaqueB.position.z = -1.62;
    g.add(plaqueF, plaqueB);

    // WHITE MARBLE LION SHERU BHAI FIGURE
    const statueBase = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.38, 0.3, 16), this.mat.wallWhite);
    statueBase.position.y = 4.44;

    const marbleMat = this.mat.wallWhite;
    const suitShadowMat = this.mat.marble;
    const lionStatue = new THREE.Group();

    // 1. White Dress Shoes & Confident Stance Trousers
    const shoeGeo = new THREE.BoxGeometry(0.38, 0.24, 0.72);
    const shoeL = new THREE.Mesh(shoeGeo, marbleMat);
    shoeL.position.set(-0.46, 4.71, 0.14);
    shoeL.rotation.y = 0.18;
    const shoeR = new THREE.Mesh(shoeGeo, marbleMat);
    shoeR.position.set(0.46, 4.71, 0.14);
    shoeR.rotation.y = -0.18;

    const legGeo = new THREE.CylinderGeometry(0.24, 0.2, 2.05, 8);
    const legL = new THREE.Mesh(legGeo, marbleMat);
    legL.position.set(-0.42, 5.82, 0);
    legL.rotation.z = -0.05;
    const legR = new THREE.Mesh(legGeo, marbleMat);
    legR.position.set(0.42, 5.82, 0);
    legR.rotation.z = 0.05;

    // 2. White 3-Piece Suit: Buttoned Waistcoat + Open Suit Jacket + Lapels
    const hips = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.45, 0.62), marbleMat);
    hips.position.set(0, 6.85, 0);

    const vest = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.48, 0.62), suitShadowMat);
    vest.position.set(0, 7.68, 0.04);

    const btnGeo = new THREE.SphereGeometry(0.055, 6, 6);
    [7.25, 7.55, 7.85].forEach((by) => {
      const btn = new THREE.Mesh(btnGeo, this.mat.plinthGrey);
      btn.position.set(0, by, 0.37);
      lionStatue.add(btn);
    });

    const jacketBack = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.72, 0.48), marbleMat);
    jacketBack.position.set(0, 7.62, -0.14);
    const jacketL = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.65, 0.56), marbleMat);
    jacketL.position.set(-0.52, 7.58, 0.14);
    const jacketR = jacketL.clone();
    jacketR.position.x = 0.52;

    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.15, 0.12), marbleMat);
    lapelL.position.set(-0.34, 7.85, 0.41);
    lapelL.rotation.z = -0.14;
    const lapelR = lapelL.clone();
    lapelR.position.x = 0.34;
    lapelR.rotation.z = 0.14;

    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.42, 0.68), marbleMat);
    shoulders.position.set(0, 8.32, 0);

    // 3. Bent Arms with Both Hands Gripping the Jacket Lapels!
    const upperArmGeo = new THREE.CylinderGeometry(0.2, 0.18, 0.92, 8);
    const uArmL = new THREE.Mesh(upperArmGeo, marbleMat);
    uArmL.position.set(-0.98, 7.9, 0.05);
    uArmL.rotation.z = -0.38;
    const uArmR = new THREE.Mesh(upperArmGeo, marbleMat);
    uArmR.position.set(0.98, 7.9, 0.05);
    uArmR.rotation.z = 0.38;

    const foreArmGeo = new THREE.CylinderGeometry(0.17, 0.15, 0.85, 8);
    const fArmL = new THREE.Mesh(foreArmGeo, marbleMat);
    fArmL.position.set(-0.82, 7.45, 0.36);
    fArmL.rotation.z = 1.15;
    fArmL.rotation.x = 0.35;
    const fArmR = new THREE.Mesh(foreArmGeo, marbleMat);
    fArmR.position.set(0.82, 7.45, 0.36);
    fArmR.rotation.z = -1.15;
    fArmR.rotation.x = 0.35;

    const handGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const handL = new THREE.Mesh(handGeo, marbleMat);
    handL.position.set(-0.42, 7.42, 0.48);
    const handR = handL.clone();
    handR.position.x = 0.42;

    // 4. Chunky Gold Chain Hanging Over the White Shirt/Vest
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.065, 8, 16, Math.PI), this.mat.gold);
    chain.rotation.z = Math.PI;
    chain.position.set(0, 8.36, 0.41);

    // 5. White Marble LION HEAD + Sculpted Mane + Black Nose + Black Sunglasses!
    const lionHead = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 12), marbleMat);
    lionHead.position.set(0, 9.18, 0.08);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.38), marbleMat);
    snout.position.set(0, 9.04, 0.56);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.12), this.mat.sunglasses);
    nose.position.set(0, 9.16, 0.74);

    const maneGroup = new THREE.Group();
    maneGroup.position.set(0, 9.18, -0.02);
    const maneTuftGeo = new THREE.DodecahedronGeometry(0.38, 0);
    for (let m = 0; m < 10; m++) {
      const ang = (m / 10) * Math.PI * 2;
      const tuft = new THREE.Mesh(maneTuftGeo, marbleMat);
      tuft.position.set(Math.cos(ang) * 0.62, Math.sin(ang) * 0.65, -0.08);
      tuft.scale.set(1.05, 1.15, 0.9);
      maneGroup.add(tuft);
    }
    const maneBack = new THREE.Mesh(new THREE.SphereGeometry(0.76, 10, 10), marbleMat);
    maneBack.position.set(0, 0.02, -0.22);
    maneGroup.add(maneBack);

    const earGeo = new THREE.SphereGeometry(0.16, 6, 6);
    const earL = new THREE.Mesh(earGeo, marbleMat);
    earL.position.set(-0.46, 9.72, 0.04);
    const earR = earL.clone();
    earR.position.x = 0.46;

    const lensGeo = new THREE.BoxGeometry(0.36, 0.22, 0.12);
    const lensL = new THREE.Mesh(lensGeo, this.mat.sunglasses);
    lensL.position.set(-0.24, 9.3, 0.58);
    const lensR = lensL.clone();
    lensR.position.x = 0.24;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.12), this.mat.sunglasses);
    bridge.position.set(0, 9.34, 0.59);

    lionStatue.add(
      shoeL, shoeR, legL, legR, hips, vest, jacketBack, jacketL, jacketR,
      lapelL, lapelR, shoulders, uArmL, uArmR, fArmL, fArmR, handL, handR,
      chain, lionHead, snout, nose, maneGroup, earL, earR, lensL, lensR, bridge
    );
    g.add(lionStatue);

    // Glowing Spotlight Crown Aura at Night
    const aura = new THREE.Mesh(new THREE.RingGeometry(1.38, 1.65, 18), this.mat.lampBulbNight);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 4.32;
    this.lampBulbs.push(aura);

    // Animated Water Fountain Jets arcing into the blue pool!
    this.fountainJets = [];
    const dropGeo = new THREE.SphereGeometry(0.14, 5, 5);
    for (let j = 0; j < 8; j++) {
      const ang = (j / 8) * Math.PI * 2;
      const drop = new THREE.Mesh(dropGeo, this.mat.wallWhite);
      g.add(drop);
      this.fountainJets.push({ mesh: drop, ang, phase: j * 0.45 });
    }

    // Colorful Flower Beds around the garden roundabout
    const flowerColors = [0xf43f5e, 0xfacc15, 0xa855f7, 0xf97316];
    for (let f = 0; f < 8; f++) {
      const ang = (f / 8) * Math.PI * 2 + 0.35;
      const flower = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.45, 0),
        this._getColorMat(flowerColors[f % flowerColors.length])
      );
      flower.position.set(Math.cos(ang) * 5.7, 0.45, Math.sin(ang) * 5.7);
      g.add(flower);
    }

    [[-6.4, -6.4], [6.4, -6.4], [-6.4, 6.4], [6.4, 6.4]].forEach(([lx, lz]) => {
      this._addStreetLamp(lx, lz);
    });

    const hitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(6.8, 6.8, 12.2, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = 6.1;
    hitbox.userData.plotId = "ST_JUNCTION";
    g.add(hitbox);
    this.plotHitboxes.push(hitbox);

    const sign = this._createNameSign("🦁 SHERU BHAI STATUE", "ST JUNCTION • TAP FOR 3D VIEW", true);
    sign.position.set(0, 12.2, 0);

    g.add(basePad, gardenRing, poolRim, water, step1, step2, goldCollar, statueBase, aura, sign);
    this.cityGroup.add(g);
  }

  /**
   * 🦁 LIVE ANIMATED SHERU BHAI LION CHARACTER (Rich Royal Clothes + Multiple Gold Chains + Sunglasses!)
   */
  _makeLiveSheruBhai(scale = 1.0, seated = false) {
    const sb = new THREE.Group();

    // Rich tailored trousers & polished gold-trimmed shoes (shortened if seated)
    if (!seated) {
      const legGeo = new THREE.BoxGeometry(0.24, 0.72, 0.24);
      const legL = new THREE.Mesh(legGeo, this.mat.charcoal);
      legL.position.set(-0.15, 0.38, 0);
      const legR = legL.clone();
      legR.position.x = 0.15;
      const shoeGeo = new THREE.BoxGeometry(0.26, 0.12, 0.38);
      const shoeL = new THREE.Mesh(shoeGeo, this.mat.richGoldTrim);
      shoeL.position.set(-0.15, 0.06, 0.06);
      const shoeR = shoeL.clone();
      shoeR.position.x = 0.15;
      sb.add(legL, legR, shoeL, shoeR);
    }

    const baseY = seated ? 0.15 : 0.74;

    // Rich Royal Crimson Velvet Suit Coat + White Silk Shirt + Gold Lapels & Buttons
    const coat = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.84, 0.42), this.mat.richVelvetRed);
    coat.position.set(0, baseY + 0.42, 0);
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.74, 0.44), this.mat.wallWhite);
    shirt.position.set(0, baseY + 0.44, 0.01);
    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.62, 0.06), this.mat.richGoldTrim);
    lapelL.position.set(-0.19, baseY + 0.5, 0.22);
    lapelL.rotation.z = -0.14;
    const lapelR = lapelL.clone();
    lapelR.position.x = 0.19;
    lapelR.rotation.z = 0.14;

    // Gold Belt Buckle
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.1, 0.45), this.mat.richGoldTrim);
    belt.position.set(0, baseY + 0.05, 0);

    // MULTIPLE CHUNKY GLITTERING GOLD CHAINS on his chest!
    const chain1 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.036, 6, 12, Math.PI), this.mat.richGoldTrim);
    chain1.rotation.z = Math.PI;
    chain1.position.set(0, baseY + 0.78, 0.24);
    const chain2 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.032, 6, 12, Math.PI), this.mat.richGoldTrim);
    chain2.rotation.z = Math.PI;
    chain2.position.set(0, baseY + 0.72, 0.25);
    const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), this.mat.diamondGlow);
    pendant.position.set(0, baseY + 0.48, 0.27);

    // Arms with gold cuffs
    const armGeo = new THREE.BoxGeometry(0.2, 0.68, 0.2);
    const armL = new THREE.Mesh(armGeo, this.mat.richVelvetRed);
    armL.position.set(-0.48, baseY + 0.44, seated ? 0.18 : 0);
    if (seated) armL.rotation.x = -0.9;
    const armR = armL.clone();
    armR.position.x = 0.48;
    const cuffGeo = new THREE.BoxGeometry(0.22, 0.09, 0.22);
    const cuffL = new THREE.Mesh(cuffGeo, this.mat.richGoldTrim);
    cuffL.position.set(-0.48, baseY + 0.14, seated ? 0.34 : 0);
    const cuffR = cuffL.clone();
    cuffR.position.x = 0.48;

    // Sculpted Royal Lion Head + Full Mane + Black Sunglasses + Mini Gold Crown Pin!
    const headY = baseY + 1.12;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), this.mat.lionFurGold);
    head.position.set(0, headY, 0.05);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.22), this.mat.lionFurGold);
    snout.position.set(0, headY - 0.08, 0.32);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.08), this.mat.sunglasses);
    nose.position.set(0, headY - 0.02, 0.42);

    // Rich Lion Mane Ring
    const maneGeo = new THREE.DodecahedronGeometry(0.21, 0);
    for (let m = 0; m < 8; m++) {
      const ang = (m / 8) * Math.PI * 2;
      const tuft = new THREE.Mesh(maneGeo, this.mat.lionManeRich);
      tuft.position.set(Math.cos(ang) * 0.34, headY + Math.sin(ang) * 0.34, -0.05);
      sb.add(tuft);
    }
    const maneBack = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), this.mat.lionManeRich);
    maneBack.position.set(0, headY, -0.14);

    // Cool Black Sunglasses
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.1), this.mat.sunglasses);
    shades.position.set(0, headY + 0.06, 0.34);

    sb.add(coat, shirt, lapelL, lapelR, belt, chain1, chain2, pendant, armL, armR, cuffL, cuffR, head, snout, nose, maneBack, shades);
    sb.scale.setScalar(scale);
    return sb;
  }

  /**
   * 💎 SPARKLING DIAMOND VIP SUPERCAR (Sheru Bhai's Arrival Car!)
   */
  _makeDiamondCarMesh() {
    const car = new THREE.Group();

    // 4 Luxury Wheels with Gold Alloy Rims
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10);
    const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.24, 8);
    [[-0.86, 1.3], [0.86, 1.3], [-0.86, -1.25], [0.86, -1.25]].forEach(([wx, wz]) => {
      const tire = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wx, 0.32, wz);
      const rim = new THREE.Mesh(rimGeo, this.mat.richGoldTrim);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, 0.32, wz);
      car.add(tire, rim);
    });

    // Faceted Sparkling Diamond Supercar Body (low-slung luxury coupe)
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.56, 4.15), this.mat.diamondCrystal);
    lowerBody.position.set(0, 0.56, 0);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.24, 1.45), this.mat.diamondAccent);
    hood.position.set(0, 0.88, 1.25);
    hood.rotation.x = 0.08;

    const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.28, 1.1), this.mat.diamondAccent);
    rearDeck.position.set(0, 0.9, -1.35);

    // Crystal Hood Ornament Diamond + Gold Front Grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.32, 0.12), this.mat.richGoldTrim);
    grille.position.set(0, 0.54, 2.08);
    const hoodGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), this.mat.diamondGlow);
    hoodGem.position.set(0, 1.12, 1.9);

    // Open-View Glass Cabin so Sheru Bhai Lion is clearly visible sitting inside!
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.12, 1.55), this.mat.diamondCrystal);
    roof.position.set(0, 1.58, -0.15);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.62, 0.08), this.mat.heliGlass);
    windshield.position.set(0, 1.24, 0.62);
    windshield.rotation.x = -0.35;
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.56, 0.08), this.mat.heliGlass);
    rearGlass.position.set(0, 1.24, -0.92);
    rearGlass.rotation.x = 0.32;
    [[-0.68, 0.52], [0.68, 0.52], [-0.68, -0.85], [0.68, -0.85]].forEach(([px, pz]) => {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.08), this.mat.richGoldTrim);
      pil.position.set(px, 1.22, pz);
      car.add(pil);
    });

    // Rear Diamond Spoiler + Sparkling Neon Underglow
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.32), this.mat.diamondAccent);
    spoiler.position.set(0, 1.26, -1.9);
    const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 4.4), this.mat.diamondGlow);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.set(0, 0.07, 0);

    // Headlights & Taillights
    const hlGeo = new THREE.BoxGeometry(0.36, 0.14, 0.08);
    const hlL = new THREE.Mesh(hlGeo, this.mat.diamondGlow);
    hlL.position.set(-0.62, 0.66, 2.09);
    const hlR = hlL.clone();
    hlR.position.x = 0.62;
    const tlL = new THREE.Mesh(hlGeo, this.mat.taillight);
    tlL.position.set(-0.62, 0.68, -2.09);
    const tlR = tlL.clone();
    tlR.position.x = 0.62;

    // Seated Sheru Bhai inside Diamond Car (toggled visible when driving!)
    const seatedSheru = this._makeLiveSheruBhai(0.68, true);
    seatedSheru.position.set(-0.22, 0.56, -0.05);
    car.userData.seatedSheru = seatedSheru;

    // Night road beam
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.5), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.09, 4.35);
    beam.visible = this.timeOfDay === "night";
    car.userData.nightBeam = beam;

    car.add(lowerBody, hood, rearDeck, grille, hoodGem, roof, windshield, rearGlass, spoiler, underglow, hlL, hlR, tlL, tlR, seatedSheru, beam);
    return car;
  }

  /**
   * 🚁💎 SPARKLING DIAMOND VIP HELICOPTER (Sheru Bhai's City Tour Helicopter!)
   */
  _makeDiamondHeliMesh() {
    const heli = new THREE.Group();

    // Gold Landing Skids + Struts
    const skidGeo = new THREE.CylinderGeometry(0.09, 0.09, 4.4, 6);
    skidGeo.rotateX(Math.PI / 2);
    const skidL = new THREE.Mesh(skidGeo, this.mat.richGoldTrim);
    skidL.position.set(-1.15, 0.12, 0.1);
    const skidR = skidL.clone();
    skidR.position.x = 1.15;
    const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.85, 5);
    [[-1.0, 0.9], [1.0, 0.9], [-1.0, -0.8], [1.0, -0.8]].forEach(([sx, sz]) => {
      const st = new THREE.Mesh(strutGeo, this.mat.richGoldTrim);
      st.position.set(sx, 0.52, sz);
      st.rotation.z = sx < 0 ? -0.25 : 0.25;
      heli.add(st);
    });

    // Faceted Sparkling Diamond Fuselage Cabin + Crystal Nose
    const cabinFloor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 3.6), this.mat.diamondCrystal);
    cabinFloor.position.set(0, 1.05, 0.1);
    const cabinBack = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.45, 1.9), this.mat.diamondCrystal);
    cabinBack.position.set(0, 1.85, -0.75);
    const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.34, 3.3), this.mat.diamondAccent);
    cabinRoof.position.set(0, 2.58, 0.05);

    // Nose Cone (faceted diamond crystal!)
    const noseCone = new THREE.Mesh(new THREE.OctahedronGeometry(1.12, 0), this.mat.diamondAccent);
    noseCone.scale.set(0.95, 0.72, 1.25);
    noseCone.position.set(0, 1.45, 1.95);

    // Clear Cyan Cockpit Canopy (so Sheru Bhai is visible flying inside!)
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.98, 1.12, 1.65), this.mat.heliGlass);
    canopy.position.set(0, 1.84, 1.05);

    // Gold Trim Stripes along fuselage
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 3.4), this.mat.richGoldTrim);
    stripeL.position.set(-1.06, 1.25, 0.1);
    const stripeR = stripeL.clone();
    stripeR.position.x = 1.06;

    // Tapered Diamond Tail Boom + Vertical Fin + Stabilizers
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.52, 4.4, 6), this.mat.diamondCrystal);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.position.set(0, 1.85, -3.55);

    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.65, 0.95), this.mat.diamondAccent);
    tailFin.position.set(0, 2.45, -5.45);
    tailFin.rotation.x = -0.25;

    const hStab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.55), this.mat.richGoldTrim);
    hStab.position.set(0, 1.85, -4.6);

    // Main Rotor Mast + 4-Blade Spinning Main Rotor (stored on userData for animation!)
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.65, 8), this.mat.richGoldTrim);
    mast.position.set(0, 2.95, -0.15);

    const mainRotor = new THREE.Group();
    mainRotor.position.set(0, 3.28, -0.15);
    const hub = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), this.mat.diamondGlow);
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.06, 0.34), this.mat.rotorBlade);
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 7.8), this.mat.rotorBlade);
    const tip1 = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.07, 0.14), this.mat.diamondGlow);
    mainRotor.add(hub, blade1, blade2, tip1);
    heli.userData.mainRotor = mainRotor;

    // Spinning Tail Rotor
    const tailRotor = new THREE.Group();
    tailRotor.position.set(0.22, 2.55, -5.55);
    const tb1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.45, 0.14), this.mat.richGoldTrim);
    const tb2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 1.45), this.mat.richGoldTrim);
    tailRotor.add(tb1, tb2);
    heli.userData.tailRotor = tailRotor;

    // Navigation Lights (Red Left, Green Right) + Spotlight
    const navL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), this.mat.beaconRed);
    navL.position.set(-1.12, 1.45, 0.8);
    const navR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), this.mat.beaconGreen);
    navR.position.set(1.12, 1.45, 0.8);

    // Seated Sheru Bhai inside Diamond Helicopter Cockpit!
    const seatedSheru = this._makeLiveSheruBhai(0.86, true);
    seatedSheru.position.set(0, 1.25, 0.95);
    seatedSheru.visible = false;
    heli.userData.seatedSheru = seatedSheru;

    heli.add(
      skidL, skidR, cabinFloor, cabinBack, cabinRoof, noseCone, canopy,
      stripeL, stripeR, tailBoom, tailFin, hStab, mast, mainRotor, tailRotor, navL, navR, seatedSheru
    );
    return heli;
  }

  /**
   * ✈️ REALISTIC 3D COMMERCIAL PASSENGER AIRPLANE
   */
  _makeCommercialPlaneMesh() {
    const plane = new THREE.Group();

    // Long Cylindrical White Fuselage + Rounded Nose + Tapered Tail
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 11.4, 12), this.mat.planeWhite);
    fuse.rotation.x = Math.PI / 2;
    fuse.position.set(0, 2.35, 0);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(1.18, 12, 10), this.mat.planeWhite);
    nose.scale.set(1, 0.92, 1.85);
    nose.position.set(0, 2.3, 5.6);

    const tailCone = new THREE.Mesh(new THREE.ConeGeometry(1.18, 3.6, 12), this.mat.planeWhite);
    tailCone.rotation.x = -Math.PI / 2;
    tailCone.position.set(0, 2.45, -7.4);

    // Blue & Gold Airline Livery Belly Stripe + Cockpit Windshield
    const livery = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.36, 10.8), this.mat.planeBlue);
    livery.position.set(0, 2.02, -0.1);
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.48, 1.05), this.mat.busWindshield);
    cockpit.position.set(0, 2.75, 5.75);

    // Passenger Cabin Windows Strip on Both Sides
    const winStripGeo = new THREE.BoxGeometry(0.08, 0.28, 8.6);
    const winL = new THREE.Mesh(winStripGeo, this.mat.busWindshield);
    winL.position.set(-1.18, 2.6, 0.2);
    const winR = winL.clone();
    winR.position.x = 1.18;

    // Swept Main Wings + Wingtip Winglets + Dual Jet Engines
    const wingGeo = new THREE.BoxGeometry(6.8, 0.22, 2.5);
    const wingL = new THREE.Mesh(wingGeo, this.mat.planeWhite);
    wingL.position.set(-4.2, 2.0, 0.4);
    wingL.rotation.y = 0.24;
    const wingR = new THREE.Mesh(wingGeo, this.mat.planeWhite);
    wingR.position.set(4.2, 2.0, 0.4);
    wingR.rotation.y = -0.24;

    const engGeo = new THREE.CylinderGeometry(0.46, 0.42, 1.85, 10);
    engGeo.rotateX(Math.PI / 2);
    const engL = new THREE.Mesh(engGeo, this.mat.planeBlue);
    engL.position.set(-3.1, 1.45, 0.9);
    const engR = engL.clone();
    engR.position.x = 3.1;

    // Vertical Tail Fin (Blue + Gold Stripe) + Horizontal Tailplanes
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.4, 2.6), this.mat.planeBlue);
    tailFin.position.set(0, 4.45, -6.5);
    tailFin.rotation.x = -0.28;
    const finGold = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.55, 2.3), this.mat.richGoldTrim);
    finGold.position.set(0, 4.95, -6.6);
    finGold.rotation.x = -0.28;

    const hTail = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 1.45), this.mat.planeWhite);
    hTail.position.set(0, 2.65, -7.1);

    // Landing Gear Wheels (Front + 2 Main Rear)
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 8);
    wheelGeo.rotateZ(Math.PI / 2);
    const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6);
    [[0, 4.6], [-1.75, -0.4], [1.75, -0.4]].forEach(([gx, gz]) => {
      const st = new THREE.Mesh(strutGeo, this.mat.charcoal);
      st.position.set(gx, 0.85, gz);
      const wh = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
      wh.position.set(gx, 0.32, gz);
      plane.add(st, wh);
    });

    // Wingtip Navigation Lights
    const navL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), this.mat.beaconRed);
    navL.position.set(-7.5, 2.15, -0.4);
    const navR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), this.mat.beaconGreen);
    navR.position.set(7.5, 2.15, -0.4);

    plane.add(fuse, nose, tailCone, livery, cockpit, winL, winR, wingL, wingR, engL, engR, tailFin, finGold, hTail, navL, navR);
    return plane;
  }

  /**
   * ✈️ 20-ACRE INTERNATIONAL AIRPORT OUTSIDE THE CITY (East of Outer Ring Road)
   * Includes:
   * - Dedicated VIP Airport Express Highway + Entrance Arch
   * - Grand Terminal, ATC Control Tower (rotating radar + blinking beacon), 88-unit Runway & Taxiways
   * - Live Airport Shuttle Bus driving passengers to the Airplane -> Passengers climb stairs into Plane -> Plane takes off & circles the ENTIRE CITY -> Lands back!
   * - Live VIP Sheru Bhai (Lion in rich clothes + gold chains) arriving in his Sparkling Diamond Car inside the Airport right next to the VIP Helipad -> Walking into his Sparkling Diamond Helicopter -> Flying around the ENTIRE CITY!
   */
  _buildInternationalAirport(ringRadius) {
    const ax = ringRadius + 62;
    this.airportX = ax;

    const ap = new THREE.Group();
    ap.position.set(ax, 0, 0);

    const nightGlowMeshes = [];

    // 1. Airport Express Highway connecting East Outer Ring Road -> Inside Airport VIP Gate (at z = 18)
    const hwyLen = 28;
    const expressHwy = new THREE.Mesh(new THREE.BoxGeometry(hwyLen, 0.1, 7.6), this.mat.highway);
    expressHwy.position.set(-48, 0.02, 18);
    const hwyStripe = new THREE.Mesh(new THREE.PlaneGeometry(hwyLen - 2, 0.25), this.mat.petrolYellow);
    hwyStripe.rotation.x = -Math.PI / 2;
    hwyStripe.position.set(-48, 0.09, 18);
    ap.add(expressHwy, hwyStripe);

    // Airport Highway Entrance Gate Arch
    const archPillarGeo = new THREE.BoxGeometry(0.85, 6.2, 0.85);
    const apP1 = new THREE.Mesh(archPillarGeo, this.mat.wallWhite);
    apP1.position.set(-44.5, 3.1, 13.6);
    const apP2 = apP1.clone();
    apP2.position.z = 22.4;
    const apBeam = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 10.2), this.mat.navy);
    apBeam.position.set(-44.5, 6.0, 18);
    const gateBoardF = this._makeBuildingBoard("SHERU BHAI AIRPORT", "20 ACRES • VIP GATE", "#0f172a", "#38bdf8", 9.2, 1.35);
    gateBoardF.rotation.y = -Math.PI / 2;
    gateBoardF.position.set(-45.08, 6.0, 18);
    const gateBoardB = gateBoardF.clone();
    gateBoardB.rotation.y = Math.PI / 2;
    gateBoardB.position.x = -43.92;
    ap.add(apP1, apP2, apBeam, gateBoardF, gateBoardB);

    // 2. Massive 20-Acre Airport Tarmac Apron (88 x 96 units!) & Perimeter Fence
    const turfPad = new THREE.Mesh(new THREE.BoxGeometry(88, 0.06, 96), this.mat.turf);
    turfPad.position.set(0, 0.01, 0);

    const tarmac = new THREE.Mesh(new THREE.BoxGeometry(52, 0.1, 86), this.mat.tarmacGrey);
    tarmac.position.set(-14, 0.04, 0);

    // Perimeter Boundary Fence (leaving gate open on West at z = 13..23)
    const fN = new THREE.Mesh(new THREE.BoxGeometry(88, 1.4, 0.3), this.mat.concrete);
    fN.position.set(0, 0.7, -48);
    const fS = fN.clone();
    fS.position.z = 48;
    const fE = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 96), this.mat.concrete);
    fE.position.set(44, 0.7, 0);
    const fWN = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 61), this.mat.concrete);
    fWN.position.set(-44, 0.7, -17.5);
    const fWS = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 25), this.mat.concrete);
    fWS.position.set(-44, 0.7, 35.5);
    ap.add(turfPad, tarmac, fN, fS, fE, fWN, fWS);

    // 3. Long International Runway (88 units long along East side, x = +24)
    const runway = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.12, 88), this.mat.runwayAsphalt);
    runway.position.set(24, 0.06, 0);
    ap.add(runway);

    // Runway Centerline Dashes & Threshold Piano Keys (Instanced or batched clean meshes)
    const dashGeo = new THREE.PlaneGeometry(0.45, 3.6);
    dashGeo.rotateX(-Math.PI / 2);
    for (let rz = -36; rz <= 36; rz += 7.2) {
      const dash = new THREE.Mesh(dashGeo, this.mat.stripe);
      dash.position.set(24, 0.14, rz);
      ap.add(dash);
    }
    const keyGeo = new THREE.PlaneGeometry(0.75, 4.2);
    keyGeo.rotateX(-Math.PI / 2);
    [-41, 41].forEach((kz) => {
      for (let kx = 18.5; kx <= 29.5; kx += 1.8) {
        const key = new THREE.Mesh(keyGeo, this.mat.stripe);
        key.position.set(kx, 0.14, kz);
        ap.add(key);
      }
    });

    // Taxiway Connectors from Tarmac to Runway (South Takeoff & North Exit)
    const taxiGeo = new THREE.BoxGeometry(20, 0.11, 7.5);
    const taxiS = new THREE.Mesh(taxiGeo, this.mat.runwayAsphalt);
    taxiS.position.set(10, 0.055, 34);
    const taxiN = taxiS.clone();
    taxiN.position.z = -34;
    ap.add(taxiS, taxiN);

    // Glowing Runway Edge Lights (Light up blue/amber at night!)
    const rLightGeo = new THREE.SphereGeometry(0.24, 5, 5);
    for (let lz = -40; lz <= 40; lz += 10) {
      [16.2, 31.8].forEach((lx) => {
        const bulb = new THREE.Mesh(rLightGeo, this.mat.runwayBlueLight);
        bulb.position.set(lx, 0.35, lz);
        bulb.visible = this.timeOfDay === "night";
        ap.add(bulb);
        nightGlowMeshes.push(bulb);
      });
    }

    // 4. Grand Modern International Terminal Building (West-North Side)
    const termMain = new THREE.Mesh(new THREE.BoxGeometry(15, 7.2, 32), this.mat.wallWhite);
    termMain.position.set(-30, 3.65, -14);
    const termGlass = new THREE.Mesh(new THREE.BoxGeometry(15.3, 4.6, 28), this.mat.glass);
    termGlass.position.set(-30, 3.8, -14);
    const termRoof = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.8, 35), this.mat.navy);
    termRoof.position.set(-29, 7.6, -14);
    const termTrim = new THREE.Mesh(new THREE.BoxGeometry(18.7, 0.32, 35.2), this.mat.richGoldTrim);
    termTrim.position.set(-29, 7.15, -14);

    // Terminal Facade Signboards (both tarmac-facing & city-facing)
    const termBoardE = this._makeBuildingBoard("SHERU BHAI AIRPORT", "INTERNATIONAL TERMINAL • 20 ACRES", "#0f172a", "#facc15", 16.0, 2.1);
    termBoardE.rotation.y = Math.PI / 2;
    termBoardE.position.set(-22.2, 6.2, -14);
    const termBoardW = termBoardE.clone();
    termBoardW.rotation.y = -Math.PI / 2;
    termBoardW.position.x = -37.8;
    ap.add(termMain, termGlass, termRoof, termTrim, termBoardE, termBoardW);

    // 5. Air Traffic Control (ATC) Tower with Rotating Radar Dish & Blinking Red Beacon!
    const atcBase = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.2, 13.5, 8), this.mat.wallWhite);
    atcBase.position.set(-30, 6.8, -37);
    const atcDeck = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 2.8, 1.4, 8), this.mat.navy);
    atcDeck.position.set(-30, 14.1, -37);
    const atcGlass = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.0, 2.4, 8), this.mat.glass);
    atcGlass.position.set(-30, 16.0, -37);
    const atcCap = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.6, 0.65, 8), this.mat.wallWhite);
    atcCap.position.set(-30, 17.5, -37);

    const radarGroup = new THREE.Group();
    radarGroup.position.set(-30, 18.6, -37);
    const radarPost = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.4, 6), this.mat.charcoal);
    const radarBar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.25), this.mat.richGoldTrim);
    radarBar.position.y = 0.65;
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 6), this.mat.beaconRed);
    beacon.position.y = 1.25;
    radarGroup.add(radarPost, radarBar, beacon);
    ap.add(atcBase, atcDeck, atcGlass, atcCap, radarGroup);

    // 6. Mobile Passenger Boarding Stairs beside Commercial Plane Bay (-2, -12)
    const stairs = new THREE.Group();
    stairs.position.set(-6.0, 0.1, -9.8);
    for (let st = 0; st < 6; st++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 1.35), this.mat.wallWhite);
      step.position.set(st * 0.48, 0.2 + st * 0.34, 0);
      stairs.add(step);
    }
    const stairRail = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.12, 1.42), this.mat.planeBlue);
    stairRail.position.set(1.2, 1.55, 0);
    stairRail.rotation.z = 0.62;
    ap.add(stairs, stairRail);

    // 7. Commercial Airplane + Airport Shuttle Bus + 6 Live Boarding Passengers!
    const plane = this._makeCommercialPlaneMesh();
    plane.rotation.order = "YXZ";
    ap.add(plane);

    const shuttleBus = this._makeRealBusMesh(0x0284c7, false);
    ap.add(shuttleBus);

    const planePassengers = [
      this.mat.wallCoral, this.mat.wallGold, this.mat.wallMint,
      this.mat.wallBlue, this.mat.richVelvetRed, this.mat.khakiUniform
    ].map((sm) => {
      const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.95 });
      p.visible = false;
      ap.add(p);
      return p;
    });

    // 8. VIP SHERU BHAI HELIPAD & RED CARPET ZONE (Inside Airport South-West at x = -2, z = 24)
    const vipRoad = new THREE.Mesh(new THREE.BoxGeometry(30, 0.11, 6.2), this.mat.highway);
    vipRoad.position.set(-29, 0.055, 18);
    const vipDropBay = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 8), this.mat.runwayAsphalt);
    vipDropBay.position.set(-16, 0.06, 22);
    ap.add(vipRoad, vipDropBay);

    // Red VIP Carpet from Diamond Car Drop-Off straight onto Diamond Helipad!
    const redCarpet = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.15, 2.2), this.mat.vipCarpet);
    redCarpet.position.set(-10.5, 0.09, 23.2);
    redCarpet.rotation.y = -0.14;
    ap.add(redCarpet);

    // Circular VIP Helipad with Glowing Diamond Cyan Ring & Bold Gold "H"
    const helipad = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.5, 0.18, 24), this.mat.runwayAsphalt);
    helipad.position.set(-1, 0.09, 24);
    const heliRing = new THREE.Mesh(new THREE.RingGeometry(6.1, 6.8, 24), this.mat.diamondGlow);
    heliRing.rotation.x = -Math.PI / 2;
    heliRing.position.set(-1, 0.2, 24);
    const hLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 5.2), this.mat.richGoldTrim);
    hLeft.rotation.x = -Math.PI / 2;
    hLeft.position.set(-2.6, 0.21, 24);
    const hRight = hLeft.clone();
    hRight.position.x = 0.6;
    const hMid = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.85), this.mat.richGoldTrim);
    hMid.rotation.x = -Math.PI / 2;
    hMid.position.set(-1, 0.21, 24);

    // VIP Helipad Signboard
    const vipSign = this._makeBuildingBoard("SHERU BHAI VIP PAD", "DIAMOND HELICOPTER", "#0f172a", "#67e8f9", 7.2, 1.15);
    vipSign.position.set(-1, 2.6, 32.5);
    const vp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.6, 6), this.mat.richGoldTrim);
    vp1.position.set(-4.2, 1.3, 32.5);
    const vp2 = vp1.clone();
    vp2.position.x = 2.2;
    ap.add(helipad, heliRing, hLeft, hRight, hMid, vipSign, vp1, vp2);

    // 9. LIVE VIP SHERU BHAI + SPARKLING DIAMOND CAR + SPARKLING DIAMOND HELICOPTER!
    const diamondCar = this._makeDiamondCarMesh();
    ap.add(diamondCar);
    if (diamondCar.userData.nightBeam) {
      nightGlowMeshes.push(diamondCar.userData.nightBeam);
    }

    const walkingSheru = this._makeLiveSheruBhai(1.08, false);
    walkingSheru.visible = false;
    ap.add(walkingSheru);

    const diamondHeli = this._makeDiamondHeliMesh();
    diamondHeli.rotation.order = "YXZ";
    ap.add(diamondHeli);

    // 9b. 🏡 AIRPORT-SIDE FOLLOWER VIP HOUSE & LUSH GARDEN (Right beside Airport Highway!)
    const ahGroup = new THREE.Group();
    ahGroup.position.set(-48, 0.08, 30);
    const ahBase = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.2, 8.2), this.mat.turf);
    ahBase.position.y = 0.06;
    const ahPlinth = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.36, 5.2), this.mat.plinthGrey);
    ahPlinth.position.set(0, 0.28, 0);
    const ahBody = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.2, 4.8), this.mat.stuccoIvory);
    ahBody.position.set(0, 2.0, 0);
    const ahRoof = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.34, 5.4), this.mat.slateTrim);
    ahRoof.position.set(0, 3.75, 0);
    const ahDoor = new THREE.Mesh(this.geo.door, this.mat.teakWood);
    ahDoor.position.set(0, 1.15, -2.42);
    const ahWinL = new THREE.Mesh(this.geo.win, this.mat.windowDay);
    ahWinL.position.set(-1.55, 1.85, -2.42);
    const ahWinR = ahWinL.clone();
    ahWinR.position.x = 1.55;
    // Lush greenery around the Airport-Side House
    [[-3.2, -3.2], [3.2, -3.2], [-3.2, 3.2], [3.2, 3.2]].forEach(([gx, gz]) => {
      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 0), this.mat.treeLeaf);
      bush.position.set(gx, 0.65, gz);
      ahGroup.add(bush);
    });
    const ahOwnerClean = (this.airportHouseOwner || "@urs_bazigar").trim();
    const ahSign = this._createNameSign(`🏡 ${ahOwnerClean}`, "✈️ AIRPORT-SIDE VIP HOUSE", false);
    ahSign.position.set(0, 5.8, 0);
    ahGroup.add(ahBase, ahPlinth, ahBody, ahRoof, ahDoor, ahWinL, ahWinR, ahSign);
    ap.add(ahGroup);

    // 10. Floating Big Airport Sign + Clickable Hitbox
    const apSign = this._createNameSign("✈️ SHERU BHAI INTL AIRPORT", "20 ACRES • LIVE FLIGHTS & DIAMOND HELI", true);
    apSign.position.set(-12, 23.5, -14);
    ap.add(apSign);

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(88, 18, 96),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(0, 9, 0);
    hitbox.userData.plotId = "AIRPORT";
    ap.add(hitbox);
    this.plotHitboxes.push(hitbox);

    this.cityGroup.add(ap);

    // Precompute scenic aerial flight paths (in Airport local coordinates) circling the ENTIRE CITY!
    const cityOrbitR = Math.max(ringRadius + 8, 52);
    const planeCityLoop = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(24, 20, -48),
        new THREE.Vector3(10 - ax, 40, -cityOrbitR),
        new THREE.Vector3(-cityOrbitR - ax, 44, -cityOrbitR * 0.45),
        new THREE.Vector3(-cityOrbitR - ax, 44, cityOrbitR * 0.55),
        new THREE.Vector3(-ax, 42, cityOrbitR),
        new THREE.Vector3(24, 24, 58)
      ],
      false,
      "catmullrom",
      0.45
    );

    const heliCityLoop = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-1, 20, 24),
        new THREE.Vector3(-ax * 0.45, 25, 16),
        new THREE.Vector3(-ax + 12, 22, 12),            // Swoops right past Sheru Bhai Statue at ST Junction!
        new THREE.Vector3(-ax - cityOrbitR * 0.65, 26, -cityOrbitR * 0.5),
        new THREE.Vector3(-ax, 27, -cityOrbitR * 0.8),
        new THREE.Vector3(-ax + cityOrbitR * 0.65, 25, -cityOrbitR * 0.45),
        new THREE.Vector3(-1, 20, 24)
      ],
      false,
      "catmullrom",
      0.45
    );

    this.airportSim = {
      ax,
      radarGroup,
      beacon,
      plane,
      shuttleBus,
      planePassengers,
      planeCityLoop,
      diamondCar,
      walkingSheru,
      diamondHeli,
      heliCityLoop,
      nightGlowMeshes
    };
  }


  /**
   * 🏖️ GOLDEN SAND SHERU BHAI BEACH + LUXURY FOLLOWER BEACH HOUSE (West Coast Outside City!)
   * Features:
   * - Beach Boulevard Road connecting West Outer Ring Road -> Palm-lined Beachfront
   * - Golden Sand Beach + Wet Shoreline + Deep Turquoise Ocean + Animated Rolling White Sea Foam Waves
   * - Wooden Ocean Pier / Jetty with glowing night lamps
   * - 🦁 SHERU BHAI CHILLING ON THE BEACH: Sculpted Lion in sunglasses, gold chain & rich tropical outfit
   *   relaxing on a VIP wooden sun-lounger under a beach umbrella with a chilled coconut drink!
   * - 🏡 LUXURY FOLLOWER BEACH HOUSE: Modern coastal white-and-teak villa right on the sand with
   *   customizable Follower @username mounted signboard + floating sign!
   */
  _buildSheruBhaiBeach(ringRadius) {
    const bx = -(ringRadius + 58);
    this.beachX = bx;

    const bg = new THREE.Group();
    bg.position.set(bx, 0, 0);

    // 1. Beach Boulevard Connector Road from West Outer Ring Road (East side of beach group: x = +48 -> +24)
    const roadLen = 30;
    const beachRoad = new THREE.Mesh(new THREE.BoxGeometry(roadLen, 0.1, 7.2), this.mat.road);
    beachRoad.position.set(42, 0.02, 0);
    const roadDash = new THREE.Mesh(new THREE.PlaneGeometry(roadLen - 2, 0.25), this.mat.stripe);
    roadDash.rotation.x = -Math.PI / 2;
    roadDash.position.set(42, 0.08, 0);
    bg.add(beachRoad, roadDash);

    // Coastal Entrance Arch ("SHERU BHAI BEACH")
    const apGeo = new THREE.BoxGeometry(0.75, 5.6, 0.75);
    const p1 = new THREE.Mesh(apGeo, this.mat.teakWood);
    p1.position.set(34, 2.8, -4.4);
    const p2 = p1.clone();
    p2.position.z = 4.4;
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.45, 9.8), this.mat.oceanDeep);
    archTop.position.set(34, 5.4, 0);
    const bArchF = this._makeBuildingBoard("SHERU BHAI BEACH", "VIP OCEAN RESORT", "#0284c7", "#fde047", 8.8, 1.25);
    bArchF.rotation.y = Math.PI / 2;
    bArchF.position.set(34.5, 5.4, 0);
    const bArchB = bArchF.clone();
    bArchB.rotation.y = -Math.PI / 2;
    bArchB.position.x = 33.5;
    bg.add(p1, p2, archTop, bArchF, bArchB);

    // 2. Wide Golden Sand Beach + Wet Sand Shore + Turquoise Shallow & Deep Ocean!
    const drySand = new THREE.Mesh(new THREE.BoxGeometry(44, 0.14, 96), this.mat.beachSand);
    drySand.position.set(16, 0.04, 0);

    const wetSand = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.1, 96), this.mat.beachSandWet);
    wetSand.position.set(-7.5, 0.03, 0);

    const shallowSea = new THREE.Mesh(new THREE.BoxGeometry(16, 0.08, 110), this.mat.oceanShallow);
    shallowSea.position.set(-18, 0.01, 0);

    const deepSea = new THREE.Mesh(new THREE.BoxGeometry(58, 0.06, 130), this.mat.oceanDeep);
    deepSea.position.set(-54, 0.0, 0);

    bg.add(drySand, wetSand, shallowSea, deepSea);

    // Animated White Ocean Wave Foam Strips (3 rolling waves!)
    const waveStrips = [];
    const waveGeo = new THREE.PlaneGeometry(1.6, 94);
    waveGeo.rotateX(-Math.PI / 2);
    for (let w = 0; w < 3; w++) {
      const foam = new THREE.Mesh(waveGeo, this.mat.seaFoam);
      foam.position.set(-10 - w * 5.2, 0.1, 0);
      bg.add(foam);
      waveStrips.push({ mesh: foam, baseX: -10 - w * 5.2, phase: w * 2.1 });
    }

    // 3. Wooden Ocean Pier / Jetty extending out into the Turquoise Sea (at z = 22)
    const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(24, 0.25, 4.4), this.mat.teakWood);
    pierDeck.position.set(-16, 0.72, 22);
    for (let px = -26; px <= -6; px += 5) {
      [-1.8, 1.8].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.1, 6), this.mat.darkWood);
        post.position.set(px, 0.35, 22 + pz);
        bg.add(post);
      });
    }
    const pierLamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 6), this.mat.lampBulbDay);
    pierLamp.position.set(-27.2, 2.3, 22);
    const pierPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 5), this.mat.lampPole);
    pierPole.position.set(-27.2, 1.5, 22);
    this.lampBulbs.push(pierLamp);
    bg.add(pierDeck, pierPole, pierLamp);

    // 4. Beach Coconut Palm Trees along the Golden Sand
    const addBeachPalm = (px, pz, tilt = 0.14) => {
      const palm = new THREE.Group();
      palm.position.set(px, 0.1, pz);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 5.2, 6), this.mat.treeTrunk);
      trunk.position.y = 2.6;
      trunk.rotation.z = tilt;
      palm.add(trunk);
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.65), this.mat.treeLeaf);
        frond.position.set(Math.sin(tilt) * 2.4 + Math.cos(ang) * 1.1, 5.1, Math.sin(ang) * 1.1);
        frond.rotation.y = -ang;
        frond.rotation.z = -0.32;
        palm.add(frond);
      }
      bg.add(palm);
    };
    [[24, -36, 0.12], [18, -26, -0.15], [6, -30, 0.18], [4, 2, 0.14], [14, 28, -0.14], [24, 34, 0.12], [2, 34, 0.16]].forEach(
      ([px, pz, t]) => addBeachPalm(px, pz, t)
    );

    // 5. 🦁 SHERU BHAI CHILLING ON THE BEACH (VIP Lounger + Umbrella + Coconut Drink!) at (x = 4, z = 11)
    const chillZone = new THREE.Group();
    chillZone.position.set(4, 0.12, 11);

    // Luxury Wooden Beach Sun Lounger with White Cushion & Red Towel
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.24, 1.35), this.mat.teakWood);
    bedFrame.position.set(0, 0.36, 0);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.18, 1.2), this.mat.wallWhite);
    mattress.position.set(0, 0.54, 0);
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 1.18), this.mat.wallWhite);
    backrest.position.set(0.92, 0.92, 0);
    backrest.rotation.z = 0.62;
    const towel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.24), this.mat.tropicalShorts);
    towel.position.set(-0.35, 0.65, 0);
    chillZone.add(bedFrame, mattress, backrest, towel);

    // Giant Colorful Striped Beach Umbrella shading Sheru Bhai
    const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 3.6, 6), this.mat.richGoldTrim);
    uPole.position.set(0.8, 1.8, -1.25);
    const uCanopy = new THREE.Mesh(new THREE.ConeGeometry(2.6, 0.85, 8), this.mat.petrolRed);
    uCanopy.position.set(0.8, 3.55, -1.25);
    const uStripe = new THREE.Mesh(new THREE.ConeGeometry(2.64, 0.45, 8), this.mat.wallWhite);
    uStripe.position.set(0.8, 3.35, -1.25);
    chillZone.add(uPole, uCanopy, uStripe);

    // Gold Side Table + Fresh Green Coconut Drink with Straw!
    const sideTbl = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.62, 8), this.mat.richGoldTrim);
    sideTbl.position.set(0.2, 0.32, 1.25);
    const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), this.mat.turf);
    coconut.position.set(0.2, 0.78, 1.25);
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 4), this.mat.petrolYellow);
    straw.position.set(0.25, 1.02, 1.25);
    straw.rotation.z = -0.35;
    chillZone.add(sideTbl, coconut, straw);

    // Standing Surfboard planted in the sand nearby!
    const surf = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.8, 0.72), this.mat.studioCyan);
    surf.position.set(-2.2, 1.35, -2.5);
    surf.rotation.z = 0.22;
    surf.rotation.y = 0.4;
    chillZone.add(surf);

    // 🦁 SCULPTED CHILLING SHERU BHAI LION RECLINING ON THE LOUNGER (Sunglasses + Gold Chain + Beach Fit!)
    const chillingSheru = new THREE.Group();
    chillingSheru.position.set(0.25, 0.68, 0);

    // Relaxed stretched legs in colorful beach shorts
    const sLegGeo = new THREE.CylinderGeometry(0.17, 0.14, 1.25, 8);
    sLegGeo.rotateZ(Math.PI / 2);
    const sLegL = new THREE.Mesh(sLegGeo, this.mat.lionFurGold);
    sLegL.position.set(-0.78, 0.16, -0.22);
    const sLegR = sLegL.clone();
    sLegR.position.z = 0.22;
    const shorts = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.34, 0.76), this.mat.tropicalShorts);
    shorts.position.set(-0.18, 0.2, 0);

    // Reclining Torso in Royal Tropical Shirt + Chunky Gold Chain
    const sTorso = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.42, 0.78), this.mat.tropicalShirt);
    sTorso.position.set(0.42, 0.48, 0);
    sTorso.rotation.z = 0.56;
    const sChain = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 6, 12, Math.PI), this.mat.richGoldTrim);
    sChain.position.set(0.54, 0.68, 0);
    sChain.rotation.y = -Math.PI / 2;
    sChain.rotation.z = Math.PI;

    // Relaxed Lion Head + Full Mane + Cool Black Sunglasses facing the Ocean!
    const sHeadGroup = new THREE.Group();
    sHeadGroup.position.set(0.88, 0.98, 0);
    const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), this.mat.lionFurGold);
    const sSnout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.24), this.mat.lionFurGold);
    sSnout.position.set(-0.28, -0.06, 0);
    const sNose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.12), this.mat.sunglasses);
    sNose.position.set(-0.38, 0.0, 0);
    const sShades = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.52), this.mat.sunglasses);
    sShades.position.set(-0.32, 0.08, 0);
    const sManeGeo = new THREE.DodecahedronGeometry(0.22, 0);
    for (let m = 0; m < 8; m++) {
      const ang = (m / 8) * Math.PI * 2;
      const mt = new THREE.Mesh(sManeGeo, this.mat.lionManeRich);
      mt.position.set(0.08, Math.sin(ang) * 0.36, Math.cos(ang) * 0.36);
      sHeadGroup.add(mt);
    }
    sHeadGroup.add(sHead, sSnout, sNose, sShades);

    chillingSheru.add(sLegL, sLegR, shorts, sTorso, sChain, sHeadGroup);
    chillZone.add(chillingSheru);

    const chillSign = this._createNameSign("🦁 SHERU BHAI CHILLING", "VIP BEACH LOUNGE", false);
    chillSign.position.set(0.5, 4.9, 0);
    chillZone.add(chillSign);
    bg.add(chillZone);

    // Extra Beach Umbrella + Lounge Chairs down the sand
    const u2Pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 3.2, 5), this.mat.wallWhite);
    u2Pole.position.set(1, 1.6, -24);
    const u2Top = new THREE.Mesh(new THREE.ConeGeometry(2.2, 0.75, 8), this.mat.studioCyan);
    u2Top.position.set(1, 3.2, -24);
    bg.add(u2Pole, u2Top);

    // 6. 🏡 LUXURY FOLLOWER BEACH HOUSE VILLA RIGHT ON THE SAND (x = 16, z = -14)
    const villa = new THREE.Group();
    villa.position.set(16, 0.12, -14);

    // Raised Teak Deck + Infinity Plunge Pool facing the Ocean (-X)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.45, 13.5), this.mat.teakWood);
    deck.position.set(0, 0.24, 0);
    const pool = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.5, 7.6), this.mat.water);
    pool.position.set(-5.2, 0.25, 0);

    // Ground Floor White Stucco Villa + Huge Ocean-View Glass Doors
    const vFloor1 = new THREE.Mesh(new THREE.BoxGeometry(9.2, 3.6, 10.6), this.mat.wallWhite);
    vFloor1.position.set(2.0, 2.25, 0);
    const vGlass1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.7, 8.2), this.mat.glass);
    vGlass1.position.set(-2.62, 2.0, 0);
    const vTeakClad = new THREE.Mesh(new THREE.BoxGeometry(9.4, 3.6, 2.2), this.mat.teakWood);
    vTeakClad.position.set(2.0, 2.25, -4.4);

    // Second Floor Cantilevered Oceanfront Suite + Glass Balcony Railing + Pergola Roof
    const vSlab = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.35, 11.4), this.mat.wallWhite);
    vSlab.position.set(1.2, 4.15, 0);
    const vFloor2 = new THREE.Mesh(new THREE.BoxGeometry(8.2, 3.2, 8.8), this.mat.stuccoIvory);
    vFloor2.position.set(2.4, 5.9, -0.5);
    const vGlass2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.4, 7.2), this.mat.glass);
    vGlass2.position.set(-1.72, 5.85, -0.5);
    const vBalcRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 10.8), this.mat.glass);
    vBalcRail.position.set(-4.45, 4.8, 0);

    const vRoof = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.35, 10.4), this.mat.slateTrim);
    vRoof.position.set(1.8, 7.65, -0.5);

    // Personalized Mounted Beach House Signboard with Follower's @username!
    const cleanOwner = (this.beachOwner || "@follower_beach").trim();
    const villaBoardW = this._makeBuildingBoard(cleanOwner.toUpperCase(), "BEACH HOUSE VILLA", "#0f172a", "#38bdf8", 8.8, 1.4);
    villaBoardW.rotation.y = -Math.PI / 2;
    villaBoardW.position.set(-3.55, 7.65, -0.5);
    const villaBoardE = villaBoardW.clone();
    villaBoardE.rotation.y = Math.PI / 2;
    villaBoardE.position.x = 7.15;

    // Floating @username sign above Beach House Villa!
    const villaSign = this._createNameSign(`🏡 ${cleanOwner}`, "🏖️ BEACH HOUSE VILLA • SHERU BHAI BEACH", true);
    villaSign.position.set(1.5, 10.8, 0);

    villa.add(deck, pool, vFloor1, vGlass1, vTeakClad, vSlab, vFloor2, vGlass2, vBalcRail, vRoof, villaBoardW, villaBoardE, villaSign);
    bg.add(villa);

    // 7. Clickable Hitbox for the Entire Beach & Beach House
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(84, 14, 96),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(0, 7, 0);
    hitbox.userData.plotId = "BEACH";
    bg.add(hitbox);
    this.plotHitboxes.push(hitbox);

    this.cityGroup.add(bg);
    this.beachSim = {
      waveStrips,
      chillingHead: sHeadGroup
    };
  }


  /**
   * 🚂 REALISTIC INDIAN EXPRESS TRAIN (1 Blue/Yellow WAP-7 Electric Engine + 3 Blue ICF Passenger Coaches)
   */
  _makeTrainLocomotive(nightLights) {
    const loco = new THREE.Group();

    // Heavy Underframe & 4 Wheel Bogies
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.45, 5.6), this.mat.charcoal);
    chassis.position.set(0, 0.48, 0);
    const whGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.98, 8);
    whGeo.rotateZ(Math.PI / 2);
    [-2.0, -1.1, 1.1, 2.0].forEach((wz) => {
      const wh = new THREE.Mesh(whGeo, this.mat.wheelBlack);
      wh.position.set(0, 0.28, wz);
      loco.add(wh);
    });

    // Iconic Blue & Yellow Indian Railways WAP-7 Engine Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.55, 5.4), this.mat.trainBlue);
    body.position.set(0, 1.48, 0);
    const yellowBand = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.34, 5.44), this.mat.trainYellow);
    yellowBand.position.set(0, 1.15, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.24, 5.0), this.mat.trainRoof);
    roof.position.set(0, 2.36, 0);

    // Front Cab Windshield + Cattle Guard Cowcatcher
    const wind = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.56, 0.1), this.mat.busWindshield);
    wind.position.set(0, 1.78, 2.71);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.34, 0.45), this.mat.trainYellow);
    guard.position.set(0, 0.35, 2.9);

    // Rooftop Electric Pantograph Frame
    const panto1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.8), this.mat.charcoal);
    panto1.position.set(0, 2.85, -1.2);
    const pantoPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.6), this.mat.railSteel);
    pantoPost.position.set(0, 2.62, -1.2);

    // Powerful Locomotive Headlight + Night Beam!
    const hlBulb = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 8), this.mat.lampBulbNight);
    hlBulb.rotation.x = Math.PI / 2;
    hlBulb.position.set(0, 1.38, 2.72);
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 8.5), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.22, 7.0);
    beam.visible = this.timeOfDay === "night";
    nightLights.push(beam);

    loco.add(chassis, body, yellowBand, roof, wind, guard, panto1, pantoPost, hlBulb, beam);
    return loco;
  }

  _makeTrainCoach(trainWindows) {
    const coach = new THREE.Group();

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.4, 5.6), this.mat.charcoal);
    chassis.position.set(0, 0.46, 0);
    const whGeo = new THREE.CylinderGeometry(0.26, 0.26, 1.94, 8);
    whGeo.rotateZ(Math.PI / 2);
    [-2.0, -1.2, 1.2, 2.0].forEach((wz) => {
      const wh = new THREE.Mesh(whGeo, this.mat.wheelBlack);
      wh.position.set(0, 0.26, wz);
      coach.add(wh);
    });

    // Classic Blue ICF Express Coach + White Stripe + Grey Curved Roof
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.88, 1.48, 5.5), this.mat.trainDarkBlue);
    body.position.set(0, 1.42, 0);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.18, 5.52), this.mat.wallWhite);
    stripe.position.set(0, 1.02, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.22, 5.4), this.mat.trainRoof);
    roof.position.set(0, 2.26, 0);

    // 5 Passenger Windows on BOTH Sides (Glow warm yellow in Night Mode!)
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.busWindshield;
    const winGeo = new THREE.BoxGeometry(0.06, 0.48, 0.72);
    for (let wz = -1.9; wz <= 1.9; wz += 0.95) {
      const wL = new THREE.Mesh(winGeo, winMat);
      wL.position.set(-0.95, 1.56, wz);
      const wR = new THREE.Mesh(winGeo, winMat);
      wR.position.set(0.95, 1.56, wz);
      coach.add(wL, wR);
      trainWindows.push(wL, wR);
    }

    // Coach Door Cutouts at Ends
    const doorGeo = new THREE.BoxGeometry(0.07, 1.28, 0.48);
    [-2.42, 2.42].forEach((dz) => {
      const dL = new THREE.Mesh(doorGeo, this.mat.charcoal);
      dL.position.set(-0.95, 1.32, dz);
      const dR = dL.clone();
      dR.position.x = 0.95;
      coach.add(dL, dR);
    });

    coach.add(chassis, body, stripe, roof);
    return coach;
  }

  /**
   * 🚂 FULL CITY RAILWAY LOOP + MOUNTAIN TUNNEL AT END OF CITY + GRAND RAILWAY STATION
   * - Runs cleanly around the entire city outside the Outer Ring Road (railR = ringRadius + 12.2)
   * - Uses InstancedMesh for sleepers & rails (only 2 draw calls for the whole city loop!)
   * - Mountain Tunnel at South-West end of the city: Train emerges from the tunnel, circles the whole city,
   *   stops at the North Grand Railway Station while 6 passengers board INSIDE, then circles back into the tunnel!
   */
  _buildRailwaySystem(ringRadius) {
    const railR = ringRadius + 12.2;
    const cornerR = 11.0;
    const stationZ = -(railR + 6.8);
    this.railwayZ = stationZ;

    const rg = new THREE.Group();
    const nightLights = [];
    const trainWindows = [];

    // 1. Build Smooth Closed Rounded-Square Track Spline Around the Entire City
    //    t = 0.0 starts right at the Mountain Tunnel on the South-West end of the city!
    //    Direction: Clockwise (South-East -> North along East/Airport -> West along North/Station -> South along West/Beach -> back into Tunnel!)
    const pts = [];
    const inner = railR - cornerR;
    // South straight (from Tunnel at x = -inner*0.45 heading East toward SE corner)
    const tunnelX = -Math.min(inner * 0.48, 28);
    pts.push(new THREE.Vector3(tunnelX, 0.14, railR));
    pts.push(new THREE.Vector3(0, 0.14, railR));
    pts.push(new THREE.Vector3(inner, 0.14, railR));
    // SE rounded corner
    pts.push(new THREE.Vector3(railR - 2.2, 0.14, railR - 2.2));
    // East straight (runs right between Outer Ring Road and 20-Acre Airport!)
    pts.push(new THREE.Vector3(railR, 0.14, inner));
    pts.push(new THREE.Vector3(railR, 0.14, 0));
    pts.push(new THREE.Vector3(railR, 0.14, -inner));
    // NE rounded corner
    pts.push(new THREE.Vector3(railR - 2.2, 0.14, -railR + 2.2));
    // North straight (passes RIGHT THROUGH Grand Railway Station Platform 1 at x=0, z=-railR!)
    pts.push(new THREE.Vector3(inner, 0.14, -railR));
    pts.push(new THREE.Vector3(0, 0.14, -railR));
    pts.push(new THREE.Vector3(-inner, 0.14, -railR));
    // NW rounded corner
    pts.push(new THREE.Vector3(-railR + 2.2, 0.14, -railR + 2.2));
    // West straight (runs right between Outer Ring Road and Sheru Bhai Golden Beach!)
    pts.push(new THREE.Vector3(-railR, 0.14, -inner));
    pts.push(new THREE.Vector3(-railR, 0.14, 0));
    pts.push(new THREE.Vector3(-railR, 0.14, inner));
    // SW rounded corner leading straight back into the Mountain Tunnel!
    pts.push(new THREE.Vector3(-railR + 2.2, 0.14, railR - 2.2));
    pts.push(new THREE.Vector3(-inner, 0.14, railR));

    const trackCurve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.35);
    const totalLen = trackCurve.getLength();

    // Find exact curve parameter `stationT` closest to Platform 1 (0, -railR)
    let stationT = 0.5;
    let bestD = Infinity;
    for (let s = 0; s < 400; s++) {
      const tt = s / 400;
      const p = trackCurve.getPointAt(tt);
      const d = p.x * p.x + (p.z + railR) * (p.z + railR);
      if (d < bestD) {
        bestD = d;
        stationT = tt;
      }
    }

    // 2. Render Railway Track Ballast, Wooden Sleepers & Dual Steel Rails using InstancedMesh (Ultra Low-RAM!)
    const sleeperCount = Math.min(360, Math.floor(totalLen / 1.8));
    const sleeperGeo = new THREE.BoxGeometry(2.8, 0.1, 0.42);
    const sleeperInst = new THREE.InstancedMesh(sleeperGeo, this.mat.railSleeper, sleeperCount);

    const railSegGeo = new THREE.BoxGeometry(0.14, 0.12, (totalLen / sleeperCount) * 1.15);
    const railInst = new THREE.InstancedMesh(railSegGeo, this.mat.railSteel, sleeperCount * 2);

    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const rightVec = new THREE.Vector3();
    for (let i = 0; i < sleeperCount; i++) {
      const u = i / sleeperCount;
      const p = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const yaw = Math.atan2(tan.x, tan.z);

      dummy.position.set(p.x, 0.08, p.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      sleeperInst.setMatrixAt(i, dummy.matrix);

      rightVec.crossVectors(up, tan).normalize();
      // Left steel rail
      dummy.position.set(p.x - rightVec.x * 0.82, 0.16, p.z - rightVec.z * 0.82);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      railInst.setMatrixAt(i * 2, dummy.matrix);
      // Right steel rail
      dummy.position.set(p.x + rightVec.x * 0.82, 0.16, p.z + rightVec.z * 0.82);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      railInst.setMatrixAt(i * 2 + 1, dummy.matrix);
    }
    sleeperInst.instanceMatrix.needsUpdate = true;
    railInst.instanceMatrix.needsUpdate = true;
    rg.add(sleeperInst, railInst);

    // 3. Railway Level Crossing Gates where Track meets Airport Highway (East) & Beach Road (West)!
    const addCrossingPost = (cx, cz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.8, 6), this.mat.trainYellow);
      post.position.set(cx, 1.4, cz);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), this.mat.beaconRed);
      lamp.position.set(cx, 2.95, cz);
      rg.add(post, lamp);
    };
    addCrossingPost(railR - 2.4, 13.5);
    addCrossingPost(railR + 2.4, 22.5);
    addCrossingPost(-railR - 2.4, -4.5);
    addCrossingPost(-railR + 2.4, 4.5);

    // 4. ⛰️ ROCKY GREEN MOUNTAIN & STONE RAILWAY TUNNEL (At the South-West End of the City!)
    const tunGroup = new THREE.Group();
    tunGroup.position.set(tunnelX, 0, railR);

    // Massive Sculpted Rocky Mountain Hill Covering the Tunnel (16 units long!)
    const peakMain = new THREE.Mesh(new THREE.DodecahedronGeometry(9.6, 0), this.mat.mountainRock);
    peakMain.scale.set(1.45, 0.92, 0.95);
    peakMain.position.set(0, 6.2, 0.8);
    const peakTop = new THREE.Mesh(new THREE.DodecahedronGeometry(6.8, 0), this.mat.mountainGreen);
    peakTop.scale.set(1.35, 0.72, 0.9);
    peakTop.position.set(-1.5, 9.6, 1.0);
    const peakL = new THREE.Mesh(new THREE.DodecahedronGeometry(6.2, 0), this.mat.mountainRock);
    peakL.position.set(-9.5, 4.2, 0.5);
    const peakR = new THREE.Mesh(new THREE.DodecahedronGeometry(5.8, 0), this.mat.mountainGreen);
    peakR.position.set(8.5, 4.0, 0.8);
    tunGroup.add(peakMain, peakTop, peakL, peakR);

    // Concrete Stone Tunnel Portals on BOTH Ends (East Exit & West Entry) + Pitch-Black Tunnel Interior!
    [-9.2, 9.2].forEach((px) => {
      const archWall = new THREE.Mesh(new THREE.BoxGeometry(0.9, 5.2, 6.2), this.mat.concrete);
      archWall.position.set(px, 2.6, 0);
      const voidMouth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.6, 3.6), this.mat.tunnelVoid);
      voidMouth.position.set(px, 1.85, 0);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 6.4), this.mat.trainYellow);
      trim.position.set(px, 5.2, 0);
      tunGroup.add(archWall, voidMouth, trim);
    });
    // Dark tunnel roof sleeve inside the mountain so train disappears cleanly inside
    const tunSleeve = new THREE.Mesh(new THREE.BoxGeometry(18.2, 3.9, 4.2), this.mat.tunnelVoid);
    tunSleeve.position.set(0, 2.0, 0);
    const tunSign = this._createNameSign("⛰️ MOUNTAIN TUNNEL", "RAILWAY END OF CITY", false);
    tunSign.position.set(0, 14.5, 0);
    tunGroup.add(tunSleeve, tunSign);
    rg.add(tunGroup);

    // 5. 🚉 GRAND INDIAN RAILWAY STATION ("SHERU BHAI JN") on North Side (0, -railR - 6.8)
    const stGroup = new THREE.Group();
    stGroup.position.set(0, 0, -railR);

    // Road connecting North Outer Ring Road -> Railway Station Front
    const stRoad = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.08, 12.0), this.mat.road);
    stRoad.position.set(0, 0.02, 5.5);
    rg.add(stRoad);

    // Raised Long Concrete Platform 1 right beside the Track!
    const platform = new THREE.Mesh(new THREE.BoxGeometry(34.0, 0.85, 5.2), this.mat.concrete);
    platform.position.set(0, 0.42, -4.1);
    const yellowEdge = new THREE.Mesh(new THREE.BoxGeometry(34.0, 0.08, 0.35), this.mat.trainYellow);
    yellowEdge.position.set(0, 0.87, -1.65);

    // Covered Arched Platform Shed + Steel Pillars + Platform Lamps
    const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(28.0, 0.32, 5.8), this.mat.stationRoof);
    shedRoof.position.set(0, 4.85, -4.4);
    shedRoof.rotation.x = 0.08;
    for (let px = -12; px <= 12; px += 6) {
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.2, 6), this.mat.wallWhite);
      pil.position.set(px, 2.8, -3.2);
      stGroup.add(pil);
      const pLight = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.lampBulbNight);
      pLight.position.set(px, 4.55, -2.5);
      pLight.visible = this.timeOfDay === "night";
      stGroup.add(pLight);
      nightLights.push(pLight);
    }

    // Platform Waiting Benches
    [-8, 0, 8].forEach((bx) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 0.65), this.mat.trainBlue);
      bench.position.set(bx, 1.05, -4.8);
      stGroup.add(bench);
    });

    // Iconic Yellow Indian Railways Station Nameboards at BOTH Platform Ends!
    const cleanRailOwner = (this.railwayOwner || "@_ur_bunny_108_").trim();
    const irBoardL = this._makeBuildingBoard("SHERU BHAI JN", "రైల్వే స్టేషన్ • PF 1", "#facc15", "#111827", 5.6, 1.3);
    irBoardL.position.set(-14.2, 2.4, -3.2);
    const irBoardR = irBoardL.clone();
    irBoardR.position.x = 14.2;
    [-14.2, 14.2].forEach((bx) => {
      const bp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.6, 0.18), this.mat.charcoal);
      bp.position.set(bx, 1.4, -3.2);
      stGroup.add(bp);
    });

    // Grand Heritage Railway Station Main Building + Central Clock Tower Dome!
    const stMain = new THREE.Mesh(new THREE.BoxGeometry(24.0, 5.6, 6.4), this.mat.stuccoCream);
    stMain.position.set(0, 3.2, -9.8);
    const stTrim = new THREE.Mesh(new THREE.BoxGeometry(24.4, 0.45, 6.8), this.mat.terracottaRoof);
    stTrim.position.set(0, 6.1, -9.8);
    const clockBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.2, 4.2), this.mat.stuccoCream);
    clockBase.position.set(0, 7.6, -9.8);
    const clockDome = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.terracottaRoof);
    clockDome.position.set(0, 9.2, -9.8);
    const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 12), this.mat.wallWhite);
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(0, 7.8, -7.65);

    // Big Main Station Facade Signboard (Shows Station Name + Station Chief @username!)
    const mainBoard = this._makeBuildingBoard("RAILWAY STATION", `${cleanRailOwner.toUpperCase()} • SHERU BHAI JN`, "#1e3a8a", "#facc15", 13.5, 1.8);
    mainBoard.position.set(0, 5.6, -6.5);

    // Floating Station Name Sign
    const stFloatSign = this._createNameSign(`🚂 SHERU BHAI JN • ${cleanRailOwner}`, "రైల్వే స్టేషన్ • LIVE EXPRESS TRAIN", true);
    stFloatSign.position.set(0, 13.8, -9.5);

    // 6 Live Waiting Passengers on Platform 1 who board INSIDE the Express Train!
    const stationPassengers = [
      this.mat.wallCoral, this.mat.wallGold, this.mat.wallMint,
      this.mat.wallBlue, this.mat.richVelvetRed, this.mat.khakiUniform
    ].map((sm, i) => {
      const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.95 });
      p.position.set(-7.5 + i * 3.0, 0.92, -4.0);
      stGroup.add(p);
      return p;
    });

    // Clickable Hitbox for Railway Station
    const stHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(36, 14, 18),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    stHitbox.position.set(0, 7, -6.5);
    stHitbox.userData.plotId = "RAILWAY_STATION";
    stGroup.add(stHitbox);
    this.plotHitboxes.push(stHitbox);

    stGroup.add(platform, yellowEdge, shedRoof, irBoardL, irBoardR, stMain, stTrim, clockBase, clockDome, clockFace, mainBoard, stFloatSign);
    rg.add(stGroup);

    // 6. Spawn Articulated 4-Car Indian Express Train (1 Locomotive + 3 Passenger Coaches)
    const trainCars = [];
    const loco = this._makeTrainLocomotive(nightLights);
    rg.add(loco);
    trainCars.push(loco);
    for (let c = 0; c < 3; c++) {
      const coach = this._makeTrainCoach(trainWindows);
      rg.add(coach);
      trainCars.push(coach);
    }

    this.cityGroup.add(rg);

    this.railwaySim = {
      trackCurve,
      totalLen,
      stationT,
      tunnelX,
      railR,
      trainCars,
      stationPassengers,
      nightLights,
      trainWindows
    };
  }

  _addWelcomeArch(x, z) {
    const g = new THREE.Group();
    const pGeo = new THREE.BoxGeometry(0.95, 6.4, 0.95);
    const pL = new THREE.Mesh(pGeo, this.mat.wallCream);
    pL.position.set(-4.3, 3.2, 0);
    const pR = pL.clone();
    pR.position.x = 4.3;

    const beam = new THREE.Mesh(new THREE.BoxGeometry(9.8, 1.45, 1.15), this.mat.navy);
    beam.position.set(0, 6.2, 0);
    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.25, 1.25), this.mat.petrolYellow);
    topTrim.position.set(0, 7.0, 0);

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 110;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(0, 0, 512, 110);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 102);
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("స్వాగతం • OUTER RING ROAD", 256, 42);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText(this.townName.toUpperCase(), 256, 84);

    const tex = new THREE.CanvasTexture(canvas);
    const signMat = new THREE.MeshBasicMaterial({ map: tex });
    const frontSign = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 1.3), signMat);
    frontSign.position.set(0, 6.2, 0.6);
    const backSign = frontSign.clone();
    backSign.rotation.y = Math.PI;
    backSign.position.z = -0.6;

    g.add(pL, pR, beam, topTrim, frontSign, backSign);
    g.position.set(x, 0, z);
    this.cityGroup.add(g);
  }

  _addHighwayLamp(x, z) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.6, 5), this.mat.lampPole);
    pole.position.y = 2.3;
    const cross = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.1), this.mat.lampPole);
    cross.position.y = 4.5;
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.22), this.mat.lampBulbDay);
    b1.position.set(-1.05, 4.38, 0);
    const b2 = b1.clone();
    b2.position.x = 1.05;
    g.add(pole, cross, b1, b2);
    g.position.set(x, 0.1, z);
    this.cityGroup.add(g);
    this.lampBulbs.push(b1, b2);
  }

  _addStreetLamp(x, z) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 5), this.mat.lampPole);
    pole.position.y = 1.6;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), this.mat.lampPole);
    arm.position.set(0.3, 3.15, 0);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.2), this.mat.lampBulbDay);
    bulb.position.set(0.6, 3.05, 0);
    group.add(pole, arm, bulb);
    group.position.set(x, 0.08, z);
    this.cityGroup.add(group);
    this.lampBulbs.push(bulb);
  }

  _addPalmTree(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 3.2, 5), this.mat.treeTrunk);
    trunk.position.y = 1.6;
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), this.mat.treeLeaf);
    crown.position.y = 3.5;
    crown.scale.y = 0.75;
    g.add(trunk, crown);
    g.position.set(x + (Math.random() - 0.5) * 2.5, 0, z + (Math.random() - 0.5) * 2.5);
    this.cityGroup.add(g);
  }

  _spawnVehicles() {
    while (this.trafficGroup.children.length > 0) {
      this.trafficGroup.remove(this.trafficGroup.children[0]);
    }
    this.vehicles = [];
    this.ringVehicles = [];
    this.vehicleHeadlights = this.vehicleHeadlights.filter((h) => h.userData.keepOnPlot);

    const r = this.currentGridRadius;
    const roadCount = Math.min(18, (r * 2 + 2) * 2);
    const colors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981, 0xf97316, 0xf8fafc];
    const limit = (r + 0.5) * this.BLOCK_STEP;

    for (let i = 0; i < roadCount; i++) {
      const isBus = i % 5 === 0;
      const isAuto = i % 3 === 0 && !isBus;
      const car = this._makeVehicleMesh(isBus, isAuto, colors[i % colors.length], false);

      const horizontal = i % 2 === 0;
      const laneIdx = Math.floor(Math.random() * (r * 2 + 2)) - r;
      const roadCoord = (laneIdx - 0.5) * this.BLOCK_STEP;
      const dir = Math.random() > 0.5 ? 1 : -1;
      const laneOffset = dir * 0.9;

      if (horizontal) {
        car.position.set((Math.random() * 2 - 1) * limit, 0.08, roadCoord + laneOffset);
        car.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        car.position.set(roadCoord - laneOffset, 0.08, (Math.random() * 2 - 1) * limit);
        car.rotation.y = dir > 0 ? 0 : Math.PI;
      }

      this.trafficGroup.add(car);
      this.vehicles.push({ mesh: car, horizontal, dir, speed: (isBus ? 4.4 : 6.4) + Math.random() * 2.5, limit });
    }

    const rr = this.ringRadius;
    for (let i = 0; i < 12; i++) {
      const isBus = i % 4 === 0;
      const car = this._makeVehicleMesh(isBus, false, colors[(i + 2) % colors.length], false);
      const cw = i % 2 === 0;
      const lane = cw ? rr + 1.8 : rr - 1.8;
      this.trafficGroup.add(car);
      this.ringVehicles.push({
        mesh: car,
        t: (i / 12) * 4,
        cw,
        lane,
        speed: (isBus ? 9 : 13) + Math.random() * 4
      });
    }
    this.setTimeOfDay(this.timeOfDay);
  }

  /**
   * Realistic 3D Indian 3-Wheeler Auto Rickshaw (AP/TS style)
   * Features: 1 front wheel + mudguard, 2 rear wheels, tapered front nose, windshield,
   * open passenger cabin with seats, driver seat + handlebar, roof canopy & night headlight!
   */
  _makeRealAutoMesh(keepOnPlot = true, includeSeatedPassengers = false) {
    const auto = new THREE.Group();

    // 3 Realistic Wheels (1 front center, 2 rear)
    const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 10);
    const rimGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.16, 8);
    const addWheel = (x, z) => {
      const wg = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
      tire.rotation.z = Math.PI / 2;
      const rim = new THREE.Mesh(rimGeo, this.mat.rimSilver);
      rim.rotation.z = Math.PI / 2;
      wg.add(tire, rim);
      wg.position.set(x, 0.24, z);
      auto.add(wg);
    };
    addWheel(0, 0.85);       // Single front wheel
    addWheel(-0.52, -0.62);  // Rear left wheel
    addWheel(0.52, -0.62);   // Rear right wheel

    // Floor Chassis & Front Mudguard
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.14, 1.85), this.mat.charcoal);
    chassis.position.set(0, 0.34, 0.0);
    const mudguard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.44), this.mat.autoYellow);
    mudguard.position.set(0, 0.44, 0.88);
    auto.add(chassis, mudguard);

    // Tapered Front Nose / Shield (Yellow lower + green AP stripe)
    const noseLower = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.56, 0.46), this.mat.autoYellow);
    noseLower.position.set(0, 0.68, 0.72);
    const noseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.14, 0.48), this.mat.autoGreen);
    noseTrim.position.set(0, 0.52, 0.72);

    // Front Windshield Frame + Clear Glass
    const windFrame = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.52, 0.1), this.mat.autoYellow);
    windFrame.position.set(0, 1.18, 0.68);
    windFrame.rotation.x = -0.18;
    const windGlass = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.38, 0.12), this.mat.glass);
    windGlass.position.set(0, 1.18, 0.69);
    windGlass.rotation.x = -0.18;

    // Rear Engine Body & Back Panel (Yellow + Green stripe)
    const rearBody = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.72, 0.74), this.mat.autoYellow);
    rearBody.position.set(0, 0.76, -0.58);
    const rearStripe = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.18, 0.76), this.mat.autoGreen);
    rearStripe.position.set(0, 0.54, -0.58);

    // Rear Backrest + Side Half-Doors (Open Passenger Cabin!)
    const rearBack = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.6, 0.14), this.mat.autoYellow);
    rearBack.position.set(0, 1.16, -0.88);
    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.42, 0.36), this.mat.charcoal);
    seatBack.position.set(0, 0.65, -0.45);
    const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.32), this.mat.charcoal);
    driverSeat.position.set(0, 0.62, 0.25);

    // 4 Thin Roof Support Pillars + Curved Dark Canvas Roof Canopy
    const pilGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.68, 5);
    [[-0.4, 0.58], [0.4, 0.58], [-0.48, -0.82], [0.48, -0.82]].forEach(([px, pz]) => {
      const pil = new THREE.Mesh(pilGeo, this.mat.charcoal);
      pil.position.set(px, 1.24, pz);
      auto.add(pil);
    });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.18, 1.62), this.mat.autoCanopy);
    canopy.position.set(0, 1.56, -0.12);
    const canopyTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.1, 1.44), this.mat.autoYellow);
    canopyTop.position.set(0, 1.66, -0.12);

    // Single Round Center Headlight (classic auto look!)
    const lampHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 8), this.mat.chrome);
    lampHousing.rotation.x = Math.PI / 2;
    lampHousing.position.set(0, 0.74, 0.96);

    auto.add(noseLower, noseTrim, windFrame, windGlass, rearBody, rearStripe, rearBack, seatBack, driverSeat, canopy, canopyTop, lampHousing);

    // Driver inside auto (optional toggleable passengers for live trips!)
    const driver = this._createCharacter({ shirtMat: this.mat.khakiUniform, pantsMat: this.mat.darkPants, scale: 0.68 });
    driver.position.set(0, 0.48, 0.22);
    auto.add(driver);

    if (includeSeatedPassengers) {
      const paxGroup = new THREE.Group();
      const p1 = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.darkPants, scale: 0.65 });
      p1.position.set(-0.24, 0.52, -0.42);
      const p2 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.65 });
      p2.position.set(0.24, 0.52, -0.42);
      paxGroup.add(p1, p2);
      paxGroup.visible = false;
      auto.add(paxGroup);
      auto.userData.seatedPassengers = paxGroup;
    }

    // Night Headlight + Road Beam + Rear Taillights
    const hlGroup = new THREE.Group();
    hlGroup.userData.keepOnPlot = keepOnPlot;
    const hlGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8), this.mat.lampBulbNight);
    hlGlow.rotation.x = Math.PI / 2;
    hlGlow.position.set(0, 0.74, 1.0);
    const tlGeo = new THREE.BoxGeometry(0.16, 0.12, 0.06);
    const tlL = new THREE.Mesh(tlGeo, this.mat.taillight);
    tlL.position.set(-0.38, 0.58, -0.96);
    const tlR = tlL.clone();
    tlR.position.x = 0.38;
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.8), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.09, 2.35);

    hlGroup.add(hlGlow, tlL, tlR, beam);
    hlGroup.visible = this.timeOfDay === "night";
    auto.add(hlGroup);
    this.vehicleHeadlights.push(hlGroup);

    return auto;
  }

  /**
   * Realistic 3D Indian APSRTC / Express Bus
   * Features: 6 wheels, sloped front windshield, amber LED destination board, side passenger windows,
   * side mirrors, front grille & chrome bumper, rooftop luggage rack + AC unit, night headlights & window glow!
   */
  _makeRealBusMesh(color = 0xdc2626, keepOnPlot = true) {
    const bus = new THREE.Group();
    const len = 4.6;
    const w = 1.48;
    const h = 1.65;

    // 4 Realistic Bus Wheels (front & rear axle)
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.2, 10);
    const rimGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.22, 8);
    [[-0.72, 1.45], [0.72, 1.45], [-0.72, -1.35], [0.72, -1.35]].forEach(([wx, wz]) => {
      const tire = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wx, 0.32, wz);
      const rim = new THREE.Mesh(rimGeo, this.mat.rimSilver);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, 0.32, wz);
      bus.add(tire, rim);
    });

    // Main Lower & Upper Bus Body
    const bodyMat = this._getColorMat(color);
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(w, 0.72, len), bodyMat);
    lowerBody.position.set(0, 0.68, 0);

    const whiteStripe = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, 0.24, len + 0.02), this.mat.wallWhite);
    whiteStripe.position.set(0, 1.08, 0);

    const upperBody = new THREE.Mesh(new THREE.BoxGeometry(w, 0.78, len - 0.1), bodyMat);
    upperBody.position.set(0, 1.56, -0.02);

    // Front Windshield + Amber LED Route Destination Board
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, 0.62, 0.08), this.mat.busWindshield);
    windshield.position.set(0, 1.48, len / 2 - 0.01);
    windshield.rotation.x = -0.1;

    const ledBoard = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.16, 0.08), this.mat.busLedBoard);
    ledBoard.position.set(0, 1.84, len / 2 - 0.01);

    // Front Grille & Chrome Bumper
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.26, 0.08), this.mat.charcoal);
    grille.position.set(0, 0.68, len / 2 + 0.01);
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.18, 0.14), this.mat.chrome);
    bumper.position.set(0, 0.42, len / 2 + 0.04);

    // Side Mirrors
    [-0.84, 0.84].forEach((mx) => {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.12), this.mat.charcoal);
      mirror.position.set(mx, 1.42, len / 2 - 0.12);
      bus.add(mirror);
    });

    // Row of 5 Individual Side Passenger Windows on BOTH Sides + Rear Window
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.busWindshield;
    const sideWinGeo = new THREE.BoxGeometry(0.06, 0.52, 0.64);
    for (let wz = -1.65; wz <= 1.55; wz += 0.8) {
      const wl = new THREE.Mesh(sideWinGeo, winMat);
      wl.position.set(-w / 2 - 0.01, 1.52, wz);
      wl.userData.isWindow = true;
      const wr = new THREE.Mesh(sideWinGeo, winMat);
      wr.position.set(w / 2 + 0.01, 1.52, wz);
      wr.userData.isWindow = true;
      bus.add(wl, wr);
    }
    const rearWin = new THREE.Mesh(new THREE.BoxGeometry(w - 0.22, 0.55, 0.08), winMat);
    rearWin.position.set(0, 1.52, -len / 2 + 0.02);
    rearWin.userData.isWindow = true;

    // Rooftop AC Pod & Luggage Carrier Rail
    const roofAc = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 1.5), this.mat.wallWhite);
    roofAc.position.set(0, 2.04, 0.2);
    const rack = new THREE.Mesh(new THREE.BoxGeometry(w - 0.18, 0.14, 2.0), this.mat.chrome);
    rack.position.set(0, 2.0, -1.1);

    // Passenger Entry Door cutout on Left Side (+X / -X front)
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.25, 0.58), this.mat.charcoal);
    door.position.set(w / 2 + 0.01, 1.05, 1.72);

    bus.add(lowerBody, whiteStripe, upperBody, windshield, ledBoard, grille, bumper, rearWin, roofAc, rack, door);

    // Night Headlights + Dual Road Beams + Taillights
    const hlGroup = new THREE.Group();
    hlGroup.userData.keepOnPlot = keepOnPlot;
    const hlGeo = new THREE.BoxGeometry(0.24, 0.16, 0.08);
    const hlL = new THREE.Mesh(hlGeo, this.mat.lampBulbNight);
    hlL.position.set(-0.52, 0.64, len / 2 + 0.03);
    const hlR = hlL.clone();
    hlR.position.x = 0.52;

    const tlL = new THREE.Mesh(hlGeo, this.mat.taillight);
    tlL.position.set(-0.52, 0.64, -len / 2 - 0.02);
    const tlR = tlL.clone();
    tlR.position.x = 0.52;

    const beam = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 4.0), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.09, len / 2 + 2.05);

    hlGroup.add(hlL, hlR, tlL, tlR, beam);
    hlGroup.visible = this.timeOfDay === "night";
    bus.add(hlGroup);
    this.vehicleHeadlights.push(hlGroup);

    return bus;
  }

  _makeVehicleMesh(isBus, isAuto, color, keepOnPlot = true) {
    if (isAuto) return this._makeRealAutoMesh(keepOnPlot, false);
    if (isBus) return this._makeRealBusMesh(color || 0xdc2626, keepOnPlot);

    const car = new THREE.Group();
    const len = 2.15;
    const h = 0.74;
    const w = 1.04;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, len),
      this._getColorMat(color)
    );
    body.position.y = h / 2 + 0.2;
    car.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.85, 0.45, len * 0.55),
      this.mat.appleSilver
    );
    cabin.position.y = h + 0.35;
    car.add(cabin);

    const hlGroup = new THREE.Group();
    hlGroup.userData.keepOnPlot = keepOnPlot;

    const hlGeo = new THREE.BoxGeometry(0.22, 0.16, 0.08);
    const hlL = new THREE.Mesh(hlGeo, this.mat.lampBulbNight);
    hlL.position.set(-w * 0.3, 0.48, len / 2 + 0.03);
    const hlR = hlL.clone();
    hlR.position.x = w * 0.3;

    const tlL = new THREE.Mesh(hlGeo, this.mat.taillight);
    tlL.position.set(-w * 0.3, 0.48, -len / 2 - 0.03);
    const tlR = tlL.clone();
    tlR.position.x = w * 0.3;

    const beam = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.4, 3.2), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.09, len / 2 + 1.65);

    hlGroup.add(hlL, hlR, tlL, tlR, beam);
    hlGroup.visible = this.timeOfDay === "night";
    car.add(hlGroup);
    this.vehicleHeadlights.push(hlGroup);

    return car;
  }

  _spawnRoamingWorkersAndPostman() {
    while (this.workersGroup.children.length > 0) {
      this.workersGroup.remove(this.workersGroup.children[0]);
    }
    this.workers = [];

    const count = Math.min(14, 6 + this.currentGridRadius * 2);
    const limit = (this.currentGridRadius + 0.4) * this.BLOCK_STEP;

    for (let i = 0; i < count; i++) {
      const worker = this._createCharacter({
        shirtMat: i % 2 === 0 ? this.mat.wallGold : this.mat.wallBlue,
        pantsMat: this.mat.navy,
        hatColor: 0xfacc15
      });
      worker.position.set((Math.random() * 2 - 1) * limit, 0.1, (Math.random() * 2 - 1) * limit);
      this.workersGroup.add(worker);
      this.workers.push({
        mesh: worker,
        angle: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 1.2,
        phase: Math.random() * 10,
        limit
      });
    }

    // POSTMAN ON BICYCLE WITH MAIL BAG & LETTERS
    const pmGroup = new THREE.Group();
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 8);
    const wFront = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
    wFront.rotation.z = Math.PI / 2;
    wFront.position.set(0, 0.32, 0.52);
    const wBack = wFront.clone();
    wBack.position.z = -0.52;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 1.05), this.mat.petrolRed);
    frame.position.set(0, 0.52, 0);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.08), this.mat.appleSilver);
    handle.position.set(0, 0.85, 0.42);

    const rider = this._createCharacter({
      shirtMat: this.mat.khakiUniform,
      pantsMat: this.mat.khakiUniform,
      hatColor: 0x92400e,
      scale: 0.92
    });
    rider.position.set(0, 0.35, -0.08);

    const mailBag = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.38, 0.45), this.mat.wood);
    mailBag.position.set(0.28, 0.72, -0.45);
    const letter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.04), this.mat.wallWhite);
    letter.position.set(0.35, 1.05, 0.15);

    pmGroup.add(wFront, wBack, frame, handle, rider, mailBag, letter);
    this.workersGroup.add(pmGroup);

    this.postman = {
      mesh: pmGroup,
      letter,
      loopRadius: this.BLOCK_STEP * 0.5,
      t: 0,
      stopTimer: 0
    };
  }

  _createCharacter({ shirtMat, pantsMat, hatColor = null, scale = 1.0, hasBat = false }) {
    const g = new THREE.Group();
    const legs = new THREE.Mesh(this.geo.cLegs, pantsMat || this.mat.darkPants);
    legs.position.y = 0.23;

    const torso = new THREE.Mesh(this.geo.cTorso, shirtMat || this.mat.wallBlue);
    torso.position.y = 0.7;

    const head = new THREE.Mesh(this.geo.cHead, this.mat.skin);
    head.position.y = 1.1;

    g.add(legs, torso, head);

    if (hatColor !== null) {
      const cap = new THREE.Mesh(this.geo.cCap, new THREE.MeshLambertMaterial({ color: hatColor }));
      cap.position.y = 1.27;
      g.add(cap);
    }

    if (hasBat) {
      const bat = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.06), this.mat.wood);
      bat.position.set(0.28, 0.6, 0.18);
      bat.rotation.z = -0.35;
      g.add(bat);
    }

    g.scale.setScalar(scale);
    return g;
  }

  renderPlot(plotId, data, animateBuild = false) {
    const plotIndex = parseInt(plotId.replace("plot_", ""), 10) - 1;
    if (isNaN(plotIndex) || plotIndex < 0) return;

    this.plotDataMap.set(plotId, data);

    if (this.plotMeshes.has(plotId)) {
      const oldGroup = this.plotMeshes.get(plotId);
      this._disposePlotGroup(oldGroup);
      this.plotsGroup.remove(oldGroup);
      this.plotSigns = this.plotSigns.filter((s) => s.plotId !== plotId);
      this.plotHitboxes = this.plotHitboxes.filter((h) => h.userData.plotId !== plotId);
      this.sirenLights = this.sirenLights.filter((s) => s.userData.plotId !== plotId);
      this.landmarkActors = this.landmarkActors.filter((a) => a.plotId !== plotId);
      this.petrolSimulations = this.petrolSimulations.filter((s) => s.plotId !== plotId);
      this.busSimulations = this.busSimulations.filter((s) => s.plotId !== plotId);
      this.autoSimulations = this.autoSimulations.filter((s) => s.plotId !== plotId);
      this.policeSimulations = this.policeSimulations.filter((s) => s.plotId !== plotId);
      this.ambulanceSimulations = this.ambulanceSimulations.filter((s) => s.plotId !== plotId);
      this.turntableRotors = this.turntableRotors.filter((r) => r.plotId !== plotId);
      this.studioFlashes = this.studioFlashes.filter((f) => f.plotId !== plotId);
      this.blockedRoadZones = this.blockedRoadZones.filter((z) => z.plotId !== plotId);
    }

    const reqSize = data?.status === "built" ? getRequiredSize(data.buildingType) : 1;
    if ((data && data.status === "occupied_by_landmark") || (reqSize === 1 && this.landmarkCoveredPlots.has(plotId))) {
      const emptyPlaceholder = new THREE.Group();
      this.plotsGroup.add(emptyPlaceholder);
      this.plotMeshes.set(plotId, emptyPlaceholder);
      return;
    }

    const pos = this.getPlotPosition(plotIndex);
    const size = data?.status === "built" ? (data.size || reqSize) : 1;
    const isEightPlot = size === 8;
    const isFourPlot = size === 4;
    const isTwoPlot = size === 2;

    const plotGroup = new THREE.Group();
    if (isEightPlot) {
      const groupInfo = getEightPlotGroup(plotId);
      const leftCoord = blockIdxToCoord(groupInfo.leftBlockIdx);
      const rightCoord = blockIdxToCoord(groupInfo.rightBlockIdx);
      const midX = ((leftCoord.bx + rightCoord.bx) / 2) * this.BLOCK_STEP;
      const midZ = leftCoord.bz * this.BLOCK_STEP;
      plotGroup.position.set(midX, 0.08, midZ);

      this.blockedRoadZones.push({
        plotId,
        minX: midX - this.EIGHT_PLOT_WIDTH / 2 - 1,
        maxX: midX + this.EIGHT_PLOT_WIDTH / 2 + 1,
        minZ: midZ - this.BLOCK_FOOTPRINT / 2 - 1,
        maxZ: midZ + this.BLOCK_FOOTPRINT / 2 + 1
      });
    } else if (isFourPlot) {
      plotGroup.position.set(pos.blockCenterX, 0.08, pos.blockCenterZ);
    } else if (isTwoPlot) {
      const twoInfo = getTwoPlotGroup(plotId);
      const rowZ = pos.blockCenterZ + (twoInfo.isNorthRow ? -this.PLOT_SIZE / 2 : this.PLOT_SIZE / 2);
      plotGroup.position.set(pos.blockCenterX, 0.08, rowZ);
    } else {
      plotGroup.position.set(pos.x, 0.08, pos.z);
    }

    let hitbox;
    if (isEightPlot || isFourPlot) {
      const hitW = isEightPlot ? this.EIGHT_PLOT_WIDTH : this.BLOCK_FOOTPRINT - 0.2;
      hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(hitW, 11.0, this.BLOCK_FOOTPRINT - 0.2),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.y = 5.5;
    } else if (isTwoPlot) {
      hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(this.BLOCK_FOOTPRINT - 0.2, 8.0, this.PLOT_SIZE - 0.2),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitbox.position.y = 4.0;
    } else {
      hitbox = new THREE.Mesh(this.geo.hit1, new THREE.MeshBasicMaterial({ visible: false }));
      hitbox.position.y = 3.25;
    }
    hitbox.userData.plotId = plotId;
    plotGroup.add(hitbox);
    this.plotHitboxes.push(hitbox);

    const lotBaseMat =
      data?.buildingType === "ground"
        ? this.mat.turf
        : data?.status === "built"
        ? this.mat.concrete
        : this.mat.grass;

    const lotBase =
      isEightPlot || isFourPlot
        ? new THREE.Mesh(
            new THREE.BoxGeometry(
              (isEightPlot ? this.EIGHT_PLOT_WIDTH + 0.8 : this.BLOCK_FOOTPRINT - 0.2),
              isEightPlot ? 0.26 : 0.14,
              this.BLOCK_FOOTPRINT + (isEightPlot ? 0.4 : -0.2)
            ),
            lotBaseMat
          )
        : isTwoPlot
        ? new THREE.Mesh(
            new THREE.BoxGeometry(this.BLOCK_FOOTPRINT - 0.2, 0.14, this.PLOT_SIZE - 0.2),
            lotBaseMat
          )
        : new THREE.Mesh(this.geo.base1, lotBaseMat);
    lotBase.position.y = isEightPlot ? 0.13 : 0.07;
    plotGroup.add(lotBase);

    let buildingObj = null;

    if (!data || data.status !== "built" || data.buildingType === "empty") {
      buildingObj = this._buildEmptyPlotMesh();
    } else if (isEightPlot) {
      if (data.buildingType === "audi_showroom") {
        buildingObj = this._buildEightPlotAudiShowroom(plotId, data.ownerName);
        const topLabel = data.ownerName || "AUDI SHOWROOM";
        const sign = this._createNameSign(topLabel, "🚘 ఆడి షోరూమ్ • 8-PLOT AUDI SHOWROOM", true);
        sign.position.set(0, 11.4, 0);
        buildingObj.add(sign);
      } else {
        buildingObj = this._buildEightPlotCricketStadium(plotId);
        const topLabel = data.ownerName || BUILDING_LABELS.ground;
        const sign = this._createNameSign(topLabel, "🏏 గ్రౌండ్ • 8-PLOT MEGA STADIUM", true);
        sign.position.set(0, 10.6, 0);
        buildingObj.add(sign);
      }
    } else if (isFourPlot) {
      buildingObj = this._buildFourPlotLandmark(data.buildingType, plotId, data.ownerName);
      const topLabel = data.ownerName || BUILDING_LABELS[data.buildingType] || "LANDMARK";
      const subLabel = this._getLandmarkSubtitle(data.buildingType);
      const sign = this._createNameSign(topLabel, subLabel, true);
      sign.position.set(0, buildingObj.userData.labelY || 11.2, 0);
      buildingObj.add(sign);
    } else if (isTwoPlot) {
      const twoInfo = getTwoPlotGroup(plotId);
      buildingObj = this._buildTwoPlotBuilding(data.buildingType, plotId, data.ownerName);
      buildingObj.rotation.y = twoInfo.rotY;
      const topLabel = data.ownerName || BUILDING_LABELS[data.buildingType] || "PHOTO STUDIO";
      const subLabel = this._getLandmarkSubtitle(data.buildingType);
      const sign = this._createNameSign(topLabel, subLabel, true);
      sign.position.set(0, buildingObj.userData.labelY || 7.6, 0);
      plotGroup.add(sign);
    } else {
      buildingObj = this._buildOnePlotBuilding(data.buildingType);
      buildingObj.rotation.y = pos.rotY;

      if (data.ownerName) {
        const subLabel = data.buildingType === "shop" ? "టీ & టిఫిన్ • SHOP" : data.buildingType === "cafe" ? "☕ COFFEE CAFE" : "";
        const sign = this._createNameSign(data.ownerName, subLabel, false);
        sign.position.set(0, buildingObj.userData.labelY || 5.2, 0);
        plotGroup.add(sign);
        this.plotSigns.push({ plotId, sprite: sign, x: pos.x, z: pos.z });
      }
    }

    plotGroup.add(buildingObj);

    if (animateBuild && data.status === "built") {
      buildingObj.scale.y = 0.05;
      const scafW = isEightPlot ? 31.0 : isFourPlot || isTwoPlot ? 13.0 : 5.6;
      const scafD = isEightPlot || isFourPlot ? 13.0 : 5.6;
      const scafH = isEightPlot || isFourPlot ? 9.5 : 5.5;
      const scaffold = new THREE.Mesh(new THREE.BoxGeometry(scafW, scafH, scafD), this.mat.scaffolding);
      scaffold.position.y = scafH / 2;
      plotGroup.add(scaffold);

      const siteWorkers = [];
      const wCount = isEightPlot ? 6 : isFourPlot ? 4 : 2;
      for (let w = 0; w < wCount; w++) {
        const npc = this._createCharacter({
          shirtMat: this.mat.wallGold,
          pantsMat: this.mat.navy,
          hatColor: 0xfacc15
        });
        const ang = (w / wCount) * Math.PI * 2;
        npc.position.set(Math.cos(ang) * (scafW / 2), 0.1, Math.sin(ang) * (scafD / 2));
        plotGroup.add(npc);
        siteWorkers.push(npc);
      }
      this.constructions.push({ buildingObj, scaffold, siteWorkers, plotGroup, progress: 0 });
    }

    this.plotsGroup.add(plotGroup);
    this.plotMeshes.set(plotId, plotGroup);
  }

  _getLandmarkSubtitle(type) {
    const map = {
      school: "పాఠశాల • GRAND SCHOOL",
      hospital: "ఆసుపత్రి • SUPER HOSPITAL",
      bus_stand: "బస్ స్టాండ్ • APSRTC TERMINAL",
      auto_stand: "ఆటో స్టాండ్ • TRANSPORT OFFICE",
      ground: "గ్రౌండ్ • CRICKET STADIUM",
      police_station: "పోలీస్ స్టేషన్ • POLICE HQ",
      petrol_bunk: "పెట్రోల్ బంక్ • FUEL PLAZA",
      srmt_mall: "SRMT మాల్ • SRMT MALL",
      apple_store: "ఆపిల్ స్టోర్ • APPLE STORE",
      reliance_store: "రిలయన్స్ • RELIANCE DIGITAL",
      audi_showroom: "ఆడి షోరూమ్ • AUDI LUXURY MOTORS",
      gym: "జిమ్ • PERSONAL FITNESS CLUB",
      photo_studio: "ఫోటో స్టూడియో • PHOTO & 4K VIDEO",
      iti_college: "ఐటిఐ కాలేజ్ • ITI TECHNICAL COLLEGE"
    };
    return map[type] || "";
  }

  _buildEmptyPlotMesh() {
    const g = new THREE.Group();
    const s = this.PLOT_SIZE - 0.7;
    const f1 = new THREE.Mesh(this.geo.fenceH, this.mat.wood);
    f1.position.set(0, 0.325, -s / 2);
    const f2 = new THREE.Mesh(this.geo.fenceH, this.mat.wood);
    f2.position.set(0, 0.325, s / 2);
    const f3 = new THREE.Mesh(this.geo.fenceV, this.mat.wood);
    f3.position.set(-s / 2, 0.325, 0);
    const f4 = new THREE.Mesh(this.geo.fenceV, this.mat.wood);
    f4.position.set(s / 2, 0.325, 0);

    const post = new THREE.Mesh(this.geo.post, this.mat.wood);
    post.position.set(0, 0.6, 0);
    const board = new THREE.Mesh(this.geo.board, this.mat.wallWhite);
    board.position.set(0, 1.05, 0.05);

    g.add(f1, f2, f3, f4, post, board);
    return g;
  }

  // =========================================================================
  // 1-PLOT BUILDINGS: KEEPS CLASSIC HOUSES + ADDS NEW 5-FLOOR MODERN TOWERS!
  // =========================================================================
  _buildOnePlotBuilding(type) {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;

    // --- NEW 5-FLOOR MODERN TOWERS (Optional, Lightweight Shared Geometries) ---
    if (type === "tower_brick") {
      const floors = 5;
      const fh = 1.28;
      const totalH = floors * fh + 0.8;

      const core = new THREE.Mesh(this.geo.towerCore5, this.mat.wallWhite);
      core.position.set(0, 0.8 + (floors * fh) / 2, -0.3);
      const brickSpine = new THREE.Mesh(new THREE.BoxGeometry(1.15, floors * fh + 0.4, 0.42), this.mat.brickRed);
      brickSpine.position.set(-0.35, 0.8 + (floors * fh) / 2 + 0.15, 1.85);
      g.add(core, brickSpine);

      for (let f = 0; f < floors; f++) {
        const y = 0.9 + f * fh;
        const slab = new THREE.Mesh(this.geo.towerSlab, this.mat.wallWhite);
        slab.position.set(0, y, 2.02);
        const winL = new THREE.Mesh(this.geo.towerWinL, winMat);
        winL.position.set(-1.55, y + 0.5, 1.78);
        winL.userData.isWindow = true;
        const railL = new THREE.Mesh(this.geo.towerRailL, this.mat.glass);
        railL.position.set(-1.55, y + 0.26, 2.38);
        const winR = new THREE.Mesh(this.geo.towerWinR, winMat);
        winR.position.set(1.2, y + 0.5, 1.78);
        winR.userData.isWindow = true;
        const plantR = new THREE.Mesh(this.geo.towerPlantR, this.mat.balconyPlant);
        plantR.position.set(1.2, y + 0.22, 2.34);
        g.add(slab, winL, railL, winR, plantR);
      }
      g.userData.labelY = totalH + 2.0;
      return g;
    }

    if (type === "tower_cube") {
      const floors = 5;
      const fh = 1.32;
      const totalH = floors * fh + 0.6;
      const core = new THREE.Mesh(new THREE.BoxGeometry(3.8, totalH, 3.8), this.mat.darkGlass);
      core.position.set(0, totalH / 2 + 0.1, -0.2);
      g.add(core);

      for (let f = 0; f < floors; f++) {
        const y = 0.75 + f * fh;
        const shiftX = f % 2 === 0 ? -0.55 : 0.55;
        const cube = new THREE.Mesh(this.geo.cubeBlock, f % 2 === 0 ? this.mat.wallWarmStone : this.mat.wallWhite);
        cube.position.set(shiftX, y, f % 3 === 0 ? 0.4 : -0.1);
        const glassCorner = new THREE.Mesh(this.geo.cubeGlass, winMat);
        glassCorner.position.set(-shiftX * 1.15, y, 1.78);
        glassCorner.userData.isWindow = true;
        const balc = new THREE.Mesh(this.geo.cubeBalc, this.mat.wallWhite);
        balc.position.set(-shiftX * 1.15, y - fh * 0.4, 2.02);
        g.add(cube, glassCorner, balc);
      }
      g.userData.labelY = totalH + 2.2;
      return g;
    }

    if (type === "tower_led") {
      const floors = 5;
      const fh = 1.42;
      const totalH = floors * fh + 0.5;

      const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, totalH, 4.2), this.mat.wallCream);
      body.position.set(0, totalH / 2 + 0.1, -0.2);
      const stonePillar = new THREE.Mesh(new THREE.BoxGeometry(1.05, totalH + 0.25, 0.55), this.mat.stoneDark);
      stonePillar.position.set(-1.85, totalH / 2 + 0.18, 2.02);
      const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, totalH - 0.3, 0.12), this.mat.ledStripNight);
      ledStrip.position.set(-1.85, totalH / 2 + 0.18, 2.31);
      const woodPanel = new THREE.Mesh(new THREE.BoxGeometry(0.9, totalH - 0.5, 0.35), this.mat.darkWood);
      woodPanel.position.set(-0.85, totalH / 2 + 0.1, 1.98);
      g.add(body, stonePillar, ledStrip, woodPanel);

      for (let f = 0; f < floors; f++) {
        const y = 0.85 + f * fh;
        const frame = new THREE.Mesh(this.geo.ledFrame, this.mat.wallWhite);
        frame.position.set(0.95, y - 0.52, 2.15);
        const win = new THREE.Mesh(this.geo.ledWin, winMat);
        win.position.set(0.95, y, 1.92);
        win.userData.isWindow = true;
        const rail = new THREE.Mesh(this.geo.ledRail, this.mat.glass);
        rail.position.set(0.95, y - 0.24, 2.52);
        const bush = new THREE.Mesh(this.geo.ledBush, this.mat.balconyPlant);
        bush.position.set(1.85, y - 0.24, 2.32);
        g.add(frame, win, rail, bush);
      }
      g.userData.labelY = totalH + 2.1;
      return g;
    }

    if (type === "tower_gold") {
      const floors = 6;
      const fh = 1.28;
      const totalH = floors * fh + 0.5;
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, totalH, 4.2), this.mat.charcoal);
      body.position.set(0, totalH / 2 + 0.1, -0.2);
      g.add(body);

      for (let f = 0; f < floors; f++) {
        const y = 0.85 + f * fh;
        const goldTrim = new THREE.Mesh(this.geo.goldTrim, this.mat.gold);
        goldTrim.position.set(0, y - 0.5, -0.15);
        const wrapWin = new THREE.Mesh(this.geo.goldWin, winMat);
        wrapWin.position.set(0, y, 1.94);
        wrapWin.userData.isWindow = true;
        g.add(goldTrim, wrapWin);
      }
      g.userData.labelY = totalH + 2.2;
      return g;
    }

    // --- LOCAL TEA & TIFFIN SHOP ---
    if (type === "cafe") {
      // Warm Wood & Cream Entrance Coffee Cafe + Giant 3D Coffee Cup on Roof + Outdoor Umbrella Table!
      const body = new THREE.Mesh(new THREE.BoxGeometry(5.0, 3.0, 4.2), this.mat.cafeBrown);
      body.position.set(0, 1.55, -0.3);
      const upperBand = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.55, 4.4), this.mat.cafeCream);
      upperBand.position.set(0, 3.1, -0.3);
      const awning = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.22, 1.5), this.mat.terracottaRoof);
      awning.position.set(0, 2.45, 2.35);
      awning.rotation.x = 0.25;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.8, 0.12), winMat);
      glass.position.set(0, 1.15, 1.82);
      glass.userData.isWindow = true;

      // Giant 3D Rooftop Coffee Cup Sculpture!
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.52, 1.15, 10), this.mat.wallWhite);
      cup.position.set(0, 3.95, -0.2);
      const coffeeTop = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 10), this.mat.cafeBrown);
      coffeeTop.position.set(0, 4.5, -0.2);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 6, 10), this.mat.wallWhite);
      handle.position.set(0.66, 3.95, -0.2);

      // Outdoor Sidewalk Cafe Table & Umbrella
      const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.14, 0.65, 8), this.mat.teakWood);
      tbl.position.set(1.5, 0.36, 2.65);
      const umbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 5), this.mat.wallWhite);
      umbPole.position.set(1.5, 1.15, 2.65);
      const umbTop = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.35, 8), this.mat.petrolYellow);
      umbTop.position.set(1.5, 2.1, 2.65);

      const cafeBoard = this._makeBuildingBoard("COFFEE CAFE", "FRESH BREW • SNACKS", "#451a03", "#fde047", 4.4, 0.72);
      cafeBoard.position.set(0, 3.1, 1.92);

      g.add(body, upperBand, awning, glass, cup, coffeeTop, handle, tbl, umbPole, umbTop, cafeBoard);
      g.userData.labelY = 5.6;
      return g;
    }

    if (type === "shop") {
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.8, 4.2), this.mat.wallGold);
      base.position.y = 1.45;
      const awning = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.35, 1.4), this.mat.petrolRed);
      awning.position.set(0, 2.3, 2.3);
      awning.rotation.x = 0.25;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.3, 0.12), winMat);
      glass.position.set(0, 1.1, 2.12);
      glass.userData.isWindow = true;
      g.add(base, awning, glass);
      g.userData.labelY = 4.6;
      return g;
    }

    // --- REALISTIC INDIAN ARCHITECTURAL HOUSES (NO MORE PLAIN BOXES! SHARED GEOS FOR LOW-END SMOOTHNESS) ---
    // Helper: Compound wall + gate pillars + front potted plants
    const addCompoundAndYard = (wallMat) => {
      const cwBack = new THREE.Mesh(this.geo.compWallBack, wallMat);
      cwBack.position.set(0, 0.36, -3.05);
      const cwL = new THREE.Mesh(this.geo.compWallSide, wallMat);
      cwL.position.set(-3.15, 0.36, 0);
      const cwR = new THREE.Mesh(this.geo.compWallSide, wallMat);
      cwR.position.set(3.15, 0.36, 0);
      const cwFL = new THREE.Mesh(this.geo.compWallFront, wallMat);
      cwFL.position.set(-2.12, 0.36, 3.05);
      const cwFR = new THREE.Mesh(this.geo.compWallFront, wallMat);
      cwFR.position.set(2.12, 0.36, 3.05);
      const pilL = new THREE.Mesh(this.geo.gatePillar, this.mat.plinthGrey);
      pilL.position.set(-0.98, 0.5, 3.05);
      const pilR = new THREE.Mesh(this.geo.gatePillar, this.mat.plinthGrey);
      pilR.position.set(0.98, 0.5, 3.05);
      const bushL = new THREE.Mesh(this.geo.frontBush, this.mat.balconyPlant);
      bushL.position.set(-2.35, 0.42, 2.55);
      const bushR = new THREE.Mesh(this.geo.frontBush, this.mat.balconyPlant);
      bushR.position.set(2.35, 0.42, 2.55);
      g.add(cwBack, cwL, cwR, cwFL, cwFR, pilL, pilR, bushL, bushR);
    };

    // Helper: Recessed framed window + concrete sunshade chajja
    const addWindowWithChajja = (x, y, z) => {
      const frame = new THREE.Mesh(this.geo.winFrameGeo, this.mat.winFrame);
      frame.position.set(x, y, z);
      const glass = new THREE.Mesh(this.geo.win, winMat);
      glass.position.set(x, y, z + 0.03);
      glass.userData.isWindow = true;
      const chajja = new THREE.Mesh(this.geo.chajjaGeo, this.mat.wallWhite);
      chajja.position.set(x, y + 0.54, z + 0.18);
      g.add(frame, glass, chajja);
    };

    // Raised stone foundation plinth + entrance steps
    const plinth = new THREE.Mesh(this.geo.plinthGeo, this.mat.plinthGrey);
    plinth.position.set(0, 0.22, -0.35);
    const steps = new THREE.Mesh(this.geo.stepGeo, this.mat.concrete);
    steps.position.set(0, 0.14, 2.1);
    const pathway = new THREE.Mesh(this.geo.pathway, this.mat.sidewalk);
    pathway.position.set(0, 0.09, 2.65);
    g.add(plinth, steps, pathway);

    // STYLE A: Ivory & Slate Modern Villa (`house_blue`)
    if (type === "house_blue") {
      addCompoundAndYard(this.mat.stuccoIvory);
      const body = new THREE.Mesh(this.geo.houseBody1, this.mat.stuccoIvory);
      body.position.set(0, 1.65, -0.35);
      const accentBand = new THREE.Mesh(new THREE.BoxGeometry(4.62, 0.32, 4.32), this.mat.slateTrim);
      accentBand.position.set(0, 2.95, -0.35);
      const parapet = new THREE.Mesh(this.geo.parapet, this.mat.wallWhite);
      parapet.position.set(0, 3.22, -0.35);

      // Veranda porch + 2 front columns + teak door
      const porch = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 1.15), this.mat.slateTrim);
      porch.position.set(0, 2.55, 2.15);
      const colL = new THREE.Mesh(this.geo.verandaCol, this.mat.wallWhite);
      colL.position.set(-0.95, 1.4, 2.55);
      const colR = new THREE.Mesh(this.geo.verandaCol, this.mat.wallWhite);
      colR.position.set(0.95, 1.4, 2.55);
      const door = new THREE.Mesh(this.geo.door, this.mat.teakWood);
      door.position.set(0, 1.12, 1.78);

      addWindowWithChajja(-1.45, 1.65, 1.76);
      addWindowWithChajja(1.45, 1.65, 1.76);

      // Rooftop staircase mumty + black Sintex water tank!
      const mumty = new THREE.Mesh(this.geo.mumty, this.mat.stuccoIvory);
      mumty.position.set(-1.1, 3.78, -1.25);
      const tank = new THREE.Mesh(this.geo.sintexTank, this.mat.tankBlack);
      tank.position.set(-1.1, 4.55, -1.25);

      g.add(body, accentBand, parapet, porch, colL, colR, door, mumty, tank);
      g.userData.labelY = 5.7;
      return g;
    }

    // STYLE B: Terracotta & Cream Duplex with Sloped Tiled Roof (`house_coral`)
    if (type === "house_coral") {
      addCompoundAndYard(this.mat.stuccoCream);
      const body = new THREE.Mesh(this.geo.houseBody1, this.mat.stuccoCream);
      body.position.set(0, 1.65, -0.35);
      const brickPillar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.65, 0.32), this.mat.brickRed);
      brickPillar.position.set(-1.75, 1.72, 1.82);

      // Sloped Terracotta Mangalore-Tile Roof!
      const roof = new THREE.Mesh(this.geo.slopedRoof, this.mat.terracottaRoof);
      roof.position.set(0, 3.48, -0.35);
      roof.rotation.y = Math.PI / 4;

      const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 1.1), this.mat.terracottaRoof);
      porchRoof.position.set(0.35, 2.38, 2.15);
      porchRoof.rotation.x = 0.16;

      const door = new THREE.Mesh(this.geo.door, this.mat.darkWood);
      door.position.set(0.35, 1.12, 1.78);

      addWindowWithChajja(-0.9, 1.65, 1.76);
      addWindowWithChajja(1.55, 1.65, 1.76);

      g.add(body, brickPillar, roof, porchRoof, door);
      g.userData.labelY = 5.4;
      return g;
    }

    // STYLE C: Sage & Teak Courtyard House (`house_mint`)
    if (type === "house_mint") {
      addCompoundAndYard(this.mat.stuccoSage);
      const body = new THREE.Mesh(this.geo.houseBody1, this.mat.stuccoSage);
      body.position.set(0, 1.65, -0.35);
      const teakPanel = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.55, 0.22), this.mat.teakWood);
      teakPanel.position.set(1.4, 1.68, 1.8);
      const cornice = new THREE.Mesh(this.geo.parapet, this.mat.warmTaupe);
      cornice.position.set(0, 3.05, -0.35);

      const porch = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 1.0), this.mat.wallWhite);
      porch.position.set(-0.35, 2.38, 2.15);
      const door = new THREE.Mesh(this.geo.door, this.mat.teakWood);
      door.position.set(-0.35, 1.12, 1.78);

      addWindowWithChajja(-1.55, 1.65, 1.76);
      addWindowWithChajja(1.4, 1.65, 1.88);

      const mumty = new THREE.Mesh(this.geo.mumty, this.mat.stuccoCream);
      mumty.position.set(1.1, 3.62, -1.2);
      const tank = new THREE.Mesh(this.geo.sintexTank, this.mat.tankBlack);
      tank.position.set(1.1, 4.4, -1.2);

      g.add(body, teakPanel, cornice, porch, door, mumty, tank);
      g.userData.labelY = 5.6;
      return g;
    }

    // STYLE D: Sandstone & Wood 2-Story Luxury Duplex (`house_gold`)
    addCompoundAndYard(this.mat.stuccoSandstone);
    const body = new THREE.Mesh(this.geo.houseBody2, this.mat.stuccoSandstone);
    body.position.set(0, 2.3, -0.35);

    const stoneCol = new THREE.Mesh(new THREE.BoxGeometry(0.95, 4.1, 0.36), this.mat.warmTaupe);
    stoneCol.position.set(-1.78, 2.42, 1.82);

    const midSlab = new THREE.Mesh(new THREE.BoxGeometry(4.85, 0.18, 4.75), this.mat.wallWhite);
    midSlab.position.set(0, 2.45, -0.15);
    const topSlab = new THREE.Mesh(this.geo.parapet, this.mat.slateTrim);
    topSlab.position.set(0, 4.35, -0.35);

    // 1st Floor Glass Balcony Railing
    const balcRail = new THREE.Mesh(this.geo.balconyRail, this.mat.glass);
    balcRail.position.set(0.75, 2.78, 2.18);

    const door = new THREE.Mesh(this.geo.door, this.mat.darkWood);
    door.position.set(0.15, 1.12, 1.78);

    // Ground & First Floor Windows with Chajjas
    addWindowWithChajja(1.45, 1.5, 1.76);
    addWindowWithChajja(-0.55, 3.35, 1.76);
    addWindowWithChajja(1.3, 3.35, 1.76);

    const mumty = new THREE.Mesh(this.geo.mumty, this.mat.stuccoIvory);
    mumty.position.set(-1.1, 4.92, -1.25);
    const tank = new THREE.Mesh(this.geo.sintexTank, this.mat.tankBlack);
    tank.position.set(-1.1, 5.7, -1.25);

    g.add(body, stoneCol, midSlab, topSlab, balcRail, door, mumty, tank);
    g.userData.labelY = 6.8;
    return g;
  }

  // 8-PLOT MEGA CRICKET STADIUM

  /**
   * 🚘 REALISTIC 3D AUDI LUXURY CAR MODEL (R8 Supercar / RS7 / e-tron GT / Q8 SUV)
   * Features: 4 tires with silver/gold alloy rims, sculpted hood, hexagonal Audi grille,
   * sharp white LED DRL headlights, rear red LED lightbar, sloped windshield & spoiler/roof rails!
   */
  _makeRealAudiCarMesh(bodyMat, isSUV = false) {
    const car = new THREE.Group();
    const len = isSUV ? 4.3 : 4.05;
    const w = isSUV ? 1.88 : 1.78;
    const bodyH = isSUV ? 0.74 : 0.54;

    // 4 Realistic Alloy Wheels
    const wheelR = isSUV ? 0.36 : 0.31;
    const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.24, 10);
    wheelGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(wheelR * 0.58, wheelR * 0.58, 0.26, 8);
    rimGeo.rotateZ(Math.PI / 2);
    [[-w / 2 + 0.04, 1.25], [w / 2 - 0.04, 1.25], [-w / 2 + 0.04, -1.2], [w / 2 - 0.04, -1.2]].forEach(([wx, wz]) => {
      const tire = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
      tire.position.set(wx, wheelR, wz);
      const rim = new THREE.Mesh(rimGeo, this.mat.rimSilver);
      rim.position.set(wx, wheelR, wz);
      car.add(tire, rim);
    });

    // Lower Aerodynamic Body + Sculpted Sloped Hood
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(w, bodyH, len), bodyMat);
    chassis.position.set(0, wheelR + bodyH / 2 - 0.05, 0);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(w - 0.14, 0.18, 1.35), bodyMat);
    hood.position.set(0, wheelR + bodyH + 0.02, 1.22);
    hood.rotation.x = 0.08;

    // Greenhouse Cabin (Sleek Coupe vs Tall Q8 SUV)
    const cabH = isSUV ? 0.64 : 0.46;
    const cabLen = isSUV ? 2.15 : 1.55;
    const cabZ = isSUV ? -0.35 : -0.18;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(w - 0.26, cabH, cabLen), this.mat.audiGlass);
    cab.position.set(0, wheelR + bodyH + cabH / 2 - 0.06, cabZ);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.09, cabLen - 0.22), bodyMat);
    roof.position.set(0, wheelR + bodyH + cabH - 0.04, cabZ);

    // Side Mirrors
    [-w / 2 - 0.08, w / 2 + 0.08].forEach((mx) => {
      const mir = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.18), bodyMat);
      mir.position.set(mx, wheelR + bodyH + 0.1, 0.55);
      car.add(mir);
    });

    // Iconic Audi Hexagonal Singleframe Grille + Mini Chrome Strip
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.34, 0.1), this.mat.charcoal);
    grille.position.set(0, wheelR + 0.2, len / 2 + 0.02);
    const grilleTrim = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.12), this.mat.chrome);
    grilleTrim.position.set(0, wheelR + 0.28, len / 2 + 0.03);

    // Sharp White Audi LED DRL Headlights + Continuous Rear Red LED Lightbar
    const drlGeo = new THREE.BoxGeometry(0.36, 0.1, 0.08);
    const drlL = new THREE.Mesh(drlGeo, this.mat.studioFlash);
    drlL.position.set(-0.62, wheelR + 0.32, len / 2 + 0.02);
    const drlR = drlL.clone();
    drlR.position.x = 0.62;

    const rearBar = new THREE.Mesh(new THREE.BoxGeometry(w - 0.18, 0.12, 0.08), this.mat.taillight);
    rearBar.position.set(0, wheelR + 0.38, -len / 2 - 0.02);

    // Sport Rear Spoiler (Coupe) or Roof Rails (Q8 SUV)
    if (!isSUV) {
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, 0.08, 0.32), this.mat.charcoal);
      spoiler.position.set(0, wheelR + bodyH + 0.22, -len / 2 + 0.22);
      car.add(spoiler);
    } else {
      [-0.62, 0.62].forEach((rx) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 1.7), this.mat.chrome);
        rail.position.set(rx, wheelR + bodyH + cabH + 0.04, cabZ);
        car.add(rail);
      });
    }

    car.add(chassis, hood, cab, roof, grille, grilleTrim, drlL, drlR, rearBar);
    return car;
  }

  /**
   * 🚘 8-PLOT MEGA AUDI LUXURY CAR SHOWROOM (`audi_showroom`)
   * Features: Panoramic silver-and-glass showroom hall, iconic 3D 4 Interlocking Chrome Audi Rings,
   * rotating glass display turntable, 6 real detailed 3D Audi models, and animated visitors/managers!
   */
  _buildEightPlotAudiShowroom(plotId, ownerName = "") {
    const g = new THREE.Group();

    // Sleek Polished Dark Showroom Floor & Front Outdoor VIP Display Apron
    const floorIndoor = new THREE.Mesh(new THREE.BoxGeometry(31.5, 0.16, 8.8), this.mat.marble);
    floorIndoor.position.set(0, 0.32, -2.4);
    const apronOutdoor = new THREE.Mesh(new THREE.BoxGeometry(32.0, 0.12, 5.4), this.mat.tarmacGrey);
    apronOutdoor.position.set(0, 0.3, 4.7);

    // Architectural Rear Wall + Silver Aluminum Pillars + Glass Curtain Front Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(31.5, 6.2, 0.6), this.mat.audiBlack);
    backWall.position.set(0, 3.4, -6.5);
    const sideWallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 8.8), this.mat.audiSilver);
    sideWallL.position.set(-15.5, 3.4, -2.4);
    const sideWallR = sideWallL.clone();
    sideWallR.position.x = 15.5;

    // Clear Glass Panoramic Windows on Front (so all 4 indoor Audi cars & rotating turntable shine through!)
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(30.6, 5.4, 0.14), this.mat.glass);
    frontGlass.position.set(0, 3.1, 1.9);

    // Sweeping Modern Cantilevered Silver Roof + Dark Fascia + Red Audi Sport Accent Stripe
    const roof = new THREE.Mesh(new THREE.BoxGeometry(32.8, 0.75, 11.4), this.mat.audiSilver);
    roof.position.set(0, 6.85, -1.5);
    const fascia = new THREE.Mesh(new THREE.BoxGeometry(33.0, 1.05, 0.35), this.mat.audiBlack);
    fascia.position.set(0, 6.95, 4.15);
    const redStripe = new THREE.Mesh(new THREE.BoxGeometry(33.1, 0.2, 0.38), this.mat.audiRed);
    redStripe.position.set(0, 6.38, 4.16);

    // Front Support Columns
    [-14.5, -5.2, 5.2, 14.5].forEach((cx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 6.4, 8), this.mat.audiSilver);
      col.position.set(cx, 3.5, 3.8);
      g.add(col);
    });

    // ICONIC 3D FOUR INTERLOCKING CHROME AUDI RINGS on the Rooftop Pedestal!
    const ringsGroup = new THREE.Group();
    ringsGroup.position.set(0, 8.75, 3.6);
    const ringGeo = new THREE.TorusGeometry(0.92, 0.14, 8, 20);
    [-2.1, -0.7, 0.7, 2.1].forEach((rx) => {
      const ring = new THREE.Mesh(ringGeo, this.mat.audiSilver);
      ring.position.x = rx;
      ringsGroup.add(ring);
    });
    const ringPedestal = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.45, 0.9), this.mat.audiBlack);
    ringPedestal.position.set(0, 7.55, 3.6);
    g.add(ringsGroup, ringPedestal);

    // Mounted Facade Signboard ("AUDI SHOWROOM" + Owner Name!)
    const subTxt = ownerName ? `${ownerName.toUpperCase()} • LUXURY MOTORS` : "LUXURY MOTORS • 8 PLOTS";
    const audiBoard = this._makeBuildingBoard("AUDI SHOWROOM", subTxt, "#09090b", "#ef4444", 12.6, 1.35);
    audiBoard.position.set(-8.6, 6.98, 4.36);
    const audiBoardR = this._makeBuildingBoard("QUATTRO • R8 • Q8", "TEST DRIVE LIVE", "#09090b", "#e2e8f0", 8.8, 1.25);
    audiBoardR.position.set(9.4, 6.98, 4.36);

    // 1. ROTATING CENTER DISPLAY TURNTABLE + PEARL WHITE AUDI R8 SUPERCAR!
    const turntable = new THREE.Group();
    turntable.position.set(0, 0.42, -2.0);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.22, 20), this.mat.audiBlack);
    const ledRing = new THREE.Mesh(new THREE.RingGeometry(3.05, 3.35, 24), this.mat.studioCyan);
    ledRing.rotation.x = -Math.PI / 2;
    ledRing.position.y = 0.13;
    const heroR8 = this._makeRealAudiCarMesh(this.mat.audiWhite, false);
    heroR8.position.set(0, 0.12, 0);
    turntable.add(disc, ledRing, heroR8);
    g.add(turntable);
    this.turntableRotors.push({ plotId, mesh: turntable, speed: 0.75 });

    // 2. 3 MORE REAL AUDI CARS INSIDE THE GLASS SHOWROOM
    const carRedR8 = this._makeRealAudiCarMesh(this.mat.audiRed, false);
    carRedR8.position.set(-9.5, 0.4, -2.2);
    carRedR8.rotation.y = 0.45;

    const carBlueEtron = this._makeRealAudiCarMesh(this.mat.audiBlue, false);
    carBlueEtron.position.set(9.5, 0.4, -2.2);
    carBlueEtron.rotation.y = -0.45;

    const carSilverQ8 = this._makeRealAudiCarMesh(this.mat.audiSilver, true);
    carSilverQ8.position.set(-12.6, 0.4, -2.2);
    carSilverQ8.rotation.y = 0.25;

    // 3. 2 VIP TEST-DRIVE AUDI CARS PARKED OUTDOOR IN FRONT!
    const carBlackRS7 = this._makeRealAudiCarMesh(this.mat.audiBlack, false);
    carBlackRS7.position.set(-8.2, 0.36, 4.9);
    carBlackRS7.rotation.y = Math.PI / 2 - 0.2;

    const carGoldRS6 = this._makeRealAudiCarMesh(this.mat.richGoldTrim, true);
    carGoldRS6.position.set(8.2, 0.36, 4.9);
    carGoldRS6.rotation.y = -Math.PI / 2 + 0.2;

    g.add(carRedR8, carBlueEtron, carSilverQ8, carBlackRS7, carGoldRS6);

    // Showroom Staff & Visitors admiring the Audi fleet
    const mgr = this._createCharacter({ shirtMat: this.mat.audiBlack, pantsMat: this.mat.darkPants, scale: 0.96 });
    g.add(mgr);
    this.landmarkActors.push({ plotId, mesh: mgr, mode: "patrol_x", baseX: 0, baseZ: 3.4, range: 4.5, speed: 1.1, phase: 0 });

    const buyer = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.96 });
    g.add(buyer);
    this.landmarkActors.push({ plotId, mesh: buyer, mode: "patrol_x", baseX: -8.5, baseZ: 6.4, range: 2.6, speed: 1.2, phase: 1.6 });

    g.add(floorIndoor, apronOutdoor, backWall, sideWallL, sideWallR, frontGlass, roof, fascia, redStripe, audiBoard, audiBoardR);
    g.userData.labelY = 11.4;
    return g;
  }

  /**
   * 📸 2-PLOT BUILDING BUILDER: FOLLOWER PHOTO STUDIO (`photo_studio`)
   * Features: 14.6 x 7.2 road-facing modern studio, Giant 3D DSLR Camera Sculpture on roof,
   * personalized Follower @username storefront signboard, glass window showing studio backdrop,
   * flashing softbox lights, tripod camera, photographer & posing model!
   */
  _buildTwoPlotBuilding(type, plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;

    // Main Modern Studio Structure (13.4 wide x 4.4 tall x 5.6 deep)
    const body = new THREE.Mesh(new THREE.BoxGeometry(13.4, 4.4, 5.4), this.mat.charcoal);
    body.position.set(0, 2.25, -0.5);

    const creamWing = new THREE.Mesh(new THREE.BoxGeometry(4.4, 4.5, 5.6), this.mat.stuccoIvory);
    creamWing.position.set(-4.6, 2.3, -0.45);

    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.42, 6.2), this.mat.slateTrim);
    roofSlab.position.set(0, 4.65, -0.3);

    const neonBar = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.16, 0.2), this.mat.studioCyan);
    neonBar.position.set(0, 4.42, 2.82);

    // Wide Clear Glass Studio Display Window (Right & Center) + Entrance Door (Left)
    const studioGlass = new THREE.Mesh(new THREE.BoxGeometry(7.8, 3.1, 0.12), this.mat.glass);
    studioGlass.position.set(2.1, 1.8, 2.22);

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.16), this.mat.teakWood);
    door.position.set(-4.6, 1.35, 2.36);
    const winSide = new THREE.Mesh(this.geo.win, winMat);
    winSide.position.set(-4.6, 3.3, 2.38);
    winSide.userData.isWindow = true;

    // GIANT 3D DSLR CAMERA SCULPTURE MOUNTED ON THE STUDIO ROOF!
    const camGroup = new THREE.Group();
    camGroup.position.set(-4.4, 5.75, 0.2);
    const camBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.65, 1.15), this.mat.audiBlack);
    const camGrip = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.68, 1.32), this.mat.charcoal);
    camGrip.position.set(-1.1, 0, 0.1);
    const camPrism = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 0.95), this.mat.audiBlack);
    camPrism.position.set(0.1, 1.05, 0);
    const shutterBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 8), this.mat.audiRed);
    shutterBtn.position.set(-0.95, 0.9, 0.15);
    const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.72, 1.05, 14), this.mat.charcoal);
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.set(0.15, -0.05, 0.85);
    const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.06, 6, 16), this.mat.richGoldTrim);
    lensRing.position.set(0.15, -0.05, 1.25);
    const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.08, 12), this.mat.oceanDeep);
    lensGlass.rotation.x = Math.PI / 2;
    lensGlass.position.set(0.15, -0.05, 1.38);
    camGroup.add(camBody, camGrip, camPrism, shutterBtn, lensBarrel, lensRing, lensGlass);

    // PERSONALIZED FOLLOWER PHOTO STUDIO SIGNBOARD (shows follower's exact name!)
    const cleanName = (ownerName || "PRO PHOTO").replace(/^@/, "").toUpperCase();
    const titleStr = cleanName.length > 12 ? cleanName.slice(0, 12) : `${cleanName} STUDIO`;
    const studioBoard = this._makeBuildingBoard(titleStr, "PHOTO • VIDEO • DRONE 4K", "#0f172a", "#22d3ee", 8.4, 1.25);
    studioBoard.position.set(2.1, 4.95, 2.86);

    // INTERIOR STUDIO SCENE (Visible right through the glass window + outdoor photoshoot bay!)
    const backdrop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.9, 0.12), this.mat.wallWhite);
    backdrop.position.set(4.2, 1.65, -0.6);

    // 2 Studio Softbox Lights on Tripods + Periodic Animated Camera Flash!
    const flashBulb = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.25), this.mat.studioFlash);
    flashBulb.position.set(2.2, 2.35, 0.65);
    flashBulb.rotation.y = Math.PI / 4;
    const stand1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.2, 5), this.mat.charcoal);
    stand1.position.set(2.2, 1.15, 0.65);
    this.studioFlashes.push({ plotId, mesh: flashBulb, phase: Math.random() * 6 });

    // Photographer with Tripod Camera + Posing Model right in front of the studio!
    const tripod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.25, 1.2, 4), this.mat.charcoal);
    tripod.position.set(0.6, 0.65, 2.95);
    const miniCam = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.35), this.mat.audiBlack);
    miniCam.position.set(0.6, 1.35, 2.95);

    const photog = this._createCharacter({ shirtMat: this.mat.charcoal, pantsMat: this.mat.darkPants, scale: 0.92 });
    photog.position.set(-0.15, 0.14, 2.95);
    photog.rotation.y = Math.PI / 2;

    const model = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.wallBlue, scale: 0.92 });
    g.add(model);
    this.landmarkActors.push({ plotId, mesh: model, mode: "guard", baseX: 2.8, baseZ: 2.95, range: 0.4, speed: 1.8, phase: 0 });

    g.add(body, creamWing, roofSlab, neonBar, studioGlass, door, winSide, camGroup, studioBoard, backdrop, stand1, flashBulb, tripod, miniCam, photog);
    g.userData.labelY = 7.8;
    return g;
  }

  _buildEightPlotCricketStadium(plotId) {
    const g = new THREE.Group();

    const pitch = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.08, 2.2), this.mat.pitch);
    pitch.position.set(0, 0.28, 0.4);

    const boundary = new THREE.Mesh(new THREE.RingGeometry(5.6, 5.9, 32), this.mat.stripe);
    boundary.rotation.x = -Math.PI / 2;
    boundary.scale.set(2.15, 1.0, 1.0);
    boundary.position.set(0, 0.29, 0.4);

    [-3.8, 3.8].forEach((wx) => {
      const stump = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.52), this.mat.wood);
      stump.position.set(wx, 0.56, 0.4);
      g.add(stump);
    });

    const standN1 = new THREE.Mesh(new THREE.BoxGeometry(24.0, 1.4, 2.2), this.mat.wallWhite);
    standN1.position.set(0, 0.9, -6.2);
    const standN2 = new THREE.Mesh(new THREE.BoxGeometry(24.0, 2.6, 1.2), this.mat.wallBlue);
    standN2.position.set(0, 1.5, -6.8);
    const roofN = new THREE.Mesh(new THREE.BoxGeometry(25.0, 0.28, 3.0), this.mat.navy);
    roofN.position.set(0, 3.6, -6.2);

    const sbPole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 0.4), this.mat.lampPole);
    sbPole.position.set(-14.8, 2.2, 0.4);
    const sbScreen = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.4, 5.2), this.mat.highway);
    sbScreen.position.set(-14.6, 4.2, 0.4);
    const sbGlow = this._makeBuildingBoard("DREAM CITY 184/3", "OVERS 18.2 • LIVE MATCH", "#0f172a", "#4ade80", 4.6, 1.9);
    sbGlow.rotation.y = Math.PI / 2;
    sbGlow.position.set(-14.55, 4.2, 0.4);

    [[-15.2, -6.4], [0, -6.8], [15.2, -6.4], [-15.2, 6.4], [0, 6.8], [15.2, 6.4]].forEach(([fx, fz]) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 7.6, 5), this.mat.lampPole);
      tower.position.set(fx, 3.9, fz);
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 0.28), this.mat.lampBulbDay);
      bulb.position.set(fx, 7.6, fz);
      bulb.lookAt(0, 0, 0);
      this.lampBulbs.push(bulb);
      g.add(tower, bulb);
    });

    const bat1 = this._createCharacter({ shirtMat: this.mat.jerseyBlue, pantsMat: this.mat.wallWhite, scale: 0.9, hasBat: true });
    g.add(bat1);
    this.landmarkActors.push({ plotId, mesh: bat1, mode: "hop", baseX: 3.3, baseZ: 0.4, range: 0.2, speed: 4.0, phase: 0 });

    const bat2 = this._createCharacter({ shirtMat: this.mat.jerseyBlue, pantsMat: this.mat.wallWhite, scale: 0.9, hasBat: true });
    g.add(bat2);
    this.landmarkActors.push({ plotId, mesh: bat2, mode: "hop", baseX: -3.2, baseZ: 1.1, range: 0.15, speed: 3.2, phase: 1.2 });

    const bowler = this._createCharacter({ shirtMat: this.mat.jerseyRed, pantsMat: this.mat.wallWhite, scale: 0.9 });
    g.add(bowler);
    this.landmarkActors.push({ plotId, mesh: bowler, mode: "patrol_x", baseX: -5.4, baseZ: 0.4, range: 1.8, speed: 3.2, phase: 0.5 });

    const keeper = this._createCharacter({ shirtMat: this.mat.jerseyYellow, pantsMat: this.mat.darkPants, scale: 0.88 });
    g.add(keeper);
    this.landmarkActors.push({ plotId, mesh: keeper, mode: "guard", baseX: 5.2, baseZ: 0.4, range: 0.1, speed: 2.0, phase: 0 });

    const fielders = [[-9.5, -2.8], [-9.5, 3.6], [0, 4.6], [8.5, -3.2], [9.2, 3.8], [12.0, 0.4]];
    fielders.forEach(([fx, fz], idx) => {
      const kid = this._createCharacter({
        shirtMat: idx % 2 === 0 ? this.mat.jerseyYellow : this.mat.jerseyRed,
        pantsMat: this.mat.darkPants,
        scale: 0.84
      });
      g.add(kid);
      this.landmarkActors.push({
        plotId, mesh: kid, mode: "orbit",
        baseX: fx, baseZ: fz, range: 1.1, speed: 2.2 + (idx % 2) * 0.5, phase: idx * 1.1
      });
    });

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), this.mat.ballRed);
    g.add(ball);
    this.landmarkActors.push({ plotId, mesh: ball, mode: "ball_x", baseX: 0, baseZ: 0.4, range: 3.5, speed: 3.8, phase: 0 });

    g.add(pitch, boundary, standN1, standN2, roofN, sbPole, sbScreen, sbGlow);
    return g;
  }

  // 4-PLOT GRAND LANDMARKS
  _buildFourPlotLandmark(type, plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;



    // 4-PLOT ITI COLLEGE & TECHNICAL WORKSHOP (`iti_college`)
    if (type === "iti_college") {
      // Main 2-Story Technical Institute Academic Building
      const main = new THREE.Mesh(new THREE.BoxGeometry(12.2, 5.2, 4.4), this.mat.stuccoCream);
      main.position.set(0, 2.65, -4.0);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.42, 5.0), this.mat.navy);
      roof.position.set(0, 5.45, -4.0);

      for (let wx = -4.2; wx <= 4.2; wx += 2.1) {
        const w1 = new THREE.Mesh(this.geo.win, winMat);
        w1.position.set(wx, 1.8, -1.75);
        w1.userData.isWindow = true;
        const w2 = new THREE.Mesh(this.geo.win, winMat);
        w2.position.set(wx, 3.8, -1.75);
        w2.userData.isWindow = true;
        g.add(w1, w2);
      }

      // Technical Workshop Shed (Left Side) with Blue Industrial Roof & Machinery Bay
      const shed = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.2, 5.4), this.mat.concrete);
      shed.position.set(-3.4, 1.65, 2.2);
      const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.35, 5.8), this.mat.itiWorkshop);
      shedRoof.position.set(-3.4, 3.4, 2.2);
      shedRoof.rotation.z = 0.12;
      const bayDoor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 0.14), this.mat.charcoal);
      bayDoor.position.set(-3.4, 1.3, 4.92);

      // Campus Flag Pole + Indian Tricolor Flag (Right Courtyard)
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.8, 6), this.mat.chrome);
      pole.position.set(3.8, 2.9, 1.8);
      const fTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.06), this.mat.roofOrange);
      fTop.position.set(4.55, 5.5, 1.8);
      const fMid = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.06), this.mat.wallWhite);
      fMid.position.set(4.55, 5.22, 1.8);
      const fBot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.06), this.mat.turf);
      fBot.position.set(4.55, 4.94, 1.8);

      // Personalized ITI College Signboard!
      const rawIti = (ownerName || "ITI").trim().toUpperCase();
      const itiSub = rawIti.includes("ITI") ? "TECHNICAL INSTITUTE" : `${rawIti} • TECHNICAL CAMPUS`;
      const itiBoard = this._makeBuildingBoard("ITI COLLEGE", itiSub, "#1e3a8a", "#facc15", 9.6, 1.35);
      itiBoard.position.set(0, 5.1, -1.72);

      // 2 Animated ITI Students in Blue Workshop Uniforms
      const st1 = this._createCharacter({ shirtMat: this.mat.blueUniform, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(st1);
      this.landmarkActors.push({ plotId, mesh: st1, mode: "patrol_x", baseX: 2.2, baseZ: 3.6, range: 2.4, speed: 1.3, phase: 0 });

      const st2 = this._createCharacter({ shirtMat: this.mat.blueUniform, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(st2);
      this.landmarkActors.push({ plotId, mesh: st2, mode: "patrol_z", baseX: 0.6, baseZ: 1.8, range: 2.2, speed: 1.2, phase: 1.8 });

      g.add(main, roof, shed, shedRoof, bayDoor, pole, fTop, fMid, fBot, itiBoard);
      g.userData.labelY = 8.4;
      return g;
    }

    // 4-PLOT PERSONALIZED FOLLOWER FITNESS GYM (Custom Follower Name on Gym Signboard + Live Workouts!)
    if (type === "gym") {
      // Modern Matte-Black & Brushed Concrete Fitness Club Hall
      const mainHall = new THREE.Mesh(new THREE.BoxGeometry(12.6, 5.2, 8.6), this.mat.gymBlack);
      mainHall.position.set(0, 2.65, -1.6);

      const roofCap = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.45, 9.4), this.mat.slateTrim);
      roofCap.position.set(0, 5.45, -1.5);

      // Glowing Neon Orange Energy Strips
      const neonTop = new THREE.Mesh(new THREE.BoxGeometry(13.3, 0.22, 0.28), this.mat.gymOrange);
      neonTop.position.set(0, 5.2, 3.15);
      const neonSideL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 5.0, 0.28), this.mat.gymOrange);
      neonSideL.position.set(-6.32, 2.65, 2.75);
      const neonSideR = neonSideL.clone();
      neonSideR.position.x = 6.32;

      // Clear Panoramic Glass Front Wall (shows inside gym equipment!)
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(11.4, 3.8, 0.14), this.mat.glass);
      frontGlass.position.set(0, 2.1, 2.72);

      // GIANT 3D BARBELL / DUMBBELL SCULPTURE ON THE ROOF!
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 7.6, 8), this.mat.gymSteel);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 6.8, -0.4);
      const pBigGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.38, 12);
      pBigGeo.rotateZ(Math.PI / 2);
      const pMedGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.34, 12);
      pMedGeo.rotateZ(Math.PI / 2);
      [-2.8, 2.8].forEach((px) => {
        const pb = new THREE.Mesh(pBigGeo, this.mat.gymBlack);
        pb.position.set(px, 6.8, -0.4);
        const pm = new THREE.Mesh(pMedGeo, this.mat.gymOrange);
        pm.position.set(px + (px < 0 ? -0.42 : 0.42), 6.8, -0.4);
        g.add(pb, pm);
      });
      [-1.8, 1.8].forEach((sx) => {
        const sup = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.35, 0.32), this.mat.gymSteel);
        sup.position.set(sx, 6.1, -0.4);
        g.add(sup);
      });

      // CUSTOM PERSONALIZED FOLLOWER NAME GYM SIGNBOARDS (Front + Side!)
      const rawName = (ownerName || "FITNESS").trim();
      const dispName = rawName.startsWith("@") ? rawName.toUpperCase() : rawName.toUpperCase();
      const gymTitle = dispName.includes("GYM") ? dispName : `${dispName} GYM`;
      const gymBoard = this._makeBuildingBoard(gymTitle, "FITNESS CLUB • PRO WORKOUT", "#18181b", "#f97316", 10.6, 1.55);
      gymBoard.position.set(0, 4.95, 3.32);
      const sideBoard = this._makeBuildingBoard(gymTitle, "24/7 FITNESS", "#18181b", "#facc15", 6.6, 1.15);
      sideBoard.rotation.y = Math.PI / 2;
      sideBoard.position.set(6.36, 4.1, -1.6);

      // INTERIOR & OUTDOOR GYM EQUIPMENT (Treadmills, Bench Press, Dumbbell Rack, Pull-Up Rig!)
      const rubberMat = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.1, 3.8), this.mat.charcoal);
      rubberMat.position.set(0, 0.16, 4.8);

      // 2 Treadmills (left bay)
      [-4.2, -2.4].forEach((tx) => {
        const tBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 2.2), this.mat.gymBlack);
        tBase.position.set(tx, 0.28, 4.7);
        const tPost = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.35, 0.25), this.mat.gymSteel);
        tPost.position.set(tx, 0.95, 3.75);
        g.add(tBase, tPost);
      });

      // Bench Press + Barbell (center-right)
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 2.1), this.mat.audiRed);
      bench.position.set(1.8, 0.45, 4.7);
      const rackL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.3, 0.14), this.mat.gymSteel);
      rackL.position.set(1.25, 0.85, 4.0);
      const rackR = rackL.clone();
      rackR.position.x = 2.35;
      const miniBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 6), this.mat.gymSteel);
      miniBar.rotation.z = Math.PI / 2;
      miniBar.position.set(1.8, 1.35, 4.0);
      g.add(bench, rackL, rackR, miniBar);

      // Dumbbell Rack (far right)
      const dRack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 0.65), this.mat.gymSteel);
      dRack.position.set(4.6, 0.6, 4.5);
      g.add(dRack);

      // 3 LIVE ANIMATED GYM MEMBERS WORKING OUT (Treadmill Runner + 2 Dumbbell Lifters!)
      const runner = this._createCharacter({ shirtMat: this.mat.gymOrange, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(runner);
      this.landmarkActors.push({ plotId, mesh: runner, mode: "gym_run", baseX: -4.2, baseZ: 4.85, range: 0.2, speed: 9.0, phase: 0 });

      const makeLifter = (lx, lz, shirtMat, phase) => {
        const lifter = this._createCharacter({ shirtMat, pantsMat: this.mat.darkPants, scale: 0.96 });
        const dbGeo = new THREE.BoxGeometry(0.16, 0.16, 0.42);
        const dbL = new THREE.Mesh(dbGeo, this.mat.gymBlack);
        dbL.position.set(-0.34, 0.72, 0.18);
        const dbR = dbL.clone();
        dbR.position.x = 0.34;
        lifter.add(dbL, dbR);
        g.add(lifter);
        this.landmarkActors.push({ plotId, mesh: lifter, mode: "gym_lift", baseX: lx, baseZ: lz, range: 0.22, speed: 4.2, phase });
      };
      makeLifter(0.1, 5.1, this.mat.wallBlue, 0);
      makeLifter(3.8, 5.4, this.mat.wallMint, 1.7);

      g.add(mainHall, roofCap, neonTop, neonSideL, neonSideR, frontGlass, bar, gymBoard, sideBoard, rubberMat);
      g.userData.labelY = 9.0;
      return g;
    }

    if (type === "petrol_bunk") {
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.7, 6.6), this.mat.petrolRed);
      canopy.position.set(0, 4.6, 1.0);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.28, 6.8), this.mat.petrolYellow);
      trim.position.set(0, 4.25, 1.0);

      const pillarGeo = new THREE.CylinderGeometry(0.24, 0.24, 4.4, 6);
      [[-4.6, -1.2], [0, -1.2], [4.6, -1.2], [-4.6, 3.2], [0, 3.2], [4.6, 3.2]].forEach(([px, pz]) => {
        const p = new THREE.Mesh(pillarGeo, this.mat.wallWhite);
        p.position.set(px, 2.2, pz);
        g.add(p);
      });

      [-2.2, 2.2].forEach((px) => {
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.7), this.mat.petrolRed);
        pump.position.set(px, 0.92, 1.0);
        const screen = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.74), this.mat.windowNight);
        screen.position.set(px, 1.38, 1.0);
        g.add(pump, screen);
      });

      const office = new THREE.Mesh(new THREE.BoxGeometry(11.4, 3.4, 3.0), this.mat.wallWhite);
      office.position.set(0, 1.75, -4.8);
      const officeTop = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.45, 3.2), this.mat.petrolRed);
      officeTop.position.set(0, 3.55, -4.8);

      const simCar = this._makeVehicleMesh(false, false, 0x3b82f6, true);
      simCar.rotation.y = Math.PI / 2;
      g.add(simCar);
      const petrolMan1 = this._createCharacter({ shirtMat: this.mat.petrolRed, pantsMat: this.mat.navy, hatColor: 0xfacc15, scale: 1.04 });
      g.add(petrolMan1);
      this.petrolSimulations.push({
        plotId, vehicle: simCar, attendant: petrolMan1,
        laneZ: 2.7, pumpX: -1.8, attendantHomeX: -2.2, attendantHomeZ: 1.6, phaseOffset: 0
      });

      const simBus = this._makeVehicleMesh(true, false, 0xdc2626, true);
      simBus.rotation.y = Math.PI / 2;
      simBus.scale.set(0.92, 0.92, 0.92);
      g.add(simBus);
      const petrolMan2 = this._createCharacter({ shirtMat: this.mat.petrolRed, pantsMat: this.mat.navy, hatColor: 0xfacc15, scale: 1.04 });
      g.add(petrolMan2);
      this.petrolSimulations.push({
        plotId, vehicle: simBus, attendant: petrolMan2,
        laneZ: -0.6, pumpX: 1.8, attendantHomeX: 2.2, attendantHomeZ: 0.4, phaseOffset: 4.5
      });

      const pbBoard = this._makeBuildingBoard("PETROL & DIESEL", "24/7 FUEL PLAZA", "#dc2626", "#facc15", 8.6, 1.1);
      pbBoard.position.set(0, 4.6, 4.35);
      g.add(canopy, trim, office, officeTop, pbBoard);
      g.userData.labelY = 7.4;
      return g;
    }

    // 4-PLOT TRANSPORT OFFICE & AUTO STAND (Real 3-Wheeler Autos + Drivers Cleaning + Autos Driving Out With Passengers!)
    if (type === "auto_stand") {
      // Transport Office Building at Back
      const office = new THREE.Mesh(new THREE.BoxGeometry(11.8, 3.8, 3.4), this.mat.wallCream);
      office.position.set(0, 1.95, -4.6);
      const officeRoof = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.4, 3.8), this.mat.navy);
      officeRoof.position.set(0, 4.0, -4.6);
      const yellowBand = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.28, 3.85), this.mat.autoYellow);
      yellowBand.position.set(0, 3.65, -4.6);

      // Office Front Counter & Windows
      for (let wx = -3.8; wx <= 3.8; wx += 1.9) {
        const w = new THREE.Mesh(this.geo.win, winMat);
        w.position.set(wx, 2.2, -2.85);
        w.userData.isWindow = true;
        g.add(w);
      }
      const door = new THREE.Mesh(this.geo.door, this.mat.wood);
      door.position.set(0, 0.8, -2.85);

      // Sheltered Auto Stand Canopy (Left Bay for Cleaning & Parking)
      const standRoof = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.24, 4.6), this.mat.autoGreen);
      standRoof.position.set(-3.2, 2.9, 1.0);
      const standTrim = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.16, 4.7), this.mat.autoYellow);
      standTrim.position.set(-3.2, 2.76, 1.0);
      [[-6.2, -1.0], [-0.2, -1.0], [-6.2, 3.0], [-0.2, 3.0]].forEach(([px, pz]) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 6), this.mat.wallWhite);
        col.position.set(px, 1.4, pz);
        g.add(col);
      });

      // 2 Parked Real Autos in the Cleaning Bay + 2 Drivers ACTIVELY CLEANING THEM with blue cloths!
      const parkedAuto1 = this._makeRealAutoMesh(true, false);
      parkedAuto1.position.set(-4.6, 0.08, 1.1);
      parkedAuto1.rotation.y = 0;
      const parkedAuto2 = this._makeRealAutoMesh(true, false);
      parkedAuto2.position.set(-1.8, 0.08, 1.1);
      parkedAuto2.rotation.y = 0;

      // Water bucket next to cleaning bay
      const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.36, 8), this.mat.wallBlue);
      bucket.position.set(-3.2, 0.25, 2.4);

      const makeCleanerDriver = (ax, az, phase) => {
        const drv = this._createCharacter({ shirtMat: this.mat.khakiUniform, pantsMat: this.mat.darkPants, scale: 0.96 });
        const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.22), this.mat.clothBlue);
        cloth.position.set(0.28, 0.78, 0.22);
        drv.add(cloth);
        g.add(drv);
        this.landmarkActors.push({
          plotId, mesh: drv, mode: "clean_auto",
          baseX: ax, baseZ: az, range: 0.65, speed: 3.4, phase
        });
      };
      makeCleanerDriver(-5.45, 1.2, 0);
      makeCleanerDriver(-0.95, 1.2, 1.9);

      // 2 LIVE REAL AUTOS THAT PICK UP PASSENGERS AT STAND -> DRIVE OUT ONTO CITY ROADS -> LOOP AROUND CITY -> RETURN!
      const liveAuto1 = this._makeRealAutoMesh(true, true);
      g.add(liveAuto1);
      const pax1 = [this.mat.wallCoral, this.mat.wallBlue].map((sm) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.92 });
        g.add(p);
        return p;
      });
      this.autoSimulations.push({
        plotId, auto: liveAuto1, passengers: pax1,
        stopX: 2.2, stopZ: 2.0, waitX: 2.2, waitZ: -0.8,
        roadLoopR: this.BLOCK_STEP, phaseOffset: 0
      });

      const liveAuto2 = this._makeRealAutoMesh(true, true);
      g.add(liveAuto2);
      const pax2 = [this.mat.wallGold, this.mat.wallMint].map((sm) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.92 });
        g.add(p);
        return p;
      });
      this.autoSimulations.push({
        plotId, auto: liveAuto2, passengers: pax2,
        stopX: 4.8, stopZ: 2.0, waitX: 4.8, waitZ: -0.8,
        roadLoopR: this.BLOCK_STEP, phaseOffset: 10.0
      });

      const toBoard = this._makeBuildingBoard("TRANSPORT OFFICE", "AUTO STAND • AP", "#1e3a8a", "#facc15", 7.8, 1.15);
      toBoard.position.set(0, 3.3, -2.84);
      const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.42, 0.65), this.mat.teakWood);
      bench.position.set(3.5, 0.28, -1.8);
      g.add(office, officeRoof, yellowBand, door, standRoof, standTrim, parkedAuto1, parkedAuto2, bucket, toBoard, bench);
      g.userData.labelY = 7.4;
      return g;
    }

    // 4-PLOT APSRTC BUS TERMINAL (Real 3D Buses -> Wait until FULL -> Drive OUT onto City Roads around town -> Return!)
    if (type === "bus_stand") {
      const terminal = new THREE.Mesh(new THREE.BoxGeometry(12.8, 4.2, 3.2), this.mat.wallCream);
      terminal.position.set(0, 2.15, -4.8);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.45, 6.2), this.mat.navy);
      roof.position.set(0, 4.5, -2.8);
      roof.rotation.x = 0.06;

      const yellowTrim = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.3, 0.22), this.mat.petrolYellow);
      yellowTrim.position.set(0, 4.3, 0.28);

      [-5.6, -1.8, 1.8, 5.6].forEach((px) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4.3, 6), this.mat.wallWhite);
        col.position.set(px, 2.15, -0.4);
        g.add(col);
      });

      // Parked Green Palle Velugu Real Bus at side bay
      const parkedBus = this._makeRealBusMesh(0x16a34a, true);
      parkedBus.position.set(-4.2, 0.08, 4.8);
      parkedBus.rotation.y = Math.PI / 2;
      g.add(parkedBus);

      // LIVE REAL BUS 1 (Red APSRTC Express): Boards 3 passengers until FULL -> Drives OUT onto city roads around the city!
      const liveBus1 = this._makeRealBusMesh(0xdc2626, true);
      g.add(liveBus1);
      const passengers1 = [this.mat.wallCoral, this.mat.wallBlue, this.mat.wallGold].map((sm) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.96 });
        g.add(p);
        return p;
      });
      this.busSimulations.push({
        plotId, bus: liveBus1, passengers: passengers1,
        bayX: 0.4, bayZ: 2.0, waitZ: -1.3,
        roadLoopR: this.BLOCK_STEP, phaseOffset: 0
      });

      // LIVE REAL BUS 2 (Blue APSRTC Super Luxury): Boards 3 passengers until FULL -> Drives OUT onto city roads!
      const liveBus2 = this._makeRealBusMesh(0x2563eb, true);
      g.add(liveBus2);
      const passengers2 = [this.mat.wallMint, this.mat.khakiUniform, this.mat.wallCoral].map((sm) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.96 });
        g.add(p);
        return p;
      });
      this.busSimulations.push({
        plotId, bus: liveBus2, passengers: passengers2,
        bayX: 3.6, bayZ: 2.0, waitZ: -1.3,
        roadLoopR: this.BLOCK_STEP, phaseOffset: 11.0
      });

      const rtcBoard = this._makeBuildingBoard("APSRTC BUS STAND", "EXPRESS • SUPER LUXURY", "#1e3a8a", "#facc15", 9.0, 1.2);
      rtcBoard.position.set(0, 4.4, 0.42);
      const bench1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 0.6), this.mat.teakWood);
      bench1.position.set(-3.2, 0.28, -2.2);
      const bench2 = bench1.clone();
      bench2.position.x = 3.2;
      g.add(terminal, roof, yellowTrim, rtcBoard, bench1, bench2);
      g.userData.labelY = 7.4;
      return g;
    }

    if (type === "police_station") {
      const floor1 = new THREE.Mesh(new THREE.BoxGeometry(12.2, 3.2, 5.6), this.mat.wallKhaki);
      floor1.position.set(0, 1.65, -3.2);
      const floor2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.0, 5.0), this.mat.wallCream);
      floor2.position.set(0, 4.75, -3.4);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 3.6), this.mat.wallKhaki);
      tower.position.set(0, 7.4, -3.4);

      const navyBand = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.45, 5.8), this.mat.navy);
      navyBand.position.set(0, 3.25, -3.2);
      const redBand = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.25, 5.8), this.mat.petrolRed);
      redBand.position.set(0, 2.9, -3.2);

      const portico = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 2.6), this.mat.navy);
      portico.position.set(0, 2.6, 0.7);
      [-1.9, 1.9].forEach((px) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.5, 6), this.mat.wallWhite);
        col.position.set(px, 1.3, 1.7);
        g.add(col);
      });

      for (let wx = -4.4; wx <= 4.4; wx += 1.75) {
        if (Math.abs(wx) > 1.2) {
          const w1 = new THREE.Mesh(this.geo.win, winMat);
          w1.position.set(wx, 1.7, -0.35);
          w1.userData.isWindow = true;
          g.add(w1);
        }
        const w2 = new THREE.Mesh(this.geo.win, winMat);
        w2.position.set(wx * 0.8, 4.8, -0.85);
        w2.userData.isWindow = true;
        g.add(w2);
      }

      const sirenRed = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      sirenRed.position.set(-0.42, 8.85, -2.5);
      sirenRed.userData.plotId = plotId;
      const sirenBlue = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      sirenBlue.position.set(0.42, 8.85, -2.5);
      sirenBlue.userData.plotId = plotId;
      this.sirenLights.push(sirenRed, sirenBlue);

      const jeep1 = this._makeVehicleMesh(false, false, 0xf8fafc, true);
      jeep1.position.set(-4.6, 0.1, 3.8);
      jeep1.rotation.y = Math.PI / 6;

      const patrolCar = this._makeVehicleMesh(false, false, 0xf8fafc, true);
      const carSirenR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.2), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      carSirenR.position.set(-0.15, 1.26, 0);
      carSirenR.userData.plotId = plotId;
      const carSirenB = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.2), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      carSirenB.position.set(0.15, 1.26, 0);
      carSirenB.userData.plotId = plotId;
      patrolCar.add(carSirenR, carSirenB);
      this.sirenLights.push(carSirenR, carSirenB);
      g.add(patrolCar);

      this.policeSimulations.push({ plotId, car: patrolCar });

      for (let i = 0; i < 4; i++) {
        const officer = this._createCharacter({
          shirtMat: this.mat.khakiUniform,
          pantsMat: this.mat.khakiUniform,
          hatColor: 0x1e3a8a,
          scale: 1.08
        });
        g.add(officer);
        this.landmarkActors.push({
          plotId, mesh: officer,
          mode: i < 2 ? "patrol_x" : "guard",
          baseX: i === 0 ? -2.8 : i === 1 ? 2.8 : i === 2 ? -1.4 : 1.4,
          baseZ: i < 2 ? 4.8 : 2.1,
          range: 2.0, speed: 1.4, phase: i * 1.7
        });
      }

      const polBoard = this._makeBuildingBoard("POLICE STATION", "AP POLICE • DIAL 100", "#1e3a8a", "#ef4444", 7.6, 1.15);
      polBoard.position.set(0, 3.6, -0.32);
      g.add(floor1, floor2, tower, navyBand, redBand, portico, sirenRed, sirenBlue, jeep1, polBoard);
      g.userData.labelY = 11.2;
      return g;
    }

    if (type === "hospital") {
      const main = new THREE.Mesh(new THREE.BoxGeometry(11.8, 9.2, 6.2), this.mat.wallWhite);
      main.position.set(0, 4.65, -2.4);

      [2.8, 5.8, 8.9].forEach((y) => {
        const band = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.35, 6.4), this.mat.teal);
        band.position.set(0, y, -2.4);
        g.add(band);
      });

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.16, 14), this.mat.road);
      pad.position.set(0, 9.35, -2.4);
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 1.8), this.mat.petrolYellow);
      h1.position.set(-0.6, 9.46, -2.4);
      const h2 = h1.clone();
      h2.position.x = 0.6;
      const h3 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.3), this.mat.petrolYellow);
      h3.position.set(0, 9.46, -2.4);

      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.0, 0.18), this.mat.petrolRed);
      crossV.position.set(0, 7.4, 0.78);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 0.18), this.mat.petrolRed);
      crossH.position.set(0, 7.4, 0.78);

      [1.6, 4.4, 7.4].forEach((wy) => {
        for (let wx = -4.2; wx <= 4.2; wx += 1.68) {
          if (wy > 6.5 && Math.abs(wx) < 1.5) continue;
          if (wy < 2.2 && Math.abs(wx) < 1.5) continue;
          const w = new THREE.Mesh(this.geo.win, winMat);
          w.position.set(wx, wy, 0.74);
          w.userData.isWindow = true;
          g.add(w);
        }
      });

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.35, 3.0), this.mat.teal);
      canopy.position.set(0, 2.5, 2.2);

      const crashCar = this._makeVehicleMesh(false, false, 0xf97316, true);
      crashCar.position.set(5.4, 0.1, 8.8);
      crashCar.rotation.y = 0.55;
      const hazardCone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 5), this.mat.petrolRed);
      hazardCone.position.set(4.1, 0.32, 8.8);
      const patient = this._createCharacter({ shirtMat: this.mat.jerseyYellow, pantsMat: this.mat.darkPants, scale: 0.95 });
      g.add(crashCar, hazardCone, patient);

      const ambulance = this._makeVehicleMesh(false, false, 0xf8fafc, true);
      const ambStripe = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.22, 2.18), this.mat.petrolRed);
      ambStripe.position.y = 0.58;
      const ambSiren = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.22), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      ambSiren.position.set(0, 1.28, 0);
      ambSiren.userData.plotId = plotId;
      ambulance.add(ambStripe, ambSiren);
      this.sirenLights.push(ambSiren);
      g.add(ambulance);

      this.ambulanceSimulations.push({ plotId, ambulance, crashCar, hazardCone, patient });

      for (let i = 0; i < 4; i++) {
        const doc = this._createCharacter({
          shirtMat: this.mat.whiteCoat,
          pantsMat: i % 2 === 0 ? this.mat.teal : this.mat.darkPants,
          scale: 1.05
        });
        g.add(doc);
        this.landmarkActors.push({
          plotId, mesh: doc, mode: "patrol_x",
          baseX: (i - 1.5) * 1.9, baseZ: 3.2 + (i % 2) * 1.4,
          range: 1.8, speed: 1.1, phase: i * 1.3
        });
      }

      const hospBoard = this._makeBuildingBoard("SUPER HOSPITAL", "24/7 EMERGENCY • 108", "#0d9488", "#ffffff", 7.4, 1.1);
      hospBoard.position.set(0, 2.75, 3.74);
      g.add(main, pad, h1, h2, h3, crossV, crossH, canopy, hospBoard);
      g.userData.labelY = 11.6;
      return g;
    }

    if (type === "srmt_mall") {
      const base = new THREE.Mesh(new THREE.BoxGeometry(12.4, 8.4, 7.6), this.mat.wallWhite);
      base.position.set(0, 4.25, -2.0);
      const atrium = new THREE.Mesh(new THREE.BoxGeometry(7.4, 7.4, 0.5), this.mat.glass);
      atrium.position.set(0, 3.8, 1.9);
      const ribbon1 = new THREE.Mesh(new THREE.BoxGeometry(12.7, 0.75, 7.9), this.mat.srmtPurple);
      ribbon1.position.set(0, 8.2, -2.0);
      const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.35, 7.8), this.mat.srmtMagenta);
      ribbon2.position.set(0, 4.2, -2.0);
      const cinema = new THREE.Mesh(new THREE.BoxGeometry(7.0, 2.0, 4.2), this.mat.navy);
      cinema.position.set(0, 9.4, -2.4);
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.35, 2.6), this.mat.srmtMagenta);
      canopy.position.set(0, 2.3, 3.1);

      const c1 = this._makeVehicleMesh(false, false, 0xef4444, true);
      c1.position.set(-4.6, 0.1, 4.8);
      const c2 = this._makeVehicleMesh(false, false, 0x0ea5e9, true);
      c2.position.set(4.6, 0.1, 4.8);

      const mats = [this.mat.wallCoral, this.mat.wallBlue, this.mat.wallGold, this.mat.wallMint, this.mat.srmtMagenta];
      for (let i = 0; i < 5; i++) {
        const shopper = this._createCharacter({ shirtMat: mats[i], pantsMat: this.mat.darkPants, scale: 0.96 });
        g.add(shopper);
        this.landmarkActors.push({
          plotId, mesh: shopper,
          mode: i % 2 === 0 ? "patrol_x" : "patrol_z",
          baseX: (i - 2) * 1.9, baseZ: 3.4,
          range: 1.8, speed: 1.2 + (i % 2) * 0.4, phase: i * 1.4
        });
      }

      const mallBoard = this._makeBuildingBoard("SRMT MALL", "SHOPPING • MULTIPLEX", "#7e22ce", "#facc15", 8.6, 1.35);
      mallBoard.position.set(0, 8.2, 2.02);
      g.add(base, atrium, ribbon1, ribbon2, cinema, canopy, c1, c2, mallBoard);
      g.userData.labelY = 12.2;
      return g;
    }

    if (type === "apple_store") {
      const floor = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.35, 8.2), this.mat.appleSilver);
      floor.position.set(0, 0.25, -1.2);
      const glassBox = new THREE.Mesh(new THREE.BoxGeometry(10.8, 5.8, 7.2), this.mat.glass);
      glassBox.position.set(0, 3.3, -1.2);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.55, 9.0), this.mat.appleSilver);
      roof.position.set(0, 6.45, -1.2);

      const logoBody = new THREE.Mesh(new THREE.SphereGeometry(0.92, 10, 10), this.mat.wallWhite);
      logoBody.scale.set(1, 1.05, 0.3);
      logoBody.position.set(0, 4.4, 2.55);
      const logoLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.16), this.mat.wallWhite);
      logoLeaf.position.set(0.18, 5.5, 2.55);
      logoLeaf.rotation.z = -0.45;

      [-2.8, 0, 2.8].forEach((tx) => {
        const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 3.4), this.mat.wood);
        table.position.set(tx, 0.85, -1.2);
        g.add(table);
      });

      for (let i = 0; i < 4; i++) {
        const person = this._createCharacter({
          shirtMat: i < 2 ? this.mat.blueUniform : this.mat.wallWhite,
          pantsMat: this.mat.darkPants,
          scale: 0.98
        });
        g.add(person);
        this.landmarkActors.push({
          plotId, mesh: person, mode: "patrol_x",
          baseX: (i - 1.5) * 2.2, baseZ: i < 2 ? 0.5 : 4.2,
          range: 1.6, speed: 1.1, phase: i * 1.6
        });
      }

      const appBoard = this._makeBuildingBoard("APPLE STORE", "iPhone • Mac • iPad", "#0f172a", "#e2e8f0", 6.2, 0.95);
      appBoard.position.set(0, 6.45, 3.34);
      g.add(floor, glassBox, roof, logoBody, logoLeaf, appBoard);
      g.userData.labelY = 9.2;
      return g;
    }

    if (type === "reliance_store") {
      const main = new THREE.Mesh(new THREE.BoxGeometry(12.0, 6.4, 7.2), this.mat.wallWhite);
      main.position.set(0, 3.25, -1.8);
      const blueFacade = new THREE.Mesh(new THREE.BoxGeometry(12.2, 1.8, 7.4), this.mat.relianceBlue);
      blueFacade.position.set(0, 5.6, -1.8);
      const redAccent = new THREE.Mesh(new THREE.BoxGeometry(12.3, 0.35, 7.5), this.mat.petrolRed);
      redAccent.position.set(0, 4.5, -1.8);
      const goldAccent = new THREE.Mesh(new THREE.BoxGeometry(12.3, 0.25, 7.5), this.mat.gold);
      goldAccent.position.set(0, 6.6, -1.8);

      for (let wx = -4.0; wx <= 4.0; wx += 2.65) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.4, 0.16), winMat);
        w.position.set(wx, 1.9, 1.85);
        w.userData.isWindow = true;
        g.add(w);
      }

      const van = this._makeVehicleMesh(false, false, 0x1d4ed8, true);
      van.position.set(-4.2, 0.1, 4.6);
      const car = this._makeVehicleMesh(false, false, 0xf8fafc, true);
      car.position.set(4.2, 0.1, 4.6);

      for (let i = 0; i < 4; i++) {
        const p = this._createCharacter({
          shirtMat: i % 2 === 0 ? this.mat.relianceBlue : this.mat.wallCoral,
          pantsMat: this.mat.darkPants,
          scale: 0.96
        });
        g.add(p);
        this.landmarkActors.push({
          plotId, mesh: p, mode: "patrol_x",
          baseX: (i - 1.5) * 2.0, baseZ: 3.3,
          range: 1.5, speed: 1.2, phase: i * 1.5
        });
      }

      const relBoard = this._makeBuildingBoard("RELIANCE DIGITAL", "SMART • ELECTRONICS", "#1d4ed8", "#facc15", 8.6, 1.3);
      relBoard.position.set(0, 5.4, 1.94);
      g.add(main, blueFacade, redAccent, goldAccent, van, car, relBoard);
      g.userData.labelY = 9.4;
      return g;
    }

    // GRAND SCHOOL CAMPUS
    const main = new THREE.Mesh(new THREE.BoxGeometry(12.4, 5.8, 3.6), this.mat.wallCream);
    main.position.set(0, 2.95, -4.4);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.8, 5.8), this.mat.wallCream);
    wingL.position.set(-4.6, 2.45, -0.2);
    const wingR = wingL.clone();
    wingR.position.x = 4.6;
    const roofBand = new THREE.Mesh(new THREE.BoxGeometry(12.7, 0.45, 3.9), this.mat.roofOrange);
    roofBand.position.set(0, 6.0, -4.4);

    [1.7, 4.2].forEach((wy) => {
      for (let wx = -4.4; wx <= 4.4; wx += 1.45) {
        const w = new THREE.Mesh(this.geo.win, winMat);
        w.position.set(wx, wy, -2.56);
        w.userData.isWindow = true;
        g.add(w);
      }
    });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 5.8, 5), this.mat.wallWhite);
    pole.position.set(0, 2.95, 0.2);
    const flagTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    flagTop.position.set(0.58, 5.6, 0.2);
    const flagMid = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), this.mat.wallWhite);
    flagMid.position.set(0.58, 5.36, 0.2);
    const flagBot = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), new THREE.MeshBasicMaterial({ color: 0x16a34a }));
    flagBot.position.set(0.58, 5.12, 0.2);

    const schoolBus = this._makeVehicleMesh(true, false, 0xfacc15, true);
    schoolBus.position.set(3.8, 0.1, 5.4);
    schoolBus.rotation.y = Math.PI / 2;

    for (let i = 0; i < 6; i++) {
      const kid = this._createCharacter({ shirtMat: this.mat.wallWhite, pantsMat: this.mat.blueUniform, scale: 0.78 });
      g.add(kid);
      this.landmarkActors.push({
        plotId, mesh: kid, mode: "orbit",
        baseX: 0, baseZ: 2.2,
        range: 1.4 + (i % 3) * 0.7, speed: 1.4 + (i % 2) * 0.5, phase: (i / 6) * Math.PI * 2
      });
    }

    const schBoard = this._makeBuildingBoard("GRAND SCHOOL", "ENGLISH MEDIUM CAMPUS", "#c2410c", "#fef3c7", 8.2, 1.15);
    schBoard.position.set(0, 5.2, -2.52);
    g.add(main, wingL, wingR, roofBand, pole, flagTop, flagMid, flagBot, schoolBus, schBoard);
    g.userData.labelY = 8.6;
    return g;
  }

  _createNameSign(mainText, subText = "", isBig = false) {
    const canvas = document.createElement("canvas");
    const low = this.isLowRam && !isBig;
    canvas.width = isBig ? 360 : low ? 192 : 240;
    canvas.height = subText ? 80 : low ? 44 : 54;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.beginPath();
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 12);
    ctx.fill();

    ctx.strokeStyle = isBig ? "#facc15" : "#38bdf8";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cx = canvas.width / 2;

    const cleanMain = mainText.length > 20 ? mainText.slice(0, 19) + "…" : mainText;
    if (subText) {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(subText, cx, 26);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(cleanMain, cx, 56);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(cleanMain, cx, 29);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(isBig ? 8.6 : 4.8, subText ? (isBig ? 2.1 : 1.4) : 1.1, 1);
    return sprite;
  }

  setTimeOfDay(mode) {
    this.timeOfDay = mode;
    if (mode === "night") {
      this.scene.background.setHex(0x0b1120);
      this.scene.fog.color.setHex(0x0b1120);
      this.sunLight.color.setHex(0x60a5fa);
      this.sunLight.intensity = 0.42;
      this.hemiLight.intensity = 0.3;
    } else if (mode === "sunset") {
      this.scene.background.setHex(0xf97316);
      this.scene.fog.color.setHex(0xfb923c);
      this.sunLight.color.setHex(0xfdba74);
      this.sunLight.intensity = 1.05;
      this.hemiLight.intensity = 0.6;
    } else {
      this.scene.background.setHex(0x87ceeb);
      this.scene.fog.color.setHex(0x87ceeb);
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 1.15;
      this.hemiLight.intensity = 0.95;
    }

    const isNight = mode === "night";
    this.lampBulbs.forEach((b) => {
      b.material = isNight ? this.mat.lampBulbNight : this.mat.lampBulbDay;
    });
    this.vehicleHeadlights.forEach((hl) => {
      hl.visible = isNight;
    });
    if (this.starField) this.starField.visible = isNight;
    if (this.cloudMat) {
      this.cloudMat.color.setHex(mode === "sunset" ? 0xfed7aa : 0xffffff);
    }
    if (this.skyClouds) {
      this.skyClouds.forEach((c) => { c.mesh.visible = !isNight; });
    }
    if (this.airportSim && this.airportSim.nightGlowMeshes) {
      this.airportSim.nightGlowMeshes.forEach((m) => { m.visible = isNight; });
    }
    if (this.railwaySim) {
      if (this.railwaySim.nightLights) {
        this.railwaySim.nightLights.forEach((m) => { m.visible = isNight; });
      }
      if (this.railwaySim.trainWindows) {
        this.railwaySim.trainWindows.forEach((m) => {
          m.material = isNight ? this.mat.windowNight : this.mat.busWindshield;
        });
      }
    }
    this.plotsGroup.traverse((obj) => {
      if (obj.userData && obj.userData.isWindow) {
        obj.material = isNight ? this.mat.windowNight : this.mat.windowDay;
      }
    });
  }

  getPlotWorldCenter(plotId) {
    if (plotId === "ST_JUNCTION") return { x: 0, y: 4, z: 0, size: 4 };
    if (plotId === "AIRPORT") return { x: this.airportX - 4, y: 5, z: 4, size: 12 };
    if (plotId === "BEACH") return { x: this.beachX + 6, y: 4, z: -2, size: 12 };
    if (plotId === "RAILWAY_STATION") return { x: 0, y: 4, z: this.railwayZ, size: 12 };
    const plotIndex = parseInt(plotId.replace("plot_", ""), 10) - 1;
    if (isNaN(plotIndex) || plotIndex < 0) return { x: 0, y: 2, z: 0, size: 1 };

    const data = this.plotDataMap.get(plotId);
    const size = data?.status === "built" ? (data.size || getRequiredSize(data.buildingType)) : 1;
    const pos = this.getPlotPosition(plotIndex);

    if (size === 8) {
      const grp = getEightPlotGroup(plotId);
      const lc = blockIdxToCoord(grp.leftBlockIdx);
      const rc = blockIdxToCoord(grp.rightBlockIdx);
      return { x: ((lc.bx + rc.bx) / 2) * this.BLOCK_STEP, y: 3.5, z: lc.bz * this.BLOCK_STEP, size: 8 };
    }
    if (size === 4) {
      return { x: pos.blockCenterX, y: 3.5, z: pos.blockCenterZ, size: 4 };
    }
    if (size === 2) {
      const twoInfo = getTwoPlotGroup(plotId);
      const rowZ = pos.blockCenterZ + (twoInfo.isNorthRow ? -this.PLOT_SIZE / 2 : this.PLOT_SIZE / 2);
      return { x: pos.blockCenterX, y: 3.2, z: rowZ, size: 2 };
    }
    return { x: pos.x, y: 2.5, z: pos.z, size: 1 };
  }

  focusPlot(plotId, fastSpeed = 0.1) {
    const center = this.getPlotWorldCenter(plotId);
    const dist = center.size === 12 ? 62 : center.size === 8 ? 38 : center.size === 4 ? 28 : center.size === 2 ? 23 : 20;

    this.cameraGoal = {
      target: new THREE.Vector3(center.x, center.y, center.z),
      camPos: new THREE.Vector3(center.x + dist, dist + 4, center.z + dist),
      speed: fastSpeed
    };

    if (!this.highlightBeacon) {
      this.highlightBeacon = new THREE.Mesh(
        new THREE.RingGeometry(3.5, 4.1, 24),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
      );
      this.highlightBeacon.rotation.x = -Math.PI / 2;
      this.scene.add(this.highlightBeacon);
    }
    const sx = center.size === 12 ? 7.5 : center.size === 8 ? 3.8 : center.size === 4 ? 2.0 : 1.05;
    const sy = center.size === 12 ? 7.5 : center.size >= 4 ? 2.0 : 1.05;
    this.highlightBeacon.scale.set(sx, sy, 1);
    this.highlightBeacon.position.set(center.x, 0.3, center.z);
  }

  startProReelTour(allPlotsObj, onStopChange, onComplete) {
    const stops = [];

    stops.push({
      tag: "FOLLOWER NAGARAM",
      name: this.townName.toUpperCase(),
      target: new THREE.Vector3(0, 0, 0),
      camPos: new THREE.Vector3(115, 130, 115),
      duration: 1.6,
      speed: 0.16,
      plotId: null
    });

    stops.push({
      tag: "CITY CENTER",
      name: "🦁 SHERU BHAI • ST JUNCTION",
      target: new THREE.Vector3(0, 4, 0),
      camPos: new THREE.Vector3(20, 22, 20),
      duration: 1.5,
      speed: 0.18,
      plotId: "ST_JUNCTION"
    });

    stops.push({
      tag: "20-ACRE INTERNATIONAL AIRPORT",
      name: "✈️ SHERU BHAI AIRPORT & DIAMOND HELI",
      target: new THREE.Vector3(this.airportX - 4, 5, 6),
      camPos: new THREE.Vector3(this.airportX - 58, 44, 56),
      duration: 2.6,
      speed: 0.14,
      plotId: "AIRPORT"
    });

    stops.push({
      tag: "GOLDEN SAND BEACH & VILLA",
      name: `🏖️ SHERU BHAI BEACH • ${this.beachOwner || "@follower_beach"}`,
      target: new THREE.Vector3(this.beachX + 8, 4, -2),
      camPos: new THREE.Vector3(this.beachX - 46, 36, 44),
      duration: 2.5,
      speed: 0.14,
      plotId: "BEACH"
    });

    stops.push({
      tag: "INDIAN RAILWAYS • MOUNTAIN TUNNEL",
      name: `🚂 SHERU BHAI JN • ${this.railwayOwner || "@_ur_bunny_108_"}`,
      target: new THREE.Vector3(0, 4, this.railwayZ),
      camPos: new THREE.Vector3(38, 30, this.railwayZ + 44),
      duration: 2.6,
      speed: 0.14,
      plotId: "RAILWAY_STATION"
    });

    const landmarks = [];
    const houses = [];
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (!p || p.status !== "built") return;
      const sz = getRequiredSize(p.buildingType);
      if (sz >= 2) landmarks.push({ pid, p, sz });
      else houses.push({ pid, p, idx: parseInt(pid.replace("plot_", ""), 10) || 0 });
    });

    landmarks.slice(0, 5).forEach((lm, i) => {
      const c = this.getPlotWorldCenter(lm.pid);
      const d = lm.sz === 8 ? 34 : 24;
      const ang = i % 2 === 0 ? 1 : -1;
      stops.push({
        tag: lm.sz === 8 ? "8-PLOT MEGA LANDMARK" : lm.sz === 2 ? "2-PLOT STUDIO" : "TOWN LANDMARK",
        name: lm.p.ownerName || BUILDING_LABELS[lm.p.buildingType],
        target: new THREE.Vector3(c.x, c.y, c.z),
        camPos: new THREE.Vector3(c.x + d * ang, d * 0.9, c.z + d),
        duration: 1.4,
        speed: 0.2,
        plotId: lm.pid
      });
    });

    houses.sort((a, b) => (b.p.builtDay || 1) - (a.p.builtDay || 1) || b.idx - a.idx);
    houses.slice(0, 6).forEach((h, i) => {
      const c = this.getPlotWorldCenter(h.pid);
      const ang = i % 2 === 0 ? 1 : -1;
      stops.push({
        tag: `NEWLY ADDED • DAY ${h.p.builtDay || 1}`,
        name: h.p.ownerName || "New Resident",
        target: new THREE.Vector3(c.x, c.y + 1, c.z),
        camPos: new THREE.Vector3(c.x + 15 * ang, 17, c.z + 15),
        duration: 1.15,
        speed: 0.24,
        plotId: h.pid
      });
    });

    stops.push({
      tag: "FOLLOW TO JOIN!",
      name: `${landmarks.length + houses.length} PLACES BUILT`,
      target: new THREE.Vector3(0, 0, 0),
      camPos: new THREE.Vector3(-120, 125, 120),
      duration: 2.2,
      speed: 0.12,
      plotId: null
    });

    this.proReelTour = { active: true, stops, idx: 0, timer: 0, onStopChange, onComplete };
    this._applyTourStop(0);
  }

  _applyTourStop(index) {
    const s = this.proReelTour.stops[index];
    if (!s) return;
    this.cameraGoal = { target: s.target.clone(), camPos: s.camPos.clone(), speed: s.speed };
    if (s.plotId && s.plotId !== "ST_JUNCTION") {
      const c = this.getPlotWorldCenter(s.plotId);
      if (this.highlightBeacon) {
        const sx = c.size === 8 ? 3.8 : c.size === 4 ? 2.0 : 1.05;
        const sy = c.size >= 4 ? 2.0 : 1.05;
        this.highlightBeacon.scale.set(sx, sy, 1);
        this.highlightBeacon.position.set(c.x, 0.3, c.z);
        this.highlightBeacon.visible = true;
      }
    }
    if (this.proReelTour.onStopChange) this.proReelTour.onStopChange(s.tag, s.name);
  }

  stopProReelTour() {
    this.proReelTour.active = false;
    this.cameraGoal = null;
    if (this.proReelTour.onComplete) this.proReelTour.onComplete();
  }

  /**
   * 🚁 HIGH-SPEED CONTINUOUS DRONE VIEW:
   * 1. Starts outside South Welcome Arch -> flies RIGHT THROUGH the Welcome Arch!
   * 2. Speeds between the buildings straight to ST Junction Statue at (0,0)
   * 3. Circles ST Junction Statue
   * 4. Continuously weaves down every street showing all houses & @usernames!
   */
  startDroneView(onStop = null) {
    if (this.proReelTour.active) this.stopProReelTour();
    this.cameraGoal = null;
    this.autoSpin = false;

    const rr = this.ringRadius || 40;
    const r = Math.max(1, this.currentGridRadius);
    const step = this.BLOCK_STEP;
    const pts = [];

    // 1. Approach & fly INSIDE through the South Welcome Arch (at x=0, z=rr - 5.8, arch height=6.2)
    pts.push(new THREE.Vector3(0, 4.0, rr + 14));
    pts.push(new THREE.Vector3(0, 3.6, rr - 5.8)); // Inside the Welcome Arch!
    pts.push(new THREE.Vector3(0, 4.6, rr - 18));  // Speeding between buildings!

    // 2. Fly straight down the central avenue toward ST Junction Statue (0,0)
    pts.push(new THREE.Vector3(0, 5.4, 15));
    pts.push(new THREE.Vector3(10.5, 6.2, 8.5));
    pts.push(new THREE.Vector3(11.5, 6.8, -6.5));
    pts.push(new THREE.Vector3(0, 7.2, -12.5));
    pts.push(new THREE.Vector3(-11.5, 6.8, -4.0));

    // 3. Continuous serpentine fly-through across ALL city streets so every house & @username is shown!
    const span = r * step;
    let dir = 1;
    for (let row = -r; row <= r; row++) {
      const roadZ = (row + 0.5) * step;
      if (dir > 0) {
        pts.push(new THREE.Vector3(-span, 8.5, roadZ));
        pts.push(new THREE.Vector3(0, 7.8, roadZ));
        pts.push(new THREE.Vector3(span, 8.5, roadZ));
      } else {
        pts.push(new THREE.Vector3(span, 8.5, roadZ));
        pts.push(new THREE.Vector3(0, 7.8, roadZ));
        pts.push(new THREE.Vector3(-span, 8.5, roadZ));
      }
      dir *= -1;
    }

    // 4. Loop smoothly back outside the South Welcome Arch for continuous playback
    pts.push(new THREE.Vector3(-12, 9.0, rr + 12));

    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.35);
    const totalLen = curve.getLength();
    // High-speed drone velocity (~24 world units/second) regardless of city size!
    const normalizedSpeed = 24 / Math.max(totalLen, 120);

    this.droneTour = {
      active: true,
      curve,
      t: 0,
      speed: normalizedSpeed,
      onStop
    };
  }

  stopDroneView() {
    this.droneTour.active = false;
    if (this.droneTour.onStop) {
      const cb = this.droneTour.onStop;
      this.droneTour.onStop = null;
      cb();
    }
  }

  /**
   * 🏗️ REPLAY CONSTRUCTION ANIMATION on any already-built plot!
   * Re-renders the building with scaffolding, rising scale-up animation & construction workers.
   */
  replayPlotConstruction(plotId) {
    const data = this.plotDataMap.get(plotId);
    if (!data || data.status !== "built") return;
    this.renderPlot(plotId, data, true);
  }

  /**
   * 🏗️ BUILD REEL TOUR (Construction Showcase for Reels):
   * Automatically picks the newest built buildings (current Day # first, up to 8 places),
   * flies rapidly to each one, replays its live construction animation (scaffolding + workers + rising),
   * and finishes with a sweep over Sheru Bhai Statue!
   */
  startBuildReelTour(allPlotsObj, onStopChange, onComplete) {
    if (this.proReelTour.active) this.stopProReelTour();
    if (this.droneTour.active) this.stopDroneView();
    this.autoSpin = false;

    const builtList = [];
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (!p || p.status !== "built") return;
      const sz = getRequiredSize(p.buildingType);
      builtList.push({
        pid,
        p,
        sz,
        day: p.builtDay || 1,
        idx: parseInt(pid.replace("plot_", ""), 10) || 0
      });
    });

    if (builtList.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    // Sort newest Day first, then Landmarks first, then highest plot index!
    builtList.sort((a, b) => b.day - a.day || b.sz - a.sz || b.idx - a.idx);
    const maxDay = builtList[0].day;
    let featured = builtList.filter((item) => item.day === maxDay).slice(0, 8);
    if (featured.length < 3) {
      featured = builtList.slice(0, 6);
    }

    const stops = [];

    // Opening shot on Sheru Bhai Statue
    stops.push({
      tag: `DAY ${maxDay} • NEW CONSTRUCTIONS`,
      name: "🦁 SHERU BHAI • ST JUNCTION",
      target: new THREE.Vector3(0, 4.5, 0),
      camPos: new THREE.Vector3(24, 24, 24),
      duration: 1.6,
      speed: 0.16,
      plotId: null,
      triggerBuild: false
    });

    featured.forEach((item, i) => {
      const c = this.getPlotWorldCenter(item.pid);
      const d = item.sz === 8 ? 34 : item.sz === 4 ? 24 : 16;
      const side = i % 2 === 0 ? 1 : -1;
      stops.push({
        tag: `🏗️ CONSTRUCTING • DAY ${item.day}`,
        name: item.p.ownerName || BUILDING_LABELS[item.p.buildingType] || "New Building",
        target: new THREE.Vector3(c.x, c.y, c.z),
        camPos: new THREE.Vector3(c.x + d * side, d * 0.92, c.z + d),
        duration: 2.9, // Enough time to watch scaffolding + building rise completely!
        speed: 0.18,
        plotId: item.pid,
        triggerBuild: true
      });
    });

    // Finale Zoom-Out
    stops.push({
      tag: "COMMENT TO BUILD YOURS!",
      name: `${builtList.length} PLACES LIVE`,
      target: new THREE.Vector3(0, 0, 0),
      camPos: new THREE.Vector3(-110, 118, 110),
      duration: 2.0,
      speed: 0.11,
      plotId: null,
      triggerBuild: false
    });

    this.buildReelTour = {
      active: true,
      stops,
      idx: 0,
      timer: 0,
      onStopChange,
      onComplete
    };
    this._applyBuildReelStop(0);
  }

  _applyBuildReelStop(index) {
    const s = this.buildReelTour.stops[index];
    if (!s) return;
    this.cameraGoal = {
      target: s.target.clone(),
      camPos: s.camPos.clone(),
      speed: s.speed
    };
    if (s.plotId) {
      const c = this.getPlotWorldCenter(s.plotId);
      if (this.highlightBeacon) {
        const sx = c.size === 8 ? 3.8 : c.size === 4 ? 2.0 : 1.05;
        const sy = c.size >= 4 ? 2.0 : 1.05;
        this.highlightBeacon.scale.set(sx, sy, 1);
        this.highlightBeacon.position.set(c.x, 0.3, c.z);
        this.highlightBeacon.visible = true;
      }
      if (s.triggerBuild) {
        this.replayPlotConstruction(s.plotId);
      }
    }
    if (this.buildReelTour.onStopChange) {
      this.buildReelTour.onStopChange(s.tag, s.name);
    }
  }

  stopBuildReelTour() {
    this.buildReelTour.active = false;
    this.cameraGoal = null;
    if (this.buildReelTour.onComplete) this.buildReelTour.onComplete();
  }

  findPlotByQuery(query) {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return null;
    if (q.includes("airport") || q.includes("plane") || q.includes("flight") || q.includes("heli") || q.includes("diamond")) return "AIRPORT";
    const beachClean = (this.beachOwner || "").toLowerCase().replace(/^@/, "");
    if (q.includes("beach") || q.includes("ocean") || q.includes("sea") || (beachClean && beachClean.includes(q))) return "BEACH";
    const railClean = (this.railwayOwner || "").toLowerCase().replace(/^@/, "");
    if (q.includes("train") || q.includes("rail") || q.includes("station") || q.includes("tunnel") || (railClean && railClean.includes(q))) return "RAILWAY_STATION";
    const ahClean = (this.airportHouseOwner || "").toLowerCase().replace(/^@/, "");
    if (ahClean && ahClean.includes(q)) return "AIRPORT";
    if (q.includes("sheru") || q.includes("bhai") || q.includes("junction") || q.includes("statue") || q === "st") return "ST_JUNCTION";
    for (const [plotId, data] of this.plotDataMap.entries()) {
      if (!data || data.status !== "built") continue;
      const owner = (data.ownerName || "").toLowerCase().replace(/^@/, "");
      const role = (data.role || "").toLowerCase();
      const typeLabel = (BUILDING_LABELS[data.buildingType] || data.buildingType || "").toLowerCase();
      if (owner.includes(q) || role.includes(q) || typeLabel.includes(q)) return plotId;
    }
    return null;
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    // 🚁 Continuous High-Speed Drone Camera Flight
    if (this.droneTour.active && this.droneTour.curve) {
      this.droneTour.t = (this.droneTour.t + dt * this.droneTour.speed) % 1;
      const pos = this.droneTour.curve.getPointAt(this.droneTour.t);
      const lookT = (this.droneTour.t + 0.018) % 1;
      const lookPt = this.droneTour.curve.getPointAt(lookT);

      this.camera.position.lerp(pos, 0.22);
      // Slight downward tilt so houses & @username signs are framed clearly
      this.controls.target.lerp(new THREE.Vector3(lookPt.x, Math.max(1.5, lookPt.y - 2.6), lookPt.z), 0.22);
    }

    // 🏗️ Construction Replay Reel Choreographer
    if (this.buildReelTour.active) {
      this.buildReelTour.timer += dt;
      const cur = this.buildReelTour.stops[this.buildReelTour.idx];
      if (cur && this.buildReelTour.timer >= cur.duration) {
        this.buildReelTour.timer = 0;
        this.buildReelTour.idx++;
        if (this.buildReelTour.idx >= this.buildReelTour.stops.length) {
          this.stopBuildReelTour();
        } else {
          this._applyBuildReelStop(this.buildReelTour.idx);
        }
      }
    }

    if (this.proReelTour.active) {
      this.proReelTour.timer += dt;
      const cur = this.proReelTour.stops[this.proReelTour.idx];
      if (cur && this.proReelTour.timer >= cur.duration) {
        this.proReelTour.timer = 0;
        this.proReelTour.idx++;
        if (this.proReelTour.idx >= this.proReelTour.stops.length) {
          this.stopProReelTour();
        } else {
          this._applyTourStop(this.proReelTour.idx);
        }
      }
    }

    if (this.cameraGoal) {
      const spd = this.cameraGoal.speed || 0.1;
      this.controls.target.lerp(this.cameraGoal.target, spd);
      this.camera.position.lerp(this.cameraGoal.camPos, spd);
      if (!this.proReelTour.active && !this.buildReelTour.active && this.camera.position.distanceTo(this.cameraGoal.camPos) < 0.45) {
        this.cameraGoal = null;
      }
    }

    this.controls.autoRotate = this.autoSpin;
    if (this.autoSpin) this.controls.autoRotateSpeed = 1.6;

    const flash = Math.floor(elapsed * 5) % 2 === 0;
    this.sirenLights.forEach((s, idx) => {
      s.visible = idx % 2 === 0 ? flash : !flash;
    });

    if (this.lifeEnabled) {
      for (const sim of this.petrolSimulations) {
        const cycle = (elapsed + sim.phaseOffset) % 9.0;
        if (cycle < 2.2) {
          const p = cycle / 2.2;
          sim.vehicle.visible = true;
          sim.vehicle.position.set(-6.2 + (sim.pumpX + 6.2) * p, 0.1, sim.laneZ);
          sim.attendant.position.set(sim.attendantHomeX, 0.14, sim.attendantHomeZ);
        } else if (cycle < 5.6) {
          sim.vehicle.visible = true;
          sim.vehicle.position.set(sim.pumpX, 0.1, sim.laneZ);
          const stepT = Math.min(1, (cycle - 2.2) / 0.8);
          const targetZ = sim.laneZ + (sim.attendantHomeZ > sim.laneZ ? 0.75 : -0.75);
          sim.attendant.position.set(
            sim.pumpX,
            0.14 + Math.abs(Math.sin(elapsed * 9)) * 0.12,
            THREE.MathUtils.lerp(sim.attendantHomeZ, targetZ, stepT)
          );
          sim.attendant.rotation.y = sim.attendantHomeZ > sim.laneZ ? Math.PI : 0;
        } else if (cycle < 8.0) {
          const p = (cycle - 5.6) / 2.4;
          sim.vehicle.visible = true;
          sim.vehicle.position.set(sim.pumpX + (6.4 - sim.pumpX) * p, 0.1, sim.laneZ);
          sim.attendant.position.set(sim.attendantHomeX, 0.14, sim.attendantHomeZ);
        } else {
          sim.vehicle.visible = false;
          sim.attendant.position.set(sim.attendantHomeX, 0.14, sim.attendantHomeZ);
        }
      }

      // Helper to drive a vehicle smoothly along the real city road loop outside a 4-plot stand!
      // Local road rectangle around the 4-plot block & neighboring city street:
      // South road z = +9.5, East road x = +9.5 (or +28.5), North road z = -9.5, West road x = -9.5
      const driveCityRoadLoop = (mesh, progress, startX, startZ, loopW = 28.5, loopZ = 9.5) => {
        // 0.00 -> 0.10: Exit bay onto South Road (+9.5 Z)
        // 0.10 -> 0.35: Drive East along city road (+9.5 Z -> x = +loopW)
        // 0.35 -> 0.55: Turn North along city road (x = +loopW, z: +9.5 -> -9.5)
        // 0.55 -> 0.80: Drive West along city road (z = -9.5, x: +loopW -> -9.5)
        // 0.80 -> 0.92: Drive South back to South Road (x = -9.5, z: -9.5 -> +9.5)
        // 0.92 -> 1.00: Pull back into Stand Bay (startX, startZ)
        mesh.visible = true;
        if (progress < 0.1) {
          const t = progress / 0.1;
          mesh.position.set(startX, 0.08, THREE.MathUtils.lerp(startZ, loopZ, t));
          mesh.rotation.y = 0;
        } else if (progress < 0.35) {
          const t = (progress - 0.1) / 0.25;
          mesh.position.set(THREE.MathUtils.lerp(startX, loopW, t), 0.08, loopZ);
          mesh.rotation.y = Math.PI / 2;
        } else if (progress < 0.55) {
          const t = (progress - 0.35) / 0.2;
          mesh.position.set(loopW, 0.08, THREE.MathUtils.lerp(loopZ, -loopZ, t));
          mesh.rotation.y = Math.PI;
        } else if (progress < 0.8) {
          const t = (progress - 0.55) / 0.25;
          mesh.position.set(THREE.MathUtils.lerp(loopW, -9.5, t), 0.08, -loopZ);
          mesh.rotation.y = -Math.PI / 2;
        } else if (progress < 0.92) {
          const t = (progress - 0.8) / 0.12;
          mesh.position.set(-9.5, 0.08, THREE.MathUtils.lerp(-loopZ, loopZ, t));
          mesh.rotation.y = 0;
        } else {
          const t = (progress - 0.92) / 0.08;
          const midX = THREE.MathUtils.lerp(-9.5, startX, Math.min(1, t * 1.4));
          const midZ = THREE.MathUtils.lerp(loopZ, startZ, Math.max(0, (t - 0.4) / 0.6));
          mesh.position.set(midX, 0.08, midZ);
          mesh.rotation.y = t < 0.5 ? Math.PI / 2 : Math.PI;
        }
      };

      // LIVE APSRTC BUS STAND -> BOARD UNTIL FULL -> DRIVE OUT ONTO CITY ROADS!
      for (const bsim of this.busSimulations) {
        const cycle = (elapsed + bsim.phaseOffset) % 22.0; // 22-sec full city trip!
        if (cycle < 6.5) {
          // Bus parked in bay; passengers walk in one-by-one until bus is FULL!
          bsim.bus.visible = true;
          bsim.bus.position.set(bsim.bayX, 0.08, bsim.bayZ);
          bsim.bus.rotation.y = 0;
          bsim.passengers.forEach((pax, i) => {
            const walkProg = (cycle - i * 1.5) / 1.8;
            if (walkProg < 0) {
              pax.visible = true;
              pax.position.set(bsim.bayX - 1.1 + i * 1.0, 0.14, bsim.waitZ);
              pax.rotation.y = 0;
            } else if (walkProg < 1) {
              pax.visible = true;
              const px = THREE.MathUtils.lerp(bsim.bayX - 1.1 + i * 1.0, bsim.bayX + 0.7, walkProg);
              const pz = THREE.MathUtils.lerp(bsim.waitZ, bsim.bayZ + 1.2, walkProg);
              pax.position.set(px, 0.14 + Math.abs(Math.sin(elapsed * 10)) * 0.14, pz);
            } else {
              pax.visible = false; // Inside bus!
            }
          });
        } else {
          // Bus is FULL -> Drives OUT of Bus Stand onto City Roads and tours the city!
          bsim.passengers.forEach((pax) => (pax.visible = false));
          const roadProg = (cycle - 6.5) / 15.5;
          driveCityRoadLoop(bsim.bus, roadProg, bsim.bayX, bsim.bayZ, 28.5, 9.5);
        }
      }

      // LIVE TRANSPORT OFFICE & AUTO STAND -> PASSENGERS BOARD REAL AUTOS -> DRIVE OUT ONTO CITY ROADS!
      for (const asim of this.autoSimulations) {
        const cycle = (elapsed + asim.phaseOffset) % 20.0; // 20-sec full city passenger trip!
        if (cycle < 5.0) {
          // Auto parked at stand; passengers walk up and get INSIDE the open auto cabin!
          asim.auto.visible = true;
          asim.auto.position.set(asim.stopX, 0.08, asim.stopZ);
          asim.auto.rotation.y = 0;
          let boardedCount = 0;
          asim.passengers.forEach((pax, i) => {
            const walkProg = (cycle - i * 1.4) / 1.6;
            if (walkProg < 0) {
              pax.visible = true;
              pax.position.set(asim.waitX - 0.5 + i * 1.0, 0.14, asim.waitZ);
              pax.rotation.y = 0;
            } else if (walkProg < 1) {
              pax.visible = true;
              const px = THREE.MathUtils.lerp(asim.waitX - 0.5 + i * 1.0, asim.stopX, walkProg);
              const pz = THREE.MathUtils.lerp(asim.waitZ, asim.stopZ - 0.3, walkProg);
              pax.position.set(px, 0.14 + Math.abs(Math.sin(elapsed * 10)) * 0.14, pz);
            } else {
              pax.visible = false;
              boardedCount++;
            }
          });
          if (asim.auto.userData.seatedPassengers) {
            asim.auto.userData.seatedPassengers.visible = boardedCount > 0;
          }
        } else {
          // Passengers seated inside -> Auto drives OUT of Auto Stand onto City Roads!
          asim.passengers.forEach((pax) => (pax.visible = false));
          if (asim.auto.userData.seatedPassengers) {
            asim.auto.userData.seatedPassengers.visible = true;
          }
          const roadProg = (cycle - 5.0) / 15.0;
          driveCityRoadLoop(asim.auto, roadProg, asim.stopX, asim.stopZ, 28.5, 9.5);
        }
      }

      for (const psim of this.policeSimulations) {
        const cycle = elapsed % 12.0;
        if (cycle < 2.5) {
          psim.car.position.set(4.2, 0.1, 3.8);
          psim.car.rotation.y = 0;
        } else if (cycle < 4.5) {
          const p = (cycle - 2.5) / 2.0;
          psim.car.position.set(4.2, 0.1, THREE.MathUtils.lerp(3.8, 8.6, p));
          psim.car.rotation.y = 0;
        } else if (cycle < 8.0) {
          const p = (cycle - 4.5) / 3.5;
          psim.car.position.set(THREE.MathUtils.lerp(4.2, -6.5, p), 0.1, 8.6);
          psim.car.rotation.y = -Math.PI / 2;
        } else if (cycle < 10.2) {
          const p = (cycle - 8.0) / 2.2;
          psim.car.position.set(THREE.MathUtils.lerp(-6.5, 4.2, p), 0.1, 8.6);
          psim.car.rotation.y = Math.PI / 2;
        } else {
          const p = (cycle - 10.2) / 1.8;
          psim.car.position.set(4.2, 0.1, THREE.MathUtils.lerp(8.6, 3.8, p));
          psim.car.rotation.y = Math.PI;
        }
      }

      for (const asim of this.ambulanceSimulations) {
        const cycle = elapsed % 14.0;
        if (cycle < 2.5) {
          const p = cycle / 2.5;
          asim.crashCar.visible = true;
          asim.hazardCone.visible = true;
          asim.patient.visible = true;
          asim.patient.position.set(4.8, 0.14, 7.6);
          asim.ambulance.position.set(-3.5, 0.1, THREE.MathUtils.lerp(4.0, 8.6, p));
          asim.ambulance.rotation.y = 0;
        } else if (cycle < 5.5) {
          const p = (cycle - 2.5) / 3.0;
          asim.ambulance.position.set(THREE.MathUtils.lerp(-3.5, 3.4, p), 0.1, 8.6);
          asim.ambulance.rotation.y = Math.PI / 2;
        } else if (cycle < 8.0) {
          const p = (cycle - 5.5) / 2.5;
          asim.ambulance.position.set(3.4, 0.1, 8.6);
          asim.ambulance.rotation.y = Math.PI / 2;
          asim.patient.position.set(
            THREE.MathUtils.lerp(4.8, 3.4, p),
            0.14 + Math.abs(Math.sin(elapsed * 8)) * 0.12,
            THREE.MathUtils.lerp(7.6, 8.6, p)
          );
          if (p > 0.85) asim.patient.visible = false;
        } else if (cycle < 11.2) {
          const p = (cycle - 8.0) / 3.2;
          asim.patient.visible = false;
          asim.ambulance.position.set(THREE.MathUtils.lerp(3.4, -3.5, p), 0.1, 8.6);
          asim.ambulance.rotation.y = -Math.PI / 2;
        } else {
          const p = (cycle - 11.2) / 2.8;
          asim.ambulance.position.set(-3.5, 0.1, THREE.MathUtils.lerp(8.6, 4.0, p));
          asim.ambulance.rotation.y = Math.PI;
          asim.crashCar.visible = p < 0.7;
          asim.hazardCone.visible = p < 0.7;
        }
      }

      if (this.postman) {
        const pm = this.postman;
        if (pm.stopTimer > 0) {
          pm.stopTimer -= dt;
          pm.letter.visible = true;
          pm.letter.position.y = 1.05 + Math.sin(elapsed * 12) * 0.18;
        } else {
          pm.letter.visible = false;
          pm.t = (pm.t + dt * 0.085) % 4;
          const side = Math.floor(pm.t);
          const f = pm.t - side;
          const L = pm.loopRadius;
          const posAlong = -L + f * (2 * L);

          if (side === 0) {
            pm.mesh.position.set(posAlong, 0.08, -L);
            pm.mesh.rotation.y = Math.PI / 2;
          } else if (side === 1) {
            pm.mesh.position.set(L, 0.08, posAlong);
            pm.mesh.rotation.y = 0;
          } else if (side === 2) {
            pm.mesh.position.set(-posAlong, 0.08, L);
            pm.mesh.rotation.y = -Math.PI / 2;
          } else {
            pm.mesh.position.set(-L, 0.08, -posAlong);
            pm.mesh.rotation.y = Math.PI;
          }
          if (Math.random() < 0.008) pm.stopTimer = 1.6;
        }
      }

      for (const a of this.landmarkActors) {
        const t = elapsed * a.speed + a.phase;
        if (a.mode === "patrol_x") {
          const offset = Math.sin(t) * a.range;
          a.mesh.position.set(a.baseX + offset, 0.14 + Math.abs(Math.sin(t * 4)) * 0.12, a.baseZ);
          a.mesh.rotation.y = Math.cos(t) >= 0 ? Math.PI / 2 : -Math.PI / 2;
        } else if (a.mode === "patrol_z") {
          const offset = Math.sin(t) * a.range;
          a.mesh.position.set(a.baseX, 0.14 + Math.abs(Math.sin(t * 4)) * 0.12, a.baseZ + offset);
          a.mesh.rotation.y = Math.cos(t) >= 0 ? 0 : Math.PI;
        } else if (a.mode === "orbit") {
          const nx = a.baseX + Math.cos(t) * a.range;
          const nz = a.baseZ + Math.sin(t) * a.range;
          a.mesh.position.set(nx, 0.24 + Math.abs(Math.sin(t * 5)) * 0.18, nz);
          a.mesh.rotation.y = -t;
        } else if (a.mode === "hop") {
          a.mesh.position.set(a.baseX, 0.24 + Math.abs(Math.sin(t)) * 0.18, a.baseZ);
          a.mesh.rotation.y = Math.PI / 2 + Math.sin(t * 0.5) * 0.3;
        } else if (a.mode === "guard") {
          a.mesh.position.set(a.baseX, 0.2, a.baseZ);
          a.mesh.rotation.y = Math.sin(t * 0.6) * 0.5;
        } else if (a.mode === "clean_auto") {
          // Driver moves back and forth alongside the auto wiping it clean!
          const dz = Math.sin(t * 0.65) * a.range;
          a.mesh.position.set(a.baseX, 0.14 + Math.abs(Math.sin(t * 2.5)) * 0.08, a.baseZ + dz);
          a.mesh.rotation.y = a.baseX < -3.0 ? Math.PI / 2 : -Math.PI / 2;
        } else if (a.mode === "gym_run") {
          // Fast jogging bounce on gym treadmill!
          a.mesh.position.set(a.baseX, 0.4 + Math.abs(Math.sin(t)) * 0.18, a.baseZ);
          a.mesh.rotation.y = Math.PI;
        } else if (a.mode === "gym_lift") {
          // Rhythmic dumbbell curl & squat pump!
          a.mesh.position.set(a.baseX, 0.22 + Math.abs(Math.sin(t)) * 0.14, a.baseZ);
          a.mesh.rotation.y = Math.sin(t * 0.3) * 0.25;
        } else if (a.mode === "ball_x") {
          const bx = a.baseX + Math.sin(t) * a.range;
          const by = 0.35 + Math.abs(Math.cos(t * 2)) * 1.3;
          a.mesh.position.set(bx, by, a.baseZ);
        }
      }

      for (const v of this.vehicles) {
        if (v.horizontal) {
          v.mesh.position.x += v.dir * v.speed * dt;
          if (v.mesh.position.x > v.limit) v.mesh.position.x = -v.limit;
          if (v.mesh.position.x < -v.limit) v.mesh.position.x = v.limit;
        } else {
          v.mesh.position.z += v.dir * v.speed * dt;
          if (v.mesh.position.z > v.limit) v.mesh.position.z = -v.limit;
          if (v.mesh.position.z < -v.limit) v.mesh.position.z = v.limit;
        }
        const vx = v.mesh.position.x;
        const vz = v.mesh.position.z;
        let blocked = false;
        for (const z of this.blockedRoadZones) {
          if (vx >= z.minX && vx <= z.maxX && vz >= z.minZ && vz <= z.maxZ) {
            blocked = true;
            break;
          }
        }
        v.mesh.visible = !blocked;
      }

      for (const rv of this.ringVehicles) {
        const step = (rv.speed * dt) / (rv.lane * 2);
        rv.t = (rv.t + (rv.cw ? step : -step) + 4) % 4;
        const side = Math.floor(rv.t);
        const f = rv.t - side;
        const L = rv.lane;
        const posAlong = -L + f * (2 * L);

        if (side === 0) {
          rv.mesh.position.set(posAlong, 0.1, -L);
          rv.mesh.rotation.y = rv.cw ? Math.PI / 2 : -Math.PI / 2;
        } else if (side === 1) {
          rv.mesh.position.set(L, 0.1, posAlong);
          rv.mesh.rotation.y = rv.cw ? 0 : Math.PI;
        } else if (side === 2) {
          rv.mesh.position.set(-posAlong, 0.1, L);
          rv.mesh.rotation.y = rv.cw ? -Math.PI / 2 : Math.PI / 2;
        } else {
          rv.mesh.position.set(-L, 0.1, -posAlong);
          rv.mesh.rotation.y = rv.cw ? Math.PI : 0;
        }
      }

      for (const w of this.workers) {
        w.mesh.position.x += Math.cos(w.angle) * w.speed * dt;
        w.mesh.position.z += Math.sin(w.angle) * w.speed * dt;
        w.mesh.position.y = 0.1 + Math.abs(Math.sin(elapsed * 7 + w.phase)) * 0.14;
        w.mesh.rotation.y = -w.angle + Math.PI / 2;

        if (
          Math.abs(w.mesh.position.x) > w.limit ||
          Math.abs(w.mesh.position.z) > w.limit ||
          Math.random() < 0.008
        ) {
          w.angle += (Math.random() - 0.5) * 1.5;
          w.mesh.position.x = THREE.MathUtils.clamp(w.mesh.position.x, -w.limit, w.limit);
          w.mesh.position.z = THREE.MathUtils.clamp(w.mesh.position.z, -w.limit, w.limit);
        }
      }
    }

    for (let i = this.constructions.length - 1; i >= 0; i--) {
      const c = this.constructions[i];
      c.progress += dt * 0.42;
      const t = Math.min(1, c.progress);
      c.buildingObj.scale.y = 0.05 + 0.95 * t;
      c.siteWorkers.forEach((npc, idx) => {
        npc.position.y = 0.1 + Math.abs(Math.sin(c.progress * 18 + idx)) * 0.25;
        npc.rotation.y += dt * 3;
      });
      if (t >= 1) {
        c.plotGroup.remove(c.scaffold);
        c.siteWorkers.forEach((npc) => c.plotGroup.remove(npc));
        this.constructions.splice(i, 1);
      }
    }


    // ✈️ 20-ACRE INTERNATIONAL AIRPORT + 🦁💎 SHERU BHAI DIAMOND CAR & HELICOPTER LIVE SIMULATION
    if (this.lifeEnabled && this.airportSim) {
      const sim = this.airportSim;

      // Rotate ATC Tower Radar & Blink Aviation Beacon
      sim.radarGroup.rotation.y += dt * 1.8;
      sim.beacon.visible = Math.sin(elapsed * 6.0) > 0;

      // -------------------------------------------------------------
      // A. COMMERCIAL FLIGHT + SHUTTLE BUS + PASSENGER BOARDING (34s loop)
      // -------------------------------------------------------------
      const pCycle = elapsed % 34.0;
      const plane = sim.plane;
      const bus = sim.shuttleBus;

      if (pCycle < 4.5) {
        // Stage 1: Plane parked at boarding bay; Airport Shuttle Bus drives from Terminal to Plane stairs!
        const t = pCycle / 4.5;
        plane.position.set(-2.0, 0.08, -12.0);
        plane.rotation.set(0, 0, 0);

        bus.position.set(THREE.MathUtils.lerp(-19.5, -10.2, t), 0.08, THREE.MathUtils.lerp(-14.0, -10.5, t));
        bus.rotation.set(0, Math.PI / 2, 0);
        sim.planePassengers.forEach((p) => (p.visible = false));
      } else if (pCycle < 10.5) {
        // Stage 2: Passengers step out of Shuttle Bus -> Climb Boarding Stairs -> Go INSIDE Airplane!
        plane.position.set(-2.0, 0.08, -12.0);
        plane.rotation.set(0, 0, 0);

        const boardElapsed = pCycle - 4.5;
        bus.position.set(-10.2, 0.08, -10.5);
        bus.rotation.set(0, Math.PI / 2, 0);

        sim.planePassengers.forEach((pax, i) => {
          const wp = (boardElapsed - i * 0.72) / 2.2;
          if (wp < 0 || wp >= 1) {
            pax.visible = false;
          } else {
            pax.visible = true;
            if (wp < 0.35) {
              // Walk from shuttle bus door to bottom of stairs
              const s = wp / 0.35;
              pax.position.set(
                THREE.MathUtils.lerp(-8.8, -6.0, s),
                0.14 + Math.abs(Math.sin(elapsed * 12 + i)) * 0.1,
                THREE.MathUtils.lerp(-10.4, -9.8, s)
              );
              pax.rotation.y = Math.PI / 2;
            } else {
              // Climb UP the stairs straight inside the Airplane door!
              const s = (wp - 0.35) / 0.65;
              pax.position.set(
                THREE.MathUtils.lerp(-6.0, -2.8, s),
                THREE.MathUtils.lerp(0.2, 2.25, s) + Math.abs(Math.sin(elapsed * 14 + i)) * 0.08,
                -9.8
              );
              pax.rotation.y = Math.PI / 2;
            }
          }
        });
      } else if (pCycle < 15.0) {
        // Stage 3: Shuttle Bus returns to Terminal; Plane taxis onto Runway & Takes Off into the Sky!
        sim.planePassengers.forEach((p) => (p.visible = false));
        const t = (pCycle - 10.5) / 4.5;

        const busBackT = Math.min(1, t * 1.4);
        bus.position.set(THREE.MathUtils.lerp(-10.2, -19.5, busBackT), 0.08, THREE.MathUtils.lerp(-10.5, -14.0, busBackT));
        bus.rotation.set(0, -Math.PI / 2, 0);

        if (t < 0.4) {
          // Taxi South-East onto runway threshold (24, 34)
          const st = t / 0.4;
          const px = THREE.MathUtils.lerp(-2.0, 24.0, st);
          const pz = THREE.MathUtils.lerp(-12.0, 34.0, st);
          plane.position.set(px, 0.08, pz);
          plane.rotation.set(0, Math.atan2(26.0, 46.0), 0);
        } else {
          // Accelerate North down the 88-unit Runway & Climb smoothly into the Air!
          const st = (t - 0.4) / 0.6;
          const accel = st * st;
          const pz = THREE.MathUtils.lerp(34.0, -48.0, accel);
          const lift = st > 0.45 ? Math.pow((st - 0.45) / 0.55, 1.5) * 20.0 : 0;
          plane.position.set(24.0, 0.08 + lift, pz);
          plane.rotation.set(st > 0.4 ? -0.22 * Math.min(1, (st - 0.4) * 2.5) : 0, Math.PI, 0);
        }
      } else if (pCycle < 28.0) {
        // Stage 4: Commercial Airplane Flies High Around the ENTIRE CITY!
        sim.planePassengers.forEach((p) => (p.visible = false));
        bus.position.set(-19.5, 0.08, -14.0);
        bus.rotation.set(0, Math.PI / 2, 0);

        const ft = (pCycle - 15.0) / 13.0;
        const pos = sim.planeCityLoop.getPointAt(Math.min(0.999, ft));
        const ahead = sim.planeCityLoop.getPointAt(Math.min(1, ft + 0.015));
        plane.position.copy(pos);
        plane.lookAt(ahead.x + sim.ax, ahead.y, ahead.z);
        plane.rotateZ(0.24); // Graceful banking turn over the city!
      } else {
        // Stage 5: Final Approach, Smooth Runway Touchdown & Taxi Back to Boarding Bay!
        sim.planePassengers.forEach((p) => (p.visible = false));
        bus.position.set(-19.5, 0.08, -14.0);
        bus.rotation.set(0, Math.PI / 2, 0);

        const lt = (pCycle - 28.0) / 6.0;
        if (lt < 0.6) {
          // Approach from South (+58 Z) -> Touchdown & roll North along runway to (-30 Z)
          const st = lt / 0.6;
          const pz = THREE.MathUtils.lerp(58.0, -32.0, st);
          const alt = st < 0.45 ? THREE.MathUtils.lerp(24.0, 0.08, st / 0.45) : 0.08;
          plane.position.set(24.0, alt, pz);
          plane.rotation.set(st < 0.45 ? -0.08 : 0, Math.PI, 0);
        } else {
          // Taxi via North taxiway back to boarding bay (-2, -12)
          const st = (lt - 0.6) / 0.4;
          const px = THREE.MathUtils.lerp(24.0, -2.0, st);
          const pz = THREE.MathUtils.lerp(-32.0, -12.0, st);
          plane.position.set(px, 0.08, pz);
          plane.rotation.set(0, Math.atan2(-26.0, 20.0), 0);
        }
      }

      // -------------------------------------------------------------
      // B. SHERU BHAI (LION IN RICH CLOTHES & GOLD CHAINS)
      //    DIAMOND CAR -> INSIDE AIRPORT -> DIAMOND HELICOPTER -> CITY TOUR (34s loop)
      // -------------------------------------------------------------
      const sCycle = (elapsed + 2.0) % 34.0;
      const dCar = sim.diamondCar;
      const wSheru = sim.walkingSheru;
      const dHeli = sim.diamondHeli;
      let rotorSpeed = 2.0;

      if (sCycle < 6.0) {
        // Stage 1: Sheru Bhai arrives in Sparkling Diamond Car from City Highway -> INSIDE Airport next to Helipad!
        const t = sCycle / 6.0;
        const ease = 1 - Math.pow(1 - t, 2);
        dCar.position.set(THREE.MathUtils.lerp(-60.0, -16.0, ease), 0.08, THREE.MathUtils.lerp(18.0, 22.0, Math.max(0, (t - 0.55) / 0.45)));
        dCar.rotation.set(0, Math.PI / 2 - (t > 0.55 ? 0.18 : 0), 0);
        if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = true;

        wSheru.visible = false;
        dHeli.position.set(-1.0, 0.18, 24.0);
        dHeli.rotation.set(0, -Math.PI / 2, 0);
        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = false;
        rotorSpeed = 1.6;
      } else if (sCycle < 11.0) {
        // Stage 2: Sheru Bhai steps out of Diamond Car & walks along Red Carpet -> climbs INSIDE Diamond Helicopter!
        const t = (sCycle - 6.0) / 5.0;
        dCar.position.set(-16.0, 0.08, 22.0);
        dCar.rotation.set(0, Math.PI / 2 - 0.18, 0);
        if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = false;

        wSheru.visible = true;
        wSheru.position.set(
          THREE.MathUtils.lerp(-14.2, -2.5, t),
          0.16 + Math.abs(Math.sin(elapsed * 11)) * 0.14,
          THREE.MathUtils.lerp(22.4, 24.0, t)
        );
        wSheru.rotation.y = Math.PI / 2;

        dHeli.position.set(-1.0, 0.18, 24.0);
        dHeli.rotation.set(0, -Math.PI / 2, 0);
        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = false;
        rotorSpeed = 2.0 + t * 14.0; // Rotors spin up as Sheru Bhai approaches!
      } else if (sCycle < 14.5) {
        // Stage 3: Sheru Bhai INSIDE Diamond Helicopter -> Vertical Liftoff off VIP Helipad!
        const t = (sCycle - 11.0) / 3.5;
        dCar.position.set(-16.0, 0.08, 22.0);
        if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = false;
        wSheru.visible = false;

        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = true;
        dHeli.position.set(-1.0, THREE.MathUtils.lerp(0.18, 20.0, t * t * (3 - 2 * t)), 24.0);
        dHeli.rotation.set(0.12 * t, -Math.PI / 2, 0);
        rotorSpeed = 24.0;
      } else if (sCycle < 28.0) {
        // Stage 4: Sheru Bhai Flies Diamond Helicopter Around the ENTIRE CITY (swooping past Sheru Bhai Statue!)
        const ft = (sCycle - 14.5) / 13.5;
        dCar.position.set(-16.0, 0.08, 22.0);
        if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = false;
        wSheru.visible = false;
        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = true;

        const pos = sim.heliCityLoop.getPointAt(Math.min(0.999, ft));
        const ahead = sim.heliCityLoop.getPointAt(Math.min(1, ft + 0.018));
        dHeli.position.copy(pos);
        dHeli.lookAt(ahead.x + sim.ax, ahead.y, ahead.z);
        dHeli.rotateX(0.14); // Forward flight tilt!
        rotorSpeed = 26.0;
      } else if (sCycle < 31.0) {
        // Stage 5a: Diamond Helicopter descends softly onto VIP Helipad!
        const t = (sCycle - 28.0) / 3.0;
        dCar.position.set(-16.0, 0.08, 22.0);
        if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = false;
        wSheru.visible = false;
        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = true;

        dHeli.position.set(-1.0, THREE.MathUtils.lerp(20.0, 0.18, t), 24.0);
        dHeli.rotation.set(0, -Math.PI / 2, 0);
        rotorSpeed = 24.0 * (1 - t * 0.7);
      } else {
        // Stage 5b: Sheru Bhai walks back to Diamond Car & drives out toward City!
        const t = (sCycle - 31.0) / 3.0;
        dHeli.position.set(-1.0, 0.18, 24.0);
        dHeli.rotation.set(0, -Math.PI / 2, 0);
        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = false;
        rotorSpeed = 3.0;

        if (t < 0.5) {
          const wt = t / 0.5;
          wSheru.visible = true;
          wSheru.position.set(
            THREE.MathUtils.lerp(-2.5, -14.2, wt),
            0.16 + Math.abs(Math.sin(elapsed * 11)) * 0.14,
            THREE.MathUtils.lerp(24.0, 22.4, wt)
          );
          wSheru.rotation.y = -Math.PI / 2;
          dCar.position.set(-16.0, 0.08, 22.0);
          if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = false;
        } else {
          const dtCar = (t - 0.5) / 0.5;
          wSheru.visible = false;
          if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = true;
          dCar.position.set(THREE.MathUtils.lerp(-16.0, -60.0, dtCar), 0.08, THREE.MathUtils.lerp(22.0, 18.0, dtCar));
          dCar.rotation.set(0, -Math.PI / 2, 0);
        }
      }

      // Spin Diamond Helicopter Main & Tail Rotors
      if (dHeli.userData.mainRotor) dHeli.userData.mainRotor.rotation.y += dt * rotorSpeed;
      if (dHeli.userData.tailRotor) dHeli.userData.tailRotor.rotation.x += dt * (rotorSpeed * 1.4);
    }



    // 🚂 LIVE INDIAN EXPRESS TRAIN + MOUNTAIN TUNNEL + STATION PASSENGER BOARDING (34s loop)
    if (this.lifeEnabled && this.railwaySim) {
      const rsim = this.railwaySim;
      const cycle = elapsed % 34.0;
      let headT = 0;

      // 0..13s: Emerges from South-West Mountain Tunnel -> speeds East (past Welcome Arch & Airport) -> pulls smoothly into North Railway Station!
      // 13..20s: STOPPED AT RAILWAY STATION PLATFORM 1 -> 6 Passengers walk forward & board INSIDE the Express Coaches!
      // 20..34s: Departs Railway Station -> circles West side (past Sheru Bhai Beach!) -> dives straight back into Mountain Tunnel!
      if (cycle < 13.0) {
        const p = cycle / 13.0;
        // Smooth deceleration as train approaches Railway Station
        const eased = p < 0.78 ? p / 0.78 * 0.88 : 0.88 + (1 - Math.pow(1 - (p - 0.78) / 0.22, 2)) * 0.12;
        headT = eased * rsim.stationT;
      } else if (cycle < 20.0) {
        headT = rsim.stationT;
      } else {
        const p = (cycle - 20.0) / 14.0;
        // Smooth acceleration leaving Railway Station back toward Mountain Tunnel!
        const eased = p < 0.22 ? Math.pow(p / 0.22, 2) * 0.12 : 0.12 + ((p - 0.22) / 0.78) * 0.88;
        headT = rsim.stationT + eased * (1.0 - rsim.stationT);
      }

      // Position Locomotive & 3 Express Coaches cleanly along the spline (each bends around corners!)
      const carSpacingT = 6.1 / Math.max(rsim.totalLen, 100);
      rsim.trainCars.forEach((car, idx) => {
        const carT = (headT - idx * carSpacingT + 1.0) % 1.0;
        const pos = rsim.trackCurve.getPointAt(carT);
        const ahead = rsim.trackCurve.getPointAt((carT + 0.008) % 1.0);
        car.position.set(pos.x, 0.16, pos.z);
        car.lookAt(ahead.x, 0.16, ahead.z);
      });

      // Animate 6 Railway Station Passengers on Platform 1
      if (cycle >= 13.0 && cycle < 20.0) {
        const boardElapsed = cycle - 13.0;
        rsim.stationPassengers.forEach((pax, i) => {
          const wp = (boardElapsed - i * 0.65) / 2.0;
          if (wp < 0) {
            pax.visible = true;
            pax.position.set(-7.5 + i * 3.0, 0.92, -3.8);
            pax.rotation.y = 0;
          } else if (wp < 1) {
            pax.visible = true;
            pax.position.set(
              -7.5 + i * 3.0,
              0.92 + Math.abs(Math.sin(elapsed * 12 + i)) * 0.12,
              THREE.MathUtils.lerp(-3.8, -0.6, wp)
            );
            pax.rotation.y = 0;
          } else {
            pax.visible = false; // Boarded inside Express Train!
          }
        });
      } else {
        // Next group of passengers waiting on Platform 1 for the train to return!
        rsim.stationPassengers.forEach((pax, i) => {
          pax.visible = cycle < 13.0 || cycle > 25.0;
          pax.position.set(-7.5 + i * 3.0, 0.92, -3.8);
          pax.rotation.y = 0;
        });
      }
    }

    // 🏖️ Animated Rolling Ocean Waves & Chilling Sheru Bhai on the Beach
    if (this.lifeEnabled && this.beachSim) {
      for (const w of this.beachSim.waveStrips) {
        const waveCycle = (elapsed * 0.65 + w.phase) % 1;
        w.mesh.position.x = w.baseX + waveCycle * 6.5;
        w.mesh.scale.set(1.0 + Math.sin(waveCycle * Math.PI) * 0.4, 1, 1);
      }
      if (this.beachSim.chillingHead) {
        this.beachSim.chillingHead.rotation.y = Math.sin(elapsed * 0.9) * 0.22;
      }
    }

    // 🚘 Rotating Glass Car Turntable inside 8-Plot Audi Showroom
    if (this.lifeEnabled && this.turntableRotors.length > 0) {
      for (const tr of this.turntableRotors) {
        tr.mesh.rotation.y += dt * tr.speed;
      }
    }

    // 📸 Periodic Studio Softbox Camera Flash inside 2-Plot Photo Studios
    if (this.lifeEnabled && this.studioFlashes.length > 0) {
      for (const sf of this.studioFlashes) {
        const pulse = (elapsed * 0.7 + sf.phase) % 2.4;
        sf.mesh.visible = pulse < 0.18 || (pulse > 0.3 && pulse < 0.42);
      }
    }

    // Animated Water Fountain Jets at Sheru Bhai Lion Statue
    if (this.lifeEnabled && this.fountainJets.length > 0) {
      for (const jet of this.fountainJets) {
        const p = (elapsed * 1.4 + jet.phase) % 1;
        const rad = 1.8 + p * 2.1;
        const h = 0.65 + Math.sin(p * Math.PI) * 1.65;
        jet.mesh.position.set(Math.cos(jet.ang) * rad, h, Math.sin(jet.ang) * rad);
      }
    }

    // Soft Drifting Sky Clouds (Day / Sunset)
    if (this.lifeEnabled && this.skyClouds.length > 0 && this.timeOfDay !== "night") {
      for (const cl of this.skyClouds) {
        cl.mesh.position.x += cl.speed * dt;
        if (cl.mesh.position.x > 160) cl.mesh.position.x = -160;
      }
    }

    // Low-RAM Distance Sprite Culling (hides far @username signs to keep 60fps!)
    this._cullAccum += dt;
    if (this._cullAccum > 0.25) {
      this._cullAccum = 0;
      const cx = this.camera.position.x;
      const cz = this.camera.position.z;
      const maxDistSq = this.isLowRam ? 105 * 105 : 145 * 145;
      for (let i = 0; i < this.plotSigns.length; i++) {
        const ps = this.plotSigns[i];
        const dx = ps.x - cx;
        const dz = ps.z - cz;
        ps.sprite.visible = dx * dx + dz * dz < maxDistSq;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
