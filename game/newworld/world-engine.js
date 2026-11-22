import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const EIGHT_PLOT_TYPES = new Set(["ground"]);

export const FOUR_PLOT_TYPES = new Set([
  "police_station",
  "hospital",
  "school",
  "bus_stand",
  "petrol_bunk",
  "srmt_mall",
  "apple_store",
  "reliance_store"
]);

export const BUILDING_LABELS = {
  house_blue: "🏠 Blue Terrace House",
  house_coral: "🏠 Coral Modern House",
  house_mint: "🏡 Mint Villa",
  house_gold: "🏢 Golden Duplex",
  shop: "☕ టీ & టిఫిన్ • SHOP",
  ground: "🏏 గ్రౌండ్ • MEGA CRICKET STADIUM (8 PLOTS)",
  school: "🏫 పాఠశాల • GRAND SCHOOL (4 PLOTS)",
  hospital: "🏥 ఆసుపత్రి • SUPER HOSPITAL (4 PLOTS)",
  bus_stand: "🚌 బస్ స్టాండ్ • APSRTC TERMINAL (4 PLOTS)",
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
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0016);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(36, aspect, 0.5, 1300);
    this.camera.position.set(66, 68, 66);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2.25;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 360;
    this.controls.target.set(0, 0, 0);

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
    this.plotHitboxes = [];
    this.lampBulbs = [];
    this.vehicleHeadlights = []; // Night headlights & road light beams
    this.sirenLights = [];
    this.landmarkActors = [];
    this.petrolSimulations = [];
    this.busSimulations = [];
    this.policeSimulations = [];
    this.ambulanceSimulations = [];
    this.blockedRoadZones = [];
    this.vehicles = [];
    this.ringVehicles = [];
    this.workers = [];
    this.postman = null;
    this.constructions = [];

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
    this._initEvents();

    this.ensureCapacity(36);
    this._animate();
  }

  _initLights() {
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x4d7c0f, 0.82);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.38);
    this.sunLight.position.set(72, 112, 58);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 360;
    const d = 135;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
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
      roofDark: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      roofRed: new THREE.MeshLambertMaterial({ color: 0xb91c1c }),
      roofOrange: new THREE.MeshLambertMaterial({ color: 0xc2410c }),
      wallWhite: new THREE.MeshLambertMaterial({ color: 0xf8fafc }),
      wallCream: new THREE.MeshLambertMaterial({ color: 0xfef3c7 }),
      wallKhaki: new THREE.MeshLambertMaterial({ color: 0xd6c39c }),
      wallBlue: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }),
      wallCoral: new THREE.MeshLambertMaterial({ color: 0xfb7185 }),
      wallMint: new THREE.MeshLambertMaterial({ color: 0x34d399 }),
      wallGold: new THREE.MeshLambertMaterial({ color: 0xfbbf24 }),
      glass: new THREE.MeshLambertMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.72 }),
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
      headlightBeam: new THREE.MeshBasicMaterial({ color: 0xfef9c3, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
      taillight: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
      windowDay: new THREE.MeshLambertMaterial({ color: 0x7dd3fc }),
      windowNight: new THREE.MeshLambertMaterial({ color: 0xfde047 }),
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
      wheelBlack: new THREE.MeshLambertMaterial({ color: 0x0f172a })
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
            camPos: new THREE.Vector3(24, 24, 24)
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
    ground.receiveShadow = true;
    this.cityGroup.add(ground);

    const roadLines = [];
    for (let i = -r; i <= r + 1; i++) {
      roadLines.push((i - 0.5) * this.BLOCK_STEP);
    }

    const roadLen = innerSpan + this.ROAD_WIDTH;
    const roadGeoH = new THREE.BoxGeometry(roadLen, 0.08, this.ROAD_WIDTH);
    const roadGeoV = new THREE.BoxGeometry(this.ROAD_WIDTH, 0.08, roadLen);

    roadLines.forEach((pos) => {
      const roadH = new THREE.Mesh(roadGeoH, this.mat.road);
      roadH.position.set(0, 0.01, pos);
      roadH.receiveShadow = true;
      this.cityGroup.add(roadH);

      const roadV = new THREE.Mesh(roadGeoV, this.mat.road);
      roadV.position.set(pos, 0.01, 0);
      roadV.receiveShadow = true;
      this.cityGroup.add(roadV);

      for (let d = -roadLen / 2 + 2; d < roadLen / 2 - 2; d += 4.8) {
        const dashH = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.16), this.mat.stripe);
        dashH.rotation.x = -Math.PI / 2;
        dashH.position.set(d, 0.06, pos);
        this.cityGroup.add(dashH);

        const dashV = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.8), this.mat.stripe);
        dashV.rotation.x = -Math.PI / 2;
        dashV.position.set(pos, 0.06, d);
        this.cityGroup.add(dashV);
      }
    });

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

    for (let p = -ringRadius + 8; p <= ringRadius - 8; p += 16) {
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

    const padSize = this.PLOT_SIZE * 2 + 0.8;
    const padGeo = new THREE.BoxGeometry(padSize, 0.12, padSize);
    for (let bx = -r; bx <= r; bx++) {
      for (let bz = -r; bz <= r; bz++) {
        if (bx === 0 && bz === 0) continue;
        const cx = bx * this.BLOCK_STEP;
        const cz = bz * this.BLOCK_STEP;
        const pad = new THREE.Mesh(padGeo, this.mat.sidewalk);
        pad.position.set(cx, 0.02, cz);
        pad.receiveShadow = true;
        this.cityGroup.add(pad);

        if ((bx + bz) % 2 === 0) {
          this._addStreetLamp(cx + padSize / 2 - 0.3, cz + padSize / 2 - 0.3);
        }
      }
    }

    this._buildSTJunctionStatue();
    this.setTimeOfDay(this.timeOfDay);
  }

  /**
   * CLICKABLE "ST JUNCTION" STATUE (🗽🗿) fixed at (0, 0)
   * Tapping it opens stgames.online popup!
   */
  _buildSTJunctionStatue() {
    const g = new THREE.Group();

    const basePad = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.16, 15.2), this.mat.marble);
    basePad.position.y = 0.08;
    basePad.receiveShadow = true;

    const gardenRing = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 7.0, 0.28, 32), this.mat.turf);
    gardenRing.position.y = 0.2;

    const poolRim = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 4.9, 0.45, 28), this.mat.marble);
    poolRim.position.y = 0.45;
    const water = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.48, 28), this.mat.water);
    water.position.y = 0.46;

    const step1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 4.2), this.mat.marble);
    step1.position.y = 1.05;
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.5, 3.0), this.mat.concrete);
    step2.position.y = 2.75;
    const goldCollar = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.3, 3.3), this.mat.gold);
    goldCollar.position.y = 4.1;

    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 1.1, 3.5, 10), this.mat.bronze);
    robe.position.y = 5.95;
    robe.castShadow = true;

    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.8, 0.85), this.mat.bronze);
    shoulders.position.y = 7.6;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 12), this.mat.gold);
    head.position.y = 8.45;

    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.52, 0.3, 7), this.mat.gold);
    crown.position.y = 8.95;

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.2, 8), this.mat.bronze);
    arm.position.set(0.95, 8.6, 0);
    arm.rotation.z = -0.22;

    const torchFlame = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.95, 8), this.mat.lampBulbNight);
    torchFlame.position.set(1.2, 10.0, 0);
    this.lampBulbs.push(torchFlame);

    [[-6.4, -6.4], [6.4, -6.4], [-6.4, 6.4], [6.4, 6.4]].forEach(([lx, lz]) => {
      this._addStreetLamp(lx, lz);
    });

    // Clickable Hitbox for ST JUNCTION
    const hitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(6.8, 6.8, 11.5, 16),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = 5.75;
    hitbox.userData.plotId = "ST_JUNCTION";
    g.add(hitbox);
    this.plotHitboxes.push(hitbox);

    const sign = this._createNameSign("🗽 ST JUNCTION", "TAP TO OPEN stgames.online", true);
    sign.position.set(0, 12.0, 0);

    g.add(basePad, gardenRing, poolRim, water, step1, step2, goldCollar, robe, shoulders, head, crown, arm, torchFlame, sign);
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
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.6, 6), this.mat.lampPole);
    pole.position.y = 2.3;
    const cross = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.1), this.mat.lampPole);
    cross.position.y = 4.5;
    const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.lampBulbDay);
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
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 6), this.mat.lampPole);
    pole.position.y = 1.6;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), this.mat.lampPole);
    arm.position.set(0.3, 3.15, 0);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), this.mat.lampBulbDay);
    bulb.position.set(0.6, 3.05, 0);
    group.add(pole, arm, bulb);
    group.position.set(x, 0.08, z);
    this.cityGroup.add(group);
    this.lampBulbs.push(bulb);
  }

  _addPalmTree(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 3.2, 6), this.mat.treeTrunk);
    trunk.position.y = 1.6;
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), this.mat.treeLeaf);
    crown.position.y = 3.5;
    crown.scale.y = 0.75;
    crown.castShadow = true;
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
    const roadCount = Math.min(22, (r * 2 + 2) * 2);
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
    for (let i = 0; i < 14; i++) {
      const isBus = i % 4 === 0;
      const car = this._makeVehicleMesh(isBus, false, colors[(i + 2) % colors.length], false);
      const cw = i % 2 === 0;
      const lane = cw ? rr + 1.8 : rr - 1.8;
      this.trafficGroup.add(car);
      this.ringVehicles.push({
        mesh: car,
        t: (i / 14) * 4,
        cw,
        lane,
        speed: (isBus ? 9 : 13) + Math.random() * 4
      });
    }
    this.setTimeOfDay(this.timeOfDay);
  }

  /**
   * Builds Cars, Buses, Autos, Police Cars & Ambulances WITH NIGHT HEADLIGHTS, BEAMS & TAILLIGHTS!
   */
  _makeVehicleMesh(isBus, isAuto, color, keepOnPlot = true) {
    const car = new THREE.Group();
    const bodyColor = isAuto ? 0xfacc15 : isBus ? (color || 0xdc2626) : color;
    const len = isBus ? 3.6 : isAuto ? 1.45 : 2.15;
    const h = isBus ? 1.42 : isAuto ? 1.02 : 0.74;
    const w = isBus ? 1.2 : isAuto ? 0.88 : 1.04;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, len),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    );
    body.position.y = h / 2 + 0.2;
    body.castShadow = true;
    car.add(body);

    if (isBus) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.28, len + 0.02), this.mat.wallWhite);
      stripe.position.y = h * 0.72;
      car.add(stripe);
    } else {
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.85, 0.45, len * 0.55),
        new THREE.MeshLambertMaterial({ color: isAuto ? 0x15803d : 0xe2e8f0 })
      );
      cabin.position.y = h + 0.35;
      car.add(cabin);
    }

    // NIGHT HEADLIGHTS (Front +Z) + TAILLIGHTS (Rear -Z) + GLOWING ROAD LIGHT BEAM!
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

    // Ground Headlight Beam Cone
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.4, 3.2), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.09, len / 2 + 1.65);

    hlGroup.add(hlL, hlR, tlL, tlR, beam);
    hlGroup.visible = this.timeOfDay === "night";
    car.add(hlGroup);
    this.vehicleHeadlights.push(hlGroup);

    return car;
  }

  /**
   * Spawns Roaming Town Workers + THE POSTMAN ON A BICYCLE WITH MAIL BAG!
   */
  _spawnRoamingWorkersAndPostman() {
    while (this.workersGroup.children.length > 0) {
      this.workersGroup.remove(this.workersGroup.children[0]);
    }
    this.workers = [];

    const count = Math.min(22, 8 + this.currentGridRadius * 4);
    const limit = (this.currentGridRadius + 0.4) * this.BLOCK_STEP;

    for (let i = 0; i < count; i++) {
      const worker = this._createCharacter({
        shirtMat: new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? 0xf59e0b : 0x0ea5e9 }),
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

    // CREATE POSTMAN ON BICYCLE WITH MAIL BAG & LETTERS!
    const pmGroup = new THREE.Group();
    // Bicycle frame + 2 wheels
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 10);
    const wFront = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
    wFront.rotation.z = Math.PI / 2;
    wFront.position.set(0, 0.32, 0.52);
    const wBack = wFront.clone();
    wBack.position.z = -0.52;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 1.05), this.mat.petrolRed);
    frame.position.set(0, 0.52, 0);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.08), this.mat.appleSilver);
    handle.position.set(0, 0.85, 0.42);

    // Postman Rider in Khaki Uniform + Brown Mail Bag + White Letter
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
      loopRadius: this.BLOCK_STEP * 0.5, // Rides along the main inner road loop around ST Junction & houses!
      t: 0,
      stopTimer: 0
    };
  }

  _createCharacter({ shirtMat, pantsMat, hatColor = null, scale = 1.0, hasBat = false }) {
    const g = new THREE.Group();
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.46, 0.22), pantsMat || this.mat.darkPants);
    legs.position.y = 0.23;

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.25), shirtMat || this.mat.wallBlue);
    torso.position.y = 0.7;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), this.mat.skin);
    head.position.y = 1.1;

    g.add(legs, torso, head);

    if (hatColor !== null) {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.14, 0.34),
        new THREE.MeshLambertMaterial({ color: hatColor })
      );
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
      this.policeSimulations = this.policeSimulations.filter((s) => s.plotId !== plotId);
      this.ambulanceSimulations = this.ambulanceSimulations.filter((s) => s.plotId !== plotId);
      this.blockedRoadZones = this.blockedRoadZones.filter((z) => z.plotId !== plotId);
    }

    if (data && data.status === "occupied_by_landmark") {
      const emptyPlaceholder = new THREE.Group();
      this.plotsGroup.add(emptyPlaceholder);
      this.plotMeshes.set(plotId, emptyPlaceholder);
      return;
    }

    const pos = this.getPlotPosition(plotIndex);
    const size = data?.status === "built" ? (data.size || getRequiredSize(data.buildingType)) : 1;
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

    const hitW = isEightPlot ? this.EIGHT_PLOT_WIDTH : isFourPlot ? this.BLOCK_FOOTPRINT - 0.2 : this.PLOT_SIZE - 0.3;
    const hitD = isEightPlot || isFourPlot ? this.BLOCK_FOOTPRINT - 0.2 : this.PLOT_SIZE - 0.3;
    const hitH = isEightPlot || isFourPlot ? 11.0 : 4.8;

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(hitW, hitH, hitD),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = hitH / 2;
    hitbox.userData.plotId = plotId;
    plotGroup.add(hitbox);
    this.plotHitboxes.push(hitbox);

    const lotBase = new THREE.Mesh(
      new THREE.BoxGeometry(hitW + (isEightPlot ? 0.8 : 0), isEightPlot ? 0.26 : 0.14, hitD + (isEightPlot ? 0.6 : 0)),
      data?.buildingType === "ground"
        ? this.mat.turf
        : data?.status === "built"
        ? this.mat.concrete
        : this.mat.grass
    );
    lotBase.position.y = isEightPlot ? 0.13 : 0.07;
    lotBase.receiveShadow = true;
    plotGroup.add(lotBase);

    let buildingObj = null;

    if (!data || data.status !== "built" || data.buildingType === "empty") {
      buildingObj = this._buildEmptyPlotMesh();
    } else if (isEightPlot) {
      buildingObj = this._buildEightPlotCricketStadium(plotId);
      const topLabel = data.ownerName || BUILDING_LABELS.ground;
      const sign = this._createNameSign(topLabel, "🏏 గ్రౌండ్ • 8-PLOT MEGA STADIUM", true);
      sign.position.set(0, 10.2, 0);
      buildingObj.add(sign);
    } else if (isFourPlot) {
      buildingObj = this._buildFourPlotLandmark(data.buildingType, plotId);
      const topLabel = data.ownerName || BUILDING_LABELS[data.buildingType] || "LANDMARK";
      const subLabel = this._getLandmarkSubtitle(data.buildingType);
      const sign = this._createNameSign(topLabel, subLabel, true);
      sign.position.set(0, buildingObj.userData.labelY || 10.4, 0);
      buildingObj.add(sign);
    } else {
      buildingObj = this._buildHouseOrShop(data.buildingType);
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
      const scafH = isEightPlot || isFourPlot ? 8.5 : 4.4;
      const scaffold = new THREE.Mesh(new THREE.BoxGeometry(scafW, scafH, scafD), this.mat.scaffolding);
      scaffold.position.y = scafH / 2;
      plotGroup.add(scaffold);

      const siteWorkers = [];
      const wCount = isEightPlot ? 6 : isFourPlot ? 4 : 2;
      for (let w = 0; w < wCount; w++) {
        const npc = this._createCharacter({
          shirtMat: new THREE.MeshLambertMaterial({ color: 0xf97316 }),
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
    const fenceH = 0.45;
    const s = this.PLOT_SIZE - 0.7;
    const f1 = new THREE.Mesh(new THREE.BoxGeometry(s, fenceH, 0.12), this.mat.wood);
    f1.position.set(0, fenceH / 2 + 0.1, -s / 2);
    const f2 = f1.clone();
    f2.position.z = s / 2;
    const f3 = new THREE.Mesh(new THREE.BoxGeometry(0.12, fenceH, s), this.mat.wood);
    f3.position.set(-s / 2, fenceH / 2 + 0.1, 0);
    const f4 = f3.clone();
    f4.position.x = s / 2;

    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), this.mat.wood);
    post.position.set(0, 0.6, 0);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.1), this.mat.wallWhite);
    board.position.set(0, 1.05, 0.05);

    g.add(f1, f2, f3, f4, post, board);
    return g;
  }

  // 8-PLOT MEGA CRICKET STADIUM
  _buildEightPlotCricketStadium(plotId) {
    const g = new THREE.Group();

    const pitch = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.08, 2.2), this.mat.pitch);
    pitch.position.set(0, 0.28, 0.4);

    const boundary = new THREE.Mesh(new THREE.RingGeometry(5.6, 5.9, 44), this.mat.stripe);
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
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 7.6, 6), this.mat.lampPole);
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
        plotId,
        mesh: kid,
        mode: "orbit",
        baseX: fx,
        baseZ: fz,
        range: 1.1,
        speed: 2.2 + (idx % 2) * 0.5,
        phase: idx * 1.1
      });
    });

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), this.mat.ballRed);
    g.add(ball);
    this.landmarkActors.push({ plotId, mesh: ball, mode: "ball_x", baseX: 0, baseZ: 0.4, range: 3.5, speed: 3.8, phase: 0 });

    g.add(pitch, boundary, standN1, standN2, roofN, sbPole, sbScreen, sbGlow);
    return g;
  }

  // 4-PLOT GRAND LANDMARKS WITH REAL-LIFE ANIMATIONS
  _buildFourPlotLandmark(type, plotId) {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;

    // 1. LIVE REFUELING PETROL BUNK
    if (type === "petrol_bunk") {
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.7, 6.6), this.mat.petrolRed);
      canopy.position.set(0, 4.6, 1.0);
      canopy.castShadow = true;
      const trim = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.28, 6.8), this.mat.petrolYellow);
      trim.position.set(0, 4.25, 1.0);

      const pillarGeo = new THREE.CylinderGeometry(0.24, 0.24, 4.4, 8);
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
      office.castShadow = true;
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
      g.userData.labelY = 7.2;
      return g;
    }

    // 2. LIVE APSRTC BUS STAND
    if (type === "bus_stand") {
      const terminal = new THREE.Mesh(new THREE.BoxGeometry(12.8, 4.2, 3.2), this.mat.wallCream);
      terminal.position.set(0, 2.15, -4.8);
      terminal.castShadow = true;

      const roof = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.45, 6.2), this.mat.navy);
      roof.position.set(0, 4.5, -2.8);
      roof.rotation.x = 0.06;
      roof.castShadow = true;

      const yellowTrim = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.3, 0.22), this.mat.petrolYellow);
      yellowTrim.position.set(0, 4.3, 0.28);

      [-5.6, -1.8, 1.8, 5.6].forEach((px) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4.3, 8), this.mat.wallWhite);
        col.position.set(px, 2.15, -0.4);
        g.add(col);
      });

      const parkedBus = this._makeVehicleMesh(true, false, 0x16a34a, true);
      parkedBus.position.set(-4.6, 0.1, 4.8);
      parkedBus.rotation.y = Math.PI / 2;
      g.add(parkedBus);

      const liveBus1 = this._makeVehicleMesh(true, false, 0xdc2626, true);
      liveBus1.rotation.y = Math.PI / 2;
      g.add(liveBus1);

      const passengers1 = [this.mat.wallCoral, this.mat.wallBlue, this.mat.wallGold].map((sm) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.98 });
        g.add(p);
        return p;
      });

      this.busSimulations.push({
        plotId, bus: liveBus1, passengers: passengers1,
        laneZ: 1.6, stopX: 0.5, waitZ: -1.4, phaseOffset: 0
      });

      const liveBus2 = this._makeVehicleMesh(true, false, 0x2563eb, true);
      liveBus2.rotation.y = Math.PI / 2;
      g.add(liveBus2);

      const passengers2 = [this.mat.wallMint, this.mat.khakiUniform].map((sm) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.98 });
        g.add(p);
        return p;
      });

      this.busSimulations.push({
        plotId, bus: liveBus2, passengers: passengers2,
        laneZ: 3.6, stopX: 1.2, waitZ: -1.4, phaseOffset: 5.5
      });

      g.add(terminal, roof, yellowTrim);
      g.userData.labelY = 7.2;
      return g;
    }

    // 3. POLICE HEADQUARTERS (Moving Police Patrol Car driving out onto road & returning to HQ!)
    if (type === "police_station") {
      const floor1 = new THREE.Mesh(new THREE.BoxGeometry(12.2, 3.2, 5.6), this.mat.wallKhaki);
      floor1.position.set(0, 1.65, -3.2);
      floor1.castShadow = true;

      const floor2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.0, 5.0), this.mat.wallCream);
      floor2.position.set(0, 4.75, -3.4);
      floor2.castShadow = true;

      const tower = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 3.6), this.mat.wallKhaki);
      tower.position.set(0, 7.4, -3.4);

      const navyBand = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.45, 5.8), this.mat.navy);
      navyBand.position.set(0, 3.25, -3.2);
      const redBand = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.25, 5.8), this.mat.petrolRed);
      redBand.position.set(0, 2.9, -3.2);

      const portico = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 2.6), this.mat.navy);
      portico.position.set(0, 2.6, 0.7);
      [-1.9, 1.9].forEach((px) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.5, 8), this.mat.wallWhite);
        col.position.set(px, 1.3, 1.7);
        g.add(col);
      });

      for (let wx = -4.4; wx <= 4.4; wx += 1.75) {
        if (Math.abs(wx) > 1.2) {
          const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.14), winMat);
          w1.position.set(wx, 1.7, -0.35);
          w1.userData.isWindow = true;
          g.add(w1);
        }
        const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.14), winMat);
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

      // Parked Police Jeep 1
      const jeep1 = this._makeVehicleMesh(false, false, 0xf8fafc, true);
      jeep1.position.set(-4.6, 0.1, 3.8);
      jeep1.rotation.y = Math.PI / 6;

      // MOVING POLICE PATROL CAR (Drives out of station onto road, patrols, returns to Police Station!)
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

      // 4 Police Officers
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
      g.userData.labelY = 10.8;
      return g;
    }

    // 4. SUPER SPECIALTY HOSPITAL (WITH LIVE ROAD ACCIDENT + AMBULANCE RESCUE!)
    if (type === "hospital") {
      const main = new THREE.Mesh(new THREE.BoxGeometry(11.8, 8.2, 6.2), this.mat.wallWhite);
      main.position.set(0, 4.15, -2.4);
      main.castShadow = true;

      [2.8, 5.5, 8.1].forEach((y) => {
        const band = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.35, 6.4), this.mat.teal);
        band.position.set(0, y, -2.4);
        g.add(band);
      });

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.16, 18), this.mat.road);
      pad.position.set(0, 8.35, -2.4);
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 1.8), this.mat.petrolYellow);
      h1.position.set(-0.6, 8.46, -2.4);
      const h2 = h1.clone();
      h2.position.x = 0.6;
      const h3 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.3), this.mat.petrolYellow);
      h3.position.set(0, 8.46, -2.4);

      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.0, 0.18), this.mat.petrolRed);
      crossV.position.set(0, 6.8, 0.78);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 0.18), this.mat.petrolRed);
      crossH.position.set(0, 6.8, 0.78);

      [1.6, 4.2, 6.8].forEach((wy) => {
        for (let wx = -4.2; wx <= 4.2; wx += 1.68) {
          if (wy > 6.0 && Math.abs(wx) < 1.5) continue;
          if (wy < 2.2 && Math.abs(wx) < 1.5) continue;
          const w = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.14), winMat);
          w.position.set(wx, wy, 0.74);
          w.userData.isWindow = true;
          g.add(w);
        }
      });

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.35, 3.0), this.mat.teal);
      canopy.position.set(0, 2.5, 2.2);

      // LIVE ROAD ACCIDENT SCENE ON FRONT ROAD (+9.2 Z) + AMBULANCE RESCUE LOOP!
      const crashCar = this._makeVehicleMesh(false, false, 0xf97316, true);
      crashCar.position.set(5.4, 0.1, 8.8);
      crashCar.rotation.y = 0.55;
      const hazardCone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 6), this.mat.petrolRed);
      hazardCone.position.set(4.1, 0.32, 8.8);
      const patient = this._createCharacter({ shirtMat: this.mat.jerseyYellow, pantsMat: this.mat.darkPants, scale: 0.95 });
      g.add(crashCar, hazardCone, patient);

      // Moving Ambulance with flashing red/blue beacon
      const ambulance = this._makeVehicleMesh(false, false, 0xf8fafc, true);
      const ambStripe = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.22, 2.18), this.mat.petrolRed);
      ambStripe.position.y = 0.58;
      const ambSiren = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.22), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      ambSiren.position.set(0, 1.28, 0);
      ambSiren.userData.plotId = plotId;
      ambulance.add(ambStripe, ambSiren);
      this.sirenLights.push(ambSiren);
      g.add(ambulance);

      this.ambulanceSimulations.push({
        plotId, ambulance, crashCar, hazardCone, patient
      });

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
      g.userData.labelY = 10.6;
      return g;
    }

    // 5. SRMT MALL (4 Plots)
    if (type === "srmt_mall") {
      const base = new THREE.Mesh(new THREE.BoxGeometry(12.4, 7.2, 7.6), this.mat.wallWhite);
      base.position.set(0, 3.65, -2.0);
      base.castShadow = true;

      const atrium = new THREE.Mesh(new THREE.BoxGeometry(7.4, 6.4, 0.5), this.mat.glass);
      atrium.position.set(0, 3.3, 1.9);

      const ribbon1 = new THREE.Mesh(new THREE.BoxGeometry(12.7, 0.7, 7.9), this.mat.srmtPurple);
      ribbon1.position.set(0, 7.1, -2.0);
      const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.35, 7.8), this.mat.srmtMagenta);
      ribbon2.position.set(0, 3.6, -2.0);

      const cinema = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.9, 4.2), this.mat.navy);
      cinema.position.set(0, 8.2, -2.4);

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
      g.userData.labelY = 11.2;
      return g;
    }

    // 6. APPLE STORE (4 Plots)
    if (type === "apple_store") {
      const floor = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.35, 8.2), this.mat.appleSilver);
      floor.position.set(0, 0.25, -1.2);
      const glassBox = new THREE.Mesh(new THREE.BoxGeometry(10.8, 5.4, 7.2), this.mat.glass);
      glassBox.position.set(0, 3.1, -1.2);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.55, 9.0), this.mat.appleSilver);
      roof.position.set(0, 6.05, -1.2);
      roof.castShadow = true;

      const logoBody = new THREE.Mesh(new THREE.SphereGeometry(0.88, 16, 16), this.mat.wallWhite);
      logoBody.scale.set(1, 1.05, 0.3);
      logoBody.position.set(0, 4.2, 2.55);
      const logoLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.16), this.mat.wallWhite);
      logoLeaf.position.set(0.18, 5.25, 2.55);
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
      g.userData.labelY = 8.8;
      return g;
    }

    // 7. RELIANCE DIGITAL & SMART STORE (4 Plots)
    if (type === "reliance_store") {
      const main = new THREE.Mesh(new THREE.BoxGeometry(12.0, 5.8, 7.2), this.mat.wallWhite);
      main.position.set(0, 2.95, -1.8);
      main.castShadow = true;

      const blueFacade = new THREE.Mesh(new THREE.BoxGeometry(12.2, 1.7, 7.4), this.mat.relianceBlue);
      blueFacade.position.set(0, 5.2, -1.8);
      const redAccent = new THREE.Mesh(new THREE.BoxGeometry(12.3, 0.35, 7.5), this.mat.petrolRed);
      redAccent.position.set(0, 4.2, -1.8);
      const goldAccent = new THREE.Mesh(new THREE.BoxGeometry(12.3, 0.25, 7.5), this.mat.gold);
      goldAccent.position.set(0, 6.15, -1.8);

      for (let wx = -4.0; wx <= 4.0; wx += 2.65) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.3, 0.16), winMat);
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
      g.userData.labelY = 8.8;
      return g;
    }

    // 8. GRAND SCHOOL CAMPUS (4 Plots)
    const main = new THREE.Mesh(new THREE.BoxGeometry(12.4, 5.5, 3.6), this.mat.wallCream);
    main.position.set(0, 2.8, -4.4);
    main.castShadow = true;

    const wingL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.6, 5.8), this.mat.wallCream);
    wingL.position.set(-4.6, 2.35, -0.2);
    wingL.castShadow = true;
    const wingR = wingL.clone();
    wingR.position.x = 4.6;

    const roofBand = new THREE.Mesh(new THREE.BoxGeometry(12.7, 0.45, 3.9), this.mat.roofOrange);
    roofBand.position.set(0, 5.7, -4.4);

    [1.7, 4.0].forEach((wy) => {
      for (let wx = -4.4; wx <= 4.4; wx += 1.45) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.14), winMat);
        w.position.set(wx, wy, -2.56);
        w.userData.isWindow = true;
        g.add(w);
      }
    });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 5.6, 6), this.mat.wallWhite);
    pole.position.set(0, 2.85, 0.2);
    const flagTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    flagTop.position.set(0.58, 5.4, 0.2);
    const flagMid = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), this.mat.wallWhite);
    flagMid.position.set(0.58, 5.16, 0.2);
    const flagBot = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), new THREE.MeshBasicMaterial({ color: 0x16a34a }));
    flagBot.position.set(0.58, 4.92, 0.2);

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
    g.userData.labelY = 8.2;
    return g;
  }

  _buildHouseOrShop(type) {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;

    if (type === "shop") {
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.8, 4.2), this.mat.wallGold);
      base.position.y = 1.45;
      base.castShadow = true;
      const awning = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.35, 1.4), this.mat.petrolRed);
      awning.position.set(0, 2.3, 2.3);
      awning.rotation.x = 0.25;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.3, 0.12), winMat);
      glass.position.set(0, 1.1, 2.12);
      glass.userData.isWindow = true;
      g.add(base, awning, glass);
      g.userData.labelY = 4.5;
      return g;
    }

    const wallMap = {
      house_blue: this.mat.wallBlue,
      house_coral: this.mat.wallCoral,
      house_mint: this.mat.wallMint,
      house_gold: this.mat.wallGold
    };
    const isDuplex = type === "house_gold";
    const h = isDuplex ? 3.8 : 2.5;

    const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, h, 4.2), wallMap[type] || this.mat.wallBlue);
    body.position.set(0, h / 2 + 0.08, -0.2);
    body.castShadow = true;
    body.receiveShadow = true;

    const parapet = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.38, 4.45), this.mat.wallWhite);
    parapet.position.set(0, h + 0.22, -0.2);

    const mumty = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.5), this.mat.wallCream);
    mumty.position.set(-1.1, h + 0.7, -1.2);

    const pathway = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.5), this.mat.sidewalk);
    pathway.position.set(0, 0.12, 2.65);

    const porch = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 0.8), this.mat.wallWhite);
    porch.position.set(0, 1.75, 2.25);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.45, 0.12), this.mat.wood);
    door.position.set(0, 0.8, 1.92);

    const winL = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.85, 0.12), winMat);
    winL.position.set(-1.35, 1.55, 1.92);
    winL.userData.isWindow = true;
    const winR = winL.clone();
    winR.position.x = 1.35;
    winR.userData.isWindow = true;

    g.add(body, parapet, mumty, pathway, porch, door, winL, winR);
    g.userData.labelY = h + 2.2;
    return g;
  }

  _createNameSign(mainText, subText = "", isBig = false) {
    const canvas = document.createElement("canvas");
    canvas.width = isBig ? 440 : 320;
    canvas.height = subText ? 98 : 68;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.beginPath();
    ctx.roundRect(6, 6, canvas.width - 12, canvas.height - 12, 16);
    ctx.fill();

    ctx.strokeStyle = isBig ? "#facc15" : "#38bdf8";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cx = canvas.width / 2;

    const cleanMain = mainText.length > 22 ? mainText.slice(0, 21) + "…" : mainText;
    if (subText) {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 21px sans-serif";
      ctx.fillText(subText, cx, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(cleanMain, cx, 66);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(cleanMain, cx, 35);
    }

    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(isBig ? 8.8 : 5.0, subText ? (isBig ? 2.2 : 1.5) : 1.15, 1);
    return sprite;
  }

  setTimeOfDay(mode) {
    this.timeOfDay = mode;
    if (mode === "night") {
      this.scene.background.setHex(0x0b1120);
      this.scene.fog.color.setHex(0x0b1120);
      this.sunLight.color.setHex(0x60a5fa);
      this.sunLight.intensity = 0.4;
      this.hemiLight.intensity = 0.25;
    } else if (mode === "sunset") {
      this.scene.background.setHex(0xf97316);
      this.scene.fog.color.setHex(0xfb923c);
      this.sunLight.color.setHex(0xfdba74);
      this.sunLight.intensity = 1.1;
      this.hemiLight.intensity = 0.55;
    } else {
      this.scene.background.setHex(0x87ceeb);
      this.scene.fog.color.setHex(0x87ceeb);
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 1.38;
      this.hemiLight.intensity = 0.82;
    }

    const isNight = mode === "night";
    this.lampBulbs.forEach((b) => {
      b.material = isNight ? this.mat.lampBulbNight : this.mat.lampBulbDay;
    });
    // Turn ON/OFF headlights, taillights & road light beams on ALL cars, buses, autos, police & ambulances!
    this.vehicleHeadlights.forEach((hl) => {
      hl.visible = isNight;
    });
    this.plotsGroup.traverse((obj) => {
      if (obj.userData && obj.userData.isWindow) {
        obj.material = isNight ? this.mat.windowNight : this.mat.windowDay;
      }
    });
  }

  focusPlot(plotId) {
    const plotIndex = parseInt(plotId.replace("plot_", ""), 10) - 1;
    if (isNaN(plotIndex) || plotIndex < 0) return;

    const data = this.plotDataMap.get(plotId);
    const size = data?.status === "built" ? (data.size || getRequiredSize(data.buildingType)) : 1;
    const pos = this.getPlotPosition(plotIndex);

    let tx = pos.x;
    let tz = pos.z;
    let dist = 17;

    if (size === 8) {
      const grp = getEightPlotGroup(plotId);
      const lc = blockIdxToCoord(grp.leftBlockIdx);
      const rc = blockIdxToCoord(grp.rightBlockIdx);
      tx = ((lc.bx + rc.bx) / 2) * this.BLOCK_STEP;
      tz = lc.bz * this.BLOCK_STEP;
      dist = 34;
    } else if (size === 4) {
      tx = pos.blockCenterX;
      tz = pos.blockCenterZ;
      dist = 26;
    }

    this.cameraGoal = {
      target: new THREE.Vector3(tx, size > 1 ? 2.6 : 1.4, tz),
      camPos: new THREE.Vector3(tx + dist, dist + 2, tz + dist)
    };

    if (!this.highlightBeacon) {
      this.highlightBeacon = new THREE.Mesh(
        new THREE.RingGeometry(3.5, 4.0, 28),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      this.highlightBeacon.rotation.x = -Math.PI / 2;
      this.scene.add(this.highlightBeacon);
    }
    const sx = size === 8 ? 3.8 : size === 4 ? 1.95 : 1.0;
    const sy = size >= 4 ? 1.95 : 1.0;
    this.highlightBeacon.scale.set(sx, sy, 1);
    this.highlightBeacon.position.set(tx, 0.28, tz);
  }

  findPlotByQuery(query) {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return null;
    if (q.includes("junction") || q.includes("statue") || q === "st") return "ST_JUNCTION";
    for (const [plotId, data] of this.plotDataMap.entries()) {
      if (!data || data.status !== "built") continue;
      const owner = (data.ownerName || "").toLowerCase().replace(/^@/, "");
      const role = (data.role || "").toLowerCase();
      const typeLabel = (BUILDING_LABELS[data.buildingType] || data.buildingType || "").toLowerCase();
      if (owner.includes(q) || role.includes(q) || typeLabel.includes(q)) {
        return plotId;
      }
    }
    return null;
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    if (this.cameraGoal) {
      this.controls.target.lerp(this.cameraGoal.target, 0.08);
      this.camera.position.lerp(this.cameraGoal.camPos, 0.08);
      if (this.camera.position.distanceTo(this.cameraGoal.camPos) < 0.4) {
        this.cameraGoal = null;
      }
    }

    this.controls.autoRotate = this.autoSpin;
    if (this.autoSpin) this.controls.autoRotateSpeed = 1.5;

    const flash = Math.floor(elapsed * 5) % 2 === 0;
    this.sirenLights.forEach((s, idx) => {
      s.visible = idx % 2 === 0 ? flash : !flash;
    });

    if (this.lifeEnabled) {
      // 1. LIVE PETROL BUNK SIMULATION
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

      // 2. LIVE APSRTC BUS STAND BOARDING SIMULATION
      for (const bsim of this.busSimulations) {
        const cycle = (elapsed + bsim.phaseOffset) % 11.0;
        if (cycle < 2.4) {
          const p = cycle / 2.4;
          bsim.bus.visible = true;
          bsim.bus.position.set(-6.5 + (bsim.stopX + 6.5) * p, 0.1, bsim.laneZ);
          bsim.passengers.forEach((pax, i) => {
            pax.visible = true;
            pax.position.set(bsim.stopX - 1.2 + i * 1.1, 0.14, bsim.waitZ);
            pax.rotation.y = 0;
          });
        } else if (cycle < 7.2) {
          bsim.bus.visible = true;
          bsim.bus.position.set(bsim.stopX, 0.1, bsim.laneZ);
          const boardTime = cycle - 2.4;
          bsim.passengers.forEach((pax, i) => {
            const walkProg = (boardTime - i * 1.1) / 1.4;
            if (walkProg < 0) {
              pax.visible = true;
              pax.position.set(bsim.stopX - 1.2 + i * 1.1, 0.14, bsim.waitZ);
            } else if (walkProg < 1) {
              pax.visible = true;
              const px = THREE.MathUtils.lerp(bsim.stopX - 1.2 + i * 1.1, bsim.stopX + 0.4, walkProg);
              const pz = THREE.MathUtils.lerp(bsim.waitZ, bsim.laneZ, walkProg);
              pax.position.set(px, 0.14 + Math.abs(Math.sin(elapsed * 10)) * 0.14, pz);
            } else {
              pax.visible = false;
            }
          });
        } else if (cycle < 10.0) {
          const p = (cycle - 7.2) / 2.8;
          bsim.bus.visible = true;
          bsim.bus.position.set(bsim.stopX + (6.8 - bsim.stopX) * p, 0.1, bsim.laneZ);
          bsim.passengers.forEach((pax) => (pax.visible = false));
        } else {
          bsim.bus.visible = false;
          bsim.passengers.forEach((pax) => (pax.visible = false));
        }
      }

      // 3. LIVE POLICE PATROL CAR (Exits Police Station -> Patrols Road -> Returns to Station!)
      for (const psim of this.policeSimulations) {
        const cycle = elapsed % 12.0;
        if (cycle < 2.5) {
          // Parked at Police Station
          psim.car.position.set(4.2, 0.1, 3.8);
          psim.car.rotation.y = 0;
        } else if (cycle < 4.5) {
          // Driving out onto road (+8.6 Z)
          const p = (cycle - 2.5) / 2.0;
          psim.car.position.set(4.2, 0.1, THREE.MathUtils.lerp(3.8, 8.6, p));
          psim.car.rotation.y = 0;
        } else if (cycle < 8.0) {
          // Patrolling left along the main road
          const p = (cycle - 4.5) / 3.5;
          psim.car.position.set(THREE.MathUtils.lerp(4.2, -6.5, p), 0.1, 8.6);
          psim.car.rotation.y = -Math.PI / 2;
        } else if (cycle < 10.2) {
          // Turning back right along road to station driveway
          const p = (cycle - 8.0) / 2.2;
          psim.car.position.set(THREE.MathUtils.lerp(-6.5, 4.2, p), 0.1, 8.6);
          psim.car.rotation.y = Math.PI / 2;
        } else {
          // Pulling back into Police Station
          const p = (cycle - 10.2) / 1.8;
          psim.car.position.set(4.2, 0.1, THREE.MathUtils.lerp(8.6, 3.8, p));
          psim.car.rotation.y = Math.PI;
        }
      }

      // 4. LIVE ROAD ACCIDENT + AMBULANCE RESCUE TO HOSPITAL!
      for (const asim of this.ambulanceSimulations) {
        const cycle = elapsed % 14.0;
        if (cycle < 2.5) {
          // Accident happens on road; ambulance leaves hospital emergency bay
          const p = cycle / 2.5;
          asim.crashCar.visible = true;
          asim.hazardCone.visible = true;
          asim.patient.visible = true;
          asim.patient.position.set(4.8, 0.14, 7.6);
          asim.ambulance.position.set(THREE.MathUtils.lerp(-3.5, -3.5, p), 0.1, THREE.MathUtils.lerp(4.0, 8.6, p));
          asim.ambulance.rotation.y = 0;
        } else if (cycle < 5.5) {
          // Ambulance rushes along road to accident spot
          const p = (cycle - 2.5) / 3.0;
          asim.ambulance.position.set(THREE.MathUtils.lerp(-3.5, 3.4, p), 0.1, 8.6);
          asim.ambulance.rotation.y = Math.PI / 2;
        } else if (cycle < 8.0) {
          // Patient walks into Ambulance!
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
          // Ambulance drives patient back to Hospital!
          const p = (cycle - 8.0) / 3.2;
          asim.patient.visible = false;
          asim.ambulance.position.set(THREE.MathUtils.lerp(3.4, -3.5, p), 0.1, 8.6);
          asim.ambulance.rotation.y = -Math.PI / 2;
        } else {
          // Ambulance pulls into Hospital Emergency Canopy
          const p = (cycle - 11.2) / 2.8;
          asim.ambulance.position.set(-3.5, 0.1, THREE.MathUtils.lerp(8.6, 4.0, p));
          asim.ambulance.rotation.y = Math.PI;
          asim.crashCar.visible = p < 0.7;
          asim.hazardCone.visible = p < 0.7;
        }
      }

      // 5. POSTMAN ON BICYCLE DELIVERING LETTERS TO HOUSES!
      if (this.postman) {
        const pm = this.postman;
        if (pm.stopTimer > 0) {
          pm.stopTimer -= dt;
          // Postman waves/posts a letter while stopped in front of a house!
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

          // Stop briefly every quarter-side to deliver mail to houses!
          if (Math.random() < 0.008) {
            pm.stopTimer = 1.6;
          }
        }
      }

      // 6. Landmark NPCs
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
        } else if (a.mode === "ball_x") {
          const bx = a.baseX + Math.sin(t) * a.range;
          const by = 0.35 + Math.abs(Math.cos(t * 2)) * 1.3;
          a.mesh.position.set(bx, by, a.baseZ);
        }
      }

      // 7. Inner Town Vehicles
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

      // 8. Outer Ring Road looping traffic
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

      // 9. Roaming workers
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
