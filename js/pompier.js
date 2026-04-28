// ── Monde Pompier ─────────────────────────────────────────────────────────────
// WASD actif dans ce monde ↔ désactivé dans le monde réel (State.inWorkMode)
// Vice-versa : quand _active=false, tick() retourne immédiatement
const Pompier = {
  _active: false,
  _scene: null, _camera: null,

  // Joueur dans le monde téléporté
  _px: 0, _py: 1.7, _pz: 12,
  _yaw: Math.PI, _pitch: 0,
  _velY: 0, _onGround: true,

  // Missions : 3 par session (fixe)
  _missions: ['incendie', 'sauvetage', 'inspection'],
  _missionIdx: 0,
  _allDone: false,

  // Objets interactifs de la scène
  _fires: [],       // { group, flames, light, x, z, progress, done }
  _victim: null,    // { group, x, z, done }
  _victimLight: null,
  _inspectPts: [],  // { mesh, lightObj, x, z, done }
  _fireLight: null,

  // Animation feu
  _fireTime: 0,

  // Action E (hold)
  _eHeld: false, _ePrev: false,
  _currentFireTarget: null,
  _victimDist: Infinity,
  _actionFill: 0,

  // HUD
  _hud: null,
  _msg: '', _msgTimer: 0,

  // ── Entrée / Sortie ──────────────────────────────────────────────────────────
  enter() {
    if (State.inWorkMode) return;
    State.inWorkMode = true;
    // On conserve le pointer lock → la souris contrôle la caméra FPS ici

    this._buildScene();
    this._spawnFires();
    this._spawnVictim();
    this._spawnInspectPoints();
    this._activateMission(0);
    this._buildHUD();
    this._active = true;

    this._px = 0; this._py = 1.7; this._pz = 12;
    this._yaw = Math.PI; this._pitch = 0;
    this._velY = 0; this._onGround = true;
    this._missionIdx = 0; this._allDone = false;
    this._msg = ''; this._msgTimer = 0;
    this._ePrev = false; this._actionFill = 0;
    this._fireTime = 0;
    this._currentFireInRange = false; this._currentFireDist = Infinity;
    this._currentFireTarget = null; this._victimDist = Infinity;
  },

  exit() {
    if (!this._active) return;
    this._active = false;
    State.inWorkMode = false;
    // Vider l'accumulation souris pour éviter un saut de caméra au retour
    State.mouseDX = 0; State.mouseDY = 0;
    this._removeHUD();
    this._cleanScene();
  },

  // ── Boucle principale ────────────────────────────────────────────────────────
  tick(delta) {
    // MONDE RÉEL : WASD bloqué via State.inWorkMode dans Player.update
    // CE MONDE   : WASD bloqué quand _active=false (vice-versa garanti)
    if (!this._active) return;

    // ── Caméra FPS (souris capturée par input.js via pointer lock) ──
    this._yaw   -= State.mouseDX * CONFIG.SENSITIVITY;
    this._pitch -= State.mouseDY * CONFIG.SENSITIVITY;
    this._pitch  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this._pitch));
    State.mouseDX = 0; State.mouseDY = 0;

    // ── Déplacement WASD ──
    const sinY = Math.sin(this._yaw), cosY = Math.cos(this._yaw);
    let mx = 0, mz = 0;
    if (State.keys['KeyW'] || State.keys['ArrowUp'])    { mx -= sinY; mz -= cosY; }
    if (State.keys['KeyS'] || State.keys['ArrowDown'])  { mx += sinY; mz += cosY; }
    if (State.keys['KeyA'] || State.keys['ArrowLeft'])  { mx -= cosY; mz += sinY; }
    if (State.keys['KeyD'] || State.keys['ArrowRight']) { mx += cosY; mz -= sinY; }
    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) { mx /= len; mz /= len; }
    this._px += mx * 5 * delta;
    this._pz += mz * 5 * delta;
    this._px = Math.max(-22, Math.min(22, this._px));
    this._pz = Math.max(-22, Math.min(22, this._pz));

    // ── Gravité & saut ──
    this._velY -= 20 * delta;
    this._py += this._velY * delta;
    if (this._py <= 1.7) { this._py = 1.7; this._velY = 0; this._onGround = true; }
    else { this._onGround = false; }
    if (State.keys['Space'] && this._onGround) { this._velY = 7; this._onGround = false; }

    // ── Caméra ──
    this._camera.position.set(this._px, this._py, this._pz);
    this._camera.rotation.order = 'YXZ';
    this._camera.rotation.y = this._yaw;
    this._camera.rotation.x = this._pitch;

    // ── Touche E (edge-triggered pour tap, accumulated pour hold) ──
    const eCurr = !!State.keys['KeyE'];
    this._eHeld = eCurr;
    this._ePrev = eCurr;

    // ── Animations ──
    this._fireTime += delta;
    this._updateFireAnim();

    // ── Logique mission ──
    this._actionFill = 0;
    this._updateMission(delta);

    // ── HUD ──
    this._updateHUD(delta);
  },

  // ── Scène 3D ─────────────────────────────────────────────────────────────────
  _buildScene() {
    this._cleanScene();
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1a0500, 0.022);
    scene.background = new THREE.Color(0x0d0302);
    scene.add(new THREE.AmbientLight(0xff5511, 0.35));
    const sun = new THREE.DirectionalLight(0xff8833, 0.5);
    sun.position.set(15, 25, 10);
    scene.add(sun);

    // Sol asphalte
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshLambertMaterial({ color: 0x1e1e1e })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Lignes de rue
    const lineMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    for (let i = -4; i <= 4; i++) {
      const l = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 80), lineMat);
      l.rotation.x = -Math.PI / 2;
      l.position.set(i * 5, 0.01, 0);
      scene.add(l);
    }

    this._buildBuilding(scene);
    this._buildTrucks(scene);
    this._buildDecor(scene);

    // Lumière de feu globale pulsée
    const fl = new THREE.PointLight(0xff4400, 3, 30);
    fl.position.set(0, 5, -5);
    scene.add(fl);
    this._fireLight = fl;

    this._scene = scene;
    this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
  },

  _buildBuilding(scene) {
    const wMat  = new THREE.MeshLambertMaterial({ color: 0x5a3320 });
    const wChar = new THREE.MeshLambertMaterial({ color: 0x1a0a00 }); // mur brûlé
    const roofM = new THREE.MeshLambertMaterial({ color: 0x280d00 });
    const W = 14, H = 6, D = 10, bz = -7;

    const addBox = (w, h, d, x, y, z, mat) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = true; scene.add(m); return m;
    };

    // Murs
    addBox(W,   H, 0.4,   0,     H/2,  bz + D/2,  wMat);  // avant
    addBox(W,   H, 0.4,   0,     H/2,  bz - D/2,  wChar); // arrière
    addBox(0.4, H, D,    -W/2,   H/2,  bz,        wChar); // gauche
    addBox(0.4, H, D,     W/2,   H/2,  bz,        wChar); // droite
    addBox(W + 0.5, 0.4, D + 0.5, 0,  H + 0.2,   bz, roofM); // toit

    // Fenêtres avec lueur de feu
    const winMat = new THREE.MeshLambertMaterial({
      color: 0xff3300, emissive: 0xff2200, emissiveIntensity: 1.2,
      transparent: true, opacity: 0.85,
    });
    [-4.5, 0, 4.5].forEach(ox => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 0.08), winMat);
      w.position.set(ox, 3.2, bz + D / 2 + 0.05);
      scene.add(w);
    });

    // Porte (trou visuel — panneau noir)
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.2, 0.1), doorMat);
    door.position.set(0, 1.6, bz + D / 2 + 0.05);
    scene.add(door);
  },

  _buildTrucks(scene) {
    this._makeTruck(scene, -7, 10);
    this._makeTruck(scene,  7, 10);
  },

  _makeTruck(scene, x, z) {
    const red   = new THREE.MeshLambertMaterial({ color: 0xcc1100 });
    const dark  = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const chrome= new THREE.MeshLambertMaterial({ color: 0x999999 });

    const add = (geo, mat, px, py, pz) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x + px, py, z + pz);
      m.castShadow = true; scene.add(m);
    };

    add(new THREE.BoxGeometry(2.4, 1.4, 5.5), red,    0, 1.0, 0);   // carrosserie
    add(new THREE.BoxGeometry(2.4, 1.0, 1.8), red,    0, 2.1, 1.5); // cabine
    add(new THREE.BoxGeometry(0.1, 0.12, 4.5), chrome, 0, 2.7, 0);  // échelle

    const wg = new THREE.CylinderGeometry(0.42, 0.42, 0.28, 10);
    [[-1.3,-1.8],[-1.3,1.8],[1.3,-1.8],[1.3,1.8]].forEach(([dx, dz]) => {
      const w = new THREE.Mesh(wg, dark);
      w.rotation.z = Math.PI / 2;
      w.position.set(x + dx, 0.42, z + dz);
      scene.add(w);
    });
  },

  _buildDecor(scene) {
    // Cônes de signalisation
    const cGeo = new THREE.ConeGeometry(0.22, 0.55, 7);
    const cMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
    [-10,-5,0,5,10].forEach(ox => {
      const c = new THREE.Mesh(cGeo, cMat);
      c.position.set(ox, 0.275, 6);
      scene.add(c);
    });

    // Débris
    const dMat = new THREE.MeshLambertMaterial({ color: 0x150800 });
    [[-6,0.18,3],[5,0.12,2],[-3,0.15,4],[4,0.2,5]].forEach(([dx,dy,dz]) => {
      const s = 0.35 + Math.random() * 0.3;
      const d = new THREE.Mesh(new THREE.BoxGeometry(s, s*0.5, s*0.9), dMat);
      d.position.set(dx, dy, dz);
      d.rotation.y = Math.random() * Math.PI;
      scene.add(d);
    });

    // Hydrant
    const hyMat = new THREE.MeshLambertMaterial({ color: 0xdd2200 });
    const hy = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8), hyMat);
    hy.position.set(-12, 0.35, 3);
    scene.add(hy);
    const hyTop = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.22, 8), hyMat);
    hyTop.position.set(-12, 0.81, 3);
    scene.add(hyTop);
  },

  // ── Spawn des objets interactifs ─────────────────────────────────────────────
  _spawnFires() {
    this._fires = [];
    const positions = [{ x: -6, z: -4 }, { x: 6, z: -4 }, { x: 0, z: -13 }];

    positions.forEach(({ x, z }) => {
      const group = new THREE.Group();

      // Base brûlée
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.0, 0.12, 8),
        new THREE.MeshLambertMaterial({ color: 0x080400 })
      );
      base.position.y = 0.06;
      group.add(base);

      // Flammes (3 cônes animés)
      const flames = [];
      const colors = [
        { c: 0xff2200, e: 0xff1100, ei: 1.2, h: 1.3, r: 0.38 },
        { c: 0xff7700, e: 0xff5500, ei: 0.9, h: 1.0, r: 0.28 },
        { c: 0xffcc00, e: 0xffaa00, ei: 0.6, h: 0.65, r: 0.18 },
      ];
      colors.forEach((cfg, i) => {
        const mat = new THREE.MeshLambertMaterial({
          color: cfg.c, emissive: cfg.e, emissiveIntensity: cfg.ei,
        });
        const f = new THREE.Mesh(new THREE.ConeGeometry(cfg.r, cfg.h, 7), mat);
        f.position.set((i - 1) * 0.28, cfg.h / 2 + 0.12, (i % 2) * 0.18 - 0.09);
        f.userData.baseH = cfg.h;
        group.add(f);
        flames.push(f);
      });

      // Lumière locale
      const light = new THREE.PointLight(0xff4400, 1.8, 9);
      light.position.set(0, 1.2, 0);
      group.add(light);

      group.position.set(x, 0, z);
      this._scene.add(group);
      this._fires.push({ group, flames, light, x, z, progress: 0, done: false });
    });
  },

  _spawnVictim() {
    const g = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 1.3, 0.42),
      new THREE.MeshLambertMaterial({ color: 0xddaa66 })
    );
    body.position.y = 0.65;
    g.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xf5c5a3 })
    );
    head.position.y = 1.54;
    g.add(head);

    const vLight = new THREE.PointLight(0xffff44, 2.5, 7);
    vLight.position.y = 2;
    g.add(vLight);
    this._victimLight = vLight;

    g.position.set(2, 0, -3);
    g.visible = false;
    this._scene.add(g);
    this._victim = { group: g, x: 2, z: -3, done: false };
  },

  _spawnInspectPoints() {
    this._inspectPts = [];
    const positions = [{ x: -9, z: -2 }, { x: 9, z: -2 }, { x: 0, z: -14 }];

    positions.forEach(({ x, z }) => {
      const mat = new THREE.MeshLambertMaterial({
        color: 0x00ddff, emissive: 0x006688, emissiveIntensity: 1,
      });
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), mat);
      mesh.position.set(x, 1.3, z);

      const lightObj = new THREE.PointLight(0x00ddff, 1.2, 7);
      lightObj.position.set(x, 1.3, z);

      mesh.visible = false;
      lightObj.visible = false;
      this._scene.add(mesh);
      this._scene.add(lightObj);
      this._inspectPts.push({ mesh, lightObj, x, z, done: false });
    });
  },

  // ── Gestion des missions ─────────────────────────────────────────────────────
  _activateMission(idx) {
    this._missionIdx = idx;
    const mission = this._missions[idx];

    if (mission === 'sauvetage' && this._victim) {
      this._victim.group.visible = true;
    }
    if (mission === 'inspection') {
      this._inspectPts.forEach(p => { p.mesh.visible = true; p.lightObj.visible = true; });
    }
    this._showMsg(['🔥 Mission 1 : Éteindre les foyers !', '🧑 Mission 2 : Sauver la victime !', '🔍 Mission 3 : Inspecter le bâtiment !'][idx] || '');
  },

  _updateMission(delta) {
    if (this._allDone) return;
    const m = this._missions[this._missionIdx];
    if (m === 'incendie')   this._tickIncendie(delta);
    else if (m === 'sauvetage')  this._tickSauvetage(delta);
    else if (m === 'inspection') this._tickInspection(delta);
  },

  _tickIncendie(delta) {
    const actives = this._fires.filter(f => !f.done);
    if (actives.length === 0) { this._completeMission(); return; }

    // Foyer le plus proche
    let nearest = null, nearestDist = Infinity;
    actives.forEach(f => {
      const d = this._d2(this._px, this._pz, f.x, f.z);
      if (d < nearestDist) { nearest = f; nearestDist = d; }
    });
    this._currentFireTarget = nearest;
    this._currentFireDist   = nearestDist;
    this._currentFireInRange = nearestDist < 4.5;

    if (this._currentFireInRange && this._eHeld) {
      nearest.progress += delta / 3.5;
      if (nearest.progress >= 1) {
        nearest.done = true;
        nearest.group.visible = false;
        const remaining = this._fires.filter(f => !f.done).length;
        this._showMsg(remaining > 0 ? `Foyer éteint ! ${remaining} restant(s)` : 'Tous les foyers éteints !');
        const pay = (State.currentJob ? State.currentJob.salary : 30) * 0.35;
        Jobs.earnFromWork(Math.round(pay));
      }
      this._actionFill = nearest.progress;
    } else if (nearest && nearest.progress > 0 && !this._eHeld) {
      nearest.progress = Math.max(0, nearest.progress - delta * 0.4);
    }
  },

  _tickSauvetage(delta) {
    if (!this._victim || this._victim.done) return;
    this._victimDist = this._d2(this._px, this._pz, this._victim.x, this._victim.z);

    if (this._victimDist < 3 && this._eHeld) {
      this._actionFill = Math.min(1, this._actionFill + delta / 1.5);
      if (this._actionFill >= 1) {
        this._victim.done = true;
        this._victim.group.visible = false;
        this._showMsg('Victime secourue avec succès !');
        const pay = (State.currentJob ? State.currentJob.salary : 30) * 0.8;
        Jobs.earnFromWork(Math.round(pay));
        this._completeMission();
      }
    } else if (!this._eHeld) {
      this._actionFill = 0;
    }
  },

  _tickInspection(delta) {
    const remaining = this._inspectPts.filter(p => !p.done);
    if (remaining.length === 0) { this._completeMission(); return; }

    remaining.forEach(pt => {
      const d = this._d2(this._px, this._pz, pt.x, pt.z);
      if (d < 3 && this._eHeld) {
        pt._fill = Math.min(1, (pt._fill || 0) + delta / 1.2);
        if (pt._fill >= 1) {
          pt.done = true;
          pt.mesh.material.color.setHex(0x44ff88);
          pt.mesh.material.emissive.setHex(0x002211);
          pt.lightObj.color.setHex(0x44ff88);
          pt._fill = 0;
          const left = this._inspectPts.filter(p => !p.done).length;
          this._showMsg(left > 0 ? `Point inspecté ! ${left} restant(s)` : 'Inspection complète !');
          const pay = (State.currentJob ? State.currentJob.salary : 30) * 0.28;
          Jobs.earnFromWork(Math.round(pay));
        }
        this._actionFill = pt._fill || 0;
      } else if (!this._eHeld) {
        pt._fill = Math.max(0, (pt._fill || 0) - delta * 0.5);
      }
    });
  },

  _completeMission() {
    if (this._missionIdx >= this._missions.length - 1) {
      this._allDone = true;
      this._showMsg('Service terminé ! Appuie sur T pour partir.');
    } else {
      // Incrémenter immédiatement pour bloquer toute re-entrée dans la frame suivante
      this._activateMission(this._missionIdx + 1);
    }
  },

  // ── Animations ───────────────────────────────────────────────────────────────
  _updateFireAnim() {
    const t = this._fireTime;
    this._fires.forEach((fire, fi) => {
      if (fire.done) return;
      fire.flames.forEach((f, i) => {
        const sc = 0.75 + 0.28 * Math.sin(t * 3.5 + i * 1.3 + fi * 0.7);
        f.scale.set(sc, sc, sc);
        f.position.y = f.userData.baseH / 2 * sc + 0.1 + 0.08 * Math.sin(t * 4.2 + i);
      });
      fire.light.intensity = 1.2 + 0.9 * Math.sin(t * 5.1 + fi);
    });

    if (this._victimLight && this._victim && !this._victim.done && this._victim.group.visible) {
      this._victimLight.intensity = 1.5 + 1.5 * Math.sin(t * 3.8);
    }

    this._inspectPts.forEach((pt, i) => {
      if (!pt.done && pt.mesh.visible) pt.mesh.rotation.y = t * 1.8 + i * 2.1;
    });

    if (this._fireLight) this._fireLight.intensity = 2.2 + 1.6 * Math.sin(t * 2.4);
  },

  // ── HUD ─────────────────────────────────────────────────────────────────────
  _buildHUD() {
    this._removeHUD();
    const hud = document.createElement('div');
    hud.id = 'pmp-hud';
    hud.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:450;font-family:Arial,sans-serif;';
    hud.innerHTML = `
      <div style="padding:14px 18px;display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="color:#ff4400;font-size:1.5em;font-weight:bold;text-shadow:0 2px 8px #000">🚒 POMPIER</div>
          <div id="pmp-mission" style="color:#ffcc88;font-size:0.95em;margin-top:3px"></div>
          <div id="pmp-desc"    style="color:#aaa;font-size:0.78em;margin-top:2px"></div>
        </div>
        <div style="text-align:right;min-width:180px">
          <div id="pmp-plabel" style="color:#ddd;font-size:0.82em;margin-bottom:4px"></div>
          <div style="background:#1a1a1a;border-radius:5px;height:12px;overflow:hidden;border:1px solid #444">
            <div id="pmp-pfill" style="height:100%;width:0%;background:#ff4400;border-radius:5px;transition:width 0.08s"></div>
          </div>
          <div id="pmp-hint" style="color:#88ffaa;font-size:0.75em;margin-top:4px"></div>
        </div>
      </div>

      <div id="pmp-msg" style="
        display:none;position:fixed;top:44%;left:50%;transform:translate(-50%,-50%);
        background:rgba(0,0,0,0.8);color:#fff;padding:12px 24px;border-radius:10px;
        font-size:1.1em;border:1px solid #ff4400;text-align:center;pointer-events:none
      "></div>

      <div id="pmp-action-bar" style="
        display:none;position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        width:220px;text-align:center
      ">
        <div id="pmp-action-label" style="color:#fff;font-size:0.85em;margin-bottom:4px"></div>
        <div style="background:#222;border-radius:6px;height:14px;overflow:hidden;border:1px solid #ff6600">
          <div id="pmp-action-fill" style="height:100%;width:0%;background:linear-gradient(90deg,#ff4400,#ff8800);border-radius:6px;transition:width 0.06s"></div>
        </div>
      </div>

      <div style="
        position:fixed;bottom:16px;left:50%;transform:translateX(-50%);
        color:rgba(255,255,255,0.45);font-size:0.72em;pointer-events:none
      ">WASD Déplacer · ESPACE Sauter · [E] Maintenir pour agir · T Quitter</div>

      <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none">
        <div style="width:2px;height:14px;background:rgba(255,255,255,0.6);position:absolute;top:-7px;left:0"></div>
        <div style="height:2px;width:14px;background:rgba(255,255,255,0.6);position:absolute;top:0;left:-7px"></div>
      </div>
    `;
    document.body.appendChild(hud);
    this._hud = hud;
  },

  _updateHUD(delta) {
    if (this._msgTimer > 0) {
      this._msgTimer -= delta;
      const el = document.getElementById('pmp-msg');
      if (el) { el.textContent = this._msg; el.style.display = 'block'; }
    } else {
      const el = document.getElementById('pmp-msg');
      if (el) el.style.display = 'none';
    }

    const mEl = document.getElementById('pmp-mission');
    const dEl = document.getElementById('pmp-desc');
    const pEl = document.getElementById('pmp-plabel');
    const fEl = document.getElementById('pmp-pfill');
    const hEl = document.getElementById('pmp-hint');
    const abEl = document.getElementById('pmp-action-bar');
    const afEl = document.getElementById('pmp-action-fill');
    const alEl = document.getElementById('pmp-action-label');
    if (!mEl) return;

    if (this._allDone) {
      mEl.textContent = '✅ Service accompli !';
      if (dEl) dEl.textContent = 'Tous les missions complètes.';
      if (fEl) { fEl.style.width = '100%'; fEl.style.background = '#44ff88'; }
      if (pEl) pEl.textContent = '';
      if (hEl) hEl.textContent = 'Appuie sur T pour quitter';
      if (abEl) abEl.style.display = 'none';
      return;
    }

    const m = this._missions[this._missionIdx];

    if (m === 'incendie') {
      const total = this._fires.length;
      const done  = this._fires.filter(f => f.done).length;
      const pct   = done / total * 100;
      mEl.textContent = `🔥 Mission 1/3 — Incendie`;
      if (dEl) dEl.textContent = `${done}/${total} foyers éteints`;
      if (fEl) fEl.style.width = pct + '%';
      if (pEl) pEl.textContent = `Progression`;
      const inRange = this._currentFireInRange;
      if (hEl) {
        if (inRange) hEl.textContent = `[E] Maintenir pour éteindre · ${Math.round((this._currentFireTarget?.progress||0)*100)}%`;
        else if (this._currentFireDist) hEl.textContent = `Distance foyer : ${this._currentFireDist.toFixed(1)}m`;
      }
      if (abEl && afEl && alEl) {
        if (inRange && this._eHeld) {
          abEl.style.display = 'block';
          alEl.textContent = '💧 En train d\'éteindre…';
          afEl.style.width = ((this._currentFireTarget?.progress||0)*100) + '%';
        } else {
          abEl.style.display = 'none';
        }
      }
    } else if (m === 'sauvetage') {
      mEl.textContent = `🧑 Mission 2/3 — Sauvetage`;
      if (dEl) dEl.textContent = `Trouve et secours la victime`;
      const d = this._victimDist;
      if (fEl) fEl.style.width = (this._victim?.done ? 100 : 0) + '%';
      if (pEl) pEl.textContent = 'Progression';
      if (hEl) hEl.textContent = d < Infinity ? `Distance : ${d.toFixed(1)}m · [E] maintenir` : '';
      if (abEl && afEl && alEl) {
        if (d < 3 && this._eHeld) {
          abEl.style.display = 'block';
          alEl.textContent = '🤝 Secours en cours…';
          afEl.style.width = (this._actionFill * 100) + '%';
        } else {
          abEl.style.display = 'none';
        }
      }
    } else if (m === 'inspection') {
      const total = this._inspectPts.length;
      const done  = this._inspectPts.filter(p => p.done).length;
      mEl.textContent = `🔍 Mission 3/3 — Inspection`;
      if (dEl) dEl.textContent = `${done}/${total} points inspectés`;
      if (fEl) fEl.style.width = (done / total * 100) + '%';
      if (pEl) pEl.textContent = 'Progression';
      const nearest = this._inspectPts.filter(p => !p.done).reduce((best, p) => {
        const d = this._d2(this._px, this._pz, p.x, p.z);
        return (!best || d < best.d) ? { p, d } : best;
      }, null);
      if (hEl) hEl.textContent = nearest ? `Distance : ${nearest.d.toFixed(1)}m · [E] maintenir` : '';
      if (abEl && afEl && alEl) {
        if (nearest && nearest.d < 3 && this._eHeld) {
          abEl.style.display = 'block';
          alEl.textContent = '🔦 Inspection…';
          afEl.style.width = (this._actionFill * 100) + '%';
        } else {
          abEl.style.display = 'none';
        }
      }
    }
  },

  _removeHUD() {
    if (this._hud) { this._hud.remove(); this._hud = null; }
    document.getElementById('pmp-hud')?.remove();
  },

  // ── Nettoyage ────────────────────────────────────────────────────────────────
  _cleanScene() {
    this._scene = null; this._camera = null;
    this._fires = []; this._victim = null;
    this._victimLight = null; this._inspectPts = [];
    this._fireLight = null; this._currentFireTarget = null;
    this._currentFireInRange = false; this._currentFireDist = Infinity;
    this._victimDist = Infinity; this._actionFill = 0;
  },

  _showMsg(text) { this._msg = text; this._msgTimer = 3.5; },
  _d2(ax, az, bx, bz) { return Math.sqrt((ax-bx)**2 + (az-bz)**2); },
};
