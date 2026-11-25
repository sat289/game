import * as THREE from "three";

/**
 * 🏛️ REAL 3D BUILDING & LANDMARK INTERIORS BUILDER (v34)
 * Builds authentic, detailed walkable 3D rooms for:
 * - mansion (Sheru Bhai Golden-Diamond TV, Luxurious Glowing Walls & Palace)
 * - theater (Multi-Floor Screen 1, Screen 2, Floor 2 IMAX Screen 3 + LIVE PLAYING MOVIES!)
 * - gym (Treadmills, Squat Rack, Dumbbells, Bench Press, Punching Bag & Mirrors!)
 * - malls (Atrium/Escalator/Shops + D-Mart Grocery Aisles & Billing)
 * - school (Classroom Desks, Chalkboard & Library)
 * - stadium (22-Yard Pitch, Live Scoreboard, Stands & Floodlights)
 * - beauty (Hollywood Vanity Mirrors, Styling Chairs & Sparkles)
 * - landmarks (Hospital, Police HQ, Temple Sanctum, OYO/Hostel, Wine Shop, Medical, Showrooms, Cafe/Biryani, Photo Studio, Swimming Pool)
 * - buildings (Luxury Living Room, 4K TV, Dining & Bedroom)
 */

export function makeInteriorSign(title, sub = "", bg = "#0f172a", fg = "#facc15", w = 5.0, h = 1.1) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 120);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 38px sans-serif";
  ctx.fillText(title, 256, sub ? 46 : 64, 470);
  if (sub) {
    ctx.fillStyle = fg;
    ctx.font = "800 23px sans-serif";
    ctx.fillText(sub, 256, 94, 470);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

function makeAnimatedScreenCanvas(mode, label, w, h) {
  const c = document.createElement("canvas");
  c.width = 384;
  c.height = 216;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  return {
    mesh,
    update(t) {
      if (mode === "diamond_tv") {
        // Golden & Diamond 4K Luxury TV Broadcast inside Sheru Bhai Mansion!
        const g = ctx.createLinearGradient(0, 0, 384, 216);
        g.addColorStop(0, "#0b0f19");
        g.addColorStop(0.5, "#3b2307");
        g.addColorStop(1, "#090d16");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 384, 216);

        // Sparkling animated diamond particles
        for (let i = 0; i < 16; i++) {
          const sx = ((i * 53 + t * 38) % 384);
          const sy = 24 + ((i * 37) % 168);
          const r = 2.5 + Math.abs(Math.sin(t * 4 + i)) * 3.5;
          ctx.fillStyle = i % 2 === 0 ? "#e0f2fe" : "#fde047";
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 6;
        ctx.strokeRect(8, 8, 368, 200);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde047";
        ctx.font = "900 34px Georgia, serif";
        ctx.fillText("👑 SHERU BHAI TV", 192, 76);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "900 20px sans-serif";
        ctx.fillText("💎 8K GOLDEN DIAMOND EDITION 💎", 192, 124);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 16px sans-serif";
        ctx.fillText(`LIVE CITY FEED • ${Math.floor(t) % 60 < 30 ? "ROYAL PALACE" : "STGAMES.ONLINE"}`, 192, 166);
      } else {
        // LIVE ANIMATED ACTION MOVIE PLAYING INSIDE CINEMA SCREENS!
        const sceneIdx = Math.floor(t / 4.5) % 3;
        const grad = ctx.createLinearGradient(0, 0, 0, 216);
        if (sceneIdx === 0) { grad.addColorStop(0, "#1e1b4b"); grad.addColorStop(1, "#7f1d1d"); }
        else if (sceneIdx === 1) { grad.addColorStop(0, "#082f49"); grad.addColorStop(1, "#0f172a"); }
        else { grad.addColorStop(0, "#451a03"); grad.addColorStop(1, "#09090b"); }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 384, 216);

        // Moving cinematic action skyline + helicopter/hero silhouette + glowing action bursts!
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        for (let b = 0; b < 9; b++) {
          const bx = ((b * 52 - t * 34) % 440 + 440) % 440 - 30;
          const bh = 45 + (b % 4) * 24;
          ctx.fillRect(bx, 180 - bh, 36, bh);
        }
        // Moving Hero Car / Action Flash across Screen!
        const hx = ((t * 95) % 440) - 30;
        ctx.fillStyle = "#facc15";
        ctx.beginPath();
        ctx.arc(hx, 128 + Math.sin(t * 7) * 8, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(249,115,22,0.55)";
        ctx.beginPath();
        ctx.arc(hx - 22, 130, 18 + Math.sin(t * 14) * 6, 0, Math.PI * 2);
        ctx.fill();

        // Cinema Letterbox Bars + Movie Title + Live Progress Bar
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, 384, 26);
        ctx.fillRect(0, 184, 384, 32);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fef08a";
        ctx.font = "900 22px sans-serif";
        ctx.fillText(`🎬 ${label}`, 192, 58, 350);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 13px sans-serif";
        const subs = ["“SHERU BHAI RETURNS — FULL ACTION!”", "“IMAX 3D • DOLBY ATMOS SOUND”", "“BLOCKBUSTER SHOW RUNNING LIVE!”"];
        ctx.fillText(subs[sceneIdx], 192, 198);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(16, 180, ((t * 14) % 352), 3);
      }
      tex.needsUpdate = true;
    }
  };
}

