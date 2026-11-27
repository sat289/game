// buildings/building_utils.js
// Shared high-detail procedural texture, neon signage, sliding-door & interior utilities
// Compatible with Three.js r128 and ST GAMES Car Game walk-in landmark architecture.
window.ApexBuildingUtils = (function () {
  function makeSignTexture(text, bgHex, textHex, borderHex, w = 512, h = 128, fontSize = 68, subText = '') {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, w, h);
    if (borderHex) {
      ctx.strokeStyle = borderHex;
      ctx.lineWidth = Math.max(6, Math.round(h * 0.08));
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = borderHex || textHex;
    ctx.shadowBlur = 14;
    ctx.fillStyle = textHex;
    ctx.font = `900 ${fontSize}px Orbitron, Inter, Arial, sans-serif`;
    ctx.fillText(text, w / 2, subText ? h * 0.40 : h * 0.52);
    if (subText) {
      ctx.shadowBlur = 6;
      ctx.font = `800 ${Math.round(fontSize * 0.42)}px Inter, Arial, sans-serif`;
      ctx.fillText(subText, w / 2, h * 0.78);
    }
    const tex = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeTileFloorTexture(colA, colB, gridCount = 8, accentLine = null) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    const step = 512 / gridCount;
    for (let x = 0; x < gridCount; x++) {
      for (let y = 0; y < gridCount; y++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? colA : colB;
        ctx.fillRect(x * step, y * step, step, step);
        ctx.strokeStyle = accentLine || 'rgba(15,23,42,0.12)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x * step, y * step, step, step);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function makeWindowStripTexture(bgCol, glassCol, litCol, cols = 8, rows = 4, glowChance = 0.35) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bgCol;
    ctx.fillRect(0, 0, 512, 512);
    const cw = 512 / cols, rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        const lit = ((r * 7 + k * 13) % 10) / 10 < glowChance;
        ctx.fillStyle = lit ? litCol : glassCol;
        ctx.fillRect(k * cw + 6, r * rh + 12, cw - 12, rh - 24);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(k * cw + 8, r * rh + 14, cw - 16, Math.max(4, (rh - 24) * 0.22));
      }
    }
    const tex = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function createTree(scale = 1.0, trunkCol = 0x7c4a24, leafCol = 0x22c55e) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 1.4 * scale, 8),
      new THREE.MeshStandardMaterial({ color: trunkCol, roughness: 0.9 })
    );
    trunk.position.y = 0.7 * scale;
    const lMat = new THREE.MeshStandardMaterial({ color: leafCol, roughness: 0.72 });
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.95 * scale, 10, 8), lMat);
    c1.position.y = 1.85 * scale;
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.68 * scale, 10, 8), lMat);
    c2.position.set(0.42 * scale, 1.55 * scale, 0.25 * scale);
    const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.62 * scale, 10, 8), lMat);
    c3.position.set(-0.38 * scale, 1.60 * scale, -0.22 * scale);
    g.add(trunk, c1, c2, c3);
    return g;
  }

  function createPottedPlant(scale = 1.0) {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32 * scale, 0.24 * scale, 0.48 * scale, 10),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55 })
    );
    pot.position.y = 0.24 * scale;
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.45 * scale, 9, 8),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 })
    );
    bush.position.y = 0.78 * scale;
    g.add(pot, bush);
    return g;
  }

  // Builds a walkable ground-floor shell with real interior walls, ceiling LEDs,
  // tiled floor, automatic sliding glass doors (doorL, doorR), and local AABB colliders
  // that keep the doorway open so players walk right inside!
  function buildWalkInShell(opts) {
    const {
      width = 24, depth = 16.5, roomH = 4.6, wallT = 0.65, doorGapHalf = 2.75,
      extMat, intWallMat, floorMat, ceilColor = 0xf8fafc, ledColor = 0xffffff,
      frameColor = 0x1e293b, glassColor = 0x7dd3fc, floorY = 0.22
    } = opts;

    const shell = new THREE.Group();
    const colliders = [];

    // Floor slab
    const floor = new THREE.Mesh(new THREE.BoxGeometry(width - 0.2, 0.22, depth - 0.2), floorMat);
    floor.position.set(0, floorY - 0.11, 0);
    floor.receiveShadow = true;
    shell.add(floor);

    // Ceiling slab
    const ceil = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.26, depth),
      new THREE.MeshStandardMaterial({ color: ceilColor, roughness: 0.65 })
    );
    ceil.position.set(0, floorY + roomH + 0.13, 0);
    shell.add(ceil);

    // Interior ceiling LED panels
    const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
    [-width * 0.28, 0, width * 0.28].forEach((lx) => {
      const led = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.07, depth - 4.2), ledMat);
      led.position.set(lx, floorY + roomH - 0.04, 0);
      shell.add(led);
    });

    // Interior PointLight so the inside view is brightly illuminated even at night
    const intLight = new THREE.PointLight(ledColor, 0.95, Math.max(width, depth) * 1.4, 1.4);
    intLight.position.set(0, floorY + roomH - 0.6, 0);
    shell.add(intLight);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, roomH, wallT), extMat);
    backWall.position.set(0, floorY + roomH / 2, -depth / 2 + wallT / 2);
    backWall.castShadow = true; backWall.receiveShadow = true;
    shell.add(backWall);
    colliders.push({ minX: -width / 2, maxX: width / 2, minZ: -depth / 2, maxZ: -depth / 2 + wallT });

    // Inner back wall finish
    const inBack = new THREE.Mesh(new THREE.BoxGeometry(width - wallT * 2 - 0.04, roomH - 0.1, 0.08), intWallMat);
    inBack.position.set(0, floorY + roomH / 2, -depth / 2 + wallT + 0.04);
    shell.add(inBack);

    // Left & Right walls + inner finishes
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, roomH, depth), extMat);
    leftWall.position.set(-width / 2 + wallT / 2, floorY + roomH / 2, 0);
    leftWall.castShadow = true;
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, roomH, depth), extMat);
    rightWall.position.set(width / 2 - wallT / 2, floorY + roomH / 2, 0);
    rightWall.castShadow = true;
    const inLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, roomH - 0.1, depth - wallT * 2 - 0.04), intWallMat);
    inLeft.position.set(-width / 2 + wallT + 0.04, floorY + roomH / 2, 0);
    const inRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, roomH - 0.1, depth - wallT * 2 - 0.04), intWallMat);
    inRight.position.set(width / 2 - wallT - 0.04, floorY + roomH / 2, 0);
    shell.add(leftWall, rightWall, inLeft, inRight);
    colliders.push({ minX: -width / 2, maxX: -width / 2 + wallT, minZ: -depth / 2, maxZ: depth / 2 });
    colliders.push({ minX: width / 2 - wallT, maxX: width / 2, minZ: -depth / 2, maxZ: depth / 2 });

    // Front wall split around wide walk-in doorway (z = +depth / 2)
    const frontSegW = (width - doorGapHalf * 2) / 2;
    const frontL = new THREE.Mesh(new THREE.BoxGeometry(frontSegW, roomH, wallT), extMat);
    frontL.position.set(-doorGapHalf - frontSegW / 2, floorY + roomH / 2, depth / 2 - wallT / 2);
    const frontR = new THREE.Mesh(new THREE.BoxGeometry(frontSegW, roomH, wallT), extMat);
    frontR.position.set(doorGapHalf + frontSegW / 2, floorY + roomH / 2, depth / 2 - wallT / 2);
    shell.add(frontL, frontR);
    colliders.push({ minX: -width / 2, maxX: -doorGapHalf, minZ: depth / 2 - wallT, maxZ: depth / 2 });
    colliders.push({ minX: doorGapHalf, maxX: width / 2, minZ: depth / 2 - wallT, maxZ: depth / 2 });

    // Front glass storefront windows embedded in frontL and frontR
    const winGlassMat = new THREE.MeshStandardMaterial({
      color: glassColor, metalness: 0.72, roughness: 0.12, transparent: true, opacity: 0.45
    });
    const winW = Math.max(1.5, frontSegW - 1.6);
    [-doorGapHalf - frontSegW / 2, doorGapHalf + frontSegW / 2].forEach((wx) => {
      const pane = new THREE.Mesh(new THREE.BoxGeometry(winW, roomH * 0.62, wallT + 0.08), winGlassMat);
      pane.position.set(wx, floorY + roomH * 0.52, depth / 2 - wallT / 2);
      shell.add(pane);
    });

    // Automatic Sliding Glass Doors (Compatible with game's doorL / doorR open animation!)
    const doorZ = depth / 2 + 0.12;
    const slideMat = new THREE.MeshStandardMaterial({
      color: glassColor, emissive: glassColor, emissiveIntensity: 0.12,
      metalness: 0.65, roughness: 0.1, transparent: true, opacity: 0.52
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: frameColor, metalness: 0.75, roughness: 0.28 });
    const doorW = doorGapHalf - 0.04;
    const doorH = roomH - 0.55;
    const doorL = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.12), slideMat);
    doorL.position.set(-doorGapHalf / 2, floorY + doorH / 2, doorZ);
    const doorR = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.12), slideMat);
    doorR.position.set(doorGapHalf / 2, floorY + doorH / 2, doorZ);

    const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.24, roomH, 0.34), frameMat);
    frameL.position.set(-doorGapHalf, floorY + roomH / 2, doorZ);
    const frameR = new THREE.Mesh(new THREE.BoxGeometry(0.24, roomH, 0.34), frameMat);
    frameR.position.set(doorGapHalf, floorY + roomH / 2, doorZ);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(doorGapHalf * 2 + 0.5, 0.52, 0.42), frameMat);
    frameTop.position.set(0, floorY + roomH - 0.26, doorZ);
    shell.add(doorL, doorR, frameL, frameR, frameTop);

    return {
      shell, doorL, doorR, doorZ, doorGapHalf, floorY, roomH, colliders, intLight
    };
  }

  function createMiniNPC(shirtHex = 0x2563eb, pantsHex = 0x1e293b, skinHex = 0xf1c27d) {
    const g = new THREE.Group();
    const sMat = new THREE.MeshStandardMaterial({ color: shirtHex, roughness: 0.65 });
    const pMat = new THREE.MeshStandardMaterial({ color: pantsHex, roughness: 0.75 });
    const kMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.55 });
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.75, 0.16), pMat); legL.position.set(-0.11, 0.38, 0);
    const legR = legL.clone(); legR.position.x = 0.11;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.24), sMat); torso.position.y = 1.04;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), kMat); head.position.y = 1.50;
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.52, 0.13), sMat); armL.position.set(-0.29, 1.04, 0);
    const armR = armL.clone(); armR.position.x = 0.29;
    g.add(legL, legR, torso, head, armL, armR);
    return g;
  }

  function createHVACUnit(scale = 1.0) {
    const g = new THREE.Group();
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1.7 * scale, 0.75 * scale, 1.2 * scale),
      new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5, metalness: 0.35 })
    );
    box.position.y = 0.38 * scale;
    const fanMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    [-0.42 * scale, 0.42 * scale].forEach((fx) => {
      const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * scale, 0.32 * scale, 0.08 * scale, 10), fanMat);
      fan.position.set(fx, 0.77 * scale, 0);
      g.add(fan);
    });
    g.add(box);
    return g;
  }

  return {
    makeSignTexture,
    makeTileFloorTexture,
    makeWindowStripTexture,
    createTree,
    createPottedPlant,
    buildWalkInShell,
    createMiniNPC,
    createHVACUnit
  };
})();
