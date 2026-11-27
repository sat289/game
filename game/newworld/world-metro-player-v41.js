import * as THREE from "three";

/**
 * 🚇🦁 SHERU BHAI CITY — v41 ELEVATED METRO NETWORK & PLAYABLE SHERU BHAI (CAR + FREE ROAM)
 * 1. 6 Elevated Glass-and-Cyan Metro Stations at every major city landmark + 2 Live 4-Car Metro Trains.
 * 2. Playable 3D Animated Sheru Bhai (`sheru-bhai-animated.glb`):
 *    - Walk / Sprint freely anywhere in the city ("car dhigi motham city thiragochu")
 *    - Enter / Exit personal VIP Sports Car ("car lo vellochu") with smooth mobile joystick + WASD driving!
 *    - Ride Live Elevated Metro Train or Fast-Travel between all 6 Metro Stations!
 */
export const v41MetroPlayerMethods = {
  // =========================================================
  // 🚇 PART 1: ELEVATED METRO RAIL NETWORK + 6 STATIONS
  // =========================================================
  _buildMetroSystem(ringRadius) {
    const metroGrp = new THREE.Group();
    const deckY = 13.4; // Safely above all roads, trees, and 1-2 story houses!

    const ax = this.airportX || (ringRadius + 58);
    const bx = this.beachX || -(ringRadius + 58);
    const st = this.outskirtsStadiumPos || { x: ringRadius + 38, z: ringRadius + 40 };
    const rk = this.rocketPadPos || { x: -(ringRadius + 38), z: ringRadius + 40 };

    // 6 Important City Metro Stations forming a grand elevated loop!
    const stations = [
      { id: "metro_center",  name: "🦁 ST Junction Metro",      sub: "SHERU BHAI STATUE • CITY CENTER", x: 0,           z: -15.5 },
      { id: "metro_temple",  name: "🛕 Temple & Railway Metro", sub: "HILLTOP TEMPLE • RAILWAY JN",     x: 18,          z: -(ringRadius + 6) },
      { id: "metro_airport", name: "✈️ Airport Metro",          sub: "20-ACRE INTL AIRPORT GATE",       x: ax - 24,     z: -4 },
      { id: "metro_stadium", name: "🏏 Stadium Metro",          sub: "INTERNATIONAL CRICKET STADIUM",   x: st.x - 16,   z: st.z - 22 },
      { id: "metro_rocket",  name: "🚀 ISRO Spaceport Metro",   sub: "LVM3 ROCKET LAUNCHPAD",           x: rk.x + 16,   z: rk.z - 22 },
      { id: "metro_beach",   name: "🏖️ Golden Beach Metro",     sub: "BEACH • 20-FLOOR OYO • WHEEL",    x: bx + 24,     z: -4 }
    ];

    const curvePts = stations.map((s) => new THREE.Vector3(s.x, deckY, s.z));
    const metroCurve = new THREE.CatmullRomCurve3(curvePts, true, "catmullrom", 0.35);

    // 1. Elevated Concrete Viaduct Track + Glowing Cyan LED Side Rails (Instanced for 60fps!)
    const segCount = 130;
    const trackGeo = this._boxGeo(3.2, 0.55, 6.2);
    const railGeo = this._boxGeo(0.22, 0.22, 6.2);
    const trackInst = new THREE.InstancedMesh(trackGeo, this.mat.concrete, segCount);
    const railLInst = new THREE.InstancedMesh(railGeo, this.mat.cinemaNeonCyan, segCount);
    const railRInst = new THREE.InstancedMesh(railGeo, this.mat.cinemaNeonCyan, segCount);

    const pillarCount = 36;
    const pillarInst = new THREE.InstancedMesh(this._boxGeo(1.15, deckY - 0.3, 1.15), this.mat.plinthGrey, pillarCount);
    const capInst = new THREE.InstancedMesh(this._boxGeo(3.4, 0.55, 1.5), this.mat.wallWhite, pillarCount);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < segCount; i++) {
      const u = i / segCount;
      const p = metroCurve.getPointAt(u);
      const tang = metroCurve.getTangentAt(u).normalize();
      const yaw = Math.atan2(tang.x, tang.z);
      const sideX = Math.cos(yaw) * 1.55;
      const sideZ = -Math.sin(yaw) * 1.55;

      dummy.position.set(p.x, p.y - 0.3, p.z);
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      trackInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x + sideX, p.y + 0.08, p.z + sideZ);
      dummy.updateMatrix();
      railLInst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x - sideX, p.y + 0.08, p.z - sideZ);
      dummy.updateMatrix();
      railRInst.setMatrixAt(i, dummy.matrix);
    }
    trackInst.instanceMatrix.needsUpdate = true;
    railLInst.instanceMatrix.needsUpdate = true;
    railRInst.instanceMatrix.needsUpdate = true;

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
    metroGrp.add(trackInst, railLInst, railRInst, pillarInst, capInst);

    // 2. Build Modern Elevated Glass-and-Cyan Metro Station at each of the 6 Hubs!
    const stationStops = [];
    stations.forEach((stInfo, idx) => {
      const uStop = idx / stations.length;
      const p = metroCurve.getPointAt(uStop);
      const tang = metroCurve.getTangentAt(uStop).normalize();
      const yaw = Math.atan2(tang.x, tang.z);

      const sGrp = new THREE.Group();
      sGrp.position.set(p.x, deckY, p.z);
      sGrp.rotation.y = yaw;

      // Twin Elevated Platforms + Curved Glass Roof Canopy + Glowing Cyan Arch!
      [-2.85, 2.85].forEach((px) => {
        const plat = new THREE.Mesh(this._boxGeo(2.4, 0.55, 13.5), this.mat.marble);
        plat.position.set(px, -0.1, 0);
        const safetyLine = new THREE.Mesh(this._boxGeo(0.22, 0.58, 13.4), this.mat.petrolYellow);
        safetyLine.position.set(px + (px > 0 ? -1.05 : 1.05), -0.08, 0);
        sGrp.add(plat, safetyLine);
      });

      const canopy = new THREE.Mesh(this._boxGeo(8.8, 0.42, 14.2), this.mat.glass);
      canopy.position.set(0, 4.1, 0);
      const cyanTrimL = new THREE.Mesh(this._boxGeo(0.28, 0.35, 14.4), this.mat.cinemaNeonCyan);
      cyanTrimL.position.set(-4.35, 4.1, 0);
      const cyanTrimR = cyanTrimL.clone();
      cyanTrimR.position.x = 4.35;

      // Ground Escalator Access Tower & Metro Signboard
      const liftShaft = new THREE.Mesh(this._boxGeo(2.6, deckY, 3.2), this.mat.glass);
      liftShaft.position.set(3.2, -deckY / 2, 0);
      const mBoard = this._makeBuildingBoard(stInfo.name.replace(/^[^\s]+\s/, "").toUpperCase(), "SHERU BHAI METRO • ELEVATED", "#0c4a6e", "#38bdf8", 8.6, 1.55);
      mBoard.position.set(0, 5.15, 0);

      // Floating Metro Station Label Sprite
      const sign = this._createNameSign(stInfo.name, stInfo.sub, false);
      sign.position.set(0, 8.2, 0);
      sGrp.add(canopy, cyanTrimL, cyanTrimR, liftShaft, mBoard, sign);
      metroGrp.add(sGrp);

      stationStops.push({
        id: stInfo.id,
        name: stInfo.name,
        sub: stInfo.sub,
        x: p.x,
        y: deckY,
        z: p.z,
        u: uStop
      });
    });

    // 3. Build 2 Sleek 4-Car Modern Elevated Metro Trains (Cyan/Silver/Blue Livery!)
    const makeMetroCar = (isFront) => {
      const car = new THREE.Group();
      const body = new THREE.Mesh(this._boxGeo(2.35, 2.25, 5.6), this.mat.wallWhite);
      body.position.y = 1.45;
      const stripe = new THREE.Mesh(this._boxGeo(2.4, 0.42, 5.65), this.mat.cinemaNeonCyan);
      stripe.position.y = 0.9;
      const roof = new THREE.Mesh(this._boxGeo(2.15, 0.22, 5.4), this.mat.inorbitNavy);
      roof.position.y = 2.65;
      const winL = new THREE.Mesh(this._boxGeo(2.42, 0.92, 4.6), this.mat.darkGlass);
      winL.position.y = 1.72;
      car.add(body, stripe, roof, winL);
      if (isFront) {
        const hl = new THREE.Mesh(this._boxGeo(1.8, 0.25, 0.14), this.mat.mansionWarmGlow);
        hl.position.set(0, 0.95, 2.85);
        car.add(hl);
      }
      return car;
    };

    const trains = [];
    for (let tIdx = 0; tIdx < 2; tIdx++) {
      const cars = [];
      for (let c = 0; c < 4; c++) {
        const cm = makeMetroCar(c === 0 || c === 3);
        metroGrp.add(cm);
        cars.push(cm);
      }
      trains.push({
        u: tIdx * 0.5,
        speed: 0.022,
        pauseTimer: 0,
        lastStopIdx: -1,
        cars
      });
    }

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
  // 🦁🚗 PART 2: PLAYABLE SHERU BHAI (CAR DRIVE + FREE ROAM + METRO RIDE!)
  // =========================================================
  _initPlayerRoamAssets() {
    if (this.playerRoam && this.playerRoam.root) return;

    const root = new THREE.Group();
    root.visible = false;

    // 1. Playable Sheru Bhai Character Container (Loads Animated `sheru-bhai-animated.glb`!)
    const actor = new THREE.Group();
    const fallbackSheru = this._makeLiveSheruBhai(1.08, false);
    actor.add(fallbackSheru);

    // 2. Sheru Bhai's Personal VIP Sports Car (Pearl-White & Gold Supercar with Cyan Underglow!)
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

    // Seated Sheru Bhai Driver inside Car Cabin (visible when driving!)
    const driverSheru = this._makeLiveSheruBhai(0.68, true);
    driverSheru.position.set(-0.36, 0.62, -0.05);
    car.add(cBody, cGoldStripe, cCabin, cRoof, cSpoiler, cUnderglow, cHeadL, cHeadR, cTail, driverSheru);

    root.add(actor, car);
    this.scene.add(root);

    this.playerRoam = {
      active: false,
      mode: "car", // "car" | "foot" | "metro"
      root,
      actor,
      car,
      driverSheru,
      pos: new THREE.Vector3(0, 0.12, 16),
      yaw: 0,
      speed: 0,
      carPos: new THREE.Vector3(0, 0.12, 16),
      carYaw: 0,
      input: { x: 0, y: 0, boost: false },
      mixer: null,
      actions: {},
      activeAnim: null,
      metroTrainIdx: 0,
      onStateChange: null
    };

    // Load Animated `sheru-bhai-animated.glb` onto playable actor!
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
    pr.active = true;
    pr.onStateChange = onStateChange;
    pr.root.visible = true;
    pr.mode = startInCar ? "car" : "foot";
    pr.pos.set(0, 0.12, 16);
    pr.yaw = 0;
    pr.speed = 0;
    pr.carPos.set(0, 0.12, 16);
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
    if (this.playerRoam.onStateChange) this.playerRoam.onStateChange("metro", 80);
  },

  teleportSheruToStation(stationId) {
    if (!this.metroSim) return;
    const st = this.metroSim.stations.find((s) => s.id === stationId);
    if (!st) return;
    if (this.playerRoam && this.playerRoam.active) {
      const pr = this.playerRoam;
      pr.pos.set(st.x + 5, 0.12, st.z + 5);
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
