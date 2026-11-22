import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export const BUILDING_LABELS = {
  house_blue: "🏠 Blue Terrace House",
  house_coral: "🏠 Coral Modern House",
  house_mint: "🏡 Mint Villa",
  house_gold: "🏢 Golden Duplex",
  school: "🏫 పాఠశాల • SCHOOL",
  hospital: "🏥 ఆసుపత్రి • HOSPITAL",
  bus_stand: "🚌 బస్ స్టాండ్ • RTC BUS STAND",
  ground: "🏏 గ్రౌండ్ • CRICKET GROUND",
  police_station: "🚓 పోలీస్ స్టేషన్ • POLICE",
  petrol_bunk: "⛽ పెట్రోల్ బంక్ • PETROL BUNK",
  shop: "☕ టీ & టిఫిన్ • SHOP",
  empty: "OPEN LAND"
};

export class FollowerTownEngine {
  constructor(container, onPlotSelected) {
    this.container = container;
    this.onPlotSelected = onPlotSelected;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0018);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(36, aspect, 0.5, 1100);
    this.camera.position.set(62, 64, 62);

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
    this.controls.maxDistance = 320;
    this.controls.target.set(0, 0, 0);

    this.PLOT_SIZE = 7.4;
    this.ROAD_WIDTH = 4.2;
    this.BLOCK_STEP = this.PLOT_SIZE * 2 + this.ROAD_WIDTH; // 19.0
    this.RING_ROAD_WIDTH = 7.2;

