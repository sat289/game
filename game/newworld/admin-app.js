import {
  ADMIN_UID,
  db,
  auth,
  ref,
  onValue,
  update,
  remove,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "./firebase-config.js?v=43";
import {
  FollowerTownEngine,
  BUILDING_LABELS,
  getRequiredSize,
  getTwoPlotGroup,
  getBlockPlotIds,
  getEightPlotGroup
} from "./world-engine.js?v=43";

let isAdmin = false;
let selectedPlotId = "plot_0001";
let allPlots = {};
let pendingNewFollowers = [];
let worldSettings = {
  townName: "FOLLOWER NAGARAM",
  dayNumber: 1,
  timeOfDay: "day",
  lifeEnabled: true,
  beachOwner: "@follower_beach",
  railwayOwner: "@_ur_bunny_108_",
  islandOwner: "@vip_island_king",
  heroModels: { statue: "", audi: "", heli: "" },
  weather: "clear",
  fireworks: false
};

const container = document.getElementById("canvas-container");
const adminGate = document.getElementById("admin-gate");
const topHud = document.getElementById("top-hud");
const adminDock = document.getElementById("admin-dock");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const plotCard = document.getElementById("plot-card");
const editBtn = document.getElementById("card-edit-btn");
const beachEditBtn = document.getElementById("card-beach-edit-btn");
const railwayEditBtn = document.getElementById("card-railway-edit-btn");
const replayBuildBtn = document.getElementById("card-replay-build-btn");
const websiteBtn = document.getElementById("card-website-btn");
const sheru3dBtn = document.getElementById("card-sheru3d-btn");
const sketchfabModal = document.getElementById("sketchfab-modal");
const sketchfabIframe = document.getElementById("sketchfab-iframe");
const SKETCHFAB_URL = "https://sketchfab.com/models/011d2f8f40e146ff8b2d7dfc70e939f8/embed?autostart=1&ui_theme=dark";

const panels = {
  builder: document.getElementById("panel-builder"),
  bulk: document.getElementById("panel-bulk"),
  world: document.getElementById("panel-world"),
  requests: document.getElementById("panel-requests")
};

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.add("hidden"), 3200);
}

function closeAllDrawers() {
  Object.values(panels).forEach((p) => p.classList.add("hidden"));
}

async function spawnZonePlotAt(zone, offsetX, offsetZ, rotY = 0) {
  if (!isAdmin) return;
  const newPlotId = `zone_${zone}_${Date.now().toString(36)}`;
  const payload = {
    status: "empty",
    isCustomZone: true,
    zone,
    offsetX: Number(offsetX.toFixed(2)),
    offsetZ: Number(offsetZ.toFixed(2)),
    customRotY: rotY,
    ownerName: "",
    role: "",
    buildingType: "empty",
    size: 1,
    builtDay: worldSettings.dayNumber || 1
  };
  try {
    await update(ref(db), { [`plots/${newPlotId}`]: payload });
    selectedPlotId = newPlotId;
    engine.focusPlot(newPlotId);
    openPlotCard(newPlotId, payload);
    showToast(zone === "airport" ? "✈️ New Airport Plot added! Tap Build to place a house/shop." : "🏖️ New Beach Plot added! Tap Build to place a house/shop.");
  } catch (err) {
    showToast("Error adding plot: " + err.message);
  }
}

function getNextZoneSlot(zone) {
  const existing = Object.values(allPlots).filter((p) => p && p.isCustomZone && p.zone === zone);
  const count = existing.length;
  if (zone === "airport") {
    // Neat rows right along the paved Airport Colony Boulevard (North row facing South road, South row facing North road!)
    const col = count % 7;
    const row = Math.floor(count / 7);
    return {
      offsetX: -28 + col * 9.2,
      offsetZ: row % 2 === 0 ? 58.2 : 70.6,
      rotY: row % 2 === 0 ? Math.PI : 0
    };
  }
  // Spacious Beachside Colony Strip (North & South of Beach Highway, clear of OYO/Hostel/Parking!)
  const beachSlots = [
    { offsetX: 24, offsetZ: -44, rotY: -Math.PI / 2 },
    { offsetX: 24, offsetZ: -32, rotY: -Math.PI / 2 },
    { offsetX: 24, offsetZ: 34,  rotY: -Math.PI / 2 },
    { offsetX: 24, offsetZ: 46,  rotY: -Math.PI / 2 },
    { offsetX: 40, offsetZ: -44, rotY: -Math.PI / 2 },
    { offsetX: 40, offsetZ: -28, rotY: -Math.PI / 2 },
    { offsetX: 40, offsetZ: -12, rotY: -Math.PI / 2 },
    { offsetX: 40, offsetZ: 14,  rotY: -Math.PI / 2 },
    { offsetX: 40, offsetZ: 30,  rotY: -Math.PI / 2 },
    { offsetX: 40, offsetZ: 46,  rotY: -Math.PI / 2 }
  ];
  if (count < beachSlots.length) return beachSlots[count];
  const extra = count - beachSlots.length;
  return {
    offsetX: 56 + Math.floor(extra / 6) * 16,
    offsetZ: -42 + (extra % 6) * 16.5,
    rotY: -Math.PI / 2
  };
}

const engine = new FollowerTownEngine(container, (plotId, data) => {
  if (!isAdmin) return;
  if (plotId === "ADD_AIRPORT_PLOT") {
    const slot = getNextZoneSlot("airport");
    spawnZonePlotAt("airport", slot.offsetX, slot.offsetZ, slot.rotY);
    return;
  }
  if (plotId === "ADD_BEACH_PLOT") {
    const slot = getNextZoneSlot("beach");
    spawnZonePlotAt("beach", slot.offsetX, slot.offsetZ, slot.rotY);
    return;
  }
  selectedPlotId = plotId;
  openPlotCard(plotId, data);
}, { highQuality: true });

engine.onAddPlotTap = (result) => {
  if (!isAdmin) return;
  if (result.blocked) {
    showToast(result.reason || "🚫 Cannot place plot here!");
    return;
  }
  spawnZonePlotAt(result.zone, result.offsetX, result.offsetZ, result.rotY);
};

