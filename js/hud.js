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

    // Hint interaction (NPC ou objet à ramasser)
    const hint = document.getElementById('interact-hint');
    if (State.nearNPC) {
      hint.style.display = 'block';
      hint.textContent = 'E — ' + State.nearNPC.name;
    } else if (State.nearPickup) {
      hint.style.display = 'block';
      hint.textContent = 'Clic droit — Ramasser ' + State.nearPickup.name;
    } else {
      hint.style.display = 'none';
    }
  },

  _badgeName(id) {
    const names = {
      baker:            '🍞 Boulanger',
      consultant:       '💼 Consultant',
      worker:           '🔨 Ouvrier',
      nurse:            '💉 Infirmier',
      health_insurance: '🏥 Assurance maladie',
    };
    return names[id] || id;
  }
};
