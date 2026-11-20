window.DEFAULT_VEHICLES = [
  { id: 'agera', name: 'Koenigsegg Agera RS', type: 'car', emoji: '🏎️', price: 0, speed: 100, acc: 96, handling: 94, fuel: 90, is3D: true, modelFormat: 'obj', prebakedKey: 'AGERA_3D_DATA', defaultColor: '#e11d48', secondaryColor: '#111827', scale: 1.0, unlockedByDefault: true, badge: 'HYPERCAR' },
  { id: 'astra_gt', name: 'Astra GT Turbo', type: 'car', emoji: '🏎️', price: 0, speed: 92, acc: 90, handling: 94, fuel: 92, is3D: true, modelFormat: 'obj', prebakedKey: 'AGERA_3D_DATA', defaultColor: '#3b82f6', secondaryColor: '#0f172a', scale: 0.98, unlockedByDefault: true, badge: 'GT TURBO' },
  { id: 'bugatti_chiron', name: 'Bugatti Chiron Sport', type: 'car', emoji: '🏎️', price: 95000, speed: 100, acc: 98, handling: 92, fuel: 85, is3D: true, modelFormat: 'obj', prebakedKey: 'AGERA_3D_DATA', defaultColor: '#2563eb', secondaryColor: '#090d16', scale: 1.02, badge: 'W16 HYPER' },
  { id: 'lambo_revuelto', name: 'Lamborghini Revuelto V12', type: 'car', emoji: '🏎️', price: 120000, speed: 99, acc: 97, handling: 95, fuel: 84, is3D: true, modelFormat: 'obj', prebakedKey: 'AGERA_3D_DATA', defaultColor: '#22c55e', secondaryColor: '#0f172a', scale: 1.0, badge: 'V12 APEX' },
  { id: 'porsche_gt3', name: 'Porsche 911 GT3 RS', type: 'car', emoji: '🏎️', price: 85000, speed: 95, acc: 93, handling: 98, fuel: 86, is3D: true, modelFormat: 'obj', prebakedKey: 'AGERA_3D_DATA', defaultColor: '#06b6d4', secondaryColor: '#0f172a', scale: 0.98, badge: 'TRACK PRO' },
  { id: 'ferrari_sf90', name: 'Ferrari SF90 Stradale', type: 'car', emoji: '🏎️', price: 135000, speed: 100, acc: 99, handling: 96, fuel: 84, is3D: true, modelFormat: 'obj', prebakedKey: 'AGERA_3D_DATA', defaultColor: '#ef4444', secondaryColor: '#18181b', scale: 1.0, badge: 'MARANELLO' },
  { id: 'mclaren_765lt', name: 'McLaren 765LT Spider', type: 'car', emoji: '🏎️', price: 110000, speed: 98, acc: 97, handling: 97, fuel: 88, is3D: true, modelFormat: 'obj', prebakedKey: 'AGERA_3D_DATA', defaultColor: '#f97316', secondaryColor: '#111827', scale: 0.99, badge: 'AERO GT' }
];

window.DEFAULT_SKINS = [
  { id: 'skin_crimson', name: 'Koenigsegg Crimson R', vehicleId: 'all', primary: '#e11d48', secondary: '#111827', finish: 'metallic', price: 0, unlocked: true },
  { id: 'skin_gold', name: 'Solar Gold Chrome', vehicleId: 'all', primary: '#facc15', secondary: '#0f172a', finish: 'chrome', price: 5000, unlocked: false },
  { id: 'skin_cyber', name: 'Cyber Neon Cyan', vehicleId: 'all', primary: '#00f5d4', secondary: '#090d16', finish: 'neon', price: 8500, unlocked: false },
  { id: 'skin_venom', name: 'Violet Venom GT', vehicleId: 'all', primary: '#9333ea', secondary: '#f43f5e', finish: 'metallic', price: 12000, unlocked: false },
  { id: 'skin_stealth', name: 'Phantom Matte Carbon', vehicleId: 'all', primary: '#1e293b', secondary: '#38bdf8', finish: 'matte', price: 15000, unlocked: false },
  { id: 'skin_emerald', name: 'Emerald Carbon', vehicleId: 'all', primary: '#10b981', secondary: '#052e16', finish: 'metallic', price: 10000, unlocked: false }
];

window.VEHICLES = JSON.parse(JSON.stringify(window.DEFAULT_VEHICLES));
window.VEHICLE_SKINS = JSON.parse(JSON.stringify(window.DEFAULT_SKINS));
