// Mondes 3D pour les métiers WorkOverlay (mobile)
const MondeTravail = {
  _active: false,
  _scene: null,
  _camera: null,
  _jobId: null,
  _hud: null,
  _ctrl: null,

  // Player
  _px: 0, _pz: 8, _rotY: 0,
  _EYE: 1.65,
  _SPEED: 5,

  // Touch joystick state
  _joyActive: false,
  _joyStartX: 0, _joyStartY: 0,
  _joyDX: 0, _joyDY: 0,
  _lookStartX: 0, _lookTouchId: -1,
  _interactHeld: false,

  // Tasks
  _tasks: [],
  _tasksDone: 0,
  _interactTimer: 0,
  _nearTask: null,
  _HOLD_TIME: 2.0,
  _flashTimer: 0,
  _doneTimer: -1,

  _JOBS: {
    farm:       { title: '🌾 Ferme',       sky: '#1a3a0a', ground: 0x4a7c20, count: 6, pay: 18, label: 'Récolter'    },
    cashier:    { title: '🛒 Caisse',      sky: '#1a1a2a', ground: 0x666677, count: 3, pay: 12, label: 'Scanner'     },
    worker:     { title: '🔨 Chantier',    sky: '#2a1a0a', ground: 0x6b5020, count: 5, pay: 15, label: 'Construire'  },
    chef:       { title: '👨‍🍳 Cuisine',    sky: '#0a0a1a', ground: 0x888888, count: 5, pay: 28, label: 'Cuisiner'    },
    security:   { title: '🛡️ Sécurité',   sky: '#0a0a10', ground: 0x2a2a2a, count: 5, pay: 20, label: 'Neutraliser' },
    nurse:      { title: '💉 Infirmerie',  sky: '#001a2a', ground: 0xf0f0f0, count: 4, pay: 25, label: 'Soigner'     },
    doctor:     { title: '🩺 Hôpital',    sky: '#001a2a', ground: 0xe8f0e8, count: 4, pay: 45, label: 'Traiter'     },
    hotel:      { title: '🏨 Hôtel',      sky: '#0a0820', ground: 0xc8a870, count: 5, pay: 32, label: 'Préparer'    },
    football:   { title: '⚽ Stade',      sky: '#000a20', ground: 0x2d7a2d, count: 5, pay: 28, label: 'Tirer'       },
    consultant: { title: '📊 Bureau',     sky: '#0a0a18', ground: 0x444455, count: 5, pay: 35, label: 'Analyser'    },
    banker:     { title: '🏦 Banque',     sky: '#0a0818', ground: 0x1a1a2a, count: 5, pay: 55, label: 'Traiter'     },
  },

  enter(jobId) {
    if (State.inWorkMode) return;
    State.inWorkMode = true;
    this._jobId = jobId;
    this._tasksDone = 0;
    this._interactTimer = 0;
    this._nearTask = null;
    this._doneTimer = -1;
    this._tasks = [];
    this._buildScene();
    this._buildHUD();
    this._bindTouch();
    this._active = true;
  },

  exit() {
    if (!this._active) return;
    this._active = false;
    State.inWorkMode = false;
    this._cleanScene();
    this._removeHUD();
    this._unbindTouch();
  },

  tick(delta) {
    if (!this._active) return;
    if (this._doneTimer >= 0) {
      this._doneTimer -= delta;
      if (this._doneTimer < 0) this._resetTasks();
      return;
    }
    this._handleMovement(delta);
    this._handleInteract(delta);
    this._animateTasks(delta);
    this._updateCamera();
    this._updateHUD();
  },

  // ── Touch controls ────────────────────────────────────────────────────────
  _bindTouch() {
    const canvas = document.getElementById('game-canvas');
    this._onTouchStart = e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const halfW = window.innerWidth / 2;
        if (t.clientX < halfW) {
          // Left half: joystick
          this._joyActive = true;
          this._joyStartX = t.clientX;
          this._joyStartY = t.clientY;
          this._joyTouchId = t.identifier;
        } else {
          // Right half: look
          this._lookStartX = t.clientX;
          this._lookTouchId = t.identifier;
        }
      }
    };
    this._onTouchMove = e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this._joyTouchId) {
          this._joyDX = (t.clientX - this._joyStartX) / 60;
          this._joyDY = (t.clientY - this._joyStartY) / 60;
        } else if (t.identifier === this._lookTouchId) {
          const dx = t.clientX - this._lookStartX;
          this._rotY -= dx * 0.004;
          this._lookStartX = t.clientX;
        }
      }
    };
    this._onTouchEnd = e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this._joyTouchId) {
          this._joyActive = false;
          this._joyDX = 0;
          this._joyDY = 0;
        }
      }
    };
    document.addEventListener('touchstart', this._onTouchStart, { passive: false });
    document.addEventListener('touchmove',  this._onTouchMove,  { passive: false });
    document.addEventListener('touchend',   this._onTouchEnd,   { passive: false });
  },

  _unbindTouch() {
    document.removeEventListener('touchstart', this._onTouchStart);
    document.removeEventListener('touchmove',  this._onTouchMove);
    document.removeEventListener('touchend',   this._onTouchEnd);
  },

  // ── Movement ─────────────────────────────────────────────────────────────
  _handleMovement(delta) {
    const speed = this._SPEED * delta;
    const sin = Math.sin(this._rotY);
    const cos = Math.cos(this._rotY);

    let dx = 0, dz = 0;
    const jx = this._joyActive ? this._joyDX : 0;
    const jy = this._joyActive ? this._joyDY : 0;

    // Clamp joystick
    const jLen = Math.sqrt(jx * jx + jy * jy);
    const njx = jLen > 1 ? jx / jLen : jx;
    const njy = jLen > 1 ? jy / jLen : jy;

    dx = (njx * cos - njy * sin) * speed * 1.2;
    dz = (njx * sin + njy * cos) * speed * 1.2;

    this._px = Math.max(-22, Math.min(22, this._px + dx));
    this._pz = Math.max(-22, Math.min(22, this._pz + dz));
  },

  // ── Interact ──────────────────────────────────────────────────────────────
  _handleInteract(delta) {
    let nearest = null;
    let nearDist = 999;
    for (const t of this._tasks) {
      if (t.done) continue;
      const dx = this._px - t.x, dz = this._pz - t.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < nearDist) { nearDist = d; nearest = t; }
    }

    const inRange = nearDist < 3.0;
    this._nearTask = inRange ? nearest : null;

    if (inRange && nearest && (State.keys['Space'] || this._interactHeld)) {
      this._interactTimer += delta;
      if (this._interactTimer >= this._HOLD_TIME) {
        this._completeTask(nearest);
        this._interactTimer = 0;
      }
    } else {
      this._interactTimer = Math.max(0, this._interactTimer - delta * 2);
    }
  },

  _completeTask(task) {
    task.done = true;
    if (task.mesh) {
      task.mesh.material.color.setHex(0x44ff44);
      task.mesh.material.emissive.setHex(0x004400);
    }
    this._tasksDone++;
    const cfg = this._JOBS[this._jobId];
    if (this._tasksDone >= cfg.count) {
      Jobs.earnFromWork(cfg.pay);
      this._doneTimer = 1.5;
    }
  },

  _resetTasks() {
    this._tasksDone = 0;
    this._interactTimer = 0;
    this._nearTask = null;
    for (const t of this._tasks) {
      t.done = false;
      if (t.mesh) {
        t.mesh.material.color.setHex(t.baseColor);
        t.mesh.material.emissive.setHex(t.baseEmissive);
      }
    }
  },

  _animateTasks(delta) {
    this._flashTimer += delta * 2;
    for (const t of this._tasks) {
      if (t.done || !t.mesh) continue;
      t.mesh.position.y = t.baseY + Math.sin(this._flashTimer + t.phase) * 0.15;
      t.mesh.material.emissiveIntensity = 0.4 + 0.6 * Math.abs(Math.sin(this._flashTimer + t.phase));
    }
  },

  _updateCamera() {
    this._camera.position.set(this._px, this._EYE, this._pz);
    this._camera.rotation.order = 'YXZ';
    this._camera.rotation.y = this._rotY;
    this._camera.rotation.x = 0;
  },

  // ── HUD ───────────────────────────────────────────────────────────────────
  _buildHUD() {
    this._removeHUD();
    const cfg = this._JOBS[this._jobId];
    const hud = document.createElement('div');
    hud.id = 'mt-hud';
    hud.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:300;font-family:Arial,sans-serif;';
    hud.innerHTML = `
      <div id="mt-title" style="position:absolute;top:14px;left:50%;transform:translateX(-50%);color:#f1c40f;font-size:1.2em;font-weight:bold;text-shadow:0 2px 6px #000">${cfg.title}</div>
      <div id="mt-score" style="position:absolute;top:44px;left:50%;transform:translateX(-50%);color:#fff;font-size:0.95em;text-shadow:0 2px 4px #000">0 / ${cfg.count}</div>
      <div id="mt-hint" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#ccc;font-size:0.9em;text-shadow:0 2px 4px #000;text-align:center;margin-top:60px"></div>
      <div id="mt-bar-wrap" style="position:absolute;bottom:130px;left:50%;transform:translateX(-50%);width:160px;height:10px;background:rgba(0,0,0,0.5);border-radius:5px;border:1px solid rgba(255,255,255,0.3);display:none">
        <div id="mt-bar" style="height:100%;background:#f1c40f;border-radius:5px;width:0%"></div>
      </div>
      <div id="mt-done-msg" style="position:absolute;top:40%;left:50%;transform:translate(-50%,-50%);color:#44ff88;font-size:1.8em;font-weight:bold;text-shadow:0 4px 12px #000;display:none">✓ Bien joué !</div>
    `;
    document.body.appendChild(hud);
    this._hud = hud;

    // Touch controls overlay
    const ctrl = document.createElement('div');
    ctrl.id = 'mt-ctrl';
    ctrl.style.cssText = 'position:fixed;bottom:0;left:0;right:0;height:140px;pointer-events:none;z-index:301;display:flex;justify-content:space-between;align-items:flex-end;padding:12px;';
    ctrl.innerHTML = `
      <div id="mt-joy-zone" style="width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,0.08);border:2px solid rgba(255,255,255,0.2);pointer-events:auto;touch-action:none;display:flex;align-items:center;justify-content:center;">
        <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.25);"></div>
      </div>
      <button id="mt-act-btn" style="width:90px;height:90px;border-radius:50%;background:rgba(241,196,15,0.3);border:3px solid rgba(241,196,15,0.7);color:#f1c40f;font-size:1em;font-weight:bold;pointer-events:auto;touch-action:none;cursor:pointer;">Agir</button>
      <button id="mt-quit-btn" style="position:fixed;top:14px;right:14px;background:rgba(200,60,60,0.4);border:1px solid rgba(255,100,100,0.5);color:#ffaaaa;padding:10px 16px;border-radius:8px;font-size:0.88em;pointer-events:auto;touch-action:manipulation;">✕ Quitter</button>
    `;
    document.body.appendChild(ctrl);
    this._ctrl = ctrl;

    const actBtn = document.getElementById('mt-act-btn');
    if (actBtn) {
      actBtn.addEventListener('touchstart', e => { e.preventDefault(); this._interactHeld = true; }, { passive: false });
      actBtn.addEventListener('touchend',   e => { e.preventDefault(); this._interactHeld = false; }, { passive: false });
    }
    const quitBtn = document.getElementById('mt-quit-btn');
    if (quitBtn) {
      quitBtn.addEventListener('touchstart', e => { e.preventDefault(); if (typeof Jobs !== 'undefined') Jobs.exitWork(); }, { passive: false });
    }
  },

  _updateHUD() {
    const cfg = this._JOBS[this._jobId];
    const scoreEl = document.getElementById('mt-score');
    if (scoreEl) scoreEl.textContent = `${this._tasksDone} / ${cfg.count}`;

    const doneMsg = document.getElementById('mt-done-msg');
    if (doneMsg) doneMsg.style.display = (this._doneTimer >= 0) ? 'block' : 'none';

    const hintEl  = document.getElementById('mt-hint');
    const barWrap = document.getElementById('mt-bar-wrap');
    const bar     = document.getElementById('mt-bar');

    if (this._nearTask && this._doneTimer < 0) {
      if (hintEl) hintEl.textContent = `Appuyer sur Agir pour ${cfg.label}`;
      if (this._interactTimer > 0) {
        if (barWrap) barWrap.style.display = 'block';
        if (bar) bar.style.width = (this._interactTimer / this._HOLD_TIME * 100) + '%';
      } else {
        if (barWrap) barWrap.style.display = 'none';
      }
    } else {
      if (hintEl) hintEl.textContent = '';
      if (barWrap) barWrap.style.display = 'none';
    }
  },

  _removeHUD() {
    if (this._hud)  { this._hud.remove();  this._hud = null; }
    if (this._ctrl) { this._ctrl.remove(); this._ctrl = null; }
    ['mt-hud','mt-ctrl'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });
  },

  // ── Scene ─────────────────────────────────────────────────────────────────
  _buildScene() {
    this._cleanScene();
    const cfg = this._JOBS[this._jobId];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(cfg.sky);
    scene.fog = new THREE.Fog(cfg.sky, 30, 60);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(10, 20, 10);
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshLambertMaterial({ color: cfg.ground })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const wallMat = new THREE.MeshLambertMaterial({ color: cfg.ground, side: THREE.BackSide });
    const box = new THREE.Mesh(new THREE.BoxGeometry(50, 10, 50), wallMat);
    box.position.y = 5;
    scene.add(box);

    this._scene = scene;
    this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

    this[`_build_${this._jobId}`](scene);
    this._px = 0; this._pz = 8;
    this._rotY = 0;
  },

  _makeTask(scene, x, y, z, color, phase) {
    const mat = new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.5 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    const t = { mesh, x, z, done: false, baseY: y, phase: phase || 0, baseColor: color, baseEmissive: color };
    this._tasks.push(t);
    return t;
  },

  _addBox(scene, x, y, z, w, h, d, color) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  },

  _addCyl(scene, x, y, z, rt, rb, h, seg, color) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), new THREE.MeshLambertMaterial({ color }));
    m.position.set(x, y, z);
    scene.add(m);
    return m;
  },

  // ── World builders (identical to desktop) ────────────────────────────────

  _build_farm(scene) {
    this._addBox(scene, -14, 3, -14, 8, 6, 6, 0xaa3311);
    this._addBox(scene, -14, 6.5, -14, 8.5, 0.5, 6.5, 0x882200);
    [[12, 0, -12], [16, 0, 5], [-8, 0, 14]].forEach(([x,,z]) => {
      this._addCyl(scene, x, 1, z, 0.2, 0.3, 2, 6, 0x5c3317);
      this._addBox(scene, x, 3.5, z, 2.5, 4, 2.5, 0x226611);
    });
    for (let i = -20; i <= 20; i += 4) {
      this._addBox(scene, i, 0.75, -20, 0.3, 1.5, 0.3, 0x8b6914);
      this._addBox(scene, i, 0.75, 20, 0.3, 1.5, 0.3, 0x8b6914);
      this._addBox(scene, -20, 0.75, i, 0.3, 1.5, 0.3, 0x8b6914);
      this._addBox(scene, 20, 0.75, i, 0.3, 1.5, 0.3, 0x8b6914);
    }
    [[-6,0,-4],[0,0,-4],[6,0,-4],[-6,0,2],[0,0,2],[6,0,2]].forEach(([x,,z], i) => {
      this._addCyl(scene, x, 0.6, z, 0.05, 0.08, 1.2, 5, 0x88aa00);
      this._makeTask(scene, x, 1.5, z, 0xffd700, i);
    });
  },

  _build_cashier(scene) {
    this._addBox(scene, 0, 5, 0, 40, 0.2, 40, 0xcccccc);
    this._addBox(scene, 0, 2.5, -18, 40, 5, 0.3, 0xddddbb);
    this._addBox(scene, 0, 2.5, 18, 40, 5, 0.3, 0xddddbb);
    for (let sx = -12; sx <= 12; sx += 6) {
      this._addBox(scene, sx, 1.5, -14, 4, 3, 0.8, 0x886644);
    }
    [[-6, 0], [0, 0], [6, 0]].forEach(([cx,], i) => {
      this._addBox(scene, cx, 0.5, -2, 1.5, 1, 5, 0x444466);
      this._addBox(scene, cx, 1.02, -2, 1.2, 0.05, 4, 0x222222);
      this._makeTask(scene, cx, 1.4, 0, 0xff6600, i);
    });
    [[-6], [0], [6]].forEach(([cx]) => {
      this._addBox(scene, cx, 1.6, -4.5, 0.8, 0.6, 0.1, 0x222244);
    });
  },

  _build_worker(scene) {
    for (let sx = -8; sx <= 8; sx += 4) {
      this._addCyl(scene, sx, 3, -8, 0.15, 0.15, 6, 6, 0x888844);
      this._addCyl(scene, sx, 3, 8, 0.15, 0.15, 6, 6, 0x888844);
    }
    this._addBox(scene, 0, 5.9, -8, 18, 0.15, 0.15, 0x888844);
    this._addBox(scene, 0, 5.9, 8, 18, 0.15, 0.15, 0x888844);
    for (let i = 0; i < 3; i++) {
      this._addBox(scene, -10 + i * 4, 1, -12, 3.5, 2, 0.4, 0x999980);
    }
    [[-14, 0, -14], [14, 0, -14]].forEach(([x,,z]) => {
      this._addBox(scene, x, 0.5, z, 1.5, 1, 1.5, 0x886633);
    });
    [[-6,0,0],[0,0,0],[6,0,0],[-3,0,-6],[3,0,-6]].forEach(([x,,z], i) => {
      this._addBox(scene, x, 0.5, z, 1, 0.8, 1, 0xaa9960);
      this._makeTask(scene, x, 1.2, z, 0xffaa00, i);
    });
  },

  _build_chef(scene) {
    this._addBox(scene, 0, 5, 0, 40, 0.2, 40, 0xeeeeee);
    this._addBox(scene, 0, 2.5, -18, 40, 5, 0.3, 0xffeedd);
    for (let cx = -10; cx <= 10; cx += 5) {
      this._addBox(scene, cx, 0.5, -6, 3.5, 1, 1.5, 0xdddddd);
    }
    for (let cx = -8; cx <= 8; cx += 4) {
      this._addBox(scene, cx, 0.5, -15, 2, 1, 1, 0x444444);
      this._addCyl(scene, cx - 0.4, 1.3, -15, 0.4, 0.4, 0.6, 8, 0x555555);
    }
    [[-8,0,-2],[0,0,-2],[8,0,-2],[-4,0,4],[4,0,4]].forEach(([x,,z], i) => {
      this._makeTask(scene, x, 1.4, z, 0xff4444, i);
    });
  },

  _build_security(scene) {
    this._addBox(scene, 0, 5, 0, 40, 0.2, 40, 0x1a1a1a);
    for (let i = -10; i <= 10; i += 10) {
      this._addBox(scene, i, 1.5, 0, 0.2, 3, 14, 0x222222);
    }
    for (let cx = -10; cx <= 10; cx += 5) {
      this._addBox(scene, cx, 0.5, -12, 1.5, 1, 0.8, 0x333333);
      this._addBox(scene, cx, 1.35, -12, 1.2, 0.8, 0.1, 0x112211);
    }
    [[-8,0,6],[0,0,8],[8,0,6],[-4,0,-2],[4,0,-2]].forEach(([x,,z], i) => {
      this._makeTask(scene, x, 1.0, z, 0xff2222, i);
    });
  },

  _build_nurse(scene) {
    this._addBox(scene, 0, 5, 0, 40, 0.2, 40, 0xffffff);
    [[-8, 0, -6], [0, 0, -6], [8, 0, -6], [0, 0, 4]].forEach(([x,,z], i) => {
      this._addBox(scene, x, 0.35, z, 2, 0.7, 4, 0xddddff);
      this._addBox(scene, x, 0.75, z + 1.5, 2, 0.3, 1, 0xffffff);
      this._makeTask(scene, x, 1.5, z, 0x44aaff, i);
    });
    this._addBox(scene, 0, 0.5, 10, 5, 1, 2, 0xccddff);
  },

  _build_doctor(scene) {
    this._addBox(scene, 0, 5, 0, 40, 0.2, 40, 0xffffff);
    [[-8, 0, -4], [0, 0, -4], [8, 0, -4], [0, 0, 6]].forEach(([x,,z], i) => {
      this._addBox(scene, x, 0.5, z, 2, 1, 4, 0xcccccc);
      this._addBox(scene, x, 1.02, z, 2, 0.06, 4, 0x88aaaa);
      this._makeTask(scene, x, 1.8, z, 0x00ddff, i);
    });
    this._addBox(scene, -15, 1.5, -10, 1.5, 3, 1, 0xaaaaaa);
    this._addBox(scene, 15, 1.5, -10, 1.5, 3, 1, 0xaaaaaa);
  },

  _build_hotel(scene) {
    this._addBox(scene, 0, 5, 0, 40, 0.2, 40, 0xffe8cc);
    this._addBox(scene, 0, 2.5, -18, 40, 5, 0.3, 0xddcc99);
    [[-12, 0, -16], [-6, 0, -16], [0, 0, -16], [6, 0, -16], [12, 0, -16]].forEach(([x,,z], i) => {
      this._addBox(scene, x, 1.1, z, 1.8, 2.2, 0.3, 0x886633);
      this._makeTask(scene, x, 2.0, z + 0.5, 0xffdd44, i);
    });
    this._addBox(scene, 0, 0.01, 0, 4, 0.02, 36, 0x882244);
  },

  _build_football(scene) {
    this._addBox(scene, 0, 0.01, 0, 36, 0.02, 24, 0x246820);
    this._addBox(scene, 0, 0.02, 0, 0.1, 0.03, 24, 0xffffff);
    this._addCyl(scene, 0, 0.02, 0, 4, 4, 0.03, 24, 0xffffff);
    [[-17, 0, 0], [17, 0, 0]].forEach(([x,,z]) => {
      this._addBox(scene, x, 1.1, z, 0.1, 2.2, 5, 0xffffff);
      this._addBox(scene, x, 2.2, z, 0.1, 0.1, 5, 0xffffff);
    });
    [[-10,0,-4],[0,0,-4],[10,0,-4],[-5,0,4],[5,0,4]].forEach(([x,,z], i) => {
      this._makeTask(scene, x, 0.7, z, 0xeeeeee, i);
    });
    for (let sx = -16; sx <= 16; sx += 4) {
      this._addBox(scene, sx, 1, -18, 1.5, 2, 1, 0x336699);
      this._addBox(scene, sx, 1, 18, 1.5, 2, 1, 0x336699);
    }
  },

  _build_consultant(scene) {
    this._addBox(scene, 0, 5, 0, 40, 0.2, 40, 0x1a1a2a);
    for (let i = -12; i <= 12; i += 6) {
      this._addBox(scene, i, 0.8, 0, 0.1, 1.6, 10, 0x334455);
    }
    [[-9,0,-4],[-3,0,-4],[3,0,-4],[9,0,-4],[0,0,6]].forEach(([x,,z], i) => {
      this._addBox(scene, x, 0.4, z, 2.5, 0.8, 1.2, 0x4a4a5a);
      this._addBox(scene, x, 1.1, z - 0.3, 1.5, 1.0, 0.08, 0x222233);
      this._addBox(scene, x, 0.88, z - 0.3, 1.3, 0.7, 0.06, 0x1a3a6a);
      this._makeTask(scene, x, 1.8, z, 0x44aaff, i);
    });
  },

  _build_banker(scene) {
    this._addBox(scene, 0, 5, 0, 40, 0.2, 40, 0x0a0818);
    this._addBox(scene, 0, 0.6, -5, 28, 1.2, 1.5, 0x2a2050);
    this._addBox(scene, 0, 1.22, -5, 28, 0.06, 1.6, 0x888866);
    for (let cx = -12; cx <= 12; cx += 6) {
      this._addBox(scene, cx, 1.8, -5, 0.1, 1.2, 1.6, 0x88aacc);
    }
    this._addBox(scene, 0, 2, -16, 4, 4, 0.4, 0x554422);
    this._addCyl(scene, 0, 2, -15.8, 1.5, 1.5, 0.3, 16, 0x888866);
    [[-14, 0, 5], [14, 0, 5], [-14, 0, -14], [14, 0, -14]].forEach(([x,,z]) => {
      this._addCyl(scene, x, 2.5, z, 0.5, 0.5, 5, 8, 0x443388);
    });
    [[-12,0,2],[-6,0,2],[0,0,2],[6,0,2],[12,0,2]].forEach(([x,,z], i) => {
      this._addCyl(scene, x, 0.5, z, 0.3, 0.3, 1, 6, 0x444466);
      this._makeTask(scene, x, 1.5, z, 0xffcc00, i);
    });
  },

  // ── Cleanup ────────────────────────────────────────────────────────────────
  _cleanScene() {
    this._scene = null;
    this._camera = null;
    this._tasks = [];
  },
};
