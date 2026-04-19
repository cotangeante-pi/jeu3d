const Hand = {
  _group: null,
  _punchT: 0,  // 1→0 pendant l'animation de frappe
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

    // Pouces (2 petites boîtes)
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.05), skinMat);
    thumb.position.set(-0.08, 0.02, -0.1);
    g.add(thumb);

    // Positon en bas à droite de la caméra
    g.position.set(0.27, -0.30, -0.52);
    g.rotation.x = 0.15; // légère inclinaison naturelle
    this._group = g;

    // Attacher à la caméra (scène doit contenir la caméra)
    State.scene.add(State.camera);
    State.camera.add(g);
  },

  punch() {
    if (this._punchT <= 0) this._punchT = 1.0;
  },

  update(delta) {
    if (!this._group) return;
    this._idleT += delta;

    if (this._punchT > 0) {
      this._punchT -= delta * 7;
      const t = Math.sin(Math.max(0, this._punchT) * Math.PI);
      this._group.position.z = -0.52 - t * 0.22; // avance vers l'avant
      this._group.position.y = -0.30 + t * 0.04;
      this._group.rotation.x = 0.15 - t * 0.3;
    } else {
      this._punchT = 0;
      // Oscillation idle légère (respiration)
      this._group.position.z = -0.52 + Math.sin(this._idleT * 1.4) * 0.004;
      this._group.position.y = -0.30 + Math.sin(this._idleT * 1.1) * 0.007;
      this._group.rotation.x = 0.15 + Math.sin(this._idleT * 0.9) * 0.01;
    }
  }
};
