// gun/sniper.js — Real 3D AWM Tactical Sniper Rifle (Olive Chassis + Optical Scope + Muzzle Brake + Bipod)
window.ApexGuns = window.ApexGuns || {};
window.ApexGuns.models = window.ApexGuns.models || {};
window.ApexGuns.models.sniper = function buildSniper3D() {
  const U = window.ApexGunUtils;
  const M = U.mats();
  const g = new THREE.Group();
  g.name = 'Gun_AWM_Sniper';

  // Iconic Olive-Drab AWM tactical thumbhole chassis & stock
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.086, 0.56), M.olive);
  chassis.position.set(0, 0.036, 0.16);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.115, 0.34), M.olive);
  stock.position.set(0, 0.012, -0.26);
  const cheekPad = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.032, 0.15), M.polymer);
  cheekPad.position.set(0, 0.082, -0.24);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.13, 0.068), M.polymer);
  grip.position.set(0, -0.055, -0.06);
  grip.rotation.x = 0.25;
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.10, 0.095), M.darkSteel);
  mag.position.set(0, -0.045, 0.14);

  // Heavy fluted precision barrel + dual-port muzzle brake
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.020, 0.68, 8), M.darkSteel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.072, 0.66);
  const brake = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.038, 0.09), M.gunmetal);
  brake.position.set(0, 0.072, 1.02);

  // Magnified Sniper Scope + Mount Rings + Glowing Glass Objective Lens
  const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.022, 0.34, 10), M.darkSteel);
  scopeTube.rotation.x = Math.PI / 2;
  scopeTube.position.set(0, 0.145, 0.14);
  const scopeBell = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.026, 0.11, 10), M.gunmetal);
  scopeBell.rotation.x = Math.PI / 2;
  scopeBell.position.set(0, 0.145, 0.34);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.01, 10), M.lens);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 0.145, 0.398);
  const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.055, 0.032), M.polymer);
  mount1.position.set(0, 0.105, 0.04);
  const mount2 = mount1.clone(); mount2.position.z = 0.23;

  // Bolt handle + folded tactical bipod legs
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.075, 6), M.chrome);
  bolt.rotation.z = Math.PI / 2;
  bolt.position.set(0.052, 0.068, 0.02);
  [-0.04, 0.04].forEach((bx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.20, 6), M.darkSteel);
    leg.rotation.x = Math.PI / 2;
    leg.position.set(bx, 0.004, 0.44);
    g.add(leg);
  });

  const flash = U.createMuzzleFlash(1.65);
  flash.position.set(0, 0.072, 1.08);
  g.add(chassis, stock, cheekPad, grip, mag, barrel, brake, scopeTube, scopeBell, lens, mount1, mount2, bolt, flash);
  g.userData = { muzzleZ: 1.08, muzzleY: 0.072, flash };
  return g;
};
