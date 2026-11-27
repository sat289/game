// buildings/hospital.js
// BUILDING A — CITY HOSPITAL (Matches exact preview design + full walkable Hospital Lobby & ER interior)
window.ApexBuildings = window.ApexBuildings || {};
window.ApexBuildings.hospital = function createHospitalBuilding() {
  const U = window.ApexBuildingUtils;
  const root = new THREE.Group();
  root.name = 'Building_Hospital';

  const W = 24, D = 16.5, roomH = 4.6, floorY = 0.22;

  // Materials matching Building A (crisp white walls, royal blue architectural trim, cool glass)
  const whiteWallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.38, metalness: 0.08 });
  const blueTrimMat  = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.32, metalness: 0.22 });
  const darkBlueMat  = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.38, metalness: 0.25 });
  const intWallMat   = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.55 });
  const tileFloorMat = new THREE.MeshStandardMaterial({
    map: U.makeTileFloorTexture('#f8fafc', '#e0f2fe', 10, 'rgba(37,99,235,0.14)'),
    roughness: 0.28, metalness: 0.08
  });

  // 1. Landscaped Ground Plinth & Green Perimeter Lawn with Corner Trees
  const asphaltPad = new THREE.Mesh(
    new THREE.BoxGeometry(W + 4.5, 0.22, D + 7.0),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
  );
  asphaltPad.position.set(0, 0.11, 1.5);
  asphaltPad.receiveShadow = true;
  root.add(asphaltPad);

  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.85 });
  [[-W / 2 - 1.35, 0.16, 0.5, 1.8, D + 3.0], [W / 2 + 1.35, 0.16, 0.5, 1.8, D + 3.0]].forEach(([lx, ly, lz, lw, ld]) => {
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.14, ld), lawnMat);
    lawn.position.set(lx, ly, lz);
    root.add(lawn);
  });
  [[-W / 2 - 1.4, -D / 2 + 1.0], [-W / 2 - 1.4, D / 2 + 1.2], [W / 2 + 1.4, -D / 2 + 1.0], [W / 2 + 1.4, D / 2 + 1.2]].forEach(([tx, tz]) => {
    const tr = U.createTree(1.05);
    tr.position.set(tx, 0.22, tz);
    root.add(tr);
  });

  // 2. Walkable Ground-Floor Shell with Automatic Sliding Glass Doors
  const shellData = U.buildWalkInShell({
    width: W, depth: D, roomH, wallT: 0.65, doorGapHalf: 2.8,
    extMat: whiteWallMat, intWallMat, floorMat: tileFloorMat,
    ceilColor: 0xf8fafc, ledColor: 0xe0f2fe, frameColor: 0x1d4ed8, glassColor: 0x7dd3fc, floorY
  });
  root.add(shellData.shell);

  // Blue architectural base stripe & mid cornice around ground floor
  const bandMat = blueTrimMat;
  const frontStripe = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.48, D + 0.3), bandMat);
  frontStripe.position.set(0, floorY + roomH + 0.22, 0);
  root.add(frontStripe);

  // Glowing Main Entrance Canopy
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.38, 2.8), blueTrimMat);
  canopy.position.set(0, floorY + roomH + 0.08, D / 2 + 1.3);
  const canopyGlow = new THREE.Mesh(
    new THREE.BoxGeometry(6.6, 0.10, 2.2),
    new THREE.MeshBasicMaterial({ color: 0x93c5fd })
  );
  canopyGlow.position.set(0, floorY + roomH - 0.12, D / 2 + 1.3);
  root.add(canopy, canopyGlow);
  [-3.2, 3.2].forEach((px) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, roomH, 10), whiteWallMat);
    col.position.set(px, floorY + roomH / 2, D / 2 + 2.45);
    root.add(col);
  });

  // 3. Multi-Wing Upper Stories (Left 4-Story Wing, Central Tall H-Tower, Right 4-Story Helipad Wing)
  const hospWinTex = U.makeWindowStripTexture('#f1f5f9', '#1e3a5f', '#7dd3fc', 6, 4, 0.45);
  const wingWinMat = new THREE.MeshStandardMaterial({ map: hospWinTex, roughness: 0.30, metalness: 0.18 });
  const upperStartY = floorY + roomH + 0.46;

  // Left Wing (4 stories)
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(8.6, 9.2, 13.5), [wingWinMat, wingWinMat, whiteWallMat, whiteWallMat, wingWinMat, wingWinMat]);
  leftWing.position.set(-7.6, upperStartY + 4.6, -1.0);
  leftWing.castShadow = true;
  const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.42, 13.8), blueTrimMat);
  leftTrim.position.set(-7.6, upperStartY + 9.2, -1.0);
  root.add(leftWing, leftTrim);

  // Right Wing (4 stories + Rooftop Helipad!)
  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(8.6, 9.2, 13.5), [wingWinMat, wingWinMat, whiteWallMat, whiteWallMat, wingWinMat, wingWinMat]);
  rightWing.position.set(7.6, upperStartY + 4.6, -1.0);
  rightWing.castShadow = true;
  const rightTrim = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.42, 13.8), blueTrimMat);
  rightTrim.position.set(7.6, upperStartY + 9.2, -1.0);
  root.add(rightWing, rightTrim);

  // Rooftop Helipad on Right Wing (Dark pad + Yellow Circle + White 'H')
  const heliCan = document.createElement('canvas'); heliCan.width = 256; heliCan.height = 256;
  const hCtx = heliCan.getContext('2d');
  hCtx.fillStyle = '#334155'; hCtx.fillRect(0, 0, 256, 256);
  hCtx.strokeStyle = '#facc15'; hCtx.lineWidth = 14;
  hCtx.beginPath(); hCtx.arc(128, 128, 96, 0, Math.PI * 2); hCtx.stroke();
  hCtx.fillStyle = '#f8fafc'; hCtx.font = '900 130px Inter, sans-serif';
  hCtx.textAlign = 'center'; hCtx.textBaseline = 'middle'; hCtx.fillText('H', 128, 134);
  const helipad = new THREE.Mesh(
    new THREE.BoxGeometry(6.8, 0.16, 6.8),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(heliCan), roughness: 0.7 })
  );
  helipad.position.set(7.6, upperStartY + 9.48, -0.5);
  root.add(helipad);

  // Central Taller Tower + Iconic Glowing Red "H" Sign Box + Rooftop HVAC Units
  const centerTower = new THREE.Mesh(new THREE.BoxGeometry(7.6, 13.2, 14.5), [wingWinMat, wingWinMat, whiteWallMat, whiteWallMat, wingWinMat, wingWinMat]);
  centerTower.position.set(0, upperStartY + 6.6, -1.0);
  centerTower.castShadow = true;
  const centerTrim = new THREE.Mesh(new THREE.BoxGeometry(7.9, 0.55, 14.8), blueTrimMat);
  centerTrim.position.set(0, upperStartY + 13.2, -1.0);
  root.add(centerTower, centerTrim);

  const hSignTex = U.makeSignTexture('H', '#dc2626', '#ffffff', '#fca5a5', 256, 256, 175);
  const hSignMat = new THREE.MeshBasicMaterial({ map: hSignTex });
  const hBox = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.4, 1.2), [darkBlueMat, darkBlueMat, darkBlueMat, darkBlueMat, hSignMat, hSignMat]);
  hBox.position.set(0, upperStartY + 11.4, 6.4);
  root.add(hBox);

  // Secondary "CITY HOSPITAL" Banner Sign above Main Entrance
  const bannerTex = U.makeSignTexture('CITY HOSPITAL', '#1d4ed8', '#ffffff', '#60a5fa', 512, 110, 52, '24×7 EMERGENCY & TRAUMA');
  const bannerMesh = new THREE.Mesh(new THREE.BoxGeometry(9.2, 1.45, 0.25), new THREE.MeshBasicMaterial({ map: bannerTex }));
  bannerMesh.position.set(0, floorY + roomH + 1.15, D / 2 + 0.18);
  root.add(bannerMesh);

  // Rooftop HVAC Units
  const hvac1 = U.createHVACUnit(1.1); hvac1.position.set(-1.6, upperStartY + 13.48, -2.5);
  const hvac2 = U.createHVACUnit(1.1); hvac2.position.set(1.6, upperStartY + 13.48, -2.5);
  const hvac3 = U.createHVACUnit(1.0); hvac3.position.set(-7.6, upperStartY + 9.42, -3.5);
  root.add(hvac1, hvac2, hvac3);

  // 4. Parked 3D Ambulances in Front Emergency Bays (with animated flashing beacons!)
  const ambulanceBeacons = [];
  function buildParkedAmbulance() {
    const ag = new THREE.Group();
    const wM = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.25 });
    const rM = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35 });
    const gM = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.35, 3.6), wM); body.position.y = 0.95;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.79, 0.22, 3.62), rM); stripe.position.y = 0.85;
    const wind = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.55, 0.12), gM); wind.position.set(0, 1.2, 1.78);
    const hl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.16, 0.08), new THREE.MeshBasicMaterial({ color: 0xfef08a })); hl.position.set(0, 0.58, 1.81);
    const bR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.22), new THREE.MeshBasicMaterial({ color: 0xff1e1e })); bR.position.set(-0.32, 1.70, 0.9);
    const bB = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.22), new THREE.MeshBasicMaterial({ color: 0x38bdf8 })); bB.position.set(0.32, 1.70, 0.9);
    ambulanceBeacons.push({ bR, bB });
    const tM = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
    [[-0.86, 1.1], [0.86, 1.1], [-0.86, -1.1], [0.86, -1.1]].forEach(([wx, wz]) => {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.24, 12), tM);
      wh.rotation.z = Math.PI / 2; wh.position.set(wx, 0.32, wz);
      ag.add(wh);
    });
    ag.add(body, stripe, wind, hl, bR, bB);
    return ag;
  }
  [[-7.8, D / 2 + 2.35, 0.0], [6.2, D / 2 + 2.35, -0.18], [9.2, D / 2 + 2.35, -0.18]].forEach(([ax, az, rot]) => {
    const amb = buildParkedAmbulance();
    amb.position.set(ax, 0.22, az);
    amb.rotation.y = rot;
    root.add(amb);
  });

  // ===========================================================================
  // 5. REAL WALKABLE HOSPITAL INTERIOR (Lobby, Reception, ER Beds, ECG, Waiting Area)
  // ===========================================================================
  const interior = new THREE.Group();
  root.add(interior);

  // Center-Back Reception Counter + Nurse NPC + Dual Monitors + Glowing Red Cross Emblem
  const deskMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.32 });
  const deskTopMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.2 });
  const deskBase = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.08, 1.35), deskMat);
  deskBase.position.set(0, floorY + 0.54, -D / 2 + 3.1);
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(6.45, 0.12, 1.55), deskTopMat);
  deskTop.position.set(0, floorY + 1.12, -D / 2 + 3.1);
  interior.add(deskBase, deskTop);

  // Receptionist Nurse + Monitors
  const nurse = U.createMiniNPC(0x38bdf8, 0xf8fafc);
  nurse.position.set(0, floorY, -D / 2 + 2.0);
  interior.add(nurse);
  [-1.5, 1.5].forEach((mx) => {
    const mon = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.44, 0.08), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    mon.position.set(mx, floorY + 1.44, -D / 2 + 3.0);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.60, 0.36), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    scr.position.set(mx, floorY + 1.44, -D / 2 + 3.05);
    interior.add(mon, scr);
  });

  // Glowing Red Cross + "RECEPTION / ER" Wall Plaque
  const recSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 1.1),
    new THREE.MeshBasicMaterial({ map: U.makeSignTexture('+ EMERGENCY RECEPTION', '#ffffff', '#dc2626', '#2563eb', 512, 128, 38) })
  );
  recSign.position.set(0, floorY + 3.1, -D / 2 + 0.78);
  interior.add(recSign);

  // LEFT SIDE: 2 Full ER / ICU Treatment Bays with Beds, Blankets, IV Stands, ECG Heart Monitors & Curtains
  const bedFrameMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.6, roughness: 0.3 });
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.75 });
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const curtainMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.65, side: THREE.DoubleSide });

  [-2.6, 2.2].forEach((bz) => {
    const bed = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.22, 1.25), bedFrameMat); frame.position.y = 0.62;
    const matt = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.24, 1.15), pillowMat); matt.position.y = 0.84;
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.26, 1.18), sheetMat); blanket.position.set(0.32, 0.86, 0);
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.85), pillowMat); pillow.position.set(-0.88, 1.0, 0);
    // IV Drip Stand
    const ivPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 6), bedFrameMat); ivPole.position.set(-1.1, 1.05, 0.85);
    const ivBag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.08), new THREE.MeshBasicMaterial({ color: 0xe0f2fe })); ivBag.position.set(-1.1, 1.92, 0.85);
    // Heart-Rate ECG Monitor Cart
    const ecgStand = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.15, 0.42), bedFrameMat); ecgStand.position.set(-1.1, 0.58, -0.88);
    const ecgScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.36, 0.12),
      new THREE.MeshBasicMaterial({ map: U.makeSignTexture('78 BPM ♥', '#020617', '#22c55e', '#16a34a', 256, 128, 44) })
    );
    ecgScreen.position.set(-1.1, 1.32, -0.88); ecgScreen.rotation.y = Math.PI / 4;
    bed.add(frame, matt, blanket, pillow, ivPole, ivBag, ecgStand, ecgScreen);
    bed.position.set(-W / 2 + 2.8, floorY, bz);
    interior.add(bed);
  });
  // Privacy Curtain Divider between ER bays
  const curt = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.6), curtainMat);
  curt.position.set(-W / 2 + 2.8, floorY + 2.1, -0.2);
  interior.add(curt);

  // RIGHT SIDE: Patient Waiting Area (Blue Chairs, Magazine Table, Medicine Cabinet & Elevator Doors)
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.45 });
  for (let c = 0; c < 4; c++) {
    const ch = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.12, 0.72), chairMat); seat.position.y = 0.48;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.12), chairMat); back.position.set(0, 0.82, -0.32);
    ch.add(seat, back);
    ch.position.set(W / 2 - 2.4, floorY, -3.2 + c * 1.45);
    ch.rotation.y = -Math.PI / 2;
    interior.add(ch);
  }
  const medCab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.5, 2.8), whiteWallMat);
  medCab.position.set(W / 2 - 1.35, floorY + 1.25, 3.6);
  const medGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 2.4), new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.5 }));
  medGlass.position.set(W / 2 - 1.92, floorY + 1.5, 3.6);
  interior.add(medCab, medGlass);

  // Potted indoor plants flanking entrance
  [[-4.2, D / 2 - 1.5], [4.2, D / 2 - 1.5]].forEach(([px, pz]) => {
    const pl = U.createPottedPlant(1.15);
    pl.position.set(px, floorY, pz);
    interior.add(pl);
  });

  // Live animation hook (ambulance rooftop strobes)
  function update(dt, now) {
    const on = Math.floor(now / 180) % 2 === 0;
    ambulanceBeacons.forEach((b, idx) => {
      const f = idx % 2 === 0 ? on : !on;
      b.bR.material.color.setHex(f ? 0xff1e1e : 0x3b0a0a);
      b.bB.material.color.setHex(!f ? 0x38bdf8 : 0x0c2440);
    });
  }

  return {
    id: 'hospital',
    title: 'CITY HOSPITAL',
    mapTag: 'H',
    mapColor: '#ef4444',
    width: W, depth: D,
    group: root,
    doorL: shellData.doorL,
    doorR: shellData.doorR,
    doorZ: shellData.doorZ,
    doorGapHalf: shellData.doorGapHalf,
    colliders: shellData.colliders,
    interiorSpawn: { x: 0, y: floorY + 1.65, z: D / 2 - 2.2, lookAt: [0, floorY + 1.5, -4] },
    update
  };
};
