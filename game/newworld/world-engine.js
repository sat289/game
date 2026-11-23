import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const EIGHT_PLOT_TYPES = new Set(["ground"]);

export const FOUR_PLOT_TYPES = new Set([
  "police_station",
  "hospital",
  "school",
  "bus_stand",
  "auto_stand",
  "petrol_bunk",
  "srmt_mall",
  "apple_store",
  "reliance_store"
]);

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
  ground: "🏏 గ్రౌండ్ • MEGA CRICKET STADIUM (8 PLOTS)",
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
    this.scene.fog = new THREE.Fog(0x87ceeb, 180, 520);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 1.0, 900);
    this.camera.position.set(62, 68, 62);

    // LOW-END DEVICE OPTIMIZED RENDERER:
    // - No heavy real-time shadowMap (saves 60%+ GPU load on budget phones!)
    // - Capped pixelRatio (1.25 max) for buttery smooth 60fps panning
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
      precision: "mediump"
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.shadowMap.enabled = false;
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
    this.controls.maxDistance = 360;
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
      sunglasses: new THREE.MeshBasicMaterial({ color: 0x09090b })
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

  syncLandmarkFootprints(allPlotsObj) {
    this.landmarkCoveredPlots.clear();
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (p && p.status === "built") {
        const req = getRequiredSize(p.buildingType);
        if (req >= 4) {
          const grp = req === 8 ? getEightPlotGroup(pid) : getBlockPlotIds(pid);
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
    this.plotHitboxes = this.plotHitboxes.filter((h) => h.userData.plotId !== "ST_JUNCTION");

    const r = this.currentGridRadius;
    const gridCount = r * 2 + 1;
    const innerSpan = gridCount * this.BLOCK_STEP;
    const ringRadius = innerSpan / 2 + 10.5;
    this.ringRadius = ringRadius;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(ringRadius * 2 + 130, ringRadius * 2 + 130),
      this.mat.grass
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.06;
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

      this._addPalmTree(p, -(ringRadius + 7));
      this._addPalmTree(p, ringRadius + 7);
      this._addPalmTree(-(ringRadius + 7), p);
      this._addPalmTree(ringRadius + 7, p);
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
    this.setTimeOfDay(this.timeOfDay);
  }

  /**
   * GRAND "SHERU BHAI STATUE" at ST JUNCTION (0, 0) — Middle of the City!
   * Features marble roundabout, blue water fountain, granite & gold pedestal with
   * "SHERU BHAI" name plaque, heroic bronze/gold statue with cool sunglasses, stylish jacket
   * & proud raised-hand salute! Clicking opens stgames.online popup.
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

    // HEROIC SHERU BHAI STATUE FIGURE (Bronze & Gold)
    const statueBase = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.35, 12), this.mat.gold);
    statueBase.position.y = 4.45;

    // Heroic Stance Legs & Boots
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.85, 0.56), this.mat.bronze);
    legL.position.set(-0.38, 5.5, 0);
    const legR = legL.clone();
    legR.position.x = 0.38;

    // Stylish Mass-Hero Jacket Torso + Gold Collar + Chest Emblem
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.52, 1.85, 0.84), this.mat.bronze);
    torso.position.set(0, 7.25, 0);
    const collar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.36, 0.9), this.mat.gold);
    collar.position.set(0, 8.15, 0);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.22, 0.88), this.mat.gold);
    belt.position.set(0, 6.42, 0);

    // Left Arm on Hip + Right Arm Raised in Iconic Hero Salute!
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.55, 0.44), this.mat.bronze);
    armL.position.set(-0.98, 7.15, 0);
    armL.rotation.z = 0.18;

    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.75, 0.44), this.mat.bronze);
    armR.position.set(1.02, 8.45, 0.15);
    armR.rotation.z = -0.32;
    const fistR = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), this.mat.gold);
    fistR.position.set(1.28, 9.35, 0.2);

    // Head + Styled Hair + Iconic Cool Sunglasses!
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.54, 12, 12), this.mat.gold);
    head.position.set(0, 8.75, 0);
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.36, 0.96), this.mat.bronze);
    hair.position.set(0, 9.18, -0.04);
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.22, 0.16), this.mat.sunglasses);
    shades.position.set(0, 8.82, 0.48);

    // Glowing Spotlight Crown Aura at Night
    const aura = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.55, 18), this.mat.lampBulbNight);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 4.32;
    this.lampBulbs.push(aura);

    [[-6.4, -6.4], [6.4, -6.4], [-6.4, 6.4], [6.4, 6.4]].forEach(([lx, lz]) => {
      this._addStreetLamp(lx, lz);
    });

    const hitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(6.8, 6.8, 12.0, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = 6.0;
    hitbox.userData.plotId = "ST_JUNCTION";
    g.add(hitbox);
    this.plotHitboxes.push(hitbox);

    const sign = this._createNameSign("🗿 SHERU BHAI STATUE", "ST JUNCTION • stgames.online", true);
    sign.position.set(0, 12.0, 0);

    g.add(
      basePad, gardenRing, poolRim, water, step1, step2, goldCollar,
      statueBase, legL, legR, torso, collar, belt, armL, armR, fistR, head, hair, shades, aura, sign
    );
    this.cityGroup.add(g);
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
    const bodyMat = new THREE.MeshLambertMaterial({ color });
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
      new THREE.MeshLambertMaterial({ color })
    );
    body.position.y = h / 2 + 0.2;
    car.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.85, 0.45, len * 0.55),
      new THREE.MeshLambertMaterial({ color: 0xe2e8f0 })
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
      this.plotsGroup.remove(oldGroup);
      this.plotHitboxes = this.plotHitboxes.filter((h) => h.userData.plotId !== plotId);
      this.sirenLights = this.sirenLights.filter((s) => s.userData.plotId !== plotId);
      this.landmarkActors = this.landmarkActors.filter((a) => a.plotId !== plotId);
      this.petrolSimulations = this.petrolSimulations.filter((s) => s.plotId !== plotId);
      this.busSimulations = this.busSimulations.filter((s) => s.plotId !== plotId);
      this.autoSimulations = this.autoSimulations.filter((s) => s.plotId !== plotId);
      this.policeSimulations = this.policeSimulations.filter((s) => s.plotId !== plotId);
      this.ambulanceSimulations = this.ambulanceSimulations.filter((s) => s.plotId !== plotId);
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
        : new THREE.Mesh(this.geo.base1, lotBaseMat);
    lotBase.position.y = isEightPlot ? 0.13 : 0.07;
    plotGroup.add(lotBase);

    let buildingObj = null;

    if (!data || data.status !== "built" || data.buildingType === "empty") {
      buildingObj = this._buildEmptyPlotMesh();
    } else if (isEightPlot) {
      buildingObj = this._buildEightPlotCricketStadium(plotId);
      const topLabel = data.ownerName || BUILDING_LABELS.ground;
      const sign = this._createNameSign(topLabel, "🏏 గ్రౌండ్ • 8-PLOT MEGA STADIUM", true);
      sign.position.set(0, 10.6, 0);
      buildingObj.add(sign);
    } else if (isFourPlot) {
      buildingObj = this._buildFourPlotLandmark(data.buildingType, plotId);
      const topLabel = data.ownerName || BUILDING_LABELS[data.buildingType] || "LANDMARK";
      const subLabel = this._getLandmarkSubtitle(data.buildingType);
      const sign = this._createNameSign(topLabel, subLabel, true);
      sign.position.set(0, buildingObj.userData.labelY || 11.2, 0);
      buildingObj.add(sign);
    } else {
      buildingObj = this._buildOnePlotBuilding(data.buildingType);
      buildingObj.rotation.y = pos.rotY;

      if (data.ownerName) {
        const subLabel = data.buildingType === "shop" ? "టీ & టిఫిన్ • SHOP" : "";
        const sign = this._createNameSign(data.ownerName, subLabel, false);
        sign.position.set(0, buildingObj.userData.labelY || 5.2, 0);
        plotGroup.add(sign);
      }
    }

    plotGroup.add(buildingObj);

    if (animateBuild && data.status === "built") {
      buildingObj.scale.y = 0.05;
      const scafW = isEightPlot ? 31.0 : isFourPlot ? 13.0 : 5.6;
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
      reliance_store: "రిలయన్స్ • RELIANCE DIGITAL"
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
    const sbGlow = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.9, 4.6), this.mat.windowNight);
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
  _buildFourPlotLandmark(type, plotId) {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;

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

      g.add(canopy, trim, office, officeTop);
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

      g.add(office, officeRoof, yellowBand, door, standRoof, standTrim, parkedAuto1, parkedAuto2, bucket);
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

      g.add(terminal, roof, yellowTrim);
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

      g.add(floor1, floor2, tower, navyBand, redBand, portico, sirenRed, sirenBlue, jeep1);
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

      g.add(main, pad, h1, h2, h3, crossV, crossH, canopy);
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

      g.add(base, atrium, ribbon1, ribbon2, cinema, canopy, c1, c2);
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

      g.add(floor, glassBox, roof, logoBody, logoLeaf);
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

      g.add(main, blueFacade, redAccent, goldAccent, van, car);
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

    g.add(main, wingL, wingR, roofBand, pole, flagTop, flagMid, flagBot, schoolBus);
    g.userData.labelY = 8.6;
    return g;
  }

  _createNameSign(mainText, subText = "", isBig = false) {
    const canvas = document.createElement("canvas");
    canvas.width = isBig ? 384 : 256;
    canvas.height = subText ? 84 : 56;
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
    this.plotsGroup.traverse((obj) => {
      if (obj.userData && obj.userData.isWindow) {
        obj.material = isNight ? this.mat.windowNight : this.mat.windowDay;
      }
    });
  }

  getPlotWorldCenter(plotId) {
    if (plotId === "ST_JUNCTION") return { x: 0, y: 4, z: 0, size: 4 };
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
    return { x: pos.x, y: 2.5, z: pos.z, size: 1 };
  }

  focusPlot(plotId, fastSpeed = 0.1) {
    const center = this.getPlotWorldCenter(plotId);
    const dist = center.size === 8 ? 36 : center.size === 4 ? 28 : 20;

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
    const sx = center.size === 8 ? 3.8 : center.size === 4 ? 2.0 : 1.05;
    const sy = center.size >= 4 ? 2.0 : 1.05;
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
      name: "🗽 ST JUNCTION",
      target: new THREE.Vector3(0, 4, 0),
      camPos: new THREE.Vector3(20, 22, 20),
      duration: 1.5,
      speed: 0.18,
      plotId: "ST_JUNCTION"
    });

    const landmarks = [];
    const houses = [];
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (!p || p.status !== "built") return;
      const sz = getRequiredSize(p.buildingType);
      if (sz >= 4) landmarks.push({ pid, p, sz });
      else houses.push({ pid, p, idx: parseInt(pid.replace("plot_", ""), 10) || 0 });
    });

    landmarks.slice(0, 5).forEach((lm, i) => {
      const c = this.getPlotWorldCenter(lm.pid);
      const d = lm.sz === 8 ? 34 : 24;
      const ang = i % 2 === 0 ? 1 : -1;
      stops.push({
        tag: lm.sz === 8 ? "8-PLOT STADIUM" : "TOWN LANDMARK",
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
      name: "🗿 SHERU BHAI • ST JUNCTION",
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

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
