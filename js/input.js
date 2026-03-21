const Input = {
  init() {
    const canvas = document.getElementById('game-canvas');

    // Pointer Lock — clic sur le canvas pour capturer la souris
    canvas.addEventListener('click', () => {
      if (!State.paused && !State.gameOver) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      State.pointerLocked = (document.pointerLockElement === canvas);
    });

    document.addEventListener('mousemove', e => {
      if (!State.pointerLocked) return;
      State.mouseDX += e.movementX;
      State.mouseDY += e.movementY;
    });

    // Clavier
    document.addEventListener('keydown', e => {
      State.keys[e.code] = true;
      if (e.code === 'KeyE')   Interactions.interact();
      if (e.code === 'Escape') UI.togglePause();
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    });

    document.addEventListener('keyup', e => {
      State.keys[e.code] = false;
    });

    // Clics souris
    document.addEventListener('mousedown', e => {
      if (!State.pointerLocked) return;
      if (e.button === 0) Interactions.punch();
      if (e.button === 2) Interactions.pickup();
    });

    document.addEventListener('contextmenu', e => e.preventDefault());
  }
};