export function buildInteriorRoom(scene, sceneType, bType, owner, mats, buildShell, animatedMeshes, dynamicScreens, floorHelpers) {
  const {
    matMarble, matCream, matDark, matBlackMarble, matGold, matDiamond,
    matGlass, matPink, matRoseGold, matCrimson, matGreen, matWood,
    matGlowGold, matGlowCyan, matGlowPink, matRubber, matSteel
  } = mats;

  let title = `🏡 ${owner}'s BUILDING`;
  let sub = "Walk around & explore inside in 3D!";

  // =========================================================
  // 1. 👑 SHERU BHAI ROYAL GOLDEN & DIAMOND PALACE (`mansion.html`)
  // =========================================================
  if (sceneType === "mansion") {
    title = "👑 SHERU BHAI GOLDEN-DIAMOND PALACE";
    sub = `Owner: ${owner} • Golden Diamond TV, Glowing Luxury Walls & Throne`;
    buildShell(36, 13.5, 36, matBlackMarble, matBlackMarble, matBlackMarble, false);

    // Glowing Golden Floor Runway Border + Diamond Carpet!
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 28), matCrimson);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.04, 2);
    [-2.95, 2.95].forEach((gx) => {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 28), matGlowGold);
      strip.rotation.x = -Math.PI / 2;
      strip.position.set(gx, 0.05, 2);
      scene.add(strip);
    });
    scene.add(carpet);

    // Luxurious Glowing Gold & Diamond-Studded Side Walls (Left & Right)
    [-17.4, 17.4].forEach((wx) => {
      const side = wx < 0 ? 1 : -1;
      for (let z = -12; z <= 12; z += 6) {
        const goldPillar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 13.0, 0.9), matGold);
        goldPillar.position.set(wx, 6.5, z);
        const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 12.2, 0.28), matGlowGold);
        neonStrip.position.set(wx + side * 0.36, 6.5, z);
        const diamondStud = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), matDiamond);
        diamondStud.position.set(wx + side * 0.55, 6.5, z + 3);
        scene.add(goldPillar, neonStrip, diamondStud);
        animatedMeshes.push({ mesh: diamondStud, rotY: 1.4 });
      }
    });

    // 💎 GIANT GOLDEN & DIAMOND 4K LIVE WALL TV ON LEFT LUXURY LOUNGE WALL!
    const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(0.75, 5.4, 9.6), matGold);
    tvFrame.position.set(-16.9, 5.2, 0);
    // Sparkling Diamond Bezel Studs around the Golden TV!
    for (let d = -4.2; d <= 4.2; d += 1.4) {
      const dt = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), matDiamond);
      dt.position.set(-16.45, 7.85, d);
      const db = dt.clone();
      db.position.y = 2.55;
      scene.add(dt, db);
    }
    const diamondTv = makeAnimatedScreenCanvas("diamond_tv", "SHERU BHAI TV", 8.6, 4.6);
    diamondTv.mesh.rotation.y = Math.PI / 2;
    diamondTv.mesh.position.set(-16.48, 5.2, 0);
    scene.add(tvFrame, diamondTv.mesh);
    dynamicScreens.push(diamondTv);

    // Luxury White-Gold Velvet VIP Sofa Lounge facing the Golden Diamond TV!
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.25, 7.6), matMarble);
    sofa.position.set(-9.5, 0.62, 0);
    const sofaGold = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.28, 7.8), matGold);
    sofaGold.position.set(-9.5, 0.16, 0);
    const coffeeTbl = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.62, 4.2), matDiamond);
    coffeeTbl.position.set(-12.8, 0.34, 0);
    scene.add(sofa, sofaGold, coffeeTbl);

    // Right Lounge: Indoor Glowing Diamond & Gold Fountain Pool!
    const inPool = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.4, 0.72, 18), matGold);
    inPool.position.set(10.5, 0.36, 0);
    const inWat = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.78, 16), matGlowCyan);
    inWat.position.set(10.5, 0.38, 0);
    const diamondCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.45, 0), matDiamond);
    diamondCrystal.position.set(10.5, 2.8, 0);
    scene.add(inPool, inWat, diamondCrystal);
    animatedMeshes.push({ mesh: diamondCrystal, rotY: 1.2 });

    // Giant Sparkling Diamond & Gold Chandelier Hanging Center + Warm Palace Glow!
    const chand = new THREE.Group();
    chand.position.set(0, 10.2, 0);
    const cR1 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.18, 8, 24), matGold);
    cR1.rotation.x = Math.PI / 2;
    const cR2 = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.14, 8, 20), matGlowCyan);
    cR2.rotation.x = Math.PI / 2;
    cR2.position.y = -0.9;
    const cDia = new THREE.Mesh(new THREE.OctahedronGeometry(1.15, 0), matDiamond);
    cDia.position.y = -1.6;
    chand.add(cR1, cR2, cDia);
    const pLight = new THREE.PointLight(0xfef08a, 4.2, 42);
    pLight.position.set(0, 8.6, 0);
    scene.add(chand, pLight);
    animatedMeshes.push({ mesh: chand, rotY: 0.55 });

    // Raised Black-Gold Marble Stage + GOLDEN DIAMOND LION THRONE!
    const stage = new THREE.Mesh(new THREE.BoxGeometry(12.2, 1.25, 7.4), matGold);
    stage.position.set(0, 0.62, -13.0);
    const throneBase = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.15, 2.4), matGold);
    throneBase.position.set(0, 1.85, -13.8);
    const throneBack = new THREE.Mesh(new THREE.BoxGeometry(3.0, 4.2, 0.48), matGold);
    throneBack.position.set(0, 4.0, -14.8);
    const throneDia = new THREE.Mesh(new THREE.OctahedronGeometry(0.68, 0), matDiamond);
    throneDia.position.set(0, 6.45, -14.8);
    const throneCush = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.38, 1.9), matCrimson);
    throneCush.position.set(0, 2.52, -13.8);
    const plaque = makeInteriorSign("👑 SHERU BHAI PALACE", "GOLDEN DIAMOND LUXURY MANSION", "#09090b", "#facc15", 11.4, 2.5);
    plaque.position.set(0, 9.4, -17.6);
    scene.add(stage, throneBase, throneBack, throneDia, throneCush, plaque);
    animatedMeshes.push({ mesh: throneDia, rotY: 1.5 });

    return { title, sub };
  }

  // =========================================================
  // 2. 🎭 MULTI-FLOOR MOVIE THEATER WITH LIVE PLAYING SCREENS (`theater.html`)
  // =========================================================
  if (sceneType === "theater") {
    title = `🎭 ${owner} — MULTI-FLOOR CINEMA`;
    sub = "Floor 1: Screens 1 & 2  •  Floor 2: IMAX Screen 3 (Movies Playing LIVE!)";
    buildShell(46, 15.5, 44, matBlackMarble, matBlackMarble, matBlackMarble, false);

    // Center Grand Lobby Red Carpet + Popcorn & Ticket Counter
    const lobbyCarpet = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 40), matCrimson);
    lobbyCarpet.rotation.x = -Math.PI / 2;
    lobbyCarpet.position.set(0, 0.03, 0);
    const popDesk = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.2, 2.2), matCrimson);
    popDesk.position.set(0, 0.6, 9.5);
    const popSign = makeInteriorSign("🍿 POPCORN & TICKETS", "FLOOR 1: SCREEN 1 & 2  •  FLOOR 2: IMAX 3", "#991b1b", "#fde047", 7.8, 1.4);
    popSign.position.set(0, 3.6, 9.5);
    scene.add(lobbyCarpet, popDesk, popSign);

    // Build Ground Floor Screen 1 (Left Room x = -15) & Screen 2 (Right Room x = +15)
    const buildCinemaRoom = (cx, baseY, cz, screenLabel, movieTitle, wallSide) => {
      // Partition walls with wide open auditorium entry doorway!
      const partWall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7.2, 22), matDark);
      partWall.position.set(cx + wallSide * 7.8, baseY + 3.6, cz - 7);
      const roomSign = makeInteriorSign(screenLabel, `NOW PLAYING: ${movieTitle}`, "#09090b", "#facc15", 6.2, 1.25);
      roomSign.rotation.y = wallSide > 0 ? Math.PI / 2 : -Math.PI / 2;
      roomSign.position.set(cx + wallSide * 8.2, baseY + 5.6, cz + 6.5);
      scene.add(partWall, roomSign);

      // Giant Cinema Screen with LIVE PLAYING ANIMATED MOVIE!
      const screenBorder = new THREE.Mesh(new THREE.BoxGeometry(13.2, 6.4, 0.35), matDark);
      screenBorder.position.set(cx, baseY + 3.8, cz - 17.5);
      const liveMovie = makeAnimatedScreenCanvas("movie", movieTitle, 12.2, 5.6);
      liveMovie.mesh.position.set(cx, baseY + 3.8, cz - 17.25);
      scene.add(screenBorder, liveMovie.mesh);
      dynamicScreens.push(liveMovie);

      // Glowing Volumetric Cinema Projector Beam from Back Booth to Screen!
      const beamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
      const beam = new THREE.Mesh(new THREE.ConeGeometry(4.2, 17, 10, 1, true), beamMat);
      beam.rotation.x = -Math.PI / 2;
      beam.position.set(cx, baseY + 4.8, cz - 8.5);
      scene.add(beam);

      // 4 Tiered Red Velvet Cinema Seat Rows!
      for (let r = 0; r < 4; r++) {
        const seatRow = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.85, 1.15), matCrimson);
        seatRow.position.set(cx, baseY + 0.55 + r * 0.45, cz - 9.5 + r * 2.8);
        const riser = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.25 + r * 0.45, 2.4), matDark);
        riser.position.set(cx, baseY + (0.25 + r * 0.45) / 2, cz - 9.5 + r * 2.8);
        scene.add(riser, seatRow);
      }
      // Glowing Neon Aisle Floor Strips
      [-5.6, 5.6].forEach((ax) => {
        const aisleLed = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 12.5), matGlowCyan);
        aisleLed.position.set(cx + ax, baseY + 0.1, cz - 5.5);
        scene.add(aisleLed);
      });
    };

    buildCinemaRoom(-15.0, 0, -2, "SCREEN 1 • FLOOR 1", "SALAAR 2 • REBEL", 1);
    buildCinemaRoom(15.0, 0, -2, "SCREEN 2 • FLOOR 1", "PUSHPA 2 • THE RULE", -1);

    // FLOOR 2 MEZZANINE DECK (Y = 7.4) + IMAX SCREEN 3 + WALKABLE RAMP!
    const f2Slab = new THREE.Mesh(new THREE.BoxGeometry(45, 0.45, 24), matDark);
    f2Slab.position.set(0, 7.2, -9.5);
    const f2Rail = new THREE.Mesh(new THREE.BoxGeometry(34, 1.15, 0.16), matGlass);
    f2Rail.position.set(0, 8.0, 2.4);
    const f2Sign = makeInteriorSign("FLOOR 2 • IMAX 3D SCREEN 3", "TAP 'FLOOR 2' BUTTON OR WALK UP RAMP!", "#0284c7", "#fef08a", 9.6, 1.45);
    f2Sign.position.set(0, 8.6, 2.6);
    scene.add(f2Slab, f2Rail, f2Sign);

    // Live Playing IMAX 3D Screen 3 on Floor 2!
    const imaxMovie = makeAnimatedScreenCanvas("movie", "SHERU BHAI • IMAX 3D", 18.0, 6.2);
    imaxMovie.mesh.position.set(0, 11.2, -21.2);
    scene.add(imaxMovie.mesh);
    dynamicScreens.push(imaxMovie);
    for (let r = 0; r < 4; r++) {
      const sRow = new THREE.Mesh(new THREE.BoxGeometry(15.0, 0.9, 1.2), matCrimson);
      sRow.position.set(0, 7.9 + r * 0.35, -13.0 + r * 2.8);
      scene.add(sRow);
    }

    // Register Floor Switcher (Floor 1 <-> Floor 2 IMAX!)
    if (floorHelpers && floorHelpers.enableFloors) {
      floorHelpers.enableFloors([
        { label: "Floor 1 (Screens 1 & 2)", y: 0, z: 14 },
        { label: "Floor 2 (IMAX Screen 3)", y: 7.45, z: -1 }
      ]);
    }

    return { title, sub };
  }

  // =========================================================
  // 3. 🏋️ REAL 3D FITNESS GYM (`gym.html`)
  // =========================================================
  if (sceneType === "gym") {
    title = `🏋️ ${owner} — PRO FITNESS GYM`;
    sub = "Treadmills, Barbell Squat Rack, Dumbbells, Bench Press & Punching Bag";
    buildShell(32, 9.5, 30, matRubber, matDark, matDark, false);

    // Neon Fitness Banner + Glowing Gym Ceiling Bars
    const gBanner = makeInteriorSign(`${owner.toUpperCase()} FITNESS GYM`, "NO PAIN NO GAIN • CARDIO & WEIGHTS", "#09090b", "#facc15", 13.0, 2.2);
    gBanner.position.set(0, 6.6, -14.6);
    [-6, 6].forEach((cx) => {
      const neon = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 22), matGlowCyan);
      neon.position.set(cx, 9.1, 0);
      scene.add(neon);
    });
    scene.add(gBanner);

    // 4 Realistic Running Treadmills with Animated Rolling Belts (Left Side x = -11)!
    for (let t = 0; t < 4; t++) {
      const tz = -9 + t * 5.2;
      const base = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.32, 1.6), matSteel);
      base.position.set(-11.2, 0.18, tz);
      const belt = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.36, 1.2), matBlackMarble);
      belt.position.set(-11.2, 0.19, tz);
      const consolePost = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.2, 1.4), matDark);
      consolePost.position.set(-12.9, 1.25, tz);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 1.05), matGlowCyan);
      screen.position.set(-12.75, 2.25, tz);
      scene.add(base, belt, consolePost, screen);
    }

    // Center Heavy Barbell Squat Rack + 2 Weightlifting Bench Press Stations!
    const rackL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.2, 0.25), matCrimson);
    rackL.position.set(-1.8, 2.1, -9.5);
    const rackR = rackL.clone();
    rackR.position.x = 1.8;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5.2, 8), matSteel);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2.4, -9.5);
    [-2.2, 2.2].forEach((px) => {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.24, 12), matBlackMarble);
      plate.rotation.z = Math.PI / 2;
      plate.position.set(px, 2.4, -9.5);
      scene.add(plate);
    });
    scene.add(rackL, rackR, bar);

    // 2 Bench Press Stations
    [-3.5, 3.5].forEach((bx) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.72, 3.2), matCrimson);
      bench.position.set(bx, 0.45, -1.5);
      const bBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8), matSteel);
      bBar.rotation.z = Math.PI / 2;
      bBar.position.set(bx, 1.65, -2.5);
      scene.add(bench, bBar);
    });

    // Right Side: Chrome Dumbbell Rack + Glowing Full-Length Gym Wall Mirrors + Hanging Red Punching Bag!
    const dRack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.35, 14.0), matDark);
    dRack.position.set(13.2, 0.68, -2);
    for (let d = -6; d <= 6; d += 1.5) {
      const db = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.85, 8), matSteel);
      db.rotation.z = Math.PI / 2;
      db.position.set(13.2, 1.5, -2 + d);
      scene.add(db);
    }
    const wallMirror = new THREE.Mesh(new THREE.BoxGeometry(0.15, 4.4, 15.0), matGlass);
    wallMirror.position.set(15.6, 2.8, -2);
    // Hanging Red Boxing Punching Bag swaying gently!
    const bagPivot = new THREE.Group();
    bagPivot.position.set(9.2, 7.5, 7.5);
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), matSteel);
    chain.position.y = -1.6;
    const pBag = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.4, 12), matCrimson);
    pBag.position.y = -4.2;
    bagPivot.add(chain, pBag);
    scene.add(dRack, wallMirror, bagPivot);
    animatedMeshes.push({ mesh: bagPivot, swayZ: 0.14 });

    return { title, sub };
  }

  // =========================================================
  // 4. 🏬 MALLS & D-MART (`malls.html`)
  // =========================================================
  if (sceneType === "malls") {
    const isDMart = bType === "dmart";
    title = isDMart ? "🛒 D-MART HYPERMARKET INSIDE" : `🏬 ${owner} SHOPPING MALL`;
    sub = isDMart ? "Fresh Groceries, Offers & Billing Counters" : "Multi-Floor Atrium, Escalators & Branded Stores";
    buildShell(36, 12, 36, matMarble, matCream, matGlass, false);
    const skyLight = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 28), matGlowCyan);
    skyLight.position.set(0, 11.7, 0);
    scene.add(skyLight);

    if (isDMart) {
      const shelfCols = [matGreen, matGold, matCrimson, matPink];
      [-11, -5.5, 5.5, 11].forEach((ax, i) => {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.4, 18), matMarble);
        rack.position.set(ax, 1.7, -3);
        const goods = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.8, 16.8), shelfCols[i % shelfCols.length]);
        goods.position.set(ax, 2.4, -3);
        scene.add(rack, goods);
      });
      [-7, 0, 7].forEach((bx) => {
        const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 1.4), matGreen);
        desk.position.set(bx, 0.55, 10.5);
        scene.add(desk);
      });
      const dmBoard = makeInteriorSign("DMart • DAILY SAVINGS", "GROCERIES • HOMEWARE • MIN 7% OFF", "#15803d", "#facc15", 13.0, 2.4);
      dmBoard.position.set(0, 7.6, -17.6);
      scene.add(dmBoard);
    } else {
      const fPool = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 0.7, 16), matMarble);
      fPool.position.set(0, 0.35, -1);
      const fWat = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.76, 14), matGlowCyan);
      fWat.position.set(0, 0.38, -1);
      const esc = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 12.5), matDark);
      esc.position.set(0, 3.2, -10.5);
      esc.rotation.x = -0.45;
      const mezz = new THREE.Mesh(new THREE.BoxGeometry(34, 0.45, 7.5), matMarble);
      mezz.position.set(0, 6.0, -14.2);
      const mezzRail = new THREE.Mesh(new THREE.BoxGeometry(34, 1.1, 0.16), matGlass);
      mezzRail.position.set(0, 6.7, -10.5);
      scene.add(fPool, fWat, esc, mezz, mezzRail);
      [
        { x: -15.5, z: -7, title: "APPLE ZONE", bg: "#0f172a", fg: "#38bdf8" },
        { x: -15.5, z: 5,  title: "TRENDS FASHION", bg: "#7e22ce", fg: "#facc15" },
        { x: 15.5,  z: -7, title: "FOOD COURT", bg: "#b91c1c", fg: "#fde047" },
        { x: 15.5,  z: 5,  title: "ST GAMING ZONE", bg: "#0284c7", fg: "#ffffff" }
      ].forEach((sh) => {
        const box = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.8, 9.2), matDark);
        box.position.set(sh.x, 2.4, sh.z);
        const brd = makeInteriorSign(sh.title, "OPEN NOW", sh.bg, sh.fg, 6.4, 1.3);
        brd.rotation.y = sh.x < 0 ? Math.PI / 2 : -Math.PI / 2;
        brd.position.set(sh.x + (sh.x < 0 ? 2.2 : -2.2), 4.2, sh.z);
        scene.add(box, brd);
      });
    }
    return { title, sub };
  }

  // =========================================================
  // 5. 🏫 SCHOOL / ITI / LIBRARY (`school.html`)
  // =========================================================
  if (sceneType === "school") {
    title = `🏫 ${owner} — CAMPUS INSIDE`;
    sub = "Smart Classroom, Chalkboard, Desks & Study Library";
    buildShell(30, 9.5, 30, matCream, matMarble, matMarble, false);
    const board = makeInteriorSign("WELCOME TO SHERU BHAI SCHOOL", "PYTHON • 3D GRAPHICS • DIPLOMA CSE", "#14532d", "#fef08a", 12.0, 3.6);
    board.position.set(0, 4.2, -14.6);
    const podium = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.1, 1.6), matWood);
    podium.position.set(0, 0.55, -10.5);
    scene.add(board, podium);
    for (let r = 0; r < 4; r++) {
      for (let c = -1; c <= 1; c++) {
        const dx = c * 5.8, dz = -6.0 + r * 4.2;
        const desk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.95, 1.2), matWood);
        desk.position.set(dx, 0.48, dz);
        const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.7), matDark);
        bench.position.set(dx, 0.28, dz + 1.15);
        scene.add(desk, bench);
      }
    }
    [-14.2, 14.2].forEach((bx) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.6, 16), matWood);
      shelf.position.set(bx, 2.3, -2);
      scene.add(shelf);
    });
    return { title, sub };
  }

  // =========================================================
  // 6. 🏏 CRICKET STADIUM ARENA (`stadium.html`)
  // =========================================================
  if (sceneType === "stadium") {
    title = `🏏 ${owner} — CRICKET ARENA`;
    sub = "Walk on the Live 22-Yard Pitch, Stumps, Floodlights & Live Scoreboard!";
    const turfMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });
    const pitchMat = new THREE.MeshLambertMaterial({ color: 0xd6b588 });
    buildShell(54, 10, 54, turfMat, matDark, matDark, true);
    const pitch = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 22), pitchMat);
    pitch.position.set(0, 0.04, 0);
    scene.add(pitch);
    [-9.5, 9.5].forEach((sz) => {
      [-0.25, 0, 0.25].forEach((sx) => {
        const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), matGold);
        stump.position.set(sx, 0.65, sz);
        scene.add(stump);
      });
    });
    [-22, 22].forEach((sx) => {
      for (let t = 0; t < 3; t++) {
        const tier = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6 + t * 1.4, 44), t % 2 === 0 ? matCrimson : matDark);
        tier.position.set(sx + (sx > 0 ? t * 2.2 : -t * 2.2), (1.6 + t * 1.4) / 2, 0);
        scene.add(tier);
      }
    });
    const score = makeInteriorSign("SHERU XI  218/2 (18.4)", "FOLLOWERS XI • LIVE STADIUM MATCH", "#020617", "#4ade80", 18.0, 4.2);
    score.position.set(0, 12.5, -26.4);
    scene.add(score);
    [[-24, -24], [24, -24], [-24, 24], [24, 24]].forEach(([fx, fz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 22, 8), matDark);
      pole.position.set(fx, 11, fz);
      const flood = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 0.8), matGlowGold);
      flood.position.set(fx * 0.92, 21.5, fz * 0.92);
      flood.lookAt(0, 0, 0);
      scene.add(pole, flood);
    });
    return { title, sub };
  }

  // =========================================================
  // 7. 💄 LUXURY BEAUTY PARLOUR & SPA (`beauty-parlour.html`)
  // =========================================================
  if (sceneType === "beauty") {
    title = `💄 ${owner} — BEAUTY PARLOUR & SPA`;
    sub = "Hollywood Vanity Mirrors, Luxury Styling Chairs & Glow Spa";
    buildShell(30, 9.5, 28, matMarble, new THREE.MeshLambertMaterial({ color: 0xfce7f3 }), matMarble, false);
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 22), matPink);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.03, 1);
    const salonSign = makeInteriorSign("✨ LUXURY BEAUTY PARLOUR ✨", "BRIDAL MAKEUP • HAIR SPA • GLOW STUDIO", "#831843", "#fbcfe8", 11.6, 2.2);
    salonSign.position.set(0, 6.2, -13.6);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.25, 1.8), matRoseGold);
    desk.position.set(0, 0.62, -9.8);
    scene.add(carpet, salonSign, desk);
    [-13.8, 13.8].forEach((wx) => {
      [-6.5, 0, 6.5].forEach((wz) => {
        const mirFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.2, 2.4), matGold);
        mirFrame.position.set(wx, 3.2, wz);
        const mirGlass = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.8, 2.0), matGlowCyan);
        mirGlass.position.set(wx + (wx < 0 ? 0.05 : -0.05), 3.2, wz);
        const counter = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 2.6), matMarble);
        counter.position.set(wx + (wx < 0 ? 0.9 : -0.9), 0.48, wz);
        const chairSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.55, 0.85, 10), matPink);
        chairSeat.position.set(wx + (wx < 0 ? 2.5 : -2.5), 0.65, wz);
        scene.add(mirFrame, mirGlass, counter, chairSeat);
      });
    });
    const sparkGroup = new THREE.Group();
    sparkGroup.position.set(0, 5.5, 0);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), i % 2 === 0 ? matGlowPink : matGlowGold);
      sp.position.set(Math.cos(a) * 6.5, Math.sin(i * 1.4) * 1.6, Math.sin(a) * 6.5);
      sparkGroup.add(sp);
    }
    scene.add(sparkGroup);
    animatedMeshes.push({ mesh: sparkGroup, rotY: 0.65 });
    return { title, sub };
  }

  // =========================================================
  // 8. 🏛️ ALL DEDICATED REAL CITY LANDMARKS (`landmarks.html`)
  //    Hospital, Police HQ, Temple, OYO/Hostel, Wine Shop, Medical, Showrooms, Cafe/Biryani, Photo Studio, Swimming Pool!
  // =========================================================
  if (sceneType === "landmarks") {
    if (bType === "hospital") {
      title = `🏥 ${owner} — SUPER HOSPITAL ER`;
      sub = "Emergency Beds, ECG Heart Monitors & 24/7 Pharmacy";
      buildShell(32, 9.5, 30, matMarble, matMarble, matMarble, false);
      const hSign = makeInteriorSign("🏥 SUPER SPECIALITY HOSPITAL", "24/7 EMERGENCY • ICU • PHARMACY", "#dc2626", "#ffffff", 12.0, 2.0);
      hSign.position.set(0, 6.5, -14.6);
      const recep = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.2, 2.0), matGreen);
      recep.position.set(0, 0.6, -10.5);
      scene.add(hSign, recep);
      [-10.5, 10.5].forEach((bx) => {
        [-5, 3].forEach((bz) => {
          const bed = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.9, 2.0), matMarble);
          bed.position.set(bx, 0.45, bz);
          const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 1.9), matGlowCyan);
          blanket.position.set(bx, 0.98, bz);
          const ecg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.35), matGreen);
          ecg.position.set(bx + (bx < 0 ? -2.2 : 2.2), 1.8, bz);
          scene.add(bed, blanket, ecg);
        });
      });
      return { title, sub };
    }

    if (bType === "police_station") {
      title = `🚓 ${owner} — POLICE HQ`;
      sub = "SI Duty Desk, Case Board & Iron-Bar Lockup Jail Cells";
      buildShell(30, 9.5, 28, matMarble, matCream, matDark, false);
      const pSign = makeInteriorSign("🚓 SHERU BHAI POLICE HQ", "LAW & ORDER • 100 EMERGENCY", "#1e3a8a", "#facc15", 11.5, 2.0);
      pSign.position.set(0, 6.5, -13.6);
      const siDesk = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.15, 2.0), matWood);
      siDesk.position.set(0, 0.58, -8.5);
      scene.add(pSign, siDesk);
      // Iron-Bar Lockup Cells on Left & Right Walls!
      [-12.5, 12.5].forEach((cx) => {
        const cellWall = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.4, 0.3), matDark);
        cellWall.position.set(cx, 2.2, -5.0);
        scene.add(cellWall);
        for (let bz = -4.2; bz <= 4.2; bz += 0.9) {
          const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.4, 6), matSteel);
          bar.position.set(cx + (cx < 0 ? 2.2 : -2.2), 2.2, bz);
          scene.add(bar);
        }
      });
      return { title, sub };
    }

    if (bType === "tirumala_temple") {
      title = "🛕 SRI VENKATESWARA TEMPLE SANCTUM";
      sub = "OM NAMO VENKATESAYA • Golden Garbhagriha & Deepam Lamps";
      buildShell(32, 11.5, 32, matMarble, matCream, matBlackMarble, false);
      const tSign = makeInteriorSign("🛕 OM NAMO VENKATESAYA", "SACRED GARBHAGRIHA SANCTUM", "#991b1b", "#fde047", 11.8, 2.2);
      tSign.position.set(0, 8.2, -15.6);
      const shrine = new THREE.Mesh(new THREE.BoxGeometry(8.5, 6.2, 6.0), matGold);
      shrine.position.set(0, 3.1, -11.5);
      const idolGlow = new THREE.Mesh(new THREE.SphereGeometry(2.2, 14, 12), matGlowGold);
      idolGlow.position.set(0, 3.8, -8.2);
      const gLight = new THREE.PointLight(0xfde047, 4.5, 36);
      gLight.position.set(0, 6.5, -6.0);
      scene.add(tSign, shrine, idolGlow, gLight);
      [-6.5, 6.5].forEach((px) => {
        [-6, 0, 6].forEach((pz) => {
          const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 11.0, 10), matGold);
          pil.position.set(px, 5.5, pz);
          const flame = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), matGlowGold);
          flame.position.set(px * 0.72, 1.8, pz);
          scene.add(pil, flame);
        });
      });
      return { title, sub };
    }

    if (bType === "wine_shop") {
      title = `🍾 ${owner} — ROYAL WINES & LOUNGE`;
      sub = "Backlit Bottle Shelves, Permit Counter & Chilled Coolers";
      buildShell(28, 9.0, 26, matBlackMarble, matCrimson, matBlackMarble, false);
      const wSign = makeInteriorSign("🍾 ROYAL WINES & SPIRITS", "CHILLED BEER • FINE WINES", "#7f1d1d", "#fde047", 10.6, 2.0);
      wSign.position.set(0, 6.2, -12.6);
      const counter = new THREE.Mesh(new THREE.BoxGeometry(12.0, 1.3, 1.6), matWood);
      counter.position.set(0, 0.65, -7.2);
      scene.add(wSign, counter);
      for (let sy = 0; sy < 3; sy++) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(14, 0.16, 0.8), matGold);
        shelf.position.set(0, 1.6 + sy * 1.15, -11.6);
        scene.add(shelf);
        for (let bx = -6; bx <= 6; bx += 1.0) {
          const btl = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.72, 8), (Math.round(bx) + sy) % 2 === 0 ? matGreen : matGold);
          btl.position.set(bx, 2.05 + sy * 1.15, -11.6);
          scene.add(btl);
        }
      }
      return { title, sub };
    }

    if (bType === "medical_shop") {
      title = `💊 ${owner} — 24/7 MEDICAL PHARMACY`;
      sub = "Illuminated Medicine Racks & Express Pharmacy Counter";
      buildShell(24, 8.5, 24, matMarble, matMarble, matMarble, false);
      const mSign = makeInteriorSign("💊 24/7 MEDICAL & PHARMACY", "GENUINE MEDICINES • OPEN ALWAYS", "#059669", "#ffffff", 10.0, 1.8);
      mSign.position.set(0, 5.8, -11.6);
      const counter = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.2, 1.5), matGreen);
      counter.position.set(0, 0.6, -6.5);
      scene.add(mSign, counter);
      [-9.5, 9.5].forEach((rx) => {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.2, 14), matCream);
        rack.position.set(rx, 2.1, -2);
        scene.add(rack);
      });
      return { title, sub };
    }

    if (bType.includes("showroom") || bType === "mobile_shop") {
      const isMobile = bType.includes("mobile");
      title = isMobile ? `📱 ${owner} — 5G MOBILE HUB` : `🚘 ${owner} — LUXURY SHOWROOM FLOOR`;
      sub = isMobile ? "Live Demo Smartphone Tables & 5G Accessories" : "Rotating Hero Turntable & Flagship Fleet Inside";
      buildShell(34, 10.5, 32, matMarble, matBlackMarble, matDark, false);
      const sSign = makeInteriorSign(`${owner.toUpperCase()} SHOWROOM`, isMobile ? "iPHONE • SAMSUNG • REDMI • 5G" : "LUXURY FLAGSHIP FLOOR", "#0f172a", "#38bdf8", 12.6, 2.1);
      sSign.position.set(0, 7.2, -15.6);
      scene.add(sSign);
      [-8.5, 0, 8.5].forEach((px, idx) => {
        const ped = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 0.45, 20), matBlackMarble);
        ped.position.set(px, 0.25, -4);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.14, 8, 22), idx === 1 ? matGlowGold : matGlowCyan);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(px, 0.5, -4);
        const disp = isMobile
          ? new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 0.28), matGlowCyan)
          : new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.35, 4.8), idx === 0 ? matCrimson : idx === 1 ? matGold : matMarble);
        disp.position.set(px, isMobile ? 2.1 : 1.15, -4);
        scene.add(ped, ring, disp);
        animatedMeshes.push({ mesh: disp, rotY: 0.65 });
      });
      return { title, sub };
    }

    if (bType === "swimming_pool") {
      title = `🏊 ${owner} — OLYMPIC POOL CLUB`;
      sub = "Crystal-Blue Olympic Lanes, Diving Board & Poolside Lounge";
      buildShell(36, 10, 32, matMarble, matCream, matGlass, false);
      const pool = new THREE.Mesh(new THREE.BoxGeometry(22, 0.14, 15), matGlowCyan);
      pool.position.set(0, 0.08, -2);
      [-4, 0, 4].forEach((lz) => {
        const rope = new THREE.Mesh(new THREE.BoxGeometry(21.4, 0.14, 0.18), matCrimson);
        rope.position.set(0, 0.22, -2 + lz);
        scene.add(rope);
      });
      const dive = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 1.2), matGold);
      dive.position.set(-11.8, 2.2, -2);
      scene.add(pool, dive);
      return { title, sub };
    }

    // Cafe / Biryani / Ice Cream / Photo Studio / OYO / Hostel / Remaining Landmarks!
    const isFood = ["cafe", "shop", "biryani_point", "ice_cream_shop", "veg_shop"].includes(bType);
    const isPhoto = bType === "photo_studio";
    const isOyo = bType === "hotel_oyo" || bType === "hostel";
    title = isFood ? `🍲 ${owner} — CAFE & FOOD LOUNGE` : isPhoto ? `📸 ${owner} — PRO PHOTO STUDIO` : isOyo ? `🏨 ${owner} — OYO LUXURY LOBBY & SUITE` : `🏛️ ${owner} — LANDMARK INSIDE`;
    sub = isFood ? "Dining Tables, Live Kitchen Counter & Cozy Lighting" : isPhoto ? "Cyclorama Backdrop, Softbox Studio Lights & Camera Rig" : "Explore Inside in Real 3D";
    buildShell(28, 9.5, 28, matMarble, isPhoto ? matDark : matCream, matMarble, false);
    const lSign = makeInteriorSign(owner.toUpperCase(), sub.toUpperCase(), isOyo ? "#ee2e24" : "#0f172a", "#fde047", 11.0, 2.0);
    lSign.position.set(0, 6.6, -13.6);
    scene.add(lSign);

    if (isPhoto) {
      const cyc = new THREE.Mesh(new THREE.BoxGeometry(14, 6.5, 0.35), matMarble);
      cyc.position.set(0, 3.25, -10.5);
      [-5.5, 5.5].forEach((lx) => {
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 4.5, 6), matSteel);
        stand.position.set(lx, 2.25, -4);
        const softbox = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 0.5), matGlowGold);
        softbox.position.set(lx, 4.6, -4);
        softbox.lookAt(0, 2.2, -10.5);
        scene.add(stand, softbox);
      });
      scene.add(cyc);
    } else if (isFood) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.25, 1.8), matWood);
      bar.position.set(0, 0.62, -9.5);
      const handi = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 8), matGold);
      handi.position.set(0, 1.6, -9.5);
      scene.add(bar, handi);
      [-7, 0, 7].forEach((tx) => {
        [-2, 4.5].forEach((tz) => {
          const tbl = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.25, 0.95, 12), matWood);
          tbl.position.set(tx, 0.48, tz);
          scene.add(tbl);
        });
      });
    } else {
      // OYO / Hostel Reception + Plush VIP Suite Bed
      const desk = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.2, 1.6), matCrimson);
      desk.position.set(-5.5, 0.6, -9.0);
      const bed = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.95, 6.6), matMarble);
      bed.position.set(6.5, 0.48, -5.0);
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.35, 4.6), matCrimson);
      blanket.position.set(6.5, 1.0, -4.0);
      const hb = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.6, 0.4), matGold);
      hb.position.set(6.5, 1.3, -8.4);
      scene.add(desk, bed, blanket, hb);
    }
    return { title, sub };
  }

  // =========================================================
  // 9. 🏡 LUXURY FOLLOWER HOUSE / TOWER INSIDE (`buildings.html`)
  // =========================================================
  title = `🏡 ${owner}'s HOUSE INSIDE`;
  sub = "Luxury Living Room, 4K TV Lounge, Dining & King Bedroom";
  buildShell(28, 9.5, 28, matMarble, matCream, matMarble, false);
  const bSign = makeInteriorSign(owner.toUpperCase(), "WELCOME HOME • SHERU BHAI CITY", "#0f172a", "#38bdf8", 10.6, 2.0);
  bSign.position.set(0, 6.8, -13.6);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 7.2), matCrimson);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-4.5, 0.03, -2.5);
  const sofa = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.25, 2.1), matDark);
  sofa.position.set(-4.5, 0.65, 0.5);
  const table = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.65, 1.6), matGlass);
  table.position.set(-4.5, 0.35, -2.5);
  const tvUnit = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.0, 1.2), matWood);
  tvUnit.position.set(-4.5, 0.5, -6.4);
  const houseTv = makeAnimatedScreenCanvas("diamond_tv", "SHERU TV", 5.6, 3.0);
  houseTv.mesh.position.set(-4.5, 3.0, -6.3);
  dynamicScreens.push(houseTv);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.95, 6.4), matMarble);
  bed.position.set(7.5, 0.48, -4.5);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.35, 4.4), matPink);
  blanket.position.set(7.5, 1.0, -3.5);
  const headb = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.6, 0.4), matGold);
  headb.position.set(7.5, 1.3, -7.8);
  scene.add(bSign, rug, sofa, table, tvUnit, houseTv.mesh, bed, blanket, headb);

  return { title, sub };
}
