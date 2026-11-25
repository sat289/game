import * as THREE from "three";

/**
 * 🚀🏟️ SHERU BHAI CITY OUTSKIRTS MEGA LANDMARKS (v34)
 * 1. Remodeled ISRO Sriharikota Second Launch Pad (Open SW Coastal Peninsula — ZERO Mountain Overlap!)
 * 2. International Outskirts Cricket Stadium (SE Outskirts — Live Updating Scoreboard, Floodlights & Seats!)
 */
export const outskirtsMethods = {
  /**
   * 🚀 REMODELED ISRO SRIHARIKOTA ROCKET LAUNCHPAD (`ROCKET_PAD`)
   * Placed cleanly on an open South-West coastal apron between the Railway Corridor and Araku Foothills
   * with a strict mountain/river exclusion zone so NO trees, hills, or rivers ever overlap it!
   */
  _buildRocketLaunchpad(ringRadius) {
    const rx = -(ringRadius + 46);
    const rz = ringRadius + 54;
    this.rocketPadPos = { x: rx, z: rz };

    const rg = new THREE.Group();
    rg.position.set(rx, 0, rz);

    // 1. Wide Paved Spaceport Access Boulevard connecting straight North to the South Outer Ring Road!
    const roadLen = 54;
    const spRoad = new THREE.Mesh(this._boxGeo(8.2, 0.12, roadLen), this.mat.road);
    spRoad.position.set(18, 0.04, -roadLen / 2);
    const spDash = new THREE.Mesh(new THREE.PlaneGeometry(0.28, roadLen - 2), this.mat.stripe);
    spDash.rotation.x = -Math.PI / 2;
    spDash.position.set(18, 0.12, -roadLen / 2);
    rg.add(spRoad, spDash);

    // 2. Massive Elevated Clear Concrete Launch Complex Apron + Deep Flame Deflector Trench!
    const groundPad = new THREE.Mesh(this._boxGeo(48.0, 0.42, 42.0), this.mat.concrete);
    groundPad.position.y = 0.21;
    const hazardBorder = new THREE.Mesh(this._boxGeo(48.8, 0.2, 42.8), this.mat.petrolYellow);
    hazardBorder.position.y = 0.11;

    const launchPedestal = new THREE.Mesh(this._boxGeo(15.0, 2.2, 15.0), this.mat.stoneDark);
    launchPedestal.position.set(0, 1.3, 0);
    const flameTrench = new THREE.Mesh(this._boxGeo(7.0, 0.5, 16.5), this.mat.cinemaObsidian);
    flameTrench.position.set(0, 2.45, 0);
    const safetyRing = new THREE.Mesh(new THREE.RingGeometry(10.5, 11.8, 28), this.mat.petrolYellow);
    safetyRing.rotation.x = -Math.PI / 2;
    safetyRing.position.set(0, 0.48, 0);

    // 3. REALISTIC STEEL-LATTICE UMBILICAL LAUNCH TOWER GANTRY + 4 LIGHTNING ARRESTOR MASTS!
    const gantry = new THREE.Group();
    gantry.position.set(-7.6, 2.4, 0);
    // 4 Vertical Steel Corner Columns
    [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].forEach(([gx, gz]) => {
      const col = new THREE.Mesh(this._boxGeo(0.38, 26.0, 0.38), this.mat.rocketGantryRed);
      col.position.set(gx, 13.0, gz);
      gantry.add(col);
    });
    // Horizontal Platform Decks + Alternating Red/White Structural Cross-Bands
    for (let lvl = 0; lvl < 7; lvl++) {
      const ly = lvl * 3.6 + 1.8;
      const deck = new THREE.Mesh(this._boxGeo(3.8, 0.32, 3.8), lvl % 2 === 0 ? this.mat.wallWhite : this.mat.rocketGantryRed);
      deck.position.y = ly;
      gantry.add(deck);
    }
    // 3 Umbilical Fuel & Crew Access Swing Arms reaching straight to the Rocket!
    [7.5, 14.5, 20.5].forEach((ay) => {
      const arm = new THREE.Mesh(this._boxGeo(6.4, 0.5, 0.85), this.mat.rocketGantryRed);
      arm.position.set(3.8, ay, 0);
      gantry.add(arm);
    });
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const topBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), beaconMat);
    topBeacon.position.set(0, 26.8, 0);
    gantry.add(topBeacon);

    // 4 Corner Lightning Protection Masts + High-Power Launchpad Floodlights!
    [[-18, -16], [18, -16], [-18, 16], [18, 16]].forEach(([mx, mz]) => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.36, 24, 6), this.mat.chrome);
      mast.position.set(mx, 12.2, mz);
      const lamp = new THREE.Mesh(this._boxGeo(1.8, 0.75, 0.45), this.mat.floodlightGlow);
      lamp.position.set(mx * 0.94, 23.6, mz * 0.94);
      lamp.lookAt(0, 6, 0);
      rg.add(mast, lamp);
    });

    // Mission Control Center + Rotating Satellite Tracking Dish + Countdown LED Board!
    const mcc = new THREE.Mesh(this._boxGeo(13.5, 4.4, 7.6), this.mat.wallWhite);
    mcc.position.set(14.5, 2.6, 12.2);
    const mccGlass = new THREE.Mesh(this._boxGeo(10.8, 1.9, 0.16), this.mat.glass);
    mccGlass.position.set(14.5, 3.1, 8.38);
    const radarDish = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.2, 12, 1, true), this.mat.wallWhite);
    radarDish.rotation.x = -0.8;
    radarDish.position.set(18.5, 6.2, 12.2);
    const spBoard = this._makeBuildingBoard("ISRO • SRIHARIKOTA SLP", "LVM3 HEAVY ROCKET • LIVE LAUNCH", "#020617", "#f97316", 13.0, 1.65);
    spBoard.position.set(14.5, 5.8, 8.42);

    // 4. 🚀 DETAILED ISRO LVM3 / CHANDRAYAAN HEAVY ROCKET!
    const rocket = new THREE.Group();
    rocket.position.set(0, 2.5, 0);

    const core1 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 10.5, 16), this.mat.rocketWhite);
    core1.position.y = 5.8;
    const saffronBand = new THREE.Mesh(new THREE.CylinderGeometry(1.44, 1.44, 0.85, 16), this.mat.templeSaffron);
    saffronBand.position.y = 9.8;
    const greenBand = new THREE.Mesh(new THREE.CylinderGeometry(1.44, 1.44, 0.85, 16), this.mat.dmartBrightGreen);
    greenBand.position.y = 8.2;
    const stage2 = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 5.8, 16), this.mat.cinemaObsidian);
    stage2.position.y = 13.8;
    const fairing = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.38, 4.8, 16), this.mat.rocketWhite);
    fairing.position.y = 18.8;
    const noseCone = new THREE.Mesh(new THREE.ConeGeometry(1.75, 5.0, 16), this.mat.rocketWhite);
    noseCone.position.y = 23.7;

    // Dual S200 Heavy Strap-On Solid Boosters
    [-2.25, 2.25].forEach((bx) => {
      const bBody = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.72, 11.2, 12), this.mat.rocketWhite);
      bBody.position.set(bx, 6.2, 0);
      const bBand = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.7, 12), this.mat.rocketGantryRed);
      bBand.position.set(bx, 9.6, 0);
      const bTip = new THREE.Mesh(new THREE.ConeGeometry(0.68, 2.2, 12), this.mat.rocketGantryRed);
      bTip.position.set(bx, 12.9, 0);
      const bNoz = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.0, 10), this.mat.cinemaObsidian);
      bNoz.position.set(bx, 0.5, 0);
      rocket.add(bBody, bBand, bTip, bNoz);
    });
    const mainNozzle = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.35, 12), this.mat.cinemaObsidian);
    mainNozzle.position.y = 0.65;

    // Blazing Exhaust Flame Plume Cone (Outer Orange + Inner White-Gold Core)
    const flameGroup = new THREE.Group();
    const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(2.6, 15.0, 12), this.mat.rocketFlame);
    outerFlame.rotation.x = Math.PI;
    outerFlame.position.y = -7.4;
    const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(1.3, 10.0, 10), this.mat.rocketFlameCore);
    innerFlame.rotation.x = Math.PI;
    innerFlame.position.y = -4.9;
    flameGroup.add(outerFlame, innerFlame);
    flameGroup.visible = false;

    rocket.add(core1, saffronBand, greenBand, stage2, fairing, noseCone, mainNozzle, flameGroup);

    // Expanding White Ignition Smoke Billows around Launch Trench
    const smokePuffs = [];
    const smokeGeo = new THREE.DodecahedronGeometry(2.6, 0);
    for (let s = 0; s < 10; s++) {
      const ang = (s / 10) * Math.PI * 2;
      const puff = new THREE.Mesh(smokeGeo, this.mat.rocketSmoke);
      puff.position.set(Math.cos(ang) * 4.0, 2.4, Math.sin(ang) * 4.0);
      puff.visible = false;
      rg.add(puff);
      smokePuffs.push({ mesh: puff, ang, baseR: 3.0 + (s % 2) * 1.6 });
    }

    const padSign = this._createNameSign("🚀 ISRO ROCKET LAUNCHPAD", "SRIHARIKOTA SLP • LIVE LIFTOFF", true);
    padSign.position.set(0, 30.5, 0);

    const padHit = new THREE.Mesh(this._boxGeo(46, 32, 42), this.mat.invisibleHitbox);
    padHit.position.set(0, 16, 0);
    padHit.userData.plotId = "ROCKET_PAD";
    this.plotHitboxes.push(padHit);

    rg.add(groundPad, hazardBorder, launchPedestal, flameTrench, safetyRing, gantry, mcc, mccGlass, radarDish, spBoard, rocket, padSign, padHit);
    this.cityGroup.add(rg);

    this.rocketSim = {
      rocket,
      flameGroup,
      smokePuffs,
      beaconMat,
      radarDish,
      baseY: 2.5
    };
  },

  /**
   * 🏏🏟️ INTERNATIONAL OUTSKIRTS CRICKET STADIUM (`OUTSKIRTS_STADIUM`)
   * Placed on the South-East City Outskirts with wide paved road connection,
   * multi-tier colorful spectator seats, lush outfield, 22-yard pitch, stumps,
   * 4 towering glowing floodlight towers, live cricketers & a LIVE UPDATING LED SCOREBOARD!
   */
  _buildOutskirtsCricketStadium(ringRadius) {
    const sx = ringRadius + 52;
    const sz = ringRadius + 54;
    this.outskirtsStadiumPos = { x: sx, z: sz };

    const st = new THREE.Group();
    st.position.set(sx, 0, sz);

    // 1. Wide Paved Stadium Boulevard connecting straight North to South/East Outer Ring Road!
    const connLen = 54;
    const stRoad = new THREE.Mesh(this._boxGeo(8.8, 0.12, connLen), this.mat.road);
    stRoad.position.set(-18, 0.04, -connLen / 2);
    const stDash = new THREE.Mesh(new THREE.PlaneGeometry(0.28, connLen - 2), this.mat.stripe);
    stDash.rotation.x = -Math.PI / 2;
    stDash.position.set(-18, 0.12, -connLen / 2);
    st.add(stRoad, stDash);

    // 2. Stadium Concrete Plaza + Oval Lush Green Cricket Outfield + White Boundary Rope + 22-Yard Pitch!
    const apron = new THREE.Mesh(new THREE.CylinderGeometry(34.5, 36.0, 0.35, 28), this.mat.concrete);
    apron.position.y = 0.18;
    const outfield = new THREE.Mesh(new THREE.CylinderGeometry(23.2, 23.2, 0.44, 28), this.mat.turf);
    outfield.position.y = 0.24;
    const innerRing = new THREE.Mesh(new THREE.RingGeometry(11.5, 11.85, 28), this.mat.stripe);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.5;
    const boundaryRope = new THREE.Mesh(new THREE.TorusGeometry(21.4, 0.22, 6, 32), this.mat.wallWhite);
    boundaryRope.rotation.x = Math.PI / 2;
    boundaryRope.position.y = 0.56;

    const pitch = new THREE.Mesh(this._boxGeo(3.2, 0.48, 14.5), this.mat.pitch);
    pitch.position.y = 0.26;
    // Wooden Stumps at both ends of the 22-yard pitch
    [-6.2, 6.2].forEach((wz) => {
      const stumps = new THREE.Mesh(this._boxGeo(0.65, 1.05, 0.14), this.mat.petrolYellow);
      stumps.position.set(0, 0.95, wz);
      st.add(stumps);
    });
    st.add(apron, outfield, innerRing, boundaryRope, pitch);

    // 3. MULTI-TIER OVAL SPECTATOR STANDS + COLORFUL STADIUM SEATING ROWS (InstancedMesh = Zero Lag!)
    const wallSegs = 24;
    const standR = 26.8;
    const outerWallGeo = this._boxGeo(7.6, 8.8, 3.6);
    const outerWallInst = new THREE.InstancedMesh(outerWallGeo, this.mat.wallWhite, wallSegs);
    const roofCanopyGeo = this._boxGeo(8.2, 0.55, 7.2);
    const roofInst = new THREE.InstancedMesh(roofCanopyGeo, this.mat.mobileBlue, wallSegs);

    const seatGeo = this._boxGeo(6.4, 1.05, 1.35);
    const seatColors = [this.mat.oyoRed, this.mat.mobileBlue, this.mat.petrolYellow];
    const seatInsts = seatColors.map((m) => new THREE.InstancedMesh(seatGeo, m, wallSegs));

    const dummy = new THREE.Object3D();
    for (let i = 0; i < wallSegs; i++) {
      const ang = (i / wallSegs) * Math.PI * 2;
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);

      // Leave clean Grand Entrance Gate gap facing North-West (-X / -Z)!
      const isGate = i === 15 || i === 16;
      const wx = cos * (standR + 2.8);
      const wz = sin * (standR + 2.8);
      dummy.position.set(wx, isGate ? 0.1 : 4.4, wz);
      dummy.rotation.set(0, -ang + Math.PI / 2, 0);
      dummy.scale.set(1, isGate ? 0.05 : 1, 1);
      dummy.updateMatrix();
      outerWallInst.setMatrixAt(i, dummy.matrix);

      // Sweeping Blue Stadium Canopy Roof overhead
      dummy.position.set(cos * (standR + 0.6), 9.6, sin * (standR + 0.6));
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      roofInst.setMatrixAt(i, dummy.matrix);

      // 3 Stepped Colorful Spectator Seating Tiers sloping up from the boundary!
      for (let tier = 0; tier < 3; tier++) {
        const sr = 23.6 + tier * 2.1;
        dummy.position.set(cos * sr, 1.1 + tier * 1.9, sin * sr);
        dummy.scale.set(1, isGate ? 0.01 : 1, 1);
        dummy.updateMatrix();
        seatInsts[tier].setMatrixAt(i, dummy.matrix);
      }
    }
    outerWallInst.instanceMatrix.needsUpdate = true;
    roofInst.instanceMatrix.needsUpdate = true;
    seatInsts.forEach((si) => { si.instanceMatrix.needsUpdate = true; st.add(si); });
    st.add(outerWallInst, roofInst);

    // 4. 4 TOWERING STADIUM FLOODLIGHT TOWERS WITH GLOWING LED BANKS!
    [[-24, -24], [24, -24], [-24, 24], [24, 24]].forEach(([fx, fz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.72, 26.5, 8), this.mat.cinemaObsidian);
      pole.position.set(fx, 13.2, fz);
      const lightRack = new THREE.Mesh(this._boxGeo(5.8, 3.2, 0.85), this.mat.cinemaObsidian);
      lightRack.position.set(fx * 0.94, 26.2, fz * 0.94);
      lightRack.lookAt(0, 0, 0);
      const ledFace = new THREE.Mesh(this._boxGeo(5.2, 2.6, 0.95), this.mat.floodlightGlow);
      ledFace.position.copy(lightRack.position);
      ledFace.quaternion.copy(lightRack.quaternion);
      st.add(pole, lightRack, ledFace);
    });

    // 5. 📺 GIANT LIVE UPDATING LED CRICKET SCOREBOARD (Dynamic Canvas Texture updated every few seconds!)
    const sbCanvas = document.createElement("canvas");
    sbCanvas.width = 512;
    sbCanvas.height = 192;
    const sbCtx = sbCanvas.getContext("2d");
    const sbTex = new THREE.CanvasTexture(sbCanvas);
    sbTex.colorSpace = THREE.SRGBColorSpace;
    const sbMat = new THREE.MeshBasicMaterial({ map: sbTex });

    const drawScoreboard = (runs, wkts, overs, lastBall) => {
      sbCtx.fillStyle = "#020617";
      sbCtx.fillRect(0, 0, 512, 192);
      sbCtx.strokeStyle = "#facc15";
      sbCtx.lineWidth = 8;
      sbCtx.strokeRect(4, 4, 504, 184);

      sbCtx.fillStyle = "#dc2626";
      sbCtx.fillRect(18, 16, 92, 30);
      sbCtx.fillStyle = "#ffffff";
      sbCtx.font = "900 18px sans-serif";
      sbCtx.textAlign = "center";
      sbCtx.textBaseline = "middle";
      sbCtx.fillText("● LIVE", 64, 32);

      sbCtx.fillStyle = "#38bdf8";
      sbCtx.font = "900 22px sans-serif";
      sbCtx.fillText("SHERU BHAI INTERNATIONAL STADIUM", 300, 32, 370);

      sbCtx.fillStyle = "#4ade80";
      sbCtx.font = "900 54px sans-serif";
      sbCtx.fillText(`SHERU XI  ${runs}/${wkts}`, 256, 96, 470);

      sbCtx.fillStyle = "#fde047";
      sbCtx.font = "800 24px sans-serif";
      sbCtx.fillText(`OVERS: ${overs}   •   LAST BALL: ${lastBall}`, 256, 152, 470);
      sbTex.needsUpdate = true;
    };
    drawScoreboard(214, 2, "18.4", "SIX! 🔥");

    const sbFrame = new THREE.Mesh(this._boxGeo(18.6, 7.2, 0.9), this.mat.cinemaObsidian);
    sbFrame.position.set(0, 14.5, -28.5);
    const sbScreen = new THREE.Mesh(new THREE.PlaneGeometry(17.8, 6.6), sbMat);
    sbScreen.position.set(0, 14.5, -28.0);
    const sbScreenBack = sbScreen.clone();
    sbScreenBack.rotation.y = Math.PI;
    sbScreenBack.position.z = -29.0;
    st.add(sbFrame, sbScreen, sbScreenBack);

    // 6. Live Animated Cricketers Playing on the Outfield + Floating Stadium Sign!
    const players = [];
    const bat1 = this._createCharacter({ shirtMat: this.mat.mobileBlue, pantsMat: this.mat.wallWhite, scale: 1.0 });
    bat1.position.set(0.4, 0.5, 5.2);
    const bowl1 = this._createCharacter({ shirtMat: this.mat.oyoRed, pantsMat: this.mat.wallWhite, scale: 1.0 });
    bowl1.position.set(-0.4, 0.5, -5.2);
    const field1 = this._createCharacter({ shirtMat: this.mat.oyoRed, pantsMat: this.mat.wallWhite, scale: 1.0 });
    field1.position.set(11, 0.5, 4);
    const field2 = this._createCharacter({ shirtMat: this.mat.oyoRed, pantsMat: this.mat.wallWhite, scale: 1.0 });
    field2.position.set(-12, 0.5, -3);
    st.add(bat1, bowl1, field1, field2);
    players.push(bat1, bowl1, field1, field2);

    const stSign = this._createNameSign("🏏 SHERU BHAI CRICKET STADIUM", "OUTSKIRTS ARENA • TAP TO ENTER INSIDE", true);
    stSign.position.set(0, 22.8, 0);

    const stHit = new THREE.Mesh(new THREE.CylinderGeometry(33, 33, 22, 16), this.mat.invisibleHitbox);
    stHit.position.set(0, 11, 0);
    stHit.userData.plotId = "OUTSKIRTS_STADIUM";
    this.plotHitboxes.push(stHit);

    st.add(stSign, stHit);
    this.cityGroup.add(st);

    this.outskirtsStadiumSim = {
      drawScoreboard,
      runs: 214,
      wkts: 2,
      balls: 112,
      timer: 0,
      players
    };
  }
};
