window.HillGame = {
  start(vehicle, map, skin, upgradeMap) {
    const hwCanvas = document.getElementById('highway3dCanvas');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const up = upgradeMap || {};
    const upLv = (k) => up[(vehicle.id || 'agera') + k] || 0;
    const ctrl = window.STControls || { tiltEnabled: true, tiltSensitivity: 1.0, desktopKeyboard: true, touchButtons: true };

    // Show/hide on-screen steer buttons based on Settings
    const slBtn = document.getElementById('steerLeft'), srBtn = document.getElementById('steerRight');
    if (slBtn) slBtn.classList.toggle('hidden', !ctrl.touchButtons);
    if (srBtn) srBtn.classList.toggle('hidden', !ctrl.touchButtons);

    let W = 1280, H = 720;
    let alive = true, paused = false, crashed = false;
    let countdownVal = 0, countdownTimer = null;

    let kmh = 72;
    const minCruiseKmh = 65;
    const maxKmh = 220 + (vehicle.speed || 90) * 0.85 + upLv('Engine') * 12;
    const accelRate = 0.44 + (vehicle.acc || 90) * 0.003 + upLv('Tires') * 0.04;

    let distanceMeters = 0, bonusScore = 0, score = 0;
    let nearMissCount = 0, runTCoins = 0, combo = 0, lastNearMissTime = 0;

    // REALISTIC NARROWER 4-LANE HIGHWAY (10.8 units wide instead of 15.6!)
    const LANES = [-3.9, -1.3, 1.3, 3.9];
    const ROAD_HALF_LIMIT = 4.45;
    const PLAYER_Z = -3.4;

    let playerX = 1.3;
    let smoothSteer = 0;
    let tiltSteer = 0;
    let dragSteer = 0;
    let gas = false, brake = false, nitroActive = false;
    let steerLeftHeld = false, steerRightHeld = false;
    let headlightsOn = false;
    let viewMode = 'chase3d';
    let soundVol = 0.75, musicVol = 0.65;

    let popups = [];
    let audio = null, engineOsc = null, engineGain = null;
    let lastFrameTime = performance.now();

    document.getElementById('pauseOverlay')?.classList.add('hidden');
    document.getElementById('optionsOverlay')?.classList.add('hidden');
    document.getElementById('crashOverlay')?.classList.add('hidden');
    document.getElementById('end')?.classList.add('hidden');
    document.getElementById('dist').textContent = '0';
    if (document.getElementById('runDistKm')) document.getElementById('runDistKm').textContent = '0.00 KM';
    if (document.getElementById('runTCoins')) document.getElementById('runTCoins').textContent = '0';
    if (document.getElementById('runNearMiss')) document.getElementById('runNearMiss').textContent = '0';

    const camBtn = document.getElementById('camModeBtn');
    if (camBtn) camBtn.textContent = '🎥 BACKSIDE';

    // MOBILE TILT / GYROSCOPE STEERING LISTENER (DEFAULT ON)
    function onDeviceOrientation(e) {
      if (!ctrl.tiltEnabled || paused || crashed) { tiltSteer = 0; return; }
      const isPortrait = window.innerHeight > window.innerWidth;
      // In landscape, phone tilt left/right is beta; in portrait, it's gamma
      let rawAngle = isPortrait ? (e.gamma || 0) : (e.beta || 0);
      if (!isPortrait && (window.orientation === -90 || (screen.orientation && screen.orientation.angle === 270))) {
        rawAngle = -rawAngle;
      }
      // Deadzone of 3 degrees for ultra-smooth straight driving
      if (Math.abs(rawAngle) < 3) { tiltSteer = 0; return; }
      const norm = Math.max(-1, Math.min(1, (rawAngle / 24) * (ctrl.tiltSensitivity || 1.0)));
      tiltSteer = norm;
    }
    window.addEventListener('deviceorientation', onDeviceOrientation);

    const THREE = window.THREE;
    let scene, camera, renderer, player3DMesh = null, headlightBeam = null;
    let roadTex = null, roadBumpTex = null;
    let roadsideProps = [], trafficList = [];

    function createRealisticRoadTextures(maxAniso) {
      const diffC = document.createElement('canvas');
      diffC.width = 1024; diffC.height = 1024;
      const dCtx = diffC.getContext('2d');
      const bumpC = document.createElement('canvas');
      bumpC.width = 512; bumpC.height = 512;
      const bCtx = bumpC.getContext('2d');

      dCtx.fillStyle = '#2b2f36';
      dCtx.fillRect(0, 0, 1024, 1024);
      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 40000; i++) {
        const x = Math.random() * 1024, y = Math.random() * 1024;
        const shade = 30 + Math.floor(Math.random() * 34);
        dCtx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
        dCtx.fillRect(x, y, 2, 2);
        if (i < 18000) {
          const b = 90 + Math.floor(Math.random() * 80);
          bCtx.fillStyle = `rgb(${b},${b},${b})`;
          bCtx.fillRect(x * 0.5, y * 0.5, 2, 2);
        }
      }

      dCtx.fillStyle = '#e2e8f0';
      dCtx.fillRect(20, 0, 14, 1024);
      dCtx.fillRect(990, 0, 14, 1024);

      dCtx.fillStyle = '#eab308';
      dCtx.fillRect(498, 0, 10, 1024);
      dCtx.fillRect(516, 0, 10, 1024);

      dCtx.fillStyle = '#e2e8f0';
      for (let y = 32; y < 1024; y += 256) {
        dCtx.fillRect(252, y, 10, 110);
        dCtx.fillRect(762, y, 10, 110);
      }

      const diffTex = new THREE.CanvasTexture(diffC);
      diffTex.wrapS = THREE.RepeatWrapping; diffTex.wrapT = THREE.RepeatWrapping;
      diffTex.repeat.set(1, 24); diffTex.anisotropy = maxAniso;

      const bumpTex = new THREE.CanvasTexture(bumpC);
      bumpTex.wrapS = THREE.RepeatWrapping; bumpTex.wrapT = THREE.RepeatWrapping;
      bumpTex.repeat.set(2, 48); bumpTex.anisotropy = maxAniso;

      return { diffTex, bumpTex };
    }

    function syncSizes() {
      const sr = window.getStageRect ? window.getStageRect() : { width: innerWidth, height: innerHeight };
      W = canvas.width = sr.width; H = canvas.height = sr.height;
      if (renderer && camera) {
        camera.aspect = W / H; camera.updateProjectionMatrix();
        renderer.setSize(W, H, false);
      }
    }

    // OPPONENT TRAFFIC POOL: INCLUDES ALL ADMIN-UPLOADED 3D CARS + BUILT-IN CARS (NO BIKES!)
    const allCarsPool = (window.VEHICLES || []).filter(v => v && v.type !== 'bike');
    const customUploadedCars = allCarsPool.filter(v => v.isCustomAdmin);
    const opponentPool = customUploadedCars.length ? [...customUploadedCars, ...allCarsPool] : allCarsPool;

    function spawnTrafficVehicle(zPos) {
      const laneIdx = Math.floor(Math.random() * 4);
      const laneX = LANES[laneIdx];
      const tpl = opponentPool[Math.floor(Math.random() * opponentPool.length)] || vehicle;
      const mesh = window.GameUI.buildThreeCarMesh(tpl, null, 3.85);
      mesh.rotation.y = Math.PI;
      mesh.position.set(laneX, 0.02, zPos);
      scene.add(mesh);
      trafficList.push({
        mesh, laneIdx, x: laneX, z: zPos,
        speedKmh: 58 + Math.random() * 38,
        halfWidth: 0.88,
        overtaken: false
      });
    }

    function initHighway3D() {
      if (!THREE || !hwCanvas) return;
      const sr = window.getStageRect ? window.getStageRect() : { width: innerWidth, height: innerHeight };
      W = sr.width; H = sr.height;

      scene = new THREE.Scene();
      const fogCol = new THREE.Color(map.skyBottom || '#ea580c');
      scene.fog = new THREE.FogExp2(fogCol, 0.0062);

      camera = new THREE.PerspectiveCamera(56, W / H, 0.1, 280);
      renderer = new THREE.WebGLRenderer({ canvas: hwCanvas, antialias: true, alpha: false });
      renderer.setSize(W, H, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(fogCol);

      scene.add(new THREE.HemisphereLight(0xffedd5, 0x1e293b, 1.4));
      const sunLight = new THREE.DirectionalLight(0xfde047, 1.95);
      sunLight.position.set(12, 24, -140);
      scene.add(sunLight);

      const groundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(360, 420),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(map.ground || '#3f6212'), roughness: 0.95 })
      );
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.position.set(0, -0.06, -150);
      scene.add(groundMesh);

      const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4;
      const texPack = createRealisticRoadTextures(maxAniso);
      roadTex = texPack.diffTex; roadBumpTex = texPack.bumpTex;

      // REALISTIC NARROWER ROAD (10.8 units wide)
      const roadMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(10.8, 420),
        new THREE.MeshStandardMaterial({ map: roadTex, bumpMap: roadBumpTex, bumpScale: 0.04, roughness: 0.82, metalness: 0.08 })
      );
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(0, 0.0, -150);
      scene.add(roadMesh);

      const railMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.72, roughness: 0.32 });
      [-5.65, 5.65].forEach(rx => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.36, 420), railMat);
        beam.position.set(rx, 0.58, -150);
        scene.add(beam);
      });

      const postGeo = new THREE.BoxGeometry(0.14, 0.78, 0.14);
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.3, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c2d0c });
      const foliageColors = map.id === 'sunset' ? [0xd97706, 0xb45309, 0x65a30d] : map.id === 'snow' ? [0xe2e8f0, 0xcbd5e1] : [0x15803d, 0x166534, 0x22c55e];

      for (let z = 12; z > -250; z -= 10) {
        [-5.7, 5.7].forEach(px => {
          const post = new THREE.Mesh(postGeo, railMat);
          post.position.set(px, 0.39, z);
          scene.add(post);
          roadsideProps.push({ mesh: post, step: 260 });
        });
        if (Math.abs(z) % 20 === 0) {
          [-1, 1].forEach(side => {
            const treeGroup = new THREE.Group();
            const trunk = new THREE.Mesh(trunkGeo, trunkMat); trunk.position.y = 1.15; treeGroup.add(trunk);
            const fCol = foliageColors[Math.abs(Math.floor(z)) % foliageColors.length];
            const crown = new THREE.Mesh(new THREE.SphereGeometry(2.1, 10, 10), new THREE.MeshStandardMaterial({ color: fCol, roughness: 0.78 }));
            crown.position.y = 3.3; treeGroup.add(crown);
            treeGroup.position.set(side * (9.2 + (Math.abs(z) % 5)), 0, z);
            scene.add(treeGroup);
            roadsideProps.push({ mesh: treeGroup, step: 260 });
          });
        }
      }

      if (window.GameUI && window.GameUI.buildThreeCarMesh) {
        player3DMesh = window.GameUI.buildThreeCarMesh(vehicle, skin, 3.95);
        player3DMesh.rotation.y = Math.PI;
        player3DMesh.position.set(playerX, 0.02, PLAYER_Z);
        scene.add(player3DMesh);
      }

      headlightBeam = new THREE.SpotLight(0xfef08a, 0.0, 95, Math.PI / 5, 0.4, 1);
      headlightBeam.position.set(playerX, 1.1, PLAYER_Z - 1.0);
      headlightBeam.target.position.set(playerX, 0.1, -65);
      scene.add(headlightBeam); scene.add(headlightBeam.target);

      for (let i = 0; i < 8; i++) spawnTrafficVehicle(-48 - i * 32);
    }

    initHighway3D();
    syncSizes();
    window.addEventListener('resize', syncSizes);

    function audioStart() {
      if (audio || soundVol <= 0.02) return;
      try {
        audio = new (window.AudioContext || window.webkitAudioContext)();
        engineOsc = audio.createOscillator(); engineGain = audio.createGain();
        engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 65; engineGain.gain.value = 0.0001;
        engineOsc.connect(engineGain); engineGain.connect(audio.destination);
        engineOsc.start();
      } catch (e) {}
    }

    function updateEngineSound() {
      if (engineGain && audio) {
        if (paused || crashed || soundVol <= 0.02) {
          engineGain.gain.setTargetAtTime(0.0001, audio.currentTime, 0.05);
          return;
        }
        const targetGain = ((gas || nitroActive) ? 0.042 : 0.018) * soundVol;
        engineGain.gain.setTargetAtTime(targetGain, audio.currentTime, 0.06);
        engineOsc.frequency.setTargetAtTime(52 + kmh * 0.85, audio.currentTime, 0.05);
      }
    }

    function loop(now) {
      if (!alive) return;
      requestAnimationFrame(loop);

      const dt = Math.min(0.05, Math.max(0.008, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      if (!paused && !crashed && countdownVal <= 0) {
        if (gas || nitroActive) {
          const mult = nitroActive ? 1.85 : 1.0;
          kmh = Math.min(maxKmh * (nitroActive ? 1.2 : 1.0), kmh + accelRate * mult);
        } else if (brake) {
          kmh = Math.max(40, kmh - 1.25);
        } else {
          if (kmh < minCruiseKmh) kmh += 0.25;
          else if (kmh > 95) kmh -= 0.05;
        }

        // Smooth combined steering: Keyboard/Buttons + Tilt (Mobile Default) + Touch Drag
        let rawSteer = 0;
        if (steerLeftHeld) rawSteer = -1;
        else if (steerRightHeld) rawSteer = 1;
        else if (Math.abs(dragSteer) > 0.04) rawSteer = dragSteer;
        else if (ctrl.tiltEnabled) rawSteer = tiltSteer;

        smoothSteer += (rawSteer - smoothSteer) * 0.14;
        const steerSpeed = 5.4 * ((vehicle.handling || 90) / 90);
        playerX += smoothSteer * steerSpeed * dt;
        playerX = Math.max(-ROAD_HALF_LIMIT, Math.min(ROAD_HALF_LIMIT, playerX));

        const metersThisFrame = (kmh / 3.6) * dt;
        distanceMeters += metersThisFrame;
        score = Math.floor(distanceMeters * 0.2) + bonusScore;

        document.getElementById('dist').textContent = score.toLocaleString('en-IN');
        if (document.getElementById('runDistKm')) document.getElementById('runDistKm').textContent = (distanceMeters / 1000).toFixed(2) + ' KM';

        const dz = (kmh / 3.6) * dt * 1.45;
        if (roadTex) roadTex.offset.y += dz * 0.056;
        if (roadBumpTex) roadBumpTex.offset.y += dz * 0.112;

        roadsideProps.forEach(p => {
          p.mesh.position.z += dz;
          if (p.mesh.position.z > 14) p.mesh.position.z -= p.step;
        });

        if (combo > 0 && now - lastNearMissTime > 4000) combo = 0;

        for (let i = 0; i < trafficList.length; i++) {
          const tv = trafficList[i];
          const relSpeedKmh = kmh - tv.speedKmh;
          tv.z += (relSpeedKmh / 3.6) * dt * 1.45;
          tv.mesh.position.z = tv.z;

          if (headlightsOn && tv.z < -5 && tv.z > -40 && Math.abs(tv.x - playerX) < 1.9) {
            const shiftDir = tv.x > 0 ? 0.028 : -0.028;
            tv.x = Math.max(-4.1, Math.min(4.1, tv.x + shiftDir));
            tv.mesh.position.x = tv.x;
          }

          const playerHalfW = 0.86;
          const lateralDist = Math.abs(tv.x - playerX);

          // Collision
          if (tv.z > PLAYER_Z - 2.1 && tv.z < PLAYER_Z + 1.95) {
            if (lateralDist < (tv.halfWidth + playerHalfW - 0.18)) {
              crashed = true;
              window.GameUI?.coin?.(180);
              document.getElementById('crashOverlay')?.classList.remove('hidden');
              break;
            }
          }

          // NEAR MISS -> AWARD T-COINS + SCORE!
          if (!tv.overtaken && tv.z > PLAYER_Z + 1.7) {
            tv.overtaken = true;
            if (lateralDist < 2.85 && kmh >= 72) {
              combo = (now - lastNearMissTime <= 4000) ? Math.min(5, combo + 1) : 1;
              lastNearMissTime = now;
              nearMissCount += 1;
              const isUltra = lateralDist < 2.05;
              const tCoinsEarned = (isUltra ? 50 : 25) * combo;
              const pts = (isUltra ? 100 : 50) * combo;
              runTCoins += tCoinsEarned;
              bonusScore += pts;
              score = Math.floor(distanceMeters * 0.2) + bonusScore;

              window.GameUI?.coin?.(980 + combo * 110);
              document.getElementById('dist').textContent = score.toLocaleString('en-IN');
              if (document.getElementById('runTCoins')) document.getElementById('runTCoins').textContent = String(runTCoins);
              if (document.getElementById('runNearMiss')) document.getElementById('runNearMiss').textContent = String(nearMissCount);

              popups.push({
                text: `+${tCoinsEarned} T-COINS ⚡ NEAR MISS${combo > 1 ? ' x' + combo : ''}`,
                x: W * 0.5, y: H * 0.42,
                color: isUltra ? '#38bdf8' : '#facc15',
                life: 52
              });
            }
          }

          if (tv.z > 16) {
            tv.z = -245 - Math.random() * 55;
            tv.laneIdx = Math.floor(Math.random() * 4);
            tv.x = LANES[tv.laneIdx];
            tv.mesh.position.set(tv.x, 0.02, tv.z);
            tv.overtaken = false;
          }
        }
      }

      if (camera && scene && renderer) {
        if (crashed) {
          camera.position.set(playerX * 0.65, 1.55, 2.8);
          camera.lookAt(playerX, 0.85, -80);
        } else {
          if (player3DMesh) {
            player3DMesh.visible = true;
            player3DMesh.position.set(playerX, 0.02, PLAYER_Z);
            player3DMesh.rotation.z = -smoothSteer * 0.08;
            player3DMesh.rotation.y = Math.PI - smoothSteer * 0.14;
          }
          const targetFov = 55 + Math.min(13, (kmh - 65) * 0.08);
          camera.fov += (targetFov - camera.fov) * 0.08;
          camera.updateProjectionMatrix();

          if (viewMode === 'far3d') {
            camera.position.set(playerX * 0.90, 2.85, 3.2);
            camera.lookAt(playerX, 0.85, -45);
          } else {
            camera.position.set(playerX * 0.92, 1.95, 1.25);
            camera.lookAt(playerX, 0.82, -42);
          }
        }

        if (headlightBeam) {
          headlightBeam.intensity = headlightsOn ? 3.5 : 0.0;
          headlightBeam.position.set(playerX, 1.1, PLAYER_Z - 1.0);
          headlightBeam.target.position.set(playerX, 0.1, -65);
        }
        renderer.render(scene, camera);
      }

      ctx.clearRect(0, 0, W, H);
      for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        p.y -= 0.95; p.life--;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / 18);
        ctx.font = '900 22px Inter, sans-serif';
        ctx.fillStyle = p.color; ctx.strokeStyle = 'rgba(0,0,0,0.88)'; ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
        if (p.life <= 0) popups.splice(i, 1);
      }

      if (countdownVal > 0) {
        ctx.save();
        ctx.font = '900 54px Inter, sans-serif';
        ctx.fillStyle = countdownVal === 1 ? '#4ade80' : '#facc15';
        ctx.strokeStyle = '#090d16'; ctx.lineWidth = 5; ctx.textAlign = 'center';
        const txt = countdownVal === 1 ? 'GO!' : String(countdownVal - 1);
        ctx.strokeText(txt, W * 0.5, H * 0.45); ctx.fillText(txt, W * 0.5, H * 0.45);
        ctx.restore();
      }

      const speedEl = document.getElementById('speedKmh');
      if (speedEl) speedEl.textContent = Math.floor(kmh);
      updateEngineSound();
    }

    const stop = () => {
      alive = false;
      clearInterval(countdownTimer);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      if (audio) { try { audio.close(); } catch (e) {} audio = null; }
      window.removeEventListener('resize', syncSizes);
    };

    function startResumeCountdown() {
      clearInterval(countdownTimer);
      countdownVal = 4;
      countdownTimer = setInterval(() => {
        countdownVal--;
        if (countdownVal <= 0) { clearInterval(countdownTimer); paused = false; }
      }, 650);
    }

    function hold(id, fn) {
      const b = document.getElementById(id);
      if (!b) return;
      b.onpointerdown = e => { e.preventDefault(); audioStart(); fn(true); };
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(k => b.addEventListener(k, () => fn(false)));
    }
    hold('gas', v => gas = v);
    hold('brake', v => brake = v);
    hold('nitro', v => nitroActive = v);
    hold('steerLeft', v => steerLeftHeld = v);
    hold('steerRight', v => steerRightHeld = v);

    let draggingSteer = false, steerStartCoord = 0;
    const getCoord = e => (window.getStageRect && window.getStageRect().isPortrait) ? e.clientY : e.clientX;
    hwCanvas.onpointerdown = e => { audioStart(); draggingSteer = true; steerStartCoord = getCoord(e); };
    window.onpointermove = e => {
      if (!draggingSteer) return;
      dragSteer = Math.max(-1, Math.min(1, (getCoord(e) - steerStartCoord) / 90));
    };
    window.onpointerup = () => { draggingSteer = false; dragSteer = 0; };

    const hlBtn = document.getElementById('headlightBtn');
    if (hlBtn) hlBtn.onclick = () => { headlightsOn = !headlightsOn; hlBtn.classList.toggle('active', headlightsOn); window.GameUI?.coin?.(720); };

    if (camBtn) camBtn.onclick = () => {
      viewMode = viewMode === 'chase3d' ? 'far3d' : 'chase3d';
      camBtn.textContent = viewMode === 'chase3d' ? '🎥 BACKSIDE' : '🎥 WIDE CHASE';
    };

    document.getElementById('pauseBtn').onclick = () => { if (!crashed) { paused = true; document.getElementById('pauseOverlay').classList.remove('hidden'); } };
    document.getElementById('pauseContinueBtn').onclick = () => { document.getElementById('pauseOverlay').classList.add('hidden'); startResumeCountdown(); };
    document.getElementById('pauseRestartBtn').onclick = () => { stop(); window.GameUI.start(); };
    document.getElementById('openOptionsBtn').onclick = () => { document.getElementById('pauseOverlay').classList.add('hidden'); document.getElementById('optionsOverlay').classList.remove('hidden'); };
    document.getElementById('optionsContinueBtn').onclick = () => { document.getElementById('optionsOverlay').classList.add('hidden'); document.getElementById('pauseOverlay').classList.remove('hidden'); };

    const bindBar = (trackId, fillId, isMusic) => {
      const tr = document.getElementById(trackId), fl = document.getElementById(fillId);
      if (!tr || !fl) return;
      tr.onclick = e => {
        const rect = tr.getBoundingClientRect();
        const sr = window.getStageRect ? window.getStageRect() : { isPortrait: false };
        const ratio = sr.isPortrait ? Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)) : Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        fl.style.width = Math.round(ratio * 100) + '%';
        if (isMusic) musicVol = ratio; else soundVol = ratio;
      };
    };
    bindBar('soundBarTrack', 'soundBarFill', false);
    bindBar('musicBarTrack', 'musicBarFill', true);

    document.getElementById('continueFreeBtn').onclick = () => {
      document.getElementById('crashOverlay').classList.add('hidden');
      trafficList.forEach(tv => { if (tv.z > -45) { tv.z -= 95; tv.mesh.position.z = tv.z; } });
      crashed = false; kmh = 85; startResumeCountdown();
    };
    document.getElementById('crashCancelBtn').onclick = () => {
      document.getElementById('crashOverlay').classList.add('hidden');
      const distKm = distanceMeters / 1000;
      window.GameUI?.onRunEnded?.(score, distKm, runTCoins);
      document.getElementById('finalScoreNum').textContent = score.toLocaleString('en-IN');
      document.getElementById('summary').textContent = `DIST: ${distKm.toFixed(2)} KM • NEAR MISSES: ${nearMissCount} • T-COINS: +${runTCoins} 🟡`;
      document.getElementById('end').classList.remove('hidden');
    };

    const exitToMenu = () => { stop(); document.getElementById('game').classList.add('hidden'); document.getElementById('menu').classList.remove('hidden'); };
    document.getElementById('home').onclick = exitToMenu;
    document.getElementById('garage').onclick = exitToMenu;
    document.getElementById('retry').onclick = () => { stop(); window.GameUI.start(); };
    document.getElementById('scoresBtn').onclick = () => { window.showToast?.(`👑 Best Score: ${localStorage.getItem('sthwBest') || score}`); };

    window.onkeydown = e => {
      if (!ctrl.desktopKeyboard) return;
      if (e.key === 'ArrowUp' || e.key === 'w') { audioStart(); gas = true; }
      if (e.key === 'ArrowDown' || e.key === 's') brake = true;
      if (e.key === 'ArrowLeft' || e.key === 'a') steerLeftHeld = true;
      if (e.key === 'ArrowRight' || e.key === 'd') steerRightHeld = true;
      if (e.key === 'Shift' || e.key === ' ') nitroActive = true;
    };
    window.onkeyup = e => {
      if (e.key === 'ArrowUp' || e.key === 'w') gas = false;
      if (e.key === 'ArrowDown' || e.key === 's') brake = false;
      if (e.key === 'ArrowLeft' || e.key === 'a') steerLeftHeld = false;
      if (e.key === 'ArrowRight' || e.key === 'd') steerRightHeld = false;
      if (e.key === 'Shift' || e.key === ' ') nitroActive = false;
    };

    requestAnimationFrame(loop);
  }
};
