// gun/shotgun.js — Real 3D M870 Tactical Pump Shotgun (Long Steel Barrel + Ribbed Forend + Shell Tube)
window.ApexGuns = window.ApexGuns || {};
window.ApexGuns.models = window.ApexGuns.models || {};
window.ApexGuns.models.shotgun = function buildShotgun3D() {
  const U = window.ApexGunUtils;
  const M = U.mats();
  const g = new THREE.Group();
  g.name = 'Gun_M870_Shotgun';

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.088, 0.28), M.gunmetal);
  receiver.position.set(0, 0.048, 0.05);
  const eject = new THREE.Mesh(new THREE.BoxGeometry(0.067, 0.032, 0.082), M.chrome);
  eject.position.set(0, 0.056, 0.08);
  // Tactical polymer buttstock & angled grip
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.11, 0.31), M.polymer);
  stock.position.set(0, 0.002, -0.24);
  stock.rotation.x = 0.16;
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.13, 0.068), M.polymer);
  grip.position.set(0, -0.055, -0.06);
  grip.rotation.x = 0.30;
  // Long 12-gauge upper barrel + lower tubular magazine
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.020, 0.62, 8), M.darkSteel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.072, 0.49);
  const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.52, 8), M.gunmetal);
  magTube.rotation.x = Math.PI / 2;
  magTube.position.set(0, 0.034, 0.44);
  // Ribbed tactical pump-action forend
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.22, 8), M.walnut);
  pump.rotation.x = Math.PI / 2;
  pump.position.set(0, 0.034, 0.41);
  // Brass bead front sight
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), M.brass);
  bead.position.set(0, 0.096, 0.78);

  const flash = U.createMuzzleFlash(1.85);
  flash.position.set(0, 0.072, 0.81);
  g.add(receiver, eject, stock, grip, barrel, magTube, pump, bead, flash);
  g.userData = { muzzleZ: 0.81, muzzleY: 0.072, flash, pump };
  return g;
};
