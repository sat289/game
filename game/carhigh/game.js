window.HillGame = {
  _customCarModel: null,

  loadCustomCarFile(file, onDone) {
    const THREE = window.THREE;
    if (!file || !THREE) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const url = URL.createObjectURL(file);

    const normalizeModel = (obj) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const targetWidth = 1.95;
      const scale = targetWidth / (Math.max(size.x, 0.01));
      obj.scale.setScalar(scale);

      box.setFromObject(obj);
      box.getCenter(center);
      obj.position.set(-center.x, -box.min.y, -center.z);

      const wrapper = new THREE.Group();
      wrapper.add(obj);
      window.HillGame._customCarModel = wrapper;
      if (typeof onDone === 'function') onDone(wrapper);
    };

    if ((ext === 'glb' || ext === 'gltf') && THREE.GLTFLoader) {
      new THREE.GLTFLoader().load(url, (gltf) => {
        normalizeModel(gltf.scene);
        URL.revokeObjectURL(url);
      });
    } else if (ext === 'obj') {
      file.text().then((text) => {
        if (window.GameUI && window.GameUI.buildThreeCarMesh) {
          const mesh = window.GameUI.buildThreeCarMesh({ inlineObjText: text, type: 'car' }, null, 3.8);
          normalizeModel(mesh);
        }
        URL.revokeObjectURL(url);
      });
    }
  },

  start(vehicle, map, skin, upgradeMap) {
    const hwCanvas = document.getElementById('highway3dCanvas');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const up = upgradeMap || {};
    const upLv = (k) => up[(vehicle.id || 'agera') + k] || 0;

    let W = 1280, H = 720;
    let alive = true, paused = false, crashed = false;
    let countdownVal = 0, countdownTimer = null;

    let kmh = 67;
    const minCruiseKmh = 60;
    const maxKmh = 210 + (vehicle.speed || 90) * 0.85 + upLv('Engine') * 12;
    const accelRate = 0.42 + (vehicle.acc || 90) * 0.003 + upLv('Tires') * 0.04;

    let score = 0, runCoins = 0, runGems = 0;
    let playerX = 1.75;
    let steerInput = 0;
    let wheelAngle = 0;
    let gas = false, brake = false, nitroActive = false;
    let steerLeftHeld = false, steerRightHeld = false;
    let headlightsOn = false;
    let viewMode = 'chase3d';
    let soundVol = 0.75, musicVol = 0.65;

    let popups = [];
    let audio = null, engineOsc = null, engineGain = null;

    document.getElementById('pauseOverlay')?.classList.add('hidden');
    document.getElementById('optionsOverlay')?.classList.add('hidden');
    document.getElementById('crashOverlay')?.classList.add('hidden');
    document.getElementById('end')?.classList.add('hidden');
    document.getElementById('dist').textContent = '0';
    document.getElementById('runCoins').textContent = '0';
    if (document.getElementById('runGems')) document.getElementById('runGems').textContent = '0';

    const camBtn = document.getElementById('camModeBtn');
    if (camBtn) camBtn.textContent = '🎥 VIEW: BACKSIDE';

    const THREE = window.THREE;
    let scene, camera, renderer, player3DMesh = null, headlightBeam = null;
    let roadTex = null, roadBumpTex = null;
    let roadsideProps = [], trafficList = [], pickupList = [];
    const LANES = [-5.25, -1.75, 1.75, 5.25];

    function createRealisticRoadTextures(maxAniso) {
      const diffC = document.createElement('canvas');
      diffC.width = 1024;
      diffC.height = 1024;
      const dCtx = diffC.getContext('2d');

      const bumpC = document.createElement('canvas');
      bumpC.width = 512;
      bumpC.height = 512;
      const bCtx = bumpC.getContext('2d');

      dCtx.fillStyle = '#2d3138';
      dCtx.fillRect(0, 0, 1024, 1024);

      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 45000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const shade = 32 + Math.floor(Math.random() * 38);
        dCtx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
        dCtx.fillRect(x, y, 2, 2);

        if (i < 22000) {
          const b = 90 + Math.floor(Math.random() * 80);
          bCtx.fillStyle = `rgb(${b},${b},${b})`;
          bCtx.fillRect(x * 0.5, y * 0.5, 2, 2);
        }
      }

      const laneCenters = [128, 384, 640, 896];
      laneCenters.forEach(cx => {
        [-42, 42].forEach(off => {
          const grad = dCtx.createLinearGradient(cx + off - 26, 0, cx + off + 26, 0);
          grad.addColorStop(0, 'rgba(15,18,22,0)');
          grad.addColorStop(0.5, 'rgba(15,18,22,0.32)');
          grad.addColorStop(1, 'rgba(15,18,22,0)');
          dCtx.fillStyle = grad;
          dCtx.fillRect(cx + off - 26, 0, 52, 1024);
        });
      });

      dCtx.fillStyle = '#e2e8f0';
      dCtx.fillRect(22, 0, 12, 1024);
      dCtx.fillRect(990, 0, 12, 1024);

      dCtx.fillStyle = '#eab308';
      dCtx.fillRect(496, 0, 10, 1024);
      dCtx.fillRect(518, 0, 10, 1024);

      dCtx.fillStyle = '#e2e8f0';
      for (let y = 32; y < 1024; y += 256) {
        dCtx.fillRect(252, y, 10, 110);
        dCtx.fillRect(762, y, 10, 110);
      }

      const diffTex = new THREE.CanvasTexture(diffC);
      diffTex.wrapS = THREE.RepeatWrapping;
      diffTex.wrapT = THREE.RepeatWrapping;
      diffTex.repeat.set(1, 22);
      diffTex.anisotropy = maxAniso;

      const bumpTex = new THREE.CanvasTexture(bumpC);
      bumpTex.wrapS = THREE.RepeatWrapping;
      bumpTex.wrapT = THREE.RepeatWrapping;
      bumpTex.repeat.set(2, 44);
      bumpTex.anisotropy = maxAniso;

      return { diffTex, bumpTex };
    }

    function syncSizes() {
      const sr = window.getStageRect ? window.getStageRect() : { width: innerWidth, height: innerHeight };
      W = canvas.width = sr.width;
      H = canvas.height = sr.height;
      if (renderer && camera) {
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H, false);
      }
    }

    function initHighway3D() {
      if (!THREE || !hwCanvas) return;
      const sr = window.getStageRect ? window.getStageRect() : { width: innerWidth, height: innerHeight };
      W = sr.width; H = sr.height;

      scene = new THREE.Scene();
      const fogCol = new THREE.Color(map.skyBottom || '#ea580c');
      scene.fog = new THREE.FogExp2(fogCol, 0.0068);

      camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 280);
      renderer = new THREE.WebGLRenderer({ canvas: hwCanvas, antialias: true, alpha: false });
      renderer.setSize(W, H, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(fogCol);

      scene.add(new THREE.HemisphereLight(0xffedd5, 0x1e293b, 1.35));
      const sunLight = new THREE.DirectionalLight(0xfde047, 1.9);
      sunLight.position.set(12, 24, -140);
      scene.add(sunLight);

      const groundMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(map.ground || '#3f6212'),
        roughness: 0.95
      });
      const groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(360, 420), groundMat);
      groundMesh.rotation.x = -Math.PI / 2;
      groundMesh.position.set(0, -0.06, -150);
      scene.add(groundMesh);

      const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 4;
      const texPack = createRealisticRoadTextures(maxAniso);
      roadTex = texPack.diffTex;
      roadBumpTex = texPack.bumpTex;

      const roadMat = new THREE.MeshStandardMaterial({
        map: roadTex,
        bumpMap: roadBumpTex,
        bumpScale: 0.04,
        roughness: 0.82,
        metalness: 0.08
      });
      const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(14.8, 420), roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(0, 0.0, -150);
      scene.add(roadMesh);

      const railMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.72, roughness: 0.32 });
      [-7.65, 7.65].forEach(rx => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 420), railMat);
        beam.position.set(rx, 0.58, -150);
        scene.add(beam);
      });

      const postGeo = new THREE.BoxGeometry(0.16, 0.78, 0.16);
      const trunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 2.4, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c2d0c });
      const foliageColors = map.id === 'sunset'
        ? [0xd97706, 0xb45309, 0x65a30d, 0x9a3412]
        : map.id === 'snow'
        ? [0xe2e8f0, 0xcbd5e1]
        : [0x15803d, 0x166534, 0x22c55e];
      const rockGeo = new THREE.DodecahedronGeometry(3.2, 1);
      const rockMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });

      for (let z = 12; z > -250; z -= 10) {
        [-7.7, 7.7].forEach(px => {
          const post = new THREE.Mesh(postGeo, railMat);
          post.position.set(px, 0.39, z);
          scene.add(post);
          roadsideProps.push({ mesh: post, step: 260 });
        });

        if (Math.abs(z) % 20 === 0) {
          [-1, 1].forEach(side => {
            const treeGroup = new THREE.Group();
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 1.2;
            treeGroup.add(trunk);
            const fCol = foliageColors[Math.abs(Math.floor(z)) % foliageColors.length];
            const crown = new THREE.Mesh(
              new THREE.SphereGeometry(2.3, 10, 10),
              new THREE.MeshStandardMaterial({ color: fCol, roughness: 0.78 })
            );
            crown.position.y = 3.5;
            treeGroup.add(crown);
            treeGroup.position.set(side * (11.5 + (Math.abs(z) % 6)), 0, z);
            scene.add(treeGroup);
            roadsideProps.push({ mesh: treeGroup, step: 260 });
          });
        }

        if (Math.abs(z) % 30 === 0) {
          const rock = new THREE.Mesh(rockGeo, rockMat);
          const side = (Math.abs(z) % 60 === 0) ? -1 : 1;
          rock.position.set(side * 17.5, 1.5, z - 5);
          rock.scale.set(1.5, 1.1, 1.3);
          scene.add(rock);
          roadsideProps.push({ mesh: rock, step: 260 });
        }
      }

      if (window.HillGame._customCarModel) {
        player3DMesh = window.HillGame._customCarModel.clone();
        player3DMesh.rotation.y = Math.PI;
        player3DMesh.position.set(playerX, 0.02, -3.6);
        scene.add(player3DMesh);
      } else if (window.GameUI && window.GameUI.buildThreeCarMesh) {
        const isBike = vehicle.type === 'bike';
        player3DMesh = window.GameUI.buildThreeCarMesh(vehicle, skin, isBike ? 0.36 : 0.074);
        player3DMesh.rotation.y = Math.PI;
        player3DMesh.position.set(playerX, 0.02, -3.6);
        scene.add(player3DMesh);
      }

      headlightBeam = new THREE.SpotLight(0xfef08a, 0.0, 95, Math.PI / 5, 0.4, 1);
      headlightBeam.position.set(playerX, 1.2, -2.5);
      headlightBeam.target.position.set(playerX, 0.1, -60);
      scene.add(headlightBeam);
      scene.add(headlightBeam.target);

      for (let i = 0; i < 9; i++) spawnTrafficVehicle(-40 - i * 28);
      for (let i = 0; i < 10; i++) spawnHighwayPickup(-28 - i * 22);
    }

    const trafficRealPool = [
      { id: 'agera', type: 'car', prebakedKey: 'AGERA_3D_DATA', defaultColor: '#e11d48', secondaryColor: '#111827', scale: 1.0 },
      { id: 'bugatti_chiron', type: 'car', prebakedKey: 'AGERA_3D_DATA', defaultColor: '#2563eb', secondaryColor: '#090d16', scale: 1.0 },
      { id: 'lambo_revuelto', type: 'car', prebakedKey: 'AGERA_3D_DATA', defaultColor: '#22c55e', secondaryColor: '#0f172a', scale: 1.0 },
      { id: 'moto_1000r', type: 'bike', prebakedKey: 'MOTO_3D_DATA', defaultColor: '#f97316', secondaryColor: '#18181b', scale: 1.0 }
    ];

    function spawnTrafficVehicle(zPos) {
      const laneIdx = Math.floor(Math.random() * 4);
      const laneX = LANES[laneIdx];
      const tpl = trafficRealPool[Math.floor(Math.random() * trafficRealPool.length)];
      const isBike = tpl.type === 'bike';
      const mesh = window.GameUI.buildThreeCarMesh(tpl, null, isBike ? 0.34 : 0.07);
      mesh.rotation.y = Math.PI;
      mesh.position.set(laneX, 0.02, zPos);
      scene.add(mesh);
      trafficList.push({
        mesh,
        laneIdx,
        x: laneX,
        z: zPos,
        speedKmh: 58 + Math.random() * 36,
        halfWidth: isBike ? 0.48 : 0.9,
        overtaken: false
      });
    }

    function spawnHighwayPickup(zPos) {
      const isDiamond = Math.random() < 0.25;
      const laneX = LANES[Math.floor(Math.random() * 4)];
      const mesh = isDiamond
        ? new THREE.Mesh(
            new THREE.OctahedronGeometry(0.45, 0),
            new THREE.MeshStandardMaterial({ color: 0x00f5d4, emissive: 0x0284c7, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.1 })
          )
        : new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.45, 0.14, 20).rotateX(Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.35, metalness: 0.85, roughness: 0.15 })
          );
      mesh.position.set(laneX, 0.65, zPos);
      scene.add(mesh);
      pickupList.push({ mesh, x: laneX, z: zPos, isDiamond, collected: false });
    }

    initHighway3D();
    syncSizes();
    window.addEventListener('resize', syncSizes);

    function audioStart() {
      if (audio || soundVol <= 0.02) return;
      try {
        audio = new (window.AudioContext || window.webkitAudioContext)();
        engineOsc = audio.createOscillator();
        engineGain = audio.createGain();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = 65;
        engineGain.gain.value = 0.0001;
        engineOsc.connect(engineGain);
        engineGain.connect(audio.destination);
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

    function loop() {
      if (!alive) return;
      requestAnimationFrame(loop);

      if (!paused && !crashed && countdownVal <= 0) {
        if (gas || nitroActive) {
          const mult = nitroActive ? 1.8 : 1.0;
          kmh = Math.min(maxKmh * (nitroActive ? 1.2 : 1.0), kmh + accelRate * mult);
        } else if (brake) {
          kmh = Math.max(40, kmh - 1.2);
        } else {
          if (kmh < minCruiseKmh) kmh += 0.25;
          else if (kmh > 95) kmh -= 0.05;
        }

        let targetSteer = steerLeftHeld ? -1 : steerRightHeld ? 1 : steerInput;
        const steerSpeed = 0.09 * ((vehicle.handling || 90) / 90);
        playerX += targetSteer * steerSpeed * (kmh / 95);
        playerX = Math.max(-6.1, Math.min(6.1, playerX));

        wheelAngle += (targetSteer * 0.65 - wheelAngle) * 0.18;

        const dz = (kmh / 3.6) * 0.048;

        if (roadTex) roadTex.offset.y += dz * 0.052;
        if (roadBumpTex) roadBumpTex.offset.y += dz * 0.104;

        roadsideProps.forEach(p => {
          p.mesh.position.z += dz;
          if (p.mesh.position.z > 14) p.mesh.position.z -= p.step;
        });

        for (let i = 0; i < trafficList.length; i++) {
          const tv = trafficList[i];
          const relSpeedKmh = kmh - tv.speedKmh;
          tv.z += (relSpeedKmh / 3.6) * 0.048;
          tv.mesh.position.z = tv.z;

          if (headlightsOn && tv.z < -4 && tv.z > -38 && Math.abs(tv.x - playerX) < 1.8) {
            const shiftDir = tv.x > 0 ? 0.03 : -0.03;
            tv.x = Math.max(-5.6, Math.min(5.6, tv.x + shiftDir));
            tv.mesh.position.x = tv.x;
          }

          const playerHalfW = vehicle.type === 'bike' ? 0.45 : 0.85;
          if (tv.z > -5.1 && tv.z < -1.1) {
            if (Math.abs(tv.x - playerX) < (tv.halfWidth + playerHalfW - 0.18)) {
              crashed = true;
              window.GameUI?.coin?.(180);
              document.getElementById('crashOverlay')?.classList.remove('hidden');
              break;
            }
          }

          if (!tv.overtaken && tv.z > -1.2) {
            tv.overtaken = true;
            if (kmh >= 85 && Math.abs(tv.x - playerX) < 4.0) {
              score += 10;
              runCoins += 10;
              window.GameUI?.addCoins?.(10);
              window.GameUI?.coin?.(1080);
              document.getElementById('dist').textContent = score;
              document.getElementById('runCoins').textContent = runCoins;
              popups.push({ text: '+10 CLOSE CALL', x: W * 0.5, y: H * 0.54, color: '#facc15', life: 45 });
            }
          }

          if (tv.z > 14) {
            tv.z = -225 - Math.random() * 45;
            tv.laneIdx = Math.floor(Math.random() * 4);
            tv.x = LANES[tv.laneIdx];
            tv.mesh.position.set(tv.x, 0.02, tv.z);
            tv.overtaken = false;
          }
        }

        for (let i = 0; i < pickupList.length; i++) {
          const pk = pickupList[i];
          pk.z += dz;
          pk.mesh.position.z = pk.z;
          pk.mesh.rotation.y += 0.07;

          if (!pk.collected && pk.z > -5.0 && pk.z < -1.0 && Math.abs(pk.x - playerX) < 1.65) {
            pk.collected = true;
            pk.mesh.visible = false;
            if (pk.isDiamond) {
              runGems += 1;
              window.GameUI?.addGems?.(1);
              window.GameUI?.coin?.(1340);
              if (document.getElementById('runGems')) document.getElementById('runGems').textContent = runGems;
              popups.push({ text: '+1 💎', x: W * 0.5, y: H * 0.48, color: '#38bdf8', life: 42 });
            } else {
              runCoins += 25;
              window.GameUI?.addCoins?.(25);
              window.GameUI?.coin?.(940);
              document.getElementById('runCoins').textContent = runCoins;
              popups.push({ text: '+25 🪙', x: W * 0.5, y: H * 0.50, color: '#fde047', life: 42 });
            }
          }

          if (pk.z > 12) {
            pk.z = -215 - Math.random() * 40;
            pk.x = LANES[Math.floor(Math.random() * 4)];
            pk.mesh.position.set(pk.x, 0.65, pk.z);
            pk.collected = false;
            pk.mesh.visible = true;
          }
        }
      }

      if (camera && scene && renderer) {
        if (crashed) {
          camera.position.set(playerX * 0.6, 1.35, 3.0);
          camera.lookAt(playerX, 0.7, -80);
          if (player3DMesh) player3DMesh.visible = true;
        } else {
          if (player3DMesh) {
            player3DMesh.visible = true;
            player3DMesh.position.set(playerX, 0.02, -3.6);
            player3DMesh.rotation.z = -wheelAngle * (vehicle.type === 'bike' ? 0.5 : 0.1);
            player3DMesh.rotation.y = Math.PI - wheelAngle * 0.18;
          }

          const targetFov = 58 + Math.min(14, (kmh - 60) * 0.08);
          camera.fov += (targetFov - camera.fov) * 0.08;
          camera.updateProjectionMatrix();

          if (viewMode === 'far3d') {
            camera.position.set(playerX * 0.9, 3.1, 4.2);
            camera.lookAt(playerX, 0.8, -45);
          } else {
            camera.position.set(playerX * 0.92, 2.05, 2.25);
            camera.lookAt(playerX, 0.75, -42);
          }
        }

        if (headlightBeam) {
          headlightBeam.intensity = headlightsOn ? 3.5 : 0.0;
          headlightBeam.position.set(playerX, 1.1, -4.2);
          headlightBeam.target.position.set(playerX, 0.1, -65);
        }

        renderer.render(scene, camera);
      }

      ctx.clearRect(0, 0, W, H);
      for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        p.y -= 0.85;
        p.life--;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / 18);
        ctx.font = '900 24px Inter, sans-serif';
        ctx.fillStyle = p.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
        if (p.life <= 0) popups.splice(i, 1);
      }

      if (countdownVal > 0) {
        ctx.save();
        ctx.font = '900 54px Inter, sans-serif';
        ctx.fillStyle = countdownVal === 1 ? '#4ade80' : '#38bdf8';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 5;
        ctx.textAlign = 'center';
        const txt = countdownVal === 1 ? 'GO!' : String(countdownVal - 1);
        ctx.strokeText(txt, W * 0.5, H * 0.45);
        ctx.fillText(txt, W * 0.5, H * 0.45);
        ctx.restore();
      }

      const speedEl = document.getElementById('speedKmh');
      if (speedEl) speedEl.textContent = Math.floor(kmh);
      updateEngineSound();
    }

    const stop = () => {
      alive = false;
      clearInterval(countdownTimer);
      if (audio) { try { audio.close(); } catch (e) {} audio = null; }
      window.removeEventListener('resize', syncSizes);
    };

    function startResumeCountdown() {
      clearInterval(countdownTimer);
      countdownVal = 4;
      countdownTimer = setInterval(() => {
        countdownVal--;
        if (countdownVal <= 0) {
          clearInterval(countdownTimer);
          paused = false;
        }
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
      steerInput = Math.max(-1, Math.min(1, (getCoord(e) - steerStartCoord) / 90));
    };
    window.onpointerup = () => { draggingSteer = false; steerInput = 0; };

    const hlBtn = document.getElementById('headlightBtn');
    if (hlBtn) {
      hlBtn.onclick = () => {
        headlightsOn = !headlightsOn;
        hlBtn.classList.toggle('active', headlightsOn);
        window.GameUI?.coin?.(720);
      };
    }

    if (camBtn) {
      camBtn.onclick = () => {
        viewMode = viewMode === 'chase3d' ? 'far3d' : 'chase3d';
        camBtn.textContent = viewMode === 'chase3d' ? '🎥 VIEW: BACKSIDE' : '🎥 VIEW: WIDE CHASE';
      };
    }

    document.getElementById('pauseBtn').onclick = () => {
      if (crashed) return;
      paused = true;
      document.getElementById('pauseOverlay').classList.remove('hidden');
    };
    document.getElementById('pauseContinueBtn').onclick = () => {
      document.getElementById('pauseOverlay').classList.add('hidden');
      startResumeCountdown();
    };
    document.getElementById('pauseRestartBtn').onclick = () => { stop(); window.GameUI.start(); };
    document.getElementById('openOptionsBtn').onclick = () => {
      document.getElementById('pauseOverlay').classList.add('hidden');
      document.getElementById('optionsOverlay').classList.remove('hidden');
    };
    document.getElementById('optionsContinueBtn').onclick = () => {
      document.getElementById('optionsOverlay').classList.add('hidden');
      document.getElementById('pauseOverlay').classList.remove('hidden');
    };

    const bindBar = (trackId, fillId, isMusic) => {
      const tr = document.getElementById(trackId);
      const fl = document.getElementById(fillId);
      if (!tr || !fl) return;
      tr.onclick = e => {
        const rect = tr.getBoundingClientRect();
        const sr = window.getStageRect ? window.getStageRect() : { isPortrait: false };
        const ratio = sr.isPortrait
          ? Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
          : Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        fl.style.width = Math.round(ratio * 100) + '%';
        if (isMusic) musicVol = ratio;
        else soundVol = ratio;
      };
    };
    bindBar('soundBarTrack', 'soundBarFill', false);
    bindBar('musicBarTrack', 'musicBarFill', true);

    document.getElementById('continueFreeBtn').onclick = () => {
      document.getElementById('crashOverlay').classList.add('hidden');
      trafficList.forEach(tv => {
        if (tv.z > -45) { tv.z -= 95; tv.mesh.position.z = tv.z; }
      });
      crashed = false;
      kmh = 85;
      startResumeCountdown();
    };
    document.getElementById('crashCancelBtn').onclick = () => {
      document.getElementById('crashOverlay').classList.add('hidden');
      window.GameUI?.onRunEnded?.(score, runCoins, runGems);
      document.getElementById('finalScoreNum').textContent = score;
      document.getElementById('summary').textContent = `YOU EARNED: ${runCoins} 🪙 ${runGems ? '• +' + runGems + ' 💎' : ''}`;
      document.getElementById('end').classList.remove('hidden');
    };

    const exitToMenu = () => {
      stop();
      document.getElementById('game').classList.add('hidden');
      document.getElementById('menu').classList.remove('hidden');
    };
    document.getElementById('home').onclick = exitToMenu;
    document.getElementById('garage').onclick = exitToMenu;
    document.getElementById('retry').onclick = () => { stop(); window.GameUI.start(); };
    document.getElementById('scoresBtn').onclick = () => {
      const best = localStorage.getItem('sthwBest') || score;
      window.showToast?.(`👑 Best Highway Score: ${best} • Current: ${score}`);
    };

    window.onkeydown = e => {
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

    loop();
  }
};
