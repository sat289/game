import * as THREE from "three";

/**
 * 🪙 IN-CITY 3D COIN RUSH MINI-GAME (v33)
 * Spawns 12 spinning glowing gold Sheru Bhai Coins across the City Roads, RGB Sea Bridge,
 * Beach Boulevard, Temple Road & Rocket Launchpad! Drive or walk through coins to score!
 */
export class CoinRushMiniGame {
  constructor(scene, audioFX) {
    this.scene = scene;
    this.audioFX = audioFX;
    this.active = false;
    this.score = 0;
    this.best = Number(localStorage.getItem("sheru_coin_best") || 0);
    this.timeLeft = 60;
    this.coins = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.onHudUpdate = null;
    this.onFinish = null;
    this._coinGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.24, 14);
    this._coinGeo.rotateX(Math.PI / 2);
    this._coinMat = new THREE.MeshPhongMaterial({
      color: 0xfacc15,
      emissive: 0x854d0e,
      specular: 0xffffff,
      shininess: 160
    });
    this._ringGeo = new THREE.RingGeometry(1.35, 1.65, 16);
    this._ringGeo.rotateX(-Math.PI / 2);
    this._ringMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
  }

  start(engine, onHudUpdate = null, onFinish = null) {
    this.stop();
    this.active = true;
    this.score = 0;
    this.timeLeft = 60;
    this.onHudUpdate = onHudUpdate;
    this.onFinish = onFinish;

    const step = engine.BLOCK_STEP || 19;
    const rr = engine.ringRadius || 48;
    const bx = engine.beachX || -(rr + 76);

    // 12 Curated Road-Safe Coin Locations across City, Beach, Sea Bridge & Temple Road!
    const spots = [
      { x: 0.5 * step, y: 1.5, z: rr - 14 },
      { x: 0.5 * step, y: 1.5, z: 0.5 * step },
      { x: -0.5 * step, y: 1.5, z: 0.5 * step },
      { x: -0.5 * step, y: 1.5, z: -0.5 * step },
      { x: 0.5 * step, y: 1.5, z: -0.5 * step },
      { x: 0, y: 1.5, z: rr },
      { x: -rr, y: 1.5, z: 0 },
      { x: bx + 42, y: 1.5, z: 0 },
      { x: bx + 20, y: 1.5, z: -2 },
      { x: bx - 30, y: 6.2, z: -2 },
      { x: bx - 72, y: 6.0, z: -2 },
      { x: engine.hillTemplePos.x, y: 1.6, z: engine.hillTemplePos.z + 28 }
    ];

    spots.forEach((pt, idx) => {
      const wrap = new THREE.Group();
      wrap.position.set(pt.x, pt.y, pt.z);
      const disc = new THREE.Mesh(this._coinGeo, this._coinMat);
      const halo = new THREE.Mesh(this._ringGeo, this._ringMat);
      halo.position.y = -1.25;
      wrap.add(disc, halo);
      this.group.add(wrap);
      this.coins.push({ mesh: wrap, baseY: pt.y, collected: false, phase: idx * 0.7 });
    });

    if (this.onHudUpdate) {
      this.onHudUpdate({ score: this.score, best: this.best, timeLeft: Math.ceil(this.timeLeft), total: this.coins.length });
    }
  }

  stop() {
    this.active = false;
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.coins = [];
  }

  update(dt, elapsed, driveState) {
    if (!this.active) return;

    this.timeLeft = Math.max(0, this.timeLeft - dt);
    const px = driveState && driveState.active ? driveState.pos.x : 99999;
    const pz = driveState && driveState.active ? driveState.pos.z : 99999;

    let remaining = 0;
    for (const c of this.coins) {
      if (c.collected) continue;
      remaining++;
      c.mesh.rotation.y = elapsed * 3.4 + c.phase;
      c.mesh.position.y = c.baseY + Math.sin(elapsed * 4.2 + c.phase) * 0.35;

      const dx = c.mesh.position.x - px;
      const dz = c.mesh.position.z - pz;
      if (dx * dx + dz * dz < 14.5) {
        c.collected = true;
        c.mesh.visible = false;
        this.score += 100;
        if (this.score > this.best) {
          this.best = this.score;
          try { localStorage.setItem("sheru_coin_best", String(this.best)); } catch {}
        }
        if (this.audioFX) this.audioFX.playDoorOpen();
        remaining--;
      }
    }

    if (this.onHudUpdate) {
      this.onHudUpdate({ score: this.score, best: this.best, timeLeft: Math.ceil(this.timeLeft), total: this.coins.length });
    }

    if (this.timeLeft <= 0 || remaining === 0) {
      const finalScore = this.score + Math.ceil(this.timeLeft) * 10;
      if (finalScore > this.best) {
        this.best = finalScore;
        try { localStorage.setItem("sheru_coin_best", String(this.best)); } catch {}
      }
      const cb = this.onFinish;
      this.stop();
      if (cb) cb({ score: finalScore, best: this.best, cleared: remaining === 0 });
    }
  }
}
