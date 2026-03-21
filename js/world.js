const World = {
  generate(scene) {
    State.colliders = [];
    State.pickups = [];

    // Ciel et brouillard
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 300, 1400);

    // Lumières
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(100, 200, 100);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 2000;
    sun.shadow.camera.left = -800;
    sun.shadow.camera.right = 800;
    sun.shadow.camera.top = 800;
    sun.shadow.camera.bottom = -800;
    scene.add(sun);

    this._buildGround(scene);
    this._buildRiver(scene);
    this._buildCity(scene);
    this._buildRoads(scene);
    this._buildForest(scene);
    this._buildBorders();
    this._spawnFood(scene);
    this._buildBoats(scene);
  },

  _buildGround(scene) {
    const geo = new THREE.PlaneGeometry(3000, 3000);
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

  // Tuiles réservées aux bâtiments NPC (ne pas générer de bâtiment city dessus)
  _npcTiles: new Set([
    // Bâtiments originaux
    '0_28', '-28_28', '0_-28', '-28_-28',
    '0_42', '-28_-42', '0_-70', '-28_70',
    // Nouveaux bâtiments
    '28_28',  '28_42',  '28_-28', '28_70',
    '42_28',  '28_-42', '42_-28', '42_42',
    '42_70',  '42_-42', '42_0',   '0_84',
  ]),

  _buildCity(scene) {
    const step = CONFIG.GRID_STEP;
    const bSize = CONFIG.BUILDING_SIZE;
    const cityR = CONFIG.CITY_RADIUS;
    const range = Math.floor(cityR / step);
    const rxMin = CONFIG.RIVER_CENTER_X - CONFIG.RIVER_WIDTH / 2;
    const rxMax = CONFIG.RIVER_CENTER_X + CONFIG.RIVER_WIDTH / 2;

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

        // Réservé aux bâtiments NPC
        if (this._npcTiles.has(`${cx}_${cz}`)) continue;

        // Pas de bâtiment dans la rivière
        if (cx > rxMin && cx < rxMax) continue;

        const h = 4 + Math.random() * 50;
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

        // Fenêtres (verre bleuté sur les façades)
        const winMat = new THREE.MeshLambertMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.65 });
        const floors = Math.max(1, Math.floor(h / 3.2));
        for (let fl = 0; fl < floors; fl++) {
          const wy = 1.2 + fl * 3.2;
          if (wy + 0.9 > h) continue;
          // Façades nord et sud
          [-1, 1].forEach(side => {
            const w = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.08), winMat);
            w.position.set(cx + side * 2.0, wy, cz + bSize / 2 + 0.01);
            scene.add(w);
            const w2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.08), winMat);
            w2.position.set(cx + side * 2.0, wy, cz - bSize / 2 - 0.01);
            scene.add(w2);
          });
          // Façades est et ouest
          [-1, 1].forEach(side => {
            const w = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 1.4), winMat);
            w.position.set(cx + bSize / 2 + 0.01, wy, cz + side * 2.0);
            scene.add(w);
            const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 1.4), winMat);
            w2.position.set(cx - bSize / 2 - 0.01, wy, cz + side * 2.0);
            scene.add(w2);
          });
        }
      }
    }
  },

  _buildRoads(scene) {
    const step  = CONFIG.GRID_STEP;
    const cityR = CONFIG.CITY_RADIUS;
    const range = Math.floor(cityR / step);
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x202020 });
    const dashMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const yellMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
    const walkMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const roadW   = step;    // largeur chaussée (14 m)
    const sw      = 1.2;    // largeur trottoir

    const rxMin   = CONFIG.RIVER_CENTER_X - CONFIG.RIVER_WIDTH / 2;
    const rxMax   = CONFIG.RIVER_CENTER_X + CONFIG.RIVER_WIDTH / 2;
    const riverW  = rxMax - rxMin;
    const bridgeCX = (rxMin + rxMax) / 2;

    const bridgeZs = [];

    for (let n = -range; n <= range; n++) {
      if (Math.abs(n) % 3 !== 1) continue;
      const pos = n * step;
      if (Math.abs(pos) > cityR + step) continue;
      const halfLen = cityR + step;
      const len     = halfLen * 2;

      // ── Route VERTICALE (le long de Z) at X = pos ──────────────────────────
      // Sauter si le tracé passe dans la rivière (route noyée)
      if (pos <= rxMin || pos >= rxMax) {
        const vRoad = new THREE.Mesh(new THREE.PlaneGeometry(roadW, len), roadMat);
        vRoad.rotation.x = -Math.PI / 2; vRoad.position.set(pos, 0.013, 0);
        scene.add(vRoad);
        [-1, 1].forEach(side => {
          const swMesh = new THREE.Mesh(new THREE.PlaneGeometry(sw, len), walkMat);
          swMesh.rotation.x = -Math.PI / 2;
          swMesh.position.set(pos + side * (roadW / 2 + sw / 2), 0.014, 0);
          scene.add(swMesh);
        });
        for (let dz = -cityR; dz <= cityR; dz += 10) {
          const d = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 2), dashMat);
          d.rotation.x = -Math.PI / 2; d.position.set(pos, 0.018, dz); scene.add(d);
        }
        [-1, 1].forEach(side => {
          const yl = new THREE.Mesh(new THREE.PlaneGeometry(0.15, len), yellMat);
          yl.rotation.x = -Math.PI / 2;
          yl.position.set(pos + side * (roadW / 2 - 0.5), 0.017, 0);
          scene.add(yl);
        });
      }

      // ── Route HORIZONTALE (le long de X) at Z = pos ────────────────────────
      // Tronçon gauche (de -halfLen à rxMin)
      const leftLen = rxMin + halfLen;
      const leftCX  = (-halfLen + rxMin) / 2;
      if (leftLen > 0) {
        const r = new THREE.Mesh(new THREE.PlaneGeometry(leftLen, roadW), roadMat);
        r.rotation.x = -Math.PI / 2; r.position.set(leftCX, 0.013, pos); scene.add(r);
        [-1, 1].forEach(side => {
          const swMesh = new THREE.Mesh(new THREE.PlaneGeometry(leftLen, sw), walkMat);
          swMesh.rotation.x = -Math.PI / 2;
          swMesh.position.set(leftCX, 0.014, pos + side * (roadW / 2 + sw / 2));
          scene.add(swMesh);
        });
        for (let dx = -halfLen; dx < rxMin; dx += 10) {
          const d = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.14), dashMat);
          d.rotation.x = -Math.PI / 2; d.position.set(dx, 0.018, pos); scene.add(d);
        }
        [-1, 1].forEach(side => {
          const yl = new THREE.Mesh(new THREE.PlaneGeometry(leftLen, 0.15), yellMat);
          yl.rotation.x = -Math.PI / 2;
          yl.position.set(leftCX, 0.017, pos + side * (roadW / 2 - 0.5));
          scene.add(yl);
        });
      }

      // Pont sur la rivière
      this._addBridge(scene, pos, roadW, rxMin, rxMax, riverW, bridgeCX, dashMat);
      bridgeZs.push(pos);

      // Tronçon droit (de rxMax à +halfLen)
      const rightLen = halfLen - rxMax;
      const rightCX  = (rxMax + halfLen) / 2;
      if (rightLen > 0) {
        const r = new THREE.Mesh(new THREE.PlaneGeometry(rightLen, roadW), roadMat);
        r.rotation.x = -Math.PI / 2; r.position.set(rightCX, 0.013, pos); scene.add(r);
        [-1, 1].forEach(side => {
          const swMesh = new THREE.Mesh(new THREE.PlaneGeometry(rightLen, sw), walkMat);
          swMesh.rotation.x = -Math.PI / 2;
          swMesh.position.set(rightCX, 0.014, pos + side * (roadW / 2 + sw / 2));
          scene.add(swMesh);
        });
        for (let dx = rxMax; dx <= halfLen; dx += 10) {
          const d = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.14), dashMat);
          d.rotation.x = -Math.PI / 2; d.position.set(dx, 0.018, pos); scene.add(d);
        }
        [-1, 1].forEach(side => {
          const yl = new THREE.Mesh(new THREE.PlaneGeometry(rightLen, 0.15), yellMat);
          yl.rotation.x = -Math.PI / 2;
          yl.position.set(rightCX, 0.017, pos + side * (roadW / 2 - 0.5));
          scene.add(yl);
        });
      }
    }

    State.bridgeZs = bridgeZs;
  },

  _addBridge(scene, roadZ, roadW, rxMin, rxMax, riverW, bridgeCX, dashMat) {
    const concreteMat = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 });
    const steelMat    = new THREE.MeshLambertMaterial({ color: 0x556677 });
    const railMat     = new THREE.MeshLambertMaterial({ color: 0x787878 });

    // ── Tablier béton (plat, praticable) ──
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(riverW, roadW), concreteMat);
    deck.rotation.x = -Math.PI / 2;
    deck.position.set(bridgeCX, 0.07, roadZ);
    scene.add(deck);

    // Tirets routiers sur le pont
    for (let dx = rxMin + 3; dx < rxMax; dx += 10) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.14), dashMat);
      d.rotation.x = -Math.PI / 2; d.position.set(dx, 0.09, roadZ); scene.add(d);
    }

    // ── Arche en acier au-dessus du tablier (2 arches en croix) ──
    const archH   = 9;    // hauteur du sommet de l'arche
    const archSegs = 7;   // segments par demi-arche
    for (let a = 0; a < 2; a++) {            // deux plans d'arches (nord/sud)
      const zOff = (a === 0 ? -1 : 1) * (roadW * 0.3);
      for (let side = -1; side <= 1; side += 2) {  // côté gauche/droite (rives)
        for (let s = 0; s < archSegs; s++) {
          const t0 = s / archSegs;
          const t1 = (s + 1) / archSegs;
          // Arc en demi-cercle: x va de rive à centre, y monte
          const x0 = (side === -1 ? rxMin : rxMax) + side * -1 * (riverW / 2) * t0;
          const y0 = archH * Math.sin(Math.PI * t0 * 0.5);
          const x1 = (side === -1 ? rxMin : rxMax) + side * -1 * (riverW / 2) * t1;
          const y1 = archH * Math.sin(Math.PI * t1 * 0.5);
          const segL = Math.hypot(x1 - x0, y1 - y0);
          const ang  = Math.atan2(y1 - y0, x1 - x0);
          const seg = new THREE.Mesh(new THREE.BoxGeometry(segL + 0.05, 0.45, 0.45), steelMat);
          seg.position.set((x0 + x1) / 2, (y0 + y1) / 2, roadZ + zOff);
          seg.rotation.z = ang;
          scene.add(seg);
        }
      }
    }
    // Membrures verticales reliant tablier → arche (tous les 10m)
    for (let dx = rxMin + 8; dx < rxMax - 2; dx += 10) {
      const t = (dx - rxMin) / riverW;
      const archY = archH * Math.sin(Math.PI * t);
      [-1, 1].forEach(side => {
        const rod = new THREE.Mesh(new THREE.BoxGeometry(0.18, archY, 0.18), steelMat);
        rod.position.set(dx, archY / 2, roadZ + side * roadW * 0.3);
        scene.add(rod);
      });
    }

    // ── Garde-corps (côtés nord et sud) — solides (colliders) ──
    const railH = 1.0, railThick = 0.22;
    [-1, 1].forEach(side => {
      const zOff = side * (roadW / 2 - 0.11);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(riverW, railH, railThick), railMat);
      rail.position.set(bridgeCX, railH / 2 + 0.07, roadZ + zOff);
      scene.add(rail);
      // Poteaux
      for (let px = rxMin; px <= rxMax + 0.1; px += 8) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, railH + 0.1, 0.28), railMat);
        post.position.set(px, (railH + 0.1) / 2 + 0.07, roadZ + zOff);
        scene.add(post);
      }
      // Collider garde-corps
      State.colliders.push(new THREE.Box3(
        new THREE.Vector3(rxMin, 0, roadZ + zOff - railThick / 2),
        new THREE.Vector3(rxMax, railH + 0.2, roadZ + zOff + railThick / 2)
      ));
    });

    // ── Culées béton aux rives ──
    [-1, 1].forEach(side => {
      const bx = side === -1 ? rxMin - 0.5 : rxMax + 0.5;
      const cul = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, roadW + 0.8), concreteMat);
      cul.position.set(bx, 0.9, roadZ);
      scene.add(cul);
    });
  },

  _buildBoats(scene) {
    const boatMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
    const sailMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const rx      = CONFIG.RIVER_CENTER_X;

    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      // Coque
      const hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 5.5), boatMat);
      hull.position.y = 0.5;
      g.add(hull);
      // Bord de coque (rebord)
      const rim = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 5.9),
        new THREE.MeshLambertMaterial({ color: 0x5a2d0c }));
      rim.position.y = 0.82;
      g.add(rim);
      // Mât
      const mast = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5, 0.12),
        new THREE.MeshLambertMaterial({ color: 0x6b3a1a }));
      mast.position.set(0, 3.3, 0);
      g.add(mast);
      // Voile
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.8), sailMat);
      sail.position.set(0, 3.2, 0.5);
      g.add(sail);

      const startZ = (i - 1) * 400;
      g.position.set(rx + (Math.random() - 0.5) * 20, 0, startZ);
      scene.add(g);

      State.boats.push({ group: g, speed: 4 + Math.random() * 3, dir: i % 2 === 0 ? 1 : -1 });
    }
  },

  _buildForest(scene) {
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a2900 });
    const leafMat  = new THREE.MeshLambertMaterial({ color: 0x2d6e20 });
    const cityR = CONFIG.CITY_RADIUS + 20;
    this._treePositions = [];

    for (let i = 0; i < 1200; i++) {
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
          color: '#dd2200',
          type: 'food',
          hungerBonus: 25,
          healthBonus: 5,
          mesh,
          pos: new THREE.Vector3(x, 0, z)
        });
      }
    }
  }
};
