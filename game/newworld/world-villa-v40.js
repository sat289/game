import * as THREE from "three";

/**
 * 👑 SHERU BHAI CITY — v40 8-PLOT ULTRA-PREMIUM BILLIONAIRE VILLA (`billionaire_villa`)
 * Static meshes auto-merge via `mesh-batcher.js` for 60fps on 2GB-4GB RAM phones,
 * while Elevator, Turntable Supercar, Helipad Rotor, Crown, Drones, Fire-Pit,
 * Fountain & RGB Dance Floor animate smoothly in `world-loop.js`!
 */
export const v40VillaMethods = {
  _buildEightPlotBillionaireVilla(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.glass;

    // 1. Compound Marble & Lush Lawn Base (33.2 x 14.4 — full 8-plot luxury estate!)
    const estatePad = new THREE.Mesh(this._boxGeo(33.2, 0.22, 14.4), this.mat.mansionBlackMarble);
    estatePad.position.set(0, 0.14, 0);
    const frontLawn = new THREE.Mesh(this._boxGeo(31.8, 0.08, 4.4), this.mat.turf);
    frontLawn.position.set(0, 0.28, 4.6);
    const driveway = new THREE.Mesh(this._boxGeo(7.6, 0.1, 5.2), this.mat.mansionCreamMarble);
    driveway.position.set(-2.2, 0.29, 4.4);
    const redCarpet = new THREE.Mesh(this._boxGeo(2.6, 0.12, 4.8), this.mat.vipCarpet);
    redCarpet.position.set(-2.2, 0.31, 3.6);
    g.add(estatePad, frontLawn, driveway, redCarpet);

    // Low Black-Gold Estate Perimeter Compound Wall
    const wallBack = new THREE.Mesh(this._boxGeo(33.0, 1.35, 0.32), this.mat.mansionBlackMarble);
    wallBack.position.set(0, 0.9, -7.0);
    const wallL = new THREE.Mesh(this._boxGeo(0.32, 1.35, 14.2), this.mat.mansionBlackMarble);
    wallL.position.set(-16.4, 0.9, 0);
    const wallR = wallL.clone();
    wallR.position.x = 16.4;
    g.add(wallBack, wallL, wallR);

    // =========================================================================
    // 2. 3-STORY BLACK-GOLD MARBLE & CURTAIN-WALL GLASS PALACE + LED BALCONIES
    // =========================================================================
    const palX = -2.2;
    const palZ = -2.4;

    // Ground Floor (y = 0.25 .. 3.45) — Marble Core + Curtain Glass + Supercar Garage Wing
    const f1Body = new THREE.Mesh(this._boxGeo(17.8, 3.2, 7.6), this.mat.mansionBlackMarble);
    f1Body.position.set(palX, 1.85, palZ);
    const f1Glass = new THREE.Mesh(this._boxGeo(15.2, 2.5, 0.16), winMat);
    f1Glass.position.set(palX, 1.85, palZ + 3.84);
    f1Glass.userData.isWindow = true;

    // 2nd Floor (y = 3.45 .. 6.65) — Cantilevered Cream-Marble & Glass Wing + Cyan/Gold LED Rim
    const f2Slab = new THREE.Mesh(this._boxGeo(19.6, 0.34, 8.8), this.mat.mansionCreamMarble);
    f2Slab.position.set(palX, 3.55, palZ + 0.4);
    const f2Led = new THREE.Mesh(this._boxGeo(19.75, 0.12, 8.95), this.mat.cinemaNeonCyan);
    f2Led.position.set(palX, 3.36, palZ + 0.4);
    const f2Body = new THREE.Mesh(this._boxGeo(16.6, 3.0, 7.2), this.mat.mansionCreamMarble);
    f2Body.position.set(palX, 5.2, palZ - 0.1);
    const f2Glass = new THREE.Mesh(this._boxGeo(14.8, 2.45, 0.16), winMat);
    f2Glass.position.set(palX, 5.15, palZ + 3.56);
    f2Glass.userData.isWindow = true;
    const f2Rail = new THREE.Mesh(this._boxGeo(19.4, 0.85, 0.12), this.mat.glass);
    f2Rail.position.set(palX, 4.1, palZ + 4.72);

    // 3rd Floor Penthouse (y = 6.65 .. 9.65) — Black-Gold Marble + Gold LED Rim
    const f3Slab = new THREE.Mesh(this._boxGeo(18.2, 0.34, 8.4), this.mat.mansionBlackMarble);
    f3Slab.position.set(palX, 6.8, palZ + 0.2);
    const f3Led = new THREE.Mesh(this._boxGeo(18.35, 0.12, 8.55), this.mat.mansionGoldTrim);
    f3Led.position.set(palX, 6.62, palZ + 0.2);
    const f3Body = new THREE.Mesh(this._boxGeo(14.2, 2.8, 6.8), this.mat.mansionBlackMarble);
    f3Body.position.set(palX, 8.35, palZ - 0.2);
    const f3Glass = new THREE.Mesh(this._boxGeo(12.6, 2.25, 0.16), winMat);
    f3Glass.position.set(palX, 8.35, palZ + 3.26);
    f3Glass.userData.isWindow = true;
    const f3Rail = new THREE.Mesh(this._boxGeo(18.0, 0.8, 0.12), this.mat.glass);
    f3Rail.position.set(palX, 7.35, palZ + 4.32);

    // Rooftop Sky-Deck Floor Slab (y = 9.85)
    const roofDeck = new THREE.Mesh(this._boxGeo(16.8, 0.36, 7.8), this.mat.mansionBlackMarble);
    roofDeck.position.set(palX, 9.9, palZ);
    const roofGoldRim = new THREE.Mesh(this._boxGeo(17.0, 0.16, 8.0), this.mat.mansionGoldTrim);
    roofGoldRim.position.set(palX, 10.12, palZ);

    // Vertical Gold-Trimmed Marble Accent Columns
    [-10.6, -5.2, 0.8, 6.2].forEach((cx) => {
      const col = new THREE.Mesh(this._boxGeo(0.55, 9.6, 0.55), this.mat.mansionGoldTrim);
      col.position.set(cx, 5.05, palZ + 3.9);
      g.add(col);
    });

    g.add(f1Body, f1Glass, f2Slab, f2Led, f2Body, f2Glass, f2Rail, f3Slab, f3Led, f3Body, f3Glass, f3Rail, roofDeck, roofGoldRim);

    // =========================================================================
    // 3. 🛗 EXTERIOR PANORAMIC GLASS CAPSULE ELEVATOR (LIVE GLIDING CABIN!)
    // =========================================================================
    const elevX = palX + 9.4;
    const elevZ = palZ + 1.2;
    const shaftGlass = new THREE.Mesh(this._boxGeo(2.0, 9.8, 2.0), this.mat.glass);
    shaftGlass.position.set(elevX, 5.15, elevZ);
    [-0.95, 0.95].forEach((ox) => {
      [-0.95, 0.95].forEach((oz) => {
        const rail = new THREE.Mesh(this._boxGeo(0.14, 10.0, 0.14), this.mat.mansionGoldTrim);
        rail.position.set(elevX + ox, 5.2, elevZ + oz);
        g.add(rail);
      });
    });
    const elevCabin = new THREE.Group();
    const cabBody = new THREE.Mesh(this._boxGeo(1.55, 1.9, 1.55), this.mat.mansionWarmGlow);
    const cabCap = new THREE.Mesh(this._boxGeo(1.65, 0.2, 1.65), this.mat.mansionGoldTrim);
    cabCap.position.y = 1.0;
    const cabBase = cabCap.clone();
    cabBase.position.y = -1.0;
    elevCabin.add(cabBody, cabCap, cabBase);
    elevCabin.position.set(elevX, 1.8, elevZ);
    elevCabin.userData.isAnimated = true;
    g.add(shaftGlass, elevCabin);

    // =========================================================================
    // 4. 🌊 CASCADING 2ND-FLOOR BALCONY WATERFALL & ILLUMINATED KOI POND
    // =========================================================================
    const wfX = palX - 6.8;
    const wfSheet = new THREE.Mesh(this._boxGeo(2.4, 3.2, 0.14), this.mat.waterfallBlue);
    wfSheet.position.set(wfX, 1.9, palZ + 4.45);
    const wfFoam = new THREE.Mesh(this._boxGeo(2.5, 0.25, 0.45), this.mat.waterfallFoam);
    wfFoam.position.set(wfX, 0.42, palZ + 4.55);
    const koiPond = new THREE.Mesh(this._boxGeo(4.2, 0.26, 2.4), this.mat.poolTileBlue);
    koiPond.position.set(wfX, 0.34, palZ + 5.2);
    const pondRim = new THREE.Mesh(this._boxGeo(4.5, 0.22, 2.7), this.mat.mansionGoldTrim);
    pondRim.position.set(wfX, 0.28, palZ + 5.2);
    g.add(wfSheet, wfFoam, koiPond, pondRim);

    // =========================================================================
    // 5. 🦁 GRAND VIP ENTRANCE ARCH + TWIN GOLDEN LIONS + BOOM BARRIER + 2 BODYGUARDS
    // =========================================================================
    [-5.4, 1.0].forEach((gx) => {
      const pillar = new THREE.Mesh(this._boxGeo(1.05, 3.2, 1.05), this.mat.mansionBlackMarble);
      pillar.position.set(gx, 1.85, 6.4);
      const cap = new THREE.Mesh(this._boxGeo(1.2, 0.24, 1.2), this.mat.mansionGoldTrim);
      cap.position.set(gx, 3.5, 6.4);
      // Stylized Metallic-Gold Lion Statue perched atop each gate pillar!
      const lBody = new THREE.Mesh(this._boxGeo(0.55, 0.55, 0.85), this.mat.mansionGoldTrim);
      lBody.position.set(gx, 3.9, 6.4);
      const lHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), this.mat.mansionGoldTrim);
      lHead.position.set(gx, 4.35, 6.62);
      g.add(pillar, cap, lBody, lHead);
    });
    const gateBeam = new THREE.Mesh(this._boxGeo(7.6, 0.45, 0.8), this.mat.mansionBlackMarble);
    gateBeam.position.set(-2.2, 3.65, 6.4);
    const cleanOwner = (ownerName || "BILLIONAIRE").replace(/^@/, "").trim().toUpperCase();
    const vipGateSign = this._makeBuildingBoard(`👑 ${cleanOwner} VILLA`, "ULTRA-PREMIUM BILLIONAIRE ESTATE", "#09090b", "#facc15", 6.8, 1.15);
    vipGateSign.position.set(-2.2, 4.55, 6.46);
    g.add(gateBeam, vipGateSign);

    // Automated VIP Guard Cabin & LED Boom Barrier
    const guardCabin = new THREE.Mesh(this._boxGeo(2.0, 2.4, 1.8), this.mat.mansionBlackMarble);
    guardCabin.position.set(-7.2, 1.45, 5.8);
    const cabinGlass = new THREE.Mesh(this._boxGeo(1.6, 1.0, 1.86), this.mat.glass);
    cabinGlass.position.set(-7.2, 1.85, 5.8);
    const barrierArm = new THREE.Mesh(this._boxGeo(4.4, 0.14, 0.14), this.mat.cinemaNeonCyan);
    barrierArm.position.set(-4.1, 1.25, 6.1);
    g.add(guardCabin, cabinGlass, barrierArm);

    // 2 Black-Suited VIP Bodyguards stationed at the gate!
    [-4.3, -0.1].forEach((bx, idx) => {
      const guard = this._createCharacter({ shirtMat: this.mat.ramSuitBlack, pantsMat: this.mat.ramSuitBlack, scale: 0.96 });
      g.add(guard);
      this.landmarkActors.push({ plotId, mesh: guard, mode: "guard", baseX: bx, baseZ: 5.5, range: 0, speed: 1.0, phase: idx });
    });

    // =========================================================================
    // 6. 🏎️ GLASS-WALL SUPERCAR SHOWCASE GARAGE (2 SUPERCARS, 1 ON NEON TURNTABLE!)
    // =========================================================================
    const garX = -13.4;
    const garZ = -1.2;
    const garRoof = new THREE.Mesh(this._boxGeo(5.4, 0.34, 8.6), this.mat.mansionBlackMarble);
    garRoof.position.set(garX, 3.25, garZ);
    const garGlass = new THREE.Mesh(this._boxGeo(5.2, 2.9, 8.4), this.mat.glass);
    garGlass.position.set(garX, 1.7, garZ);
    const garRim = new THREE.Mesh(this._boxGeo(5.55, 0.14, 8.75), this.mat.cinemaNeonCyan);
    garRim.position.set(garX, 3.44, garZ);

    // Spinning Neon Turntable + Red Supercar #1
    const carTurn = new THREE.Group();
    carTurn.position.set(garX, 0.32, garZ + 1.8);
    const turnPad = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.2, 0.18, 18), this.mat.cinemaObsidian);
    const turnGlow = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.18, 20), this.mat.cinemaNeonCyan);
    turnGlow.rotation.x = -Math.PI / 2;
    turnGlow.position.y = 0.12;
    const superCar1 = this._makeRealAudiCarMesh(this.mat.audiRed, false);
    superCar1.scale.setScalar(0.84);
    superCar1.position.y = 0.14;
    carTurn.add(turnPad, turnGlow, superCar1);
    carTurn.userData.isAnimated = true;
    g.add(carTurn);
    this.turntableRotors.push({ plotId, mesh: carTurn, speed: 0.85 });

    // Gold/White Parked Supercar #2 inside rear bay
    const superCar2 = this._makeRealAudiCarMesh(this.mat.audiWhite, false);
    superCar2.scale.setScalar(0.84);
    superCar2.position.set(garX, 0.34, garZ - 2.2);
    g.add(garRoof, garGlass, garRim, superCar2);

    // =========================================================================
    // 7. ⛲ COURTYARD FOUNTAIN + 🏀 PRIVATE MINI BASKETBALL COURT + 🎬 OUTDOOR CINEMA
    // =========================================================================
    // Pulsing Turquoise Front Courtyard Fountain
    const fX = 4.6;
    const fZ = 4.5;
    const fBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.1, 0.55, 16), this.mat.mansionCreamMarble);
    fBasin.position.set(fX, 0.55, fZ);
    const fWater = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.6, 14), this.mat.poolTileBlue);
    fWater.position.set(fX, 0.58, fZ);
    const fJet = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.55, 2.2, 8), this.mat.waterfallBlue);
    fJet.position.set(fX, 1.75, fZ);
    fJet.userData.isAnimated = true;
    g.add(fBasin, fWater, fJet);

    // Private Mini Basketball Half-Court (Right Lawn x = +12.2, z = +2.8)
    const ctX = 12.2;
    const ctZ = 2.8;
    const courtFloor = new THREE.Mesh(this._boxGeo(6.4, 0.14, 5.4), this.mat.mobileBlue);
    courtFloor.position.set(ctX, 0.31, ctZ);
    const courtKey = new THREE.Mesh(this._boxGeo(2.2, 0.16, 2.6), this.mat.biryaniOrange);
    courtKey.position.set(ctX, 0.32, ctZ - 1.2);
    const hoopPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 6), this.mat.cinemaObsidian);
    hoopPole.position.set(ctX, 1.9, ctZ - 2.5);
    const backboard = new THREE.Mesh(this._boxGeo(1.6, 1.05, 0.1), this.mat.glass);
    backboard.position.set(ctX, 3.25, ctZ - 2.35);
    const hoopRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 6, 12), this.mat.oyoRed);
    hoopRim.rotation.x = Math.PI / 2;
    hoopRim.position.set(ctX, 2.95, ctZ - 2.02);
    g.add(courtFloor, courtKey, hoopPole, backboard, hoopRim);

    // Outdoor Cinema / Party Deck (Right Rear x = +12.2, z = -3.4)
    const cinScreen = new THREE.Mesh(this._boxGeo(4.8, 2.6, 0.22), this.mat.cinemaObsidian);
    cinScreen.position.set(ctX, 2.2, -6.2);
    const cinGlow = new THREE.Mesh(this._boxGeo(4.3, 2.15, 0.26), this.mat.cinemaScreenGlow);
    cinGlow.position.set(ctX, 2.2, -6.16);
    [-1.4, 0, 1.4].forEach((sx) => {
      const seat = new THREE.Mesh(this._boxGeo(1.1, 0.65, 1.1), this.mat.cinemaNeonPink);
      seat.position.set(ctX + sx, 0.6, -3.2);
      g.add(seat);
    });
    g.add(cinScreen, cinGlow);

    // =========================================================================
    // 8. ROOFTOP SKY-DECK: 🚁 HELIPAD + HELI, 🏊 INFINITY POOL, 🔥 FIRE-PIT, 🪩 DJ + RGB FLOOR, 👑 CROWN & 🛸 DRONES!
    // =========================================================================
    const deckY = 10.1;

    // A. Private Rooftop Helipad ('H') + Sleek Luxury Mini Helicopter (Spinning Rotor!)
    const hpX = palX - 5.2;
    const hpZ = palZ;
    const hPad = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.75, 0.18, 18), this.mat.tarmacGrey);
    hPad.position.set(hpX, deckY + 0.08, hpZ);
    const hRing = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.48, 20), this.mat.petrolYellow);
    hRing.rotation.x = -Math.PI / 2;
    hRing.position.set(hpX, deckY + 0.2, hpZ);
    const heliBody = new THREE.Mesh(this._boxGeo(1.4, 1.0, 2.6), this.mat.mansionBlackMarble);
    heliBody.position.set(hpX, deckY + 0.95, hpZ);
    const heliGlass = new THREE.Mesh(this._boxGeo(1.25, 0.65, 1.1), this.mat.glass);
    heliGlass.position.set(hpX, deckY + 1.05, hpZ + 0.85);
    const heliTail = new THREE.Mesh(this._boxGeo(0.28, 0.3, 2.2), this.mat.mansionGoldTrim);
    heliTail.position.set(hpX, deckY + 1.05, hpZ - 1.8);
    const rotorHub = new THREE.Group();
    rotorHub.position.set(hpX, deckY + 1.62, hpZ);
    const blade1 = new THREE.Mesh(this._boxGeo(4.4, 0.06, 0.22), this.mat.rotorBlade);
    const blade2 = new THREE.Mesh(this._boxGeo(0.22, 0.06, 4.4), this.mat.rotorBlade);
    rotorHub.add(blade1, blade2);
    rotorHub.userData.isAnimated = true;
    g.add(hPad, hRing, heliBody, heliGlass, heliTail, rotorHub);
    this.turntableRotors.push({ plotId, mesh: rotorHub, speed: 6.5 });

    // B. Rooftop Sky-Deck Infinity Pool + Sun Loungers
    const poolX = palX + 4.4;
    const poolZ = palZ + 1.1;
    const infPool = new THREE.Mesh(this._boxGeo(5.8, 0.55, 3.2), this.mat.poolTileBlue);
    infPool.position.set(poolX, deckY + 0.28, poolZ);
    const infGlass = new THREE.Mesh(this._boxGeo(6.0, 0.65, 3.4), this.mat.glass);
    infGlass.position.set(poolX, deckY + 0.34, poolZ);
    g.add(infPool, infGlass);

    // C. Glowing Sunken Fire-Pit & Glass Gazebo Lounge (Flickering Flame!)
    const fpX = palX + 0.2;
    const fpZ = palZ + 1.8;
    const fpRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.24, 8, 16), this.mat.mansionCreamMarble);
    fpRing.rotation.x = Math.PI / 2;
    fpRing.position.set(fpX, deckY + 0.28, fpZ);
    const fireFlame = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 8), this.mat.rocketFlame);
    fireFlame.position.set(fpX, deckY + 0.72, fpZ);
    fireFlame.userData.isAnimated = true;
    g.add(fpRing, fireFlame);

    // D. Rooftop DJ Booth & Color-Cycling RGB Dance Floor!
    const djX = palX + 4.4;
    const djZ = palZ - 2.0;
    const djConsole = new THREE.Mesh(this._boxGeo(2.4, 0.95, 0.75), this.mat.cinemaNeonPink);
    djConsole.position.set(djX, deckY + 0.5, djZ - 0.8);
    const rgbTiles = [];
    const tileCols = [0x22d3ee, 0xec4899, 0xfacc15, 0xa855f7];
    for (let tx = 0; tx < 3; tx++) {
      const tMat = new THREE.MeshBasicMaterial({ color: tileCols[tx % tileCols.length] });
      const tile = new THREE.Mesh(this._boxGeo(1.4, 0.1, 1.4), tMat);
      tile.position.set(djX - 1.5 + tx * 1.5, deckY + 0.14, djZ + 0.45);
      tile.userData.isAnimated = true;
      g.add(tile);
      rgbTiles.push({ mat: tMat, idx: tx });
    }
    g.add(djConsole);

    // E. Rotating 3D Golden Crown Emblem Floating Above Penthouse Roof!
    const crownGrp = new THREE.Group();
    crownGrp.position.set(palX, deckY + 3.2, palZ - 1.6);
    const cBand = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.22, 8, 18), this.mat.mansionGoldTrim);
    cBand.rotation.x = Math.PI / 2;
    crownGrp.add(cBand);
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.95, 6), this.mat.mansionGoldTrim);
      spike.position.set(Math.cos(a) * 1.25, 0.55, Math.sin(a) * 1.25);
      crownGrp.add(spike);
    }
    crownGrp.userData.isAnimated = true;
    g.add(crownGrp);
    this.turntableRotors.push({ plotId, mesh: crownGrp, speed: 0.9 });

    // F. 2 Orbiting VIP Security / Camera Drones!
    const drones = [];
    for (let d = 0; d < 2; d++) {
      const dr = new THREE.Group();
      const dBody = new THREE.Mesh(this._boxGeo(0.8, 0.24, 0.8), this.mat.wallWhite);
      const dLed = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), d === 0 ? this.mat.cinemaNeonCyan : this.mat.mansionGoldTrim);
      dLed.position.y = -0.2;
      dr.add(dBody, dLed);
      dr.userData.isAnimated = true;
      g.add(dr);
      drones.push({ mesh: dr, radius: 10.5 + d * 3.0, speed: 1.05 + d * 0.35, baseY: deckY + 3.6 + d * 1.6, phase: d * Math.PI });
    }

    // Palm Trees framing the Luxury Villa Courtyard!
    [[-10.2, 5.2], [7.8, 5.2], [14.8, -5.8]].forEach(([px, pz]) => {
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 4.4, 5), this.mat.treeTrunk);
      tr.position.set(px, 2.4, pz);
      const lf = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), this.mat.treeLeaf);
      lf.position.set(px, 4.8, pz);
      g.add(tr, lf);
    });

    // Night Mode Golden & Cyan Sky Spotlights!
    const villaSpots = [
      { x: palX - 7.8, y: deckY + 0.1, z: palZ + 3.2 },
      { x: palX + 7.8, y: deckY + 0.1, z: palZ + 3.2 },
      { x: palX - 7.8, y: deckY + 0.1, z: palZ - 3.2 },
      { x: palX + 7.8, y: deckY + 0.1, z: palZ - 3.2 }
    ];
    this._attachSkyDiscoLights(g, plotId, villaSpots, [0xfacc15, 0x22d3ee, 0xf59e0b, 0xec4899], null, { x: palX, y: deckY + 2.5, z: palZ });

    // Register Live Animations (Elevator, Fire-Pit, Fountain, Drones & RGB Dance Floor!)
    this.v37Animations.push({
      plotId,
      type: "billionaire_villa",
      elevCabin,
      fireFlame,
      fJet,
      drones,
      rgbTiles,
      palX,
      palZ
    });

    g.userData.labelY = 16.2;
    return g;
  }
};
