// Web Audio API Synthesized Racing Engine, Nitro, Crash & UI Audio
window.ApexAudio = (function () {
  let soundEnabled = true;
  let audioCtx = null;
  let engineNodes = null;

  function init() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function setEnabled(val) {
    soundEnabled = Boolean(val);
    if (!soundEnabled && engineNodes && audioCtx) {
      engineNodes.masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
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
    gain.gain.linearRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function playIgnition() {
    if (!soundEnabled) return;
    init();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.45);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.9);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.13, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 1.0);
  }

  function playReadyChime() {
    if (!soundEnabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => playTone(f, 0.24, 'triangle', 0.08), idx * 65);
    });
  }

  function playCrash() {
    playTone(95, 0.28, 'sawtooth', 0.15);
    setTimeout(() => playTone(60, 0.22, 'square', 0.12), 40);
  }

  function startEngine(modelType) {
    stopEngine();
    if (!soundEnabled) return;
    init();
    if (!audioCtx) return;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const masterGain = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    const baseFreq = modelType === 'truck' || modelType === 'heavy_truck' ? 42 : modelType === 'bike' ? 78 : 55;
    osc1.frequency.value = baseFreq;
    osc2.frequency.value = baseFreq * 0.5;
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    masterGain.gain.value = 0.045;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(audioCtx.destination);
    osc1.start();
    osc2.start();
    engineNodes = { osc1, osc2, filter, masterGain, baseFreq };
  }

  function updateEngine(speedRatio, nitroOn, braking) {
    if (!engineNodes || !audioCtx) return;
    if (!soundEnabled) {
      engineNodes.masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
      return;
    }
    const now = audioCtx.currentTime;
    const rpmBoost = 1 + speedRatio * (nitroOn ? 2.4 : 1.75);
    engineNodes.osc1.frequency.setTargetAtTime(engineNodes.baseFreq * rpmBoost, now, 0.06);
    engineNodes.osc2.frequency.setTargetAtTime(engineNodes.baseFreq * 0.5 * rpmBoost, now, 0.06);
    engineNodes.filter.frequency.setTargetAtTime(220 + speedRatio * (nitroOn ? 1100 : 650), now, 0.06);
    engineNodes.masterGain.gain.setTargetAtTime(braking ? 0.035 : (0.045 + speedRatio * 0.045), now, 0.06);
  }

  function stopEngine() {
    if (engineNodes) {
      try { engineNodes.osc1.stop(); engineNodes.osc2.stop(); } catch (e) {}
      engineNodes = null;
    }
  }

  return {
    setEnabled,
    isEnabled,
    playTone,
    playIgnition,
    playReadyChime,
    playCrash,
    startEngine,
    updateEngine,
    stopEngine
  };
})();
