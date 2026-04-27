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

    // --- Rotation caméra (touch: toujours actif car pointerLocked=true dès init) ---
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

    const boosting = State.keys['ShiftLeft'] || State.keys['ShiftRight'];

    // --- Détection zone rivière ---
    const rHalfW = CONFIG.RIVER_WIDTH / 2;
    const rHalfL = CONFIG.RIVER_LENGTH / 2;
    const isInRiverXZ = Math.abs(State.posX - CONFIG.RIVER_CENTER_X) < rHalfW &&
                        Math.abs(State.posZ) < rHalfL;
    const onBridge = isInRiverXZ && State.bridgeZs &&
                     State.bridgeZs.some(bz => Math.abs(State.posZ - bz) < CONFIG.GRID_STEP / 2);
    const inWater = isInRiverXZ && !onBridge;
    State.inWater = inWater;

    // Vitesse réduite dans l'eau
    const spd = CONFIG.PLAYER_SPEED * (boosting ? 2.0 : 1.0) * (inWater ? 0.4 : 1.0);
    State.velX = moveX * spd;
    State.velZ = moveZ * spd;

    // --- Gravité ---
    State.velY += CONFIG.GRAVITY * delta;

    // --- Physique eau : flottabilité + nage ---
    if (inWater) {
      // Flottabilité et montée uniquement quand sous la surface
      if (State.posY < CONFIG.PLAYER_HALF_H) {
        State.velY += (-CONFIG.GRAVITY * 0.82) * delta;
        // Nager vers le haut avec Espace / bouton saut
        if (State.keys['Space']) {
          State.velY = Math.min(State.velY + 10 * delta, 3.0);
        }
      }
      // Limiter la vitesse verticale dans l'eau
      State.velY = Math.max(-4, Math.min(State.velY, 3));
    }

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

    // Test Y (sol ou fond de la rivière)
    State.posY += State.velY * delta;
    // Bloquer à la surface de l'eau pour éviter de s'envoler
    if (inWater && State.posY > CONFIG.PLAYER_HALF_H) {
      State.posY = CONFIG.PLAYER_HALF_H;
      if (State.velY > 0) State.velY = 0;
    }
    const groundLevel = (inWater ? -5 : CONFIG.GROUND_Y) + CONFIG.PLAYER_HALF_H;
    if (State.posY <= groundLevel) {
      State.posY = groundLevel;
      State.velY = 0;
      State.onGround = true;
    } else {
      State.onGround = false;
    }

    // ── Saut & escalade (uniquement hors de l'eau) ──
    if (!inWater) {
      if (State.keys['Space'] && State.onGround) {
        Sound.jump();
        State.velY = CONFIG.JUMP_FORCE;
        State.onGround = false;
        State.climbTimer = 0;
        State.isClimbing = false;
      } else if (State.keys['Space'] && !State.onGround) {
        // Espace maintenu en l'air → escalade si un mur est devant
        State.climbTimer += delta;
        if (State.climbTimer > 0.55) {
          const fwdX = -Math.sin(State.yaw) * 1.1;
          const fwdZ = -Math.cos(State.yaw) * 1.1;
          const testBox = new THREE.Box3(
            new THREE.Vector3(State.posX + fwdX - 0.28, State.posY - 0.5, State.posZ + fwdZ - 0.28),
            new THREE.Vector3(State.posX + fwdX + 0.28, State.posY + 1.5, State.posZ + fwdZ + 0.28)
          );
          const wallFound = nearColliders.some(c => c.intersectsBox(testBox));
          if (wallFound) {
            State.isClimbing = true;
            State.velY = 2.8;
          } else {
            State.isClimbing = false;
          }
        }
      } else {
        State.climbTimer = 0;
        State.isClimbing = false;
      }
    } else {
      State.climbTimer = 0;
      State.isClimbing = false;
    }

    // --- Détection noyade ---
    const eyeY = State.posY + (CONFIG.PLAYER_EYE_H - CONFIG.PLAYER_HALF_H);
    State.isUnderwater = inWater && eyeY < 0.1;

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
