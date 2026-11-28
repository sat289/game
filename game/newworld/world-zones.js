import * as THREE from "three";
import { createGLSLOceanMaterial } from "./shaders-glsl.js?v=49";
import { BUILDING_LABELS } from "./world-constants.js?v=49";

export const zoneMethods = {
  _buildSTJunctionStatue() {
    const g = new THREE.Group();

    const basePad = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.16, 15.2), this.mat.marble);
    basePad.position.y = 0.08;

    const gardenRing = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 7.0, 0.28, 24), this.mat.turf);
    gardenRing.position.y = 0.2;

    const poolRim = new THREE.Mesh(new THREE.CylinderGeometry(4.7, 4.9, 0.45, 22), this.mat.marble);
    poolRim.position.y = 0.45;
    const water = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.48, 22), this.mat.water);
    water.position.y = 0.46;

    // Monumental Stepped Granite & Gold Pedestal
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.9, 4.4), this.mat.marble);
    step1.position.y = 1.05;
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.5, 3.2), this.mat.charcoal);
    step2.position.y = 2.75;
    const goldCollar = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.32, 3.5), this.mat.gold);
    goldCollar.position.y = 4.12;

    // Engraved "SHERU BHAI" Gold Plaque on Pedestal Front & Back
    const pCanvas = document.createElement("canvas");
    pCanvas.width = 256;
    pCanvas.height = 96;
    const pCtx = pCanvas.getContext("2d");
    pCtx.fillStyle = "#1e293b";
    pCtx.fillRect(0, 0, 256, 96);
    pCtx.strokeStyle = "#fbbf24";
    pCtx.lineWidth = 6;
    pCtx.strokeRect(4, 4, 248, 88);
    pCtx.fillStyle = "#fbbf24";
    pCtx.font = "bold 34px sans-serif";
    pCtx.textAlign = "center";
    pCtx.fillText("SHERU BHAI", 128, 48);
    pCtx.fillStyle = "#f8fafc";
    pCtx.font = "bold 18px sans-serif";
    pCtx.fillText("ST JUNCTION", 128, 76);
    const pTex = new THREE.CanvasTexture(pCanvas);
    pTex.generateMipmaps = false;
    const pMat = new THREE.MeshBasicMaterial({ map: pTex });
    const plaqueF = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.95), pMat);
    plaqueF.position.set(0, 2.8, 1.62);
    const plaqueB = plaqueF.clone();
    plaqueB.rotation.y = Math.PI;
    plaqueB.position.z = -1.62;
    g.add(plaqueF, plaqueB);

    // WHITE MARBLE LION SHERU BHAI FIGURE
    const statueBase = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.38, 0.3, 16), this.mat.wallWhite);
    statueBase.position.y = 4.44;

    const marbleMat = this.mat.wallWhite;
    const suitShadowMat = this.mat.marble;
    const lionStatue = new THREE.Group();
    lionStatue.scale.setScalar(2.45);
    lionStatue.position.y = -3.0;

    // 1. White Dress Shoes & Confident Stance Trousers
    const shoeGeo = new THREE.BoxGeometry(0.38, 0.24, 0.72);
    const shoeL = new THREE.Mesh(shoeGeo, marbleMat);
    shoeL.position.set(-0.46, 4.71, 0.14);
    shoeL.rotation.y = 0.18;
    const shoeR = new THREE.Mesh(shoeGeo, marbleMat);
    shoeR.position.set(0.46, 4.71, 0.14);
    shoeR.rotation.y = -0.18;

    const legGeo = new THREE.CylinderGeometry(0.24, 0.2, 2.05, 8);
    const legL = new THREE.Mesh(legGeo, marbleMat);
    legL.position.set(-0.42, 5.82, 0);
    legL.rotation.z = -0.05;
    const legR = new THREE.Mesh(legGeo, marbleMat);
    legR.position.set(0.42, 5.82, 0);
    legR.rotation.z = 0.05;

    // 2. White 3-Piece Suit: Buttoned Waistcoat + Open Suit Jacket + Lapels
    const hips = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.45, 0.62), marbleMat);
    hips.position.set(0, 6.85, 0);

    const vest = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.48, 0.62), suitShadowMat);
    vest.position.set(0, 7.68, 0.04);

    const btnGeo = new THREE.SphereGeometry(0.055, 6, 6);
    [7.25, 7.55, 7.85].forEach((by) => {
      const btn = new THREE.Mesh(btnGeo, this.mat.plinthGrey);
      btn.position.set(0, by, 0.37);
      lionStatue.add(btn);
    });

    const jacketBack = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.72, 0.48), marbleMat);
    jacketBack.position.set(0, 7.62, -0.14);
    const jacketL = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.65, 0.56), marbleMat);
    jacketL.position.set(-0.52, 7.58, 0.14);
    const jacketR = jacketL.clone();
    jacketR.position.x = 0.52;

    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.15, 0.12), marbleMat);
    lapelL.position.set(-0.34, 7.85, 0.41);
    lapelL.rotation.z = -0.14;
    const lapelR = lapelL.clone();
    lapelR.position.x = 0.34;
    lapelR.rotation.z = 0.14;

    const shoulders = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.42, 0.68), marbleMat);
    shoulders.position.set(0, 8.32, 0);

    // 3. Bent Arms with Both Hands Gripping the Jacket Lapels!
    const upperArmGeo = new THREE.CylinderGeometry(0.2, 0.18, 0.92, 8);
    const uArmL = new THREE.Mesh(upperArmGeo, marbleMat);
    uArmL.position.set(-0.98, 7.9, 0.05);
    uArmL.rotation.z = -0.38;
    const uArmR = new THREE.Mesh(upperArmGeo, marbleMat);
    uArmR.position.set(0.98, 7.9, 0.05);
    uArmR.rotation.z = 0.38;

    const foreArmGeo = new THREE.CylinderGeometry(0.17, 0.15, 0.85, 8);
    const fArmL = new THREE.Mesh(foreArmGeo, marbleMat);
    fArmL.position.set(-0.82, 7.45, 0.36);
    fArmL.rotation.z = 1.15;
    fArmL.rotation.x = 0.35;
    const fArmR = new THREE.Mesh(foreArmGeo, marbleMat);
    fArmR.position.set(0.82, 7.45, 0.36);
    fArmR.rotation.z = -1.15;
    fArmR.rotation.x = 0.35;

    const handGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const handL = new THREE.Mesh(handGeo, marbleMat);
    handL.position.set(-0.42, 7.42, 0.48);
    const handR = handL.clone();
    handR.position.x = 0.42;

    // 4. Chunky Gold Chain Hanging Over the White Shirt/Vest
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.065, 8, 16, Math.PI), this.mat.gold);
    chain.rotation.z = Math.PI;
    chain.position.set(0, 8.36, 0.41);

    // 5. White Marble LION HEAD + Sculpted Mane + Black Nose + Black Sunglasses!
    const lionHead = new THREE.Mesh(new THREE.SphereGeometry(0.56, 12, 12), marbleMat);
    lionHead.position.set(0, 9.18, 0.08);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.38), marbleMat);
    snout.position.set(0, 9.04, 0.56);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.12), this.mat.sunglasses);
    nose.position.set(0, 9.16, 0.74);

    const maneGroup = new THREE.Group();
    maneGroup.position.set(0, 9.18, -0.02);
    const maneTuftGeo = new THREE.DodecahedronGeometry(0.38, 0);
    for (let m = 0; m < 10; m++) {
      const ang = (m / 10) * Math.PI * 2;
      const tuft = new THREE.Mesh(maneTuftGeo, marbleMat);
      tuft.position.set(Math.cos(ang) * 0.62, Math.sin(ang) * 0.65, -0.08);
      tuft.scale.set(1.05, 1.15, 0.9);
      maneGroup.add(tuft);
    }
    const maneBack = new THREE.Mesh(new THREE.SphereGeometry(0.76, 10, 10), marbleMat);
    maneBack.position.set(0, 0.02, -0.22);
    maneGroup.add(maneBack);

    const earGeo = new THREE.SphereGeometry(0.16, 6, 6);
    const earL = new THREE.Mesh(earGeo, marbleMat);
    earL.position.set(-0.46, 9.72, 0.04);
    const earR = earL.clone();
    earR.position.x = 0.46;

    const lensGeo = new THREE.BoxGeometry(0.36, 0.22, 0.12);
    const lensL = new THREE.Mesh(lensGeo, this.mat.sunglasses);
    lensL.position.set(-0.24, 9.3, 0.58);
    const lensR = lensL.clone();
    lensR.position.x = 0.24;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.12), this.mat.sunglasses);
    bridge.position.set(0, 9.34, 0.59);

    lionStatue.add(
      shoeL, shoeR, legL, legR, hips, vest, jacketBack, jacketL, jacketR,
      lapelL, lapelR, shoulders, uArmL, uArmR, fArmL, fArmR, handL, handR,
      chain, lionHead, snout, nose, maneGroup, earL, earR, lensL, lensR, bridge
    );
    g.add(lionStatue);

    // Glowing Spotlight Crown Aura + 🪩 NIGHT MODE DISCO LIGHTS FOR SHERU BHAI STATUE!
    const aura = new THREE.Mesh(new THREE.RingGeometry(1.38, 1.65, 18), this.mat.lampBulbNight);
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 4.32;
    this.lampBulbs.push(aura);

    const discoGroup = new THREE.Group();
    const discoPalette = [0xec4899, 0x22d3ee, 0x4ade80, 0xfacc15, 0xa855f7, 0xef4444];
    const coneGeo = new THREE.ConeGeometry(1.45, 7.6, 10, 1, true);
    const podGeo = new THREE.SphereGeometry(0.28, 8, 8);
    this.discoCones = [];
    for (let d = 0; d < 6; d++) {
      const ang = (d / 6) * Math.PI * 2;
      const beamMat = new THREE.MeshBasicMaterial({
        color: discoPalette[d],
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const cone = new THREE.Mesh(coneGeo, beamMat);
      cone.position.set(Math.cos(ang) * 3.1, 6.2, Math.sin(ang) * 3.1);
      cone.lookAt(0, 9.2, 0);
      cone.rotateX(Math.PI / 2);

      const podMat = new THREE.MeshBasicMaterial({ color: discoPalette[d] });
      const pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(Math.cos(ang) * 4.5, 0.72, Math.sin(ang) * 4.5);

      discoGroup.add(cone, pod);
      this.discoCones.push({ cone, pod, beamMat, podMat, baseAng: ang, colorIdx: d });
    }

    const discoRingMat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide
    });
    const discoRing = new THREE.Mesh(new THREE.RingGeometry(4.85, 5.55, 28), discoRingMat);
    discoRing.rotation.x = -Math.PI / 2;
    discoRing.position.y = 0.42;
    discoGroup.add(discoRing);
    this.discoRing = discoRing;

    // 1 Lightweight Color-Cycling PointLight illuminating the White Marble Lion Statue at night!
    const discoPt = new THREE.PointLight(0xec4899, 3.2, 24);
    discoPt.position.set(0, 9.8, 3.4);
    discoGroup.add(discoPt);
    this.discoPointLight = discoPt;

    discoGroup.visible = this.timeOfDay === "night";
    g.add(discoGroup);
    this.discoGroup = discoGroup;

    // Animated Water Fountain Jets arcing into the blue pool!
    this.fountainJets = [];
    const dropGeo = new THREE.SphereGeometry(0.14, 5, 5);
    for (let j = 0; j < 8; j++) {
      const ang = (j / 8) * Math.PI * 2;
      const drop = new THREE.Mesh(dropGeo, this.mat.wallWhite);
      g.add(drop);
      this.fountainJets.push({ mesh: drop, ang, phase: j * 0.45 });
    }

    // Colorful Flower Beds around the garden roundabout
    const flowerColors = [0xf43f5e, 0xfacc15, 0xa855f7, 0xf97316];
    for (let f = 0; f < 8; f++) {
      const ang = (f / 8) * Math.PI * 2 + 0.35;
      const flower = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.45, 0),
        this._getColorMat(flowerColors[f % flowerColors.length])
      );
      flower.position.set(Math.cos(ang) * 5.7, 0.45, Math.sin(ang) * 5.7);
      g.add(flower);
    }

    [[-6.4, -6.4], [6.4, -6.4], [-6.4, 6.4], [6.4, 6.4]].forEach(([lx, lz]) => {
      this._addStreetLamp(lx, lz);
    });

    const hitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(7.2, 7.2, 28.0, 12),
      this.mat.invisibleHitbox
    );
    hitbox.position.y = 14.0;
    hitbox.userData.plotId = "ST_JUNCTION";
    g.add(hitbox);
    this.plotHitboxes.push(hitbox);

    const sign = this._createNameSign("🦁 SHERU BHAI STATUE", "MONUMENTAL LANDMARK • HIGHER THAN METRO", true);
    sign.position.set(0, 29.2, 0);

    // Note: lionStatue has scale 2.45, so local targetMaxDim 9.2 * 2.45 = 22.54 units tall (+ pedestal = 27.5 units total!)
    this.heroStatueSlot = lionStatue;
    this._loadHeroGLB("statue", this.getSheruGlbUrl(), lionStatue, 9.2, 3.25, 0, "BossSalute", true);
    g.add(basePad, gardenRing, poolRim, water, step1, step2, goldCollar, statueBase, aura, sign);
    this.cityGroup.add(g);
  },

  _makeLiveSheruBhai(scale = 1.0, seated = false) {
    const sb = new THREE.Group();

    // Rich tailored trousers & polished gold-trimmed shoes (shortened if seated)
    if (!seated) {
      const legGeo = new THREE.BoxGeometry(0.24, 0.72, 0.24);
      const legL = new THREE.Mesh(legGeo, this.mat.charcoal);
      legL.position.set(-0.15, 0.38, 0);
      const legR = legL.clone();
      legR.position.x = 0.15;
      const shoeGeo = new THREE.BoxGeometry(0.26, 0.12, 0.38);
      const shoeL = new THREE.Mesh(shoeGeo, this.mat.richGoldTrim);
      shoeL.position.set(-0.15, 0.06, 0.06);
      const shoeR = shoeL.clone();
      shoeR.position.x = 0.15;
      sb.add(legL, legR, shoeL, shoeR);
    }

    const baseY = seated ? 0.15 : 0.74;

    // Rich Royal Crimson Velvet Suit Coat + White Silk Shirt + Gold Lapels & Buttons
    const coat = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.84, 0.42), this.mat.richVelvetRed);
    coat.position.set(0, baseY + 0.42, 0);
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.74, 0.44), this.mat.wallWhite);
    shirt.position.set(0, baseY + 0.44, 0.01);
    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.62, 0.06), this.mat.richGoldTrim);
    lapelL.position.set(-0.19, baseY + 0.5, 0.22);
    lapelL.rotation.z = -0.14;
    const lapelR = lapelL.clone();
    lapelR.position.x = 0.19;
    lapelR.rotation.z = 0.14;

    // Gold Belt Buckle
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.1, 0.45), this.mat.richGoldTrim);
    belt.position.set(0, baseY + 0.05, 0);

    // MULTIPLE CHUNKY GLITTERING GOLD CHAINS on his chest!
    const chain1 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.036, 6, 12, Math.PI), this.mat.richGoldTrim);
    chain1.rotation.z = Math.PI;
    chain1.position.set(0, baseY + 0.78, 0.24);
    const chain2 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.032, 6, 12, Math.PI), this.mat.richGoldTrim);
    chain2.rotation.z = Math.PI;
    chain2.position.set(0, baseY + 0.72, 0.25);
    const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), this.mat.diamondGlow);
    pendant.position.set(0, baseY + 0.48, 0.27);

    // Arms with gold cuffs
    const armGeo = new THREE.BoxGeometry(0.2, 0.68, 0.2);
    const armL = new THREE.Mesh(armGeo, this.mat.richVelvetRed);
    armL.position.set(-0.48, baseY + 0.44, seated ? 0.18 : 0);
    if (seated) armL.rotation.x = -0.9;
    const armR = armL.clone();
    armR.position.x = 0.48;
    const cuffGeo = new THREE.BoxGeometry(0.22, 0.09, 0.22);
    const cuffL = new THREE.Mesh(cuffGeo, this.mat.richGoldTrim);
    cuffL.position.set(-0.48, baseY + 0.14, seated ? 0.34 : 0);
    const cuffR = cuffL.clone();
    cuffR.position.x = 0.48;

    // Sculpted Royal Lion Head + Full Mane + Black Sunglasses + Mini Gold Crown Pin!
    const headY = baseY + 1.12;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), this.mat.lionFurGold);
    head.position.set(0, headY, 0.05);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.22), this.mat.lionFurGold);
    snout.position.set(0, headY - 0.08, 0.32);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.08), this.mat.sunglasses);
    nose.position.set(0, headY - 0.02, 0.42);

    // Rich Lion Mane Ring
    const maneGeo = new THREE.DodecahedronGeometry(0.21, 0);
    for (let m = 0; m < 8; m++) {
      const ang = (m / 8) * Math.PI * 2;
      const tuft = new THREE.Mesh(maneGeo, this.mat.lionManeRich);
      tuft.position.set(Math.cos(ang) * 0.34, headY + Math.sin(ang) * 0.34, -0.05);
      sb.add(tuft);
    }
    const maneBack = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), this.mat.lionManeRich);
    maneBack.position.set(0, headY, -0.14);

    // Cool Black Sunglasses
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.1), this.mat.sunglasses);
    shades.position.set(0, headY + 0.06, 0.34);

    sb.add(coat, shirt, lapelL, lapelR, belt, chain1, chain2, pendant, armL, armR, cuffL, cuffR, head, snout, nose, maneBack, shades);
    sb.scale.setScalar(scale);
    return sb;
  },

  _makeDiamondCarMesh() {
    const car = new THREE.Group();

    // 4 Luxury Wheels with Gold Alloy Rims
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10);
    const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.24, 8);
    [[-0.86, 1.3], [0.86, 1.3], [-0.86, -1.25], [0.86, -1.25]].forEach(([wx, wz]) => {
      const tire = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wx, 0.32, wz);
      const rim = new THREE.Mesh(rimGeo, this.mat.richGoldTrim);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, 0.32, wz);
      car.add(tire, rim);
    });

    // Faceted Sparkling Diamond Supercar Body (low-slung luxury coupe)
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.56, 4.15), this.mat.diamondCrystal);
    lowerBody.position.set(0, 0.56, 0);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.24, 1.45), this.mat.diamondAccent);
    hood.position.set(0, 0.88, 1.25);
    hood.rotation.x = 0.08;

    const rearDeck = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.28, 1.1), this.mat.diamondAccent);
    rearDeck.position.set(0, 0.9, -1.35);

    // Crystal Hood Ornament Diamond + Gold Front Grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.32, 0.12), this.mat.richGoldTrim);
    grille.position.set(0, 0.54, 2.08);
    const hoodGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), this.mat.diamondGlow);
    hoodGem.position.set(0, 1.12, 1.9);

    // Open-View Glass Cabin so Sheru Bhai Lion is clearly visible sitting inside!
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.12, 1.55), this.mat.diamondCrystal);
    roof.position.set(0, 1.58, -0.15);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.62, 0.08), this.mat.heliGlass);
    windshield.position.set(0, 1.24, 0.62);
    windshield.rotation.x = -0.35;
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.56, 0.08), this.mat.heliGlass);
    rearGlass.position.set(0, 1.24, -0.92);
    rearGlass.rotation.x = 0.32;
    [[-0.68, 0.52], [0.68, 0.52], [-0.68, -0.85], [0.68, -0.85]].forEach(([px, pz]) => {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.08), this.mat.richGoldTrim);
      pil.position.set(px, 1.22, pz);
      car.add(pil);
    });

    // Rear Diamond Spoiler + Sparkling Neon Underglow
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.32), this.mat.diamondAccent);
    spoiler.position.set(0, 1.26, -1.9);
    const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 4.4), this.mat.diamondGlow);
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.set(0, 0.07, 0);

    // Headlights & Taillights
    const hlGeo = new THREE.BoxGeometry(0.36, 0.14, 0.08);
    const hlL = new THREE.Mesh(hlGeo, this.mat.diamondGlow);
    hlL.position.set(-0.62, 0.66, 2.09);
    const hlR = hlL.clone();
    hlR.position.x = 0.62;
    const tlL = new THREE.Mesh(hlGeo, this.mat.taillight);
    tlL.position.set(-0.62, 0.68, -2.09);
    const tlR = tlL.clone();
    tlR.position.x = 0.62;

    // Seated Sheru Bhai inside Diamond Car (toggled visible when driving!)
    const seatedSheru = this._makeLiveSheruBhai(0.68, true);
    seatedSheru.position.set(-0.22, 0.56, -0.05);
    this.heroAirportSheruSlots.push({ slotName: "airport_car_sheru", group: seatedSheru, targetMaxDim: 1.05, yOffset: -0.24, rotY: 0, animName: "Idle" });
    this._loadHeroGLB("airport_car_sheru", this.getSheruGlbUrl(), seatedSheru, 1.05, -0.24, 0, "Idle", true);
    car.userData.seatedSheru = seatedSheru;

    // Night road beam
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.5), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.09, 4.35);
    beam.visible = this.timeOfDay === "night";
    car.userData.nightBeam = beam;

    car.add(lowerBody, hood, rearDeck, grille, hoodGem, roof, windshield, rearGlass, spoiler, underglow, hlL, hlR, tlL, tlR, seatedSheru, beam);
    return car;
  },

  _makeDiamondHeliMesh() {
    const heli = new THREE.Group();

    // Gold Landing Skids + Struts
    const skidGeo = new THREE.CylinderGeometry(0.09, 0.09, 4.4, 6);
    skidGeo.rotateX(Math.PI / 2);
    const skidL = new THREE.Mesh(skidGeo, this.mat.richGoldTrim);
    skidL.position.set(-1.15, 0.12, 0.1);
    const skidR = skidL.clone();
    skidR.position.x = 1.15;
    const strutGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.85, 5);
    [[-1.0, 0.9], [1.0, 0.9], [-1.0, -0.8], [1.0, -0.8]].forEach(([sx, sz]) => {
      const st = new THREE.Mesh(strutGeo, this.mat.richGoldTrim);
      st.position.set(sx, 0.52, sz);
      st.rotation.z = sx < 0 ? -0.25 : 0.25;
      heli.add(st);
    });

    // Faceted Sparkling Diamond Fuselage Cabin + Crystal Nose
    const cabinFloor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 3.6), this.mat.diamondCrystal);
    cabinFloor.position.set(0, 1.05, 0.1);
    const cabinBack = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.45, 1.9), this.mat.diamondCrystal);
    cabinBack.position.set(0, 1.85, -0.75);
    const cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.34, 3.3), this.mat.diamondAccent);
    cabinRoof.position.set(0, 2.58, 0.05);

    // Nose Cone (faceted diamond crystal!)
    const noseCone = new THREE.Mesh(new THREE.OctahedronGeometry(1.12, 0), this.mat.diamondAccent);
    noseCone.scale.set(0.95, 0.72, 1.25);
    noseCone.position.set(0, 1.45, 1.95);

    // Clear Cyan Cockpit Canopy (so Sheru Bhai is visible flying inside!)
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.98, 1.12, 1.65), this.mat.heliGlass);
    canopy.position.set(0, 1.84, 1.05);

    // Gold Trim Stripes along fuselage
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 3.4), this.mat.richGoldTrim);
    stripeL.position.set(-1.06, 1.25, 0.1);
    const stripeR = stripeL.clone();
    stripeR.position.x = 1.06;

    // Tapered Diamond Tail Boom + Vertical Fin + Stabilizers
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.52, 4.4, 6), this.mat.diamondCrystal);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.position.set(0, 1.85, -3.55);

    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.65, 0.95), this.mat.diamondAccent);
    tailFin.position.set(0, 2.45, -5.45);
    tailFin.rotation.x = -0.25;

    const hStab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.55), this.mat.richGoldTrim);
    hStab.position.set(0, 1.85, -4.6);

    // Main Rotor Mast + 4-Blade Spinning Main Rotor (stored on userData for animation!)
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.65, 8), this.mat.richGoldTrim);
    mast.position.set(0, 2.95, -0.15);

    const mainRotor = new THREE.Group();
    mainRotor.position.set(0, 3.28, -0.15);
    const hub = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), this.mat.diamondGlow);
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.06, 0.34), this.mat.rotorBlade);
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 7.8), this.mat.rotorBlade);
    const tip1 = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.07, 0.14), this.mat.diamondGlow);
    mainRotor.add(hub, blade1, blade2, tip1);
    heli.userData.mainRotor = mainRotor;

    // Spinning Tail Rotor
    const tailRotor = new THREE.Group();
    tailRotor.position.set(0.22, 2.55, -5.55);
    const tb1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.45, 0.14), this.mat.richGoldTrim);
    const tb2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 1.45), this.mat.richGoldTrim);
    tailRotor.add(tb1, tb2);
    heli.userData.tailRotor = tailRotor;

    // Navigation Lights (Red Left, Green Right) + Spotlight
    const navL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), this.mat.beaconRed);
    navL.position.set(-1.12, 1.45, 0.8);
    const navR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), this.mat.beaconGreen);
    navR.position.set(1.12, 1.45, 0.8);

    // Seated Sheru Bhai inside Diamond Helicopter Cockpit!
    const seatedSheru = this._makeLiveSheruBhai(0.86, true);
    seatedSheru.position.set(0, 1.25, 0.95);
    this.heroAirportSheruSlots.push({ slotName: "airport_heli_sheru", group: seatedSheru, targetMaxDim: 1.25, yOffset: -0.28, rotY: 0, animName: "Idle" });
    this._loadHeroGLB("airport_heli_sheru", this.getSheruGlbUrl(), seatedSheru, 1.25, -0.28, 0, "Idle", true);
    seatedSheru.visible = false;
    heli.userData.seatedSheru = seatedSheru;

    heli.add(
      skidL, skidR, cabinFloor, cabinBack, cabinRoof, noseCone, canopy,
      stripeL, stripeR, tailBoom, tailFin, hStab, mast, mainRotor, tailRotor, navL, navR, seatedSheru
    );
    return heli;
  },

  _makeCommercialPlaneMesh() {
    const plane = new THREE.Group();

    // Long Cylindrical White Fuselage + Rounded Nose + Tapered Tail
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 11.4, 12), this.mat.planeWhite);
    fuse.rotation.x = Math.PI / 2;
    fuse.position.set(0, 2.35, 0);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(1.18, 12, 10), this.mat.planeWhite);
    nose.scale.set(1, 0.92, 1.85);
    nose.position.set(0, 2.3, 5.6);

    const tailCone = new THREE.Mesh(new THREE.ConeGeometry(1.18, 3.6, 12), this.mat.planeWhite);
    tailCone.rotation.x = -Math.PI / 2;
    tailCone.position.set(0, 2.45, -7.4);

    // Blue & Gold Airline Livery Belly Stripe + Cockpit Windshield
    const livery = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.36, 10.8), this.mat.planeBlue);
    livery.position.set(0, 2.02, -0.1);
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.48, 1.05), this.mat.busWindshield);
    cockpit.position.set(0, 2.75, 5.75);

    // Passenger Cabin Windows Strip on Both Sides
    const winStripGeo = new THREE.BoxGeometry(0.08, 0.28, 8.6);
    const winL = new THREE.Mesh(winStripGeo, this.mat.busWindshield);
    winL.position.set(-1.18, 2.6, 0.2);
    const winR = winL.clone();
    winR.position.x = 1.18;

    // Swept Main Wings + Wingtip Winglets + Dual Jet Engines
    const wingGeo = new THREE.BoxGeometry(6.8, 0.22, 2.5);
    const wingL = new THREE.Mesh(wingGeo, this.mat.planeWhite);
    wingL.position.set(-4.2, 2.0, 0.4);
    wingL.rotation.y = 0.24;
    const wingR = new THREE.Mesh(wingGeo, this.mat.planeWhite);
    wingR.position.set(4.2, 2.0, 0.4);
    wingR.rotation.y = -0.24;

    const engGeo = new THREE.CylinderGeometry(0.46, 0.42, 1.85, 10);
    engGeo.rotateX(Math.PI / 2);
    const engL = new THREE.Mesh(engGeo, this.mat.planeBlue);
    engL.position.set(-3.1, 1.45, 0.9);
    const engR = engL.clone();
    engR.position.x = 3.1;

    // Vertical Tail Fin (Blue + Gold Stripe) + Horizontal Tailplanes
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.4, 2.6), this.mat.planeBlue);
    tailFin.position.set(0, 4.45, -6.5);
    tailFin.rotation.x = -0.28;
    const finGold = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.55, 2.3), this.mat.richGoldTrim);
    finGold.position.set(0, 4.95, -6.6);
    finGold.rotation.x = -0.28;

    const hTail = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 1.45), this.mat.planeWhite);
    hTail.position.set(0, 2.65, -7.1);

    // Landing Gear Wheels (Front + 2 Main Rear)
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 8);
    wheelGeo.rotateZ(Math.PI / 2);
    const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.1, 6);
    [[0, 4.6], [-1.75, -0.4], [1.75, -0.4]].forEach(([gx, gz]) => {
      const st = new THREE.Mesh(strutGeo, this.mat.charcoal);
      st.position.set(gx, 0.85, gz);
      const wh = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
      wh.position.set(gx, 0.32, gz);
      plane.add(st, wh);
    });

    // Wingtip Navigation Lights
    const navL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), this.mat.beaconRed);
    navL.position.set(-7.5, 2.15, -0.4);
    const navR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), this.mat.beaconGreen);
    navR.position.set(7.5, 2.15, -0.4);

    plane.add(fuse, nose, tailCone, livery, cockpit, winL, winR, wingL, wingR, engL, engR, tailFin, finGold, hTail, navL, navR);
    return plane;
  },

  _buildInternationalAirport(ringRadius) {
    const ax = ringRadius + 78;
    this.airportX = ax;

    const ap = new THREE.Group();
    ap.position.set(ax, 0, 0);

    const nightGlowMeshes = [];

    // 1. Airport Express Highway connecting East Outer Ring Road -> Crossing Double Tracks -> Inside Airport VIP Gate (at z = 18)
    const hwyLen = 42;
    const expressHwy = new THREE.Mesh(new THREE.BoxGeometry(hwyLen, 0.1, 7.6), this.mat.highway);
    expressHwy.position.set(-55, 0.02, 18);
    const hwyStripe = new THREE.Mesh(new THREE.PlaneGeometry(hwyLen - 2, 0.25), this.mat.petrolYellow);
    hwyStripe.rotation.x = -Math.PI / 2;
    hwyStripe.position.set(-55, 0.09, 18);
    ap.add(expressHwy, hwyStripe);

    // Airport Highway Entrance Gate Arch
    const archPillarGeo = new THREE.BoxGeometry(0.85, 6.2, 0.85);
    const apP1 = new THREE.Mesh(archPillarGeo, this.mat.wallWhite);
    apP1.position.set(-44.5, 3.1, 13.6);
    const apP2 = apP1.clone();
    apP2.position.z = 22.4;
    const apBeam = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.6, 10.2), this.mat.navy);
    apBeam.position.set(-44.5, 6.0, 18);
    const gateBoardF = this._makeBuildingBoard("SHERU BHAI AIRPORT", "20 ACRES • VIP GATE", "#0f172a", "#38bdf8", 9.2, 1.35);
    gateBoardF.rotation.y = -Math.PI / 2;
    gateBoardF.position.set(-45.08, 6.0, 18);
    const gateBoardB = gateBoardF.clone();
    gateBoardB.rotation.y = Math.PI / 2;
    gateBoardB.position.x = -43.92;
    ap.add(apP1, apP2, apBeam, gateBoardF, gateBoardB);

    // 2. Massive 20-Acre Airport Tarmac Apron (88 x 96 units!) & Perimeter Fence
    const turfPad = new THREE.Mesh(new THREE.BoxGeometry(88, 0.06, 96), this.mat.turf);
    turfPad.position.set(0, 0.01, 0);

    const tarmac = new THREE.Mesh(new THREE.BoxGeometry(52, 0.1, 86), this.mat.tarmacGrey);
    tarmac.position.set(-14, 0.04, 0);

    // Perimeter Boundary Fence (leaving gate open on West at z = 13..23)
    const fN = new THREE.Mesh(new THREE.BoxGeometry(88, 1.4, 0.3), this.mat.concrete);
    fN.position.set(0, 0.7, -48);
    const fS = fN.clone();
    fS.position.z = 48;
    const fE = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 96), this.mat.concrete);
    fE.position.set(44, 0.7, 0);
    const fWN = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 61), this.mat.concrete);
    fWN.position.set(-44, 0.7, -17.5);
    const fWS = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.4, 25), this.mat.concrete);
    fWS.position.set(-44, 0.7, 35.5);
    ap.add(turfPad, tarmac, fN, fS, fE, fWN, fWS);

    // 3. Long International Runway (88 units long along East side, x = +24)
    const runway = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.12, 88), this.mat.runwayAsphalt);
    runway.position.set(24, 0.06, 0);
    ap.add(runway);

    // Runway Centerline Dashes & Threshold Piano Keys (Instanced or batched clean meshes)
    const dashGeo = new THREE.PlaneGeometry(0.45, 3.6);
    dashGeo.rotateX(-Math.PI / 2);
    for (let rz = -36; rz <= 36; rz += 7.2) {
      const dash = new THREE.Mesh(dashGeo, this.mat.stripe);
      dash.position.set(24, 0.14, rz);
      ap.add(dash);
    }
    const keyGeo = new THREE.PlaneGeometry(0.75, 4.2);
    keyGeo.rotateX(-Math.PI / 2);
    [-41, 41].forEach((kz) => {
      for (let kx = 18.5; kx <= 29.5; kx += 1.8) {
        const key = new THREE.Mesh(keyGeo, this.mat.stripe);
        key.position.set(kx, 0.14, kz);
        ap.add(key);
      }
    });

    // Taxiway Connectors from Tarmac to Runway (South Takeoff & North Exit)
    const taxiGeo = new THREE.BoxGeometry(20, 0.11, 7.5);
    const taxiS = new THREE.Mesh(taxiGeo, this.mat.runwayAsphalt);
    taxiS.position.set(10, 0.055, 34);
    const taxiN = taxiS.clone();
    taxiN.position.z = -34;
    ap.add(taxiS, taxiN);

    // Glowing Runway Edge Lights (Light up blue/amber at night!)
    const rLightGeo = new THREE.SphereGeometry(0.24, 5, 5);
    for (let lz = -40; lz <= 40; lz += 10) {
      [16.2, 31.8].forEach((lx) => {
        const bulb = new THREE.Mesh(rLightGeo, this.mat.runwayBlueLight);
        bulb.position.set(lx, 0.35, lz);
        bulb.visible = this.timeOfDay === "night";
        ap.add(bulb);
        nightGlowMeshes.push(bulb);
      });
    }

    // 4. Grand Modern International Terminal Building (West-North Side)
    const termMain = new THREE.Mesh(new THREE.BoxGeometry(15, 7.2, 32), this.mat.wallWhite);
    termMain.position.set(-30, 3.65, -14);
    const termGlass = new THREE.Mesh(new THREE.BoxGeometry(15.3, 4.6, 28), this.mat.glass);
    termGlass.position.set(-30, 3.8, -14);
    const termRoof = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.8, 35), this.mat.navy);
    termRoof.position.set(-29, 7.6, -14);
    const termTrim = new THREE.Mesh(new THREE.BoxGeometry(18.7, 0.32, 35.2), this.mat.richGoldTrim);
    termTrim.position.set(-29, 7.15, -14);

    // Terminal Facade Signboards (both tarmac-facing & city-facing)
    const termBoardE = this._makeBuildingBoard("SHERU BHAI AIRPORT", "INTERNATIONAL TERMINAL • 20 ACRES", "#0f172a", "#facc15", 16.0, 2.1);
    termBoardE.rotation.y = Math.PI / 2;
    termBoardE.position.set(-22.2, 6.2, -14);
    const termBoardW = termBoardE.clone();
    termBoardW.rotation.y = -Math.PI / 2;
    termBoardW.position.x = -37.8;
    ap.add(termMain, termGlass, termRoof, termTrim, termBoardE, termBoardW);

    // 5. Air Traffic Control (ATC) Tower with Rotating Radar Dish & Blinking Red Beacon!
    const atcBase = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.2, 13.5, 8), this.mat.wallWhite);
    atcBase.position.set(-30, 6.8, -37);
    const atcDeck = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 2.8, 1.4, 8), this.mat.navy);
    atcDeck.position.set(-30, 14.1, -37);
    const atcGlass = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.0, 2.4, 8), this.mat.glass);
    atcGlass.position.set(-30, 16.0, -37);
    const atcCap = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.6, 0.65, 8), this.mat.wallWhite);
    atcCap.position.set(-30, 17.5, -37);

    const radarGroup = new THREE.Group();
    radarGroup.position.set(-30, 18.6, -37);
    const radarPost = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.4, 6), this.mat.charcoal);
    const radarBar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.55, 0.25), this.mat.richGoldTrim);
    radarBar.position.y = 0.65;
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 6), this.mat.beaconRed);
    beacon.position.y = 1.25;
    radarGroup.add(radarPost, radarBar, beacon);
    ap.add(atcBase, atcDeck, atcGlass, atcCap, radarGroup);

    // 6. Mobile Passenger Boarding Stairs beside Commercial Plane Bay (-2, -12)
    const stairs = new THREE.Group();
    stairs.position.set(-6.0, 0.1, -9.8);
    for (let st = 0; st < 6; st++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 1.35), this.mat.wallWhite);
      step.position.set(st * 0.48, 0.2 + st * 0.34, 0);
      stairs.add(step);
    }
    const stairRail = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.12, 1.42), this.mat.planeBlue);
    stairRail.position.set(1.2, 1.55, 0);
    stairRail.rotation.z = 0.62;
    ap.add(stairs, stairRail);

    // 7. Commercial Airplane + Airport Shuttle Bus + 6 Live Boarding Passengers!
    const plane = this._makeCommercialPlaneMesh();
    plane.rotation.order = "YXZ";
    ap.add(plane);

    const shuttleBus = this._makeRealBusMesh(0x0284c7, false);
    ap.add(shuttleBus);

    const planePassengers = [
      this.mat.wallCoral, this.mat.wallGold, this.mat.wallMint,
      this.mat.wallBlue, this.mat.richVelvetRed, this.mat.khakiUniform
    ].map((sm) => {
      const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.95 });
      p.visible = false;
      ap.add(p);
      return p;
    });

    // 8. VIP SHERU BHAI HELIPAD & RED CARPET ZONE (Inside Airport South-West at x = -2, z = 24)
    const vipRoad = new THREE.Mesh(new THREE.BoxGeometry(30, 0.11, 6.2), this.mat.highway);
    vipRoad.position.set(-29, 0.055, 18);
    const vipDropBay = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 8), this.mat.runwayAsphalt);
    vipDropBay.position.set(-16, 0.06, 22);
    ap.add(vipRoad, vipDropBay);

    // Red VIP Carpet from Diamond Car Drop-Off straight onto Diamond Helipad!
    const redCarpet = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.15, 2.2), this.mat.vipCarpet);
    redCarpet.position.set(-10.5, 0.09, 23.2);
    redCarpet.rotation.y = -0.14;
    ap.add(redCarpet);

    // Circular VIP Helipad with Glowing Diamond Cyan Ring & Bold Gold "H"
    const helipad = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.5, 0.18, 24), this.mat.runwayAsphalt);
    helipad.position.set(-1, 0.09, 24);
    const heliRing = new THREE.Mesh(new THREE.RingGeometry(6.1, 6.8, 24), this.mat.diamondGlow);
    heliRing.rotation.x = -Math.PI / 2;
    heliRing.position.set(-1, 0.2, 24);
    const hLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 5.2), this.mat.richGoldTrim);
    hLeft.rotation.x = -Math.PI / 2;
    hLeft.position.set(-2.6, 0.21, 24);
    const hRight = hLeft.clone();
    hRight.position.x = 0.6;
    const hMid = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.85), this.mat.richGoldTrim);
    hMid.rotation.x = -Math.PI / 2;
    hMid.position.set(-1, 0.21, 24);

    // VIP Helipad Signboard
    const vipSign = this._makeBuildingBoard("SHERU BHAI VIP PAD", "DIAMOND HELICOPTER", "#0f172a", "#67e8f9", 7.2, 1.15);
    vipSign.position.set(-1, 2.6, 32.5);
    const vp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.6, 6), this.mat.richGoldTrim);
    vp1.position.set(-4.2, 1.3, 32.5);
    const vp2 = vp1.clone();
    vp2.position.x = 2.2;
    ap.add(helipad, heliRing, hLeft, hRight, hMid, vipSign, vp1, vp2);

    // 9. LIVE VIP SHERU BHAI + SPARKLING DIAMOND CAR + SPARKLING DIAMOND HELICOPTER!
    const diamondCar = this._makeDiamondCarMesh();
    ap.add(diamondCar);
    if (diamondCar.userData.nightBeam) {
      nightGlowMeshes.push(diamondCar.userData.nightBeam);
    }

    const walkingSheru = this._makeLiveSheruBhai(1.08, false);
    walkingSheru.visible = false;
    this.heroAirportSheruSlots.push({ slotName: "airport_walk_sheru", group: walkingSheru, targetMaxDim: 2.1, yOffset: 0.0, rotY: 0, animName: "Walk" });
    this._loadHeroGLB("airport_walk_sheru", this.getSheruGlbUrl(), walkingSheru, 2.1, 0.0, 0, "Walk", true);
    ap.add(walkingSheru);

    const diamondHeli = this._makeDiamondHeliMesh();
    diamondHeli.rotation.order = "YXZ";
    this.heroHeliSlot = diamondHeli;
    if (this.heroModelUrls && this.heroModelUrls.heli) {
      this._loadHeroGLB("heli", this.heroModelUrls.heli, diamondHeli, 8.2, 0.1, 0);
    }
    ap.add(diamondHeli);

    // 9b. 🅿️ DEDICATED AIRPORT PASSENGER PARKING PLAZA (Beside Terminal & VIP Gate — IN ⬆ / ⬇ OUT!)
    const apParkGroup = new THREE.Group();
    apParkGroup.position.set(-30, 0.06, 33);

    const apParkBase = new THREE.Mesh(new THREE.BoxGeometry(22.0, 0.12, 14.5), this.mat.tarmacGrey);
    apParkGroup.add(apParkBase);

    // Connector Driveway from Airport Express Highway (z = 18 -> z = 26) straight into Airport Parking!
    const apParkEntryL = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.11, 9.0), this.mat.road);
    apParkEntryL.position.set(-5.8, 0.0, -10.5);
    const apParkExitR = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.11, 9.0), this.mat.road);
    apParkExitR.position.set(5.8, 0.0, -10.5);
    apParkGroup.add(apParkEntryL, apParkExitR);

    // White Parking Bay Markings + Parked Cars & Yellow Autos
    for (let px = -9.0; px <= 9.0; px += 3.0) {
      const pLine = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 4.2), this.mat.stripe);
      pLine.rotation.x = -Math.PI / 2;
      pLine.position.set(px, 0.08, 3.6);
      apParkGroup.add(pLine);
    }
    const apCar1 = this._makeVehicleMesh(false, false, 0x3b82f6, false);
    apCar1.position.set(-7.5, 0.08, 3.6);
    const apCar2 = this._makeVehicleMesh(false, false, 0xf59e0b, false);
    apCar2.position.set(-4.5, 0.08, 3.6);
    const apCar3 = this._makeVehicleMesh(false, false, 0x10b981, false);
    apCar3.position.set(1.5, 0.08, 3.6);
    const apAuto = this._makeRealAutoMesh(false, false);
    apAuto.position.set(7.5, 0.08, 3.6);
    apParkGroup.add(apCar1, apCar2, apCar3, apAuto);

    // Airport Parking Overhead Signboard + IN / OUT Badges
    const apParkBoard = this._makeBuildingBoard("AIRPORT PARKING", "IN ⬆  •  ⬇ OUT • 24/7", "#1e3a8a", "#facc15", 8.8, 1.35);
    apParkBoard.position.set(0, 3.4, -7.2);
    [-4.2, 4.2].forEach((sx) => {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 6), this.mat.chrome);
      sp.position.set(sx, 1.6, -7.2);
      apParkGroup.add(sp);
    });
    const apInStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.8), this.mat.parkingGreen);
    apInStrip.rotation.x = -Math.PI / 2;
    apInStrip.position.set(-5.8, 0.08, -7.8);
    const apOutStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.8), this.mat.parkingRed);
    apOutStrip.rotation.x = -Math.PI / 2;
    apOutStrip.position.set(5.8, 0.08, -7.8);
    apParkGroup.add(apParkBoard, apInStrip, apOutStrip);
    ap.add(apParkGroup);

    // 9c. 🛣️ PROPER PAVED ROAD NETWORK FOR AIRPORT-SIDE HOUSES (Connected directly to Airport Express Highway!)
    // Direct North-South Link Road dropping South from Airport Express Highway (x = -46, z = 18 -> z = 65)
    const linkRoad = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.1, 49.0), this.mat.road);
    linkRoad.position.set(-46, 0.04, 41.5);
    const linkDash = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 45.0), this.mat.stripe);
    linkDash.rotation.x = -Math.PI / 2;
    linkDash.position.set(-46, 0.1, 41.5);
    ap.add(linkRoad, linkDash);

    // Main Airport Colony Boulevard (East-West along z = 64.4 — right between Row 1 & Row 2 of Airport Houses!)
    const apColonyRoad = new THREE.Mesh(new THREE.BoxGeometry(84, 0.1, 5.8), this.mat.road);
    apColonyRoad.position.set(-5, 0.04, 64.4);
    const apSidewalkN = new THREE.Mesh(new THREE.BoxGeometry(84, 0.12, 1.2), this.mat.sidewalk);
    apSidewalkN.position.set(-5, 0.06, 61.1);
    const apSidewalkS = apSidewalkN.clone();
    apSidewalkS.position.z = 67.7;
    ap.add(apColonyRoad, apSidewalkN, apSidewalkS);

    for (let dx = -42; dx <= 34; dx += 6.0) {
      const cd = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.2), this.mat.stripe);
      cd.rotation.x = -Math.PI / 2;
      cd.position.set(dx, 0.1, 64.4);
      ap.add(cd);
    }
    // Street lamps along the Airport Colony Boulevard
    for (let lx = -36; lx <= 28; lx += 16) {
      const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.6, 5), this.mat.lampPole);
      lp.position.set(lx, 1.8, 61.1);
      const lb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.lampBulbDay);
      lb.position.set(lx, 3.65, 61.1);
      ap.add(lp, lb);
      this.lampBulbs.push(lb);
    }
    const colSign = this._makeBuildingBoard("AIRPORT COLONY ROAD", "VIP RESIDENTIAL PLOTS", "#0f172a", "#38bdf8", 7.8, 1.15);
    colSign.position.set(-39, 3.2, 60.4);
    ap.add(colSign);

    const apAddPad = new THREE.Group();
    apAddPad.position.set(-38, 0.12, 56.8);
    const padBase = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.18, 7.0), this.mat.addPadGlow);
    const plusH = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 0.85), this.mat.wallWhite);
    plusH.position.y = 0.05;
    const plusV = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.22, 3.6), this.mat.wallWhite);
    plusV.position.y = 0.05;
    const padSign = this._createNameSign("➕ ADD AIRPORT PLOT", "TAP TO PLACE PLOT HERE", false);
    padSign.position.set(0, 3.6, 0);
    const padHit = new THREE.Mesh(new THREE.BoxGeometry(7.4, 5.0, 7.4), this.mat.invisibleHitbox);
    padHit.position.y = 2.5;
    padHit.userData.plotId = "ADD_AIRPORT_PLOT";
    apAddPad.add(padBase, plusH, plusV, padSign, padHit);
    this.plotHitboxes.push(padHit);
    ap.add(apAddPad);

    // 10. Floating Big Airport Sign + Clickable Hitbox
    const apSign = this._createNameSign("✈️ SHERU BHAI INTL AIRPORT", "20 ACRES • LIVE FLIGHTS & DIAMOND HELI", true);
    apSign.position.set(-12, 23.5, -14);
    ap.add(apSign);

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(88, 18, 96),
      this.mat.invisibleHitbox
    );
    hitbox.position.set(0, 9, 0);
    hitbox.userData.plotId = "AIRPORT";
    ap.add(hitbox);
    this.plotHitboxes.push(hitbox);

    this.cityGroup.add(ap);

    // Precompute scenic aerial flight paths (in Airport local coordinates) circling the ENTIRE CITY!
    const cityOrbitR = Math.max(ringRadius + 8, 52);
    const planeCityLoop = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(24, 20, -48),
        new THREE.Vector3(10 - ax, 40, -cityOrbitR),
        new THREE.Vector3(-cityOrbitR - ax, 44, -cityOrbitR * 0.45),
        new THREE.Vector3(-cityOrbitR - ax, 44, cityOrbitR * 0.55),
        new THREE.Vector3(-ax, 42, cityOrbitR),
        new THREE.Vector3(24, 24, 58)
      ],
      false,
      "catmullrom",
      0.45
    );

    const heliCityLoop = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-1, 20, 24),
        new THREE.Vector3(-ax * 0.45, 25, 16),
        new THREE.Vector3(-ax + 12, 22, 12),            // Swoops right past Sheru Bhai Statue at ST Junction!
        new THREE.Vector3(-ax - cityOrbitR * 0.65, 26, -cityOrbitR * 0.5),
        new THREE.Vector3(-ax, 27, -cityOrbitR * 0.8),
        new THREE.Vector3(-ax + cityOrbitR * 0.65, 25, -cityOrbitR * 0.45),
        new THREE.Vector3(-1, 20, 24)
      ],
      false,
      "catmullrom",
      0.45
    );

    this.airportSim = {
      ax,
      radarGroup,
      beacon,
      plane,
      shuttleBus,
      planePassengers,
      planeCityLoop,
      diamondCar,
      walkingSheru,
      diamondHeli,
      heliCityLoop,
      nightGlowMeshes
    };
  },

  _buildSheruBhaiBeach(ringRadius) {
    const bx = -(ringRadius + 76);
    this.beachX = bx;

    const bg = new THREE.Group();
    bg.position.set(bx, 0, 0);

    // 1. WIDE 4-LANE OUTSKIRTS-TO-BEACH HIGHWAY (Connects West City Outskirts Ring Road x = +76 -> Beachfront!)
    const hwLen = 64;
    const beachHighway = new THREE.Mesh(this._boxGeo(hwLen, 0.1, 8.6), this.mat.highway);
    beachHighway.position.set(46, 0.02, 0);
    const hwDash = new THREE.Mesh(new THREE.PlaneGeometry(hwLen - 2, 0.28), this.mat.stripe);
    hwDash.rotation.x = -Math.PI / 2;
    hwDash.position.set(46, 0.09, 0);
    bg.add(beachHighway, hwDash);

    // Beachside Colony Boulevard running North-South along the Beach Resort Strip (z = -54 to +54 at x = 31)
    // Gives direct paved road access to Beach OYO, Beach Hostel, Medical Shop & ALL addable Beach Houses/Landmarks!
    const colonyBlvd = new THREE.Mesh(this._boxGeo(7.0, 0.1, 112), this.mat.road);
    colonyBlvd.position.set(31.5, 0.02, 0);
    const blvdDash = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 108), this.mat.stripe);
    blvdDash.rotation.x = -Math.PI / 2;
    blvdDash.position.set(31.5, 0.08, 0);
    bg.add(colonyBlvd, blvdDash);

    // Coastal Entrance Arch ("SHERU BHAI BEACH • OUTSKIRTS HIGHWAY")
    const apGeo = this._boxGeo(0.75, 5.8, 0.75);
    const p1 = new THREE.Mesh(apGeo, this.mat.teakWood);
    p1.position.set(36, 2.9, -4.8);
    const p2 = p1.clone();
    p2.position.z = 4.8;
    const archTop = new THREE.Mesh(this._boxGeo(0.95, 1.45, 10.6), this.mat.oceanDeep);
    archTop.position.set(36, 5.6, 0);
    const bArchF = this._makeBuildingBoard("SHERU BHAI BEACH", "OYO RESORT • HOSTEL • BEACH PARKING", "#0284c7", "#fde047", 9.6, 1.25);
    bArchF.rotation.y = Math.PI / 2;
    bArchF.position.set(36.5, 5.6, 0);
    const bArchB = bArchF.clone();
    bArchB.rotation.y = -Math.PI / 2;
    bArchB.position.x = 35.5;
    bg.add(p1, p2, archTop, bArchF, bArchB);

    // 2. WIDE GOLDEN SAND BEACH + WET SHORELINE + TURQUOISE OCEAN!
    const drySand = new THREE.Mesh(this._boxGeo(44, 0.14, 114), this.mat.beachSand);
    drySand.position.set(16, 0.04, 0);
    const wetSand = new THREE.Mesh(this._boxGeo(7.5, 0.1, 114), this.mat.beachSandWet);
    wetSand.position.set(-7.5, 0.03, 0);
    // 🎨 GLSL GPU ANIMATED SHIMMERING OCEAN WATER (Zero CPU Loops — Real Ripples, Depth & Foam!)
    this.oceanShader = createGLSLOceanMaterial(bx - 10.5);
    const oceanPlane = new THREE.Mesh(new THREE.PlaneGeometry(540, 1120, 1, 1), this.oceanShader.mat);
    oceanPlane.rotation.x = -Math.PI / 2;
    oceanPlane.position.set(-280, 0.04, 0);
    bg.add(drySand, wetSand, oceanPlane);

    // Animated White Ocean Wave Foam Strips
    const waveStrips = [];
    const waveGeo = new THREE.PlaneGeometry(1.6, 110);
    waveGeo.rotateX(-Math.PI / 2);
    for (let w = 0; w < 3; w++) {
      const foam = new THREE.Mesh(waveGeo, this.mat.seaFoam);
      foam.position.set(-10 - w * 5.2, 0.1, 0);
      bg.add(foam);
      waveStrips.push({ mesh: foam, baseX: -10 - w * 5.2, phase: w * 2.1 });
    }

    // 3. Wooden Ocean Pier / Jetty (at z = 24)
    const pierDeck = new THREE.Mesh(this._boxGeo(24, 0.25, 4.4), this.mat.teakWood);
    pierDeck.position.set(-16, 0.72, 24);
    for (let px = -26; px <= -6; px += 5) {
      [-1.8, 1.8].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.1, 6), this.mat.darkWood);
        post.position.set(px, 0.35, 24 + pz);
        bg.add(post);
      });
    }
    const pierLamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 6), this.mat.lampBulbDay);
    pierLamp.position.set(-27.2, 2.3, 24);
    const pierPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.6, 5), this.mat.lampPole);
    pierPole.position.set(-27.2, 1.5, 24);
    this.lampBulbs.push(pierLamp);
    bg.add(pierDeck, pierPole, pierLamp);

    // 4. Coconut Palm Trees along the Golden Sand
    const addBeachPalm = (px, pz, tilt = 0.14) => {
      const palm = new THREE.Group();
      palm.position.set(px, 0.1, pz);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 5.2, 6), this.mat.treeTrunk);
      trunk.position.y = 2.6;
      trunk.rotation.z = tilt;
      palm.add(trunk);
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const frond = new THREE.Mesh(this._boxGeo(2.6, 0.12, 0.65), this.mat.treeLeaf);
        frond.position.set(Math.sin(tilt) * 2.4 + Math.cos(ang) * 1.1, 5.1, Math.sin(ang) * 1.1);
        frond.rotation.y = -ang;
        frond.rotation.z = -0.32;
        palm.add(frond);
      }
      bg.add(palm);
    };
    [[6, -38, 0.14], [12, -26, -0.15], [4, -14, 0.16], [4, 2, 0.14], [10, 32, -0.14], [4, 42, 0.16]].forEach(
      ([px, pz, t]) => addBeachPalm(px, pz, t)
    );

    // 5. 🅿️ DEDICATED BEACHFRONT VISITOR PARKING PLAZA (x = 18.5, z = 0)
    // Cars arrive from City Outskirts Road -> Park Here -> People Walk to Sand Beach -> Return & Drive Out!
    const bPark = new THREE.Mesh(this._boxGeo(13.5, 0.16, 12.6), this.mat.tarmacGrey);
    bPark.position.set(18.5, 0.1, 0);
    for (let pz = -4.2; pz <= 4.2; pz += 2.8) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.14), this.mat.stripe);
      pl.rotation.x = -Math.PI / 2;
      pl.position.set(15.5, 0.2, pz);
      bg.add(pl);
    }
    const bParkBoard = this._makeBuildingBoard("BEACH PARKING", "PARK & WALK TO BEACH • FREE", "#0f172a", "#38bdf8", 7.6, 1.05);
    bParkBoard.rotation.y = Math.PI / 2;
    bParkBoard.position.set(25.2, 3.2, 0);
    [-3.6, 3.6].forEach((pz) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 6), this.mat.chrome);
      pole.position.set(25.2, 1.65, pz);
      bg.add(pole);
    });
    bg.add(bPark, bParkBoard);

    // 🚗 LIVE OUTSKIRTS-TO-BEACH CARS, BUSES & REAL PARK -> WALK TO BEACH -> DRIVE OUT CYCLE!
    const beachVisitorCars = [];
    const parkColors = [0xef4444, 0x3b82f6, 0xfacc15];
    const parkSlotsZ = [-2.8, 0.0, 2.8];
    for (let v = 0; v < 3; v++) {
      const vCar = this._makeVehicleMesh(false, false, parkColors[v], true);
      vCar.userData.isAnimated = true;
      bg.add(vCar);

      const boyVisitor = this._createCharacter({ shirtMat: v === 0 ? this.mat.wallBlue : this.mat.wallGold, pantsMat: this.mat.darkPants, scale: 0.92 });
      const girlVisitor = this._createCharacter({ shirtMat: v === 1 ? this.mat.girlDressPurple : this.mat.girlDressPink, pantsMat: this.mat.wallWhite, scale: 0.88 });
      boyVisitor.visible = false;
      girlVisitor.visible = false;
      bg.add(boyVisitor, girlVisitor);

      beachVisitorCars.push({
        car: vCar,
        boy: boyVisitor,
        girl: girlVisitor,
        slotZ: parkSlotsZ[v],
        phase: v * 7.5
      });
    }

    // Dedicated APSRTC Beach Express Bus + Auto driving continuously between City Outskirts Road & Beachfront!
    const beachBus = this._makeVehicleMesh(true, false, 0xdc2626, true);
    const beachAuto = this._makeRealAutoMesh(true, true);
    bg.add(beachBus, beachAuto);

    // 6. 🦁 SHERU BHAI CHILLING ON THE BEACH (x = 4, z = 12)
    const chillZone = new THREE.Group();
    chillZone.position.set(4, 0.12, 12);
    const bedFrame = new THREE.Mesh(this._boxGeo(2.6, 0.24, 1.35), this.mat.teakWood);
    bedFrame.position.set(0, 0.36, 0);
    const mattress = new THREE.Mesh(this._boxGeo(2.45, 0.18, 1.2), this.mat.wallWhite);
    mattress.position.set(0, 0.54, 0);
    const backrest = new THREE.Mesh(this._boxGeo(1.1, 0.18, 1.18), this.mat.wallWhite);
    backrest.position.set(0.92, 0.92, 0);
    backrest.rotation.z = 0.62;
    const towel = new THREE.Mesh(this._boxGeo(1.5, 0.06, 1.24), this.mat.tropicalShorts);
    towel.position.set(-0.35, 0.65, 0);
    const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 3.6, 6), this.mat.richGoldTrim);
    uPole.position.set(0.8, 1.8, -1.25);
    const uCanopy = new THREE.Mesh(new THREE.ConeGeometry(2.6, 0.85, 8), this.mat.petrolRed);
    uCanopy.position.set(0.8, 3.55, -1.25);
    const uStripe = new THREE.Mesh(new THREE.ConeGeometry(2.64, 0.45, 8), this.mat.wallWhite);
    uStripe.position.set(0.8, 3.35, -1.25);
    const sideTbl = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.62, 8), this.mat.richGoldTrim);
    sideTbl.position.set(0.2, 0.32, 1.25);
    const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), this.mat.turf);
    coconut.position.set(0.2, 0.78, 1.25);
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 4), this.mat.petrolYellow);
    straw.position.set(0.25, 1.02, 1.25);
    straw.rotation.z = -0.35;
    const surf = new THREE.Mesh(this._boxGeo(0.14, 2.8, 0.72), this.mat.studioCyan);
    surf.position.set(-2.2, 1.35, -2.5);
    surf.rotation.z = 0.22;
    surf.rotation.y = 0.4;

    const chillingSheru = new THREE.Group();
    chillingSheru.position.set(0.25, 0.68, 0);
    const sLegGeo = new THREE.CylinderGeometry(0.17, 0.14, 1.25, 8);
    sLegGeo.rotateZ(Math.PI / 2);
    const sLegL = new THREE.Mesh(sLegGeo, this.mat.lionFurGold);
    sLegL.position.set(-0.78, 0.16, -0.22);
    const sLegR = sLegL.clone();
    sLegR.position.z = 0.22;
    const shorts = new THREE.Mesh(this._boxGeo(0.65, 0.34, 0.76), this.mat.tropicalShorts);
    shorts.position.set(-0.18, 0.2, 0);
    const sTorso = new THREE.Mesh(this._boxGeo(0.88, 0.42, 0.78), this.mat.tropicalShirt);
    sTorso.position.set(0.42, 0.48, 0);
    sTorso.rotation.z = 0.56;
    const sChain = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.045, 6, 12, Math.PI), this.mat.richGoldTrim);
    sChain.position.set(0.54, 0.68, 0);
    sChain.rotation.y = -Math.PI / 2;
    sChain.rotation.z = Math.PI;

    const sHeadGroup = new THREE.Group();
    sHeadGroup.position.set(0.88, 0.98, 0);
    const sHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), this.mat.lionFurGold);
    const sSnout = new THREE.Mesh(this._boxGeo(0.24, 0.2, 0.24), this.mat.lionFurGold);
    sSnout.position.set(-0.28, -0.06, 0);
    const sNose = new THREE.Mesh(this._boxGeo(0.1, 0.08, 0.12), this.mat.sunglasses);
    sNose.position.set(-0.38, 0.0, 0);
    const sShades = new THREE.Mesh(this._boxGeo(0.12, 0.15, 0.52), this.mat.sunglasses);
    sShades.position.set(-0.32, 0.08, 0);
    const sManeGeo = new THREE.DodecahedronGeometry(0.22, 0);
    for (let m = 0; m < 8; m++) {
      const ang = (m / 8) * Math.PI * 2;
      const mt = new THREE.Mesh(sManeGeo, this.mat.lionManeRich);
      mt.position.set(0.08, Math.sin(ang) * 0.36, Math.cos(ang) * 0.36);
      sHeadGroup.add(mt);
    }
    sHeadGroup.add(sHead, sSnout, sNose, sShades);
    chillingSheru.add(sLegL, sLegR, shorts, sTorso, sChain, sHeadGroup);
    // Attach Animated 3D Sheru Bhai GLB right at the Beach VIP Lounge (facing the Ocean & Beach Visitors!)
    const beachGlbSlot = new THREE.Group();
    beachGlbSlot.position.set(-1.3, 0.0, 1.9);
    chillZone.add(beachGlbSlot);
    this.heroBeachSheruSlot = beachGlbSlot;
    this._loadHeroGLB("beach_sheru", this.getSheruGlbUrl(), beachGlbSlot, 2.35, 0.0, -Math.PI / 2, "Idle", true);
    const chillSign = this._createNameSign("🦁 SHERU BHAI CHILLING", "VIP BEACH LOUNGE", false);
    chillSign.position.set(0.5, 4.9, 0);
    chillZone.add(bedFrame, mattress, backrest, towel, uPole, uCanopy, uStripe, sideTbl, coconut, straw, surf, chillingSheru, chillSign);
    bg.add(chillZone);

    // 7. 🏡 FOLLOWER BEACH HOUSE VILLA ON THE SAND (x = 16, z = -16)
    const villa = new THREE.Group();
    villa.position.set(16, 0.12, -16);
    const deck = new THREE.Mesh(this._boxGeo(15.0, 0.45, 13.0), this.mat.teakWood);
    deck.position.set(0, 0.24, 0);
    const pool = new THREE.Mesh(this._boxGeo(3.6, 0.5, 7.2), this.mat.water);
    pool.position.set(-5.0, 0.25, 0);
    const vFloor1 = new THREE.Mesh(this._boxGeo(9.0, 3.6, 10.2), this.mat.wallWhite);
    vFloor1.position.set(2.0, 2.25, 0);
    const vGlass1 = new THREE.Mesh(this._boxGeo(0.24, 2.7, 8.0), this.mat.glass);
    vGlass1.position.set(-2.52, 2.0, 0);
    const vTeakClad = new THREE.Mesh(this._boxGeo(9.2, 3.6, 2.1), this.mat.teakWood);
    vTeakClad.position.set(2.0, 2.25, -4.2);
    const vSlab = new THREE.Mesh(this._boxGeo(11.4, 0.35, 11.0), this.mat.wallWhite);
    vSlab.position.set(1.2, 4.15, 0);
    const vFloor2 = new THREE.Mesh(this._boxGeo(8.0, 3.2, 8.6), this.mat.stuccoIvory);
    vFloor2.position.set(2.4, 5.9, -0.5);
    const vGlass2 = new THREE.Mesh(this._boxGeo(0.24, 2.4, 7.0), this.mat.glass);
    vGlass2.position.set(-1.62, 5.85, -0.5);
    const vBalcRail = new THREE.Mesh(this._boxGeo(0.14, 0.95, 10.4), this.mat.glass);
    vBalcRail.position.set(-4.35, 4.8, 0);
    const vRoof = new THREE.Mesh(this._boxGeo(10.4, 0.35, 10.2), this.mat.slateTrim);
    vRoof.position.set(1.8, 7.65, -0.5);
    const cleanOwner = (this.beachOwner || "@follower_beach").trim();
    const villaBoardW = this._makeBuildingBoard(cleanOwner.toUpperCase(), "BEACH HOUSE VILLA", "#0f172a", "#38bdf8", 8.6, 1.4);
    villaBoardW.rotation.y = -Math.PI / 2;
    villaBoardW.position.set(-3.45, 7.65, -0.5);
    const villaBoardE = villaBoardW.clone();
    villaBoardE.rotation.y = Math.PI / 2;
    villaBoardE.position.x = 7.05;
    const villaSign = this._createNameSign(`🏡 ${cleanOwner}`, "🏖️ BEACH HOUSE VILLA • SHERU BHAI BEACH", true);
    villaSign.position.set(1.5, 10.8, 0);
    villa.add(deck, pool, vFloor1, vGlass1, vTeakClad, vSlab, vFloor2, vGlass2, vBalcRail, vRoof, villaBoardW, villaBoardE, villaSign);
    bg.add(villa);

    // 8. 🏨 BEACH SIDE 20-FLOOR OYO ROOMS TOWER + 🏢 BEACH HOSTEL + 💊 24/7 MEDICAL SHOP (Right Along Beach Boulevard!)
    //    Pre-built directly on the Beach Resort Strip so your Beach Skyline looks iconic right away!
    const beachOYO = this._buildFourPlotLandmark("hotel_oyo", "BEACH_OYO_DEFAULT", "BEACH OYO");
    beachOYO.position.set(20.5, 0.14, 20.5);
    beachOYO.rotation.y = Math.PI / 2; // Faces Beachside Colony Boulevard!
    const oyoSkySign = this._createNameSign("🏨 20-FLOOR OYO ROOMS", "BEACH RESORT • COUPLES & PARKING", true);
    oyoSkySign.position.set(0, 31.8, 0);
    beachOYO.add(oyoSkySign);
    bg.add(beachOYO);

    const beachHostel = this._buildFourPlotLandmark("hostel", "BEACH_HOSTEL_DEFAULT", "BEACH HOSTEL");
    beachHostel.position.set(20.5, 0.14, -34.5);
    beachHostel.rotation.y = Math.PI / 2;
    const hstSign = this._createNameSign("🏢 BEACH VIEW HOSTEL", "BOYS & GIRLS HOSTEL • WIFI", true);
    hstSign.position.set(0, 11.4, 0);
    beachHostel.add(hstSign);
    bg.add(beachHostel);

    const beachMed = this._buildOnePlotBuilding("medical_shop", "BEACH");
    beachMed.position.set(39.0, 0.14, 10.5);
    beachMed.rotation.y = -Math.PI / 2; // Faces Boulevard directly across from OYO & Parking!
    const medSign = this._createNameSign("💊 24/7 MEDICAL SHOP", "BEACH PHARMACY", false);
    medSign.position.set(0, 6.8, 0);
    beachMed.add(medSign);
    bg.add(beachMed);

    // 9. ➕ ADD BEACH PLOT PAD (Right on Beachside Colony Boulevard — Touch to Add Houses OR Landmarks near Beach!)
    const bAddPad = new THREE.Group();
    bAddPad.position.set(40, 0.14, -12);
    const bPadBase = new THREE.Mesh(this._boxGeo(7.4, 0.18, 7.4), this.mat.addPadGlow);
    const bPlusH = new THREE.Mesh(this._boxGeo(3.6, 0.22, 0.85), this.mat.wallWhite);
    bPlusH.position.y = 0.05;
    const bPlusV = new THREE.Mesh(this._boxGeo(0.85, 0.22, 3.6), this.mat.wallWhite);
    bPlusV.position.y = 0.05;
    const bPadSign = this._createNameSign("➕ ADD BEACH PLOT", "HOUSES OR LANDMARKS", false);
    bPadSign.position.set(0, 3.6, 0);
    const bPadHit = new THREE.Mesh(this._boxGeo(7.8, 5.2, 7.8), this.mat.invisibleHitbox);
    bPadHit.position.y = 2.6;
    bPadHit.userData.plotId = "ADD_BEACH_PLOT";
    bAddPad.add(bPadBase, bPlusH, bPlusV, bPadSign, bPadHit);
    this.plotHitboxes.push(bPadHit);
    bg.add(bAddPad);

    // 10. Clickable Hitbox for the Ocean & Beach
    const hitbox = new THREE.Mesh(this._boxGeo(40, 14, 110), this.mat.invisibleHitbox);
    hitbox.position.set(-4, 7, 0);
    hitbox.userData.plotId = "BEACH";
    bg.add(hitbox);
    this.plotHitboxes.push(hitbox);

    this.cityGroup.add(bg);
    this.beachSim = {
      waveStrips,
      chillingHead: sHeadGroup
    };
    this.beachHighwaySim = {
      visitorCars: beachVisitorCars,
      beachBus,
      beachAuto,
      hwStartX: 74,
      hwParkX: 16.5,
      sandX: 3.5
    };
  },

  _makeTrainLocomotive(nightLights) {
    const loco = new THREE.Group();

    // Heavy Bogie Underframe + 6 Steel Wheels + Buffers
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.45, 5.9), this.mat.charcoal);
    chassis.position.set(0, 0.48, 0);
    const whGeo = new THREE.CylinderGeometry(0.28, 0.28, 2.02, 8);
    whGeo.rotateZ(Math.PI / 2);
    [-2.2, -1.35, -0.55, 0.55, 1.35, 2.2].forEach((wz) => {
      const wh = new THREE.Mesh(whGeo, this.mat.wheelBlack);
      wh.position.set(0, 0.28, wz);
      loco.add(wh);
    });

    // Aerodynamic Blue/White/Red/Yellow Indian Express WAP-7 Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.96, 1.55, 5.4), this.mat.trainBlue);
    body.position.set(0, 1.48, -0.05);
    const noseSlope = new THREE.Mesh(new THREE.BoxGeometry(1.88, 1.15, 0.9), this.mat.trainBlue);
    noseSlope.position.set(0, 1.25, 2.85);
    noseSlope.rotation.x = 0.22;

    const yellowBand = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.34, 5.85), this.mat.trainYellow);
    yellowBand.position.set(0, 1.12, 0.1);
    const redTrim = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.14, 5.88), this.mat.petrolRed);
    redTrim.position.set(0, 0.88, 0.1);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.26, 5.2), this.mat.trainRoof);
    roof.position.set(0, 2.36, -0.05);

    // Split Cab Windshields + Chrome Front Buffers + Cowcatcher
    const windL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.56, 0.12), this.mat.busWindshield);
    windL.position.set(-0.42, 1.82, 2.75);
    windL.rotation.x = -0.18;
    const windR = windL.clone();
    windR.position.x = 0.42;

    const guard = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.36, 0.52), this.mat.trainYellow);
    guard.position.set(0, 0.34, 3.15);
    [-0.65, 0.65].forEach((bx) => {
      const buf = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.36, 6), this.mat.chrome);
      buf.rotation.x = Math.PI / 2;
      buf.position.set(bx, 0.68, 3.18);
      loco.add(buf);
    });

    // Detailed Rooftop Electric Pantograph + AC Unit
    const acPod = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 1.4), this.mat.wallWhite);
    acPod.position.set(0, 2.58, 1.1);
    const pantoArm1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), this.mat.petrolRed);
    pantoArm1.position.set(0, 2.72, -1.2);
    pantoArm1.rotation.x = 0.45;
    const pantoBar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.35), this.mat.chrome);
    pantoBar.position.set(0, 3.04, -1.35);

    // Twin Bright Locomotive Headlights + Long Night Beam!
    const hlTop = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 8), this.mat.lampBulbNight);
    hlTop.rotation.x = Math.PI / 2;
    hlTop.position.set(0, 2.18, 2.68);
    const hlLowL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.12, 8), this.mat.lampBulbNight);
    hlLowL.rotation.x = Math.PI / 2;
    hlLowL.position.set(-0.58, 1.15, 3.05);
    const hlLowR = hlLowL.clone();
    hlLowR.position.x = 0.58;

    const beam = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 9.5), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.24, 7.6);
    beam.visible = this.timeOfDay === "night";
    nightLights.push(beam);

    loco.add(chassis, body, noseSlope, yellowBand, redTrim, roof, windL, windR, guard, acPod, pantoArm1, pantoBar, hlTop, hlLowL, hlLowR, beam);
    return loco;
  },

  _makeTrainCoach(trainWindows) {
    const coach = new THREE.Group();

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.42, 5.75), this.mat.charcoal);
    chassis.position.set(0, 0.46, 0);
    const whGeo = new THREE.CylinderGeometry(0.26, 0.26, 1.98, 8);
    whGeo.rotateZ(Math.PI / 2);
    [-2.1, -1.3, 1.3, 2.1].forEach((wz) => {
      const wh = new THREE.Mesh(whGeo, this.mat.wheelBlack);
      wh.position.set(0, 0.26, wz);
      coach.add(wh);
    });

    // Classic Blue LHB/ICF Express Coach + White & Yellow Stripes + Rooftop AC Pods
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.94, 1.52, 5.65), this.mat.trainDarkBlue);
    body.position.set(0, 1.44, 0);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.18, 5.68), this.mat.wallWhite);
    stripe.position.set(0, 1.02, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.24, 5.55), this.mat.trainRoof);
    roof.position.set(0, 2.3, 0);
    const ac1 = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.2, 1.15), this.mat.wallWhite);
    ac1.position.set(0, 2.48, 1.3);
    const ac2 = ac1.clone();
    ac2.position.z = -1.3;

    // Inter-coach rubber vestibule coupler
    const coupler = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.32, 0.45), this.mat.charcoal);
    coupler.position.set(0, 1.36, 2.95);

    // 5 Passenger Windows on BOTH Sides (Glow warm yellow in Night Mode!)
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.busWindshield;
    const winGeo = new THREE.BoxGeometry(0.06, 0.5, 0.72);
    for (let wz = -1.9; wz <= 1.9; wz += 0.95) {
      const wL = new THREE.Mesh(winGeo, winMat);
      wL.position.set(-0.98, 1.58, wz);
      const wR = new THREE.Mesh(winGeo, winMat);
      wR.position.set(0.98, 1.58, wz);
      coach.add(wL, wR);
      trainWindows.push(wL, wR);
    }

    const doorGeo = new THREE.BoxGeometry(0.08, 1.32, 0.5);
    [-2.48, 2.48].forEach((dz) => {
      const dL = new THREE.Mesh(doorGeo, this.mat.chrome);
      dL.position.set(-0.98, 1.34, dz);
      const dR = dL.clone();
      dR.position.x = 0.98;
      coach.add(dL, dR);
    });

    coach.add(chassis, body, stripe, roof, ac1, ac2, coupler);
    return coach;
  },

  _makeVandeBharatCar(isLead, isTail, trainWindows, nightLights) {
    const car = new THREE.Group();

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 5.75), this.mat.charcoal);
    chassis.position.set(0, 0.46, 0);
    const whGeo = new THREE.CylinderGeometry(0.26, 0.26, 1.98, 8);
    whGeo.rotateZ(Math.PI / 2);
    [-2.0, -1.2, 1.2, 2.0].forEach((wz) => {
      const wh = new THREE.Mesh(whGeo, this.mat.wheelBlack);
      wh.position.set(0, 0.26, wz);
      car.add(wh);
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.96, 1.52, 5.6), this.mat.vbWhite);
    body.position.set(0, 1.44, 0);
    const orangeStripe = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.28, 5.65), this.mat.vbOrange);
    orangeStripe.position.set(0, 1.02, 0);
    const blueSkirt = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.22, 5.62), this.mat.vbBlue);
    blueSkirt.position.set(0, 0.72, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.22, 5.45), this.mat.vbWhite);
    roof.position.set(0, 2.28, 0);

    // Continuous Panoramic Dark Window Band on BOTH sides (glows at night!)
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.busWindshield;
    const bandL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.54, 4.9), winMat);
    bandL.position.set(-0.99, 1.62, 0);
    const bandR = bandL.clone();
    bandR.position.x = 0.99;
    trainWindows.push(bandL, bandR);
    car.add(bandL, bandR);

    if (isLead || isTail) {
      const dir = isLead ? 1 : -1;
      const aeroNose = new THREE.Mesh(new THREE.ConeGeometry(1.06, 1.95, 6), this.mat.vbWhite);
      aeroNose.rotation.x = dir * Math.PI / 2;
      aeroNose.scale.set(0.95, 1.0, 0.72);
      aeroNose.position.set(0, 1.26, dir * 3.55);
      const aeroGlass = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.58, 0.72), this.mat.busWindshield);
      aeroGlass.position.set(0, 1.82, dir * 2.95);
      aeroGlass.rotation.x = -dir * 0.45;
      car.add(aeroNose, aeroGlass);

      if (isLead) {
        const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.14), this.mat.lampBulbNight);
        hlL.position.set(-0.56, 1.08, 3.65);
        const hlR = hlL.clone();
        hlR.position.x = 0.56;
        const beam = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 9.5), this.mat.headlightBeam);
        beam.rotation.x = -Math.PI / 2;
        beam.position.set(0, 0.24, 8.2);
        beam.visible = this.timeOfDay === "night";
        nightLights.push(beam);
        car.add(hlL, hlR, beam);
      }
    }

    car.add(chassis, body, orangeStripe, blueSkirt, roof);
    return car;
  },

  _buildRailwaySystem(ringRadius) {
    const railRInner = ringRadius + 24.0;
    const railROuter = ringRadius + 27.8;
    const railRMid = (railRInner + railROuter) / 2;
    this.railRInner = railRInner;
    this.railROuter = railROuter;
    this.railwayZ = -railRMid;

    const rg = new THREE.Group();
    const nightLights = [];
    const trainWindows = [];

    // Helper: Build smooth rounded-square closed loop spline at radius R (clockwise if dir=1, counter-clockwise if dir=-1)
    const makeLoopCurve = (R, dir = 1) => {
      const cornerR = 12.0;
      const inner = R - cornerR;
      const raw = [
        // Start right at the North-West Hollowed Mountain Tunnel (x = -inner*0.58, z = -R) heading East toward Station!
        new THREE.Vector3(-inner * 0.58, 0.14, -R),
        new THREE.Vector3(0, 0.14, -R), // Platform 1 / Platform 2!
        new THREE.Vector3(inner, 0.14, -R),
        new THREE.Vector3(R - 2.4, 0.14, -R + 2.4),
        new THREE.Vector3(R, 0.14, -inner),
        new THREE.Vector3(R, 0.14, 0),
        new THREE.Vector3(R, 0.14, inner),
        new THREE.Vector3(R - 2.4, 0.14, R - 2.4),
        new THREE.Vector3(inner, 0.14, R),
        new THREE.Vector3(0, 0.14, R),
        new THREE.Vector3(-inner, 0.14, R),
        new THREE.Vector3(-R + 2.4, 0.14, R - 2.4),
        new THREE.Vector3(-R, 0.14, inner),
        new THREE.Vector3(-R, 0.14, 0),
        new THREE.Vector3(-R, 0.14, -inner),
        new THREE.Vector3(-R + 2.4, 0.14, -R + 2.4),
        new THREE.Vector3(-inner, 0.14, -R)
      ];
      if (dir < 0) raw.reverse();
      return new THREE.CatmullRomCurve3(raw, true, "catmullrom", 0.35);
    };

    const track1Curve = makeLoopCurve(railRInner, 1);  // Train 1: Coming from NW Tunnel -> East into Platform 1 -> around City!
    const track2Curve = makeLoopCurve(railROuter, -1); // Train 2: Going from Platform 2 -> West into NW Tunnel -> around City!

    const len1 = track1Curve.getLength();
    const len2 = track2Curve.getLength();

    // Find exact stationT on each track closest to x=0, z=-R
    const findNearestT = (curve, tx, tz) => {
      let bestT = 0;
      let bestD = Infinity;
      for (let i = 0; i < 400; i++) {
        const tt = i / 400;
        const p = curve.getPointAt(tt);
        const d = (p.x - tx) * (p.x - tx) + (p.z - tz) * (p.z - tz);
        if (d < bestD) {
          bestD = d;
          bestT = tt;
        }
      }
      return bestT;
    };
    const stationT1 = findNearestT(track1Curve, 0, -railRInner);
    const stationT2 = findNearestT(track2Curve, 0, -railROuter);

    // 1. Render BOTH Parallel Railway Tracks (Ballast + Sleepers + 4 Steel Rails) using Ultra-Fast InstancedMesh!
    const buildInstancedTrack = (curve, totalLen) => {
      const count = Math.min(340, Math.floor(totalLen / 2.0));
      const sleeperGeo = new THREE.BoxGeometry(2.65, 0.1, 0.42);
      const sleeperInst = new THREE.InstancedMesh(sleeperGeo, this.mat.railSleeper, count);
      const railGeo = new THREE.BoxGeometry(0.14, 0.12, (totalLen / count) * 1.15);
      const railInst = new THREE.InstancedMesh(railGeo, this.mat.railSteel, count * 2);

      const dummy = new THREE.Object3D();
      const up = new THREE.Vector3(0, 1, 0);
      const rightV = new THREE.Vector3();
      for (let i = 0; i < count; i++) {
        const u = i / count;
        const p = curve.getPointAt(u);
        const tan = curve.getTangentAt(u).normalize();
        const yaw = Math.atan2(tan.x, tan.z);

        dummy.position.set(p.x, 0.08, p.z);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        sleeperInst.setMatrixAt(i, dummy.matrix);

        rightV.crossVectors(up, tan).normalize();
        dummy.position.set(p.x - rightV.x * 0.8, 0.16, p.z - rightV.z * 0.8);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        railInst.setMatrixAt(i * 2, dummy.matrix);

        dummy.position.set(p.x + rightV.x * 0.8, 0.16, p.z + rightV.z * 0.8);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        railInst.setMatrixAt(i * 2 + 1, dummy.matrix);
      }
      sleeperInst.instanceMatrix.needsUpdate = true;
      railInst.instanceMatrix.needsUpdate = true;
      rg.add(sleeperInst, railInst);
    };
    buildInstancedTrack(track1Curve, len1);
    buildInstancedTrack(track2Curve, len2);

    // 2. Railway Crossing Warning Posts at East Airport Highway & West Beach Road
    const addCrossing = (cx, cz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.0, 6), this.mat.trainYellow);
      post.position.set(cx, 1.5, cz);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), this.mat.beaconRed);
      lamp.position.set(cx, 3.1, cz);
      rg.add(post, lamp);
    };
    addCrossing(railRInner - 2.4, 13.5);
    addCrossing(railROuter + 2.4, 22.5);
    addCrossing(-railRInner + 2.4, -4.5);
    addCrossing(-railROuter - 2.4, 4.5);

    // 3. ⛰️ REAL HOLLOWED ARCHED MOUNTAIN TUNNEL (Right in the Marked North-West Corner!)
    //    Spans BOTH parallel tracks cleanly so you can look straight THROUGH the open hollow arch!
    const tunnelX = -(railRInner - 12.0) * 0.58;
    const tunLen = 22.0;
    const tunGroup = new THREE.Group();
    tunGroup.position.set(tunnelX, 0, -railRMid);

    // Hollowed Double-Track Concrete Tunnel Walls (Left/South Wall + Right/North Wall — COMPLETELY OPEN INSIDE!)
    const wallS = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 4.4, 1.1), this.mat.tunnelDarkWall);
    wallS.position.set(0, 2.2, 4.3);
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 4.4, 1.1), this.mat.tunnelDarkWall);
    wallN.position.set(0, 2.2, -4.3);
    tunGroup.add(wallS, wallN);

    // Curved Hollow Arched Vault Roof (5 angled concrete slabs forming a genuine hollow semicircular arch over BOTH tracks!)
    const vaultAngles = [-0.88, -0.44, 0, 0.44, 0.88];
    const vaultR = 4.6;
    vaultAngles.forEach((va) => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 0.75, 2.3), this.mat.tunnelDarkWall);
      slab.position.set(0, 3.8 + Math.cos(va) * 2.1, Math.sin(va) * vaultR);
      slab.rotation.x = va;
      tunGroup.add(slab);
    });

    // Concrete Stone Arched Entrance & Exit Portals on BOTH Ends (+X & -X) — Open Hollow Mouths!
    [-tunLen / 2, tunLen / 2].forEach((px) => {
      const pS = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.8, 2.4), this.mat.tunnelConcrete);
      pS.position.set(px, 2.9, 5.2);
      const pN = pS.clone();
      pN.position.z = -5.2;
      const pHeader = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.9, 12.8), this.mat.tunnelConcrete);
      pHeader.position.set(px, 6.2, 0);
      const pYellow = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.42, 13.0), this.mat.trainYellow);
      pYellow.position.set(px, 5.3, 0);
      // Green & Red Tunnel Signal Lights above the portal
      const sigG = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6), this.mat.beaconGreen);
      sigG.position.set(px + (px > 0 ? 0.72 : -0.72), 6.2, 2.2);
      const sigR = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6), this.mat.beaconRed);
      sigR.position.set(px + (px > 0 ? 0.72 : -0.72), 6.2, -2.2);
      tunGroup.add(pS, pN, pHeader, pYellow, sigG, sigR);
    });

    // Sculpted Green & Rocky Mountain Ridges OVER & BESIDE the Hollow Tunnel (NEVER blocking the inside bore!)
    const mTop1 = new THREE.Mesh(new THREE.DodecahedronGeometry(7.2, 0), this.mat.mountainGreen);
    mTop1.scale.set(1.65, 0.65, 1.35);
    mTop1.position.set(0, 9.6, 0);
    const mTop2 = new THREE.Mesh(new THREE.DodecahedronGeometry(5.6, 0), this.mat.mountainRock);
    mTop2.scale.set(1.4, 0.65, 1.15);
    mTop2.position.set(-4.5, 11.2, -1.2);
    const mSideN = new THREE.Mesh(new THREE.DodecahedronGeometry(6.8, 0), this.mat.mountainRock);
    mSideN.scale.set(1.55, 0.9, 0.85);
    mSideN.position.set(0, 4.6, -10.2);
    const mSideS = new THREE.Mesh(new THREE.DodecahedronGeometry(5.8, 0), this.mat.mountainGreen);
    mSideS.scale.set(1.45, 0.82, 0.78);
    mSideS.position.set(0, 3.8, 9.8);
    const mFarNW = new THREE.Mesh(new THREE.DodecahedronGeometry(8.4, 0), this.mat.mountainGreen);
    mFarNW.scale.set(1.3, 0.95, 1.2);
    mFarNW.position.set(-14.5, 5.2, -11.5);
    tunGroup.add(mTop1, mTop2, mSideN, mSideS, mFarNW);

    const tunSign = this._createNameSign("⛰️ HOLLOW RAILWAY TUNNEL", "2 TRACKS • IN & OUT TRAINS", true);
    tunSign.position.set(0, 16.5, 0);
    tunGroup.add(tunSign);
    rg.add(tunGroup);

    // 4. 🚉 GRAND 2-PLATFORM RAILWAY STATION ("SHERU BHAI JN") + FOOT OVERBRIDGE STEPS + STATION PARKING (IN / OUT)
    const stGroup = new THREE.Group();
    stGroup.position.set(0, 0, -railRMid);

    // --- A. PLATFORM 1 (South / City Side at local z = +4.4, right beside Track 1 at local z = +1.9) ---
    const pf1 = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.9, 4.6), this.mat.concrete);
    pf1.position.set(0, 0.45, 5.0);
    const pf1Edge = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.08, 0.36), this.mat.trainYellow);
    pf1Edge.position.set(0, 0.92, 2.85);
    const pf1Roof = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.28, 4.8), this.mat.stationRoof);
    pf1Roof.position.set(-2, 4.5, 5.0);
    for (let px = -12; px <= 8; px += 5) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 6), this.mat.wallWhite);
      col.position.set(px, 2.7, 5.2);
      stGroup.add(col);
      const pl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.lampBulbNight);
      pl.position.set(px, 4.2, 3.8);
      pl.visible = this.timeOfDay === "night";
      stGroup.add(pl);
      nightLights.push(pl);
    }

    // --- B. PLATFORM 2 (North / Main Building Side at local z = -5.0, right beside Track 2 at local z = -1.9) ---
    const pf2 = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.9, 4.8), this.mat.concrete);
    pf2.position.set(0, 0.45, -5.0);
    const pf2Edge = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.08, 0.36), this.mat.trainYellow);
    pf2Edge.position.set(0, 0.92, -2.75);
    const pf2Roof = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.28, 5.0), this.mat.stationRoof);
    pf2Roof.position.set(-2, 4.5, -5.0);
    for (let px = -12; px <= 8; px += 5) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 6), this.mat.wallWhite);
      col.position.set(px, 2.7, -5.2);
      stGroup.add(col);
      const pl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.lampBulbNight);
      pl.position.set(px, 4.2, -3.8);
      pl.visible = this.timeOfDay === "night";
      stGroup.add(pl);
      nightLights.push(pl);
    }

    // Platform Benches & Iconic Yellow Indian Railways Station Nameboards on BOTH Platforms!
    [-9, -2, 4].forEach((bx) => {
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.6), this.mat.trainBlue);
      b1.position.set(bx, 1.1, 5.6);
      const b2 = b1.clone();
      b2.position.z = -5.6;
      stGroup.add(b1, b2);
    });
    const irPF1 = this._makeBuildingBoard("SHERU BHAI JN", "PLATFORM 1 • INCOMING", "#facc15", "#111827", 5.8, 1.25);
    irPF1.position.set(-15.0, 2.4, 4.8);
    const irPF2 = this._makeBuildingBoard("SHERU BHAI JN", "PLATFORM 2 • OUTGOING", "#facc15", "#111827", 5.8, 1.25);
    irPF2.position.set(-15.0, 2.4, -4.8);
    stGroup.add(irPF1, irPF2);

    // --- C. FOOT OVERBRIDGE (FOB) WITH REAL STEPS CONNECTING PLATFORM 1 <-> PLATFORM 2 OVER BOTH TRACKS! ---
    const fobX = 12.6;
    // Elevated Bridge Span cleanly above both trains (y = 4.65; trains are 3.05 tall!)
    const fobDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.34, 11.4), this.mat.concrete);
    fobDeck.position.set(fobX, 4.65, 0);
    const fobRailL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 11.4), this.mat.fobSteel);
    fobRailL.position.set(fobX - 1.52, 5.35, 0);
    const fobRailR = fobRailL.clone();
    fobRailR.position.x = fobX + 1.52;
    const fobRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 11.6), this.mat.stationRoof);
    fobRoof.position.set(fobX, 6.45, 0);
    // Support Steel Columns on Platform 1 & Platform 2
    [[-1.4, 4.2], [1.4, 4.2], [-1.4, -4.2], [1.4, -4.2]].forEach(([dx, dz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.6, 6), this.mat.fobSteel);
      col.position.set(fobX + dx, 2.5, dz);
      stGroup.add(col);
    });
    // REAL STEPPED STAIRCASES going down onto Platform 1 (facing West along platform) AND Platform 2!
    for (let st = 0; st < 8; st++) {
      const sx = fobX - 1.8 - st * 0.56;
      const sy = 4.45 - st * 0.44;
      const step1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 1.85), this.mat.concrete);
      step1.position.set(sx, sy, 5.2);
      const step2 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 1.85), this.mat.concrete);
      step2.position.set(sx, sy, -5.2);
      stGroup.add(step1, step2);
    }
    // Staircase Handrails on both staircases
    const stairRail1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.16, 0.14), this.mat.trainYellow);
    stairRail1.position.set(fobX - 3.8, 3.6, 4.35);
    stairRail1.rotation.z = 0.66;
    const stairRail2 = stairRail1.clone();
    stairRail2.position.z = -4.35;
    stGroup.add(fobDeck, fobRailL, fobRailR, fobRoof, stairRail1, stairRail2);

    // Animated Pedestrian Crossing the Foot Overbridge between Platform 1 & Platform 2!
    const bridgeWalker = this._createCharacter({ shirtMat: this.mat.wallGold, pantsMat: this.mat.darkPants, scale: 0.92 });
    bridgeWalker.position.set(fobX, 4.86, 0);
    stGroup.add(bridgeWalker);

    // --- D. DIRECT ROAD CONNECTION FROM PLATFORM 1 <-> STATION PARKING (IN / OUT) <-> NORTH OUTER RING ROAD! ---
    // Note: Outer Ring Road is at world z = -ringRadius, which in stGroup local coords is local z = +railRMid - ringRadius (~ +25.9)!
    const distToRing = railRMid - ringRadius; // ~25.9
    const parkingZ = 14.2; // Sits neatly between Platform 1 (z=7.3) and North Outer Ring Road (z=22.3)!

    // Pedestrian Entrance Gate & Steps connecting Platform 1 directly to Station Parking Walkway!
    const pf1Steps = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.48, 1.8), this.mat.sidewalk);
    pf1Steps.position.set(0, 0.24, 8.1);
    const gateArch = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.9, 0.6), this.mat.navy);
    gateArch.position.set(0, 3.4, 8.2);
    const gColL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.4, 0.45), this.mat.wallWhite);
    gColL.position.set(-3.3, 1.7, 8.2);
    const gColR = gColL.clone();
    gColR.position.x = 3.3;
    const gateBoard = this._makeBuildingBoard("PLATFORM 1 ENTRY", "TICKET COUNTER", "#1e3a8a", "#facc15", 6.2, 0.85);
    gateBoard.position.set(0, 3.4, 8.55);
    stGroup.add(pf1Steps, gateArch, gColL, gColR, gateBoard);

    // Paved Station Parking Plaza (28 x 11.5 units) with Marked Bays & Parked Cars/Autos!
    const parkLot = new THREE.Mesh(new THREE.BoxGeometry(28.0, 0.1, 11.6), this.mat.tarmacGrey);
    parkLot.position.set(0, 0.05, parkingZ);
    const parkWalkway = new THREE.Mesh(new THREE.BoxGeometry(28.0, 0.14, 1.6), this.mat.sidewalk);
    parkWalkway.position.set(0, 0.07, 8.9);
    stGroup.add(parkLot, parkWalkway);

    // Marked White Parking Bay Lines + Parked Vehicles (Cars & Autos!)
    for (let px = -11; px <= 11; px += 3.2) {
      if (Math.abs(px) < 3.6) continue; // Keep center passenger drop-off clear!
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 3.8), this.mat.stripe);
      line.rotation.x = -Math.PI / 2;
      line.position.set(px, 0.12, 12.2);
      stGroup.add(line);
    }
    const pCar1 = this._makeVehicleMesh(false, false, 0xef4444, false);
    pCar1.position.set(-9.4, 0.1, 12.2);
    const pCar2 = this._makeVehicleMesh(false, false, 0x3b82f6, false);
    pCar2.position.set(-6.2, 0.1, 12.2);
    const pAuto1 = this._makeRealAutoMesh(false, false);
    pAuto1.position.set(6.4, 0.1, 12.2);
    const pCar3 = this._makeVehicleMesh(false, false, 0x22c55e, false);
    pCar3.position.set(9.6, 0.1, 12.2);
    stGroup.add(pCar1, pCar2, pAuto1, pCar3);

    // SEPARATE "IN ➔" ENTRY ROAD (Left) & "⬅ OUT" EXIT ROAD (Right) Directly Connected to North Outer Ring Road!
    const connLen = Math.max(4.5, distToRing - 19.2);
    const connZ = 19.6 + connLen / 2;
    const roadIn = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, connLen + 2.5), this.mat.road);
    roadIn.position.set(-8.5, 0.04, connZ);
    const roadOut = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, connLen + 2.5), this.mat.road);
    roadOut.position.set(8.5, 0.04, connZ);

    // Clear "IN ➔" (Green) & "⬅ OUT" (Red) Road Lane Markers + Overhead Signboards!
    const inStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3.2), this.mat.parkingGreen);
    inStrip.rotation.x = -Math.PI / 2;
    inStrip.position.set(-8.5, 0.12, 19.5);
    const outStrip = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 3.2), this.mat.parkingRed);
    outStrip.rotation.x = -Math.PI / 2;
    outStrip.position.set(8.5, 0.12, 19.5);

    const inSign = this._makeBuildingBoard("IN ⬆", "STATION PARKING", "#15803d", "#ffffff", 4.6, 1.0);
    inSign.position.set(-8.5, 2.8, 19.8);
    const inP = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 6), this.mat.chrome);
    inP.position.set(-10.7, 1.3, 19.8);

    const outSign = this._makeBuildingBoard("⬇ OUT", "TO CITY ROAD", "#b91c1c", "#ffffff", 4.6, 1.0);
    outSign.position.set(8.5, 2.8, 19.8);
    const outP = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 6), this.mat.chrome);
    outP.position.set(10.7, 1.3, 19.8);

    stGroup.add(roadIn, roadOut, inStrip, outStrip, inSign, inP, outSign, outP);

    // --- E. GRAND HERITAGE RAILWAY STATION MAIN BUILDING + CLOCK TOWER DOME (Behind Platform 2) ---
    const cleanRailOwner = (this.railwayOwner || "@_ur_bunny_108_").trim();
    const stMain = new THREE.Mesh(new THREE.BoxGeometry(26.0, 5.8, 6.4), this.mat.stuccoCream);
    stMain.position.set(0, 3.3, -10.8);
    const stTrim = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.45, 6.8), this.mat.terracottaRoof);
    stTrim.position.set(0, 6.3, -10.8);
    const clockBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.2, 4.2), this.mat.stuccoCream);
    clockBase.position.set(0, 7.8, -10.8);
    const clockDome = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.terracottaRoof);
    clockDome.position.set(0, 9.4, -10.8);
    const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 12), this.mat.wallWhite);
    clockFace.rotation.x = Math.PI / 2;
    clockFace.position.set(0, 8.0, -8.65);

    const mainBoard = this._makeBuildingBoard("RAILWAY STATION", `${cleanRailOwner.toUpperCase()} • SHERU BHAI JN`, "#1e3a8a", "#facc15", 15.0, 2.0);
    mainBoard.position.set(0, 5.7, -7.5);

    const stFloatSign = this._createNameSign(`🚂 SHERU BHAI JN • ${cleanRailOwner}`, "2 PLATFORMS • PARKING • EXPRESS TRAINS", true);
    stFloatSign.position.set(0, 14.5, -9.8);

    // 5 Passengers on Platform 1 (for Train 1) + 5 Passengers on Platform 2 (for Train 2)!
    const makePlatformPax = (zPos) =>
      [this.mat.wallCoral, this.mat.wallGold, this.mat.wallMint, this.mat.wallBlue, this.mat.richVelvetRed].map((sm, i) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.94 });
        p.position.set(-7.5 + i * 3.4, 0.95, zPos);
        stGroup.add(p);
        return p;
      });
    const paxPF1 = makePlatformPax(4.4);
    const paxPF2 = makePlatformPax(-4.4);

    // Clickable Hitbox for Railway Station
    const stHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(38, 15, 28),
      this.mat.invisibleHitbox
    );
    stHitbox.position.set(0, 7.5, 2.0);
    stHitbox.userData.plotId = "RAILWAY_STATION";
    stGroup.add(stHitbox);
    this.plotHitboxes.push(stHitbox);

    stGroup.add(pf1, pf1Edge, pf1Roof, pf2, pf2Edge, pf2Roof, stMain, stTrim, clockBase, clockDome, clockFace, mainBoard, stFloatSign);
    rg.add(stGroup);

    // 4b. ⛰️ SECOND HOLLOW ARAKU MOUNTAIN TUNNEL (Opposite South-East Side — Trains Emerge From Mountains on BOTH Ends!)
    const tunGroupSE = new THREE.Group();
    tunGroupSE.position.set(-tunnelX, 0, railRMid);
    const wallS2 = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 4.4, 1.1), this.mat.tunnelDarkWall);
    wallS2.position.set(0, 2.2, 4.3);
    const wallN2 = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 4.4, 1.1), this.mat.tunnelDarkWall);
    wallN2.position.set(0, 2.2, -4.3);
    tunGroupSE.add(wallS2, wallN2);
    vaultAngles.forEach((va) => {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(tunLen, 0.75, 2.3), this.mat.tunnelDarkWall);
      slab.position.set(0, 3.8 + Math.cos(va) * 2.1, Math.sin(va) * vaultR);
      slab.rotation.x = va;
      tunGroupSE.add(slab);
    });
    [-tunLen / 2, tunLen / 2].forEach((px) => {
      const pS = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.8, 2.4), this.mat.tunnelConcrete);
      pS.position.set(px, 2.9, 5.2);
      const pN = pS.clone();
      pN.position.z = -5.2;
      const pHeader = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.9, 12.8), this.mat.tunnelConcrete);
      pHeader.position.set(px, 6.2, 0);
      const pYellow = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.42, 13.0), this.mat.trainYellow);
      pYellow.position.set(px, 5.3, 0);
      const sigG = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6), this.mat.beaconGreen);
      sigG.position.set(px + (px > 0 ? 0.72 : -0.72), 6.2, 2.2);
      const sigR = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6), this.mat.beaconRed);
      sigR.position.set(px + (px > 0 ? 0.72 : -0.72), 6.2, -2.2);
      tunGroupSE.add(pS, pN, pHeader, pYellow, sigG, sigR);
    });
    const mSETop = new THREE.Mesh(new THREE.DodecahedronGeometry(7.6, 0), this.mat.arakuForestGreen);
    mSETop.scale.set(1.75, 0.72, 1.35);
    mSETop.position.set(0, 9.8, 0);
    const mSESideS = new THREE.Mesh(new THREE.DodecahedronGeometry(7.4, 0), this.mat.arakuRockGrey);
    mSESideS.scale.set(1.55, 0.95, 0.95);
    mSESideS.position.set(0, 4.8, 10.6);
    const mSESideN = new THREE.Mesh(new THREE.DodecahedronGeometry(5.6, 0), this.mat.arakuLushHill);
    mSESideN.scale.set(1.4, 0.8, 0.78);
    mSESideN.position.set(0, 3.6, -9.8);
    const tunSignSE = this._createNameSign("⛰️ ARAKU MOUNTAIN TUNNEL", "EAST GATE • 2 TRACKS", true);
    tunSignSE.position.set(0, 16.5, 0);
    tunGroupSE.add(mSETop, mSESideS, mSESideN, tunSignSE);
    rg.add(tunGroupSE);

    // 4c. 🚉 SECOND OPPOSITE-SIDE GRAND 2-PLATFORM RAILWAY STATION ("ARAKU SOUTH JN" on South Side!)
    this.railwaySouthZ = railRMid;
    const southT1 = findNearestT(track1Curve, 0, railRInner);
    const southT2 = findNearestT(track2Curve, 0, railROuter);

    const stSouth = new THREE.Group();
    stSouth.position.set(0, 0, railRMid);

    // Platform 1 (City/North Side at local z = -5.0, next to Track 1 at local z = -1.9)
    const spf1 = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.9, 4.6), this.mat.concrete);
    spf1.position.set(0, 0.45, -5.0);
    const spf1Edge = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.08, 0.36), this.mat.trainYellow);
    spf1Edge.position.set(0, 0.92, -2.85);
    const spf1Roof = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.28, 4.8), this.mat.stationRoof);
    spf1Roof.position.set(-2, 4.5, -5.0);

    // Platform 2 (Mountain/South Side at local z = +5.0, next to Track 2 at local z = +1.9)
    const spf2 = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.9, 4.8), this.mat.concrete);
    spf2.position.set(0, 0.45, 5.0);
    const spf2Edge = new THREE.Mesh(new THREE.BoxGeometry(36.0, 0.08, 0.36), this.mat.trainYellow);
    spf2Edge.position.set(0, 0.92, 2.75);
    const spf2Roof = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.28, 5.0), this.mat.stationRoof);
    spf2Roof.position.set(-2, 4.5, 5.0);

    for (let px = -12; px <= 8; px += 5) {
      const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 6), this.mat.wallWhite);
      c1.position.set(px, 2.7, -5.2);
      const c2 = c1.clone();
      c2.position.z = 5.2;
      const l1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.lampBulbNight);
      l1.position.set(px, 4.2, -3.8);
      l1.visible = this.timeOfDay === "night";
      const l2 = l1.clone();
      l2.position.z = 3.8;
      stSouth.add(c1, c2, l1, l2);
      nightLights.push(l1, l2);
    }

    // Yellow Station Nameboards on BOTH South Platforms
    const sIr1 = this._makeBuildingBoard("ARAKU SOUTH JN", "PLATFORM 1 • CITY SIDE", "#facc15", "#111827", 5.8, 1.25);
    sIr1.position.set(-15.0, 2.4, -4.8);
    const sIr2 = this._makeBuildingBoard("ARAKU SOUTH JN", "PLATFORM 2 • VALLEY VIEW", "#facc15", "#111827", 5.8, 1.25);
    sIr2.position.set(-15.0, 2.4, 4.8);
    stSouth.add(sIr1, sIr2);

    // Foot Overbridge with Real 8-Step Staircases connecting South Platform 1 <-> Platform 2!
    const sFobDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.34, 11.4), this.mat.concrete);
    sFobDeck.position.set(fobX, 4.65, 0);
    const sFobRailL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 11.4), this.mat.fobSteel);
    sFobRailL.position.set(fobX - 1.52, 5.35, 0);
    const sFobRailR = sFobRailL.clone();
    sFobRailR.position.x = fobX + 1.52;
    const sFobRoof = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 11.6), this.mat.stationRoof);
    sFobRoof.position.set(fobX, 6.45, 0);
    [[-1.4, 4.2], [1.4, 4.2], [-1.4, -4.2], [1.4, -4.2]].forEach(([dx, dz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.6, 6), this.mat.fobSteel);
      col.position.set(fobX + dx, 2.5, dz);
      stSouth.add(col);
    });
    for (let st = 0; st < 8; st++) {
      const sx = fobX - 1.8 - st * 0.56;
      const sy = 4.45 - st * 0.44;
      const st1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 1.85), this.mat.concrete);
      st1.position.set(sx, sy, -5.2);
      const st2 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 1.85), this.mat.concrete);
      st2.position.set(sx, sy, 5.2);
      stSouth.add(st1, st2);
    }
    const southBridgeWalker = this._createCharacter({ shirtMat: this.mat.wallMint, pantsMat: this.mat.darkPants, scale: 0.92 });
    southBridgeWalker.position.set(fobX, 4.86, 0);
    stSouth.add(sFobDeck, sFobRailL, sFobRailR, sFobRoof, southBridgeWalker);

    // Direct Road Connection + South Station Parking Plaza (between South Platform 1 & South Outer Ring Road!)
    const sParkLot = new THREE.Mesh(new THREE.BoxGeometry(28.0, 0.1, 11.6), this.mat.tarmacGrey);
    sParkLot.position.set(0, 0.05, -parkingZ);
    const sRoadIn = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, connLen + 2.5), this.mat.road);
    sRoadIn.position.set(-8.5, 0.04, -connZ);
    const sRoadOut = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.1, connLen + 2.5), this.mat.road);
    sRoadOut.position.set(8.5, 0.04, -connZ);
    const sCar1 = this._makeVehicleMesh(false, false, 0xf59e0b, false);
    sCar1.position.set(-8.4, 0.1, -12.2);
    const sAuto = this._makeRealAutoMesh(false, false);
    sAuto.position.set(7.4, 0.1, -12.2);
    const sInSign = this._makeBuildingBoard("IN ⬇", "SOUTH PARKING", "#15803d", "#ffffff", 4.6, 1.0);
    sInSign.position.set(-8.5, 2.8, -19.8);
    const sOutSign = this._makeBuildingBoard("⬆ OUT", "TO CITY ROAD", "#b91c1c", "#ffffff", 4.6, 1.0);
    sOutSign.position.set(8.5, 2.8, -19.8);
    stSouth.add(sParkLot, sRoadIn, sRoadOut, sCar1, sAuto, sInSign, sOutSign);

    // South Station Main Building + Roof Arch (Behind South Platform 2 at local z = +10.8)
    const sMain = new THREE.Mesh(new THREE.BoxGeometry(26.0, 5.4, 6.2), this.mat.stuccoIvory);
    sMain.position.set(0, 3.1, 10.8);
    const sTrim = new THREE.Mesh(new THREE.BoxGeometry(26.4, 0.45, 6.6), this.mat.stationRoof);
    sTrim.position.set(0, 5.9, 10.8);
    const sMainBoard = this._makeBuildingBoard("ARAKU SOUTH JN", "2ND RAILWAY STATION • EXPRESS", "#0f172a", "#facc15", 14.5, 1.9);
    sMainBoard.position.set(0, 5.2, 7.6);
    sMainBoard.rotation.y = Math.PI;
    const sFloatSign = this._createNameSign("🚉 ARAKU SOUTH JN", "2 PLATFORMS • MOUNTAIN EXPRESS", true);
    sFloatSign.position.set(0, 12.6, 9.8);

    // 5 Passengers on South Platform 1 + 5 Passengers on South Platform 2
    const makeSouthPax = (zPos) =>
      [this.mat.wallBlue, this.mat.wallCoral, this.mat.wallGold, this.mat.wallMint, this.mat.khakiUniform].map((sm, i) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.94 });
        p.position.set(-7.5 + i * 3.4, 0.95, zPos);
        stSouth.add(p);
        return p;
      });
    const southPaxPF1 = makeSouthPax(-4.4);
    const southPaxPF2 = makeSouthPax(4.4);

    const sHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(38, 15, 28),
      this.mat.invisibleHitbox
    );
    sHitbox.position.set(0, 7.5, -2.0);
    sHitbox.userData.plotId = "RAILWAY_SOUTH";
    stSouth.add(sHitbox);
    this.plotHitboxes.push(sHitbox);

    stSouth.add(spf1, spf1Edge, spf1Roof, spf2, spf2Edge, spf2Roof, sMain, sTrim, sMainBoard, sFloatSign);
    rg.add(stSouth);

    // 5. SPAWN 2 REALISTIC 3D TRAINS (Opposite Directions on Track 1 & Track 2!)
    // Train 1 (Blue/Yellow WAP-7 Electric Engine + 4 Passenger Coaches on Track 1)
    const train1Cars = [];
    const loco1 = this._makeTrainLocomotive(nightLights);
    rg.add(loco1);
    train1Cars.push(loco1);
    for (let c = 0; c < 4; c++) {
      const coach = this._makeTrainCoach(trainWindows);
      rg.add(coach);
      train1Cars.push(coach);
    }

    // Train 2 (White/Orange Vande Bharat Aero Express — 5 Cars on Track 2 going Opposite Direction!)
    const train2Cars = [];
    for (let c = 0; c < 5; c++) {
      const vbCar = this._makeVandeBharatCar(c === 0, c === 4, trainWindows, nightLights);
      rg.add(vbCar);
      train2Cars.push(vbCar);
    }

    this.cityGroup.add(rg);

    this.railwaySim = {
      track1Curve,
      track2Curve,
      len1,
      len2,
      stationT1,
      stationT2,
      southT1,
      southT2,
      train1Cars,
      train2Cars,
      paxPF1,
      paxPF2,
      southPaxPF1,
      southPaxPF2,
      bridgeWalker,
      southBridgeWalker,
      fobX,
      nightLights,
      trainWindows
    };
  },

  _buildHilltopTempleMountain(ringRadius) {
    const tx = 44;
    const tz = -(ringRadius + 56);
    this.hillTemplePos = { x: tx, z: tz };

    const tg = new THREE.Group();
    tg.position.set(tx, 0, tz);

    // 1. REAL MAIN-ROAD CONNECTOR & WINDING MOUNTAIN GHAT ROAD (Connects Main Outer Ring Road + Station Road!)
    //    Straight paved approach road coming from South (z = +56 -> z = +24) across the North Railway Corridor!
    const approachLen = 32;
    const approachRoad = new THREE.Mesh(this._boxGeo(6.4, 0.12, approachLen), this.mat.road);
    approachRoad.position.set(0, 0.04, 24 + approachLen / 2);
    const appDash = new THREE.Mesh(new THREE.PlaneGeometry(0.24, approachLen - 2), this.mat.stripe);
    appDash.rotation.x = -Math.PI / 2;
    appDash.position.set(0, 0.11, 24 + approachLen / 2);

    // East-West Link Road connecting directly to the North Railway Station Entrance (x = -44 -> x = 0 at z = +24)!
    const stnLink = new THREE.Mesh(this._boxGeo(46, 0.12, 6.2), this.mat.road);
    stnLink.position.set(-22, 0.04, 24);
    const stnDash = new THREE.Mesh(new THREE.PlaneGeometry(44, 0.24), this.mat.stripe);
    stnDash.rotation.x = -Math.PI / 2;
    stnDash.position.set(-22, 0.11, 24);
    tg.add(approachRoad, appDash, stnLink, stnDash);

    // 2. SPARKLING MOUNTAIN RIVER & CASCADING WATERFALL FLOWING BESIDE THE TEMPLE MOUNTAIN!
    const hillRiver = new THREE.Mesh(this._boxGeo(7.5, 0.1, 64), this.mat.riverBlue);
    hillRiver.position.set(-19, 0.05, 4);
    const hillBridge = new THREE.Mesh(this._boxGeo(10.5, 0.45, 7.2), this.mat.marble);
    hillBridge.position.set(-19, 0.32, 24);
    [-3.3, 3.3].forEach((bz) => {
      const rail = new THREE.Mesh(this._boxGeo(10.5, 0.72, 0.28), this.mat.templeGold);
      rail.position.set(-19, 0.82, 24 + bz);
      tg.add(rail);
    });
    // Waterfall tumbling down the West cliff of the Temple Mountain into the River!
    const cliffFall = new THREE.Mesh(this._boxGeo(3.6, 15.2, 1.4), this.mat.waterfallBlue);
    cliffFall.position.set(-14.5, 7.6, -2);
    cliffFall.rotation.z = 0.28;
    const fallSplash = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.8, 0.45, 12), this.mat.seaFoam);
    fallSplash.position.set(-17.8, 0.28, -2);
    tg.add(hillRiver, hillBridge, cliffFall, fallSplash);

    // 3. REAL LAYERED GREEN SACRED MOUNTAIN WITH FLAT SUMMIT PLATEAU (Height = 16.0!)
    const hillBase = new THREE.Mesh(new THREE.CylinderGeometry(19.5, 29.0, 6.0, 14), this.mat.templeHillGreen);
    hillBase.position.set(0, 3.0, -4);
    const hillMid = new THREE.Mesh(new THREE.CylinderGeometry(15.5, 20.5, 5.5, 14), this.mat.templeHillRock);
    hillMid.position.set(0, 8.5, -4);
    const hillTop = new THREE.Mesh(new THREE.CylinderGeometry(13.2, 16.2, 5.0, 14), this.mat.templeHillGreen);
    hillTop.position.set(0, 13.5, -4);
    const summitPlateau = new THREE.Mesh(new THREE.CylinderGeometry(13.8, 14.2, 0.45, 16), this.mat.marble);
    summitPlateau.position.set(0, 16.1, -4);
    tg.add(hillBase, hillMid, hillTop, summitPlateau);

    // Lush Trees around the Sacred Mountain Slopes!
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      if (Math.abs(a - Math.PI / 2) < 0.45) continue; // Keep front stairway open!
      const rad = 18.5 + (i % 3) * 3.8;
      const ty = i % 2 === 0 ? 4.8 : 9.2;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.8, 5), this.mat.treeTrunk);
      tr.position.set(Math.cos(a) * rad, ty, -4 + Math.sin(a) * rad);
      const lf = new THREE.Mesh(new THREE.ConeGeometry(1.65, 3.8, 6), this.mat.arakuDeepGreen);
      lf.position.set(Math.cos(a) * rad, ty + 2.4, -4 + Math.sin(a) * rad);
      tg.add(tr, lf);
    }

    // 4. REAL 48-STEP PILGRIMAGE STAIRWAY (Alipiri / Tirumala Style!) FROM Z = +22.5 UP TO SUMMIT Z = +7.5 (Y = 16.1)!
    const stepCount = 32;
    const stepStartZ = 22.8;
    const stepEndZ = 7.4;
    const stepTopY = 16.1;
    const stepGeo = this._boxGeo(4.8, 0.52, 0.62);
    const stepInst = new THREE.InstancedMesh(stepGeo, this.mat.templeStepStone, stepCount);
    const sdummy = new THREE.Object3D();
    for (let s = 0; s < stepCount; s++) {
      const frac = s / (stepCount - 1);
      sdummy.position.set(0, 0.28 + frac * (stepTopY - 0.35), THREE.MathUtils.lerp(stepStartZ, stepEndZ, frac));
      sdummy.updateMatrix();
      stepInst.setMatrixAt(s, sdummy.matrix);
    }
    stepInst.instanceMatrix.needsUpdate = true;
    tg.add(stepInst);

    // Side Gold-White Staircase Railings & Support Ramp
    const stairLen = Math.hypot(stepStartZ - stepEndZ, stepTopY);
    const stairPitch = Math.atan2(stepTopY, stepStartZ - stepEndZ);
    [-2.55, 2.55].forEach((rx) => {
      const rail = new THREE.Mesh(this._boxGeo(0.28, 0.9, stairLen), this.mat.templeSaffron);
      rail.position.set(rx, stepTopY / 2 + 0.55, (stepStartZ + stepEndZ) / 2);
      rail.rotation.x = stairPitch;
      const goldTop = new THREE.Mesh(this._boxGeo(0.32, 0.16, stairLen), this.mat.templeGold);
      goldTop.position.set(rx, stepTopY / 2 + 1.02, (stepStartZ + stepEndZ) / 2);
      goldTop.rotation.x = stairPitch;
      tg.add(rail, goldTop);
    });

    // Foothill Pilgrimage Entry Arch ("ALIPIRI STEPS • OM NAMO VENKATESAYA") + Mid-Hill Gopuram Gate!
    const makeStepArch = (ay, az, title, sub) => {
      const ag = new THREE.Group();
      ag.position.set(0, ay, az);
      const al = new THREE.Mesh(this._boxGeo(0.65, 4.4, 0.65), this.mat.templeGold);
      al.position.set(-2.9, 2.2, 0);
      const ar = al.clone();
      ar.position.x = 2.9;
      const top = new THREE.Mesh(this._boxGeo(6.8, 1.35, 1.05), this.mat.templeRedStripe);
      top.position.set(0, 4.6, 0);
      const brd = this._makeBuildingBoard(title, sub, "#991b1b", "#fde047", 6.2, 1.1);
      brd.position.set(0, 4.6, 0.56);
      ag.add(al, ar, top, brd);
      tg.add(ag);
    };
    makeStepArch(0.05, 23.2, "GOVINDA • STEP WAY", "SRI VENKATESWARA HILL TEMPLE");
    makeStepArch(8.0, 15.2, "OM NAMO VENKATESAYA", "HALFWAY DARSHAN GATE");

    // 10 ANIMATED DEVOTEES CLIMBING UP & WALKING DOWN THE MOUNTAIN STEPS!
    const devotees = [];
    const devMats = [this.mat.templeSaffron, this.mat.wallWhite, this.mat.girlDressPink, this.mat.girlDressYellow, this.mat.wallBlue];
    for (let d = 0; d < 10; d++) {
      const dev = this._createCharacter({ shirtMat: devMats[d % devMats.length], pantsMat: this.mat.wallWhite, scale: 0.9 });
      tg.add(dev);
      devotees.push({
        mesh: dev,
        goingUp: d % 2 === 0,
        laneX: d % 2 === 0 ? -1.1 + (d % 3) * 0.35 : 1.1 - (d % 3) * 0.35,
        phase: d * 0.1,
        speed: 0.055 + (d % 3) * 0.012
      });
    }

    // 5. WINDING MOUNTAIN GHAT ROAD FOR VEHICLES (Right Side curving smoothly from Foothills -> Summit Ghat Dropoff!)
    const ghatPts = [
      new THREE.Vector3(0, 0.2, 54),
      new THREE.Vector3(0, 0.2, 26),
      new THREE.Vector3(16, 2.0, 22),
      new THREE.Vector3(24, 6.2, 6),
      new THREE.Vector3(22, 11.2, -14),
      new THREE.Vector3(12, 15.8, -16),
      new THREE.Vector3(11.5, 16.3, -4)
    ];
    const ghatCurve = new THREE.CatmullRomCurve3(ghatPts, false, "catmullrom", 0.4);
    // Render paved Ghat Road ribbon using clean segments along the spline!
    const ghatSegs = 28;
    const ghatBox = this._boxGeo(4.6, 0.32, 3.8);
    const ghatInst = new THREE.InstancedMesh(ghatBox, this.mat.road, ghatSegs);
    const gdummy = new THREE.Object3D();
    for (let i = 0; i < ghatSegs; i++) {
      const u = (i + 0.5) / ghatSegs;
      const pt = ghatCurve.getPointAt(u);
      const nxt = ghatCurve.getPointAt(Math.min(1, u + 0.02));
      gdummy.position.copy(pt);
      gdummy.lookAt(nxt);
      gdummy.updateMatrix();
      ghatInst.setMatrixAt(i, gdummy.matrix);
    }
    ghatInst.instanceMatrix.needsUpdate = true;
    tg.add(ghatInst);

    // 3 LIVE PILGRIM VEHICLES (APSRTC Tirumala Ghat Bus, Car & Yellow Auto) climbing & descending the Mountain Ghat Road!
    const ghatVehicles = [
      { mesh: this._makeVehicleMesh(true, false, 0xdc2626, true), phase: 0.0, speed: 0.048 },
      { mesh: this._makeVehicleMesh(false, false, 0xf8fafc, true), phase: 0.34, speed: 0.062 },
      { mesh: this._makeRealAutoMesh(true, true), phase: 0.68, speed: 0.056 }
    ];
    ghatVehicles.forEach((gv) => tg.add(gv.mesh));

    // 6. 🛕 BIG REAL-STYLE GRAND TEMPLE ON THE SUMMIT (Y = 16.3, Z = -4)!
    const summitTemple = new THREE.Group();
    summitTemple.position.set(0, 16.3, -4);

    // Outer Red-and-White Striped Prakaram Compound Walls
    const pWallL = new THREE.Mesh(this._boxGeo(0.65, 2.8, 17.6), this.mat.wallWhite);
    pWallL.position.set(-9.2, 1.4, 0);
    const pWallR = pWallL.clone();
    pWallR.position.x = 9.2;
    const pWallB = new THREE.Mesh(this._boxGeo(19.0, 2.8, 0.65), this.mat.wallWhite);
    pWallB.position.set(0, 1.4, -8.8);
    for (let s = -7.2; s <= 7.2; s += 2.4) {
      const rsL = new THREE.Mesh(this._boxGeo(0.72, 2.75, 0.45), this.mat.templeRedStripe);
      rsL.position.set(-9.2, 1.4, s);
      const rsR = rsL.clone();
      rsR.position.x = 9.2;
      summitTemple.add(rsL, rsR);
    }

    // Grand Pillared Maha Mandapam + Garbhagriha Sanctum
    const mandapam = new THREE.Mesh(this._boxGeo(11.6, 4.4, 9.4), this.mat.wallWhite);
    mandapam.position.set(0, 2.2, -2.8);
    for (let px = -5.2; px <= 5.2; px += 2.6) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 4.3, 8), this.mat.templeGold);
      pillar.position.set(px, 2.2, 2.2);
      summitTemple.add(pillar);
    }

    // Towering 4-Tier Golden ANANDA NILAYAM VIMANA GOPURAM + Shikhara Dome + 3 Golden Kalasams!
    const vT1 = new THREE.Mesh(this._boxGeo(9.4, 1.8, 7.8), this.mat.templeGold);
    vT1.position.set(0, 5.2, -3.2);
    const vT2 = new THREE.Mesh(this._boxGeo(7.4, 1.65, 6.2), this.mat.templeGold);
    vT2.position.set(0, 6.9, -3.2);
    const vT3 = new THREE.Mesh(this._boxGeo(5.4, 1.5, 4.6), this.mat.templeGold);
    vT3.position.set(0, 8.45, -3.2);
    const vT4 = new THREE.Mesh(this._boxGeo(3.6, 1.3, 3.2), this.mat.templeGold);
    vT4.position.set(0, 9.8, -3.2);
    const vDome = new THREE.Mesh(new THREE.SphereGeometry(2.35, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.templeGold);
    vDome.position.set(0, 10.4, -3.2);
    const vKalasam = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.65, 8), this.mat.templeGold);
    vKalasam.position.set(0, 13.4, -3.2);

    // Towering Front 5-Tier RAJA GOPURAM Entrance Gate facing the Pilgrimage Steps!
    const rgBase = new THREE.Mesh(this._boxGeo(8.2, 4.4, 2.4), this.mat.wallWhite);
    rgBase.position.set(0, 2.2, 7.6);
    const rgDoor = new THREE.Mesh(this._boxGeo(3.2, 3.2, 2.55), this.mat.cinemaObsidian);
    rgDoor.position.set(0, 1.6, 7.6);
    const rgT1 = new THREE.Mesh(this._boxGeo(7.2, 1.4, 2.0), this.mat.templeSaffron);
    rgT1.position.set(0, 5.05, 7.6);
    const rgT2 = new THREE.Mesh(this._boxGeo(5.8, 1.3, 1.7), this.mat.templeGold);
    rgT2.position.set(0, 6.35, 7.6);
    const rgT3 = new THREE.Mesh(this._boxGeo(4.4, 1.2, 1.4), this.mat.templeSaffron);
    rgT3.position.set(0, 7.55, 7.6);
    const rgCrown = new THREE.Mesh(this._boxGeo(3.6, 0.9, 1.2), this.mat.templeGold);
    rgCrown.position.set(0, 8.55, 7.6);
    [-1.4, 0, 1.4].forEach((kx) => {
      const gk = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.95, 6), this.mat.templeGold);
      gk.position.set(kx, 9.4, 7.6);
      summitTemple.add(gk);
    });

    // Sacred Glowing White-and-Red TIRUNAMAM on Front Raja Gopuram + Tall Golden Dwajasthambam Flag Pillar!
    const tNamL = new THREE.Mesh(this._boxGeo(0.3, 1.35, 0.16), this.mat.wallWhite);
    tNamL.position.set(-0.55, 5.2, 8.7);
    const tNamR = tNamL.clone();
    tNamR.position.x = 0.55;
    const tNamB = new THREE.Mesh(this._boxGeo(1.4, 0.3, 0.16), this.mat.wallWhite);
    tNamB.position.set(0, 4.6, 8.7);
    const tNamC = new THREE.Mesh(this._boxGeo(0.28, 1.25, 0.18), this.mat.oyoRed);
    tNamC.position.set(0, 5.25, 8.74);

    const dwaja = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 8.2, 8), this.mat.templeGold);
    dwaja.position.set(0, 4.1, 4.2);

    // 6 Glowing Brass Temple Deepam Lamps lining the Courtyard!
    [[-4.2, 4.5], [4.2, 4.5], [-4.2, 9.4], [4.2, 9.4], [-6.8, -1.0], [6.8, -1.0]].forEach(([lx, lz]) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 1.5, 6), this.mat.templeGold);
      stand.position.set(lx, 0.75, lz);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.24, 6, 6), this.mat.templeLampGlow);
      flame.position.set(lx, 1.65, lz);
      summitTemple.add(stand, flame);
    });

    // 7. ✨ RADIANT DIVINE GOLDEN GLOWING EFFECTS FROM THE GRAND TEMPLE!
    //    (Rotating Golden Sun-Halo Mandala behind the Vimana + Upward Divine Sky Light Beams + Pulsing Aura Dome!)
    const divineHalo = new THREE.Group();
    divineHalo.position.set(0, 11.4, -3.2);
    const haloRing = new THREE.Mesh(new THREE.RingGeometry(3.4, 4.8, 24), this.mat.divineHaloGlow);
    divineHalo.add(haloRing);
    for (let r = 0; r < 12; r++) {
      const ra = (r / 12) * Math.PI * 2;
      const ray = new THREE.Mesh(this._boxGeo(0.32, 3.6, 0.1), this.mat.divineGoldGlow);
      ray.position.set(Math.cos(ra) * 5.6, Math.sin(ra) * 5.6, 0);
      ray.rotation.z = ra - Math.PI / 2;
      divineHalo.add(ray);
    }

    // Tall Upward Golden Divine Sky Pillar Beam radiating from the Golden Kalasam high into the sky!
    const divineBeamGeo = new THREE.CylinderGeometry(5.2, 1.2, 36.0, 14, 1, true);
    divineBeamGeo.translate(0, 18.0, 0);
    const divineSkyBeam = new THREE.Mesh(divineBeamGeo, this.mat.divineGoldGlow);
    divineSkyBeam.position.set(0, 11.5, -3.2);

    // Pulsing Golden Divine Energy Dome enveloping the Golden Gopuram!
    const divineAuraSphere = new THREE.Mesh(new THREE.SphereGeometry(6.8, 16, 12), this.mat.divineGoldGlow);
    divineAuraSphere.position.set(0, 8.6, -3.2);

    // Warm Golden PointLight illuminating the Summit Temple on non-low-RAM / Admin HQ!
    if (!this.isLowRam) {
      const templeGlowLight = new THREE.PointLight(0xfde047, 3.2, 42);
      templeGlowLight.position.set(0, 12.5, 2.0);
      summitTemple.add(templeGlowLight);
    }

    const summitSign = this._createNameSign("🛕 SRI VENKATESWARA HILL TEMPLE", "OM NAMO VENKATESAYA • STEP WAY & GHAT ROAD", true);
    summitSign.position.set(0, 17.5, -3.2);

    summitTemple.add(
      pWallL, pWallR, pWallB, mandapam,
      vT1, vT2, vT3, vT4, vDome, vKalasam,
      rgBase, rgDoor, rgT1, rgT2, rgT3, rgCrown,
      tNamL, tNamR, tNamB, tNamC, dwaja,
      divineHalo, divineSkyBeam, divineAuraSphere, summitSign
    );
    tg.add(summitTemple);

    // Clickable Hitbox for the Entire Hilltop Temple Mountain
    const htHitbox = new THREE.Mesh(this._boxGeo(44, 34, 48), this.mat.invisibleHitbox);
    htHitbox.position.set(0, 17, 0);
    htHitbox.userData.plotId = "HILL_TEMPLE";
    tg.add(htHitbox);
    this.plotHitboxes.push(htHitbox);

    this.cityGroup.add(tg);
    this.hillTempleSim = {
      devotees,
      stepStartZ,
      stepEndZ,
      stepTopY,
      ghatCurve,
      ghatVehicles,
      divineHalo,
      divineSkyBeam,
      divineAuraSphere
    };
  },

  _makeSheruMansionPlaque() {
    const key = "SHERU_MANSION_PLAQUE_V35";
    let mat = this.signTexCache.get(key);
    if (!mat) {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 440;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#0b0f19";
      ctx.fillRect(0, 0, 512, 440);
      ctx.strokeStyle = "rgba(250,204,21,0.24)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 90, 0);
        ctx.bezierCurveTo(i * 70 + 60, 150, i * 110 - 40, 300, i * 80 + 120, 440);
        ctx.stroke();
      }
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, 492, 420);
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(196, 108); ctx.lineTo(186, 56); ctx.lineTo(222, 82); ctx.lineTo(256, 38);
      ctx.lineTo(290, 82); ctx.lineTo(326, 56); ctx.lineTo(316, 108); ctx.closePath();
      ctx.fill();
      ctx.fillRect(194, 114, 124, 12);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fde047";
      ctx.font = "900 66px Georgia, serif";
      ctx.strokeStyle = "#713f12";
      ctx.lineWidth = 4;
      ctx.strokeText("SHERU BHAI", 256, 186, 460);
      ctx.fillText("SHERU BHAI", 256, 186, 460);
      ctx.beginPath();
      ctx.arc(256, 316, 76, 0, Math.PI * 2);
      ctx.fillStyle = "#ca8a04";
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#fef08a";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(256, 316, 58, 0, Math.PI * 2);
      ctx.fillStyle = "#09090b";
      ctx.fill();
      ctx.font = "72px sans-serif";
      ctx.fillText("🦁", 256, 322);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = this.maxAnisotropy || 4;
      mat = new THREE.MeshBasicMaterial({ map: tex });
      this.signTexCache.set(key, mat);
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(7.6, 5.4), mat);
  },

  _buildSeaBridgeAndVipIsland(ringRadius) {
    const bx = this.beachX || -(ringRadius + 76);
    const bridgeZ = -2;
    const bridgeStartX = bx + 11.5;
    const bridgeEndX = bx - 98.0;
    const bridgeLen = bridgeStartX - bridgeEndX;
    const islandX = bridgeEndX - 24.0;
    this.vipIslandPos = { x: islandX, z: bridgeZ };

    const sg = new THREE.Group();
    const rgbCables = [];
    const bridgeLights = [];

    const segs = 18;
    const segLen = bridgeLen / segs;
    const getBridgeY = (worldX) => {
      const u = THREE.MathUtils.clamp((bridgeStartX - worldX) / bridgeLen, 0, 1);
      return 0.25 + u * 1.55 + Math.sin(u * Math.PI) * 4.8;
    };
    this._getSeaBridgeY = getBridgeY;
    this._seaBridgeBounds = { minX: bridgeEndX - 4, maxX: bridgeStartX + 2, z: bridgeZ, halfW: 4.5 };

    for (let i = 0; i < segs; i++) {
      const x1 = bridgeStartX - i * segLen;
      const x2 = bridgeStartX - (i + 1) * segLen;
      const cx = (x1 + x2) / 2;
      const y1 = getBridgeY(x1);
      const y2 = getBridgeY(x2);
      const cy = (y1 + y2) / 2;
      const pitch = Math.atan2(y2 - y1, segLen);

      const deck = new THREE.Mesh(this._boxGeo(segLen + 0.35, 0.52, 7.6), this.mat.bridgeDeckAsphalt);
      deck.position.set(cx, cy, bridgeZ);
      deck.rotation.z = -pitch;

      const dash = new THREE.Mesh(this._boxGeo(segLen * 0.65, 0.08, 0.22), this.mat.stripe);
      dash.position.set(cx, cy + 0.28, bridgeZ);
      dash.rotation.z = -pitch;

      const railMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x22d3ee : 0xec4899 });
      const railN = new THREE.Mesh(this._boxGeo(segLen + 0.2, 0.36, 0.24), railMat);
      railN.position.set(cx, cy + 0.55, bridgeZ - 3.65);
      railN.rotation.z = -pitch;
      const railS = railN.clone();
      railS.position.z = bridgeZ + 3.65;
      bridgeLights.push(railMat);
      sg.add(deck, dash, railN, railS);
    }

    const pylonXs = [bridgeStartX - bridgeLen * 0.32, bridgeStartX - bridgeLen * 0.68];
    const cablePalette = [0x22d3ee, 0xec4899, 0xfacc15, 0xa855f7, 0x38bdf8, 0x4ade80];

    pylonXs.forEach((px, pIdx) => {
      const baseDeckY = getBridgeY(px);
      const topY = baseDeckY + 21.5;

      const pier = new THREE.Mesh(this._boxGeo(4.8, baseDeckY + 1.2, 10.2), this.mat.concrete);
      pier.position.set(px, (baseDeckY - 0.6) / 2, bridgeZ);
      const legN = new THREE.Mesh(this._boxGeo(1.6, 23.0, 1.6), this.mat.bridgePylonWhite);
      legN.position.set(px, baseDeckY + 10.5, bridgeZ - 2.6);
      legN.rotation.x = 0.14;
      const legS = new THREE.Mesh(this._boxGeo(1.6, 23.0, 1.6), this.mat.bridgePylonWhite);
      legS.position.set(px, baseDeckY + 10.5, bridgeZ + 2.6);
      legS.rotation.x = -0.14;
      const crossBeam = new THREE.Mesh(this._boxGeo(1.7, 1.3, 6.2), this.mat.bridgePylonWhite);
      crossBeam.position.set(px, baseDeckY + 13.5, bridgeZ);
      const crownCap = new THREE.Mesh(this._boxGeo(2.2, 1.4, 2.4), this.mat.richGoldTrim);
      crownCap.position.set(px, topY + 0.5, bridgeZ);
      sg.add(pier, legN, legS, crossBeam, crownCap);

      for (const side of [-1, 1]) {
        for (let c = 1; c <= 3; c++) {
          const anchorX = px + side * (c * 8.2);
          const anchorY = getBridgeY(anchorX) + 0.4;
          const anchorTopY = topY - c * 2.1;
          for (const zSide of [-3.5, 3.5]) {
            const pA = new THREE.Vector3(px, anchorTopY, bridgeZ + zSide * 0.25);
            const pB = new THREE.Vector3(anchorX, anchorY, bridgeZ + zSide);
            const dist = pA.distanceTo(pB);
            const cMat = new THREE.MeshBasicMaterial({ color: cablePalette[(c + pIdx) % cablePalette.length] });
            const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, dist, 5), cMat);
            cable.position.copy(pA).add(pB).multiplyScalar(0.5);
            cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(pB, pA).normalize());
            sg.add(cable);
            rgbCables.push({ mat: cMat, idx: c + pIdx * 3 });
          }
        }
      }
    });

    const brSign = this._makeBuildingBoard("SHERU BHAI SEA LINK", "RGB BRIDGE • VIP PRIVATE ISLAND", "#020617", "#22d3ee", 9.2, 1.3);
    brSign.rotation.y = Math.PI / 2;
    brSign.position.set(bridgeStartX - 3.5, getBridgeY(bridgeStartX - 3.5) + 5.2, bridgeZ);
    [-3.7, 3.7].forEach((sz) => {
      const p = new THREE.Mesh(this._boxGeo(0.45, 5.4, 0.45), this.mat.bridgePylonWhite);
      p.position.set(bridgeStartX - 3.5, getBridgeY(bridgeStartX - 3.5) + 2.7, bridgeZ + sz);
      sg.add(p);
    });
    sg.add(brSign);

    // 3. 👑 SHERU BHAI ROYAL ISLAND MANSION (Exact Textured Remake Matching Reference Palace!)
    const isl = new THREE.Group();
    isl.position.set(islandX, 0, bridgeZ);

    const sandRing = new THREE.Mesh(new THREE.CylinderGeometry(28.0, 33.5, 1.5, 22), this.mat.beachSand);
    sandRing.position.y = 0.75;
    const lushTop = new THREE.Mesh(new THREE.CylinderGeometry(24.5, 26.8, 0.7, 20), this.mat.turf);
    lushTop.position.y = 1.7;
    const courtyard = new THREE.Mesh(this._boxGeo(34.0, 0.24, 34.0), this.mat.mansionCreamMarble);
    courtyard.position.set(2.0, 2.02, 0);
    const islandRoad = new THREE.Mesh(this._boxGeo(14.0, 0.2, 7.6), this.mat.road);
    islandRoad.position.set(21.5, 2.0, 0);
    isl.add(sandRing, lushTop, courtyard, islandRoad);

    const pal = new THREE.Group();
    pal.position.set(-7.2, 2.15, 0);

    const stepBase = new THREE.Mesh(this._boxGeo(14.6, 0.48, 25.6), this.mat.mansionCreamMarble);
    stepBase.position.set(0.5, 0.24, 0);
    pal.add(stepBase);

    // Center Black-and-Gold Veined Marble Gable Tower + Crown + "SHERU BHAI" + Lion Crest Plaque!
    const centerBody = new THREE.Mesh(this._boxGeo(9.2, 9.6, 9.4), this.mat.mansionBlackMarble);
    centerBody.position.set(-0.6, 5.2, 0);
    const gablePeak = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 6.2, 3.2, 4), this.mat.mansionBlackMarble);
    gablePeak.scale.set(1.05, 1.0, 1.15);
    gablePeak.rotation.y = Math.PI / 4;
    gablePeak.position.set(-0.6, 11.4, 0);
    const trimL = new THREE.Mesh(this._boxGeo(0.32, 0.3, 5.8), this.mat.mansionGoldTrim);
    trimL.position.set(4.18, 10.6, -2.25);
    trimL.rotation.x = 0.46;
    const trimR = trimL.clone();
    trimR.position.z = 2.25;
    trimR.rotation.x = -0.46;

    const plaqueBoard = this._makeSheruMansionPlaque();
    plaqueBoard.rotation.y = Math.PI / 2;
    plaqueBoard.position.set(4.12, 7.65, 0);

    [-5.35, 5.35].forEach((lz) => {
      const latBack = new THREE.Mesh(this._boxGeo(1.6, 7.8, 1.4), this.mat.mansionBlackMarble);
      latBack.position.set(2.9, 4.3, lz);
      const latGold = new THREE.Mesh(this._boxGeo(0.22, 7.2, 1.1), this.mat.mansionGoldTrim);
      latGold.position.set(3.76, 4.3, lz);
      const latGlow = new THREE.Mesh(this._boxGeo(0.12, 6.6, 0.45), this.mat.mansionWarmGlow);
      latGlow.position.set(3.84, 4.3, lz);
      pal.add(latBack, latGold, latGlow);
    });

    const porticoRoof = new THREE.Mesh(this._boxGeo(3.2, 0.48, 7.4), this.mat.mansionRoofDark);
    porticoRoof.position.set(5.2, 4.85, 0);
    const porticoGold = new THREE.Mesh(this._boxGeo(3.35, 0.16, 7.55), this.mat.mansionGoldTrim);
    porticoGold.position.set(5.2, 4.58, 0);
    [-3.1, 3.1].forEach((pz) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 4.4, 10), this.mat.mansionCreamMarble);
      col.position.set(6.2, 2.45, pz);
      const cap = new THREE.Mesh(this._boxGeo(0.85, 0.32, 0.85), this.mat.mansionGoldTrim);
      cap.position.set(6.2, 4.48, pz);
      pal.add(col, cap);
    });
    const doorGlowBack = new THREE.Mesh(this._boxGeo(0.2, 4.1, 4.4), this.mat.mansionWarmGlow);
    doorGlowBack.position.set(4.06, 2.5, 0);
    const archTopGold = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.18, 6, 16, Math.PI), this.mat.mansionGoldTrim);
    archTopGold.rotation.y = Math.PI / 2;
    archTopGold.position.set(4.16, 2.7, 0);

    // Symmetrical Left & Right 2-Story Cream-Marble Luxury Palace Wings + Glass Balconies + Tiled Hipped Roofs!
    [-9.2, 9.2].forEach((wz) => {
      const wingBody = new THREE.Mesh(this._boxGeo(8.8, 7.6, 7.4), this.mat.mansionCreamMarble);
      wingBody.position.set(-0.6, 4.2, wz);
      const wGlow1 = new THREE.Mesh(this._boxGeo(0.18, 2.8, 4.8), this.mat.mansionWarmGlow);
      wGlow1.position.set(3.86, 2.0, wz);
      const wGlow2 = new THREE.Mesh(this._boxGeo(0.18, 2.6, 4.8), this.mat.mansionWarmGlow);
      wGlow2.position.set(3.86, 5.8, wz);
      const balcSlab = new THREE.Mesh(this._boxGeo(2.8, 0.3, 7.8), this.mat.mansionCreamMarble);
      balcSlab.position.set(4.8, 4.2, wz);
      const balcGlass = new THREE.Mesh(this._boxGeo(0.14, 0.95, 7.6), this.mat.glass);
      balcGlass.position.set(6.1, 4.8, wz);
      [wz - 3.3, wz + 3.3].forEach((cz) => {
        const wCol = new THREE.Mesh(this._boxGeo(0.65, 7.6, 0.65), this.mat.mansionCreamMarble);
        wCol.position.set(5.4, 4.2, cz);
        pal.add(wCol);
      });
      const wRoof = new THREE.Mesh(new THREE.ConeGeometry(6.6, 2.4, 4), this.mat.mansionRoofDark);
      wRoof.rotation.y = Math.PI / 4;
      wRoof.position.set(0.4, 9.2, wz);
      const wTrim = new THREE.Mesh(this._boxGeo(10.6, 0.24, 8.2), this.mat.mansionGoldTrim);
      wTrim.position.set(0.4, 8.05, wz);
      pal.add(wingBody, wGlow1, wGlow2, balcSlab, balcGlass, wRoof, wTrim);
    });

    pal.add(centerBody, gablePeak, trimL, trimR, plaqueBoard, porticoRoof, porticoGold, doorGlowBack, archTopGold);
    isl.add(pal);

    // Front Circular 3-Tier Glowing Turquoise Fountain + Green Hedge Ring + Flower Beds!
    const ftn = new THREE.Group();
    ftn.position.set(6.2, 2.18, 0);
    const hedgeRing = new THREE.Mesh(new THREE.TorusGeometry(5.1, 0.65, 8, 24), this.mat.mansionHedge);
    hedgeRing.rotation.x = Math.PI / 2;
    hedgeRing.position.y = 0.42;
    const poolWall = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.72, 20), this.mat.mansionCreamMarble);
    poolWall.position.y = 0.36;
    const poolWater = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.1, 0.76, 18), this.mat.poolTileBlue);
    poolWater.position.y = 0.38;
    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.2, 0.65, 14), this.mat.marble);
    t1.position.y = 1.25;
    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.75, 0.55, 12), this.mat.marble);
    t2.position.y = 2.25;
    const t3 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.35, 0.45, 10), this.mat.marble);
    t3.position.y = 3.1;
    const fJet = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.85, 3.6, 10), this.mat.water);
    fJet.position.y = 2.3;
    ftn.add(hedgeRing, poolWall, poolWater, t1, t2, t3, fJet);
    isl.add(ftn);

    [-11.5, 11.5].forEach((fz) => {
      const bed = new THREE.Mesh(this._boxGeo(10.5, 0.38, 2.6), this.mat.mansionHedge);
      bed.position.set(7.5, 2.34, fz);
      const fl1 = new THREE.Mesh(this._boxGeo(9.2, 0.28, 1.4), this.mat.oyoRed);
      fl1.position.set(7.5, 2.64, fz);
      const fl2 = new THREE.Mesh(this._boxGeo(6.4, 0.32, 0.85), this.mat.petrolYellow);
      fl2.position.set(7.5, 2.72, fz);
      isl.add(bed, fl1, fl2);
    });

    // Iconic Trio: White Lion Sheru Bhai in White-Gold Suit + 2 Black-Suited Sunglass Ram Bodyguards!
    const makeRamGuard = (gz) => {
      const rg = new THREE.Group();
      rg.position.set(12.2, 2.18, gz);
      rg.rotation.y = Math.PI / 2;
      const legL = new THREE.Mesh(this._boxGeo(0.36, 1.35, 0.36), this.mat.ramSuitBlack);
      legL.position.set(-0.24, 0.68, 0);
      const legR = legL.clone();
      legR.position.x = 0.24;
      const torso = new THREE.Mesh(this._boxGeo(1.02, 1.25, 0.52), this.mat.ramSuitBlack);
      torso.position.y = 1.98;
      const shirtV = new THREE.Mesh(this._boxGeo(0.28, 0.72, 0.54), this.mat.wallWhite);
      shirtV.position.set(0, 2.12, 0.02);
      const tie = new THREE.Mesh(this._boxGeo(0.11, 0.62, 0.56), this.mat.ramSuitBlack);
      tie.position.set(0, 2.08, 0.03);
      const armL = new THREE.Mesh(this._boxGeo(0.28, 1.08, 0.32), this.mat.ramSuitBlack);
      armL.position.set(-0.64, 1.95, 0.14);
      armL.rotation.z = 0.16;
      const armR = armL.clone();
      armR.position.x = 0.64;
      armR.rotation.z = -0.16;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 10), this.mat.wallCream);
      head.position.y = 3.0;
      const shades = new THREE.Mesh(this._boxGeo(0.64, 0.18, 0.16), this.mat.sunglasses);
      shades.position.set(0, 3.05, 0.38);
      const hornGeo = new THREE.TorusGeometry(0.38, 0.11, 6, 12, Math.PI * 1.4);
      const hornL = new THREE.Mesh(hornGeo, this.mat.ramHornBrown);
      hornL.position.set(-0.46, 3.16, -0.05);
      hornL.rotation.y = Math.PI / 2;
      const hornR = hornL.clone();
      hornR.position.x = 0.46;
      rg.add(legL, legR, torso, shirtV, tie, armL, armR, head, shades, hornL, hornR);
      return rg;
    };

    const bossLion = new THREE.Group();
    bossLion.position.set(13.2, 2.18, 0);
    bossLion.rotation.y = Math.PI / 2;
    const bLegL = new THREE.Mesh(this._boxGeo(0.38, 1.45, 0.38), this.mat.mansionCreamMarble);
    bLegL.position.set(-0.24, 0.72, 0);
    const bLegR = bLegL.clone();
    bLegR.position.x = 0.24;
    const bTorso = new THREE.Mesh(this._boxGeo(1.12, 1.38, 0.56), this.mat.marble);
    bTorso.position.y = 2.12;
    const bGoldTrim = new THREE.Mesh(this._boxGeo(1.16, 0.24, 0.58), this.mat.mansionGoldTrim);
    bGoldTrim.position.y = 1.56;
    const bTie = new THREE.Mesh(this._boxGeo(0.14, 0.72, 0.6), this.mat.mansionGoldTrim);
    bTie.position.set(0, 2.24, 0.02);
    const bArmL = new THREE.Mesh(this._boxGeo(0.32, 1.1, 0.34), this.mat.marble);
    bArmL.position.set(-0.66, 2.12, 0.22);
    bArmL.rotation.x = -0.55;
    const bArmR = bArmL.clone();
    bArmR.position.x = 0.66;
    const bHead = new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 10), this.mat.marble);
    bHead.position.y = 3.25;
    const bSnout = new THREE.Mesh(this._boxGeo(0.32, 0.24, 0.3), this.mat.wallCream);
    bSnout.position.set(0, 3.16, 0.4);
    for (let m = 0; m < 10; m++) {
      const ma = (m / 10) * Math.PI * 2;
      const mt = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), this.mat.wallCream);
      mt.position.set(Math.cos(ma) * 0.52, 3.25 + Math.sin(ma) * 0.52, -0.06);
      bossLion.add(mt);
    }
    bossLion.add(bLegL, bLegR, bTorso, bGoldTrim, bTie, bArmL, bArmR, bHead, bSnout);
    this.heroMansionSheruSlot = bossLion;
    this._loadHeroGLB("mansion_sheru", this.getSheruGlbUrl(), bossLion, 4.0, 0.0, 0, "Wave", true);
    isl.add(bossLion, makeRamGuard(-3.8), makeRamGuard(3.8));

    const hPad = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.5, 0.3, 16), this.mat.tarmacGrey);
    hPad.position.set(-2.0, 2.15, -18.5);
    const hRing = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.85, 18), this.mat.petrolYellow);
    hRing.rotation.x = -Math.PI / 2;
    hRing.position.set(-2.0, 2.34, -18.5);

    const yacht = new THREE.Group();
    yacht.position.set(6, 0.4, 28);
    const yHull = new THREE.Mesh(this._boxGeo(9.2, 1.35, 3.2), this.mat.marble);
    const yDeck = new THREE.Mesh(this._boxGeo(5.8, 1.2, 2.4), this.mat.glass);
    yDeck.position.set(-0.8, 1.2, 0);
    const yTrim = new THREE.Mesh(this._boxGeo(9.4, 0.2, 3.3), this.mat.richGoldTrim);
    yTrim.position.y = 0.65;
    yacht.add(yHull, yDeck, yTrim);

    for (let p = 0; p < 10; p++) {
      const pa = (p / 10) * Math.PI * 2;
      if (Math.abs(pa) < 0.35) continue;
      const px = Math.cos(pa) * 21.8;
      const pz = Math.sin(pa) * 21.8;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 5.6, 5), this.mat.treeTrunk);
      tr.position.set(px, 4.6, pz);
      const lf = new THREE.Mesh(new THREE.DodecahedronGeometry(1.95, 0), this.mat.treeLeaf);
      lf.position.set(px, 7.6, pz);
      isl.add(tr, lf);
    }

    const cleanIslOwner = (this.islandOwner || "SHERU BHAI").trim();
    const islSign = this._createNameSign(`👑 SHERU BHAI ROYAL MANSION`, `🏝️ ${cleanIslOwner} • PRIVATE OCEAN PALACE`, true);
    islSign.position.set(-7.2, 16.5, 0);

    const islHit = new THREE.Mesh(this._boxGeo(52, 24, 52), this.mat.invisibleHitbox);
    islHit.position.set(0, 11, 0);
    islHit.userData.plotId = "VIP_ISLAND";
    this.plotHitboxes.push(islHit);

    isl.add(hPad, hRing, yacht, islSign, islHit);
    sg.add(isl);
    this.cityGroup.add(sg);

    this.seaBridgeSim = { rgbCables, bridgeLights, yacht, mansionFountain: fJet };
  },

  _buildBeachFerrisWheel(ringRadius) {
    const bx = this.beachX || -(ringRadius + 76);
    const fx = bx + 8;
    const fz = 44;
    this.ferrisWheelPos = { x: fx, z: fz };

    const fg = new THREE.Group();
    fg.position.set(fx, 0, fz);

    const plaza = new THREE.Mesh(this._boxGeo(20.0, 0.24, 18.0), this.mat.marble);
    plaza.position.y = 0.16;
    const gateL = new THREE.Mesh(this._boxGeo(0.55, 4.4, 0.55), this.mat.icePink);
    gateL.position.set(9.6, 2.3, -3.5);
    const gateR = gateL.clone();
    gateR.position.z = 3.5;
    const gateBoard = this._makeBuildingBoard("SHERU BHAI EYE", "GIANT FERRIS WHEEL • FUN PARK", "#831843", "#fde047", 7.8, 1.25);
    gateBoard.rotation.y = Math.PI / 2;
    gateBoard.position.set(9.6, 4.6, 0);

    const hubY = 16.5;
    const wheelR = 11.8;
    [-2.4, 2.4].forEach((lx) => {
      const legF = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 18.2, 8), this.mat.ferrisSteel);
      legF.position.set(lx, hubY / 2 + 0.4, -3.4);
      legF.rotation.x = 0.2;
      const legB = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 18.2, 8), this.mat.ferrisSteel);
      legB.position.set(lx, hubY / 2 + 0.4, 3.4);
      legB.rotation.x = -0.2;
      fg.add(legF, legB);
    });
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 5.8, 10), this.mat.richGoldTrim);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, hubY, 0);

    const wheelRotor = new THREE.Group();
    wheelRotor.position.set(0, hubY, 0);

    const rimGeo = new THREE.TorusGeometry(wheelR, 0.26, 8, 32);
    const rimL = new THREE.Mesh(rimGeo, this.mat.ferrisSteel);
    rimL.rotation.y = Math.PI / 2;
    rimL.position.x = -1.45;
    const rimR = rimL.clone();
    rimR.position.x = 1.45;

    const neonRimMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
    const neonRim = new THREE.Mesh(new THREE.TorusGeometry(wheelR - 1.1, 0.16, 6, 28), neonRimMat);
    neonRim.rotation.y = Math.PI / 2;
    wheelRotor.add(rimL, rimR, neonRim);

    const cabinMats = [this.mat.oyoRed, this.mat.mobileCyanGlow, this.mat.petrolYellow, this.mat.icePink, this.mat.turf, this.mat.girlDressPurple];
    const cabins = [];
    const cabinCount = 12;

    for (let i = 0; i < cabinCount; i++) {
      const ang = (i / cabinCount) * Math.PI * 2;
      const spoke = new THREE.Mesh(this._boxGeo(0.14, wheelR * 2, 0.14), this.mat.ferrisSteel);
      spoke.position.x = -1.45;
      spoke.rotation.x = ang;
      const spokeR = spoke.clone();
      spokeR.position.x = 1.45;
      wheelRotor.add(spoke, spokeR);

      const cabPivot = new THREE.Group();
      cabPivot.position.set(0, Math.sin(ang) * wheelR, Math.cos(ang) * wheelR);
      const cabBody = new THREE.Mesh(this._boxGeo(2.2, 1.7, 1.7), cabinMats[i % cabinMats.length]);
      cabBody.position.y = -0.95;
      const cabGlass = new THREE.Mesh(this._boxGeo(2.3, 0.72, 1.4), this.mat.windowNight);
      cabGlass.position.y = -0.65;
      const cabRoof = new THREE.Mesh(this._boxGeo(2.4, 0.22, 1.9), this.mat.wallWhite);
      cabRoof.position.y = -0.05;
      cabPivot.add(cabBody, cabGlass, cabRoof);
      wheelRotor.add(cabPivot);
      cabins.push(cabPivot);
    }

    const funBooth = new THREE.Mesh(this._boxGeo(4.0, 2.6, 3.2), this.mat.icePink);
    funBooth.position.set(5.8, 1.5, -5.8);
    const funCone = new THREE.Mesh(new THREE.ConeGeometry(3.0, 1.8, 8), this.mat.petrolYellow);
    funCone.position.set(5.8, 3.6, -5.8);

    const fwSign = this._createNameSign("🎡 SHERU BHAI GIANT WHEEL", "BEACH AMUSEMENT PARK", true);
    fwSign.position.set(0, hubY + wheelR + 3.2, 0);

    const fwHit = new THREE.Mesh(this._boxGeo(20, 30, 22), this.mat.invisibleHitbox);
    fwHit.position.set(0, 15, 0);
    fwHit.userData.plotId = "FERRIS_WHEEL";
    this.plotHitboxes.push(fwHit);

    fg.add(plaza, gateL, gateR, gateBoard, axle, wheelRotor, funBooth, funCone, fwSign, fwHit);
    this.cityGroup.add(fg);

    this.ferrisWheelSim = { wheelRotor, cabins, neonRimMat };
  },

  _buildArakuLandscape(ringRadius) {
    const ag = new THREE.Group();

    const waterRibbons = [];
    const mistClouds = [];
    const riverRipples = [];

    // Outer mountain ring sits comfortably outside Airport (East), Beach (West), and Both Railway Stations (N & S)
    const minR = ringRadius + 148;
    const outerR = ringRadius + 245;

    // 1. 360° LAYERED ARAKU GREEN FORESTED MOUNTAINS (2 InstancedMeshes = only 2 draw calls!)
    //    Leave a clean scenic Ocean Horizon opening on the West Beach side (angle between 158° and 202°)
    //    while framing the Beach with dramatic green coastal headlands on NW & SW!
    const peakData = [];
    const rockData = [];
    const treeData = [];

    const isBlockedByLandmark = (x, z, extraR = 0) => {
      if (this.rocketPadPos && Math.hypot(x - this.rocketPadPos.x, z - this.rocketPadPos.z) < 62 + extraR) return true;
      if (this.outskirtsStadiumPos && Math.hypot(x - this.outskirtsStadiumPos.x, z - this.outskirtsStadiumPos.z) < 68 + extraR) return true;
      if (this.hillTemplePos && Math.hypot(x - this.hillTemplePos.x, z - this.hillTemplePos.z) < 52 + extraR) return true;
      return false;
    };

    // Ring 1: Closer Lush Green Foothills (42 hills)
    const countInner = this.isLowRam ? 36 : 48;
    for (let i = 0; i < countInner; i++) {
      const ang = (i / countInner) * Math.PI * 2;
      const deg = (ang * 180) / Math.PI;
      if (deg > 158 && deg < 202) continue; // Keep West Ocean open for Golden Beach!

      const rad = minR + ((i * 37) % 34);
      const px = Math.cos(ang) * rad;
      const pz = Math.sin(ang) * rad;
      const h = 32 + ((i * 19) % 28);
      const w = 26 + ((i * 13) % 20);
      if (isBlockedByLandmark(px, pz, w * 0.5)) continue;
      peakData.push({ x: px, y: h * 0.42, z: pz, sx: w, sy: h, sz: w * 0.92, ry: i * 0.7 });

      // Scatter lush Araku pine trees on lower slopes of foothills
      const treesPerHill = this.isLowRam ? 3 : 5;
      for (let t = 0; t < treesPerHill; t++) {
        const ta = ang + (t - 2) * 0.045;
        const tr = rad - w * 0.55 - (t % 2) * 6;
        const txp = Math.cos(ta) * tr;
        const tzp = Math.sin(ta) * tr;
        if (!isBlockedByLandmark(txp, tzp, 8)) {
          treeData.push({ x: txp, y: 2.2 + (t % 3) * 1.4, z: tzp, s: 1.35 + (t % 3) * 0.45 });
        }
      }
    }

    // Ring 2: Towering Araku Background Mountain Peaks & Rocky Ridges (56 massive peaks!)
    const countOuter = this.isLowRam ? 44 : 60;
    for (let i = 0; i < countOuter; i++) {
      const ang = (i / countOuter) * Math.PI * 2 + 0.05;
      const deg = (ang * 180) / Math.PI;
      if (deg > 162 && deg < 198) continue; // Open sunset ocean horizon on West!

      const rad = outerR + ((i * 43) % 68);
      const px = Math.cos(ang) * rad;
      const pz = Math.sin(ang) * rad;
      const h = 62 + ((i * 29) % 58);
      const w = 44 + ((i * 17) % 34);
      if (i % 3 === 0) {
        rockData.push({ x: px, y: h * 0.44, z: pz, sx: w, sy: h, sz: w * 0.88, ry: i * 1.1 });
      } else {
        peakData.push({ x: px, y: h * 0.44, z: pz, sx: w, sy: h, sz: w * 0.95, ry: i * 0.9 });
      }
    }

    const dummy = new THREE.Object3D();
    const hillGeo = new THREE.ConeGeometry(1.0, 1.0, 7);
    const hillInst = new THREE.InstancedMesh(hillGeo, this.mat.arakuDeepGreen, peakData.length);
    peakData.forEach((p, idx) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.rotation.set(0, p.ry, 0);
      dummy.updateMatrix();
      hillInst.setMatrixAt(idx, dummy.matrix);
    });
    hillInst.instanceMatrix.needsUpdate = true;
    ag.add(hillInst);

    const rockGeo = new THREE.DodecahedronGeometry(0.75, 0);
    const rockInst = new THREE.InstancedMesh(rockGeo, this.mat.arakuRockGrey, rockData.length);
    rockData.forEach((p, idx) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.rotation.set(0, p.ry, 0);
      dummy.updateMatrix();
      rockInst.setMatrixAt(idx, dummy.matrix);
    });
    rockInst.instanceMatrix.needsUpdate = true;
    ag.add(rockInst);

    const pineGeo = new THREE.ConeGeometry(1.7, 5.2, 5);
    const pineInst = new THREE.InstancedMesh(pineGeo, this.mat.arakuForestGreen, treeData.length);
    treeData.forEach((tr, idx) => {
      dummy.position.set(tr.x, tr.y, tr.z);
      dummy.scale.setScalar(tr.s);
      dummy.rotation.set(0, idx * 0.8, 0);
      dummy.updateMatrix();
      pineInst.setMatrixAt(idx, dummy.matrix);
    });
    pineInst.instanceMatrix.needsUpdate = true;
    ag.add(pineInst);

    // 2. 💧 3 DRAMATIC ARAKU CLIFF WATERFALLS WITH ANIMATED CASCADING WHITE WATER & SPLASH POOLS!
    const buildWaterfallCliff = (wx, wz, rotY, height = 42) => {
      const wf = new THREE.Group();
      wf.position.set(wx, 0, wz);
      wf.rotation.y = rotY;

      // Dark Wet Rocky Cliff Behind Waterfall + Lush Green Mountain Framing Both Sides
      const cliff = new THREE.Mesh(new THREE.BoxGeometry(16, height, 10), this.mat.arakuCliffDark);
      cliff.position.set(0, height / 2, -5.5);
      const flankL = new THREE.Mesh(new THREE.ConeGeometry(16, height * 1.18, 7), this.mat.arakuLushHill);
      flankL.position.set(-14, height * 0.55, -6);
      const flankR = new THREE.Mesh(new THREE.ConeGeometry(15, height * 1.12, 7), this.mat.arakuDeepGreen);
      flankR.position.set(14, height * 0.52, -6);
      wf.add(cliff, flankL, flankR);

      // Continuous Shimmering Blue Waterfall Sheet
      const chute = new THREE.Mesh(new THREE.PlaneGeometry(6.8, height - 2), this.mat.waterfallBlue);
      chute.position.set(0, height / 2, -0.35);
      wf.add(chute);

      // 5 Animated Falling White Foam Ribbons plunging continuously down the cliff!
      const ribGeo = new THREE.PlaneGeometry(1.55, 5.4);
      for (let r = 0; r < 5; r++) {
        const rib = new THREE.Mesh(ribGeo, this.mat.waterfallFoam);
        const rx = -2.2 + (r % 3) * 2.2;
        rib.position.set(rx, height * 0.5, -0.1);
        wf.add(rib);
        waterRibbons.push({ mesh: rib, minY: 2.8, maxY: height - 3.5, speed: 15 + (r % 3) * 3.5, phase: r * 0.22 });
      }

      // Turquoise Plunge Pool + Foaming Mist Ring at the Waterfall Base!
      const pool = new THREE.Mesh(new THREE.CylinderGeometry(11.5, 12.2, 0.28, 16), this.mat.riverBlue);
      pool.position.set(0, 0.14, 7.5);
      const mistFoam = new THREE.Mesh(new THREE.RingGeometry(2.5, 6.2, 16), this.mat.waterfallFoam);
      mistFoam.rotation.x = -Math.PI / 2;
      mistFoam.position.set(0, 0.34, 4.2);
      wf.add(pool, mistFoam);

      ag.add(wf);
    };

    const wfDist = ringRadius + 138;
    // Waterfall 1: North-East Araku Gorge (visible behind North Station & Airport!)
    buildWaterfallCliff(wfDist * 0.55, -wfDist * 0.88, -0.45, 48);
    // Waterfall 2: North-West Mountain Ridge (cascading right behind the Hollow Railway Tunnel!)
    buildWaterfallCliff(-wfDist * 0.65, -wfDist * 0.88, 0.55, 44);
    // Waterfall 3: South-West Coastal Mountain Cliff (flowing straight into the Ocean beside the Beach!)
    buildWaterfallCliff(-wfDist * 0.88, wfDist * 0.96, 2.35, 42);

    // 3. 🌊 WINDING FLOWING BLUE VALLEY RIVERS (Connecting Araku Waterfalls -> Flowing Around Valley -> Into West Ocean!)
    const buildValleyRiver = (pts, width = 10.5) => {
      const rCurve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.45);
      const segs = 32;
      const rGeo = new THREE.PlaneGeometry(width, (rCurve.getLength() / segs) * 1.18);
      rGeo.rotateX(-Math.PI / 2);
      const rInst = new THREE.InstancedMesh(rGeo, this.mat.riverBlue, segs);
      for (let i = 0; i < segs; i++) {
        const u = (i + 0.5) / segs;
        const p = rCurve.getPointAt(u);
        const tan = rCurve.getTangentAt(u);
        dummy.position.set(p.x, 0.06, p.z);
        dummy.rotation.set(0, Math.atan2(tan.x, tan.z), 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        rInst.setMatrixAt(i, dummy.matrix);
      }
      rInst.instanceMatrix.needsUpdate = true;
      ag.add(rInst);

      // Animated White Flowing Water Sparkles drifting along the river!
      const ripGeo = new THREE.PlaneGeometry(width * 0.38, 2.6);
      ripGeo.rotateX(-Math.PI / 2);
      for (let k = 0; k < 6; k++) {
        const rip = new THREE.Mesh(ripGeo, this.mat.waterfallFoam);
        ag.add(rip);
        riverRipples.push({ mesh: rip, curve: rCurve, phase: k / 6, speed: 0.075 });
      }
    };

    // North Valley River: Flows from NE Araku Waterfall -> behind North Railway Station -> NW Waterfall -> into West Ocean!
    const nrZ = -(ringRadius + 96);
    buildValleyRiver([
      new THREE.Vector3(wfDist * 0.52, 0, -wfDist * 0.8),
      new THREE.Vector3(45, 0, nrZ - 14),
      new THREE.Vector3(0, 0, nrZ - 18),
      new THREE.Vector3(-wfDist * 0.55, 0, -wfDist * 0.78),
      new THREE.Vector3(-(ringRadius + 115), 0, -68),
      new THREE.Vector3(-(ringRadius + 145), 0, -40)
    ], 11.0);

    // South Valley River: Flows from SE Araku Hills -> behind South Railway Station -> SW Waterfall -> into West Ocean!
    const srZ = ringRadius + 116;
    buildValleyRiver([
      new THREE.Vector3(wfDist * 0.78, 0, wfDist * 0.88),
      new THREE.Vector3(45, 0, srZ + 18),
      new THREE.Vector3(-12, 0, srZ + 22),
      new THREE.Vector3(-wfDist * 0.85, 0, wfDist * 0.92),
      new THREE.Vector3(-(ringRadius + 145), 0, 68)
    ], 10.5);

    // 4. ☁️ MISTY ARAKU VALLEY CLOUDS WRAPPING AROUND THE MOUNTAIN PEAKS (Exact Araku Drone Reel Vibe!)
    const mistPuffGeo = new THREE.DodecahedronGeometry(9.5, 0);
    const mistCount = this.isLowRam ? 12 : 18;
    for (let m = 0; m < mistCount; m++) {
      const ang = (m / mistCount) * Math.PI * 2;
      const rad = minR + 14 + (m % 3) * 28;
      const mg = new THREE.Group();
      const p1 = new THREE.Mesh(mistPuffGeo, this.mat.valleyMist);
      const p2 = new THREE.Mesh(mistPuffGeo, this.mat.valleyMist);
      p2.position.set(8.5, 0.8, 1.5);
      p2.scale.set(0.85, 0.7, 0.85);
      const p3 = new THREE.Mesh(mistPuffGeo, this.mat.valleyMist);
      p3.position.set(-8.0, -0.4, -1.2);
      p3.scale.set(0.75, 0.65, 0.8);
      mg.add(p1, p2, p3);
      mg.scale.set(1.6, 0.42, 1.25);
      const y = 34 + (m % 4) * 10;
      mg.position.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
      ag.add(mg);
      mistClouds.push({ mesh: mg, ang, rad, y, speed: 0.018 + (m % 3) * 0.008 });
    }

    this.cityGroup.add(ag);
    this.arakuSim = { waterRibbons, mistClouds, riverRipples };
  },

  _addWelcomeArch(x, z) {
    const g = new THREE.Group();
    const pGeo = new THREE.BoxGeometry(0.95, 6.4, 0.95);
    const pL = new THREE.Mesh(pGeo, this.mat.wallCream);
    pL.position.set(-4.3, 3.2, 0);
    const pR = pL.clone();
    pR.position.x = 4.3;

    const beam = new THREE.Mesh(new THREE.BoxGeometry(9.8, 1.45, 1.15), this.mat.navy);
    beam.position.set(0, 6.2, 0);
    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.25, 1.25), this.mat.petrolYellow);
    topTrim.position.set(0, 7.0, 0);

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 110;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(0, 0, 512, 110);
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 102);
    ctx.fillStyle = "#facc15";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("స్వాగతం • OUTER RING ROAD", 256, 42);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px sans-serif";
    ctx.fillText(this.townName.toUpperCase(), 256, 84);

    const tex = new THREE.CanvasTexture(canvas);
    const signMat = new THREE.MeshBasicMaterial({ map: tex });
    const frontSign = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 1.3), signMat);
    frontSign.position.set(0, 6.2, 0.6);
    const backSign = frontSign.clone();
    backSign.rotation.y = Math.PI;
    backSign.position.z = -0.6;

    g.add(pL, pR, beam, topTrim, frontSign, backSign);
    g.position.set(x, 0, z);
    this.cityGroup.add(g);
  },

  _addHighwayLamp(x, z) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 4.6, 5), this.mat.lampPole);
    pole.position.y = 2.3;
    const cross = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.1), this.mat.lampPole);
    cross.position.y = 4.5;
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.22), this.mat.lampBulbDay);
    b1.position.set(-1.05, 4.38, 0);
    const b2 = b1.clone();
    b2.position.x = 1.05;
    g.add(pole, cross, b1, b2);
    g.position.set(x, 0.1, z);
    this.cityGroup.add(g);
    this.lampBulbs.push(b1, b2);
  },

  _addStreetLamp(x, z) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 5), this.mat.lampPole);
    pole.position.y = 1.6;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), this.mat.lampPole);
    arm.position.set(0.3, 3.15, 0);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.2), this.mat.lampBulbDay);
    bulb.position.set(0.6, 3.05, 0);
    group.add(pole, arm, bulb);
    group.position.set(x, 0.08, z);
    this.cityGroup.add(group);
    this.lampBulbs.push(bulb);
  },

  _addPalmTree(x, z) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 3.2, 5), this.mat.treeTrunk);
    trunk.position.y = 1.6;
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), this.mat.treeLeaf);
    crown.position.y = 3.5;
    crown.scale.y = 0.75;
    g.add(trunk, crown);
    g.position.set(x + (Math.random() - 0.5) * 2.5, 0, z + (Math.random() - 0.5) * 2.5);
    this.cityGroup.add(g);
  },

  _spawnVehicles() {
    while (this.trafficGroup.children.length > 0) {
      this.trafficGroup.remove(this.trafficGroup.children[0]);
    }
    this.vehicles = [];
    this.ringVehicles = [];
    this.vehicleHeadlights = this.vehicleHeadlights.filter((h) => h.userData.keepOnPlot);

    const r = this.currentGridRadius;
    const roadCount = Math.min(18, (r * 2 + 2) * 2);
    const colors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981, 0xf97316, 0xf8fafc];
    const limit = (r + 0.5) * this.BLOCK_STEP;

    for (let i = 0; i < roadCount; i++) {
      const isBus = i % 5 === 0;
      const isAuto = i % 3 === 0 && !isBus;
      const car = this._makeVehicleMesh(isBus, isAuto, colors[i % colors.length], false);

      const horizontal = i % 2 === 0;
      const laneIdx = Math.floor(Math.random() * (r * 2 + 2)) - r;
      const roadCoord = (laneIdx - 0.5) * this.BLOCK_STEP;
      const dir = Math.random() > 0.5 ? 1 : -1;
      const laneOffset = dir * 0.9;

      if (horizontal) {
        car.position.set((Math.random() * 2 - 1) * limit, 0.08, roadCoord + laneOffset);
        car.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        car.position.set(roadCoord - laneOffset, 0.08, (Math.random() * 2 - 1) * limit);
        car.rotation.y = dir > 0 ? 0 : Math.PI;
      }

      this.trafficGroup.add(car);
      this.vehicles.push({ mesh: car, horizontal, dir, speed: (isBus ? 4.4 : 6.4) + Math.random() * 2.5, limit });
    }

    const rr = this.ringRadius;
    for (let i = 0; i < 12; i++) {
      const isBus = i % 4 === 0;
      const car = this._makeVehicleMesh(isBus, false, colors[(i + 2) % colors.length], false);
      const cw = i % 2 === 0;
      const lane = cw ? rr + 1.8 : rr - 1.8;
      this.trafficGroup.add(car);
      this.ringVehicles.push({
        mesh: car,
        t: (i / 12) * 4,
        cw,
        lane,
        speed: (isBus ? 9 : 13) + Math.random() * 4
      });
    }
    this.setTimeOfDay(this.timeOfDay);
  },

  _makeRealAutoMesh(keepOnPlot = true, includeSeatedPassengers = false) {
    const auto = new THREE.Group();

    // 3 Realistic Wheels (1 front center, 2 rear)
    const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.14, 10);
    const rimGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.16, 8);
    const addWheel = (x, z) => {
      const wg = new THREE.Group();
      const tire = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
      tire.rotation.z = Math.PI / 2;
      const rim = new THREE.Mesh(rimGeo, this.mat.rimSilver);
      rim.rotation.z = Math.PI / 2;
      wg.add(tire, rim);
      wg.position.set(x, 0.24, z);
      auto.add(wg);
    };
    addWheel(0, 0.85);       // Single front wheel
    addWheel(-0.52, -0.62);  // Rear left wheel
    addWheel(0.52, -0.62);   // Rear right wheel

    // Floor Chassis & Front Mudguard
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.14, 1.85), this.mat.charcoal);
    chassis.position.set(0, 0.34, 0.0);
    const mudguard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.44), this.mat.autoYellow);
    mudguard.position.set(0, 0.44, 0.88);
    auto.add(chassis, mudguard);

    // Tapered Front Nose / Shield (Yellow lower + green AP stripe)
    const noseLower = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.56, 0.46), this.mat.autoYellow);
    noseLower.position.set(0, 0.68, 0.72);
    const noseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.14, 0.48), this.mat.autoGreen);
    noseTrim.position.set(0, 0.52, 0.72);

    // Front Windshield Frame + Clear Glass
    const windFrame = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.52, 0.1), this.mat.autoYellow);
    windFrame.position.set(0, 1.18, 0.68);
    windFrame.rotation.x = -0.18;
    const windGlass = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.38, 0.12), this.mat.glass);
    windGlass.position.set(0, 1.18, 0.69);
    windGlass.rotation.x = -0.18;

    // Rear Engine Body & Back Panel (Yellow + Green stripe)
    const rearBody = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.72, 0.74), this.mat.autoYellow);
    rearBody.position.set(0, 0.76, -0.58);
    const rearStripe = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.18, 0.76), this.mat.autoGreen);
    rearStripe.position.set(0, 0.54, -0.58);

    // Rear Backrest + Side Half-Doors (Open Passenger Cabin!)
    const rearBack = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.6, 0.14), this.mat.autoYellow);
    rearBack.position.set(0, 1.16, -0.88);
    const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.42, 0.36), this.mat.charcoal);
    seatBack.position.set(0, 0.65, -0.45);
    const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.32), this.mat.charcoal);
    driverSeat.position.set(0, 0.62, 0.25);

    // 4 Thin Roof Support Pillars + Curved Dark Canvas Roof Canopy
    const pilGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.68, 5);
    [[-0.4, 0.58], [0.4, 0.58], [-0.48, -0.82], [0.48, -0.82]].forEach(([px, pz]) => {
      const pil = new THREE.Mesh(pilGeo, this.mat.charcoal);
      pil.position.set(px, 1.24, pz);
      auto.add(pil);
    });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.18, 1.62), this.mat.autoCanopy);
    canopy.position.set(0, 1.56, -0.12);
    const canopyTop = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.1, 1.44), this.mat.autoYellow);
    canopyTop.position.set(0, 1.66, -0.12);

    // Single Round Center Headlight (classic auto look!)
    const lampHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 8), this.mat.chrome);
    lampHousing.rotation.x = Math.PI / 2;
    lampHousing.position.set(0, 0.74, 0.96);

    auto.add(noseLower, noseTrim, windFrame, windGlass, rearBody, rearStripe, rearBack, seatBack, driverSeat, canopy, canopyTop, lampHousing);

    // Driver inside auto (optional toggleable passengers for live trips!)
    const driver = this._createCharacter({ shirtMat: this.mat.khakiUniform, pantsMat: this.mat.darkPants, scale: 0.68 });
    driver.position.set(0, 0.48, 0.22);
    auto.add(driver);

    if (includeSeatedPassengers) {
      const paxGroup = new THREE.Group();
      const p1 = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.darkPants, scale: 0.65 });
      p1.position.set(-0.24, 0.52, -0.42);
      const p2 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.65 });
      p2.position.set(0.24, 0.52, -0.42);
      paxGroup.add(p1, p2);
      paxGroup.visible = false;
      auto.add(paxGroup);
      auto.userData.seatedPassengers = paxGroup;
    }

    // Night Headlight + Road Beam + Rear Taillights
    const hlGroup = new THREE.Group();
    hlGroup.userData.keepOnPlot = keepOnPlot;
    const hlGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8), this.mat.lampBulbNight);
    hlGlow.rotation.x = Math.PI / 2;
    hlGlow.position.set(0, 0.74, 1.0);
    const tlGeo = new THREE.BoxGeometry(0.16, 0.12, 0.06);
    const tlL = new THREE.Mesh(tlGeo, this.mat.taillight);
    tlL.position.set(-0.38, 0.58, -0.96);
    const tlR = tlL.clone();
    tlR.position.x = 0.38;
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.8), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.09, 2.35);

    hlGroup.add(hlGlow, tlL, tlR, beam);
    hlGroup.visible = this.timeOfDay === "night";
    auto.add(hlGroup);
    this.vehicleHeadlights.push(hlGroup);

    return auto;
  },

  _makeRealBusMesh(color = 0xdc2626, keepOnPlot = true) {
    const bus = new THREE.Group();
    const len = 4.6;
    const w = 1.48;
    const h = 1.65;

    // 4 Realistic Bus Wheels (front & rear axle)
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.2, 10);
    const rimGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.22, 8);
    [[-0.72, 1.45], [0.72, 1.45], [-0.72, -1.35], [0.72, -1.35]].forEach(([wx, wz]) => {
      const tire = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wx, 0.32, wz);
      const rim = new THREE.Mesh(rimGeo, this.mat.rimSilver);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, 0.32, wz);
      bus.add(tire, rim);
    });

    // Main Lower & Upper Bus Body
    const bodyMat = this._getColorMat(color);
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(w, 0.72, len), bodyMat);
    lowerBody.position.set(0, 0.68, 0);

    const whiteStripe = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, 0.24, len + 0.02), this.mat.wallWhite);
    whiteStripe.position.set(0, 1.08, 0);

    const upperBody = new THREE.Mesh(new THREE.BoxGeometry(w, 0.78, len - 0.1), bodyMat);
    upperBody.position.set(0, 1.56, -0.02);

    // Front Windshield + Amber LED Route Destination Board
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, 0.62, 0.08), this.mat.busWindshield);
    windshield.position.set(0, 1.48, len / 2 - 0.01);
    windshield.rotation.x = -0.1;

    const ledBoard = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.16, 0.08), this.mat.busLedBoard);
    ledBoard.position.set(0, 1.84, len / 2 - 0.01);

    // Front Grille & Chrome Bumper
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.26, 0.08), this.mat.charcoal);
    grille.position.set(0, 0.68, len / 2 + 0.01);
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.18, 0.14), this.mat.chrome);
    bumper.position.set(0, 0.42, len / 2 + 0.04);

    // Side Mirrors
    [-0.84, 0.84].forEach((mx) => {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.12), this.mat.charcoal);
      mirror.position.set(mx, 1.42, len / 2 - 0.12);
      bus.add(mirror);
    });

    // Row of 5 Individual Side Passenger Windows on BOTH Sides + Rear Window
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.busWindshield;
    const sideWinGeo = new THREE.BoxGeometry(0.06, 0.52, 0.64);
    for (let wz = -1.65; wz <= 1.55; wz += 0.8) {
      const wl = new THREE.Mesh(sideWinGeo, winMat);
      wl.position.set(-w / 2 - 0.01, 1.52, wz);
      wl.userData.isWindow = true;
      const wr = new THREE.Mesh(sideWinGeo, winMat);
      wr.position.set(w / 2 + 0.01, 1.52, wz);
      wr.userData.isWindow = true;
      bus.add(wl, wr);
    }
    const rearWin = new THREE.Mesh(new THREE.BoxGeometry(w - 0.22, 0.55, 0.08), winMat);
    rearWin.position.set(0, 1.52, -len / 2 + 0.02);
    rearWin.userData.isWindow = true;

    // Rooftop AC Pod & Luggage Carrier Rail
    const roofAc = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 1.5), this.mat.wallWhite);
    roofAc.position.set(0, 2.04, 0.2);
    const rack = new THREE.Mesh(new THREE.BoxGeometry(w - 0.18, 0.14, 2.0), this.mat.chrome);
    rack.position.set(0, 2.0, -1.1);

    // Passenger Entry Door cutout on Left Side (+X / -X front)
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.25, 0.58), this.mat.charcoal);
    door.position.set(w / 2 + 0.01, 1.05, 1.72);

    bus.add(lowerBody, whiteStripe, upperBody, windshield, ledBoard, grille, bumper, rearWin, roofAc, rack, door);

    // Night Headlights + Dual Road Beams + Taillights
    const hlGroup = new THREE.Group();
    hlGroup.userData.keepOnPlot = keepOnPlot;
    const hlGeo = new THREE.BoxGeometry(0.24, 0.16, 0.08);
    const hlL = new THREE.Mesh(hlGeo, this.mat.lampBulbNight);
    hlL.position.set(-0.52, 0.64, len / 2 + 0.03);
    const hlR = hlL.clone();
    hlR.position.x = 0.52;

    const tlL = new THREE.Mesh(hlGeo, this.mat.taillight);
    tlL.position.set(-0.52, 0.64, -len / 2 - 0.02);
    const tlR = tlL.clone();
    tlR.position.x = 0.52;

    const beam = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 4.0), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.09, len / 2 + 2.05);

    hlGroup.add(hlL, hlR, tlL, tlR, beam);
    hlGroup.visible = this.timeOfDay === "night";
    bus.add(hlGroup);
    this.vehicleHeadlights.push(hlGroup);

    return bus;
  },

  _makeVehicleMesh(isBus, isAuto, color, keepOnPlot = true) {
    if (isAuto) return this._makeRealAutoMesh(keepOnPlot, false);
    if (isBus) return this._makeRealBusMesh(color || 0xdc2626, keepOnPlot);

    const car = new THREE.Group();
    const len = 2.15;
    const h = 0.74;
    const w = 1.04;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, len),
      this._getColorMat(color)
    );
    body.position.y = h / 2 + 0.2;
    car.add(body);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.85, 0.45, len * 0.55),
      this.mat.appleSilver
    );
    cabin.position.y = h + 0.35;
    car.add(cabin);

    const hlGroup = new THREE.Group();
    hlGroup.userData.keepOnPlot = keepOnPlot;

    const hlGeo = new THREE.BoxGeometry(0.22, 0.16, 0.08);
    const hlL = new THREE.Mesh(hlGeo, this.mat.lampBulbNight);
    hlL.position.set(-w * 0.3, 0.48, len / 2 + 0.03);
    const hlR = hlL.clone();
    hlR.position.x = w * 0.3;

    const tlL = new THREE.Mesh(hlGeo, this.mat.taillight);
    tlL.position.set(-w * 0.3, 0.48, -len / 2 - 0.03);
    const tlR = tlL.clone();
    tlR.position.x = w * 0.3;

    const beam = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.4, 3.2), this.mat.headlightBeam);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(0, 0.09, len / 2 + 1.65);

    hlGroup.add(hlL, hlR, tlL, tlR, beam);
    hlGroup.visible = this.timeOfDay === "night";
    car.add(hlGroup);
    this.vehicleHeadlights.push(hlGroup);

    return car;
  },

  _spawnRoamingWorkersAndPostman() {
    while (this.workersGroup.children.length > 0) {
      this.workersGroup.remove(this.workersGroup.children[0]);
    }
    this.workers = [];

    const count = Math.min(14, 6 + this.currentGridRadius * 2);
    const limit = (this.currentGridRadius + 0.4) * this.BLOCK_STEP;

    for (let i = 0; i < count; i++) {
      const worker = this._createCharacter({
        shirtMat: i % 2 === 0 ? this.mat.wallGold : this.mat.wallBlue,
        pantsMat: this.mat.navy,
        hatColor: 0xfacc15
      });
      worker.position.set((Math.random() * 2 - 1) * limit, 0.1, (Math.random() * 2 - 1) * limit);
      this.workersGroup.add(worker);
      this.workers.push({
        mesh: worker,
        angle: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 1.2,
        phase: Math.random() * 10,
        limit
      });
    }

    // POSTMAN ON BICYCLE WITH MAIL BAG & LETTERS
    const pmGroup = new THREE.Group();
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 8);
    const wFront = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
    wFront.rotation.z = Math.PI / 2;
    wFront.position.set(0, 0.32, 0.52);
    const wBack = wFront.clone();
    wBack.position.z = -0.52;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 1.05), this.mat.petrolRed);
    frame.position.set(0, 0.52, 0);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.08), this.mat.appleSilver);
    handle.position.set(0, 0.85, 0.42);

    const rider = this._createCharacter({
      shirtMat: this.mat.khakiUniform,
      pantsMat: this.mat.khakiUniform,
      hatColor: 0x92400e,
      scale: 0.92
    });
    rider.position.set(0, 0.35, -0.08);

    const mailBag = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.38, 0.45), this.mat.wood);
    mailBag.position.set(0.28, 0.72, -0.45);
    const letter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.04), this.mat.wallWhite);
    letter.position.set(0.35, 1.05, 0.15);

    pmGroup.add(wFront, wBack, frame, handle, rider, mailBag, letter);
    this.workersGroup.add(pmGroup);

    this.postman = {
      mesh: pmGroup,
      letter,
      loopRadius: this.BLOCK_STEP * 0.5,
      t: 0,
      stopTimer: 0
    };
  },

  _createCharacter({ shirtMat, pantsMat, hatColor = null, scale = 1.0, hasBat = false }) {
    const g = new THREE.Group();
    const legs = new THREE.Mesh(this.geo.cLegs, pantsMat || this.mat.darkPants);
    legs.position.y = 0.23;

    const torso = new THREE.Mesh(this.geo.cTorso, shirtMat || this.mat.wallBlue);
    torso.position.y = 0.7;

    const head = new THREE.Mesh(this.geo.cHead, this.mat.skin);
    head.position.y = 1.1;

    g.add(legs, torso, head);

    if (hatColor !== null) {
      const cap = new THREE.Mesh(this.geo.cCap, new THREE.MeshLambertMaterial({ color: hatColor }));
      cap.position.y = 1.27;
      g.add(cap);
    }

    if (hasBat) {
      const bat = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.06), this.mat.wood);
      bat.position.set(0.28, 0.6, 0.18);
      bat.rotation.z = -0.35;
      g.add(bat);
    }

    g.scale.setScalar(scale);
    return g;
  }
};
