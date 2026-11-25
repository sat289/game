import * as THREE from "three";

/**
 * 🧱 ULTRA-REALISTIC ZERO-MB PROCEDURAL PBR TEXTURE & BUMP SUITE (v35)
 * Generates 15 seamless high-res (256x256) architectural textures & matching bump maps
 * directly on an offscreen HTML5 Canvas (< 1.4 MB total VRAM, 0 KB external image downloads!).
 * Upgrades every building, house, tower, mall, temple, road, mountain & mansion across the city!
 */

function makeRng(seedStart) {
  let seed = seedStart;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function createProceduralTextureSuite(options = {}) {
  const isVeryLowRam = Boolean(options.isVeryLowRam);
  const maxAniso = isVeryLowRam ? 1 : Math.min(4, options.maxAnisotropy || 2);
  const sz = isVeryLowRam ? 128 : 256;

  const buildTex = (size, drawFn, rx = 1, ry = 1, repeat = true, isData = false) => {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    drawFn(ctx, size);
    const tex = new THREE.CanvasTexture(c);
    if (repeat) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(rx, ry);
    }
    tex.generateMipmaps = !isVeryLowRam;
    tex.minFilter = isVeryLowRam ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = maxAniso;
    if (!isData) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  // 1. Crisp Asphalt Road & Highway Aggregate Grain
  const drawAsphalt = (ctx, s, baseHex) => {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, s, s);
    const rnd = makeRng(1337);
    const dots = isVeryLowRam ? 700 : 1800;
    for (let i = 0; i < dots; i++) {
      const x = rnd() * s, y = rnd() * s, v = rnd();
      ctx.fillStyle = v > 0.68 ? "rgba(255,255,255,0.09)" : v > 0.34 ? "rgba(15,23,42,0.26)" : "rgba(148,163,184,0.1)";
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, s * 0.2, s, s * 0.14);
    ctx.fillRect(0, s * 0.66, s, s * 0.14);
  };
  const roadTex = buildTex(sz, (c, s) => drawAsphalt(c, s, "#334155"), 8, 8);
  const highwayTex = buildTex(sz, (c, s) => drawAsphalt(c, s, "#1e293b"), 14, 14);

  // 2. Lush Meadow Grass & Striped Stadium Turf
  const grassTex = buildTex(sz, (ctx, s) => {
    ctx.fillStyle = "#5c940d";
    ctx.fillRect(0, 0, s, s);
    const rnd = makeRng(4242);
    for (let i = 0; i < 36; i++) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(132,204,22,0.22)" : "rgba(21,128,61,0.2)";
      ctx.beginPath();
      ctx.arc(rnd() * s, rnd() * s, s * (0.07 + rnd() * 0.1), 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 950; i++) {
      ctx.fillStyle = rnd() > 0.5 ? "rgba(163,230,53,0.3)" : "rgba(20,83,45,0.28)";
      ctx.fillRect(rnd() * s, rnd() * s, 2, 5);
    }
  }, 38, 38);

  const turfTex = buildTex(sz, (ctx, s) => {
    ctx.fillStyle = "#15803d";
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "rgba(34,197,94,0.24)";
    const band = s / 8;
    for (let x = 0; x < s; x += band * 2) ctx.fillRect(x, 0, band, s);
    const rnd = makeRng(9911);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = "rgba(187,247,208,0.12)";
      ctx.fillRect(rnd() * s, rnd() * s, 2, 3);
    }
  }, 10, 10);

  // 3. Sky-Reflective Architectural Curtain-Wall Glass & Realistic Warm Night Windows
  const glassTex = buildTex(sz, (ctx, s) => {
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0.0, "#bae6fd");
    grad.addColorStop(0.32, "#38bdf8");
    grad.addColorStop(0.58, "#0284c7");
    grad.addColorStop(1.0, "#1e3a8a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "rgba(255,255,255,0.44)";
    ctx.beginPath();
    ctx.moveTo(s * 0.08, 0); ctx.lineTo(s * 0.28, 0); ctx.lineTo(0, s * 0.56); ctx.lineTo(0, s * 0.32);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.26)";
    ctx.beginPath();
    ctx.moveTo(s * 0.5, 0); ctx.lineTo(s * 0.64, 0); ctx.lineTo(s * 0.14, s); ctx.lineTo(0, s);
    ctx.closePath(); ctx.fill();
    // Crisp architectural mullion grid
    ctx.strokeStyle = "rgba(15,23,42,0.42)";
    ctx.lineWidth = Math.max(2, s / 48);
    ctx.strokeRect(2, 2, s - 4, s - 4);
    ctx.beginPath();
    ctx.moveTo(s * 0.5, 0); ctx.lineTo(s * 0.5, s);
    ctx.moveTo(0, s * 0.5); ctx.lineTo(s, s * 0.5);
    ctx.stroke();
  }, 1, 1, false);

  const nightWinTex = buildTex(sz, (ctx, s) => {
    const grad = ctx.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0.0, "#fef9c3");
    grad.addColorStop(0.55, "#fde047");
    grad.addColorStop(1.0, "#f59e0b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Subtle venetian blind slats + interior silhouette warmth
    ctx.fillStyle = "rgba(180,83,9,0.16)";
    for (let y = 0; y < s; y += s / 16) ctx.fillRect(0, y, s, s / 48);
    ctx.strokeStyle = "rgba(30,41,59,0.75)";
    ctx.lineWidth = Math.max(3, s / 36);
    ctx.strokeRect(2, 2, s - 4, s - 4);
    ctx.beginPath();
    ctx.moveTo(s * 0.5, 0); ctx.lineTo(s * 0.5, s);
    ctx.moveTo(0, s * 0.52); ctx.lineTo(s, s * 0.52);
    ctx.stroke();
  }, 1, 1, false);

  // 4. Realistic Staggered Red Masonry Brick + Matching Bump Map!
  const drawBrick = (ctx, s, bump) => {
    ctx.fillStyle = bump ? "#404040" : "#d6ccc2"; // Mortar joints
    ctx.fillRect(0, 0, s, s);
    const rows = 8, cols = 4;
    const rh = s / rows, cw = s / cols;
    const m = Math.max(2, s / 72);
    const rnd = makeRng(7171);
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (cw / 2);
      for (let c = -1; c <= cols; c++) {
        const bx = c * cw + off + m;
        const by = r * rh + m;
        const bw = cw - m * 2, bh = rh - m * 2;
        if (bump) {
          const v = 185 + Math.floor(rnd() * 55);
          ctx.fillStyle = `rgb(${v},${v},${v})`;
        } else {
          const shades = ["#b4533c", "#a34631", "#c25e45", "#9c3f2b", "#bc5940"];
          ctx.fillStyle = shades[Math.floor(rnd() * shades.length)];
        }
        ctx.fillRect(bx, by, bw, bh);
      }
    }
  };
  const brickTex = buildTex(sz, (c, s) => drawBrick(c, s, false), 2, 2);
  const brickBump = buildTex(sz, (c, s) => drawBrick(c, s, true), 2, 2, true, true);

  // 5. Realistic Architectural Stucco / Limestone Plaster + Subtle Ashlar Block Seams (Tintable via `color`!)
  const drawStucco = (ctx, s, bump) => {
    ctx.fillStyle = bump ? "#c8c8c8" : "#f7f7f5";
    ctx.fillRect(0, 0, s, s);
    const rnd = makeRng(5151);
    for (let i = 0; i < 1100; i++) {
      const v = rnd() > 0.5 ? (bump ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.22)") : (bump ? "rgba(60,60,60,0.14)" : "rgba(100,116,139,0.08)");
      ctx.fillStyle = v;
      ctx.fillRect(rnd() * s, rnd() * s, 2, 2);
    }
    // Crisp subtle horizontal stone/plaster architectural reveal lines
    ctx.strokeStyle = bump ? "rgba(70,70,70,0.4)" : "rgba(100,116,139,0.14)";
    ctx.lineWidth = Math.max(1, s / 128);
    for (let y = s / 4; y < s; y += s / 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke();
    }
    for (let r = 0; r < 4; r++) {
      const ox = (r % 2) * (s / 4);
      for (let x = ox; x < s; x += s / 2) {
        ctx.beginPath(); ctx.moveTo(x, r * s / 4); ctx.lineTo(x, (r + 1) * s / 4); ctx.stroke();
      }
    }
  };
  const stuccoTex = buildTex(sz, (c, s) => drawStucco(c, s, false), 2, 2);
  const stuccoBump = buildTex(sz, (c, s) => drawStucco(c, s, true), 2, 2, true, true);

  // 6. Luxury Veined White Carrara Marble & Black-Gold Royal Marble
  const marbleTex = buildTex(sz, (ctx, s) => {
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, s, s);
    const rnd = makeRng(8282);
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = i % 2 === 0 ? "rgba(148,163,184,0.22)" : "rgba(203,213,225,0.34)";
      ctx.lineWidth = 1.5 + rnd() * 2.5;
      ctx.beginPath();
      ctx.moveTo(rnd() * s, 0);
      ctx.bezierCurveTo(rnd() * s, s * 0.35, rnd() * s, s * 0.7, rnd() * s, s);
      ctx.stroke();
    }
    // Marble slab tile grid
    ctx.strokeStyle = "rgba(148,163,184,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, s - 2, s - 2);
    ctx.beginPath(); ctx.moveTo(s / 2, 0); ctx.lineTo(s / 2, s); ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2); ctx.stroke();
  }, 3, 3);

  const blackGoldMarbleTex = buildTex(sz, (ctx, s) => {
    ctx.fillStyle = "#0b0f19";
    ctx.fillRect(0, 0, s, s);
    const rnd = makeRng(9090);
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = i % 3 === 0 ? "rgba(250,204,21,0.36)" : "rgba(254,240,138,0.15)";
      ctx.lineWidth = 1.2 + rnd() * 2.2;
      ctx.beginPath();
      ctx.moveTo(rnd() * s, 0);
      ctx.bezierCurveTo(rnd() * s, s * 0.33, rnd() * s, s * 0.66, rnd() * s, s);
      ctx.stroke();
    }
  }, 2, 2);

  // 7. Natural Wood Plank Grain (Tintable for Teak, Cafe Brown & Dark Wood!)
  const drawWood = (ctx, s, bump) => {
    ctx.fillStyle = bump ? "#b0b0b0" : "#e5d5c3";
    ctx.fillRect(0, 0, s, s);
    const rnd = makeRng(3131);
    const planks = 6;
    const ph = s / planks;
    for (let p = 0; p < planks; p++) {
      const py = p * ph;
      ctx.fillStyle = bump
        ? `rgb(${170 + (p % 3) * 18},${170 + (p % 3) * 18},${170 + (p % 3) * 18})`
        : p % 2 === 0 ? "rgba(120,53,15,0.12)" : "rgba(255,255,255,0.08)";
      ctx.fillRect(0, py, s, ph);
      // Horizontal wood grain streaks
      for (let g = 0; g < 16; g++) {
        ctx.fillStyle = bump ? "rgba(60,60,60,0.18)" : "rgba(69,26,3,0.14)";
        ctx.fillRect(0, py + rnd() * ph, s, 1.5);
      }
      ctx.fillStyle = bump ? "#303030" : "rgba(41,20,8,0.38)";
      ctx.fillRect(0, py, s, Math.max(1.5, s / 100));
    }
  };
  const woodTex = buildTex(sz, (c, s) => drawWood(c, s, false), 2, 2);
  const woodBump = buildTex(sz, (c, s) => drawWood(c, s, true), 2, 2, true, true);

  // 8. Architectural Roof Shingles / Ribbed Clay & Slate Tiles
  const drawRoof = (ctx, s, bump) => {
    ctx.fillStyle = bump ? "#909090" : "#e5e5e5";
    ctx.fillRect(0, 0, s, s);
    const rows = 8, cols = 8;
    const rh = s / rows, cw = s / cols;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (cw / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * cw + off, y = r * rh;
        const grd = ctx.createLinearGradient(0, y, 0, y + rh);
        grd.addColorStop(0, bump ? "#dcdcdc" : "#ffffff");
        grd.addColorStop(1, bump ? "#606060" : "#b8b8b8");
        ctx.fillStyle = grd;
        ctx.fillRect(x + 1, y + 1, cw - 2, rh - 2);
      }
    }
  };
  const roofTex = buildTex(sz, (c, s) => drawRoof(c, s, false), 3, 3);
  const roofBump = buildTex(sz, (c, s) => drawRoof(c, s, true), 3, 3, true, true);

  // 9. Interlocking Concrete Paver Sidewalk & Plaza Slab Texture
  const paverTex = buildTex(sz, (ctx, s) => {
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(0, 0, s, s);
    const rnd = makeRng(6262);
    const tiles = 4, ts = s / tiles;
    for (let r = 0; r < tiles; r++) {
      for (let c = 0; c < tiles; c++) {
        const shade = 220 + Math.floor(rnd() * 24);
        ctx.fillStyle = `rgb(${shade},${shade + 2},${shade + 6})`;
        ctx.fillRect(c * ts + 2, r * ts + 2, ts - 4, ts - 4);
      }
    }
    for (let i = 0; i < 650; i++) {
      ctx.fillStyle = "rgba(51,65,85,0.1)";
      ctx.fillRect(rnd() * s, rnd() * s, 2, 2);
    }
  }, 4, 4);

  // 10. Wind-Rippled Golden Beach Sand Texture
  const sandTex = buildTex(sz, (ctx, s) => {
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += s / 10) {
      ctx.strokeStyle = "rgba(217,119,6,0.16)";
      ctx.lineWidth = s / 26;
      ctx.beginPath();
      for (let x = 0; x <= s; x += s / 8) {
        const wy = y + Math.sin((x / s) * Math.PI * 2) * (s * 0.03);
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
    const rnd = makeRng(2121);
    for (let i = 0; i < 750; i++) {
      ctx.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.28)" : "rgba(180,83,9,0.16)";
      ctx.fillRect(rnd() * s, rnd() * s, 2, 2);
    }
  }, 10, 18);

  // 11. Rugged Layered Mountain Granite Rock Texture
  const rockTex = buildTex(sz, (ctx, s) => {
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(0, 0, s, s);
    const rnd = makeRng(4545);
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(30,41,59,0.28)" : "rgba(226,232,240,0.22)";
      ctx.fillRect(0, rnd() * s, s, 4 + rnd() * 14);
    }
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rnd() > 0.5 ? "rgba(15,23,42,0.24)" : "rgba(248,250,252,0.16)";
      ctx.fillRect(rnd() * s, rnd() * s, 3, 2);
    }
  }, 3, 3);

  // 12. Brushed Architectural Aluminum / Metal Cladding Panels
  const metalPanelTex = buildTex(sz, (ctx, s) => {
    const grd = ctx.createLinearGradient(0, 0, s, s);
    grd.addColorStop(0, "#f8fafc");
    grd.addColorStop(0.5, "#e2e8f0");
    grd.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(71,85,105,0.26)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, s - 2, s - 2);
    ctx.beginPath();
    ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2);
    ctx.moveTo(s / 2, 0); ctx.lineTo(s / 2, s);
    ctx.stroke();
  }, 3, 3);

  // 13. Crushed Gravel Railway Track Ballast
  const ballastTex = buildTex(sz, (ctx, s) => {
    ctx.fillStyle = "#64748b";
    ctx.fillRect(0, 0, s, s);
    const rnd = makeRng(8888);
    for (let i = 0; i < 1400; i++) {
      const v = rnd();
      ctx.fillStyle = v > 0.66 ? "#cbd5e1" : v > 0.33 ? "#475569" : "#334155";
      ctx.fillRect(rnd() * s, rnd() * s, 3, 3);
    }
  }, 16, 4);

  return {
    roadTex,
    highwayTex,
    grassTex,
    turfTex,
    glassTex,
    nightWinTex,
    brickTex,
    brickBump,
    stuccoTex,
    stuccoBump,
    marbleTex,
    blackGoldMarbleTex,
    woodTex,
    woodBump,
    roofTex,
    roofBump,
    paverTex,
    sandTex,
    rockTex,
    metalPanelTex,
    ballastTex
  };
}
