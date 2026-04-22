const Jobs = {
  _ZONES: {
    baker:      { xMin: -32, xMax: -24, zMin: -36, zMax: -28 },
    consultant: { xMin:  -4, xMax:   4, zMin:  42, zMax:  50 },
    security:   { xMin:  38, xMax:  46, zMin: -36, zMax: -28 },
    chef:       { xMin:  38, xMax:  46, zMin:  42, zMax:  50 },
    doctor:     { xMin:  38, xMax:  46, zMin:  70, zMax:  78 },
    banker:     { xMin:  38, xMax:  46, zMin: -50, zMax: -42 },
    cashier:    { xMin:  38, xMax:  46, zMin:  -4, zMax:   8 },
    coach:      { xMin:  -4, xMax:   4, zMin:  84, zMax:  92 },
    worker:     { xMin: -32, xMax: -24, zMin: -50, zMax: -42 },
    nurse:      { xMin:  -4, xMax:   4, zMin: -78, zMax: -70 },
  },

  tick(delta) {
    if (State.paused || State.gameOver) return;
    if (!State.currentJob) { State.inJobZone = false; return; }

    // Salaire passif
    State.salaryTimer += delta;
    if (State.salaryTimer >= CONFIG.SALARY_INTERVAL) {
      State.salaryTimer -= CONFIG.SALARY_INTERVAL;
      State.money += State.currentJob.salary;
      HUD.update();
      Save.write();
      this._notify(`Salaire : +${State.currentJob.salary}$`, '#88ff88');
    }

    // Détection de zone (uniquement hors mode travail et hors voiture)
    if (!State.inWorkMode && !State.inCar) {
      const zone = this._ZONES[State.currentJob.id];
      State.inJobZone = zone
        ? State.posX >= zone.xMin && State.posX <= zone.xMax &&
          State.posZ >= zone.zMin && State.posZ <= zone.zMax
        : false;
    } else {
      State.inJobZone = false;
    }
  },

  enterWork() {
    if (!State.currentJob || State.inWorkMode) return;
    const id = State.currentJob.id;
    if (id === 'baker') { Bakery.enter();    return; }
    if (id === 'coach') { Athletics.enter(); return; }
    WorkOverlay.enter(id);
  },

  exitWork() {
    if (!State.inWorkMode) return;
    const id = State.currentJob ? State.currentJob.id : '';
    if (id === 'baker') { Bakery.exit();    return; }
    if (id === 'coach') { Athletics.exit(); return; }
    WorkOverlay.exit();
  },

  earnFromWork(amount) {
    State.money += amount;
    HUD.update();
    Save.write();
    this._notify(`✓ Bien joué ! +${amount}$`, '#88ff88');
  },

  hire(job) {
    State.currentJob  = { ...job };
    State.salaryTimer = 0;
    State.inJobZone   = false;
    if (!State.badges.includes(job.id)) State.badges.push(job.id);
  },

  quit() {
    State.currentJob  = null;
    State.salaryTimer = 0;
    State.inJobZone   = false;
  },

  _notify(text, color) {
    const el = document.getElementById('job-notify');
    if (!el) return;
    el.textContent   = text;
    el.style.color   = color || '#ffffff';
    el.style.display = 'block';
    clearTimeout(this._notifyTO);
    this._notifyTO   = setTimeout(() => { el.style.display = 'none'; }, 5000);
  },
};
