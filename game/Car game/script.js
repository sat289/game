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
  const footState = { joyX: 0, joyY: 0, running: false, vy: 0, y: 0.22, jumping: false };
  let coinMeshes = [], trafficCars = [], walkingHumans = [], stuntRamps = [], trafficSignals = [], cityLandmarks = [], emergencyEvents = [];
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
    camOrbitYaw: 0, camOrbitPitch: 0.34, camDragging: false,
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
            const fenceLen = BLOCK_STEP - 11; // Leaves clean open gap right at each road bridge!
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
                  minX: cx + ox - 1.5, maxX: cx + ox + 1.5,
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
                  minZ: cz + oz - 1.5, maxZ: cz + oz + 1.5
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
            const carMargin = 0.85;

            // Check if this block is a special BRANDED LANDMARK (Hospital, D-Mart, Mega Mall, Office Park, Petrol Bunk, Cafe Plaza!)
            const landmarkMap = {
              '0,-1':  { kind: 'dmart',    title: 'D-MART',     sub: 'SUPERMARKET', bg: '#15803d', fg: '#fde047', wall: 0x166534, mapTag: 'D', mapCol: '#22c55e' },
              '-1,0':  { kind: 'hospital', title: '+ HOSPITAL', sub: '24x7 EMERGENCY', bg: '#dc2626', fg: '#ffffff', wall: 0xe2e8f0, mapTag: 'H', mapCol: '#ef4444' },
              '1,0':   { kind: 'mall',     title: 'MEGA MALL',  sub: 'SHOPS & CINEMA', bg: '#6d28d9', fg: '#38bdf8', wall: 0x3b0764, mapTag: 'M', mapCol: '#a855f7' },
              '0,1':   { kind: 'office',   title: 'TECH OFFICE',sub: 'IT TOWER', bg: '#0284c7', fg: '#ffffff', wall: 0x0f2354, mapTag: 'O', mapCol: '#38bdf8' },
              '-1,-1': { kind: 'fuel',     title: 'FUEL STATION',sub: 'PETROL & EV', bg: '#ea580c', fg: '#fef08a', wall: 0x9a3412, mapTag: 'F', mapCol: '#f97316' },
              '1,1':   { kind: 'cafe',     title: 'ROYAL CAFE', sub: 'BAKERY & SHOPS', bg: '#be185d', fg: '#fde68a', wall: 0x831843, mapTag: 'S', mapCol: '#ec4899' },
              '-3,-1': { kind: 'dmart',    title: 'D-MART',     sub: 'HYPERMARKET', bg: '#15803d', fg: '#fde047', wall: 0x166534, mapTag: 'D', mapCol: '#22c55e' },
              '3,2':   { kind: 'hospital', title: '+ HOSPITAL', sub: 'CITY CARE', bg: '#dc2626', fg: '#ffffff', wall: 0xe2e8f0, mapTag: 'H', mapCol: '#ef4444' },
              '-2,3':  { kind: 'mall',     title: 'ST PLAZA',   sub: 'SHOPPING MART', bg: '#0369a1', fg: '#fde047', wall: 0x0c3b52, mapTag: 'M', mapCol: '#a855f7' },
              '3,-3':  { kind: 'office',   title: 'CITY OFFICE',sub: 'CORPORATE HQ', bg: '#1e3a8a', fg: '#7dd3fc', wall: 0x0a1738, mapTag: 'O', mapCol: '#38bdf8' }
            };
            const lm = landmarkMap[`${gx},${gz}`];

            if (lm) {
              // Build Distinct 3D Branded Landmark (Hospital / D-Mart / Mega Mall / Office / Petrol Bunk / Cafe!)
              const lmH = lm.kind === 'office' ? 32 : lm.kind === 'mall' ? 20 : lm.kind === 'hospital' ? 16 : lm.kind === 'fuel' ? 6.5 : 11;
              const lmW = lm.kind === 'fuel' ? 18 : 26;
              const lmD = lm.kind === 'fuel' ? 14 : 22;
              const lmMat = new THREE.MeshStandardMaterial({ color: lm.wall, roughness: 0.45, metalness: 0.25 });
              const mainB = new THREE.Mesh(new THREE.BoxGeometry(lmW, lmH, lmD), lmMat);
              mainB.position.set(cx, lmH / 2 + 0.22, cz);
              scene.add(mainB);

              // Glowing Front Glass Storefront + Colored Awning Canopy
              const glassF = new THREE.Mesh(new THREE.BoxGeometry(lmW * 0.82, Math.min(4.6, lmH * 0.45), lmD + 0.35), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.35, roughness: 0.12, metalness: 0.8 }));
              glassF.position.set(cx, 2.5, cz);
              const canopy = new THREE.Mesh(new THREE.BoxGeometry(lmW + 1.8, 0.7, lmD + 2.2), new THREE.MeshStandardMaterial({ color: lm.bg, roughness: 0.4 }));
              canopy.position.set(cx, 5.1, cz);
              scene.add(glassF, canopy);

              // Crisp 3D Rooftop Signboard Texture (D-MART, + HOSPITAL, MEGA MALL, TECH OFFICE, FUEL STATION, ROYAL CAFE!)
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
              signBox.position.set(cx, lmH + 2.6, cz);
              scene.add(signBox);

              cellColliders.push({
                minX: cx - lmW / 2 - carMargin, maxX: cx + lmW / 2 + carMargin,
                minZ: cz - lmD / 2 - carMargin, maxZ: cz + lmD / 2 + carMargin
              });
              cityLandmarks.push({ x: cx, z: cz, tag: lm.mapTag, color: lm.mapCol, title: lm.title });
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
                // Tapered natural bark trunk
                dummy.position.set(tx, tH * 0.5, tz); dummy.scale.set(0.55, tH, 0.55); dummy.rotation.set(0, tRot, 0); dummy.updateMatrix();
                treeTrunkMatrices.push(dummy.matrix.clone());
                // Layer 1: Wide deep-green lower leaf boughs
                dummy.position.set(tx + Math.cos(tRot) * 0.45, tH + 0.55, tz + Math.sin(tRot) * 0.45);
                dummy.scale.set(2.55, 1.35, 2.35); dummy.rotation.set(0.08, tRot, -0.06); dummy.updateMatrix();
                treeLeafLowMatrices.push(dummy.matrix.clone());
                // Layer 2: Offset lush mid-green foliage cluster
                dummy.position.set(tx - Math.cos(tRot) * 0.52, tH + 1.15, tz - Math.sin(tRot) * 0.48);
                dummy.scale.set(2.15, 1.45, 2.05); dummy.rotation.set(-0.07, tRot + 1.1, 0.08); dummy.updateMatrix();
                treeLeafMidMatrices.push(dummy.matrix.clone());
                // Layer 3: Sunlit fresh-green upper crown
                dummy.position.set(tx, tH + 1.85, tz);
                dummy.scale.set(1.65, 1.25, 1.58); dummy.rotation.set(0.05, tRot + 2.2, 0.04); dummy.updateMatrix();
                treeLeafTopMatrices.push(dummy.matrix.clone());
                dummy.rotation.set(0, 0, 0);

                // SOLID TREE COLLIDER: Car & Avatar stop cleanly outside every tree trunk!
                cellColliders.push({ minX: tx - 1.35, maxX: tx + 1.35, minZ: tz - 1.35, maxZ: tz + 1.35 });
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
        const tBarkMat = new THREE.MeshStandardMaterial({ color: 0x4a2f1d, roughness: 0.94 });
        const tLeafLowMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.84 });
        const tLeafMidMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.80 });
        const tLeafTopMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.76 });
        const tTrunkIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.52, 1, 10), tBarkMat, treeTrunkMatrices.length);
        const foliageGeo = new THREE.IcosahedronGeometry(0.92, 1);
        const tLowIM = new THREE.InstancedMesh(foliageGeo, tLeafLowMat, treeLeafLowMatrices.length);
        const tMidIM = new THREE.InstancedMesh(foliageGeo, tLeafMidMat, treeLeafMidMatrices.length);
        const tTopIM = new THREE.InstancedMesh(foliageGeo, tLeafTopMat, treeLeafTopMatrices.length);
        treeTrunkMatrices.forEach((m, i) => tTrunkIM.setMatrixAt(i, m));
        treeLeafLowMatrices.forEach((m, i) => tLowIM.setMatrixAt(i, m));
        treeLeafMidMatrices.forEach((m, i) => tMidIM.setMatrixAt(i, m));
        treeLeafTopMatrices.forEach((m, i) => tTopIM.setMatrixAt(i, m));
        scene.add(tTrunkIM, tLowIM, tMidIM, tTopIM);
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
      const buildBridge = (bx, bz, alongX) => {
        const bg = new THREE.Group();
        bg.position.set(bx, 0, bz);
        if (!alongX) bg.rotation.y = Math.PI / 2;
        const deck = new THREE.Mesh(new THREE.BoxGeometry(22, 0.36, 17.5), bridgeDeckMat);
        deck.position.y = 0.28;
        const rail1 = new THREE.Mesh(new THREE.BoxGeometry(22, 1.15, 0.45), bridgeRailMat); rail1.position.set(0, 0.95, -8.5);
        const rail2 = rail1.clone(); rail2.position.z = 8.5;
        // Sleek twin suspension arch ribs over the canal bridge
        const arch1 = new THREE.Mesh(new THREE.TorusGeometry(9.8, 0.34, 8, 24, Math.PI), bridgeRailMat);
        arch1.position.set(0, 0.5, -8.5);
        const arch2 = arch1.clone(); arch2.position.z = 8.5;
        const line = new THREE.Mesh(new THREE.PlaneGeometry(21.6, 0.42), whiteLineMat);
        line.rotation.x = -Math.PI / 2; line.position.y = 0.48;
        bg.add(deck, rail1, rail2, arch1, arch2, line);
        scene.add(bg);
      };
      // Place Bridges across Canal 1 (North-South at x = 2*58 + 29 = 145) at every E-W road (z = g * 58)
      const canal1X = 2 * BLOCK_STEP + BLOCK_STEP / 2;
      for (let g = -9; g <= 10; g++) buildBridge(canal1X, g * BLOCK_STEP, true);
      // Place Bridges across Canal 2 (East-West at z = -2*58 + 29 = -87) at every N-S road (x = g * 58)
      const canal2Z = -2 * BLOCK_STEP + BLOCK_STEP / 2;
      for (let g = -9; g <= 10; g++) buildBridge(g * BLOCK_STEP, canal2Z, false);

      const coinGeo = new THREE.CylinderGeometry(1.45, 1.45, 0.36, 22);
      coinGeo.rotateX(Math.PI / 2);
      const coinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xf59e0b, emissiveIntensity: 0.85, metalness: 0.9, roughness: 0.12 });
      const haloGeo = new THREE.RingGeometry(1.3, 1.85, 20);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
      for (let i = 0; i < 180; i++) {
        const lane = ((i % 19) - 9) * BLOCK_STEP;
        const along = ((Math.floor(i / 11) * 58) - 250) + (i % 3) * 16;
        const cg = new THREE.Group();
        const coinDisc = new THREE.Mesh(coinGeo, coinMat);
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
      // Spawn 36 Animated 3D Walking Humans strolling along City Footpaths!
      if (City3D.createWalkingHuman) {
        for (let p = 0; p < 18; p++) {
          const human = City3D.createWalkingHuman(p);
          const axis = p % 2 === 0 ? 'z' : 'x';
          const dir = (p % 4 < 2) ? 1 : -1;
          const blockIdx = (p % 7) - 3;
          const sideEdge = blockIdx * BLOCK_STEP + (dir > 0 ? 11.2 : -11.2); // right on the footpath curb!
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
    nitroFlames = built.flames;
    scene.add(playerGroup);
    if (!playerAvatar && City3D.createWalkingHuman) {
      playerAvatar = City3D.createWalkingHuman(1);
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
  function buildFireEngine3D() {
    const g = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.45, roughness: 0.25 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.12 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.1 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 7.0), redMat); body.position.y = 1.55;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.26, 7.05), whiteMat); stripe.position.y = 1.35;
    const ws = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.85, 0.2), glassMat); ws.position.set(0, 2.05, -3.45);
    const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 5.4), chromeMat); ladder.position.set(0, 2.82, 0.55);
    const beaconR = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.32), new THREE.MeshBasicMaterial({ color: 0xff1e1e }));
    beaconR.position.set(-0.55, 2.80, -2.5);
    const beaconB = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.32), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    beaconB.position.set(0.55, 2.80, -2.5);
    g.add(body, stripe, ws, ladder, beaconR, beaconB);
    [[-1.3, -2.1], [1.3, -2.1], [-1.3, 2.1], [1.3, 2.1]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.42, 16), tireMat);
      w.rotation.z = Math.PI / 2; w.position.set(wx, 0.55, wz); g.add(w);
    });
    g.userData = { beaconR, beaconB };
    return g;
  }

  function buildAmbulance3D() {
    const g = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.25, roughness: 0.25 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.1 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.1, 5.8), whiteMat); body.position.y = 1.48;
    const redBand = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.28, 5.85), redMat); redBand.position.y = 1.12;
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(2.40, 0.22, 0.85), redMat); crossH.position.set(0, 1.85, 0.6);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(2.40, 0.85, 0.22), redMat); crossV.position.set(0, 1.85, 0.6);
    const ws = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.78, 0.2), glassMat); ws.position.set(0, 1.92, -2.85);
    const beaconR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.24, 0.3), new THREE.MeshBasicMaterial({ color: 0xff1e1e }));
    beaconR.position.set(-0.5, 2.66, -1.8);
    const beaconB = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.24, 0.3), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    beaconB.position.set(0.5, 2.66, -1.8);
    g.add(body, redBand, crossH, crossV, ws, beaconR, beaconB);
    [[-1.2, -1.7], [1.2, -1.7], [-1.2, 1.7], [1.2, 1.7]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.38, 16), tireMat);
      w.rotation.z = Math.PI / 2; w.position.set(wx, 0.48, wz); g.add(w);
    });
    g.userData = { beaconR, beaconB };
    return g;
  }

  function triggerTrafficAccident(trafficCar, now) {
    if (trafficCar.wrecked) return;
    trafficCar.wrecked = true;
    trafficCar.curSpeed = 0;

    // Knock the hit AI car sideways onto the road & tilt it realistically!
    const ax = trafficCar.mesh.position.x + (Math.random() > 0.5 ? 2.4 : -2.4);
    const az = trafficCar.mesh.position.z + (Math.random() > 0.5 ? 2.4 : -2.4);
    trafficCar.mesh.position.set(ax, 0.22, az);
    trafficCar.mesh.rotation.z = 0.58; // Tilted accident wreck!
    trafficCar.mesh.rotation.y += 0.7;

    // 1. Live 3D Burning Fire Flames + Rising Smoke Cloud on the wrecked car!
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

    // 2. Fallen Injured 3D Human beside the wrecked car!
    const victim = City3D.createWalkingHuman ? City3D.createWalkingHuman(Math.floor(Math.random() * 8)) : new THREE.Group();
    const vx = ax + 3.4, vz = az + 1.8;
    victim.position.set(vx, 0.35, vz);
    victim.rotation.x = Math.PI / 2; // Lying fallen beside the car!
    scene.add(victim);

    // 3. Dispatch 3D Fire Engine & 3D Ambulance with CLEAN STRAIGHT ROAD WAYPOINTS (ZERO Glitch / ZERO Oscillation!)
    const roadX = Math.round(ax / BLOCK_STEP) * BLOCK_STEP;
    const roadZ = Math.round(az / BLOCK_STEP) * BLOCK_STEP;
    const alongZ = Math.abs(ax - roadX) <= Math.abs(az - roadZ);

    const fireTruck = buildFireEngine3D();
    const ftStart = alongZ ? { x: roadX - 2.6, z: az - 54 } : { x: ax - 54, z: roadZ - 2.6 };
    const ftStop  = alongZ ? { x: roadX - 2.6, z: az - 6.8 } : { x: ax - 6.8, z: roadZ - 2.6 };
    const ftExit  = alongZ ? { x: roadX - 2.6, z: az + 85 } : { x: ax + 85, z: roadZ - 2.6 };
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

    const ambulance = buildAmbulance3D();
    const ambStart = alongZ ? { x: roadX + 2.6, z: az + 58 } : { x: ax + 58, z: roadZ + 2.6 };
    const ambStop  = alongZ ? { x: roadX + 2.6, z: az + 5.8 } : { x: ax + 5.8, z: roadZ + 2.6 };
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
    // Clean 2-step L-shaped road waypoints from accident to Hospital (NEVER cuts through walls, NEVER oscillates!)
    const ambWaypoints = alongZ
      ? [{ x: roadX + 2.6, z: hospitalTarget.z }, { x: hospitalTarget.x, z: hospitalTarget.z }]
      : [{ x: hospitalTarget.x, z: roadZ + 2.6 }, { x: hospitalTarget.x, z: hospitalTarget.z }];

    if (Audio) { Audio.playCrash(); if (Audio.playSiren) Audio.playSiren(); }
    showDriveAlert('CAR ACCIDENT! FIRE ENGINE & AMBULANCE ON THE WAY! 🚒🚑', 'bg-rose-600 text-white');

    emergencyEvents.push({
      trafficCar, ax, az, vx, vz,
      fireGroup, flames, smokePuffs, waterJet,
      victim, fireTruck, ambulance, hospitalTarget,
      ftStop, ftExit, ambStop, ambWaypoints, ambWpIdx: 0,
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
    const nitroOn = (driveState.boost || driveState.keys.shift) && driveState.nitro > 4 && gasOn;

    if (nitroOn) { driveState.nitro = Math.max(0, driveState.nitro - 26 * dt); driveState._wasNitro = true; }
    else { if (driveState._wasNitro && Audio && Audio.playTurboPshh) Audio.playTurboPshh(); driveState._wasNitro = false; driveState.nitro = Math.min(100, driveState.nitro + 14 * dt); }

    for (const f of nitroFlames) {
      f.visible = nitroOn;
      if (nitroOn) f.scale.y = 0.8 + Math.random() * 0.6;
    }

    const nitroMult = 1.30 + Math.min(0.32, ((state.upgradeLevels.nitro - 1) * 0.03) + ((state.level || 1) - 1) * 0.03);
    const effectiveMax = nitroOn ? maxSpeed * nitroMult : maxSpeed;
    if (gasOn) driveState.speed += (nitroOn ? accelRate * 1.65 : accelRate) * dt;
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
          if (nextX > b.minX && nextX < b.maxX && nextZ > b.minZ && nextZ < b.maxZ) {
            collided = true;
            if (prevX <= b.minX || prevX >= b.maxX) nextX = prevX;
            if (prevZ <= b.minZ || prevZ >= b.maxZ) nextZ = prevZ;
            break outerColl;
          }
        }
      }
    }

    if (collided) {
      const impactSpeed = Math.abs(driveState.speed);
      driveState.speed = -driveState.speed * 0.35;
      if (impactSpeed > 8 && now - driveState.lastCrashAt > 450) {
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

    // SOLID COLLISION WITH FIRE ENGINE & AMBULANCE (Player NEVER passes through emergency vehicles!)
    for (let eIdx = 0; eIdx < emergencyEvents.length; eIdx++) {
      const ev = emergencyEvents[eIdx];
      [ev.fireTruck, ev.ambulance].forEach((emVeh) => {
        if (!emVeh || !emVeh.visible) return;
        const dEm = Math.hypot(driveState.x - emVeh.position.x, driveState.z - emVeh.position.z);
        if (dEm < 4.2) {
          const ang = Math.atan2(driveState.x - emVeh.position.x, driveState.z - emVeh.position.z);
          driveState.x = emVeh.position.x + Math.sin(ang) * 4.4;
          driveState.z = emVeh.position.z + Math.cos(ang) * 4.4;
          driveState.speed = -driveState.speed * 0.35;
        }
      });
    }

    if (isOnFoot && playerAvatar) {
      // DEDICATED HUMAN ON-FOOT CONTROLS (Joystick 360° + RUN Sprint + JUMP Gravity — NO car steering or gas!)
      let inX = footState.joyX;
      let inY = footState.joyY; // -1 forward, +1 backward
      if (driveState.keys.w) inY -= 1;
      if (driveState.keys.s) inY += 1;
      if (driveState.keys.a) inX -= 1;
      if (driveState.keys.d) inX += 1;
      const mag = Math.min(1, Math.hypot(inX, inY));
      const moveSpd = (footState.running || driveState.keys.shift) ? 14.5 : 6.8;

      if (mag > 0.08) {
        // Move relative to current camera yaw so pushing joystick UP always runs forward on screen!
        const camYaw = driveState.heading + driveState.camOrbitYaw;
        const moveAng = camYaw + Math.atan2(-inX, -inY);
        const fdx = -Math.sin(moveAng) * moveSpd * mag * dt;
        const fdz = -Math.cos(moveAng) * moveSpd * mag * dt;
        let fx = driveState.x + fdx;
        let fz = driveState.z + fdz;
        // Solid 3x3 collision check for running human against buildings, trees, canal fences & ALL traffic cars!
        const cX = Math.floor(fx / BLOCK_STEP), cZ = Math.floor(fz / BLOCK_STEP);
        footCollLoop:
        for (let ox = -1; ox <= 1; ox++) {
          for (let oz = -1; oz <= 1; oz++) {
            const nb = colliderGrid.get(`${cX + ox},${cZ + oz}`);
            if (!nb) continue;
            for (let bi = 0; bi < nb.length; bi++) {
              const b = nb[bi];
              if (fx > b.minX && fx < b.maxX && fz > b.minZ && fz < b.maxZ) {
                if (driveState.x <= b.minX || driveState.x >= b.maxX) fx = driveState.x;
                if (driveState.z <= b.minZ || driveState.z >= b.maxZ) fz = driveState.z;
                break footCollLoop;
              }
            }
          }
        }
        // Prevent human from walking through any AI traffic car!
        for (let ti = 0; ti < trafficCars.length; ti++) {
          const tc = trafficCars[ti];
          const dCar = Math.hypot(fx - tc.mesh.position.x, fz - tc.mesh.position.z);
          if (dCar < 2.6) {
            const pa = Math.atan2(fx - tc.mesh.position.x, fz - tc.mesh.position.z);
            fx = tc.mesh.position.x + Math.sin(pa) * 2.65;
            fz = tc.mesh.position.z + Math.cos(pa) * 2.65;
          }
        }
        driveState.x = fx;
        driveState.z = fz;
        playerAvatar.rotation.y = moveAng + Math.PI;
      }

      // JUMP Physics with Gravity!
      if (footState.jumping) {
        footState.y += footState.vy * dt;
        footState.vy -= 26 * dt;
        if (footState.y <= 0.22) {
          footState.y = 0.22; footState.vy = 0; footState.jumping = false;
        }
      }
      playerAvatar.position.set(driveState.x, footState.y, driveState.z);
      const u = playerAvatar.userData;
      if (u && u.legL) {
        const freq = footState.running ? 0.017 : 0.011;
        const amp = footState.jumping ? 0.45 : (mag > 0.08 ? (footState.running ? 0.85 : 0.52) : 0);
        const sw = footState.jumping ? 0.45 : (mag > 0.08 ? Math.sin(now * freq) * amp : 0);
        u.legL.rotation.x = sw; u.legR.rotation.x = -sw;
        u.armL.rotation.x = -sw * 0.9; u.armR.rotation.x = sw * 0.9;
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
      const enterNearBtn = document.getElementById('enterNearCarBtn');
      if (enterNearBtn) {
        enterNearBtn.classList.toggle('hidden', !nearbyVehicleRef);
        enterNearBtn.classList.toggle('flex', Boolean(nearbyVehicleRef));
      }

      // Keep parked car at its exact spot
      playerGroup.position.set(parkedCarPos.x, 0, parkedCarPos.z);
      playerGroup.rotation.y = parkedCarPos.heading;
    } else {
      playerGroup.position.set(driveState.x, 0, driveState.z);
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

    // 360-Degree Screen-Drag Camera Orbit around the Car (Car stays/drives normally while camera orbits 360°!)
    const camDist = isOnFoot ? 6.2 : (camModeIdx === 1 ? 1.8 : camModeIdx === 2 ? 14.5 : (eq.modelType === 'heavy_truck' ? 11.8 : 9.4));
    const totalCamYaw = driveState.heading + driveState.camOrbitYaw;
    const camPitch = Math.max(0.14, Math.min(0.95, driveState.camOrbitPitch));
    const horizDist = Math.cos(camPitch) * camDist;
    const targetCamX = driveState.x + Math.sin(totalCamYaw) * horizDist;
    const targetCamY = Math.max(1.5, Math.sin(camPitch) * camDist + 0.9);
    const targetCamZ = driveState.z + Math.cos(totalCamYaw) * horizDist;
    const camLerp = driveState.camDragging ? Math.min(1, 16 * dt) : Math.min(1, 8.5 * dt);
    camera.position.x += (targetCamX - camera.position.x) * camLerp;
    camera.position.y += (targetCamY - camera.position.y) * camLerp;
    camera.position.z += (targetCamZ - camera.position.z) * camLerp;
    const targetFov = 60 + Math.min(22, (Math.abs(driveState.speed) / maxSpeed) * (nitroOn ? 20 : 11));
    if (Math.abs(camera.fov - targetFov) > 0.1) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, 5 * dt);
      camera.updateProjectionMatrix();
    }
    if (camModeIdx === 1 && !driveState.camDragging) { camera.position.set(driveState.x - Math.sin(driveState.heading) * 0.6, (driveState.y || 0) + 1.65, driveState.z - Math.cos(driveState.heading) * 0.6); camera.lookAt(driveState.x - Math.sin(driveState.heading) * 30, (driveState.y || 0) + 1.4, driveState.z - Math.cos(driveState.heading) * 30); } else { camera.lookAt(driveState.x, (driveState.y || 0) + 1.3, driveState.z); }

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
      if (t.wrecked) continue;
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
        const relZ = t.mesh.position.z - driveState.z;
        if (relZ > 300) t.mesh.position.z = driveState.z - 290;
        else if (relZ < -300) t.mesh.position.z = driveState.z + 290;
      } else {
        t.mesh.position.x += step;
        const relX = t.mesh.position.x - driveState.x;
        if (relX > 300) t.mesh.position.x = driveState.x - 290;
        else if (relX < -300) t.mesh.position.x = driveState.x + 290;
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

    // REAL PLAYER-VS-TRAFFIC CAR COLLISION (No passing through cars -> Triggers Accident + Fire + Fire Engine + Ambulance!)
    for (let i = 0; i < trafficCars.length; i++) {
      const tc = trafficCars[i];
      if (tc.wrecked) continue;
      const distT = Math.hypot(tc.mesh.position.x - driveState.x, tc.mesh.position.z - driveState.z);
      if (distT < 3.4) {
        // Physically push player car back so it NEVER clips through the other car!
        const pushAng = Math.atan2(driveState.x - tc.mesh.position.x, driveState.z - tc.mesh.position.z);
        driveState.x = tc.mesh.position.x + Math.sin(pushAng) * 3.8;
        driveState.z = tc.mesh.position.z + Math.cos(pushAng) * 3.8;
        const impact = Math.abs(driveState.speed);
        driveState.speed = -driveState.speed * 0.45;
        if (impact > 7 && now - driveState.lastCrashAt > 650) {
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
        obj.position.x += (dxM / distM) * spd * dt;
        obj.position.z += (dzM / distM) * spd * dt;
        obj.rotation.y = Math.atan2(-dxM, -dzM);
        return false;
      };

      if (ev.phase === 'dispatch') {
        const ftArr = stepToPoint(ev.fireTruck, ev.ftStop.x, ev.ftStop.z, 22);
        stepToPoint(ev.ambulance, ev.ambStop.x, ev.ambStop.z, 19);
        if (ftArr) {
          ev.phase = 'extinguishing';
          ev.phaseTimer = 0;
          ev.waterJet.visible = true;
          showDriveAlert('FIRE ENGINE SPRAYING WATER! 🚒💦', 'bg-sky-400 text-slate-950');
        }
      } else if (ev.phase === 'extinguishing') {
        stepToPoint(ev.ambulance, ev.ambStop.x, ev.ambStop.z, 19);
        ev.phaseTimer += dt;
        ev.waterJet.scale.y = 0.9 + Math.random() * 0.25;
        ev.fireScale = Math.max(0.01, 1.0 - ev.phaseTimer / 3.0);
        if (ev.phaseTimer >= 3.0) {
          ev.fireGroup.visible = false;
          ev.waterJet.visible = false;
          ev.phase = 'rescue';
          ev.phaseTimer = 0;
          showDriveAlert('FIRE OUT! AMBULANCE RESCUING PATIENT! 🚑', 'bg-emerald-400 text-slate-950');
        }
      } else if (ev.phase === 'rescue') {
        const ambHere = stepToPoint(ev.ambulance, ev.ambStop.x, ev.ambStop.z, 19);
        if (ambHere) {
          ev.phaseTimer += dt;
          if (ev.phaseTimer > 1.2) {
            ev.victim.visible = false;
            ev.phase = 'to_hospital';
            if (Audio && Audio.playSiren) Audio.playSiren();
            showDriveAlert('PATIENT ONBOARD → DRIVING TO HOSPITAL! 🚑🏥', 'bg-amber-400 text-slate-950');
          }
        }
      } else if (ev.phase === 'to_hospital') {
        // Fire Engine cleanly leaves straight down the road & hides once away (NEVER glitches!)
        if (ev.fireTruck.visible) {
          const ftDone = stepToPoint(ev.fireTruck, ev.ftExit.x, ev.ftExit.z, 22);
          if (ftDone) ev.fireTruck.visible = false;
        }
        // Ambulance follows clean 2-step road waypoints straight to + HOSPITAL!
        const wp = ev.ambWaypoints[ev.ambWpIdx];
        if (wp && stepToPoint(ev.ambulance, wp.x, wp.z, 24)) {
          ev.ambWpIdx++;
        }
        if (ev.ambWpIdx >= ev.ambWaypoints.length) {
          showDriveAlert('PATIENT SAFELY AT HOSPITAL! 🏥✅', 'bg-emerald-500 text-slate-950');
          scene.remove(ev.fireGroup, ev.waterJet, ev.victim, ev.fireTruck, ev.ambulance);
          ev.trafficCar.wrecked = false;
          ev.trafficCar.mesh.rotation.z = 0;
          ev.trafficCar.mesh.position.set(ev.trafficCar.axis === 'z' ? ev.trafficCar.mesh.position.x : driveState.x - 240, 0, ev.trafficCar.axis === 'z' ? driveState.z - 240 : ev.trafficCar.mesh.position.z);
          emergencyEvents.splice(eIdx, 1);
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
      const stepH = h.speed * h.dir * dt;
      if (h.axis === 'z') {
        h.mesh.position.z += stepH;
        if (h.mesh.position.z > 280) h.mesh.position.z = -280;
        if (h.mesh.position.z < -280) h.mesh.position.z = 280;
      } else {
        h.mesh.position.x += stepH;
        if (h.mesh.position.x > 280) h.mesh.position.x = -280;
        if (h.mesh.position.x < -280) h.mesh.position.x = 280;
      }
      const swing = Math.sin(now * 0.0075 + h.phase) * 0.58;
      const u = h.mesh.userData;
      if (u && u.legL) {
        u.legL.rotation.x = swing; u.legR.rotation.x = -swing;
        u.armL.rotation.x = -swing * 0.75; u.armR.rotation.x = swing * 0.75;
      }
      // Hit Detection: Car hits walking human -> Launch them flying high into the air!
      const distCar = Math.hypot(h.mesh.position.x - driveState.x, h.mesh.position.z - driveState.z);
      if (distCar < 2.4 && Math.abs(driveState.speed) > 3) {
        h.flying = true;
        const launchPower = Math.max(18, Math.abs(driveState.speed) * 0.95);
        h.vx = -Math.sin(driveState.heading) * launchPower + (Math.random() - 0.5) * 8;
        h.vz = -Math.cos(driveState.heading) * launchPower + (Math.random() - 0.5) * 8;
        h.vy = 13 + Math.min(14, Math.abs(driveState.speed) * 0.32);
        h.respawnAt = now + 3500;
        if (Audio) Audio.playTone(180, 0.14, 'triangle', 0.12);
      }
    }

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

    driveState._frame = ((driveState._frame || 0) + 1) % 2;
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

  // 360-Degree Screen Drag Camera Orbit on the 3D City Canvas (independent pointer ID from steering/pedals!)
  let camDragId = null, camLastX = 0, camLastY = 0, lastTapTime = 0;
  city3dContainer.addEventListener('pointerdown', (e) => {
    if (camDragId !== null) return;
    const nowT = performance.now();
    if (nowT - lastTapTime < 280) {
      // Double-tap resets camera cleanly behind car
      driveState.camOrbitYaw = 0;
      driveState.camOrbitPitch = 0.34;
    }
    lastTapTime = nowT;
    camDragId = e.pointerId;
    driveState.camDragging = true;
    camLastX = isStageRotated() ? e.clientY : e.clientX;
    camLastY = isStageRotated() ? -e.clientX : e.clientY;
  });
  window.addEventListener('pointermove', (e) => {
    if (!driveState.camDragging || e.pointerId !== camDragId) return;
    const curX = isStageRotated() ? e.clientY : e.clientX;
    const curY = isStageRotated() ? -e.clientX : e.clientY;
    driveState.camOrbitYaw -= (curX - camLastX) * 0.012;
    driveState.camOrbitPitch = Math.max(0.14, Math.min(0.95, driveState.camOrbitPitch + (curY - camLastY) * 0.007));
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
    showDriveAlert(yielded ? 'HORN! CAR MOVING ASIDE! 🔊' : 'BEEP! BEEP! 🔊', 'bg-amber-400 text-slate-950');
  };
  const stopCarHorn = () => {
    const held = performance.now() - hornDownAt;
    const delay = held < 220 ? (220 - held) : 0;
    setTimeout(() => { if (Audio && Audio.stopHorn) Audio.stopHorn(); }, delay);
  };
  const triggerHorn = () => { startCarHorn(); stopCarHorn(); };
  if (hornBtn) {
    const fireHornOnce = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (performance.now() - hornDownAt < 260) return;
      startCarHorn();
    };
    hornBtn.addEventListener('touchstart', fireHornOnce, { passive: false });
    hornBtn.addEventListener('mousedown', fireHornOnce);
    hornBtn.addEventListener('click', fireHornOnce);
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

  const exitCurrentCar = () => {
    if (!playerGroup || !playerAvatar || isOnFoot) return;
    isOnFoot = true;
    parkedCarPos = { x: driveState.x, z: driveState.z, heading: driveState.heading };
    driveState.x += Math.cos(driveState.heading) * 2.8;
    driveState.z -= Math.sin(driveState.heading) * 2.8;
    driveState.speed = 0; driveState.gas = false; driveState.brake = false; driveState.boost = false;
    footState.y = 0.22; footState.vy = 0; footState.jumping = false; footState.joyX = 0; footState.joyY = 0;
    if (playerGroup && playerGroup.userData && playerGroup.userData.rider) playerGroup.userData.rider.visible = false;
    playerAvatar.visible = true;
    setControlModeUI(true);
    if (Audio) { Audio.stopEngine(); Audio.playTone(540, 0.08); }
    showDriveAlert('ON FOOT! USE JOYSTICK, RUN & JUMP! 🏃', 'bg-emerald-400 text-slate-950');
  };

  const enterNearbyCar = () => {
    if (!isOnFoot || !nearbyVehicleRef) return;
    if (nearbyVehicleRef.type === 'traffic' && nearbyVehicleRef.car) {
      // STEAL / DRIVE ANY AI TRAFFIC CAR ON THE STREET!
      const tc = nearbyVehicleRef.car;
      // Leave previous car parked as a static scene vehicle or swap it with the AI car!
      const idx = trafficCars.indexOf(tc);
      if (idx !== -1) trafficCars.splice(idx, 1);
      // Park our old playerGroup as a static car in the world, and take control of tc.mesh!
      playerGroup = tc.mesh;
      playerChassis = tc.mesh;
      playerWheels = tc.wheels || [];
      playerFrontPivots = [];
      nitroFlames = [];
      driveState.x = tc.mesh.position.x;
      driveState.z = tc.mesh.position.z;
      driveState.heading = tc.mesh.rotation.y;
      showDriveAlert('ENTERED STREET CAR! DRIVE IT! 🚗🔥', 'bg-amber-400 text-slate-950');
    } else {
      driveState.x = parkedCarPos.x;
      driveState.z = parkedCarPos.z;
      driveState.heading = parkedCarPos.heading;
      showDriveAlert('BACK IN YOUR VEHICLE! 🚗', 'bg-cyan-400 text-slate-950');
    }
    isOnFoot = false;
    driveState.speed = 0;
    if (playerGroup && playerGroup.userData && playerGroup.userData.rider) playerGroup.userData.rider.visible = true;
    playerAvatar.visible = false;
    setControlModeUI(false);
    const eqNow = vehicles.find((v) => v.id === state.equippedId) || vehicles[0];
    if (Audio) { Audio.startEngine(eqNow.modelType); Audio.playIgnition(); }
  };

  const toggleExitEnterCar = () => { if (!isOnFoot) exitCurrentCar(); else enterNearbyCar(); };
  if (exitCarBtn) exitCarBtn.addEventListener('click', (e) => { e.preventDefault(); exitCurrentCar(); });
  if (enterNearCarBtn) enterNearCarBtn.addEventListener('click', (e) => { e.preventDefault(); enterNearbyCar(); });

  // Bind Dedicated Human RUN & JUMP Buttons!
  if (humanRunBtn) {
    humanRunBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); footState.running = true; });
    const stopRun = () => { footState.running = false; };
    humanRunBtn.addEventListener('pointerup', stopRun); humanRunBtn.addEventListener('pointercancel', stopRun); humanRunBtn.addEventListener('pointerleave', stopRun);
  }
  if (humanJumpBtn) {
    humanJumpBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!footState.jumping) {
        footState.jumping = true;
        footState.vy = 11.2;
        if (Audio) Audio.playTone(420, 0.09, 'sine', 0.1);
      }
    });
  }

  // Bind Dedicated 360° Human Analog Thumb Joystick (supports sideways portrait phone rotation!)
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
    if (humanJoyKnob) humanJoyKnob.style.transform = `translate(${(nx * 32).toFixed(1)}px, ${(ny * 32).toFixed(1)}px)`;
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
      driveState.camOrbitYaw = 0;
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
