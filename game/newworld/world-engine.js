import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class FollowerTownEngine {
  constructor(container, onPlotSelected) {
    this.container = container;
    this.onPlotSelected = onPlotSelected;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0022);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(36, aspect, 0.5, 900);
    this.camera.position.set(55, 58, 55);

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
    this.controls.maxDistance = 260;
    this.controls.target.set(0, 0, 0);

    this.PLOT_SIZE = 7;
    this.ROAD_WIDTH = 4.2;
    this.BLOCK_STEP = this.PLOT_SIZE * 2 + this.ROAD_WIDTH;

    this.currentGridRadius = 0;
    this.plotDataMap = new Map();
    this.plotMeshes = new Map();
    this.plotHitboxes = [];
    this.vehicles = [];
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
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x4d7c0f, 0.75);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    this.sunLight.position.set(60, 95, 45);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 280;
    const d = 110;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);
  }

  _initSharedMaterials() {
    this.mat = {
      grass: new THREE.MeshLambertMaterial({ color: 0x65a30d }),
      road: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      sidewalk: new THREE.MeshLambertMaterial({ color: 0x94a3b8 }),
      stripe: new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
      wood: new THREE.MeshLambertMaterial({ color: 0x92400e }),
      roofDark: new THREE.MeshLambertMaterial({ color: 0x334155 }),
      roofRed: new THREE.MeshLambertMaterial({ color: 0xb91c1c }),
      roofOrange: new THREE.MeshLambertMaterial({ color: 0xc2410c }),
      wallWhite: new THREE.MeshLambertMaterial({ color: 0xf1f5f9 }),
      wallBlue: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }),
      wallCoral: new THREE.MeshLambertMaterial({ color: 0xfb7185 }),
      wallMint: new THREE.MeshLambertMaterial({ color: 0x34d399 }),
      wallGold: new THREE.MeshLambertMaterial({ color: 0xfbbf24 }),
      petrolRed: new THREE.MeshLambertMaterial({ color: 0xdc2626 }),
      petrolYellow: new THREE.MeshLambertMaterial({ color: 0xfacc15 }),
      treeTrunk: new THREE.MeshLambertMaterial({ color: 0x78350f }),
      treeLeaf: new THREE.MeshLambertMaterial({ color: 0x16a34a }),
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
      this._rebuildRoadsAndEnvironment();
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

  _rebuildRoadsAndEnvironment() {
    while (this.cityGroup.children.length > 0) {
      this.cityGroup.remove(this.cityGroup.children[0]);
    }
    this.lampBulbs = [];

    const r = this.currentGridRadius;
    const gridCount = r * 2 + 1;
    const worldSpan = gridCount * this.BLOCK_STEP + this.ROAD_WIDTH * 2;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(worldSpan + 90, worldSpan + 90),
      this.mat.grass
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.cityGroup.add(ground);

    const roadLines = [];
    for (let i = -r; i <= r + 1; i++) {
      roadLines.push((i - 0.5) * this.BLOCK_STEP);
    }

    const roadLen = gridCount * this.BLOCK_STEP + this.ROAD_WIDTH;
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

      for (let d = -roadLen / 2 + 2; d < roadLen / 2 - 2; d += 4.5) {
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

    const edge = worldSpan / 2 + 4;
    for (let t = -edge; t <= edge; t += 9) {
      this._addTree(t, -edge);
      this._addTree(t, edge);
      this._addTree(-edge, t);
      this._addTree(edge, t);
    }

    this.setTimeOfDay(this.timeOfDay);
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

  _addTree(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.5, 6), this.mat.treeTrunk);
    trunk.position.y = 0.75;
    const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.8, 6), this.mat.treeLeaf);
    foliage.position.y = 2.6;
    foliage.castShadow = true;
    g.add(trunk, foliage);
    g.position.set(x + (Math.random() - 0.5) * 2, 0, z + (Math.random() - 0.5) * 2);
    this.cityGroup.add(g);
  }

  _spawnVehicles() {
    while (this.trafficGroup.children.length > 0) {
      this.trafficGroup.remove(this.trafficGroup.children[0]);
    }
    this.vehicles = [];

    const r = this.currentGridRadius;
    const roadCount = Math.min(24, (r * 2 + 2) * 2);
    const colors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981, 0xf97316, 0xf8fafc];
    const limit = (r + 0.5) * this.BLOCK_STEP;

    for (let i = 0; i < roadCount; i++) {
      const isBus = i % 5 === 0;
      const isAuto = i % 3 === 0 && !isBus;
      const car = new THREE.Group();

      const bodyColor = isAuto ? 0xfacc15 : isBus ? 0x2563eb : colors[i % colors.length];
      const len = isBus ? 3.2 : isAuto ? 1.4 : 2.0;
      const h = isBus ? 1.3 : isAuto ? 1.0 : 0.7;
      const w = isBus ? 1.15 : isAuto ? 0.85 : 1.0;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, len),
        new THREE.MeshLambertMaterial({ color: bodyColor })
      );
      body.position.y = h / 2 + 0.2;
      body.castShadow = true;
      car.add(body);

      if (!isBus) {
        const cabin = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.85, 0.45, len * 0.55),
          new THREE.MeshLambertMaterial({ color: isAuto ? 0x15803d : 0xe2e8f0 })
        );
        cabin.position.y = h + 0.35;
        car.add(cabin);
      }

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
      this.vehicles.push({
        mesh: car,
        horizontal,
        dir,
        speed: (isBus ? 4.2 : 6.5) + Math.random() * 3,
        limit
      });
    }
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
    }

    const pos = this.getPlotPosition(plotIndex);
    const plotGroup = new THREE.Group();
    plotGroup.position.set(pos.x, 0.08, pos.z);

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(this.PLOT_SIZE - 0.3, 4.5, this.PLOT_SIZE - 0.3),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = 2.25;
    hitbox.userData.plotId = plotId;
    plotGroup.add(hitbox);
    this.plotHitboxes.push(hitbox);

    const lotBase = new THREE.Mesh(
      new THREE.BoxGeometry(this.PLOT_SIZE - 0.35, 0.12, this.PLOT_SIZE - 0.35),
      data.status === "built" ? this.mat.sidewalk : this.mat.grass
    );
    lotBase.position.y = 0.06;
    lotBase.receiveShadow = true;
    plotGroup.add(lotBase);

    let buildingObj = null;
    if (!data || data.status !== "built" || data.buildingType === "empty") {
      buildingObj = this._buildEmptyPlotMesh();
    } else {
      buildingObj = this._buildStructureMesh(data.buildingType);
      if (data.ownerName) {
        const label = this._createNameSign(data.ownerName);
        label.position.set(0, buildingObj.userData.labelY || 5.2, 0);
        buildingObj.add(label);
      }
    }

    plotGroup.add(buildingObj);

    if (animateBuild && data.status === "built") {
      buildingObj.scale.y = 0.05;
      const scaffold = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.2, 5.2), this.mat.scaffolding);
      scaffold.position.y = 2.1;
      plotGroup.add(scaffold);

      const siteWorkers = [];
      for (let w = 0; w < 2; w++) {
        const npc = this._createVoxelWorker(0xf97316);
        npc.position.set(w === 0 ? -2.6 : 2.6, 0.1, 2.4);
        plotGroup.add(npc);
        siteWorkers.push(npc);
      }

      this.constructions.push({ buildingObj, scaffold, siteWorkers, plotGroup, progress: 0 });
    }

    this.plotsGroup.add(plotGroup);
    this.plotMeshes.set(plotId, plotGroup);
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

  _buildStructureMesh(type) {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;

    if (type === "petrol_bunk") {
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.5, 4.4), this.mat.petrolRed);
      canopy.position.y = 3.2;
      canopy.castShadow = true;
      const trim = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.18, 4.5), this.mat.petrolYellow);
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
      g.userData.labelY = 4.6;
      return g;
    }

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
      g.userData.labelY = 4.2;
      return g;
    }

    if (type === "academy") {
      const main = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.8, 4.8), this.mat.wallWhite);
      main.position.y = 1.95;
      main.castShadow = true;
      const roof = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.4, 5.1), this.mat.roofDark);
      roof.position.y = 4.0;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.45, 4.9), this.mat.wallBlue);
      stripe.position.y = 3.2;

      for (let wx = -1.8; wx <= 1.8; wx += 1.2) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.12), winMat);
        w.position.set(wx, 2.1, 2.42);
        w.userData.isWindow = true;
        g.add(w);
      }
      g.add(main, roof, stripe);
      g.userData.labelY = 5.4;
      return g;
    }

    const wallMap = {
      house_blue: this.mat.wallBlue,
      house_coral: this.mat.wallCoral,
      house_mint: this.mat.wallMint,
      house_gold: this.mat.wallGold
    };
    const roofMap = {
      house_blue: this.mat.roofDark,
      house_coral: this.mat.roofRed,
      house_mint: this.mat.roofOrange,
      house_gold: this.mat.roofDark
    };

    const isDuplex = type === "house_gold";
    const h = isDuplex ? 3.8 : 2.5;
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, h, 4.2), wallMap[type] || this.mat.wallBlue);
    body.position.y = h / 2 + 0.08;
    body.castShadow = true;
    body.receiveShadow = true;

    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.5, 4), roofMap[type] || this.mat.roofRed);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = h + 0.8;
    roof.castShadow = true;

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.35, 0.12), this.mat.wood);
    door.position.set(0, 0.75, 2.12);

    const winL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.12), winMat);
    winL.position.set(-1.35, 1.5, 2.12);
    winL.userData.isWindow = true;
    const winR = winL.clone();
    winR.position.x = 1.35;
    winR.userData.isWindow = true;

    g.add(body, roof, door, winL, winR);
    g.userData.labelY = h + 2.3;
    return g;
  }

  _createNameSign(text) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.beginPath();
    ctx.roundRect(6, 8, 244, 48, 14);
    ctx.fill();

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const clean = text.length > 15 ? text.slice(0, 14) + "…" : text;
    ctx.fillText(clean, 128, 33);

    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sprite.scale.set(4.6, 1.15, 1);
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
      this.hemiLight.intensity = 0.75;
    }

    const isNight = mode === "night";
    if (this.lampBulbs) {
      this.lampBulbs.forEach((b) => {
        b.material = isNight ? this.mat.lampBulbNight : this.mat.lampBulbDay;
      });
    }
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
      target: new THREE.Vector3(pos.x, 1.2, pos.z),
      camPos: new THREE.Vector3(pos.x + 16, 17, pos.z + 16)
    };

    if (!this.highlightBeacon) {
      this.highlightBeacon = new THREE.Mesh(
        new THREE.RingGeometry(3.4, 3.9, 24),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      this.highlightBeacon.rotation.x = -Math.PI / 2;
      this.scene.add(this.highlightBeacon);
    }
    this.highlightBeacon.position.set(pos.x, 0.22, pos.z);
  }

  findPlotByUsername(query) {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return null;
    for (const [plotId, data] of this.plotDataMap.entries()) {
      if (data && data.ownerName) {
        const clean = data.ownerName.toLowerCase().replace(/^@/, "");
        if (clean.includes(q)) return plotId;
      }
    }
    return null;
  }

  _animate() {
    requestAnimationFrame(() => this._animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.cameraGoal) {
      this.controls.target.lerp(this.cameraGoal.target, 0.08);
      this.camera.position.lerp(this.cameraGoal.camPos, 0.08);
      if (this.camera.position.distanceTo(this.cameraGoal.camPos) < 0.4) {
        this.cameraGoal = null;
      }
    }

    this.controls.autoRotate = this.autoSpin;
    if (this.autoSpin) this.controls.autoRotateSpeed = 1.6;

    if (this.lifeEnabled) {
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

      const elapsed = this.clock.elapsedTime;
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