function openPlotCard(plotId, data) {
  if (plotId === "OUTSKIRTS_STADIUM") {
    document.getElementById("card-badge").textContent = "SE CITY OUTSKIRTS • INTERNATIONAL ARENA";
    document.getElementById("card-owner").textContent = "🏏 SHERU BHAI CRICKET STADIUM";
    document.getElementById("card-role").textContent = "Massive International Cricket Stadium in the city outskirts with Live Updating LED Scoreboard, Towering Floodlights, Multi-Tier Colorful Seats & 22-Yard Pitch!";
    document.getElementById("card-type").textContent = "OUTSKIRTS CRICKET STADIUM";
    document.getElementById("card-day").textContent = "LIVE SCOREBOARD 📺";
    editBtn.classList.add("hidden");
    if (beachEditBtn) beachEditBtn.classList.add("hidden");
    if (railwayEditBtn) railwayEditBtn.classList.add("hidden");
    if (replayBuildBtn) replayBuildBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "ROCKET_PAD") {
    document.getElementById("card-badge").textContent = "ISRO SRIHARIKOTA ZONE • SPACEPORT";
    document.getElementById("card-owner").textContent = "🚀 SHERU BHAI SPACEPORT";
    document.getElementById("card-role").textContent = "Live ISRO-style PSLV/GSLV Rocket Launchpad blasting into space every 24 seconds! Use 🚀 Rocket Cam in Reel Mode for slow-mo liftoff!";
    document.getElementById("card-type").textContent = "LIVE ROCKET LAUNCHPAD";
    document.getElementById("card-day").textContent = "AUTO LAUNCH EVERY 24s 🔥";
    editBtn.classList.add("hidden");
    if (beachEditBtn) beachEditBtn.classList.add("hidden");
    if (railwayEditBtn) railwayEditBtn.classList.add("hidden");
    if (replayBuildBtn) replayBuildBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "VIP_ISLAND") {
    document.getElementById("card-badge").textContent = "RGB SEA BRIDGE • PRIVATE OCEAN ISLAND";
    document.getElementById("card-owner").textContent = `🏝️ ${worldSettings.islandOwner || "@vip_island_king"}`;
    document.getElementById("card-role").textContent = "Exclusive VIP Private Island Mansion connected to Beach via the glowing RGB Cable-Stayed Sea Bridge! Change owner @username in 🌤️ World settings.";
    document.getElementById("card-type").textContent = "VIP ISLAND MANSION";
    document.getElementById("card-day").textContent = "TOP COMMENTER REWARD 👑";
    editBtn.classList.add("hidden");
    if (beachEditBtn) beachEditBtn.classList.add("hidden");
    if (railwayEditBtn) railwayEditBtn.classList.add("hidden");
    if (replayBuildBtn) replayBuildBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "FERRIS_WHEEL") {
    document.getElementById("card-badge").textContent = "BEACH PROMENADE • AMUSEMENT PARK";
    document.getElementById("card-owner").textContent = "🎡 SHERU BHAI GIANT WHEEL";
    document.getElementById("card-role").textContent = "Towering rotating Giant Ferris Wheel with 12 level-stabilized glowing cabins & Beach Mini Amusement Park!";
    document.getElementById("card-type").textContent = "BEACH AMUSEMENT PARK";
    document.getElementById("card-day").textContent = "NIGHT LED SHOW ✨";
    editBtn.classList.add("hidden");
    if (beachEditBtn) beachEditBtn.classList.add("hidden");
    if (railwayEditBtn) railwayEditBtn.classList.add("hidden");
    if (replayBuildBtn) replayBuildBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "HILL_TEMPLE") {
    document.getElementById("card-badge").textContent = "SACRED HILLTOP TEMPLE • ARAKU PEAK";
    document.getElementById("card-owner").textContent = "🛕 SRI VENKATESWARA HILL TEMPLE";
    document.getElementById("card-role").textContent = "Grand Real-Style Mountain Temple beside the Railway Station with 48 Pilgrimage Steps, Devotees Climbing, Winding Ghat Road for Vehicles, River & Radiant Golden Glow!";
    document.getElementById("card-type").textContent = "HILLTOP MAHA TEMPLE";
    document.getElementById("card-day").textContent = "LIVE DIVINE GLOW ✨";
    editBtn.classList.add("hidden");
    if (beachEditBtn) beachEditBtn.classList.add("hidden");
    if (railwayEditBtn) railwayEditBtn.classList.add("hidden");
    if (replayBuildBtn) replayBuildBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

          if (plotId === "RAILWAY_SOUTH") {
    document.getElementById("card-badge").textContent = "ARAKU VALLEY GATE • SOUTH STATION";
    document.getElementById("card-owner").textContent = "🚉 ARAKU SOUTH JN";
    document.getElementById("card-role").textContent = "2nd Opposite-Side 2-Platform Railway Station with Foot Overbridge Steps, Parking & Both Express Trains emerging from the Araku Mountain Tunnels!";
    document.getElementById("card-type").textContent = "SOUTH RAILWAY STATION";
    document.getElementById("card-day").textContent = "";
    editBtn.classList.add("hidden");
    if (beachEditBtn) beachEditBtn.classList.add("hidden");
    if (railwayEditBtn) railwayEditBtn.classList.add("hidden");
  if (replayBuildBtn) replayBuildBtn.classList.toggle("hidden", !(data && data.status === "built"));
    if (replayBuildBtn) replayBuildBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "RAILWAY_STATION") {
    const rOwner = worldSettings.railwayOwner || engine.railwayOwner || "@_ur_bunny_108_";
    document.getElementById("card-badge").textContent = "INDIAN RAILWAYS • LIVE EXPRESS";
    document.getElementById("card-owner").textContent = `🚂 ${rOwner} • SHERU BHAI JN`;
    document.getElementById("card-role").textContent = "2-Platform Railway Station with Foot Overbridge Steps, IN/OUT Station Parking, Direct City Road & 2 Real Trains (Coming & Going through Hollow Mountain Tunnel)!";
    document.getElementById("card-type").textContent = "RAILWAY STATION & TUNNEL";
    document.getElementById("card-day").textContent = "";
    editBtn.classList.add("hidden");
    if (beachEditBtn) beachEditBtn.classList.add("hidden");
    if (railwayEditBtn) railwayEditBtn.classList.remove("hidden");
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (railwayEditBtn) railwayEditBtn.classList.add("hidden");
  if (plotId === "BEACH") {
    const bOwner = worldSettings.beachOwner || engine.beachOwner || "@follower_beach";
    document.getElementById("card-badge").textContent = "GOLDEN SAND BEACH & VILLA";
    document.getElementById("card-owner").textContent = `🏖️ ${bOwner}'s Beach House`;
    document.getElementById("card-role").textContent = "Sheru Bhai chilling on the beach + Luxury Beachfront Villa with your follower's @username!";
    document.getElementById("card-type").textContent = "SHERU BHAI BEACH";
    document.getElementById("card-day").textContent = "";
    editBtn.classList.add("hidden");
    if (beachEditBtn) beachEditBtn.classList.remove("hidden");
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (beachEditBtn) beachEditBtn.classList.add("hidden");
  if (plotId === "AIRPORT") {
    document.getElementById("card-badge").textContent = "20-ACRE INTERNATIONAL AIRPORT";
    document.getElementById("card-owner").textContent = "✈️ SHERU BHAI INTL AIRPORT";
    document.getElementById("card-role").textContent = "Outside City (20 Acres) • Live Shuttle Buses, Passenger Flights & Sheru Bhai arriving in Diamond Car to fly his Diamond Helicopter!";
    document.getElementById("card-type").textContent = "20 ACRES • LIVE FLIGHTS";
    document.getElementById("card-day").textContent = "";
    editBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "ST_JUNCTION") {
    document.getElementById("card-badge").textContent = "CITY CENTER LANDMARK";
    document.getElementById("card-owner").textContent = "🦁 SHERU BHAI • ST JUNCTION";
    document.getElementById("card-role").textContent = "Fixed at City Center • Visitors tap this to open stgames.online!";
    document.getElementById("card-type").textContent = "stgames.online";
    document.getElementById("card-day").textContent = "";
    editBtn.classList.add("hidden");
    websiteBtn.classList.remove("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.remove("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  editBtn.classList.remove("hidden");
  websiteBtn.classList.add("hidden");
  if (sheru3dBtn) sheru3dBtn.classList.add("hidden");

  if (data && data.status === "built") {
    const label = BUILDING_LABELS[data.buildingType] || "TOWN BUILDING";
    const size = data.size || getRequiredSize(data.buildingType);
    document.getElementById("card-badge").textContent = label;
    document.getElementById("card-owner").textContent = data.ownerName || label;
    document.getElementById("card-role").textContent = data.role || "Town Resident";
    document.getElementById("card-type").textContent =
      size === 8
        ? (data.buildingType === "swamy_school" ? "8-PLOT SWAMY E.M. SCHOOL" : data.buildingType === "dmart_mega" ? "8-PLOT MEGA D-MART" : data.buildingType === "inorbit_mall" ? "8-PLOT INORBIT MALL" : data.buildingType === "billionaire_villa" ? "8-PLOT BILLIONAIRE VILLA" : data.buildingType === "function_hall" ? "8-PLOT FUNCTION HALL" : data.buildingType === "imax_theater" ? "8-PLOT IMAX 3D DOME" : data.buildingType === "movie_theater" ? "8-PLOT MOVIE THEATER" : data.buildingType === "mahindra_showroom" ? "8-PLOT MAHINDRA SHOWROOM" : data.buildingType === "bmw_showroom" ? "8-PLOT BMW SHOWROOM" : data.buildingType === "audi_showroom" ? "8-PLOT AUDI SHOWROOM" : "8-PLOT STADIUM")
        : size === 4
        ? (data.buildingType === "tirumala_temple" ? "4-PLOT TIRUMALA TEMPLE" : data.buildingType === "hotel_oyo" ? "20-FLOOR OYO TOWER" : data.buildingType === "hostel" ? "4-PLOT HOSTEL" : data.buildingType === "wine_shop" ? "4-PLOT WINE SHOP" : data.buildingType === "box_cricket" ? "4-PLOT BOX CRICKET" : data.buildingType === "ff_office" ? "4-PLOT FREE FIRE HQ" : data.buildingType === "ayyappa_temple" ? "4-PLOT AYYAPPA TEMPLE" : data.buildingType === "yamaha_showroom" ? "4-PLOT YAMAHA SHOWROOM" : data.buildingType === "stark_tower" ? "4-PLOT STARK TOWER" : data.buildingType === "lc_mart" ? "4-PLOT LC MART" : data.buildingType === "bar_lounge" ? "4-PLOT ROYAL BAR" : data.buildingType === "bike_showroom" ? "4-PLOT BIKE SHOWROOM" : data.buildingType === "swimming_pool" ? "4-PLOT SWIMMING POOL" : data.buildingType === "city_park" ? "4-PLOT CITY PARK" : data.buildingType === "library" ? "4-PLOT LIBRARY" : data.buildingType === "dmart" ? "4-PLOT D-MART" : "4-PLOT LANDMARK")
        : size === 2
        ? (data.buildingType === "light_house" ? "2-PLOT LIGHT HOUSE" : data.buildingType === "beauty_parlour" ? "2-PLOT BEAUTY PARLOUR" : data.buildingType === "mobile_showroom" ? "2-PLOT MOBILE SHOWROOM" : data.buildingType === "beach_villa_2" ? "2-PLOT BEACH VILLA" : "2-PLOT STUDIO")
        : data.buildingType === "ice_cream_shop"
        ? "ICE CREAM SHOP"
        : data.buildingType === "biryani_point"
        ? "DUM BIRYANI POINT"
        : data.buildingType === "medical_shop"
        ? "24/7 MEDICAL SHOP"
        : data.buildingType === "veg_shop"
        ? "VEGETABLE SHOP"
        : data.buildingType === "mobile_shop"
        ? "MOBILE SHOP"
        : data.buildingType === "beach_villa"
        ? "BEACH HOUSE VILLA"
        : data.buildingType.startsWith("tower_")
        ? "5-FLOOR TOWER"
        : "CLASSIC HOUSE";
    document.getElementById("card-day").textContent = `Day ${data.builtDay || 1}`;
  } else {
    document.getElementById("card-badge").textContent = "AVAILABLE PLOT";
    document.getElementById("card-owner").textContent = "Open Land";
    document.getElementById("card-role").textContent = "Tap Build to place a house, 5-floor tower, or landmark";
    document.getElementById("card-type").textContent = "OPEN";
    document.getElementById("card-day").textContent = "";
  }

  document.getElementById("b-owner").value = data?.ownerName || "";
  document.getElementById("b-role").value = data?.role || "";
  document.getElementById("b-type").value = data?.status === "built" ? data.buildingType : "house_blue";
  document.getElementById("b-day").value = data?.builtDay || worldSettings.dayNumber || 1;
  plotCard.classList.remove("hidden");
}


// =========================================================
// 🛡️ v38 BULLETPROOF CLEAR-SPACE & ZERO-DISTURBANCE PLACEMENT ENGINE
// =========================================================
function getMaxExistingGridPlotNum() {
  let maxNum = 36;
  for (const pid of Object.keys(allPlots || {})) {
    if (!pid.startsWith("plot_")) continue;
    const n = parseInt(pid.replace("plot_", ""), 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  }
  return maxNum;
}

function getFootprintForPlot(plotId, reqSize) {
  if (reqSize === 8) return getEightPlotGroup(plotId);
  if (reqSize === 4) return getBlockPlotIds(plotId);
  if (reqSize === 2) return getTwoPlotGroup(plotId);
  return { anchorId: plotId, siblings: [plotId] };
}

/**
 * Maps EVERY occupied grid plotId -> its owning anchor plotId (covering all built 1/2/4/8-plot buildings AND occupied_by_landmark slots).
 */
function buildOccupancyMap() {
  const occ = new Map();
  for (const [pid, p] of Object.entries(allPlots || {})) {
    if (!p || !pid.startsWith("plot_") || p.isCustomZone) continue;
    if (p.status === "built" && p.buildingType && p.buildingType !== "empty") {
      const sz = p.size || getRequiredSize(p.buildingType);
      const grp = getFootprintForPlot(pid, sz);
      for (const sid of grp.siblings) {
        occ.set(sid, grp.anchorId);
      }
      occ.set(pid, grp.anchorId);
    }
  }
  for (const [pid, p] of Object.entries(allPlots || {})) {
    if (!p || !pid.startsWith("plot_") || p.isCustomZone) continue;
    if (p.status === "occupied_by_landmark" && !occ.has(pid)) {
      occ.set(pid, p.parentPlot || pid);
    }
  }
  return occ;
}

function isFootprintValidAndClear(groupInfo, reqSize, occMap, allowedAnchorId = null) {
  if (!groupInfo || !Array.isArray(groupInfo.siblings)) return false;
  const uniqueSibs = new Set(groupInfo.siblings);
  if (uniqueSibs.size !== reqSize) return false;
  if (reqSize === 8) {
    if (
      typeof groupInfo.leftBlockIdx !== "number" ||
      typeof groupInfo.rightBlockIdx !== "number" ||
      groupInfo.leftBlockIdx < 0 ||
      groupInfo.rightBlockIdx < 0 ||
      groupInfo.leftBlockIdx === groupInfo.rightBlockIdx
    ) {
      return false;
    }
  }
  for (const sid of uniqueSibs) {
    if (occMap.has(sid)) {
      const ownerAnchor = occMap.get(sid);
      if (!allowedAnchorId || ownerAnchor !== allowedAnchorId) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Finds the nearest 100% CLEAR, EMPTY footprint of size `reqSize` (1, 2, 4, or 8 plots)
 * without touching or disturbing ANY existing building or landmark!
 */
function findNearestClearFootprint(reqSize = 1, nearPlotId = null, allowedAnchorId = null) {
  const occMap = buildOccupancyMap();
  const maxNum = getMaxExistingGridPlotNum();
  const searchLimit = Math.max(maxNum + 240, 360);

  let tx = 0;
  let tz = 0;
  if (nearPlotId && typeof engine !== "undefined" && engine.getPlotWorldCenter) {
    const c = engine.getPlotWorldCenter(nearPlotId);
    if (c) { tx = c.x; tz = c.z; }
  }

  const step = reqSize === 1 ? 1 : reqSize === 2 ? 2 : 4;
  const seenAnchors = new Set();
  let bestGroup = null;
  let bestDistSq = Infinity;
  let foundAtNum = -1;

  for (let i = 1; i <= searchLimit; i += step) {
    // Once we've found a valid clear spot and checked one extra spiral ring (+80 plots), stop early!
    if (foundAtNum > 0 && i > foundAtNum + 84) break;
    const pid = `plot_${String(i).padStart(4, "0")}`;
    const grp = getFootprintForPlot(pid, reqSize);
    if (seenAnchors.has(grp.anchorId)) continue;
    seenAnchors.add(grp.anchorId);

    if (!isFootprintValidAndClear(grp, reqSize, occMap, allowedAnchorId)) continue;

    // For Inbox Auto-Build (nearPlotId == null), first valid spiral match is already closest to city center!
    if (!nearPlotId) return grp;

    const anchorNum = parseInt(grp.anchorId.replace("plot_", ""), 10) - 1;
    const pos = engine.getPlotPosition(anchorNum);
    const dx = pos.blockCenterX - tx;
    const dz = pos.blockCenterZ - tz;
    const dSq = dx * dx + dz * dz;
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestGroup = grp;
      if (foundAtNum < 0) foundAtNum = i;
    }
  }

  if (bestGroup) return bestGroup;
  // Guaranteed fallback beyond max existing plot on fresh clear land
  const freshStart = Math.ceil((maxNum + 16) / 4) * 4 + 1;
  return getFootprintForPlot(`plot_${String(freshStart).padStart(4, "0")}`, reqSize);
}

function findNextFreePlotId(reservedSet, startNum = 1) {
  let n = startNum;
  while (true) {
    const pid = `plot_${String(n).padStart(4, "0")}`;
    const existing = allPlots[pid];
    if (!reservedSet.has(pid) && (!existing || existing.status === "empty")) {
      reservedSet.add(pid);
      return { plotId: pid, nextNum: n + 1 };
    }
    n++;
  }
}

const plotsRef = ref(db, "plots");
const worldRef = ref(db, "worldSettings");
let initialLoadDone = false;

onValue(plotsRef, (snapshot) => {
  const data = snapshot.val() || {};
  const keys = Object.keys(data);

  engine.syncLandmarkFootprints(data);

  let maxIndex = 36;
  let builtCount = 0;

  keys.forEach((k) => {
    const idx = parseInt(k.replace("plot_", ""), 10);
    if (!isNaN(idx) && idx > maxIndex) maxIndex = idx;
    if (data[k]?.status === "built") builtCount++;
  });

  engine.ensureCapacity(maxIndex + 12);

  // ⚡ INCREMENTAL DIFF + SMOOTH CHUNKED INITIAL LOAD (Zero UI Freeze even at 500+ buildings!)
  const changedKeys = [];
  for (let i = 0; i < keys.length; i++) {
    const plotId = keys[i];
    const prev = allPlots[plotId];
    const curr = data[plotId];
    if (
      !initialLoadDone ||
      !prev ||
      prev.status !== curr?.status ||
      prev.buildingType !== curr?.buildingType ||
      prev.ownerName !== curr?.ownerName ||
      prev.size !== curr?.size ||
      prev.offsetX !== curr?.offsetX ||
      prev.offsetZ !== curr?.offsetZ
    ) {
      changedKeys.push(plotId);
    }
  }

  if (!initialLoadDone && changedKeys.length > 70) {
    // Render city center (first 60 plots) immediately, then stream remaining plots smoothly per frame!
    const immediate = changedKeys.slice(0, 60);
    const deferred = changedKeys.slice(60);
    immediate.forEach((pid) => engine.renderPlot(pid, data[pid], false));
    let cursor = 0;
    const pumpChunk = () => {
      const end = Math.min(cursor + 32, deferred.length);
      for (; cursor < end; cursor++) {
        const pid = deferred[cursor];
        if (allPlots[pid]) engine.renderPlot(pid, allPlots[pid], false);
      }
      if (cursor < deferred.length) requestAnimationFrame(pumpChunk);
    };
    requestAnimationFrame(pumpChunk);
  } else {
    changedKeys.forEach((plotId) => {
      const animate = initialLoadDone && data[plotId]?.status === "built";
      engine.renderPlot(plotId, data[plotId], animate);
    });
  }

  Object.keys(allPlots).forEach((plotId) => {
    if (!data[plotId]) {
      if (plotId.startsWith("zone_")) {
        engine.removeCustomPlot(plotId);
      } else {
        engine.renderPlot(plotId, { status: "empty", buildingType: "empty" }, false);
      }
    }
  });

  allPlots = data;
  initialLoadDone = true;
  document.getElementById("stat-houses").textContent = `${builtCount} Places`;
});

onValue(worldRef, (snapshot) => {
  const val = snapshot.val();
  if (!val) return;
  worldSettings = { ...worldSettings, ...val };
  const name = worldSettings.townName || "FOLLOWER NAGARAM";
  document.getElementById("town-title").textContent = `ADMIN • ${name}`;
  document.getElementById("stat-day").textContent = `Day ${worldSettings.dayNumber || 1}`;
  engine.setTownName(name);
  const bOwner = worldSettings.beachOwner || "@follower_beach";
  engine.setBeachOwner(bOwner);
  const beachInput = document.getElementById("w-beach-owner");
  if (beachInput) beachInput.value = bOwner;
  const rOwner = worldSettings.railwayOwner || "@_ur_bunny_108_";
  engine.setRailwayOwner(rOwner);
  const railInput = document.getElementById("w-railway-owner");
  if (railInput) railInput.value = rOwner;
  const islOwner = worldSettings.islandOwner || "@vip_island_king";
  engine.setIslandOwner(islOwner);
  const islInput = document.getElementById("w-island-owner");
  if (islInput) islInput.value = islOwner;
  const hm = worldSettings.heroModels || { statue: "", audi: "", heli: "" };
  engine.setHeroModelUrls(hm);
  const gs = document.getElementById("w-glb-statue");
  const ga = document.getElementById("w-glb-audi");
  const gh = document.getElementById("w-glb-heli");
  if (gs) gs.value = hm.statue || "";
  if (ga) ga.value = hm.audi || "";
  if (gh) gh.value = hm.heli || "";
  const wWeather = worldSettings.weather || "clear";
  const wFw = Boolean(worldSettings.fireworks);
  engine.setRainEnabled(wWeather === "rain");
  engine.setFireworksEnabled(wFw);
  const wwEl = document.getElementById("w-weather");
  const wfEl = document.getElementById("w-fireworks");
  if (wwEl) wwEl.value = wWeather;
  if (wfEl) wfEl.value = wFw ? "on" : "off";

  engine.setTimeOfDay(worldSettings.timeOfDay || "day");
  engine.lifeEnabled = worldSettings.lifeEnabled !== false;

  document.getElementById("w-name").value = name;
  document.getElementById("w-day").value = worldSettings.dayNumber || 1;
  document.getElementById("w-time").value = worldSettings.timeOfDay || "day";
  document.getElementById("w-life").value = engine.lifeEnabled ? "on" : "off";
});

onAuthStateChanged(auth, (user) => {
  if (user && user.uid === ADMIN_UID) {
    isAdmin = true;
    adminGate.classList.add("hidden");
    topHud.classList.remove("hidden");
    adminDock.classList.remove("hidden");
    showToast("Admin Studio Unlocked");
  } else {
    isAdmin = false;
    adminGate.classList.remove("hidden");
    topHud.classList.add("hidden");
    adminDock.classList.add("hidden");
    plotCard.classList.add("hidden");
    closeAllDrawers();
    if (user && user.uid !== ADMIN_UID) {
      loginError.textContent = "Access Denied: This UID is not authorized.";
      signOut(auth);
    }
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById("admin-email").value.trim(),
      document.getElementById("admin-password").value
    );
  } catch (err) {
    loginError.textContent = err.message;
  }
});

document.getElementById("btn-logout").addEventListener("click", () => signOut(auth));

document.getElementById("btn-save-plot").addEventListener("click", async () => {
  if (!isAdmin || selectedPlotId === "ST_JUNCTION" || selectedPlotId === "AIRPORT" || selectedPlotId === "BEACH" || selectedPlotId === "RAILWAY_STATION" || selectedPlotId === "RAILWAY_SOUTH") return;
  const type = document.getElementById("b-type").value;
  let ownerName = document.getElementById("b-owner").value.trim();
  const role = document.getElementById("b-role").value.trim();
  const builtDay = parseInt(document.getElementById("b-day").value, 10) || 1;

  const isHouseOrTower = type.startsWith("house_") || type.startsWith("tower_") || type.startsWith("beach_villa");
  const newSize = type === "empty" ? 0 : getRequiredSize(type);

  if (type !== "empty" && isHouseOrTower && !ownerName) {
    showToast("Please enter an Instagram @username!");
    return;
  }
  if (ownerName && isHouseOrTower && !ownerName.startsWith("@")) {
    ownerName = "@" + ownerName;
  }

  const currentData = allPlots[selectedPlotId];

  // Special handling for Custom Airport / Beach Zone Plots (`zone_*`)
  if (selectedPlotId.startsWith("zone_") || currentData?.isCustomZone) {
    const zoneMeta = {
      isCustomZone: true,
      zone: currentData?.zone || (selectedPlotId.includes("beach") ? "beach" : "airport"),
      offsetX: currentData?.offsetX || 0,
      offsetZ: currentData?.offsetZ || 0,
      customRotY: currentData?.customRotY || 0
    };
    const updates = {};
    if (type === "empty") {
      // If already empty, remove the custom plot completely; if built, clear back to empty plot!
      if (!currentData || currentData.status !== "built") {
        updates[`plots/${selectedPlotId}`] = null;
      } else {
        updates[`plots/${selectedPlotId}`] = {
          ...zoneMeta,
          status: "empty",
          ownerName: "",
          role: "",
          buildingType: "empty",
          size: 1,
          builtDay
        };
      }
    } else {
      updates[`plots/${selectedPlotId}`] = {
        ...zoneMeta,
        status: "built",
        ownerName: ownerName || BUILDING_LABELS[type] || "Building",
        role: role || (zoneMeta.zone === "beach" ? "Beachfront Resident" : "Airport Colony Resident"),
        buildingType: type,
        size: newSize,
        builtDay
      };
    }
    try {
      await update(ref(db), updates);
      showToast(type === "empty" ? "🚜 Plot cleared!" : `🔨 Built ${ownerName || BUILDING_LABELS[type]} in ${zoneMeta.zone === "beach" ? "Beach" : "Airport"} Zone!`);
      closeAllDrawers();
      if (updates[`plots/${selectedPlotId}`]) {
        engine.focusPlot(selectedPlotId);
        openPlotCard(selectedPlotId, updates[`plots/${selectedPlotId}`]);
      } else {
        plotCard.classList.add("hidden");
      }
    } catch (err) {
      showToast("Error: " + err.message);
    }
    return;
  }

  const oldSize = currentData?.status === "built" ? (currentData.size || getRequiredSize(currentData.buildingType)) : 1;

  const updates = {};
  let relocatedCount = 0;

  if (type === "empty") {
    let toClear = [selectedPlotId];
    if (oldSize === 8) toClear = getEightPlotGroup(selectedPlotId).siblings;
    else if (oldSize === 4) toClear = getBlockPlotIds(selectedPlotId).siblings;
    else if (oldSize === 2) toClear = getTwoPlotGroup(selectedPlotId).siblings;

    toClear.forEach((pid) => {
      updates[`plots/${pid}`] = {
        status: "empty",
        ownerName: "",
        role: "",
        buildingType: "empty",
        size: 1,
        builtDay
      };
    });
  } else if (newSize === 2 || newSize === 4 || newSize === 8) {
    // 🛡️ ZERO-DISTURBANCE PLACEMENT: Never overwrite or move ANY other existing building!
    // If the tapped block has any other building, ONLY move this new landmark to the nearest 100% clear space!
    const occMap = buildOccupancyMap();
    const editingOwnAnchor =
      currentData &&
      currentData.status === "built" &&
      currentData.buildingType !== "empty" &&
      occMap.get(selectedPlotId) === selectedPlotId &&
      oldSize >= newSize;
    const allowedAnchor = editingOwnAnchor ? selectedPlotId : null;

    let groupInfo = getFootprintForPlot(selectedPlotId, newSize);
    if (!isFootprintValidAndClear(groupInfo, newSize, occMap, allowedAnchor)) {
      groupInfo = findNearestClearFootprint(newSize, selectedPlotId, null);
      relocatedCount = -1; // Flag: moved this new landmark smoothly to nearest clear space!
    } else if (editingOwnAnchor && oldSize > newSize) {
      // Only clear own leftover siblings if shrinking an existing landmark in-place
      const oldSibs = getFootprintForPlot(selectedPlotId, oldSize).siblings;
      oldSibs.forEach((sibId) => {
        if (!groupInfo.siblings.includes(sibId)) {
          updates[`plots/${sibId}`] = {
            status: "empty",
            ownerName: "",
            role: "",
            buildingType: "empty",
            size: 1,
            builtDay
          };
        }
      });
    }

    // Ensure the 3D city grid capacity automatically covers the clear footprint!
    const maxSibNum = Math.max(...groupInfo.siblings.map((sid) => parseInt(sid.replace("plot_", ""), 10) || 1));
    engine.ensureCapacity(maxSibNum + 4);

    const defaultRole =
      newSize === 8
        ? (type === "swamy_school" ? "Swamy English Medium High School Campus" : type === "dmart_mega" ? "8-Plot Mega D-Mart Super Hypermarket" : type === "inorbit_mall" ? "8-Plot Inorbit Mega Mall" : type === "billionaire_villa" ? "8-Plot Ultra-Premium Billionaire Villa" : type === "function_hall" ? "8-Plot Grand Function Hall & DJ Convention" : type === "imax_theater" ? "8-Plot IMAX 3D Dome Theater" : type === "movie_theater" ? "8-Plot Multiplex Movie Theater" : type === "mahindra_showroom" ? "8-Plot Mahindra SUV Showroom" : type === "bmw_showroom" ? "8-Plot BMW Luxury Showroom" : type === "audi_showroom" ? "8-Plot Audi Luxury Showroom" : "8-Plot Mega Stadium")
        : newSize === 4
        ? (type === "hotel_oyo" ? "20-Floor OYO Rooms Tower" : type === "hostel" ? "Boys & Girls Hostel" : type === "box_cricket" ? "Floodlit Box Cricket Turf" : type === "bike_showroom" ? "GT650 & Superbike Showroom" : type === "wine_shop" ? "Royal Wine Shop Landmark" : type === "dmart" ? "D-Mart Hypermarket" : type === "gym" ? "Fitness Gym Owner" : "4-Plot Town Landmark")
        : (type === "light_house" ? "2-Plot Coastal Light House" : type === "beauty_parlour" ? "2-Plot Luxury Beauty Parlour & Spa" : type === "mobile_showroom" ? "2-Plot Mega Mobile Showroom" : type === "beach_villa_2" ? "Luxury 2-Plot Beachfront Villa" : "2-Plot Photo Studio");

    const anchorPayload = {
      status: "built",
      ownerName: ownerName || BUILDING_LABELS[type] || "Landmark",
      role: role || defaultRole,
      buildingType: type,
      size: newSize,
      builtDay
    };
    updates[`plots/${groupInfo.anchorId}`] = anchorPayload;

    groupInfo.siblings.forEach((sibId) => {
      if (sibId !== groupInfo.anchorId) {
        updates[`plots/${sibId}`] = {
          status: "occupied_by_landmark",
          parentPlot: groupInfo.anchorId,
          ownerName: "",
          role: "",
          buildingType: "none",
          size: 0
        };
      }
    });

    selectedPlotId = groupInfo.anchorId;
  } else {
    const occMap1 = buildOccupancyMap();
    if (currentData && currentData.status === "occupied_by_landmark") {
      // Never cut a hole inside an existing landmark — place this 1-plot building in the nearest clear plot!
      const clear1 = findNearestClearFootprint(1, selectedPlotId, null);
      selectedPlotId = clear1.anchorId;
      relocatedCount = -1;
      engine.ensureCapacity((parseInt(selectedPlotId.replace("plot_", ""), 10) || 1) + 4);
    } else if (oldSize === 8 || oldSize === 4 || oldSize === 2) {
      const oldSibs =
        oldSize === 8
          ? getEightPlotGroup(selectedPlotId).siblings
          : oldSize === 4
          ? getBlockPlotIds(selectedPlotId).siblings
          : getTwoPlotGroup(selectedPlotId).siblings;
      oldSibs.forEach((sibId) => {
        if (sibId !== selectedPlotId) {
          updates[`plots/${sibId}`] = {
            status: "empty",
            ownerName: "",
            role: "",
            buildingType: "empty",
            size: 1,
            builtDay
          };
        }
      });
    }
    updates[`plots/${selectedPlotId}`] = {
      status: "built",
      ownerName: ownerName || BUILDING_LABELS[type] || "Shop",
      role: role || (isHouseOrTower ? "Follower Resident" : "Local Business"),
      buildingType: type,
      size: 1,
      builtDay
    };
  }

  try {
    await update(ref(db), updates);
    if (type === "empty") {
      showToast("🚜 Land cleared!");
    } else if (relocatedCount === -1) {
      showToast(`✅ Placed ${BUILDING_LABELS[type] || type} in nearest clear space (${selectedPlotId}) — zero buildings disturbed!`);
    } else if (relocatedCount > 0) {
      showToast(`🏗️ Built! Moved ${relocatedCount} houses to free plots.`);
    } else {
      showToast(newSize === 8 ? (type === "swamy_school" ? "🏫 Built Exact 8-Plot Swamy E.M. High School Campus!" : type === "dmart_mega" ? "🛒 Built 8-Plot Mega D-Mart Super Hypermarket!" : type === "inorbit_mall" ? "🏬 Built 8-Plot Inorbit Mega Mall!" : type === "billionaire_villa" ? "👑 Built 8-Plot Ultra-Premium Billionaire Villa with Helipad, Elevator, Pool & Garage!" : type === "function_hall" ? "🎉 Built 8-Plot Grand Function Hall with DJ, Drones, Fireworks & Lunch!" : type === "imax_theater" ? "🎬 Built 8-Plot Giant IMAX 3D Dome with Sky Disco Lights!" : type === "movie_theater" ? "🎭 Built 8-Plot Real Movie Theater with Sky Disco Lights!" : type === "mahindra_showroom" ? "🚙 Built 8-Plot Mahindra SUV Showroom!" : type === "bmw_showroom" ? "🏎️ Built 8-Plot BMW Luxury Showroom!" : type === "audi_showroom" ? "🚘 Built 8-Plot Audi Showroom!" : "🏟️ Built 8-Plot Mega Stadium!") : newSize === 4 ? "🏛️ Built 4-Plot Landmark!" : newSize === 2 ? (type === "light_house" ? "🚨 Built 2-Plot Coastal Light House with 360° Searchlight!" : type === "beauty_parlour" ? "💄 Built 2-Plot Luxury Beauty Parlour & Spa!" : type === "mobile_showroom" ? "📱 Built 2-Plot Mega Mobile Showroom!" : type === "beach_villa_2" ? "🏖️ Built 2-Plot Luxury Beach Villa!" : "📸 Built 2-Plot Photo Studio!") : `🔨 Built ${ownerName}'s plot!`);
    }
    closeAllDrawers();
    engine.focusPlot(selectedPlotId);
    openPlotCard(selectedPlotId, updates[`plots/${selectedPlotId}`]);
  } catch (err) {
    showToast("Error: " + err.message);
  }
});

document.getElementById("btn-fix-overlaps").addEventListener("click", async () => {
  if (!isAdmin) return;
  const updates = {};
  const reservedSet = new Set();
  const landmarks = [];

  Object.entries(allPlots).forEach(([pid, p]) => {
    if (p && p.status === "built") {
      const reqSize = getRequiredSize(p.buildingType);
      if (reqSize >= 2) landmarks.push({ pid, data: p, reqSize });
    }
  });

  if (landmarks.length === 0) return showToast("No multi-plot landmarks found!");

  const getGrp = (pid, sz) => (sz === 8 ? getEightPlotGroup(pid) : sz === 4 ? getBlockPlotIds(pid) : getTwoPlotGroup(pid));

  landmarks.forEach((lm) => {
    const grp = getGrp(lm.pid, lm.reqSize);
    grp.siblings.forEach((s) => reservedSet.add(s));
  });

  let moved = 0;
  let searchStart = 1;

  for (const lm of landmarks) {
    const grp = getGrp(lm.pid, lm.reqSize);

    for (const sibId of grp.siblings) {
      if (sibId === lm.pid) continue;
      const existing = allPlots[sibId];
      if (existing && existing.status === "built" && getRequiredSize(existing.buildingType) === 1) {
        const { plotId: newPid, nextNum } = findNextFreePlotId(reservedSet, searchStart);
        searchStart = nextNum;
        updates[`plots/${newPid}`] = { ...existing, size: 1 };
        moved++;
      }
    }

    updates[`plots/${grp.anchorId}`] = { ...lm.data, size: lm.reqSize };
    grp.siblings.forEach((sibId) => {
      if (sibId !== grp.anchorId) {
        updates[`plots/${sibId}`] = {
          status: "occupied_by_landmark",
          parentPlot: grp.anchorId,
          ownerName: "",
          role: "",
          buildingType: "none",
          size: 0
        };
      }
    });
  }

  try {
    await update(ref(db), updates);
    showToast(`🛠️ Relocated ${moved} overlapping houses to free plots!`);
    closeAllDrawers();
  } catch (err) {
    showToast("Fix error: " + err.message);
  }
});

// Bulk @username House Builder (Uses Classic Houses by default!)
const HOUSE_STYLES = ["house_blue", "house_coral", "house_mint", "house_gold"];

async function buildHousesForUsernames(rawList) {
  const existing = new Set();
  Object.values(allPlots).forEach((p) => {
    if (p?.status === "built" && p.ownerName) {
      existing.add(p.ownerName.toLowerCase().replace(/^@/, ""));
    }
  });

  const updates = {};
  const reserved = new Set([...engine.landmarkCoveredPlots]);
  let searchStart = 1;
  let added = 0;

  for (const raw of rawList) {
    const clean = raw.trim().replace(/^@/, "");
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (existing.has(key)) continue;

    const { plotId, nextNum } = findNextFreePlotId(reserved, searchStart);
    searchStart = nextNum;

    updates[`plots/${plotId}`] = {
      status: "built",
      ownerName: `@${clean}`,
      role: "Follower Resident",
      buildingType: HOUSE_STYLES[added % HOUSE_STYLES.length],
      size: 1,
      builtDay: worldSettings.dayNumber || 1
    };
    existing.add(key);
    added++;
  }

  if (!added) return showToast("All listed @usernames already have houses!");

  await update(ref(db), updates);
  showToast(`🏘️ Built ${added} road-facing follower houses!`);
}

document.getElementById("btn-import-usernames").addEventListener("click", async () => {
  if (!isAdmin) return;
  const names = document
    .getElementById("bulk-usernames")
    .value.split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!names.length) return showToast("Paste at least 1 Instagram @username!");

  try {
    await buildHousesForUsernames(names);
    document.getElementById("bulk-usernames").value = "";
    closeAllDrawers();
  } catch (err) {
    showToast("Sync error: " + err.message);
  }
});

document.getElementById("ig-file-input").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const extracted = new Set();

  if (file.name.endsWith(".json")) {
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : parsed.relationships_followers || [];
      arr.forEach((item) => {
        const u = item?.string_list_data?.[0]?.value || item?.username;
        if (u) extracted.add(u.trim().toLowerCase().replace(/^@/, ""));
      });
    } catch {
      return showToast("Invalid JSON file");
    }
  } else if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    doc.querySelectorAll("a[href*='instagram.com/']").forEach((a) => {
      const u = a.textContent.trim().replace(/^@/, "");
      if (u) extracted.add(u.toLowerCase());
    });
  } else {
    text.split(/\r?\n/).forEach((line) => {
      const u = line.trim().replace(/^@/, "");
      if (u) extracted.add(u.toLowerCase());
    });
  }

  if (extracted.size === 0) return showToast("No Instagram usernames found in file!");

  const townFollowers = new Map();
  Object.entries(allPlots).forEach(([plotId, p]) => {
    if (p?.status === "built" && p.ownerName?.startsWith("@") && getRequiredSize(p.buildingType) === 1) {
      townFollowers.set(p.ownerName.toLowerCase().replace(/^@/, ""), plotId);
    }
  });

  pendingNewFollowers = [...extracted].filter((u) => !townFollowers.has(u));
  const unfollowers = [...townFollowers.entries()].filter(([u]) => !extracted.has(u));

  document.getElementById("diff-results").classList.remove("hidden");
  document.getElementById("diff-new-count").textContent = `${pendingNewFollowers.length} New Followers`;
  document.getElementById("diff-unfollow-count").textContent = `${unfollowers.length} Unfollowed`;

  const btnBuildNew = document.getElementById("btn-build-diff-new");
  if (pendingNewFollowers.length > 0) {
    btnBuildNew.classList.remove("hidden");
    btnBuildNew.textContent = `➕ Build ${pendingNewFollowers.length} New Follower Houses`;
  } else {
    btnBuildNew.classList.add("hidden");
  }

  const listEl = document.getElementById("unfollow-list");
  listEl.innerHTML = "";
  unfollowers.forEach(([uname, plotId]) => {
    const row = document.createElement("div");
    row.className = "unfollow-row";
    row.innerHTML = `
      <span>@${uname}</span>
      <div class="unfollow-actions">
        <button class="mini-btn" data-fly="${plotId}">👁️ Fly</button>
        <button class="mini-btn del" data-del="${plotId}">🚜 Demolish</button>
      </div>
    `;
    listEl.appendChild(row);
  });

  listEl.querySelectorAll("[data-fly]").forEach((btn) => {
    btn.addEventListener("click", () => {
      engine.focusPlot(btn.getAttribute("data-fly"));
      closeAllDrawers();
    });
  });

  listEl.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pid = btn.getAttribute("data-del");
      await update(ref(db, `plots/${pid}`), {
        status: "empty",
        ownerName: "",
        role: "",
        buildingType: "empty",
        size: 1,
        builtDay: worldSettings.dayNumber || 1
      });
      btn.closest(".unfollow-row").remove();
      showToast("🚜 Unfollower house demolished!");
    });
  });
});