    this.currentGridRadius = 0;
    this.townName = "FOLLOWER NAGARAM";
    this.plotDataMap = new Map();
    this.plotMeshes = new Map();
    this.plotHitboxes = [];
    this.lampBulbs = [];
    this.sirenLights = [];
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
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x4d7c0f, 0.78);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    this.sunLight.position.set(70, 105, 55);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 320;
    const d = 125;
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
      stripe: new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
      yellowStripe: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
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
      windowNight: new THREE.MeshLambertMaterial({ color: 0xfde047 }),
      scaffolding: new THREE.MeshLambertMaterial({ color: 0xd97706, wireframe: true })
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
      if (this.currentGridRadius > 0) {
        this._rebuildRoadsAndRingRoad();
      }
    }
  }

  getPlotPosition(plotIndex) {
    const blockIdx = Math.floor(plotIndex / 4);
    const subIdx = plotIndex % 4;
    const { bx, bz } = this._spiralBlockCoord(blockIdx);

    const centerX = bx * this.BLOCK_STEP;
    const centerZ = bz * this.BLOCK_STEP;
    const half = this.PLOT_SIZE / 2;

    const offsets = [
      { x: -half, z: -half },
      { x: half, z: -half },
      { x: -half, z: half },
      { x: half, z: half }
    ];

    return { x: centerX + offsets[subIdx].x, z: centerZ + offsets[subIdx].z, bx, bz };
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
    const ringRadius = innerSpan / 2 + 10; // Outer Ring Road distance from center
    this.ringRadius = ringRadius;

    // Lush ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(ringRadius * 2 + 110, ringRadius * 2 + 110),
      this.mat.grass
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.06;
    ground.receiveShadow = true;
    this.cityGroup.add(ground);

    // 1. INNER TOWN ROADS
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

    // 4 Connector Roads linking Inner Town to Outer Ring Road (N, S, E, W)
    const connLen = ringRadius - innerSpan / 2 + 2;
    const connMid = innerSpan / 2 + connLen / 2 - 1;
    const cNS = new THREE.BoxGeometry(this.ROAD_WIDTH + 1.2, 0.08, connLen);
    const cEW = new THREE.BoxGeometry(connLen, 0.08, this.ROAD_WIDTH + 1.2);
    [[0, connMid, cNS], [0, -connMid, cNS], [connMid, 0, cEW], [-connMid, 0, cEW]].forEach(([x, z, geo]) => {
      const m = new THREE.Mesh(geo, this.mat.road);
      m.position.set(x, 0.015, z);
      this.cityGroup.add(m);
    });

    // 2. OUTER RING ROAD (ORR — 4-lane highway with green central median & highway lamps)
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

    // Ring Road Central Divider Median (Green + Yellow kerb)
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

    // Highway Double-Arm Lamps & Trees along Outer Ring Road
    for (let p = -ringRadius + 8; p <= ringRadius - 8; p += 16) {
      this._addHighwayLamp(p, -ringRadius);
      this._addHighwayLamp(p, ringRadius);
      this._addHighwayLamp(-ringRadius, p);
      this._addHighwayLamp(ringRadius, p);

      // Coconut / Neem trees outside the Ring Road
      this._addPalmTree(p, -(ringRadius + 7));
      this._addPalmTree(p, ringRadius + 7);
      this._addPalmTree(-(ringRadius + 7), p);
      this._addPalmTree(ringRadius + 7, p);
    }

    // 3. GRAND TELUGU + ENGLISH WELCOME ARCH on South Ring Road Entrance
    this._addWelcomeArch(0, ringRadius - rw / 2 - 2.2);

    // 4. SIDEWALK PADS & INNER STREETLAMPS
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
    const pGeo = new THREE.BoxGeometry(0.9, 6.2, 0.9);
    const pL = new THREE.Mesh(pGeo, this.mat.wallCream);
    pL.position.set(-4.2, 3.1, 0);
    const pR = pL.clone();
    pR.position.x = 4.2;

    const beam = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.4, 1.1), this.mat.navy);
    beam.position.set(0, 6.1, 0);
    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.25, 1.2), this.mat.petrolYellow);
    topTrim.position.set(0, 6.9, 0);

    // Bilingual Telugu + English Arch Board
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
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("స్వాగతం • OUTER RING ROAD", 256, 42);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText(this.townName.toUpperCase(), 256, 84);

    const tex = new THREE.CanvasTexture(canvas);
    const signMat = new THREE.MeshBasicMaterial({ map: tex });
    const frontSign = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 1.25), signMat);
    frontSign.position.set(0, 6.1, 0.58);
    const backSign = frontSign.clone();
    backSign.rotation.y = Math.PI;
    backSign.position.z = -0.58;

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

    // Inner town traffic (Autos, RTC Buses, Cars)
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

    // Outer Ring Road fast highway vehicles (looping around the square ORR)
    const rr = this.ringRadius;
    for (let i = 0; i < 14; i++) {
      const isBus = i % 4 === 0;
      const car = this._makeVehicleMesh(isBus, false, colors[(i + 2) % colors.length]);
      const cw = i % 2 === 0;
      const lane = cw ? rr + 1.8 : rr - 1.8;
      this.trafficGroup.add(car);
      this.ringVehicles.push({
        mesh: car,
        t: (i / 14) * 4, // 0..4 perimeter progress
        cw,
        lane,
        speed: (isBus ? 9 : 13) + Math.random() * 4
      });
    }
  }

  _makeVehicleMesh(isBus, isAuto, color) {
    const car = new THREE.Group();
    const bodyColor = isAuto ? 0xfacc15 : isBus ? 0xdc2626 : color;
    const len = isBus ? 3.4 : isAuto ? 1.4 : 2.1;
    const h = isBus ? 1.35 : isAuto ? 1.0 : 0.72;
    const w = isBus ? 1.15 : isAuto ? 0.85 : 1.02;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, len),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    );
    body.position.y = h / 2 + 0.2;
    body.castShadow = true;
    car.add(body);

    if (isBus) {
      // RTC style white stripe
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

    const count = Math.min(28, 8 + this.currentGridRadius * 4);
    const limit = (this.currentGridRadius + 0.4) * this.BLOCK_STEP;

    for (let i = 0; i < count; i++) {
      const worker = this._createVoxelWorker(i % 2 === 0 ? 0xf59e0b : 0x0ea5e9);
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

  _createVoxelWorker(vestColor = 0xf97316) {
    const g = new THREE.Group();
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.22), new THREE.MeshLambertMaterial({ color: 0x1e3a8a }));
    legs.position.y = 0.225;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.25), new THREE.MeshLambertMaterial({ color: vestColor }));
    torso.position.y = 0.68;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), new THREE.MeshLambertMaterial({ color: 0xfdba74 }));
    head.position.y = 1.08;
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.34), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
    helmet.position.y = 1.24;
    g.add(legs, torso, head, helmet);
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
    }

    const pos = this.getPlotPosition(plotIndex);
    const plotGroup = new THREE.Group();
    plotGroup.position.set(pos.x, 0.08, pos.z);

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(this.PLOT_SIZE - 0.3, 4.8, this.PLOT_SIZE - 0.3),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = 2.4;
    hitbox.userData.plotId = plotId;
    plotGroup.add(hitbox);
    this.plotHitboxes.push(hitbox);

    const lotBase = new THREE.Mesh(
      new THREE.BoxGeometry(this.PLOT_SIZE - 0.3, 0.12, this.PLOT_SIZE - 0.3),
      data.buildingType === "ground"
        ? this.mat.turf
        : data.status === "built"
        ? this.mat.sidewalk
        : this.mat.grass
    );
    lotBase.position.y = 0.06;
    lotBase.receiveShadow = true;
    plotGroup.add(lotBase);

    let buildingObj = null;
    if (!data || data.status !== "built" || data.buildingType === "empty") {
      buildingObj = this._buildEmptyPlotMesh();
    } else {
      buildingObj = this._buildStructureMesh(data.buildingType, plotId);
      const topLabel = data.ownerName || BUILDING_LABELS[data.buildingType] || "";
      const subLabel = this._getLandmarkSubtitle(data.buildingType);
      if (topLabel) {
        const sign = this._createNameSign(topLabel, subLabel);
        sign.position.set(0, buildingObj.userData.labelY || 5.4, 0);
        buildingObj.add(sign);
      }
    }

    plotGroup.add(buildingObj);

    if (animateBuild && data.status === "built") {
      buildingObj.scale.y = 0.05;
      const scaffold = new THREE.Mesh(new THREE.BoxGeometry(5.6, 4.4, 5.6), this.mat.scaffolding);
      scaffold.position.y = 2.2;
      plotGroup.add(scaffold);

      const siteWorkers = [];
      for (let w = 0; w < 2; w++) {
        const npc = this._createVoxelWorker(0xf97316);
        npc.position.set(w === 0 ? -2.8 : 2.8, 0.1, 2.5);
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
      school: "పాఠశాల • SCHOOL",
      hospital: "ఆసుపత్రి • HOSPITAL",
      bus_stand: "బస్ స్టాండ్ • RTC",
      ground: "గ్రౌండ్ • CRICKET",
      police_station: "పోలీస్ స్టేషన్ • POLICE",
      petrol_bunk: "పెట్రోల్ బంక్",
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

  _buildStructureMesh(type, plotId) {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;

    // 1. SCHOOL (పాఠశాల / SCHOOL - ZP/English Medium style with flagpole & wings)
    if (type === "school") {
      const main = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.0, 2.4), this.mat.wallCream);
      main.position.set(0, 1.55, -1.6);
      main.castShadow = true;
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.5, 2.6), this.mat.wallCream);
      wingL.position.set(-2.1, 1.3, 0.6);
      const wingR = wingL.clone();
      wingR.position.x = 2.1;

      const roofBand = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.38, 2.6), this.mat.roofOrange);
      roofBand.position.set(0, 3.15, -1.6);

      // Windows
      for (let wx = -2.0; wx <= 2.0; wx += 1.0) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.12), winMat);
        w.position.set(wx, 1.8, -0.38);
        w.userData.isWindow = true;
        g.add(w);
      }

      // Indian Flagpole in Courtyard
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.6, 6), this.mat.wallWhite);
      pole.position.set(0, 1.85, 1.4);
      const flagTop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.04), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
      flagTop.position.set(0.42, 3.45, 1.4);
      const flagMid = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.04), this.mat.wallWhite);
      flagMid.position.set(0.42, 3.27, 1.4);
      const flagBot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.04), new THREE.MeshBasicMaterial({ color: 0x16a34a }));
      flagBot.position.set(0.42, 3.09, 1.4);

      g.add(main, wingL, wingR, roofBand, pole, flagTop, flagMid, flagBot);
      g.userData.labelY = 5.1;
      return g;
    }

    // 2. HOSPITAL (ఆసుపత్రి / HOSPITAL - White & Teal + Red Cross + Ambulance)
    if (type === "hospital") {
      const body = new THREE.Mesh(new THREE.BoxGeometry(5.6, 4.2, 3.8), this.mat.wallWhite);
      body.position.set(0, 2.15, -0.6);
      body.castShadow = true;

      const tealBand = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.45, 3.9), this.mat.teal);
      tealBand.position.set(0, 3.85, -0.6);

      // Red Cross (+) emblem
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.05, 0.14), this.mat.petrolRed);
      crossV.position.set(0, 3.05, 1.32);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.32, 0.14), this.mat.petrolRed);
      crossH.position.set(0, 3.05, 1.32);

      // Emergency Portico
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 1.6), this.mat.teal);
      canopy.position.set(0, 1.7, 1.9);

      // Parked White Ambulance
      const amb = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 1.8), this.mat.wallWhite);
      amb.position.set(1.7, 0.55, 2.2);
      const ambStripe = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.18, 1.82), this.mat.petrolRed);
      ambStripe.position.set(1.7, 0.55, 2.2);

      for (let wx = -1.8; wx <= 1.8; wx += 1.2) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.7, 0.12), winMat);
        w.position.set(wx, 2.0, 1.32);
        w.userData.isWindow = true;
        g.add(w);
      }

      g.add(body, tealBand, crossV, crossH, canopy, amb, ambStripe);
      g.userData.labelY = 5.8;
      return g;
    }

    // 3. BUS STAND (బస్ స్టాండ్ / RTC BUS STAND - Shelter bays + 2 parked RTC Buses)
    if (type === "bus_stand") {
      const platform = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.35, 2.2), this.mat.sidewalk);
      platform.position.set(0, 0.22, -1.6);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.28, 3.2), this.mat.navy);
      roof.position.set(0, 2.9, -1.2);
      roof.rotation.x = 0.08;
      roof.castShadow = true;

      const yellowTrim = new THREE.Mesh(new THREE.BoxGeometry(6.25, 0.22, 0.16), this.mat.petrolYellow);
      yellowTrim.position.set(0, 2.75, 0.38);

      [-2.6, 0, 2.6].forEach((px) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.6, 8), this.mat.wallWhite);
        col.position.set(px, 1.5, -1.8);
        g.add(col);
      });

      // Parked Red Express RTC Bus & Blue Metro/Palle Velugu Bus
      const bus1 = this._makeVehicleMesh(true, false, 0xdc2626);
      bus1.position.set(-1.5, 0.08, 1.5);
      bus1.scale.set(0.85, 0.85, 0.85);
      const bus2 = this._makeVehicleMesh(true, false, 0x2563eb);
      bus2.position.set(1.5, 0.08, 1.5);
      bus2.scale.set(0.85, 0.85, 0.85);

      g.add(platform, roof, yellowTrim, bus1, bus2);
      g.userData.labelY = 4.6;
      return g;
    }

    // 4. CRICKET / SPORTS GROUND (గ్రౌండ్ / GROUND - Turf, Pitch, Floodlights, Pavilion)
    if (type === "ground") {
      const pitch = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 3.4), this.mat.pitch);
      pitch.position.set(0, 0.15, 0.2);

      // Boundary ring
      const boundary = new THREE.Mesh(
        new THREE.RingGeometry(2.6, 2.75, 28),
        this.mat.stripe
      );
      boundary.rotation.x = -Math.PI / 2;
      boundary.position.set(0, 0.16, 0.2);

      // Small Pavilion stand at back
      const stand = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 1.0), this.mat.wallWhite);
      stand.position.set(0, 0.65, -2.7);
      const standRoof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.18, 1.3), this.mat.wallBlue);
      standRoof.position.set(0, 1.45, -2.6);

      // 4 Corner Stadium Floodlights
      [[-2.9, -2.9], [2.9, -2.9], [-2.9, 2.9], [2.9, 2.9]].forEach(([fx, fz]) => {
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.8, 6), this.mat.lampPole);
        tower.position.set(fx, 1.95, fz);
        const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.2), this.mat.lampBulbDay);
        bulb.position.set(fx, 3.85, fz);
        bulb.lookAt(0, 0, 0);
        this.lampBulbs.push(bulb);
        g.add(tower, bulb);
      });

      g.add(pitch, boundary, stand, standRoof);
      g.userData.labelY = 4.8;
      return g;
    }

    // 5. POLICE STATION (పోలీస్ స్టేషన్ / POLICE - Khaki/Cream + Red/Blue Siren + Police Jeep)
    if (type === "police_station") {
      const main = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.0, 3.6), this.mat.wallKhaki);
      main.position.set(0, 1.55, -0.6);
      main.castShadow = true;

      const navyTrim = new THREE.Mesh(new THREE.BoxGeometry(5.35, 0.35, 3.75), this.mat.navy);
      navyTrim.position.set(0, 2.95, -0.6);
      const redTrim = new THREE.Mesh(new THREE.BoxGeometry(5.35, 0.2, 3.75), this.mat.petrolRed);
      redTrim.position.set(0, 2.65, -0.6);

      // Blinking Red/Blue Police Siren Beacon on roof
      const sirenRed = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.32, 0.32),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      sirenRed.position.set(-0.24, 3.3, 0.6);
      sirenRed.userData.plotId = plotId;
      const sirenBlue = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.32, 0.32),
        new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
      );
      sirenBlue.position.set(0.24, 3.3, 0.6);
      sirenBlue.userData.plotId = plotId;
      this.sirenLights.push(sirenRed, sirenBlue);

      // Parked White Police Jeep
      const jeep = this._makeVehicleMesh(false, false, 0xf8fafc);
      jeep.position.set(1.4, 0.08, 2.1);
      jeep.rotation.y = Math.PI / 2;
      jeep.scale.set(0.8, 0.8, 0.8);

      const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 0.12), this.mat.wood);
      door.position.set(0, 0.8, 1.22);

      g.add(main, navyTrim, redTrim, sirenRed, sirenBlue, jeep, door);
      g.userData.labelY = 4.9;
      return g;
    }

    // 6. PETROL BUNK
    if (type === "petrol_bunk") {
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.5, 4.4), this.mat.petrolRed);
      canopy.position.y = 3.2;
      canopy.castShadow = true;
      const trim = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.18, 4.5), this.mat.petrolYellow);
      trim.position.y = 2.95;

      const pillarGeo = new THREE.CylinderGeometry(0.18, 0.18, 3.0, 8);
      [[-2.1, -1.5], [2.1, -1.5], [-2.1, 1.5], [2.1, 1.5]].forEach(([px, pz]) => {
        const p = new THREE.Mesh(pillarGeo, this.mat.wallWhite);
        p.position.set(px, 1.5, pz);
        g.add(p);
      });

      [-1.0, 1.0].forEach((px) => {
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.3, 0.5), this.mat.petrolRed);
        pump.position.set(px, 0.7, 0);
        g.add(pump);
      });

      const office = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.0, 1.4), this.mat.wallWhite);
      office.position.set(0, 1.05, -2.0);
      g.add(canopy, trim, office);
      g.userData.labelY = 4.7;
      return g;
    }

    // 7. LOCAL TEA & TIFFIN SHOP
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
      g.userData.labelY = 4.3;
      return g;
    }

    // 8. REALISTIC SOUTH INDIAN / TELUGU TERRACE HOUSES
    const wallMap = {
      house_blue: this.mat.wallBlue,
      house_coral: this.mat.wallCoral,
      house_mint: this.mat.wallMint,
      house_gold: this.mat.wallGold
    };
    const isDuplex = type === "house_gold";
    const h = isDuplex ? 3.8 : 2.5;

    const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, h, 4.3), wallMap[type] || this.mat.wallBlue);
    body.position.y = h / 2 + 0.08;
    body.castShadow = true;
    body.receiveShadow = true;

    // Flat terrace roof with parapet border (authentic Telugu town house style)
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.38, 4.55), this.mat.wallWhite);
    parapet.position.y = h + 0.22;

    // Staircase room (mumty) on terrace
    const mumty = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.5), this.mat.wallCream);
    mumty.position.set(-1.1, h + 0.7, -1.0);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.4, 0.12), this.mat.wood);
    door.position.set(0, 0.78, 2.18);

    const winL = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.85, 0.12), winMat);
    winL.position.set(-1.35, 1.55, 2.18);
    winL.userData.isWindow = true;
    const winR = winL.clone();
    winR.position.x = 1.35;
    winR.userData.isWindow = true;

    g.add(body, parapet, mumty, door, winL, winR);
    g.userData.labelY = h + 2.2;
    return g;
  }

  _createNameSign(mainText, subText = "") {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = subText ? 92 : 68;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.beginPath();
    ctx.roundRect(6, 6, 308, canvas.height - 12, 16);
    ctx.fill();

    ctx.strokeStyle = subText ? "#facc15" : "#38bdf8";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const cleanMain = mainText.length > 20 ? mainText.slice(0, 19) + "…" : mainText;
    if (subText) {
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(subText, 160, 29);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(cleanMain, 160, 62);
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(cleanMain, 160, 35);
    }

    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(5.2, subText ? 1.5 : 1.15, 1);
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
      this.sunLight.intensity = 1.35;
      this.hemiLight.intensity = 0.78;
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
    const pos = this.getPlotPosition(plotIndex);

    this.cameraGoal = {
      target: new THREE.Vector3(pos.x, 1.4, pos.z),
      camPos: new THREE.Vector3(pos.x + 17, 18, pos.z + 17)
    };

    if (!this.highlightBeacon) {
      this.highlightBeacon = new THREE.Mesh(
        new THREE.RingGeometry(3.5, 4.0, 24),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      this.highlightBeacon.rotation.x = -Math.PI / 2;
      this.scene.add(this.highlightBeacon);
    }
    this.highlightBeacon.position.set(pos.x, 0.24, pos.z);
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

    // Police siren flash
    const flash = Math.floor(elapsed * 5) % 2 === 0;
    this.sirenLights.forEach((s, idx) => {
      s.visible = idx % 2 === 0 ? flash : !flash;
    });

    if (this.lifeEnabled) {
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

      // Outer Ring Road looping vehicles
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
      c.progress += dt * 0.45;
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
