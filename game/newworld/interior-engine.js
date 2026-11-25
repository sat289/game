import * as THREE from "three";
import { GameAudioFX } from "./audio-fx.js?v=33";

/**
 * 🚪 REAL 3D WALKABLE BUILDING INTERIOR ENGINE (v32)
 * Ultra-smooth, low-RAM Three.js interior explorer with animated opening entrance doors,
 * walkable Sheru Bhai / Citizen avatar, touch & keyboard controls, drag-to-look,
 * and rich custom 3D interiors for Malls, Mansion, Schools, Stadium, Beauty Parlour & Buildings!
 */

function makeInteriorSign(title, sub = "", bg = "#0f172a", fg = "#facc15", w = 5.0, h = 1.1) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 120);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 40px sans-serif";
  ctx.fillText(title, 256, sub ? 46 : 64, 470);
  if (sub) {
    ctx.fillStyle = fg;
    ctx.font = "800 24px sans-serif";
    ctx.fillText(sub, 256, 94, 470);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}

function createWalkableAvatar(isLion = false) {
  const g = new THREE.Group();
  const suitMat = new THREE.MeshLambertMaterial({ color: isLion ? 0xf8fafc : 0x2563eb });
  const pantsMat = new THREE.MeshLambertMaterial({ color: isLion ? 0xf1f5f9 : 0x1e293b });
  const goldMat = new THREE.MeshPhongMaterial({ color: 0xf59e0b, specular: 0xfef08a, shininess: 140 });
  const skinMat = new THREE.MeshLambertMaterial({ color: isLion ? 0xfef3c7 : 0xfdba74 });

  const legGeo = new THREE.BoxGeometry(0.26, 0.82, 0.26);
  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(-0.17, 0.42, 0);
  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(0.17, 0.42, 0);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.88, 0.36), suitMat);
  torso.position.y = 1.24;

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.56, 0.06), goldMat);
  tie.position.set(0, 1.28, 0.19);

  const armGeo = new THREE.BoxGeometry(0.2, 0.76, 0.22);
  const armL = new THREE.Mesh(armGeo, suitMat);
  armL.position.set(-0.46, 1.24, 0);
  const armR = new THREE.Mesh(armGeo, suitMat);
  armR.position.set(0.46, 1.24, 0);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), skinMat);
  head.position.y = 1.98;
  const shades = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.12), new THREE.MeshLambertMaterial({ color: 0x09090b }));
  shades.position.set(0, 2.02, 0.28);

  if (isLion) {
    const maneMat = new THREE.MeshLambertMaterial({ color: 0xfde68a });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tuft = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), maneMat);
      tuft.position.set(Math.cos(a) * 0.34, 1.98 + Math.sin(a) * 0.34, -0.06);
      g.add(tuft);
    }
  }

  g.add(legL, legR, torso, tie, armL, armR, head, shades);
  g.userData = { legL, legR, armL, armR };
  return g;
}