document.getElementById("btn-build-diff-new").addEventListener("click", async () => {
  if (!isAdmin || !pendingNewFollowers.length) return;
  try {
    await buildHousesForUsernames(pendingNewFollowers);
    pendingNewFollowers = [];
    document.getElementById("diff-results").classList.add("hidden");
    closeAllDrawers();
  } catch (err) {
    showToast("Error: " + err.message);
  }
});

document.getElementById("btn-save-world").addEventListener("click", async () => {
  if (!isAdmin) return;
  try {
    await update(worldRef, {
      townName: document.getElementById("w-name").value.trim() || "FOLLOWER NAGARAM",
      beachOwner: (document.getElementById("w-beach-owner")?.value.trim() || "@follower_beach"),
      railwayOwner: (document.getElementById("w-railway-owner")?.value.trim() || "@_ur_bunny_108_"),
      islandOwner: (document.getElementById("w-island-owner")?.value.trim() || "@vip_island_king"),
      dayNumber: parseInt(document.getElementById("w-day").value, 10) || 1,
      timeOfDay: document.getElementById("w-time").value,
      lifeEnabled: document.getElementById("w-life").value === "on",
      heroModels: {
        statue: (document.getElementById("w-glb-statue")?.value || "").trim(),
        audi: (document.getElementById("w-glb-audi")?.value || "").trim(),
        heli: (document.getElementById("w-glb-heli")?.value || "").trim()
      },
      weather: document.getElementById("w-weather")?.value || "clear",
      fireworks: (document.getElementById("w-fireworks")?.value || "off") === "on"
    });
    showToast("World updated live!");
    closeAllDrawers();
  } catch (err) {
    showToast("Error: " + err.message);
  }
});

