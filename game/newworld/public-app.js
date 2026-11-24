import { db, ref, onValue } from "./firebase-config.js?v=18";
import { FollowerTownEngine, BUILDING_LABELS, getRequiredSize } from "./world-engine.js?v=18";

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
  openPlotCard(plotId, data);
});

function openPlotCard(plotId, data) {
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
        ? (data.buildingType === "audi_showroom" ? "8-PLOT AUDI SHOWROOM" : "8-PLOT MEGA STADIUM")
        : size === 4
        ? "4-PLOT LANDMARK"
        : size === 2
        ? "2-PLOT STUDIO"
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

  keys.forEach((plotId) => {
    const animate = initialLoadDone && data[plotId]?.status === "built" && JSON.stringify(allPlots[plotId]) !== JSON.stringify(data[plotId]);
    engine.renderPlot(plotId, data[plotId], animate);
  });

  Object.keys(allPlots).forEach((plotId) => {
    if (!data[plotId]) {
      engine.renderPlot(plotId, { status: "empty", buildingType: "empty" }, false);
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
  engine.setTimeOfDay(val.timeOfDay || "day");
  engine.lifeEnabled = val.lifeEnabled !== false;
});

function runSearch() {
  const q = document.getElementById("search-input").value;
  const foundId = engine.findPlotByQuery(q);
  if (foundId === "ST_JUNCTION" || foundId === "AIRPORT" || foundId === "BEACH") {
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

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        instagram_username: uname.startsWith("@") ? uname : `@${uname}`,
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
      showToast("Could not send request. Try again!");
    }
  } catch {
    showToast("Network error. Try again!");
  } finally {
    reqSubmitBtn.disabled = false;
    reqSubmitBtn.textContent = "🚀 Send Request";
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
