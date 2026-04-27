// Monde Téléporté — Athlétisme + Course de voiture
const MondeTelepporte = {
  _mode: null,   // null|'athletics'

  tick(delta) {
    if (!State.inPortalGame) return;
    if (this._mode === 'athletics') this._athTick(delta);

  },

  _openOverlay() {
    State.inWorkMode   = true;
    State.inPortalGame = true;
    document.exitPointerLock();
    this._ensureOverlay();
    document.getElementById('mt-overlay').style.display = 'flex';
  },

  enterAthletics() {
    if (State.inWorkMode) return;
    this._openOverlay();
    this._startAthletics();
  },


  exit() {
    if (!State.inPortalGame) return;
    State.inWorkMode   = false;
    State.inPortalGame = false;
    this._mode = null;
    const el = document.getElementById('mt-overlay');
    if (el) el.style.display = 'none';
    if (!State.paused && !State.gameOver) State.pointerLocked = true;
  },

  // ── Helpers UI ────────────────────────────────────────────────────────────
  _ensureOverlay() {
    if (document.getElementById('mt-overlay')) return;
    const style = document.createElement('style');
    style.textContent = `
      .mt-btn{background:#3a1f6e;color:#fff;border:1px solid #7a4fae;padding:13px 18px;
              border-radius:10px;font-size:0.95em;cursor:pointer;width:100%;transition:background .15s;}
      .mt-btn:hover,.mt-btn:active{background:#5a2f9e;}
    `;
    document.head.appendChild(style);

    const el = document.createElement('div');
    el.id = 'mt-overlay';
    el.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.93);' +
                       'justify-content:center;align-items:center;z-index:300;';
    el.innerHTML = `<div id="mt-box" style="background:#0e0b1e;border:2px solid #6a3d9a;
      border-radius:18px;padding:26px 22px;min-width:320px;max-width:660px;width:92vw;
      text-align:center;font-family:Arial,sans-serif;max-height:95vh;overflow-y:auto;">
      <div id="mt-content"></div></div>`;
    document.body.appendChild(el);
  },

  _setContent(html) { document.getElementById('mt-content').innerHTML = html; },

  _btn(id, cb) {
    const el = document.getElementById(id);
    if (!el) return;
    el.onclick = cb;
    el.ontouchstart = e => { e.preventDefault(); cb(); };
  },

  // ── ATHLÉTISME ────────────────────────────────────────────────────────────
  _ath: null,

  _ATH_EVENTS: [
    { id:'sprint',   name:'🏃 Sprint 100m',      hint:'Alterne A/D rapidement !' },
    { id:'longjump', name:'🦘 Saut en longueur', hint:'A/D pour l\'élan · Espace pour sauter au tremplin !' },
    { id:'highjump', name:'🏔 Saut en hauteur',  hint:'A/D pour l\'élan · Espace pour sauter !' },
    { id:'hurdles',  name:'🚧 110m Haies',       hint:'Course auto · Espace pour sauter les haies !' },
  ],

  _startAthletics() {
    this._mode = 'athletics';
    this._ath = { canvas:null, ctx:null, eventIdx:0, medals:[], phase:'playing', _mobile:false };
    this._athShowEvent(0);
  },

  _athShowEvent(idx) {
    const a = this._ath;
    a.eventIdx = idx; a.phase = 'playing'; a._mobile = false;
    const ev = this._ATH_EVENTS[idx];
    const ico = { gold:'🥇', silver:'🥈', bronze:'🥉', none:'❌' };
    let mHtml = '';
    for (let i = 0; i < this._ATH_EVENTS.length; i++) {
      if (i < a.medals.length)  mHtml += `<span>${ico[a.medals[i]]}</span>`;
      else if (i === idx)        mHtml += `<span style="opacity:0.5">🏅</span>`;
      else                       mHtml += `<span style="opacity:0.2">⬜</span>`;
    }
    const showBtn = ev.id !== 'sprint';
    const btnLbl  = ev.id === 'longjump' ? '🦘 Sauter' : ev.id === 'highjump' ? '🏔 Sauter' : '⬆ Sauter';
    this._setContent(`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <h2 style="color:#44ee44;margin:0;font-size:1em">🏅 Arène Athlétisme — ${ev.name}</h2>
        <button class="mt-btn" id="ath-exit" style="width:auto;padding:5px 12px;font-size:0.82em;">✕</button>
      </div>
      <div style="color:#888;font-size:0.8em;margin:1px 0 3px">${ev.hint}</div>
      <canvas id="ath-canvas" width="560" height="230" style="border-radius:10px;display:block;margin:3px auto"></canvas>
      <div id="ath-medals" style="display:flex;justify-content:center;gap:18px;margin:4px 0;font-size:1.4em">${mHtml}</div>
      <div id="ath-msg" style="color:#88ff88;min-height:1em;font-size:0.88em;margin:2px 0"></div>
      ${showBtn ? `<button id="ath-btn" style="margin-top:5px;background:#228833;color:#fff;border:none;padding:9px 24px;border-radius:8px;font-size:1em;cursor:pointer;touch-action:manipulation;user-select:none;">${btnLbl}</button>` : ''}
    `);
    a.canvas = document.getElementById('ath-canvas');
    a.ctx    = a.canvas.getContext('2d');
    this._btn('ath-exit', () => this.exit());
    const btn = document.getElementById('ath-btn');
    if (btn) {
      const dn = () => { a._mobile = true; };
      const up = () => { a._mobile = false; };
      btn.addEventListener('mousedown',  dn);
      btn.addEventListener('touchstart', e => { e.preventDefault(); dn(); }, { passive:false });
      btn.addEventListener('mouseup',    up);
      btn.addEventListener('mouseleave', up);
      btn.addEventListener('touchend',   e => { e.preventDefault(); up(); }, { passive:false });
    }
    if (ev.id === 'sprint')   { a.sprint   = { progress:0, lastKey:'', time:0, legPhase:0, done:false }; }
    if (ev.id === 'longjump') { a.longjump = { runX:0, lastKey:'', legPhase:0, airTime:-1, dist:0, done:false, _su:true }; }
    if (ev.id === 'highjump') { a.highjump = { approach:0, lastKey:'', airTime:-1, result:0, done:false, _su:true }; }
    if (ev.id === 'hurdles')  { a.hurdles  = { progress:0, legPhase:0, airTime:-1, crashed:0, time:0, done:false, _su:true, _nextH:0 }; }
  },

  _athTick(delta) {
    const a = this._ath;
    if (!a || a.phase !== 'playing') return;
    const evId = this._ATH_EVENTS[a.eventIdx].id;
    if (evId === 'sprint')   this._athSprint(delta);
    if (evId === 'longjump') this._athLongJump(delta);
    if (evId === 'highjump') this._athHighJump(delta);
    if (evId === 'hurdles')  this._athHurdles(delta);
    this._athDraw();
  },

  _athSprint(delta) {
    const s = this._ath.sprint;
    if (s.done) return;
    s.time += delta; s.legPhase += delta * 12;
    const aKey = State.keys['KeyA'] || State.keys['ArrowLeft'];
    const dKey = State.keys['KeyD'] || State.keys['ArrowRight'];
    if (aKey && s.lastKey !== 'a') { s.lastKey = 'a'; s.progress += 0.07; }
    if (dKey && s.lastKey !== 'd') { s.lastKey = 'd'; s.progress += 0.07; }
    if (s.progress >= 1) {
      s.done = true;
      const medal = s.time < 4.5 ? 'gold' : s.time < 7 ? 'silver' : s.time < 10.5 ? 'bronze' : 'none';
      this._finishAthEvent(medal);
      return;
    }
    s.progress = Math.max(0, s.progress - 0.012);
    const msg = document.getElementById('ath-msg');
    if (msg) msg.textContent = `⏱ ${s.time.toFixed(1)}s  ·  🥇 <4.5s   🥈 <7s   🥉 <10.5s`;
  },

  _athLongJump(delta) {
    const j = this._ath.longjump;
    if (j.done) return;
    const space = State.keys['Space'] || this._ath._mobile;
    if (j.airTime < 0) {
      j.legPhase += delta * 10;
      j.runX = Math.max(0, j.runX - 0.008);
      const aKey = State.keys['KeyA'] || State.keys['ArrowLeft'];
      const dKey = State.keys['KeyD'] || State.keys['ArrowRight'];
      if (aKey && j.lastKey !== 'a') { j.lastKey = 'a'; j.runX = Math.min(1, j.runX + 0.065); }
      if (dKey && j.lastKey !== 'd') { j.lastKey = 'd'; j.runX = Math.min(1, j.runX + 0.065); }
      const msg = document.getElementById('ath-msg');
      if (msg) msg.textContent = j.runX >= 0.85 ? '🟡 Espace au tremplin !' : `Vitesse : ${Math.round(j.runX * 100)}%`;
      if (space && j._su && j.runX >= 0.5) { j.airTime = 0; j.dist = 0.45 + j.runX * 0.55; }
      j._su = !space;
    } else {
      j.airTime += delta;
      if (j.airTime >= 1.3) {
        j.done = true;
        const m = (4.5 + j.dist * 4.0).toFixed(2);
        const msg = document.getElementById('ath-msg');
        if (msg) msg.textContent = `📏 ${m} m`;
        const medal = j.dist >= 0.88 ? 'gold' : j.dist >= 0.72 ? 'silver' : j.dist >= 0.55 ? 'bronze' : 'none';
        this._finishAthEvent(medal);
      }
    }
  },

  _athHighJump(delta) {
    const j = this._ath.highjump;
    if (j.done) return;
    const space = State.keys['Space'] || this._ath._mobile;
    if (j.airTime < 0) {
      j.approach = Math.max(0, j.approach - 0.008);
      const aKey = State.keys['KeyA'] || State.keys['ArrowLeft'];
      const dKey = State.keys['KeyD'] || State.keys['ArrowRight'];
      if (aKey && j.lastKey !== 'a') { j.lastKey = 'a'; j.approach = Math.min(1, j.approach + 0.08); }
      if (dKey && j.lastKey !== 'd') { j.lastKey = 'd'; j.approach = Math.min(1, j.approach + 0.08); }
      const msg = document.getElementById('ath-msg');
      if (msg) {
        if (j.approach >= 0.88) msg.textContent = '🟡 Sautez maintenant !';
        else if (j.approach >= 0.75) msg.textContent = '🟢 Bonne vitesse — Espace !';
        else msg.textContent = `Élan : ${Math.round(j.approach * 100)}%`;
      }
      if (space && j._su && j.approach >= 0.72) { j.airTime = 0; j.result = j.approach; }
      j._su = !space;
    } else {
      j.airTime += delta;
      if (j.airTime >= 1.5) {
        j.done = true;
        const r = j.result;
        const medal = r >= 0.90 ? 'gold' : r >= 0.82 ? 'silver' : r >= 0.72 ? 'bronze' : 'none';
        this._finishAthEvent(medal);
      }
    }
  },

  _athHurdles(delta) {
    const h = this._ath.hurdles;
    if (h.done) return;
    const HP = [0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.84, 0.96];
    const space = State.keys['Space'] || this._ath._mobile;
    h.time += delta; h.legPhase += delta * 11; h.progress += delta * 0.088;
    if (h.airTime >= 0) { h.airTime += delta; if (h.airTime >= 0.42) h.airTime = -1; }
    if (h._nextH < HP.length) {
      const hp = HP[h._nextH];
      const inZone = h.progress >= hp - 0.055 && h.progress <= hp + 0.015;
      const past   = h.progress > hp + 0.015;
      if (inZone && space && h._su && h.airTime < 0) {
        h._su = false; h.airTime = 0; h._nextH++;
      } else if (past && h.airTime < 0) {
        h.crashed++; h.time += 1.8; h._nextH++;
      }
    }
    if (!space) h._su = true;
    const msg = document.getElementById('ath-msg');
    if (msg) {
      const warn = h._nextH < HP.length && h.progress >= HP[h._nextH] - 0.065;
      msg.textContent = warn
        ? '⚠ Haie — Espace !'
        : `⏱ ${h.time.toFixed(1)}s${h.crashed ? '  ·  ⚠ ' + h.crashed + ' chute' + (h.crashed > 1 ? 's' : '') : ''}`;
    }
    if (h.progress >= 1) {
      h.done = true;
      const medal = h.time < 7 ? 'gold' : h.time < 10 ? 'silver' : h.time < 15 ? 'bronze' : 'none';
      this._finishAthEvent(medal);
    }
  },

  _finishAthEvent(medal) {
    const a = this._ath;
    a.medals.push(medal); a.phase = 'result';
    const ico = { gold:'🥇', silver:'🥈', bronze:'🥉', none:'❌' };
    const lbl = { gold:'🥇 Médaille d\'or !', silver:'🥈 Médaille d\'argent !', bronze:'🥉 Médaille de bronze !', none:'❌ Aucune médaille' };
    const msgEl = document.getElementById('ath-msg');
    if (msgEl) msgEl.textContent = lbl[medal];
    const btn = document.getElementById('ath-btn');
    if (btn) btn.disabled = true;
    let mHtml = '';
    for (let i = 0; i < this._ATH_EVENTS.length; i++) {
      if (i < a.medals.length)      mHtml += `<span>${ico[a.medals[i]]}</span>`;
      else if (i === a.eventIdx+1)  mHtml += `<span style="opacity:0.5">🏅</span>`;
      else                          mHtml += `<span style="opacity:0.2">⬜</span>`;
    }
    const mEl = document.getElementById('ath-medals');
    if (mEl) mEl.innerHTML = mHtml;
    setTimeout(() => {
      if (this._mode !== 'athletics') return;
      if (a.eventIdx + 1 >= this._ATH_EVENTS.length) {
        a.phase = 'done';
        const pts = a.medals.reduce((s, m) => s + (m==='gold'?3 : m==='silver'?2 : m==='bronze'?1 : 0), 0);
        const pay = State.currentJob ? Math.round(State.currentJob.salary * Math.max(0.1, pts/12) * 2.5) : 0;
        if (pay > 0) Jobs.earnFromWork(pay);
        const payLine = pay > 0 ? `<p style="color:#88ff88">💰 Prime : +${pay}$</p>` : '';
        this._setContent(`
          <h2 style="color:#44ee44">🏅 Résultats Athlétisme</h2>
          <p style="font-size:1.6em;margin:8px 0">${a.medals.map(m => ico[m]).join('  ')}</p>
          <p style="color:#aaa;margin:4px 0">${pts} / 12 points</p>
          ${payLine}
          <div style="display:flex;gap:10px;margin-top:16px;justify-content:center">
            <button class="mt-btn" id="ath-replay" style="width:auto">🔄 Rejouer</button>
            <button class="mt-btn" id="ath-quit" style="width:auto;background:#1e1030">✕ Quitter</button>
          </div>
        `);
        this._btn('ath-replay', () => this._startAthletics());
        this._btn('ath-quit',   () => this.exit());
      } else {
        this._athShowEvent(a.eventIdx + 1);
      }
    }, 2200);
  },

  // ── Dessin athlétisme ─────────────────────────────────────────────────────

  _drawAthlete(ctx, cx, gy, color, opts) {
    const { lp=0, pose='run', jarc=0 } = opts || {};
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const skin = '#d4956a', LL = 30, TH = 20, TW = 13, HR = 9;
    const ay = pose === 'jump' ? -Math.sin(Math.max(0, Math.min(1, jarc)) * Math.PI) * 50 : 0;
    const hy = gy + ay, sy = hy - LL - TH, hcy = sy - HR - 2;
    const s = Math.sin(lp);

    // Legs
    ctx.strokeStyle = skin; ctx.lineWidth = 4.5;
    if (pose !== 'jump') {
      const la = Math.PI/2 + s * 0.55;
      const lkx = cx + Math.cos(la)*LL*0.5, lky = hy + Math.sin(la)*LL*0.5;
      const lfx = lkx + Math.cos(la+s*0.3)*LL*0.5, lfy = Math.min(gy, lky+Math.sin(la+s*0.3)*LL*0.5);
      ctx.beginPath(); ctx.moveTo(cx,hy); ctx.lineTo(lkx,lky); ctx.lineTo(lfx,lfy); ctx.stroke();
      const ra = Math.PI/2 - s * 0.55;
      const rkx = cx + Math.cos(ra)*LL*0.5, rky = hy + Math.sin(ra)*LL*0.5;
      const rfx = rkx + Math.cos(ra-s*0.3)*LL*0.5, rfy = Math.min(gy, rky+Math.sin(ra-s*0.3)*LL*0.5);
      ctx.beginPath(); ctx.moveTo(cx,hy); ctx.lineTo(rkx,rky); ctx.lineTo(rfx,rfy); ctx.stroke();
    } else {
      const tuck = Math.min(1, jarc*1.5)*0.6;
      [-1,1].forEach(side => {
        const kx=cx+side*11, ky=hy-LL*0.35-tuck*8, fx=kx+side*6, fy=ky+LL*0.55;
        ctx.beginPath(); ctx.moveTo(cx,hy); ctx.lineTo(kx,ky); ctx.lineTo(fx,fy); ctx.stroke();
      });
    }

    // Torso
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(cx-TW/2, sy, TW, TH, 3); ctx.fill();

    // Arms
    ctx.strokeStyle = skin; ctx.lineWidth = 4;
    if (pose === 'jump') {
      ctx.beginPath(); ctx.moveTo(cx-TW/2, sy+5); ctx.lineTo(cx-TW/2-12, sy-8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+TW/2, sy+5); ctx.lineTo(cx+TW/2+12, sy-8); ctx.stroke();
    } else {
      const as = Math.sin(lp+Math.PI)*0.65;
      ctx.beginPath(); ctx.moveTo(cx-TW/2, sy+5);
      ctx.lineTo(cx-TW/2-12-Math.sin(as)*7, sy+5-Math.cos(as)*11); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+TW/2, sy+5);
      ctx.lineTo(cx+TW/2+12+Math.sin(as)*7, sy+5+Math.cos(as)*11); ctx.stroke();
    }

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(cx, hcy, HR, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#c4855a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, hcy, HR, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  },

  _athDraw() {
    const a = this._ath;
    if (!a || !a.ctx) return;
    const ctx = a.ctx, W = a.canvas.width, H = a.canvas.height;
    const evId = this._ATH_EVENTS[a.eventIdx].id;
    if (evId === 'sprint')   this._athDrawSprint(ctx, W, H);
    if (evId === 'longjump') this._athDrawLongJump(ctx, W, H);
    if (evId === 'highjump') this._athDrawHighJump(ctx, W, H);
    if (evId === 'hurdles')  this._athDrawHurdles(ctx, W, H);
  },

  _athDrawSprint(ctx, W, H) {
    const s = this._ath.sprint;
    ctx.fillStyle = '#1a2a1a'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#4488bb'; ctx.fillRect(0,0,W,H*0.42);
    const TY = H*0.54, TH2 = H*0.36;
    ctx.fillStyle = '#b08040'; ctx.fillRect(0,TY,W,TH2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.setLineDash([14,9]);
    [0.33,0.66].forEach(f => {
      ctx.beginPath(); ctx.moveTo(0,TY+TH2*f); ctx.lineTo(W,TY+TH2*f); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W-25,TY-4); ctx.lineTo(W-25,TY+TH2+4); ctx.stroke();
    const bw = W-40;
    ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.roundRect(20,10,bw,12,6); ctx.fill();
    ctx.fillStyle = '#22cc44'; ctx.beginPath(); ctx.roundRect(20,10,bw*s.progress,12,6); ctx.fill();
    const ax = 40 + s.progress*(W-80), gy = TY+TH2*0.38;
    this._drawAthlete(ctx, ax, gy, '#22cc44', { lp:s.legPhase });
    ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${s.time.toFixed(1)}s`, W/2, H-6);
  },

  _athDrawLongJump(ctx, W, H) {
    const j = this._ath.longjump;
    const boardX = W*0.68;
    ctx.fillStyle = '#1a2a1a'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#4488bb'; ctx.fillRect(0,0,W,H*0.42);
    const TY = H*0.54, TH2 = H*0.36;
    ctx.fillStyle = '#b08040'; ctx.fillRect(0,TY,boardX,TH2);
    ctx.fillStyle = '#d4b560'; ctx.fillRect(boardX,TY,W-boardX,TH2);
    ctx.fillStyle = '#fff'; ctx.fillRect(boardX-4,TY-3,7,TH2+3);
    const gy = TY+TH2*0.38;
    if (j.airTime < 0) {
      const ax = 35 + j.runX*(boardX-70);
      this._drawAthlete(ctx, ax, gy, '#22cc44', { lp:j.legPhase });
      const bw = boardX-40;
      ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.roundRect(20,10,bw,12,6); ctx.fill();
      const fc = j.runX >= 0.85 ? '#f1c40f' : '#22cc44';
      ctx.fillStyle = fc; ctx.beginPath(); ctx.roundRect(20,10,bw*j.runX,12,6); ctx.fill();
    } else {
      const t = j.airTime/1.3;
      const endX = boardX + j.dist*(W-boardX-30);
      const ax = boardX + (endX-boardX)*t;
      const arcY = -Math.sin(t*Math.PI)*65;
      this._drawAthlete(ctx, ax, gy+arcY, '#22cc44', { lp:j.legPhase, pose:'jump', jarc:t });
    }
  },

  _athDrawHighJump(ctx, W, H) {
    const j = this._ath.highjump;
    const barX1 = W*0.56, barX2 = W*0.90;
    ctx.fillStyle = '#1a2a1a'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#4488bb'; ctx.fillRect(0,0,W,H*0.42);
    const TY = H*0.60, TH2 = H*0.30;
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(0,TY,W,TH2);
    ctx.fillStyle = '#2255aa'; ctx.fillRect(barX1,TY,W-barX1,TH2*0.55);
    const barH = TY - 50 - j.result*20;
    ctx.fillStyle = '#888';
    ctx.fillRect(barX1-3,barH,6,TY-barH);
    ctx.fillRect(barX2-3,barH,6,TY-barH);
    ctx.strokeStyle = j.done ? (j.result >= 0.72 ? '#44ff66' : '#e74c3c') : '#f1c40f';
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(barX1,barH+8); ctx.lineTo(barX2,barH+8); ctx.stroke();
    const gy = TY+TH2*0.32;
    if (j.airTime < 0) {
      const ax = 30 + j.approach*(barX1-55);
      this._drawAthlete(ctx, ax, gy, '#22cc44', { lp:j.approach*22 });
      const bw = W*0.5-40;
      ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.roundRect(20,10,bw,12,6); ctx.fill();
      const fc = j.approach >= 0.88 ? '#f1c40f' : j.approach >= 0.72 ? '#22cc44' : '#2980b9';
      ctx.fillStyle = fc; ctx.beginPath(); ctx.roundRect(20,10,bw*j.approach,12,6); ctx.fill();
    } else {
      const t = j.airTime/1.5;
      const ax = (barX1+barX2)/2;
      const arcY = -Math.sin(t*Math.PI)*72;
      this._drawAthlete(ctx, ax, gy+arcY, '#22cc44', { lp:0, pose:'jump', jarc:t });
    }
  },

  _athDrawHurdles(ctx, W, H) {
    const h = this._ath.hurdles;
    const HP = [0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.84, 0.96];
    const AX = W*0.32;
    ctx.fillStyle = '#1a2a1a'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#4488bb'; ctx.fillRect(0,0,W,H*0.42);
    const TY = H*0.54, TH2 = H*0.36;
    ctx.fillStyle = '#b08040'; ctx.fillRect(0,TY,W,TH2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth=1.5; ctx.setLineDash([12,8]);
    ctx.beginPath(); ctx.moveTo(0,TY+TH2*0.5); ctx.lineTo(W,TY+TH2*0.5); ctx.stroke();
    ctx.setLineDash([]);
    HP.forEach((hp,idx) => {
      const rel = hp - h.progress;
      if (rel < -0.02 || rel > 0.6) return;
      const hx = AX + rel*W*1.9;
      if (hx < -30 || hx > W+30) return;
      ctx.strokeStyle = idx < h._nextH ? 'rgba(255,255,255,0.18)' : '#eee';
      ctx.lineWidth = 3;
      const HH2 = 28, HW2 = 20;
      ctx.beginPath(); ctx.moveTo(hx-HW2,TY); ctx.lineTo(hx-HW2,TY+HH2+6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx+HW2,TY); ctx.lineTo(hx+HW2,TY+HH2+6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx-HW2,TY+HH2/2); ctx.lineTo(hx+HW2,TY+HH2/2); ctx.stroke();
    });
    const finRel = 1.0 - h.progress;
    if (finRel > -0.02 && finRel < 0.6) {
      const fx = AX + finRel*W*1.9;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(fx,TY-5); ctx.lineTo(fx,TY+TH2+5); ctx.stroke();
    }
    const gy = TY+TH2*0.38;
    const pose = h.airTime >= 0 ? 'jump' : 'run';
    const jarc = h.airTime >= 0 ? h.airTime/0.42 : 0;
    this._drawAthlete(ctx, AX, gy, '#22cc44', { lp:h.legPhase, pose, jarc });
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${h.time.toFixed(1)}s`, W/2, H-6);
    if (h.crashed > 0) {
      ctx.fillStyle = '#ff6644';
      ctx.fillText(`⚠ ${h.crashed} chute${h.crashed>1?'s':''}`, W*0.78, H-6);
    }
  },
};
