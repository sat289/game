import * as THREE from "three";

/**
 * 🎁 SHERU BHAI CITY — v47 SECRET PLACE GIVEAWAY SYSTEM
 * Spawns a glowing Golden Mystery Chest at any Admin-selected Secret Place.
 * Tapping the chest OR walking/driving up to it triggers `this.onGiveawayFound(cfg)`.
 */
export const v47GiveawayMethods = {
  _resolveGiveawayCoords(cfg) {
    const r = this.ringRadius || 90;
    const ax = this.airportX || (r + 58);
    const bx = this.beachX || -(r + 58);
    const st = this.outskirtsStadiumPos || { x: r + 38, z: r + 40 };
    const rk = this.rocketPadPos || { x: -(r + 38), z: r + 40 };
    const roadOffset = (this.BLOCK_STEP || 25) * 0.5;

    const place = cfg?.place || "vip_island";
    switch (place) {
      case "vip_island":
        return this.vipIslandPos
          ? { x: this.vipIslandPos.x + 10, y: 2.35, z: this.vipIslandPos.z + 6 }
          : { x: bx - 110, y: 2.35, z: 4 };
      case "temple_top":
        return { x: 0, y: 1.5, z: -(r + 36) };
      case "beach_ferris":
        return { x: bx + 8, y: 0.4, z: 24 };
      case "airport_runway":
        return { x: ax - 6, y: 0.4, z: -18 };
      case "rocket_pad":
        return { x: rk.x + 12, y: 0.4, z: rk.z - 8 };
      case "stadium_gate":
        return { x: st.x - 14, y: 0.4, z: st.z - 12 };
      case "ameerpet_metro":
        return { x: roadOffset + 5, y: 0.4, z: roadOffset + 5 };
      case "custom":
        return {
          x: Number(cfg.customX) || 0,
          y: 0.4,
          z: Number(cfg.customZ) || 20
        };
      default:
        return { x: 0, y: 0.4, z: 22 };
    }
  },

  setGiveawayConfig(cfg) {
    this.giveawayConfig = cfg || null;

    // Remove existing 3D chest if any
    if (this.giveawayChestGroup) {
      this.scene.remove(this.giveawayChestGroup);
      this.giveawayChestGroup = null;
    }
    this.plotHitboxes = this.plotHitboxes.filter((h) => h.userData.plotId !== "SECRET_GIVEAWAY");

    if (!cfg || !cfg.active) return;

    const isClaimed = Boolean(cfg.claimed) || ((cfg.claimedCount || 0) >= (cfg.maxClaims || 1));
    const pos = this._resolveGiveawayCoords(cfg);

    const g = new THREE.Group();
    g.position.set(pos.x, pos.y, pos.z);

    // Pedestal glowing ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: isClaimed ? 0x64748b : 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.4, 2.2, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    g.add(ring);

    // Golden Mystery Gift Box / Chest
    const chest = new THREE.Group();
    const boxBody = new THREE.Mesh(
      this._boxGeo(2.0, 1.4, 1.5),
      isClaimed ? this.mat.plinthGrey : this.mat.mansionGoldTrim
    );
    boxBody.position.y = 0.85;
    const lid = new THREE.Mesh(
      this._boxGeo(2.15, 0.36, 1.65),
      isClaimed ? this.mat.concrete : this.mat.oyoRed
    );
    lid.position.y = 1.68;
    const ribbon1 = new THREE.Mesh(this._boxGeo(0.32, 1.65, 1.7), this.mat.mansionWarmGlow);
    ribbon1.position.y = 1.05;
    const ribbon2 = new THREE.Mesh(this._boxGeo(2.2, 1.65, 0.32), this.mat.mansionWarmGlow);
    ribbon2.position.y = 1.05;
    chest.add(boxBody, lid, ribbon1, ribbon2);
    g.add(chest);

    // Subtle glowing light beam so players can spot it when close
    if (!isClaimed) {
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 1.1, 9.0, 12, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0.24,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      beam.position.y = 4.6;
      g.add(beam);
    }

    // Floating label above the secret chest
    const label = this._createNameSign(
      isClaimed ? "🏆 GIVEAWAY CLAIMED" : "🎁 SECRET GIVEAWAY",
      isClaimed ? "WINNER FOUND!" : "TAP TO CLAIM CODE!",
      !isClaimed
    );
    label.position.set(0, 3.8, 0);
    g.add(label);

    // Clickable hitbox
    const hitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.6, 4.5, 10),
      this.mat.invisibleHitbox
    );
    hitbox.position.y = 2.25;
    hitbox.userData.plotId = "SECRET_GIVEAWAY";
    g.add(hitbox);
    this.plotHitboxes.push(hitbox);

    g.userData.chest = chest;
    g.userData.pos = pos;
    this.scene.add(g);
    this.giveawayChestGroup = g;
    this._giveawayNearTriggered = false;
  },

  _updateGiveawayChest(dt, elapsed) {
    if (!this.giveawayChestGroup) return;
    const chest = this.giveawayChestGroup.userData.chest;
    if (chest) {
      chest.rotation.y += dt * 1.4;
      chest.position.y = Math.sin(elapsed * 3.2) * 0.22;
    }

    // Auto-open claim popup if player walks or drives right up to the Secret Chest!
    if (this.playerRoam && this.playerRoam.active && this.giveawayConfig && this.giveawayConfig.active) {
      const p = this.giveawayChestGroup.position;
      const dist = Math.hypot(this.playerRoam.pos.x - p.x, this.playerRoam.pos.z - p.z);
      if (dist < 6.5 && !this._giveawayNearTriggered) {
        this._giveawayNearTriggered = true;
        if (typeof this.onGiveawayFound === "function") {
          this.onGiveawayFound(this.giveawayConfig);
        }
      } else if (dist > 11.0) {
        this._giveawayNearTriggered = false;
      }
    }
  }
};
