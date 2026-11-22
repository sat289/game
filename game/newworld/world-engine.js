import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const FOUR_PLOT_TYPES = new Set([
  "police_station",
  "hospital",
  "school",
  "bus_stand",
  "ground",
  "petrol_bunk"
]);

export const BUILDING_LABELS = {
  house_blue: "🏠 Blue Terrace House",
  house_coral: "🏠 Coral Modern House",
  house_mint: "🏡 Mint Villa",
  house_gold: "🏢 Golden Duplex",
  shop: "☕ టీ & టిఫిన్ • SHOP",
  school: "🏫 పాఠశాల • GRAND SCHOOL (4 PLOTS)",
  hospital: "🏥 ఆసుపత్రి • SUPER HOSPITAL (4 PLOTS)",
  bus_stand: "🚌 బస్ స్టాండ్ • RTC TERMINAL (4 PLOTS)",
  ground: "🏏 గ్రౌండ్ • CRICKET STADIUM (4 PLOTS)",
  police_station: "🚓 పోలీస్ స్టేషన్ • POLICE HQ (4 PLOTS)",
  petrol_bunk: "⛽ పెట్రోల్ బంక్ • FUEL PLAZA (4 PLOTS)",
  empty: "OPEN LAND"
};

/**
 * Returns the 4 sibling plot IDs belonging to the same 2x2 city block,
 * plus the anchor plot ID (first plot in that block).
 */
