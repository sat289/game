// Upgraded Realistic Racing Audio Engine: V8/Superbike RPM + Sub-Bass + Gear Shifts + Nitro Jet Whoosh + Tire Screech + Metallic Crash
window.ApexAudio = (function () {
  let soundEnabled = true;
  let audioCtx = null;
  let noiseBuffer = null;
  let engineNodes = null;
  let lastGear = 1;

  function init() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    if (audioCtx && !noiseBuffer) {
      const len = audioCtx.sampleRate * 1.5;
      noiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
  }

  // Unlock browser audio on first tap/click anywhere
  function unlock() {
    init();
  }

  function setEnabled(val) {
    soundEnabled = Boolean(val);
    if (!soundEnabled && engineNodes && audioCtx) {
      const now = audioCtx.currentTime;
      engineNodes.masterGain.gain.setTargetAtTime(0, now, 0.04);
      engineNodes.nitroGain.gain.setTargetAtTime(0, now, 0.04);
      engineNodes.screechGain.gain.setTargetAtTime(0, now, 0.04);
    }
  }

  function isEnabled() {
    return soundEnabled;
  }

  function playTone(freq, dur, type = 'triangle', vol = 0.08) {
    if (!soundEnabled) return;
    init();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function playCoin() {
    playTone(987.77, 0.08, 'sine', 0.11);
    setTimeout(() => playTone(1318.51, 0.16, 'sine', 0.11), 55);
  }

  function playIgnition() {
    if (!soundEnabled) return;
    init();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const sub = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    sub.type = 'triangle';
    osc.frequency.setValueAtTime(52, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.38);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.85);
    sub.frequency.setValueAtTime(26, now);
    sub.frequency.exponentialRampToValueAtTime(120, now + 0.38);
    sub.frequency.exponentialRampToValueAtTime(48, now + 0.85);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(950, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(260, now + 0.85);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.92);

    osc.connect(filter); sub.connect(filter);
    filter.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); sub.start(now);
    osc.stop(now + 0.95); sub.stop(now + 0.95);
  }

  function playReadyChime() {
    if (!soundEnabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => playTone(f, 0.24, 'triangle', 0.09), idx * 65);
    });
  }

  function playCrash() {
    if (!soundEnabled) return;
    init();
    if (!audioCtx || !noiseBuffer) return;
    const now = audioCtx.currentTime;

    // Metallic crunch noise burst
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(420, now);
    bp.frequency.exponentialRampToValueAtTime(90, now + 0.32);
    bp.Q.value = 1.4;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    src.connect(bp); bp.connect(gain); gain.connect(audioCtx.destination);
    src.start(now); src.stop(now + 0.4);

    // Low thud impact
    playTone(72, 0.28, 'sawtooth', 0.18);
  }

  function startEngine(modelType) {
    stopEngine();
    init();
    if (!audioCtx) return;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const sub = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const masterGain = audioCtx.createGain();

    const baseFreq = modelType === 'truck' || modelType === 'heavy_truck' ? 40 : modelType === 'bike' ? 84 : 56;
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    sub.type = 'triangle';
    osc1.frequency.value = baseFreq;
    osc2.frequency.value = baseFreq * 1.5;
    sub.frequency.value = baseFreq * 0.5;

    const osc2Gain = audioCtx.createGain();
    osc2Gain.gain.value = 0.28;

    filter.type = 'lowpass';
    filter.frequency.value = 240;
    filter.Q.value = 2.5;
    masterGain.gain.value = soundEnabled ? 0.05 : 0;

    osc1.connect(filter);
    osc2.connect(osc2Gain); osc2Gain.connect(filter);
    sub.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    // Nitro Jet Whoosh (Filtered White Noise)
    const nitroSrc = audioCtx.createBufferSource();
    nitroSrc.buffer = noiseBuffer;
    nitroSrc.loop = true;
    const nitroFilter = audioCtx.createBiquadFilter();
    nitroFilter.type = 'bandpass';
    nitroFilter.frequency.value = 1100;
    nitroFilter.Q.value = 1.8;
    const nitroGain = audioCtx.createGain();
    nitroGain.gain.value = 0;
    nitroSrc.connect(nitroFilter); nitroFilter.connect(nitroGain); nitroGain.connect(audioCtx.destination);

    // Tire Screech (High-Q Bandpass Noise on braking / hard turns)
    const screechSrc = audioCtx.createBufferSource();
    screechSrc.buffer = noiseBuffer;
    screechSrc.loop = true;
    const screechFilter = audioCtx.createBiquadFilter();
    screechFilter.type = 'bandpass';
    screechFilter.frequency.value = 1850;
    screechFilter.Q.value = 9.0;
    const screechGain = audioCtx.createGain();
    screechGain.gain.value = 0;
    screechSrc.connect(screechFilter); screechFilter.connect(screechGain); screechGain.connect(audioCtx.destination);

    osc1.start(); osc2.start(); sub.start();
    nitroSrc.start(); screechSrc.start();

    lastGear = 1;
    engineNodes = { osc1, osc2, sub, filter, masterGain, nitroSrc, nitroGain, screechSrc, screechGain, baseFreq };
  }

  function updateEngine(speedRatio, nitroOn, braking, steerAmt = 0) {
    if (!engineNodes || !audioCtx) return;
    const now = audioCtx.currentTime;
    if (!soundEnabled) {
      engineNodes.masterGain.gain.setTargetAtTime(0, now, 0.04);
      engineNodes.nitroGain.gain.setTargetAtTime(0, now, 0.04);
      engineNodes.screechGain.gain.setTargetAtTime(0, now, 0.04);
      return;
    }

    // Simulated 5-gear RPM sawtooth curve
    const clamped = Math.max(0, Math.min(1.4, speedRatio));
    const gear = Math.min(5, Math.max(1, Math.floor(clamped * 4.2) + 1));
    if (gear > lastGear && clamped > 0.25) {
      playTone(engineNodes.baseFreq * 3.2, 0.06, 'triangle', 0.03);
    }
    lastGear = gear;

    const gearRpm = (clamped * 4.2) % 1;
    const rpmFactor = 1.0 + (0.45 * gear) + (gearRpm * 0.95) + (nitroOn ? 0.55 : 0);

    engineNodes.osc1.frequency.setTargetAtTime(engineNodes.baseFreq * rpmFactor, now, 0.05);
    engineNodes.osc2.frequency.setTargetAtTime(engineNodes.baseFreq * 1.5 * rpmFactor, now, 0.05);
    engineNodes.sub.frequency.setTargetAtTime(engineNodes.baseFreq * 0.5 * rpmFactor, now, 0.05);
    engineNodes.filter.frequency.setTargetAtTime(240 + clamped * (nitroOn ? 1400 : 820), now, 0.05);
    engineNodes.masterGain.gain.setTargetAtTime(braking ? 0.04 : (0.05 + Math.min(0.065, clamped * 0.055)), now, 0.05);

    // Nitro Jet Whoosh Volume
    engineNodes.nitroGain.gain.setTargetAtTime(nitroOn ? 0.095 : 0, now, 0.06);

    // Tire Screech on hard cornering or braking at speed
    const screeching = clamped > 0.35 && (braking || Math.abs(steerAmt) > 0.72);
    engineNodes.screechGain.gain.setTargetAtTime(screeching ? 0.045 : 0, now, 0.05);
  }

  function stopEngine() {
    if (engineNodes) {
      try {
        engineNodes.osc1.stop(); engineNodes.osc2.stop(); engineNodes.sub.stop();
        engineNodes.nitroSrc.stop(); engineNodes.screechSrc.stop();
      } catch (e) {}
      engineNodes = null;
    }
  }

  return {
    unlock,
    setEnabled,
    isEnabled,
    playTone,
    playCoin,
    playIgnition,
    playReadyChime,
    playCrash,
    startEngine,
    updateEngine,
    stopEngine
  };
})();
