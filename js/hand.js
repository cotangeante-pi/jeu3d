const Hand = {
  _group: null,
  _apple: null,
  _punchT: 0,
  _idleT:  0,

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

    // Poing
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.13), skinMat);
    fist.position.z = -0.1;
    g.add(fist);

    // Pouce
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.05), skinMat);
    thumb.position.set(-0.08, 0.02, -0.1);
    g.add(thumb);

    // Pomme tenue en main (sphère rouge, cachée par défaut)
    const appleMat = new THREE.MeshLambertMaterial({ color: 0xcc2200 });
    const appleMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), appleMat);
    appleMesh.position.set(0.01, 0.10, -0.14);
    appleMesh.visible = false;
    g.add(appleMesh);
    this._apple = appleMesh;

    // Positon en bas à droite de la caméra
    g.position.set(0.27, -0.30, -0.52);
    g.rotation.x = 0.15;
    this._group = g;

    State.scene.add(State.camera);
    State.camera.add(g);
  },

  punch() {
    if (this._punchT <= 0) this._punchT = 1.0;
  },

  update(delta) {
    if (!this._group) return;
    this._idleT += delta;

    // Pomme visible si item sélectionné = Pomme et pas en train de frapper
    const selected = State.inventory[State.selectedSlot];
    this._apple.visible = !!(selected && selected.name === 'Pomme' && this._punchT <= 0);

    const moving   = Math.abs(State.velX) > 0.1 || Math.abs(State.velZ) > 0.1;
    const boosting = State.keys['ShiftLeft'] || State.keys['ShiftRight'];

    if (this._punchT > 0) {
      // Animation frappe
      this._punchT -= delta * 7;
      const t = Math.sin(Math.max(0, this._punchT) * Math.PI);
      this._group.position.set(0.27, -0.30 + t * 0.04, -0.52 - t * 0.22);
      this._group.rotation.x = 0.15 - t * 0.3;
      this._group.rotation.z = 0;
    } else {
      this._punchT = 0;

      if (moving) {
        // Animation course : balancement vertical et latéral rythmé
        const freq    = boosting ? 9.0 : 6.0;
        const ampY    = boosting ? 0.035 : 0.022;
        const ampX    = boosting ? 0.018 : 0.010;
        const t       = this._idleT * freq;
        this._group.position.set(
          0.27 + Math.sin(t * 0.5) * ampX,
          -0.30 + Math.sin(t) * ampY,
          -0.52 + Math.sin(t * 0.5) * 0.005
        );
        this._group.rotation.x = 0.15 + Math.sin(t) * 0.06;
        this._group.rotation.z =        Math.sin(t * 0.5) * 0.04;
      } else {
        // Oscillation idle légère (respiration)
        this._group.position.set(
          0.27,
          -0.30 + Math.sin(this._idleT * 1.1) * 0.007,
          -0.52 + Math.sin(this._idleT * 1.4) * 0.004
        );
        this._group.rotation.x = 0.15 + Math.sin(this._idleT * 0.9) * 0.01;
        this._group.rotation.z = 0;
      }
    }
  }
};
