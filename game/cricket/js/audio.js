/* =========================================================
   Zero-Dependency Broadcast Sound Engine (Web Audio API)
   ========================================================= */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _noiseBuffer(durationSec) {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * durationSec);
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playCountdown(isGo = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.25 : 0.14));
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playSwingWhoosh() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.16);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.14);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(now);
  }

  playBatHit(runs) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Crisp willow wood knock
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const baseFreq = runs >= 6 ? 290 : runs >= 4 ? 250 : 210;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.09);
    gain.gain.setValueAtTime(runs >= 4 ? 0.55 : 0.36, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);

    // High-frequency crack transient
    const crack = this.ctx.createBufferSource();
    crack.buffer = this._noiseBuffer(0.05);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(1800, now);
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(runs >= 4 ? 0.42 : 0.22, now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    crack.connect(hp).connect(cg).connect(this.ctx.destination);
    crack.start(now);

    if (runs >= 4) {
      this.playCrowdCheer(runs >= 6 ? 1.45 : 0.95);
    }
  }

  playCrowdCheer(duration = 1.2) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(duration);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(950, now);
    bp.Q.setValueAtTime(0.8, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(bp).connect(gain).connect(this.ctx.destination);
    src.start(now);

    // Stadium horn accent for big sixes/fours
    const notes = duration > 1.2 ? [523.25, 659.25, 783.99] : [440, 554.37];
    notes.forEach((freq, idx) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq, now + idx * 0.06);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1500, now);
      g.gain.setValueAtTime(0.06, now + idx * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
      o.connect(lp).connect(g).connect(this.ctx.destination);
      o.start(now + idx * 0.06);
      o.stop(now + idx * 0.06 + 0.36);
    });
  }

  playBowled() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Wooden stumps clatter (3 staggered pops)
    [0, 0.045, 0.095].forEach((offset, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(340 - i * 45, now + offset);
      osc.frequency.exponentialRampToValueAtTime(90, now + offset + 0.08);
      g.gain.setValueAtTime(0.25, now + offset);
      g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });

    // Noise clatter
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.22);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1400, now);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.32, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    src.connect(bp).connect(ng).connect(this.ctx.destination);
    src.start(now);
  }

  playMatchResult(won) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const melody = won
      ? [523.25, 659.25, 783.99, 1046.5]
      : [392.0, 349.23, 311.13, 261.63];

    melody.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = won ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.14);
      gain.gain.setValueAtTime(0.16, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.42);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.44);
    });
    if (won) this.playCrowdCheer(1.8);
  }
}

window.soundEngine = new SoundEngine();
