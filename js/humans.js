const Humans = {
  _pedestrians: [],
  _police: [],
  _streetX: [], // colonnes de rues (x fixes)
  _streetZ: [], // rangées de rues (z fixes)

  init(scene) {
    // Calculer les positions de rues valides
    const step = CONFIG.GRID_STEP;
    const range = Math.floor(CONFIG.CITY_RADIUS / step);
    for (let n = -range; n <= range; n++) {
      if (Math.abs(n) % 3 === 1) {
        this._streetX.push(n * step);
        this._streetZ.push(n * step);
      }
    }

    // 18 piétons
    for (let i = 0; i < 18; i++) {
      const x = this._randStreetX();
      const z = (Math.random() - 0.5) * CONFIG.CITY_RADIUS * 1.6;
      this._pedestrians.push(this._spawn(scene, x, z, false));
    }

    // 5 policiers
    for (let i = 0; i < 5; i++) {
      const x = this._randStreetX();
      const z = (Math.random() - 0.5) * CONFIG.CITY_RADIUS * 1.2;
      this._police.push(this._spawn(scene, x, z, true));
    }
  },

  _randStreetX() {
    return this._streetX[Math.floor(Math.random() * this._streetX.length)] || 0;
  },
  _randStreetZ() {
    return this._streetZ[Math.floor(Math.random() * this._streetZ.length)] || 0;
  },

  _spawn(scene, x, z, isPolice) {
    const skinColors = [0xf5c5a3, 0xd4956a, 0x8d5524, 0xc68642];
    const outfitColors = [0x1144cc, 0xaa2222, 0x229944, 0x886622, 0x554499];

    const skinColor = isPolice ? 0xf0c8a0 : skinColors[Math.floor(Math.random() * skinColors.length)];
    const bodyColor = isPolice ? 0x1a237e : outfitColors[Math.floor(Math.random() * outfitColors.length)];
    const legColor  = isPolice ? 0x0d1550 : 0x222244;

    const g = new THREE.Group();

    // Corps
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 1.1, 0.32),
      new THREE.MeshLambertMaterial({ color: bodyColor })
    );
    body.position.y = 0.95;
    g.add(body);

    // Tête
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshLambertMaterial({ color: skinColor })
    );
    head.position.y = 1.72;
    g.add(head);

    // Jambes (pivots à la hanche pour animation)
    const legMat = new THREE.MeshLambertMaterial({ color: legColor });
    const legGeo = new THREE.BoxGeometry(0.18, 0.62, 0.2);

    const legLPivot = new THREE.Group(); legLPivot.position.set(-0.13, 0.4, 0);
    const legL = new THREE.Mesh(legGeo, legMat); legL.position.y = -0.31; legLPivot.add(legL);
    g.add(legLPivot);

    const legRPivot = new THREE.Group(); legRPivot.position.set(0.13, 0.4, 0);
    const legR = new THREE.Mesh(legGeo, legMat); legR.position.y = -0.31; legRPivot.add(legR);
    g.add(legRPivot);

    // Bras (pivots à l'épaule)
    const armMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.2);

    const armLPivot = new THREE.Group(); armLPivot.position.set(-0.33, 1.4, 0);
    const armL = new THREE.Mesh(armGeo, armMat); armL.position.y = -0.3; armLPivot.add(armL);
    g.add(armLPivot);

    const armRPivot = new THREE.Group(); armRPivot.position.set(0.33, 1.4, 0);
    const armR = new THREE.Mesh(armGeo, armMat); armR.position.y = -0.3; armRPivot.add(armR);
    g.add(armRPivot);

    if (isPolice) {
      // Casquette
      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.14, 0.52),
        new THREE.MeshLambertMaterial({ color: 0x0d1550 })
      );
      cap.position.y = 1.9;
      g.add(cap);
      const brim = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.04, 0.3),
        new THREE.MeshLambertMaterial({ color: 0x0d1550 })
      );
      brim.position.set(0, 1.85, 0.3);
      g.add(brim);
      // Badge
      const badge = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.04),
        new THREE.MeshLambertMaterial({ color: 0xffcc00 })
      );
      badge.position.set(-0.1, 1.0, 0.17);
      g.add(badge);
    }

    g.position.set(x, 0, z);
    scene.add(g);

    return {
      group: g,
      isPolice,
      x, z,
      targetX: x, targetZ: z,
      state: 'waiting',
      waitTimer: Math.random() * 3,
      walkTimer: Math.random() * Math.PI * 2,
      legLPivot, legRPivot, armLPivot, armRPivot,
    };
  },

  update(delta) {
    if (State.paused || State.gameOver) return;
    [...this._pedestrians, ...this._police].forEach(h => this._tick(h, delta));
  },

  _tick(h, delta) {
    h.walkTimer += delta;

    if (h.state === 'waiting') {
      h.waitTimer -= delta;
      // Arrêt des membres
      h.legLPivot.rotation.x *= 0.85;
      h.legRPivot.rotation.x *= 0.85;
      h.armLPivot.rotation.x *= 0.85;
      h.armRPivot.rotation.x *= 0.85;

      if (h.waitTimer <= 0) {
        this._pickTarget(h);
        h.state = 'walking';
      }
      return;
    }

    // Marche vers la cible
    const dx = h.targetX - h.x;
    const dz = h.targetZ - h.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.4) {
      h.state = 'waiting';
      h.waitTimer = 0.8 + Math.random() * 3;
      return;
    }

    const speed = h.isPolice ? 1.8 : 1.3;
    const nx = dx / dist, nz = dz / dist;
    h.x += nx * speed * delta;
    h.z += nz * speed * delta;
    h.group.position.set(h.x, 0, h.z);
    h.group.rotation.y = Math.atan2(nx, nz);

    // Animation de marche
    const swing = Math.sin(h.walkTimer * 5) * 0.45;
    h.legLPivot.rotation.x =  swing;
    h.legRPivot.rotation.x = -swing;
    h.armLPivot.rotation.x = -swing * 0.55;
    h.armRPivot.rotation.x =  swing * 0.55;
  },

  _pickTarget(h) {
    const cityR = CONFIG.CITY_RADIUS;

    if (h.isPolice) {
      // Patrouille : reste sur une rue verticale, change parfois
      if (Math.random() < 0.3 && this._streetX.length > 0) {
        h.targetX = this._randStreetX();
      } else {
        h.targetX = h.x;
      }
      h.targetZ = (Math.random() - 0.5) * cityR * 1.4;
    } else {
      // Piéton : alterne entre rues verticales et horizontales
      if (Math.random() < 0.5 && this._streetX.length > 0) {
        h.targetX = this._randStreetX();
        h.targetZ = (Math.random() - 0.5) * cityR * 1.6;
      } else if (this._streetZ.length > 0) {
        h.targetX = (Math.random() - 0.5) * cityR * 1.6;
        h.targetZ = this._randStreetZ();
      }
    }
  }
};
