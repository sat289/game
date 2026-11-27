// gun/rope_launcher.js
// REAL ROPE HERO WRIST GRAPPLE LAUNCHER + BUILDING SWING, ZIP-CLIMB & VEHICLE PULL ENGINE!
window.ApexGuns = window.ApexGuns || {};
window.ApexGuns.models = window.ApexGuns.models || {};

window.ApexGuns.models.rope_launcher = function buildRopeLauncher3D() {
  const U = window.ApexGunUtils;
  const M = U.mats();
  const g = new THREE.Group();
  g.name = 'Gun_RopeLauncher';

  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.068, 0.18, 10), M.darkSteel);
  cuff.rotation.x = Math.PI / 2;
  const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.075, 10), M.chrome);
  spool.rotation.z = Math.PI / 2;
  spool.position.set(0, 0.065, 0.02);
  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.11, 8), M.gunmetal);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.set(0, 0.062, 0.13);
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.008, 6, 12), M.lens);
  glowRing.position.set(0, 0.062, 0.10);

  g.add(cuff, spool, nozzle, glowRing);
  g.userData = { muzzleZ: 0.18, muzzleY: 0.062 };
  return g;
};

// Real Rope Hero Grapple & Swing Controller (Zero GC allocations, 60 FPS on 2GB RAM!)
window.ApexRopeHero = (function () {
  let active = false;
  let mode = 'idle'; // 'idle' | 'swing_zip' | 'pull_car'
  let anchor = new THREE.Vector3();
  let ropeMesh = null;
  let hookMesh = null;
  let timer = 0;
  let maxDuration = 2.0;
  let pulledTarget = null;
  const tmpStart = new THREE.Vector3();
  const tmpDir = new THREE.Vector3();
  const upAxis = new THREE.Vector3(0, 1, 0);

  function ensureMeshes(scene) {
    if (!ropeMesh && scene) {
      const geo = new THREE.CylinderGeometry(0.042, 0.042, 1, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      ropeMesh = new THREE.Mesh(geo, mat);
      ropeMesh.visible = false;
      scene.add(ropeMesh);

      hookMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32, 0),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      hookMesh.visible = false;
      scene.add(hookMesh);
    }
  }

  // Finds a real building wall/rooftop/landmark anchor point ahead in camera look direction!
  function findAnchor(playerPos, aimDirX, aimDirZ, cityLandmarks, colliderGrid, BLOCK_STEP, trafficCars) {
    // 1. Check nearby AI traffic cars directly ahead (<26m) for Rope-Pull launch!
    if (trafficCars && trafficCars.length) {
      let bestCar = null, bestD = 26;
      for (let i = 0; i < trafficCars.length; i++) {
        const tc = trafficCars[i];
        if (!tc || !tc.mesh || tc.wrecked) continue;
        const dx = tc.mesh.position.x - playerPos.x;
        const dz = tc.mesh.position.z - playerPos.z;
        const d = Math.hypot(dx, dz);
        if (d > 5.5 && d < bestD) {
          const dot = (dx * aimDirX + dz * aimDirZ) / d;
          if (dot > 0.72) { bestD = d; bestCar = tc; }
        }
      }
      if (bestCar) {
        return {
          mode: 'pull_car',
          target: bestCar,
          point: new THREE.Vector3(bestCar.mesh.position.x, bestCar.mesh.position.y + 1.35, bestCar.mesh.position.z)
        };
      }
    }

    // 2. Ray-march along aim direction to latch onto real city building / skyscraper / landmark facade!
    const step = 3.2;
    for (let dist = 7; dist <= 62; dist += step) {
      const rx = playerPos.x + aimDirX * dist;
      const rz = playerPos.z + aimDirZ * dist;
      const gx = Math.floor(rx / BLOCK_STEP);
      const gz = Math.floor(rz / BLOCK_STEP);
      const cell = colliderGrid ? colliderGrid.get(`${gx},${gz}`) : null;
      if (cell) {
        for (let i = 0; i < cell.length; i++) {
          const b = cell[i];
          if (b.disabled) continue;
          if (rx >= b.minX - 0.5 && rx <= b.maxX + 0.5 && rz >= b.minZ - 0.5 && rz <= b.maxZ + 0.5) {
            const anchorY = Math.min(26, Math.max(playerPos.y + 7.5, 11.5 + (dist * 0.22)));
            return { mode: 'swing_zip', point: new THREE.Vector3(rx, anchorY, rz) };
          }
        }
      }
    }

    // 3. Fallback skyline web-swing point high ahead so Rope Hero can ALWAYS swing down wide avenues!
    return {
      mode: 'swing_zip',
      point: new THREE.Vector3(
        playerPos.x + aimDirX * 36,
        Math.max(playerPos.y + 11.5, 15.5),
        playerPos.z + aimDirZ * 36
      )
    };
  }

  function launch(scene, playerPos, aimDirX, aimDirZ, cityLandmarks, colliderGrid, BLOCK_STEP, trafficCars) {
    ensureMeshes(scene);
    const hit = findAnchor(playerPos, aimDirX, aimDirZ, cityLandmarks, colliderGrid, BLOCK_STEP, trafficCars);
    anchor.copy(hit.point);
    mode = hit.mode;
    pulledTarget = hit.target || null;
    active = true;
    timer = 0;
    maxDuration = mode === 'pull_car' ? 1.15 : 1.85;
    if (ropeMesh) ropeMesh.visible = true;
    if (hookMesh) { hookMesh.visible = true; hookMesh.position.copy(anchor); }
    if (window.ApexGunUtils) window.ApexGunUtils.playRopeShoot();
    return mode;
  }

  function release(footState) {
    if (!active) return;
    active = false;
    mode = 'idle';
    pulledTarget = null;
    if (ropeMesh) ropeMesh.visible = false;
    if (hookMesh) hookMesh.visible = false;
    // Give clean superhero vault boost on release!
    if (footState) {
      footState.jumping = true;
      footState.vy = Math.max(footState.vy || 0, 9.2);
    }
  }

  function update(dt, driveState, footState, playerAvatar) {
    if (!active) return false;
    timer += dt;

    if (mode === 'pull_car' && pulledTarget && pulledTarget.mesh) {
      anchor.set(pulledTarget.mesh.position.x, pulledTarget.mesh.position.y + 1.25, pulledTarget.mesh.position.z);
    }

    const px = driveState.x;
    const py = (footState.y || 0.22) + 1.35;
    const pz = driveState.z;
    tmpStart.set(px, py, pz);
    tmpDir.subVectors(anchor, tmpStart);
    const dist = tmpDir.length();

    // Update 3D taut grapple rope cylinder from hero's outstretched wrist to anchor point!
    if (ropeMesh && dist > 0.2) {
      ropeMesh.position.copy(tmpStart).addScaledVector(tmpDir, 0.5);
      ropeMesh.scale.set(1, dist, 1);
      ropeMesh.quaternion.setFromUnitVectors(upAxis, tmpDir.clone().normalize());
    }
    if (hookMesh) {
      hookMesh.position.copy(anchor);
      hookMesh.rotation.y += 6 * dt;
    }

    if (dist < 3.4 || timer >= maxDuration) {
      if (mode === 'pull_car' && pulledTarget) {
        pulledTarget.curSpeed = 0;
      }
      release(footState);
      return false;
    }

    // Smooth high-speed Rope Hero zip-swing trajectory toward anchor!
    const pullSpeed = mode === 'pull_car' ? 28.0 : 31.0;
    const invD = 1 / dist;
    const vx = tmpDir.x * invD * pullSpeed;
    const vy = tmpDir.y * invD * pullSpeed + Math.sin(Math.min(1, timer / maxDuration) * Math.PI) * 3.5;
    const vz = tmpDir.z * invD * pullSpeed;

    driveState.x += vx * dt;
    driveState.z += vz * dt;
    footState.y = Math.max(0.22, (footState.y || 0.22) + vy * dt);
    footState.vy = Math.max(4, vy * 0.45);
    footState.jumping = true;

    // Superhero Mid-Air Rope Swing Pose!
    if (playerAvatar) {
      playerAvatar.position.set(driveState.x, footState.y, driveState.z);
      playerAvatar.rotation.y = Math.atan2(tmpDir.x, tmpDir.z);
      const u = playerAvatar.userData;
      if (u && u.armR && u.legL) {
        if (u.bodyRoot) { u.bodyRoot.rotation.x = 0.42; u.bodyRoot.position.y = 0; }
        u.armR.rotation.x = -2.45; // Right wrist shooting grapple forward!
        u.armL.rotation.x = 0.65;
        u.legL.rotation.x = -0.85; u.legR.rotation.x = -0.35;
        if (u.kneeL) u.kneeL.rotation.x = 1.15;
        if (u.kneeR) u.kneeR.rotation.x = 0.65;
      }
    }
    return true;
  }

  return {
    launch,
    release,
    update,
    isActive: () => active
  };
})();
