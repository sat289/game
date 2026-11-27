// gun/pistol.js — Real 3D Glock 19 Tactical 9mm Pistol (Low-Poly High-Detail)
window.ApexGuns = window.ApexGuns || {};
window.ApexGuns.models = window.ApexGuns.models || {};
window.ApexGuns.models.pistol = function buildPistol3D() {
  const U = window.ApexGunUtils;
  const M = U.mats();
  const g = new THREE.Group();
  g.name = 'Gun_Glock19';

  // Polymer grip angled ergonomically
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.16, 0.088), M.polymer);
  grip.position.set(0, -0.055, -0.04);
  grip.rotation.x = 0.24;
  // Base magazine pad
  const magPad = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.022, 0.095), M.darkSteel);
  magPad.position.set(0, -0.14, -0.06);
  magPad.rotation.x = 0.24;
  // Lower frame + Picatinny under-rail
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.042, 0.28), M.polymer);
  frame.position.set(0, 0.025, 0.07);
  // Machined gunmetal slide
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.056, 0.30), M.gunmetal);
  slide.position.set(0, 0.068, 0.072);
  // Chrome ejection port + barrel tip
  const port = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.026, 0.065), M.chrome);
  port.position.set(0, 0.076, 0.05);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8), M.darkSteel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.068, 0.235);
  // Trigger guard & curved trigger
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.052, 0.078), M.polymer);
  guard.position.set(0, -0.018, 0.055);
  // Illuminated green night iron sights
  const fSight = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.016, 0.014), M.sightDot);
  fSight.position.set(0, 0.104, 0.205);
  const rSight = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.014, 0.014), M.sightDot);
  rSight.position.set(0, 0.103, -0.062);

  const flash = U.createMuzzleFlash(0.85);
  flash.position.set(0, 0.068, 0.265);
  g.add(grip, magPad, frame, slide, port, barrel, guard, fSight, rSight, flash);
  g.userData = { muzzleZ: 0.265, muzzleY: 0.068, flash, slide };
  return g;
};
