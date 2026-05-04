// Mini-jeu Athlétisme — 3 épreuves track & field, même principe que le coach (touche T)
const Athletisme = {
  _el:       null,
  _canvas:   null,
  _ctx:      null,
  _running:  false,
  _eventIdx: 0,
  _phase:    'playing',  // 'playing' | 'result' | 'done'
  _medals:   [],

  _sprint:  { progress: 0, lastKey: '', time: 0, done: false },
  _jump:    { power: 0, filling: false, done: false },
  _javelin: { pointer: 0.5, dir: 1, speed: 1.4, thrown: false },

  _EVENTS: [
    { id: 'sprint',  icon: '🏃', name: 'Sprint 100m',      hint: 'Alterne A et D rapidement !' },
    { id: 'jump',    icon: '🦘', name: 'Saut en longueur',  hint: 'Maintiens Espace · Relâche dans la zone dorée !' },
    { id: 'javelin', icon: '🏹', name: 'Lancer du javelot', hint: 'Clique quand le curseur est dans la zone !' },
  ],

  _build() {
    if (document.getElementById('ath2-overlay')) return;
    const el = document.createElement('div');
    el.id = 'ath2-overlay';
    el.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.9);justify-content:center;align-items:center;z-index:200;';
    el.innerHTML = `
      <div style="background:#1a1a2e;border:2px solid #4a4a6a;border-radius:16px;padding:20px;
                  min-width:340px;max-width:490px;text-align:center;font-family:Arial,sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <h2 style="color:#fff;margin:0;font-size:1.15em">🏅 Athlétisme</h2>
          <button id="ath2-exit" style="background:#2c2c44;color:#ccc;border:1px solid #555;
            padding:5px 12px;border-radius:8px;cursor:pointer;font-size:0.9em;">T — Partir</button>
        </div>
        <div id="ath2-event-name" style="color:#f1c40f;font-size:1.05em;margin:4px 0"></div>
        <div id="ath2-hint" style="color:#777;font-size:0.85em;margin:4px 0 8px"></div>
        <canvas id="ath2-canvas" width="440" height="160"
          style="border-radius:8px;display:block;margin:0 auto"></canvas>
        <div id="ath2-msg" style="color:#88ff88;margin:7px 0;font-size:0.95em;min-height:1.3em"></div>
        <div id="ath2-medals" style="display:flex;justify-content:center;gap:18px;margin:7px 0;font-size:1.5em"></div>
        <button id="ath2-action" style="display:none;margin-top:8px;background:#2980b9;color:#fff;
          border:none;padding:11px 26px;border-radius:8px;font-size:1em;cursor:pointer;
          touch-action:manipulation;user-select:none;">Faire ça !</button>
      </div>
    `;
    document.body.appendChild(el);
    this._el     = el;
    this._canvas = document.getElementById('ath2-canvas');
    this._ctx    = this._canvas.getContext('2d');

    document.getElementById('ath2-exit').addEventListener('click', () => Athletisme.exit());
    document.getElementById('ath2-exit').addEventListener('touchstart', e => {
      e.preventDefault(); Athletisme.exit();
    }, { passive: false });

    const btn = document.getElementById('ath2-action');
    const startPress = e => { e.preventDefault(); this._jump.filling = true; this._onJavelinThrow(); };
    const endPress   = e => { e.preventDefault(); this._jump.filling = false; };
    btn.addEventListener('mousedown',  startPress);
    btn.addEventListener('touchstart', startPress, { passive: false });
    btn.addEventListener('mouseup',    endPress);
    btn.addEventListener('mouseleave', endPress);
    btn.addEventListener('touchend',   endPress, { passive: false });
  },

  _onJavelinThrow() {
    if (this._phase !== 'playing') return;
    const ev = this._EVENTS[this._eventIdx];
    if (ev.id !== 'javelin' || this._javelin.thrown) return;
    this._javelin.thrown = true;
    const d = Math.abs(this._javelin.pointer - 0.5);
    const medal = d < 0.05 ? 'gold' : d < 0.12 ? 'silver' : d < 0.22 ? 'bronze' : 'none';
    this._finishEvent(medal);
  },

  enter() {
    if (State.inWorkMode) return;
    this._build();
    State.inWorkMode = true;
    this._running    = true;
    this._eventIdx   = 0;
    this._medals     = [];
    this._phase      = 'playing';
    this._el.style.display = 'flex';
    this._startEvent();
  },

  exit() {
    if (!State.inWorkMode) return;
    State.inWorkMode = false;
    this._running    = false;
    this._el.style.display = 'none';

    const g = this._medals.filter(m => m === 'gold').length;
    const s = this._medals.filter(m => m === 'silver').length;
    const b = this._medals.filter(m => m === 'bronze').length;
    const pts = g * 3 + s * 2 + b;
    const pay = State.currentJob
      ? Math.round(State.currentJob.salary * Math.max(0.1, pts / 9) * 2.2)
      : 0;
    if (pay > 0) Jobs.earnFromWork(pay);
    else Jobs._notify('Aucune médaille, aucune prime.', '#ffaa44');
  },

  _startEvent() {
    const ev = this._EVENTS[this._eventIdx];
    document.getElementById('ath2-event-name').textContent = ev.icon + ' ' + ev.name;
    document.getElementById('ath2-hint').textContent = ev.hint;
    document.getElementById('ath2-msg').textContent = '';
    this._phase = 'playing';
    this._renderMedals();

    if (ev.id === 'sprint') {
      this._sprint = { progress: 0, lastKey: '', time: 0, done: false };
      document.getElementById('ath2-action').style.display = 'none';
    } else if (ev.id === 'jump') {
      this._jump = { power: 0, filling: false, done: false };
      const btn = document.getElementById('ath2-action');
      btn.style.display = 'block';
      btn.textContent   = 'Maintenir pour charger !';
    } else if (ev.id === 'javelin') {
      this._javelin = { pointer: 0.5, dir: 1, speed: 1.4, thrown: false };
      const btn = document.getElementById('ath2-action');
      btn.style.display = 'block';
      btn.textContent   = '🏹 Lancer !';
    }
  },

  _renderMedals() {
    const ico = { gold: '🥇', silver: '🥈', bronze: '🥉', none: '❌' };
    let html = '';
    for (let i = 0; i < 3; i++) {
      if (i < this._medals.length) html += `<span>${ico[this._medals[i]]}</span>`;
      else if (i === this._eventIdx) html += `<span style="opacity:0.5">🏅</span>`;
      else html += `<span style="opacity:0.2">⬜</span>`;
    }
    document.getElementById('ath2-medals').innerHTML = html;
  },

  _finishEvent(medal) {
    this._medals.push(medal);
    this._phase = 'result';
    const lbl = {
      gold:   '🥇 Médaille d\'or !',
      silver: '🥈 Médaille d\'argent !',
      bronze: '🥉 Médaille de bronze !',
      none:   '❌ Aucune médaille',
    };
    document.getElementById('ath2-msg').textContent = lbl[medal];
    document.getElementById('ath2-action').style.display = 'none';
    this._renderMedals();

    setTimeout(() => {
      if (!this._running) return;
      this._eventIdx++;
      if (this._eventIdx >= this._EVENTS.length) {
        this._phase = 'done';
        document.getElementById('ath2-msg').textContent = '🏁 Terminé ! Appuie sur T pour ta paie.';
      } else {
        this._startEvent();
      }
    }, 2200);
  },

  tick(delta) {
    if (!State.inWorkMode || !this._running) return;
    if (this._phase === 'done' || this._phase === 'result') return;

    const id = this._EVENTS[this._eventIdx].id;
    if (id === 'sprint')  this._tickSprint(delta);
    if (id === 'jump')    this._tickJump(delta);
    if (id === 'javelin') this._tickJavelin(delta);
    this._draw(id);
  },

  _tickSprint(delta) {
    const s = this._sprint;
    if (s.done) return;
    s.time += delta;
    const aKey = State.keys['KeyA'] || State.keys['ArrowLeft'];
    const dKey = State.keys['KeyD'] || State.keys['ArrowRight'];
    if (aKey && s.lastKey !== 'a') { s.lastKey = 'a'; s.progress = Math.min(1, s.progress + 0.065); }
    if (dKey && s.lastKey !== 'd') { s.lastKey = 'd'; s.progress = Math.min(1, s.progress + 0.065); }
    s.progress = Math.max(0, s.progress - 0.013);
    if (s.progress >= 1) {
      s.done = true;
      const medal = s.time < 5 ? 'gold' : s.time < 7.5 ? 'silver' : s.time < 11 ? 'bronze' : 'none';
      this._finishEvent(medal);
    }
  },

  _tickJump(delta) {
    const j = this._jump;
    if (j.done) return;
    if (State.keys['Space'] || j.filling) {
      j.power = Math.min(1.08, j.power + delta * 0.55);
    } else if (j.power > 0) {
      j.done = true;
      const p     = j.power;
      const medal = (p >= 0.72 && p <= 0.92) ? 'gold'
                  : (p >= 0.55 && p <= 1.0)  ? 'silver'
                  : (p >= 0.40)              ? 'bronze'
                  : 'none';
      this._finishEvent(medal);
      return;
    }
    if (j.power > 1.0 && !j.done) { j.done = true; this._finishEvent('none'); }
  },

  _tickJavelin(delta) {
    const j = this._javelin;
    if (j.thrown) return;
    j.pointer += j.dir * j.speed * delta;
    if (j.pointer >= 1) { j.pointer = 1; j.dir = -1; j.speed = Math.min(j.speed * 1.08, 3.5); }
    if (j.pointer <= 0) { j.pointer = 0; j.dir =  1; j.speed = Math.min(j.speed * 1.08, 3.5); }
  },

  _draw(evId) {
    const ctx = this._ctx, W = this._canvas.width, H = this._canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    if (evId === 'sprint')  this._drawSprint(ctx, W, H);
    if (evId === 'jump')    this._drawJump(ctx, W, H);
    if (evId === 'javelin') this._drawJavelin(ctx, W, H);
  },

  _drawSprint(ctx, W, H) {
    const s = this._sprint;
    ctx.fillStyle = '#c09040'; ctx.fillRect(28, H*0.44, W-56, 38);
    ctx.strokeStyle = '#fff8'; ctx.lineWidth = 2; ctx.setLineDash([10,8]);
    ctx.beginPath(); ctx.moveTo(28, H*0.63); ctx.lineTo(W-28, H*0.63); ctx.stroke();
    ctx.setLineDash([]);

    const rx = 30 + s.progress * (W-60);
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.arc(rx, H*0.44+11, 11, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(rx, H*0.56); ctx.lineTo(rx, H*0.73); ctx.stroke();

    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(W-30, H*0.38); ctx.lineTo(W-30, H*0.85); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${s.time.toFixed(1)}s`, W/2, 22);
    ctx.font = '12px Arial'; ctx.fillStyle = '#aaa';
    ctx.fillText('🥇 < 5s   🥈 < 7.5s   🥉 < 11s', W/2, H-5);
  },

  _drawJump(ctx, W, H) {
    const j = this._jump;
    const bx=48, bw=W-96, bh=28, by=18;
    ctx.fillStyle='#2c3e50'; ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,8); ctx.fill();
    ctx.fillStyle='rgba(189,195,199,0.45)'; ctx.beginPath(); ctx.roundRect(bx+bw*0.55,by,bw*0.45,bh,4); ctx.fill();
    ctx.fillStyle='rgba(241,196,15,0.75)'; ctx.beginPath(); ctx.roundRect(bx+bw*0.72,by,bw*0.20,bh,4); ctx.fill();
    ctx.fillStyle='rgba(231,76,60,0.7)';   ctx.beginPath(); ctx.roundRect(bx+bw*0.96,by,bw*0.04,bh,4); ctx.fill();

    const p  = Math.min(1.05, j.power);
    const fc = p>1.0 ? '#e74c3c' : p>0.72 ? '#f1c40f' : p>0.55 ? '#27ae60' : '#2980b9';
    ctx.fillStyle = fc; ctx.beginPath(); ctx.roundRect(bx,by,bw*Math.min(1,p),bh,8); ctx.fill();

    const sx = 55 + j.power*(W-200), sy = H*0.76, cr = j.filling ? 6 : 0;
    ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(sx,sy-32+cr,8,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx,sy-24+cr); ctx.lineTo(sx,sy-6+cr); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx,sy-6+cr); ctx.lineTo(sx-13,sy+10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx,sy-6+cr); ctx.lineTo(sx+13,sy+10); ctx.stroke();

    ctx.fillStyle='#fff'; ctx.font='bold 14px Arial'; ctx.textAlign='center';
    ctx.fillText(`Puissance : ${Math.round(j.power*100)}%`, W/2, H-6);
    if (j.power>1.0) { ctx.fillStyle='#e74c3c'; ctx.fillText('⚠ FAUTE — trop fort !', W/2, H-22); }
    else if (j.power>=0.72) { ctx.fillStyle='#f1c40f'; ctx.fillText('Zone dorée — relâche !', W/2, H-22); }
  },

  _drawJavelin(ctx, W, H) {
    const j = this._javelin;
    const bx=48, bw=W-96, bh=28, by=18;
    ctx.fillStyle='#2c3e50'; ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,8); ctx.fill();
    ctx.fillStyle='rgba(205,127,50,0.5)';   ctx.beginPath(); ctx.roundRect(bx+bw*0.28,by,bw*0.44,bh,4); ctx.fill();
    ctx.fillStyle='rgba(189,195,199,0.6)';  ctx.beginPath(); ctx.roundRect(bx+bw*0.38,by,bw*0.24,bh,4); ctx.fill();
    ctx.fillStyle='rgba(241,196,15,0.85)';  ctx.beginPath(); ctx.roundRect(bx+bw*0.45,by,bw*0.10,bh,4); ctx.fill();

    const px = bx + j.pointer * bw;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.moveTo(px,by-4); ctx.lineTo(px-7,by-16); ctx.lineTo(px+7,by-16); ctx.closePath(); ctx.fill();

    const tx=68, ty=H*0.82;
    ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(tx,ty-38,8,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx,ty-30); ctx.lineTo(tx,ty-10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx,ty-10); ctx.lineTo(tx-12,ty+10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx,ty-10); ctx.lineTo(tx+12,ty+10); ctx.stroke();
    const armA = -0.9 - j.pointer*0.4;
    ctx.beginPath(); ctx.moveTo(tx,ty-22); ctx.lineTo(tx+Math.cos(armA)*40,ty-22+Math.sin(armA)*40); ctx.stroke();
    ctx.strokeStyle='#f1c40f'; ctx.lineWidth=2;
    const ja=tx+Math.cos(armA)*15, jb=ty-22+Math.sin(armA)*15;
    ctx.beginPath(); ctx.moveTo(ja,jb); ctx.lineTo(ja+Math.cos(armA)*88,jb+Math.sin(armA)*88); ctx.stroke();

    ctx.fillStyle='#fff'; ctx.font='bold 13px Arial'; ctx.textAlign='center';
    ctx.fillText('🏹 Clique quand le curseur est dans la zone !', W/2, H-5);
  },
};
