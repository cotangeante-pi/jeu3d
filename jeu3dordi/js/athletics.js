// Mini-jeu Coach — équilibre sur monocycle, inspiré de Unicycle Hero
const Athletics = {
  _el:        null,
  _canvas:    null,
  _ctx:       null,
  _balance:   0,     // -1 (gauche) à +1 (droite)
  _vel:       0,     // vitesse de déséquilibre
  _time:      0,
  _score:     0,
  _falls:     0,
  _running:   false,
  _fallFlash: 0,     // timer de flash rouge après une chute

  _build() {
    if (document.getElementById('athletics-overlay')) return;
    const el = document.createElement('div');
    el.id = 'athletics-overlay';
    el.style.cssText = [
      'display:none', 'position:fixed', 'inset:0',
      'background:rgba(0,0,0,0.88)',
      'justify-content:center', 'align-items:center', 'z-index:200',
    ].join(';');
    el.innerHTML = `
      <div id="ath-box" style="
        background:#1a1a2e;border:2px solid #4a4a6a;border-radius:16px;
        padding:24px;min-width:360px;max-width:500px;text-align:center;
        font-family:Arial,sans-serif;
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2 style="color:#fff;margin:0;font-size:1.25em">💪 Entraînement Sportif</h2>
          <button id="ath-exit" style="
            background:#2c2c44;color:#ccc;border:1px solid #555;
            padding:6px 14px;border-radius:8px;cursor:pointer;font-size:0.9em;
          ">T — Partir</button>
        </div>
        <canvas id="ath-canvas" width="420" height="140"
          style="border-radius:10px;display:block;margin:0 auto"></canvas>
        <div id="ath-info" style="color:#aaa;margin-top:10px;font-size:0.95em">
          ← A / D → pour garder l'équilibre · Reste dans la zone verte !
        </div>
        <div id="ath-stats" style="
          display:flex;justify-content:space-around;margin-top:12px;
          color:#fff;font-size:1em;
        ">
          <span>⏱ Temps : <b id="ath-time">0s</b></span>
          <span>🏅 Score : <b id="ath-score">0</b></span>
          <span>💥 Chutes : <b id="ath-falls">0</b></span>
        </div>
        <div id="ath-msg" style="color:#88ff88;margin-top:8px;font-size:0.9em;min-height:1.2em"></div>
      </div>
    `;
    document.body.appendChild(el);
    this._el     = el;
    this._canvas = document.getElementById('ath-canvas');
    this._ctx    = this._canvas.getContext('2d');
    document.getElementById('ath-exit').addEventListener('click', () => Athletics.exit());
    document.getElementById('ath-exit').addEventListener('touchstart', e => { e.preventDefault(); Athletics.exit(); }, { passive: false });
  },

  enter() {
    if (State.inWorkMode) return;
    this._build();
    State.inWorkMode = true;
    this._running    = true;
    this._balance    = 0;
    this._vel        = 0;
    this._time       = 0;
    this._score      = 0;
    this._falls      = 0;
    this._fallFlash  = 0;
    document.getElementById('ath-msg').textContent = '';
    this._el.style.display = 'flex';
  },

  exit() {
    if (!State.inWorkMode) return;
    State.inWorkMode = false;
    this._running    = false;
    this._el.style.display = 'none';
    const pay = Math.round(State.currentJob.salary * Math.min(this._score / 200, 1.5));
    if (pay > 0) {
      Jobs.earnFromWork(pay);
    } else {
      Jobs._notify('Pas assez de performance, aucun bonus.', '#ffaa44');
    }
  },

  tick(delta) {
    if (!State.inWorkMode || !this._running) return;
    this._time      += delta;
    this._fallFlash  = Math.max(0, this._fallFlash - delta);

    // ── Physique d'équilibre ──────────────────────────────────────────────────
    // La balance oscille naturellement (vent, terrain)
    const drift = Math.sin(this._time * 1.1) * 0.55 + Math.sin(this._time * 2.9) * 0.18;
    this._vel += drift * delta;

    // Input joueur — ← A tire à gauche, D → tire à droite
    const leftKey  = State.keys['KeyA'] || State.keys['ArrowLeft'];
    const rightKey = State.keys['KeyD'] || State.keys['ArrowRight'];
    if (leftKey)  this._vel -= 3.0 * delta;
    if (rightKey) this._vel += 3.0 * delta;

    // Friction naturelle
    this._vel *= Math.pow(0.05, delta);
    this._balance = Math.max(-1, Math.min(1, this._balance + this._vel * delta));

    // ── Scoring ───────────────────────────────────────────────────────────────
    const abs = Math.abs(this._balance);
    if (abs < 0.25) {
      // Zone parfaite (centre) → +25 pts/s
      this._score += delta * 25;
    } else if (abs < 0.5) {
      // Zone verte → +10 pts/s
      this._score += delta * 10;
    } else if (abs > 0.88) {
      // Chute !
      this._falls++;
      this._fallFlash = 0.4;
      this._balance   = (Math.random() - 0.5) * 0.3;
      this._vel       = 0;
      const penalty   = Math.min(this._score * 0.15, 30);
      this._score     = Math.max(0, this._score - penalty);
      document.getElementById('ath-msg').textContent = '💥 Chute ! Reprends l\'équilibre…';
      setTimeout(() => {
        const m = document.getElementById('ath-msg');
        if (m) m.textContent = '';
      }, 1500);
    }

    // Bonus de durée toutes les 30s
    if (this._time > 0 && Math.floor(this._time) % 30 === 0 && Math.floor(this._time) !== this._lastBonus) {
      this._lastBonus = Math.floor(this._time);
      this._score += 50;
      document.getElementById('ath-msg').textContent = '🌟 Bonus endurance +50 pts !';
      setTimeout(() => {
        const m = document.getElementById('ath-msg');
        if (m) m.textContent = '';
      }, 1500);
    }

    // ── UI ────────────────────────────────────────────────────────────────────
    document.getElementById('ath-time').textContent  = Math.floor(this._time) + 's';
    document.getElementById('ath-score').textContent = Math.floor(this._score);
    document.getElementById('ath-falls').textContent = this._falls;
    this._draw();
  },

  _draw() {
    const ctx = this._ctx;
    const W   = this._canvas.width;
    const H   = this._canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Fond + flash rouge si chute
    ctx.fillStyle = this._fallFlash > 0
      ? `rgba(${Math.floor(180 * this._fallFlash / 0.4)},20,20,1)`
      : '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // ── Barre d'équilibre (haut) ─────────────────────────────────────────────
    const barX = W * 0.08;
    const barW = W * 0.84;
    const barY = 14;
    const barH = 18;

    // Fond de la barre
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 9);
    ctx.fill();

    // Zone parfaite (dorée)
    ctx.fillStyle = 'rgba(241,196,15,0.3)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - barW * 0.12, barY, barW * 0.24, barH, 9);
    ctx.fill();

    // Zone verte
    ctx.fillStyle = 'rgba(39,174,96,0.4)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - barW * 0.25, barY, barW * 0.50, barH, 9);
    ctx.fill();

    // Indicateur (cercle)
    const abs = Math.abs(this._balance);
    const indX = barX + (this._balance + 1) / 2 * barW;
    ctx.fillStyle = abs < 0.25 ? '#f1c40f' : abs < 0.5 ? '#27ae60' : abs < 0.75 ? '#e67e22' : '#e74c3c';
    ctx.beginPath();
    ctx.arc(indX, barY + barH / 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── Sol / piste ───────────────────────────────────────────────────────────
    const groundY = H * 0.75;
    ctx.fillStyle = '#2c2c44';
    ctx.fillRect(0, groundY, W, H - groundY);

    // Lignes de piste (défilent avec le temps)
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth   = 2;
    ctx.setLineDash([18, 12]);
    ctx.lineDashOffset = -(this._time * 80) % 30;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 4); ctx.lineTo(W, groundY + 4);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Personnage monocycle ──────────────────────────────────────────────────
    const px     = W / 2 + this._balance * W * 0.15;
    const wheelR = 26;
    const wheelY = groundY - wheelR;
    const lean   = this._balance * 0.45;

    // Roue
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(px, wheelY, wheelR, 0, Math.PI * 2);
    ctx.stroke();

    // Rayons (tournent)
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth   = 1.5;
    for (let i = 0; i < 6; i++) {
      const a = (this._time * 3 + i * Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(px, wheelY);
      ctx.lineTo(px + Math.cos(a) * wheelR, wheelY + Math.sin(a) * wheelR);
      ctx.stroke();
    }

    // Guidon / tige
    const bodyLen = 38;
    const bodyTopX = px + Math.sin(lean) * bodyLen;
    const bodyTopY = wheelY - wheelR * 0.2 - Math.cos(lean) * bodyLen;

    ctx.strokeStyle = '#bdc3c7';
    ctx.lineWidth   = 5;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(px, wheelY - wheelR * 0.15);
    ctx.lineTo(bodyTopX, bodyTopY);
    ctx.stroke();

    // Bras (pendulaires opposés)
    const armSwing = Math.sin(this._time * 2.8) * 0.5;
    ctx.strokeStyle = '#d4956a';
    ctx.lineWidth   = 4;
    // Bras gauche
    ctx.beginPath();
    ctx.moveTo(bodyTopX, bodyTopY + 2);
    ctx.lineTo(bodyTopX - Math.cos(lean + armSwing) * 22, bodyTopY + 2 + Math.sin(lean + armSwing) * 14);
    ctx.stroke();
    // Bras droit
    ctx.beginPath();
    ctx.moveTo(bodyTopX, bodyTopY + 2);
    ctx.lineTo(bodyTopX + Math.cos(lean - armSwing) * 22, bodyTopY + 2 + Math.sin(lean - armSwing) * 14);
    ctx.stroke();

    // Tête
    ctx.fillStyle   = '#d4956a';
    ctx.strokeStyle = '#c4855a';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(bodyTopX + Math.sin(lean) * 5, bodyTopY - 14, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Yeux (réaction à l'équilibre)
    const eyeOffset = this._balance > 0.5 ? 2 : this._balance < -0.5 ? -2 : 0;
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath(); ctx.arc(bodyTopX + Math.sin(lean) * 5 - 4 + eyeOffset, bodyTopY - 15, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(bodyTopX + Math.sin(lean) * 5 + 4 + eyeOffset, bodyTopY - 15, 2.5, 0, Math.PI*2); ctx.fill();
  },
};
