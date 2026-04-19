const Cars = {
  _list: [],

  // Définitions : parking juste devant le concessionnaire (x=-28, z=70, façade à z=70)
  // speed = vitesse max en m/s (×3.6 = km/h)   boost = multiplicateur Shift
  _DEFS: [
    { badgeId: 'car_basic',  name: 'Citadine',      color: 0xcc2200, parkX: -18, parkZ: 63, speed: 28, boost: 1.35 }, // ~100 km/h, boost ~135 km/h
    { badgeId: 'car_sedan',  name: 'Berline',        color: 0x2244cc, parkX: -28, parkZ: 63, speed: 44, boost: 1.30 }, // ~158 km/h, boost ~206 km/h
    { badgeId: 'car_sport',  name: 'Voiture sport',  color: 0x111111, parkX: -38, parkZ: 63, speed: 64, boost: 1.40 }, // ~230 km/h, boost ~322 km/h
  ],

  init(scene) {
    this._list = [];
    this._DEFS.forEach(def => {
      const saved = State.carPositions && State.carPositions[def.badgeId];
      const x     = saved ? saved.x     : def.parkX;
      const z     = saved ? saved.z     : def.parkZ;
      const angle = saved ? saved.angle : 0;

      const mesh = this._buildMesh(def.color);
      mesh.position.set(x, 0, z);
      mesh.rotation.y = angle;
      mesh.visible    = State.badges.includes(def.badgeId);
      scene.add(mesh);

      this._list.push({ badgeId: def.badgeId, name: def.name, speed: def.speed, boost: def.boost, mesh, x, z, angle, vx: 0, vz: 0 });
    });
  },

  // Appelé depuis interactions.buyCar quand une voiture est achetée
  onCarBought(badgeId) {
    const car = this._list.find(c => c.badgeId === badgeId);
    if (car) car.mesh.visible = true;
  },

  update(delta) {
    // Voiture conduite
    if (State.inCar && State.drivingCar) {
      this._driveTick(State.drivingCar, delta);
    }

    // Détection voiture proche (à pied uniquement)
    State.nearCar = null;
    if (!State.inCar) {
      for (const car of this._list) {
        if (!car.mesh.visible) continue;
        if (Math.hypot(car.x - State.posX, car.z - State.posZ) < 3.5) {
          State.nearCar = car;
          break;
        }
      }
    }
  },

  enterCar(car) {
    State.inCar      = true;
    State.drivingCar = car;
    State.nearCar    = null;
    car.vx = 0;
    car.vz = 0;
    // Synchronise yaw sur l'angle de la voiture
    State.yaw   = car.angle;
    State.pitch = 0;
  },

  exitCar() {
    const car = State.drivingCar;
    car.vx = 0;
    car.vz = 0;

    // Place le joueur sur le côté de la voiture
    const sideX =  Math.cos(car.angle) * 2.8;
    const sideZ = -Math.sin(car.angle) * 2.8;
    State.posX = car.x + sideX;
    State.posZ = car.z + sideZ;
    State.posY = CONFIG.GROUND_Y + CONFIG.PLAYER_HALF_H;
    State.velX = 0;
    State.velY = 0;
    State.velZ = 0;

    // Mémoriser la position pour la prochaine session
    if (!State.carPositions) State.carPositions = {};
    State.carPositions[car.badgeId] = { x: car.x, z: car.z, angle: car.angle };

    State.inCar      = false;
    State.drivingCar = null;
    State.yaw        = car.angle;
    Save.write();
  },

  // ─── Logique de conduite par frame ───────────────────────────────────────────
  _driveTick(car, delta) {
    const STEER      = 1.6;   // rad/s (virage clavier)
    const ACCEL      = 55;    // m/s² de poussée moteur
    const DRAG       = 1.8;   // résistance aérodynamique PAR SECONDE (frame-rate independent)
    const BRAKE_DRAG = 6.0;   // freinage moteur (S)

    // Souris → virage
    if (State.pointerLocked) {
      State.yaw -= State.mouseDX * CONFIG.SENSITIVITY * 0.4;
      State.mouseDX = 0;
      State.mouseDY = 0;
    }

    // A/D → virage
    if (State.keys['KeyA'] || State.keys['ArrowLeft'])  State.yaw += STEER * delta;
    if (State.keys['KeyD'] || State.keys['ArrowRight']) State.yaw -= STEER * delta;
    car.angle = State.yaw;

    // Shift = boost (multiplicateur de vitesse max + accel)
    const boosting  = State.keys['ShiftLeft'] || State.keys['ShiftRight'];
    const boostMult = boosting ? (car.boost || 1.35) : 1.0;
    const maxSpeed  = car.speed * boostMult;

    // W = gaz, S = frein/marche arrière
    let throttle = 0;
    if (State.keys['KeyW'] || State.keys['ArrowUp'])   throttle =  1;
    if (State.keys['KeyS'] || State.keys['ArrowDown']) throttle = -1;

    const sinA = Math.sin(car.angle);
    const cosA = Math.cos(car.angle);

    // Physique INDÉPENDANTE DU FRAMERATE :
    //   v_new = v_old * (1 - DRAG*dt) + force*dt
    // → vitesse terminale = ACCEL / DRAG ≈ 55/1.8 ≈ 30 m/s (limitée par maxSpeed)
    const dragFactor = 1 - (throttle < 0 ? BRAKE_DRAG : DRAG) * delta;
    const accelForce = boosting ? ACCEL * 1.4 : ACCEL;
    car.vx = car.vx * dragFactor + (-sinA * throttle * accelForce) * delta;
    car.vz = car.vz * dragFactor + (-cosA * throttle * accelForce) * delta;

    // Limiter à la vitesse max de cette voiture
    const spd = Math.hypot(car.vx, car.vz);
    if (spd > maxSpeed) { car.vx *= maxSpeed / spd; car.vz *= maxSpeed / spd; }

    const nx = car.x + car.vx * delta;
    const nz = car.z + car.vz * delta;

    if (!this._carHits(nx, car.z)) {
      car.x = nx;
    } else {
      car.vx *= -0.25;
    }

    if (!this._carHits(car.x, nz)) {
      car.z = nz;
    } else {
      car.vz *= -0.25;
    }

    car.mesh.position.set(car.x, 0, car.z);
    car.mesh.rotation.y = car.angle;

    // Joueur suit la voiture
    State.posX = car.x;
    State.posZ = car.z;
    State.posY = CONFIG.GROUND_Y + CONFIG.PLAYER_HALF_H;
    State.velX = car.vx;
    State.velZ = car.vz;

    // Caméra 3e personne : derrière la voiture, légèrement en hauteur
    // "derrière" = opposé du sens de marche (+sinA, +cosA)
    const CAM_DIST   = 9;
    const CAM_HEIGHT = 4;
    const cam = State.camera;
    cam.position.set(
      car.x + sinA * CAM_DIST,
      CAM_HEIGHT,
      car.z + cosA * CAM_DIST
    );
    cam.lookAt(car.x, 1.4, car.z);
  },

  // ─── Collision cercle vs AABB ────────────────────────────────────────────────
  _carHits(cx, cz) {
    const R = 1.85; // rayon d'encombrement de la voiture
    const nearby = State.colliders.filter(c => {
      const bx = (c.min.x + c.max.x) / 2;
      const bz = (c.min.z + c.max.z) / 2;
      return Math.abs(bx - cx) < 30 && Math.abs(bz - cz) < 30;
    });
    for (const box of nearby) {
      const nearX = Math.max(box.min.x, Math.min(cx, box.max.x));
      const nearZ = Math.max(box.min.z, Math.min(cz, box.max.z));
      const dx = cx - nearX, dz = cz - nearZ;
      if (dx * dx + dz * dz < R * R) return true;
    }
    return false;
  },

  // ─── Construction du mesh voiture ────────────────────────────────────────────
  _buildMesh(color) {
    const g = new THREE.Group();
    const bodyMat  = new THREE.MeshLambertMaterial({ color });
    const darkMat  = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 });

    // Carrosserie
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 3.6), bodyMat);
    body.position.y = 0.55; body.castShadow = true; g.add(body);

    // Toit
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.0), bodyMat);
    top.position.set(0, 1.1, 0.1); g.add(top);

    // Pare-brise avant (à -Z = sens de marche)
    const wind = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 0.08), glassMat);
    wind.position.set(0, 1.1, -0.88); g.add(wind);

    // Lunette arrière (à +Z = derrière)
    const rear = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 0.08), glassMat);
    rear.position.set(0, 1.1, 1.1); g.add(rear);

    // 4 roues  [X, Z] — avant à -Z, arrière à +Z
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10);
    [[-0.95, -1.2], [-0.95, 1.2], [0.95, -1.2], [0.95, 1.2]].forEach(([dx, dz]) => {
      const w = new THREE.Mesh(wheelGeo, darkMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(dx, 0.28, dz);
      g.add(w);
    });

    return g;
  },
};
