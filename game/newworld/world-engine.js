import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const EIGHT_PLOT_TYPES = new Set(["ground", "audi_showroom", "movie_theater", "imax_theater", "mahindra_showroom", "bmw_showroom"]);

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
  "iti_college",
  "dmart",
  "tirumala_temple",
  "hotel_oyo",
  "city_park",
  "library",
  "swimming_pool",
  "hostel",
  "wine_shop"
]);

export const TWO_PLOT_TYPES = new Set(["photo_studio", "beach_villa_2", "mobile_showroom"]);

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
  mobile_shop: "📱 మొబైల్ షాప్ • MOBILE SHOP (1 PLOT)",
  mobile_showroom: "📱 మొబైల్ షోరూమ్ • MEGA MOBILE HUB (2 PLOTS)",
  ice_cream_shop: "🍨 ఐస్ క్రీమ్ షాప్ • ICE CREAM PARLOUR (1 PLOT)",
  veg_shop: "🥬 కూరగాయల షాప్ • FRESH VEGETABLE SHOP (1 PLOT)",
  mahindra_showroom: "🚙 మహీంద్రా షోరూమ్ • MAHINDRA SUV SHOWROOM (8 PLOTS)",
  bmw_showroom: "🏎️ బిఎండబ్ల్యూ షోరూమ్ • BMW LUXURY SHOWROOM (8 PLOTS)",
  tirumala_temple: "🛕 తిరుమల టెంపుల్ • TIRUMALA VENKATESWARA TEMPLE (4 PLOTS)",
  medical_shop: "💊 మెడికల్ షాప్ • 24/7 MEDICAL & PHARMACY (1 PLOT)",
  hotel_oyo: "🏨 20-ఫ్లోర్ ఓయో • 20-FLOOR OYO ROOMS TOWER (4 PLOTS)",
  hostel: "🏢 హాస్టల్ • BOYS & GIRLS HOSTEL (4 PLOTS)",
  wine_shop: "🍾 వైన్ షాప్ • ROYAL WINES & SPIRITS (4 PLOTS)",
  city_park: "🌳 సిటీ పార్క్ • CENTRAL CITY PARK (4 PLOTS)",
  library: "📚 లైబ్రరీ • GRAND PUBLIC LIBRARY (4 PLOTS)",
  swimming_pool: "🏊 స్విమ్మింగ్ పూల్ • OLYMPIC SWIMMING POOL (4 PLOTS)",
  ground: "🏏 గ్రౌండ్ • MEGA CRICKET STADIUM (8 PLOTS)",
  audi_showroom: "🚘 ఆడి షోరూమ్ • AUDI SHOWROOM (8 PLOTS)",
  beach_villa: "🏖️ బీచ్ విల్లా • BEACH HOUSE VILLA (1 PLOT)",
  beach_villa_2: "🏖️ మెగా బీచ్ విల్లా • MEGA BEACH VILLA (2 PLOTS)",
  movie_theater: "🎭 మూవీ థియేటర్ • REAL IMAX MULTIPLEX (8 PLOTS)",
  imax_theater: "🎬 ఐమాక్స్ 3D • GIANT IMAX DOME (8 PLOTS)",
  dmart: "🛒 డి-మార్ట్ • D-MART HYPERMARKET (4 PLOTS)",
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
  constructor(container, onPlotSelected, options = {}) {
    this.container = container;
    this.onPlotSelected = onPlotSelected;
    this.hqMode = Boolean(options.highQuality);
    this.isReelFraming = false;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    // Clean distant atmospheric haze so buildings & Araku peaks stay crystal clear!
    this.scene.fog = new THREE.Fog(0x9bd7f0, 460, 1550);

    const initW = container.clientWidth || window.innerWidth || 360;
    const initH = container.clientHeight || window.innerHeight || 640;
    const aspect = initW / initH;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 1.0, 2400);
    this.camera.position.set(78, 82, 78);

    // AUTO VERY-LOW-RAM DETECTION (2GB-4GB phones get zero-crash ultra-smooth play automatically!)
    const devMem = navigator.deviceMemory || 4;
    const cpuCores = navigator.hardwareConcurrency || 4;
    this.isVeryLowRam = !this.hqMode && (devMem <= 3 || cpuCores <= 4);
    this.isLowRam = !this.hqMode && (devMem <= 4 || cpuCores <= 4);

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.hqMode || !this.isLowRam,
      powerPreference: this.isVeryLowRam ? "default" : "high-performance",
      precision: this.hqMode ? "highp" : this.isVeryLowRam ? "lowp" : "mediump",
      stencil: false
    });
    this.renderer.setSize(initW, initH);
    const isMobScreen = Math.min(initW, initH) < 720;
    this.renderer.setPixelRatio(
      this.hqMode
        ? Math.min(window.devicePixelRatio || 2, isMobScreen ? 1.75 : 2.0)
        : (this.isVeryLowRam ? 1.0 : this.isLowRam ? 1.15 : Math.min(window.devicePixelRatio || 1.5, 1.5))
    );
    this._fpsFrames = 0;
    this._fpsAccum = 0;
    this._perfThrottle = false;
    this._animFrameTick = 0;
    this._emptyPlotCoords = new Map();
    this._boxGeoCache = new Map();
    this._tabHidden = false;
    document.addEventListener("visibilitychange", () => {
      this._tabHidden = document.hidden;
      if (!document.hidden && this.clock) this.clock.getDelta();
    });

    // v26 Cinema Quality (Admin Reel Mode Only) + Hero .glb 3D Models
    this.shadowsEnabled = false;
    this.bloomEnabled = false;
    this.composer = null;
    this.bloomPass = null;
    this._bloomLoading = false;
    this.heroModelUrls = { statue: "", audi: "", heli: "" };
    this.glbCache = new Map();
    this._gltfLoader = null;
    this.heroStatueSlot = null;
    this.heroHeliSlot = null;
    this.heroAudiSlots = [];
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.hqMode ? 1.14 : 1.08;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy ? this.renderer.capabilities.getMaxAnisotropy() : 1);
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
    this.controls.maxDistance = 540;
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
      this.stopAllReelModes();
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
    this.railwayZ = -88;
    this.railwaySouthZ = 88;
    this.arakuSim = null;
    this.hillTempleSim = null;
    this.hillTemplePos = { x: 46, z: -104 };
    this.beachHighwaySim = null;
    this.landmarkActors = this.landmarkActors.filter(
      (a) => !["BEACH_OYO_DEFAULT", "BEACH_HOSTEL_DEFAULT", "BEACH_MED_DEFAULT"].includes(a.plotId)
    );
    this.railRInner = 70;
    this.railROuter = 73.8;
    this.railwayOwner = "@_ur_bunny_108_";
    this.discoGroup = null;
    this.discoCones = [];
    this.discoPointLight = null;
    this.discoRing = null;
    this.addPlotMode = false;
    this.onAddPlotTap = null;
    this.turntableRotors = [];
    this.studioFlashes = [];
    this.theaterDiscos = [];
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

    // Pro Reel Studio v22 State
    this.simSpeed = 1.0;
    this.simTime = 0;
    this.chaseCam = {
      active: false,
      mode: null, // "train1" | "train2" | "vip" | "flight"
      smoothTarget: new THREE.Vector3(),
      onStop: null
    };
    this.timelapseState = {
      active: false,
      days: [],
      dayIdx: 0,
      timer: 0,
      savedVis: [],
      onStopChange: null,
      onComplete: null
    };
    this.hyperlapse24h = {
      active: false,
      timer: 0,
      duration: 10.0,
      prevSpeed: 1.0,
      prevMode: "day",
      onStop: null
    };
    this.discoOutro = {
      active: false,
      timer: 0,
      duration: 6.5,
      onStop: null
    };
    this.streetWalk = {
      active: false,
      curve: null,
      t: 0,
      speed: 0.04,
      smoothTarget: new THREE.Vector3(),
      onStop: null
    };
    this.skyTransition = {
      active: false,
      timer: 0,
      duration: 2.4,
      fromBg: new THREE.Color(),
      toBg: new THREE.Color(),
      fromFog: new THREE.Color(),
      toFog: new THREE.Color(),
      fromSunCol: new THREE.Color(),
      toSunCol: new THREE.Color(),
      fromSunInt: 1.15,
      toSunInt: 1.15,
      fromHemiInt: 0.95,
      toHemiInt: 0.95,
      targetMode: "day",
      toggledNightProps: false
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
    this._initProceduralTextures();
    this._initSharedMaterials();
    this._initSharedGeometries();
    this._sharedMatSet = new Set(Object.values(this.mat));
    this._sharedGeoSet = new Set(Object.values(this.geo));
    this._initEvents();

    this.ensureCapacity(36);
    this._animate();
  }

  _initLights() {
    // Crisp 4-point cinema lighting so walls, roofs, glass, trains & Lion Statue pop in High Quality!
    this.hemiLight = new THREE.HemisphereLight(0xf0f9ff, 0x365314, 1.02);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.24);
    this.sunLight.position.set(90, 135, 70);
    this.sunTarget = new THREE.Object3D();
    this.sunTarget.position.set(0, 0, 0);
    this.scene.add(this.sunTarget);
    this.sunLight.target = this.sunTarget;
    this.sunLight.castShadow = false;
    const shRes = (Math.min(window.innerWidth || 640, window.innerHeight || 640) < 720) ? 1024 : 2048;
    this.sunLight.shadow.mapSize.set(shRes, shRes);
    this.sunLight.shadow.camera.near = 20;
    this.sunLight.shadow.camera.far = 360;
    this.sunLight.shadow.camera.left = -95;
    this.sunLight.shadow.camera.right = 95;
    this.sunLight.shadow.camera.top = 95;
    this.sunLight.shadow.camera.bottom = -95;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.04;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0xcceeff, 0.52);
    this.fillLight.position.set(-85, 65, -75);
    this.scene.add(this.fillLight);

    this.rimLight = new THREE.DirectionalLight(0xfef3c7, 0.28);
    this.rimLight.position.set(-40, 80, 95);
    this.scene.add(this.rimLight);
  }

  /**
   * 🧱 ZERO-MB PROCEDURAL CANVAS TEXTURES (Crisp Asphalt Road Grain, Lush Grass Blades & Shiny Sky-Reflective Glass!)
   * Generated once in RAM (< 200 KB total) and shared across the entire city for instant realism with zero download lag!
   */
  _initProceduralTextures() {
    const makeTex = (size, drawFn, repeatX = 1, repeatY = 1, repeat = true) => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const ctx = c.getContext("2d");
      drawFn(ctx, size);
      const tex = new THREE.CanvasTexture(c);
      if (repeat) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
      }
      tex.generateMipmaps = !this.isVeryLowRam;
      tex.minFilter = this.isVeryLowRam ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = this.isVeryLowRam ? 1 : Math.min(4, this.maxAnisotropy || 2);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // 1. Crisp Asphalt Road & Highway Grain Texture
    const drawAsphalt = (ctx, s, baseHex) => {
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, s, s);
      // Fine aggregate asphalt grain speckles (deterministic pseudo-random so it tiles cleanly)
      let seed = 1337;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      for (let i = 0; i < 950; i++) {
        const x = rnd() * s;
        const y = rnd() * s;
        const v = rnd();
        ctx.fillStyle = v > 0.65 ? "rgba(255,255,255,0.08)" : v > 0.3 ? "rgba(15,23,42,0.22)" : "rgba(148,163,184,0.09)";
        ctx.fillRect(x, y, 2, 2);
      }
      // Subtle tire wear sheen bands
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.fillRect(0, s * 0.22, s, s * 0.12);
      ctx.fillRect(0, s * 0.66, s, s * 0.12);
    };
    const roadTex = makeTex(128, (ctx, s) => drawAsphalt(ctx, s, "#334155"), 8, 8);
    const highwayTex = makeTex(128, (ctx, s) => drawAsphalt(ctx, s, "#1e293b"), 14, 14);

    // 2. Lush Multi-Tone Grass & Meadow Texture
    const grassTex = makeTex(128, (ctx, s) => {
      ctx.fillStyle = "#65a30d";
      ctx.fillRect(0, 0, s, s);
      let seed = 4242;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      // Soft sunlight meadow patches
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = i % 2 === 0 ? "rgba(132,204,22,0.18)" : "rgba(21,128,61,0.16)";
        ctx.beginPath();
        ctx.arc(rnd() * s, rnd() * s, 10 + rnd() * 14, 0, Math.PI * 2);
        ctx.fill();
      }
      // Crisp micro grass blades
      for (let i = 0; i < 620; i++) {
        const x = rnd() * s;
        const y = rnd() * s;
        ctx.fillStyle = rnd() > 0.5 ? "rgba(163,230,53,0.26)" : "rgba(22,101,52,0.25)";
        ctx.fillRect(x, y, 2, 4);
      }
    }, 36, 36);

    const turfTex = makeTex(128, (ctx, s) => {
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = "rgba(34,197,94,0.16)";
      for (let x = 0; x < s; x += 16) ctx.fillRect(x, 0, 8, s);
    }, 10, 10);

    // 3. Shiny Sky-Reflective Architectural Glass Texture (Diagonal Sunlit Sky Reflection Streaks!)
    const glassTex = makeTex(128, (ctx, s) => {
      const grad = ctx.createLinearGradient(0, 0, s, s);
      grad.addColorStop(0.0, "#7dd3fc");
      grad.addColorStop(0.32, "#38bdf8");
      grad.addColorStop(0.55, "#0284c7");
      grad.addColorStop(1.0, "#1e3a8a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, s, s);

      // Diagonal gleaming sky/cloud reflection slashes
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.beginPath();
      ctx.moveTo(s * 0.08, 0);
      ctx.lineTo(s * 0.28, 0);
      ctx.lineTo(0, s * 0.56);
      ctx.lineTo(0, s * 0.32);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.moveTo(s * 0.48, 0);
      ctx.lineTo(s * 0.62, 0);
      ctx.lineTo(s * 0.14, s);
      ctx.lineTo(0, s);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(224,242,254,0.2)";
      ctx.beginPath();
      ctx.moveTo(s * 0.78, 0);
      ctx.lineTo(s * 0.88, 0);
      ctx.lineTo(s * 0.42, s);
      ctx.lineTo(s * 0.32, s);
      ctx.closePath();
      ctx.fill();

      // Subtle architectural mullion frame border
      ctx.strokeStyle = "rgba(15,23,42,0.35)";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, s - 4, s - 4);
    }, 1, 1, false);

    this.procTex = { roadTex, highwayTex, grassTex, turfTex, glassTex };
  }

  _initSharedMaterials() {
    this.mat = {
      grass: new THREE.MeshLambertMaterial({ map: this.procTex.grassTex }),
      turf: new THREE.MeshLambertMaterial({ map: this.procTex.turfTex }),
      pitch: new THREE.MeshLambertMaterial({ color: 0xd6b588 }),
      road: new THREE.MeshLambertMaterial({ map: this.procTex.roadTex }),
      highway: new THREE.MeshLambertMaterial({ map: this.procTex.highwayTex }),
      median: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      sidewalk: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      concrete: new THREE.MeshLambertMaterial({ color: 0xcbd5e1 }),
      marble: new THREE.MeshPhongMaterial({ color: 0xf8fafc, specular: 0xffffff, shininess: 65 }),
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
      glass: new THREE.MeshPhongMaterial({ map: this.procTex.glassTex, color: 0xdbeafe, specular: 0xffffff, shininess: 135, transparent: true, opacity: 0.78 }),
      darkGlass: new THREE.MeshPhongMaterial({ map: this.procTex.glassTex, color: 0x334155, specular: 0xe0f2fe, shininess: 120 }),
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
      windowDay: new THREE.MeshPhongMaterial({ map: this.procTex.glassTex, color: 0xcceeff, specular: 0xffffff, shininess: 125 }),
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
      runwayAsphalt: new THREE.MeshLambertMaterial({ map: this.procTex.highwayTex }),
      tarmacGrey: new THREE.MeshLambertMaterial({ map: this.procTex.roadTex }),
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
      audiGlass: new THREE.MeshPhongMaterial({ map: this.procTex.glassTex, color: 0x1e293b, specular: 0xffffff, shininess: 145, transparent: true, opacity: 0.88 }),
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
      itiWorkshop: new THREE.MeshLambertMaterial({ color: 0x0284c7 }),
      // Vande Bharat Train, Foot Overbridge, Station Parking & Disco Light Materials
      vbWhite: new THREE.MeshPhongMaterial({ color: 0xf8fafc, specular: 0xffffff, shininess: 95 }),
      vbOrange: new THREE.MeshLambertMaterial({ color: 0xf97316 }),
      vbBlue: new THREE.MeshLambertMaterial({ color: 0x0284c7 }),
      fobSteel: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      parkingGreen: new THREE.MeshBasicMaterial({ color: 0x22c55e }),
      parkingRed: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
      addPadGlow: new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.78 }),
      tunnelConcrete: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      tunnelDarkWall: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      // Araku Valley Misty Mountains, Forest Pines, Rivers & Waterfalls
      arakuDeepGreen: new THREE.MeshLambertMaterial({ color: 0x14532d }),
      arakuForestGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      arakuLushHill: new THREE.MeshLambertMaterial({ color: 0x166534 }),
      arakuRockGrey: new THREE.MeshLambertMaterial({ color: 0x475569 }),
      arakuCliffDark: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      riverBlue: new THREE.MeshLambertMaterial({ color: 0x0ea5e9 }),
      waterfallBlue: new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 }),
      waterfallFoam: new THREE.MeshBasicMaterial({ color: 0xf0f9ff, transparent: true, opacity: 0.9 }),
      valleyMist: new THREE.MeshLambertMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.52 }),
      // 8-Plot Movie Theater & 4-Plot Real D-Mart Materials
      cinemaObsidian: new THREE.MeshLambertMaterial({ color: 0x111827 }),
      cinemaCrimson: new THREE.MeshLambertMaterial({ color: 0xb91c1c }),
      cinemaMarquee: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
      cinemaNeonPink: new THREE.MeshBasicMaterial({ color: 0xec4899 }),
      cinemaNeonCyan: new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
      dmartGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      dmartBrightGreen: new THREE.MeshLambertMaterial({ color: 0x16a34a }),
      dmartYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      dmartOfferRed: new THREE.MeshLambertMaterial({ color: 0xdc2626 }),
      cartChrome: new THREE.MeshPhongMaterial({ color: 0xe2e8f0, specular: 0xffffff, shininess: 120 }),
      // Real IMAX Dome, Upgraded Multiplex & Shared Zero-Allocation Hitbox Material
      imaxBlue: new THREE.MeshPhongMaterial({ color: 0x0369a1, specular: 0x7dd3fc, shininess: 120 }),
      imaxDomeSilver: new THREE.MeshPhongMaterial({ color: 0xcbd5e1, specular: 0xffffff, shininess: 130 }),
      imaxNeonBlue: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      cinemaScreenGlow: new THREE.MeshBasicMaterial({ color: 0x60a5fa }),
      popcornYellow: new THREE.MeshLambertMaterial({ color: 0xfde047 }),
      dmartDeepGreen: new THREE.MeshLambertMaterial({ color: 0x0f7638 }),
      invisibleHitbox: new THREE.MeshBasicMaterial({ visible: false }),
      // Mobile Shop & Mega Mobile Showroom Materials
      mobileBlue: new THREE.MeshPhongMaterial({ color: 0x0284c7, specular: 0xbae6fd, shininess: 105 }),
      mobileCyanGlow: new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
      mobileOrange: new THREE.MeshLambertMaterial({ color: 0xf97316 }),
      mobileTitanium: new THREE.MeshPhongMaterial({ color: 0x334155, specular: 0xffffff, shininess: 130 }),
      mobileScreenGlow: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      // v27 Ice Cream, Veg Market, Tirumala Temple, OYO Hotel, Park, Library, Swimming Pool, Mahindra & BMW Materials
      icePink: new THREE.MeshLambertMaterial({ color: 0xf472b6 }),
      iceMint: new THREE.MeshLambertMaterial({ color: 0x6ee7b7 }),
      iceWaffle: new THREE.MeshLambertMaterial({ color: 0xd97706 }),
      iceCreamWhite: new THREE.MeshLambertMaterial({ color: 0xfffbeb }),
      vegTomato: new THREE.MeshLambertMaterial({ color: 0xef4444 }),
      vegCarrot: new THREE.MeshLambertMaterial({ color: 0xf97316 }),
      vegLeafy: new THREE.MeshLambertMaterial({ color: 0x22c55e }),
      oyoRed: new THREE.MeshPhongMaterial({ color: 0xee2e24, specular: 0xfca5a5, shininess: 90 }),
      templeGold: new THREE.MeshPhongMaterial({ color: 0xf59e0b, specular: 0xfef08a, shininess: 145 }),
      templeRedStripe: new THREE.MeshLambertMaterial({ color: 0x991b1b }),
      templeSaffron: new THREE.MeshLambertMaterial({ color: 0xea580c }),
      templeLampGlow: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
      poolTileBlue: new THREE.MeshPhongMaterial({ color: 0x0ea5e9, specular: 0xe0f2fe, shininess: 150 }),
      mahindraRed: new THREE.MeshPhongMaterial({ color: 0xbe123c, specular: 0xfda4af, shininess: 120 }),
      mahindraBlack: new THREE.MeshPhongMaterial({ color: 0x111827, specular: 0x64748b, shininess: 110 }),
      bmwMBlueLight: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      bmwMBlueDark: new THREE.MeshBasicMaterial({ color: 0x1d4ed8 }),
      bmwMRed: new THREE.MeshBasicMaterial({ color: 0xdc2626 }),
      bmwSilver: new THREE.MeshPhongMaterial({ color: 0xe2e8f0, specular: 0xffffff, shininess: 145 }),
      // v28 Medical Shop, Hostel, Real Wine Shop & Sacred Hilltop Temple Glow Materials
      medGreen: new THREE.MeshLambertMaterial({ color: 0x059669 }),
      medCrossGlow: new THREE.MeshBasicMaterial({ color: 0x10b981 }),
      girlDressPink: new THREE.MeshLambertMaterial({ color: 0xec4899 }),
      girlDressYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      girlDressPurple: new THREE.MeshLambertMaterial({ color: 0xa855f7 }),
      hostelTeal: new THREE.MeshLambertMaterial({ color: 0x0f766e }),
      hostelPeach: new THREE.MeshLambertMaterial({ color: 0xfdba74 }),
      wineMaroon: new THREE.MeshPhongMaterial({ color: 0x7f1d1d, specular: 0xfca5a5, shininess: 95 }),
      wineBottleGreen: new THREE.MeshPhongMaterial({ color: 0x15803d, specular: 0x86efac, shininess: 145 }),
      wineBottleAmber: new THREE.MeshPhongMaterial({ color: 0xd97706, specular: 0xfef08a, shininess: 145 }),
      wineNeonGold: new THREE.MeshBasicMaterial({ color: 0xfde047 }),
      templeStepStone: new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }),
      templeHillGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      templeHillRock: new THREE.MeshLambertMaterial({ color: 0x64748b }),
      divineGoldGlow: new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      divineHaloGlow: new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
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
  // Crisp, RAM-cached architectural facade signboard (512x128 mipmapped for razor-sharp mobile reading!)
  _makeBuildingBoard(title, subtitle, bgHex = "#1e3a8a", accentHex = "#facc15", w = 6.4, h = 1.15) {
    const key = `${title}|${subtitle}|${bgHex}|${accentHex}`;
    let mat = this.signTexCache.get(key);
    if (!mat) {
      const hi = this.hqMode;
      const bw = hi ? 768 : 512;
      const bh = hi ? 192 : 128;
      const c = document.createElement("canvas");
      c.width = bw;
      c.height = bh;
      const ctx = c.getContext("2d");
      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, bw, bh);
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = hi ? 12 : 8;
      ctx.strokeRect(8, 8, bw - 16, bh - 16);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${hi ? 62 : 42}px sans-serif`;
      ctx.fillText(title, bw / 2, subtitle ? bh * 0.36 : bh * 0.52, bw - 48);
      if (subtitle) {
        ctx.fillStyle = accentHex;
        ctx.font = `800 ${hi ? 38 : 26}px sans-serif`;
        ctx.fillText(subtitle, bw / 2, bh * 0.74, bw - 48);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = this.maxAnisotropy || 4;
      tex.colorSpace = THREE.SRGBColorSpace;
      mat = new THREE.MeshBasicMaterial({ map: tex });
      this.signTexCache.set(key, mat);
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  }

  // Frees GPU texture memory for unique sprite labels when a plot is rebuilt or cleared
  /**
   * ⚡ CACHED SHARED BOX GEOMETRY POOL (Zero Duplicate GPU VBO Buffers Across 400+ Plots!)
   */
  _boxGeo(w, h, d) {
    const key = `${w.toFixed(2)}|${h.toFixed(2)}|${d.toFixed(2)}`;
    let geo = this._boxGeoCache.get(key);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      this._boxGeoCache.set(key, geo);
      if (this._sharedGeoSet) this._sharedGeoSet.add(geo);
    }
    return geo;
  }

  /**
   * ⚡ STATIC MATRIX FREEZER (Cuts 60fps CPU overhead by ~60% across 400+ buildings!)
   * Freezes matrixAutoUpdate on static meshes while keeping animated rotors, actors, disco lights & sprites live!
   */
  _freezeStaticSubtree(root) {
    if (!root) return;
    const dynamicSet = new Set();
    if (this.turntableRotors) this.turntableRotors.forEach((r) => { if (r.mesh) dynamicSet.add(r.mesh); });
    if (this.landmarkActors) this.landmarkActors.forEach((a) => { if (a.mesh) dynamicSet.add(a.mesh); });
    if (this.theaterDiscos) this.theaterDiscos.forEach((t) => {
      if (t.nightGroup) dynamicSet.add(t.nightGroup);
      if (t.skyBeams) t.skyBeams.forEach((b) => { dynamicSet.add(b.pivot); dynamicSet.add(b.cone); dynamicSet.add(b.core); if (b.airHalo) dynamicSet.add(b.airHalo); });
    });
    if (this.studioFlashes) this.studioFlashes.forEach((f) => { if (f.mesh) dynamicSet.add(f.mesh); });
    if (this.petrolSimulations) this.petrolSimulations.forEach((s) => { dynamicSet.add(s.vehicle); dynamicSet.add(s.attendant); });

    const walk = (obj) => {
      if (!obj || obj.isSprite || dynamicSet.has(obj)) return;
      // Never freeze parent of animated children if it is root plotGroup (so timelapse/construction scale still works)
      if (obj !== root && obj.isMesh && !obj.userData?.isAnimated) {
        obj.updateMatrix();
        obj.matrixAutoUpdate = false;
      }
      if (obj.children) {
        for (let i = 0; i < obj.children.length; i++) walk(obj.children[i]);
      }
    };
    root.updateMatrixWorld(true);
    walk(root);
  }

  _disposePlotGroup(group) {
    if (!group) return;
    const cachedSignMats = new Set(this.signTexCache ? this.signTexCache.values() : []);
    group.traverse((obj) => {
      if (obj.isSprite && obj.material) {
        if (!cachedSignMats.has(obj.material)) {
          if (obj.material.map) obj.material.map.dispose();
          obj.material.dispose();
        }
      } else if (obj.isMesh) {
        if (obj.geometry && this._sharedGeoSet && !this._sharedGeoSet.has(obj.geometry)) {
          obj.geometry.dispose();
        }
        if (obj.material && this._sharedMatSet && !this._sharedMatSet.has(obj.material) && !cachedSignMats.has(obj.material)) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => {
              if (!this._sharedMatSet.has(m) && !cachedSignMats.has(m)) m.dispose();
            });
          } else {
            obj.material.dispose();
          }
        }
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
      if (this.composer) this.composer.setSize(w, h);
      if (this.bloomPass) this.bloomPass.setSize(Math.floor(w * 0.5), Math.floor(h * 0.5));
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

      // ➕ ADD PLOT MODE: Touching open land in Airport or Beach spawns a new plot right there!
      if (this.addPlotMode && this.onAddPlotTap) {
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const hitPt = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(groundPlane, hitPt)) {
          const wx = hitPt.x;
          const wz = hitPt.z;
          // Strictly block placing plots on the double railway track corridor!
          if (this.isPointOnRailwayTrack(wx, wz)) {
            this.onAddPlotTap({ blocked: true, reason: "🚫 Cannot place a plot on the Railway Track!" });
            return;
          }
          // Airport Zone (East outside city, away from tracks)
          if (wx > this.railROuter + 6) {
            const ox = wx - this.airportX;
            const oz = wz;
            this.onAddPlotTap({ blocked: false, zone: "airport", offsetX: ox, offsetZ: oz, rotY: Math.PI });
            return;
          }
          // Beach Zone (West outside city, away from tracks)
          if (wx < -(this.railROuter + 6)) {
            const ox = wx - this.beachX;
            const oz = wz;
            this.onAddPlotTap({ blocked: false, zone: "beach", offsetX: ox, offsetZ: oz, rotY: -Math.PI / 2 });
            return;
          }
          this.onAddPlotTap({ blocked: true, reason: "📍 Tap open land near Airport (East) or Beach (West)!" });
          return;
        }
      }

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

  isPointOnRailwayTrack(wx, wz) {
    const m = Math.max(Math.abs(wx), Math.abs(wz));
    // Double track corridor with generous safety margin so NO house ever touches a rail!
    if (m >= this.railRInner - 5.5 && m <= this.railROuter + 5.5) return true;
    // Also protect North & South Railway Stations + Parking Plazas footprint
    if (Math.abs(wx) < 26 && wz < -this.ringRadius && wz > -(this.railROuter + 18)) return true;
    if (Math.abs(wx) < 26 && wz > this.ringRadius && wz < (this.railROuter + 18)) return true;
    return false;
  }

  removeCustomPlot(plotId) {
    this.plotDataMap.delete(plotId);
    this._emptyPlotCoords.delete(plotId);
    if (this.plotMeshes.has(plotId)) {
      const oldGroup = this.plotMeshes.get(plotId);
      this._disposePlotGroup(oldGroup);
      this.plotsGroup.remove(oldGroup);
      this.plotMeshes.delete(plotId);
    }
    this.plotSigns = this.plotSigns.filter((s) => s.plotId !== plotId);
    this.plotHitboxes = this.plotHitboxes.filter((h) => h.userData.plotId !== plotId);
    this.sirenLights = this.sirenLights.filter((s) => s.plotId !== plotId);
    this.landmarkActors = this.landmarkActors.filter((a) => a.plotId !== plotId);
    this.turntableRotors = this.turntableRotors.filter((r) => r.plotId !== plotId);
    this.studioFlashes = this.studioFlashes.filter((f) => f.plotId !== plotId);
    this.theaterDiscos = this.theaterDiscos.filter((t) => t.plotId !== plotId);
    this.heroAudiSlots = this.heroAudiSlots.filter((a) => a.plotId !== plotId);
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
    this.plotHitboxes = this.plotHitboxes.filter(
      (h) => !["ST_JUNCTION", "AIRPORT", "BEACH", "RAILWAY_STATION", "RAILWAY_SOUTH", "ADD_AIRPORT_PLOT", "ADD_BEACH_PLOT", "HILL_TEMPLE"].includes(h.userData.plotId)
    );
    this.airportSim = null;
    this.beachSim = null;
    this.railwaySim = null;
    this.arakuSim = null;
    this.hillTempleSim = null;
    this.beachHighwaySim = null;
    this.discoGroup = null;
    this.discoCones = [];
    this.discoPointLight = null;
    this.discoRing = null;

    const r = this.currentGridRadius;
    const gridCount = r * 2 + 1;
    const innerSpan = gridCount * this.BLOCK_STEP;
    const ringRadius = innerSpan / 2 + 10.5;
    this.ringRadius = ringRadius;

    // Vast continuous lush Araku valley floor (eliminates all blank edges/voids!)
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(ringRadius * 2 + 1300, ringRadius * 2 + 1300),
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

      if (p < -20 || p > 20) this._addPalmTree(p, -(ringRadius + 7));
      if (p < -20 || p > 20) this._addPalmTree(p, ringRadius + 7);
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
    this._buildHilltopTempleMountain(ringRadius);
    this._buildArakuLandscape(ringRadius);
    // Keep any existing custom Airport / Beach zone plots positioned accurately!
    for (const [pid, pdata] of this.plotDataMap.entries()) {
      if (pdata && pdata.isCustomZone) {
        this.renderPlot(pid, pdata, false);
      }
    }
    if (this.shadowsEnabled) this._applyShadowFlags(this.cityGroup);
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

    // Glowing Spotlight Crown Aura + 🪩 NIGHT MODE DISCO LIGHTS FOR SHERU BHAI STATUE!
    const aura = new THREE.Mesh(new THREE.RingGeometry(1.38, 1.65, 18), this.mat.lampBulbNight);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 4.32;
    this.lampBulbs.push(aura);

    const discoGroup = new THREE.Group();
    const discoPalette = [0xec4899, 0x22d3ee, 0x4ade80, 0xfacc15, 0xa855f7, 0xef4444];
    const coneGeo = new THREE.ConeGeometry(1.45, 7.6, 10, 1, true);
    const podGeo = new THREE.SphereGeometry(0.28, 8, 8);
    this.discoCones = [];
    for (let d = 0; d < 6; d++) {
      const ang = (d / 6) * Math.PI * 2;
      const beamMat = new THREE.MeshBasicMaterial({
        color: discoPalette[d],
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const cone = new THREE.Mesh(coneGeo, beamMat);
      cone.position.set(Math.cos(ang) * 3.1, 6.2, Math.sin(ang) * 3.1);
      cone.lookAt(0, 9.2, 0);
      cone.rotateX(Math.PI / 2);

      const podMat = new THREE.MeshBasicMaterial({ color: discoPalette[d] });
      const pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(Math.cos(ang) * 4.5, 0.72, Math.sin(ang) * 4.5);

      discoGroup.add(cone, pod);
      this.discoCones.push({ cone, pod, beamMat, podMat, baseAng: ang, colorIdx: d });
    }

    const discoRingMat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    });
    const discoRing = new THREE.Mesh(new THREE.RingGeometry(4.85, 5.55, 28), discoRingMat);
    discoRing.rotation.x = -Math.PI / 2;
    discoRing.position.y = 0.42;
    discoGroup.add(discoRing);
    this.discoRing = discoRing;

    // 1 Lightweight Color-Cycling PointLight illuminating the White Marble Lion Statue at night!
    const discoPt = new THREE.PointLight(0xec4899, 3.2, 24);
    discoPt.position.set(0, 9.8, 3.4);
    discoGroup.add(discoPt);
    this.discoPointLight = discoPt;

    discoGroup.visible = this.timeOfDay === "night";
    g.add(discoGroup);
    this.discoGroup = discoGroup;

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
      this.mat.invisibleHitbox
    );
    hitbox.position.y = 6.1;
    hitbox.userData.plotId = "ST_JUNCTION";
    g.add(hitbox);
    this.plotHitboxes.push(hitbox);

    const sign = this._createNameSign("🦁 SHERU BHAI STATUE", "ST JUNCTION • TAP FOR 3D VIEW", true);
    sign.position.set(0, 12.2, 0);

    this.heroStatueSlot = lionStatue;
    if (this.heroModelUrls && this.heroModelUrls.statue) {
      this._loadHeroGLB("statue", this.heroModelUrls.statue, lionStatue, 5.2, 4.6, 0);
    }
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
    const ax = ringRadius + 78;
    this.airportX = ax;

    const ap = new THREE.Group();
    ap.position.set(ax, 0, 0);

    const nightGlowMeshes = [];

    // 1. Airport Express Highway connecting East Outer Ring Road -> Crossing Double Tracks -> Inside Airport VIP Gate (at z = 18)
    const hwyLen = 42;
    const expressHwy = new THREE.Mesh(new THREE.BoxGeometry(hwyLen, 0.1, 7.6), this.mat.highway);
    expressHwy.position.set(-55, 0.02, 18);
    const hwyStripe = new THREE.Mesh(new THREE.PlaneGeometry(hwyLen - 2, 0.25), this.mat.petrolYellow);
    hwyStripe.rotation.x = -Math.PI / 2;
    hwyStripe.position.set(-55, 0.09, 18);
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
    this.heroHeliSlot = diamondHeli;
    if (this.heroModelUrls && this.heroModelUrls.heli) {
      this._loadHeroGLB("heli", this.heroModelUrls.heli, diamondHeli, 8.2, 0.1, 0);
    }
    ap.add(diamondHeli);

    // 9b. 🅿️ DEDICATED AIRPORT PASSENGER PARKING PLAZA (Beside Terminal & VIP Gate — IN ⬆ / ⬇ OUT!)
    const apParkGroup = new THREE.Group();
    apParkGroup.position.set(-30, 0.06, 33);

    const apParkBase = new THREE.Mesh(new THREE.BoxGeometry(22.0, 0.12, 14.5), this.mat.tarmacGrey);
    apParkGroup.add(apParkBase);

    // Connector Driveway from Airport Express Highway (z = 18 -> z = 26) straight into Airport Parking!
    const apParkEntryL = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.11, 9.0), this.mat.road);
    apParkEntryL.position.set(-5.8, 0.0, -10.5);
    const apParkExitR = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.11, 9.0), this.mat.road);
    apParkExitR.position.set(5.8, 0.0, -10.5);
    apParkGroup.add(apParkEntryL, apParkExitR);

    // White Parking Bay Markings + Parked Cars & Yellow Autos
    for (let px = -9.0; px <= 9.0; px += 3.0) {
      const pLine = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 4.2), this.mat.stripe);
      pLine.rotation.x = -Math.PI / 2;
      pLine.position.set(px, 0.08, 3.6);
      apParkGroup.add(pLine);
    }
    const apCar1 = this._makeVehicleMesh(false, false, 0x3b82f6, false);
    apCar1.position.set(-7.5, 0.08, 3.6);
    const apCar2 = this._makeVehicleMesh(false, false, 0xf59e0b, false);
    apCar2.position.set(-4.5, 0.08, 3.6);
    const apCar3 = this._makeVehicleMesh(false, false, 0x10b981, false);
    apCar3.position.set(1.5, 0.08, 3.6);
    const apAuto = this._makeRealAutoMesh(false, false);
    apAuto.position.set(7.5, 0.08, 3.6);
    apParkGroup.add(apCar1, apCar2, apCar3, apAuto);

    // Airport Parking Overhead Signboard + IN / OUT Badges
    const apParkBoard = this._makeBuildingBoard("AIRPORT PARKING", "IN ⬆  •  ⬇ OUT • 24/7", "#1e3a8a", "#facc15", 8.8, 1.35);
    apParkBoard.position.set(0, 3.4, -7.2);
    [-4.2, 4.2].forEach((sx) => {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 6), this.mat.chrome);
      sp.position.set(sx, 1.6, -7.2);
      apParkGroup.add(sp);
    });
    const apInStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.8), this.mat.parkingGreen);
    apInStrip.rotation.x = -Math.PI / 2;
    apInStrip.position.set(-5.8, 0.08, -7.8);
    const apOutStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.8), this.mat.parkingRed);
    apOutStrip.rotation.x = -Math.PI / 2;
    apOutStrip.position.set(5.8, 0.08, -7.8);
    apParkGroup.add(apParkBoard, apInStrip, apOutStrip);
    ap.add(apParkGroup);

    // 9c. 🛣️ PROPER PAVED ROAD NETWORK FOR AIRPORT-SIDE HOUSES (Connected directly to Airport Express Highway!)
    // Direct North-South Link Road dropping South from Airport Express Highway (x = -46, z = 18 -> z = 65)
    const linkRoad = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.1, 49.0), this.mat.road);
    linkRoad.position.set(-46, 0.04, 41.5);
    const linkDash = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 45.0), this.mat.stripe);
    linkDash.rotation.x = -Math.PI / 2;
    linkDash.position.set(-46, 0.1, 41.5);
    ap.add(linkRoad, linkDash);

    // Main Airport Colony Boulevard (East-West along z = 64.4 — right between Row 1 & Row 2 of Airport Houses!)
    const apColonyRoad = new THREE.Mesh(new THREE.BoxGeometry(84, 0.1, 5.8), this.mat.road);
    apColonyRoad.position.set(-5, 0.04, 64.4);
    const apSidewalkN = new THREE.Mesh(new THREE.BoxGeometry(84, 0.12, 1.2), this.mat.sidewalk);
    apSidewalkN.position.set(-5, 0.06, 61.1);
    const apSidewalkS = apSidewalkN.clone();
    apSidewalkS.position.z = 67.7;
    ap.add(apColonyRoad, apSidewalkN, apSidewalkS);

    for (let dx = -42; dx <= 34; dx += 6.0) {
      const cd = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.2), this.mat.stripe);
      cd.rotation.x = -Math.PI / 2;
      cd.position.set(dx, 0.1, 64.4);
      ap.add(cd);
    }
    // Street lamps along the Airport Colony Boulevard
    for (let lx = -36; lx <= 28; lx += 16) {
      const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.6, 5), this.mat.lampPole);
      lp.position.set(lx, 1.8, 61.1);
      const lb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.lampBulbDay);
      lb.position.set(lx, 3.65, 61.1);
      ap.add(lp, lb);
      this.lampBulbs.push(lb);
    }
    const colSign = this._makeBuildingBoard("AIRPORT COLONY ROAD", "VIP RESIDENTIAL PLOTS", "#0f172a", "#38bdf8", 7.8, 1.15);
    colSign.position.set(-39, 3.2, 60.4);
    ap.add(colSign);

    const apAddPad = new THREE.Group();
    apAddPad.position.set(-38, 0.12, 56.8);
    const padBase = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.18, 7.0), this.mat.addPadGlow);
    const plusH = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 0.85), this.mat.wallWhite);
    plusH.position.y = 0.05;
    const plusV = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 3.6), this.mat.wallWhite);
    plusV.position.y = 0.05;
    const padSign = this._createNameSign("➕ ADD AIRPORT PLOT", "TAP TO PLACE PLOT HERE", false);
    padSign.position.set(0, 3.6, 0);
    const padHit = new THREE.Mesh(new THREE.BoxGeometry(7.4, 5.0, 7.4), this.mat.invisibleHitbox);
    padHit.position.y = 2.5;
    padHit.userData.plotId = "ADD_AIRPORT_PLOT";
    apAddPad.add(padBase, plusH, plusV, padSign, padHit);
    this.plotHitboxes.push(padHit);
    ap.add(apAddPad);

    // 10. Floating Big Airport Sign + Clickable Hitbox
    const apSign = this._createNameSign("✈️ SHERU BHAI INTL AIRPORT", "20 ACRES • LIVE FLIGHTS & DIAMOND HELI", true);
    apSign.position.set(-12, 23.5, -14);
    ap.add(apSign);

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(88, 18, 96),
      this.mat.invisibleHitbox
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
    const bx = -(ringRadius + 76);
    this.beachX = bx;

    const bg = new THREE.Group();
    bg.position.set(bx, 0, 0);

    // 1. WIDE 4-LANE OUTSKIRTS-TO-BEACH HIGHWAY (Connects West City Outskirts Ring Road x = +76 -> Beachfront!)
    const hwLen = 64;
    const beachHighway = new THREE.Mesh(this._boxGeo(hwLen, 0.1, 8.6), this.mat.highway);
    beachHighway.position.set(46, 0.02, 0);
    const hwDash = new THREE.Mesh(new THREE.PlaneGeometry(hwLen - 2, 0.28), this.mat.stripe);
    hwDash.rotation.x = -Math.PI / 2;
    hwDash.position.set(46, 0.09, 0);
    bg.add(beachHighway, hwDash);

    // Beachside Colony Boulevard running North-South along the Beach Resort Strip (z = -54 to +54 at x = 31)
    // Gives direct paved road access to Beach OYO, Beach Hostel, Medical Shop & ALL addable Beach Houses/Landmarks!
    const colonyBlvd = new THREE.Mesh(this._boxGeo(7.0, 0.1, 112), this.mat.road);
    colonyBlvd.position.set(31.5, 0.02, 0);
    const blvdDash = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 108), this.mat.stripe);
    blvdDash.rotation.x = -Math.PI / 2;
    blvdDash.position.set(31.5, 0.08, 0);
    bg.add(colonyBlvd, blvdDash);

    // Coastal Entrance Arch ("SHERU BHAI BEACH • OUTSKIRTS HIGHWAY")
    const apGeo = this._boxGeo(0.75, 5.8, 0.75);
    const p1 = new THREE.Mesh(apGeo, this.mat.teakWood);
    p1.position.set(36, 2.9, -4.8);
    const p2 = p1.clone();
    p2.position.z = 4.8;
    const archTop = new THREE.Mesh(this._boxGeo(0.95, 1.45, 10.6), this.mat.oceanDeep);
    archTop.position.set(36, 5.6, 0);
    const bArchF = this._makeBuildingBoard("SHERU BHAI BEACH", "OYO RESORT • HOSTEL • BEACH PARKING", "#0284c7", "#fde047", 9.6, 1.25);
    bArchF.rotation.y = Math.PI / 2;
    bArchF.position.set(36.5, 5.6, 0);
    const bArchB = bArchF.clone();
    bArchB.rotation.y = -Math.PI / 2;
    bArchB.position.x = 35.5;
    bg.add(p1, p2, archTop, bArchF, bArchB);

    // 2. WIDE GOLDEN SAND BEACH + WET SHORELINE + TURQUOISE OCEAN!
    const drySand = new THREE.Mesh(this._boxGeo(44, 0.14, 114), this.mat.beachSand);
    drySand.position.set(16, 0.04, 0);
    const wetSand = new THREE.Mesh(this._boxGeo(7.5, 0.1, 114), this.mat.beachSandWet);
    wetSand.position.set(-7.5, 0.03, 0);
    const shallowSea = new THREE.Mesh(this._boxGeo(16, 0.08, 128), this.mat.oceanShallow);
    shallowSea.position.set(-18, 0.01, 0);
    const deepSea = new THREE.Mesh(this._boxGeo(520, 0.06, 1100), this.mat.oceanDeep);
    deepSea.position.set(-284, 0.0, 0);
    bg.add(drySand, wetSand, shallowSea, deepSea);

    // Animated White Ocean Wave Foam Strips
    const waveStrips = [];
    const waveGeo = new THREE.PlaneGeometry(1.6, 110);
    waveGeo.rotateX(-Math.PI / 2);
    for (let w = 0; w < 3; w++) {
      const foam = new THREE.Mesh(waveGeo, this.mat.seaFoam);
      foam.position.set(-10 - w * 5.2, 0.1, 0);
      bg.add(foam);
      waveStrips.push({ mesh: foam, baseX: -10 - w * 5.2, phase: w * 2.1 });
    }

    // 3. Wooden Ocean Pier / Jetty (at z = 24)
    const pierDeck = new THREE.Mesh(this._boxGeo(24, 0.25, 4.4), this.mat.teakWood);
    pierDeck.position.set(-16, 0.72, 24);
    for (let px = -26; px <= -6; px += 5) {
      [-1.8, 1.8].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.1, 6), this.mat.darkWood);
        post.position.set(px, 0.35, 24 + pz);
        bg.add(post);
      });
    }
    const pierLamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 6), this.mat.lampBulbDay);
    pierLamp.position.set(-27.2, 2.3, 24);
    const pierPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 5), this.mat.lampPole);
    pierPole.position.set(-27.2, 1.5, 24);
    this.lampBulbs.push(pierLamp);
    bg.add(pierDeck, pierPole, pierLamp);

    // 4. Coconut Palm Trees along the Golden Sand
    const addBeachPalm = (px, pz, tilt = 0.14) => {
      const palm = new THREE.Group();
      palm.position.set(px, 0.1, pz);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 5.2, 6), this.mat.treeTrunk);
      trunk.position.y = 2.6;
      trunk.rotation.z = tilt;
      palm.add(trunk);
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const frond = new THREE.Mesh(this._boxGeo(2.6, 0.12, 0.65), this.mat.treeLeaf);
        frond.position.set(Math.sin(tilt) * 2.4 + Math.cos(ang) * 1.1, 5.1, Math.sin(ang) * 1.1);
        frond.rotation.y = -ang;
        frond.rotation.z = -0.32;
        palm.add(frond);
      }
      bg.add(palm);
    };
    [[6, -38, 0.14], [12, -26, -0.15], [4, -14, 0.16], [4, 2, 0.14], [10, 32, -0.14], [4, 42, 0.16]].forEach(
      ([px, pz, t]) => addBeachPalm(px, pz, t)
    );

    // 5. 🅿️ DEDICATED BEACHFRONT VISITOR PARKING PLAZA (x = 18.5, z = 0)
    // Cars arrive from City Outskirts Road -> Park Here -> People Walk to Sand Beach -> Return & Drive Out!
    const bPark = new THREE.Mesh(this._boxGeo(13.5, 0.16, 12.6), this.mat.tarmacGrey);
    bPark.position.set(18.5, 0.1, 0);
    for (let pz = -4.2; pz <= 4.2; pz += 2.8) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.14), this.mat.stripe);
      pl.rotation.x = -Math.PI / 2;
      pl.position.set(15.5, 0.2, pz);
      bg.add(pl);
    }
    const bParkBoard = this._makeBuildingBoard("BEACH PARKING", "PARK & WALK TO BEACH • FREE", "#0f172a", "#38bdf8", 7.6, 1.05);
    bParkBoard.rotation.y = Math.PI / 2;
    bParkBoard.position.set(25.2, 3.2, 0);
    [-3.6, 3.6].forEach((pz) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 6), this.mat.chrome);
      pole.position.set(25.2, 1.65, pz);
      bg.add(pole);
    });
    bg.add(bPark, bParkBoard);

    // 🚗 LIVE OUTSKIRTS-TO-BEACH CARS, BUSES & REAL PARK -> WALK TO BEACH -> DRIVE OUT CYCLE!
    const beachVisitorCars = [];
    const parkColors = [0xef4444, 0x3b82f6, 0xfacc15];
    const parkSlotsZ = [-2.8, 0.0, 2.8];
    for (let v = 0; v < 3; v++) {
      const vCar = this._makeVehicleMesh(false, false, parkColors[v], true);
      vCar.userData.isAnimated = true;
      bg.add(vCar);

      const boyVisitor = this._createCharacter({ shirtMat: v === 0 ? this.mat.wallBlue : this.mat.wallGold, pantsMat: this.mat.darkPants, scale: 0.92 });
      const girlVisitor = this._createCharacter({ shirtMat: v === 1 ? this.mat.girlDressPurple : this.mat.girlDressPink, pantsMat: this.mat.wallWhite, scale: 0.88 });
      boyVisitor.visible = false;
      girlVisitor.visible = false;
      bg.add(boyVisitor, girlVisitor);

      beachVisitorCars.push({
        car: vCar,
        boy: boyVisitor,
        girl: girlVisitor,
        slotZ: parkSlotsZ[v],
        phase: v * 7.5
      });
    }

    // Dedicated APSRTC Beach Express Bus + Auto driving continuously between City Outskirts Road & Beachfront!
    const beachBus = this._makeVehicleMesh(true, false, 0xdc2626, true);
    const beachAuto = this._makeRealAutoMesh(true, true);
    bg.add(beachBus, beachAuto);

    // 6. 🦁 SHERU BHAI CHILLING ON THE BEACH (x = 4, z = 12)
    const chillZone = new THREE.Group();
    chillZone.position.set(4, 0.12, 12);
    const bedFrame = new THREE.Mesh(this._boxGeo(2.6, 0.24, 1.35), this.mat.teakWood);
    bedFrame.position.set(0, 0.36, 0);
    const mattress = new THREE.Mesh(this._boxGeo(2.45, 0.18, 1.2), this.mat.wallWhite);
    mattress.position.set(0, 0.54, 0);
    const backrest = new THREE.Mesh(this._boxGeo(1.1, 0.18, 1.18), this.mat.wallWhite);
    backrest.position.set(0.92, 0.92, 0);
    backrest.rotation.z = 0.62;
    const towel = new THREE.Mesh(this._boxGeo(1.5, 0.06, 1.24), this.mat.tropicalShorts);
    towel.position.set(-0.35, 0.65, 0);
    const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 3.6, 6), this.mat.richGoldTrim);
    uPole.position.set(0.8, 1.8, -1.25);
    const uCanopy = new THREE.Mesh(new THREE.ConeGeometry(2.6, 0.85, 8), this.mat.petrolRed);
    uCanopy.position.set(0.8, 3.55, -1.25);
    const uStripe = new THREE.Mesh(new THREE.ConeGeometry(2.64, 0.45, 8), this.mat.wallWhite);
    uStripe.position.set(0.8, 3.35, -1.25);
    const sideTbl = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.62, 8), this.mat.richGoldTrim);
    sideTbl.position.set(0.2, 0.32, 1.25);
    const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), this.mat.turf);
    coconut.position.set(0.2, 0.78, 1.25);
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 4), this.mat.petrolYellow);
    straw.position.set(0.25, 1.02, 1.25);
    straw.rotation.z = -0.35;
    const surf = new THREE.Mesh(this._boxGeo(0.14, 2.8, 0.72), this.mat.studioCyan);
    surf.position.set(-2.2, 1.35, -2.5);
    surf.rotation.z = 0.22;
    surf.rotation.y = 0.4;

    const chillingSheru = new THREE.Group();
    chillingSheru.position.set(0.25, 0.68, 0);
    const sLegGeo = new THREE.CylinderGeometry(0.17, 0.14, 1.25, 8);
    sLegGeo.rotateZ(Math.PI / 2);
    const sLegL = new THREE.Mesh(sLegGeo, this.mat.lionFurGold);
    sLegL.position.set(-0.78, 0.16, -0.22);
    const sLegR = sLegL.clone();
    sLegR.position.z = 0.22;
    const shorts = new THREE.Mesh(this._boxGeo(0.65, 0.34, 0.76), this.mat.tropicalShorts);
    shorts.position.set(-0.18, 0.2, 0);
    const sTorso = new THREE.Mesh(this._boxGeo(0.88, 0.42, 0.78), this.mat.tropicalShirt);
    sTorso.position.set(0.42, 0.48, 0);
    sTorso.rotation.z = 0.56;
    const sChain = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 6, 12, Math.PI), this.mat.richGoldTrim);
    sChain.position.set(0.54, 0.68, 0);
    sChain.rotation.y = -Math.PI / 2;
    sChain.rotation.z = Math.PI;

    const sHeadGroup = new THREE.Group();
    sHeadGroup.position.set(0.88, 0.98, 0);
    const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), this.mat.lionFurGold);
    const sSnout = new THREE.Mesh(this._boxGeo(0.24, 0.2, 0.24), this.mat.lionFurGold);
    sSnout.position.set(-0.28, -0.06, 0);
    const sNose = new THREE.Mesh(this._boxGeo(0.1, 0.08, 0.12), this.mat.sunglasses);
    sNose.position.set(-0.38, 0.0, 0);
    const sShades = new THREE.Mesh(this._boxGeo(0.12, 0.15, 0.52), this.mat.sunglasses);
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
    const chillSign = this._createNameSign("🦁 SHERU BHAI CHILLING", "VIP BEACH LOUNGE", false);
    chillSign.position.set(0.5, 4.9, 0);
    chillZone.add(bedFrame, mattress, backrest, towel, uPole, uCanopy, uStripe, sideTbl, coconut, straw, surf, chillingSheru, chillSign);
    bg.add(chillZone);

    // 7. 🏡 FOLLOWER BEACH HOUSE VILLA ON THE SAND (x = 16, z = -16)
    const villa = new THREE.Group();
    villa.position.set(16, 0.12, -16);
    const deck = new THREE.Mesh(this._boxGeo(15.0, 0.45, 13.0), this.mat.teakWood);
    deck.position.set(0, 0.24, 0);
    const pool = new THREE.Mesh(this._boxGeo(3.6, 0.5, 7.2), this.mat.water);
    pool.position.set(-5.0, 0.25, 0);
    const vFloor1 = new THREE.Mesh(this._boxGeo(9.0, 3.6, 10.2), this.mat.wallWhite);
    vFloor1.position.set(2.0, 2.25, 0);
    const vGlass1 = new THREE.Mesh(this._boxGeo(0.24, 2.7, 8.0), this.mat.glass);
    vGlass1.position.set(-2.52, 2.0, 0);
    const vTeakClad = new THREE.Mesh(this._boxGeo(9.2, 3.6, 2.1), this.mat.teakWood);
    vTeakClad.position.set(2.0, 2.25, -4.2);
    const vSlab = new THREE.Mesh(this._boxGeo(11.4, 0.35, 11.0), this.mat.wallWhite);
    vSlab.position.set(1.2, 4.15, 0);
    const vFloor2 = new THREE.Mesh(this._boxGeo(8.0, 3.2, 8.6), this.mat.stuccoIvory);
    vFloor2.position.set(2.4, 5.9, -0.5);
    const vGlass2 = new THREE.Mesh(this._boxGeo(0.24, 2.4, 7.0), this.mat.glass);
    vGlass2.position.set(-1.62, 5.85, -0.5);
    const vBalcRail = new THREE.Mesh(this._boxGeo(0.14, 0.95, 10.4), this.mat.glass);
    vBalcRail.position.set(-4.35, 4.8, 0);
    const vRoof = new THREE.Mesh(this._boxGeo(10.4, 0.35, 10.2), this.mat.slateTrim);
    vRoof.position.set(1.8, 7.65, -0.5);
    const cleanOwner = (this.beachOwner || "@follower_beach").trim();
    const villaBoardW = this._makeBuildingBoard(cleanOwner.toUpperCase(), "BEACH HOUSE VILLA", "#0f172a", "#38bdf8", 8.6, 1.4);
    villaBoardW.rotation.y = -Math.PI / 2;
    villaBoardW.position.set(-3.45, 7.65, -0.5);
    const villaBoardE = villaBoardW.clone();
    villaBoardE.rotation.y = Math.PI / 2;
    villaBoardE.position.x = 7.05;
    const villaSign = this._createNameSign(`🏡 ${cleanOwner}`, "🏖️ BEACH HOUSE VILLA • SHERU BHAI BEACH", true);
    villaSign.position.set(1.5, 10.8, 0);
    villa.add(deck, pool, vFloor1, vGlass1, vTeakClad, vSlab, vFloor2, vGlass2, vBalcRail, vRoof, villaBoardW, villaBoardE, villaSign);
    bg.add(villa);

    // 8. 🏨 BEACH SIDE 20-FLOOR OYO ROOMS TOWER + 🏢 BEACH HOSTEL + 💊 24/7 MEDICAL SHOP (Right Along Beach Boulevard!)
    //    Pre-built directly on the Beach Resort Strip so your Beach Skyline looks iconic right away!
    const beachOYO = this._buildFourPlotLandmark("hotel_oyo", "BEACH_OYO_DEFAULT", "BEACH OYO");
    beachOYO.position.set(20.5, 0.14, 20.5);
    beachOYO.rotation.y = Math.PI / 2; // Faces Beachside Colony Boulevard!
    const oyoSkySign = this._createNameSign("🏨 20-FLOOR OYO ROOMS", "BEACH RESORT • COUPLES & PARKING", true);
    oyoSkySign.position.set(0, 31.8, 0);
    beachOYO.add(oyoSkySign);
    bg.add(beachOYO);

    const beachHostel = this._buildFourPlotLandmark("hostel", "BEACH_HOSTEL_DEFAULT", "BEACH HOSTEL");
    beachHostel.position.set(20.5, 0.14, -34.5);
    beachHostel.rotation.y = Math.PI / 2;
    const hstSign = this._createNameSign("🏢 BEACH VIEW HOSTEL", "BOYS & GIRLS HOSTEL • WIFI", true);
    hstSign.position.set(0, 11.4, 0);
    beachHostel.add(hstSign);
    bg.add(beachHostel);

    const beachMed = this._buildOnePlotBuilding("medical_shop", "BEACH");
    beachMed.position.set(39.0, 0.14, 10.5);
    beachMed.rotation.y = -Math.PI / 2; // Faces Boulevard directly across from OYO & Parking!
    const medSign = this._createNameSign("💊 24/7 MEDICAL SHOP", "BEACH PHARMACY", false);
    medSign.position.set(0, 6.8, 0);
    beachMed.add(medSign);
    bg.add(beachMed);

    // 9. ➕ ADD BEACH PLOT PAD (Right on Beachside Colony Boulevard — Touch to Add Houses OR Landmarks near Beach!)
    const bAddPad = new THREE.Group();
    bAddPad.position.set(40, 0.14, -12);
    const bPadBase = new THREE.Mesh(this._boxGeo(7.4, 0.18, 7.4), this.mat.addPadGlow);
    const bPlusH = new THREE.Mesh(this._boxGeo(3.6, 0.22, 0.85), this.mat.wallWhite);
    bPlusH.position.y = 0.05;
    const bPlusV = new THREE.Mesh(this._boxGeo(0.85, 0.22, 3.6), this.mat.wallWhite);
    bPlusV.position.y = 0.05;
    const bPadSign = this._createNameSign("➕ ADD BEACH PLOT", "HOUSES OR LANDMARKS", false);
    bPadSign.position.set(0, 3.6, 0);
    const bPadHit = new THREE.Mesh(this._boxGeo(7.8, 5.2, 7.8), this.mat.invisibleHitbox);
    bPadHit.position.y = 2.6;
    bPadHit.userData.plotId = "ADD_BEACH_PLOT";
    bAddPad.add(bPadBase, bPlusH, bPlusV, bPadSign, bPadHit);
    this.plotHitboxes.push(bPadHit);
    bg.add(bAddPad);

    // 10. Clickable Hitbox for the Ocean & Beach
    const hitbox = new THREE.Mesh(this._boxGeo(40, 14, 110), this.mat.invisibleHitbox);
    hitbox.position.set(-4, 7, 0);
    hitbox.userData.plotId = "BEACH";
    bg.add(hitbox);
    this.plotHitboxes.push(hitbox);

    this.cityGroup.add(bg);
    this.beachSim = {
      waveStrips,
      chillingHead: sHeadGroup
    };
    this.beachHighwaySim = {
      visitorCars: beachVisitorCars,
      beachBus,
      beachAuto,
      hwStartX: 74,
      hwParkX: 16.5,
      sandX: 3.5
    };
  }

  /**
   * 🚂 REALISTIC 3D INDIAN RAILWAYS WAP-7 ELECTRIC LOCOMOTIVE & ICF PASSENGER COACHES (Train 1)
   */
  _makeTrainLocomotive(nightLights) {
    const loco = new THREE.Group();

    // Heavy Bogie Underframe + 6 Steel Wheels + Buffers
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.45, 5.9), this.mat.charcoal);
    chassis.position.set(0, 0.48, 0);
    const whGeo = new THREE.CylinderGeometry(0.28, 0.28, 2.02, 8);
    whGeo.rotateZ(Math.PI / 2);
    [-2.2, -1.35, -0.55, 0.55, 1.35, 2.2].forEach((wz) => {
      const wh = new THREE.Mesh(whGeo, this.mat.wheelBlack);
      wh.position.set(0, 0.28, wz);
      loco.add(wh);
    });

    // Aerodynamic Blue/White/Red/Yellow Indian Express WAP-7 Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.96, 1.55, 5.4), this.mat.trainBlue);
    body.position.set(0, 1.48, -0.05);
    const noseSlope = new THREE.Mesh(new THREE.BoxGeometry(1.88, 1.15, 0.9), this.mat.trainBlue);
    noseSlope.position.set(0, 1.25, 2.85);
    noseSlope.rotation.x = 0.22;

    const yellowBand = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.34, 5.85), this.mat.trainYellow);
    yellowBand.position.set(0, 1.12, 0.1);
    const redTrim = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.14, 5.88), this.mat.petrolRed);
    redTrim.position.set(0, 0.88, 0.1);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.26, 5.2), this.mat.trainRoof);
    roof.position.set(0, 2.36, -0.05);

    // Split Cab Windshields + Chrome Front Buffers + Cowcatcher
    const windL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.56, 0.12), this.mat.busWindshield);
    windL.position.set(-0.42, 1.82, 2.75);
    windL.rotation.x = -0.18;
    const windR = windL.clone();
    windR.position.x = 0.42;

    const guard = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.36, 0.52), this.mat.trainYellow);
    guard.position.set(0, 0.34, 3.15);
    [-0.65, 0.65].forEach((bx) => {
      const buf = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.36, 6), this.mat.chrome);
      buf.rotation.x = Math.PI / 2;
      buf.position.set(bx, 0.68, 3.18);
      loco.add(buf);
    });

    // Detailed Rooftop Electric Pantograph + AC Unit
    const acPod = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 1.4), this.mat.wallWhite);
    acPod.position.set(0, 2.58, 1.1);
    const pantoArm1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), this.mat.petrolRed);
    pantoArm1.position.set(0, 2.72, -1.2);
    pantoArm1.rotation.x = 0.45;
    const pantoBar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.35), this.mat.chrome);
    pantoBar.position.set(0, 3.04, -1.35);

    // Twin Bright Locomotive Headlights + Long Night Beam!
    const hlTop = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 8), this.mat.lampBulbNight);
    hlTop.rotation.x = Math.PI / 2;
    hlTop.position.set(0, 2.18, 2.68);
    const hlLowL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 8), this.mat.lampBulbNight);
    hlLowL.rotation.x = Math.PI / 2;
    hlLowL.position.set(-0.58, 1.15, 3.05);
    const hlLowR = hlLowL.clone();
    hlLowR.position.x = 0.58;

    const beam = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 9.5), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.24, 7.6);
    beam.visible = this.timeOfDay === "night";
    nightLights.push(beam);

    loco.add(chassis, body, noseSlope, yellowBand, redTrim, roof, windL, windR, guard, acPod, pantoArm1, pantoBar, hlTop, hlLowL, hlLowR, beam);
    return loco;
  }

  _makeTrainCoach(trainWindows) {
    const coach = new THREE.Group();

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.42, 5.75), this.mat.charcoal);
    chassis.position.set(0, 0.46, 0);
    const whGeo = new THREE.CylinderGeometry(0.26, 0.26, 1.98, 8);
    whGeo.rotateZ(Math.PI / 2);
    [-2.1, -1.3, 1.3, 2.1].forEach((wz) => {
      const wh = new THREE.Mesh(whGeo, this.mat.wheelBlack);
      wh.position.set(0, 0.26, wz);
      coach.add(wh);
    });

    // Classic Blue LHB/ICF Express Coach + White & Yellow Stripes + Rooftop AC Pods
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.94, 1.52, 5.65), this.mat.trainDarkBlue);
    body.position.set(0, 1.44, 0);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.18, 5.68), this.mat.wallWhite);
    stripe.position.set(0, 1.02, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.24, 5.55), this.mat.trainRoof);
    roof.position.set(0, 2.3, 0);
    const ac1 = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.2, 1.15), this.mat.wallWhite);
    ac1.position.set(0, 2.48, 1.3);
    const ac2 = ac1.clone();
    ac2.position.z = -1.3;

    // Inter-coach rubber vestibule coupler
    const coupler = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.32, 0.45), this.mat.charcoal);
    coupler.position.set(0, 1.36, 2.95);

    // 5 Passenger Windows on BOTH Sides (Glow warm yellow in Night Mode!)
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.busWindshield;
    const winGeo = new THREE.BoxGeometry(0.06, 0.5, 0.72);
    for (let wz = -1.9; wz <= 1.9; wz += 0.95) {
      const wL = new THREE.Mesh(winGeo, winMat);
      wL.position.set(-0.98, 1.58, wz);
      const wR = new THREE.Mesh(winGeo, winMat);
      wR.position.set(0.98, 1.58, wz);
      coach.add(wL, wR);
      trainWindows.push(wL, wR);
    }

    const doorGeo = new THREE.BoxGeometry(0.08, 1.32, 0.5);
    [-2.48, 2.48].forEach((dz) => {
      const dL = new THREE.Mesh(doorGeo, this.mat.chrome);
      dL.position.set(-0.98, 1.34, dz);
      const dR = dL.clone();
      dR.position.x = 0.98;
      coach.add(dL, dR);
    });

    coach.add(chassis, body, stripe, roof, ac1, ac2, coupler);
    return coach;
  }

  /**
   * 🚄 REALISTIC 3D VANDE BHARAT AERO EXPRESS (Train 2 — Running Opposite Direction on Track 2!)
   */
  _makeVandeBharatCar(isLead, isTail, trainWindows, nightLights) {
    const car = new THREE.Group();

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 5.75), this.mat.charcoal);
    chassis.position.set(0, 0.46, 0);
    const whGeo = new THREE.CylinderGeometry(0.26, 0.26, 1.98, 8);
    whGeo.rotateZ(Math.PI / 2);
    [-2.0, -1.2, 1.2, 2.0].forEach((wz) => {
      const wh = new THREE.Mesh(whGeo, this.mat.wheelBlack);
      wh.position.set(0, 0.26, wz);
      car.add(wh);
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.96, 1.52, 5.6), this.mat.vbWhite);
    body.position.set(0, 1.44, 0);
    const orangeStripe = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.28, 5.65), this.mat.vbOrange);
    orangeStripe.position.set(0, 1.02, 0);
    const blueSkirt = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.22, 5.62), this.mat.vbBlue);
    blueSkirt.position.set(0, 0.72, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.22, 5.45), this.mat.vbWhite);
    roof.position.set(0, 2.28, 0);

    // Continuous Panoramic Dark Window Band on BOTH sides (glows at night!)
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.busWindshield;
    const bandL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.54, 4.9), winMat);
    bandL.position.set(-0.99, 1.62, 0);
    const bandR = bandL.clone();
    bandR.position.x = 0.99;
    trainWindows.push(bandL, bandR);
    car.add(bandL, bandR);

    if (isLead || isTail) {
      const dir = isLead ? 1 : -1;
      const aeroNose = new THREE.Mesh(new THREE.ConeGeometry(1.06, 1.95, 6), this.mat.vbWhite);
      aeroNose.rotation.x = dir * Math.PI / 2;
      aeroNose.scale.set(0.95, 1.0, 0.72);
      aeroNose.position.set(0, 1.26, dir * 3.55);
      const aeroGlass = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.58, 0.72), this.mat.busWindshield);
      aeroGlass.position.set(0, 1.82, dir * 2.95);
      aeroGlass.rotation.x = -dir * 0.45;
      car.add(aeroNose, aeroGlass);

      if (isLead) {
        const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.14), this.mat.lampBulbNight);
        hlL.position.set(-0.56, 1.08, 3.65);
        const hlR = hlL.clone();
        hlR.position.x = 0.56;
        const beam = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 9.5), this.mat.headlightBeam);
        beam.rotation.x = -Math.PI / 2;
        beam.position.set(0, 0.24, 8.2);
        beam.visible = this.timeOfDay === "night";
        nightLights.push(beam);
        car.add(hlL, hlR, beam);
      }
    }

    car.add(chassis, body, orangeStripe, blueSkirt, roof);
    return car;
  }

  /**
   * 🚂 DOUBLE-TRACK CITY RAILWAY LOOP + REAL HOLLOWED MOUNTAIN TUNNEL (NW MARKED CORNER)
   *    + GRAND 2-PLATFORM RAILWAY STATION + FOOT OVERBRIDGE STEPS + STATION PARKING (IN/OUT)!
   * - Track 1 (Inner): Train 1 (Blue/Yellow WAP-7 Express) runs Clockwise -> emerges from Hollow Tunnel -> stops at Platform 1!
   * - Track 2 (Outer): Train 2 (White/Orange Vande Bharat Express) runs Counter-Clockwise -> leaves Platform 2 -> enters Hollow Tunnel!
   */
  _buildRailwaySystem(ringRadius) {
    const railRInner = ringRadius + 24.0;
    const railROuter = ringRadius + 27.8;
    const railRMid = (railRInner + railROuter) / 2;
    this.railRInner = railRInner;
    this.railROuter = railROuter;
    this.railwayZ = -railRMid;

    const rg = new THREE.Group();
    const nightLights = [];
    const trainWindows = [];

    // Helper: Build smooth rounded-square closed loop spline at radius R (clockwise if dir=1, counter-clockwise if dir=-1)
    const makeLoopCurve = (R, dir = 1) => {
      const cornerR = 12.0;
      const inner = R - cornerR;
      const raw = [
        // Start right at the North-West Hollowed Mountain Tunnel (x = -inner*0.58, z = -R) heading East toward Station!
        new THREE.Vector3(-inner * 0.58, 0.14, -R),
        new THREE.Vector3(0, 0.14, -R), // Platform 1 / Platform 2!
        new THREE.Vector3(inner, 0.14, -R),
        new THREE.Vector3(R - 2.4, 0.14, -R + 2.4),
        new THREE.Vector3(R, 0.14, -inner),
        new THREE.Vector3(R, 0.14, 0),
        new THREE.Vector3(R, 0.14, inner),
        new THREE.Vector3(R - 2.4, 0.14, R - 2.4),
        new THREE.Vector3(inner, 0.14, R),
        new THREE.Vector3(0, 0.14, R),
        new THREE.Vector3(-inner, 0.14, R),
        new THREE.Vector3(-R + 2.4, 0.14, R - 2.4),
        new THREE.Vector3(-R, 0.14, inner),
        new THREE.Vector3(-R, 0.14, 0),
        new THREE.Vector3(-R, 0.14, -inner),
        new THREE.Vector3(-R + 2.4, 0.14, -R + 2.4),
        new THREE.Vector3(-inner, 0.14, -R)
      ];
      if (dir < 0) raw.reverse();
      return new THREE.CatmullRomCurve3(raw, true, "catmullrom", 0.35);
    };

    const track1Curve = makeLoopCurve(railRInner, 1);  // Train 1: Coming from NW Tunnel -> East into Platform 1 -> around City!
    const track2Curve = makeLoopCurve(railROuter, -1); // Train 2: Going from Platform 2 -> West into NW Tunnel -> around City!

    const len1 = track1Curve.getLength();
    const len2 = track2Curve.getLength();

    // Find exact stationT on each track closest to x=0, z=-R
    const findNearestT = (curve, tx, tz) => {
      let bestT = 0;
      let bestD = Infinity;
      for (let i = 0; i < 400; i++) {
        const tt = i / 400;
        const p = curve.getPointAt(tt);
        const d = (p.x - tx) * (p.x - tx) + (p.z - tz) * (p.z - tz);
        if (d < bestD) {
          bestD = d;
          bestT = tt;
        }
      }
      return bestT;
    };
    const stationT1 = findNearestT(track1Curve, 0, -railRInner);
    const stationT2 = findNearestT(track2Curve, 0, -railROuter);

    // 1. Render BOTH Parallel Railway Tracks (Ballast + Sleepers + 4 Steel Rails) using Ultra-Fast InstancedMesh!
    const buildInstancedTrack = (curve, totalLen) => {
      const count = Math.min(340, Math.floor(totalLen / 2.0));
      const sleeperGeo = new THREE.BoxGeometry(2.65, 0.1, 0.42);
      const sleeperInst = new THREE.InstancedMesh(sleeperGeo, this.mat.railSleeper, count);
      const railGeo = new THREE.BoxGeometry(0.14, 0.12, (totalLen / count) * 1.15);
      const railInst = new THREE.InstancedMesh(railGeo, this.mat.railSteel, count * 2);

      const dummy = new THREE.Object3D();
      const up = new THREE.Vector3(0, 1, 0);
      const rightV = new THREE.Vector3();
      for (let i = 0; i < count; i++) {
        const u = i / count;
        const p = curve.getPointAt(u);
        const tan = curve.getTangentAt(u).normalize();
        const yaw = Math.atan2(tan.x, tan.z);

        dummy.position.set(p.x, 0.08, p.z);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        sleeperInst.setMatrixAt(i, dummy.matrix);

        rightV.crossVectors(up, tan).normalize();
        dummy.position.set(p.x - rightV.x * 0.8, 0.16, p.z - rightV.z * 0.8);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        railInst.setMatrixAt(i * 2, dummy.matrix);

        dummy.position.set(p.x + rightV.x * 0.8, 0.16, p.z + rightV.z * 0.8);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        railInst.setMatrixAt(i * 2 + 1, dummy.matrix);
      }
      sleeperInst.instanceMatrix.needsUpdate = true;
      railInst.instanceMatrix.needsUpdate = true;
      rg.add(sleeperInst, railInst);
    };
    buildInstancedTrack(track1Curve, len1);
    buildInstancedTrack(track2Curve, len2);

    // 2. Railway Crossing Warning Posts at East Airport Highway & West Beach Road
    const addCrossing = (cx, cz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.0, 6), this.mat.trainYellow);
      post.position.set(cx, 1.5, cz);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), this.mat.beaconRed);
      lamp.position.set(cx, 3.1, cz);
      rg.add(post, lamp);
    };
    addCrossing(railRInner - 2.4, 13.5);
    addCrossing(railROuter + 2.4, 22.5);
    addCrossing(-railRInner + 2.4, -4.5);
    addCrossing(-railROuter - 2.4, 4.5);

    // 3. ⛰️ REAL HOLLOWED ARCHED MOUNTAIN TUNNEL (Right in the Marked North-West Corner!)
    //    Spans BOTH parallel tracks cleanly so you can look straight THROUGH the open hollow arch!
    const tunnelX = -(railRInner - 12.0) * 0.58;
    const tunLen = 22.0;
    const tunGroup = new THREE.Group();
    tunGroup.position.set(tunnelX, 0, -railRMid);

    // Hollowed Double-Track Concrete Tunnel Walls (Left/South Wall + Right/North Wall — COMPLETELY OPEN INSIDE!)
    const wallS = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 4.4, 1.1), this.mat.tunnelDarkWall);
    wallS.position.set(0, 2.2, 4.3);
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 4.4, 1.1), this.mat.tunnelDarkWall);
    wallN.position.set(0, 2.2, -4.3);
    tunGroup.add(wallS, wallN);

    // Curved Hollow Arched Vault Roof (5 angled concrete slabs forming a genuine hollow semicircular arch over BOTH tracks!)
    const vaultAngles = [-0.88, -0.44, 0, 0.44, 0.88];
    const vaultR = 4.6;
    vaultAngles.forEach((va) => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 0.75, 2.3), this.mat.tunnelDarkWall);
      slab.position.set(0, 3.8 + Math.cos(va) * 2.1, Math.sin(va) * vaultR);
      slab.rotation.x = va;
      tunGroup.add(slab);
    });

    // Concrete Stone Arched Entrance & Exit Portals on BOTH Ends (+X & -X) — Open Hollow Mouths!
    [-tunLen / 2, tunLen / 2].forEach((px) => {
      const pS = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.8, 2.4), this.mat.tunnelConcrete);
      pS.position.set(px, 2.9, 5.2);
      const pN = pS.clone();
      pN.position.z = -5.2;
      const pHeader = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.9, 12.8), this.mat.tunnelConcrete);
      pHeader.position.set(px, 6.2, 0);
      const pYellow = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.42, 13.0), this.mat.trainYellow);
      pYellow.position.set(px, 5.3, 0);
      // Green & Red Tunnel Signal Lights above the portal
      const sigG = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6), this.mat.beaconGreen);
      sigG.position.set(px + (px > 0 ? 0.72 : -0.72), 6.2, 2.2);
      const sigR = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6), this.mat.beaconRed);
      sigR.position.set(px + (px > 0 ? 0.72 : -0.72), 6.2, -2.2);
      tunGroup.add(pS, pN, pHeader, pYellow, sigG, sigR);
    });

    // Sculpted Green & Rocky Mountain Ridges OVER & BESIDE the Hollow Tunnel (NEVER blocking the inside bore!)
    const mTop1 = new THREE.Mesh(new THREE.DodecahedronGeometry(7.2, 0), this.mat.mountainGreen);
    mTop1.scale.set(1.65, 0.65, 1.35);
    mTop1.position.set(0, 9.6, 0);
    const mTop2 = new THREE.Mesh(new THREE.DodecahedronGeometry(5.6, 0), this.mat.mountainRock);
    mTop2.scale.set(1.4, 0.65, 1.15);
    mTop2.position.set(-4.5, 11.2, -1.2);
    const mSideN = new THREE.Mesh(new THREE.DodecahedronGeometry(6.8, 0), this.mat.mountainRock);
    mSideN.scale.set(1.55, 0.9, 0.85);
    mSideN.position.set(0, 4.6, -10.2);
    const mSideS = new THREE.Mesh(new THREE.DodecahedronGeometry(5.8, 0), this.mat.mountainGreen);
    mSideS.scale.set(1.45, 0.82, 0.78);
    mSideS.position.set(0, 3.8, 9.8);
    const mFarNW = new THREE.Mesh(new THREE.DodecahedronGeometry(8.4, 0), this.mat.mountainGreen);
    mFarNW.scale.set(1.3, 0.95, 1.2);
    mFarNW.position.set(-14.5, 5.2, -11.5);
    tunGroup.add(mTop1, mTop2, mSideN, mSideS, mFarNW);

    const tunSign = this._createNameSign("⛰️ HOLLOW RAILWAY TUNNEL", "2 TRACKS • IN & OUT TRAINS", true);
    tunSign.position.set(0, 16.5, 0);
    tunGroup.add(tunSign);
    rg.add(tunGroup);

    // 4. 🚉 GRAND 2-PLATFORM RAILWAY STATION ("SHERU BHAI JN") + FOOT OVERBRIDGE STEPS + STATION PARKING (IN / OUT)
    const stGroup = new THREE.Group();
    stGroup.position.set(0, 0, -railRMid);

    // --- A. PLATFORM 1 (South / City Side at local z = +4.4, right beside Track 1 at local z = +1.9) ---
    const pf1 = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.9, 4.6), this.mat.concrete);
    pf1.position.set(0, 0.45, 5.0);
    const pf1Edge = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.08, 0.36), this.mat.trainYellow);
    pf1Edge.position.set(0, 0.92, 2.85);
    const pf1Roof = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.28, 4.8), this.mat.stationRoof);
    pf1Roof.position.set(-2, 4.5, 5.0);
    for (let px = -12; px <= 8; px += 5) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 6), this.mat.wallWhite);
      col.position.set(px, 2.7, 5.2);
      stGroup.add(col);
      const pl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.lampBulbNight);
      pl.position.set(px, 4.2, 3.8);
      pl.visible = this.timeOfDay === "night";
      stGroup.add(pl);
      nightLights.push(pl);
    }

    // --- B. PLATFORM 2 (North / Main Building Side at local z = -5.0, right beside Track 2 at local z = -1.9) ---
    const pf2 = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.9, 4.8), this.mat.concrete);
    pf2.position.set(0, 0.45, -5.0);
    const pf2Edge = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.08, 0.36), this.mat.trainYellow);
    pf2Edge.position.set(0, 0.92, -2.75);
    const pf2Roof = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.28, 5.0), this.mat.stationRoof);
    pf2Roof.position.set(-2, 4.5, -5.0);
    for (let px = -12; px <= 8; px += 5) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 6), this.mat.wallWhite);
      col.position.set(px, 2.7, -5.2);
      stGroup.add(col);
      const pl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.lampBulbNight);
      pl.position.set(px, 4.2, -3.8);
      pl.visible = this.timeOfDay === "night";
      stGroup.add(pl);
      nightLights.push(pl);
    }

    // Platform Benches & Iconic Yellow Indian Railways Station Nameboards on BOTH Platforms!
    [-9, -2, 4].forEach((bx) => {
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.6), this.mat.trainBlue);
      b1.position.set(bx, 1.1, 5.6);
      const b2 = b1.clone();
      b2.position.z = -5.6;
      stGroup.add(b1, b2);
    });
    const irPF1 = this._makeBuildingBoard("SHERU BHAI JN", "PLATFORM 1 • INCOMING", "#facc15", "#111827", 5.8, 1.25);
    irPF1.position.set(-15.0, 2.4, 4.8);
    const irPF2 = this._makeBuildingBoard("SHERU BHAI JN", "PLATFORM 2 • OUTGOING", "#facc15", "#111827", 5.8, 1.25);
    irPF2.position.set(-15.0, 2.4, -4.8);
    stGroup.add(irPF1, irPF2);

    // --- C. FOOT OVERBRIDGE (FOB) WITH REAL STEPS CONNECTING PLATFORM 1 <-> PLATFORM 2 OVER BOTH TRACKS! ---
    const fobX = 12.6;
    // Elevated Bridge Span cleanly above both trains (y = 4.65; trains are 3.05 tall!)
    const fobDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.34, 11.4), this.mat.concrete);
    fobDeck.position.set(fobX, 4.65, 0);
    const fobRailL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 11.4), this.mat.fobSteel);
    fobRailL.position.set(fobX - 1.52, 5.35, 0);
    const fobRailR = fobRailL.clone();
    fobRailR.position.x = fobX + 1.52;
    const fobRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 11.6), this.mat.stationRoof);
    fobRoof.position.set(fobX, 6.45, 0);
    // Support Steel Columns on Platform 1 & Platform 2
    [[-1.4, 4.2], [1.4, 4.2], [-1.4, -4.2], [1.4, -4.2]].forEach(([dx, dz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.6, 6), this.mat.fobSteel);
      col.position.set(fobX + dx, 2.5, dz);
      stGroup.add(col);
    });
    // REAL STEPPED STAIRCASES going down onto Platform 1 (facing West along platform) AND Platform 2!
    for (let st = 0; st < 8; st++) {
      const sx = fobX - 1.8 - st * 0.56;
      const sy = 4.45 - st * 0.44;
      const step1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 1.85), this.mat.concrete);
      step1.position.set(sx, sy, 5.2);
      const step2 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 1.85), this.mat.concrete);
      step2.position.set(sx, sy, -5.2);
      stGroup.add(step1, step2);
    }
    // Staircase Handrails on both staircases
    const stairRail1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.16, 0.14), this.mat.trainYellow);
    stairRail1.position.set(fobX - 3.8, 3.6, 4.35);
    stairRail1.rotation.z = 0.66;
    const stairRail2 = stairRail1.clone();
    stairRail2.position.z = -4.35;
    stGroup.add(fobDeck, fobRailL, fobRailR, fobRoof, stairRail1, stairRail2);

    // Animated Pedestrian Crossing the Foot Overbridge between Platform 1 & Platform 2!
    const bridgeWalker = this._createCharacter({ shirtMat: this.mat.wallGold, pantsMat: this.mat.darkPants, scale: 0.92 });
    bridgeWalker.position.set(fobX, 4.86, 0);
    stGroup.add(bridgeWalker);

    // --- D. DIRECT ROAD CONNECTION FROM PLATFORM 1 <-> STATION PARKING (IN / OUT) <-> NORTH OUTER RING ROAD! ---
    // Note: Outer Ring Road is at world z = -ringRadius, which in stGroup local coords is local z = +railRMid - ringRadius (~ +25.9)!
    const distToRing = railRMid - ringRadius; // ~25.9
    const parkingZ = 14.2; // Sits neatly between Platform 1 (z=7.3) and North Outer Ring Road (z=22.3)!

    // Pedestrian Entrance Gate & Steps connecting Platform 1 directly to Station Parking Walkway!
    const pf1Steps = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.48, 1.8), this.mat.sidewalk);
    pf1Steps.position.set(0, 0.24, 8.1);
    const gateArch = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.9, 0.6), this.mat.navy);
    gateArch.position.set(0, 3.4, 8.2);
    const gColL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.4, 0.45), this.mat.wallWhite);
    gColL.position.set(-3.3, 1.7, 8.2);
    const gColR = gColL.clone();
    gColR.position.x = 3.3;
    const gateBoard = this._makeBuildingBoard("PLATFORM 1 ENTRY", "TICKET COUNTER", "#1e3a8a", "#facc15", 6.2, 0.85);
    gateBoard.position.set(0, 3.4, 8.55);
    stGroup.add(pf1Steps, gateArch, gColL, gColR, gateBoard);

    // Paved Station Parking Plaza (28 x 11.5 units) with Marked Bays & Parked Cars/Autos!
    const parkLot = new THREE.Mesh(new THREE.BoxGeometry(28.0, 0.1, 11.6), this.mat.tarmacGrey);
    parkLot.position.set(0, 0.05, parkingZ);
    const parkWalkway = new THREE.Mesh(new THREE.BoxGeometry(28.0, 0.14, 1.6), this.mat.sidewalk);
    parkWalkway.position.set(0, 0.07, 8.9);
    stGroup.add(parkLot, parkWalkway);

    // Marked White Parking Bay Lines + Parked Vehicles (Cars & Autos!)
    for (let px = -11; px <= 11; px += 3.2) {
      if (Math.abs(px) < 3.6) continue; // Keep center passenger drop-off clear!
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 3.8), this.mat.stripe);
      line.rotation.x = -Math.PI / 2;
      line.position.set(px, 0.12, 12.2);
      stGroup.add(line);
    }
    const pCar1 = this._makeVehicleMesh(false, false, 0xef4444, false);
    pCar1.position.set(-9.4, 0.1, 12.2);
    const pCar2 = this._makeVehicleMesh(false, false, 0x3b82f6, false);
    pCar2.position.set(-6.2, 0.1, 12.2);
    const pAuto1 = this._makeRealAutoMesh(false, false);
    pAuto1.position.set(6.4, 0.1, 12.2);
    const pCar3 = this._makeVehicleMesh(false, false, 0x22c55e, false);
    pCar3.position.set(9.6, 0.1, 12.2);
    stGroup.add(pCar1, pCar2, pAuto1, pCar3);

    // SEPARATE "IN ➔" ENTRY ROAD (Left) & "⬅ OUT" EXIT ROAD (Right) Directly Connected to North Outer Ring Road!
    const connLen = Math.max(4.5, distToRing - 19.2);
    const connZ = 19.6 + connLen / 2;
    const roadIn = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, connLen + 2.5), this.mat.road);
    roadIn.position.set(-8.5, 0.04, connZ);
    const roadOut = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, connLen + 2.5), this.mat.road);
    roadOut.position.set(8.5, 0.04, connZ);

    // Clear "IN ➔" (Green) & "⬅ OUT" (Red) Road Lane Markers + Overhead Signboards!
    const inStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3.2), this.mat.parkingGreen);
    inStrip.rotation.x = -Math.PI / 2;
    inStrip.position.set(-8.5, 0.12, 19.5);
    const outStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3.2), this.mat.parkingRed);
    outStrip.rotation.x = -Math.PI / 2;
    outStrip.position.set(8.5, 0.12, 19.5);

    const inSign = this._makeBuildingBoard("IN ⬆", "STATION PARKING", "#15803d", "#ffffff", 4.6, 1.0);
    inSign.position.set(-8.5, 2.8, 19.8);
    const inP = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 6), this.mat.chrome);
    inP.position.set(-10.7, 1.3, 19.8);

    const outSign = this._makeBuildingBoard("⬇ OUT", "TO CITY ROAD", "#b91c1c", "#ffffff", 4.6, 1.0);
    outSign.position.set(8.5, 2.8, 19.8);
    const outP = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 6), this.mat.chrome);
    outP.position.set(10.7, 1.3, 19.8);

    stGroup.add(roadIn, roadOut, inStrip, outStrip, inSign, inP, outSign, outP);

    // --- E. GRAND HERITAGE RAILWAY STATION MAIN BUILDING + CLOCK TOWER DOME (Behind Platform 2) ---
    const cleanRailOwner = (this.railwayOwner || "@_ur_bunny_108_").trim();
    const stMain = new THREE.Mesh(new THREE.BoxGeometry(26.0, 5.8, 6.4), this.mat.stuccoCream);
    stMain.position.set(0, 3.3, -10.8);
    const stTrim = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.45, 6.8), this.mat.terracottaRoof);
    stTrim.position.set(0, 6.3, -10.8);
    const clockBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.2, 4.2), this.mat.stuccoCream);
    clockBase.position.set(0, 7.8, -10.8);
    const clockDome = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.terracottaRoof);
    clockDome.position.set(0, 9.4, -10.8);
    const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 12), this.mat.wallWhite);
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(0, 8.0, -8.65);

    const mainBoard = this._makeBuildingBoard("RAILWAY STATION", `${cleanRailOwner.toUpperCase()} • SHERU BHAI JN`, "#1e3a8a", "#facc15", 15.0, 2.0);
    mainBoard.position.set(0, 5.7, -7.5);

    const stFloatSign = this._createNameSign(`🚂 SHERU BHAI JN • ${cleanRailOwner}`, "2 PLATFORMS • PARKING • EXPRESS TRAINS", true);
    stFloatSign.position.set(0, 14.5, -9.8);

    // 5 Passengers on Platform 1 (for Train 1) + 5 Passengers on Platform 2 (for Train 2)!
    const makePlatformPax = (zPos) =>
      [this.mat.wallCoral, this.mat.wallGold, this.mat.wallMint, this.mat.wallBlue, this.mat.richVelvetRed].map((sm, i) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.94 });
        p.position.set(-7.5 + i * 3.4, 0.95, zPos);
        stGroup.add(p);
        return p;
      });
    const paxPF1 = makePlatformPax(4.4);
    const paxPF2 = makePlatformPax(-4.4);

    // Clickable Hitbox for Railway Station
    const stHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(38, 15, 28),
      this.mat.invisibleHitbox
    );
    stHitbox.position.set(0, 7.5, 2.0);
    stHitbox.userData.plotId = "RAILWAY_STATION";
    stGroup.add(stHitbox);
    this.plotHitboxes.push(stHitbox);

    stGroup.add(pf1, pf1Edge, pf1Roof, pf2, pf2Edge, pf2Roof, stMain, stTrim, clockBase, clockDome, clockFace, mainBoard, stFloatSign);
    rg.add(stGroup);

    // 4b. ⛰️ SECOND HOLLOW ARAKU MOUNTAIN TUNNEL (Opposite South-East Side — Trains Emerge From Mountains on BOTH Ends!)
    const tunGroupSE = new THREE.Group();
    tunGroupSE.position.set(-tunnelX, 0, railRMid);
    const wallS2 = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 4.4, 1.1), this.mat.tunnelDarkWall);
    wallS2.position.set(0, 2.2, 4.3);
    const wallN2 = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 4.4, 1.1), this.mat.tunnelDarkWall);
    wallN2.position.set(0, 2.2, -4.3);
    tunGroupSE.add(wallS2, wallN2);
    vaultAngles.forEach((va) => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 0.75, 2.3), this.mat.tunnelDarkWall);
      slab.position.set(0, 3.8 + Math.cos(va) * 2.1, Math.sin(va) * vaultR);
      slab.rotation.x = va;
      tunGroupSE.add(slab);
    });
    [-tunLen / 2, tunLen / 2].forEach((px) => {
      const pS = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.8, 2.4), this.mat.tunnelConcrete);
      pS.position.set(px, 2.9, 5.2);
      const pN = pS.clone();
      pN.position.z = -5.2;
      const pHeader = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.9, 12.8), this.mat.tunnelConcrete);
      pHeader.position.set(px, 6.2, 0);
      const pYellow = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.42, 13.0), this.mat.trainYellow);
      pYellow.position.set(px, 5.3, 0);
      const sigG = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6), this.mat.beaconGreen);
      sigG.position.set(px + (px > 0 ? 0.72 : -0.72), 6.2, 2.2);
      const sigR = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6), this.mat.beaconRed);
      sigR.position.set(px + (px > 0 ? 0.72 : -0.72), 6.2, -2.2);
      tunGroupSE.add(pS, pN, pHeader, pYellow, sigG, sigR);
    });
    const mSETop = new THREE.Mesh(new THREE.DodecahedronGeometry(7.6, 0), this.mat.arakuForestGreen);
    mSETop.scale.set(1.75, 0.72, 1.35);
    mSETop.position.set(0, 9.8, 0);
    const mSESideS = new THREE.Mesh(new THREE.DodecahedronGeometry(7.4, 0), this.mat.arakuRockGrey);
    mSESideS.scale.set(1.55, 0.95, 0.95);
    mSESideS.position.set(0, 4.8, 10.6);
    const mSESideN = new THREE.Mesh(new THREE.DodecahedronGeometry(5.6, 0), this.mat.arakuLushHill);
    mSESideN.scale.set(1.4, 0.8, 0.78);
    mSESideN.position.set(0, 3.6, -9.8);
    const tunSignSE = this._createNameSign("⛰️ ARAKU MOUNTAIN TUNNEL", "EAST GATE • 2 TRACKS", true);
    tunSignSE.position.set(0, 16.5, 0);
    tunGroupSE.add(mSETop, mSESideS, mSESideN, tunSignSE);
    rg.add(tunGroupSE);

    // 4c. 🚉 SECOND OPPOSITE-SIDE GRAND 2-PLATFORM RAILWAY STATION ("ARAKU SOUTH JN" on South Side!)
    this.railwaySouthZ = railRMid;
    const southT1 = findNearestT(track1Curve, 0, railRInner);
    const southT2 = findNearestT(track2Curve, 0, railROuter);

    const stSouth = new THREE.Group();
    stSouth.position.set(0, 0, railRMid);

    // Platform 1 (City/North Side at local z = -5.0, next to Track 1 at local z = -1.9)
    const spf1 = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.9, 4.6), this.mat.concrete);
    spf1.position.set(0, 0.45, -5.0);
    const spf1Edge = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.08, 0.36), this.mat.trainYellow);
    spf1Edge.position.set(0, 0.92, -2.85);
    const spf1Roof = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.28, 4.8), this.mat.stationRoof);
    spf1Roof.position.set(-2, 4.5, -5.0);

    // Platform 2 (Mountain/South Side at local z = +5.0, next to Track 2 at local z = +1.9)
    const spf2 = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.9, 4.8), this.mat.concrete);
    spf2.position.set(0, 0.45, 5.0);
    const spf2Edge = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.08, 0.36), this.mat.trainYellow);
    spf2Edge.position.set(0, 0.92, 2.75);
    const spf2Roof = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.28, 5.0), this.mat.stationRoof);
    spf2Roof.position.set(-2, 4.5, 5.0);

    for (let px = -12; px <= 8; px += 5) {
      const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 6), this.mat.wallWhite);
      c1.position.set(px, 2.7, -5.2);
      const c2 = c1.clone();
      c2.position.z = 5.2;
      const l1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.lampBulbNight);
      l1.position.set(px, 4.2, -3.8);
      l1.visible = this.timeOfDay === "night";
      const l2 = l1.clone();
      l2.position.z = 3.8;
      stSouth.add(c1, c2, l1, l2);
      nightLights.push(l1, l2);
    }

    // Yellow Station Nameboards on BOTH South Platforms
    const sIr1 = this._makeBuildingBoard("ARAKU SOUTH JN", "PLATFORM 1 • CITY SIDE", "#facc15", "#111827", 5.8, 1.25);
    sIr1.position.set(-15.0, 2.4, -4.8);
    const sIr2 = this._makeBuildingBoard("ARAKU SOUTH JN", "PLATFORM 2 • VALLEY VIEW", "#facc15", "#111827", 5.8, 1.25);
    sIr2.position.set(-15.0, 2.4, 4.8);
    stSouth.add(sIr1, sIr2);

    // Foot Overbridge with Real 8-Step Staircases connecting South Platform 1 <-> Platform 2!
    const sFobDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.34, 11.4), this.mat.concrete);
    sFobDeck.position.set(fobX, 4.65, 0);
    const sFobRailL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 11.4), this.mat.fobSteel);
    sFobRailL.position.set(fobX - 1.52, 5.35, 0);
    const sFobRailR = sFobRailL.clone();
    sFobRailR.position.x = fobX + 1.52;
    const sFobRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 11.6), this.mat.stationRoof);
    sFobRoof.position.set(fobX, 6.45, 0);
    [[-1.4, 4.2], [1.4, 4.2], [-1.4, -4.2], [1.4, -4.2]].forEach(([dx, dz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.6, 6), this.mat.fobSteel);
      col.position.set(fobX + dx, 2.5, dz);
      stSouth.add(col);
    });
    for (let st = 0; st < 8; st++) {
      const sx = fobX - 1.8 - st * 0.56;
      const sy = 4.45 - st * 0.44;
      const st1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 1.85), this.mat.concrete);
      st1.position.set(sx, sy, -5.2);
      const st2 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 1.85), this.mat.concrete);
      st2.position.set(sx, sy, 5.2);
      stSouth.add(st1, st2);
    }
    const southBridgeWalker = this._createCharacter({ shirtMat: this.mat.wallMint, pantsMat: this.mat.darkPants, scale: 0.92 });
    southBridgeWalker.position.set(fobX, 4.86, 0);
    stSouth.add(sFobDeck, sFobRailL, sFobRailR, sFobRoof, southBridgeWalker);

    // Direct Road Connection + South Station Parking Plaza (between South Platform 1 & South Outer Ring Road!)
    const sParkLot = new THREE.Mesh(new THREE.BoxGeometry(28.0, 0.1, 11.6), this.mat.tarmacGrey);
    sParkLot.position.set(0, 0.05, -parkingZ);
    const sRoadIn = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, connLen + 2.5), this.mat.road);
    sRoadIn.position.set(-8.5, 0.04, -connZ);
    const sRoadOut = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, connLen + 2.5), this.mat.road);
    sRoadOut.position.set(8.5, 0.04, -connZ);
    const sCar1 = this._makeVehicleMesh(false, false, 0xf59e0b, false);
    sCar1.position.set(-8.4, 0.1, -12.2);
    const sAuto = this._makeRealAutoMesh(false, false);
    sAuto.position.set(7.4, 0.1, -12.2);
    const sInSign = this._makeBuildingBoard("IN ⬇", "SOUTH PARKING", "#15803d", "#ffffff", 4.6, 1.0);
    sInSign.position.set(-8.5, 2.8, -19.8);
    const sOutSign = this._makeBuildingBoard("⬆ OUT", "TO CITY ROAD", "#b91c1c", "#ffffff", 4.6, 1.0);
    sOutSign.position.set(8.5, 2.8, -19.8);
    stSouth.add(sParkLot, sRoadIn, sRoadOut, sCar1, sAuto, sInSign, sOutSign);

    // South Station Main Building + Roof Arch (Behind South Platform 2 at local z = +10.8)
    const sMain = new THREE.Mesh(new THREE.BoxGeometry(26.0, 5.4, 6.2), this.mat.stuccoIvory);
    sMain.position.set(0, 3.1, 10.8);
    const sTrim = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.45, 6.6), this.mat.stationRoof);
    sTrim.position.set(0, 5.9, 10.8);
    const sMainBoard = this._makeBuildingBoard("ARAKU SOUTH JN", "2ND RAILWAY STATION • EXPRESS", "#0f172a", "#facc15", 14.5, 1.9);
    sMainBoard.position.set(0, 5.2, 7.6);
    sMainBoard.rotation.y = Math.PI;
    const sFloatSign = this._createNameSign("🚉 ARAKU SOUTH JN", "2 PLATFORMS • MOUNTAIN EXPRESS", true);
    sFloatSign.position.set(0, 12.6, 9.8);

    // 5 Passengers on South Platform 1 + 5 Passengers on South Platform 2
    const makeSouthPax = (zPos) =>
      [this.mat.wallBlue, this.mat.wallCoral, this.mat.wallGold, this.mat.wallMint, this.mat.khakiUniform].map((sm, i) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.94 });
        p.position.set(-7.5 + i * 3.4, 0.95, zPos);
        stSouth.add(p);
        return p;
      });
    const southPaxPF1 = makeSouthPax(-4.4);
    const southPaxPF2 = makeSouthPax(4.4);

    const sHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(38, 15, 28),
      this.mat.invisibleHitbox
    );
    sHitbox.position.set(0, 7.5, -2.0);
    sHitbox.userData.plotId = "RAILWAY_SOUTH";
    stSouth.add(sHitbox);
    this.plotHitboxes.push(sHitbox);

    stSouth.add(spf1, spf1Edge, spf1Roof, spf2, spf2Edge, spf2Roof, sMain, sTrim, sMainBoard, sFloatSign);
    rg.add(stSouth);

    // 5. SPAWN 2 REALISTIC 3D TRAINS (Opposite Directions on Track 1 & Track 2!)
    // Train 1 (Blue/Yellow WAP-7 Electric Engine + 4 Passenger Coaches on Track 1)
    const train1Cars = [];
    const loco1 = this._makeTrainLocomotive(nightLights);
    rg.add(loco1);
    train1Cars.push(loco1);
    for (let c = 0; c < 4; c++) {
      const coach = this._makeTrainCoach(trainWindows);
      rg.add(coach);
      train1Cars.push(coach);
    }

    // Train 2 (White/Orange Vande Bharat Aero Express — 5 Cars on Track 2 going Opposite Direction!)
    const train2Cars = [];
    for (let c = 0; c < 5; c++) {
      const vbCar = this._makeVandeBharatCar(c === 0, c === 4, trainWindows, nightLights);
      rg.add(vbCar);
      train2Cars.push(vbCar);
    }

    this.cityGroup.add(rg);

    this.railwaySim = {
      track1Curve,
      track2Curve,
      len1,
      len2,
      stationT1,
      stationT2,
      southT1,
      southT2,
      train1Cars,
      train2Cars,
      paxPF1,
      paxPF2,
      southPaxPF1,
      southPaxPF2,
      bridgeWalker,
      southBridgeWalker,
      fobX,
      nightLights,
      trainWindows
    };
  }


  /**
   * ⛰️💧 360° ARAKU VALLEY MISTY MOUNTAINS, LUSH PINE FORESTS, FLOWING RIVERS & ANIMATED WATERFALLS
   * Surrounds the ENTIRE city horizon so there is NEVER a blank screen or empty edge!
   * Uses InstancedMesh for hills & forest trees to stay buttery-smooth on low-RAM phones.
   */

  /**
   * 🛕⛰️ SACRED HILLTOP TEMPLE MOUNTAIN BESIDE RAILWAY STATION (`HILL_TEMPLE`)
   * - Directly connected by a real paved road from Main Outer Ring Road & North Railway Station!
   * - Sparkling Mountain River & Waterfall crossed by a stone road bridge!
   * - Real 48-Step Pilgrimage Stairway with Railings, Govinda Archways & 12 Animated Devotees Climbing!
   * - Winding Mountain Ghat Road with live Cars, Bus & Auto driving from the Main Road up to the Temple!
   * - Grand Real-Style South Indian Maha Temple on the Summit with Radiant Rotating Golden Glowing Aura & Sky Beams!
   */
  _buildHilltopTempleMountain(ringRadius) {
    const tx = 44;
    const tz = -(ringRadius + 56);
    this.hillTemplePos = { x: tx, z: tz };

    const tg = new THREE.Group();
    tg.position.set(tx, 0, tz);

    // 1. REAL MAIN-ROAD CONNECTOR & WINDING MOUNTAIN GHAT ROAD (Connects Main Outer Ring Road + Station Road!)
    //    Straight paved approach road coming from South (z = +56 -> z = +24) across the North Railway Corridor!
    const approachLen = 56;
    const approachRoad = new THREE.Mesh(this._boxGeo(6.4, 0.12, approachLen), this.mat.road);
    approachRoad.position.set(0, 0.04, 24 + approachLen / 2);
    const appDash = new THREE.Mesh(new THREE.PlaneGeometry(0.24, approachLen - 2), this.mat.stripe);
    appDash.rotation.x = -Math.PI / 2;
    appDash.position.set(0, 0.11, 24 + approachLen / 2);

    // East-West Link Road connecting directly to the North Railway Station Entrance (x = -44 -> x = 0 at z = +24)!
    const stnLink = new THREE.Mesh(this._boxGeo(46, 0.12, 6.2), this.mat.road);
    stnLink.position.set(-22, 0.04, 24);
    const stnDash = new THREE.Mesh(new THREE.PlaneGeometry(44, 0.24), this.mat.stripe);
    stnDash.rotation.x = -Math.PI / 2;
    stnDash.position.set(-22, 0.11, 24);
    tg.add(approachRoad, appDash, stnLink, stnDash);

    // 2. SPARKLING MOUNTAIN RIVER & CASCADING WATERFALL FLOWING BESIDE THE TEMPLE MOUNTAIN!
    const hillRiver = new THREE.Mesh(this._boxGeo(7.5, 0.1, 64), this.mat.riverBlue);
    hillRiver.position.set(-19, 0.05, 4);
    const hillBridge = new THREE.Mesh(this._boxGeo(10.5, 0.45, 7.2), this.mat.marble);
    hillBridge.position.set(-19, 0.32, 24);
    [-3.3, 3.3].forEach((bz) => {
      const rail = new THREE.Mesh(this._boxGeo(10.5, 0.72, 0.28), this.mat.templeGold);
      rail.position.set(-19, 0.82, 24 + bz);
      tg.add(rail);
    });
    // Waterfall tumbling down the West cliff of the Temple Mountain into the River!
    const cliffFall = new THREE.Mesh(this._boxGeo(3.6, 15.2, 1.4), this.mat.waterfallBlue);
    cliffFall.position.set(-14.5, 7.6, -2);
    cliffFall.rotation.z = 0.28;
    const fallSplash = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.8, 0.45, 12), this.mat.seaFoam);
    fallSplash.position.set(-17.8, 0.28, -2);
    tg.add(hillRiver, hillBridge, cliffFall, fallSplash);

    // 3. REAL LAYERED GREEN SACRED MOUNTAIN WITH FLAT SUMMIT PLATEAU (Height = 16.0!)
    const hillBase = new THREE.Mesh(new THREE.CylinderGeometry(19.5, 29.0, 6.0, 14), this.mat.templeHillGreen);
    hillBase.position.set(0, 3.0, -4);
    const hillMid = new THREE.Mesh(new THREE.CylinderGeometry(15.5, 20.5, 5.5, 14), this.mat.templeHillRock);
    hillMid.position.set(0, 8.5, -4);
    const hillTop = new THREE.Mesh(new THREE.CylinderGeometry(13.2, 16.2, 5.0, 14), this.mat.templeHillGreen);
    hillTop.position.set(0, 13.5, -4);
    const summitPlateau = new THREE.Mesh(new THREE.CylinderGeometry(13.8, 14.2, 0.45, 16), this.mat.marble);
    summitPlateau.position.set(0, 16.1, -4);
    tg.add(hillBase, hillMid, hillTop, summitPlateau);

    // Lush Trees around the Sacred Mountain Slopes!
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      if (Math.abs(a - Math.PI / 2) < 0.45) continue; // Keep front stairway open!
      const rad = 18.5 + (i % 3) * 3.8;
      const ty = i % 2 === 0 ? 4.8 : 9.2;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.8, 5), this.mat.treeTrunk);
      tr.position.set(Math.cos(a) * rad, ty, -4 + Math.sin(a) * rad);
      const lf = new THREE.Mesh(new THREE.ConeGeometry(1.65, 3.8, 6), this.mat.arakuDeepGreen);
      lf.position.set(Math.cos(a) * rad, ty + 2.4, -4 + Math.sin(a) * rad);
      tg.add(tr, lf);
    }

    // 4. REAL 48-STEP PILGRIMAGE STAIRWAY (Alipiri / Tirumala Style!) FROM Z = +22.5 UP TO SUMMIT Z = +7.5 (Y = 16.1)!
    const stepCount = 32;
    const stepStartZ = 22.8;
    const stepEndZ = 7.4;
    const stepTopY = 16.1;
    const stepGeo = this._boxGeo(4.8, 0.52, 0.62);
    const stepInst = new THREE.InstancedMesh(stepGeo, this.mat.templeStepStone, stepCount);
    const sdummy = new THREE.Object3D();
    for (let s = 0; s < stepCount; s++) {
      const frac = s / (stepCount - 1);
      sdummy.position.set(0, 0.28 + frac * (stepTopY - 0.35), THREE.MathUtils.lerp(stepStartZ, stepEndZ, frac));
      sdummy.updateMatrix();
      stepInst.setMatrixAt(s, sdummy.matrix);
    }
    stepInst.instanceMatrix.needsUpdate = true;
    tg.add(stepInst);

    // Side Gold-White Staircase Railings & Support Ramp
    const stairLen = Math.hypot(stepStartZ - stepEndZ, stepTopY);
    const stairPitch = Math.atan2(stepTopY, stepStartZ - stepEndZ);
    [-2.55, 2.55].forEach((rx) => {
      const rail = new THREE.Mesh(this._boxGeo(0.28, 0.9, stairLen), this.mat.templeSaffron);
      rail.position.set(rx, stepTopY / 2 + 0.55, (stepStartZ + stepEndZ) / 2);
      rail.rotation.x = stairPitch;
      const goldTop = new THREE.Mesh(this._boxGeo(0.32, 0.16, stairLen), this.mat.templeGold);
      goldTop.position.set(rx, stepTopY / 2 + 1.02, (stepStartZ + stepEndZ) / 2);
      goldTop.rotation.x = stairPitch;
      tg.add(rail, goldTop);
    });

    // Foothill Pilgrimage Entry Arch ("ALIPIRI STEPS • OM NAMO VENKATESAYA") + Mid-Hill Gopuram Gate!
    const makeStepArch = (ay, az, title, sub) => {
      const ag = new THREE.Group();
      ag.position.set(0, ay, az);
      const al = new THREE.Mesh(this._boxGeo(0.65, 4.4, 0.65), this.mat.templeGold);
      al.position.set(-2.9, 2.2, 0);
      const ar = al.clone();
      ar.position.x = 2.9;
      const top = new THREE.Mesh(this._boxGeo(6.8, 1.35, 1.05), this.mat.templeRedStripe);
      top.position.set(0, 4.6, 0);
      const brd = this._makeBuildingBoard(title, sub, "#991b1b", "#fde047", 6.2, 1.1);
      brd.position.set(0, 4.6, 0.56);
      ag.add(al, ar, top, brd);
      tg.add(ag);
    };
    makeStepArch(0.05, 23.2, "GOVINDA • STEP WAY", "SRI VENKATESWARA HILL TEMPLE");
    makeStepArch(8.0, 15.2, "OM NAMO VENKATESAYA", "HALFWAY DARSHAN GATE");

    // 10 ANIMATED DEVOTEES CLIMBING UP & WALKING DOWN THE MOUNTAIN STEPS!
    const devotees = [];
    const devMats = [this.mat.templeSaffron, this.mat.wallWhite, this.mat.girlDressPink, this.mat.girlDressYellow, this.mat.wallBlue];
    for (let d = 0; d < 10; d++) {
      const dev = this._createCharacter({ shirtMat: devMats[d % devMats.length], pantsMat: this.mat.wallWhite, scale: 0.9 });
      tg.add(dev);
      devotees.push({
        mesh: dev,
        goingUp: d % 2 === 0,
        laneX: d % 2 === 0 ? -1.1 + (d % 3) * 0.35 : 1.1 - (d % 3) * 0.35,
        phase: d * 0.1,
        speed: 0.055 + (d % 3) * 0.012
      });
    }

    // 5. WINDING MOUNTAIN GHAT ROAD FOR VEHICLES (Right Side curving smoothly from Foothills -> Summit Ghat Dropoff!)
    const ghatPts = [
      new THREE.Vector3(0, 0.2, 54),
      new THREE.Vector3(0, 0.2, 26),
      new THREE.Vector3(16, 2.0, 22),
      new THREE.Vector3(24, 6.2, 6),
      new THREE.Vector3(22, 11.2, -14),
      new THREE.Vector3(12, 15.8, -16),
      new THREE.Vector3(11.5, 16.3, -4)
    ];
    const ghatCurve = new THREE.CatmullRomCurve3(ghatPts, false, "catmullrom", 0.4);
    // Render paved Ghat Road ribbon using clean segments along the spline!
    const ghatSegs = 28;
    const ghatBox = this._boxGeo(4.6, 0.32, 3.8);
    const ghatInst = new THREE.InstancedMesh(ghatBox, this.mat.road, ghatSegs);
    const gdummy = new THREE.Object3D();
    for (let i = 0; i < ghatSegs; i++) {
      const u = (i + 0.5) / ghatSegs;
      const pt = ghatCurve.getPointAt(u);
      const nxt = ghatCurve.getPointAt(Math.min(1, u + 0.02));
      gdummy.position.copy(pt);
      gdummy.lookAt(nxt);
      gdummy.updateMatrix();
      ghatInst.setMatrixAt(i, gdummy.matrix);
    }
    ghatInst.instanceMatrix.needsUpdate = true;
    tg.add(ghatInst);

    // 3 LIVE PILGRIM VEHICLES (APSRTC Tirumala Ghat Bus, Car & Yellow Auto) climbing & descending the Mountain Ghat Road!
    const ghatVehicles = [
      { mesh: this._makeVehicleMesh(true, false, 0xdc2626, true), phase: 0.0, speed: 0.048 },
      { mesh: this._makeVehicleMesh(false, false, 0xf8fafc, true), phase: 0.34, speed: 0.062 },
      { mesh: this._makeRealAutoMesh(true, true), phase: 0.68, speed: 0.056 }
    ];
    ghatVehicles.forEach((gv) => tg.add(gv.mesh));

    // 6. 🛕 BIG REAL-STYLE GRAND TEMPLE ON THE SUMMIT (Y = 16.3, Z = -4)!
    const summitTemple = new THREE.Group();
    summitTemple.position.set(0, 16.3, -4);

    // Outer Red-and-White Striped Prakaram Compound Walls
    const pWallL = new THREE.Mesh(this._boxGeo(0.65, 2.8, 17.6), this.mat.wallWhite);
    pWallL.position.set(-9.2, 1.4, 0);
    const pWallR = pWallL.clone();
    pWallR.position.x = 9.2;
    const pWallB = new THREE.Mesh(this._boxGeo(19.0, 2.8, 0.65), this.mat.wallWhite);
    pWallB.position.set(0, 1.4, -8.8);
    for (let s = -7.2; s <= 7.2; s += 2.4) {
      const rsL = new THREE.Mesh(this._boxGeo(0.72, 2.75, 0.45), this.mat.templeRedStripe);
      rsL.position.set(-9.2, 1.4, s);
      const rsR = rsL.clone();
      rsR.position.x = 9.2;
      summitTemple.add(rsL, rsR);
    }

    // Grand Pillared Maha Mandapam + Garbhagriha Sanctum
    const mandapam = new THREE.Mesh(this._boxGeo(11.6, 4.4, 9.4), this.mat.wallWhite);
    mandapam.position.set(0, 2.2, -2.8);
    for (let px = -5.2; px <= 5.2; px += 2.6) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 4.3, 8), this.mat.templeGold);
      pillar.position.set(px, 2.2, 2.2);
      summitTemple.add(pillar);
    }

    // Towering 4-Tier Golden ANANDA NILAYAM VIMANA GOPURAM + Shikhara Dome + 3 Golden Kalasams!
    const vT1 = new THREE.Mesh(this._boxGeo(9.4, 1.8, 7.8), this.mat.templeGold);
    vT1.position.set(0, 5.2, -3.2);
    const vT2 = new THREE.Mesh(this._boxGeo(7.4, 1.65, 6.2), this.mat.templeGold);
    vT2.position.set(0, 6.9, -3.2);
    const vT3 = new THREE.Mesh(this._boxGeo(5.4, 1.5, 4.6), this.mat.templeGold);
    vT3.position.set(0, 8.45, -3.2);
    const vT4 = new THREE.Mesh(this._boxGeo(3.6, 1.3, 3.2), this.mat.templeGold);
    vT4.position.set(0, 9.8, -3.2);
    const vDome = new THREE.Mesh(new THREE.SphereGeometry(2.35, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.templeGold);
    vDome.position.set(0, 10.4, -3.2);
    const vKalasam = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.65, 8), this.mat.templeGold);
    vKalasam.position.set(0, 13.4, -3.2);

    // Towering Front 5-Tier RAJA GOPURAM Entrance Gate facing the Pilgrimage Steps!
    const rgBase = new THREE.Mesh(this._boxGeo(8.2, 4.4, 2.4), this.mat.wallWhite);
    rgBase.position.set(0, 2.2, 7.6);
    const rgDoor = new THREE.Mesh(this._boxGeo(3.2, 3.2, 2.55), this.mat.cinemaObsidian);
    rgDoor.position.set(0, 1.6, 7.6);
    const rgT1 = new THREE.Mesh(this._boxGeo(7.2, 1.4, 2.0), this.mat.templeSaffron);
    rgT1.position.set(0, 5.05, 7.6);
    const rgT2 = new THREE.Mesh(this._boxGeo(5.8, 1.3, 1.7), this.mat.templeGold);
    rgT2.position.set(0, 6.35, 7.6);
    const rgT3 = new THREE.Mesh(this._boxGeo(4.4, 1.2, 1.4), this.mat.templeSaffron);
    rgT3.position.set(0, 7.55, 7.6);
    const rgCrown = new THREE.Mesh(this._boxGeo(3.6, 0.9, 1.2), this.mat.templeGold);
    rgCrown.position.set(0, 8.55, 7.6);
    [-1.4, 0, 1.4].forEach((kx) => {
      const gk = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.95, 6), this.mat.templeGold);
      gk.position.set(kx, 9.4, 7.6);
      summitTemple.add(gk);
    });

    // Sacred Glowing White-and-Red TIRUNAMAM on Front Raja Gopuram + Tall Golden Dwajasthambam Flag Pillar!
    const tNamL = new THREE.Mesh(this._boxGeo(0.3, 1.35, 0.16), this.mat.wallWhite);
    tNamL.position.set(-0.55, 5.2, 8.7);
    const tNamR = tNamL.clone();
    tNamR.position.x = 0.55;
    const tNamB = new THREE.Mesh(this._boxGeo(1.4, 0.3, 0.16), this.mat.wallWhite);
    tNamB.position.set(0, 4.6, 8.7);
    const tNamC = new THREE.Mesh(this._boxGeo(0.28, 1.25, 0.18), this.mat.oyoRed);
    tNamC.position.set(0, 5.25, 8.74);

    const dwaja = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 8.2, 8), this.mat.templeGold);
    dwaja.position.set(0, 4.1, 4.2);

    // 6 Glowing Brass Temple Deepam Lamps lining the Courtyard!
    [[-4.2, 4.5], [4.2, 4.5], [-4.2, 9.4], [4.2, 9.4], [-6.8, -1.0], [6.8, -1.0]].forEach(([lx, lz]) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 1.5, 6), this.mat.templeGold);
      stand.position.set(lx, 0.75, lz);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), this.mat.templeLampGlow);
      flame.position.set(lx, 1.65, lz);
      summitTemple.add(stand, flame);
    });

    // 7. ✨ RADIANT DIVINE GOLDEN GLOWING EFFECTS FROM THE GRAND TEMPLE!
    //    (Rotating Golden Sun-Halo Mandala behind the Vimana + Upward Divine Sky Light Beams + Pulsing Aura Dome!)
    const divineHalo = new THREE.Group();
    divineHalo.position.set(0, 11.4, -3.2);
    const haloRing = new THREE.Mesh(new THREE.RingGeometry(3.4, 4.8, 24), this.mat.divineHaloGlow);
    divineHalo.add(haloRing);
    for (let r = 0; r < 12; r++) {
      const ra = (r / 12) * Math.PI * 2;
      const ray = new THREE.Mesh(this._boxGeo(0.32, 3.6, 0.1), this.mat.divineGoldGlow);
      ray.position.set(Math.cos(ra) * 5.6, Math.sin(ra) * 5.6, 0);
      ray.rotation.z = ra - Math.PI / 2;
      divineHalo.add(ray);
    }

    // Tall Upward Golden Divine Sky Pillar Beam radiating from the Golden Kalasam high into the sky!
    const divineBeamGeo = new THREE.CylinderGeometry(5.2, 1.2, 36.0, 14, 1, true);
    divineBeamGeo.translate(0, 18.0, 0);
    const divineSkyBeam = new THREE.Mesh(divineBeamGeo, this.mat.divineGoldGlow);
    divineSkyBeam.position.set(0, 11.5, -3.2);

    // Pulsing Golden Divine Energy Dome enveloping the Golden Gopuram!
    const divineAuraSphere = new THREE.Mesh(new THREE.SphereGeometry(6.8, 16, 12), this.mat.divineGoldGlow);
    divineAuraSphere.position.set(0, 8.6, -3.2);

    // Warm Golden PointLight illuminating the Summit Temple on non-low-RAM / Admin HQ!
    if (!this.isLowRam) {
      const templeGlowLight = new THREE.PointLight(0xfde047, 3.2, 42);
      templeGlowLight.position.set(0, 12.5, 2.0);
      summitTemple.add(templeGlowLight);
    }

    const summitSign = this._createNameSign("🛕 SRI VENKATESWARA HILL TEMPLE", "OM NAMO VENKATESAYA • STEP WAY & GHAT ROAD", true);
    summitSign.position.set(0, 17.5, -3.2);

    summitTemple.add(
      pWallL, pWallR, pWallB, mandapam,
      vT1, vT2, vT3, vT4, vDome, vKalasam,
      rgBase, rgDoor, rgT1, rgT2, rgT3, rgCrown,
      tNamL, tNamR, tNamB, tNamC, dwaja,
      divineHalo, divineSkyBeam, divineAuraSphere, summitSign
    );
    tg.add(summitTemple);

    // Clickable Hitbox for the Entire Hilltop Temple Mountain
    const htHitbox = new THREE.Mesh(this._boxGeo(44, 34, 48), this.mat.invisibleHitbox);
    htHitbox.position.set(0, 17, 0);
    htHitbox.userData.plotId = "HILL_TEMPLE";
    tg.add(htHitbox);
    this.plotHitboxes.push(htHitbox);

    this.cityGroup.add(tg);
    this.hillTempleSim = {
      devotees,
      stepStartZ,
      stepEndZ,
      stepTopY,
      ghatCurve,
      ghatVehicles,
      divineHalo,
      divineSkyBeam,
      divineAuraSphere
    };
  }


  _buildArakuLandscape(ringRadius) {
    const ag = new THREE.Group();

    const waterRibbons = [];
    const mistClouds = [];
    const riverRipples = [];

    // Outer mountain ring sits comfortably outside Airport (East), Beach (West), and Both Railway Stations (N & S)
    const minR = ringRadius + 148;
    const outerR = ringRadius + 245;

    // 1. 360° LAYERED ARAKU GREEN FORESTED MOUNTAINS (2 InstancedMeshes = only 2 draw calls!)
    //    Leave a clean scenic Ocean Horizon opening on the West Beach side (angle between 158° and 202°)
    //    while framing the Beach with dramatic green coastal headlands on NW & SW!
    const peakData = [];
    const rockData = [];
    const treeData = [];

    // Ring 1: Closer Lush Green Foothills (42 hills)
    const countInner = this.isLowRam ? 36 : 48;
    for (let i = 0; i < countInner; i++) {
      const ang = (i / countInner) * Math.PI * 2;
      const deg = (ang * 180) / Math.PI;
      if (deg > 158 && deg < 202) continue; // Keep West Ocean open for Golden Beach!

      const rad = minR + ((i * 37) % 34);
      const px = Math.cos(ang) * rad;
      const pz = Math.sin(ang) * rad;
      const h = 32 + ((i * 19) % 28);
      const w = 26 + ((i * 13) % 20);
      peakData.push({ x: px, y: h * 0.42, z: pz, sx: w, sy: h, sz: w * 0.92, ry: i * 0.7 });

      // Scatter lush Araku pine trees on lower slopes of foothills
      const treesPerHill = this.isLowRam ? 3 : 5;
      for (let t = 0; t < treesPerHill; t++) {
        const ta = ang + (t - 2) * 0.045;
        const tr = rad - w * 0.55 - (t % 2) * 6;
        treeData.push({
          x: Math.cos(ta) * tr,
          y: 2.2 + (t % 3) * 1.4,
          z: Math.sin(ta) * tr,
          s: 1.35 + (t % 3) * 0.45
        });
      }
    }

    // Ring 2: Towering Araku Background Mountain Peaks & Rocky Ridges (56 massive peaks!)
    const countOuter = this.isLowRam ? 44 : 60;
    for (let i = 0; i < countOuter; i++) {
      const ang = (i / countOuter) * Math.PI * 2 + 0.05;
      const deg = (ang * 180) / Math.PI;
      if (deg > 162 && deg < 198) continue; // Open sunset ocean horizon on West!

      const rad = outerR + ((i * 43) % 68);
      const px = Math.cos(ang) * rad;
      const pz = Math.sin(ang) * rad;
      const h = 62 + ((i * 29) % 58);
      const w = 44 + ((i * 17) % 34);
      if (i % 3 === 0) {
        rockData.push({ x: px, y: h * 0.44, z: pz, sx: w, sy: h, sz: w * 0.88, ry: i * 1.1 });
      } else {
        peakData.push({ x: px, y: h * 0.44, z: pz, sx: w, sy: h, sz: w * 0.95, ry: i * 0.9 });
      }
    }

    const dummy = new THREE.Object3D();
    const hillGeo = new THREE.ConeGeometry(1.0, 1.0, 7);
    const hillInst = new THREE.InstancedMesh(hillGeo, this.mat.arakuDeepGreen, peakData.length);
    peakData.forEach((p, idx) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.rotation.set(0, p.ry, 0);
      dummy.updateMatrix();
      hillInst.setMatrixAt(idx, dummy.matrix);
    });
    hillInst.instanceMatrix.needsUpdate = true;
    ag.add(hillInst);

    const rockGeo = new THREE.DodecahedronGeometry(0.75, 0);
    const rockInst = new THREE.InstancedMesh(rockGeo, this.mat.arakuRockGrey, rockData.length);
    rockData.forEach((p, idx) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.rotation.set(0, p.ry, 0);
      dummy.updateMatrix();
      rockInst.setMatrixAt(idx, dummy.matrix);
    });
    rockInst.instanceMatrix.needsUpdate = true;
    ag.add(rockInst);

    const pineGeo = new THREE.ConeGeometry(1.7, 5.2, 5);
    const pineInst = new THREE.InstancedMesh(pineGeo, this.mat.arakuForestGreen, treeData.length);
    treeData.forEach((tr, idx) => {
      dummy.position.set(tr.x, tr.y, tr.z);
      dummy.scale.setScalar(tr.s);
      dummy.rotation.set(0, idx * 0.8, 0);
      dummy.updateMatrix();
      pineInst.setMatrixAt(idx, dummy.matrix);
    });
    pineInst.instanceMatrix.needsUpdate = true;
    ag.add(pineInst);

    // 2. 💧 3 DRAMATIC ARAKU CLIFF WATERFALLS WITH ANIMATED CASCADING WHITE WATER & SPLASH POOLS!
    const buildWaterfallCliff = (wx, wz, rotY, height = 42) => {
      const wf = new THREE.Group();
      wf.position.set(wx, 0, wz);
      wf.rotation.y = rotY;

      // Dark Wet Rocky Cliff Behind Waterfall + Lush Green Mountain Framing Both Sides
      const cliff = new THREE.Mesh(new THREE.BoxGeometry(16, height, 10), this.mat.arakuCliffDark);
      cliff.position.set(0, height / 2, -5.5);
      const flankL = new THREE.Mesh(new THREE.ConeGeometry(16, height * 1.18, 7), this.mat.arakuLushHill);
      flankL.position.set(-14, height * 0.55, -6);
      const flankR = new THREE.Mesh(new THREE.ConeGeometry(15, height * 1.12, 7), this.mat.arakuDeepGreen);
      flankR.position.set(14, height * 0.52, -6);
      wf.add(cliff, flankL, flankR);

      // Continuous Shimmering Blue Waterfall Sheet
      const chute = new THREE.Mesh(new THREE.PlaneGeometry(6.8, height - 2), this.mat.waterfallBlue);
      chute.position.set(0, height / 2, -0.35);
      wf.add(chute);

      // 5 Animated Falling White Foam Ribbons plunging continuously down the cliff!
      const ribGeo = new THREE.PlaneGeometry(1.55, 5.4);
      for (let r = 0; r < 5; r++) {
        const rib = new THREE.Mesh(ribGeo, this.mat.waterfallFoam);
        const rx = -2.2 + (r % 3) * 2.2;
        rib.position.set(rx, height * 0.5, -0.1);
        wf.add(rib);
        waterRibbons.push({ mesh: rib, minY: 2.8, maxY: height - 3.5, speed: 15 + (r % 3) * 3.5, phase: r * 0.22 });
      }

      // Turquoise Plunge Pool + Foaming Mist Ring at the Waterfall Base!
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 12.2, 0.28, 16), this.mat.riverBlue);
      pool.position.set(0, 0.14, 7.5);
      const mistFoam = new THREE.Mesh(new THREE.RingGeometry(2.5, 6.2, 16), this.mat.waterfallFoam);
      mistFoam.rotation.x = -Math.PI / 2;
      mistFoam.position.set(0, 0.34, 4.2);
      wf.add(pool, mistFoam);

      ag.add(wf);
    };

    const wfDist = ringRadius + 138;
    // Waterfall 1: North-East Araku Gorge (visible behind North Station & Airport!)
    buildWaterfallCliff(wfDist * 0.55, -wfDist * 0.88, -0.45, 48);
    // Waterfall 2: North-West Mountain Ridge (cascading right behind the Hollow Railway Tunnel!)
    buildWaterfallCliff(-wfDist * 0.65, -wfDist * 0.88, 0.55, 44);
    // Waterfall 3: South-West Coastal Mountain Cliff (flowing straight into the Ocean beside the Beach!)
    buildWaterfallCliff(-wfDist * 0.72, wfDist * 0.78, 2.35, 42);

    // 3. 🌊 WINDING FLOWING BLUE VALLEY RIVERS (Connecting Araku Waterfalls -> Flowing Around Valley -> Into West Ocean!)
    const buildValleyRiver = (pts, width = 10.5) => {
      const rCurve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.45);
      const segs = 32;
      const rGeo = new THREE.PlaneGeometry(width, (rCurve.getLength() / segs) * 1.18);
      rGeo.rotateX(-Math.PI / 2);
      const rInst = new THREE.InstancedMesh(rGeo, this.mat.riverBlue, segs);
      for (let i = 0; i < segs; i++) {
        const u = (i + 0.5) / segs;
        const p = rCurve.getPointAt(u);
        const tan = rCurve.getTangentAt(u);
        dummy.position.set(p.x, 0.06, p.z);
        dummy.rotation.set(0, Math.atan2(tan.x, tan.z), 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        rInst.setMatrixAt(i, dummy.matrix);
      }
      rInst.instanceMatrix.needsUpdate = true;
      ag.add(rInst);

      // Animated White Flowing Water Sparkles drifting along the river!
      const ripGeo = new THREE.PlaneGeometry(width * 0.38, 2.6);
      ripGeo.rotateX(-Math.PI / 2);
      for (let k = 0; k < 6; k++) {
        const rip = new THREE.Mesh(ripGeo, this.mat.waterfallFoam);
        ag.add(rip);
        riverRipples.push({ mesh: rip, curve: rCurve, phase: k / 6, speed: 0.075 });
      }
    };

    // North Valley River: Flows from NE Araku Waterfall -> behind North Railway Station -> NW Waterfall -> into West Ocean!
    const nrZ = -(ringRadius + 96);
    buildValleyRiver([
      new THREE.Vector3(wfDist * 0.52, 0, -wfDist * 0.8),
      new THREE.Vector3(45, 0, nrZ - 14),
      new THREE.Vector3(0, 0, nrZ - 18),
      new THREE.Vector3(-wfDist * 0.55, 0, -wfDist * 0.78),
      new THREE.Vector3(-(ringRadius + 115), 0, -68),
      new THREE.Vector3(-(ringRadius + 145), 0, -40)
    ], 11.0);

    // South Valley River: Flows from SE Araku Hills -> behind South Railway Station -> SW Waterfall -> into West Ocean!
    const srZ = ringRadius + 96;
    buildValleyRiver([
      new THREE.Vector3(wfDist * 0.58, 0, wfDist * 0.75),
      new THREE.Vector3(42, 0, srZ + 12),
      new THREE.Vector3(-12, 0, srZ + 16),
      new THREE.Vector3(-wfDist * 0.65, 0, wfDist * 0.72),
      new THREE.Vector3(-(ringRadius + 122), 0, 56)
    ], 10.5);

    // 4. ☁️ MISTY ARAKU VALLEY CLOUDS WRAPPING AROUND THE MOUNTAIN PEAKS (Exact Araku Drone Reel Vibe!)
    const mistPuffGeo = new THREE.DodecahedronGeometry(9.5, 0);
    const mistCount = this.isLowRam ? 12 : 18;
    for (let m = 0; m < mistCount; m++) {
      const ang = (m / mistCount) * Math.PI * 2;
      const rad = minR + 14 + (m % 3) * 28;
      const mg = new THREE.Group();
      const p1 = new THREE.Mesh(mistPuffGeo, this.mat.valleyMist);
      const p2 = new THREE.Mesh(mistPuffGeo, this.mat.valleyMist);
      p2.position.set(8.5, 0.8, 1.5);
      p2.scale.set(0.85, 0.7, 0.85);
      const p3 = new THREE.Mesh(mistPuffGeo, this.mat.valleyMist);
      p3.position.set(-8.0, -0.4, -1.2);
      p3.scale.set(0.75, 0.65, 0.8);
      mg.add(p1, p2, p3);
      mg.scale.set(1.6, 0.42, 1.25);
      const y = 34 + (m % 4) * 10;
      mg.position.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
      ag.add(mg);
      mistClouds.push({ mesh: mg, ang, rad, y, speed: 0.018 + (m % 3) * 0.008 });
    }

    this.cityGroup.add(ag);
    this.arakuSim = { waterRibbons, mistClouds, riverRipples };
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
    const isCustom = Boolean(data?.isCustomZone || plotId.startsWith("zone_"));
    const plotIndex = isCustom ? -1 : parseInt(plotId.replace("plot_", ""), 10) - 1;
    if (!isCustom && (isNaN(plotIndex) || plotIndex < 0)) return;

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
      this.theaterDiscos = this.theaterDiscos.filter((t) => t.plotId !== plotId);
      this.heroAudiSlots = this.heroAudiSlots.filter((a) => a.plotId !== plotId);
      this.blockedRoadZones = this.blockedRoadZones.filter((z) => z.plotId !== plotId);
    }

    const reqSize = data?.status === "built" ? getRequiredSize(data.buildingType) : 1;
    if ((data && data.status === "occupied_by_landmark") || (reqSize === 1 && this.landmarkCoveredPlots.has(plotId))) {
      const emptyPlaceholder = new THREE.Group();
      this.plotsGroup.add(emptyPlaceholder);
      this.plotMeshes.set(plotId, emptyPlaceholder);
      return;
    }

    const customWorldX = isCustom
      ? (data.zone === "beach" ? this.beachX : this.airportX) + (data.offsetX || 0)
      : 0;
    const customWorldZ = isCustom ? (data.offsetZ || 0) : 0;
    const pos = isCustom
      ? { x: customWorldX, z: customWorldZ, blockCenterX: customWorldX, blockCenterZ: customWorldZ, rotY: data.customRotY || 0 }
      : this.getPlotPosition(plotIndex);
    const size = data?.status === "built" ? (data.size || reqSize) : 1;
    const isEightPlot = !isCustom && size === 8;
    const isFourPlot = !isCustom && size === 4;
    const isTwoPlot = !isCustom && size === 2;

    const plotGroup = new THREE.Group();
    if (isCustom) {
      plotGroup.position.set(customWorldX, 0.08, customWorldZ);
    } else if (isEightPlot) {
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
      this._emptyPlotCoords.delete(plotId);
      plotGroup.position.set(pos.blockCenterX, 0.08, pos.blockCenterZ);
    } else if (isTwoPlot) {
      this._emptyPlotCoords.delete(plotId);
      const twoInfo = getTwoPlotGroup(plotId);
      const rowZ = pos.blockCenterZ + (twoInfo.isNorthRow ? -this.PLOT_SIZE / 2 : this.PLOT_SIZE / 2);
      plotGroup.position.set(pos.blockCenterX, 0.08, rowZ);
    } else {
      plotGroup.position.set(pos.x, 0.08, pos.z);
    }

    const effEight = isEightPlot || (isCustom && size === 8);
    const effFour = isFourPlot || (isCustom && size === 4);
    const effTwo = isTwoPlot || (isCustom && size === 2);

    let hitbox;
    if (effEight || effFour) {
      const hitW = effEight ? this.EIGHT_PLOT_WIDTH : this.BLOCK_FOOTPRINT - 0.2;
      hitbox = new THREE.Mesh(
        this._boxGeo(hitW, data?.buildingType === "hotel_oyo" ? 30.0 : 12.0, this.BLOCK_FOOTPRINT - 0.2),
        this.mat.invisibleHitbox
      );
      hitbox.position.y = data?.buildingType === "hotel_oyo" ? 15.0 : 6.0;
    } else if (effTwo) {
      hitbox = new THREE.Mesh(
        this._boxGeo(this.BLOCK_FOOTPRINT - 0.2, 8.5, this.PLOT_SIZE - 0.2),
        this.mat.invisibleHitbox
      );
      hitbox.position.y = 4.25;
    } else {
      hitbox = new THREE.Mesh(this.geo.hit1, this.mat.invisibleHitbox);
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
      effEight || effFour
        ? new THREE.Mesh(
            this._boxGeo(
              effEight ? this.EIGHT_PLOT_WIDTH + 0.8 : this.BLOCK_FOOTPRINT - 0.2,
              effEight ? 0.26 : 0.14,
              this.BLOCK_FOOTPRINT + (effEight ? 0.4 : -0.2)
            ),
            lotBaseMat
          )
        : effTwo
        ? new THREE.Mesh(
            this._boxGeo(this.BLOCK_FOOTPRINT - 0.2, 0.14, this.PLOT_SIZE - 0.2),
            lotBaseMat
          )
        : new THREE.Mesh(this.geo.base1, lotBaseMat);
    lotBase.position.y = effEight ? 0.13 : 0.07;
    if (isCustom && (effEight || effFour || effTwo)) {
      lotBase.rotation.y = pos.rotY;
      hitbox.rotation.y = pos.rotY;
    }
    plotGroup.add(lotBase);

    let buildingObj = null;

    if (!data || data.status !== "built" || data.buildingType === "empty") {
      buildingObj = this._buildEmptyPlotMesh();
      this._emptyPlotCoords.set(plotId, { grp: plotGroup, x: plotGroup.position.x, z: plotGroup.position.z });
    } else if (isEightPlot) {
      this._emptyPlotCoords.delete(plotId);
      if (data.buildingType === "imax_theater") {
        buildingObj = this._buildEightPlotIMAXTheater(plotId, data.ownerName);
        const topLabel = data.ownerName || "SHERU BHAI IMAX";
        const sign = this._createNameSign(topLabel, "🎬 ఐమాక్స్ 3D • 8-PLOT GIANT IMAX DOME", true);
        sign.position.set(0, 13.2, 0);
        buildingObj.add(sign);
      } else if (data.buildingType === "mahindra_showroom") {
        buildingObj = this._buildEightPlotMahindraShowroom(plotId, data.ownerName);
        const topLabel = data.ownerName || "MAHINDRA SHOWROOM";
        const sign = this._createNameSign(topLabel, "🚙 మహీంద్రా షోరూమ్ • 8-PLOT SUV SHOWROOM", true);
        sign.position.set(0, 11.6, 0);
        buildingObj.add(sign);
      } else if (data.buildingType === "bmw_showroom") {
        buildingObj = this._buildEightPlotBMWShowroom(plotId, data.ownerName);
        const topLabel = data.ownerName || "BMW SHOWROOM";
        const sign = this._createNameSign(topLabel, "🏎️ బిఎండబ్ల్యూ • 8-PLOT BMW LUXURY SHOWROOM", true);
        sign.position.set(0, 11.8, 0);
        buildingObj.add(sign);
      } else if (data.buildingType === "movie_theater") {
        buildingObj = this._buildEightPlotMovieTheater(plotId, data.ownerName);
        const topLabel = data.ownerName || "SHERU BHAI MULTIPLEX";
        const sign = this._createNameSign(topLabel, "🎭 మూవీ థియేటర్ • 8-PLOT REAL MULTIPLEX", true);
        sign.position.set(0, 12.8, 0);
        buildingObj.add(sign);
      } else if (data.buildingType === "audi_showroom") {
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
      this._emptyPlotCoords.delete(plotId);
      if (isCustom && size === 8) {
        buildingObj = data.buildingType === "imax_theater"
          ? this._buildEightPlotIMAXTheater(plotId, data.ownerName)
          : data.buildingType === "mahindra_showroom"
          ? this._buildEightPlotMahindraShowroom(plotId, data.ownerName)
          : data.buildingType === "bmw_showroom"
          ? this._buildEightPlotBMWShowroom(plotId, data.ownerName)
          : data.buildingType === "movie_theater"
          ? this._buildEightPlotMovieTheater(plotId, data.ownerName)
          : data.buildingType === "audi_showroom"
          ? this._buildEightPlotAudiShowroom(plotId, data.ownerName)
          : this._buildEightPlotCricketStadium(plotId);
      } else if (isCustom && size === 4) {
        buildingObj = this._buildFourPlotLandmark(data.buildingType, plotId, data.ownerName);
      } else if (isCustom && size === 2) {
        buildingObj = this._buildTwoPlotBuilding(data.buildingType, plotId, data.ownerName);
      } else {
        buildingObj = this._buildOnePlotBuilding(data.buildingType, data.ownerName, plotId);
      }
      buildingObj.rotation.y = pos.rotY;

      if (data.ownerName) {
        const subLabel = data.buildingType === "shop" ? "టీ & టిఫిన్ • SHOP" : data.buildingType === "cafe" ? "☕ COFFEE CAFE" : data.buildingType === "mobile_shop" ? "📱 MOBILE SHOP • 5G" : data.buildingType === "ice_cream_shop" ? "🍨 ICE CREAM PARLOUR" : data.buildingType === "medical_shop" ? "💊 24/7 MEDICAL SHOP" : data.buildingType === "veg_shop" ? "🥬 FRESH VEGETABLES" : data.buildingType === "beach_villa" ? "🏖️ BEACH HOUSE VILLA" : "";
        const sign = this._createNameSign(data.ownerName, subLabel, false);
        sign.position.set(0, buildingObj.userData.labelY || 5.2, 0);
        plotGroup.add(sign);
        this.plotSigns.push({ plotId, sprite: sign, x: pos.x, z: pos.z });
      }
    }

    plotGroup.add(buildingObj);
    if (this.shadowsEnabled) this._applyShadowFlags(plotGroup);
    if (!animateBuild) this._freezeStaticSubtree(plotGroup);

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
      iti_college: "ఐటిఐ కాలేజ్ • ITI TECHNICAL COLLEGE",
      movie_theater: "మూవీ థియేటర్ • IMAX MULTIPLEX",
      dmart: "డి-మార్ట్ • DAILY DISCOUNTS • DAILY SAVINGS",
      imax_theater: "ఐమాక్స్ 3D • GIANT SCREEN IMAX DOME",
      beach_villa_2: "🏖️ LUXURY MEGA BEACH VILLA",
      mobile_showroom: "📱 మొబైల్ షోరూమ్ • 5G SMARTPHONES",
      tirumala_temple: "🛕 తిరుమల శ్రీ వెంకటేశ్వర స్వామి దేవస్థానం",
      hotel_oyo: "🏨 20-FLOOR OYO ROOMS • LUXURY SUITES",
      hostel: "🏢 బాయ్స్ & గర్ల్స్ హాస్టల్ • AC & WIFI",
      wine_shop: "🍾 రాయల్ వైన్స్ • WINES & SPIRITS",
      city_park: "🌳 సెంట్రల్ సిటీ పార్క్ • FOUNTAIN & GARDEN",
      library: "📚 సెంట్రల్ లైబ్రరీ • PUBLIC LIBRARY",
      swimming_pool: "🏊 ఒలింపిక్ స్విమ్మింగ్ పూల్ • CLUB",
      mahindra_showroom: "🚙 మహీంద్రా షోరూమ్ • THAR & XUV700",
      bmw_showroom: "🏎️ బిఎండబ్ల్యూ • SHEER DRIVING PLEASURE"
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
  _buildOnePlotBuilding(type, ownerName = "", plotId = null) {
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
    if (type === "medical_shop") {
      // 💊 1-PLOT 24/7 MEDICAL & PHARMACY SHOP (Glowing + Cross, Backlit Medicine Shelves & Animated Boys Walking Inside!)
      const body = new THREE.Mesh(this._boxGeo(5.2, 3.2, 4.4), this.mat.wallWhite);
      body.position.set(0, 1.65, -0.35);
      const medBand = new THREE.Mesh(this._boxGeo(5.45, 0.88, 4.65), this.mat.medGreen);
      medBand.position.set(0, 3.55, -0.35);
      const glowTrim = new THREE.Mesh(this._boxGeo(5.52, 0.16, 4.72), this.mat.medCrossGlow);
      glowTrim.position.set(0, 3.06, -0.35);

      // Clear Glass Storefront showing Backlit Pharmacy Medicine Racks & Counter!
      const frontGlass = new THREE.Mesh(this._boxGeo(4.2, 2.2, 0.14), this.mat.glass);
      frontGlass.position.set(0, 1.32, 1.88);
      const medCounter = new THREE.Mesh(this._boxGeo(3.4, 0.95, 0.7), this.mat.medGreen);
      medCounter.position.set(0, 0.62, 0.55);
      const medShelf = new THREE.Mesh(this._boxGeo(4.0, 2.0, 0.35), this.mat.wallCream);
      medShelf.position.set(0, 1.45, -1.65);

      // Giant Glowing 3D Medical "+" Cross Emblem Mounted on the Roof!
      const crossV = new THREE.Mesh(this._boxGeo(0.58, 1.85, 0.32), this.mat.medCrossGlow);
      crossV.position.set(0, 5.05, 0.2);
      const crossH = new THREE.Mesh(this._boxGeo(1.85, 0.58, 0.32), this.mat.medCrossGlow);
      crossH.position.set(0, 5.05, 0.2);

      const rawMed = (ownerName || "24/7").replace(/^@/, "").trim().toUpperCase();
      const medTitle = rawMed.includes("MEDICAL") || rawMed.includes("PHARMA") ? rawMed : `${rawMed.slice(0, 9)} MEDICALS`;
      const medBoard = this._makeBuildingBoard(medTitle, "24/7 PHARMACY • MEDICINES", "#059669", "#ffffff", 5.2, 0.82);
      medBoard.position.set(0, 3.55, 2.02);

      // 🚶‍♂️ ANIMATED BOYS WALKING STRAIGHT UP AND ENTERING INSIDE THE MEDICAL SHOP!
      const actorKey = plotId || "BEACH_MED_DEFAULT";
      const boy1 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.92 });
      const boy2 = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.darkPants, scale: 0.92 });
      g.add(boy1, boy2);
      this.landmarkActors.push({ plotId: actorKey, mesh: boy1, mode: "enter_z", baseX: -0.55, startZ: 3.1, endZ: 1.25, speed: 0.44, phase: 0.0 });
      this.landmarkActors.push({ plotId: actorKey, mesh: boy2, mode: "enter_z", baseX: 0.55, startZ: 3.1, endZ: 1.25, speed: 0.4, phase: 0.5 });

      g.add(body, medBand, glowTrim, frontGlass, medCounter, medShelf, crossV, crossH, medBoard);
      g.userData.labelY = 7.2;
      return g;
    }

    if (type === "ice_cream_shop") {
      // 🍨 1-PLOT ICE CREAM PARLOUR (For @_ur_bunny_108_! Giant 3D Swirl Cone Roof + Pastel Creamery!)
      const body = new THREE.Mesh(this._boxGeo(5.2, 3.2, 4.4), this.mat.iceCreamWhite);
      body.position.set(0, 1.65, -0.35);
      const pinkBand = new THREE.Mesh(this._boxGeo(5.45, 0.85, 4.65), this.mat.icePink);
      pinkBand.position.set(0, 3.55, -0.35);
      const mintTrim = new THREE.Mesh(this._boxGeo(5.52, 0.22, 4.72), this.mat.iceMint);
      mintTrim.position.set(0, 3.05, -0.35);

      // Pastel Awning + Glass Ice Cream Freezer Display!
      const awning = new THREE.Mesh(this._boxGeo(4.8, 0.25, 1.4), this.mat.icePink);
      awning.position.set(0, 2.55, 2.35);
      awning.rotation.x = 0.22;
      const glass = new THREE.Mesh(this._boxGeo(4.0, 2.0, 0.14), this.mat.glass);
      glass.position.set(0, 1.25, 1.88);

      // GIANT 3D MELTING SWIRL ICE CREAM CONE SCULPTURE ON ROOF!
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.1, 10), this.mat.iceWaffle);
      cone.rotation.x = Math.PI;
      cone.position.set(0, 5.0, -0.2);
      const scoop1 = new THREE.Mesh(new THREE.SphereGeometry(0.88, 10, 8), this.mat.icePink);
      scoop1.position.set(0, 6.1, -0.2);
      const scoop2 = new THREE.Mesh(new THREE.SphereGeometry(0.68, 10, 8), this.mat.iceMint);
      scoop2.position.set(0.32, 6.65, -0.2);
      const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.oyoRed);
      cherry.position.set(0.32, 7.38, -0.2);

      const rawIc = (ownerName || "SWEET").replace(/^@/, "").trim().toUpperCase();
      const icBoard = this._makeBuildingBoard(`${rawIc.slice(0, 10)} ICE CREAM`, "CONES • SUNDAES • SHAKES", "#db2777", "#fef08a", 5.2, 0.8);
      icBoard.position.set(0, 3.55, 2.02);

      g.add(body, pinkBand, mintTrim, awning, glass, cone, scoop1, scoop2, cherry, icBoard);
      g.userData.labelY = 8.4;
      return g;
    }

    if (type === "veg_shop") {
      // 🥬 1-PLOT FRESH VEGETABLE SHOP (For @its_me_potti_6348! 3D Veggie Crates & Striped Market Awning!)
      const body = new THREE.Mesh(this._boxGeo(5.2, 3.0, 4.2), this.mat.wallCream);
      body.position.set(0, 1.55, -0.45);
      const roof = new THREE.Mesh(this._boxGeo(5.6, 0.45, 4.8), this.mat.dmartDeepGreen);
      roof.position.set(0, 3.2, -0.4);
      const awning = new THREE.Mesh(this._boxGeo(5.3, 0.22, 1.6), this.mat.dmartBrightGreen);
      awning.position.set(0, 2.65, 2.15);
      awning.rotation.x = 0.25;

      // 3D Wooden Market Display Crates filled with Tomatoes, Greens & Carrots!
      const crateSpecs = [
        { x: -1.6, mat: this.mat.vegTomato },
        { x: 0.0,  mat: this.mat.vegLeafy },
        { x: 1.6,  mat: this.mat.vegCarrot }
      ];
      crateSpecs.forEach((cs) => {
        const box = new THREE.Mesh(this._boxGeo(1.35, 0.72, 1.05), this.mat.wood);
        box.position.set(cs.x, 0.48, 2.05);
        const mound = new THREE.Mesh(this._boxGeo(1.2, 0.34, 0.9), cs.mat);
        mound.position.set(cs.x, 0.96, 2.05);
        g.add(box, mound);
      });

      const rawVg = (ownerName || "FRESH").replace(/^@/, "").trim().toUpperCase();
      const vgBoard = this._makeBuildingBoard(`${rawVg.slice(0, 10)} VEGGIES`, "FRESH FARM VEGETABLES", "#15803d", "#facc15", 5.2, 0.8);
      vgBoard.position.set(0, 3.45, 2.05);

      g.add(body, roof, awning, vgBoard);
      g.userData.labelY = 6.2;
      return g;
    }

    if (type === "mobile_shop") {
      // 📱 1-PLOT FOLLOWER MOBILE SHOP (Glowing Cyan Storefront + Giant 3D Smartphone on Roof + Interior Phone Display!)
      const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.3, 4.4), this.mat.wallWhite);
      body.position.set(0, 1.7, -0.35);

      const topFascia = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.92, 4.7), this.mat.mobileBlue);
      topFascia.position.set(0, 3.65, -0.35);
      const neonTrim = new THREE.Mesh(new THREE.BoxGeometry(5.58, 0.16, 4.76), this.mat.mobileCyanGlow);
      neonTrim.position.set(0, 3.16, -0.35);

      // Panoramic Sky-Reflective Glass Front showing interior smartphone demo counter!
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 0.14), this.mat.glass);
      frontGlass.position.set(0, 1.35, 1.88);
      const counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.95, 0.72), this.mat.mobileBlue);
      counter.position.set(0, 0.62, 0.55);
      // 3 Mini Glowing Display Phones on the Shop Counter!
      [-0.9, 0, 0.9].forEach((mx) => {
        const miniPhone = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.45), this.mat.mobileScreenGlow);
        miniPhone.position.set(mx, 1.14, 0.55);
        g.add(miniPhone);
      });

      // GIANT 3D SMARTPHONE SCULPTURE MOUNTED ON THE SHOP ROOF!
      const phoneGroup = new THREE.Group();
      phoneGroup.position.set(0, 5.25, -0.2);
      phoneGroup.rotation.y = 0.18;
      const phoneFrame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.35, 0.24), this.mat.mobileTitanium);
      const phoneScreen = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.12, 0.08), this.mat.mobileScreenGlow);
      phoneScreen.position.z = 0.11;
      // Glowing colorful app icons on the 3D Smartphone screen!
      const iconCols = [this.mat.wallCoral, this.mat.petrolYellow, this.mat.turf, this.mat.mobileOrange];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const ic = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.05), iconCols[r * 2 + c]);
          ic.position.set(-0.24 + c * 0.48, 0.42 - r * 0.52, 0.16);
          phoneGroup.add(ic);
        }
      }
      // Rear Triple-Lens Camera Island!
      const camBump = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.1), this.mat.cinemaObsidian);
      camBump.position.set(-0.26, 0.65, -0.14);
      phoneGroup.add(phoneFrame, phoneScreen, camBump);

      // Personalized Storefront Mobile Shop Signboard (shows follower's @username!)
      const rawMob = (ownerName || "PRO").replace(/^@/, "").trim().toUpperCase();
      const mobTitle = rawMob.includes("MOBILE") ? rawMob : `${rawMob.slice(0, 10)} MOBILES`;
      const mobBoard = this._makeBuildingBoard(mobTitle, "5G PHONES • REPAIR • COVERS", "#0f172a", "#22d3ee", 5.2, 0.82);
      mobBoard.position.set(0, 3.65, 2.04);

      g.add(body, topFascia, neonTrim, frontGlass, counter, phoneGroup, mobBoard);
      g.userData.labelY = 7.4;
      return g;
    }

    if (type === "beach_villa") {
      // 🏖️ ADDABLE 1-PLOT LUXURY BEACH HOUSE VILLA (Teak Deck + Plunge Pool + Ocean Glass + Balcony + Surfboard!)
      const deck = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.32, 6.2), this.mat.teakWood);
      deck.position.set(0, 0.16, 0);
      const pool = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.36, 1.55), this.mat.water);
      pool.position.set(-0.7, 0.17, 2.05);

      const f1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.45, 3.6), this.mat.wallWhite);
      f1.position.set(0, 1.54, -0.85);
      const teakClad = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.48, 3.7), this.mat.teakWood);
      teakClad.position.set(1.9, 1.54, -0.85);
      const glass1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.9, 0.14), winMat);
      glass1.position.set(-0.6, 1.38, 0.96);
      glass1.userData.isWindow = true;

      const slab = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.24, 4.4), this.mat.wallWhite);
      slab.position.set(0, 2.86, -0.5);
      const f2 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.15, 3.1), this.mat.stuccoIvory);
      f2.position.set(0.3, 4.05, -1.0);
      const glass2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.55, 0.14), winMat);
      glass2.position.set(0.3, 4.0, 0.56);
      glass2.userData.isWindow = true;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.65, 0.1), this.mat.glass);
      rail.position.set(0, 3.3, 1.62);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.24, 3.8), this.mat.slateTrim);
      roof.position.set(0.3, 5.22, -0.9);

      const surf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.85, 0.46), this.mat.studioCyan);
      surf.position.set(2.35, 1.15, 1.95);
      surf.rotation.z = -0.18;
      const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 5), this.mat.wallWhite);
      uPole.position.set(1.85, 1.1, 2.2);
      const uTop = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.34, 8), this.mat.petrolRed);
      uTop.position.set(1.85, 2.0, 2.2);

      g.add(deck, pool, f1, teakClad, glass1, slab, f2, glass2, rail, roof, surf, uPole, uTop);
      g.userData.labelY = 6.8;
      return g;
    }

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

  /**
   * 🎬 CRISP CACHED MOVIE POSTER BILLBOARD (For 8-Plot Movie Theater Facade & Lightbox Kiosks)
   */
  _makeMoviePoster(title, tagline, bgTop, bgBot, accentHex = "#facc15", w = 1.9, h = 2.65) {
    const key = `POSTER|${title}|${tagline}|${bgTop}|${bgBot}`;
    let mat = this.signTexCache.get(key);
    if (!mat) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 360;
      const ctx = c.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 0, 360);
      grad.addColorStop(0, bgTop);
      grad.addColorStop(1, bgBot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 360);

      // Cinematic Poster Border & Spotlight Glow
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, 240, 344);

      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.arc(128, 130, 74, 0, Math.PI * 2);
      ctx.fill();

      // Top "NOW SHOWING" Pill
      ctx.fillStyle = accentHex;
      ctx.fillRect(36, 26, 184, 34);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#09090b";
      ctx.font = "900 18px sans-serif";
      ctx.fillText("NOW SHOWING", 128, 44);

      // Bold Movie Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 44px sans-serif";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#020617";
      ctx.strokeText(title, 128, 182, 220);
      ctx.fillText(title, 128, 182, 220);

      // Tagline & Dolby/IMAX Badge
      ctx.fillStyle = accentHex;
      ctx.font = "800 22px sans-serif";
      ctx.fillText(tagline, 128, 246, 220);

      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(38, 288, 180, 38);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 18px sans-serif";
      ctx.fillText("IMAX 3D • DOLBY", 128, 308);

      const tex = new THREE.CanvasTexture(c);
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = this.maxAnisotropy || 4;
      tex.colorSpace = THREE.SRGBColorSpace;
      mat = new THREE.MeshBasicMaterial({ map: tex });
      this.signTexCache.set(key, mat);
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  }

  /**
   * 🛒 AUTHENTIC REAL D-MART BRAND SIGNBOARD (Signature Emerald Green + Yellow Arc + Bold DMart Wordmark!)
   */
  _makeDMartLogoBoard(ownerSub = "", w = 11.4, h = 2.0) {
    const key = `DMART_LOGO|${ownerSub}`;
    let mat = this.signTexCache.get(key);
    if (!mat) {
      const c = document.createElement("canvas");
      c.width = 768;
      c.height = 192;
      const ctx = c.getContext("2d");

      // Signature D-Mart Deep Green Background + Bright Yellow Top & Bottom Border Trim
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, 0, 768, 192);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(0, 0, 768, 14);
      ctx.fillRect(0, 178, 768, 14);

      // Iconic White House-Roof & Shopping Cart Emblem on Left of Logo
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(74, 88);
      ctx.lineTo(126, 42);
      ctx.lineTo(178, 88);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(92, 92, 68, 44);
      ctx.fillStyle = "#15803d";
      ctx.font = "900 32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("D", 126, 116);

      // Bold Signature "DMart" Typography (White "D" + Bright Yellow/White "Mart")
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 84px sans-serif";
      ctx.fillText("D", 206, 86);
      ctx.fillStyle = "#facc15";
      ctx.font = "900 84px sans-serif";
      ctx.fillText("Mart", 272, 86);

      // Signature Yellow Curved Smile / Cart Underline
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(208, 126);
      ctx.quadraticCurveTo(360, 144, 515, 122);
      ctx.stroke();

      // Tagline right below ("DAILY DISCOUNTS • DAILY SAVINGS" + Owner Name if set)
      ctx.textAlign = "center";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 24px sans-serif";
      const subLine = ownerSub
        ? `DAILY DISCOUNTS • DAILY SAVINGS • ${ownerSub.toUpperCase()}`
        : "DAILY DISCOUNTS • DAILY SAVINGS";
      ctx.fillText(subLine, 470, 158, 540);

      // Right-Side Yellow "SUPERMARKET" Vertical Pill
      ctx.fillStyle = "#facc15";
      ctx.fillRect(576, 46, 166, 62);
      ctx.fillStyle = "#14532d";
      ctx.font = "900 24px sans-serif";
      ctx.fillText("HYPERMARKET", 659, 78, 154);

      const tex = new THREE.CanvasTexture(c);
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = this.maxAnisotropy || 4;
      tex.colorSpace = THREE.SRGBColorSpace;
      mat = new THREE.MeshBasicMaterial({ map: tex });
      this.signTexCache.set(key, mat);
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  }

  /**
   * 🪩 SHARED HELPER: 8 ADDITIVE-BLENDED NIGHT-SKY ROTATING DISCO SEARCHLIGHT BEAMS
   * Shoots tall glowing beams (28-32 units high) with bright atmospheric air-reflection halos
   * that visibly reflect into the night air & rotate 360° — ZERO extra PointLights on low-RAM devices!
   */
  _attachSkyDiscoLights(parentGroup, plotId, beamSpots, palette, marqueeBulbs = null, pointLightPos = null) {
    const nightGroup = new THREE.Group();
    const skyBeams = [];

    const baseGeo = new THREE.CylinderGeometry(0.46, 0.62, 0.72, 8);
    const lampHeadGeo = new THREE.SphereGeometry(0.38, 8, 8);
    const haloGeo = new THREE.RingGeometry(0.6, 3.2, 14);
    haloGeo.rotateX(-Math.PI / 2);

    beamSpots.forEach((spot, idx) => {
      const housing = new THREE.Mesh(baseGeo, this.mat.cinemaObsidian);
      housing.position.set(spot.x, spot.y + 0.35, spot.z);
      parentGroup.add(housing);

      const pivot = new THREE.Group();
      pivot.position.set(spot.x, spot.y + 0.68, spot.z);

      const colHex = palette[idx % palette.length];
      const beamMat = new THREE.MeshBasicMaterial({
        color: colHex,
        transparent: true,
        opacity: 0.44,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const coreMat = new THREE.MeshBasicMaterial({
        color: colHex,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const haloMat = new THREE.MeshBasicMaterial({
        color: colHex,
        transparent: true,
        opacity: 0.36,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const bulbMat = new THREE.MeshBasicMaterial({ color: colHex });

      const coneGeo = new THREE.CylinderGeometry(3.4, 0.3, spot.h, 10, 1, true);
      coneGeo.translate(0, spot.h / 2, 0);
      const cone = new THREE.Mesh(coneGeo, beamMat);
      cone.rotation.z = spot.tilt;

      const coreGeo = new THREE.CylinderGeometry(0.75, 0.16, spot.h * 0.96, 6, 1, true);
      coreGeo.translate(0, (spot.h * 0.96) / 2, 0);
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.rotation.z = spot.tilt;

      const airHalo = new THREE.Mesh(haloGeo, haloMat);
      airHalo.position.set(-Math.sin(spot.tilt) * spot.h * 0.92, Math.cos(spot.tilt) * spot.h * 0.92, 0);

      const lens = new THREE.Mesh(lampHeadGeo, bulbMat);
      pivot.add(lens, cone, core, airHalo);
      nightGroup.add(pivot);

      skyBeams.push({
        pivot,
        cone,
        core,
        airHalo,
        beamMat,
        coreMat,
        haloMat,
        bulbMat,
        beamH: spot.h,
        baseTilt: spot.tilt,
        dir: spot.dir,
        colorIdx: idx
      });
    });

    let ptLight = null;
    if (!this.isLowRam && pointLightPos) {
      ptLight = new THREE.PointLight(palette[0], 3.0, 32);
      ptLight.position.copy(pointLightPos);
      nightGroup.add(ptLight);
    }

    nightGroup.visible = this.timeOfDay === "night";
    parentGroup.add(nightGroup);

    this.theaterDiscos.push({
      plotId,
      nightGroup,
      skyBeams,
      pointLight: ptLight,
      marqueeBulbs,
      palette
    });
  }

  /**
   * 🎭 UPGRADED REAL 8-PLOT MULTIPLEX MOVIE THEATER (`movie_theater`)
   */
  _buildEightPlotMovieTheater(plotId, ownerName = "") {
    const g = new THREE.Group();

    const plazaFloor = new THREE.Mesh(new THREE.BoxGeometry(21.2, 0.16, 13.8), this.mat.marble);
    plazaFloor.position.set(-5.4, 0.32, 0);
    const parkLot = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.14, 13.8), this.mat.tarmacGrey);
    parkLot.position.set(10.5, 0.31, 0);

    const step1 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.22, 1.4), this.mat.marble);
    step1.position.set(-4.2, 0.42, 2.2);
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.19, 5.4), this.mat.vipCarpet);
    carpet.position.set(-4.2, 0.35, 4.2);
    [-6.2, -2.2].forEach((sx) => {
      [2.8, 4.6, 6.4].forEach((sz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.72, 6), this.mat.richGoldTrim);
        post.position.set(sx, 0.72, sz);
        g.add(post);
      });
    });
    g.add(plazaFloor, parkLot, step1, carpet);

    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(20.0, 7.2, 8.2), this.mat.cinemaObsidian);
    mainHall.position.set(-5.4, 3.9, -2.5);

    const upperHall = new THREE.Mesh(new THREE.BoxGeometry(15.2, 1.8, 6.4), this.mat.cinemaObsidian);
    upperHall.position.set(-5.4, 8.2, -3.2);
    const upperNeon = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.22, 6.6), this.mat.cinemaNeonCyan);
    upperNeon.position.set(-5.4, 7.45, -3.2);

    const crimsonPanelL = new THREE.Mesh(new THREE.BoxGeometry(4.8, 6.0, 0.38), this.mat.cinemaCrimson);
    crimsonPanelL.position.set(-12.6, 3.8, 1.65);
    const crimsonPanelR = crimsonPanelL.clone();
    crimsonPanelR.position.x = 1.6;

    [-15.2, -9.8, -1.2, 4.2].forEach((fx) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.32, 7.3, 0.68), this.mat.richGoldTrim);
      fin.position.set(fx, 3.95, 1.65);
      const neonRib = new THREE.Mesh(new THREE.BoxGeometry(0.12, 6.6, 0.14), this.mat.cinemaNeonPink);
      neonRib.position.set(fx, 3.95, 2.02);
      g.add(fin, neonRib);
    });

    // Double-Height Clear Glass Lobby Atrium WITH REAL INTERIOR MOVIE SCREEN & TIERED RED SEATS PREVIEW!
    const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(8.4, 4.6, 0.14), this.mat.glass);
    lobbyGlass.position.set(-4.2, 2.75, 1.68);
    const indoorScreen = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.6, 0.12), this.mat.cinemaScreenGlow);
    indoorScreen.position.set(-4.2, 3.2, -0.4);
    for (let r = 0; r < 3; r++) {
      const seatRow = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.45, 0.55), this.mat.cinemaCrimson);
      seatRow.position.set(-4.2, 0.75 + r * 0.42, 0.9 - r * 0.45);
      g.add(seatRow);
    }

    const marquee = new THREE.Mesh(new THREE.BoxGeometry(19.0, 1.2, 3.4), this.mat.cinemaCrimson);
    marquee.position.set(-5.4, 5.2, 2.9);
    const marqueeGoldTop = new THREE.Mesh(new THREE.BoxGeometry(19.3, 0.22, 3.6), this.mat.richGoldTrim);
    marqueeGoldTop.position.set(-5.4, 5.84, 2.9);
    const marqueeGoldBot = marqueeGoldTop.clone();
    marqueeGoldBot.position.y = 4.56;

    const bulbGeo = new THREE.SphereGeometry(0.14, 6, 6);
    const marqueeBulbs = [];
    for (let bx = -14.2; bx <= 3.4; bx += 1.25) {
      const bulb = new THREE.Mesh(bulbGeo, this.mat.cinemaMarquee);
      bulb.position.set(bx, 5.2, 4.66);
      g.add(bulb);
      marqueeBulbs.push(bulb);
    }

    const marqueeBoard = this._makeBuildingBoard(
      "NOW SHOWING • IMAX 3D • DOLBY",
      "SALAAR 2 • DEVARA • PUSHPA 2 • KALKI",
      "#09090b",
      "#facc15",
      16.2,
      0.9
    );
    marqueeBoard.position.set(-5.4, 5.2, 4.62);

    const cleanThName = (ownerName || "SHERU BHAI").trim().toUpperCase();
    const theaterTitle = cleanThName.includes("CINEMA") || cleanThName.includes("THEATER") || cleanThName.includes("MULTIPLEX")
      ? cleanThName
      : `${cleanThName} MULTIPLEX`;
    const mainTheaterBoard = this._makeBuildingBoard(
      theaterTitle,
      "IMAX 3D • SCREEN 1, 2, 3 • DOLBY ATMOS",
      "#09090b",
      "#facc15",
      15.8,
      1.85
    );
    mainTheaterBoard.position.set(-5.4, 8.65, 1.55);
    const boardBack = new THREE.Mesh(new THREE.BoxGeometry(16.2, 2.05, 0.45), this.mat.cinemaObsidian);
    boardBack.position.set(-5.4, 8.65, 1.3);

    const reelSculpture = new THREE.Group();
    reelSculpture.position.set(-5.4, 10.6, -3.2);
    const reelDisc = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.42, 16), this.mat.richGoldTrim);
    reelDisc.rotation.x = Math.PI / 2;
    const reelRim = new THREE.Mesh(new THREE.TorusGeometry(1.96, 0.18, 8, 18), this.mat.cinemaCrimson);
    const reelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.54, 10), this.mat.cinemaObsidian);
    reelHub.rotation.x = Math.PI / 2;
    for (let h = 0; h < 5; h++) {
      const ha = (h / 5) * Math.PI * 2;
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.48, 8), this.mat.cinemaObsidian);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(Math.cos(ha) * 1.1, Math.sin(ha) * 1.1, 0);
      reelSculpture.add(hole);
    }
    reelSculpture.add(reelDisc, reelRim, reelHub);
    g.add(reelSculpture);
    this.turntableRotors.push({ plotId, mesh: reelSculpture, speed: 0.95 });

    const p1 = this._makeMoviePoster("SALAAR 2", "REBEL RETURNS", "#7f1d1d", "#09090b", "#facc15");
    p1.position.set(-13.7, 2.55, 1.9);
    const p2 = this._makeMoviePoster("DEVARA", "FEAR IN IMAX", "#0c4a6e", "#020617", "#38bdf8");
    p2.position.set(-11.4, 2.55, 1.9);
    const p3 = this._makeMoviePoster("PUSHPA 2", "THE RULE", "#7c2d12", "#1c1917", "#fb923c");
    p3.position.set(0.45, 2.55, 1.9);
    const p4 = this._makeMoviePoster("KALKI 2898", "IMAX 3D", "#312e81", "#020617", "#c084fc");
    p4.position.set(2.75, 2.55, 1.9);

    const makePosterKiosk = (kx, kz, posterMesh) => {
      const kg = new THREE.Group();
      kg.position.set(kx, 0.4, kz);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.9, 0.28), this.mat.cinemaObsidian);
      frame.position.y = 1.85;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.42), this.mat.richGoldTrim);
      post.position.y = 0.35;
      posterMesh.position.set(0, 1.85, 0.16);
      const backPoster = posterMesh.clone();
      backPoster.rotation.y = Math.PI;
      backPoster.position.z = -0.16;
      kg.add(frame, post, posterMesh, backPoster);
      g.add(kg);
    };
    makePosterKiosk(-14.4, 5.2, this._makeMoviePoster("RRR", "FIRE & WATER", "#991b1b", "#1e3a8a", "#fde047"));
    makePosterKiosk(3.2, 5.2, this._makeMoviePoster("SHERU BHAI", "THE LION KING", "#854d0e", "#09090b", "#22d3ee"));

    // Real 3-Window Box Office Ticket Pavilion + Popcorn Stall
    const ticketBooth = new THREE.Group();
    ticketBooth.position.set(-9.6, 0.4, 4.9);

    const tbBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.15, 2.4), this.mat.cinemaCrimson);
    tbBase.position.y = 0.58;
    const tbCounter = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.15, 2.75), this.mat.richGoldTrim);
    tbCounter.position.y = 1.18;
    const tbGlass = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.35, 2.15), this.mat.glass);
    tbGlass.position.y = 1.9;
    [-1.1, 1.1].forEach((dx) => {
      const div = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 2.2), this.mat.richGoldTrim);
      div.position.set(dx, 1.9, 0);
      ticketBooth.add(div);
    });
    const tbRoof = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.45, 3.0), this.mat.cinemaObsidian);
    tbRoof.position.y = 2.76;
    const tbBoard = this._makeBuildingBoard("TICKET COUNTER", "11AM • 2PM • 6PM • 9PM", "#b91c1c", "#facc15", 4.6, 0.85);
    tbBoard.position.set(0, 3.12, 1.52);

    const clerk = this._createCharacter({ shirtMat: this.mat.richGoldTrim, pantsMat: this.mat.darkPants, scale: 0.88 });
    clerk.position.set(0, 0.38, 0);
    const qRail = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 0.08), this.mat.richGoldTrim);
    qRail.position.set(0, 0.72, 1.95);
    ticketBooth.add(tbBase, tbCounter, tbGlass, tbRoof, tbBoard, clerk, qRail);

    const popStall = new THREE.Group();
    popStall.position.set(-0.2, 0.4, 5.1);
    const popBase = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.05, 1.6), this.mat.cinemaCrimson);
    popBase.position.y = 0.52;
    const popBucket = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.34, 0.72, 8), this.mat.popcornYellow);
    popBucket.position.set(0, 1.4, 0);
    const popSign = this._makeBuildingBoard("POPCORN", "SNACKS • DRINKS", "#facc15", "#991b1b", 2.2, 0.58);
    popSign.position.set(0, 2.25, 0.82);
    popStall.add(popBase, popBucket, popSign);
    g.add(ticketBooth, popStall);

    const fan1 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(fan1);
    this.landmarkActors.push({ plotId, mesh: fan1, mode: "patrol_x", baseX: -9.6, baseZ: 6.45, range: 1.8, speed: 1.2, phase: 0 });
    const fan2 = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(fan2);
    this.landmarkActors.push({ plotId, mesh: fan2, mode: "patrol_z", baseX: -4.2, baseZ: 4.5, range: 1.8, speed: 1.35, phase: 1.4 });

    for (let pz = -5.2; pz <= 2.8; pz += 2.65) {
      const pLine = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.14), this.mat.stripe);
      pLine.rotation.x = -Math.PI / 2;
      pLine.position.set(13.3, 0.4, pz);
      g.add(pLine);
    }
    const tpIn = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.2), this.mat.parkingGreen);
    tpIn.rotation.x = -Math.PI / 2;
    tpIn.position.set(7.8, 0.4, 5.4);
    const tpOut = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.2), this.mat.parkingRed);
    tpOut.rotation.x = -Math.PI / 2;
    tpOut.position.set(13.0, 0.4, 5.4);

    const barrierPost = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.1, 0.32), this.mat.petrolYellow);
    barrierPost.position.set(6.5, 0.9, 4.4);
    const barrierArm = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.12), this.mat.petrolRed);
    barrierArm.position.set(7.8, 1.2, 4.4);
    barrierArm.rotation.z = 0.22;

    const tpBoard = this._makeBuildingBoard("THEATER PARKING", "IN ⬆  •  ⬇ OUT • CARS & BIKES", "#0f172a", "#facc15", 8.0, 1.15);
    tpBoard.position.set(10.5, 3.5, 6.2);
    [6.6, 14.4].forEach((px) => {
      const tpPole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.5, 6), this.mat.richGoldTrim);
      tpPole.position.set(px, 1.8, 6.2);
      g.add(tpPole);
    });

    const tCar1 = this._makeVehicleMesh(false, false, 0xef4444, false);
    tCar1.position.set(13.2, 0.38, -3.9);
    tCar1.rotation.y = -Math.PI / 2;
    const tCar2 = this._makeVehicleMesh(false, false, 0x3b82f6, false);
    tCar2.position.set(13.2, 0.38, -1.25);
    tCar2.rotation.y = -Math.PI / 2;
    const tCar3 = this._makeVehicleMesh(false, false, 0x10b981, false);
    tCar3.position.set(13.2, 0.38, 1.4);
    tCar3.rotation.y = -Math.PI / 2;
    const tAuto = this._makeRealAutoMesh(false, false);
    tAuto.position.set(7.8, 0.38, -2.5);
    tAuto.rotation.y = Math.PI / 2;
    g.add(tpIn, tpOut, barrierPost, barrierArm, tpBoard, tCar1, tCar2, tCar3, tAuto);

    const beamSpots = [
      { x: -15.4, y: 0.45, z: 6.3,  h: 30.0, tilt: 0.40, dir: 1 },
      { x: 4.8,   y: 0.45, z: 6.3,  h: 30.0, tilt: 0.40, dir: -1 },
      { x: -15.4, y: 0.45, z: -6.4, h: 30.0, tilt: 0.38, dir: -1 },
      { x: 15.2,  y: 0.45, z: -6.4, h: 30.0, tilt: 0.38, dir: 1 },
      { x: -14.2, y: 7.55, z: 1.3,  h: 28.0, tilt: 0.45, dir: 1 },
      { x: 3.4,   y: 7.55, z: 1.3,  h: 28.0, tilt: 0.45, dir: -1 },
      { x: -12.0, y: 9.15, z: -3.2, h: 26.0, tilt: 0.35, dir: -1 },
      { x: 1.2,   y: 9.15, z: -3.2, h: 26.0, tilt: 0.35, dir: 1 }
    ];
    this._attachSkyDiscoLights(
      g,
      plotId,
      beamSpots,
      [0xec4899, 0x22d3ee, 0xfacc15, 0xa855f7, 0x4ade80, 0xef4444],
      marqueeBulbs,
      new THREE.Vector3(-5.4, 9.2, 5.4)
    );

    g.add(
      mainHall, upperHall, upperNeon, crimsonPanelL, crimsonPanelR, lobbyGlass, indoorScreen,
      marquee, marqueeGoldTop, marqueeGoldBot, marqueeBoard, mainTheaterBoard, boardBack, p1, p2, p3, p4
    );
    g.userData.labelY = 12.8;
    return g;
  }

  /**
   * 🎬 DEDICATED 8-PLOT REAL GIANT IMAX 3D DOME THEATER (`imax_theater`)
   */
  _buildEightPlotIMAXTheater(plotId, ownerName = "") {
    const g = new THREE.Group();

    const plaza = new THREE.Mesh(new THREE.BoxGeometry(21.4, 0.16, 13.8), this.mat.marble);
    plaza.position.set(-5.3, 0.32, 0);
    const parkLot = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.14, 13.8), this.mat.tarmacGrey);
    parkLot.position.set(10.6, 0.31, 0);
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.19, 5.2), this.mat.imaxBlue);
    carpet.position.set(-5.2, 0.35, 4.2);
    g.add(plaza, parkLot, carpet);

    const baseHall = new THREE.Mesh(new THREE.BoxGeometry(19.6, 4.8, 8.6), this.mat.imaxBlue);
    baseHall.position.set(-5.4, 2.75, -2.2);

    const glassAtrium = new THREE.Mesh(new THREE.BoxGeometry(14.0, 4.2, 1.4), this.mat.glass);
    glassAtrium.position.set(-5.4, 2.5, 2.2);

    const imaxDome = new THREE.Mesh(
      new THREE.SphereGeometry(6.8, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      this.mat.imaxDomeSilver
    );
    imaxDome.scale.set(1.25, 0.85, 0.92);
    imaxDome.position.set(-5.4, 5.0, -2.4);

    const domeRing = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.2, 8, 28), this.mat.imaxNeonBlue);
    domeRing.rotation.x = Math.PI / 2;
    domeRing.scale.set(1.18, 0.88, 1);
    domeRing.position.set(-5.4, 5.2, -2.4);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.85, 3.2), this.mat.cinemaObsidian);
    canopy.position.set(-5.4, 4.95, 3.0);
    const canopyNeon = new THREE.Mesh(new THREE.BoxGeometry(17.8, 0.2, 3.35), this.mat.imaxNeonBlue);
    canopyNeon.position.set(-5.4, 4.5, 3.0);

    const cleanName = (ownerName || "").trim().toUpperCase();
    const imaxSub = cleanName ? `${cleanName} • LASER 3D • 70MM GIANT SCREEN` : "LASER 3D • 70MM GIANT SCREEN • DOLBY";
    const imaxSign = this._makeBuildingBoard("I M A X  3 D", imaxSub, "#020617", "#38bdf8", 14.8, 1.9);
    imaxSign.position.set(-5.4, 6.25, 2.65);
    const imaxBack = new THREE.Mesh(new THREE.BoxGeometry(15.2, 2.1, 0.42), this.mat.cinemaObsidian);
    imaxBack.position.set(-5.4, 6.25, 2.4);

    const ip1 = this._makeMoviePoster("INTERSTELLAR", "70MM IMAX", "#0f172a", "#020617", "#38bdf8");
    ip1.position.set(-13.8, 2.45, 2.22);
    const ip2 = this._makeMoviePoster("AVATAR 3", "IMAX 3D", "#0369a1", "#082f49", "#22d3ee");
    ip2.position.set(2.9, 2.45, 2.22);
    const ip3 = this._makeMoviePoster("KALKI 2898", "LASER IMAX", "#312e81", "#020617", "#c084fc");
    ip3.position.set(-13.8, 2.45, 5.1);
    const ip4 = this._makeMoviePoster("SALAAR 2", "IMAX SOUND", "#7f1d1d", "#09090b", "#facc15");
    ip4.position.set(2.9, 2.45, 5.1);

    const boxOffice = new THREE.Group();
    boxOffice.position.set(-10.2, 0.4, 5.0);
    const boBase = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.1, 2.2), this.mat.imaxBlue);
    boBase.position.y = 0.55;
    const boGlass = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.3, 2.0), this.mat.glass);
    boGlass.position.y = 1.75;
    const boRoof = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.36, 2.6), this.mat.cinemaObsidian);
    boRoof.position.y = 2.58;
    const boSign = this._makeBuildingBoard("IMAX TICKETS", "BOOK 3D SEATS", "#0369a1", "#38bdf8", 4.1, 0.78);
    boSign.position.set(0, 2.95, 1.35);
    const boClerk = this._createCharacter({ shirtMat: this.mat.imaxNeonBlue, pantsMat: this.mat.darkPants, scale: 0.88 });
    boClerk.position.set(0, 0.35, 0);
    boxOffice.add(boBase, boGlass, boRoof, boSign, boClerk);
    g.add(boxOffice);

    const m1 = this._createCharacter({ shirtMat: this.mat.wallGold, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(m1);
    this.landmarkActors.push({ plotId, mesh: m1, mode: "patrol_z", baseX: -5.2, baseZ: 4.6, range: 1.7, speed: 1.3, phase: 0 });

    for (let pz = -5.2; pz <= 2.8; pz += 2.65) {
      const pLine = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.14), this.mat.stripe);
      pLine.rotation.x = -Math.PI / 2;
      pLine.position.set(13.4, 0.4, pz);
      g.add(pLine);
    }
    const ipBoard = this._makeBuildingBoard("IMAX PARKING", "IN ⬆  •  ⬇ OUT • VIP", "#020617", "#38bdf8", 7.8, 1.15);
    ipBoard.position.set(10.6, 3.4, 6.2);
    [6.8, 14.4].forEach((px) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.4, 6), this.mat.imaxDomeSilver);
      p.position.set(px, 1.75, 6.2);
      g.add(p);
    });
    const iCar1 = this._makeVehicleMesh(false, false, 0x38bdf8, false);
    iCar1.position.set(13.3, 0.38, -3.9);
    iCar1.rotation.y = -Math.PI / 2;
    const iCar2 = this._makeVehicleMesh(false, false, 0xf8fafc, false);
    iCar2.position.set(13.3, 0.38, -1.25);
    iCar2.rotation.y = -Math.PI / 2;
    const iAuto = this._makeRealAutoMesh(false, false);
    iAuto.position.set(8.0, 0.38, -2.5);
    iAuto.rotation.y = Math.PI / 2;
    g.add(ipBoard, iCar1, iCar2, iAuto);

    const beamSpots = [
      { x: -15.4, y: 0.45, z: 6.3,  h: 31.0, tilt: 0.40, dir: 1 },
      { x: 4.8,   y: 0.45, z: 6.3,  h: 31.0, tilt: 0.40, dir: -1 },
      { x: -15.4, y: 0.45, z: -6.4, h: 31.0, tilt: 0.38, dir: -1 },
      { x: 15.2,  y: 0.45, z: -6.4, h: 31.0, tilt: 0.38, dir: 1 },
      { x: -14.2, y: 5.2,  z: 1.5,  h: 28.0, tilt: 0.44, dir: 1 },
      { x: 3.4,   y: 5.2,  z: 1.5,  h: 28.0, tilt: 0.44, dir: -1 },
      { x: -10.8, y: 7.4,  z: -2.4, h: 27.0, tilt: 0.34, dir: -1 },
      { x: 0.0,   y: 7.4,  z: -2.4, h: 27.0, tilt: 0.34, dir: 1 }
    ];
    this._attachSkyDiscoLights(
      g,
      plotId,
      beamSpots,
      [0x38bdf8, 0xec4899, 0x22d3ee, 0xa855f7, 0xfacc15, 0x4ade80],
      null,
      new THREE.Vector3(-5.4, 10.0, 4.5)
    );

    g.add(baseHall, glassAtrium, imaxDome, domeRing, canopy, canopyNeon, imaxSign, imaxBack, ip1, ip2, ip3, ip4);
    g.userData.labelY = 13.2;
    return g;
  }


  /**
   * 🚙 8-PLOT MAHINDRA SUV SHOWROOM (`mahindra_showroom`) — For @devil_boy62854!
   * Matte-black & Mahindra-red flagship showroom with rotating Thar/XUV700 hero SUV turntable,
   * 5 realistic 3D SUVs (spare wheel + roof rails + LED headlamps), panoramic glass & VIP parking!
   */
  _buildEightPlotMahindraShowroom(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.audiGlass;

    const floor = new THREE.Mesh(this._boxGeo(31.8, 0.16, 13.8), this.mat.marble);
    floor.position.set(0, 0.32, 0);
    const hall = new THREE.Mesh(this._boxGeo(29.8, 6.2, 8.6), this.mat.mahindraBlack);
    hall.position.set(0, 3.45, -2.2);
    const redPortal = new THREE.Mesh(this._boxGeo(10.8, 6.6, 0.65), this.mat.mahindraRed);
    redPortal.position.set(0, 3.65, 2.25);
    const frontGlass = new THREE.Mesh(this._boxGeo(28.0, 4.6, 0.14), winMat);
    frontGlass.position.set(0, 2.75, 2.16);
    frontGlass.userData.isWindow = true;
    const roofBand = new THREE.Mesh(this._boxGeo(30.4, 1.35, 9.2), this.mat.mahindraRed);
    roofBand.position.set(0, 7.1, -2.2);
    const twinStripe = new THREE.Mesh(this._boxGeo(30.6, 0.24, 9.3), this.mat.wallWhite);
    twinStripe.position.set(0, 6.38, -2.2);

    const ownerSub = ownerName ? `${ownerName.toUpperCase()} • THAR • SCORPIO-N • XUV700` : "THAR ROXX • SCORPIO-N • XUV700 • BE 6E";
    const mainBoard = this._makeBuildingBoard("MAHINDRA SHOWROOM", ownerSub, "#be123c", "#ffffff", 18.6, 1.65);
    mainBoard.position.set(0, 7.15, 2.45);
    const sideBoard = this._makeBuildingBoard("MAHINDRA", "RISE • SUV", "#111827", "#facc15", 8.2, 1.25);
    sideBoard.rotation.y = Math.PI / 2;
    sideBoard.position.set(15.26, 7.15, -2.2);

    // Rugged 3D Mahindra SUV Mesh Builder (High ground clearance, bullbar, roof rails, spare rear wheel!)
    const makeSUV = (bodyMat) => {
      const suv = this._makeRealAudiCarMesh(bodyMat, true);
      const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 10), this.mat.wheelBlack);
      spare.rotation.x = Math.PI / 2;
      spare.position.set(0, 0.72, -1.96);
      const bullbar = new THREE.Mesh(this._boxGeo(1.4, 0.28, 0.18), this.mat.chrome);
      bullbar.position.set(0, 0.48, 1.98);
      suv.add(spare, bullbar);
      return suv;
    };

    // Center Rotating Hero Mahindra Thar / XUV700 Turntable!
    const turntable = new THREE.Group();
    turntable.position.set(0, 0.42, 4.4);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.3, 0.24, 20), this.mat.mahindraBlack);
    const ledRing = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.26, 22), this.mat.cinemaNeonPink);
    ledRing.rotation.x = -Math.PI / 2;
    ledRing.position.y = 0.14;
    const heroSUV = makeSUV(this.mat.mahindraRed);
    heroSUV.position.set(0, 0.12, 0);
    turntable.add(disc, ledRing, heroSUV);
    g.add(turntable);
    this.turntableRotors.push({ plotId, mesh: turntable, speed: 0.72 });

    // 5 Additional 3D Mahindra SUVs displayed inside & on the front delivery bay!
    const suvPlacements = [
      { x: -10.5, z: -0.2, ry: 0.3, mat: this.mat.mahindraBlack },
      { x: -5.2,  z: -0.2, ry: -0.2, mat: this.mat.audiWhite },
      { x: 5.2,   z: -0.2, ry: 0.2, mat: this.mat.audiSilver },
      { x: 10.5,  z: -0.2, ry: -0.3, mat: this.mat.mahindraRed },
      { x: -9.8,  z: 4.8,  ry: 0.55, mat: this.mat.audiBlue }
    ];
    suvPlacements.forEach((sp) => {
      const car = makeSUV(sp.mat);
      car.position.set(sp.x, 0.42, sp.z);
      car.rotation.y = sp.ry;
      g.add(car);
    });

    // Sales Executive & Visitor
    const rep = this._createCharacter({ shirtMat: this.mat.mahindraRed, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(rep);
    this.landmarkActors.push({ plotId, mesh: rep, mode: "patrol_x", baseX: 8.5, baseZ: 4.8, range: 2.8, speed: 1.15, phase: 0 });

    g.add(floor, hall, redPortal, frontGlass, roofBand, twinStripe, mainBoard, sideBoard);
    g.userData.labelY = 11.6;
    return g;
  }

  /**
   * 🏎️ 8-PLOT BMW LUXURY CAR SHOWROOM (`bmw_showroom`) — For @golden_aura_4715!
   * Iconic white-glass German architecture, signature BMW M-Sport tri-color stripes (cyan/navy/red),
   * giant rooftop BMW Blue-White Roundel emblem, rotating hero BMW coupe turntable & 5 luxury cars!
   */
  _buildEightPlotBMWShowroom(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.glass;

    const floor = new THREE.Mesh(this._boxGeo(31.8, 0.16, 13.8), this.mat.marble);
    floor.position.set(0, 0.32, 0);
    const hall = new THREE.Mesh(this._boxGeo(29.8, 6.4, 8.6), this.mat.wallWhite);
    hall.position.set(0, 3.55, -2.2);
    const frontGlass = new THREE.Mesh(this._boxGeo(28.2, 5.0, 0.14), winMat);
    frontGlass.position.set(0, 2.9, 2.16);
    frontGlass.userData.isWindow = true;
    const roofSlab = new THREE.Mesh(this._boxGeo(30.8, 0.72, 9.6), this.mat.cinemaObsidian);
    roofSlab.position.set(0, 7.05, -2.1);

    // Iconic BMW M-Sport Tri-Color Accent Stripes across the Front Fascia!
    const m1 = new THREE.Mesh(this._boxGeo(9.6, 0.28, 0.2), this.mat.bmwMBlueLight);
    m1.position.set(-9.6, 6.55, 2.72);
    const m2 = new THREE.Mesh(this._boxGeo(9.6, 0.28, 0.2), this.mat.bmwMBlueDark);
    m2.position.set(0, 6.55, 2.72);
    const m3 = new THREE.Mesh(this._boxGeo(9.6, 0.28, 0.2), this.mat.bmwMRed);
    m3.position.set(9.6, 6.55, 2.72);

    // Giant Rooftop 3D BMW Roundel Emblem (Rotating Slowly!)
    const roundel = new THREE.Group();
    roundel.position.set(0, 9.45, 1.9);
    const outerRing = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.28, 18), this.mat.cinemaObsidian);
    outerRing.rotation.x = Math.PI / 2;
    const silverRim = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.12, 6, 18), this.mat.bmwSilver);
    const q1 = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.32, 10, 1, false, 0, Math.PI / 2), this.mat.bmwMBlueLight);
    q1.rotation.x = Math.PI / 2;
    const q2 = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.32, 10, 1, false, Math.PI, Math.PI / 2), this.mat.bmwMBlueLight);
    q2.rotation.x = Math.PI / 2;
    const q3 = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.32, 10, 1, false, Math.PI / 2, Math.PI / 2), this.mat.wallWhite);
    q3.rotation.x = Math.PI / 2;
    const q4 = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.32, 10, 1, false, Math.PI * 1.5, Math.PI / 2), this.mat.wallWhite);
    q4.rotation.x = Math.PI / 2;
    roundel.add(outerRing, silverRim, q1, q2, q3, q4);
    g.add(roundel);
    this.turntableRotors.push({ plotId, mesh: roundel, speed: 0.55 });

    const ownerSub = ownerName ? `${ownerName.toUpperCase()} • M4 • X7 • i7 ELECTRIC` : "SHEER DRIVING PLEASURE • M4 • M5 • X7";
    const mainBoard = this._makeBuildingBoard("BMW LUXURY SHOWROOM", ownerSub, "#0f172a", "#38bdf8", 18.0, 1.55);
    mainBoard.position.set(0, 7.05, 2.75);

    // Center Rotating Hero BMW M4 Coupe Turntable!
    const turntable = new THREE.Group();
    turntable.position.set(0, 0.42, 4.4);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.3, 0.24, 20), this.mat.cinemaObsidian);
    const ledRing = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.28, 22), this.mat.bmwMBlueLight);
    ledRing.rotation.x = -Math.PI / 2;
    ledRing.position.y = 0.14;
    const heroBMW = this._makeRealAudiCarMesh(this.mat.audiBlue, false);
    heroBMW.position.set(0, 0.12, 0);
    turntable.add(disc, ledRing, heroBMW);
    g.add(turntable);
    this.turntableRotors.push({ plotId, mesh: turntable, speed: 0.78 });

    // 5 Sleek BMW Sedans & X7 SUVs
    const bmwPlacements = [
      { x: -10.5, z: -0.2, ry: 0.3, mat: this.mat.bmwSilver, suv: false },
      { x: -5.2,  z: -0.2, ry: -0.2, mat: this.mat.audiBlack, suv: true },
      { x: 5.2,   z: -0.2, ry: 0.2, mat: this.mat.audiWhite, suv: false },
      { x: 10.5,  z: -0.2, ry: -0.3, mat: this.mat.audiRed, suv: true },
      { x: 9.8,   z: 4.8,  ry: -0.55, mat: this.mat.audiWhite, suv: false }
    ];
    bmwPlacements.forEach((bp) => {
      const car = this._makeRealAudiCarMesh(bp.mat, bp.suv);
      car.position.set(bp.x, 0.42, bp.z);
      car.rotation.y = bp.ry;
      g.add(car);
    });

    const mgr = this._createCharacter({ shirtMat: this.mat.wallWhite, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(mgr);
    this.landmarkActors.push({ plotId, mesh: mgr, mode: "patrol_x", baseX: -8.5, baseZ: 4.8, range: 2.8, speed: 1.1, phase: 1.0 });

    g.add(floor, hall, frontGlass, roofSlab, m1, m2, m3, mainBoard);
    g.userData.labelY = 11.8;
    return g;
  }

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
    this.heroAudiSlots.push({ plotId, group: heroR8 });
    if (this.heroModelUrls && this.heroModelUrls.audi) {
      this._loadHeroGLB("audi", this.heroModelUrls.audi, heroR8, 4.3, 0.02, 0);
    }
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

    if (type === "mobile_showroom") {
      // 📱 2-PLOT MEGA MOBILE SHOWROOM (Sangeetha / Big C Style Smartphone Megastore + Rotating 3D Phone!)
      const mainBody = new THREE.Mesh(new THREE.BoxGeometry(13.6, 4.5, 5.4), this.mat.wallWhite);
      mainBody.position.set(0, 2.3, -0.55);

      const upperBand = new THREE.Mesh(new THREE.BoxGeometry(14.0, 1.35, 5.8), this.mat.mobileBlue);
      upperBand.position.set(0, 5.05, -0.55);
      const orangeStrip = new THREE.Mesh(new THREE.BoxGeometry(14.1, 0.24, 5.86), this.mat.mobileOrange);
      orangeStrip.position.set(0, 4.3, -0.55);
      const cyanStrip = new THREE.Mesh(new THREE.BoxGeometry(14.1, 0.18, 5.86), this.mat.mobileCyanGlow);
      cyanStrip.position.set(0, 5.75, -0.55);

      // Wide Clear Sky-Reflective Glass Storefront + Center Glass Entry Doors
      const glassFront = new THREE.Mesh(new THREE.BoxGeometry(12.2, 3.35, 0.14), this.mat.glass);
      glassFront.position.set(0, 1.95, 2.18);
      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 0.2), this.mat.mobileBlue);
      doorFrame.position.set(0, 1.4, 2.22);

      // Interior Experience Tables with Glowing Demo Smartphones + Accessories Wall!
      [-3.8, 3.8].forEach((tx) => {
        const tbl = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.95, 1.25), this.mat.stuccoIvory);
        tbl.position.set(tx, 0.62, 0.55);
        for (let p = -1; p <= 1; p++) {
          const ph = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.48), this.mat.mobileScreenGlow);
          ph.position.set(tx + p * 0.9, 1.15, 0.55);
          g.add(ph);
        }
        g.add(tbl);
      });
      // Colorful Phone Case & Accessories Wall inside back of store
      const caseWall = new THREE.Mesh(new THREE.BoxGeometry(10.8, 2.4, 0.25), this.mat.mobileBlue);
      caseWall.position.set(0, 1.55, -2.4);
      g.add(caseWall);

      // GIANT ROTATING 3D TITANIUM SMARTPHONE HOLOGRAM ON ROOF!
      const megaPhone = new THREE.Group();
      megaPhone.position.set(-4.2, 7.25, 0.2);
      const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.75, 3.0, 0.32), this.mat.mobileTitanium);
      const pScrF = new THREE.Mesh(new THREE.BoxGeometry(1.52, 2.72, 0.08), this.mat.mobileScreenGlow);
      pScrF.position.z = 0.16;
      const pScrB = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.12), this.mat.cinemaObsidian);
      pScrB.position.set(-0.32, 0.85, -0.18);
      megaPhone.add(pBody, pScrF, pScrB);
      g.add(megaPhone);
      this.turntableRotors.push({ plotId, mesh: megaPhone, speed: 1.05 });

      // Mini Rooftop 5G Signal Mast on Right Side
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.6, 6), this.mat.chrome);
      mast.position.set(4.8, 7.0, -0.4);
      const signalRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 6, 14), this.mat.mobileCyanGlow);
      signalRing.position.set(4.8, 8.1, -0.4);
      g.add(mast, signalRing);

      // Personalized Main Mega Mobile Showroom Signboard + Brand Banner!
      const rawShow = (ownerName || "SHERU BHAI").replace(/^@/, "").trim().toUpperCase();
      const showTitle = rawShow.includes("MOBILE") ? rawShow : `${rawShow} MOBILES`;
      const mainBoard = this._makeBuildingBoard(showTitle, "iPHONE • SAMSUNG • REDMI • 5G REPAIR", "#0f172a", "#22d3ee", 11.4, 1.32);
      mainBoard.position.set(0.5, 5.05, 2.38);

      // Sidewalk Promotional Standee + Animated Shoppers!
      const standee = this._makeBuildingBoard("5G EXCHANGE", "0% EMI LIVE!", "#f97316", "#ffffff", 1.75, 1.35);
      standee.position.set(-5.2, 1.15, 2.9);
      g.add(standee);

      const buyer = this._createCharacter({ shirtMat: this.mat.mobileOrange, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(buyer);
      this.landmarkActors.push({ plotId, mesh: buyer, mode: "patrol_x", baseX: 0, baseZ: 2.85, range: 3.4, speed: 1.25, phase: 0 });

      g.add(mainBody, upperBand, orangeStrip, cyanStrip, glassFront, doorFrame, mainBoard);
      g.userData.labelY = 9.4;
      return g;
    }

    if (type === "beach_villa_2") {
      // 🏖️ ADDABLE 2-PLOT LUXURY MEGA BEACH HOUSE VILLA (Wide Infinity Pool + Dual Suites + Palm Lounge!)
      const deck = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.36, 6.4), this.mat.teakWood);
      deck.position.set(0, 0.18, 0);
      const pool = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 2.1), this.mat.water);
      pool.position.set(-2.2, 0.19, 1.85);

      const f1 = new THREE.Mesh(new THREE.BoxGeometry(12.2, 2.8, 3.5), this.mat.wallWhite);
      f1.position.set(0, 1.75, -1.2);
      const teakWing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.85, 3.7), this.mat.teakWood);
      teakWing.position.set(4.5, 1.75, -1.2);
      const g1 = new THREE.Mesh(new THREE.BoxGeometry(7.8, 2.2, 0.14), winMat);
      g1.position.set(-1.2, 1.55, 0.56);
      g1.userData.isWindow = true;

      const slab = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.28, 4.6), this.mat.wallWhite);
      slab.position.set(0, 3.28, -0.75);
      const f2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 2.5, 3.2), this.mat.stuccoIvory);
      f2.position.set(0.8, 4.66, -1.25);
      const g2 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.85, 0.14), winMat);
      g2.position.set(0.8, 4.62, 0.36);
      g2.userData.isWindow = true;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.72, 0.12), this.mat.glass);
      rail.position.set(0, 3.76, 1.48);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.28, 4.0), this.mat.slateTrim);
      roof.position.set(0.6, 6.02, -1.1);

      const cleanO = (ownerName || "VIP VILLA").trim().toUpperCase();
      const vBoard = this._makeBuildingBoard(cleanO, "LUXURY BEACH HOUSE VILLA", "#0f172a", "#38bdf8", 7.6, 1.15);
      vBoard.position.set(0.6, 6.2, 0.94);

      const lounger = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.32, 0.95), this.mat.wallWhite);
      lounger.position.set(3.4, 0.52, 1.9);
      const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 5), this.mat.richGoldTrim);
      uPole.position.set(4.5, 1.45, 2.1);
      const uTop = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.45, 8), this.mat.studioCyan);
      uTop.position.set(4.5, 2.6, 2.1);
      const surf = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.1, 0.52), this.mat.petrolYellow);
      surf.position.set(-6.1, 1.35, 1.9);
      surf.rotation.z = 0.2;

      g.add(deck, pool, f1, teakWing, g1, slab, f2, g2, rail, roof, vBoard, lounger, uPole, uTop, surf);
      g.userData.labelY = 8.4;
      return g;
    }

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





    // 4-PLOT SACRED TIRUMALA VENKATESWARA SWAMY TEMPLE (`tirumala_temple`) — For @bobby_official_333!
    if (type === "tirumala_temple") {
      // Sacred Prakaram Courtyard Floor + Traditional White & Red-Striped Outer Compound Wall!
      const court = new THREE.Mesh(this._boxGeo(13.8, 0.22, 13.8), this.mat.marble);
      court.position.set(0, 0.14, 0);
      const wallL = new THREE.Mesh(this._boxGeo(0.5, 2.2, 12.6), this.mat.wallWhite);
      wallL.position.set(-6.5, 1.25, 0);
      const wallR = wallL.clone();
      wallR.position.x = 6.5;
      const wallB = new THREE.Mesh(this._boxGeo(13.4, 2.2, 0.5), this.mat.wallWhite);
      wallB.position.set(0, 1.25, -6.5);
      // Iconic Red Vertical Temple Stripes along outer walls
      for (let s = -5.4; s <= 5.4; s += 1.8) {
        const stL = new THREE.Mesh(this._boxGeo(0.56, 2.15, 0.35), this.mat.templeRedStripe);
        stL.position.set(-6.5, 1.25, s);
        const stR = stL.clone();
        stR.position.x = 6.5;
        g.add(stL, stR);
      }

      // Main Sanctum Mandapam + Multi-Tiered Golden ANANDA NILAYAM VIMANA GOPURAM!
      const mandapam = new THREE.Mesh(this._boxGeo(7.6, 3.4, 6.2), this.mat.wallWhite);
      mandapam.position.set(0, 1.95, -2.3);
      const goldTier1 = new THREE.Mesh(this._boxGeo(6.4, 1.3, 5.2), this.mat.templeGold);
      goldTier1.position.set(0, 4.25, -2.3);
      const goldTier2 = new THREE.Mesh(this._boxGeo(4.8, 1.25, 4.0), this.mat.templeGold);
      goldTier2.position.set(0, 5.45, -2.3);
      const goldTier3 = new THREE.Mesh(this._boxGeo(3.2, 1.15, 2.8), this.mat.templeGold);
      goldTier3.position.set(0, 6.55, -2.3);
      const vimanaDome = new THREE.Mesh(new THREE.SphereGeometry(1.55, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.templeGold);
      vimanaDome.position.set(0, 7.1, -2.3);
      const kalasam = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.15, 8), this.mat.templeGold);
      kalasam.position.set(0, 9.0, -2.3);

      // Front Raja Gopuram Entry Arch + Sacred Glowing Tirunamam (White U + Red Tilakam)!
      const gopBase = new THREE.Mesh(this._boxGeo(6.4, 3.6, 1.8), this.mat.wallWhite);
      gopBase.position.set(0, 2.05, 5.4);
      const gopDoor = new THREE.Mesh(this._boxGeo(2.4, 2.6, 1.92), this.mat.cinemaObsidian);
      gopDoor.position.set(0, 1.55, 5.4);
      const gopT1 = new THREE.Mesh(this._boxGeo(5.6, 1.15, 1.5), this.mat.templeSaffron);
      gopT1.position.set(0, 4.35, 5.4);
      const gopT2 = new THREE.Mesh(this._boxGeo(4.2, 1.05, 1.2), this.mat.templeGold);
      gopT2.position.set(0, 5.4, 5.4);
      // 3 Golden Gopuram Kalasams
      [-1.2, 0, 1.2].forEach((kx) => {
        const gk = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.72, 6), this.mat.templeGold);
        gk.position.set(kx, 6.25, 5.4);
        g.add(gk);
      });
      // Glowing White-Red Tirunamam Emblem on Raja Gopuram Front!
      const namL = new THREE.Mesh(this._boxGeo(0.24, 1.0, 0.14), this.mat.wallWhite);
      namL.position.set(-0.42, 4.4, 6.24);
      const namR = namL.clone();
      namR.position.x = 0.42;
      const namB = new THREE.Mesh(this._boxGeo(1.08, 0.24, 0.14), this.mat.wallWhite);
      namB.position.set(0, 3.95, 6.24);
      const namCenter = new THREE.Mesh(this._boxGeo(0.22, 0.9, 0.16), this.mat.oyoRed);
      namCenter.position.set(0, 4.45, 6.26);

      // Tall Golden Dwajasthambam (Temple Flag Pillar) + 4 Glowing Brass Deepam Lamps!
      const dwaja = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 6.2, 8), this.mat.templeGold);
      dwaja.position.set(0, 3.35, 2.2);
      const dwajaBase = new THREE.Mesh(this._boxGeo(1.2, 0.7, 1.2), this.mat.templeGold);
      dwajaBase.position.set(0, 0.6, 2.2);
      [[-2.6, 3.6], [2.6, 3.6], [-2.6, 6.6], [2.6, 6.6]].forEach(([dx, dz]) => {
        const lampStand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 1.15, 6), this.mat.templeGold);
        lampStand.position.set(dx, 0.8, dz);
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), this.mat.templeLampGlow);
        flame.position.set(dx, 1.48, dz);
        g.add(lampStand, flame);
      });

      const tBoard = this._makeBuildingBoard("OM NAMO VENKATESAYA", ownerName ? `TIRUMALA TEMPLE • ${ownerName.toUpperCase()}` : "TIRUMALA VENKATESWARA SWAMY TEMPLE", "#991b1b", "#facc15", 8.4, 1.2);
      tBoard.position.set(0, 3.35, 6.38);

      // Animated Devotees doing Pradakshina!
      const dev1 = this._createCharacter({ shirtMat: this.mat.templeSaffron, pantsMat: this.mat.wallWhite, scale: 0.92 });
      g.add(dev1);
      this.landmarkActors.push({ plotId, mesh: dev1, mode: "patrol_x", baseX: 0, baseZ: 3.5, range: 3.4, speed: 0.95, phase: 0 });

      g.add(court, wallL, wallR, wallB, mandapam, goldTier1, goldTier2, goldTier3, vimanaDome, kalasam, gopBase, gopDoor, gopT1, gopT2, namL, namR, namB, namCenter, dwaja, dwajaBase, tBoard);
      g.userData.labelY = 10.6;
      return g;
    }

    // 4-PLOT 20-FLOOR OYO ROOMS SKYSCRAPER (`hotel_oyo`)
    // Towering 20-story OYO Rooms landmark with dedicated Car Parking + Animated Boys & Girls walking together inside!
    if (type === "hotel_oyo") {
      const floors = 20;
      const floorH = 1.25;
      const totalH = floors * floorH + 2.2; // ~27.2 units tall!

      // Main 20-Floor Skyscraper Core + Iconic Red Vertical OYO Pillar Rib & Rooftop Crown!
      const tower = new THREE.Mesh(this._boxGeo(9.6, totalH, 6.2), this.mat.wallWhite);
      tower.position.set(0, totalH / 2 + 0.1, -2.5);

      const redSpineL = new THREE.Mesh(this._boxGeo(0.75, totalH + 0.4, 6.4), this.mat.oyoRed);
      redSpineL.position.set(-4.6, totalH / 2 + 0.2, -2.5);
      const redSpineR = redSpineL.clone();
      redSpineR.position.x = 4.6;

      const redCrown = new THREE.Mesh(this._boxGeo(10.4, 2.0, 6.8), this.mat.oyoRed);
      redCrown.position.set(0, totalH + 1.0, -2.5);

      // All 20 Floors of Sunlit Glass Suites & Balconies batched into TWO lightweight InstancedMeshes (Zero Lag!)
      const winGeo = this._boxGeo(8.2, 0.72, 0.14);
      const balcGeo = this._boxGeo(8.6, 0.14, 0.55);
      const winInst = new THREE.InstancedMesh(winGeo, winMat, floors);
      winInst.userData.isWindow = true;
      const balcInst = new THREE.InstancedMesh(balcGeo, this.mat.slateTrim, floors);
      const fDummy = new THREE.Object3D();
      for (let f = 0; f < floors; f++) {
        const fy = 2.6 + f * floorH;
        fDummy.position.set(0, fy, 0.65);
        fDummy.updateMatrix();
        winInst.setMatrixAt(f, fDummy.matrix);
        fDummy.position.set(0, fy - 0.42, 0.88);
        fDummy.updateMatrix();
        balcInst.setMatrixAt(f, fDummy.matrix);
      }
      winInst.instanceMatrix.needsUpdate = true;
      balcInst.instanceMatrix.needsUpdate = true;

      // Ground Floor Grand OYO Glass Lobby Entrance + Red Portico Canopy + VIP Red Carpet!
      const lobbyGlass = new THREE.Mesh(this._boxGeo(6.4, 2.1, 0.18), this.mat.glass);
      lobbyGlass.position.set(0, 1.15, 0.65);
      const canopy = new THREE.Mesh(this._boxGeo(6.8, 0.45, 2.6), this.mat.oyoRed);
      canopy.position.set(0, 2.35, 1.85);
      const carpet = new THREE.Mesh(this._boxGeo(2.4, 0.14, 2.8), this.mat.oyoRed);
      carpet.position.set(0, 0.15, 1.9);

      // Dedicated OYO Front Car Parking Lot (z = 4.8) with Painted Bays & Parked Cars!
      const oyoPark = new THREE.Mesh(this._boxGeo(13.2, 0.1, 3.6), this.mat.tarmacGrey);
      oyoPark.position.set(0, 0.12, 4.9);
      [-5.2, -2.6, 2.6, 5.2].forEach((lx) => {
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2.7), this.mat.stripe);
        pl.rotation.x = -Math.PI / 2;
        pl.position.set(lx, 0.2, 4.9);
        g.add(pl);
      });
      const oCar1 = this._makeVehicleMesh(false, false, 0x1e293b, false);
      oCar1.position.set(-3.9, 0.18, 4.9);
      const oCar2 = this._makeVehicleMesh(false, false, 0xf8fafc, false);
      oCar2.position.set(3.9, 0.18, 4.9);

      // Iconic Rooftop & Entrance OYO Signboards (visible from across the whole city & beach!)
      const hTitle = ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} • 20 FLOORS` : "20 FLOORS • COUPLE FRIENDLY • AC";
      const oyoTop = this._makeBuildingBoard("OYO ROOMS", hTitle, "#ee2e24", "#ffffff", 9.8, 1.75);
      oyoTop.position.set(0, totalH + 1.0, 0.96);
      const oyoTopBack = oyoTop.clone();
      oyoTopBack.rotation.y = Math.PI;
      oyoTopBack.position.z = -5.96;
      const oyoEntry = this._makeBuildingBoard("OYO • CHECK-IN", "20 FLOORS • FREE PARKING", "#ffffff", "#ee2e24", 5.4, 0.72);
      oyoEntry.position.set(0, 2.4, 3.18);

      // 👫 ANIMATED BOYS & GIRLS WALKING TOGETHER IN PAIRS INTO THE OYO ENTRANCE!
      const makeCouple = (shirtBoy, dressGirl, phaseOffset, laneX) => {
        const pair = new THREE.Group();
        const boy = this._createCharacter({ shirtMat: shirtBoy, pantsMat: this.mat.darkPants, scale: 0.94 });
        boy.position.x = -0.34;
        const girl = this._createCharacter({ shirtMat: dressGirl, pantsMat: this.mat.wallWhite, scale: 0.88 });
        girl.position.x = 0.34;
        pair.add(boy, girl);
        g.add(pair);
        this.landmarkActors.push({
          plotId,
          mesh: pair,
          mode: "enter_z",
          baseX: laneX,
          startZ: 4.5,
          endZ: 0.65,
          speed: 0.42,
          phase: phaseOffset
        });
      };
      makeCouple(this.mat.wallBlue, this.mat.girlDressPink, 0.0, -0.35);
      makeCouple(this.mat.cinemaObsidian, this.mat.girlDressYellow, 0.52, 0.45);

      g.add(tower, redSpineL, redSpineR, redCrown, winInst, balcInst, lobbyGlass, canopy, carpet, oyoPark, oCar1, oCar2, oyoTop, oyoTopBack, oyoEntry);
      g.userData.labelY = totalH + 4.4;
      return g;
    }

    // 4-PLOT BOYS & GIRLS HOSTEL (`hostel`) — Coastal & City Multi-Floor Hostel with Balconies & Bike Parking!
    if (type === "hostel") {
      const body = new THREE.Mesh(this._boxGeo(11.6, 7.6, 7.0), this.mat.wallCream);
      body.position.set(0, 3.85, -2.2);
      const topTrim = new THREE.Mesh(this._boxGeo(12.2, 1.15, 7.6), this.mat.hostelTeal);
      topTrim.position.set(0, 8.15, -2.2);
      const sideAccentL = new THREE.Mesh(this._boxGeo(1.4, 7.7, 7.2), this.mat.hostelPeach);
      sideAccentL.position.set(-5.2, 3.85, -2.2);
      const sideAccentR = sideAccentL.clone();
      sideAccentR.position.x = 5.2;

      for (let f = 0; f < 3; f++) {
        const fy = 2.0 + f * 2.0;
        const winRow = new THREE.Mesh(this._boxGeo(8.2, 1.05, 0.14), winMat);
        winRow.position.set(0, fy, 1.36);
        winRow.userData.isWindow = true;
        const balc = new THREE.Mesh(this._boxGeo(8.8, 0.22, 0.85), this.mat.hostelTeal);
        balc.position.set(0, fy - 0.58, 1.75);
        g.add(winRow, balc);
      }

      // Entrance Gate + Scooter / Bike Parking Bay for Hostel Students!
      const porch = new THREE.Mesh(this._boxGeo(4.2, 0.35, 2.0), this.mat.hostelTeal);
      porch.position.set(0, 2.25, 2.3);
      const bikeBay = new THREE.Mesh(this._boxGeo(11.8, 0.1, 3.2), this.mat.tarmacGrey);
      bikeBay.position.set(0, 0.12, 4.9);
      [-4.2, -2.8, 2.8, 4.2].forEach((bx, idx) => {
        const sc = new THREE.Mesh(this._boxGeo(0.42, 0.72, 1.25), idx % 2 === 0 ? this.mat.wallBlue : this.mat.oyoRed);
        sc.position.set(bx, 0.52, 4.9);
        g.add(sc);
      });

      const hName = ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} HOSTEL` : "SHERU BHAI HOSTEL";
      const hBoard = this._makeBuildingBoard(hName, "BOYS & GIRLS • AC ROOMS • MESS & WIFI", "#0f766e", "#facc15", 10.6, 1.35);
      hBoard.position.set(0, 8.15, 1.66);

      const st1 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.92 });
      const st2 = this._createCharacter({ shirtMat: this.mat.girlDressPurple, pantsMat: this.mat.wallWhite, scale: 0.88 });
      g.add(st1, st2);
      this.landmarkActors.push({ plotId, mesh: st1, mode: "patrol_x", baseX: 0, baseZ: 3.1, range: 3.2, speed: 1.15, phase: 0 });
      this.landmarkActors.push({ plotId, mesh: st2, mode: "enter_z", baseX: 0.5, startZ: 4.5, endZ: 1.3, speed: 0.36, phase: 0.25 });

      g.add(body, topTrim, sideAccentL, sideAccentR, porch, bikeBay, hBoard);
      g.userData.labelY = 10.6;
      return g;
    }

    // 4-PLOT REAL-STYLE WINE SHOP LANDMARK (`wine_shop`)
    // Authentic Indian Wines & Spirits: royal maroon/gold/dark-wood facade, steel counter grill,
    // glowing backlit bottle shelves inside, giant 3D rooftop emerald bottle emblem & bike/car parking!
    if (type === "wine_shop") {
      const body = new THREE.Mesh(this._boxGeo(12.6, 5.2, 7.2), this.mat.cinemaObsidian);
      body.position.set(0, 2.65, -2.2);
      const maroonBand = new THREE.Mesh(this._boxGeo(13.0, 1.65, 7.6), this.mat.wineMaroon);
      maroonBand.position.set(0, 5.85, -2.2);
      const goldTrim1 = new THREE.Mesh(this._boxGeo(13.15, 0.24, 7.75), this.mat.richGoldTrim);
      goldTrim1.position.set(0, 4.98, -2.2);
      const goldTrim2 = goldTrim1.clone();
      goldTrim2.position.y = 6.72;
      const neonTube = new THREE.Mesh(this._boxGeo(12.8, 0.16, 0.18), this.mat.wineNeonGold);
      neonTube.position.set(0, 4.78, 1.66);

      // Authentic Metal Security Grill Counter Window + Glowing Backlit Bottle Display Shelves Behind!
      const counterBase = new THREE.Mesh(this._boxGeo(9.2, 1.25, 0.9), this.mat.darkWood);
      counterBase.position.set(0, 0.72, 1.6);
      const glassBack = new THREE.Mesh(this._boxGeo(9.2, 2.6, 0.14), this.mat.glass);
      glassBack.position.set(0, 2.65, 1.44);
      // Vertical steel security grill bars across counter window (real Indian wine shop style!)
      for (let gx = -4.2; gx <= 4.2; gx += 0.7) {
        const bar = new THREE.Mesh(this._boxGeo(0.06, 2.4, 0.08), this.mat.chrome);
        bar.position.set(gx, 2.55, 1.72);
        g.add(bar);
      }
      // Illuminated Bottle Shelves visible inside the counter window!
      const shelfColors = [this.mat.wineBottleGreen, this.mat.wineBottleAmber, this.mat.oyoRed, this.mat.richGoldTrim];
      for (let sy = 0; sy < 2; sy++) {
        const shelf = new THREE.Mesh(this._boxGeo(8.6, 0.12, 0.55), this.mat.wood);
        shelf.position.set(0, 1.85 + sy * 0.95, 0.55);
        g.add(shelf);
        for (let bx = -3.6; bx <= 3.6; bx += 0.72) {
          const btl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.52, 6), shelfColors[(Math.abs(Math.round(bx * 2)) + sy) % shelfColors.length]);
          btl.position.set(bx, 2.18 + sy * 0.95, 0.55);
          g.add(btl);
        }
      }

      // Giant 3D Rooftop Sculpted Emerald Bottle & Golden Crown Emblem!
      const bigBtl = new THREE.Group();
      bigBtl.position.set(-4.6, 8.2, -0.6);
      const bBody = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.65, 2.2, 10), this.mat.wineBottleGreen);
      const bNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 0.95, 8), this.mat.wineBottleGreen);
      bNeck.position.y = 1.5;
      const bCap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.3, 8), this.mat.richGoldTrim);
      bCap.position.y = 2.08;
      const bLbl = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.75, 10), this.mat.wallCream);
      bLbl.position.y = 0.05;
      bigBtl.add(bBody, bNeck, bCap, bLbl);
      g.add(bigBtl);
      this.turntableRotors.push({ plotId, mesh: bigBtl, speed: 0.75 });

      const wTitle = ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} WINES` : "ROYAL WINES & SPIRITS";
      const wBoard = this._makeBuildingBoard(wTitle, "CHILLED BEER • FINE WINES • PERMIT ROOM", "#7f1d1d", "#fde047", 11.4, 1.5);
      wBoard.position.set(0, 5.85, 1.68);
      const wSide = this._makeBuildingBoard("WINES & BEER", "18+ • OPEN", "#111827", "#facc15", 6.4, 1.2);
      wSide.rotation.y = Math.PI / 2;
      wSide.position.set(6.58, 5.85, -2.2);

      // Front Bike & Car Parking Lot + Cashier & Animated Customers!
      const wPark = new THREE.Mesh(this._boxGeo(13.0, 0.1, 3.6), this.mat.tarmacGrey);
      wPark.position.set(0, 0.12, 4.9);
      const wCar = this._makeVehicleMesh(false, false, 0x1e293b, false);
      wCar.position.set(4.0, 0.18, 4.9);
      [-4.2, -3.1, -2.0].forEach((sx, idx) => {
        const bike = new THREE.Mesh(this._boxGeo(0.42, 0.72, 1.25), idx === 1 ? this.mat.oyoRed : this.mat.cinemaObsidian);
        bike.position.set(sx, 0.52, 4.9);
        g.add(bike);
      });

      const clerk = this._createCharacter({ shirtMat: this.mat.wallWhite, pantsMat: this.mat.darkPants, scale: 0.9 });
      clerk.position.set(0, 0.65, 0.9);
      const cust1 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.94 });
      const cust2 = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(clerk, cust1, cust2);
      this.landmarkActors.push({ plotId, mesh: cust1, mode: "patrol_x", baseX: -1.6, baseZ: 2.65, range: 2.2, speed: 1.05, phase: 0 });
      this.landmarkActors.push({ plotId, mesh: cust2, mode: "patrol_z", baseX: 1.8, baseZ: 3.3, range: 1.3, speed: 1.15, phase: 1.6 });

      g.add(body, maroonBand, goldTrim1, goldTrim2, neonTube, counterBase, glassBack, wBoard, wSide, wPark, wCar);
      g.userData.labelY = 10.6;
      return g;
    }

    // 4-PLOT CENTRAL CITY PARK (`city_park`) — For @prathik_kumar_0018!
    if (type === "city_park") {
      const lawn = new THREE.Mesh(this._boxGeo(13.8, 0.2, 13.8), this.mat.turf);
      lawn.position.set(0, 0.12, 0);
      // Paved Walking / Jogging Loop Track!
      const trackRing = new THREE.Mesh(new THREE.RingGeometry(4.2, 5.6, 24), this.mat.sidewalk);
      trackRing.rotation.x = -Math.PI / 2;
      trackRing.position.set(0, 0.25, 0);

      // Central Tiered Water Fountain!
      const fPool = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.55, 16), this.mat.marble);
      fPool.position.set(0, 0.45, 0);
      const fWater = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.6, 14), this.mat.poolTileBlue);
      fWater.position.set(0, 0.48, 0);
      const fJet = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.55, 2.2, 8), this.mat.water);
      fJet.position.set(0, 1.55, 0);

      // Corner Shade Trees, Wooden Park Benches & Colorful Flower Beds!
      [[-5.2, -5.2], [5.2, -5.2], [-5.2, 5.2], [5.2, 5.2]].forEach(([tx, tz]) => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.1, 6), this.mat.treeTrunk);
        trunk.position.set(tx, 1.2, tz);
        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.55, 0), this.mat.treeLeaf);
        crown.position.set(tx, 2.75, tz);
        g.add(trunk, crown);
      });
      [[-3.6, 0], [3.6, 0], [0, -3.6]].forEach(([bx, bz], i) => {
        const bench = new THREE.Mesh(this._boxGeo(1.5, 0.42, 0.55), this.mat.wood);
        bench.position.set(bx, 0.45, bz);
        if (i < 2) bench.rotation.y = Math.PI / 2;
        g.add(bench);
      });
      // Garden Entrance Welcome Arch
      const archL = new THREE.Mesh(this._boxGeo(0.4, 3.1, 0.4), this.mat.wood);
      archL.position.set(-2.5, 1.7, 6.2);
      const archR = archL.clone();
      archR.position.x = 2.5;
      const pBoard = this._makeBuildingBoard(ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} PARK` : "CENTRAL CITY PARK", "WALKING TRACK • FOUNTAIN • KIDS ZONE", "#15803d", "#facc15", 6.6, 1.05);
      pBoard.position.set(0, 3.4, 6.2);

      const jogger = this._createCharacter({ shirtMat: this.mat.icePink, pantsMat: this.mat.darkPants, scale: 0.92 });
      g.add(jogger);
      this.landmarkActors.push({ plotId, mesh: jogger, mode: "patrol_x", baseX: 0, baseZ: 4.8, range: 4.2, speed: 1.5, phase: 0 });

      g.add(lawn, trackRing, fPool, fWater, fJet, archL, archR, pBoard);
      g.userData.labelY = 7.2;
      return g;
    }

    // 4-PLOT GRAND PUBLIC LIBRARY (`library`) — For @prathik_kumar_0018!
    if (type === "library") {
      const base = new THREE.Mesh(this._boxGeo(12.2, 0.65, 9.2), this.mat.marble);
      base.position.set(0, 0.42, -1.2);
      const hall = new THREE.Mesh(this._boxGeo(11.4, 5.4, 7.6), this.mat.stuccoIvory);
      hall.position.set(0, 3.4, -1.6);
      const roof = new THREE.Mesh(this._boxGeo(12.2, 0.6, 8.6), this.mat.slateTrim);
      roof.position.set(0, 6.35, -1.5);

      // 6 Classic White Neoclassical Pillars across Front Portico!
      for (let i = 0; i < 6; i++) {
        const px = -5.0 + i * 2.0;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 5.2, 8), this.mat.marble);
        col.position.set(px, 3.3, 2.8);
        g.add(col);
      }
      const frontWin = new THREE.Mesh(this._boxGeo(9.2, 3.2, 0.14), winMat);
      frontWin.position.set(0, 3.3, 2.25);
      frontWin.userData.isWindow = true;

      // GIANT 3D OPEN GOLDEN BOOK SCULPTURE ON THE ROOF!
      const bookGrp = new THREE.Group();
      bookGrp.position.set(0, 7.75, -1.2);
      const pageL = new THREE.Mesh(this._boxGeo(2.8, 0.22, 3.2), this.mat.wallWhite);
      pageL.position.set(-1.25, 0.25, 0);
      pageL.rotation.z = -0.32;
      const pageR = new THREE.Mesh(this._boxGeo(2.8, 0.22, 3.2), this.mat.wallWhite);
      pageR.position.set(1.25, 0.25, 0);
      pageR.rotation.z = 0.32;
      const cover = new THREE.Mesh(this._boxGeo(5.6, 0.2, 3.4), this.mat.templeGold);
      cover.position.set(0, -0.1, 0);
      bookGrp.add(pageL, pageR, cover);

      const libBoard = this._makeBuildingBoard(ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} LIBRARY` : "CENTRAL LIBRARY", "BOOKS • STUDY HALL • FREE WIFI", "#1e3a8a", "#facc15", 9.6, 1.25);
      libBoard.position.set(0, 6.35, 2.95);

      const reader = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.92 });
      g.add(reader);
      this.landmarkActors.push({ plotId, mesh: reader, mode: "patrol_x", baseX: 0, baseZ: 4.5, range: 3.0, speed: 0.95, phase: 0 });

      g.add(base, hall, roof, frontWin, bookGrp, libBoard);
      g.userData.labelY = 10.2;
      return g;
    }

    // 4-PLOT OLYMPIC SWIMMING POOL CLUB (`swimming_pool`) — For @xlomore_28!
    if (type === "swimming_pool") {
      const deck = new THREE.Mesh(this._boxGeo(13.8, 0.3, 13.8), this.mat.marble);
      deck.position.set(0, 0.18, 0);
      const poolRim = new THREE.Mesh(this._boxGeo(10.6, 0.42, 7.8), this.mat.wallWhite);
      poolRim.position.set(0, 0.28, 0.6);
      const water = new THREE.Mesh(this._boxGeo(9.8, 0.46, 7.0), this.mat.poolTileBlue);
      water.position.set(0, 0.3, 0.6);

      // Floating Red & White Olympic Lane Dividers!
      [-1.7, 0, 1.7].forEach((lz) => {
        const lane = new THREE.Mesh(this._boxGeo(9.4, 0.1, 0.14), this.mat.oyoRed);
        lane.position.set(0, 0.56, 0.6 + lz);
        g.add(lane);
      });

      // Diving Board Platform + Changing Room Club House at Back!
      const diveTower = new THREE.Mesh(this._boxGeo(1.1, 2.2, 1.2), this.mat.chrome);
      diveTower.position.set(-5.6, 1.35, 0.6);
      const diveBoard = new THREE.Mesh(this._boxGeo(2.4, 0.14, 0.75), this.mat.petrolYellow);
      diveBoard.position.set(-4.6, 2.45, 0.6);

      const clubHouse = new THREE.Mesh(this._boxGeo(11.6, 3.2, 3.1), this.mat.wallWhite);
      clubHouse.position.set(0, 1.85, -4.9);
      const clubRoof = new THREE.Mesh(this._boxGeo(12.2, 0.35, 3.6), this.mat.mobileBlue);
      clubRoof.position.set(0, 3.6, -4.9);

      // Poolside Loungers & Colorful Umbrellas!
      [-3.5, 0, 3.5].forEach((ux, i) => {
        const lgr = new THREE.Mesh(this._boxGeo(1.5, 0.28, 0.8), this.mat.wallWhite);
        lgr.position.set(ux, 0.48, 5.4);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 5), this.mat.chrome);
        pole.position.set(ux + 0.9, 1.25, 5.5);
        const top = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.35, 8), i === 1 ? this.mat.petrolYellow : this.mat.studioCyan);
        top.position.set(ux + 0.9, 2.25, 5.5);
        g.add(lgr, pole, top);
      });

      const poolOwner = (ownerName || "SHERU BHAI").replace(/^@/, "").toUpperCase();
      const spBoard = this._makeBuildingBoard(`${poolOwner} POOL`, "OLYMPIC SWIMMING POOL • CLUB", "#0284c7", "#facc15", 9.4, 1.25);
      spBoard.position.set(0, 4.35, -3.2);

      const coach = this._createCharacter({ shirtMat: this.mat.petrolYellow, pantsMat: this.mat.mobileBlue, scale: 0.92 });
      g.add(coach);
      this.landmarkActors.push({ plotId, mesh: coach, mode: "patrol_x", baseX: 0, baseZ: -2.8, range: 4.0, speed: 1.0, phase: 0 });

      g.add(deck, poolRim, water, diveTower, diveBoard, clubHouse, clubRoof, spBoard);
      g.userData.labelY = 7.6;
      return g;
    }

    // 4-PLOT REAL-STYLE INDIAN D-MART HYPERMARKET (`dmart`)
    if (type === "dmart") {
      const hall = new THREE.Mesh(new THREE.BoxGeometry(13.2, 6.0, 7.6), this.mat.wallWhite);
      hall.position.set(0, 3.05, -2.5);

      const greenFascia = new THREE.Mesh(new THREE.BoxGeometry(13.6, 1.85, 8.0), this.mat.dmartDeepGreen);
      greenFascia.position.set(0, 6.25, -2.5);
      const yellowMid = new THREE.Mesh(new THREE.BoxGeometry(13.7, 0.3, 8.1), this.mat.dmartYellow);
      yellowMid.position.set(0, 5.28, -2.5);
      const yellowTop = yellowMid.clone();
      yellowTop.position.y = 7.22;

      const upperWin = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.15, 0.14), winMat);
      upperWin.position.set(0, 4.35, 1.32);
      upperWin.userData.isWindow = true;

      // Iconic Tall Corner D-Mart Green & Yellow Architectural Pylon Tower
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.3, 8.4, 2.3), this.mat.dmartDeepGreen);
      pylon.position.set(-5.8, 4.25, 0.75);
      const pylonYellow1 = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.34, 2.42), this.mat.dmartYellow);
      pylonYellow1.position.set(-5.8, 7.6, 0.75);
      const pylonYellow2 = pylonYellow1.clone();
      pylonYellow2.position.y = 4.6;
      const pylonMiniLogo = this._makeBuildingBoard("DMart", "READY", "#15803d", "#facc15", 2.1, 1.35);
      pylonMiniLogo.position.set(-5.8, 6.2, 1.94);

      [-2.5, 2.5, 6.3].forEach((px) => {
        const pil = new THREE.Mesh(new THREE.BoxGeometry(0.55, 5.2, 0.55), this.mat.dmartBrightGreen);
        pil.position.set(px, 2.65, 1.38);
        g.add(pil);
      });
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.42, 2.4), this.mat.dmartDeepGreen);
      canopy.position.set(0.2, 3.45, 2.45);
      const canopyYellow = new THREE.Mesh(new THREE.BoxGeometry(6.72, 0.18, 2.5), this.mat.dmartYellow);
      canopyYellow.position.set(0.2, 3.22, 2.45);

      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(10.6, 2.95, 0.14), this.mat.glass);
      frontGlass.position.set(0.7, 1.62, 1.32);
      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.45, 0.18), this.mat.dmartDeepGreen);
      doorFrame.position.set(0.2, 1.35, 1.38);
      const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.2, 0.22), winMat);
      doorGlass.position.set(0.2, 1.28, 1.38);
      doorGlass.userData.isWindow = true;

      const aisleColors = [this.mat.dmartYellow, this.mat.dmartOfferRed, this.mat.wallBlue, this.mat.dmartBrightGreen];
      [-3.4, -0.9, 1.6, 4.1].forEach((ax, i) => {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.0, 3.6), this.mat.wallWhite);
        rack.position.set(ax, 1.15, -2.2);
        const goods = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.52, 3.2), aisleColors[i % aisleColors.length]);
        goods.position.set(ax, 1.65, -2.2);
        g.add(rack, goods);
      });
      [-2.1, 2.4].forEach((bx) => {
        const billDesk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.85, 0.65), this.mat.dmartDeepGreen);
        billDesk.position.set(bx, 0.52, 0.45);
        g.add(billDesk);
      });

      const ownerClean = (ownerName || "").trim();
      const dmartFront = this._makeDMartLogoBoard(ownerClean, 11.4, 1.72);
      dmartFront.position.set(0.8, 6.25, 1.54);
      const dmartSide = this._makeDMartLogoBoard("", 7.2, 1.5);
      dmartSide.rotation.y = Math.PI / 2;
      dmartSide.position.set(6.84, 6.25, -2.5);

      const entrySign = this._makeBuildingBoard("ENTRY ➔   •   ⬅ EXIT", "OPEN 8 AM – 10 PM", "#0f7638", "#facc15", 5.4, 0.68);
      entrySign.position.set(0.2, 3.48, 3.68);

      const cartBay = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 1.85), this.mat.sidewalk);
      cartBay.position.set(-4.3, 0.16, 2.65);
      const cartRail = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.56, 0.08), this.mat.dmartYellow);
      cartRail.position.set(-4.3, 0.52, 3.55);
      for (let c = 0; c < 5; c++) {
        const cx = -5.75 + c * 0.72;
        const basket = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.72), this.mat.cartChrome);
        basket.position.set(cx, 0.68, 2.65);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.08), this.mat.dmartDeepGreen);
        handle.position.set(cx, 0.96, 3.02);
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.34, 0.54), this.mat.charcoal);
        leg.position.set(cx, 0.32, 2.65);
        g.add(basket, handle, leg);
      }
      g.add(cartBay, cartRail);

      const offerBoard = this._makeBuildingBoard("MEGA OFFERS", "MIN 7% OFF MRP!", "#dc2626", "#facc15", 2.5, 1.45);
      offerBoard.position.set(4.3, 1.25, 2.55);
      const offerPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), this.mat.charcoal);
      offerPost.position.set(4.3, 0.55, 2.5);
      const guardCabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.1, 1.4), this.mat.dmartDeepGreen);
      guardCabin.position.set(5.9, 1.15, 2.6);
      const gcWin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 1.46), this.mat.glass);
      gcWin.position.set(5.9, 1.5, 2.6);
      g.add(offerBoard, offerPost, guardCabin, gcWin);

      const dPark = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.1, 3.9), this.mat.tarmacGrey);
      dPark.position.set(0, 0.13, 5.15);
      [-5.6, -2.8, 0.0, 2.8, 5.6].forEach((lx) => {
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2.9), this.mat.stripe);
        pl.rotation.x = -Math.PI / 2;
        pl.position.set(lx, 0.2, 5.15);
        g.add(pl);
      });
      [-3.0, -1.2, 1.6, 3.4].forEach((bx) => {
        const bol = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.65, 6), this.mat.dmartYellow);
        bol.position.set(bx, 0.45, 3.4);
        g.add(bol);
      });
      const dCar1 = this._makeVehicleMesh(false, false, 0x2563eb, false);
      dCar1.position.set(-4.2, 0.18, 5.15);
      const dCar2 = this._makeVehicleMesh(false, false, 0xef4444, false);
      dCar2.position.set(4.2, 0.18, 5.15);
      const dAuto = this._makeRealAutoMesh(false, false);
      dAuto.position.set(6.1, 0.18, 5.15);
      [-1.9, -1.0].forEach((sx) => {
        const scooter = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.72, 1.25), this.mat.wallCoral);
        scooter.position.set(sx, 0.52, 5.15);
        g.add(scooter);
      });
      g.add(dPark, dCar1, dCar2, dAuto);

      const guard = this._createCharacter({ shirtMat: this.mat.khakiUniform, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(guard);
      this.landmarkActors.push({ plotId, mesh: guard, mode: "guard", baseX: 2.2, baseZ: 2.35, range: 0.3, speed: 1.5, phase: 0 });
      const shop1 = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(shop1);
      this.landmarkActors.push({ plotId, mesh: shop1, mode: "patrol_z", baseX: -0.4, baseZ: 3.6, range: 1.6, speed: 1.3, phase: 0.4 });
      const shop2 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(shop2);
      this.landmarkActors.push({ plotId, mesh: shop2, mode: "patrol_x", baseX: 0.4, baseZ: 4.0, range: 2.1, speed: 1.1, phase: 2.1 });

      g.add(hall, greenFascia, yellowMid, yellowTop, upperWin, pylon, pylonYellow1, pylonYellow2, pylonMiniLogo, canopy, canopyYellow, frontGlass, doorFrame, doorGlass, dmartFront, dmartSide, entrySign);
      g.userData.labelY = 9.4;
      return g;
    }

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

  // ULTRA-CRISP FLOATING NAME SIGNS (High-Res Mipmapped on Admin HD; Ultra-Low-VRAM Cached on 2GB-4GB Phones!)
  _createNameSign(mainText, subText = "", isBig = false) {
    const hi = this.hqMode;
    const lite = this.isLowRam && !isBig && !hi;
    const key = `SPRITE|${hi ? 1 : lite ? 2 : 0}|${isBig ? 1 : 0}|${mainText}|${subText}`;
    let mat = this.signTexCache.get(key);

    if (!mat) {
      const canvas = document.createElement("canvas");
      canvas.width = isBig ? (hi ? 640 : 448) : (hi ? 400 : lite ? 224 : 320);
      canvas.height = subText
        ? (isBig ? (hi ? 164 : 120) : (hi ? 116 : lite ? 68 : 96))
        : (isBig ? (hi ? 116 : 88) : (hi ? 88 : lite ? 52 : 72));
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "rgba(8, 15, 32, 0.94)";
      ctx.beginPath();
      ctx.roundRect(5, 5, canvas.width - 10, canvas.height - 10, lite ? 12 : 18);
      ctx.fill();

      ctx.strokeStyle = isBig ? "#facc15" : "#38bdf8";
      ctx.lineWidth = isBig ? 5 : lite ? 3 : 4;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cx = canvas.width / 2;
      const maxW = canvas.width - 24;

      const cleanMain = mainText.length > 26 ? mainText.slice(0, 25) + "…" : mainText;
      ctx.lineJoin = "round";
      const fScale = hi ? 1.22 : lite ? 0.72 : 1.0;
      if (subText) {
        ctx.font = `800 ${Math.round((isBig ? 23 : 18) * fScale)}px sans-serif`;
        ctx.strokeStyle = "#020617";
        ctx.lineWidth = hi ? 5 : 3;
        ctx.strokeText(subText, cx, canvas.height * 0.3, maxW);
        ctx.fillStyle = "#facc15";
        ctx.fillText(subText, cx, canvas.height * 0.3, maxW);

        ctx.font = `900 ${Math.round((isBig ? 34 : 26) * fScale)}px sans-serif`;
        ctx.strokeText(cleanMain, cx, canvas.height * 0.68, maxW);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(cleanMain, cx, canvas.height * 0.68, maxW);
      } else {
        ctx.font = `900 ${Math.round((isBig ? 34 : 28) * fScale)}px sans-serif`;
        ctx.strokeStyle = "#020617";
        ctx.lineWidth = hi ? 5 : 3;
        ctx.strokeText(cleanMain, cx, canvas.height * 0.52, maxW);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(cleanMain, cx, canvas.height * 0.52, maxW);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.generateMipmaps = !lite;
      tex.minFilter = lite ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      if (!lite) tex.anisotropy = this.maxAnisotropy || 4;
      tex.colorSpace = THREE.SRGBColorSpace;
      mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      this.signTexCache.set(key, mat);
    }

    const sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 5;
    sprite.scale.set(isBig ? 13.0 : 6.2, subText ? (isBig ? 3.4 : 1.9) : (isBig ? 2.4 : 1.45), 1);
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
    if (this.discoGroup) this.discoGroup.visible = isNight;
    if (this.theaterDiscos) {
      this.theaterDiscos.forEach((td) => {
        if (td.nightGroup) td.nightGroup.visible = isNight;
      });
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
    this._updateBloomForTime();
  }

  getPlotWorldCenter(plotId) {
    if (plotId === "ST_JUNCTION") return { x: 0, y: 4, z: 0, size: 4 };
    if (plotId === "AIRPORT") return { x: this.airportX - 4, y: 5, z: 4, size: 12 };
    if (plotId === "BEACH") return { x: this.beachX + 6, y: 4, z: -2, size: 12 };
    if (plotId === "RAILWAY_STATION") return { x: 0, y: 5, z: this.railwayZ, size: 12 };
    if (plotId === "RAILWAY_SOUTH") return { x: 0, y: 5, z: this.railwaySouthZ, size: 12 };
    if (plotId === "HILL_TEMPLE") return { x: this.hillTemplePos.x, y: 18, z: this.hillTemplePos.z - 2, size: 12 };
    if (plotId === "ADD_AIRPORT_PLOT") return { x: this.airportX - 39, y: 2, z: 56, size: 1 };
    if (plotId === "ADD_BEACH_PLOT") return { x: this.beachX + 22, y: 2, z: 16, size: 1 };
    const customData = this.plotDataMap.get(plotId);
    if (customData && customData.isCustomZone) {
      const cx = (customData.zone === "beach" ? this.beachX : this.airportX) + (customData.offsetX || 0);
      const cz = customData.offsetZ || 0;
      const sz = customData.status === "built" ? (customData.size || getRequiredSize(customData.buildingType)) : 1;
      return { x: cx, y: 2.5, z: cz, size: sz };
    }
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

  /**
   * ✨ ULTRA HD / LITE QUALITY CONTROLLER (2x Retina sharpness + Crisp Distance Labels for Reels!)
   */
  setQualityMode(isHD) {
    this.hqMode = Boolean(isHD);
    const pr = this.hqMode
      ? Math.min(window.devicePixelRatio || 2, 2.0)
      : (this.isLowRam ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.35));
    this.renderer.setPixelRatio(pr);
    const w = this.container.clientWidth || window.innerWidth || 360;
    const h = this.container.clientHeight || window.innerHeight || 640;
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setPixelRatio(pr);
      this.composer.setSize(w, h);
    }
    this.renderer.toneMappingExposure = this.hqMode ? 1.14 : 1.08;
  }

  /**
   * 📐 REEL WIDE-ANGLE FRAMING (48° cinematic FOV in 9:16 Reel Mode so full buildings & stations never crop!)
   */
  setReelFraming(active) {
    this.isReelFraming = Boolean(active);
    this.camera.fov = this.isReelFraming ? 48 : 42;
    this.camera.updateProjectionMatrix();
  }

  /**
   * 🎥 PORTRAIT-AWARE WIDE FRAMING CALCULATOR (Fixes ALL Over-Zoom on 9:16 Mobile Screens!)
   * Automatically pulls back cleanly on narrow vertical screens so the ENTIRE house, yard,
   * 2-platform station, airport, or 8-plot showroom fits comfortably in frame!
   */
  _getWideDist(baseDist) {
    const aspect = this.camera.aspect || 0.56;
    const portraitBoost = aspect < 0.85
      ? THREE.MathUtils.clamp(0.96 / Math.max(aspect, 0.44), 1.3, 1.82)
      : 1.0;
    return baseDist * portraitBoost;
  }

  _getTargetFraming(plotId, size = 1) {
    if (plotId === "ST_JUNCTION") return { dist: this._getWideDist(28), heightRatio: 0.72 };
    if (plotId === "AIRPORT") return { dist: this._getWideDist(76), heightRatio: 0.58 };
    if (plotId === "BEACH") return { dist: this._getWideDist(72), heightRatio: 0.56 };
    if (plotId === "RAILWAY_STATION" || plotId === "RAILWAY_SOUTH") return { dist: this._getWideDist(56), heightRatio: 0.58 };
    if (plotId === "HILL_TEMPLE") return { dist: this._getWideDist(72), heightRatio: 0.62 };
    if (size === 8) return { dist: this._getWideDist(48), heightRatio: 0.72 };
    if (size === 4) return { dist: this._getWideDist(35), heightRatio: 0.76 };
    if (size === 2) return { dist: this._getWideDist(29), heightRatio: 0.78 };
    return { dist: this._getWideDist(23), heightRatio: 0.8 };
  }

  focusPlot(plotId, fastSpeed = 0.1) {
    const center = this.getPlotWorldCenter(plotId);
    const fr = this._getTargetFraming(plotId, center.size);
    const dist = fr.dist;
    const h = Math.max(14, dist * fr.heightRatio);

    this.cameraGoal = {
      target: new THREE.Vector3(center.x, center.y, center.z),
      camPos: new THREE.Vector3(center.x + dist * 0.75, h, center.z + dist * 0.75),
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
    this.stopAllReelModes();
    const stops = [];
    const rr = this.ringRadius || 48;

    // 1. Wide Establishing Skyline Shot (Shows Entire City + Araku Mountains!)
    const overD = this._getWideDist(Math.max(115, rr * 2.1));
    stops.push({
      tag: "WELCOME TO",
      name: this.townName.toUpperCase(),
      target: new THREE.Vector3(0, 4, 0),
      camPos: new THREE.Vector3(overD * 0.72, overD * 0.76, overD * 0.72),
      duration: 2.0,
      speed: 0.12,
      plotId: null
    });

    // 2. Full White Marble Lion Sheru Bhai Statue + Fountain Roundabout
    const stFr = this._getTargetFraming("ST_JUNCTION", 4);
    stops.push({
      tag: "CITY CENTER",
      name: "🦁 SHERU BHAI • ST JUNCTION",
      target: new THREE.Vector3(0, 5.5, 0),
      camPos: new THREE.Vector3(stFr.dist * 0.72, stFr.dist * stFr.heightRatio, stFr.dist * 0.72),
      duration: 2.0,
      speed: 0.14,
      plotId: "ST_JUNCTION"
    });

    // 3. Full 20-Acre International Airport + Diamond Helicopter + Parking
    const apFr = this._getTargetFraming("AIRPORT", 12);
    stops.push({
      tag: "20-ACRE INTERNATIONAL AIRPORT",
      name: "✈️ SHERU BHAI AIRPORT & DIAMOND HELI",
      target: new THREE.Vector3(this.airportX - 4, 5, 10),
      camPos: new THREE.Vector3(this.airportX - apFr.dist * 0.75, apFr.dist * 0.56, 10 + apFr.dist * 0.72),
      duration: 2.8,
      speed: 0.12,
      plotId: "AIRPORT"
    });

    // 4. Full Golden Beach + Sheru Bhai Chilling + Beach Villa
    const bFr = this._getTargetFraming("BEACH", 12);
    stops.push({
      tag: "GOLDEN SAND BEACH & VILLA",
      name: `🏖️ SHERU BHAI BEACH • ${this.beachOwner || "@follower_beach"}`,
      target: new THREE.Vector3(this.beachX + 8, 4, -2),
      camPos: new THREE.Vector3(this.beachX - bFr.dist * 0.68, bFr.dist * 0.54, bFr.dist * 0.68),
      duration: 2.6,
      speed: 0.12,
      plotId: "BEACH"
    });

    // 5. Full 2-Platform Railway Station + Steps + Parking + Both Trains
    const rFr = this._getTargetFraming("RAILWAY_STATION", 12);
    stops.push({
      tag: "2-PLATFORM RAILWAY STATION",
      name: `🚂 SHERU BHAI JN • ${this.railwayOwner || "@_ur_bunny_108_"}`,
      target: new THREE.Vector3(0, 4, this.railwayZ),
      camPos: new THREE.Vector3(rFr.dist * 0.68, rFr.dist * 0.56, this.railwayZ + rFr.dist * 0.74),
      duration: 2.8,
      speed: 0.12,
      plotId: "RAILWAY_STATION"
    });

    const landmarks = [];
    const houses = [];
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (!p || p.status !== "built") return;
      const sz = p.size || getRequiredSize(p.buildingType);
      if (sz >= 2) landmarks.push({ pid, p, sz });
      else houses.push({ pid, p, idx: parseInt(pid.replace("plot_", ""), 10) || 0 });
    });

    landmarks.slice(0, 5).forEach((lm, i) => {
      const c = this.getPlotWorldCenter(lm.pid);
      const fr = this._getTargetFraming(lm.pid, lm.sz);
      const side = i % 2 === 0 ? 1 : -1;
      stops.push({
        tag: lm.sz === 8 ? "8-PLOT MEGA LANDMARK" : lm.sz === 2 ? "2-PLOT STUDIO" : "TOWN LANDMARK",
        name: lm.p.ownerName || BUILDING_LABELS[lm.p.buildingType],
        target: new THREE.Vector3(c.x, c.y + 1, c.z),
        camPos: new THREE.Vector3(c.x + fr.dist * 0.72 * side, fr.dist * fr.heightRatio, c.z + fr.dist * 0.72),
        duration: 2.0,
        speed: 0.15,
        plotId: lm.pid
      });
    });

    houses.sort((a, b) => (b.p.builtDay || 1) - (a.p.builtDay || 1) || b.idx - a.idx);
    houses.slice(0, 6).forEach((h, i) => {
      const c = this.getPlotWorldCenter(h.pid);
      const fr = this._getTargetFraming(h.pid, 1);
      const side = i % 2 === 0 ? 1 : -1;
      stops.push({
        tag: `NEWLY ADDED • DAY ${h.p.builtDay || 1}`,
        name: h.p.ownerName || "New Resident",
        target: new THREE.Vector3(c.x, c.y + 1.2, c.z),
        camPos: new THREE.Vector3(c.x + fr.dist * 0.72 * side, fr.dist * fr.heightRatio, c.z + fr.dist * 0.72),
        duration: 1.7,
        speed: 0.18,
        plotId: h.pid
      });
    });

    stops.push({
      tag: "FOLLOW TO JOIN!",
      name: `${landmarks.length + houses.length} PLACES BUILT`,
      target: new THREE.Vector3(0, 4, 0),
      camPos: new THREE.Vector3(-overD * 0.75, overD * 0.8, overD * 0.75),
      duration: 2.4,
      speed: 0.1,
      plotId: null
    });

    this.proReelTour = { active: true, stops, idx: 0, timer: 0, onStopChange, onComplete };
    this._applyTourStop(0);
  }

  _applyTourStop(index) {
    const s = this.proReelTour.stops[index];
    if (!s) return;
    this.cameraGoal = { target: s.target.clone(), camPos: s.camPos.clone(), speed: s.speed };
    if (s.plotId && !["ST_JUNCTION", "AIRPORT", "BEACH", "RAILWAY_STATION", "RAILWAY_SOUTH"].includes(s.plotId)) {
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
   * 🚁 REBUILT HIGH-QUALITY PRO DRONE VIEW:
   *    SOUTH WELCOME ARCH -> CENTRAL AVENUE -> WHITE MARBLE LION SHERU BHAI STATUE -> ALL OVER CITY!
   * - Framed cleanly at wide, non-over-zoomed cinema heights so ENTIRE houses, full 2-platform stations,
   *   hollow mountain tunnels, 20-Acre Airport, Golden Beach & Araku waterfalls look razor-sharp!
   */
  startDroneView(onStop = null) {
    this.stopAllReelModes();
    this.cameraGoal = null;
    this.autoSpin = false;

    const rr = this.ringRadius || 48;
    const ax = this.airportX || rr + 78;
    const bx = this.beachX || -(rr + 76);
    const rz = this.railROuter || rr + 28;
    const wfR = rr + 132;

    const archStartPos = new THREE.Vector3(0, 15.5, rr + 34);
    const pts = [
      archStartPos,                                             // 1. Grand Approach framing the ENTIRE Welcome Arch + City!
      new THREE.Vector3(0, 12.0, rr + 6),                       // 2. Smooth glide directly over/through the Welcome Arch
      new THREE.Vector3(0, 13.5, rr - 14),                      // 3. Down Central Avenue showing full houses on BOTH sides
      new THREE.Vector3(4, 16.0, 26),                           // 4. Approaching City Center Sheru Bhai Statue
      new THREE.Vector3(24, 18.5, 16),                          // 5. Wide Heroic Orbit around White Marble Lion Statue (East)
      new THREE.Vector3(22, 20.0, -18),                         // 6. Wide Heroic Orbit around Lion Statue (North-East)
      new THREE.Vector3(-22, 22.0, -16),                        // 7. Wide Heroic Orbit around Lion Statue (North-West)
      new THREE.Vector3(-rr * 0.65, 34, -rr * 0.55),            // 8. High Wide Sweep over NW City Blocks & Landmarks
      new THREE.Vector3(-rz * 0.45, 32, -rz - 18),              // 9. Wide View of NW Hollow Mountain Tunnel & Waterfall
      new THREE.Vector3(10, 32, -rz + 18),                      // 10. Full Wide Framing of North 2-Platform Railway Station & Parking
      new THREE.Vector3(44, 38, -(rr + 28)),                    // 11a. Dramatic Glide past Glowing Sacred Hilltop Temple Mountain & Steps!
      new THREE.Vector3(wfR * 0.42, 52, -wfR * 0.68),           // 11b. Majestic Araku Misty Mountains, North River & NE Waterfall
      new THREE.Vector3(ax - 32, 42, -22),                      // 12. Wide Overview of 20-Acre Airport Terminal & Runway
      new THREE.Vector3(ax - 36, 34, 48),                       // 13. Airport Parking, Diamond Heli & Airport Colony Boulevard
      new THREE.Vector3(rr * 0.55, 36, rr * 0.55),              // 14. Sweep back across SE City Blocks & 5-Floor Towers
      new THREE.Vector3(rz * 0.42, 30, rz + 24),                // 15. Wide View of SE Araku Mountain Tunnel & South Station
      new THREE.Vector3(-14, 32, rz + 28),                      // 16. Opposite 2-Platform South Railway Station (Araku South Jn)
      new THREE.Vector3(-wfR * 0.44, 44, wfR * 0.56),           // 17. SW Coastal Waterfall & South Valley River
      new THREE.Vector3(bx + 24, 34, 24),                       // 18. Wide Panorama over Sheru Bhai Golden Beach, Waves & Villa
      new THREE.Vector3(-rr * 0.6, 32, rr * 0.45),              // 19. Final Wide Sweep across SW City Skyline
      new THREE.Vector3(-18, 22, rr + 28)                       // 20. Smooth return curve back to South Welcome Arch!
    ];

    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.48);
    const totalLen = curve.getLength();
    const normalizedSpeed = 30 / Math.max(totalLen, 220);

    // Place camera cleanly at the Welcome Arch opening shot looking straight through Arch to the Lion Statue!
    this.camera.position.copy(archStartPos);
    const initialLook = new THREE.Vector3(0, 6.5, rr - 14);
    this.controls.target.copy(initialLook);

    this.droneTour = {
      active: true,
      curve,
      t: 0,
      speed: normalizedSpeed,
      smoothTarget: initialLook.clone(),
      bankAngle: 0,
      onStop
    };
  }

  stopDroneView() {
    this.droneTour.active = false;
    this.camera.up.set(0, 1, 0);
    if (this.droneTour.onStop) {
      const cb = this.droneTour.onStop;
      this.droneTour.onStop = null;
      cb();
    }
  }

  replayPlotConstruction(plotId) {
    const data = this.plotDataMap.get(plotId);
    if (!data || data.status !== "built") return;
    this.renderPlot(plotId, data, true);
  }

  startSingleBuildReel(plotId, data) {
    this.stopAllReelModes();
    this.autoSpin = false;

    const c = this.getPlotWorldCenter(plotId);
    const sz = data?.size || getRequiredSize(data?.buildingType || "house_blue");
    const fr = this._getTargetFraming(plotId, sz);
    const dist = fr.dist;
    const startAng = Math.atan2(this.camera.position.z - c.z, this.camera.position.x - c.x);

    const stops = [
      {
        tag: `🏗️ CONSTRUCTING • DAY ${data?.builtDay || 1}`,
        name: data?.ownerName || BUILDING_LABELS[data?.buildingType] || "Building",
        target: new THREE.Vector3(c.x, c.y + 1.2, c.z),
        camPos: new THREE.Vector3(c.x + Math.cos(startAng) * dist, dist * fr.heightRatio, c.z + Math.sin(startAng) * dist),
        orbitRadius: dist,
        orbitHeight: dist * fr.heightRatio,
        orbitStartAng: startAng,
        orbitSpeed: 0.36,
        duration: 4.2,
        speed: 0.13,
        plotId,
        triggerBuild: true
      }
    ];

    this.buildReelTour = {
      active: true,
      stops,
      idx: 0,
      timer: 0,
      onStopChange: null,
      onComplete: null
    };
    this._applyBuildReelStop(0);
  }

  startBuildReelTour(allPlotsObj, onStopChange, onComplete) {
    this.stopAllReelModes();
    this.autoSpin = false;

    const builtList = [];
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (!p || p.status !== "built") return;
      const sz = p.size || getRequiredSize(p.buildingType);
      const numIdx = pid.startsWith("zone_") ? 99999 : (parseInt(pid.replace("plot_", ""), 10) || 0);
      builtList.push({
        pid,
        p,
        sz,
        day: p.builtDay || 1,
        idx: numIdx
      });
    });

    if (builtList.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    builtList.sort((a, b) => b.day - a.day || b.sz - a.sz || b.idx - a.idx);
    const maxDay = builtList[0].day;
    let featured = builtList.filter((item) => item.day === maxDay).slice(0, 8);
    if (featured.length < 3) {
      featured = builtList.slice(0, 6);
    }

    const stops = [];
    const stFr = this._getTargetFraming("ST_JUNCTION", 4);

    stops.push({
      tag: `DAY ${maxDay} • LIVE CONSTRUCTION REEL`,
      name: `🦁 ${this.townName.toUpperCase()}`,
      target: new THREE.Vector3(0, 5.5, 0),
      camPos: new THREE.Vector3(stFr.dist * 0.72, stFr.dist * stFr.heightRatio, stFr.dist * 0.72),
      orbitRadius: stFr.dist,
      orbitHeight: stFr.dist * stFr.heightRatio,
      orbitStartAng: 0.78,
      orbitSpeed: 0.28,
      duration: 1.8,
      speed: 0.14,
      plotId: null,
      triggerBuild: false
    });

    featured.forEach((item, i) => {
      const c = this.getPlotWorldCenter(item.pid);
      const fr = this._getTargetFraming(item.pid, item.sz);
      const ang = i % 2 === 0 ? 0.65 : 2.35;
      stops.push({
        tag: `🏗️ CONSTRUCTING • DAY ${item.day}`,
        name: item.p.ownerName || BUILDING_LABELS[item.p.buildingType] || "New Building",
        target: new THREE.Vector3(c.x, c.y + 1.2, c.z),
        camPos: new THREE.Vector3(c.x + Math.cos(ang) * fr.dist, fr.dist * fr.heightRatio, c.z + Math.sin(ang) * fr.dist),
        orbitRadius: fr.dist,
        orbitHeight: fr.dist * fr.heightRatio,
        orbitStartAng: ang,
        orbitSpeed: i % 2 === 0 ? 0.32 : -0.32,
        duration: 3.2,
        speed: 0.13,
        plotId: item.pid,
        triggerBuild: true
      });
    });

    const rr = this.ringRadius || 48;
    const endD = this._getWideDist(Math.max(120, rr * 2.15));
    stops.push({
      tag: "COMMENT TO BUILD YOURS!",
      name: `${builtList.length} PLACES LIVE`,
      target: new THREE.Vector3(0, 6, 0),
      camPos: new THREE.Vector3(-endD * 0.72, endD * 0.76, endD * 0.72),
      orbitRadius: 0,
      duration: 2.4,
      speed: 0.08,
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

  // =========================================================
  // 🎬 PRO REEL STUDIO v23 ENGINE METHODS (ADMIN ONLY)
  // =========================================================
  setSimSpeed(mult) {
    this.simSpeed = mult || 1.0;
  }

  _getSkyPreset(mode) {
    if (mode === "night") {
      return { bg: 0x0b1120, fog: 0x0b1120, sunCol: 0x60a5fa, sunInt: 0.45, hemiInt: 0.34 };
    }
    if (mode === "sunset") {
      return { bg: 0xf97316, fog: 0xfb923c, sunCol: 0xfdba74, sunInt: 1.12, hemiInt: 0.65 };
    }
    return { bg: 0x87ceeb, fog: 0x9bd7f0, sunCol: 0xfffbeb, sunInt: 1.24, hemiInt: 1.02 };
  }

  _applyNightEffects(isNight, mode) {
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
    if (this.discoGroup) this.discoGroup.visible = isNight;
    if (this.theaterDiscos) {
      this.theaterDiscos.forEach((td) => {
        if (td.nightGroup) td.nightGroup.visible = isNight;
      });
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
    this._updateBloomForTime();
  }

  transitionTimeOfDay(targetMode, duration = 2.4) {
    const target = this._getSkyPreset(targetMode);
    this.skyTransition = {
      active: true,
      timer: 0,
      duration,
      fromBg: this.scene.background.clone(),
      toBg: new THREE.Color(target.bg),
      fromFog: this.scene.fog.color.clone(),
      toFog: new THREE.Color(target.fog),
      fromSunCol: this.sunLight.color.clone(),
      toSunCol: new THREE.Color(target.sunCol),
      fromSunInt: this.sunLight.intensity,
      toSunInt: target.sunInt,
      fromHemiInt: this.hemiLight.intensity,
      toHemiInt: target.hemiInt,
      targetMode,
      toggledNightProps: false
    };
  }

  stopAllReelModes() {
    if (this.proReelTour.active) this.stopProReelTour();
    if (this.droneTour.active) this.stopDroneView();
    if (this.buildReelTour.active) this.stopBuildReelTour();
    if (this.chaseCam.active) this.stopChaseCam();
    if (this.timelapseState.active) this.stopGrowthTimelapse();
    if (this.hyperlapse24h.active) this.stop24HourHyperlapse();
    if (this.discoOutro.active) this.stopDiscoOutro();
    if (this.streetWalk.active) this.stopStreetWalk();
    this.cameraGoal = null;
    this.autoSpin = false;
  }

  startChaseCam(mode, onStop = null) {
    this.stopAllReelModes();
    this.chaseCam = {
      active: true,
      mode,
      smoothTarget: this.controls.target.clone(),
      onStop
    };
  }

  stopChaseCam() {
    this.chaseCam.active = false;
    this.chaseCam.mode = null;
    if (this.chaseCam.onStop) {
      const cb = this.chaseCam.onStop;
      this.chaseCam.onStop = null;
      cb();
    }
  }

  startGrowthTimelapse(allPlotsObj, onStopChange, onComplete) {
    this.stopAllReelModes();
    const daySet = new Set();
    const entries = [];
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (p && p.status === "built") {
        const d = p.builtDay || 1;
        daySet.add(d);
        entries.push({ pid, day: d });
      }
    });
    const days = Array.from(daySet).sort((a, b) => a - b);
    if (days.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    const savedVis = [];
    entries.forEach((e) => {
      const grp = this.plotMeshes.get(e.pid);
      if (grp) {
        savedVis.push({ grp, pid: e.pid, day: e.day });
        if (e.day > days[0]) {
          grp.visible = false;
        }
      }
    });

    this.timelapseState = {
      active: true,
      days,
      dayIdx: 0,
      timer: 0,
      savedVis,
      onStopChange,
      onComplete
    };

    const countDay0 = savedVis.filter((s) => s.day <= days[0]).length;
    if (onStopChange) onStopChange("📈 CITY GROWTH TIMELAPSE", `DAY ${days[0]} • ${countDay0} PLACES`);
  }

  stopGrowthTimelapse() {
    if (!this.timelapseState.active) return;
    this.timelapseState.active = false;
    this.timelapseState.savedVis.forEach((s) => {
      s.grp.visible = true;
      s.grp.scale.set(1, 1, 1);
    });
    this.timelapseState.savedVis = [];
    if (this.timelapseState.onComplete) {
      const cb = this.timelapseState.onComplete;
      this.timelapseState.onComplete = null;
      cb();
    }
  }

  start24HourHyperlapse(onStop = null) {
    this.stopAllReelModes();
    this.hyperlapse24h = {
      active: true,
      timer: 0,
      duration: 10.0,
      prevSpeed: this.simSpeed,
      prevMode: this.timeOfDay,
      onStop
    };
    this.simSpeed = 2.4;
  }

  stop24HourHyperlapse() {
    if (!this.hyperlapse24h.active) return;
    this.hyperlapse24h.active = false;
    this.simSpeed = this.hyperlapse24h.prevSpeed || 1.0;
    this.setTimeOfDay(this.hyperlapse24h.prevMode || "day");
    if (this.hyperlapse24h.onStop) {
      const cb = this.hyperlapse24h.onStop;
      this.hyperlapse24h.onStop = null;
      cb();
    }
  }

  startRandomFollowerReel(allPlotsObj, onStopChange, onComplete) {
    this.stopAllReelModes();
    const candidates = [];
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (p && p.status === "built" && p.ownerName) {
        candidates.push({ pid, p, sz: p.size || getRequiredSize(p.buildingType) });
      }
    });
    if (candidates.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const picks = candidates.slice(0, Math.min(6, candidates.length));
    const winner = picks[picks.length - 1];

    const stops = [];
    picks.slice(0, -1).forEach((item, i) => {
      const c = this.getPlotWorldCenter(item.pid);
      const hopD = this._getWideDist(30);
      stops.push({
        tag: "🎲 PICKING LUCKY FOLLOWER...",
        name: item.p.ownerName,
        target: new THREE.Vector3(c.x, c.y + 1, c.z),
        camPos: new THREE.Vector3(c.x + (i % 2 === 0 ? hopD * 0.72 : -hopD * 0.72), hopD * 0.85, c.z + hopD * 0.72),
        orbitRadius: 0,
        duration: 0.65,
        speed: 0.24,
        plotId: item.pid,
        triggerBuild: false
      });
    });

    const wc = this.getPlotWorldCenter(winner.pid);
    const wFr = this._getTargetFraming(winner.pid, winner.sz);
    stops.push({
      tag: "🏆 TODAY'S VIP FOLLOWER!",
      name: winner.p.ownerName,
      target: new THREE.Vector3(wc.x, wc.y + 1.2, wc.z),
      camPos: new THREE.Vector3(wc.x + wFr.dist * 0.72, wFr.dist * wFr.heightRatio, wc.z + wFr.dist * 0.72),
      orbitRadius: wFr.dist,
      orbitHeight: wFr.dist * wFr.heightRatio,
      orbitStartAng: 0.78,
      orbitSpeed: 0.36,
      duration: 4.0,
      speed: 0.14,
      plotId: winner.pid,
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

  startDiscoOutro(onStop = null) {
    this.stopAllReelModes();
    this.transitionTimeOfDay("night", 1.5);
    this.discoOutro = {
      active: true,
      timer: 0,
      duration: 6.5,
      onStop
    };
  }

  stopDiscoOutro() {
    if (!this.discoOutro.active) return;
    this.discoOutro.active = false;
    if (this.discoOutro.onStop) {
      const cb = this.discoOutro.onStop;
      this.discoOutro.onStop = null;
      cb();
    }
  }

  startStreetWalk(onStop = null) {
    this.stopAllReelModes();
    const rr = this.ringRadius || 48;
    const pts = [
      new THREE.Vector3(0, 5.4, rr + 2),
      new THREE.Vector3(0, 5.4, rr * 0.55),
      new THREE.Vector3(0, 5.4, 17.5),
      new THREE.Vector3(12.5, 5.8, 12.5),
      new THREE.Vector3(12.5, 5.8, -12.5),
      new THREE.Vector3(0, 5.4, -17.5),
      new THREE.Vector3(0, 5.4, -(rr - 6)),
      new THREE.Vector3(rr * 0.48, 5.8, -(rr - 6)),
      new THREE.Vector3(rr * 0.48, 5.8, rr - 6)
    ];
    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.38);
    const totalLen = curve.getLength();
    this.streetWalk = {
      active: true,
      curve,
      t: 0,
      speed: 12.5 / Math.max(totalLen, 100),
      smoothTarget: this.controls.target.clone(),
      onStop
    };
  }

  stopStreetWalk() {
    if (!this.streetWalk.active) return;
    this.streetWalk.active = false;
    if (this.streetWalk.onStop) {
      const cb = this.streetWalk.onStop;
      this.streetWalk.onStop = null;
      cb();
    }
  }

  startCustomShotList(shotItems, replayConstruction, onStopChange, onComplete) {
    this.stopAllReelModes();
    if (!shotItems || shotItems.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    const stops = shotItems.map((item, i) => {
      const c = this.getPlotWorldCenter(item.id);
      const isSpecial = ["ST_JUNCTION", "AIRPORT", "BEACH", "RAILWAY_STATION", "RAILWAY_SOUTH"].includes(item.id);
      const fr = this._getTargetFraming(item.id, c.size);
      const ang = i % 2 === 0 ? 0.65 : 2.35;
      return {
        tag: isSpecial ? "CITY LANDMARK" : (replayConstruction ? `🏗️ CONSTRUCTING • DAY ${item.day || 1}` : `DAY ${item.day || 1} SPOTLIGHT`),
        name: item.label,
        target: new THREE.Vector3(c.x, c.y + 1.2, c.z),
        camPos: new THREE.Vector3(c.x + Math.cos(ang) * fr.dist, fr.dist * fr.heightRatio, c.z + Math.sin(ang) * fr.dist),
        orbitRadius: fr.dist,
        orbitHeight: fr.dist * fr.heightRatio,
        orbitStartAng: ang,
        orbitSpeed: i % 2 === 0 ? 0.3 : -0.3,
        duration: replayConstruction && !isSpecial ? 3.2 : 2.8,
        speed: 0.13,
        plotId: isSpecial ? null : item.id,
        triggerBuild: Boolean(replayConstruction && !isSpecial)
      };
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

  // =========================================================
  // ✨ v26 CINEMA FX (ADMIN REEL MODE ONLY):
  //    1. Real Soft Sun Shadows (PCFSoftShadowMap following camera)
  //    2. Neon Cinema Bloom / Glow (Lazy-loaded UnrealBloomPass)
  //    3. Hero .glb 3D Model Loader (GLTFLoader with auto-fit)
  // =========================================================
  _applyShadowFlags(rootGroup) {
    if (!rootGroup) return;
    const on = this.shadowsEnabled;
    rootGroup.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.material === this.mat.invisibleHitbox) return;
      if (obj.material && obj.material.blending === THREE.AdditiveBlending) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        return;
      }
      const geo = obj.geometry;
      const p = geo?.parameters;
      const isFlatPlane = geo?.type === "PlaneGeometry" || geo?.type === "RingGeometry" || (p && typeof p.height === "number" && p.height <= 0.45);
      if (isFlatPlane) {
        obj.castShadow = false;
        obj.receiveShadow = on;
      } else {
        obj.castShadow = on;
        obj.receiveShadow = on;
      }
    });
  }

  /**
   * ☀️ REAL SOFT SUN SHADOWS (Admin Reel Mode Only — Zero cost for public visitors!)
   */
  setShadowsEnabled(enabled) {
    this.shadowsEnabled = Boolean(enabled);
    this.renderer.shadowMap.enabled = this.shadowsEnabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Half-rate shadow refresh cuts GPU shadow cost by 50% for smooth 60fps Reel recording!
    this.renderer.shadowMap.autoUpdate = false;
    this.sunLight.castShadow = this.shadowsEnabled;

    this._applyShadowFlags(this.cityGroup);
    this._applyShadowFlags(this.plotsGroup);
    this._applyShadowFlags(this.vehiclesGroup);
    this.renderer.shadowMap.needsUpdate = true;
  }

  _updateBloomForTime() {
    if (!this.bloomPass) return;
    if (this.timeOfDay === "night") {
      // Dramatic cinema glow for Disco Statue beams, Theater Sky Lights, Train Headlights & Neon Shops!
      this.bloomPass.threshold = 0.46;
      this.bloomPass.strength = 0.72;
      this.bloomPass.radius = 0.56;
    } else if (this.timeOfDay === "sunset") {
      this.bloomPass.threshold = 0.72;
      this.bloomPass.strength = 0.36;
      this.bloomPass.radius = 0.42;
    } else {
      // Subtle crisp specular bloom in Daylight so colors stay vibrant and never washed out!
      this.bloomPass.threshold = 0.86;
      this.bloomPass.strength = 0.22;
      this.bloomPass.radius = 0.35;
    }
  }

  /**
   * ✨ NEON CINEMA BLOOM / GLOW EFFECT (Lazy-loaded ONLY when Admin enters Reel Mode!)
   */
  async enableCinemaBloom(enabled) {
    if (!enabled) {
      this.bloomEnabled = false;
      return;
    }
    if (this.composer && this.bloomPass) {
      this.bloomEnabled = true;
      this._updateBloomForTime();
      return;
    }
    if (this._bloomLoading) return;
    this._bloomLoading = true;
    try {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
        import("three/addons/postprocessing/EffectComposer.js"),
        import("three/addons/postprocessing/RenderPass.js"),
        import("three/addons/postprocessing/UnrealBloomPass.js"),
        import("three/addons/postprocessing/OutputPass.js")
      ]);
      const w = this.container.clientWidth || window.innerWidth || 360;
      const h = this.container.clientHeight || window.innerHeight || 640;
      const composer = new EffectComposer(this.renderer);
      composer.setPixelRatio(this.renderer.getPixelRatio());
      composer.setSize(w, h);
      composer.addPass(new RenderPass(this.scene, this.camera));
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(Math.floor(w * 0.5), Math.floor(h * 0.5)), 0.35, 0.45, 0.72);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
      this.composer = composer;
      this.bloomPass = bloomPass;
      this.bloomEnabled = true;
      this._updateBloomForTime();
    } catch (err) {
      console.warn("Cinema Bloom fallback to standard renderer:", err);
      this.bloomEnabled = false;
    } finally {
      this._bloomLoading = false;
    }
  }

  /**
   * 🚗 HERO .GLB 3D MODELS LOADER (Sheru Bhai Statue, Audi Hero Car, Diamond Helicopter!)
   * Auto-scales, auto-centers, and seamlessly swaps in any lightweight .glb while keeping built-in 3D as instant fallback!
   */
  setHeroModelUrls(urls = {}) {
    const clean = {
      statue: (urls.statue || "").trim(),
      audi: (urls.audi || "").trim(),
      heli: (urls.heli || "").trim()
    };
    const prev = this.heroModelUrls || { statue: "", audi: "", heli: "" };
    this.heroModelUrls = clean;

    if (clean.statue !== prev.statue && this.heroStatueSlot) {
      this._applyHeroSlot("statue", clean.statue, this.heroStatueSlot, 5.2, 4.6, 0);
    }
    if (clean.heli !== prev.heli && this.heroHeliSlot) {
      this._applyHeroSlot("heli", clean.heli, this.heroHeliSlot, 8.2, 0.1, 0);
    }
    if (clean.audi !== prev.audi && this.heroAudiSlots.length > 0) {
      this.heroAudiSlots.forEach((slot) => {
        this._applyHeroSlot("audi", clean.audi, slot.group, 4.3, 0.02, 0);
      });
    }
  }

  _applyHeroSlot(slotName, url, targetGroup, targetMaxDim, yOffset, rotY) {
    // Remove previous custom GLB wrapper if any & restore procedural fallback first
    const oldGlb = targetGroup.getObjectByName(`hero_glb_${slotName}`);
    if (oldGlb) targetGroup.remove(oldGlb);
    targetGroup.children.forEach((ch) => {
      if (ch.userData && ch.userData._hiddenByGlb) {
        ch.visible = true;
        delete ch.userData._hiddenByGlb;
      }
    });
    if (url) {
      this._loadHeroGLB(slotName, url, targetGroup, targetMaxDim, yOffset, rotY);
    }
  }

  async _loadHeroGLB(slotName, url, targetGroup, targetMaxDim = 5.0, yOffset = 0, rotY = 0) {
    if (!url || !targetGroup) return;
    try {
      if (!this._gltfLoader) {
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        this._gltfLoader = new GLTFLoader();
      }
      let baseScene = this.glbCache.get(url);
      if (!baseScene) {
        const gltf = await this._gltfLoader.loadAsync(url);
        baseScene = gltf.scene;
        this.glbCache.set(url, baseScene);
      }
      const model = baseScene.clone(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = targetMaxDim / maxDim;

      const wrap = new THREE.Group();
      wrap.name = `hero_glb_${slotName}`;
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -box.min.y * scale + yOffset, -center.z * scale);
      wrap.rotation.y = rotY;
      wrap.add(model);

      // Remove any existing wrapper and hide procedural fallback meshes cleanly
      const prevWrap = targetGroup.getObjectByName(`hero_glb_${slotName}`);
      if (prevWrap) targetGroup.remove(prevWrap);
      targetGroup.children.forEach((ch) => {
        if (ch.visible) {
          ch.visible = false;
          ch.userData._hiddenByGlb = true;
        }
      });
      targetGroup.add(wrap);
      if (this.shadowsEnabled) this._applyShadowFlags(wrap);
    } catch (err) {
      console.warn(`Hero .glb load skipped for ${slotName} (${url}):`, err);
    }
  }

  findPlotByQuery(query) {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return null;
    if (q.includes("airport") || q.includes("plane") || q.includes("flight") || q.includes("heli") || q.includes("diamond")) return "AIRPORT";
    const beachClean = (this.beachOwner || "").toLowerCase().replace(/^@/, "");
    if (q.includes("beach") || q.includes("ocean") || q.includes("sea") || (beachClean && beachClean.includes(q))) return "BEACH";
    const railClean = (this.railwayOwner || "").toLowerCase().replace(/^@/, "");
    if (q.includes("south") || q.includes("araku") || q.includes("waterfall") || q.includes("mountain")) return "RAILWAY_SOUTH";
    if (q.includes("train") || q.includes("rail") || q.includes("station") || q.includes("tunnel") || (railClean && railClean.includes(q))) return "RAILWAY_STATION";

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
    if (this._tabHidden) return;
    const rawDt = Math.min(this.clock.getDelta(), 0.05);
    const dt = rawDt * this.simSpeed;
    this.simTime += dt;
    const elapsed = this.simTime;

    // 🌅 SMOOTH DAY -> SUNSET -> NIGHT SKY CROSSFADE
    if (this.skyTransition.active) {
      this.skyTransition.timer += rawDt;
      const p = Math.min(1, this.skyTransition.timer / this.skyTransition.duration);
      const ease = p * p * (3 - 2 * p);
      this.scene.background.lerpColors(this.skyTransition.fromBg, this.skyTransition.toBg, ease);
      this.scene.fog.color.lerpColors(this.skyTransition.fromFog, this.skyTransition.toFog, ease);
      this.sunLight.color.lerpColors(this.skyTransition.fromSunCol, this.skyTransition.toSunCol, ease);
      this.sunLight.intensity = THREE.MathUtils.lerp(this.skyTransition.fromSunInt, this.skyTransition.toSunInt, ease);
      this.hemiLight.intensity = THREE.MathUtils.lerp(this.skyTransition.fromHemiInt, this.skyTransition.toHemiInt, ease);
      if (p >= 0.5 && !this.skyTransition.toggledNightProps) {
        this.skyTransition.toggledNightProps = true;
        this.timeOfDay = this.skyTransition.targetMode;
        this._applyNightEffects(this.timeOfDay === "night", this.timeOfDay);
      }
      if (p >= 1) {
        this.skyTransition.active = false;
      }
    }

    // 🚂 / 💎 / ✈️ DYNAMIC LIVE CHASE CAMS (Train 1, Train 2, Sheru Bhai VIP, Commercial Flight)
    if (this.chaseCam.active) {
      let targetObj = null;
      let backDist = 14;
      let upDist = 7.5;
      let sideOffset = 2.8;

      const pBoost = this._getWideDist(1.0);
      if (this.chaseCam.mode === "train1" && this.railwaySim?.train1Cars?.[0]) {
        targetObj = this.railwaySim.train1Cars[0];
        backDist = 22 * pBoost;
        upDist = 12 * pBoost;
        sideOffset = 9 * pBoost;
      } else if (this.chaseCam.mode === "train2" && this.railwaySim?.train2Cars?.[0]) {
        targetObj = this.railwaySim.train2Cars[0];
        backDist = 22 * pBoost;
        upDist = 12 * pBoost;
        sideOffset = -9 * pBoost;
      } else if (this.chaseCam.mode === "vip" && this.airportSim) {
        const dCar = this.airportSim.diamondCar;
        const wSheru = this.airportSim.walkingSheru;
        const dHeli = this.airportSim.diamondHeli;
        if (dCar?.userData?.seatedSheru?.visible) {
          targetObj = dCar;
          backDist = 18 * pBoost;
          upDist = 10 * pBoost;
          sideOffset = 7 * pBoost;
        } else if (wSheru?.visible) {
          targetObj = wSheru;
          backDist = 15 * pBoost;
          upDist = 8.5 * pBoost;
          sideOffset = 7 * pBoost;
        } else if (dHeli) {
          targetObj = dHeli;
          backDist = 25 * pBoost;
          upDist = 12 * pBoost;
          sideOffset = 10 * pBoost;
        }
      } else if (this.chaseCam.mode === "flight" && this.airportSim?.plane) {
        targetObj = this.airportSim.plane;
        backDist = 36 * pBoost;
        upDist = 16 * pBoost;
        sideOffset = 14 * pBoost;
      }

      if (targetObj) {
        const wPos = new THREE.Vector3();
        const wDir = new THREE.Vector3();
        targetObj.getWorldPosition(wPos);
        targetObj.getWorldDirection(wDir);
        const wRight = new THREE.Vector3(-wDir.z, 0, wDir.x).normalize();

        const desiredPos = wPos.clone()
          .addScaledVector(wDir, -backDist)
          .addScaledVector(wRight, sideOffset);
        desiredPos.y = Math.max(3.2, wPos.y + upDist);

        const alpha = 1 - Math.exp(-4.2 * rawDt);
        this.camera.position.lerp(desiredPos, alpha);
        const lookAtPos = wPos.clone().add(new THREE.Vector3(0, 1.5, 0));
        this.chaseCam.smoothTarget.lerp(lookAtPos, alpha);
        this.controls.target.copy(this.chaseCam.smoothTarget);
      }
    }

    // 📈 CITY GROWTH TIMELAPSE (Wave-by-Wave Day 1 -> Today + Sweeping Panorama Orbit!)
    if (this.timelapseState.active) {
      this.timelapseState.timer += rawDt;
      const orbitAng = this.timelapseState.timer * 0.22;
      const r = this._getWideDist((this.ringRadius || 48) * 1.65);
      this.camera.position.lerp(new THREE.Vector3(Math.cos(orbitAng) * r, r * 0.78, Math.sin(orbitAng) * r), 0.08);
      this.controls.target.lerp(new THREE.Vector3(0, 4, 0), 0.1);

      // Animate popping buildings smoothly back to scale.y = 1
      for (const s of this.timelapseState.savedVis) {
        if (s.grp.visible && s.grp.scale.y < 1) {
          s.grp.scale.y = Math.min(1, s.grp.scale.y + rawDt * 2.8);
        }
      }

      const stepDur = 2.2;
      const nextIdx = Math.min(this.timelapseState.days.length - 1, Math.floor(this.timelapseState.timer / stepDur));
      if (nextIdx > this.timelapseState.dayIdx) {
        this.timelapseState.dayIdx = nextIdx;
        const curDay = this.timelapseState.days[nextIdx];
        let shownCount = 0;
        for (const s of this.timelapseState.savedVis) {
          if (s.day <= curDay) {
            if (!s.grp.visible) {
              s.grp.visible = true;
              s.grp.scale.y = 0.08;
            }
            shownCount++;
          }
        }
        if (this.timelapseState.onStopChange) {
          this.timelapseState.onStopChange("📈 CITY GROWTH TIMELAPSE", `DAY ${curDay} • ${shownCount} PLACES`);
        }
      }
      if (this.timelapseState.timer > this.timelapseState.days.length * stepDur + 2.2) {
        this.stopGrowthTimelapse();
      }
    }

    // ⏱️ 24-HOUR SKYLINE HYPERLAPSE (Morning -> Noon -> Sunset -> Starry Disco Night -> Dawn!)
    if (this.hyperlapse24h.active) {
      this.hyperlapse24h.timer += rawDt;
      const u = (this.hyperlapse24h.timer % this.hyperlapse24h.duration) / this.hyperlapse24h.duration;
      const ang = -0.6 + u * Math.PI * 1.4;
      const r = this._getWideDist((this.ringRadius || 48) * 1.55);
      this.camera.position.lerp(new THREE.Vector3(Math.cos(ang) * r, Math.max(72, r * 0.62), Math.sin(ang) * r), 0.08);
      this.controls.target.lerp(new THREE.Vector3(0, 8, 0), 0.08);

      const dayP = this._getSkyPreset("day");
      const sunP = this._getSkyPreset("sunset");
      const nitP = this._getSkyPreset("night");

      let a, b, f;
      let isNightNow = false;
      let modeNow = "day";
      if (u < 0.32) {
        a = dayP; b = sunP; f = u / 0.32;
        modeNow = f > 0.5 ? "sunset" : "day";
      } else if (u < 0.55) {
        a = sunP; b = nitP; f = (u - 0.32) / 0.23;
        isNightNow = f > 0.45;
        modeNow = isNightNow ? "night" : "sunset";
      } else if (u < 0.82) {
        a = nitP; b = nitP; f = 0;
        isNightNow = true;
        modeNow = "night";
      } else {
        a = nitP; b = dayP; f = (u - 0.82) / 0.18;
        isNightNow = f < 0.4;
        modeNow = isNightNow ? "night" : "day";
      }

      this.scene.background.lerpColors(new THREE.Color(a.bg), new THREE.Color(b.bg), f);
      this.scene.fog.color.lerpColors(new THREE.Color(a.fog), new THREE.Color(b.fog), f);
      this.sunLight.color.lerpColors(new THREE.Color(a.sunCol), new THREE.Color(b.sunCol), f);
      this.sunLight.intensity = THREE.MathUtils.lerp(a.sunInt, b.sunInt, f);
      this.hemiLight.intensity = THREE.MathUtils.lerp(a.hemiInt, b.hemiInt, f);

      if (this.timeOfDay !== modeNow) {
        this.timeOfDay = modeNow;
        this._applyNightEffects(isNightNow, modeNow);
      }
    }

    // 🪩 DISCO STATUE NIGHT CRANE OUTRO
    if (this.discoOutro.active) {
      this.discoOutro.timer += rawDt;
      const p = Math.min(1, this.discoOutro.timer / this.discoOutro.duration);
      const ease = p * p * (3 - 2 * p);
      const ang = 0.5 + ease * Math.PI * 1.5;
      const rad = this._getWideDist(THREE.MathUtils.lerp(18.0, 42.0, ease));
      const h = this._getWideDist(THREE.MathUtils.lerp(9.0, 30.0, ease));
      this.camera.position.lerp(new THREE.Vector3(Math.cos(ang) * rad, h, Math.sin(ang) * rad), 0.14);
      this.controls.target.lerp(new THREE.Vector3(0, THREE.MathUtils.lerp(6.8, 7.6, ease), 0), 0.14);
      if (p >= 1) this.stopDiscoOutro();
    }

    // 🚶 STREET-LEVEL WALK POV
    if (this.streetWalk.active && this.streetWalk.curve) {
      this.streetWalk.t = (this.streetWalk.t + rawDt * this.streetWalk.speed) % 1;
      const pos = this.streetWalk.curve.getPointAt(this.streetWalk.t);
      const lookPt = this.streetWalk.curve.getPointAt((this.streetWalk.t + 0.03) % 1);
      const bobY = pos.y + Math.sin(this.clock.elapsedTime * 7.5) * 0.12;
      const alpha = 1 - Math.exp(-5.0 * rawDt);
      this.camera.position.lerp(new THREE.Vector3(pos.x, bobY, pos.z), alpha);
      this.streetWalk.smoothTarget.lerp(new THREE.Vector3(lookPt.x, 3.4, lookPt.z), alpha);
      this.controls.target.copy(this.streetWalk.smoothTarget);
    }

    // 🚁 PROFESSIONAL GIMBAL-STABILIZED CINEMATIC DRONE FLIGHT
    if (this.droneTour.active && this.droneTour.curve) {
      this.droneTour.t = (this.droneTour.t + dt * this.droneTour.speed) % 1;
      const pos = this.droneTour.curve.getPointAt(this.droneTour.t);
      const lookT = (this.droneTour.t + 0.024) % 1;
      const lookPt = this.droneTour.curve.getPointAt(lookT);

      // Frame-rate independent cinema gimbal damping (silky smooth on 30fps or 60fps phones!)
      const camAlpha = 1 - Math.exp(-3.4 * dt);
      const tgtAlpha = 1 - Math.exp(-2.8 * dt);
      this.camera.position.lerp(pos, camAlpha);

      const desiredTarget = new THREE.Vector3(lookPt.x, Math.max(4.0, lookPt.y - 9.5), lookPt.z);
      if (this.droneTour.smoothTarget) {
        this.droneTour.smoothTarget.lerp(desiredTarget, tgtAlpha);
        this.controls.target.copy(this.droneTour.smoothTarget);
      } else {
        this.controls.target.lerp(desiredTarget, tgtAlpha);
      }
    }

    // 🏗️ PRO CINEMA BUILD REEL CHOREOGRAPHER (Orbits smoothly around each building while it rises!)
    if (this.buildReelTour.active) {
      this.buildReelTour.timer += dt;
      const cur = this.buildReelTour.stops[this.buildReelTour.idx];
      if (cur && cur.orbitRadius > 0 && this.cameraGoal) {
        const ang = cur.orbitStartAng + this.buildReelTour.timer * cur.orbitSpeed;
        this.cameraGoal.camPos.set(
          cur.target.x + Math.cos(ang) * cur.orbitRadius,
          cur.orbitHeight,
          cur.target.z + Math.sin(ang) * cur.orbitRadius
        );
      }
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
        } else if (a.mode === "enter_z") {
          const cyc = (elapsed * a.speed + a.phase) % 1.0;
          if (cyc < 0.72) {
            const p = cyc / 0.72;
            a.mesh.visible = true;
            a.mesh.position.set(a.baseX, 0.14 + Math.abs(Math.sin(elapsed * 8 + a.phase * 6)) * 0.1, THREE.MathUtils.lerp(a.startZ, a.endZ, p));
            a.mesh.rotation.y = Math.PI; // Walking straight into entrance!
          } else {
            a.mesh.visible = false; // Inside the building!
          }
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



    // 🚂 DOUBLE-TRACK LIVE 3D TRAINS (Stopping at BOTH North Station & Opposite South Station + Mountain Tunnels!)
    if (this.lifeEnabled && this.railwaySim) {
      const rsim = this.railwaySim;

      const animateBoarding = (paxList, isStopped, stopElapsed, cycleTotal, pfZ, doorZ, faceRotY) => {
        if (isStopped) {
          paxList.forEach((pax, i) => {
            const wp = (stopElapsed - i * 0.62) / 1.8;
            if (wp < 0) {
              pax.visible = true;
              pax.position.set(-7.5 + i * 3.4, 0.95, pfZ);
              pax.rotation.y = faceRotY;
            } else if (wp < 1) {
              pax.visible = true;
              pax.position.set(
                -7.5 + i * 3.4,
                0.95 + Math.abs(Math.sin(elapsed * 12 + i)) * 0.12,
                THREE.MathUtils.lerp(pfZ, doorZ, wp)
              );
              pax.rotation.y = faceRotY;
            } else {
              pax.visible = false;
            }
          });
        } else {
          paxList.forEach((pax, i) => {
            pax.visible = cycleTotal > 10.0;
            pax.position.set(-7.5 + i * 3.4, 0.95, pfZ);
            pax.rotation.y = faceRotY;
          });
        }
      };

      const updateTwoStationTrain = (
        cycleOffset, curve, totalLen, northT, southT, cars,
        nPax, nPfZ, nDoorZ, nFace,
        sPax, sPfZ, sDoorZ, sFace
      ) => {
        const cycle = (elapsed + cycleOffset) % 44.0;
        const deltaNS = (southT - northT + 1.0) % 1.0;
        const deltaSN = 1.0 - deltaNS;

        let headT = northT;
        let atNorth = false;
        let atSouth = false;
        let stopClock = 0;

        // 0..5.5s: Stopped at North Station (SHERU BHAI JN)
        // 5.5..22.0s: Runs through Mountain Tunnel & City -> arrives at South Station!
        // 22.0..27.5s: Stopped at South Station (ARAKU SOUTH JN)
        // 27.5..44.0s: Runs through Opposite Mountain Tunnel -> returns to North Station!
        const easeSegment = (u) => {
          if (u < 0.1) return 0.05 * (u / 0.1) * (u / 0.1);
          if (u < 0.9) return 0.05 + ((u - 0.1) / 0.8) * 0.9;
          const b = (u - 0.9) / 0.1;
          return 0.95 + 0.05 * (1 - (1 - b) * (1 - b));
        };

        if (cycle < 5.5) {
          headT = northT;
          atNorth = true;
          stopClock = cycle;
        } else if (cycle < 22.0) {
          const u = (cycle - 5.5) / 16.5;
          headT = (northT + easeSegment(u) * deltaNS) % 1.0;
        } else if (cycle < 27.5) {
          headT = southT;
          atSouth = true;
          stopClock = cycle - 22.0;
        } else {
          const u = (cycle - 27.5) / 16.5;
          headT = (southT + easeSegment(u) * deltaSN) % 1.0;
        }

        const spacingT = 6.2 / Math.max(totalLen, 120);
        cars.forEach((car, idx) => {
          const carT = (headT - idx * spacingT + 1.0) % 1.0;
          const pos = curve.getPointAt(carT);
          const ahead = curve.getPointAt((carT + 0.008) % 1.0);
          car.position.set(pos.x, 0.18, pos.z);
          car.lookAt(ahead.x, 0.18, ahead.z);
        });

        animateBoarding(nPax, atNorth, stopClock, cycle, nPfZ, nDoorZ, nFace);
        animateBoarding(sPax, atSouth, stopClock, (cycle + 22.0) % 44.0, sPfZ, sDoorZ, sFace);
      };

      // Train 1 (Blue/Yellow WAP-7 Express — Track 1 Clockwise, stopping at North PF1 & South PF1!)
      updateTwoStationTrain(
        0.0, rsim.track1Curve, rsim.len1, rsim.stationT1, rsim.southT1, rsim.train1Cars,
        rsim.paxPF1, 4.6, 2.2, Math.PI,
        rsim.southPaxPF1, -4.6, -2.2, 0
      );

      // Train 2 (White/Orange Vande Bharat — Track 2 Counter-Clockwise, stopping at North PF2 & South PF2!)
      updateTwoStationTrain(
        22.0, rsim.track2Curve, rsim.len2, rsim.stationT2, rsim.southT2, rsim.train2Cars,
        rsim.paxPF2, -4.6, -2.2, 0,
        rsim.southPaxPF2, 4.6, 2.2, Math.PI
      );

      // Foot Overbridge Pedestrians on BOTH North & South Stations!
      if (rsim.bridgeWalker) {
        const bz = Math.sin(elapsed * 0.9) * 4.2;
        rsim.bridgeWalker.position.set(rsim.fobX, 4.86 + Math.abs(Math.sin(elapsed * 7)) * 0.1, bz);
        rsim.bridgeWalker.rotation.y = Math.cos(elapsed * 0.9) >= 0 ? 0 : Math.PI;
      }
      if (rsim.southBridgeWalker) {
        const bz2 = Math.cos(elapsed * 0.85) * 4.2;
        rsim.southBridgeWalker.position.set(rsim.fobX, 4.86 + Math.abs(Math.sin(elapsed * 7 + 1.2)) * 0.1, bz2);
        rsim.southBridgeWalker.rotation.y = -Math.sin(elapsed * 0.85) >= 0 ? 0 : Math.PI;
      }
    }

    // ⛰️💧 ARAKU VALLEY WATERFALLS, FLOWING RIVERS & MISTY MOUNTAIN CLOUDS ANIMATION
    if (this.lifeEnabled && this.arakuSim && (!this._perfThrottle || (this._animFrameTick % 2 === 0))) {
      for (const rib of this.arakuSim.waterRibbons) {
        const span = rib.maxY - rib.minY;
        const drop = ((elapsed * rib.speed + rib.phase * span) % span);
        rib.mesh.position.y = rib.maxY - drop;
      }
      for (const rip of this.arakuSim.riverRipples) {
        const u = (elapsed * rip.speed + rip.phase) % 1;
        const p = rip.curve.getPointAt(u);
        const tan = rip.curve.getTangentAt(u);
        rip.mesh.position.set(p.x, 0.14, p.z);
        rip.mesh.rotation.y = Math.atan2(tan.x, tan.z);
      }
      for (const mc of this.arakuSim.mistClouds) {
        const curAng = mc.ang + elapsed * mc.speed;
        mc.mesh.position.set(Math.cos(curAng) * mc.rad, mc.y + Math.sin(elapsed * 0.6 + mc.ang) * 1.4, Math.sin(curAng) * mc.rad);
      }
    }


    // 🎭🎬 8-PLOT MOVIE THEATER & IMAX NIGHT-SKY ROTATING DISCO BEAMS (Reflects High Into the Night Air!)
    if (this.theaterDiscos && this.theaterDiscos.length > 0) {
      const defaultPal = [0xec4899, 0x22d3ee, 0xfacc15, 0xa855f7, 0x4ade80, 0xef4444];
      const stepIdx = Math.floor(elapsed * 2.4);
      const isNightNow = this.timeOfDay === "night";

      for (const td of this.theaterDiscos) {
        if (td.nightGroup) td.nightGroup.visible = isNightNow;

        if (this.lifeEnabled && td.marqueeBulbs) {
          const chase = Math.floor(elapsed * 5.0);
          for (let i = 0; i < td.marqueeBulbs.length; i++) {
            td.marqueeBulbs[i].visible = !isNightNow || (i + chase) % 3 !== 0;
          }
        }

        if (isNightNow && this.lifeEnabled) {
          const pal = td.palette || defaultPal;
          for (let b = 0; b < td.skyBeams.length; b++) {
            const sb = td.skyBeams[b];
            sb.pivot.rotation.y = elapsed * 1.25 * sb.dir + b * 0.85;
            const tiltWave = sb.baseTilt + Math.sin(elapsed * 1.7 + b * 1.2) * 0.22;
            sb.cone.rotation.z = tiltWave;
            sb.core.rotation.z = tiltWave;
            if (sb.airHalo) {
              sb.airHalo.position.set(
                -Math.sin(tiltWave) * sb.beamH * 0.92,
                Math.cos(tiltWave) * sb.beamH * 0.92,
                0
              );
              const hScale = 0.85 + Math.abs(Math.sin(elapsed * 3.2 + b)) * 0.5;
              sb.airHalo.scale.set(hScale, hScale, 1);
            }

            const col = pal[(stepIdx + sb.colorIdx) % pal.length];
            sb.beamMat.color.setHex(col);
            sb.coreMat.color.setHex(col);
            if (sb.haloMat) sb.haloMat.color.setHex(col);
            sb.bulbMat.color.setHex(col);
            sb.beamMat.opacity = 0.32 + Math.abs(Math.sin(elapsed * 3.8 + b)) * 0.26;
          }
          if (td.pointLight) {
            td.pointLight.color.setHex(pal[stepIdx % pal.length]);
          }
        }
      }
    }

    // 🪩 SHERU BHAI STATUE NIGHT DISCO LIGHTS (Rotating Beams + RGB Color Cycling!)
    if (this.timeOfDay === "night" && this.discoGroup && this.discoGroup.visible) {
      const discoHex = [0xec4899, 0x22d3ee, 0x4ade80, 0xfacc15, 0xa855f7, 0xef4444];
      this.discoGroup.rotation.y = elapsed * 0.95;
      const stepIdx = Math.floor(elapsed * 2.2);
      for (let d = 0; d < this.discoCones.length; d++) {
        const dc = this.discoCones[d];
        const col = discoHex[(stepIdx + dc.colorIdx) % discoHex.length];
        dc.beamMat.color.setHex(col);
        dc.podMat.color.setHex(col);
        dc.beamMat.opacity = 0.24 + Math.abs(Math.sin(elapsed * 4.5 + d)) * 0.26;
      }
      if (this.discoRing) {
        this.discoRing.material.color.setHex(discoHex[stepIdx % discoHex.length]);
      }
      if (this.discoPointLight) {
        this.discoPointLight.color.setHex(discoHex[stepIdx % discoHex.length]);
      }
    }


    // 🚗🏖️ OUTSKIRTS-TO-BEACH HIGHWAY TRAFFIC & REAL PARK -> WALK TO BEACH -> TAKE CAR OUT CYCLE!
    if (this.lifeEnabled && this.beachHighwaySim) {
      const bhs = this.beachHighwaySim;

      // 1. Dedicated Beach Express Bus & Auto running between City Outskirts Road & Beachfront
      const busCycle = (elapsed * 0.085) % 1.0;
      if (busCycle < 0.45) {
        const p = busCycle / 0.45;
        bhs.beachBus.position.set(THREE.MathUtils.lerp(bhs.hwStartX, 28, p), 0.1, -2.2);
        bhs.beachBus.rotation.y = -Math.PI / 2;
      } else if (busCycle < 0.55) {
        bhs.beachBus.position.set(28, 0.1, THREE.MathUtils.lerp(-2.2, 2.2, (busCycle - 0.45) / 0.1));
        bhs.beachBus.rotation.y = 0;
      } else {
        const p = (busCycle - 0.55) / 0.45;
        bhs.beachBus.position.set(THREE.MathUtils.lerp(28, bhs.hwStartX, p), 0.1, 2.2);
        bhs.beachBus.rotation.y = Math.PI / 2;
      }

      const autoCycle = (elapsed * 0.11 + 0.45) % 1.0;
      if (autoCycle < 0.5) {
        bhs.beachAuto.position.set(THREE.MathUtils.lerp(bhs.hwStartX, 30, autoCycle / 0.5), 0.1, -1.8);
        bhs.beachAuto.rotation.y = -Math.PI / 2;
      } else {
        bhs.beachAuto.position.set(THREE.MathUtils.lerp(30, bhs.hwStartX, (autoCycle - 0.5) / 0.5), 0.1, 1.8);
        bhs.beachAuto.rotation.y = Math.PI / 2;
      }

      // 2. 3 Visitor Cars: Drive in from Outskirts -> Park -> People Walk to Golden Beach -> Chill -> Return -> Drive Out!
      for (const vc of bhs.visitorCars) {
        const cycleDur = 22.5;
        const t = (elapsed + vc.phase) % cycleDur;
        if (t < 4.5) {
          // Phase 1: Driving from City Outskirts Road straight into Beach Parking Bay
          const p = t / 4.5;
          vc.car.position.set(THREE.MathUtils.lerp(bhs.hwStartX, bhs.hwParkX, p), 0.16, THREE.MathUtils.lerp(-2.2, vc.slotZ, Math.min(1, p * 1.4)));
          vc.car.rotation.y = -Math.PI / 2;
          vc.boy.visible = false;
          vc.girl.visible = false;
        } else if (t < 8.5) {
          // Phase 2: Parked! People get out of the car & walk together onto the Golden Sand Beach!
          const p = (t - 4.5) / 4.0;
          vc.car.position.set(bhs.hwParkX, 0.16, vc.slotZ);
          vc.car.rotation.y = -Math.PI / 2;
          vc.boy.visible = true;
          vc.girl.visible = true;
          const wx = THREE.MathUtils.lerp(bhs.hwParkX - 2.2, bhs.sandX, p);
          const bob = Math.abs(Math.sin(elapsed * 8.5)) * 0.12;
          vc.boy.position.set(wx, 0.16 + bob, vc.slotZ - 0.45);
          vc.girl.position.set(wx, 0.16 + bob, vc.slotZ + 0.45);
          vc.boy.rotation.y = -Math.PI / 2;
          vc.girl.rotation.y = -Math.PI / 2;
        } else if (t < 13.5) {
          // Phase 3: Enjoying the Golden Beach & Ocean Waves!
          vc.car.position.set(bhs.hwParkX, 0.16, vc.slotZ);
          vc.boy.visible = true;
          vc.girl.visible = true;
          const sway = Math.sin(elapsed * 1.8 + vc.phase) * 0.9;
          vc.boy.position.set(bhs.sandX, 0.16, vc.slotZ - 0.55 + sway);
          vc.girl.position.set(bhs.sandX + 0.3, 0.16, vc.slotZ + 0.55 + sway);
          vc.boy.rotation.y = -Math.PI / 2;
          vc.girl.rotation.y = -Math.PI / 2;
        } else if (t < 17.5) {
          // Phase 4: Walking back from Beach to their Parked Car!
          const p = (t - 13.5) / 4.0;
          vc.car.position.set(bhs.hwParkX, 0.16, vc.slotZ);
          vc.boy.visible = true;
          vc.girl.visible = true;
          const wx = THREE.MathUtils.lerp(bhs.sandX, bhs.hwParkX - 2.0, p);
          const bob = Math.abs(Math.sin(elapsed * 8.5)) * 0.12;
          vc.boy.position.set(wx, 0.16 + bob, vc.slotZ - 0.45);
          vc.girl.position.set(wx, 0.16 + bob, vc.slotZ + 0.45);
          vc.boy.rotation.y = Math.PI / 2;
          vc.girl.rotation.y = Math.PI / 2;
        } else {
          // Phase 5: Taking their Car OUT of Beach Parking & Driving Back to City Outskirts Road!
          const p = (t - 17.5) / 5.0;
          vc.boy.visible = false;
          vc.girl.visible = false;
          vc.car.position.set(THREE.MathUtils.lerp(bhs.hwParkX, bhs.hwStartX, p), 0.16, THREE.MathUtils.lerp(vc.slotZ, 2.2, Math.min(1, p * 1.8)));
          vc.car.rotation.y = Math.PI / 2;
        }
      }
    }

    // 🛕⛰️ SACRED HILLTOP TEMPLE: CLIMBING DEVOTEES + GHAT ROAD VEHICLES + RADIANT GOLDEN GLOWING EFFECTS!
    if (this.hillTempleSim) {
      const hts = this.hillTempleSim;
      // Radiant Golden Divine Aura & Rotating Sun-Halo (Always glowing, extra radiant at Sunset & Night!)
      const isNightGlow = this.timeOfDay === "night";
      if (hts.divineHalo) {
        hts.divineHalo.rotation.z = elapsed * 0.45;
        const s = 1.0 + Math.sin(elapsed * 2.2) * 0.08;
        hts.divineHalo.scale.set(s, s, 1);
      }
      if (hts.divineSkyBeam) {
        hts.divineSkyBeam.rotation.y = elapsed * 0.55;
        hts.divineSkyBeam.material.opacity = isNightGlow ? 0.48 + Math.sin(elapsed * 2.6) * 0.14 : 0.24 + Math.sin(elapsed * 2.0) * 0.06;
      }
      if (hts.divineAuraSphere) {
        const as = 0.96 + Math.sin(elapsed * 2.4) * 0.09;
        hts.divineAuraSphere.scale.set(as, as, as);
      }

      if (this.lifeEnabled) {
        // 10 Devotees Climbing Up & Descending the 48 Mountain Steps!
        for (const dv of hts.devotees) {
          const frac = (elapsed * dv.speed + dv.phase) % 1.0;
          const u = dv.goingUp ? frac : (1.0 - frac);
          const py = 0.45 + u * (hts.stepTopY - 0.45) + Math.abs(Math.sin(elapsed * 9.0 + dv.phase * 10)) * 0.14;
          const pz = THREE.MathUtils.lerp(hts.stepStartZ, hts.stepEndZ, u);
          dv.mesh.position.set(dv.laneX, py, pz);
          dv.mesh.rotation.y = dv.goingUp ? Math.PI : 0;
        }

        // Vehicles Driving from Main Road Up & Down the Winding Mountain Ghat Road!
        for (const gv of hts.ghatVehicles) {
          const cyc = (elapsed * gv.speed + gv.phase) % 2.0;
          const u = cyc < 1.0 ? cyc : (2.0 - cyc);
          const pt = hts.ghatCurve.getPointAt(u);
          const lookU = cyc < 1.0 ? Math.min(1.0, u + 0.025) : Math.max(0.0, u - 0.025);
          const lpt = hts.ghatCurve.getPointAt(lookU);
          gv.mesh.position.set(pt.x, pt.y + 0.18, pt.z);
          gv.mesh.lookAt(lpt.x, lpt.y + 0.18, lpt.z);
        }
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

    // VERY-LOW-RAM AUTO-FPS SMOOTH GOVERNOR + FAR SPRITE & EMPTY PLOT CULLING
    this._animFrameTick++;
    if (!this.hqMode) {
      this._fpsFrames++;
      this._fpsAccum += rawDt;
      if (this._fpsAccum >= 2.2) {
        const avgFps = this._fpsFrames / this._fpsAccum;
        if (avgFps < 24 && !this._perfThrottle) {
          this._perfThrottle = true;
          this.renderer.setPixelRatio(0.82);
        } else if (avgFps > 42 && this._perfThrottle) {
          this._perfThrottle = false;
          this.renderer.setPixelRatio(this.isVeryLowRam ? 0.92 : 1.0);
        }
        this._fpsFrames = 0;
        this._fpsAccum = 0;
      }
    }

    this._cullAccum += rawDt;
    if (this._cullAccum > 0.25) {
      this._cullAccum = 0;
      const cx = this.camera.position.x;
      const cz = this.camera.position.z;
      const maxDistSq = this.hqMode
        ? 260 * 260
        : this._perfThrottle
        ? 85 * 85
        : this.isVeryLowRam
        ? 95 * 95
        : this.isLowRam
        ? 110 * 110
        : 170 * 170;
      for (let i = 0; i < this.plotSigns.length; i++) {
        const ps = this.plotSigns[i];
        const dx = ps.x - cx;
        const dz = ps.z - cz;
        ps.sprite.visible = dx * dx + dz * dz < maxDistSq;
      }

      if ((this.isLowRam || this._perfThrottle) && !this.hqMode && this._emptyPlotCoords.size > 0) {
        const emptyMaxSq = this._perfThrottle ? 145 * 145 : 195 * 195;
        for (const ep of this._emptyPlotCoords.values()) {
          const dx = ep.x - cx;
          const dz = ep.z - cz;
          ep.grp.visible = dx * dx + dz * dz < emptyMaxSq;
        }
      }
    }

    this.controls.update();

    // ☀️ Half-rate dynamic Sun Shadow Frustum (50% less GPU shadow cost — silky smooth 60fps!)
    if (this.shadowsEnabled && this.sunTarget && (this._animFrameTick % 2 === 0)) {
      const tx = this.controls.target.x;
      const tz = this.controls.target.z;
      this.sunTarget.position.set(tx, 0, tz);
      this.sunLight.position.set(tx + 85, 130, tz + 65);
      this.renderer.shadowMap.needsUpdate = true;
    }

    // ✨ Render with Neon Cinema Bloom Composer when enabled in Admin Reel Mode!
    if (this.bloomEnabled && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
