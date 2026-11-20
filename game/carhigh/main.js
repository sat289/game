(() => {
  const $ = s => document.querySelector(s);

  const FIREBASE_PROJECT_ID = "friendsgame-872f5";

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
    try {
      const v = localStorage.getItem(key);
      return v !== null ? v : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function safeSetLS(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  }

  let currentUser = null;
  try {
    currentUser = JSON.parse(safeGetLS('sthw_fb_user', 'null'));
  } catch (e) {
    currentUser = null;
  }

  let coins = +(safeGetLS('sthwCoins', '125680'));
  let gems = +(safeGetLS('sthwGems', '2450'));
  let selected = safeGetLS('sthwVehicle', 'agera');
  let selectedSkin = safeGetLS('sthwSkin', 'skin_crimson');
  let mapName = safeGetLS('sthwMap', 'Sunset Highway');
  if (!(window.MAPS || []).some(m => m.name === mapName)) mapName = 'Sunset Highway';

  let owned = [];
  let ownedSkins = [];
  let savedMaps = [];
  let upgrade = {};
  let claimedNotifs = [];
  let claimedAchievs = [];

  try { owned = JSON.parse(safeGetLS('sthwOwned', '["agera","moto_1000r","astra_gt"]')); } catch (e) { owned = ['agera', 'moto_1000r', 'astra_gt']; }
  ['agera', 'moto_1000r', 'astra_gt'].forEach(defId => {
    if (!owned.includes(defId)) owned.push(defId);
  });
  if (!(window.VEHICLES || []).some(v => v.id === selected)) selected = 'agera';

  try { ownedSkins = JSON.parse(safeGetLS('sthwOwnedSkins', '["skin_crimson"]')); } catch (e) { ownedSkins = ['skin_crimson']; }
  try { savedMaps = JSON.parse(safeGetLS('sthwMaps', '["Sunset Highway","Countryside Autobahn"]')); } catch (e) { savedMaps = ['Sunset Highway', 'Countryside Autobahn']; }
  if (!savedMaps.includes('Sunset Highway')) savedMaps.unshift('Sunset Highway');
  try { upgrade = JSON.parse(safeGetLS('sthwUpgrade', '{}')); } catch (e) { upgrade = {}; }
  try { claimedNotifs = JSON.parse(safeGetLS('sthwClaimedNotifs', '[]')); } catch (e) { claimedNotifs = []; }
  try { claimedAchievs = JSON.parse(safeGetLS('sthwClaimedAchievs', '[]')); } catch (e) { claimedAchievs = []; }

  let liveConfig = {
    notifications: [
      { id: "notif_highway", title: "🌅 Realistic 3D Sunset Highway & Backside Cam!", body: "Race on textured 4-lane asphalt with rear chase camera or upload your own .GLB/.OBJ 3D car files!", date: "New", rewardCoins: 3000 },
      { id: "notif_moto", title: "🏍️ Real 3D Bikes & Hypercars Fleet!", body: "Race the Street Moto 1000R, Ninja H2R, Hayabusa, Koenigsegg Agera RS, and Bugatti Chiron in full 3D!", date: "New", rewardCoins: 2500 },
      { id: "notif_cloud", title: "☁️ Firebase Account Sync Active", body: "Use CREATE ACCOUNT in the Orange bar to save your garage to Firebase Cloud, or stay in Guest mode.", date: "New", rewardCoins: 1500 }
    ],
    events: [
      { id: "ev_sunset_overtake", title: "🌅 Sunset Highway Overtake Rush", desc: "Weave through 4-lane highway traffic at 150+ KMH with rear chase view!", map: "Sunset Highway", vehicle: "astra_gt", rewardCoins: 5000, badge: "HIGHWAY STAGE" },
      { id: "ev_moto_sprint", title: "🏍️ 3D Street Moto 1000R Sprint", desc: "Split lanes on your 3D Superbike across Night City Metro!", map: "Night City Metro", vehicle: "moto_1000r", rewardCoins: 6000, badge: "3D BIKE CUP" },
      { id: "ev_agera_autobahn", title: "🏎️ Koenigsegg Agera Top-Speed Run", desc: "Hit 260+ KMH on Countryside Autobahn without crashing!", map: "Countryside Autobahn", vehicle: "agera", rewardCoins: 7500, badge: "HYPERCAR" }
    ],
    customButtons: [],
    customVehicles: [],
    customMaps: [],
    customSkins: []
  };

  function applyAdminConfig(cfg) {
    if (!cfg || typeof cfg !== 'object') return;
    liveConfig = Object.assign({}, liveConfig, cfg);

    const baseVehs = JSON.parse(JSON.stringify(window.DEFAULT_VEHICLES || window.VEHICLES));
    const customVehs = Array.isArray(liveConfig.customVehicles) ? liveConfig.customVehicles : [];
    const mergedVehs = [...baseVehs];
    customVehs.forEach(cv => {
      if (!cv || !cv.id) return;
      const idx = mergedVehs.findIndex(v => v.id === cv.id);
      if (idx >= 0) mergedVehs[idx] = Object.assign({}, mergedVehs[idx], cv);
      else mergedVehs.unshift(cv);
    });
    window.VEHICLES = mergedVehs;

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
    window.MAPS.forEach(m => {
      if (savedMaps.includes(m.name) || m.price === 0) m.unlocked = true;
    });

    const baseSkins = JSON.parse(JSON.stringify(window.DEFAULT_SKINS || window.VEHICLE_SKINS || []));
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
      const res = await fetch(`https://friendsgame-872f5-default-rtdb.firebaseio.com/st_hill_climb_v2/live_config.json`, { cache: 'no-store' });
      if (res.ok) {
        const fbCfg = await res.json();
        if (fbCfg && typeof fbCfg === 'object') {
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
    safeSetLS('sthwVehicle', selected);
    safeSetLS('sthwSkin', selectedSkin);
    safeSetLS('sthwMap', mapName);
    safeSetLS('sthwOwned', JSON.stringify(owned));
    safeSetLS('sthwOwnedSkins', JSON.stringify(ownedSkins));
    safeSetLS('sthwUpgrade', JSON.stringify(upgrade));
    safeSetLS('sthwMaps', JSON.stringify(unlockedMapsList));
    safeSetLS('sthwClaimedNotifs', JSON.stringify(claimedNotifs));
    safeSetLS('sthwClaimedAchievs', JSON.stringify(claimedAchievs));

    updateLobbyHUD();

    if (currentUser && currentUser.uid) {
      const payload = {
        uid: currentUser.uid,
        name: currentUser.name || 'Racer',
        email: currentUser.email || '',
        coins,
        gems,
        selected,
        selectedSkin,
        mapName,
        owned,
        ownedSkins,
        savedMaps: unlockedMapsList,
        upgrade,
        bestScore: +(safeGetLS('sthwBest', '0')),
        claimedNotifs,
        claimedAchievs,
        updatedAt: new Date().toISOString()
      };
      try {
        await fetch(`https://friendsgame-872f5-default-rtdb.firebaseio.com/st_hill_climb_v2/users/${encodeURIComponent(currentUser.uid)}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {}
    }
  }

  async function pullFirebaseUserState(uid) {
    try {
      const res = await fetch(`https://friendsgame-872f5-default-rtdb.firebaseio.com/st_hill_climb_v2/users/${encodeURIComponent(uid)}.json`, { cache: 'no-store' });
      if (!res.ok) return false;
      const data = await res.json();
      if (!data || typeof data !== 'object') return false;

      if (typeof data.coins === 'number') coins = data.coins;
      if (typeof data.gems === 'number') gems = data.gems;
      if (data.selected) selected = data.selected;
      if (data.selectedSkin) selectedSkin = data.selectedSkin;
      if (data.mapName && (window.MAPS || []).some(m => m.name === data.mapName)) mapName = data.mapName;
      if (Array.isArray(data.owned) && data.owned.length) owned = Array.from(new Set(['agera', 'moto_1000r', 'astra_gt', ...data.owned]));
      if (Array.isArray(data.ownedSkins) && data.ownedSkins.length) ownedSkins = data.ownedSkins;
      if (Array.isArray(data.savedMaps)) {
        savedMaps = data.savedMaps;
        (window.MAPS || []).forEach(m => { m.unlocked = savedMaps.includes(m.name) || m.price === 0; });
      }
      if (data.upgrade && typeof data.upgrade === 'object') upgrade = data.upgrade;
      if (typeof data.bestScore === 'number') safeSetLS('sthwBest', String(Math.max(+(safeGetLS('sthwBest', '0')), data.bestScore)));

      await savePlayerState();
      rebuildTurntableVehicle();
      return true;
    } catch (e) {
      return false;
    }
  }

  function getVehicle() {
    return (window.VEHICLES || []).find(v => v.id === selected) || window.VEHICLES[0];
  }
  function getSkin() {
    return (window.VEHICLE_SKINS || []).find(s => s.id === selectedSkin) || null;
  }
  function getMap() {
    return (window.MAPS || []).find(m => m.name === mapName) || window.MAPS[0];
  }

  function updateLobbyHUD() {
    if ($('#coins')) $('#coins').textContent = coins.toLocaleString('en-IN');
    if ($('#gems')) $('#gems').textContent = gems.toLocaleString('en-IN');

    const accLabel = $('#accountBtnTitle');
    const accSub = $('#accountBtnSub');
    const accBtn = $('#btnAccount');
    const topPlayerName = $('#topPlayerName');
    const topAccountMode = $('#topAccountMode');

    if (currentUser && currentUser.uid) {
      if (accLabel) accLabel.textContent = currentUser.name || 'CLOUD ACCOUNT';
      if (accSub) accSub.textContent = '☁️ Firebase Synced';
      if (accBtn) accBtn.classList.add('synced');
      if (topPlayerName) topPlayerName.textContent = currentUser.name || 'PRO RACER';
      if (topAccountMode) topAccountMode.textContent = '☁️ FIREBASE CLOUD SYNC';
    } else {
      if (accLabel) accLabel.textContent = 'CREATE ACCOUNT';
      if (accSub) accSub.textContent = 'Guest (LocalStorage)';
      if (accBtn) accBtn.classList.remove('synced');
      if (topPlayerName) topPlayerName.textContent = 'GUEST RACER';
      if (topAccountMode) topAccountMode.textContent = '💾 GUEST LOCAL SAVE';
    }

    const v = getVehicle();
    const upLv = (k) => upgrade[v.id + k] || 0;
    const effSpd = Math.min(140, v.speed + upLv('Engine') * 4);
    const effAcc = Math.min(140, v.acc + upLv('Tires') * 4);
    const effHnd = Math.min(140, v.handling + upLv('Suspension') * 4);
    const effFuel = Math.min(140, v.fuel + upLv('Fuel') * 5);

    if ($('#activeCarName')) $('#activeCarName').textContent = v.name;
    if ($('#activeCarBadge')) $('#activeCarBadge').textContent = v.badge || (v.type === 'bike' ? '3D SUPERBIKE' : '3D HYPERCAR');
    if ($('#statSpd')) $('#statSpd').textContent = effSpd;
    if ($('#statAcc')) $('#statAcc').textContent = effAcc;
    if ($('#statHnd')) $('#statHnd').textContent = effHnd;
    if ($('#statFuel')) $('#statFuel').textContent = effFuel;

    const m = getMap();
    const mapHalf = $('#mapSelectBox');
    if (mapHalf && m) {
      mapHalf.style.background = `linear-gradient(180deg, ${m.sky} 0%, ${m.skyBottom || '#ea580c'} 72%)`;
      const groundBar = $('#redMapGround');
      if (groundBar) {
        groundBar.style.background = m.ground;
        groundBar.style.borderTopColor = m.road || '#fde047';
      }
      if ($('#redMapIcon')) $('#redMapIcon').textContent = m.icon || '🌅';
      if ($('#redMapName')) $('#redMapName').textContent = m.name.toUpperCase();
    }

    const strip = $('#ownedQuickStrip');
    if (strip) {
      const ownedVehicles = (window.VEHICLES || []).filter(item => owned.includes(item.id));
      strip.innerHTML = ownedVehicles.map(item => `
        <button type="button" class="owned-chip ${item.id === selected ? 'active' : ''}" data-quick-veh="${item.id}">
          <span>${item.emoji || (item.type === 'bike' ? '🏍️' : '🏎️')}</span>
          <span>${item.name}</span>
        </button>
      `).join('');
      strip.querySelectorAll('[data-quick-veh]').forEach(btn => {
        btn.onclick = () => {
          selected = btn.dataset.quickVeh;
          if (window.HillGame) window.HillGame._customCarModel = null;
          savePlayerState();
          rebuildTurntableVehicle();
          showToast(`Selected ${getVehicle().name}`);
        };
      });
    }

    const unreadCount = (liveConfig.notifications || []).filter(n => !claimedNotifs.includes(n.id)).length;
    const badgeEl = $('#notifBadge');
    if (badgeEl) {
      badgeEl.textContent = unreadCount;
      badgeEl.classList.toggle('hidden', unreadCount === 0);
    }
  }

  function renderCustomButtons() {
    const orangeSlot = $('#orangeCustomBtns');
    const whiteSlot = $('#whiteCustomBtns');
    const greySlot = $('#greyCustomBtns');
    const floatingLayer = $('#customFloatingLayer');
    if (orangeSlot) orangeSlot.innerHTML = '';
    if (whiteSlot) whiteSlot.innerHTML = '';
    if (greySlot) greySlot.innerHTML = '';
    if (floatingLayer) floatingLayer.innerHTML = '';

    const btns = Array.isArray(liveConfig.customButtons) ? liveConfig.customButtons : [];
    btns.forEach(b => {
      if (!b || !b.label) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      const icon = b.icon || '⚡';

      const handleAction = () => {
        if (b.actionType === 'panel') {
          openModalPanel(b.actionValue || 'store');
        } else if (b.actionType === 'reward') {
          const amt = parseInt(b.actionValue, 10) || 1000;
          const claimKey = 'sthw_btn_reward_' + (b.id || b.label);
          if (safeGetLS(claimKey, '') === new Date().toDateString()) {
            showToast('Bonus already claimed today!');
          } else {
            coins += amt;
            safeSetLS(claimKey, new Date().toDateString());
            savePlayerState();
            showToast(`+${amt.toLocaleString('en-IN')} Coins Claimed!`);
          }
        } else if (b.actionType === 'url' && b.actionValue) {
          window.open(b.actionValue, '_blank', 'noopener');
        } else if (b.actionType === 'message') {
          showToast(b.actionValue || b.label);
        } else {
          openModalPanel('store');
        }
      };

      if (b.zone === 'orange' && orangeSlot) {
        btn.className = 'orange-btn';
        if (b.color) btn.style.background = b.color;
        btn.innerHTML = `<div class="btn-icon">${icon}</div><div class="btn-text"><strong>${b.label}</strong><small>${b.sublabel || 'Special Feature'}</small></div>`;
        btn.onclick = handleAction;
        orangeSlot.appendChild(btn);
      } else if (b.zone === 'white' && whiteSlot) {
        btn.className = 'white-zone-btn';
        if (b.color) btn.style.background = b.color;
        btn.innerHTML = `<span>${icon}</span><span>${b.label}</span>`;
        btn.onclick = handleAction;
        whiteSlot.appendChild(btn);
      } else if (b.zone === 'grey' && greySlot) {
        btn.className = 'grey-action-btn';
        if (b.color) btn.style.background = b.color;
        btn.innerHTML = `<span>${icon}</span><span>${b.label}</span>`;
        btn.onclick = handleAction;
        greySlot.appendChild(btn);
      } else if (floatingLayer) {
        btn.className = 'white-zone-btn';
        btn.style.position = 'absolute';
        btn.style.left = (b.x || 50) + '%';
        btn.style.top = (b.y || 50) + '%';
        if (b.color) btn.style.background = b.color;
        btn.innerHTML = `<span>${icon}</span><span>${b.label}</span>`;
        btn.onclick = handleAction;
        floatingLayer.appendChild(btn);
      }
    });
  }

  // THREE.JS 3D TURNTABLE RAMP
  let scene, camera, renderer, carGroup, platformGroup, wheelMeshes = [];
  let isDraggingTurntable = false;
  let dragStartCoord = 0;
  let targetRotationY = 0.62;
  let currentRotationY = 0.62;
  let autoSpin = false;

  function decodeBase64Int16(b64) {
    const bin = atob(b64);
    const buf = new ArrayBuffer(bin.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
    return new Int16Array(buf);
  }
  function decodeBase64Uint16(b64) {
    const bin = atob(b64);
    const buf = new ArrayBuffer(bin.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
    return new Uint16Array(buf);
  }

  function buildMaterialsForSkin(veh, skin) {
    const THREE = window.THREE;
    const useVehDefault = !skin || (skin.id === 'skin_crimson' && veh.id !== 'agera');
    const primaryHex = useVehDefault ? (veh.defaultColor || '#e11d48') : (skin.primary || veh.defaultColor || '#e11d48');
    const secondaryHex = useVehDefault ? (veh.secondaryColor || '#111827') : (skin.secondary || veh.secondaryColor || '#111827');
    const finish = (skin && skin.finish) || 'metallic';

    const paintMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(primaryHex),
      metalness: finish === 'chrome' ? 0.92 : finish === 'matte' ? 0.25 : 0.72,
      roughness: finish === 'chrome' ? 0.12 : finish === 'matte' ? 0.65 : 0.22,
      emissive: finish === 'neon' ? new THREE.Color(primaryHex) : new THREE.Color(0x000000),
      emissiveIntensity: finish === 'neon' ? 0.28 : 0.0
    });
    const carbonMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(secondaryHex),
      metalness: 0.55,
      roughness: 0.35
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd1d5db),
      metalness: 0.88,
      roughness: 0.16
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x0f172a),
      metalness: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.84
    });
    const lightsMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xff1e42),
      emissive: new THREE.Color(0xff1133),
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x18181b),
      metalness: 0.5,
      roughness: 0.45
    });
    return { paintMat, carbonMat, chromeMat, glassMat, lightsMat, wheelMat };
  }

  function buildPrebakedAgeraMesh(veh, skin, customScale) {
    const THREE = window.THREE;
    const data = window.AGERA_3D_DATA;
    const root = new THREE.Group();
    wheelMeshes = [];
    if (!data || !THREE) return root;

    const rawVerts = decodeBase64Int16(data.verts);
    const scale = data.scale || 60.0;
    const positions = new Float32Array(rawVerts.length);
    for (let i = 0; i < rawVerts.length; i++) {
      positions[i] = rawVerts[i] / scale;
    }

    const posAttr = new THREE.BufferAttribute(positions, 3);
    const mats = buildMaterialsForSkin(veh, skin);

    const makeSubMesh = (groupKey, mat) => {
      const b64Idx = data.groups[groupKey];
      if (!b64Idx) return null;
      const indices = decodeBase64Uint16(b64Idx);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', posAttr);
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, mat);
    };

    const bodyGroup = new THREE.Group();
    ['Paint', 'Carbon', 'Glass', 'Lights'].forEach(k => {
      const m = makeSubMesh(k, k === 'Paint' ? mats.paintMat : k === 'Glass' ? mats.glassMat : k === 'Lights' ? mats.lightsMat : mats.carbonMat);
      if (m) bodyGroup.add(m);
    });
    root.add(bodyGroup);

    const b64Wheel = data.groups['FL'];
    if (b64Wheel && Array.isArray(data.wheelPositions)) {
      const wIndices = decodeBase64Uint16(b64Wheel);
      const wGeo = new THREE.BufferGeometry();
      wGeo.setAttribute('position', posAttr);
      wGeo.setIndex(new THREE.BufferAttribute(wIndices, 1));
      wGeo.computeVertexNormals();

      data.wheelPositions.forEach(wp => {
        const wMesh = new THREE.Mesh(wGeo, mats.wheelMat);
        wMesh.position.set(wp.x, wp.y, wp.z);
        if (wp.flipX) wMesh.scale.x = -1;
        root.add(wMesh);
        wheelMeshes.push(wMesh);
      });
    }

    const s = (customScale || 0.092) * (veh.scale || 1.0);
    root.scale.set(s, s, s);
    root.position.y = customScale ? 0 : -0.36;
    return root;
  }

  function buildPrebakedMotoMesh(veh, skin, customScale) {
    const THREE = window.THREE;
    const data = window.MOTO_3D_DATA;
    const root = new THREE.Group();
    wheelMeshes = [];
    if (!data || !THREE) return root;

    const rawVerts = decodeBase64Int16(data.verts);
    const scale = data.scale || 250.0;
    const positions = new Float32Array(rawVerts.length);
    for (let i = 0; i < rawVerts.length; i++) {
      positions[i] = rawVerts[i] / scale;
    }

    const posAttr = new THREE.BufferAttribute(positions, 3);
    const mats = buildMaterialsForSkin(veh, skin);

    const roleMat = {
      Paint: mats.paintMat,
      Chrome: mats.chromeMat,
      Seat: mats.carbonMat,
      Tire: mats.wheelMat,
      Lights: mats.lightsMat
    };

    Object.keys(data.groups || {}).forEach(k => {
      const b64Idx = data.groups[k];
      if (!b64Idx) return;
      const indices = decodeBase64Uint16(b64Idx);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', posAttr);
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();
      root.add(new THREE.Mesh(geo, roleMat[k] || mats.paintMat));
    });

    const s = (customScale || 0.44) * (veh.scale || 1.0);
    root.scale.set(s, s, s);
    root.position.y = customScale ? 0 : -0.36;
    return root;
  }

  function parseOBJStringToGroup(objText, veh, skin, customScale) {
    const THREE = window.THREE;
    const root = new THREE.Group();
    const verts = [];
    const facesByMtl = {};
    let curMtl = 'Paint';
    let curObj = 'Root';
    const lines = objText.split('
');
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
        for (let k = 1; k < idxs.length - 1; k++) {
          arr.push(idxs[0], idxs[k], idxs[k + 1]);
        }
      }
    }
    if (!verts.length) return buildPrebakedAgeraMesh(veh, skin, customScale);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    const usedIndices = new Set();
    Object.values(facesByMtl).forEach(arr => arr.forEach(idx => usedIndices.add(idx)));
    usedIndices.forEach(idx => {
      const x = verts[idx * 3], y = verts[idx * 3 + 1], z = verts[idx * 3 + 2];
      if (Math.abs(x) > 45 || Math.abs(z) > 45) return;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    });
    const cx = (minX + maxX) / 2;
    const cy = minY;
    const cz = (minZ + maxZ) / 2;
    const maxSpan = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const normFactor = (customScale || 3.4) / maxSpan;

    const posArray = new Float32Array(verts.length);
    for (let i = 0; i < verts.length; i += 3) {
      posArray[i] = (verts[i] - cx) * normFactor;
      posArray[i + 1] = (verts[i + 1] - cy) * normFactor;
      posArray[i + 2] = (verts[i + 2] - cz) * normFactor;
    }
    const posAttr = new THREE.BufferAttribute(posArray, 3);
    const mats = buildMaterialsForSkin(veh, skin);
    const matMap = { Paint: mats.paintMat, Carbon: mats.carbonMat, Chrome: mats.chromeMat, Glass: mats.glassMat, Lights: mats.lightsMat };

    Object.keys(facesByMtl).forEach(k => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', posAttr);
      geo.setIndex(facesByMtl[k]);
      geo.computeVertexNormals();
      root.add(new THREE.Mesh(geo, matMap[k] || mats.paintMat));
    });
    root.position.y = customScale ? 0 : -0.36;
    return root;
  }

  function buildAnyVehicle3D(veh, skin, customScale) {
    if (!veh) veh = getVehicle();
    if (veh.inlineObjText) {
      return parseOBJStringToGroup(veh.inlineObjText, veh, skin, customScale);
    }
    if (veh.prebakedKey === 'MOTO_3D_DATA' || veh.type === 'bike') {
      return buildPrebakedMotoMesh(veh, skin, customScale);
    }
    return buildPrebakedAgeraMesh(veh, skin, customScale);
  }

  function build3DTurntablePlatform() {
    const THREE = window.THREE;
    const grp = new THREE.Group();

    const baseDeck = new THREE.Mesh(
      new THREE.CylinderGeometry(2.55, 2.75, 0.24, 48),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.78, roughness: 0.24 })
    );
    baseDeck.position.y = -0.5;
    grp.add(baseDeck);

    const neonRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.42, 0.055, 16, 64),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    neonRing.rotation.x = Math.PI / 2;
    neonRing.position.y = -0.38;
    grp.add(neonRing);

    const innerPad = new THREE.Mesh(
      new THREE.CylinderGeometry(2.15, 2.15, 0.06, 48),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.3 })
    );
    innerPad.position.y = -0.39;
    grp.add(innerPad);

    return grp;
  }

  function rebuildTurntableVehicle() {
    if (!scene || !window.THREE) return;
    if (carGroup) {
      scene.remove(carGroup);
      carGroup = null;
    }
    if (window.HillGame && window.HillGame._customCarModel) {
      carGroup = window.HillGame._customCarModel.clone();
      carGroup.scale.setScalar(1.35);
      carGroup.position.y = -0.36;
    } else {
      const veh = getVehicle();
      const skin = getSkin();
      carGroup = buildAnyVehicle3D(veh, skin);
    }
    carGroup.rotation.y = currentRotationY;
    scene.add(carGroup);
  }

  function syncTurntableCameraSize() {
    const stage = document.getElementById('turntableStage');
    if (!stage || !renderer || !camera) return;
    const sr = getStageRect();
    const w = Math.max(300, Math.floor(sr.width * 0.58));
    const h = Math.max(200, Math.floor(sr.height * 0.67));
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

    camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 100);
    camera.position.set(0, 1.35, 6.45);
    camera.lookAt(0, -0.1, 0);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    syncTurntableCameraSize();

    scene.add(new THREE.HemisphereLight(0xdbeafe, 0x0284c7, 1.45));
    const sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(5, 9, 6);
    scene.add(sun);
    const rimLeft = new THREE.DirectionalLight(0x38bdf8, 1.35);
    rimLeft.position.set(-6, 3, -4);
    scene.add(rimLeft);

    platformGroup = build3DTurntablePlatform();
    scene.add(platformGroup);

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
      const delta = cur - dragStartCoord;
      dragStartCoord = cur;
      targetRotationY += delta * 0.014;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => {
      stage.addEventListener(ev, () => { isDraggingTurntable = false; });
    });

    $('#rotLeftBtn')?.addEventListener('click', () => { targetRotationY -= 0.55; });
    $('#rotRightBtn')?.addEventListener('click', () => { targetRotationY += 0.55; });
    $('#rotAutoBtn')?.addEventListener('click', e => {
      autoSpin = !autoSpin;
      e.currentTarget.textContent = autoSpin ? '⏸ AUTO: ON' : '🔄 AUTO: OFF';
    });

    window.addEventListener('resize', syncTurntableCameraSize);

    function animateTurntable() {
      requestAnimationFrame(animateTurntable);
      if (!$('#menu') || $('#menu').classList.contains('hidden')) return;
      if (autoSpin && !isDraggingTurntable) {
        targetRotationY += 0.008;
      }
      currentRotationY += (targetRotationY - currentRotationY) * 0.15;
      if (carGroup) carGroup.rotation.y = currentRotationY;
      if (platformGroup) platformGroup.rotation.y = currentRotationY * 0.5;
      wheelMeshes.forEach(w => { w.rotation.x += 0.015; });
      renderer.render(scene, camera);
    }
    animateTurntable();
  }

  // MODAL PANELS
  function openModalPanel(panelName, initialTab) {
    const modal = $('#modal');
    const titleEl = $('#title');
    const contentEl = $('#content');
    if (!modal || !titleEl || !contentEl) return;

    modal.classList.remove('hidden');

    if (panelName === 'account') {
      titleEl.textContent = '☁️ ACCOUNT & FIREBASE CLOUD SYNC';
      const isLogged = Boolean(currentUser && currentUser.uid);
      contentEl.innerHTML = `
        <div style="margin-bottom:12px;padding:10px;border-radius:10px;background:rgba(14,116,144,0.22);border:1px solid #38bdf8;">
          <strong>Current Mode: ${isLogged ? '☁️ Logged In (' + (currentUser.name || currentUser.email) + ')' : '💾 Guest Account (LocalStorage)'}</strong>
          <small style="display:block;margin-top:4px;color:#bae6fd;">
            • Logged-in accounts store Coins, Diamonds, Owned 3D Cars &amp; 3D Bikes, Maps, Skins &amp; Upgrades in Firebase (<b>${FIREBASE_PROJECT_ID}</b>).<br>
            • Guest Accounts store all progress in your device's <b>localStorage</b>.
          </small>
        </div>
        <div class="tab-bar">
          <button type="button" class="tab-pill active" id="tabCreateAcc">✨ Create Account</button>
          <button type="button" class="tab-pill" id="tabLoginAcc">🔑 Login Existing</button>
          <button type="button" class="tab-pill" id="tabGuestAcc">💾 Guest Mode (LocalStorage)</button>
        </div>
        <div id="authFormContainer" class="auth-form">
          <input id="authName" class="auth-input" placeholder="Player Display Name" value="${currentUser?.name || ''}">
          <input id="authEmail" type="email" class="auth-input" placeholder="Email Address" value="${currentUser?.email || ''}">
          <input id="authPass" type="password" class="auth-input" placeholder="Password (4+ characters)">
          <button type="button" class="card-action-btn buy" id="submitAuthBtn" style="padding:11px;font-size:13px;">☁️ CREATE ACCOUNT &amp; SYNC TO FIREBASE</button>
        </div>
      `;

      let mode = 'create';
      const updateAuthFormUI = () => {
        $('#tabCreateAcc').classList.toggle('active', mode === 'create');
        $('#tabLoginAcc').classList.toggle('active', mode === 'login');
        $('#tabGuestAcc').classList.toggle('active', mode === 'guest');
        $('#authName').classList.toggle('hidden', mode !== 'create');
        $('#authEmail').classList.toggle('hidden', mode === 'guest');
        $('#authPass').classList.toggle('hidden', mode === 'guest');
        $('#submitAuthBtn').textContent = mode === 'guest'
          ? '💾 USE GUEST ACCOUNT (LOCALSTORAGE)'
          : mode === 'create'
          ? '☁️ CREATE ACCOUNT & SAVE TO FIREBASE'
          : '🔑 LOGIN & LOAD FROM FIREBASE';
      };

      $('#tabCreateAcc').onclick = () => { mode = 'create'; updateAuthFormUI(); };
      $('#tabLoginAcc').onclick = () => { mode = 'login'; updateAuthFormUI(); };
      $('#tabGuestAcc').onclick = () => { mode = 'guest'; updateAuthFormUI(); };

      $('#submitAuthBtn').onclick = async () => {
        if (mode === 'guest') {
          currentUser = null;
          safeSetLS('sthw_fb_user', 'null');
          await savePlayerState();
          showToast('Switched to Guest Account (LocalStorage)');
          modal.classList.add('hidden');
          return;
        }
        const email = ($('#authEmail').value || '').trim().toLowerCase();
        const pass = ($('#authPass').value || '').trim();
        const name = ($('#authName').value || '').trim() || email.split('@')[0] || 'ST Racer';
        if (!email || !email.includes('@') || pass.length < 4) {
          showToast('Please enter a valid email and password (4+ chars).');
          return;
        }
        const uid = 'user_' + btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
        const passHash = btoa(unescape(encodeURIComponent(pass)));

        try {
          const checkRes = await fetch(`https://friendsgame-872f5-default-rtdb.firebaseio.com/st_hill_climb_v2/users/${encodeURIComponent(uid)}.json`, { cache: 'no-store' });
          const existing = checkRes.ok ? await checkRes.json() : null;

          if (mode === 'login') {
            if (!existing) {
              showToast('Account not found in Firebase. Use Create Account first!');
              return;
            }
            if (existing.passHash && existing.passHash !== passHash) {
              showToast('Incorrect password.');
              return;
            }
            currentUser = { uid, name: existing.name || name, email };
            safeSetLS('sthw_fb_user', JSON.stringify(currentUser));
            await pullFirebaseUserState(uid);
            showToast(`Welcome back, ${currentUser.name}! Synced from Firebase.`);
            modal.classList.add('hidden');
          } else {
            currentUser = { uid, name, email };
            safeSetLS('sthw_fb_user', JSON.stringify(currentUser));
            await fetch(`https://friendsgame-872f5-default-rtdb.firebaseio.com/st_hill_climb_v2/users/${encodeURIComponent(uid)}/passHash.json`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(passHash)
            });
            await savePlayerState();
            showToast(`Account created for ${name}! Data saved to Firebase.`);
            modal.classList.add('hidden');
          }
        } catch (err) {
          currentUser = { uid, name, email };
          safeSetLS('sthw_fb_user', JSON.stringify(currentUser));
          await savePlayerState();
          showToast(`Account linked for ${name}!`);
          modal.classList.add('hidden');
        }
      };
      return;
    }

    if (panelName === 'store') {
      const tab = initialTab || 'all_veh';
      titleEl.textContent = '🛒 ST GAMES STORE — REAL 3D CARS, 3D BIKES, MAPS & SKINS';
      const renderStoreTab = (activeTab) => {
        let itemsHtml = '';
        if (activeTab === 'all_veh' || activeTab === 'cars' || activeTab === 'bikes') {
          const list = (window.VEHICLES || []).filter(v =>
            activeTab === 'all_veh' ? true : activeTab === 'bikes' ? v.type === 'bike' : v.type !== 'bike'
          );
          itemsHtml = list.map(v => {
            const isOwned = owned.includes(v.id);
            const isSelected = selected === v.id;
            return `
              <div class="item-card ${isSelected ? 'selected' : ''}">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:22px;">${v.emoji || (v.type === 'bike' ? '🏍️' : '🏎️')}</span>
                    <span class="car-badge-pill">${v.badge || (v.type === 'bike' ? '3D BIKE' : '3D CAR')}</span>
                  </div>
                  <strong style="margin-top:4px;">${v.name}</strong>
                  <small>SPD ${v.speed} • ACC ${v.acc} • HND ${v.handling}</small>
                </div>
                <button type="button" class="card-action-btn ${isSelected ? 'equipped' : isOwned ? '' : 'buy'}" data-store-car="${v.id}">
                  ${isSelected ? '✓ ON TURNTABLE' : isOwned ? 'SELECT IN GARAGE' : '🪙 BUY ' + v.price.toLocaleString('en-IN')}
                </button>
              </div>
            `;
          }).join('');
        } else if (activeTab === 'maps') {
          itemsHtml = (window.MAPS || []).map(m => {
            const isSelected = mapName === m.name;
            return `
              <div class="item-card ${isSelected ? 'selected' : ''}">
                <div>
                  <div style="height:42px;border-radius:8px;background:linear-gradient(180deg,${m.sky},${m.skyBottom || m.ground});display:flex;align-items:center;padding:0 10px;font-size:20px;">
                    ${m.icon || '🌅'}
                  </div>
                  <strong style="margin-top:4px;">${m.name}</strong>
                  <small>${m.desc || '3D Highway Stage'}</small>
                </div>
                <button type="button" class="card-action-btn ${isSelected ? 'equipped' : m.unlocked ? '' : 'buy'}" data-store-map="${m.name}">
                  ${isSelected ? '✓ ACTIVE HIGHWAY' : m.unlocked ? 'SELECT HIGHWAY' : '🪙 UNLOCK ' + m.price.toLocaleString('en-IN')}
                </button>
              </div>
            `;
          }).join('');
        } else if (activeTab === 'skins') {
          itemsHtml = (window.VEHICLE_SKINS || []).map(s => {
            const isOwned = ownedSkins.includes(s.id) || s.price === 0;
            const isSelected = selectedSkin === s.id;
            return `
              <div class="item-card ${isSelected ? 'selected' : ''}">
                <div>
                  <div style="height:38px;border-radius:8px;background:linear-gradient(135deg,${s.primary},${s.secondary});border:1px solid rgba(255,255,255,0.35);"></div>
                  <strong style="margin-top:4px;">🎨 ${s.name}</strong>
                  <small>Finish: ${(s.finish || 'metallic').toUpperCase()}</small>
                </div>
                <button type="button" class="card-action-btn ${isSelected ? 'equipped' : isOwned ? '' : 'buy'}" data-store-skin="${s.id}">
                  ${isSelected ? '✓ ACTIVE PAINT' : isOwned ? 'APPLY SKIN' : '🪙 BUY ' + s.price.toLocaleString('en-IN')}
                </button>
              </div>
            `;
          }).join('');
        }

        const carCount = (window.VEHICLES || []).filter(v => v.type !== 'bike').length;
        const bikeCount = (window.VEHICLES || []).filter(v => v.type === 'bike').length;

        contentEl.innerHTML = `
          <div class="tab-bar">
            <button type="button" class="tab-pill ${activeTab === 'all_veh' ? 'active' : ''}" data-st-tab="all_veh">🚘 All (${(window.VEHICLES || []).length})</button>
            <button type="button" class="tab-pill ${activeTab === 'cars' ? 'active' : ''}" data-st-tab="cars">🏎️ 3D Cars (${carCount})</button>
            <button type="button" class="tab-pill ${activeTab === 'bikes' ? 'active' : ''}" data-st-tab="bikes">🏍️ 3D Bikes (${bikeCount})</button>
            <button type="button" class="tab-pill ${activeTab === 'maps' ? 'active' : ''}" data-st-tab="maps">🗺️ Highways (${(window.MAPS || []).length})</button>
            <button type="button" class="tab-pill ${activeTab === 'skins' ? 'active' : ''}" data-st-tab="skins">🎨 Skins (${(window.VEHICLE_SKINS || []).length})</button>
          </div>
          <div class="grid-cards">${itemsHtml}</div>
        `;

        contentEl.querySelectorAll('[data-st-tab]').forEach(b => {
          b.onclick = () => renderStoreTab(b.dataset.stTab);
        });
        contentEl.querySelectorAll('[data-store-car]').forEach(b => {
          b.onclick = () => {
            const v = (window.VEHICLES || []).find(x => x.id === b.dataset.storeCar);
            if (!v) return;
            if (owned.includes(v.id)) {
              selected = v.id;
              if (window.HillGame) window.HillGame._customCarModel = null;
              savePlayerState();
              rebuildTurntableVehicle();
              renderStoreTab(activeTab);
              showToast(`${v.name} placed on 3D turntable!`);
            } else if (coins >= v.price) {
              coins -= v.price;
              owned.push(v.id);
              selected = v.id;
              if (window.HillGame) window.HillGame._customCarModel = null;
              savePlayerState();
              rebuildTurntableVehicle();
              renderStoreTab(activeTab);
              showToast(`Unlocked ${v.name}!`);
            } else {
              showToast(`Need ${(v.price - coins).toLocaleString('en-IN')} more coins!`);
            }
          };
        });
        contentEl.querySelectorAll('[data-store-map]').forEach(b => {
          b.onclick = () => {
            const m = (window.MAPS || []).find(x => x.name === b.dataset.storeMap);
            if (!m) return;
            if (m.unlocked) {
              mapName = m.name;
              savePlayerState();
              renderStoreTab('maps');
              showToast(`Highway set to ${m.name}!`);
            } else if (coins >= m.price) {
              coins -= m.price;
              m.unlocked = true;
              mapName = m.name;
              savePlayerState();
              renderStoreTab('maps');
              showToast(`Unlocked & selected ${m.name}!`);
            } else {
              showToast(`Need ${(m.price - coins).toLocaleString('en-IN')} more coins!`);
            }
          };
        });
        contentEl.querySelectorAll('[data-store-skin]').forEach(b => {
          b.onclick = () => {
            const s = (window.VEHICLE_SKINS || []).find(x => x.id === b.dataset.storeSkin);
            if (!s) return;
            if (ownedSkins.includes(s.id) || s.price === 0) {
              if (!ownedSkins.includes(s.id)) ownedSkins.push(s.id);
              selectedSkin = s.id;
              savePlayerState();
              rebuildTurntableVehicle();
              renderStoreTab('skins');
              showToast(`Applied ${s.name} wrap!`);
            } else if (coins >= s.price) {
              coins -= s.price;
              ownedSkins.push(s.id);
              selectedSkin = s.id;
              savePlayerState();
              rebuildTurntableVehicle();
              renderStoreTab('skins');
              showToast(`Purchased & applied ${s.name}!`);
            } else {
              showToast(`Need ${(s.price - coins).toLocaleString('en-IN')} more coins!`);
            }
          };
        });
      };
      renderStoreTab(tab);
      return;
    }

    if (panelName === 'library') {
      titleEl.textContent = '🚘 MY LIBRARY — BOUGHT 3D CARS, 3D BIKES, MAPS & SKINS';
      const renderLibTab = (activeTab) => {
        let html = '';
        if (activeTab === 'cars' || activeTab === 'bikes') {
          const myVehs = (window.VEHICLES || []).filter(v => owned.includes(v.id) && (activeTab === 'bikes' ? v.type === 'bike' : v.type !== 'bike'));
          html = myVehs.map(v => `
            <div class="item-card ${selected === v.id ? 'selected' : ''}">
              <div>
                <span style="font-size:22px;">${v.emoji || (v.type === 'bike' ? '🏍️' : '🏎️')}</span>
                <strong>${v.name}</strong>
                <small>SPD ${v.speed} • ACC ${v.acc} • HND ${v.handling}</small>
              </div>
              <button type="button" class="card-action-btn ${selected === v.id ? 'equipped' : ''}" data-lib-car="${v.id}">
                ${selected === v.id ? '✓ ON TURNTABLE' : 'EQUIP ON RAMP'}
              </button>
            </div>
          `).join('');
        } else if (activeTab === 'maps') {
          const myMaps = (window.MAPS || []).filter(m => m.unlocked);
          html = myMaps.map(m => `
            <div class="item-card ${mapName === m.name ? 'selected' : ''}">
              <div>
                <span style="font-size:22px;">${m.icon || '🌅'}</span>
                <strong>${m.name}</strong>
                <small>${m.desc || 'Unlocked Highway'}</small>
              </div>
              <button type="button" class="card-action-btn ${mapName === m.name ? 'equipped' : ''}" data-lib-map="${m.name}">
                ${mapName === m.name ? '✓ SELECTED IN RED BOX' : 'SELECT MAP'}
              </button>
            </div>
          `).join('');
        } else {
          const mySkins = (window.VEHICLE_SKINS || []).filter(s => ownedSkins.includes(s.id) || s.price === 0);
          html = mySkins.map(s => `
            <div class="item-card ${selectedSkin === s.id ? 'selected' : ''}">
              <div>
                <div style="height:34px;border-radius:8px;background:linear-gradient(135deg,${s.primary},${s.secondary});"></div>
                <strong style="margin-top:4px;">${s.name}</strong>
                <small>${(s.finish || 'metallic').toUpperCase()}</small>
              </div>
              <button type="button" class="card-action-btn ${selectedSkin === s.id ? 'equipped' : ''}" data-lib-skin="${s.id}">
                ${selectedSkin === s.id ? '✓ EQUIPPED' : 'EQUIP SKIN'}
              </button>
            </div>
          `).join('');
        }

        const myCarCount = (window.VEHICLES || []).filter(v => owned.includes(v.id) && v.type !== 'bike').length;
        const myBikeCount = (window.VEHICLES || []).filter(v => owned.includes(v.id) && v.type === 'bike').length;

        contentEl.innerHTML = `
          <div class="tab-bar">
            <button type="button" class="tab-pill ${activeTab === 'cars' ? 'active' : ''}" data-lib-tab="cars">🏎️ Bought Cars (${myCarCount})</button>
            <button type="button" class="tab-pill ${activeTab === 'bikes' ? 'active' : ''}" data-lib-tab="bikes">🏍️ Bought Bikes (${myBikeCount})</button>
            <button type="button" class="tab-pill ${activeTab === 'maps' ? 'active' : ''}" data-lib-tab="maps">🗺️ Bought Maps (${(window.MAPS || []).filter(m => m.unlocked).length})</button>
            <button type="button" class="tab-pill ${activeTab === 'skins' ? 'active' : ''}" data-lib-tab="skins">🎨 Bought Skins (${(window.VEHICLE_SKINS || []).filter(s => ownedSkins.includes(s.id) || s.price === 0).length})</button>
          </div>
          <div class="grid-cards">${html}</div>
        `;
        contentEl.querySelectorAll('[data-lib-tab]').forEach(b => {
          b.onclick = () => renderLibTab(b.dataset.libTab);
        });
        contentEl.querySelectorAll('[data-lib-car]').forEach(b => {
          b.onclick = () => {
            selected = b.dataset.libCar;
            if (window.HillGame) window.HillGame._customCarModel = null;
            savePlayerState();
            rebuildTurntableVehicle();
            renderLibTab(activeTab);
            showToast(`Equipped ${getVehicle().name}`);
          };
        });
        contentEl.querySelectorAll('[data-lib-map]').forEach(b => {
          b.onclick = () => {
            mapName = b.dataset.libMap;
            savePlayerState();
            renderLibTab('maps');
            showToast(`Selected ${mapName}`);
          };
        });
        contentEl.querySelectorAll('[data-lib-skin]').forEach(b => {
          b.onclick = () => {
            selectedSkin = b.dataset.libSkin;
            savePlayerState();
            rebuildTurntableVehicle();
            renderLibTab('skins');
            showToast(`Equipped skin!`);
          };
        });
      };
      renderLibTab(initialTab || 'cars');
      return;
    }

    if (panelName === 'maps') {
      titleEl.textContent = '🗺️ SELECT HIGHWAY MAP';
      contentEl.innerHTML = `<div class="grid-cards">${(window.MAPS || []).map(m => `
        <div class="item-card ${mapName === m.name ? 'selected' : ''}">
          <div>
            <div style="height:44px;border-radius:9px;background:linear-gradient(180deg,${m.sky},${m.skyBottom || m.ground});display:flex;align-items:center;justify-content:space-between;padding:0 10px;">
              <span style="font-size:22px;">${m.icon || '🌅'}</span>
              <span style="font-size:9.5px;font-weight:900;background:rgba(0,0,0,0.55);padding:2px 6px;border-radius:5px;">${m.unlocked ? 'UNLOCKED' : '🪙 ' + m.price.toLocaleString('en-IN')}</span>
            </div>
            <strong style="margin-top:4px;">${m.name}</strong>
            <small>${m.desc || '3D Highway Stage'}</small>
          </div>
          <button type="button" class="card-action-btn ${mapName === m.name ? 'equipped' : m.unlocked ? '' : 'buy'}" data-pick-map="${m.name}">
            ${mapName === m.name ? '✓ DISPLAYED ON START BOX' : m.unlocked ? 'SELECT THIS HIGHWAY' : '🪙 BUY & SELECT (' + m.price.toLocaleString('en-IN') + ')'}
          </button>
        </div>
      `).join('')}</div>`;

      contentEl.querySelectorAll('[data-pick-map]').forEach(b => {
        b.onclick = () => {
          const m = (window.MAPS || []).find(x => x.name === b.dataset.pickMap);
          if (!m) return;
          if (m.unlocked) {
            mapName = m.name;
            savePlayerState();
            modal.classList.add('hidden');
            showToast(`${m.name} loaded into Start Box!`);
          } else if (coins >= m.price) {
            coins -= m.price;
            m.unlocked = true;
            mapName = m.name;
            savePlayerState();
            modal.classList.add('hidden');
            showToast(`Unlocked & selected ${m.name}!`);
          } else {
            showToast(`Not enough coins to unlock ${m.name}.`);
          }
        };
      });
      return;
    }

    if (panelName === 'upgrades') {
      const v = getVehicle();
      titleEl.textContent = `🔧 HIGHWAY PERFORMANCE TUNING — ${v.name.toUpperCase()}`;
      const parts = [
        { key: 'Engine', icon: '⚡', desc: 'Increases top highway KMH speed & horsepower' },
        { key: 'Suspension', icon: '🛞', desc: 'Sharpens high-speed lane-change stability' },
        { key: 'Tires', icon: '🔥', desc: 'Boosts launch acceleration & braking grip' },
        { key: 'Fuel', icon: '⛽', desc: 'High-flow fuel injection & overtake multiplier' },
        { key: 'Nitro', icon: '🚀', desc: 'Twin-turbo boost thrust for rapid overtakes' }
      ];
      contentEl.innerHTML = `<div class="grid-cards">${parts.map(p => {
        const lev = upgrade[v.id + p.key] || 0;
        const cost = 1000 * (lev + 1);
        return `
          <div class="item-card">
            <div>
              <strong>${p.icon} ${p.key} — LEVEL ${lev} / 10</strong>
              <small>${p.desc}</small>
            </div>
            <button type="button" class="card-action-btn buy" data-up-part="${p.key}">
              ${lev >= 10 ? '✓ MAX LEVEL' : '🪙 UPGRADE (' + cost.toLocaleString('en-IN') + ')'}
            </button>
          </div>
        `;
      }).join('')}</div>`;

      contentEl.querySelectorAll('[data-up-part]').forEach(b => {
        b.onclick = () => {
          const part = b.dataset.upPart;
          const k = v.id + part;
          const lev = upgrade[k] || 0;
          if (lev >= 10) {
            showToast(`${part} is already at MAX level!`);
            return;
          }
          const cost = 1000 * (lev + 1);
          if (coins >= cost) {
            coins -= cost;
            upgrade[k] = lev + 1;
            savePlayerState();
            openModalPanel('upgrades');
            showToast(`${v.name} ${part} upgraded to LV ${lev + 1}!`);
          } else {
            showToast('Not enough coins for upgrade!');
          }
        };
      });
      return;
    }

    if (panelName === 'events') {
      titleEl.textContent = '🎉 LIVE HIGHWAY EVENTS';
      const evs = liveConfig.events || [];
      contentEl.innerHTML = `<div class="grid-cards">${evs.map(ev => `
        <div class="item-card">
          <div>
            <span class="car-badge-pill">${ev.badge || 'LIVE EVENT'}</span>
            <strong style="margin-top:4px;">${ev.title}</strong>
            <small>${ev.desc}</small>
            <small style="color:#fde047;margin-top:4px;">Highway: ${ev.map} • Bonus: 🪙 ${Number(ev.rewardCoins || 2500).toLocaleString('en-IN')}</small>
          </div>
          <button type="button" class="card-action-btn buy" data-launch-event="${ev.id}">
            ▶ PLAY EVENT NOW
          </button>
        </div>
      `).join('')}</div>`;

      contentEl.querySelectorAll('[data-launch-event]').forEach(b => {
        b.onclick = () => {
          const ev = evs.find(x => x.id === b.dataset.launchEvent);
          if (ev) {
            if (ev.map && (window.MAPS || []).some(m => m.name === ev.map)) mapName = ev.map;
            if (ev.vehicle && owned.includes(ev.vehicle)) selected = ev.vehicle;
            savePlayerState();
            modal.classList.add('hidden');
            launchRaceNow();
          }
        };
      });
      return;
    }

    if (panelName === 'notifications') {
      titleEl.textContent = '🔔 NOTIFICATIONS & INBOX REWARDS';
      const notifs = liveConfig.notifications || [];
      contentEl.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;">${notifs.map(n => {
        const claimed = claimedNotifs.includes(n.id);
        return `
          <div class="item-card" style="flex-direction:row;align-items:center;justify-content:space-between;">
            <div style="max-width:68%;">
              <strong>${n.title}</strong>
              <small>${n.body}</small>
            </div>
            <button type="button" class="card-action-btn ${claimed ? 'equipped' : 'buy'}" style="width:auto;min-width:120px;" data-claim-notif="${n.id}">
              ${claimed ? '✓ CLAIMED' : '🎁 +' + (n.rewardCoins || 1000) + ' COINS'}
            </button>
          </div>
        `;
      }).join('')}</div>`;

      contentEl.querySelectorAll('[data-claim-notif]').forEach(b => {
        b.onclick = () => {
          const n = notifs.find(x => x.id === b.dataset.claimNotif);
          if (!n || claimedNotifs.includes(n.id)) return;
          claimedNotifs.push(n.id);
          coins += (n.rewardCoins || 1000);
          savePlayerState();
          openModalPanel('notifications');
          showToast(`Claimed +${(n.rewardCoins || 1000).toLocaleString('en-IN')} Coins!`);
        };
      });
      return;
    }

    if (panelName === 'achievements') {
      titleEl.textContent = '🏆 HIGHWAY RACER ACHIEVEMENTS';
      const bestScore = +(safeGetLS('sthwBest', '0'));
      const achievs = [
        { id: 'ach_hyper', title: '🏎️🏍️ 3D Car & Bike Owner', desc: 'Own both Koenigsegg Agera 3D and Street Moto 1000R 3D', done: owned.includes('agera') && owned.includes('moto_1000r'), reward: 3000 },
        { id: 'ach_score50', title: '🛣️ Highway Overtaker', desc: 'Reach a Score of 50+ by overtaking traffic cars', done: bestScore >= 50, reward: 2500 },
        { id: 'ach_score200', title: '⚡ Speed Demon 200', desc: 'Reach a Score of 200+ (Best: ' + bestScore + ')', done: bestScore >= 200, reward: 8000 },
        { id: 'ach_fleet', title: '🚘 Garage Collector', desc: 'Own 4 or more 3D Cars & Bikes in your library', done: owned.length >= 4, reward: 5000 },
        { id: 'ach_cloud', title: '☁️ Cloud Connected', desc: 'Create or link your Firebase account', done: Boolean(currentUser && currentUser.uid), reward: 5000 }
      ];
      contentEl.innerHTML = `<div class="grid-cards">${achievs.map(a => {
        const claimed = claimedAchievs.includes(a.id);
        return `
          <div class="item-card ${a.done ? 'selected' : ''}">
            <div>
              <strong>${a.title}</strong>
              <small>${a.desc}</small>
            </div>
            <button type="button" class="card-action-btn ${claimed ? 'equipped' : a.done ? 'buy' : ''}" data-claim-ach="${a.id}">
              ${claimed ? '✓ REWARD CLAIMED' : a.done ? '🎁 CLAIM +' + a.reward.toLocaleString('en-IN') : '🔒 IN PROGRESS'}
            </button>
          </div>
        `;
      }).join('')}</div>`;

      contentEl.querySelectorAll('[data-claim-ach]').forEach(b => {
        b.onclick = () => {
          const a = achievs.find(x => x.id === b.dataset.claimAch);
          if (!a || claimedAchievs.includes(a.id)) return;
          if (!a.done) {
            showToast('Complete this achievement task first!');
            return;
          }
          claimedAchievs.push(a.id);
          coins += a.reward;
          savePlayerState();
          openModalPanel('achievements');
          showToast(`Achievement unlocked! +${a.reward.toLocaleString('en-IN')} Coins!`);
        };
      });
      return;
    }

    if (panelName === 'rewards') {
      titleEl.textContent = '🎁 DAILY LOGIN REWARD';
      const today = new Date().toDateString();
      const claimedToday = safeGetLS('sthwReward', '') === today;
      contentEl.innerHTML = `
        <div class="item-card" style="text-align:center;padding:20px;">
          <strong style="font-size:18px;">🎁 Daily Highway Supply Crate</strong>
          <small style="margin:6px 0 14px;">Claim +2,500 Coins &amp; +50 Diamonds every day!</small>
          <button type="button" class="card-action-btn ${claimedToday ? 'equipped' : 'buy'}" id="claimDailyBtn">
            ${claimedToday ? '✓ ALREADY CLAIMED TODAY' : '🪙 CLAIM +2,500 COINS & +50 💎'}
          </button>
        </div>
      `;
      $('#claimDailyBtn').onclick = () => {
        if (safeGetLS('sthwReward', '') === today) {
          showToast('Daily reward already claimed today!');
          return;
        }
        coins += 2500;
        gems += 50;
        safeSetLS('sthwReward', today);
        savePlayerState();
        openModalPanel('rewards');
        showToast('Claimed +2,500 Coins & +50 Diamonds!');
      };
      return;
    }

    if (panelName === 'settings') {
      titleEl.textContent = '⚙️ 16:9 FULLSCREEN & GAME SETTINGS';
      contentEl.innerHTML = `
        <div class="grid-cards">
          <button type="button" class="item-card" id="fullscreenBtn">
            <strong>⛶ Lock 16:9 Fullscreen Landscape</strong>
            <small>Expand to full screen &amp; lock landscape rotation</small>
          </button>
          <button type="button" class="item-card" id="resetCamBtn">
            <strong>🔄 Reset 3D Turntable Angle</strong>
            <small>Center the 3D vehicle on the ramp</small>
          </button>
        </div>
      `;
      $('#fullscreenBtn').onclick = () => {
        request16x9Fullscreen();
        modal.classList.add('hidden');
      };
      $('#resetCamBtn').onclick = () => {
        targetRotationY = 0.62;
        modal.classList.add('hidden');
        showToast('Turntable camera reset!');
      };
    }
  }

  function launchRaceNow() {
    request16x9Fullscreen();
    if (!window.HillGame) return;
    $('#menu').classList.add('hidden');
    $('#game').classList.remove('hidden');
    const v = getVehicle();
    const s = getSkin();
    const m = getMap();
    window.HillGame.start(v, m, s, upgrade);
  }

  $('#directCarUpload')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file || !window.HillGame?.loadCustomCarFile) return;
    showToast(`Loading 3D model: ${file.name}...`);
    window.HillGame.loadCustomCarFile(file, () => {
      const cleanName = file.name.replace(/\.[^.]+$/, '').toUpperCase();
      if ($('#activeCarName')) $('#activeCarName').textContent = cleanName;
      if ($('#activeCarBadge')) $('#activeCarBadge').textContent = 'CUSTOM 3D FILE';
      rebuildTurntableVehicle();
      showToast(`Loaded ${cleanName} onto 3D Turntable & Highway!`);
    });
  });

  $('#btnFullscreenTop')?.addEventListener('click', request16x9Fullscreen);
  $('#btnAccount')?.addEventListener('click', () => openModalPanel('account'));
  $('#btnStore')?.addEventListener('click', () => openModalPanel('store', 'all_veh'));
  $('#btnSkinsStore')?.addEventListener('click', () => openModalPanel('store', 'skins'));
  $('#btnUpgrades')?.addEventListener('click', () => openModalPanel('upgrades'));
  $('#btnEvents')?.addEventListener('click', () => openModalPanel('events'));
  $('#btnLibrary')?.addEventListener('click', () => openModalPanel('library', 'cars'));
  $('#btnNotifications')?.addEventListener('click', () => openModalPanel('notifications'));
  $('#btnAchievements')?.addEventListener('click', () => openModalPanel('achievements'));
  $('#btnDailyReward')?.addEventListener('click', () => openModalPanel('rewards'));
  $('#btnSettings')?.addEventListener('click', () => openModalPanel('settings'));

  $('#mapSelectBox')?.addEventListener('click', () => openModalPanel('maps'));
  $('#play')?.addEventListener('click', launchRaceNow);

  $('#close')?.addEventListener('click', () => $('#modal').classList.add('hidden'));
  $('#modal')?.addEventListener('click', e => {
    if (e.target === $('#modal')) $('#modal').classList.add('hidden');
  });

  window.GameUI = {
    start() {
      $('#end')?.classList.add('hidden');
      $('#crashOverlay')?.classList.add('hidden');
      $('#pauseOverlay')?.classList.add('hidden');
      launchRaceNow();
    },
    addCoins(n) {
      coins += n;
      savePlayerState();
    },
    addGems(n) {
      gems += n;
      savePlayerState();
    },
    onRunEnded(scoreVal) {
      const prevBest = +(safeGetLS('sthwBest', '0'));
      if (scoreVal > prevBest) safeSetLS('sthwBest', String(scoreVal));
      savePlayerState();
    },
    buildThreeCarMesh(veh, skin, customScale) {
      return buildAnyVehicle3D(veh || getVehicle(), skin || getSkin(), customScale);
    },
    coin(freq) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const a = window._stCoinCtx || (window._stCoinCtx = new Ctx());
        const o = a.createOscillator();
        const g = a.createGain();
        o.frequency.value = freq || 960;
        g.gain.value = 0.045;
        o.connect(g);
        g.connect(a.destination);
        o.start();
        o.stop(a.currentTime + 0.075);
      } catch (e) {}
    }
  };

  function checkManualAdminRoute() {
    if (location.hash === '#admin' || location.search.includes('admin=1')) {
      location.href = 'admin.html';
    }
  }
  window.addEventListener('hashchange', checkManualAdminRoute);

  window.addEventListener('DOMContentLoaded', () => {
    (window.MAPS || []).forEach(m => {
      if (savedMaps.includes(m.name) || m.price === 0) m.unlocked = true;
    });
    updateLobbyHUD();
    initTurntable3D();
    loadExternalConfigs();
    if (currentUser && currentUser.uid) {
      pullFirebaseUserState(currentUser.uid);
    }
    checkManualAdminRoute();
  });
})();