function runSearch() {
  const q = document.getElementById("search-input").value;
  const foundId = engine.findPlotByQuery(q);
  if (foundId === "ST_JUNCTION" || foundId === "AIRPORT" || foundId === "BEACH" || foundId === "RAILWAY_STATION" || foundId === "RAILWAY_SOUTH") {
    engine.focusPlot(foundId);
    openPlotCard(foundId, null);
  } else if (foundId) {
    selectedPlotId = foundId;
    engine.focusPlot(foundId);
    openPlotCard(foundId, allPlots[foundId]);
  } else {
    showToast("Username or landmark not found!");
  }
}

document.getElementById("search-btn").addEventListener("click", runSearch);
document.getElementById("search-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});
document.getElementById("close-plot-card").addEventListener("click", () => plotCard.classList.add("hidden"));
document.getElementById("card-edit-btn").addEventListener("click", () => {
  closeAllDrawers();
  panels.builder.classList.remove("hidden");
});
document.getElementById("btn-open-builder").addEventListener("click", () => {
  closeAllDrawers();
  panels.builder.classList.remove("hidden");
});
document.getElementById("btn-open-bulk").addEventListener("click", () => {
  closeAllDrawers();
  panels.bulk.classList.remove("hidden");
});
document.getElementById("btn-open-world").addEventListener("click", () => {
  closeAllDrawers();
  panels.world.classList.remove("hidden");
});
document.querySelectorAll(".close-drawer").forEach((b) => b.addEventListener("click", closeAllDrawers));

// 9:16 REEL MODE + ⚡ PRO REEL FAST-MOTION TOUR
const reelControls = document.getElementById("reel-controls");
const reelBanner = document.getElementById("reel-spotlight-banner");
const reelTagText = document.getElementById("reel-tag-text");
const reelNameText = document.getElementById("reel-name-text");
const btnProTour = document.getElementById("reel-pro-tour");
const btnDroneView = document.getElementById("reel-drone-view");
const btnBuildReel = document.getElementById("reel-build-tour");

document.getElementById("btn-reel-mode").addEventListener("click", () => {
  closeAllDrawers();
  plotCard.classList.add("hidden");
  document.querySelectorAll(".hud-element").forEach((el) => el.classList.add("hidden"));
  reelControls.classList.remove("hidden");
  engine.setReelFraming(true);
  engine.setQualityMode(true);
  engine.setShadowsEnabled(true);
  engine.enableCinemaBloom(true);
  if (btnHqToggle) { btnHqToggle.classList.add("active"); btnHqToggle.textContent = "✨ Ultra HD"; }
  if (btnShadowsToggle) { btnShadowsToggle.classList.add("active"); btnShadowsToggle.textContent = "☀️ Shadows"; }
  if (btnBloomToggle) { btnBloomToggle.classList.add("active"); btnBloomToggle.textContent = "✨ Bloom"; }
  showToast("✨ Reel Studio: Soft Sun Shadows + Neon Bloom ON!");
});

btnProTour.addEventListener("click", () => {
  if (engine.proReelTour.active) {
    engine.stopProReelTour();
    return;
  }
  btnProTour.classList.add("active");
  btnProTour.textContent = "⏹ Stop Tour";
  engine.startProReelTour(
    allPlots,
    (tag, name) => {
      reelTagText.textContent = tag;
      reelNameText.textContent = name;
      reelBanner.classList.remove("hidden");
      reelBanner.style.animation = "none";
      void reelBanner.offsetWidth;
      reelBanner.style.animation = "popIn 0.25s ease-out";
    },
    () => {
      btnProTour.classList.remove("active");
      btnProTour.textContent = "⚡ Pro Reel";
      reelBanner.classList.add("hidden");
    }
  );
});

btnDroneView.addEventListener("click", () => {
  if (engine.droneTour.active) {
    engine.stopDroneView();
    return;
  }
  btnDroneView.classList.add("active");
  btnDroneView.textContent = "⏹ Stop Drone";
  reelBanner.classList.add("hidden");
  showToast("🚁 HD Drone: Welcome Arch → Lion Statue → Full City!");
  engine.startDroneView(() => {
    btnDroneView.classList.remove("active");
    btnDroneView.textContent = "🚁 Pro Drone";
  });
});

btnBuildReel.addEventListener("click", () => {
  if (engine.buildReelTour.active) {
    engine.stopBuildReelTour();
    return;
  }
  btnBuildReel.classList.add("active");
  btnBuildReel.textContent = "⏹ Stop Build";
  showToast("🏗️ Recording Construction Replay Reel!");
  engine.startBuildReelTour(
    allPlots,
    (tag, name) => {
      reelTagText.textContent = tag;
      reelNameText.textContent = name;
      reelBanner.classList.remove("hidden");
      reelBanner.style.animation = "none";
      void reelBanner.offsetWidth;
      reelBanner.style.animation = "popIn 0.25s ease-out";
    },
    () => {
      btnBuildReel.classList.remove("active");
      btnBuildReel.textContent = "🏗️ Build Reel";
      reelBanner.classList.add("hidden");
    }
  );
});

document.getElementById("reel-exit").addEventListener("click", () => {
  engine.stopAllReelModes();
  engine.setReelFraming(false);
  engine.setShadowsEnabled(false);
  engine.enableCinemaBloom(false);
  engine.setSimSpeed(1.0);
  if (typeof stopCanvasRecording === "function") stopCanvasRecording();
  if (typeof exitCleanScreen === "function") exitCleanScreen();
  reelControls.classList.add("hidden");
  reelBanner.classList.add("hidden");
  document.getElementById("reel-hook-editor")?.classList.add("hidden");
  document.getElementById("reel-shotlist-panel")?.classList.add("hidden");
  topHud.classList.remove("hidden");
  adminDock.classList.remove("hidden");
});

document.getElementById("reel-orbit-toggle").addEventListener("click", () => {
  engine.autoSpin = !engine.autoSpin;
});

document.getElementById("reel-day-toggle").addEventListener("click", () => {
  const order = ["day", "sunset", "night"];
  engine.setTimeOfDay(order[(order.indexOf(engine.timeOfDay) + 1) % order.length]);
});

// Lazy-load Sketchfab 3D Model ONLY when clicked (frees 100% RAM when closed!)
if (sheru3dBtn && sketchfabModal && sketchfabIframe) {
  sheru3dBtn.addEventListener("click", () => {
    sketchfabIframe.src = SKETCHFAB_URL;
    sketchfabModal.classList.remove("hidden");
  });
  const closeSf = document.getElementById("close-sketchfab");
  if (closeSf) {
    closeSf.addEventListener("click", () => {
      sketchfabModal.classList.add("hidden");
      sketchfabIframe.src = "about:blank";
    });
  }
}

// Admin Dock + Reel Mode Quick-Jump to 20-Acre Airport
const btnJumpAirport = document.getElementById("btn-jump-airport");
if (btnJumpAirport) {
  btnJumpAirport.addEventListener("click", () => {
    engine.focusPlot("AIRPORT");
    openPlotCard("AIRPORT", null);
    showToast("✈️ 20-Acre Airport • Live Plane & Sheru Bhai Diamond Heli!");
  });
}

const btnReelAirport = document.getElementById("reel-airport-cam");
if (btnReelAirport) {
  btnReelAirport.addEventListener("click", () => {
    engine.stopProReelTour();
    engine.stopDroneView();
    engine.stopBuildReelTour();
    engine.focusPlot("AIRPORT", 0.14);
    showToast("✈️ Airport Reel Cam Active!");
  });
}

// Admin Beach Quick-Jump, Reel Cam & Beach House @username Shortcut
const btnJumpBeach = document.getElementById("btn-jump-beach");
if (btnJumpBeach) {
  btnJumpBeach.addEventListener("click", () => {
    engine.focusPlot("BEACH");
    openPlotCard("BEACH", null);
    showToast("🏖️ Sheru Bhai Beach & Follower Beach Villa!");
  });
}

const btnReelBeach = document.getElementById("reel-beach-cam");
if (btnReelBeach) {
  btnReelBeach.addEventListener("click", () => {
    engine.stopProReelTour();
    engine.stopDroneView();
    engine.stopBuildReelTour();
    engine.focusPlot("BEACH", 0.14);
    showToast("🏖️ Beach Reel Cam Active!");
  });
}

if (beachEditBtn) {
  beachEditBtn.addEventListener("click", () => {
    closeAllDrawers();
    panels.world.classList.remove("hidden");
    const bi = document.getElementById("w-beach-owner");
    if (bi) {
      bi.focus();
      bi.select();
    }
    showToast("✏️ Enter follower @username & tap Save World Live!");
  });
}

// Admin Railway Quick-Jump, Reel Cam & Station Chief Shortcut
const btnJumpRailway = document.getElementById("btn-jump-railway");
if (btnJumpRailway) {
  btnJumpRailway.addEventListener("click", () => {
    engine.focusPlot("RAILWAY_STATION");
    openPlotCard("RAILWAY_STATION", null);
    showToast("🚂 Sheru Bhai Jn • Live Train & Mountain Tunnel!");
  });
}

const btnReelRailway = document.getElementById("reel-railway-cam");
if (btnReelRailway) {
  btnReelRailway.addEventListener("click", () => {
    engine.stopProReelTour();
    engine.stopDroneView();
    engine.stopBuildReelTour();
    engine.focusPlot("RAILWAY_STATION", 0.14);
    showToast("🚂 Railway Reel Cam Active!");
  });
}

if (railwayEditBtn) {
  railwayEditBtn.addEventListener("click", () => {
    closeAllDrawers();
    panels.world.classList.remove("hidden");
    const ri = document.getElementById("w-railway-owner");
    if (ri) {
      ri.focus();
      ri.select();
    }
    showToast("✏️ Enter Railway Station @username & tap Save World Live!");
  });
}

// ➕ ADD PLOT MODE TOGGLE (Tap open land at Airport or Beach to spawn buildable plots!)
const btnAddPlotMode = document.getElementById("btn-add-plot-mode");
const addPlotBanner = document.getElementById("add-plot-banner");
const btnExitAddPlot = document.getElementById("btn-exit-add-plot");

function setAddPlotMode(active) {
  engine.addPlotMode = active;
  if (btnAddPlotMode) btnAddPlotMode.classList.toggle("active", active);
  if (addPlotBanner) addPlotBanner.classList.toggle("hidden", !active);
  if (active) {
    closeAllDrawers();
    plotCard.classList.add("hidden");
    showToast("📍 Add Plot Mode ON: Tap Airport or Beach land (or glowing + pads)!");
  }
}

if (btnAddPlotMode) {
  btnAddPlotMode.addEventListener("click", () => {
    setAddPlotMode(!engine.addPlotMode);
  });
}
if (btnExitAddPlot) {
  btnExitAddPlot.addEventListener("click", () => setAddPlotMode(false));
}

// 🏗️ Single-Building Cinema Construction Replay directly from Plot Card!
if (replayBuildBtn) {
  replayBuildBtn.addEventListener("click", () => {
    if (!selectedPlotId || !allPlots[selectedPlotId] || allPlots[selectedPlotId].status !== "built") return;
    plotCard.classList.add("hidden");
    closeAllDrawers();
    engine.startSingleBuildReel(selectedPlotId, allPlots[selectedPlotId]);
    showToast("🏗️ Recording Cinema Construction Replay!");
  });
}

// =========================================================
// 🎬 PRO REEL STUDIO v22 CONTROLS (ADMIN PAGE ONLY!)
// =========================================================
const reelDockWrap = document.getElementById("reel-dock-wrap");
const reelFrameGuide = document.getElementById("reel-frame-guide");
const reelSafezone = document.getElementById("reel-safezone");
const reelCountdown = document.getElementById("reel-countdown");
const reelRecBadge = document.getElementById("reel-rec-badge");
const reelRecTimer = document.getElementById("reel-rec-timer");
const reelHookEditor = document.getElementById("reel-hook-editor");
const reelShotlistPanel = document.getElementById("reel-shotlist-panel");

const btnTrainCam = document.getElementById("reel-train-cam");
const btnVipCam = document.getElementById("reel-vip-cam");
const btnFlightCam = document.getElementById("reel-flight-cam");
const btnTimelapse = document.getElementById("reel-timelapse-btn");
const btn24hSky = document.getElementById("reel-24h-btn");
const btnRandomVip = document.getElementById("reel-random-btn");
const btnDiscoOutro = document.getElementById("reel-disco-btn");
const btnStreetWalk = document.getElementById("reel-street-btn");
const btnQueueOpen = document.getElementById("reel-queue-btn");

const btnRecCanvas = document.getElementById("reel-rec-btn");
const btnHqToggle = document.getElementById("reel-hq-btn");
const btnShadowsToggle = document.getElementById("reel-shadows-btn");
const btnBloomToggle = document.getElementById("reel-bloom-btn");
const btnClean321 = document.getElementById("reel-clean-btn");
const btnSimSpeed = document.getElementById("reel-speed-btn");
const btnSmoothTime = document.getElementById("reel-smooth-time");
const btnHookToggle = document.getElementById("reel-hook-btn");
const btnSafezoneToggle = document.getElementById("reel-safezone-btn");

function showReelBanner(tag, name) {
  reelTagText.textContent = tag;
  reelNameText.textContent = name;
  reelBanner.classList.remove("hidden");
  reelBanner.style.animation = "none";
  void reelBanner.offsetWidth;
  reelBanner.style.animation = "popIn 0.25s ease-out";
}

function resetModeButtons() {
  if (btnTrainCam) { btnTrainCam.classList.remove("active"); btnTrainCam.textContent = "🚂 Train Cam"; }
  if (btnVipCam) { btnVipCam.classList.remove("active"); btnVipCam.textContent = "💎 VIP Cam"; }
  if (btnFlightCam) { btnFlightCam.classList.remove("active"); btnFlightCam.textContent = "✈️ Flight Cam"; }
  if (btnTimelapse) { btnTimelapse.classList.remove("active"); btnTimelapse.textContent = "📈 Timelapse"; }
  if (btn24hSky) { btn24hSky.classList.remove("active"); btn24hSky.textContent = "⏱️ 24H Sky"; }
  if (btnRandomVip) { btnRandomVip.classList.remove("active"); btnRandomVip.textContent = "🎲 VIP Pick"; }
  if (btnDiscoOutro) { btnDiscoOutro.classList.remove("active"); btnDiscoOutro.textContent = "🪩 Disco Outro"; }
  if (btnStreetWalk) { btnStreetWalk.classList.remove("active"); btnStreetWalk.textContent = "🚶 Street POV"; }
  const bto = document.getElementById("reel-temple-orbit"); if (bto) { bto.classList.remove("active"); bto.textContent = "✨ Temple Orbit"; }
  const brc = document.getElementById("reel-rocket-cam"); if (brc) { brc.classList.remove("active"); brc.textContent = "🚀 Rocket Cam"; }
  [
    ["reel-mega-btn", "🎬 Mega Reel"],
    ["reel-mansion-btn", "👑 Mansion Reel"],
    ["reel-skydrop-btn", "⚡ Sky Drop"],
    ["reel-beachsweep-btn", "🎡 Beach Sweep"],
    ["reel-stadiumreel-btn", "🏏 Stadium Orbit"],
    ["reel-hero360-btn", "🔄 Hero 360°"]
  ].forEach(([id, lbl]) => {
    const el = document.getElementById(id);
    if (el) { el.classList.remove("active"); el.textContent = lbl; }
  });
}

// 1. 🚂 Train Chase Cam (Toggles Train 1 WAP-7 -> Train 2 Vande Bharat -> Stop!)
let trainCamIdx = 0;
if (btnTrainCam) {
  btnTrainCam.addEventListener("click", () => {
    if (engine.chaseCam.active && engine.chaseCam.mode === "train1") {
      trainCamIdx = 2;
      btnTrainCam.textContent = "🚄 Vande Cam";
      showToast("🚄 Chasing Vande Bharat Express!");
      engine.startChaseCam("train2", () => resetModeButtons());
      return;
    }
    if (engine.chaseCam.active && engine.chaseCam.mode === "train2") {
      engine.stopChaseCam();
      resetModeButtons();
      return;
    }
    resetModeButtons();
    trainCamIdx = 1;
    btnTrainCam.classList.add("active");
    btnTrainCam.textContent = "🚂 WAP-7 (Tap: Vande)";
    showToast("🚂 Chasing Indian Express through Mountain Tunnels!");
    engine.startChaseCam("train1", () => resetModeButtons());
  });
}

// 2. 💎 Sheru Bhai VIP Chase Cam (Diamond Car -> Red Carpet -> Diamond Helicopter!)
if (btnVipCam) {
  btnVipCam.addEventListener("click", () => {
    if (engine.chaseCam.active && engine.chaseCam.mode === "vip") {
      engine.stopChaseCam();
      resetModeButtons();
      return;
    }
    resetModeButtons();
    btnVipCam.classList.add("active");
    btnVipCam.textContent = "⏹ Stop VIP";
    showToast("💎 Tracking Sheru Bhai (Diamond Car & Diamond Helicopter)!");
    engine.startChaseCam("vip", () => resetModeButtons());
  });
}

// 3. ✈️ Flight Takeoff Cam
if (btnFlightCam) {
  btnFlightCam.addEventListener("click", () => {
    if (engine.chaseCam.active && engine.chaseCam.mode === "flight") {
      engine.stopChaseCam();
      resetModeButtons();
      return;
    }
    resetModeButtons();
    btnFlightCam.classList.add("active");
    btnFlightCam.textContent = "⏹ Stop Flight";
    showToast("✈️ Tracking Commercial Flight Takeoff & City Loop!");
    engine.startChaseCam("flight", () => resetModeButtons());
  });
}

// 4. 📈 City Growth Timelapse (Day 1 -> Today!)
if (btnTimelapse) {
  btnTimelapse.addEventListener("click", () => {
    if (engine.timelapseState.active) {
      engine.stopGrowthTimelapse();
      resetModeButtons();
      reelBanner.classList.add("hidden");
      return;
    }
    resetModeButtons();
    btnTimelapse.classList.add("active");
    btnTimelapse.textContent = "⏹ Stop Lapse";
    showToast("📈 Playing Day 1 → Today City Growth Timelapse!");
    engine.startGrowthTimelapse(
      allPlots,
      (tag, name) => showReelBanner(tag, name),
      () => {
        resetModeButtons();
        reelBanner.classList.add("hidden");
      }
    );
  });
}

// 5. ⏱️ 24-Hour Skyline Hyperlapse
if (btn24hSky) {
  btn24hSky.addEventListener("click", () => {
    if (engine.hyperlapse24h.active) {
      engine.stop24HourHyperlapse();
      resetModeButtons();
      return;
    }
    resetModeButtons();
    btn24hSky.classList.add("active");
    btn24hSky.textContent = "⏹ Stop 24H";
    showToast("⏱️ 24-Hour Skyline Hyperlapse Active!");
    engine.start24HourHyperlapse(() => resetModeButtons());
  });
}

// 6. 🎲 Random Follower Spotlight Roulette
if (btnRandomVip) {
  btnRandomVip.addEventListener("click", () => {
    if (engine.buildReelTour.active) {
      engine.stopBuildReelTour();
      resetModeButtons();
      reelBanner.classList.add("hidden");
      return;
    }
    resetModeButtons();
    btnRandomVip.classList.add("active");
    btnRandomVip.textContent = "🎲 Picking...";
    engine.startRandomFollowerReel(
      allPlots,
      (tag, name) => showReelBanner(tag, name),
      () => {
        resetModeButtons();
        reelBanner.classList.add("hidden");
      }
    );
  });
}

// 7. 🪩 Disco Statue Night Crane Outro
if (btnDiscoOutro) {
  btnDiscoOutro.addEventListener("click", () => {
    if (engine.discoOutro.active) {
      engine.stopDiscoOutro();
      resetModeButtons();
      return;
    }
    resetModeButtons();
    btnDiscoOutro.classList.add("active");
    btnDiscoOutro.textContent = "⏹ Stop Outro";
    showToast("🪩 Disco Statue Night Crane Shot!");
    engine.startDiscoOutro(() => resetModeButtons());
  });
}

// 8. 🚶 Street-Level Walk POV
if (btnStreetWalk) {
  btnStreetWalk.addEventListener("click", () => {
    if (engine.streetWalk.active) {
      engine.stopStreetWalk();
      resetModeButtons();
      return;
    }
    resetModeButtons();
    btnStreetWalk.classList.add("active");
    btnStreetWalk.textContent = "⏹ Stop Walk";
    showToast("🚶 Street-Level Walk POV Active!");
    engine.startStreetWalk(() => resetModeButtons());
  });
}

// 9. ⚡ Speed & Slow-Mo Toggle (0.5x / 1x / 2x)
const speedSteps = [1.0, 0.5, 2.0];
let speedStepIdx = 0;
if (btnSimSpeed) {
  btnSimSpeed.addEventListener("click", () => {
    speedStepIdx = (speedStepIdx + 1) % speedSteps.length;
    const sp = speedSteps[speedStepIdx];
    engine.setSimSpeed(sp);
    btnSimSpeed.textContent = sp === 0.5 ? "🐢 0.5x" : sp === 2.0 ? "⚡ 2x" : "⚡ 1x";
    showToast(sp === 0.5 ? "🐢 Cinematic Slow-Mo (0.5x)" : sp === 2.0 ? "⚡ Hyperlapse Speed (2x)" : "▶️ Normal Speed (1x)");
  });
}

// 10. 🌅 Smooth 2.4s Day -> Sunset -> Night Sky Fade
if (btnSmoothTime) {
  btnSmoothTime.addEventListener("click", () => {
    const order = ["day", "sunset", "night"];
    const next = order[(order.indexOf(engine.timeOfDay) + 1) % order.length];
    engine.transitionTimeOfDay(next, 2.4);
    showToast(next === "night" ? "🌙 Fading smoothly to Disco Night..." : next === "sunset" ? "🌇 Fading to Golden Sunset..." : "☀️ Fading to Sunny Day...");
  });
}

// 11. 📐 Instagram Safe-Zone Overlay Toggle
if (btnSafezoneToggle && reelSafezone) {
  btnSafezoneToggle.addEventListener("click", () => {
    const nowHidden = reelSafezone.classList.toggle("hidden");
    btnSafezoneToggle.classList.toggle("active", !nowHidden);
  });
}

// 12. 📝 Quick Editable Hook Banner
if (btnHookToggle && reelHookEditor) {
  btnHookToggle.addEventListener("click", () => {
    reelShotlistPanel?.classList.add("hidden");
    reelHookEditor.classList.toggle("hidden");
  });
  document.getElementById("btn-apply-hook")?.addEventListener("click", () => {
    const t = document.getElementById("hook-tag-input")?.value.trim() || "SHERU BHAI CITY";
    const h = document.getElementById("hook-title-input")?.value.trim() || "NEW UPDATE LIVE!";
    showReelBanner(t, h);
    reelHookEditor.classList.add("hidden");
  });
  document.getElementById("btn-clear-hook")?.addEventListener("click", () => {
    reelBanner.classList.add("hidden");
    reelHookEditor.classList.add("hidden");
  });
  document.getElementById("btn-close-hook")?.addEventListener("click", () => {
    reelHookEditor.classList.add("hidden");
  });
}

// 13. 👻 Auto-Hide Clean Screen + 3-2-1 Countdown (Double-tap anywhere to restore!)
let isCleanScreen = false;
let lastTapTime = 0;

function exitCleanScreen() {
  if (!isCleanScreen) return;
  isCleanScreen = false;
  reelControls.classList.remove("clean-active");
  reelDockWrap?.classList.remove("hidden");
  reelFrameGuide?.classList.remove("hidden");
  showToast("🎬 Studio Controls Restored");
}

if (btnClean321 && reelCountdown) {
  btnClean321.addEventListener("click", () => {
    reelHookEditor?.classList.add("hidden");
    reelShotlistPanel?.classList.add("hidden");
    reelSafezone?.classList.add("hidden");
    btnSafezoneToggle?.classList.remove("active");

    let count = 3;
    reelCountdown.textContent = String(count);
    reelCountdown.classList.remove("hidden");
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        reelCountdown.textContent = String(count);
      } else {
        clearInterval(timer);
        reelCountdown.classList.add("hidden");
        isCleanScreen = true;
        reelControls.classList.add("clean-active");
        reelDockWrap?.classList.add("hidden");
        reelFrameGuide?.classList.add("hidden");
      }
    }, 850);
  });
}

