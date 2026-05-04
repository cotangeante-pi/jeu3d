// Circuit de Vitesse — mode Record (chrono solo) + mode Pistes (IA)
const CircuitVitesse = {
  _active: false,
  _scene: null,
  _camera: null,
  _mode: null,        // 'record' | 'pistes'
  _trackIdx: 0,
  _aiCount: 3,
  _ghostEnabled: true,
  _overlay: null,
  _hud: null,

  // ── Pistes ────────────────────────────────────────────────────────────────
  _TRACKS: [
    {
      id: 'ovale', name: 'Ovale', difficulty: 1, laps: 3,
      color: 0x4CAF50, skyColor: '#1a3a1a',
      gen() {
        const pts = [];
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * 130, 0, Math.sin(a) * 65));
        }
        return pts;
      }
    },
    {
      id: 'lac', name: 'Lac', difficulty: 2, laps: 3,
      color: 0x2196F3, skyColor: '#0a1a2e',
      gen() {
        return [
          new THREE.Vector3(0, 0, -160), new THREE.Vector3(80, 0, -140),
          new THREE.Vector3(160, 0, -80), new THREE.Vector3(180, 0, 0),
          new THREE.Vector3(140, 0, 90), new THREE.Vector3(60, 0, 140),
          new THREE.Vector3(-40, 0, 160), new THREE.Vector3(-130, 0, 110),
          new THREE.Vector3(-170, 0, 20), new THREE.Vector3(-150, 0, -80),
          new THREE.Vector3(-80, 0, -150), new THREE.Vector3(-10, 0, -160),
        ];
      }
    },
    {
      id: 'montagne', name: 'Montagne', difficulty: 3, laps: 2,
      color: 0xFF5722, skyColor: '#2a1a0a',
      gen() {
        return [
          new THREE.Vector3(0, 0, -120), new THREE.Vector3(60, 4, -90),
          new THREE.Vector3(110, 10, -30), new THREE.Vector3(120, 14, 40),
          new THREE.Vector3(80, 18, 100), new THREE.Vector3(20, 12, 130),
          new THREE.Vector3(-50, 6, 120), new THREE.Vector3(-110, 2, 70),
          new THREE.Vector3(-130, 0, 0), new THREE.Vector3(-110, 2, -70),
          new THREE.Vector3(-60, 6, -110), new THREE.Vector3(-10, 2, -125),
        ];
      }
    },
    {
      id: 'cite', name: 'Circuit Urbain', difficulty: 4, laps: 3,
      color: 0x9C27B0, skyColor: '#0a0a1a',
      gen() {
        return [
          new THREE.Vector3(0, 0, -90), new THREE.Vector3(30, 0, -90),
          new THREE.Vector3(80, 0, -60), new THREE.Vector3(90, 0, 0),
          new THREE.Vector3(80, 0, 40), new THREE.Vector3(40, 0, 80),
          new THREE.Vector3(0, 0, 90), new THREE.Vector3(-40, 0, 80),
          new THREE.Vector3(-80, 0, 40), new THREE.Vector3(-90, 0, -20),
          new THREE.Vector3(-60, 0, -70), new THREE.Vector3(-20, 0, -90),
        ];
      }
    },
    {
      id: 'infini', name: 'Infini ∞', difficulty: 5, laps: 3,
      color: 0xF44336, skyColor: '#1a0a1a',
      gen() {
        const pts = [];
        for (let i = 0; i < 28; i++) {
          const t = (i / 28) * Math.PI * 2;
          const x = Math.sin(t) * 140;
          const z = Math.sin(t * 2) * 70;
          pts.push(new THREE.Vector3(x, 0, z));
        }
        return pts;
      }
    },
  ],

  // ── State de course ───────────────────────────────────────────────────────
  _curve: null,
  _trackLength: 1,
  _playerCar: null,
  _playerT: 0,
  _playerSpeed: 0,
  _playerOffset: 0,
  _playerLap: 0,
  _playerCpDone: null,
  _playerFinished: false,

  _aiCars: [],
  _ghostCar: null,
  _ghostFrames: [],
  _storedGhost: [],
  _raceTimer: 0,
  _lapTimer: 0,
  _bestTime: null,
  _lapTimes: [],
  _countdown: 4,
  _started: false,
  _finished: false,
  _position: 1,

  // ── Constantes physique ───────────────────────────────────────────────────
  _MAX_SPEED: 55,
  _ACCEL: 45,
  _BRAKE: 80,
  _DRAG: 0.92,
  _STEER_SPEED: 4.5,
  _TRACK_WIDTH: 12,
  _TRACK_HALF: 6,

  _AI_NAMES: ['Luca', 'Sofia', 'Max', 'Nina', 'Ryo', 'Ava', 'Diaz'],
  _AI_COLORS: [0x2196F3, 0xFFEB3B, 0x4CAF50, 0xFF9800, 0x00BCD4, 0xE91E63, 0x8BC34A],
  _PLAYER_COLOR: 0xE53935,

  // ── Entrée / Sortie ───────────────────────────────────────────────────────
  enter() {
    if (State.inWorkMode) return;
    State.inWorkMode = true;
    document.exitPointerLock();
    this._loadSettings();
    this._showSelector();
  },

  exit() {
    if (!State.inWorkMode) return;
    this._active = false;
    State.inWorkMode = false;
    State.pointerLocked = true;
    this._removeOverlay();
    this._removeHUD();
    this._cleanScene();
  },

  tick(delta) {
    if (!this._active) return;
    if (this._started && !this._finished) {
      this._raceTimer += delta;
      this._lapTimer += delta;
      this._updatePlayer(delta);
      this._updateAI(delta);
      this._updateGhost(delta);
      this._checkLap();
      this._checkAntiOverlap();
      this._updateCamera();
      this._updateHUD();
      this._rotateWheels(delta);
    } else if (!this._started) {
      this._countdown -= delta;
      this._updateCountdown();
      if (this._countdown <= 0) {
        this._started = true;
        this._lapTimer = 0;
        this._raceTimer = 0;
        this._ghostFrames = [];
      }
    }
  },

  // ── Sélecteur ─────────────────────────────────────────────────────────────
  _showSelector() {
    this._removeOverlay();
    this._ensureStyles();
    const div = document.createElement('div');
    div.id = 'cv-overlay';
    div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);display:flex;justify-content:center;align-items:center;z-index:400;font-family:Arial,sans-serif;';

    const diffStars = d => '★'.repeat(d) + '☆'.repeat(5 - d);
    const trackCards = this._TRACKS.map((tr, i) => {
      const best = this._getBest(tr.id);
      const bestStr = best ? `<span style="color:#f1c40f;font-size:0.78em">${this._fmtTime(best)}</span>` : `<span style="color:#555;font-size:0.78em">--:--.---</span>`;
      return `<label class="cv-track-card" data-idx="${i}">
        <input type="radio" name="cv-track" value="${i}" ${i === this._trackIdx ? 'checked' : ''} style="display:none">
        <span class="cv-track-name">${tr.name}</span>
        <span style="color:#f1c40f;font-size:0.88em">${diffStars(tr.difficulty)}</span>
        <span style="color:#888;font-size:0.78em">${tr.laps} tours</span>
        ${bestStr}
      </label>`;
    }).join('');

    div.innerHTML = `
      <div style="background:#0d0d0d;border:2px solid #ff4444;border-radius:18px;padding:28px 24px;min-width:340px;max-width:700px;width:94vw;max-height:96vh;overflow-y:auto;text-align:center;">
        <h2 style="color:#ff4444;margin:0 0 18px;font-size:1.4em;letter-spacing:2px">🏎 CIRCUIT DE VITESSE</h2>

        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:18px">
          <button class="cv-mode-btn ${this._mode !== 'pistes' ? 'active' : ''}" id="cv-btn-record" data-mode="record">🏆 RECORD</button>
          <button class="cv-mode-btn ${this._mode === 'pistes' ? 'active' : ''}" id="cv-btn-pistes" data-mode="pistes">🏁 PISTES</button>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:9px;justify-content:center;margin-bottom:18px">
          ${trackCards}
        </div>

        <div id="cv-options" style="margin-bottom:18px"></div>

        <div style="display:flex;gap:10px;justify-content:center">
          <button id="cv-btn-launch" class="cv-launch-btn">LANCER</button>
          <button id="cv-btn-quit" class="cv-quit-btn">✕ Quitter</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    this._overlay = div;

    this._updateOptions();

    div.querySelectorAll('.cv-mode-btn').forEach(btn => {
      btn.onclick = () => {
        this._mode = btn.dataset.mode;
        div.querySelectorAll('.cv-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._updateOptions();
      };
    });
    div.querySelectorAll('.cv-track-card').forEach(card => {
      card.onclick = () => {
        this._trackIdx = parseInt(card.dataset.idx);
        div.querySelectorAll('.cv-track-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        div.querySelectorAll('input[name="cv-track"]').forEach(r => {
          r.checked = parseInt(r.value) === this._trackIdx;
        });
        this._updateOptions();
      };
    });
    const updateSelected = () => {
      div.querySelectorAll('.cv-track-card').forEach(c => {
        c.classList.toggle('selected', parseInt(c.dataset.idx) === this._trackIdx);
      });
    };
    updateSelected();

    document.getElementById('cv-btn-launch').onclick = () => this._startRace();
    document.getElementById('cv-btn-quit').onclick = () => this.exit();
  },

  _updateOptions() {
    const box = document.getElementById('cv-options');
    if (!box) return;
    if (this._mode === 'pistes') {
      box.innerHTML = `
        <div style="color:#ccc;font-size:0.9em;margin-bottom:6px">Adversaires IA :</div>
        <div style="display:flex;gap:7px;justify-content:center;flex-wrap:wrap">
          ${[1,2,3,4,5,6,7].map(n => `<button class="cv-ai-btn ${n === this._aiCount ? 'active' : ''}" data-n="${n}">${n}</button>`).join('')}
        </div>`;
      box.querySelectorAll('.cv-ai-btn').forEach(btn => {
        btn.onclick = () => {
          this._aiCount = parseInt(btn.dataset.n);
          box.querySelectorAll('.cv-ai-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        };
      });
    } else {
      const ghost = this._ghostEnabled;
      const hasSaved = !!this._getGhost(this._TRACKS[this._trackIdx].id);
      box.innerHTML = `
        <div style="color:#ccc;font-size:0.9em;margin-bottom:6px">Ghost (voiture fantôme) :</div>
        <button id="cv-ghost-toggle" class="cv-ai-btn ${ghost ? 'active' : ''}">${ghost ? 'ON' : 'OFF'}</button>
        ${!hasSaved ? '<div style="color:#555;font-size:0.75em;margin-top:4px">Aucun ghost sauvegardé pour cette piste</div>' : ''}`;
      document.getElementById('cv-ghost-toggle').onclick = () => {
        this._ghostEnabled = !this._ghostEnabled;
        const btn = document.getElementById('cv-ghost-toggle');
        btn.textContent = this._ghostEnabled ? 'ON' : 'OFF';
        btn.classList.toggle('active', this._ghostEnabled);
      };
    }
  },

  // ── Lancement de course ───────────────────────────────────────────────────
  _startRace() {
    if (!this._mode) this._mode = 'record';
    this._saveSettings();
    this._removeOverlay();
    this._buildScene();
    this._buildTrack();
    this._buildCars();
    this._buildHUD();
    this._active = true;
    this._started = false;
    this._finished = false;
    this._countdown = 4;
    this._raceTimer = 0;
    this._lapTimer = 0;
    this._playerT = 0;
    this._playerSpeed = 0;
    this._playerOffset = 0;
    this._playerLap = 0;
    this._playerCpDone = new Set();
    this._playerFinished = false;
    this._ghostFrames = [];
    this._lapTimes = [];
    this._position = 1;

    const tr = this._TRACKS[this._trackIdx];
    this._bestTime = this._getBest(tr.id);
    if (this._mode === 'record' && this._ghostEnabled) {
      this._storedGhost = this._getGhost(tr.id) || [];
    } else {
      this._storedGhost = [];
    }
    this._buildGhostCar();

    // Ajuster la caméra pour le rendu circuit
    State.renderer.setSize(window.innerWidth, window.innerHeight);
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
  },

  // ── Construction de la scène 3D ───────────────────────────────────────────
  _buildScene() {
    this._cleanScene();
    const tr = this._TRACKS[this._trackIdx];
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x111111, 80, 500);
    scene.background = new THREE.Color(tr.skyColor);
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.position.set(80, 120, 60);
    scene.add(sun);

    // Sol
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshLambertMaterial({ color: 0x1a2a0a })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    this._scene = scene;
    this._camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 800);
  },

  _buildTrack() {
    const tr = this._TRACKS[this._trackIdx];
    const pts = tr.gen();
    this._curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
    this._trackLength = this._curve.getLength();

    const N = 300;
    const TW = this._TRACK_WIDTH;

    // Ruban de piste (surface)
    const positions = [], normals = [], uvs = [], indices = [];
    const tmpPts = this._curve.getPoints(N);

    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const pt = this._curve.getPointAt(t);
      const tan = this._curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const left = pt.clone().addScaledVector(right, -TW / 2);
      const rght = pt.clone().addScaledVector(right, TW / 2);
      positions.push(left.x, left.y + 0.02, left.z, rght.x, rght.y + 0.02, rght.z);
      normals.push(0, 1, 0, 0, 1, 0);
      uvs.push(0, t * this._trackLength / 12, 1, t * this._trackLength / 12);
    }
    for (let i = 0; i < N; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, b, c, b, d, c);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    // Couleur alternée par segments de 10 unités
    const trackMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const trackMesh = new THREE.Mesh(geo, trackMat);
    this._scene.add(trackMesh);

    // Marquages de piste (bandes blanches tous les ~20m)
    const markMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    for (let i = 0; i < N; i += Math.floor(N / (this._trackLength / 20))) {
      const t = i / N;
      const pt = this._curve.getPointAt(t);
      const tan = this._curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const mark = new THREE.Mesh(new THREE.PlaneGeometry(TW * 0.15, 0.8), markMat);
      mark.rotation.x = -Math.PI / 2;
      mark.position.copy(pt);
      mark.position.y = 0.04;
      const angle = Math.atan2(tan.z, tan.x);
      mark.rotation.z = -angle;
      this._scene.add(mark);
    }

    // Barrières latérales
    this._buildBarriers(N, TW);

    // Ligne départ/arrivée
    const sfMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const sfPt = this._curve.getPointAt(0);
    const sfTan = this._curve.getTangentAt(0).normalize();
    const sfRight = new THREE.Vector3().crossVectors(sfTan, new THREE.Vector3(0, 1, 0)).normalize();
    const sfLine = new THREE.Mesh(new THREE.PlaneGeometry(TW + 1, 1.2), sfMat);
    sfLine.rotation.x = -Math.PI / 2;
    sfLine.position.copy(sfPt);
    sfLine.position.y = 0.06;
    sfLine.rotation.z = -Math.atan2(sfTan.z, sfTan.x);
    this._scene.add(sfLine);

    // Décors
    this._buildDecor();
  },

  _buildBarriers(N, TW) {
    const barrMat = new THREE.MeshLambertMaterial({ color: 0xdd2222 });
    const barrMat2 = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const step = Math.max(1, Math.floor(N / 80));
    for (let i = 0; i < N; i += step) {
      const t = i / N;
      const pt = this._curve.getPointAt(t);
      const tan = this._curve.getTangentAt(t).normalize();
      const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const angle = Math.atan2(tan.x, tan.z);
      const geo = new THREE.BoxGeometry(0.4, 0.9, step * this._trackLength / N + 0.2);
      [-1, 1].forEach(side => {
        const mat = (Math.floor(i / step) % 2 === 0) ? barrMat : barrMat2;
        const barrier = new THREE.Mesh(geo, mat);
        barrier.position.copy(pt).addScaledVector(right, side * (TW / 2 + 0.2));
        barrier.position.y = 0.45;
        barrier.rotation.y = angle;
        this._scene.add(barrier);
      });
    }
  },

  _buildDecor() {
    const treeMat = new THREE.MeshLambertMaterial({ color: 0x228822 });
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3317 });
    const rng = () => (Math.random() - 0.5) * 2;
    const bb = 220;
    for (let i = 0; i < 60; i++) {
      const bx = rng() * bb, bz = rng() * bb;
      // Ne pas placer d'arbre sur la piste (vérif grossière)
      const nearby = this._curve.getPoints(40).some(p => {
        const dx = p.x - bx, dz = p.z - bz;
        return dx * dx + dz * dz < 400;
      });
      if (nearby) continue;
      const h = 4 + Math.random() * 4;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, h * 0.4, 6), trunkMat);
      trunk.position.set(bx, h * 0.2, bz);
      this._scene.add(trunk);
      const crown = new THREE.Mesh(new THREE.ConeGeometry(1.8 + Math.random(), h * 0.7, 7), treeMat);
      crown.position.set(bx, h * 0.4 + h * 0.35, bz);
      this._scene.add(crown);
    }
  },

  _buildCars() {
    const sfPt = this._curve.getPointAt(0.01);
    const tan = this._curve.getTangentAt(0.01).normalize();
    const right = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

    // Voiture joueur
    this._playerCar = this._makeCar(this._PLAYER_COLOR);
    this._playerCar.position.copy(sfPt).addScaledVector(right, 0);
    this._scene.add(this._playerCar);

    // Voitures IA
    this._aiCars = [];
    if (this._mode === 'pistes') {
      const count = this._aiCount;
      for (let i = 0; i < count; i++) {
        const aiColor = this._AI_COLORS[i % this._AI_COLORS.length];
        const mesh = this._makeCar(aiColor);
        const row = Math.floor((i + 1) / 2);
        const side = (i % 2 === 0) ? 1 : -1;
        const tOffset = -0.008 * (row + 0.5);
        const startPt = this._curve.getPointAt(Math.max(0, tOffset + 1) % 1);
        mesh.position.copy(startPt).addScaledVector(right, side * 3.5);
        this._scene.add(mesh);

        const baseSpeed = this._MAX_SPEED * (0.80 + Math.random() * 0.15);
        this._aiCars.push({
          mesh,
          t: Math.max(0, (tOffset + 1) % 1),
          speed: 0,
          offset: side * 3.2,
          lap: 0,
          cpDone: new Set(),
          sfCooldown: 3 + row * 0.5,
          baseSpeed,
          name: this._AI_NAMES[i % this._AI_NAMES.length],
          color: aiColor,
          finished: false,
          finishPos: null,
        });
      }
    }
  },

  _makeCar(color) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 3.6), bodyMat);
    body.position.y = 0.35;
    group.add(body);

    const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.38, 1.8), bodyMat);
    top.position.set(0, 0.73, -0.1);
    group.add(top);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.34, 0.07), glassMat);
    windshield.position.set(0, 0.73, 0.8);
    group.add(windshield);

    [[-0.9, -1.2], [-0.9, 1.2], [0.9, -1.2], [0.9, 1.2]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 10), darkMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.28, wz);
      wheel.userData.isWheel = true;
      group.add(wheel);
    });

    return group;
  },

  _buildGhostCar() {
    if (this._ghostCar) { this._scene && this._scene.remove(this._ghostCar); this._ghostCar = null; }
    if (this._mode !== 'record' || !this._ghostEnabled || !this._storedGhost.length) return;
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0x88aaff, transparent: true, opacity: 0.35, depthWrite: false });
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 3.6), ghostMat);
    body.position.y = 0.35;
    group.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.38, 1.8), ghostMat);
    top.position.set(0, 0.73, -0.1);
    group.add(top);
    this._ghostCar = group;
    this._scene.add(group);
  },

  // ── Physique joueur ───────────────────────────────────────────────────────
  _updatePlayer(delta) {
    if (this._playerFinished) return;
    const isMobile = 'ontouchstart' in window;
    const brake = State.keys['KeyS'] || State.keys['ArrowDown'] || (isMobile && State.keys['_cv_brake']);
    const left  = State.keys['KeyA'] || State.keys['ArrowLeft']  || (isMobile && State.keys['_cv_left']);
    const right = State.keys['KeyD'] || State.keys['ArrowRight'] || (isMobile && State.keys['_cv_right']);

    if (brake) this._playerSpeed = Math.max(0, this._playerSpeed - this._BRAKE * delta);
    else this._playerSpeed = Math.min(this._MAX_SPEED, this._playerSpeed + this._ACCEL * delta);

    const turnRate = this._STEER_SPEED * (this._playerSpeed / this._MAX_SPEED);
    if (left)  this._playerOffset = Math.max(-this._TRACK_HALF + 0.9, this._playerOffset - turnRate * delta);
    if (right) this._playerOffset = Math.min(this._TRACK_HALF - 0.9, this._playerOffset + turnRate * delta);

    this._playerT += this._playerSpeed / this._trackLength * delta;

    const t = ((this._playerT % 1) + 1) % 1;
    const pt = this._curve.getPointAt(t);
    const tan = this._curve.getTangentAt(t).normalize();
    const rVec = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

    this._playerCar.position.copy(pt).addScaledVector(rVec, this._playerOffset);
    this._playerCar.position.y = pt.y + 0.28;
    this._playerCar.rotation.y = Math.atan2(-tan.z, tan.x) - Math.PI / 2;

    if (this._mode === 'record') {
      this._ghostFrames.push({ t: this._playerT, ms: this._raceTimer * 1000 });
    }
  },

  _updateAI(delta) {
    this._aiCars.forEach(ai => {
      if (ai.finished) return;
      ai.sfCooldown = Math.max(0, ai.sfCooldown - delta);

      // Vitesse selon courbure
      const t = ((ai.t % 1) + 1) % 1;
      const tan1 = this._curve.getTangentAt(t);
      const tan2 = this._curve.getTangentAt((t + 0.02) % 1);
      const curvature = tan1.angleTo(tan2) / 0.02;
      const targetSpeed = ai.baseSpeed * Math.max(0.45, 1 - curvature * 4);

      // Rubber-band
      const gap = this._playerT - ai.t;
      const rubberBonus = gap > 0.05 ? 1.12 : gap < -0.05 ? 0.92 : 1.0;
      const finalTarget = targetSpeed * rubberBonus;

      ai.speed += (finalTarget - ai.speed) * Math.min(1, delta * 2);
      ai.t += ai.speed / this._trackLength * delta;

      const at = ((ai.t % 1) + 1) % 1;
      const pt = this._curve.getPointAt(at);
      const aTan = this._curve.getTangentAt(at).normalize();
      const rVec = new THREE.Vector3().crossVectors(aTan, new THREE.Vector3(0, 1, 0)).normalize();

      ai.mesh.position.copy(pt).addScaledVector(rVec, ai.offset);
      ai.mesh.position.y = pt.y + 0.28;
      ai.mesh.rotation.y = Math.atan2(-aTan.z, aTan.x) - Math.PI / 2;
    });
  },

  _checkAntiOverlap() {
    const all = [
      { pos: this._playerCar.position, isPlayer: true },
      ...this._aiCars.map(a => ({ pos: a.mesh.position, isPlayer: false, ai: a }))
    ];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const dx = all[j].pos.x - all[i].pos.x;
        const dz = all[j].pos.z - all[i].pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 2.4 && dist > 0.01) {
          const push = (2.4 - dist) / dist * 0.5;
          all[i].pos.x -= dx * push;
          all[i].pos.z -= dz * push;
          all[j].pos.x += dx * push;
          all[j].pos.z += dz * push;
        }
      }
    }
  },

  _checkLap() {
    const tr = this._TRACKS[this._trackIdx];
    const sfCooldownKey = '_sfCooldownPlayer';
    if (!this[sfCooldownKey]) this[sfCooldownKey] = 3;
    this[sfCooldownKey] -= 0.016;

    const checkpoints = [0.25, 0.5, 0.75];
    const t = ((this._playerT % 1) + 1) % 1;
    checkpoints.forEach((cp, i) => {
      if (Math.abs(t - cp) < 0.04) this._playerCpDone.add(i);
    });

    if (t < 0.04 && this[sfCooldownKey] <= 0 && this._playerCpDone.size >= 3) {
      this._playerLap++;
      this._playerCpDone = new Set();
      this[sfCooldownKey] = 3;
      const lapTime = this._lapTimer;
      this._lapTimes.push(lapTime);
      this._lapTimer = 0;

      if (this._mode === 'record') {
        const best = this._bestTime;
        if (!best || lapTime < best) {
          this._bestTime = lapTime;
          const el = document.getElementById('cv-hud-best');
          if (el) el.textContent = '🏆 ' + this._fmtTime(lapTime);
        }
      }

      if (this._playerLap >= tr.laps) {
        this._onPlayerFinish();
      }
    }

    // Vérifier si les IA finissent
    this._aiCars.forEach(ai => {
      if (ai.finished) return;
      if (!ai.sfCooldown && ai.t > 0) {
        const at = ((ai.t % 1) + 1) % 1;
        if (at < 0.04) {
          const lapCount = Math.floor(ai.t);
          if (lapCount >= tr.laps && ai.lap < tr.laps) {
            ai.lap = tr.laps;
            ai.finished = true;
            ai.sfCooldown = 999;
            ai.finishPos = this._finishCounter = (this._finishCounter || 1) + 1;
          }
        }
      }
    });
  },

  _onPlayerFinish() {
    if (this._playerFinished) return;
    this._playerFinished = true;
    this._finished = true;
    const tr = this._TRACKS[this._trackIdx];
    const totalTime = this._raceTimer;

    // Calcul position
    const finishedBefore = this._aiCars.filter(a => a.finished).length;
    const pos = finishedBefore + 1;
    this._position = pos;

    // Gains
    const salary = State.currentJob ? State.currentJob.salary : 35;
    let pay;
    if (this._mode === 'record') {
      const best = this._getBest(tr.id);
      const newBest = !best || totalTime < best;
      if (newBest) {
        this._saveBest(tr.id, totalTime);
        if (this._ghostFrames.length) this._saveGhost(tr.id, this._ghostFrames);
      }
      pay = newBest ? salary * 3 : salary;
    } else {
      pay = pos === 1 ? salary * 4 : pos === 2 ? salary * 3 : pos === 3 ? salary * 2 : salary;
    }

    if (pay > 0) Jobs.earnFromWork(pay);
    setTimeout(() => this._showResults(pos, totalTime, pay), 2500);
  },

  _showResults(pos, totalTime, pay) {
    this._removeHUD();
    const tr = this._TRACKS[this._trackIdx];
    const best = this._getBest(tr.id);
    const isRecord = this._mode === 'record' && (!best || totalTime <= best + 0.001);
    const posStr = this._mode === 'pistes' ? `<p style="color:#f1c40f;font-size:1.5em">${['🥇','🥈','🥉'][pos-1] || pos + 'e'} place</p>` : '';
    const timeStr = `<p style="color:#fff;font-size:1.1em">⏱ ${this._fmtTime(totalTime)}</p>`;
    const recStr = isRecord ? `<p style="color:#f1c40f">🏆 Nouveau record !</p>` : '';
    const bestStr = best ? `<p style="color:#888;font-size:0.88em">Meilleur: ${this._fmtTime(best)}</p>` : '';

    const div = document.createElement('div');
    div.id = 'cv-results';
    div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);display:flex;justify-content:center;align-items:center;z-index:500;font-family:Arial,sans-serif;';
    div.innerHTML = `
      <div style="background:#0d0d0d;border:2px solid #ff4444;border-radius:18px;padding:28px;text-align:center;min-width:280px">
        <h2 style="color:#ff4444;margin:0 0 14px">🏁 RÉSULTAT</h2>
        ${posStr}${timeStr}${recStr}${bestStr}
        <p style="color:#88ff88;font-size:1.1em">💰 +${pay}$</p>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:18px">
          <button id="cv-r-replay" class="cv-launch-btn" style="font-size:0.9em">🔄 Rejouer</button>
          <button id="cv-r-select" class="cv-launch-btn" style="font-size:0.9em;background:#333">Pistes</button>
          <button id="cv-r-quit" class="cv-quit-btn">✕ Quitter</button>
        </div>
      </div>`;
    document.body.appendChild(div);
    this._overlay = div;

    document.getElementById('cv-r-replay').onclick = () => { div.remove(); this._startRace(); };
    document.getElementById('cv-r-select').onclick = () => { div.remove(); this._cleanScene(); this._active = false; this._showSelector(); };
    document.getElementById('cv-r-quit').onclick = () => { div.remove(); this.exit(); };
  },

  // ── Ghost ─────────────────────────────────────────────────────────────────
  _updateGhost(delta) {
    if (!this._ghostCar || !this._storedGhost.length) return;
    const ms = this._raceTimer * 1000;
    let lo = 0, hi = this._storedGhost.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this._storedGhost[mid].ms < ms) lo = mid + 1; else hi = mid;
    }
    const frame = this._storedGhost[lo];
    const t = ((frame.t % 1) + 1) % 1;
    const pt = this._curve.getPointAt(t);
    const tan = this._curve.getTangentAt(t).normalize();
    const rVec = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
    this._ghostCar.position.copy(pt).addScaledVector(rVec, 0);
    this._ghostCar.position.y = pt.y + 0.28;
    this._ghostCar.rotation.y = Math.atan2(-tan.z, tan.x) - Math.PI / 2;
  },

  // ── Caméra ────────────────────────────────────────────────────────────────
  _updateCamera() {
    const pos = this._playerCar.position;
    const t = ((this._playerT % 1) + 1) % 1;
    const tan = this._curve.getTangentAt(t).normalize();
    const camOffset = tan.clone().multiplyScalar(-7).add(new THREE.Vector3(0, 3, 0));
    this._camera.position.copy(pos).add(camOffset);
    const lookAt = pos.clone().add(tan.clone().multiplyScalar(6)).add(new THREE.Vector3(0, 0.5, 0));
    this._camera.lookAt(lookAt);
  },

  _rotateWheels(delta) {
    const rotAmt = this._playerSpeed * delta * 0.5;
    this._playerCar.children.forEach(c => {
      if (c.userData.isWheel) c.rotation.x += rotAmt;
    });
    this._aiCars.forEach(ai => {
      ai.mesh.children.forEach(c => {
        if (c.userData.isWheel) c.rotation.x += ai.speed * delta * 0.5;
      });
    });
  },

  // ── HUD ───────────────────────────────────────────────────────────────────
  _buildHUD() {
    this._removeHUD();
    const isMobile = 'ontouchstart' in window;
    const tr = this._TRACKS[this._trackIdx];
    const hud = document.createElement('div');
    hud.id = 'cv-hud';
    hud.style.cssText = 'position:fixed;top:0;left:0;right:0;pointer-events:none;z-index:450;font-family:Arial,sans-serif;';

    let mobileCtrl = '';
    if (isMobile) {
      mobileCtrl = `
        <div id="cv-ctrl" style="position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:flex-end;padding:16px;pointer-events:auto;z-index:451">
          <div style="display:flex;gap:10px">
            <button id="cv-btn-L" class="cv-ctrl-btn">◀</button>
            <button id="cv-btn-R" class="cv-ctrl-btn">▶</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
            <button id="cv-btn-B" class="cv-ctrl-btn cv-ctrl-brake">▼</button>
          </div>
        </div>`;
    }

    hud.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:12px 16px">
        <div>
          <div id="cv-hud-timer" style="color:#fff;font-size:2em;font-weight:bold;text-shadow:0 2px 8px #000">0:00.000</div>
          <div id="cv-hud-lap" style="color:#ccc;font-size:1em">Tour 1 / ${tr.laps}</div>
          <div id="cv-hud-best" style="color:#f1c40f;font-size:0.85em">${this._bestTime ? '🏆 ' + this._fmtTime(this._bestTime) : ''}</div>
        </div>
        <div style="text-align:right">
          ${this._mode === 'pistes' ? '<div id="cv-hud-pos" style="color:#fff;font-size:1.6em;font-weight:bold">1e / ' + (this._aiCars.length + 1) + '</div>' : ''}
          <div id="cv-hud-speed" style="color:#88ff88;font-size:1em">0 km/h</div>
          <div id="cv-hud-track" style="color:#888;font-size:0.8em">${tr.name}</div>
        </div>
      </div>
      <div id="cv-hud-countdown" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:4em;font-weight:bold;color:#f1c40f;text-shadow:0 4px 16px #000;pointer-events:none"></div>
      ${mobileCtrl}
    `;
    document.body.appendChild(hud);
    this._hud = hud;

    if (isMobile) this._bindMobileCtrl();
  },

  _bindMobileCtrl() {
    const bind = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', e => { e.preventDefault(); State.keys[key] = true; }, { passive: false });
      btn.addEventListener('touchend',   e => { e.preventDefault(); State.keys[key] = false; }, { passive: false });
      btn.addEventListener('mousedown', () => State.keys[key] = true);
      btn.addEventListener('mouseup',   () => State.keys[key] = false);
    };
    bind('cv-btn-L', '_cv_left');
    bind('cv-btn-R', '_cv_right');
    bind('cv-btn-B', '_cv_brake');
  },

  _updateHUD() {
    const timerEl = document.getElementById('cv-hud-timer');
    if (timerEl) timerEl.textContent = this._fmtTime(this._raceTimer);
    const speedEl = document.getElementById('cv-hud-speed');
    if (speedEl) speedEl.textContent = Math.round(Math.abs(this._playerSpeed) * 3.6) + ' km/h';
    const tr = this._TRACKS[this._trackIdx];
    const lapEl = document.getElementById('cv-hud-lap');
    if (lapEl) lapEl.textContent = `Tour ${Math.min(this._playerLap + 1, tr.laps)} / ${tr.laps}`;

    if (this._mode === 'pistes') {
      const finishedBefore = this._aiCars.filter(a => a.finished && a.t > this._playerT + 0.001).length;
      const aheadCount = this._aiCars.filter(a => !a.finished && a.t > this._playerT + 0.001).length;
      const pos = finishedBefore + aheadCount + 1;
      const posEl = document.getElementById('cv-hud-pos');
      if (posEl) posEl.textContent = pos + 'e / ' + (this._aiCars.length + 1);
    }
  },

  _updateCountdown() {
    const el = document.getElementById('cv-hud-countdown');
    if (!el) return;
    const n = Math.ceil(this._countdown);
    el.textContent = n > 0 ? n : 'GO !';
    if (this._countdown <= -0.6) el.textContent = '';
  },

  // ── Persistance ────────────────────────────────────────────────────────────
  _getBest(id) {
    const v = parseFloat(localStorage.getItem('cv_best_' + id));
    return isNaN(v) ? null : v;
  },
  _saveBest(id, t) { localStorage.setItem('cv_best_' + id, t.toFixed(4)); },
  _getGhost(id) {
    try { return JSON.parse(localStorage.getItem('cv_ghost_' + id)); } catch { return null; }
  },
  _saveGhost(id, frames) {
    const sampled = frames.filter((_, i) => i % 3 === 0);
    localStorage.setItem('cv_ghost_' + id, JSON.stringify(sampled));
  },
  _loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('cv_settings') || '{}');
      this._mode = s.mode || 'record';
      this._trackIdx = Math.min(s.trackIdx || 0, this._TRACKS.length - 1);
      this._aiCount = Math.max(1, Math.min(7, s.aiCount || 3));
      this._ghostEnabled = s.ghostEnabled !== false;
    } catch { this._mode = 'record'; }
  },
  _saveSettings() {
    localStorage.setItem('cv_settings', JSON.stringify({
      mode: this._mode, trackIdx: this._trackIdx, aiCount: this._aiCount, ghostEnabled: this._ghostEnabled
    }));
  },

  // ── Helpers ───────────────────────────────────────────────────────────────
  _fmtTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const ms = Math.floor((sec % 1) * 1000);
    return `${m}:${String(Math.floor(sec)).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  },

  _removeOverlay() {
    if (this._overlay) { this._overlay.remove(); this._overlay = null; }
    const old = document.getElementById('cv-overlay');
    if (old) old.remove();
    const res = document.getElementById('cv-results');
    if (res) res.remove();
  },

  _removeHUD() {
    if (this._hud) { this._hud.remove(); this._hud = null; }
    const old = document.getElementById('cv-hud');
    if (old) old.remove();
  },

  _cleanScene() {
    this._scene = null;
    this._camera = null;
    this._playerCar = null;
    this._ghostCar = null;
    this._aiCars = [];
    this._curve = null;
    this._finishCounter = 0;
    this[`_sfCooldownPlayer`] = null;
    // Nettoyer les touches mobiles
    ['_cv_left','_cv_right','_cv_accel','_cv_brake'].forEach(k => { State.keys[k] = false; });
  },

  _ensureStyles() {
    if (document.getElementById('cv-styles')) return;
    const style = document.createElement('style');
    style.id = 'cv-styles';
    style.textContent = `
      .cv-mode-btn{background:#1a1a1a;color:#fff;border:2px solid #555;padding:10px 22px;border-radius:8px;font-size:1em;cursor:pointer;font-weight:bold;transition:all .15s}
      .cv-mode-btn.active{background:#cc2222;border-color:#ff4444;color:#fff}
      .cv-track-card{display:flex;flex-direction:column;align-items:center;gap:2px;background:#1a1a1a;border:2px solid #333;border-radius:10px;padding:10px 14px;cursor:pointer;min-width:100px;transition:all .15s}
      .cv-track-card.selected,.cv-track-card:hover{border-color:#ff4444;background:#220a0a}
      .cv-track-name{color:#fff;font-weight:bold;font-size:0.95em}
      .cv-ai-btn{background:#1a1a1a;color:#fff;border:2px solid #555;padding:8px 14px;border-radius:6px;font-size:0.95em;cursor:pointer;transition:all .15s}
      .cv-ai-btn.active{background:#cc2222;border-color:#ff4444}
      .cv-launch-btn{background:#cc2222;color:#fff;border:none;padding:12px 24px;border-radius:10px;font-size:1em;font-weight:bold;cursor:pointer;letter-spacing:1px;transition:background .15s}
      .cv-launch-btn:hover{background:#ee3333}
      .cv-quit-btn{background:#1a1a1a;color:#aaa;border:2px solid #444;padding:12px 18px;border-radius:10px;font-size:0.9em;cursor:pointer}
      .cv-ctrl-btn{background:rgba(255,255,255,0.18);color:#fff;border:2px solid rgba(255,255,255,0.35);border-radius:10px;padding:16px 22px;font-size:1.3em;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:none}
      .cv-ctrl-accel{background:rgba(0,200,100,0.25)}
      .cv-ctrl-brake{background:rgba(200,50,50,0.25)}
    `;
    document.head.appendChild(style);
  },
};
