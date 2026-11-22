// Upgraded Real 3D Vehicle Models (Metallic Paint, Racing Stripes, Calipers, Side Mirrors, Spoilers)
// + Huge Sunny Morning 12x12 City with Architectural Buildings, Collision/Damage, Lakes & Repair Garages
window.ApexCity3D = (function () {
  function createBuildingTexture(styleIdx) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 512;
    const ctx = c.getContext('2d');
    const palettes = [
      { wall: '#cbd5e1', frame: '#64748b', winOn: '#38bdf8', winWarm: '#bae6fd', winOff: '#1e293b', cols: 6, rows: 14 },
      { wall: '#d6b89c', frame: '#8c6d53', winOn: '#e0f2fe', winWarm: '#fef3c7', winOff: '#334155', cols: 5, rows: 12 },
      { wall: '#94a3b8', frame: '#475569', winOn: '#7dd3fc', winWarm: '#f1f5f9', winOff: '#1e293b', cols: 7, rows: 16 },
      { wall: '#e2e8f0', frame: '#94a3b8', winOn: '#0ea5e9', winWarm: '#e0f2fe', winOff: '#0f172a', cols: 4, rows: 10 }
    ];
    const p = palettes[styleIdx % palettes.length];
    ctx.fillStyle = p.wall;
    ctx.fillRect(0, 0, 256, 512);
    const padX = 14, padY = 18;
    const cellW = (256 - padX * 2) / p.cols, cellH = (440 - padY) / p.rows;
    for (let r = 0; r < p.rows; r++) {
      for (let col = 0; col < p.cols; col++) {
        const x = padX + col * cellW + 4, y = padY + r * cellH + 4, w = cellW - 8, h = cellH - 8;
        ctx.fillStyle = p.frame; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
        const rnd = Math.sin(r * 17.3 + col * 31.7 + styleIdx * 7) * 0.5 + 0.5;
        ctx.fillStyle = rnd > 0.55 ? p.winOn : rnd > 0.25 ? p.winWarm : p.winOff;
        ctx.fillRect(x, y, w, h);
      }
    }
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 445, 256, 67);
    ctx.fillStyle = styleIdx % 2 === 0 ? '#0284c7' : '#d97706'; ctx.fillRect(16, 456, 224, 42);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  function applyCustomColor(baseHex, customHex) {
    return customHex !== null && customHex !== undefined ? customHex : baseHex;
  }

  function buildVehicleMesh(vehicleObj, customColorHex) {
    const group = new THREE.Group();
    const wheels = [];
    const flames = [];

    const mainColor = applyCustomColor(vehicleObj.colorHex || 0x38bdf8, customColorHex);
    const accentColor = vehicleObj.accentHex || 0x0f172a;

    // Glossy Automotive Metallic Paint
    const bodyMat = new THREE.MeshStandardMaterial({ color: mainColor, metalness: 0.78, roughness: 0.16 });
    const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.55, roughness: 0.3 });
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.45, roughness: 0.5 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.1 });
    const caliperMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.92, roughness: 0.08, transparent: true, opacity: 0.8 });
    const headMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2418 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.88 });

    const addAlloyWheel = (wx, wy, wz, r, width) => {
      const wg = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, width, 22), carbonMat);
      tire.rotation.z = Math.PI / 2;
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.66, r * 0.66, width + 0.02, 14), chromeMat);
      rim.rotation.z = Math.PI / 2;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.24, r * 0.24, width + 0.04, 10), caliperMat);
      hub.rotation.z = Math.PI / 2;
      wg.add(tire, rim, hub);
      wg.position.set(wx, wy, wz);
      group.add(wg);
      wheels.push(wg);
    };

    const addFlame = (fx, fy, fz) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.05, 10), flameMat);
      cone.rotation.x = Math.PI / 2;
      cone.position.set(fx, fy, fz);
      cone.visible = false;
      group.add(cone);
      flames.push(cone);
    };

    if (vehicleObj.modelType === 'bike') {
      const tank = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), bodyMat);
      tank.scale.set(0.85, 0.72, 1.55); tank.position.set(0, 0.88, -0.2);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.85), accentMat);
      stripe.position.set(0, 1.0, -0.2);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.9), bodyMat);
      tail.position.set(0, 0.94, 0.7); tail.rotation.x = -0.26;
      const fairing = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.0, 10), bodyMat);
      fairing.rotation.x = -Math.PI / 2.4; fairing.position.set(0, 0.86, -0.8);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.06), glassMat);
      screen.position.set(0, 1.14, -0.74); screen.rotation.x = -0.6;
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.75, 10), chromeMat);
      exhaust.rotation.x = Math.PI / 2.2; exhaust.position.set(0.22, 0.56, 0.72);
      const rider = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.62, 0.5), carbonMat);
      rider.position.set(0, 1.24, 0.16); rider.rotation.x = 0.42;
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), chromeMat);
      helmet.position.set(0, 1.65, -0.04);
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.1), headMat);
      hl.position.set(0, 0.88, -1.24);
      group.add(tank, stripe, tail, fairing, screen, exhaust, rider, helmet, hl);
      addAlloyWheel(0, 0.42, -0.96, 0.42, 0.22);
      addAlloyWheel(0, 0.42, 0.96, 0.42, 0.28);
      addFlame(0.22, 0.56, 1.42);
    } else if (vehicleObj.modelType === 'truck' || vehicleObj.modelType === 'heavy_truck') {
      const shape = new THREE.Shape();
      shape.moveTo(-2.45, 0.48); shape.lineTo(2.45, 0.48); shape.lineTo(2.45, 1.28);
      shape.lineTo(0.45, 1.28); shape.lineTo(0.22, 2.08); shape.lineTo(-1.12, 2.08);
      shape.lineTo(-1.58, 1.48); shape.lineTo(-2.45, 1.38); shape.closePath();
      const extrude = new THREE.ExtrudeGeometry(shape, { depth: 2.1, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.08, bevelSegments: 3 });
      extrude.center(); extrude.rotateY(-Math.PI / 2);
      const bodyMesh = new THREE.Mesh(extrude, bodyMat);
      bodyMesh.position.set(0, 1.28, 0);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 4.7), accentMat);
      stripe.position.set(0, 1.44, 0);
      const wind = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.54, 0.12), glassMat);
      wind.position.set(0, 1.74, -1.28); wind.rotation.x = -0.38;
      const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.34, 0.28), carbonMat);
      bumper.position.set(0, 0.72, -2.52);
      const grille = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.44, 0.12), chromeMat);
      grille.position.set(0, 1.02, -2.5);
      const roofBar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.2), headMat);
      roofBar.position.set(0, 2.18, -0.82);
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.12), headMat);
      hl1.position.set(-0.8, 1.04, -2.5);
      const hl2 = hl1.clone(); hl2.position.x = 0.8;
      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.12), tailMat);
      tl1.position.set(-0.86, 1.05, 2.5);
      const tl2 = tl1.clone(); tl2.position.x = 0.86;
      group.add(bodyMesh, stripe, wind, bumper, grille, roofBar, hl1, hl2, tl1, tl2);

      addAlloyWheel(-1.12, 0.54, -1.5, 0.54, 0.42);
      addAlloyWheel(1.12, 0.54, -1.5, 0.54, 0.42);
      addAlloyWheel(-1.12, 0.54, 1.5, 0.54, 0.42);
      addAlloyWheel(1.12, 0.54, 1.5, 0.54, 0.42);
      addFlame(-0.62, 0.56, 2.88); addFlame(0.62, 0.56, 2.88);
    } else {
      const isSuper = vehicleObj.modelType === 'super';
      const shape = new THREE.Shape();
      shape.moveTo(-2.25, 0.32); shape.lineTo(2.25, 0.32);
      shape.lineTo(2.2, isSuper ? 0.78 : 0.94); shape.lineTo(1.18, isSuper ? 0.94 : 1.04);
      shape.lineTo(0.45, isSuper ? 1.2 : 1.4); shape.lineTo(-0.55, isSuper ? 1.2 : 1.4);
      shape.lineTo(-1.32, isSuper ? 0.78 : 0.96); shape.lineTo(-2.22, isSuper ? 0.56 : 0.76);
      shape.closePath();

      const extrude = new THREE.ExtrudeGeometry(shape, { depth: 1.9, bevelEnabled: true, bevelThickness: 0.11, bevelSize: 0.09, bevelSegments: 3 });
      extrude.center(); extrude.rotateY(-Math.PI / 2);
      const bodyMesh = new THREE.Mesh(extrude, bodyMat);
      bodyMesh.position.set(0, isSuper ? 0.76 : 0.86, 0);

      // Center Racing Hood/Roof Stripe
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 4.1), accentMat);
      stripe.position.set(0, isSuper ? 1.06 : 1.22, 0.02);

      // Tinted Panoramic Cabin Glass
      const wind = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.44, 1.7), glassMat);
      wind.position.set(0, isSuper ? 1.02 : 1.18, 0.05);

      // Front Splitter, Side Skirts, Mirrors & Diffuser
      const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.09, 0.42), carbonMat);
      splitter.position.set(0, 0.34, -2.18);
      const mL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.16), bodyMat);
      mL.position.set(-1.08, 0.92, -0.72);
      const mR = mL.clone(); mR.position.x = 1.08;

      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.12, 0.12), headMat);
      hl1.position.set(-0.68, 0.62, -2.3);
      const hl2 = hl1.clone(); hl2.position.x = 0.68;

      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.12), tailMat);
      tl1.position.set(-0.62, 0.72, 2.3);
      const tl2 = tl1.clone(); tl2.position.x = 0.62;

      const ex1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 10), chromeMat);
      ex1.rotation.x = Math.PI / 2; ex1.position.set(-0.48, 0.44, 2.34);
      const ex2 = ex1.clone(); ex2.position.x = 0.48;

      group.add(bodyMesh, stripe, wind, splitter, mL, mR, hl1, hl2, tl1, tl2, ex1, ex2);

      if (isSuper) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.07, 0.36), carbonMat);
        wing.position.set(0, 1.18, 2.04);
        const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.18), carbonMat);
        strutL.position.set(-0.58, 1.0, 2.04);
        const strutR = strutL.clone(); strutR.position.x = 0.58;
        group.add(wing, strutL, strutR);
      }

      addAlloyWheel(-1.0, 0.38, -1.36, 0.38, 0.32);
      addAlloyWheel(1.0, 0.38, -1.36, 0.38, 0.32);
      addAlloyWheel(-1.0, 0.38, 1.36, 0.38, 0.32);
      addAlloyWheel(1.0, 0.38, 1.36, 0.38, 0.32);
      addFlame(-0.48, 0.44, 2.75); addFlame(0.48, 0.44, 2.75);
    }

    return { group, wheels, flames };
  }

  return {
    createBuildingTexture,
    buildVehicleMesh
  };
})();
