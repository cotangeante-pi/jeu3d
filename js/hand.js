const Hand = {
  _group: null,
  _apple: null,
  _punchT: 0,     // 1→0 pendant l'animation de frappe
  _idleT:  0,     // temps absolu (respiration)
  _walkT:  0,     // phase de marche (s'accumule selon la vitesse)
  _landT:  0,     // 1→0 choc d'atterrissage
  _airT:   0,     // temps passé en l'air (pour animation saut)
  _wasOnGround: true,

  BASE_X:  0.27,
  BASE_Y: -0.30,
  BASE_Z: -0.52,
  BASE_RX: 0.15,

  init() {
    const skinMat   = new THREE.MeshLambertMaterial({ color: 0xd4956a });
    const sleeveMat = new THREE.MeshLambertMaterial({ color: 0x334488 });
    const g = new THREE.Group();

    // Manche / avant-bras
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.30), sleeveMat);
    sleeve.position.z = 0.13;
    g.add(sleeve);

    // Poignet peau
    const wrist = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.10, 0.08), skinMat);
    wrist.position.z = -0.02;
    g.add(wrist);

    // Poing principal
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.13), skinMat);
    fist.position.z = -0.1;
    g.add(fist);

    // Pouce
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.05), skinMat);
    thumb.position.set(-0.08, 0.02, -0.1);
    g.add(thumb);

    // Doigts (4 petits rectangles sur le dessus du poing)
    for (let i = 0; i < 4; i++) {
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.042, 0.048), skinMat);
      finger.position.set(-0.044 + i * 0.03, 0.082, -0.1);
      g.add(finger);
    }

    // Pomme tenue en main (cachée par défaut)
    const appleMat  = new THREE.MeshLambertMaterial({ color: 0xcc2200 });
    const appleMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), appleMat);
    appleMesh.position.set(0.01, 0.10, -0.14);
    appleMesh.visible = false;
    g.add(appleMesh);
    this._apple = appleMesh;

    g.position.set(this.BASE_X, this.BASE_Y, this.BASE_Z);
    g.rotation.x = this.BASE_RX;
    this._group = g;

    State.scene.add(State.camera);
    State.camera.add(g);
  },

  punch() {
    if (this._punchT <= 0) this._punchT = 1.0;
  },

  update(delta) {
    if (!this._group) return;
    const g = this._group;
    this._idleT += delta;

    // Pomme visible si item sélectionné = Pomme et pas en frappe
    if (this._apple) {
      const sel = State.inventory && State.inventory[State.selectedSlot];
      this._apple.visible = !!(sel && sel.name === 'Pomme' && this._punchT <= 0);
    }

    // État du joueur
    const vx       = State.velX || 0;
    const vz       = State.velZ || 0;
    const speed    = Math.sqrt(vx * vx + vz * vz);
    const isMoving = speed > 0.5;
    const isSprint = isMoving && (State.keys['ShiftLeft'] || State.keys['ShiftRight']);
    const onGround = State.onGround !== false;

    // Détection atterrissage
    if (!this._wasOnGround && onGround) {
      this._landT = 1.0;
    }
    this._wasOnGround = onGround;
    if (this._landT > 0) this._landT = Math.max(0, this._landT - delta * 6);

    // Temps en l'air (pour pencher la main vers le bas lors du saut)
    if (!onGround) {
      this._airT += delta;
    } else {
      this._airT = 0;
    }

    // Phase de marche : s'accumule selon la cadence
    if (isMoving && onGround) {
      this._walkT += delta * (isSprint ? 9.5 : 5.5);
    }

    // --- Animation frappe ---
    if (this._punchT > 0) {
      this._punchT = Math.max(0, this._punchT - delta * 7);
      const t = Math.sin(this._punchT * Math.PI);
      g.position.set(this.BASE_X, this.BASE_Y + t * 0.04, this.BASE_Z - t * 0.22);
      g.rotation.x = this.BASE_RX - t * 0.3;
      g.rotation.z = 0;
      return;
    }

    // --- Amplitudes selon l'état ---
    let bobAmp, swayAmp, fwdAmp, rotAmp;
    if (!onGround) {
      // En l'air : main légèrement vers le bas (gravité visuelle)
      bobAmp = 0.006; swayAmp = 0.003; fwdAmp = 0.004; rotAmp = 0.03;
    } else if (isSprint) {
      // Course : pompage prononcé
      bobAmp = 0.042; swayAmp = 0.020; fwdAmp = 0.030; rotAmp = 0.20;
    } else if (isMoving) {
      // Marche : bob modéré
      bobAmp = 0.018; swayAmp = 0.009; fwdAmp = 0.013; rotAmp = 0.09;
    } else {
      // Idle : seulement la respiration
      bobAmp = 0; swayAmp = 0; fwdAmp = 0; rotAmp = 0;
    }

    // Oscillations de marche (cycle complet = 2 pas)
    const bob  = Math.sin(this._walkT)       * bobAmp;
    const sway = Math.sin(this._walkT * 0.5) * swayAmp;
    const fwd  = Math.cos(this._walkT)       * fwdAmp;
    const rotX = Math.sin(this._walkT)       * rotAmp;

    // Respiration (toujours présente, faible amplitude)
    const breathY  = Math.sin(this._idleT * 1.1) * 0.007;
    const breathZ  = Math.sin(this._idleT * 1.4) * 0.004;
    const breathRX = Math.sin(this._idleT * 0.9) * 0.010;

    // Choc d'atterrissage : main descend brusquement puis remonte
    const land = this._landT > 0 ? Math.sin(this._landT * Math.PI) * 0.055 : 0;

    // En l'air : légère inclinaison vers le bas proportionnelle au temps de vol
    const airDrop = Math.min(this._airT * 0.04, 0.03);

    g.position.set(
      this.BASE_X + sway,
      this.BASE_Y + bob + breathY - land - airDrop,
      this.BASE_Z + fwd + breathZ
    );
    g.rotation.x = this.BASE_RX + rotX + breathRX;
    g.rotation.z = -sway * 1.8;
  }
};
