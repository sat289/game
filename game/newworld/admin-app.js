import {
  ADMIN_UID,
  db,
  auth,
  ref,
  onValue,
  update,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "./firebase-config.js";
import { FollowerTownEngine } from "./world-engine.js";

let isAdmin = false;
let selectedPlotId = "plot_0001";
let allPlots = {};
let worldSettings = {
  townName: "FOLLOWER TOWN",
  dayNumber: 1,
  timeOfDay: "day",
  lifeEnabled: true
};

const container = document.getElementById("canvas-container");
const adminGate = document.getElementById("admin-gate");
const topHud = document.getElementById("top-hud");
const adminDock = document.getElementById("admin-dock");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const plotCard = document.getElementById("plot-card");

const panels = {
  builder: document.getElementById("panel-builder"),
  bulk: document.getElementById("panel-bulk"),
  world: document.getElementById("panel-world")
};

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.add("hidden"), 2800);
}

function closeAllDrawers() {
  Object.values(panels).forEach((p) => p.classList.add("hidden"));
}

const engine = new FollowerTownEngine(container, (plotId, data) => {
  if (!isAdmin) return;
  selectedPlotId = plotId;
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
    document.getElementById("card-role").textContent = "Tap Edit to build here";
    document.getElementById("card-type").textContent = "EMPTY";
    document.getElementById("card-day").textContent = "";
  }

  document.getElementById("builder-plot-label").textContent = `Plot #${num}`;
  document.getElementById("b-owner").value = data?.ownerName || "";
  document.getElementById("b-role").value = data?.role || "";
  document.getElementById("b-type").value = data?.status === "built" ? data.buildingType : "house_blue";
  document.getElementById("b-day").value = data?.builtDay || worldSettings.dayNumber || 1;
  plotCard.classList.remove("hidden");
}

// Firebase Listeners
const plotsRef = ref(db, "plots");
const worldRef = ref(db, "worldSettings");
let initialLoadDone = false;

