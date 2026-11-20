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

  // LAUNCH FULLSCREEN ON VERY FIRST CLICK / TAP
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
    toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
  }
  window.showToast = showToast;

  function safeGetLS(key, fallback) {
    try { const v = localStorage.getItem(key); return v !== null ? v : fallback; } catch (e) { return fallback; }
  }
  function safeSetLS(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  }

  function getAccountKey(mode, email) {
    if (mode === 'google' && email) {
      return 'google_' + String(email).trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    let guestSlot = safeGetLS('sthw_guest_key', '');
    if (!guestSlot) {
      guestSlot = 'guest_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      safeSetLS('sthw_guest_key', guestSlot);
    }
    return guestSlot;
  }

  async function getOrAssignSequentialUID(mode, email) {
    const accKey = getAccountKey(mode, email);
    let localMap = {};
    try { localMap = JSON.parse(safeGetLS('sthw_account_uids', '{}')) || {}; } catch (e) { localMap = {}; }

    // 1. Check if this account already has a UID in Firebase or LocalStorage
    if (localMap[accKey]) return String(localMap[accKey]);
    try {
      const rAcc = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/account_uids/${encodeURIComponent(accKey)}.json`, { cache: 'no-store' });
      if (rAcc.ok) {
        const existingUid = await rAcc.json();
        if (existingUid) {
          localMap[accKey] = String(existingUid);
          safeSetLS('sthw_account_uids', JSON.stringify(localMap));
          return String(existingUid);
        }
      }
    } catch (e) {}

    // 2. Allocate next sequential UID starting from 11111
    let nextUid = Math.max(11111, parseInt(safeGetLS('sthw_uid_counter', '11111'), 10) || 11111);
    try {
      const rCnt = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/uid_counter.json`, { cache: 'no-store' });
      if (rCnt.ok) {
        const fbCnt = parseInt(await rCnt.json(), 10);
        if (!isNaN(fbCnt) && fbCnt >= 11111) nextUid = Math.max(nextUid, fbCnt + 1);
      }
    } catch (e) {}

    const assigned = String(nextUid);
    localMap[accKey] = assigned;
    safeSetLS('sthw_account_uids', JSON.stringify(localMap));
    safeSetLS('sthw_uid_counter', String(nextUid + 1));

    try {
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/uid_counter.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nextUid)
      });
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/account_uids/${encodeURIComponent(accKey)}.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(assigned)
      });
    } catch (e) {}

    return assigned;
  }

  function generateTeamCode() {
    return String(100000 + Math.floor(Math.random() * 900000));
  }

  // Control Settings (Tilt Steering DEFAULT ON for mobile, Desktop Keyboard always usable)
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
  // ACCOUNT, GOOGLE ACCOUNT PICKER & AVAILABLE USERNAME SYSTEM
  // ========================================================
  let currentUser = null;
  try { currentUser = JSON.parse(safeGetLS('sthw_fb_user', 'null')); } catch (e) { currentUser = null; }
  let sessionMode = safeGetLS('sthw_session_mode', ''); // 'google' | 'guest' | ''
  let playerUID = safeGetLS('sthw_player_uid', '');
  if (!playerUID || playerUID.length > 7) {
    playerUID = '11111';
    safeSetLS('sthw_player_uid', playerUID);
  }

  // Saved Google accounts on this device for the Account Picker
  let savedGoogleAccounts = [];
  try {
    savedGoogleAccounts = JSON.parse(safeGetLS('sthw_google_accounts', 'null')) || [
      { name: 'Satish Kommana', email: 'satish.kommana@gmail.com' }
    ];
  } catch (e) {
    savedGoogleAccounts = [{ name: 'Satish Kommana', email: 'satish.kommana@gmail.com' }];
  }

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
        return !ownerUid || ownerUid === playerUID;
      }
    } catch (e) {}
    return true;
  }

  async function claimAvailableUsername(desiredName) {
    let base = String(desiredName || 'RACER').trim().replace(/[^a-zA-Z0-9_ ]/g, '').replace(/\s+/g, '_').slice(0, 14) || 'RACER';
    if (base.length < 3) base = 'RACER_' + playerUID.slice(-3);
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

  // ========================================================
  // REAL FRIENDS & REQUESTS STATE (EMPTY BY DEFAULT — NO FAKE FRIENDS!)
  // ========================================================
  let myTeamCode = safeGetLS('sthw_team_code', '') || generateTeamCode();
  safeSetLS('sthw_team_code', myTeamCode);

  let friendsList = [];
  try {
    const parsed = JSON.parse(safeGetLS('sthw_friends_v7', 'null'));
    if (Array.isArray(parsed)) friendsList = parsed;
  } catch (e) { friendsList = []; }

  let incomingRequests = [];
  let onlineDirectory = [];
  let presenceStatus = 'online'; // 'online' | 'in_game'
  let activeSquadFriend = null;
  try { activeSquadFriend = JSON.parse(safeGetLS('sthw_squad_friend', 'null')); } catch (e) { activeSquadFriend = null; }
  if (activeSquadFriend && !friendsList.some(f => f.uid === activeSquadFriend.uid)) {
    activeSquadFriend = null;
  }

  // Chat & Voice State (Live P2P only — ZERO Firebase storage)
  let chatMessages = [
    { sender: 'SYSTEM', text: 'Add friends by UID or Team Code for Live Voice & Chat!' }
  ];
  let micActive = false, speakerOn = true, micStream = null;

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
    notifications: [
      { id: "notif_v7", title: "🏎️ v7.0: Real Friends, Google Picker & Level Progress!", body: "Only real added friends appear on the right, with live Online / Playing Game status, Accept/Reject requests, Google Account Picker, and slow Level XP bar!", rewardCoins: 3000 },
      { id: "notif_cloud", title: "☁️ Live P2P Voice & Chat Ready", body: "Voice and messages stream live via WebRTC without storing chats on Firebase.", rewardCoins: 1500 }
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

  async function ensureCustomModelLoaded(veh) {
    if (!veh || !veh.id || custom3DModelCache[veh.id]) return custom3DModelCache[veh.id] || null;
    if (!veh.isCustomAdmin && !veh.inlineObjText && !veh.inlineGlbBase64 && !veh.hasStoredBlob && !veh.modelUrl) return null;
    const THREE = window.THREE;
    if (!THREE) return null;

    let blobRec = window.ModelStorage ? await window.ModelStorage.getModelData(veh.id) : null;
    const fmt = (blobRec?.format || veh.modelFormat || '').toLowerCase();
    const rawData = blobRec?.data || veh.inlineGlbBase64 || veh.inlineObjText || null;

    if (rawData && (fmt === 'glb' || fmt === 'gltf') && THREE.GLTFLoader) {
      return await new Promise((resolve) => {
        try {
          const loader = new THREE.GLTFLoader();
          const buf = fmt === 'glb' ? base64ToArrayBuffer(rawData) : rawData;
          loader.parse(buf, '', (gltf) => { custom3DModelCache[veh.id] = gltf.scene; resolve(gltf.scene); }, () => resolve(null));
        } catch (e) { resolve(null); }
      });
    }
    if (rawData && fmt === 'obj') {
      const grp = parseOBJStringToGroup(rawData, veh, getSkin());
      custom3DModelCache[veh.id] = grp;
      return grp;
    }
    if (veh.modelUrl && (fmt === 'glb' || fmt === 'gltf') && THREE.GLTFLoader) {
      return await new Promise((resolve) => {
        try {
          new THREE.GLTFLoader().load(veh.modelUrl, (gltf) => { custom3DModelCache[veh.id] = gltf.scene; resolve(gltf.scene); }, undefined, () => resolve(null));
        } catch (e) { resolve(null); }
      });
    }
    return null;
  }

  function applyAdminConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return;
    liveConfig = Object.assign({}, liveConfig, cfg);

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

  async function loadExternalConfigs() {
    try {
      const localCfg = JSON.parse(safeGetLS('sthw_admin_config', 'null'));
      if (localCfg) applyAdminConfig(localCfg);
    } catch (e) {}

    try {
      const res = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/live_config.json`, { cache: 'no-store' });
      if (res.ok) {
        const fbCfg = await res.json();
        if (fbCfg && typeof fbCfg === 'object') {
          let localCfg = null;
          try { localCfg = JSON.parse(safeGetLS('sthw_admin_config', 'null')); } catch (e) {}
          if (localCfg && Array.isArray(localCfg.customVehicles)) {
            const fbVehs = Array.isArray(fbCfg.customVehicles) ? fbCfg.customVehicles : [];
            const mapById = new Map();
            fbVehs.forEach(v => v && v.id && mapById.set(v.id, v));
            localCfg.customVehicles.forEach(v => v && v.id && mapById.set(v.id, v));
            fbCfg.customVehicles = Array.from(mapById.values());
          }
          safeSetLS('sthw_admin_config', JSON.stringify(fbCfg));
          applyAdminConfig(fbCfg);
        }
      }
    } catch (e) {}
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
    safeSetLS('sthw_friends_v7', JSON.stringify(friendsList));
    safeSetLS('sthw_squad_friend', JSON.stringify(activeSquadFriend));

    updateLobbyHUD();

    const displayName = (currentUser && currentUser.name) ? currentUser.name : 'GUEST_' + playerUID.slice(-4);
    const payload = {
      uid: playerUID,
      authMode: sessionMode || 'guest',
      name: displayName,
      email: (currentUser && currentUser.email) || '',
      level: playerLevel,
      xp: playerXP,
      coins, gems, bestDistKm, selected, selectedSkin, mapName,
      owned, ownedSkins, savedMaps: unlockedMapsList, upgrade,
      teamCode: myTeamCode,
      status: presenceStatus,
      lastSeen: Date.now(),
      updatedAt: new Date().toISOString()
    };
    try {
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/uids/${encodeURIComponent(playerUID)}.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/teamcodes/${encodeURIComponent(myTeamCode)}.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: playerUID, name: displayName, carId: selected, teamCode: myTeamCode, status: presenceStatus, lastSeen: Date.now() })
      });
    } catch (e) {}
  }

  // ========================================================
  // REAL-TIME PRESENCE, FRIEND REQUESTS & ONLINE DIRECTORY
  // ========================================================
  function computeLiveStatus(rec) {
    if (!rec || !rec.lastSeen) return 'offline';
    const age = Date.now() - Number(rec.lastSeen);
    if (age > 45000) return 'offline';
    return rec.status === 'in_game' ? 'in_game' : 'online';
  }

  async function pollPresenceAndRequests() {
    if (!sessionMode) return;
    const now = Date.now();
    // 1. Update my heartbeat
    try {
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/uids/${encodeURIComponent(playerUID)}/lastSeen.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(now)
      });
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/uids/${encodeURIComponent(playerUID)}/status.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(presenceStatus)
      });
    } catch (e) {}

    // 2. Poll incoming friend requests
    try {
      const r = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/friend_requests/${encodeURIComponent(playerUID)}.json`, { cache: 'no-store' });
      if (r.ok) {
        const data = await r.json();
        incomingRequests = data ? Object.values(data).filter(x => x && x.uid && !friendsList.some(f => f.uid === x.uid)) : [];
      }
    } catch (e) {}

    // 3. Poll accepted friends synced from Firebase + live status of all players
    try {
      const rAll = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/uids.json`, { cache: 'no-store' });
      if (rAll.ok) {
        const allMap = await rAll.json() || {};
        const arr = Object.values(allMap).filter(u => u && u.uid && u.uid !== playerUID);
        onlineDirectory = arr.map(u => ({
          uid: u.uid,
          name: u.name || ('RACER_' + String(u.uid).slice(-4)),
          carId: u.selected || 'agera',
          level: u.level || 1,
          liveStatus: computeLiveStatus(u)
        })).sort((a, b) => (a.liveStatus === 'offline' ? 1 : 0) - (b.liveStatus === 'offline' ? 1 : 0));

        // Update live status of my added friends
        friendsList = friendsList.map(fr => {
          const live = allMap[fr.uid];
          if (!live) return Object.assign({}, fr, { liveStatus: 'offline' });
          return Object.assign({}, fr, {
            name: live.name || fr.name,
            carId: live.selected || fr.carId || 'agera',
            level: live.level || fr.level || 1,
            liveStatus: computeLiveStatus(live)
          });
        });
        safeSetLS('sthw_friends_v7', JSON.stringify(friendsList));
      }
    } catch (e) {}

    // Also pull any friends who accepted my request
    try {
      const rAcc = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/friends/${encodeURIComponent(playerUID)}.json`, { cache: 'no-store' });
      if (rAcc.ok) {
        const accMap = await rAcc.json();
        if (accMap && typeof accMap === 'object') {
          Object.values(accMap).forEach(fr => {
            if (fr && fr.uid && !friendsList.some(x => x.uid === fr.uid)) {
              friendsList.push({ uid: fr.uid, name: fr.name || 'RACER', carId: fr.carId || 'agera', liveStatus: 'online' });
            }
          });
          safeSetLS('sthw_friends_v7', JSON.stringify(friendsList));
        }
      }
    } catch (e) {}

    updateLobbyHUD();
  }

  async function sendFriendRequestToUID(targetUid) {
    const cleanUid = String(targetUid || '').trim();
    if (cleanUid.length < 4 || cleanUid === playerUID) {
      showToast('Enter a valid friend UID!');
      return;
    }
    if (friendsList.some(f => f.uid === cleanUid)) {
      showToast('Already in your friends list!');
      return;
    }
    const myName = (currentUser && currentUser.name) || ('GUEST_' + playerUID.slice(-4));
    const reqObj = { uid: playerUID, name: myName, carId: selected, level: playerLevel, ts: Date.now() };
    try {
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/friend_requests/${encodeURIComponent(cleanUid)}/${encodeURIComponent(playerUID)}.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqObj)
      });
      showToast(`📩 Friend Request sent to UID: ${cleanUid}!`);
    } catch (e) {
      showToast('Could not send request right now.');
    }
  }

  async function acceptFriendRequest(reqObj) {
    if (!reqObj || !reqObj.uid) return;
    if (!friendsList.some(f => f.uid === reqObj.uid)) {
      friendsList.unshift({ uid: reqObj.uid, name: reqObj.name || 'RACER', carId: reqObj.carId || 'agera', level: reqObj.level || 1, liveStatus: 'online' });
    }
    incomingRequests = incomingRequests.filter(r => r.uid !== reqObj.uid);
    const myName = (currentUser && currentUser.name) || ('GUEST_' + playerUID.slice(-4));
    try {
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/friend_requests/${encodeURIComponent(playerUID)}/${encodeURIComponent(reqObj.uid)}.json`, { method: 'DELETE' });
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/friends/${encodeURIComponent(reqObj.uid)}/${encodeURIComponent(playerUID)}.json`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: playerUID, name: myName, carId: selected })
      });
    } catch (e) {}
    await savePlayerState();
    showToast(`✅ Accepted ${reqObj.name}! Now friends!`);
  }

  async function rejectFriendRequest(uid) {
    incomingRequests = incomingRequests.filter(r => r.uid !== uid);
    try {
      await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/friend_requests/${encodeURIComponent(playerUID)}/${encodeURIComponent(uid)}.json`, { method: 'DELETE' });
    } catch (e) {}
    updateLobbyHUD();
    showToast('❌ Friend request rejected.');
  }

  function getVehicle(id) {
    const targetId = id || selected;
    return (window.VEHICLES || []).find(v => v.id === targetId) || window.VEHICLES[0];
  }
  function getSkin() { return (window.VEHICLE_SKINS || []).find(s => s.id === selectedSkin) || null; }
  function getMap() { return (window.MAPS || []).find(m => m.name === mapName) || window.MAPS[0]; }

  // ========================================================
  // LOGIN SCREEN & GOOGLE ACCOUNT PICKER
  // ========================================================
  function enterLobby() {
    $('#loginScreen')?.classList.add('hidden');
    $('#googlePickerModal')?.classList.add('hidden');
    $('#menu')?.classList.remove('hidden');
    presenceStatus = 'online';
    updateLobbyHUD();
    syncTurntableCameraSize();
    rebuildTurntableVehicle();
    initLivePeer(myTeamCode, true);
    pollPresenceAndRequests();
  }

  function openLoginScreen() {
    $('#modal')?.classList.add('hidden');
    $('#menu')?.classList.add('hidden');
    $('#loginScreen')?.classList.remove('hidden');
  }

  function renderGoogleAccountsPicker(onSelectAccount) {
    const listEl = $('#googleAccountsList');
    if (!listEl) return;
    listEl.innerHTML = savedGoogleAccounts.map((acc, idx) => {
      const initials = (acc.name || 'G').slice(0, 2).toUpperCase();
      return `<button type="button" class="g-acc-item" data-g-idx="${idx}">
        <div class="g-acc-avatar">${initials}</div>
        <div><strong>${acc.name}</strong><small>${acc.email}</small></div>
      </button>`;
    }).join('');

    listEl.querySelectorAll('[data-g-idx]').forEach(btn => {
      btn.onclick = () => {
        const acc = savedGoogleAccounts[parseInt(btn.dataset.gIdx, 10)];
        if (acc) onSelectAccount(acc);
      };
    });
  }

  function initLoginScreen() {
    const googleBtn = $('#loginGoogleBtn');
    const guestBtn = $('#loginGuestBtn');
    const nameIn = $('#loginName');
    const pickerModal = $('#googlePickerModal');
    const closePicker = $('#closeGooglePicker');
    const useOtherBtn = $('#useAnotherGoogleBtn');
    const otherBox = $('#addOtherGoogleBox');
    const confirmOtherBtn = $('#confirmOtherGoogleBtn');

    const finishLogin = async (mode, rawName, email) => {
      showToast('⏳ Assigning unique UID & checking username...');
      playerUID = await getOrAssignSequentialUID(mode, email);
      safeSetLS('sthw_player_uid', playerUID);
      const availableName = await claimAvailableUsername(rawName);
      sessionMode = mode;
      currentUser = { uid: playerUID, name: availableName, email: email || '', mode };
      safeSetLS('sthw_fb_user', JSON.stringify(currentUser));
      safeSetLS('sthw_session_mode', mode);
      await savePlayerState();
      enterLobby();
      showToast(`✅ Welcome ${availableName} • UID: ${playerUID}`);
    };

    googleBtn?.addEventListener('click', () => {
      otherBox?.classList.add('hidden');
      renderGoogleAccountsPicker(acc => {
        finishLogin('google', acc.name, acc.email);
      });
      pickerModal?.classList.remove('hidden');
    });

    closePicker?.addEventListener('click', () => pickerModal?.classList.add('hidden'));
    useOtherBtn?.addEventListener('click', () => otherBox?.classList.toggle('hidden'));

    confirmOtherBtn?.addEventListener('click', () => {
      const em = ($('#otherGoogleEmail')?.value || '').trim();
      const nm = ($('#otherGoogleName')?.value || '').trim() || (em.split('@')[0] || 'Racer');
      if (!em || !em.includes('@')) {
        showToast('Enter a valid Gmail address!');
        return;
      }
      if (!savedGoogleAccounts.some(a => a.email.toLowerCase() === em.toLowerCase())) {
        savedGoogleAccounts.unshift({ name: nm, email: em });
        safeSetLS('sthw_google_accounts', JSON.stringify(savedGoogleAccounts));
      }
      finishLogin('google', nm, em);
    });

    guestBtn?.addEventListener('click', () => {
      const gName = (nameIn?.value || '').trim() || ('GUEST_' + playerUID.slice(-4));
      finishLogin('guest', gName, '');
    });

    if (sessionMode === 'google' || sessionMode === 'guest') enterLobby();
    else openLoginScreen();
  }

  // ========================================================
  // RIGHT FRIENDS STRIP (SHOWS ONLY ADDED FRIENDS OR "ADD FRIENDS")
  // ========================================================
  function renderRightFriendsStrip() {
    const el = $('#rightFriendsList');
    if (!el) return;

    if (!friendsList.length) {
      el.innerHTML = `<div class="ff-fr-empty">
        <small>No friends added yet</small>
        <button type="button" class="ff-fr-add-cta" id="btnEmptyAddFriends">➕ ADD FRIENDS</button>
      </div>`;
      $('#btnEmptyAddFriends')?.addEventListener('click', () => openModalPanel('friends', 'add'));
      return;
    }

    el.innerHTML = friendsList.map(fr => {
      const inSq = activeSquadFriend && activeSquadFriend.uid === fr.uid;
      const st = fr.liveStatus || 'offline';
      const stLabel = st === 'in_game' ? '🏎️ PLAYING' : st === 'online' ? '🟢 ONLINE' : '⚫ OFFLINE';
      const stClass = st === 'in_game' ? 'playing' : st === 'online' ? 'online' : 'offline';
      const canInvite = st === 'online' || inSq;
      return `<div class="ff-fr-row ${inSq ? 'in-squad' : ''}">
        <div style="min-width:0;">
          <span class="ff-fr-name" title="${fr.name} (UID: ${fr.uid})">${fr.name}</span>
          <span class="ff-fr-status ${stClass}">${stLabel}</span>
        </div>
        ${canInvite
          ? `<button type="button" class="ff-fr-inv" data-inv-uid="${fr.uid}" title="${inSq ? 'Remove from Squad' : 'Invite to Duo Lobby'}">${inSq ? '✓' : '+'}</button>`
          : `<span style="font-size:9px;color:#64748b;font-weight:800;">${st === 'in_game' ? '🏁' : '—'}</span>`}
      </div>`;
    }).join('');

    el.querySelectorAll('[data-inv-uid]').forEach(btn => {
      btn.onclick = () => {
        const fr = friendsList.find(x => x.uid === btn.dataset.invUid);
        if (!fr) return;
        if (activeSquadFriend && activeSquadFriend.uid === fr.uid) {
          activeSquadFriend = null;
          showToast(`Removed ${fr.name} from lobby`);
        } else {
          activeSquadFriend = fr;
          showToast(`👥 ${fr.name} joined your lobby! 2 cars rotating!`);
        }
        savePlayerState();
        rebuildTurntableVehicle();
      };
    });
  }

  function updateLobbyHUD() {
    if ($('#coins')) $('#coins').textContent = coins.toLocaleString('en-IN');
    if ($('#gems')) $('#gems').textContent = gems.toLocaleString('en-IN');
    const dispName = ((currentUser && currentUser.name) || 'GUEST').toUpperCase();
    if ($('#topPlayerName')) $('#topPlayerName').textContent = dispName;
    if ($('#topAvatarInitials')) $('#topAvatarInitials').textContent = dispName.slice(0, 2);
    if ($('#topPlayerUid')) $('#topPlayerUid').textContent = `UID: ${playerUID}`;

    // Level & XP Progress Bar below Account
    const reqXp = xpForNextLevel(playerLevel);
    const pct = Math.min(100, Math.round((playerXP / reqXp) * 100));
    if ($('#topPlayerLevel')) $('#topPlayerLevel').textContent = String(playerLevel);
    if ($('#topXpFill')) $('#topXpFill').style.width = pct + '%';
    if ($('#topXpText')) $('#topXpText').textContent = `LV.${playerLevel} • ${playerXP}/${reqXp} XP`;

    // Incoming Friend Requests Badge
    const reqBadge = $('#friendReqBadge');
    if (reqBadge) {
      reqBadge.textContent = String(incomingRequests.length);
      reqBadge.classList.toggle('hidden', incomingRequests.length === 0);
    }

    const v = getVehicle();
    if ($('#activeCarName')) {
      $('#activeCarName').textContent = activeSquadFriend
        ? `${v.name.toUpperCase()}  &  ${activeSquadFriend.name.toUpperCase()}`
        : v.name.toUpperCase();
    }
    $('#squadDuoBadge')?.classList.toggle('hidden', !activeSquadFriend);

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

    renderRightFriendsStrip();
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
  // LIVE P2P VOICE CHAT & LIVE MESSAGING (WebRTC / PeerJS — ZERO FIREBASE STORAGE)
  // ========================================================
  let livePeer = null;
  let liveDataConn = null;
  let liveMediaCall = null;
  let remotePeerId = null;

  function appendLiveChatUI(sender, text) {
    chatMessages.push({ sender, text, ts: Date.now() });
    if (chatMessages.length > 40) chatMessages.shift();
    if ($('#chatTickerText')) $('#chatTickerText').textContent = `[Live] ${sender}: ${text}`;
    const box = $('#chatHistoryBox');
    if (box) {
      const div = document.createElement('div');
      div.className = 'chat-msg';
      div.innerHTML = `<b>[${sender}]:</b> <span>${text.replace(/</g, '&lt;')}</span>`;
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
    }
  }

  function attachDataConn(conn) {
    liveDataConn = conn;
    remotePeerId = conn.peer;
    conn.on('open', () => showToast('🟢 Live P2P Squad Chat & Voice Connected!'));
    conn.on('data', (data) => {
      if (data && data.type === 'chat' && data.text) {
        appendLiveChatUI(data.sender || 'FRIEND', data.text);
      }
    });
    conn.on('close', () => {
      if (liveDataConn === conn) liveDataConn = null;
      showToast('Live Squad peer disconnected.');
    });
  }

  function attachRemoteAudioStream(stream) {
    const audioEl = $('#remoteVoiceAudio');
    if (!audioEl) return;
    audioEl.srcObject = stream;
    audioEl.muted = !speakerOn;
    audioEl.play().catch(() => {});
  }

  function initLivePeer(teamCode, isHost) {
    if (!window.Peer) return;
    try { if (livePeer) livePeer.destroy(); } catch (e) {}
    liveDataConn = null;
    liveMediaCall = null;
    remotePeerId = null;

    const hostPeerId = `stgames-team-${teamCode}-host`;
    const myPeerId = isHost ? hostPeerId : `stgames-team-${teamCode}-guest-${playerUID.slice(-4)}`;

    livePeer = new window.Peer(myPeerId);

    livePeer.on('open', () => {
      if (!isHost) {
        const conn = livePeer.connect(hostPeerId, { reliable: true });
        attachDataConn(conn);
        if (micActive && micStream) {
          const call = livePeer.call(hostPeerId, micStream);
          liveMediaCall = call;
          call.on('stream', attachRemoteAudioStream);
        }
      }
    });

    livePeer.on('connection', (conn) => attachDataConn(conn));
    livePeer.on('call', (call) => {
      liveMediaCall = call;
      remotePeerId = call.peer;
      call.answer(micActive && micStream ? micStream : undefined);
      call.on('stream', attachRemoteAudioStream);
    });
    livePeer.on('error', () => {});
  }

  async function toggleVoiceMic() {
    const btn = $('#btnVoiceMic'), lbl = $('#micLabel'), ico = $('#micIcon');
    if (!micActive) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        micActive = true;
        btn?.classList.add('mic-live');
        if (lbl) lbl.textContent = 'LIVE VOICE';
        if (ico) ico.textContent = '🎤';
        if (livePeer && remotePeerId && micStream) {
          const call = livePeer.call(remotePeerId, micStream);
          liveMediaCall = call;
          call.on('stream', attachRemoteAudioStream);
        }
        showToast('🎤 Live P2P Voice Chat ON');
      } catch (e) {
        showToast('Mic permission denied or unavailable.');
      }
    } else {
      micActive = false;
      if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
      if (liveMediaCall) { try { liveMediaCall.close(); } catch (e) {} liveMediaCall = null; }
      btn?.classList.remove('mic-live');
      if (lbl) lbl.textContent = 'VOICE OFF';
      if (ico) ico.textContent = '🎙️';
      showToast('🎙️ Live Voice Chat OFF');
    }
  }

  function toggleVoiceSpeaker() {
    speakerOn = !speakerOn;
    const audioEl = $('#remoteVoiceAudio');
    if (audioEl) audioEl.muted = !speakerOn;
    if ($('#spkIcon')) $('#spkIcon').textContent = speakerOn ? '🔊' : '🔇';
    showToast(speakerOn ? '🔊 Live Squad Audio ON' : '🔇 Live Squad Audio MUTED');
  }

  function sendChatMessage(text) {
    const clean = (text || '').trim();
    if (!clean) return;
    const sender = (currentUser && currentUser.name) || 'RACER';
    appendLiveChatUI(sender, clean);
    if (liveDataConn && liveDataConn.open) {
      liveDataConn.send({ type: 'chat', sender, text: clean });
    }
  }

  // ========================================================
  // THREE.JS 3D TURNTABLE — 1 CAR SOLO OR 2 ROTATING CARS DUO!
  // ========================================================
  let scene, camera, renderer, carGroup, friendCarGroup;
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
    if (friendCarGroup) { scene.remove(friendCarGroup); friendCarGroup = null; }

    if (activeSquadFriend) {
      carGroup = buildAnyVehicle3D(veh, getSkin(), 2.55);
      carGroup.position.set(-1.35, RAMP_Y, 0.25);
      carGroup.rotation.y = currentRotationY;
      scene.add(carGroup);

      const fVeh = getVehicle(activeSquadFriend.carId || 'bugatti_chiron');
      friendCarGroup = buildAnyVehicle3D(fVeh, null, 2.55);
      friendCarGroup.position.set(1.35, RAMP_Y, -0.25);
      friendCarGroup.rotation.y = -currentRotationY;
      scene.add(friendCarGroup);
    } else {
      carGroup = buildAnyVehicle3D(veh, getSkin(), 3.25);
      carGroup.position.set(0, RAMP_Y, 0);
      carGroup.rotation.y = currentRotationY;
      scene.add(carGroup);
    }
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
      if (!isDraggingTurntable) targetRotationY += activeSquadFriend ? 0.009 : 0.004;
      currentRotationY += (targetRotationY - currentRotationY) * 0.14;
      if (carGroup) carGroup.rotation.y = currentRotationY;
      if (friendCarGroup) friendCarGroup.rotation.y = currentRotationY + 0.35;
      renderer.render(scene, camera);
    }
    animateTurntable();
  }

  // ========================================================
  // REMODELED FRIENDS MODAL & OTHER PANELS
  // ========================================================
  function openModalPanel(panelName, initialTab) {
    const modal = $('#modal'), titleEl = $('#title'), contentEl = $('#content');
    if (!modal || !titleEl || !contentEl) return;
    modal.classList.remove('hidden');

    if (panelName === 'friends') {
      const activeTab = initialTab || (incomingRequests.length ? 'requests' : friendsList.length ? 'list' : 'add');
      titleEl.textContent = '👥 FRIENDS & SQUAD (FREE FIRE STYLE)';

      const renderFriendsTab = (tab) => {
        let bodyHtml = '';

        if (tab === 'list') {
          if (!friendsList.length) {
            bodyHtml = `<div class="item-card" style="text-align:center;padding:18px;">
              <strong>No friends added yet</strong>
              <small style="margin:4px 0 10px;">Go to the <b>ADD FRIENDS</b> tab to send a request by UID or join via Team Code.</small>
              <button type="button" class="card-action-btn buy" id="goAddTabBtn" style="max-width:220px;margin:0 auto;">➕ ADD FRIENDS</button>
            </div>`;
          } else {
            bodyHtml = `<div class="grid-cards">${friendsList.map(fr => {
              const inSq = activeSquadFriend && activeSquadFriend.uid === fr.uid;
              const st = fr.liveStatus || 'offline';
              const stBadge = st === 'in_game' ? '🏎️ PLAYING GAME' : st === 'online' ? '🟢 ONLINE' : '⚫ OFFLINE';
              return `<div class="item-card ${inSq ? 'selected' : ''}">
                <div>
                  <strong>👤 ${fr.name} <small style="display:inline;color:#fde047;">LV.${fr.level || 1}</small></strong>
                  <small>UID: ${fr.uid} • ${stBadge}</small>
                </div>
                <div style="display:flex;gap:5px;">
                  ${st === 'online' || inSq
                    ? `<button type="button" class="card-action-btn ${inSq ? 'danger' : 'equipped'}" data-modal-inv="${fr.uid}">${inSq ? 'LEAVE DUO' : 'INVITE DUO'}</button>`
                    : `<button type="button" class="card-action-btn" disabled style="opacity:0.55;">${st === 'in_game' ? 'IN GAME' : 'OFFLINE'}</button>`}
                  <button type="button" class="card-action-btn danger" style="width:36px;" data-del-fr="${fr.uid}" title="Remove Friend">✕</button>
                </div>
              </div>`;
            }).join('')}</div>`;
          }
        } else if (tab === 'requests') {
          if (!incomingRequests.length) {
            bodyHtml = `<div class="item-card" style="text-align:center;padding:18px;">
              <strong>No pending friend requests</strong>
              <small>When another player sends a request to your UID (<b>${playerUID}</b>), you can Accept or Reject it here.</small>
            </div>`;
          } else {
            bodyHtml = `<div style="display:flex;flex-direction:column;gap:8px;">${incomingRequests.map(req => `
              <div class="fr-req-row">
                <div>
                  <strong style="font-size:12.5px;color:#fff;">👤 ${req.name} <small style="color:#fde047;">LV.${req.level || 1}</small></strong>
                  <small style="display:block;font-size:10px;color:#94a3b8;">UID: ${req.uid} • Wants to be your friend</small>
                </div>
                <div style="display:flex;gap:6px;">
                  <button type="button" class="card-action-btn equipped" style="width:auto;" data-acc-req="${req.uid}">✅ ACCEPT</button>
                  <button type="button" class="card-action-btn danger" style="width:auto;" data-rej-req="${req.uid}">❌ REJECT</button>
                </div>
              </div>`).join('')}</div>`;
          }
        } else {
          const onlineNow = onlineDirectory.filter(u => !friendsList.some(f => f.uid === u.uid));
          bodyHtml = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
              <div class="item-card">
                <strong>🔎 SEND FRIEND REQUEST BY UID</strong>
                <input id="addFriendUidIn" class="auth-input" placeholder="Enter Friend UID (e.g. 11111)">
                <button type="button" class="card-action-btn buy" id="addFriendUidBtn">📩 SEND REQUEST</button>
              </div>
              <div class="item-card">
                <strong>🚀 JOIN DUO BY TEAM CODE</strong>
                <input id="joinTeamCodeIn" class="auth-input" placeholder="Enter 6-digit Team Code">
                <button type="button" class="card-action-btn equipped" id="joinTeamCodeBtn">🔗 JOIN SQUAD</button>
              </div>
            </div>
            <div style="margin-bottom:6px;font-size:11px;font-weight:900;color:#38bdf8;">🌐 PLAYERS DIRECTORY (LIVE STATUS)</div>
            ${onlineNow.length ? `<div class="grid-cards">${onlineNow.slice(0, 8).map(u => {
              const stBadge = u.liveStatus === 'in_game' ? '🏎️ PLAYING GAME' : u.liveStatus === 'online' ? '🟢 ONLINE' : '⚫ OFFLINE';
              return `<div class="item-card">
                <div>
                  <strong>👤 ${u.name} <small style="display:inline;color:#fde047;">LV.${u.level}</small></strong>
                  <small>UID: ${u.uid} • ${stBadge}</small>
                </div>
                <button type="button" class="card-action-btn ${u.liveStatus === 'online' ? 'buy' : ''}" data-send-req="${u.uid}" ${u.liveStatus === 'offline' ? 'disabled style="opacity:0.5;"' : ''}>
                  ${u.liveStatus === 'offline' ? 'OFFLINE' : '📩 SEND REQUEST'}
                </button>
              </div>`;
            }).join('')}</div>` : `<div class="item-card"><small>No other online players right now. Share your UID (<b>${playerUID}</b>) or Team Code (<b>${myTeamCode}</b>) with friends!</small></div>`}`;
        }

        contentEl.innerHTML = `
          <div class="fr-hero-bar">
            <div class="fr-hero-pill">
              <div><small>YOUR UID</small><strong>${playerUID}</strong></div>
              <button type="button" class="fr-mini-btn" id="copyUidBtn">📋 COPY</button>
            </div>
            <div class="fr-hero-pill">
              <div><small>YOUR TEAM CODE</small><strong style="color:#38bdf8;">${myTeamCode}</strong></div>
              <button type="button" class="fr-mini-btn" id="copyTeamBtn">📋 COPY</button>
            </div>
          </div>
          <div class="tab-bar">
            <button type="button" class="tab-pill ${tab === 'list' ? 'active' : ''}" data-fr-tab="list">👥 MY FRIENDS (${friendsList.length})</button>
            <button type="button" class="tab-pill ${tab === 'requests' ? 'active' : ''}" data-fr-tab="requests">📩 REQUESTS (${incomingRequests.length})</button>
            <button type="button" class="tab-pill ${tab === 'add' ? 'active' : ''}" data-fr-tab="add">➕ ADD FRIENDS</button>
          </div>
          ${bodyHtml}`;

        $('#copyUidBtn').onclick = () => { navigator.clipboard?.writeText(playerUID).catch(() => {}); showToast(`Copied UID: ${playerUID}`); };
        $('#copyTeamBtn').onclick = () => { navigator.clipboard?.writeText(myTeamCode).catch(() => {}); showToast(`Copied Team Code: ${myTeamCode}`); };
        contentEl.querySelectorAll('[data-fr-tab]').forEach(b => { b.onclick = () => renderFriendsTab(b.dataset.frTab); });
        $('#goAddTabBtn')?.addEventListener('click', () => renderFriendsTab('add'));

        $('#addFriendUidBtn')?.addEventListener('click', async () => {
          await sendFriendRequestToUID($('#addFriendUidIn').value);
        });

        $('#joinTeamCodeBtn')?.addEventListener('click', async () => {
          const code = ($('#joinTeamCodeIn').value || '').trim();
          if (code.length < 4) { showToast('Enter a 6-digit Team Code!'); return; }
          let fr = null;
          try {
            const r = await fetch(`${FIREBASE_DB_URL}/st_hill_climb_v2/teamcodes/${encodeURIComponent(code)}.json`, { cache: 'no-store' });
            if (r.ok) {
              const d = await r.json();
              if (d && d.uid && d.uid !== playerUID) {
                fr = { uid: d.uid, name: d.name || 'SQUAD', carId: d.carId || 'agera', liveStatus: 'online' };
              }
            }
          } catch (e) {}
          if (!fr) { showToast('Team Code not found or expired!'); return; }
          if (!friendsList.some(f => f.uid === fr.uid)) friendsList.unshift(fr);
          activeSquadFriend = fr;
          myTeamCode = code;
          initLivePeer(code, false);
          await savePlayerState();
          rebuildTurntableVehicle();
          modal.classList.add('hidden');
          showToast(`🔗 Joined Team ${code} with ${fr.name}!`);
        });

        contentEl.querySelectorAll('[data-send-req]').forEach(b => {
          b.onclick = () => sendFriendRequestToUID(b.dataset.sendReq);
        });

        contentEl.querySelectorAll('[data-acc-req]').forEach(b => {
          b.onclick = async () => {
            const req = incomingRequests.find(x => x.uid === b.dataset.accReq);
            await acceptFriendRequest(req);
            renderFriendsTab('requests');
          };
        });

        contentEl.querySelectorAll('[data-rej-req]').forEach(b => {
          b.onclick = async () => {
            await rejectFriendRequest(b.dataset.rejReq);
            renderFriendsTab('requests');
          };
        });

        contentEl.querySelectorAll('[data-modal-inv]').forEach(b => {
          b.onclick = () => {
            const fr = friendsList.find(x => x.uid === b.dataset.modalInv);
            if (!fr) return;
            activeSquadFriend = (activeSquadFriend && activeSquadFriend.uid === fr.uid) ? null : fr;
            savePlayerState();
            rebuildTurntableVehicle();
            renderFriendsTab('list');
          };
        });

        contentEl.querySelectorAll('[data-del-fr]').forEach(b => {
          b.onclick = () => {
            const uid = b.dataset.delFr;
            friendsList = friendsList.filter(x => x.uid !== uid);
            if (activeSquadFriend && activeSquadFriend.uid === uid) activeSquadFriend = null;
            savePlayerState();
            rebuildTurntableVehicle();
            renderFriendsTab('list');
          };
        });
      };

      pollPresenceAndRequests().then(() => renderFriendsTab(activeTab));
      renderFriendsTab(activeTab);
      return;
    }

    if (panelName === 'chat') {
      titleEl.textContent = `💬 LIVE SQUAD CHAT (CODE: ${myTeamCode})`;
      contentEl.innerHTML = `
        <div class="chat-box" id="chatHistoryBox">
          ${chatMessages.map(m => `<div class="chat-msg"><b>[${m.sender}]:</b> <span>${m.text}</span></div>`).join('')}
        </div>
        <div style="display:flex;gap:6px;margin-bottom:8px;">
          <input id="chatTextIn" class="auth-input" placeholder="Type live message (not stored on Firebase)...">
          <button type="button" class="card-action-btn buy" id="chatSendBtn" style="width:110px;">SEND</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <button type="button" class="tab-pill" data-qmsg="Let's Race! 🏎️">Let's Race! 🏎️</button>
          <button type="button" class="tab-pill" data-qmsg="Ready!">Ready!</button>
          <button type="button" class="tab-pill" data-qmsg="Nice Car! 🔥">Nice Car! 🔥</button>
          <button type="button" class="tab-pill" data-qmsg="Join my Team Code: ${myTeamCode}">Share Team Code</button>
        </div>`;

      const doSend = (txt) => {
        sendChatMessage(txt);
        $('#chatTextIn').value = '';
      };
      $('#chatSendBtn').onclick = () => doSend($('#chatTextIn').value);
      $('#chatTextIn').onkeydown = e => { if (e.key === 'Enter') doSend($('#chatTextIn').value); };
      contentEl.querySelectorAll('[data-qmsg]').forEach(b => { b.onclick = () => doSend(b.dataset.qmsg); });
      return;
    }

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
          <button type="button" class="card-action-btn" id="settingsLoginBtn">🔑 SWITCH ACCOUNT / LOGIN</button>
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
      $('#settingsLoginBtn').onclick = () => openLoginScreen();
      return;
    }

    if (panelName === 'account') {
      const reqXp = xpForNextLevel(playerLevel);
      titleEl.textContent = '☁️ ACCOUNT, USERNAME & LEVEL';
      contentEl.innerHTML = `
        <div class="item-card" style="margin-bottom:10px;">
          <strong>Player: ${(currentUser && currentUser.name) || 'GUEST'} (${sessionMode === 'google' ? 'Google Account' : 'Guest Mode'})</strong>
          <small>UID: <b style="color:#fde047;">${playerUID}</b> • Level <b>${playerLevel}</b> (${playerXP}/${reqXp} XP) • Best Distance: <b>${bestDistKm.toFixed(2)} KM</b></small>
        </div>
        <div class="item-card" style="margin-bottom:10px;">
          <strong>✏️ CHANGE USERNAME (CHECKS AVAILABILITY)</strong>
          <div style="display:flex;gap:6px;margin-top:4px;">
            <input id="changeUsernameIn" class="auth-input" value="${(currentUser && currentUser.name) || ''}" placeholder="Enter new available username">
            <button type="button" class="card-action-btn equipped" id="saveUsernameBtn" style="width:140px;">CHECK &amp; SAVE</button>
          </div>
          <small id="usernameCheckMsg" style="color:#94a3b8;margin-top:3px;">Only available usernames can be claimed.</small>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button type="button" class="card-action-btn buy" id="openFullLoginBtn">🔑 SWITCH GOOGLE ACCOUNT</button>
          <button type="button" class="card-action-btn" id="openFriendsFromAcc">👥 FRIENDS &amp; REQUESTS</button>
        </div>`;

      $('#saveUsernameBtn').onclick = async () => {
        const desired = ($('#changeUsernameIn').value || '').trim();
        const msgEl = $('#usernameCheckMsg');
        if (cleanUsernameKey(desired).length < 3) {
          if (msgEl) { msgEl.textContent = '❌ Username must be at least 3 characters.'; msgEl.style.color = '#f87171'; }
          return;
        }
        const ok = await isUsernameAvailable(desired);
        if (!ok) {
          if (msgEl) { msgEl.textContent = '❌ That username is already taken! Try another.'; msgEl.style.color = '#f87171'; }
          return;
        }
        const claimed = await claimAvailableUsername(desired);
        currentUser = Object.assign({}, currentUser || { uid: playerUID, mode: sessionMode }, { name: claimed });
        safeSetLS('sthw_fb_user', JSON.stringify(currentUser));
        await savePlayerState();
        if (msgEl) { msgEl.textContent = `✅ Username changed to ${claimed}!`; msgEl.style.color = '#4ade80'; }
        showToast(`✅ Username updated to ${claimed}!`);
      };
      $('#openFullLoginBtn').onclick = () => openLoginScreen();
      $('#openFriendsFromAcc').onclick = () => openModalPanel('friends');
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
    presenceStatus = 'in_game';
    savePlayerState();
    $('#menu').classList.add('hidden');
    $('#game').classList.remove('hidden');
    window.HillGame.start(veh, getMap(), getSkin(), upgrade);
  }

  $('#btnFullscreenTop')?.addEventListener('click', request16x9Fullscreen);
  $('#btnAccount')?.addEventListener('click', () => openModalPanel('account'));
  $('#btnAccountTop')?.addEventListener('click', () => openModalPanel('account'));
  $('#btnStore')?.addEventListener('click', () => openModalPanel('store', 'cars'));
  $('#btnLibrary')?.addEventListener('click', () => openModalPanel('library'));
  $('#dockVault')?.addEventListener('click', () => openModalPanel('library'));
  $('#btnSkinsStore')?.addEventListener('click', () => openModalPanel('store', 'skins'));
  $('#dockSkins')?.addEventListener('click', () => openModalPanel('store', 'skins'));
  $('#btnUpgrades')?.addEventListener('click', () => openModalPanel('upgrades'));
  $('#btnEvents')?.addEventListener('click', () => openModalPanel('events'));
  $('#btnFriendsTop')?.addEventListener('click', () => openModalPanel('friends'));
  $('#btnAddFriendQuick')?.addEventListener('click', () => openModalPanel('friends', 'add'));
  $('#btnTeamCodeMini')?.addEventListener('click', () => openModalPanel('friends', 'add'));
  $('#dockFriends')?.addEventListener('click', () => openModalPanel('friends'));
  $('#btnNotifications')?.addEventListener('click', () => openModalPanel('notifications'));
  $('#btnSettings')?.addEventListener('click', () => openModalPanel('settings'));
  $('#btnVoiceMic')?.addEventListener('click', toggleVoiceMic);
  $('#btnVoiceSpeaker')?.addEventListener('click', toggleVoiceSpeaker);
  $('#btnOpenChat')?.addEventListener('click', () => openModalPanel('chat'));
  $('#chatTickerBtn')?.addEventListener('click', () => openModalPanel('chat'));
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
      presenceStatus = 'online';
      savePlayerState();
    },
    onRunEnded(scoreVal, distKm, earnedTCoins, nearMissCount) {
      const prevBest = +(safeGetLS('sthwBest', '0'));
      if (scoreVal > prevBest) safeSetLS('sthwBest', String(scoreVal));
      if (distKm > bestDistKm) bestDistKm = distKm;
      coins += (earnedTCoins || 0);
      // Slow, steady XP gain from distance + near misses
      const xpEarned = Math.max(15, Math.floor((distKm || 0) * 35 + (nearMissCount || 0) * 8));
      const leveledUp = addPlayerXP(xpEarned);
      presenceStatus = 'online';
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
    initLoginScreen();
    loadExternalConfigs();
    checkManualAdminRoute();
    setInterval(pollPresenceAndRequests, 12000);
  });
})();
