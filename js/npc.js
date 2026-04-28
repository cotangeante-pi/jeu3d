const NPC = {
  DEFS: [
    {
      id: 'merchant_1', type: 'merchant', name: 'Marchand Ali', x: 0, z: 28, dir: 1,
      stock: [
        { name: 'Pain',          price: 5,  hungerBonus: 20, healthBonus: 3  },
        { name: 'Repas complet', price: 15, hungerBonus: 60, healthBonus: 10 },
        { name: 'Boisson',       price: 3,  hungerBonus: 10, healthBonus: 2  },
      ]
    },
    {
      id: 'merchant_2', type: 'merchant', name: 'Épicerie Lulu', x: -28, z: 28, dir: 1,
      stock: [
        { name: 'Fruits',   price: 4, hungerBonus: 18, healthBonus: 4 },
        { name: 'Sandwich', price: 8, hungerBonus: 35, healthBonus: 6 },
        { name: 'Gâteau',   price: 6, hungerBonus: 25, healthBonus: 2 },
      ]
    },
    {
      id: 'school_1', type: 'school', name: 'École publique', x: 0, z: -28, dir: -1,
      courses: [
        { name: 'Cours de base',   price: 20,  iqGain: 5,  iqRequired: 0   },
        { name: 'Cours avancé',    price: 50,  iqGain: 15, iqRequired: 20  },
        { name: 'Cours expert',    price: 120, iqGain: 40, iqRequired: 50  },
        { name: 'Cours supérieur', price: 300, iqGain: 80, iqRequired: 100 },
      ]
    },
    {
      id: 'employer_1', type: 'employer', name: 'Boulangerie', x: -28, z: -28, dir: -1,
      job: { id: 'baker', name: 'Boulanger', salary: 10, iqRequired: 0, strengthRequired: 0, startHour: 6, endHour: 14 }
    },
    {
      id: 'employer_2', type: 'employer', name: 'Cabinet comptable', x: 0, z: 42, dir: 1,
      job: { id: 'consultant', name: 'Comptable', salary: 35, iqRequired: 40, strengthRequired: 0, startHour: 9, endHour: 17 }
    },
    {
      id: 'employer_3', type: 'employer', name: 'Chantier BTP', x: -28, z: -42, dir: -1,
      job: { id: 'worker', name: 'Ouvrier', salary: 15, iqRequired: 0, strengthRequired: 15, startHour: 7, endHour: 15 }
    },
    {
      id: 'employer_4', type: 'employer', name: 'Hôpital', x: 0, z: -70, dir: -1,
      job: { id: 'nurse', name: 'Infirmier', salary: 25, iqRequired: 20, strengthRequired: 0, startHour: 8, endHour: 18 }
    },
    {
      id: 'cardeal_1', type: 'cardeal', name: 'Concessionnaire Auto', x: -28, z: 70, dir: 1,
      cars: [
        { name: 'Citadine',      price: 500,  badgeId: 'car_basic' },
        { name: 'Berline',       price: 1200, badgeId: 'car_sedan' },
        { name: 'Voiture sport', price: 3000, badgeId: 'car_sport' },
      ]
    },
    // ── Nouveaux bâtiments ──────────────────────────────────────────────────────
    {
      id: 'grocery_1', type: 'grocery', name: 'Supermarché', x: 28, z: 28, dir: 1,
      stock: [
        { name: 'Pomme',       price: 2,  hungerBonus: 15, healthBonus: 3 },
        { name: 'Pain complet',price: 4,  hungerBonus: 25, healthBonus: 4 },
        { name: 'Viande',      price: 10, hungerBonus: 45, healthBonus: 8 },
        { name: 'Lait',        price: 3,  hungerBonus: 20, healthBonus: 5 },
        { name: 'Pizza',       price: 12, hungerBonus: 55, healthBonus: 5 },
      ]
    },
    {
      id: 'restaurant_1', type: 'restaurant', name: 'Restaurant Le Gourmet', x: 28, z: 42, dir: 1,
      stock: [
        { name: 'Entrée',         price: 8,  hungerBonus: 25, healthBonus: 5  },
        { name: 'Plat du jour',   price: 20, hungerBonus: 65, healthBonus: 15 },
        { name: 'Dessert',        price: 6,  hungerBonus: 20, healthBonus: 3  },
        { name: 'Menu complet',   price: 35, hungerBonus: 100, healthBonus: 25 },
      ]
    },
    {
      id: 'police_1', type: 'police_station', name: 'Commissariat de Police', x: 28, z: -28, dir: -1,
    },
    {
      id: 'hospital_1', type: 'hospital', name: 'Hôpital Central', x: 28, z: 70, dir: 1,
      treatments: [
        { name: 'Pansement',    price: 15,  healthGain: 25  },
        { name: 'Consultation', price: 40,  healthGain: 60  },
        { name: 'Opération',    price: 120, healthGain: 100 },
      ]
    },
    {
      id: 'gym_1', type: 'gym', name: 'Salle de Sport FitCity', x: 42, z: 28, dir: 1,
      trainings: [
        { name: 'Musculation',   price: 30,  stat: 'strength',  gain: 5  },
        { name: 'Sprint',        price: 25,  stat: 'speed',     gain: 4  },
        { name: 'Cardio',        price: 20,  stat: 'endurance', gain: 5  },
        { name: 'Full training', price: 60,  stat: 'all',       gain: 3  },
      ]
    },
    {
      id: 'bank_1', type: 'bank', name: 'Banque Nationale', x: 28, z: -42, dir: -1,
    },
    // ── Nouveaux employeurs ────────────────────────────────────────────────────
    {
      id: 'employer_5', type: 'employer', name: 'Commissariat (guichet)', x: 42, z: -28, dir: -1,
      job: { id: 'security', name: 'Agent de sécurité', salary: 20, iqRequired: 0, strengthRequired: 20, startHour: 8, endHour: 16 }
    },
    {
      id: 'employer_6', type: 'employer', name: 'Cuisine du Restaurant', x: 42, z: 42, dir: 1,
      job: { id: 'chef', name: 'Cuisinier', salary: 28, iqRequired: 10, strengthRequired: 0, startHour: 11, endHour: 22 }
    },
    {
      id: 'employer_7', type: 'employer', name: 'Service Médical', x: 42, z: 70, dir: 1,
      job: { id: 'doctor', name: 'Médecin', salary: 45, iqRequired: 60, strengthRequired: 0, startHour: 8, endHour: 18 }
    },
    {
      id: 'employer_8', type: 'employer', name: 'Agence Bancaire', x: 42, z: -42, dir: -1,
      job: { id: 'banker', name: 'Banquier', salary: 55, iqRequired: 80, strengthRequired: 0, startHour: 9, endHour: 17 }
    },
    {
      id: 'employer_9', type: 'employer', name: 'Supermarché (caisse)', x: 42, z: 0, dir: 1,
      job: { id: 'cashier', name: 'Caissier', salary: 12, iqRequired: 0, strengthRequired: 0, startHour: 9, endHour: 18 }
    },
    {
      id: 'employer_10', type: 'employer', name: 'Salle de Musculation', x: 0, z: 84, dir: 1,
      job: { id: 'coach', name: 'Coach sportif', salary: 22, iqRequired: 0, strengthRequired: 30, startHour: 7, endHour: 20 }
    },
    {
      id: 'employer_11', type: 'employer', name: 'Stade d\'Athlétisme', x: -42, z: 0, dir: 1,
      job: { id: 'athlete', name: 'Athlète', salary: 30, iqRequired: 0, strengthRequired: 25, startHour: 8, endHour: 20 }
    },
    {
      id: 'arena_athlete_1', type: 'arena_athlete', name: 'Arène d\'Athlétisme', x: 84, z: 0, dir: 1,
      job: { id: 'arena_athlete', name: 'Athlète Arène', salary: 30, iqRequired: 0, strengthRequired: 0, startHour: 8, endHour: 22 }
    },
    {
      id: 'car_race_1', type: 'car_race', name: 'Circuit Vitesse', x: 84, z: 28, dir: 1,
      job: { id: 'circuit_vitesse', name: 'Pilote de Course', salary: 35, iqRequired: 0, strengthRequired: 0, startHour: 8, endHour: 22 }
    },
    // ── Casernes de Pompiers (3 bâtiments éparpillés) ─────────────────────────
    {
      id: 'pompier_1', type: 'pompier', name: 'Caserne Nord', x: -14, z: 14, dir: 1,
      job: { id: 'pompier', name: 'Pompier', salary: 30, iqRequired: 0, strengthRequired: 10, startHour: 7, endHour: 20 }
    },
    {
      id: 'pompier_2', type: 'pompier', name: 'Caserne Est', x: 56, z: -14, dir: -1,
      job: { id: 'pompier', name: 'Pompier', salary: 30, iqRequired: 0, strengthRequired: 10, startHour: 7, endHour: 20 }
    },
    {
      id: 'pompier_3', type: 'pompier', name: 'Caserne Sud', x: -14, z: -56, dir: 1,
      job: { id: 'pompier', name: 'Pompier', salary: 30, iqRequired: 0, strengthRequired: 10, startHour: 7, endHour: 20 }
    },
  ],

  _list: [],

  _palette: {
    merchant:       { wall: 0xd4a96a, roof: 0x7a4f1e, floor: 0xc8a878, sign: '#7a3a00' },
    school:         { wall: 0xe8e0cc, roof: 0x3a5a80, floor: 0xd0c8a0, sign: '#004080' },
    employer:       { wall: 0xd0d0d0, roof: 0x444444, floor: 0xbbbbbb, sign: '#333333' },
    cardeal:        { wall: 0xddeeff, roof: 0x1133aa, floor: 0xccddee, sign: '#0a2266' },
    grocery:        { wall: 0xfff0cc, roof: 0x228833, floor: 0xeeeedd, sign: '#115522' },
    restaurant:     { wall: 0xffe0cc, roof: 0xaa3311, floor: 0xf5d5bb, sign: '#7a1100' },
    police_station: { wall: 0xccddee, roof: 0x1a237e, floor: 0xbbd0e8, sign: '#0a1a5e' },
    hospital:       { wall: 0xffffff, roof: 0xcc2222, floor: 0xf0f8ff, sign: '#aa0000' },
    gym:            { wall: 0xddeedd, roof: 0x224422, floor: 0xcceecc, sign: '#113311' },
    bank:           { wall: 0xf5f0e0, roof: 0x8b6914, floor: 0xece7d4, sign: '#6b4e0a' },
    arena_athlete:  { wall: 0x0d1f0d, roof: 0x1a7a1a, floor: 0x163016, sign: '#44ee44' },
    car_race:       { wall: 0x1c1010, roof: 0x991111, floor: 0x1a0d0d, sign: '#ff4444' },
    pompier:        { wall: 0xeeeeee, roof: 0xcc2200, floor: 0xdddddd, sign: '#aa1100' },
  },

  init(scene) {
    this._list = [];
    this.DEFS.forEach(def => this._list.push(this._createBuilding(scene, def)));
    State.npcs = this._list;
  },

  _createBuilding(scene, def) {
    const W = 8, D = 8, H = 4, T = 0.25; // largeur, profondeur, hauteur, épaisseur mur
    const DOOR_W = 1.6, DOOR_H = 2.6;

    const cx       = def.x;
    const facadeZ  = def.z;                   // Z du mur avant (façade)
    const backZ    = def.z + def.dir * D;     // Z du mur arrière
    const midZ     = def.z + def.dir * D / 2; // centre du bâtiment en Z
    const zMin     = Math.min(facadeZ, backZ);
    const zMax     = Math.max(facadeZ, backZ);

    const pal  = this._palette[def.type] || this._palette.employer;
    const wMat = new THREE.MeshLambertMaterial({ color: pal.wall,  side: THREE.FrontSide });
    const rMat = new THREE.MeshLambertMaterial({ color: pal.roof  });
    const fMat = new THREE.MeshLambertMaterial({ color: pal.floor });
    const gMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.55 });

    const add = (geo, mat, px, py, pz) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    };

    const sideW = (W - DOOR_W) / 2; // largeur de chaque panneau de façade (gauche/droite porte)

    // ── Mur AVANT (façade) ── 3 morceaux : gauche, droite, linteau
    add(new THREE.BoxGeometry(sideW, H, T), wMat,
        cx - DOOR_W / 2 - sideW / 2, H / 2, facadeZ);
    add(new THREE.BoxGeometry(sideW, H, T), wMat,
        cx + DOOR_W / 2 + sideW / 2, H / 2, facadeZ);
    const lintelH = H - DOOR_H;
    add(new THREE.BoxGeometry(DOOR_W, lintelH, T), wMat,
        cx, DOOR_H + lintelH / 2, facadeZ);

    // ── Mur ARRIÈRE ── 1 pièce pleine
    add(new THREE.BoxGeometry(W, H, T), wMat, cx, H / 2, backZ);

    // ── Murs LATÉRAUX ── 1 boîte pleine chacun (thick en X, profondeur D en Z)
    // Ils recouvrent toute la profondeur → murs bien collés aux 4 coins
    add(new THREE.BoxGeometry(T, H, D), wMat, cx - W / 2, H / 2, midZ);
    add(new THREE.BoxGeometry(T, H, D), wMat, cx + W / 2, H / 2, midZ);

    // ── Fenêtres (vitres posées sur les murs latéraux) ──
    const winY = 1.6, winH = 1.1, winW = 1.6;
    const winOffZ = D / 4; // décalage par rapport au centre du mur
    [-W / 2, W / 2].forEach(lx => {
      [-winOffZ, winOffZ].forEach(oz => {
        add(new THREE.BoxGeometry(T * 0.4, winH, winW), gMat, lx, winY + winH / 2, midZ + oz);
      });
    });

    // ── Toit ──
    add(new THREE.BoxGeometry(W + 0.3, 0.3, D + 0.3), rMat, cx, H + 0.15, midZ);

    // ── Sol intérieur ──
    const floorM = new THREE.Mesh(new THREE.PlaneGeometry(W - T * 2, D - T * 2), fMat);
    floorM.rotation.x = -Math.PI / 2;
    floorM.position.set(cx, 0.015, midZ);
    scene.add(floorM);

    // ── Mobilier ──
    this._furniture(scene, def.type, cx, midZ, backZ, def.dir);

    // ── NPC à l'intérieur (3m devant le mur arrière) ──
    const npcZ = def.z + def.dir * (D - 1.5);
    this._npcInside(scene, def.type, cx, npcZ);

    // ── Pancarte au-dessus de la porte ──
    const sign = this._makeSign(def.name, pal.sign);
    sign.position.set(cx, H + 0.9, facadeZ + def.dir * 0.1);
    sign.scale.set(4.5, 1.1, 1);
    scene.add(sign);

    // ── Colliders murs (la porte n'a PAS de collider → joueur peut entrer) ──
    const c = (x0, y0, z0, x1, y1, z1) =>
      State.colliders.push(new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)));

    // Mur avant gauche
    c(cx - W / 2,      0, facadeZ - T / 2,  cx - DOOR_W / 2, H, facadeZ + T / 2);
    // Mur avant droit
    c(cx + DOOR_W / 2, 0, facadeZ - T / 2,  cx + W / 2,      H, facadeZ + T / 2);
    // Linteau
    c(cx - DOOR_W / 2, DOOR_H, facadeZ - T / 2, cx + DOOR_W / 2, H, facadeZ + T / 2);
    // Mur arrière
    c(cx - W / 2, 0, backZ - T / 2,  cx + W / 2, H, backZ + T / 2);
    // Mur gauche (pleine hauteur, pleine profondeur)
    c(cx - W / 2 - T / 2, 0, zMin,  cx - W / 2 + T / 2, H, zMax);
    // Mur droit
    c(cx + W / 2 - T / 2, 0, zMin,  cx + W / 2 + T / 2, H, zMax);

    // Point d'interaction = position du NPC (à l'intérieur)
    // Le joueur doit entrer dans le bâtiment pour pouvoir interagir
    return { ...def, pos: new THREE.Vector3(cx, 0, npcZ) };
  },

  _npcInside(scene, type, cx, npcZ) {
    const cols = { merchant: 0xff8800, school: 0x0066cc, employer: 0xddaa00, arena_athlete: 0x22dd44, car_race: 0xff3333, pompier: 0xff5500 };
    const color = cols[type] || 0xffffff;

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 1.4, 0.5),
      new THREE.MeshLambertMaterial({ color })
    );
    body.position.set(cx, 0.7, npcZ);
    body.castShadow = true;
    scene.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xf5c5a3 })
    );
    head.position.set(cx, 1.65, npcZ);
    scene.add(head);
  },

  _furniture(scene, type, cx, midZ, backZ, dir) {
    const brownMat = new THREE.MeshLambertMaterial({ color: 0x5c3317 });

    if (type === 'merchant') {
      // Comptoir
      const counter = new THREE.Mesh(new THREE.BoxGeometry(6, 0.85, 1.0), brownMat);
      counter.position.set(cx, 0.425, backZ - dir * 2);
      counter.castShadow = true;
      scene.add(counter);
    } else if (type === 'school') {
      // 3 rangées de tables
      for (let i = 0; i < 3; i++) {
        const tx = cx - 3 + i * 3;
        const table = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.7), brownMat);
        table.position.set(tx, 0.78, midZ + dir * 0.5);
        scene.add(table);
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.78, 0.08), brownMat);
        leg.position.set(tx, 0.39, midZ + dir * 0.5);
        scene.add(leg);
      }
    } else if (type === 'employer') {
      // Bureau
      const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.1), brownMat);
      desk.position.set(cx, 0.82, backZ - dir * 2);
      desk.castShadow = true;
      scene.add(desk);
    } else if (type === 'grocery') {
      // Rayonnages d'épicerie
      const shelfMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
      for (let i = -1; i <= 1; i++) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 4.5), shelfMat);
        shelf.position.set(cx + i * 2.2, 0.9, midZ - dir * 1.5);
        scene.add(shelf);
      }
      // Caisse
      const desk = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 0.8), brownMat);
      desk.position.set(cx, 0.425, backZ - dir * 1.5);
      scene.add(desk);
    } else if (type === 'restaurant') {
      // Tables rondes
      const tMat = new THREE.MeshLambertMaterial({ color: 0xaa7755 });
      [[-2, -1.5], [0, -1.5], [2, -1.5], [-2, 1.5], [2, 1.5]].forEach(([ox, oz]) => {
        const table = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 12), tMat);
        table.position.set(cx + ox, 0.74, midZ + oz * dir);
        scene.add(table);
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.74, 8), brownMat);
        leg.position.set(cx + ox, 0.37, midZ + oz * dir);
        scene.add(leg);
      });
    } else if (type === 'police_station') {
      // Banque d'accueil
      const desk = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.9, 1.0), brownMat);
      desk.position.set(cx, 0.45, backZ - dir * 2);
      scene.add(desk);
      // Tableau de wanted
      const board = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.0, 0.1),
        new THREE.MeshLambertMaterial({ color: 0x223344 }));
      board.position.set(cx, 2.2, backZ + dir * 0.1);
      scene.add(board);
    } else if (type === 'hospital') {
      // Lits
      const bedMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const bedFr  = new THREE.MeshLambertMaterial({ color: 0xaaccee });
      [-1.8, 1.8].forEach(ox => {
        const bed = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 2.2), bedMat);
        bed.position.set(cx + ox, 0.2, midZ);
        scene.add(bed);
        const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.15, 2.0), bedFr);
        blanket.position.set(cx + ox, 0.42, midZ);
        scene.add(blanket);
      });
      // Comptoir médical
      const desk = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.85, 0.85), brownMat);
      desk.position.set(cx, 0.425, backZ - dir * 2);
      scene.add(desk);
    } else if (type === 'gym') {
      // Appareils de musculation
      const gymMat = new THREE.MeshLambertMaterial({ color: 0x444455 });
      [-2.5, 0, 2.5].forEach(ox => {
        const machine = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 1.1), gymMat);
        machine.position.set(cx + ox, 0.7, midZ - dir);
        scene.add(machine);
      });
      // Tapis de course
      const tapis = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 2.0),
        new THREE.MeshLambertMaterial({ color: 0x222222 }));
      tapis.position.set(cx, 0.125, midZ + dir * 1.5);
      scene.add(tapis);
    } else if (type === 'bank') {
      // Guichets
      const gMat = new THREE.MeshLambertMaterial({ color: 0xc8b060 });
      [-2, 0, 2].forEach(ox => {
        const guichet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.6), gMat);
        guichet.position.set(cx + ox, 0.5, backZ - dir * 2);
        scene.add(guichet);
      });
      // Coffre-fort
      const safe = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8),
        new THREE.MeshLambertMaterial({ color: 0x556677 }));
      safe.position.set(cx + 3, 0.7, backZ + dir * 0.3);
      scene.add(safe);
    } else if (type === 'arena_athlete') {
      // Piste de course centrale (tartan rouge)
      const tartanMat = new THREE.MeshLambertMaterial({ color: 0xaa2211 });
      const tartan = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.03, 5.8), tartanMat);
      tartan.position.set(cx, 0.02, midZ);
      scene.add(tartan);
      // Lignes de couloir (blanches)
      const lineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      [-0.72, 0.72].forEach(ox => {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 5.8), lineMat);
        line.position.set(cx + ox, 0.04, midZ);
        scene.add(line);
      });
      // Barre de saut en hauteur : 2 poteaux + barre
      const postMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      const barMat  = new THREE.MeshLambertMaterial({ color: 0xf1c40f });
      [-1.4, 1.4].forEach(ox => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), postMat);
        post.position.set(cx + ox, 0.9, backZ - dir * 2.2);
        scene.add(post);
      });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.06, 0.06), barMat);
      bar.position.set(cx, 1.6, backZ - dir * 2.2);
      scene.add(bar);
      // Podium 3 marches
      const goldMat   = new THREE.MeshLambertMaterial({ color: 0xd4af37 });
      const silverMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
      const bronzeMat = new THREE.MeshLambertMaterial({ color: 0xcd7f32 });
      const steps = [{ mat:goldMat,h:0.55,ox:0 },{ mat:silverMat,h:0.40,ox:-1.1 },{ mat:bronzeMat,h:0.28,ox:1.1 }];
      steps.forEach(({ mat, h, ox }) => {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.9, h, 0.8), mat);
        step.position.set(cx + ox, h/2, midZ + dir * 1.8);
        scene.add(step);
      });
    } else if (type === 'car_race') {
      // Voiture de course exposée
      const carMat  = new THREE.MeshLambertMaterial({ color: 0xdd1111 });
      const darkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      const glassMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
      const carBody = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 3.4), carMat);
      carBody.position.set(cx, 0.45, midZ);
      carBody.castShadow = true; scene.add(carBody);
      const carTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.42, 1.6), carMat);
      carTop.position.set(cx, 0.86, midZ + dir * 0.15);
      scene.add(carTop);
      [-1, 1].forEach(side => {
        const wind = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.38, 0.07), glassMat);
        wind.position.set(cx, 0.86, midZ + side * dir * 0.78);
        wind.rotation.y = side * 0.22;
        scene.add(wind);
      });
      const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 12);
      [[-0.96, -1.2], [-0.96, 1.2], [0.96, -1.2], [0.96, 1.2]].forEach(([dx, dz]) => {
        const wheel = new THREE.Mesh(wheelGeo, darkMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(cx + dx, 0.25, midZ + dz * dir);
        scene.add(wheel);
      });
      // Pile de pneus (déco)
      const tireMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      [-2.5, 2.5].forEach(ox => {
        for (let i = 0; i < 3; i++) {
          const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.14, 6, 12), tireMat);
          tire.rotation.x = Math.PI / 2;
          tire.position.set(cx + ox, 0.14 + i * 0.29, backZ - dir * 1.2);
          scene.add(tire);
        }
      });
      // Podium
      const podMat = new THREE.MeshLambertMaterial({ color: 0x998800 });
      const pod = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 1.2), podMat);
      pod.position.set(cx, 0.125, backZ - dir * 2.8);
      scene.add(pod);
    } else if (type === 'pompier') {
      // Camion de pompier miniature (décoratif)
      const redM  = new THREE.MeshLambertMaterial({ color: 0xcc1100 });
      const darkM = new THREE.MeshLambertMaterial({ color: 0x111111 });
      const truckBody = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 3.8), redM);
      truckBody.position.set(cx, 0.65, midZ - dir * 0.5);
      truckBody.castShadow = true; scene.add(truckBody);
      const truckCab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.7, 1.2), redM);
      truckCab.position.set(cx, 1.45, midZ + dir * 1.0);
      scene.add(truckCab);
      const wheelG = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 8);
      [[-1.0,-1.4],[-1.0,1.4],[1.0,-1.4],[1.0,1.4]].forEach(([dx, dz]) => {
        const w = new THREE.Mesh(wheelG, darkM);
        w.rotation.z = Math.PI / 2;
        w.position.set(cx + dx, 0.3, midZ + dz * dir);
        scene.add(w);
      });
      // Tableau de bord (bureau d'accueil)
      const desk2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.85, 0.9), brownMat);
      desk2.position.set(cx, 0.425, backZ - dir * 1.8);
      scene.add(desk2);
    } else if (type === 'cardeal') {
      // Voiture exposée dans le showroom
      const carColors = [0xcc2200, 0x2244cc, 0x228822, 0x111111, 0xcccccc];
      const carColor = carColors[Math.floor(Math.random() * carColors.length)];
      const carMat = new THREE.MeshLambertMaterial({ color: carColor });
      const darkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
      const glassMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });

      // Carrosserie
      const carBody = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 3.8), carMat);
      carBody.position.set(cx, 0.55, midZ);
      carBody.castShadow = true; scene.add(carBody);
      // Toit
      const carTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 2.2), carMat);
      carTop.position.set(cx, 1.1, midZ + dir * 0.2);
      scene.add(carTop);
      // Pare-brise / vitre arrière
      const windGeo = new THREE.BoxGeometry(1.55, 0.5, 0.08);
      [-1, 1].forEach(side => {
        const wind = new THREE.Mesh(windGeo, glassMat);
        wind.position.set(cx, 1.1, midZ + side * dir * 1.05);
        wind.rotation.y = side * 0.25;
        scene.add(wind);
      });
      // 4 roues
      const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 12);
      [[-1.1, -1.4], [-1.1, 1.4], [1.1, -1.4], [1.1, 1.4]].forEach(([dx, dz]) => {
        const wheel = new THREE.Mesh(wheelGeo, darkMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(cx + dx, 0.3, midZ + dz * dir);
        scene.add(wheel);
      });
    }
  },

  _makeSign(text, bgColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 120, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 112, 12);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px Arial';
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
