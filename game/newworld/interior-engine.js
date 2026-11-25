import * as THREE from "three";
import { GameAudioFX } from "./audio-fx.js?v=34";
import { buildInteriorRoom, makeInteriorSign } from "./interior-rooms.js?v=34";

/**
 * 🚪 REAL 3D WALKABLE BUILDING INTERIOR ENGINE (v34)
 * - Realistic articulated 3D Avatar (matching city avatar!) with Walk, Run & Jump!
 * - Free Fire style Left Virtual Joystick + Right Jump/Sprint + Drag-to-Look!
 * - Exiting through the sliding door OR tapping Exit returns you RIGHT OUTSIDE THAT EXACT HOUSE in Walk Mode!
 * - Supports Multi-Floor Switcher (for Floor 1 & Floor 2 IMAX Movie Theaters) & Live Playing Animated Movie/TV Screens!
 */

function createRealAvatar(isLion = false) {
  const g = new THREE.Group();
  const skinMat = new THREE.MeshLambertMaterial({ color: isLion ? 0xfef3c7 : 0xfdba74 });
  const jacketMat = new THREE.MeshLambertMaterial({ color: isLion ? 0xf8fafc : 0x1d4ed8 });
  const jeansMat = new THREE.MeshLambertMaterial({ color: isLion ? 0xf1f5f9 : 0x1e293b });
  const hairMat = new THREE.MeshLambertMaterial({ color: 0x18181b });
  const shoeMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
  const goldMat = new THREE.MeshPhongMaterial({ color: 0xf59e0b, specular: 0xfef08a, shininess: 150 });

  const makeLeg = (lx) => {
    const hip = new THREE.Group();
    hip.position.set(lx, 0.88, 0);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.44, 8), jeansMat);
    thigh.position.y = -0.22;
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.09, 0.42, 8), jeansMat);
    shin.position.y = -0.62;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.36), shoeMat);
    shoe.position.set(0, -0.82, 0.06);
    hip.add(thigh, shin, shoe);
    return hip;
  };
  const legL = makeLeg(-0.16);
  const legR = makeLeg(0.16);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.23, 0.68, 10), jacketMat);
  torso.scale.set(1.18, 1.0, 0.78);
  torso.position.y = 1.24;
  const inner = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 0.38), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  inner.position.set(0, 1.28, 0.05);
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 12, Math.PI), goldMat);
  chain.position.set(0, 1.46, 0.19);
  chain.rotation.z = Math.PI;

  const makeArm = (ax) => {
    const sh = new THREE.Group();
    sh.position.set(ax, 1.52, 0);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.48, 8), jacketMat);
    sleeve.position.y = -0.24;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), skinMat);
    hand.position.y = -0.52;
    sh.add(sleeve, hand);
    return sh;
  };
  const armL = makeArm(-0.37);
  const armR = makeArm(0.37);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.16, 8), skinMat);
  neck.position.y = 1.66;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), skinMat);
  head.scale.set(0.95, 1.08, 0.98);
  head.position.y = 1.88;
  const shades = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.11, 0.1), new THREE.MeshLambertMaterial({ color: 0x09090b }));
  shades.position.set(0, 1.9, 0.21);

  if (isLion) {
    const maneMat = new THREE.MeshLambertMaterial({ color: 0xfde68a });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tuft = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), maneMat);
      tuft.position.set(Math.cos(a) * 0.3, 1.9 + Math.sin(a) * 0.3, -0.05);
      g.add(tuft);
    }
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.255, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), hairMat);
    hair.position.set(0, 1.92, -0.02);
    g.add(hair);
  }

  g.add(legL, legR, torso, inner, chain, armL, armR, neck, head, shades);
  g.userData = { legL, legR, armL, armR };
  return g;
}

