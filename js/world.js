const World = {
  generate(scene) {
    State.colliders = [];
    State.pickups = [];

    // Ciel et brouillard
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 450, 1600);

    // Lumières
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    State.ambient = ambient;

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
    State.sun = sun;

    this._buildGround(scene);
    this._buildRiver(scene);
    this._buildCity(scene);
    this._buildRoads(scene);
    this._buildForest(scene);
    this._buildBorders();
    this._spawnFood(scene);
    this._buildBoats(scene);
    this.updateDayNight(scene);
  },

  updateDayNight(scene) {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;

    // Keyframes : [heure, ciel, brouillard, intensitéAmbiente, couleurAmbiente, intensitéSoleil, couleurSoleil]
    const frames = [
      { h:  0, sky: 0x05051a, fog: 0x08082a, ambI: 0.22, ambC: 0x4466aa, sunI: 0.0, sunC: 0x000000 },
      { h:  5, sky: 0x05051a, fog: 0x08082a, ambI: 0.22, ambC: 0x4466aa, sunI: 0.0, sunC: 0x000000 },
      { h:  6, sky: 0xff8833, fog: 0xcc5522, ambI: 0.30, ambC: 0xff9966, sunI: 0.5, sunC: 0xff9944 },
      { h:  7, sky: 0x87ceeb, fog: 0x87ceeb, ambI: 0.5,  ambC: 0xffffff, sunI: 1.0, sunC: 0xffffff },
      { h: 19, sky: 0x87ceeb, fog: 0x87ceeb, ambI: 0.5,  ambC: 0xffffff, sunI: 1.0, sunC: 0xffffff },
      { h: 20, sky: 0xff6622, fog: 0xcc4411, ambI: 0.30, ambC: 0xff9966, sunI: 0.5, sunC: 0xff9944 },
      { h: 21, sky: 0x05051a, fog: 0x08082a, ambI: 0.22, ambC: 0x4466aa, sunI: 0.0, sunC: 0x000000 },
      { h: 24, sky: 0x05051a, fog: 0x08082a, ambI: 0.22, ambC: 0x4466aa, sunI: 0.0, sunC: 0x000000 },
    ];

    let f0 = frames[0], f1 = frames[1];
    for (let i = 0; i < frames.length - 1; i++) {
      if (hour >= frames[i].h && hour < frames[i + 1].h) {
        f0 = frames[i]; f1 = frames[i + 1]; break;
      }
    }
    const t = f1.h === f0.h ? 0 : (hour - f0.h) / (f1.h - f0.h);

    function lerpHex(c0, c1, t) {
      const r = Math.round(((c0 >> 16) & 0xff) + (((c1 >> 16) & 0xff) - ((c0 >> 16) & 0xff)) * t);
      const g = Math.round(((c0 >>  8) & 0xff) + (((c1 >>  8) & 0xff) - ((c0 >>  8) & 0xff)) * t);
      const b = Math.round(( c0        & 0xff) + (( c1        & 0xff) - ( c0        & 0xff)) * t);
      return (r << 16) | (g << 8) | b;
    }
    function lerp(a, b, t) { return a + (b - a) * t; }

    scene.background.setHex(lerpHex(f0.sky, f1.sky, t));
    scene.fog.color.setHex(lerpHex(f0.fog, f1.fog, t));
    State.ambient.color.setHex(lerpHex(f0.ambC, f1.ambC, t));
    State.ambient.intensity = lerp(f0.ambI, f1.ambI, t);
    State.sun.intensity = lerp(f0.sunI, f1.sunI, t);
    State.sun.color.setHex(lerpHex(f0.sunC, f1.sunC, t));
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
    const depth = 5;

    // Fond de la rivière (lit visible sous la surface)
    const bedMat = new THREE.MeshLambertMaterial({ color: 0x0a3d5c });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(rw, depth, rl), bedMat);
    bed.position.set(rx, -depth / 2, 0);
    scene.add(bed);

    // Berges inclinées (talus de chaque côté)
    const bankMat = new THREE.MeshLambertMaterial({ color: 0x4a7c3f });
    [-1, 1].forEach(side => {
      const bank = new THREE.Mesh(new THREE.BoxGeometry(6, depth + 0.3, rl), bankMat);
      bank.position.set(rx + side * (rw / 2 + 3), -depth / 2, 0);
      bank.rotation.z = side * 0.35;
      scene.add(bank);
    });

    // Surface de l'eau (semi-transparente)
    const surfMat = new THREE.MeshLambertMaterial({ color: 0x1a6fa8, transparent: true, opacity: 0.78 });
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(rw, rl), surfMat);
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

    // ── Fenêtres via InstancedMesh (2 draw calls pour toutes les vitres) ──
    const winMat  = new THREE.MeshLambertMaterial({ color: 0x88bbdd, transparent: true, opacity: 0.65 });
    const MAX_WIN = 45000;
    const iWinNS  = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 1.1, 0.08), winMat, MAX_WIN);
    const iWinEW  = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 1.1, 1.4), winMat, MAX_WIN);
    const _dummy  = new THREE.Object3D();
    let   idxNS = 0, idxEW = 0;

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

        // Fenêtres — instances collectées (pas de nouveau Mesh par fenêtre)
        const floors = Math.max(1, Math.floor(h / 3.2));
        for (let fl = 0; fl < floors; fl++) {
          const wy = 1.2 + fl * 3.2;
          if (wy + 0.9 > h) continue;
          for (const side of [-1, 1]) {
            for (const fz of [cz + bSize / 2 + 0.01, cz - bSize / 2 - 0.01]) {
              if (idxNS < MAX_WIN) {
                _dummy.position.set(cx + side * 2.0, wy, fz);
                _dummy.updateMatrix();
                iWinNS.setMatrixAt(idxNS++, _dummy.matrix);
              }
            }
            for (const fx of [cx + bSize / 2 + 0.01, cx - bSize / 2 - 0.01]) {
              if (idxEW < MAX_WIN) {
                _dummy.position.set(fx, wy, cz + side * 2.0);
                _dummy.updateMatrix();
                iWinEW.setMatrixAt(idxEW++, _dummy.matrix);
              }
            }
          }
        }
      }
    }

    iWinNS.count = idxNS; iWinNS.instanceMatrix.needsUpdate = true; scene.add(iWinNS);
    iWinEW.count = idxEW; iWinEW.instanceMatrix.needsUpdate = true; scene.add(iWinEW);
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
    const steelMat    = new THREE.MeshLambertMaterial({ color: 0x445566 });
    const railMat     = new THREE.MeshLambertMaterial({ color: 0x787878 });
    const railH = 1.0, railThick = 0.22;

    // ── Tablier béton (plat, praticable) ──
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(riverW, roadW), concreteMat);
    deck.rotation.x = -Math.PI / 2;
    deck.position.set(bridgeCX, 0.07, roadZ);
    scene.add(deck);

    for (let dx = rxMin + 3; dx < rxMax; dx += 10) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.14), dashMat);
      d.rotation.x = -Math.PI / 2; d.position.set(dx, 0.09, roadZ); scene.add(d);
    }

    // ── Culées béton aux rives (sous la chaussée) ──
    [-1, 1].forEach(side => {
      const bx = side === -1 ? rxMin - 0.5 : rxMax + 0.5;
      const cul = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.8, roadW + 0.8), concreteMat);
      cul.position.set(bx, 0.9, roadZ);
      scene.add(cul);
    });

    // ── Arches en acier (partent au-dessus des garde-corps → apex 11m) ──
    // L'arc démarre à y = archBase (> railH = 1.0) aux deux rives
    // et monte jusqu'à archTop au centre → aucune obstruction à l'entrée du pont
    const archBase = 2.5;   // hauteur de départ (au-dessus des rails)
    const archTop  = 11.0;  // hauteur au sommet central
    const archSegs = 8;
    [-1, 1].forEach(sideZ => {            // deux arches (N et S du pont)
      const zOff = sideZ * (roadW / 2 - 1.2);
      for (let s = 0; s < archSegs; s++) {
        const t0 = s / archSegs;
        const t1 = (s + 1) / archSegs;
        // x va de rxMin à rxMax; y suit une parabole
        const x0 = rxMin + riverW * t0;
        const y0 = archBase + (archTop - archBase) * Math.sin(Math.PI * t0);
        const x1 = rxMin + riverW * t1;
        const y1 = archBase + (archTop - archBase) * Math.sin(Math.PI * t1);
        const segL = Math.hypot(x1 - x0, y1 - y0);
        const ang  = Math.atan2(y1 - y0, x1 - x0);
        const seg = new THREE.Mesh(new THREE.BoxGeometry(segL + 0.04, 0.5, 0.5), steelMat);
        seg.position.set((x0 + x1) / 2, (y0 + y1) / 2, roadZ + zOff);
        seg.rotation.z = ang;
        scene.add(seg);
      }
    });

    // Membrures verticales (suspentes reliant tablier → arche)
    for (let dx = rxMin + 10; dx < rxMax - 2; dx += 10) {
      const t    = (dx - rxMin) / riverW;
      const topY = archBase + (archTop - archBase) * Math.sin(Math.PI * t);
      [-1, 1].forEach(sideZ => {
        const zOff = sideZ * (roadW / 2 - 1.2);
        const rodH = topY - railH - 0.07;
        if (rodH <= 0.1) return;
        const rod = new THREE.Mesh(new THREE.BoxGeometry(0.16, rodH, 0.16), steelMat);
        rod.position.set(dx, railH + 0.07 + rodH / 2, roadZ + zOff);
        scene.add(rod);
      });
    }

    // ── Garde-corps solides (colliders) ──
    [-1, 1].forEach(side => {
      const zOff = side * (roadW / 2 - 0.11);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(riverW, railH, railThick), railMat);
      rail.position.set(bridgeCX, railH / 2 + 0.07, roadZ + zOff);
      scene.add(rail);
      for (let px = rxMin; px <= rxMax + 0.1; px += 8) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.28, railH + 0.1, 0.28), railMat);
        post.position.set(px, (railH + 0.1) / 2 + 0.07, roadZ + zOff);
        scene.add(post);
      }
      State.colliders.push(new THREE.Box3(
        new THREE.Vector3(rxMin, 0, roadZ + zOff - railThick / 2),
        new THREE.Vector3(rxMax, railH + 0.2, roadZ + zOff + railThick / 2)
      ));
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