export function bootInteriorScene(sceneType) {
  const params = new URLSearchParams(window.location.search);
  const owner = params.get("owner") || "SHERU BHAI";
  const bType = params.get("type") || sceneType;
  const returnUrl = params.get("return") || "./index.html";

  const titleEl = document.getElementById("int-title");
  const subEl = document.getElementById("int-sub");
  const exitBtn = document.getElementById("btn-exit-city");
  if (exitBtn) {
    exitBtn.addEventListener("click", () => {
      window.location.href = returnUrl;
    });
  }

  const audio = new GameAudioFX();
  const container = document.getElementById("int-canvas");
  const w = window.innerWidth || 360;
  const h = window.innerHeight || 640;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(sceneType === "stadium" ? 0x0b1120 : 0x111827);

  const camera = new THREE.PerspectiveCamera(58, w / h, 0.2, 260);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", stencil: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1.5, 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xfffbeb, 0x334155, 1.15);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xfff7ed, 1.15);
  dir.position.set(16, 28, 18);
  scene.add(dir);

  const animatedMeshes = [];
  let roomBounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 };
  let doorL = null;
  let doorR = null;

  // Shared materials
  const matMarble = new THREE.MeshPhongMaterial({ color: 0xf8fafc, specular: 0xffffff, shininess: 90 });
  const matCream = new THREE.MeshLambertMaterial({ color: 0xfef3c7 });
  const matDark = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const matBlackMarble = new THREE.MeshPhongMaterial({ color: 0x0f172a, specular: 0xfacc15, shininess: 120 });
  const matGold = new THREE.MeshPhongMaterial({ color: 0xf59e0b, specular: 0xfef08a, shininess: 150 });
  const matGlass = new THREE.MeshPhongMaterial({ color: 0x7dd3fc, specular: 0xffffff, shininess: 140, transparent: true, opacity: 0.45 });
  const matPink = new THREE.MeshLambertMaterial({ color: 0xf472b6 });
  const matRoseGold = new THREE.MeshPhongMaterial({ color: 0xfda4af, specular: 0xffffff, shininess: 130 });
  const matCrimson = new THREE.MeshLambertMaterial({ color: 0xb91c1c });
  const matGreen = new THREE.MeshLambertMaterial({ color: 0x15803d });
  const matWood = new THREE.MeshLambertMaterial({ color: 0x78350f });
  const matGlowGold = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const matGlowCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
  const matGlowPink = new THREE.MeshBasicMaterial({ color: 0xec4899 });

  const buildShell = (rw, rh, rd, floorMat, wallMat, ceilingMat, openSky = false) => {
    roomBounds = { minX: -rw / 2 + 1.4, maxX: rw / 2 - 1.4, minZ: -rd / 2 + 1.4, maxZ: rd / 2 - 1.4 };
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), floorMat);
    fl.rotation.x = -Math.PI / 2;
    scene.add(fl);
    if (!openSky) {
      const ceil = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), ceilingMat);
      ceil.rotation.x = Math.PI / 2;
      ceil.position.y = rh;
      scene.add(ceil);
    }
    const wallB = new THREE.Mesh(new THREE.BoxGeometry(rw, rh, 0.5), wallMat);
    wallB.position.set(0, rh / 2, -rd / 2);
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, rh, rd), wallMat);
    wallL.position.set(-rw / 2, rh / 2, 0);
    const wallR = wallL.clone();
    wallR.position.x = rw / 2;
    scene.add(wallB, wallL, wallR);

    // Front wall with ANIMATED SLIDING/OPENING ENTRANCE DOORS!
    const sideW = (rw - 5.6) / 2;
    const wfL = new THREE.Mesh(new THREE.BoxGeometry(sideW, rh, 0.5), wallMat);
    wfL.position.set(-(rw / 2 - sideW / 2), rh / 2, rd / 2);
    const wfR = wfL.clone();
    wfR.position.x = rw / 2 - sideW / 2;
    const wfTop = new THREE.Mesh(new THREE.BoxGeometry(5.6, Math.max(1, rh - 4.2), 0.5), wallMat);
    wfTop.position.set(0, 4.2 + Math.max(1, rh - 4.2) / 2, rd / 2);
    doorL = new THREE.Mesh(new THREE.BoxGeometry(2.75, 4.1, 0.18), matGlass);
    doorL.position.set(-1.38, 2.05, rd / 2);
    doorR = new THREE.Mesh(new THREE.BoxGeometry(2.75, 4.1, 0.18), matGlass);
    doorR.position.set(1.38, 2.05, rd / 2);
    const exitBoard = makeInteriorSign("EXIT TO CITY ➔", "WALK NEAR DOOR OR TAP EXIT", "#0f172a", "#38bdf8", 4.6, 0.85);
    exitBoard.rotation.y = Math.PI;
    exitBoard.position.set(0, 4.85, rd / 2 - 0.35);
    scene.add(wfL, wfR, wfTop, doorL, doorR, exitBoard);
  };

  // =========================================================
  // BUILD EACH DEDICATED REAL 3D BUILDING INTERIOR!
  // =========================================================
  if (sceneType === "mansion") {
    if (titleEl) titleEl.textContent = "👑 SHERU BHAI ROYAL MANSION";
    if (subEl) subEl.textContent = `Owner: ${owner} • Grand Marble Palace Interior`;
    buildShell(34, 13, 34, matMarble, matCream, matBlackMarble, false);

    // Grand Red & Gold Carpet leading to Sheru Bhai's Golden Lion Throne!
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 26), matCrimson);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.03, 2);
    scene.add(carpet);

    // 8 Classical Marble & Gold Columns lining the Grand Foyer
    [-11, -5.5, 5.5, 11].forEach((cx) => {
      [-9, 3].forEach((cz) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.72, 12.6, 12), matMarble);
        col.position.set(cx, 6.3, cz);
        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 1.7), matGold);
        cap.position.set(cx, 12.4, cz);
        scene.add(col, cap);
      });
    });

    // Giant Sparkling Crystal & Gold Chandelier Hanging Center!
    const chand = new THREE.Group();
    chand.position.set(0, 9.6, 0);
    const cRing1 = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.16, 8, 24), matGold);
    cRing1.rotation.x = Math.PI / 2;
    const cRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.12, 8, 20), matGlowGold);
    cRing2.rotation.x = Math.PI / 2;
    cRing2.position.y = -0.8;
    const cCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), matGlowGold);
    cCore.position.y = -1.2;
    chand.add(cRing1, cRing2, cCore);
    const pLight = new THREE.PointLight(0xfef08a, 3.5, 36);
    pLight.position.set(0, 8.2, 0);
    scene.add(chand, pLight);
    animatedMeshes.push({ mesh: chand, rotY: 0.45 });

    // Raised Royal Marble Stage + SHERU BHAI GOLDEN THRONE!
    const stage = new THREE.Mesh(new THREE.BoxGeometry(11.5, 1.2, 7.2), matBlackMarble);
    stage.position.set(0, 0.6, -12.2);
    const throneBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 2.2), matGold);
    throneBase.position.set(0, 1.75, -13.0);
    const throneBack = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.8, 0.45), matGold);
    throneBack.position.set(0, 3.8, -13.9);
    const throneCush = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 1.8), matCrimson);
    throneCush.position.set(0, 2.4, -13.0);
    const plaque = makeInteriorSign("👑 SHERU BHAI", "ROYAL ISLAND PALACE • THRONE HALL", "#09090b", "#facc15", 10.2, 2.4);
    plaque.position.set(0, 8.6, -16.6);
    scene.add(stage, throneBase, throneBack, throneCush, plaque);

    // Twin Royal Golden Staircases curving along left & right walls!
    [-13.5, 13.5].forEach((sx) => {
      for (let s = 0; s < 10; s++) {
        const st = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 1.2), matMarble);
        st.position.set(sx, 0.3 + s * 0.52, -4 - s * 1.1);
        scene.add(st);
      }
    });
  } else if (sceneType === "malls") {
    const isDMart = bType === "dmart";
    if (titleEl) titleEl.textContent = isDMart ? "🛒 D-MART HYPERMARKET INSIDE" : `🏬 ${owner} SHOPPING MALL`;
    if (subEl) subEl.textContent = isDMart ? "Fresh Groceries, Offers & Billing Counters" : "Multi-Floor Atrium, Escalators & Branded Stores";
    buildShell(36, 12, 36, matMarble, matCream, matGlass, false);

    // Overhead Glowing Mall Skylight Strip
    const skyLight = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 28), matGlowCyan);
    skyLight.position.set(0, 11.7, 0);
    scene.add(skyLight);

    if (isDMart) {
      // Real D-Mart Interior Grocery Aisles + Billing Counters + Offer Banners!
      const shelfCols = [matGreen, matGold, matCrimson, matPink];
      [-11, -5.5, 5.5, 11].forEach((ax, i) => {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.4, 18), matMarble);
        rack.position.set(ax, 1.7, -3);
        const goods = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.8, 16.8), shelfCols[i % shelfCols.length]);
        goods.position.set(ax, 2.4, -3);
        scene.add(rack, goods);
      });
      // Billing Checkout Counters near front
      [-7, 0, 7].forEach((bx) => {
        const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 1.4), matGreen);
        desk.position.set(bx, 0.55, 10.5);
        scene.add(desk);
      });
      const dmBoard = makeInteriorSign("DMart • DAILY SAVINGS", "GROCERIES • HOMEWARE • MIN 7% OFF", "#15803d", "#facc15", 13.0, 2.4);
      dmBoard.position.set(0, 7.6, -17.6);
      scene.add(dmBoard);
    } else {
      // Multi-Floor Mall Atrium, Central Fountain, Escalator & Side Boutiques!
      const fPool = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 0.7, 16), matMarble);
      fPool.position.set(0, 0.35, -1);
      const fWat = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.76, 14), matGlowCyan);
      fWat.position.set(0, 0.38, -1);
      // Center Escalator rising to Upper Balcony Mezzanine!
      const esc = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 12.5), matDark);
      esc.position.set(0, 3.2, -10.5);
      esc.rotation.x = -0.45;
      const mezz = new THREE.Mesh(new THREE.BoxGeometry(34, 0.45, 7.5), matMarble);
      mezz.position.set(0, 6.0, -14.2);
      const mezzRail = new THREE.Mesh(new THREE.BoxGeometry(34, 1.1, 0.16), matGlass);
      mezzRail.position.set(0, 6.7, -10.5);
      scene.add(fPool, fWat, esc, mezz, mezzRail);

      // 4 Side Retail Storefronts (Apple, Fashion, Food Court, Gaming)
      const shops = [
        { x: -15.5, z: -7, title: "APPLE ZONE", bg: "#0f172a", fg: "#38bdf8" },
        { x: -15.5, z: 5,  title: "TRENDS FASHION", bg: "#7e22ce", fg: "#facc15" },
        { x: 15.5,  z: -7, title: "FOOD COURT", bg: "#b91c1c", fg: "#fde047" },
        { x: 15.5,  z: 5,  title: "ST GAMING ZONE", bg: "#0284c7", fg: "#ffffff" }
      ];
      shops.forEach((sh) => {
        const box = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.8, 9.2), matDark);
        box.position.set(sh.x, 2.4, sh.z);
        const brd = makeInteriorSign(sh.title, "OPEN NOW", sh.bg, sh.fg, 6.4, 1.3);
        brd.rotation.y = sh.x < 0 ? Math.PI / 2 : -Math.PI / 2;
        brd.position.set(sh.x + (sh.x < 0 ? 2.2 : -2.2), 4.2, sh.z);
        scene.add(box, brd);
      });
    }
  } else if (sceneType === "school") {
    if (titleEl) titleEl.textContent = `🏫 ${owner} — CAMPUS INSIDE`;
    if (subEl) subEl.textContent = "Smart Classroom, Chalkboard, Desks & Study Library";
    buildShell(30, 9.5, 30, matCream, matMarble, matMarble, false);

    // Classic Green Chalkboard + Teacher Podium at Front!
    const board = makeInteriorSign("WELCOME TO SHERU BHAI SCHOOL", "PYTHON • 3D GRAPHICS • DIPLOMA CSE", "#14532d", "#fef08a", 12.0, 3.6);
    board.position.set(0, 4.2, -14.6);
    const podium = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.1, 1.6), matWood);
    podium.position.set(0, 0.55, -10.5);
    scene.add(board, podium);

    // 4 Rows × 3 Columns of Wooden Student Desks & Benches!
    for (let r = 0; r < 4; r++) {
      for (let c = -1; c <= 1; c++) {
        const dx = c * 5.8;
        const dz = -6.0 + r * 4.2;
        const desk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.95, 1.2), matWood);
        desk.position.set(dx, 0.48, dz);
        const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.7), matDark);
        bench.position.set(dx, 0.28, dz + 1.15);
        scene.add(desk, bench);
      }
    }

    // Side Library Bookshelves!
    [-14.2, 14.2].forEach((bx) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.6, 16), matWood);
      shelf.position.set(bx, 2.3, -2);
      scene.add(shelf);
    });
  } else if (sceneType === "stadium") {
    if (titleEl) titleEl.textContent = `🏏 ${owner} — CRICKET ARENA`;
    if (subEl) subEl.textContent = "Walk on the Live 22-Yard Pitch & Floodlit Stands!";
    const turfMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });
    const pitchMat = new THREE.MeshLambertMaterial({ color: 0xd6b588 });
    buildShell(54, 10, 54, turfMat, matDark, matDark, true);

    // 22-Yard Cricket Pitch + White Crease Lines + Yellow Stumps!
    const pitch = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 22), pitchMat);
    pitch.position.set(0, 0.04, 0);
    scene.add(pitch);
    [-9.5, 9.5].forEach((sz) => {
      [-0.25, 0, 0.25].forEach((sx) => {
        const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), matGold);
        stump.position.set(sx, 0.65, sz);
        scene.add(stump);
      });
    });

    // Stepped Stadium Spectator Stands + Giant Glowing LED Scoreboard!
    [-22, 22].forEach((sx) => {
      for (let t = 0; t < 3; t++) {
        const tier = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6 + t * 1.4, 44), t % 2 === 0 ? matCrimson : matDark);
        tier.position.set(sx + (sx > 0 ? t * 2.2 : -t * 2.2), (1.6 + t * 1.4) / 2, 0);
        scene.add(tier);
      }
    });
    const score = makeInteriorSign("SHERU XI  218/2 (18.4)", "FOLLOWERS XI • LIVE STADIUM MATCH", "#020617", "#4ade80", 18.0, 4.2);
    score.position.set(0, 12.5, -26.4);
    scene.add(score);

    // 4 Towering Floodlight Towers!
    [[-24, -24], [24, -24], [-24, 24], [24, 24]].forEach(([fx, fz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 22, 8), matDark);
      pole.position.set(fx, 11, fz);
      const flood = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 0.8), matGlowGold);
      flood.position.set(fx * 0.92, 21.5, fz * 0.92);
      flood.lookAt(0, 0, 0);
      scene.add(pole, flood);
    });
  } else if (sceneType === "beauty") {
    if (titleEl) titleEl.textContent = `💄 ${owner} — BEAUTY PARLOUR & SPA`;
    if (subEl) subEl.textContent = "Hollywood Vanity Mirrors, Luxury Styling Chairs & Glow Spa";
    buildShell(30, 9.5, 28, matMarble, new THREE.MeshLambertMaterial({ color: 0xfce7f3 }), matMarble, false);

    // Pink & Rose-Gold Runway Carpet + Glowing Neon Arch!
    const carpet = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 22), matPink);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.03, 1);
    const salonSign = makeInteriorSign("✨ LUXURY BEAUTY PARLOUR ✨", "BRIDAL MAKEUP • HAIR SPA • GLOW STUDIO", "#831843", "#fbcfe8", 11.6, 2.2);
    salonSign.position.set(0, 6.2, -13.6);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.25, 1.8), matRoseGold);
    desk.position.set(0, 0.62, -9.8);
    scene.add(carpet, salonSign, desk);

    // 6 Illuminated Hollywood Vanity Mirrors & Plush Pink Styling Chairs along BOTH walls!
    [-13.8, 13.8].forEach((wx) => {
      [-6.5, 0, 6.5].forEach((wz) => {
        const mirFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.2, 2.4), matGold);
        mirFrame.position.set(wx, 3.2, wz);
        const mirGlass = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.8, 2.0), matGlowCyan);
        mirGlass.position.set(wx + (wx < 0 ? 0.05 : -0.05), 3.2, wz);
        const counter = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 2.6), matMarble);
        counter.position.set(wx + (wx < 0 ? 0.9 : -0.9), 0.48, wz);
        const chairSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.55, 0.85, 10), matPink);
        chairSeat.position.set(wx + (wx < 0 ? 2.5 : -2.5), 0.65, wz);
        const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.1, 1.1), matPink);
        chairBack.position.set(wx + (wx < 0 ? 3.05 : -3.05), 1.35, wz);
        scene.add(mirFrame, mirGlass, counter, chairSeat, chairBack);
      });
    });

    // Floating Rotating Pink & Gold Salon Sparkles!
    const sparkGroup = new THREE.Group();
    sparkGroup.position.set(0, 5.5, 0);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), i % 2 === 0 ? matGlowPink : matGlowGold);
      sp.position.set(Math.cos(a) * 6.5, Math.sin(i * 1.4) * 1.6, Math.sin(a) * 6.5);
      sparkGroup.add(sp);
    }
    scene.add(sparkGroup);
    animatedMeshes.push({ mesh: sparkGroup, rotY: 0.65 });
  } else {
    // `buildings.html` — Adaptive Luxury House / Tower / OYO / Showroom / Shop Interior!
    const isShowroom = bType.includes("showroom") || bType.includes("mobile");
    const isOYO = bType === "hotel_oyo" || bType === "hostel";
    if (titleEl) titleEl.textContent = isShowroom ? `🚘 ${owner} — SHOWROOM FLOOR` : isOYO ? `🏨 ${owner} — VIP SUITE` : `🏡 ${owner}'s HOUSE INSIDE`;
    if (subEl) subEl.textContent = isShowroom ? "Interactive Flagship Display Floor" : isOYO ? "20-Floor OYO Luxury Suite & Lounge" : "Living Room, 4K TV Lounge, Dining & Bedroom";
    buildShell(28, 9.5, 28, matMarble, matCream, matMarble, false);

    const bSign = makeInteriorSign(owner.toUpperCase(), isShowroom ? "VIP SHOWROOM INTERIOR" : isOYO ? "OYO LUXURY SUITE" : "WELCOME HOME • SHERU BHAI CITY", "#0f172a", "#38bdf8", 10.6, 2.0);
    bSign.position.set(0, 6.8, -13.6);
    scene.add(bSign);

    if (isShowroom) {
      // Glowing Rotating Center Pedestal Display!
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.45, 20), matBlackMarble);
      ped.position.set(0, 0.25, -2);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.14, 8, 24), matGlowCyan);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.5, -2);
      const showcase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.35, 5.2), matCrimson);
      showcase.position.set(0, 1.15, -2);
      scene.add(ped, ring, showcase);
      animatedMeshes.push({ mesh: showcase, rotY: 0.6 });
    } else {
      // Cozy Modern Luxury Living Room (L-Sofa, Coffee Table, Big 4K TV, Dining & King Bed!)
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(9.5, 7.2), matCrimson);
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(-4.5, 0.03, -2.5);
      const sofa = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.25, 2.1), matDark);
      sofa.position.set(-4.5, 0.65, 0.5);
      const table = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.65, 1.6), matGlass);
      table.position.set(-4.5, 0.35, -2.5);
      const tvUnit = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.0, 1.2), matWood);
      tvUnit.position.set(-4.5, 0.5, -6.4);
      const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.0, 0.16), matGlowCyan);
      tvScreen.position.set(-4.5, 3.0, -6.5);

      // Right Side: King Bed with Golden Headboard!
      const bed = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.95, 6.4), matMarble);
      bed.position.set(7.5, 0.48, -4.5);
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.35, 4.4), isOYO ? matCrimson : matPink);
      blanket.position.set(7.5, 1.0, -3.5);
      const headb = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.6, 0.4), matGold);
      headb.position.set(7.5, 1.3, -7.8);
      scene.add(rug, sofa, table, tvUnit, tvScreen, bed, blanket, headb);
    }
  }

  // Spawn Player Walkable Avatar right inside the Opening Doors!
  const avatar = createWalkableAvatar(sceneType === "mansion");
  const pos = new THREE.Vector3(0, 0, roomBounds.maxZ - 2.6);
  let yaw = Math.PI; // Facing into the room (-Z)
  avatar.position.copy(pos);
  avatar.rotation.y = yaw;
  scene.add(avatar);

  // Play welcome door chime on first tap
  const keys = { forward: false, backward: false, left: false, right: false };
  const bindHold = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    const dn = (e) => { e.preventDefault(); el.classList.add("pressed"); keys[key] = true; };
    const up = (e) => { e.preventDefault(); el.classList.remove("pressed"); keys[key] = false; };
    el.addEventListener("pointerdown", dn);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
    el.addEventListener("pointercancel", up);
  };
  bindHold("walk-up", "forward");
  bindHold("walk-down", "backward");
  bindHold("walk-left", "left");
  bindHold("walk-right", "right");

  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.forward = true;
    if (e.code === "ArrowDown" || e.code === "KeyS") keys.backward = true;
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.forward = false;
    if (e.code === "ArrowDown" || e.code === "KeyS") keys.backward = false;
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
  });

  // Drag canvas horizontally to smoothly steer camera look!
  let dragX = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { dragX = e.clientX; });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (dragX === null) return;
    const dx = e.clientX - dragX;
    dragX = e.clientX;
    yaw -= dx * 0.008;
  });
  renderer.domElement.addEventListener("pointerup", () => { dragX = null; });

  window.addEventListener("resize", () => {
    const nw = window.innerWidth;
    const nh = window.innerHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });

  const clock = new THREE.Clock();
  let walkPhase = 0;

  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);

    if (keys.left) yaw += 2.2 * dt;
    if (keys.right) yaw -= 2.2 * dt;
    const moveDir = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);

    if (moveDir !== 0) {
      const spd = 8.5 * moveDir;
      pos.x = THREE.MathUtils.clamp(pos.x + Math.sin(yaw) * spd * dt, roomBounds.minX, roomBounds.maxX);
      pos.z = THREE.MathUtils.clamp(pos.z + Math.cos(yaw) * spd * dt, roomBounds.minZ, roomBounds.maxZ);
      walkPhase += dt * 11;
      const swing = Math.sin(walkPhase) * 0.55;
      avatar.userData.legL.rotation.x = swing;
      avatar.userData.legR.rotation.x = -swing;
      avatar.userData.armL.rotation.x = -swing * 0.8;
      avatar.userData.armR.rotation.x = swing * 0.8;
      audio.playStep();
    } else {
      avatar.userData.legL.rotation.x *= 0.82;
      avatar.userData.legR.rotation.x *= 0.82;
      avatar.userData.armL.rotation.x *= 0.82;
      avatar.userData.armR.rotation.x *= 0.82;
    }

    avatar.position.copy(pos);
    avatar.rotation.y = yaw;

    // Animate Entrance Doors Sliding Open when Avatar approaches the Exit!
    const nearDoor = pos.z > roomBounds.maxZ - 4.8 && Math.abs(pos.x) < 4.5;
    if (doorL && doorR) {
      doorL.position.x = THREE.MathUtils.lerp(doorL.position.x, nearDoor ? -3.4 : -1.38, 0.14);
      doorR.position.x = THREE.MathUtils.lerp(doorR.position.x, nearDoor ? 3.4 : 1.38, 0.14);
    }

    for (const am of animatedMeshes) {
      am.mesh.rotation.y += dt * am.rotY;
    }

    // Smooth Third-Person Inside-Building Follow Camera!
    const camTarget = new THREE.Vector3(pos.x - Math.sin(yaw) * 6.2, 3.6, pos.z - Math.cos(yaw) * 6.2);
    camTarget.x = THREE.MathUtils.clamp(camTarget.x, roomBounds.minX - 0.5, roomBounds.maxX + 0.5);
    camTarget.z = THREE.MathUtils.clamp(camTarget.z, roomBounds.minZ - 0.5, roomBounds.maxZ + 0.5);
    camera.position.lerp(camTarget, 0.16);
    camera.lookAt(pos.x + Math.sin(yaw) * 3.5, 2.0, pos.z + Math.cos(yaw) * 3.5);

    renderer.render(scene, camera);
  }
  loop();
}
