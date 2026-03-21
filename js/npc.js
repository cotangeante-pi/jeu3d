const NPC = {
  DEFS: [
    {
      id: 'merchant_1', type: 'merchant', name: 'Marchand Ali', x: 14, z: 30, dir: -1,
      stock: [
        { name: 'Pain',          price: 5,  hungerBonus: 20, healthBonus: 3  },
        { name: 'Repas complet', price: 15, hungerBonus: 60, healthBonus: 10 },
        { name: 'Boisson',       price: 3,  hungerBonus: 10, healthBonus: 2  },
      ]
    },
    {
      id: 'merchant_2', type: 'merchant', name: 'Épicerie Lulu', x: -14, z: 30, dir: -1,
      stock: [
        { name: 'Fruits',   price: 4, hungerBonus: 18, healthBonus: 4 },
        { name: 'Sandwich', price: 8, hungerBonus: 35, healthBonus: 6 },
        { name: 'Gâteau',   price: 6, hungerBonus: 25, healthBonus: 2 },
      ]
    },
    {
      id: 'school_1', type: 'school', name: 'École publique', x: 14, z: -30, dir: 1,
      courses: [
        { name: 'Cours de base',   price: 20,  iqGain: 5,  iqRequired: 0   },
        { name: 'Cours avancé',    price: 50,  iqGain: 15, iqRequired: 20  },
        { name: 'Cours expert',    price: 120, iqGain: 40, iqRequired: 50  },
        { name: 'Cours supérieur', price: 300, iqGain: 80, iqRequired: 100 },
      ]
    },
    {
      id: 'employer_1', type: 'employer', name: 'Boulangerie', x: -14, z: -20, dir: 1,
      job: { id: 'baker', name: 'Boulanger', salary: 10, iqRequired: 0, strengthRequired: 0 }
    },
    {
      id: 'employer_2', type: 'employer', name: 'Cabinet conseil', x: 14, z: 60, dir: -1,
      job: { id: 'consultant', name: 'Consultant', salary: 35, iqRequired: 40, strengthRequired: 0 }
    },
    {
      id: 'employer_3', type: 'employer', name: 'Chantier BTP', x: -14, z: -55, dir: 1,
      job: { id: 'worker', name: 'Ouvrier', salary: 15, iqRequired: 0, strengthRequired: 15 }
    },
    {
      id: 'employer_4', type: 'employer', name: 'Hôpital', x: 14, z: -60, dir: 1,
      job: { id: 'nurse', name: 'Infirmier', salary: 25, iqRequired: 20, strengthRequired: 0 }
    },
  ],

  _list: [],

  // Couleurs par type
  _colors: {
    merchant: { wall: 0xd4a96a, roof: 0x7a4f1e, floor: 0xc8a86a, sign: '#a05000' },
    school:   { wall: 0xe8e0cc, roof: 0x3a5a80, floor: 0xd0c8a0, sign: '#005090' },
    employer: { wall: 0xcccccc, roof: 0x555555, floor: 0xbbbbbb, sign: '#444444' },
  },

  init(scene) {
    this._list = [];
    this.DEFS.forEach(def => {
      const entry = this._createBuilding(scene, def);
      this._list.push(entry);
    });
    State.npcs = this._list;
  },

  // dir: +1 = façade vers z positif, -1 = façade vers z négatif
  _createBuilding(scene, def) {
    const W = 10, D = 8, H = 4;
    const DOOR_W = 1.6, DOOR_H = 2.6;
    const cx = def.x;
    // La porte est sur le mur avant, le bâtiment s'étend vers l'intérieur
    // dir=+1 : façade à z=def.z, intérieur à z=def.z+D
    // dir=-1 : façade à z=def.z, intérieur à z=def.z-D
    const facadeZ = def.z;
    const backZ   = def.z + def.dir * D;
    const midZ    = def.z + def.dir * (D / 2);

    const col = this._colors[def.type] || this._colors.employer;
    const wallMat  = new THREE.MeshLambertMaterial({ color: col.wall });
    const roofMat  = new THREE.MeshLambertMaterial({ color: col.roof });
    const floorMat = new THREE.MeshLambertMaterial({ color: col.floor });
    const winMat   = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });

    const add = (geo, mat, px, py, pz, ry) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(px, py, pz);
      if (ry) m.rotation.y = ry;
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    };

    const thick = 0.25; // épaisseur des murs

    // --- Mur AVANT (façade) ---
    // Partie gauche (de -W/2 à -DOOR_W/2)
    const sideW = (W - DOOR_W) / 2;
    add(new THREE.BoxGeometry(sideW, H, thick), wallMat,
        cx - W/2 + sideW/2, H/2, facadeZ);
    // Partie droite
    add(new THREE.BoxGeometry(sideW, H, thick), wallMat,
        cx + W/2 - sideW/2, H/2, facadeZ);
    // Linteau au-dessus de la porte
    const lintelH = H - DOOR_H;
    add(new THREE.BoxGeometry(DOOR_W, lintelH, thick), wallMat,
        cx, DOOR_H + lintelH/2, facadeZ);

    // --- Mur ARRIÈRE ---
    add(new THREE.BoxGeometry(W, H, thick), wallMat, cx, H/2, backZ);

    // --- Murs LATÉRAUX (avec fenêtres) ---
    // Chaque mur latéral = 3 pièces : pilier haut, dessous fenêtre, dessus fenêtre
    const FW = 1.6, FH = 1.2, FY = 1.8; // fenêtre largeur, hauteur, base Y
    const pillarW = (D - FW) / 2;
    const signs = def.dir === 1 ? [-1, 1] : [-1, 1]; // les deux côtés

    [-W/2, W/2].forEach((lx, idx) => {
      const ry = idx === 0 ? Math.PI / 2 : -Math.PI / 2;
      // Pilier avant (entre façade et fenêtre)
      add(new THREE.BoxGeometry(pillarW, H, thick), wallMat,
          lx, H/2, midZ - def.dir * (FW/2 + pillarW/2), ry);
      // Pilier arrière
      add(new THREE.BoxGeometry(pillarW, H, thick), wallMat,
          lx, H/2, midZ + def.dir * (FW/2 + pillarW/2), ry);
      // Bande sous la fenêtre
      add(new THREE.BoxGeometry(FW, FY, thick), wallMat,
          lx, FY/2, midZ, ry);
      // Bande au-dessus de la fenêtre
      const topH = H - FY - FH;
      add(new THREE.BoxGeometry(FW, topH, thick), wallMat,
          lx, FY + FH + topH/2, midZ, ry);
      // Vitre
      add(new THREE.BoxGeometry(FW, FH, thick * 0.5), winMat,
          lx, FY + FH/2, midZ, ry);
    });

    // --- Toit ---
    add(new THREE.BoxGeometry(W + 0.4, 0.3, D + 0.4), roofMat, cx, H + 0.15, midZ);

    // --- Sol intérieur ---
    const floorGeo = new THREE.PlaneGeometry(W - thick*2, D - thick*2);
    const floorM = new THREE.Mesh(floorGeo, floorMat);
    floorM.rotation.x = -Math.PI / 2;
    floorM.position.set(cx, 0.02, midZ);
    scene.add(floorM);

    // --- Mobilier intérieur ---
    this._addFurniture(scene, def, cx, midZ, backZ, col.wall);

    // --- NPC à l'intérieur ---
    const npcZ = def.z + def.dir * (D - 1.5);
    this._addNPCInside(scene, def.type, cx, npcZ);

    // --- Pancarte au-dessus de la porte ---
    const sign = this._makeSign(def.name, def.type, col.sign);
    sign.position.set(cx, H + 0.8, facadeZ + def.dir * (-0.3));
    sign.scale.set(4, 1, 1);
    scene.add(sign);

    // --- Colliders des murs ---
    const colBox = (minX, minY, minZ, maxX, maxY, maxZ) => {
      State.colliders.push(new THREE.Box3(
        new THREE.Vector3(minX, minY, minZ),
        new THREE.Vector3(maxX, maxY, maxZ)
      ));
    };

    const fz = Math.min(facadeZ, facadeZ); // juste pour clarté
    const bz = backZ;
    const fzMin = Math.min(facadeZ, backZ);
    const fzMax = Math.max(facadeZ, backZ);

    // Mur avant gauche
    colBox(cx - W/2,       0, facadeZ - thick/2, cx - DOOR_W/2, H, facadeZ + thick/2);
    // Mur avant droit
    colBox(cx + DOOR_W/2,  0, facadeZ - thick/2, cx + W/2,      H, facadeZ + thick/2);
    // Linteau
    colBox(cx - DOOR_W/2, DOOR_H, facadeZ - thick/2, cx + DOOR_W/2, H, facadeZ + thick/2);
    // Mur arrière
    colBox(cx - W/2, 0, bz - thick/2, cx + W/2, H, bz + thick/2);
    // Mur gauche
    colBox(cx - W/2 - thick/2, 0, fzMin, cx - W/2 + thick/2, H, fzMax);
    // Mur droit
    colBox(cx + W/2 - thick/2, 0, fzMin, cx + W/2 + thick/2, H, fzMax);

    // Point d'interaction = devant la porte
    const interactZ = facadeZ - def.dir * 2;

    return {
      ...def,
      pos: new THREE.Vector3(cx, 0, interactZ)
    };
  },

  _addNPCInside(scene, type, cx, npcZ) {
    const colors = { merchant: 0xff8800, school: 0x0088ff, employer: 0xffcc00 };
    const color = colors[type] || 0xffffff;
    const bodyGeo = new THREE.BoxGeometry(0.6, 1.4, 0.5);
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshLambertMaterial({ color }));
    body.position.set(cx, 0.7, npcZ);
    body.castShadow = true;
    scene.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xf5c5a3 })
    );
    head.position.set(cx, 1.67, npcZ);
    scene.add(head);
  },

  _addFurniture(scene, def, cx, midZ, backZ, wallColor) {
    const brown = new THREE.MeshLambertMaterial({ color: 0x6b3a2a });

    if (def.type === 'merchant') {
      // Comptoir
      const counter = new THREE.Mesh(new THREE.BoxGeometry(6, 0.9, 1.2), brown);
      counter.position.set(cx, 0.45, backZ - def.dir * 1.5);
      counter.castShadow = true;
      scene.add(counter);
    } else if (def.type === 'school') {
      // 3 tables avec chaises
      for (let i = 0; i < 3; i++) {
        const tx = cx - 3 + i * 3;
        const tz = midZ + def.dir * 0.5;
        const table = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.8), brown);
        table.position.set(tx, 0.75, tz);
        scene.add(table);
        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.1), brown);
        leg1.position.set(tx, 0.375, tz);
        scene.add(leg1);
      }
    } else if (def.type === 'employer') {
      // Bureau
      const desk = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 1.2), brown);
      desk.position.set(cx, 0.8, backZ - def.dir * 1.2);
      desk.castShadow = true;
      scene.add(desk);
    }
  },

  _makeSign(text, type, bgColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 120, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 112, 12);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    return new THREE.Sprite(mat);
  },

  getNearest(px, pz) {
    let best = null;
    let bestDist = CONFIG.INTERACT_RANGE;
    this._list.forEach(npc => {
      const dx = npc.pos.x - px;
      const dz = npc.pos.z - pz;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < bestDist) { bestDist = d; best = npc; }
    });
    return best;
  }
};