window.addEventListener("pointerup", () => {
  if (!isCleanScreen) return;
  const now = Date.now();
  if (now - lastTapTime < 340) {
    exitCleanScreen();
  }
  lastTapTime = now;
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isCleanScreen) exitCleanScreen();
});

// 14. 🔴 Built-In Pure Canvas Video Recorder (MediaRecorder + captureStream)
let mediaRecorder = null;
let recordedChunks = [];
let recStartTime = 0;
let recInterval = null;

function stopCanvasRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  if (recInterval) {
    clearInterval(recInterval);
    recInterval = null;
  }
  reelRecBadge?.classList.add("hidden");
  if (btnRecCanvas) {
    btnRecCanvas.classList.remove("active");
    btnRecCanvas.textContent = "🔴 REC HD";
  }
}

if (btnRecCanvas) {
  btnRecCanvas.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      stopCanvasRecording();
      showToast("💾 Saving Reel video...");
      return;
    }

    const canvas = engine.renderer?.domElement;
    if (!canvas || typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
      showToast("⚠️ Use phone Screen Recorder with 👻 Clean 3-2-1 on this browser!");
      return;
    }

    try {
      // Automatically ensure Ultra HD sharpness before starting recording!
      engine.setQualityMode(true);
      const stream = canvas.captureStream(60);
      const mimeTypes = [
        "video/mp4;codecs=avc1",
        "video/mp4",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm"
      ];
      const chosenMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "";
      recordedChunks = [];
      mediaRecorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime, videoBitsPerSecond: 12000000 })
        : new MediaRecorder(stream, { videoBitsPerSecond: 12000000 });

      mediaRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordedChunks.push(ev.data);
      };
      mediaRecorder.onstop = () => {
        if (recordedChunks.length === 0) return;
        const ext = chosenMime.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(recordedChunks, { type: chosenMime || "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sheru-bhai-city-reel-${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        showToast("🎉 Reel video downloaded!");
      };

      mediaRecorder.start(400);
      recStartTime = Date.now();
      btnRecCanvas.classList.add("active");
      btnRecCanvas.textContent = "⏹ Stop REC";
      reelRecBadge?.classList.remove("hidden");
      if (reelRecTimer) reelRecTimer.textContent = "REC 0:00";

      recInterval = setInterval(() => {
        const secs = Math.floor((Date.now() - recStartTime) / 1000);
        const mm = Math.floor(secs / 60);
        const ss = String(secs % 60).padStart(2, "0");
        if (reelRecTimer) reelRecTimer.textContent = `REC ${mm}:${ss}`;
      }, 500);
      showToast("🔴 Ultra HD 60fps Canvas Recording Started!");
    } catch (err) {
      showToast("REC error: " + err.message);
    }
  });
}

