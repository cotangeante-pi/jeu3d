const World = {
  generate(scene) {
    State.colliders = [];
    State.pickups = [];

    // Ciel et brouillard
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 80, 280);

    // Lumières
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(100, 200, 100);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 600;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    scene.add(sun);

    this._buildGround(scene);
    this._buildRiver(scene);
    this._buildCity(scene);
    this._buildForest(scene);
    this._buildBorders();
    this._spawnFood(scene);
  },

  _buildGround(scene) {
    const geo = new THREE.PlaneGeometry(800, 800);
    const mat = new THREE.MeshLambertMaterial({ color: 0x4a7c3f });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);
  },

  _buildRiver(scene) {
    const rx = CONFIG.RIVER_CENTER_X;
    const rw = CONFIG.RIVER_WIDTH;
    const rl = CONFIG.RIVER_LENGTH;

    // Surface visible
    const surfGeo = new THREE.PlaneGeometry(rw, rl);
    const surfMat = new THREE.MeshLambertMaterial({
      color: 0x1a6fa8,
      transparent: true,
      opacity: 0.8
    });
    const surf = new THREE.Mesh(surfGeo, surfMat);
    surf.rotation.x = -Math.PI / 2;
    surf.position.set(rx, 0.05, 0);
    scene.add(surf);

    // Box3 pour détection zone rivière
    State.riverBox = new THREE.Box3(
      new THREE.Vector3(rx - rw / 2, -10, -rl / 2),
      new THREE.Vector3(rx + rw / 2, 3, rl / 2)
    );
  },

  _buildCity(scene) {
    const step = CONFIG.GRID_STEP;
    const bSize = CONFIG.BUILDING_SIZE;
    const cityR = CONFIG.CITY_RADIUS;
    const range = Math.floor(cityR / step);

    // Sol asphalte sous les bâtiments
    const asphaltGeo = new THREE.PlaneGeometry(cityR * 2, cityR * 2);
    const asphaltMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const asphalt = new THREE.Mesh(asphaltGeo, asphaltMat);
    asphalt.rotation.x = -Math.PI / 2;
    asphalt.position.y = 0.01;
    asphalt.receiveShadow = true;
    scene.add(asphalt);

    const grays = [0x888888, 0x999999, 0xaaaaaa, 0x777777, 0xbbbbbb, 0x666666];

    for (let row = -range; row <= range; row++) {
      for (let col = -range; col <= range; col++) {
        // Rues : on skip si row ou col ≡ 1 (mod 3)
        if (Math.abs(row) % 3 === 1 || Math.abs(col) % 3 === 1) continue;

        const cx = col * step;
        const cz = row * step;
        if (Math.sqrt(cx * cx + cz * cz) > cityR) continue;

        const h = 4 + Math.random() * 14;
        const color = grays[Math.floor(Math.random() * grays.length)];
        const geo = new THREE.BoxGeometry(bSize, h, bSize);
        const mat = new THREE.MeshLambertMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cx, h / 2, cz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        // Collider AABB
        const box = new THREE.Box3(
          new THREE.Vector3(cx - bSize / 2, 0, cz - bSize / 2),
          new THREE.Vector3(cx + bSize / 2, h, cz + bSize / 2)
        );
        State.colliders.push(box);

        // Porte barrée visible sur le mur avant (côté z positif du bâtiment)
        const doorW = 1.0, doorH = Math.min(2.2, h * 0.6);
        const doorMat = new THREE.MeshLambertMaterial({ color: 0x3a2010 });
        const doorGeo = new THREE.BoxGeometry(doorW, doorH, 0.15);
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(cx, doorH / 2, cz + bSize / 2 + 0.05);
        scene.add(door);
      }
    }
  },

  _buildForest(scene) {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a2900 });
    const leafMat  = new THREE.MeshLambertMaterial({ color: 0x2d6e20 });
    const cityR = CONFIG.CITY_RADIUS + 20;
    this._treePositions = [];

    for (let i = 0; i < 300; i++) {
      const x = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 2;
      const z = (Math.random() - 0.5) * CONFIG.WORLD_SIZE * 2;
      if (Math.sqrt(x * x + z * z) < cityR) continue;

      // Éviter la rivière
      const rHalf = CONFIG.RIVER_WIDTH / 2 + 5;
      if (Math.abs(x - CONFIG.RIVER_CENTER_X) < rHalf) continue;

      const trunkH = 2 + Math.random() * 2;
      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, trunkH);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, trunkH / 2, z);
      trunk.castShadow = true;
      scene.add(trunk);

      const leafH = 3 + Math.random() * 2.5;
      const leafGeo = new THREE.ConeGeometry(1.6, leafH);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(x, trunkH + leafH / 2, z);
      leaf.castShadow = true;
      scene.add(leaf);

      State.colliders.push(new THREE.Box3(
        new THREE.Vector3(x - 0.35, 0, z - 0.35),
        new THREE.Vector3(x + 0.35, trunkH + leafH, z + 0.35)
      ));

      this._treePositions.push({ x, z });
    }
  },

  _buildBorders() {
    const s = CONFIG.WORLD_SIZE;
    const thick = 5;
    const tall = 60;
    [
      new THREE.Box3(new THREE.Vector3(-s - thick, -1, -s), new THREE.Vector3(-s, tall, s)),
      new THREE.Box3(new THREE.Vector3(s, -1, -s), new THREE.Vector3(s + thick, tall, s)),
      new THREE.Box3(new THREE.Vector3(-s, -1, -s - thick), new THREE.Vector3(s, tall, -s)),
      new THREE.Box3(new THREE.Vector3(-s, -1, s), new THREE.Vector3(s, tall, s + thick)),
    ].forEach(b => State.colliders.push(b));
  },

  _spawnFood(scene) {
    // Les pommes poussent près des arbres dans la nature
    if (!this._treePositions || this._treePositions.length === 0) return;

    const foodMat = new THREE.MeshLambertMaterial({ color: 0xdd2200 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x55aa22 });
    const count = Math.min(30, this._treePositions.length);

    // Choisir des arbres aléatoires et poser 1-2 pommes près de chacun
    const shuffled = this._treePositions.slice().sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      const tree = shuffled[i];
      // 1 ou 2 pommes par arbre
      const n = Math.random() < 0.4 ? 2 : 1;
      for (let j = 0; j < n; j++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 0.6 + Math.random() * 1.2;
        const x = tree.x + Math.cos(angle) * dist;
        const z = tree.z + Math.sin(angle) * dist;

        const geo = new THREE.SphereGeometry(0.2, 7, 7);
        const mesh = new THREE.Mesh(geo, foodMat);
        mesh.position.set(x, 0.2, z);
        mesh.castShadow = true;
        scene.add(mesh);

        State.pickups.push({
          name: 'Pomme',
          hungerBonus: 25,
          healthBonus: 5,
          mesh,
          pos: new THREE.Vector3(x, 0, z)
        });
      }
    }
  }
};
