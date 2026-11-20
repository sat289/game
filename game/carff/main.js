(() => {
  const $ = s => document.querySelector(s);
  const FIREBASE_PROJECT_ID = "friendsgame-872f5";
  const FIREBASE_DB_URL = "https://friendsgame-872f5-default-rtdb.firebaseio.com";

  function getStageRect() {
    const isPortrait = window.innerHeight > window.innerWidth;
    return {
      width: isPortrait ? window.innerHeight : window.innerWidth,
      height: isPortrait ? window.innerWidth : window.innerHeight,
      isPortrait
    };
  }
  window.getStageRect = getStageRect;

  function request16x9Fullscreen() {
    try {
      const docEl = document.documentElement;
      const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
      if (req && !document.fullscreenElement) {
        Promise.resolve(req.call(docEl)).then(() => {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
          }
        }).catch(() => {});
      } else if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}
  }
  window.request16x9Fullscreen = request16x9Fullscreen;

  document.addEventListener('pointerdown', () => {
    request16x9Fullscreen();
  }, { once: true });

  let toastTimer = null;
  function showToast(msg) {
    let el = document.getElementById('stToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'stToast';
      el.className = 'st-toast hidden';
      ($('#stage16x9') || document.body).appendChild(el);
    }
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
  }
  window.showToast = showToast;

  function safeGetLS(key, fallback) {
    try { const v = localStorage.getItem(key); return v !== null ? v : fallback; } catch (e) { return fallback; }
  }
  function safeSetLS(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  }

  // ========================================================
  // SEQUENTIAL UID ALLOCATOR (STARTS AT 11111, UNIQUE PER ACCOUNT/DEVICE)
  // ========================================================
  function getAccountKey(mode, email) {
    if (mode === 'google' && email) {
      return 'google_' + String(email).trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    let guestSlot = safeGetLS('sthw_guest_device_key', '');
    if (!guestSlot) {
      guestSlot = 'guest_' + Date.now().toString(36) + '_' + Math.floor(10000 + Math.random() * 89999);
      safeSetLS('sthw_guest_device_key', guestSlot);
    }
    return guestSlot;
  }

  async function getOrAssignSequentialUID(mode, email) {
    const accKey = getAccountKey(mode, email);
    let localMap = {};
    try { localMap = JSON.parse(safeGetLS('sthw_account_uids_v9', '{}')) || {}; } catch (e) { localMap = {}; }

    if (localMap[accKey]) return String(localMap[accKey]);

    if (mode === 'google') {
      try {
        const rAcc = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/account_uids/${encodeURIComponent(accKey)}.json`, { cache: 'no-store' });
        if (rAcc.ok) {
          const existingUid = await rAcc.json();
          if (existingUid && Number(existingUid) >= 11111) {
            localMap[accKey] = String(existingUid);
            safeSetLS('sthw_account_uids_v9', JSON.stringify(localMap));
            return String(existingUid);
          }
        }
      } catch (e) {}
    }

    let nextUid = 11111;
    try {
      const rCnt = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/uid_counter.json`, { cache: 'no-store' });
      if (rCnt.ok) {
        const fbCnt = parseInt(await rCnt.json(), 10);
        if (!isNaN(fbCnt) && fbCnt >= 11111) nextUid = fbCnt + 1;
      }
      const rUids = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/uids.json?shallow=true`, { cache: 'no-store' });
      if (rUids.ok) {
        const keysObj = await rUids.json();
        if (keysObj && typeof keysObj === 'object') {
          Object.keys(keysObj).forEach(k => {
            const n = parseInt(k, 10);
            if (!isNaN(n) && n >= 11111 && n < 9999999 && n >= nextUid) nextUid = n + 1;
          });
        }
      }
    } catch (e) {
      const localCnt = parseInt(safeGetLS('sthw_uid_counter', '11111'), 10) || 11111;
      nextUid = Math.max(11111, localCnt);
    }

    const assigned = String(nextUid);
    localMap[accKey] = assigned;
    safeSetLS('sthw_account_uids_v9', JSON.stringify(localMap));
    safeSetLS('sthw_uid_counter', String(nextUid + 1));

    try {
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/uid_counter.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nextUid)
      });
      if (mode === 'google') {
        await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/account_uids/${encodeURIComponent(accKey)}.json`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assigned)
        });
      }
    } catch (e) {}

    return assigned;
  }

  // ========================================================
  // CONTROL SETTINGS & GAMEPLAY TUNING (SYNCED WITH ADMIN)
  // ========================================================
  let controlSettings = {
    tiltEnabled: true,
    tiltSensitivity: 1.0,
    desktopKeyboard: true,
    touchButtons: true
  };
  try {
    const savedCtrl = JSON.parse(safeGetLS('sthw_controls', 'null'));
    if (savedCtrl && typeof savedCtrl === 'object') controlSettings = Object.assign(controlSettings, savedCtrl);
  } catch (e) {}
  window.STControls = controlSettings;

  window.STGameplayTuning = {
    trafficCount: 8,
    nearMissMultiplier: 1.0,
    xpMultiplier: 1.0,
    speedMultiplier: 1.0
  };

  function saveControlSettings() {
    safeSetLS('sthw_controls', JSON.stringify(controlSettings));
    window.STControls = controlSettings;
    updateLobbyHUD();
  }

  // ========================================================
  // SLOW LEVELING & XP PROGRESS SYSTEM (STARTS AT LV 1)
  // ========================================================
  let playerLevel = Math.max(1, parseInt(safeGetLS('sthw_level', '1'), 10) || 1);
  let playerXP = Math.max(0, parseInt(safeGetLS('sthw_xp', '0'), 10) || 0);

  function xpForNextLevel(lv) {
    return Math.floor(1000 * Math.pow(1.45, Math.max(0, lv - 1)));
  }

  function addPlayerXP(amount) {
    if (!amount || amount <= 0) return false;
    playerXP += Math.floor(amount);
    let leveledUp = false;
    while (playerXP >= xpForNextLevel(playerLevel)) {
      playerXP -= xpForNextLevel(playerLevel);
      playerLevel += 1;
      leveledUp = true;
    }
    safeSetLS('sthw_level', String(playerLevel));
    safeSetLS('sthw_xp', String(playerXP));
    updateLobbyHUD();
    return leveledUp;
  }

  // ========================================================
  // ACCOUNT STATE — DEFAULTS TO LOCAL GUEST (NO FORCED POPUP!)
  // ========================================================
  let currentUser = null;
  try { currentUser = JSON.parse(safeGetLS('sthw_fb_user', 'null')); } catch (e) { currentUser = null; }
  let sessionMode = safeGetLS('sthw_session_mode', 'guest') || 'guest';
  let playerUID = safeGetLS('sthw_player_uid', '');

  let savedGoogleAccounts = [];
  try {
    const parsedG = JSON.parse(safeGetLS('sthw_google_accounts', 'null'));
    if (Array.isArray(parsedG)) savedGoogleAccounts = parsedG;
  } catch (e) { savedGoogleAccounts = []; }

  function cleanUsernameKey(name) {
    return String(name || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 18);
  }

  async function isUsernameAvailable(name) {
    const key = cleanUsernameKey(name);
    if (key.length < 3) return false;
    try {
      const r = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/usernames/${encodeURIComponent(key)}.json`, { cache: 'no-store' });
      if (r.ok) {
        const ownerUid = await r.json();
        return !ownerUid || String(ownerUid) === String(playerUID);
      }
    } catch (e) {}
    return true;
  }

  async function claimAvailableUsername(desiredName) {
    let base = String(desiredName || 'RACER').trim().replace(/[^a-zA-Z0-9_ ]/g, '').replace(/\s+/g, '_').slice(0, 14) || 'RACER';
    if (base.length < 3) base = 'RACER_' + String(playerUID || '11111').slice(-3);
    let candidate = base;
    for (let i = 0; i < 4; i++) {
      if (await isUsernameAvailable(candidate)) break;
      candidate = `${base.slice(0, 11)}_${Math.floor(100 + Math.random() * 900)}`;
    }
    const key = cleanUsernameKey(candidate);
    try {
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/usernames/${encodeURIComponent(key)}.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(playerUID)
      });
    } catch (e) {}
    return candidate;
  }

  async function initDefaultGuestSession() {
    if (!currentUser || !playerUID || playerUID.length > 7) {
      sessionMode = 'guest';
      playerUID = await getOrAssignSequentialUID('guest', '');
      safeSetLS('sthw_player_uid', playerUID);
      currentUser = {
        uid: playerUID,
        name: 'GUEST_' + playerUID,
        email: '',
        mode: 'guest'
      };
      safeSetLS('sthw_fb_user', JSON.stringify(currentUser));
      safeSetLS('sthw_session_mode', 'guest');
    }
    updateLobbyHUD();
    savePlayerState();
  }

  // Player Economy & Garage (CARS ONLY)
  let coins = +(safeGetLS('sthwCoins', '144675'));
  let gems = +(safeGetLS('sthwGems', '2450'));
  let bestDistKm = parseFloat(safeGetLS('sthwBestDistKm', '0')) || 0;
  let selected = safeGetLS('sthwVehicle', 'agera');
  let selectedSkin = safeGetLS('sthwSkin', 'skin_crimson');
  let mapName = safeGetLS('sthwMap', 'Sunset Highway');
  if (!(window.MAPS || []).some(m => m.name === mapName)) mapName = 'Sunset Highway';

  let owned = [], ownedSkins = [], savedMaps = [], upgrade = {}, claimedNotifs = [];
  try { owned = JSON.parse(safeGetLS('sthwOwned', '["agera","astra_gt"]')); } catch (e) { owned = ['agera', 'astra_gt']; }
  ['agera', 'astra_gt'].forEach(defId => { if (!owned.includes(defId)) owned.push(defId); });
  try { ownedSkins = JSON.parse(safeGetLS('sthwOwnedSkins', '["skin_crimson"]')); } catch (e) { ownedSkins = ['skin_crimson']; }
  try { savedMaps = JSON.parse(safeGetLS('sthwMaps', '["Sunset Highway","Countryside Autobahn"]')); } catch (e) { savedMaps = ['Sunset Highway', 'Countryside Autobahn']; }
  if (!savedMaps.includes('Sunset Highway')) savedMaps.unshift('Sunset Highway');
  try { upgrade = JSON.parse(safeGetLS('sthwUpgrade', '{}')); } catch (e) { upgrade = {}; }
  try { claimedNotifs = JSON.parse(safeGetLS('sthwClaimedNotifs', '[]')); } catch (e) { claimedNotifs = []; }

  const custom3DModelCache = {};

  let liveConfig = {
    homepageBackground: "assets/backgrounds/homepage-bg.png",
    gameplay: { trafficCount: 8, nearMissMultiplier: 1.0, xpMultiplier: 1.0, speedMultiplier: 1.0 },
    notifications: [
      { id: "notif_v9", title: "🏎️ Welcome to ST GAMES 3D Highway Racer!", body: "Play immediately as Guest or tap your Profile to switch Google Accounts anytime. Near-miss highway cars to earn T-Coins & XP!", rewardCoins: 3000 }
    ],
    events: [
      { id: "ev_sunset", title: "🌅 Sunset Near-Miss T-Coin Rush", desc: "Pass close to traffic cars to earn massive T-Coins!", map: "Sunset Highway", vehicle: "agera", rewardCoins: 5000, badge: "T-COIN CUP" },
      { id: "ev_autobahn", title: "🏎️ Autobahn Top Speed Run", desc: "Push 260+ KMH on Countryside Autobahn!", map: "Countryside Autobahn", vehicle: "agera", rewardCoins: 7500, badge: "SPEED RUN" }
    ],
    customButtons: [],
    customVehicles: [],
    customMaps: [],
    customSkins: []
  };

  function base64ToArrayBuffer(b64) {
    const bin = atob(b64), len = bin.length, bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  async function fetchModelBufferFromUrls(urls) {
    for (const u of urls) {
      if (!u) continue;
      try {
        const res = await fetch(u, { cache: 'no-store' });
        if (res.ok) return await res.arrayBuffer();
      } catch (e) {}
    }
    return null;
  }

  async function ensureCustomModelLoaded(veh) {
    if (!veh || !veh.id) return null;
    if (custom3DModelCache[veh.id]) return custom3DModelCache[veh.id];
    if (!veh.isCustomAdmin && !veh.inlineObjText && !veh.inlineGlbBase64 && !veh.hasStoredBlob && !veh.modelUrl && !veh.rawModelUrl) return null;
    const THREE = window.THREE;
    if (!THREE) return null;

    let blobRec = window.ModelStorage ? await window.ModelStorage.getModelData(veh.id) : null;
    const fmt = (blobRec?.format || veh.modelFormat || '').toLowerCase();
    const rawData = blobRec?.data || veh.inlineGlbBase64 || veh.inlineObjText || null;
    const candidateUrls = [veh.rawModelUrl, veh.modelUrl].filter(Boolean);

    // 1. FBX Support (Local IndexedDB/LocalStorage OR GitHub Raw URL on other devices)
    if (fmt === 'fbx' && THREE.FBXLoader) {
      try {
        let buf = null;
        if (rawData) {
          buf = (typeof rawData === 'string' && rawData.startsWith('; FBX'))
            ? new TextEncoder().encode(rawData).buffer
            : base64ToArrayBuffer(rawData);
        } else {
          buf = await fetchModelBufferFromUrls(candidateUrls);
        }
        if (buf) {
          const obj = new THREE.FBXLoader().parse(buf, '');
          custom3DModelCache[veh.id] = obj;
          if (selected === veh.id) rebuildTurntableVehicle();
          return obj;
        }
      } catch (e) {}
    }

    // 2. GLB / GLTF Support (Local OR GitHub Raw URL on other devices)
    if ((fmt === 'glb' || fmt === 'gltf') && THREE.GLTFLoader) {
      try {
        let bufOrText = null;
        if (rawData) {
          bufOrText = fmt === 'glb' ? base64ToArrayBuffer(rawData) : rawData;
        } else {
          const ab = await fetchModelBufferFromUrls(candidateUrls);
          if (ab) bufOrText = fmt === 'glb' ? ab : new TextDecoder().decode(ab);
        }
        if (bufOrText) {
          return await new Promise((resolve) => {
            try {
              new THREE.GLTFLoader().parse(bufOrText, '', (gltf) => {
                custom3DModelCache[veh.id] = gltf.scene;
                if (selected === veh.id) rebuildTurntableVehicle();
                resolve(gltf.scene);
              }, () => resolve(null));
            } catch (e) { resolve(null); }
          });
        }
      } catch (e) {}
    }

    // 3. OBJ Support (Local OR GitHub Raw URL on other devices)
    if (fmt === 'obj') {
      try {
        let objText = rawData;
        if (!objText) {
          const ab = await fetchModelBufferFromUrls(candidateUrls);
          if (ab) objText = new TextDecoder().decode(ab);
        }
        if (objText) {
          const grp = parseOBJStringToGroup(objText, veh, getSkin());
          custom3DModelCache[veh.id] = grp;
          if (selected === veh.id) rebuildTurntableVehicle();
          return grp;
        }
      } catch (e) {}
    }
    return null;
  }

  function applyAdminConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return;
    liveConfig = Object.assign({}, liveConfig, cfg);

    if (liveConfig.gameplay && typeof liveConfig.gameplay === 'object') {
      window.STGameplayTuning = Object.assign(window.STGameplayTuning, liveConfig.gameplay);
    }

    if (liveConfig.homepageBackground && $('#lobbyBgImg')) {
      $('#lobbyBgImg').src = liveConfig.homepageBackground;
    }

    const baseVehs = JSON.parse(JSON.stringify(window.DEFAULT_VEHICLES || [])).filter(v => v.type !== 'bike');
    const customVehs = (Array.isArray(liveConfig.customVehicles) ? liveConfig.customVehicles : []).filter(v => v && v.id && v.type !== 'bike');
    const mergedVehs = [...baseVehs];
    customVehs.forEach(cv => {
      cv.type = 'car';
      cv.isCustomAdmin = true;
      const idx = mergedVehs.findIndex(v => v.id === cv.id);
      if (idx >= 0) mergedVehs[idx] = Object.assign({}, mergedVehs[idx], cv);
      else mergedVehs.unshift(cv);
      if ((cv.autoUnlock !== false || cv.price === 0) && !owned.includes(cv.id)) owned.push(cv.id);
      ensureCustomModelLoaded(cv);
    });
    window.VEHICLES = mergedVehs;

    if (!window.VEHICLES.some(v => v.id === selected)) selected = window.VEHICLES[0].id;

    const baseMaps = JSON.parse(JSON.stringify(window.DEFAULT_MAPS || window.MAPS));
    const customMaps = Array.isArray(liveConfig.customMaps) ? liveConfig.customMaps : [];
    const mergedMaps = [...baseMaps];
    customMaps.forEach(cm => {
      if (!cm || !cm.name) return;
      const idx = mergedMaps.findIndex(m => m.name === cm.name);
      if (idx >= 0) mergedMaps[idx] = Object.assign({}, mergedMaps[idx], cm);
      else mergedMaps.push(cm);
    });
    window.MAPS = mergedMaps;
    window.MAPS.forEach(m => { if (savedMaps.includes(m.name) || m.price === 0) m.unlocked = true; });

    const baseSkins = JSON.parse(JSON.stringify(window.DEFAULT_SKINS || []));
    const customSkins = Array.isArray(liveConfig.customSkins) ? liveConfig.customSkins : [];
    const mergedSkins = [...baseSkins];
    customSkins.forEach(cs => {
      if (!cs || !cs.id) return;
      const idx = mergedSkins.findIndex(s => s.id === cs.id);
      if (idx >= 0) mergedSkins[idx] = Object.assign({}, mergedSkins[idx], cs);
      else mergedSkins.push(cs);
    });
    window.VEHICLE_SKINS = mergedSkins;

    renderCustomButtons();
    updateLobbyHUD();
    rebuildTurntableVehicle();
  }

  function mergeCustomVehiclesLists(...lists) {
    const mapById = new Map();
    lists.forEach(list => {
      if (!Array.isArray(list)) return;
      list.forEach(v => {
        if (v && v.id) mapById.set(v.id, Object.assign({}, mapById.get(v.id) || {}, v));
      });
    });
    return Array.from(mapById.values());
  }

  async function loadExternalConfigs() {
    let mergedCfg = Object.assign({}, liveConfig);
    let localCfg = null;
    try {
      localCfg = JSON.parse(safeGetLS('sthw_admin_config', 'null'));
      if (localCfg && typeof localCfg === 'object') {
        mergedCfg = Object.assign({}, mergedCfg, localCfg);
        applyAdminConfig(mergedCfg);
      }
    } catch (e) {}

    // 1. Fetch game-config.json directly from GitHub Raw & relative path (always works even if Firebase is blocked)
    const configUrls = [
      `https://raw.githubusercontent.com/sat289/game/main/carff/game-config.json?t=${Date.now()}`,
      `game-config.json?t=${Date.now()}`
    ];
    let fileCfg = null;
    for (const url of configUrls) {
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (r.ok) {
          const parsed = await r.json();
          if (parsed && typeof parsed === 'object') {
            fileCfg = parsed;
            break;
          }
        }
      } catch (e) {}
    }

    // 2. Fetch Firebase live_config.json
    let fbCfg = null;
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/live_config.json`, { cache: 'no-store' });
      if (res.ok) {
        const parsed = await res.json();
        if (parsed && typeof parsed === 'object') fbCfg = parsed;
      }
    } catch (e) {}

    if (fileCfg) mergedCfg = Object.assign({}, mergedCfg, fileCfg);
    if (fbCfg) mergedCfg = Object.assign({}, mergedCfg, fbCfg);

    mergedCfg.customVehicles = mergeCustomVehiclesLists(
      fileCfg?.customVehicles,
      fbCfg?.customVehicles,
      localCfg?.customVehicles
    );

    safeSetLS('sthw_admin_config', JSON.stringify(mergedCfg));
    applyAdminConfig(mergedCfg);
  }

  async function savePlayerState() {
    const unlockedMapsList = (window.MAPS || []).filter(m => m.unlocked).map(m => m.name);
    savedMaps = unlockedMapsList;

    safeSetLS('sthwCoins', String(coins));
    safeSetLS('sthwGems', String(gems));
    safeSetLS('sthwBestDistKm', String(bestDistKm.toFixed(2)));
    safeSetLS('sthw_level', String(playerLevel));
    safeSetLS('sthw_xp', String(playerXP));
    safeSetLS('sthwVehicle', selected);
    safeSetLS('sthwSkin', selectedSkin);
    safeSetLS('sthwMap', mapName);
    safeSetLS('sthwOwned', JSON.stringify(owned));
    safeSetLS('sthwOwnedSkins', JSON.stringify(ownedSkins));
    safeSetLS('sthwUpgrade', JSON.stringify(upgrade));
    safeSetLS('sthwMaps', JSON.stringify(unlockedMapsList));
    safeSetLS('sthwClaimedNotifs', JSON.stringify(claimedNotifs));

    updateLobbyHUD();

    if (!playerUID) return;
    const displayName = (currentUser && currentUser.name) ? currentUser.name : ('GUEST_' + playerUID);
    const payload = {
      uid: playerUID,
      authMode: sessionMode || 'guest',
      name: displayName,
      email: (currentUser && currentUser.email) || '',
      level: playerLevel,
      xp: playerXP,
      coins, gems, bestDistKm, selected, selectedSkin, mapName,
      owned, ownedSkins, savedMaps: unlockedMapsList, upgrade,
      updatedAt: new Date().toISOString()
    };
    try {
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/uids/${encodeURIComponent(playerUID)}.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
    } catch (e) {}
  }

  function getVehicle(id) {
    const targetId = id || selected;
    return (window.VEHICLES || []).find(v => v.id === targetId) || window.VEHICLES[0];
  }
  function getSkin() { return (window.VEHICLE_SKINS || []).find(s => s.id === selectedSkin) || null; }
  function getMap() { return (window.MAPS || []).find(m => m.name === mapName) || window.MAPS[0]; }

  // ========================================================
  // GOOGLE-STYLE DARK ACCOUNT SWITCHER (NO FORCED POPUP ON LOAD)
  // ========================================================
  async function switchAccount(mode, rawName, email) {
    showToast('⏳ Switching account...');
    playerUID = await getOrAssignSequentialUID(mode, email);
    safeSetLS('sthw_player_uid', playerUID);

    // Load saved cloud stats for this UID if available
    try {
      const r = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/uids/${encodeURIComponent(playerUID)}.json`, { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        if (d && d.uid) {
          if (typeof d.coins === 'number') coins = d.coins;
          if (typeof d.gems === 'number') gems = d.gems;
          if (typeof d.level === 'number') playerLevel = Math.max(1, d.level);
          if (typeof d.xp === 'number') playerXP = Math.max(0, d.xp);
          if (typeof d.bestDistKm === 'number') bestDistKm = d.bestDistKm;
          if (d.name) rawName = d.name;
        }
      }
    } catch (e) {}

    const finalName = mode === 'google' ? await claimAvailableUsername(rawName) : (rawName || ('GUEST_' + playerUID));
    sessionMode = mode;
    currentUser = { uid: playerUID, name: finalName, email: email || '', mode };
    safeSetLS('sthw_fb_user', JSON.stringify(currentUser));
    safeSetLS('sthw_session_mode', mode);
    await savePlayerState();
    renderAccountSwitcher();
    showToast(`✅ Signed in as ${finalName} (UID: ${playerUID})`);
  }

  function renderAccountSwitcher() {
    const name = (currentUser && currentUser.name) || ('GUEST_' + (playerUID || '11111'));
    const email = (currentUser && currentUser.email) || '';
    const isGoogle = sessionMode === 'google' && email;

    if ($('#gdarkActiveInitial')) $('#gdarkActiveInitial').textContent = name.slice(0, 1).toUpperCase();
    if ($('#gdarkActiveName')) $('#gdarkActiveName').textContent = name;
    if ($('#gdarkActiveSub')) $('#gdarkActiveSub').textContent = isGoogle ? email : 'Guest Account • Local Device';
    if ($('#gdarkModeBadge')) $('#gdarkModeBadge').textContent = isGoogle ? `Google • LV.${playerLevel}` : `Guest • LV.${playerLevel}`;
    if ($('#gdarkUidBadge')) $('#gdarkUidBadge').textContent = `UID: ${playerUID}`;
    if ($('#gdarkUsernameInput')) $('#gdarkUsernameInput').value = name;

    const savedList = $('#gdarkSavedList');
    if (savedList) {
      const others = savedGoogleAccounts.filter(a => !isGoogle || a.email.toLowerCase() !== email.toLowerCase());
      savedList.innerHTML = others.map((acc, i) => {
        const colors = ['#7e22ce', '#0284c7', '#059669', '#d97706', '#e11d48'];
        const col = colors[i % colors.length];
        return `<button type="button" class="gdark-acc-row" data-sw-email="${acc.email}">
          <div class="gdark-avatar-sm" style="background:${col};">${(acc.name || acc.email).slice(0, 1).toUpperCase()}</div>
          <div><strong>${acc.name}</strong><small>${acc.email}</small></div>
        </button>`;
      }).join('');

      savedList.querySelectorAll('[data-sw-email]').forEach(btn => {
        btn.onclick = () => {
          const acc = savedGoogleAccounts.find(x => x.email === btn.dataset.swEmail);
          if (acc) switchAccount('google', acc.name, acc.email);
        };
      });
    }

    const manageList = $('#gdarkManageList');
    if (manageList) {
      manageList.innerHTML = savedGoogleAccounts.length
        ? savedGoogleAccounts.map(acc => `<div class="gdark-manage-row">
            <span><b>${acc.name}</b> <small style="color:#9aa0a6;">(${acc.email})</small></span>
            <button type="button" class="gdark-btn-ghost" style="padding:3px 8px;font-size:10px;color:#f87171;border-color:#7f1d1d;" data-rm-email="${acc.email}">Remove</button>
          </div>`).join('')
        : `<div style="font-size:11px;color:#9aa0a6;">No Google accounts saved on this device yet.</div>`;

      manageList.querySelectorAll('[data-rm-email]').forEach(btn => {
        btn.onclick = () => {
          savedGoogleAccounts = savedGoogleAccounts.filter(a => a.email !== btn.dataset.rmEmail);
          safeSetLS('sthw_google_accounts', JSON.stringify(savedGoogleAccounts));
          renderAccountSwitcher();
          showToast('Removed account from this device.');
        };
      });
    }
  }

  function openAccountSwitcher() {
    $('#gdarkAddForm')?.classList.add('hidden');
    $('#gdarkManageBox')?.classList.add('hidden');
    $('#gdarkUsernameBox')?.classList.add('hidden');
    renderAccountSwitcher();
    $('#accountSwitcherModal')?.classList.remove('hidden');
  }

  function initAccountSwitcherEvents() {
    $('#closeAccountSwitcher')?.addEventListener('click', () => $('#accountSwitcherModal')?.classList.add('hidden'));
    $('#accountSwitcherModal')?.addEventListener('click', e => {
      if (e.target === $('#accountSwitcherModal')) $('#accountSwitcherModal').classList.add('hidden');
    });

    $('#gdarkToggleExpand')?.addEventListener('click', () => {
      const body = $('#gdarkAccountsBody');
      const chev = $('#gdarkChevronBtn');
      const collapsed = body?.classList.toggle('hidden');
      if (chev) chev.textContent = collapsed ? '⌄' : '⌃';
    });

    $('#gdarkAddAccBtn')?.addEventListener('click', () => {
      $('#gdarkManageBox')?.classList.add('hidden');
      $('#gdarkAddForm')?.classList.toggle('hidden');
    });

    $('#gdarkCancelAddBtn')?.addEventListener('click', () => $('#gdarkAddForm')?.classList.add('hidden'));

    $('#gdarkSaveNewAccBtn')?.addEventListener('click', async () => {
      const em = ($('#gdarkNewEmail')?.value || '').trim();
      const nm = ($('#gdarkNewName')?.value || '').trim() || (em.split('@')[0] || 'Racer');
      if (!em || !em.includes('@')) {
        showToast('Enter a valid Gmail address!');
        return;
      }
      if (!savedGoogleAccounts.some(a => a.email.toLowerCase() === em.toLowerCase())) {
        savedGoogleAccounts.unshift({ name: nm, email: em });
        safeSetLS('sthw_google_accounts', JSON.stringify(savedGoogleAccounts));
      }
      $('#gdarkNewEmail').value = '';
      $('#gdarkNewName').value = '';
      $('#gdarkAddForm')?.classList.add('hidden');
      await switchAccount('google', nm, em);
    });

    $('#gdarkManageDeviceBtn')?.addEventListener('click', () => {
      $('#gdarkAddForm')?.classList.add('hidden');
      $('#gdarkManageBox')?.classList.toggle('hidden');
      renderAccountSwitcher();
    });

    $('#gdarkSwitchGuestBtn')?.addEventListener('click', async () => {
      $('#gdarkManageBox')?.classList.add('hidden');
      await switchAccount('guest', '', '');
    });

    $('#gdarkManageUsernameToggle')?.addEventListener('click', () => {
      $('#gdarkUsernameBox')?.classList.toggle('hidden');
    });

    $('#gdarkSaveUsernameBtn')?.addEventListener('click', async () => {
      const desired = ($('#gdarkUsernameInput')?.value || '').trim();
      const msgEl = $('#gdarkUsernameMsg');
      if (cleanUsernameKey(desired).length < 3) {
        if (msgEl) { msgEl.textContent = '❌ Username must be at least 3 characters.'; msgEl.style.color = '#f87171'; }
        return;
      }
      const ok = await isUsernameAvailable(desired);
      if (!ok) {
        if (msgEl) { msgEl.textContent = '❌ Username already taken! Try another.'; msgEl.style.color = '#f87171'; }
        return;
      }
      const claimed = await claimAvailableUsername(desired);
      currentUser = Object.assign({}, currentUser || { uid: playerUID, mode: sessionMode }, { name: claimed });
      safeSetLS('sthw_fb_user', JSON.stringify(currentUser));
      await savePlayerState();
      renderAccountSwitcher();
      if (msgEl) { msgEl.textContent = `✅ Username updated to ${claimed}!`; msgEl.style.color = '#4ade80'; }
      showToast(`✅ Username updated to ${claimed}!`);
    });

    $('#gdarkOpenSettingsBtn')?.addEventListener('click', () => {
      $('#accountSwitcherModal')?.classList.add('hidden');
      openModalPanel('settings');
    });
    $('#gdarkOpenMailBtn')?.addEventListener('click', () => {
      $('#accountSwitcherModal')?.classList.add('hidden');
      openModalPanel('notifications');
    });
  }

  // ========================================================
  // LOBBY HUD
  // ========================================================
  function updateLobbyHUD() {
    if ($('#coins')) $('#coins').textContent = coins.toLocaleString('en-IN');
    if ($('#gems')) $('#gems').textContent = gems.toLocaleString('en-IN');
    const dispName = ((currentUser && currentUser.name) || 'GUEST').toUpperCase();
    if ($('#topPlayerName')) $('#topPlayerName').textContent = dispName;
    if ($('#topAvatarInitials')) $('#topAvatarInitials').textContent = dispName.slice(0, 1);
    if ($('#topPlayerUid')) $('#topPlayerUid').textContent = `UID: ${playerUID || '11111'}`;

    const reqXp = xpForNextLevel(playerLevel);
    const pct = Math.min(100, Math.round((playerXP / reqXp) * 100));
    if ($('#topPlayerLevel')) $('#topPlayerLevel').textContent = String(playerLevel);
    if ($('#topXpFill')) $('#topXpFill').style.width = pct + '%';
    if ($('#topXpText')) $('#topXpText').textContent = `LV.${playerLevel} • ${playerXP}/${reqXp} XP`;

    const v = getVehicle();
    if ($('#activeCarName')) $('#activeCarName').textContent = v.name.toUpperCase();

    const m = getMap();
    if ($('#redMapName') && m) $('#redMapName').textContent = m.name.toUpperCase();
    if ($('#redMapIcon') && m) $('#redMapIcon').textContent = m.icon || '🌅';
    if ($('#steerModeBadge')) {
      $('#steerModeBadge').textContent = controlSettings.tiltEnabled
        ? '📱 TILT STEERING (DEFAULT) • 4-LANE'
        : '🎮 BUTTON / KEYBOARD • 4-LANE';
    }

    const unreadCount = (liveConfig.notifications || []).filter(n => !claimedNotifs.includes(n.id)).length;
    const badgeEl = $('#notifBadge');
    if (badgeEl) {
      badgeEl.textContent = unreadCount;
      badgeEl.classList.toggle('hidden', unreadCount === 0);
    }
  }

  function renderCustomButtons() {
    const orangeSlot = $('#orangeCustomBtns'), whiteSlot = $('#whiteCustomBtns');
    const greySlot = $('#greyCustomBtns'), floatingLayer = $('#customFloatingLayer');
    if (orangeSlot) orangeSlot.innerHTML = '';
    if (whiteSlot) whiteSlot.innerHTML = '';
    if (greySlot) greySlot.innerHTML = '';
    if (floatingLayer) floatingLayer.innerHTML = '';

    (Array.isArray(liveConfig.customButtons) ? liveConfig.customButtons : []).forEach(b => {
      if (!b || !b.label) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      const icon = b.icon || '⚡';
      btn.className = b.zone === 'white' ? 'ff-top-ico' : 'ff-side-btn';
      btn.innerHTML = b.zone === 'white' ? `<span>${icon}</span>` : `<span>${icon}</span><strong>${b.label}</strong>`;
      btn.onclick = () => {
        if (b.actionType === 'panel') openModalPanel(b.actionValue || 'store');
        else if (b.actionType === 'url' && b.actionValue) window.open(b.actionValue, '_blank', 'noopener');
        else showToast(b.actionValue || b.label);
      };
      if (b.zone === 'orange' && orangeSlot) orangeSlot.appendChild(btn);
      else if (b.zone === 'white' && whiteSlot) whiteSlot.appendChild(btn);
      else if (b.zone === 'grey' && greySlot) greySlot.appendChild(btn);
      else if (floatingLayer) {
        btn.style.position = 'absolute'; btn.style.left = (b.x || 50) + '%'; btn.style.top = (b.y || 50) + '%';
        floatingLayer.appendChild(btn);
      }
    });
  }

  // ========================================================
  // THREE.JS 3D TURNTABLE
  // ========================================================
  let scene, camera, renderer, carGroup;
  let isDraggingTurntable = false, dragStartCoord = 0;
  let targetRotationY = 0.58, currentRotationY = 0.58;
  const RAMP_Y = -0.68;

  function decodeBase64Int16(b64) {
    const bin = atob(b64), buf = new ArrayBuffer(bin.length), view = new Uint8Array(buf);
    for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
    return new Int16Array(buf);
  }
  function decodeBase64Uint16(b64) {
    const bin = atob(b64), buf = new ArrayBuffer(bin.length), view = new Uint8Array(buf);
    for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
    return new Uint16Array(buf);
  }

  function buildMaterialsForSkin(veh, skin) {
    const THREE = window.THREE;
    const useVehDefault = !skin || (skin.id === 'skin_crimson' && veh.id !== 'agera');
    const primaryHex = useVehDefault ? (veh.defaultColor || '#e11d48') : (skin.primary || veh.defaultColor || '#e11d48');
    const secondaryHex = useVehDefault ? (veh.secondaryColor || '#111827') : (skin.secondary || veh.secondaryColor || '#111827');
    const finish = (skin && skin.finish) || 'metallic';

    return {
      paintMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryHex),
        metalness: finish === 'chrome' ? 0.92 : finish === 'matte' ? 0.25 : 0.72,
        roughness: finish === 'chrome' ? 0.12 : finish === 'matte' ? 0.65 : 0.22,
        emissive: finish === 'neon' ? new THREE.Color(primaryHex) : new THREE.Color(0x000000),
        emissiveIntensity: finish === 'neon' ? 0.28 : 0.0
      }),
      carbonMat: new THREE.MeshStandardMaterial({ color: new THREE.Color(secondaryHex), metalness: 0.55, roughness: 0.35 }),
      chromeMat: new THREE.MeshStandardMaterial({ color: new THREE.Color(0xd1d5db), metalness: 0.88, roughness: 0.16 }),
      glassMat: new THREE.MeshStandardMaterial({ color: new THREE.Color(0x0f172a), metalness: 0.9, roughness: 0.08, transparent: true, opacity: 0.84 }),
      lightsMat: new THREE.MeshStandardMaterial({ color: new THREE.Color(0xff1e42), emissive: new THREE.Color(0xff1133), emissiveIntensity: 0.9, roughness: 0.2 }),
      wheelMat: new THREE.MeshStandardMaterial({ color: new THREE.Color(0x18181b), metalness: 0.5, roughness: 0.45 })
    };
  }

  function normalizeAndGroundMesh(meshObj, targetLength) {
    const THREE = window.THREE;
    const wrapper = new THREE.Group();
    const box = new THREE.Box3().setFromObject(meshObj);
    const size = new THREE.Vector3(), center = new THREE.Vector3();
    box.getSize(size); box.getCenter(center);

    const sc = targetLength / Math.max(size.x, size.z, 0.01);
    meshObj.scale.multiplyScalar(sc);

    box.setFromObject(meshObj);
    box.getCenter(center);
    meshObj.position.x -= center.x;
    meshObj.position.z -= center.z;
    meshObj.position.y -= box.min.y;

    wrapper.add(meshObj);
    return wrapper;
  }

  function buildPrebakedAgeraMesh(veh, skin) {
    const THREE = window.THREE, data = window.AGERA_3D_DATA, root = new THREE.Group();
    if (!data || !THREE) return root;

    const rawVerts = decodeBase64Int16(data.verts), scale = data.scale || 60.0;
    const positions = new Float32Array(rawVerts.length);
    for (let i = 0; i < rawVerts.length; i++) positions[i] = rawVerts[i] / scale;

    const posAttr = new THREE.BufferAttribute(positions, 3), mats = buildMaterialsForSkin(veh, skin);
    const makeSubMesh = (groupKey, mat) => {
      const b64Idx = data.groups[groupKey]; if (!b64Idx) return null;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', posAttr);
      geo.setIndex(new THREE.BufferAttribute(decodeBase64Uint16(b64Idx), 1));
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, mat);
    };

    ['Paint', 'Carbon', 'Glass', 'Lights'].forEach(k => {
      const m = makeSubMesh(k, k === 'Paint' ? mats.paintMat : k === 'Glass' ? mats.glassMat : k === 'Lights' ? mats.lightsMat : mats.carbonMat);
      if (m) root.add(m);
    });

    if (data.groups['FL'] && Array.isArray(data.wheelPositions)) {
      const wGeo = new THREE.BufferGeometry();
      wGeo.setAttribute('position', posAttr);
      wGeo.setIndex(new THREE.BufferAttribute(decodeBase64Uint16(data.groups['FL']), 1));
      wGeo.computeVertexNormals();
      data.wheelPositions.forEach(wp => {
        const wMesh = new THREE.Mesh(wGeo, mats.wheelMat);
        wMesh.position.set(wp.x, wp.y, wp.z);
        if (wp.flipX) wMesh.scale.x = -1;
        root.add(wMesh);
      });
    }
    return root;
  }

  function parseOBJStringToGroup(objText, veh, skin) {
    const THREE = window.THREE, root = new THREE.Group(), verts = [], facesByMtl = {};
    let curMtl = 'Paint', curObj = 'Root';
    const lines = objText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i].trim();
      if (ln.startsWith('v ')) {
        const p = ln.split(/\s+/);
        verts.push(parseFloat(p[1]) || 0, parseFloat(p[2]) || 0, parseFloat(p[3]) || 0);
      } else if (ln.startsWith('o ') || ln.startsWith('g ')) {
        curObj = ln.split(/\s+/)[1] || 'Root';
      } else if (ln.startsWith('usemtl ')) {
        const mName = ln.split(/\s+/)[1] || '';
        if (/plane/i.test(mName)) curMtl = 'Skip';
        else if (/glass|window/i.test(mName)) curMtl = 'Glass';
        else if (/tire|wheel|seat|black/i.test(mName)) curMtl = 'Carbon';
        else if (/engine|exhaust|chrome/i.test(mName)) curMtl = 'Chrome';
        else if (/light|rear|flash/i.test(mName)) curMtl = 'Lights';
        else curMtl = 'Paint';
      } else if (ln.startsWith('f ')) {
        if (curObj === 'Plane' || curMtl === 'Skip') continue;
        const p = ln.split(/\s+/).slice(1);
        const idxs = p.map(tok => (parseInt(tok.split('/')[0], 10) || 1) - 1);
        const arr = facesByMtl[curMtl] || (facesByMtl[curMtl] = []);
        for (let k = 1; k < idxs.length - 1; k++) arr.push(idxs[0], idxs[k], idxs[k + 1]);
      }
    }
    if (!verts.length) return buildPrebakedAgeraMesh(veh, skin);
    const posAttr = new THREE.BufferAttribute(new Float32Array(verts), 3);
    const mats = buildMaterialsForSkin(veh, skin);
    const matMap = { Paint: mats.paintMat, Carbon: mats.carbonMat, Chrome: mats.chromeMat, Glass: mats.glassMat, Lights: mats.lightsMat };
    Object.keys(facesByMtl).forEach(k => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', posAttr);
      geo.setIndex(facesByMtl[k]);
      geo.computeVertexNormals();
      root.add(new THREE.Mesh(geo, matMap[k] || mats.paintMat));
    });
    return root;
  }

  function buildAnyVehicle3D(veh, skin, targetLength) {
    if (!veh) veh = getVehicle();
    const desiredLen = targetLength || 3.25 * (veh.scale || 1.0);
    let rawMesh = null;
    if (custom3DModelCache[veh.id]) rawMesh = custom3DModelCache[veh.id].clone();
    else if (veh.inlineObjText) rawMesh = parseOBJStringToGroup(veh.inlineObjText, veh, skin);
    else rawMesh = buildPrebakedAgeraMesh(veh, skin);
    return normalizeAndGroundMesh(rawMesh, desiredLen);
  }

  async function rebuildTurntableVehicle() {
    if (!scene || !window.THREE) return;
    const veh = getVehicle();
    if ((veh.isCustomAdmin || veh.hasStoredBlob || veh.inlineGlbBase64 || veh.modelUrl) && !custom3DModelCache[veh.id]) {
      await ensureCustomModelLoaded(veh);
    }
    if (carGroup) { scene.remove(carGroup); carGroup = null; }
    carGroup = buildAnyVehicle3D(veh, getSkin(), 3.25);
    carGroup.position.set(0, RAMP_Y, 0);
    carGroup.rotation.y = currentRotationY;
    scene.add(carGroup);
  }

  function syncTurntableCameraSize() {
    const stage = document.getElementById('turntableStage');
    if (!stage || !renderer || !camera) return;
    const sr = getStageRect();
    const w = Math.max(300, Math.floor(sr.width * 0.72));
    const h = Math.max(200, Math.floor(sr.height - 94));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function initTurntable3D() {
    const canvas = document.getElementById('turntableCanvas');
    const stage = document.getElementById('turntableStage');
    if (!canvas || !stage || !window.THREE) return;

    const THREE = window.THREE;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.1, 100);
    camera.position.set(0, 1.45, 6.5);
    camera.lookAt(0, 0.45, 0);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    syncTurntableCameraSize();

    scene.add(new THREE.HemisphereLight(0xfff7ed, 0x0f172a, 1.65));
    const sun = new THREE.DirectionalLight(0xffffff, 2.1);
    sun.position.set(5, 9, 6);
    scene.add(sun);
    const rimLeft = new THREE.DirectionalLight(0x38bdf8, 1.35);
    rimLeft.position.set(-6, 3, -4);
    scene.add(rimLeft);

    const shCanvas = document.createElement('canvas');
    shCanvas.width = 256; shCanvas.height = 256;
    const sCtx = shCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(128, 128, 12, 128, 128, 120);
    grad.addColorStop(0, 'rgba(0,0,0,0.68)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.28)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = grad; sCtx.fillRect(0, 0, 256, 256);
    const shadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 2.6),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shCanvas), transparent: true, depthWrite: false })
    );
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, RAMP_Y + 0.005, 0);
    scene.add(shadowMesh);

    rebuildTurntableVehicle();

    const getDragAxis = (e) => getStageRect().isPortrait ? e.clientY : e.clientX;
    stage.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      isDraggingTurntable = true;
      dragStartCoord = getDragAxis(e);
      stage.setPointerCapture?.(e.pointerId);
    });
    stage.addEventListener('pointermove', e => {
      if (!isDraggingTurntable) return;
      const cur = getDragAxis(e);
      targetRotationY += (cur - dragStartCoord) * 0.014;
      dragStartCoord = cur;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => {
      stage.addEventListener(ev, () => { isDraggingTurntable = false; });
    });

    window.addEventListener('resize', syncTurntableCameraSize);

    function animateTurntable() {
      requestAnimationFrame(animateTurntable);
      if (!$('#menu') || $('#menu').classList.contains('hidden')) return;
      if (!isDraggingTurntable) targetRotationY += 0.004;
      currentRotationY += (targetRotationY - currentRotationY) * 0.14;
      if (carGroup) carGroup.rotation.y = currentRotationY;
      renderer.render(scene, camera);
    }
    animateTurntable();
  }

  // ========================================================
  // MODAL PANELS (SETTINGS, STORE, GARAGE, MAPS, UPGRADES, EVENTS, MAIL)
  // ========================================================
  function openModalPanel(panelName, initialTab) {
    const modal = $('#modal'), titleEl = $('#title'), contentEl = $('#content');
    if (!modal || !titleEl || !contentEl) return;
    modal.classList.remove('hidden');

    if (panelName === 'settings') {
      titleEl.textContent = '⚙️ CONTROLS & SETTINGS';
      contentEl.innerHTML = `
        <div class="grid-cards">
          <div class="item-card ${controlSettings.tiltEnabled ? 'selected' : ''}">
            <div>
              <strong>📱 Mobile Tilt Steering (Default)</strong>
              <small>Rotate your phone left / right to steer your car smoothly.</small>
            </div>
            <button type="button" class="card-action-btn ${controlSettings.tiltEnabled ? 'equipped' : ''}" id="toggleTiltBtn">
              ${controlSettings.tiltEnabled ? '✓ TILT: ON (DEFAULT)' : 'TILT: OFF'}
            </button>
          </div>
          <div class="item-card ${controlSettings.desktopKeyboard ? 'selected' : ''}">
            <div>
              <strong>💻 Desktop Keyboard Controls</strong>
              <small>Use A / D or ◀ / ▶ Arrow keys + W/Up Gas on PC/Laptop.</small>
            </div>
            <button type="button" class="card-action-btn ${controlSettings.desktopKeyboard ? 'equipped' : ''}" id="toggleDeskBtn">
              ${controlSettings.desktopKeyboard ? '✓ DESKTOP: ON' : 'DESKTOP: OFF'}
            </button>
          </div>
          <div class="item-card ${controlSettings.touchButtons ? 'selected' : ''}">
            <div>
              <strong>🎮 On-Screen Steer Buttons</strong>
              <small>Show ◀ / ▶ steer buttons alongside pedals.</small>
            </div>
            <button type="button" class="card-action-btn ${controlSettings.touchButtons ? 'equipped' : ''}" id="toggleTouchBtn">
              ${controlSettings.touchButtons ? '✓ BUTTONS: ON' : 'BUTTONS: OFF'}
            </button>
          </div>
          <div class="item-card">
            <div>
              <strong>🎚️ Tilt Sensitivity: ${Math.round(controlSettings.tiltSensitivity * 100)}%</strong>
              <small>Adjust how fast the car turns when tilting mobile.</small>
            </div>
            <input type="range" id="tiltSensRange" min="0.5" max="1.8" step="0.1" value="${controlSettings.tiltSensitivity}" style="width:100%;">
          </div>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;">
          <button type="button" class="card-action-btn buy" id="settingsFsBtn">⛶ ENTER 16:9 FULLSCREEN</button>
          <button type="button" class="card-action-btn" id="settingsAccBtn">👤 SWITCH GOOGLE / GUEST ACCOUNT</button>
        </div>`;

      $('#toggleTiltBtn').onclick = async () => {
        controlSettings.tiltEnabled = !controlSettings.tiltEnabled;
        if (controlSettings.tiltEnabled && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          try { await DeviceOrientationEvent.requestPermission(); } catch (e) {}
        }
        saveControlSettings(); openModalPanel('settings');
      };
      $('#toggleDeskBtn').onclick = () => { controlSettings.desktopKeyboard = !controlSettings.desktopKeyboard; saveControlSettings(); openModalPanel('settings'); };
      $('#toggleTouchBtn').onclick = () => { controlSettings.touchButtons = !controlSettings.touchButtons; saveControlSettings(); openModalPanel('settings'); };
      $('#tiltSensRange').oninput = e => { controlSettings.tiltSensitivity = parseFloat(e.target.value) || 1.0; saveControlSettings(); };
      $('#settingsFsBtn').onclick = () => { request16x9Fullscreen(); modal.classList.add('hidden'); };
      $('#settingsAccBtn').onclick = () => { modal.classList.add('hidden'); openAccountSwitcher(); };
      return;
    }

    if (panelName === 'store') {
      const tab = initialTab || 'cars';
      titleEl.textContent = '🛒 ST GAMES CAR STORE';
      const renderStoreTab = (activeTab) => {
        let itemsHtml = '';
        if (activeTab === 'cars') {
          itemsHtml = (window.VEHICLES || []).map(v => {
            const isOwned = owned.includes(v.id), isSelected = selected === v.id;
            return `<div class="item-card ${isSelected ? 'selected' : ''}">
              <div>
                <strong>🏎️ ${v.name}</strong>
                <small>SPD ${v.speed} • ACC ${v.acc} • HND ${v.handling}</small>
              </div>
              <button type="button" class="card-action-btn ${isSelected ? 'equipped' : isOwned ? '' : 'buy'}" data-store-car="${v.id}">
                ${isSelected ? '✓ EQUIPPED' : isOwned ? 'EQUIP CAR' : '🟡 ' + v.price.toLocaleString('en-IN') + ' T-COINS'}
              </button>
            </div>`;
          }).join('');
        } else if (activeTab === 'maps') {
          itemsHtml = (window.MAPS || []).map(m => `
            <div class="item-card ${mapName === m.name ? 'selected' : ''}">
              <div><strong>${m.icon || '🌅'} ${m.name}</strong><small>${m.desc || '4-Lane Highway'}</small></div>
              <button type="button" class="card-action-btn ${mapName === m.name ? 'equipped' : m.unlocked ? '' : 'buy'}" data-store-map="${m.name}">
                ${mapName === m.name ? '✓ ACTIVE' : m.unlocked ? 'SELECT' : '🟡 UNLOCK ' + m.price.toLocaleString('en-IN')}
              </button>
            </div>`).join('');
        } else {
          itemsHtml = (window.VEHICLE_SKINS || []).map(s => {
            const isOwned = ownedSkins.includes(s.id) || s.price === 0, isSelected = selectedSkin === s.id;
            return `<div class="item-card ${isSelected ? 'selected' : ''}">
              <div><div style="height:30px;background:linear-gradient(135deg,${s.primary},${s.secondary});"></div><strong style="margin-top:4px;">🎨 ${s.name}</strong></div>
              <button type="button" class="card-action-btn ${isSelected ? 'equipped' : isOwned ? '' : 'buy'}" data-store-skin="${s.id}">
                ${isSelected ? '✓ ACTIVE' : isOwned ? 'APPLY' : '🟡 BUY ' + s.price.toLocaleString('en-IN')}
              </button>
            </div>`;
          }).join('');
        }
        contentEl.innerHTML = `
          <div class="tab-bar">
            <button type="button" class="tab-pill ${activeTab === 'cars' ? 'active' : ''}" data-st-tab="cars">🏎️ Cars (${(window.VEHICLES || []).length})</button>
            <button type="button" class="tab-pill ${activeTab === 'maps' ? 'active' : ''}" data-st-tab="maps">🗺️ Maps</button>
            <button type="button" class="tab-pill ${activeTab === 'skins' ? 'active' : ''}" data-st-tab="skins">🎨 Skins</button>
          </div>
          <div class="grid-cards">${itemsHtml}</div>`;
        contentEl.querySelectorAll('[data-st-tab]').forEach(b => { b.onclick = () => renderStoreTab(b.dataset.stTab); });
        contentEl.querySelectorAll('[data-store-car]').forEach(b => {
          b.onclick = () => {
            const v = getVehicle(b.dataset.storeCar);
            if (owned.includes(v.id)) { selected = v.id; savePlayerState(); rebuildTurntableVehicle(); renderStoreTab('cars'); }
            else if (coins >= v.price) { coins -= v.price; owned.push(v.id); selected = v.id; savePlayerState(); rebuildTurntableVehicle(); renderStoreTab('cars'); showToast(`Unlocked ${v.name}!`); }
            else showToast('Need more T-Coins! Near-miss traffic in race!');
          };
        });
        contentEl.querySelectorAll('[data-store-map]').forEach(b => {
          b.onclick = () => {
            const m = (window.MAPS || []).find(x => x.name === b.dataset.storeMap);
            if (!m) return;
            if (m.unlocked || coins >= m.price) {
              if (!m.unlocked) { coins -= m.price; m.unlocked = true; }
              mapName = m.name; savePlayerState(); renderStoreTab('maps');
            } else showToast('Not enough T-Coins!');
          };
        });
        contentEl.querySelectorAll('[data-store-skin]').forEach(b => {
          b.onclick = () => {
            const s = (window.VEHICLE_SKINS || []).find(x => x.id === b.dataset.storeSkin);
            if (!s) return;
            if (ownedSkins.includes(s.id) || s.price === 0 || coins >= s.price) {
              if (!ownedSkins.includes(s.id)) { coins -= s.price; ownedSkins.push(s.id); }
              selectedSkin = s.id; savePlayerState(); rebuildTurntableVehicle(); renderStoreTab('skins');
            } else showToast('Not enough T-Coins!');
          };
        });
      };
      renderStoreTab(tab);
      return;
    }

    if (panelName === 'library') {
      titleEl.textContent = '🚘 VAULT / OWNED CARS';
      const myCars = (window.VEHICLES || []).filter(v => owned.includes(v.id));
      contentEl.innerHTML = `<div class="grid-cards">${myCars.map(v => `
        <div class="item-card ${selected === v.id ? 'selected' : ''}">
          <div><strong>🏎️ ${v.name}</strong><small>SPD ${v.speed} • ACC ${v.acc} • HND ${v.handling}</small></div>
          <button type="button" class="card-action-btn ${selected === v.id ? 'equipped' : ''}" data-lib-car="${v.id}">${selected === v.id ? '✓ EQUIPPED' : 'EQUIP'}</button>
        </div>`).join('')}</div>`;
      contentEl.querySelectorAll('[data-lib-car]').forEach(b => {
        b.onclick = () => { selected = b.dataset.libCar; savePlayerState(); rebuildTurntableVehicle(); openModalPanel('library'); };
      });
      return;
    }

    if (panelName === 'maps') {
      titleEl.textContent = '🗺️ SELECT HIGHWAY MAP';
      contentEl.innerHTML = `<div class="grid-cards">${(window.MAPS || []).map(m => `
        <div class="item-card ${mapName === m.name ? 'selected' : ''}">
          <div><strong>${m.icon || '🌅'} ${m.name}</strong><small>${m.desc || ''}</small></div>
          <button type="button" class="card-action-btn ${mapName === m.name ? 'equipped' : m.unlocked ? '' : 'buy'}" data-pick-map="${m.name}">
            ${mapName === m.name ? '✓ ACTIVE' : m.unlocked ? 'SELECT' : '🟡 UNLOCK ' + m.price.toLocaleString('en-IN')}
          </button>
        </div>`).join('')}</div>`;
      contentEl.querySelectorAll('[data-pick-map]').forEach(b => {
        b.onclick = () => {
          const m = (window.MAPS || []).find(x => x.name === b.dataset.pickMap);
          if (!m) return;
          if (m.unlocked || coins >= m.price) {
            if (!m.unlocked) { coins -= m.price; m.unlocked = true; }
            mapName = m.name; savePlayerState(); modal.classList.add('hidden');
          } else showToast('Not enough T-Coins!');
        };
      });
      return;
    }

    if (panelName === 'upgrades') {
      const v = getVehicle();
      titleEl.textContent = `🔧 UPGRADES — ${v.name.toUpperCase()}`;
      const parts = ['Engine', 'Suspension', 'Tires', 'Nitro'];
      contentEl.innerHTML = `<div class="grid-cards">${parts.map(p => {
        const lev = upgrade[v.id + p] || 0, cost = 1000 * (lev + 1);
        return `<div class="item-card">
          <div><strong>⚡ ${p} — LV ${lev}/10</strong><small>Boosts highway performance</small></div>
          <button type="button" class="card-action-btn buy" data-up-part="${p}">${lev >= 10 ? '✓ MAX' : '🟡 ' + cost.toLocaleString('en-IN')}</button>
        </div>`;
      }).join('')}</div>`;
      contentEl.querySelectorAll('[data-up-part]').forEach(b => {
        b.onclick = () => {
          const k = v.id + b.dataset.upPart, lev = upgrade[k] || 0, cost = 1000 * (lev + 1);
          if (lev >= 10) return;
          if (coins >= cost) { coins -= cost; upgrade[k] = lev + 1; savePlayerState(); openModalPanel('upgrades'); showToast(`Upgraded to LV ${lev + 1}!`); }
          else showToast('Not enough T-Coins!');
        };
      });
      return;
    }

    if (panelName === 'events') {
      titleEl.textContent = '📅 LIVE HIGHWAY EVENTS';
      const evs = liveConfig.events || [];
      contentEl.innerHTML = `<div class="grid-cards">${evs.map(ev => `
        <div class="item-card">
          <div><strong>${ev.title}</strong><small>${ev.desc}</small><small style="color:#fde047;">🟡 +${ev.rewardCoins || 5000} T-Coins</small></div>
          <button type="button" class="card-action-btn buy" data-launch-ev="${ev.id}">▶ PLAY EVENT</button>
        </div>`).join('')}</div>`;
      contentEl.querySelectorAll('[data-launch-ev]').forEach(b => {
        b.onclick = () => { modal.classList.add('hidden'); launchRaceNow(); };
      });
      return;
    }

    if (panelName === 'notifications') {
      titleEl.textContent = '✉️ MAIL & REWARDS';
      const notifs = liveConfig.notifications || [];
      contentEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">${notifs.map(n => {
        const claimed = claimedNotifs.includes(n.id);
        return `<div class="item-card" style="flex-direction:row;align-items:center;justify-content:space-between;">
          <div style="max-width:68%;"><strong>${n.title}</strong><small>${n.body}</small></div>
          <button type="button" class="card-action-btn ${claimed ? 'equipped' : 'buy'}" style="width:auto;" data-claim-n="${n.id}">
            ${claimed ? '✓ CLAIMED' : '🎁 +' + (n.rewardCoins || 1000)}
          </button>
        </div>`;
      }).join('')}</div>`;
      contentEl.querySelectorAll('[data-claim-n]').forEach(b => {
        b.onclick = () => {
          const n = notifs.find(x => x.id === b.dataset.claimN);
          if (!n || claimedNotifs.includes(n.id)) return;
          claimedNotifs.push(n.id); coins += (n.rewardCoins || 1000);
          savePlayerState(); openModalPanel('notifications'); showToast(`Claimed +${n.rewardCoins || 1000} T-Coins!`);
        };
      });
    }
  }

  async function launchRaceNow() {
    request16x9Fullscreen();
    if (controlSettings.tiltEnabled && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try { await DeviceOrientationEvent.requestPermission(); } catch (e) {}
    }
    if (!window.HillGame) return;
    const veh = getVehicle();
    if ((veh.isCustomAdmin || veh.hasStoredBlob || veh.inlineGlbBase64 || veh.modelUrl) && !custom3DModelCache[veh.id]) {
      await ensureCustomModelLoaded(veh);
    }
    $('#menu').classList.add('hidden');
    $('#game').classList.remove('hidden');
    window.HillGame.start(veh, getMap(), getSkin(), upgrade);
  }

  $('#btnFullscreenTop')?.addEventListener('click', request16x9Fullscreen);
  $('#btnAccount')?.addEventListener('click', openAccountSwitcher);
  $('#btnAccountTop')?.addEventListener('click', openAccountSwitcher);
  $('#btnStore')?.addEventListener('click', () => openModalPanel('store', 'cars'));
  $('#btnLibrary')?.addEventListener('click', () => openModalPanel('library'));
  $('#dockVault')?.addEventListener('click', () => openModalPanel('library'));
  $('#btnSkinsStore')?.addEventListener('click', () => openModalPanel('store', 'skins'));
  $('#dockSkins')?.addEventListener('click', () => openModalPanel('store', 'skins'));
  $('#btnUpgrades')?.addEventListener('click', () => openModalPanel('upgrades'));
  $('#btnEvents')?.addEventListener('click', () => openModalPanel('events'));
  $('#btnNotifications')?.addEventListener('click', () => openModalPanel('notifications'));
  $('#btnSettings')?.addEventListener('click', () => openModalPanel('settings'));
  $('#mapSelectBox')?.addEventListener('click', () => openModalPanel('maps'));
  $('#play')?.addEventListener('click', launchRaceNow);

  $('#close')?.addEventListener('click', () => $('#modal').classList.add('hidden'));
  $('#modal')?.addEventListener('click', e => { if (e.target === $('#modal')) $('#modal').classList.add('hidden'); });

  window.GameUI = {
    start() {
      $('#end')?.classList.add('hidden');
      $('#crashOverlay')?.classList.add('hidden');
      $('#pauseOverlay')?.classList.add('hidden');
      launchRaceNow();
    },
    onReturnToLobby() {
      savePlayerState();
    },
    onRunEnded(scoreVal, distKm, earnedTCoins, nearMissCount) {
      const prevBest = +(safeGetLS('sthwBest', '0'));
      if (scoreVal > prevBest) safeSetLS('sthwBest', String(scoreVal));
      if (distKm > bestDistKm) bestDistKm = distKm;
      coins += (earnedTCoins || 0);
      const xpMult = (window.STGameplayTuning && window.STGameplayTuning.xpMultiplier) || 1.0;
      const xpEarned = Math.max(15, Math.floor(((distKm || 0) * 35 + (nearMissCount || 0) * 8) * xpMult));
      const leveledUp = addPlayerXP(xpEarned);
      savePlayerState();
      if (leveledUp) showToast(`🎉 LEVEL UP! You reached LV.${playerLevel}!`);
      return { earnedTCoins: earnedTCoins || 0, xpEarned };
    },
    buildThreeCarMesh(veh, skin, targetLength) {
      return buildAnyVehicle3D(veh || getVehicle(), skin || getSkin(), targetLength);
    },
    coin(freq) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const a = window._stCoinCtx || (window._stCoinCtx = new Ctx());
        const o = a.createOscillator(), g = a.createGain();
        o.frequency.value = freq || 960; g.gain.value = 0.045;
        o.connect(g); g.connect(a.destination);
        o.start(); o.stop(a.currentTime + 0.075);
      } catch (e) {}
    }
  };

  function checkManualAdminRoute() {
    if (location.hash === '#admin' || location.search.includes('admin=1')) location.href = 'admin.html';
  }
  window.addEventListener('hashchange', checkManualAdminRoute);

  window.addEventListener('DOMContentLoaded', () => {
    (window.MAPS || []).forEach(m => { if (savedMaps.includes(m.name) || m.price === 0) m.unlocked = true; });
    initTurntable3D();
    initAccountSwitcherEvents();
    initDefaultGuestSession();
    loadExternalConfigs();
    checkManualAdminRoute();
  });
})();