// 15. 🎞️ Custom Shot-List Queue Picker ("Pick Today's Commenters")
const selectedShotQueue = [];

function renderShotlistItems(filterText = "") {
  const box = document.getElementById("shotlist-items");
  const countEl = document.getElementById("shotlist-count");
  if (!box) return;
  const q = filterText.trim().toLowerCase();

  const allItems = [
    { id: "ST_JUNCTION", label: "🦁 Sheru Bhai Lion Statue", sub: "CENTER", day: 0 },
    { id: "AIRPORT", label: "✈️ 20-Acre Airport & Diamond Heli", sub: "AIRPORT", day: 0 },
    { id: "BEACH", label: "🏖️ Sheru Bhai Beach & Villa", sub: "BEACH", day: 0 },
    { id: "RAILWAY_STATION", label: "🚂 North Railway Station", sub: "STATION 1", day: 0 },
    { id: "RAILWAY_SOUTH", label: "🚉 Araku South Station", sub: "STATION 2", day: 0 },
    { id: "HILL_TEMPLE", label: "🛕 Sacred Hilltop Temple Mountain", sub: "HILL TEMPLE", day: 0 },
    { id: "ROCKET_PAD", label: "🚀 ISRO Rocket Launchpad", sub: "SPACEPORT", day: 0 },
    { id: "VIP_ISLAND", label: "🌉 RGB Sea Bridge & VIP Island", sub: "VIP ISLAND", day: 0 },
    { id: "FERRIS_WHEEL", label: "🎡 Beach Giant Ferris Wheel", sub: "GIANT WHEEL", day: 0 },
    { id: "OUTSKIRTS_STADIUM", label: "🏏 Outskirts International Stadium", sub: "LIVE CRICKET", day: 0 }
  ];

  const builtPlots = [];
  Object.entries(allPlots || {}).forEach(([pid, p]) => {
    if (!p || p.status !== "built") return;
    builtPlots.push({
      id: pid,
      label: p.ownerName || BUILDING_LABELS[p.buildingType] || pid,
      sub: `Day ${p.builtDay || 1} • ${BUILDING_LABELS[p.buildingType] || p.buildingType}`,
      day: p.builtDay || 1
    });
  });
  builtPlots.sort((a, b) => b.day - a.day);

  const combined = [...allItems, ...builtPlots].filter(
    (it) => !q || it.label.toLowerCase().includes(q) || it.sub.toLowerCase().includes(q)
  );

  box.innerHTML = "";
  combined.slice(0, 80).forEach((item) => {
    const isSel = selectedShotQueue.some((s) => s.id === item.id);
    const row = document.createElement("label");
    row.className = "shot-item" + (isSel ? " selected" : "");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = isSel;
    cb.addEventListener("change", () => {
      const idx = selectedShotQueue.findIndex((s) => s.id === item.id);
      if (cb.checked && idx === -1) {
        selectedShotQueue.push(item);
      } else if (!cb.checked && idx !== -1) {
        selectedShotQueue.splice(idx, 1);
      }
      row.classList.toggle("selected", cb.checked);
      if (countEl) countEl.textContent = `${selectedShotQueue.length} shots selected`;
    });
    const spanLbl = document.createElement("span");
    spanLbl.textContent = item.label;
    const spanSub = document.createElement("span");
    spanSub.className = "shot-sub";
    spanSub.textContent = item.sub;
    row.append(cb, spanLbl, spanSub);
    box.appendChild(row);
  });

  if (countEl) countEl.textContent = `${selectedShotQueue.length} shots selected`;
}

if (btnQueueOpen && reelShotlistPanel) {
  btnQueueOpen.addEventListener("click", () => {
    reelHookEditor?.classList.add("hidden");
    const willOpen = reelShotlistPanel.classList.contains("hidden");
    reelShotlistPanel.classList.toggle("hidden");
    if (willOpen) renderShotlistItems(document.getElementById("shotlist-search")?.value || "");
  });
  document.getElementById("btn-close-shotlist")?.addEventListener("click", () => {
    reelShotlistPanel.classList.add("hidden");
  });
  document.getElementById("shotlist-search")?.addEventListener("input", (e) => {
    renderShotlistItems(e.target.value);
  });
  document.getElementById("btn-clear-shotlist")?.addEventListener("click", () => {
    selectedShotQueue.length = 0;
    renderShotlistItems(document.getElementById("shotlist-search")?.value || "");
  });
  document.getElementById("btn-play-shotlist")?.addEventListener("click", () => {
    if (selectedShotQueue.length === 0) {
      showToast("Pick at least 1 plot or landmark first!");
      return;
    }
    const doBuild = document.getElementById("shotlist-replay-build")?.checked !== false;
    reelShotlistPanel.classList.add("hidden");
    showToast(`🎞️ Playing ${selectedShotQueue.length} Custom Shots!`);
    engine.startCustomShotList(
      [...selectedShotQueue],
      doBuild,
      (tag, name) => showReelBanner(tag, name),
      () => {
        reelBanner.classList.add("hidden");
        showToast("✅ Custom Shot List Complete!");
      }
    );
  });
}

