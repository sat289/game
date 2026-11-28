import { db, ref, onValue, push, set, runTransaction } from "./firebase-config.js?v=48";
import { FollowerTownEngine, BUILDING_LABELS, getRequiredSize } from "./world-engine.js?v=48";

let allPlots = {};
const container = document.getElementById("canvas-container");
const plotCard = document.getElementById("plot-card");
const websiteBtn = document.getElementById("card-website-btn");
const sheru3dBtn = document.getElementById("card-sheru3d-btn");
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
  if (plotId === "OUTSKIRTS_STADIUM") {
    document.getElementById("card-badge").textContent = "SE CITY OUTSKIRTS • INTERNATIONAL ARENA";
    document.getElementById("card-owner").textContent = "🏏 SHERU BHAI CRICKET STADIUM";
    document.getElementById("card-role").textContent = "Massive International Cricket Stadium in the city outskirts with Live Updating LED Scoreboard, Towering Floodlights, Multi-Tier Colorful Seats & 22-Yard Pitch!";
    document.getElementById("card-type").textContent = "OUTSKIRTS CRICKET STADIUM";
    document.getElementById("card-day").textContent = "LIVE SCOREBOARD 📺";
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
    plotCard.classList.remove("hidden");
    return;
  }

  if (plotId === "ROCKET_PAD") {
    document.getElementById("card-badge").textContent = "ISRO SRIHARIKOTA ZONE • SPACEPORT";
    document.getElementById("card-owner").textContent = "🚀 SHERU BHAI SPACEPORT";
    document.getElementById("card-role").textContent = "Live ISRO-style PSLV/GSLV Rocket Launchpad! Watch the rocket ignite with glowing exhaust flames, blast into space every 24 seconds from the Sriharikota coastal pad!";
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
    document.getElementById("card-role").textContent = "Sheru Bhai Royal Island Mansion connected to Golden Beach by the glowing RGB Cable-Stayed Sea Bridge — featuring veined black-gold marble palace, 3-tier fountain, White Lion Sheru Bhai & Ram Bodyguards!";
    document.getElementById("card-type").textContent = "VIP ISLAND MANSION";
    document.getElementById("card-day").textContent = "TOP COMMENTER REWARD 👑";
    if (sheru3dBtn) sheru3dBtn.classList.add("hidden");
    websiteBtn.classList.add("hidden");
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
        ? (data.buildingType === "swamy_school" ? "8-PLOT SWAMY E.M. SCHOOL" : data.buildingType === "dmart_mega" ? "8-PLOT MEGA D-MART" : data.buildingType === "inorbit_mall" ? "8-PLOT INORBIT MALL" : data.buildingType === "billionaire_villa" ? "8-PLOT BILLIONAIRE VILLA" : data.buildingType === "function_hall" ? "8-PLOT FUNCTION HALL" : data.buildingType === "imax_theater" ? "8-PLOT IMAX 3D DOME" : data.buildingType === "movie_theater" ? "8-PLOT MOVIE THEATER" : data.buildingType === "mahindra_showroom" ? "8-PLOT MAHINDRA SHOWROOM" : data.buildingType === "bmw_showroom" ? "8-PLOT BMW SHOWROOM" : data.buildingType === "audi_showroom" ? "8-PLOT AUDI SHOWROOM" : "8-PLOT MEGA STADIUM")
        : size === 4
        ? (data.buildingType === "tirumala_temple" ? "4-PLOT TIRUMALA TEMPLE" : data.buildingType === "hotel_oyo" ? "20-FLOOR OYO TOWER" : data.buildingType === "hostel" ? "4-PLOT HOSTEL" : data.buildingType === "wine_shop" ? "4-PLOT WINE SHOP" : data.buildingType === "box_cricket" ? "4-PLOT BOX CRICKET" : data.buildingType === "ff_office" ? "4-PLOT FREE FIRE HQ" : data.buildingType === "ayyappa_temple" ? "4-PLOT AYYAPPA TEMPLE" : data.buildingType === "yamaha_showroom" ? "4-PLOT YAMAHA SHOWROOM" : data.buildingType === "stark_tower" ? "4-PLOT STARK TOWER" : data.buildingType === "lc_mart" ? "4-PLOT LC MART" : data.buildingType === "bar_lounge" ? "4-PLOT ROYAL BAR" : data.buildingType === "bike_showroom" ? "4-PLOT BIKE SHOWROOM" : data.buildingType === "swimming_pool" ? "4-PLOT SWIMMING POOL" : data.buildingType === "city_park" ? "4-PLOT CITY PARK" : data.buildingType === "library" ? "4-PLOT PUBLIC LIBRARY" : data.buildingType === "dmart" ? "4-PLOT D-MART" : "4-PLOT LANDMARK")
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

// 🏏 OUTSKIRTS INTERNATIONAL CRICKET STADIUM QUICK JUMP
document.getElementById("btn-public-stadium")?.addEventListener("click", () => {
  engine.focusPlot("OUTSKIRTS_STADIUM", 0.12);
  openPlotCard("OUTSKIRTS_STADIUM", null);
  showToast("🏏 Outskirts International Cricket Stadium • Live Scoreboard!");
});


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


// =========================================================
// 🎁 v47 SECRET PLACE GIVEAWAY — PUBLIC HANDLER
// =========================================================
(function initPublicGiveaway() {
  const headerBanner = document.getElementById("giveaway-header-banner");
  const welcomePopup = document.getElementById("giveaway-welcome-popup");
  const welcomePrize = document.getElementById("gw-welcome-prize");
  const welcomeHint = document.getElementById("gw-welcome-hint");
  const btnCloseWelcome = document.getElementById("btn-close-gw-welcome");
  const btnStartHunt = document.getElementById("btn-gw-start-hunt");

  const claimModal = document.getElementById("giveaway-claim-modal");
  const claimTitle = document.getElementById("gw-claim-title");
  const claimDesc = document.getElementById("gw-claim-desc");
  const codeDisplay = document.getElementById("gw-secret-code-display");
  const statusText = document.getElementById("gw-claim-status-text");
  const btnCloseClaim = document.getElementById("btn-close-gw-claim");
  const btnWa = document.getElementById("btn-claim-whatsapp");
  const btnIg = document.getElementById("btn-claim-instagram");

  let currentGiveaway = null;
  let initialBannerShown = false;
  let bannerTimer = null;

  const showHeaderBanner5s = (text, isClaimed) => {
    if (!headerBanner) return;
    headerBanner.textContent = text;
    headerBanner.classList.toggle("claimed-banner", Boolean(isClaimed));
    headerBanner.classList.remove("hidden");
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      headerBanner.classList.add("hidden");
    }, 5000);
  };

  if (btnCloseWelcome) btnCloseWelcome.addEventListener("click", () => welcomePopup.classList.add("hidden"));
  if (btnStartHunt) btnStartHunt.addEventListener("click", () => welcomePopup.classList.add("hidden"));
  if (btnCloseClaim) btnCloseClaim.addEventListener("click", () => claimModal.classList.add("hidden"));

  const openClaimModal = (cfg) => {
    if (!cfg || !claimModal) return;
    const maxC = Number(cfg.maxClaims) || 1;
    const curC = Number(cfg.claimedCount) || 0;
    const isClaimed = Boolean(cfg.claimed) || curC >= maxC;

    if (isClaimed) {
      claimTitle.textContent = "🏆 GIVEAWAY ALREADY CLAIMED!";
      claimDesc.textContent = "Someone already found this Secret Place and claimed the prize. Stay tuned for the next drop!";
      codeDisplay.textContent = "CLAIMED";
      statusText.textContent = `Status: Giveaway Claimed (${curC}/${maxC})`;
      if (btnWa) btnWa.disabled = true;
      if (btnIg) btnIg.disabled = true;
    } else {
      claimTitle.textContent = "🎉 YOU FOUND THE SECRET PLACE!";
      claimDesc.textContent = `Prize: ${cfg.prizeTitle || "Special Giveaway"} — Tap WhatsApp or Instagram below to claim immediately!`;
      codeDisplay.textContent = cfg.secretCode || "SHERU-WIN";
      statusText.textContent = `Remaining Claims: ${Math.max(0, maxC - curC)} of ${maxC}`;
      if (btnWa) btnWa.disabled = !cfg.whatsappNumber;
      if (btnIg) btnIg.disabled = !cfg.instagramHandle;
    }
    claimModal.classList.remove("hidden");
  };

  engine.onGiveawayFound = (cfg) => {
    openClaimModal(currentGiveaway || cfg);
  };

  const executeAtomicClaim = async (platform) => {
    if (!currentGiveaway || !currentGiveaway.active) return;
    const gwRef = ref(db, "worldSettings/giveaway");
    try {
      const txRes = await runTransaction(gwRef, (data) => {
        if (!data || !data.active) return data;
        const maxC = Number(data.maxClaims) || 1;
        const curC = Number(data.claimedCount) || 0;
        if (data.claimed || curC >= maxC) {
          return; // Abort transaction — already claimed!
        }
        data.claimedCount = curC + 1;
        if (data.claimedCount >= maxC) {
          data.claimed = true;
        }
        data.lastClaimedAt = Date.now();
        return data;
      });

      if (!txRes.committed) {
        openClaimModal(currentGiveaway);
        showHeaderBanner5s("🏆 Giveaway was just claimed by another player!", true);
        return;
      }

      const code = currentGiveaway.secretCode || "SHERU-WIN";
      const prize = currentGiveaway.prizeTitle || "Secret Place Giveaway";
      const msgText = `Hi! I found the Secret Place in Sheru Bhai City (stgames.online)! 🎁\nPrize: ${prize}\nSecret Code: ${code}`;

      claimModal.classList.add("hidden");
      showHeaderBanner5s("🏆 GIVEAWAY CLAIMED! Sending your Secret Code now...", true);

      if (platform === "whatsapp") {
        const num = String(currentGiveaway.whatsappNumber || "").replace(/[^0-9]/g, "");
        const waUrl = `https://wa.me/${num}?text=${encodeURIComponent(msgText)}`;
        window.open(waUrl, "_blank");
      } else {
        // Copy secret code + message automatically to clipboard, then open Instagram DM!
        try { await navigator.clipboard.writeText(msgText); } catch (e) {}
        const handle = String(currentGiveaway.instagramHandle || "_satish_official_16").replace(/^@/, "").trim();
        const igUrl = `https://ig.me/m/${encodeURIComponent(handle)}`;
        window.open(igUrl, "_blank");
      }
    } catch (err) {
      console.error("Giveaway claim failed:", err);
      alert("Could not claim right now. Please check your internet and try again.");
    }
  };

  if (btnWa) btnWa.addEventListener("click", () => executeAtomicClaim("whatsapp"));
  if (btnIg) btnIg.addEventListener("click", () => executeAtomicClaim("instagram"));

  // Real-time listener for Giveaway status
  onValue(ref(db, "worldSettings/giveaway"), (snap) => {
    const cfg = snap.val();
    currentGiveaway = cfg || null;
    engine.setGiveawayConfig(currentGiveaway);

    if (!cfg || !cfg.active) {
      if (welcomePopup) welcomePopup.classList.add("hidden");
      return;
    }

    const maxC = Number(cfg.maxClaims) || 1;
    const curC = Number(cfg.claimedCount) || 0;
    const isClaimed = Boolean(cfg.claimed) || curC >= maxC;

    if (!initialBannerShown) {
      initialBannerShown = true;
      if (isClaimed) {
        showHeaderBanner5s("🏆 GIVEAWAY CLAIMED! Stay tuned for the next Secret Drop!", true);
      } else {
        showHeaderBanner5s(`🎁 LIVE GIVEAWAY: ${cfg.prizeTitle || "Secret Prize"} — Find the hidden chest!`, false);
        if (welcomePopup && welcomePrize && welcomeHint) {
          welcomePrize.textContent = cfg.prizeTitle || "Secret Place Giveaway";
          welcomeHint.textContent = cfg.hint || "Explore Sheru Bhai City to find the glowing Golden Chest and claim the Secret Code!";
          welcomePopup.classList.remove("hidden");
        }
      }
    } else if (isClaimed) {
      // Live update if someone claims it while user is playing!
      showHeaderBanner5s("🏆 GIVEAWAY CLAIMED! Winner just unlocked the Secret Code!", true);
      if (welcomePopup) welcomePopup.classList.add("hidden");
    }
  });
})();
