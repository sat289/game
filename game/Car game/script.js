// Main Game Controller: Reliable 5s Auto-Loading + Always-ON Audio + Cinematic Garage Entrance + LocalStorage
(function () {
  const STORAGE_KEY = 'apex_nitro_3d_save_v1';

  const defaultSave = {
    coins: 25000,
    ownedIds: [0],
    equippedId: 0,
    dailyClaimedDate: null,
    upgradeLevels: { engine: 1, nitro: 1, tires: 1 },
    customPaintHex: null,
    customHueOffset: 0,
    taskIndex: 0,
    level: 1,
    xp: 0
  };

  function loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultSave, ownedIds: new Set(defaultSave.ownedIds) };
      const parsed = JSON.parse(raw);
      return {
        coins: typeof parsed.coins === 'number' ? parsed.coins : 25000,
        ownedIds: new Set((Array.isArray(parsed.ownedIds) ? parsed.ownedIds : [0]).filter((id) => id >= 0 && id < 15).concat([0])),
        equippedId: (typeof parsed.equippedId === 'number' && parsed.equippedId >= 0 && parsed.equippedId < 15) ? parsed.equippedId : 0,
        dailyClaimedDate: parsed.dailyClaimedDate || null,
        upgradeLevels: parsed.upgradeLevels || { engine: 1, nitro: 1, tires: 1 },
        customPaintHex: parsed.customPaintHex !== undefined ? parsed.customPaintHex : null,
        customHueOffset: typeof parsed.customHueOffset === 'number' ? parsed.customHueOffset : 0,
        taskIndex: typeof parsed.taskIndex === 'number' ? parsed.taskIndex : 0,
        level: typeof parsed.level === 'number' ? parsed.level : 1,
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0
      };
    } catch (e) {
      return { ...defaultSave, ownedIds: new Set(defaultSave.ownedIds) };
    }
  }

  const state = loadSave();
  let selectedId = state.equippedId;
  let activeCategory = 'ALL';


  function gainXP(amount) {
    state.xp = (state.xp || 0) + amount;
    const needed = (state.level || 1) * 250;
    if (state.xp >= needed) {
      state.xp -= needed;
      state.level = (state.level || 1) + 1;
      if (Audio) Audio.playReadyChime();
      showDriveAlert(`LEVEL UP! LV.${state.level} (+SPEED & NITRO BOOST!)`, 'bg-cyan-400 text-slate-950');
    }
    const lvEl = document.getElementById('playerLevelEl');
    if (lvEl) lvEl.textContent = 'LV ' + (state.level || 1);
    persistSave();
  }

  function persistSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        coins: state.coins,
        ownedIds: Array.from(state.ownedIds),
        equippedId: state.equippedId,
        dailyClaimedDate: state.dailyClaimedDate,
        upgradeLevels: state.upgradeLevels,
        customPaintHex: state.customPaintHex,
        customHueOffset: state.customHueOffset,
        taskIndex: state.taskIndex,
        level: state.level,
        xp: state.xp
      }));
    } catch (e) {}
  }

  const vehicles = window.APEX_VEHICLES || [];
  const Audio = window.ApexAudio;
  const City3D = window.ApexCity3D;

  // Keep Sound Always ON & auto-unlock on first user gesture
  if (Audio) Audio.setEnabled(true);
  const unlockOnce = () => {
    if (Audio) Audio.unlock();
    window.removeEventListener('pointerdown', unlockOnce);
    window.removeEventListener('touchstart', unlockOnce);
    window.removeEventListener('click', unlockOnce);
  };
  window.addEventListener('pointerdown', unlockOnce, { passive: true });
  window.addEventListener('touchstart', unlockOnce, { passive: true });
  window.addEventListener('click', unlockOnce, { passive: true });

  function isStageRotated() {
    return window.innerHeight > window.innerWidth;
  }

  function resizeCanvases() {
    const w = isStageRotated() ? window.innerHeight : window.innerWidth;
    const h = isStageRotated() ? window.innerWidth : window.innerHeight;
    if (renderer && camera) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  }

  const homeScreen = document.getElementById('homeScreen');
  const garageScreen = document.getElementById('garageScreen');
  const playScreen = document.getElementById('playScreen');
  const homePlayBtn = document.getElementById('homePlayBtn');
  const homeGarageBtn = document.getElementById('homeGarageBtn');
  const backToHomeBtn = document.getElementById('backToHomeBtn');
  const homeEquippedName = document.getElementById('homeEquippedName');
  const homeCoinsEl = document.getElementById('homeCoinsEl');
  const homeLevelEl = document.getElementById('homeLevelEl');


  const coinsCountEl = document.getElementById('coinsCountEl');
  const ownedCountEl = document.getElementById('ownedCountEl');
  const vehicleCarousel = document.getElementById('vehicleCarousel');
  const scrollLeftBtn = document.getElementById('scrollLeftBtn');
  const scrollRightBtn = document.getElementById('scrollRightBtn');
  const playRaceBtn = document.getElementById('playRaceBtn');

  const stageCatBadge = document.getElementById('stageCatBadge');
  const stageStatusBadge = document.getElementById('stageStatusBadge');
  const stageVehicleName = document.getElementById('stageVehicleName');
  const stageVehicleImg = document.getElementById('stageVehicleImg');
  const stageActionBtn = document.getElementById('stageActionBtn');
  const statSpeedVal = document.getElementById('statSpeedVal');
  const statSpeedBar = document.getElementById('statSpeedBar');
  const statAccelVal = document.getElementById('statAccelVal');
  const statAccelBar = document.getElementById('statAccelBar');
  const statHandleVal = document.getElementById('statHandleVal');
  const statHandleBar = document.getElementById('statHandleBar');
  const statNitroVal = document.getElementById('statNitroVal');
  const statNitroBar = document.getElementById('statNitroBar');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalBody = document.getElementById('modalBody');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const toastEl = document.getElementById('toastEl');


  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => { toastEl.style.opacity = '0'; }, 2200);
  }

  function showScreen(target) {
    [homeScreen, garageScreen, playScreen].forEach((el) => {
      if (!el) return;
      el.classList.toggle('visible-screen', el === target);
      el.classList.toggle('hidden-screen', el !== target);
    });
    if (target === homeScreen) setTimeout(() => mountShowroomCanvas('home3dHost'), 30);
    else if (target === garageScreen) setTimeout(() => { mountShowroomCanvas('garage3dHost'); if (!thumbsGenerated) generateAll3DThumbnails(); if (gemeraMaster) captureGemeraStoreThumb(); }, 40);
  }



  // ================= LIVE 360-DEGREE INTERACTIVE 3D GARAGE SHOWROOM + 3s LAUNCH ANIMATION =================
  const garage3dHost = document.getElementById('garage3dHost');
  const launchBanner = document.getElementById('launchBanner');
  let gScene = null, gCam = null, gRen = null, gCarWrap = null, gWheels = [], gFlames = [];
  let gRafId = null, gRotY = 0.65, gDragging = false, gLastPointer = 0, gDragPointerId = null;
  const vehicleThumbCache = {};
  let thumbsGenerated = false;
  let gLaunching = false, gLaunchStart = 0;


  // ================= REAL 3D MODEL LOADER (ONLY FOR VEHICLE #0: 2025 KOENIGSEGG GEMERA FBX) =================
  let gemeraMaster = null;
  let gemeraLoading = false;
  const gemeraCallbacks = [];

  function cloneGemeraBuild() {
    if (!gemeraMaster) return null;
    const group = new THREE.Group();
    const chassis = gemeraMaster.clone(true);
    group.add(chassis);
    const flames = [];
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.92 });
    [-0.44, 0.44].forEach((fx) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.15, 10), flameMat);
      cone.rotation.x = Math.PI / 2;
      cone.position.set(fx, 0.42, 2.55);
      cone.visible = false;
      chassis.add(cone);
      flames.push(cone);
    });
    return { group, chassis, wheels: [], frontWheelPivots: [], flames };
  }

  function loadGemeraFBX(cb) {
    if (gemeraMaster) { if (cb) cb(cloneGemeraBuild()); return; }
    if (cb) gemeraCallbacks.push(cb);
    if (gemeraLoading) return;
    if (typeof THREE === 'undefined' || !THREE.FBXLoader || window.location.protocol === 'about:' || window.location.protocol === 'file:' || window.location.hostname === 'unused.url') return;
    gemeraLoading = true;
    try {
      const loader = new THREE.FBXLoader();
      loader.setResourcePath('assets/gemera/');
      loader.load('assets/gemera/FINAL_MODEL_G.fbx', (fbx) => {
        // Auto-normalize real-world scale & road fit (4.9m length, centered X/Z, tires flush on y=0)
        const box1 = new THREE.Box3().setFromObject(fbx);
        const sz1 = new THREE.Vector3();
        box1.getSize(sz1);
        if (sz1.x > sz1.z * 1.15) {
          fbx.rotation.y = Math.PI / 2;
        }
        const box2 = new THREE.Box3().setFromObject(fbx);
        const sz2 = new THREE.Vector3();
        box2.getSize(sz2);
        const maxDim = Math.max(sz2.x, sz2.y, sz2.z) || 1;
        const normScale = 4.9 / maxDim;
        fbx.scale.multiplyScalar(normScale);

        const box3 = new THREE.Box3().setFromObject(fbx);
        const center = new THREE.Vector3();
        box3.getCenter(center);
        fbx.position.x -= center.x;
        fbx.position.z -= center.z;
        fbx.position.y -= box3.min.y;

        fbx.traverse((child) => {
          if (child.isMesh) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m) => {
              if (!m) return;
              if ('envMapIntensity' in m) m.envMapIntensity = 1.45;
              m.needsUpdate = true;
            });
          }
        });

        const masterWrap = new THREE.Group();
        masterWrap.add(fbx);
        gemeraMaster = masterWrap;
        gemeraLoading = false;

        // Capture real 3D snapshot of the loaded Gemera FBX for Store Card #00!
        captureGemeraStoreThumb();

        while (gemeraCallbacks.length) {
          const fn = gemeraCallbacks.shift();
          try { fn(cloneGemeraBuild()); } catch (e) {}
        }
      }, undefined, () => {
        gemeraLoading = false;
      });
    } catch (e) {
      gemeraLoading = false;
    }
  }

  function captureGemeraStoreThumb() {
    if (!gemeraMaster || !gRen || !gScene || !gCam) return;
    const prevWrap = gCarWrap;
    if (prevWrap) gScene.remove(prevWrap);
    const prevPos = gCam.position.clone();
    const prevBg = gScene.background;
    gScene.background = new THREE.Color(0x0b1526);
    gCam.position.set(-4.3, 2.0, -4.6);
    gCam.lookAt(0, 0.8, 0);
    const built = cloneGemeraBuild();
    if (built) {
      gScene.add(built.group);
      gRen.render(gScene, gCam);
      try {
        const snap = document.createElement('canvas');
        snap.width = 192; snap.height = 108;
        snap.getContext('2d').drawImage(gRen.domElement, 0, 0, 192, 108);
        vehicleThumbCache[0] = snap.toDataURL('image/jpeg', 0.82);
        const card0 = document.querySelector('.veh-card[data-vid="0"] img');
        if (card0 && vehicleThumbCache[0]) {
          card0.src = vehicleThumbCache[0];
          card0.style.filter = 'none';
        }
      } catch (e) {}
      gScene.remove(built.group);
    }
    gScene.background = prevBg;
    gCam.position.copy(prevPos);
    gCam.lookAt(0, 0.75, 0);
    if (prevWrap) gScene.add(prevWrap);
    gRen.render(gScene, gCam);
  }

  function mountShowroomCanvas(targetId) {
    if (!gRen) return;
    const host = document.getElementById(targetId);
    if (!host) return;
    if (gRen.domElement.parentElement !== host) {
      host.innerHTML = '';
      host.appendChild(gRen.domElement);
    }
    const w = host.clientWidth || 380;
    const h = host.clientHeight || 200;
    gCam.aspect = w / h;
    gCam.updateProjectionMatrix();
    gRen.setSize(w, h);
  }

  function initGarage3D() {
    if (gRen || !garage3dHost || typeof THREE === 'undefined' || !City3D) return;
    const w = garage3dHost.clientWidth || 420;
    const h = garage3dHost.clientHeight || 220;
    gScene = new THREE.Scene();
    gCam = new THREE.PerspectiveCamera(42, w / h, 0.2, 120);
    gCam.position.set(0, 2.25, 6.4);
    gCam.lookAt(0, 0.75, 0);

    gRen = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    gRen.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    gRen.setSize(w, h);
    gRen.toneMapping = THREE.ACESFilmicToneMapping;
    gRen.toneMappingExposure = 1.25;
    garage3dHost.innerHTML = '';
    garage3dHost.appendChild(gRen.domElement);

    const envTex = City3D.createSkyEnvMap(gRen);
    if (envTex) gScene.environment = envTex;

    gScene.add(new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(6, 10, 8);
    gScene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x00f0ff, 0.9);
    rimLight.position.set(-7, 4, -6);
    gScene.add(rimLight);

    // Sleek Circular Neon Showroom Turntable Platform
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.4, 0.16, 40),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.75, roughness: 0.22 })
    );
    disc.position.y = -0.09;
    const glowRing = new THREE.Mesh(
      new THREE.RingGeometry(3.15, 3.45, 48),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    gScene.userData.glowRing = glowRing;
    glowRing.rotation.x = -Math.PI / 2; glowRing.position.y = 0.01;
    gScene.add(disc, glowRing);

    // Interactive 360 Camera Orbit around Stationary Car (Mouse + Touch safe, supports Sideways rotated phone)
    let gCamYaw = 0.65, gCamPitch = 0.28, gLastX = 0, gLastY = 0;
    garage3dHost.addEventListener('pointerdown', (e) => {
      if (gLaunching) return;
      gDragging = true;
      gDragPointerId = e.pointerId;
      try { garage3dHost.setPointerCapture(e.pointerId); } catch (err) {}
      gLastX = isStageRotated() ? e.clientY : e.clientX;
      gLastY = isStageRotated() ? -e.clientX : e.clientY;
    });
    window.addEventListener('pointermove', (e) => {
      if (!gDragging || e.pointerId !== gDragPointerId) return;
      const curX = isStageRotated() ? e.clientY : e.clientX;
      const curY = isStageRotated() ? -e.clientX : e.clientY;
      gCamYaw -= (curX - gLastX) * 0.014;
      gCamPitch = Math.max(0.12, Math.min(0.85, gCamPitch + (curY - gLastY) * 0.008));
      gLastX = curX; gLastY = curY;
    }, { passive: true });
    const stopDrag = (e) => {
      if (!e || e.pointerId === gDragPointerId) { gDragging = false; gDragPointerId = null; }
    };
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);

    function animateGarage3D(now) {
      gRafId = requestAnimationFrame(animateGarage3D);
      if (!gRen || (garageScreen.classList.contains('hidden-screen') && (!homeScreen || homeScreen.classList.contains('hidden-screen')))) return;
      if (gCarWrap) {
        if (gLaunching) {
          const el = (now - gLaunchStart) / 1000;
          if (gScene.userData.glowRing) { const sc = 1 + Math.sin(el * 18) * 0.08 + (el > 2.0 ? (el - 2.0) * 0.9 : 0); gScene.userData.glowRing.scale.setScalar(sc); gScene.userData.glowRing.material.color.setHex(el > 1.6 ? 0xff6a00 : 0x00f0ff); }
          for (const w of gWheels) w.rotation.x -= (14 + el * 32) * 0.045;
          for (const f of gFlames) {
            f.visible = el > 0.7;
            if (f.visible) {
              const pulse = el > 2.0 ? 2.1 + Math.random() * 1.1 : 1.0 + Math.random() * 0.7;
              f.scale.set(1.15, pulse, 1.15);
            }
          }
          gCarWrap.rotation.y = 0;
          if (el < 1.2) {
            const p = el / 1.2;
            const ang = -0.6 + p * 1.4;
            gCarWrap.position.set(Math.sin(el * 55) * 0.015, 0, Math.sin(el * 48) * 0.03);
            gCam.position.set(Math.sin(ang) * 5.6, 1.55 + p * 0.3, Math.cos(ang) * 5.6);
            gCam.fov = 44 + p * 6;
            gCam.updateProjectionMatrix();
            gCam.lookAt(0, 0.75, 0);
          } else if (el < 2.15) {
            const p = (el - 1.2) / 0.95;
            const ang = 0.8 * (1 - p);
            gCarWrap.position.set(0, 0, Math.sin(el * 65) * 0.045);
            gCarWrap.rotation.x = 0.035 * p;
            gCam.position.set(Math.sin(ang) * 5.8, 1.75 - p * 0.25, Math.cos(ang) * 5.8);
            gCam.fov = 50 + p * 10;
            gCam.updateProjectionMatrix();
            gCam.lookAt(0, 0.72, -0.4);
          } else {
            const p = (el - 2.15) / 0.85;
            gCarWrap.rotation.x = 0.05 * (1 - p);
            gCarWrap.position.z -= (0.45 + p * 2.6);
            gCam.position.set(0, 1.45, 5.8 + p * 1.4);
            gCam.fov = 60 + p * 16;
            gCam.updateProjectionMatrix();
            gCam.lookAt(0, 0.75, gCarWrap.position.z * 0.45);
          }
        } else {
          if (!gDragging) gCamYaw += 0.006;
          gCarWrap.rotation.set(0, 0, 0);
          gCarWrap.position.set(0, 0, 0);
          const dist = 6.4;
          gCam.position.set(
            Math.sin(gCamYaw) * Math.cos(gCamPitch) * dist,
            Math.sin(gCamPitch) * dist + 0.55,
            Math.cos(gCamYaw) * Math.cos(gCamPitch) * dist
          );
          if (Math.abs(gCam.fov - 42) > 0.2) { gCam.fov = 42; gCam.updateProjectionMatrix(); }
          gCam.lookAt(0, 0.75, 0);
          for (const f of gFlames) f.visible = false;
          if (gScene.userData.glowRing) { gScene.userData.glowRing.scale.setScalar(1); gScene.userData.glowRing.material.color.setHex(0x00f0ff); }
        }
      }
      gRen.render(gScene, gCam);
    }
    gRafId = requestAnimationFrame(animateGarage3D);
  }


  function generateAll3DThumbnails() {
    if (thumbsGenerated || !gRen || !gScene || !gCam || !City3D || !vehicles.length) return;
    thumbsGenerated = true;
    const prevWrap = gCarWrap;
    if (prevWrap) gScene.remove(prevWrap);

    const prevPos = gCam.position.clone();
    const prevBg = gScene.background;
    gScene.background = new THREE.Color(0x0b1526);
    gCam.position.set(-4.3, 2.05, -4.6);
    gCam.lookAt(0, 0.85, 0);

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 192;
    snapCanvas.height = 108;
    const snapCtx = snapCanvas.getContext('2d');

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const built = City3D.buildVehicleMesh(v, null);
      const grp = built.group;
      const sc = v.modelType === 'bike' ? 1.48 : (v.modelType === 'heavy_truck' ? 0.80 : 1.02);
      grp.scale.setScalar(sc);
      gScene.add(grp);
      gRen.render(gScene, gCam);
      try {
        snapCtx.clearRect(0, 0, 192, 108);
        snapCtx.drawImage(gRen.domElement, 0, 0, 192, 108);
        vehicleThumbCache[v.id] = snapCanvas.toDataURL('image/jpeg', 0.78);
      } catch (e) {}
      gScene.remove(grp);
    }

    gScene.background = prevBg;
    gCam.position.copy(prevPos);
    gCam.lookAt(0, 0.75, 0);
    if (prevWrap) gScene.add(prevWrap);
    gRen.render(gScene, gCam);

    // Immediately swap all visible store card thumbnails to the exact 3D vehicle models!
    document.querySelectorAll('.veh-card').forEach((card) => {
      const vid = Number(card.dataset.vid);
      const imgEl = card.querySelector('img');
      if (imgEl && vehicleThumbCache[vid]) {
        imgEl.src = vehicleThumbCache[vid];
        imgEl.style.filter = 'none';
      }
    });
  }

  function updateGarage3DModel(vehicleObj) {
    if (typeof THREE === 'undefined' || !City3D) {
      setTimeout(() => updateGarage3DModel(vehicleObj), 300);
      return;
    }
    initGarage3D();
    if (!gScene) return;
    if (gCarWrap) gScene.remove(gCarWrap);
    const paint = null;
    const applyModelToTurntable = (builtObj, isFbx) => {
      if (gCarWrap) gScene.remove(gCarWrap);
      gCarWrap = builtObj.group;
      gWheels = builtObj.wheels || [];
      gFlames = builtObj.flames || [];
      const sc = isFbx ? 1.02 : (vehicleObj.modelType === 'bike' ? 1.35 : (vehicleObj.modelType === 'heavy_truck' ? 0.84 : 0.96));
      gCarWrap.scale.setScalar(sc);
      gScene.add(gCarWrap);
      if (homeScreen && !homeScreen.classList.contains('hidden-screen')) mountShowroomCanvas('home3dHost');
      else if (!garageScreen.classList.contains('hidden-screen')) mountShowroomCanvas('garage3dHost');
    };
    const built = City3D.buildVehicleMesh(vehicleObj, paint);
    applyModelToTurntable(built, false);
    if (vehicleObj.id === 0 && vehicleObj.isRealFBX) {
      loadGemeraFBX((fbxBuilt) => {
        if (fbxBuilt && (selectedId === 0 || (homeScreen && !homeScreen.classList.contains('hidden-screen') && state.equippedId === 0))) {
          applyModelToTurntable(fbxBuilt, true);
        }
      });
    }
  }

  function renderGarage() {
    if (!vehicles.length) return;
    coinsCountEl.textContent = state.coins.toLocaleString();
    if (homeCoinsEl) homeCoinsEl.textContent = state.coins.toLocaleString();
    if (typeof syncHomeExtraHUD === 'function') syncHomeExtraHUD();
    if (homeLevelEl) homeLevelEl.textContent = 'LV ' + (state.level || 1);
    const eqHome = vehicles.find((item) => item.id === state.equippedId) || vehicles[0];
    if (homeEquippedName && eqHome) homeEquippedName.textContent = eqHome.name;
    const lvEl = document.getElementById('playerLevelEl');
    if (lvEl) lvEl.textContent = 'LV ' + (state.level || 1);
    ownedCountEl.textContent = `${state.ownedIds.size}/${vehicles.length}`;
    const v = vehicles.find((item) => item.id === selectedId) || vehicles[0];
    const isOwned = state.ownedIds.has(v.id);
    const isEquipped = state.equippedId === v.id;

    stageCatBadge.textContent = v.starter ? 'NORMAL STARTER CAR' : v.cat;
    stageVehicleName.textContent = v.name;
    if (stageVehicleImg) {
      stageVehicleImg.src = v.img;
      const totalHue = v.hue;
      stageVehicleImg.style.filter = `hue-rotate(${totalHue}deg) saturate(1.12)`;
    }
    updateGarage3DModel(v);

    const bonusSpd = Math.min(100, v.speed + (state.upgradeLevels.engine - 1) * 4);
    const bonusAcc = Math.min(100, v.accel + (state.upgradeLevels.engine - 1) * 4);
    const bonusHnd = Math.min(100, v.handle + (state.upgradeLevels.tires - 1) * 4);
    const bonusNit = Math.min(100, v.nitro + (state.upgradeLevels.nitro - 1) * 5);

    statSpeedVal.textContent = bonusSpd; statSpeedBar.style.width = bonusSpd + '%';
    statAccelVal.textContent = bonusAcc; statAccelBar.style.width = bonusAcc + '%';
    statHandleVal.textContent = bonusHnd; statHandleBar.style.width = bonusHnd + '%';
    statNitroVal.textContent = bonusNit; statNitroBar.style.width = bonusNit + '%';

    if (isEquipped) {
      stageStatusBadge.textContent = 'EQUIPPED';
      stageStatusBadge.className = 'px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-extrabold uppercase';
      stageActionBtn.textContent = 'EQUIPPED';
      stageActionBtn.className = 'px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-500/25 border border-emerald-400 text-emerald-300 cursor-default';
    } else if (isOwned) {
      stageStatusBadge.textContent = 'OWNED';
      stageStatusBadge.className = 'px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-extrabold uppercase';
      stageActionBtn.textContent = 'EQUIP VEHICLE';
      stageActionBtn.className = 'px-3.5 py-1.5 rounded-xl font-bold text-xs bg-cyan-400 text-slate-950 shadow-lg cursor-pointer hover:brightness-110';
    } else {
      stageStatusBadge.textContent = 'LOCKED';
      stageStatusBadge.className = 'px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[9px] font-extrabold uppercase';
      stageActionBtn.textContent = `BUY — ${v.price.toLocaleString()} C`;
      stageActionBtn.className = 'px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg cursor-pointer hover:brightness-110';
    }

    const filtered = activeCategory === 'ALL' ? vehicles : vehicles.filter((item) => item.cat === activeCategory);
    vehicleCarousel.innerHTML = filtered.map((item) => {
      const owned = state.ownedIds.has(item.id);
      const equipped = state.equippedId === item.id;
      const selected = selectedId === item.id;
      return `
        <button type="button" data-vid="${item.id}" class="veh-card shrink-0 w-32 sm:w-36 rounded-xl p-1.5 text-left transition cursor-pointer ${selected ? 'bg-cyan-500/20 border-2 border-cyan-400' : 'bg-slate-900/90 border border-white/10 hover:border-white/30'}">
          <div class="flex items-center justify-between text-[9px] font-bold mb-0.5">
            <span class="text-slate-400">#${item.id === 0 ? '00' : item.id} ${item.cat}</span>
            <span class="${equipped ? 'text-emerald-300' : owned ? 'text-cyan-300' : 'text-amber-300'}">${equipped ? 'ACTIVE' : owned ? 'OWNED' : 'LOCKED'}</span>
          </div>
          <div class="w-full h-11 rounded-lg overflow-hidden bg-slate-950 mb-1">
            <img src="${vehicleThumbCache[item.id] || item.img}" alt="${item.name}" style="${vehicleThumbCache[item.id] ? '' : 'filter: hue-rotate(' + item.hue + 'deg);'}" class="w-full h-full object-cover" />
          </div>
          <div class="text-[11px] font-extrabold text-white truncate">${item.name}</div>
          <div class="text-[10px] font-bold ${owned ? 'text-emerald-300' : 'text-amber-300'}">
            ${owned ? (item.starter ? 'Free Starter' : 'Unlocked') : item.price.toLocaleString() + ' C'}
          </div>
        </button>
      `;
    }).join('');
    if (!thumbsGenerated && gRen) generateAll3DThumbnails();
  }

  vehicleCarousel.addEventListener('click', (e) => {
    const card = e.target.closest('.veh-card');
    if (!card) return;
    selectedId = Number(card.dataset.vid);
    if (Audio) Audio.playTone(620, 0.07);
    renderGarage();
  });

  document.querySelectorAll('.cat-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      document.querySelectorAll('.cat-tab').forEach((b) => {
        const active = b.dataset.cat === activeCategory;
        b.className = active
          ? 'cat-tab px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-extrabold transition cursor-pointer bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
          : 'cat-tab px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-extrabold transition cursor-pointer text-slate-300 hover:text-white border border-transparent';
      });
      if (Audio) Audio.playTone(540, 0.06);
      renderGarage();
    });
  });

  stageActionBtn.addEventListener('click', () => {
    const v = vehicles.find((item) => item.id === selectedId);
    if (!v || state.equippedId === v.id) return;
    if (state.ownedIds.has(v.id)) {
      state.equippedId = v.id;
      persistSave();
      if (Audio) Audio.playTone(760, 0.12);
      showToast(`${v.name} equipped!`);
      renderGarage();
    } else if (state.coins >= v.price) {
      state.coins -= v.price;
      state.ownedIds.add(v.id);
      state.equippedId = v.id;
      persistSave();
      if (Audio) Audio.playReadyChime();
      showToast(`Purchased & saved ${v.name}!`);
      renderGarage();
    } else {
      if (Audio) Audio.playTone(220, 0.16, 'sawtooth', 0.06);
      showToast(`Need ${(v.price - state.coins).toLocaleString()} more Coins!`);
    }
  });

  scrollLeftBtn.addEventListener('click', () => vehicleCarousel.scrollBy({ left: -240, behavior: 'smooth' }));
  scrollRightBtn.addEventListener('click', () => vehicleCarousel.scrollBy({ left: 240, behavior: 'smooth' }));

  function openModal(html) {
    modalBody.innerHTML = html;
    modalOverlay.classList.remove('hidden'); modalOverlay.classList.add('flex');
  }
  function closeModal() {
    modalOverlay.classList.add('hidden'); modalOverlay.classList.remove('flex');
  }
  closeModalBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  const todayStr = () => new Date().toISOString().slice(0, 10);

  document.querySelectorAll('.more-opt-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (Audio) Audio.playTone(600, 0.07);
      const m = btn.dataset.modal;
      if (m === 'customizeModal') {
        const paints = [
          { label: 'Factory', hex: null, deg: 0, bg: 'bg-slate-400' },
          { label: 'Neon Cyan', hex: 0x06b6d4, deg: 180, bg: 'bg-cyan-400' },
          { label: 'Ferrari Red', hex: 0xdc2626, deg: 340, bg: 'bg-red-600' },
          { label: 'Metallic Gold', hex: 0xeab308, deg: 45, bg: 'bg-amber-400' },
          { label: 'Emerald', hex: 0x10b981, deg: 135, bg: 'bg-emerald-500' },
          { label: 'Royal Blue', hex: 0x2563eb, deg: 215, bg: 'bg-blue-600' },
          { label: 'Pearl White', hex: 0xf8fafc, deg: 0, bg: 'bg-white' },
          { label: 'Matte Black', hex: 0x1e293b, deg: 0, bg: 'bg-slate-900' }
        ];
        openModal(`
          <h3 class="font-display text-lg font-black text-white mb-2">METALLIC PAINT SHOP</h3>
          <p class="text-xs text-slate-300 mb-3">Saved automatically to LocalStorage:</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${paints.map((c, idx) => `<button type="button" class="paint-pick py-2 px-1.5 rounded-xl bg-slate-800 border border-white/15 hover:border-cyan-400 text-[11px] font-bold text-white cursor-pointer" data-idx="${idx}"><span class="inline-block w-3 h-3 rounded-full ${c.bg} mr-1 align-middle border border-white/30"></span>${c.label}</button>`).join('')}
          </div>
        `);
        modalBody.querySelectorAll('.paint-pick').forEach((p) => {
          p.addEventListener('click', () => {
            const pick = paints[Number(p.dataset.idx)];
            state.customPaintHex = pick.hex;
            state.customHueOffset = pick.deg;
            selectedId = state.equippedId;
            persistSave();
            renderGarage();
            showToast(`${pick.label} paint applied & saved!`);
            closeModal();
          });
        });
      } else if (m === 'dailyModal') {
        const claimed = state.dailyClaimedDate === todayStr();
        openModal(`
          <h3 class="font-display text-lg font-black text-amber-300 mb-2">DAILY REWARDS</h3>
          <p class="text-xs text-slate-300 mb-4">Claim +10,000 Coins every day (saved in LocalStorage)!</p>
          <button id="claimBonusBtn" type="button" class="w-full py-3 rounded-xl font-bold text-sm ${claimed ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 cursor-pointer'}">
            ${claimed ? 'Already Claimed Today (+10,000 C)' : 'Claim +10,000 Coins Bonus'}
          </button>
        `);
        document.getElementById('claimBonusBtn').addEventListener('click', () => {
          if (state.dailyClaimedDate === todayStr()) return;
          state.dailyClaimedDate = todayStr();
          state.coins += 10000;
          persistSave();
          if (Audio) Audio.playReadyChime();
          renderGarage();
          showToast('+10,000 Coins saved!');
          closeModal();
        });
      } else if (m === 'upgradesModal') {
        const MAX_UPG_LV = 10;
        const UPG_BUDGETS = {
          engine: [1500, 3200, 5800, 9500, 14500, 21000, 29000, 39000, 52000],
          nitro:  [1200, 2600, 4900, 8200, 12800, 18500, 26000, 35000, 46000],
          tires:  [900,  2100, 4000, 6800, 10500, 15500, 22000, 30000, 40000]
        };
        const UPG_META = {
          engine: { title: 'Turbo Express Engine', boost: '+4 SPD & +4 ACC per Lv' },
          nitro:  { title: 'Super Nitro Express',  boost: '+5 NITRO Boost per Lv' },
          tires:  { title: 'Pro Racing Grip',      boost: '+4 Handling per Lv' }
        };
        const renderUpgradesModal = () => {
          openModal(`
            <h3 class="font-display text-lg font-black text-orange-300 mb-1">PERFORMANCE UPGRADES</h3>
            <p class="text-[11px] text-slate-300 mb-3">Each level has its own coin budget — upgrade to unlock Super Fast Express speed!</p>
            <div class="space-y-2.5">
              ${['engine', 'nitro', 'tires'].map((part) => {
                const lv = state.upgradeLevels[part] || 1;
                const isMax = lv >= MAX_UPG_LV;
                const cost = isMax ? 0 : UPG_BUDGETS[part][Math.min(lv - 1, UPG_BUDGETS[part].length - 1)];
                const canAfford = state.coins >= cost;
                return `
                  <div class="flex items-center justify-between bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2.5">
                    <div>
                      <div class="text-xs font-extrabold uppercase text-white">${UPG_META[part].title} <span class="text-cyan-300">Lv.${lv}/${MAX_UPG_LV}</span></div>
                      <div class="text-[11px] text-slate-400">${UPG_META[part].boost}</div>
                    </div>
                    <button type="button" data-part="${part}" data-cost="${cost}" ${isMax ? 'disabled' : ''} class="upg-btn px-3 py-1.5 rounded-lg font-bold text-xs ${isMax ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 cursor-default' : canAfford ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 cursor-pointer hover:brightness-110' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}">
                      ${isMax ? 'MAXED' : `Lv.${lv + 1} — ${cost.toLocaleString()} C`}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          `);
          modalBody.querySelectorAll('.upg-btn').forEach((u) => {
            u.addEventListener('click', () => {
              const part = u.dataset.part;
              const lv = state.upgradeLevels[part] || 1;
              if (lv >= MAX_UPG_LV) return;
              const cost = Number(u.dataset.cost);
              if (state.coins < cost) { showToast(`Need ${(cost - state.coins).toLocaleString()} more Coins!`); return; }
              state.coins -= cost;
              state.upgradeLevels[part] = lv + 1;
              persistSave();
              if (Audio) Audio.playReadyChime();
              renderGarage();
              showToast(`${UPG_META[part].title} upgraded to Lv.${state.upgradeLevels[part]}!`);
              renderUpgradesModal();
            });
          });
        };
        renderUpgradesModal();
      } else if (m === 'settingsModal') {
        openModal(`
          <h3 class="font-display text-lg font-black text-cyan-300 mb-2">GAME SETTINGS</h3>
          <div class="space-y-2 text-xs text-slate-200 mt-3">
            <div class="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-white/10">
              <span>Audio Status</span>
              <span class="text-emerald-300 font-bold">Always ON 🔊</span>
            </div>
            <div class="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-white/10">
              <span>LocalStorage Save</span>
              <button id="resetSaveBtn" type="button" class="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-400 text-rose-300 font-bold cursor-pointer">Reset Save</button>
            </div>
          </div>
        `);
        document.getElementById('resetSaveBtn').addEventListener('click', () => {
          try { localStorage.removeItem(STORAGE_KEY); } catch (err) {}
          state.coins = 25000;
          state.ownedIds = new Set([0]);
          state.equippedId = 0;
          selectedId = 0;
          state.dailyClaimedDate = null;
          state.upgradeLevels = { engine: 1, nitro: 1, tires: 1 };
          state.customPaintHex = null;
          state.customHueOffset = 0;
          state.taskIndex = 0;
          persistSave();
          renderGarage();
          showToast('LocalStorage progress reset!');
          closeModal();
        });
      }
    });
  });

  // ================= HUGE MORNING 3D CITY ENGINE =================
  const city3dContainer = document.getElementById('city3dContainer');
  const crashFlash = document.getElementById('crashFlash');
  const healthPercentEl = document.getElementById('healthPercentEl');
  const healthBarFill = document.getElementById('healthBarFill');
  const driveCoinsEl = document.getElementById('driveCoinsEl');
  const driveAlertEl = document.getElementById('driveAlertEl');
  const speedKmhEl = document.getElementById('speedKmhEl');
  const nitroHudBar = document.getElementById('nitroHudBar');
  const miniMapCanvas = document.getElementById('miniMapCanvas');
  const taskTitleEl = document.getElementById('taskTitleEl');
  const taskRewardBadge = document.getElementById('taskRewardBadge');
  const taskProgressBar = document.getElementById('taskProgressBar');
  const exitToGarageBtn = document.getElementById('exitToGarageBtn');

  const steeringZone = document.getElementById('steeringZone');
  const steeringWheelSvg = document.getElementById('steeringWheelSvg');
  const pedalGas = document.getElementById('pedalGas');
  const pedalBrake = document.getElementById('pedalBrake');
  const pedalNitro = document.getElementById('pedalNitro');

  let cityInitialized = false;
  let cityRafId = null;
  let scene, camera, renderer;
  let playerGroup, playerChassis = null, playerWheels = [], playerFrontPivots = [], nitroFlames = [];
  let playerAvatar = null;
  let isOnFoot = false;
  let parkedCarPos = { x: 0, z: 0, heading: 0 };
  let nearbyVehicleRef = null; // { type: 'own' } or { type: 'traffic', car: tc }
  let hijackedTrafficCar = null;
  const footState = { joyX: 0, joyY: 0, running: false, vy: 0, y: 0.22, jumping: false, pose: 'stand', landTimer: 0, knockedUntil: 0, kvx: 0, kvz: 0 };
  let vehicleAnim = null; // Smooth door-open Enter / Exit / GTA Car-Jack animation
  const exhaustPuffs = [];
  let coinMeshes = [], trafficCars = [], walkingHumans = [], stuntRamps = [], trafficSignals = [], cityLandmarks = [], emergencyEvents = [], policeUnits = [], shopCycles = [], bridgeDeckZones = [], parkedShopVehicles = [], indoorShoppers = [];
  let camModeIdx = 0; // 0: Chase, 1: Hood, 2: Far
  let skyModeIdx = 0; // 0: Morning, 1: Sunset, 2: Neon Night
  let sunLightRef = null, hemiLightRef = null;
  let buildingColliders = [], lakeZones = [], serviceGarages = [], animatedFacadeMats = [], animatedTrees = [];
  let animRoadTex = null, animCanalTex = null;
  let checkpointBeam = null;

  const CITY_BOUND = 1104;
  const BLOCK_STEP = 46;
  let totalKmDriven = 0;
  let colliderGrid = new Map();

  const driveState = {
    x: 0, z: 0, heading: 0, speed: 0, steerInput: 0, targetSteer: 0,
    nitro: 100, health: 100, wrecked: false,
    gas: false, brake: false, boost: false,
    keys: { w: false, s: false, a: false, d: false, shift: false },
    wheelDragging: false, lastCrashAt: 0,
    camOrbitYaw: 0, camOrbitPitch: 0.34, camTargetYaw: 0, camTargetPitch: 0.34, camDragging: false, insideShopTitle: '',
    y: 0, vy: 0, airborne: false, lastStuntAt: 0
  };

  const cityTasks = [
    { type: 'coins', target: 5, reward: 500, label: 'Collect 5 Gold Coins' },
    { type: 'speed', target: 135, reward: 650, label: 'Hit 135 KM/H Top Speed' },
    { type: 'checkpoint', target: 1, reward: 800, label: 'Pass Cyan City Checkpoint' },
    { type: 'garage', target: 1, reward: 700, label: 'Visit Any Green Repair Garage' },
    { type: 'distance', target: 600, reward: 750, label: 'Explore 600m of Morning City' },
    { type: 'coins', target: 10, reward: 1100, label: 'Collect 10 Gold Coins' },
    { type: 'speed', target: 175, reward: 1200, label: 'Nitro Burst: Reach 175 KM/H' },
    { type: 'distance', target: 1000, reward: 1500, label: 'Grand City Cruise: 1,000m' }
  ];
  let taskProgress = 0;

  function updateHealthHUD() {
    const h = Math.max(0, Math.round(driveState.health));
    healthPercentEl.textContent = h + '%';
    healthBarFill.style.width = h + '%';
    healthBarFill.className = h > 55 ? 'h-full bg-emerald-400 rounded-full transition-all duration-150' : h > 25 ? 'h-full bg-amber-400 rounded-full transition-all duration-150' : 'h-full bg-rose-500 rounded-full transition-all duration-150';
  }

  function showDriveAlert(text, bgClass = 'bg-amber-500/95 text-slate-950') {
    driveAlertEl.className = `transition-opacity duration-300 px-3.5 py-1.5 rounded-full font-display text-xs font-black shadow-xl ${bgClass}`;
    driveAlertEl.textContent = text;
    driveAlertEl.style.opacity = '1';
    clearTimeout(driveAlertEl._t);
    driveAlertEl._t = setTimeout(() => { driveAlertEl.style.opacity = '0'; }, 1800);
  }

  function initCityWorld() {
    if (!cityInitialized) {
      cityInitialized = true;
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87ceeb);
      scene.fog = new THREE.FogExp2(0xe0f2fe, 0.0022);

      const w = isStageRotated() ? window.innerHeight : window.innerWidth;
      const h = isStageRotated() ? window.innerWidth : window.innerHeight;
      camera = new THREE.PerspectiveCamera(62, w / h, 0.5, 340);
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(w, h);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.16;
      city3dContainer.appendChild(renderer.domElement);

      const envTex = City3D.createSkyEnvMap(renderer);
      if (envTex) scene.environment = envTex;

      hemiLightRef = new THREE.HemisphereLight(0xffffff, 0x64748b, 1.15);
      scene.add(hemiLightRef);
      sunLightRef = new THREE.DirectionalLight(0xfffbeb, 1.25);
      sunLightRef.position.set(140, 220, 100);
      scene.add(sunLightRef);

      const roadTex = City3D.createRoadTexture();
      animRoadTex = roadTex;
      animCanalTex = City3D.createFlowingWaterTexture ? City3D.createFlowingWaterTexture() : null;
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(4600, 4600),
        new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.62, metalness: 0.12 })
      );
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      const facadeMats = [0, 1, 2, 3, 4, 5, 6, 7].map((idx) => new THREE.MeshStandardMaterial({
        map: City3D.createBuildingTexture(idx),
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.08,
        roughness: 0.34,
        metalness: 0.14
      }));
      animatedFacadeMats = facadeMats;
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
      const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x1e242d, roughness: 0.82 });
      const grassMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9 });
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.4 });
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });

      const blockSize = 34;
      const sandMat = new THREE.MeshStandardMaterial({ color: 0xd6c7a9, roughness: 0.9 });
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
      const reflectiveWaterMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, map: animCanalTex, roughness: 0.12, metalness: 0.55, envMapIntensity: 1.5 });

      // Collect transforms for 1,400+ Real Cement Buildings across a MASSIVE 24x24 Open World (InstancedMesh = 60 FPS!)
      const bldgLists = [[], [], [], [], [], [], [], []]; // 8 vibrant colorful 3D house & building styles (including Pink House!)
      const pitchedRoofTerracotta = []; // Real 3D sloped roofs for 1-floor & 2-floor houses!
      const pitchedRoofDarkBlue = [];   // Real 3D sloped slate/blue roofs for villas & pink houses!
      const bigCrownList = [];          // Stepped penthouse crowns for big multi-floor mansions & towers!
      const padMatrices = [];
      const treeTrunkMatrices = [];
      const treeBranchMatrices = [];
      const treeLeafLowMatrices = [];
      const treeLeafMidMatrices = [];
      const treeLeafTopMatrices = [];
      const dummy = new THREE.Object3D();

      for (let gx = -24; gx <= 23; gx++) {
        for (let gz = -24; gz <= 23; gz++) {
          if (gx === 0 && gz === 0) continue;
          const cx = gx * BLOCK_STEP + BLOCK_STEP / 2;
          const cz = gz * BLOCK_STEP + BLOCK_STEP / 2;

          // 3 Large Scenic Lakes on the City Outskirts
          const isLake = (gx === 1 && gz === -1) || (gx === -2 && gz === 1) || (gx === -7 && gz === -7) || (gx === 6 && gz === 6);
          // 8 In-City Green Repair Garages spread across the huge map
          // 2 Central Flowing Canals (North-South at gx=2, East-West at gz=-2)
          const isCanalNS = (gx === 2 && Math.abs(gz) <= 10);
          const isCanalEW = (gz === -2 && Math.abs(gx) <= 10);
          const isCanal = !isLake && (isCanalNS || isCanalEW);
          const isGarage = !isLake && !isCanal && (
            (gx === 2 && gz === 0) || (gx === -3 && gz === 1) || (gx === 0 && gz === -3) ||
            (gx === 5 && gz === -5) || (gx === -5 && gz === -5) || (gx === 6 && gz === 4) ||
            (gx === -6 && gz === 4) || (gx === 0 && gz === 6)
          );

          if (isLake) {
            const park = new THREE.Mesh(new THREE.BoxGeometry(blockSize + 4, 0.24, blockSize + 4), grassMat);
            park.position.set(cx, 0.12, cz);
            const shore = new THREE.Mesh(new THREE.CylinderGeometry(16.8, 17.5, 0.28, 28), sandMat);
            shore.position.set(cx, 0.16, cz);
            const lakeWater = new THREE.Mesh(new THREE.CylinderGeometry(15.2, 15.2, 0.34, 28), reflectiveWaterMat);
            lakeWater.position.set(cx, 0.19, cz);
            const pier = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 8.5), woodMat);
            pier.position.set(cx, 0.42, cz + 13.0);
            scene.add(park, shore, lakeWater, pier);
            lakeZones.push({ cx, cz, r: 15.2 });
            for (let t = 0; t < 6; t++) {
              const ang = (t / 6) * Math.PI * 2 + 0.3;
              const palm = City3D.createRealisticTree('palm');
              palm.position.set(cx + Math.cos(ang) * 17.8, 0.22, cz + Math.sin(ang) * 17.8);
              palm.rotation.y = ang;
              scene.add(palm); animatedTrees.push(palm);
            }
          } else if (isCanal) {
            // Flowing Blue Canal Water Channel + Stone Embankment Walls + SAFETY FENCING + PHYSICAL COLLIDERS (Car CANNOT fall in!)
            const canalWater = new THREE.Mesh(
              new THREE.BoxGeometry(isCanalNS ? 16 : BLOCK_STEP, 0.28, isCanalEW ? 16 : BLOCK_STEP),
              reflectiveWaterMat
            );
            canalWater.position.set(cx, 0.09, cz);
            scene.add(canalWater);
            const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72 });
            const fenceRailMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.65, roughness: 0.25 });
            const fencePostMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.3 });
            const canalColliders = [];
            const fenceLen = BLOCK_STEP - 19; // Leaves clean open gap right at each road bridge!
            if (isCanalNS) {
              [-8.9, 8.9].forEach((ox) => {
                const wall = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, fenceLen), wallMat);
                wall.position.set(cx + ox, 0.35, cz);
                const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, fenceLen), fenceRailMat);
                railTop.position.set(cx + ox, 1.38, cz);
                const railMid = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, fenceLen), fencePostMat);
                railMid.position.set(cx + ox, 0.96, cz);
                scene.add(wall, railTop, railMid);
                for (let pz = -fenceLen / 2; pz <= fenceLen / 2; pz += 6.5) {
                  const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.45, 0.24), fencePostMat);
                  post.position.set(cx + ox, 0.74, cz + pz);
                  scene.add(post);
                }
                canalColliders.push({
                  minX: cx + ox - 0.72, maxX: cx + ox + 0.72,
                  minZ: cz - fenceLen / 2 - 0.5, maxZ: cz + fenceLen / 2 + 0.5
                });
              });
            }
            if (isCanalEW) {
              [-8.9, 8.9].forEach((oz) => {
                const wall = new THREE.Mesh(new THREE.BoxGeometry(fenceLen, 0.7, 1.3), wallMat);
                wall.position.set(cx, 0.35, cz + oz);
                const railTop = new THREE.Mesh(new THREE.BoxGeometry(fenceLen, 0.14, 0.22), fenceRailMat);
                railTop.position.set(cx, 1.38, cz + oz);
                const railMid = new THREE.Mesh(new THREE.BoxGeometry(fenceLen, 0.12, 0.18), fencePostMat);
                railMid.position.set(cx, 0.96, cz + oz);
                scene.add(wall, railTop, railMid);
                for (let px = -fenceLen / 2; px <= fenceLen / 2; px += 6.5) {
                  const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.45, 0.24), fencePostMat);
                  post.position.set(cx + px, 0.74, cz + oz);
                  scene.add(post);
                }
                canalColliders.push({
                  minX: cx - fenceLen / 2 - 0.5, maxX: cx + fenceLen / 2 + 0.5,
                  minZ: cz + oz - 0.72, maxZ: cz + oz + 0.72
                });
              });
            }
            if (canalColliders.length) {
              const prev = colliderGrid.get(`${gx},${gz}`) || [];
              colliderGrid.set(`${gx},${gz}`, prev.concat(canalColliders));
            }
          } else if (isGarage) {
            const pad = new THREE.Mesh(new THREE.BoxGeometry(blockSize, 0.25, blockSize), sidewalkMat);
            pad.position.set(cx, 0.12, cz);
            const archMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.4 });
            const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.5, 1.4), archMat); p1.position.set(cx - 6, 2.75, cz);
            const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 5.5, 1.4), archMat); p2.position.set(cx + 6, 2.75, cz);
            const roof = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 8), archMat); roof.position.set(cx, 5.8, cz);
            const zoneRing = new THREE.Mesh(new THREE.RingGeometry(5.5, 6.8, 28), new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide }));
            zoneRing.rotation.x = -Math.PI / 2; zoneRing.position.set(cx, 0.3, cz);
            scene.add(pad, p1, p2, roof, zoneRing);
            serviceGarages.push({ x: cx, z: cz, cooldownUntil: 0 });
          } else {
            // Sleek Dark-Charcoal City Footpath around each block (clean urban curb, NOT bright white!)
            dummy.position.set(cx, 0.11, cz);
            dummy.scale.set(blockSize + 1.4, 0.22, blockSize + 1.4);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            padMatrices.push(dummy.matrix.clone());

            const seed = Math.abs(gx * 13 + gz * 7 + gx * gz + gx * 31);
            const isDowntown = Math.abs(gx) <= 5 && Math.abs(gz) <= 5;
            const cellColliders = [];
            const carMargin = 0.22;

            // Check if this block is a special BRANDED LANDMARK (Hospital, D-Mart, Mega Mall, Office Park, Petrol Bunk, Cafe Plaza!)
            const landmarkMap = {
              '0,-1':  { kind: 'dmart',    title: 'D-MART',     sub: 'CENTRAL SUPERMARKET', bg: '#15803d', fg: '#fde047', wall: 0x166534, mapTag: 'D', mapCol: '#22c55e' },
              '-1,0':  { kind: 'hospital', title: '+ HOSPITAL', sub: '24x7 EMERGENCY', bg: '#dc2626', fg: '#ffffff', wall: 0xe2e8f0, mapTag: 'H', mapCol: '#ef4444' },
              '1,0':   { kind: 'mall',     title: 'MEGA MALL',  sub: 'SHOPS & CINEMA', bg: '#6d28d9', fg: '#38bdf8', wall: 0x3b0764, mapTag: 'M', mapCol: '#a855f7' },
              '0,1':   { kind: 'office',   title: 'TECH OFFICE',sub: 'IT TOWER', bg: '#0284c7', fg: '#ffffff', wall: 0x0f2354, mapTag: 'O', mapCol: '#38bdf8' },
              '-1,-1': { kind: 'fuel',     title: 'FUEL STATION',sub: 'PETROL & MART', bg: '#ea580c', fg: '#fef08a', wall: 0x9a3412, mapTag: 'F', mapCol: '#f97316' },
              '1,1':   { kind: 'cafe',     title: 'ROYAL CAFE', sub: 'BAKERY & SHOPS', bg: '#be185d', fg: '#fde68a', wall: 0x831843, mapTag: 'S', mapCol: '#ec4899' },
              '-3,-1': { kind: 'dmart',    title: 'D-MART',     sub: 'WEST HYPERMARKET', bg: '#15803d', fg: '#fde047', wall: 0x166534, mapTag: 'D', mapCol: '#22c55e' },
              '3,-1':  { kind: 'dmart',    title: 'D-MART',     sub: 'EAST SUPERMARKET', bg: '#15803d', fg: '#fde047', wall: 0x166534, mapTag: 'D', mapCol: '#22c55e' },
              '0,-4':  { kind: 'dmart',    title: 'D-MART',     sub: 'NORTH MART', bg: '#15803d', fg: '#fde047', wall: 0x166534, mapTag: 'D', mapCol: '#22c55e' },
              '0,4':   { kind: 'dmart',    title: 'D-MART',     sub: 'SOUTH MART', bg: '#15803d', fg: '#fde047', wall: 0x166534, mapTag: 'D', mapCol: '#22c55e' },
              '4,3':   { kind: 'dmart',    title: 'D-MART',     sub: 'SE PLAZA MART', bg: '#15803d', fg: '#fde047', wall: 0x166534, mapTag: 'D', mapCol: '#22c55e' },
              '-4,3':  { kind: 'dmart',    title: 'D-MART',     sub: 'SW SUPERMARKET', bg: '#15803d', fg: '#fde047', wall: 0x166534, mapTag: 'D', mapCol: '#22c55e' },
              '-4,-4': { kind: 'dmart',    title: 'D-MART',     sub: 'NW HYPERMARKET', bg: '#15803d', fg: '#fde047', wall: 0x166534, mapTag: 'D', mapCol: '#22c55e' },
              '3,2':   { kind: 'hospital', title: '+ HOSPITAL', sub: 'CITY CARE', bg: '#dc2626', fg: '#ffffff', wall: 0xe2e8f0, mapTag: 'H', mapCol: '#ef4444' },
              '-2,3':  { kind: 'mall',     title: 'ST PLAZA',   sub: 'SHOPPING MART', bg: '#0369a1', fg: '#fde047', wall: 0x0c3b52, mapTag: 'M', mapCol: '#a855f7' },
              '3,-3':  { kind: 'office',   title: 'CITY OFFICE',sub: 'CORPORATE HQ', bg: '#1e3a8a', fg: '#7dd3fc', wall: 0x0a1738, mapTag: 'O', mapCol: '#38bdf8' }
            };
            const lm = landmarkMap[`${gx},${gz}`];

            if (lm) {
              // WALK-IN 3D SHOPS & LANDMARKS (Hollow Lit Ground Floor + Cash Counter on Right + Shelves + Automatic Sliding Glass Doors + Front Parking Lot!)
              const isWalkInShop = true;
              const lmH = lm.kind === 'office' ? 32 : lm.kind === 'mall' ? 20 : lm.kind === 'hospital' ? 16 : lm.kind === 'fuel' ? 6.5 : 11.5;
              const lmW = 24;
              const lmD = 16.5;
              const shopZ = isWalkInShop ? (cz - 2.8) : (cz - 2.0);
              const lmMat = new THREE.MeshStandardMaterial({ color: lm.wall, roughness: 0.45, metalness: 0.22 });
              let doorL = null, doorR = null;
              const doorZWorld = shopZ + lmD / 2 + 0.22;

              if (isWalkInShop) {
                const roomH = 4.6;
                const wallT = 0.65;
                const doorGapHalf = 2.75;
                const frontSegW = (lmW - doorGapHalf * 2) / 2;
                const intWallMat = new THREE.MeshStandardMaterial({ color: lm.kind === 'hospital' ? 0xf1f5f9 : 0xfef9c3, roughness: 0.72 });
                const tileFloorMat = new THREE.MeshStandardMaterial({ color: lm.kind === 'hospital' ? 0xe0f2fe : 0xe2e8f0, roughness: 0.35, metalness: 0.12 });

                // Bright Tiled Interior Floor & Lit Ceiling with LED Light Strips
                const floorM = new THREE.Mesh(new THREE.BoxGeometry(lmW - 0.6, 0.14, lmD - 0.6), tileFloorMat);
                floorM.position.set(cx, 0.26, shopZ);
                const ceilM = new THREE.Mesh(new THREE.BoxGeometry(lmW, 0.28, lmD), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 }));
                ceilM.position.set(cx, roomH, shopZ);
                const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                [-5.5, 0, 5.5].forEach((lx) => {
                  const led = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, lmD - 4.0), ledMat);
                  led.position.set(cx + lx, roomH - 0.16, shopZ);
                  scene.add(led);
                });
                scene.add(floorM, ceilM);

                // Hollow Ground-Floor Perimeter Walls (Back, Left, Right, Front-Left, Front-Right)
                const backWall = new THREE.Mesh(new THREE.BoxGeometry(lmW, roomH, wallT), lmMat);
                backWall.position.set(cx, roomH / 2 + 0.22, shopZ - lmD / 2 + wallT / 2);
                const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, roomH, lmD), lmMat);
                leftWall.position.set(cx - lmW / 2 + wallT / 2, roomH / 2 + 0.22, shopZ);
                const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, roomH, lmD), lmMat);
                rightWall.position.set(cx + lmW / 2 - wallT / 2, roomH / 2 + 0.22, shopZ);

                const frontGlassMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, metalness: 0.55, roughness: 0.12, transparent: true, opacity: 0.48 });
                const frontL = new THREE.Mesh(new THREE.BoxGeometry(frontSegW, roomH, wallT), frontGlassMat);
                frontL.position.set(cx - doorGapHalf - frontSegW / 2, roomH / 2 + 0.22, shopZ + lmD / 2 - wallT / 2);
                const frontR = new THREE.Mesh(new THREE.BoxGeometry(frontSegW, roomH, wallT), frontGlassMat);
                frontR.position.set(cx + doorGapHalf + frontSegW / 2, roomH / 2 + 0.22, shopZ + lmD / 2 - wallT / 2);

                // Inner Bright Wall Liner on Back Wall
                const innerBack = new THREE.Mesh(new THREE.BoxGeometry(lmW - 1.4, roomH - 0.4, 0.15), intWallMat);
                innerBack.position.set(cx, roomH / 2 + 0.22, shopZ - lmD / 2 + wallT + 0.08);
                scene.add(backWall, leftWall, rightWall, frontL, frontR, innerBack);

                // Upper Building Floors sitting cleanly above the walk-in ground floor
                if (lmH > roomH + 0.5) {
                  const upH = lmH - roomH;
                  const upperB = new THREE.Mesh(new THREE.BoxGeometry(lmW, upH, lmD), lmMat);
                  upperB.position.set(cx, roomH + upH / 2 + 0.22, shopZ);
                  scene.add(upperB);
                }

                // Real Animated Sliding Glass Entrance Doors (Open automatically for Player & Shoppers!)
                const slideGlassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.65, roughness: 0.1, transparent: true, opacity: 0.55 });
                doorL = new THREE.Mesh(new THREE.BoxGeometry(2.68, 4.0, 0.14), slideGlassMat);
                doorL.position.set(cx - 1.36, 2.22, doorZWorld);
                doorR = new THREE.Mesh(new THREE.BoxGeometry(2.68, 4.0, 0.14), slideGlassMat);
                doorR.position.set(cx + 1.36, 2.22, doorZWorld);
                const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
                const doorFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.3, 0.55), frameMat);
                doorFrameL.position.set(cx - doorGapHalf - 0.12, 2.35, doorZWorld);
                const doorFrameR = doorFrameL.clone(); doorFrameR.position.x = cx + doorGapHalf + 0.12;
                const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(doorGapHalf * 2 + 0.6, 0.45, 0.6), frameMat);
                doorHeader.position.set(cx, 4.45, doorZWorld);
                scene.add(doorL, doorR, doorFrameL, doorFrameR, doorHeader);

                // ===== CASH COUNTER ON ONE SIDE (RIGHT SIDE INSIDE EVERY SHOP!) =====
                const counterX = cx + lmW / 2 - 3.6;
                const counterZ = shopZ + 0.4;
                const cWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.48 });
                const cTopMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.22, metalness: 0.15 });
                const cDesk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.08, 6.8), cWoodMat);
                cDesk.position.set(counterX, 0.84, counterZ);
                const cTop = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 7.0), cTopMat);
                cTop.position.set(counterX, 1.42, counterZ);
                const cReturn = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.08, 1.2), cWoodMat);
                cReturn.position.set(counterX + 1.4, 0.84, counterZ - 2.8);
                // POS Monitor + Cash Register + Scanner on Counter
                const posStand = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), frameMat);
                posStand.position.set(counterX - 0.15, 1.7, counterZ + 1.2);
                const posScreen = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.72), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
                posScreen.position.set(counterX - 0.15, 2.02, counterZ + 1.2);
                const cashDrawer = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.24, 0.85), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 }));
                cashDrawer.position.set(counterX + 0.1, 1.6, counterZ - 0.8);
                scene.add(cDesk, cTop, cReturn, posStand, posScreen, cashDrawer);

                // Crisp "CASH COUNTER" Hanging Board above Counter
                const ccCan = document.createElement('canvas'); ccCan.width = 256; ccCan.height = 64;
                const ccCtx = ccCan.getContext('2d');
                ccCtx.fillStyle = '#0f172a'; ccCtx.fillRect(0, 0, 256, 64);
                ccCtx.strokeStyle = '#facc15'; ccCtx.lineWidth = 4; ccCtx.strokeRect(4, 4, 248, 56);
                ccCtx.fillStyle = '#fde047'; ccCtx.font = '900 24px Inter, sans-serif'; ccCtx.textAlign = 'center'; ccCtx.textBaseline = 'middle';
                ccCtx.fillText('CASH COUNTER', 128, 34);
                const ccMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(ccCan) });
                const ccSign = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.82, 3.6), [ccMat, ccMat, frameMat, frameMat, frameMat, frameMat]);
                ccSign.position.set(counterX, 3.35, counterZ);
                scene.add(ccSign);

                // 3D Cashier Staff standing behind the Cash Counter
                if (City3D.createWalkingHuman) {
                  const cashier = City3D.createWalkingHuman((gx + gz + 5) & 7);
                  cashier.position.set(counterX + 1.45, 0.32, counterZ + 0.6);
                  cashier.rotation.y = -Math.PI / 2;
                  scene.add(cashier);
                }

                // ===== SHOP INTERIOR SHELVES / DISPLAYS ON LEFT & CENTER-LEFT =====
                const rackMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4, roughness: 0.45 });
                const prodColors = [0xef4444, 0x22c55e, 0xf59e0b, 0x3b82f6, 0xa855f7, 0xec4899];
                if (lm.kind === 'hospital') {
                  // Hospital Clinic Beds & Waiting Benches on Left Side
                  const bedMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
                  const sheetMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 });
                  [-3.5, 2.2].forEach((bz) => {
                    const bed = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.68, 1.5), bedMat);
                    bed.position.set(cx - 6.8, 0.66, shopZ + bz);
                    const sheet = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 1.44), sheetMat);
                    sheet.position.set(cx - 6.5, 1.04, shopZ + bz);
                    scene.add(bed, sheet);
                    // Solid collider for Hospital Bed
                    cellColliders.push({ minX: cx - 6.8 - 1.7, maxX: cx - 6.8 + 1.7, minZ: shopZ + bz - 0.85, maxZ: shopZ + bz + 0.85 });
                  });
                } else {
                  // Supermarket / Mall / Cafe / Office Product Racks & Aisles
                  [-8.2, -3.2].forEach((rxOff, rIdx) => {
                    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 8.8), rackMat);
                    rack.position.set(cx + rxOff, 1.55, shopZ - 1.2);
                    scene.add(rack);
                    // Solid collider for Shop Display Stand / Rack + Product Boxes (zero clipping/glitching!)
                    cellColliders.push({ minX: cx + rxOff - 1.15, maxX: cx + rxOff + 1.15, minZ: shopZ - 1.2 - 4.65, maxZ: shopZ - 1.2 + 4.65 });
                    for (let row = 0; row < 2; row++) {
                      for (let col = 0; col < 4; col++) {
                        const pBox = new THREE.Mesh(
                          new THREE.BoxGeometry(1.66, 0.46, 1.55),
                          new THREE.MeshStandardMaterial({ color: prodColors[(rIdx * 3 + row + col) % prodColors.length], roughness: 0.55 })
                        );
                        pBox.position.set(cx + rxOff, 1.05 + row * 0.95, shopZ - 4.3 + col * 2.05);
                        scene.add(pBox);
                      }
                    }
                  });
                }

                // 5-WALL WALKABLE COLLIDERS (Doorway & Interior are 100% OPEN to walk inside!)
                const wPad = 0.55;
                // Back wall
                cellColliders.push({ minX: cx - lmW / 2 - wPad, maxX: cx + lmW / 2 + wPad, minZ: shopZ - lmD / 2 - wPad, maxZ: shopZ - lmD / 2 + wallT + wPad });
                // Left wall
                cellColliders.push({ minX: cx - lmW / 2 - wPad, maxX: cx - lmW / 2 + wallT + wPad, minZ: shopZ - lmD / 2 - wPad, maxZ: shopZ + lmD / 2 + wPad });
                // Right wall
                cellColliders.push({ minX: cx + lmW / 2 - wallT - wPad, maxX: cx + lmW / 2 + wPad, minZ: shopZ - lmD / 2 - wPad, maxZ: shopZ + lmD / 2 + wPad });
                // Front-Left wall (stops cleanly at doorway)
                cellColliders.push({ minX: cx - lmW / 2 - wPad, maxX: cx - doorGapHalf - 0.15, minZ: shopZ + lmD / 2 - wallT - wPad, maxZ: shopZ + lmD / 2 + wPad });
                // Front-Right wall (stops cleanly at doorway)
                cellColliders.push({ minX: cx + doorGapHalf + 0.15, maxX: cx + lmW / 2 + wPad, minZ: shopZ + lmD / 2 - wallT - wPad, maxZ: shopZ + lmD / 2 + wPad });
                // Cash counter + L-return colliders so player walks UP to counter cleanly without clipping!
                cellColliders.push({ minX: counterX - 1.15, maxX: counterX + 1.15, minZ: counterZ - 3.65, maxZ: counterZ + 3.65 });
                cellColliders.push({ minX: counterX + 0.2, maxX: counterX + 2.6, minZ: counterZ - 3.55, maxZ: counterZ - 2.05 });
              } else {
                // Fuel Station solid structure
                const mainB = new THREE.Mesh(new THREE.BoxGeometry(lmW, lmH, lmD), lmMat);
                mainB.position.set(cx, lmH / 2 + 0.22, shopZ);
                scene.add(mainB);
                cellColliders.push({
                  minX: cx - lmW / 2 - carMargin, maxX: cx + lmW / 2 + carMargin,
                  minZ: shopZ - lmD / 2 - carMargin, maxZ: shopZ + lmD / 2 + carMargin
                });
              }

              // Branded Entrance Canopy & Rooftop Signboard
              const canopy = new THREE.Mesh(new THREE.BoxGeometry(lmW + 1.6, 0.65, lmD + 2.0), new THREE.MeshStandardMaterial({ color: lm.bg, roughness: 0.4 }));
              canopy.position.set(cx, 5.05, shopZ);
              scene.add(canopy);

              const sc = document.createElement('canvas'); sc.width = 512; sc.height = 160;
              const sctx = sc.getContext('2d');
              sctx.fillStyle = lm.bg; sctx.fillRect(0, 0, 512, 160);
              sctx.strokeStyle = lm.fg; sctx.lineWidth = 8; sctx.strokeRect(8, 8, 496, 144);
              sctx.fillStyle = lm.fg; sctx.font = '900 62px Inter, sans-serif'; sctx.textAlign = 'center';
              sctx.fillText(lm.title, 256, 86);
              sctx.fillStyle = '#ffffff'; sctx.font = '700 28px Inter, sans-serif';
              sctx.fillText(lm.sub, 256, 132);
              const signTex = new THREE.CanvasTexture(sc);
              const signMat = new THREE.MeshBasicMaterial({ map: signTex });
              const signBox = new THREE.Mesh(new THREE.BoxGeometry(16, 4.6, 1.0), [lmMat, lmMat, lmMat, lmMat, signMat, signMat]);
              signBox.position.set(cx, lmH + 2.6, shopZ);
              scene.add(signBox);

              // ===== FRONT PARKING LOT IN FRONT OF EVERY SHOP (Painted Bays + P Sign + Parked Visitor Cars & Bikes!) =====
              const parkZ = cz + 11.2;
              const parkPad = new THREE.Mesh(
                new THREE.BoxGeometry(lmW + 2.0, 0.08, 8.8),
                new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 })
              );
              parkPad.position.set(cx, 0.24, parkZ);
              scene.add(parkPad);

              // White Parking Bay Lines (5 spacious bays across the shop front!)
              const pLineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
              for (let b = -2; b <= 3; b++) {
                const bayX = cx + b * 4.4 - 2.2;
                const pLine = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 5.4), pLineMat);
                pLine.position.set(bayX, 0.29, parkZ + 0.6);
                scene.add(pLine);
              }
              // Blue "P PARKING" Signboard Post at Corner of Parking Lot
              const pSignCan = document.createElement('canvas'); pSignCan.width = 128; pSignCan.height = 128;
              const psCtx = pSignCan.getContext('2d');
              psCtx.fillStyle = '#1d4ed8'; psCtx.fillRect(0, 0, 128, 128);
              psCtx.strokeStyle = '#ffffff'; psCtx.lineWidth = 8; psCtx.strokeRect(6, 6, 116, 116);
              psCtx.fillStyle = '#ffffff'; psCtx.font = '900 72px Inter, sans-serif'; psCtx.textAlign = 'center'; psCtx.textBaseline = 'middle';
              psCtx.fillText('P', 64, 56);
              psCtx.font = '800 18px Inter, sans-serif'; psCtx.fillText('PARKING', 64, 104);
              const pSignMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(pSignCan) });
              const pPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7 }));
              pPole.position.set(cx - lmW / 2 - 0.5, 1.8, parkZ + 3.4);
              const pBoard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.15), [pSignMat, pSignMat, pSignMat, pSignMat, pSignMat, pSignMat]);
              pBoard.position.set(cx - lmW / 2 - 0.5, 3.5, parkZ + 3.4);
              scene.add(pPole, pBoard);
              // Exact tight collider for Parking Sign Pole (never clips inside car, zero magnetic repulsion!)
              cellColliders.push({
                minX: cx - lmW / 2 - 0.5 - 0.28, maxX: cx - lmW / 2 - 0.5 + 0.28,
                minZ: parkZ + 3.4 - 0.28, maxZ: parkZ + 3.4 + 0.28
              });

              // Park 2 Drivable Visitor Cars & 1 Drivable Visitor Bike in side bays (Player can ENTER & DRIVE any of them!)
              const parkModels = [
                { bayOff: -8.8, label: 'PARKED SPORTS CAR 🏎️', spec: { modelType: 'car', bodyStyle: 'exotic_low', colorHex: 0x2563eb, accentHex: 0xf8fafc } },
                { bayOff: 8.8,  label: 'PARKED SUPERBIKE 🏍️', spec: { modelType: 'bike', bodyStyle: 'superbike', colorHex: 0x16a34a, accentHex: 0x111827 } }
              ];
              parkModels.forEach(({ bayOff, label, spec }) => {
                if (!City3D.buildVehicleMesh) return;
                const builtPv = City3D.buildVehicleMesh(spec, null);
                const pv = builtPv.group;
                if (pv.userData && pv.userData.rider) pv.userData.rider.visible = false; // Empty parked bike!
                pv.position.set(cx + bayOff, 0.25, parkZ + 0.5);
                pv.rotation.y = Math.PI;
                scene.add(pv);
                const pCol = {
                  minX: cx + bayOff - 1.25, maxX: cx + bayOff + 1.25,
                  minZ: parkZ - 1.9, maxZ: parkZ + 2.9,
                  disabled: false
                };
                cellColliders.push(pCol);
                parkedShopVehicles.push({
                  mesh: pv, wheels: builtPv.wheels || [], label, colliderRef: pCol,
                  stolen: false, modelType: spec.modelType
                });
              });

              cityLandmarks.push({
                x: cx, z: shopZ, tag: lm.mapTag, color: lm.mapCol, title: lm.title,
                doorL, doorR, doorBaseX: cx, doorZ: doorZWorld,
                isWalkInShop,
                minX: cx - lmW / 2 + 0.8, maxX: cx + lmW / 2 - 0.8,
                minZ: shopZ - lmD / 2 + 0.8, maxZ: shopZ + lmD / 2 - 0.5
              });
              // Spawn 3 Live Animated Indoor Shoppers walking inside EVERY Shop / Mall / Hospital!
              if (isWalkInShop && City3D.createWalkingHuman) {
                const waypoints = [
                  { x: cx - 5.6, z: shopZ + 4.5 },
                  { x: cx - 5.6, z: shopZ - 5.5 },
                  { x: cx + 0.8, z: shopZ - 5.5 },
                  { x: cx + 4.8, z: shopZ + 1.0 },
                  { x: cx + 1.0, z: shopZ + 5.2 }
                ];
                for (let isIdx = 0; isIdx < 3; isIdx++) {
                  const inHum = City3D.createWalkingHuman((Math.abs(gx * 3 + gz * 5) + isIdx + 1) % 8);
                  const wp0 = waypoints[(isIdx * 2) % waypoints.length];
                  inHum.position.set(wp0.x, 0.32, wp0.z);
                  scene.add(inHum);
                  indoorShoppers.push({
                    mesh: inHum,
                    waypoints,
                    wpIdx: (isIdx * 2 + 1) % waypoints.length,
                    speed: 1.55 + isIdx * 0.28,
                    phase: isIdx * 2.1
                  });
                }
              }
            } else {
              // ORGANIC IRREGULAR VILLAGE & CITY CLUSTERS (4 to 5 varied houses/shops/apartments per block — NOT identical grid boxes!)
              const clusterCount = 3 + (seed % 3); // 3, 4, or 5 irregular buildings per block!
              const presets = [
                [-9.5, -8.5, 11.5, 11.0],
                [8.8,  -9.0, 10.8, 10.5],
                [-8.8,  8.6, 12.2, 11.4],
                [8.5,   8.2, 11.8, 12.0],
                [0.2,  -0.4, 9.2,  9.5]
              ];
              for (let k = 0; k < clusterCount; k++) {
                const subSeed = seed + k * 29;
                const pr = presets[k];
                // Organic jitter offset & varied footprint so every street feels like a real bustling town!
                const jx = ((subSeed % 5) - 2) * 0.9;
                const jz = (((subSeed >> 2) % 5) - 2) * 0.9;
                const bx = cx + pr[0] + jx;
                const bz = cz + pr[1] + jz;
                const bw = pr[2] * (0.78 + (subSeed % 4) * 0.11);
                const bd = pr[3] * (0.78 + ((subSeed + 1) % 4) * 0.11);

                const styleIdx = (subSeed * 3 + k) % 8;
                const isTall = isDowntown ? (subSeed % 3 === 0) : (subSeed % 7 === 0);
                const bh = isTall ? (18 + (subSeed * 7) % 28) : (4.8 + (subSeed % 4) * 2.8); // 1-floor shops (4.8m), 2-floor pink houses (7.6m), 3-floor homes (10.4m), tall towers (18-46m)!

                dummy.position.set(bx, bh / 2 + 0.22, bz);
                dummy.scale.set(bw, bh, bd);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                bldgLists[styleIdx].push(dummy.matrix.clone());

                if (bh < 11) {
                  dummy.position.set(bx, bh + 1.9, bz);
                  dummy.scale.set(bw + 1.1, 3.6, bd + 1.1);
                  dummy.rotation.set(0, Math.PI / 4, 0);
                  dummy.updateMatrix();
                  (styleIdx === 0 || styleIdx === 3 ? pitchedRoofDarkBlue : pitchedRoofTerracotta).push(dummy.matrix.clone());
                  dummy.rotation.set(0, 0, 0);
                } else {
                  bigCrownList.push(dummy.matrix.clone());
                }

                // Mount Real Rooftop House Name Board on prominent village/city homes (KUMAR NILAYAM, RAVI VILLA, etc.!)
                if (k === 0 && Math.abs(gx) <= 4 && Math.abs(gz) <= 4) {
                  const houseNames = [
                    'KUMAR NILAYAM', 'RAVI VILLA', 'SAI RESIDENCY', 'PRASAD HOUSE',
                    'KIRAN MANSION', 'SURESH HOME', 'LAKSHMI NIVAS', 'ANITHA VILLA',
                    'VENKAT HOMES', 'RAMESH PALACE', 'ARJUN HEIGHTS', 'DEVI NILAYAM',
                    'SRINIVAS HOME', 'GANESH VILLA', 'SHIVA RESIDENCY', 'MANI HOUSE'
                  ];
                  const hLabel = houseNames[Math.abs(gx * 5 + gz * 3 + seed) % houseNames.length];
                  const hc = document.createElement('canvas'); hc.width = 384; hc.height = 96;
                  const hctx = hc.getContext('2d');
                  hctx.fillStyle = '#0f172a'; hctx.fillRect(0, 0, 384, 96);
                  hctx.strokeStyle = '#facc15'; hctx.lineWidth = 6; hctx.strokeRect(5, 5, 374, 86);
                  hctx.fillStyle = '#fde047'; hctx.font = '900 34px Inter, sans-serif'; hctx.textAlign = 'center'; hctx.textBaseline = 'middle';
                  hctx.fillText(hLabel, 192, 50);
                  const hSignTex = new THREE.CanvasTexture(hc);
                  const hSignMat = new THREE.MeshBasicMaterial({ map: hSignTex });
                  const hBoard = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.9, 0.35), [roofMat, roofMat, roofMat, roofMat, hSignMat, hSignMat]);
                  hBoard.position.set(bx, bh + (bh < 11 ? 3.8 : 2.2), bz);
                  scene.add(hBoard);
                }

                cellColliders.push({
                  minX: bx - bw / 2 - carMargin, maxX: bx + bw / 2 + carMargin,
                  minZ: bz - bd / 2 - carMargin, maxZ: bz + bd / 2 + carMargin
                });
              }
            }
            colliderGrid.set(`${gx},${gz}`, cellColliders);

            // REALISTIC MULTI-LAYERED 3D TREES via 4 GPU InstancedMeshes (Organic Bark Trunk + 3 Layered Leaf Canopies — NOT Toy Balls!)
            if (Math.abs(gx) <= 9 && Math.abs(gz) <= 9) {
              const treeSpots = [[cx - 16.4, cz + 16.4]];
              if ((gx * 3 + gz) % 2 === 0) treeSpots.push([cx + 16.4, cz - 16.4]);
              treeSpots.forEach(([tx, tz], ti) => {
                const tRot = ((gx * 7 + gz * 13 + ti * 5) % 6) * 0.52;
                const tH = 3.6 + ((Math.abs(gx + gz + ti) % 3) * 0.55);
                const isBigBranchTree = ((Math.abs(gx * 3 + gz * 5 + ti)) % 2 === 0);
                const trunkScale = isBigBranchTree ? 0.72 : 0.56;
                // Tapered natural dark-bark trunk
                dummy.position.set(tx, tH * 0.5, tz); dummy.scale.set(trunkScale, tH, trunkScale); dummy.rotation.set(0, tRot, 0); dummy.updateMatrix();
                treeTrunkMatrices.push(dummy.matrix.clone());
                if (isBigBranchTree) {
                  // REAL BIG-BRANCHING TREE: 3 thick angled wooden limbs extending outward + dense leafy clusters at each branch tip!
                  for (let br = 0; br < 3; br++) {
                    const bAng = tRot + br * (Math.PI * 2 / 3);
                    const bx = tx + Math.cos(bAng) * 1.15;
                    const bz = tz + Math.sin(bAng) * 1.15;
                    dummy.position.set(tx + Math.cos(bAng) * 0.65, tH - 0.15, tz + Math.sin(bAng) * 0.65);
                    dummy.scale.set(0.32, 2.25, 0.32);
                    dummy.rotation.set(Math.sin(bAng) * 0.68, 0, -Math.cos(bAng) * 0.68);
                    dummy.updateMatrix();
                    treeBranchMatrices.push(dummy.matrix.clone());
                    // Dense leaf cluster right over this branch tip!
                    dummy.position.set(bx, tH + 0.85, bz);
                    dummy.scale.set(2.35, 1.38, 2.25); dummy.rotation.set(0.06, bAng, -0.05); dummy.updateMatrix();
                    (br % 2 === 0 ? treeLeafLowMatrices : treeLeafMidMatrices).push(dummy.matrix.clone());
                  }
                  // Lush wide top canopy crown
                  dummy.position.set(tx, tH + 1.85, tz);
                  dummy.scale.set(2.55, 1.48, 2.45); dummy.rotation.set(0, tRot, 0); dummy.updateMatrix();
                  treeLeafTopMatrices.push(dummy.matrix.clone());
                } else {
                  // DENSE LEAFY CANOPY TREE: 4 thick overlapping lush green leaf layers!
                  dummy.position.set(tx + Math.cos(tRot) * 0.55, tH + 0.45, tz + Math.sin(tRot) * 0.55);
                  dummy.scale.set(2.85, 1.45, 2.65); dummy.rotation.set(0.08, tRot, -0.06); dummy.updateMatrix();
                  treeLeafLowMatrices.push(dummy.matrix.clone());
                  dummy.position.set(tx - Math.cos(tRot) * 0.55, tH + 1.15, tz - Math.sin(tRot) * 0.55);
                  dummy.scale.set(2.45, 1.52, 2.35); dummy.rotation.set(-0.07, tRot + 1.1, 0.08); dummy.updateMatrix();
                  treeLeafMidMatrices.push(dummy.matrix.clone());
                  dummy.position.set(tx, tH + 1.95, tz);
                  dummy.scale.set(1.95, 1.35, 1.88); dummy.rotation.set(0.05, tRot + 2.2, 0.04); dummy.updateMatrix();
                  treeLeafTopMatrices.push(dummy.matrix.clone());
                }
                dummy.rotation.set(0, 0, 0);

                // SOLID TREE COLLIDER: Car & Avatar stop cleanly outside every tree trunk!
                cellColliders.push({ minX: tx - 0.42, maxX: tx + 0.42, minZ: tz - 0.42, maxZ: tz + 0.42 });
              });
            }
          }
        }
      }

      // Build Fast InstancedMeshes for all 1,680+ Cement Buildings & Sidewalks
      const unitBox = new THREE.BoxGeometry(1, 1, 1);
      const padIM = new THREE.InstancedMesh(unitBox, sidewalkMat, padMatrices.length);
      padMatrices.forEach((m, idx) => padIM.setMatrixAt(idx, m));
      scene.add(padIM);
      if (treeTrunkMatrices.length) {
        const tBarkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.92 });
        const tLeafLowMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.78 });
        const tLeafMidMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.75 });
        const tBlossomPinkMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.78 });
        const tBlossomGoldMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.76 });
        const tTrunkIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.24, 0.48, 1, 10), tBarkMat, treeTrunkMatrices.length);
        // Smooth organic rounded sphere foliage (NOT blocky painted boxes!)
        const smoothFoliageGeo = new THREE.SphereGeometry(0.95, 14, 12);
        const tLowIM = new THREE.InstancedMesh(smoothFoliageGeo, tLeafLowMat, treeLeafLowMatrices.length);
        const tMidIM = new THREE.InstancedMesh(smoothFoliageGeo, tLeafMidMat, treeLeafMidMatrices.length);
        // Split top crowns across lush green, blooming pink cherry & golden gulmohar trees!
        const greenTops = [], pinkTops = [], goldTops = [];
        treeLeafTopMatrices.forEach((m, i) => {
          if (i % 5 === 0) pinkTops.push(m);
          else if (i % 5 === 2) goldTops.push(m);
          else greenTops.push(m);
        });
        treeTrunkMatrices.forEach((m, i) => tTrunkIM.setMatrixAt(i, m));
        treeLeafLowMatrices.forEach((m, i) => tLowIM.setMatrixAt(i, m));
        treeLeafMidMatrices.forEach((m, i) => tMidIM.setMatrixAt(i, m));
        scene.add(tTrunkIM, tLowIM, tMidIM);
        if (treeBranchMatrices.length) {
          const tBranchIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.28, 1, 7), tBarkMat, treeBranchMatrices.length);
          treeBranchMatrices.forEach((m, i) => tBranchIM.setMatrixAt(i, m));
          scene.add(tBranchIM);
        }
        if (greenTops.length) {
          const imG = new THREE.InstancedMesh(smoothFoliageGeo, new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.72 }), greenTops.length);
          greenTops.forEach((m, i) => imG.setMatrixAt(i, m)); scene.add(imG);
        }
        if (pinkTops.length) {
          const imP = new THREE.InstancedMesh(smoothFoliageGeo, tBlossomPinkMat, pinkTops.length);
          pinkTops.forEach((m, i) => imP.setMatrixAt(i, m)); scene.add(imP);
        }
        if (goldTops.length) {
          const imY = new THREE.InstancedMesh(smoothFoliageGeo, tBlossomGoldMat, goldTops.length);
          goldTops.forEach((m, i) => imY.setMatrixAt(i, m)); scene.add(imY);
        }
      }

      const crownGeo = new THREE.BoxGeometry(0.66, 0.15, 0.66);
      crownGeo.translate(0, 0.57, 0);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.55, roughness: 0.28 });
      bldgLists.forEach((list, sIdx) => {
        if (!list.length) return;
        const mat = facadeMats[sIdx];
        const im = new THREE.InstancedMesh(unitBox, [mat, mat, roofMat, roofMat, mat, mat], list.length);
        list.forEach((m, idx) => { im.setMatrixAt(idx, m); });
        scene.add(im);
      });
      if (bigCrownList.length) {
        const crownIM = new THREE.InstancedMesh(crownGeo, crownMat, bigCrownList.length);
        bigCrownList.forEach((m, idx) => crownIM.setMatrixAt(idx, m));
        scene.add(crownIM);
      }
      // Real 3D Sloped Pitched Villa Roofs (Terracotta Red-Tile & Royal Slate Blue!)
      const pitchedGeo = new THREE.ConeGeometry(0.76, 1, 4);
      if (pitchedRoofTerracotta.length) {
        const roofTerraMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.72, metalness: 0.12 });
        const pr1 = new THREE.InstancedMesh(pitchedGeo, roofTerraMat, pitchedRoofTerracotta.length);
        pitchedRoofTerracotta.forEach((m, idx) => pr1.setMatrixAt(idx, m));
        scene.add(pr1);
      }
      if (pitchedRoofDarkBlue.length) {
        const roofSlateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.62, metalness: 0.28 });
        const pr2 = new THREE.InstancedMesh(pitchedGeo, roofSlateMat, pitchedRoofDarkBlue.length);
        pitchedRoofDarkBlue.forEach((m, idx) => pr2.setMatrixAt(idx, m));
        scene.add(pr2);
      }

      const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
      const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });

      // AUTHENTIC DASHED WHITE RECTANGULAR LANE MARKINGS + ZEBRA CROSSINGS AT EVERY INTERSECTION (InstancedMesh = 60 FPS!)
      const dashMatrices = [];
      const zebraMatrices = [];
      const dObj = new THREE.Object3D();

      // Dashed white rectangular road center markings along main avenues (leaving intersections clean for zebra crossings!)
      for (let g = -12; g <= 12; g++) {
        const roadCoord = g * BLOCK_STEP;
        for (let seg = -12; seg <= 11; seg++) {
          const segStart = seg * BLOCK_STEP + 11;
          for (let step = 0; step < 3; step++) {
            const along = segStart + step * 11 + 4;
            // Z-axis road dashes
            dObj.position.set(roadCoord, 0.045, along);
            dObj.rotation.set(-Math.PI / 2, 0, 0);
            dObj.scale.set(0.42, 4.6, 1);
            dObj.updateMatrix();
            dashMatrices.push(dObj.matrix.clone());
            // X-axis road dashes
            dObj.position.set(along, 0.045, roadCoord);
            dObj.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
            dObj.scale.set(0.42, 4.6, 1);
            dObj.updateMatrix();
            dashMatrices.push(dObj.matrix.clone());
          }
        }
      }

      // Crisp White ZEBRA CROSSINGS on all 4 sides of city intersections!
      for (let ix = -5; ix <= 5; ix++) {
        for (let iz = -5; iz <= 5; iz++) {
          const rx = ix * BLOCK_STEP;
          const rz = iz * BLOCK_STEP;
          for (let bar = -2; bar <= 2; bar++) {
            const off = bar * 2.2;
            // North & South Zebra Crossings across Z-road
            [-8.8, 8.8].forEach((zOff) => {
              dObj.position.set(rx + off, 0.048, rz + zOff);
              dObj.rotation.set(-Math.PI / 2, 0, 0);
              dObj.scale.set(0.95, 3.2, 1);
              dObj.updateMatrix();
              zebraMatrices.push(dObj.matrix.clone());
            });
            // East & West Zebra Crossings across X-road
            [-8.8, 8.8].forEach((xOff) => {
              dObj.position.set(rx + xOff, 0.048, rz + off);
              dObj.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
              dObj.scale.set(0.95, 3.2, 1);
              dObj.updateMatrix();
              zebraMatrices.push(dObj.matrix.clone());
            });
          }
        }
      }

      const unitPlane = new THREE.PlaneGeometry(1, 1);
      if (dashMatrices.length) {
        const dashIM = new THREE.InstancedMesh(unitPlane, whiteLineMat, dashMatrices.length);
        dashMatrices.forEach((m, i) => dashIM.setMatrixAt(i, m));
        scene.add(dashIM);
      }
      if (zebraMatrices.length) {
        const zebraIM = new THREE.InstancedMesh(unitPlane, whiteLineMat, zebraMatrices.length);
        zebraMatrices.forEach((m, i) => zebraIM.setMatrixAt(i, m));
        scene.add(zebraIM);
      }

      // ORGANIC DIAGONAL AVENUES + CURVED RING-ROAD BOULEVARD (Breaks box grid into a real bustling city!)
      const diagRoadMat = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.64 });
      [Math.PI / 4, -Math.PI / 4].forEach((ang) => {
        const dRoad = new THREE.Mesh(new THREE.PlaneGeometry(16, 620), diagRoadMat);
        dRoad.rotation.x = -Math.PI / 2; dRoad.rotation.z = ang; dRoad.position.y = 0.025;
        const dLine = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 620), whiteLineMat);
        dLine.rotation.x = -Math.PI / 2; dLine.rotation.z = ang; dLine.position.y = 0.045;
        scene.add(dRoad, dLine);
      });

      // REAL WORKING 3D TRAFFIC SIGNALS AT CITY INTERSECTIONS (Red / Yellow / Green!)
      const sigPoleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.3 });
      const sigBoxMat = new THREE.MeshStandardMaterial({ color: 0x090d14, roughness: 0.5 });
      for (let sx = -3; sx <= 3; sx++) {
        for (let sz = -3; sz <= 3; sz++) {
          if ((Math.abs(sx) + Math.abs(sz)) % 2 !== 0) continue;
          const ix = sx * BLOCK_STEP;
          const iz = sz * BLOCK_STEP;
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 6.2, 8), sigPoleMat);
          pole.position.set(ix + 6.2, 3.1, iz + 6.2);
          const arm = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.18, 0.18), sigPoleMat);
          arm.position.set(ix + 4.4, 5.8, iz + 6.2);
          const housing = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.0, 0.75), sigBoxMat);
          housing.position.set(ix + 3.2, 5.5, iz + 6.2);
          const rMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
          const yMat = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
          const gMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
          const lRed = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), rMat); lRed.position.set(ix + 3.2, 6.1, iz + 6.2);
          const lYel = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), yMat); lYel.position.set(ix + 3.2, 5.5, iz + 6.2);
          const lGrn = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), gMat); lGrn.position.set(ix + 3.2, 4.9, iz + 6.2);
          scene.add(pole, arm, housing, lRed, lYel, lGrn);
          trafficSignals.push({ x: ix, z: iz, rMat, yMat, gMat, phaseOffset: (Math.abs(sx + sz) % 2) * 8 });
          // Exact tight collider for Traffic Signal Pole (no car pass-through, no magnetic forcefield!)
          const pCellKey = `${Math.floor((ix + 6.2) / BLOCK_STEP)},${Math.floor((iz + 6.2) / BLOCK_STEP)}`;
          const pArr = colliderGrid.get(pCellKey) || [];
          pArr.push({ minX: ix + 6.2 - 0.28, maxX: ix + 6.2 + 0.28, minZ: iz + 6.2 - 0.28, maxZ: iz + 6.2 + 0.28 });
          colliderGrid.set(pCellKey, pArr);
        }
      }

      // Sweeping Curved Ring-Road Boulevard & Scenic Turnings (Dubai / Hyderabad Outer Ring Road Style!)
      const ringRoadMat = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.65 });
      const ringRoad = new THREE.Mesh(new THREE.RingGeometry(290, 324, 84), ringRoadMat);
      ringRoad.rotation.x = -Math.PI / 2; ringRoad.position.y = 0.03;
      const ringLine = new THREE.Mesh(new THREE.RingGeometry(306.5, 307.4, 84), whiteLineMat);
      ringLine.rotation.x = -Math.PI / 2; ringLine.position.y = 0.05;
      scene.add(ringRoad, ringLine);

      // Central city kept clean & open + 3D ROAD BRIDGES OVER BOTH CENTRAL CANALS!
      const bridgeDeckMat = new THREE.MeshStandardMaterial({ color: 0x06080c, roughness: 0.65 });
      const bridgeRailMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.72, roughness: 0.25 });
      const bridgePillarMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
      const bridgeZones = [];
      const buildBridge = (bx, bz, alongX) => {
        const bg = new THREE.Group();
        bg.position.set(bx, 0, bz);
        if (!alongX) bg.rotation.y = Math.PI / 2;
        // Elevated smooth bridge deck (top surface at y = 0.52m) + smooth sloped entry/exit ramps on BOTH ends!
        const deck = new THREE.Mesh(new THREE.BoxGeometry(20, 0.42, 16.5), bridgeDeckMat);
        deck.position.y = 0.31;
        const rampGeoB = new THREE.BoxGeometry(6.2, 0.24, 16.5);
        const ramp1 = new THREE.Mesh(rampGeoB, bridgeDeckMat);
        ramp1.position.set(-12.8, 0.22, 0); ramp1.rotation.z = 0.085;
        const ramp2 = new THREE.Mesh(rampGeoB, bridgeDeckMat);
        ramp2.position.set(12.8, 0.22, 0); ramp2.rotation.z = -0.085;
        const rail1 = new THREE.Mesh(new THREE.BoxGeometry(22, 1.05, 0.4), bridgeRailMat); rail1.position.set(0, 1.05, -8.3);
        const rail2 = rail1.clone(); rail2.position.z = 8.3;
        const arch1 = new THREE.Mesh(new THREE.TorusGeometry(9.8, 0.32, 8, 22, Math.PI), bridgeRailMat);
        arch1.position.set(0, 0.55, -8.3);
        const arch2 = arch1.clone(); arch2.position.z = 8.3;
        const line = new THREE.Mesh(new THREE.PlaneGeometry(19.6, 0.42), whiteLineMat);
        line.rotation.x = -Math.PI / 2; line.position.y = 0.54;
        bg.add(deck, ramp1, ramp2, rail1, rail2, arch1, arch2, line);
        scene.add(bg);
        bridgeDeckZones.push({ bx, bz, alongX });
        // Solid Colliders on BOTH Bridge Side Walls / Rails (Zero clipping into black bridge edges!)
        const addBridgeWallCol = (cObj) => {
          const kSet = new Set([
            `${Math.floor(cObj.minX / BLOCK_STEP)},${Math.floor(cObj.minZ / BLOCK_STEP)}`,
            `${Math.floor(cObj.maxX / BLOCK_STEP)},${Math.floor(cObj.minZ / BLOCK_STEP)}`,
            `${Math.floor(cObj.minX / BLOCK_STEP)},${Math.floor(cObj.maxZ / BLOCK_STEP)}`,
            `${Math.floor(cObj.maxX / BLOCK_STEP)},${Math.floor(cObj.maxZ / BLOCK_STEP)}`
          ]);
          kSet.forEach((ck) => {
            const arr = colliderGrid.get(ck) || [];
            arr.push(cObj);
            colliderGrid.set(ck, arr);
          });
        };
        if (alongX) {
          addBridgeWallCol({ minX: bx - 14.5, maxX: bx + 14.5, minZ: bz - 8.75, maxZ: bz - 7.85 });
          addBridgeWallCol({ minX: bx - 14.5, maxX: bx + 14.5, minZ: bz + 7.85, maxZ: bz + 8.75 });
        } else {
          addBridgeWallCol({ minX: bx - 8.75, maxX: bx - 7.85, minZ: bz - 14.5, maxZ: bz + 14.5 });
          addBridgeWallCol({ minX: bx + 7.85, maxX: bx + 8.75, minZ: bz - 14.5, maxZ: bz + 14.5 });
        }
      };
      // Place Bridges across Canal 1 (North-South at x = 2*58 + 29 = 145) at every E-W road (z = g * 58)
      const canal1X = 2 * BLOCK_STEP + BLOCK_STEP / 2;
      for (let g = -9; g <= 10; g++) buildBridge(canal1X, g * BLOCK_STEP, true);
      // Place Bridges across Canal 2 (East-West at z = -2*58 + 29 = -87) at every N-S road (x = g * 58)
      const canal2Z = -2 * BLOCK_STEP + BLOCK_STEP / 2;
      for (let g = -9; g <= 10; g++) buildBridge(g * BLOCK_STEP, canal2Z, false);

      // DARK-GOLD `$` EMBLEM FLOATING COINS SPREAD ACROSS THE ENTIRE CITY MAP (-460m to +460m!)
      const coinGeo = new THREE.CylinderGeometry(1.55, 1.55, 0.36, 22);
      coinGeo.rotateX(Math.PI / 2);
      const coinTex = City3D.createCoinTexture ? City3D.createCoinTexture() : null;
      const coinRimMat = new THREE.MeshStandardMaterial({ color: 0xb45309, emissive: 0x78350f, emissiveIntensity: 0.45, metalness: 0.9, roughness: 0.18 });
      const coinFaceMat = coinTex
        ? new THREE.MeshStandardMaterial({ map: coinTex, emissive: 0xd97706, emissiveIntensity: 0.35, metalness: 0.72, roughness: 0.22 })
        : coinRimMat;
      const coinMats = [coinRimMat, coinFaceMat, coinFaceMat];
      const haloGeo = new THREE.RingGeometry(1.35, 1.95, 18);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
      for (let i = 0; i < 240; i++) {
        const lane = ((i % 21) - 10) * BLOCK_STEP; // Covers -460m to +460m across ALL roads!
        const along = ((Math.floor(i / 21) * 86) - 430) + ((i * 19) % 32);
        const cg = new THREE.Group();
        const coinDisc = new THREE.Mesh(coinGeo, coinMats);
        coinDisc.position.y = 1.65;
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.rotation.x = -Math.PI / 2;
        halo.position.y = 0.08;
        cg.add(coinDisc, halo);
        if (i % 2 === 0) cg.position.set(lane, 0, along);
        else cg.position.set(along, 0, lane);
        cg.userData = { active: true, respawnAt: 0, disc: coinDisc, phase: i * 0.5 };
        scene.add(cg); coinMeshes.push(cg);
      }

      // All stunt jump ramps removed — roads are 100% clean, flat & smooth!

      checkpointBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(2.8, 2.8, 30, 20, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
      );
      checkpointBeam.position.set(108, 15, -108);
      scene.add(checkpointBeam);

      const aiModels = [
        { modelType: 'car', bodyStyle: 'exotic_low', colorHex: 0xdc2626, accentHex: 0x111827 },
        { modelType: 'car', bodyStyle: 'sedan', colorHex: 0xf8fafc, accentHex: 0x0284c7 },
        { modelType: 'car', bodyStyle: 'muscle_blower', colorHex: 0xea580c, accentHex: 0x0f172a },
        { modelType: 'truck', bodyStyle: 'raptor_wide', colorHex: 0x1e293b, accentHex: 0xf59e0b },
        { modelType: 'car', bodyStyle: 'spyder_open', colorHex: 0x15803d, accentHex: 0xe2e8f0 },
        { modelType: 'truck', bodyStyle: 'safari_suv', colorHex: 0x2563eb, accentHex: 0xf8fafc }
      ];
      // LIVING CITY PROCESS: D-Mart & Mall Shoppers Walking Inside Open Doors -> Carrying Shopping Bags -> Boarding Yellow Taxi -> Driving Away!
      for (let l = 0; l < cityLandmarks.length; l++) {
        const lm = cityLandmarks[l];
        if (!lm.isWalkInShop) continue;
        const doorX = lm.x, doorZ = lm.doorZ || (lm.z + 8.5);
        const curbZ = lm.z + 17.5;
        const roadZ = Math.round(curbZ / BLOCK_STEP) * BLOCK_STEP;
        const taxi = buildYellowTaxi3D();
        taxi.position.set(doorX, 0, roadZ + 2.6);
        taxi.rotation.y = -Math.PI / 2;
        scene.add(taxi);

        const shopper = City3D.createWalkingHuman ? City3D.createWalkingHuman(l + 2) : new THREE.Group();
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.14), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 }));
        bag.position.set(0.36, 0.88, 0.08);
        bag.visible = false;
        shopper.add(bag);
        shopper.position.set(doorX - 5, 0.22, curbZ);
        scene.add(shopper);

        shopCycles.push({
          shopper, bag, taxi, doorL: lm.doorL, doorR: lm.doorR, doorBaseX: lm.doorBaseX,
          doorX, doorZ, curbZ, roadZ,
          phase: 'walk_in',
          timer: 0
        });
      }

      // Spawn 36 Animated 3D Walking Humans strolling along City Footpaths!
      if (City3D.createWalkingHuman) {
        for (let p = 0; p < 18; p++) {
          const human = City3D.createWalkingHuman(p);
          const axis = p % 2 === 0 ? 'z' : 'x';
          const dir = (p % 4 < 2) ? 1 : -1;
          const blockIdx = (p % 7) - 3;
          const sideEdge = blockIdx * BLOCK_STEP + (dir > 0 ? 5.3 : -5.3); // Strictly along road curb — NEVER inside buildings!
          const startPos = -240 + (p * 17) % 480;
          if (axis === 'z') {
            human.position.set(sideEdge, 0.22, startPos);
            human.rotation.y = dir > 0 ? 0 : Math.PI;
          } else {
            human.position.set(startPos, 0.22, sideEdge);
            human.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          }
          scene.add(human);
          walkingHumans.push({ mesh: human, axis, dir, speed: 2.2 + (p % 4) * 0.45, phase: p * 1.1, basePos: { x: human.position.x, z: human.position.z }, flying: false, vx: 0, vy: 0, vz: 0, respawnAt: 0 });
        }
      }

      // Spawn 42 Commuter AI Cars grouped in realistic 2-3 car platoons on signalized roads so 2-3 cars wait at Red Signals!
      const signalLanes = [-3, -2, -1, 0, 1, 2, 3];
      for (let t = 0; t < 20; t++) {
        const builtAI = City3D.buildVehicleMesh(aiModels[t % aiModels.length], null);
        const tMesh = builtAI.group;
        const axis = t % 2 === 0 ? 'z' : 'x';
        const dir = (t % 4 < 2) ? 1 : -1;
        const laneOffset = dir > 0 ? 2.75 : -2.75;
        const laneGrid = signalLanes[Math.floor(t / 6) % signalLanes.length];
        const lane = laneGrid * BLOCK_STEP + laneOffset;
        // Group cars in 2-3 car convoys ~11m apart so they queue up cleanly at Red Signals!
        const convoyIdx = t % 3;
        const baseAlong = -160 + (Math.floor(t / 3) * 34) % 320;
        const startAlong = baseAlong - convoyIdx * 10.5 * dir;
        if (axis === 'z') {
          tMesh.position.set(lane, 0, startAlong);
          tMesh.rotation.y = dir > 0 ? Math.PI : 0;
        } else {
          tMesh.position.set(startAlong, 0, lane);
          tMesh.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
        }
        scene.add(tMesh);
        trafficCars.push({ mesh: tMesh, wheels: builtAI.wheels, axis, dir, maxSpeed: 12 + (t % 4) * 2.5, curSpeed: 10 });
      }
    }

    if (playerGroup) scene.remove(playerGroup);
    const eq = vehicles.find((v) => v.id === state.equippedId) || vehicles[0];
    const built = City3D.buildVehicleMesh(eq, null);
    playerGroup = built.group;
    playerChassis = built.chassis || null;
    playerWheels = built.wheels;
    playerFrontPivots = built.frontWheelPivots || [];
    nitroFlames = attachBlueNitroFlames(playerGroup, built.flames);
    scene.add(playerGroup);
    if (!playerAvatar && (City3D.createPlayerAvatar || City3D.createWalkingHuman)) {
      playerAvatar = City3D.createPlayerAvatar ? City3D.createPlayerAvatar() : City3D.createWalkingHuman(1);
      playerAvatar.scale.setScalar(1.08);
      playerAvatar.visible = false;
      scene.add(playerAvatar);
    }
    isOnFoot = false;
    if (playerAvatar) playerAvatar.visible = false;
    if (typeof setControlModeUI === 'function') setControlModeUI(false);

    // ONLY for Vehicle #0 (2025 Koenigsegg Gemera): load & drive the exact real 3D FBX model in the 3D City!
    if (eq.id === 0 && eq.isRealFBX) {
      loadGemeraFBX((fbxBuilt) => {
        if (!fbxBuilt || state.equippedId !== 0) return;
        if (playerGroup) scene.remove(playerGroup);
        playerGroup = fbxBuilt.group;
        playerChassis = fbxBuilt.chassis;
        playerWheels = fbxBuilt.wheels;
        playerFrontPivots = fbxBuilt.frontWheelPivots;
        nitroFlames = fbxBuilt.flames;
        playerGroup.position.set(driveState.x, driveState.y || 0, driveState.z);
        playerGroup.rotation.y = driveState.heading;
        scene.add(playerGroup);
      });
    }

    driveState.x = 0; driveState.z = 0; driveState.heading = 0;
    driveState.speed = 0; driveState.steerInput = 0; driveState.targetSteer = 0;
    driveState.nitro = 100; driveState.health = 100; driveState.wrecked = false;
    updateHealthHUD();
    updateTaskUI();
  }


  // ================= REAL 3D ACCIDENT + FIRE ENGINE + AMBULANCE HOSPITAL RESCUE SYSTEM =================

  function attachBlueNitroFlames(group, existingFlames) {
    if (existingFlames && existingFlames.length > 0) {
      existingFlames.forEach((f) => {
        f.scale.set(1.35, 1.45, 1.35);
        if (f.material) { f.material.color.setHex(0x00f0ff); f.material.opacity = 0.95; }
      });
      return existingFlames;
    }
    const flames = [];
    const outerMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.92 });
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.96 });
    [-0.48, 0.48].forEach((fx) => {
      const fg = new THREE.Group();
      const outer = new THREE.Mesh(new THREE.ConeGeometry(0.19, 1.55, 10), outerMat);
      outer.rotation.x = Math.PI / 2;
      outer.position.z = 0.55;
      const core = new THREE.Mesh(new THREE.ConeGeometry(0.10, 1.05, 8), coreMat);
      core.rotation.x = Math.PI / 2;
      core.position.z = 0.35;
      fg.add(outer, core);
      fg.position.set(fx, 0.42, 2.38);
      fg.visible = false;
      group.add(fg);
      flames.push(fg);
    });
    return flames;
  }

  function buildPoliceCar3D() {
    const g = new THREE.Group();
    const blkMat = new THREE.MeshStandardMaterial({ color: 0x0b1120, metalness: 0.78, roughness: 0.18 });
    const whtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.35, roughness: 0.22 });
    const chrMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.12 });
    const glsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.85, roughness: 0.08, transparent: true, opacity: 0.78 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.88 });
    const bullMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.32 });

    // Sculpted Police Interceptor Sedan Chassis (Hood + Mid Body + Rear Trunk)
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.56, 4.95), blkMat);
    lowerBody.position.set(0, 0.54, 0);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.24, 1.55), blkMat);
    hood.position.set(0, 0.88, -1.55); hood.rotation.x = 0.08;
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.24, 1.15), blkMat);
    trunk.position.set(0, 0.88, 1.75);

    // Crisp White Police Side Doors with "POLICE" Side Decals!
    const pCan = document.createElement('canvas'); pCan.width = 256; pCan.height = 96;
    const pCtx = pCan.getContext('2d');
    pCtx.fillStyle = '#f8fafc'; pCtx.fillRect(0, 0, 256, 96);
    pCtx.fillStyle = '#1d4ed8'; pCtx.fillRect(0, 62, 256, 16);
    pCtx.fillStyle = '#0f172a'; pCtx.font = '900 44px Inter, sans-serif'; pCtx.textAlign = 'center'; pCtx.textBaseline = 'middle';
    pCtx.fillText('POLICE', 128, 36);
    const doorDecalMat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(pCan), roughness: 0.25, metalness: 0.25 });
    const doors = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.62, 2.05), [doorDecalMat, doorDecalMat, whtMat, whtMat, whtMat, whtMat]);
    doors.position.set(0, 0.66, 0.05);

    // Aerodynamic Cabin + Tinted Windshield & Rear Glass + White Roof
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.58, 2.28), glsMat);
    cabin.position.set(0, 1.24, 0.14);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.1, 1.65), whtMat);
    roof.position.set(0, 1.55, 0.16);

    // Side Mirrors
    [-1.12, 1.12].forEach((mx) => {
      const mir = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.26), blkMat);
      mir.position.set(mx, 1.06, -0.58);
      g.add(mir);
    });

    // Heavy-Duty Front Push Bumper / Bullbar + Front Grille + LED Headlights + Rear Tail Lights
    const bullBar = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.12, 0.16), bullMat);
    bullBar.position.set(0, 0.68, -2.56);
    const bullLow = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.12, 0.16), bullMat);
    bullLow.position.set(0, 0.36, -2.56);
    [-0.55, 0.55].forEach((bx) => {
      const bPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.52, 0.22), bullMat);
      bPost.position.set(bx, 0.52, -2.52);
      g.add(bPost);
    });
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.26, 0.08), chrMat);
    grille.position.set(0, 0.58, -2.48);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    [-0.78, 0.78].forEach((lx) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.1), hlMat);
      hl.position.set(lx, 0.62, -2.47);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.18, 0.1), tlMat);
      tl.position.set(lx, 0.66, 2.47);
      g.add(hl, tl);
    });

    // Sleek Aerodynamic Roof LED Lightbar (Red / White Center / Blue Strobing Beacons!)
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.08, 0.34), bullMat);
    barBase.position.set(0, 1.62, 0.08);
    const barR = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.30), new THREE.MeshBasicMaterial({ color: 0xff1e1e }));
    barR.position.set(-0.42, 1.72, 0.08);
    const barC = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.15, 0.28), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
    barC.position.set(0, 1.72, 0.08);
    const barB = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.30), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    barB.position.set(0.42, 1.72, 0.08);

    // Police Radio Whip Antenna on Rear Trunk
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.95, 6), chrMat);
    ant.position.set(0.68, 1.45, 2.05);

    g.add(lowerBody, hood, trunk, doors, cabin, roof, bullBar, bullLow, grille, barBase, barR, barC, barB, ant);

    // 4 Detailed 3D Wheels with Metallic Silver Alloy Rims
    const pWheels = [];
    [[-1.08, -1.52], [1.08, -1.52], [-1.08, 1.52], [1.08, 1.52]].forEach(([wx, wz]) => {
      const wg = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 16), tireMat);
      tire.rotation.z = Math.PI / 2;
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.34, 12), chrMat);
      rim.rotation.z = Math.PI / 2;
      wg.add(tire, rim);
      wg.position.set(wx, 0.42, wz);
      g.add(wg);
      pWheels.push(wg);
    });
    g.userData = { barR, barB, wheels: pWheels };
    return g;
  }

  function buildYellowTaxi3D() {
    const g = new THREE.Group();
    const yelMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.52, roughness: 0.18 });
    const blkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 });
    const chrMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.12 });
    const glsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, metalness: 0.82, roughness: 0.08, transparent: true, opacity: 0.78 });
    // Sculpted Taxi Sedan Body (Lower Chassis + Hood + Trunk + Glossy Roof)
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.56, 4.72), yelMat); body.position.y = 0.52;
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.22, 1.45), yelMat); hood.position.set(0, 0.86, -1.48); hood.rotation.x = 0.07;
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.22, 1.05), yelMat); trunk.position.set(0, 0.86, 1.68);
    // Crisp Checkered Black/White Taxi Side Stripe
    const tCan = document.createElement('canvas'); tCan.width = 256; tCan.height = 48;
    const tCtx = tCan.getContext('2d');
    tCtx.fillStyle = '#facc15'; tCtx.fillRect(0, 0, 256, 48);
    for (let i = 0; i < 16; i++) {
      tCtx.fillStyle = i % 2 === 0 ? '#0f172a' : '#f8fafc';
      tCtx.fillRect(i * 16, 14, 16, 10);
      tCtx.fillStyle = i % 2 === 1 ? '#0f172a' : '#f8fafc';
      tCtx.fillRect(i * 16, 24, 16, 10);
    }
    const checkMat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(tCan), roughness: 0.25 });
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.10, 0.24, 4.45), [checkMat, checkMat, yelMat, yelMat, yelMat, yelMat]);
    stripe.position.y = 0.56;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.56, 2.15), glsMat); cabin.position.set(0, 1.20, 0.12);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.09, 1.55), yelMat); roof.position.set(0, 1.50, 0.14);
    const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.26), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    taxiSign.position.set(0, 1.64, 0.08);
    // Chrome Grille + Headlights + Taillights + Side Mirrors
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.24, 0.08), chrMat); grille.position.set(0, 0.54, -2.37);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    [-0.76, 0.76].forEach((lx) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.08), hlMat); hl.position.set(lx, 0.58, -2.37);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), tlMat); tl.position.set(lx, 0.62, 2.37);
      const mir = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.12, 0.22), yelMat); mir.position.set(lx * 1.42, 1.02, -0.52);
      g.add(hl, tl, mir);
    });
    g.add(body, hood, trunk, stripe, cabin, roof, taxiSign, grille);
    [[-1.04, -1.42], [1.04, -1.42], [-1.04, 1.42], [1.04, 1.42]].forEach(([wx, wz]) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.30, 14), blkMat); tire.rotation.z = Math.PI / 2; tire.position.set(wx, 0.39, wz);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.32, 10), chrMat); rim.rotation.z = Math.PI / 2; rim.position.set(wx, 0.39, wz);
      g.add(tire, rim);
    });
    return g;
  }

  function pushOutOfBuildings(x, z, rad, isVehicle = false) {
    let rx = x, rz = z, hit = false;
    // Vehicles (player car, police cars) can NEVER drive inside walk-in shop interiors!
    if (isVehicle) {
      for (let li = 0; li < cityLandmarks.length; li++) {
        const lm = cityLandmarks[li];
        if (!lm.isWalkInShop) continue;
        const sMinX = lm.minX - 0.8 - rad, sMaxX = lm.maxX + 0.8 + rad;
        const sMinZ = lm.minZ - 0.8 - rad, sMaxZ = lm.maxZ + 1.2 + rad;
        if (rx > sMinX && rx < sMaxX && rz > sMinZ && rz < sMaxZ) {
          hit = true;
          const penL = Math.abs(rx - sMinX), penR = Math.abs(sMaxX - rx);
          const penT = Math.abs(rz - sMinZ), penB = Math.abs(sMaxZ - rz);
          const mPen = Math.min(penL, penR, penT, penB);
          if (mPen === penL) rx = sMinX;
          else if (mPen === penR) rx = sMaxX;
          else if (mPen === penT) rz = sMinZ;
          else rz = sMaxZ;
        }
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      const cGX = Math.floor(rx / BLOCK_STEP), cGZ = Math.floor(rz / BLOCK_STEP);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oz = -1; oz <= 1; oz++) {
          const nb = colliderGrid.get(`${cGX + ox},${cGZ + oz}`);
          if (!nb) continue;
          for (let bi = 0; bi < nb.length; bi++) {
            const b = nb[bi];
            if (b.disabled) continue;
            const clX = Math.max(b.minX, Math.min(rx, b.maxX));
            const clZ = Math.max(b.minZ, Math.min(rz, b.maxZ));
            const ddx = rx - clX, ddz = rz - clZ;
            const dSq = ddx * ddx + ddz * ddz;
            if (dSq < rad * rad) {
              hit = true;
              if (dSq > 0.00001) {
                const distC = Math.sqrt(dSq);
                rx = clX + (ddx / distC) * rad;
                rz = clZ + (ddz / distC) * rad;
              } else {
                const penL = Math.abs(rx - b.minX), penR = Math.abs(b.maxX - rx);
                const penT = Math.abs(rz - b.minZ), penB = Math.abs(b.maxZ - rz);
                const mPen = Math.min(penL, penR, penT, penB);
                if (mPen === penL) rx = b.minX - rad;
                else if (mPen === penR) rx = b.maxX + rad;
                else if (mPen === penT) rz = b.minZ - rad;
                else rz = b.maxZ + rad;
              }
            }
          }
        }
      }
    }
    return { x: rx, z: rz, hit };
  }

  function spawnPoliceChase(now) {
    // ONLY 1 SINGLE POLICE CAR — chases for 10 seconds with live top countdown timer, then leaves automatically!
    if (policeUnits.length >= 1) {
      policeUnits[0].expiresAt = now + 10000; // Refresh 10s timer if another hit occurs
      return;
    }
    const h = driveState.heading;
    const fwdX = -Math.sin(h), fwdZ = -Math.cos(h);
    const pc = buildPoliceCar3D();
    const rawX = driveState.x - fwdX * 30;
    const rawZ = driveState.z - fwdZ * 30;
    const safePos = pushOutOfBuildings(rawX, rawZ, 2.8, true);
    pc.position.set(safePos.x, 0, safePos.z);
    pc.rotation.y = h;
    scene.add(pc);
    policeUnits.push({
      mesh: pc, spawnAt: now, expiresAt: now + 10000, lastHorn: 0,
      role: 'pursuer', slotFwd: -9.5, slotSide: 0, heading: h, speed: 16
    });
    const ptEl = document.getElementById('policeTimerEl');
    if (ptEl) { ptEl.classList.remove('hidden'); ptEl.textContent = '🚓 POLICE: 10s'; }
    if (Audio) { if (Audio.playSiren) Audio.playSiren(); if (Audio.startHorn) Audio.startHorn(); }
    showDriveAlert('★ POLICE CHASE! SURVIVE 10 SECONDS! 🚓', 'bg-blue-600 text-white');
  }


  function buildTowTruck3D() {
    const g = new THREE.Group();
    const orgMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.45, roughness: 0.25 });
    const blkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 });
    const glsMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, metalness: 0.55, roughness: 0.1, transparent: true, opacity: 0.62 });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.9, 2.4), orgMat); cab.position.set(0, 1.35, -1.8);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.35, 3.8), blkMat); bed.position.set(0, 0.72, 1.2);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 3.2), orgMat); boom.position.set(0, 1.85, 1.6); boom.rotation.x = 0.42;
    const ws = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 0.18), glsMat); ws.position.set(0, 1.75, -3.0);
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 0.28), new THREE.MeshBasicMaterial({ color: 0xfacc15 })); beacon.position.set(0, 2.42, -1.8);
    g.add(cab, bed, boom, ws, beacon);
    [[-1.2, -1.8], [1.2, -1.8], [-1.2, 1.8], [1.2, 1.8]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.38, 14), blkMat);
      w.rotation.z = Math.PI / 2; w.position.set(wx, 0.48, wz); g.add(w);
    });
    return g;
  }

  function buildFireEngine3D() {
    const g = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.45, roughness: 0.22 });
    const darkRed = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.4, roughness: 0.3 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.10 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x0369a1, emissiveIntensity: 0.25, metalness: 0.55, roughness: 0.08, transparent: true, opacity: 0.65 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1e1e });

    // Sculpted Front Crew Cab + Taller Rear Equipment Body + Chrome Roll-Up Compartment Shutters
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.25, 2.65), redMat); cab.position.set(0, 1.62, -2.35);
    const rearBody = new THREE.Mesh(new THREE.BoxGeometry(2.60, 2.15, 4.55), redMat); rearBody.position.set(0, 1.58, 1.25);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.24, 7.25), whiteMat); stripe.position.set(0, 1.26, -0.05);
    const shutterL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.25, 3.6), chromeMat); shutterL.position.set(-1.31, 1.55, 1.25);
    const shutterR = shutterL.clone(); shutterR.position.x = 1.31;
    // Wrap Windshield + Chrome Front Bumper + Grille + Headlights + Taillights + Side Mirrors
    const ws = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.88, 0.16), glassMat); ws.position.set(0, 2.12, -3.66);
    const sideWinL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.72, 1.85), glassMat); sideWinL.position.set(-1.26, 2.10, -2.25);
    const sideWinR = sideWinL.clone(); sideWinR.position.x = 1.26;
    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(2.72, 0.42, 0.42), chromeMat); bumperF.position.set(0, 0.68, -3.78);
    const grilleF = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.65, 0.14), chromeMat); grilleF.position.set(0, 1.22, -3.68);
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.12), headMat); hl1.position.set(-0.98, 1.12, -3.70);
    const hl2 = hl1.clone(); hl2.position.x = 0.98;
    const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.55, 0.12), tailMat); tl1.position.set(-1.05, 1.18, 3.55);
    const tl2 = tl1.clone(); tl2.position.x = 1.05;
    // Detailed Telescoping Aluminum Roof Ladder with Rungs + Side Hose Reel
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 5.6), chromeMat); railL.position.set(-0.42, 2.86, 0.65);
    const railR = railL.clone(); railR.position.x = 0.42;
    for (let r = -2.2; r <= 2.4; r += 0.65) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.10), chromeMat);
      rung.position.set(0, 2.86, 0.65 + r); g.add(rung);
    }
    const beaconR = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.24, 0.34), new THREE.MeshBasicMaterial({ color: 0xff1e1e }));
    beaconR.position.set(-0.62, 2.88, -2.75);
    const beaconB = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.24, 0.34), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    beaconB.position.set(0.62, 2.88, -2.75);
    g.add(cab, rearBody, stripe, shutterL, shutterR, ws, sideWinL, sideWinR, bumperF, grilleF, hl1, hl2, tl1, tl2, railL, railR, beaconR, beaconB);
    // 6 Heavy-Duty Fire Truck Wheels with Chrome Rims
    [[-1.34, -2.35], [1.34, -2.35], [-1.34, 1.15], [1.34, 1.15], [-1.34, 2.45], [1.34, 2.45]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.44, 18), tireMat); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.56, wz);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.46, 14), chromeMat); rim.rotation.z = Math.PI / 2; rim.position.set(wx, 0.56, wz);
      g.add(w, rim);
    });
    g.userData = { beaconR, beaconB };
    return g;
  }

  function buildAmbulance3D() {
    const g = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.22, roughness: 0.22 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.3, roughness: 0.28 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.12 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x0284c7, emissiveIntensity: 0.28, metalness: 0.55, roughness: 0.08, transparent: true, opacity: 0.65 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1e1e });

    // Sculpted Sloped Van Nose + Front Cab + Taller Rear Medical Box Module!
    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.95, 1.45), whiteMat); hood.position.set(0, 0.95, -2.55);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.16, 1.85, 1.45), whiteMat); cab.position.set(0, 1.42, -1.35);
    const medBox = new THREE.Mesh(new THREE.BoxGeometry(2.38, 2.22, 3.65), whiteMat); medBox.position.set(0, 1.62, 1.15);
    const redStripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.26, 3.68), redMat); redStripe.position.set(0, 1.05, 1.15);
    const redFront = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.22, 2.65), redMat); redFront.position.set(0, 0.95, -1.92);
    // Bold Red Cross Emblems on Both Sides + Rear Double Medical Doors
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.26, 0.95), redMat); crossH.position.set(0, 1.88, 1.15);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.95, 0.26), redMat); crossV.position.set(0, 1.88, 1.15);
    const rearSeam = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.85, 0.08), chromeMat); rearSeam.position.set(0, 1.55, 2.98);
    // Raked Windshield + Cab Side Windows + Bumper + Headlights + Taillights
    const ws = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.82, 0.14), glassMat); ws.position.set(0, 1.82, -2.06); ws.rotation.x = -0.28;
    const swL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.65, 1.05), glassMat); swL.position.set(-1.08, 1.82, -1.35);
    const swR = swL.clone(); swR.position.x = 1.08;
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.32, 0.28), chromeMat); bumper.position.set(0, 0.56, -3.28);
    const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.20, 0.12), headMat); hl1.position.set(-0.82, 1.02, -3.26);
    const hl2 = hl1.clone(); hl2.position.x = 0.82;
    const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.52, 0.10), tailMat); tl1.position.set(-0.96, 1.25, 2.98);
    const tl2 = tl1.clone(); tl2.position.x = 0.96;
    // Full-Width Flashing Roof Lightbar
    const beaconR = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.30), new THREE.MeshBasicMaterial({ color: 0xff1e1e }));
    beaconR.position.set(-0.52, 2.84, -0.35);
    const beaconB = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.30), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    beaconB.position.set(0.52, 2.84, -0.35);
    g.add(hood, cab, medBox, redStripe, redFront, crossH, crossV, rearSeam, ws, swL, swR, bumper, hl1, hl2, tl1, tl2, beaconR, beaconB);
    [[-1.18, -2.1], [1.18, -2.1], [-1.22, 1.75], [1.22, 1.75]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.36, 18), tireMat); w.rotation.z = Math.PI / 2; w.position.set(wx, 0.46, wz);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.38, 14), chromeMat); rim.rotation.z = Math.PI / 2; rim.position.set(wx, 0.46, wz);
      g.add(w, rim);
    });
    g.userData = { beaconR, beaconB };
    return g;
  }

  function triggerTrafficAccident(trafficCar, now, shopCycleRef = null) {
    if (trafficCar.wrecked) return;
    trafficCar.wrecked = true;
    trafficCar.curSpeed = 0;
    if (shopCycleRef) shopCycleRef.wreckedTaxi = true;

    // Knock the hit car/taxi sideways onto the road & tilt it realistically!
    const rawAx = trafficCar.mesh.position.x + (Math.random() > 0.5 ? 2.2 : -2.2);
    const rawAz = trafficCar.mesh.position.z + (Math.random() > 0.5 ? 2.2 : -2.2);
    const safeWreck = pushOutOfBuildings(rawAx, rawAz, 2.2, true);
    const ax = safeWreck.x, az = safeWreck.z;
    trafficCar.mesh.position.set(ax, 0.22, az);
    trafficCar.mesh.rotation.z = 0.58;
    trafficCar.mesh.rotation.y += 0.7;

    // 1. Live 3D Burning Fire Flames + Rising Smoke Cloud on the wrecked car/taxi!
    const fireGroup = new THREE.Group();
    fireGroup.position.set(ax, 0.9, az);
    const flames = [];
    const flameColors = [0xff4500, 0xff8c00, 0xfacc15];
    for (let f = 0; f < 6; f++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.55 + (f % 3) * 0.22, 2.2 + (f % 2) * 0.9, 8),
        new THREE.MeshBasicMaterial({ color: flameColors[f % 3], transparent: true, opacity: 0.88 })
      );
      cone.position.set((f - 2.5) * 0.35, 0.8, ((f % 3) - 1) * 0.4);
      fireGroup.add(cone);
      flames.push(cone);
    }
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.55 });
    const smokePuffs = [];
    for (let s = 0; s < 4; s++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.75 + s * 0.18, 8, 8), smokeMat);
      puff.position.set((s - 1.5) * 0.3, 2.4 + s * 0.9, 0);
      fireGroup.add(puff);
      smokePuffs.push(puff);
    }
    scene.add(fireGroup);

    // 2. Victim FLIES OUT of the crashed car/taxi onto the road!
    const victim = City3D.createWalkingHuman ? City3D.createWalkingHuman(Math.floor(Math.random() * 8)) : new THREE.Group();
    const roadX = Math.round(ax / BLOCK_STEP) * BLOCK_STEP;
    const roadZ = Math.round(az / BLOCK_STEP) * BLOCK_STEP;
    const alongZ = Math.abs(ax - roadX) <= Math.abs(az - roadZ);
    const vx = alongZ ? roadX + 2.6 : ax + 3.2;
    const vz = alongZ ? az + 3.2 : roadZ + 2.6;
    victim.position.set(ax, 1.4, az);
    victim.rotation.x = Math.PI / 2;
    scene.add(victim);

    // 3. STRICT ROAD CONVOY: Fire Engine IN FRONT on the road + Ambulance RIGHT BEHIND Fire Engine on the EXACT SAME ROAD!
    const laneCoord = alongZ ? (roadX - 2.4) : (roadZ - 2.4);
    const fireTruck = buildFireEngine3D();
    const ftStart = alongZ ? { x: laneCoord, z: az - 52 } : { x: ax - 52, z: laneCoord };
    const ftStop  = alongZ ? { x: laneCoord, z: az - 7.5 } : { x: ax - 7.5, z: laneCoord };
    const ftExit  = alongZ ? { x: laneCoord, z: az + 85 } : { x: ax + 85, z: laneCoord };
    fireTruck.position.set(ftStart.x, 0, ftStart.z);
    scene.add(fireTruck);

    const waterJet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.42, 6.2, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.82 })
    );
    waterJet.rotation.z = alongZ ? 0 : Math.PI / 2;
    waterJet.rotation.x = alongZ ? Math.PI / 2 : 0;
    waterJet.position.set((ftStop.x + ax) * 0.5, 1.8, (ftStop.z + az) * 0.5);
    waterJet.visible = false;
    scene.add(waterJet);

    // Ambulance spawns RIGHT BEHIND Fire Engine on the exact same road lane!
    const ambulance = buildAmbulance3D();
    const ambStart = alongZ ? { x: laneCoord, z: az - 68 } : { x: ax - 68, z: laneCoord };
    const ambWait  = alongZ ? { x: laneCoord, z: az - 18.5 } : { x: ax - 18.5, z: laneCoord };
    const ambStop  = alongZ ? { x: roadX + 2.4, z: vz - 3.6 } : { x: vx - 3.6, z: roadZ + 2.4 };
    ambulance.position.set(ambStart.x, 0, ambStart.z);
    scene.add(ambulance);

    // Find nearest + HOSPITAL road intersection for clean L-shaped road delivery!
    let hospitalTarget = { x: -BLOCK_STEP, z: 0 };
    let bestD = Infinity;
    for (let l = 0; l < cityLandmarks.length; l++) {
      if (cityLandmarks[l].tag === 'H') {
        const hx = Math.round(cityLandmarks[l].x / BLOCK_STEP) * BLOCK_STEP;
        const hz = Math.round(cityLandmarks[l].z / BLOCK_STEP) * BLOCK_STEP;
        const d = Math.hypot(hx - ax, hz - az);
        if (d < bestD) { bestD = d; hospitalTarget = { x: hx, z: hz }; }
      }
    }
    const ambWaypoints = alongZ
      ? [{ x: roadX + 2.4, z: hospitalTarget.z }, { x: hospitalTarget.x, z: hospitalTarget.z }]
      : [{ x: hospitalTarget.x, z: roadZ + 2.4 }, { x: hospitalTarget.x, z: hospitalTarget.z }];

    if (Audio) { Audio.playCrash(); if (Audio.playSiren) Audio.playSiren(); }
    showDriveAlert((shopCycleRef ? 'TAXI ACCIDENT! ' : 'HIGH-SPEED ACCIDENT! ') + 'FIRE ENGINE & AMBULANCE CONVOY ON ROAD! 🚒🚑', 'bg-rose-600 text-white');

    const firefighter = City3D.createWalkingHuman ? City3D.createWalkingHuman(0) : new THREE.Group();
    firefighter.position.set(ftStop.x + 1.8, 0.22, ftStop.z); firefighter.visible = false; scene.add(firefighter);

    const stretcherGroup = new THREE.Group();
    const m1 = City3D.createWalkingHuman ? City3D.createWalkingHuman(2) : new THREE.Group(); m1.position.set(0, 0, -1.1);
    const m2 = City3D.createWalkingHuman ? City3D.createWalkingHuman(2) : new THREE.Group(); m2.position.set(0, 0, 1.1);
    const bedMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.14, 2.0), new THREE.MeshStandardMaterial({ color: 0xf8fafc })); bedMesh.position.y = 0.85;
    stretcherGroup.add(m1, m2, bedMesh);
    stretcherGroup.position.set(ambStop.x, 0.22, ambStop.z); stretcherGroup.visible = false; scene.add(stretcherGroup);

    const towTruck = buildTowTruck3D();
    const towStart = alongZ ? { x: laneCoord, z: az - 82 } : { x: ax - 82, z: laneCoord };
    towTruck.position.set(towStart.x, 0, towStart.z); towTruck.visible = false; scene.add(towTruck);

    emergencyEvents.push({
      trafficCar, shopCycleRef, ax, az, vx, vz, victimFlyT: 0,
      firefighter, stretcherGroup, towTruck,
      fireGroup, flames, smokePuffs, waterJet,
      victim, fireTruck, ambulance, hospitalTarget,
      ftStop, ftExit, ambWait, ambStop, ambWaypoints, ambWpIdx: 0,
      phase: 'dispatch',
      phaseTimer: 0,
      fireScale: 1.0
    });
  }

  function updateTaskUI() {
    const task = cityTasks[state.taskIndex % cityTasks.length];
    taskRewardBadge.textContent = `+${task.reward} C`;
    let pct = 0;
    if (task.type === 'coins') {
      pct = Math.min(100, (taskProgress / task.target) * 100);
      taskTitleEl.textContent = `${task.label} (${Math.min(taskProgress, task.target)}/${task.target})`;
    } else if (task.type === 'speed') {
      pct = Math.min(100, (taskProgress / task.target) * 100);
      taskTitleEl.textContent = `${task.label} (${Math.floor(taskProgress)}/${task.target})`;
    } else if (task.type === 'checkpoint' || task.type === 'garage') {
      pct = taskProgress >= 1 ? 100 : 15;
      taskTitleEl.textContent = task.label;
    } else {
      pct = Math.min(100, (taskProgress / task.target) * 100);
      taskTitleEl.textContent = `${task.label} (${Math.floor(taskProgress)}/${task.target}m)`;
    }
    taskProgressBar.style.width = pct + '%';
  }

  function completeCurrentTask() {
    const task = cityTasks[state.taskIndex % cityTasks.length];
    state.coins += task.reward;
    state.taskIndex += 1;
    gainXP(150);
    if (Audio) Audio.playReadyChime();
    showDriveAlert(`TASK COMPLETE! +${task.reward} COINS`);
    taskProgress = 0;
    if (checkpointBeam) {
      const spots = [[108, -108], [-162, 108], [-108, -162], [162, 162]];
      const next = spots[state.taskIndex % spots.length];
      checkpointBeam.position.set(next[0], 15, next[1]);
    }
    updateTaskUI();
  }

  function drawMiniMap() {
    const ctx = miniMapCanvas.getContext('2d');
    const w = miniMapCanvas.width, h = miniMapCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#090f1d';
    ctx.fillRect(0, 0, w, h);
    const scale = 0.20, cx = w / 2, cy = h / 2;

    // Draw City Road Grid Lines on Box GPS Map
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 2;
    const baseGX = Math.floor(driveState.x / BLOCK_STEP);
    const baseGZ = Math.floor(driveState.z / BLOCK_STEP);
    for (let g = -5; g <= 5; g++) {
      const rx = cx + ((baseGX + g) * BLOCK_STEP - driveState.x) * scale;
      const rz = cy + ((baseGZ + g) * BLOCK_STEP - driveState.z) * scale;
      ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, rz); ctx.lineTo(w, rz); ctx.stroke();
    }

    // Lakes
    ctx.fillStyle = '#0ea5e9';
    for (const lk of lakeZones) {
      const dx = (lk.cx - driveState.x) * scale, dz = (lk.cz - driveState.z) * scale;
      if (Math.abs(dx) < cx + 6 && Math.abs(dz) < cy + 6) {
        ctx.beginPath(); ctx.arc(cx + dx, cy + dz, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Repair Garages (Green squares)
    ctx.fillStyle = '#10b981';
    for (const g of serviceGarages) {
      const dx = (g.x - driveState.x) * scale, dz = (g.z - driveState.z) * scale;
      if (Math.abs(dx) < cx && Math.abs(dz) < cy) ctx.fillRect(cx + dx - 3, cy + dz - 3, 6, 6);
    }

    // Branded Shops & Landmarks on GPS Map (H=Hospital, D=D-Mart, M=Mall, O=Office, F=Fuel, S=Cafe)
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const lm of cityLandmarks) {
      const dx = Math.max(-cx + 8, Math.min(cx - 8, (lm.x - driveState.x) * scale));
      const dz = Math.max(-cy + 8, Math.min(cy - 8, (lm.z - driveState.z) * scale));
      ctx.fillStyle = lm.color;
      ctx.fillRect(cx + dx - 5.5, cy + dz - 5.5, 11, 11);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(lm.tag, cx + dx, cy + dz + 0.5);
    }

    // Live Traffic Signal Dots (Red/Green)
    for (const sg of trafficSignals) {
      const dx = (sg.x - driveState.x) * scale, dz = (sg.z - driveState.z) * scale;
      if (Math.abs(dx) < cx && Math.abs(dz) < cy) {
        ctx.fillStyle = sg.zGreen ? '#22c55e' : '#ef4444';
        ctx.fillRect(cx + dx - 1.5, cy + dz - 1.5, 3, 3);
      }
    }

    // AI Commuter Traffic Dots
    ctx.fillStyle = '#cbd5e1';
    for (const tc of trafficCars) {
      const dx = (tc.mesh.position.x - driveState.x) * scale, dz = (tc.mesh.position.z - driveState.z) * scale;
      if (Math.abs(dx) < cx && Math.abs(dz) < cy) ctx.fillRect(cx + dx - 1.5, cy + dz - 1.5, 3, 3);
    }

    // Coins
    ctx.fillStyle = '#facc15';
    for (const c of coinMeshes) {
      if (!c.userData.active) continue;
      const dx = (c.position.x - driveState.x) * scale, dz = (c.position.z - driveState.z) * scale;
      if (Math.abs(dx) < cx && Math.abs(dz) < cy) {
        ctx.beginPath(); ctx.arc(cx + dx, cy + dz, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Checkpoint Beacon
    if (checkpointBeam) {
      const dx = Math.max(-cx + 6, Math.min(cx - 6, (checkpointBeam.position.x - driveState.x) * scale));
      const dz = Math.max(-cy + 6, Math.min(cy - 6, (checkpointBeam.position.z - driveState.z) * scale));
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath(); ctx.arc(cx + dx, cy + dz, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Live Fire Engine (Red) & Ambulance (White-Red) icons on Box GPS Map!
    for (const ev of emergencyEvents) {
      const fdx = (ev.fireTruck.position.x - driveState.x) * scale, fdz = (ev.fireTruck.position.z - driveState.z) * scale;
      if (Math.abs(fdx) < cx && Math.abs(fdz) < cy) { ctx.fillStyle = '#ff1e1e'; ctx.fillRect(cx + fdx - 3, cy + fdz - 3, 6, 6); }
      const adx = (ev.ambulance.position.x - driveState.x) * scale, adz = (ev.ambulance.position.z - driveState.z) * scale;
      if (Math.abs(adx) < cx && Math.abs(adz) < cy) { ctx.fillStyle = '#ffffff'; ctx.fillRect(cx + adx - 3, cy + adz - 3, 6, 6); }
    }

    // Live Police Cruisers (Flashing Blue/Red) on Box GPS Map!
    for (const pu of policeUnits) {
      const pdx = (pu.mesh.position.x - driveState.x) * scale, pdz = (pu.mesh.position.z - driveState.z) * scale;
      if (Math.abs(pdx) < cx && Math.abs(pdz) < cy) {
        ctx.fillStyle = (Math.floor(performance.now() / 160) % 2 === 0) ? '#2563eb' : '#ef4444';
        ctx.fillRect(cx + pdx - 5, cy + pdz - 5, 10, 10);
        ctx.fillStyle = '#ffffff'; ctx.fillText('P', cx + pdx, cy + pdz + 0.5);
      }
    }

    // Player Car Direction Arrow
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-driveState.heading);
    ctx.fillStyle = '#f97316';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, -6.5); ctx.lineTo(5, 5.5); ctx.lineTo(-5, 5.5); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  let lastFrameTime = performance.now();
  function cityLoop(now) {
    cityRafId = requestAnimationFrame(cityLoop);
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (driveState.wrecked) {
      if (Audio) Audio.updateEngine(0, false, false, 0);
      renderer.render(scene, camera);
      return;
    }

    const eq = vehicles.find((v) => v.id === state.equippedId) || vehicles[0];
    const lvBonus = ((state.level || 1) - 1) * 2.5;
    const maxSpeed = isOnFoot ? 11 : (28 + ((eq.speed + (state.upgradeLevels.engine - 1) * 2.5) / 100) * 24 + lvBonus);
    const accelRate = 19 + ((eq.accel + (state.upgradeLevels.engine - 1) * 2.5) / 100) * 18 + lvBonus * 0.45;
    // Speed-sensitive precision steering (tight turns at low speed, rock-steady stability at highway speed!)
    const speedRatio = Math.min(1, Math.abs(driveState.speed) / maxSpeed);
    const turnRate = (2.15 + ((eq.handle + (state.upgradeLevels.tires - 1) * 3) / 100) * 0.85) * (1.05 - speedRatio * 0.32);

    const gasOn = !isOnFoot && (driveState.gas || driveState.keys.w);
    const brakeOn = !isOnFoot && (driveState.brake || driveState.keys.s);
    const nitroOn = !isOnFoot && (driveState.boost || driveState.keys.shift) && driveState.nitro > 3;

    if (nitroOn) { driveState.nitro = Math.max(0, driveState.nitro - 26 * dt); driveState._wasNitro = true; }
    else { if (driveState._wasNitro && Audio && Audio.playTurboPshh) Audio.playTurboPshh(); driveState._wasNitro = false; driveState.nitro = Math.min(100, driveState.nitro + 14 * dt); }

    for (const f of nitroFlames) {
      f.visible = nitroOn;
      if (nitroOn) f.scale.y = 0.8 + Math.random() * 0.6;
    }

    const nitroMult = 1.30 + Math.min(0.32, ((state.upgradeLevels.nitro - 1) * 0.03) + ((state.level || 1) - 1) * 0.03);
    const effectiveMax = nitroOn ? maxSpeed * nitroMult : maxSpeed;
    if (gasOn || nitroOn) driveState.speed += (nitroOn ? accelRate * 1.72 : accelRate) * dt;
    else if (brakeOn) driveState.speed -= accelRate * 1.5 * dt;
    else {
      driveState.speed *= Math.pow(0.28, dt);
      if (Math.abs(driveState.speed) < 0.25) driveState.speed = 0;
    }
    driveState.speed = Math.max(-18, Math.min(effectiveMax, driveState.speed));

    let keySteer = 0;
    if (driveState.keys.a) keySteer += 1;
    if (driveState.keys.d) keySteer -= 1;
    const desiredSteer = driveState.wheelDragging ? driveState.targetSteer : keySteer;
    driveState.steerInput += (desiredSteer - driveState.steerInput) * Math.min(1, (driveState.wheelDragging ? 14 : 9) * dt);
    // Smooth return to 0° ONLY after finger is released! While holding, stays at exact full-rotation wheelAngleDeg!
    if (!driveState.wheelDragging) {
      driveState.wheelAngleDeg = (driveState.wheelAngleDeg || 0) * Math.pow(0.015, dt);
      if (Math.abs(driveState.wheelAngleDeg) < 0.8) driveState.wheelAngleDeg = 0;
    }
    const visualWheelDeg = driveState.wheelDragging ? (driveState.wheelAngleDeg || 0) : (driveState.wheelAngleDeg || (-driveState.steerInput * 110));
    steeringWheelSvg.style.transform = `rotate(${visualWheelDeg.toFixed(1)}deg)`;

    if (Audio && !isOnFoot) Audio.updateEngine(Math.abs(driveState.speed) / maxSpeed, nitroOn, brakeOn, driveState.steerInput);

    if (Math.abs(driveState.speed) > 0.5) {
      const dirSign = driveState.speed >= 0 ? 1 : -1;
      const speedFactor = Math.min(1, Math.abs(driveState.speed) / 12);
      driveState.heading += driveState.steerInput * turnRate * speedFactor * dirSign * dt;
    }

    const prevX = driveState.x, prevZ = driveState.z;
    const dx = -Math.sin(driveState.heading) * driveState.speed * dt;
    const dz = -Math.cos(driveState.heading) * driveState.speed * dt;
    let nextX = prevX + dx;
    let nextZ = prevZ + dz;
    // Seamless Endless 100+ KM Metropolis Wrap (never stops at a dead wall!)
    if (nextX > CITY_BOUND) nextX -= CITY_BOUND * 2;
    else if (nextX < -CITY_BOUND) nextX += CITY_BOUND * 2;
    if (nextZ > CITY_BOUND) nextZ -= CITY_BOUND * 2;
    else if (nextZ < -CITY_BOUND) nextZ += CITY_BOUND * 2;

    // 3x3 Spatial Grid Collision Check (Zero clipping through trees, buildings, or canal fences across cell borders!)
    let collided = false;
    const cellX = Math.floor(nextX / BLOCK_STEP);
    const cellZ = Math.floor(nextZ / BLOCK_STEP);
    outerColl:
    for (let ox = -1; ox <= 1; ox++) {
      for (let oz = -1; oz <= 1; oz++) {
        const nearby = colliderGrid.get(`${cellX + ox},${cellZ + oz}`);
        if (!nearby) continue;
        for (let i = 0; i < nearby.length; i++) {
          const b = nearby[i];
          if (b.disabled) continue;
          if (nextX > b.minX && nextX < b.maxX && nextZ > b.minZ && nextZ < b.maxZ) {
            collided = true;
            if (prevX <= b.minX || prevX >= b.maxX) nextX = prevX;
            if (prevZ <= b.minZ || prevZ >= b.maxZ) nextZ = prevZ;
            break outerColl;
          }
        }
      }
    }

    let pushDx = 0, pushDz = 0;
    if (!isOnFoot) {
      const rawNx = nextX, rawNz = nextZ;
      const safeCar = pushOutOfBuildings(nextX, nextZ, 0.88, true);
      if (safeCar.hit) {
        pushDx = safeCar.x - rawNx;
        pushDz = safeCar.z - rawNz;
        nextX = safeCar.x;
        nextZ = safeCar.z;
        collided = true;
      }
    }

    if (collided) {
      const impactSpeed = Math.abs(driveState.speed);
      // Realistic Physics: Side graze slides smoothly past trees/poles/walls (ZERO N-to-N magnet bounce!); only head-on hits brake cleanly!
      const pLen = Math.hypot(pushDx, pushDz);
      const fwdX = -Math.sin(driveState.heading) * (driveState.speed >= 0 ? 1 : -1);
      const fwdZ = -Math.cos(driveState.heading) * (driveState.speed >= 0 ? 1 : -1);
      const headOn = pLen > 0.001 ? Math.abs((pushDx / pLen) * fwdX + (pushDz / pLen) * fwdZ) : 0.7;
      if (headOn < 0.48) {
        // Smooth side glide along tree, pole, bridge wall or building!
        driveState.speed *= 0.86;
      } else {
        // Clean head-on stop (never violently reverses car backward like a magnet!)
        driveState.speed *= 0.12;
      }
      if (headOn >= 0.48 && impactSpeed > 11 && now - driveState.lastCrashAt > 550) {
        driveState.lastCrashAt = now;
        const dmg = Math.min(30, Math.max(8, Math.round(impactSpeed * 0.42)));
        driveState.health = Math.max(0, driveState.health - dmg);
        updateHealthHUD();
        if (Audio) Audio.playCrash();
        crashFlash.style.opacity = '1';
        setTimeout(() => { crashFlash.style.opacity = '0'; }, 160);
        showDriveAlert(`CRASH! -${dmg}% HEALTH`, 'bg-rose-600/95 text-white');
        if (driveState.health <= 0) {
          driveState.wrecked = true;
          openModal(`
            <div class="text-center">
              <h3 class="font-display text-xl font-black text-rose-400 mb-2">CAR WRECKED!</h3>
              <p class="text-xs text-slate-300 mb-4">Your vehicle took heavy damage from crashing into buildings. Repair it to continue!</p>
              <button id="repairWreckBtn" type="button" class="w-full py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer">Repair Vehicle (Free Respawn)</button>
            </div>
          `);
          document.getElementById('repairWreckBtn').addEventListener('click', () => {
            driveState.health = 100; driveState.speed = 0; driveState.x = 0; driveState.z = 0;
            driveState.wrecked = false; updateHealthHUD(); closeModal();
          });
        }
      }
    }

    for (const lk of lakeZones) {
      if (Math.hypot(nextX - lk.cx, nextZ - lk.cz) < lk.r) driveState.speed *= Math.pow(0.15, dt);
    }

    for (const g of serviceGarages) {
      if (Math.hypot(nextX - g.x, nextZ - g.z) < 7.2 && now > g.cooldownUntil) {
        g.cooldownUntil = now + 5000;
        driveState.health = 100; driveState.nitro = 100;
        updateHealthHUD(); if (Audio) Audio.playReadyChime();
        showDriveAlert('GARAGE REPAIR: 100% HEALTH!', 'bg-emerald-500/95 text-slate-950');
        const curT = cityTasks[state.taskIndex % cityTasks.length];
        if (curT && curT.type === 'garage') completeCurrentTask();
      }
    }

    driveState.x = nextX; driveState.z = nextZ;
    const rawStep = Math.hypot(dx, dz);
    const stepDist = rawStep;
    totalKmDriven += rawStep / 320;
    const odoEl = document.getElementById('odometerKmEl');
    if (odoEl) odoEl.textContent = totalKmDriven.toFixed(1) + ' KM / 100+ KM';

    // SOLID COLLISION WITH ALL VEHICLES IN CITY (Traffic Cars, Wrecked Cars, Police Cars, Yellow Taxis, Fire Engine, Ambulance & Tow Truck — ZERO pass-through!)
    if (!isOnFoot) {
      // 1. Emergency Vehicles (Fire Engine, Ambulance, Tow Truck)
      for (let eIdx = 0; eIdx < emergencyEvents.length; eIdx++) {
        const ev = emergencyEvents[eIdx];
        [ev.fireTruck, ev.ambulance, ev.towTruck].forEach((emVeh) => {
          if (!emVeh || !emVeh.visible || emVeh === playerGroup) return;
          const dEm = Math.hypot(driveState.x - emVeh.position.x, driveState.z - emVeh.position.z);
          if (dEm < 4.35) {
            const ang = Math.atan2(driveState.x - emVeh.position.x, driveState.z - emVeh.position.z);
            driveState.x = emVeh.position.x + Math.sin(ang) * 4.55;
            driveState.z = emVeh.position.z + Math.cos(ang) * 4.55;
            driveState.speed = -driveState.speed * 0.35;
            if (Audio) Audio.playCrash();
          }
        });
      }
      // 2. Police Cars (Solid crash/bump — never pass through!)
      for (let pi = 0; pi < policeUnits.length; pi++) {
        const pu = policeUnits[pi];
        if (pu.stolen || pu.mesh === playerGroup) continue;
        const dP = Math.hypot(driveState.x - pu.mesh.position.x, driveState.z - pu.mesh.position.z);
        if (dP < 4.2) {
          const ang = Math.atan2(driveState.x - pu.mesh.position.x, driveState.z - pu.mesh.position.z);
          driveState.x = pu.mesh.position.x + Math.sin(ang) * 4.35;
          driveState.z = pu.mesh.position.z + Math.cos(ang) * 4.35;
          const pSafe = pushOutOfBuildings(pu.mesh.position.x - Math.sin(ang) * 0.6, pu.mesh.position.z - Math.cos(ang) * 0.6, 2.2);
          pu.mesh.position.x = pSafe.x; pu.mesh.position.z = pSafe.z;
          driveState.speed = -driveState.speed * 0.35;
          pu.speed = Math.max(0, (pu.speed || 10) * 0.35);
          if (Audio) Audio.playCrash();
        }
      }
      // 3. Shop Yellow Taxis (Minimum 40 km/h -> Accident + Victim Flies Out + Fire + Rescue; Slow touch -> Gently separate sideways!)
      const MIN_CRASH_SPD = 40 / 2.6; // 40 km/h threshold
      for (let si = 0; si < shopCycles.length; si++) {
        const sc = shopCycles[si];
        const tx = sc.taxi;
        if (!tx || tx === playerGroup) continue;
        const dTx = Math.hypot(driveState.x - tx.position.x, driveState.z - tx.position.z);
        if (dTx < 4.1) {
          const ang = Math.atan2(driveState.x - tx.position.x, driveState.z - tx.position.z);
          const impactSpd = Math.abs(driveState.speed);
          if (impactSpd >= MIN_CRASH_SPD && !sc.wreckedTaxi) {
            driveState.x = tx.position.x + Math.sin(ang) * 4.4;
            driveState.z = tx.position.z + Math.cos(ang) * 4.4;
            driveState.speed *= 0.2;
            const dmg = Math.min(25, Math.max(8, Math.round(impactSpd * 0.45)));
            driveState.health = Math.max(0, driveState.health - dmg);
            updateHealthHUD();
            crashFlash.style.opacity = '1'; setTimeout(() => { crashFlash.style.opacity = '0'; }, 180);
            triggerTrafficAccident({ mesh: tx, wrecked: false, curSpeed: 0, axis: 'x' }, now, sc);
          } else {
            // Slow touch (< 40 km/h): gently nudge both cars sideways apart — NO damage, NO accident!
            driveState.x = tx.position.x + Math.sin(ang) * 4.25;
            driveState.z = tx.position.z + Math.cos(ang) * 4.25;
            tx.position.x -= Math.sin(ang) * 0.35;
            tx.position.z -= Math.cos(ang) * 0.35;
            driveState.speed *= 0.72;
          }
        }
      }
      // 4. All AI Traffic Cars (Minimum 40 km/h -> Accident + Fire + Rescue; Slow touch -> Gently separate sideways!)
      for (let ti = 0; ti < trafficCars.length; ti++) {
        const tc = trafficCars[ti];
        if (tc.mesh === playerGroup) continue;
        const dTc = Math.hypot(driveState.x - tc.mesh.position.x, driveState.z - tc.mesh.position.z);
        if (dTc < 4.15) {
          const ang = Math.atan2(driveState.x - tc.mesh.position.x, driveState.z - tc.mesh.position.z);
          const impactSpd = Math.abs(driveState.speed);
          if (!tc.wrecked && impactSpd >= MIN_CRASH_SPD) {
            driveState.x = tc.mesh.position.x + Math.sin(ang) * 4.4;
            driveState.z = tc.mesh.position.z + Math.cos(ang) * 4.4;
            driveState.speed *= 0.2;
            const dmg = Math.min(25, Math.max(8, Math.round(impactSpd * 0.45)));
            driveState.health = Math.max(0, driveState.health - dmg);
            updateHealthHUD();
            crashFlash.style.opacity = '1'; setTimeout(() => { crashFlash.style.opacity = '0'; }, 180);
            triggerTrafficAccident(tc, now);
          } else {
            // Slow touch (< 40 km/h): gently push both cars slightly apart — NO accident!
            driveState.x = tc.mesh.position.x + Math.sin(ang) * 4.25;
            driveState.z = tc.mesh.position.z + Math.cos(ang) * 4.25;
            tc.mesh.position.x -= Math.sin(ang) * 0.35;
            tc.mesh.position.z -= Math.cos(ang) * 0.35;
            driveState.speed *= 0.72;
          }
        }
      }
    }

    // 1. SMOOTH DOOR-OPEN EXIT / ENTER / GTA CAR-JACK ANIMATION
    if (vehicleAnim && playerAvatar) {
      vehicleAnim.t += dt;
      const p = Math.min(1, vehicleAnim.t / vehicleAnim.dur);
      const ease = p * (2 - p);
      // Animate avatar stepping out or climbing smoothly into driver seat
      const ax = vehicleAnim.startX + (vehicleAnim.endX - vehicleAnim.startX) * ease;
      const az = vehicleAnim.startZ + (vehicleAnim.endZ - vehicleAnim.startZ) * ease;
      playerAvatar.position.set(ax, 0.22 + Math.sin(p * Math.PI) * 0.25, az);
      playerAvatar.rotation.y = vehicleAnim.heading + (vehicleAnim.type === 'exit' ? Math.PI * 0.5 : -Math.PI * 0.5);
      // Slight car door/chassis rock as door opens & closes!
      if (playerChassis) playerChassis.rotation.z = Math.sin(p * Math.PI) * 0.06;
      // Toss pulled-out NPC driver sideways onto the street!
      if (vehicleAnim.tossedNpc) {
        const npc = vehicleAnim.tossedNpc;
        npc.position.x = vehicleAnim.endX + Math.cos(vehicleAnim.heading) * (3.8 * ease);
        npc.position.z = vehicleAnim.endZ - Math.sin(vehicleAnim.heading) * (3.8 * ease);
        npc.position.y = 0.22 + Math.sin(p * Math.PI) * 1.1;
        npc.rotation.z = p * 1.4;
      }
      if (p >= 1) {
        if (playerChassis) playerChassis.rotation.z = 0;
        if (vehicleAnim.type === 'exit') {
          isOnFoot = true;
          driveState.x = vehicleAnim.endX; driveState.z = vehicleAnim.endZ;
          setControlModeUI(true);
        } else {
          if (vehicleAnim.tossedNpc) {
            const npcRef = vehicleAnim.tossedNpc;
            setTimeout(() => { try { scene.remove(npcRef); } catch (e) {} }, 2500);
          }
          if (vehicleAnim.targetRef.type === 'traffic' && vehicleAnim.targetRef.car) {
            const tc = vehicleAnim.targetRef.car;
            const idx = trafficCars.indexOf(tc);
            if (idx !== -1) trafficCars.splice(idx, 1);
            playerGroup = tc.mesh; playerChassis = tc.mesh; playerWheels = tc.wheels || [];
            playerFrontPivots = []; nitroFlames = attachBlueNitroFlames(playerGroup, []);
          } else if (vehicleAnim.targetRef.type === 'special' && vehicleAnim.targetRef.mesh) {
            if (vehicleAnim.targetRef.policeObj) vehicleAnim.targetRef.policeObj.stolen = true;
            if (vehicleAnim.targetRef.emEvent && vehicleAnim.targetRef.emFlag) vehicleAnim.targetRef.emEvent[vehicleAnim.targetRef.emFlag] = true;
            if (vehicleAnim.targetRef.shopCycle) vehicleAnim.targetRef.shopCycle.stolenTaxi = true;
            if (vehicleAnim.targetRef.parkedObj) {
              vehicleAnim.targetRef.parkedObj.stolen = true;
              if (vehicleAnim.targetRef.parkedObj.colliderRef) vehicleAnim.targetRef.parkedObj.colliderRef.disabled = true;
            }
            playerGroup = vehicleAnim.targetRef.mesh;
            playerGroup.rotation.x = 0; playerGroup.rotation.z = 0; playerGroup.position.y = 0;
            playerChassis = null; // Never tilt root mesh into the ground!
            playerWheels = (vehicleAnim.targetRef.parkedObj && vehicleAnim.targetRef.parkedObj.wheels) ? vehicleAnim.targetRef.parkedObj.wheels : [];
            playerFrontPivots = []; nitroFlames = attachBlueNitroFlames(playerGroup, []);
            showDriveAlert('DRIVING ' + vehicleAnim.targetRef.label + '!', 'bg-cyan-400 text-slate-950');
          }
          driveState.x = vehicleAnim.endX; driveState.z = vehicleAnim.endZ; driveState.heading = vehicleAnim.heading;
          isOnFoot = false; driveState.speed = 0;
          if (playerGroup && playerGroup.userData && playerGroup.userData.rider) playerGroup.userData.rider.visible = true;
          playerAvatar.visible = false;
          setControlModeUI(false);
          const eqNow = vehicles.find((v) => v.id === state.equippedId) || vehicles[0];
          if (Audio) { Audio.startEngine(eqNow.modelType); Audio.playIgnition(); }
        }
        vehicleAnim = null;
      }
    } else if (isOnFoot && playerAvatar) {
      // DEDICATED HUMAN ON-FOOT CONTROLS (Holding RUN directly sprints forward automatically — no joystick drag required! + REAL ATHLETIC JUMP!)
      let inX = footState.joyX;
      let inY = footState.joyY;
      if (driveState.keys.w) inY -= 1;
      if (driveState.keys.s) inY += 1;
      if (driveState.keys.a) inX -= 1;
      if (driveState.keys.d) inX += 1;
      // Direct RUN Button: automatically sprints forward even when joystick isn't touched!
      const isSprintPressed = footState.running || driveState.keys.shift;
      if (isSprintPressed && Math.hypot(inX, inY) < 0.1) {
        inY = -1; // Straight forward in camera direction!
      }
      const mag = Math.min(1, Math.hypot(inX, inY));
      const moveSpd = footState.pose === 'prone' ? 2.6 : footState.pose === 'crouch' ? 4.2 : (isSprintPressed ? 14.5 : 7.0);

      if (mag > 0.08) {
        const camYaw = driveState.heading + driveState.camOrbitYaw;
        const moveAng = camYaw + Math.atan2(-inX, -inY);
        const fdx = -Math.sin(moveAng) * moveSpd * mag * dt;
        const fdz = -Math.cos(moveAng) * moveSpd * mag * dt;
        let fx = driveState.x + fdx;
        let fz = driveState.z + fdz;
        // 2-Pass Circle-vs-AABB Push-Out (Glides smoothly past every shop wall, doorway, cash counter & stand — ZERO glitching!)
        const resolvedFoot = pushOutOfBuildings(fx, fz, 0.52);
        fx = resolvedFoot.x;
        fz = resolvedFoot.z;
        // Solid on-foot collision against Police Cars & Yellow Taxis too!
        for (let pi = 0; pi < policeUnits.length; pi++) {
          const pm = policeUnits[pi].mesh;
          const dP = Math.hypot(fx - pm.position.x, fz - pm.position.z);
          if (dP < 2.6) { const pa = Math.atan2(fx - pm.position.x, fz - pm.position.z); fx = pm.position.x + Math.sin(pa) * 2.65; fz = pm.position.z + Math.cos(pa) * 2.65; }
        }
        // Solid on-foot separation against ALL NPC Humans (Street + Indoor Mall Crowd) — ZERO walking through people!
        for (let hi = 0; hi < walkingHumans.length; hi++) {
          const hm = walkingHumans[hi].mesh;
          const dH = Math.hypot(fx - hm.position.x, fz - hm.position.z);
          if (dH < 1.05 && dH > 0.001) { fx = hm.position.x + ((fx - hm.position.x) / dH) * 1.05; fz = hm.position.z + ((fz - hm.position.z) / dH) * 1.05; }
        }
        for (let ii = 0; ii < indoorShoppers.length; ii++) {
          const im = indoorShoppers[ii].mesh;
          const dI = Math.hypot(fx - im.position.x, fz - im.position.z);
          if (dI < 1.05 && dI > 0.001) { fx = im.position.x + ((fx - im.position.x) / dI) * 1.05; fz = im.position.z + ((fz - im.position.z) / dI) * 1.05; }
        }
        for (let si = 0; si < shopCycles.length; si++) {
          const tx = shopCycles[si].taxi;
          const dTx = Math.hypot(fx - tx.position.x, fz - tx.position.z);
          if (dTx < 2.5) { const pa = Math.atan2(fx - tx.position.x, fz - tx.position.z); fx = tx.position.x + Math.sin(pa) * 2.55; fz = tx.position.z + Math.cos(pa) * 2.55; }
        }
        // Solid collision against YOUR OWN parked car (cannot walk inside it!)
        const dOwnCar = Math.hypot(fx - parkedCarPos.x, fz - parkedCarPos.z);
        if (dOwnCar < 2.55) {
          const pa0 = Math.atan2(fx - parkedCarPos.x, fz - parkedCarPos.z);
          fx = parkedCarPos.x + Math.sin(pa0) * 2.6;
          fz = parkedCarPos.z + Math.cos(pa0) * 2.6;
        }
        // Solid collision against ALL AI traffic cars (Moving car KNOCKS player back if you step in front of it!)
        for (let ti = 0; ti < trafficCars.length; ti++) {
          const tc = trafficCars[ti];
          const dCar = Math.hypot(fx - tc.mesh.position.x, fz - tc.mesh.position.z);
          if (dCar < 2.75) {
            const pa = Math.atan2(fx - tc.mesh.position.x, fz - tc.mesh.position.z);
            fx = tc.mesh.position.x + Math.sin(pa) * 2.9;
            fz = tc.mesh.position.z + Math.cos(pa) * 2.9;
            if (tc.curSpeed > 4 && now > footState.knockedUntil) {
              footState.knockedUntil = now + 900;
              footState.kvx = Math.sin(pa) * 10;
              footState.kvz = Math.cos(pa) * 10;
              if (Audio) Audio.playCrash();
              showDriveAlert('HIT BY MOVING CAR! WATCH OUT! 💥', 'bg-rose-600 text-white');
            }
          }
        }
        driveState.x = fx;
        driveState.z = fz;
        playerAvatar.rotation.y = moveAng + Math.PI;
      }

      // REAL ATHLETIC HUMAN JUMP PHYSICS + ARTICULATED KNEE/ELBOW/TORSO ANIMATION!
      if (footState.jumping) {
        footState.y += footState.vy * dt;
        footState.vy -= 27 * dt;
        if (footState.y <= 0.22) {
          footState.y = 0.22; footState.vy = 0; footState.jumping = false;
          footState.landTimer = 0.16; // Soft knee-bend landing impact!
        }
      } else if (footState.landTimer > 0) {
        footState.landTimer = Math.max(0, footState.landTimer - dt);
      }

      playerAvatar.position.set(driveState.x, footState.y, driveState.z);
      const u = playerAvatar.userData;
      if (u && u.legL) {
        if (footState.jumping) {
          // Real Mid-Air Athletic Jump Pose: knees tucked forward, calves bent back, arms raised up!
          if (u.bodyRoot) { u.bodyRoot.position.y = 0; u.bodyRoot.rotation.x = 0.22; }
          u.legL.rotation.x = -0.95; u.legR.rotation.x = -0.45;
          if (u.kneeL) u.kneeL.rotation.x = 1.35;
          if (u.kneeR) u.kneeR.rotation.x = 0.85;
          u.armL.rotation.x = -2.15; u.armR.rotation.x = -1.85;
          if (u.elbowL) u.elbowL.rotation.x = -0.55;
          if (u.elbowR) u.elbowR.rotation.x = -0.55;
        } else if (footState.landTimer > 0) {
          // Soft Athletic Knee-Bend Landing Cushion!
          if (u.bodyRoot) { u.bodyRoot.position.y = -0.14; u.bodyRoot.rotation.x = 0.18; }
          u.legL.rotation.x = -0.55; u.legR.rotation.x = -0.55;
          if (u.kneeL) u.kneeL.rotation.x = 0.95;
          if (u.kneeR) u.kneeR.rotation.x = 0.95;
          u.armL.rotation.x = 0.35; u.armR.rotation.x = 0.35;
        } else if (mag > 0.08 && footState.pose === 'prone') {
          // REALISTIC SLOW PRONE CRAWLING ANIMATION!
          const cr = Math.sin(now * 0.008) * 0.45;
          if (u.bodyRoot) { u.bodyRoot.position.y = 0.24; u.bodyRoot.rotation.x = Math.PI / 2; }
          u.legL.rotation.x = cr; u.legR.rotation.x = -cr;
          if (u.kneeL) u.kneeL.rotation.x = 0.35; if (u.kneeR) u.kneeR.rotation.x = 0.35;
          u.armL.rotation.x = -2.4 + cr; u.armR.rotation.x = -2.4 - cr;
          if (u.elbowL) u.elbowL.rotation.x = -0.6; if (u.elbowR) u.elbowR.rotation.x = -0.6;
        } else if (mag > 0.08 && footState.pose === 'crouch') {
          // REALISTIC SLOW CROUCH-WALKING ANIMATION!
          const cw = Math.sin(now * 0.009) * 0.48;
          if (u.bodyRoot) { u.bodyRoot.position.y = -0.32; u.bodyRoot.rotation.x = 0.24; }
          u.legL.rotation.x = -0.85 + cw; u.legR.rotation.x = -0.85 - cw;
          if (u.kneeL) u.kneeL.rotation.x = 1.35; if (u.kneeR) u.kneeR.rotation.x = 1.35;
          u.armL.rotation.x = -0.4 - cw * 0.6; u.armR.rotation.x = -0.4 + cw * 0.6;
          if (u.elbowL) u.elbowL.rotation.x = -0.7; if (u.elbowR) u.elbowR.rotation.x = -0.7;
        } else if (mag > 0.08) {
          // Smooth Realistic Running / Walking Stride with Knee & Elbow Bend + Slight Bounce!
          const freq = isSprintPressed ? 0.016 : 0.011;
          const phase = now * freq;
          const sw = Math.sin(phase) * (isSprintPressed ? 0.88 : 0.52);
          if (u.bodyRoot) {
            u.bodyRoot.position.y = Math.abs(Math.sin(phase)) * (isSprintPressed ? 0.10 : 0.04);
            u.bodyRoot.rotation.x = isSprintPressed ? 0.16 : 0.05;
          }
          u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
          if (u.kneeL) u.kneeL.rotation.x = Math.max(0.05, -sw * 1.15);
          if (u.kneeR) u.kneeR.rotation.x = Math.max(0.05, sw * 1.15);
          u.armL.rotation.x = -sw * 0.95; u.armR.rotation.x = sw * 0.95;
          if (u.elbowL) u.elbowL.rotation.x = isSprintPressed ? -1.1 : -0.45;
          if (u.elbowR) u.elbowR.rotation.x = isSprintPressed ? -1.1 : -0.45;
        } else if (footState.pose === 'prone') {
          // Lying Flat Prone Pose (Free Fire Style!)
          if (u.bodyRoot) { u.bodyRoot.position.y = 0.25; u.bodyRoot.rotation.x = Math.PI / 2; }
          u.legL.rotation.x = 0; u.legR.rotation.x = 0;
          if (u.kneeL) u.kneeL.rotation.x = 0; if (u.kneeR) u.kneeR.rotation.x = 0;
          u.armL.rotation.x = -2.6; u.armR.rotation.x = -2.6;
        } else if (footState.pose === 'crouch') {
          // Low Tactical Crouch / Sitting Pose!
          if (u.bodyRoot) { u.bodyRoot.position.y = -0.34; u.bodyRoot.rotation.x = 0.22; }
          u.legL.rotation.x = -1.05; u.legR.rotation.x = -0.85;
          if (u.kneeL) u.kneeL.rotation.x = 1.45; if (u.kneeR) u.kneeR.rotation.x = 1.25;
          u.armL.rotation.x = -0.45; u.armR.rotation.x = -0.45;
          if (u.elbowL) u.elbowL.rotation.x = -0.7; if (u.elbowR) u.elbowR.rotation.x = -0.7;
        } else {
          // Clean Idle Breathing Stance
          if (u.bodyRoot) { u.bodyRoot.position.y = Math.sin(now * 0.003) * 0.015; u.bodyRoot.rotation.x = 0; }
          u.legL.rotation.x = 0; u.legR.rotation.x = 0;
          if (u.kneeL) u.kneeL.rotation.x = 0;
          if (u.kneeR) u.kneeR.rotation.x = 0;
          u.armL.rotation.x = 0; u.armR.rotation.x = 0;
          if (u.elbowL) u.elbowL.rotation.x = -0.08;
          if (u.elbowR) u.elbowR.rotation.x = -0.08;
        }
      }

      // DYNAMIC NEAREST-CAR PROXIMITY CHECK: Show ENTER CAR button ONLY when within 5.5m of YOUR parked car OR ANY AI traffic car!
      nearbyVehicleRef = null;
      let bestDist = 7.8;
      const dOwn = Math.hypot(driveState.x - parkedCarPos.x, driveState.z - parkedCarPos.z);
      if (dOwn < bestDist) {
        bestDist = dOwn;
        nearbyVehicleRef = { type: 'own' };
      }
      for (let ti = 0; ti < trafficCars.length; ti++) {
        const tc = trafficCars[ti];
        if (tc.wrecked) continue;
        const dT = Math.hypot(driveState.x - tc.mesh.position.x, driveState.z - tc.mesh.position.z);
        if (dT < bestDist) {
          bestDist = dT;
          nearbyVehicleRef = { type: 'traffic', car: tc };
          if (dT < 6.5) tc.curSpeed *= 0.75; // Car slows down so player can easily hop in!
        }
      }
      // ALSO allow entering & driving POLICE CARS, AMBULANCES, FIRE ENGINES & YELLOW TAXIS!
      for (let pi = 0; pi < policeUnits.length; pi++) {
        const pu = policeUnits[pi];
        if (pu.stolen) continue;
        const dP = Math.hypot(driveState.x - pu.mesh.position.x, driveState.z - pu.mesh.position.z);
        if (dP < bestDist) { bestDist = dP; nearbyVehicleRef = { type: 'special', mesh: pu.mesh, label: 'POLICE CAR 🚓', policeObj: pu }; }
      }
      for (let ei = 0; ei < emergencyEvents.length; ei++) {
        const ev = emergencyEvents[ei];
        [
          { m: ev.ambulance, lbl: 'AMBULANCE 🚑', flag: 'stolenAmb' },
          { m: ev.fireTruck, lbl: 'FIRE ENGINE 🚒', flag: 'stolenFire' }
        ].forEach(({ m, lbl, flag }) => {
          if (!m || !m.visible) return;
          const dE = Math.hypot(driveState.x - m.position.x, driveState.z - m.position.z);
          if (dE < bestDist) { bestDist = dE; nearbyVehicleRef = { type: 'special', mesh: m, label: lbl, emEvent: ev, emFlag: flag }; }
        });
      }
      for (let si = 0; si < shopCycles.length; si++) {
        const tx = shopCycles[si].taxi;
        const dTx = Math.hypot(driveState.x - tx.position.x, driveState.z - tx.position.z);
        if (dTx < bestDist) { bestDist = dTx; nearbyVehicleRef = { type: 'special', mesh: tx, label: 'YELLOW TAXI 🚕', shopCycle: shopCycles[si] }; }
      }
      // ALSO allow entering & driving ANY Car or Bike parked outside D-Mart & all other shops!
      for (let pk = 0; pk < parkedShopVehicles.length; pk++) {
        const pv = parkedShopVehicles[pk];
        if (pv.stolen || pv.mesh === playerGroup) continue;
        const dPk = Math.hypot(driveState.x - pv.mesh.position.x, driveState.z - pv.mesh.position.z);
        if (dPk < bestDist) {
          bestDist = dPk;
          nearbyVehicleRef = { type: 'special', mesh: pv.mesh, label: pv.label, parkedObj: pv };
        }
      }
      const enterNearBtn = document.getElementById('enterNearCarBtn');
      if (enterNearBtn) {
        enterNearBtn.classList.toggle('hidden', !nearbyVehicleRef);
        enterNearBtn.classList.toggle('flex', Boolean(nearbyVehicleRef));
      }

      // Keep parked car at its exact spot
      playerGroup.position.set(parkedCarPos.x, 0, parkedCarPos.z);
      playerGroup.rotation.y = parkedCarPos.heading;
    } else {
      let bridgeY = 0;
      for (let bi = 0; bi < bridgeDeckZones.length; bi++) {
        const bz = bridgeDeckZones[bi];
        const dxB = Math.abs(driveState.x - bz.bx), dzB = Math.abs(driveState.z - bz.bz);
        const along = bz.alongX ? dxB : dzB;
        const across = bz.alongX ? dzB : dxB;
        if (across < 8.5 && along < 15.8) {
          bridgeY = along < 10.0 ? 0.52 : Math.max(0, 0.52 * (1 - (along - 10.0) / 5.8));
          break;
        }
      }
      playerGroup.position.set(driveState.x, bridgeY, driveState.z);
      playerGroup.rotation.y = driveState.heading;
    }
    const spdNorm = Math.min(1, Math.abs(driveState.speed) / 28);
    if (eq.modelType === 'bike') {
      playerGroup.rotation.z = driveState.steerInput * 0.28 * spdNorm;
    } else if (playerChassis) {
      // Realistic suspension body roll in turns & pitch squat on Nitro/Gas!
      const targetRoll = -driveState.steerInput * 0.065 * spdNorm;
      const targetPitch = nitroOn ? 0.045 : gasOn ? 0.02 : brakeOn ? -0.035 : 0;
      playerChassis.rotation.z += (targetRoll - playerChassis.rotation.z) * Math.min(1, 8 * dt);
      playerChassis.rotation.x += (targetPitch - playerChassis.rotation.x) * Math.min(1, 8 * dt);
    }
    for (const pv of playerFrontPivots) {
      pv.rotation.y = driveState.steerInput * 0.42;
    }
    for (const w of playerWheels) w.rotation.x -= driveState.speed * dt * 0.85;

    // Check if Player is walking inside ANY Shop (smooth indoor camera + welcome alert!)
    let curShopInside = '';
    if (isOnFoot) {
      for (let li = 0; li < cityLandmarks.length; li++) {
        const lm = cityLandmarks[li];
        if (lm.isWalkInShop && driveState.x > lm.minX && driveState.x < lm.maxX && driveState.z > lm.minZ && driveState.z < lm.maxZ) {
          curShopInside = lm.title;
          break;
        }
      }
      if (curShopInside && driveState.insideShopTitle !== curShopInside) {
        driveState.insideShopTitle = curShopInside;
        showDriveAlert('INSIDE ' + curShopInside + ' — CASH COUNTER ON RIGHT! 🛒', 'bg-emerald-500 text-slate-950');
      } else if (!curShopInside) {
        driveState.insideShopTitle = '';
      }
    }

    // SILKY-SMOOTH 360° HORIZONTAL + FULL SKY-TO-GROUND VERTICAL CAMERA ORBIT!
    const smoothOrbitK = Math.min(1, 16 * dt);
    driveState.camOrbitYaw += (driveState.camTargetYaw - driveState.camOrbitYaw) * smoothOrbitK;
    driveState.camOrbitPitch += (driveState.camTargetPitch - driveState.camOrbitPitch) * smoothOrbitK;

    const camDist = isOnFoot ? (curShopInside ? 4.3 : 6.0) : (camModeIdx === 1 ? 1.8 : camModeIdx === 2 ? 14.5 : (eq.modelType === 'heavy_truck' ? 11.8 : 9.4));
    const totalCamYaw = driveState.heading + driveState.camOrbitYaw;
    const camPitch = Math.max(-0.85, Math.min(1.32, driveState.camOrbitPitch));
    const horizDist = Math.cos(Math.max(0.05, camPitch)) * camDist;
    let targetCamX = driveState.x + Math.sin(totalCamYaw) * horizDist;
    const rawCamY = (driveState.y || 0) + Math.sin(camPitch) * camDist + (isOnFoot ? 1.55 : 1.35);
    let targetCamY = Math.max(0.75, curShopInside ? Math.min(3.75, rawCamY) : rawCamY);
    let targetCamZ = driveState.z + Math.cos(totalCamYaw) * horizDist;
    if (curShopInside) {
      const activeShop = cityLandmarks.find((l) => l.title === curShopInside && l.isWalkInShop && driveState.x > l.minX && driveState.x < l.maxX && driveState.z > l.minZ && driveState.z < l.maxZ);
      if (activeShop) {
        targetCamX = Math.max(activeShop.minX + 0.5, Math.min(activeShop.maxX - 0.5, targetCamX));
        targetCamZ = Math.max(activeShop.minZ + 0.5, Math.min(activeShop.maxZ + 2.8, targetCamZ));
      }
    }
    const camLerp = Math.min(1, (driveState.camDragging ? 20 : (isOnFoot ? 18 : 11)) * dt);
    camera.position.x += (targetCamX - camera.position.x) * camLerp;
    camera.position.y += (targetCamY - camera.position.y) * camLerp;
    camera.position.z += (targetCamZ - camera.position.z) * camLerp;
    const targetFov = 60 + Math.min(22, (Math.abs(driveState.speed) / maxSpeed) * (nitroOn ? 20 : 11));
    if (Math.abs(camera.fov - targetFov) > 0.1) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, 5 * dt);
      camera.updateProjectionMatrix();
    }
    // Look smoothly UP at the Sky when camPitch < 0.08, or smoothly DOWN at the Ground when camPitch > 0.5!
    const skyTiltUp = camPitch < 0.08 ? (0.08 - camPitch) * 14.5 : 0;
    const groundTiltDown = camPitch > 0.85 ? (camPitch - 0.85) * 1.4 : 0;
    const lookY = Math.max(0.15, (driveState.y || 0) + (isOnFoot ? 1.45 : 1.3) + skyTiltUp - groundTiltDown);
    if (camModeIdx === 1 && !driveState.camDragging && !isOnFoot) {
      camera.position.set(driveState.x - Math.sin(driveState.heading) * 0.6, (driveState.y || 0) + 1.65, driveState.z - Math.cos(driveState.heading) * 0.6);
      camera.lookAt(driveState.x - Math.sin(driveState.heading) * 30, (driveState.y || 0) + 1.4 + skyTiltUp, driveState.z - Math.cos(driveState.heading) * 30);
    } else {
      camera.lookAt(driveState.x, lookY, driveState.z);
    }

    for (const c of coinMeshes) {
      if (!c.userData.active) {
        if (now > c.userData.respawnAt) { c.userData.active = true; c.visible = true; }
        continue;
      }
      if (c.userData.disc) {
        c.userData.disc.rotation.y += 3.6 * dt;
        c.userData.disc.position.y = 1.65 + Math.sin(now * 0.005 + c.userData.phase) * 0.28;
      }
      if (Math.hypot(c.position.x - driveState.x, c.position.z - driveState.z) < 3.4) {
        c.userData.active = false; c.visible = false; c.userData.respawnAt = now + 15000;
        state.coins += 100; gainXP(35);
        if (Audio) Audio.playCoin(); showDriveAlert('+100 COINS!');
        const task = cityTasks[state.taskIndex % cityTasks.length];
        if (task.type === 'coins') {
          taskProgress += 1;
          if (taskProgress >= task.target) completeCurrentTask();
          else updateTaskUI();
        }
      }
    }

    // Update Real 3D Traffic Signals (16s cycle: 0-6.5s Z-Green/X-Red, 6.5-8s Yellow, 8-14.5s X-Green/Z-Red, 14.5-16s Yellow)
    const sigTime = now * 0.001;
    for (let s = 0; s < trafficSignals.length; s++) {
      const sg = trafficSignals[s];
      const cyc = (sigTime + sg.phaseOffset) % 16;
      sg.zGreen = cyc < 6.5;
      sg.xGreen = cyc >= 8 && cyc < 14.5;
      const isYel = (cyc >= 6.5 && cyc < 8) || cyc >= 14.5;
      sg.rMat.color.setHex(!sg.zGreen && !isYel ? 0xff1e1e : 0x3b0a0a);
      sg.yMat.color.setHex(isYel ? 0xfacc15 : 0x3b3008);
      sg.gMat.color.setHex(sg.zGreen ? 0x22c55e : 0x0a3b1a);
    }

    // Smart Commuter AI Vehicles: Stop & Wait cleanly at Red Traffic Signals + Keep safe spacing, then drive on Green!
    for (let i = 0; i < trafficCars.length; i++) {
      const t = trafficCars[i];
      if (t.wrecked || t.hijacking) continue;
      let shouldStop = false;
      const tx = t.mesh.position.x, tz = t.mesh.position.z;

      // Check upcoming Traffic Signal ahead of this vehicle
      for (let s = 0; s < trafficSignals.length; s++) {
        const sg = trafficSignals[s];
        if (t.axis === 'z') {
          if (Math.abs(tx - sg.x) < 8) {
            const ahead = (sg.z - tz) * t.dir;
            if (ahead > 9.5 && ahead < 19.5 && !sg.zGreen) { shouldStop = true; break; }
          }
        } else {
          if (Math.abs(tz - sg.z) < 8) {
            const ahead = (sg.x - tx) * t.dir;
            if (ahead > 9.5 && ahead < 19.5 && !sg.xGreen) { shouldStop = true; break; }
          }
        }
      }
      // Never drive through the player's car if player is stopped/blocking the lane!
      if (!isOnFoot) {
        const dPlCar = Math.hypot(tx - driveState.x, tz - driveState.z);
        if (dPlCar < 4.5) {
          const angP = Math.atan2(driveState.x - tx, driveState.z - tz);
          driveState.x = tx + Math.sin(angP) * 4.6;
          driveState.z = tz + Math.cos(angP) * 4.6;
          if (!t.wrecked && Math.abs(driveState.speed) >= (40 / 2.6)) {
            triggerTrafficAccident(t, now);
          }
          shouldStop = true;
          t.curSpeed = 0;
        }
      }
      // Also avoid rear-ending a waiting car ahead in the same lane!
      if (!shouldStop) {
        for (let j = 0; j < trafficCars.length; j++) {
          if (i === j) continue;
          const o = trafficCars[j];
          if (o.axis !== t.axis || o.dir !== t.dir) continue;
          if (t.axis === 'z' && Math.abs(o.mesh.position.x - tx) < 2.2) {
            const gap = (o.mesh.position.z - tz) * t.dir;
            if (gap > 0 && gap < 8.4) { shouldStop = true; break; }
          } else if (t.axis === 'x' && Math.abs(o.mesh.position.z - tz) < 2.2) {
            const gap = (o.mesh.position.x - tx) * t.dir;
            if (gap > 0 && gap < 8.4) { shouldStop = true; break; }
          }
        }
      }

      const targetSpd = shouldStop ? 0 : t.maxSpeed;
      t.curSpeed += (targetSpd - t.curSpeed) * Math.min(1, (shouldStop ? 7 : 3.5) * dt);
      const step = t.curSpeed * t.dir * dt;
      if (t.yieldSide) {
        const wantSide = (t.yieldUntil && now < t.yieldUntil) ? t.yieldSide : 0;
        t.curYield = t.curYield || 0;
        const deltaY = (wantSide - t.curYield) * Math.min(1, 4.5 * dt);
        t.curYield += deltaY;
        if (t.axis === 'z') t.mesh.position.x += deltaY;
        else t.mesh.position.z += deltaY;
        if (wantSide === 0 && Math.abs(t.curYield) < 0.05) { t.yieldSide = 0; t.curYield = 0; }
      }
      if (t.axis === 'z') {
        t.mesh.position.z += step;
        if (Math.abs(t.mesh.position.z - driveState.z) > 250 || Math.abs(t.mesh.position.x - driveState.x) > 250) {
          const nearGX = Math.round(driveState.x / BLOCK_STEP) + ((i % 5) - 2);
          t.mesh.position.x = nearGX * BLOCK_STEP + (t.dir > 0 ? 2.75 : -2.75);
          t.mesh.position.z = driveState.z + (t.dir > 0 ? -235 : 235);
        }
      } else {
        t.mesh.position.x += step;
        if (Math.abs(t.mesh.position.x - driveState.x) > 250 || Math.abs(t.mesh.position.z - driveState.z) > 250) {
          const nearGZ = Math.round(driveState.z / BLOCK_STEP) + ((i % 5) - 2);
          t.mesh.position.z = nearGZ * BLOCK_STEP + (t.dir > 0 ? 2.75 : -2.75);
          t.mesh.position.x = driveState.x + (t.dir > 0 ? -235 : 235);
        }
      }
      if (t.wheels && t.curSpeed > 0.2) {
        for (const tw of t.wheels) tw.rotation.x -= t.curSpeed * dt * 0.75;
      }
    }

    const kmh = Math.abs(Math.round(driveState.speed * 2.6));
    speedKmhEl.textContent = kmh;
    if (nitroHudBar) nitroHudBar.style.width = driveState.nitro.toFixed(0) + '%';
    // Animate Twin Circular Bike/Supercar Gauges (Speedometer + Boost Dial)
    const spdRatio = Math.min(1, kmh / 360);
    const speedArcEl = document.getElementById('speedArcEl');
    const speedNeedleEl = document.getElementById('speedNeedleEl');
    if (speedArcEl) speedArcEl.style.strokeDashoffset = (188.5 * (1 - spdRatio)).toFixed(1);
    if (speedNeedleEl) speedNeedleEl.style.transform = `rotate(${(-120 + spdRatio * 240).toFixed(1)}deg)`;

    const boostRatio = Math.max(0, Math.min(1, driveState.nitro / 100));
    const boostArcEl = document.getElementById('boostArcEl');
    const boostNeedleEl = document.getElementById('boostNeedleEl');
    const boostPctEl = document.getElementById('boostPctEl');
    if (boostArcEl) boostArcEl.style.strokeDashoffset = (188.5 * (1 - boostRatio)).toFixed(1);
    if (boostNeedleEl) boostNeedleEl.style.transform = `rotate(${(-120 + boostRatio * 240).toFixed(1)}deg)`;
    if (boostPctEl) boostPctEl.textContent = Math.round(driveState.nitro) + '%';

    driveCoinsEl.textContent = state.coins.toLocaleString();

    const currentTask = cityTasks[state.taskIndex % cityTasks.length];
    if (currentTask.type === 'speed') {
      if (kmh > taskProgress) taskProgress = kmh;
      if (kmh >= currentTask.target) completeCurrentTask();
      else updateTaskUI();
    } else if (currentTask.type === 'distance') {
      taskProgress += stepDist;
      if (taskProgress >= currentTask.target) completeCurrentTask();
      else updateTaskUI();
    } else if (currentTask.type === 'checkpoint' && checkpointBeam) {
      checkpointBeam.rotation.y += 1.5 * dt;
      if (Math.hypot(checkpointBeam.position.x - driveState.x, checkpointBeam.position.z - driveState.z) < 5.5) {
        completeCurrentTask();
      }
    }

    // REAL PLAYER-VS-ALL-VEHICLES SOLID COLLISION (Traffic Cars, Wrecked Cars, Police Cars, Yellow Taxis & Tow Trucks NEVER pass through!)
    if (!isOnFoot) {
      // Solid collision with Police Cars
      for (let pi = 0; pi < policeUnits.length; pi++) {
        const pu = policeUnits[pi];
        if (pu.stolen || pu.mesh === playerGroup) continue;
        const dP = Math.hypot(driveState.x - pu.mesh.position.x, driveState.z - pu.mesh.position.z);
        if (dP < 3.6) {
          const ang = Math.atan2(driveState.x - pu.mesh.position.x, driveState.z - pu.mesh.position.z);
          driveState.x = pu.mesh.position.x + Math.sin(ang) * 3.85;
          driveState.z = pu.mesh.position.z + Math.cos(ang) * 3.85;
          pu.mesh.position.x -= Math.sin(ang) * 0.45;
          pu.mesh.position.z -= Math.cos(ang) * 0.45;
          driveState.speed = -driveState.speed * 0.35;
          pu.speed = Math.max(0, (pu.speed || 10) * 0.35);
          if (Audio) Audio.playCrash();
        }
      }
      // Solid collision with Shop Yellow Taxis
      for (let si = 0; si < shopCycles.length; si++) {
        const tx = shopCycles[si].taxi;
        if (!tx || tx === playerGroup) continue;
        const dTx = Math.hypot(driveState.x - tx.position.x, driveState.z - tx.position.z);
        if (dTx < 3.5) {
          const ang = Math.atan2(driveState.x - tx.position.x, driveState.z - tx.position.z);
          driveState.x = tx.position.x + Math.sin(ang) * 3.75;
          driveState.z = tx.position.z + Math.cos(ang) * 3.75;
          driveState.speed = -driveState.speed * 0.35;
          if (Audio) Audio.playCrash();
        }
      }
      // Solid collision with Emergency Tow Trucks
      for (let ei = 0; ei < emergencyEvents.length; ei++) {
        const tt = emergencyEvents[ei].towTruck;
        if (!tt || !tt.visible || tt === playerGroup) continue;
        const dTt = Math.hypot(driveState.x - tt.position.x, driveState.z - tt.position.z);
        if (dTt < 4.0) {
          const ang = Math.atan2(driveState.x - tt.position.x, driveState.z - tt.position.z);
          driveState.x = tt.position.x + Math.sin(ang) * 4.25;
          driveState.z = tt.position.z + Math.cos(ang) * 4.25;
          driveState.speed = -driveState.speed * 0.35;
          if (Audio) Audio.playCrash();
        }
      }
    }

    // REAL PLAYER-VS-TRAFFIC CAR COLLISION (No passing through cars -> Triggers Accident + Fire + Fire Engine + Ambulance!)
    for (let i = 0; i < trafficCars.length; i++) {
      const tc = trafficCars[i];
      if (isOnFoot) continue;
      const distT = Math.hypot(tc.mesh.position.x - driveState.x, tc.mesh.position.z - driveState.z);
      if (tc.wrecked) {
        if (distT < 3.5) {
          const pushAng = Math.atan2(driveState.x - tc.mesh.position.x, driveState.z - tc.mesh.position.z);
          driveState.x = tc.mesh.position.x + Math.sin(pushAng) * 3.75;
          driveState.z = tc.mesh.position.z + Math.cos(pushAng) * 3.75;
          driveState.speed = -driveState.speed * 0.3;
        }
        continue;
      }
      if (distT < 3.6) {
        // Physically push player car back so it NEVER clips through the other car!
        const pushAng = Math.atan2(driveState.x - tc.mesh.position.x, driveState.z - tc.mesh.position.z);
        driveState.x = tc.mesh.position.x + Math.sin(pushAng) * 3.8;
        driveState.z = tc.mesh.position.z + Math.cos(pushAng) * 3.8;
        const impact = Math.abs(driveState.speed);
        driveState.speed = -driveState.speed * 0.45;
        if (impact >= (40 / 2.6) && now - driveState.lastCrashAt > 650) {
          driveState.lastCrashAt = now;
          const dmg = Math.min(25, Math.max(8, Math.round(impact * 0.45)));
          driveState.health = Math.max(0, driveState.health - dmg);
          updateHealthHUD();
          crashFlash.style.opacity = '1';
          setTimeout(() => { crashFlash.style.opacity = '0'; }, 180);
          triggerTrafficAccident(tc, now);
        }
        break;
      }
    }

    // UPDATE ACTIVE 3D EMERGENCY RESCUES (Fire Engine extinguishes fire -> Ambulance picks up fallen person -> drives to Hospital!)
    for (let eIdx = emergencyEvents.length - 1; eIdx >= 0; eIdx--) {
      const ev = emergencyEvents[eIdx];
      // Flash emergency beacons on Fire Engine & Ambulance
      const flash = Math.floor(now / 180) % 2 === 0;
      if (ev.fireTruck.userData) {
        ev.fireTruck.userData.beaconR.material.color.setHex(flash ? 0xff1e1e : 0x330505);
        ev.fireTruck.userData.beaconB.material.color.setHex(!flash ? 0x00f0ff : 0x052233);
      }
      if (ev.ambulance.userData) {
        ev.ambulance.userData.beaconR.material.color.setHex(flash ? 0xff1e1e : 0x330505);
        ev.ambulance.userData.beaconB.material.color.setHex(!flash ? 0x38bdf8 : 0x052233);
      }
      // Flicker fire flames & rise smoke while burning
      if (ev.fireGroup.visible) {
        for (let f = 0; f < ev.flames.length; f++) {
          ev.flames[f].scale.set(ev.fireScale, ev.fireScale * (0.85 + Math.random() * 0.45), ev.fireScale);
        }
        for (let s = 0; s < ev.smokePuffs.length; s++) {
          ev.smokePuffs[s].position.y = 2.0 + ((now * 0.002 + s * 0.8) % 3.2);
          ev.smokePuffs[s].scale.setScalar(ev.fireScale);
        }
      }

      // Rock-Solid Linear Waypoint Follower (Zero oscillation, zero wall clipping, zero jitter!)
      const stepToPoint = (obj, tx, tz, spd) => {
        const dxM = tx - obj.position.x, dzM = tz - obj.position.z;
        const distM = Math.hypot(dxM, dzM);
        if (distM <= spd * dt + 0.35) {
          obj.position.x = tx; obj.position.z = tz;
          return true;
        }
        // Check if Player Car is blocking the Fire Engine / Ambulance ahead -> HONK HORN & Steer Around instead of ramming!
        const nx = dxM / distM, nz = dzM / distM;
        const toPlayerX = driveState.x - obj.position.x, toPlayerZ = driveState.z - obj.position.z;
        const distP = Math.hypot(toPlayerX, toPlayerZ);
        const dotAhead = (toPlayerX * nx + toPlayerZ * nz) / (distP || 1);
        if (distP < 11.5 && dotAhead > 0.55) {
          if (!obj.userData.lastHornAt || now - obj.userData.lastHornAt > 1800) {
            obj.userData.lastHornAt = now;
            if (Audio && Audio.startHorn) Audio.startHorn();
            showDriveAlert('EMERGENCY VEHICLE HONKING — GIVE WAY! 🚒🚑🔊', 'bg-amber-400 text-slate-950');
          }
          if (distP < 6.8) {
            obj.position.x += (-nz) * 6.5 * dt;
            obj.position.z += (nx) * 6.5 * dt;
            return false;
          }
          spd *= 0.45;
        }
        obj.position.x += nx * spd * dt;
        obj.position.z += nz * spd * dt;
        obj.rotation.y = Math.atan2(-dxM, -dzM);
        return false;
      };

      // Animate victim flying out of crashed car/taxi onto the road!
      if (ev.victimFlyT !== undefined && ev.victimFlyT < 0.75) {
        ev.victimFlyT = Math.min(0.75, ev.victimFlyT + dt);
        const fp = ev.victimFlyT / 0.75;
        ev.victim.position.set(
          ev.ax + (ev.vx - ev.ax) * fp,
          0.35 + Math.sin(fp * Math.PI) * 3.2,
          ev.az + (ev.vz - ev.az) * fp
        );
      }

      if (ev.phase === 'dispatch') {
        // Fire Engine leads on road; Ambulance follows right behind Fire Engine and waits at ambWait!
        const ftArr = ev.stolenFire ? true : stepToPoint(ev.fireTruck, ev.ftStop.x, ev.ftStop.z, 22);
        if (!ev.stolenAmb && ev.ambWait) stepToPoint(ev.ambulance, ev.ambWait.x, ev.ambWait.z, 20);
        if (ftArr) {
          ev.phase = 'extinguishing';
          ev.phaseTimer = 0;
          ev.waterJet.visible = true;
          if (ev.firefighter) { ev.firefighter.visible = true; ev.firefighter.position.set(ev.fireTruck.position.x + 1.6, 0.22, ev.fireTruck.position.z); }
          showDriveAlert('FIRE ENGINE SPRAYING WATER! AMBULANCE WAITING BEHIND! 🚒💦🚑', 'bg-sky-400 text-slate-950');
        }
      } else if (ev.phase === 'extinguishing') {
        // Ambulance waits cleanly behind Fire Engine on the road while fire is being extinguished!
        if (!ev.stolenAmb && ev.ambWait) stepToPoint(ev.ambulance, ev.ambWait.x, ev.ambWait.z, 20);
        ev.phaseTimer += dt;
        ev.waterJet.scale.y = 0.9 + Math.random() * 0.25;
        ev.fireScale = Math.max(0.01, 1.0 - ev.phaseTimer / 3.0);
        if (ev.phaseTimer >= 3.0) {
          ev.fireGroup.visible = false;
          ev.waterJet.visible = false;
          if (ev.firefighter) ev.firefighter.visible = false;
          ev.phase = 'rescue';
          ev.phaseTimer = 0;
          showDriveAlert('FIRE OUT! AMBULANCE MOVING IN — 2 PARAMEDICS RESCUING! 🚑', 'bg-emerald-400 text-slate-950');
        }
      } else if (ev.phase === 'rescue') {
        // Fire is OUT -> Ambulance now pulls up to victim, THEN 2 Paramedics exit with stretcher!
        const ambHere = ev.stolenAmb ? true : stepToPoint(ev.ambulance, ev.ambStop.x, ev.ambStop.z, 18);
        if (ambHere) {
          ev.phaseTimer += dt;
          // 2 Paramedics carry 3D Stretcher out to fallen human (0-1.2s), lift & carry back to Ambulance (1.2-2.5s)!
          if (ev.stretcherGroup) {
            ev.stretcherGroup.visible = true;
            if (ev.phaseTimer < 1.25) {
              const p = ev.phaseTimer / 1.25;
              ev.stretcherGroup.position.set(
                ev.ambulance.position.x + (ev.vx - ev.ambulance.position.x) * p,
                0.22,
                ev.ambulance.position.z + (ev.vz - ev.ambulance.position.z) * p
              );
            } else {
              const p = Math.min(1, (ev.phaseTimer - 1.25) / 1.25);
              ev.stretcherGroup.position.set(
                ev.vx + (ev.ambulance.position.x - ev.vx) * p,
                0.22,
                ev.vz + (ev.ambulance.position.z - ev.vz) * p
              );
              ev.victim.position.set(ev.stretcherGroup.position.x, 1.08, ev.stretcherGroup.position.z);
            }
          }
          if (ev.phaseTimer > 2.55) {
            ev.victim.visible = false;
            if (ev.stretcherGroup) ev.stretcherGroup.visible = false;
            if (ev.towTruck) ev.towTruck.visible = true;
            ev.phase = 'to_hospital';
            if (Audio && Audio.playSiren) Audio.playSiren();
            showDriveAlert('STRETCHER LOADED → AMBULANCE TO HOSPITAL & TOW TRUCK ON WAY! 🚑🚛', 'bg-amber-400 text-slate-950');
          }
        }
      } else if (ev.phase === 'to_hospital') {
        // Fire Engine cleanly leaves straight down the road & hides once away (NEVER glitches!)
        if (ev.fireTruck.visible && !ev.stolenFire) {
          const ftDone = stepToPoint(ev.fireTruck, ev.ftExit.x, ev.ftExit.z, 22);
          if (ftDone) ev.fireTruck.visible = false;
        }
        // 3D Tow Truck drives up to wrecked car & tows it smoothly away (car never magically vanishes!)
        if (ev.towTruck && ev.towTruck.visible) {
          if (!ev.towing) {
            if (stepToPoint(ev.towTruck, ev.ax, ev.az, 20)) ev.towing = true;
          } else {
            stepToPoint(ev.towTruck, ev.ftExit.x, ev.ftExit.z, 18);
            ev.trafficCar.mesh.position.set(ev.towTruck.position.x, 0.25, ev.towTruck.position.z - 5.2);
          }
        }
        // Ambulance follows clean 2-step road waypoints straight to + HOSPITAL!
        const wp = ev.ambWaypoints[ev.ambWpIdx];
        if (!ev.stolenAmb && wp && stepToPoint(ev.ambulance, wp.x, wp.z, 24)) {
          ev.ambWpIdx++;
        }
        if (ev.ambWpIdx >= ev.ambWaypoints.length) {
          showDriveAlert('PATIENT SAFELY AT HOSPITAL! 🏥✅', 'bg-emerald-500 text-slate-950');
          scene.remove(ev.fireGroup, ev.waterJet, ev.victim, ev.firefighter, ev.stretcherGroup, ev.towTruck);
          if (!ev.stolenFire) scene.remove(ev.fireTruck);
          if (!ev.stolenAmb) scene.remove(ev.ambulance);
          ev.trafficCar.wrecked = false;
          ev.trafficCar.mesh.rotation.z = 0;
          if (ev.shopCycleRef) { ev.shopCycleRef.wreckedTaxi = false; ev.trafficCar.mesh.position.set(ev.shopCycleRef.doorX, 0, ev.shopCycleRef.roadZ + 2.6); }
          ev.trafficCar.mesh.position.set(ev.trafficCar.axis === 'z' ? ev.trafficCar.mesh.position.x : driveState.x - 240, 0, ev.trafficCar.axis === 'z' ? driveState.z - 240 : ev.trafficCar.mesh.position.z);
          emergencyEvents.splice(eIdx, 1);
        }
      }
    }

    // UPDATE 3 POLICE CARS: Surround Player, Honk Sirens/Horns, Calm Down ONLY when Player Escapes > 100m!
    for (let pi = policeUnits.length - 1; pi >= 0; pi--) {
      const pu = policeUnits[pi];
      if (pu.stolen) continue;
      const flashP = Math.floor(now / 140) % 2 === 0;
      if (pu.mesh.userData) {
        pu.mesh.userData.barR.material.color.setHex(flashP ? 0xff1e1e : 0x330505);
        pu.mesh.userData.barB.material.color.setHex(!flashP ? 0x00f0ff : 0x051a33);
      }
      // REAL INDEPENDENT GTA POLICE CHASE AI (2 Behind + 1 Ahead, Natural Independent Driving, ZERO Magnet Mirroring, ZERO Building Clipping!)
      const hPl = driveState.heading;
      const fwdX = -Math.sin(hPl), fwdZ = -Math.cos(hPl);
      const rightX = Math.cos(hPl), rightZ = -Math.sin(hPl);
      const dReal = Math.hypot(driveState.x - pu.mesh.position.x, driveState.z - pu.mesh.position.z);

      // Only lead ahead/behind when player is actively driving; when player is slow/stopped, drive directly to close in & box them in!
      const playerMoving = Math.abs(driveState.speed) > 3.5;
      const leadScale = playerMoving ? 1.0 : 0.45;
      const rawSurX = driveState.x + fwdX * ((pu.slotFwd || -10.5) * leadScale) + rightX * (pu.slotSide || 0);
      const rawSurZ = driveState.z + fwdZ * ((pu.slotFwd || -10.5) * leadScale) + rightZ * (pu.slotSide || 0);
      const safeTarget = pushOutOfBuildings(rawSurX, rawSurZ, 3.2, true);
      const surX = safeTarget.x;
      const surZ = safeTarget.z;

      const dxP = surX - pu.mesh.position.x, dzP = surZ - pu.mesh.position.z;
      const dTarget = Math.hypot(dxP, dzP);

      if (pu.heading === undefined) pu.heading = pu.mesh.rotation.y || 0;
      if (pu.speed === undefined) pu.speed = 14;

      // Smooth independent acceleration/braking (NEVER mirrors player start/stop like a magnet!)
      let desiredSpd = 0;
      if (dReal > 5.8 && dTarget > 2.4) {
        desiredSpd = playerMoving
          ? Math.min(34, Math.max(16, Math.abs(driveState.speed) + (dTarget > 14 ? 8 : 3)))
          : Math.min(18, Math.max(9, dTarget * 1.3));
      } else {
        desiredSpd = 0;
      }
      pu.speed += (desiredSpd - pu.speed) * Math.min(1, (desiredSpd < pu.speed ? 4.5 : 2.6) * dt);

      let nx = pu.mesh.position.x;
      let nz = pu.mesh.position.z;

      if (pu.speed > 0.25) {
        let wantAng = Math.atan2(-dxP, -dzP);
        // 3-Ray Look-Ahead Building Avoidance (Front, Front-Left, Front-Right) so police steer smoothly AROUND buildings!
        const pAhead = pushOutOfBuildings(nx - Math.sin(pu.heading) * 6.0, nz - Math.cos(pu.heading) * 6.0, 2.5, true);
        if (pAhead.hit) {
          const pLeft = pushOutOfBuildings(nx - Math.sin(pu.heading + 0.95) * 6.0, nz - Math.cos(pu.heading + 0.95) * 6.0, 2.5, true);
          const pRight = pushOutOfBuildings(nx - Math.sin(pu.heading - 0.95) * 6.0, nz - Math.cos(pu.heading - 0.95) * 6.0, 2.5, true);
          if (!pLeft.hit) wantAng = pu.heading + 1.25;
          else if (!pRight.hit) wantAng = pu.heading - 1.25;
          else wantAng = pu.heading + Math.PI * 0.75; // Turn away from dead-end wall!
        }
        let angDiff = wantAng - pu.heading;
        while (angDiff > Math.PI) angDiff -= Math.PI * 2;
        while (angDiff < -Math.PI) angDiff += Math.PI * 2;
        const maxTurn = 3.2 * dt;
        pu.heading += Math.max(-maxTurn, Math.min(maxTurn, angDiff));

        nx -= Math.sin(pu.heading) * pu.speed * dt;
        nz -= Math.cos(pu.heading) * pu.speed * dt;
      }

      // Separate from other police cars & player FIRST...
      for (let pj = 0; pj < policeUnits.length; pj++) {
        if (pj === pi) continue;
        const otherP = policeUnits[pj].mesh;
        const dPP = Math.hypot(nx - otherP.position.x, nz - otherP.position.z);
        if (dPP < 4.5 && dPP > 0.01) {
          nx = otherP.position.x + ((nx - otherP.position.x) / dPP) * 4.5;
          nz = otherP.position.z + ((nz - otherP.position.z) / dPP) * 4.5;
        }
      }
      const dPlAfter = Math.hypot(nx - driveState.x, nz - driveState.z);
      if (dPlAfter < 4.4 && dPlAfter > 0.01) {
        nx = driveState.x + ((nx - driveState.x) / dPlAfter) * 4.4;
        nz = driveState.z + ((nz - driveState.z) / dPlAfter) * 4.4;
      }

      // ...THEN run STRICT FINAL Building & Shop Exclusion as the VERY LAST step (Mathematically IMPOSSIBLE to ever enter a building!)
      const finalSafe = pushOutOfBuildings(nx, nz, 2.45, true);
      if (finalSafe.hit) {
        pu.speed *= 0.5;
      }
      pu.mesh.position.x = finalSafe.x;
      pu.mesh.position.z = finalSafe.z;
      pu.mesh.rotation.y = pu.heading;
      if (pu.speed > 0.25 && pu.mesh.userData && pu.mesh.userData.wheels) {
        pu.mesh.userData.wheels.forEach((w) => { w.rotation.x -= pu.speed * dt * 0.85; });
      }
      // Honk & Siren continuously while surrounding/chasing!
      if (dReal < 24 && now - pu.lastHorn > 2600) {
        pu.lastHorn = now;
        if (Audio && Audio.startHorn) Audio.startHorn();
      }
      // Live 10-Second Countdown Timer at Top of Screen -> Police Car leaves cleanly after 10s (or >100m escape)!
      const remMs = (pu.expiresAt || (pu.spawnAt + 10000)) - now;
      const ptEl = document.getElementById('policeTimerEl');
      if (ptEl) {
        if (remMs > 0) {
          ptEl.classList.remove('hidden');
          ptEl.textContent = '🚓 POLICE: ' + Math.ceil(remMs / 1000) + 's';
        } else {
          ptEl.classList.add('hidden');
        }
      }
      if (remMs <= 0 || dReal > 100) {
        scene.remove(pu.mesh);
        policeUnits.splice(pi, 1);
        if (policeUnits.length === 0) {
          if (ptEl) ptEl.classList.add('hidden');
          gainXP(150);
          showDriveAlert(remMs <= 0 ? '10s OVER — POLICE LEFT! CLEAR! +150 XP ✅' : 'ESCAPED > 100m! POLICE LEFT! +150 XP 🚓💨', 'bg-emerald-500 text-slate-950');
        }
      }
    }

    // AUTOMATIC SLIDING GLASS DOORS FOR ALL WALK-IN SHOPS (D-Mart, Mall, Hospital, Cafe, Office!)
    for (let li = 0; li < cityLandmarks.length; li++) {
      const lm = cityLandmarks[li];
      if (!lm.doorL || !lm.doorR) continue;
      const dPl = Math.hypot(driveState.x - lm.x, driveState.z - lm.doorZ);
      let nearShopper = false;
      for (let si = 0; si < shopCycles.length; si++) {
        const sc0 = shopCycles[si];
        if (sc0.doorL === lm.doorL && sc0.shopper && sc0.shopper.visible) {
          if (Math.hypot(sc0.shopper.position.x - lm.x, sc0.shopper.position.z - lm.doorZ) < 4.5) {
            nearShopper = true; break;
          }
        }
      }
      const openWant = (dPl < 6.8 || nearShopper) ? 2.25 : 0;
      const curOff = (lm.doorBaseX - 1.36) - lm.doorL.position.x;
      const nextOff = curOff + (openWant - curOff) * Math.min(1, 7 * dt);
      lm.doorL.position.x = lm.doorBaseX - 1.36 - nextOff;
      lm.doorR.position.x = lm.doorBaseX + 1.36 + nextOff;
    }

    // UPDATE INDOOR MALL & SHOP CROWD (3 Live People strolling inside EVERY Shop & Mall — STOP if Player is in front of them!)
    for (let ii = 0; ii < indoorShoppers.length; ii++) {
      const ish = indoorShoppers[ii];
      const m = ish.mesh;
      if (Math.abs(m.position.x - driveState.x) > 85 || Math.abs(m.position.z - driveState.z) > 85) continue;
      const wp = ish.waypoints[ish.wpIdx];
      const blockedByPlayer = isOnFoot && Math.hypot(m.position.x - driveState.x, m.position.z - driveState.z) < 1.85;
      const u = m.userData;
      if (blockedByPlayer) {
        if (u && u.legL) { u.legL.rotation.x = 0; u.legR.rotation.x = 0; u.armL.rotation.x = 0; u.armR.rotation.x = 0; }
        continue;
      }
      const dxI = wp.x - m.position.x, dzI = wp.z - m.position.z;
      const dI = Math.hypot(dxI, dzI);
      if (dI < 0.7) {
        ish.wpIdx = (ish.wpIdx + 1) % ish.waypoints.length;
      } else {
        m.position.x += (dxI / dI) * ish.speed * dt;
        m.position.z += (dzI / dI) * ish.speed * dt;
        m.rotation.y = Math.atan2(dxI, dzI);
        if (u && u.legL) {
          const sw = Math.sin(now * 0.008 + ish.phase) * 0.5;
          u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
          u.armL.rotation.x = -sw * 0.65; u.armR.rotation.x = sw * 0.65;
        }
      }
    }

    // UPDATE LIVING D-MART / MALL SHOPPERS & YELLOW TAXI CYCLE!
    for (let si = 0; si < shopCycles.length; si++) {
      const sc = shopCycles[si];
      const sh = sc.shopper;
      const animateWalk = () => {
        const u = sh.userData;
        if (u && u.legL) {
          const sw = Math.sin(now * 0.009) * 0.55;
          u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
          u.armL.rotation.x = -sw * 0.7; u.armR.rotation.x = sw * 0.7;
        }
      };

      if (sc.wreckedTaxi) continue;
      if (isOnFoot && sh.visible && Math.hypot(sh.position.x - driveState.x, sh.position.z - driveState.z) < 1.85) {
        const uS = sh.userData;
        if (uS && uS.legL) { uS.legL.rotation.x = 0; uS.legR.rotation.x = 0; uS.armL.rotation.x = 0; uS.armR.rotation.x = 0; }
        continue;
      }
      if (sc.phase === 'walk_in') {
        const dx = sc.doorX - sh.position.x, dz = sc.doorZ - sh.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.8) {
          sc.phase = 'shopping'; sc.timer = 0; sh.visible = false;
        } else {
          sh.position.x += (dx / d) * 3.2 * dt; sh.position.z += (dz / d) * 3.2 * dt;
          sh.rotation.y = Math.atan2(dx, dz); animateWalk();
        }
      } else if (sc.phase === 'shopping') {
        sc.timer += dt;
        if (sc.timer > 3.5) {
          sh.visible = true; sc.bag.visible = true;
          sh.position.set(sc.doorX, 0.22, sc.doorZ + 0.5);
          sc.phase = 'walk_out';
        }
      } else if (sc.phase === 'walk_out') {
        const dx = sc.taxi.position.x - sh.position.x, dz = (sc.taxi.position.z - 1.6) - sh.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 1.1) {
          sh.visible = false; sc.phase = 'taxi_drive'; sc.timer = 0;
        } else {
          sh.position.x += (dx / d) * 3.0 * dt; sh.position.z += (dz / d) * 3.0 * dt;
          sh.rotation.y = Math.atan2(dx, dz); animateWalk();
        }
      } else if (sc.stolenTaxi) { continue;
      } else if (sc.phase === 'taxi_drive') {
        sc.taxi.position.x += 13 * dt;
        sc.taxi.rotation.y = -Math.PI / 2;
        sc.timer += dt;
        if (sc.timer > 6.5) {
          sc.phase = 'taxi_return';
          sc.taxi.position.x = sc.doorX - 85;
        }
      } else if (sc.phase === 'taxi_return') {
        sc.taxi.position.x += 13 * dt;
        if (sc.taxi.position.x >= sc.doorX) {
          sc.taxi.position.x = sc.doorX;
          sh.visible = true; sc.bag.visible = false;
          sh.position.set(sc.doorX - 5.5, 0.22, sc.curbZ);
          sc.phase = 'walk_in';
        }
      }
    }

    // Animate 36 Walking Humans on Footpaths + FLYING LAUNCH PHYSICS WHEN HIT BY CAR!
    for (let i = 0; i < walkingHumans.length; i++) {
      const h = walkingHumans[i];
      if (h.flying) {
        h.mesh.position.x += h.vx * dt;
        h.mesh.position.y += h.vy * dt;
        h.mesh.position.z += h.vz * dt;
        h.vy -= 26 * dt; // Gravity
        h.mesh.rotation.x += 9.5 * dt;
        h.mesh.rotation.z += 7.2 * dt;
        if (h.mesh.position.y < 0.22) {
          h.mesh.position.y = 0.22;
          h.vy = Math.abs(h.vy) * 0.35;
          h.vx *= 0.65; h.vz *= 0.65;
        }
        if (now > h.respawnAt) {
          h.flying = false;
          h.mesh.position.set(h.basePos.x, 0.22, h.basePos.z);
          h.mesh.rotation.set(0, h.axis === 'z' ? (h.dir > 0 ? 0 : Math.PI) : (h.dir > 0 ? Math.PI / 2 : -Math.PI / 2), 0);
        }
        continue;
      }
      if (isOnFoot && Math.hypot(h.mesh.position.x - driveState.x, h.mesh.position.z - driveState.z) < 1.85) {
        const uStop = h.mesh.userData;
        if (uStop && uStop.legL) { uStop.legL.rotation.x = 0; uStop.legR.rotation.x = 0; uStop.armL.rotation.x = 0; uStop.armR.rotation.x = 0; }
        continue;
      }
      const stepH = h.speed * h.dir * dt;
      if (h.axis === 'z') {
        h.mesh.position.z += stepH;
        if (Math.abs(h.mesh.position.z - driveState.z) > 170 || Math.abs(h.mesh.position.x - driveState.x) > 170) {
          const nearGX = Math.round(driveState.x / BLOCK_STEP) + ((i % 5) - 2);
          h.mesh.position.x = nearGX * BLOCK_STEP + (h.dir > 0 ? 5.3 : -5.3);
          h.mesh.position.z = driveState.z + (h.dir > 0 ? -155 : 155);
          h.basePos = { x: h.mesh.position.x, z: h.mesh.position.z };
        }
      } else {
        h.mesh.position.x += stepH;
        if (Math.abs(h.mesh.position.x - driveState.x) > 170 || Math.abs(h.mesh.position.z - driveState.z) > 170) {
          const nearGZ = Math.round(driveState.z / BLOCK_STEP) + ((i % 5) - 2);
          h.mesh.position.z = nearGZ * BLOCK_STEP + (h.dir > 0 ? 5.3 : -5.3);
          h.mesh.position.x = driveState.x + (h.dir > 0 ? -155 : 155);
          h.basePos = { x: h.mesh.position.x, z: h.mesh.position.z };
        }
      }
      const swing = Math.sin(now * 0.0075 + h.phase) * 0.58;
      const u = h.mesh.userData;
      if (u && u.legL) {
        u.legL.rotation.x = swing; u.legR.rotation.x = -swing;
        u.armL.rotation.x = -swing * 0.75; u.armR.rotation.x = swing * 0.75;
      }
      // Realistic Human Knockback: Light touch tumbles just 2-4m nearby; fast hit knocks back moderately (NEVER flies miles away!)
      const distCar = Math.hypot(h.mesh.position.x - driveState.x, h.mesh.position.z - driveState.z);
      const carSpd = Math.abs(driveState.speed);
      if (!isOnFoot && distCar < 2.3 && carSpd > 2.2) {
        h.flying = true;
        const isLightTouch = carSpd < 12;
        const launchPower = isLightTouch ? (3.2 + carSpd * 0.25) : Math.min(13.5, 5.0 + carSpd * 0.28);
        h.vx = -Math.sin(driveState.heading) * launchPower + (Math.random() - 0.5) * 1.6;
        h.vz = -Math.cos(driveState.heading) * launchPower + (Math.random() - 0.5) * 1.6;
        h.vy = isLightTouch ? 3.2 : Math.min(7.5, 4.2 + carSpd * 0.12);
        h.respawnAt = now + 3500;
        if (Audio) Audio.playTone(180, 0.14, 'triangle', 0.12);
        spawnPoliceChase(now);
      }
    }

    // Exhaust smoke removed per user preference (clean zero-smoke vehicles!)

    // REAL FLOWING CANAL WATER ANIMATION + LIVE SUBTLE ROAD MOTION SHEEN!
    if (animCanalTex) {
      animCanalTex.offset.y -= dt * 0.85;
      animCanalTex.offset.x += Math.sin(now * 0.0015) * dt * 0.08;
    }
    if (animRoadTex && Math.abs(driveState.speed) > 1) {
      animRoadTex.offset.y = (animRoadTex.offset.y - dt * 0.04 * (driveState.speed / 40)) % 1;
    }

    // Real live building window sunlight shimmer + gentle swaying green trees
    const tSec = now * 0.001;
    for (let i = 0; i < animatedFacadeMats.length; i++) {
      animatedFacadeMats[i].emissiveIntensity = 0.025 + 0.04 * (0.5 + 0.5 * Math.sin(tSec * 1.8 + i * 0.85));
    }
    for (let i = 0; i < animatedTrees.length; i++) {
      const can = animatedTrees[i].userData && animatedTrees[i].userData.canopy;
      if (can) can.rotation.z = Math.sin(tSec * 1.6 + i * 0.7) * 0.035;
    }

    driveState._frame = ((driveState._frame || 0) + 1) % 4;
    if (driveState._frame === 0) drawMiniMap();
    renderer.render(scene, camera);
  }

  // TRUE FULL-ROTATION (UP TO ±450°) CIRCULAR STEERING WHEEL (atan2 angular tracking — never snaps back while held!)
  let activeWheelPointerId = null;
  let lastWheelPtrAngle = 0;
  driveState.wheelAngleDeg = 0;

  const getPointerWheelAngle = (e) => {
    const rect = steeringZone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    // Compensate for 90deg clockwise portrait stage rotation so clockwise thumb = clockwise wheel!
    if (isStageRotated()) {
      const rx = dy;
      const ry = -dx;
      dx = rx; dy = ry;
    }
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  steeringZone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    activeWheelPointerId = e.pointerId;
    try { steeringZone.setPointerCapture(e.pointerId); } catch (err) {}
    driveState.wheelDragging = true;
    lastWheelPtrAngle = getPointerWheelAngle(e);
  });

  steeringZone.addEventListener('pointermove', (e) => {
    if (!driveState.wheelDragging || e.pointerId !== activeWheelPointerId) return;
    const curAng = getPointerWheelAngle(e);
    let diff = curAng - lastWheelPtrAngle;
    // Handle seamless -180/+180 wraparound so wheel rotates FULL 360°+ smoothly without EVER snapping back!
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    lastWheelPtrAngle = curAng;
    driveState.wheelAngleDeg = Math.max(-450, Math.min(450, (driveState.wheelAngleDeg || 0) + diff));
    // Clockwise (+) turns car right (-steer), Counter-clockwise (-) turns car left (+steer)
    const norm = Math.max(-1, Math.min(1, -driveState.wheelAngleDeg / 180));
    driveState.targetSteer = Math.abs(driveState.wheelAngleDeg) < 4 ? 0 : norm;
  });

  const releaseWheel = (e) => {
    if (!e || e.pointerId === activeWheelPointerId) {
      activeWheelPointerId = null;
      driveState.wheelDragging = false;
      driveState.targetSteer = 0;
    }
  };
  steeringZone.addEventListener('pointerup', releaseWheel);
  steeringZone.addEventListener('pointercancel', releaseWheel);
  window.addEventListener('pointerup', releaseWheel);
  window.addEventListener('pointercancel', releaseWheel);
  window.addEventListener('blur', () => releaseWheel(null));

  // SILKY-SMOOTH MULTI-TOUCH 360° SCREEN ROTATION (Swipe anywhere on screen with right thumb while Running or Driving with left thumb!)
  let camDragId = null, camLastX = 0, camLastY = 0, lastTapTime = 0;
  const startCamSwipe = (e) => {
    if (camDragId !== null) return;
    // Ignore touches that start directly on HUD buttons, steering wheel, or human joystick
    if (e.target && e.target.closest && e.target.closest('button, #steeringZone, #humanJoyZone, #miniMapCanvas')) return;
    const nowT = performance.now();
    if (nowT - lastTapTime < 260 && !isOnFoot) {
      driveState.camTargetYaw = 0;
      driveState.camTargetPitch = 0.34;
    }
    lastTapTime = nowT;
    camDragId = e.pointerId;
    driveState.camDragging = true;
    camLastX = isStageRotated() ? e.clientY : e.clientX;
    camLastY = isStageRotated() ? -e.clientX : e.clientY;
  };
  playScreen.addEventListener('pointerdown', startCamSwipe);
  window.addEventListener('pointermove', (e) => {
    if (!driveState.camDragging || e.pointerId !== camDragId) return;
    const curX = isStageRotated() ? e.clientY : e.clientX;
    const curY = isStageRotated() ? -e.clientX : e.clientY;
    driveState.camTargetYaw -= (curX - camLastX) * 0.013;
    driveState.camTargetPitch = Math.max(-0.85, Math.min(1.32, driveState.camTargetPitch + (curY - camLastY) * 0.0095));
    camLastX = curX; camLastY = curY;
  }, { passive: true });
  const stopCamDrag = (e) => {
    if (!e || e.pointerId === camDragId) {
      camDragId = null;
      driveState.camDragging = false;
    }
  };
  window.addEventListener('pointerup', stopCamDrag);
  window.addEventListener('pointercancel', stopCamDrag);

  const bindHold = (el, key) => {
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); driveState[key] = true; });
    const off = () => { driveState[key] = false; };
    el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
  };
  bindHold(pedalGas, 'gas'); bindHold(pedalBrake, 'brake'); bindHold(pedalNitro, 'boost');

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') driveState.keys.w = true;
    if (k === 's' || k === 'arrowdown' || k === ' ') driveState.keys.s = true;
    if (k === 'a' || k === 'arrowleft') driveState.keys.a = true;
    if (k === 'd' || k === 'arrowright') driveState.keys.d = true;
    if (e.key === 'Shift') driveState.keys.shift = true;
    if (k === 'h') triggerHorn();
    if (k === 'e') toggleExitEnterCar();
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') driveState.keys.w = false;
    if (k === 's' || k === 'arrowdown' || k === ' ') driveState.keys.s = false;
    if (k === 'a' || k === 'arrowleft') driveState.keys.a = false;
    if (k === 'd' || k === 'arrowright') driveState.keys.d = false;
    if (e.key === 'Shift') driveState.keys.shift = false;
  });

  playRaceBtn.addEventListener('click', () => {
    if (gLaunching) return;
    if (Audio) { Audio.unlock(); Audio.playIgnition(); Audio.startMusic(); }
    // Ensure equipped car is shown for the 3-second launch animation with scenic animated background!
    selectedId = state.equippedId;
    renderGarage();
    const launchBg = document.getElementById('launchBgLayer');
    if (launchBg) launchBg.classList.add('active');
    gLaunching = true;
    gLaunchStart = performance.now();
    if (launchBanner) {
      launchBanner.classList.remove('hidden');
      launchBanner.textContent = 'IGNITING ENGINE... 3';
      setTimeout(() => { if (launchBanner) launchBanner.textContent = 'CHARGING NITRO... 2'; }, 950);
      setTimeout(() => { if (launchBanner) launchBanner.textContent = 'FULL THROTTLE... 1'; }, 1900);
      setTimeout(() => { if (launchBanner) launchBanner.textContent = 'GO!!'; }, 2550);
    }
    setTimeout(() => {
      gLaunching = false;
      const launchBg = document.getElementById('launchBgLayer');
      if (launchBg) launchBg.classList.remove('active');
      if (launchBanner) launchBanner.classList.add('hidden');
      showScreen(playScreen);
      initCityWorld();
      const eq = vehicles.find((v) => v.id === state.equippedId) || vehicles[0];
      if (Audio) Audio.startEngine(eq.modelType);
      lastFrameTime = performance.now();
      if (cityRafId) cancelAnimationFrame(cityRafId);
      cityRafId = requestAnimationFrame(cityLoop);
    }, 3000);
  });

  function launchDirectIntoCity() {
    if (Audio) { Audio.unlock(); Audio.playIgnition(); Audio.startMusic(); }
    showScreen(playScreen);
    initCityWorld();
    const eq = vehicles.find((v) => v.id === state.equippedId) || vehicles[0];
    if (Audio) Audio.startEngine(eq.modelType);
    lastFrameTime = performance.now();
    if (cityRafId) cancelAnimationFrame(cityRafId);
    cityRafId = requestAnimationFrame(cityLoop);
  }

  if (homePlayBtn) {
    homePlayBtn.addEventListener('click', () => {
      // Directly launch 3D City using the already equipped vehicle saved in LocalStorage!
      launchDirectIntoCity();
    });
  }
  if (homeGarageBtn) {
    homeGarageBtn.addEventListener('click', () => {
      if (Audio) { Audio.unlock(); Audio.playTone(620, 0.08); }
      showScreen(garageScreen);
      renderGarage();
    });
  }
  if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', () => {
      if (Audio) Audio.playTone(500, 0.07);
      showScreen(homeScreen);
      renderGarage();
    });
  }


  const hornBtn = document.getElementById('hornBtn');
  let headlightsOn = false; // OFF during Day, turns ON automatically at Night!
  let hornDownAt = 0;
  const startCarHorn = () => {
    hornDownAt = performance.now();
    if (Audio) {
      Audio.unlock();
      if (Audio.startHorn) Audio.startHorn();
      else if (Audio.playHorn) Audio.playHorn();
    }
    // Smart Horn Yielding: Nearby AI traffic cars (ahead OR behind!) smoothly pull aside!
    let yielded = false;
    for (let i = 0; i < trafficCars.length; i++) {
      const tc = trafficCars[i];
      if (tc.wrecked) continue;
      const dist = Math.hypot(tc.mesh.position.x - driveState.x, tc.mesh.position.z - driveState.z);
      if (dist < 30) {
        tc.yieldSide = (tc.yieldSide || 0) === 0 ? (tc.dir > 0 ? 3.0 : -3.0) : tc.yieldSide;
        tc.yieldUntil = performance.now() + 4000;
        yielded = true;
      }
    }
    // Pure loud horn sound without text popup!
  };
  const stopCarHorn = () => {
    const held = performance.now() - hornDownAt;
    const delay = held < 220 ? (220 - held) : 0;
    setTimeout(() => { if (Audio && Audio.stopHorn) Audio.stopHorn(); }, delay);
  };
  const triggerHorn = () => { startCarHorn(); stopCarHorn(); };
  if (hornBtn) {
    // Use native click + touchend (NEVER block touchstart with preventDefault — iOS Safari requires unblocked click/touchend to play audio!)
    const fireHornClean = (e) => {
      if (e) e.stopPropagation();
      if (performance.now() - hornDownAt < 280) return;
      startCarHorn();
    };
    hornBtn.addEventListener('click', fireHornClean);
    hornBtn.addEventListener('touchend', fireHornClean, { passive: true });
  }




  if (miniMapCanvas) {
    miniMapCanvas.style.cursor = 'pointer';
    miniMapCanvas.addEventListener('click', () => {
      if (Audio) Audio.playTone(620, 0.06);
      openModal(`
        <h3 class="font-display text-base font-black text-cyan-300 mb-2">ST GAMES — LIVE CITY GPS MAP</h3>
        <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-200 mb-3">
          <div class="bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-rose-400/40"><span class="font-black text-rose-400">H</span> — + Hospital (24x7)</div>
          <div class="bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-emerald-400/40"><span class="font-black text-emerald-400">D</span> — D-Mart Supermarket</div>
          <div class="bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-purple-400/40"><span class="font-black text-purple-400">M</span> — Mega Mall &amp; Plaza</div>
          <div class="bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-sky-400/40"><span class="font-black text-sky-400">O</span> — Tech Office Park</div>
          <div class="bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-orange-400/40"><span class="font-black text-orange-400">F</span> — Fuel Station</div>
          <div class="bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-pink-400/40"><span class="font-black text-pink-400">S</span> — Royal Cafe &amp; Shops</div>
        </div>
        <div class="text-[11px] text-slate-300 bg-slate-800/70 p-2.5 rounded-xl border border-white/10">
          <div><b class="text-cyan-300">Current Coordinates:</b> X: ${Math.round(driveState.x)}m, Z: ${Math.round(driveState.z)}m</div>
          <div><b class="text-amber-300">Distance Driven:</b> ${totalKmDriven.toFixed(2)} KM</div>
        </div>
      `);
    });
  }

  const exitCarBtn = document.getElementById('exitCarBtn');
  const carControlsBar = document.getElementById('carControlsBar');
  const onFootControlsBar = document.getElementById('onFootControlsBar');
  const enterNearCarBtn = document.getElementById('enterNearCarBtn');
  const humanRunBtn = document.getElementById('humanRunBtn');
  const humanJumpBtn = document.getElementById('humanJumpBtn');
  const humanJoyZone = document.getElementById('humanJoyZone');
  const humanJoyKnob = document.getElementById('humanJoyKnob');

  function setControlModeUI(onFoot) {
    if (carControlsBar) { carControlsBar.classList.toggle('hidden', onFoot); carControlsBar.classList.toggle('flex', !onFoot); }
    if (onFootControlsBar) { onFootControlsBar.classList.toggle('hidden', !onFoot); onFootControlsBar.classList.toggle('flex', onFoot); }
    if (!onFoot && enterNearCarBtn) { enterNearCarBtn.classList.add('hidden'); enterNearCarBtn.classList.remove('flex'); }
  }

  const humanCrouchBtn = document.getElementById('humanCrouchBtn');
  const humanProneBtn = document.getElementById('humanProneBtn');

  const exitCurrentCar = () => {
    if (!playerGroup || !playerAvatar || isOnFoot || vehicleAnim) return;
    parkedCarPos = { x: driveState.x, z: driveState.z, heading: driveState.heading };
    driveState.speed = 0; driveState.gas = false; driveState.brake = false; driveState.boost = false;
    footState.pose = 'stand'; footState.running = false; footState.y = 0.22; footState.vy = 0; footState.jumping = false;
    if (playerGroup.userData && playerGroup.userData.rider) playerGroup.userData.rider.visible = false;
    playerAvatar.visible = true;
    // Smooth 0.45s Door-Open & Step-Out Animation (NO instant glitch pop!)
    const startX = driveState.x, startZ = driveState.z;
    const endX = startX + Math.cos(driveState.heading) * 2.9;
    const endZ = startZ - Math.sin(driveState.heading) * 2.9;
    vehicleAnim = { type: 'exit', t: 0, dur: 0.45, startX, startZ, endX, endZ, heading: driveState.heading };
    if (Audio) { Audio.stopEngine(); Audio.playTone(460, 0.08); }
  };

  const enterNearbyCar = () => {
    if (!isOnFoot || !nearbyVehicleRef || vehicleAnim) return;
    footState.pose = 'stand'; footState.running = false;
    const targetRef = nearbyVehicleRef;
    const spMesh = targetRef.type === 'special' ? targetRef.mesh : (targetRef.type === 'traffic' ? targetRef.car.mesh : null);
    const tx = spMesh ? spMesh.position.x : parkedCarPos.x;
    const tz = spMesh ? spMesh.position.z : parkedCarPos.z;
    const th = spMesh ? spMesh.rotation.y : parkedCarPos.heading;
    let tossedNpc = null;
    if (targetRef.type === 'traffic' && targetRef.car) {
      targetRef.car.curSpeed = 0;
      targetRef.car.hijacking = true;
      // Spawn NPC driver getting pulled out & tossed sideways onto the street!
      if (City3D.createWalkingHuman) {
        tossedNpc = City3D.createWalkingHuman(Math.floor(Math.random() * 8));
        tossedNpc.position.set(tx, 0.22, tz);
        scene.add(tossedNpc);
      }
      showDriveAlert('PULLING DRIVER OUT! 🚗💥', 'bg-amber-400 text-slate-950');
    }
    vehicleAnim = {
      type: 'enter', t: 0, dur: targetRef.type === 'traffic' ? 1.15 : 0.55,
      startX: driveState.x, startZ: driveState.z, endX: tx, endZ: tz, heading: th,
      targetRef, tossedNpc
    };
    if (Audio) Audio.playTone(540, 0.09);
  };

  const toggleExitEnterCar = () => { if (!isOnFoot) exitCurrentCar(); else enterNearbyCar(); };
  if (exitCarBtn) exitCarBtn.addEventListener('click', (e) => { e.preventDefault(); exitCurrentCar(); });
  if (enterNearCarBtn) enterNearCarBtn.addEventListener('click', (e) => { e.preventDefault(); enterNearbyCar(); });

  // Free Fire Style LEFT-SIDE Sprint/RUN Toggle Button!
  if (humanRunBtn) {
    humanRunBtn.addEventListener('click', (e) => {
      e.preventDefault();
      footState.running = !footState.running;
      if (footState.running) footState.pose = 'stand';
      humanRunBtn.classList.toggle('ring-2', footState.running);
      humanRunBtn.classList.toggle('ring-white', footState.running);
      if (Audio) Audio.playTone(footState.running ? 680 : 420, 0.05);
    });
  }
  if (humanCrouchBtn) {
    humanCrouchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      footState.pose = footState.pose === 'crouch' ? 'stand' : 'crouch';
      if (footState.pose !== 'stand') footState.running = false;
      if (Audio) Audio.playTone(460, 0.05);
    });
  }
  if (humanProneBtn) {
    humanProneBtn.addEventListener('click', (e) => {
      e.preventDefault();
      footState.pose = footState.pose === 'prone' ? 'stand' : 'prone';
      if (footState.pose !== 'stand') footState.running = false;
      if (Audio) Audio.playTone(360, 0.05);
    });
  }
  if (humanJumpBtn) {
    humanJumpBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      footState.pose = 'stand';
      if (!footState.jumping) {
        footState.jumping = true;
        footState.vy = 11.4;
        if (Audio) Audio.playTone(440, 0.09, 'sine', 0.1);
      }
    });
  }

  // Smooth 360° Human Analog Thumb Joystick (Free Fire Style)
  let joyPtrId = null;
  const updateHumanJoy = (e) => {
    const rect = humanJoyZone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    if (isStageRotated()) { const rx = dy; const ry = -dx; dx = rx; dy = ry; }
    const maxR = Math.max(36, rect.width * 0.38);
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(maxR, dist);
    const ang = Math.atan2(dy, dx);
    const nx = (Math.cos(ang) * clamped) / maxR;
    const ny = (Math.sin(ang) * clamped) / maxR;
    footState.joyX = Math.abs(nx) < 0.08 ? 0 : nx;
    footState.joyY = Math.abs(ny) < 0.08 ? 0 : ny;
    if (humanJoyKnob) humanJoyKnob.style.transform = `translate(${(nx * 30).toFixed(1)}px, ${(ny * 30).toFixed(1)}px)`;
  };
  if (humanJoyZone) {
    humanJoyZone.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      joyPtrId = e.pointerId;
      try { humanJoyZone.setPointerCapture(e.pointerId); } catch (err) {}
      updateHumanJoy(e);
    });
    humanJoyZone.addEventListener('pointermove', (e) => {
      if (e.pointerId === joyPtrId) updateHumanJoy(e);
    });
    const resetJoy = (e) => {
      if (!e || e.pointerId === joyPtrId) {
        joyPtrId = null; footState.joyX = 0; footState.joyY = 0;
        if (humanJoyKnob) humanJoyKnob.style.transform = 'translate(0px, 0px)';
      }
    };
    humanJoyZone.addEventListener('pointerup', resetJoy);
    humanJoyZone.addEventListener('pointercancel', resetJoy);
  }

  const camToggleBtn = document.getElementById('camToggleBtn');
  if (camToggleBtn) {
    const camLabels = ['CAM: CHASE', 'CAM: HOOD', 'CAM: FAR'];
    camToggleBtn.addEventListener('click', () => {
      camModeIdx = (camModeIdx + 1) % 3;
      driveState.camOrbitYaw = 0; driveState.camTargetYaw = 0;
      camToggleBtn.textContent = camLabels[camModeIdx];
      if (Audio) Audio.playTone(680, 0.06);
    });
  }

  const skyToggleBtn = document.getElementById('skyToggleBtn');
  if (skyToggleBtn) {
    const skyThemes = [
      { label: '☀️ DAY', bg: 0x87ceeb, fog: 0xe0f2fe, sunC: 0xfffbeb, sunI: 1.25, hemiI: 1.15 },
      { label: '🌇 SUNSET', bg: 0xf97316, fog: 0xfdba74, sunC: 0xffedd5, sunI: 1.1, hemiI: 0.92 },
      { label: '🌙 NIGHT', bg: 0x060b18, fog: 0x0f172a, sunC: 0x38bdf8, sunI: 0.65, hemiI: 0.65 }
    ];
    skyToggleBtn.addEventListener('click', () => {
      skyModeIdx = (skyModeIdx + 1) % 3;
      const th = skyThemes[skyModeIdx];
      skyToggleBtn.textContent = th.label;
      if (scene) {
        scene.background = new THREE.Color(th.bg);
        scene.fog = new THREE.FogExp2(th.fog, 0.0022);
      }
      if (sunLightRef) { sunLightRef.color.setHex(th.sunC); sunLightRef.intensity = th.sunI; }
      if (hemiLightRef) hemiLightRef.intensity = th.hemiI;
      // Headlight beams turn ON automatically ONLY in Night mode, OFF during Day & Sunset!
      headlightsOn = (skyModeIdx === 2);
      if (playerGroup && playerGroup.userData && playerGroup.userData.headBeams) {
        playerGroup.userData.headBeams.forEach((b) => { b.visible = headlightsOn; });
      }
      if (Audio) Audio.playTone(580, 0.06);
    });
  }


  // ================= ST GAMES ENTRANCE SCREEN BUTTON HANDLERS =================
  const homeStoreBtn = document.getElementById('homeStoreBtn');
  const homeMissionsBtn = document.getElementById('homeMissionsBtn');
  const homeAchievementsBtn = document.getElementById('homeAchievementsBtn');
  const homeLeaderboardBtn = document.getElementById('homeLeaderboardBtn');
  const homeMoreGamesBtn = document.getElementById('homeMoreGamesBtn');
  const homeMenuBtn = document.getElementById('homeMenuBtn');
  const homeExitBtn = document.getElementById('homeExitBtn');
  const homeGemsEl = document.getElementById('homeGemsEl');

  function syncHomeExtraHUD() {
    if (homeGemsEl) homeGemsEl.textContent = ((state.level || 1) * 250 + state.ownedIds.size * 150).toLocaleString();
  }
  syncHomeExtraHUD();

  if (homeStoreBtn) {
    homeStoreBtn.addEventListener('click', () => {
      if (Audio) { Audio.unlock(); Audio.playTone(660, 0.08); }
      showScreen(garageScreen);
      renderGarage();
    });
  }
  if (homeMissionsBtn) {
    homeMissionsBtn.addEventListener('click', () => {
      if (Audio) { Audio.unlock(); Audio.playTone(600, 0.07); }
      openModal(`
        <h3 class="font-display text-lg font-black text-amber-300 mb-2">CITY MISSIONS</h3>
        <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
          ${cityTasks.map((t, idx) => {
            const done = idx < (state.taskIndex % cityTasks.length);
            const cur = idx === (state.taskIndex % cityTasks.length);
            return `<div class="flex items-center justify-between px-3 py-2 rounded-xl border ${cur ? 'bg-cyan-500/20 border-cyan-400' : done ? 'bg-emerald-500/15 border-emerald-400/40' : 'bg-slate-800/80 border-white/10'}">
              <div class="text-xs font-bold text-white">${done ? '✅ ' : cur ? '🎯 ' : '• '}${t.label}</div>
              <span class="text-[11px] font-black text-amber-300">+${t.reward} C</span>
            </div>`;
          }).join('')}
        </div>
      `);
    });
  }
  if (homeAchievementsBtn) {
    homeAchievementsBtn.addEventListener('click', () => {
      if (Audio) { Audio.unlock(); Audio.playTone(640, 0.07); }
      const achs = [
        { title: 'First Keys', desc: 'Own your starter supercar', done: state.ownedIds.size >= 1 },
        { title: 'Collector', desc: 'Unlock 3+ Vehicles in Garage', done: state.ownedIds.size >= 3 },
        { title: 'Rich Racer', desc: 'Hold 25,000+ Gold Coins', done: state.coins >= 25000 },
        { title: 'Pro Driver', desc: 'Reach Driver Level 2+', done: (state.level || 1) >= 2 },
        { title: 'Tuned Machine', desc: 'Upgrade Engine, Nitro or Tires', done: (state.upgradeLevels.engine + state.upgradeLevels.nitro + state.upgradeLevels.tires) > 3 }
      ];
      openModal(`
        <h3 class="font-display text-lg font-black text-yellow-300 mb-2">ACHIEVEMENTS</h3>
        <div class="space-y-2">
          ${achs.map((a) => `
            <div class="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/90 border ${a.done ? 'border-emerald-400/50' : 'border-white/10'}">
              <div><div class="text-xs font-extrabold text-white">${a.title}</div><div class="text-[10px] text-slate-400">${a.desc}</div></div>
              <span class="text-xs font-black ${a.done ? 'text-emerald-300' : 'text-slate-500'}">${a.done ? '🏆 UNLOCKED' : 'LOCKED'}</span>
            </div>
          `).join('')}
        </div>
      `);
    });
  }
  if (homeLeaderboardBtn) {
    homeLeaderboardBtn.addEventListener('click', () => {
      if (Audio) { Audio.unlock(); Audio.playTone(620, 0.07); }
      const rows = [
        { name: 'ST_King_99', lv: 18, coins: 245000 },
        { name: 'Hyd_Nitro_X', lv: 14, coins: 182400 },
        { name: 'Apex_Veloce', lv: 11, coins: 134900 },
        { name: 'YOU (Player)', lv: state.level || 1, coins: state.coins, me: true }
      ].sort((a, b) => b.coins - a.coins);
      openModal(`
        <h3 class="font-display text-lg font-black text-cyan-300 mb-2">ST GAMES LEADERBOARD</h3>
        <div class="space-y-2">
          ${rows.map((r, i) => `
            <div class="flex items-center justify-between px-3 py-2 rounded-xl border ${r.me ? 'bg-cyan-500/20 border-cyan-400' : 'bg-slate-800/90 border-white/10'}">
              <div class="flex items-center gap-2"><span class="font-display text-xs font-black text-amber-300">#${i + 1}</span><span class="text-xs font-extrabold text-white">${r.name}</span><span class="text-[10px] text-cyan-300">LV ${r.lv}</span></div>
              <span class="font-display text-xs font-black text-amber-300">${r.coins.toLocaleString()} C</span>
            </div>
          `).join('')}
        </div>
      `);
    });
  }
  if (homeMenuBtn) {
    homeMenuBtn.addEventListener('click', () => {
      if (Audio) { Audio.unlock(); Audio.playTone(580, 0.07); }
      const eqM = vehicles.find((v) => v.id === state.equippedId) || vehicles[0];
      openModal(`
        <h3 class="font-display text-lg font-black text-cyan-300 mb-2">GAME MENU</h3>
        <div class="space-y-2 text-xs text-slate-200">
          <div class="bg-slate-800/90 p-3 rounded-xl border border-white/10 flex justify-between"><span>Saved Active Vehicle</span><span class="font-bold text-emerald-300">${eqM.name}</span></div>
          <div class="bg-slate-800/90 p-3 rounded-xl border border-white/10 flex justify-between"><span>Vehicles Owned</span><span class="font-bold text-cyan-300">${state.ownedIds.size} / ${vehicles.length}</span></div>
          <div class="bg-slate-800/90 p-3 rounded-xl border border-white/10"><div class="font-bold text-amber-300 mb-1">Controls</div><div>Left: 360° Steering Wheel + Nitro ⚡ | Right: Brake 🛑 + Gas 🚀 | Drag Screen: 360° Camera</div></div>
          <button id="menuQuickPlayBtn" type="button" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-display font-black text-xs cursor-pointer">DRIVE NOW &raquo;</button>
        </div>
      `);
      const qp = document.getElementById('menuQuickPlayBtn');
      if (qp) qp.addEventListener('click', () => { closeModal(); launchDirectIntoCity(); });
    });
  }
  if (homeMoreGamesBtn) {
    homeMoreGamesBtn.addEventListener('click', () => {
      if (Audio) { Audio.unlock(); Audio.playTone(620, 0.07); }
      openModal(`
        <h3 class="font-display text-lg font-black text-cyan-300 mb-2">MORE ST GAMES</h3>
        <p class="text-xs text-slate-300 mb-3">Play more free HTML5 &amp; 3D web games on ST Games!</p>
        <a href="https://stgames.online" target="_blank" rel="noopener" class="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-display font-black text-xs">VISIT STGAMES.ONLINE &raquo;</a>
      `);
    });
  }
  if (homeExitBtn) {
    homeExitBtn.addEventListener('click', () => {
      if (Audio) { Audio.unlock(); Audio.playTone(320, 0.1, 'triangle', 0.08); }
      openModal(`
        <div class="text-center">
          <h3 class="font-display text-lg font-black text-rose-400 mb-2">EXIT GAME?</h3>
          <p class="text-xs text-slate-300 mb-4">Your coins &amp; unlocked vehicles are automatically saved in LocalStorage.</p>
          <div class="grid grid-cols-2 gap-2">
            <button id="cancelExitBtn" type="button" class="py-2.5 rounded-xl bg-slate-800 border border-white/15 text-white font-bold text-xs cursor-pointer">STAY &amp; PLAY</button>
            <a href="https://stgames.online" class="py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center">GO TO ST GAMES</a>
          </div>
        </div>
      `);
      const ce = document.getElementById('cancelExitBtn');
      if (ce) ce.addEventListener('click', closeModal);
    });
  }

  exitToGarageBtn.addEventListener('click', () => {
    if (Audio) { Audio.stopEngine(); Audio.stopMusic(); if (Audio.stopHorn) Audio.stopHorn(); }
    if (cityRafId) { cancelAnimationFrame(cityRafId); cityRafId = null; }
    showScreen(garageScreen);
    renderGarage();
  });

  window.addEventListener('resize', resizeCanvases);

  // Open on the Entrance Page (PLAY / GARAGE / SETTINGS) with saved LocalStorage car ready!
  showScreen(homeScreen);
  renderGarage();
})();
