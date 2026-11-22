import { db, ref, onValue } from "./firebase-config.js";
import { FollowerTownEngine } from "./world-engine.js";

let allPlots = {};

const container = document.getElementById("canvas-container");
const plotCard = document.getElementById("plot-card");

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
  const num = parseInt(plotId.replace("plot_", ""), 10);
  document.getElementById("card-plot-id").textContent = `PLOT #${num}`;

  if (data && data.status === "built") {
    document.getElementById("card-owner").textContent = data.ownerName || `Follower #${num}`;
    document.getElementById("card-role").textContent = data.role || "Town Resident";
    document.getElementById("card-type").textContent = (data.buildingType || "house").replace("_", " ").toUpperCase();
    document.getElementById("card-day").textContent = `Built Day ${data.builtDay || 1}`;
  } else {
    document.getElementById("card-owner").textContent = "Available Plot";
    document.getElementById("card-role").textContent = "Follow to get your house built here!";
    document.getElementById("card-type").textContent = "EMPTY";
    document.getElementById("card-day").textContent = "";
  }
  plotCard.classList.remove("hidden");
}

// Realtime Read-Only Listeners
let initialLoadDone = false;
onValue(ref(db, "plots"), (snapshot) => {
  const data = snapshot.val() || {};
  const keys = Object.keys(data);

  let maxIndex = 36;
  let builtCount = 0;
  keys.forEach((k) => {
    const idx = parseInt(k.replace("plot_", ""), 10);
    if (!isNaN(idx) && idx > maxIndex) maxIndex = idx;
    if (data[k]?.status === "built") builtCount++;
  });

  engine.ensureCapacity(maxIndex + 8);

  keys.forEach((plotId) => {
    const changed = JSON.stringify(allPlots[plotId]) !== JSON.stringify(data[plotId]);
    if (changed) {
      const animate = initialLoadDone && data[plotId]?.status === "built";
      engine.renderPlot(plotId, data[plotId], animate);
    }
  });

  Object.keys(allPlots).forEach((plotId) => {
    if (!data[plotId]) {
      engine.renderPlot(plotId, { status: "empty", buildingType: "empty" }, false);
    }
  });

  allPlots = data;
  initialLoadDone = true;
  document.getElementById("stat-houses").textContent = `${builtCount} Houses`;
});

onValue(ref(db, "worldSettings"), (snapshot) => {
  const val = snapshot.val();
  if (!val) return;
  document.getElementById("town-title").textContent = val.townName || "FOLLOWER TOWN";
  document.getElementById("stat-day").textContent = `Day ${val.dayNumber || 1}`;
  engine.setTimeOfDay(val.timeOfDay || "day");
  engine.lifeEnabled = val.lifeEnabled !== false;
});

// Username Search
function runSearch() {
  const q = document.getElementById("search-input").value;
  const foundId = engine.findPlotByUsername(q);
  if (foundId) {
    engine.focusPlot(foundId);
    openPlotCard(foundId, allPlots[foundId]);
  } else {
    showToast("Username not found in town yet!");
  }
}

document.getElementById("search-btn").addEventListener("click", runSearch);
document.getElementById("search-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});
document.getElementById("close-plot-card").addEventListener("click", () => {
  plotCard.classList.add("hidden");
});
