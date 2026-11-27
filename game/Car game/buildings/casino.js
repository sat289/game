// buildings/casino.js
// BUILDING D — JACKPOT NEON CASINO & HOTEL (Purple/Gold Art-Deco Towers, Sky Searchlights + Animated Walk-In Casino Interior)
window.ApexBuildings = window.ApexBuildings || {};
window.ApexBuildings.casino = function createCasinoBuilding() {
  const U = window.ApexBuildingUtils;
  const root = new THREE.Group();
  root.name = 'Building_Casino';

  const W = 24, D = 17, roomH = 5.0, floorY = 0.22;

  const purpleMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.35, metalness: 0.35 });
  const goldMat   = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.22, metalness: 0.85 });
  const neonPinkMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
  const neonGoldMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  const intWallMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.55 });
  const carpetMat = new THREE.MeshStandardMaterial({
    map: U.makeTileFloorTexture('#7f1d1d', '#991b1b', 8, 'rgba(250,204,21,0.45)'),
    roughness: 0.88
  });

  // 1. Dark Luxury Marble Plinth + Plush Red Carpet Walkway leading inside
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(W + 4.5, 0.22, D + 6.5),
    new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.5 })
  );
  plinth.position.set(0, 0.11, 1.5);
  plinth.receiveShadow = true;
  const redCarpet = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.06, 6.2),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.85 })
  );
  redCarpet.position.set(0, floorY + 0.02, D / 2 + 2.4);
  root.add(plinth, redCarpet);

  // 2. Walkable Ground-Floor Casino Hall Shell
  const shellData = U.buildWalkInShell({
    width: W, depth: D, roomH, wallT: 0.65, doorGapHalf: 2.9,
    extMat: purpleMat, intWallMat, floorMat: carpetMat,
    ceilColor: 0x1e1b4b, ledColor: 0xf472b6, frameColor: 0xfacc15, glassColor: 0xf472b6, floorY
  });
  root.add(shellData.shell);

  // Grand Neon-Pink Arched Entrance Canopy + Gold Fluted Columns + "JACKPOT CASINO" Marquee
  const entCanopy = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.4, 3.2), purpleMat);
  entCanopy.position.set(0, floorY + roomH + 0.35, D / 2 + 1.45);
  const entTrim = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.22, 3.4), neonPinkMat);
  entTrim.position.set(0, floorY + roomH - 0.35, D / 2 + 1.45);
  const entSignTex = U.makeSignTexture('JACKPOT CASINO', '#3b0764', '#fde047', '#ec4899', 512, 128, 48, '★ VIP LUXURY HOTEL ★');
  const entSign = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 1.25), new THREE.MeshBasicMaterial({ map: entSignTex }));
  entSign.position.set(0, floorY + roomH + 0.35, D / 2 + 3.08);
  root.add(entCanopy, entTrim, entSign);
  [-3.8, 3.8].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, roomH, 12), goldMat);
    col.position.set(cx, floorY + roomH / 2, D / 2 + 2.65);
    root.add(col);
  });

  // 3. Stepped Art-Deco Purple & Gold Upper Hotel Towers (Matches Building D silhouette!)
  const upY = floorY + roomH + 0.26;
  const casWinTex = U.makeWindowStripTexture('#3b0764', '#581c87', '#e879f9', 6, 6, 0.68);
  const casWinMat = new THREE.MeshStandardMaterial({ map: casWinTex, emissive: 0x7e22ce, emissiveIntensity: 0.32, roughness: 0.22, metalness: 0.45 });

  // Tall Central Arched Crown Tower
  const centerT = new THREE.Mesh(new THREE.BoxGeometry(7.8, 12.8, 14.2), [casWinMat, casWinMat, purpleMat, purpleMat, casWinMat, casWinMat]);
  centerT.position.set(0, upY + 6.4, -0.8);
  centerT.castShadow = true;
  const crownPeak = new THREE.Mesh(new THREE.ConeGeometry(4.2, 3.2, 4), goldMat);
  crownPeak.rotation.y = Math.PI / 4;
  crownPeak.position.set(0, upY + 14.3, -0.8);
  const centerNeon = new THREE.Mesh(new THREE.BoxGeometry(8.1, 0.26, 14.5), neonGoldMat);
  centerNeon.position.set(0, upY + 12.8, -0.8);
  root.add(centerT, crownPeak, centerNeon);

  // Twin Side Wings with Glowing Vertical "JACKPOT CASINO" Side Marquees
  const sideMarqTex = U.makeSignTexture('JACKPOT', '#2e1065', '#facc15', '#ec4899', 256, 384, 46, '777 CASINO');
  const sideMarqMat = new THREE.MeshBasicMaterial({ map: sideMarqTex });
  [-7.6, 7.6].forEach((wx) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(7.2, 9.6, 13.6), [casWinMat, casWinMat, purpleMat, purpleMat, casWinMat, casWinMat]);
    wing.position.set(wx, upY + 4.8, -0.8);
    wing.castShadow = true;
    const goldEdge = new THREE.Mesh(new THREE.BoxGeometry(7.45, 0.28, 13.85), goldMat);
    goldEdge.position.set(wx, upY + 9.65, -0.8);
    const mq = new THREE.Mesh(new THREE.BoxGeometry(3.4, 5.2, 0.25), sideMarqMat);
    mq.position.set(wx, upY + 5.0, 6.18);
    root.add(wing, goldEdge, mq);
  });

  // 4. Twin Rooftop Lattice Searchlight Towers with Animated Sweeping Sky Beams!
  const searchBeams = [];
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false });
  [-7.6, 7.6].forEach((sx, idx) => {
    const sg = new THREE.Group();
    const lattice = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.92, 3.8, 4), new THREE.MeshStandardMaterial({ color: 0x1e293b, wireframe: true }));
    lattice.position.y = 1.9;
    const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), neonPinkMat);
    emitter.position.y = 3.9;
    const beamPivot = new THREE.Group();
    beamPivot.position.y = 3.9;
    const beam1 = new THREE.Mesh(new THREE.ConeGeometry(1.9, 14.5, 10, 1, true), beamMat);
    beam1.position.y = 7.25; beam1.rotation.x = Math.PI;
    beamPivot.add(beam1);
    searchBeams.push({ pivot: beamPivot, phase: idx * Math.PI });
    sg.add(lattice, emitter, beamPivot);
    sg.position.set(sx, upY + 9.75, -0.5);
    root.add(sg);
  });

  // ===========================================================================
  // 5. REAL WALKABLE CASINO INTERIOR (Chandelier, 8 Slot Machines, Roulette, Blackjack, VIP Bar, Cashier)
  // ===========================================================================
  const interior = new THREE.Group();
  root.add(interior);

  // Grand Glowing Crystal Chandelier hanging in Center
  const chand = new THREE.Group();
  const cRing1 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.12, 8, 20), goldMat); cRing1.rotation.x = Math.PI / 2;
  const cRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.10, 8, 16), neonGoldMat); cRing2.rotation.x = Math.PI / 2; cRing2.position.y = -0.45;
  chand.add(cRing1, cRing2);
  chand.position.set(0, floorY + roomH - 0.85, 0);
  interior.add(chand);

  // 8 Animated Flashing Slot Machines along Right Wall (2 Banks of 4)
  const slotScreens = [];
  const slotCols = [0xec4899, 0x38bdf8, 0xfacc15, 0x22c55e];
  for (let s = 0; s < 8; s++) {
    const row = Math.floor(s / 4);
    const idx = s % 4;
    const sm = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.85, 0.85), purpleMat); cab.position.y = 0.92;
    const trim = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.14, 0.88), goldMat); trim.position.y = 1.88;
    const scrMat = new THREE.MeshBasicMaterial({ color: slotCols[s % 4] });
    const scr = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.56, 0.08), scrMat); scr.position.set(0, 1.32, 0.43);
    const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6), goldMat); lever.position.set(0.54, 1.15, 0.1); lever.rotation.x = 0.45;
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.65, 10), new THREE.MeshStandardMaterial({ color: 0xdc2626 })); stool.position.set(0, 0.32, 0.92);
    sm.add(cab, trim, scr, lever, stool);
    sm.position.set(W / 2 - 2.2 - row * 3.1, floorY, -4.2 + idx * 2.4);
    sm.rotation.y = -Math.PI / 2;
    interior.add(sm);
    slotScreens.push({ mat: scrMat, idx: s });
  }

  // Center Floor: Green-Felt Blackjack Table & Spinning Roulette Wheel Table!
  const feltMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.4 });
  let rouletteWheel = null;
  [-2.6, 2.2].forEach((tz, tIdx) => {
    const tb = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 0.85, 12), woodMat); leg.position.y = 0.42;
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.16, 18), woodMat); rim.position.y = 0.88;
    const felt = new THREE.Mesh(new THREE.CylinderGeometry(1.52, 1.52, 0.18, 18), feltMat); felt.position.y = 0.90;
    tb.add(leg, rim, felt);
    if (tIdx === 0) {
      // Spinning Roulette Wheel
      const rw = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.65, 0.18, 16), goldMat);
      rw.position.set(0, 1.04, 0);
      const rwInner = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0xdc2626 }));
      rwInner.position.y = 0.02;
      rw.add(rwInner);
      tb.add(rw);
      rouletteWheel = rw;
    } else {
      // Stacked Poker Chips
      [[-0.5, 0.3, 0xef4444], [0.4, -0.2, 0x3b82f6], [0.0, 0.5, 0xfacc15]].forEach(([cx, cz, col]) => {
        const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 10), new THREE.MeshStandardMaterial({ color: col }));
        ch.position.set(cx, 1.08, cz);
        tb.add(ch);
      });
    }
    const dealer = U.createMiniNPC(0x0f172a, 0x090d16);
    dealer.position.set(0, 0, -2.05);
    tb.add(dealer);
    tb.position.set(-1.5, floorY, tz);
    interior.add(tb);
  });

  // Left Wall: VIP Neon Cocktail Bar with Glowing Bottle Shelf
  const barCnt = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.12, 7.6), woodMat);
  barCnt.position.set(-W / 2 + 2.8, floorY + 0.56, 0);
  const barGlow = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 7.6), neonPinkMat);
  barGlow.position.set(-W / 2 + 3.42, floorY + 1.04, 0);
  const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.4, 6.8), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.32 }));
  shelfBack.position.set(-W / 2 + 1.1, floorY + 1.9, 0);
  interior.add(barCnt, barGlow, shelfBack);

  // Back Wall: Gold-Barred CASHIER Cage
  const cashSign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 0.95),
    new THREE.MeshBasicMaterial({ map: U.makeSignTexture('💰 VIP CASHIER', '#3b0764', '#facc15', '#facc15', 384, 96, 44) })
  );
  cashSign.position.set(0, floorY + 3.25, -D / 2 + 0.82);
  const cashDesk = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.1, 1.2), goldMat);
  cashDesk.position.set(0, floorY + 0.55, -D / 2 + 2.4);
  interior.add(cashSign, cashDesk);

  function update(dt, now) {
    // Sweep rooftop searchlights across sky
    searchBeams.forEach((sb) => {
      sb.pivot.rotation.z = Math.sin(now * 0.0014 + sb.phase) * 0.42;
      sb.pivot.rotation.x = Math.cos(now * 0.0011 + sb.phase) * 0.22;
    });
    // Spin roulette wheel & flash slot machine screens
    if (rouletteWheel) rouletteWheel.rotation.y += 2.4 * dt;
    const tick = Math.floor(now / 320);
    slotScreens.forEach((sc) => {
      sc.mat.color.setHex(slotCols[(tick + sc.idx) % slotCols.length]);
    });
  }

  return {
    id: 'casino',
    title: 'JACKPOT CASINO',
    mapTag: 'C',
    mapColor: '#ec4899',
    width: W, depth: D,
    group: root,
    doorL: shellData.doorL,
    doorR: shellData.doorR,
    doorZ: shellData.doorZ,
    doorGapHalf: shellData.doorGapHalf,
    colliders: shellData.colliders,
    interiorSpawn: { x: 0, y: floorY + 1.65, z: D / 2 - 2.0, lookAt: [0, floorY + 1.6, -3] },
    update
  };
};
