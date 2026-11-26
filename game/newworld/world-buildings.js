import * as THREE from "three";
import { BUILDING_LABELS } from "./world-constants.js?v=37";

export const buildingMethods = {
  _getLandmarkSubtitle(type) {
    const map = {
      school: "పాఠశాల • GRAND SCHOOL",
      hospital: "ఆసుపత్రి • SUPER HOSPITAL",
      bus_stand: "బస్ స్టాండ్ • APSRTC TERMINAL",
      auto_stand: "ఆటో స్టాండ్ • TRANSPORT OFFICE",
      ground: "గ్రౌండ్ • CRICKET STADIUM",
      police_station: "పోలీస్ స్టేషన్ • POLICE HQ",
      petrol_bunk: "పెట్రోల్ బంక్ • FUEL PLAZA",
      srmt_mall: "SRMT మాల్ • SRMT MALL",
      apple_store: "ఆపిల్ స్టోర్ • APPLE STORE",
      reliance_store: "రిలయన్స్ • RELIANCE DIGITAL",
      audi_showroom: "ఆడి షోరూమ్ • AUDI LUXURY MOTORS",
      gym: "జిమ్ • PERSONAL FITNESS CLUB",
      photo_studio: "ఫోటో స్టూడియో • PHOTO & 4K VIDEO",
      iti_college: "ఐటిఐ కాలేజ్ • ITI TECHNICAL COLLEGE",
      movie_theater: "మూవీ థియేటర్ • IMAX MULTIPLEX",
      dmart: "డి-మార్ట్ • DAILY DISCOUNTS • DAILY SAVINGS",
      imax_theater: "ఐమాక్స్ 3D • GIANT SCREEN IMAX DOME",
      beach_villa_2: "🏖️ LUXURY MEGA BEACH VILLA",
      mobile_showroom: "📱 మొబైల్ షోరూమ్ • 5G SMARTPHONES",
      beauty_parlour: "💄 బ్యూటీ పార్లర్ • LUXURY SALON & SPA",
      light_house: "🚨 లైట్ హౌస్ • 360° SEA BEACON",
      swamy_school: "🏫 స్వామి ఇంగ్లీష్ మీడియం హై స్కూల్",
      dmart_mega: "🛒 మెగా డి-మార్ట్ • 8-PLOT HYPERMARKET",
      inorbit_mall: "🏬 ఇనార్బిట్ మాల్ • LUXURY MALL",
      function_hall: "🎉 ఫంక్షన్ హాల్ • DJ • DRONES • LUNCH",
      ff_office: "🎮 గరీనా ఫ్రీ ఫైర్ • 3-FLOOR HQ",
      ayyappa_temple: "🛕 శ్రీ అయ్యప్ప స్వామి • 18 GOLDEN STEPS",
      yamaha_showroom: "🏍️ యమహా రేసింగ్ షోరూమ్ • R15 & MT-15",
      stark_tower: "⚡ అవెంజర్స్ స్టార్క్ టవర్ • SKYSCRAPER",
      lc_mart: "🛒 ఎల్‌సి మార్ట్ • SUPERMARKET",
      bar_lounge: "🍸 రాయల్ బార్ & రెస్టో లాంజ్",
      tirumala_temple: "🛕 తిరుమల శ్రీ వెంకటేశ్వర స్వామి దేవస్థానం",
      hotel_oyo: "🏨 20-FLOOR OYO ROOMS • LUXURY SUITES",
      hostel: "🏢 బాయ్స్ & గర్ల్స్ హాస్టల్ • AC & WIFI",
      wine_shop: "🍾 రాయల్ వైన్స్ • WINES & SPIRITS",
      box_cricket: "🏏 బాక్స్ క్రికెట్ • FLOODLIT TURF ARENA",
      bike_showroom: "🏍️ సూపర్ బైక్ షోరూమ్ • GT650 & EV",
      city_park: "🌳 సెంట్రల్ సిటీ పార్క్ • FOUNTAIN & GARDEN",
      library: "📚 సెంట్రల్ లైబ్రరీ • PUBLIC LIBRARY",
      swimming_pool: "🏊 ఒలింపిక్ స్విమ్మింగ్ పూల్ • CLUB",
      mahindra_showroom: "🚙 మహీంద్రా షోరూమ్ • THAR & XUV700",
      bmw_showroom: "🏎️ బిఎండబ్ల్యూ • SHEER DRIVING PLEASURE"
    };
    return map[type] || "";
  },

  _buildEmptyPlotMesh() {
    const g = new THREE.Group();
    const s = this.PLOT_SIZE - 0.7;
    const f1 = new THREE.Mesh(this.geo.fenceH, this.mat.wood);
    f1.position.set(0, 0.325, -s / 2);
    const f2 = new THREE.Mesh(this.geo.fenceH, this.mat.wood);
    f2.position.set(0, 0.325, s / 2);
    const f3 = new THREE.Mesh(this.geo.fenceV, this.mat.wood);
    f3.position.set(-s / 2, 0.325, 0);
    const f4 = new THREE.Mesh(this.geo.fenceV, this.mat.wood);
    f4.position.set(s / 2, 0.325, 0);

    const post = new THREE.Mesh(this.geo.post, this.mat.wood);
    post.position.set(0, 0.6, 0);
    const board = new THREE.Mesh(this.geo.board, this.mat.wallWhite);
    board.position.set(0, 1.05, 0.05);

    g.add(f1, f2, f3, f4, post, board);
    return g;
  },

  _buildOnePlotBuilding(type, ownerName = "", plotId = null) {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;

    // --- NEW 5-FLOOR MODERN TOWERS (Optional, Lightweight Shared Geometries) ---
    if (type === "tower_brick") {
      const floors = 5;
      const fh = 1.28;
      const totalH = floors * fh + 0.8;

      const core = new THREE.Mesh(this.geo.towerCore5, this.mat.wallWhite);
      core.position.set(0, 0.8 + (floors * fh) / 2, -0.3);
      const brickSpine = new THREE.Mesh(new THREE.BoxGeometry(1.15, floors * fh + 0.4, 0.42), this.mat.brickRed);
      brickSpine.position.set(-0.35, 0.8 + (floors * fh) / 2 + 0.15, 1.85);
      g.add(core, brickSpine);

      for (let f = 0; f < floors; f++) {
        const y = 0.9 + f * fh;
        const slab = new THREE.Mesh(this.geo.towerSlab, this.mat.wallWhite);
        slab.position.set(0, y, 2.02);
        const winL = new THREE.Mesh(this.geo.towerWinL, winMat);
        winL.position.set(-1.55, y + 0.5, 1.78);
        winL.userData.isWindow = true;
        const railL = new THREE.Mesh(this.geo.towerRailL, this.mat.glass);
        railL.position.set(-1.55, y + 0.26, 2.38);
        const winR = new THREE.Mesh(this.geo.towerWinR, winMat);
        winR.position.set(1.2, y + 0.5, 1.78);
        winR.userData.isWindow = true;
        const plantR = new THREE.Mesh(this.geo.towerPlantR, this.mat.balconyPlant);
        plantR.position.set(1.2, y + 0.22, 2.34);
        g.add(slab, winL, railL, winR, plantR);
      }
      g.userData.labelY = totalH + 2.0;
      return g;
    }

    if (type === "tower_cube") {
      const floors = 5;
      const fh = 1.32;
      const totalH = floors * fh + 0.6;
      const core = new THREE.Mesh(new THREE.BoxGeometry(3.8, totalH, 3.8), this.mat.darkGlass);
      core.position.set(0, totalH / 2 + 0.1, -0.2);
      g.add(core);

      for (let f = 0; f < floors; f++) {
        const y = 0.75 + f * fh;
        const shiftX = f % 2 === 0 ? -0.55 : 0.55;
        const cube = new THREE.Mesh(this.geo.cubeBlock, f % 2 === 0 ? this.mat.wallWarmStone : this.mat.wallWhite);
        cube.position.set(shiftX, y, f % 3 === 0 ? 0.4 : -0.1);
        const glassCorner = new THREE.Mesh(this.geo.cubeGlass, winMat);
        glassCorner.position.set(-shiftX * 1.15, y, 1.78);
        glassCorner.userData.isWindow = true;
        const balc = new THREE.Mesh(this.geo.cubeBalc, this.mat.wallWhite);
        balc.position.set(-shiftX * 1.15, y - fh * 0.4, 2.02);
        g.add(cube, glassCorner, balc);
      }
      g.userData.labelY = totalH + 2.2;
      return g;
    }

    if (type === "tower_led") {
      const floors = 5;
      const fh = 1.42;
      const totalH = floors * fh + 0.5;

      const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, totalH, 4.2), this.mat.wallCream);
      body.position.set(0, totalH / 2 + 0.1, -0.2);
      const stonePillar = new THREE.Mesh(new THREE.BoxGeometry(1.05, totalH + 0.25, 0.55), this.mat.stoneDark);
      stonePillar.position.set(-1.85, totalH / 2 + 0.18, 2.02);
      const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, totalH - 0.3, 0.12), this.mat.ledStripNight);
      ledStrip.position.set(-1.85, totalH / 2 + 0.18, 2.31);
      const woodPanel = new THREE.Mesh(new THREE.BoxGeometry(0.9, totalH - 0.5, 0.35), this.mat.darkWood);
      woodPanel.position.set(-0.85, totalH / 2 + 0.1, 1.98);
      g.add(body, stonePillar, ledStrip, woodPanel);

      for (let f = 0; f < floors; f++) {
        const y = 0.85 + f * fh;
        const frame = new THREE.Mesh(this.geo.ledFrame, this.mat.wallWhite);
        frame.position.set(0.95, y - 0.52, 2.15);
        const win = new THREE.Mesh(this.geo.ledWin, winMat);
        win.position.set(0.95, y, 1.92);
        win.userData.isWindow = true;
        const rail = new THREE.Mesh(this.geo.ledRail, this.mat.glass);
        rail.position.set(0.95, y - 0.24, 2.52);
        const bush = new THREE.Mesh(this.geo.ledBush, this.mat.balconyPlant);
        bush.position.set(1.85, y - 0.24, 2.32);
        g.add(frame, win, rail, bush);
      }
      g.userData.labelY = totalH + 2.1;
      return g;
    }

    if (type === "tower_gold") {
      const floors = 6;
      const fh = 1.28;
      const totalH = floors * fh + 0.5;
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, totalH, 4.2), this.mat.charcoal);
      body.position.set(0, totalH / 2 + 0.1, -0.2);
      g.add(body);

      for (let f = 0; f < floors; f++) {
        const y = 0.85 + f * fh;
        const goldTrim = new THREE.Mesh(this.geo.goldTrim, this.mat.gold);
        goldTrim.position.set(0, y - 0.5, -0.15);
        const wrapWin = new THREE.Mesh(this.geo.goldWin, winMat);
        wrapWin.position.set(0, y, 1.94);
        wrapWin.userData.isWindow = true;
        g.add(goldTrim, wrapWin);
      }
      g.userData.labelY = totalH + 2.2;
      return g;
    }

    // --- LOCAL TEA & TIFFIN SHOP ---
    if (type === "biryani_point") {
      // 🍲 1-PLOT HYDERABADI DUM BIRYANI & FAST FOOD POINT
      const body = new THREE.Mesh(this._boxGeo(5.2, 3.2, 4.4), this.mat.wallCream);
      body.position.set(0, 1.65, -0.35);
      const topBand = new THREE.Mesh(this._boxGeo(5.45, 0.9, 4.65), this.mat.biryaniOrange);
      topBand.position.set(0, 3.55, -0.35);
      const goldTrim = new THREE.Mesh(this._boxGeo(5.52, 0.16, 4.72), this.mat.richGoldTrim);
      goldTrim.position.set(0, 3.05, -0.35);

      const awning = new THREE.Mesh(this._boxGeo(5.0, 0.24, 1.5), this.mat.templeRedStripe);
      awning.position.set(0, 2.58, 2.3);
      awning.rotation.x = 0.24;
      const counter = new THREE.Mesh(this._boxGeo(3.8, 1.0, 0.8), this.mat.biryaniBrass);
      counter.position.set(0, 0.58, 1.85);

      const handiPot = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), this.mat.biryaniBrass);
      handiPot.scale.set(1.15, 0.82, 1.15);
      handiPot.position.set(0, 4.75, -0.25);
      const handiRim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.14, 6, 14), this.mat.richGoldTrim);
      handiRim.rotation.x = Math.PI / 2;
      handiRim.position.set(0, 5.45, -0.25);
      const steam1 = new THREE.Mesh(new THREE.SphereGeometry(0.36, 7, 7), this.mat.biryaniSteam);
      steam1.position.set(-0.22, 6.05, -0.25);
      const steam2 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 7, 7), this.mat.biryaniSteam);
      steam2.position.set(0.24, 6.55, -0.25);

      const rawBir = (ownerName || "ROYAL").replace(/^@/, "").trim().toUpperCase();
      const birTitle = rawBir.includes("BIRYANI") ? rawBir : `${rawBir.slice(0, 8)} BIRYANI`;
      const birBoard = this._makeBuildingBoard(birTitle, "DUM BIRYANI • FAST FOOD", "#991b1b", "#fde047", 5.2, 0.82);
      birBoard.position.set(0, 3.55, 2.02);

      const foodie = this._createCharacter({ shirtMat: this.mat.wallGold, pantsMat: this.mat.darkPants, scale: 0.92 });
      g.add(foodie);
      this.landmarkActors.push({ plotId: plotId || "BIRYANI_DEF", mesh: foodie, mode: "patrol_x", baseX: 0, baseZ: 2.75, range: 1.6, speed: 1.1, phase: 0 });

      g.add(body, topBand, goldTrim, awning, counter, handiPot, handiRim, steam1, steam2, birBoard);
      g.userData.labelY = 7.8;
      return g;
    }

    if (type === "medical_shop") {
      // 💊 1-PLOT 24/7 MEDICAL & PHARMACY SHOP (Glowing + Cross, Backlit Medicine Shelves & Animated Boys Walking Inside!)
      const body = new THREE.Mesh(this._boxGeo(5.2, 3.2, 4.4), this.mat.wallWhite);
      body.position.set(0, 1.65, -0.35);
      const medBand = new THREE.Mesh(this._boxGeo(5.45, 0.88, 4.65), this.mat.medGreen);
      medBand.position.set(0, 3.55, -0.35);
      const glowTrim = new THREE.Mesh(this._boxGeo(5.52, 0.16, 4.72), this.mat.medCrossGlow);
      glowTrim.position.set(0, 3.06, -0.35);

      // Clear Glass Storefront showing Backlit Pharmacy Medicine Racks & Counter!
      const frontGlass = new THREE.Mesh(this._boxGeo(4.2, 2.2, 0.14), this.mat.glass);
      frontGlass.position.set(0, 1.32, 1.88);
      const medCounter = new THREE.Mesh(this._boxGeo(3.4, 0.95, 0.7), this.mat.medGreen);
      medCounter.position.set(0, 0.62, 0.55);
      const medShelf = new THREE.Mesh(this._boxGeo(4.0, 2.0, 0.35), this.mat.wallCream);
      medShelf.position.set(0, 1.45, -1.65);

      // Giant Glowing 3D Medical "+" Cross Emblem Mounted on the Roof!
      const crossV = new THREE.Mesh(this._boxGeo(0.58, 1.85, 0.32), this.mat.medCrossGlow);
      crossV.position.set(0, 5.05, 0.2);
      const crossH = new THREE.Mesh(this._boxGeo(1.85, 0.58, 0.32), this.mat.medCrossGlow);
      crossH.position.set(0, 5.05, 0.2);

      const rawMed = (ownerName || "24/7").replace(/^@/, "").trim().toUpperCase();
      const medTitle = rawMed.includes("MEDICAL") || rawMed.includes("PHARMA") ? rawMed : `${rawMed.slice(0, 9)} MEDICALS`;
      const medBoard = this._makeBuildingBoard(medTitle, "24/7 PHARMACY • MEDICINES", "#059669", "#ffffff", 5.2, 0.82);
      medBoard.position.set(0, 3.55, 2.02);

      // 🚶‍♂️ ANIMATED BOYS WALKING STRAIGHT UP AND ENTERING INSIDE THE MEDICAL SHOP!
      const actorKey = plotId || "BEACH_MED_DEFAULT";
      const boy1 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.92 });
      const boy2 = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.darkPants, scale: 0.92 });
      g.add(boy1, boy2);
      this.landmarkActors.push({ plotId: actorKey, mesh: boy1, mode: "enter_z", baseX: -0.55, startZ: 3.1, endZ: 1.25, speed: 0.44, phase: 0.0 });
      this.landmarkActors.push({ plotId: actorKey, mesh: boy2, mode: "enter_z", baseX: 0.55, startZ: 3.1, endZ: 1.25, speed: 0.4, phase: 0.5 });

      g.add(body, medBand, glowTrim, frontGlass, medCounter, medShelf, crossV, crossH, medBoard);
      g.userData.labelY = 7.2;
      return g;
    }

    if (type === "ice_cream_shop") {
      // 🍨 1-PLOT ICE CREAM PARLOUR (For @_ur_bunny_108_! Giant 3D Swirl Cone Roof + Pastel Creamery!)
      const body = new THREE.Mesh(this._boxGeo(5.2, 3.2, 4.4), this.mat.iceCreamWhite);
      body.position.set(0, 1.65, -0.35);
      const pinkBand = new THREE.Mesh(this._boxGeo(5.45, 0.85, 4.65), this.mat.icePink);
      pinkBand.position.set(0, 3.55, -0.35);
      const mintTrim = new THREE.Mesh(this._boxGeo(5.52, 0.22, 4.72), this.mat.iceMint);
      mintTrim.position.set(0, 3.05, -0.35);

      // Pastel Awning + Glass Ice Cream Freezer Display!
      const awning = new THREE.Mesh(this._boxGeo(4.8, 0.25, 1.4), this.mat.icePink);
      awning.position.set(0, 2.55, 2.35);
      awning.rotation.x = 0.22;
      const glass = new THREE.Mesh(this._boxGeo(4.0, 2.0, 0.14), this.mat.glass);
      glass.position.set(0, 1.25, 1.88);

      // GIANT 3D MELTING SWIRL ICE CREAM CONE SCULPTURE ON ROOF!
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.1, 10), this.mat.iceWaffle);
      cone.rotation.x = Math.PI;
      cone.position.set(0, 5.0, -0.2);
      const scoop1 = new THREE.Mesh(new THREE.SphereGeometry(0.88, 10, 8), this.mat.icePink);
      scoop1.position.set(0, 6.1, -0.2);
      const scoop2 = new THREE.Mesh(new THREE.SphereGeometry(0.68, 10, 8), this.mat.iceMint);
      scoop2.position.set(0.32, 6.65, -0.2);
      const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), this.mat.oyoRed);
      cherry.position.set(0.32, 7.38, -0.2);

      const rawIc = (ownerName || "SWEET").replace(/^@/, "").trim().toUpperCase();
      const icBoard = this._makeBuildingBoard(`${rawIc.slice(0, 10)} ICE CREAM`, "CONES • SUNDAES • SHAKES", "#db2777", "#fef08a", 5.2, 0.8);
      icBoard.position.set(0, 3.55, 2.02);

      g.add(body, pinkBand, mintTrim, awning, glass, cone, scoop1, scoop2, cherry, icBoard);
      g.userData.labelY = 8.4;
      return g;
    }

    if (type === "veg_shop") {
      // 🥬 1-PLOT FRESH VEGETABLE SHOP (For @its_me_potti_6348! 3D Veggie Crates & Striped Market Awning!)
      const body = new THREE.Mesh(this._boxGeo(5.2, 3.0, 4.2), this.mat.wallCream);
      body.position.set(0, 1.55, -0.45);
      const roof = new THREE.Mesh(this._boxGeo(5.6, 0.45, 4.8), this.mat.dmartDeepGreen);
      roof.position.set(0, 3.2, -0.4);
      const awning = new THREE.Mesh(this._boxGeo(5.3, 0.22, 1.6), this.mat.dmartBrightGreen);
      awning.position.set(0, 2.65, 2.15);
      awning.rotation.x = 0.25;

      // 3D Wooden Market Display Crates filled with Tomatoes, Greens & Carrots!
      const crateSpecs = [
        { x: -1.6, mat: this.mat.vegTomato },
        { x: 0.0,  mat: this.mat.vegLeafy },
        { x: 1.6,  mat: this.mat.vegCarrot }
      ];
      crateSpecs.forEach((cs) => {
        const box = new THREE.Mesh(this._boxGeo(1.35, 0.72, 1.05), this.mat.wood);
        box.position.set(cs.x, 0.48, 2.05);
        const mound = new THREE.Mesh(this._boxGeo(1.2, 0.34, 0.9), cs.mat);
        mound.position.set(cs.x, 0.96, 2.05);
        g.add(box, mound);
      });

      const rawVg = (ownerName || "FRESH").replace(/^@/, "").trim().toUpperCase();
      const vgBoard = this._makeBuildingBoard(`${rawVg.slice(0, 10)} VEGGIES`, "FRESH FARM VEGETABLES", "#15803d", "#facc15", 5.2, 0.8);
      vgBoard.position.set(0, 3.45, 2.05);

      g.add(body, roof, awning, vgBoard);
      g.userData.labelY = 6.2;
      return g;
    }

    if (type === "mobile_shop") {
      // 📱 1-PLOT FOLLOWER MOBILE SHOP (Glowing Cyan Storefront + Giant 3D Smartphone on Roof + Interior Phone Display!)
      const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.3, 4.4), this.mat.wallWhite);
      body.position.set(0, 1.7, -0.35);

      const topFascia = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.92, 4.7), this.mat.mobileBlue);
      topFascia.position.set(0, 3.65, -0.35);
      const neonTrim = new THREE.Mesh(new THREE.BoxGeometry(5.58, 0.16, 4.76), this.mat.mobileCyanGlow);
      neonTrim.position.set(0, 3.16, -0.35);

      // Panoramic Sky-Reflective Glass Front showing interior smartphone demo counter!
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 0.14), this.mat.glass);
      frontGlass.position.set(0, 1.35, 1.88);
      const counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.95, 0.72), this.mat.mobileBlue);
      counter.position.set(0, 0.62, 0.55);
      // 3 Mini Glowing Display Phones on the Shop Counter!
      [-0.9, 0, 0.9].forEach((mx) => {
        const miniPhone = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.45), this.mat.mobileScreenGlow);
        miniPhone.position.set(mx, 1.14, 0.55);
        g.add(miniPhone);
      });

      // GIANT 3D SMARTPHONE SCULPTURE MOUNTED ON THE SHOP ROOF!
      const phoneGroup = new THREE.Group();
      phoneGroup.position.set(0, 5.25, -0.2);
      phoneGroup.rotation.y = 0.18;
      const phoneFrame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.35, 0.24), this.mat.mobileTitanium);
      const phoneScreen = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.12, 0.08), this.mat.mobileScreenGlow);
      phoneScreen.position.z = 0.11;
      // Glowing colorful app icons on the 3D Smartphone screen!
      const iconCols = [this.mat.wallCoral, this.mat.petrolYellow, this.mat.turf, this.mat.mobileOrange];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const ic = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.05), iconCols[r * 2 + c]);
          ic.position.set(-0.24 + c * 0.48, 0.42 - r * 0.52, 0.16);
          phoneGroup.add(ic);
        }
      }
      // Rear Triple-Lens Camera Island!
      const camBump = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.1), this.mat.cinemaObsidian);
      camBump.position.set(-0.26, 0.65, -0.14);
      phoneGroup.add(phoneFrame, phoneScreen, camBump);

      // Personalized Storefront Mobile Shop Signboard (shows follower's @username!)
      const rawMob = (ownerName || "PRO").replace(/^@/, "").trim().toUpperCase();
      const mobTitle = rawMob.includes("MOBILE") ? rawMob : `${rawMob.slice(0, 10)} MOBILES`;
      const mobBoard = this._makeBuildingBoard(mobTitle, "5G PHONES • REPAIR • COVERS", "#0f172a", "#22d3ee", 5.2, 0.82);
      mobBoard.position.set(0, 3.65, 2.04);

      g.add(body, topFascia, neonTrim, frontGlass, counter, phoneGroup, mobBoard);
      g.userData.labelY = 7.4;
      return g;
    }

    if (type === "beach_villa") {
      // 🏖️ ADDABLE 1-PLOT LUXURY BEACH HOUSE VILLA (Teak Deck + Plunge Pool + Ocean Glass + Balcony + Surfboard!)
      const deck = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.32, 6.2), this.mat.teakWood);
      deck.position.set(0, 0.16, 0);
      const pool = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.36, 1.55), this.mat.water);
      pool.position.set(-0.7, 0.17, 2.05);

      const f1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.45, 3.6), this.mat.wallWhite);
      f1.position.set(0, 1.54, -0.85);
      const teakClad = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.48, 3.7), this.mat.teakWood);
      teakClad.position.set(1.9, 1.54, -0.85);
      const glass1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.9, 0.14), winMat);
      glass1.position.set(-0.6, 1.38, 0.96);
      glass1.userData.isWindow = true;

      const slab = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.24, 4.4), this.mat.wallWhite);
      slab.position.set(0, 2.86, -0.5);
      const f2 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.15, 3.1), this.mat.stuccoIvory);
      f2.position.set(0.3, 4.05, -1.0);
      const glass2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.55, 0.14), winMat);
      glass2.position.set(0.3, 4.0, 0.56);
      glass2.userData.isWindow = true;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.65, 0.1), this.mat.glass);
      rail.position.set(0, 3.3, 1.62);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.24, 3.8), this.mat.slateTrim);
      roof.position.set(0.3, 5.22, -0.9);

      const surf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.85, 0.46), this.mat.studioCyan);
      surf.position.set(2.35, 1.15, 1.95);
      surf.rotation.z = -0.18;
      const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 5), this.mat.wallWhite);
      uPole.position.set(1.85, 1.1, 2.2);
      const uTop = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.34, 8), this.mat.petrolRed);
      uTop.position.set(1.85, 2.0, 2.2);

      g.add(deck, pool, f1, teakClad, glass1, slab, f2, glass2, rail, roof, surf, uPole, uTop);
      g.userData.labelY = 6.8;
      return g;
    }

    if (type === "cafe") {
      // Warm Wood & Cream Entrance Coffee Cafe + Giant 3D Coffee Cup on Roof + Outdoor Umbrella Table!
      const body = new THREE.Mesh(new THREE.BoxGeometry(5.0, 3.0, 4.2), this.mat.cafeBrown);
      body.position.set(0, 1.55, -0.3);
      const upperBand = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.55, 4.4), this.mat.cafeCream);
      upperBand.position.set(0, 3.1, -0.3);
      const awning = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.22, 1.5), this.mat.terracottaRoof);
      awning.position.set(0, 2.45, 2.35);
      awning.rotation.x = 0.25;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.8, 0.12), winMat);
      glass.position.set(0, 1.15, 1.82);
      glass.userData.isWindow = true;

      // Giant 3D Rooftop Coffee Cup Sculpture!
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.52, 1.15, 10), this.mat.wallWhite);
      cup.position.set(0, 3.95, -0.2);
      const coffeeTop = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 10), this.mat.cafeBrown);
      coffeeTop.position.set(0, 4.5, -0.2);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 6, 10), this.mat.wallWhite);
      handle.position.set(0.66, 3.95, -0.2);

      // Outdoor Sidewalk Cafe Table & Umbrella
      const tbl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.14, 0.65, 8), this.mat.teakWood);
      tbl.position.set(1.5, 0.36, 2.65);
      const umbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.9, 5), this.mat.wallWhite);
      umbPole.position.set(1.5, 1.15, 2.65);
      const umbTop = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.35, 8), this.mat.petrolYellow);
      umbTop.position.set(1.5, 2.1, 2.65);

      const cafeBoard = this._makeBuildingBoard("COFFEE CAFE", "FRESH BREW • SNACKS", "#451a03", "#fde047", 4.4, 0.72);
      cafeBoard.position.set(0, 3.1, 1.92);

      g.add(body, upperBand, awning, glass, cup, coffeeTop, handle, tbl, umbPole, umbTop, cafeBoard);
      g.userData.labelY = 5.6;
      return g;
    }

    if (type === "shop") {
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.8, 4.2), this.mat.wallGold);
      base.position.y = 1.45;
      const awning = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.35, 1.4), this.mat.petrolRed);
      awning.position.set(0, 2.3, 2.3);
      awning.rotation.x = 0.25;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.3, 0.12), winMat);
      glass.position.set(0, 1.1, 2.12);
      glass.userData.isWindow = true;
      g.add(base, awning, glass);
      g.userData.labelY = 4.6;
      return g;
    }

    // --- REALISTIC INDIAN ARCHITECTURAL HOUSES (NO MORE PLAIN BOXES! SHARED GEOS FOR LOW-END SMOOTHNESS) ---
    // Helper: Compound wall + gate pillars + front potted plants
    const addCompoundAndYard = (wallMat) => {
      const cwBack = new THREE.Mesh(this.geo.compWallBack, wallMat);
      cwBack.position.set(0, 0.36, -3.05);
      const cwL = new THREE.Mesh(this.geo.compWallSide, wallMat);
      cwL.position.set(-3.15, 0.36, 0);
      const cwR = new THREE.Mesh(this.geo.compWallSide, wallMat);
      cwR.position.set(3.15, 0.36, 0);
      const cwFL = new THREE.Mesh(this.geo.compWallFront, wallMat);
      cwFL.position.set(-2.12, 0.36, 3.05);
      const cwFR = new THREE.Mesh(this.geo.compWallFront, wallMat);
      cwFR.position.set(2.12, 0.36, 3.05);
      const pilL = new THREE.Mesh(this.geo.gatePillar, this.mat.plinthGrey);
      pilL.position.set(-0.98, 0.5, 3.05);
      const pilR = new THREE.Mesh(this.geo.gatePillar, this.mat.plinthGrey);
      pilR.position.set(0.98, 0.5, 3.05);
      const bushL = new THREE.Mesh(this.geo.frontBush, this.mat.balconyPlant);
      bushL.position.set(-2.35, 0.42, 2.55);
      const bushR = new THREE.Mesh(this.geo.frontBush, this.mat.balconyPlant);
      bushR.position.set(2.35, 0.42, 2.55);
      g.add(cwBack, cwL, cwR, cwFL, cwFR, pilL, pilR, bushL, bushR);
    };

    // Helper: Recessed framed window + concrete sunshade chajja
    const addWindowWithChajja = (x, y, z) => {
      const frame = new THREE.Mesh(this.geo.winFrameGeo, this.mat.winFrame);
      frame.position.set(x, y, z);
      const glass = new THREE.Mesh(this.geo.win, winMat);
      glass.position.set(x, y, z + 0.03);
      glass.userData.isWindow = true;
      const chajja = new THREE.Mesh(this.geo.chajjaGeo, this.mat.wallWhite);
      chajja.position.set(x, y + 0.54, z + 0.18);
      g.add(frame, glass, chajja);
    };

    // Raised stone foundation plinth + entrance steps
    const plinth = new THREE.Mesh(this.geo.plinthGeo, this.mat.plinthGrey);
    plinth.position.set(0, 0.22, -0.35);
    const steps = new THREE.Mesh(this.geo.stepGeo, this.mat.concrete);
    steps.position.set(0, 0.14, 2.1);
    const pathway = new THREE.Mesh(this.geo.pathway, this.mat.sidewalk);
    pathway.position.set(0, 0.09, 2.65);
    g.add(plinth, steps, pathway);

    // STYLE A: Ivory & Slate Modern Villa (`house_blue`)
    if (type === "house_blue") {
      addCompoundAndYard(this.mat.stuccoIvory);
      const body = new THREE.Mesh(this.geo.houseBody1, this.mat.stuccoIvory);
      body.position.set(0, 1.65, -0.35);
      const accentBand = new THREE.Mesh(new THREE.BoxGeometry(4.62, 0.32, 4.32), this.mat.slateTrim);
      accentBand.position.set(0, 2.95, -0.35);
      const parapet = new THREE.Mesh(this.geo.parapet, this.mat.wallWhite);
      parapet.position.set(0, 3.22, -0.35);

      // Veranda porch + 2 front columns + teak door
      const porch = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 1.15), this.mat.slateTrim);
      porch.position.set(0, 2.55, 2.15);
      const colL = new THREE.Mesh(this.geo.verandaCol, this.mat.wallWhite);
      colL.position.set(-0.95, 1.4, 2.55);
      const colR = new THREE.Mesh(this.geo.verandaCol, this.mat.wallWhite);
      colR.position.set(0.95, 1.4, 2.55);
      const door = new THREE.Mesh(this.geo.door, this.mat.teakWood);
      door.position.set(0, 1.12, 1.78);

      addWindowWithChajja(-1.45, 1.65, 1.76);
      addWindowWithChajja(1.45, 1.65, 1.76);

      // Rooftop staircase mumty + black Sintex water tank!
      const mumty = new THREE.Mesh(this.geo.mumty, this.mat.stuccoIvory);
      mumty.position.set(-1.1, 3.78, -1.25);
      const tank = new THREE.Mesh(this.geo.sintexTank, this.mat.tankBlack);
      tank.position.set(-1.1, 4.55, -1.25);

      g.add(body, accentBand, parapet, porch, colL, colR, door, mumty, tank);
      g.userData.labelY = 5.7;
      return g;
    }

    // STYLE B: Terracotta & Cream Duplex with Sloped Tiled Roof (`house_coral`)
    if (type === "house_coral") {
      addCompoundAndYard(this.mat.stuccoCream);
      const body = new THREE.Mesh(this.geo.houseBody1, this.mat.stuccoCream);
      body.position.set(0, 1.65, -0.35);
      const brickPillar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.65, 0.32), this.mat.brickRed);
      brickPillar.position.set(-1.75, 1.72, 1.82);

      // Sloped Terracotta Mangalore-Tile Roof!
      const roof = new THREE.Mesh(this.geo.slopedRoof, this.mat.terracottaRoof);
      roof.position.set(0, 3.48, -0.35);
      roof.rotation.y = Math.PI / 4;

      const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 1.1), this.mat.terracottaRoof);
      porchRoof.position.set(0.35, 2.38, 2.15);
      porchRoof.rotation.x = 0.16;

      const door = new THREE.Mesh(this.geo.door, this.mat.darkWood);
      door.position.set(0.35, 1.12, 1.78);

      addWindowWithChajja(-0.9, 1.65, 1.76);
      addWindowWithChajja(1.55, 1.65, 1.76);

      g.add(body, brickPillar, roof, porchRoof, door);
      g.userData.labelY = 5.4;
      return g;
    }

    // STYLE C: Sage & Teak Courtyard House (`house_mint`)
    if (type === "house_mint") {
      addCompoundAndYard(this.mat.stuccoSage);
      const body = new THREE.Mesh(this.geo.houseBody1, this.mat.stuccoSage);
      body.position.set(0, 1.65, -0.35);
      const teakPanel = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.55, 0.22), this.mat.teakWood);
      teakPanel.position.set(1.4, 1.68, 1.8);
      const cornice = new THREE.Mesh(this.geo.parapet, this.mat.warmTaupe);
      cornice.position.set(0, 3.05, -0.35);

      const porch = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.18, 1.0), this.mat.wallWhite);
      porch.position.set(-0.35, 2.38, 2.15);
      const door = new THREE.Mesh(this.geo.door, this.mat.teakWood);
      door.position.set(-0.35, 1.12, 1.78);

      addWindowWithChajja(-1.55, 1.65, 1.76);
      addWindowWithChajja(1.4, 1.65, 1.88);

      const mumty = new THREE.Mesh(this.geo.mumty, this.mat.stuccoCream);
      mumty.position.set(1.1, 3.62, -1.2);
      const tank = new THREE.Mesh(this.geo.sintexTank, this.mat.tankBlack);
      tank.position.set(1.1, 4.4, -1.2);

      g.add(body, teakPanel, cornice, porch, door, mumty, tank);
      g.userData.labelY = 5.6;
      return g;
    }

    // STYLE D: Sandstone & Wood 2-Story Luxury Duplex (`house_gold`)
    addCompoundAndYard(this.mat.stuccoSandstone);
    const body = new THREE.Mesh(this.geo.houseBody2, this.mat.stuccoSandstone);
    body.position.set(0, 2.3, -0.35);

    const stoneCol = new THREE.Mesh(new THREE.BoxGeometry(0.95, 4.1, 0.36), this.mat.warmTaupe);
    stoneCol.position.set(-1.78, 2.42, 1.82);

    const midSlab = new THREE.Mesh(new THREE.BoxGeometry(4.85, 0.18, 4.75), this.mat.wallWhite);
    midSlab.position.set(0, 2.45, -0.15);
    const topSlab = new THREE.Mesh(this.geo.parapet, this.mat.slateTrim);
    topSlab.position.set(0, 4.35, -0.35);

    // 1st Floor Glass Balcony Railing
    const balcRail = new THREE.Mesh(this.geo.balconyRail, this.mat.glass);
    balcRail.position.set(0.75, 2.78, 2.18);

    const door = new THREE.Mesh(this.geo.door, this.mat.darkWood);
    door.position.set(0.15, 1.12, 1.78);

    // Ground & First Floor Windows with Chajjas
    addWindowWithChajja(1.45, 1.5, 1.76);
    addWindowWithChajja(-0.55, 3.35, 1.76);
    addWindowWithChajja(1.3, 3.35, 1.76);

    const mumty = new THREE.Mesh(this.geo.mumty, this.mat.stuccoIvory);
    mumty.position.set(-1.1, 4.92, -1.25);
    const tank = new THREE.Mesh(this.geo.sintexTank, this.mat.tankBlack);
    tank.position.set(-1.1, 5.7, -1.25);

    g.add(body, stoneCol, midSlab, topSlab, balcRail, door, mumty, tank);
    g.userData.labelY = 6.8;
    return g;
  },

  _makeMoviePoster(title, tagline, bgTop, bgBot, accentHex = "#facc15", w = 1.9, h = 2.65) {
    const key = `POSTER|${title}|${tagline}|${bgTop}|${bgBot}`;
    let mat = this.signTexCache.get(key);
    if (!mat) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 360;
      const ctx = c.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 0, 360);
      grad.addColorStop(0, bgTop);
      grad.addColorStop(1, bgBot);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 360);

      // Cinematic Poster Border & Spotlight Glow
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, 240, 344);

      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.arc(128, 130, 74, 0, Math.PI * 2);
      ctx.fill();

      // Top "NOW SHOWING" Pill
      ctx.fillStyle = accentHex;
      ctx.fillRect(36, 26, 184, 34);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#09090b";
      ctx.font = "900 18px sans-serif";
      ctx.fillText("NOW SHOWING", 128, 44);

      // Bold Movie Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 44px sans-serif";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#020617";
      ctx.strokeText(title, 128, 182, 220);
      ctx.fillText(title, 128, 182, 220);

      // Tagline & Dolby/IMAX Badge
      ctx.fillStyle = accentHex;
      ctx.font = "800 22px sans-serif";
      ctx.fillText(tagline, 128, 246, 220);

      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(38, 288, 180, 38);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 18px sans-serif";
      ctx.fillText("IMAX 3D • DOLBY", 128, 308);

      const tex = new THREE.CanvasTexture(c);
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = this.maxAnisotropy || 4;
      tex.colorSpace = THREE.SRGBColorSpace;
      mat = new THREE.MeshBasicMaterial({ map: tex });
      this.signTexCache.set(key, mat);
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  },

  _makeDMartLogoBoard(ownerSub = "", w = 11.4, h = 2.0) {
    const key = `DMART_LOGO|${ownerSub}`;
    let mat = this.signTexCache.get(key);
    if (!mat) {
      const c = document.createElement("canvas");
      c.width = 768;
      c.height = 192;
      const ctx = c.getContext("2d");

      // Signature D-Mart Deep Green Background + Bright Yellow Top & Bottom Border Trim
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, 0, 768, 192);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(0, 0, 768, 14);
      ctx.fillRect(0, 178, 768, 14);

      // Iconic White House-Roof & Shopping Cart Emblem on Left of Logo
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(74, 88);
      ctx.lineTo(126, 42);
      ctx.lineTo(178, 88);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(92, 92, 68, 44);
      ctx.fillStyle = "#15803d";
      ctx.font = "900 32px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("D", 126, 116);

      // Bold Signature "DMart" Typography (White "D" + Bright Yellow/White "Mart")
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 84px sans-serif";
      ctx.fillText("D", 206, 86);
      ctx.fillStyle = "#facc15";
      ctx.font = "900 84px sans-serif";
      ctx.fillText("Mart", 272, 86);

      // Signature Yellow Curved Smile / Cart Underline
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(208, 126);
      ctx.quadraticCurveTo(360, 144, 515, 122);
      ctx.stroke();

      // Tagline right below ("DAILY DISCOUNTS • DAILY SAVINGS" + Owner Name if set)
      ctx.textAlign = "center";
      ctx.fillStyle = "#f8fafc";
      ctx.font = "800 24px sans-serif";
      const subLine = ownerSub
        ? `DAILY DISCOUNTS • DAILY SAVINGS • ${ownerSub.toUpperCase()}`
        : "DAILY DISCOUNTS • DAILY SAVINGS";
      ctx.fillText(subLine, 470, 158, 540);

      // Right-Side Yellow "SUPERMARKET" Vertical Pill
      ctx.fillStyle = "#facc15";
      ctx.fillRect(576, 46, 166, 62);
      ctx.fillStyle = "#14532d";
      ctx.font = "900 24px sans-serif";
      ctx.fillText("HYPERMARKET", 659, 78, 154);

      const tex = new THREE.CanvasTexture(c);
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = this.maxAnisotropy || 4;
      tex.colorSpace = THREE.SRGBColorSpace;
      mat = new THREE.MeshBasicMaterial({ map: tex });
      this.signTexCache.set(key, mat);
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  },

  _attachSkyDiscoLights(parentGroup, plotId, beamSpots, palette, marqueeBulbs = null, pointLightPos = null) {
    const nightGroup = new THREE.Group();
    const skyBeams = [];

    const baseGeo = new THREE.CylinderGeometry(0.46, 0.62, 0.72, 8);
    const lampHeadGeo = new THREE.SphereGeometry(0.38, 8, 8);
    const haloGeo = new THREE.RingGeometry(0.6, 3.2, 14);
    haloGeo.rotateX(-Math.PI / 2);

    beamSpots.forEach((spot, idx) => {
      const housing = new THREE.Mesh(baseGeo, this.mat.cinemaObsidian);
      housing.position.set(spot.x, spot.y + 0.35, spot.z);
      parentGroup.add(housing);

      const pivot = new THREE.Group();
      pivot.position.set(spot.x, spot.y + 0.68, spot.z);

      const colHex = palette[idx % palette.length];
      const beamMat = new THREE.MeshBasicMaterial({
        color: colHex,
        transparent: true,
        opacity: 0.44,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const coreMat = new THREE.MeshBasicMaterial({
        color: colHex,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const haloMat = new THREE.MeshBasicMaterial({
        color: colHex,
        transparent: true,
        opacity: 0.36,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const bulbMat = new THREE.MeshBasicMaterial({ color: colHex });

      const coneGeo = new THREE.CylinderGeometry(3.4, 0.3, spot.h, 10, 1, true);
      coneGeo.translate(0, spot.h / 2, 0);
      const cone = new THREE.Mesh(coneGeo, beamMat);
      cone.rotation.z = spot.tilt;

      const coreGeo = new THREE.CylinderGeometry(0.75, 0.16, spot.h * 0.96, 6, 1, true);
      coreGeo.translate(0, (spot.h * 0.96) / 2, 0);
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.rotation.z = spot.tilt;

      const airHalo = new THREE.Mesh(haloGeo, haloMat);
      airHalo.position.set(-Math.sin(spot.tilt) * spot.h * 0.92, Math.cos(spot.tilt) * spot.h * 0.92, 0);

      const lens = new THREE.Mesh(lampHeadGeo, bulbMat);
      pivot.add(lens, cone, core, airHalo);
      nightGroup.add(pivot);

      skyBeams.push({
        pivot,
        cone,
        core,
        airHalo,
        beamMat,
        coreMat,
        haloMat,
        bulbMat,
        beamH: spot.h,
        baseTilt: spot.tilt,
        dir: spot.dir,
        colorIdx: idx
      });
    });

    let ptLight = null;
    if (!this.isLowRam && pointLightPos) {
      ptLight = new THREE.PointLight(palette[0], 3.0, 32);
      ptLight.position.copy(pointLightPos);
      nightGroup.add(ptLight);
    }

    nightGroup.visible = this.timeOfDay === "night";
    parentGroup.add(nightGroup);

    this.theaterDiscos.push({
      plotId,
      nightGroup,
      skyBeams,
      pointLight: ptLight,
      marqueeBulbs,
      palette
    });
  },

  _buildEightPlotMovieTheater(plotId, ownerName = "") {
    const g = new THREE.Group();

    const plazaFloor = new THREE.Mesh(new THREE.BoxGeometry(21.2, 0.16, 13.8), this.mat.marble);
    plazaFloor.position.set(-5.4, 0.32, 0);
    const parkLot = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.14, 13.8), this.mat.tarmacGrey);
    parkLot.position.set(10.5, 0.31, 0);

    const step1 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.22, 1.4), this.mat.marble);
    step1.position.set(-4.2, 0.42, 2.2);
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.19, 5.4), this.mat.vipCarpet);
    carpet.position.set(-4.2, 0.35, 4.2);
    [-6.2, -2.2].forEach((sx) => {
      [2.8, 4.6, 6.4].forEach((sz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.72, 6), this.mat.richGoldTrim);
        post.position.set(sx, 0.72, sz);
        g.add(post);
      });
    });
    g.add(plazaFloor, parkLot, step1, carpet);

    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(20.0, 7.2, 8.2), this.mat.cinemaObsidian);
    mainHall.position.set(-5.4, 3.9, -2.5);

    const upperHall = new THREE.Mesh(new THREE.BoxGeometry(15.2, 1.8, 6.4), this.mat.cinemaObsidian);
    upperHall.position.set(-5.4, 8.2, -3.2);
    const upperNeon = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.22, 6.6), this.mat.cinemaNeonCyan);
    upperNeon.position.set(-5.4, 7.45, -3.2);

    const crimsonPanelL = new THREE.Mesh(new THREE.BoxGeometry(4.8, 6.0, 0.38), this.mat.cinemaCrimson);
    crimsonPanelL.position.set(-12.6, 3.8, 1.65);
    const crimsonPanelR = crimsonPanelL.clone();
    crimsonPanelR.position.x = 1.6;

    [-15.2, -9.8, -1.2, 4.2].forEach((fx) => {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.32, 7.3, 0.68), this.mat.richGoldTrim);
      fin.position.set(fx, 3.95, 1.65);
      const neonRib = new THREE.Mesh(new THREE.BoxGeometry(0.12, 6.6, 0.14), this.mat.cinemaNeonPink);
      neonRib.position.set(fx, 3.95, 2.02);
      g.add(fin, neonRib);
    });

    // Double-Height Clear Glass Lobby Atrium WITH REAL INTERIOR MOVIE SCREEN & TIERED RED SEATS PREVIEW!
    const lobbyGlass = new THREE.Mesh(new THREE.BoxGeometry(8.4, 4.6, 0.14), this.mat.glass);
    lobbyGlass.position.set(-4.2, 2.75, 1.68);
    const indoorScreen = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.6, 0.12), this.mat.cinemaScreenGlow);
    indoorScreen.position.set(-4.2, 3.2, -0.4);
    for (let r = 0; r < 3; r++) {
      const seatRow = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.45, 0.55), this.mat.cinemaCrimson);
      seatRow.position.set(-4.2, 0.75 + r * 0.42, 0.9 - r * 0.45);
      g.add(seatRow);
    }

    const marquee = new THREE.Mesh(new THREE.BoxGeometry(19.0, 1.2, 3.4), this.mat.cinemaCrimson);
    marquee.position.set(-5.4, 5.2, 2.9);
    const marqueeGoldTop = new THREE.Mesh(new THREE.BoxGeometry(19.3, 0.22, 3.6), this.mat.richGoldTrim);
    marqueeGoldTop.position.set(-5.4, 5.84, 2.9);
    const marqueeGoldBot = marqueeGoldTop.clone();
    marqueeGoldBot.position.y = 4.56;

    const bulbGeo = new THREE.SphereGeometry(0.14, 6, 6);
    const marqueeBulbs = [];
    for (let bx = -14.2; bx <= 3.4; bx += 1.25) {
      const bulb = new THREE.Mesh(bulbGeo, this.mat.cinemaMarquee);
      bulb.position.set(bx, 5.2, 4.66);
      g.add(bulb);
      marqueeBulbs.push(bulb);
    }

    const marqueeBoard = this._makeBuildingBoard(
      "NOW SHOWING • IMAX 3D • DOLBY",
      "SALAAR 2 • DEVARA • PUSHPA 2 • KALKI",
      "#09090b",
      "#facc15",
      16.2,
      0.9
    );
    marqueeBoard.position.set(-5.4, 5.2, 4.62);

    const cleanThName = (ownerName || "SHERU BHAI").trim().toUpperCase();
    const theaterTitle = cleanThName.includes("CINEMA") || cleanThName.includes("THEATER") || cleanThName.includes("MULTIPLEX")
      ? cleanThName
      : `${cleanThName} MULTIPLEX`;
    const mainTheaterBoard = this._makeBuildingBoard(
      theaterTitle,
      "IMAX 3D • SCREEN 1, 2, 3 • DOLBY ATMOS",
      "#09090b",
      "#facc15",
      15.8,
      1.85
    );
    mainTheaterBoard.position.set(-5.4, 8.65, 1.55);
    const boardBack = new THREE.Mesh(new THREE.BoxGeometry(16.2, 2.05, 0.45), this.mat.cinemaObsidian);
    boardBack.position.set(-5.4, 8.65, 1.3);

    const reelSculpture = new THREE.Group();
    reelSculpture.position.set(-5.4, 10.6, -3.2);
    const reelDisc = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.42, 16), this.mat.richGoldTrim);
    reelDisc.rotation.x = Math.PI / 2;
    const reelRim = new THREE.Mesh(new THREE.TorusGeometry(1.96, 0.18, 8, 18), this.mat.cinemaCrimson);
    const reelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.54, 10), this.mat.cinemaObsidian);
    reelHub.rotation.x = Math.PI / 2;
    for (let h = 0; h < 5; h++) {
      const ha = (h / 5) * Math.PI * 2;
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.48, 8), this.mat.cinemaObsidian);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(Math.cos(ha) * 1.1, Math.sin(ha) * 1.1, 0);
      reelSculpture.add(hole);
    }
    reelSculpture.add(reelDisc, reelRim, reelHub);
    g.add(reelSculpture);
    this.turntableRotors.push({ plotId, mesh: reelSculpture, speed: 0.95 });

    const p1 = this._makeMoviePoster("SALAAR 2", "REBEL RETURNS", "#7f1d1d", "#09090b", "#facc15");
    p1.position.set(-13.7, 2.55, 1.9);
    const p2 = this._makeMoviePoster("DEVARA", "FEAR IN IMAX", "#0c4a6e", "#020617", "#38bdf8");
    p2.position.set(-11.4, 2.55, 1.9);
    const p3 = this._makeMoviePoster("PUSHPA 2", "THE RULE", "#7c2d12", "#1c1917", "#fb923c");
    p3.position.set(0.45, 2.55, 1.9);
    const p4 = this._makeMoviePoster("KALKI 2898", "IMAX 3D", "#312e81", "#020617", "#c084fc");
    p4.position.set(2.75, 2.55, 1.9);

    const makePosterKiosk = (kx, kz, posterMesh) => {
      const kg = new THREE.Group();
      kg.position.set(kx, 0.4, kz);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.9, 0.28), this.mat.cinemaObsidian);
      frame.position.y = 1.85;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.42), this.mat.richGoldTrim);
      post.position.y = 0.35;
      posterMesh.position.set(0, 1.85, 0.16);
      const backPoster = posterMesh.clone();
      backPoster.rotation.y = Math.PI;
      backPoster.position.z = -0.16;
      kg.add(frame, post, posterMesh, backPoster);
      g.add(kg);
    };
    makePosterKiosk(-14.4, 5.2, this._makeMoviePoster("RRR", "FIRE & WATER", "#991b1b", "#1e3a8a", "#fde047"));
    makePosterKiosk(3.2, 5.2, this._makeMoviePoster("SHERU BHAI", "THE LION KING", "#854d0e", "#09090b", "#22d3ee"));

    // Real 3-Window Box Office Ticket Pavilion + Popcorn Stall
    const ticketBooth = new THREE.Group();
    ticketBooth.position.set(-9.6, 0.4, 4.9);

    const tbBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.15, 2.4), this.mat.cinemaCrimson);
    tbBase.position.y = 0.58;
    const tbCounter = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.15, 2.75), this.mat.richGoldTrim);
    tbCounter.position.y = 1.18;
    const tbGlass = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.35, 2.15), this.mat.glass);
    tbGlass.position.y = 1.9;
    [-1.1, 1.1].forEach((dx) => {
      const div = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 2.2), this.mat.richGoldTrim);
      div.position.set(dx, 1.9, 0);
      ticketBooth.add(div);
    });
    const tbRoof = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.45, 3.0), this.mat.cinemaObsidian);
    tbRoof.position.y = 2.76;
    const tbBoard = this._makeBuildingBoard("TICKET COUNTER", "11AM • 2PM • 6PM • 9PM", "#b91c1c", "#facc15", 4.6, 0.85);
    tbBoard.position.set(0, 3.12, 1.52);

    const clerk = this._createCharacter({ shirtMat: this.mat.richGoldTrim, pantsMat: this.mat.darkPants, scale: 0.88 });
    clerk.position.set(0, 0.38, 0);
    const qRail = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.1, 0.08), this.mat.richGoldTrim);
    qRail.position.set(0, 0.72, 1.95);
    ticketBooth.add(tbBase, tbCounter, tbGlass, tbRoof, tbBoard, clerk, qRail);

    const popStall = new THREE.Group();
    popStall.position.set(-0.2, 0.4, 5.1);
    const popBase = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.05, 1.6), this.mat.cinemaCrimson);
    popBase.position.y = 0.52;
    const popBucket = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.34, 0.72, 8), this.mat.popcornYellow);
    popBucket.position.set(0, 1.4, 0);
    const popSign = this._makeBuildingBoard("POPCORN", "SNACKS • DRINKS", "#facc15", "#991b1b", 2.2, 0.58);
    popSign.position.set(0, 2.25, 0.82);
    popStall.add(popBase, popBucket, popSign);
    g.add(ticketBooth, popStall);

    const fan1 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(fan1);
    this.landmarkActors.push({ plotId, mesh: fan1, mode: "patrol_x", baseX: -9.6, baseZ: 6.45, range: 1.8, speed: 1.2, phase: 0 });
    const fan2 = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(fan2);
    this.landmarkActors.push({ plotId, mesh: fan2, mode: "patrol_z", baseX: -4.2, baseZ: 4.5, range: 1.8, speed: 1.35, phase: 1.4 });

    for (let pz = -5.2; pz <= 2.8; pz += 2.65) {
      const pLine = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.14), this.mat.stripe);
      pLine.rotation.x = -Math.PI / 2;
      pLine.position.set(13.3, 0.4, pz);
      g.add(pLine);
    }
    const tpIn = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.2), this.mat.parkingGreen);
    tpIn.rotation.x = -Math.PI / 2;
    tpIn.position.set(7.8, 0.4, 5.4);
    const tpOut = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 2.2), this.mat.parkingRed);
    tpOut.rotation.x = -Math.PI / 2;
    tpOut.position.set(13.0, 0.4, 5.4);

    const barrierPost = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.1, 0.32), this.mat.petrolYellow);
    barrierPost.position.set(6.5, 0.9, 4.4);
    const barrierArm = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.12), this.mat.petrolRed);
    barrierArm.position.set(7.8, 1.2, 4.4);
    barrierArm.rotation.z = 0.22;

    const tpBoard = this._makeBuildingBoard("THEATER PARKING", "IN ⬆  •  ⬇ OUT • CARS & BIKES", "#0f172a", "#facc15", 8.0, 1.15);
    tpBoard.position.set(10.5, 3.5, 6.2);
    [6.6, 14.4].forEach((px) => {
      const tpPole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.5, 6), this.mat.richGoldTrim);
      tpPole.position.set(px, 1.8, 6.2);
      g.add(tpPole);
    });

    const tCar1 = this._makeVehicleMesh(false, false, 0xef4444, false);
    tCar1.position.set(13.2, 0.38, -3.9);
    tCar1.rotation.y = -Math.PI / 2;
    const tCar2 = this._makeVehicleMesh(false, false, 0x3b82f6, false);
    tCar2.position.set(13.2, 0.38, -1.25);
    tCar2.rotation.y = -Math.PI / 2;
    const tCar3 = this._makeVehicleMesh(false, false, 0x10b981, false);
    tCar3.position.set(13.2, 0.38, 1.4);
    tCar3.rotation.y = -Math.PI / 2;
    const tAuto = this._makeRealAutoMesh(false, false);
    tAuto.position.set(7.8, 0.38, -2.5);
    tAuto.rotation.y = Math.PI / 2;
    g.add(tpIn, tpOut, barrierPost, barrierArm, tpBoard, tCar1, tCar2, tCar3, tAuto);

    const beamSpots = [
      { x: -15.4, y: 0.45, z: 6.3,  h: 30.0, tilt: 0.40, dir: 1 },
      { x: 4.8,   y: 0.45, z: 6.3,  h: 30.0, tilt: 0.40, dir: -1 },
      { x: -15.4, y: 0.45, z: -6.4, h: 30.0, tilt: 0.38, dir: -1 },
      { x: 15.2,  y: 0.45, z: -6.4, h: 30.0, tilt: 0.38, dir: 1 },
      { x: -14.2, y: 7.55, z: 1.3,  h: 28.0, tilt: 0.45, dir: 1 },
      { x: 3.4,   y: 7.55, z: 1.3,  h: 28.0, tilt: 0.45, dir: -1 },
      { x: -12.0, y: 9.15, z: -3.2, h: 26.0, tilt: 0.35, dir: -1 },
      { x: 1.2,   y: 9.15, z: -3.2, h: 26.0, tilt: 0.35, dir: 1 }
    ];
    this._attachSkyDiscoLights(
      g,
      plotId,
      beamSpots,
      [0xec4899, 0x22d3ee, 0xfacc15, 0xa855f7, 0x4ade80, 0xef4444],
      marqueeBulbs,
      new THREE.Vector3(-5.4, 9.2, 5.4)
    );

    g.add(
      mainHall, upperHall, upperNeon, crimsonPanelL, crimsonPanelR, lobbyGlass, indoorScreen,
      marquee, marqueeGoldTop, marqueeGoldBot, marqueeBoard, mainTheaterBoard, boardBack, p1, p2, p3, p4
    );
    g.userData.labelY = 12.8;
    return g;
  },

  _buildEightPlotIMAXTheater(plotId, ownerName = "") {
    const g = new THREE.Group();

    const plaza = new THREE.Mesh(new THREE.BoxGeometry(21.4, 0.16, 13.8), this.mat.marble);
    plaza.position.set(-5.3, 0.32, 0);
    const parkLot = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.14, 13.8), this.mat.tarmacGrey);
    parkLot.position.set(10.6, 0.31, 0);
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.19, 5.2), this.mat.imaxBlue);
    carpet.position.set(-5.2, 0.35, 4.2);
    g.add(plaza, parkLot, carpet);

    const baseHall = new THREE.Mesh(new THREE.BoxGeometry(19.6, 4.8, 8.6), this.mat.imaxBlue);
    baseHall.position.set(-5.4, 2.75, -2.2);

    const glassAtrium = new THREE.Mesh(new THREE.BoxGeometry(14.0, 4.2, 1.4), this.mat.glass);
    glassAtrium.position.set(-5.4, 2.5, 2.2);

    const imaxDome = new THREE.Mesh(
      new THREE.SphereGeometry(6.8, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      this.mat.imaxDomeSilver
    );
    imaxDome.scale.set(1.25, 0.85, 0.92);
    imaxDome.position.set(-5.4, 5.0, -2.4);

    const domeRing = new THREE.Mesh(new THREE.TorusGeometry(7.2, 0.2, 8, 28), this.mat.imaxNeonBlue);
    domeRing.rotation.x = Math.PI / 2;
    domeRing.scale.set(1.18, 0.88, 1);
    domeRing.position.set(-5.4, 5.2, -2.4);

    const canopy = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.85, 3.2), this.mat.cinemaObsidian);
    canopy.position.set(-5.4, 4.95, 3.0);
    const canopyNeon = new THREE.Mesh(new THREE.BoxGeometry(17.8, 0.2, 3.35), this.mat.imaxNeonBlue);
    canopyNeon.position.set(-5.4, 4.5, 3.0);

    const cleanName = (ownerName || "").trim().toUpperCase();
    const imaxSub = cleanName ? `${cleanName} • LASER 3D • 70MM GIANT SCREEN` : "LASER 3D • 70MM GIANT SCREEN • DOLBY";
    const imaxSign = this._makeBuildingBoard("I M A X  3 D", imaxSub, "#020617", "#38bdf8", 14.8, 1.9);
    imaxSign.position.set(-5.4, 6.25, 2.65);
    const imaxBack = new THREE.Mesh(new THREE.BoxGeometry(15.2, 2.1, 0.42), this.mat.cinemaObsidian);
    imaxBack.position.set(-5.4, 6.25, 2.4);

    const ip1 = this._makeMoviePoster("INTERSTELLAR", "70MM IMAX", "#0f172a", "#020617", "#38bdf8");
    ip1.position.set(-13.8, 2.45, 2.22);
    const ip2 = this._makeMoviePoster("AVATAR 3", "IMAX 3D", "#0369a1", "#082f49", "#22d3ee");
    ip2.position.set(2.9, 2.45, 2.22);
    const ip3 = this._makeMoviePoster("KALKI 2898", "LASER IMAX", "#312e81", "#020617", "#c084fc");
    ip3.position.set(-13.8, 2.45, 5.1);
    const ip4 = this._makeMoviePoster("SALAAR 2", "IMAX SOUND", "#7f1d1d", "#09090b", "#facc15");
    ip4.position.set(2.9, 2.45, 5.1);

    const boxOffice = new THREE.Group();
    boxOffice.position.set(-10.2, 0.4, 5.0);
    const boBase = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.1, 2.2), this.mat.imaxBlue);
    boBase.position.y = 0.55;
    const boGlass = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.3, 2.0), this.mat.glass);
    boGlass.position.y = 1.75;
    const boRoof = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.36, 2.6), this.mat.cinemaObsidian);
    boRoof.position.y = 2.58;
    const boSign = this._makeBuildingBoard("IMAX TICKETS", "BOOK 3D SEATS", "#0369a1", "#38bdf8", 4.1, 0.78);
    boSign.position.set(0, 2.95, 1.35);
    const boClerk = this._createCharacter({ shirtMat: this.mat.imaxNeonBlue, pantsMat: this.mat.darkPants, scale: 0.88 });
    boClerk.position.set(0, 0.35, 0);
    boxOffice.add(boBase, boGlass, boRoof, boSign, boClerk);
    g.add(boxOffice);

    const m1 = this._createCharacter({ shirtMat: this.mat.wallGold, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(m1);
    this.landmarkActors.push({ plotId, mesh: m1, mode: "patrol_z", baseX: -5.2, baseZ: 4.6, range: 1.7, speed: 1.3, phase: 0 });

    for (let pz = -5.2; pz <= 2.8; pz += 2.65) {
      const pLine = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 0.14), this.mat.stripe);
      pLine.rotation.x = -Math.PI / 2;
      pLine.position.set(13.4, 0.4, pz);
      g.add(pLine);
    }
    const ipBoard = this._makeBuildingBoard("IMAX PARKING", "IN ⬆  •  ⬇ OUT • VIP", "#020617", "#38bdf8", 7.8, 1.15);
    ipBoard.position.set(10.6, 3.4, 6.2);
    [6.8, 14.4].forEach((px) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.4, 6), this.mat.imaxDomeSilver);
      p.position.set(px, 1.75, 6.2);
      g.add(p);
    });
    const iCar1 = this._makeVehicleMesh(false, false, 0x38bdf8, false);
    iCar1.position.set(13.3, 0.38, -3.9);
    iCar1.rotation.y = -Math.PI / 2;
    const iCar2 = this._makeVehicleMesh(false, false, 0xf8fafc, false);
    iCar2.position.set(13.3, 0.38, -1.25);
    iCar2.rotation.y = -Math.PI / 2;
    const iAuto = this._makeRealAutoMesh(false, false);
    iAuto.position.set(8.0, 0.38, -2.5);
    iAuto.rotation.y = Math.PI / 2;
    g.add(ipBoard, iCar1, iCar2, iAuto);

    const beamSpots = [
      { x: -15.4, y: 0.45, z: 6.3,  h: 31.0, tilt: 0.40, dir: 1 },
      { x: 4.8,   y: 0.45, z: 6.3,  h: 31.0, tilt: 0.40, dir: -1 },
      { x: -15.4, y: 0.45, z: -6.4, h: 31.0, tilt: 0.38, dir: -1 },
      { x: 15.2,  y: 0.45, z: -6.4, h: 31.0, tilt: 0.38, dir: 1 },
      { x: -14.2, y: 5.2,  z: 1.5,  h: 28.0, tilt: 0.44, dir: 1 },
      { x: 3.4,   y: 5.2,  z: 1.5,  h: 28.0, tilt: 0.44, dir: -1 },
      { x: -10.8, y: 7.4,  z: -2.4, h: 27.0, tilt: 0.34, dir: -1 },
      { x: 0.0,   y: 7.4,  z: -2.4, h: 27.0, tilt: 0.34, dir: 1 }
    ];
    this._attachSkyDiscoLights(
      g,
      plotId,
      beamSpots,
      [0x38bdf8, 0xec4899, 0x22d3ee, 0xa855f7, 0xfacc15, 0x4ade80],
      null,
      new THREE.Vector3(-5.4, 10.0, 4.5)
    );

    g.add(baseHall, glassAtrium, imaxDome, domeRing, canopy, canopyNeon, imaxSign, imaxBack, ip1, ip2, ip3, ip4);
    g.userData.labelY = 13.2;
    return g;
  },

  _buildEightPlotMahindraShowroom(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.audiGlass;

    const floor = new THREE.Mesh(this._boxGeo(31.8, 0.16, 13.8), this.mat.marble);
    floor.position.set(0, 0.32, 0);
    const hall = new THREE.Mesh(this._boxGeo(29.8, 6.2, 8.6), this.mat.mahindraBlack);
    hall.position.set(0, 3.45, -2.2);
    const redPortal = new THREE.Mesh(this._boxGeo(10.8, 6.6, 0.65), this.mat.mahindraRed);
    redPortal.position.set(0, 3.65, 2.25);
    const frontGlass = new THREE.Mesh(this._boxGeo(28.0, 4.6, 0.14), winMat);
    frontGlass.position.set(0, 2.75, 2.16);
    frontGlass.userData.isWindow = true;
    const roofBand = new THREE.Mesh(this._boxGeo(30.4, 1.35, 9.2), this.mat.mahindraRed);
    roofBand.position.set(0, 7.1, -2.2);
    const twinStripe = new THREE.Mesh(this._boxGeo(30.6, 0.24, 9.3), this.mat.wallWhite);
    twinStripe.position.set(0, 6.38, -2.2);

    const ownerSub = ownerName ? `${ownerName.toUpperCase()} • THAR • SCORPIO-N • XUV700` : "THAR ROXX • SCORPIO-N • XUV700 • BE 6E";
    const mainBoard = this._makeBuildingBoard("MAHINDRA SHOWROOM", ownerSub, "#be123c", "#ffffff", 18.6, 1.65);
    mainBoard.position.set(0, 7.15, 2.45);
    const sideBoard = this._makeBuildingBoard("MAHINDRA", "RISE • SUV", "#111827", "#facc15", 8.2, 1.25);
    sideBoard.rotation.y = Math.PI / 2;
    sideBoard.position.set(15.26, 7.15, -2.2);

    // Rugged 3D Mahindra SUV Mesh Builder (High ground clearance, bullbar, roof rails, spare rear wheel!)
    const makeSUV = (bodyMat) => {
      const suv = this._makeRealAudiCarMesh(bodyMat, true);
      const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 10), this.mat.wheelBlack);
      spare.rotation.x = Math.PI / 2;
      spare.position.set(0, 0.72, -1.96);
      const bullbar = new THREE.Mesh(this._boxGeo(1.4, 0.28, 0.18), this.mat.chrome);
      bullbar.position.set(0, 0.48, 1.98);
      suv.add(spare, bullbar);
      return suv;
    };

    // Center Rotating Hero Mahindra Thar / XUV700 Turntable!
    const turntable = new THREE.Group();
    turntable.position.set(0, 0.42, 4.4);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.3, 0.24, 20), this.mat.mahindraBlack);
    const ledRing = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.26, 22), this.mat.cinemaNeonPink);
    ledRing.rotation.x = -Math.PI / 2;
    ledRing.position.y = 0.14;
    const heroSUV = makeSUV(this.mat.mahindraRed);
    heroSUV.position.set(0, 0.12, 0);
    turntable.add(disc, ledRing, heroSUV);
    g.add(turntable);
    this.turntableRotors.push({ plotId, mesh: turntable, speed: 0.72 });

    // 5 Additional 3D Mahindra SUVs displayed inside & on the front delivery bay!
    const suvPlacements = [
      { x: -10.5, z: -0.2, ry: 0.3, mat: this.mat.mahindraBlack },
      { x: -5.2,  z: -0.2, ry: -0.2, mat: this.mat.audiWhite },
      { x: 5.2,   z: -0.2, ry: 0.2, mat: this.mat.audiSilver },
      { x: 10.5,  z: -0.2, ry: -0.3, mat: this.mat.mahindraRed },
      { x: -9.8,  z: 4.8,  ry: 0.55, mat: this.mat.audiBlue }
    ];
    suvPlacements.forEach((sp) => {
      const car = makeSUV(sp.mat);
      car.position.set(sp.x, 0.42, sp.z);
      car.rotation.y = sp.ry;
      g.add(car);
    });

    // Sales Executive & Visitor
    const rep = this._createCharacter({ shirtMat: this.mat.mahindraRed, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(rep);
    this.landmarkActors.push({ plotId, mesh: rep, mode: "patrol_x", baseX: 8.5, baseZ: 4.8, range: 2.8, speed: 1.15, phase: 0 });

    g.add(floor, hall, redPortal, frontGlass, roofBand, twinStripe, mainBoard, sideBoard);
    g.userData.labelY = 11.6;
    return g;
  },

  _buildEightPlotBMWShowroom(plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.glass;

    const floor = new THREE.Mesh(this._boxGeo(31.8, 0.16, 13.8), this.mat.marble);
    floor.position.set(0, 0.32, 0);
    const hall = new THREE.Mesh(this._boxGeo(29.8, 6.4, 8.6), this.mat.wallWhite);
    hall.position.set(0, 3.55, -2.2);
    const frontGlass = new THREE.Mesh(this._boxGeo(28.2, 5.0, 0.14), winMat);
    frontGlass.position.set(0, 2.9, 2.16);
    frontGlass.userData.isWindow = true;
    const roofSlab = new THREE.Mesh(this._boxGeo(30.8, 0.72, 9.6), this.mat.cinemaObsidian);
    roofSlab.position.set(0, 7.05, -2.1);

    // Iconic BMW M-Sport Tri-Color Accent Stripes across the Front Fascia!
    const m1 = new THREE.Mesh(this._boxGeo(9.6, 0.28, 0.2), this.mat.bmwMBlueLight);
    m1.position.set(-9.6, 6.55, 2.72);
    const m2 = new THREE.Mesh(this._boxGeo(9.6, 0.28, 0.2), this.mat.bmwMBlueDark);
    m2.position.set(0, 6.55, 2.72);
    const m3 = new THREE.Mesh(this._boxGeo(9.6, 0.28, 0.2), this.mat.bmwMRed);
    m3.position.set(9.6, 6.55, 2.72);

    // Giant Rooftop 3D BMW Roundel Emblem (Rotating Slowly!)
    const roundel = new THREE.Group();
    roundel.position.set(0, 9.45, 1.9);
    const outerRing = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.28, 18), this.mat.cinemaObsidian);
    outerRing.rotation.x = Math.PI / 2;
    const silverRim = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.12, 6, 18), this.mat.bmwSilver);
    const q1 = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.32, 10, 1, false, 0, Math.PI / 2), this.mat.bmwMBlueLight);
    q1.rotation.x = Math.PI / 2;
    const q2 = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.32, 10, 1, false, Math.PI, Math.PI / 2), this.mat.bmwMBlueLight);
    q2.rotation.x = Math.PI / 2;
    const q3 = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.32, 10, 1, false, Math.PI / 2, Math.PI / 2), this.mat.wallWhite);
    q3.rotation.x = Math.PI / 2;
    const q4 = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.32, 10, 1, false, Math.PI * 1.5, Math.PI / 2), this.mat.wallWhite);
    q4.rotation.x = Math.PI / 2;
    roundel.add(outerRing, silverRim, q1, q2, q3, q4);
    g.add(roundel);
    this.turntableRotors.push({ plotId, mesh: roundel, speed: 0.55 });

    const ownerSub = ownerName ? `${ownerName.toUpperCase()} • M4 • X7 • i7 ELECTRIC` : "SHEER DRIVING PLEASURE • M4 • M5 • X7";
    const mainBoard = this._makeBuildingBoard("BMW LUXURY SHOWROOM", ownerSub, "#0f172a", "#38bdf8", 18.0, 1.55);
    mainBoard.position.set(0, 7.05, 2.75);

    // Center Rotating Hero BMW M4 Coupe Turntable!
    const turntable = new THREE.Group();
    turntable.position.set(0, 0.42, 4.4);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.3, 0.24, 20), this.mat.cinemaObsidian);
    const ledRing = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.28, 22), this.mat.bmwMBlueLight);
    ledRing.rotation.x = -Math.PI / 2;
    ledRing.position.y = 0.14;
    const heroBMW = this._makeRealAudiCarMesh(this.mat.audiBlue, false);
    heroBMW.position.set(0, 0.12, 0);
    turntable.add(disc, ledRing, heroBMW);
    g.add(turntable);
    this.turntableRotors.push({ plotId, mesh: turntable, speed: 0.78 });

    // 5 Sleek BMW Sedans & X7 SUVs
    const bmwPlacements = [
      { x: -10.5, z: -0.2, ry: 0.3, mat: this.mat.bmwSilver, suv: false },
      { x: -5.2,  z: -0.2, ry: -0.2, mat: this.mat.audiBlack, suv: true },
      { x: 5.2,   z: -0.2, ry: 0.2, mat: this.mat.audiWhite, suv: false },
      { x: 10.5,  z: -0.2, ry: -0.3, mat: this.mat.audiRed, suv: true },
      { x: 9.8,   z: 4.8,  ry: -0.55, mat: this.mat.audiWhite, suv: false }
    ];
    bmwPlacements.forEach((bp) => {
      const car = this._makeRealAudiCarMesh(bp.mat, bp.suv);
      car.position.set(bp.x, 0.42, bp.z);
      car.rotation.y = bp.ry;
      g.add(car);
    });

    const mgr = this._createCharacter({ shirtMat: this.mat.wallWhite, pantsMat: this.mat.darkPants, scale: 0.94 });
    g.add(mgr);
    this.landmarkActors.push({ plotId, mesh: mgr, mode: "patrol_x", baseX: -8.5, baseZ: 4.8, range: 2.8, speed: 1.1, phase: 1.0 });

    g.add(floor, hall, frontGlass, roofSlab, m1, m2, m3, mainBoard);
    g.userData.labelY = 11.8;
    return g;
  },

  _makeRealAudiCarMesh(bodyMat, isSUV = false) {
    const car = new THREE.Group();
    const len = isSUV ? 4.3 : 4.05;
    const w = isSUV ? 1.88 : 1.78;
    const bodyH = isSUV ? 0.74 : 0.54;

    // 4 Realistic Alloy Wheels
    const wheelR = isSUV ? 0.36 : 0.31;
    const wheelGeo = new THREE.CylinderGeometry(wheelR, wheelR, 0.24, 10);
    wheelGeo.rotateZ(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(wheelR * 0.58, wheelR * 0.58, 0.26, 8);
    rimGeo.rotateZ(Math.PI / 2);
    [[-w / 2 + 0.04, 1.25], [w / 2 - 0.04, 1.25], [-w / 2 + 0.04, -1.2], [w / 2 - 0.04, -1.2]].forEach(([wx, wz]) => {
      const tire = new THREE.Mesh(wheelGeo, this.mat.wheelBlack);
      tire.position.set(wx, wheelR, wz);
      const rim = new THREE.Mesh(rimGeo, this.mat.rimSilver);
      rim.position.set(wx, wheelR, wz);
      car.add(tire, rim);
    });

    // Lower Aerodynamic Body + Sculpted Sloped Hood
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(w, bodyH, len), bodyMat);
    chassis.position.set(0, wheelR + bodyH / 2 - 0.05, 0);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(w - 0.14, 0.18, 1.35), bodyMat);
    hood.position.set(0, wheelR + bodyH + 0.02, 1.22);
    hood.rotation.x = 0.08;

    // Greenhouse Cabin (Sleek Coupe vs Tall Q8 SUV)
    const cabH = isSUV ? 0.64 : 0.46;
    const cabLen = isSUV ? 2.15 : 1.55;
    const cabZ = isSUV ? -0.35 : -0.18;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(w - 0.26, cabH, cabLen), this.mat.audiGlass);
    cab.position.set(0, wheelR + bodyH + cabH / 2 - 0.06, cabZ);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.09, cabLen - 0.22), bodyMat);
    roof.position.set(0, wheelR + bodyH + cabH - 0.04, cabZ);

    // Side Mirrors
    [-w / 2 - 0.08, w / 2 + 0.08].forEach((mx) => {
      const mir = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.18), bodyMat);
      mir.position.set(mx, wheelR + bodyH + 0.1, 0.55);
      car.add(mir);
    });

    // Iconic Audi Hexagonal Singleframe Grille + Mini Chrome Strip
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.34, 0.1), this.mat.charcoal);
    grille.position.set(0, wheelR + 0.2, len / 2 + 0.02);
    const grilleTrim = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.12), this.mat.chrome);
    grilleTrim.position.set(0, wheelR + 0.28, len / 2 + 0.03);

    // Sharp White Audi LED DRL Headlights + Continuous Rear Red LED Lightbar
    const drlGeo = new THREE.BoxGeometry(0.36, 0.1, 0.08);
    const drlL = new THREE.Mesh(drlGeo, this.mat.studioFlash);
    drlL.position.set(-0.62, wheelR + 0.32, len / 2 + 0.02);
    const drlR = drlL.clone();
    drlR.position.x = 0.62;

    const rearBar = new THREE.Mesh(new THREE.BoxGeometry(w - 0.18, 0.12, 0.08), this.mat.taillight);
    rearBar.position.set(0, wheelR + 0.38, -len / 2 - 0.02);

    // Sport Rear Spoiler (Coupe) or Roof Rails (Q8 SUV)
    if (!isSUV) {
      const spoiler = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, 0.08, 0.32), this.mat.charcoal);
      spoiler.position.set(0, wheelR + bodyH + 0.22, -len / 2 + 0.22);
      car.add(spoiler);
    } else {
      [-0.62, 0.62].forEach((rx) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 1.7), this.mat.chrome);
        rail.position.set(rx, wheelR + bodyH + cabH + 0.04, cabZ);
        car.add(rail);
      });
    }

    car.add(chassis, hood, cab, roof, grille, grilleTrim, drlL, drlR, rearBar);
    return car;
  },

  _buildEightPlotAudiShowroom(plotId, ownerName = "") {
    const g = new THREE.Group();

    // Sleek Polished Dark Showroom Floor & Front Outdoor VIP Display Apron
    const floorIndoor = new THREE.Mesh(new THREE.BoxGeometry(31.5, 0.16, 8.8), this.mat.marble);
    floorIndoor.position.set(0, 0.32, -2.4);
    const apronOutdoor = new THREE.Mesh(new THREE.BoxGeometry(32.0, 0.12, 5.4), this.mat.tarmacGrey);
    apronOutdoor.position.set(0, 0.3, 4.7);

    // Architectural Rear Wall + Silver Aluminum Pillars + Glass Curtain Front Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(31.5, 6.2, 0.6), this.mat.audiBlack);
    backWall.position.set(0, 3.4, -6.5);
    const sideWallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 8.8), this.mat.audiSilver);
    sideWallL.position.set(-15.5, 3.4, -2.4);
    const sideWallR = sideWallL.clone();
    sideWallR.position.x = 15.5;

    // Clear Glass Panoramic Windows on Front (so all 4 indoor Audi cars & rotating turntable shine through!)
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(30.6, 5.4, 0.14), this.mat.glass);
    frontGlass.position.set(0, 3.1, 1.9);

    // Sweeping Modern Cantilevered Silver Roof + Dark Fascia + Red Audi Sport Accent Stripe
    const roof = new THREE.Mesh(new THREE.BoxGeometry(32.8, 0.75, 11.4), this.mat.audiSilver);
    roof.position.set(0, 6.85, -1.5);
    const fascia = new THREE.Mesh(new THREE.BoxGeometry(33.0, 1.05, 0.35), this.mat.audiBlack);
    fascia.position.set(0, 6.95, 4.15);
    const redStripe = new THREE.Mesh(new THREE.BoxGeometry(33.1, 0.2, 0.38), this.mat.audiRed);
    redStripe.position.set(0, 6.38, 4.16);

    // Front Support Columns
    [-14.5, -5.2, 5.2, 14.5].forEach((cx) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 6.4, 8), this.mat.audiSilver);
      col.position.set(cx, 3.5, 3.8);
      g.add(col);
    });

    // ICONIC 3D FOUR INTERLOCKING CHROME AUDI RINGS on the Rooftop Pedestal!
    const ringsGroup = new THREE.Group();
    ringsGroup.position.set(0, 8.75, 3.6);
    const ringGeo = new THREE.TorusGeometry(0.92, 0.14, 8, 20);
    [-2.1, -0.7, 0.7, 2.1].forEach((rx) => {
      const ring = new THREE.Mesh(ringGeo, this.mat.audiSilver);
      ring.position.x = rx;
      ringsGroup.add(ring);
    });
    const ringPedestal = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.45, 0.9), this.mat.audiBlack);
    ringPedestal.position.set(0, 7.55, 3.6);
    g.add(ringsGroup, ringPedestal);

    // Mounted Facade Signboard ("AUDI SHOWROOM" + Owner Name!)
    const subTxt = ownerName ? `${ownerName.toUpperCase()} • LUXURY MOTORS` : "LUXURY MOTORS • 8 PLOTS";
    const audiBoard = this._makeBuildingBoard("AUDI SHOWROOM", subTxt, "#09090b", "#ef4444", 12.6, 1.35);
    audiBoard.position.set(-8.6, 6.98, 4.36);
    const audiBoardR = this._makeBuildingBoard("QUATTRO • R8 • Q8", "TEST DRIVE LIVE", "#09090b", "#e2e8f0", 8.8, 1.25);
    audiBoardR.position.set(9.4, 6.98, 4.36);

    // 1. ROTATING CENTER DISPLAY TURNTABLE + PEARL WHITE AUDI R8 SUPERCAR!
    const turntable = new THREE.Group();
    turntable.position.set(0, 0.42, -2.0);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.22, 20), this.mat.audiBlack);
    const ledRing = new THREE.Mesh(new THREE.RingGeometry(3.05, 3.35, 24), this.mat.studioCyan);
    ledRing.rotation.x = -Math.PI / 2;
    ledRing.position.y = 0.13;
    const heroR8 = this._makeRealAudiCarMesh(this.mat.audiWhite, false);
    heroR8.position.set(0, 0.12, 0);
    this.heroAudiSlots.push({ plotId, group: heroR8 });
    if (this.heroModelUrls && this.heroModelUrls.audi) {
      this._loadHeroGLB("audi", this.heroModelUrls.audi, heroR8, 4.3, 0.02, 0);
    }
    turntable.add(disc, ledRing, heroR8);
    g.add(turntable);
    this.turntableRotors.push({ plotId, mesh: turntable, speed: 0.75 });

    // 2. 3 MORE REAL AUDI CARS INSIDE THE GLASS SHOWROOM
    const carRedR8 = this._makeRealAudiCarMesh(this.mat.audiRed, false);
    carRedR8.position.set(-9.5, 0.4, -2.2);
    carRedR8.rotation.y = 0.45;

    const carBlueEtron = this._makeRealAudiCarMesh(this.mat.audiBlue, false);
    carBlueEtron.position.set(9.5, 0.4, -2.2);
    carBlueEtron.rotation.y = -0.45;

    const carSilverQ8 = this._makeRealAudiCarMesh(this.mat.audiSilver, true);
    carSilverQ8.position.set(-12.6, 0.4, -2.2);
    carSilverQ8.rotation.y = 0.25;

    // 3. 2 VIP TEST-DRIVE AUDI CARS PARKED OUTDOOR IN FRONT!
    const carBlackRS7 = this._makeRealAudiCarMesh(this.mat.audiBlack, false);
    carBlackRS7.position.set(-8.2, 0.36, 4.9);
    carBlackRS7.rotation.y = Math.PI / 2 - 0.2;

    const carGoldRS6 = this._makeRealAudiCarMesh(this.mat.richGoldTrim, true);
    carGoldRS6.position.set(8.2, 0.36, 4.9);
    carGoldRS6.rotation.y = -Math.PI / 2 + 0.2;

    g.add(carRedR8, carBlueEtron, carSilverQ8, carBlackRS7, carGoldRS6);

    // Showroom Staff & Visitors admiring the Audi fleet
    const mgr = this._createCharacter({ shirtMat: this.mat.audiBlack, pantsMat: this.mat.darkPants, scale: 0.96 });
    g.add(mgr);
    this.landmarkActors.push({ plotId, mesh: mgr, mode: "patrol_x", baseX: 0, baseZ: 3.4, range: 4.5, speed: 1.1, phase: 0 });

    const buyer = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.96 });
    g.add(buyer);
    this.landmarkActors.push({ plotId, mesh: buyer, mode: "patrol_x", baseX: -8.5, baseZ: 6.4, range: 2.6, speed: 1.2, phase: 1.6 });

    g.add(floorIndoor, apronOutdoor, backWall, sideWallL, sideWallR, frontGlass, roof, fascia, redStripe, audiBoard, audiBoardR);
    g.userData.labelY = 11.4;
    return g;
  },

  _buildTwoPlotBuilding(type, plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;

    if (type === "light_house") return this._buildTwoPlotLightHouse(plotId, ownerName);

    if (type === "beauty_parlour") {
      // 💄 2-PLOT LUXURY BEAUTY PARLOUR & SPA
      const body = new THREE.Mesh(this._boxGeo(13.6, 4.6, 5.5), this.mat.beautyBlush);
      body.position.set(0, 2.35, -0.5);
      const upperBand = new THREE.Mesh(this._boxGeo(14.0, 1.35, 5.9), this.mat.beautyHotPink);
      upperBand.position.set(0, 5.1, -0.5);
      const roseTrim = new THREE.Mesh(this._boxGeo(14.15, 0.24, 6.0), this.mat.beautyRoseGold);
      roseTrim.position.set(0, 4.38, -0.5);
      const goldNeon = new THREE.Mesh(this._boxGeo(14.1, 0.16, 6.0), this.mat.beautySparkleGold);
      goldNeon.position.set(0, 5.82, -0.5);

      const pinkCarpet = new THREE.Mesh(this._boxGeo(3.2, 0.12, 2.6), this.mat.beautyHotPink);
      pinkCarpet.position.set(0, 0.14, 2.9);
      const glassFront = new THREE.Mesh(this._boxGeo(12.2, 3.3, 0.14), this.mat.glass);
      glassFront.position.set(0, 1.95, 2.28);
      const doorFrame = new THREE.Mesh(this._boxGeo(2.8, 2.65, 0.2), this.mat.mansionGoldTrim);
      doorFrame.position.set(0, 1.45, 2.32);

      [-4.2, -2.2, 2.2, 4.2].forEach((mx) => {
        const mir = new THREE.Mesh(this._boxGeo(1.1, 1.75, 0.12), this.mat.mansionWarmGlow);
        mir.position.set(mx, 1.85, -1.6);
        const mirBorder = new THREE.Mesh(this._boxGeo(1.26, 1.92, 0.1), this.mat.mansionGoldTrim);
        mirBorder.position.set(mx, 1.85, -1.66);
        const chair = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.36, 0.8, 8), this.mat.beautyHotPink);
        chair.position.set(mx, 0.55, -0.4);
        g.add(mir, mirBorder, chair);
      });

      const glamSculpture = new THREE.Group();
      glamSculpture.position.set(-4.2, 7.1, 0.2);
      const lipBase = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 1.65, 12), this.mat.cinemaObsidian);
      const lipGold = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.56, 0.85, 12), this.mat.mansionGoldTrim);
      lipGold.position.y = 1.15;
      const lipTip = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.46, 0.95, 10), this.mat.beautyHotPink);
      lipTip.position.y = 1.95;
      const crownRing = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.14, 6, 16), this.mat.mansionGoldTrim);
      crownRing.rotation.x = Math.PI / 2;
      crownRing.position.y = 0.25;
      glamSculpture.add(lipBase, lipGold, lipTip, crownRing);
      g.add(glamSculpture);
      this.turntableRotors.push({ plotId, mesh: glamSculpture, speed: 0.95 });

      const sparkGroup = new THREE.Group();
      sparkGroup.position.set(0, 3.6, 2.7);
      const sparkGeo = new THREE.OctahedronGeometry(0.18, 0);
      for (let s = 0; s < 10; s++) {
        const sp = new THREE.Mesh(sparkGeo, s % 2 === 0 ? this.mat.beautySparklePink : this.mat.beautySparkleGold);
        sp.position.set((s - 4.5) * 1.35, Math.sin(s * 1.3) * 1.2, (s % 2) * 0.45);
        sparkGroup.add(sp);
      }
      g.add(sparkGroup);
      this.beautySparkles.push({ plotId, group: sparkGroup });

      const rawBp = (ownerName || "GLAMOUR").replace(/^@/, "").trim().toUpperCase();
      const bpTitle = rawBp.includes("BEAUTY") || rawBp.includes("PARLOUR") || rawBp.includes("SALON") ? rawBp : `${rawBp} BEAUTY PARLOUR`;
      const bpBoard = this._makeBuildingBoard(bpTitle, "BRIDAL MAKEUP • HAIR SPA • GLOW STUDIO", "#831843", "#fde047", 11.4, 1.35);
      bpBoard.position.set(0.5, 5.1, 2.48);

      const guest1 = this._createCharacter({ shirtMat: this.mat.girlDressPink, pantsMat: this.mat.wallWhite, scale: 0.9 });
      const guest2 = this._createCharacter({ shirtMat: this.mat.girlDressYellow, pantsMat: this.mat.wallWhite, scale: 0.88 });
      g.add(guest1, guest2);
      this.landmarkActors.push({ plotId, mesh: guest1, mode: "enter_z", baseX: -0.5, startZ: 4.1, endZ: 2.0, speed: 0.4, phase: 0.0 });
      this.landmarkActors.push({ plotId, mesh: guest2, mode: "patrol_x", baseX: 2.2, baseZ: 3.1, range: 2.6, speed: 1.05, phase: 1.2 });

      g.add(body, upperBand, roseTrim, goldNeon, pinkCarpet, glassFront, doorFrame, bpBoard);
      g.userData.labelY = 9.8;
      return g;
    }

    if (type === "mobile_showroom") {
      // 📱 2-PLOT MEGA MOBILE SHOWROOM (Sangeetha / Big C Style Smartphone Megastore + Rotating 3D Phone!)
      const mainBody = new THREE.Mesh(new THREE.BoxGeometry(13.6, 4.5, 5.4), this.mat.wallWhite);
      mainBody.position.set(0, 2.3, -0.55);

      const upperBand = new THREE.Mesh(new THREE.BoxGeometry(14.0, 1.35, 5.8), this.mat.mobileBlue);
      upperBand.position.set(0, 5.05, -0.55);
      const orangeStrip = new THREE.Mesh(new THREE.BoxGeometry(14.1, 0.24, 5.86), this.mat.mobileOrange);
      orangeStrip.position.set(0, 4.3, -0.55);
      const cyanStrip = new THREE.Mesh(new THREE.BoxGeometry(14.1, 0.18, 5.86), this.mat.mobileCyanGlow);
      cyanStrip.position.set(0, 5.75, -0.55);

      // Wide Clear Sky-Reflective Glass Storefront + Center Glass Entry Doors
      const glassFront = new THREE.Mesh(new THREE.BoxGeometry(12.2, 3.35, 0.14), this.mat.glass);
      glassFront.position.set(0, 1.95, 2.18);
      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.6, 0.2), this.mat.mobileBlue);
      doorFrame.position.set(0, 1.4, 2.22);

      // Interior Experience Tables with Glowing Demo Smartphones + Accessories Wall!
      [-3.8, 3.8].forEach((tx) => {
        const tbl = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.95, 1.25), this.mat.stuccoIvory);
        tbl.position.set(tx, 0.62, 0.55);
        for (let p = -1; p <= 1; p++) {
          const ph = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.48), this.mat.mobileScreenGlow);
          ph.position.set(tx + p * 0.9, 1.15, 0.55);
          g.add(ph);
        }
        g.add(tbl);
      });
      // Colorful Phone Case & Accessories Wall inside back of store
      const caseWall = new THREE.Mesh(new THREE.BoxGeometry(10.8, 2.4, 0.25), this.mat.mobileBlue);
      caseWall.position.set(0, 1.55, -2.4);
      g.add(caseWall);

      // GIANT ROTATING 3D TITANIUM SMARTPHONE HOLOGRAM ON ROOF!
      const megaPhone = new THREE.Group();
      megaPhone.position.set(-4.2, 7.25, 0.2);
      const pBody = new THREE.Mesh(new THREE.BoxGeometry(1.75, 3.0, 0.32), this.mat.mobileTitanium);
      const pScrF = new THREE.Mesh(new THREE.BoxGeometry(1.52, 2.72, 0.08), this.mat.mobileScreenGlow);
      pScrF.position.z = 0.16;
      const pScrB = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.12), this.mat.cinemaObsidian);
      pScrB.position.set(-0.32, 0.85, -0.18);
      megaPhone.add(pBody, pScrF, pScrB);
      g.add(megaPhone);
      this.turntableRotors.push({ plotId, mesh: megaPhone, speed: 1.05 });

      // Mini Rooftop 5G Signal Mast on Right Side
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.6, 6), this.mat.chrome);
      mast.position.set(4.8, 7.0, -0.4);
      const signalRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 6, 14), this.mat.mobileCyanGlow);
      signalRing.position.set(4.8, 8.1, -0.4);
      g.add(mast, signalRing);

      // Personalized Main Mega Mobile Showroom Signboard + Brand Banner!
      const rawShow = (ownerName || "SHERU BHAI").replace(/^@/, "").trim().toUpperCase();
      const showTitle = rawShow.includes("MOBILE") ? rawShow : `${rawShow} MOBILES`;
      const mainBoard = this._makeBuildingBoard(showTitle, "iPHONE • SAMSUNG • REDMI • 5G REPAIR", "#0f172a", "#22d3ee", 11.4, 1.32);
      mainBoard.position.set(0.5, 5.05, 2.38);

      // Sidewalk Promotional Standee + Animated Shoppers!
      const standee = this._makeBuildingBoard("5G EXCHANGE", "0% EMI LIVE!", "#f97316", "#ffffff", 1.75, 1.35);
      standee.position.set(-5.2, 1.15, 2.9);
      g.add(standee);

      const buyer = this._createCharacter({ shirtMat: this.mat.mobileOrange, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(buyer);
      this.landmarkActors.push({ plotId, mesh: buyer, mode: "patrol_x", baseX: 0, baseZ: 2.85, range: 3.4, speed: 1.25, phase: 0 });

      g.add(mainBody, upperBand, orangeStrip, cyanStrip, glassFront, doorFrame, mainBoard);
      g.userData.labelY = 9.4;
      return g;
    }

    if (type === "beach_villa_2") {
      // 🏖️ ADDABLE 2-PLOT LUXURY MEGA BEACH HOUSE VILLA (Wide Infinity Pool + Dual Suites + Palm Lounge!)
      const deck = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.36, 6.4), this.mat.teakWood);
      deck.position.set(0, 0.18, 0);
      const pool = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 2.1), this.mat.water);
      pool.position.set(-2.2, 0.19, 1.85);

      const f1 = new THREE.Mesh(new THREE.BoxGeometry(12.2, 2.8, 3.5), this.mat.wallWhite);
      f1.position.set(0, 1.75, -1.2);
      const teakWing = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.85, 3.7), this.mat.teakWood);
      teakWing.position.set(4.5, 1.75, -1.2);
      const g1 = new THREE.Mesh(new THREE.BoxGeometry(7.8, 2.2, 0.14), winMat);
      g1.position.set(-1.2, 1.55, 0.56);
      g1.userData.isWindow = true;

      const slab = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.28, 4.6), this.mat.wallWhite);
      slab.position.set(0, 3.28, -0.75);
      const f2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 2.5, 3.2), this.mat.stuccoIvory);
      f2.position.set(0.8, 4.66, -1.25);
      const g2 = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.85, 0.14), winMat);
      g2.position.set(0.8, 4.62, 0.36);
      g2.userData.isWindow = true;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.72, 0.12), this.mat.glass);
      rail.position.set(0, 3.76, 1.48);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.28, 4.0), this.mat.slateTrim);
      roof.position.set(0.6, 6.02, -1.1);

      const cleanO = (ownerName || "VIP VILLA").trim().toUpperCase();
      const vBoard = this._makeBuildingBoard(cleanO, "LUXURY BEACH HOUSE VILLA", "#0f172a", "#38bdf8", 7.6, 1.15);
      vBoard.position.set(0.6, 6.2, 0.94);

      const lounger = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.32, 0.95), this.mat.wallWhite);
      lounger.position.set(3.4, 0.52, 1.9);
      const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 5), this.mat.richGoldTrim);
      uPole.position.set(4.5, 1.45, 2.1);
      const uTop = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.45, 8), this.mat.studioCyan);
      uTop.position.set(4.5, 2.6, 2.1);
      const surf = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.1, 0.52), this.mat.petrolYellow);
      surf.position.set(-6.1, 1.35, 1.9);
      surf.rotation.z = 0.2;

      g.add(deck, pool, f1, teakWing, g1, slab, f2, g2, rail, roof, vBoard, lounger, uPole, uTop, surf);
      g.userData.labelY = 8.4;
      return g;
    }

    // Main Modern Studio Structure (13.4 wide x 4.4 tall x 5.6 deep)
    const body = new THREE.Mesh(new THREE.BoxGeometry(13.4, 4.4, 5.4), this.mat.charcoal);
    body.position.set(0, 2.25, -0.5);

    const creamWing = new THREE.Mesh(new THREE.BoxGeometry(4.4, 4.5, 5.6), this.mat.stuccoIvory);
    creamWing.position.set(-4.6, 2.3, -0.45);

    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.42, 6.2), this.mat.slateTrim);
    roofSlab.position.set(0, 4.65, -0.3);

    const neonBar = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.16, 0.2), this.mat.studioCyan);
    neonBar.position.set(0, 4.42, 2.82);

    // Wide Clear Glass Studio Display Window (Right & Center) + Entrance Door (Left)
    const studioGlass = new THREE.Mesh(new THREE.BoxGeometry(7.8, 3.1, 0.12), this.mat.glass);
    studioGlass.position.set(2.1, 1.8, 2.22);

    const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.16), this.mat.teakWood);
    door.position.set(-4.6, 1.35, 2.36);
    const winSide = new THREE.Mesh(this.geo.win, winMat);
    winSide.position.set(-4.6, 3.3, 2.38);
    winSide.userData.isWindow = true;

    // GIANT 3D DSLR CAMERA SCULPTURE MOUNTED ON THE STUDIO ROOF!
    const camGroup = new THREE.Group();
    camGroup.position.set(-4.4, 5.75, 0.2);
    const camBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.65, 1.15), this.mat.audiBlack);
    const camGrip = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.68, 1.32), this.mat.charcoal);
    camGrip.position.set(-1.1, 0, 0.1);
    const camPrism = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 0.95), this.mat.audiBlack);
    camPrism.position.set(0.1, 1.05, 0);
    const shutterBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 8), this.mat.audiRed);
    shutterBtn.position.set(-0.95, 0.9, 0.15);
    const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.72, 1.05, 14), this.mat.charcoal);
    lensBarrel.rotation.x = Math.PI / 2;
    lensBarrel.position.set(0.15, -0.05, 0.85);
    const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.06, 6, 16), this.mat.richGoldTrim);
    lensRing.position.set(0.15, -0.05, 1.25);
    const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.08, 12), this.mat.oceanDeep);
    lensGlass.rotation.x = Math.PI / 2;
    lensGlass.position.set(0.15, -0.05, 1.38);
    camGroup.add(camBody, camGrip, camPrism, shutterBtn, lensBarrel, lensRing, lensGlass);

    // PERSONALIZED FOLLOWER PHOTO STUDIO SIGNBOARD (shows follower's exact name!)
    const cleanName = (ownerName || "PRO PHOTO").replace(/^@/, "").toUpperCase();
    const titleStr = cleanName.length > 12 ? cleanName.slice(0, 12) : `${cleanName} STUDIO`;
    const studioBoard = this._makeBuildingBoard(titleStr, "PHOTO • VIDEO • DRONE 4K", "#0f172a", "#22d3ee", 8.4, 1.25);
    studioBoard.position.set(2.1, 4.95, 2.86);

    // INTERIOR STUDIO SCENE (Visible right through the glass window + outdoor photoshoot bay!)
    const backdrop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.9, 0.12), this.mat.wallWhite);
    backdrop.position.set(4.2, 1.65, -0.6);

    // 2 Studio Softbox Lights on Tripods + Periodic Animated Camera Flash!
    const flashBulb = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.25), this.mat.studioFlash);
    flashBulb.position.set(2.2, 2.35, 0.65);
    flashBulb.rotation.y = Math.PI / 4;
    const stand1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.2, 5), this.mat.charcoal);
    stand1.position.set(2.2, 1.15, 0.65);
    this.studioFlashes.push({ plotId, mesh: flashBulb, phase: Math.random() * 6 });

    // Photographer with Tripod Camera + Posing Model right in front of the studio!
    const tripod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.25, 1.2, 4), this.mat.charcoal);
    tripod.position.set(0.6, 0.65, 2.95);
    const miniCam = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.35), this.mat.audiBlack);
    miniCam.position.set(0.6, 1.35, 2.95);

    const photog = this._createCharacter({ shirtMat: this.mat.charcoal, pantsMat: this.mat.darkPants, scale: 0.92 });
    photog.position.set(-0.15, 0.14, 2.95);
    photog.rotation.y = Math.PI / 2;

    const model = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.wallBlue, scale: 0.92 });
    g.add(model);
    this.landmarkActors.push({ plotId, mesh: model, mode: "guard", baseX: 2.8, baseZ: 2.95, range: 0.4, speed: 1.8, phase: 0 });

    g.add(body, creamWing, roofSlab, neonBar, studioGlass, door, winSide, camGroup, studioBoard, backdrop, stand1, flashBulb, tripod, miniCam, photog);
    g.userData.labelY = 7.8;
    return g;
  },

  _buildEightPlotCricketStadium(plotId) {
    const g = new THREE.Group();

    const pitch = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.08, 2.2), this.mat.pitch);
    pitch.position.set(0, 0.28, 0.4);

    const boundary = new THREE.Mesh(new THREE.RingGeometry(5.6, 5.9, 32), this.mat.stripe);
    boundary.rotation.x = -Math.PI / 2;
    boundary.scale.set(2.15, 1.0, 1.0);
    boundary.position.set(0, 0.29, 0.4);

    [-3.8, 3.8].forEach((wx) => {
      const stump = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.52), this.mat.wood);
      stump.position.set(wx, 0.56, 0.4);
      g.add(stump);
    });

    const standN1 = new THREE.Mesh(new THREE.BoxGeometry(24.0, 1.4, 2.2), this.mat.wallWhite);
    standN1.position.set(0, 0.9, -6.2);
    const standN2 = new THREE.Mesh(new THREE.BoxGeometry(24.0, 2.6, 1.2), this.mat.wallBlue);
    standN2.position.set(0, 1.5, -6.8);
    const roofN = new THREE.Mesh(new THREE.BoxGeometry(25.0, 0.28, 3.0), this.mat.navy);
    roofN.position.set(0, 3.6, -6.2);

    const sbPole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 0.4), this.mat.lampPole);
    sbPole.position.set(-14.8, 2.2, 0.4);
    const sbScreen = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.4, 5.2), this.mat.highway);
    sbScreen.position.set(-14.6, 4.2, 0.4);
    const sbGlow = this._makeBuildingBoard("DREAM CITY 184/3", "OVERS 18.2 • LIVE MATCH", "#0f172a", "#4ade80", 4.6, 1.9);
    sbGlow.rotation.y = Math.PI / 2;
    sbGlow.position.set(-14.55, 4.2, 0.4);

    [[-15.2, -6.4], [0, -6.8], [15.2, -6.4], [-15.2, 6.4], [0, 6.8], [15.2, 6.4]].forEach(([fx, fz]) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 7.6, 5), this.mat.lampPole);
      tower.position.set(fx, 3.9, fz);
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 0.28), this.mat.lampBulbDay);
      bulb.position.set(fx, 7.6, fz);
      bulb.lookAt(0, 0, 0);
      this.lampBulbs.push(bulb);
      g.add(tower, bulb);
    });

    const bat1 = this._createCharacter({ shirtMat: this.mat.jerseyBlue, pantsMat: this.mat.wallWhite, scale: 0.9, hasBat: true });
    g.add(bat1);
    this.landmarkActors.push({ plotId, mesh: bat1, mode: "hop", baseX: 3.3, baseZ: 0.4, range: 0.2, speed: 4.0, phase: 0 });

    const bat2 = this._createCharacter({ shirtMat: this.mat.jerseyBlue, pantsMat: this.mat.wallWhite, scale: 0.9, hasBat: true });
    g.add(bat2);
    this.landmarkActors.push({ plotId, mesh: bat2, mode: "hop", baseX: -3.2, baseZ: 1.1, range: 0.15, speed: 3.2, phase: 1.2 });

    const bowler = this._createCharacter({ shirtMat: this.mat.jerseyRed, pantsMat: this.mat.wallWhite, scale: 0.9 });
    g.add(bowler);
    this.landmarkActors.push({ plotId, mesh: bowler, mode: "patrol_x", baseX: -5.4, baseZ: 0.4, range: 1.8, speed: 3.2, phase: 0.5 });

    const keeper = this._createCharacter({ shirtMat: this.mat.jerseyYellow, pantsMat: this.mat.darkPants, scale: 0.88 });
    g.add(keeper);
    this.landmarkActors.push({ plotId, mesh: keeper, mode: "guard", baseX: 5.2, baseZ: 0.4, range: 0.1, speed: 2.0, phase: 0 });

    const fielders = [[-9.5, -2.8], [-9.5, 3.6], [0, 4.6], [8.5, -3.2], [9.2, 3.8], [12.0, 0.4]];
    fielders.forEach(([fx, fz], idx) => {
      const kid = this._createCharacter({
        shirtMat: idx % 2 === 0 ? this.mat.jerseyYellow : this.mat.jerseyRed,
        pantsMat: this.mat.darkPants,
        scale: 0.84
      });
      g.add(kid);
      this.landmarkActors.push({
        plotId, mesh: kid, mode: "orbit",
        baseX: fx, baseZ: fz, range: 1.1, speed: 2.2 + (idx % 2) * 0.5, phase: idx * 1.1
      });
    });

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), this.mat.ballRed);
    g.add(ball);
    this.landmarkActors.push({ plotId, mesh: ball, mode: "ball_x", baseX: 0, baseZ: 0.4, range: 3.5, speed: 3.8, phase: 0 });

    g.add(pitch, boundary, standN1, standN2, roofN, sbPole, sbScreen, sbGlow);
    return g;
  },

  _buildFourPlotLandmark(type, plotId, ownerName = "") {
    const g = new THREE.Group();
    const winMat = this.timeOfDay === "night" ? this.mat.windowNight : this.mat.windowDay;





    if (type === "ff_office") return this._buildFourPlotFFOffice(plotId, ownerName);
    if (type === "ayyappa_temple") return this._buildFourPlotAyyappaTemple(plotId, ownerName);
    if (type === "yamaha_showroom") return this._buildFourPlotYamahaShowroom(plotId, ownerName);
    if (type === "stark_tower") return this._buildFourPlotStarkTower(plotId, ownerName);
    if (type === "lc_mart") return this._buildFourPlotLCMart(plotId, ownerName);
    if (type === "bar_lounge") return this._buildFourPlotBarLounge(plotId, ownerName);

    // 4-PLOT SACRED TIRUMALA VENKATESWARA SWAMY TEMPLE (`tirumala_temple`) — For @bobby_official_333!
    if (type === "tirumala_temple") {
      // Sacred Prakaram Courtyard Floor + Traditional White & Red-Striped Outer Compound Wall!
      const court = new THREE.Mesh(this._boxGeo(13.8, 0.22, 13.8), this.mat.marble);
      court.position.set(0, 0.14, 0);
      const wallL = new THREE.Mesh(this._boxGeo(0.5, 2.2, 12.6), this.mat.wallWhite);
      wallL.position.set(-6.5, 1.25, 0);
      const wallR = wallL.clone();
      wallR.position.x = 6.5;
      const wallB = new THREE.Mesh(this._boxGeo(13.4, 2.2, 0.5), this.mat.wallWhite);
      wallB.position.set(0, 1.25, -6.5);
      // Iconic Red Vertical Temple Stripes along outer walls
      for (let s = -5.4; s <= 5.4; s += 1.8) {
        const stL = new THREE.Mesh(this._boxGeo(0.56, 2.15, 0.35), this.mat.templeRedStripe);
        stL.position.set(-6.5, 1.25, s);
        const stR = stL.clone();
        stR.position.x = 6.5;
        g.add(stL, stR);
      }

      // Main Sanctum Mandapam + Multi-Tiered Golden ANANDA NILAYAM VIMANA GOPURAM!
      const mandapam = new THREE.Mesh(this._boxGeo(7.6, 3.4, 6.2), this.mat.wallWhite);
      mandapam.position.set(0, 1.95, -2.3);
      const goldTier1 = new THREE.Mesh(this._boxGeo(6.4, 1.3, 5.2), this.mat.templeGold);
      goldTier1.position.set(0, 4.25, -2.3);
      const goldTier2 = new THREE.Mesh(this._boxGeo(4.8, 1.25, 4.0), this.mat.templeGold);
      goldTier2.position.set(0, 5.45, -2.3);
      const goldTier3 = new THREE.Mesh(this._boxGeo(3.2, 1.15, 2.8), this.mat.templeGold);
      goldTier3.position.set(0, 6.55, -2.3);
      const vimanaDome = new THREE.Mesh(new THREE.SphereGeometry(1.55, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.mat.templeGold);
      vimanaDome.position.set(0, 7.1, -2.3);
      const kalasam = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.15, 8), this.mat.templeGold);
      kalasam.position.set(0, 9.0, -2.3);

      // Front Raja Gopuram Entry Arch + Sacred Glowing Tirunamam (White U + Red Tilakam)!
      const gopBase = new THREE.Mesh(this._boxGeo(6.4, 3.6, 1.8), this.mat.wallWhite);
      gopBase.position.set(0, 2.05, 5.4);
      const gopDoor = new THREE.Mesh(this._boxGeo(2.4, 2.6, 1.92), this.mat.cinemaObsidian);
      gopDoor.position.set(0, 1.55, 5.4);
      const gopT1 = new THREE.Mesh(this._boxGeo(5.6, 1.15, 1.5), this.mat.templeSaffron);
      gopT1.position.set(0, 4.35, 5.4);
      const gopT2 = new THREE.Mesh(this._boxGeo(4.2, 1.05, 1.2), this.mat.templeGold);
      gopT2.position.set(0, 5.4, 5.4);
      // 3 Golden Gopuram Kalasams
      [-1.2, 0, 1.2].forEach((kx) => {
        const gk = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.72, 6), this.mat.templeGold);
        gk.position.set(kx, 6.25, 5.4);
        g.add(gk);
      });
      // Glowing White-Red Tirunamam Emblem on Raja Gopuram Front!
      const namL = new THREE.Mesh(this._boxGeo(0.24, 1.0, 0.14), this.mat.wallWhite);
      namL.position.set(-0.42, 4.4, 6.24);
      const namR = namL.clone();
      namR.position.x = 0.42;
      const namB = new THREE.Mesh(this._boxGeo(1.08, 0.24, 0.14), this.mat.wallWhite);
      namB.position.set(0, 3.95, 6.24);
      const namCenter = new THREE.Mesh(this._boxGeo(0.22, 0.9, 0.16), this.mat.oyoRed);
      namCenter.position.set(0, 4.45, 6.26);

      // Tall Golden Dwajasthambam (Temple Flag Pillar) + 4 Glowing Brass Deepam Lamps!
      const dwaja = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 6.2, 8), this.mat.templeGold);
      dwaja.position.set(0, 3.35, 2.2);
      const dwajaBase = new THREE.Mesh(this._boxGeo(1.2, 0.7, 1.2), this.mat.templeGold);
      dwajaBase.position.set(0, 0.6, 2.2);
      [[-2.6, 3.6], [2.6, 3.6], [-2.6, 6.6], [2.6, 6.6]].forEach(([dx, dz]) => {
        const lampStand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 1.15, 6), this.mat.templeGold);
        lampStand.position.set(dx, 0.8, dz);
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), this.mat.templeLampGlow);
        flame.position.set(dx, 1.48, dz);
        g.add(lampStand, flame);
      });

      const tBoard = this._makeBuildingBoard("OM NAMO VENKATESAYA", ownerName ? `TIRUMALA TEMPLE • ${ownerName.toUpperCase()}` : "TIRUMALA VENKATESWARA SWAMY TEMPLE", "#991b1b", "#facc15", 8.4, 1.2);
      tBoard.position.set(0, 3.35, 6.38);

      // Animated Devotees doing Pradakshina!
      const dev1 = this._createCharacter({ shirtMat: this.mat.templeSaffron, pantsMat: this.mat.wallWhite, scale: 0.92 });
      g.add(dev1);
      this.landmarkActors.push({ plotId, mesh: dev1, mode: "patrol_x", baseX: 0, baseZ: 3.5, range: 3.4, speed: 0.95, phase: 0 });

      g.add(court, wallL, wallR, wallB, mandapam, goldTier1, goldTier2, goldTier3, vimanaDome, kalasam, gopBase, gopDoor, gopT1, gopT2, namL, namR, namB, namCenter, dwaja, dwajaBase, tBoard);
      g.userData.labelY = 10.6;
      return g;
    }

    // 4-PLOT 20-FLOOR OYO ROOMS SKYSCRAPER (`hotel_oyo`)
    // Towering 20-story OYO Rooms landmark with dedicated Car Parking + Animated Boys & Girls walking together inside!
    if (type === "hotel_oyo") {
      const floors = 20;
      const floorH = 1.25;
      const totalH = floors * floorH + 2.2; // ~27.2 units tall!

      // Main 20-Floor Skyscraper Core + Iconic Red Vertical OYO Pillar Rib & Rooftop Crown!
      const tower = new THREE.Mesh(this._boxGeo(9.6, totalH, 6.2), this.mat.wallWhite);
      tower.position.set(0, totalH / 2 + 0.1, -2.5);

      const redSpineL = new THREE.Mesh(this._boxGeo(0.75, totalH + 0.4, 6.4), this.mat.oyoRed);
      redSpineL.position.set(-4.6, totalH / 2 + 0.2, -2.5);
      const redSpineR = redSpineL.clone();
      redSpineR.position.x = 4.6;

      const redCrown = new THREE.Mesh(this._boxGeo(10.4, 2.0, 6.8), this.mat.oyoRed);
      redCrown.position.set(0, totalH + 1.0, -2.5);

      // All 20 Floors of Sunlit Glass Suites & Balconies batched into TWO lightweight InstancedMeshes (Zero Lag!)
      const winGeo = this._boxGeo(8.2, 0.72, 0.14);
      const balcGeo = this._boxGeo(8.6, 0.14, 0.55);
      const winInst = new THREE.InstancedMesh(winGeo, winMat, floors);
      winInst.userData.isWindow = true;
      const balcInst = new THREE.InstancedMesh(balcGeo, this.mat.slateTrim, floors);
      const fDummy = new THREE.Object3D();
      for (let f = 0; f < floors; f++) {
        const fy = 2.6 + f * floorH;
        fDummy.position.set(0, fy, 0.65);
        fDummy.updateMatrix();
        winInst.setMatrixAt(f, fDummy.matrix);
        fDummy.position.set(0, fy - 0.42, 0.88);
        fDummy.updateMatrix();
        balcInst.setMatrixAt(f, fDummy.matrix);
      }
      winInst.instanceMatrix.needsUpdate = true;
      balcInst.instanceMatrix.needsUpdate = true;

      // Ground Floor Grand OYO Glass Lobby Entrance + Red Portico Canopy + VIP Red Carpet!
      const lobbyGlass = new THREE.Mesh(this._boxGeo(6.4, 2.1, 0.18), this.mat.glass);
      lobbyGlass.position.set(0, 1.15, 0.65);
      const canopy = new THREE.Mesh(this._boxGeo(6.8, 0.45, 2.6), this.mat.oyoRed);
      canopy.position.set(0, 2.35, 1.85);
      const carpet = new THREE.Mesh(this._boxGeo(2.4, 0.14, 2.8), this.mat.oyoRed);
      carpet.position.set(0, 0.15, 1.9);

      // Dedicated OYO Front Car Parking Lot (z = 4.8) with Painted Bays & Parked Cars!
      const oyoPark = new THREE.Mesh(this._boxGeo(13.2, 0.1, 3.6), this.mat.tarmacGrey);
      oyoPark.position.set(0, 0.12, 4.9);
      [-5.2, -2.6, 2.6, 5.2].forEach((lx) => {
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2.7), this.mat.stripe);
        pl.rotation.x = -Math.PI / 2;
        pl.position.set(lx, 0.2, 4.9);
        g.add(pl);
      });
      const oCar1 = this._makeVehicleMesh(false, false, 0x1e293b, false);
      oCar1.position.set(-3.9, 0.18, 4.9);
      const oCar2 = this._makeVehicleMesh(false, false, 0xf8fafc, false);
      oCar2.position.set(3.9, 0.18, 4.9);

      // Iconic Rooftop & Entrance OYO Signboards (visible from across the whole city & beach!)
      const hTitle = ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} • 20 FLOORS` : "20 FLOORS • COUPLE FRIENDLY • AC";
      const oyoTop = this._makeBuildingBoard("OYO ROOMS", hTitle, "#ee2e24", "#ffffff", 9.8, 1.75);
      oyoTop.position.set(0, totalH + 1.0, 0.96);
      const oyoTopBack = oyoTop.clone();
      oyoTopBack.rotation.y = Math.PI;
      oyoTopBack.position.z = -5.96;
      const oyoEntry = this._makeBuildingBoard("OYO • CHECK-IN", "20 FLOORS • FREE PARKING", "#ffffff", "#ee2e24", 5.4, 0.72);
      oyoEntry.position.set(0, 2.4, 3.18);

      // 👫 ANIMATED BOYS & GIRLS WALKING TOGETHER IN PAIRS INTO THE OYO ENTRANCE!
      const makeCouple = (shirtBoy, dressGirl, phaseOffset, laneX) => {
        const pair = new THREE.Group();
        const boy = this._createCharacter({ shirtMat: shirtBoy, pantsMat: this.mat.darkPants, scale: 0.94 });
        boy.position.x = -0.34;
        const girl = this._createCharacter({ shirtMat: dressGirl, pantsMat: this.mat.wallWhite, scale: 0.88 });
        girl.position.x = 0.34;
        pair.add(boy, girl);
        g.add(pair);
        this.landmarkActors.push({
          plotId,
          mesh: pair,
          mode: "enter_z",
          baseX: laneX,
          startZ: 4.5,
          endZ: 0.65,
          speed: 0.42,
          phase: phaseOffset
        });
      };
      makeCouple(this.mat.wallBlue, this.mat.girlDressPink, 0.0, -0.35);
      makeCouple(this.mat.cinemaObsidian, this.mat.girlDressYellow, 0.52, 0.45);

      g.add(tower, redSpineL, redSpineR, redCrown, winInst, balcInst, lobbyGlass, canopy, carpet, oyoPark, oCar1, oCar2, oyoTop, oyoTopBack, oyoEntry);
      g.userData.labelY = totalH + 4.4;
      return g;
    }

    // 4-PLOT BOYS & GIRLS HOSTEL (`hostel`) — Coastal & City Multi-Floor Hostel with Balconies & Bike Parking!
    if (type === "hostel") {
      const body = new THREE.Mesh(this._boxGeo(11.6, 7.6, 7.0), this.mat.wallCream);
      body.position.set(0, 3.85, -2.2);
      const topTrim = new THREE.Mesh(this._boxGeo(12.2, 1.15, 7.6), this.mat.hostelTeal);
      topTrim.position.set(0, 8.15, -2.2);
      const sideAccentL = new THREE.Mesh(this._boxGeo(1.4, 7.7, 7.2), this.mat.hostelPeach);
      sideAccentL.position.set(-5.2, 3.85, -2.2);
      const sideAccentR = sideAccentL.clone();
      sideAccentR.position.x = 5.2;

      for (let f = 0; f < 3; f++) {
        const fy = 2.0 + f * 2.0;
        const winRow = new THREE.Mesh(this._boxGeo(8.2, 1.05, 0.14), winMat);
        winRow.position.set(0, fy, 1.36);
        winRow.userData.isWindow = true;
        const balc = new THREE.Mesh(this._boxGeo(8.8, 0.22, 0.85), this.mat.hostelTeal);
        balc.position.set(0, fy - 0.58, 1.75);
        g.add(winRow, balc);
      }

      // Entrance Gate + Scooter / Bike Parking Bay for Hostel Students!
      const porch = new THREE.Mesh(this._boxGeo(4.2, 0.35, 2.0), this.mat.hostelTeal);
      porch.position.set(0, 2.25, 2.3);
      const bikeBay = new THREE.Mesh(this._boxGeo(11.8, 0.1, 3.2), this.mat.tarmacGrey);
      bikeBay.position.set(0, 0.12, 4.9);
      [-4.2, -2.8, 2.8, 4.2].forEach((bx, idx) => {
        const sc = new THREE.Mesh(this._boxGeo(0.42, 0.72, 1.25), idx % 2 === 0 ? this.mat.wallBlue : this.mat.oyoRed);
        sc.position.set(bx, 0.52, 4.9);
        g.add(sc);
      });

      const hName = ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} HOSTEL` : "SHERU BHAI HOSTEL";
      const hBoard = this._makeBuildingBoard(hName, "BOYS & GIRLS • AC ROOMS • MESS & WIFI", "#0f766e", "#facc15", 10.6, 1.35);
      hBoard.position.set(0, 8.15, 1.66);

      const st1 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.92 });
      const st2 = this._createCharacter({ shirtMat: this.mat.girlDressPurple, pantsMat: this.mat.wallWhite, scale: 0.88 });
      g.add(st1, st2);
      this.landmarkActors.push({ plotId, mesh: st1, mode: "patrol_x", baseX: 0, baseZ: 3.1, range: 3.2, speed: 1.15, phase: 0 });
      this.landmarkActors.push({ plotId, mesh: st2, mode: "enter_z", baseX: 0.5, startZ: 4.5, endZ: 1.3, speed: 0.36, phase: 0.25 });

      g.add(body, topTrim, sideAccentL, sideAccentR, porch, bikeBay, hBoard);
      g.userData.labelY = 10.6;
      return g;
    }

    // 4-PLOT FLOODLIT BOX CRICKET TURF ARENA (`box_cricket`)
    if (type === "box_cricket") {
      const turf = new THREE.Mesh(this._boxGeo(13.6, 0.22, 13.6), this.mat.turf);
      turf.position.set(0, 0.14, 0);
      const pitch = new THREE.Mesh(this._boxGeo(2.4, 0.25, 8.6), this.mat.pitch);
      pitch.position.set(0, 0.16, 0);

      const netCage = new THREE.Mesh(this._boxGeo(12.6, 5.6, 12.6), this.mat.cricketNetMat);
      netCage.position.set(0, 3.05, 0);

      [[-6.3, -6.3], [6.3, -6.3], [-6.3, 6.3], [6.3, 6.3]].forEach(([px, pz]) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 6.8, 6), this.mat.cinemaObsidian);
        pole.position.set(px, 3.45, pz);
        const lampHead = new THREE.Mesh(this._boxGeo(1.1, 0.45, 0.35), this.mat.floodlightGlow);
        lampHead.position.set(px * 0.94, 6.85, pz * 0.94);
        lampHead.lookAt(0, 0, 0);
        g.add(pole, lampHead);
      });

      [-3.8, 3.8].forEach((sz) => {
        const stumps = new THREE.Mesh(this._boxGeo(0.55, 0.85, 0.1), this.mat.petrolYellow);
        stumps.position.set(0, 0.65, sz);
        g.add(stumps);
      });

      const bcTitle = ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} TURF` : "SHERU BHAI BOX CRICKET";
      const bcBoard = this._makeBuildingBoard(bcTitle, "DAY & NIGHT TURF • BOOK SLOT", "#14532d", "#facc15", 10.6, 1.35);
      bcBoard.position.set(0, 6.2, 6.35);

      const bat = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.wallWhite, scale: 0.92 });
      const bowl = this._createCharacter({ shirtMat: this.mat.oyoRed, pantsMat: this.mat.darkPants, scale: 0.92 });
      g.add(bat, bowl);
      this.landmarkActors.push({ plotId, mesh: bat, mode: "hop", baseX: 0.4, baseZ: 3.1, range: 0.3, speed: 3.2, phase: 0 });
      this.landmarkActors.push({ plotId, mesh: bowl, mode: "patrol_z", baseX: -0.4, baseZ: -2.6, range: 1.8, speed: 2.2, phase: 0.8 });

      g.add(turf, pitch, netCage, bcBoard);
      g.userData.labelY = 8.8;
      return g;
    }

    // 4-PLOT GT650 & SUPERBIKE SHOWROOM (`bike_showroom`)
    if (type === "bike_showroom") {
      const floor = new THREE.Mesh(this._boxGeo(13.6, 0.16, 13.6), this.mat.marble);
      floor.position.set(0, 0.12, 0);
      const hall = new THREE.Mesh(this._boxGeo(12.6, 5.2, 7.6), this.mat.cinemaObsidian);
      hall.position.set(0, 2.75, -2.4);
      const goldBand = new THREE.Mesh(this._boxGeo(13.0, 0.32, 8.0), this.mat.bikeChromeGold);
      goldBand.position.set(0, 5.45, -2.4);
      const frontGlass = new THREE.Mesh(this._boxGeo(11.4, 3.8, 0.14), winMat);
      frontGlass.position.set(0, 2.2, 1.44);
      frontGlass.userData.isWindow = true;

      const makeSuperbike = (tankMat) => {
        const bk = new THREE.Group();
        const wGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.18, 10);
        wGeo.rotateZ(Math.PI / 2);
        const wF = new THREE.Mesh(wGeo, this.mat.wheelBlack);
        wF.position.set(0, 0.36, 0.72);
        const wB = wF.clone();
        wB.position.z = -0.72;
        const chassis = new THREE.Mesh(this._boxGeo(0.34, 0.42, 1.3), this.mat.chrome);
        chassis.position.set(0, 0.56, 0);
        const tank = new THREE.Mesh(this._boxGeo(0.42, 0.36, 0.78), tankMat);
        tank.position.set(0, 0.88, 0.18);
        const seat = new THREE.Mesh(this._boxGeo(0.36, 0.18, 0.62), this.mat.cinemaObsidian);
        seat.position.set(0, 0.82, -0.45);
        const handle = new THREE.Mesh(this._boxGeo(0.75, 0.08, 0.1), this.mat.chrome);
        handle.position.set(0, 1.05, 0.55);
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), this.mat.floodlightGlow);
        hl.position.set(0, 0.92, 0.78);
        bk.add(wF, wB, chassis, tank, seat, handle, hl);
        return bk;
      };

      const roofDeck = new THREE.Group();
      roofDeck.position.set(0, 5.75, -1.6);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.28, 16), this.mat.cinemaObsidian);
      const ledRing = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.36, 18), this.mat.bikeChromeGold);
      ledRing.rotation.x = -Math.PI / 2;
      ledRing.position.y = 0.16;
      const heroBike = makeSuperbike(this.mat.bikeChromeGold);
      heroBike.scale.setScalar(1.65);
      heroBike.position.y = 0.16;
      roofDeck.add(disc, ledRing, heroBike);
      g.add(roofDeck);
      this.turntableRotors.push({ plotId, mesh: roofDeck, speed: 0.9 });

      const bColors = [this.mat.bikeRacingRed, this.mat.bikeChromeGold, this.mat.bmwMBlueLight, this.mat.wallWhite];
      [-4.2, -1.5, 1.5, 4.2].forEach((bx, i) => {
        const b = makeSuperbike(bColors[i]);
        b.position.set(bx, 0.2, 3.6);
        b.rotation.y = i < 2 ? 0.35 : -0.35;
        g.add(b);
      });

      const bkTitle = ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} MOTORS` : "GT650 SUPERBIKE HUB";
      const bkBoard = this._makeBuildingBoard(bkTitle, "GT650 • SUPERBIKES • EV SHOWROOM", "#111827", "#facc15", 11.4, 1.4);
      bkBoard.position.set(0, 4.75, 1.52);

      const rider = this._createCharacter({ shirtMat: this.mat.bikeRacingRed, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(rider);
      this.landmarkActors.push({ plotId, mesh: rider, mode: "patrol_x", baseX: 0, baseZ: 5.2, range: 3.8, speed: 1.2, phase: 0 });

      g.add(floor, hall, goldBand, frontGlass, bkBoard);
      g.userData.labelY = 9.8;
      return g;
    }

    // 4-PLOT REAL-STYLE WINE SHOP LANDMARK (`wine_shop`)
    // Authentic Indian Wines & Spirits: royal maroon/gold/dark-wood facade, steel counter grill,
    // glowing backlit bottle shelves inside, giant 3D rooftop emerald bottle emblem & bike/car parking!
    if (type === "wine_shop") {
      const body = new THREE.Mesh(this._boxGeo(12.6, 5.2, 7.2), this.mat.cinemaObsidian);
      body.position.set(0, 2.65, -2.2);
      const maroonBand = new THREE.Mesh(this._boxGeo(13.0, 1.65, 7.6), this.mat.wineMaroon);
      maroonBand.position.set(0, 5.85, -2.2);
      const goldTrim1 = new THREE.Mesh(this._boxGeo(13.15, 0.24, 7.75), this.mat.richGoldTrim);
      goldTrim1.position.set(0, 4.98, -2.2);
      const goldTrim2 = goldTrim1.clone();
      goldTrim2.position.y = 6.72;
      const neonTube = new THREE.Mesh(this._boxGeo(12.8, 0.16, 0.18), this.mat.wineNeonGold);
      neonTube.position.set(0, 4.78, 1.66);

      // Authentic Metal Security Grill Counter Window + Glowing Backlit Bottle Display Shelves Behind!
      const counterBase = new THREE.Mesh(this._boxGeo(9.2, 1.25, 0.9), this.mat.darkWood);
      counterBase.position.set(0, 0.72, 1.6);
      const glassBack = new THREE.Mesh(this._boxGeo(9.2, 2.6, 0.14), this.mat.glass);
      glassBack.position.set(0, 2.65, 1.44);
      // Vertical steel security grill bars across counter window (real Indian wine shop style!)
      for (let gx = -4.2; gx <= 4.2; gx += 0.7) {
        const bar = new THREE.Mesh(this._boxGeo(0.06, 2.4, 0.08), this.mat.chrome);
        bar.position.set(gx, 2.55, 1.72);
        g.add(bar);
      }
      // Illuminated Bottle Shelves visible inside the counter window!
      const shelfColors = [this.mat.wineBottleGreen, this.mat.wineBottleAmber, this.mat.oyoRed, this.mat.richGoldTrim];
      for (let sy = 0; sy < 2; sy++) {
        const shelf = new THREE.Mesh(this._boxGeo(8.6, 0.12, 0.55), this.mat.wood);
        shelf.position.set(0, 1.85 + sy * 0.95, 0.55);
        g.add(shelf);
        for (let bx = -3.6; bx <= 3.6; bx += 0.72) {
          const btl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.52, 6), shelfColors[(Math.abs(Math.round(bx * 2)) + sy) % shelfColors.length]);
          btl.position.set(bx, 2.18 + sy * 0.95, 0.55);
          g.add(btl);
        }
      }

      // Giant 3D Rooftop Sculpted Emerald Bottle & Golden Crown Emblem!
      const bigBtl = new THREE.Group();
      bigBtl.position.set(-4.6, 8.2, -0.6);
      const bBody = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.65, 2.2, 10), this.mat.wineBottleGreen);
      const bNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.42, 0.95, 8), this.mat.wineBottleGreen);
      bNeck.position.y = 1.5;
      const bCap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.3, 8), this.mat.richGoldTrim);
      bCap.position.y = 2.08;
      const bLbl = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.75, 10), this.mat.wallCream);
      bLbl.position.y = 0.05;
      bigBtl.add(bBody, bNeck, bCap, bLbl);
      g.add(bigBtl);
      this.turntableRotors.push({ plotId, mesh: bigBtl, speed: 0.75 });

      const wTitle = ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} WINES` : "ROYAL WINES & SPIRITS";
      const wBoard = this._makeBuildingBoard(wTitle, "CHILLED BEER • FINE WINES • PERMIT ROOM", "#7f1d1d", "#fde047", 11.4, 1.5);
      wBoard.position.set(0, 5.85, 1.68);
      const wSide = this._makeBuildingBoard("WINES & BEER", "18+ • OPEN", "#111827", "#facc15", 6.4, 1.2);
      wSide.rotation.y = Math.PI / 2;
      wSide.position.set(6.58, 5.85, -2.2);

      // Front Bike & Car Parking Lot + Cashier & Animated Customers!
      const wPark = new THREE.Mesh(this._boxGeo(13.0, 0.1, 3.6), this.mat.tarmacGrey);
      wPark.position.set(0, 0.12, 4.9);
      const wCar = this._makeVehicleMesh(false, false, 0x1e293b, false);
      wCar.position.set(4.0, 0.18, 4.9);
      [-4.2, -3.1, -2.0].forEach((sx, idx) => {
        const bike = new THREE.Mesh(this._boxGeo(0.42, 0.72, 1.25), idx === 1 ? this.mat.oyoRed : this.mat.cinemaObsidian);
        bike.position.set(sx, 0.52, 4.9);
        g.add(bike);
      });

      const clerk = this._createCharacter({ shirtMat: this.mat.wallWhite, pantsMat: this.mat.darkPants, scale: 0.9 });
      clerk.position.set(0, 0.65, 0.9);
      const cust1 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.94 });
      const cust2 = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(clerk, cust1, cust2);
      this.landmarkActors.push({ plotId, mesh: cust1, mode: "patrol_x", baseX: -1.6, baseZ: 2.65, range: 2.2, speed: 1.05, phase: 0 });
      this.landmarkActors.push({ plotId, mesh: cust2, mode: "patrol_z", baseX: 1.8, baseZ: 3.3, range: 1.3, speed: 1.15, phase: 1.6 });

      g.add(body, maroonBand, goldTrim1, goldTrim2, neonTube, counterBase, glassBack, wBoard, wSide, wPark, wCar);
      g.userData.labelY = 10.6;
      return g;
    }

    // 4-PLOT CENTRAL CITY PARK (`city_park`) — For @prathik_kumar_0018!
    if (type === "city_park") {
      const lawn = new THREE.Mesh(this._boxGeo(13.8, 0.2, 13.8), this.mat.turf);
      lawn.position.set(0, 0.12, 0);
      // Paved Walking / Jogging Loop Track!
      const trackRing = new THREE.Mesh(new THREE.RingGeometry(4.2, 5.6, 24), this.mat.sidewalk);
      trackRing.rotation.x = -Math.PI / 2;
      trackRing.position.set(0, 0.25, 0);

      // Central Tiered Water Fountain!
      const fPool = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.55, 16), this.mat.marble);
      fPool.position.set(0, 0.45, 0);
      const fWater = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.6, 14), this.mat.poolTileBlue);
      fWater.position.set(0, 0.48, 0);
      const fJet = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.55, 2.2, 8), this.mat.water);
      fJet.position.set(0, 1.55, 0);

      // Corner Shade Trees, Wooden Park Benches & Colorful Flower Beds!
      [[-5.2, -5.2], [5.2, -5.2], [-5.2, 5.2], [5.2, 5.2]].forEach(([tx, tz]) => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.1, 6), this.mat.treeTrunk);
        trunk.position.set(tx, 1.2, tz);
        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.55, 0), this.mat.treeLeaf);
        crown.position.set(tx, 2.75, tz);
        g.add(trunk, crown);
      });
      [[-3.6, 0], [3.6, 0], [0, -3.6]].forEach(([bx, bz], i) => {
        const bench = new THREE.Mesh(this._boxGeo(1.5, 0.42, 0.55), this.mat.wood);
        bench.position.set(bx, 0.45, bz);
        if (i < 2) bench.rotation.y = Math.PI / 2;
        g.add(bench);
      });
      // Garden Entrance Welcome Arch
      const archL = new THREE.Mesh(this._boxGeo(0.4, 3.1, 0.4), this.mat.wood);
      archL.position.set(-2.5, 1.7, 6.2);
      const archR = archL.clone();
      archR.position.x = 2.5;
      const pBoard = this._makeBuildingBoard(ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} PARK` : "CENTRAL CITY PARK", "WALKING TRACK • FOUNTAIN • KIDS ZONE", "#15803d", "#facc15", 6.6, 1.05);
      pBoard.position.set(0, 3.4, 6.2);

      const jogger = this._createCharacter({ shirtMat: this.mat.icePink, pantsMat: this.mat.darkPants, scale: 0.92 });
      g.add(jogger);
      this.landmarkActors.push({ plotId, mesh: jogger, mode: "patrol_x", baseX: 0, baseZ: 4.8, range: 4.2, speed: 1.5, phase: 0 });

      g.add(lawn, trackRing, fPool, fWater, fJet, archL, archR, pBoard);
      g.userData.labelY = 7.2;
      return g;
    }

    // 4-PLOT GRAND PUBLIC LIBRARY (`library`) — For @prathik_kumar_0018!
    if (type === "library") {
      const base = new THREE.Mesh(this._boxGeo(12.2, 0.65, 9.2), this.mat.marble);
      base.position.set(0, 0.42, -1.2);
      const hall = new THREE.Mesh(this._boxGeo(11.4, 5.4, 7.6), this.mat.stuccoIvory);
      hall.position.set(0, 3.4, -1.6);
      const roof = new THREE.Mesh(this._boxGeo(12.2, 0.6, 8.6), this.mat.slateTrim);
      roof.position.set(0, 6.35, -1.5);

      // 6 Classic White Neoclassical Pillars across Front Portico!
      for (let i = 0; i < 6; i++) {
        const px = -5.0 + i * 2.0;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 5.2, 8), this.mat.marble);
        col.position.set(px, 3.3, 2.8);
        g.add(col);
      }
      const frontWin = new THREE.Mesh(this._boxGeo(9.2, 3.2, 0.14), winMat);
      frontWin.position.set(0, 3.3, 2.25);
      frontWin.userData.isWindow = true;

      // GIANT 3D OPEN GOLDEN BOOK SCULPTURE ON THE ROOF!
      const bookGrp = new THREE.Group();
      bookGrp.position.set(0, 7.75, -1.2);
      const pageL = new THREE.Mesh(this._boxGeo(2.8, 0.22, 3.2), this.mat.wallWhite);
      pageL.position.set(-1.25, 0.25, 0);
      pageL.rotation.z = -0.32;
      const pageR = new THREE.Mesh(this._boxGeo(2.8, 0.22, 3.2), this.mat.wallWhite);
      pageR.position.set(1.25, 0.25, 0);
      pageR.rotation.z = 0.32;
      const cover = new THREE.Mesh(this._boxGeo(5.6, 0.2, 3.4), this.mat.templeGold);
      cover.position.set(0, -0.1, 0);
      bookGrp.add(pageL, pageR, cover);

      const libBoard = this._makeBuildingBoard(ownerName ? `${ownerName.replace(/^@/, "").toUpperCase()} LIBRARY` : "CENTRAL LIBRARY", "BOOKS • STUDY HALL • FREE WIFI", "#1e3a8a", "#facc15", 9.6, 1.25);
      libBoard.position.set(0, 6.35, 2.95);

      const reader = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.92 });
      g.add(reader);
      this.landmarkActors.push({ plotId, mesh: reader, mode: "patrol_x", baseX: 0, baseZ: 4.5, range: 3.0, speed: 0.95, phase: 0 });

      g.add(base, hall, roof, frontWin, bookGrp, libBoard);
      g.userData.labelY = 10.2;
      return g;
    }

    // 4-PLOT OLYMPIC SWIMMING POOL CLUB (`swimming_pool`) — For @xlomore_28!
    if (type === "swimming_pool") {
      const deck = new THREE.Mesh(this._boxGeo(13.8, 0.3, 13.8), this.mat.marble);
      deck.position.set(0, 0.18, 0);
      const poolRim = new THREE.Mesh(this._boxGeo(10.6, 0.42, 7.8), this.mat.wallWhite);
      poolRim.position.set(0, 0.28, 0.6);
      const water = new THREE.Mesh(this._boxGeo(9.8, 0.46, 7.0), this.mat.poolTileBlue);
      water.position.set(0, 0.3, 0.6);

      // Floating Red & White Olympic Lane Dividers!
      [-1.7, 0, 1.7].forEach((lz) => {
        const lane = new THREE.Mesh(this._boxGeo(9.4, 0.1, 0.14), this.mat.oyoRed);
        lane.position.set(0, 0.56, 0.6 + lz);
        g.add(lane);
      });

      // Diving Board Platform + Changing Room Club House at Back!
      const diveTower = new THREE.Mesh(this._boxGeo(1.1, 2.2, 1.2), this.mat.chrome);
      diveTower.position.set(-5.6, 1.35, 0.6);
      const diveBoard = new THREE.Mesh(this._boxGeo(2.4, 0.14, 0.75), this.mat.petrolYellow);
      diveBoard.position.set(-4.6, 2.45, 0.6);

      const clubHouse = new THREE.Mesh(this._boxGeo(11.6, 3.2, 3.1), this.mat.wallWhite);
      clubHouse.position.set(0, 1.85, -4.9);
      const clubRoof = new THREE.Mesh(this._boxGeo(12.2, 0.35, 3.6), this.mat.mobileBlue);
      clubRoof.position.set(0, 3.6, -4.9);

      // Poolside Loungers & Colorful Umbrellas!
      [-3.5, 0, 3.5].forEach((ux, i) => {
        const lgr = new THREE.Mesh(this._boxGeo(1.5, 0.28, 0.8), this.mat.wallWhite);
        lgr.position.set(ux, 0.48, 5.4);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 5), this.mat.chrome);
        pole.position.set(ux + 0.9, 1.25, 5.5);
        const top = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.35, 8), i === 1 ? this.mat.petrolYellow : this.mat.studioCyan);
        top.position.set(ux + 0.9, 2.25, 5.5);
        g.add(lgr, pole, top);
      });

      const poolOwner = (ownerName || "SHERU BHAI").replace(/^@/, "").toUpperCase();
      const spBoard = this._makeBuildingBoard(`${poolOwner} POOL`, "OLYMPIC SWIMMING POOL • CLUB", "#0284c7", "#facc15", 9.4, 1.25);
      spBoard.position.set(0, 4.35, -3.2);

      const coach = this._createCharacter({ shirtMat: this.mat.petrolYellow, pantsMat: this.mat.mobileBlue, scale: 0.92 });
      g.add(coach);
      this.landmarkActors.push({ plotId, mesh: coach, mode: "patrol_x", baseX: 0, baseZ: -2.8, range: 4.0, speed: 1.0, phase: 0 });

      g.add(deck, poolRim, water, diveTower, diveBoard, clubHouse, clubRoof, spBoard);
      g.userData.labelY = 7.6;
      return g;
    }

    // 4-PLOT REAL-STYLE INDIAN D-MART HYPERMARKET (`dmart`)
    if (type === "dmart") {
      const hall = new THREE.Mesh(new THREE.BoxGeometry(13.2, 6.0, 7.6), this.mat.wallWhite);
      hall.position.set(0, 3.05, -2.5);

      const greenFascia = new THREE.Mesh(new THREE.BoxGeometry(13.6, 1.85, 8.0), this.mat.dmartDeepGreen);
      greenFascia.position.set(0, 6.25, -2.5);
      const yellowMid = new THREE.Mesh(new THREE.BoxGeometry(13.7, 0.3, 8.1), this.mat.dmartYellow);
      yellowMid.position.set(0, 5.28, -2.5);
      const yellowTop = yellowMid.clone();
      yellowTop.position.y = 7.22;

      const upperWin = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.15, 0.14), winMat);
      upperWin.position.set(0, 4.35, 1.32);
      upperWin.userData.isWindow = true;

      // Iconic Tall Corner D-Mart Green & Yellow Architectural Pylon Tower
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.3, 8.4, 2.3), this.mat.dmartDeepGreen);
      pylon.position.set(-5.8, 4.25, 0.75);
      const pylonYellow1 = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.34, 2.42), this.mat.dmartYellow);
      pylonYellow1.position.set(-5.8, 7.6, 0.75);
      const pylonYellow2 = pylonYellow1.clone();
      pylonYellow2.position.y = 4.6;
      const pylonMiniLogo = this._makeBuildingBoard("DMart", "READY", "#15803d", "#facc15", 2.1, 1.35);
      pylonMiniLogo.position.set(-5.8, 6.2, 1.94);

      [-2.5, 2.5, 6.3].forEach((px) => {
        const pil = new THREE.Mesh(new THREE.BoxGeometry(0.55, 5.2, 0.55), this.mat.dmartBrightGreen);
        pil.position.set(px, 2.65, 1.38);
        g.add(pil);
      });
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.42, 2.4), this.mat.dmartDeepGreen);
      canopy.position.set(0.2, 3.45, 2.45);
      const canopyYellow = new THREE.Mesh(new THREE.BoxGeometry(6.72, 0.18, 2.5), this.mat.dmartYellow);
      canopyYellow.position.set(0.2, 3.22, 2.45);

      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(10.6, 2.95, 0.14), this.mat.glass);
      frontGlass.position.set(0.7, 1.62, 1.32);
      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.45, 0.18), this.mat.dmartDeepGreen);
      doorFrame.position.set(0.2, 1.35, 1.38);
      const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.2, 0.22), winMat);
      doorGlass.position.set(0.2, 1.28, 1.38);
      doorGlass.userData.isWindow = true;

      const aisleColors = [this.mat.dmartYellow, this.mat.dmartOfferRed, this.mat.wallBlue, this.mat.dmartBrightGreen];
      [-3.4, -0.9, 1.6, 4.1].forEach((ax, i) => {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.0, 3.6), this.mat.wallWhite);
        rack.position.set(ax, 1.15, -2.2);
        const goods = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.52, 3.2), aisleColors[i % aisleColors.length]);
        goods.position.set(ax, 1.65, -2.2);
        g.add(rack, goods);
      });
      [-2.1, 2.4].forEach((bx) => {
        const billDesk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.85, 0.65), this.mat.dmartDeepGreen);
        billDesk.position.set(bx, 0.52, 0.45);
        g.add(billDesk);
      });

      const ownerClean = (ownerName || "").trim();
      const dmartFront = this._makeDMartLogoBoard(ownerClean, 11.4, 1.72);
      dmartFront.position.set(0.8, 6.25, 1.54);
      const dmartSide = this._makeDMartLogoBoard("", 7.2, 1.5);
      dmartSide.rotation.y = Math.PI / 2;
      dmartSide.position.set(6.84, 6.25, -2.5);

      const entrySign = this._makeBuildingBoard("ENTRY ➔   •   ⬅ EXIT", "OPEN 8 AM – 10 PM", "#0f7638", "#facc15", 5.4, 0.68);
      entrySign.position.set(0.2, 3.48, 3.68);

      const cartBay = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.14, 1.85), this.mat.sidewalk);
      cartBay.position.set(-4.3, 0.16, 2.65);
      const cartRail = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.56, 0.08), this.mat.dmartYellow);
      cartRail.position.set(-4.3, 0.52, 3.55);
      for (let c = 0; c < 5; c++) {
        const cx = -5.75 + c * 0.72;
        const basket = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.72), this.mat.cartChrome);
        basket.position.set(cx, 0.68, 2.65);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.08), this.mat.dmartDeepGreen);
        handle.position.set(cx, 0.96, 3.02);
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.34, 0.54), this.mat.charcoal);
        leg.position.set(cx, 0.32, 2.65);
        g.add(basket, handle, leg);
      }
      g.add(cartBay, cartRail);

      const offerBoard = this._makeBuildingBoard("MEGA OFFERS", "MIN 7% OFF MRP!", "#dc2626", "#facc15", 2.5, 1.45);
      offerBoard.position.set(4.3, 1.25, 2.55);
      const offerPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.1, 0.18), this.mat.charcoal);
      offerPost.position.set(4.3, 0.55, 2.5);
      const guardCabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.1, 1.4), this.mat.dmartDeepGreen);
      guardCabin.position.set(5.9, 1.15, 2.6);
      const gcWin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 1.46), this.mat.glass);
      gcWin.position.set(5.9, 1.5, 2.6);
      g.add(offerBoard, offerPost, guardCabin, gcWin);

      const dPark = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.1, 3.9), this.mat.tarmacGrey);
      dPark.position.set(0, 0.13, 5.15);
      [-5.6, -2.8, 0.0, 2.8, 5.6].forEach((lx) => {
        const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2.9), this.mat.stripe);
        pl.rotation.x = -Math.PI / 2;
        pl.position.set(lx, 0.2, 5.15);
        g.add(pl);
      });
      [-3.0, -1.2, 1.6, 3.4].forEach((bx) => {
        const bol = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.65, 6), this.mat.dmartYellow);
        bol.position.set(bx, 0.45, 3.4);
        g.add(bol);
      });
      const dCar1 = this._makeVehicleMesh(false, false, 0x2563eb, false);
      dCar1.position.set(-4.2, 0.18, 5.15);
      const dCar2 = this._makeVehicleMesh(false, false, 0xef4444, false);
      dCar2.position.set(4.2, 0.18, 5.15);
      const dAuto = this._makeRealAutoMesh(false, false);
      dAuto.position.set(6.1, 0.18, 5.15);
      [-1.9, -1.0].forEach((sx) => {
        const scooter = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.72, 1.25), this.mat.wallCoral);
        scooter.position.set(sx, 0.52, 5.15);
        g.add(scooter);
      });
      g.add(dPark, dCar1, dCar2, dAuto);

      const guard = this._createCharacter({ shirtMat: this.mat.khakiUniform, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(guard);
      this.landmarkActors.push({ plotId, mesh: guard, mode: "guard", baseX: 2.2, baseZ: 2.35, range: 0.3, speed: 1.5, phase: 0 });
      const shop1 = this._createCharacter({ shirtMat: this.mat.wallCoral, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(shop1);
      this.landmarkActors.push({ plotId, mesh: shop1, mode: "patrol_z", baseX: -0.4, baseZ: 3.6, range: 1.6, speed: 1.3, phase: 0.4 });
      const shop2 = this._createCharacter({ shirtMat: this.mat.wallBlue, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(shop2);
      this.landmarkActors.push({ plotId, mesh: shop2, mode: "patrol_x", baseX: 0.4, baseZ: 4.0, range: 2.1, speed: 1.1, phase: 2.1 });

      g.add(hall, greenFascia, yellowMid, yellowTop, upperWin, pylon, pylonYellow1, pylonYellow2, pylonMiniLogo, canopy, canopyYellow, frontGlass, doorFrame, doorGlass, dmartFront, dmartSide, entrySign);
      g.userData.labelY = 9.4;
      return g;
    }

    // 4-PLOT ITI COLLEGE & TECHNICAL WORKSHOP (`iti_college`)
    if (type === "iti_college") {
      // Main 2-Story Technical Institute Academic Building
      const main = new THREE.Mesh(new THREE.BoxGeometry(12.2, 5.2, 4.4), this.mat.stuccoCream);
      main.position.set(0, 2.65, -4.0);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.42, 5.0), this.mat.navy);
      roof.position.set(0, 5.45, -4.0);

      for (let wx = -4.2; wx <= 4.2; wx += 2.1) {
        const w1 = new THREE.Mesh(this.geo.win, winMat);
        w1.position.set(wx, 1.8, -1.75);
        w1.userData.isWindow = true;
        const w2 = new THREE.Mesh(this.geo.win, winMat);
        w2.position.set(wx, 3.8, -1.75);
        w2.userData.isWindow = true;
        g.add(w1, w2);
      }

      // Technical Workshop Shed (Left Side) with Blue Industrial Roof & Machinery Bay
      const shed = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.2, 5.4), this.mat.concrete);
      shed.position.set(-3.4, 1.65, 2.2);
      const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.35, 5.8), this.mat.itiWorkshop);
      shedRoof.position.set(-3.4, 3.4, 2.2);
      shedRoof.rotation.z = 0.12;
      const bayDoor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 0.14), this.mat.charcoal);
      bayDoor.position.set(-3.4, 1.3, 4.92);

      // Campus Flag Pole + Indian Tricolor Flag (Right Courtyard)
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.8, 6), this.mat.chrome);
      pole.position.set(3.8, 2.9, 1.8);
      const fTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.06), this.mat.roofOrange);
      fTop.position.set(4.55, 5.5, 1.8);
      const fMid = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.06), this.mat.wallWhite);
      fMid.position.set(4.55, 5.22, 1.8);
      const fBot = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.06), this.mat.turf);
      fBot.position.set(4.55, 4.94, 1.8);

      // Personalized ITI College Signboard!
      const rawIti = (ownerName || "ITI").trim().toUpperCase();
      const itiSub = rawIti.includes("ITI") ? "TECHNICAL INSTITUTE" : `${rawIti} • TECHNICAL CAMPUS`;
      const itiBoard = this._makeBuildingBoard("ITI COLLEGE", itiSub, "#1e3a8a", "#facc15", 9.6, 1.35);
      itiBoard.position.set(0, 5.1, -1.72);

      // 2 Animated ITI Students in Blue Workshop Uniforms
      const st1 = this._createCharacter({ shirtMat: this.mat.blueUniform, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(st1);
      this.landmarkActors.push({ plotId, mesh: st1, mode: "patrol_x", baseX: 2.2, baseZ: 3.6, range: 2.4, speed: 1.3, phase: 0 });

      const st2 = this._createCharacter({ shirtMat: this.mat.blueUniform, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(st2);
      this.landmarkActors.push({ plotId, mesh: st2, mode: "patrol_z", baseX: 0.6, baseZ: 1.8, range: 2.2, speed: 1.2, phase: 1.8 });

      g.add(main, roof, shed, shedRoof, bayDoor, pole, fTop, fMid, fBot, itiBoard);
      g.userData.labelY = 8.4;
      return g;
    }

    // 4-PLOT PERSONALIZED FOLLOWER FITNESS GYM (Custom Follower Name on Gym Signboard + Live Workouts!)
    if (type === "gym") {
      // Modern Matte-Black & Brushed Concrete Fitness Club Hall
      const mainHall = new THREE.Mesh(new THREE.BoxGeometry(12.6, 5.2, 8.6), this.mat.gymBlack);
      mainHall.position.set(0, 2.65, -1.6);

      const roofCap = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.45, 9.4), this.mat.slateTrim);
      roofCap.position.set(0, 5.45, -1.5);

      // Glowing Neon Orange Energy Strips
      const neonTop = new THREE.Mesh(new THREE.BoxGeometry(13.3, 0.22, 0.28), this.mat.gymOrange);
      neonTop.position.set(0, 5.2, 3.15);
      const neonSideL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 5.0, 0.28), this.mat.gymOrange);
      neonSideL.position.set(-6.32, 2.65, 2.75);
      const neonSideR = neonSideL.clone();
      neonSideR.position.x = 6.32;

      // Clear Panoramic Glass Front Wall (shows inside gym equipment!)
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(11.4, 3.8, 0.14), this.mat.glass);
      frontGlass.position.set(0, 2.1, 2.72);

      // GIANT 3D BARBELL / DUMBBELL SCULPTURE ON THE ROOF!
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 7.6, 8), this.mat.gymSteel);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 6.8, -0.4);
      const pBigGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.38, 12);
      pBigGeo.rotateZ(Math.PI / 2);
      const pMedGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.34, 12);
      pMedGeo.rotateZ(Math.PI / 2);
      [-2.8, 2.8].forEach((px) => {
        const pb = new THREE.Mesh(pBigGeo, this.mat.gymBlack);
        pb.position.set(px, 6.8, -0.4);
        const pm = new THREE.Mesh(pMedGeo, this.mat.gymOrange);
        pm.position.set(px + (px < 0 ? -0.42 : 0.42), 6.8, -0.4);
        g.add(pb, pm);
      });
      [-1.8, 1.8].forEach((sx) => {
        const sup = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.35, 0.32), this.mat.gymSteel);
        sup.position.set(sx, 6.1, -0.4);
        g.add(sup);
      });

      // CUSTOM PERSONALIZED FOLLOWER NAME GYM SIGNBOARDS (Front + Side!)
      const rawName = (ownerName || "FITNESS").trim();
      const dispName = rawName.startsWith("@") ? rawName.toUpperCase() : rawName.toUpperCase();
      const gymTitle = dispName.includes("GYM") ? dispName : `${dispName} GYM`;
      const gymBoard = this._makeBuildingBoard(gymTitle, "FITNESS CLUB • PRO WORKOUT", "#18181b", "#f97316", 10.6, 1.55);
      gymBoard.position.set(0, 4.95, 3.32);
      const sideBoard = this._makeBuildingBoard(gymTitle, "24/7 FITNESS", "#18181b", "#facc15", 6.6, 1.15);
      sideBoard.rotation.y = Math.PI / 2;
      sideBoard.position.set(6.36, 4.1, -1.6);

      // INTERIOR & OUTDOOR GYM EQUIPMENT (Treadmills, Bench Press, Dumbbell Rack, Pull-Up Rig!)
      const rubberMat = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.1, 3.8), this.mat.charcoal);
      rubberMat.position.set(0, 0.16, 4.8);

      // 2 Treadmills (left bay)
      [-4.2, -2.4].forEach((tx) => {
        const tBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 2.2), this.mat.gymBlack);
        tBase.position.set(tx, 0.28, 4.7);
        const tPost = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.35, 0.25), this.mat.gymSteel);
        tPost.position.set(tx, 0.95, 3.75);
        g.add(tBase, tPost);
      });

      // Bench Press + Barbell (center-right)
      const bench = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 2.1), this.mat.audiRed);
      bench.position.set(1.8, 0.45, 4.7);
      const rackL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.3, 0.14), this.mat.gymSteel);
      rackL.position.set(1.25, 0.85, 4.0);
      const rackR = rackL.clone();
      rackR.position.x = 2.35;
      const miniBar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 6), this.mat.gymSteel);
      miniBar.rotation.z = Math.PI / 2;
      miniBar.position.set(1.8, 1.35, 4.0);
      g.add(bench, rackL, rackR, miniBar);

      // Dumbbell Rack (far right)
      const dRack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.85, 0.65), this.mat.gymSteel);
      dRack.position.set(4.6, 0.6, 4.5);
      g.add(dRack);

      // 3 LIVE ANIMATED GYM MEMBERS WORKING OUT (Treadmill Runner + 2 Dumbbell Lifters!)
      const runner = this._createCharacter({ shirtMat: this.mat.gymOrange, pantsMat: this.mat.darkPants, scale: 0.94 });
      g.add(runner);
      this.landmarkActors.push({ plotId, mesh: runner, mode: "gym_run", baseX: -4.2, baseZ: 4.85, range: 0.2, speed: 9.0, phase: 0 });

      const makeLifter = (lx, lz, shirtMat, phase) => {
        const lifter = this._createCharacter({ shirtMat, pantsMat: this.mat.darkPants, scale: 0.96 });
        const dbGeo = new THREE.BoxGeometry(0.16, 0.16, 0.42);
        const dbL = new THREE.Mesh(dbGeo, this.mat.gymBlack);
        dbL.position.set(-0.34, 0.72, 0.18);
        const dbR = dbL.clone();
        dbR.position.x = 0.34;
        lifter.add(dbL, dbR);
        g.add(lifter);
        this.landmarkActors.push({ plotId, mesh: lifter, mode: "gym_lift", baseX: lx, baseZ: lz, range: 0.22, speed: 4.2, phase });
      };
      makeLifter(0.1, 5.1, this.mat.wallBlue, 0);
      makeLifter(3.8, 5.4, this.mat.wallMint, 1.7);

      g.add(mainHall, roofCap, neonTop, neonSideL, neonSideR, frontGlass, bar, gymBoard, sideBoard, rubberMat);
      g.userData.labelY = 9.0;
      return g;
    }

    if (type === "petrol_bunk") {
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.7, 6.6), this.mat.petrolRed);
      canopy.position.set(0, 4.6, 1.0);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.28, 6.8), this.mat.petrolYellow);
      trim.position.set(0, 4.25, 1.0);

      const pillarGeo = new THREE.CylinderGeometry(0.24, 0.24, 4.4, 6);
      [[-4.6, -1.2], [0, -1.2], [4.6, -1.2], [-4.6, 3.2], [0, 3.2], [4.6, 3.2]].forEach(([px, pz]) => {
        const p = new THREE.Mesh(pillarGeo, this.mat.wallWhite);
        p.position.set(px, 2.2, pz);
        g.add(p);
      });

      [-2.2, 2.2].forEach((px) => {
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.7), this.mat.petrolRed);
        pump.position.set(px, 0.92, 1.0);
        const screen = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.74), this.mat.windowNight);
        screen.position.set(px, 1.38, 1.0);
        g.add(pump, screen);
      });

      const office = new THREE.Mesh(new THREE.BoxGeometry(11.4, 3.4, 3.0), this.mat.wallWhite);
      office.position.set(0, 1.75, -4.8);
      const officeTop = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.45, 3.2), this.mat.petrolRed);
      officeTop.position.set(0, 3.55, -4.8);

      const simCar = this._makeVehicleMesh(false, false, 0x3b82f6, true);
      simCar.rotation.y = Math.PI / 2;
      g.add(simCar);
      const petrolMan1 = this._createCharacter({ shirtMat: this.mat.petrolRed, pantsMat: this.mat.navy, hatColor: 0xfacc15, scale: 1.04 });
      g.add(petrolMan1);
      this.petrolSimulations.push({
        plotId, vehicle: simCar, attendant: petrolMan1,
        laneZ: 2.7, pumpX: -1.8, attendantHomeX: -2.2, attendantHomeZ: 1.6, phaseOffset: 0
      });

      const simBus = this._makeVehicleMesh(true, false, 0xdc2626, true);
      simBus.rotation.y = Math.PI / 2;
      simBus.scale.set(0.92, 0.92, 0.92);
      g.add(simBus);
      const petrolMan2 = this._createCharacter({ shirtMat: this.mat.petrolRed, pantsMat: this.mat.navy, hatColor: 0xfacc15, scale: 1.04 });
      g.add(petrolMan2);
      this.petrolSimulations.push({
        plotId, vehicle: simBus, attendant: petrolMan2,
        laneZ: -0.6, pumpX: 1.8, attendantHomeX: 2.2, attendantHomeZ: 0.4, phaseOffset: 4.5
      });

      const pbBoard = this._makeBuildingBoard("PETROL & DIESEL", "24/7 FUEL PLAZA", "#dc2626", "#facc15", 8.6, 1.1);
      pbBoard.position.set(0, 4.6, 4.35);
      g.add(canopy, trim, office, officeTop, pbBoard);
      g.userData.labelY = 7.4;
      return g;
    }

    // 4-PLOT TRANSPORT OFFICE & AUTO STAND (Real 3-Wheeler Autos + Drivers Cleaning + Autos Driving Out With Passengers!)
    if (type === "auto_stand") {
      // Transport Office Building at Back
      const office = new THREE.Mesh(new THREE.BoxGeometry(11.8, 3.8, 3.4), this.mat.wallCream);
      office.position.set(0, 1.95, -4.6);
      const officeRoof = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.4, 3.8), this.mat.navy);
      officeRoof.position.set(0, 4.0, -4.6);
      const yellowBand = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.28, 3.85), this.mat.autoYellow);
      yellowBand.position.set(0, 3.65, -4.6);

      // Office Front Counter & Windows
      for (let wx = -3.8; wx <= 3.8; wx += 1.9) {
        const w = new THREE.Mesh(this.geo.win, winMat);
        w.position.set(wx, 2.2, -2.85);
        w.userData.isWindow = true;
        g.add(w);
      }
      const door = new THREE.Mesh(this.geo.door, this.mat.wood);
      door.position.set(0, 0.8, -2.85);

      // Sheltered Auto Stand Canopy (Left Bay for Cleaning & Parking)
      const standRoof = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.24, 4.6), this.mat.autoGreen);
      standRoof.position.set(-3.2, 2.9, 1.0);
      const standTrim = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.16, 4.7), this.mat.autoYellow);
      standTrim.position.set(-3.2, 2.76, 1.0);
      [[-6.2, -1.0], [-0.2, -1.0], [-6.2, 3.0], [-0.2, 3.0]].forEach(([px, pz]) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 6), this.mat.wallWhite);
        col.position.set(px, 1.4, pz);
        g.add(col);
      });

      // 2 Parked Real Autos in the Cleaning Bay + 2 Drivers ACTIVELY CLEANING THEM with blue cloths!
      const parkedAuto1 = this._makeRealAutoMesh(true, false);
      parkedAuto1.position.set(-4.6, 0.08, 1.1);
      parkedAuto1.rotation.y = 0;
      const parkedAuto2 = this._makeRealAutoMesh(true, false);
      parkedAuto2.position.set(-1.8, 0.08, 1.1);
      parkedAuto2.rotation.y = 0;

      // Water bucket next to cleaning bay
      const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.36, 8), this.mat.wallBlue);
      bucket.position.set(-3.2, 0.25, 2.4);

      const makeCleanerDriver = (ax, az, phase) => {
        const drv = this._createCharacter({ shirtMat: this.mat.khakiUniform, pantsMat: this.mat.darkPants, scale: 0.96 });
        const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.22), this.mat.clothBlue);
        cloth.position.set(0.28, 0.78, 0.22);
        drv.add(cloth);
        g.add(drv);
        this.landmarkActors.push({
          plotId, mesh: drv, mode: "clean_auto",
          baseX: ax, baseZ: az, range: 0.65, speed: 3.4, phase
        });
      };
      makeCleanerDriver(-5.45, 1.2, 0);
      makeCleanerDriver(-0.95, 1.2, 1.9);

      // 2 LIVE REAL AUTOS THAT PICK UP PASSENGERS AT STAND -> DRIVE OUT ONTO CITY ROADS -> LOOP AROUND CITY -> RETURN!
      const liveAuto1 = this._makeRealAutoMesh(true, true);
      g.add(liveAuto1);
      const pax1 = [this.mat.wallCoral, this.mat.wallBlue].map((sm) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.92 });
        g.add(p);
        return p;
      });
      this.autoSimulations.push({
        plotId, auto: liveAuto1, passengers: pax1,
        stopX: 2.2, stopZ: 2.0, waitX: 2.2, waitZ: -0.8,
        roadLoopR: this.BLOCK_STEP, phaseOffset: 0
      });

      const liveAuto2 = this._makeRealAutoMesh(true, true);
      g.add(liveAuto2);
      const pax2 = [this.mat.wallGold, this.mat.wallMint].map((sm) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.92 });
        g.add(p);
        return p;
      });
      this.autoSimulations.push({
        plotId, auto: liveAuto2, passengers: pax2,
        stopX: 4.8, stopZ: 2.0, waitX: 4.8, waitZ: -0.8,
        roadLoopR: this.BLOCK_STEP, phaseOffset: 10.0
      });

      const toBoard = this._makeBuildingBoard("TRANSPORT OFFICE", "AUTO STAND • AP", "#1e3a8a", "#facc15", 7.8, 1.15);
      toBoard.position.set(0, 3.3, -2.84);
      const bench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.42, 0.65), this.mat.teakWood);
      bench.position.set(3.5, 0.28, -1.8);
      g.add(office, officeRoof, yellowBand, door, standRoof, standTrim, parkedAuto1, parkedAuto2, bucket, toBoard, bench);
      g.userData.labelY = 7.4;
      return g;
    }

    // 4-PLOT APSRTC BUS TERMINAL (Real 3D Buses -> Wait until FULL -> Drive OUT onto City Roads around town -> Return!)
    if (type === "bus_stand") {
      const terminal = new THREE.Mesh(new THREE.BoxGeometry(12.8, 4.2, 3.2), this.mat.wallCream);
      terminal.position.set(0, 2.15, -4.8);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.45, 6.2), this.mat.navy);
      roof.position.set(0, 4.5, -2.8);
      roof.rotation.x = 0.06;

      const yellowTrim = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.3, 0.22), this.mat.petrolYellow);
      yellowTrim.position.set(0, 4.3, 0.28);

      [-5.6, -1.8, 1.8, 5.6].forEach((px) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4.3, 6), this.mat.wallWhite);
        col.position.set(px, 2.15, -0.4);
        g.add(col);
      });

      // Parked Green Palle Velugu Real Bus at side bay
      const parkedBus = this._makeRealBusMesh(0x16a34a, true);
      parkedBus.position.set(-4.2, 0.08, 4.8);
      parkedBus.rotation.y = Math.PI / 2;
      g.add(parkedBus);

      // LIVE REAL BUS 1 (Red APSRTC Express): Boards 3 passengers until FULL -> Drives OUT onto city roads around the city!
      const liveBus1 = this._makeRealBusMesh(0xdc2626, true);
      g.add(liveBus1);
      const passengers1 = [this.mat.wallCoral, this.mat.wallBlue, this.mat.wallGold].map((sm) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.96 });
        g.add(p);
        return p;
      });
      this.busSimulations.push({
        plotId, bus: liveBus1, passengers: passengers1,
        bayX: 0.4, bayZ: 2.0, waitZ: -1.3,
        roadLoopR: this.BLOCK_STEP, phaseOffset: 0
      });

      // LIVE REAL BUS 2 (Blue APSRTC Super Luxury): Boards 3 passengers until FULL -> Drives OUT onto city roads!
      const liveBus2 = this._makeRealBusMesh(0x2563eb, true);
      g.add(liveBus2);
      const passengers2 = [this.mat.wallMint, this.mat.khakiUniform, this.mat.wallCoral].map((sm) => {
        const p = this._createCharacter({ shirtMat: sm, pantsMat: this.mat.darkPants, scale: 0.96 });
        g.add(p);
        return p;
      });
      this.busSimulations.push({
        plotId, bus: liveBus2, passengers: passengers2,
        bayX: 3.6, bayZ: 2.0, waitZ: -1.3,
        roadLoopR: this.BLOCK_STEP, phaseOffset: 11.0
      });

      const rtcBoard = this._makeBuildingBoard("APSRTC BUS STAND", "EXPRESS • SUPER LUXURY", "#1e3a8a", "#facc15", 9.0, 1.2);
      rtcBoard.position.set(0, 4.4, 0.42);
      const bench1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 0.6), this.mat.teakWood);
      bench1.position.set(-3.2, 0.28, -2.2);
      const bench2 = bench1.clone();
      bench2.position.x = 3.2;
      g.add(terminal, roof, yellowTrim, rtcBoard, bench1, bench2);
      g.userData.labelY = 7.4;
      return g;
    }

    if (type === "police_station") {
      const floor1 = new THREE.Mesh(new THREE.BoxGeometry(12.2, 3.2, 5.6), this.mat.wallKhaki);
      floor1.position.set(0, 1.65, -3.2);
      const floor2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.0, 5.0), this.mat.wallCream);
      floor2.position.set(0, 4.75, -3.4);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 3.6), this.mat.wallKhaki);
      tower.position.set(0, 7.4, -3.4);

      const navyBand = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.45, 5.8), this.mat.navy);
      navyBand.position.set(0, 3.25, -3.2);
      const redBand = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.25, 5.8), this.mat.petrolRed);
      redBand.position.set(0, 2.9, -3.2);

      const portico = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 2.6), this.mat.navy);
      portico.position.set(0, 2.6, 0.7);
      [-1.9, 1.9].forEach((px) => {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.5, 6), this.mat.wallWhite);
        col.position.set(px, 1.3, 1.7);
        g.add(col);
      });

      for (let wx = -4.4; wx <= 4.4; wx += 1.75) {
        if (Math.abs(wx) > 1.2) {
          const w1 = new THREE.Mesh(this.geo.win, winMat);
          w1.position.set(wx, 1.7, -0.35);
          w1.userData.isWindow = true;
          g.add(w1);
        }
        const w2 = new THREE.Mesh(this.geo.win, winMat);
        w2.position.set(wx * 0.8, 4.8, -0.85);
        w2.userData.isWindow = true;
        g.add(w2);
      }

      const sirenRed = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      sirenRed.position.set(-0.42, 8.85, -2.5);
      sirenRed.userData.plotId = plotId;
      const sirenBlue = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      sirenBlue.position.set(0.42, 8.85, -2.5);
      sirenBlue.userData.plotId = plotId;
      this.sirenLights.push(sirenRed, sirenBlue);

      const jeep1 = this._makeVehicleMesh(false, false, 0xf8fafc, true);
      jeep1.position.set(-4.6, 0.1, 3.8);
      jeep1.rotation.y = Math.PI / 6;

      const patrolCar = this._makeVehicleMesh(false, false, 0xf8fafc, true);
      const carSirenR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.2), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      carSirenR.position.set(-0.15, 1.26, 0);
      carSirenR.userData.plotId = plotId;
      const carSirenB = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.2), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
      carSirenB.position.set(0.15, 1.26, 0);
      carSirenB.userData.plotId = plotId;
      patrolCar.add(carSirenR, carSirenB);
      this.sirenLights.push(carSirenR, carSirenB);
      g.add(patrolCar);

      this.policeSimulations.push({ plotId, car: patrolCar });

      for (let i = 0; i < 4; i++) {
        const officer = this._createCharacter({
          shirtMat: this.mat.khakiUniform,
          pantsMat: this.mat.khakiUniform,
          hatColor: 0x1e3a8a,
          scale: 1.08
        });
        g.add(officer);
        this.landmarkActors.push({
          plotId, mesh: officer,
          mode: i < 2 ? "patrol_x" : "guard",
          baseX: i === 0 ? -2.8 : i === 1 ? 2.8 : i === 2 ? -1.4 : 1.4,
          baseZ: i < 2 ? 4.8 : 2.1,
          range: 2.0, speed: 1.4, phase: i * 1.7
        });
      }

      const polBoard = this._makeBuildingBoard("POLICE STATION", "AP POLICE • DIAL 100", "#1e3a8a", "#ef4444", 7.6, 1.15);
      polBoard.position.set(0, 3.6, -0.32);
      g.add(floor1, floor2, tower, navyBand, redBand, portico, sirenRed, sirenBlue, jeep1, polBoard);
      g.userData.labelY = 11.2;
      return g;
    }

    if (type === "hospital") {
      const main = new THREE.Mesh(new THREE.BoxGeometry(11.8, 9.2, 6.2), this.mat.wallWhite);
      main.position.set(0, 4.65, -2.4);

      [2.8, 5.8, 8.9].forEach((y) => {
        const band = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.35, 6.4), this.mat.teal);
        band.position.set(0, y, -2.4);
        g.add(band);
      });

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.16, 14), this.mat.road);
      pad.position.set(0, 9.35, -2.4);
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 1.8), this.mat.petrolYellow);
      h1.position.set(-0.6, 9.46, -2.4);
      const h2 = h1.clone();
      h2.position.x = 0.6;
      const h3 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.3), this.mat.petrolYellow);
      h3.position.set(0, 9.46, -2.4);

      const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.0, 0.18), this.mat.petrolRed);
      crossV.position.set(0, 7.4, 0.78);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 0.18), this.mat.petrolRed);
      crossH.position.set(0, 7.4, 0.78);

      [1.6, 4.4, 7.4].forEach((wy) => {
        for (let wx = -4.2; wx <= 4.2; wx += 1.68) {
          if (wy > 6.5 && Math.abs(wx) < 1.5) continue;
          if (wy < 2.2 && Math.abs(wx) < 1.5) continue;
          const w = new THREE.Mesh(this.geo.win, winMat);
          w.position.set(wx, wy, 0.74);
          w.userData.isWindow = true;
          g.add(w);
        }
      });

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.35, 3.0), this.mat.teal);
      canopy.position.set(0, 2.5, 2.2);

      const crashCar = this._makeVehicleMesh(false, false, 0xf97316, true);
      crashCar.position.set(5.4, 0.1, 8.8);
      crashCar.rotation.y = 0.55;
      const hazardCone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 5), this.mat.petrolRed);
      hazardCone.position.set(4.1, 0.32, 8.8);
      const patient = this._createCharacter({ shirtMat: this.mat.jerseyYellow, pantsMat: this.mat.darkPants, scale: 0.95 });
      g.add(crashCar, hazardCone, patient);

      const ambulance = this._makeVehicleMesh(false, false, 0xf8fafc, true);
      const ambStripe = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.22, 2.18), this.mat.petrolRed);
      ambStripe.position.y = 0.58;
      const ambSiren = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.22), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      ambSiren.position.set(0, 1.28, 0);
      ambSiren.userData.plotId = plotId;
      ambulance.add(ambStripe, ambSiren);
      this.sirenLights.push(ambSiren);
      g.add(ambulance);

      this.ambulanceSimulations.push({ plotId, ambulance, crashCar, hazardCone, patient });

      for (let i = 0; i < 4; i++) {
        const doc = this._createCharacter({
          shirtMat: this.mat.whiteCoat,
          pantsMat: i % 2 === 0 ? this.mat.teal : this.mat.darkPants,
          scale: 1.05
        });
        g.add(doc);
        this.landmarkActors.push({
          plotId, mesh: doc, mode: "patrol_x",
          baseX: (i - 1.5) * 1.9, baseZ: 3.2 + (i % 2) * 1.4,
          range: 1.8, speed: 1.1, phase: i * 1.3
        });
      }

      const hospBoard = this._makeBuildingBoard("SUPER HOSPITAL", "24/7 EMERGENCY • 108", "#0d9488", "#ffffff", 7.4, 1.1);
      hospBoard.position.set(0, 2.75, 3.74);
      g.add(main, pad, h1, h2, h3, crossV, crossH, canopy, hospBoard);
      g.userData.labelY = 11.6;
      return g;
    }

    if (type === "srmt_mall") {
      const base = new THREE.Mesh(new THREE.BoxGeometry(12.4, 8.4, 7.6), this.mat.wallWhite);
      base.position.set(0, 4.25, -2.0);
      const atrium = new THREE.Mesh(new THREE.BoxGeometry(7.4, 7.4, 0.5), this.mat.glass);
      atrium.position.set(0, 3.8, 1.9);
      const ribbon1 = new THREE.Mesh(new THREE.BoxGeometry(12.7, 0.75, 7.9), this.mat.srmtPurple);
      ribbon1.position.set(0, 8.2, -2.0);
      const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.35, 7.8), this.mat.srmtMagenta);
      ribbon2.position.set(0, 4.2, -2.0);
      const cinema = new THREE.Mesh(new THREE.BoxGeometry(7.0, 2.0, 4.2), this.mat.navy);
      cinema.position.set(0, 9.4, -2.4);
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.35, 2.6), this.mat.srmtMagenta);
      canopy.position.set(0, 2.3, 3.1);

      const c1 = this._makeVehicleMesh(false, false, 0xef4444, true);
      c1.position.set(-4.6, 0.1, 4.8);
      const c2 = this._makeVehicleMesh(false, false, 0x0ea5e9, true);
      c2.position.set(4.6, 0.1, 4.8);

      const mats = [this.mat.wallCoral, this.mat.wallBlue, this.mat.wallGold, this.mat.wallMint, this.mat.srmtMagenta];
      for (let i = 0; i < 5; i++) {
        const shopper = this._createCharacter({ shirtMat: mats[i], pantsMat: this.mat.darkPants, scale: 0.96 });
        g.add(shopper);
        this.landmarkActors.push({
          plotId, mesh: shopper,
          mode: i % 2 === 0 ? "patrol_x" : "patrol_z",
          baseX: (i - 2) * 1.9, baseZ: 3.4,
          range: 1.8, speed: 1.2 + (i % 2) * 0.4, phase: i * 1.4
        });
      }

      const mallBoard = this._makeBuildingBoard("SRMT MALL", "SHOPPING • MULTIPLEX", "#7e22ce", "#facc15", 8.6, 1.35);
      mallBoard.position.set(0, 8.2, 2.02);
      g.add(base, atrium, ribbon1, ribbon2, cinema, canopy, c1, c2, mallBoard);
      g.userData.labelY = 12.2;
      return g;
    }

    if (type === "apple_store") {
      const floor = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.35, 8.2), this.mat.appleSilver);
      floor.position.set(0, 0.25, -1.2);
      const glassBox = new THREE.Mesh(new THREE.BoxGeometry(10.8, 5.8, 7.2), this.mat.glass);
      glassBox.position.set(0, 3.3, -1.2);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.55, 9.0), this.mat.appleSilver);
      roof.position.set(0, 6.45, -1.2);

      const logoBody = new THREE.Mesh(new THREE.SphereGeometry(0.92, 10, 10), this.mat.wallWhite);
      logoBody.scale.set(1, 1.05, 0.3);
      logoBody.position.set(0, 4.4, 2.55);
      const logoLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.16), this.mat.wallWhite);
      logoLeaf.position.set(0.18, 5.5, 2.55);
      logoLeaf.rotation.z = -0.45;

      [-2.8, 0, 2.8].forEach((tx) => {
        const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 3.4), this.mat.wood);
        table.position.set(tx, 0.85, -1.2);
        g.add(table);
      });

      for (let i = 0; i < 4; i++) {
        const person = this._createCharacter({
          shirtMat: i < 2 ? this.mat.blueUniform : this.mat.wallWhite,
          pantsMat: this.mat.darkPants,
          scale: 0.98
        });
        g.add(person);
        this.landmarkActors.push({
          plotId, mesh: person, mode: "patrol_x",
          baseX: (i - 1.5) * 2.2, baseZ: i < 2 ? 0.5 : 4.2,
          range: 1.6, speed: 1.1, phase: i * 1.6
        });
      }

      const appBoard = this._makeBuildingBoard("APPLE STORE", "iPhone • Mac • iPad", "#0f172a", "#e2e8f0", 6.2, 0.95);
      appBoard.position.set(0, 6.45, 3.34);
      g.add(floor, glassBox, roof, logoBody, logoLeaf, appBoard);
      g.userData.labelY = 9.2;
      return g;
    }

    if (type === "reliance_store") {
      const main = new THREE.Mesh(new THREE.BoxGeometry(12.0, 6.4, 7.2), this.mat.wallWhite);
      main.position.set(0, 3.25, -1.8);
      const blueFacade = new THREE.Mesh(new THREE.BoxGeometry(12.2, 1.8, 7.4), this.mat.relianceBlue);
      blueFacade.position.set(0, 5.6, -1.8);
      const redAccent = new THREE.Mesh(new THREE.BoxGeometry(12.3, 0.35, 7.5), this.mat.petrolRed);
      redAccent.position.set(0, 4.5, -1.8);
      const goldAccent = new THREE.Mesh(new THREE.BoxGeometry(12.3, 0.25, 7.5), this.mat.gold);
      goldAccent.position.set(0, 6.6, -1.8);

      for (let wx = -4.0; wx <= 4.0; wx += 2.65) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.4, 0.16), winMat);
        w.position.set(wx, 1.9, 1.85);
        w.userData.isWindow = true;
        g.add(w);
      }

      const van = this._makeVehicleMesh(false, false, 0x1d4ed8, true);
      van.position.set(-4.2, 0.1, 4.6);
      const car = this._makeVehicleMesh(false, false, 0xf8fafc, true);
      car.position.set(4.2, 0.1, 4.6);

      for (let i = 0; i < 4; i++) {
        const p = this._createCharacter({
          shirtMat: i % 2 === 0 ? this.mat.relianceBlue : this.mat.wallCoral,
          pantsMat: this.mat.darkPants,
          scale: 0.96
        });
        g.add(p);
        this.landmarkActors.push({
          plotId, mesh: p, mode: "patrol_x",
          baseX: (i - 1.5) * 2.0, baseZ: 3.3,
          range: 1.5, speed: 1.2, phase: i * 1.5
        });
      }

      const relBoard = this._makeBuildingBoard("RELIANCE DIGITAL", "SMART • ELECTRONICS", "#1d4ed8", "#facc15", 8.6, 1.3);
      relBoard.position.set(0, 5.4, 1.94);
      g.add(main, blueFacade, redAccent, goldAccent, van, car, relBoard);
      g.userData.labelY = 9.4;
      return g;
    }

    // GRAND SCHOOL CAMPUS
    const main = new THREE.Mesh(new THREE.BoxGeometry(12.4, 5.8, 3.6), this.mat.wallCream);
    main.position.set(0, 2.95, -4.4);
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.8, 5.8), this.mat.wallCream);
    wingL.position.set(-4.6, 2.45, -0.2);
    const wingR = wingL.clone();
    wingR.position.x = 4.6;
    const roofBand = new THREE.Mesh(new THREE.BoxGeometry(12.7, 0.45, 3.9), this.mat.roofOrange);
    roofBand.position.set(0, 6.0, -4.4);

    [1.7, 4.2].forEach((wy) => {
      for (let wx = -4.4; wx <= 4.4; wx += 1.45) {
        const w = new THREE.Mesh(this.geo.win, winMat);
        w.position.set(wx, wy, -2.56);
        w.userData.isWindow = true;
        g.add(w);
      }
    });

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 5.8, 5), this.mat.wallWhite);
    pole.position.set(0, 2.95, 0.2);
    const flagTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    flagTop.position.set(0.58, 5.6, 0.2);
    const flagMid = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), this.mat.wallWhite);
    flagMid.position.set(0.58, 5.36, 0.2);
    const flagBot = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.24, 0.05), new THREE.MeshBasicMaterial({ color: 0x16a34a }));
    flagBot.position.set(0.58, 5.12, 0.2);

    const schoolBus = this._makeVehicleMesh(true, false, 0xfacc15, true);
    schoolBus.position.set(3.8, 0.1, 5.4);
    schoolBus.rotation.y = Math.PI / 2;

    for (let i = 0; i < 6; i++) {
      const kid = this._createCharacter({ shirtMat: this.mat.wallWhite, pantsMat: this.mat.blueUniform, scale: 0.78 });
      g.add(kid);
      this.landmarkActors.push({
        plotId, mesh: kid, mode: "orbit",
        baseX: 0, baseZ: 2.2,
        range: 1.4 + (i % 3) * 0.7, speed: 1.4 + (i % 2) * 0.5, phase: (i / 6) * Math.PI * 2
      });
    }

    const schBoard = this._makeBuildingBoard("GRAND SCHOOL", "ENGLISH MEDIUM CAMPUS", "#c2410c", "#fef3c7", 8.2, 1.15);
    schBoard.position.set(0, 5.2, -2.52);
    g.add(main, wingL, wingR, roofBand, pole, flagTop, flagMid, flagBot, schoolBus, schBoard);
    g.userData.labelY = 8.6;
    return g;
  }
};
