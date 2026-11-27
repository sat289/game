// gun/index.js
// Master Real 3D Gun Arsenal, Pooled Bullet Tracers & Combat Engine (2GB RAM Zero-Lag!)
window.ApexGuns = window.ApexGuns || {};

window.ApexGuns.CATALOG = [
  { id: 'fist',    name: 'FISTS',    icon: '👊', mag: 0,  rpm: 180, dmg: 18, pellets: 1, spread: 0.0,   range: 2.5,  auto: false, recoil: 0.0  },
  { id: 'pistol',  name: 'GLOCK 19', icon: '🔫', mag: 15, rpm: 320, dmg: 28, pellets: 1, spread: 0.015, range: 65,   auto: false, recoil: 0.16 },
  { id: 'ak47',    name: 'AK-47',    icon: '💥', mag: 30, rpm: 560, dmg: 32, pellets: 1, spread: 0.025, range: 95,   auto: true,  recoil: 0.12 },
  { id: 'shotgun', name: 'M870',     icon: '🔥', mag: 8,  rpm: 78,  dmg: 22, pellets: 5, spread: 0.085, range: 36,   auto: false, recoil: 0.32 },
  { id: 'sniper',  name: 'AWM',      icon: '🎯', mag: 5,  rpm: 48,  dmg: 95, pellets: 1, spread: 0.002, range: 165,  auto: false, recoil: 0.38 },
  { id: 'smg',     name: 'MP5 SMG',  icon: '⚡', mag: 35, rpm: 760, dmg: 20, pellets: 1, spread: 0.036, range: 68,   auto: true,  recoil: 0.08 }
];

window.ApexGuns.createModel = function (id) {
  const fn = window.ApexGuns.models && window.ApexGuns.models[id];
  return typeof fn === 'function' ? fn() : null;
};

