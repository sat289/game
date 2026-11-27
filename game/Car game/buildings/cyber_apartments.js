// buildings/cyber_apartments.js
// BUILDING F — CYBER APARTMENTS (Twin Charcoal/White Towers, Multi-Color Neon Balconies, Sky-Gardens + Walk-In Lobby & Furnished Suite)
window.ApexBuildings = window.ApexBuildings || {};
window.ApexBuildings.cyber_apartments = function createCyberApartmentsBuilding() {
  const U = window.ApexBuildingUtils;
  const root = new THREE.Group();
  root.name = 'Building_CyberApartments';

  const W = 24, D = 16.5, roomH = 4.6, floorY = 0.22;

  const charcoalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.25 });
  const whiteTrim   = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35, metalness: 0.12 });
  const intWallMat  = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 });
  const floorMat    = new THREE.MeshStandardMaterial({
    map: U.makeTileFloorTexture('#0f172a', '#1e293b', 8, 'rgba(56,189,248,0.28)'),
    roughness: 0.22, metalness: 0.18
  });

  // 1. Sleek Urban Sidewalk Base with Planters & Street Trees
  const pad = new THREE.Mesh(
    new THREE.BoxGeometry(W + 4.5, 0.22, D + 6.5),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
  );
  pad.position.set(0, 0.11, 1.5);
  pad.receiveShadow = true;
  root.add(pad);
  [[-W / 2 - 1.2, D / 2 + 1.8], [W / 2 + 1.2, D / 2 + 1.8], [-W / 2 - 1.2, -D / 2 + 1.5], [W / 2 + 1.2, -D / 2 + 1.5]].forEach(([tx, tz]) => {
    const tr = U.createTree(0.92, 0x713f12, 0x22c55e);
    tr.position.set(tx, 0.22, tz);
    root.add(tr);
  });

  // 2. Walkable Ground-Floor Lobby + Furnished Cyber Apartment Suite Shell
  const shellData = U.buildWalkInShell({
    width: W, depth: D, roomH, wallT: 0.65, doorGapHalf: 2.8,
    extMat: charcoalMat, intWallMat, floorMat,
    ceilColor: 0x0f172a, ledColor: 0x38bdf8, frameColor: 0x0ea5e9, glassColor: 0x38bdf8, floorY
  });
  root.add(shellData.shell);

  // Ground-Level Neon "APARTMENTS" Entrance Sign
  const entSign = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 1.15, 0.3),
    new THREE.MeshBasicMaterial({ map: U.makeSignTexture('APARTMENTS', '#0f172a', '#e0f2fe', '#a855f7', 512, 110, 56) })
  );
  entSign.position.set(0, floorY + roomH + 0.55, D / 2 + 0.28);
  root.add(entSign);

  // 3. Twin High-Rise Cyber Towers with Multi-Color Glowing LED Balconies (Exact match to Building F!)
  const upY = floorY + roomH + 0.26;
  const balconyColors = [0x06b6d4, 0xec4899, 0x22c55e, 0xfacc15, 0xa855f7, 0xf97316];
  const balconyMats = [];

  // Central dark glass elevator core linking both wings
  const coreWinTex = U.makeWindowStripTexture('#0f172a', '#1e3a5f', '#38bdf8', 4, 8, 0.55);
  const coreTower = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 17.5, 11.8),
    new THREE.MeshStandardMaterial({ map: coreWinTex, roughness: 0.22, metalness: 0.5 })
  );
  coreTower.position.set(0, upY + 8.75, -1.2);
  coreTower.castShadow = true;
  root.add(coreTower);

  // Left (6-story) & Right (5-story) Residential Wings with Glowing Multi-Color Balconies
  [
    { x: -7.2, floors: 6 },
    { x:  7.2, floors: 5 }
  ].forEach((wing, wIdx) => {
    const wH = wing.floors * 2.75;
    const body = new THREE.Mesh(new THREE.BoxGeometry(8.2, wH, 13.6), charcoalMat);
    body.position.set(wing.x, upY + wH / 2, -0.5);
    body.castShadow = true;
    root.add(body);

    // White architectural vertical frame pillars
    [-4.1, 4.1].forEach((px) => {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.42, wH + 0.3, 13.9), whiteTrim);
      pil.position.set(wing.x + px, upY + wH / 2, -0.5);
      root.add(pil);
    });

    // Multi-Color Glowing Balconies stacked on every floor!
    for (let fl = 0; fl < wing.floors; fl++) {
      const fy = upY + 0.35 + fl * 2.75;
      const colHex = balconyColors[(fl + wIdx * 2) % balconyColors.length];
      // White concrete slab
      const slab = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.24, 1.55), whiteTrim);
      slab.position.set(wing.x, fy, 6.75);
      // Glowing tinted LED glass railing
      const railMat = new THREE.MeshStandardMaterial({
        color: colHex, emissive: colHex, emissiveIntensity: 0.65,
        transparent: true, opacity: 0.74, roughness: 0.12
      });
      balconyMats.push({ mat: railMat, phase: fl * 0.9 + wIdx * 1.7 });
      const rail = new THREE.Mesh(new THREE.BoxGeometry(7.9, 1.05, 0.14), railMat);
      rail.position.set(wing.x, fy + 0.65, 7.42);
      // Glowing interior apartment window backing behind balcony
      const winBack = new THREE.Mesh(
        new THREE.PlaneGeometry(7.2, 1.85),
        new THREE.MeshBasicMaterial({ color: colHex, transparent: true, opacity: 0.38 })
      );
      winBack.position.set(wing.x, fy + 1.25, 6.32);
      root.add(slab, rail, winBack);
    }

    // Lush Green Rooftop Sky-Garden on top of each Wing!
    const roofY = upY + wH + 0.15;
    const gardenTurf = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 0.22, 12.2),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.85 })
    );
    gardenTurf.position.set(wing.x, roofY, -0.5);
    root.add(gardenTurf);
    for (let b = 0; b < 5; b++) {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.65 + (b % 2) * 0.2, 8, 7),
        new THREE.MeshStandardMaterial({ color: b % 2 === 0 ? 0x22c55e : 0x15803d, roughness: 0.8 })
      );
      bush.position.set(wing.x - 2.2 + (b % 3) * 2.2, roofY + 0.55, -3.5 + Math.floor(b / 3) * 5.2);
      root.add(bush);
    }
  });

  // Rooftop "APARTMENTS" Top Crown Sign
  const roofSign = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 1.45, 0.35),
    new THREE.MeshBasicMaterial({ map: U.makeSignTexture('APARTMENTS', '#0f172a', '#ffffff', '#06b6d4', 512, 128, 62) })
  );
  roofSign.position.set(0, upY + 18.2, 4.4);
  root.add(roofSign);

  // ===========================================================================
  // 4. REAL WALKABLE INTERIOR (Modern Lobby + Full Furnished Ground-Floor Cyber Apartment Suite!)
  // ===========================================================================
  const interior = new THREE.Group();
  root.add(interior);

  // LEFT HALF: Sleek Lobby (Concierge Desk, Brass Mailboxes, Glowing Elevator Doors)
  const concDesk = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.05, 1.1), whiteTrim);
  concDesk.position.set(-6.4, floorY + 0.52, 1.8);
  const concNeon = new THREE.Mesh(new THREE.BoxGeometry(3.82, 0.10, 0.1), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
  concNeon.position.set(-6.4, floorY + 0.92, 2.38);
  const concierge = U.createMiniNPC(0x06b6d4, 0x0f172a);
  concierge.position.set(-6.4, floorY, 0.8);
  interior.add(concDesk, concNeon, concierge);

  // Twin Glowing Cyber Elevator Doors at Back-Left Wall
  [-8.2, -5.2].forEach((ex) => {
    const elDoor = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 3.1, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
    );
    elDoor.position.set(ex, floorY + 1.55, -D / 2 + 0.82);
    const elInd = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.08), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    elInd.position.set(ex, floorY + 3.4, -D / 2 + 0.85);
    interior.add(elDoor, elInd);
  });

  // Partition Glass Divider separating Lobby from Walk-In Open-Plan Apartment Suite (with wide open walkway!)
  const partGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, roomH - 0.2, 6.2),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 })
  );
  partGlass.position.set(-1.6, floorY + roomH / 2, -D / 2 + 3.5);
  interior.add(partGlass);

  // RIGHT HALF: Full Furnished Modern Cyber Apartment Suite (Living Room + Kitchen + Bedroom!)
  // Living Room: Plush Sofa, Glass Coffee Table & Glowing Widescreen Cyber TV!
  const sofaMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.78 });
  const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.48, 1.15), sofaMat); sofaSeat.position.set(4.5, floorY + 0.24, 1.8);
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.72, 0.26), sofaMat); sofaBack.position.set(4.5, floorY + 0.72, 2.28);
  const coffeeTbl = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.42, 0.95),
    new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.65, metalness: 0.5 })
  );
  coffeeTbl.position.set(4.5, floorY + 0.21, 0.2);
  const tvConsole = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.58, 0.65), whiteTrim); tvConsole.position.set(4.5, floorY + 0.29, -1.6);
  const tvScreen = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 1.45, 0.1),
    new THREE.MeshBasicMaterial({ map: U.makeSignTexture('CYBER TV 4K', '#020617', '#ec4899', '#06b6d4', 384, 216, 42, 'ST GAMES LIVE') })
  );
  tvScreen.position.set(4.5, floorY + 1.55, -1.65);
  interior.add(sofaSeat, sofaBack, coffeeTbl, tvConsole, tvScreen);

  // Modern Kitchenette along Back-Right Wall (Counter, Sink, Stainless Fridge)
  const kCounter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.98, 1.05), whiteTrim);
  kCounter.position.set(3.2, floorY + 0.49, -D / 2 + 1.45);
  const fridge = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 2.35, 1.05),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.75, roughness: 0.22 })
  );
  fridge.position.set(0.3, floorY + 1.18, -D / 2 + 1.45);
  interior.add(kCounter, fridge);

  // Cozy Bedroom Corner on Far-Right (Queen Bed, Neon Headboard & Glowing Bedside Lamps)
  const bedBase = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.45, 2.8), whiteTrim); bedBase.position.set(W / 2 - 2.6, floorY + 0.22, -3.4);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.26, 2.0), new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.8 }));
  blanket.position.set(W / 2 - 2.6, floorY + 0.54, -2.95);
  const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.48), whiteTrim); pillow1.position.set(W / 2 - 3.15, floorY + 0.56, -4.45);
  const pillow2 = pillow1.clone(); pillow2.position.x = W / 2 - 2.05;
  const lampGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.42, 10), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
  lampGlow.position.set(W / 2 - 4.2, floorY + 0.85, -4.45);
  interior.add(bedBase, blanket, pillow1, pillow2, lampGlow);

  function update(dt, now) {
    // Gentle cyberpunk neon balcony pulse
    balconyMats.forEach((bm) => {
      bm.mat.emissiveIntensity = 0.52 + Math.sin(now * 0.0022 + bm.phase) * 0.22;
    });
  }

  return {
    id: 'cyber_apartments',
    title: 'CYBER APARTMENTS',
    mapTag: 'A',
    mapColor: '#06b6d4',
    width: W, depth: D,
    group: root,
    doorL: shellData.doorL,
    doorR: shellData.doorR,
    doorZ: shellData.doorZ,
    doorGapHalf: shellData.doorGapHalf,
    colliders: shellData.colliders,
    interiorSpawn: { x: 0, y: floorY + 1.65, z: D / 2 - 1.8, lookAt: [3.5, floorY + 1.4, -1.5] },
    update
  };
};
