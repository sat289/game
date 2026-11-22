// 31 Upgraded Realistic Vehicles with Curated Metallic Paint & Accent Colors
const IMG_STARTER_CAR = 'assets/car_starter.jpg';
const IMG_SUPER_CAR = 'assets/car_super.jpg';
const IMG_TRUCK = 'assets/truck.jpg';
const IMG_BIKE = 'assets/bike.jpg';

window.APEX_VEHICLES = [
  { id: 0, name: 'Civic Street Sedan', cat: 'CAR', modelType: 'sedan', colorHex: 0xdbe4ee, accentHex: 0x0ea5e9, starter: true, price: 0, img: IMG_STARTER_CAR, hue: 0, speed: 68, accel: 64, handle: 74, nitro: 60 },
  { id: 1, name: 'Accord GT Touring', cat: 'CAR', modelType: 'sedan', colorHex: 0x0284c7, accentHex: 0xf8fafc, price: 4500, img: IMG_STARTER_CAR, hue: 200, speed: 74, accel: 70, handle: 76, nitro: 65 },
  { id: 2, name: 'Skyline Coupe RS', cat: 'CAR', modelType: 'super', colorHex: 0x1d4ed8, accentHex: 0x38bdf8, price: 7500, img: IMG_SUPER_CAR, hue: 210, speed: 80, accel: 78, handle: 82, nitro: 74 },
  { id: 3, name: 'Veloce Crimson GT', cat: 'CAR', modelType: 'super', colorHex: 0xdc2626, accentHex: 0xfacc15, price: 11000, img: IMG_SUPER_CAR, hue: 0, speed: 84, accel: 82, handle: 80, nitro: 78 },
  { id: 4, name: 'Mustang Apex V8', cat: 'CAR', modelType: 'super', colorHex: 0xea580c, accentHex: 0x111827, price: 14000, img: IMG_SUPER_CAR, hue: 35, speed: 86, accel: 85, handle: 76, nitro: 82 },
  { id: 5, name: 'Supra Turbo MK5', cat: 'CAR', modelType: 'super', colorHex: 0x059669, accentHex: 0x34d399, price: 18500, img: IMG_SUPER_CAR, hue: 145, speed: 88, accel: 87, handle: 84, nitro: 85 },
  { id: 6, name: 'Porsche 911 Carrera', cat: 'CAR', modelType: 'super', colorHex: 0x0891b2, accentHex: 0xe2e8f0, price: 24000, img: IMG_SUPER_CAR, hue: 185, speed: 90, accel: 89, handle: 90, nitro: 84 },
  { id: 7, name: 'Huracan Evo Spyder', cat: 'CAR', modelType: 'super', colorHex: 0xeab308, accentHex: 0x0f172a, price: 32000, img: IMG_SUPER_CAR, hue: 48, speed: 93, accel: 91, handle: 88, nitro: 88 },
  { id: 8, name: 'McLaren 720S Track', cat: 'CAR', modelType: 'super', colorHex: 0x7c3aed, accentHex: 0xf97316, price: 42000, img: IMG_SUPER_CAR, hue: 270, speed: 95, accel: 93, handle: 92, nitro: 90 },
  { id: 9, name: 'Ferrari SF90 Stradale', cat: 'CAR', modelType: 'super', colorHex: 0xb91c1c, accentHex: 0xfde047, price: 55000, img: IMG_SUPER_CAR, hue: 350, speed: 96, accel: 95, handle: 93, nitro: 92 },
  { id: 10, name: 'Aventador SVJ Nitro', cat: 'CAR', modelType: 'super', colorHex: 0x16a34a, accentHex: 0x111827, price: 70000, img: IMG_SUPER_CAR, hue: 120, speed: 97, accel: 96, handle: 91, nitro: 95 },
  { id: 11, name: 'Koenigsegg Jesko', cat: 'CAR', modelType: 'super', colorHex: 0xf8fafc, accentHex: 0x06b6d4, price: 90000, img: IMG_SUPER_CAR, hue: 195, speed: 99, accel: 98, handle: 94, nitro: 97 },
  { id: 12, name: 'Bugatti Chiron Super', cat: 'CAR', modelType: 'super', colorHex: 0x1e3a8a, accentHex: 0x38bdf8, price: 120000, img: IMG_SUPER_CAR, hue: 230, speed: 100, accel: 99, handle: 95, nitro: 100 },
  { id: 13, name: 'Ranger 4x4 Pickup', cat: 'TRUCK', modelType: 'truck', colorHex: 0x334155, accentHex: 0xf97316, price: 6000, img: IMG_TRUCK, hue: 0, speed: 66, accel: 65, handle: 68, nitro: 70 },
  { id: 14, name: 'Hilux Desert Runner', cat: 'TRUCK', modelType: 'truck', colorHex: 0xb45309, accentHex: 0xfef08a, price: 8500, img: IMG_TRUCK, hue: 30, speed: 70, accel: 68, handle: 72, nitro: 72 },
  { id: 15, name: 'F-150 Raptor SVT', cat: 'TRUCK', modelType: 'truck', colorHex: 0x0369a1, accentHex: 0x0f172a, price: 12500, img: IMG_TRUCK, hue: 190, speed: 75, accel: 74, handle: 73, nitro: 76 },
  { id: 16, name: 'RAM TRX Hellcat', cat: 'TRUCK', modelType: 'truck', colorHex: 0x991b1b, accentHex: 0x1e293b, price: 17000, img: IMG_TRUCK, hue: 340, speed: 80, accel: 79, handle: 70, nitro: 82 },
  { id: 17, name: 'Titan Armored 6x6', cat: 'TRUCK', modelType: 'heavy_truck', colorHex: 0x166534, accentHex: 0xfacc15, price: 23000, img: IMG_TRUCK, hue: 120, speed: 77, accel: 76, handle: 66, nitro: 85 },
  { id: 18, name: 'Baja Trophy Beast', cat: 'TRUCK', modelType: 'truck', colorHex: 0xca8a04, accentHex: 0x0f172a, price: 30000, img: IMG_TRUCK, hue: 45, speed: 84, accel: 82, handle: 78, nitro: 86 },
  { id: 19, name: 'G-Wagon 4x4 Squared', cat: 'TRUCK', modelType: 'heavy_truck', colorHex: 0x1e1b4b, accentHex: 0x38bdf8, price: 40000, img: IMG_TRUCK, hue: 220, speed: 85, accel: 84, handle: 80, nitro: 84 },
  { id: 20, name: 'Monster Titan Crusher', cat: 'TRUCK', modelType: 'heavy_truck', colorHex: 0x6b21a8, accentHex: 0xf97316, price: 52000, img: IMG_TRUCK, hue: 280, speed: 82, accel: 85, handle: 69, nitro: 92 },
  { id: 21, name: 'Cyber Heavy Hauler', cat: 'TRUCK', modelType: 'heavy_truck', colorHex: 0x0f766e, accentHex: 0x2dd4bf, price: 68000, img: IMG_TRUCK, hue: 170, speed: 89, accel: 88, handle: 77, nitro: 95 },
  { id: 22, name: 'Duke 390 Street', cat: 'BIKE', modelType: 'bike', colorHex: 0xf97316, accentHex: 0x0f172a, price: 3500, img: IMG_BIKE, hue: 25, speed: 76, accel: 80, handle: 88, nitro: 70 },
  { id: 23, name: 'Ninja ZX-6R', cat: 'BIKE', modelType: 'bike', colorHex: 0x16a34a, accentHex: 0x0f172a, price: 6500, img: IMG_BIKE, hue: 130, speed: 82, accel: 84, handle: 90, nitro: 76 },
  { id: 24, name: 'Yamaha R1M Carbon', cat: 'BIKE', modelType: 'bike', colorHex: 0x1d4ed8, accentHex: 0xe2e8f0, price: 10500, img: IMG_BIKE, hue: 210, speed: 87, accel: 88, handle: 92, nitro: 82 },
  { id: 25, name: 'GSX-R1000R Pro', cat: 'BIKE', modelType: 'bike', colorHex: 0x0284c7, accentHex: 0xfacc15, price: 15000, img: IMG_BIKE, hue: 185, speed: 89, accel: 90, handle: 91, nitro: 84 },
  { id: 26, name: 'BMW S1000RR', cat: 'BIKE', modelType: 'bike', colorHex: 0xf1f5f9, accentHex: 0xef4444, price: 21000, img: IMG_BIKE, hue: 240, speed: 92, accel: 93, handle: 94, nitro: 86 },
  { id: 27, name: 'Ducati Panigale V4R', cat: 'BIKE', modelType: 'bike', colorHex: 0xdc2626, accentHex: 0x111827, price: 29000, img: IMG_BIKE, hue: 350, speed: 94, accel: 95, handle: 95, nitro: 89 },
  { id: 28, name: 'Aprilia RSV4 Factory', cat: 'BIKE', modelType: 'bike', colorHex: 0x6d28d9, accentHex: 0xf97316, price: 38000, img: IMG_BIKE, hue: 280, speed: 95, accel: 96, handle: 96, nitro: 91 },
  { id: 29, name: 'Kawasaki Ninja H2R', cat: 'BIKE', modelType: 'bike', colorHex: 0x047857, accentHex: 0x22d3ee, price: 54000, img: IMG_BIKE, hue: 165, speed: 99, accel: 98, handle: 93, nitro: 97 },
  { id: 30, name: 'Lightning LS-218 EV', cat: 'BIKE', modelType: 'bike', colorHex: 0xfacc15, accentHex: 0x06b6d4, price: 75000, img: IMG_BIKE, hue: 50, speed: 100, accel: 100, handle: 96, nitro: 100 }
];
