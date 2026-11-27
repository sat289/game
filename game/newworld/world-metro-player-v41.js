import * as THREE from "three";

/**
 * 🚇🦁 SHERU BHAI CITY — v42 ROAD-ALIGNED DOUBLE-TRACK HIGH-SPEED METRO,
 * SOLID BUILDING COLLISION FOR CAR, & AUTO VILLA SONG (`./villa-song.mp3`)
 */
export const v41MetroPlayerMethods = {
  // =========================================================
  // 🚇 PART 1: ROAD-ALIGNED DOUBLE-TRACK ELEVATED METRO (EXACT MIDDLE OF WIDE RING ROAD!)
  // =========================================================
  _buildMetroSystem(ringRadius) {
    const metroGrp = new THREE.Group();
    const deckY = 13.6; // High above all roads, cars & streetlights
    const R = ringRadius; // Exact centerline of the 12-unit wide Outer Ring Road!
    const cr = 10.0; // Smooth rounded corner radius inside the Ring Road intersections

    // Build an EXACT road-aligned rounded-square loop along the Ring Road centerline (NEVER cuts across houses!)
    const pts = [
      // North Ring Road (West -> East)
      new THREE.Vector3(-R + cr, deckY, -R),
      new THREE.Vector3(0,       deckY, -R),
      new THREE.Vector3(R - cr,  deckY, -R),
      // NE Corner
      new THREE.Vector3(R - 2.5, deckY, -R + 2.5),
      // East Ring Road (North -> South)
      new THREE.Vector3(R,       deckY, -R + cr),
      new THREE.Vector3(R,       deckY, 0),
      new THREE.Vector3(R,       deckY, R - cr),
      // SE Corner
      new THREE.Vector3(R - 2.5, deckY, R - 2.5),
      // South Ring Road (East -> West)
      new THREE.Vector3(R - cr,  deckY, R),
      new THREE.Vector3(0,       deckY, R),
      new THREE.Vector3(-R + cr, deckY, R),
      // SW Corner
      new THREE.Vector3(-R + 2.5, deckY, R - 2.5),
      // West Ring Road (South -> North)
      new THREE.Vector3(-R,      deckY, R - cr),
      new THREE.Vector3(-R,      deckY, 0),
      new THREE.Vector3(-R,      deckY, -R + cr),
      // NW Corner
      new THREE.Vector3(-R + 2.5, deckY, -R + 2.5)
    ];

    const metroCurve = new THREE.CatmullRomCurve3(pts, true, "centripetal", 0.25);
    const totalLen = metroCurve.getLength();

    // 1. SEAMLESS GAP-FREE DOUBLE-TRACK VIADUCT (Width 5.8 = 2 Opposite Tracks + Center Cyan Divider!)
    const segLen = 5.2;
    const segCount = Math.max(120, Math.ceil(totalLen / (segLen * 0.86))); // 14% overlap = ZERO gaps!
    const trackGeo = this._boxGeo(5.8, 0.58, segLen);
    const railGeo = this._boxGeo(0.24, 0.24, segLen);
    const midGeo = this._boxGeo(0.26, 0.28, segLen);

    const trackInst = new THREE.InstancedMesh(trackGeo, this.mat.concrete, segCount);
    const railLInst = new THREE.InstancedMesh(railGeo, this.mat.cinemaNeonCyan, segCount);
    const railRInst = new THREE.InstancedMesh(railGeo, this.mat.cinemaNeonCyan, segCount);
    const midInst = new THREE.InstancedMesh(midGeo, this.mat.mansionGoldTrim, segCount);

    const pillarSpacing = 22;
    const pillarCount = Math.max(24, Math.floor(totalLen / pillarSpacing));
    const pillarInst = new THREE.InstancedMesh(this._boxGeo(1.25, deckY - 0.3, 1.25), this.mat.plinthGrey, pillarCount);
    const capInst = new THREE.InstancedMesh(this._boxGeo(5.9, 0.58, 1.8), this.mat.wallWhite, pillarCount);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < segCount; i++) {
      const u = i / segCount;
      const p = metroCurve.getPointAt(u);
      const tang = metroCurve.getTangentAt(u).normalize();
      const yaw = Math.atan2(tang.x, tang.z);
      const sideX = Math.cos(yaw) * 2.82;
      const sideZ = -Math.sin(yaw) * 2.82;

      dummy.position.set(p.x, p.y - 0.32, p.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      trackInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x + sideX, p.y + 0.08, p.z + sideZ);
      dummy.updateMatrix();
      railLInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x - sideX, p.y + 0.08, p.z - sideZ);
      dummy.updateMatrix();
      railRInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x, p.y + 0.06, p.z);
      dummy.updateMatrix();
      midInst.setMatrixAt(i, dummy.matrix);
    }
    trackInst.instanceMatrix.needsUpdate = true;
    railLInst.instanceMatrix.needsUpdate = true;
    railRInst.instanceMatrix.needsUpdate = true;
    midInst.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < pillarCount; i++) {
      const u = (i + 0.5) / pillarCount;
      const p = metroCurve.getPointAt(u);
      const tang = metroCurve.getTangentAt(u).normalize();
      const yaw = Math.atan2(tang.x, tang.z);

      dummy.position.set(p.x, (deckY - 0.3) / 2, p.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      pillarInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x, deckY - 0.72, p.z);
      dummy.updateMatrix();
      capInst.setMatrixAt(i, dummy.matrix);
    }
    pillarInst.instanceMatrix.needsUpdate = true;
    capInst.instanceMatrix.needsUpdate = true;
    metroGrp.add(trackInst, railLInst, railRInst, midInst, pillarInst, capInst);

    // 2. 6 Elevated Metro Stations placed STRICTLY on the Ring Road Median (ZERO steps inside houses!)
    const stationDefs = [
      { id: "metro_temple",  name: "🛕 Temple & Railway Metro", sub: "NORTH RING RD • RAILWAY JN",   u: 0.125 },
      { id: "metro_airport", name: "✈️ Airport Metro",          sub: "EAST RING RD • 20-ACRE AIRPORT", u: 0.375 },
      { id: "metro_stadium", name: "🏏 Stadium Metro",          sub: "SOUTH-EAST • CRICKET STADIUM",  u: 0.545 },
      { id: "metro_center",  name: "🦁 City Gate Metro",        sub: "SOUTH RING RD • WELCOME ARCH",  u: 0.625 },
      { id: "metro_rocket",  name: "🚀 ISRO Spaceport Metro",   sub: "SOUTH-WEST • ROCKET LAUNCHPAD", u: 0.705 },
      { id: "metro_beach",   name: "🏖️ Golden Beach Metro",     sub: "WEST RING RD • BEACH & WHEEL",  u: 0.875 }
    ];

    const stationStops = [];
    stationDefs.forEach((stInfo) => {
      const p = metroCurve.getPointAt(stInfo.u);
      const tang = metroCurve.getTangentAt(stInfo.u).normalize();
      const yaw = Math.atan2(tang.x, tang.z);

      const sGrp = new THREE.Group();
      sGrp.position.set(p.x, deckY, p.z);
      sGrp.rotation.y = yaw;

      // Twin Elevated Side Platforms overhanging the 12-unit wide Ring Road (clear of all houses!)
      [-4.1, 4.1].forEach((px) => {
        const plat = new THREE.Mesh(this._boxGeo(2.3, 0.55, 14.2), this.mat.marble);
        plat.position.set(px, -0.08, 0);
        const safetyLine = new THREE.Mesh(this._boxGeo(0.22, 0.58, 14.0), this.mat.petrolYellow);
        safetyLine.position.set(px + (px > 0 ? -1.0 : 1.0), -0.06, 0);
        sGrp.add(plat, safetyLine);
      });

      const canopy = new THREE.Mesh(this._boxGeo(11.0, 0.42, 15.0), this.mat.glass);
      canopy.position.set(0, 4.2, 0);
      const cyanTrimL = new THREE.Mesh(this._boxGeo(0.28, 0.35, 15.2), this.mat.cinemaNeonCyan);
      cyanTrimL.position.set(-5.45, 4.2, 0);
      const cyanTrimR = cyanTrimL.clone();
      cyanTrimR.position.x = 5.45;

      // Center Median Glass Lift & Escalator Core — stands at local X = 0 (EXACT middle of the 12-unit Ring Road!)
      const liftShaft = new THREE.Mesh(this._boxGeo(1.85, deckY, 2.8), this.mat.glass);
      liftShaft.position.set(0, -deckY / 2, 0);
      const liftFrame = new THREE.Mesh(this._boxGeo(2.05, 0.4, 3.0), this.mat.cinemaNeonCyan);
      liftFrame.position.set(0, -deckY + 0.25, 0);

      const mBoard = this._makeBuildingBoard(stInfo.name.replace(/^[^\s]+\s/, "").toUpperCase(), "SHERU BHAI METRO • DOUBLE TRACK", "#0c4a6e", "#38bdf8", 9.6, 1.6);
      mBoard.position.set(0, 5.25, 0);

      const sign = this._createNameSign(stInfo.name, stInfo.sub, false);
      sign.position.set(0, 8.4, 0);
      sGrp.add(canopy, cyanTrimL, cyanTrimR, liftShaft, liftFrame, mBoard, sign);
      metroGrp.add(sGrp);

      stationStops.push({
        id: stInfo.id,
        name: stInfo.name,
        sub: stInfo.sub,
        x: p.x,
        y: deckY,
        z: p.z,
        u: stInfo.u
      });
    });

    // 3. DOUBLE OPPOSITE HIGH-SPEED METRO TRAINS (2 Clockwise on Outer Track + 2 Counter-Clockwise on Inner Track!)
    const makeMetroCar = (isFront, accentMat) => {
      const car = new THREE.Group();
      const body = new THREE.Mesh(this._boxGeo(2.25, 2.2, 5.5), this.mat.wallWhite);
      body.position.y = 1.42;
      const stripe = new THREE.Mesh(this._boxGeo(2.3, 0.42, 5.55), accentMat);
      stripe.position.y = 0.88;
      const roof = new THREE.Mesh(this._boxGeo(2.05, 0.22, 5.3), this.mat.inorbitNavy);
      roof.position.y = 2.6;
      const winL = new THREE.Mesh(this._boxGeo(2.32, 0.9, 4.5), this.mat.darkGlass);
      winL.position.y = 1.7;
      car.add(body, stripe, roof, winL);
      if (isFront) {
        const hl = new THREE.Mesh(this._boxGeo(1.75, 0.24, 0.14), this.mat.mansionWarmGlow);
        hl.position.set(0, 0.92, 2.8);
        car.add(hl);
      }
      return car;
    };

    const trains = [];
    const trainConfigs = [
      { u: 0.00, dir:  1, laneOffset:  1.45, speed: 0.048, accent: this.mat.cinemaNeonCyan },
      { u: 0.50, dir:  1, laneOffset:  1.45, speed: 0.048, accent: this.mat.cinemaNeonCyan },
      { u: 0.25, dir: -1, laneOffset: -1.45, speed: 0.048, accent: this.mat.cinemaNeonPink },
      { u: 0.75, dir: -1, laneOffset: -1.45, speed: 0.048, accent: this.mat.cinemaNeonPink }
    ];

    trainConfigs.forEach((cfg) => {
      const cars = [];
      for (let c = 0; c < 4; c++) {
        const cm = makeMetroCar(c === 0 || c === 3, cfg.accent);
        metroGrp.add(cm);
        cars.push(cm);
      }
      trains.push({
        u: cfg.u,
        dir: cfg.dir,
        laneOffset: cfg.laneOffset,
        speed: cfg.speed,
        pauseTimer: 0,
        lastStopIdx: -1,
        cars
      });
    });

    this.cityGroup.add(metroGrp);
    this.metroSim = {
      group: metroGrp,
      curve: metroCurve,
      stations: stationStops,
      trains,
      deckY
    };
  },

  getMetroStations() {
    return this.metroSim ? this.metroSim.stations : [];
  },

  flyToMetroStation(stationId) {
    if (!this.metroSim) return;
    const st = this.metroSim.stations.find((s) => s.id === stationId);
    if (!st) return;
    this.stopAllReelModes();
    this.cameraGoal = {
      target: new THREE.Vector3(st.x, st.y * 0.65, st.z),
      camPos: new THREE.Vector3(st.x + 28, st.y + 18, st.z + 28),
      speed: 0.1
    };
  },

  // =========================================================
  // 🛡️ SOLID BUILDING COLLISION CHECKER (Car NEVER drives through houses/landmarks!)
  // =========================================================
  _isBlockedByBuilding(nx, nz, radius = 1.65) {
    // 1. Central ST Junction Statue Pedestal
    if (Math.hypot(nx, nz) < 6.4 + radius) return true;

    // 2. Check all built city plots & landmarks
    for (const [pid, grp] of this.plotMeshes.entries()) {
      if (!grp || !grp.visible) continue;
      const pdata = this.plotDataMap.get(pid);
      if (!pdata || pdata.status !== "built" || pdata.buildingType === "empty") continue;

      const sz = pdata.size || 1;
      const halfX = sz === 8 ? 16.4 : (sz === 4 || sz === 2) ? 7.1 : 3.35;
      const halfZ = (sz === 8 || sz === 4) ? 7.1 : 3.35;
      const bx = grp.position.x;
      const bz = grp.position.z;

      if (Math.abs(nx - bx) < (halfX + radius) && Math.abs(nz - bz) < (halfZ + radius)) {
        return true;
      }
    }
    return false;
  },

  // =========================================================
  // 🎵 AUTOMATIC VILLA SONG PLAYER (`./villa-song.mp3` — Upload to GitHub!)
  // =========================================================
  _updateVillaProximitySong(px, pz) {
    // Check if user is inside/near Sheru Bhai Royal Island Mansion OR any Billionaire Villa!
    let nearVilla = false;

    // 1. Sheru Bhai Royal Island Mansion (West Ocean VIP Island)
    if (this.vipIslandPos) {
      const dIsl = Math.hypot(px - this.vipIslandPos.x, pz - this.vipIslandPos.z);
      if (dIsl < 34) nearVilla = true;
    }

    // 2. Any 8-Plot Ultra-Premium Billionaire Villa in the city
    if (!nearVilla) {
      for (const [pid, pdata] of this.plotDataMap.entries()) {
        if (pdata && pdata.status === "built" && pdata.buildingType === "billionaire_villa") {
          const grp = this.plotMeshes.get(pid);
          if (grp && Math.hypot(px - grp.position.x, pz - grp.position.z) < 24) {
            nearVilla = true;
            break;
          }
        }
      }
    }

    if (!this._villaAudio) {
      const audio = new Audio("./villa-song.mp3");
      audio.loop = true;
      audio.volume = 0.0;
      audio.preload = "none";
      audio.addEventListener("error", () => { this._villaAudioMissing = true; });
      this._villaAudio = audio;
    }

    if (this._villaAudioMissing) return;

    if (nearVilla) {
      if (this._villaAudio.paused) {
        this._villaAudio.play().catch(() => {});
      }
      this._villaAudio.volume = Math.min(0.85, this._villaAudio.volume + 0.04);
      this._inVillaZone = true;
    } else if (this._inVillaZone || !this._villaAudio.paused) {
      this._villaAudio.volume = Math.max(0.0, this._villaAudio.volume - 0.04);
      if (this._villaAudio.volume <= 0.01) {
        this._villaAudio.pause();
        this._inVillaZone = false;
      }
    }
  },

  // =========================================================
  // 🦁🚗 PART 2: PLAYABLE SHERU BHAI (CAR DRIVE + FREE ROAM + METRO RIDE!)
  // =========================================================
  _initPlayerRoamAssets() {
    if (this.playerRoam && this.playerRoam.root) return;

    const root = new THREE.Group();
    root.visible = false;

    const actor = new THREE.Group();
    const fallbackSheru = this._makeLiveSheruBhai(1.08, false);
    actor.add(fallbackSheru);

    const car = new THREE.Group();
    const cBody = new THREE.Mesh(this._boxGeo(2.35, 0.72, 4.85), this.mat.wallWhite);
    cBody.position.y = 0.65;
    const cGoldStripe = new THREE.Mesh(this._boxGeo(0.58, 0.75, 4.9), this.mat.mansionGoldTrim);
    cGoldStripe.position.y = 0.66;
    const cCabin = new THREE.Mesh(this._boxGeo(1.92, 0.68, 2.35), this.mat.glass);
    cCabin.position.set(0, 1.32, -0.2);
    const cRoof = new THREE.Mesh(this._boxGeo(1.86, 0.14, 1.85), this.mat.mansionBlackMarble);
    cRoof.position.set(0, 1.68, -0.25);
    const cSpoiler = new THREE.Mesh(this._boxGeo(2.25, 0.14, 0.45), this.mat.mansionGoldTrim);
    cSpoiler.position.set(0, 1.24, -2.28);
    const cUnderglow = new THREE.Mesh(this._boxGeo(2.15, 0.08, 4.4), this.mat.cinemaNeonCyan);
    cUnderglow.position.y = 0.16;
    const cHeadL = new THREE.Mesh(this._boxGeo(0.45, 0.2, 0.12), this.mat.mansionWarmGlow);
    cHeadL.position.set(-0.78, 0.72, 2.45);
    const cHeadR = cHeadL.clone();
    cHeadR.position.x = 0.78;
    const cTail = new THREE.Mesh(this._boxGeo(2.05, 0.16, 0.12), this.mat.oyoRed);
    cTail.position.set(0, 0.74, -2.45);

    const wGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.28, 12);
    wGeo.rotateZ(Math.PI / 2);
    [[-1.18, 1.48], [1.18, 1.48], [-1.18, -1.48], [1.18, -1.48]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wGeo, this.mat.wheelBlack);
      w.position.set(wx, 0.4, wz);
      car.add(w);
    });

    const driverSheru = this._makeLiveSheruBhai(0.68, true);
    driverSheru.position.set(-0.36, 0.62, -0.05);
    car.add(cBody, cGoldStripe, cCabin, cRoof, cSpoiler, cUnderglow, cHeadL, cHeadR, cTail, driverSheru);

    root.add(actor, car);
    this.scene.add(root);

    // Spawn cleanly on the wide central road just south of the Statue!
    const spawnZ = this.BLOCK_STEP * 0.5;
    this.playerRoam = {
      active: false,
      mode: "car",
      root,
      actor,
      car,
      driverSheru,
      pos: new THREE.Vector3(0, 0.12, spawnZ),
      yaw: 0,
      speed: 0,
      carPos: new THREE.Vector3(0, 0.12, spawnZ),
      carYaw: 0,
      input: { x: 0, y: 0, boost: false },
      mixer: null,
      actions: {},
      activeAnim: null,
      metroTrainIdx: 0,
      onStateChange: null
    };

    this._attachAnimatedPlayerSheru();
  },

  async _attachAnimatedPlayerSheru() {
    if (!this.playerRoam || !this.playerRoam.actor) return;
    const url = this.getSheruGlbUrl();
    try {
      if (!this._gltfLoader) {
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        this._gltfLoader = new GLTFLoader();
      }
      let cached = this.glbCache.get(url);
      if (!cached) {
        let pending = this._glbPending.get(url);
        if (!pending) {
          pending = this._gltfLoader.loadAsync(url).then((gltf) => {
            const entry = { scene: gltf.scene, animations: gltf.animations || [] };
            this.glbCache.set(url, entry);
            this._glbPending.delete(url);
            return entry;
          });
          this._glbPending.set(url, pending);
        }
        cached = await pending;
      }

      const model = cached.scene.clone(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const scale = 2.25 / (Math.max(size.x, size.y, size.z) || 1);
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

      const actor = this.playerRoam.actor;
      actor.children.forEach((ch) => { ch.visible = false; });
      actor.add(model);

      if (cached.animations && cached.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const actions = {};
        cached.animations.forEach((clip) => {
          actions[clip.name] = mixer.clipAction(clip);
        });
        this.playerRoam.mixer = mixer;
        this.playerRoam.actions = actions;
        this._setPlayerRoamAnim("Idle");
      }
    } catch (err) {
      console.warn("Playable Sheru GLB fallback active:", err);
    }
  },

  _setPlayerRoamAnim(name) {
    const pr = this.playerRoam;
    if (!pr || !pr.actions || !pr.actions[name]) return;
    if (pr.activeAnim === name) return;
    if (pr.activeAnim && pr.actions[pr.activeAnim]) {
      pr.actions[pr.activeAnim].fadeOut(0.18);
    }
    pr.actions[name].reset().fadeIn(0.18).play();
    pr.activeAnim = name;
  },

  startSheruRoamMode(startInCar = true, onStateChange = null) {
    this.stopAllReelModes();
    this._initPlayerRoamAssets();
    const pr = this.playerRoam;
    const spawnZ = this.BLOCK_STEP * 0.5;
    pr.active = true;
    pr.onStateChange = onStateChange;
    pr.root.visible = true;
    pr.mode = startInCar ? "car" : "foot";
    pr.pos.set(0, 0.12, spawnZ);
    pr.yaw = 0;
    pr.speed = 0;
    pr.carPos.set(0, 0.12, spawnZ);
    pr.carYaw = 0;
    pr.car.position.copy(pr.carPos);
    pr.car.rotation.y = pr.carYaw;
    pr.actor.visible = !startInCar;
    pr.driverSheru.visible = startInCar;
    if (pr.onStateChange) pr.onStateChange(pr.mode, 0);
  },

  exitSheruRoamMode() {
    if (!this.playerRoam) return;
    this.playerRoam.active = false;
    this.playerRoam.root.visible = false;
    this.playerRoam.input = { x: 0, y: 0, boost: false };
    if (this._villaAudio && !this._villaAudio.paused) this._villaAudio.pause();
    if (this.playerRoam.onStateChange) this.playerRoam.onStateChange("off", 0);
  },

  setSheruRoamInput(x, y, boost = null) {
    if (!this.playerRoam) return;
    this.playerRoam.input.x = x;
    this.playerRoam.input.y = y;
    if (boost !== null) this.playerRoam.input.boost = boost;
  },

  toggleSheruCarMode() {
    const pr = this.playerRoam;
    if (!pr || !pr.active) return;

    if (pr.mode === "metro") {
      pr.mode = "foot";
      pr.pos.y = 0.12;
      pr.actor.visible = true;
      pr.driverSheru.visible = false;
      if (pr.onStateChange) pr.onStateChange("foot", 0);
      return "🚶 Stepped off Metro! Exploring city on foot.";
    }

    if (pr.mode === "car") {
      pr.mode = "foot";
      pr.speed = 0;
      const sideX = Math.cos(pr.carYaw) * 2.4;
      const sideZ = -Math.sin(pr.carYaw) * 2.4;
      pr.pos.set(pr.carPos.x + sideX, 0.12, pr.carPos.z + sideZ);
      pr.yaw = pr.carYaw;
      pr.actor.position.copy(pr.pos);
      pr.actor.rotation.y = pr.yaw;
      pr.actor.visible = true;
      pr.driverSheru.visible = false;
      this._setPlayerRoamAnim("Idle");
      if (pr.onStateChange) pr.onStateChange("foot", 0);
      return "🚶 Car dhigaru! Walk freely around the entire city!";
    } else {
      const dist = pr.pos.distanceTo(pr.carPos);
      if (dist > 14) {
        pr.carPos.set(pr.pos.x, 0.12, pr.pos.z);
        pr.carYaw = pr.yaw;
        pr.car.position.copy(pr.carPos);
        pr.car.rotation.y = pr.carYaw;
      }
      pr.mode = "car";
      pr.pos.copy(pr.carPos);
      pr.yaw = pr.carYaw;
      pr.speed = 0;
      pr.actor.visible = false;
      pr.driverSheru.visible = true;
      if (pr.onStateChange) pr.onStateChange("car", 0);
      return "🚗 Entered VIP Car! Drive anywhere in Sheru Bhai City!";
    }
  },

  summonSheruCar() {
    const pr = this.playerRoam;
    if (!pr || !pr.active) return;
    if (pr.mode === "metro") pr.mode = "foot";
    const fwdX = Math.sin(pr.yaw) * 4.0;
    const fwdZ = Math.cos(pr.yaw) * 4.0;
    pr.carPos.set(pr.pos.x + fwdX, 0.12, pr.pos.z + fwdZ);
    pr.carYaw = pr.yaw;
    pr.car.position.copy(pr.carPos);
    pr.car.rotation.y = pr.carYaw;
    pr.actor.visible = true;
    pr.driverSheru.visible = false;
    if (pr.onStateChange) pr.onStateChange("foot", 0);
  },

  boardMetroTrain() {
    const pr = this.playerRoam;
    if (!this.metroSim) return;
    if (!pr || !pr.active) this.startSheruRoamMode(false);
    this.playerRoam.mode = "metro";
    this.playerRoam.actor.visible = false;
    this.playerRoam.driverSheru.visible = false;
    if (this.playerRoam.onStateChange) this.playerRoam.onStateChange("metro", 140);
  },

  teleportSheruToStation(stationId) {
    if (!this.metroSim) return;
    const st = this.metroSim.stations.find((s) => s.id === stationId);
    if (!st) return;
    if (this.playerRoam && this.playerRoam.active) {
      const pr = this.playerRoam;
      pr.pos.set(st.x + 3.5, 0.12, st.z + 3.5);
      if (pr.mode === "car") {
        pr.carPos.copy(pr.pos);
        pr.car.position.copy(pr.carPos);
      } else {
        pr.mode = "foot";
        pr.actor.position.copy(pr.pos);
        pr.actor.visible = true;
      }
      if (pr.onStateChange) pr.onStateChange(pr.mode, 0);
    } else {
      this.flyToMetroStation(stationId);
    }
  }
};