export function bootInteriorScene(sceneType) {
  const params = new URLSearchParams(window.location.search);
  const owner = params.get("owner") || "SHERU BHAI";
  const bType = params.get("type") || sceneType;
  const returnBase = params.get("return") || "./index.html";
  const exitPlot = params.get("plotId") || "";
  const exitX = params.get("ex") || "";
  const exitZ = params.get("ez") || "";
  const exitYaw = params.get("ey") || "";

  // Build exact outside-the-door return URL so exiting puts you RIGHT OUTSIDE THIS EXACT HOUSE on foot!
  const buildExitUrl = () => {
    const q = new URLSearchParams();
    if (exitPlot) q.set("exitPlot", exitPlot);
    if (exitX) q.set("ex", exitX);
    if (exitZ) q.set("ez", exitZ);
    if (exitYaw) q.set("ey", exitYaw);
    q.set("exitMode", "walk");
    return `${returnBase}?${q.toString()}`;
  };

  let exitingNow = false;
  const doExitToDoor = () => {
    if (exitingNow) return;
    exitingNow = true;
    audio.playDoorOpen();
    setTimeout(() => { window.location.href = buildExitUrl(); }, 180);
  };

  const titleEl = document.getElementById("int-title");
  const subEl = document.getElementById("int-sub");
  const exitBtn = document.getElementById("btn-exit-city");
  if (exitBtn) exitBtn.addEventListener("click", doExitToDoor);

  const audio = new GameAudioFX();
  const container = document.getElementById("int-canvas");
  const w = window.innerWidth || 360;
  const h = window.innerHeight || 640;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(sceneType === "stadium" ? 0x0b1120 : 0x090d16);

  const camera = new THREE.PerspectiveCamera(58, w / h, 0.2, 260);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance", stencil: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1.5, 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xfffbeb, 0x334155, 1.18);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xfff7ed, 1.15);
  dir.position.set(16, 28, 18);
  scene.add(dir);

  const animatedMeshes = [];
  const dynamicScreens = [];
  let roomBounds = { minX: -18, maxX: 18, minZ: -18, maxZ: 18 };
  let doorL = null;
  let doorR = null;
  let baseFloorY = 0;

  const mats = {
    matMarble: new THREE.MeshPhongMaterial({ color: 0xf8fafc, specular: 0xffffff, shininess: 95 }),
    matCream: new THREE.MeshLambertMaterial({ color: 0xfef3c7 }),
    matDark: new THREE.MeshLambertMaterial({ color: 0x1e293b }),
    matBlackMarble: new THREE.MeshPhongMaterial({ color: 0x0b101b, specular: 0xfacc15, shininess: 140 }),
    matGold: new THREE.MeshPhongMaterial({ color: 0xf59e0b, specular: 0xfef08a, shininess: 165 }),
    matDiamond: new THREE.MeshPhongMaterial({ color: 0xe0f2fe, emissive: 0x0284c7, specular: 0xffffff, shininess: 220 }),
    matGlass: new THREE.MeshPhongMaterial({ color: 0x7dd3fc, specular: 0xffffff, shininess: 145, transparent: true, opacity: 0.45 }),
    matPink: new THREE.MeshLambertMaterial({ color: 0xf472b6 }),
    matRoseGold: new THREE.MeshPhongMaterial({ color: 0xfda4af, specular: 0xffffff, shininess: 130 }),
    matCrimson: new THREE.MeshLambertMaterial({ color: 0xb91c1c }),
    matGreen: new THREE.MeshLambertMaterial({ color: 0x15803d }),
    matWood: new THREE.MeshLambertMaterial({ color: 0x78350f }),
    matGlowGold: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
    matGlowCyan: new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
    matGlowPink: new THREE.MeshBasicMaterial({ color: 0xec4899 }),
    matRubber: new THREE.MeshLambertMaterial({ color: 0x111827 }),
    matSteel: new THREE.MeshPhongMaterial({ color: 0xcbd5e1, specular: 0xffffff, shininess: 140 })
  };

  const buildShell = (rw, rh, rd, floorMat, wallMat, ceilingMat, openSky = false) => {
    roomBounds = { minX: -rw / 2 + 1.4, maxX: rw / 2 - 1.4, minZ: -rd / 2 + 1.4, maxZ: rd / 2 - 1.4 };
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), floorMat);
    fl.rotation.x = -Math.PI / 2;
    scene.add(fl);
    if (!openSky) {
      const ceil = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), ceilingMat);
      ceil.rotation.x = Math.PI / 2;
      ceil.position.y = rh;
      scene.add(ceil);
    }
    const wallB = new THREE.Mesh(new THREE.BoxGeometry(rw, rh, 0.5), wallMat);
    wallB.position.set(0, rh / 2, -rd / 2);
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.5, rh, rd), wallMat);
    wallL.position.set(-rw / 2, rh / 2, 0);
    const wallR = wallL.clone();
    wallR.position.x = rw / 2;
    scene.add(wallB, wallL, wallR);

    const sideW = (rw - 5.6) / 2;
    const wfL = new THREE.Mesh(new THREE.BoxGeometry(sideW, rh, 0.5), wallMat);
    wfL.position.set(-(rw / 2 - sideW / 2), rh / 2, rd / 2);
    const wfR = wfL.clone();
    wfR.position.x = rw / 2 - sideW / 2;
    const wfTop = new THREE.Mesh(new THREE.BoxGeometry(5.6, Math.max(1, rh - 4.2), 0.5), wallMat);
    wfTop.position.set(0, 4.2 + Math.max(1, rh - 4.2) / 2, rd / 2);
    doorL = new THREE.Mesh(new THREE.BoxGeometry(2.75, 4.1, 0.18), mats.matGlass);
    doorL.position.set(-1.38, 2.05, rd / 2);
    doorR = new THREE.Mesh(new THREE.BoxGeometry(2.75, 4.1, 0.18), mats.matGlass);
    doorR.position.set(1.38, 2.05, rd / 2);
    const exitBoard = makeInteriorSign("STEP OUTSIDE DOOR ➔", "WALK OUT TO RETURN RIGHT OUTSIDE!", "#0f172a", "#38bdf8", 5.2, 0.9);
    exitBoard.rotation.y = Math.PI;
    exitBoard.position.set(0, 4.85, rd / 2 - 0.35);
    scene.add(wfL, wfR, wfTop, doorL, doorR, exitBoard);
  };

  // Floor Switcher UI for Multi-Floor Theaters!
  const floorBar = document.getElementById("int-floor-bar");
  const pos = new THREE.Vector3(0, 0, 12);
  let yaw = Math.PI;
  let jumpY = 0;
  let jumpVel = 0;

  const floorHelpers = {
    enableFloors(floors) {
      if (!floorBar) return;
      floorBar.innerHTML = "";
      floorBar.classList.remove("hidden");
      floors.forEach((fl, i) => {
        const b = document.createElement("button");
        b.className = "drive-pill" + (i === 0 ? " active" : "");
        b.textContent = fl.label;
        b.addEventListener("click", () => {
          baseFloorY = fl.y;
          pos.set(0, baseFloorY, fl.z);
          yaw = Math.PI;
          audio.playDoorOpen();
          floorBar.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
        });
        floorBar.appendChild(b);
      });
    }
  };

  const info = buildInteriorRoom(scene, sceneType, bType, owner, mats, buildShell, animatedMeshes, dynamicScreens, floorHelpers);
  if (titleEl && info.title) titleEl.textContent = info.title;
  if (subEl && info.sub) subEl.textContent = info.sub;

  const avatar = createRealAvatar(sceneType === "mansion");
  pos.set(0, baseFloorY, roomBounds.maxZ - 3.6);
  avatar.position.copy(pos);
  avatar.rotation.y = yaw;
  scene.add(avatar);

  // Free Fire Left Virtual Thumbstick + Right Jump / Sprint / Walk Controls!
  const keys = { forward: false, backward: false, left: false, right: false, sprint: false };
  let joyX = 0, joyY = 0;

  const joyBase = document.getElementById("int-joy-base");
  const joyKnob = document.getElementById("int-joy-knob");
  if (joyBase && joyKnob) {
    let joyPid = null;
    const maxR = 40;
    const updateJoy = (cx, cy) => {
      const rect = joyBase.getBoundingClientRect();
      const dx = cx - (rect.left + rect.width / 2);
      const dy = cy - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, maxR);
      const ang = Math.atan2(dy, dx);
      const kx = Math.cos(ang) * clamped;
      const ky = Math.sin(ang) * clamped;
      joyKnob.style.transform = `translate(${kx}px, ${ky}px)`;
      joyX = kx / maxR;
      joyY = -ky / maxR;
    };
    joyBase.addEventListener("pointerdown", (e) => { e.preventDefault(); joyPid = e.pointerId; joyBase.setPointerCapture(e.pointerId); updateJoy(e.clientX, e.clientY); });
    joyBase.addEventListener("pointermove", (e) => { if (e.pointerId === joyPid) updateJoy(e.clientX, e.clientY); });
    const resetJoy = (e) => {
      if (e.pointerId !== joyPid) return;
      joyPid = null;
      joyX = 0; joyY = 0;
      joyKnob.style.transform = "translate(0px, 0px)";
    };
    joyBase.addEventListener("pointerup", resetJoy);
    joyBase.addEventListener("pointercancel", resetJoy);
  }

  const doJump = () => {
    if (jumpY <= 0.05) { jumpVel = 8.8; audio.playStep(); }
  };
  document.getElementById("int-btn-jump")?.addEventListener("pointerdown", (e) => { e.preventDefault(); doJump(); });
  const sprintBtn = document.getElementById("int-btn-sprint");
  if (sprintBtn) {
    sprintBtn.addEventListener("pointerdown", (e) => { e.preventDefault(); keys.sprint = true; sprintBtn.classList.add("pressed"); });
    const upSp = () => { keys.sprint = false; sprintBtn.classList.remove("pressed"); };
    sprintBtn.addEventListener("pointerup", upSp);
    sprintBtn.addEventListener("pointerleave", upSp);
    sprintBtn.addEventListener("pointercancel", upSp);
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.forward = true;
    if (e.code === "ArrowDown" || e.code === "KeyS") keys.backward = true;
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.sprint = true;
    if (e.code === "Space") doJump();
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.forward = false;
    if (e.code === "ArrowDown" || e.code === "KeyS") keys.backward = false;
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.sprint = false;
  });

  // Right-side screen drag to look around smoothly!
  let dragX = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { dragX = e.clientX; });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (dragX === null) return;
    const dx = e.clientX - dragX;
    dragX = e.clientX;
    yaw -= dx * 0.0085;
  });
  renderer.domElement.addEventListener("pointerup", () => { dragX = null; });

  window.addEventListener("resize", () => {
    const nw = window.innerWidth, nh = window.innerHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh);
  });

  const clock = new THREE.Clock();
  let elapsed = 0;
  let walkPhase = 0;
  let screenTick = 0;

  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    const steer = (keys.left ? 1 : 0) - (keys.right ? 1 : 0) - joyX;
    yaw += steer * 2.45 * dt;
    const moveDir = THREE.MathUtils.clamp((keys.forward ? 1 : 0) - (keys.backward ? 1 : 0) + joyY, -1, 1);

    if (Math.abs(moveDir) > 0.08) {
      const spd = (keys.sprint ? 13.5 : 8.8) * moveDir;
      pos.x = THREE.MathUtils.clamp(pos.x + Math.sin(yaw) * spd * dt, roomBounds.minX, roomBounds.maxX);
      pos.z = THREE.MathUtils.clamp(pos.z + Math.cos(yaw) * spd * dt, roomBounds.minZ, roomBounds.maxZ);
      walkPhase += dt * (keys.sprint ? 14 : 11);
      const sw = Math.sin(walkPhase) * 0.58;
      avatar.userData.legL.rotation.x = sw;
      avatar.userData.legR.rotation.x = -sw;
      avatar.userData.armL.rotation.x = -sw * 0.85;
      avatar.userData.armR.rotation.x = sw * 0.85;
      audio.playStep();
    } else {
      avatar.userData.legL.rotation.x *= 0.8;
      avatar.userData.legR.rotation.x *= 0.8;
      avatar.userData.armL.rotation.x *= 0.8;
      avatar.userData.armR.rotation.x *= 0.8;
    }

    if (jumpY > 0 || jumpVel > 0) {
      jumpY += jumpVel * dt;
      jumpVel -= 23.0 * dt;
      if (jumpY <= 0) { jumpY = 0; jumpVel = 0; }
    }

    avatar.position.set(pos.x, baseFloorY + jumpY, pos.z);
    avatar.rotation.y = yaw;

    // Auto-slide Exit Doors open & step right outside if player walks straight out the open door!
    const nearDoor = baseFloorY < 1 && pos.z > roomBounds.maxZ - 4.8 && Math.abs(pos.x) < 4.5;
    if (doorL && doorR) {
      doorL.position.x = THREE.MathUtils.lerp(doorL.position.x, nearDoor ? -3.4 : -1.38, 0.14);
      doorR.position.x = THREE.MathUtils.lerp(doorR.position.x, nearDoor ? 3.4 : 1.38, 0.14);
    }
    if (baseFloorY < 1 && pos.z >= roomBounds.maxZ - 0.2 && Math.abs(pos.x) < 2.6 && Math.cos(yaw) > 0.35 && moveDir > 0.2) {
      doExitToDoor();
    }

    for (const am of animatedMeshes) {
      if (am.rotY) am.mesh.rotation.y += dt * am.rotY;
      if (am.swayZ) am.mesh.rotation.z = Math.sin(elapsed * 2.4) * am.swayZ;
    }

    // Update Live Playing Movies & Golden Diamond 4K TV at 15fps (silky smooth, zero lag on low RAM!)
    screenTick += dt;
    if (screenTick >= 0.066 && dynamicScreens.length > 0) {
      screenTick = 0;
      for (const ds of dynamicScreens) ds.update(elapsed);
    }

    const camTarget = new THREE.Vector3(pos.x - Math.sin(yaw) * 6.4, baseFloorY + 3.5 + jumpY * 0.4, pos.z - Math.cos(yaw) * 6.4);
    camTarget.x = THREE.MathUtils.clamp(camTarget.x, roomBounds.minX - 0.5, roomBounds.maxX + 0.5);
    camTarget.z = THREE.MathUtils.clamp(camTarget.z, roomBounds.minZ - 0.5, roomBounds.maxZ + 0.5);
    camera.position.lerp(camTarget, 0.16);
    camera.lookAt(pos.x + Math.sin(yaw) * 3.5, baseFloorY + 2.0 + jumpY * 0.3, pos.z + Math.cos(yaw) * 3.5);

    renderer.render(scene, camera);
  }
  loop();
}
