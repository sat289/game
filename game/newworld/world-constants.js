// Shared City Plot Constants & Spiral Grid Coordinates (v35)
export const EIGHT_PLOT_TYPES = new Set(["ground", "audi_showroom", "movie_theater", "imax_theater", "mahindra_showroom", "bmw_showroom", "swamy_school", "dmart_mega", "inorbit_mall", "function_hall", "billionaire_villa"]);

export const FOUR_PLOT_TYPES = new Set([
  "police_station",
  "hospital",
  "school",
  "bus_stand",
  "auto_stand",
  "petrol_bunk",
  "srmt_mall",
  "apple_store",
  "reliance_store",
  "gym",
  "iti_college",
  "dmart",
  "tirumala_temple",
  "hotel_oyo",
  "city_park",
  "library",
  "swimming_pool",
  "hostel",
  "wine_shop",
  "box_cricket",
  "bike_showroom",
  "ff_office",
  "ayyappa_temple",
  "yamaha_showroom",
  "stark_tower",
  "lc_mart",
  "bar_lounge"
]);

export const TWO_PLOT_TYPES = new Set(["photo_studio", "beach_villa_2", "mobile_showroom", "beauty_parlour", "light_house"]);

export const BUILDING_LABELS = {
  house_blue: "🏡 Ivory & Slate Villa",
  house_coral: "🏠 Terracotta & Cream Duplex",
  house_mint: "🏡 Sage & Teak House",
  house_gold: "🏢 Sandstone Luxury Duplex",
  tower_brick: "🏢 5-Floor Brick Balcony Tower",
  tower_cube: "🏢 5-Floor Modern Cube Tower",
  tower_led: "🏢 5-Floor Luxury LED Tower",
  tower_gold: "🏢 6-Floor Golden Glass Penthouse",
  shop: "☕ టీ & టిఫిన్ • SHOP",
  cafe: "☕ కేఫ్ • COFFEE CAFE",
  mobile_shop: "📱 మొబైల్ షాప్ • MOBILE SHOP (1 PLOT)",
  mobile_showroom: "📱 మొబైల్ షోరూమ్ • MEGA MOBILE HUB (2 PLOTS)",
  beauty_parlour: "💄 బ్యూటీ పార్లర్ • LUXURY BEAUTY PARLOUR & SPA (2 PLOTS)",
  light_house: "🚨 లైట్ హౌస్ • COASTAL LIGHT HOUSE (2 PLOTS)",
  swamy_school: "🏫 స్వామి స్కూల్ • SWAMY E.M. HIGH SCHOOL (8 PLOTS)",
  dmart_mega: "🛒 మెగా డి-మార్ట్ • MEGA D-MART HYPERMARKET (8 PLOTS)",
  inorbit_mall: "🏬 ఇనార్బిట్ మాల్ • INORBIT MEGA MALL (8 PLOTS)",
  function_hall: "🎉 ఫంక్షన్ హాల్ • GRAND DJ & FIREWORKS HALL (8 PLOTS)",
  billionaire_villa: "👑 బిలియనీర్ విల్లా • ULTRA-PREMIUM BILLIONAIRE VILLA (8 PLOTS)",
  ff_office: "🎮 ఫ్రీ ఫైర్ ఆఫీస్ • GARENA FREE FIRE 3-FLOOR HQ (4 PLOTS)",
  ayyappa_temple: "🛕 అయ్యప్ప టెంపుల్ • AYYAPPA SWAMY 18 STEPS (4 PLOTS)",
  yamaha_showroom: "🏍️ యమహా షోరూమ్ • YAMAHA RACING SHOWROOM (4 PLOTS)",
  stark_tower: "⚡ స్టార్క్ టవర్ • AVENGERS STARK TOWER (4 PLOTS)",
  lc_mart: "🛒 ఎల్‌సి మార్ట్ • LC MART SUPERMARKET (4 PLOTS)",
  bar_lounge: "🍸 రాయల్ బార్ • BAR & RESTO LOUNGE (4 PLOTS)",
  ice_cream_shop: "🍨 ఐస్ క్రీమ్ షాప్ • ICE CREAM PARLOUR (1 PLOT)",
  veg_shop: "🥬 కూరగాయల షాప్ • FRESH VEGETABLE SHOP (1 PLOT)",
  mahindra_showroom: "🚙 మహీంద్రా షోరూమ్ • MAHINDRA SUV SHOWROOM (8 PLOTS)",
  bmw_showroom: "🏎️ బిఎండబ్ల్యూ షోరూమ్ • BMW LUXURY SHOWROOM (8 PLOTS)",
  tirumala_temple: "🛕 తిరుమల టెంపుల్ • TIRUMALA VENKATESWARA TEMPLE (4 PLOTS)",
  medical_shop: "💊 మెడికల్ షాప్ • 24/7 MEDICAL & PHARMACY (1 PLOT)",
  biryani_point: "🍲 బిర్యానీ పాయింట్ • HYDERABADI DUM BIRYANI (1 PLOT)",
  box_cricket: "🏏 బాక్స్ క్రికెట్ • FLOODLIT BOX CRICKET TURF (4 PLOTS)",
  bike_showroom: "🏍️ బైక్ షోరూమ్ • GT650 & SUPERBIKE HUB (4 PLOTS)",
  hotel_oyo: "🏨 20-ఫ్లోర్ ఓయో • 20-FLOOR OYO ROOMS TOWER (4 PLOTS)",
  hostel: "🏢 హాస్టల్ • BOYS & GIRLS HOSTEL (4 PLOTS)",
  wine_shop: "🍾 వైన్ షాప్ • ROYAL WINES & SPIRITS (4 PLOTS)",
  city_park: "🌳 సిటీ పార్క్ • CENTRAL CITY PARK (4 PLOTS)",
  library: "📚 లైబ్రరీ • GRAND PUBLIC LIBRARY (4 PLOTS)",
  swimming_pool: "🏊 స్విమ్మింగ్ పూల్ • OLYMPIC SWIMMING POOL (4 PLOTS)",
  ground: "🏏 గ్రౌండ్ • MEGA CRICKET STADIUM (8 PLOTS)",
  audi_showroom: "🚘 ఆడి షోరూమ్ • AUDI SHOWROOM (8 PLOTS)",
  beach_villa: "🏖️ బీచ్ విల్లా • BEACH HOUSE VILLA (1 PLOT)",
  beach_villa_2: "🏖️ మెగా బీచ్ విల్లా • MEGA BEACH VILLA (2 PLOTS)",
  movie_theater: "🎭 మూవీ థియేటర్ • REAL IMAX MULTIPLEX (8 PLOTS)",
  imax_theater: "🎬 ఐమాక్స్ 3D • GIANT IMAX DOME (8 PLOTS)",
  dmart: "🛒 డి-మార్ట్ • D-MART HYPERMARKET (4 PLOTS)",
  gym: "🏋️ జిమ్ • FITNESS GYM (4 PLOTS)",
  iti_college: "🏫 ఐటిఐ కాలేజ్ • ITI COLLEGE (4 PLOTS)",
  photo_studio: "📸 ఫోటో స్టూడియో • PHOTO STUDIO (2 PLOTS)",
  school: "🏫 పాఠశాల • GRAND SCHOOL (4 PLOTS)",
  hospital: "🏥 ఆసుపత్రి • SUPER HOSPITAL (4 PLOTS)",
  bus_stand: "🚌 బస్ స్టాండ్ • APSRTC TERMINAL (4 PLOTS)",
  auto_stand: "🛺 ఆటో స్టాండ్ • TRANSPORT OFFICE (4 PLOTS)",
  police_station: "🚓 పోలీస్ స్టేషన్ • POLICE HQ (4 PLOTS)",
  petrol_bunk: "⛽ పెట్రోల్ బంక్ • FUEL PLAZA (4 PLOTS)",
  srmt_mall: "🏬 SRMT మాల్ • SRMT MALL (4 PLOTS)",
  apple_store: "🍎 ఆపిల్ స్టోర్ • APPLE STORE (4 PLOTS)",
  reliance_store: "🛒 రిలయన్స్ • RELIANCE DIGITAL & SMART (4 PLOTS)",
  empty: "OPEN LAND"
};

