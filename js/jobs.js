const Jobs = {
  // Limites intérieures des bâtiments (W=8, D=8, tirées de npc.js)
  // Boulangerie:  cx=-28 dir=-1 → x[-32,-24] z[-36,-28]
  // Comptable:    cx=0   dir=1  → x[-4,4]    z[42,50]
  _ZONES: {
    baker:      { xMin: -32, xMax: -24, zMin: -36, zMax: -28 },
    consultant: { xMin:  -4, xMax:   4, zMin:  42, zMax:  50 },
  },

  tick(delta) {
    if (State.paused || State.gameOver) return;
    if (!State.currentJob) return;

    // Init failCount si absent (rétrocompat sauvegarde)
    if (State.currentJob.failCount === undefined) State.currentJob.failCount = 0;

    // Salaire passif
    State.salaryTimer += delta;
    if (State.salaryTimer >= CONFIG.SALARY_INTERVAL) {
      State.salaryTimer -= CONFIG.SALARY_INTERVAL;
      State.money += State.currentJob.salary;
      HUD.update();
      Save.write();
    }

    this._tickTask(delta);
  },

  // ─── Logique tâche ────────────────────────────────────────────────────────────
  _tickTask(delta) {
    if (!State.currentJob) return;

    // Pas de tâche → attendre puis en créer une
    if (!State.jobTask) {
      State.jobTaskTimer += delta;
      if (State.jobTaskTimer >= this._nextDelay()) {
        State.jobTaskTimer = 0;
        State.jobTask = this._createTask(State.currentJob.id);
        HUD.update();
        this._notify('Nouvelle mission ! Consulte le panneau de tâche.', '#88ccff');
      }
      return;
    }

    const task = State.jobTask;

    // ── Phase travel : décompte pour rejoindre le bureau ──────────────────────
    if (task.phase === 'travel') {
      task.travelElapsed += delta;
      HUD.update();

      if (task.travelElapsed >= task.travelLimit) {
        this._failTask('Tu n\'as pas rejoint le bureau à temps !');
        return;
      }

      // Dès que le joueur entre dans la zone → passer en phase active
      const zone = this._ZONES[State.currentJob.id];
      if (zone) {
        const inZone = State.posX >= zone.xMin && State.posX <= zone.xMax &&
                       State.posZ >= zone.zMin && State.posZ <= zone.zMax;
        if (inZone) {
          task.phase = 'active';
          this._notify('Tu es dans le bureau — Maintenez T !', '#88ccff');
          HUD.update();
        }
      }
      return;
    }

    // ── Phase active ───────────────────────────────────────────────────────────
    if (task.phase !== 'active') return;

    task.elapsed += delta;

    if (task.elapsed >= task.timeLimit) {
      this._failTask();
      return;
    }

    if (task.type === 'hold_t') {
      const zone = this._ZONES.consultant;
      const inZone = State.posX >= zone.xMin && State.posX <= zone.xMax &&
                     State.posZ >= zone.zMin && State.posZ <= zone.zMax;

      if (!inZone) {
        this._failTask('Tu as quitté le bureau pendant ta session !');
        return;
      }

      if (State.keys['KeyT'] && !State.paused) {
        task.held += delta;
        if (task.held >= task.required) {
          this._completeTask();
        }
      }
    }

    HUD.update();
  },

  // ─── Livraison pommes (appelé depuis ui.js au dialog boulangerie) ─────────────
  tryDeliverApples() {
    const task = State.jobTask;
    if (!task || task.type !== 'fetch_apples' || task.phase !== 'active') return false;

    // Compter les pommes dans l'inventaire
    let total = 0;
    State.inventory.forEach(slot => { if (slot && slot.name === 'Pomme') total += slot.count; });

    if (total < task.required) return false;

    // Consommer les pommes requises
    let toRemove = task.required;
    for (let i = 0; i < 8 && toRemove > 0; i++) {
      const slot = State.inventory[i];
      if (!slot || slot.name !== 'Pomme') continue;
      const take = Math.min(slot.count, toRemove);
      slot.count -= take;
      toRemove   -= take;
      if (slot.count <= 0) State.inventory[i] = null;
    }

    this._completeTask();
    return true;
  },

  // ─── Hire / Quit ──────────────────────────────────────────────────────────────
  hire(job) {
    State.currentJob   = { ...job, failCount: 0 };
    State.salaryTimer  = 0;
    State.jobTask      = null;
    State.jobTaskTimer = 0;
    if (!State.badges.includes(job.id)) State.badges.push(job.id);
  },

  quit() {
    State.currentJob   = null;
    State.salaryTimer  = 0;
    State.jobTask      = null;
    State.jobTaskTimer = 0;
  },

  // ─── Internes ─────────────────────────────────────────────────────────────────
  _createTask(jobId) {
    if (jobId === 'baker') {
      const n = 2 + Math.floor(Math.random() * 3); // 2-4 pommes
      return { type: 'fetch_apples', required: n, timeLimit: 180, elapsed: 0, phase: 'active' };
    }
    if (jobId === 'consultant') {
      return {
        type: 'hold_t',
        phase: 'travel',      // d'abord rejoindre le bureau
        travelLimit: 45,      // secondes pour y arriver
        travelElapsed: 0,
        required: 20,         // secondes de T à maintenir
        held: 0,
        timeLimit: 60,        // secondes pour finir une fois au bureau
        elapsed: 0,
      };
    }
    return null;
  },

  _nextDelay() {
    return 25 + Math.random() * 50; // 25-75 s entre chaque tâche
  },

  _completeTask() {
    const bonus = Math.round(State.currentJob.salary * 1.5);
    State.money += bonus;
    State.jobTask      = null;
    State.jobTaskTimer = 0;
    HUD.update();
    Save.write();
    this._notify(`✓ Mission accomplie ! Bonus +${bonus}$`, '#88ff88');
  },

  _failTask(reason) {
    State.currentJob.failCount++;
    State.jobTask      = null;
    State.jobTaskTimer = 0;
    const warns = State.currentJob.failCount;

    if (warns >= 3) {
      this._notify('✗ Licencié ! Trop de missions ratées.', '#ff4444');
      this.quit();
    } else {
      const msg = reason
        ? `✗ ${reason} (${warns}/3 avert.)`
        : `✗ Mission expirée ! (${warns}/3 avert.)`;
      this._notify(msg, '#ffaa44');
    }

    HUD.update();
    Save.write();
  },

  _notify(text, color) {
    const el = document.getElementById('job-notify');
    if (!el) return;
    el.textContent = text;
    el.style.color  = color || '#ffffff';
    el.style.display = 'block';
    clearTimeout(this._notifyTO);
    this._notifyTO = setTimeout(() => { el.style.display = 'none'; }, 5000);
  },
};
