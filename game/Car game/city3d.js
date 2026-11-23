// Sleek Curved Aerodynamic 3D Vehicle & Colorful Luxury City Engine:
// - Clean Smooth Pure Black Tar Road (ZERO white/black dots or speckles!)
// - 8 Vibrant Colorful 3D Building Themes (Colored Walls + Colored Glass Windows)
// - Smooth Bezier-Curved Aerodynamic 3D Cars (NO stacked square boxes!)
// - High-Detail Sculpted Trucks & Superbikes + Realistic Roadside Green Trees
window.ApexCity3D = (function () {
  function createSkyEnvMap(renderer) {
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envScene = new THREE.Scene();
      const skyGeo = new THREE.SphereGeometry(50, 24, 16);
      const skyCanvas = document.createElement('canvas');
      skyCanvas.width = 256; skyCanvas.height = 128;
      const ctx = skyCanvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0.0, '#38bdf8');
      grad.addColorStop(0.38, '#e0f2fe');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(0.58, '#475569');
      grad.addColorStop(1.0, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(180, 32, 18, 0, Math.PI * 2); ctx.fill();
      const skyTex = new THREE.CanvasTexture(skyCanvas);
      envScene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })));
      const rt = pmrem.fromScene(envScene, 0.03);
      pmrem.dispose();
      return rt.texture;
    } catch (e) {
      return null;
    }
  }

  // PURE CLEAN SMOOTH BLACK TAR ASPHALT (ZERO white or black speckled dots!)
  function createRoadTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    // Deep Ultra-Dark Jet-Black Tar Asphalt (ZERO speckled dots, rich satin black!)
    const baseGrad = ctx.createLinearGradient(0, 0, 256, 0);
    baseGrad.addColorStop(0.0, '#040508');
    baseGrad.addColorStop(0.22, '#07090d');
    baseGrad.addColorStop(0.32, '#0b0e14');
    baseGrad.addColorStop(0.50, '#06080c');
    baseGrad.addColorStop(0.68, '#0b0e14');
    baseGrad.addColorStop(0.78, '#07090d');
    baseGrad.addColorStop(1.0, '#040508');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(255,255,255,0.012)';
    ctx.fillRect(62, 0, 20, 256);
    ctx.fillRect(174, 0, 20, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(70, 70);
    return tex;
  }


  // REAL FLOWING ANIMATED CANAL WATER TEXTURE (Scrolling Ripples & Foam Streaks!)
  function createFlowingWaterTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0.0, '#0369a1');
    grad.addColorStop(0.3, '#0284c7');
    grad.addColorStop(0.5, '#0ea5e9');
    grad.addColorStop(0.7, '#0284c7');
    grad.addColorStop(1.0, '#0369a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    // Flowing bright water current ripples & white foam streaks
    for (let i = 0; i < 42; i++) {
      const rx = (i * 37) % 240;
      const ry = (i * 53) % 240;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(224,242,254,0.45)' : 'rgba(56,189,248,0.35)';
      ctx.fillRect(rx, ry, 4 + (i % 5) * 2, 22 + (i % 4) * 14);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 18);
    return tex;
  }

  // 8 VIBRANT COLORFUL ARCHITECTURAL BUILDING THEMES (Colored Walls + Colored Glass Windows — NOT white, NOT plain grey!)
  function createBuildingTexture(styleIdx) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 512;
    const ctx = c.getContext('2d');
    // 8 Light Vibrant Colorful Building Palettes + TRANSPARENT Glass Windows Showing Interior Chairs/Desks/Rooms!
    const palettes = [
      { wall: '#541b08', trim: '#240a03', frame: '#141210', lobby: '#381105', cols: 5, rows: 12 }, // Deep Dark Terracotta
      { wall: '#0b193d', trim: '#050c20', frame: '#0a101d', lobby: '#112252', cols: 6, rows: 14 }, // Deep Midnight Navy
      { wall: '#072e2c', trim: '#031817', frame: '#091114', lobby: '#0b423f', cols: 6, rows: 13 }, // Deep Obsidian Teal
      { wall: '#522307', trim: '#240e02', frame: '#14110f', lobby: '#612a08', cols: 5, rows: 12 }, // Deep Dark Bronze
      { wall: '#240b4f', trim: '#110429', frame: '#15102b', lobby: '#381275', cols: 6, rows: 14 }, // Deep Midnight Plum
      { wall: '#470a1c', trim: '#21040c', frame: '#121215', lobby: '#660e28', cols: 5, rows: 12 }, // Deep Dark Burgundy
      { wall: '#0f1624', trim: '#070b12', frame: '#151f30', lobby: '#172236', cols: 6, rows: 14 }, // Obsidian Charcoal Slate
      { wall: '#082917', trim: '#03140b', frame: '#0d1a12', lobby: '#0e3d23', cols: 5, rows: 13 }  // Deep Forest Pine
    ];
    const p = palettes[styleIdx % palettes.length];
    const wg = ctx.createLinearGradient(0, 0, 0, 512);
    wg.addColorStop(0, p.wall);
    wg.addColorStop(1, p.lobby);
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, 256, 512);

    ctx.fillStyle = p.trim;
    ctx.fillRect(0, 0, 256, 14);
    for (let fy = 40; fy < 436; fy += 34) {
      ctx.fillStyle = p.trim;
      ctx.globalAlpha = 0.42;
      ctx.fillRect(0, fy, 256, 4);
      ctx.globalAlpha = 1.0;
    }

    // TRANSPARENT GLASS WINDOWS WITH VISIBLE INTERIOR ROOMS, CHAIRS, DESKS & LAMPS!
    const padX = 12, padY = 20;
    const cellW = (256 - padX * 2) / p.cols, cellH = (430 - padY) / p.rows;
    for (let r = 0; r < p.rows; r++) {
      for (let col = 0; col < p.cols; col++) {
        const x = padX + col * cellW + 3, y = padY + r * cellH + 3, w = cellW - 6, h = cellH - 6;
        // Outer window frame
        ctx.fillStyle = p.frame;
        ctx.fillRect(x - 1.5, y - 1.5, w + 3, h + 3);

        // 1. Interior Room Depth (Warm sunlit room backdrop behind transparent glass)
        const roomType = (r * 7 + col * 5 + styleIdx) % 4;
        const roomGrad = ctx.createLinearGradient(x, y, x, y + h);
        if (roomType === 0) {
          roomGrad.addColorStop(0, '#fef3c7'); roomGrad.addColorStop(1, '#d6c3a5'); // Warm sunlit office
        } else if (roomType === 1) {
          roomGrad.addColorStop(0, '#e0f2fe'); roomGrad.addColorStop(1, '#94a3b8'); // Cool daylight studio
        } else if (roomType === 2) {
          roomGrad.addColorStop(0, '#fde68a'); roomGrad.addColorStop(1, '#a8a29e'); // Cozy apartment room
        } else {
          roomGrad.addColorStop(0, '#cbd5e1'); roomGrad.addColorStop(1, '#64748b'); // Shaded modern lounge
        }
        ctx.fillStyle = roomGrad;
        ctx.fillRect(x, y, w, h);

        // 2. Interior Ceiling Light Strip
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(x + w * 0.25, y + 1.5, w * 0.5, 2);

        // 3. Visible Interior Furniture (Desk + Chairs / Sofa / Shelf silhouettes inside the room!)
        // Wooden desk / table
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + w * 0.16, y + h * 0.68, w * 0.68, Math.max(2, h * 0.14));
        // Left & Right Chairs visible through transparent glass
        ctx.fillStyle = roomType % 2 === 0 ? '#1e293b' : '#b45309';
        ctx.fillRect(x + w * 0.22, y + h * 0.48, Math.max(3, w * 0.16), h * 0.34); // Chair backrest + seat
        ctx.fillRect(x + w * 0.62, y + h * 0.52, Math.max(3, w * 0.15), h * 0.30); // Second chair / monitor
        // Side curtain / blinds edge
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(x, y, Math.max(2, w * 0.14), h);

        // 4. Translucent Glass Reflection Glint Overlay (gives true transparent glass look!)
        ctx.fillStyle = 'rgba(186,230,253,0.28)';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.34)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w * 0.65, y);
        ctx.lineTo(x, y + h * 0.58);
        ctx.closePath();
        ctx.fill();

        // Crisp thin window pane mullion
        ctx.fillStyle = 'rgba(30,41,59,0.35)';
        ctx.fillRect(x + w * 0.49, y, 1.2, h);
      }
    }
    // Colorful Ground Lobby with Transparent Glass Storefront + Interior Chairs/Counters
    ctx.fillStyle = p.trim; ctx.fillRect(0, 442, 256, 70);
    ctx.fillStyle = p.frame; ctx.fillRect(0, 442, 256, 6);
    for (let sx = 18; sx < 236; sx += 44) {
      ctx.fillStyle = '#fef3c7'; ctx.fillRect(sx, 456, 32, 42);
      ctx.fillStyle = '#78350f'; ctx.fillRect(sx + 5, 480, 22, 8);
      ctx.fillStyle = '#1e293b'; ctx.fillRect(sx + 8, 470, 6, 12); ctx.fillRect(sx + 18, 470, 6, 12);
      ctx.fillStyle = 'rgba(186,230,253,0.3)'; ctx.fillRect(sx, 456, 32, 42);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  let treeMats = null;
  function createRealisticTree(type = 'oak') {
    if (!treeMats) {
      treeMats = {
        bark: new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.92 }),
        palmBark: new THREE.MeshStandardMaterial({ color: 0x7c583c, roughness: 0.9 }),
        coconut: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.85 }),
        greens: [
          new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.78 }),
          new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.75 }),
          new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.76 }),
          new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.72 })
        ]
      };
    }
    const tree = new THREE.Group();
    const canopy = new THREE.Group();
    if (type === 'palm') {
      let y = 0, x = 0;
      for (let i = 0; i < 7; i++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.24 - i * 0.018, 0.28 - i * 0.018, 1.05, 8), treeMats.palmBark);
        seg.position.set(x, y + 0.5, 0); seg.rotation.z = -0.045 * i;
        tree.add(seg);
        y += 0.92; x += 0.055 * i;
      }
      canopy.position.set(x, y, 0);
      // Coconuts cluster
      for (let c = 0; c < 3; c++) {
        const nut = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), treeMats.coconut);
        nut.position.set(Math.cos(c * 2.1) * 0.24, -0.18, Math.sin(c * 2.1) * 0.24);
        canopy.add(nut);
      }
      for (let f = 0; f < 10; f++) {
        const fg = new THREE.Group();
        fg.rotation.y = (f / 10) * Math.PI * 2;
        const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 2.5), treeMats.greens[f % 4]);
        l1.position.set(0, 0.28, 1.15); l1.rotation.x = 0.24;
        const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 1.8), treeMats.greens[(f + 1) % 4]);
        l2.position.set(0, -0.26, 2.75); l2.rotation.x = -0.42;
        fg.add(l1, l2); canopy.add(fg);
      }
      tree.add(canopy);
    } else {
      const baseRoot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.56, 0.7, 10), treeMats.bark);
      baseRoot.position.y = 0.35; tree.add(baseRoot);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 3.6, 10), treeMats.bark);
      trunk.position.y = 1.9; tree.add(trunk);
      canopy.position.set(0, 3.6, 0);
      const branches = [[0.75, 0.2, 0.45], [-0.75, 0.1, -0.4], [0.35, 0.3, -0.78], [-0.4, 0.2, 0.72], [0.65, 0.75, -0.5], [-0.6, 0.7, 0.5]];
      branches.forEach(([bx, by, bz], idx) => {
        const cluster = new THREE.Mesh(new THREE.DodecahedronGeometry(1.45, 1), treeMats.greens[idx % 4]);
        cluster.scale.set(1.28, 0.85, 1.24);
        cluster.position.set(bx * 1.45, by + 0.55, bz * 1.45);
        canopy.add(cluster);
      });
      const topCrown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.65, 1), treeMats.greens[3]);
      topCrown.scale.set(1.3, 0.9, 1.26); topCrown.position.set(0, 1.35, 0);
      canopy.add(topCrown);
      tree.add(canopy);
    }
    tree.userData.canopy = canopy;
    return tree;
  }

  // SMOOTH CURVED AERODYNAMIC 3D VEHICLES (Bezier-Curved Car Bodies — NO Boxy Stacked Cubes!)
  function buildVehicleMesh(vehicleObj) {
    const group = new THREE.Group();
    const chassis = new THREE.Group();
    group.add(chassis);

    const wheels = [];
    const frontWheelPivots = [];
    const flames = [];

    const mainColor = vehicleObj.id === 0 ? 0xffffff : (vehicleObj.colorHex || 0xdc2626);
    const accentColor = vehicleObj.accentHex || 0x0f172a;
    const style = vehicleObj.bodyStyle || 'sedan';
    const vid = vehicleObj.id || 0;

    const isVeryLight = mainColor === 0xffffff || mainColor === 0xf8fafc || mainColor === 0xf1f5f9 || mainColor === 0xe2e8f0;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: mainColor,
      metalness: isVeryLight ? 0.26 : 0.76,
      roughness: isVeryLight ? 0.12 : 0.14,
      envMapIntensity: 1.5
    });
    const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.55, roughness: 0.22 });
    const glossyBlackMat = new THREE.MeshStandardMaterial({ color: 0x0b0f17, metalness: 0.65, roughness: 0.16 });
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x161b24, metalness: 0.35, roughness: 0.45 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.96, roughness: 0.06, envMapIntensity: 1.7 });
    const goldForkMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.88, roughness: 0.18 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141619, roughness: 0.85, metalness: 0.05 });
    const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.45, roughness: 0.28 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x071526,
      metalness: 0.94,
      roughness: 0.04,
      envMapIntensity: 1.9,
      transparent: true,
      opacity: 0.9
    });
    const headMat = new THREE.MeshBasicMaterial({ color: 0xe0f7ff });
    const drlMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1e1e });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.92 });

    const addWheel = (wx, wy, wz, r, width, isFront) => {
      const pivot = new THREE.Group();
      pivot.position.set(wx, wy, wz);
      const wg = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, width, 24), tireMat);
      tire.rotation.z = Math.PI / 2;
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r * 0.7, width + 0.015, 20), chromeMat);
      rim.rotation.z = Math.PI / 2;
      const inner = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.56, r * 0.56, width + 0.02, 16), glossyBlackMat);
      inner.rotation.z = Math.PI / 2;
      const rotor = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.50, r * 0.50, width + 0.01, 16), chromeMat);
      rotor.rotation.z = Math.PI / 2;
      const cal = new THREE.Mesh(new THREE.BoxGeometry(width * 0.62, r * 0.34, r * 0.24), caliperMat);
      cal.position.set(0, r * 0.26, -r * 0.26);
      // Deep-dish outer alloy lip + crisp 10-spoke Y-pattern sport rim
      const outerLip = new THREE.Mesh(new THREE.TorusGeometry(r * 0.69, 0.032, 8, 24), chromeMat);
      outerLip.rotation.y = Math.PI / 2;
      outerLip.position.x = (wx < 0 ? -1 : 1) * (width * 0.48);
      wg.add(outerLip);
      for (let sp = 0; sp < 5; sp++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(width + 0.04, r * 1.32, 0.045), chromeMat);
        spoke.rotation.x = (sp / 5) * Math.PI;
        const spoke2 = new THREE.Mesh(new THREE.BoxGeometry(width + 0.03, r * 1.24, 0.028), glossyBlackMat);
        spoke2.rotation.x = (sp / 5) * Math.PI + 0.16;
        wg.add(spoke, spoke2);
      }
      wg.add(tire, rim, inner, rotor, cal);
      pivot.add(wg);
      group.add(pivot);
      wheels.push(wg);
      if (isFront) frontWheelPivots.push(pivot);
    };

    const addFlame = (fx, fy, fz) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.15, 10), flameMat);
      cone.rotation.x = Math.PI / 2; cone.position.set(fx, fy, fz); cone.visible = false;
      chassis.add(cone); flames.push(cone);
    };

    if (vehicleObj.modelType === 'bike') {
      const isNaked = style === 'naked_street' || style === 'triple_street';
      const isCafe = style === 'cafe_racer';
      const isTron = style === 'ev_tron';
      const hasWings = style === 'cbr_wings' || style === 'ducati_v4' || style === 'h2r_supercharged' || style === 'aprilia_gp';
      const isAsym = style === 'bmw_asym';
      const wb = isCafe ? 1.12 : isTron ? 1.22 : hasWings ? 1.04 : 1.0;

      // Sculpted Swingarm + Trellis/Twin-Spar Chassis Frame + Engine Block
      const trellisMat = (isNaked || style === 'ducati_v4') ? accentMat : chromeMat;
      const frameL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 1.22), trellisMat);
      frameL.position.set(-0.21, 0.78, -0.04); frameL.rotation.x = -0.18;
      const frameR = frameL.clone(); frameR.position.x = 0.21;
      const swingL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, 0.72), chromeMat);
      swingL.position.set(-0.2, 0.44, wb - 0.34);
      const swingR = swingL.clone(); swingR.position.x = 0.2;
      const engineCore = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.46, 0.66), carbonMat);
      engineCore.position.set(0, 0.54, -0.06);

      // Distinct Fuel Tank & Tail Cowl per Bike Archetype
      const tank = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 14), bodyMat);
      tank.scale.set(isCafe ? 0.76 : 0.88, isCafe ? 0.62 : 0.72, isTron ? 2.0 : isCafe ? 1.45 : 1.55);
      tank.position.set(0, 0.96, -0.16);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, isCafe ? 0.78 : 0.60), isCafe ? new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 }) : glossyBlackMat);
      seat.position.set(0, 0.90, 0.42); seat.rotation.x = isCafe ? 0 : -0.12;
      const tailCowl = new THREE.Mesh(new THREE.ConeGeometry(isCafe ? 0.20 : 0.25, isCafe ? 0.55 : 0.92, 10), bodyMat);
      tailCowl.rotation.x = Math.PI / 2.25; tailCowl.position.set(0, isCafe ? 0.96 : 1.08, 0.94);

      // Front Suspension Forks + Handlebars
      const forkMat = (hasWings || style === 'r1_track') ? goldForkMat : chromeMat;
      const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.036, 0.96, 10), forkMat);
      forkL.position.set(-0.16, 0.78, -wb + 0.18); forkL.rotation.x = isCafe ? -0.40 : -0.32;
      const forkR = forkL.clone(); forkR.position.x = 0.16;
      const clipBar = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, isNaked ? 0.96 : 0.84, 8), glossyBlackMat);
      clipBar.rotation.z = Math.PI / 2; clipBar.position.set(0, isNaked || isCafe ? 1.18 : 1.08, -0.62);
      chassis.add(frameL, frameR, swingL, swingR, engineCore, tank, seat, tailCowl, forkL, forkR, clipBar);

      if (isCafe) {
        // Retro Chrome Round Headlight + Cafe Bubble Cowl + Twin Low Chrome Exhausts
        const roundLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.18, 18), chromeMat);
        roundLamp.rotation.x = Math.PI / 2; roundLamp.position.set(0, 1.02, -0.96);
        const lampGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 16), headMat);
        lampGlass.rotation.x = Math.PI / 2; lampGlass.position.set(0, 1.02, -1.05);
        chassis.add(roundLamp, lampGlass);
      } else if (isNaked) {
        // Streetfighter Angular Headlight Mask + Side Radiator Shrouds
        const mask = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.30, 0.28), bodyMat);
        mask.position.set(0, 1.02, -0.92); mask.rotation.x = 0.25;
        const shroudL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.52), accentMat);
        shroudL.position.set(-0.28, 0.80, -0.42); shroudL.rotation.y = 0.2;
        const shroudR = shroudL.clone(); shroudR.position.x = 0.28; shroudR.rotation.y = -0.2;
        chassis.add(mask, shroudL, shroudR);
      } else {
        // Full-Fairing Superbike Aero Nose + Side Fairings + Belly Pan + Racing Bubble Windscreen
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.08, 14), bodyMat);
        nose.rotation.x = -Math.PI / 2.25; nose.position.set(0, 0.94, -0.88);
        const sideFairL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.44, 0.92), bodyMat);
        sideFairL.position.set(-0.26, 0.68, -0.34);
        const sideFairR = sideFairL.clone(); sideFairR.position.x = 0.26;
        const bellyPan = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.95), accentMat);
        bellyPan.position.set(0, 0.34, -0.18);
        const visor = new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), glassMat);
        visor.scale.set(0.80, 1.0, 1.48); visor.position.set(0, 1.05, -0.72);
        chassis.add(nose, sideFairL, sideFairR, bellyPan, visor);
      }
      if (hasWings) {
        // MotoGP Dual Downforce Carbon Winglets
        const winglet = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.05, 0.26), carbonMat);
        winglet.position.set(0, 0.86, -0.84);
        const tipL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.26), accentMat);
        tipL.position.set(-0.53, 0.88, -0.84);
        const tipR = tipL.clone(); tipR.position.x = 0.53;
        chassis.add(winglet, tipL, tipR);
      }
      if (isTron) {
        // Futuristic Neon Tron Lightcycle Arcs & Glowing Wheel Rings
        const neonCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const neonArc = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 2.55), neonCyan);
        neonArc.position.set(0, 0.82, 0);
        const ringF = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.035, 8, 24), neonCyan);
        ringF.rotation.y = Math.PI / 2; ringF.position.set(0, 0.42, -wb);
        const ringR = ringF.clone(); ringR.position.z = wb;
        chassis.add(neonArc, ringF, ringR);
      }

      // REAL 3D HUMAN RIDER SITTING ON THE BIKE (Helmet + Visor + Racing Jacket + Arms on Handlebar + Bent Legs on Footpegs!)
      const rider = new THREE.Group();
      const suitMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.55, metalness: 0.15 });
      const riderAccent = new THREE.MeshStandardMaterial({ color: isVeryLight ? 0xef4444 : mainColor, roughness: 0.35, metalness: 0.45 });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.7 });
      const upright = isCafe || isNaked;
      const leanX = upright ? -0.32 : -0.68;

      // Torso (Racing Jacket + Colorful Racing Stripe)
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.58, 0.26), suitMat);
      torso.position.set(0, upright ? 1.36 : 1.28, upright ? 0.28 : 0.18);
      torso.rotation.x = leanX;
      const chestPad = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 0.28), riderAccent);
      chestPad.position.set(0, upright ? 1.44 : 1.33, upright ? 0.24 : 0.12);
      chestPad.rotation.x = leanX;
      // Racing Helmet + Reflective Dark Visor
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 14), riderAccent);
      helmet.position.set(0, upright ? 1.78 : 1.58, upright ? 0.14 : -0.10);
      const hVisor = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 10, -Math.PI * 0.35, Math.PI * 0.7, Math.PI * 0.28, Math.PI * 0.34), glassMat);
      hVisor.position.copy(helmet.position);
      hVisor.rotation.y = Math.PI;
      // Arms reaching forward to grip the handlebars
      [-1, 1].forEach((s) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.62, 8), suitMat);
        arm.position.set(s * 0.28, upright ? 1.34 : 1.24, -0.22);
        arm.rotation.x = upright ? 1.15 : 1.32;
        arm.rotation.z = s * 0.22;
        const glove = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), riderAccent);
        glove.position.set(s * 0.36, upright ? 1.18 : 1.08, -0.60);
        // Bent Thigh + Lower Leg + Boot resting on footpeg
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.48, 8), suitMat);
        thigh.position.set(s * 0.22, 0.88, 0.22);
        thigh.rotation.x = 0.88;
        const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.46, 8), suitMat);
        shin.position.set(s * 0.23, 0.60, 0.16);
        shin.rotation.x = -0.35;
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.10, 0.24), riderAccent);
        boot.position.set(s * 0.24, 0.40, 0.14);
        rider.add(arm, glove, thigh, shin, boot);
      });
      rider.add(torso, chestPad, helmet, hVisor);
      chassis.add(rider);

      // Exhausts & Lights
      const exR = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.088, 0.94, 12), isCafe ? chromeMat : carbonMat);
      exR.rotation.x = isCafe ? Math.PI / 2 : Math.PI / 2.25;
      exR.position.set(0.25, isCafe ? 0.46 : 0.60, 0.72);
      const exL = exR.clone(); exL.position.x = -0.25;
      const hlL = new THREE.Mesh(new THREE.BoxGeometry(isAsym ? 0.18 : 0.14, 0.06, 0.08), headMat);
      hlL.position.set(-0.14, 0.94, -1.26);
      const hlR = new THREE.Mesh(new THREE.BoxGeometry(isAsym ? 0.11 : 0.14, 0.06, 0.08), isAsym ? drlMat : headMat);
      hlR.position.set(0.14, 0.94, -1.26);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.08), tailMat);
      tl.position.set(0, 1.10, 1.25);
      // MAJOR COLORFUL BIKE UPGRADE: Neon Rim Stripes on Both Wheels + Two-Tone Racing Belly/Tank Stripes + Dual Angel-Eye Rings!
      const bikeNeonMat = new THREE.MeshBasicMaterial({ color: accentColor === 0x0f172a || accentColor === 0x111827 ? 0x00f0ff : accentColor });
      const rimStripeF = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.028, 8, 24), bikeNeonMat);
      rimStripeF.rotation.y = Math.PI / 2; rimStripeF.position.set(0.115, 0.42, -wb);
      const rimStripeF2 = rimStripeF.clone(); rimStripeF2.position.x = -0.115;
      const rimStripeR = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.028, 8, 24), bikeNeonMat);
      rimStripeR.rotation.y = Math.PI / 2; rimStripeR.position.set(0.165, 0.42, wb);
      const rimStripeR2 = rimStripeR.clone(); rimStripeR2.position.x = -0.165;
      // Vibrant Tank Racing Stripe + Front Mudguard + Rear Hugger Fender + Side Mirrors
      const tankStripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.62), bikeNeonMat);
      tankStripe.position.set(0, 1.22, -0.16);
      const frontFender = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.24, 14, 1, true, -0.8, 1.4), bodyMat);
      frontFender.rotation.z = Math.PI / 2; frontFender.position.set(0, 0.44, -wb);
      const bMirL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.08), glossyBlackMat);
      bMirL.position.set(-0.46, 1.24, -0.68);
      const bMirR = bMirL.clone(); bMirR.position.x = 0.46;
      // Colorful Neon Underglow Strip under Bike Engine
      const bikeGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.3), new THREE.MeshBasicMaterial({ color: accentColor === 0x0f172a ? 0x00f0ff : accentColor, transparent: true, opacity: 0.28, depthWrite: false }));
      bikeGlow.rotation.x = -Math.PI / 2; bikeGlow.position.y = 0.05;
      chassis.add(exR, exL, hlL, hlR, tl, rimStripeF, rimStripeF2, rimStripeR, rimStripeR2, tankStripe, frontFender, bMirL, bMirR, bikeGlow);

      addWheel(0, 0.42, -wb, 0.42, 0.22, true);
      addWheel(0, 0.42, wb, 0.42, 0.32, false);
      addFlame(0.25, isCafe ? 0.46 : 0.60, 1.48); addFlame(-0.25, isCafe ? 0.46 : 0.60, 1.48);
    } else if (vehicleObj.modelType === 'truck' || vehicleObj.modelType === 'heavy_truck') {
      const isMonster = style === 'monster_giant';
      const is6x6 = style === 'armored_6x6';
      const isCyber = style === 'cyber_wedge';
      const isJeep = style === 'jeep_open';
      const isSafari = style === 'safari_suv';
      const isGWagon = style === 'gwagon_box';
      const isHummer = style === 'hummer_ev';
      const isBaja = style === 'baja_trophy';
      const isDesert = style === 'desert_rollbar';
      const isRaptor = style === 'raptor_wide' || style === 'ram_hood';
      const isSUV = isSafari || isGWagon || isJeep || isHummer;
      const lenScale = is6x6 ? 1.22 : isJeep ? 0.88 : isSUV ? 0.96 : 1.06;
      const bodyW = (isRaptor || isHummer || isMonster) ? 2.34 : 2.12;
      const liftY = isMonster ? 0.72 : isBaja ? 0.22 : 0;
      const wheelR = isMonster ? 0.96 : isBaja || is6x6 ? 0.64 : 0.56;

      // Distinct Sculpted 3D Body Profile per Truck Archetype!
      const shape = new THREE.Shape();
      if (isCyber) {
        // Sharp Stainless-Steel Cybertruck Polygonal Wedge
        shape.moveTo(-2.65, 0.52); shape.lineTo(2.65, 0.52); shape.lineTo(2.60, 1.56);
        shape.lineTo(-0.25, 2.26); shape.lineTo(-2.60, 1.28); shape.closePath();
      } else if (isJeep) {
        // Compact Open-Top Off-Road Wrangler
        shape.moveTo(-2.15, 0.50); shape.lineTo(2.15, 0.50); shape.lineTo(2.15, 1.38);
        shape.lineTo(-0.95, 1.38); shape.lineTo(-1.18, 2.02); shape.lineTo(-1.32, 2.02);
        shape.lineTo(-1.42, 1.40); shape.lineTo(-2.15, 1.34); shape.closePath();
      } else if (isSUV) {
        // Boxy Luxury G-Wagon / Safari Defender / Hummer EV
        shape.moveTo(-2.38 * lenScale, 0.50); shape.lineTo(2.38 * lenScale, 0.50); shape.lineTo(2.38 * lenScale, 2.12);
        shape.quadraticCurveTo(2.22 * lenScale, 2.24, 1.85 * lenScale, 2.24);
        shape.lineTo(-0.82, 2.24); shape.quadraticCurveTo(-1.12, 2.20, -1.42, 1.52);
        shape.lineTo(-2.30 * lenScale, 1.44); shape.quadraticCurveTo(-2.45 * lenScale, 1.30, -2.38 * lenScale, 0.50);
      } else if (is6x6) {
        // Heavy Tactical Armored 6x6 Carrier
        shape.moveTo(-2.6 * lenScale, 0.55); shape.lineTo(2.6 * lenScale, 0.55);
        shape.lineTo(2.55 * lenScale, 1.85); shape.lineTo(0.8, 1.85);
        shape.lineTo(0.45, 2.30); shape.lineTo(-1.05, 2.30);
        shape.lineTo(-1.55, 1.58); shape.lineTo(-2.55 * lenScale, 1.44); shape.closePath();
      } else {
        // Muscular Pickup / Raptor / Desert Runner / Baja Trophy / Monster Truck
        shape.moveTo(-2.5 * lenScale, 0.52); shape.lineTo(2.5 * lenScale, 0.52);
        shape.lineTo(2.5 * lenScale, 1.38); shape.lineTo(0.42, 1.38);
        shape.lineTo(0.18, 2.16); shape.lineTo(-1.02, 2.16);
        shape.quadraticCurveTo(-1.28, 2.12, -1.58, 1.50);
        shape.lineTo(-2.44 * lenScale, 1.40); shape.quadraticCurveTo(-2.58 * lenScale, 1.25, -2.5 * lenScale, 0.52);
      }
      const extrude = new THREE.ExtrudeGeometry(shape, { depth: bodyW, bevelEnabled: true, bevelThickness: 0.10, bevelSize: 0.08, bevelSegments: 4 });
      extrude.translate(0, 0, -bodyW / 2);
      extrude.rotateY(-Math.PI / 2);
      const bodyMesh = new THREE.Mesh(extrude, bodyMat);
      bodyMesh.position.y = liftY;
      chassis.add(bodyMesh);

      // Cabin Windows (or Open Roll Cage + Seats for Jeep!)
      if (isJeep) {
        const cageBarL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), glossyBlackMat);
        cageBarL.rotation.x = Math.PI / 2; cageBarL.position.set(-0.92, 2.02 + liftY, 0.45);
        const cageBarR = cageBarL.clone(); cageBarR.position.x = 0.92;
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.72, 8), glossyBlackMat);
        postL.position.set(-0.92, 1.68 + liftY, 1.75);
        const postR = postL.clone(); postR.position.x = 0.92;
        const jSeatL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.62, 0.2), carbonMat);
        jSeatL.position.set(-0.48, 1.52 + liftY, 0.05);
        const jSeatR = jSeatL.clone(); jSeatR.position.x = 0.48;
        chassis.add(cageBarL, cageBarR, postL, postR, jSeatL, jSeatR);
      } else {
        const glassCab = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.06, 0.56, isSUV ? 2.75 : is6x6 ? 1.85 : 1.52), glassMat);
        glassCab.position.set(0, 1.80 + liftY, isSUV ? 0.42 : -0.34);
        chassis.add(glassCab);
      }

      // Archetype-Specific Signature 3D Truck Accessories!
      if (isMonster) {
        // Exposed Orange Coil Suspension Shocks + Chrome Hood Supercharger Blower!
        const shockMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.7, roughness: 0.25 });
        [[-1.0, -1.55], [1.0, -1.55], [-1.0, 1.55], [1.0, 1.55]].forEach(([sx, sz]) => {
          const shock = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.95, 10), shockMat);
          shock.position.set(sx, 0.92, sz * lenScale);
          chassis.add(shock);
        });
        const mBlower = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.36, 0.84), chromeMat);
        mBlower.position.set(0, 1.62 + liftY, -1.78 * lenScale);
        chassis.add(mBlower);
      }
      if (isDesert || isBaja) {
        // Tubular Desert Rollbar + Rear Mounted Spare Tire in Cargo Bed + 4 Roof Spotlights
        const rbL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.15, 8), chromeMat);
        rbL.position.set(-0.92, 1.78 + liftY, 0.85); rbL.rotation.x = 0.35;
        const rbR = rbL.clone(); rbR.position.x = 0.92;
        const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.34, 18), tireMat);
        spare.rotation.x = 0.45; spare.position.set(0, 1.52 + liftY, 1.72 * lenScale);
        chassis.add(rbL, rbR, spare);
      }
      if (isSafari || isGWagon || isJeep) {
        // Rear Door Spare Wheel + Roof Expedition Rack (Safari)
        const rearSpare = new THREE.Mesh(new THREE.CylinderGeometry(0.50, 0.50, 0.32, 18), tireMat);
        rearSpare.rotation.x = Math.PI / 2;
        rearSpare.position.set(0, 1.32 + liftY, 2.52 * lenScale);
        chassis.add(rearSpare);
        if (isSafari) {
          const rack = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.9, 0.14, 2.4), carbonMat);
          rack.position.set(0, 2.30 + liftY, 0.45);
          const cargo = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.30, 1.15), accentMat);
          cargo.position.set(-0.35, 2.48 + liftY, 0.65);
          chassis.add(rack, cargo);
        }
      }
      if (isRaptor || is6x6) {
        // Twin Upright Chrome Exhaust Stacks + Aggressive Hood Scoop
        const stackL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.45, 10), chromeMat);
        stackL.position.set(-0.95, 1.85 + liftY, 0.58);
        const stackR = stackL.clone(); stackR.position.x = 0.95;
        const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 0.72), glossyBlackMat);
        scoop.position.set(0, 1.50 + liftY, -1.78 * lenScale);
        chassis.add(stackL, stackR, scoop);
      }

      // Front Bullbar, Side Running Boards, Roof LED Lightbar & Headlights/Taillights
      const bullBar = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.18, 0.30, 0.28), carbonMat);
      bullBar.position.set(0, 0.72 + liftY, -2.58 * lenScale);
      const stepL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 2.4), carbonMat);
      stepL.position.set(-bodyW / 2 - 0.12, 0.48 + liftY, 0);
      const stepR = stepL.clone(); stepR.position.x = bodyW / 2 + 0.12;
      const roofLight = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.12, 0.16), isHummer || isCyber ? drlMat : headMat);
      roofLight.position.set(0, (isJeep ? 2.08 : 2.26) + liftY, -0.92);

      if (isCyber || isHummer) {
        const barF = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.12, 0.12, 0.12), isCyber ? drlMat : headMat);
        barF.position.set(0, 1.24 + liftY, -2.62 * lenScale);
        const barR = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.12, 0.12, 0.12), tailMat);
        barR.position.set(0, 1.46 + liftY, 2.62 * lenScale);
        chassis.add(barF, barR);
      } else {
        const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.22, 0.12), headMat);
        hl1.position.set(-bodyW * 0.38, 1.12 + liftY, -2.54 * lenScale);
        const hl2 = hl1.clone(); hl2.position.x = bodyW * 0.38;
        const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.46, 0.12), tailMat);
        tl1.position.set(-bodyW * 0.42, 1.12 + liftY, 2.54 * lenScale);
        const tl2 = tl1.clone(); tl2.position.x = bodyW * 0.42;
        chassis.add(hl1, hl2, tl1, tl2);
      }
      // MAJOR TRUCK UPGRADE: Chrome Slat Grille + 3 Amber Raptor Marker Lights + Flared Fender Arches + Red Tow Hooks + Side Mirrors + Mudflaps!
      const grilleBox = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.62, 0.46, 0.14), glossyBlackMat);
      grilleBox.position.set(0, 1.08 + liftY, -2.53 * lenScale);
      for (let sl = -1; sl <= 1; sl++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.58, 0.05, 0.16), chromeMat);
        slat.position.set(0, 1.08 + sl * 0.12 + liftY, -2.54 * lenScale);
        chassis.add(slat);
      }
      // 3 Signature Glowing Amber Off-Road Grille Marker Lights
      const amberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      [-0.28, 0, 0.28].forEach((ax) => {
        const mk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.08), amberMat);
        mk.position.set(ax, 1.32 + liftY, -2.57 * lenScale);
        chassis.add(mk);
      });
      // Red Heavy-Duty Front Tow Hooks + Big Truck Wing Mirrors + Rear Mudflaps
      const hookMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.3 });
      [-0.58, 0.58].forEach((tx) => {
        const hook = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.035, 8, 12), hookMat);
        hook.position.set(tx, 0.64 + liftY, -2.72 * lenScale);
        chassis.add(hook);
      });
      const tMirL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.14), glossyBlackMat);
      tMirL.position.set(-bodyW / 2 - 0.20, 1.66 + liftY, -0.96);
      const tMirR = tMirL.clone(); tMirR.position.x = bodyW / 2 + 0.20;
      // Flared Matte-Black Off-Road Wheel Arch Fenders + Rear Mudflaps
      [-1.55 * lenScale, 1.55 * lenScale].forEach((fz) => {
        const arch = new THREE.Mesh(new THREE.CylinderGeometry(wheelR + 0.14, wheelR + 0.14, bodyW + 0.26, 16, 1, false, 0, Math.PI), carbonMat);
        arch.rotation.z = Math.PI / 2; arch.rotation.x = Math.PI / 2;
        arch.position.set(0, wheelR + 0.06 + liftY * 0.35, fz);
        chassis.add(arch);
      });
      const flapL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.36, 0.06), carbonMat);
      flapL.position.set(-bodyW / 2 + 0.12, 0.45 + liftY * 0.4, 2.38 * lenScale);
      const flapR = flapL.clone(); flapR.position.x = bodyW / 2 - 0.12;
      // Roof Cab Visor Trim
      const cabVisor = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.92, 0.08, 0.28), accentMat);
      cabVisor.position.set(0, (isJeep ? 2.02 : 2.18) + liftY, -1.06);
      chassis.add(bullBar, stepL, stepR, roofLight, grilleBox, tMirL, tMirR, flapL, flapR, cabVisor);

      const twx = bodyW / 2 + 0.12;
      addWheel(-twx, wheelR, -1.55 * lenScale, wheelR, isMonster ? 0.72 : 0.46, true);
      addWheel(twx, wheelR, -1.55 * lenScale, wheelR, isMonster ? 0.72 : 0.46, true);
      addWheel(-twx, wheelR, 1.55 * lenScale, wheelR, isMonster ? 0.72 : 0.46, false);
      addWheel(twx, wheelR, 1.55 * lenScale, wheelR, isMonster ? 0.72 : 0.46, false);
      if (is6x6) {
        addWheel(-twx, wheelR, 0.38, wheelR, 0.46, false);
        addWheel(twx, wheelR, 0.38, wheelR, 0.46, false);
      }
      addFlame(-0.62, 0.58 + liftY, 2.95 * lenScale); addFlame(0.62, 0.58 + liftY, 2.95 * lenScale);
    } else {
      // REAL AUTOMOTIVE SCULPTED 3D CAR (Lower Beltline Body + Flared Fenders + Tapered Greenhouse Cabin + Distinct Hood & Trunk)
      const isCompact = (vid % 5 === 2);
      const lenMul = isCompact ? 0.94 : 1.0;

      const isOpen = style === 'spyder_open' || style === 'wedge_spyder';
      const isMuscle = style === 'muscle_blower' || style === 'long_hood';
      const isSedan = style === 'sedan' || style === 'fastback' || style === 'sport_sedan';
      const isHyperFin = style === 'hyper_fin' || style === 'swan_wing' || style === 'teardrop_hyper';
      const hasBigWing = style === 'drift_wing' || style === 'gt_racer' || style === 'widebody' || style === 'swan_wing' || style === 'stealth_wedge';

      const bodyW = (style === 'widebody' || style === 'stealth_wedge' || style === 'bugatti_arch') ? 2.12 : isCompact ? 1.84 : 1.96;
      const hoodH = isSedan || isCompact ? 0.78 : 0.66;
      const deckH = isSedan || isCompact ? 0.88 : 0.78;
      const roofH = isOpen ? 0.86 : isSedan || isCompact ? 1.34 : 1.16;

      // 1. Sculpted Lower Body (Distinct Low Hood, Beltline Shoulder, Rear Trunk Deck)
      const lowerShape = new THREE.Shape();
      lowerShape.moveTo(-2.24 * lenMul, 0.24);
      lowerShape.lineTo(2.22 * lenMul, 0.24);
      // Rear bumper & crisp trunk lip
      lowerShape.quadraticCurveTo(2.34 * lenMul, 0.48, 2.24 * lenMul, deckH);
      // Rear trunk deck / engine bay
      lowerShape.lineTo(1.18 * lenMul, deckH + 0.04);
      // Beltline shoulder along doors
      lowerShape.lineTo(-0.98 * lenMul, hoodH + 0.06);
      // Sculpted sloping hood down to aggressive nose
      lowerShape.quadraticCurveTo(-1.82 * lenMul, hoodH + 0.02, -2.28 * lenMul, 0.50);
      lowerShape.quadraticCurveTo(-2.34 * lenMul, 0.34, -2.24 * lenMul, 0.24);

      const lowerExt = new THREE.ExtrudeGeometry(lowerShape, {
        depth: bodyW - 0.14,
        bevelEnabled: true,
        bevelThickness: 0.07,
        bevelSize: 0.06,
        bevelSegments: 4
      });
      lowerExt.translate(0, 0, -(bodyW - 0.14) / 2);
      lowerExt.rotateY(-Math.PI / 2);
      const lowerMesh = new THREE.Mesh(lowerExt, bodyMat);
      chassis.add(lowerMesh);

      // 2. Sculpted Flared Fender Haunches & Dark Wheel Wells
      const archPositions = [[-1.36 * lenMul, 0.42], [1.36 * lenMul, 0.42]];
      archPositions.forEach(([az, ay]) => {
        const well = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, bodyW + 0.02, 18), glossyBlackMat);
        well.rotation.z = Math.PI / 2;
        well.position.set(0, ay, az);
        chassis.add(well);

        const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, bodyW + 0.08, 18, 1, false, 0, Math.PI), bodyMat);
        flare.rotation.z = Math.PI / 2;
        flare.rotation.x = Math.PI / 2;
        flare.position.set(0, ay + 0.03, az);
        chassis.add(flare);
      });

      // Carbon Side Skirts
      const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 2.15 * lenMul), carbonMat);
      skirtL.position.set(-bodyW / 2 - 0.02, 0.25, 0);
      const skirtR = skirtL.clone(); skirtR.position.x = bodyW / 2 + 0.02;
      chassis.add(skirtL, skirtR);

      // 3. Tapered Greenhouse Cabin (Real Automotive Tumblehome — Narrower than Lower Body!)
      if (!isOpen) {
        const cabW = bodyW * 0.76;
        const glassShape = new THREE.Shape();
        const rearBaseX = isSedan ? 1.48 * lenMul : 1.56 * lenMul;
        const frontBaseX = isSedan ? -1.04 * lenMul : -1.16 * lenMul;
        glassShape.moveTo(frontBaseX, hoodH - 0.02);
        glassShape.lineTo(rearBaseX, deckH - 0.02);
        glassShape.quadraticCurveTo(0.92 * lenMul, roofH, 0.48 * lenMul, roofH);
        glassShape.lineTo(-0.22 * lenMul, roofH);
        glassShape.quadraticCurveTo(-0.62 * lenMul, roofH - 0.02, frontBaseX, hoodH - 0.02);

        const glassExt = new THREE.ExtrudeGeometry(glassShape, {
          depth: cabW,
          bevelEnabled: true,
          bevelThickness: 0.06,
          bevelSize: 0.04,
          bevelSegments: 3
        });
        glassExt.translate(0, 0, -cabW / 2);
        glassExt.rotateY(-Math.PI / 2);
        const glassMesh = new THREE.Mesh(glassExt, glassMat);
        chassis.add(glassMesh);

        // Visible Interior Sport Cabin (Twin Bucket Seats + Dashboard visible through tinted glass!)
        const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
        [-0.36, 0.36].forEach((sx) => {
          const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.12), seatMat);
          seatBack.position.set(sx, hoodH + 0.18, 0.28 * lenMul); seatBack.rotation.x = -0.18;
          chassis.add(seatBack);
        });
        const dash = new THREE.Mesh(new THREE.BoxGeometry(cabW * 0.88, 0.16, 0.34), glossyBlackMat);
        dash.position.set(0, hoodH + 0.06, -0.62 * lenMul);
        chassis.add(dash);

        // Sleek Glossy Black B-Pillar Dividers on both sides for authentic coupe/sedan window framing
        [-cabW / 2 - 0.045, cabW / 2 + 0.045].forEach((px) => {
          const bPil = new THREE.Mesh(new THREE.BoxGeometry(0.035, roofH - hoodH - 0.06, 0.12), glossyBlackMat);
          bPil.position.set(px, (roofH + hoodH) * 0.5, 0.12 * lenMul);
          chassis.add(bPil);
        });

        // Painted Roof Cap & A/C-Pillar Trim (So roof matches car body paint while glass wraps underneath!)
        const roofCap = new THREE.Mesh(new THREE.BoxGeometry(cabW * 0.94, 0.07, 1.05 * lenMul), bodyMat);
        roofCap.position.set(0, roofH + 0.015, 0.14 * lenMul);
        chassis.add(roofCap);

        // Subtle Rear Lip Spoiler for Sedans/Coupes
        if (!hasBigWing) {
          const lip = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.88, 0.06, 0.16), accentMat);
          lip.position.set(0, deckH + 0.06, 2.18 * lenMul);
          chassis.add(lip);
        }
      } else {
        // Low Raked Roadster Windshield + Chrome Roll Hoops
        const ws = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.78, 0.34, 0.06), glassMat);
        ws.position.set(0, hoodH + 0.14, -0.78 * lenMul);
        ws.rotation.x = -0.78;
        const hoopL = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 12, Math.PI), chromeMat);
        hoopL.position.set(-0.42, 0.98, 0.42);
        const hoopR = hoopL.clone(); hoopR.position.x = 0.42;
        chassis.add(ws, hoopL, hoopR);
      }

      // 4. Front Grille, Splitter, Diffuser, LED Headlights + Cyan DRLs, Full-Width LED Taillight, Side Mirrors & Quad Exhausts
      const grille = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.56, 0.22, 0.12), glossyBlackMat);
      grille.position.set(0, 0.40, -2.31 * lenMul);
      const splitter = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.12, 0.06, 0.42), carbonMat);
      splitter.position.set(0, 0.22, -2.22 * lenMul);
      const diffuser = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.16, 0.22, 0.20), carbonMat);
      diffuser.position.set(0, 0.32, 2.28 * lenMul);

      // Sport Side Mirrors
      const mL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.16), bodyMat);
      mL.position.set(-bodyW / 2 - 0.08, hoodH + 0.12, -0.66 * lenMul);
      const mR = mL.clone(); mR.position.x = bodyW / 2 + 0.08;

      // Sculpted Shark-Fin Roof Antenna + Front Bumper Aero Canards + Crisp Door Handle Accents
      if (!isOpen) {
        const sharkFin = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 4), glossyBlackMat);
        sharkFin.position.set(0, roofH + 0.11, 0.56 * lenMul);
        sharkFin.rotation.x = -0.35;
        chassis.add(sharkFin);
      }
      const canardL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.26), carbonMat);
      canardL.position.set(-bodyW / 2 - 0.04, 0.34, -2.08 * lenMul); canardL.rotation.z = 0.22;
      const canardR = canardL.clone(); canardR.position.x = bodyW / 2 + 0.04; canardR.rotation.z = -0.22;
      const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.22), chromeMat);
      handleL.position.set(-bodyW / 2 - 0.02, 0.72, 0.28 * lenMul);
      const handleR = handleL.clone(); handleR.position.x = bodyW / 2 + 0.02;
      // F1 Central Rear Rain Light + Front Lower Intake Fog Blades
      const rainLight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.08), tailMat);
      rainLight.position.set(0, 0.34, 2.38 * lenMul);
      const fogL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.08), drlMat);
      fogL.position.set(-bodyW * 0.36, 0.33, -2.33 * lenMul);
      const fogR = fogL.clone(); fogR.position.x = bodyW * 0.36;
      // Sleek Ambient Underglow Shadow/Neon Pool under car
      const underGlow = new THREE.Mesh(
        new THREE.PlaneGeometry(bodyW + 0.55, 4.9 * lenMul),
        new THREE.MeshBasicMaterial({ color: vid === 0 ? 0x00f0ff : 0x000000, transparent: true, opacity: vid === 0 ? 0.22 : 0.35, depthWrite: false })
      );
      underGlow.rotation.x = -Math.PI / 2;
      underGlow.position.y = 0.06;
      chassis.add(canardL, canardR, handleL, handleR, rainLight, fogL, fogR, underGlow);

      // Sculpted Recessed Headlight Housings + Dual LED Projectors & Sharp Cyan DRLs
      [-bodyW * 0.32, bodyW * 0.32].forEach((hx) => {
        const housing = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 0.14), glossyBlackMat);
        housing.position.set(hx, 0.54, -2.27 * lenMul);
        housing.rotation.y = hx < 0 ? 0.22 : -0.22;
        const proj = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.15, 12), headMat);
        proj.rotation.x = Math.PI / 2;
        proj.position.set(hx + (hx < 0 ? 0.08 : -0.08), 0.54, -2.31 * lenMul);
        chassis.add(housing, proj);
      });
      // Rear License Plate Recess + Sport Badge
      const plateBay = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.16, 0.08), glossyBlackMat);
      plateBay.position.set(0, 0.52, 2.31 * lenMul);
      const plateWhite = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.11, 0.09), headMat);
      plateWhite.position.set(0, 0.52, 2.32 * lenMul);
      chassis.add(plateBay, plateWhite);

      // Headlights & Sharp Cyan DRLs
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.12), headMat);
      hl1.position.set(-bodyW * 0.32, 0.54, -2.30 * lenMul); hl1.rotation.y = 0.22;
      const hl2 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.12), headMat);
      hl2.position.set(bodyW * 0.32, 0.54, -2.30 * lenMul); hl2.rotation.y = -0.22;
      const drl1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.03, 0.13), drlMat);
      drl1.position.set(-bodyW * 0.32, 0.47, -2.31 * lenMul); drl1.rotation.y = 0.22;
      const drl2 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.03, 0.13), drlMat);
      drl2.position.set(bodyW * 0.32, 0.47, -2.31 * lenMul); drl2.rotation.y = -0.22;

      // Full-width LED Tail Light Bar
      const tlBar = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.24, 0.09, 0.10), tailMat);
      tlBar.position.set(0, deckH - 0.12, 2.31 * lenMul);

      // Quad Chrome Exhaust Tips
      [-0.56, -0.38, 0.38, 0.56].forEach((exX) => {
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.22, 10), chromeMat);
        tip.rotation.x = Math.PI / 2; tip.position.set(exX, 0.31, 2.36 * lenMul);
        chassis.add(tip);
      });
      // Sculpted Hood Power-Bulge & Twin Aero Vents
      const hoodVentL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.48), glossyBlackMat);
      hoodVentL.position.set(-0.42, hoodH + 0.03, -1.52 * lenMul); hoodVentL.rotation.x = 0.14;
      const hoodVentR = hoodVentL.clone(); hoodVentR.position.x = 0.42;

      // Side Door Aero Air-Scoops & Chrome Window Trim Accent
      const scoopL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.22, 0.72 * lenMul), carbonMat);
      scoopL.position.set(-bodyW / 2 - 0.02, 0.52, 0.35 * lenMul);
      const scoopR = scoopL.clone(); scoopR.position.x = bodyW / 2 + 0.02;

      // Lower Front Bumper Glowing Accent Strips & Multi-Fin Rear Diffuser Blades
      const intakeStrip = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.36, 0.04, 0.08), accentMat);
      intakeStrip.position.set(0, 0.28, -2.33 * lenMul);
      [-0.24, 0, 0.24].forEach((fx) => {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.24), glossyBlackMat);
        fin.position.set(fx, 0.30, 2.34 * lenMul);
        chassis.add(fin);
      });

      chassis.add(grille, splitter, diffuser, mL, mR, hl1, hl2, drl1, drl2, tlBar, hoodVentL, hoodVentR, scoopL, scoopR, intakeStrip);

      // Attractive Colorful Racing Stripes & Glowing Trim (Especially Eye-Catching on Pearl White Starter Car #0!)
      if (vid === 0) {
        const cyanStripeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const orangeStripeMat = new THREE.MeshBasicMaterial({ color: 0xff6a00 });
        // Hood twin colorful stripes
        const hS1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 1.25), cyanStripeMat);
        hS1.position.set(-0.11, hoodH + 0.045, -1.62 * lenMul); hS1.rotation.x = 0.14;
        const hS2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 1.25), orangeStripeMat);
        hS2.position.set(0.11, hoodH + 0.045, -1.62 * lenMul); hS2.rotation.x = 0.14;
        // Roof twin colorful stripes
        const rS1 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 1.06), cyanStripeMat);
        rS1.position.set(-0.11, roofH + 0.052, 0.14 * lenMul);
        const rS2 = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.025, 1.06), orangeStripeMat);
        rS2.position.set(0.11, roofH + 0.052, 0.14 * lenMul);
        // Side colorful accent blades + glowing cyan underglow neon strip
        const sideNeonL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 2.2), cyanStripeMat);
        sideNeonL.position.set(-bodyW / 2 - 0.08, 0.24, 0);
        const sideNeonR = sideNeonL.clone(); sideNeonR.position.x = bodyW / 2 + 0.08;
        const sideOrangeL = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.06, 1.55), orangeStripeMat);
        sideOrangeL.position.set(-bodyW / 2 - 0.03, 0.62, 0.15);
        const sideOrangeR = sideOrangeL.clone(); sideOrangeR.position.x = bodyW / 2 + 0.03;
        // Sport GT Rear Wing for Starter Car #0
        const sWing = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.08, 0.05, 0.28), carbonMat);
        sWing.position.set(0, deckH + 0.24, 2.12 * lenMul);
        const sEndL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.32), cyanStripeMat);
        sEndL.position.set(-(bodyW + 0.08) / 2, deckH + 0.24, 2.12 * lenMul);
        const sEndR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.32), orangeStripeMat);
        sEndR.position.set((bodyW + 0.08) / 2, deckH + 0.24, 2.12 * lenMul);
        const sStL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.12), carbonMat);
        sStL.position.set(-0.52, deckH + 0.12, 2.12 * lenMul);
        const sStR = sStL.clone(); sStR.position.x = 0.52;
        chassis.add(hS1, hS2, rS1, rS2, sideNeonL, sideNeonR, sideOrangeL, sideOrangeR, sWing, sEndL, sEndR, sStL, sStR);
      } else {
        // Sleek chrome door-handle & racing side-accent trim on all other cars
        const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.045, 1.45 * lenMul), chromeMat);
        trimL.position.set(-bodyW / 2 - 0.025, 0.64, 0.1 * lenMul);
        const trimR = trimL.clone(); trimR.position.x = bodyW / 2 + 0.025;
        chassis.add(trimL, trimR);
      }

      if (isMuscle) {
        const blower = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.28, 0.76), chromeMat);
        blower.position.set(0, hoodH + 0.14, -1.35 * lenMul);
        chassis.add(blower);
      }
      if (isHyperFin) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.38, 1.35), accentMat);
        fin.position.set(0, roofH - 0.02, 1.05 * lenMul);
        chassis.add(fin);
      }
      if (hasBigWing) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.16, 0.055, 0.36), carbonMat);
        wing.position.set(0, deckH + 0.34, 2.04 * lenMul);
        const endL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.42), bodyMat);
        endL.position.set(-(bodyW + 0.16) / 2, deckH + 0.34, 2.04 * lenMul);
        const endR = endL.clone(); endR.position.x = (bodyW + 0.16) / 2;
        const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 0.16), carbonMat);
        strutL.position.set(-0.55, deckH + 0.16, 2.04 * lenMul);
        const strutR = strutL.clone(); strutR.position.x = 0.55;
        chassis.add(wing, endL, endR, strutL, strutR);
      }

      const wx = bodyW / 2 + 0.04;
      addWheel(-wx, 0.39, -1.36 * lenMul, 0.39, 0.34, true);
      addWheel(wx, 0.39, -1.36 * lenMul, 0.39, 0.34, true);
      addWheel(-wx, 0.39, 1.36 * lenMul, 0.39, 0.34, false);
      addWheel(wx, 0.39, 1.36 * lenMul, 0.39, 0.34, false);
      addFlame(-0.48, 0.31, 2.78 * lenMul); addFlame(0.48, 0.31, 2.78 * lenMul);
    }

    return { group, chassis, wheels, frontWheelPivots, flames };
  }


  // ANIMATED 3D WALKING HUMANS FOR CITY FOOTPATHS
  function createWalkingHuman(idx) {
    const shirtColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x06b6d4, 0xf8fafc];
    const pantColors = [0x1e293b, 0x334155, 0x1f2937, 0x3f3f46];
    const g = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? 0xe0ac69 : 0xc68642, roughness: 0.75 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColors[idx % shirtColors.length], roughness: 0.7 });
    const pantMat = new THREE.MeshStandardMaterial({ color: pantColors[idx % pantColors.length], roughness: 0.8 });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), skinMat);
    head.position.y = 1.66;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    hair.position.y = 1.69;
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.24), shirtMat);
    torso.position.y = 1.15;

    const legL = new THREE.Group(); legL.position.set(-0.12, 0.86, 0);
    const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.84, 0.18), pantMat);
    legLMesh.position.y = -0.42; legL.add(legLMesh);
    const legR = new THREE.Group(); legR.position.set(0.12, 0.86, 0);
    const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.84, 0.18), pantMat);
    legRMesh.position.y = -0.42; legR.add(legRMesh);

    const armL = new THREE.Group(); armL.position.set(-0.31, 1.38, 0);
    const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.62, 0.14), shirtMat);
    armLMesh.position.y = -0.28; armL.add(armLMesh);
    const armR = new THREE.Group(); armR.position.set(0.31, 1.38, 0);
    const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.62, 0.14), shirtMat);
    armRMesh.position.y = -0.28; armR.add(armRMesh);

    g.add(head, hair, torso, legL, legR, armL, armR);
    g.userData = { legL, legR, armL, armR };
    return g;
  }

  return {
    createSkyEnvMap,
    createRoadTexture,
    createFlowingWaterTexture,
    createBuildingTexture,
    createRealisticTree,
    createWalkingHuman,
    buildVehicleMesh
  };
})();
