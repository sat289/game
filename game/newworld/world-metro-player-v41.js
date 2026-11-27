import * as THREE from "three";

/**
 * 🚇🦁 SHERU BHAI CITY — v43 REAL COMBINED-COACH METRO (INNER CITY + OUTER RING),
 * COVERED DROPPING STEPS, SOLID WALK/CAR COLLISION, SMALLER DRIVE-MODE NAMES & AUTO VILLA SONG
 */
export const v41MetroPlayerMethods = {
  // =========================================================
  // 🚇 PART 1: AUTO-EXPANDING INNER-CITY + OUTER-RING DOUBLE-TRACK METRO
  // =========================================================
  _buildMetroSystem(ringRadius) {
    const metroGrp = new THREE.Group();
    const deckY = 13.8; // Elevated high above all roads, autos & streetlights
    const R = ringRadius; // Auto-expands whenever new houses expand currentGridRadius!
    const cr = 10.0;

    // --- LINE 1: OUTER RING DOUBLE-TRACK LOOP (along ±ringRadius) ---
    const ringPts = [
      new THREE.Vector3(-R + cr, deckY, -R),
      new THREE.Vector3(0,       deckY, -R),
      new THREE.Vector3(R - cr,  deckY, -R),
      new THREE.Vector3(R - 2.5, deckY, -R + 2.5),
      new THREE.Vector3(R,       deckY, -R + cr),
      new THREE.Vector3(R,       deckY, 0),
      new THREE.Vector3(R,       deckY, R - cr),
      new THREE.Vector3(R - 2.5, deckY, R - 2.5),
      new THREE.Vector3(R - cr,  deckY, R),
      new THREE.Vector3(0,       deckY, R),
      new THREE.Vector3(-R + cr, deckY, R),
      new THREE.Vector3(-R + 2.5, deckY, R - 2.5),
      new THREE.Vector3(-R,      deckY, R - cr),
      new THREE.Vector3(-R,      deckY, 0),
      new THREE.Vector3(-R,      deckY, -R + cr),
      new THREE.Vector3(-R + 2.5, deckY, -R + 2.5)
    ];
    const ringCurve = new THREE.CatmullRomCurve3(ringPts, true, "centripetal", 0.25);

    // --- LINE 2: INNER-CITY CENTRAL CORRIDOR LOOP (Travels RIGHT THROUGH THE CITY along wide central avenues!) ---
    const innerZ = this.BLOCK_STEP * 0.5; // Exact centerline of the 10.2-unit wide central city road!
    const innerSpan = Math.max(this.BLOCK_STEP * 1.5, R - 14);
    const cityDeckY = 15.8; // Passes cleanly over the Outer Ring at interchange points (just like Pune Metro!)
    const innerPts = [
      new THREE.Vector3(-innerSpan, cityDeckY,  innerZ),
      new THREE.Vector3(0,          cityDeckY,  innerZ),
      new THREE.Vector3( innerSpan, cityDeckY,  innerZ),
      new THREE.Vector3( innerSpan + 4, cityDeckY, 0),
      new THREE.Vector3( innerSpan, cityDeckY, -innerZ),
      new THREE.Vector3(0,          cityDeckY, -innerZ),
      new THREE.Vector3(-innerSpan, cityDeckY, -innerZ),
      new THREE.Vector3(-innerSpan - 4, cityDeckY, 0)
    ];
    const innerCurve = new THREE.CatmullRomCurve3(innerPts, true, "centripetal", 0.2);

    // Helper: Build seamless gap-free double-track viaduct + centered pillars for any curve
    const buildViaduct = (curve, yHeight, railMat, pillarStep) => {
      const len = curve.getLength();
      const segLen = 5.2;
      const segCount = Math.max(80, Math.ceil(len / (segLen * 0.85)));
      const trackInst = new THREE.InstancedMesh(this._boxGeo(5.6, 0.58, segLen), this.mat.concrete, segCount);
      const railLInst = new THREE.InstancedMesh(this._boxGeo(0.22, 0.24, segLen), railMat, segCount);
      const railRInst = new THREE.InstancedMesh(this._boxGeo(0.22, 0.24, segLen), railMat, segCount);
      const midInst   = new THREE.InstancedMesh(this._boxGeo(0.24, 0.26, segLen), this.mat.mansionGoldTrim, segCount);

      const pCount = Math.max(16, Math.floor(len / pillarStep));
      const pInst   = new THREE.InstancedMesh(this._boxGeo(1.2, yHeight - 0.3, 1.2), this.mat.plinthGrey, pCount);
      const capInst = new THREE.InstancedMesh(this._boxGeo(5.7, 0.56, 1.8), this.mat.wallWhite, pCount);
      const dummy = new THREE.Object3D();

      for (let i = 0; i < segCount; i++) {
        const u = i / segCount;
        const p = curve.getPointAt(u);
        const tang = curve.getTangentAt(u).normalize();
        const yaw = Math.atan2(tang.x, tang.z);
        const sx = Math.cos(yaw) * 2.72;
        const sz = -Math.sin(yaw) * 2.72;

        dummy.position.set(p.x, p.y - 0.32, p.z);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        trackInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x + sx, p.y + 0.08, p.z + sz);
        dummy.updateMatrix();
        railLInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x - sx, p.y + 0.08, p.z - sz);
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

      for (let i = 0; i < pCount; i++) {
        const u = (i + 0.5) / pCount;
        const p = curve.getPointAt(u);
        const tang = curve.getTangentAt(u).normalize();
        const yaw = Math.atan2(tang.x, tang.z);

        dummy.position.set(p.x, (yHeight - 0.3) / 2, p.z);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        pInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x, yHeight - 0.72, p.z);
        dummy.updateMatrix();
        capInst.setMatrixAt(i, dummy.matrix);
      }
      pInst.instanceMatrix.needsUpdate = true;
      capInst.instanceMatrix.needsUpdate = true;
      metroGrp.add(trackInst, railLInst, railRInst, midInst, pInst, capInst);
      return len;
    };

    const ringLen = buildViaduct(ringCurve, deckY, this.mat.cinemaNeonCyan, 24);
    const innerLen = buildViaduct(innerCurve, cityDeckY, this.mat.mansionGoldTrim, 22);

    // Helper: Build Realistic HITEC-City / Pune-Metro Style Station WITH Covered Dropping Steps parallel to road!
    const stationStops = [];
    const addStation = (curve, yHeight, stInfo) => {
      const p = curve.getPointAt(stInfo.u);
      const tang = curve.getTangentAt(stInfo.u).normalize();
      const yaw = Math.atan2(tang.x, tang.z);

      const sGrp = new THREE.Group();
      sGrp.position.set(p.x, yHeight, p.z);
      sGrp.rotation.y = yaw;

      // 1. Concourse Level (Mid-floor straddling the wide road so cars/autos pass underneath!)
      const concourse = new THREE.Mesh(this._boxGeo(10.2, 0.48, 15.0), this.mat.mansionCreamMarble);
      concourse.position.set(0, -4.6, 0);
      // 4 Portal Columns straddling the wide road edges
      [[-4.6, -6.5], [4.6, -6.5], [-4.6, 6.5], [4.6, 6.5]].forEach(([px, pz]) => {
        const col = new THREE.Mesh(this._boxGeo(0.72, yHeight - 0.4, 0.72), this.mat.plinthGrey);
        col.position.set(px, -yHeight / 2, pz);
        sGrp.add(col);
      });

      // 2. Twin Elevated Platforms + Curved Glass & Blue Steel Roof Canopy
      [-3.95, 3.95].forEach((px) => {
        const plat = new THREE.Mesh(this._boxGeo(2.2, 0.52, 15.2), this.mat.marble);
        plat.position.set(px, -0.08, 0);
        const safetyLine = new THREE.Mesh(this._boxGeo(0.22, 0.56, 15.0), this.mat.petrolYellow);
        safetyLine.position.set(px + (px > 0 ? -0.95 : 0.95), -0.05, 0);
        sGrp.add(plat, safetyLine);
      });

      const canopy = new THREE.Mesh(this._boxGeo(10.8, 0.4, 15.8), this.mat.glass);
      canopy.position.set(0, 4.25, 0);
      const blueEdgeL = new THREE.Mesh(this._boxGeo(0.32, 0.42, 16.0), this.mat.mobileBlue);
      blueEdgeL.position.set(-5.35, 4.25, 0);
      const blueEdgeR = blueEdgeL.clone();
      blueEdgeR.position.x = 5.35;

      // 3. COVERED BLUE DROPPING STEPS / ESCALATOR RAMPS (Running parallel along the road curb — ZERO houses touched!)
      const buildDroppingStair = (zDir) => {
        const stairGrp = new THREE.Group();
        const dropH = yHeight - 4.6;
        const runLen = 9.2;
        const slope = Math.atan2(dropH, runLen);
        const hyp = Math.hypot(dropH, runLen);

        // Angled Stair Ramp descending from Concourse (y = -4.6) to Street (y = -yHeight)
        const ramp = new THREE.Mesh(this._boxGeo(1.75, 0.35, hyp), this.mat.marble);
        ramp.position.set(0, -4.6 - dropH / 2, zDir * (7.5 + runLen / 2));
        ramp.rotation.x = zDir * slope;

        // Covered Blue Skywalk Canopy over the Dropping Steps (matches Pune Metro reference!)
        const roof = new THREE.Mesh(this._boxGeo(1.95, 0.22, hyp + 0.4), this.mat.mobileBlue);
        roof.position.set(0, -4.6 - dropH / 2 + 2.1, zDir * (7.5 + runLen / 2));
        roof.rotation.x = zDir * slope;

        // Side Glass Railings
        [-0.85, 0.85].forEach((rx) => {
          const rail = new THREE.Mesh(this._boxGeo(0.1, 0.85, hyp), this.mat.glass);
          rail.position.set(rx, -4.6 - dropH / 2 + 0.55, zDir * (7.5 + runLen / 2));
          rail.rotation.x = zDir * slope;
          stairGrp.add(rail);
        });

        // Street-level Entry Portal Arch at bottom of steps
        const entryArch = new THREE.Mesh(this._boxGeo(2.2, 2.6, 0.4), this.mat.cinemaNeonCyan);
        entryArch.position.set(0, -yHeight + 1.3, zDir * (7.5 + runLen));
        stairGrp.add(ramp, roof, entryArch);
        return stairGrp;
      };

      const stairFront = buildDroppingStair(1);
      const stairBack = buildDroppingStair(-1);

      const mBoard = this._makeBuildingBoard(stInfo.name.replace(/^[^\s]+\s/, "").toUpperCase(), "SHERU BHAI METRO • INTERCHANGE", "#0c4a6e", "#38bdf8", 9.6, 1.55);
      mBoard.position.set(0, 5.25, 0);

      const sign = this._createNameSign(stInfo.name, stInfo.sub, false);
      sign.position.set(0, 8.4, 0);

      sGrp.add(concourse, canopy, blueEdgeL, blueEdgeR, stairFront, stairBack, mBoard, sign);
      metroGrp.add(sGrp);

      stationStops.push({
        id: stInfo.id,
        name: stInfo.name,
        sub: stInfo.sub,
        x: p.x,
        y: yHeight,
        z: p.z,
        yaw,
        u: stInfo.u,
        line: stInfo.line
      });
    };

    // 6 Outer Ring Stations + 2 Inner City Central Stations = 8 Total Metro Stations!
    const ringStations = [
      { id: "metro_temple",  name: "🛕 Temple & Railway Metro", sub: "NORTH RING RD • RAILWAY JN",   u: 0.125, line: "ring" },
      { id: "metro_airport", name: "✈️ Airport Metro",          sub: "EAST RING RD • 20-ACRE AIRPORT", u: 0.375, line: "ring" },
      { id: "metro_stadium", name: "🏏 Stadium Metro",          sub: "SOUTH-EAST • CRICKET STADIUM",  u: 0.545, line: "ring" },
      { id: "metro_gate",    name: "🦁 City Gate Metro",        sub: "SOUTH RING RD • WELCOME ARCH",  u: 0.625, line: "ring" },
      { id: "metro_rocket",  name: "🚀 ISRO Spaceport Metro",   sub: "SOUTH-WEST • ROCKET LAUNCHPAD", u: 0.705, line: "ring" },
      { id: "metro_beach",   name: "🏖️ Golden Beach Metro",     sub: "WEST RING RD • BEACH & WHEEL",  u: 0.875, line: "ring" }
    ];
    ringStations.forEach((s) => addStation(ringCurve, deckY, s));

    const innerStations = [
      { id: "metro_central_s", name: "🏙️ City Center South Metro", sub: "INNER CITY LINE • ST JUNCTION", u: 0.125, line: "inner" },
      { id: "metro_central_n", name: "🏙️ City Center North Metro", sub: "INNER CITY LINE • DOWNTOWN",    u: 0.625, line: "inner" }
    ];
    innerStations.forEach((s) => addStation(innerCurve, cityDeckY, s));

    // --- BUILD REAL COMBINED-COACH ARTICULATED METRO TRAINS (Zero Gaps + Dark Rubber Gangway Couplers!) ---
    const makeRealMetroCoach = (isHead, isTail, accentMat) => {
      const coach = new THREE.Group();
      // Main sleek aluminum-white coach body (length 5.6)
      const body = new THREE.Mesh(this._boxGeo(2.22, 2.22, 5.6), this.mat.wallWhite);
      body.position.y = 1.42;
      // Vibrant Metro Livery Stripe (Cyan / Pink / Purple / Orange)
      const stripe = new THREE.Mesh(this._boxGeo(2.28, 0.56, 5.62), accentMat);
      stripe.position.y = 0.92;
      // Dark tinted continuous passenger windows
      const winBand = new THREE.Mesh(this._boxGeo(2.27, 0.86, 4.95), this.mat.darkGlass);
      winBand.position.y = 1.75;
      // AC roof pod & metallic grey roof
      const roof = new THREE.Mesh(this._boxGeo(2.02, 0.22, 5.45), this.mat.inorbitNavy);
      roof.position.y = 2.62;
      const acPod = new THREE.Mesh(this._boxGeo(1.35, 0.18, 2.1), this.mat.plinthGrey);
      acPod.position.y = 2.78;
      coach.add(body, stripe, winBand, roof, acPod);

      // Sleek Aerodynamic Sloped Nose & LED Headlights on Head Coach
      if (isHead) {
        const nose = new THREE.Mesh(this._boxGeo(2.14, 1.85, 0.85), this.mat.wallWhite);
        nose.position.set(0, 1.3, 3.05);
        const windshield = new THREE.Mesh(this._boxGeo(1.92, 0.95, 0.25), this.mat.darkGlass);
        windshield.position.set(0, 1.78, 3.4);
        const hl = new THREE.Mesh(this._boxGeo(1.75, 0.24, 0.14), this.mat.mansionWarmGlow);
        hl.position.set(0, 0.86, 3.48);
        coach.add(nose, windshield, hl);
      }

      // Dark Flexible Articulated Gangway Coupler Bellows combining this coach seamlessly to the next coach!
      if (!isTail) {
        const coupler = new THREE.Mesh(this._boxGeo(1.96, 1.98, 0.65), this.mat.cinemaObsidian);
        coupler.position.set(0, 1.4, -3.0);
        coach.add(coupler);
      }
      return coach;
    };

    const trains = [];
    const spawnTrain = (curve, totalLen, line, u, dir, laneOffset, speed, accentMat) => {
      const cars = [];
      for (let c = 0; c < 4; c++) {
        const cm = makeRealMetroCoach(c === 0, c === 3, accentMat);
        metroGrp.add(cm);
        cars.push(cm);
      }
      trains.push({
        curve,
        line,
        carSpacingU: 5.95 / totalLen, // EXACT arc-length spacing so all 4 coaches combine tightly with couplers!
        u,
        dir,
        laneOffset,
        speed,
        pauseTimer: 0,
        lastStopIdx: -1,
        cars
      });
    };

    // Outer Ring Line: 2 Cyan Clockwise + 2 Pink Counter-Clockwise High-Speed Trains
    spawnTrain(ringCurve, ringLen, "ring", 0.00,  1,  1.4, 0.046, this.mat.cinemaNeonCyan);
    spawnTrain(ringCurve, ringLen, "ring", 0.50,  1,  1.4, 0.046, this.mat.cinemaNeonCyan);
    spawnTrain(ringCurve, ringLen, "ring", 0.25, -1, -1.4, 0.046, this.mat.cinemaNeonPink);
    spawnTrain(ringCurve, ringLen, "ring", 0.75, -1, -1.4, 0.046, this.mat.cinemaNeonPink);

    // Inner City Line: 1 Orange Clockwise + 1 Gold Counter-Clockwise High-Speed Trains right through downtown!
    spawnTrain(innerCurve, innerLen, "inner", 0.05,  1,  1.4, 0.068, this.mat.biryaniOrange);
    spawnTrain(innerCurve, innerLen, "inner", 0.55, -1, -1.4, 0.068, this.mat.mansionGoldTrim);

    this.cityGroup.add(metroGrp);
    this.metroSim = {
      group: metroGrp,
      curve: ringCurve,
      innerCurve,
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
  // 🛡️ SOLID BUILDING COLLISION CHECKER (BOTH Car AND Walking Sheru Bhai NEVER go inside buildings!)
  // =========================================================
  _isBlockedByBuilding(nx, nz, radius = 1.65) {
    if (Math.hypot(nx, nz) < 6.4 + radius) return true;

    for (const [pid, grp] of this.plotMeshes.entries()) {
      if (!grp || !grp.visible) continue;
      const pdata = this.plotDataMap.get(pid);
      if (!pdata || pdata.status !== "built" || pdata.buildingType === "empty") continue;

      const sz = pdata.size || 1;
      const halfX = sz === 8 ? 16.4 : (sz === 4 || sz === 2) ? 7.1 : 3.45;
      const halfZ = (sz === 8 || sz === 4) ? 7.1 : 3.45;
      const bx = grp.position.x;
      const bz = grp.position.z;

      if (Math.abs(nx - bx) < (halfX + radius) && Math.abs(nz - bz) < (halfZ + radius)) {
        return true;
      }
    }
    return false;
  },

  // =========================================================
  // 🏷️ DECREASE NAMEPLATE SIZE WHEN IN DRIVING / PLAY MODE
  // =========================================================
  _setRoamNameScale(mult = 1.0) {
    if (!this.plotSigns) return;
    for (let i = 0; i < this.plotSigns.length; i++) {
      const sp = this.plotSigns[i].sprite;
      if (!sp) continue;
      if (!sp.userData._origScale) {
        sp.userData._origScale = { x: sp.scale.x, y: sp.scale.y, z: sp.scale.z };
      }
      const o = sp.userData._origScale;
      sp.scale.set(o.x * mult, o.y * mult, o.z * mult);
    }
  },

  // =========================================================
  // 🎵 AUTOMATIC VILLA SONG PLAYER (`./villa-song.mp3` — Upload to GitHub!)
  // =========================================================
  _updateVillaProximitySong(px, pz) {
    let nearVilla = false;
    if (this.vipIslandPos && Math.hypot(px - this.vipIslandPos.x, pz - this.vipIslandPos.z) < 34) {
      nearVilla = true;
    }
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
      if (this._villaAudio.paused) this._villaAudio.play().catch(() => {});
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
    // Shrink floating building names in Play/Driving Mode so the road view is super clean!
    this._setRoamNameScale(0.52);
    if (pr.onStateChange) pr.onStateChange(pr.mode, 0);
  },

  exitSheruRoamMode() {
    if (!this.playerRoam) return;
    this.playerRoam.active = false;
    this.playerRoam.root.visible = false;
    this.playerRoam.input = { x: 0, y: 0, boost: false };
    this._setRoamNameScale(1.0);
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
      const exitX = pr.carPos.x + sideX;
      const exitZ = pr.carPos.z + sideZ;
      if (!this._isBlockedByBuilding(exitX, exitZ, 0.8)) {
        pr.pos.set(exitX, 0.12, exitZ);
      } else {
        pr.pos.set(pr.carPos.x - sideX, 0.12, pr.carPos.z - sideZ);
      }
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
