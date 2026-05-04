const Sound = {
  _ac: null,
  _engOsc1: null, _engOsc2: null,
  _engGain: null, _engFilter: null,
  _stepTimer: 0,

  get _ctx() {
    if (!this._ac) this._ac = new (window.AudioContext || window.webkitAudioContext)();
    return this._ac;
  },

  _play(fn) {
    try {
      const ac = this._ctx;
      if (ac.state === 'suspended') { ac.resume().then(() => fn(ac)); return; }
      fn(ac);
    } catch(e) {}
  },

  _noise(ac, duration) {
    const len = Math.ceil(ac.sampleRate * duration);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  },

  // ── Pas de marche : appelé chaque frame depuis Player.update() ───────────────
  tryStep(delta, moving, sprint, onGround) {
    if (!moving || !onGround) { this._stepTimer = 0; return; }
    this._stepTimer += delta;
    const interval = sprint ? 0.22 : 0.38;
    if (this._stepTimer >= interval) {
      this._stepTimer -= interval;
      this._step(sprint);
    }
  },

  _step(sprint) {
    this._play(ac => {
      const buf = this._noise(ac, 0.06);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const f = ac.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = sprint ? 350 : 200; f.Q.value = 0.8;
      const g = ac.createGain();
      g.gain.setValueAtTime(sprint ? 0.18 : 0.12, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.06);
      src.connect(f); f.connect(g); g.connect(ac.destination);
      src.start();
    });
  },

  jump() {
    this._play(ac => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ac.currentTime);
      osc.frequency.linearRampToValueAtTime(320, ac.currentTime + 0.12);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.22, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.14);
      osc.connect(g); g.connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + 0.14);
    });
  },

  land() {
    this._play(ac => {
      const osc = ac.createOscillator();
      osc.frequency.setValueAtTime(110, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ac.currentTime + 0.18);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.45, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
      osc.connect(g); g.connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + 0.2);
    });
  },

  // Son de swing (toujours) + hit (si contact)
  punch() {
    this._play(ac => {
      const buf = this._noise(ac, 0.07);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const f = ac.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 600;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.1, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.07);
      src.connect(f); f.connect(g); g.connect(ac.destination);
      src.start();
    });
  },

  hit() {
    this._play(ac => {
      const osc = ac.createOscillator();
      osc.frequency.setValueAtTime(90, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, ac.currentTime + 0.12);
      const og = ac.createGain();
      og.gain.setValueAtTime(0.55, ac.currentTime);
      og.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
      osc.connect(og); og.connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + 0.12);

      const buf = this._noise(ac, 0.07);
      const ns  = ac.createBufferSource();
      ns.buffer = buf;
      const nf = ac.createBiquadFilter();
      nf.type = 'bandpass'; nf.frequency.value = 400; nf.Q.value = 1;
      const ng = ac.createGain();
      ng.gain.setValueAtTime(0.3, ac.currentTime);
      ng.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.07);
      ns.connect(nf); nf.connect(ng); ng.connect(ac.destination);
      ns.start();
    });
  },

  coin() {
    this._play(ac => {
      [800, 1200].forEach((freq, i) => {
        const osc = ac.createOscillator();
        osc.type = 'sine'; osc.frequency.value = freq;
        const g = ac.createGain();
        const t = ac.currentTime + i * 0.08;
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(g); g.connect(ac.destination);
        osc.start(t); osc.stop(t + 0.35);
      });
    });
  },

  pickup() {
    this._play(ac => {
      [440, 554, 659].forEach((freq, i) => {
        const osc = ac.createOscillator();
        osc.type = 'sine'; osc.frequency.value = freq;
        const g = ac.createGain();
        const t = ac.currentTime + i * 0.055;
        g.gain.setValueAtTime(0.16, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(g); g.connect(ac.destination);
        osc.start(t); osc.stop(t + 0.22);
      });
    });
  },

  eat() {
    this._play(ac => {
      [0, 0.07, 0.14].forEach(offset => {
        const buf = this._noise(ac, 0.05);
        const src = ac.createBufferSource();
        src.buffer = buf;
        const f = ac.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 280 + Math.random() * 180; f.Q.value = 2.5;
        const g = ac.createGain();
        const t = ac.currentTime + offset;
        g.gain.setValueAtTime(0.14, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        src.connect(f); f.connect(g); g.connect(ac.destination);
        src.start(t);
      });
    });
  },

  buy() {
    this._play(ac => {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ac.createOscillator();
        osc.type = 'triangle'; osc.frequency.value = freq;
        const g = ac.createGain();
        const t = ac.currentTime + i * 0.09;
        g.gain.setValueAtTime(0.16, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(g); g.connect(ac.destination);
        osc.start(t); osc.stop(t + 0.28);
      });
    });
  },

  // ── Moteur voiture ───────────────────────────────────────────────────────────
  carStart() {
    this._play(ac => {
      this._killEngine();
      this._engOsc1   = ac.createOscillator();
      this._engOsc2   = ac.createOscillator();
      this._engFilter = ac.createBiquadFilter();
      this._engGain   = ac.createGain();

      this._engOsc1.type = 'sawtooth'; this._engOsc1.frequency.value = 55;
      this._engOsc2.type = 'square';   this._engOsc2.frequency.value = 57;
      this._engFilter.type = 'lowpass'; this._engFilter.frequency.value = 350;

      this._engGain.gain.setValueAtTime(0, ac.currentTime);
      this._engGain.gain.linearRampToValueAtTime(0.07, ac.currentTime + 0.6);

      this._engOsc1.connect(this._engFilter);
      this._engOsc2.connect(this._engFilter);
      this._engFilter.connect(this._engGain);
      this._engGain.connect(ac.destination);

      this._engOsc1.start();
      this._engOsc2.start();
    });
  },

  engineUpdate(speed, maxSpeed) {
    if (!this._engOsc1 || !this._ac) return;
    try {
      const ratio = maxSpeed > 0 ? Math.min(speed / maxSpeed, 1) : 0;
      const freq  = 55 + ratio * 200;
      const t     = this._ac.currentTime;
      this._engOsc1.frequency.setTargetAtTime(freq, t, 0.08);
      this._engOsc2.frequency.setTargetAtTime(freq * 1.04, t, 0.08);
      this._engFilter.frequency.setTargetAtTime(250 + ratio * 600, t, 0.08);
      this._engGain.gain.setTargetAtTime(0.04 + ratio * 0.09, t, 0.08);
    } catch(e) {}
  },

  carStop() {
    if (!this._engGain || !this._ac) return;
    try {
      const t = this._ac.currentTime;
      this._engGain.gain.setValueAtTime(this._engGain.gain.value, t);
      this._engGain.gain.linearRampToValueAtTime(0, t + 0.5);
      setTimeout(() => this._killEngine(), 600);
    } catch(e) { this._killEngine(); }
  },

  _killEngine() {
    try { if (this._engOsc1) this._engOsc1.stop(); } catch(e) {}
    try { if (this._engOsc2) this._engOsc2.stop(); } catch(e) {}
    this._engOsc1 = null; this._engOsc2 = null;
    this._engFilter = null; this._engGain = null;
  },

  boost() {
    this._play(ac => {
      const buf = this._noise(ac, 0.28);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const f = ac.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.setValueAtTime(80, ac.currentTime);
      f.frequency.linearRampToValueAtTime(900, ac.currentTime + 0.2);
      const g = ac.createGain();
      g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.linearRampToValueAtTime(0.22, ac.currentTime + 0.09);
      g.gain.linearRampToValueAtTime(0, ac.currentTime + 0.28);
      src.connect(f); f.connect(g); g.connect(ac.destination);
      src.start();
    });
  },

  splash() {
    this._play(ac => {
      const buf = this._noise(ac, 0.35);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const f = ac.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.4;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.45, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
      src.connect(f); f.connect(g); g.connect(ac.destination);
      src.start();
    });
  },

  surface() {
    this._play(ac => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ac.currentTime);
      osc.frequency.linearRampToValueAtTime(700, ac.currentTime + 0.22);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.18, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.28);
      osc.connect(g); g.connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + 0.28);
    });
  },

  climb() {
    this._play(ac => {
      const buf = this._noise(ac, 0.18);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const f = ac.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 180; f.Q.value = 0.9;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.09, ac.currentTime);
      g.gain.linearRampToValueAtTime(0, ac.currentTime + 0.18);
      src.connect(f); f.connect(g); g.connect(ac.destination);
      src.start();
    });
  },

  wanted(level) {
    this._play(ac => {
      const freqs = [440, 587, 880];
      const n = Math.min(level, 3);
      for (let i = 0; i < n; i++) {
        const osc = ac.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freqs[Math.min(i, freqs.length - 1)];
        const g = ac.createGain();
        const t = ac.currentTime + i * 0.14;
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(g); g.connect(ac.destination);
        osc.start(t); osc.stop(t + 0.1);
      }
    });
  },
};
