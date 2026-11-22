// Main Game Controller: Direct Auto-Start (No Tap-Logo Screen) + Sideways Landscape + LocalStorage Auto-Save
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
    taskIndex: 0
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
        taskIndex: typeof parsed.taskIndex === 'number' ? parsed.taskIndex : 0
      };
    } catch (e) {
      return { ...defaultSave, ownedIds: new Set(defaultSave.ownedIds) };
    }
  }

  const state = loadSave();
  let selectedId = state.equippedId;
  let activeCategory = 'ALL';

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
        taskIndex: state.taskIndex
      }));
    } catch (e) {}
  }

  const vehicles = window.APEX_VEHICLES;
  const Audio = window.ApexAudio;
  const City3D = window.ApexCity3D;

  // Unlock browser Web Audio on first touch/click anywhere
  const unlockOnce = () => {
    Audio.unlock();
    window.removeEventListener('pointerdown', unlockOnce);
    window.removeEventListener('touchstart', unlockOnce);
  };
  window.addEventListener('pointerdown', unlockOnce, { passive: true });
  window.addEventListener('touchstart', unlockOnce, { passive: true });

  const gameStage = document.getElementById('gameStage');
  const sidewaysToggleBtn = document.getElementById('sidewaysToggleBtn');

  function isStageRotated() {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (gameStage.classList.contains('force-sideways')) return true;
    if (gameStage.classList.contains('force-straight')) return false;
    return isPortrait;
  }

  function resizeCanvases() {
    const w = isStageRotated() ? window.innerHeight : window.innerWidth;
    const h = isStageRotated() ? window.innerWidth : window.innerHeight;
    if (loadingCanvas) { loadingCanvas.width = w; loadingCanvas.height = h; }
    if (renderer && camera) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  }

  sidewaysToggleBtn.addEventListener('click', () => {
    if (isStageRotated()) {
      gameStage.classList.remove('force-sideways');
      gameStage.classList.add('force-straight');
    } else {
      gameStage.classList.remove('force-straight');
      gameStage.classList.add('force-sideways');
    }
    setTimeout(resizeCanvases, 60);
  });

  const loadingScreen = document.getElementById('loadingScreen');
  const garageScreen = document.getElementById('garageScreen');
  const playScreen = document.getElementById('playScreen');

  const skipLoadBtn = document.getElementById('skipLoadBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundLabel = document.getElementById('soundLabel');

  const loadingPercent = document.getElementById('loadingPercent');
  const loadingBarFill = document.getElementById('loadingBarFill');
  const loadingStatusText = document.getElementById('loadingStatusText');
  const loadingTimerText = document.getElementById('loadingTimerText');
  const bgSlide1 = document.getElementById('bgSlide1');
  const bgSlide2 = document.getElementById('bgSlide2');
  const loadingCanvas = document.getElementById('loadingCanvas');

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

  let loadingRafId = null;
  let bgCanvasRafId = null;
  let slideIntervalId = null;
  const LOAD_DURATION_MS = 5000;

  const statusMessages = [
    { at: 0, text: 'Igniting Twin-Turbo Engine...' },
    { at: 22, text: 'Restoring LocalStorage Garage Save...' },
    { at: 48, text: 'Building Huge Morning City & Lakes...' },
    { at: 74, text: 'Polishing 31 Metallic 3D Vehicles...' },
    { at: 94, text: 'Ready for Sideways Racing!' }
  ];

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => { toastEl.style.opacity = '0'; }, 2200);
  }

  soundToggleBtn.addEventListener('click', () => {
    const next = !Audio.isEnabled();
    Audio.setEnabled(next);
    soundIcon.textContent = next ? '🔊' : '🔇';
    soundLabel.textContent = next ? 'ON' : 'OFF';
  });

  if (skipLoadBtn) {
    skipLoadBtn.addEventListener('click', () => {
      Audio.unlock();
      Audio.playIgnition();
      skipLoadBtn.textContent = 'Sound Active 🔊';
    });
  }

  function showScreen(target) {
    [loadingScreen, garageScreen, playScreen].forEach((el) => {
      el.classList.toggle('visible-screen', el === target);
      el.classList.toggle('hidden-screen', el !== target);
    });
  }

  function startLoadingMotionOverlay() {
    if (bgCanvasRafId) cancelAnimationFrame(bgCanvasRafId);
    const ctx = loadingCanvas.getContext('2d');
    const w = isStageRotated() ? window.innerHeight : window.innerWidth;
    const h = isStageRotated() ? window.innerWidth : window.innerHeight;
    loadingCanvas.width = w; loadingCanvas.height = h;
    const streaks = Array.from({ length: 65 }, () => ({
      angle: Math.random() * Math.PI * 2, dist: Math.random() * 200 + 20,
      speed: Math.random() * 9 + 6, len: Math.random() * 40 + 18,
      color: Math.random() > 0.4 ? 'rgba(0, 240, 255, 0.55)' : 'rgba(255, 140, 40, 0.55)'
    }));
    function renderStreaks() {
      const cw = loadingCanvas.width, ch = loadingCanvas.height, cx = cw * 0.5, cy = ch * 0.46;
      const maxDist = Math.hypot(cw, ch) * 0.65;
      ctx.clearRect(0, 0, cw, ch);
      for (const st of streaks) {
        st.dist += st.speed * (1 + st.dist / 260);
        if (st.dist > maxDist) { st.dist = Math.random() * 50 + 10; st.angle = Math.random() * Math.PI * 2; }
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(st.angle) * st.dist, cy + Math.sin(st.angle) * st.dist);
        ctx.lineTo(cx + Math.cos(st.angle) * (st.dist + st.len), cy + Math.sin(st.angle) * (st.dist + st.len));
        ctx.strokeStyle = st.color; ctx.lineWidth = Math.min(3, 0.8 + st.dist / 250); ctx.stroke();
      }
      bgCanvasRafId = requestAnimationFrame(renderStreaks);
    }
    renderStreaks();
  }

  function stopLoadingAnimations() {
    if (loadingRafId) { cancelAnimationFrame(loadingRafId); loadingRafId = null; }
    if (bgCanvasRafId) { cancelAnimationFrame(bgCanvasRafId); bgCanvasRafId = null; }
    if (slideIntervalId) { clearInterval(slideIntervalId); slideIntervalId = null; }
  }

  function startLoadingSequence() {
    stopLoadingAnimations();
    showScreen(loadingScreen);
    bgSlide1.classList.add('active'); bgSlide2.classList.remove('active');
    let showingFirst = true;
    slideIntervalId = setInterval(() => {
      showingFirst = !showingFirst;
      bgSlide1.classList.toggle('active', showingFirst);
      bgSlide2.classList.toggle('active', !showingFirst);
    }, 2400);
    startLoadingMotionOverlay();
    const startTime = performance.now();
    function updateProgress(now) {
      const elapsed = now - startTime;
      const ratio = Math.min(1, elapsed / LOAD_DURATION_MS);
      const pct = Math.floor(ratio * 100);
      loadingPercent.textContent = pct + '%';
      loadingBarFill.style.width = (ratio * 100).toFixed(2) + '%';
      loadingTimerText.textContent = Math.min(5, elapsed / 1000).toFixed(1) + 's / 5.0s';
      for (let i = statusMessages.length - 1; i >= 0; i--) {
        if (pct >= statusMessages[i].at) { loadingStatusText.textContent = statusMessages[i].text; break; }
      }
      if (ratio < 1) loadingRafId = requestAnimationFrame(updateProgress);
      else {
        Audio.playReadyChime();
        setTimeout(() => { stopLoadingAnimations(); showScreen(garageScreen); renderGarage(); }, 180);
      }
    }
    loadingRafId = requestAnimationFrame(updateProgress);
  }

  function renderGarage() {
    coinsCountEl.textContent = state.coins.toLocaleString();
    ownedCountEl.textContent = `${state.ownedIds.size}/${vehicles.length}`;
    const v = vehicles.find((item) => item.id === selectedId) || vehicles[0];
    const isOwned = state.ownedIds.has(v.id);
    const isEquipped = state.equippedId === v.id;

    stageCatBadge.textContent = v.starter ? 'NORMAL STARTER CAR' : v.cat;
    stageVehicleName.textContent = v.name;
    stageVehicleImg.src = v.img;
    const totalHue = (v.hue + (isEquipped ? state.customHueOffset : 0)) % 360;
    stageVehicleImg.style.filter = `hue-rotate(${totalHue}deg) saturate(1.12)`;

    const bonusSpd = Math.min(100, v.speed + (state.upgradeLevels.engine - 1) * 3);
    const bonusAcc = Math.min(100, v.accel + (state.upgradeLevels.engine - 1) * 3);
    const bonusHnd = Math.min(100, v.handle + (state.upgradeLevels.tires - 1) * 3);
    const bonusNit = Math.min(100, v.nitro + (state.upgradeLevels.nitro - 1) * 4);

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
    Audio.playTone(620, 0.07);
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
      Audio.playTone(540, 0.06);
      renderGarage();
    });
  });

  stageActionBtn.addEventListener('click', () => {
    const v = vehicles.find((item) => item.id === selectedId);
    if (!v || state.equippedId === v.id) return;
    if (state.ownedIds.has(v.id)) {
      state.equippedId = v.id;
      persistSave();
      Audio.playTone(760, 0.12);
      showToast(`${v.name} equipped!`);
      renderGarage();
    } else if (state.coins >= v.price) {
      state.coins -= v.price;
      state.ownedIds.add(v.id);
      state.equippedId = v.id;
      persistSave();
      Audio.playReadyChime();
      showToast(`Purchased & saved ${v.name}!`);
      renderGarage();
    } else {
      Audio.playTone(220, 0.16, 'sawtooth', 0.06);
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
      Audio.playTone(600, 0.07);
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
          Audio.playReadyChime();
          renderGarage();
          showToast('+10,000 Coins saved!');
          closeModal();
        });
      } else if (m === 'upgradesModal') {
        openModal(`
          <h3 class="font-display text-lg font-black text-orange-300 mb-2">PERFORMANCE UPGRADES</h3>
          <div class="space-y-2 mt-3">
            ${['engine', 'nitro', 'tires'].map((part) => `
              <div class="flex items-center justify-between bg-slate-800/90 border border-white/10 rounded-xl px-3 py-2">
                <div><div class="text-xs font-extrabold uppercase text-white">${part} (Lv.${state.upgradeLevels[part]})</div><div class="text-[11px] text-slate-400">Saved permanently</div></div>
                <button type="button" data-part="${part}" class="upg-btn px-3 py-1.5 rounded-lg bg-orange-500 text-slate-950 font-bold text-xs cursor-pointer">2,500 C</button>
              </div>
            `).join('')}
          </div>
        `);
        modalBody.querySelectorAll('.upg-btn').forEach((u) => {
          u.addEventListener('click', () => {
            const part = u.dataset.part;
            if (state.coins < 2500) { showToast('Not enough Coins!'); return; }
            state.coins -= 2500;
            state.upgradeLevels[part] += 1;
            persistSave();
            Audio.playReadyChime();
            renderGarage();
            showToast(`${part.toUpperCase()} Lv.${state.upgradeLevels[part]} saved!`);
            closeModal();
          });
        });
      } else if (m === 'settingsModal') {
        openModal(`
          <h3 class="font-display text-lg font-black text-cyan-300 mb-2">GAME SETTINGS</h3>
          <div class="space-y-2 text-xs text-slate-200 mt-3">
            <div class="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-white/10">
              <span>Engine, Nitro &amp; Crash SFX</span>
              <button id="modalSoundBtn" type="button" class="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold cursor-pointer">${Audio.isEnabled() ? 'ON' : 'OFF'}</button>
            </div>
            <div class="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-white/10">
              <span>LocalStorage Save</span>
              <button id="resetSaveBtn" type="button" class="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-400 text-rose-300 font-bold cursor-pointer">Reset Save</button>
            </div>
          </div>
        `);
        document.getElementById('modalSoundBtn').addEventListener('click', (e) => {
          soundToggleBtn.click(); e.target.textContent = Audio.isEnabled() ? 'ON' : 'OFF';
        });
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
  let playerGroup, playerWheels = [], nitroFlames = [];
  let coinMeshes = [], trafficCars = [];
  let buildingColliders = [], lakeZones = [], serviceGarages = [];
  let checkpointBeam = null;

  const CITY_BOUND = 440;
  const BLOCK_STEP = 54;

  const driveState = {
    x: 0, z: 0, heading: 0, speed: 0, steerInput: 0, targetSteer: 0,
    nitro: 100, health: 100, wrecked: false,
    gas: false, brake: false, boost: false,
    keys: { w: false, s: false, a: false, d: false, shift: false },
    wheelDragging: false, lastCrashAt: 0
  };

  const cityTasks = [
    { type: 'coins', target: 5, reward: 500, label: 'Collect 5 City Coins' },
    { type: 'speed', target: 130, reward: 600, label: 'Reach 130 KM/H Top Speed' },
    { type: 'checkpoint', target: 1, reward: 800, label: 'Drive Through Cyan Checkpoint' },
    { type: 'distance', target: 600, reward: 700, label: 'Explore 600m of Morning City' }
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
      scene.fog = new THREE.FogExp2(0xdbeafe, 0.0022);

      const w = isStageRotated() ? window.innerHeight : window.innerWidth;
      const h = isStageRotated() ? window.innerWidth : window.innerHeight;
      camera = new THREE.PerspectiveCamera(62, w / h, 0.5, 650);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h);
      city3dContainer.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 1.15));
      const sun = new THREE.DirectionalLight(0xfffbeb, 1.25);
      sun.position.set(140, 220, 100);
      scene.add(sun);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(1050, 1050),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.88 })
      );
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      const facadeMats = [0, 1, 2, 3].map((idx) => new THREE.MeshStandardMaterial({
        map: City3D.createBuildingTexture(idx), roughness: 0.45, metalness: 0.15
      }));
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
      const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
      const grassMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9 });
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.4 });
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });

      const blockSize = 32;
      for (let gx = -6; gx <= 5; gx++) {
        for (let gz = -6; gz <= 5; gz++) {
          if (gx === 0 && gz === 0) continue;
          const cx = gx * BLOCK_STEP + BLOCK_STEP / 2;
          const cz = gz * BLOCK_STEP + BLOCK_STEP / 2;
          const isLake = (Math.abs(gx + gz * 2) % 7 === 3);
          const isGarage = !isLake && ((gx === 2 && gz === 0) || (gx === -3 && gz === 1) || (gx === 0 && gz === -3) || (gx === 3 && gz === -3) || (gx === -2 && gz === 3));

          if (isLake) {
            const park = new THREE.Mesh(new THREE.BoxGeometry(blockSize + 2, 0.25, blockSize + 2), grassMat);
            park.position.set(cx, 0.12, cz);
            const pond = new THREE.Mesh(new THREE.CylinderGeometry(12.5, 12.5, 0.32, 24), waterMat);
            pond.position.set(cx, 0.16, cz);
            scene.add(park, pond);
            lakeZones.push({ cx, cz, r: 12.5 });
            for (let t = 0; t < 4; t++) {
              const ang = t * (Math.PI / 2) + 0.4;
              const tx = cx + Math.cos(ang) * 14.5, tz = cz + Math.sin(ang) * 14.5;
              const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 2.5, 8), trunkMat);
              trunk.position.set(tx, 1.4, tz);
              const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 0), leafMat);
              leaves.position.set(tx, 3.3, tz);
              scene.add(trunk, leaves);
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
            const pad = new THREE.Mesh(new THREE.BoxGeometry(blockSize + 2, 0.3, blockSize + 2), sidewalkMat);
            pad.position.set(cx, 0.15, cz);
            scene.add(pad);
            const style = Math.abs(gx * 5 + gz * 3) % 4;
            const mat = facadeMats[style];
            const bh = 16 + ((Math.abs(gx * 7 + gz * 13) * 11) % 38);
            const bw = 20 + (style % 2) * 3, bd = 20 + ((style + 1) % 2) * 3;
            const tower = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), [mat, mat, roofMat, roofMat, mat, mat]);
            tower.position.set(cx, bh / 2 + 0.3, cz);
            const crownH = 3.5 + (style % 3);
            const crown = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.65, crownH, bd * 0.65), [mat, mat, roofMat, roofMat, mat, mat]);
            crown.position.set(cx, bh + crownH / 2 + 0.3, cz);
            scene.add(tower, crown);
            buildingColliders.push({ minX: cx - bw / 2 - 1.3, maxX: cx + bw / 2 + 1.3, minZ: cz - bd / 2 - 1.3, maxZ: cz + bd / 2 + 1.3 });
            const tx = cx - blockSize / 2 + 1.5, tz = cz - blockSize / 2 + 1.5;
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 2.4, 8), trunkMat);
            trunk.position.set(tx, 1.4, tz);
            const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), leafMat);
            leaves.position.set(tx, 3.1, tz);
            scene.add(trunk, leaves);
          }
        }
      }

      const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      for (let g = -6; g <= 6; g++) {
        const pos = g * BLOCK_STEP;
        for (let d = -380; d <= 380; d += 14) {
          const l1 = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 5.5), lineMat);
          l1.rotation.x = -Math.PI / 2; l1.position.set(pos, 0.03, d);
          const l2 = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 0.45), lineMat);
          l2.rotation.x = -Math.PI / 2; l2.position.set(d, 0.03, pos);
          scene.add(l1, l2);
        }
      }

      const coinGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.3, 18);
      coinGeo.rotateX(Math.PI / 2);
      const coinMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xd97706, emissiveIntensity: 0.45, metalness: 0.85, roughness: 0.2 });
      for (let i = 0; i < 72; i++) {
        const lane = ((i % 11) - 5) * BLOCK_STEP;
        const along = ((Math.floor(i / 11) * 65) - 240) + (i % 3) * 18;
        const m = new THREE.Mesh(coinGeo, coinMat);
        if (i % 2 === 0) m.position.set(lane, 1.25, along);
        else m.position.set(along, 1.25, lane);
        m.userData = { active: true, respawnAt: 0 };
        scene.add(m); coinMeshes.push(m);
      }

      checkpointBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(2.8, 2.8, 30, 20, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
      );
      checkpointBeam.position.set(108, 15, -108);
      scene.add(checkpointBeam);

      const trafficColors = [0xffffff, 0xef4444, 0x2563eb, 0xf59e0b, 0x10b981];
      for (let t = 0; t < 18; t++) {
        const tMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 4.2), new THREE.MeshStandardMaterial({ color: trafficColors[t % trafficColors.length], roughness: 0.35 }));
        const axis = t % 2 === 0 ? 'z' : 'x';
        const lane = ((t % 9) - 4) * BLOCK_STEP + (axis === 'z' ? 4 : -4);
        tMesh.position.set(axis === 'z' ? lane : -240 + t * 28, 0.65, axis === 'z' ? -240 + t * 28 : lane);
        if (axis === 'x') tMesh.rotation.y = Math.PI / 2;
        scene.add(tMesh);
        trafficCars.push({ mesh: tMesh, axis, speed: 15 + (t % 4) * 4 });
      }
    }

    if (playerGroup) scene.remove(playerGroup);
    const eq = vehicles.find((v) => v.id === state.equippedId) || vehicles[0];
    const built = City3D.buildVehicleMesh(eq, state.customPaintHex);
    playerGroup = built.group;
    playerWheels = built.wheels;
    nitroFlames = built.flames;
    scene.add(playerGroup);

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
    } else if (task.type === 'checkpoint') {
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
    persistSave();
    Audio.playReadyChime();
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
      Audio.updateEngine(0, false, false, 0);
      renderer.render(scene, camera);
      return;
    }

    const eq = vehicles.find((v) => v.id === state.equippedId) || vehicles[0];
    const maxSpeed = 38 + ((eq.speed + (state.upgradeLevels.engine - 1) * 3) / 100) * 38;
    const accelRate = 24 + ((eq.accel + (state.upgradeLevels.engine - 1) * 3) / 100) * 26;
    const turnRate = 1.9 + ((eq.handle + (state.upgradeLevels.tires - 1) * 3) / 100) * 1.1;

    const gasOn = driveState.gas || driveState.keys.w;
    const brakeOn = driveState.brake || driveState.keys.s;
    const nitroOn = (driveState.boost || driveState.keys.shift) && driveState.nitro > 4 && gasOn;

    if (nitroOn) driveState.nitro = Math.max(0, driveState.nitro - 28 * dt);
    else driveState.nitro = Math.min(100, driveState.nitro + 12 * dt);

    for (const f of nitroFlames) {
      f.visible = nitroOn;
      if (nitroOn) f.scale.y = 0.8 + Math.random() * 0.6;
    }

    const effectiveMax = nitroOn ? maxSpeed * 1.35 : maxSpeed;
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
    steeringWheelSvg.style.transform = `rotate(${(-driveState.steerInput * 95).toFixed(1)}deg)`;

    Audio.updateEngine(Math.abs(driveState.speed) / maxSpeed, nitroOn, brakeOn, driveState.steerInput);

    if (Math.abs(driveState.speed) > 0.5) {
      const dirSign = driveState.speed >= 0 ? 1 : -1;
      const speedFactor = Math.min(1, Math.abs(driveState.speed) / 12);
      driveState.heading += driveState.steerInput * turnRate * speedFactor * dirSign * dt;
    }

    const prevX = driveState.x, prevZ = driveState.z;
    const dx = -Math.sin(driveState.heading) * driveState.speed * dt;
    const dz = -Math.cos(driveState.heading) * driveState.speed * dt;
    let nextX = Math.max(-CITY_BOUND, Math.min(CITY_BOUND, prevX + dx));
    let nextZ = Math.max(-CITY_BOUND, Math.min(CITY_BOUND, prevZ + dz));

    let collided = false;
    for (const b of buildingColliders) {
      if (nextX > b.minX && nextX < b.maxX && nextZ > b.minZ && nextZ < b.maxZ) {
        collided = true;
        if (prevX <= b.minX || prevX >= b.maxX) nextX = prevX;
        if (prevZ <= b.minZ || prevZ >= b.maxZ) nextZ = prevZ;
        break;
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
        Audio.playCrash();
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
        updateHealthHUD(); Audio.playReadyChime();
        showDriveAlert('GARAGE REPAIR: 100% HEALTH!', 'bg-emerald-500/95 text-slate-950');
      }
    }

    driveState.x = nextX; driveState.z = nextZ;
    const stepDist = Math.hypot(nextX - prevX, nextZ - prevZ);

    playerGroup.position.set(driveState.x, 0, driveState.z);
    playerGroup.rotation.y = driveState.heading;
    if (eq.modelType === 'bike') {
      playerGroup.rotation.z = driveState.steerInput * 0.26 * Math.min(1, Math.abs(driveState.speed) / 25);
    }
    for (const w of playerWheels) w.rotation.x -= driveState.speed * dt * 0.8;

    const camDist = eq.modelType === 'heavy_truck' ? 11.5 : 9.2;
    const camHeight = eq.modelType === 'heavy_truck' ? 4.8 : 3.9;
    const targetCamX = driveState.x + Math.sin(driveState.heading) * camDist;
    const targetCamZ = driveState.z + Math.cos(driveState.heading) * camDist;
    camera.position.x += (targetCamX - camera.position.x) * Math.min(1, 7.5 * dt);
    camera.position.y += (camHeight - camera.position.y) * Math.min(1, 7.5 * dt);
    camera.position.z += (targetCamZ - camera.position.z) * Math.min(1, 7.5 * dt);
    camera.lookAt(driveState.x, 1.3, driveState.z);

    for (const c of coinMeshes) {
      if (!c.userData.active) {
        if (now > c.userData.respawnAt) { c.userData.active = true; c.visible = true; }
        continue;
      }
      c.rotation.y += 3.2 * dt;
      if (Math.hypot(c.position.x - driveState.x, c.position.z - driveState.z) < 2.8) {
        c.userData.active = false; c.visible = false; c.userData.respawnAt = now + 15000;
        state.coins += 100; persistSave();
        Audio.playCoin(); showDriveAlert('+100 COINS!');
        const task = cityTasks[state.taskIndex % cityTasks.length];
        if (task.type === 'coins') {
          taskProgress += 1;
          if (taskProgress >= task.target) completeCurrentTask();
          else updateTaskUI();
        }
      }
    }

    for (const t of trafficCars) {
      if (t.axis === 'z') { t.mesh.position.z += t.speed * dt; if (t.mesh.position.z > CITY_BOUND) t.mesh.position.z = -CITY_BOUND; }
      else { t.mesh.position.x += t.speed * dt; if (t.mesh.position.x > CITY_BOUND) t.mesh.position.x = -CITY_BOUND; }
    }

    const kmh = Math.abs(Math.round(driveState.speed * 2.8));
    speedKmhEl.textContent = kmh;
    nitroHudBar.style.width = driveState.nitro.toFixed(0) + '%';
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

    drawMiniMap();
    renderer.render(scene, camera);
  }

  const updateWheelSteer = (e) => {
    const rect = steeringZone.getBoundingClientRect();
    if (isStageRotated()) {
      const centerY = rect.top + rect.height / 2;
      driveState.targetSteer = Math.max(-1, Math.min(1, (centerY - e.clientY) / (rect.height * 0.45)));
    } else {
      const centerX = rect.left + rect.width / 2;
      driveState.targetSteer = Math.max(-1, Math.min(1, (centerX - e.clientX) / (rect.width * 0.45)));
    }
  };
  steeringZone.addEventListener('pointerdown', (e) => { driveState.wheelDragging = true; steeringZone.setPointerCapture(e.pointerId); updateWheelSteer(e); });
  steeringZone.addEventListener('pointermove', (e) => { if (driveState.wheelDragging) updateWheelSteer(e); });
  const releaseWheel = () => { driveState.wheelDragging = false; driveState.targetSteer = 0; };
  steeringZone.addEventListener('pointerup', releaseWheel);
  steeringZone.addEventListener('pointercancel', releaseWheel);

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
    Audio.unlock();
    Audio.playIgnition();
    showScreen(playScreen);
    initCityWorld();
    const eq = vehicles.find((v) => v.id === state.equippedId) || vehicles[0];
    Audio.startEngine(eq.modelType);
    lastFrameTime = performance.now();
    if (cityRafId) cancelAnimationFrame(cityRafId);
    cityRafId = requestAnimationFrame(cityLoop);
  });

  exitToGarageBtn.addEventListener('click', () => {
    Audio.stopEngine();
    if (cityRafId) { cancelAnimationFrame(cityRafId); cityRafId = null; }
    showScreen(garageScreen);
    renderGarage();
  });

  window.addEventListener('resize', resizeCanvases);

  // Immediately start 5-second loading screen on open (no Tap Logo screen)
  startLoadingSequence();
})();
