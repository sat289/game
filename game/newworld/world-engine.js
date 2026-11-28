import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  createGLSLSkyDome,
  getSkyPalette,
  createGLSLOceanMaterial,
  createGLSLContactShadowMaterial
} from "./shaders-glsl.js?v=50";
import { createProceduralTextureSuite } from "./textures-pbr.js?v=50";
import { WasmPerfEngine } from "./wasm-perf.js?v=50";
import { optimizeStaticPlotMeshes } from "./mesh-batcher.js?v=50";
import { QualityManager } from "./quality-manager.js?v=50";
import {
  SIXTEEN_PLOT_TYPES,
  EIGHT_PLOT_TYPES,
  FOUR_PLOT_TYPES,
  TWO_PLOT_TYPES,
  BUILDING_LABELS,
  getRequiredSize,
  blockIdxToCoord,
  coordToBlockIdx,
  getBlockPlotIdsByBlockIdx,
  getBlockPlotIds,
  getTwoPlotGroup,
  getEightPlotGroup,
  getSixteenPlotGroup
} from "./world-constants.js?v=50";
import { zoneMethods } from "./world-zones.js?v=50";
import { buildingMethods } from "./world-buildings.js?v=50";
import { cinematicMethods } from "./world-cinematics.js?v=50";
import { loopMethods } from "./world-loop.js?v=50";
import { outskirtsMethods } from "./world-outskirts.js?v=50";
import { v37LandmarkMethods } from "./world-landmarks-v37.js?v=50";
import { v40VillaMethods } from "./world-villa-v40.js?v=50";
import { v41MetroPlayerMethods } from "./world-metro-player-v41.js?v=50";
import { v43StreetLifeMethods } from "./world-streetlife-v43.js?v=50";
import { v47GiveawayMethods } from "./world-giveaway-v47.js?v=50";
import { v48StreamlineMethods } from "./world-streamline-v48.js?v=50";

