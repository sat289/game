import * as THREE from "three";
import { getSkyPalette } from "./shaders-glsl.js?v=36";

export const loopMethods = {
  _animate() {
    requestAnimationFrame(() => this._animate());
    if (this._tabHidden) return;
    const rawDt = Math.min(this.clock.getDelta(), 0.05);
    const dt = rawDt * this.simSpeed;
    this.simTime += dt;
    const elapsed = this.simTime;

    // 🌅 SMOOTH DAY -> SUNSET -> NIGHT SKY CROSSFADE
    if (this.skyTransition.active) {
      this.skyTransition.timer += rawDt;
      const p = Math.min(1, this.skyTransition.timer / this.skyTransition.duration);
      const ease = p * p * (3 - 2 * p);
      this.scene.background.lerpColors(this.skyTransition.fromBg, this.skyTransition.toBg, ease);
      this.scene.fog.color.lerpColors(this.skyTransition.fromFog, this.skyTransition.toFog, ease);
      this.sunLight.color.lerpColors(this.skyTransition.fromSunCol, this.skyTransition.toSunCol, ease);
      this.sunLight.intensity = THREE.MathUtils.lerp(this.skyTransition.fromSunInt, this.skyTransition.toSunInt, ease);
      this.hemiLight.intensity = THREE.MathUtils.lerp(this.skyTransition.fromHemiInt, this.skyTransition.toHemiInt, ease);
      if (p >= 0.5 && !this.skyTransition.toggledNightProps) {
        this.skyTransition.toggledNightProps = true;
        this.timeOfDay = this.skyTransition.targetMode;
        this._applyNightEffects(this.timeOfDay === "night", this.timeOfDay);
      }
      if (p >= 1) {
        this.skyTransition.active = false;
      }
    }

    // 🚂 / 💎 / ✈️ DYNAMIC LIVE CHASE CAMS (Train 1, Train 2, Sheru Bhai VIP, Commercial Flight)
    if (this.chaseCam.active) {
      let targetObj = null;
      let backDist = 14;
      let upDist = 7.5;
      let sideOffset = 2.8;

      const pBoost = this._getWideDist(1.0);
      if (this.chaseCam.mode === "train1" && this.railwaySim?.train1Cars?.[0]) {
        targetObj = this.railwaySim.train1Cars[0];
        backDist = 22 * pBoost;
        upDist = 12 * pBoost;
        sideOffset = 9 * pBoost;
      } else if (this.chaseCam.mode === "train2" && this.railwaySim?.train2Cars?.[0]) {
        targetObj = this.railwaySim.train2Cars[0];
        backDist = 22 * pBoost;
        upDist = 12 * pBoost;
        sideOffset = -9 * pBoost;
      } else if (this.chaseCam.mode === "vip" && this.airportSim) {
        const dCar = this.airportSim.diamondCar;
        const wSheru = this.airportSim.walkingSheru;
        const dHeli = this.airportSim.diamondHeli;
        if (dCar?.userData?.seatedSheru?.visible) {
          targetObj = dCar;
          backDist = 18 * pBoost;
          upDist = 10 * pBoost;
          sideOffset = 7 * pBoost;
        } else if (wSheru?.visible) {
          targetObj = wSheru;
          backDist = 15 * pBoost;
          upDist = 8.5 * pBoost;
          sideOffset = 7 * pBoost;
        } else if (dHeli) {
          targetObj = dHeli;
          backDist = 25 * pBoost;
          upDist = 12 * pBoost;
          sideOffset = 10 * pBoost;
        }
      } else if (this.chaseCam.mode === "flight" && this.airportSim?.plane) {
        targetObj = this.airportSim.plane;
        backDist = 36 * pBoost;
        upDist = 16 * pBoost;
        sideOffset = 14 * pBoost;
      } else if (this.chaseCam.mode === "rocket" && this.rocketSim?.rocket) {
        targetObj = this.rocketSim.rocket;
        backDist = 32 * pBoost;
        upDist = 14 * pBoost;
        sideOffset = 18 * pBoost;
      }

      if (targetObj) {
        const wPos = new THREE.Vector3();
        const wDir = new THREE.Vector3();
        targetObj.getWorldPosition(wPos);
        targetObj.getWorldDirection(wDir);
        const wRight = new THREE.Vector3(-wDir.z, 0, wDir.x).normalize();

        const desiredPos = wPos.clone()
          .addScaledVector(wDir, -backDist)
          .addScaledVector(wRight, sideOffset);
        desiredPos.y = Math.max(3.2, wPos.y + upDist);

        const alpha = 1 - Math.exp(-4.2 * rawDt);
        this.camera.position.lerp(desiredPos, alpha);
        const lookAtPos = wPos.clone().add(new THREE.Vector3(0, 1.5, 0));
        this.chaseCam.smoothTarget.lerp(lookAtPos, alpha);
        this.controls.target.copy(this.chaseCam.smoothTarget);
      }
    }

    // 📈 CITY GROWTH TIMELAPSE (Wave-by-Wave Day 1 -> Today + Sweeping Panorama Orbit!)
    if (this.timelapseState.active) {
      this.timelapseState.timer += rawDt;
      const orbitAng = this.timelapseState.timer * 0.22;
      const r = this._getWideDist((this.ringRadius || 48) * 1.65);
      this.camera.position.lerp(new THREE.Vector3(Math.cos(orbitAng) * r, r * 0.78, Math.sin(orbitAng) * r), 0.08);
      this.controls.target.lerp(new THREE.Vector3(0, 4, 0), 0.1);

      // Animate popping buildings smoothly back to scale.y = 1
      for (const s of this.timelapseState.savedVis) {
        if (s.grp.visible && s.grp.scale.y < 1) {
          s.grp.scale.y = Math.min(1, s.grp.scale.y + rawDt * 2.8);
        }
      }

      const stepDur = 2.2;
      const nextIdx = Math.min(this.timelapseState.days.length - 1, Math.floor(this.timelapseState.timer / stepDur));
      if (nextIdx > this.timelapseState.dayIdx) {
        this.timelapseState.dayIdx = nextIdx;
        const curDay = this.timelapseState.days[nextIdx];
        let shownCount = 0;
        for (const s of this.timelapseState.savedVis) {
          if (s.day <= curDay) {
            if (!s.grp.visible) {
              s.grp.visible = true;
              s.grp.scale.y = 0.08;
            }
            shownCount++;
          }
        }
        if (this.timelapseState.onStopChange) {
          this.timelapseState.onStopChange("📈 CITY GROWTH TIMELAPSE", `DAY ${curDay} • ${shownCount} PLACES`);
        }
      }
      if (this.timelapseState.timer > this.timelapseState.days.length * stepDur + 2.2) {
        this.stopGrowthTimelapse();
      }
    }

    // ⏱️ 24-HOUR SKYLINE HYPERLAPSE (Morning -> Noon -> Sunset -> Starry Disco Night -> Dawn!)
    if (this.hyperlapse24h.active) {
      this.hyperlapse24h.timer += rawDt;
      const u = (this.hyperlapse24h.timer % this.hyperlapse24h.duration) / this.hyperlapse24h.duration;
      const ang = -0.6 + u * Math.PI * 1.4;
      const r = this._getWideDist((this.ringRadius || 48) * 1.55);
      this.camera.position.lerp(new THREE.Vector3(Math.cos(ang) * r, Math.max(72, r * 0.62), Math.sin(ang) * r), 0.08);
      this.controls.target.lerp(new THREE.Vector3(0, 8, 0), 0.08);

      const dayP = this._getSkyPreset("day");
      const sunP = this._getSkyPreset("sunset");
      const nitP = this._getSkyPreset("night");

      let a, b, f;
      let isNightNow = false;
      let modeNow = "day";
      if (u < 0.32) {
        a = dayP; b = sunP; f = u / 0.32;
        modeNow = f > 0.5 ? "sunset" : "day";
      } else if (u < 0.55) {
        a = sunP; b = nitP; f = (u - 0.32) / 0.23;
        isNightNow = f > 0.45;
        modeNow = isNightNow ? "night" : "sunset";
      } else if (u < 0.82) {
        a = nitP; b = nitP; f = 0;
        isNightNow = true;
        modeNow = "night";
      } else {
        a = nitP; b = dayP; f = (u - 0.82) / 0.18;
        isNightNow = f < 0.4;
        modeNow = isNightNow ? "night" : "day";
      }

      this.scene.background.lerpColors(new THREE.Color(a.bg), new THREE.Color(b.bg), f);
      this.scene.fog.color.lerpColors(new THREE.Color(a.fog), new THREE.Color(b.fog), f);
      this.sunLight.color.lerpColors(new THREE.Color(a.sunCol), new THREE.Color(b.sunCol), f);
      this.sunLight.intensity = THREE.MathUtils.lerp(a.sunInt, b.sunInt, f);
      this.hemiLight.intensity = THREE.MathUtils.lerp(a.hemiInt, b.hemiInt, f);

      if (this.timeOfDay !== modeNow) {
        this.timeOfDay = modeNow;
        this._applyNightEffects(isNightNow, modeNow);
      }
    }

    // 🪩 DISCO STATUE NIGHT CRANE OUTRO
    if (this.discoOutro.active) {
      this.discoOutro.timer += rawDt;
      const p = Math.min(1, this.discoOutro.timer / this.discoOutro.duration);
      const ease = p * p * (3 - 2 * p);
      const ang = 0.5 + ease * Math.PI * 1.5;
      const rad = this._getWideDist(THREE.MathUtils.lerp(18.0, 42.0, ease));
      const h = this._getWideDist(THREE.MathUtils.lerp(9.0, 30.0, ease));
      this.camera.position.lerp(new THREE.Vector3(Math.cos(ang) * rad, h, Math.sin(ang) * rad), 0.14);
      this.controls.target.lerp(new THREE.Vector3(0, THREE.MathUtils.lerp(6.8, 7.6, ease), 0), 0.14);
      if (p >= 1) this.stopDiscoOutro();
    }



    // 🚀 ISRO ROCKET LAUNCHPAD LIVE 24-SECOND COUNTDOWN -> IGNITION -> LIFTOFF CYCLE!
    if (this.lifeEnabled && this.rocketSim) {
      const rs = this.rocketSim;
      const cyc = elapsed % 24.0;
      rs.beaconMat.color.setHex(Math.floor(elapsed * 4) % 2 === 0 ? 0xef4444 : 0xfacc15);
      if (rs.radarDish) rs.radarDish.rotation.y = elapsed * 0.9;

      if (cyc < 7.0) {
        rs.rocket.position.set(0, rs.baseY, 0);
        rs.rocket.visible = true;
        rs.flameGroup.visible = false;
        for (const sp of rs.smokePuffs) sp.mesh.visible = false;
      } else if (cyc < 10.0) {
        const p = (cyc - 7.0) / 3.0;
        rs.rocket.visible = true;
        rs.rocket.position.set(Math.sin(elapsed * 45) * 0.08, rs.baseY, Math.cos(elapsed * 42) * 0.08);
        rs.flameGroup.visible = true;
        rs.flameGroup.scale.set(0.7 + p * 0.4, 0.5 + p * 0.7, 0.7 + p * 0.4);
        for (const sp of rs.smokePuffs) {
          sp.mesh.visible = true;
          const r = sp.baseR + p * 7.5;
          sp.mesh.position.set(Math.cos(sp.ang) * r, 2.2 + p * 2.5, Math.sin(sp.ang) * r);
          const sc = 0.7 + p * 1.4;
          sp.mesh.scale.set(sc, sc, sc);
        }
      } else if (cyc < 19.5) {
        const t = cyc - 10.0;
        const alt = rs.baseY + t * t * 2.25;
        rs.rocket.visible = alt < 185;
        rs.rocket.position.set(0, alt, 0);
        rs.flameGroup.visible = true;
        const flPulse = 1.0 + Math.sin(elapsed * 32) * 0.16;
        rs.flameGroup.scale.set(1.15, 1.35 * flPulse, 1.15);
        for (const sp of rs.smokePuffs) {
          const fade = Math.max(0, 1 - t / 4.2);
          sp.mesh.visible = fade > 0.05;
          const r = sp.baseR + 7.5 + t * 3.0;
          sp.mesh.position.set(Math.cos(sp.ang) * r, 4.2 + t * 1.8, Math.sin(sp.ang) * r);
          const sc = (2.0 + t * 0.4) * fade;
          sp.mesh.scale.set(sc, sc, sc);
        }
      } else {
        rs.rocket.position.set(0, rs.baseY, 0);
        rs.rocket.visible = true;
        rs.flameGroup.visible = false;
        for (const sp of rs.smokePuffs) sp.mesh.visible = false;
      }
    }

    // 🌉 RGB CABLE-STAYED SEA BRIDGE NEON CYCLING + BOBBING VIP ISLAND YACHT
    if (this.seaBridgeSim) {
      const sbs = this.seaBridgeSim;
      if (sbs.yacht && this.lifeEnabled) {
        sbs.yacht.position.y = 0.4 + Math.sin(elapsed * 1.8) * 0.16;
      }
      if (this.timeOfDay === "night" && this.lifeEnabled) {
        const pal = [0x22d3ee, 0xec4899, 0xfacc15, 0xa855f7, 0x38bdf8, 0x4ade80];
        const step = Math.floor(elapsed * 2.2);
        for (const c of sbs.rgbCables) {
          c.mat.color.setHex(pal[(step + c.idx) % pal.length]);
        }
        for (let i = 0; i < sbs.bridgeLights.length; i++) {
          sbs.bridgeLights[i].color.setHex(pal[(step + i) % pal.length]);
        }
      }
    }


    // 🏏 OUTSKIRTS INTERNATIONAL CRICKET STADIUM — LIVE UPDATING SCOREBOARD & PLAYERS!
    if (this.lifeEnabled && this.outskirtsStadiumSim) {
      const os = this.outskirtsStadiumSim;
      os.timer += rawDt;
      if (os.timer >= 3.8) {
        os.timer = 0;
        const outcomes = [
          { r: 6, txt: "MASSIVE SIX! 🔥" },
          { r: 4, txt: "BOUNDARY FOUR! ⚡" },
          { r: 1, txt: "SINGLE RUN" },
          { r: 2, txt: "QUICK TWO!" },
          { r: 0, txt: "DOT BALL" },
          { r: 6, txt: "SHERU SIXER! 🦁" }
        ];
        const pick = outcomes[Math.floor(Math.random() * outcomes.length)];
        os.runs += pick.r;
        os.balls++;
        if (os.balls >= 120) { os.runs = 148; os.wkts = 1; os.balls = 84; }
        os.drawScoreboard(os.runs, os.wkts, `${Math.floor(os.balls / 6)}.${os.balls % 6}`, pick.txt);
      }
      if (os.players && os.players.length >= 2) {
        os.players[0].position.y = 0.5 + Math.abs(Math.sin(elapsed * 3.5)) * 0.2;
        os.players[1].position.z = -5.2 + Math.sin(elapsed * 2.2) * 1.4;
      }
    }

    // 💄 BEAUTY PARLOUR SPARKLES & SHERU MANSION FOUNTAIN
    if (this.lifeEnabled && this.beautySparkles && this.beautySparkles.length > 0) {
      for (const bs of this.beautySparkles) {
        bs.group.position.y = 3.6 + Math.sin(elapsed * 2.8) * 0.32;
        for (let i = 0; i < bs.group.children.length; i++) bs.group.children[i].rotation.y = elapsed * 2.5 + i;
      }
    }
    if (this.lifeEnabled && this.seaBridgeSim && this.seaBridgeSim.mansionFountain) {
      this.seaBridgeSim.mansionFountain.scale.set(1, 0.88 + Math.sin(elapsed * 5.2) * 0.18, 1);
    }

    // 🎡 BEACHSIDE GIANT FERRIS WHEEL ROTATION (Cabins stay level/upright!)
    if (this.lifeEnabled && this.ferrisWheelSim) {
      const fws = this.ferrisWheelSim;
      fws.wheelRotor.rotation.x += dt * 0.34;
      const curAngle = fws.wheelRotor.rotation.x;
      for (const cab of fws.cabins) {
        cab.rotation.x = -curAngle;
      }
      if (this.timeOfDay === "night" && fws.neonRimMat) {
        const fPal = [0xec4899, 0x22d3ee, 0xfacc15, 0xa855f7];
        fws.neonRimMat.color.setHex(fPal[Math.floor(elapsed * 2.5) % fPal.length]);
      }
    }


    // 🎬 v36 6 BRAND-NEW PRO REEL MODES (Mega Reel, Mansion Glide, Sky Drop, Beach Sweep, Stadium Orbit, Hero 360°)
    if (this.cinemaReel && this.cinemaReel.active) {
      const cr = this.cinemaReel;
      cr.timer += rawDt;
      const t = cr.timer;
      const p = Math.min(1, t / cr.duration);
      const ease = p * p * (3 - 2 * p);
      const bx = this.beachX || -120;
      const isl = this.vipIslandPos || { x: bx - 122, z: -2 };
      const ht = this.hillTemplePos || { x: 44, z: -104 };
      const rk = this.rocketPadPos || { x: -104, z: 116 };
      const st = this.outskirtsStadiumPos || { x: 112, z: 116 };

      if (cr.mode === "mansion") {
        const camX = THREE.MathUtils.lerp(bx + 12, isl.x + 28, ease);
        const camY = THREE.MathUtils.lerp(20, 14, ease) + Math.sin(ease * Math.PI) * 5.0;
        const camZ = isl.z + Math.sin(ease * Math.PI * 1.15) * 26;
        const tgtX = THREE.MathUtils.lerp(isl.x + 32, isl.x - 4, ease);
        this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.11);
        this.controls.target.lerp(new THREE.Vector3(tgtX, 6.5, isl.z), 0.12);
      } else if (cr.mode === "skydrop") {
        const ft = cr.focusTarget;
        const dropEase = 1 - Math.pow(1 - p, 3);
        const ang = 0.6 + dropEase * 1.15;
        const rad = this._getWideDist(THREE.MathUtils.lerp(165, 28, dropEase));
        const h = this._getWideDist(THREE.MathUtils.lerp(135, 16, dropEase));
        this.camera.position.lerp(new THREE.Vector3(ft.x + Math.cos(ang) * rad, h, ft.z + Math.sin(ang) * rad), 0.16);
        this.controls.target.lerp(new THREE.Vector3(ft.x, ft.y + 1.5, ft.z), 0.16);
      } else if (cr.mode === "beach_sweep") {
        const camX = THREE.MathUtils.lerp(bx - 16, bx - 22, ease);
        const camY = THREE.MathUtils.lerp(24, 30, Math.sin(ease * Math.PI));
        const camZ = THREE.MathUtils.lerp(56, -34, ease);
        const tgtX = bx + 16;
        const tgtZ = THREE.MathUtils.lerp(42, -16, ease);
        this.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.11);
        this.controls.target.lerp(new THREE.Vector3(tgtX, 9.5, tgtZ), 0.12);
      } else if (cr.mode === "stadium") {
        const ang = 0.4 + ease * Math.PI * 1.35;
        const rad = this._getWideDist(THREE.MathUtils.lerp(56, 74, ease));
        const h = this._getWideDist(THREE.MathUtils.lerp(24, 42, ease));
        this.camera.position.lerp(new THREE.Vector3(st.x + Math.cos(ang) * rad, h, st.z + Math.sin(ang) * rad), 0.12);
        this.controls.target.lerp(new THREE.Vector3(st.x, 10.0, st.z - 4), 0.13);
      } else if (cr.mode === "hero360") {
        const ft = cr.focusTarget;
        const ang = ease * Math.PI * 2.0;
        const rad = this._getWideDist(30);
        const h = this._getWideDist(18 + Math.sin(ease * Math.PI) * 7);
        this.camera.position.lerp(new THREE.Vector3(ft.x + Math.cos(ang) * rad, h, ft.z + Math.sin(ang) * rad), 0.15);
        this.controls.target.lerp(new THREE.Vector3(ft.x, ft.y + 1.5, ft.z), 0.16);
      } else if (cr.mode === "mega") {
        let camPos = null;
        let lookAt = null;
        if (t < 4.0) {
          const u = t / 4.0;
          const de = 1 - Math.pow(1 - u, 3);
          const a = 0.6 + de * 0.9;
          const r = this._getWideDist(THREE.MathUtils.lerp(135, 32, de));
          camPos = new THREE.Vector3(Math.cos(a) * r, this._getWideDist(THREE.MathUtils.lerp(110, 18, de)), Math.sin(a) * r);
          lookAt = new THREE.Vector3(0, 5.5, 0);
          if (cr.onBanner) cr.onBanner("MEGA UPDATE 🔥", "SHERU BHAI CITY 3D");
        } else if (t < 9.0) {
          const u = (t - 4.0) / 5.0;
          camPos = new THREE.Vector3(THREE.MathUtils.lerp(bx + 10, isl.x + 28, u), 18, isl.z + Math.sin(u * Math.PI) * 22);
          lookAt = new THREE.Vector3(THREE.MathUtils.lerp(isl.x + 24, isl.x - 4, u), 6.5, isl.z);
          if (cr.onBanner) cr.onBanner("ROYAL PALACE 👑", "SHERU BHAI ISLAND MANSION");
        } else if (t < 13.5) {
          if (!cr.switchedSunset) { cr.switchedSunset = true; this.transitionTimeOfDay("sunset", 2.0); }
          const u = (t - 9.0) / 4.5;
          const a = 0.8 + u * 1.5;
          const r = this._getWideDist(48);
          camPos = new THREE.Vector3(ht.x + Math.cos(a) * r, this._getWideDist(28), ht.z + Math.sin(a) * r);
          lookAt = new THREE.Vector3(ht.x, 19.5, ht.z - 2);
          if (cr.onBanner) cr.onBanner("DIVINE PEAK 🛕", "SACRED HILLTOP TEMPLE");
        } else if (t < 18.0) {
          const u = (t - 13.5) / 4.5;
          const rY = this.rocketSim && this.rocketSim.rocket && this.rocketSim.rocket.visible ? Math.min(85, this.rocketSim.rocket.position.y + 8) : 14;
          camPos = new THREE.Vector3(rk.x + 36, rY + 14, rk.z + THREE.MathUtils.lerp(28, -14, u));
          lookAt = new THREE.Vector3(rk.x, rY, rk.z);
          if (cr.onBanner) cr.onBanner("ISRO SPACEPORT 🚀", "LIVE ROCKET LAUNCHPAD");
        } else if (t < 22.0) {
          const u = (t - 18.0) / 4.0;
          const a = 0.5 + u * 1.2;
          const r = this._getWideDist(58);
          camPos = new THREE.Vector3(st.x + Math.cos(a) * r, this._getWideDist(28), st.z + Math.sin(a) * r);
          lookAt = new THREE.Vector3(st.x, 10, st.z - 4);
          if (cr.onBanner) cr.onBanner("LIVE CRICKET 🏏", "SHERU BHAI STADIUM");
        } else {
          if (!cr.switchedNight) {
            cr.switchedNight = true;
            this.transitionTimeOfDay("night", 1.8);
            this.setFireworksEnabled(true);
          }
          const u = (t - 22.0) / 6.0;
          const a = 0.7 + u * Math.PI * 1.45;
          const r = this._getWideDist(THREE.MathUtils.lerp(26, 62, u));
          camPos = new THREE.Vector3(Math.cos(a) * r, this._getWideDist(THREE.MathUtils.lerp(14, 44, u)), Math.sin(a) * r);
          lookAt = new THREE.Vector3(0, 6.0, 0);
          if (cr.onBanner) cr.onBanner("NIGHT DISCO + FIREWORKS 🎆", "STGAMES.ONLINE (LINK IN BIO)");
        }
        if (camPos && lookAt) {
          this.camera.position.lerp(camPos, 0.1);
          this.controls.target.lerp(lookAt, 0.12);
        }
      }

      if (p >= 1) this.stopCinemaReel();
    }

    // 🛕 SACRED HILLTOP TEMPLE CINEMA ORBIT CAM
    if (this.templeOrbit && this.templeOrbit.active) {
      this.templeOrbit.timer += rawDt;
      const p = Math.min(1, this.templeOrbit.timer / this.templeOrbit.duration);
      const ease = p * p * (3 - 2 * p);
      const ang = 0.7 + ease * Math.PI * 1.45;
      const rad = this._getWideDist(THREE.MathUtils.lerp(42, 62, ease));
      const h = this._getWideDist(THREE.MathUtils.lerp(24, 42, ease));
      const tx = this.hillTemplePos.x;
      const tz = this.hillTemplePos.z - 2;
      this.camera.position.lerp(new THREE.Vector3(tx + Math.cos(ang) * rad, h, tz + Math.sin(ang) * rad), 0.12);
      this.controls.target.lerp(new THREE.Vector3(tx, 19.5, tz), 0.14);
      if (p >= 1) this.stopTempleOrbit();
    }

    // 🌧️ MONSOON RAIN ANIMATION (Follows camera target cleanly!)
    if (this.rainEnabled && this.rainPoints && this.rainVel) {
      const posAttr = this.rainPoints.geometry.attributes.position;
      const arr = posAttr.array;
      const cx = this.controls.target.x;
      const cz = this.controls.target.z;
      this.rainPoints.position.set(cx, 0, cz);
      for (let i = 0; i < this.rainVel.length; i++) {
        arr[i * 3 + 1] -= this.rainVel[i] * rawDt;
        arr[i * 3] -= 5.0 * rawDt;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 82 + Math.random() * 6;
          arr[i * 3] = (Math.random() - 0.5) * 140;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 140;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 🎆 NIGHT SKY CELEBRATION FIREWORKS
    if (this.fireworksEnabled) {
      if (this.fireworkBursts.length < 4 && Math.random() < rawDt * 2.1) {
        this._spawnFireworkBurst();
      }
      for (let i = this.fireworkBursts.length - 1; i >= 0; i--) {
        const b = this.fireworkBursts[i];
        b.age += rawDt;
        if (b.age >= b.maxAge) {
          this._fwGroup.remove(b.points);
          b.points.geometry.dispose();
          b.points.material.dispose();
          this.fireworkBursts.splice(i, 1);
          continue;
        }
        const pAttr = b.points.geometry.attributes.position;
        const arr = pAttr.array;
        const v = b.vel;
        const count = v.length / 3;
        for (let k = 0; k < count; k++) {
          v[k * 3 + 1] -= 9.5 * rawDt;
          arr[k * 3] += v[k * 3] * rawDt;
          arr[k * 3 + 1] += v[k * 3 + 1] * rawDt;
          arr[k * 3 + 2] += v[k * 3 + 2] * rawDt;
        }
        pAttr.needsUpdate = true;
        b.points.material.opacity = Math.max(0, 1 - b.age / b.maxAge);
      }
    }

    // 🚶 STREET-LEVEL WALK POV
    if (this.streetWalk.active && this.streetWalk.curve) {
      this.streetWalk.t = (this.streetWalk.t + rawDt * this.streetWalk.speed) % 1;
      const pos = this.streetWalk.curve.getPointAt(this.streetWalk.t);
      const lookPt = this.streetWalk.curve.getPointAt((this.streetWalk.t + 0.03) % 1);
      const bobY = pos.y + Math.sin(this.clock.elapsedTime * 7.5) * 0.12;
      const alpha = 1 - Math.exp(-5.0 * rawDt);
      this.camera.position.lerp(new THREE.Vector3(pos.x, bobY, pos.z), alpha);
      this.streetWalk.smoothTarget.lerp(new THREE.Vector3(lookPt.x, 3.4, lookPt.z), alpha);
      this.controls.target.copy(this.streetWalk.smoothTarget);
    }

    // 🚁 PROFESSIONAL GIMBAL-STABILIZED CINEMATIC DRONE FLIGHT
    if (this.droneTour.active && this.droneTour.curve) {
      this.droneTour.t = (this.droneTour.t + dt * this.droneTour.speed) % 1;
      const pos = this.droneTour.curve.getPointAt(this.droneTour.t);
      const lookT = (this.droneTour.t + 0.024) % 1;
      const lookPt = this.droneTour.curve.getPointAt(lookT);

      // Frame-rate independent cinema gimbal damping (silky smooth on 30fps or 60fps phones!)
      const camAlpha = 1 - Math.exp(-3.4 * dt);
      const tgtAlpha = 1 - Math.exp(-2.8 * dt);
      this.camera.position.lerp(pos, camAlpha);

      const desiredTarget = new THREE.Vector3(lookPt.x, Math.max(4.0, lookPt.y - 9.5), lookPt.z);
      if (this.droneTour.smoothTarget) {
        this.droneTour.smoothTarget.lerp(desiredTarget, tgtAlpha);
        this.controls.target.copy(this.droneTour.smoothTarget);
      } else {
        this.controls.target.lerp(desiredTarget, tgtAlpha);
      }
    }

    // 🏗️ PRO CINEMA BUILD REEL CHOREOGRAPHER (Orbits smoothly around each building while it rises!)
    if (this.buildReelTour.active) {
      this.buildReelTour.timer += dt;
      const cur = this.buildReelTour.stops[this.buildReelTour.idx];
      if (cur && cur.orbitRadius > 0 && this.cameraGoal) {
        const ang = cur.orbitStartAng + this.buildReelTour.timer * cur.orbitSpeed;
        this.cameraGoal.camPos.set(
          cur.target.x + Math.cos(ang) * cur.orbitRadius,
          cur.orbitHeight,
          cur.target.z + Math.sin(ang) * cur.orbitRadius
        );
      }
      if (cur && this.buildReelTour.timer >= cur.duration) {
        this.buildReelTour.timer = 0;
        this.buildReelTour.idx++;
        if (this.buildReelTour.idx >= this.buildReelTour.stops.length) {
          this.stopBuildReelTour();
        } else {
          this._applyBuildReelStop(this.buildReelTour.idx);
        }
      }
    }

    if (this.proReelTour.active) {
      this.proReelTour.timer += dt;
      const cur = this.proReelTour.stops[this.proReelTour.idx];
      if (cur && this.proReelTour.timer >= cur.duration) {
        this.proReelTour.timer = 0;
        this.proReelTour.idx++;
        if (this.proReelTour.idx >= this.proReelTour.stops.length) {
          this.stopProReelTour();
        } else {
          this._applyTourStop(this.proReelTour.idx);
        }
      }
    }

    if (this.cameraGoal) {
      const spd = this.cameraGoal.speed || 0.1;
      this.controls.target.lerp(this.cameraGoal.target, spd);
      this.camera.position.lerp(this.cameraGoal.camPos, spd);
      if (!this.proReelTour.active && !this.buildReelTour.active && this.camera.position.distanceTo(this.cameraGoal.camPos) < 0.45) {
        this.cameraGoal = null;
      }
    }

    this.controls.autoRotate = this.autoSpin;
    if (this.autoSpin) this.controls.autoRotateSpeed = 1.6;

    const flash = Math.floor(elapsed * 5) % 2 === 0;
    this.sirenLights.forEach((s, idx) => {
      s.visible = idx % 2 === 0 ? flash : !flash;
    });

    if (this.lifeEnabled) {
      for (const sim of this.petrolSimulations) {
        const cycle = (elapsed + sim.phaseOffset) % 9.0;
        if (cycle < 2.2) {
          const p = cycle / 2.2;
          sim.vehicle.visible = true;
          sim.vehicle.position.set(-6.2 + (sim.pumpX + 6.2) * p, 0.1, sim.laneZ);
          sim.attendant.position.set(sim.attendantHomeX, 0.14, sim.attendantHomeZ);
        } else if (cycle < 5.6) {
          sim.vehicle.visible = true;
          sim.vehicle.position.set(sim.pumpX, 0.1, sim.laneZ);
          const stepT = Math.min(1, (cycle - 2.2) / 0.8);
          const targetZ = sim.laneZ + (sim.attendantHomeZ > sim.laneZ ? 0.75 : -0.75);
          sim.attendant.position.set(
            sim.pumpX,
            0.14 + Math.abs(Math.sin(elapsed * 9)) * 0.12,
            THREE.MathUtils.lerp(sim.attendantHomeZ, targetZ, stepT)
          );
          sim.attendant.rotation.y = sim.attendantHomeZ > sim.laneZ ? Math.PI : 0;
        } else if (cycle < 8.0) {
          const p = (cycle - 5.6) / 2.4;
          sim.vehicle.visible = true;
          sim.vehicle.position.set(sim.pumpX + (6.4 - sim.pumpX) * p, 0.1, sim.laneZ);
          sim.attendant.position.set(sim.attendantHomeX, 0.14, sim.attendantHomeZ);
        } else {
          sim.vehicle.visible = false;
          sim.attendant.position.set(sim.attendantHomeX, 0.14, sim.attendantHomeZ);
        }
      }

      // Helper to drive a vehicle smoothly along the real city road loop outside a 4-plot stand!
      // Local road rectangle around the 4-plot block & neighboring city street:
      // South road z = +9.5, East road x = +9.5 (or +28.5), North road z = -9.5, West road x = -9.5
      const driveCityRoadLoop = (mesh, progress, startX, startZ, loopW = 28.5, loopZ = 9.5) => {
        // 0.00 -> 0.10: Exit bay onto South Road (+9.5 Z)
        // 0.10 -> 0.35: Drive East along city road (+9.5 Z -> x = +loopW)
        // 0.35 -> 0.55: Turn North along city road (x = +loopW, z: +9.5 -> -9.5)
        // 0.55 -> 0.80: Drive West along city road (z = -9.5, x: +loopW -> -9.5)
        // 0.80 -> 0.92: Drive South back to South Road (x = -9.5, z: -9.5 -> +9.5)
        // 0.92 -> 1.00: Pull back into Stand Bay (startX, startZ)
        mesh.visible = true;
        if (progress < 0.1) {
          const t = progress / 0.1;
          mesh.position.set(startX, 0.08, THREE.MathUtils.lerp(startZ, loopZ, t));
          mesh.rotation.y = 0;
        } else if (progress < 0.35) {
          const t = (progress - 0.1) / 0.25;
          mesh.position.set(THREE.MathUtils.lerp(startX, loopW, t), 0.08, loopZ);
          mesh.rotation.y = Math.PI / 2;
        } else if (progress < 0.55) {
          const t = (progress - 0.35) / 0.2;
          mesh.position.set(loopW, 0.08, THREE.MathUtils.lerp(loopZ, -loopZ, t));
          mesh.rotation.y = Math.PI;
        } else if (progress < 0.8) {
          const t = (progress - 0.55) / 0.25;
          mesh.position.set(THREE.MathUtils.lerp(loopW, -9.5, t), 0.08, -loopZ);
          mesh.rotation.y = -Math.PI / 2;
        } else if (progress < 0.92) {
          const t = (progress - 0.8) / 0.12;
          mesh.position.set(-9.5, 0.08, THREE.MathUtils.lerp(-loopZ, loopZ, t));
          mesh.rotation.y = 0;
        } else {
          const t = (progress - 0.92) / 0.08;
          const midX = THREE.MathUtils.lerp(-9.5, startX, Math.min(1, t * 1.4));
          const midZ = THREE.MathUtils.lerp(loopZ, startZ, Math.max(0, (t - 0.4) / 0.6));
          mesh.position.set(midX, 0.08, midZ);
          mesh.rotation.y = t < 0.5 ? Math.PI / 2 : Math.PI;
        }
      };

      // LIVE APSRTC BUS STAND -> BOARD UNTIL FULL -> DRIVE OUT ONTO CITY ROADS!
      for (const bsim of this.busSimulations) {
        const cycle = (elapsed + bsim.phaseOffset) % 22.0; // 22-sec full city trip!
        if (cycle < 6.5) {
          // Bus parked in bay; passengers walk in one-by-one until bus is FULL!
          bsim.bus.visible = true;
          bsim.bus.position.set(bsim.bayX, 0.08, bsim.bayZ);
          bsim.bus.rotation.y = 0;
          bsim.passengers.forEach((pax, i) => {
            const walkProg = (cycle - i * 1.5) / 1.8;
            if (walkProg < 0) {
              pax.visible = true;
              pax.position.set(bsim.bayX - 1.1 + i * 1.0, 0.14, bsim.waitZ);
              pax.rotation.y = 0;
            } else if (walkProg < 1) {
              pax.visible = true;
              const px = THREE.MathUtils.lerp(bsim.bayX - 1.1 + i * 1.0, bsim.bayX + 0.7, walkProg);
              const pz = THREE.MathUtils.lerp(bsim.waitZ, bsim.bayZ + 1.2, walkProg);
              pax.position.set(px, 0.14 + Math.abs(Math.sin(elapsed * 10)) * 0.14, pz);
            } else {
              pax.visible = false; // Inside bus!
            }
          });
        } else {
          // Bus is FULL -> Drives OUT of Bus Stand onto City Roads and tours the city!
          bsim.passengers.forEach((pax) => (pax.visible = false));
          const roadProg = (cycle - 6.5) / 15.5;
          driveCityRoadLoop(bsim.bus, roadProg, bsim.bayX, bsim.bayZ, 28.5, 9.5);
        }
      }

      // LIVE TRANSPORT OFFICE & AUTO STAND -> PASSENGERS BOARD REAL AUTOS -> DRIVE OUT ONTO CITY ROADS!
      for (const asim of this.autoSimulations) {
        const cycle = (elapsed + asim.phaseOffset) % 20.0; // 20-sec full city passenger trip!
        if (cycle < 5.0) {
          // Auto parked at stand; passengers walk up and get INSIDE the open auto cabin!
          asim.auto.visible = true;
          asim.auto.position.set(asim.stopX, 0.08, asim.stopZ);
          asim.auto.rotation.y = 0;
          let boardedCount = 0;
          asim.passengers.forEach((pax, i) => {
            const walkProg = (cycle - i * 1.4) / 1.6;
            if (walkProg < 0) {
              pax.visible = true;
              pax.position.set(asim.waitX - 0.5 + i * 1.0, 0.14, asim.waitZ);
              pax.rotation.y = 0;
            } else if (walkProg < 1) {
              pax.visible = true;
              const px = THREE.MathUtils.lerp(asim.waitX - 0.5 + i * 1.0, asim.stopX, walkProg);
              const pz = THREE.MathUtils.lerp(asim.waitZ, asim.stopZ - 0.3, walkProg);
              pax.position.set(px, 0.14 + Math.abs(Math.sin(elapsed * 10)) * 0.14, pz);
            } else {
              pax.visible = false;
              boardedCount++;
            }
          });
          if (asim.auto.userData.seatedPassengers) {
            asim.auto.userData.seatedPassengers.visible = boardedCount > 0;
          }
        } else {
          // Passengers seated inside -> Auto drives OUT of Auto Stand onto City Roads!
          asim.passengers.forEach((pax) => (pax.visible = false));
          if (asim.auto.userData.seatedPassengers) {
            asim.auto.userData.seatedPassengers.visible = true;
          }
          const roadProg = (cycle - 5.0) / 15.0;
          driveCityRoadLoop(asim.auto, roadProg, asim.stopX, asim.stopZ, 28.5, 9.5);
        }
      }

      for (const psim of this.policeSimulations) {
        const cycle = elapsed % 12.0;
        if (cycle < 2.5) {
          psim.car.position.set(4.2, 0.1, 3.8);
          psim.car.rotation.y = 0;
        } else if (cycle < 4.5) {
          const p = (cycle - 2.5) / 2.0;
          psim.car.position.set(4.2, 0.1, THREE.MathUtils.lerp(3.8, 8.6, p));
          psim.car.rotation.y = 0;
        } else if (cycle < 8.0) {
          const p = (cycle - 4.5) / 3.5;
          psim.car.position.set(THREE.MathUtils.lerp(4.2, -6.5, p), 0.1, 8.6);
          psim.car.rotation.y = -Math.PI / 2;
        } else if (cycle < 10.2) {
          const p = (cycle - 8.0) / 2.2;
          psim.car.position.set(THREE.MathUtils.lerp(-6.5, 4.2, p), 0.1, 8.6);
          psim.car.rotation.y = Math.PI / 2;
        } else {
          const p = (cycle - 10.2) / 1.8;
          psim.car.position.set(4.2, 0.1, THREE.MathUtils.lerp(8.6, 3.8, p));
          psim.car.rotation.y = Math.PI;
        }
      }

      for (const asim of this.ambulanceSimulations) {
        const cycle = elapsed % 14.0;
        if (cycle < 2.5) {
          const p = cycle / 2.5;
          asim.crashCar.visible = true;
          asim.hazardCone.visible = true;
          asim.patient.visible = true;
          asim.patient.position.set(4.8, 0.14, 7.6);
          asim.ambulance.position.set(-3.5, 0.1, THREE.MathUtils.lerp(4.0, 8.6, p));
          asim.ambulance.rotation.y = 0;
        } else if (cycle < 5.5) {
          const p = (cycle - 2.5) / 3.0;
          asim.ambulance.position.set(THREE.MathUtils.lerp(-3.5, 3.4, p), 0.1, 8.6);
          asim.ambulance.rotation.y = Math.PI / 2;
        } else if (cycle < 8.0) {
          const p = (cycle - 5.5) / 2.5;
          asim.ambulance.position.set(3.4, 0.1, 8.6);
          asim.ambulance.rotation.y = Math.PI / 2;
          asim.patient.position.set(
            THREE.MathUtils.lerp(4.8, 3.4, p),
            0.14 + Math.abs(Math.sin(elapsed * 8)) * 0.12,
            THREE.MathUtils.lerp(7.6, 8.6, p)
          );
          if (p > 0.85) asim.patient.visible = false;
        } else if (cycle < 11.2) {
          const p = (cycle - 8.0) / 3.2;
          asim.patient.visible = false;
          asim.ambulance.position.set(THREE.MathUtils.lerp(3.4, -3.5, p), 0.1, 8.6);
          asim.ambulance.rotation.y = -Math.PI / 2;
        } else {
          const p = (cycle - 11.2) / 2.8;
          asim.ambulance.position.set(-3.5, 0.1, THREE.MathUtils.lerp(8.6, 4.0, p));
          asim.ambulance.rotation.y = Math.PI;
          asim.crashCar.visible = p < 0.7;
          asim.hazardCone.visible = p < 0.7;
        }
      }

      if (this.postman) {
        const pm = this.postman;
        if (pm.stopTimer > 0) {
          pm.stopTimer -= dt;
          pm.letter.visible = true;
          pm.letter.position.y = 1.05 + Math.sin(elapsed * 12) * 0.18;
        } else {
          pm.letter.visible = false;
          pm.t = (pm.t + dt * 0.085) % 4;
          const side = Math.floor(pm.t);
          const f = pm.t - side;
          const L = pm.loopRadius;
          const posAlong = -L + f * (2 * L);

          if (side === 0) {
            pm.mesh.position.set(posAlong, 0.08, -L);
            pm.mesh.rotation.y = Math.PI / 2;
          } else if (side === 1) {
            pm.mesh.position.set(L, 0.08, posAlong);
            pm.mesh.rotation.y = 0;
          } else if (side === 2) {
            pm.mesh.position.set(-posAlong, 0.08, L);
            pm.mesh.rotation.y = -Math.PI / 2;
          } else {
            pm.mesh.position.set(-L, 0.08, -posAlong);
            pm.mesh.rotation.y = Math.PI;
          }
          if (Math.random() < 0.008) pm.stopTimer = 1.6;
        }
      }

      for (const a of this.landmarkActors) {
        const t = elapsed * a.speed + a.phase;
        if (a.mode === "patrol_x") {
          const offset = Math.sin(t) * a.range;
          a.mesh.position.set(a.baseX + offset, 0.14 + Math.abs(Math.sin(t * 4)) * 0.12, a.baseZ);
          a.mesh.rotation.y = Math.cos(t) >= 0 ? Math.PI / 2 : -Math.PI / 2;
        } else if (a.mode === "patrol_z") {
          const offset = Math.sin(t) * a.range;
          a.mesh.position.set(a.baseX, 0.14 + Math.abs(Math.sin(t * 4)) * 0.12, a.baseZ + offset);
          a.mesh.rotation.y = Math.cos(t) >= 0 ? 0 : Math.PI;
        } else if (a.mode === "orbit") {
          const nx = a.baseX + Math.cos(t) * a.range;
          const nz = a.baseZ + Math.sin(t) * a.range;
          a.mesh.position.set(nx, 0.24 + Math.abs(Math.sin(t * 5)) * 0.18, nz);
          a.mesh.rotation.y = -t;
        } else if (a.mode === "hop") {
          a.mesh.position.set(a.baseX, 0.24 + Math.abs(Math.sin(t)) * 0.18, a.baseZ);
          a.mesh.rotation.y = Math.PI / 2 + Math.sin(t * 0.5) * 0.3;
        } else if (a.mode === "guard") {
          a.mesh.position.set(a.baseX, 0.2, a.baseZ);
          a.mesh.rotation.y = Math.sin(t * 0.6) * 0.5;
        } else if (a.mode === "enter_z") {
          const cyc = (elapsed * a.speed + a.phase) % 1.0;
          if (cyc < 0.72) {
            const p = cyc / 0.72;
            a.mesh.visible = true;
            a.mesh.position.set(a.baseX, 0.14 + Math.abs(Math.sin(elapsed * 8 + a.phase * 6)) * 0.1, THREE.MathUtils.lerp(a.startZ, a.endZ, p));
            a.mesh.rotation.y = Math.PI; // Walking straight into entrance!
          } else {
            a.mesh.visible = false; // Inside the building!
          }
        } else if (a.mode === "clean_auto") {
          // Driver moves back and forth alongside the auto wiping it clean!
          const dz = Math.sin(t * 0.65) * a.range;
          a.mesh.position.set(a.baseX, 0.14 + Math.abs(Math.sin(t * 2.5)) * 0.08, a.baseZ + dz);
          a.mesh.rotation.y = a.baseX < -3.0 ? Math.PI / 2 : -Math.PI / 2;
        } else if (a.mode === "gym_run") {
          // Fast jogging bounce on gym treadmill!
          a.mesh.position.set(a.baseX, 0.4 + Math.abs(Math.sin(t)) * 0.18, a.baseZ);
          a.mesh.rotation.y = Math.PI;
        } else if (a.mode === "gym_lift") {
          // Rhythmic dumbbell curl & squat pump!
          a.mesh.position.set(a.baseX, 0.22 + Math.abs(Math.sin(t)) * 0.14, a.baseZ);
          a.mesh.rotation.y = Math.sin(t * 0.3) * 0.25;
        } else if (a.mode === "ball_x") {
          const bx = a.baseX + Math.sin(t) * a.range;
          const by = 0.35 + Math.abs(Math.cos(t * 2)) * 1.3;
          a.mesh.position.set(bx, by, a.baseZ);
        }
      }

      for (const v of this.vehicles) {
        if (v.horizontal) {
          v.mesh.position.x += v.dir * v.speed * dt;
          if (v.mesh.position.x > v.limit) v.mesh.position.x = -v.limit;
          if (v.mesh.position.x < -v.limit) v.mesh.position.x = v.limit;
        } else {
          v.mesh.position.z += v.dir * v.speed * dt;
          if (v.mesh.position.z > v.limit) v.mesh.position.z = -v.limit;
          if (v.mesh.position.z < -v.limit) v.mesh.position.z = v.limit;
        }
        const vx = v.mesh.position.x;
        const vz = v.mesh.position.z;
        let blocked = false;
        for (const z of this.blockedRoadZones) {
          if (vx >= z.minX && vx <= z.maxX && vz >= z.minZ && vz <= z.maxZ) {
            blocked = true;
            break;
          }
        }
        v.mesh.visible = !blocked;
      }

      for (const rv of this.ringVehicles) {
        const step = (rv.speed * dt) / (rv.lane * 2);
        rv.t = (rv.t + (rv.cw ? step : -step) + 4) % 4;
        const side = Math.floor(rv.t);
        const f = rv.t - side;
        const L = rv.lane;
        const posAlong = -L + f * (2 * L);

        if (side === 0) {
          rv.mesh.position.set(posAlong, 0.1, -L);
          rv.mesh.rotation.y = rv.cw ? Math.PI / 2 : -Math.PI / 2;
        } else if (side === 1) {
          rv.mesh.position.set(L, 0.1, posAlong);
          rv.mesh.rotation.y = rv.cw ? 0 : Math.PI;
        } else if (side === 2) {
          rv.mesh.position.set(-posAlong, 0.1, L);
          rv.mesh.rotation.y = rv.cw ? -Math.PI / 2 : Math.PI / 2;
        } else {
          rv.mesh.position.set(-L, 0.1, -posAlong);
          rv.mesh.rotation.y = rv.cw ? Math.PI : 0;
        }
      }

      for (const w of this.workers) {
        w.mesh.position.x += Math.cos(w.angle) * w.speed * dt;
        w.mesh.position.z += Math.sin(w.angle) * w.speed * dt;
        w.mesh.position.y = 0.1 + Math.abs(Math.sin(elapsed * 7 + w.phase)) * 0.14;
        w.mesh.rotation.y = -w.angle + Math.PI / 2;

        if (
          Math.abs(w.mesh.position.x) > w.limit ||
          Math.abs(w.mesh.position.z) > w.limit ||
          Math.random() < 0.008
        ) {
          w.angle += (Math.random() - 0.5) * 1.5;
          w.mesh.position.x = THREE.MathUtils.clamp(w.mesh.position.x, -w.limit, w.limit);
          w.mesh.position.z = THREE.MathUtils.clamp(w.mesh.position.z, -w.limit, w.limit);
        }
      }
    }

    for (let i = this.constructions.length - 1; i >= 0; i--) {
      const c = this.constructions[i];
      c.progress += dt * 0.42;
      const t = Math.min(1, c.progress);
      c.buildingObj.scale.y = 0.05 + 0.95 * t;
      c.siteWorkers.forEach((npc, idx) => {
        npc.position.y = 0.1 + Math.abs(Math.sin(c.progress * 18 + idx)) * 0.25;
        npc.rotation.y += dt * 3;
      });
      if (t >= 1) {
        c.plotGroup.remove(c.scaffold);
        c.siteWorkers.forEach((npc) => c.plotGroup.remove(npc));
        this.constructions.splice(i, 1);
      }
    }


    // ✈️ 20-ACRE INTERNATIONAL AIRPORT + 🦁💎 SHERU BHAI DIAMOND CAR & HELICOPTER LIVE SIMULATION
    if (this.lifeEnabled && this.airportSim) {
      const sim = this.airportSim;

      // Rotate ATC Tower Radar & Blink Aviation Beacon
      sim.radarGroup.rotation.y += dt * 1.8;
      sim.beacon.visible = Math.sin(elapsed * 6.0) > 0;

      // -------------------------------------------------------------
      // A. COMMERCIAL FLIGHT + SHUTTLE BUS + PASSENGER BOARDING (34s loop)
      // -------------------------------------------------------------
      const pCycle = elapsed % 34.0;
      const plane = sim.plane;
      const bus = sim.shuttleBus;

      if (pCycle < 4.5) {
        // Stage 1: Plane parked at boarding bay; Airport Shuttle Bus drives from Terminal to Plane stairs!
        const t = pCycle / 4.5;
        plane.position.set(-2.0, 0.08, -12.0);
        plane.rotation.set(0, 0, 0);

        bus.position.set(THREE.MathUtils.lerp(-19.5, -10.2, t), 0.08, THREE.MathUtils.lerp(-14.0, -10.5, t));
        bus.rotation.set(0, Math.PI / 2, 0);
        sim.planePassengers.forEach((p) => (p.visible = false));
      } else if (pCycle < 10.5) {
        // Stage 2: Passengers step out of Shuttle Bus -> Climb Boarding Stairs -> Go INSIDE Airplane!
        plane.position.set(-2.0, 0.08, -12.0);
        plane.rotation.set(0, 0, 0);

        const boardElapsed = pCycle - 4.5;
        bus.position.set(-10.2, 0.08, -10.5);
        bus.rotation.set(0, Math.PI / 2, 0);

        sim.planePassengers.forEach((pax, i) => {
          const wp = (boardElapsed - i * 0.72) / 2.2;
          if (wp < 0 || wp >= 1) {
            pax.visible = false;
          } else {
            pax.visible = true;
            if (wp < 0.35) {
              // Walk from shuttle bus door to bottom of stairs
              const s = wp / 0.35;
              pax.position.set(
                THREE.MathUtils.lerp(-8.8, -6.0, s),
                0.14 + Math.abs(Math.sin(elapsed * 12 + i)) * 0.1,
                THREE.MathUtils.lerp(-10.4, -9.8, s)
              );
              pax.rotation.y = Math.PI / 2;
            } else {
              // Climb UP the stairs straight inside the Airplane door!
              const s = (wp - 0.35) / 0.65;
              pax.position.set(
                THREE.MathUtils.lerp(-6.0, -2.8, s),
                THREE.MathUtils.lerp(0.2, 2.25, s) + Math.abs(Math.sin(elapsed * 14 + i)) * 0.08,
                -9.8
              );
              pax.rotation.y = Math.PI / 2;
            }
          }
        });
      } else if (pCycle < 15.0) {
        // Stage 3: Shuttle Bus returns to Terminal; Plane taxis onto Runway & Takes Off into the Sky!
        sim.planePassengers.forEach((p) => (p.visible = false));
        const t = (pCycle - 10.5) / 4.5;

        const busBackT = Math.min(1, t * 1.4);
        bus.position.set(THREE.MathUtils.lerp(-10.2, -19.5, busBackT), 0.08, THREE.MathUtils.lerp(-10.5, -14.0, busBackT));
        bus.rotation.set(0, -Math.PI / 2, 0);

        if (t < 0.4) {
          // Taxi South-East onto runway threshold (24, 34)
          const st = t / 0.4;
          const px = THREE.MathUtils.lerp(-2.0, 24.0, st);
          const pz = THREE.MathUtils.lerp(-12.0, 34.0, st);
          plane.position.set(px, 0.08, pz);
          plane.rotation.set(0, Math.atan2(26.0, 46.0), 0);
        } else {
          // Accelerate North down the 88-unit Runway & Climb smoothly into the Air!
          const st = (t - 0.4) / 0.6;
          const accel = st * st;
          const pz = THREE.MathUtils.lerp(34.0, -48.0, accel);
          const lift = st > 0.45 ? Math.pow((st - 0.45) / 0.55, 1.5) * 20.0 : 0;
          plane.position.set(24.0, 0.08 + lift, pz);
          plane.rotation.set(st > 0.4 ? -0.22 * Math.min(1, (st - 0.4) * 2.5) : 0, Math.PI, 0);
        }
      } else if (pCycle < 28.0) {
        // Stage 4: Commercial Airplane Flies High Around the ENTIRE CITY!
        sim.planePassengers.forEach((p) => (p.visible = false));
        bus.position.set(-19.5, 0.08, -14.0);
        bus.rotation.set(0, Math.PI / 2, 0);

        const ft = (pCycle - 15.0) / 13.0;
        const pos = sim.planeCityLoop.getPointAt(Math.min(0.999, ft));
        const ahead = sim.planeCityLoop.getPointAt(Math.min(1, ft + 0.015));
        plane.position.copy(pos);
        plane.lookAt(ahead.x + sim.ax, ahead.y, ahead.z);
        plane.rotateZ(0.24); // Graceful banking turn over the city!
      } else {
        // Stage 5: Final Approach, Smooth Runway Touchdown & Taxi Back to Boarding Bay!
        sim.planePassengers.forEach((p) => (p.visible = false));
        bus.position.set(-19.5, 0.08, -14.0);
        bus.rotation.set(0, Math.PI / 2, 0);

        const lt = (pCycle - 28.0) / 6.0;
        if (lt < 0.6) {
          // Approach from South (+58 Z) -> Touchdown & roll North along runway to (-30 Z)
          const st = lt / 0.6;
          const pz = THREE.MathUtils.lerp(58.0, -32.0, st);
          const alt = st < 0.45 ? THREE.MathUtils.lerp(24.0, 0.08, st / 0.45) : 0.08;
          plane.position.set(24.0, alt, pz);
          plane.rotation.set(st < 0.45 ? -0.08 : 0, Math.PI, 0);
        } else {
          // Taxi via North taxiway back to boarding bay (-2, -12)
          const st = (lt - 0.6) / 0.4;
          const px = THREE.MathUtils.lerp(24.0, -2.0, st);
          const pz = THREE.MathUtils.lerp(-32.0, -12.0, st);
          plane.position.set(px, 0.08, pz);
          plane.rotation.set(0, Math.atan2(-26.0, 20.0), 0);
        }
      }

      // -------------------------------------------------------------
      // B. SHERU BHAI (LION IN RICH CLOTHES & GOLD CHAINS)
      //    DIAMOND CAR -> INSIDE AIRPORT -> DIAMOND HELICOPTER -> CITY TOUR (34s loop)
      // -------------------------------------------------------------
      const sCycle = (elapsed + 2.0) % 34.0;
      const dCar = sim.diamondCar;
      const wSheru = sim.walkingSheru;
      const dHeli = sim.diamondHeli;
      let rotorSpeed = 2.0;

      if (sCycle < 6.0) {
        // Stage 1: Sheru Bhai arrives in Sparkling Diamond Car from City Highway -> INSIDE Airport next to Helipad!
        const t = sCycle / 6.0;
        const ease = 1 - Math.pow(1 - t, 2);
        dCar.position.set(THREE.MathUtils.lerp(-60.0, -16.0, ease), 0.08, THREE.MathUtils.lerp(18.0, 22.0, Math.max(0, (t - 0.55) / 0.45)));
        dCar.rotation.set(0, Math.PI / 2 - (t > 0.55 ? 0.18 : 0), 0);
        if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = true;

        wSheru.visible = false;
        dHeli.position.set(-1.0, 0.18, 24.0);
        dHeli.rotation.set(0, -Math.PI / 2, 0);
        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = false;
        rotorSpeed = 1.6;
      } else if (sCycle < 11.0) {
        // Stage 2: Sheru Bhai steps out of Diamond Car & walks along Red Carpet -> climbs INSIDE Diamond Helicopter!
        const t = (sCycle - 6.0) / 5.0;
        dCar.position.set(-16.0, 0.08, 22.0);
        dCar.rotation.set(0, Math.PI / 2 - 0.18, 0);
        if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = false;

        wSheru.visible = true;
        wSheru.position.set(
          THREE.MathUtils.lerp(-14.2, -2.5, t),
          0.16 + Math.abs(Math.sin(elapsed * 11)) * 0.14,
          THREE.MathUtils.lerp(22.4, 24.0, t)
        );
        wSheru.rotation.y = Math.PI / 2;

        dHeli.position.set(-1.0, 0.18, 24.0);
        dHeli.rotation.set(0, -Math.PI / 2, 0);
        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = false;
        rotorSpeed = 2.0 + t * 14.0; // Rotors spin up as Sheru Bhai approaches!
      } else if (sCycle < 14.5) {
        // Stage 3: Sheru Bhai INSIDE Diamond Helicopter -> Vertical Liftoff off VIP Helipad!
        const t = (sCycle - 11.0) / 3.5;
        dCar.position.set(-16.0, 0.08, 22.0);
        if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = false;
        wSheru.visible = false;

        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = true;
        dHeli.position.set(-1.0, THREE.MathUtils.lerp(0.18, 20.0, t * t * (3 - 2 * t)), 24.0);
        dHeli.rotation.set(0.12 * t, -Math.PI / 2, 0);
        rotorSpeed = 24.0;
      } else if (sCycle < 28.0) {
        // Stage 4: Sheru Bhai Flies Diamond Helicopter Around the ENTIRE CITY (swooping past Sheru Bhai Statue!)
        const ft = (sCycle - 14.5) / 13.5;
        dCar.position.set(-16.0, 0.08, 22.0);
        if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = false;
        wSheru.visible = false;
        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = true;

        const pos = sim.heliCityLoop.getPointAt(Math.min(0.999, ft));
        const ahead = sim.heliCityLoop.getPointAt(Math.min(1, ft + 0.018));
        dHeli.position.copy(pos);
        dHeli.lookAt(ahead.x + sim.ax, ahead.y, ahead.z);
        dHeli.rotateX(0.14); // Forward flight tilt!
        rotorSpeed = 26.0;
      } else if (sCycle < 31.0) {
        // Stage 5a: Diamond Helicopter descends softly onto VIP Helipad!
        const t = (sCycle - 28.0) / 3.0;
        dCar.position.set(-16.0, 0.08, 22.0);
        if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = false;
        wSheru.visible = false;
        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = true;

        dHeli.position.set(-1.0, THREE.MathUtils.lerp(20.0, 0.18, t), 24.0);
        dHeli.rotation.set(0, -Math.PI / 2, 0);
        rotorSpeed = 24.0 * (1 - t * 0.7);
      } else {
        // Stage 5b: Sheru Bhai walks back to Diamond Car & drives out toward City!
        const t = (sCycle - 31.0) / 3.0;
        dHeli.position.set(-1.0, 0.18, 24.0);
        dHeli.rotation.set(0, -Math.PI / 2, 0);
        if (dHeli.userData.seatedSheru) dHeli.userData.seatedSheru.visible = false;
        rotorSpeed = 3.0;

        if (t < 0.5) {
          const wt = t / 0.5;
          wSheru.visible = true;
          wSheru.position.set(
            THREE.MathUtils.lerp(-2.5, -14.2, wt),
            0.16 + Math.abs(Math.sin(elapsed * 11)) * 0.14,
            THREE.MathUtils.lerp(24.0, 22.4, wt)
          );
          wSheru.rotation.y = -Math.PI / 2;
          dCar.position.set(-16.0, 0.08, 22.0);
          if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = false;
        } else {
          const dtCar = (t - 0.5) / 0.5;
          wSheru.visible = false;
          if (dCar.userData.seatedSheru) dCar.userData.seatedSheru.visible = true;
          dCar.position.set(THREE.MathUtils.lerp(-16.0, -60.0, dtCar), 0.08, THREE.MathUtils.lerp(22.0, 18.0, dtCar));
          dCar.rotation.set(0, -Math.PI / 2, 0);
        }
      }

      // Spin Diamond Helicopter Main & Tail Rotors
      if (dHeli.userData.mainRotor) dHeli.userData.mainRotor.rotation.y += dt * rotorSpeed;
      if (dHeli.userData.tailRotor) dHeli.userData.tailRotor.rotation.x += dt * (rotorSpeed * 1.4);
    }



    // 🚂 DOUBLE-TRACK LIVE 3D TRAINS (Stopping at BOTH North Station & Opposite South Station + Mountain Tunnels!)
    if (this.lifeEnabled && this.railwaySim) {
      const rsim = this.railwaySim;

      const animateBoarding = (paxList, isStopped, stopElapsed, cycleTotal, pfZ, doorZ, faceRotY) => {
        if (isStopped) {
          paxList.forEach((pax, i) => {
            const wp = (stopElapsed - i * 0.62) / 1.8;
            if (wp < 0) {
              pax.visible = true;
              pax.position.set(-7.5 + i * 3.4, 0.95, pfZ);
              pax.rotation.y = faceRotY;
            } else if (wp < 1) {
              pax.visible = true;
              pax.position.set(
                -7.5 + i * 3.4,
                0.95 + Math.abs(Math.sin(elapsed * 12 + i)) * 0.12,
                THREE.MathUtils.lerp(pfZ, doorZ, wp)
              );
              pax.rotation.y = faceRotY;
            } else {
              pax.visible = false;
            }
          });
        } else {
          paxList.forEach((pax, i) => {
            pax.visible = cycleTotal > 10.0;
            pax.position.set(-7.5 + i * 3.4, 0.95, pfZ);
            pax.rotation.y = faceRotY;
          });
        }
      };

      const updateTwoStationTrain = (
        cycleOffset, curve, totalLen, northT, southT, cars,
        nPax, nPfZ, nDoorZ, nFace,
        sPax, sPfZ, sDoorZ, sFace
      ) => {
        const cycle = (elapsed + cycleOffset) % 44.0;
        const deltaNS = (southT - northT + 1.0) % 1.0;
        const deltaSN = 1.0 - deltaNS;

        let headT = northT;
        let atNorth = false;
        let atSouth = false;
        let stopClock = 0;

        // 0..5.5s: Stopped at North Station (SHERU BHAI JN)
        // 5.5..22.0s: Runs through Mountain Tunnel & City -> arrives at South Station!
        // 22.0..27.5s: Stopped at South Station (ARAKU SOUTH JN)
        // 27.5..44.0s: Runs through Opposite Mountain Tunnel -> returns to North Station!
        const easeSegment = (u) => {
          if (u < 0.1) return 0.05 * (u / 0.1) * (u / 0.1);
          if (u < 0.9) return 0.05 + ((u - 0.1) / 0.8) * 0.9;
          const b = (u - 0.9) / 0.1;
          return 0.95 + 0.05 * (1 - (1 - b) * (1 - b));
        };

        if (cycle < 5.5) {
          headT = northT;
          atNorth = true;
          stopClock = cycle;
        } else if (cycle < 22.0) {
          const u = (cycle - 5.5) / 16.5;
          headT = (northT + easeSegment(u) * deltaNS) % 1.0;
        } else if (cycle < 27.5) {
          headT = southT;
          atSouth = true;
          stopClock = cycle - 22.0;
        } else {
          const u = (cycle - 27.5) / 16.5;
          headT = (southT + easeSegment(u) * deltaSN) % 1.0;
        }

        const spacingT = 6.2 / Math.max(totalLen, 120);
        cars.forEach((car, idx) => {
          const carT = (headT - idx * spacingT + 1.0) % 1.0;
          const pos = curve.getPointAt(carT);
          const ahead = curve.getPointAt((carT + 0.008) % 1.0);
          car.position.set(pos.x, 0.18, pos.z);
          car.lookAt(ahead.x, 0.18, ahead.z);
        });

        animateBoarding(nPax, atNorth, stopClock, cycle, nPfZ, nDoorZ, nFace);
        animateBoarding(sPax, atSouth, stopClock, (cycle + 22.0) % 44.0, sPfZ, sDoorZ, sFace);
      };

      // Train 1 (Blue/Yellow WAP-7 Express — Track 1 Clockwise, stopping at North PF1 & South PF1!)
      updateTwoStationTrain(
        0.0, rsim.track1Curve, rsim.len1, rsim.stationT1, rsim.southT1, rsim.train1Cars,
        rsim.paxPF1, 4.6, 2.2, Math.PI,
        rsim.southPaxPF1, -4.6, -2.2, 0
      );

      // Train 2 (White/Orange Vande Bharat — Track 2 Counter-Clockwise, stopping at North PF2 & South PF2!)
      updateTwoStationTrain(
        22.0, rsim.track2Curve, rsim.len2, rsim.stationT2, rsim.southT2, rsim.train2Cars,
        rsim.paxPF2, -4.6, -2.2, 0,
        rsim.southPaxPF2, 4.6, 2.2, Math.PI
      );

      // Foot Overbridge Pedestrians on BOTH North & South Stations!
      if (rsim.bridgeWalker) {
        const bz = Math.sin(elapsed * 0.9) * 4.2;
        rsim.bridgeWalker.position.set(rsim.fobX, 4.86 + Math.abs(Math.sin(elapsed * 7)) * 0.1, bz);
        rsim.bridgeWalker.rotation.y = Math.cos(elapsed * 0.9) >= 0 ? 0 : Math.PI;
      }
      if (rsim.southBridgeWalker) {
        const bz2 = Math.cos(elapsed * 0.85) * 4.2;
        rsim.southBridgeWalker.position.set(rsim.fobX, 4.86 + Math.abs(Math.sin(elapsed * 7 + 1.2)) * 0.1, bz2);
        rsim.southBridgeWalker.rotation.y = -Math.sin(elapsed * 0.85) >= 0 ? 0 : Math.PI;
      }
    }

    // ⛰️💧 ARAKU VALLEY WATERFALLS, FLOWING RIVERS & MISTY MOUNTAIN CLOUDS ANIMATION
    if (this.lifeEnabled && this.arakuSim && (!this._perfThrottle || (this._animFrameTick % 2 === 0))) {
      for (const rib of this.arakuSim.waterRibbons) {
        const span = rib.maxY - rib.minY;
        const drop = ((elapsed * rib.speed + rib.phase * span) % span);
        rib.mesh.position.y = rib.maxY - drop;
      }
      for (const rip of this.arakuSim.riverRipples) {
        const u = (elapsed * rip.speed + rip.phase) % 1;
        const p = rip.curve.getPointAt(u);
        const tan = rip.curve.getTangentAt(u);
        rip.mesh.position.set(p.x, 0.14, p.z);
        rip.mesh.rotation.y = Math.atan2(tan.x, tan.z);
      }
      for (const mc of this.arakuSim.mistClouds) {
        const curAng = mc.ang + elapsed * mc.speed;
        mc.mesh.position.set(Math.cos(curAng) * mc.rad, mc.y + Math.sin(elapsed * 0.6 + mc.ang) * 1.4, Math.sin(curAng) * mc.rad);
      }
    }


    // 🎭🎬 8-PLOT MOVIE THEATER & IMAX NIGHT-SKY ROTATING DISCO BEAMS (Reflects High Into the Night Air!)
    if (this.theaterDiscos && this.theaterDiscos.length > 0) {
      const defaultPal = [0xec4899, 0x22d3ee, 0xfacc15, 0xa855f7, 0x4ade80, 0xef4444];
      const stepIdx = Math.floor(elapsed * 2.4);
      const isNightNow = this.timeOfDay === "night";

      for (const td of this.theaterDiscos) {
        if (td.nightGroup) td.nightGroup.visible = isNightNow;

        if (this.lifeEnabled && td.marqueeBulbs) {
          const chase = Math.floor(elapsed * 5.0);
          for (let i = 0; i < td.marqueeBulbs.length; i++) {
            td.marqueeBulbs[i].visible = !isNightNow || (i + chase) % 3 !== 0;
          }
        }

        if (isNightNow && this.lifeEnabled) {
          const pal = td.palette || defaultPal;
          for (let b = 0; b < td.skyBeams.length; b++) {
            const sb = td.skyBeams[b];
            sb.pivot.rotation.y = elapsed * 1.25 * sb.dir + b * 0.85;
            const tiltWave = sb.baseTilt + Math.sin(elapsed * 1.7 + b * 1.2) * 0.22;
            sb.cone.rotation.z = tiltWave;
            sb.core.rotation.z = tiltWave;
            if (sb.airHalo) {
              sb.airHalo.position.set(
                -Math.sin(tiltWave) * sb.beamH * 0.92,
                Math.cos(tiltWave) * sb.beamH * 0.92,
                0
              );
              const hScale = 0.85 + Math.abs(Math.sin(elapsed * 3.2 + b)) * 0.5;
              sb.airHalo.scale.set(hScale, hScale, 1);
            }

            const col = pal[(stepIdx + sb.colorIdx) % pal.length];
            sb.beamMat.color.setHex(col);
            sb.coreMat.color.setHex(col);
            if (sb.haloMat) sb.haloMat.color.setHex(col);
            sb.bulbMat.color.setHex(col);
            sb.beamMat.opacity = 0.32 + Math.abs(Math.sin(elapsed * 3.8 + b)) * 0.26;
          }
          if (td.pointLight) {
            td.pointLight.color.setHex(pal[stepIdx % pal.length]);
          }
        }
      }
    }

    // 🪩 SHERU BHAI STATUE NIGHT DISCO LIGHTS (Rotating Beams + RGB Color Cycling!)
    if (this.timeOfDay === "night" && this.discoGroup && this.discoGroup.visible) {
      const discoHex = [0xec4899, 0x22d3ee, 0x4ade80, 0xfacc15, 0xa855f7, 0xef4444];
      this.discoGroup.rotation.y = elapsed * 0.95;
      const stepIdx = Math.floor(elapsed * 2.2);
      for (let d = 0; d < this.discoCones.length; d++) {
        const dc = this.discoCones[d];
        const col = discoHex[(stepIdx + dc.colorIdx) % discoHex.length];
        dc.beamMat.color.setHex(col);
        dc.podMat.color.setHex(col);
        dc.beamMat.opacity = 0.24 + Math.abs(Math.sin(elapsed * 4.5 + d)) * 0.26;
      }
      if (this.discoRing) {
        this.discoRing.material.color.setHex(discoHex[stepIdx % discoHex.length]);
      }
      if (this.discoPointLight) {
        this.discoPointLight.color.setHex(discoHex[stepIdx % discoHex.length]);
      }
    }


    // 🚗🏖️ OUTSKIRTS-TO-BEACH HIGHWAY TRAFFIC & REAL PARK -> WALK TO BEACH -> TAKE CAR OUT CYCLE!
    if (this.lifeEnabled && this.beachHighwaySim) {
      const bhs = this.beachHighwaySim;

      // 1. Dedicated Beach Express Bus & Auto running between City Outskirts Road & Beachfront
      const busCycle = (elapsed * 0.085) % 1.0;
      if (busCycle < 0.45) {
        const p = busCycle / 0.45;
        bhs.beachBus.position.set(THREE.MathUtils.lerp(bhs.hwStartX, 28, p), 0.1, -2.2);
        bhs.beachBus.rotation.y = -Math.PI / 2;
      } else if (busCycle < 0.55) {
        bhs.beachBus.position.set(28, 0.1, THREE.MathUtils.lerp(-2.2, 2.2, (busCycle - 0.45) / 0.1));
        bhs.beachBus.rotation.y = 0;
      } else {
        const p = (busCycle - 0.55) / 0.45;
        bhs.beachBus.position.set(THREE.MathUtils.lerp(28, bhs.hwStartX, p), 0.1, 2.2);
        bhs.beachBus.rotation.y = Math.PI / 2;
      }

      const autoCycle = (elapsed * 0.11 + 0.45) % 1.0;
      if (autoCycle < 0.5) {
        bhs.beachAuto.position.set(THREE.MathUtils.lerp(bhs.hwStartX, 30, autoCycle / 0.5), 0.1, -1.8);
        bhs.beachAuto.rotation.y = -Math.PI / 2;
      } else {
        bhs.beachAuto.position.set(THREE.MathUtils.lerp(30, bhs.hwStartX, (autoCycle - 0.5) / 0.5), 0.1, 1.8);
        bhs.beachAuto.rotation.y = Math.PI / 2;
      }

      // 2. 3 Visitor Cars: Drive in from Outskirts -> Park -> People Walk to Golden Beach -> Chill -> Return -> Drive Out!
      for (const vc of bhs.visitorCars) {
        const cycleDur = 22.5;
        const t = (elapsed + vc.phase) % cycleDur;
        if (t < 4.5) {
          // Phase 1: Driving from City Outskirts Road straight into Beach Parking Bay
          const p = t / 4.5;
          vc.car.position.set(THREE.MathUtils.lerp(bhs.hwStartX, bhs.hwParkX, p), 0.16, THREE.MathUtils.lerp(-2.2, vc.slotZ, Math.min(1, p * 1.4)));
          vc.car.rotation.y = -Math.PI / 2;
          vc.boy.visible = false;
          vc.girl.visible = false;
        } else if (t < 8.5) {
          // Phase 2: Parked! People get out of the car & walk together onto the Golden Sand Beach!
          const p = (t - 4.5) / 4.0;
          vc.car.position.set(bhs.hwParkX, 0.16, vc.slotZ);
          vc.car.rotation.y = -Math.PI / 2;
          vc.boy.visible = true;
          vc.girl.visible = true;
          const wx = THREE.MathUtils.lerp(bhs.hwParkX - 2.2, bhs.sandX, p);
          const bob = Math.abs(Math.sin(elapsed * 8.5)) * 0.12;
          vc.boy.position.set(wx, 0.16 + bob, vc.slotZ - 0.45);
          vc.girl.position.set(wx, 0.16 + bob, vc.slotZ + 0.45);
          vc.boy.rotation.y = -Math.PI / 2;
          vc.girl.rotation.y = -Math.PI / 2;
        } else if (t < 13.5) {
          // Phase 3: Enjoying the Golden Beach & Ocean Waves!
          vc.car.position.set(bhs.hwParkX, 0.16, vc.slotZ);
          vc.boy.visible = true;
          vc.girl.visible = true;
          const sway = Math.sin(elapsed * 1.8 + vc.phase) * 0.9;
          vc.boy.position.set(bhs.sandX, 0.16, vc.slotZ - 0.55 + sway);
          vc.girl.position.set(bhs.sandX + 0.3, 0.16, vc.slotZ + 0.55 + sway);
          vc.boy.rotation.y = -Math.PI / 2;
          vc.girl.rotation.y = -Math.PI / 2;
        } else if (t < 17.5) {
          // Phase 4: Walking back from Beach to their Parked Car!
          const p = (t - 13.5) / 4.0;
          vc.car.position.set(bhs.hwParkX, 0.16, vc.slotZ);
          vc.boy.visible = true;
          vc.girl.visible = true;
          const wx = THREE.MathUtils.lerp(bhs.sandX, bhs.hwParkX - 2.0, p);
          const bob = Math.abs(Math.sin(elapsed * 8.5)) * 0.12;
          vc.boy.position.set(wx, 0.16 + bob, vc.slotZ - 0.45);
          vc.girl.position.set(wx, 0.16 + bob, vc.slotZ + 0.45);
          vc.boy.rotation.y = Math.PI / 2;
          vc.girl.rotation.y = Math.PI / 2;
        } else {
          // Phase 5: Taking their Car OUT of Beach Parking & Driving Back to City Outskirts Road!
          const p = (t - 17.5) / 5.0;
          vc.boy.visible = false;
          vc.girl.visible = false;
          vc.car.position.set(THREE.MathUtils.lerp(bhs.hwParkX, bhs.hwStartX, p), 0.16, THREE.MathUtils.lerp(vc.slotZ, 2.2, Math.min(1, p * 1.8)));
          vc.car.rotation.y = Math.PI / 2;
        }
      }
    }

    // 🛕⛰️ SACRED HILLTOP TEMPLE: CLIMBING DEVOTEES + GHAT ROAD VEHICLES + RADIANT GOLDEN GLOWING EFFECTS!
    if (this.hillTempleSim) {
      const hts = this.hillTempleSim;
      // Radiant Golden Divine Aura & Rotating Sun-Halo (Always glowing, extra radiant at Sunset & Night!)
      const isNightGlow = this.timeOfDay === "night";
      if (hts.divineHalo) {
        hts.divineHalo.rotation.z = elapsed * 0.45;
        const s = 1.0 + Math.sin(elapsed * 2.2) * 0.08;
        hts.divineHalo.scale.set(s, s, 1);
      }
      if (hts.divineSkyBeam) {
        hts.divineSkyBeam.rotation.y = elapsed * 0.55;
        hts.divineSkyBeam.material.opacity = isNightGlow ? 0.48 + Math.sin(elapsed * 2.6) * 0.14 : 0.24 + Math.sin(elapsed * 2.0) * 0.06;
      }
      if (hts.divineAuraSphere) {
        const as = 0.96 + Math.sin(elapsed * 2.4) * 0.09;
        hts.divineAuraSphere.scale.set(as, as, as);
      }

      if (this.lifeEnabled) {
        // 10 Devotees Climbing Up & Descending the 48 Mountain Steps!
        for (const dv of hts.devotees) {
          const frac = (elapsed * dv.speed + dv.phase) % 1.0;
          const u = dv.goingUp ? frac : (1.0 - frac);
          const py = 0.45 + u * (hts.stepTopY - 0.45) + Math.abs(Math.sin(elapsed * 9.0 + dv.phase * 10)) * 0.14;
          const pz = THREE.MathUtils.lerp(hts.stepStartZ, hts.stepEndZ, u);
          dv.mesh.position.set(dv.laneX, py, pz);
          dv.mesh.rotation.y = dv.goingUp ? Math.PI : 0;
        }

        // Vehicles Driving from Main Road Up & Down the Winding Mountain Ghat Road!
        for (const gv of hts.ghatVehicles) {
          const cyc = (elapsed * gv.speed + gv.phase) % 2.0;
          const u = cyc < 1.0 ? cyc : (2.0 - cyc);
          const pt = hts.ghatCurve.getPointAt(u);
          const lookU = cyc < 1.0 ? Math.min(1.0, u + 0.025) : Math.max(0.0, u - 0.025);
          const lpt = hts.ghatCurve.getPointAt(lookU);
          gv.mesh.position.set(pt.x, pt.y + 0.18, pt.z);
          gv.mesh.lookAt(lpt.x, lpt.y + 0.18, lpt.z);
        }
      }
    }

    // 🏖️ Animated Rolling Ocean Waves & Chilling Sheru Bhai on the Beach
    if (this.lifeEnabled && this.beachSim) {
      for (const w of this.beachSim.waveStrips) {
        const waveCycle = (elapsed * 0.65 + w.phase) % 1;
        w.mesh.position.x = w.baseX + waveCycle * 6.5;
        w.mesh.scale.set(1.0 + Math.sin(waveCycle * Math.PI) * 0.4, 1, 1);
      }
      if (this.beachSim.chillingHead) {
        this.beachSim.chillingHead.rotation.y = Math.sin(elapsed * 0.9) * 0.22;
      }
    }

    // 🚘 Rotating Glass Car Turntable inside 8-Plot Audi Showroom
    if (this.lifeEnabled && this.turntableRotors.length > 0) {
      for (const tr of this.turntableRotors) {
        tr.mesh.rotation.y += dt * tr.speed;
      }
    }

    // 📸 Periodic Studio Softbox Camera Flash inside 2-Plot Photo Studios
    if (this.lifeEnabled && this.studioFlashes.length > 0) {
      for (const sf of this.studioFlashes) {
        const pulse = (elapsed * 0.7 + sf.phase) % 2.4;
        sf.mesh.visible = pulse < 0.18 || (pulse > 0.3 && pulse < 0.42);
      }
    }

    // Animated Water Fountain Jets at Sheru Bhai Lion Statue
    if (this.lifeEnabled && this.fountainJets.length > 0) {
      for (const jet of this.fountainJets) {
        const p = (elapsed * 1.4 + jet.phase) % 1;
        const rad = 1.8 + p * 2.1;
        const h = 0.65 + Math.sin(p * Math.PI) * 1.65;
        jet.mesh.position.set(Math.cos(jet.ang) * rad, h, Math.sin(jet.ang) * rad);
      }
    }

    // Soft Drifting Sky Clouds (Day / Sunset)
    if (this.lifeEnabled && this.skyClouds.length > 0 && this.timeOfDay !== "night") {
      for (const cl of this.skyClouds) {
        cl.mesh.position.x += cl.speed * dt;
        if (cl.mesh.position.x > 160) cl.mesh.position.x = -160;
      }
    }

    // 🎨 UPDATE GLSL GPU SHADERS (Ocean Wave Ripples & Camera-Centered Atmospheric Sky Dome)
    if (this.oceanShader && this.lifeEnabled) {
      this.oceanShader.uniforms.uTime.value = elapsed;
    }
    if (this.skyDome) {
      this.skyDome.mesh.position.copy(this.camera.position);
    }

    // ⚡ SMART AUTO-FPS SMOOTH GOVERNOR + COMPILED WEBASSEMBLY (WASM) ZERO-GC DISTANCE CULLING
    this._animFrameTick++;
    if (!this.hqMode) {
      this._fpsFrames++;
      this._fpsAccum += rawDt;
      if (this._fpsAccum >= 2.8) {
        const avgFps = this._fpsFrames / this._fpsAccum;
        if (avgFps < 20 && !this._perfThrottle) {
          this._perfThrottle = true;
          this.renderer.setPixelRatio(Math.max(1.05, (this.basePixelRatio || 1.35) * 0.8));
        } else if (avgFps > 38 && this._perfThrottle) {
          this._perfThrottle = false;
          this.renderer.setPixelRatio(this.basePixelRatio || 1.45);
        }
        this._fpsFrames = 0;
        this._fpsAccum = 0;
      }
    }

    this._cullAccum += rawDt;
    if (this._cullAccum > 0.25) {
      this._cullAccum = 0;
      const cx = this.camera.position.x;
      const cz = this.camera.position.z;
      const maxDistSq = this.hqMode
        ? 280 * 280
        : this.graphicsPreset === "smooth" || this._perfThrottle
        ? 105 * 105
        : this.isVeryLowRam
        ? 125 * 125
        : 185 * 185;

      if (this.wasmPerf) {
        this.wasmPerf.cullList(this.plotSigns, "sprite", cx, cz, maxDistSq);
      }

      if ((this.isLowRam || this.graphicsPreset === "smooth" || this._perfThrottle) && !this.hqMode && this._emptyPlotCoords.size > 0) {
        const emptyMaxSq = (this.graphicsPreset === "smooth" || this._perfThrottle) ? 160 * 160 : 215 * 215;
        const emptyArr = Array.from(this._emptyPlotCoords.values());
        if (this.wasmPerf) {
          this.wasmPerf.cullList(emptyArr, "grp", cx, cz, emptyMaxSq);
        }
      }
    }

    this.controls.update();

    // ☀️ Half-rate dynamic Sun Shadow Frustum (50% less GPU shadow cost — silky smooth 60fps!)
    if (this.shadowsEnabled && this.sunTarget && (this._animFrameTick % 2 === 0)) {
      const tx = this.controls.target.x;
      const tz = this.controls.target.z;
      this.sunTarget.position.set(tx, 0, tz);
      this.sunLight.position.set(tx + 85, 130, tz + 65);
      this.renderer.shadowMap.needsUpdate = true;
    }

    // ✨ Render with Neon Cinema Bloom Composer when enabled in Admin Reel Mode!
    if (this.bloomEnabled && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
};
