// gun/smg.js — Real 3D MP5 Tactical SMG (Suppressor + Vertical Foregrip + Extended Curved Mag)
window.ApexGuns = window.ApexGuns || {};
window.ApexGuns.models = window.ApexGuns.models || {};
window.ApexGuns.models.smg = function buildSMG3D() {
  const U = window.ApexGunUtils;
  const M = U.mats();
  const g = new THREE.Group();
  g.name = 'Gun_MP5_SMG';

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.088, 0.34), M.gunmetal);
  body.position.set(0, 0.048, 0.08);
  const upperTube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.36, 8), M.darkSteel);
  upperTube.rotation.x = Math.PI / 2;
  upperTube.position.set(0, 0.082, 0.14);
  // Collapsible wireframe stock rails + buttpad
  const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.04), M.polymer);
  stockPad.position.set(0, 0.032, -0.24);
  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.20), M.darkSteel);
  railL.position.set(-0.024, 0.052, -0.14);
  const railR = railL.clone(); railR.position.x = 0.024;
  // Pistol grip + extended curved stick magazine + vertical foregrip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.13, 0.065), M.polymer);
  grip.position.set(0, -0.052, -0.02);
  grip.rotation.x = 0.26;
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.24, 0.056), M.darkSteel);
  mag.position.set(0, -0.105, 0.145);
  mag.rotation.x = -0.18;
  const foregrip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.11, 8), M.polymer);
  foregrip.position.set(0, -0.035, 0.27);
  // Matte tactical suppressor + compact red-dot sight
  const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.22, 10), M.polymer);
  suppressor.rotation.x = Math.PI / 2;
  suppressor.position.set(0, 0.066, 0.44);
  const redDot = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.040, 0.075), M.darkSteel);
  redDot.position.set(0, 0.122, 0.08);
  const dotGlass = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.024, 0.01), M.sightDot);
  dotGlass.position.set(0, 0.122, 0.12);

  const flash = U.createMuzzleFlash(0.75);
  flash.position.set(0, 0.066, 0.56);
  g.add(body, upperTube, stockPad, railL, railR, grip, mag, foregrip, suppressor, redDot, dotGlass, flash);
  g.userData = { muzzleZ: 0.56, muzzleY: 0.066, flash };
  return g;
};