// ✨ ULTRA HD / LITE QUALITY TOGGLE IN REEL STUDIO
if (btnHqToggle) {
  btnHqToggle.addEventListener("click", () => {
    const nextHQ = !engine.hqMode;
    engine.setQualityMode(nextHQ);
    btnHqToggle.classList.toggle("active", nextHQ);
    btnHqToggle.textContent = nextHQ ? "✨ Ultra HD" : "⚡ Lite";
    showToast(nextHQ ? "✨ Ultra HD Screen Quality ON (2x Retina)" : "⚡ Lite Battery Mode ON");
  });
}

// ☀️ REAL SOFT SUN SHADOWS TOGGLE (Admin Reel Mode Only!)
if (btnShadowsToggle) {
  btnShadowsToggle.addEventListener("click", () => {
    const next = !engine.shadowsEnabled;
    engine.setShadowsEnabled(next);
    btnShadowsToggle.classList.toggle("active", next);
    btnShadowsToggle.textContent = next ? "☀️ Shadows" : "☀️ Shadows OFF";
    showToast(next ? "☀️ Real Soft Sun Shadows ON!" : "☀️ Sun Shadows OFF");
  });
}

// ✨ NEON CINEMA BLOOM / GLOW TOGGLE (Admin Reel Mode Only!)
if (btnBloomToggle) {
  btnBloomToggle.addEventListener("click", async () => {
    const next = !engine.bloomEnabled;
    await engine.enableCinemaBloom(next);
    btnBloomToggle.classList.toggle("active", engine.bloomEnabled);
    btnBloomToggle.textContent = engine.bloomEnabled ? "✨ Bloom" : "✨ Bloom OFF";
    showToast(engine.bloomEnabled ? "✨ Neon Cinema Bloom Glow ON!" : "✨ Bloom Glow OFF");
  });
}

const btnReelTemple = document.getElementById("reel-temple-cam");
if (btnReelTemple) {
  btnReelTemple.addEventListener("click", () => {
    engine.stopAllReelModes();
    engine.focusPlot("HILL_TEMPLE", 0.12);
    showToast("🛕 Sacred Hilltop Temple Mountain & Pilgrimage Steps!");
  });
}

// ✨ SACRED HILLTOP TEMPLE CINEMA ORBIT CAM
const btnTempleOrbit = document.getElementById("reel-temple-orbit");
if (btnTempleOrbit) {
  btnTempleOrbit.addEventListener("click", () => {
    if (engine.templeOrbit && engine.templeOrbit.active) {
      engine.stopTempleOrbit();
      btnTempleOrbit.classList.remove("active");
      btnTempleOrbit.textContent = "✨ Temple Orbit";
      return;
    }
    resetModeButtons();
    btnTempleOrbit.classList.add("active");
    btnTempleOrbit.textContent = "⏹ Stop Orbit";
    showToast("🛕 Filming Sacred Hilltop Temple Glow & Pilgrimage Steps!");
    engine.startTempleOrbit(() => {
      btnTempleOrbit.classList.remove("active");
      btnTempleOrbit.textContent = "✨ Temple Orbit";
    });
  });
}

// 🌧️ MONSOON RAIN WEATHER TOGGLE IN REEL STUDIO
const btnRainToggle = document.getElementById("reel-rain-btn");
if (btnRainToggle) {
  btnRainToggle.addEventListener("click", () => {
    const next = !engine.rainEnabled;
    engine.setRainEnabled(next);
    btnRainToggle.classList.toggle("active", next);
    btnRainToggle.textContent = next ? "🌧️ Rain ON" : "🌧️ Rain";
    showToast(next ? "🌧️ Monsoon Rain Active — Epic for Night/Araku Reels!" : "☀️ Clear Sky Restored");
  });
}

// 🎆 NIGHT SKY FIREWORKS CELEBRATION TOGGLE IN REEL STUDIO
const btnFwToggle = document.getElementById("reel-fireworks-btn");
if (btnFwToggle) {
  btnFwToggle.addEventListener("click", () => {
    const next = !engine.fireworksEnabled;
    engine.setFireworksEnabled(next);
    btnFwToggle.classList.toggle("active", next);
    btnFwToggle.textContent = next ? "🎆 Fireworks ON" : "🎆 Fireworks";
    if (next && engine.timeOfDay !== "night") {
      engine.transitionTimeOfDay("night", 1.8);
      showToast("🎆 Switching to Night Mode + Sky Fireworks Celebration!");
    } else {
      showToast(next ? "🎆 Sky Fireworks Celebration ON!" : "🎆 Fireworks OFF");
    }
  });
}

// =========================================================
// 📬 UNLIMITED FIREBASE FOLLOWER REQUESTS INBOX (v30)
// =========================================================
let liveRequests = {};
const reqBadge = document.getElementById("req-badge");
const reqListEl = document.getElementById("requests-list");
const reqSearchEl = document.getElementById("req-search");
const reqFilterEl = document.getElementById("req-filter");

function mapRequestedBuildingToType(text = "") {
  const s = text.toLowerCase();
  if (s.includes("billionaire") || s.includes("premium villa") || s.includes("luxury villa")) return "billionaire_villa";
  if (s.includes("swamy")) return "swamy_school";
  if (s.includes("mega d-mart") || s.includes("mega dmart") || s.includes("large dmart")) return "dmart_mega";
  if (s.includes("inorbit")) return "inorbit_mall";
  if (s.includes("function")) return "function_hall";
  if (s.includes("free fire") || s.includes("ff office")) return "ff_office";
  if (s.includes("ayyappa")) return "ayyappa_temple";
  if (s.includes("yamaha")) return "yamaha_showroom";
  if (s.includes("stark") || s.includes("strak")) return "stark_tower";
  if (s.includes("lc mart") || s.includes("lcmart")) return "lc_mart";
  if (s.includes("bar")) return "bar_lounge";
  if (s.includes("light house") || s.includes("lighthouse")) return "light_house";
  if (s.includes("imax")) return "imax_theater";
  if (s.includes("movie") || s.includes("theater") || s.includes("multiplex")) return "movie_theater";
  if (s.includes("audi")) return "audi_showroom";
  if (s.includes("mahindra")) return "mahindra_showroom";
  if (s.includes("bmw")) return "bmw_showroom";
  if (s.includes("stadium") || s.includes("ground")) return "ground";
  if (s.includes("box cricket") || s.includes("turf")) return "box_cricket";
  if (s.includes("gt650") || s.includes("bike") || s.includes("superbike")) return "bike_showroom";
  if (s.includes("d-mart") || s.includes("dmart")) return "dmart";
  if (s.includes("oyo") || s.includes("hotel")) return "hotel_oyo";
  if (s.includes("hostel")) return "hostel";
  if (s.includes("wine")) return "wine_shop";
  if (s.includes("temple") || s.includes("tirumala")) return "tirumala_temple";
  if (s.includes("park")) return "city_park";
  if (s.includes("library")) return "library";
  if (s.includes("swimming") || s.includes("pool")) return "swimming_pool";
  if (s.includes("iti")) return "iti_college";
  if (s.includes("gym")) return "gym";
  if (s.includes("srmt") || s.includes("mall")) return "srmt_mall";
  if (s.includes("apple")) return "apple_store";
  if (s.includes("reliance")) return "reliance_store";
  if (s.includes("police")) return "police_station";
  if (s.includes("hospital")) return "hospital";
  if (s.includes("school")) return "school";
  if (s.includes("bus")) return "bus_stand";
  if (s.includes("auto")) return "auto_stand";
  if (s.includes("petrol")) return "petrol_bunk";
  if (s.includes("photo") || s.includes("studio")) return "photo_studio";
  if (s.includes("beauty") || s.includes("parlour") || s.includes("parlor") || s.includes("salon") || s.includes("spa")) return "beauty_parlour";
  if (s.includes("mega mobile") || s.includes("mobile showroom")) return "mobile_showroom";
  if (s.includes("mobile")) return "mobile_shop";
  if (s.includes("medical") || s.includes("pharmacy")) return "medical_shop";
  if (s.includes("biryani")) return "biryani_point";
  if (s.includes("ice cream")) return "ice_cream_shop";
  if (s.includes("veg")) return "veg_shop";
  if (s.includes("cafe") || s.includes("coffee")) return "cafe";
  if (s.includes("tea") || s.includes("tiffin") || s.includes("shop")) return "shop";
  if (s.includes("beach")) return "beach_villa";
  if (s.includes("tower") || s.includes("5-floor")) return "tower_led";
  return "house_blue";
}

function findNextFreeEmptyPlotId(reqSize = 1) {
  const clearGroup = findNearestClearFootprint(reqSize, null, null);
  const maxSibNum = Math.max(...clearGroup.siblings.map((sid) => parseInt(sid.replace("plot_", ""), 10) || 1));
  engine.ensureCapacity(maxSibNum + 4);
  return clearGroup.anchorId;
}

