const Sound = {
  _ctx:        null,
  _master:     null,
  _engineOsc:  null,
  _engineGain: null,
  _stepT:      0,
  _swimT:      0,
  _prevGround: true,
  _prevCar:    false,
  _prevWater:  false,

  init() {
    const unlock = () => {
      if (this._ctx) return;
      this._ctx    = new (window.AudioContext || window.webkitAudioContext)();
      this._master = this._ctx.createGain();
      this._master.gain.value = 0.35;
      this._master.connect(this._ctx.destination);
    };
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
      document.addEventListener(ev, unlock, { once: true })
    );
  },

  update(delta) {
    if (!this._ctx || State.paused || State.gameOver) return;

    const inCar    = !!State.inCar;
    const inWater  = !!State.inWater;
    const onGround = !!State.onGround;
    const spd      = Math.hypot(State.velX || 0, State.velZ || 0);
    const isSprint = spd > 7;

    // ── Pas de marche ────────────────────────────────────────────────
    if (!inCar && !inWater && onGround && spd > 0.5) {
      this._stepT += delta;
      const interval = isSprint ? 0.24 : 0.40;
      if (this._stepT >= interval) {
        this._stepT -= interval;
        this._footstep(isSprint);
      }
    } else {
      this._stepT = 0;
    }

    // ── Atterrissage ─────────────────────────────────────────────────
    if (!this._prevGround && onGround && !inCar && !inWater) this._land();

    // ── Eau : splash + brasse ────────────────────────────────────────
    if (inWater && !this._prevWater) this._splash();
    if (inWater && spd > 0.3) {
      this._swimT += delta;
      if (this._swimT >= 0.5) { this._swimT = 0; this._swim(); }
    } else {
      this._swimT = 0;
    }

    // ── Moteur voiture ───────────────────────────────────────────────
    if (inCar  && !this._prevCar) { this._carDoor(); this._engineStart(); }
    if (!inCar && this._prevCar)  { this._carDoor(); this._engineStop();  }
    if (inCar && this._engineOsc) {
      const car = State.drivingCar;
      const cs  = car ? Math.hypot(car.vx || 0, car.vz || 0) : 0;
      this._engineOsc.frequency.setTargetAtTime(55 + cs * 2.8, this._ctx.currentTime, 0.15);
      this._engineGain.gain.setTargetAtTime(
        0.12 + Math.min(cs * 0.005, 0.20), this._ctx.currentTime, 0.1
      );
    }

    this._prevGround = onGround;
    this._prevCar    = inCar;
    this._prevWater  = inWater;
  },

  jump()  { if (this._ctx) this._doJump();  },
  punch() { if (this._ctx) this._doPunch(); },
  coin()  { if (this._ctx) this._doCoin();  },
  buy()   { if (this._ctx) this._doBuy();   },
  eat()   { if (this._ctx) this._doEat();   },

  // ── Helpers synthèse ─────────────────────────────────────────────────────────

  _osc(type, freq, vol, dur, freqEnd) {
    const ctx = this._ctx, t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd !== undefined)
      o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this._master);
    o.start(); o.stop(t + dur);
  },

  _noise(vol, dur, cutoff) {
    const ctx = this._ctx;
    const n   = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = 'lowpass'; flt.frequency.value = cutoff || 600;
    const g   = ctx.createGain();
    const t   = ctx.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(flt); flt.connect(g); g.connect(this._master);
    src.start(); src.stop(t + dur);
  },

  // ── Sons individuels ──────────────────────────────────────────────────────────

  _footstep(sprint) {
    this._noise(sprint ? 0.22 : 0.16, 0.07, sprint ? 320 : 220);
    this._osc('sine', sprint ? 110 : 75, 0.20, 0.07);
  },

  _land() {
    this._noise(0.45, 0.14, 160);
    this._osc('sine', 55, 0.38, 0.15);
  },

  _doJump() {
    this._osc('sine', 200, 0.18, 0.14, 380);
    this._noise(0.10, 0.10, 500);
  },

  _splash() {
    this._noise(0.55, 0.38, 700);
    this._osc('sine', 200, 0.28, 0.28, 70);
  },

  _swim() {
    this._noise(0.11, 0.20, 450);
    this._osc('sine', 110, 0.09, 0.20, 80);
  },

  _doPunch() {
    this._noise(0.55, 0.06, 1400);
    this._osc('square', 180, 0.28, 0.08, 55);
  },

  _carDoor() {
    this._noise(0.40, 0.09, 2000);
    this._osc('sine', 340, 0.18, 0.07, 160);
  },

  _engineStart() {
    const ctx = this._ctx;
    this._engineOsc  = ctx.createOscillator();
    this._engineGain = ctx.createGain();
    const ws    = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = i * 2 / 255 - 1;
      curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
    }
    ws.curve = curve;
    this._engineOsc.type = 'sawtooth';
    this._engineOsc.frequency.value = 55;
    this._engineGain.gain.value = 0.001;
    this._engineOsc.connect(ws);
    ws.connect(this._engineGain);
    this._engineGain.connect(this._master);
    this._engineOsc.start();
    this._engineGain.gain.setTargetAtTime(0.13, ctx.currentTime, 0.4);
  },

  _engineStop() {
    if (!this._engineOsc) return;
    const osc = this._engineOsc, gain = this._engineGain;
    gain.gain.setTargetAtTime(0.001, this._ctx.currentTime, 0.3);
    setTimeout(() => { try { osc.stop(); } catch (e) {} }, 600);
    this._engineOsc  = null;
    this._engineGain = null;
  },

  _doCoin() {
    this._osc('sine', 880, 0.28, 0.12, 1320);
    setTimeout(() => { if (this._ctx) this._osc('sine', 1320, 0.20, 0.10, 1760); }, 120);
  },

  _doBuy() {
    this._osc('sine', 440, 0.22, 0.10);
    setTimeout(() => { if (this._ctx) this._osc('sine', 660, 0.18, 0.10); }, 100);
  },

  _doEat() {
    this._osc('sine', 330, 0.18, 0.12, 500);
  },
};
