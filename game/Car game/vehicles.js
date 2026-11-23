// 46 Distinct Vehicles — Each with its own unique 3D body archetype (bodyStyle), proportions, spoiler/roof/exhaust config & rich metallic colors
const IMG_STARTER_CAR = 'assets/car_starter.jpg';
const IMG_SUPER_CAR = 'assets/car_super.jpg';
const IMG_TRUCK = 'assets/truck.jpg';
const IMG_BIKE = 'assets/bike.jpg';

window.APEX_VEHICLES = [
  // 21 DISTINCT CARS (Each has unique bodyStyle: sedan, touring, sport_sedan, coupe_gt, widebody, muscle_blower, spyder_open, hyper_fin, formula_track, rally_hatch, classic_gt, etc.)
  { id: 0, name: 'Civic Street Sedan', cat: 'CAR', modelType: 'car', bodyStyle: 'sedan', colorHex: 0xe2e8f0, accentHex: 0x0ea5e9, starter: true, price: 0, img: IMG_STARTER_CAR, hue: 0, speed: 68, accel: 64, handle: 74, nitro: 60 },
  { id: 1, name: 'Accord GT Touring', cat: 'CAR', modelType: 'car', bodyStyle: 'fastback', colorHex: 0x0284c7, accentHex: 0xf8fafc, price: 4500, img: IMG_STARTER_CAR, hue: 200, speed: 74, accel: 70, handle: 76, nitro: 65 },
  { id: 2, name: 'Camry Sport TRD', cat: 'CAR', modelType: 'car', bodyStyle: 'sport_sedan', colorHex: 0xe11d48, accentHex: 0x111827, price: 6200, img: IMG_STARTER_CAR, hue: 345, speed: 77, accel: 74, handle: 79, nitro: 69 },
  { id: 3, name: 'Skyline Coupe RS', cat: 'CAR', modelType: 'car', bodyStyle: 'jdm_coupe', colorHex: 0x1d4ed8, accentHex: 0x38bdf8, price: 7500, img: IMG_SUPER_CAR, hue: 210, speed: 80, accel: 78, handle: 82, nitro: 74 },
  { id: 4, name: 'BMW M4 Competition', cat: 'CAR', modelType: 'car', bodyStyle: 'widebody', colorHex: 0x15803d, accentHex: 0xfacc15, price: 9500, img: IMG_SUPER_CAR, hue: 135, speed: 83, accel: 81, handle: 85, nitro: 76 },
  { id: 5, name: 'Veloce Crimson GT', cat: 'CAR', modelType: 'car', bodyStyle: 'exotic_low', colorHex: 0xdc2626, accentHex: 0xfacc15, price: 11000, img: IMG_SUPER_CAR, hue: 0, speed: 84, accel: 82, handle: 80, nitro: 78 },
  { id: 6, name: 'Mustang Apex V8', cat: 'CAR', modelType: 'car', bodyStyle: 'muscle_blower', colorHex: 0xea580c, accentHex: 0x111827, price: 14000, img: IMG_SUPER_CAR, hue: 35, speed: 86, accel: 85, handle: 76, nitro: 82 },
  { id: 7, name: 'Audi R8 V10 Spyder', cat: 'CAR', modelType: 'car', bodyStyle: 'spyder_open', colorHex: 0xf8fafc, accentHex: 0xef4444, price: 16500, img: IMG_SUPER_CAR, hue: 190, speed: 87, accel: 86, handle: 87, nitro: 83 },
  { id: 8, name: 'Supra Turbo MK5', cat: 'CAR', modelType: 'car', bodyStyle: 'drift_wing', colorHex: 0x059669, accentHex: 0x34d399, price: 18500, img: IMG_SUPER_CAR, hue: 145, speed: 88, accel: 87, handle: 84, nitro: 85 },
  { id: 9, name: 'Nissan GT-R Nismo', cat: 'CAR', modelType: 'car', bodyStyle: 'gt_racer', colorHex: 0x475569, accentHex: 0xef4444, price: 21500, img: IMG_SUPER_CAR, hue: 220, speed: 89, accel: 89, handle: 86, nitro: 86 },
  { id: 10, name: 'Porsche 911 Carrera', cat: 'CAR', modelType: 'car', bodyStyle: 'sloped_gt', colorHex: 0x0891b2, accentHex: 0xe2e8f0, price: 24000, img: IMG_SUPER_CAR, hue: 185, speed: 90, accel: 89, handle: 90, nitro: 84 },
  { id: 11, name: 'Mercedes AMG GT-R', cat: 'CAR', modelType: 'car', bodyStyle: 'long_hood', colorHex: 0x10b981, accentHex: 0x0f172a, price: 28000, img: IMG_SUPER_CAR, hue: 155, speed: 91, accel: 90, handle: 89, nitro: 87 },
  { id: 12, name: 'Huracan Evo Spyder', cat: 'CAR', modelType: 'car', bodyStyle: 'wedge_spyder', colorHex: 0xfacc15, accentHex: 0x0f172a, price: 32000, img: IMG_SUPER_CAR, hue: 48, speed: 93, accel: 91, handle: 88, nitro: 88 },
  { id: 13, name: 'Aston Martin Valkyrie', cat: 'CAR', modelType: 'car', bodyStyle: 'hyper_fin', colorHex: 0x0f766e, accentHex: 0x2dd4bf, price: 37500, img: IMG_SUPER_CAR, hue: 170, speed: 94, accel: 92, handle: 91, nitro: 89 },
  { id: 14, name: 'McLaren 720S Track', cat: 'CAR', modelType: 'car', bodyStyle: 'teardrop_hyper', colorHex: 0x7c3aed, accentHex: 0xf97316, price: 42000, img: IMG_SUPER_CAR, hue: 270, speed: 95, accel: 93, handle: 92, nitro: 90 },
  { id: 15, name: 'Pagani Huayra BC', cat: 'CAR', modelType: 'car', bodyStyle: 'quad_pipe_gt', colorHex: 0x0284c7, accentHex: 0xfde047, price: 48500, img: IMG_SUPER_CAR, hue: 205, speed: 95, accel: 94, handle: 93, nitro: 91 },
  { id: 16, name: 'Ferrari SF90 Stradale', cat: 'CAR', modelType: 'car', bodyStyle: 'italian_mid', colorHex: 0xb91c1c, accentHex: 0xfde047, price: 55000, img: IMG_SUPER_CAR, hue: 350, speed: 96, accel: 95, handle: 93, nitro: 92 },
  { id: 17, name: 'Aventador SVJ Nitro', cat: 'CAR', modelType: 'car', bodyStyle: 'stealth_wedge', colorHex: 0x16a34a, accentHex: 0x111827, price: 70000, img: IMG_SUPER_CAR, hue: 120, speed: 97, accel: 96, handle: 91, nitro: 95 },
  { id: 18, name: 'Rimac Nevera Hyper', cat: 'CAR', modelType: 'car', bodyStyle: 'ev_hyper', colorHex: 0x06b6d4, accentHex: 0xf8fafc, price: 82000, img: IMG_SUPER_CAR, hue: 190, speed: 98, accel: 99, handle: 94, nitro: 96 },
  { id: 19, name: 'Koenigsegg Jesko', cat: 'CAR', modelType: 'car', bodyStyle: 'swan_wing', colorHex: 0xf8fafc, accentHex: 0x06b6d4, price: 95000, img: IMG_SUPER_CAR, hue: 195, speed: 99, accel: 98, handle: 94, nitro: 97 },
  { id: 20, name: 'Bugatti Chiron Super', cat: 'CAR', modelType: 'car', bodyStyle: 'bugatti_arch', colorHex: 0x1e3a8a, accentHex: 0x38bdf8, price: 120000, img: IMG_SUPER_CAR, hue: 230, speed: 100, accel: 99, handle: 95, nitro: 100 },

  // 13 DISTINCT TRUCKS & SUVs (pickup, desert_rollbar, jeep_open, raptor_wide, flat_bed, ram_hood, safari_suv, armored_6x6, baja_trophy, gwagon_box, hummer_ev, monster_giant, cyber_wedge)
  { id: 21, name: 'Ranger 4x4 Pickup', cat: 'TRUCK', modelType: 'truck', bodyStyle: 'pickup', colorHex: 0x334155, accentHex: 0xf97316, price: 6000, img: IMG_TRUCK, hue: 0, speed: 66, accel: 65, handle: 68, nitro: 70 },
  { id: 22, name: 'Hilux Desert Runner', cat: 'TRUCK', modelType: 'truck', bodyStyle: 'desert_rollbar', colorHex: 0xb45309, accentHex: 0xfef08a, price: 8500, img: IMG_TRUCK, hue: 30, speed: 70, accel: 68, handle: 72, nitro: 72 },
  { id: 23, name: 'Jeep Wrangler Rubicon', cat: 'TRUCK', modelType: 'truck', bodyStyle: 'jeep_open', colorHex: 0xdc2626, accentHex: 0x111827, price: 10500, img: IMG_TRUCK, hue: 350, speed: 72, accel: 71, handle: 75, nitro: 74 },
  { id: 24, name: 'F-150 Raptor SVT', cat: 'TRUCK', modelType: 'truck', bodyStyle: 'raptor_wide', colorHex: 0x0369a1, accentHex: 0x0f172a, price: 12500, img: IMG_TRUCK, hue: 190, speed: 75, accel: 74, handle: 73, nitro: 76 },
  { id: 25, name: 'Chevy Silverado ZR2', cat: 'TRUCK', modelType: 'truck', bodyStyle: 'flat_bed', colorHex: 0xf59e0b, accentHex: 0x0f172a, price: 15000, img: IMG_TRUCK, hue: 42, speed: 77, accel: 76, handle: 72, nitro: 79 },
  { id: 26, name: 'RAM TRX Hellcat', cat: 'TRUCK', modelType: 'truck', bodyStyle: 'ram_hood', colorHex: 0x991b1b, accentHex: 0x1e293b, price: 17000, img: IMG_TRUCK, hue: 340, speed: 80, accel: 79, handle: 70, nitro: 82 },
  { id: 27, name: 'Defender V8 Safari', cat: 'TRUCK', modelType: 'truck', bodyStyle: 'safari_suv', colorHex: 0x15803d, accentHex: 0xf8fafc, price: 20500, img: IMG_TRUCK, hue: 130, speed: 81, accel: 78, handle: 76, nitro: 80 },
  { id: 28, name: 'Titan Armored 6x6', cat: 'TRUCK', modelType: 'heavy_truck', bodyStyle: 'armored_6x6', colorHex: 0x166534, accentHex: 0xfacc15, price: 23000, img: IMG_TRUCK, hue: 120, speed: 77, accel: 76, handle: 66, nitro: 85 },
  { id: 29, name: 'Baja Trophy Beast', cat: 'TRUCK', modelType: 'truck', bodyStyle: 'baja_trophy', colorHex: 0xca8a04, accentHex: 0x0f172a, price: 30000, img: IMG_TRUCK, hue: 45, speed: 84, accel: 82, handle: 78, nitro: 86 },
  { id: 30, name: 'G-Wagon 4x4 Squared', cat: 'TRUCK', modelType: 'heavy_truck', bodyStyle: 'gwagon_box', colorHex: 0x1e1b4b, accentHex: 0x38bdf8, price: 40000, img: IMG_TRUCK, hue: 220, speed: 85, accel: 84, handle: 80, nitro: 84 },
  { id: 31, name: 'Hummer EV Supertruck', cat: 'TRUCK', modelType: 'heavy_truck', bodyStyle: 'hummer_ev', colorHex: 0xf8fafc, accentHex: 0x06b6d4, price: 46000, img: IMG_TRUCK, hue: 185, speed: 87, accel: 89, handle: 76, nitro: 90 },
  { id: 32, name: 'Monster Titan Crusher', cat: 'TRUCK', modelType: 'heavy_truck', bodyStyle: 'monster_giant', colorHex: 0x6b21a8, accentHex: 0xf97316, price: 52000, img: IMG_TRUCK, hue: 280, speed: 82, accel: 85, handle: 69, nitro: 92 },
  { id: 33, name: 'Cyber Heavy Hauler', cat: 'TRUCK', modelType: 'heavy_truck', bodyStyle: 'cyber_wedge', colorHex: 0x0f766e, accentHex: 0x2dd4bf, price: 68000, img: IMG_TRUCK, hue: 170, speed: 89, accel: 88, handle: 77, nitro: 95 },

  // 12 DISTINCT BIKES (naked_street, cafe_racer, ninja_sport, triple_street, r1_track, gsx_aero, cbr_wings, bmw_asym, ducati_v4, aprilia_gp, h2r_supercharged, ev_tron)
  { id: 34, name: 'Duke 390 Street', cat: 'BIKE', modelType: 'bike', bodyStyle: 'naked_street', colorHex: 0xf97316, accentHex: 0x0f172a, price: 3500, img: IMG_BIKE, hue: 25, speed: 76, accel: 80, handle: 88, nitro: 70 },
  { id: 35, name: 'Royal GT 650 Cafe', cat: 'BIKE', modelType: 'bike', bodyStyle: 'cafe_racer', colorHex: 0xb91c1c, accentHex: 0xfacc15, price: 5000, img: IMG_BIKE, hue: 355, speed: 79, accel: 81, handle: 89, nitro: 73 },
  { id: 36, name: 'Ninja ZX-6R', cat: 'BIKE', modelType: 'bike', bodyStyle: 'ninja_sport', colorHex: 0x16a34a, accentHex: 0x0f172a, price: 6500, img: IMG_BIKE, hue: 130, speed: 82, accel: 84, handle: 90, nitro: 76 },
  { id: 37, name: 'Triumph Speed Triple', cat: 'BIKE', modelType: 'bike', bodyStyle: 'triple_street', colorHex: 0xeab308, accentHex: 0x111827, price: 8800, img: IMG_BIKE, hue: 50, speed: 85, accel: 86, handle: 91, nitro: 79 },
  { id: 38, name: 'Yamaha R1M Carbon', cat: 'BIKE', modelType: 'bike', bodyStyle: 'r1_track', colorHex: 0x1d4ed8, accentHex: 0xe2e8f0, price: 10500, img: IMG_BIKE, hue: 210, speed: 87, accel: 88, handle: 92, nitro: 82 },
  { id: 39, name: 'GSX-R1000R Pro', cat: 'BIKE', modelType: 'bike', bodyStyle: 'gsx_aero', colorHex: 0x0284c7, accentHex: 0xfacc15, price: 15000, img: IMG_BIKE, hue: 185, speed: 89, accel: 90, handle: 91, nitro: 84 },
  { id: 40, name: 'Honda CBR1000RR-R', cat: 'BIKE', modelType: 'bike', bodyStyle: 'cbr_wings', colorHex: 0xdc2626, accentHex: 0x2563eb, price: 18500, img: IMG_BIKE, hue: 345, speed: 91, accel: 92, handle: 93, nitro: 85 },
  { id: 41, name: 'BMW S1000RR', cat: 'BIKE', modelType: 'bike', bodyStyle: 'bmw_asym', colorHex: 0xf1f5f9, accentHex: 0xef4444, price: 21000, img: IMG_BIKE, hue: 240, speed: 92, accel: 93, handle: 94, nitro: 86 },
  { id: 42, name: 'Ducati Panigale V4R', cat: 'BIKE', modelType: 'bike', bodyStyle: 'ducati_v4', colorHex: 0xdc2626, accentHex: 0x111827, price: 29000, img: IMG_BIKE, hue: 350, speed: 94, accel: 95, handle: 95, nitro: 89 },
  { id: 43, name: 'Aprilia RSV4 Factory', cat: 'BIKE', modelType: 'bike', bodyStyle: 'aprilia_gp', colorHex: 0x6d28d9, accentHex: 0xf97316, price: 38000, img: IMG_BIKE, hue: 280, speed: 95, accel: 96, handle: 96, nitro: 91 },
  { id: 44, name: 'Kawasaki Ninja H2R', cat: 'BIKE', modelType: 'bike', bodyStyle: 'h2r_supercharged', colorHex: 0x047857, accentHex: 0x22d3ee, price: 54000, img: IMG_BIKE, hue: 165, speed: 99, accel: 98, handle: 93, nitro: 97 },
  { id: 45, name: 'Lightning LS-218 EV', cat: 'BIKE', modelType: 'bike', bodyStyle: 'ev_tron', colorHex: 0xfacc15, accentHex: 0x06b6d4, price: 75000, img: IMG_BIKE, hue: 50, speed: 100, accel: 100, handle: 96, nitro: 100 }
];