export function getRequiredSize(type) {
  if (EIGHT_PLOT_TYPES.has(type)) return 8;
  if (FOUR_PLOT_TYPES.has(type)) return 4;
  if (TWO_PLOT_TYPES.has(type)) return 2;
  return 1;
}

const SPIRAL_COORDS = [];
const COORD_TO_BLOCK = new Map();

(function buildSpiralTable(maxBlocks = 1200) {
  for (let i = 0; i < maxBlocks; i++) {
    const n = i + 1; // +1 skips (0,0) -> reserved for ST JUNCTION STATUE!
    let k = Math.ceil((Math.sqrt(n + 1) - 1) / 2);
    let t = 2 * k + 1;
    let m = t * t;
    t -= 1;
    let bx, bz;
    if (n >= m - t) {
      bx = k - (m - n);
      bz = -k;
    } else {
      m -= t;
      if (n >= m - t) {
        bx = -k;
        bz = -k + (m - n);
      } else {
        m -= t;
        if (n >= m - t) {
          bx = -k + (m - n);
          bz = k;
        } else {
          bx = k;
          bz = k - (m - n - t);
        }
      }
    }
    SPIRAL_COORDS.push({ bx, bz });
    COORD_TO_BLOCK.set(`${bx},${bz}`, i);
  }
})();

