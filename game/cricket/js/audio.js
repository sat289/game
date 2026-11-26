/* =========================================================
   Broadcast Cricket Sound Engine (Web Audio API)
   Includes Live Stadium Ambience, Willow Crack, Pitch Bounce & Crowd Roar
   ========================================================= */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ambienceNode = null;
    this.ambienceGain = null;
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
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setTargetAtTime(this.muted ? 0 : 0.045, this.ctx.currentTime, 0.15);
    }
    return this.muted;
  }

  _noiseBuffer(sec) {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * sec);
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      // Soft pink-ish stadium noise
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + white * 0.18) * 1.4));
    }
    return buf;
  }

  startAmbience() {
    if (this.ambienceNode) return;
    this.init();
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(3.0);
    src.loop = true;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 520;
    bp.Q.value = 0.65;
    const gain = this.ctx.createGain();
    gain.gain.value = this.muted ? 0 : 0.045;
    src.connect(bp).connect(gain).connect(this.ctx.destination);
    src.start();
    this.ambienceNode = src;
    this.ambienceGain = gain;
  }

  stopAmbience() {
    if (this.ambienceNode) {
      try { this.ambienceNode.stop(); } catch {}
      this.ambienceNode = null;
      this.ambienceGain = null;
    }
  }

  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.055);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playCountdown(isGo = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.24 : 0.13));
    osc.connect(g).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playPitchBounce() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.05);
    g.gain.setValueAtTime(0.24, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playSwingWhoosh() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.16);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(380, now);
    bp.frequency.exponentialRampToValueAtTime(1500, now + 0.14);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    src.connect(bp).connect(g).connect(this.ctx.destination);
    src.start(now);
  }

  playBatHit(runs) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Authentic English Willow Knock
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    const f0 = runs >= 6 ? 330 : runs >= 4 ? 280 : 225;
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(72, now + 0.095);
    g.gain.setValueAtTime(runs >= 4 ? 0.62 : 0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);

    // Crisp leather-on-wood high snap
    const snap = this.ctx.createBufferSource();
    snap.buffer = this._noiseBuffer(0.045);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(2100, now);
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(runs >= 4 ? 0.45 : 0.22, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    snap.connect(hp).connect(sg).connect(this.ctx.destination);
    snap.start(now);
  }

  playZoneScore(runs) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (runs >= 4) {
      this.playCrowdCheer(runs >= 6 ? 1.85 : 1.2);
    } else {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480 + runs * 80, now);
      g.gain.setValueAtTime(0.14, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    }
  }

  playCrowdCheer(duration = 1.4) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(duration);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1050, now);
    bp.Q.setValueAtTime(0.7, now);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.28, now + 0.16);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(bp).connect(g).connect(this.ctx.destination);
    src.start(now);

    // Broadcast horn chord on boundaries
    const chord = duration > 1.4 ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];
    chord.forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, now + i * 0.055);
      og.gain.setValueAtTime(0.08, now + i * 0.055);
      og.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.36);
      o.connect(og).connect(this.ctx.destination);
      o.start(now + i * 0.055);
      o.stop(now + i * 0.055 + 0.38);
    });
  }

  playBowled() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Clattering wooden wickets + LED zing buzz
    [0, 0.04, 0.085].forEach((off, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(380 - i * 55, now + off);
      osc.frequency.exponentialRampToValueAtTime(85, now + off + 0.09);
      g.gain.setValueAtTime(0.24, now + off);
      g.gain.exponentialRampToValueAtTime(0.001, now + off + 0.1);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(now + off);
      osc.stop(now + off + 0.11);
    });

    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.32);
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1350, now);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.32, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    src.connect(bp).connect(ng).connect(this.ctx.destination);
    src.start(now);
  }

  playMatchResult(won) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = won
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : [392.0, 349.23, 311.13, 261.63];

    notes.forEach((freq, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = won ? 'triangle' : 'sawtooth';
      o.frequency.setValueAtTime(freq, now + i * 0.12);
      g.gain.setValueAtTime(0.16, now + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.44);
      o.connect(g).connect(this.ctx.destination);
      o.start(now + i * 0.12);
      o.stop(now + i * 0.12 + 0.46);
    });
    if (won) this.playCrowdCheer(2.0);
  }
}

window.soundEngine = new SoundEngine();
