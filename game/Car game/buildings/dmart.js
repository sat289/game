// buildings/dmart.js
// BUILDING C — D-MART SUPERMARKET (Orange/Blue/Yellow Warehouse, Loading Dock + Fully Stocked Walk-In Supermarket)
window.ApexBuildings = window.ApexBuildings || {};
window.ApexBuildings.dmart = function createDMartBuilding() {
  const U = window.ApexBuildingUtils;
  const root = new THREE.Group();
  root.name = 'Building_DMart';

  const W = 24, D = 17, roomH = 4.8, floorY = 0.22;

  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.42, metalness: 0.12 });
  const blueMat   = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.38, metalness: 0.20 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.15 });
  const intWallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 });
  const floorMat  = new THREE.MeshStandardMaterial({
    map: U.makeTileFloorTexture('#f8fafc', '#fef3c7', 10, 'rgba(234,88,12,0.12)'),
    roughness: 0.28, metalness: 0.06
  });

  // 1. Concrete Lot Base with Yellow Loading Stripes
  const lot = new THREE.Mesh(
    new THREE.BoxGeometry(W + 6.0, 0.22, D + 6.5),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 })
  );
  lot.position.set(0, 0.11, 1.4);
  lot.receiveShadow = true;
  root.add(lot);

  // 2. Walkable Ground-Floor Supermarket Shell
  const shellData = U.buildWalkInShell({
    width: W, depth: D, roomH, wallT: 0.65, doorGapHalf: 2.9,
    extMat: orangeMat, intWallMat, floorMat,
    ceilColor: 0xf1f5f9, ledColor: 0xffffff, frameColor: 0x1e40af, glassColor: 0x93c5fd, floorY
  });
  root.add(shellData.shell);

  // 3. Signature D-Mart Upper Orange & Blue Warehouse Fascia + Yellow Accent Stripe + Blue Roof
  const upY = floorY + roomH + 0.26;
  const yellowBand = new THREE.Mesh(new THREE.BoxGeometry(W + 0.24, 0.65, D + 0.24), yellowMat);
  yellowBand.position.set(0, floorY + roomH * 0.58, 0);
  const blueBand = new THREE.Mesh(new THREE.BoxGeometry(W + 0.22, 0.85, D + 0.22), blueMat);
  blueBand.position.set(0, upY + 0.38, 0);
  const upperWall = new THREE.Mesh(new THREE.BoxGeometry(W + 0.1, 2.3, D + 0.1), orangeMat);
  upperWall.position.set(0, upY + 1.95, 0);
  upperWall.castShadow = true;
  const blueRoof = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.25, D - 0.6), blueMat);
  blueRoof.position.set(0, upY + 3.16, 0);
  root.add(yellowBand, blueBand, upperWall, blueRoof);

  // Large Illuminated Front Rooftop "D-MART" Neon Marquee + Left Side "D-MART" Sign
  const dmartFrontTex = U.makeSignTexture('D-MART', '#1e3a8a', '#fb923c', '#38bdf8', 512, 160, 92, 'SUPERMARKET');
  const frontMarquee = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 2.6, 0.52),
    [blueMat, blueMat, blueMat, blueMat, new THREE.MeshBasicMaterial({ map: dmartFrontTex }), blueMat]
  );
  frontMarquee.position.set(2.4, upY + 3.9, D / 2 - 0.35);
  root.add(frontMarquee);

  const sideSignTex = U.makeSignTexture('D-MART', '#ea580c', '#fef08a', '#1d4ed8', 512, 128, 86);
  const sideSign = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 1.8), new THREE.MeshBasicMaterial({ map: sideSignTex }));
  sideSign.position.set(-W / 2 - 0.12, upY + 1.75, 0);
  sideSign.rotation.y = -Math.PI / 2;
  root.add(sideSign);

  // Rooftop Skylights & HVAC Units
  const skyMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x38bdf8, emissiveIntensity: 0.25, roughness: 0.15 });
  [-5.2, 0, 5.2].forEach((sx) => {
    const sk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.22, 1.8), skyMat);
    sk.position.set(sx, upY + 3.38, -2.2);
    root.add(sk);
  });
  const hv = U.createHVACUnit(1.1); hv.position.set(-7.5, upY + 3.3, 3.2);
  root.add(hv);

  // 4. Side Delivery Loading Dock (Blue Canopy + Stacked Wooden Pallets & Cardboard Boxes)
  const dockCanopy = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 8.8), blueMat);
  dockCanopy.position.set(-W / 2 - 1.5, floorY + 3.2, 0.5);
  dockCanopy.rotation.z = 0.22;
  root.add(dockCanopy);

  const palletMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 });
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.82 });
  [-2.2, 0.5, 3.2].forEach((pz, i) => {
    const pal = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.22, 1.7), palletMat);
    pal.position.set(-W / 2 - 1.4, floorY + 0.11, pz);
    root.add(pal);
    for (let b = 0; b < 2 + (i % 2); b++) {
      const bx = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.65, 1.15), boxMat);
      bx.position.set(-W / 2 - 1.4, floorY + 0.54 + b * 0.66, pz);
      bx.rotation.y = b * 0.18;
      root.add(bx);
    }
  });

  // 2 Corrugated Rolling Warehouse Bay Doors flanking front-right wall
  const rollMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.45, metalness: 0.45 });
  [-7.4, 7.4].forEach((rx) => {
    const rDoor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 0.14), rollMat);
    rDoor.position.set(rx, floorY + 1.6, D / 2 + 0.08);
    root.add(rDoor);
  });

  // ===========================================================================
  // 5. REAL WALKABLE D-MART SUPERMARKET INTERIOR (4 Stocked Aisles, Coolers, 3 Checkouts, Carts)
  // ===========================================================================
  const interior = new THREE.Group();
  root.add(interior);

  const shelfFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.45, roughness: 0.4 });
  const prodColors = [0xef4444, 0x3b82f6, 0x22c55e, 0xfacc15, 0xf97316, 0xa855f7, 0xec4899, 0x06b6d4];
  const aisleNames = ['AISLE 1 • SNACKS', 'AISLE 2 • GROCERY', 'AISLE 3 • DRINKS', 'AISLE 4 • FRESH'];

  // 4 Double-Sided Stocked Supermarket Aisles
  [-8.2, -4.4, -0.6, 3.2].forEach((ax, aIdx) => {
    const ag = new THREE.Group();
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.35, 8.6), shelfFrameMat);
    spine.position.y = 1.18;
    ag.add(spine);
    // 3 Tiers of colorful stocked boxes on both sides!
    for (let tier = 0; tier < 3; tier++) {
      const py = 0.52 + tier * 0.72;
      for (let slot = 0; slot < 7; slot++) {
        const pz = -3.6 + slot * 1.2;
        [-0.56, 0.56].forEach((sx, side) => {
          const pCol = prodColors[(aIdx * 5 + tier * 3 + slot + side) % prodColors.length];
          const item = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.42, 0.88),
            new THREE.MeshStandardMaterial({ color: pCol, roughness: 0.45 })
          );
          item.position.set(sx, py, pz);
          ag.add(item);
        });
      }
    }
    // Hanging Aisle Overhead Sign
    const aSign = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.45, 0.12),
      new THREE.MeshBasicMaterial({ map: U.makeSignTexture(aisleNames[aIdx], '#1d4ed8', '#fef08a', '#f97316', 320, 64, 24) })
    );
    aSign.position.set(0, 3.65, 3.2);
    ag.add(aSign);
    ag.position.set(ax, floorY, -1.0);
    interior.add(ag);
  });

  // Back Wall Glowing Refrigerated Dairy / Frozen Coolers
  const coolerMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0x38bdf8, emissiveIntensity: 0.38, roughness: 0.15 });
  for (let cl = 0; cl < 5; cl++) {
    const cg = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.7, 0.9), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    body.position.y = 1.35;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.2, 0.1), coolerMat);
    glass.position.set(0, 1.45, 0.46);
    cg.add(body, glass);
    cg.position.set(-7.6 + cl * 3.8, floorY, -D / 2 + 1.25);
    interior.add(cg);
  }

  // Right Side: 3 Checkout Cash-Counter Lanes with Conveyor Belts, Scanners & Cashiers!
  const beltMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });
  [-3.8, 0.2, 4.0].forEach((cz, idx) => {
    const ck = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.96, 2.7), blueMat); base.position.y = 0.48;
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 2.3), beltMat); belt.position.y = 1.0;
    const pos = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.36, 0.12), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    pos.position.set(0.32, 1.28, -0.5);
    const laneSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.45, 0.12),
      new THREE.MeshBasicMaterial({ map: U.makeSignTexture('#' + (idx + 1), '#ea580c', '#ffffff', '#facc15', 128, 96, 48) })
    );
    laneSign.position.set(0, 2.2, 0.9);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), shelfFrameMat);
    pole.position.set(0, 1.5, 0.9);
    const cashier = U.createMiniNPC(0xea580c, 0x1e3a8a);
    cashier.position.set(0.92, 0, -0.35);
    cashier.rotation.y = -Math.PI / 2;
    ck.add(base, belt, pos, laneSign, pole, cashier);
    ck.position.set(W / 2 - 3.0, floorY, cz);
    interior.add(ck);
  });

  // Metallic Shopping Carts parked neatly near the entrance
  const cartMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.25, wireframe: true });
  [-4.6, -5.6, -6.6].forEach((cx) => {
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.58, 0.95), cartMat);
    basket.position.set(cx, floorY + 0.65, D / 2 - 2.0);
    interior.add(basket);
  });

  return {
    id: 'dmart',
    title: 'D-MART SUPERMARKET',
    mapTag: 'D',
    mapColor: '#f97316',
    width: W, depth: D,
    group: root,
    doorL: shellData.doorL,
    doorR: shellData.doorR,
    doorZ: shellData.doorZ,
    doorGapHalf: shellData.doorGapHalf,
    colliders: shellData.colliders,
    interiorSpawn: { x: 0, y: floorY + 1.65, z: D / 2 - 2.0, lookAt: [-1, floorY + 1.5, -3] },
    update: function () {}
  };
};
