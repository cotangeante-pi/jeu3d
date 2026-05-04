const HousingSystem = {
  _pivot:      null,
  _doorAngle:  0,
  _doorOpen:   false,

  HOUSE_X:   70,
  HOUSE_Z:   56,
  DOOR_RANGE: 2.5,

  init(scene) {
    this._buildHouse(scene);
    if (State.houseDoorOpen) {
      this._doorOpen  = true;
      this._doorAngle = -Math.PI / 2;
      if (this._pivot) this._pivot.rotation.y = -Math.PI / 2;
    }
  },

  _buildHouse(scene) {
    const cx = this.HOUSE_X;
    const fZ  = this.HOUSE_Z;
    const dir = -1;
    const W = 10, D = 10, H = 5, T = 0.25;
    const DOOR_W = 1.6, DOOR_H = 2.8;
    const backZ = fZ + dir * D;
    const midZ  = fZ + dir * D / 2;
    const zMin  = Math.min(fZ, backZ), zMax = Math.max(fZ, backZ);

    const wallMat  = new THREE.MeshLambertMaterial({ color: 0xfde8cc });
    const roofMat  = new THREE.MeshLambertMaterial({ color: 0x8b2500 });
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xd4c09a });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x88ccff, transparent: true, opacity: 0.55 });
    const doorMat  = new THREE.MeshLambertMaterial({ color: 0x5c3317 });

    const add = (geo, mat, px, py, pz) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(px, py, pz);
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
    };

    const sideW = (W - DOOR_W) / 2;

    add(new THREE.BoxGeometry(sideW, H, T), wallMat, cx - DOOR_W/2 - sideW/2, H/2, fZ);
    add(new THREE.BoxGeometry(sideW, H, T), wallMat, cx + DOOR_W/2 + sideW/2, H/2, fZ);
    const lintelH = H - DOOR_H;
    add(new THREE.BoxGeometry(DOOR_W, lintelH, T), wallMat, cx, DOOR_H + lintelH/2, fZ);

    add(new THREE.BoxGeometry(W, H, T), wallMat, cx, H/2, backZ);
    add(new THREE.BoxGeometry(T, H, D), wallMat, cx - W/2, H/2, midZ);
    add(new THREE.BoxGeometry(T, H, D), wallMat, cx + W/2, H/2, midZ);

    const winH = 1.2, winW = 1.8, winOff = D / 4;
    [-W/2, W/2].forEach(lx => {
      [-winOff, winOff].forEach(oz => {
        add(new THREE.BoxGeometry(T*0.4, winH, winW), glassMat, cx + lx, 2.0, midZ + oz);
      });
    });

    add(new THREE.BoxGeometry(W+0.3, 0.4, D+0.3), roofMat, cx, H+0.2, midZ);

    const fl = new THREE.Mesh(new THREE.PlaneGeometry(W - T*2, D - T*2), floorMat);
    fl.rotation.x = -Math.PI / 2;
    fl.position.set(cx, 0.015, midZ);
    scene.add(fl);

    this._addSign(scene, cx, H + 0.9, fZ + 0.25, '🏠 Ma Maison');

    const c = (x0, y0, z0, x1, y1, z1) =>
      State.colliders.push(new THREE.Box3(new THREE.Vector3(x0,y0,z0), new THREE.Vector3(x1,y1,z1)));
    c(cx - W/2,       0, fZ - T/2,     cx - DOOR_W/2, H, fZ + T/2);
    c(cx + DOOR_W/2,  0, fZ - T/2,     cx + W/2,      H, fZ + T/2);
    c(cx - DOOR_W/2, DOOR_H, fZ - T/2, cx + DOOR_W/2, H, fZ + T/2);
    c(cx - W/2,       0, backZ - T/2,  cx + W/2,      H, backZ + T/2);
    c(cx - W/2 - T/2, 0, zMin,         cx - W/2 + T/2,H, zMax);
    c(cx + W/2 - T/2, 0, zMin,         cx + W/2 + T/2,H, zMax);

    const pivot = new THREE.Object3D();
    pivot.position.set(cx - DOOR_W / 2, 0, fZ);
    scene.add(pivot);
    this._pivot = pivot;

    const door = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, T * 0.8), doorMat);
    door.position.set(DOOR_W / 2, DOOR_H / 2, 0);
    door.castShadow = true;
    pivot.add(door);
  },

  _addSign(scene, x, y, z, text) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8b2500';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 64);
    const spr = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthTest: false })
    );
    spr.position.set(x, y, z);
    spr.scale.set(4.5, 1.1, 1);
    scene.add(spr);
  },

  tick(delta) {
    if (this._pivot) {
      const target = this._doorOpen ? -Math.PI / 2 : 0;
      this._doorAngle += (target - this._doorAngle) * Math.min(1, delta * 6);
      this._pivot.rotation.y = this._doorAngle;
    }
    const dx = State.posX - this.HOUSE_X;
    const dz = State.posZ - this.HOUSE_Z;
    State.nearHouseDoor = Math.sqrt(dx * dx + dz * dz) < this.DOOR_RANGE;
  },

  tryDoor() {
    if (!State.badges.includes('house')) return false;
    if (!State.nearHouseDoor) return false;
    this._doorOpen      = !this._doorOpen;
    State.houseDoorOpen = this._doorOpen;
    Sound.coin();
    Save.write();
    return true;
  },
};