export function blockIdxToCoord(blockIdx) {
  return SPIRAL_COORDS[blockIdx] || { bx: 1, bz: 0 };
}

export function coordToBlockIdx(bx, bz) {
  const res = COORD_TO_BLOCK.get(`${bx},${bz}`);
  return res === undefined ? -1 : res;
}

export function getBlockPlotIdsByBlockIdx(blockIdx) {
  const base = blockIdx * 4 + 1;
  return {
    blockIdx,
    anchorId: `plot_${String(base).padStart(4, "0")}`,
    siblings: [
      `plot_${String(base).padStart(4, "0")}`,
      `plot_${String(base + 1).padStart(4, "0")}`,
      `plot_${String(base + 2).padStart(4, "0")}`,
      `plot_${String(base + 3).padStart(4, "0")}`
    ]
  };
}

export function getBlockPlotIds(plotId) {
  const num = parseInt(plotId.replace("plot_", ""), 10);
  const blockIdx = Math.floor((num - 1) / 4);
  return getBlockPlotIdsByBlockIdx(blockIdx);
}

/**
 * 2-Plot Side-by-Side Row Helper (faces North road for subIdx 0/1, South road for subIdx 2/3)
 */
export function getTwoPlotGroup(plotId) {
  const num = parseInt(plotId.replace("plot_", ""), 10);
  const idx0 = Math.max(0, num - 1);
  const blockIdx = Math.floor(idx0 / 4);
  const subIdx = idx0 % 4;
  const isNorthRow = subIdx < 2;
  const base = blockIdx * 4 + (isNorthRow ? 1 : 3);
  const pA = `plot_${String(base).padStart(4, "0")}`;
  const pB = `plot_${String(base + 1).padStart(4, "0")}`;
  return {
    blockIdx,
    isNorthRow,
    rotY: isNorthRow ? Math.PI : 0,
    anchorId: pA,
    siblings: [pA, pB]
  };
}

export function getEightPlotGroup(plotId) {
  const num = parseInt(plotId.replace("plot_", ""), 10);
  const blockIdx = Math.floor((num - 1) / 4);
  const { bx, bz } = blockIdxToCoord(blockIdx);

  let rightIdx = coordToBlockIdx(bx + 1, bz);
  let leftIdx = blockIdx;

  if (rightIdx === -1) {
    const prevIdx = coordToBlockIdx(bx - 1, bz);
    if (prevIdx !== -1) {
      leftIdx = prevIdx;
      rightIdx = blockIdx;
    }
  }

  const leftInfo = getBlockPlotIdsByBlockIdx(leftIdx);
  const rightInfo = getBlockPlotIdsByBlockIdx(rightIdx);

  return {
    leftBlockIdx: leftIdx,
    rightBlockIdx: rightIdx,
    anchorId: leftInfo.anchorId,
    partnerAnchorId: rightInfo.anchorId,
    siblings: [...leftInfo.siblings, ...rightInfo.siblings]
  };
}

