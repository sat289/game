// Realistic Automotive Audio Engine + Driving Synthwave Background Music Loop
window.ApexAudio = (function () {
  let soundEnabled = true;
  let audioCtx = null;
  let noiseBuffer = null;
  let engineNodes = null;
  let bgmTimerId = null;
  let bgmStep = 0;
  let lastGear = 1;

  function makeDistortionCurve(amount) {
    const k = amount, n = 2048, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  function init() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    if (audioCtx && !noiseBuffer) {
      const len = audioCtx.sampleRate * 1.5;
      noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
  }

  function unlock() { init(); }
  function setEnabled(val) {
    soundEnabled = Boolean(val);
    if (!soundEnabled) {
      stopMusic();
      if (engineNodes && audioCtx) {
        const now = audioCtx.currentTime;
        engineNodes.masterGain.gain.setTargetAtTime(0, now, 0.04);
        engineNodes.turboGain.gain.setTargetAtTime(0, now, 0.04);
        engineNodes.screechGain.gain.setTargetAtTime(0, now, 0.04);
      }
    }
  }
  function isEnabled() { return soundEnabled; }

  function playTone(freq, dur, type = 'sine', vol = 0.08) {
    if (!soundEnabled) return;
    init();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + dur + 0.02);
  }

  // Ultra-Smooth Deep Chill Cinematic Driving Groove (Warm Deep Sub + Soft Kick + Muted Ambient Chords — Zero Harsh Beeps!)
  const chillChords = [
    [146.83, 220.00, 261.63, 329.63], // Dm9 low warm voicing
    [116.54, 174.61, 220.00, 293.66], // Bbmaj9
    [130.81, 196.00, 246.94, 329.63], // Cmaj9
    [110.00, 164.81, 196.00, 261.63]  // Am7
  ];
  const deepBass = [73.42, 58.27, 65.41, 55.00];

  function playKick(now) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(105, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.14);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + 0.24);
  }

  function playSoftRim(now) {
    if (!noiseBuffer) return;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 2.5;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.032, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    src.connect(bp); bp.connect(gain); gain.connect(audioCtx.destination);
    src.start(now); src.stop(now + 0.07);
  }

  function playWarmAtmosphere(now, notes) {
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(420, now);
    lp.frequency.linearRampToValueAtTime(640, now + 1.1);
    lp.frequency.linearRampToValueAtTime(360, now + 2.2);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.032, now + 0.35);
    gain.gain.setValueAtTime(0.028, now + 1.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.3);
    lp.connect(gain); gain.connect(audioCtx.destination);
    notes.forEach((f) => {
      const o = audioCtx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, now);
      o.connect(lp);
      o.start(now); o.stop(now + 2.35);
    });
  }

  function startMusic() {
    stopMusic();
    if (!soundEnabled) return;
    init();
    bgmStep = 0;
    bgmTimerId = setInterval(() => {
      if (!soundEnabled || !audioCtx || audioCtx.state !== 'running') return;
      const now = audioCtx.currentTime;
      const step = bgmStep % 16;
      const bar = Math.floor(bgmStep / 16) % 4;

      if (step === 0) playWarmAtmosphere(now, chillChords[bar]);
      if (step === 0 || step === 6 || step === 10) playKick(now);
      if (step === 4 || step === 12) playSoftRim(now);

      if (step === 0 || step === 8) {
        const bOsc = audioCtx.createOscillator();
        const bGain = audioCtx.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(deepBass[bar], now);
        bGain.gain.setValueAtTime(0.085, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
        bOsc.connect(bGain); bGain.connect(audioCtx.destination);
        bOsc.start(now); bOsc.stop(now + 0.55);
      }

      bgmStep++;
    }, 148); // Relaxed ~101 BPM smooth cinematic night-drive groove
  }

  function stopMusic() {
    if (bgmTimerId) { clearInterval(bgmTimerId); bgmTimerId = null; }
  }

  function playCoin() {
    playTone(1046.5, 0.07, 'sine', 0.11);
    setTimeout(() => playTone(1567.98, 0.16, 'sine', 0.10), 50);
  }

  function playIgnition() {
    if (!soundEnabled) return;
    init();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const sub = audioCtx.createOscillator();
    const shaper = audioCtx.createWaveShaper();
    shaper.curve = makeDistortionCurve(18);
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; sub.type = 'sine';
    osc.frequency.setValueAtTime(42, now);
    osc.frequency.exponentialRampToValueAtTime(168, now + 0.28);
    osc.frequency.exponentialRampToValueAtTime(64, now + 0.82);
    sub.frequency.setValueAtTime(24, now);
    sub.frequency.exponentialRampToValueAtTime(84, now + 0.28);
    sub.frequency.exponentialRampToValueAtTime(36, now + 0.82);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.frequency.exponentialRampToValueAtTime(580, now + 0.25);
    filter.frequency.exponentialRampToValueAtTime(190, now + 0.82);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.88);
    osc.connect(shaper); shaper.connect(filter);
    sub.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); sub.start(now);
    osc.stop(now + 0.9); sub.stop(now + 0.9);
  }

  function playReadyChime() {
    if (!soundEnabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => playTone(f, 0.22, 'sine', 0.08), idx * 60);
    });
  }



  function playSiren() {
    if (!soundEnabled) return;
    init();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    // Realistic Fire Engine / Ambulance Wee-Woo Emergency Siren (2 cycles)
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.linearRampToValueAtTime(980, now + 0.45);
    osc.frequency.linearRampToValueAtTime(640, now + 0.90);
    osc.frequency.linearRampToValueAtTime(980, now + 1.35);
    osc.frequency.linearRampToValueAtTime(620, now + 1.80);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.085, now + 0.08);
    gain.gain.setValueAtTime(0.08, now + 1.55);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.88);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + 1.92);
  }

  // 100% RELIABLE LOUD 2000Hz-PEAK "TEERAN! TEERAN! TEERAN!" AIR-HORN (Direct Synchronous Web Audio — Works in ALL Mobile & Sandboxed Browsers!)
  let hornStopTimer = null;
  function stopHorn() {
    clearTimeout(hornStopTimer);
  }

  function startHorn() {
    if (!soundEnabled) return;
    init();
    if (!audioCtx) return;
    const fireTeran = () => {
      const now = audioCtx.currentTime;
      const bursts = [[0.0, 0.19], [0.24, 0.43], [0.48, 0.76]];
      const master = audioCtx.createGain();
      master.gain.value = 0.52; // LOUD & CLEAR over engine & music!
      const lp = audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2600;
      const shaper = audioCtx.createWaveShaper();
      shaper.curve = makeDistortionCurve(16);
      shaper.connect(lp); lp.connect(master); master.connect(audioCtx.destination);

      bursts.forEach(([s, e]) => {
        [500, 665, 1000, 2000].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = idx < 2 ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + s);
          osc.frequency.linearRampToValueAtTime(freq * 1.03, now + (s + e) * 0.5);
          osc.frequency.linearRampToValueAtTime(freq, now + e);
          g.gain.setValueAtTime(0.001, now + s);
          g.gain.linearRampToValueAtTime(idx === 3 ? 0.28 : 0.24, now + s + 0.015);
          g.gain.setValueAtTime(idx === 3 ? 0.25 : 0.22, now + e - 0.025);
          g.gain.exponentialRampToValueAtTime(0.001, now + e);
          osc.connect(g); g.connect(shaper);
          osc.start(now + s);
          osc.stop(now + e + 0.02);
        });
      });
    };
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(fireTeran).catch(fireTeran);
    } else {
      fireTeran();
    }
  }

  function playHorn() {
    startHorn();
  }

  function playTurboPshh() {
    if (!soundEnabled) return;
    init();
    if (!audioCtx || !noiseBuffer) return;
    const now = audioCtx.currentTime;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(3200, now);
    bp.frequency.exponentialRampToValueAtTime(1100, now + 0.24);
    bp.Q.value = 2.4;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    src.connect(bp); bp.connect(gain); gain.connect(audioCtx.destination);
    src.start(now); src.stop(now + 0.28);
  }

  function playCrash() {
    if (!soundEnabled) return;
    init();
    if (!audioCtx || !noiseBuffer) return;
    const now = audioCtx.currentTime;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(640, now);
    lp.frequency.exponentialRampToValueAtTime(75, now + 0.38);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
    src.connect(lp); lp.connect(gain); gain.connect(audioCtx.destination);
    src.start(now); src.stop(now + 0.45);
    playTone(54, 0.3, 'triangle', 0.24);
  }

  function startEngine(modelType) {
    stopEngine();
    init();
    if (!audioCtx) return;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const sub = audioCtx.createOscillator();
    const shaper = audioCtx.createWaveShaper();
    shaper.curve = makeDistortionCurve(12);
    const filter = audioCtx.createBiquadFilter();
    const masterGain = audioCtx.createGain();

    const baseFreq = modelType === 'truck' || modelType === 'heavy_truck' ? 34 : modelType === 'bike' ? 74 : 48;
    osc1.type = 'sawtooth'; osc2.type = 'triangle'; sub.type = 'sine';
    osc1.frequency.value = baseFreq; osc2.frequency.value = baseFreq * 1.5; sub.frequency.value = baseFreq * 0.5;

    const g1 = audioCtx.createGain(); g1.gain.value = 0.36;
    const g2 = audioCtx.createGain(); g2.gain.value = 0.3;
    const gSub = audioCtx.createGain(); gSub.gain.value = 0.6;
    filter.type = 'lowpass'; filter.frequency.value = 170; filter.Q.value = 1.4;
    masterGain.gain.value = soundEnabled ? 0.055 : 0;

    osc1.connect(g1); g1.connect(shaper);
    osc2.connect(g2); g2.connect(shaper);
    shaper.connect(filter);
    sub.connect(gSub); gSub.connect(filter);
    filter.connect(masterGain); masterGain.connect(audioCtx.destination);

    const turboOsc = audioCtx.createOscillator();
    turboOsc.type = 'sine'; turboOsc.frequency.value = 640;
    const turboSrc = audioCtx.createBufferSource();
    turboSrc.buffer = noiseBuffer; turboSrc.loop = true;
    const turboFilter = audioCtx.createBiquadFilter();
    turboFilter.type = 'bandpass'; turboFilter.frequency.value = 1350; turboFilter.Q.value = 2.0;
    const turboGain = audioCtx.createGain(); turboGain.gain.value = 0;
    const tOscG = audioCtx.createGain(); tOscG.gain.value = 0.12;
    turboOsc.connect(tOscG); tOscG.connect(turboGain);
    turboSrc.connect(turboFilter); turboFilter.connect(turboGain);
    turboGain.connect(audioCtx.destination);

    const screechSrc = audioCtx.createBufferSource();
    screechSrc.buffer = noiseBuffer; screechSrc.loop = true;
    const screechFilter = audioCtx.createBiquadFilter();
    screechFilter.type = 'bandpass'; screechFilter.frequency.value = 1600; screechFilter.Q.value = 11.0;
    const screechGain = audioCtx.createGain(); screechGain.gain.value = 0;
    screechSrc.connect(screechFilter); screechFilter.connect(screechGain); screechGain.connect(audioCtx.destination);

    osc1.start(); osc2.start(); sub.start();
    turboOsc.start(); turboSrc.start(); screechSrc.start();

    lastGear = 1;
    engineNodes = { osc1, osc2, sub, filter, masterGain, turboOsc, turboSrc, turboGain, screechSrc, screechGain, baseFreq };
    startMusic();
  }

  function updateEngine(speedRatio, nitroOn, braking, steerAmt = 0) {
    if (!engineNodes || !audioCtx) return;
    const now = audioCtx.currentTime;
    if (!soundEnabled) {
      engineNodes.masterGain.gain.setTargetAtTime(0, now, 0.04);
      engineNodes.turboGain.gain.setTargetAtTime(0, now, 0.04);
      engineNodes.screechGain.gain.setTargetAtTime(0, now, 0.04);
      return;
    }
    const clamped = Math.max(0, Math.min(1.4, speedRatio));
    const gear = Math.min(6, Math.max(1, Math.floor(clamped * 4.5) + 1));
    if (gear > lastGear && clamped > 0.25) {
      playTone(360, 0.05, 'sine', 0.025);
      setTimeout(() => playTone(280, 0.05, 'sine', 0.02), 45);
    }
    lastGear = gear;
    const gearRpm = (clamped * 4.5) % 1;
    const rpmFactor = 1.0 + (0.35 * gear) + (gearRpm * 0.82) + (nitroOn ? 0.42 : 0);
    engineNodes.osc1.frequency.setTargetAtTime(engineNodes.baseFreq * rpmFactor, now, 0.06);
    engineNodes.osc2.frequency.setTargetAtTime(engineNodes.baseFreq * 1.5 * rpmFactor, now, 0.06);
    engineNodes.sub.frequency.setTargetAtTime(engineNodes.baseFreq * 0.5 * rpmFactor, now, 0.06);
    engineNodes.filter.frequency.setTargetAtTime(175 + clamped * (nitroOn ? 980 : 540), now, 0.06);
    engineNodes.masterGain.gain.setTargetAtTime(braking ? 0.045 : (0.055 + Math.min(0.055, clamped * 0.05)), now, 0.06);
    engineNodes.turboOsc.frequency.setTargetAtTime(580 + clamped * 740 + (nitroOn ? 420 : 0), now, 0.08);
    engineNodes.turboGain.gain.setTargetAtTime(nitroOn ? 0.085 : (clamped > 0.7 ? 0.02 : 0), now, 0.07);
    const screeching = clamped > 0.38 && (braking || Math.abs(steerAmt) > 0.72);
    engineNodes.screechGain.gain.setTargetAtTime(screeching ? 0.036 : 0, now, 0.06);
  }

  function stopEngine() {
    stopMusic();
    if (engineNodes) {
      try {
        engineNodes.osc1.stop(); engineNodes.osc2.stop(); engineNodes.sub.stop();
        engineNodes.turboOsc.stop(); engineNodes.turboSrc.stop(); engineNodes.screechSrc.stop();
      } catch (e) {}
      engineNodes = null;
    }
  }

  return {
    unlock, setEnabled, isEnabled,
    playTone, playCoin, playIgnition, playReadyChime, playCrash,
    startEngine, updateEngine, stopEngine, startMusic, stopMusic
  };
})();