export function getBlockPlotIds(plotId) {
  const num = parseInt(plotId.replace("plot_", ""), 10);
  const blockIdx = Math.floor((num - 1) / 4);
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

export class FollowerTownEngine {
  constructor(container, onPlotSelected) {
    this.container = container;
    this.onPlotSelected = onPlotSelected;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0017);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(36, aspect, 0.5, 1200);
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
    this.controls.maxDistance = 340;
    this.controls.target.set(0, 0, 0);

    this.PLOT_SIZE = 7.4;
    this.ROAD_WIDTH = 4.2;
    this.BLOCK_STEP = this.PLOT_SIZE * 2 + this.ROAD_WIDTH; // 19.0
    this.BLOCK_FOOTPRINT = this.PLOT_SIZE * 2; // 14.8 x 14.8 for 4-plot Mega Landmarks!
    this.RING_ROAD_WIDTH = 7.2;

    this.currentGridRadius = 0;
    this.townName = "FOLLOWER NAGARAM";
    this.plotDataMap = new Map();
    this.plotMeshes = new Map();
    this.plotHitboxes = [];
    this.lampBulbs = [];
    this.sirenLights = [];
    this.landmarkActors = []; // Animated Police, Doctors, Playing Kids, Passengers, Workers
    this.vehicles = [];
    this.ringVehicles = [];
    this.workers = [];
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
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x4d7c0f, 0.8);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.38);
    this.sunLight.position.set(72, 110, 58);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 340;
    const d = 130;
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
      teal: new THREE.MeshLambertMaterial({ color: 0x0d9488 }),
      navy: new THREE.MeshLambertMaterial({ color: 0x1e3a8a }),
      petrolRed: new THREE.MeshLambertMaterial({ color: 0xdc2626 }),
      petrolYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      treeTrunk: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      treeLeaf: new THREE.MeshLambertMaterial({ color: 0x15803d }),
      lampPole: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
      lampBulbDay: new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }),
      lampBulbNight: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
      windowDay: new THREE.MeshLambertMaterial({ color: 0x7dd3fc }),
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
      ballRed: new THREE.MeshBasicMaterial({ color: 0xdc2626 })
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

  /**
   * Returns plot center position, block center position (for 4-plot landmarks),
   * AND the roadFacingRotation so every single house front door faces the road!
   */
  getPlotPosition(plotIndex) {
    const blockIdx = Math.floor(plotIndex / 4);
    const subIdx = plotIndex % 4;
    const { bx, bz } = this._spiralBlockCoord(blockIdx);

    const blockCenterX = bx * this.BLOCK_STEP;
    const blockCenterZ = bz * this.BLOCK_STEP;
    const half = this.PLOT_SIZE / 2;

    // subIdx 0 (NW) -> faces North road (Math.PI)
    // subIdx 1 (NE) -> faces North road (Math.PI)
    // subIdx 2 (SW) -> faces South road (0)
    // subIdx 3 (SE) -> faces South road (0)
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

  _spiralBlockCoord(n) {
    if (n === 0) return { bx: 0, bz: 0 };
    let k = Math.ceil((Math.sqrt(n + 1) - 1) / 2);
    let t = 2 * k + 1;
    let m = t * t;
    t -= 1;
    if (n >= m - t) return { bx: k - (m - n), bz: -k };
    m -= t;
    if (n >= m - t) return { bx: -k, bz: -k + (m - n) };
    m -= t;
    if (n >= m - t) return { bx: -k + (m - n), bz: k };
    return { bx: k, bz: k - (m - n - t) };
  }

  ensureCapacity(totalPlots) {
    const neededBlocks = Math.ceil(Math.max(totalPlots, 36) / 4);
    const neededRadius = Math.max(1, Math.ceil((Math.sqrt(neededBlocks) - 1) / 2));

    if (neededRadius > this.currentGridRadius) {
      this.currentGridRadius = neededRadius;
      this._rebuildRoadsAndRingRoad();
      this._spawnVehicles();
      this._spawnRoamingWorkers();
    }

    const totalSlots = Math.pow(this.currentGridRadius * 2 + 1, 2) * 4;
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

    const r = this.currentGridRadius;
    const gridCount = r * 2 + 1;
    const innerSpan = gridCount * this.BLOCK_STEP;
    const ringRadius = innerSpan / 2 + 10.5;
    this.ringRadius = ringRadius;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(ringRadius * 2 + 120, ringRadius * 2 + 120),
      this.mat.grass
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.06;
    ground.receiveShadow = true;
    this.cityGroup.add(ground);

    // Inner town asphalt roads
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

    // Outer Ring Road (4-lane highway + central median)
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

    // Sidewalk pads & streetlamps
    const padSize = this.PLOT_SIZE * 2 + 0.8;
    const padGeo = new THREE.BoxGeometry(padSize, 0.12, padSize);
    for (let bx = -r; bx <= r; bx++) {
      for (let bz = -r; bz <= r; bz++) {
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

    this.setTimeOfDay(this.timeOfDay);
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

    const r = this.currentGridRadius;
    const roadCount = Math.min(22, (r * 2 + 2) * 2);
    const colors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981, 0xf97316, 0xf8fafc];
    const limit = (r + 0.5) * this.BLOCK_STEP;

    for (let i = 0; i < roadCount; i++) {
      const isBus = i % 5 === 0;
      const isAuto = i % 3 === 0 && !isBus;
      const car = this._makeVehicleMesh(isBus, isAuto, colors[i % colors.length]);

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
      const car = this._makeVehicleMesh(isBus, false, colors[(i + 2) % colors.length]);
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
  }

  _makeVehicleMesh(isBus, isAuto, color) {
    const car = new THREE.Group();
    const bodyColor = isAuto ? 0xfacc15 : isBus ? (color || 0xdc2626) : color;
    const len = isBus ? 3.5 : isAuto ? 1.4 : 2.1;
    const h = isBus ? 1.38 : isAuto ? 1.0 : 0.72;
    const w = isBus ? 1.18 : isAuto ? 0.85 : 1.02;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, len),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    );
    body.position.y = h / 2 + 0.2;
    body.castShadow = true;
    car.add(body);

    if (isBus) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.26, len + 0.02), this.mat.wallWhite);
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
    return car;
  }

  _spawnRoamingWorkers() {
    while (this.workersGroup.children.length > 0) {
      this.workersGroup.remove(this.workersGroup.children[0]);
    }
    this.workers = [];

    const count = Math.min(26, 8 + this.currentGridRadius * 4);
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
  }

  /**
   * Versatile character builder for Police, Doctors, School Kids, Cricketers, Passengers, Workers
   */
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

    // Clean up previous mesh, hitboxes, sirens, and landmark NPCs for this plotId
    if (this.plotMeshes.has(plotId)) {
      const oldGroup = this.plotMeshes.get(plotId);
      this.plotsGroup.remove(oldGroup);
      this.plotHitboxes = this.plotHitboxes.filter((h) => h.userData.plotId !== plotId);
      this.sirenLights = this.sirenLights.filter((s) => s.userData.plotId !== plotId);
      this.landmarkActors = this.landmarkActors.filter((a) => a.plotId !== plotId);
    }

    // If this plot is one of the 3 sibling slots consumed by a 4-plot mega landmark,
    // render nothing here (the anchor plot renders the full 4-plot landmark + hitbox!)
    if (data && data.status === "occupied_by_landmark") {
      const emptyPlaceholder = new THREE.Group();
      this.plotsGroup.add(emptyPlaceholder);
      this.plotMeshes.set(plotId, emptyPlaceholder);
      return;
    }

    const pos = this.getPlotPosition(plotIndex);
    const isFourPlot = data && data.status === "built" && (data.size === 4 || FOUR_PLOT_TYPES.has(data.buildingType));

    const plotGroup = new THREE.Group();
    if (isFourPlot) {
      // Center the 4-plot Mega Landmark right in the middle of the 2x2 city block!
      plotGroup.position.set(pos.blockCenterX, 0.08, pos.blockCenterZ);
    } else {
      plotGroup.position.set(pos.x, 0.08, pos.z);
    }

    // Hitbox (4-plot full block vs 1-plot house)
    const hitSpan = isFourPlot ? this.BLOCK_FOOTPRINT - 0.3 : this.PLOT_SIZE - 0.3;
    const hitHeight = isFourPlot ? 9.5 : 4.8;
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(hitSpan, hitHeight, hitSpan),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = hitHeight / 2;
    hitbox.userData.plotId = plotId;
    plotGroup.add(hitbox);
    this.plotHitboxes.push(hitbox);

    // Base pad
    const lotBase = new THREE.Mesh(
      new THREE.BoxGeometry(hitSpan, 0.14, hitSpan),
      data?.buildingType === "ground"
        ? this.mat.turf
        : data?.status === "built"
        ? this.mat.concrete
        : this.mat.grass
    );
    lotBase.position.y = 0.07;
    lotBase.receiveShadow = true;
    plotGroup.add(lotBase);

    let buildingObj = null;

    if (!data || data.status !== "built" || data.buildingType === "empty") {
      buildingObj = this._buildEmptyPlotMesh();
    } else if (isFourPlot) {
      buildingObj = this._buildMegaLandmark(data.buildingType, plotId);
      const topLabel = data.ownerName || BUILDING_LABELS[data.buildingType] || "LANDMARK";
      const subLabel = this._getLandmarkSubtitle(data.buildingType);
      const sign = this._createNameSign(topLabel, subLabel, true);
      sign.position.set(0, buildingObj.userData.labelY || 9.2, 0);
      buildingObj.add(sign);
    } else {
      buildingObj = this._buildHouseOrShop(data.buildingType);
      // Rotate 1-plot house/shop so its front door & porch ALWAYS face the adjacent road!
      buildingObj.rotation.y = pos.rotY;

      if (data.ownerName) {
        const subLabel = data.buildingType === "shop" ? "టీ & టిఫిన్ • SHOP" : "";
        const sign = this._createNameSign(data.ownerName, subLabel, false);
        sign.position.set(0, buildingObj.userData.labelY || 5.2, 0);
        // Attach sign to plotGroup (not rotated buildingObj) so sprites stay crisp
        plotGroup.add(sign);
      }
    }

    plotGroup.add(buildingObj);

    // Construction animation with scaffolding + workers
    if (animateBuild && data.status === "built") {
      buildingObj.scale.y = 0.05;
      const scafSize = isFourPlot ? 12.6 : 5.6;
      const scafH = isFourPlot ? 8.2 : 4.4;
      const scaffold = new THREE.Mesh(new THREE.BoxGeometry(scafSize, scafH, scafSize), this.mat.scaffolding);
      scaffold.position.y = scafH / 2;
      plotGroup.add(scaffold);

      const siteWorkers = [];
      const wDist = isFourPlot ? 6.2 : 2.8;
      for (let w = 0; w < (isFourPlot ? 4 : 2); w++) {
        const npc = this._createCharacter({
          shirtMat: new THREE.MeshLambertMaterial({ color: 0xf97316 }),
          pantsMat: this.mat.navy,
          hatColor: 0xfacc15
        });
        const ang = (w / (isFourPlot ? 4 : 2)) * Math.PI * 2;
        npc.position.set(Math.cos(ang) * wDist, 0.1, Math.sin(ang) * wDist);
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
      bus_stand: "బస్ స్టాండ్ • RTC TERMINAL",
      ground: "గ్రౌండ్ • CRICKET STADIUM",
      police_station: "పోలీస్ స్టేషన్ • POLICE HQ",
      petrol_bunk: "పెట్రోల్ బంక్ • FUEL PLAZA",
      shop: "టీ & టిఫిన్ షాప్"
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

  // =========================================================================
  // 4-PLOT MEGA PUBLIC LANDMARKS (MULTI-LEVEL + REALISTIC TELUGU/ENGLISH + NPCs)
  // Footprint: 14.5 x 14.5 units (4x bigger than houses!)
  // =========================================================================
  _buildMegaLandmark(type, plotId) {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;

    // 1. POLICE HEADQUARTERS (4 Plots • 2-Story + Watchtower + 2 Jeeps + Patrolling Police Officers)
    if (type === "police_station") {
      // Ground Floor + 1st Floor + Central Tower
      const floor1 = new THREE.Mesh(new THREE.BoxGeometry(11.6, 3.0, 5.4), this.mat.wallKhaki);
      floor1.position.set(0, 1.55, -3.2);
      floor1.castShadow = true;

      const floor2 = new THREE.Mesh(new THREE.BoxGeometry(9.2, 2.8, 4.8), this.mat.wallCream);
      floor2.position.set(0, 4.45, -3.4);
      floor2.castShadow = true;

      const tower = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 3.4), this.mat.wallKhaki);
      tower.position.set(0, 6.9, -3.4);

      const navyBand = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.45, 5.6), this.mat.navy);
      navyBand.position.set(0, 3.05, -3.2);
      const redBand = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.25, 5.6), this.mat.petrolRed);
      redBand.position.set(0, 2.7, -3.2);

      // Portico entrance
      const portico = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 2.6), this.mat.navy);
      portico.position.set(0, 2.5, 0.6);
      [-1.8, 1.8].forEach((px) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.4, 8), this.mat.wallWhite);
        col.position.set(px, 1.25, 1.6);
        g.add(col);
      });

      // Windows across both floors
      for (let wx = -4.2; wx <= 4.2; wx += 1.68) {
        if (Math.abs(wx) > 1.2) {
          const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.14), winMat);
          w1.position.set(wx, 1.6, -0.45);
          w1.userData.isWindow = true;
          g.add(w1);
        }
        const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.95, 0.14), winMat);
        w2.position.set(wx * 0.8, 4.5, -0.95);
        w2.userData.isWindow = true;
        g.add(w2);
      }

      // Flashing Red & Blue Sirens on Roof Tower
      const sirenRed = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      sirenRed.position.set(-0.42, 8.25, -2.5);
      sirenRed.userData.plotId = plotId;
      const sirenBlue = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      sirenBlue.position.set(0.42, 8.25, -2.5);
      sirenBlue.userData.plotId = plotId;
      this.sirenLights.push(sirenRed, sirenBlue);

      // 2 Parked White Police Jeeps
      const jeep1 = this._makeVehicleMesh(false, false, 0xf8fafc);
      jeep1.position.set(-4.2, 0.1, 3.8);
      jeep1.rotation.y = Math.PI / 6;
      const jeep2 = this._makeVehicleMesh(false, false, 0xf8fafc);
      jeep2.position.set(4.2, 0.1, 3.8);
      jeep2.rotation.y = -Math.PI / 6;

      // 4 Police Officers (Khaki uniform + Navy cap) patrolling & guarding
      for (let i = 0; i < 4; i++) {
        const officer = this._createCharacter({
          shirtMat: this.mat.khakiUniform,
          pantsMat: this.mat.khakiUniform,
          hatColor: 0x1e3a8a,
          scale: 1.08
        });
        g.add(officer);
        this.landmarkActors.push({
          plotId,
          mesh: officer,
          mode: i < 2 ? "patrol_x" : "guard",
          baseX: i === 0 ? -3.0 : i === 1 ? 3.0 : i === 2 ? -1.4 : 1.4,
          baseZ: i < 2 ? 5.2 : 2.1,
          range: 2.2,
          speed: 1.4,
          phase: i * 1.7
        });
      }

      g.add(floor1, floor2, tower, navyBand, redBand, portico, sirenRed, sirenBlue, jeep1, jeep2);
      g.userData.labelY = 10.2;
      return g;
    }

    // 2. SUPER SPECIALTY HOSPITAL (4 Plots • 3-Story + Helipad + 2 Ambulances + Doctors & Nurses)
    if (type === "hospital") {
      const main = new THREE.Mesh(new THREE.BoxGeometry(11.4, 7.6, 6.2), this.mat.wallWhite);
      main.position.set(0, 3.85, -2.4);
      main.castShadow = true;

      // Teal architectural bands for 3 levels
      [2.6, 5.2, 7.5].forEach((y) => {
        const band = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.35, 6.4), this.mat.teal);
        band.position.set(0, y, -2.4);
        g.add(band);
      });

      // Rooftop Helipad ("H")
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.16, 18), this.mat.road);
      pad.position.set(0, 7.75, -2.4);
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 1.8), this.mat.petrolYellow);
      h1.position.set(-0.6, 7.86, -2.4);
      const h2 = h1.clone();
      h2.position.x = 0.6;
      const h3 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.3), this.mat.petrolYellow);
      h3.position.set(0, 7.86, -2.4);

      // Giant Red Cross (+)
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.9, 0.18), this.mat.petrolRed);
      crossV.position.set(0, 6.3, 0.78);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 0.18), this.mat.petrolRed);
      crossH.position.set(0, 6.3, 0.78);

      // 3 Floors of Glowing Hospital Windows
      [1.5, 3.9, 6.3].forEach((wy) => {
        for (let wx = -4.2; wx <= 4.2; wx += 1.68) {
          if (wy > 5.5 && Math.abs(wx) < 1.5) continue;
          if (wy < 2.0 && Math.abs(wx) < 1.5) continue;
          const w = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.14), winMat);
          w.position.set(wx, wy, 0.74);
          w.userData.isWindow = true;
          g.add(w);
        }
      });

      // Emergency Canopy
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.35, 3.0), this.mat.teal);
      canopy.position.set(0, 2.4, 2.2);

      // 2 White Ambulances with Red Stripes
      [-4.2, 4.2].forEach((ax) => {
        const amb = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.1, 2.4), this.mat.wallWhite);
        amb.position.set(ax, 0.65, 4.2);
        const st = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.24, 2.42), this.mat.petrolRed);
        st.position.set(ax, 0.65, 4.2);
        g.add(amb, st);
      });

      // 4 Doctors / Nurses in White Coats walking near Emergency Entrance
      for (let i = 0; i < 4; i++) {
        const doc = this._createCharacter({
          shirtMat: this.mat.whiteCoat,
          pantsMat: i % 2 === 0 ? this.mat.teal : this.mat.darkPants,
          scale: 1.05
        });
        g.add(doc);
        this.landmarkActors.push({
          plotId,
          mesh: doc,
          mode: "patrol_x",
          baseX: (i - 1.5) * 1.9,
          baseZ: 3.2 + (i % 2) * 1.6,
          range: 1.8,
          speed: 1.1,
          phase: i * 1.3
        });
      }

      g.add(main, pad, h1, h2, h3, crossV, crossH, canopy);
      g.userData.labelY = 9.8;
      return g;
    }

    // 3. GRAND SCHOOL CAMPUS (4 Plots • 2-Story U-Shaped Building + Flagpole + School Bus + Playing Kids)
    if (type === "school") {
      const main = new THREE.Mesh(new THREE.BoxGeometry(12.2, 5.2, 3.6), this.mat.wallCream);
      main.position.set(0, 2.65, -4.4);
      main.castShadow = true;

      const wingL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.4, 5.8), this.mat.wallCream);
      wingL.position.set(-4.5, 2.25, -0.2);
      wingL.castShadow = true;
      const wingR = wingL.clone();
      wingR.position.x = 4.5;

      const roofBand = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.45, 3.9), this.mat.roofOrange);
      roofBand.position.set(0, 5.4, -4.4);

      // 2 Floors of Classroom Windows
      [1.6, 3.8].forEach((wy) => {
        for (let wx = -4.4; wx <= 4.4; wx += 1.45) {
          const w = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.14), winMat);
          w.position.set(wx, wy, -2.56);
          w.userData.isWindow = true;
          g.add(w);
        }
      });

      // Indian Flagpole in Central Assembly Courtyard
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 5.4, 6), this.mat.wallWhite);
      pole.position.set(0, 2.75, 0.2);
      const flagTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
      flagTop.position.set(0.58, 5.2, 0.2);
      const flagMid = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), this.mat.wallWhite);
      flagMid.position.set(0.58, 4.96, 0.2);
      const flagBot = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), new THREE.MeshBasicMaterial({ color: 0x16a34a }));
      flagBot.position.set(0.58, 4.72, 0.2);

      // Yellow School Bus parked out front
      const schoolBus = this._makeVehicleMesh(true, false, 0xfacc15);
      schoolBus.position.set(3.8, 0.1, 5.4);
      schoolBus.rotation.y = Math.PI / 2;

      // 6 School Children (smaller scale, blue uniform) + 1 Teacher running/playing in courtyard
      for (let i = 0; i < 6; i++) {
        const kid = this._createCharacter({
          shirtMat: this.mat.wallWhite,
          pantsMat: this.mat.blueUniform,
          scale: 0.78
        });
        g.add(kid);
        this.landmarkActors.push({
          plotId,
          mesh: kid,
          mode: "orbit",
          baseX: 0,
          baseZ: 2.2,
          range: 1.4 + (i % 3) * 0.7,
          speed: 1.4 + (i % 2) * 0.5,
          phase: (i / 6) * Math.PI * 2
        });
      }

      g.add(main, wingL, wingR, roofBand, pole, flagTop, flagMid, flagBot, schoolBus);
      g.userData.labelY = 7.8;
      return g;
    }

    // 4. RTC BUS TERMINAL (4 Plots • Grand Terminal Building + Long Canopy + 3 RTC Buses + Passengers)
    if (type === "bus_stand") {
      const terminal = new THREE.Mesh(new THREE.BoxGeometry(12.4, 3.8, 3.2), this.mat.wallCream);
      terminal.position.set(0, 1.95, -4.6);
      terminal.castShadow = true;

      const roof = new THREE.Mesh(new THREE.BoxGeometry(13.0, 0.4, 6.2), this.mat.navy);
      roof.position.set(0, 4.2, -2.8);
      roof.rotation.x = 0.06;
      roof.castShadow = true;

      const yellowTrim = new THREE.Mesh(new THREE.BoxGeometry(13.1, 0.3, 0.2), this.mat.petrolYellow);
      yellowTrim.position.set(0, 4.0, 0.25);

      [-5.6, -1.8, 1.8, 5.6].forEach((px) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4.0, 8), this.mat.wallWhite);
        col.position.set(px, 2.0, -0.4);
        g.add(col);
      });

      // 3 Parked RTC Buses (Red Express, Blue Super Luxury, Green Palle Velugu)
      const busColors = [0xdc2626, 0x2563eb, 0x16a34a];
      [-4.2, 0, 4.2].forEach((bx, idx) => {
        const bus = this._makeVehicleMesh(true, false, busColors[idx]);
        bus.position.set(bx, 0.1, 3.4);
        g.add(bus);
      });

      // 5 Passengers & Conductors walking along the platform
      const shirtMats = [this.mat.wallCoral, this.mat.wallBlue, this.mat.khakiUniform, this.mat.wallGold, this.mat.wallMint];
      for (let i = 0; i < 5; i++) {
        const person = this._createCharacter({
          shirtMat: shirtMats[i],
          pantsMat: this.mat.darkPants,
          scale: 1.0
        });
        g.add(person);
        this.landmarkActors.push({
          plotId,
          mesh: person,
          mode: "patrol_x",
          baseX: (i - 2) * 2.2,
          baseZ: -1.4,
          range: 1.6,
          speed: 1.2 + (i % 2) * 0.4,
          phase: i * 1.5
        });
      }

      g.add(terminal, roof, yellowTrim);
      g.userData.labelY = 6.6;
      return g;
    }

    // 5. CRICKET STADIUM GROUND (4 Plots • Full Turf + Pitch + Grandstand + 4 Floodlights + Kids Playing Cricket!)
    if (type === "ground") {
      const pitch = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 5.8), this.mat.pitch);
      pitch.position.set(0, 0.16, 0.8);

      // White Boundary Circle
      const boundary = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.45, 36), this.mat.stripe);
      boundary.rotation.x = -Math.PI / 2;
      boundary.position.set(0, 0.18, 0.8);

      // Wickets at both ends
      [-1.7, 3.3].forEach((wz) => {
        const stump = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.08), this.mat.wood);
        stump.position.set(0, 0.45, wz);
        g.add(stump);
      });

      // 2-Tier Spectator Pavilion Stand
      const stand1 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.4, 2.2), this.mat.wallWhite);
      stand1.position.set(0, 0.75, -5.6);
      const stand2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 2.4, 1.2), this.mat.wallBlue);
      stand2.position.set(0, 1.25, -6.2);
      const standRoof = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.25, 2.8), this.mat.navy);
      standRoof.position.set(0, 3.2, -5.6);

      // 4 Tall Stadium Floodlight Towers
      [[-6.2, -6.2], [6.2, -6.2], [-6.2, 6.2], [6.2, 6.2]].forEach(([fx, fz]) => {
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 6.8, 6), this.mat.lampPole);
        tower.position.set(fx, 3.45, fz);
        const bulb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.25), this.mat.lampBulbDay);
        bulb.position.set(fx, 6.8, fz);
        bulb.lookAt(0, 0, 0);
        this.lampBulbs.push(bulb);
        g.add(tower, bulb);
      });

      // CHILDREN PLAYING CRICKET (Batsman, Bowler, 5 Fielders running + Bouncing Cricket Ball!)
      const batsman = this._createCharacter({ shirtMat: this.mat.jerseyBlue, pantsMat: this.mat.wallWhite, scale: 0.85, hasBat: true });
      g.add(batsman);
      this.landmarkActors.push({ plotId, mesh: batsman, mode: "hop", baseX: 0, baseZ: 2.9, range: 0.2, speed: 4.0, phase: 0 });

      const bowler = this._createCharacter({ shirtMat: this.mat.jerseyRed, pantsMat: this.mat.wallWhite, scale: 0.85 });
      g.add(bowler);
      this.landmarkActors.push({ plotId, mesh: bowler, mode: "patrol_z", baseX: 0.3, baseZ: -2.2, range: 1.2, speed: 3.2, phase: 1.0 });

      const fielderCoords = [[-3.4, 0.5], [3.4, 0.5], [-2.8, 3.8], [2.8, 3.8], [0, 5.0]];
      fielderCoords.forEach(([fx, fz], idx) => {
        const kid = this._createCharacter({
          shirtMat: idx % 2 === 0 ? this.mat.jerseyYellow : this.mat.jerseyRed,
          pantsMat: this.mat.darkPants,
          scale: 0.82
        });
        g.add(kid);
        this.landmarkActors.push({
          plotId,
          mesh: kid,
          mode: "orbit",
          baseX: fx,
          baseZ: fz,
          range: 0.9,
          speed: 2.2 + (idx % 2) * 0.6,
          phase: idx * 1.1
        });
      });

      // Flying Cricket Ball bouncing between bowler and batsman
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), this.mat.ballRed);
      g.add(ball);
      this.landmarkActors.push({ plotId, mesh: ball, mode: "ball", baseX: 0, baseZ: 0.8, range: 2.2, speed: 3.6, phase: 0 });

      g.add(pitch, boundary, stand1, stand2, standRoof);
      g.userData.labelY = 7.6;
      return g;
    }

    // 6. HIGHWAY PETROL BUNK PLAZA (4 Plots • Huge Canopy + 4 Pumps + Mart + Workers + Refueling Cars)
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.65, 6.8), this.mat.petrolRed);
    canopy.position.set(0, 4.4, 1.2);
    canopy.castShadow = true;
    const trim = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.25, 7.0), this.mat.petrolYellow);
    trim.position.set(0, 4.05, 1.2);

    const pillarGeo = new THREE.CylinderGeometry(0.24, 0.24, 4.2, 8);
    [[-4.5, -1.2], [0, -1.2], [4.5, -1.2], [-4.5, 3.6], [0, 3.6], [4.5, 3.6]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(pillarGeo, this.mat.wallWhite);
      p.position.set(px, 2.1, pz);
      g.add(p);
    });

    // 4 Fuel Pump Dispensers
    [-3.2, -1.1, 1.1, 3.2].forEach((px) => {
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.6, 0.65), this.mat.petrolRed);
      pump.position.set(px, 0.85, 1.2);
      g.add(pump);
    });

    // Mart & Office Building at Back
    const office = new THREE.Mesh(new THREE.BoxGeometry(10.6, 3.2, 3.2), this.mat.wallWhite);
    office.position.set(0, 1.65, -4.6);
    office.castShadow = true;
    const officeTop = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.45, 3.4), this.mat.petrolRed);
    officeTop.position.set(0, 3.35, -4.6);

    // 2 Refueling Cars + 3 Petrol Bunk Workers
    const car1 = this._makeVehicleMesh(false, false, 0x3b82f6);
    car1.position.set(-2.2, 0.1, 3.1);
    car1.rotation.y = Math.PI / 2;
    const car2 = this._makeVehicleMesh(false, true, 0xfacc15);
    car2.position.set(2.4, 0.1, 3.1);
    car2.rotation.y = Math.PI / 2;

    [-3.2, 0, 3.2].forEach((wx, idx) => {
      const worker = this._createCharacter({
        shirtMat: this.mat.petrolRed,
        pantsMat: this.mat.navy,
        hatColor: 0xfacc15,
        scale: 1.02
      });
      g.add(worker);
      this.landmarkActors.push({
        plotId,
        mesh: worker,
        mode: "patrol_z",
        baseX: wx,
        baseZ: 2.2,
        range: 1.1,
        speed: 1.3,
        phase: idx * 2.0
      });
    });

    g.add(canopy, trim, office, officeTop, car1, car2);
    g.userData.labelY = 6.8;
    return g;
  }

  // =========================================================================
  // 1-PLOT ROAD-FACING FOLLOWER HOUSES & LOCAL SHOP
  // Front (+Z) automatically rotates to face the street!
  // =========================================================================
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

    // Flat South Indian terrace parapet
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.38, 4.45), this.mat.wallWhite);
    parapet.position.set(0, h + 0.22, -0.2);

    // Staircase mumty room on roof
    const mumty = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.5), this.mat.wallCream);
    mumty.position.set(-1.1, h + 0.7, -1.2);

    // Front Porch & Gate Pathway leading directly toward the Road (+Z)
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
    canvas.width = isBig ? 420 : 320;
    canvas.height = subText ? 96 : 68;
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
      ctx.fillText(cleanMain, cx, 64);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(cleanMain, cx, 35);
    }

    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(isBig ? 8.2 : 5.0, subText ? (isBig ? 2.1 : 1.5) : 1.15, 1);
    return sprite;
  }

  setTimeOfDay(mode) {
    this.timeOfDay = mode;
    if (mode === "night") {
      this.scene.background.setHex(0x0b1120);
      this.scene.fog.color.setHex(0x0b1120);
      this.sunLight.color.setHex(0x60a5fa);
      this.sunLight.intensity = 0.42;
      this.hemiLight.intensity = 0.28;
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
      this.hemiLight.intensity = 0.8;
    }

    const isNight = mode === "night";
    this.lampBulbs.forEach((b) => {
      b.material = isNight ? this.mat.lampBulbNight : this.mat.lampBulbDay;
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
    const isBig = data && data.status === "built" && (data.size === 4 || FOUR_PLOT_TYPES.has(data.buildingType));
    const pos = this.getPlotPosition(plotIndex);
    const tx = isBig ? pos.blockCenterX : pos.x;
    const tz = isBig ? pos.blockCenterZ : pos.z;
    const dist = isBig ? 26 : 17;

    this.cameraGoal = {
      target: new THREE.Vector3(tx, isBig ? 2.5 : 1.4, tz),
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
    const s = isBig ? 1.95 : 1.0;
    this.highlightBeacon.scale.set(s, s, 1);
    this.highlightBeacon.position.set(tx, 0.25, tz);
  }

  findPlotByQuery(query) {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return null;
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

    // Police sirens flashing
    const flash = Math.floor(elapsed * 5) % 2 === 0;
    this.sirenLights.forEach((s, idx) => {
      s.visible = idx % 2 === 0 ? flash : !flash;
    });

    if (this.lifeEnabled) {
      // Animate landmark NPCs (Police, Doctors, Playing Cricket Kids, Passengers, Petrol Workers)
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
          a.mesh.position.set(nx, 0.14 + Math.abs(Math.sin(t * 5)) * 0.18, nz);
          a.mesh.rotation.y = -t;
        } else if (a.mode === "hop") {
          a.mesh.position.set(a.baseX, 0.14 + Math.abs(Math.sin(t)) * 0.18, a.baseZ);
          a.mesh.rotation.y = Math.PI + Math.sin(t * 0.5) * 0.35;
        } else if (a.mode === "guard") {
          a.mesh.position.set(a.baseX, 0.14, a.baseZ);
          a.mesh.rotation.y = Math.sin(t * 0.6) * 0.5;
        } else if (a.mode === "ball") {
          const bz = a.baseZ + Math.sin(t) * a.range;
          const by = 0.25 + Math.abs(Math.cos(t * 2)) * 1.1;
          a.mesh.position.set(a.baseX, by, bz);
        }
      }

      // Inner town vehicles
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
      }

      // Outer Ring Road looping traffic
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

      // Roaming workers
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

    // Active construction animations
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
