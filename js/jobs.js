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
    athlete:          { xMin: -46, xMax: -38, zMin:  0, zMax:  8 },
    arena_athlete:    { xMin:  80, xMax:  88, zMin:  0, zMax:  8 },
    circuit_vitesse:  { xMin:  80, xMax:  88, zMin: 28, zMax: 36 },
    // Pompier : 3 casernes — tableau de zones supporté par _inAnyZone()
    pompier: [
      { xMin: -18, xMax: -10, zMin:  14, zMax:  22 },
      { xMin:  52, xMax:  60, zMin: -22, zMax: -14 },
      { xMin: -18, xMax: -10, zMin: -56, zMax: -48 },
    ],
  },

  tick(delta) {
    if (State.paused || State.gameOver) return;
    if (!State.currentJob) { State.inJobZone = false; return; }

    // Salaire passif
    State.salaryTimer += delta;
    if (State.salaryTimer >= CONFIG.SALARY_INTERVAL) {
      State.salaryTimer -= CONFIG.SALARY_INTERVAL;
      State.money += State.currentJob.salary;
      Sound.coin();
      HUD.update();
      Save.write();
      this._notify(`Salaire : +${State.currentJob.salary}$`, '#88ff88');
    }

    // Détection de zone (uniquement hors mode travail et hors voiture)
    if (!State.inWorkMode && !State.inCar) {
      const zone = this._ZONES[State.currentJob.id];
      State.inJobZone = zone ? this._inAnyZone(zone) : false;
    } else {
      State.inJobZone = false;
    }
  },

  enterWork() {
    if (!State.currentJob || State.inWorkMode) return;
    const id = State.currentJob.id;
    if (id === 'baker')            { Bakery.enter();                     return; }
    if (id === 'coach')            { Athletics.enter();                  return; }
    if (id === 'athlete')          { Athletics.enter();                  return; }
    if (id === 'arena_athlete')    { MondeTelepporte.enterAthletics();   return; }
    if (id === 'circuit_vitesse')  { CircuitVitesse.enter();             return; }
    if (id === 'pompier')          { Pompier.enter();                    return; }
    WorkOverlay.enter(id);
  },

  exitWork() {
    if (!State.inWorkMode) return;
    const id = State.currentJob ? State.currentJob.id : '';
    if (id === 'baker')            { Bakery.exit();              return; }
    if (id === 'coach')            { Athletics.exit();           return; }
    if (id === 'athlete')          { Athletics.exit();           return; }
    if (id === 'arena_athlete')    { MondeTelepporte.exit();     return; }
    if (id === 'circuit_vitesse')  { CircuitVitesse.exit();      return; }
    if (id === 'pompier')          { Pompier.exit();             return; }
    WorkOverlay.exit();
  },

  earnFromWork(amount) {
    Sound.coin();
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

  _inAnyZone(zoneOrArray) {
    const zones = Array.isArray(zoneOrArray) ? zoneOrArray : [zoneOrArray];
    return zones.some(z =>
      State.posX >= z.xMin && State.posX <= z.xMax &&
      State.posZ >= z.zMin && State.posZ <= z.zMax
    );
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
