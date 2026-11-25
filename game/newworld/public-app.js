import { db, ref, onValue, push, set } from "./firebase-config.js?v=34";
import { FollowerTownEngine, BUILDING_LABELS, getRequiredSize } from "./world-engine.js?v=34";

let allPlots = {};
const container = document.getElementById("canvas-container");
const plotCard = document.getElementById("plot-card");
const websiteBtn = document.getElementById("card-website-btn");
const enterBtn = document.getElementById("card-enter-btn");
let activeEnterUrl = "";

function getInteriorPageUrl(plotId, data) {
  const owner = encodeURIComponent(
    plotId === "VIP_ISLAND" ? (engine.islandOwner || "SHERU BHAI")
    : plotId === "OUTSKIRTS_STADIUM" ? "SHERU BHAI STADIUM"
    : plotId === "HILL_TEMPLE" ? "SRI VENKATESWARA TEMPLE"
    : (data?.ownerName || "SHERU BHAI")
  );
  const ret = encodeURIComponent("./index.html");
  const qExtra = new URLSearchParams();
  qExtra.set("plotId", plotId || "");
  if (engine.driveState && engine.driveState.active) {
    qExtra.set("ex", engine.driveState.pos.x.toFixed(2));
    qExtra.set("ez", engine.driveState.pos.z.toFixed(2));
    qExtra.set("ey", engine.driveState.yaw.toFixed(3));
  }
  const tail = `&return=${ret}&${qExtra.toString()}`;

  if (plotId === "VIP_ISLAND") return `./mansion.html?owner=${owner}&type=mansion${tail}`;
  if (plotId === "OUTSKIRTS_STADIUM") return `./stadium.html?owner=${owner}&type=ground${tail}`;
  if (plotId === "HILL_TEMPLE") return `./landmarks.html?owner=${owner}&type=tirumala_temple${tail}`;

  const bt = data?.buildingType || "";
  if (bt === "gym") return `./gym.html?owner=${owner}&type=gym${tail}`;
  if (["movie_theater", "imax_theater"].includes(bt)) return `./theater.html?owner=${owner}&type=${bt}${tail}`;
  if (["srmt_mall", "dmart", "reliance_store", "apple_store"].includes(bt)) return `./malls.html?owner=${owner}&type=${bt}${tail}`;
  if (["school", "iti_college", "library"].includes(bt)) return `./school.html?owner=${owner}&type=${bt}${tail}`;
  if (["ground", "box_cricket"].includes(bt)) return `./stadium.html?owner=${owner}&type=${bt}${tail}`;
  if (bt === "beauty_parlour") return `./beauty-parlour.html?owner=${owner}&type=beauty${tail}`;
  if ([
    "hospital", "police_station", "tirumala_temple", "hotel_oyo", "hostel", "wine_shop",
    "medical_shop", "cafe", "shop", "biryani_point", "ice_cream_shop", "veg_shop",
    "photo_studio", "swimming_pool", "audi_showroom", "bmw_showroom", "mahindra_showroom",
    "bike_showroom", "mobile_showroom", "mobile_shop", "bus_stand", "auto_stand", "petrol_bunk"
  ].includes(bt)) {
    return `./landmarks.html?owner=${owner}&type=${bt}${tail}`;
  }
  return `./buildings.html?owner=${owner}&type=${bt || "house"}${tail}`;
}
const sketchfabModal = document.getElementById("sketchfab-modal");
const sketchfabIframe = document.getElementById("sketchfab-iframe");
const SKETCHFAB_URL = "https://sketchfab.com/models/011d2f8f40e146ff8b2d7dfc70e939f8/embed?autostart=1&ui_theme=dark";

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.add("hidden"), 2600);
}

const engine = new FollowerTownEngine(container, (plotId, data) => {
  if (plotId === "ADD_AIRPORT_PLOT" || plotId === "ADD_BEACH_PLOT") {
    reqModal.classList.remove("hidden");
    showToast(plotId === "ADD_AIRPORT_PLOT" ? "✈️ Request an Airport Zone plot here!" : "🏖️ Request a Beach Zone plot here!");
    return;
  }
  openPlotCard(plotId, data);
}, { visitorHD: true });

