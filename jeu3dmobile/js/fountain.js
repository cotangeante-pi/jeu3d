const Fountain = {
  _coins: [],
  _group: null,
  POS: { x: 25, z: 14 }, // près du spawn (14, 14)
  RANGE: 2.2,
  GAIN: 1000, // $/sec

  init(scene) {
    const gold     = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const goldGlow = new THREE.MeshLambertMaterial({ color: 0xffcc00, emissive: 0x886600 });
    const g = new THREE.Group();

    // Socle
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.6, 0.35, 12), gold);
    base.position.y = 0.18;
    base.castShadow = true;
    g.add(base);

    // Pilier
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.3, 8), gold);
    pillar.position.y = 1.0;
    g.add(pillar);

    // Sphère dorée
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), goldGlow);
    sphere.position.y = 1.95;
    g.add(sphere);
    this._sphere = sphere;

    // 3 pièces qui orbite
    const coinGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.07, 10);
    for (let i = 0; i < 3; i++) {
      const coin = new THREE.Mesh(coinGeo, goldGlow);
      g.add(coin);
      this._coins.push({ mesh: coin, angle: (i / 3) * Math.PI * 2, radius: 1.0, yBase: 1.1 + i * 0.35 });
    }

    g.position.set(this.POS.x, 0, this.POS.z);
    scene.add(g);
    this._group = g;
  },

  update(delta) {
    // Animation pièces
    this._coins.forEach(c => {
      c.angle += delta * 2.2;
      c.mesh.position.set(Math.cos(c.angle) * c.radius, c.yBase, Math.sin(c.angle) * c.radius);
      c.mesh.rotation.y = c.angle;
    });

    // Pulsation sphère
    if (this._sphere) {
      this._sphere.scale.setScalar(1 + Math.sin(Date.now() * 0.004) * 0.08);
    }

    // Gain argent si joueur dessus
    if (State.paused || State.gameOver) return;
    const dx = State.posX - this.POS.x;
    const dz = State.posZ - this.POS.z;
    if (Math.sqrt(dx * dx + dz * dz) < this.RANGE) {
      State.money += this.GAIN * delta;
    }
  }
};
