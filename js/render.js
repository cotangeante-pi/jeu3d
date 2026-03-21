const Render = {
  _clock: null,
  _autoSaveTimer: 0,

  init() {
    const canvas = document.getElementById('game-canvas');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    State.renderer = renderer;

    const scene = new THREE.Scene();
    State.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1600
    );
    camera.position.set(State.posX, State.posY + (CONFIG.PLAYER_EYE_H - CONFIG.PLAYER_HALF_H), State.posZ);
    State.camera = camera;

    this._clock = new THREE.Clock();

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });
  },

  animate() {
    requestAnimationFrame(() => Render.animate());

    const delta = Math.min(this._clock.getDelta(), 0.1);

    if (!State.paused && !State.gameOver) {
      Player.update(delta);
      Cars.update(delta);
      Jobs.tick(delta);
      Humans.update(delta);
      // Bateaux
      const riverHalf = CONFIG.RIVER_LENGTH / 2;
      State.boats.forEach(b => {
        b.group.position.z += b.speed * b.dir * delta;
        if (b.group.position.z > riverHalf)  b.group.position.z = -riverHalf;
        if (b.group.position.z < -riverHalf) b.group.position.z =  riverHalf;
        b.group.rotation.y = b.dir > 0 ? 0 : Math.PI;
      });

      this._autoSaveTimer += delta;
      if (this._autoSaveTimer >= CONFIG.AUTOSAVE_INTERVAL) {
        this._autoSaveTimer = 0;
        Save.write();
      }
    }

    HUD.update();
    State.renderer.render(State.scene, State.camera);
  }
};
