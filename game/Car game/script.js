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
        ownedIds: new Set(Array.isArray(parsed.ownedIds) ? parsed.ownedIds : [0]),
        equippedId: typeof parsed.equippedId === 'number' ? parsed.equippedId : 0,
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

  const garageScreen = document.getElementById('garageScreen');
  const playScreen = document.getElementById('playScreen');


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
    [garageScreen, playScreen].forEach((el) => {
      if (!el) return;
      el.classList.toggle('visible-screen', el === target);
      el.classList.toggle('hidden-screen', el !== target);
    });
  }



  // ================= LIVE 360-DEGREE INTERACTIVE 3D GARAGE SHOWROOM + 3s LAUNCH ANIMATION =================
  const garage3dHost = document.getElementById('garage3dHost');
  const launchBanner = document.getElementById('launchBanner');
  let gScene = null, gCam = null, gRen = null, gCarWrap = null, gWheels = [], gFlames = [];
  let gRafId = null, gRotY = 0.65, gDragging = false, gLastPointer = 0, gDragPointerId = null;
  let gLaunching = false, gLaunchStart = 0;

  function initGarage3D() {
    if (gRen || !garage3dHost || typeof THREE === 'undefined' || !City3D) return;
    const w = garage3dHost.clientWidth || 420;
    const h = garage3dHost.clientHeight || 220;
    gScene = new THREE.Scene();
    gCam = new THREE.PerspectiveCamera(42, w / h, 0.2, 120);
    gCam.position.set(0, 2.25, 6.4);
    gCam.lookAt(0, 0.75, 0);

    gRen = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
      if (!gRen || garageScreen.classList.contains('hidden-screen')) return;
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

  function updateGarage3DModel(vehicleObj) {
    if (typeof THREE === 'undefined' || !City3D) {
      setTimeout(() => updateGarage3DModel(vehicleObj), 300);
      return;
    }
    initGarage3D();
    if (!gScene) return;
    if (gCarWrap) gScene.remove(gCarWrap);
    const paint = null;
    const built = City3D.buildVehicleMesh(vehicleObj, paint);
    gCarWrap = built.group;
    gWheels = built.wheels || [];
    gFlames = built.flames || [];
    const sc = vehicleObj.modelType === 'bike' ? 1.35 : (vehicleObj.modelType === 'heavy_truck' ? 0.84 : 0.96);
    gCarWrap.scale.setScalar(sc);
    gScene.add(gCarWrap);
  }

  function renderGarage() {
    if (!vehicles.length) return;
    coinsCountEl.textContent = state.coins.toLocaleString();
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
            <img src="${item.img}" alt="${item.name}" style="filter: hue-rotate(${item.hue}deg);" class="w-full h-full object-cover" />
          </div>
          <div class="text-[11px] font-extrabold text-white truncate">${item.name}</div>
          <div class="text-[10px] font-bold ${owned ? 'text-emerald-300' : 'text-amber-300'}">
            ${owned ? (item.starter ? 'Free Starter' : 'Unlocked') : item.price.toLocaleString() + ' C'}
          </div>
        </button>
      `;
    }).join('');
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
  let coinMeshes = [], trafficCars = [], walkingHumans = [];
  let buildingColliders = [], lakeZones = [], serviceGarages = [], animatedFacadeMats = [], animatedTrees = [];
  let animRoadTex = null, animCanalTex = null;
  let checkpointBeam = null;

  const CITY_BOUND = 1144;
  const BLOCK_STEP = 52;
  let totalKmDriven = 0;
  let colliderGrid = new Map();

  const driveState = {
    x: 0, z: 0, heading: 0, speed: 0, steerInput: 0, targetSteer: 0,
    nitro: 100, health: 100, wrecked: false,
    gas: false, brake: false, boost: false,
    keys: { w: false, s: false, a: false, d: false, shift: false },
    wheelDragging: false, lastCrashAt: 0,
    camOrbitYaw: 0, camOrbitPitch: 0.34, camDragging: false
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
      scene.fog = new THREE.FogExp2(0xe0f2fe, 0.0011);

      const w = isStageRotated() ? window.innerHeight : window.innerWidth;
      const h = isStageRotated() ? window.innerWidth : window.innerHeight;
      camera = new THREE.PerspectiveCamera(62, w / h, 0.5, 650);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.16;
      city3dContainer.appendChild(renderer.domElement);

      const envTex = City3D.createSkyEnvMap(renderer);
      if (envTex) scene.environment = envTex;

      scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 1.15));
      const sun = new THREE.DirectionalLight(0xfffbeb, 1.25);
      sun.position.set(140, 220, 100);
      scene.add(sun);

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

      const blockSize = 36;
      const sandMat = new THREE.MeshStandardMaterial({ color: 0xd6c7a9, roughness: 0.9 });
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
      const reflectiveWaterMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, map: animCanalTex, roughness: 0.12, metalness: 0.55, envMapIntensity: 1.5 });

      // Collect transforms for 1,400+ Real Cement Buildings across a MASSIVE 24x24 Open World (InstancedMesh = 60 FPS!)
      const bldgLists = [[], [], [], [], [], [], [], []]; // 8 vibrant colorful 3D building styles
      const padMatrices = [];
      const dummy = new THREE.Object3D();

      for (let gx = -22; gx <= 21; gx++) {
        for (let gz = -22; gz <= 21; gz++) {
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
            const fenceLen = BLOCK_STEP - 18; // Leaves clean open gap right at each road bridge!
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

            const style = Math.abs(gx * 5 + gz * 3) % 8;
            const isDowntown = Math.abs(gx) <= 4 && Math.abs(gz) <= 4;

            // 3 Distinct Cement Buildings per block => 560+ blocks * 3 = 1,680+ REAL 3D CEMENT BUILDINGS!
            const bh1 = isDowntown ? (26 + ((Math.abs(gx * 7 + gz * 13) * 11) % 44)) : (12 + ((Math.abs(gx * 5 + gz * 9) * 7) % 24));
            const b1x = cx - 8.0, b1z = cz - 8.0;
            dummy.position.set(b1x, bh1 / 2 + 0.3, b1z);
            dummy.scale.set(15.5, bh1, 15.5);
            dummy.updateMatrix();
            bldgLists[style].push(dummy.matrix.clone());

            const bh2 = 9 + ((Math.abs(gx + gz * 2) * 5) % 18);
            const b2x = cx + 8.5, b2z = cz + 7.5;
            dummy.position.set(b2x, bh2 / 2 + 0.3, b2z);
            dummy.scale.set(13.5, bh2, 14.5);
            dummy.updateMatrix();
            bldgLists[(style + 3) % 8].push(dummy.matrix.clone());

            const bh3 = 8 + ((Math.abs(gx * 3 - gz) * 4) % 14);
            const b3x = cx + 8.5, b3z = cz - 8.5;
            dummy.position.set(b3x, bh3 / 2 + 0.3, b3z);
            dummy.scale.set(12.5, bh3, 12.5);
            dummy.updateMatrix();
            bldgLists[(style + 5) % 8].push(dummy.matrix.clone());



            // Exact Tight Per-Building Colliders stored in O(1) Spatial Grid (60 FPS even with 5,500+ buildings!)
            const carMargin = 0.85;
            const cellColliders = [
              { minX: b1x - 7.75 - carMargin, maxX: b1x + 7.75 + carMargin, minZ: b1z - 7.75 - carMargin, maxZ: b1z + 7.75 + carMargin },
              { minX: b2x - 6.75 - carMargin, maxX: b2x + 6.75 + carMargin, minZ: b2z - 7.25 - carMargin, maxZ: b2z + 7.25 + carMargin },
              { minX: b3x - 6.25 - carMargin, maxX: b3x + 6.25 + carMargin, minZ: b3z - 6.25 - carMargin, maxZ: b3z + 6.25 + carMargin }
            ];
            colliderGrid.set(`${gx},${gz}`, cellColliders);

            // Realistic Roadside Natural Green Trees along main corridors (strictly on outer sidewalk edge!)
            if (Math.abs(gx) <= 6 && Math.abs(gz) <= 6 && (gx + gz) % 2 === 0) {
              const realTree = City3D.createRealisticTree((gx + gz) % 4 === 0 ? 'palm' : 'oak');
              realTree.position.set(cx - 16.8, 0.3, cz + 16.8);
              scene.add(realTree); animatedTrees.push(realTree);
            }
          }
        }
      }

      // Build Fast InstancedMeshes for all 1,680+ Cement Buildings & Sidewalks
      const unitBox = new THREE.BoxGeometry(1, 1, 1);
      const padIM = new THREE.InstancedMesh(unitBox, sidewalkMat, padMatrices.length);
      padMatrices.forEach((m, idx) => padIM.setMatrixAt(idx, m));
      scene.add(padIM);

      const crownGeo = new THREE.BoxGeometry(0.68, 0.16, 0.68);
      crownGeo.translate(0, 0.58, 0);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.55, roughness: 0.28 });
      bldgLists.forEach((list, sIdx) => {
        if (!list.length) return;
        const mat = facadeMats[sIdx];
        const im = new THREE.InstancedMesh(unitBox, [mat, mat, roofMat, roofMat, mat, mat], list.length);
        const crownIM = new THREE.InstancedMesh(crownGeo, crownMat, list.length);
        list.forEach((m, idx) => { im.setMatrixAt(idx, m); crownIM.setMatrixAt(idx, m); });
        scene.add(im, crownIM);
      });

      const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
      const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });

      // Wide 4-Lane Expressway Straight Continuous White Lines across the entire 44x44 Massive Metropolis
      for (let g = -22; g <= 22; g++) {
        const pos = g * BLOCK_STEP;
        const lineZ = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 3450), whiteLineMat);
        lineZ.rotation.x = -Math.PI / 2; lineZ.position.set(pos, 0.04, 0);
        const lineX = new THREE.Mesh(new THREE.PlaneGeometry(3450, 0.5), whiteLineMat);
        lineX.rotation.x = -Math.PI / 2; lineX.position.set(0, 0.04, pos);
        scene.add(lineZ, lineX);
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
        for (let p = 0; p < 36; p++) {
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

      for (let t = 0; t < 18; t++) {
        const builtAI = City3D.buildVehicleMesh(aiModels[t % aiModels.length], null);
        const tMesh = builtAI.group;
        const axis = t % 2 === 0 ? 'z' : 'x';
        const dir = (t % 4 < 2) ? 1 : -1; // Opposite traffic directions!
        const laneOffset = dir > 0 ? 4.8 : -4.8;
        const lane = ((t % 9) - 4) * BLOCK_STEP + laneOffset;
        const startAlong = -260 + t * 30;
        if (axis === 'z') {
          tMesh.position.set(lane, 0, startAlong);
          tMesh.rotation.y = dir > 0 ? Math.PI : 0;
        } else {
          tMesh.position.set(startAlong, 0, lane);
          tMesh.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
        }
        scene.add(tMesh);
        trafficCars.push({ mesh: tMesh, wheels: builtAI.wheels, axis, dir, speed: 15 + (t % 4) * 4 });
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

    // If real 3D GLB model is available on GitHub Pages (assets/custom_car.glb) and player selected a CAR, swap in the real 3D GLB!
    if (eq.cat === 'CAR' && typeof THREE !== 'undefined' && THREE.GLTFLoader && window.location.protocol !== 'about:') {
      try {
        const loader = new THREE.GLTFLoader();
        loader.load('assets/custom_car.glb', (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 4.6 / maxDim;
          model.scale.setScalar(scale);
          const box2 = new THREE.Box3().setFromObject(model);
          const center = new THREE.Vector3();
          box2.getCenter(center);
          model.position.x -= center.x;
          model.position.z -= center.z;
          model.position.y -= box2.min.y;
          model.rotation.y = Math.PI;
          const wrap = new THREE.Group();
          wrap.add(model);
          if (playerGroup) scene.remove(playerGroup);
          playerGroup = wrap;
          playerWheels = [];
          scene.add(playerGroup);
        }, undefined, () => {});
      } catch (e) {}
    }

    driveState.x = 0; driveState.z = 0; driveState.heading = 0;
    driveState.speed = 0; driveState.steerInput = 0; driveState.targetSteer = 0;
    driveState.nitro = 100; driveState.health = 100; driveState.wrecked = false;
    updateHealthHUD();
    updateTaskUI();
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
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(0, 0, w, h);
    const scale = 0.14, cx = w / 2, cy = h / 2;

    ctx.fillStyle = '#0ea5e9';
    for (const lk of lakeZones) {
      const dx = (lk.cx - driveState.x) * scale, dz = (lk.cz - driveState.z) * scale;
      if (Math.hypot(dx, dz) < 36) { ctx.beginPath(); ctx.arc(cx + dx, cy + dz, 3, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.fillStyle = '#34d399';
    for (const g of serviceGarages) {
      const dx = Math.max(-34, Math.min(34, (g.x - driveState.x) * scale));
      const dz = Math.max(-34, Math.min(34, (g.z - driveState.z) * scale));
      ctx.fillRect(cx + dx - 2.5, cy + dz - 2.5, 5, 5);
    }
    ctx.fillStyle = '#facc15';
    for (const c of coinMeshes) {
      if (!c.userData.active) continue;
      const dx = (c.position.x - driveState.x) * scale, dz = (c.position.z - driveState.z) * scale;
      if (Math.hypot(dx, dz) < 36) { ctx.beginPath(); ctx.arc(cx + dx, cy + dz, 1.8, 0, Math.PI * 2); ctx.fill(); }
    }
    if (checkpointBeam) {
      const dx = Math.max(-34, Math.min(34, (checkpointBeam.position.x - driveState.x) * scale));
      const dz = Math.max(-34, Math.min(34, (checkpointBeam.position.z - driveState.z) * scale));
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath(); ctx.arc(cx + dx, cy + dz, 3.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-driveState.heading);
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4.5, 5); ctx.lineTo(-4.5, 5); ctx.closePath(); ctx.fill();
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
    const lvBonus = ((state.level || 1) - 1) * 3.5;
    const maxSpeed = 36 + ((eq.speed + (state.upgradeLevels.engine - 1) * 3) / 100) * 34 + lvBonus;
    const accelRate = 24 + ((eq.accel + (state.upgradeLevels.engine - 1) * 3) / 100) * 24 + lvBonus * 0.6;
    const turnRate = 2.0 + ((eq.handle + (state.upgradeLevels.tires - 1) * 4) / 100) * 1.15;

    const gasOn = driveState.gas || driveState.keys.w;
    const brakeOn = driveState.brake || driveState.keys.s;
    const nitroOn = (driveState.boost || driveState.keys.shift) && driveState.nitro > 4 && gasOn;

    if (nitroOn) driveState.nitro = Math.max(0, driveState.nitro - 28 * dt);
    else driveState.nitro = Math.min(100, driveState.nitro + 12 * dt);

    for (const f of nitroFlames) {
      f.visible = nitroOn;
      if (nitroOn) f.scale.y = 0.8 + Math.random() * 0.6;
    }

    const nitroMult = 1.36 + Math.min(0.38, ((state.upgradeLevels.nitro - 1) * 0.04) + ((state.level || 1) - 1) * 0.04);
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
    driveState.steerInput += (desiredSteer - driveState.steerInput) * Math.min(1, 10 * dt);
    // Smooth return to 0° ONLY after finger is released! While holding, stays at exact full-rotation wheelAngleDeg!
    if (!driveState.wheelDragging) {
      driveState.wheelAngleDeg = (driveState.wheelAngleDeg || 0) * Math.pow(0.015, dt);
      if (Math.abs(driveState.wheelAngleDeg) < 0.8) driveState.wheelAngleDeg = 0;
    }
    const visualWheelDeg = driveState.wheelDragging ? (driveState.wheelAngleDeg || 0) : (driveState.wheelAngleDeg || (-driveState.steerInput * 110));
    steeringWheelSvg.style.transform = `rotate(${visualWheelDeg.toFixed(1)}deg)`;

    if (Audio) Audio.updateEngine(Math.abs(driveState.speed) / maxSpeed, nitroOn, brakeOn, driveState.steerInput);

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

    // O(1) Spatial Grid Collision Check (checks only current block -> locked 60 FPS!)
    let collided = false;
    const cellX = Math.floor(nextX / BLOCK_STEP);
    const cellZ = Math.floor(nextZ / BLOCK_STEP);
    const nearby = colliderGrid.get(`${cellX},${cellZ}`);
    if (nearby) {
      for (let i = 0; i < nearby.length; i++) {
        const b = nearby[i];
        if (nextX > b.minX && nextX < b.maxX && nextZ > b.minZ && nextZ < b.maxZ) {
          collided = true;
          if (prevX <= b.minX || prevX >= b.maxX) nextX = prevX;
          if (prevZ <= b.minZ || prevZ >= b.maxZ) nextZ = prevZ;
          break;
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

    playerGroup.position.set(driveState.x, 0, driveState.z);
    playerGroup.rotation.y = driveState.heading;
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
    const camDist = eq.modelType === 'heavy_truck' ? 11.8 : 9.4;
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
    camera.lookAt(driveState.x, 1.3, driveState.z);

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

    for (const t of trafficCars) {
      const step = t.speed * t.dir * dt;
      if (t.axis === 'z') {
        t.mesh.position.z += step;
        if (t.mesh.position.z > CITY_BOUND) t.mesh.position.z = -CITY_BOUND;
        if (t.mesh.position.z < -CITY_BOUND) t.mesh.position.z = CITY_BOUND;
      } else {
        t.mesh.position.x += step;
        if (t.mesh.position.x > CITY_BOUND) t.mesh.position.x = -CITY_BOUND;
        if (t.mesh.position.x < -CITY_BOUND) t.mesh.position.x = CITY_BOUND;
      }
      if (t.wheels) {
        for (const tw of t.wheels) tw.rotation.x -= t.speed * dt * 0.75;
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

    drawMiniMap();
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
    const norm = Math.max(-1, Math.min(1, -driveState.wheelAngleDeg / 160));
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

  exitToGarageBtn.addEventListener('click', () => {
    if (Audio) { Audio.stopEngine(); Audio.stopMusic(); }
    if (cityRafId) { cancelAnimationFrame(cityRafId); cityRafId = null; }
    showScreen(garageScreen);
    renderGarage();
  });

  window.addEventListener('resize', resizeCanvases);

  // Immediately start 5-second loading screen with reliable setInterval timer
  showScreen(garageScreen); renderGarage();
})();
