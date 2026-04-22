const Tutorial = {
  _steps: [
    {
      icon: '🏙️',
      title: 'Bienvenue en ville !',
      desc: 'Explore la ville, trouve un emploi, achète de la nourriture et survis le plus longtemps possible !',
      keys: []
    },
    {
      icon: '🚶',
      title: 'Se déplacer',
      desc: 'Utilise le clavier pour te déplacer dans la ville.',
      keys: [
        { key: 'W', label: 'Avancer' },
        { key: 'S', label: 'Reculer' },
        { key: 'A', label: 'Gauche' },
        { key: 'D', label: 'Droite' },
        { key: '⎵', label: 'Sauter' },
        { key: 'Shift', label: 'Sprint' },
      ]
    },
    {
      icon: '🖱️',
      title: 'Caméra',
      desc: 'Clique sur le jeu pour capturer la souris, puis déplace-la pour regarder autour de toi. Appuie sur Échap pour libérer.',
      keys: []
    },
    {
      icon: '💬',
      title: 'Interagir',
      desc: 'Approche-toi d\'un personnage ou d\'un bâtiment pour interagir. Le bouton E ramasse aussi les objets au sol.',
      keys: [
        { key: 'E', label: 'Interagir / Ramasser' },
      ]
    },
    {
      icon: '👊',
      title: 'Combat & nourriture',
      desc: 'Clique gauche pour frapper. Clique droit pour manger un objet de ton inventaire ou ramasser de la nourriture.',
      keys: [
        { key: '🖱️ Gauche', label: 'Frapper' },
        { key: '🖱️ Droit', label: 'Manger / Ramasser' },
      ]
    },
    {
      icon: '🚗',
      title: 'Voiture',
      desc: 'Achète une voiture chez le concessionnaire, approche-toi et appuie sur F pour entrer ou sortir.',
      keys: [
        { key: 'F', label: 'Entrer / Sortir' },
      ]
    },
  ],

  _step: 0,

  init() {
    document.getElementById('tutorial-next').addEventListener('click', () => this.next());
    document.getElementById('tutorial-skip').addEventListener('click', () => this.skip());
  },

  show() {
    this._step = 0;
    State.paused = true;
    State.inTutorial = true;
    this._render();
    document.getElementById('tutorial-overlay').style.display = 'flex';
  },

  _render() {
    const s = this._steps[this._step];
    document.getElementById('tutorial-icon').textContent = s.icon;
    document.getElementById('tutorial-title').textContent = s.title;
    document.getElementById('tutorial-desc').textContent = s.desc;
    document.getElementById('tutorial-progress').textContent = `${this._step + 1} / ${this._steps.length}`;
    document.getElementById('tutorial-next').textContent =
      this._step === this._steps.length - 1 ? 'Jouer !' : 'Suivant →';

    const keysEl = document.getElementById('tutorial-keys');
    keysEl.innerHTML = '';
    (s.keys || []).forEach(k => {
      const chip = document.createElement('div');
      chip.className = 'tut-key';
      chip.innerHTML = `<span class="tut-key-badge">${k.key}</span><span class="tut-key-label">${k.label}</span>`;
      keysEl.appendChild(chip);
    });
  },

  next() {
    this._step++;
    if (this._step >= this._steps.length) {
      this._close();
    } else {
      this._render();
    }
  },

  skip() {
    this._close();
  },

  _close() {
    document.getElementById('tutorial-overlay').style.display = 'none';
    State.inTutorial = false;
    State.paused = false;
  },
};
