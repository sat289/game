import * as THREE from "three";

/**
 * 🚶‍♂️🛺🚗 SHERU BHAI CITY — v43 REAL-WORLD STREET LIFE MODULE
 * Separate lightweight module for:
 *  1. Metro Station Parking Plazas (Parked Cars, Autos & Bikes near every station)
 *  2. Walking Commuters / Pedestrians strolling sidewalks & entering/exiting Metro Stations
 *  3. Real-World Mixed Vehicles (Indian Autos, Sedans, City Buses) cruising wide city roads!
 */
export const v43StreetLifeMethods = {
  _buildStreetLifeSystem(ringRadius) {
    const grp = new THREE.Group();
    const pedList = [];
    const vehList = [];

    // Helper: Compact Indian Auto-Rickshaw (Yellow/Green)
    const makeAuto = () => {
      const a = new THREE.Group();
      const body = new THREE.Mesh(this._boxGeo(1.15, 0.95, 2.05), this.mat.autoGreen);
      body.position.y = 0.65;
      const top = new THREE.Mesh(this._boxGeo(1.18, 0.55, 1.85), this.mat.autoYellow);
      top.position.y = 1.38;
      const glass = new THREE.Mesh(this._boxGeo(0.95, 0.45, 0.12), this.mat.glass);
      glass.position.set(0, 1.15, 1.02);
      a.add(body, top, glass);
      return a;
    };

    // Helper: Compact Sedan Car
    const makeSedan = (colMat) => {
      const c = new THREE.Group();
      const base = new THREE.Mesh(this._boxGeo(1.65, 0.62, 3.35), colMat);
      base.position.y = 0.52;
      const cab = new THREE.Mesh(this._boxGeo(1.42, 0.54, 1.72), this.mat.glass);
      cab.position.set(0, 1.04, -0.1);
      c.add(base, cab);
      return c;
    };

    // 1. METRO STATION PARKING BAYS (Parked Autos & Cars neatly aligned along station curbs!)
    const stations = this.metroSim ? this.metroSim.stations : [];
    const carCols = [this.mat.audiWhite, this.mat.audiRed, this.mat.mobileBlue, this.mat.petrolYellow];

    stations.forEach((st, sIdx) => {
      // Place compact parking bay right along the station's road axis so it never touches houses
      const pBay = new THREE.Group();
      pBay.position.set(st.x, 0.06, st.z);
      pBay.rotation.y = st.yaw || 0;

      // Painted Parking Strip along road edge (x = +4.2 or -4.2 inside the 10.2–13.0 wide road!)
      const strip = new THREE.Mesh(this._boxGeo(2.4, 0.06, 11.5), this.mat.tarmacGrey);
      strip.position.set(4.1, 0.02, 0);
      pBay.add(strip);

      // 2 Parked Autos + 1 Parked Car in the station parking bay
      const auto1 = makeAuto();
      auto1.position.set(4.1, 0.06, -3.6);
      const auto2 = makeAuto();
      auto2.position.set(4.1, 0.06, -0.4);
      const car1 = makeSedan(carCols[sIdx % carCols.length]);
      car1.position.set(4.1, 0.06, 3.4);
      pBay.add(auto1, auto2, car1);

      // 3 Walking Commuters going to/from the Metro Station dropping steps!
      const shirtPool = [this.mat.wallWhite, this.mat.cinemaNeonCyan, this.mat.petrolYellow, this.mat.biryaniOrange];
      for (let p = 0; p < 3; p++) {
        const ped = this._createCharacter({
          shirtMat: shirtPool[(sIdx + p) % shirtPool.length],
          pantsMat: this.mat.navy,
          scale: 0.78
        });
        const side = p % 2 === 0 ? 2.75 : -2.75;
        const baseZ = -6 + p * 5;
        ped.position.set(side, 0.08, baseZ);
        pBay.add(ped);
        pedList.push({
          mesh: ped,
          side,
          minZ: -9.5,
          maxZ: 9.5,
          z: baseZ,
          dir: p % 2 === 0 ? 1 : -1,
          speed: 1.6 + (p * 0.35),
          phase: sIdx + p * 1.7
        });
      }

      grp.add(pBay);
    });

    // 2. REAL-WORLD CITY ROAD VEHICLES (Cruising along the wide Inner City Boulevards & Ring Road!)
    const roadZ1 = this.BLOCK_STEP * 0.5;
    const roadZ2 = -this.BLOCK_STEP * 0.5;
    const roadX1 = this.BLOCK_STEP * 0.5;
    const roadX2 = -this.BLOCK_STEP * 0.5;
    const span = Math.max(40, ringRadius - 4);

    const routes = [
      { axis: "x", fixed: roadZ1 + 2.4, dir:  1, kind: "auto" },
      { axis: "x", fixed: roadZ1 - 2.4, dir: -1, kind: "car"  },
      { axis: "x", fixed: roadZ2 + 2.4, dir:  1, kind: "car"  },
      { axis: "x", fixed: roadZ2 - 2.4, dir: -1, kind: "auto" },
      { axis: "z", fixed: roadX1 + 2.4, dir:  1, kind: "auto" },
      { axis: "z", fixed: roadX1 - 2.4, dir: -1, kind: "car"  },
      { axis: "z", fixed: roadX2 + 2.4, dir:  1, kind: "car"  },
      { axis: "z", fixed: roadX2 - 2.4, dir: -1, kind: "auto" }
    ];

    routes.forEach((rt, idx) => {
      for (let k = 0; k < 2; k++) {
        const mesh = rt.kind === "auto" ? makeAuto() : makeSedan(carCols[(idx + k) % carCols.length]);
        const startPos = -span + ((idx * 37 + k * span) % (span * 2));
        if (rt.axis === "x") {
          mesh.position.set(startPos, 0.08, rt.fixed);
          mesh.rotation.y = rt.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          mesh.position.set(rt.fixed, 0.08, startPos);
          mesh.rotation.y = rt.dir > 0 ? 0 : Math.PI;
        }
        grp.add(mesh);
        vehList.push({
          mesh,
          axis: rt.axis,
          fixed: rt.fixed,
          dir: rt.dir,
          pos: startPos,
          min: -span,
          max: span,
          speed: rt.kind === "auto" ? 8.5 + (k * 1.5) : 13.0 + (k * 2.0)
        });
      }
    });

    this.cityGroup.add(grp);
    this.streetLifeSim = { group: grp, peds: pedList, vehs: vehList };
  },

  _updateStreetLife(dt, elapsed) {
    if (!this.lifeEnabled || !this.streetLifeSim) return;
    const { peds, vehs } = this.streetLifeSim;

    for (let i = 0; i < peds.length; i++) {
      const p = peds[i];
      p.z += p.dir * p.speed * dt;
      if (p.z > p.maxZ) { p.z = p.maxZ; p.dir = -1; }
      if (p.z < p.minZ) { p.z = p.minZ; p.dir = 1; }
      p.mesh.position.z = p.z;
      p.mesh.position.y = 0.08 + Math.abs(Math.sin(elapsed * 6.5 + p.phase)) * 0.14;
      p.mesh.rotation.y = p.dir > 0 ? 0 : Math.PI;
    }

    for (let i = 0; i < vehs.length; i++) {
      const v = vehs[i];
      v.pos += v.dir * v.speed * dt;
      if (v.pos > v.max) v.pos = v.min;
      if (v.pos < v.min) v.pos = v.max;
      if (v.axis === "x") {
        v.mesh.position.x = v.pos;
      } else {
        v.mesh.position.z = v.pos;
      }
    }
  }
};