onValue(plotsRef, (snapshot) => {
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

onValue(worldRef, (snapshot) => {
  const val = snapshot.val();
  if (!val) return;
  worldSettings = { ...worldSettings, ...val };
  document.getElementById("town-title").textContent = `ADMIN • ${worldSettings.townName || "FOLLOWER TOWN"}`;
  document.getElementById("stat-day").textContent = `Day ${worldSettings.dayNumber || 1}`;
  engine.setTimeOfDay(worldSettings.timeOfDay || "day");
  engine.lifeEnabled = worldSettings.lifeEnabled !== false;

  document.getElementById("w-name").value = worldSettings.townName || "FOLLOWER TOWN";
  document.getElementById("w-day").value = worldSettings.dayNumber || 1;
  document.getElementById("w-time").value = worldSettings.timeOfDay || "day";
  document.getElementById("w-life").value = engine.lifeEnabled ? "on" : "off";
});

// Strict Admin UID Gate
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

// Build Single Plot
document.getElementById("btn-save-plot").addEventListener("click", async () => {
  if (!isAdmin) return;
  const type = document.getElementById("b-type").value;
  const ownerName = document.getElementById("b-owner").value.trim();
  const role = document.getElementById("b-role").value.trim();
  const builtDay = parseInt(document.getElementById("b-day").value, 10) || 1;

  const payload =
    type === "empty"
      ? { status: "empty", ownerName: "", role: "", buildingType: "empty", builtDay }
      : {
          status: "built",
          ownerName: ownerName || `Resident ${selectedPlotId}`,
          role: role || "Town Resident",
          buildingType: type,
          builtDay
        };

  try {
    await update(ref(db, `plots/${selectedPlotId}`), payload);
    showToast(type === "empty" ? "Plot cleared" : `Constructing ${payload.ownerName}'s plot!`);
    closeAllDrawers();
    openPlotCard(selectedPlotId, payload);
  } catch (err) {
    showToast("Error: " + err.message);
  }
});

// 400+ Follower Auto-Expand Sync
const HOUSE_STYLES = ["house_blue", "house_coral", "house_mint", "house_gold"];

document.getElementById("btn-import-usernames").addEventListener("click", async () => {
  if (!isAdmin) return;
  const names = document
    .getElementById("bulk-usernames")
    .value.split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!names.length) return showToast("Paste at least 1 username!");

  const existing = new Set();
  Object.values(allPlots).forEach((p) => {
    if (p?.status === "built" && p.ownerName) {
      existing.add(p.ownerName.toLowerCase().replace(/^@/, ""));
    }
  });

  const updates = {};
  let nextPlotNum = 1;
  let added = 0;

  for (const name of names) {
    const cleanKey = name.toLowerCase().replace(/^@/, "");
    if (existing.has(cleanKey)) continue;

    while (allPlots[`plot_${String(nextPlotNum).padStart(4, "0")}`]?.status === "built") {
      nextPlotNum++;
    }
    const plotId = `plot_${String(nextPlotNum).padStart(4, "0")}`;
    updates[`plots/${plotId}`] = {
      status: "built",
      ownerName: name.startsWith("@") ? name : `@${name}`,
      role: "Follower Resident",
      buildingType: HOUSE_STYLES[nextPlotNum % HOUSE_STYLES.length],
      builtDay: worldSettings.dayNumber || 1
    };
    existing.add(cleanKey);
    nextPlotNum++;
    added++;
  }

  if (!added) return showToast("All pasted usernames already have houses!");

  try {
    await update(ref(db), updates);
    document.getElementById("bulk-usernames").value = "";
    showToast(`🏘️ Built ${added} new follower houses!`);
    closeAllDrawers();
  } catch (err) {
    showToast("Sync error: " + err.message);
  }
});

document.getElementById("btn-sync-count").addEventListener("click", async () => {
  if (!isAdmin) return;
  const target = parseInt(document.getElementById("bulk-count").value, 10);
  if (isNaN(target) || target < 1) return;

  const updates = {};
  let added = 0;
  for (let i = 1; i <= target; i++) {
    const plotId = `plot_${String(i).padStart(4, "0")}`;
    if (allPlots[plotId]?.status !== "built") {
      updates[`plots/${plotId}`] = {
        status: "built",
        ownerName: `Follower #${i}`,
        role: "Town Citizen",
        buildingType: HOUSE_STYLES[i % HOUSE_STYLES.length],
        builtDay: worldSettings.dayNumber || 1
      };
      added++;
    }
  }

  if (!added) return showToast(`Already have ${target}+ houses built!`);

  try {
    await update(ref(db), updates);
    showToast(`⚡ Auto-built ${added} houses!`);
    closeAllDrawers();
  } catch (err) {
    showToast("Sync error: " + err.message);
  }
});

document.getElementById("btn-save-world").addEventListener("click", async () => {
  if (!isAdmin) return;
  try {
    await update(worldRef, {
      townName: document.getElementById("w-name").value.trim() || "FOLLOWER TOWN",
      dayNumber: parseInt(document.getElementById("w-day").value, 10) || 1,
      timeOfDay: document.getElementById("w-time").value,
      lifeEnabled: document.getElementById("w-life").value === "on"
    });
    showToast("World updated live!");
    closeAllDrawers();
  } catch (err) {
    showToast("Error: " + err.message);
  }
});

// UI & 9:16 Reel Controls
function runSearch() {
  const q = document.getElementById("search-input").value;
  const foundId = engine.findPlotByUsername(q);
  if (foundId) {
    selectedPlotId = foundId;
    engine.focusPlot(foundId);
    openPlotCard(foundId, allPlots[foundId]);
  } else {
    showToast("Follower house not found!");
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

const reelControls = document.getElementById("reel-controls");
document.getElementById("btn-reel-mode").addEventListener("click", () => {
  closeAllDrawers();
  plotCard.classList.add("hidden");
  document.querySelectorAll(".hud-element").forEach((el) => el.classList.add("hidden"));
  reelControls.classList.remove("hidden");
  showToast("🎬 9:16 Reel Mode Ready");
});

document.getElementById("reel-exit").addEventListener("click", () => {
  engine.autoSpin = false;
  reelControls.classList.add("hidden");
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
