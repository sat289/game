// buildings/mega_mall.js
// BUILDING B — MEGA MALL (Glass Atrium, 3 Geodesic Domes, Twin External Escalators + Multi-Boutique Walk-In Interior)
window.ApexBuildings = window.ApexBuildings || {};
window.ApexBuildings.mega_mall = function createMegaMallBuilding() {
  const U = window.ApexBuildingUtils;
  const root = new THREE.Group();
  root.name = 'Building_MegaMall';

  const W = 25, D = 17.5, roomH = 5.4, floorY = 0.22;

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.72, roughness: 0.28 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.32 });
  const mallGlassTex = U.makeWindowStripTexture('#1e293b', '#0ea5e9', '#bae6fd', 10, 4, 0.55);
  const facadeMat = new THREE.MeshStandardMaterial({ map: mallGlassTex, metalness: 0.65, roughness: 0.16 });
  const intWallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  const marbleFloorMat = new THREE.MeshStandardMaterial({
    map: U.makeTileFloorTexture('#fffbeb', '#e2e8f0', 10, 'rgba(245,158,11,0.22)'),
    roughness: 0.18, metalness: 0.12
  });

  // 1. Grand Plaza Base
  const plaza = new THREE.Mesh(
    new THREE.BoxGeometry(W + 4.5, 0.22, D + 7.2),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
  );
  plaza.position.set(0, 0.11, 1.6);
  plaza.receiveShadow = true;
  root.add(plaza);

  // 2. Walkable Grand Ground-Floor Atrium Shell
  const shellData = U.buildWalkInShell({
    width: W, depth: D, roomH, wallT: 0.65, doorGapHalf: 3.1,
    extMat: facadeMat, intWallMat, floorMat: marbleFloorMat,
    ceilColor: 0xf1f5f9, ledColor: 0xfef3c7, frameColor: 0x0f172a, glassColor: 0x38bdf8, floorY
  });
  root.add(shellData.shell);

  // 3. Second-Level Glass Atrium Floor + Glowing "MEGA MALL" Neon Marquee
  const upperY = floorY + roomH + 0.26;
  const upperBody = new THREE.Mesh(
    new THREE.BoxGeometry(W + 0.4, 5.2, D + 0.2),
    [facadeMat, facadeMat, silverMat, silverMat, facadeMat, facadeMat]
  );
  upperBody.position.set(0, upperY + 2.6, 0);
  upperBody.castShadow = true;
  root.add(upperBody);

  const roofRim = new THREE.Mesh(new THREE.BoxGeometry(W + 1.0, 0.55, D + 0.8), steelMat);
  roofRim.position.set(0, upperY + 5.3, 0);
  root.add(roofRim);

  // Iconic Pink-and-Cyan Glowing "MEGA MALL" Neon Sign
  const mallSignTex = U.makeSignTexture('MEGA MALL', '#0f172a', '#f472b6', '#38bdf8', 640, 140, 74);
  const mallSign = new THREE.Mesh(
    new THREE.BoxGeometry(10.6, 2.05, 0.42),
    [steelMat, steelMat, steelMat, steelMat, new THREE.MeshBasicMaterial({ map: mallSignTex }), steelMat]
  );
  mallSign.position.set(0, upperY + 3.9, D / 2 + 0.35);
  root.add(mallSign);

  // 4. Three Signature Glass Geodesic Domes on Roof (1 Large Central + 2 Flanking Side Domes)
  const domeGlassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.25,
    metalness: 0.85, roughness: 0.08, transparent: true, opacity: 0.72
  });
  const domeWireMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, wireframe: true, transparent: true, opacity: 0.42 });
  [[0, 4.4, -1.2], [-7.2, 2.5, 1.2], [7.2, 2.5, 1.2]].forEach(([dx, rad, dz]) => {
    const dg = new THREE.Group();
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(rad, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), domeGlassMat);
    const wire = new THREE.Mesh(new THREE.SphereGeometry(rad + 0.04, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), domeWireMat);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(rad + 0.2, rad + 0.25, 0.45, 20), steelMat);
    ring.position.y = 0.22;
    dg.add(sphere, wire, ring);
    dg.position.set(dx, upperY + 5.45, dz);
    root.add(dg);
  });

  // 5. Twin Rooftop Neon Billboards (Left & Right Corners)
  const bb1Tex = U.makeSignTexture('SUPER SALE', '#3b0764', '#facc15', '#ec4899', 384, 192, 52, 'UP TO 70% OFF!');
  const bb2Tex = U.makeSignTexture('IMAX 3D', '#0c4a6e', '#38bdf8', '#facc15', 384, 192, 58, 'NOW SHOWING');
  [[-W / 2 + 2.6, bb1Tex, 0.25], [W / 2 - 2.6, bb2Tex, -0.25]].forEach(([bx, tex, ry]) => {
    const bg = new THREE.Group();
    const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.6, 6), steelMat); poleL.position.set(-1.6, 0.8, 0);
    const poleR = poleL.clone(); poleR.position.x = 1.6;
    const board = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.2, 0.22), new THREE.MeshBasicMaterial({ map: tex }));
    board.position.y = 2.4;
    bg.add(poleL, poleR, board);
    bg.position.set(bx, upperY + 5.5, D / 2 - 1.2);
    bg.rotation.y = ry;
    root.add(bg);
  });

  // 6. Twin Diagonal External Glass Escalators flanking the Main Entrance (with animated steps!)
  const escalatorSteps = [];
  [-5.2, 5.2].forEach((ex, sideIdx) => {
    const eg = new THREE.Group();
    const railMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.25 });
    const glassRailMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.5 });
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.35, 7.6), railMat);
    ramp.rotation.x = -0.62;
    ramp.position.set(0, 2.4, 2.8);
    [-0.86, 0.86].forEach((rx) => {
      const sideG = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 7.6), glassRailMat);
      sideG.rotation.x = -0.62; sideG.position.set(rx, 3.0, 2.8);
      eg.add(sideG);
    });
    for (let s = 0; s < 10; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.14, 0.42), silverMat);
      eg.add(step);
      escalatorSteps.push({ mesh: step, idx: s, dir: sideIdx === 0 ? 1 : -1 });
    }
    eg.add(ramp);
    eg.position.set(ex, floorY, D / 2 + 0.1);
    root.add(eg);
  });

  // Front Plaza Directory Totem Kiosk
  const totem = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.6, 0.35),
    new THREE.MeshBasicMaterial({ map: U.makeSignTexture('MALL', '#0f172a', '#f472b6', '#38bdf8', 192, 384, 52, 'OPEN 24H') })
  );
  totem.position.set(0, floorY + 1.3, D / 2 + 4.4);
  root.add(totem);

  // ===========================================================================
  // 7. REAL WALKABLE MEGA MALL INTERIOR (Central Fountain, 4 Boutiques, Mezzanine, Cafe)
  // ===========================================================================
  const interior = new THREE.Group();
  root.add(interior);

  // Central Illuminated Circular Water Fountain
  const fountainRim = new THREE.Mesh(
    new THREE.CylinderGeometry(2.55, 2.75, 0.62, 20),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
  );
  fountainRim.position.set(0, floorY + 0.31, 0.4);
  const waterDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(2.32, 2.32, 0.12, 20),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.45, roughness: 0.08, metalness: 0.4 })
  );
  waterDisc.position.set(0, floorY + 0.56, 0.4);
  const jetCol = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.52, 2.1, 12),
    new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.72 })
  );
  jetCol.position.set(0, floorY + 1.55, 0.4);
  interior.add(fountainRim, waterDisc, jetCol);

  // 4 Walk-in Retail Boutiques along Left, Right & Back Walls
  const shops = [
    { x: -W / 2 + 2.8, z: -3.4, rot: Math.PI / 2, name: 'APEX FASHION', col: '#ec4899', bg: '#3b0764' },
    { x: -W / 2 + 2.8, z: 3.0,  rot: Math.PI / 2, name: 'CYBER KICKS',  col: '#38bdf8', bg: '#0c4a6e' },
    { x:  W / 2 - 2.8, z: -3.4, rot: -Math.PI / 2, name: 'TECH ZONE',   col: '#22c55e', bg: '#052e16' },
    { x:  W / 2 - 2.8, z: 3.0,  rot: -Math.PI / 2, name: 'STAR CAFE',   col: '#facc15', bg: '#451a03' }
  ];
  shops.forEach((sh) => {
    const sg = new THREE.Group();
    // Counter
    const cnt = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 1.02, 1.15),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 })
    );
    cnt.position.set(0, 0.51, 0);
    // Glowing boutique fascia sign
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 0.92, 0.16),
      new THREE.MeshBasicMaterial({ map: U.makeSignTexture(sh.name, sh.bg, sh.col, sh.col, 384, 96, 42) })
    );
    sign.position.set(0, 3.6, -0.9);
    // Display items on counter
    [-1.4, 0, 1.4].forEach((ix, k) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.42 + (k % 2) * 0.18, 0.45),
        new THREE.MeshStandardMaterial({ color: k === 1 ? 0x38bdf8 : 0xf472b6, roughness: 0.25 })
      );
      box.position.set(ix, 1.24, 0);
      sg.add(box);
    });
    // Shopkeeper NPC
    const clerk = U.createMiniNPC(parseInt(sh.col.replace('#', ''), 16), 0x0f172a);
    clerk.position.set(0, 0, -1.05);
    sg.add(cnt, sign, clerk);
    sg.position.set(sh.x, floorY, sh.z);
    sg.rotation.y = sh.rot;
    interior.add(sg);
  });

  // Back-Wall Grand Directory + Neon Glass Balustrade Mezzanine Overlook
  const mezz = new THREE.Mesh(new THREE.BoxGeometry(W - 2.2, 0.28, 3.2), silverMat);
  mezz.position.set(0, floorY + 3.4, -D / 2 + 2.3);
  const mezzRail = new THREE.Mesh(
    new THREE.BoxGeometry(W - 2.2, 0.95, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
  );
  mezzRail.position.set(0, floorY + 4.02, -D / 2 + 3.85);
  interior.add(mezz, mezzRail);

  // Indoor Benches & Palm Planters around Fountain
  [[-4.2, -3.5], [4.2, -3.5], [-4.2, 4.2], [4.2, 4.2]].forEach(([px, pz]) => {
    const pl = U.createPottedPlant(1.3);
    pl.position.set(px, floorY, pz);
    interior.add(pl);
  });
  [[-3.6, 0.4], [3.6, 0.4]].forEach(([bx, bz]) => {
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.46, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 })
    );
    bench.position.set(bx, floorY + 0.23, bz);
    interior.add(bench);
  });

  function update(dt, now) {
    // Animate fountain water jet shimmer
    jetCol.scale.y = 0.88 + Math.sin(now * 0.008) * 0.16;
    // Animate external escalator steps rising/descending
    const t = (now * 0.00045) % 1;
    escalatorSteps.forEach((es) => {
      const p = ((es.idx / 10) + (es.dir > 0 ? t : (1 - t))) % 1;
      es.mesh.position.set(0, 0.45 + p * 4.2, 5.9 - p * 6.2);
    });
  }

  return {
    id: 'mega_mall',
    title: 'MEGA MALL',
    mapTag: 'M',
    mapColor: '#a855f7',
    width: W, depth: D,
    group: root,
    doorL: shellData.doorL,
    doorR: shellData.doorR,
    doorZ: shellData.doorZ,
    doorGapHalf: shellData.doorGapHalf,
    colliders: shellData.colliders,
    interiorSpawn: { x: 0, y: floorY + 1.65, z: D / 2 - 2.0, lookAt: [0, floorY + 1.6, -2] },
    update
  };
};
