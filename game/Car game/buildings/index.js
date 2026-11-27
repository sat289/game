// buildings/index.js
// Master Registry for all 6 Modular Walk-In 3D Buildings (ST GAMES)
// Usage:
//   const b = window.ApexBuildings.create('hospital');
//   scene.add(b.group);
//   // In your loop: b.update(dt, now);
//   // Sliding doors: b.doorL, b.doorR open automatically when player nears z = b.doorZ!
window.ApexBuildings = window.ApexBuildings || {};
window.ApexBuildings.CATALOG = [
  { id: 'hospital',         name: 'Building A — City Hospital',      tag: 'H', color: '#ef4444' },
  { id: 'mega_mall',        name: 'Building B — Mega Mall',          tag: 'M', color: '#a855f7' },
  { id: 'dmart',            name: 'Building C — D-Mart Supermarket', tag: 'D', color: '#f97316' },
  { id: 'casino',           name: 'Building D — Jackpot Casino',     tag: 'C', color: '#ec4899' },
  { id: 'police_hq',        name: 'Building E — Police HQ',          tag: 'P', color: '#2563eb' },
  { id: 'cyber_apartments', name: 'Building F — Cyber Apartments',   tag: 'A', color: '#06b6d4' }
];

window.ApexBuildings.create = function (id) {
  const fn = window.ApexBuildings[id];
  if (typeof fn !== 'function') {
    throw new Error('Unknown building id: ' + id + '. Make sure buildings/' + id + '.js is loaded.');
  }
  return fn();
};