export {
  SIXTEEN_PLOT_TYPES,
  EIGHT_PLOT_TYPES,
  FOUR_PLOT_TYPES,
  TWO_PLOT_TYPES,
  BUILDING_LABELS,
  getRequiredSize,
  blockIdxToCoord,
  coordToBlockIdx,
  getBlockPlotIdsByBlockIdx,
  getBlockPlotIds,
  getTwoPlotGroup,
  getEightPlotGroup,
  getSixteenPlotGroup
};

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

    // v31 MULTI-LANGUAGE HIGH-QUALITY ENGINE (GLSL Shaders + WebAssembly Culling + Crisp Visitor HD!)
    const devMem = navigator.deviceMemory || 4;
    const cpuCores = navigator.hardwareConcurrency || 4;
    this.visitorHD = Boolean(options.visitorHD);
    this.graphicsPreset = this.hqMode ? "ultra" : "hd";
    this.isVeryLowRam = !this.hqMode && (devMem <= 2 || cpuCores <= 2);
    this.isLowRam = !this.hqMode && (devMem <= 3 || cpuCores <= 4);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isVeryLowRam,
      powerPreference: "high-performance",
      precision: this.hqMode ? "highp" : "mediump",
      stencil: false
    });
    this.renderer.setSize(initW, initH);
    const isMobScreen = Math.min(initW, initH) < 720;
    const nativeDpr = window.devicePixelRatio || 1.5;
    this.basePixelRatio = this.hqMode
      ? Math.min(nativeDpr, isMobScreen ? 1.75 : 2.0)
      : (this.isVeryLowRam ? Math.min(nativeDpr, 1.25) : Math.min(nativeDpr, 1.5));
    this.renderer.setPixelRatio(this.basePixelRatio);

    this.qualityMgr = new QualityManager(this.renderer, { hqMode: this.hqMode });
    this.wasmPerf = new WasmPerfEngine();
    this.skyDome = null;
    this.oceanShader = null;
    this.contactShadowMat = createGLSLContactShadowMaterial();
    this._fpsFrames = 0;
    this._fpsAccum = 0;
    this._perfThrottle = false;
    this._animFrameTick = 0;
    this._emptyPlotCoords = new Map();
    this._builtSmallPlots = new Map();
    this._builtBigPlots = new Map();
    this._plotSigCache = new Map();
    this._lastCullPerf = { drawCalls: 0, fps: 60 };
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
    this.defaultSheruGlb = "./sheru-bhai-animated.glb?v=50";
    this.heroModelUrls = { statue: "", audi: "", heli: "" };
    this.glbCache = new Map();
    this._glbPending = new Map();
    this.glbMixers = [];
    this._gltfLoader = null;
    this.heroStatueSlot = null;
    this.heroMansionSheruSlot = null;
    this.heroBeachSheruSlot = null;
    this.heroAirportSheruSlots = [];
    this.heroHeliSlot = null;
    this.heroAudiSlots = [];
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.hqMode ? 1.15 : 1.12;
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
    this.ROAD_WIDTH = 10.2;
    this.BLOCK_STEP = this.PLOT_SIZE * 2 + this.ROAD_WIDTH; // 19.0
    this.BLOCK_FOOTPRINT = this.PLOT_SIZE * 2; // 14.8
    this.EIGHT_PLOT_WIDTH = this.BLOCK_FOOTPRINT * 2 + this.ROAD_WIDTH;
    this.SIXTEEN_PLOT_WIDTH = this.BLOCK_FOOTPRINT * 2 + this.ROAD_WIDTH;
    this.RING_ROAD_WIDTH = 13.0;

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
    this.islandOwner = "@vip_island_king";
    this.rocketSim = null;
    this.outskirtsStadiumSim = null;
    this.metroSim = null;
    this.streetLifeSim = null;
    this.giveawayChestGroup = null;
    this.giveawayConfig = null;
    this.heroAirportSheruSlots = [];
    if (Array.isArray(this.glbMixers)) {
      this.glbMixers = this.glbMixers.filter((m) => !m.isCityZone);
    }
    this.rocketPadPos = { x: -104, z: 116 };
    this.seaBridgeSim = null;
    this._getSeaBridgeY = null;
    this._seaBridgeBounds = null;
    this.vipIslandPos = { x: -224, z: -2 };
    this.ferrisWheelSim = null;
    this.ferrisWheelPos = { x: -102, z: 44 };
    this.outskirtsStadiumPos = { x: 112, z: 116 };
    this.outskirtsStadiumSim = null;
    this.metroSim = null;
    this.streetLifeSim = null;
    this.beautySparkles = [];
    this.v37Animations = [];
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
    this.templeOrbit = {
      active: false,
      timer: 0,
      duration: 7.5,
      onStop: null
    };
    this.cinemaReel = {
      active: false,
      mode: null,
      timer: 0,
      duration: 8.0,
      focusTarget: new THREE.Vector3(0, 4, 0),
      focusLabel: "SHERU BHAI CITY",
      switchedSunset: false,
      switchedNight: false,
      onStop: null,
      onBanner: null
    };
    this.rainEnabled = false;
    this.rainPoints = null;
    this.rainVel = null;
    this.fireworksEnabled = false;
    this.fireworkBursts = [];
    this._fwGroup = new THREE.Group();
    this.scene.add(this._fwGroup);
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

  _initProceduralTextures() {
    this.procTex = createProceduralTextureSuite({
      isVeryLowRam: this.isVeryLowRam,
      maxAnisotropy: this.maxAnisotropy
    });
  }

  _initSharedMaterials() {
    this.mat = {
      grass: new THREE.MeshLambertMaterial({ map: this.procTex.grassTex }),
      turf: new THREE.MeshLambertMaterial({ map: this.procTex.turfTex }),
      pitch: new THREE.MeshLambertMaterial({ color: 0xd6b588 }),
      road: new THREE.MeshLambertMaterial({ map: this.procTex.roadTex }),
      highway: new THREE.MeshLambertMaterial({ map: this.procTex.highwayTex }),
      median: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      sidewalk: new THREE.MeshLambertMaterial({ map: this.procTex.paverTex, color: 0xb0bec5 }),
      concrete: new THREE.MeshLambertMaterial({ map: this.procTex.paverTex, color: 0xdbe4ee }),
      marble: new THREE.MeshPhongMaterial({ map: this.procTex.marbleTex, color: 0xffffff, specular: 0xffffff, shininess: 95 }),
      bronze: new THREE.MeshLambertMaterial({ color: 0xd97706 }),
      gold: new THREE.MeshLambertMaterial({ color: 0xfbbf24 }),
      water: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }),
      stripe: new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
      wood: new THREE.MeshPhongMaterial({ map: this.procTex.woodTex, bumpMap: this.procTex.woodBump, bumpScale: 0.08, color: 0xa16207, shininess: 28 }),
      darkWood: new THREE.MeshPhongMaterial({ map: this.procTex.woodTex, bumpMap: this.procTex.woodBump, bumpScale: 0.08, color: 0x6b3510, shininess: 32 }),
      brickRed: new THREE.MeshPhongMaterial({ map: this.procTex.brickTex, bumpMap: this.procTex.brickBump, bumpScale: 0.14, color: 0xffffff, shininess: 18 }),
      stoneDark: new THREE.MeshLambertMaterial({ map: this.procTex.rockTex, color: 0x64748b }),
      charcoal: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      balconyPlant: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      roofDark: new THREE.MeshPhongMaterial({ map: this.procTex.roofTex, bumpMap: this.procTex.roofBump, bumpScale: 0.1, color: 0x475569, shininess: 24 }),
      roofRed: new THREE.MeshPhongMaterial({ map: this.procTex.roofTex, bumpMap: this.procTex.roofBump, bumpScale: 0.1, color: 0xdc2626, shininess: 24 }),
      roofOrange: new THREE.MeshPhongMaterial({ map: this.procTex.roofTex, bumpMap: this.procTex.roofBump, bumpScale: 0.1, color: 0xea580c, shininess: 24 }),
      wallWhite: new THREE.MeshPhongMaterial({ map: this.procTex.stuccoTex, bumpMap: this.procTex.stuccoBump, bumpScale: 0.04, color: 0xfafaf9, shininess: 14 }),
      wallCream: new THREE.MeshPhongMaterial({ map: this.procTex.stuccoTex, bumpMap: this.procTex.stuccoBump, bumpScale: 0.05, color: 0xfef3c7, shininess: 14 }),
      wallWarmStone: new THREE.MeshPhongMaterial({ map: this.procTex.stuccoTex, bumpMap: this.procTex.stuccoBump, bumpScale: 0.06, color: 0xe7dfd1, shininess: 16 }),
      wallKhaki: new THREE.MeshPhongMaterial({ map: this.procTex.stuccoTex, bumpMap: this.procTex.stuccoBump, bumpScale: 0.06, color: 0xdccaa4, shininess: 16 }),
      wallBlue: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }),
      wallCoral: new THREE.MeshLambertMaterial({ color: 0xfb7185 }),
      wallMint: new THREE.MeshLambertMaterial({ color: 0x34d399 }),
      wallGold: new THREE.MeshLambertMaterial({ color: 0xfbbf24 }),
      glass: new THREE.MeshPhongMaterial({ map: this.procTex.glassTex, color: 0xdbeafe, specular: 0xffffff, shininess: 135, transparent: true, opacity: 0.78 }),
      darkGlass: new THREE.MeshPhongMaterial({ map: this.procTex.glassTex, color: 0x334155, specular: 0xe0f2fe, shininess: 120 }),
      appleSilver: new THREE.MeshPhongMaterial({ map: this.procTex.metalPanelTex, color: 0xf1f5f9, specular: 0xffffff, shininess: 135 }),
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
      windowNight: new THREE.MeshBasicMaterial({ map: this.procTex.nightWinTex, color: 0xffffff }),
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
      stuccoIvory: new THREE.MeshPhongMaterial({ map: this.procTex.stuccoTex, bumpMap: this.procTex.stuccoBump, bumpScale: 0.05, color: 0xf7f2e8, shininess: 16 }),
      stuccoCream: new THREE.MeshPhongMaterial({ map: this.procTex.stuccoTex, bumpMap: this.procTex.stuccoBump, bumpScale: 0.05, color: 0xfaf1df, shininess: 16 }),
      stuccoSage: new THREE.MeshPhongMaterial({ map: this.procTex.stuccoTex, bumpMap: this.procTex.stuccoBump, bumpScale: 0.05, color: 0xd1dcc5, shininess: 16 }),
      stuccoSandstone: new THREE.MeshPhongMaterial({ map: this.procTex.stuccoTex, bumpMap: this.procTex.stuccoBump, bumpScale: 0.06, color: 0xebd9bc, shininess: 18 }),
      plinthGrey: new THREE.MeshLambertMaterial({ map: this.procTex.paverTex, color: 0x7c8ca3 }),
      slateTrim: new THREE.MeshPhongMaterial({ map: this.procTex.metalPanelTex, color: 0x475569, shininess: 48 }),
      terracottaRoof: new THREE.MeshPhongMaterial({ map: this.procTex.roofTex, bumpMap: this.procTex.roofBump, bumpScale: 0.12, color: 0xb45309, shininess: 22 }),
      teakWood: new THREE.MeshPhongMaterial({ map: this.procTex.woodTex, bumpMap: this.procTex.woodBump, bumpScale: 0.09, color: 0x9a5b29, shininess: 35 }),
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
      beachSand: new THREE.MeshLambertMaterial({ map: this.procTex.sandTex, color: 0xffffff }),
      beachSandWet: new THREE.MeshLambertMaterial({ map: this.procTex.sandTex, color: 0xd9b355 }),
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
      railBallast: new THREE.MeshLambertMaterial({ map: this.procTex.ballastTex, color: 0xffffff }),
      trainBlue: new THREE.MeshLambertMaterial({ color: 0x1d4ed8 }),
      trainDarkBlue: new THREE.MeshLambertMaterial({ color: 0x1e3a8a }),
      trainYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      trainRoof: new THREE.MeshLambertMaterial({ color: 0xcbd5e1 }),
      mountainRock: new THREE.MeshLambertMaterial({ map: this.procTex.rockTex, color: 0x78716c }),
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
      tunnelConcrete: new THREE.MeshLambertMaterial({ map: this.procTex.paverTex, color: 0x94a3b8 }),
      tunnelDarkWall: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      // Araku Valley Misty Mountains, Forest Pines, Rivers & Waterfalls
      arakuDeepGreen: new THREE.MeshLambertMaterial({ color: 0x14532d }),
      arakuForestGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      arakuLushHill: new THREE.MeshLambertMaterial({ color: 0x166534 }),
      arakuRockGrey: new THREE.MeshLambertMaterial({ map: this.procTex.rockTex, color: 0x64748b }),
      arakuCliffDark: new THREE.MeshLambertMaterial({ map: this.procTex.rockTex, color: 0x475569 }),
      riverBlue: new THREE.MeshLambertMaterial({ color: 0x0ea5e9 }),
      waterfallBlue: new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 }),
      waterfallFoam: new THREE.MeshBasicMaterial({ color: 0xf0f9ff, transparent: true, opacity: 0.9 }),
      valleyMist: new THREE.MeshLambertMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.52 }),
      // 8-Plot Movie Theater & 4-Plot Real D-Mart Materials
      cinemaObsidian: new THREE.MeshPhongMaterial({ map: this.procTex.blackGoldMarbleTex, color: 0xffffff, specular: 0xfacc15, shininess: 110 }),
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
      imaxDomeSilver: new THREE.MeshPhongMaterial({ map: this.procTex.metalPanelTex, color: 0xe2e8f0, specular: 0xffffff, shininess: 145 }),
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
      templeStepStone: new THREE.MeshLambertMaterial({ map: this.procTex.marbleTex, color: 0xf1f5f9 }),
      templeHillGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      templeHillRock: new THREE.MeshLambertMaterial({ map: this.procTex.rockTex, color: 0x7c8ca3 }),
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
      }),
      // v29 Biryani Point, Box Cricket Turf & GT650 Superbike Showroom Materials
      biryaniOrange: new THREE.MeshLambertMaterial({ color: 0xea580c }),
      biryaniBrass: new THREE.MeshPhongMaterial({ color: 0xd97706, specular: 0xfef08a, shininess: 140 }),
      biryaniSteam: new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.55 }),
      cricketNetMat: new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.24, wireframe: true }),
      floodlightGlow: new THREE.MeshBasicMaterial({ color: 0xfef9c3 }),
      bikeRacingRed: new THREE.MeshPhongMaterial({ color: 0xdc2626, specular: 0xffffff, shininess: 150 }),
      bikeChromeGold: new THREE.MeshPhongMaterial({ color: 0xf59e0b, specular: 0xffffff, shininess: 160 }),
      // v30 ISRO Rocket Launchpad, RGB Sea Bridge, VIP Island & Ferris Wheel Materials
      rocketWhite: new THREE.MeshPhongMaterial({ map: this.procTex.metalPanelTex, color: 0xffffff, specular: 0xffffff, shininess: 125 }),
      rocketGantryRed: new THREE.MeshLambertMaterial({ color: 0xdc2626 }),
      rocketFlame: new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      rocketFlameCore: new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
      rocketSmoke: new THREE.MeshLambertMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.72 }),
      bridgeDeckAsphalt: new THREE.MeshLambertMaterial({ map: this.procTex.highwayTex, color: 0xffffff }),
      bridgePylonWhite: new THREE.MeshPhongMaterial({ color: 0xf1f5f9, specular: 0xffffff, shininess: 90 }),
      ferrisSteel: new THREE.MeshPhongMaterial({ color: 0xe2e8f0, specular: 0xffffff, shininess: 130 }),
      ferrisRimNeon: new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
      // v35 Sheru Bhai Royal Island Mansion & Luxury Beauty Parlour PBR Materials
      mansionBlackMarble: new THREE.MeshPhongMaterial({ map: this.procTex.blackGoldMarbleTex, color: 0xffffff, specular: 0xfacc15, shininess: 155 }),
      mansionCreamMarble: new THREE.MeshPhongMaterial({ map: this.procTex.marbleTex, color: 0xfef6e4, specular: 0xffffff, shininess: 110 }),
      mansionRoofDark: new THREE.MeshPhongMaterial({ map: this.procTex.roofTex, bumpMap: this.procTex.roofBump, bumpScale: 0.12, color: 0x293242, shininess: 35 }),
      mansionWarmGlow: new THREE.MeshBasicMaterial({ map: this.procTex.nightWinTex, color: 0xfffbeb }),
      mansionHedge: new THREE.MeshLambertMaterial({ color: 0x166534 }),
      mansionGoldTrim: new THREE.MeshPhongMaterial({ color: 0xeab308, emissive: 0x713f12, emissiveIntensity: 0.2, specular: 0xfef9c3, shininess: 170 }),
      ramSuitBlack: new THREE.MeshPhongMaterial({ color: 0x111827, specular: 0x64748b, shininess: 95 }),
      ramHornBrown: new THREE.MeshLambertMaterial({ color: 0x78553a }),
      beautyBlush: new THREE.MeshPhongMaterial({ map: this.procTex.stuccoTex, bumpMap: this.procTex.stuccoBump, bumpScale: 0.04, color: 0xfce7f3, shininess: 22 }),
      beautyHotPink: new THREE.MeshPhongMaterial({ color: 0xec4899, specular: 0xffffff, shininess: 135 }),
      beautyRoseGold: new THREE.MeshPhongMaterial({ color: 0xf4a29e, specular: 0xfff1f2, shininess: 155 }),
      beautySparklePink: new THREE.MeshBasicMaterial({ color: 0xf472b6 }),
      beautySparkleGold: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
      // v37 Swamy School, Inorbit Mall, FF Office, Yamaha & Stark Tower Materials
      swamySkyBlue: new THREE.MeshLambertMaterial({ color: 0x0284c7 }),
      swamyArchMaroon: new THREE.MeshLambertMaterial({ color: 0x6b1d28 }),
      swamyUniformNavy: new THREE.MeshLambertMaterial({ color: 0x1e3a8a }),
      inorbitNavy: new THREE.MeshPhongMaterial({ color: 0x0c4a6e, specular: 0x7dd3fc, shininess: 110 }),
      inorbitCyanGlow: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      ffOrangeGlow: new THREE.MeshBasicMaterial({ color: 0xf97316 }),
      yamahaBlue: new THREE.MeshPhongMaterial({ color: 0x0033a0, specular: 0x93c5fd, shininess: 140 }),
      starkArcGlow: new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    };
  }

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

  _getColorMat(hex) {
    if (!this.colorMatCache.has(hex)) {
      this.colorMatCache.set(hex, new THREE.MeshLambertMaterial({ color: hex }));
    }
    return this.colorMatCache.get(hex);
  }

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

  _collectDynamicSet() {
    const dynamicSet = new Set();
    if (this.turntableRotors) this.turntableRotors.forEach((r) => { if (r.mesh) dynamicSet.add(r.mesh); });
    if (this.landmarkActors) this.landmarkActors.forEach((a) => { if (a.mesh) dynamicSet.add(a.mesh); });
    if (this.theaterDiscos) this.theaterDiscos.forEach((t) => {
      if (t.nightGroup) dynamicSet.add(t.nightGroup);
      if (t.skyBeams) t.skyBeams.forEach((b) => { dynamicSet.add(b.pivot); dynamicSet.add(b.cone); dynamicSet.add(b.core); if (b.airHalo) dynamicSet.add(b.airHalo); });
    });
    if (this.studioFlashes) this.studioFlashes.forEach((f) => { if (f.mesh) dynamicSet.add(f.mesh); });
    if (this.sirenLights) this.sirenLights.forEach((s) => { if (s.red) dynamicSet.add(s.red); if (s.blue) dynamicSet.add(s.blue); if (s.mesh) dynamicSet.add(s.mesh); });
    if (this.petrolSimulations) this.petrolSimulations.forEach((s) => { if (s.vehicle) dynamicSet.add(s.vehicle); if (s.attendant) dynamicSet.add(s.attendant); });
    if (this.busSimulations) this.busSimulations.forEach((s) => { if (s.bus) dynamicSet.add(s.bus); if (s.driver) dynamicSet.add(s.driver); if (s.passengers) s.passengers.forEach((p) => dynamicSet.add(p)); });
    if (this.autoSimulations) this.autoSimulations.forEach((s) => { if (s.auto) dynamicSet.add(s.auto); if (s.driver) dynamicSet.add(s.driver); });
    if (this.policeSimulations) this.policeSimulations.forEach((s) => { if (s.car) dynamicSet.add(s.car); if (s.officer) dynamicSet.add(s.officer); });
    if (this.ambulanceSimulations) this.ambulanceSimulations.forEach((s) => { if (s.amb) dynamicSet.add(s.amb); if (s.medic) dynamicSet.add(s.medic); });
    if (this.heroAudiSlots) this.heroAudiSlots.forEach((a) => { if (a.group) dynamicSet.add(a.group); });
    if (this.beautySparkles) this.beautySparkles.forEach((b) => { if (b.group) dynamicSet.add(b.group); });
    if (this.v37Animations) this.v37Animations.forEach((v) => {
      if (v.drones) v.drones.forEach((d) => { if (d.mesh) dynamicSet.add(d.mesh); });
      if (v.fwGroup) dynamicSet.add(v.fwGroup);
      if (v.swamis) v.swamis.forEach((sw) => { if (sw.mesh) dynamicSet.add(sw.mesh); });
      if (v.elevCabin) dynamicSet.add(v.elevCabin);
      if (v.fireFlame) dynamicSet.add(v.fireFlame);
      if (v.fJet) dynamicSet.add(v.fJet);
    });
    return dynamicSet;
  }

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
    if (this.contactShadowMat) cachedSignMats.add(this.contactShadowMat);
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

  _buildSkyDecor() {
    // 🎨 GLSL GPU ATMOSPHERIC SKY DOME (1 Draw Call — Smooth Realistic Sky Gradient & Sun Glow!)
    this.skyDome = createGLSLSkyDome();
    this.scene.add(this.skyDome.mesh);

    const starCount = this.isLowRam ? 160 : 260;
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

      // 📍 MANUAL ADMIN GIFT PLACEMENT MODE (Tap anywhere on 3D ground, mountain, or building!)
      if (this.giveawayPlacementMode) {
        const surfaceHits = this.raycaster.intersectObjects([this.cityGroup, this.plotsGroup], true);
        let picked = null;
        for (const sh of surfaceHits) {
          if (sh.object && sh.object.isMesh && sh.object.material !== this.mat.invisibleHitbox) {
            picked = sh.point;
            break;
          }
        }
        if (!picked) {
          const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const pt = new THREE.Vector3();
          if (this.raycaster.ray.intersectPlane(groundPlane, pt)) picked = pt;
        }
        if (picked) {
          const px = Number(picked.x.toFixed(1));
          const py = Number(Math.max(0.45, picked.y + 0.25).toFixed(1));
          const pz = Number(picked.z.toFixed(1));
          this.moveGiveawayPreviewTo(px, py, pz);
          if (typeof this.onGiveawayPointPicked === "function") {
            this.onGiveawayPointPicked(px, py, pz);
          }
        }
        return;
      }

      const hits = this.raycaster.intersectObjects(this.plotHitboxes, false);
      if (hits.length > 0) {
        // 🎁 ALWAYS prioritize SECRET_GIVEAWAY even when placed inside Beach/Airport/Temple zone hitboxes!
        const gwHit = hits.find((h) => h.object.userData.plotId === "SECRET_GIVEAWAY");
        if (gwHit) {
          if (typeof this.onGiveawayFound === "function" && this.giveawayConfig) {
            this.onGiveawayFound(this.giveawayConfig);
          }
          return;
        }
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

  setIslandOwner(ownerName) {
    const clean = (ownerName || "@vip_island_king").trim();
    if (clean !== this.islandOwner) {
      this.islandOwner = clean;
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
      this._plotSigCache.delete(plotId);
      this._builtSmallPlots.delete(plotId);
      this._builtBigPlots.delete(plotId);
    }
    this.plotSigns = this.plotSigns.filter((s) => s.plotId !== plotId);
    this.plotHitboxes = this.plotHitboxes.filter((h) => h.userData.plotId !== plotId);
    this.sirenLights = this.sirenLights.filter((s) => s.plotId !== plotId);
    this.landmarkActors = this.landmarkActors.filter((a) => a.plotId !== plotId);
    this.turntableRotors = this.turntableRotors.filter((r) => r.plotId !== plotId);
    this.studioFlashes = this.studioFlashes.filter((f) => f.plotId !== plotId);
    this.theaterDiscos = this.theaterDiscos.filter((t) => t.plotId !== plotId);
    this.heroAudiSlots = this.heroAudiSlots.filter((a) => a.plotId !== plotId);
    this.beautySparkles = this.beautySparkles.filter((b) => b.plotId !== plotId);
    this.v37Animations = this.v37Animations.filter((v) => v.plotId !== plotId);
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
      (h) => !["ST_JUNCTION", "AIRPORT", "BEACH", "RAILWAY_STATION", "RAILWAY_SOUTH", "ADD_AIRPORT_PLOT", "ADD_BEACH_PLOT", "HILL_TEMPLE", "ROCKET_PAD", "VIP_ISLAND", "FERRIS_WHEEL", "OUTSKIRTS_STADIUM"].includes(h.userData.plotId)
    );
    this.airportSim = null;
    this.beachSim = null;
    this.railwaySim = null;
    this.arakuSim = null;
    this.hillTempleSim = null;
    this.beachHighwaySim = null;
    this.rocketSim = null;
    this.seaBridgeSim = null;
    this.ferrisWheelSim = null;
    if (Array.isArray(this.landmarkActors)) {
      this.landmarkActors = this.landmarkActors.filter(
        (a) => !["BEACH_OYO_DEFAULT", "BEACH_HOSTEL_DEFAULT", "BEACH_MED_DEFAULT"].includes(a.plotId)
      );
    }
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
    this._buildSeaBridgeAndVipIsland(ringRadius);
    this._buildBeachFerrisWheel(ringRadius);
    this._buildRocketLaunchpad(ringRadius);
    this._buildOutskirtsCricketStadium(ringRadius);
    this._buildMetroSystem(ringRadius);
    this._buildStreetLifeSystem(ringRadius);
    this._buildArakuLandscape(ringRadius);
    // Keep any existing custom Airport / Beach zone plots positioned accurately!
    for (const [pid, pdata] of this.plotDataMap.entries()) {
      if (pdata && pdata.isCustomZone) {
        this.renderPlot(pid, pdata, false, true);
      }
    }
    if (this.shadowsEnabled) this._applyShadowFlags(this.cityGroup);
    this.setTimeOfDay(this.timeOfDay);
  }

  renderPlot(plotId, data, animateBuild = false, forceRebuild = false) {
    const isCustom = Boolean(data?.isCustomZone || plotId.startsWith("zone_"));
    const plotIndex = isCustom ? -1 : parseInt(plotId.replace("plot_", ""), 10) - 1;
    if (!isCustom && (isNaN(plotIndex) || plotIndex < 0)) return;

    // ⚡ INCREMENTAL DIFF SKIP: Never destroy & rebuild unchanged plots (400x faster when adding buildings!)
    const isCovered = !isCustom && this.landmarkCoveredPlots.has(plotId);
    const sig = [
      data?.status || "empty",
      data?.buildingType || "empty",
      data?.ownerName || "",
      data?.size || 1,
      isCustom ? 1 : 0,
      data?.zone || "",
      data?.offsetX || 0,
      data?.offsetZ || 0,
      data?.customRotY || 0,
      isCovered ? 1 : 0
    ].join("|");

    this.plotDataMap.set(plotId, data);
    if (!forceRebuild && !animateBuild && this._plotSigCache.get(plotId) === sig && this.plotMeshes.has(plotId)) {
      return;
    }
    this._plotSigCache.set(plotId, sig);
    this._builtSmallPlots.delete(plotId);
    this._builtBigPlots.delete(plotId);

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
      this.beautySparkles = this.beautySparkles.filter((b) => b.plotId !== plotId);
      this.v37Animations = this.v37Animations.filter((v) => v.plotId !== plotId);
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
    const size = data?.status === "built" ? Math.max(data.size || 1, reqSize) : 1;
    const isSixteenPlot = !isCustom && size === 16;
    const isEightPlot = !isCustom && size === 8;
    const isFourPlot = !isCustom && size === 4;
    const isTwoPlot = !isCustom && size === 2;

    const plotGroup = new THREE.Group();
    if (isCustom) {
      plotGroup.position.set(customWorldX, 0.08, customWorldZ);
    } else if (isSixteenPlot) {
      const grpInfo = getSixteenPlotGroup(plotId);
      const coords = grpInfo.blockIdxs.map((idx) => blockIdxToCoord(idx));
      const avgX = coords.reduce((acc, c) => acc + c.bx * this.BLOCK_STEP, 0) / coords.length;
      const avgZ = coords.reduce((acc, c) => acc + c.bz * this.BLOCK_STEP, 0) / coords.length;
      plotGroup.position.set(avgX, 0.08, avgZ);
      this.blockedRoadZones.push({
        plotId,
        minX: avgX - this.SIXTEEN_PLOT_WIDTH / 2 - 1,
        maxX: avgX + this.SIXTEEN_PLOT_WIDTH / 2 + 1,
        minZ: avgZ - this.SIXTEEN_PLOT_WIDTH / 2 - 1,
        maxZ: avgZ + this.SIXTEEN_PLOT_WIDTH / 2 + 1
      });
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

    const effSixteen = isSixteenPlot || (isCustom && size === 16);
    const effEight = isEightPlot || (isCustom && size === 8);
    const effFour = isFourPlot || (isCustom && size === 4);
    const effTwo = isTwoPlot || (isCustom && size === 2);

    let hitbox;
    if (effSixteen) {
      hitbox = new THREE.Mesh(this._boxGeo(this.SIXTEEN_PLOT_WIDTH, 18.0, this.SIXTEEN_PLOT_WIDTH), this.mat.invisibleHitbox);
      hitbox.position.y = 9.0;
    } else if (effEight || effFour) {
      const hitW = effEight ? this.EIGHT_PLOT_WIDTH : this.BLOCK_FOOTPRINT - 0.2;
      hitbox = new THREE.Mesh(
        this._boxGeo(hitW, (data?.buildingType === "hotel_oyo" || data?.buildingType === "stark_tower") ? 32.0 : 12.0, this.BLOCK_FOOTPRINT - 0.2),
        this.mat.invisibleHitbox
      );
      hitbox.position.y = (data?.buildingType === "hotel_oyo" || data?.buildingType === "stark_tower") ? 16.0 : 6.0;
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

    // 🎨 GLSL BAKED GROUND CONTACT-SHADOW (Crisp Soft 3D Depth on 2GB-4GB Visitor Phones at Near-Zero Cost!)
    if (data && data.status === "built" && data.buildingType !== "empty" && this.contactShadowMat) {
      const shW = effEight ? this.EIGHT_PLOT_WIDTH + 1.8 : effFour ? this.BLOCK_FOOTPRINT + 1.4 : effTwo ? this.BLOCK_FOOTPRINT + 1.2 : this.PLOT_SIZE + 0.9;
      const shD = effEight ? this.BLOCK_FOOTPRINT + 1.6 : effFour ? this.BLOCK_FOOTPRINT + 1.4 : this.PLOT_SIZE + 0.9;
      const aoPlane = new THREE.Mesh(new THREE.PlaneGeometry(shW, shD), this.contactShadowMat);
      aoPlane.rotation.x = -Math.PI / 2;
      aoPlane.position.y = effEight ? 0.27 : 0.15;
      aoPlane.userData._noMerge = true;
      if (isCustom && (effEight || effFour || effTwo)) aoPlane.rotation.z = -pos.rotY;
      plotGroup.add(aoPlane);
    }

    let buildingObj = null;

    if (!data || data.status !== "built" || data.buildingType === "empty") {
      buildingObj = this._buildEmptyPlotMesh();
      this._emptyPlotCoords.set(plotId, { grp: plotGroup, x: plotGroup.position.x, z: plotGroup.position.z });
    } else if (isEightPlot) {
      this._emptyPlotCoords.delete(plotId);
      if (data.buildingType === "billionaire_villa") {
        buildingObj = this._buildEightPlotBillionaireVilla(plotId, data.ownerName);
        const topLabel = data.ownerName || "BILLIONAIRE VILLA";
        const sign = this._createNameSign(topLabel, "👑 బిలియనీర్ విల్లా • ULTRA-PREMIUM 8-PLOT PALACE", true);
        sign.position.set(0, 16.2, 0);
        buildingObj.add(sign);
      } else if (data.buildingType === "swamy_school") {
        buildingObj = this._buildEightPlotSwamySchool(plotId, data.ownerName);
        const topLabel = data.ownerName || "SWAMY E.M. HIGH SCHOOL";
        const sign = this._createNameSign(topLabel, "🏫 స్వామి ఇంగ్లీష్ మీడియం హై స్కూల్ • KAKINADA", true);
        sign.position.set(0, 14.8, 0);
        buildingObj.add(sign);
      } else if (data.buildingType === "dmart_mega") {
        buildingObj = this._buildEightPlotMegaDMart(plotId, data.ownerName);
        const topLabel = data.ownerName || "MEGA D-MART";
        const sign = this._createNameSign(topLabel, "🛒 మెగా డి-మార్ట్ • 8-PLOT SUPER HYPERMARKET", true);
        sign.position.set(0, 12.6, 0);
        buildingObj.add(sign);
      } else if (data.buildingType === "inorbit_mall") {
        buildingObj = this._buildEightPlotInorbitMall(plotId, data.ownerName);
        const topLabel = data.ownerName || "INORBIT MALL";
        const sign = this._createNameSign(topLabel, "🏬 ఇనార్బిట్ మాల్ • 8-PLOT MEGA MALL", true);
        sign.position.set(0, 16.5, 0);
        buildingObj.add(sign);
      } else if (data.buildingType === "function_hall") {
        buildingObj = this._buildEightPlotFunctionHall(plotId, data.ownerName);
        const topLabel = data.ownerName || "GRAND FUNCTION HALL";
        const sign = this._createNameSign(topLabel, "🎉 ఫంక్షన్ హాల్ • DJ • DRONES • FIREWORKS • LUNCH", true);
        sign.position.set(0, 15.2, 0);
        buildingObj.add(sign);
      } else if (data.buildingType === "imax_theater") {
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
      if (effSixteen) {
        buildingObj = this._buildSixteenPlotStreamlineHQ(plotId, data.ownerName);
        const topLabel = data.ownerName || "STREAMLINE SOLUTIONS";
        const sign = this._createNameSign(topLabel, "🌐 STREAMLINE SOLUTIONS • 16-PLOT HQ", true);
        sign.position.set(0, 22.5, 0);
        buildingObj.add(sign);
      } else if (isCustom && size === 8) {
        buildingObj = data.buildingType === "billionaire_villa"
          ? this._buildEightPlotBillionaireVilla(plotId, data.ownerName)
          : data.buildingType === "swamy_school"
          ? this._buildEightPlotSwamySchool(plotId, data.ownerName)
          : data.buildingType === "dmart_mega"
          ? this._buildEightPlotMegaDMart(plotId, data.ownerName)
          : data.buildingType === "inorbit_mall"
          ? this._buildEightPlotInorbitMall(plotId, data.ownerName)
          : data.buildingType === "function_hall"
          ? this._buildEightPlotFunctionHall(plotId, data.ownerName)
          : data.buildingType === "imax_theater"
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
        const subLabel = isCustom && size >= 2
          ? this._getLandmarkSubtitle(data.buildingType)
          : data.buildingType === "shop" ? "టీ & టిఫిన్ • SHOP"
          : data.buildingType === "cafe" ? "☕ COFFEE CAFE"
          : data.buildingType === "biryani_point" ? "🍲 DUM BIRYANI • FAST FOOD"
          : data.buildingType === "medical_shop" ? "💊 24/7 MEDICAL SHOP"
          : data.buildingType === "veg_shop" ? "🥬 FRESH VEGETABLES"
          : data.buildingType === "mobile_shop" ? "📱 MOBILE SHOP • 5G"
          : data.buildingType === "ice_cream_shop" ? "🍨 ICE CREAM PARLOUR"
          : data.buildingType === "beach_villa" ? "🏖️ BEACH HOUSE VILLA"
          : "";
        const sign = this._createNameSign(data.ownerName, subLabel, Boolean(isCustom && size >= 4));
        sign.position.set(0, buildingObj.userData.labelY || 5.2, 0);
        plotGroup.add(sign);
        this.plotSigns.push({ plotId, sprite: sign, x: pos.x, z: pos.z });
      }
    }

    // ⚡ AUTOMATIC STATIC GEOMETRY BATCHING BY MATERIAL (Cuts 8,000+ GPU Draw Calls down by ~75%!)
    if (data && data.status === "built" && data.buildingType !== "empty" && buildingObj) {
      const dynSet = this._collectDynamicSet();
      optimizeStaticPlotMeshes(buildingObj, dynSet, this._sharedGeoSet);

      // Register any landmark floating sign sprites inside buildingObj into plotSigns for WASM culling!
      const alreadyHasSign = this.plotSigns.some((s) => s.plotId === plotId);
      if (!alreadyHasSign) {
        buildingObj.children.forEach((ch) => {
          if (ch.isSprite) {
            this.plotSigns.push({ plotId, sprite: ch, x: plotGroup.position.x, z: plotGroup.position.z });
          }
        });
      }

      // Register built plot into WASM Distance-Culling Map (1/2-plot small vs 4/8-plot skyline landmarks)
      const cullEntry = { plotId, grp: plotGroup, x: plotGroup.position.x, z: plotGroup.position.z };
      if (effEight || effFour) {
        this._builtBigPlots.set(plotId, cullEntry);
      } else {
        this._builtSmallPlots.set(plotId, cullEntry);
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

  _createNameSign(mainText, subText = "", isBig = false) {
    const hi = this.hqMode;
    const lite = this.isLowRam && !isBig && !hi;
    const key = `SPRITE|${hi ? 1 : lite ? 2 : 0}|${isBig ? 1 : 0}|${mainText}|${subText}`;
    let mat = this.signTexCache.get(key);

    if (!mat) {
      const canvas = document.createElement("canvas");
      canvas.width = isBig ? (hi ? 640 : 512) : (hi ? 400 : lite ? 304 : 352);
      canvas.height = subText
        ? (isBig ? (hi ? 164 : 132) : (hi ? 116 : lite ? 84 : 100))
        : (isBig ? (hi ? 116 : 96) : (hi ? 88 : lite ? 64 : 76));
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
      const fScale = hi ? 1.22 : lite ? 0.92 : 1.06;
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
}

Object.assign(
  FollowerTownEngine.prototype,
  zoneMethods,
  buildingMethods,
  cinematicMethods,
  loopMethods,
  outskirtsMethods,
  v37LandmarkMethods,
  v40VillaMethods,
  v41MetroPlayerMethods,
  v43StreetLifeMethods,
  v47GiveawayMethods,
  v48StreamlineMethods
);
