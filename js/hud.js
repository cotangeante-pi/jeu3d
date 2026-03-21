const HUD = {
  _lastBadges: '',

  init() {
    this.update();
  },

  update() {
    // Argent
    document.getElementById('money-display').textContent = '$ ' + Math.floor(State.money);

    // QI
    document.getElementById('iq-display').textContent = 'QI : ' + Math.floor(State.iq);

    // Barre de vie
    document.getElementById('bar-health').style.width = Math.max(0, State.health) + '%';

    // Barre de nourriture
    document.getElementById('bar-hunger').style.width = Math.max(0, State.hunger) + '%';

    // Cercles d'oxygène
    for (let i = 0; i < 5; i++) {
      const dot = document.getElementById('oxy-' + i);
      if (!dot) continue;
      const filled = (i + 1) <= State.oxygen;
      dot.classList.toggle('full', filled);
      dot.classList.toggle('empty', !filled);
    }

    // Badges (re-render seulement si changement)
    const badgeStr = State.badges.join(',');
    if (badgeStr !== this._lastBadges) {
      this._lastBadges = badgeStr;
      const container = document.getElementById('badges-container');
      container.innerHTML = '';
      State.badges.forEach(b => {
        const el = document.createElement('span');
        el.className = 'badge';
        el.textContent = this._badgeName(b);
        container.appendChild(el);
      });
    }

    // Hint interaction (NPC, voiture, objet)
    const hint = document.getElementById('interact-hint');
    if (State.inCar) {
      const spd = Math.round(Math.hypot(State.velX, State.velZ) * 3.6);
      const boosting = State.keys && (State.keys['ShiftLeft'] || State.keys['ShiftRight']);
      hint.style.display = 'block';
      hint.textContent = `F — Sortir  |  ${spd} km/h${boosting ? '  🔥 BOOST' : '  [Shift=Boost]'}`;
    } else if (State.nearNPC) {
      hint.style.display = 'block';
      hint.textContent = 'E — ' + State.nearNPC.name;
    } else if (State.nearCar) {
      hint.style.display = 'block';
      const owned = State.badges.includes(State.nearCar.badgeId);
      hint.textContent = owned
        ? 'F — Conduire la ' + State.nearCar.name
        : State.nearCar.name + ' — non possédée';
    } else if (State.nearPickup) {
      hint.style.display = 'block';
      hint.textContent = 'Clic droit — Ramasser ' + State.nearPickup.name;
    } else {
      hint.style.display = 'none';
    }

    // Panneau tâche de travail
    this.updateJobTask();

    // Étoiles wanted
    const wantedEl = document.getElementById('wanted-stars');
    if (wantedEl) {
      wantedEl.textContent = '★'.repeat(State.wanted) + '☆'.repeat(3 - State.wanted);
      wantedEl.style.display = State.wanted > 0 ? 'block' : 'none';
    }

    this.updateHotbar();
  },

  updateJobTask() {
    const panel = document.getElementById('job-task-panel');
    if (!panel) return;

    const task = State.jobTask;
    if (!task || task.phase !== 'active') {
      panel.style.display = 'none';
      const htBar = document.getElementById('hold-t-bar');
      if (htBar) htBar.style.display = 'none';
      return;
    }

    panel.style.display = 'block';
    const timeLeft = Math.max(0, Math.ceil(task.timeLimit - task.elapsed));

    if (task.type === 'fetch_apples') {
      let apples = 0;
      State.inventory.forEach(s => { if (s && s.name === 'Pomme') apples += s.count; });
      document.getElementById('jt-title').textContent = '🍎 Mission Boulangerie';
      document.getElementById('jt-desc').textContent =
        `Rapporter ${task.required} pommes — en stock : ${apples}/${task.required}`;
      document.getElementById('jt-time').textContent = `⏱ ${timeLeft}s`;
      const bar = document.getElementById('jt-bar-fill');
      bar.style.width = Math.min(100, (apples / task.required) * 100) + '%';
      bar.style.background = '#e67e22';

    } else if (task.type === 'presence') {
      const zone = Jobs._ZONES[State.currentJob ? State.currentJob.id : ''] || {};
      const inZone = State.posX >= (zone.xMin||0) && State.posX <= (zone.xMax||0) &&
                     State.posZ >= (zone.zMin||0) && State.posZ <= (zone.zMax||0);
      document.getElementById('jt-title').textContent = '🏢 Mission Présence';
      document.getElementById('jt-desc').textContent = inZone
        ? `Au poste — Reste ici (${Math.floor(task.held)}/${task.required}s)`
        : '⚠ Rejoins ton poste de travail !';
      document.getElementById('jt-time').textContent = `⏱ ${timeLeft}s`;
      const bar = document.getElementById('jt-bar-fill');
      bar.style.width = Math.min(100, (task.held / task.required) * 100) + '%';
      bar.style.background = inZone ? '#2980b9' : '#c0392b';

    } else if (task.type === 'hold_t') {
      const zone = Jobs._ZONES.consultant;
      const inZone = State.posX >= zone.xMin && State.posX <= zone.xMax &&
                     State.posZ >= zone.zMin && State.posZ <= zone.zMax;

      if (task.phase === 'travel') {
        const remaining = Math.max(0, task.travelLimit - task.travelElapsed);
        document.getElementById('jt-title').textContent = '💼 Mission Comptable';
        document.getElementById('jt-desc').textContent = '⚠ Rejoignez le bureau !';
        document.getElementById('jt-time').textContent = `⏱ ${Math.ceil(remaining)}s`;
        const bar = document.getElementById('jt-bar-fill');
        bar.style.width = Math.min(100, (remaining / task.travelLimit) * 100) + '%';
        bar.style.background = remaining < 15 ? '#c0392b' : '#e67e22';
        this._updateCentralBar('travel', task);
      } else {
        const holding = inZone && State.keys && State.keys['KeyT'];
        document.getElementById('jt-title').textContent = '💼 Mission Comptable';
        document.getElementById('jt-desc').textContent = inZone
          ? (holding ? 'Maintenez T…' : 'Dans le bureau — Maintenez T')
          : '⚠ Sortie interdite !';
        document.getElementById('jt-time').textContent = `⏱ ${timeLeft}s`;
        const bar = document.getElementById('jt-bar-fill');
        bar.style.width = Math.min(100, (task.held / task.required) * 100) + '%';
        bar.style.background = inZone ? '#2980b9' : '#c0392b';
        this._updateCentralBar('active', task, inZone, holding);
      }
    }
  },

  _updateCentralBar(phase, task, inZone, holding) {
    const bar = document.getElementById('hold-t-bar');
    if (!bar) return;
    bar.style.display = 'block';

    const fill  = document.getElementById('hold-t-fill');
    const label = document.getElementById('hold-t-label');
    const pctEl = document.getElementById('hold-t-pct');

    if (phase === 'travel') {
      const remaining = Math.max(0, task.travelLimit - task.travelElapsed);
      const pct = (remaining / task.travelLimit) * 100;
      fill.style.width      = pct + '%';
      fill.style.background = remaining < 15
        ? 'linear-gradient(90deg, #922b21, #e74c3c)'
        : 'linear-gradient(90deg, #935116, #f39c12)';
      fill.classList.remove('active');
      label.textContent = '⚠  Rejoignez le bureau !';
      pctEl.textContent = Math.ceil(remaining) + 's restantes';
    } else {
      const pct = Math.min(100, Math.round((task.held / task.required) * 100));
      fill.style.width      = pct + '%';
      fill.style.background = 'linear-gradient(90deg, #1a6fa8, #4fc3f7)';
      fill.classList.toggle('active', !!holding);
      label.textContent = holding
        ? 'Traitement du dossier…'
        : (inZone ? 'Dans le bureau — Maintenez T' : '⚠  Sortie du bureau interdite !');
      pctEl.textContent = pct + ' %';
    }
  },

  updateHotbar() {
    for (let i = 0; i < 8; i++) {
      const slot = document.getElementById('hb-' + i);
      if (!slot) continue;
      const item = State.inventory[i];
      const icon = slot.querySelector('.hb-icon');
      const count = slot.querySelector('.hb-count');

      if (item) {
        icon.style.background = item.color;
        count.textContent = item.count > 1 ? item.count : '';
        slot.title = item.name;
      } else {
        icon.style.background = 'transparent';
        count.textContent = '';
        slot.title = '';
      }

      slot.classList.toggle('selected', i === State.selectedSlot);
    }
  },

  _badgeName(id) {
    const names = {
      baker:            '🍞 Boulanger',
      consultant:       '💼 Comptable',
      worker:           '🔨 Ouvrier',
      nurse:            '💉 Infirmier',
      security:         '🛡 Agent de sécurité',
      chef:             '👨‍🍳 Cuisinier',
      doctor:           '🩺 Médecin',
      banker:           '🏦 Banquier',
      cashier:          '🛒 Caissier',
      coach:            '💪 Coach sportif',
      health_insurance: '🏥 Assurance maladie',
      car_basic:        '🚗 Citadine',
      car_sedan:        '🚙 Berline',
      car_sport:        '🏎 Voiture sport',
    };
    return names[id] || id;
  }
};
