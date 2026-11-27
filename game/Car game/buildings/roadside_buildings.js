// buildings/roadside_buildings.js
// Upgraded Stylized High-Detail Roadside City Buildings (512x512 Crisp Facades + GPU-Instanced 3D Awnings,
// Glowing Storefront Signs, Protruding Balconies, Stepped Tower Crowns, Neon Roof Trims, HVAC & Spire Antennas!)
window.ApexRoadsideBuildings = (function () {
  function createFacadeTexture(styleIdx) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');

    const themes = [
      // 0: Cyber Tech Glass Tower (Slate Navy + Cyan Neon Accent + Cool Blue Windows)
      { wallTop: '#1e293b', wallBot: '#0f172a', trim: '#0ea5e9', frame: '#020617', winA: '#38bdf8', winB: '#e0f2fe', winOff: '#1e3a5f', awning: '#0284c7', cols: 6, rows: 10, accent: '#00f0ff' },
      // 1: Sunset Boutique Apartments (Warm Coral-Terracotta + Cream Ledges + Golden Lit Windows)
      { wallTop: '#c2410c', wallBot: '#9a3412', trim: '#fed7aa', frame: '#431407', winA: '#fef08a', winB: '#fdba74', winOff: '#3b1d14', awning: '#dc2626', cols: 5, rows: 5, accent: '#facc15' },
      // 2: Royal Corporate Plaza (Deep Royal Blue + Silver Mullions + Reflective Sky Glass)
      { wallTop: '#1d4ed8', wallBot: '#1e3a8a', trim: '#cbd5e1', frame: '#0f172a', winA: '#93c5fd', winB: '#f8fafc', winOff: '#172554', awning: '#2563eb', cols: 6, rows: 11, accent: '#38bdf8' },
      // 3: Emerald Eco-Residency (Rich Teal + Crisp White Slabs + Mint/Warm Interior Rooms)
      { wallTop: '#0f766e', wallBot: '#115e59', trim: '#f1f5f9', frame: '#042f2e', winA: '#5eead4', winB: '#fef9c3', winOff: '#134e4a', awning: '#16a34a', cols: 5, rows: 6, accent: '#34d399' },
      // 4: Golden Urban Arcade (Warm Sandstone Gold + Espresso Trim + Cozy Shopfront)
      { wallTop: '#d97706', wallBot: '#b45309', trim: '#fef3c7', frame: '#451a03', winA: '#fef08a', winB: '#ffffff', winOff: '#422006', awning: '#ea580c', cols: 4, rows: 4, accent: '#fde047' },
      // 5: Neon Violet Nightlife Lofts (Deep Purple + Magenta Accent + Backlit Studios)
      { wallTop: '#581c87', wallBot: '#3b0764', trim: '#f472b6', frame: '#1e1b4b', winA: '#f472b6', winB: '#38bdf8', winOff: '#2e1065', awning: '#db2777', cols: 5, rows: 8, accent: '#ec4899' },
      // 6: Crimson Urban Townhouse (Modern Brick Crimson + Clean Concrete Slabs)
      { wallTop: '#be123c', wallBot: '#881337', trim: '#f8fafc', frame: '#4c0519', winA: '#fde68a', winB: '#bae6fd', winOff: '#3b0714', awning: '#f59e0b', cols: 5, rows: 5, accent: '#fb7185' },
      // 7: Arctic Skyscraper (Pearl White & Sky-Azure Glass Curtain Wall)
      { wallTop: '#e2e8f0', wallBot: '#cbd5e1', trim: '#0284c7', frame: '#334155', winA: '#38bdf8', winB: '#fef08a', winOff: '#1e3a5f', awning: '#0ea5e9', cols: 6, rows: 12, accent: '#38bdf8' }
    ];
    const t = themes[styleIdx % themes.length];

    // Base architectural wall gradient
    const wg = ctx.createLinearGradient(0, 0, 0, 512);
    wg.addColorStop(0, t.wallTop);
    wg.addColorStop(1, t.wallBot);
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle vertical architectural concrete ribs / mullions
    ctx.fillStyle = 'rgba(15,23,42,0.16)';
    for (let x = 0; x < 512; x += Math.round(512 / t.cols)) {
      ctx.fillRect(x, 0, 6, 430);
    }

    // Crisp roof cornice band + glowing accent strip near top
    ctx.fillStyle = t.frame;
    ctx.fillRect(0, 0, 512, 18);
    ctx.fillStyle = t.accent;
    ctx.fillRect(0, 18, 512, 6);

    // Ground-floor modern storefront arcade (y = 428..512)
    ctx.fillStyle = t.frame;
    ctx.fillRect(0, 424, 512, 88);
    // Illuminated shop fascia header
    ctx.fillStyle = t.awning;
    ctx.fillRect(10, 428, 492, 16);
    // Large bright ground-floor display windows showing lit shop interiors
    const bayW = 476 / 4;
    for (let b = 0; b < 4; b++) {
      const bx = 18 + b * bayW;
      const gShop = ctx.createLinearGradient(bx, 448, bx, 504);
      gShop.addColorStop(0, b % 2 === 0 ? '#bae6fd' : '#fef08a');
      gShop.addColorStop(1, b % 2 === 0 ? '#0284c7' : '#f59e0b');
      ctx.fillStyle = gShop;
      ctx.fillRect(bx + 4, 448, bayW - 10, 54);
      // Interior shop shelves silhouette + diagonal glass reflection
      ctx.fillStyle = 'rgba(15,23,42,0.22)';
      ctx.fillRect(bx + 12, 476, bayW - 26, 22);
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      ctx.fillRect(bx + 8, 450, 14, 50);
    }

    // Multi-floor concrete ledges & detailed glass windows with interior room glow
    const padX = 16, topY = 30, areaH = 388;
    const cellW = (512 - padX * 2) / t.cols;
    const cellH = areaH / t.rows;

    for (let r = 0; r < t.rows; r++) {
      const fy = topY + r * cellH;
      // Floor slab concrete ledge
      ctx.fillStyle = t.trim;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(0, fy - 3, 512, 4);
      ctx.globalAlpha = 1.0;

      for (let col = 0; col < t.cols; col++) {
        const wx = padX + col * cellW + 5;
        const wy = fy + 5;
        const ww = cellW - 10;
        const wh = cellH - 10;

        // Window outer frame
        ctx.fillStyle = t.frame;
        ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);

        // Varied interior lighting (lit warm, lit cool, or deep reflective glass)
        const hVal = (r * 13 + col * 7 + styleIdx * 5) % 10;
        const wGrad = ctx.createLinearGradient(wx, wy, wx, wy + wh);
        if (hVal < 4) {
          wGrad.addColorStop(0, t.winA); wGrad.addColorStop(1, t.winOff);
        } else if (hVal < 7) {
          wGrad.addColorStop(0, t.winB); wGrad.addColorStop(1, t.winA);
        } else {
          wGrad.addColorStop(0, '#0f172a'); wGrad.addColorStop(1, t.winOff);
        }
        ctx.fillStyle = wGrad;
        ctx.fillRect(wx, wy, ww, wh);

        // Glossy top-edge window reflection + subtle room divider mullion
        ctx.fillStyle = 'rgba(255,255,255,0.32)';
        ctx.fillRect(wx + 2, wy + 2, ww - 4, Math.max(3, wh * 0.18));
        if (ww > 28) {
          ctx.fillStyle = 'rgba(15,23,42,0.38)';
          ctx.fillRect(wx + ww * 0.5 - 1, wy, 2, wh);
        }
      }
    }

    const tex = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  // Builds GPU-instanced 3D architectural upgrades on ALL roadside city buildings (Awnings, Balconies,
  // Stepped Skyscraper Setbacks, Glowing Neon Roof Trims, Rooftop HVAC Units & Spire Antennas)!
  function buildInstancedDetails(scene, items) {
    if (!items || !items.length) return;
    const dummy = new THREE.Object3D();

    const awningColors = [0xdc2626, 0x0284c7, 0xea580c, 0x16a34a, 0x9333ea];
    const awningLists = awningColors.map(() => []);
    const neonColors = [0x00f0ff, 0xec4899, 0xfacc15, 0x22c55e];
    const neonLists = neonColors.map(() => []);

    const balconySlabMats = [];
    const balconyRailMats = [];
    const setbackTowerMats = [];
    const hvacMats = [];
    const spireMats = [];
    const parapetMats = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const { bx, bz, bw, bd, bh, styleIdx, seed } = it;

      // 1. 3D Ground-Floor Street-Facing Storefront Awnings on low & mid-rise roadside buildings
      if (bh >= 4.5 && bh < 24) {
        const awIdx = (seed + styleIdx) % awningColors.length;
        const frontSide = (seed % 2 === 0) ? 1 : -1;
        dummy.position.set(bx, 3.65, bz + frontSide * (bd / 2 + 0.65));
        dummy.scale.set(bw * 0.84, 0.28, 1.45);
        dummy.rotation.set(frontSide * 0.26, 0, 0);
        dummy.updateMatrix();
        awningLists[awIdx].push(dummy.matrix.clone());
        dummy.rotation.set(0, 0, 0);
      }

      // 2. 3D Protruding Apartment Balconies on mid-rise roadside buildings (7m..22m)
      if (bh >= 7.2 && bh <= 22 && (seed % 2 === 0)) {
        const floors = Math.min(3, Math.floor((bh - 3.5) / 3.4));
        const faceZ = (seed % 4 < 2) ? (bd / 2 + 0.45) : -(bd / 2 + 0.45);
        for (let fl = 0; fl < floors; fl++) {
          const by = 4.6 + fl * 3.3;
          dummy.position.set(bx, by, bz + faceZ);
          dummy.scale.set(bw * 0.62, 0.20, 0.95);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          balconySlabMats.push(dummy.matrix.clone());

          dummy.position.set(bx, by + 0.46, bz + faceZ + (faceZ > 0 ? 0.42 : -0.42));
          dummy.scale.set(bw * 0.60, 0.72, 0.08);
          dummy.updateMatrix();
          balconyRailMats.push(dummy.matrix.clone());
        }
      }

      // 3. 3D Roof Parapet Rim + HVAC Unit on flat-roof buildings (bh >= 10.5)
      if (bh >= 10.5) {
        dummy.position.set(bx, bh + 0.45, bz);
        dummy.scale.set(bw + 0.35, 0.48, bd + 0.35);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        parapetMats.push(dummy.matrix.clone());

        // Rooftop HVAC chiller box
        dummy.position.set(bx + bw * 0.18, bh + 1.05, bz - bd * 0.14);
        dummy.scale.set(Math.min(2.6, bw * 0.28), 0.95, Math.min(2.0, bd * 0.24));
        dummy.updateMatrix();
        hvacMats.push(dummy.matrix.clone());
      }

      // 4. Stepped Skyscraper Setback Penthouse + Glowing Neon Crown Strip + Spire Antenna (bh >= 17)
      if (bh >= 17) {
        const topH = 3.2 + (seed % 4) * 1.1;
        dummy.position.set(bx, bh + 0.22 + topH / 2, bz);
        dummy.scale.set(bw * 0.66, topH, bd * 0.66);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        setbackTowerMats.push(dummy.matrix.clone());

        // Glowing Neon Trim Band wrapping around the skyscraper crown!
        const nIdx = (styleIdx + seed) % neonColors.length;
        dummy.position.set(bx, bh + 0.52, bz);
        dummy.scale.set(bw + 0.52, 0.32, bd + 0.52);
        dummy.updateMatrix();
        neonLists[nIdx].push(dummy.matrix.clone());

        // Tall Communications Spire Antenna on top of downtown towers
        if (bh >= 23) {
          const spH = 4.5 + (seed % 5) * 1.2;
          dummy.position.set(bx, bh + 0.22 + topH + spH / 2, bz);
          dummy.scale.set(0.24, spH, 0.24);
          dummy.updateMatrix();
          spireMats.push(dummy.matrix.clone());
        }
      }
    }

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const addIM = (geo, mat, mats) => {
      if (!mats.length) return;
      const im = new THREE.InstancedMesh(geo, mat, mats.length);
      for (let i = 0; i < mats.length; i++) im.setMatrixAt(i, mats[i]);
      im.matrixAutoUpdate = false;
      im.updateMatrix();
      scene.add(im);
    };

    awningLists.forEach((list, idx) => {
      addIM(boxGeo, new THREE.MeshStandardMaterial({ color: awningColors[idx], roughness: 0.45, metalness: 0.12 }), list);
    });
    neonLists.forEach((list, idx) => {
      addIM(boxGeo, new THREE.MeshBasicMaterial({ color: neonColors[idx] }), list);
    });
    addIM(boxGeo, new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.42 }), balconySlabMats);
    addIM(boxGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.58, metalness: 0.65, roughness: 0.12 }), balconyRailMats);
    addIM(boxGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.35 }), parapetMats);
    addIM(boxGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.55, metalness: 0.4 }), hvacMats);
    addIM(boxGeo, new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.32, metalness: 0.55 }), setbackTowerMats);
    addIM(new THREE.CylinderGeometry(0.18, 0.75, 1, 6), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 }), spireMats);
  }

  return { createFacadeTexture, buildInstancedDetails };
})();
