const Humans = {
  _pedestrians: [],
  _policeOnFoot: [],
  _policeCars: [],
  _streetX: [],
  _streetZ: [],

  // Offset sidewalk depuis le centre de la route (roadW/2 + sidewalkW/2 = 7 + 0.6)
  SIDE_OFF: 7.8,

  init(scene) {
    const step = CONFIG.GRID_STEP;
    const range = Math.floor(CONFIG.CITY_RADIUS / step);
    for (let n = -range; n <= range; n++) {
      if (Math.abs(n) % 3 === 1) {
        this._streetX.push(n * step);
        this._streetZ.push(n * step);
      }
    }

    // 60 piétons sur les trottoirs
    for (let i = 0; i < 60; i++) {
      this._pedestrians.push(this._spawnHuman(scene, false));
    }

    // 12 policiers à pied
    for (let i = 0; i < 12; i++) {
      this._policeOnFoot.push(this._spawnHuman(scene, true));
    }

    // 6 voitures de police
    for (let i = 0; i < 6; i++) {
      this._policeCars.push(this._spawnCar(scene));
    }
  },

  _randFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  // ─── Spawn humain (piéton ou policier à pied) ───────────────────────────────
  _spawnHuman(scene, isPolice) {
    const skinColors = [0xf5c5a3, 0xd4956a, 0x8d5524, 0xc68642];
    const outfitColors = [0x1144cc, 0xaa2222, 0x229944, 0x886622, 0x554499];

    const skinColor  = isPolice ? 0xf0c8a0 : skinColors[Math.floor(Math.random() * skinColors.length)];
    const bodyColor  = isPolice ? 0x1a237e  : outfitColors[Math.floor(Math.random() * outfitColors.length)];
    const legColor   = isPolice ? 0x0d1550  : 0x222244;

    const g = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.1, 0.32),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    );
    body.position.y = 0.95;
    body.castShadow = true;
    g.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshLambertMaterial({ color: skinColor })
    );
    head.position.y = 1.72;
    g.add(head);

    const legMat = new THREE.MeshLambertMaterial({ color: legColor });
    const legGeo = new THREE.BoxGeometry(0.18, 0.62, 0.2);

    const legLPivot = new THREE.Group(); legLPivot.position.set(-0.13, 0.4, 0);
    const legL = new THREE.Mesh(legGeo, legMat); legL.position.y = -0.31; legLPivot.add(legL);
    g.add(legLPivot);

    const legRPivot = new THREE.Group(); legRPivot.position.set(0.13, 0.4, 0);
    const legR = new THREE.Mesh(legGeo, legMat); legR.position.y = -0.31; legRPivot.add(legR);
    g.add(legRPivot);

    const armMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.2);

    const armLPivot = new THREE.Group(); armLPivot.position.set(-0.33, 1.4, 0);
    const armL = new THREE.Mesh(armGeo, armMat); armL.position.y = -0.3; armLPivot.add(armL);
    g.add(armLPivot);

    const armRPivot = new THREE.Group(); armRPivot.position.set(0.33, 1.4, 0);
    const armR = new THREE.Mesh(armGeo, armMat); armR.position.y = -0.3; armRPivot.add(armR);
    g.add(armRPivot);

    if (isPolice) {
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.14, 0.52),
        new THREE.MeshLambertMaterial({ color: 0x0d1550 })
      );
      cap.position.y = 1.9; g.add(cap);
      const brim = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.04, 0.3),
        new THREE.MeshLambertMaterial({ color: 0x0d1550 })
      );
      brim.position.set(0, 1.85, 0.3); g.add(brim);
      const badge = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.04),
        new THREE.MeshLambertMaterial({ color: 0xffcc00 })
      );
      badge.position.set(-0.1, 1.0, 0.17); g.add(badge);
    }

    // Position initiale sur trottoir
    const { x, z, roadType, roadVal, sideDir } = this._randomSidewalkPos();
    g.position.set(x, 0, z);
    scene.add(g);

    // ── Barre de vie au-dessus de la tête ──
    const BAR_W = 0.55;
    const hpBgMat   = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const hpFillMat = new THREE.MeshBasicMaterial({ color: 0x22cc22 });
    const hpBg   = new THREE.Mesh(new THREE.BoxGeometry(BAR_W + 0.06, 0.10, 0.02), hpBgMat);
    const hpFill = new THREE.Mesh(new THREE.BoxGeometry(BAR_W, 0.07, 0.02), hpFillMat);
    scene.add(hpBg);
    scene.add(hpFill);

    const baseSpeed = isPolice ? 2.4 : 0.8 + Math.random() * 1.0;
    const maxHp     = isPolice ? 150 : 100;

    const h = {
      group: g, isPolice,
      x, z,
      roadType, roadVal, sideDir,
      targetX: x, targetZ: z,
      state: 'walking',
      pauseTimer: 0,
      alertTimer: 0,
      walkTimer: Math.random() * Math.PI * 2,
      baseSpeed,
      speed: baseSpeed,
      legLPivot, legRPivot, armLPivot, armRPivot,
      hp: maxHp, maxHp,
      hpBg, hpFill, hpFillMat, hpBarW: BAR_W,
    };

    this._pickWaypoint(h);
    return h;
  },

  // ── Inflige des dégâts à un humain (appelé depuis interactions.js) ──────────
  damageHuman(h, amount) {
    if (!h) return;
    h.hp = Math.max(0, h.hp - amount);
  },

  // ─── Spawn voiture de police ─────────────────────────────────────────────────
  _spawnCar(scene) {
    const roadType = Math.random() < 0.5 ? 'v' : 'h';
    const roadVal  = this._randFrom(roadType === 'v' ? this._streetX : this._streetZ) || 14;
    const laneOff  = (Math.random() < 0.5 ? 1 : -1) * 3.2;

    let x, z;
    if (roadType === 'v') {
      x = roadVal + laneOff;
      z = (Math.random() - 0.5) * CONFIG.CITY_RADIUS * 1.4;
    } else {
      z = roadVal + laneOff;
      x = (Math.random() - 0.5) * CONFIG.CITY_RADIUS * 1.4;
    }

    const g = new THREE.Group();

    const bodyMat  = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const darkMat  = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 });

    // Carrosserie
    const carBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 3.6), bodyMat);
    carBody.position.y = 0.55; carBody.castShadow = true; g.add(carBody);

    // Bande bleue latérale (police)
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.22, 3.62),
      new THREE.MeshLambertMaterial({ color: 0x1a237e }));
    stripe.position.y = 0.55; g.add(stripe);

    // Toit
    const carTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.0), bodyMat);
    carTop.position.set(0, 1.1, -0.1); g.add(carTop);

    // Pare-brise
    const wind = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 0.08), glassMat);
    wind.position.set(0, 1.1, 0.89); g.add(wind);

    // Lunette arrière
    const rear = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 0.08), glassMat);
    rear.position.set(0, 1.1, -1.1); g.add(rear);

    // Gyrophare (rouge/bleu alternant via emissive)
    const sirenMat = new THREE.MeshLambertMaterial({
      color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.2
    });
    const siren = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.18, 0.32), sirenMat);
    siren.position.set(0, 1.44, -0.1); g.add(siren);

    // 4 roues
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10);
    [[-0.95, -1.2], [-0.95, 1.2], [0.95, -1.2], [0.95, 1.2]].forEach(([dx, dz]) => {
      const w = new THREE.Mesh(wheelGeo, darkMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(dx, 0.28, dz);
      g.add(w);
    });

    g.position.set(x, 0, z);
    scene.add(g);

    const car = {
      group: g, siren, sirenMat,
      x, z, roadType, roadVal, laneOff,
      targetX: x, targetZ: z,
      state: 'cruise',   // 'cruise' | 'pursuing'
      speed: 7.5,
      angle: 0,
      sirenTimer: 0,
      pursuitCooldown: 0,
    };
    this._pickCarWaypoint(car);
    return car;
  },

  // ─── Position aléatoire sur trottoir ─────────────────────────────────────────
  _randomSidewalkPos() {
    const cityR = CONFIG.CITY_RADIUS;
    const roadType = Math.random() < 0.5 ? 'v' : 'h';
    const sideDir  = Math.random() < 0.5 ? 1 : -1;
    const roadVal  = this._randFrom(roadType === 'v' ? this._streetX : this._streetZ) || 14;
    let x, z;
    if (roadType === 'v') {
      x = roadVal + sideDir * this.SIDE_OFF;
      z = (Math.random() - 0.5) * cityR * 1.6;
    } else {
      z = roadVal + sideDir * this.SIDE_OFF;
      x = (Math.random() - 0.5) * cityR * 1.6;
    }
    return { x, z, roadType, roadVal, sideDir };
  },

  // ─── Choisir prochain waypoint (piéton/policier à pied) ──────────────────────
  _pickWaypoint(h) {
    const cityR = CONFIG.CITY_RADIUS * 1.4;

    if (h.isPolice) {
      // Policier : patrouille sur les rues, change parfois de route
      if (Math.random() < 0.25) {
        h.roadType = Math.random() < 0.5 ? 'v' : 'h';
        h.roadVal  = this._randFrom(h.roadType === 'v' ? this._streetX : this._streetZ) || 14;
        h.sideDir  = Math.random() < 0.5 ? 1 : -1;
      }
      if (h.roadType === 'v') {
        h.targetX = h.roadVal + h.sideDir * this.SIDE_OFF;
        h.targetZ = (Math.random() - 0.5) * cityR;
      } else {
        h.targetZ = h.roadVal + h.sideDir * this.SIDE_OFF;
        h.targetX = (Math.random() - 0.5) * cityR;
      }
      h.state = 'walking';
      return;
    }

    // Piéton : comportements variés
    const r = Math.random();

    if (r < 0.55) {
      // Continue sur le même trottoir (dans la même direction ou un peu plus loin)
      if (h.roadType === 'v') {
        h.targetX = h.roadVal + h.sideDir * this.SIDE_OFF;
        h.targetZ = h.z + (Math.random() < 0.5 ? 1 : -1) * (8 + Math.random() * 28);
      } else {
        h.targetZ = h.roadVal + h.sideDir * this.SIDE_OFF;
        h.targetX = h.x + (Math.random() < 0.5 ? 1 : -1) * (8 + Math.random() * 28);
      }
      h.state = 'walking';
    } else if (r < 0.78) {
      // Tourne sur un trottoir perpendiculaire à l'intersection suivante
      const perpType = h.roadType === 'v' ? 'h' : 'v';
      const perpArr  = perpType === 'v' ? this._streetX : this._streetZ;
      if (perpArr.length > 0) {
        h.roadType = perpType;
        h.roadVal  = this._randFrom(perpArr);
        h.sideDir  = Math.random() < 0.5 ? 1 : -1;
      }
      if (h.roadType === 'v') {
        h.targetX = h.roadVal + h.sideDir * this.SIDE_OFF;
        h.targetZ = (Math.random() - 0.5) * cityR;
      } else {
        h.targetZ = h.roadVal + h.sideDir * this.SIDE_OFF;
        h.targetX = (Math.random() - 0.5) * cityR;
      }
      h.state = 'walking';
    } else if (r < 0.9) {
      // S'arrête devant une vitrine / boutique
      h.state    = 'pausing';
      h.pauseTimer = 1.5 + Math.random() * 5;
    } else {
      // Rebrousse chemin
      if (h.roadType === 'v') {
        h.targetX = h.roadVal + h.sideDir * this.SIDE_OFF;
        h.targetZ = h.z - (Math.random() * 15 + 5);
      } else {
        h.targetZ = h.roadVal + h.sideDir * this.SIDE_OFF;
        h.targetX = h.x - (Math.random() * 15 + 5);
      }
      h.state = 'walking';
    }

    // Clamp dans les limites de la ville
    h.targetX = Math.max(-cityR, Math.min(cityR, h.targetX));
    h.targetZ = Math.max(-cityR, Math.min(cityR, h.targetZ));
  },

  // ─── Choisir prochain waypoint pour une voiture (toujours sur route) ─────────
  _pickCarWaypoint(car) {
    const step  = CONFIG.GRID_STEP;
    const cityR = CONFIG.CITY_RADIUS;
    // Avance de 3 à 6 blocs sur la route courante, puis tourne parfois
    const blocksAhead = (3 + Math.floor(Math.random() * 4)) * step;
    const dir = Math.random() < 0.5 ? 1 : -1;

    if (car.roadType === 'v') {
      // Avance le long de Z sur la route verticale
      car.targetX = car.roadVal + car.laneOff;
      car.targetZ  = Math.max(-cityR, Math.min(cityR, car.z + dir * blocksAhead));
    } else {
      // Avance le long de X sur la route horizontale
      car.targetZ  = car.roadVal + car.laneOff;
      car.targetX  = Math.max(-cityR, Math.min(cityR, car.x + dir * blocksAhead));
    }
  },

  // ─── Tourne la voiture à l'intersection si proche ─────────────────────────────
  _tryCarTurn(car) {
    const step    = CONFIG.GRID_STEP;
    if (Math.random() > 0.35) return; // 35 % de chance de tourner
    if (car.roadType === 'v') {
      // Cherche la rue horizontale la plus proche
      const nearZ = this._streetZ.reduce((best, sz) =>
        Math.abs(sz - car.z) < Math.abs(best - car.z) ? sz : best, this._streetZ[0]);
      if (nearZ !== undefined && Math.abs(nearZ - car.z) < 3) {
        car.roadType = 'h';
        car.roadVal  = nearZ;
        car.laneOff  = (Math.random() < 0.5 ? 1 : -1) * 3.2;
        car.z = nearZ;
      }
    } else {
      const nearX = this._streetX.reduce((best, sx) =>
        Math.abs(sx - car.x) < Math.abs(best - car.x) ? sx : best, this._streetX[0]);
      if (nearX !== undefined && Math.abs(nearX - car.x) < 3) {
        car.roadType = 'v';
        car.roadVal  = nearX;
        car.laneOff  = (Math.random() < 0.5 ? 1 : -1) * 3.2;
        car.x = nearX;
      }
    }
    this._pickCarWaypoint(car);
  },

  // ─── Humain le plus proche dans un rayon ─────────────────────────────────────
  getNearestHuman(px, pz, range) {
    let best = null, bestDist = range;
    [...this._pedestrians, ...this._policeOnFoot].forEach(h => {
      const d = Math.hypot(h.x - px, h.z - pz);
      if (d < bestDist) { bestDist = d; best = h; }
    });
    return best;
  },

  // ─── Update principal ─────────────────────────────────────────────────────────
  update(delta) {
    if (State.paused || State.gameOver) return;

    this._pedestrians.forEach(h  => this._tickHuman(h, delta, false));
    this._policeOnFoot.forEach(h => this._tickHuman(h, delta, true));
    this._policeCars.forEach(car => this._tickCar(car, delta));

    this._updateWanted(delta);
  },

  // ─── Gestion décroissance wanted + arrestation ────────────────────────────────
  _updateWanted(delta) {
    if (State.wanted <= 0) return;

    // Distance minimale à tous les policiers
    const allPolice = [
      ...this._policeOnFoot,
      ...this._policeCars,
    ];
    const minDist = allPolice.reduce((min, p) => {
      return Math.min(min, Math.hypot((p.x || 0) - State.posX, (p.z || 0) - State.posZ));
    }, Infinity);

    // Hors de vue de la police → le wanted décroît après 15s
    if (minDist > 28) {
      State.wantedDecayTimer += delta;
      if (State.wantedDecayTimer >= 15) {
        State.wanted = Math.max(0, State.wanted - 1);
        State.wantedDecayTimer = 0;
        HUD.update();
      }
    } else {
      State.wantedDecayTimer = 0;
    }

    // Arrestation : policier à pied en mode chase qui touche le joueur
    this._policeOnFoot.forEach(h => {
      if (h.state !== 'chase') return;
      if (Math.hypot(h.x - State.posX, h.z - State.posZ) < 1.8) {
        // Arrêté : amende + dégâts + wanted retiré
        State.health = Math.max(0, State.health - 15);
        State.money  = Math.max(0, State.money  - 100);
        State.wanted = 0;
        State.wantedDecayTimer = 0;
        h.state = 'walking';
        this._pickWaypoint(h);
        HUD.update();
        Save.write();
      }
    });
  },

  // ─── Mise à jour barre de vie ─────────────────────────────────────────────────
  _updateHpBar(h) {
    const pct = Math.max(0, h.hp / h.maxHp);
    // Orienter vers la caméra
    const camX = State.camera.position.x;
    const camZ = State.camera.position.z;
    const ang  = Math.atan2(camX - h.x, camZ - h.z);

    h.hpBg.position.set(h.x, 2.35, h.z);
    h.hpBg.rotation.y = ang;

    // Décaler le fill pour qu'il parte de la gauche
    const sinA = Math.sin(ang), cosA = Math.cos(ang);
    const offset = -h.hpBarW / 2 * (1 - pct);
    h.hpFill.position.set(h.x + sinA * offset, 2.35, h.z + cosA * offset);
    h.hpFill.rotation.y = ang;
    h.hpFill.scale.x = Math.max(0.001, pct);

    if (pct > 0.6)      h.hpFillMat.color.setHex(0x22cc22);
    else if (pct > 0.3) h.hpFillMat.color.setHex(0xffaa00);
    else                h.hpFillMat.color.setHex(0xcc2222);

    // Masquer si plein
    h.hpBg.visible   = pct < 1.0;
    h.hpFill.visible  = pct < 1.0;
  },

  // ─── Tick humain (piéton ou policier) ────────────────────────────────────────
  _tickHuman(h, delta, isPolice) {
    h.walkTimer += delta;
    this._updateHpBar(h);

    const pdx = State.posX - h.x;
    const pdz = State.posZ - h.z;
    const playerDist = Math.sqrt(pdx * pdx + pdz * pdz);

    // ── Réaction au joueur ──
    if (isPolice) {
      const detectionRange = 10 + State.wanted * 5; // augmente avec le niveau wanted
      if (State.wanted > 0 && playerDist < detectionRange && h.state !== 'chase') {
        h.state      = 'chase';
        h.alertTimer = 10;
      }
      if (h.state === 'chase') {
        if (State.wanted <= 0) {
          // Pardonne si le wanted est retombé à 0
          h.state = 'walking';
          h.speed = h.baseSpeed;
          this._pickWaypoint(h);
        } else {
          h.alertTimer -= delta;
          h.targetX = State.posX + (Math.random() - 0.5) * 1.2;
          h.targetZ = State.posZ + (Math.random() - 0.5) * 1.2;
          h.speed   = h.baseSpeed * 1.9;
          if (playerDist > 28 || h.alertTimer <= 0) {
            h.state = 'walking';
            h.speed = h.baseSpeed;
            this._pickWaypoint(h);
          }
        }
      } else {
        h.speed = h.baseSpeed;
      }
    } else {
      // Piéton : fuite si le joueur est très proche
      if (playerDist < 3.5 && h.state !== 'flee') {
        h.state = 'flee';
        const fleeAngle = Math.atan2(h.z - State.posZ, h.x - State.posX);
        h.targetX = h.x + Math.cos(fleeAngle) * 30;
        h.targetZ = h.z + Math.sin(fleeAngle) * 30;
        h.speed   = h.baseSpeed * 2.4;
      }
      if (h.state === 'flee' && playerDist > 14) {
        h.state = 'walking';
        h.speed = h.baseSpeed;
        this._pickWaypoint(h);
      }
      // Accélère légèrement si joueur est à portée visuelle
      if (h.state === 'walking') {
        h.speed = playerDist < 9 ? h.baseSpeed * 1.25 : h.baseSpeed;
      }
    }

    // ── État pause (regarder vitrine) ──
    if (h.state === 'pausing') {
      h.pauseTimer -= delta;
      // Membres s'arrêtent doucement
      h.legLPivot.rotation.x *= 0.82;
      h.legRPivot.rotation.x *= 0.82;
      h.armLPivot.rotation.x *= 0.82;
      h.armRPivot.rotation.x *= 0.82;
      if (h.pauseTimer <= 0) {
        h.state = 'walking';
        this._pickWaypoint(h);
      }
      return;
    }

    // ── Déplacement ──
    const dx   = h.targetX - h.x;
    const dz   = h.targetZ - h.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.5) {
      if (h.state === 'flee') {
        h.state = 'walking';
        h.speed = h.baseSpeed;
      }
      if (!isPolice && h.state !== 'chase') {
        // Petite pause naturelle 30% du temps
        if (Math.random() < 0.3) {
          h.state      = 'pausing';
          h.pauseTimer = 0.4 + Math.random() * 1.8;
        } else {
          this._pickWaypoint(h);
        }
      } else {
        this._pickWaypoint(h);
      }
      return;
    }

    const nx = dx / dist;
    const nz = dz / dist;
    h.x += nx * h.speed * delta;
    h.z += nz * h.speed * delta;
    h.group.position.set(h.x, 0, h.z);
    h.group.rotation.y = Math.atan2(nx, nz);

    // ── Animation membres ──
    const isFleeing = h.state === 'flee' || (isPolice && h.state === 'chase');
    const swingFreq = isFleeing ? 9 : 5;
    const swingAmt  = isFleeing ? 0.7 : 0.45;
    const swing = Math.sin(h.walkTimer * swingFreq) * swingAmt;
    h.legLPivot.rotation.x =  swing;
    h.legRPivot.rotation.x = -swing;
    h.armLPivot.rotation.x = -swing * 0.55;
    h.armRPivot.rotation.x =  swing * 0.55;
  },

  // ─── Tick voiture de police ───────────────────────────────────────────────────
  _tickCar(car, delta) {
    car.sirenTimer += delta;

    // Gyrophare rouge/bleu clignotant (4 Hz)
    if (Math.floor(car.sirenTimer * 4) % 2 === 0) {
      car.sirenMat.color.setHex(0xff0000);
      car.sirenMat.emissive.setHex(0xff0000);
    } else {
      car.sirenMat.color.setHex(0x0033ff);
      car.sirenMat.emissive.setHex(0x0033ff);
    }

    // Détection joueur (seulement si wanted >= 2)
    const pdx = State.posX - car.x;
    const pdz = State.posZ - car.z;
    const playerDist = Math.sqrt(pdx * pdx + pdz * pdz);

    const pursuitRange = 20 + State.wanted * 8;
    if (State.wanted >= 2 && playerDist < pursuitRange && car.state !== 'pursuing') {
      car.state = 'pursuing';
    }
    if (car.state === 'pursuing' && (State.wanted < 2 || playerDist > 50)) {
      car.state = 'cruise';
    }

    let tX, tZ, speed;

    if (car.state === 'pursuing') {
      tX    = State.posX + State.velX * 0.5;
      tZ    = State.posZ + State.velZ * 0.5;
      speed = car.speed * 1.5;
    } else {
      // Snap à la route pour ne pas traverser les bâtiments
      if (car.roadType === 'v') {
        car.x = car.roadVal + car.laneOff;
      } else {
        car.z = car.roadVal + car.laneOff;
      }
      tX    = car.targetX;
      tZ    = car.targetZ;
      speed = car.speed;
    }

    const dx   = tX - car.x;
    const dz   = tZ - car.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 2.0 && car.state === 'cruise') {
      this._tryCarTurn(car);
      this._pickCarWaypoint(car);
      return;
    }
    if (dist < 0.5) return;

    const nx = dx / dist;
    const nz = dz / dist;
    car.x += nx * speed * delta;
    car.z += nz * speed * delta;

    // Rotation progressive (inertie de virage)
    const wantAngle = Math.atan2(nx, nz);
    let angleDiff   = wantAngle - car.angle;
    while (angleDiff >  Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    car.angle += angleDiff * Math.min(1, 4 * delta);

    car.group.position.set(car.x, 0, car.z);
    car.group.rotation.y = car.angle;
  },
};
