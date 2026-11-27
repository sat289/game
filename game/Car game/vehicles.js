// 15 Curated Mingled 3D Vehicles: 5 Cars + 5 Bikes + 5 Trucks (Free Starter -> 20,000 C to 1,50,000 C)
const IMG_STARTER_CAR = 'assets/car_starter.jpg';
const IMG_SUPER_CAR = 'assets/car_super.jpg';
const IMG_TRUCK = 'assets/truck.jpg';
const IMG_BIKE = 'assets/bike.jpg';

window.APEX_VEHICLES = [
  { id: 0,  name: '2025 Koenigsegg Gemera', cat: 'CAR',   modelType: 'car',         bodyStyle: 'gemera_hyper',     isRealFBX: true, glbPath: 'assets/car_04.glb', colorHex: 0xe11d48, accentHex: 0xfacc15, starter: true, price: 0,      img: IMG_STARTER_CAR, hue: 0,   speed: 78, accel: 76, handle: 82, nitro: 74 },
  { id: 1,  name: 'Yamaha R15 V4 Racing',   cat: 'BIKE',  modelType: 'bike',        bodyStyle: 'r15_v4',           colorHex: 0x1d4ed8, accentHex: 0x38bdf8, price: 20000,  img: IMG_BIKE,        hue: 350, speed: 82, accel: 85, handle: 90, nitro: 78 },
  { id: 2,  name: 'F-150 Raptor SVT',       cat: 'TRUCK', modelType: 'truck',       bodyStyle: 'raptor_wide',      colorHex: 0x2563eb, accentHex: 0x38bdf8, price: 30000,  img: IMG_TRUCK,       hue: 210, speed: 78, accel: 79, handle: 76, nitro: 80 },
  { id: 3,  name: 'Ferrari SF90 Stradale',  cat: 'CAR',   modelType: 'car',         bodyStyle: 'italian_mid',      isRealGLB: true, glbPath: 'assets/car_01.glb', colorHex: 0x0284c7, accentHex: 0xfde047, price: 40000,  img: IMG_SUPER_CAR,   hue: 350, speed: 86, accel: 85, handle: 88, nitro: 82 },
  { id: 4,  name: 'Kawasaki Ninja H2R',     cat: 'BIKE',  modelType: 'bike',        bodyStyle: 'h2r_supercharged', colorHex: 0x10b981, accentHex: 0x00f0ff, price: 50000,  img: IMG_BIKE,        hue: 155, speed: 88, accel: 90, handle: 91, nitro: 85 },
  { id: 5,  name: 'Jeep Wrangler Rubicon',  cat: 'TRUCK', modelType: 'truck',       bodyStyle: 'jeep_open',        colorHex: 0xea580c, accentHex: 0xfde047, price: 60000,  img: IMG_TRUCK,       hue: 25,  speed: 80, accel: 82, handle: 82, nitro: 83 },
  { id: 6,  name: 'Huracan Evo Spyder',     cat: 'CAR',   modelType: 'car',         bodyStyle: 'wedge_spyder',     isRealGLB2: true, glbPath: 'assets/car_02.glb', colorHex: 0xfacc15, accentHex: 0x0f172a, price: 70000,  img: IMG_SUPER_CAR,   hue: 48,  speed: 91, accel: 90, handle: 90, nitro: 87 },
  { id: 7,  name: 'Ducati Panigale V4R',    cat: 'BIKE',  modelType: 'bike',        bodyStyle: 'ducati_v4',        colorHex: 0xdc2626, accentHex: 0xfacc15, price: 80000,  img: IMG_BIKE,        hue: 205, speed: 92, accel: 93, handle: 94, nitro: 88 },
  { id: 8,  name: 'G-Wagon 4x4 Squared',    cat: 'TRUCK', modelType: 'heavy_truck', bodyStyle: 'gwagon_box',       colorHex: 0x4f46e5, accentHex: 0x38bdf8, price: 90000,  img: IMG_TRUCK,       hue: 235, speed: 86, accel: 86, handle: 84, nitro: 88 },
  { id: 9,  name: 'McLaren 720S Track',     cat: 'CAR',   modelType: 'car',         bodyStyle: 'teardrop_hyper',   colorHex: 0x7c3aed, accentHex: 0xf97316, price: 100000, img: IMG_SUPER_CAR,   hue: 270, speed: 95, accel: 94, handle: 93, nitro: 92 },
  { id: 10, name: 'Royal Cafe GT 650',      cat: 'BIKE',  modelType: 'bike',        bodyStyle: 'cafe_racer',       colorHex: 0xd97706, accentHex: 0xfef08a, price: 110000, img: IMG_BIKE,        hue: 40,  speed: 95, accel: 96, handle: 95, nitro: 93 },
  { id: 11, name: 'Titan Armored 6x6',      cat: 'TRUCK', modelType: 'heavy_truck', bodyStyle: 'armored_6x6',      colorHex: 0x15803d, accentHex: 0xfacc15, price: 120000, img: IMG_TRUCK,       hue: 130, speed: 89, accel: 89, handle: 80, nitro: 94 },
  { id: 12, name: 'Bugatti Chiron Super',   cat: 'CAR',   modelType: 'car',         bodyStyle: 'bugatti_arch',     colorHex: 0x1d4ed8, accentHex: 0x38bdf8, price: 130000, img: IMG_SUPER_CAR,   hue: 220, speed: 99, accel: 99, handle: 96, nitro: 98 },
  { id: 13, name: 'Lightning LS-218 EV',    cat: 'BIKE',  modelType: 'bike',        bodyStyle: 'ev_tron',          colorHex: 0x06b6d4, accentHex: 0xfacc15, price: 140000, img: IMG_BIKE,        hue: 185, speed: 100, accel: 100, handle: 98, nitro: 99 },
  { id: 14, name: 'Monster Titan Crusher',  cat: 'TRUCK', modelType: 'heavy_truck', bodyStyle: 'monster_giant',    colorHex: 0x9333ea, accentHex: 0xf97316, price: 150000, img: IMG_TRUCK,       hue: 280, speed: 96, accel: 97, handle: 86, nitro: 100 }
];
