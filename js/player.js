const Player = {
  _box: null,
  _size: null,
  _center: null,

  init() {
    this._box    = new THREE.Box3();
    this._size   = new THREE.Vector3(CONFIG.PLAYER_HALF_W * 2, CONFIG.PLAYER_HALF_H * 2, CONFIG.PLAYER_HALF_W * 2);
    this._center = new THREE.Vector3();
  },

  update(delta) {
    if (State.paused || State.gameOver) return;

    // --- En voiture : Cars gère mouvement + caméra ---
    if (State.inCar) {
      // Drains passifs et game over toujours actifs
      State.hunger -= CONFIG.HUNGER_DRAIN * delta;
      if (State.hunger < 0) State.hunger = 0;
      if (State.hunger > 30) {
        State.health += CONFIG.HEALTH_REGEN * delta;
        if (State.health > 100) State.health = 100;
      }
      if (State.health <= 0) { UI.showGameOver('Tu es mort de blessures.'); return; }
      if (State.hunger <= 0) { UI.showGameOver('Tu es mort de faim.'); return; }
      return;
    }

    // --- Rotation caméra ---
    if (State.pointerLocked) {
      State.yaw   -= State.mouseDX * CONFIG.SENSITIVITY;
      State.pitch -= State.mouseDY * CONFIG.SENSITIVITY;
      State.pitch  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, State.pitch));
      State.mouseDX = 0;
      State.mouseDY = 0;
    }

    // --- Déplacement ---
    const sinY = Math.sin(State.yaw);
    const cosY = Math.cos(State.yaw);
    let moveX = 0, moveZ = 0;

    if (State.keys['KeyW'] || State.keys['ArrowUp'])    { moveX -= sinY; moveZ -= cosY; }
    if (State.keys['KeyS'] || State.keys['ArrowDown'])  { moveX += sinY; moveZ += cosY; }
    if (State.keys['KeyA'] || State.keys['ArrowLeft'])  { moveX -= cosY; moveZ += sinY; }
    if (State.keys['KeyD'] || State.keys['ArrowRight']) { moveX += cosY; moveZ -= sinY; }

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (len > 0) { moveX /= len; moveZ /= len; }

    State.velX = moveX * CONFIG.PLAYER_SPEED;
    State.velZ = moveZ * CONFIG.PLAYER_SPEED;

    // --- Gravité ---
    State.velY += CONFIG.GRAVITY * delta;

    // --- Collisions AABB (seulement les colliders proches) ---
    const nearColliders = State.colliders.filter(c => {
      const cx = (c.min.x + c.max.x) / 2;
      const cz = (c.min.z + c.max.z) / 2;
      return Math.abs(cx - State.posX) < 25 && Math.abs(cz - State.posZ) < 25;
    });

    // Test X
    State.posX += State.velX * delta;
    this._center.set(State.posX, State.posY, State.posZ);
    this._box.setFromCenterAndSize(this._center, this._size);
    if (nearColliders.some(c => c.intersectsBox(this._box))) {
      State.posX -= State.velX * delta;
    }

    // Test Z
    State.posZ += State.velZ * delta;
    this._center.set(State.posX, State.posY, State.posZ);
    this._box.setFromCenterAndSize(this._center, this._size);
    if (nearColliders.some(c => c.intersectsBox(this._box))) {
      State.posZ -= State.velZ * delta;
    }

    // Test Y (sol)
    State.posY += State.velY * delta;
    const groundLevel = CONFIG.GROUND_Y + CONFIG.PLAYER_HALF_H;
    if (State.posY <= groundLevel) {
      State.posY = groundLevel;
      State.velY = 0;
      State.onGround = true;
    } else {
      State.onGround = false;
    }

    // Saut
    if (State.keys['Space'] && State.onGround) {
      State.velY = CONFIG.JUMP_FORCE;
      State.onGround = false;
    }

    // --- Détection rivière (ponts exclus) ---
    const rHalfW = CONFIG.RIVER_WIDTH / 2;
    const rHalfL = CONFIG.RIVER_LENGTH / 2;
    const inRiver = Math.abs(State.posX - CONFIG.RIVER_CENTER_X) < rHalfW &&
                    Math.abs(State.posZ) < rHalfL;
    const roadHalfW = CONFIG.GRID_STEP / 2;
    const onBridge  = inRiver && State.bridgeZs &&
                      State.bridgeZs.some(bz => Math.abs(State.posZ - bz) < roadHalfW);
    State.isUnderwater = inRiver && !onBridge;

    // --- Drains ---
    if (State.isUnderwater) {
      State.oxygen -= CONFIG.OXYGEN_DRAIN * delta;
      if (State.oxygen < 0) State.oxygen = 0;
    } else {
      State.oxygen += CONFIG.OXYGEN_REGEN * delta;
      if (State.oxygen > CONFIG.OXYGEN_MAX) State.oxygen = CONFIG.OXYGEN_MAX;
    }

    State.hunger -= CONFIG.HUNGER_DRAIN * delta;
    if (State.hunger < 0) State.hunger = 0;

    if (State.hunger > 30) {
      State.health += CONFIG.HEALTH_REGEN * delta;
      if (State.health > 100) State.health = 100;
    }

    // --- Game Over ---
    if (State.health <= 0)   { UI.showGameOver('Tu es mort de blessures.'); return; }
    if (State.hunger <= 0)   { UI.showGameOver('Tu es mort de faim.'); return; }
    if (State.oxygen <= 0)   { UI.showGameOver('Tu t\'es noyé.'); return; }

    // --- NPC le plus proche ---
    State.nearNPC = NPC.getNearest(State.posX, State.posZ);

    // --- Objet ramassable le plus proche ---
    State.nearPickup = null;
    for (let i = 0; i < State.pickups.length; i++) {
      const p = State.pickups[i];
      const dx = p.pos.x - State.posX;
      const dz = p.pos.z - State.posZ;
      if (Math.sqrt(dx * dx + dz * dz) < CONFIG.PICKUP_RANGE) {
        State.nearPickup = p;
        break;
      }
    }

    // --- Appliquer position caméra ---
    const cam = State.camera;
    cam.position.set(
      State.posX,
      State.posY + (CONFIG.PLAYER_EYE_H - CONFIG.PLAYER_HALF_H),
      State.posZ
    );
    cam.rotation.order = 'YXZ';
    cam.rotation.y = State.yaw;
    cam.rotation.x = State.pitch;
  }
};
