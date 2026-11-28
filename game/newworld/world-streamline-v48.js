import * as THREE from "three";

/**
 * 🏢🌐 SHERU BHAI CITY — v48 STREAMLINE SOLUTIONS GLOBAL HEADQUARTERS (16-PLOT LANDMARK)
 * Separate dedicated file with full 360° architecture:
 *  - Curved Navy-Blue Glass Atrium + Glowing 'S' Swirl Logo & "Streamline Solutions" Facade
 *  - Sweeping Curved Warm-LED Entrance Canopy + Cylindrical Columns + Golden Glass Lobby
 *  - Left Corporate Glass Tower + Right Stepped Skyscraper with Glowing World Map LED Wall
 *  - Front-Left Services Monolith Sign + Center Animated Illuminated Water Fountain
 *  - Front-Right 5 Animated Waving International Flags + Security Guard Cabin & Barrier Gate
 *  - Back-Side Glass Curtain Wall, Rooftop Helipad, HVAC Units & Rear Employee Plaza
 *  - Left & Right Side Dedicated Executive & Visitor Parking Lots with Parked Cars & Palm Trees!
 */
export const v48StreamlineMethods = {
  _makeStreamlineFacadeTexture(ownerName) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext("2d");

    // Deep curved corporate navy glass gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 512);
    grad.addColorStop(0, "#071a38");
    grad.addColorStop(0.5, "#0b2e5e");
    grad.addColorStop(1, "#061630");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle vertical glass mullion lines
    ctx.strokeStyle = "rgba(125, 211, 252, 0.14)";
    ctx.lineWidth = 3;
    for (let x = 40; x < 1024; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
    for (let y = 60; y < 512; y += 84) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
    }

    // Glowing Cyan-Blue 'S' Swirl Logo (Left of Brand Name)
    ctx.save();
    ctx.translate(210, 215);
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 24;
    const sGrad = ctx.createLinearGradient(-80, -80, 80, 80);
    sGrad.addColorStop(0, "#38bdf8");
    sGrad.addColorStop(0.5, "#0284c7");
    sGrad.addColorStop(1, "#7dd3fc");
    ctx.strokeStyle = sGrad;
    ctx.lineWidth = 28;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, -32, 48, Math.PI * 0.15, Math.PI * 1.45, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 32, 48, Math.PI * 1.15, Math.PI * 0.45, true);
    ctx.stroke();
    ctx.restore();

    // Brand Title: Streamline Solutions
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(56, 189, 248, 0.65)";
    ctx.shadowBlur = 14;
    ctx.font = "900 84px Arial, sans-serif";
    ctx.fillText("Streamline", 315, 198);
    ctx.fillText("Solutions", 315, 282);

    // Tagline
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#bae6fd";
    ctx.font = "700 30px Arial, sans-serif";
    ctx.fillText("Simplifying Technology. Empowering Tomorrow.", 210, 355);

    if (ownerName) {
      ctx.fillStyle = "#fde047";
      ctx.font = "800 24px Arial, sans-serif";
      ctx.fillText(`FOUNDER / OWNER: ${ownerName.toUpperCase()}`, 315, 425);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  },

  _makeWorldMapWallTexture() {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#082f59");
    grad.addColorStop(1, "#0b1f3a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Glowing Cyan Stylized World Map Continents
    ctx.fillStyle = "#38bdf8";
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 12;
    const blobs = [
      [110, 140, 62, 42], [150, 225, 38, 52], // Americas
      [270, 130, 54, 34], [275, 210, 44, 52], // Europe & Africa
      [375, 145, 76, 46], [420, 255, 38, 28]  // Asia & Australia
    ];
    blobs.forEach(([x, y, rx, ry]) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0.15, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 32px Arial, sans-serif";
    ctx.fillText("A Global", 256, 345);
    ctx.fillText("Technology Leader", 256, 385);
    ctx.fillStyle = "#bae6fd";
    ctx.font = "700 22px Arial, sans-serif";
    ctx.fillText("Over 50+ Countries", 256, 430);
    ctx.fillText("100,000+ Employees", 256, 462);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  },

  _makeServicesTotemTexture() {
    const c = document.createElement("canvas");
    c.width = 384;
    c.height = 512;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0b223d";
    ctx.fillRect(0, 0, 384, 512);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 368, 496);

    const items = [
      ["🤖", "Artificial Intelligence", "& Machine Learning"],
      ["</>", "Software Development", ""],
      ["📱", "Web & Mobile", "App Development"],
      ["☁️", "Cloud Computing", ""],
      ["🛡️", "Cybersecurity", ""],
      ["📊", "Data Science", ""]
    ];
    items.forEach(([ic, l1, l2], idx) => {
      const y = 62 + idx * 74;
      ctx.fillStyle = "#38bdf8";
      ctx.font = "800 28px Arial, sans-serif";
      ctx.fillText(ic, 28, y);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "700 22px Arial, sans-serif";
      ctx.fillText(l1, 88, y - 4);
      if (l2) {
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "600 18px Arial, sans-serif";
        ctx.fillText(l2, 88, y + 20);
      }
    });
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  },

  _buildSixteenPlotStreamlineHQ(plotId, ownerName) {
    const grp = new THREE.Group();
    const W = this.SIXTEEN_PLOT_WIDTH || 39.8; // Full 2x2 block width (~39.8 units!)
    const D = this.SIXTEEN_PLOT_WIDTH || 39.8; // Full 2x2 block depth (~39.8 units!)

    // 1. GRAND GRANITE CAMPUS PLAZA & PERIMETER CURB
    const plaza = new THREE.Mesh(this._boxGeo(W, 0.36, D), this.mat.tarmacGrey);
    plaza.position.y = 0.18;
    const frontWalk = new THREE.Mesh(this._boxGeo(W - 1.2, 0.4, 12.5), this.mat.mansionCreamMarble);
    frontWalk.position.set(0, 0.2, D * 0.5 - 6.6);
    grp.add(plaza, frontWalk);

    // 2. CENTRAL CURVED NAVY-BLUE ATRIUM TOWER + GOLDEN GLASS LOBBY
    const lobbyBase = new THREE.Mesh(this._boxGeo(15.2, 5.4, 12.8), this.mat.mansionWarmGlow);
    lobbyBase.position.set(0, 3.0, -1.2);
    const lobbyGlass = new THREE.Mesh(this._boxGeo(15.6, 5.2, 13.1), this.mat.glass);
    lobbyGlass.position.set(0, 3.0, -1.2);

    // Sweeping Curved White Canopy with Warm LED Underside
    const canopy = new THREE.Mesh(this._boxGeo(16.8, 0.55, 14.2), this.mat.wallWhite);
    canopy.position.set(0, 5.9, -0.5);
    const canopyLed = new THREE.Mesh(this._boxGeo(16.4, 0.16, 13.8), this.mat.mansionWarmGlow);
    canopyLed.position.set(0, 5.56, -0.5);

    // 4 Grand Cylindrical Entrance Columns
    [-6.8, -3.2, 3.2, 6.8].forEach((cx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 5.6, 12), this.mat.mansionCreamMarble);
      col.position.set(cx, 3.0, 5.9);
      grp.add(col);
    });

    // Upper Navy-Blue Glass Atrium Body + Glowing Streamline Solutions Facade!
    const upperAtrium = new THREE.Mesh(this._boxGeo(15.8, 9.6, 12.6), this.mat.inorbitNavy);
    upperAtrium.position.set(0, 10.9, -1.4);
    const facadeMat = new THREE.MeshBasicMaterial({ map: this._makeStreamlineFacadeTexture(ownerName) });
    const facadeSign = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 8.6), facadeMat);
    facadeSign.position.set(0, 10.9, 4.95);
    const roofTrim = new THREE.Mesh(this._boxGeo(16.2, 0.32, 13.0), this.mat.cinemaNeonCyan);
    roofTrim.position.set(0, 15.8, -1.4);
    grp.add(lobbyBase, lobbyGlass, canopy, canopyLed, upperAtrium, facadeSign, roofTrim);

    // 3. LEFT CORPORATE GLASS OFFICE WING (Illuminated Multi-Floor Windows!)
    const leftWing = new THREE.Mesh(this._boxGeo(9.2, 12.6, 14.2), this.mat.inorbitNavy);
    leftWing.position.set(-12.2, 6.6, -2.6);
    const leftGlass = new THREE.Mesh(this._boxGeo(9.45, 11.4, 13.6), this.mat.glass);
    leftGlass.position.set(-12.2, 6.6, -2.6);
    for (let fl = 0; fl < 5; fl++) {
      const band = new THREE.Mesh(this._boxGeo(9.6, 0.35, 14.5), this.mat.mansionWarmGlow);
      band.position.set(-12.2, 2.2 + fl * 2.2, -2.6);
      grp.add(band);
    }
    grp.add(leftWing, leftGlass);

    // 4. RIGHT TALL STEPPED SKYSCRAPER + GLOWING WORLD MAP LED WALL!
    const rightTall = new THREE.Mesh(this._boxGeo(6.4, 19.2, 12.0), this.mat.inorbitNavy);
    rightTall.position.set(9.4, 9.9, -4.6);
    const rightTallGlass = new THREE.Mesh(this._boxGeo(6.6, 18.2, 11.4), this.mat.glass);
    rightTallGlass.position.set(9.4, 9.9, -4.6);

    const rightMapWing = new THREE.Mesh(this._boxGeo(7.6, 13.6, 11.2), this.mat.inorbitNavy);
    rightMapWing.position.set(14.8, 7.1, -2.2);
    const mapMat = new THREE.MeshBasicMaterial({ map: this._makeWorldMapWallTexture() });
    const mapPanel = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 10.6), mapMat);
    mapPanel.position.set(14.8, 7.6, 3.45);
    // Rooftop Garden Bushes on Right Wing
    const roofGarden = new THREE.Mesh(this._boxGeo(7.0, 0.7, 10.4), this.mat.turf);
    roofGarden.position.set(14.8, 14.1, -2.2);
    grp.add(rightTall, rightTallGlass, rightMapWing, mapPanel, roofGarden);

    // 5. BACK-SIDE ARCHITECTURAL DETAILS (Rear Glass Curtain Wall, Rooftop Helipad & Employee Courtyard!)
    const rearCore = new THREE.Mesh(this._boxGeo(20.0, 10.5, 6.4), this.mat.inorbitNavy);
    rearCore.position.set(0, 5.5, -11.2);
    const rearGlass = new THREE.Mesh(this._boxGeo(18.6, 9.2, 6.6), this.mat.glass);
    rearGlass.position.set(0, 5.5, -11.2);
    const rearCanopy = new THREE.Mesh(this._boxGeo(9.5, 0.35, 3.2), this.mat.wallWhite);
    rearCanopy.position.set(0, 3.4, -15.6);
    // Rooftop Helipad 'H' on Back Core Roof
    const heliPad = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.7, 0.22, 18), this.mat.tarmacGrey);
    heliPad.position.set(0, 10.85, -11.2);
    const heliRing = new THREE.Mesh(new THREE.RingGeometry(2.0, 2.35, 18), this.mat.mansionGoldTrim);
    heliRing.rotation.x = -Math.PI / 2;
    heliRing.position.set(0, 10.98, -11.2);
    grp.add(rearCore, rearGlass, rearCanopy, heliPad, heliRing);

    // 6. FRONT CENTER: ANIMATED ILLUMINATED WATER FOUNTAIN + "Streamline Solutions" PLAQUE!
    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.8, 0.85, 22), this.mat.mansionBlackMarble);
    fBase.position.set(0, 0.75, 11.4);
    const fWater = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 0.2, 22), this.mat.cinemaNeonCyan);
    fWater.position.set(0, 1.15, 11.4);
    const fPlaque = this._makeBuildingBoard("Streamline Solutions", "", "#0f172a", "#fde047", 4.6, 0.65);
    fPlaque.position.set(0, 0.82, 16.05);

    const jets = [];
    for (let j = 0; j < 9; j++) {
      const ang = (j / 9) * Math.PI * 2;
      const rad = j === 0 ? 0 : 2.2;
      const jet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.24, 2.6, 8),
        new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.88 })
      );
      jet.position.set(Math.cos(ang) * rad, 2.2, 11.4 + Math.sin(ang) * rad);
      grp.add(jet);
      jets.push(jet);
    }
    grp.add(fBase, fWater, fPlaque);

    // 7. FRONT LEFT: SERVICES MONOLITH TOTEM SIGN!
    const totem = new THREE.Mesh(this._boxGeo(3.6, 5.4, 0.65), this.mat.inorbitNavy);
    totem.position.set(-14.6, 3.0, 14.2);
    const totemFace = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 5.1), new THREE.MeshBasicMaterial({ map: this._makeServicesTotemTexture() }));
    totemFace.position.set(-14.6, 3.0, 14.56);
    grp.add(totem, totemFace);

    // 8. FRONT RIGHT: 5 WAVING INTERNATIONAL FLAGS + SECURITY GUARD CABIN & BARRIER GATE!
    const flagCols = [0xff9933, 0x2563eb, 0xdc2626, 0xeab308, 0x1d4ed8];
    const flagMeshes = [];
    flagCols.forEach((col, i) => {
      const fx = 6.2 + i * 1.45;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5.6, 8), this.mat.wallWhite);
      pole.position.set(fx, 3.1, 10.6);
      const cloth = new THREE.Mesh(this._boxGeo(1.15, 0.72, 0.08), new THREE.MeshLambertMaterial({ color: col }));
      cloth.position.set(fx + 0.58, 5.35, 10.6);
      grp.add(pole, cloth);
      flagMeshes.push(cloth);
    });

    // Security Guard Cabin + Standing Guard + Entrance Sign Wall
    const cabin = new THREE.Mesh(this._boxGeo(3.4, 2.8, 2.6), this.mat.wallWhite);
    cabin.position.set(14.8, 1.7, 15.2);
    const cabinGlass = new THREE.Mesh(this._boxGeo(3.5, 1.3, 2.7), this.mat.glass);
    cabinGlass.position.set(14.8, 2.0, 15.2);
    const guard = this._createCharacter({ shirtMat: this.mat.navy, pantsMat: this.mat.cinemaObsidian, scale: 0.85 });
    guard.position.set(12.4, 0.4, 15.4);
    const hqWall = this._makeBuildingBoard("Streamline Solutions", "Global Headquarters", "#e2e8f0", "#0f172a", 4.2, 1.15);
    hqWall.position.set(15.0, 1.0, 16.9);
    grp.add(cabin, cabinGlass, guard, hqWall);

    // 9. LEFT & RIGHT SIDE DEDICATED PARKING LOTS (With Parked Executive Cars & Palm Trees!)
    const carMats = [this.mat.audiWhite, this.mat.audiRed, this.mat.mobileBlue, this.mat.mansionBlackMarble];
    [-16.8, 16.8].forEach((sideX, sIdx) => {
      // Parking Bay Stripe Lines
      for (let slot = 0; slot < 5; slot++) {
        const sz = -13.5 + slot * 4.4;
        const line = new THREE.Mesh(this._boxGeo(3.8, 0.06, 0.14), this.mat.stripe);
        line.position.set(sideX, 0.39, sz - 2.1);
        grp.add(line);

        // Park 3 sleek executive sedans per side
        if (slot % 2 === 0 || slot === 3) {
          const c = new THREE.Group();
          const cb = new THREE.Mesh(this._boxGeo(1.65, 0.62, 3.3), carMats[(slot + sIdx) % carMats.length]);
          cb.position.y = 0.5;
          const cc = new THREE.Mesh(this._boxGeo(1.4, 0.52, 1.7), this.mat.glass);
          cc.position.set(0, 1.0, -0.1);
          c.add(cb, cc);
          c.position.set(sideX, 0.36, sz);
          c.rotation.y = sideX < 0 ? Math.PI / 2 : -Math.PI / 2;
          grp.add(c);
        }
      }
    });

    // Register Animated Fountain Jets & Waving Flags in `this.landmarkActors`!
    this.landmarkActors.push({
      plotId,
      update: (dt, elapsed) => {
        for (let i = 0; i < jets.length; i++) {
          const s = 0.75 + Math.sin(elapsed * 5.2 + i * 0.9) * 0.38;
          jets[i].scale.y = s;
          jets[i].position.y = 1.2 + s * 1.15;
        }
        for (let i = 0; i < flagMeshes.length; i++) {
          flagMeshes[i].rotation.y = Math.sin(elapsed * 4.0 + i * 0.8) * 0.28;
        }
      }
    });

    return grp;
  }
};