function formatRelTime(ts) {
  if (!ts) return "Just now";
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function renderRequestsInbox() {
  const entries = Object.entries(liveRequests || {})
    .map(([id, r]) => ({ id, ...(r || {}) }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const pendingCount = entries.filter((r) => (r.status || "pending") === "pending").length;
  if (reqBadge) {
    reqBadge.textContent = String(pendingCount);
    reqBadge.classList.toggle("hidden", pendingCount === 0);
  }
  if (!reqListEl) return;

  const q = (reqSearchEl?.value || "").trim().toLowerCase();
  const filter = reqFilterEl?.value || "pending";
  const filtered = entries.filter((r) => {
    const st = r.status || "pending";
    if (filter !== "all" && st !== filter) return false;
    if (!q) return true;
    return (
      (r.username || "").toLowerCase().includes(q) ||
      (r.building || "").toLowerCase().includes(q) ||
      (r.job || "").toLowerCase().includes(q) ||
      (r.note || "").toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    reqListEl.innerHTML = `<div class="hint" style="text-align:center;padding:18px;">No ${filter === "all" ? "" : filter} requests right now.</div>`;
    return;
  }

  reqListEl.innerHTML = "";
  filtered.forEach((req) => {
    const card = document.createElement("div");
    const isBuilt = req.status === "built";
    card.className = "req-card" + (isBuilt ? " built" : "");

    const head = document.createElement("div");
    head.className = "req-card-head";
    const uEl = document.createElement("span");
    uEl.className = "req-user";
    uEl.textContent = (req.username || "@follower") + (isBuilt ? " ✅" : "");
    const tEl = document.createElement("span");
    tEl.className = "req-time";
    tEl.textContent = formatRelTime(req.createdAt);
    head.append(uEl, tEl);

    const meta = document.createElement("div");
    meta.className = "req-meta";
    meta.textContent = `🏗️ ${req.building || "Classic House"}  •  💼 ${req.job || "Resident"}`;

    card.append(head, meta);
    if (req.note) {
      const noteEl = document.createElement("div");
      noteEl.className = "req-note";
      noteEl.textContent = `“${req.note}”`;
      card.appendChild(noteEl);
    }

    const acts = document.createElement("div");
    acts.className = "req-actions";

    const bType = mapRequestedBuildingToType(req.building || "");
    const btnAuto = document.createElement("button");
    btnAuto.className = "req-btn-auto";
    btnAuto.textContent = isBuilt ? "🔄 Build Again" : "⚡ Auto-Build";
    btnAuto.addEventListener("click", async () => {
      if (!isAdmin) return;
      const reqSize = getRequiredSize(bType);
      const dayNum = worldSettings.dayNumber || 1;
      const handle = (req.username || "@follower").trim();
      const formattedHandle = handle.startsWith("@") ? handle : `@${handle}`;

      if (bType === "beach_villa") {
        const slot = getNextZoneSlot("beach");
        const newPlotId = `zone_beach_${Date.now().toString(36)}`;
        const payload = {
          status: "built",
          isCustomZone: true,
          zone: "beach",
          offsetX: Number(slot.offsetX.toFixed(2)),
          offsetZ: Number(slot.offsetZ.toFixed(2)),
          customRotY: slot.rotY,
          ownerName: formattedHandle,
          role: req.job || "Beachfront Resident",
          buildingType: "beach_villa",
          size: 1,
          builtDay: dayNum
        };
        await update(ref(db), {
          [`plots/${newPlotId}`]: payload,
          [`requests/${req.id}/status`]: "built",
          [`requests/${req.id}/builtPlotId`]: newPlotId
        });
        selectedPlotId = newPlotId;
        closeAllDrawers();
        engine.focusPlot(newPlotId);
        openPlotCard(newPlotId, payload);
        showToast(`🏖️ Auto-Built ${formattedHandle}'s Beach Villa!`);
        return;
      }

      const targetPlotId = findNextFreeEmptyPlotId(reqSize);
      const updates = {};
      if (reqSize === 8 || reqSize === 4 || reqSize === 2) {
        const gInfo =
          reqSize === 8 ? getEightPlotGroup(targetPlotId)
          : reqSize === 4 ? getBlockPlotIds(targetPlotId)
          : getTwoPlotGroup(targetPlotId);
        gInfo.siblings.forEach((sid) => {
          if (sid === gInfo.anchorId) {
            updates[`plots/${sid}`] = {
              status: "built",
              ownerName: formattedHandle,
              role: req.job || BUILDING_LABELS[bType] || "Landmark",
              buildingType: bType,
              size: reqSize,
              builtDay: dayNum
            };
          } else {
            updates[`plots/${sid}`] = {
              status: "occupied_by_landmark",
              parentPlot: gInfo.anchorId,
              ownerName: "",
              role: "",
              buildingType: "empty",
              size: 1,
              builtDay: dayNum
            };
          }
        });
        selectedPlotId = gInfo.anchorId;
      } else {
        updates[`plots/${targetPlotId}`] = {
          status: "built",
          ownerName: formattedHandle,
          role: req.job || "Follower Resident",
          buildingType: bType,
          size: 1,
          builtDay: dayNum
        };
        selectedPlotId = targetPlotId;
      }
      updates[`requests/${req.id}/status`] = "built";
      updates[`requests/${req.id}/builtPlotId`] = selectedPlotId;

      try {
        await update(ref(db), updates);
        closeAllDrawers();
        engine.focusPlot(selectedPlotId);
        openPlotCard(selectedPlotId, updates[`plots/${selectedPlotId}`]);
        showToast(`⚡ Auto-Built ${formattedHandle} (${BUILDING_LABELS[bType] || bType})!`);
      } catch (err) {
        showToast("Build failed: " + err.message);
      }
    });

    const btnPick = document.createElement("button");
    btnPick.className = "req-btn-pick";
    btnPick.textContent = "✏️ Pre-Fill Builder";
    btnPick.addEventListener("click", () => {
      document.getElementById("b-owner").value = req.username || "";
      document.getElementById("b-role").value = req.job || "";
      document.getElementById("b-type").value = bType;
      document.getElementById("b-day").value = worldSettings.dayNumber || 1;
      closeAllDrawers();
      panels.builder.classList.remove("hidden");
      showToast("✏️ Builder pre-filled! Tap any plot, then Save Building.");
    });

    const btnDel = document.createElement("button");
    btnDel.className = "req-btn-del";
    btnDel.textContent = "🗑️";
    btnDel.title = "Delete Request";
    btnDel.addEventListener("click", async () => {
      if (!isAdmin) return;
      try {
        await remove(ref(db, `requests/${req.id}`));
        showToast("🗑️ Request removed");
      } catch (err) {
        showToast("Error: " + err.message);
      }
    });

    acts.append(btnAuto, btnPick, btnDel);
    card.appendChild(acts);
    reqListEl.appendChild(card);
  });
}

onValue(ref(db, "requests"), (snap) => {
  liveRequests = snap.val() || {};
  renderRequestsInbox();
});

document.getElementById("btn-open-requests")?.addEventListener("click", () => {
  closeAllDrawers();
  panels.requests?.classList.remove("hidden");
  renderRequestsInbox();
});
reqSearchEl?.addEventListener("input", () => renderRequestsInbox());
reqFilterEl?.addEventListener("change", () => renderRequestsInbox());

// =========================================================
// 🚀 / 🌉 / 🎡 REEL MODE CAMERAS & 🎮 ADMIN DRIVE MODE (v30)
// =========================================================
const btnReelRocket = document.getElementById("reel-rocket-cam");
if (btnReelRocket) {
  btnReelRocket.addEventListener("click", () => {
    if (engine.chaseCam.active && engine.chaseCam.mode === "rocket") {
      engine.stopChaseCam();
      resetModeButtons();
      return;
    }
    resetModeButtons();
    btnReelRocket.classList.add("active");
    btnReelRocket.textContent = "⏹ Stop Rocket";
    showToast("🚀 Tracking Live ISRO Rocket Launchpad & Liftoff!");
    engine.startChaseCam("rocket", () => resetModeButtons());
  });
}

document.getElementById("reel-island-cam")?.addEventListener("click", () => {
  engine.stopAllReelModes();
  engine.focusPlot("VIP_ISLAND", 0.12);
  showToast("🌉 RGB Sea Bridge & VIP Private Island!");
});

document.getElementById("reel-wheel-cam")?.addEventListener("click", () => {
  engine.stopAllReelModes();
  engine.focusPlot("FERRIS_WHEEL", 0.12);
  showToast("🎡 Beach Giant Ferris Wheel & Amusement Park!");
});


document.getElementById("reel-stadium-cam")?.addEventListener("click", () => {
  engine.stopAllReelModes();
  engine.focusPlot("OUTSKIRTS_STADIUM", 0.12);
  showToast("🏏 Outskirts International Cricket Stadium • Live Scoreboard!");
});

// =========================================================
// 🎬 v36: 6 BRAND-NEW PRO REEL MODES WIRING
// =========================================================
function bindCinemaReelButton(btnId, mode, toastMsg, getOpts = null) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (engine.cinemaReel && engine.cinemaReel.active && engine.cinemaReel.mode === mode) {
      engine.stopCinemaReel();
      resetModeButtons();
      return;
    }
    resetModeButtons();
    btn.classList.add("active");
    btn.textContent = "⏹ Stop";
    showToast(toastMsg);
    let lastTag = "";
    const opts = getOpts ? getOpts() : {};
    engine.startCinemaReel(
      mode,
      opts,
      (tag, title) => {
        if (tag !== lastTag) {
          lastTag = tag;
          const banner = document.getElementById("reel-spotlight-banner");
          const tagEl = document.getElementById("reel-tag-text");
          const nameEl = document.getElementById("reel-name-text");
          if (tagEl) tagEl.textContent = tag;
          if (nameEl) nameEl.textContent = title;
          if (banner) banner.classList.remove("hidden");
        }
      },
      () => {
        resetModeButtons();
        if (mode === "mega") {
          const banner = document.getElementById("reel-spotlight-banner");
          if (banner) banner.classList.add("hidden");
        }
      }
    );
  });
}

bindCinemaReelButton("reel-mega-btn", "mega", "🎬 1-Tap 28s Auto Mega-Reel Director Running! Hit 🔴 REC HD!");
bindCinemaReelButton("reel-mansion-btn", "mansion", "👑 Gliding across RGB Sea Bridge to Sheru Bhai Royal Mansion!");
bindCinemaReelButton("reel-skydrop-btn", "skydrop", "⚡ Cloud Sky Drop-In Reveal!", () => ({
  plotId: selectedPlotId || "ST_JUNCTION",
  label: allPlots[selectedPlotId]?.ownerName || "SHERU BHAI STATUE"
}));
bindCinemaReelButton("reel-beachsweep-btn", "beach_sweep", "🎡 Coastal Sweep: Ferris Wheel → 20-Floor OYO → Beach Villas!");
bindCinemaReelButton("reel-stadiumreel-btn", "stadium", "🏏 Outskirts Cricket Stadium & Live Scoreboard Orbit!");
bindCinemaReelButton("reel-hero360-btn", "hero360", "🔄 360° Hero Spin around Selected Building!", () => ({
  plotId: selectedPlotId || "ST_JUNCTION",
  label: allPlots[selectedPlotId]?.ownerName || "SHERU BHAI STATUE"
}));


// =========================================================
// 🦁🚗🚇 v41 PLAYABLE SHERU BHAI (CAR + WALK) & METRO STATION UI WIRING
// =========================================================
(function initSheruRoamAndMetroUI() {
  const btnPlaySheru = document.getElementById("btn-play-sheru");
  const btnOpenMetro = document.getElementById("btn-open-metro");
  const roamHud = document.getElementById("roam-hud");
  const roamStatus = document.getElementById("roam-status-badge");
  const btnCarToggle = document.getElementById("btn-roam-car-toggle");
  const btnBoost = document.getElementById("btn-roam-boost");
  const btnCallCar = document.getElementById("btn-roam-call-car");
  const btnRoamMetro = document.getElementById("btn-roam-metro");
  const btnRoamExit = document.getElementById("btn-roam-exit");
  const joyZone = document.getElementById("roam-joy-zone");
  const joyKnob = document.getElementById("roam-joy-knob");
  const metroModal = document.getElementById("metro-modal");
  const metroList = document.getElementById("metro-station-list");
  const btnCloseMetro = document.getElementById("btn-close-metro");
  const btnRideLive = document.getElementById("btn-ride-metro-live");

  const updateRoamBadge = (mode, kmh) => {
    if (!roamStatus || !btnCarToggle) return;
    if (mode === "car") {
      roamStatus.textContent = `🚗 DRIVING VIP CAR • ${kmh} KM/H`;
      btnCarToggle.textContent = "🚶 Exit Car (Walk)";
    } else if (mode === "foot") {
      roamStatus.textContent = "🦁 WALKING AS SHERU BHAI • FREE ROAM";
      btnCarToggle.textContent = "🚗 Enter Car";
    } else if (mode === "metro") {
      roamStatus.textContent = "🚇 RIDING ELEVATED METRO • 80 KM/H";
      btnCarToggle.textContent = "🚶 Step Off Metro";
    }
  };

  const setRoamVisible = (on) => {
    if (roamHud) roamHud.classList.toggle("hidden", !on);
    document.querySelectorAll(".public-quick-bar, #admin-dock").forEach((el) => {
      el.classList.toggle("hidden", on);
    });
  };

  if (btnPlaySheru) {
    btnPlaySheru.addEventListener("click", () => {
      engine.startSheruRoamMode(true, updateRoamBadge);
      setRoamVisible(true);
      updateRoamBadge("car", 0);
      if (typeof showToast === "function") showToast("🦁🚗 Driving Sheru Bhai VIP Car! Tap '🚶 Exit Car' anytime to walk the city!");
    });
  }

  if (btnRoamExit) {
    btnRoamExit.addEventListener("click", () => {
      engine.exitSheruRoamMode();
      setRoamVisible(false);
    });
  }

  if (btnCarToggle) {
    btnCarToggle.addEventListener("click", () => {
      const msg = engine.toggleSheruCarMode();
      if (msg && typeof showToast === "function") showToast(msg);
    });
  }

  if (btnCallCar) {
    btnCallCar.addEventListener("click", () => {
      engine.summonSheruCar();
      if (typeof showToast === "function") showToast("📞 VIP Car summoned right beside Sheru Bhai!");
    });
  }

  const joyState = { active: false, x: 0, y: 0, pid: null };
  if (btnBoost) {
    const startB = (e) => { e.preventDefault(); engine.setSheruRoamInput(joyState.x, joyState.y, true); };
    const endB = () => { engine.setSheruRoamInput(joyState.x, joyState.y, false); };
    btnBoost.addEventListener("pointerdown", startB);
    btnBoost.addEventListener("pointerup", endB);
    btnBoost.addEventListener("pointerleave", endB);
    btnBoost.addEventListener("pointercancel", endB);
  }

  if (joyZone && joyKnob) {
    const maxR = 42;
    const handleMove = (clientX, clientY) => {
      const rect = joyZone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      joyKnob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      joyState.x = dx / maxR;
      joyState.y = -dy / maxR;
      engine.setSheruRoamInput(joyState.x, joyState.y, null);
    };
    const resetJoy = () => {
      joyState.active = false;
      joyState.x = 0;
      joyState.y = 0;
      joyState.pid = null;
      joyKnob.style.transform = "translate(0px, 0px)";
      engine.setSheruRoamInput(0, 0, false);
    };
    joyZone.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      joyState.active = true;
      joyState.pid = e.pointerId;
      joyZone.setPointerCapture(e.pointerId);
      handleMove(e.clientX, e.clientY);
    });
    joyZone.addEventListener("pointermove", (e) => {
      if (!joyState.active || e.pointerId !== joyState.pid) return;
      handleMove(e.clientX, e.clientY);
    });
    joyZone.addEventListener("pointerup", resetJoy);
    joyZone.addEventListener("pointercancel", resetJoy);
  }

  const keys = {};
  const syncKeys = () => {
    if (!engine.playerRoam || !engine.playerRoam.active) return;
    const x = (keys["KeyD"] || keys["ArrowRight"] ? 1 : 0) - (keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0);
    const y = (keys["KeyW"] || keys["ArrowUp"] ? 1 : 0) - (keys["KeyS"] || keys["ArrowDown"] ? 1 : 0);
    engine.setSheruRoamInput(x, y, Boolean(keys["ShiftLeft"] || keys["ShiftRight"]));
  };
  window.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    keys[e.code] = true;
    syncKeys();
    if (e.code === "KeyE" && engine.playerRoam?.active) engine.toggleSheruCarMode();
  });
  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
    syncKeys();
  });

  const openMetroModal = () => {
    if (!metroModal || !metroList) return;
    const stations = engine.getMetroStations();
    metroList.innerHTML = "";
    stations.forEach((st) => {
      const b = document.createElement("button");
      b.className = "metro-st-btn";
      b.innerHTML = `<span>${st.name}</span><span style="font-size:11px;color:#38bdf8;">GO →</span>`;
      b.addEventListener("click", () => {
        metroModal.classList.add("hidden");
        engine.teleportSheruToStation(st.id);
        if (typeof showToast === "function") showToast(`🚇 Arrived at ${st.name}!`);
      });
      metroList.appendChild(b);
    });
    metroModal.classList.remove("hidden");
  };

  if (btnOpenMetro) btnOpenMetro.addEventListener("click", openMetroModal);
  if (btnRoamMetro) btnRoamMetro.addEventListener("click", openMetroModal);
  if (btnCloseMetro) btnCloseMetro.addEventListener("click", () => metroModal.classList.add("hidden"));
  if (btnRideLive) {
    btnRideLive.addEventListener("click", () => {
      if (metroModal) metroModal.classList.add("hidden");
      engine.boardMetroTrain();
      setRoamVisible(true);
      updateRoamBadge("metro", 80);
      if (typeof showToast === "function") showToast("🚆 Riding Live Elevated Metro Train across Sheru Bhai City!");
    });
  }
})();
