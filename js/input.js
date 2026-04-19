const Input = {
  _joystickTouch: null, // { id, startX, startY }
  _lookTouch: null,     // { id, lastX, lastY }

  init() {
    // Pas de pointer lock sur mobile — on simule l'état actif dès le départ
    State.pointerLocked = true;

    const JR = 38; // rayon max du joystick en px
    const jHandle = document.getElementById('joystick-handle');

    const resetJoystick = () => {
      this._joystickTouch = null;
      jHandle.style.transform = 'translate(-50%, -50%)';
      State.keys['KeyW'] = false;
      State.keys['KeyS'] = false;
      State.keys['KeyA'] = false;
      State.keys['KeyD'] = false;
    };

    const updateJoystick = (rawX, rawY) => {
      const len = Math.sqrt(rawX * rawX + rawY * rawY);
      const nx = len > 0 ? rawX / len : 0;
      const ny = len > 0 ? rawY / len : 0;
      const travel = Math.min(len, JR);
      jHandle.style.transform = `translate(calc(-50% + ${nx * travel}px), calc(-50% + ${ny * travel}px))`;
      // Virtual keys à partir de la direction normalisée
      State.keys['KeyW'] = ny < -0.25;
      State.keys['KeyS'] = ny >  0.25;
      State.keys['KeyA'] = nx < -0.25;
      State.keys['KeyD'] = nx >  0.25;
    };

    document.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        const leftZone = t.clientX < window.innerWidth * 0.42;
        if (leftZone && !this._joystickTouch) {
          this._joystickTouch = { id: t.identifier, startX: t.clientX, startY: t.clientY };
          Poki.start();
        } else if (!leftZone && !this._lookTouch) {
          this._lookTouch = { id: t.identifier, lastX: t.clientX, lastY: t.clientY };
          Poki.start();
        }
      }
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (this._joystickTouch && t.identifier === this._joystickTouch.id) {
          updateJoystick(
            t.clientX - this._joystickTouch.startX,
            t.clientY - this._joystickTouch.startY
          );
        }
        if (this._lookTouch && t.identifier === this._lookTouch.id) {
          // Même accumulateurs que la souris — player.js les consomme chaque frame
          State.mouseDX += (t.clientX - this._lookTouch.lastX) * 1.6;
          State.mouseDY += (t.clientY - this._lookTouch.lastY) * 1.6;
          this._lookTouch.lastX = t.clientX;
          this._lookTouch.lastY = t.clientY;
        }
      }
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (this._joystickTouch && t.identifier === this._joystickTouch.id) resetJoystick();
        if (this._lookTouch    && t.identifier === this._lookTouch.id)     this._lookTouch = null;
      }
    }, { passive: false });

    document.addEventListener('touchcancel', e => {
      for (const t of e.changedTouches) {
        if (this._joystickTouch && t.identifier === this._joystickTouch.id) resetJoystick();
        if (this._lookTouch    && t.identifier === this._lookTouch.id)     this._lookTouch = null;
      }
    }, { passive: false });

    // Boutons action — hold pour Space et T, tap pour les autres
    const hold = (btn, keyCode) => {
      btn.addEventListener('touchstart', e => { State.keys[keyCode] = true;  e.preventDefault(); }, { passive: false });
      btn.addEventListener('touchend',   e => { State.keys[keyCode] = false; e.preventDefault(); }, { passive: false });
    };

    hold(document.getElementById('btn-jump'), 'Space');
    hold(document.getElementById('btn-work'), 'KeyT');

    document.getElementById('btn-interact').addEventListener('touchstart', e => {
      Interactions.interact(); e.preventDefault();
    }, { passive: false });

    document.getElementById('btn-punch').addEventListener('touchstart', e => {
      Interactions.punch(); e.preventDefault();
    }, { passive: false });

    document.getElementById('btn-car').addEventListener('touchstart', e => {
      if (State.inCar) Cars.exitCar();
      else if (State.nearCar && State.badges.includes(State.nearCar.badgeId)) Cars.enterCar(State.nearCar);
      e.preventDefault();
    }, { passive: false });

    // Clavier (fonctionne toujours pour tests sur desktop)
    document.addEventListener('keydown', e => {
      State.keys[e.code] = true;
      if (e.code === 'KeyE')   Interactions.interact();
      if (e.code === 'Escape') UI.togglePause();
      if (e.code === 'KeyF') {
        if (State.inCar) Cars.exitCar();
        else if (State.nearCar && State.badges.includes(State.nearCar.badgeId)) Cars.enterCar(State.nearCar);
      }
      if (e.code.startsWith('Digit')) {
        const n = parseInt(e.code[5]) - 1;
        if (n >= 0 && n < 8) { State.selectedSlot = n; HUD.update(); }
      }
    });
    document.addEventListener('keyup',       e => { State.keys[e.code] = false; });
    document.addEventListener('contextmenu', e => e.preventDefault());
  }
};
