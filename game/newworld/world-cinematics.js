import * as THREE from "three";
import { getSkyPalette } from "./shaders-glsl.js?v=34";
import {
  BUILDING_LABELS,
  getRequiredSize,
  blockIdxToCoord,
  getTwoPlotGroup,
  getBlockPlotIds,
  getEightPlotGroup
} from "./world-constants.js?v=34";

export const cinematicMethods = {
  setTimeOfDay(mode) {
    this.timeOfDay = mode;
    if (mode === "night") {
      this.scene.background.setHex(0x0b1120);
      this.scene.fog.color.setHex(0x0b1120);
      this.sunLight.color.setHex(0x60a5fa);
      this.sunLight.intensity = 0.42;
      this.hemiLight.intensity = 0.3;
    } else if (mode === "sunset") {
      this.scene.background.setHex(0xf97316);
      this.scene.fog.color.setHex(0xfb923c);
      this.sunLight.color.setHex(0xfdba74);
      this.sunLight.intensity = 1.05;
      this.hemiLight.intensity = 0.6;
    } else {
      this.scene.background.setHex(0x87ceeb);
      this.scene.fog.color.setHex(0x87ceeb);
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 1.15;
      this.hemiLight.intensity = 0.95;
    }

    // 🎨 Sync GLSL Atmospheric Sky Dome & GLSL Shimmering Ocean Shader!
    if (this.skyDome) {
      const pal = getSkyPalette(mode);
      this.skyDome.uniforms.uTopColor.value.copy(pal.top);
      this.skyDome.uniforms.uMidColor.value.copy(pal.mid);
      this.skyDome.uniforms.uHorizonColor.value.copy(pal.horizon);
      this.skyDome.uniforms.uSunDir.value.copy(pal.sunDir);
      this.skyDome.uniforms.uSunColor.value.copy(pal.sunCol);
      this.skyDome.uniforms.uSunGlow.value = pal.sunGlow;
    }
    if (this.oceanShader) {
      const u = this.oceanShader.uniforms;
      if (mode === "night") {
        u.uDeepColor.value.setHex(0x02142b);
        u.uShallowColor.value.setHex(0x0c4a6e);
        u.uSpecColor.value.setHex(0x93c5fd);
      } else if (mode === "sunset") {
        u.uDeepColor.value.setHex(0x1e3a5f);
        u.uShallowColor.value.setHex(0xd97706);
        u.uSpecColor.value.setHex(0xfde047);
      } else {
        u.uDeepColor.value.setHex(0x0369a1);
        u.uShallowColor.value.setHex(0x22d3ee);
        u.uSpecColor.value.setHex(0xe0f2fe);
      }
    }

    const isNight = mode === "night";
    this.lampBulbs.forEach((b) => {
      b.material = isNight ? this.mat.lampBulbNight : this.mat.lampBulbDay;
    });
    this.vehicleHeadlights.forEach((hl) => {
      hl.visible = isNight;
    });
    if (this.starField) this.starField.visible = isNight;
    if (this.cloudMat) {
      this.cloudMat.color.setHex(mode === "sunset" ? 0xfed7aa : 0xffffff);
    }
    if (this.skyClouds) {
      this.skyClouds.forEach((c) => { c.mesh.visible = !isNight; });
    }
    if (this.airportSim && this.airportSim.nightGlowMeshes) {
      this.airportSim.nightGlowMeshes.forEach((m) => { m.visible = isNight; });
    }
    if (this.discoGroup) this.discoGroup.visible = isNight;
    if (this.theaterDiscos) {
      this.theaterDiscos.forEach((td) => {
        if (td.nightGroup) td.nightGroup.visible = isNight;
      });
    }
    if (this.railwaySim) {
      if (this.railwaySim.nightLights) {
        this.railwaySim.nightLights.forEach((m) => { m.visible = isNight; });
      }
      if (this.railwaySim.trainWindows) {
        this.railwaySim.trainWindows.forEach((m) => {
          m.material = isNight ? this.mat.windowNight : this.mat.busWindshield;
        });
      }
    }
    this.plotsGroup.traverse((obj) => {
      if (obj.userData && obj.userData.isWindow) {
        obj.material = isNight ? this.mat.windowNight : this.mat.windowDay;
      }
    });
    this._updateBloomForTime();
  },

  getPlotWorldCenter(plotId) {
    if (plotId === "ST_JUNCTION") return { x: 0, y: 4, z: 0, size: 4 };
    if (plotId === "AIRPORT") return { x: this.airportX - 4, y: 5, z: 4, size: 12 };
    if (plotId === "BEACH") return { x: this.beachX + 6, y: 4, z: -2, size: 12 };
    if (plotId === "RAILWAY_STATION") return { x: 0, y: 5, z: this.railwayZ, size: 12 };
    if (plotId === "RAILWAY_SOUTH") return { x: 0, y: 5, z: this.railwaySouthZ, size: 12 };
    if (plotId === "HILL_TEMPLE") return { x: this.hillTemplePos.x, y: 18, z: this.hillTemplePos.z - 2, size: 12 };
    if (plotId === "ROCKET_PAD") return { x: this.rocketPadPos.x, y: 12, z: this.rocketPadPos.z, size: 12 };
    if (plotId === "VIP_ISLAND") return { x: this.vipIslandPos.x + 18, y: 8, z: this.vipIslandPos.z, size: 12 };
    if (plotId === "FERRIS_WHEEL") return { x: this.ferrisWheelPos.x, y: 14, z: this.ferrisWheelPos.z, size: 12 };
    if (plotId === "OUTSKIRTS_STADIUM") return { x: this.outskirtsStadiumPos.x, y: 12, z: this.outskirtsStadiumPos.z, size: 12 };
    if (plotId === "ADD_AIRPORT_PLOT") return { x: this.airportX - 39, y: 2, z: 56, size: 1 };
    if (plotId === "ADD_BEACH_PLOT") return { x: this.beachX + 22, y: 2, z: 16, size: 1 };
    const customData = this.plotDataMap.get(plotId);
    if (customData && customData.isCustomZone) {
      const cx = (customData.zone === "beach" ? this.beachX : this.airportX) + (customData.offsetX || 0);
      const cz = customData.offsetZ || 0;
      const sz = customData.status === "built" ? (customData.size || getRequiredSize(customData.buildingType)) : 1;
      return { x: cx, y: 2.5, z: cz, size: sz };
    }
    const plotIndex = parseInt(plotId.replace("plot_", ""), 10) - 1;
    if (isNaN(plotIndex) || plotIndex < 0) return { x: 0, y: 2, z: 0, size: 1 };

    const data = this.plotDataMap.get(plotId);
    const size = data?.status === "built" ? (data.size || getRequiredSize(data.buildingType)) : 1;
    const pos = this.getPlotPosition(plotIndex);

    if (size === 8) {
      const grp = getEightPlotGroup(plotId);
      const lc = blockIdxToCoord(grp.leftBlockIdx);
      const rc = blockIdxToCoord(grp.rightBlockIdx);
      return { x: ((lc.bx + rc.bx) / 2) * this.BLOCK_STEP, y: 3.5, z: lc.bz * this.BLOCK_STEP, size: 8 };
    }
    if (size === 4) {
      return { x: pos.blockCenterX, y: 3.5, z: pos.blockCenterZ, size: 4 };
    }
    if (size === 2) {
      const twoInfo = getTwoPlotGroup(plotId);
      const rowZ = pos.blockCenterZ + (twoInfo.isNorthRow ? -this.PLOT_SIZE / 2 : this.PLOT_SIZE / 2);
      return { x: pos.blockCenterX, y: 3.2, z: rowZ, size: 2 };
    }
    return { x: pos.x, y: 2.5, z: pos.z, size: 1 };
  },

  setQualityMode(isHD) {
    this.hqMode = Boolean(isHD);
    const pr = this.hqMode
      ? Math.min(window.devicePixelRatio || 2, 2.0)
      : (this.isLowRam ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.35));
    this.renderer.setPixelRatio(pr);
    const w = this.container.clientWidth || window.innerWidth || 360;
    const h = this.container.clientHeight || window.innerHeight || 640;
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setPixelRatio(pr);
      this.composer.setSize(w, h);
    }
    this.renderer.toneMappingExposure = this.hqMode ? 1.15 : 1.12;
  },

  async setGraphicsPreset(preset = "hd") {
    this.graphicsPreset = preset;
    const nativeDpr = window.devicePixelRatio || 1.5;
    const w = this.container.clientWidth || window.innerWidth || 360;
    const h = this.container.clientHeight || window.innerHeight || 640;

    if (preset === "ultra") {
      this.hqMode = true;
      this.basePixelRatio = Math.min(nativeDpr, 1.85);
      this.renderer.setPixelRatio(this.basePixelRatio);
      this.renderer.setSize(w, h);
      this.setShadowsEnabled(true);
      await this.enableCinemaBloom(true);
    } else if (preset === "smooth") {
      this.hqMode = false;
      this.basePixelRatio = Math.min(nativeDpr, 1.15);
      this.renderer.setPixelRatio(this.basePixelRatio);
      this.renderer.setSize(w, h);
      this.setShadowsEnabled(false);
      await this.enableCinemaBloom(false);
    } else {
      this.hqMode = false;
      this.basePixelRatio = this.isVeryLowRam ? Math.min(nativeDpr, 1.25) : Math.min(nativeDpr, 1.5);
      this.renderer.setPixelRatio(this.basePixelRatio);
      this.renderer.setSize(w, h);
      this.setShadowsEnabled(false);
      await this.enableCinemaBloom(false);
    }
    if (this.composer) {
      this.composer.setPixelRatio(this.basePixelRatio);
      this.composer.setSize(w, h);
    }
  },

  setReelFraming(active) {
    this.isReelFraming = Boolean(active);
    this.camera.fov = this.isReelFraming ? 48 : 42;
    this.camera.updateProjectionMatrix();
  },

  _getWideDist(baseDist) {
    const aspect = this.camera.aspect || 0.56;
    const portraitBoost = aspect < 0.85
      ? THREE.MathUtils.clamp(0.96 / Math.max(aspect, 0.44), 1.3, 1.82)
      : 1.0;
    return baseDist * portraitBoost;
  },

  _getTargetFraming(plotId, size = 1) {
    if (plotId === "ST_JUNCTION") return { dist: this._getWideDist(28), heightRatio: 0.72 };
    if (plotId === "AIRPORT") return { dist: this._getWideDist(76), heightRatio: 0.58 };
    if (plotId === "BEACH") return { dist: this._getWideDist(72), heightRatio: 0.56 };
    if (plotId === "RAILWAY_STATION" || plotId === "RAILWAY_SOUTH") return { dist: this._getWideDist(56), heightRatio: 0.58 };
    if (plotId === "HILL_TEMPLE") return { dist: this._getWideDist(72), heightRatio: 0.62 };
    if (plotId === "ROCKET_PAD") return { dist: this._getWideDist(68), heightRatio: 0.62 };
    if (plotId === "VIP_ISLAND") return { dist: this._getWideDist(78), heightRatio: 0.56 };
    if (plotId === "FERRIS_WHEEL") return { dist: this._getWideDist(56), heightRatio: 0.58 };
    if (plotId === "OUTSKIRTS_STADIUM") return { dist: this._getWideDist(82), heightRatio: 0.56 };
    if (size === 8) return { dist: this._getWideDist(48), heightRatio: 0.72 };
    if (size === 4) return { dist: this._getWideDist(35), heightRatio: 0.76 };
    if (size === 2) return { dist: this._getWideDist(29), heightRatio: 0.78 };
    return { dist: this._getWideDist(23), heightRatio: 0.8 };
  },

  focusPlot(plotId, fastSpeed = 0.1) {
    const center = this.getPlotWorldCenter(plotId);
    const fr = this._getTargetFraming(plotId, center.size);
    const dist = fr.dist;
    const h = Math.max(14, dist * fr.heightRatio);

    this.cameraGoal = {
      target: new THREE.Vector3(center.x, center.y, center.z),
      camPos: new THREE.Vector3(center.x + dist * 0.75, h, center.z + dist * 0.75),
      speed: fastSpeed
    };

    if (!this.highlightBeacon) {
      this.highlightBeacon = new THREE.Mesh(
        new THREE.RingGeometry(3.5, 4.1, 24),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
      );
      this.highlightBeacon.rotation.x = -Math.PI / 2;
      this.scene.add(this.highlightBeacon);
    }
    const sx = center.size === 12 ? 7.5 : center.size === 8 ? 3.8 : center.size === 4 ? 2.0 : 1.05;
    const sy = center.size === 12 ? 7.5 : center.size >= 4 ? 2.0 : 1.05;
    this.highlightBeacon.scale.set(sx, sy, 1);
    this.highlightBeacon.position.set(center.x, 0.3, center.z);
  },

  startProReelTour(allPlotsObj, onStopChange, onComplete) {
    this.stopAllReelModes();
    const stops = [];
    const rr = this.ringRadius || 48;

    // 1. Wide Establishing Skyline Shot (Shows Entire City + Araku Mountains!)
    const overD = this._getWideDist(Math.max(115, rr * 2.1));
    stops.push({
      tag: "WELCOME TO",
      name: this.townName.toUpperCase(),
      target: new THREE.Vector3(0, 4, 0),
      camPos: new THREE.Vector3(overD * 0.72, overD * 0.76, overD * 0.72),
      duration: 2.0,
      speed: 0.12,
      plotId: null
    });

    // 2. Full White Marble Lion Sheru Bhai Statue + Fountain Roundabout
    const stFr = this._getTargetFraming("ST_JUNCTION", 4);
    stops.push({
      tag: "CITY CENTER",
      name: "🦁 SHERU BHAI • ST JUNCTION",
      target: new THREE.Vector3(0, 5.5, 0),
      camPos: new THREE.Vector3(stFr.dist * 0.72, stFr.dist * stFr.heightRatio, stFr.dist * 0.72),
      duration: 2.0,
      speed: 0.14,
      plotId: "ST_JUNCTION"
    });

    // 3. Full 20-Acre International Airport + Diamond Helicopter + Parking
    const apFr = this._getTargetFraming("AIRPORT", 12);
    stops.push({
      tag: "20-ACRE INTERNATIONAL AIRPORT",
      name: "✈️ SHERU BHAI AIRPORT & DIAMOND HELI",
      target: new THREE.Vector3(this.airportX - 4, 5, 10),
      camPos: new THREE.Vector3(this.airportX - apFr.dist * 0.75, apFr.dist * 0.56, 10 + apFr.dist * 0.72),
      duration: 2.8,
      speed: 0.12,
      plotId: "AIRPORT"
    });

    // 4. Full Golden Beach + Sheru Bhai Chilling + Beach Villa
    const bFr = this._getTargetFraming("BEACH", 12);
    stops.push({
      tag: "GOLDEN SAND BEACH & VILLA",
      name: `🏖️ SHERU BHAI BEACH • ${this.beachOwner || "@follower_beach"}`,
      target: new THREE.Vector3(this.beachX + 8, 4, -2),
      camPos: new THREE.Vector3(this.beachX - bFr.dist * 0.68, bFr.dist * 0.54, bFr.dist * 0.68),
      duration: 2.6,
      speed: 0.12,
      plotId: "BEACH"
    });

    // 5. Full 2-Platform Railway Station + Steps + Parking + Both Trains
    const rFr = this._getTargetFraming("RAILWAY_STATION", 12);
    stops.push({
      tag: "2-PLATFORM RAILWAY STATION",
      name: `🚂 SHERU BHAI JN • ${this.railwayOwner || "@_ur_bunny_108_"}`,
      target: new THREE.Vector3(0, 4, this.railwayZ),
      camPos: new THREE.Vector3(rFr.dist * 0.68, rFr.dist * 0.56, this.railwayZ + rFr.dist * 0.74),
      duration: 2.8,
      speed: 0.12,
      plotId: "RAILWAY_STATION"
    });

    const landmarks = [];
    const houses = [];
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (!p || p.status !== "built") return;
      const sz = p.size || getRequiredSize(p.buildingType);
      if (sz >= 2) landmarks.push({ pid, p, sz });
      else houses.push({ pid, p, idx: parseInt(pid.replace("plot_", ""), 10) || 0 });
    });

    landmarks.slice(0, 5).forEach((lm, i) => {
      const c = this.getPlotWorldCenter(lm.pid);
      const fr = this._getTargetFraming(lm.pid, lm.sz);
      const side = i % 2 === 0 ? 1 : -1;
      stops.push({
        tag: lm.sz === 8 ? "8-PLOT MEGA LANDMARK" : lm.sz === 2 ? "2-PLOT STUDIO" : "TOWN LANDMARK",
        name: lm.p.ownerName || BUILDING_LABELS[lm.p.buildingType],
        target: new THREE.Vector3(c.x, c.y + 1, c.z),
        camPos: new THREE.Vector3(c.x + fr.dist * 0.72 * side, fr.dist * fr.heightRatio, c.z + fr.dist * 0.72),
        duration: 2.0,
        speed: 0.15,
        plotId: lm.pid
      });
    });

    houses.sort((a, b) => (b.p.builtDay || 1) - (a.p.builtDay || 1) || b.idx - a.idx);
    houses.slice(0, 6).forEach((h, i) => {
      const c = this.getPlotWorldCenter(h.pid);
      const fr = this._getTargetFraming(h.pid, 1);
      const side = i % 2 === 0 ? 1 : -1;
      stops.push({
        tag: `NEWLY ADDED • DAY ${h.p.builtDay || 1}`,
        name: h.p.ownerName || "New Resident",
        target: new THREE.Vector3(c.x, c.y + 1.2, c.z),
        camPos: new THREE.Vector3(c.x + fr.dist * 0.72 * side, fr.dist * fr.heightRatio, c.z + fr.dist * 0.72),
        duration: 1.7,
        speed: 0.18,
        plotId: h.pid
      });
    });

    stops.push({
      tag: "FOLLOW TO JOIN!",
      name: `${landmarks.length + houses.length} PLACES BUILT`,
      target: new THREE.Vector3(0, 4, 0),
      camPos: new THREE.Vector3(-overD * 0.75, overD * 0.8, overD * 0.75),
      duration: 2.4,
      speed: 0.1,
      plotId: null
    });

    this.proReelTour = { active: true, stops, idx: 0, timer: 0, onStopChange, onComplete };
    this._applyTourStop(0);
  },

  _applyTourStop(index) {
    const s = this.proReelTour.stops[index];
    if (!s) return;
    this.cameraGoal = { target: s.target.clone(), camPos: s.camPos.clone(), speed: s.speed };
    if (s.plotId && !["ST_JUNCTION", "AIRPORT", "BEACH", "RAILWAY_STATION", "RAILWAY_SOUTH"].includes(s.plotId)) {
      const c = this.getPlotWorldCenter(s.plotId);
      if (this.highlightBeacon) {
        const sx = c.size === 8 ? 3.8 : c.size === 4 ? 2.0 : 1.05;
        const sy = c.size >= 4 ? 2.0 : 1.05;
        this.highlightBeacon.scale.set(sx, sy, 1);
        this.highlightBeacon.position.set(c.x, 0.3, c.z);
        this.highlightBeacon.visible = true;
      }
    }
    if (this.proReelTour.onStopChange) this.proReelTour.onStopChange(s.tag, s.name);
  },

  stopProReelTour() {
    this.proReelTour.active = false;
    this.cameraGoal = null;
    if (this.proReelTour.onComplete) this.proReelTour.onComplete();
  },

  startDroneView(onStop = null) {
    this.stopAllReelModes();
    this.cameraGoal = null;
    this.autoSpin = false;

    const rr = this.ringRadius || 48;
    const ax = this.airportX || rr + 78;
    const bx = this.beachX || -(rr + 76);
    const rz = this.railROuter || rr + 28;
    const wfR = rr + 132;

    const archStartPos = new THREE.Vector3(0, 15.5, rr + 34);
    const pts = [
      archStartPos,                                             // 1. Grand Approach framing the ENTIRE Welcome Arch + City!
      new THREE.Vector3(0, 12.0, rr + 6),                       // 2. Smooth glide directly over/through the Welcome Arch
      new THREE.Vector3(0, 13.5, rr - 14),                      // 3. Down Central Avenue showing full houses on BOTH sides
      new THREE.Vector3(4, 16.0, 26),                           // 4. Approaching City Center Sheru Bhai Statue
      new THREE.Vector3(24, 18.5, 16),                          // 5. Wide Heroic Orbit around White Marble Lion Statue (East)
      new THREE.Vector3(22, 20.0, -18),                         // 6. Wide Heroic Orbit around Lion Statue (North-East)
      new THREE.Vector3(-22, 22.0, -16),                        // 7. Wide Heroic Orbit around Lion Statue (North-West)
      new THREE.Vector3(-rr * 0.65, 34, -rr * 0.55),            // 8. High Wide Sweep over NW City Blocks & Landmarks
      new THREE.Vector3(-rz * 0.45, 32, -rz - 18),              // 9. Wide View of NW Hollow Mountain Tunnel & Waterfall
      new THREE.Vector3(10, 32, -rz + 18),                      // 10. Full Wide Framing of North 2-Platform Railway Station & Parking
      new THREE.Vector3(44, 38, -(rr + 28)),                    // 11a. Dramatic Glide past Glowing Sacred Hilltop Temple Mountain & Steps!
      new THREE.Vector3(wfR * 0.42, 52, -wfR * 0.68),           // 11b. Majestic Araku Misty Mountains, North River & NE Waterfall
      new THREE.Vector3(ax - 32, 42, -22),                      // 12. Wide Overview of 20-Acre Airport Terminal & Runway
      new THREE.Vector3(ax - 36, 34, 48),                       // 13. Airport Parking, Diamond Heli & Airport Colony Boulevard
      new THREE.Vector3(rr * 0.55, 36, rr * 0.55),              // 14. Sweep back across SE City Blocks & 5-Floor Towers
      new THREE.Vector3(rz * 0.42, 30, rz + 24),                // 15. Wide View of SE Araku Mountain Tunnel & South Station
      new THREE.Vector3(-14, 32, rz + 28),                      // 16. Opposite 2-Platform South Railway Station (Araku South Jn)
      new THREE.Vector3(-wfR * 0.44, 44, wfR * 0.56),           // 17. SW Coastal Waterfall & South Valley River
      new THREE.Vector3(-(rr + 36), 34, rr + 56),               // 17b. Glide past ISRO Rocket Launchpad!
      new THREE.Vector3(bx + 18, 30, 48),                       // 17c. Sweep past Beach Giant Ferris Wheel!
      new THREE.Vector3(bx - 52, 26, 22),                       // 17d. Dramatic Glide along RGB Sea Bridge & VIP Island!
      new THREE.Vector3(bx + 24, 34, 24),                       // 18. Wide Panorama over Sheru Bhai Golden Beach, Waves & Villa
      new THREE.Vector3(-rr * 0.6, 32, rr * 0.45),              // 19. Final Wide Sweep across SW City Skyline
      new THREE.Vector3(-18, 22, rr + 28)                       // 20. Smooth return curve back to South Welcome Arch!
    ];

    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.48);
    const totalLen = curve.getLength();
    const normalizedSpeed = 30 / Math.max(totalLen, 220);

    // Place camera cleanly at the Welcome Arch opening shot looking straight through Arch to the Lion Statue!
    this.camera.position.copy(archStartPos);
    const initialLook = new THREE.Vector3(0, 6.5, rr - 14);
    this.controls.target.copy(initialLook);

    this.droneTour = {
      active: true,
      curve,
      t: 0,
      speed: normalizedSpeed,
      smoothTarget: initialLook.clone(),
      bankAngle: 0,
      onStop
    };
  },

  stopDroneView() {
    this.droneTour.active = false;
    this.camera.up.set(0, 1, 0);
    if (this.droneTour.onStop) {
      const cb = this.droneTour.onStop;
      this.droneTour.onStop = null;
      cb();
    }
  },

  replayPlotConstruction(plotId) {
    const data = this.plotDataMap.get(plotId);
    if (!data || data.status !== "built") return;
    this.renderPlot(plotId, data, true);
  },

  startSingleBuildReel(plotId, data) {
    this.stopAllReelModes();
    this.autoSpin = false;

    const c = this.getPlotWorldCenter(plotId);
    const sz = data?.size || getRequiredSize(data?.buildingType || "house_blue");
    const fr = this._getTargetFraming(plotId, sz);
    const dist = fr.dist;
    const startAng = Math.atan2(this.camera.position.z - c.z, this.camera.position.x - c.x);

    const stops = [
      {
        tag: `🏗️ CONSTRUCTING • DAY ${data?.builtDay || 1}`,
        name: data?.ownerName || BUILDING_LABELS[data?.buildingType] || "Building",
        target: new THREE.Vector3(c.x, c.y + 1.2, c.z),
        camPos: new THREE.Vector3(c.x + Math.cos(startAng) * dist, dist * fr.heightRatio, c.z + Math.sin(startAng) * dist),
        orbitRadius: dist,
        orbitHeight: dist * fr.heightRatio,
        orbitStartAng: startAng,
        orbitSpeed: 0.36,
        duration: 4.2,
        speed: 0.13,
        plotId,
        triggerBuild: true
      }
    ];

    this.buildReelTour = {
      active: true,
      stops,
      idx: 0,
      timer: 0,
      onStopChange: null,
      onComplete: null
    };
    this._applyBuildReelStop(0);
  },

  startBuildReelTour(allPlotsObj, onStopChange, onComplete) {
    this.stopAllReelModes();
    this.autoSpin = false;

    const builtList = [];
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (!p || p.status !== "built") return;
      const sz = p.size || getRequiredSize(p.buildingType);
      const numIdx = pid.startsWith("zone_") ? 99999 : (parseInt(pid.replace("plot_", ""), 10) || 0);
      builtList.push({
        pid,
        p,
        sz,
        day: p.builtDay || 1,
        idx: numIdx
      });
    });

    if (builtList.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    builtList.sort((a, b) => b.day - a.day || b.sz - a.sz || b.idx - a.idx);
    const maxDay = builtList[0].day;
    let featured = builtList.filter((item) => item.day === maxDay).slice(0, 8);
    if (featured.length < 3) {
      featured = builtList.slice(0, 6);
    }

    const stops = [];
    const stFr = this._getTargetFraming("ST_JUNCTION", 4);

    stops.push({
      tag: `DAY ${maxDay} • LIVE CONSTRUCTION REEL`,
      name: `🦁 ${this.townName.toUpperCase()}`,
      target: new THREE.Vector3(0, 5.5, 0),
      camPos: new THREE.Vector3(stFr.dist * 0.72, stFr.dist * stFr.heightRatio, stFr.dist * 0.72),
      orbitRadius: stFr.dist,
      orbitHeight: stFr.dist * stFr.heightRatio,
      orbitStartAng: 0.78,
      orbitSpeed: 0.28,
      duration: 1.8,
      speed: 0.14,
      plotId: null,
      triggerBuild: false
    });

    featured.forEach((item, i) => {
      const c = this.getPlotWorldCenter(item.pid);
      const fr = this._getTargetFraming(item.pid, item.sz);
      const ang = i % 2 === 0 ? 0.65 : 2.35;
      stops.push({
        tag: `🏗️ CONSTRUCTING • DAY ${item.day}`,
        name: item.p.ownerName || BUILDING_LABELS[item.p.buildingType] || "New Building",
        target: new THREE.Vector3(c.x, c.y + 1.2, c.z),
        camPos: new THREE.Vector3(c.x + Math.cos(ang) * fr.dist, fr.dist * fr.heightRatio, c.z + Math.sin(ang) * fr.dist),
        orbitRadius: fr.dist,
        orbitHeight: fr.dist * fr.heightRatio,
        orbitStartAng: ang,
        orbitSpeed: i % 2 === 0 ? 0.32 : -0.32,
        duration: 3.2,
        speed: 0.13,
        plotId: item.pid,
        triggerBuild: true
      });
    });

    const rr = this.ringRadius || 48;
    const endD = this._getWideDist(Math.max(120, rr * 2.15));
    stops.push({
      tag: "COMMENT TO BUILD YOURS!",
      name: `${builtList.length} PLACES LIVE`,
      target: new THREE.Vector3(0, 6, 0),
      camPos: new THREE.Vector3(-endD * 0.72, endD * 0.76, endD * 0.72),
      orbitRadius: 0,
      duration: 2.4,
      speed: 0.08,
      plotId: null,
      triggerBuild: false
    });

    this.buildReelTour = {
      active: true,
      stops,
      idx: 0,
      timer: 0,
      onStopChange,
      onComplete
    };
    this._applyBuildReelStop(0);
  },

  _applyBuildReelStop(index) {
    const s = this.buildReelTour.stops[index];
    if (!s) return;
    this.cameraGoal = {
      target: s.target.clone(),
      camPos: s.camPos.clone(),
      speed: s.speed
    };
    if (s.plotId) {
      const c = this.getPlotWorldCenter(s.plotId);
      if (this.highlightBeacon) {
        const sx = c.size === 8 ? 3.8 : c.size === 4 ? 2.0 : 1.05;
        const sy = c.size >= 4 ? 2.0 : 1.05;
        this.highlightBeacon.scale.set(sx, sy, 1);
        this.highlightBeacon.position.set(c.x, 0.3, c.z);
        this.highlightBeacon.visible = true;
      }
      if (s.triggerBuild) {
        this.replayPlotConstruction(s.plotId);
      }
    }
    if (this.buildReelTour.onStopChange) {
      this.buildReelTour.onStopChange(s.tag, s.name);
    }
  },

  stopBuildReelTour() {
    this.buildReelTour.active = false;
    this.cameraGoal = null;
    if (this.buildReelTour.onComplete) this.buildReelTour.onComplete();
  },

  setSimSpeed(mult) {
    this.simSpeed = mult || 1.0;
  },

  _getSkyPreset(mode) {
    if (mode === "night") {
      return { bg: 0x0b1120, fog: 0x0b1120, sunCol: 0x60a5fa, sunInt: 0.45, hemiInt: 0.34 };
    }
    if (mode === "sunset") {
      return { bg: 0xf97316, fog: 0xfb923c, sunCol: 0xfdba74, sunInt: 1.12, hemiInt: 0.65 };
    }
    return { bg: 0x87ceeb, fog: 0x9bd7f0, sunCol: 0xfffbeb, sunInt: 1.24, hemiInt: 1.02 };
  },

  _applyNightEffects(isNight, mode) {
    this.lampBulbs.forEach((b) => {
      b.material = isNight ? this.mat.lampBulbNight : this.mat.lampBulbDay;
    });
    this.vehicleHeadlights.forEach((hl) => {
      hl.visible = isNight;
    });
    if (this.starField) this.starField.visible = isNight;
    if (this.cloudMat) {
      this.cloudMat.color.setHex(mode === "sunset" ? 0xfed7aa : 0xffffff);
    }
    if (this.skyClouds) {
      this.skyClouds.forEach((c) => { c.mesh.visible = !isNight; });
    }
    if (this.airportSim && this.airportSim.nightGlowMeshes) {
      this.airportSim.nightGlowMeshes.forEach((m) => { m.visible = isNight; });
    }
    if (this.discoGroup) this.discoGroup.visible = isNight;
    if (this.theaterDiscos) {
      this.theaterDiscos.forEach((td) => {
        if (td.nightGroup) td.nightGroup.visible = isNight;
      });
    }
    if (this.railwaySim) {
      if (this.railwaySim.nightLights) {
        this.railwaySim.nightLights.forEach((m) => { m.visible = isNight; });
      }
      if (this.railwaySim.trainWindows) {
        this.railwaySim.trainWindows.forEach((m) => {
          m.material = isNight ? this.mat.windowNight : this.mat.busWindshield;
        });
      }
    }
    this.plotsGroup.traverse((obj) => {
      if (obj.userData && obj.userData.isWindow) {
        obj.material = isNight ? this.mat.windowNight : this.mat.windowDay;
      }
    });
    this._updateBloomForTime();
  },

  transitionTimeOfDay(targetMode, duration = 2.4) {
    const target = this._getSkyPreset(targetMode);
    this.skyTransition = {
      active: true,
      timer: 0,
      duration,
      fromBg: this.scene.background.clone(),
      toBg: new THREE.Color(target.bg),
      fromFog: this.scene.fog.color.clone(),
      toFog: new THREE.Color(target.fog),
      fromSunCol: this.sunLight.color.clone(),
      toSunCol: new THREE.Color(target.sunCol),
      fromSunInt: this.sunLight.intensity,
      toSunInt: target.sunInt,
      fromHemiInt: this.hemiLight.intensity,
      toHemiInt: target.hemiInt,
      targetMode,
      toggledNightProps: false
    };
  },

  startTempleOrbit(onStop = null) {
    this.stopAllReelModes();
    this.templeOrbit = {
      active: true,
      timer: 0,
      duration: 7.5,
      onStop
    };
  },

  stopTempleOrbit() {
    if (!this.templeOrbit || !this.templeOrbit.active) return;
    this.templeOrbit.active = false;
    if (this.templeOrbit.onStop) {
      const cb = this.templeOrbit.onStop;
      this.templeOrbit.onStop = null;
      cb();
    }
  },

  setRainEnabled(enabled) {
    this.rainEnabled = Boolean(enabled);
    if (this.rainEnabled && !this.rainPoints) {
      const count = this.isVeryLowRam ? 380 : 720;
      const positions = new Float32Array(count * 3);
      const speeds = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 140;
        positions[i * 3 + 1] = Math.random() * 85;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 140;
        speeds[i] = 48 + Math.random() * 24;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xe0f2fe,
        size: 0.65,
        transparent: true,
        opacity: 0.72,
        depthWrite: false
      });
      this.rainPoints = new THREE.Points(geo, mat);
      this.rainVel = speeds;
      this.scene.add(this.rainPoints);
    }
    if (this.rainPoints) {
      this.rainPoints.visible = this.rainEnabled;
    }
  },

  setFireworksEnabled(enabled) {
    this.fireworksEnabled = Boolean(enabled);
    if (!this.fireworksEnabled && this.fireworkBursts.length > 0) {
      this.fireworkBursts.forEach((b) => {
        this._fwGroup.remove(b.points);
        b.points.geometry.dispose();
        b.points.material.dispose();
      });
      this.fireworkBursts = [];
    }
  },

  _spawnFireworkBurst() {
    const spots = [
      { x: 0, y: 34, z: 0 },
      { x: this.hillTemplePos.x, y: 42, z: this.hillTemplePos.z },
      { x: this.beachX + 12, y: 36, z: 0 },
      { x: (Math.random() - 0.5) * 90, y: 32 + Math.random() * 16, z: (Math.random() - 0.5) * 90 }
    ];
    const origin = spots[Math.floor(Math.random() * spots.length)];
    const count = this.isVeryLowRam ? 28 : 48;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = origin.x;
      pos[i * 3 + 1] = origin.y;
      pos[i * 3 + 2] = origin.z;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const spd = 8 + Math.random() * 14;
      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * spd;
      vel[i * 3 + 1] = Math.cos(phi) * spd + 3.5;
      vel[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * spd;
    }
    const colors = [0xec4899, 0x22d3ee, 0xfacc15, 0xa855f7, 0x4ade80, 0xf97316];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 1.65,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geo, mat);
    this._fwGroup.add(points);
    this.fireworkBursts.push({ points, vel, age: 0, maxAge: 1.85 });
  },

  /**
   * 🚙 CUSTOM 3D OFF-ROAD JEEP / THAR (Converted directly from user's jeep.html!)
   * Features 4 chunky torus off-road tires + spare rear mounted wheel, arched fender mudguards,
   * 5-bar rugged front grille, glowing round headlights, undercarriage axles & tinted windows — scaled cleanly for city roads!
   */
  _makeCustomJeepMesh() {
    const outer = new THREE.Group();
    const jeep = new THREE.Group();

    const bodyMat = this.mat.jeepBodyMat;
    const blackMat = this.mat.jeepTrimMat;
    const tireMat = this.mat.wheelBlack;
    const rimMat = this.mat.jeepRimMat;
    const lightMat = this.mat.floodlightGlow;

    // 4 Chunky Off-Road Torus Tires + Hub Rims
    const tireGeo = new THREE.TorusGeometry(1.0, 0.48, 10, 20);
    const hubGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.72, 12);
    [[-5, 0.5, -4], [5, 0.5, -4], [-5, 0.5, 4], [5, 0.5, 4]].forEach(([x, y, z]) => {
      const t = new THREE.Mesh(tireGeo, tireMat);
      t.position.set(x, y, z);
      t.scale.set(1.5, 1.5, 1.55);
      const hub = new THREE.Mesh(hubGeo, rimMat);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(x, y, z);
      jeep.add(t, hub);
    });

    // Rear Mounted Spare Torus Tire
    const spare = new THREE.Mesh(tireGeo, tireMat);
    spare.position.set(7.0, 3.5, 0);
    spare.scale.set(1.45, 1.45, 1.5);
    spare.rotation.y = Math.PI / 2;
    jeep.add(spare);

    // Main Rugged Jeep Lower Body, Upper Cabin Roof & Sloped Hood/Windshield
    const seatGeo = new THREE.BoxGeometry(2.5, 1, 1);
    const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);

    const carbase = new THREE.Mesh(seatGeo, bodyMat);
    carbase.position.set(0, 3, 0);
    carbase.scale.set(1, 13, 7.5);
    carbase.rotation.z = Math.PI / 2;

    const carbase1 = new THREE.Mesh(seatGeo, bodyMat);
    carbase1.position.set(2, 5, 0);
    carbase1.scale.set(1, 8, 6.6);
    carbase1.rotation.z = Math.PI / 2;

    const windshield = new THREE.Mesh(seatGeo, blackMat);
    windshield.position.set(-2, 4.5, 0);
    windshield.scale.set(2.5, 3, 2);
    windshield.rotation.set(Math.PI / 2, Math.PI / 3, Math.PI / 2);

    const c7 = new THREE.Mesh(cylGeo, bodyMat);
    c7.position.set(0, 4, 0);
    c7.scale.set(8, 6.5, 1);
    c7.rotation.set(Math.PI / 2, Math.PI, Math.PI / 2);

    const c8 = new THREE.Mesh(cylGeo, bodyMat);
    c8.position.set(2, 6, 0);
    c8.scale.set(7, 4, 1);
    c8.rotation.set(Math.PI / 2, Math.PI, Math.PI / 2);

    // Tinted Side & Rear Windows + Front Windshield Trim
    const winL = new THREE.Mesh(cylGeo, blackMat);
    winL.position.set(2, 4.5, 3.3);
    winL.scale.set(3.5, 4.1, 1.4);
    winL.rotation.set(Math.PI, Math.PI, Math.PI / 2);
    const winR = winL.clone();
    winR.position.z = -3.3;

    const winBack = new THREE.Mesh(cylGeo, blackMat);
    winBack.position.set(6, 3.5, 0);
    winBack.scale.set(5.3, 3.7, 2);
    winBack.rotation.set(Math.PI, Math.PI / 2, Math.PI / 2);

    const hoodBump = new THREE.Mesh(cylGeo, blackMat);
    hoodBump.position.set(-5.6, 4.5, 0);
    hoodBump.scale.set(3, 1, 0.5);
    hoodBump.rotation.set(Math.PI / 2, Math.PI, Math.PI / 2);

    jeep.add(carbase, carbase1, windshield, c7, c8, winL, winR, winBack, hoodBump);

    // Wheel Arch Fender Mudguards (Front & Rear Left/Right)
    const fenderSpecs = [
      [-6.1, 2.3, 4, Math.PI / 5, 0.5], [-6.1, 2.3, -4, Math.PI / 5, 0.5],
      [-4.8, 2.6, 4, Math.PI, 1.0], [-4.8, 2.6, -4, Math.PI, 1.0],
      [-3.4, 1.8, 4, -Math.PI / 3, 1.0], [-3.4, 1.8, -4, -Math.PI / 3, 1.0],
      [6.5, 1.8, 4, -Math.PI / 3, 1.0], [6.5, 1.8, -4, -Math.PI / 3, 1.0],
      [5.0, 2.6, 4, Math.PI, 1.2], [5.0, 2.6, -4, Math.PI, 1.2],
      [3.5, 1.8, 4, Math.PI / 3, 1.0], [3.5, 1.8, -4, Math.PI / 3, 1.0]
    ];
    fenderSpecs.forEach(([fx, fy, fz, ry, sy]) => {
      const f = new THREE.Mesh(cylGeo, bodyMat);
      f.position.set(fx, fy, fz);
      f.scale.set(1.5, sy, 0.5);
      f.rotation.set(Math.PI / 2, ry, Math.PI / 2);
      jeep.add(f);
    });

    // Undercarriage Axles & Driveshaft
    const axF = new THREE.Mesh(cylGeo, blackMat);
    axF.position.set(-5, 0.5, 0);
    axF.scale.set(0.5, 4, 0.5);
    axF.rotation.set(Math.PI, Math.PI / 2, Math.PI / 2);
    const axR = axF.clone();
    axR.position.x = 5;
    const shaft = new THREE.Mesh(cylGeo, blackMat);
    shaft.position.set(0, 0.5, 0);
    shaft.scale.set(0.5, 4.5, 0.5);
    shaft.rotation.set(Math.PI, Math.PI, Math.PI / 2);
    jeep.add(axF, axR, shaft);

    // Glowing Round Jeep Headlights + Dark Bezels + 5 Iconic Vertical Front Grille Bars + Heavy Bumper!
    [-2.5, 2.5].forEach((hz) => {
      const hl = new THREE.Mesh(cylGeo, lightMat);
      hl.position.set(-6.45, 3.5, hz);
      hl.scale.set(1, 0.3, 1);
      hl.rotation.set(Math.PI / 2, Math.PI, Math.PI / 2);
      const bezel = new THREE.Mesh(cylGeo, blackMat);
      bezel.position.set(-6.32, 3.5, hz);
      bezel.scale.set(1.22, 0.3, 1.22);
      bezel.rotation.set(Math.PI / 2, Math.PI, Math.PI / 2);
      jeep.add(hl, bezel);
    });
    [-1.7, -0.9, 0, 0.9, 1.7].forEach((gz) => {
      const bar = new THREE.Mesh(seatGeo, blackMat);
      bar.position.set(-0.12, 3, gz);
      bar.scale.set(0.8, 13, 0.5);
      bar.rotation.z = Math.PI / 2;
      jeep.add(bar);
    });
    const bumper = new THREE.Mesh(seatGeo, blackMat);
    bumper.position.set(-0.1, 2, 0);
    bumper.scale.set(2, 13, 1);
    bumper.rotation.set(Math.PI / 2, Math.PI, Math.PI / 2);
    jeep.add(bumper);

    // Original jeep.html front faces -X and spans ~14 units long -> scale 0.31 (~4.35 units long) & rotate +PI/2 so Front faces +Z!
    jeep.scale.setScalar(0.31);
    jeep.rotation.y = Math.PI / 2;
    jeep.position.y = 0.52;
    outer.add(jeep);
    return outer;
  },

  _buildPlayerDriveMesh(type) {
    let veh;
    if (type === "jeep") {
      veh = this._makeCustomJeepMesh();
    } else if (type === "auto") {
      veh = this._makeRealAutoMesh(true, false);
    } else if (type === "bike") {
      const bk = new THREE.Group();
      const wGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.2, 10);
      wGeo.rotateZ(Math.PI / 2);
      const wF = new THREE.Mesh(wGeo, this.mat.wheelBlack);
      wF.position.set(0, 0.38, 0.85);
      const wB = wF.clone();
      wB.position.z = -0.85;
      const frame = new THREE.Mesh(this._boxGeo(0.38, 0.45, 1.5), this.mat.chrome);
      frame.position.set(0, 0.58, 0);
      const tank = new THREE.Mesh(this._boxGeo(0.46, 0.38, 0.85), this.mat.bikeChromeGold);
      tank.position.set(0, 0.92, 0.18);
      const handle = new THREE.Mesh(this._boxGeo(0.85, 0.08, 0.12), this.mat.chrome);
      handle.position.set(0, 1.12, 0.62);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), this.mat.floodlightGlow);
      hl.position.set(0, 0.98, 0.92);
      const rider = this._buildPlayerAvatarMesh();
      rider.scale.setScalar(0.75);
      rider.position.set(0, 0.45, -0.15);
      rider.rotation.x = 0.22;
      bk.add(wF, wB, frame, tank, handle, hl, rider);
      veh = bk;
    } else {
      veh = this._makeRealAudiCarMesh(this.mat.bikeRacingRed, false);
      const underglow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 4.1), this.mat.ferrisRimNeon);
      underglow.rotation.x = -Math.PI / 2;
      underglow.position.y = 0.08;
      veh.add(underglow);
    }

    // Dual Nitro Exhaust Flame Cones
    const nitroGroup = new THREE.Group();
    [-0.45, 0.45].forEach((nx) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 2.4, 8), this.mat.nitroCyanFlame);
      cone.rotation.x = -Math.PI / 2;
      cone.position.set(nx, 0.48, -2.6);
      nitroGroup.add(cone);
    });
    nitroGroup.visible = false;
    veh.add(nitroGroup);

    // Bright Glowing Brake Taillights
    const brakeGroup = new THREE.Group();
    [-0.72, 0.72].forEach((bx) => {
      const bl = new THREE.Mesh(this._boxGeo(0.38, 0.22, 0.14), this.mat.brakeGlowMat);
      bl.position.set(bx, 0.78, -2.05);
      brakeGroup.add(bl);
    });
    brakeGroup.visible = false;
    veh.add(brakeGroup);

    // Twin Soft Ground Headlight Beams in front (+Z)
    const hlBeam = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 8.2), this.mat.divineGoldGlow);
    hlBeam.rotation.x = -Math.PI / 2;
    hlBeam.position.set(0, 0.11, 5.8);
    veh.add(hlBeam);

    // Drift Tire Smoke Puffs
    const smokePuffs = [];
    const sGeo = new THREE.DodecahedronGeometry(0.42, 0);
    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Mesh(sGeo, this.mat.driftSmokeMat);
      sp.visible = false;
      this.scene.add(sp);
      smokePuffs.push({ mesh: sp, age: 1, maxAge: 0.55 });
    }

    this.driveState.nitroFlames = nitroGroup;
    this.driveState.brakeLights = brakeGroup;
    this.driveState.smokePuffs = smokePuffs;
    return veh;
  },

  /**
   * 🧍 REALISTIC ARTICULATED 3D PLAYER AVATAR (Head, Hair, Sunglasses, Neck, Tailored Hoodie Jacket, Gold Chain, Articulated Limbs & Sneakers!)
   */
  _buildPlayerAvatarMesh() {
    const g = new THREE.Group();
    const skinMat = this.mat.skin;
    const jacketMat = this.mat.avatarHoodieMat;
    const jeansMat = this.mat.avatarJeansMat;
    const hairMat = this.mat.avatarHairMat;
    const shoeMat = this.mat.avatarShoeMat;
    const goldMat = this.mat.mansionGoldTrim;

    // Articulated Left & Right Legs (Pivot at hip y = 0.88 for natural stride!)
    const makeLeg = (lx) => {
      const hip = new THREE.Group();
      hip.position.set(lx, 0.88, 0);
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.44, 8), jeansMat);
      thigh.position.y = -0.22;
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.09, 0.42, 8), jeansMat);
      shin.position.y = -0.62;
      const shoe = new THREE.Mesh(this._boxGeo(0.22, 0.14, 0.36), shoeMat);
      shoe.position.set(0, -0.82, 0.06);
      hip.add(thigh, shin, shoe);
      return hip;
    };
    const legL = makeLeg(-0.16);
    const legR = makeLeg(0.16);

    // Sculpted Torso (Athletic Jacket + White Inner Tee + Gold Chain + Waist Belt!)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.23, 0.68, 10), jacketMat);
    torso.scale.set(1.18, 1.0, 0.78);
    torso.position.y = 1.24;
    const innerShirt = new THREE.Mesh(this._boxGeo(0.22, 0.52, 0.38), this.mat.wallWhite);
    innerShirt.position.set(0, 1.28, 0.05);
    const goldChain = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 12, Math.PI), goldMat);
    goldChain.position.set(0, 1.46, 0.19);
    goldChain.rotation.z = Math.PI;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.14, 8), jacketMat);
    collar.position.y = 1.58;

    // Articulated Left & Right Arms (Pivot at shoulder y = 1.52!)
    const makeArm = (ax) => {
      const sh = new THREE.Group();
      sh.position.set(ax, 1.52, 0);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.48, 8), jacketMat);
      sleeve.position.y = -0.24;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), skinMat);
      hand.position.y = -0.52;
      sh.add(sleeve, hand);
      return sh;
    };
    const armL = makeArm(-0.37);
    const armR = makeArm(0.37);

    // Neck + Rounded Head + Stylish Hair + Cool Black Shades!
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.16, 8), skinMat);
    neck.position.y = 1.66;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), skinMat);
    head.scale.set(0.95, 1.08, 0.98);
    head.position.y = 1.88;
    const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.255, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
    hairTop.position.set(0, 1.92, -0.02);
    const shades = new THREE.Mesh(this._boxGeo(0.38, 0.11, 0.1), this.mat.sunglasses);
    shades.position.set(0, 1.9, 0.21);

    g.add(legL, legR, torso, innerShirt, goldChain, collar, armL, armR, neck, head, hairTop, shades);
    g.userData = { legL, legR, armL, armR };
    return g;
  },

  /**
   * 🛑 STRICT ROAD-ONLY & BUILDING WALL COLLISION CHECKER (Jeep/Cars stay on roads & never enter buildings!)
   */
  _isDrivePosBlocked(wx, wz, isWalking = false) {
    const pad = isWalking ? 0.65 : 1.35;
    const r = this.currentGridRadius;
    const step = this.BLOCK_STEP;
    const halfBlock = this.BLOCK_FOOTPRINT / 2;
    const innerEdge = (r + 0.5) * step;

    if (Math.abs(wx) < innerEdge - 0.5 && Math.abs(wz) < innerEdge - 0.5) {
      if (Math.hypot(wx, wz) < 6.6 + pad) return true;
      for (const bz of this.blockedRoadZones) {
        if (wx > bz.minX - pad && wx < bz.maxX + pad && wz > bz.minZ - pad && wz < bz.maxZ + pad) return true;
      }
      const bx = Math.round(wx / step);
      const bz = Math.round(wz / step);
      if (Math.abs(bx) <= r && Math.abs(bz) <= r) {
        const localX = Math.abs(wx - bx * step);
        const localZ = Math.abs(wz - bz * step);
        const blockLimit = isWalking ? halfBlock - 1.5 : halfBlock - 0.35;
        if (localX < blockLimit + pad && localZ < blockLimit + pad) {
          return true;
        }
      }
      return false;
    }

    if (this.vipIslandPos) {
      const lx = wx - this.vipIslandPos.x;
      const lz = wz - this.vipIslandPos.z;
      if (lx > -13.5 - pad && lx < -1.8 + pad && Math.abs(lz) < 13.5 + pad) return true;
      if (Math.hypot(lx - 6.2, lz) < 4.9 + pad) return true;
    }

    if (this.beachX) {
      const blx = wx - this.beachX;
      if (Math.abs(blx - 20.5) < 6.2 + pad && Math.abs(wz - 20.5) < 6.2 + pad) return true;
      if (Math.abs(blx - 20.5) < 6.2 + pad && Math.abs(wz + 34.5) < 6.2 + pad) return true;
    }

    if (this.beachX && wx < this.beachX - 8) {
      const onBridge = this._seaBridgeBounds && wx >= this._seaBridgeBounds.minX && wx <= this._seaBridgeBounds.maxX && Math.abs(wz - this._seaBridgeBounds.z) <= this._seaBridgeBounds.halfW - 0.5;
      const onIsland = this.vipIslandPos && Math.hypot(wx - this.vipIslandPos.x, wz - this.vipIslandPos.z) < 25.5;
      if (!onBridge && !onIsland) return true;
    }

    return false;
  },

  _clearDriveMeshes() {
    if (this.driveState.group) {
      this.scene.remove(this.driveState.group);
      this.driveState.group = null;
    }
    if (this.driveState.avatarGroup) {
      this.scene.remove(this.driveState.avatarGroup);
      this.driveState.avatarGroup = null;
    }
    if (this.driveState.smokePuffs && this.driveState.smokePuffs.length > 0) {
      this.driveState.smokePuffs.forEach((s) => this.scene.remove(s.mesh));
      this.driveState.smokePuffs = [];
    }
  },

  startDriveMode(vehicleType = "jeep", onSpeed = null, onExit = null) {
    this.stopAllReelModes();
    this._clearDriveMeshes();

    const step = this.BLOCK_STEP;
    const rr = this.ringRadius || 48;
    const spawnX = 0.5 * step;
    const spawnZ = rr - 4;
    const mesh = this._buildPlayerDriveMesh(vehicleType);

    this.driveState.active = true;
    this.driveState.subMode = "drive";
    this.driveState.vehicleType = vehicleType;
    this.driveState.group = mesh;
    this.driveState.pos.set(spawnX, 0.14, spawnZ);
    this.driveState.yaw = Math.PI;
    this.driveState.carPos.copy(this.driveState.pos);
    this.driveState.carYaw = this.driveState.yaw;
    this.driveState.speed = 0;
    this.driveState.jumpVel = 0;
    this.driveState.jumpY = 0;
    this.driveState.camYawOffset = 0;
    this.driveState.joyX = 0;
    this.driveState.joyY = 0;
    this.driveState.keys = { forward: false, backward: false, left: false, right: false, boost: false };
    this.driveState.onSpeed = onSpeed;
    this.driveState.onExit = onExit;
    this._lastNearbyPlotId = null;

    mesh.position.copy(this.driveState.pos);
    mesh.rotation.y = this.driveState.yaw;
    this.scene.add(mesh);
    this.controls.enabled = false;

    this._bindDriveInputListeners();
  },

  /**
   * 🚪 SPAWN RIGHT OUTSIDE THE EXACT HOUSE / BUILDING YOU JUST EXITED (ON FOOT + PARKED JEEP NEARBY!)
   * Lets you immediately run, jump, explore the street, enter another building, or hop right into your Jeep!
   */
  spawnOutsideBuilding(plotId, customX = null, customZ = null, customYaw = 0, onSpeed = null, onExit = null) {
    this.stopAllReelModes();
    this._clearDriveMeshes();

    // Compute safe sidewalk/road spot right outside the exited building's front door!
    let sx = Number.isFinite(customX) ? customX : null;
    let sz = Number.isFinite(customZ) ? customZ : null;
    let syaw = Number.isFinite(customYaw) ? customYaw : 0;

    if (sx === null || sz === null) {
      const c = this.getPlotWorldCenter(plotId || "ST_JUNCTION");
      if (plotId === "VIP_ISLAND" && this.vipIslandPos) {
        sx = this.vipIslandPos.x + 1.2;
        sz = this.vipIslandPos.z;
        syaw = Math.PI / 2;
      } else if (plotId === "OUTSKIRTS_STADIUM" && this.outskirtsStadiumPos) {
        sx = this.outskirtsStadiumPos.x - 18;
        sz = this.outskirtsStadiumPos.z - 28;
        syaw = Math.PI;
      } else if (c) {
        // Snap cleanly to the nearest street edge right outside the plot!
        const step = this.BLOCK_STEP;
        const bx = Math.round(c.x / step);
        const bz = Math.round(c.z / step);
        const roadZ = c.z >= bz * step ? (bz + 0.5) * step : (bz - 0.5) * step;
        sx = c.x;
        sz = Math.abs(c.x) < (this.currentGridRadius + 0.5) * step ? roadZ : c.z + 9.5;
        syaw = c.z >= bz * step ? 0 : Math.PI;
      } else {
        sx = 0.5 * this.BLOCK_STEP;
        sz = (this.ringRadius || 48) - 6;
      }
    }

    const groundY = this._getDriveGroundY(sx, sz);
    // Park your custom Jeep right on the curb beside you so you can hop in anytime!
    const jeepMesh = this._buildPlayerDriveMesh("jeep");
    const carX = sx + 3.2;
    const carZ = sz;
    jeepMesh.position.set(carX, this._getDriveGroundY(carX, carZ), carZ);
    jeepMesh.rotation.y = syaw;
    this.scene.add(jeepMesh);

    const avatarMesh = this._buildPlayerAvatarMesh();
    avatarMesh.position.set(sx, groundY, sz);
    avatarMesh.rotation.y = syaw;
    this.scene.add(avatarMesh);

    this.driveState.active = true;
    this.driveState.subMode = "walk";
    this.driveState.vehicleType = "jeep";
    this.driveState.group = jeepMesh;
    this.driveState.avatarGroup = avatarMesh;
    this.driveState.pos.set(sx, groundY, sz);
    this.driveState.yaw = syaw;
    this.driveState.carPos.set(carX, this._getDriveGroundY(carX, carZ), carZ);
    this.driveState.carYaw = syaw;
    this.driveState.speed = 0;
    this.driveState.jumpVel = 0;
    this.driveState.jumpY = 0;
    this.driveState.camYawOffset = 0;
    this.driveState.joyX = 0;
    this.driveState.joyY = 0;
    this.driveState.keys = { forward: false, backward: false, left: false, right: false, boost: false };
    this.driveState.onSpeed = onSpeed;
    this.driveState.onExit = onExit;
    this._lastNearbyPlotId = null;

    this.controls.enabled = false;
    this.camera.position.set(sx - Math.sin(syaw) * 9.5, groundY + 4.8, sz - Math.cos(syaw) * 9.5);
    this.controls.target.set(sx, groundY + 1.8, sz);

    this._bindDriveInputListeners();
  },

  _bindDriveInputListeners() {
    if (this._driveKeysBound) return;
    this._driveKeysBound = true;
    window.addEventListener("keydown", (e) => {
      if (!this.driveState.active) return;
      if (e.code === "ArrowUp" || e.code === "KeyW") this.driveState.keys.forward = true;
      if (e.code === "ArrowDown" || e.code === "KeyS") this.driveState.keys.backward = true;
      if (e.code === "ArrowLeft" || e.code === "KeyA") this.driveState.keys.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") this.driveState.keys.right = true;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") this.driveState.keys.boost = true;
      if (e.code === "Space") this.triggerAvatarJump();
      if (e.code === "KeyH") this.playDriveHorn();
      if (e.code === "Escape") this.stopDriveMode();
    });
    window.addEventListener("keyup", (e) => {
      if (!this.driveState.active) return;
      if (e.code === "ArrowUp" || e.code === "KeyW") this.driveState.keys.forward = false;
      if (e.code === "ArrowDown" || e.code === "KeyS") this.driveState.keys.backward = false;
      if (e.code === "ArrowLeft" || e.code === "KeyA") this.driveState.keys.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") this.driveState.keys.right = false;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") this.driveState.keys.boost = false;
    });

    // Free Fire Right-Screen Touch Drag to Rotate Camera smoothly around Avatar / Jeep!
    let lookDragId = null;
    let lastLookX = 0;
    const dom = this.renderer.domElement;
    dom.addEventListener("pointerdown", (e) => {
      if (!this.driveState.active) return;
      lookDragId = e.pointerId;
      lastLookX = e.clientX;
    });
    dom.addEventListener("pointermove", (e) => {
      if (!this.driveState.active || e.pointerId !== lookDragId) return;
      const dx = e.clientX - lastLookX;
      lastLookX = e.clientX;
      if (this.driveState.subMode === "walk") {
        this.driveState.yaw -= dx * 0.0085;
      } else {
        this.driveState.camYawOffset = THREE.MathUtils.clamp(this.driveState.camYawOffset - dx * 0.007, -1.5, 1.5);
      }
    });
    dom.addEventListener("pointerup", (e) => {
      if (e.pointerId === lookDragId) lookDragId = null;
    });
    dom.addEventListener("pointercancel", (e) => {
      if (e.pointerId === lookDragId) lookDragId = null;
    });
  },

  setDriveJoystick(jx, jy) {
    if (!this.driveState.active) return;
    this.driveState.joyX = THREE.MathUtils.clamp(jx, -1, 1);
    this.driveState.joyY = THREE.MathUtils.clamp(jy, -1, 1);
  },

  triggerAvatarJump() {
    if (!this.driveState.active || this.driveState.subMode !== "walk") return;
    if (this.driveState.jumpY <= 0.05) {
      this.driveState.jumpVel = 9.2;
      if (this.audioFX) this.audioFX.playStep();
    }
  },

  toggleDriveAvatar() {
    if (!this.driveState.active) return "drive";
    const ds = this.driveState;
    if (ds.subMode === "drive") {
      ds.subMode = "walk";
      ds.speed = 0;
      ds.camYawOffset = 0;
      ds.carPos.copy(ds.pos);
      ds.carYaw = ds.yaw;
      if (ds.nitroFlames) ds.nitroFlames.visible = false;
      if (ds.brakeLights) ds.brakeLights.visible = false;

      if (!ds.avatarGroup) {
        ds.avatarGroup = this._buildPlayerAvatarMesh();
        this.scene.add(ds.avatarGroup);
      }
      ds.avatarGroup.visible = true;
      ds.pos.set(ds.carPos.x + Math.cos(ds.carYaw) * 2.4, ds.carPos.y, ds.carPos.z - Math.sin(ds.carYaw) * 2.4);
      ds.avatarGroup.position.copy(ds.pos);
      ds.avatarGroup.rotation.y = ds.yaw;
      this.playDoorOpenFX();
      return "walk";
    } else {
      ds.subMode = "drive";
      ds.speed = 0;
      ds.jumpY = 0;
      ds.jumpVel = 0;
      if (ds.avatarGroup) ds.avatarGroup.visible = false;
      // Summon parked vehicle right to your current road spot if you walked far away!
      if (ds.pos.distanceTo(ds.carPos) > 16) {
        ds.carPos.copy(ds.pos);
        ds.carYaw = ds.yaw;
        if (ds.group) {
          ds.group.position.copy(ds.carPos);
          ds.group.rotation.y = ds.carYaw;
        }
      }
      ds.pos.copy(ds.carPos);
      ds.yaw = ds.carYaw;
      if (this.onNearbyDoorChange) this.onNearbyDoorChange(null);
      this._lastNearbyPlotId = null;
      this.playDoorOpenFX();
      return "drive";
    }
  },

  playDriveHorn() {
    if (this.audioFX) this.audioFX.playHorn();
  },

  playDoorOpenFX() {
    if (this.audioFX) this.audioFX.playDoorOpen();
  },

  switchDriveVehicle(vehicleType) {
    if (!this.driveState.active) return;
    if (this.driveState.subMode === "walk") this.toggleDriveAvatar();
    if (this.driveState.group) this.scene.remove(this.driveState.group);
    if (this.driveState.smokePuffs) {
      this.driveState.smokePuffs.forEach((s) => this.scene.remove(s.mesh));
      this.driveState.smokePuffs = [];
    }
    const mesh = this._buildPlayerDriveMesh(vehicleType);
    this.driveState.vehicleType = vehicleType;
    this.driveState.group = mesh;
    mesh.position.copy(this.driveState.pos);
    mesh.rotation.y = this.driveState.yaw;
    this.scene.add(mesh);
  },

  setDriveControl(key, pressed) {
    if (!this.driveState.active) return;
    this.driveState.keys[key] = Boolean(pressed);
  },

  teleportDrive(dest) {
    if (!this.driveState.active) return;
    if (this.driveState.subMode === "walk") this.toggleDriveAvatar();
    const rr = this.ringRadius || 48;
    const step = this.BLOCK_STEP;
    this.driveState.speed = 0;
    this.driveState.camYawOffset = 0;
    if (dest === "bridge") {
      this.driveState.pos.set(this.beachX + 18, 0.25, -2);
      this.driveState.yaw = -Math.PI / 2;
    } else if (dest === "temple") {
      this.driveState.pos.set(this.hillTemplePos.x, 0.2, this.hillTemplePos.z + 32);
      this.driveState.yaw = Math.PI;
    } else if (dest === "rocket") {
      this.driveState.pos.set(this.rocketPadPos.x + 18, 0.2, this.rocketPadPos.z - 28);
      this.driveState.yaw = 0;
    } else if (dest === "stadium") {
      this.driveState.pos.set(this.outskirtsStadiumPos.x - 18, 0.2, this.outskirtsStadiumPos.z - 32);
      this.driveState.yaw = 0;
    } else {
      this.driveState.pos.set(0.5 * step, 0.14, rr - 4);
      this.driveState.yaw = Math.PI;
    }
    this.driveState.carPos.copy(this.driveState.pos);
    this.driveState.carYaw = this.driveState.yaw;
  },

  stopDriveMode() {
    if (!this.driveState.active) return;
    this.driveState.active = false;
    this._clearDriveMeshes();
    this.camera.fov = this.isReelFraming ? 48 : 42;
    this.camera.updateProjectionMatrix();
    this.controls.enabled = true;
    if (this.onNearbyDoorChange) this.onNearbyDoorChange(null);
    this._lastNearbyPlotId = null;
    if (this.driveState.onExit) {
      const cb = this.driveState.onExit;
      this.driveState.onExit = null;
      cb();
    }
  },

  _getDriveGroundY(wx, wz) {
    if (this._seaBridgeBounds && this._getSeaBridgeY) {
      const b = this._seaBridgeBounds;
      if (wx >= b.minX && wx <= b.maxX && Math.abs(wz - b.z) <= b.halfW + 1.5) {
        return this._getSeaBridgeY(wx) + 0.35;
      }
    }
    if (this.vipIslandPos) {
      const dIsl = Math.hypot(wx - this.vipIslandPos.x, wz - this.vipIslandPos.z);
      if (dIsl < 27.5) return 2.22;
    }
    return 0.14;
  },

  _checkNearbyDoor(px, pz) {
    // 1. Sheru Bhai Royal Island Mansion Arched Double Doors
    if (this.vipIslandPos) {
      const dx = px - (this.vipIslandPos.x - 1.5);
      const dz = pz - this.vipIslandPos.z;
      const nearMansion = Math.hypot(dx, dz) < 15.0;
      if (this.mansionDoors) {
        const targetOpen = nearMansion ? 1 : 0;
        this.mansionDoors.openAmount = THREE.MathUtils.lerp(this.mansionDoors.openAmount, targetOpen, 0.12);
        this.mansionDoors.doorL.position.z = -0.98 - this.mansionDoors.openAmount * 1.65;
        this.mansionDoors.doorR.position.z = 0.98 + this.mansionDoors.openAmount * 1.65;
      }
      if (nearMansion) {
        return { plotId: "VIP_ISLAND", label: "Sheru Bhai Royal Mansion", data: null };
      }
    }

    // 2. Outskirts International Cricket Stadium
    if (this.outskirtsStadiumPos && Math.hypot(px - this.outskirtsStadiumPos.x, pz - this.outskirtsStadiumPos.z) < 38) {
      return { plotId: "OUTSKIRTS_STADIUM", label: "Sheru Bhai Cricket Stadium", data: { ownerName: "SHERU BHAI STADIUM", buildingType: "ground" } };
    }

    // 3. Sacred Hilltop Temple
    if (this.hillTemplePos && Math.hypot(px - this.hillTemplePos.x, pz - this.hillTemplePos.z) < 30) {
      return { plotId: "HILL_TEMPLE", label: "Sri Venkateswara Hill Temple", data: { ownerName: "SRI VENKATESWARA TEMPLE", buildingType: "tirumala_temple" } };
    }

    // 4. Nearest Built City / Beach Building Plot!
    let best = null;
    let bestDistSq = 15.0 * 15.0;
    for (const [pid, pdata] of this.plotDataMap.entries()) {
      if (!pdata || pdata.status !== "built" || pdata.buildingType === "empty") continue;
      const c = this.getPlotWorldCenter(pid);
      if (!c) continue;
      const dSq = (c.x - px) * (c.x - px) + (c.z - pz) * (c.z - pz);
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        best = { plotId: pid, label: pdata.ownerName || BUILDING_LABELS[pdata.buildingType] || "Building", data: pdata };
      }
    }
    return best;
  },

  stopAllReelModes() {
    if (this.driveState && this.driveState.active) this.stopDriveMode();
    if (this.templeOrbit && this.templeOrbit.active) this.stopTempleOrbit();
    if (this.proReelTour.active) this.stopProReelTour();
    if (this.droneTour.active) this.stopDroneView();
    if (this.buildReelTour.active) this.stopBuildReelTour();
    if (this.chaseCam.active) this.stopChaseCam();
    if (this.timelapseState.active) this.stopGrowthTimelapse();
    if (this.hyperlapse24h.active) this.stop24HourHyperlapse();
    if (this.discoOutro.active) this.stopDiscoOutro();
    if (this.streetWalk.active) this.stopStreetWalk();
    this.cameraGoal = null;
    this.autoSpin = false;
  },

  startChaseCam(mode, onStop = null) {
    this.stopAllReelModes();
    this.chaseCam = {
      active: true,
      mode,
      smoothTarget: this.controls.target.clone(),
      onStop
    };
  },

  stopChaseCam() {
    this.chaseCam.active = false;
    this.chaseCam.mode = null;
    if (this.chaseCam.onStop) {
      const cb = this.chaseCam.onStop;
      this.chaseCam.onStop = null;
      cb();
    }
  },

  startGrowthTimelapse(allPlotsObj, onStopChange, onComplete) {
    this.stopAllReelModes();
    const daySet = new Set();
    const entries = [];
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (p && p.status === "built") {
        const d = p.builtDay || 1;
        daySet.add(d);
        entries.push({ pid, day: d });
      }
    });
    const days = Array.from(daySet).sort((a, b) => a - b);
    if (days.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    const savedVis = [];
    entries.forEach((e) => {
      const grp = this.plotMeshes.get(e.pid);
      if (grp) {
        savedVis.push({ grp, pid: e.pid, day: e.day });
        if (e.day > days[0]) {
          grp.visible = false;
        }
      }
    });

    this.timelapseState = {
      active: true,
      days,
      dayIdx: 0,
      timer: 0,
      savedVis,
      onStopChange,
      onComplete
    };

    const countDay0 = savedVis.filter((s) => s.day <= days[0]).length;
    if (onStopChange) onStopChange("📈 CITY GROWTH TIMELAPSE", `DAY ${days[0]} • ${countDay0} PLACES`);
  },

  stopGrowthTimelapse() {
    if (!this.timelapseState.active) return;
    this.timelapseState.active = false;
    this.timelapseState.savedVis.forEach((s) => {
      s.grp.visible = true;
      s.grp.scale.set(1, 1, 1);
    });
    this.timelapseState.savedVis = [];
    if (this.timelapseState.onComplete) {
      const cb = this.timelapseState.onComplete;
      this.timelapseState.onComplete = null;
      cb();
    }
  },

  start24HourHyperlapse(onStop = null) {
    this.stopAllReelModes();
    this.hyperlapse24h = {
      active: true,
      timer: 0,
      duration: 10.0,
      prevSpeed: this.simSpeed,
      prevMode: this.timeOfDay,
      onStop
    };
    this.simSpeed = 2.4;
  },

  stop24HourHyperlapse() {
    if (!this.hyperlapse24h.active) return;
    this.hyperlapse24h.active = false;
    this.simSpeed = this.hyperlapse24h.prevSpeed || 1.0;
    this.setTimeOfDay(this.hyperlapse24h.prevMode || "day");
    if (this.hyperlapse24h.onStop) {
      const cb = this.hyperlapse24h.onStop;
      this.hyperlapse24h.onStop = null;
      cb();
    }
  },

  startRandomFollowerReel(allPlotsObj, onStopChange, onComplete) {
    this.stopAllReelModes();
    const candidates = [];
    Object.entries(allPlotsObj || {}).forEach(([pid, p]) => {
      if (p && p.status === "built" && p.ownerName) {
        candidates.push({ pid, p, sz: p.size || getRequiredSize(p.buildingType) });
      }
    });
    if (candidates.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const picks = candidates.slice(0, Math.min(6, candidates.length));
    const winner = picks[picks.length - 1];

    const stops = [];
    picks.slice(0, -1).forEach((item, i) => {
      const c = this.getPlotWorldCenter(item.pid);
      const hopD = this._getWideDist(30);
      stops.push({
        tag: "🎲 PICKING LUCKY FOLLOWER...",
        name: item.p.ownerName,
        target: new THREE.Vector3(c.x, c.y + 1, c.z),
        camPos: new THREE.Vector3(c.x + (i % 2 === 0 ? hopD * 0.72 : -hopD * 0.72), hopD * 0.85, c.z + hopD * 0.72),
        orbitRadius: 0,
        duration: 0.65,
        speed: 0.24,
        plotId: item.pid,
        triggerBuild: false
      });
    });

    const wc = this.getPlotWorldCenter(winner.pid);
    const wFr = this._getTargetFraming(winner.pid, winner.sz);
    stops.push({
      tag: "🏆 TODAY'S VIP FOLLOWER!",
      name: winner.p.ownerName,
      target: new THREE.Vector3(wc.x, wc.y + 1.2, wc.z),
      camPos: new THREE.Vector3(wc.x + wFr.dist * 0.72, wFr.dist * wFr.heightRatio, wc.z + wFr.dist * 0.72),
      orbitRadius: wFr.dist,
      orbitHeight: wFr.dist * wFr.heightRatio,
      orbitStartAng: 0.78,
      orbitSpeed: 0.36,
      duration: 4.0,
      speed: 0.14,
      plotId: winner.pid,
      triggerBuild: false
    });

    this.buildReelTour = {
      active: true,
      stops,
      idx: 0,
      timer: 0,
      onStopChange,
      onComplete
    };
    this._applyBuildReelStop(0);
  },

  startDiscoOutro(onStop = null) {
    this.stopAllReelModes();
    this.transitionTimeOfDay("night", 1.5);
    this.discoOutro = {
      active: true,
      timer: 0,
      duration: 6.5,
      onStop
    };
  },

  stopDiscoOutro() {
    if (!this.discoOutro.active) return;
    this.discoOutro.active = false;
    if (this.discoOutro.onStop) {
      const cb = this.discoOutro.onStop;
      this.discoOutro.onStop = null;
      cb();
    }
  },

  startStreetWalk(onStop = null) {
    this.stopAllReelModes();
    const rr = this.ringRadius || 48;
    const pts = [
      new THREE.Vector3(0, 5.4, rr + 2),
      new THREE.Vector3(0, 5.4, rr * 0.55),
      new THREE.Vector3(0, 5.4, 17.5),
      new THREE.Vector3(12.5, 5.8, 12.5),
      new THREE.Vector3(12.5, 5.8, -12.5),
      new THREE.Vector3(0, 5.4, -17.5),
      new THREE.Vector3(0, 5.4, -(rr - 6)),
      new THREE.Vector3(rr * 0.48, 5.8, -(rr - 6)),
      new THREE.Vector3(rr * 0.48, 5.8, rr - 6)
    ];
    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.38);
    const totalLen = curve.getLength();
    this.streetWalk = {
      active: true,
      curve,
      t: 0,
      speed: 12.5 / Math.max(totalLen, 100),
      smoothTarget: this.controls.target.clone(),
      onStop
    };
  },

  stopStreetWalk() {
    if (!this.streetWalk.active) return;
    this.streetWalk.active = false;
    if (this.streetWalk.onStop) {
      const cb = this.streetWalk.onStop;
      this.streetWalk.onStop = null;
      cb();
    }
  },

  startCustomShotList(shotItems, replayConstruction, onStopChange, onComplete) {
    this.stopAllReelModes();
    if (!shotItems || shotItems.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    const stops = shotItems.map((item, i) => {
      const c = this.getPlotWorldCenter(item.id);
      const isSpecial = ["ST_JUNCTION", "AIRPORT", "BEACH", "RAILWAY_STATION", "RAILWAY_SOUTH", "HILL_TEMPLE", "ROCKET_PAD", "VIP_ISLAND", "FERRIS_WHEEL", "OUTSKIRTS_STADIUM"].includes(item.id);
      const fr = this._getTargetFraming(item.id, c.size);
      const ang = i % 2 === 0 ? 0.65 : 2.35;
      return {
        tag: isSpecial ? "CITY LANDMARK" : (replayConstruction ? `🏗️ CONSTRUCTING • DAY ${item.day || 1}` : `DAY ${item.day || 1} SPOTLIGHT`),
        name: item.label,
        target: new THREE.Vector3(c.x, c.y + 1.2, c.z),
        camPos: new THREE.Vector3(c.x + Math.cos(ang) * fr.dist, fr.dist * fr.heightRatio, c.z + Math.sin(ang) * fr.dist),
        orbitRadius: fr.dist,
        orbitHeight: fr.dist * fr.heightRatio,
        orbitStartAng: ang,
        orbitSpeed: i % 2 === 0 ? 0.3 : -0.3,
        duration: replayConstruction && !isSpecial ? 3.2 : 2.8,
        speed: 0.13,
        plotId: isSpecial ? null : item.id,
        triggerBuild: Boolean(replayConstruction && !isSpecial)
      };
    });

    this.buildReelTour = {
      active: true,
      stops,
      idx: 0,
      timer: 0,
      onStopChange,
      onComplete
    };
    this._applyBuildReelStop(0);
  },

  _applyShadowFlags(rootGroup) {
    if (!rootGroup) return;
    const on = this.shadowsEnabled;
    rootGroup.traverse((obj) => {
      if (!obj.isMesh) return;
      if (obj.material === this.mat.invisibleHitbox) return;
      if (obj.material && obj.material.blending === THREE.AdditiveBlending) {
        obj.castShadow = false;
        obj.receiveShadow = false;
        return;
      }
      const geo = obj.geometry;
      const p = geo?.parameters;
      const isFlatPlane = geo?.type === "PlaneGeometry" || geo?.type === "RingGeometry" || (p && typeof p.height === "number" && p.height <= 0.45);
      if (isFlatPlane) {
        obj.castShadow = false;
        obj.receiveShadow = on;
      } else {
        obj.castShadow = on;
        obj.receiveShadow = on;
      }
    });
  },

  setShadowsEnabled(enabled) {
    this.shadowsEnabled = Boolean(enabled);
    this.renderer.shadowMap.enabled = this.shadowsEnabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Half-rate shadow refresh cuts GPU shadow cost by 50% for smooth 60fps Reel recording!
    this.renderer.shadowMap.autoUpdate = false;
    this.sunLight.castShadow = this.shadowsEnabled;

    this._applyShadowFlags(this.cityGroup);
    this._applyShadowFlags(this.plotsGroup);
    this._applyShadowFlags(this.trafficGroup);
    this.renderer.shadowMap.needsUpdate = true;
  },

  _updateBloomForTime() {
    if (!this.bloomPass) return;
    if (this.timeOfDay === "night") {
      // Dramatic cinema glow for Disco Statue beams, Theater Sky Lights, Train Headlights & Neon Shops!
      this.bloomPass.threshold = 0.46;
      this.bloomPass.strength = 0.72;
      this.bloomPass.radius = 0.56;
    } else if (this.timeOfDay === "sunset") {
      this.bloomPass.threshold = 0.72;
      this.bloomPass.strength = 0.36;
      this.bloomPass.radius = 0.42;
    } else {
      // Subtle crisp specular bloom in Daylight so colors stay vibrant and never washed out!
      this.bloomPass.threshold = 0.86;
      this.bloomPass.strength = 0.22;
      this.bloomPass.radius = 0.35;
    }
  },

  async enableCinemaBloom(enabled) {
    if (!enabled) {
      this.bloomEnabled = false;
      return;
    }
    if (this.composer && this.bloomPass) {
      this.bloomEnabled = true;
      this._updateBloomForTime();
      return;
    }
    if (this._bloomLoading) return;
    this._bloomLoading = true;
    try {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
        import("three/addons/postprocessing/EffectComposer.js"),
        import("three/addons/postprocessing/RenderPass.js"),
        import("three/addons/postprocessing/UnrealBloomPass.js"),
        import("three/addons/postprocessing/OutputPass.js")
      ]);
      const w = this.container.clientWidth || window.innerWidth || 360;
      const h = this.container.clientHeight || window.innerHeight || 640;
      const composer = new EffectComposer(this.renderer);
      composer.setPixelRatio(this.renderer.getPixelRatio());
      composer.setSize(w, h);
      composer.addPass(new RenderPass(this.scene, this.camera));
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(Math.floor(w * 0.5), Math.floor(h * 0.5)), 0.35, 0.45, 0.72);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
      this.composer = composer;
      this.bloomPass = bloomPass;
      this.bloomEnabled = true;
      this._updateBloomForTime();
    } catch (err) {
      console.warn("Cinema Bloom fallback to standard renderer:", err);
      this.bloomEnabled = false;
    } finally {
      this._bloomLoading = false;
    }
  },

  setHeroModelUrls(urls = {}) {
    const clean = {
      statue: (urls.statue || "").trim(),
      audi: (urls.audi || "").trim(),
      heli: (urls.heli || "").trim()
    };
    const prev = this.heroModelUrls || { statue: "", audi: "", heli: "" };
    this.heroModelUrls = clean;

    if (clean.statue !== prev.statue && this.heroStatueSlot) {
      this._applyHeroSlot("statue", clean.statue, this.heroStatueSlot, 5.2, 4.6, 0);
    }
    if (clean.heli !== prev.heli && this.heroHeliSlot) {
      this._applyHeroSlot("heli", clean.heli, this.heroHeliSlot, 8.2, 0.1, 0);
    }
    if (clean.audi !== prev.audi && this.heroAudiSlots.length > 0) {
      this.heroAudiSlots.forEach((slot) => {
        this._applyHeroSlot("audi", clean.audi, slot.group, 4.3, 0.02, 0);
      });
    }
  },

  _applyHeroSlot(slotName, url, targetGroup, targetMaxDim, yOffset, rotY) {
    // Remove previous custom GLB wrapper if any & restore procedural fallback first
    const oldGlb = targetGroup.getObjectByName(`hero_glb_${slotName}`);
    if (oldGlb) targetGroup.remove(oldGlb);
    targetGroup.children.forEach((ch) => {
      if (ch.userData && ch.userData._hiddenByGlb) {
        ch.visible = true;
        delete ch.userData._hiddenByGlb;
      }
    });
    if (url) {
      this._loadHeroGLB(slotName, url, targetGroup, targetMaxDim, yOffset, rotY);
    }
  },

  async _loadHeroGLB(slotName, url, targetGroup, targetMaxDim = 5.0, yOffset = 0, rotY = 0) {
    if (!url || !targetGroup) return;
    try {
      if (!this._gltfLoader) {
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        this._gltfLoader = new GLTFLoader();
      }
      let baseScene = this.glbCache.get(url);
      if (!baseScene) {
        const gltf = await this._gltfLoader.loadAsync(url);
        baseScene = gltf.scene;
        this.glbCache.set(url, baseScene);
      }
      const model = baseScene.clone(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = targetMaxDim / maxDim;

      const wrap = new THREE.Group();
      wrap.name = `hero_glb_${slotName}`;
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -box.min.y * scale + yOffset, -center.z * scale);
      wrap.rotation.y = rotY;
      wrap.add(model);

      // Remove any existing wrapper and hide procedural fallback meshes cleanly
      const prevWrap = targetGroup.getObjectByName(`hero_glb_${slotName}`);
      if (prevWrap) targetGroup.remove(prevWrap);
      targetGroup.children.forEach((ch) => {
        if (ch.visible) {
          ch.visible = false;
          ch.userData._hiddenByGlb = true;
        }
      });
      targetGroup.add(wrap);
      if (this.shadowsEnabled) this._applyShadowFlags(wrap);
    } catch (err) {
      console.warn(`Hero .glb load skipped for ${slotName} (${url}):`, err);
    }
  },

  findPlotByQuery(query) {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return null;
    if (q.includes("airport") || q.includes("plane") || q.includes("flight") || q.includes("heli") || q.includes("diamond")) return "AIRPORT";
    const beachClean = (this.beachOwner || "").toLowerCase().replace(/^@/, "");
    if (q.includes("beach") || q.includes("ocean") || q.includes("sea") || (beachClean && beachClean.includes(q))) return "BEACH";
    const railClean = (this.railwayOwner || "").toLowerCase().replace(/^@/, "");
    if (q.includes("south") || q.includes("araku") || q.includes("waterfall") || q.includes("mountain")) return "RAILWAY_SOUTH";
    if (q.includes("train") || q.includes("rail") || q.includes("station") || q.includes("tunnel") || (railClean && railClean.includes(q))) return "RAILWAY_STATION";

    if (q.includes("sheru") || q.includes("bhai") || q.includes("junction") || q.includes("statue") || q === "st") return "ST_JUNCTION";
    for (const [plotId, data] of this.plotDataMap.entries()) {
      if (!data || data.status !== "built") continue;
      const owner = (data.ownerName || "").toLowerCase().replace(/^@/, "");
      const role = (data.role || "").toLowerCase();
      const typeLabel = (BUILDING_LABELS[data.buildingType] || data.buildingType || "").toLowerCase();
      if (owner.includes(q) || role.includes(q) || typeLabel.includes(q)) return plotId;
    }
    return null;
  }
};
