import * as THREE from "three";

/**
 * 🚇🦁 SHERU BHAI CITY — v45 HYDERABAD METRO (AMEERPET STACKED INTERCHANGE + 4 CITY STATIONS),
 * TRUE 360° ROTATE & ZOOM IN/OUT PLAY CAMERA, SEA BRIDGE CROSSING TO VILLA & CAMERA-DRAG VILLA SONG!
 */
export const v41MetroPlayerMethods = {
  // =========================================================
  // 🚇 PART 1: HYDERABAD METRO NETWORK (AMEERPET STACKED TRACK-OVER-TRACK + ALL-DIRECTION CONNECTIONS!)
  // =========================================================
  _buildMetroSystem(ringRadius) {
    const metroGrp = new THREE.Group();
    const deckLowY = 13.6;   // Level 1: Outer Ring + East-West Blue Line
    const deckHighY = 19.6;  // Level 2: North-South Red Line STACKED directly over Blue Line (Ameerpet Style!)
    const R = ringRadius;    // Auto-expands whenever new follower houses expand the city!
    const cr = 10.0;
    const roadOffset = this.BLOCK_STEP * 0.5; // Exact centerline of the 10.2-unit wide central city roads!

    // --- 1. OUTER RING DOUBLE-TRACK LOOP (N, E, S, W Perimeter) ---
    const ringPts = [
      new THREE.Vector3(-R + cr, deckLowY, -R),
      new THREE.Vector3(0,       deckLowY, -R),
      new THREE.Vector3(R - cr,  deckLowY, -R),
      new THREE.Vector3(R - 2.5, deckLowY, -R + 2.5),
      new THREE.Vector3(R,       deckLowY, -R + cr),
      new THREE.Vector3(R,       deckLowY, 0),
      new THREE.Vector3(R,       deckLowY, R - cr),
      new THREE.Vector3(R - 2.5, deckLowY, R - 2.5),
      new THREE.Vector3(R - cr,  deckLowY, R),
      new THREE.Vector3(0,       deckLowY, R),
      new THREE.Vector3(-R + cr, deckLowY, R),
      new THREE.Vector3(-R + 2.5, deckLowY, R - 2.5),
      new THREE.Vector3(-R,      deckLowY, R - cr),
      new THREE.Vector3(-R,      deckLowY, 0),
      new THREE.Vector3(-R,      deckLowY, -R + cr),
      new THREE.Vector3(-R + 2.5, deckLowY, -R + 2.5)
    ];
    const ringCurve = new THREE.CatmullRomCurve3(ringPts, true, "centripetal", 0.25);

    // --- 2. EAST-WEST HYDERABAD BLUE LINE (West Ring <-> Ameerpet Interchange <-> East Ring at Y = 13.6) ---
    const ewCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-R,       deckLowY, roadOffset),
      new THREE.Vector3(-R * 0.5, deckLowY, roadOffset),
      new THREE.Vector3(roadOffset, deckLowY, roadOffset),
      new THREE.Vector3(R * 0.5,  deckLowY, roadOffset),
      new THREE.Vector3(R,        deckLowY, roadOffset)
    ], false, "centripetal", 0.08);

    // --- 3. NORTH-SOUTH HYDERABAD RED LINE (STACKED OVER BLUE LINE at Y = 19.6 through City Center, ramping to Ring at Y = 13.6!) ---
    const nsCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(roadOffset, deckLowY,  -R),
      new THREE.Vector3(roadOffset, deckHighY, -R * 0.58),
      new THREE.Vector3(roadOffset, deckHighY,  roadOffset), // Directly ABOVE Blue Line (Track Payana Okka Track!)
      new THREE.Vector3(roadOffset, deckHighY,  R * 0.58),
      new THREE.Vector3(roadOffset, deckLowY,   R)
    ], false, "centripetal", 0.08);

    // --- 4. DOUBLE-DECKER STACKED TRACK SECTION ALONG EAST-WEST APPROACH (Ameerpet Express Overpass!) ---
    const stackedExpressCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(roadOffset - 32, deckLowY,  roadOffset),
      new THREE.Vector3(roadOffset - 16, deckHighY, roadOffset),
      new THREE.Vector3(roadOffset,      deckHighY, roadOffset),
      new THREE.Vector3(roadOffset + 16, deckHighY, roadOffset),
      new THREE.Vector3(roadOffset + 32, deckLowY,  roadOffset)
    ], false, "centripetal", 0.12);

    // --- 5. ALL 12 CURVED INTERCHANGE CONNECTOR RAMPS (4 Central Quadrant + 8 Outer Ring Y-Junctions!) ---
    const rampCurves = [
      // 4 Central Ameerpet Interchange Curved Ramps (connecting E-W Level 1 <-> N-S Level 2 in ALL 4 quadrants!)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(roadOffset - 17, deckLowY, roadOffset),
        new THREE.Vector3(roadOffset - 6,  (deckLowY + deckHighY) * 0.5, roadOffset - 6),
        new THREE.Vector3(roadOffset,      deckHighY, roadOffset - 17)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(roadOffset + 17, deckLowY, roadOffset),
        new THREE.Vector3(roadOffset + 6,  (deckLowY + deckHighY) * 0.5, roadOffset - 6),
        new THREE.Vector3(roadOffset,      deckHighY, roadOffset - 17)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(roadOffset - 17, deckLowY, roadOffset),
        new THREE.Vector3(roadOffset - 6,  (deckLowY + deckHighY) * 0.5, roadOffset + 6),
        new THREE.Vector3(roadOffset,      deckHighY, roadOffset + 17)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(roadOffset + 17, deckLowY, roadOffset),
        new THREE.Vector3(roadOffset + 6,  (deckLowY + deckHighY) * 0.5, roadOffset + 6),
        new THREE.Vector3(roadOffset,      deckHighY, roadOffset + 17)
      ]),

      // 8 Sweeping Outer Ring Y-Junction Ramps (connecting E-W & N-S into BOTH directions of Outer Ring!)
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-R + 15, deckLowY, roadOffset),
        new THREE.Vector3(-R + 4,  deckLowY, roadOffset - 4),
        new THREE.Vector3(-R,      deckLowY, roadOffset - 15)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-R + 15, deckLowY, roadOffset),
        new THREE.Vector3(-R + 4,  deckLowY, roadOffset + 4),
        new THREE.Vector3(-R,      deckLowY, roadOffset + 15)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(R - 15, deckLowY, roadOffset),
        new THREE.Vector3(R - 4,  deckLowY, roadOffset - 4),
        new THREE.Vector3(R,      deckLowY, roadOffset - 15)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(R - 15, deckLowY, roadOffset),
        new THREE.Vector3(R - 4,  deckLowY, roadOffset + 4),
        new THREE.Vector3(R,      deckLowY, roadOffset + 15)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(roadOffset,      deckLowY, -R + 15),
        new THREE.Vector3(roadOffset - 4,  deckLowY, -R + 4),
        new THREE.Vector3(roadOffset - 15, deckLowY, -R)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(roadOffset,      deckLowY, -R + 15),
        new THREE.Vector3(roadOffset + 4,  deckLowY, -R + 4),
        new THREE.Vector3(roadOffset + 15, deckLowY, -R)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(roadOffset,      deckLowY, R - 15),
        new THREE.Vector3(roadOffset - 4,  deckLowY, R - 4),
        new THREE.Vector3(roadOffset - 15, deckLowY, R)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(roadOffset,      deckLowY, R - 15),
        new THREE.Vector3(roadOffset + 4,  deckLowY, R - 4),
        new THREE.Vector3(roadOffset + 15, deckLowY, R)
      ])
    ];

    // Helper: Build Hyderabad Metro U-Trough Box-Girder Viaduct + Centered Spine Piers!
    const buildViaduct = (curve, railMat, pillarStep, width = 5.6, addPillars = true) => {
      const len = curve.getLength();
      const segLen = 5.0;
      const segCount = Math.max(14, Math.ceil(len / (segLen * 0.84)));
      const trackInst = new THREE.InstancedMesh(this._boxGeo(width, 0.72, segLen), this.mat.concrete, segCount);
      const railLInst = new THREE.InstancedMesh(this._boxGeo(0.28, 0.56, segLen), railMat, segCount);
      const railRInst = new THREE.InstancedMesh(this._boxGeo(0.28, 0.56, segLen), railMat, segCount);
      const midInst   = new THREE.InstancedMesh(this._boxGeo(0.24, 0.28, segLen), this.mat.mansionGoldTrim, segCount);
      const dummy = new THREE.Object3D();
      const halfW = width * 0.48;

      for (let i = 0; i < segCount; i++) {
        const u = i / Math.max(1, segCount - 1);
        const p = curve.getPointAt(u);
        const tang = curve.getTangentAt(u).normalize();
        const yaw = Math.atan2(tang.x, tang.z);
        const sx = Math.cos(yaw) * halfW;
        const sz = -Math.sin(yaw) * halfW;

        dummy.position.set(p.x, p.y - 0.36, p.z);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        trackInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x + sx, p.y + 0.16, p.z + sz);
        dummy.updateMatrix();
        railLInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x - sx, p.y + 0.16, p.z - sz);
        dummy.updateMatrix();
        railRInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x, p.y + 0.08, p.z);
        dummy.updateMatrix();
        midInst.setMatrixAt(i, dummy.matrix);
      }
      trackInst.instanceMatrix.needsUpdate = true;
      railLInst.instanceMatrix.needsUpdate = true;
      railRInst.instanceMatrix.needsUpdate = true;
      midInst.instanceMatrix.needsUpdate = true;
      metroGrp.add(trackInst, railLInst, railRInst, midInst);

      if (addPillars) {
        const pCount = Math.max(4, Math.floor(len / pillarStep));
        const pInst   = new THREE.InstancedMesh(this._boxGeo(1.3, 1.0, 1.3), this.mat.plinthGrey, pCount);
        const capInst = new THREE.InstancedMesh(this._boxGeo(width + 0.2, 0.65, 2.0), this.mat.mansionCreamMarble, pCount);
        for (let i = 0; i < pCount; i++) {
          const u = (i + 0.5) / pCount;
          const p = curve.getPointAt(u);
          const tang = curve.getTangentAt(u).normalize();
          const yaw = Math.atan2(tang.x, tang.z);
          const h = Math.max(1.0, p.y - 0.4);

          dummy.position.set(p.x, h / 2, p.z);
          dummy.rotation.set(0, yaw, 0);
          dummy.scale.set(1, h, 1);
          dummy.updateMatrix();
          pInst.setMatrixAt(i, dummy.matrix);

          dummy.position.set(p.x, p.y - 0.85, p.z);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          capInst.setMatrixAt(i, dummy.matrix);
        }
        pInst.instanceMatrix.needsUpdate = true;
        capInst.instanceMatrix.needsUpdate = true;
        metroGrp.add(pInst, capInst);
      }
      return len;
    };

    const ringLen = buildViaduct(ringCurve, this.mat.mobileBlue, 24, 5.6, true);
    const ewLen   = buildViaduct(ewCurve, this.mat.cinemaNeonCyan, 22, 5.6, true);
    const nsLen   = buildViaduct(nsCurve, this.mat.oyoRed, 22, 5.6, true);
    buildViaduct(stackedExpressCurve, this.mat.mansionGoldTrim, 20, 4.2, false);
    rampCurves.forEach((rc) => buildViaduct(rc, this.mat.mobileBlue, 16, 3.2, false));

    // Helper: Build Authentic Hyderabad Metro (HMR) Station + Covered Blue Skywalk Dropping Steps!
    const stationStops = [];
    const addHmrStation = (curve, stInfo, isAmeerpetHub = false) => {
      const p = curve.getPointAt(stInfo.u);
      const tang = curve.getTangentAt(stInfo.u).normalize();
      const yaw = Math.atan2(tang.x, tang.z);
      const yHeight = p.y;

      const sGrp = new THREE.Group();
      sGrp.position.set(p.x, yHeight, p.z);
      sGrp.rotation.y = yaw;

      const stW = isAmeerpetHub ? 13.6 : 10.6;
      const stL = isAmeerpetHub ? 18.0 : 15.2;

      // 1. Hyderabad Metro Cream-Concrete Concourse Hall straddling the wide road!
      const concourse = new THREE.Mesh(this._boxGeo(stW, 0.55, stL), this.mat.mansionCreamMarble);
      concourse.position.set(0, -4.8, 0);
      const concourseWallL = new THREE.Mesh(this._boxGeo(0.35, 2.2, stL - 1.2), this.mat.mansionCreamMarble);
      concourseWallL.position.set(-stW / 2 + 0.2, -3.5, 0);
      const concourseWallR = concourseWallL.clone();
      concourseWallR.position.x = stW / 2 - 0.2;
      sGrp.add(concourse, concourseWallL, concourseWallR);

      // Portal Columns cleanly flanking the wide road edges
      [[-stW / 2 + 0.6, -stL / 2 + 1.2], [stW / 2 - 0.6, -stL / 2 + 1.2], [-stW / 2 + 0.6, stL / 2 - 1.2], [stW / 2 - 0.6, stL / 2 - 1.2]].forEach(([px, pz]) => {
        const col = new THREE.Mesh(this._boxGeo(0.85, yHeight - 0.4, 0.85), this.mat.plinthGrey);
        col.position.set(px, -yHeight / 2, pz);
        sGrp.add(col);
      });

      // 2. Twin HMR Platforms with Yellow Safety Line
      [-stW / 2 + 1.4, stW / 2 - 1.4].forEach((px) => {
        const plat = new THREE.Mesh(this._boxGeo(2.3, 0.52, stL), this.mat.marble);
        plat.position.set(px, -0.08, 0);
        const safetyLine = new THREE.Mesh(this._boxGeo(0.24, 0.56, stL - 0.2), this.mat.petrolYellow);
        safetyLine.position.set(px + (px > 0 ? -0.95 : 0.95), -0.05, 0);
        sGrp.add(plat, safetyLine);
      });

      // 3. Iconic Hyderabad Metro Curved Silver-White Arched Roof Canopy + Blue HMR Fascia!
      const roofTop = isAmeerpetHub ? 10.6 : 4.4;
      const archRoof = new THREE.Mesh(this._boxGeo(stW + 0.8, 0.45, stL + 0.8), this.mat.wallWhite);
      archRoof.position.set(0, roofTop, 0);
      const glassSkylight = new THREE.Mesh(this._boxGeo(stW * 0.48, 0.52, stL + 0.4), this.mat.glass);
      glassSkylight.position.set(0, roofTop + 0.18, 0);
      const hmrBlueL = new THREE.Mesh(this._boxGeo(0.36, 0.62, stL + 1.0), this.mat.mobileBlue);
      hmrBlueL.position.set(-(stW + 0.8) / 2, roofTop - 0.1, 0);
      const hmrBlueR = hmrBlueL.clone();
      hmrBlueR.position.x = (stW + 0.8) / 2;
      sGrp.add(archRoof, glassSkylight, hmrBlueL, hmrBlueR);

      // If Ameerpet 3-Level Stacked Interchange, also build the Upper Stacked Red-Line Platforms at local Y = +6.0!
      if (isAmeerpetHub) {
        [-stW / 2 + 1.4, stW / 2 - 1.4].forEach((px) => {
          const uPlat = new THREE.Mesh(this._boxGeo(2.3, 0.52, stL), this.mat.marble);
          uPlat.position.set(px, 5.95, 0);
          sGrp.add(uPlat);
        });
      }

      // 4. Covered Blue Skywalk Dropping Steps descending cleanly along the road curb!
      const buildDroppingStair = (zDir) => {
        const stairGrp = new THREE.Group();
        const dropH = yHeight - 4.8;
        const runLen = 9.0;
        const slope = Math.atan2(dropH, runLen);
        const hyp = Math.hypot(dropH, runLen);

        const ramp = new THREE.Mesh(this._boxGeo(1.8, 0.36, hyp), this.mat.marble);
        ramp.position.set(0, -4.8 - dropH / 2, zDir * (stL / 2 + runLen / 2));
        ramp.rotation.x = zDir * slope;

        const roof = new THREE.Mesh(this._boxGeo(2.0, 0.24, hyp + 0.4), this.mat.mobileBlue);
        roof.position.set(0, -4.8 - dropH / 2 + 2.15, zDir * (stL / 2 + runLen / 2));
        roof.rotation.x = zDir * slope;

        [-0.88, 0.88].forEach((rx) => {
          const rail = new THREE.Mesh(this._boxGeo(0.1, 0.85, hyp), this.mat.glass);
          rail.position.set(rx, -4.8 - dropH / 2 + 0.55, zDir * (stL / 2 + runLen / 2));
          rail.rotation.x = zDir * slope;
          stairGrp.add(rail);
        });

        const entryArch = new THREE.Mesh(this._boxGeo(2.25, 2.7, 0.42), this.mat.mobileBlue);
        entryArch.position.set(0, -yHeight + 1.35, zDir * (stL / 2 + runLen));
        stairGrp.add(ramp, roof, entryArch);
        return stairGrp;
      };

      sGrp.add(buildDroppingStair(1), buildDroppingStair(-1));

      const mBoard = this._makeBuildingBoard(
        stInfo.name.replace(/^[^\s]+\s/, "").toUpperCase(),
        isAmeerpetHub ? "HYD METRO • 3-LEVEL STACKED INTERCHANGE" : "HYDERABAD METRO • SHERU BHAI CITY",
        "#0c4a6e", "#38bdf8", isAmeerpetHub ? 12.2 : 9.8, 1.65
      );
      mBoard.position.set(0, roofTop + 1.25, 0);

      const sign = this._createNameSign(stInfo.name, stInfo.sub, isAmeerpetHub);
      sign.position.set(0, roofTop + 4.4, 0);
      sGrp.add(mBoard, sign);
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

    // 4 INNER-CITY HYDERABAD METRO STATIONS (including Ameerpet 3-Level Stacked Interchange!)
    addHmrStation(ewCurve, { id: "metro_ameerpet", name: "🚇 Ameerpet Interchange", sub: "3-LEVEL STACKED HUB • BLUE + RED LINE", u: 0.50 + (roadOffset / (2 * R)), line: "ew" }, true);
    addHmrStation(ewCurve, { id: "metro_hitech",   name: "🏙️ Hi-Tech City Metro",   sub: "INNER BLUE LINE • WEST CITY",          u: 0.24, line: "ew" }, false);
    addHmrStation(ewCurve, { id: "metro_jubilee",  name: "🏙️ Jubilee Hills Metro",  sub: "INNER BLUE LINE • EAST CITY",          u: 0.78, line: "ew" }, false);
    addHmrStation(nsCurve, { id: "metro_secbad",   name: "🏙️ Secunderabad Metro",   sub: "INNER RED LINE • NORTH CITY",          u: 0.25, line: "ns" }, false);

    // 6 OUTER RING METRO STATIONS (Connected at every major outskirts hub!)
    [
      { id: "metro_temple",  name: "🛕 Temple & Railway Metro", sub: "NORTH RING • RAILWAY JN",       u: 0.125, line: "ring" },
      { id: "metro_airport", name: "✈️ Airport Metro",          sub: "EAST RING • 20-ACRE AIRPORT",   u: 0.375, line: "ring" },
      { id: "metro_stadium", name: "🏏 Stadium Metro",          sub: "SOUTH-EAST • CRICKET STADIUM",  u: 0.545, line: "ring" },
      { id: "metro_gate",    name: "🦁 City Gate Metro",        sub: "SOUTH RING • WELCOME ARCH",     u: 0.625, line: "ring" },
      { id: "metro_rocket",  name: "🚀 ISRO Spaceport Metro",   sub: "SOUTH-WEST • ROCKET LAUNCHPAD", u: 0.705, line: "ring" },
      { id: "metro_beach",   name: "🏖️ Golden Beach Metro",     sub: "WEST RING • BEACH & WHEEL",     u: 0.875, line: "ring" }
    ].forEach((s) => addHmrStation(ringCurve, s, false));

    // --- BUILD REAL COMBINED-COACH HYDERABAD METRO TRAINS (All 4 Directions!) ---
    const makeRealMetroCoach = (isHead, isTail, accentMat) => {
      const coach = new THREE.Group();
      const body = new THREE.Mesh(this._boxGeo(2.22, 2.22, 5.6), this.mat.wallWhite);
      body.position.y = 1.42;
      const stripe = new THREE.Mesh(this._boxGeo(2.28, 0.56, 5.62), accentMat);
      stripe.position.y = 0.92;
      const winBand = new THREE.Mesh(this._boxGeo(2.27, 0.86, 4.95), this.mat.darkGlass);
      winBand.position.y = 1.75;
      const roof = new THREE.Mesh(this._boxGeo(2.02, 0.22, 5.45), this.mat.inorbitNavy);
      roof.position.y = 2.62;
      const acPod = new THREE.Mesh(this._boxGeo(1.35, 0.18, 2.1), this.mat.plinthGrey);
      acPod.position.y = 2.78;
      coach.add(body, stripe, winBand, roof, acPod);

      if (isHead) {
        const nose = new THREE.Mesh(this._boxGeo(2.14, 1.85, 0.85), this.mat.wallWhite);
        nose.position.set(0, 1.3, 3.05);
        const windshield = new THREE.Mesh(this._boxGeo(1.92, 0.95, 0.25), this.mat.darkGlass);
        windshield.position.set(0, 1.78, 3.4);
        const hl = new THREE.Mesh(this._boxGeo(1.75, 0.24, 0.14), this.mat.mansionWarmGlow);
        hl.position.set(0, 0.86, 3.48);
        coach.add(nose, windshield, hl);
      }
      if (!isTail) {
        const coupler = new THREE.Mesh(this._boxGeo(1.96, 1.98, 0.65), this.mat.cinemaObsidian);
        coupler.position.set(0, 1.4, -3.0);
        coach.add(coupler);
      }
      return coach;
    };

    const trains = [];
    const spawnTrain = (curve, totalLen, line, closed, u, dir, laneOffset, speed, accentMat) => {
      const cars = [];
      for (let c = 0; c < 4; c++) {
        const cm = makeRealMetroCoach(c === 0, c === 3, accentMat);
        metroGrp.add(cm);
        cars.push(cm);
      }
      trains.push({
        curve,
        line,
        closed,
        carSpacingU: 5.95 / totalLen,
        u,
        dir,
        laneOffset,
        speed,
        pauseTimer: 0,
        lastStopIdx: -1,
        cars
      });
    };

    // Outer Ring: 2 Blue CW + 2 Pink CCW
    spawnTrain(ringCurve, ringLen, "ring", true, 0.00,  1,  1.4, 0.048, this.mat.cinemaNeonCyan);
    spawnTrain(ringCurve, ringLen, "ring", true, 0.50,  1,  1.4, 0.048, this.mat.cinemaNeonCyan);
    spawnTrain(ringCurve, ringLen, "ring", true, 0.25, -1, -1.4, 0.048, this.mat.cinemaNeonPink);
    spawnTrain(ringCurve, ringLen, "ring", true, 0.75, -1, -1.4, 0.048, this.mat.cinemaNeonPink);

    // East-West Blue Line (Lower Level): Orange (W->E) + Blue (E->W)
    spawnTrain(ewCurve, ewLen, "ew", false, 0.15,  1,  1.4, 0.095, this.mat.biryaniOrange);
    spawnTrain(ewCurve, ewLen, "ew", false, 0.85, -1, -1.4, 0.095, this.mat.mobileBlue);

    // North-South Red Line (Stacked Upper Level over Ameerpet!): Red (N->S) + Gold (S->N)
    spawnTrain(nsCurve, nsLen, "ns", false, 0.15,  1,  1.4, 0.095, this.mat.oyoRed);
    spawnTrain(nsCurve, nsLen, "ns", false, 0.85, -1, -1.4, 0.095, this.mat.mansionGoldTrim);

    this.cityGroup.add(metroGrp);
    this.metroSim = {
      group: metroGrp,
      curve: ringCurve,
      stations: stationStops,
      trains,
      deckY: deckLowY
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
  // 🌉 SEA BRIDGE & VIP ISLAND TERRAIN + WATER GUARDRAILS (Drive & Walk to Sheru Bhai Villa!)
  // =========================================================
  _getTerrainAt(x, z) {
    // 1. Check RGB Cable-Stayed Sea Bridge
    if (this._seaBridgeBounds && typeof this._getSeaBridgeY === "function") {
      const sb = this._seaBridgeBounds;
      if (x >= sb.minX && x <= sb.maxX && Math.abs(z - sb.z) <= sb.halfW + 0.6) {
        const y = this._getSeaBridgeY(x) + 0.28;
        const yAhead = this._getSeaBridgeY(x - 1.0) + 0.28;
        return { y, pitchX: Math.atan2(yAhead - y, 1.0), surface: "bridge" };
      }
    }
    // 2. Check Sheru Bhai Royal Private Island (courtyard surface at Y = 2.16)
    if (this.vipIslandPos) {
      const d = Math.hypot(x - this.vipIslandPos.x, z - this.vipIslandPos.z);
      if (d <= 29.0) {
        return { y: 2.16, pitchX: 0, surface: "island" };
      }
    }
    return { y: 0.12, pitchX: 0, surface: "land" };
  },

  _isOceanBlocked(nx, nz) {
    const beachEdgeX = (this.beachX || -(this.ringRadius + 76)) - 6.0;
    if (nx >= beachEdgeX) return false; // Safely on mainland / beach sand!
    // Allow driving/walking smoothly along the RGB Sea Bridge deck
    if (this._seaBridgeBounds) {
      const sb = this._seaBridgeBounds;
      if (nx >= sb.minX - 2 && nx <= sb.maxX + 4 && Math.abs(nz - sb.z) <= 3.35) {
        return false;
      }
    }
    // Allow exploring all over Sheru Bhai's VIP Private Island!
    if (this.vipIslandPos) {
      const d = Math.hypot(nx - this.vipIslandPos.x, nz - this.vipIslandPos.z);
      if (d <= 25.5) return false;
    }
    return true; // Deep ocean water — stay on bridge or island!
  },

  // =========================================================
  // 🛡️ SOLID BUILDING & WATER COLLISION CHECKER (BOTH Car AND Walking Sheru Bhai!)
  // =========================================================
  _isBlockedByBuilding(nx, nz, radius = 1.65) {
    if (this._isOceanBlocked(nx, nz)) return true;
    if (Math.hypot(nx, nz) < 6.4 + radius) return true;

    // VIP Island Mansion Palace Main Structure (keep courtyard & red carpet open so you can drive/walk right up to Sheru Bhai!)
    if (this.vipIslandPos) {
      const palX = this.vipIslandPos.x - 7.2;
      const palZ = this.vipIslandPos.z;
      if (Math.abs(nx - palX) < (7.2 + radius) && Math.abs(nz - palZ) < (12.0 + radius)) {
        return true;
      }
    }

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
  // 🎵 AUTO VILLA SONG (Works BOTH on Camera Drag to Villa AND on Car/Walk Entry!)
  // =========================================================
  _ensureVillaAudioUnlocked() {
    if (this._villaAudioInit) return;
    this._villaAudioInit = true;
    const audio = new Audio("./villa-song.mp3");
    audio.loop = true;
    audio.volume = 0.0;
    audio.preload = "auto";
    audio.addEventListener("error", () => { this._villaAudioMissing = true; });
    this._villaAudio = audio;

    // Unlock audio cleanly on first touch/click so mobile Chrome plays immediately when dragging camera to Villa!
    const unlock = () => {
      if (!this._villaAudio || this._villaAudioMissing || this._villaAudioUnlocked) return;
      this._villaAudio.play().then(() => {
        if (!this._inVillaZone) this._villaAudio.pause();
        this._villaAudioUnlocked = true;
      }).catch(() => {});
    };
    window.addEventListener("pointerdown", unlock, { passive: true, once: true });
    window.addEventListener("touchstart", unlock, { passive: true, once: true });
  },

  _updateVillaProximitySong(px, pz) {
    this._ensureVillaAudioUnlocked();
    if (!this._villaAudio || this._villaAudioMissing) return;

    let nearVilla = false;
    // 1. Sheru Bhai Royal Island Mansion
    if (this.vipIslandPos && Math.hypot(px - this.vipIslandPos.x, pz - this.vipIslandPos.z) < 42) {
      nearVilla = true;
    }
    // 2. Any 8-Plot Ultra-Premium Billionaire Villa in the city
    if (!nearVilla) {
      for (const [pid, pdata] of this.plotDataMap.entries()) {
        if (pdata && pdata.status === "built" && pdata.buildingType === "billionaire_villa") {
          const grp = this.plotMeshes.get(pid);
          if (grp && Math.hypot(px - grp.position.x, pz - grp.position.z) < 30) {
            nearVilla = true;
            break;
          }
        }
      }
    }

    if (nearVilla) {
      this._inVillaZone = true;
      if (this._villaAudio.paused) this._villaAudio.play().catch(() => {});
      this._villaAudio.volume = Math.min(0.85, this._villaAudio.volume + 0.05);
    } else if (this._inVillaZone || !this._villaAudio.paused) {
      this._villaAudio.volume = Math.max(0.0, this._villaAudio.volume - 0.05);
      if (this._villaAudio.volume <= 0.01) {
        this._villaAudio.pause();
        this._inVillaZone = false;
      }
    }
  },

  // =========================================================
  // 🦁🚗 PART 2: PLAYABLE SHERU BHAI (TRUE 1-FINGER 360° ROTATE + PINCH ZOOM LIMIT!)
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
      prevPos: new THREE.Vector3(0, 0.12, spawnZ),
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

  _snapRoamCameraToPlayer() {
    const pr = this.playerRoam;
    if (!pr) return;
    pr.prevPos.copy(pr.pos);
    this.controls.target.set(pr.pos.x, pr.pos.y + 1.8, pr.pos.z);
    this.camera.position.set(pr.pos.x, pr.pos.y + 10.5, pr.pos.z - 18.0);
    this.controls.update();
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
    pr.prevPos.copy(pr.pos);
    pr.yaw = 0;
    pr.speed = 0;
    pr.carPos.set(0, 0.12, spawnZ);
    pr.carYaw = 0;
    pr.car.position.copy(pr.carPos);
    pr.car.rotation.set(0, pr.carYaw, 0);
    pr.actor.visible = !startInCar;
    pr.driverSheru.visible = startInCar;
    this._setRoamNameScale(0.52);

    // 🎥 SWITCH TO TRUE 360° ORBIT ROTATE (1-FINGER DRAG) + BOUNDED ZOOM IN/OUT (7.5 .. 68)!
    if (!this._savedOrbitCfg) {
      this._savedOrbitCfg = {
        minDistance: this.controls.minDistance,
        maxDistance: this.controls.maxDistance,
        maxPolarAngle: this.controls.maxPolarAngle,
        enablePan: this.controls.enablePan,
        touches: { ...this.controls.touches },
        mouseButtons: { ...this.controls.mouseButtons }
      };
    }
    this.controls.enablePan = false;
    this.controls.enableRotate = true;
    this.controls.enableZoom = true;
    this.controls.minDistance = 7.5;
    this.controls.maxDistance = 68.0;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE
    };
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    };
    this._snapRoamCameraToPlayer();

    if (pr.onStateChange) pr.onStateChange(pr.mode, 0);
  },

  exitSheruRoamMode() {
    if (!this.playerRoam) return;
    this.playerRoam.active = false;
    this.playerRoam.root.visible = false;
    this.playerRoam.input = { x: 0, y: 0, boost: false };
    this._setRoamNameScale(1.0);
    if (this._savedOrbitCfg) {
      this.controls.minDistance = this._savedOrbitCfg.minDistance;
      this.controls.maxDistance = this._savedOrbitCfg.maxDistance;
      this.controls.maxPolarAngle = this._savedOrbitCfg.maxPolarAngle;
      this.controls.enablePan = this._savedOrbitCfg.enablePan;
      this.controls.touches = { ...this._savedOrbitCfg.touches };
      this.controls.mouseButtons = { ...this._savedOrbitCfg.mouseButtons };
      this._savedOrbitCfg = null;
    }
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
      const t = this._getTerrainAt(pr.pos.x, pr.pos.z);
      pr.pos.y = t.y;
      pr.actor.position.copy(pr.pos);
      pr.actor.visible = true;
      pr.driverSheru.visible = false;
      this._snapRoamCameraToPlayer();
      if (pr.onStateChange) pr.onStateChange("foot", 0);
      return "🚶 Stepped off Metro! Drag to rotate 360° & pinch to zoom!";
    }

    if (pr.mode === "car") {
      pr.mode = "foot";
      pr.speed = 0;
      const sideX = Math.cos(pr.carYaw) * 2.4;
      const sideZ = -Math.sin(pr.carYaw) * 2.4;
      const exitX = pr.carPos.x + sideX;
      const exitZ = pr.carPos.z + sideZ;
      const chosenX = !this._isBlockedByBuilding(exitX, exitZ, 0.8) ? exitX : pr.carPos.x - sideX;
      const chosenZ = !this._isBlockedByBuilding(exitX, exitZ, 0.8) ? exitZ : pr.carPos.z - sideZ;
      const t = this._getTerrainAt(chosenX, chosenZ);
      pr.pos.set(chosenX, t.y, chosenZ);
      pr.prevPos.copy(pr.pos);
      pr.yaw = pr.carYaw;
      pr.actor.position.copy(pr.pos);
      pr.actor.rotation.y = pr.yaw;
      pr.actor.visible = true;
      pr.driverSheru.visible = false;
      this._setPlayerRoamAnim("Idle");
      if (pr.onStateChange) pr.onStateChange("foot", 0);
      return "🚶 Car dhigaru! Drag anywhere to rotate 360° & pinch to zoom!";
    } else {
      const dist = pr.pos.distanceTo(pr.carPos);
      if (dist > 14) {
        const t = this._getTerrainAt(pr.pos.x, pr.pos.z);
        pr.carPos.set(pr.pos.x, t.y, pr.pos.z);
        pr.carYaw = pr.yaw;
        pr.car.position.copy(pr.carPos);
        pr.car.rotation.set(0, pr.carYaw, 0);
      }
      pr.mode = "car";
      pr.pos.copy(pr.carPos);
      pr.prevPos.copy(pr.pos);
      pr.yaw = pr.carYaw;
      pr.speed = 0;
      pr.actor.visible = false;
      pr.driverSheru.visible = true;
      if (pr.onStateChange) pr.onStateChange("car", 0);
      return "🚗 Entered VIP Car! Drag anywhere to rotate 360° & pinch to zoom!";
    }
  },

  summonSheruCar() {
    const pr = this.playerRoam;
    if (!pr || !pr.active) return;
    if (pr.mode === "metro") pr.mode = "foot";
    const fwdX = Math.sin(pr.yaw) * 4.0;
    const fwdZ = Math.cos(pr.yaw) * 4.0;
    const tx = pr.pos.x + fwdX;
    const tz = pr.pos.z + fwdZ;
    const t = this._getTerrainAt(tx, tz);
    pr.carPos.set(tx, t.y, tz);
    pr.carYaw = pr.yaw;
    pr.car.position.copy(pr.carPos);
    pr.car.rotation.set(0, pr.carYaw, 0);
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
      const t = this._getTerrainAt(st.x + 3.5, st.z + 3.5);
      pr.pos.set(st.x + 3.5, t.y, st.z + 3.5);
      if (pr.mode === "car") {
        pr.carPos.copy(pr.pos);
        pr.car.position.copy(pr.carPos);
      } else {
        pr.mode = "foot";
        pr.actor.position.copy(pr.pos);
        pr.actor.visible = true;
      }
      this._snapRoamCameraToPlayer();
      if (pr.onStateChange) pr.onStateChange(pr.mode, 0);
    } else {
      this.flyToMetroStation(stationId);
    }
  }
};