function openPlotCard(plotId, data) {
  if (enterBtn) { enterBtn.classList.add("hidden"); enterBtn.textContent = "🚪 Explore Inside (3D)"; }
  if (plotId === "OUTSKIRTS_STADIUM") {
    document.getElementById("card-badge").textContent = "SE CITY OUTSKIRTS • INTERNATIONAL ARENA";
    document.getElementById("card-owner").textContent = "🏏 SHERU BHAI CRICKET STADIUM";
    document.getElementById("card-role").textContent = "Massive International Cricket Stadium in the city outskirts with Live Updating LED Scoreboard, Towering Floodlights, Multi-Tier Colorful Seats & 22-Yard Pitch!";
    document.getElementById("card-type").textContent = "OUTSKIRTS CRICKET STADIUM";
    document.getElementById("card-day").textContent = "LIVE SCOREBOARD 📺";
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    if (enterBtn) { activeEnterUrl = getInteriorPageUrl("OUTSKIRTS_STADIUM", null); enterBtn.classList.remove("hidden"); enterBtn.textContent = "🏏 Enter Cricket Stadium (3D)"; }
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "ROCKET_PAD") {
    document.getElementById("card-badge").textContent = "ISRO SRIHARIKOTA ZONE • SPACEPORT";
    document.getElementById("card-owner").textContent = "🚀 SHERU BHAI SPACEPORT";
    document.getElementById("card-role").textContent = "Live ISRO-style PSLV/GSLV Rocket Launchpad! Watch the rocket ignite with glowing exhaust flames, blast into space every 24 seconds, and try driving up to the launch tower!";
    document.getElementById("card-type").textContent = "LIVE ROCKET LAUNCHPAD";
    document.getElementById("card-day").textContent = "AUTO LAUNCH EVERY 24s 🔥";
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "VIP_ISLAND") {
    document.getElementById("card-badge").textContent = "RGB SEA BRIDGE • PRIVATE OCEAN ISLAND";
    document.getElementById("card-owner").textContent = `🏝️ ${engine.islandOwner || "@vip_island_king"}`;
    document.getElementById("card-role").textContent = "Exclusive VIP Private Island Mansion connected to Sheru Bhai Beach by the glowing RGB Cable-Stayed Sea Bridge! Tap 🎮 Drive to drive across the bridge!";
    document.getElementById("card-type").textContent = "VIP ISLAND MANSION";
    document.getElementById("card-day").textContent = "TOP COMMENTER REWARD 👑";
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    if (enterBtn) { activeEnterUrl = getInteriorPageUrl("VIP_ISLAND", null); enterBtn.classList.remove("hidden"); enterBtn.textContent = "👑 Enter Sheru Bhai Mansion (3D)"; }
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "FERRIS_WHEEL") {
    document.getElementById("card-badge").textContent = "BEACH PROMENADE • AMUSEMENT PARK";
    document.getElementById("card-owner").textContent = "🎡 SHERU BHAI GIANT WHEEL";
    document.getElementById("card-role").textContent = "Towering rotating Giant Ferris Wheel with 12 glowing neon cabins right beside Golden Beach & the 20-Floor OYO Resort!";
    document.getElementById("card-type").textContent = "BEACH AMUSEMENT PARK";
    document.getElementById("card-day").textContent = "NIGHT LED SHOW ✨";
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

          if (plotId === "HILL_TEMPLE") {
    document.getElementById("card-badge").textContent = "SACRED HILLTOP TEMPLE • ARAKU PEAK";
    document.getElementById("card-owner").textContent = "🛕 SRI VENKATESWARA HILL TEMPLE";
    document.getElementById("card-role").textContent = "Grand Real-Style Mountain Temple beside the Railway Station with 48 Pilgrimage Steps, Devotees Climbing, Winding Ghat Road for Vehicles, River & Radiant Golden Glow!";
    document.getElementById("card-type").textContent = "HILLTOP MAHA TEMPLE";
    document.getElementById("card-day").textContent = "LIVE DIVINE GLOW ✨";
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    if (enterBtn) { activeEnterUrl = getInteriorPageUrl("HILL_TEMPLE", null); enterBtn.classList.remove("hidden"); enterBtn.textContent = "🛕 Enter Temple Sanctum (3D)"; }
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "RAILWAY_SOUTH") {
    document.getElementById("card-badge").textContent = "ARAKU VALLEY GATE • SOUTH STATION";
    document.getElementById("card-owner").textContent = "🚉 ARAKU SOUTH JN";
    document.getElementById("card-role").textContent = "2nd Opposite-Side 2-Platform Railway Station with Foot Overbridge Steps, Parking & Both Express Trains emerging from the Araku Mountain Tunnels!";
    document.getElementById("card-type").textContent = "SOUTH RAILWAY STATION";
    document.getElementById("card-day").textContent = "";
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "RAILWAY_STATION") {
    const rOwner = engine.railwayOwner || "@_ur_bunny_108_";
    document.getElementById("card-badge").textContent = "INDIAN RAILWAYS • LIVE EXPRESS";
    document.getElementById("card-owner").textContent = `🚂 ${rOwner} • SHERU BHAI JN`;
    document.getElementById("card-role").textContent = "2-Platform Railway Station with Foot Overbridge Steps, IN/OUT Station Parking, Direct City Road & 2 Real Trains (Coming & Going through Hollow Mountain Tunnel)!";
    document.getElementById("card-type").textContent = "RAILWAY STATION & TUNNEL";
    document.getElementById("card-day").textContent = "";
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "BEACH") {
    const bOwner = engine.beachOwner || "@follower_beach";
    document.getElementById("card-badge").textContent = "GOLDEN SAND BEACH & VILLA";
    document.getElementById("card-owner").textContent = `🏖️ ${bOwner}'s Beach House`;
    document.getElementById("card-role").textContent = "Sheru Bhai chilling under the beach umbrella + Luxury Beachfront Villa overlooking animated ocean waves!";
    document.getElementById("card-type").textContent = "SHERU BHAI BEACH";
    document.getElementById("card-day").textContent = "";
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "AIRPORT") {
    document.getElementById("card-badge").textContent = "20-ACRE INTERNATIONAL AIRPORT";
    document.getElementById("card-owner").textContent = "✈️ SHERU BHAI INTL AIRPORT";
    document.getElementById("card-role").textContent = "Outside City (20 Acres) • Live Shuttle Buses, Passenger Flights & Sheru Bhai arriving in Diamond Car to fly his Diamond Helicopter!";
    document.getElementById("card-type").textContent = "20 ACRES • LIVE FLIGHTS";
    document.getElementById("card-day").textContent = "";
    websiteBtn.classList.add("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "ST_JUNCTION") {
    document.getElementById("card-badge").textContent = "CITY CENTER LANDMARK";
    document.getElementById("card-owner").textContent = "🦁 SHERU BHAI • ST JUNCTION";
    document.getElementById("card-role").textContent = "Official Hub of Follower Nagaram • Play more games on ST Games!";
    document.getElementById("card-type").textContent = "stgames.online";
    document.getElementById("card-day").textContent = "";
    websiteBtn.classList.remove("hidden");
    if (sheru3dBtn) sheru3dBtn.classList.remove("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  websiteBtn.classList.add("hidden");
  if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
  if (data && data.status === "built") {
    const label = BUILDING_LABELS[data.buildingType] || "TOWN BUILDING";
    const size = data.size || getRequiredSize(data.buildingType);
    document.getElementById("card-badge").textContent = label;
    document.getElementById("card-owner").textContent = data.ownerName || label;
    document.getElementById("card-role").textContent = data.role || "Follower Nagaram Resident";
    document.getElementById("card-type").textContent =
      size === 8
        ? (data.buildingType === "imax_theater" ? "8-PLOT IMAX 3D DOME" : data.buildingType === "movie_theater" ? "8-PLOT MOVIE THEATER" : data.buildingType === "mahindra_showroom" ? "8-PLOT MAHINDRA SHOWROOM" : data.buildingType === "bmw_showroom" ? "8-PLOT BMW SHOWROOM" : data.buildingType === "audi_showroom" ? "8-PLOT AUDI SHOWROOM" : "8-PLOT MEGA STADIUM")
        : size === 4
        ? (data.buildingType === "tirumala_temple" ? "4-PLOT TIRUMALA TEMPLE" : data.buildingType === "hotel_oyo" ? "20-FLOOR OYO TOWER" : data.buildingType === "hostel" ? "4-PLOT HOSTEL" : data.buildingType === "wine_shop" ? "4-PLOT WINE SHOP" : data.buildingType === "box_cricket" ? "4-PLOT BOX CRICKET" : data.buildingType === "bike_showroom" ? "4-PLOT BIKE SHOWROOM" : data.buildingType === "swimming_pool" ? "4-PLOT SWIMMING POOL" : data.buildingType === "city_park" ? "4-PLOT CITY PARK" : data.buildingType === "library" ? "4-PLOT PUBLIC LIBRARY" : data.buildingType === "dmart" ? "4-PLOT D-MART" : "4-PLOT LANDMARK")
        : size === 2
        ? (data.buildingType === "beauty_parlour" ? "2-PLOT BEAUTY PARLOUR" : data.buildingType === "mobile_showroom" ? "2-PLOT MOBILE SHOWROOM" : data.buildingType === "beach_villa_2" ? "2-PLOT BEACH VILLA" : "2-PLOT STUDIO")
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
        ? "5-FLOOR MODERN TOWER"
        : "CLASSIC HOUSE";
    document.getElementById("card-day").textContent = `Day ${data.builtDay || 1}`;
  } else {
    document.getElementById("card-badge").textContent = "AVAILABLE PLOT";
    document.getElementById("card-owner").textContent = "Open Land";
    document.getElementById("card-role").textContent = "Follow on Instagram to get your house built here!";
    document.getElementById("card-type").textContent = "OPEN";
    document.getElementById("card-day").textContent = "";
  }
  if (enterBtn && data && data.status === "built" && data.buildingType !== "empty") {
    activeEnterUrl = getInteriorPageUrl(plotId, data);
    enterBtn.classList.remove("hidden");
  }
  plotCard.classList.remove("hidden");
}

let initialLoadDone = false;
onValue(ref(db, "plots"), (snapshot) => {
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

  keys.forEach((plotId) => {
    const animate = initialLoadDone && data[plotId]?.status === "built" && JSON.stringify(allPlots[plotId]) !== JSON.stringify(data[plotId]);
    engine.renderPlot(plotId, data[plotId], animate);
  });

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

onValue(ref(db, "worldSettings"), (snapshot) => {
  const val = snapshot.val();
  if (!val) return;
  const name = val.townName || "FOLLOWER NAGARAM";
  document.getElementById("town-title").textContent = name;
  document.getElementById("stat-day").textContent = `Day ${val.dayNumber || 1}`;
  engine.setTownName(name);
  if (val.beachOwner !== undefined) engine.setBeachOwner(val.beachOwner);
  if (val.railwayOwner !== undefined) engine.setRailwayOwner(val.railwayOwner);
  if (val.heroModels) engine.setHeroModelUrls(val.heroModels);
  if (val.weather !== undefined) engine.setRainEnabled(val.weather === "rain");
  if (val.fireworks !== undefined) engine.setFireworksEnabled(Boolean(val.fireworks));
  if (val.islandOwner !== undefined) engine.setIslandOwner(val.islandOwner);
  engine.setTimeOfDay(val.timeOfDay || "day");
  engine.lifeEnabled = val.lifeEnabled !== false;
});

function runSearch() {
  const q = document.getElementById("search-input").value;
  const foundId = engine.findPlotByQuery(q);
  if (foundId === "ST_JUNCTION" || foundId === "AIRPORT" || foundId === "BEACH" || foundId === "RAILWAY_STATION" || foundId === "RAILWAY_SOUTH") {
    engine.focusPlot(foundId);
    openPlotCard(foundId, null);
  } else if (foundId) {
    engine.focusPlot(foundId);
    openPlotCard(foundId, allPlots[foundId]);
  } else {
    showToast("Not found in town yet!");
  }
}

document.getElementById("search-btn").addEventListener("click", runSearch);
document.getElementById("search-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});
document.getElementById("close-plot-card").addEventListener("click", () => {
  plotCard.classList.add("hidden");
});

// =========================================================
// IDEA #6: PUBLIC "REQUEST A JOB / BUILDING" FORM (FORMSPREE)
// Replace YOUR_FORMSPREE_ID below with your Formspree form ID!
// =========================================================
const FORMSPREE_ENDPOINT = "https://formspree.io/f/moedkwon";

const reqModal = document.getElementById("request-modal");
const reqForm = document.getElementById("job-request-form");
const reqSubmitBtn = document.getElementById("req-submit-btn");

document.getElementById("btn-open-request").addEventListener("click", () => {
  reqModal.classList.remove("hidden");
});
document.getElementById("close-request").addEventListener("click", () => {
  reqModal.classList.add("hidden");
});

reqForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const uname = document.getElementById("req-username").value.trim();
  const job = document.getElementById("req-job").value.trim();
  const building = document.getElementById("req-building").value;
  const note = document.getElementById("req-note").value.trim();

  if (!uname || !job) return;

  if (FORMSPREE_ENDPOINT.includes("YOUR_FORMSPREE_ID")) {
    showToast("✅ Request preview ready! Add your Formspree ID in public-app.js.");
    reqModal.classList.add("hidden");
    reqForm.reset();
    return;
  }

  reqSubmitBtn.disabled = true;
  reqSubmitBtn.textContent = "Sending...";

  const cleanHandle = uname.startsWith("@") ? uname : `@${uname}`;
  let savedToFirebase = false;
  try {
    const newReqRef = push(ref(db, "requests"));
    await set(newReqRef, {
      username: cleanHandle,
      job,
      building,
      note,
      status: "pending",
      createdAt: Date.now()
    });
    savedToFirebase = true;
  } catch (fbErr) {
    console.warn("Firebase /requests fallback to Formspree:", fbErr.message);
  }

  try {
    if (savedToFirebase) {
      showToast("🎉 Request sent to Admin Live Inbox! Watch the next Reel!");
      reqForm.reset();
      reqModal.classList.add("hidden");
    } else {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          instagram_username: cleanHandle,
          requested_job: job,
          preferred_building: building,
          note
        })
      });
      if (res.ok) {
        showToast("🎉 Request sent! Watch the next Reel!");
        reqForm.reset();
        reqModal.classList.add("hidden");
      } else {
        showToast("Could not send request. Try Instagram DM button below!");
      }
    }
  } catch {
    showToast("Network error. Try Instagram DM button below!");
  } finally {
    reqSubmitBtn.disabled = false;
    reqSubmitBtn.textContent = "🚀 Send Request (Website)";
  }
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

// Visitor Quick-Jump to Sheru Bhai Statue & Local Day/Sunset/Night Toggle
const btnJumpCenter = document.getElementById("btn-jump-center");
if (btnJumpCenter) {
  btnJumpCenter.addEventListener("click", () => {
    engine.focusPlot("ST_JUNCTION");
    openPlotCard("ST_JUNCTION", null);
  });
}

const btnPublicTime = document.getElementById("btn-public-time");
if (btnPublicTime) {
  const modes = ["day", "sunset", "night"];
  btnPublicTime.addEventListener("click", () => {
    const nextIdx = (modes.indexOf(engine.timeOfDay) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    engine.setTimeOfDay(nextMode);
    showToast(nextMode === "night" ? "🌙 Night Mode" : nextMode === "sunset" ? "🌇 Sunset Mode" : "☀️ Day Mode");
  });
}

// Visitor Quick-Jump to 20-Acre International Airport
const btnJumpAirport = document.getElementById("btn-jump-airport");
if (btnJumpAirport) {
  btnJumpAirport.addEventListener("click", () => {
    engine.focusPlot("AIRPORT");
    openPlotCard("AIRPORT", null);
    showToast("✈️ Welcome to 20-Acre Sheru Bhai Airport!");
  });
}

// Visitor Quick-Jump to Sheru Bhai Beach & Beach House
const btnJumpBeach = document.getElementById("btn-jump-beach");
if (btnJumpBeach) {
  btnJumpBeach.addEventListener("click", () => {
    engine.focusPlot("BEACH");
    openPlotCard("BEACH", null);
    showToast("🏖️ Sheru Bhai chilling at the Beach!");
  });
}

// Visitor Quick-Jump to Railway Station & Express Train
const btnJumpRailway = document.getElementById("btn-jump-railway");
if (btnJumpRailway) {
  btnJumpRailway.addEventListener("click", () => {
    engine.focusPlot("RAILWAY_STATION");
    openPlotCard("RAILWAY_STATION", null);
    showToast("🚂 Sheru Bhai Jn • Live Train & Mountain Tunnel!");
  });
}

// Direct Instagram DM Button inside "Add Building" Modal (@_satish_official_16)
const INSTA_HANDLE = "_satish_official_16";
const reqInstaDmBtn = document.getElementById("req-insta-dm-btn");
if (reqInstaDmBtn) {
  reqInstaDmBtn.addEventListener("click", async () => {
    const uname = (document.getElementById("req-username")?.value || "").trim();
    const job = (document.getElementById("req-job")?.value || "").trim();
    const building = (document.getElementById("req-building")?.value || "Classic House").trim();
    const note = (document.getElementById("req-note")?.value || "").trim();

    if (!uname) {
      showToast("Please enter your Instagram @username first!");
      document.getElementById("req-username")?.focus();
      return;
    }

    const handleFormatted = uname.startsWith("@") ? uname : `@${uname}`;
    const msgLines = [
      `Hi! Please add my building in Sheru Bhai City 🏙️`,
      `Instagram: ${handleFormatted}`,
      `Building: ${building}`,
      job ? `Role/Job: ${job}` : "",
      note ? `Note: ${note}` : ""
    ].filter(Boolean);
    const fullMsg = msgLines.join(" | ");

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullMsg);
      }
    } catch {
      // Clipboard optional fallback
    }

    showToast("📋 Message copied! Opening Instagram DM...");
    const dmUrl = `https://ig.me/m/${INSTA_HANDLE}?text=${encodeURIComponent(fullMsg)}`;
    window.open(dmUrl, "_blank", "noopener");
  });
}

// Visitor Pro Cinematic Drone Toggle (Starts smoothly right from current view!)
const btnPublicDrone = document.getElementById("btn-public-drone");
if (btnPublicDrone) {
  btnPublicDrone.addEventListener("click", () => {
    if (engine.droneTour.active) {
      engine.stopDroneView();
      return;
    }
    plotCard.classList.add("hidden");
    btnPublicDrone.textContent = "⏹ Stop";
    showToast("🚁 Pro Drone Flight starting from your view! Drag to stop.");
    engine.startDroneView(() => {
      btnPublicDrone.textContent = "🚁 Drone";
    });
  });
}

const btnPubTemple = document.getElementById("btn-public-temple");
if (btnPubTemple) {
  btnPubTemple.addEventListener("click", () => {
    engine.focusPlot("HILL_TEMPLE", 0.12);
    showToast("🛕 Flying to Sacred Hilltop Temple Mountain!");
  });
}

// v30 New Landmark Quick Jumps (Rocket, VIP Island, Ferris Wheel)
document.getElementById("btn-public-rocket")?.addEventListener("click", () => {
  engine.focusPlot("ROCKET_PAD", 0.12);
  openPlotCard("ROCKET_PAD", null);
  showToast("🚀 ISRO Spaceport • Watch the Live Rocket Launch!");
});
document.getElementById("btn-public-island")?.addEventListener("click", () => {
  engine.focusPlot("VIP_ISLAND", 0.12);
  openPlotCard("VIP_ISLAND", null);
  showToast("🌉 RGB Cable-Stayed Sea Bridge & VIP Island!");
});
document.getElementById("btn-public-wheel")?.addEventListener("click", () => {
  engine.focusPlot("FERRIS_WHEEL", 0.12);
  openPlotCard("FERRIS_WHEEL", null);
  showToast("🎡 Beach Giant Ferris Wheel & Amusement Park!");
});

// 🎮 DRIVABLE CAR / GT650 SUPERBIKE / AUTO MODE (PUBLIC VISITOR)
const driveHud = document.getElementById("drive-hud");
const driveSpeedNum = document.getElementById("drive-speed-num");
const btnPublicDrive = document.getElementById("btn-public-drive");

function setDriveHudVisible(show) {
  if (!driveHud) return;
  driveHud.classList.toggle("hidden", !show);
  document.querySelectorAll(".hud-element").forEach((el) => {
    if (el.id !== "plot-card") el.classList.toggle("hidden", show);
  });
  if (show) plotCard.classList.add("hidden");
}

function bindHoldControl(btnId, controlKey) {
  const el = document.getElementById(btnId);
  if (!el) return;
  const down = (e) => {
    e.preventDefault();
    el.classList.add("pressed");
    engine.setDriveControl(controlKey, true);
  };
  const up = (e) => {
    e.preventDefault();
    el.classList.remove("pressed");
    engine.setDriveControl(controlKey, false);
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointerleave", up);
  el.addEventListener("pointercancel", up);
}

bindHoldControl("drive-btn-left", "left");
bindHoldControl("drive-btn-right", "right");
bindHoldControl("drive-btn-gas", "forward");
bindHoldControl("drive-btn-brake", "backward");
bindHoldControl("drive-btn-boost", "boost");

function updateDriveVehButtons(vType) {
  ["jeep", "car", "bike", "auto"].forEach((t) => {
    document.getElementById(`drive-veh-${t}`)?.classList.toggle("active", t === vType);
  });
}

["jeep", "car", "bike", "auto"].forEach((t) => {
  document.getElementById(`drive-veh-${t}`)?.addEventListener("click", () => {
    engine.switchDriveVehicle(t);
    updateDriveVehButtons(t);
  });
});

document.getElementById("drive-tp-city")?.addEventListener("click", () => engine.teleportDrive("city"));
document.getElementById("drive-tp-bridge")?.addEventListener("click", () => engine.teleportDrive("bridge"));
document.getElementById("drive-tp-temple")?.addEventListener("click", () => engine.teleportDrive("temple"));
document.getElementById("drive-tp-rocket")?.addEventListener("click", () => engine.teleportDrive("rocket"));

document.getElementById("drive-exit-btn")?.addEventListener("click", () => {
  engine.stopDriveMode();
  setDriveHudVisible(false);
});

if (btnPublicDrive) {
  btnPublicDrive.addEventListener("click", () => {
    setDriveHudVisible(true);
    updateDriveVehButtons("jeep");
    engine.startDriveMode(
      "jeep",
      (kmh) => { if (driveSpeedNum) driveSpeedNum.textContent = String(kmh); },
      () => setDriveHudVisible(false)
    );
    showToast("🚗 Drive Mode ON! Use buttons or WASD / Arrows to explore!");
  });
}

// ✨ VISITOR 1-TAP GRAPHICS PRESET SWITCH (HD -> Ultra -> Smooth Low-RAM)
const btnPubGfx = document.getElementById("btn-public-gfx");
if (btnPubGfx) {
  const presets = [
    { id: "hd",     label: "✨ HD",     cls: "gfx-hd",     toast: "✨ HD Mode: Crisp GLSL Sky + Ocean + Contact Shadows + WASM Fast Culling!" },
    { id: "ultra",  label: "🔥 Ultra",  cls: "gfx-ultra",  toast: "🔥 Ultra Mode: 1.85x Sharp + Soft Sun Shadows + Night Glow Bloom!" },
    { id: "smooth", label: "⚡ Smooth", cls: "gfx-smooth", toast: "⚡ Smooth Low-RAM Mode: Optimized for 2GB RAM Phones!" }
  ];
  let pIdx = 0;
  btnPubGfx.addEventListener("click", async () => {
    pIdx = (pIdx + 1) % presets.length;
    const p = presets[pIdx];
    btnPubGfx.classList.remove("gfx-hd", "gfx-ultra", "gfx-smooth");
    btnPubGfx.classList.add(p.cls);
    btnPubGfx.textContent = p.label;
    await engine.setGraphicsPreset(p.id);
    showToast(p.toast);
  });
}

if (enterBtn) {
  enterBtn.addEventListener("click", () => {
    if (activeEnterUrl) window.location.href = activeEnterUrl;
  });
}

// 🚶 AVATAR EXIT/ENTER CAR + 📯 HORN + 🚪 AUTO DOOR OPEN PROMPT (PUBLIC)
const pubAvatarBtn = document.getElementById("drive-avatar-btn");
const pubEnterPrompt = document.getElementById("drive-enter-prompt");
const pubEnterDoorBtn = document.getElementById("drive-enter-door-btn");
let pubNearbyDoorInfo = null;

document.getElementById("drive-horn-btn")?.addEventListener("click", () => engine.playDriveHorn());

if (pubAvatarBtn) {
  pubAvatarBtn.addEventListener("click", () => {
    const mode = engine.toggleDriveAvatar();
    pubAvatarBtn.textContent = mode === "walk" ? "🚗 Get In" : "🚶 Get Out";
    showToast(mode === "walk" ? "🚶 Avatar exited car! Walk up to any building door to explore inside!" : "🚗 Back in driver seat!");
  });
}

if (pubEnterDoorBtn) {
  pubEnterDoorBtn.addEventListener("click", () => {
    if (!pubNearbyDoorInfo) return;
    engine.playDoorOpenFX();
    const url = getInteriorPageUrl(pubNearbyDoorInfo.plotId, pubNearbyDoorInfo.data);
    setTimeout(() => { window.location.href = url; }, 220);
  });
}

engine.onNearbyDoorChange = (info) => {
  pubNearbyDoorInfo = info;
  if (!pubEnterPrompt || !pubEnterDoorBtn) return;
  if (info) {
    pubEnterDoorBtn.textContent = `🚪 Open Door & Enter ${info.label}`;
    pubEnterPrompt.classList.remove("hidden");
  } else {
    pubEnterPrompt.classList.add("hidden");
  }
};

// 🪙 IN-CITY 3D COIN RUSH MINI-GAME LAUNCHER (v33)
const coinHud = document.getElementById("coin-hud");
const coinScoreEl = document.getElementById("coin-score");
const coinTimerEl = document.getElementById("coin-timer");
const coinBestEl = document.getElementById("coin-best");

document.getElementById("coin-stop-btn")?.addEventListener("click", () => {
  engine.stopCoinRush();
  coinHud?.classList.add("hidden");
});

document.getElementById("btn-public-coinrush")?.addEventListener("click", () => {
  setDriveHudVisible(true);
  updateDriveVehButtons("jeep");
  engine.startDriveMode(
    "jeep",
    (kmh) => { if (driveSpeedNum) driveSpeedNum.textContent = String(kmh); },
    () => {
      engine.stopCoinRush();
      coinHud?.classList.add("hidden");
      setDriveHudVisible(false);
    }
  );
  coinHud?.classList.remove("hidden");
  engine.startCoinRush(
    (s) => {
      if (coinScoreEl) coinScoreEl.textContent = `🪙 ${s.score}`;
      if (coinTimerEl) coinTimerEl.textContent = `⏱️ ${s.timeLeft}s`;
      if (coinBestEl) coinBestEl.textContent = `🏆 ${s.best}`;
    },
    (res) => {
      coinHud?.classList.add("hidden");
      showToast(res.cleared ? `🏆 ALL COINS CLEARED! Final Score: ${res.score} (Best: ${res.best})` : `⏱️ Time Up! Score: ${res.score} (Best: ${res.best})`);
    }
  );
  showToast("🪙 COIN RUSH STARTED! Drive across City, Beach & Sea Bridge to grab all 12 Gold Coins!");
});

// 🏏 OUTSKIRTS CRICKET STADIUM QUICK JUMP & TELEPORT
document.getElementById("btn-public-stadium")?.addEventListener("click", () => {
  engine.focusPlot("OUTSKIRTS_STADIUM", 0.12);
  openPlotCard("OUTSKIRTS_STADIUM", null);
  showToast("🏏 Outskirts International Cricket Stadium • Live Scoreboard!");
});
document.getElementById("drive-tp-stadium")?.addEventListener("click", () => engine.teleportDrive("stadium"));

// 🎮 FREE FIRE WALK/DRIVE UI SWITCHER + VIRTUAL THUMBSTICK + JUMP!
const ffSteerWrap = document.getElementById("ff-drive-steer-wrap");
const ffJoyBase = document.getElementById("ff-walk-joy-base");
const ffJoyKnob = document.getElementById("ff-walk-joy-knob");
const ffPedals = document.getElementById("ff-drive-pedals");
const ffJumpBtn = document.getElementById("drive-btn-jump");
const ffBoostBtn = document.getElementById("drive-btn-boost");

function syncFreeFireHudMode(mode) {
  const walking = mode === "walk";
  ffSteerWrap?.classList.toggle("hidden", walking);
  ffPedals?.classList.toggle("hidden", walking);
  ffJoyBase?.classList.toggle("hidden", !walking);
  ffJumpBtn?.classList.toggle("hidden", !walking);
  if (ffBoostBtn) ffBoostBtn.textContent = walking ? "🏃 RUN" : "🔥 NITRO";
  if (pubAvatarBtn) pubAvatarBtn.textContent = walking ? "🚙 JEEP" : "🚶 OUT";
}

if (ffJoyBase && ffJoyKnob) {
  let jPid = null;
  const maxR = 40;
  const moveJoy = (cx, cy) => {
    const r = ffJoyBase.getBoundingClientRect();
    const dx = cx - (r.left + r.width / 2);
    const dy = cy - (r.top + r.height / 2);
    const d = Math.min(Math.hypot(dx, dy), maxR);
    const a = Math.atan2(dy, dx);
    const kx = Math.cos(a) * d;
    const ky = Math.sin(a) * d;
    ffJoyKnob.style.transform = `translate(${kx}px, ${ky}px)`;
    engine.setDriveJoystick(kx / maxR, -ky / maxR);
  };
  ffJoyBase.addEventListener("pointerdown", (e) => { e.preventDefault(); jPid = e.pointerId; ffJoyBase.setPointerCapture(e.pointerId); moveJoy(e.clientX, e.clientY); });
  ffJoyBase.addEventListener("pointermove", (e) => { if (e.pointerId === jPid) moveJoy(e.clientX, e.clientY); });
  const endJoy = (e) => {
    if (e.pointerId !== jPid) return;
    jPid = null;
    ffJoyKnob.style.transform = "translate(0px, 0px)";
    engine.setDriveJoystick(0, 0);
  };
  ffJoyBase.addEventListener("pointerup", endJoy);
  ffJoyBase.addEventListener("pointercancel", endJoy);
}

ffJumpBtn?.addEventListener("pointerdown", (e) => { e.preventDefault(); engine.triggerAvatarJump(); });

// Keep Free Fire Walk/Drive HUD in sync when toggling Avatar Out/In!
pubAvatarBtn?.addEventListener("click", () => {
  syncFreeFireHudMode(engine.driveState.subMode);
});
btnPublicDrive?.addEventListener("click", () => syncFreeFireHudMode("drive"));

// 🚪 AUTO-SPAWN RIGHT OUTSIDE THE EXACT HOUSE / LANDMARK WHEN EXITING AN INTERIOR!
(function checkReturnOutsideBuilding() {
  const sp = new URLSearchParams(window.location.search);
  if (sp.get("exitMode") !== "walk") return;
  const exPlot = sp.get("exitPlot") || "";
  const ex = sp.has("ex") ? parseFloat(sp.get("ex")) : null;
  const ez = sp.has("ez") ? parseFloat(sp.get("ez")) : null;
  const ey = sp.has("ey") ? parseFloat(sp.get("ey")) : 0;

  // Wait briefly for Firebase plots to populate so exact plot coordinates are loaded
  setTimeout(() => {
    setDriveHudVisible(true);
    updateDriveVehButtons("jeep");
    engine.spawnOutsideBuilding(
      exPlot,
      Number.isFinite(ex) ? ex : null,
      Number.isFinite(ez) ? ez : null,
      Number.isFinite(ey) ? ey : 0,
      (kmh) => { if (driveSpeedNum) driveSpeedNum.textContent = String(kmh); },
      () => setDriveHudVisible(false)
    );
    syncFreeFireHudMode("walk");
    showToast("🚶 You exited right outside! Run, jump, enter another building, or tap 🚙 JEEP to drive!");
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, 650);
})();
