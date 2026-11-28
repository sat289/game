import * as THREE from "three";

/**
 * 🎁 SHERU BHAI CITY — v48 SECRET PLACE GIVEAWAY SYSTEM
 * - Fixes Temple Top & Landmark heights so the Golden Chest is NEVER buried underground!
 * - Supports Manual Drag / Tap Placement anywhere on the 3D Map in Admin Mode (`setGiveawayDragPreview`)!
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
        // Placed cleanly on the front terrace of Hilltop Temple Mountain (visible above the hill!)
        return { x: 0, y: 24.5, z: -(r + 42) };
      case "beach_ferris":
        return { x: bx + 8, y: 0.45, z: 24 };
      case "airport_runway":
        return { x: ax - 6, y: 0.45, z: -18 };
      case "rocket_pad":
        return { x: rk.x + 12, y: 0.45, z: rk.z - 8 };
      case "stadium_gate":
        return { x: st.x - 14, y: 0.45, z: st.z - 12 };
      case "ameerpet_metro":
        return { x: roadOffset + 5, y: 0.45, z: roadOffset + 5 };
      case "custom":
        return {
          x: Number(cfg.customX) || 0,
          y: Number(cfg.customY) || 0.45,
          z: Number(cfg.customZ) || 20
        };
      default:
        return { x: 0, y: 0.45, z: 22 };
    }
  },

  setGiveawayConfig(cfg) {
    this.giveawayConfig = cfg || null;

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

    const ringMat = new THREE.MeshBasicMaterial({
      color: isClaimed ? 0x64748b : 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.5, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    g.add(ring);

    const chest = new THREE.Group();
    const boxBody = new THREE.Mesh(
      this._boxGeo(2.2, 1.5, 1.65),
      isClaimed ? this.mat.plinthGrey : this.mat.mansionGoldTrim
    );
    boxBody.position.y = 0.9;
    const lid = new THREE.Mesh(
      this._boxGeo(2.35, 0.38, 1.8),
      isClaimed ? this.mat.concrete : this.mat.oyoRed
    );
    lid.position.y = 1.78;
    const ribbon1 = new THREE.Mesh(this._boxGeo(0.34, 1.75, 1.85), this.mat.mansionWarmGlow);
    ribbon1.position.y = 1.1;
    const ribbon2 = new THREE.Mesh(this._boxGeo(2.4, 1.75, 0.34), this.mat.mansionWarmGlow);
    ribbon2.position.y = 1.1;
    chest.add(boxBody, lid, ribbon1, ribbon2);
    g.add(chest);

    if (!isClaimed) {
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 1.25, 11.0, 12, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          transparent: true,
          opacity: 0.26,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      beam.position.y = 5.6;
      g.add(beam);
    }

    const label = this._createNameSign(
      isClaimed ? "🏆 GIVEAWAY CLAIMED" : "🎁 SECRET GIVEAWAY",
      isClaimed ? "WINNER FOUND!" : "TAP TO CLAIM CODE!",
      !isClaimed
    );
    label.position.set(0, 4.2, 0);
    g.add(label);

    // Generous hitbox so tapping the chest OR its glowing label always works!
    const hitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.4, 6.2, 12),
      this.mat.invisibleHitbox
    );
    hitbox.position.y = 3.1;
    hitbox.userData.plotId = "SECRET_GIVEAWAY";
    g.add(hitbox);
    this.plotHitboxes.push(hitbox);

    g.userData.chest = chest;
    g.userData.pos = pos;
    this.scene.add(g);
    this.giveawayChestGroup = g;
    this._giveawayNearTriggered = false;
  },

  // Live Manual Drag/Tap Placement Helper for Admin!
  setGiveawayPlacementMode(enabled, onPointPicked = null) {
    this.giveawayPlacementMode = Boolean(enabled);
    this.onGiveawayPointPicked = onPointPicked;
    if (this.controls) {
      this.controls.enableRotate = !enabled;
    }
    if (enabled && !this.giveawayChestGroup) {
      this.setGiveawayConfig({ active: true, place: "custom", customX: 0, customY: 0.45, customZ: 20 });
    }
  },

  moveGiveawayPreviewTo(x, y, z) {
    if (!this.giveawayChestGroup) {
      this.setGiveawayConfig({ active: true, place: "custom", customX: x, customY: y, customZ: z });
    }
    if (this.giveawayChestGroup) {
      this.giveawayChestGroup.position.set(x, y, z);
    }
  },

  _updateGiveawayChest(dt, elapsed) {
    if (!this.giveawayChestGroup) return;
    const chest = this.giveawayChestGroup.userData.chest;
    if (chest) {
      chest.rotation.y += dt * 1.4;
      chest.position.y = Math.sin(elapsed * 3.2) * 0.22;
    }

    if (!this.giveawayPlacementMode && this.playerRoam && this.playerRoam.active && this.giveawayConfig && this.giveawayConfig.active) {
      const p = this.giveawayChestGroup.position;
      const dist = Math.hypot(this.playerRoam.pos.x - p.x, this.playerRoam.pos.z - p.z);
      if (dist < 6.8 && !this._giveawayNearTriggered) {
        this._giveawayNearTriggered = true;
        if (typeof this.onGiveawayFound === "function") {
          this.onGiveawayFound(this.giveawayConfig);
        }
      } else if (dist > 11.5) {
        this._giveawayNearTriggered = false;
      }
    }
  }
};
