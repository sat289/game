// buildings/police_hq.js
// BUILDING E — POLICE HQ (Fortress Perimeter Wall, Strobe Watch-Turrets, Radio Towers + Walk-In Precinct & Jail Cells)
window.ApexBuildings = window.ApexBuildings || {};
window.ApexBuildings.police_hq = function createPoliceHQBuilding() {
  const U = window.ApexBuildingUtils;
  const root = new THREE.Group();
  root.name = 'Building_PoliceHQ';

  const W = 24, D = 16.5, roomH = 4.6, floorY = 0.22;

  const concMat  = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.72, metalness: 0.1 });
  const darkConc = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.65, metalness: 0.2 });
  const polBlue  = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.35, metalness: 0.3 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.42 });
  const intWallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55 });
  const floorMat = new THREE.MeshStandardMaterial({
    map: U.makeTileFloorTexture('#e2e8f0', '#cbd5e1', 10, 'rgba(29,78,216,0.16)'),
    roughness: 0.35
  });

  // 1. Tactical Courtyard Asphalt Pad
  const yard = new THREE.Mesh(
    new THREE.BoxGeometry(W + 6.0, 0.22, D + 9.0),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
  );
  yard.position.set(0, 0.11, 2.2);
  yard.receiveShadow = true;
  root.add(yard);

  // 2. Walkable Ground-Floor Precinct Shell
  const shellData = U.buildWalkInShell({
    width: W, depth: D, roomH, wallT: 0.7, doorGapHalf: 2.8,
    extMat: whiteMat, intWallMat, floorMat,
    ceilColor: 0xe2e8f0, ledColor: 0xe0f2fe, frameColor: 0x1e3a8a, glassColor: 0x60a5fa, floorY
  });
  root.add(shellData.shell);

  // 3. Upper Tactical 2nd Floor + Glowing Blue "POLICE" Signs + Blue Trim Stripe
  const upY = floorY + roomH + 0.26;
  const polWinTex = U.makeWindowStripTexture('#e2e8f0', '#1e3a8a', '#93c5fd', 6, 2, 0.45);
  const polWinMat = new THREE.MeshStandardMaterial({ map: polWinTex, roughness: 0.35 });

  // Main Left/Center 2nd-Story HQ Block
  const hqUpper = new THREE.Mesh(new THREE.BoxGeometry(15.2, 4.4, 14.5), [polWinMat, polWinMat, darkConc, darkConc, polWinMat, polWinMat]);
  hqUpper.position.set(-4.2, upY + 2.2, -0.8);
  hqUpper.castShadow = true;
  const blueStripe = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.65, 14.8), polBlue);
  blueStripe.position.set(-4.2, upY + 4.15, -0.8);
  root.add(hqUpper, blueStripe);

  // Right-Side Police Tactical Garage Bay Extension
  const garRoof = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.8, 12.6), polBlue);
  garRoof.position.set(7.8, upY + 0.35, 0.2);
  const garDoor = new THREE.Mesh(
    new THREE.BoxGeometry(5.0, 3.6, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 })
  );
  garDoor.position.set(7.8, floorY + 1.8, D / 2 + 0.08);
  root.add(garRoof, garDoor);

  // Glowing Blue "POLICE" Rooftop Signs (Main HQ + Garage)
  const polSignTex = U.makeSignTexture('POLICE', '#1e3a8a', '#e0f2fe', '#38bdf8', 512, 128, 84);
  const mainSign = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.55, 0.35), new THREE.MeshBasicMaterial({ map: polSignTex }));
  mainSign.position.set(-4.2, upY + 5.15, 6.4);
  const garSign = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.05, 0.25), new THREE.MeshBasicMaterial({ map: polSignTex }));
  garSign.position.set(7.8, upY + 1.1, 6.4);
  root.add(mainSign, garSign);

  // 4. Perimeter Fortress Concrete Security Wall + 4 Corner Watch-Turrets with Flashing Blue Strobes!
  const wallH = 2.6;
  const frontZ = D / 2 + 5.6;
  const leftX = -W / 2 - 2.3;
  const rightX = W / 2 + 2.3;
  // Left & Right side perimeter walls
  [leftX, rightX].forEach((wx) => {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.55, wallH, D + 6.4), concMat);
    sw.position.set(wx, floorY + wallH / 2, 2.2);
    root.add(sw);
  });
  // Front wall left & right of wide walk-in/drive-in security gate (gap x in [-4.0, +4.0])
  [[-9.1, 10.2], [9.1, 10.2]].forEach(([fx, fw]) => {
    const fwMesh = new THREE.Mesh(new THREE.BoxGeometry(fw, wallH, 0.55), concMat);
    fwMesh.position.set(fx, floorY + wallH / 2, frontZ);
    root.add(fwMesh);
  });

  // 4 Corner Watch-Turrets with Flashing Blue Strobe Beacons!
  const strobeLights = [];
  [[leftX, frontZ], [rightX, frontZ], [leftX, -D / 2 + 0.5], [rightX, -D / 2 + 0.5]].forEach(([tx, tz], idx) => {
    const tur = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.6, 2.1), concMat);
    tur.position.set(tx, floorY + 1.8, tz);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.35, 2.35), darkConc);
    cap.position.set(tx, floorY + 3.65, tz);
    const stMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), stMat);
    strobe.position.set(tx, floorY + 4.0, tz);
    strobeLights.push({ mat: stMat, idx });
    root.add(tur, cap, strobe);
  });

  // 5. Two Tall Radio / Satellite Communications Lattice Towers
  function createRadioTower(h = 7.5) {
    const tg = new THREE.Group();
    const lattice = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.95, h, 4),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, wireframe: true })
    );
    lattice.position.y = h / 2;
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      whiteMat
    );
    dish.rotation.x = Math.PI * 0.65;
    dish.position.set(0.4, h * 0.65, 0.3);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff1e1e }));
    tip.position.y = h + 0.15;
    tg.add(lattice, dish, tip);
    return tg;
  }
  const rt1 = createRadioTower(7.8); rt1.position.set(-4.2, upY + 4.4, -3.5);
  const rt2 = createRadioTower(6.5); rt2.position.set(-W / 2 - 1.1, floorY, 2.2);
  root.add(rt1, rt2);

  // ===========================================================================
  // 6. REAL WALKABLE POLICE HQ INTERIOR (Reception, CCTV Wall, Briefing Desks, Armory & 2 Jail Cells!)
  // ===========================================================================
  const interior = new THREE.Group();
  root.add(interior);

  // Front Reception & Dispatch Desk with Ballistic Glass & Duty Officer
  const recDesk = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.12, 1.35), polBlue);
  recDesk.position.set(0, floorY + 0.56, 2.4);
  const bGlass = new THREE.Mesh(
    new THREE.BoxGeometry(5.4, 1.15, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.42 })
  );
  bGlass.position.set(0, floorY + 1.70, 2.95);
  const officerNPC = U.createMiniNPC(0x1e3a8a, 0x0f172a);
  officerNPC.position.set(0, floorY, 1.4);
  interior.add(recDesk, bGlass, officerNPC);

  // Back Wall: City CCTV Surveillance Monitor Wall & Wanted Evidence Board
  const cctvTex = U.makeSignTexture('CITY CCTV LIVE', '#020617', '#38bdf8', '#1d4ed8', 512, 224, 46, 'CAM 01 • CAM 02 • CAM 03 • CAM 04');
  const cctvWall = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.3, 0.18), new THREE.MeshBasicMaterial({ map: cctvTex }));
  cctvWall.position.set(0, floorY + 2.55, -D / 2 + 0.85);
  interior.add(cctvWall);

  // Left Wing: 2 Tactical Briefing Desks with Monitors & Armory Lockers
  [-2.8, 1.4].forEach((dz) => {
    const dsk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.82, 1.25), darkConc);
    dsk.position.set(-W / 2 + 3.6, floorY + 0.41, dz);
    const lap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.36, 0.08), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    lap.position.set(-W / 2 + 3.6, floorY + 1.0, dz - 0.15);
    interior.add(dsk, lap);
  });
  // Steel Armory Lockers along left wall
  for (let l = 0; l < 4; l++) {
    const lk = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.4, 0.95), darkConc);
    lk.position.set(-W / 2 + 1.18, floorY + 1.2, -4.6 + l * 1.1);
    interior.add(lk);
  }

  // Right-Back Corner: 2 Detailed Holding Jail Cells with Vertical Steel Bars & Metal Bunks!
  const barMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.25 });
  const cellDivider = new THREE.Mesh(new THREE.BoxGeometry(0.25, roomH - 0.2, 5.2), concMat);
  cellDivider.position.set(W / 2 - 4.5, floorY + roomH / 2, -D / 2 + 3.1);
  interior.add(cellDivider);
  // Steel Jail Bars spanning the front of both cells
  for (let b = 0; b < 18; b++) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, roomH - 0.2, 6), barMat);
    bar.position.set(W / 2 - 8.2 + b * 0.42, floorY + roomH / 2, -D / 2 + 5.7);
    interior.add(bar);
  }
  // Cell Benches / Bunks inside both cells
  [W / 2 - 6.4, W / 2 - 2.4].forEach((bx) => {
    const bunk = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 0.95), barMat);
    bunk.position.set(bx, floorY + 0.45, -D / 2 + 1.65);
    interior.add(bunk);
  });
  const jailSign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.7),
    new THREE.MeshBasicMaterial({ map: U.makeSignTexture('HOLDING CELLS', '#0f172a', '#ef4444', '#ef4444', 320, 64, 34) })
  );
  jailSign.position.set(W / 2 - 4.6, floorY + 3.9, -D / 2 + 5.82);
  interior.add(jailSign);

  function update(dt, now) {
    const f = Math.floor(now / 150) % 2 === 0;
    strobeLights.forEach((st) => {
      const lit = (st.idx % 2 === 0) ? f : !f;
      st.mat.color.setHex(lit ? 0x00f0ff : 0x1e3a8a);
    });
  }

  return {
    id: 'police_hq',
    title: 'POLICE HQ',
    mapTag: 'P',
    mapColor: '#2563eb',
    width: W, depth: D,
    group: root,
    doorL: shellData.doorL,
    doorR: shellData.doorR,
    doorZ: shellData.doorZ,
    doorGapHalf: shellData.doorGapHalf,
    colliders: shellData.colliders,
    interiorSpawn: { x: 0, y: floorY + 1.65, z: D / 2 - 1.6, lookAt: [0, floorY + 1.6, -4] },
    update
  };
};
