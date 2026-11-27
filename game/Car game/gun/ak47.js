// gun/ak47.js — Real 3D AK-47 Assault Rifle (Stamped Gunmetal + Curved Banana Mag + Walnut Wood)
window.ApexGuns = window.ApexGuns || {};
window.ApexGuns.models = window.ApexGuns.models || {};
window.ApexGuns.models.ak47 = function buildAK473D() {
  const U = window.ApexGunUtils;
  const M = U.mats();
  const g = new THREE.Group();
  g.name = 'Gun_AK47';

  // Stamped steel receiver + dust cover
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.088, 0.34), M.gunmetal);
  receiver.position.set(0, 0.045, 0.05);
  const dustCover = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.32, 8), M.darkSteel);
  dustCover.rotation.x = Math.PI / 2;
  dustCover.position.set(0, 0.09, 0.045);
  // Classic angled walnut wood buttstock
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.115, 0.30), M.walnut);
  stock.position.set(0, 0.005, -0.255);
  stock.rotation.x = 0.14;
  // Wood pistol grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.135, 0.066), M.walnut);
  grip.position.set(0, -0.058, -0.05);
  grip.rotation.x = 0.28;
  // Iconic curved banana magazine (2 angled segments)
  const magTop = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.16, 0.084), M.darkSteel);
  magTop.position.set(0, -0.075, 0.13);
  magTop.rotation.x = -0.18;
  const magBot = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.15, 0.080), M.darkSteel);
  magBot.position.set(0, -0.195, 0.175);
  magBot.rotation.x = -0.42;
  // Wooden front handguard (upper + lower)
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.078, 0.24), M.walnut);
  handguard.position.set(0, 0.056, 0.33);
  // Steel barrel + gas tube + slant muzzle brake + iconic front sight post
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.015, 0.44, 8), M.darkSteel);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.056, 0.56);
  const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8), M.gunmetal);
  gasTube.rotation.x = Math.PI / 2;
  gasTube.position.set(0, 0.095, 0.43);
  const fSight = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.062, 0.028), M.darkSteel);
  fSight.position.set(0, 0.098, 0.72);
  const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.016, 0.025), M.chrome);
  bolt.position.set(0.042, 0.068, 0.10);

  const flash = U.createMuzzleFlash(1.3);
  flash.position.set(0, 0.056, 0.79);
  g.add(receiver, dustCover, stock, grip, magTop, magBot, handguard, barrel, gasTube, fSight, bolt, flash);
  g.userData = { muzzleZ: 0.79, muzzleY: 0.056, flash };
  return g;
};