window.ApexGuns.Combat = (function () {
  const BULLET_POOL_SIZE = 24;
  const SPARK_POOL_SIZE = 12;
  let bullets = [];
  let sparks = [];
  let initialized = false;
  let equippedId = 'fist';
  let equippedMesh = null;
  let wristRopeMesh = null;
  let ammoMap = { pistol: 15, ak47: 30, shotgun: 8, sniper: 5, smg: 35 };
  let lastShotAt = 0;
  let reloadUntil = 0;
  let recoilKick = 0;
  let flashTimer = 0;

  function initPools(scene) {
    if (initialized || !scene) return;
    initialized = true;
    const bGeo = new THREE.BoxGeometry(0.055, 0.055, 0.85);
    const bMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    for (let i = 0; i < BULLET_POOL_SIZE; i++) {
      const m = new THREE.Mesh(bGeo, bMat);
      m.visible = false;
      scene.add(m);
      bullets.push({ mesh: m, active: false, vx: 0, vy: 0, vz: 0, life: 0, dmg: 20 });
    }
    const sGeo = new THREE.SphereGeometry(0.22, 6, 5);
    const sMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.9 });
    for (let i = 0; i < SPARK_POOL_SIZE; i++) {
      const m = new THREE.Mesh(sGeo, sMat);
      m.visible = false;
      scene.add(m);
      sparks.push({ mesh: m, active: false, life: 0 });
    }
  }

  function getSpec(id) {
    return window.ApexGuns.CATALOG.find((w) => w.id === (id || equippedId)) || window.ApexGuns.CATALOG[0];
  }

  function attachToAvatar(playerAvatar, gunId) {
    equippedId = gunId || 'fist';
    reloadUntil = 0;
    if (!playerAvatar || !playerAvatar.userData || !playerAvatar.userData.elbowR) return getSpec(equippedId);
    const handHost = playerAvatar.userData.elbowR;

    // Permanently attach sleek Rope Hero Wrist Grapple to Left Forearm!
    if (!wristRopeMesh && playerAvatar.userData.elbowL && window.ApexGuns.createModel) {
      wristRopeMesh = window.ApexGuns.createModel('rope_launcher');
      if (wristRopeMesh) {
        wristRopeMesh.position.set(0, -0.32, 0.02);
        wristRopeMesh.rotation.x = Math.PI / 2;
        wristRopeMesh.scale.setScalar(0.95);
        playerAvatar.userData.elbowL.add(wristRopeMesh);
      }
    }

    if (equippedMesh) {
      try { handHost.remove(equippedMesh); } catch (e) {}
      equippedMesh = null;
    }
    if (equippedId !== 'fist') {
      const m = window.ApexGuns.createModel(equippedId);
      if (m) {
        // Align gun cleanly inside playerAvatar's right hand pointing forward along hero facing!
        m.position.set(0.02, -0.40, 0.08);
        m.rotation.set(Math.PI / 2, 0, 0);
        m.scale.setScalar(1.22);
        handHost.add(m);
        equippedMesh = m;
      }
    }
    return getSpec(equippedId);
  }

  function startReload(now) {
    const spec = getSpec();
    if (spec.id === 'fist' || reloadUntil > now) return false;
    reloadUntil = now + 1150;
    if (window.ApexGunUtils) window.ApexGunUtils.playReload();
    return true;
  }

  function spawnSpark(x, y, z) {
    for (let i = 0; i < sparks.length; i++) {
      if (!sparks[i].active) {
        sparks[i].active = true;
        sparks[i].life = 0.20;
        sparks[i].mesh.position.set(x, y, z);
        sparks[i].mesh.scale.setScalar(1);
        sparks[i].mesh.visible = true;
        return;
      }
    }
  }

  function fire(scene, now, originX, originY, originZ, dirX, dirY, dirZ) {
    const spec = getSpec();
    if (spec.id === 'fist') return { fired: false, melee: true };
    if (reloadUntil > now) return { fired: false, reloading: true };
    const minInterval = 60000 / spec.rpm;
    if (now - lastShotAt < minInterval) return { fired: false, cooldown: true };

    if ((ammoMap[spec.id] || 0) <= 0) {
      startReload(now);
      return { fired: false, reloading: true };
    }

    initPools(scene);
    lastShotAt = now;
    ammoMap[spec.id] = Math.max(0, (ammoMap[spec.id] || spec.mag) - 1);
    recoilKick = spec.recoil;
    flashTimer = 0.055;
    if (equippedMesh && equippedMesh.userData && equippedMesh.userData.flash) {
      equippedMesh.userData.flash.visible = true;
      equippedMesh.userData.flash.rotation.z = Math.random() * Math.PI * 2;
    }
    if (window.ApexGunUtils) window.ApexGunUtils.playGunshot(spec.id);

    const bSpd = spec.id === 'sniper' ? 145 : (spec.id === 'shotgun' ? 88 : 112);
    for (let p = 0; p < spec.pellets; p++) {
      const slot = bullets.find((b) => !b.active);
      if (!slot) break;
      const spX = (Math.random() - 0.5) * spec.spread;
      const spY = (Math.random() - 0.5) * spec.spread;
      const spZ = (Math.random() - 0.5) * spec.spread;
      const vx = (dirX + spX) * bSpd;
      const vy = (dirY + spY) * bSpd;
      const vz = (dirZ + spZ) * bSpd;
      slot.active = true;
      slot.vx = vx; slot.vy = vy; slot.vz = vz;
      slot.life = spec.range / bSpd;
      slot.dmg = spec.dmg;
      slot.mesh.position.set(originX, originY, originZ);
      slot.mesh.lookAt(originX + vx, originY + vy, originZ + vz);
      slot.mesh.visible = true;
    }

    if (ammoMap[spec.id] === 0) startReload(now);
    return { fired: true, ammo: ammoMap[spec.id], mag: spec.mag, spec };
  }

  function update(dt, now, targets) {
    // Finish reload
    if (reloadUntil > 0 && now >= reloadUntil) {
      const spec = getSpec();
      if (spec.mag > 0) ammoMap[spec.id] = spec.mag;
      reloadUntil = 0;
    }
    // Muzzle flash & recoil decay
    if (flashTimer > 0) {
      flashTimer -= dt;
      if (flashTimer <= 0 && equippedMesh && equippedMesh.userData && equippedMesh.userData.flash) {
        equippedMesh.userData.flash.visible = false;
      }
    }
    if (recoilKick > 0) recoilKick = Math.max(0, recoilKick - dt * 1.9);

    // Update impact sparks
    for (let i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      if (!sp.active) continue;
      sp.life -= dt;
      sp.mesh.scale.setScalar(1 + (0.20 - sp.life) * 5.5);
      if (sp.life <= 0) { sp.active = false; sp.mesh.visible = false; }
    }

    // Update pooled bullets & check hits on traffic cars, police & street targets!
    const hits = [];
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i];
      if (!b.active) continue;
      b.life -= dt;
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.position.z += b.vz * dt;
      if (b.life <= 0 || b.mesh.position.y < 0.05) {
        if (b.mesh.position.y < 0.05) spawnSpark(b.mesh.position.x, 0.12, b.mesh.position.z);
        b.active = false; b.mesh.visible = false;
        continue;
      }
      const bx = b.mesh.position.x, by = b.mesh.position.y, bz = b.mesh.position.z;

      // Check hit against Traffic Cars
      if (targets && targets.trafficCars) {
        for (let ti = 0; ti < targets.trafficCars.length; ti++) {
          const tc = targets.trafficCars[ti];
          if (!tc || !tc.mesh || tc.wrecked) continue;
          if (Math.hypot(bx - tc.mesh.position.x, bz - tc.mesh.position.z) < 2.2 && by < 2.5) {
            spawnSpark(bx, by, bz);
            b.active = false; b.mesh.visible = false;
            tc.hp = (tc.hp === undefined ? 100 : tc.hp) - b.dmg;
            hits.push({ type: 'traffic', obj: tc, fatal: tc.hp <= 0 });
            break;
          }
        }
        if (!b.active) continue;
      }

      // Check hit against Police Cars
      if (targets && targets.policeUnits) {
        for (let pi = 0; pi < targets.policeUnits.length; pi++) {
          const pu = targets.policeUnits[pi];
          if (!pu || !pu.mesh) continue;
          if (Math.hypot(bx - pu.mesh.position.x, bz - pu.mesh.position.z) < 2.3 && by < 2.6) {
            spawnSpark(bx, by, bz);
            b.active = false; b.mesh.visible = false;
            hits.push({ type: 'police', obj: pu });
            break;
          }
        }
        if (!b.active) continue;
      }

      // Check hit against Walking Humans
      if (targets && targets.walkingHumans) {
        for (let hi = 0; hi < targets.walkingHumans.length; hi++) {
          const hm = targets.walkingHumans[hi];
          if (!hm || !hm.mesh || hm.flying) continue;
          if (Math.hypot(bx - hm.mesh.position.x, bz - hm.mesh.position.z) < 1.15 && by < 2.2) {
            spawnSpark(bx, by, bz);
            b.active = false; b.mesh.visible = false;
            hits.push({ type: 'human', obj: hm, vx: b.vx, vz: b.vz });
            break;
          }
        }
      }
    }
    return hits;
  }

  return {
    attachToAvatar,
    fire,
    startReload,
    update,
    getEquippedId: () => equippedId,
    getSpec,
    getAmmo: (id) => ammoMap[id || equippedId] || 0,
    isReloading: (now) => reloadUntil > (now || performance.now()),
    getRecoil: () => recoilKick
  };
})();
