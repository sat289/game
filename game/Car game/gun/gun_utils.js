// gun/gun_utils.js
// Shared Zero-Lag Cached Gun Materials & Procedural Realistic Gunshot / Rope SFX Engine
window.ApexGunUtils = (function () {
  const matCache = new Map();
  let sfxCtx = null;
  let noiseBuf = null;

  function getMat(key, builder) {
    if (matCache.has(key)) return matCache.get(key);
    const m = builder();
    matCache.set(key, m);
    return m;
  }

  function mats() {
    return {
      gunmetal: getMat('gunmetal', () => new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.82, roughness: 0.28 })),
      darkSteel: getMat('darkSteel', () => new THREE.MeshStandardMaterial({ color: 0x16191f, metalness: 0.85, roughness: 0.24 })),
      polymer: getMat('polymer', () => new THREE.MeshStandardMaterial({ color: 0x1c1f24, metalness: 0.15, roughness: 0.72 })),
      walnut: getMat('walnut', () => new THREE.MeshStandardMaterial({ color: 0x7c431f, metalness: 0.08, roughness: 0.62 })),
      olive: getMat('olive', () => new THREE.MeshStandardMaterial({ color: 0x4b5d3b, metalness: 0.22, roughness: 0.58 })),
      chrome: getMat('chrome', () => new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.92, roughness: 0.15 })),
      brass: getMat('brass', () => new THREE.MeshStandardMaterial({ color: 0xd9a13b, metalness: 0.85, roughness: 0.25 })),
      lens: getMat('lens', () => new THREE.MeshBasicMaterial({ color: 0x38bdf8 })),
      sightDot: getMat('sightDot', () => new THREE.MeshBasicMaterial({ color: 0x4ade80 })),
      flashCore: getMat('flashCore', () => new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.95 })),
      flashOuter: getMat('flashOuter', () => new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.82 }))
    };
  }

  function createMuzzleFlash(scale = 1.0) {
    const M = mats();
    const g = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.085 * scale, 0.26 * scale, 6), M.flashOuter);
    outer.rotation.x = Math.PI / 2;
    outer.position.z = 0.13 * scale;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.055 * scale, 6, 6), M.flashCore);
    core.position.z = 0.04 * scale;
    g.add(outer, core);
    g.visible = false;
    return g;
  }

  function ensureAudio() {
    try {
      if (!sfxCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) sfxCtx = new AC();
      }
      if (sfxCtx && sfxCtx.state === 'suspended') sfxCtx.resume().catch(() => {});
      if (sfxCtx && !noiseBuf) {
        const len = Math.floor(sfxCtx.sampleRate * 0.6);
        noiseBuf = sfxCtx.createBuffer(1, len, sfxCtx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
    } catch (e) {}
  }

  // Distinct Realistic WebAudio Weapon SFX (Pistol / AK-47 / M870 Shotgun / AWM Sniper / MP5 SMG / Rope Zip)
  function playGunshot(gunId) {
    ensureAudio();
    if (!sfxCtx || !noiseBuf) return;
    const t = sfxCtx.currentTime;
    const cfg = {
      pistol:  { dur: 0.14, fStart: 1450, fEnd: 240, punch: 155, vol: 0.26 },
      ak47:    { dur: 0.17, fStart: 1200, fEnd: 180, punch: 130, vol: 0.30 },
      shotgun: { dur: 0.30, fStart: 780,  fEnd: 95,  punch: 82,  vol: 0.42 },
      sniper:  { dur: 0.36, fStart: 1950, fEnd: 140, punch: 105, vol: 0.44 },
      smg:     { dur: 0.09, fStart: 2200, fEnd: 460, punch: 195, vol: 0.20 }
    }[gunId] || { dur: 0.15, fStart: 1300, fEnd: 220, punch: 140, vol: 0.26 };

    try {
      // Filtered noise crack
      const src = sfxCtx.createBufferSource();
      src.buffer = noiseBuf;
      const flt = sfxCtx.createBiquadFilter();
      flt.type = 'bandpass';
      flt.frequency.setValueAtTime(cfg.fStart, t);
      flt.frequency.exponentialRampToValueAtTime(cfg.fEnd, t + cfg.dur);
      flt.Q.value = gunId === 'smg' ? 2.2 : 0.9;
      const gn = sfxCtx.createGain();
      gn.gain.setValueAtTime(cfg.vol, t);
      gn.gain.exponentialRampToValueAtTime(0.001, t + cfg.dur);
      src.connect(flt); flt.connect(gn); gn.connect(sfxCtx.destination);
      src.start(t); src.stop(t + cfg.dur + 0.02);

      // Low-end muzzle thump
      const osc = sfxCtx.createOscillator();
      const og = sfxCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(cfg.punch, t);
      osc.frequency.exponentialRampToValueAtTime(34, t + Math.min(0.16, cfg.dur));
      og.gain.setValueAtTime(cfg.vol * 0.95, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + Math.min(0.18, cfg.dur));
      osc.connect(og); og.connect(sfxCtx.destination);
      osc.start(t); osc.stop(t + Math.min(0.2, cfg.dur));
    } catch (e) {}
  }

  function playReload() {
    ensureAudio();
    if (!sfxCtx) return;
    const t = sfxCtx.currentTime;
    [0, 0.18, 0.42].forEach((off, i) => {
      try {
        const osc = sfxCtx.createOscillator();
        const g = sfxCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(i === 2 ? 680 : 390 + i * 90, t + off);
        g.gain.setValueAtTime(0.07, t + off);
        g.gain.exponentialRampToValueAtTime(0.001, t + off + 0.06);
        osc.connect(g); g.connect(sfxCtx.destination);
        osc.start(t + off); osc.stop(t + off + 0.07);
      } catch (e) {}
    });
  }

  function playRopeShoot() {
    ensureAudio();
    if (!sfxCtx) return;
    const t = sfxCtx.currentTime;
    try {
      // Mechanical grapple zip-whir!
      const osc = sfxCtx.createOscillator();
      const g = sfxCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(1180, t + 0.14);
      osc.frequency.exponentialRampToValueAtTime(520, t + 0.24);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.connect(g); g.connect(sfxCtx.destination);
      osc.start(t); osc.stop(t + 0.28);
    } catch (e) {}
  }

  function playSuperJump() {
    ensureAudio();
    if (!sfxCtx) return;
    const t = sfxCtx.currentTime;
    try {
      const osc = sfxCtx.createOscillator();
      const g = sfxCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(640, t + 0.22);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(g); g.connect(sfxCtx.destination);
      osc.start(t); osc.stop(t + 0.25);
    } catch (e) {}
  }

  return { mats, createMuzzleFlash, playGunshot, playReload, playRopeShoot, playSuperJump };
})();
