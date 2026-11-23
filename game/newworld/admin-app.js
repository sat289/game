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
} from "./firebase-config.js?v=15";
import {
  FollowerTownEngine,
  BUILDING_LABELS,
  getRequiredSize,
  getBlockPlotIds,
  getEightPlotGroup
} from "./world-engine.js?v=15";

let isAdmin = false;
let selectedPlotId = "plot_0001";
let allPlots = {};
let pendingNewFollowers = [];
let worldSettings = {
  townName: "FOLLOWER NAGARAM",
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
const editBtn = document.getElementById("card-edit-btn");
const websiteBtn = document.getElementById("card-website-btn");

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
  showToast._timer = setTimeout(() => t.classList.add("hidden"), 3200);
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
  if (plotId === "ST_JUNCTION") {
    document.getElementById("card-badge").textContent = "CITY CENTER LANDMARK";
    document.getElementById("card-owner").textContent = "🗿 SHERU BHAI • ST JUNCTION";
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
      size === 8 ? "8-PLOT MEGA STADIUM" : size === 4 ? "4-PLOT LANDMARK" : data.buildingType.startsWith("tower_") ? "5-FLOOR MODERN TOWER" : "CLASSIC HOUSE";
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

onValue(worldRef, (snapshot) => {
  const val = snapshot.val();
  if (!val) return;
  worldSettings = { ...worldSettings, ...val };
  const name = worldSettings.townName || "FOLLOWER NAGARAM";
  document.getElementById("town-title").textContent = `ADMIN • ${name}`;
  document.getElementById("stat-day").textContent = `Day ${worldSettings.dayNumber || 1}`;
  engine.setTownName(name);
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
  if (!isAdmin || selectedPlotId === "ST_JUNCTION") return;
  const type = document.getElementById("b-type").value;
  let ownerName = document.getElementById("b-owner").value.trim();
  const role = document.getElementById("b-role").value.trim();
  const builtDay = parseInt(document.getElementById("b-day").value, 10) || 1;

  const isHouseOrTower = type.startsWith("house_") || type.startsWith("tower_");
  const newSize = type === "empty" ? 0 : getRequiredSize(type);

  if (type !== "empty" && isHouseOrTower && !ownerName) {
    showToast("Please enter an Instagram @username!");
    return;
  }
  if (ownerName && isHouseOrTower && !ownerName.startsWith("@")) {
    ownerName = "@" + ownerName;
  }

  const currentData = allPlots[selectedPlotId];
  const oldSize = currentData?.status === "built" ? (currentData.size || getRequiredSize(currentData.buildingType)) : 1;

  const updates = {};
  let relocatedCount = 0;

  if (type === "empty") {
    let toClear = [selectedPlotId];
    if (oldSize === 8) toClear = getEightPlotGroup(selectedPlotId).siblings;
    else if (oldSize === 4) toClear = getBlockPlotIds(selectedPlotId).siblings;

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
  } else if (newSize === 4 || newSize === 8) {
    const groupInfo = newSize === 8 ? getEightPlotGroup(selectedPlotId) : getBlockPlotIds(selectedPlotId);
    const reservedSet = new Set(groupInfo.siblings);
    let searchStart = 1;

    for (const pid of groupInfo.siblings) {
      const existing = allPlots[pid];
      if (
        existing &&
        existing.status === "built" &&
        getRequiredSize(existing.buildingType) === 1 &&
        pid !== selectedPlotId
      ) {
        const { plotId: newPid, nextNum } = findNextFreePlotId(reservedSet, searchStart);
        searchStart = nextNum;
        updates[`plots/${newPid}`] = { ...existing, size: 1 };
        relocatedCount++;
      }
    }

    const anchorPayload = {
      status: "built",
      ownerName: ownerName || BUILDING_LABELS[type] || "Landmark",
      role: role || (newSize === 8 ? "8-Plot Mega Stadium" : "4-Plot Town Landmark"),
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
    if (oldSize === 8 || oldSize === 4) {
      const oldSibs = oldSize === 8 ? getEightPlotGroup(selectedPlotId).siblings : getBlockPlotIds(selectedPlotId).siblings;
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
    } else if (relocatedCount > 0) {
      showToast(`🏗️ Built! Moved ${relocatedCount} houses to free plots.`);
    } else {
      showToast(newSize === 8 ? "🏟️ Built 8-Plot Mega Stadium!" : newSize === 4 ? "🏛️ Built 4-Plot Landmark!" : `🔨 Built ${ownerName}'s plot!`);
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
      if (reqSize >= 4) landmarks.push({ pid, data: p, reqSize });
    }
  });

  if (landmarks.length === 0) return showToast("No multi-plot landmarks found!");

  landmarks.forEach((lm) => {
    const grp = lm.reqSize === 8 ? getEightPlotGroup(lm.pid) : getBlockPlotIds(lm.pid);
    grp.siblings.forEach((s) => reservedSet.add(s));
  });

  let moved = 0;
  let searchStart = 1;

  for (const lm of landmarks) {
    const grp = lm.reqSize === 8 ? getEightPlotGroup(lm.pid) : getBlockPlotIds(lm.pid);

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

function runSearch() {
  const q = document.getElementById("search-input").value;
  const foundId = engine.findPlotByQuery(q);
  if (foundId === "ST_JUNCTION") {
    engine.focusPlot("ST_JUNCTION");
    openPlotCard("ST_JUNCTION", null);
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
  showToast("🎬 9:16 Reel Mode — Tap ⚡ Pro Reel to auto-shoot!");
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
  showToast("🚁 High-Speed Drone View Active!");
  engine.startDroneView(() => {
    btnDroneView.classList.remove("active");
    btnDroneView.textContent = "🚁 Drone";
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
  engine.stopProReelTour();
  engine.stopDroneView();
  engine.stopBuildReelTour();
  engine.autoSpin = false;
  reelControls.classList.add("hidden");
  reelBanner.classList.add("hidden");
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

// Lazy-load Sketchfab Sheru Bhai 3D Model ONLY when clicked (frees 100% RAM on close!)
const SKETCHFAB_URL = "https://sketchfab.com/models/011d2f8f40e146ff8b2d7dfc70e939f8/embed?autostart=1&ui_theme=dark";
const sheru3dBtn = document.getElementById("card-sheru3d-btn");
const sketchfabModal = document.getElementById("sketchfab-modal");
const sketchfabIframe = document.getElementById("sketchfab-iframe");

if (sheru3dBtn && sketchfabModal && sketchfabIframe) {
  sheru3dBtn.addEventListener("click", () => {
    sketchfabIframe.src = SKETCHFAB_URL;
    sketchfabModal.classList.remove("hidden");
  });
  document.getElementById("close-sketchfab").addEventListener("click", () => {
    sketchfabModal.classList.add("hidden");
    sketchfabIframe.src = "about:blank";
  });
}
