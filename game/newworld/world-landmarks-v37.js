import * as THREE from "three";

/**
 * 🏛️ SHERU BHAI CITY — v37 FOLLOWER COMMENTS & SWAMY SCHOOL EXACT CAMPUS MODULE
 * 11 Brand-New Realistic Textured Landmarks with Live Animations (Zero Drive Mode, Zero-MB Procedural Banners!):
 *  8-Plot: swamy_school (Exact Swamy E.M. High School!), dmart_mega, inorbit_mall, function_hall
 *  4-Plot: ff_office, ayyappa_temple, yamaha_showroom, stark_tower, lc_mart, bar_lounge
 *  2-Plot: light_house
 */
export const v37LandmarkMethods = {
  // Custom High-Res SSC-2025 Toppers Flex Banner for Swamy E.M. High School (Matches Photo 10248.jpg!)
  _makeSwamyToppersBanner() {
    const key = "SWAMY_TOPPERS_V37";
    let mat = this.signTexCache.get(key);
    if (!mat) {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 320;
      const ctx = c.getContext("2d");
      const grd = ctx.createLinearGradient(0, 0, 0, 320);
      grd.addColorStop(0, "#fef3c7");
      grd.addColorStop(0.7, "#fde68a");
      grd.addColorStop(1, "#dc2626");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 512, 320);

      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, 0, 512, 34);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 18px sans-serif";
      ctx.fillText("SSC-2025 TOPPERS • SWAMY HIGH SCHOOL", 256, 17);

      // Stylized Topper Portraits + Big Red Scores (576, 581, 575)
      const tops = [
        { x: 96, y: 120, r: 28, score: "576" },
        { x: 205, y: 112, r: 36, score: "581" },
        { x: 312, y: 120, r: 28, score: "575" }
      ];
      tops.forEach((tp) => {
        ctx.fillStyle = "#1e3a8a";
        ctx.beginPath(); ctx.arc(tp.x, tp.y, tp.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fdba74";
        ctx.beginPath(); ctx.arc(tp.x, tp.y - 6, tp.r * 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#b91c1c";
        ctx.font = tp.score === "581" ? "900 54px sans-serif" : "900 38px sans-serif";
        ctx.fillText(tp.score, tp.x, 198);
      });

      // Right mini score badges (568, 563, 562, 559, 557, 543)
      const minis = ["568", "563", "562", "559", "557", "543"];
      ctx.font = "900 22px sans-serif";
      minis.forEach((ms, i) => {
        const mx = 398 + (i % 2) * 62;
        const my = 72 + Math.floor(i / 2) * 48;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(mx - 26, my - 16, 52, 32);
        ctx.fillStyle = "#b91c1c";
        ctx.fillText(ms, mx, my);
      });

      // Red Bottom School Name Strip
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(0, 240, 512, 80);
      ctx.fillStyle = "#fde047";
      ctx.font = "900 42px sans-serif";
      ctx.fillText("SWAMY", 155, 272);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 18px sans-serif";
      ctx.fillText("ENGLISH MEDIUM HIGH SCHOOL", 256, 304);
      ctx.fillStyle = "#0ea5e9";
      ctx.fillRect(365, 250, 130, 38);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 15px sans-serif";
      ctx.fillText("ADMISSIONS OPEN", 430, 270);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = this.maxAnisotropy || 2;
      mat = new THREE.MeshBasicMaterial({ map: tex });
      this.signTexCache.set(key, mat);
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(5.8, 3.6), mat);
  },

  // Custom Yellow & Green Corner Signboard for Swamy School (Matches Photo 10250.jpg!)
  _makeSwamyCornerBoard() {
    const key = "SWAMY_CORNER_BOARD_V37";
    let mat = this.signTexCache.get(key);
    if (!mat) {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fde047";
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, 498, 242);

      // Vertical Red "S W A M Y" on Left
      ctx.fillStyle = "#b91c1c";
      ctx.font = "900 38px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ["S", "W", "A", "M", "Y"].forEach((ch, idx) => {
        ctx.fillText(ch, 46, 42 + idx * 43);
      });

      ctx.textAlign = "left";
      ctx.fillStyle = "#1e3a8a";
      ctx.font = "900 34px sans-serif";
      ctx.fillText("ENGLISH MEDIUM HIGH SCHOOL", 86, 52, 405);
      ctx.fillStyle = "#15803d";
      ctx.font = "900 42px sans-serif";
      ctx.fillText("JUNIOR COLLEGE", 86, 128, 405);
      ctx.fillStyle = "#1e3a8a";
      ctx.font = "900 40px sans-serif";
      ctx.fillText("ACADEMY", 86, 200, 320);

      // Orange Direction Arrows matching the real board!
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(360, 74, 118, 12);
      ctx.fillRect(102, 160, 145, 12);
      ctx.fillRect(310, 196, 165, 12);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = this.maxAnisotropy || 2;
      mat = new THREE.MeshBasicMaterial({ map: tex });
      this.signTexCache.set(key, mat);
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.2), mat);
  },

  /**
   * 🏫 8-PLOT EXACT REMAKE: SWAMY ENGLISH MEDIUM HIGH SCHOOL (`swamy_school`)
   * Built directly from all 4 real campus photos (10248–10251.jpg):
   * - Left 3-Story Cream-Beige Academic Block with scalloped maroon balcony arches, sky-blue railings & doors,
   *   external white diagonal zigzag staircase, black wrought-iron gate, black granite SWAMY wall & SSC-2025 Toppers Flex!
   * - Right Grey-and-White Junior College/Academy Block with green-railed exterior stairs, corner handpump,
   *   Yellow-Green vertical "SWAMY • ENGLISH MEDIUM HIGH SCHOOL / JUNIOR COLLEGE / ACADEMY" signboard &
   *   Iconic Tall White-and-Blue Overhead Water Tank!
   * - Wide Center Courtyard ("Rd Number 2") with 3 Yellow Swamy School Buses, row of Red/Black Student Bicycles,
   *   White Cars, Coconut Palm + Lush Neem Tree & Animated Students in Uniform!
   */
  _buildEightPlotSwamySchool(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.darkGlass;

    // Wide Paved Rd Number 2 Courtyard Floor + Compound Back/Side Walls
    const campusYard = new THREE.Mesh(this._boxGeo(33.2, 0.22, 14.4), this.mat.concrete);
    campusYard.position.set(0, 0.14, 0);
    g.add(campusYard);

    // =========================================================================
    // A. LEFT 3-STORY CREAM-BEIGE MAIN SCHOOL BUILDING (Photo 10248 & 10251!)
    // =========================================================================
    const mainBlk = new THREE.Group();
    mainBlk.position.set(-10.2, 0.25, -0.8);

    const bBody = new THREE.Mesh(this._boxGeo(10.8, 9.6, 8.6), this.mat.stuccoCream);
    bBody.position.set(0, 4.8, 0);
    mainBlk.add(bBody);

    // Ground Floor Bright Sky-Blue Wooden Double Doors & Window Frames!
    const blueDoor = new THREE.Mesh(this._boxGeo(3.2, 2.4, 0.18), this.mat.swamySkyBlue);
    blueDoor.position.set(-1.6, 1.35, 4.35);
    const blueWinR = new THREE.Mesh(this._boxGeo(2.4, 2.1, 0.18), this.mat.swamySkyBlue);
    blueWinR.position.set(2.4, 1.45, 4.35);
    mainBlk.add(blueDoor, blueWinR);

    // 2nd & 3rd Floor Balconies with Sky-Blue Metal Railings + Scalloped Maroon-Brown Decorative Arches!
    [3.4, 6.6].forEach((fy) => {
      const slab = new THREE.Mesh(this._boxGeo(7.6, 0.24, 1.35), this.mat.stuccoCream);
      slab.position.set(-1.4, fy, 4.85);
      const railTop = new THREE.Mesh(this._boxGeo(7.4, 0.12, 0.12), this.mat.swamySkyBlue);
      railTop.position.set(-1.4, fy + 1.05, 5.45);
      for (let rx = -4.8; rx <= 2.0; rx += 0.85) {
        const bar = new THREE.Mesh(this._boxGeo(0.08, 1.0, 0.08), this.mat.swamySkyBlue);
        bar.position.set(rx, fy + 0.52, 5.45);
        mainBlk.add(bar);
      }
      // Signature Scalloped Maroon-Brown Arch Trim Overhead!
      const archMid = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.18, 6, 14, Math.PI), this.mat.swamyArchMaroon);
      archMid.position.set(-1.4, fy + 1.7, 5.42);
      const archL = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.15, 6, 10, Math.PI), this.mat.swamyArchMaroon);
      archL.position.set(-3.9, fy + 1.55, 5.42);
      const archR = archL.clone();
      archR.position.x = 1.1;
      const winRow = new THREE.Mesh(this._boxGeo(5.6, 1.45, 0.16), winMat);
      winRow.position.set(-1.4, fy + 1.2, 4.35);
      winRow.userData.isWindow = true;
      mainBlk.add(slab, railTop, archMid, archL, archR, winRow);
    });

    // Side Classroom Windows facing the Center Courtyard (+X)
    for (let f = 0; f < 3; f++) {
      for (let wz = -2.8; wz <= 2.8; wz += 2.8) {
        const sw = new THREE.Mesh(this._boxGeo(0.16, 1.2, 1.3), winMat);
        sw.position.set(5.45, 1.8 + f * 3.1, wz);
        sw.userData.isWindow = true;
        mainBlk.add(sw);
      }
    }

    // Iconic External White Concrete Zigzag Staircase climbing the Right Front Facade!
    const stair1 = new THREE.Mesh(this._boxGeo(3.6, 0.42, 1.45), this.mat.stuccoIvory);
    stair1.position.set(3.6, 2.2, 4.9);
    stair1.rotation.z = 0.56;
    const stair2 = new THREE.Mesh(this._boxGeo(3.6, 0.42, 1.45), this.mat.stuccoIvory);
    stair2.position.set(3.6, 5.3, 4.9);
    stair2.rotation.z = -0.56;
    const stair3 = new THREE.Mesh(this._boxGeo(3.4, 0.42, 1.45), this.mat.stuccoIvory);
    stair3.position.set(3.6, 8.2, 4.9);
    stair3.rotation.z = 0.52;
    const roofParapet = new THREE.Mesh(this._boxGeo(11.1, 0.72, 8.9), this.mat.stuccoCream);
    roofParapet.position.set(0, 9.9, 0);
    mainBlk.add(stair1, stair2, stair3, roofParapet);

    // SSC-2025 TOPPERS RED-YELLOW FLEX BANNER Hanging on 1st-Floor Balcony!
    const toppersFlex = this._makeSwamyToppersBanner();
    toppersFlex.position.set(-1.4, 4.45, 5.62);
    mainBlk.add(toppersFlex);

    // Black Wrought-Iron Main Gate + Black Granite "SWAMY PUBLIC" Wall Pillar!
    const gateFrame = new THREE.Mesh(this._boxGeo(4.6, 2.4, 0.16), this.mat.cinemaObsidian);
    gateFrame.position.set(-2.6, 1.25, 6.45);
    for (let gx = -4.6; gx <= -0.6; gx += 0.48) {
      const spear = new THREE.Mesh(this._boxGeo(0.08, 2.7, 0.08), this.mat.cinemaObsidian);
      spear.position.set(gx, 1.4, 6.45);
      mainBlk.add(spear);
    }
    const graniteWall = new THREE.Mesh(this._boxGeo(5.0, 2.2, 0.45), this.mat.mansionBlackMarble);
    graniteWall.position.set(2.4, 1.15, 6.45);
    const graniteBoard = this._makeBuildingBoard("SWAMY PUBLIC SCHOOL", "E.M. HIGH SCHOOL • KAKINADA", "#09090b", "#e2e8f0", 4.6, 1.15);
    graniteBoard.position.set(2.4, 1.25, 6.72);
    mainBlk.add(gateFrame, graniteWall, graniteBoard);

    // Lush Green Neem Shade Tree right beside the Left Gate!
    const neemT = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 3.8, 6), this.mat.treeTrunk);
    neemT.position.set(-5.8, 1.9, 5.2);
    const neemC = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5, 0), this.mat.treeLeaf);
    neemC.position.set(-5.8, 4.8, 5.2);
    mainBlk.add(neemT, neemC);

    g.add(mainBlk);

    // =========================================================================
    // B. RIGHT GREY-AND-WHITE JUNIOR COLLEGE / ACADEMY BLOCK + CORNER SIGN + WATER TANK (Photos 10249 & 10250!)
    // =========================================================================
    const rightBlk = new THREE.Group();
    rightBlk.position.set(11.4, 0.25, -0.2);

    const rBody = new THREE.Mesh(this._boxGeo(8.2, 4.4, 10.6), this.mat.wallWhite);
    rBody.position.set(0, 2.2, -0.6);
    const rGreyBand = new THREE.Mesh(this._boxGeo(8.4, 1.15, 10.8), this.mat.plinthGrey);
    rGreyBand.position.set(0, 4.55, -0.6);
    // Exterior Steps with Dark-Green Railings climbing up the right block (Photo 10250!)
    const rStair = new THREE.Mesh(this._boxGeo(1.3, 0.35, 5.8), this.mat.concrete);
    rStair.position.set(-4.6, 2.3, 2.2);
    rStair.rotation.x = -0.62;
    const rRail = new THREE.Mesh(this._boxGeo(0.14, 0.85, 5.8), this.mat.dmartDeepGreen);
    rRail.position.set(-5.2, 2.75, 2.2);
    rRail.rotation.x = -0.62;
    // Compound Grey Wall + Tour Photo Collage Board + Classic Corner Handpump!
    const cWall = new THREE.Mesh(this._boxGeo(8.8, 2.0, 0.36), this.mat.plinthGrey);
    cWall.position.set(0, 1.0, 5.8);
    const tourBoard = this._makeBuildingBoard("SWAMY EDUCATIONAL TOUR", "MEMORIES • JUNIOR COLLEGE & SCHOOL", "#15803d", "#fde047", 5.2, 1.65);
    tourBoard.position.set(-2.0, 1.25, 6.04);
    const pumpPad = new THREE.Mesh(this._boxGeo(1.4, 0.16, 1.4), this.mat.concrete);
    pumpPad.position.set(-4.2, 0.1, 6.7);
    const pumpPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.2, 6), this.mat.dmartDeepGreen);
    pumpPipe.position.set(-4.2, 0.72, 6.7);

    // ICONIC YELLOW & GREEN CORNER SIGNBOARD ("S W A M Y • ENGLISH MEDIUM HIGH SCHOOL / JUNIOR COLLEGE / ACADEMY")!
    const cornerBoard = this._makeSwamyCornerBoard();
    cornerBoard.position.set(1.6, 3.6, 6.15);
    [-1.4, 4.6].forEach((px) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.2, 6), this.mat.dmartDeepGreen);
      pole.position.set(px, 2.6, 6.1);
      rightBlk.add(pole);
    });

    // ICONIC TALL WHITE & BLUE ELEVATED OVERHEAD WATER TANK BEHIND RIGHT BLOCK (Photos 10249 & 10250)!
    const tankGrp = new THREE.Group();
    tankGrp.position.set(1.2, 4.6, -3.5);
    [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]].forEach(([tx, tz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 5.8, 6), this.mat.concrete);
      leg.position.set(tx, 2.9, tz);
      tankGrp.add(leg);
    });
    const tankRing = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.35, 16), this.mat.swamySkyBlue);
    tankRing.position.y = 5.9;
    const tankDrum = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 3.4, 16), this.mat.wallWhite);
    tankDrum.position.y = 7.75;
    const tankCap = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.28, 16), this.mat.swamySkyBlue);
    tankCap.position.y = 9.5;
    tankGrp.add(tankRing, tankDrum, tankCap);

    rightBlk.add(rBody, rGreyBand, rStair, rRail, cWall, tourBoard, pumpPad, pumpPipe, cornerBoard, tankGrp);
    g.add(rightBlk);

    // =========================================================================
    // C. CENTER CAMPUS DRIVEWAY ("RD NUMBER 2"): 3 YELLOW SCHOOL BUSES + STUDENT BICYCLES + CARS + STUDENTS!
    // =========================================================================
    // 3 Bright Yellow Swamy School Buses parked side-by-side at the rear of the campus!
    [-2.4, 0.8, 3.8].forEach((bx) => {
      const sBus = this._makeRealBusMesh(0xfacc15, false);
      sBus.position.set(bx, 0.26, -3.6);
      sBus.scale.setScalar(0.84);
      g.add(sBus);
    });

    // Row of Red & Black Student Bicycles + Bikes parked neatly along the Left Academic Block!
    for (let i = 0; i < 6; i++) {
      const bz = -1.2 + i * 1.15;
      const bikeFrame = new THREE.Mesh(this._boxGeo(1.15, 0.58, 0.22), i % 2 === 0 ? this.mat.oyoRed : this.mat.cinemaObsidian);
      bikeFrame.position.set(-4.0, 0.62, bz);
      bikeFrame.rotation.y = 0.25;
      const basket = new THREE.Mesh(this._boxGeo(0.28, 0.24, 0.24), this.mat.chrome);
      basket.position.set(-3.45, 0.88, bz);
      g.add(bikeFrame, basket);
    }

    // 2 White Cars parked neatly along the Right Block (Photo 10249 & 10251!)
    const wCar1 = this._makeVehicleMesh(false, false, 0xf8fafc, false);
    wCar1.position.set(4.8, 0.28, 1.8);
    wCar1.rotation.y = -0.25;
    const wCar2 = this._makeVehicleMesh(false, false, 0xe2e8f0, false);
    wCar2.position.set(5.2, 0.28, 4.6);
    g.add(wCar1, wCar2);

    // Tall Coconut Palm behind the School Buses!
    const palmT = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 8.2, 6), this.mat.treeTrunk);
    palmT.position.set(2.2, 4.2, -6.4);
    for (let f = 0; f < 6; f++) {
      const a = (f / 6) * Math.PI * 2;
      const fr = new THREE.Mesh(this._boxGeo(2.8, 0.14, 0.6), this.mat.treeLeaf);
      fr.position.set(2.2 + Math.cos(a) * 1.2, 8.2, -6.4 + Math.sin(a) * 1.2);
      fr.rotation.y = -a; fr.rotation.z = -0.3;
      g.add(fr);
    }
    g.add(palmT);

    // Animated Swamy School Students in Uniform walking together across Rd Number 2!
    const stuPair = new THREE.Group();
    const st1 = this._createCharacter({ shirtMat: this.mat.wallWhite, pantsMat: this.mat.swamyUniformNavy, scale: 0.88 });
    st1.position.x = -0.35;
    const st2 = this._createCharacter({ shirtMat: this.mat.wallWhite, pantsMat: this.mat.swamyUniformNavy, scale: 0.84 });
    st2.position.x = 0.35;
    stuPair.add(st1, st2);
    g.add(stuPair);
    this.landmarkActors.push({ plotId, mesh: stuPair, mode: "patrol_z", baseX: 1.0, baseZ: 2.2, range: 3.0, speed: 1.05, phase: 0 });

    g.userData.labelY = 14.8;
    return g;
  },

  /**
   * 🛒 8-PLOT MEGA D-MART SUPER HYPERMARKET (`dmart_mega` — Larger D-Mart for one user!)
   */
  _buildEightPlotMegaDMart(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.glass;

    const floor = new THREE.Mesh(this._boxGeo(33.2, 0.22, 14.4), this.mat.concrete);
    floor.position.set(0, 0.14, 0);

    // Massive 2-Floor Green & White Hypermarket Hall!
    const hall = new THREE.Mesh(this._boxGeo(28.5, 6.8, 8.4), this.mat.wallWhite);
    hall.position.set(0, 3.6, -2.5);
    const greenCrown = new THREE.Mesh(this._boxGeo(29.2, 2.2, 8.8), this.mat.dmartDeepGreen);
    greenCrown.position.set(0, 7.6, -2.5);
    const yellowBand = new THREE.Mesh(this._boxGeo(29.4, 0.42, 8.95), this.mat.dmartYellow);
    yellowBand.position.set(0, 6.45, -2.5);
    const frontGlass = new THREE.Mesh(this._boxGeo(25.6, 4.4, 0.16), winMat);
    frontGlass.position.set(0, 2.55, 1.76);
    frontGlass.userData.isWindow = true;

    // 6 Stocked Colorful Supermarket Aisles visible through the Giant Glass Front!
    const aisleCols = [this.mat.dmartOfferRed, this.mat.dmartYellow, this.mat.dmartBrightGreen, this.mat.mobileBlue, this.mat.biryaniOrange, this.mat.icePink];
    for (let i = 0; i < 6; i++) {
      const ax = -10.0 + i * 4.0;
      const shelf = new THREE.Mesh(this._boxGeo(1.1, 2.6, 4.8), aisleCols[i]);
      shelf.position.set(ax, 1.55, -1.6);
      g.add(shelf);
    }

    // Giant Illuminated Main DMart Logo Board + Towering Roadside Pylon Totem!
    const dmSub = ownerName ? `${ownerName.toUpperCase()} • MEGA SUPER HYPERMARKET` : "MEGA D-MART • DAILY DISCOUNTS • MIN 7% OFF";
    const mainSign = this._makeBuildingBoard("DMart • MEGA HYPERMARKET", dmSub, "#0f7638", "#facc15", 22.0, 2.0);
    mainSign.position.set(0, 7.65, 1.96);

    const pylon = new THREE.Mesh(this._boxGeo(1.4, 11.2, 0.9), this.mat.dmartDeepGreen);
    pylon.position.set(-14.4, 5.8, 4.6);
    const pylonSign = this._makeBuildingBoard("DMart", "MEGA STORE", "#facc15", "#0f7638", 3.6, 2.2);
    pylonSign.position.set(-14.4, 9.6, 5.1);

    // Chrome Shopping Trolley Bay + Spacious Parking Plaza + Delivery Truck + Cars + Shoppers!
    for (let t = 0; t < 4; t++) {
      const cart = new THREE.Mesh(this._boxGeo(0.75, 0.85, 1.1), this.mat.cartChrome);
      cart.position.set(-8.5 + t * 1.1, 0.65, 2.8);
      g.add(cart);
    }
    const parkLot = new THREE.Mesh(this._boxGeo(30.0, 0.12, 4.2), this.mat.tarmacGrey);
    parkLot.position.set(0, 0.24, 4.8);
    [-9, -3, 3, 9].forEach((cx, i) => {
      const car = this._makeVehicleMesh(false, false, [0xef4444, 0xf8fafc, 0x3b82f6, 0xfacc15][i], false);
      car.position.set(cx, 0.3, 4.8);
      g.add(car);
    });
    const supplyTruck = this._makeRealBusMesh(0x16a34a, false);
    supplyTruck.position.set(13.4, 0.3, 2.2);
    supplyTruck.rotation.y = Math.PI / 2;
    supplyTruck.scale.setScalar(0.75);

    const sh1 = this._createCharacter({ shirtMat: this.mat.dmartBrightGreen, pantsMat: this.mat.darkPants, scale: 0.94 });
    const sh2 = this._createCharacter({ shirtMat: this.mat.girlDressPink, pantsMat: this.mat.wallWhite, scale: 0.9 });
    g.add(sh1, sh2);
    this.landmarkActors.push({ plotId, mesh: sh1, mode: "patrol_x", baseX: -2.0, baseZ: 2.8, range: 6.5, speed: 1.15, phase: 0 });
    this.landmarkActors.push({ plotId, mesh: sh2, mode: "enter_z", baseX: 0.5, startZ: 5.0, endZ: 1.8, speed: 0.42, phase: 0.4 });

    g.add(floor, hall, greenCrown, yellowBand, frontGlass, mainSign, pylon, pylonSign, parkLot, supplyTruck);
    g.userData.labelY = 12.6;
    return g;
  },

  /**
   * 🏬 8-PLOT INORBIT MALL (`inorbit_mall` — For @manu_maddyx_46!)
   * Iconic curved modern luxury Indian Mall with glass atrium dome, glowing cyan/gold facade & grand fountain plaza!
   */
  _buildEightPlotInorbitMall(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.glass;

    const floor = new THREE.Mesh(this._boxGeo(33.2, 0.22, 14.4), this.mat.marble);
    floor.position.set(0, 0.14, 0);

    // Main Curved Glass Atrium Center + Left & Right Multi-Floor Luxury Shopping Wings!
    const centerAtrium = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.6, 8.6, 18), winMat);
    centerAtrium.position.set(0, 4.5, -1.6);
    centerAtrium.userData.isWindow = true;
    const atriumDome = new THREE.Mesh(new THREE.SphereGeometry(7.0, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.imaxDomeSilver);
    atriumDome.position.set(0, 8.8, -1.6);
    const domeRing = new THREE.Mesh(new THREE.TorusGeometry(7.15, 0.24, 8, 28), this.mat.inorbitCyanGlow);
    domeRing.rotation.x = Math.PI / 2;
    domeRing.position.set(0, 8.85, -1.6);

    [-10.6, 10.6].forEach((wx, idx) => {
      const wing = new THREE.Mesh(this._boxGeo(10.8, 7.8, 8.8), this.mat.stuccoIvory);
      wing.position.set(wx, 4.1, -2.4);
      const wingGlass = new THREE.Mesh(this._boxGeo(9.4, 5.4, 0.16), winMat);
      wingGlass.position.set(wx, 3.6, 2.08);
      wingGlass.userData.isWindow = true;
      const topTrim = new THREE.Mesh(this._boxGeo(11.2, 0.9, 9.2), this.mat.inorbitNavy);
      topTrim.position.set(wx, 8.2, -2.4);
      const brandBanner = this._makeBuildingBoard(idx === 0 ? "SHOPPERS STOP" : "PVR • FOOD COURT", "LUXURY BRANDS • GAMING", "#0f172a", "#38bdf8", 7.8, 1.45);
      brandBanner.position.set(wx, 6.8, 2.18);
      g.add(wing, wingGlass, topTrim, brandBanner);
    });

    const mallSub = ownerName ? `${ownerName.toUpperCase()} • SHOPPING • DINING • CINEMA` : "LUXURY SHOPPING • INOX • FOOD COURT";
    const mainBoard = this._makeBuildingBoard("INORBIT MALL", mallSub, "#0c4a6e", "#facc15", 13.8, 2.0);
    mainBoard.position.set(0, 9.8, 5.4);

    // Grand Front Entry Fountain + Valet Cars + Animated Mall Shoppers!
    const fPool = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.55, 16), this.mat.marble);
    fPool.position.set(0, 0.45, 5.2);
    const fWat = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.6, 14), this.mat.poolTileBlue);
    fWat.position.set(0, 0.48, 5.2);
    [-11.2, 11.2].forEach((cx, i) => {
      const car = this._makeRealAudiCarMesh(i === 0 ? this.mat.audiWhite : this.mat.audiBlack, false);
      car.position.set(cx, 0.35, 5.0);
      car.rotation.y = i === 0 ? 0.35 : -0.35;
      g.add(car);
    });

    const sh = this._createCharacter({ shirtMat: this.mat.girlDressPurple, pantsMat: this.mat.wallWhite, scale: 0.92 });
    g.add(sh);
    this.landmarkActors.push({ plotId, mesh: sh, mode: "patrol_x", baseX: 0, baseZ: 3.4, range: 7.5, speed: 1.2, phase: 0 });

    g.add(floor, centerAtrium, atriumDome, domeRing, mainBoard, fPool, fWat);
    g.userData.labelY = 16.5;
    return g;
  },

  /**
   * 🎉 8-PLOT GRAND FUNCTION HALL WITH DJ SOUNDS, LIGHTS, FIREWORKS, DRONES & LUNCH (`function_hall` — For @potrugirish!)
   */
  _buildEightPlotFunctionHall(plotId, ownerName = "") {
    const g = new THREE.Group();
    const floor = new THREE.Mesh(this._boxGeo(33.2, 0.22, 14.4), this.mat.marble);
    floor.position.set(0, 0.14, 0);

    // Royal Palace Main Function Hall + Gold Pillars + Festive Marigold Arch!
    const hall = new THREE.Mesh(this._boxGeo(17.5, 6.8, 8.6), this.mat.mansionCreamMarble);
    hall.position.set(-6.5, 3.6, -2.2);
    const hallRoof = new THREE.Mesh(this._boxGeo(18.2, 1.35, 9.2), this.mat.templeRedStripe);
    hallRoof.position.set(-6.5, 7.45, -2.2);
    const goldBorder = new THREE.Mesh(this._boxGeo(18.4, 0.28, 9.35), this.mat.mansionGoldTrim);
    goldBorder.position.set(-6.5, 6.7, -2.2);
    const hallSub = ownerName ? `${ownerName.toUpperCase()} • DJ • DRONES • FIREWORKS • LUNCH` : "DJ SOUNDS • LIGHTS • FIREWORKS • BANQUET LUNCH";
    const hallBoard = this._makeBuildingBoard("GRAND FUNCTION HALL", hallSub, "#991b1b", "#fde047", 15.8, 1.75);
    hallBoard.position.set(-6.5, 7.5, 2.5);

    // OUTDOOR DJ STAGE + GIANT BASS SPEAKER STACKS + ANIMATED DJ + COLORFUL STAGE LIGHTS!
    const djStage = new THREE.Mesh(this._boxGeo(8.2, 1.0, 4.4), this.mat.cinemaObsidian);
    djStage.position.set(-6.5, 0.72, 4.4);
    const djDeck = new THREE.Mesh(this._boxGeo(3.0, 1.15, 0.9), this.mat.cinemaNeonPink);
    djDeck.position.set(-6.5, 1.75, 4.5);
    // Giant Dual Bass Speaker Towers on Both Sides of DJ!
    [-9.8, -3.2].forEach((sx) => {
      const spk = new THREE.Mesh(this._boxGeo(1.4, 3.6, 1.4), this.mat.cinemaObsidian);
      spk.position.set(sx, 2.9, 4.4);
      const cone1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.15, 12), this.mat.cinemaNeonCyan);
      cone1.rotation.x = Math.PI / 2; cone1.position.set(sx, 3.6, 5.12);
      const cone2 = cone1.clone(); cone2.position.y = 2.2;
      g.add(spk, cone1, cone2);
    });
    const djActor = this._createCharacter({ shirtMat: this.mat.cinemaNeonPink, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(djActor);
    this.landmarkActors.push({ plotId, mesh: djActor, mode: "hop", baseX: -6.5, baseZ: 3.6, range: 0.25, speed: 5.0, phase: 0 });

    // RIGHT WING: GRAND OUTDOOR BANQUET LUNCH DINING PAVILION (White-Clothed Tables, Chairs & Buffet!)
    const lunchCanopy = new THREE.Mesh(this._boxGeo(12.2, 0.35, 11.4), this.mat.oyoRed);
    lunchCanopy.position.set(9.2, 4.8, -0.5);
    [[3.6, -5.6], [14.8, -5.6], [3.6, 4.6], [14.8, 4.6]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.6, 6), this.mat.mansionGoldTrim);
      col.position.set(px, 2.45, pz);
      g.add(col);
    });
    const lunchSign = this._makeBuildingBoard("🍽️ GRAND LUNCH & BUFFET", "BIRYANI • SWEETS • DINING HALL", "#15803d", "#fde047", 9.4, 1.15);
    lunchSign.position.set(9.2, 5.4, 5.25);
    // 3 Long Banquet Lunch Tables + Red Chairs + Brass Buffet Dishes!
    [-3.2, 0, 3.2].forEach((tz) => {
      const tbl = new THREE.Mesh(this._boxGeo(7.6, 0.85, 1.45), this.mat.wallWhite);
      tbl.position.set(9.2, 0.65, tz - 0.5);
      const dish1 = new THREE.Mesh(this._boxGeo(0.9, 0.32, 0.6), this.mat.biryaniBrass);
      dish1.position.set(7.2, 1.22, tz - 0.5);
      const dish2 = dish1.clone(); dish2.position.x = 11.2;
      g.add(tbl, dish1, dish2);
    });
    const guest = this._createCharacter({ shirtMat: this.mat.girlDressYellow, pantsMat: this.mat.wallWhite, scale: 0.9 });
    g.add(guest);
    this.landmarkActors.push({ plotId, mesh: guest, mode: "patrol_x", baseX: 9.2, baseZ: 4.5, range: 4.2, speed: 1.1, phase: 0.8 });

    // LIVE ANIMATED WEDDING CAMERA DRONES + FIREWORK SPARKLE STARBURSTS OVERHEAD!
    const drones = [];
    for (let d = 0; d < 2; d++) {
      const dr = new THREE.Group();
      const dBody = new THREE.Mesh(this._boxGeo(0.95, 0.28, 0.95), this.mat.wallWhite);
      const dLed = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), d === 0 ? this.mat.cinemaNeonCyan : this.mat.cinemaNeonPink);
      dLed.position.y = -0.22;
      dr.add(dBody, dLed);
      dr.position.set(0, 10.5 + d * 2.2, 0);
      g.add(dr);
      drones.push({ mesh: dr, radius: 9.5 + d * 3.5, speed: 1.15 + d * 0.4, baseY: 10.5 + d * 2.4, phase: d * Math.PI });
    }
    const fwGroup = new THREE.Group();
    fwGroup.position.set(-4, 13.5, -2);
    const fwColors = [this.mat.cinemaNeonPink, this.mat.cinemaNeonCyan, this.mat.wineNeonGold, this.mat.medCrossGlow];
    for (let s = 0; s < 12; s++) {
      const a = (s / 12) * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), fwColors[s % fwColors.length]);
      sp.position.set(Math.cos(a) * 3.8, Math.sin(a) * 2.4, Math.sin(a * 2) * 2.2);
      fwGroup.add(sp);
    }
    g.add(fwGroup);
    this.v37Animations.push({ plotId, type: "function_hall", drones, fwGroup });

    // Attach Sky Disco Lights too!
    this._attachSkyDiscoLights(g, plotId, 11.2, 8.2);

    g.add(floor, hall, hallRoof, goldBorder, hallBoard, djStage, djDeck, lunchCanopy, lunchSign);
    g.userData.labelY = 15.2;
    return g;
  },

  /**
   * 🎮 4-PLOT FREE FIRE (FF) 3-FLOOR OFFICE HQ (`ff_office` — For @just_naveen_8143!)
   * 3 Modern Gaming Floors + LIVE Animated FF Gameplay Display Screen + 3 Stylized FF Characters Outside!
   */
  _buildFourPlotFFOffice(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.darkGlass;

    // 3-Floor Sleek Black-Glass & Orange-Gold Esports HQ Tower
    const body = new THREE.Mesh(this._boxGeo(11.8, 10.6, 7.6), this.mat.cinemaObsidian);
    body.position.set(0, 5.4, -2.0);
    for (let f = 0; f < 3; f++) {
      const fy = 2.2 + f * 3.1;
      const winBand = new THREE.Mesh(this._boxGeo(10.6, 1.9, 0.16), winMat);
      winBand.position.set(0, fy, 1.85);
      winBand.userData.isWindow = true;
      const neonSlab = new THREE.Mesh(this._boxGeo(12.2, 0.22, 8.0), f === 1 ? this.mat.ffOrangeGlow : this.mat.cinemaNeonCyan);
      neonSlab.position.set(0, fy - 1.15, -2.0);
      g.add(winBand, neonSlab);
    }
    const roofSign = this._makeBuildingBoard(ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} • FF HQ` : "GARENA FREE FIRE HQ", "3 FLOORS • BOOYAH! ESPORTS OFFICE", "#09090b", "#f97316", 11.2, 1.6);
    roofSign.position.set(0, 11.6, 1.8);

    // GIANT LIVE ANIMATED FREE FIRE GAMEPLAY DISPLAY SCREEN ON THE FACADE!
    const gpCanvas = document.createElement("canvas");
    gpCanvas.width = 256;
    gpCanvas.height = 144;
    const gpCtx = gpCanvas.getContext("2d");
    const gpTex = new THREE.CanvasTexture(gpCanvas);
    gpTex.colorSpace = THREE.SRGBColorSpace;
    const drawFFScreen = (t) => {
      gpCtx.fillStyle = "#0b1120";
      gpCtx.fillRect(0, 0, 256, 144);
      // Bermuda green map & safe zone circle
      gpCtx.fillStyle = "#15803d";
      gpCtx.fillRect(10, 10, 236, 124);
      gpCtx.strokeStyle = "#38bdf8";
      gpCtx.lineWidth = 3;
      const zr = 22 + Math.abs(Math.sin(t * 0.8)) * 28;
      gpCtx.beginPath(); gpCtx.arc(128, 72, zr, 0, Math.PI * 2); gpCtx.stroke();
      // Moving Crosshair & Action Shot Flash!
      const cx = 128 + Math.sin(t * 2.4) * 44;
      const cy = 72 + Math.cos(t * 1.9) * 24;
      gpCtx.strokeStyle = "#ef4444";
      gpCtx.lineWidth = 2;
      gpCtx.beginPath(); gpCtx.arc(cx, cy, 12, 0, Math.PI * 2); gpCtx.stroke();
      gpCtx.fillStyle = "#facc15";
      gpCtx.font = "900 22px sans-serif";
      gpCtx.textAlign = "center";
      gpCtx.fillText(Math.floor(t) % 4 === 0 ? "🔥 BOOYAH! #1 🔥" : "FREE FIRE • LIVE MATCH", 128, 28);
      gpCtx.fillStyle = "#ffffff";
      gpCtx.font = "800 13px sans-serif";
      gpCtx.fillText(`ALIVE: ${12 - (Math.floor(t) % 11)}  •  KILLS: ${4 + (Math.floor(t) % 8)}`, 128, 126);
      gpTex.needsUpdate = true;
    };
    drawFFScreen(0);

    const screenFrame = new THREE.Mesh(this._boxGeo(7.6, 4.4, 0.3), this.mat.mansionGoldTrim);
    screenFrame.position.set(0, 6.2, 2.02);
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.1, 3.9), new THREE.MeshBasicMaterial({ map: gpTex }));
    screenMesh.position.set(0, 6.2, 2.2);
    this.v37Animations.push({ plotId, type: "ff_screen", drawFFScreen, acc: 0 });

    // 3 STYLIZED FREE FIRE CHARACTERS OUTSIDE (Alok with Green Healing Aura + Kelly + Chrono Energy Shield!)
    const alok = this._createCharacter({ shirtMat: this.mat.cinemaObsidian, pantsMat: this.mat.darkPants, scale: 1.0 });
    alok.position.set(-3.4, 0.2, 4.2);
    const alokRing = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.15, 16), this.mat.medCrossGlow);
    alokRing.rotation.x = -Math.PI / 2;
    alokRing.position.set(-3.4, 0.24, 4.2);

    const chrono = this._createCharacter({ shirtMat: this.mat.mobileBlue, pantsMat: this.mat.darkPants, scale: 1.0 });
    chrono.position.set(3.4, 0.2, 4.2);
    const chronoDome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.glass);
    chronoDome.position.set(3.4, 0.2, 4.2);

    const kelly = this._createCharacter({ shirtMat: this.mat.petrolYellow, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(alok, alokRing, chrono, chronoDome, kelly);
    this.landmarkActors.push({ plotId, mesh: kelly, mode: "patrol_x", baseX: 0, baseZ: 4.8, range: 2.2, speed: 1.65, phase: 0 });

    g.add(body, roofSign, screenFrame, screenMesh);
    g.userData.labelY = 13.6;
    return g;
  },

  /**
   * 🛕 4-PLOT SRI AYYAPPA SWAMY TEMPLE WITH 18 GOLDEN STEPS & AYYAPPA DEVOTEES GOING UP (`ayyappa_temple` — For @abhi479992!)
   */
  _buildFourPlotAyyappaTemple(plotId, ownerName = "") {
    const g = new THREE.Group();
    const base = new THREE.Mesh(this._boxGeo(13.8, 0.24, 13.8), this.mat.marble);
    base.position.set(0, 0.14, 0);

    // Raised Sabarimala Sanctum Platform (y = 3.2) + Authentic Kerala Sloped Golden-Copper Roof (Sreekovil)!
    const podium = new THREE.Mesh(this._boxGeo(11.6, 3.2, 7.6), this.mat.teakWood);
    podium.position.set(0, 1.75, -2.6);
    const sanctum = new THREE.Mesh(this._boxGeo(7.6, 3.2, 5.6), this.mat.mansionCreamMarble);
    sanctum.position.set(0, 4.9, -2.8);
    const roof1 = new THREE.Mesh(new THREE.ConeGeometry(6.8, 2.5, 4), this.mat.templeGold);
    roof1.rotation.y = Math.PI / 4;
    roof1.position.set(0, 7.6, -2.8);
    const roof2 = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.9, 4), this.mat.templeGold);
    roof2.rotation.y = Math.PI / 4;
    roof2.position.set(0, 9.4, -2.8);
    const kalasam = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.2, 8), this.mat.templeGold);
    kalasam.position.set(0, 10.75, -2.8);

    // ICONIC PATHINETTAM PADI (18 SACRED GOLDEN STEPS!) Leading Up Front to Sanctum!
    const stepCount = 12;
    for (let s = 0; s < stepCount; s++) {
      const f = s / (stepCount - 1);
      const st = new THREE.Mesh(this._boxGeo(3.8, 0.28, 0.45), this.mat.templeGold);
      st.position.set(0, 0.32 + f * 3.0, 5.8 - f * 4.4);
      g.add(st);
    }
    // Side Golden Railings + Glowing Brass Deepam Lamps on both sides of the 18 Steps!
    [-2.15, 2.15].forEach((rx) => {
      const rail = new THREE.Mesh(this._boxGeo(0.24, 0.72, 5.6), this.mat.templeGold);
      rail.position.set(rx, 2.05, 3.6);
      rail.rotation.x = 0.62;
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 1.2, 6), this.mat.templeGold);
      lamp.position.set(rx * 1.5, 0.85, 5.8);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), this.mat.templeLampGlow);
      flame.position.set(rx * 1.5, 1.6, 5.8);
      g.add(rail, lamp, flame);
    });

    const ayyBoard = this._makeBuildingBoard("SWAMIYE SARANAM AYYAPPA", ownerName ? `18 GOLDEN STEPS • ${ownerName.toUpperCase()}` : "SRI AYYAPPA SWAMY TEMPLE • 18 STEPS", "#111827", "#facc15", 10.6, 1.35);
    ayyBoard.position.set(0, 4.3, 1.3);

    // 6 ANIMATED AYYAPPA SWAMIS (BLACK DHOTI + BLACK SHIRT + SACRED IRUMUDI ON HEAD!) CLIMBING THE 18 GOLDEN STEPS!
    const swamis = [];
    for (let k = 0; k < 6; k++) {
      const sw = this._createCharacter({ shirtMat: this.mat.ramSuitBlack, pantsMat: this.mat.ramSuitBlack, scale: 0.9 });
      const irumudi = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.34), this.mat.templeSaffron);
      irumudi.position.y = 1.98;
      sw.add(irumudi);
      g.add(sw);
      swamis.push({ mesh: sw, laneX: -1.0 + (k % 3) * 1.0, phase: k / 6, speed: 0.16 });
    }
    this.v37Animations.push({ plotId, type: "ayyappa_steps", swamis });

    g.add(base, podium, sanctum, roof1, roof2, kalasam, ayyBoard);
    g.userData.labelY = 12.6;
    return g;
  },

  /**
   * 🏍️ 4-PLOT YAMAHA RACING SHOWROOM (`yamaha_showroom` — For @abhi479992!)
   */
  _buildFourPlotYamahaShowroom(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.glass;

    const floor = new THREE.Mesh(this._boxGeo(13.6, 0.18, 13.6), this.mat.marble);
    floor.position.set(0, 0.12, 0);
    const hall = new THREE.Mesh(this._boxGeo(12.6, 5.2, 7.6), this.mat.wallWhite);
    hall.position.set(0, 2.75, -2.4);
    const blueCrown = new THREE.Mesh(this._boxGeo(13.0, 1.45, 8.0), this.mat.yamahaBlue);
    blueCrown.position.set(0, 5.85, -2.4);
    const frontGlass = new THREE.Mesh(this._boxGeo(11.4, 3.8, 0.14), winMat);
    frontGlass.position.set(0, 2.2, 1.44);
    frontGlass.userData.isWindow = true;

    const makeR15 = (colMat) => {
      const bk = new THREE.Group();
      const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.18, 10); wGeo.rotateZ(Math.PI / 2);
      const wF = new THREE.Mesh(wGeo, this.mat.wheelBlack); wF.position.set(0, 0.35, 0.72);
      const wB = wF.clone(); wB.position.z = -0.72;
      const body = new THREE.Mesh(this._boxGeo(0.42, 0.48, 1.45), colMat); body.position.set(0, 0.72, 0.05);
      const visor = new THREE.Mesh(this._boxGeo(0.36, 0.3, 0.38), this.mat.darkGlass); visor.position.set(0, 1.05, 0.56);
      const hl = new THREE.Mesh(this._boxGeo(0.32, 0.14, 0.1), this.mat.floodlightGlow); hl.position.set(0, 0.85, 0.8);
      bk.add(wF, wB, body, visor, hl);
      return bk;
    };

    const roofDeck = new THREE.Group();
    roofDeck.position.set(0, 6.75, -1.6);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.28, 16), this.mat.yamahaBlue);
    const ledRing = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.38, 18), this.mat.cinemaNeonCyan);
    ledRing.rotation.x = -Math.PI / 2; ledRing.position.y = 0.16;
    const heroR15 = makeR15(this.mat.yamahaBlue);
    heroR15.scale.setScalar(1.65); heroR15.position.y = 0.16;
    roofDeck.add(disc, ledRing, heroR15);
    g.add(roofDeck);
    this.turntableRotors.push({ plotId, mesh: roofDeck, speed: 0.95 });

    [this.mat.yamahaBlue, this.mat.cinemaObsidian, this.mat.wallWhite, this.mat.bikeRacingRed].forEach((m, i) => {
      const b = makeR15(m);
      b.position.set(-4.2 + i * 2.8, 0.22, 3.8);
      b.rotation.y = i < 2 ? 0.35 : -0.35;
      g.add(b);
    });

    const yTitle = ownerName ? `YAMAHA • ${ownerName.replace(/^@/, "").toUpperCase()}` : "YAMAHA RACING SHOWROOM";
    const yBoard = this._makeBuildingBoard(yTitle, "R15 V4 • MT-15 • FZ • REVS YOUR HEART", "#0033a0", "#ffffff", 11.6, 1.45);
    yBoard.position.set(0, 5.85, 1.66);

    const rider = this._createCharacter({ shirtMat: this.mat.yamahaBlue, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(rider);
    this.landmarkActors.push({ plotId, mesh: rider, mode: "patrol_x", baseX: 0, baseZ: 5.4, range: 3.8, speed: 1.15, phase: 0 });

    g.add(floor, hall, blueCrown, frontGlass, yBoard);
    g.userData.labelY = 10.6;
    return g;
  },

  /**
   * ⚡ 4-PLOT STARK TOWER — AVENGERS SKYSCRAPER (`stark_tower` — For @_harsha._7!)
   */
  _buildFourPlotStarkTower(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.glass;

    // Towering Futuristic Tapered Stark Skyscraper (30 units tall!)
    const podium = new THREE.Mesh(this._boxGeo(12.2, 4.5, 10.6), this.mat.appleSilver);
    podium.position.set(0, 2.35, -0.8);
    const midShaft = new THREE.Mesh(this._boxGeo(8.8, 13.5, 7.6), this.mat.darkGlass);
    midShaft.position.set(0, 11.2, -1.2);
    midShaft.userData.isWindow = true;
    const upperShaft = new THREE.Mesh(this._boxGeo(6.4, 11.5, 5.8), winMat);
    upperShaft.position.set(-0.6, 23.2, -1.4);
    upperShaft.userData.isWindow = true;

    // Signature Diagonal Slanted Glass Crown Peak!
    const topCap = new THREE.Mesh(this._boxGeo(6.6, 4.2, 6.0), this.mat.appleSilver);
    topCap.position.set(-0.6, 29.8, -1.4);
    topCap.rotation.z = -0.22;

    // Iconic Cantilevered Iron Man Landing Pad jutting out from Upper Tower!
    const padDeck = new THREE.Mesh(this._boxGeo(7.2, 0.45, 5.2), this.mat.appleSilver);
    padDeck.position.set(3.2, 22.8, -1.4);
    const arcRing = new THREE.Mesh(new THREE.RingGeometry(1.4, 2.0, 20), this.mat.starkArcGlow);
    arcRing.rotation.x = -Math.PI / 2;
    arcRing.position.set(4.5, 23.06, -1.4);

    // Glowing Cyan Arc Reactor Vertical Accent Ribs!
    [-4.45, 4.45].forEach((rx) => {
      const rib = new THREE.Mesh(this._boxGeo(0.28, 22.0, 0.35), this.mat.starkArcGlow);
      rib.position.set(rx, 13.5, 2.65);
      g.add(rib);
    });

    const sBoard = this._makeBuildingBoard("S T A R K", ownerName ? `${ownerName.toUpperCase()} • AVENGERS TOWER` : "AVENGERS • STARK TOWER", "#020617", "#38bdf8", 7.8, 1.75);
    sBoard.position.set(-0.6, 26.8, 1.6);
    const sBoardBack = sBoard.clone();
    sBoardBack.rotation.y = Math.PI;
    sBoardBack.position.z = -4.4;

    g.add(podium, midShaft, upperShaft, topCap, padDeck, arcRing, sBoard, sBoardBack);
    g.userData.labelY = 34.0;
    return g;
  },

  /**
   * 🛒 4-PLOT LC MART HYPERMARKET (`lc_mart` — For @lalithadithya13!)
   */
  _buildFourPlotLCMart(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.glass;

    const body = new THREE.Mesh(this._boxGeo(12.6, 5.0, 7.6), this.mat.wallWhite);
    body.position.set(0, 2.6, -2.2);
    const lcCrown = new THREE.Mesh(this._boxGeo(13.0, 1.65, 8.0), this.mat.inorbitNavy);
    lcCrown.position.set(0, 5.75, -2.2);
    const redTrim = new THREE.Mesh(this._boxGeo(13.15, 0.28, 8.15), this.mat.oyoRed);
    redTrim.position.set(0, 4.9, -2.2);
    const frontGlass = new THREE.Mesh(this._boxGeo(11.0, 3.4, 0.14), winMat);
    frontGlass.position.set(0, 2.0, 1.66);
    frontGlass.userData.isWindow = true;

    [-3.5, 0, 3.5].forEach((ax, i) => {
      const sh = new THREE.Mesh(this._boxGeo(0.9, 2.2, 3.8), [this.mat.oyoRed, this.mat.dmartYellow, this.mat.mobileBlue][i]);
      sh.position.set(ax, 1.35, -1.6);
      g.add(sh);
    });

    const lcSub = ownerName ? `${ownerName.toUpperCase()} • FRESH GROCERIES & SUPERMARKET` : "FRESH GROCERIES • DAILY NEEDS • SUPERMARKET";
    const lcBoard = this._makeBuildingBoard("LC MART", lcSub, "#0c4a6e", "#facc15", 11.4, 1.5);
    lcBoard.position.set(0, 5.75, 1.88);

    const park = new THREE.Mesh(this._boxGeo(13.0, 0.1, 3.6), this.mat.tarmacGrey);
    park.position.set(0, 0.14, 4.9);
    const car = this._makeVehicleMesh(false, false, 0x3b82f6, false);
    car.position.set(-3.8, 0.2, 4.9);
    const cart = new THREE.Mesh(this._boxGeo(0.75, 0.85, 1.05), this.mat.cartChrome);
    cart.position.set(3.8, 0.6, 2.6);

    const buyer = this._createCharacter({ shirtMat: this.mat.oyoRed, pantsMat: this.mat.darkPants, scale: 0.92 });
    g.add(buyer);
    this.landmarkActors.push({ plotId, mesh: buyer, mode: "patrol_x", baseX: 0, baseZ: 3.1, range: 3.6, speed: 1.1, phase: 0 });

    g.add(body, lcCrown, redTrim, frontGlass, lcBoard, park, car, cart);
    g.userData.labelY = 9.8;
    return g;
  },

  /**
   * 🍸 4-PLOT ROYAL BAR & RESTO LOUNGE (`bar_lounge` — For @potrugirish!)
   */
  _buildFourPlotBarLounge(plotId, ownerName = "") {
    const g = new THREE.Group();
    const body = new THREE.Mesh(this._boxGeo(12.4, 5.2, 7.4), this.mat.mansionBlackMarble);
    body.position.set(0, 2.7, -2.2);
    const neonPink = new THREE.Mesh(this._boxGeo(12.7, 0.22, 7.7), this.mat.cinemaNeonPink);
    neonPink.position.set(0, 5.35, -2.2);
    const neonCyan = new THREE.Mesh(this._boxGeo(12.7, 0.22, 7.7), this.mat.cinemaNeonCyan);
    neonCyan.position.set(0, 4.5, -2.2);
    const frontGlass = new THREE.Mesh(this._boxGeo(10.6, 3.2, 0.14), this.mat.darkGlass);
    frontGlass.position.set(0, 2.0, 1.56);

    // Rooftop Giant Glowing 3D Neon Cocktail Glass Emblem!
    const glassGrp = new THREE.Group();
    glassGrp.position.set(-4.2, 7.6, -0.5);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.0, 8), this.mat.cinemaNeonCyan);
    const bowl = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.45, 14), this.mat.cinemaNeonPink);
    bowl.rotation.x = Math.PI; bowl.position.y = 1.45;
    const baseD = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.14, 12), this.mat.cinemaNeonCyan);
    baseD.position.y = -1.0;
    glassGrp.add(stem, bowl, baseD);
    g.add(glassGrp);
    this.turntableRotors.push({ plotId, mesh: glassGrp, speed: 0.85 });

    const bTitle = ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} BAR` : "ROYAL BAR & LOUNGE";
    const bBoard = this._makeBuildingBoard(bTitle, "MUSIC • COCKTAILS • VIP RESTO BAR", "#09090b", "#ec4899", 11.2, 1.45);
    bBoard.position.set(0, 5.05, 1.68);
    const carpet = new THREE.Mesh(this._boxGeo(2.8, 0.12, 3.4), this.mat.oyoRed);
    carpet.position.set(0, 0.16, 3.2);
    const car = this._makeRealAudiCarMesh(this.mat.audiBlack, false);
    car.position.set(4.2, 0.25, 4.8);

    const bouncer = this._createCharacter({ shirtMat: this.mat.ramSuitBlack, pantsMat: this.mat.ramSuitBlack, scale: 0.96 });
    g.add(bouncer);
    this.landmarkActors.push({ plotId, mesh: bouncer, mode: "guard", baseX: -1.9, baseZ: 2.6, range: 0, speed: 1.0, phase: 0 });

    g.add(body, neonPink, neonCyan, frontGlass, bBoard, carpet, car);
    g.userData.labelY = 10.6;
    return g;
  },

  /**
   * 🚨 2-PLOT COASTAL LIGHT HOUSE (`light_house` — For @_mammy_little_princess_630!)
   * Tall Red-and-White Striped Lighthouse with Keeper's Cottage & LIVE 360° ROTATING SEARCHLIGHT BEAM!
   */
  _buildTwoPlotLightHouse(plotId, ownerName = "") {
    const g = new THREE.Group();

    // Rocky Granite Base + Charming White-Roofed Keeper's Cottage!
    const rockBase = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.2, 1.4, 12), this.mat.mountainRock);
    rockBase.position.set(-2.4, 0.75, 0);
    const cottage = new THREE.Mesh(this._boxGeo(5.2, 2.8, 4.2), this.mat.wallWhite);
    cottage.position.set(3.2, 1.5, 0);
    const cRoof = new THREE.Mesh(new THREE.ConeGeometry(4.0, 1.7, 4), this.mat.roofRed);
    cRoof.rotation.y = Math.PI / 4; cRoof.position.set(3.2, 3.75, 0);

    // Tall Alternating Red-and-White Tapered Lighthouse Tower (17 units high!)
    const towerBands = [
      { y: 2.6, h: 2.6, rT: 1.95, rB: 2.25, mat: this.mat.wallWhite },
      { y: 5.2, h: 2.6, rT: 1.7,  rB: 1.95, mat: this.mat.oyoRed },
      { y: 7.8, h: 2.6, rT: 1.45, rB: 1.7,  mat: this.mat.wallWhite },
      { y: 10.4, h: 2.6, rT: 1.25, rB: 1.45, mat: this.mat.oyoRed },
      { y: 12.8, h: 2.2, rT: 1.15, rB: 1.25, mat: this.mat.wallWhite }
    ];
    towerBands.forEach((b) => {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(b.rT, b.rB, b.h, 14), b.mat);
      seg.position.set(-2.4, b.y, 0);
      g.add(seg);
    });

    // Observation Gallery Balcony + Glass Lantern Room + Red Cupola Dome!
    const gallery = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.5, 0.35, 14), this.mat.cinemaObsidian);
    gallery.position.set(-2.4, 14.0, 0);
    const lanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.9, 12), this.mat.mansionWarmGlow);
    lanternGlass.position.set(-2.4, 15.1, 0);
    const dome = new THREE.Mesh(new THREE.ConeGeometry(1.35, 1.4, 12), this.mat.oyoRed);
    dome.position.set(-2.4, 16.7, 0);

    // LIVE 360° ROTATING DUAL VOLUMETRIC LIGHTHOUSE SEARCHLIGHT BEAMS!
    const beamPivot = new THREE.Group();
    beamPivot.position.set(-2.4, 15.1, 0);
    const beamGeo = new THREE.ConeGeometry(3.8, 28.0, 12, 1, true);
    beamGeo.rotateX(Math.PI / 2);
    beamGeo.translate(0, 0, 14.0);
    const beamF = new THREE.Mesh(beamGeo, this.mat.divineGoldGlow);
    const beamB = beamF.clone();
    beamB.rotation.y = Math.PI;
    beamPivot.add(beamF, beamB);
    g.add(beamPivot);
    this.turntableRotors.push({ plotId, mesh: beamPivot, speed: 1.15 });

    const lhTitle = ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} LIGHTHOUSE` : "COASTAL LIGHT HOUSE";
    const lhBoard = this._makeBuildingBoard(lhTitle, "360° ROTATING SEA BEACON", "#0f172a", "#fde047", 5.0, 0.95);
    lhBoard.position.set(3.2, 2.8, 2.2);

    g.add(rockBase, cottage, cRoof, gallery, lanternGlass, dome, lhBoard);
    g.userData.labelY = 19.2;
    return g;
  }
};
