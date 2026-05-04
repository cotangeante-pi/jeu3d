const Tutorial = {
  _steps: [
    {
      icon: '🏙️',
      title: 'Bienvenue en ville !',
      desc: 'Explore la ville, trouve un emploi, achète de la nourriture et survis le plus longtemps possible !',
    },
    {
      icon: '🕹️',
      title: 'Se déplacer',
      desc: 'Joystick en bas à gauche pour marcher. Bouton ↑ pour sauter, bouton 🔥 pour sprinter.',
    },
    {
      icon: '👆',
      title: 'Regarder',
      desc: 'Glisse ton doigt sur la partie droite de l\'écran pour tourner la caméra.',
    },
    {
      icon: '💬',
      title: 'Interagir',
      desc: 'Approche-toi d\'un personnage ou d\'un bâtiment et appuie sur le bouton E. Le même bouton ramasse aussi les objets au sol.',
    },
    {
      icon: '👊',
      title: 'Combat',
      desc: 'Appuie sur le bouton 👊 pour frapper. Approche-toi de nourriture et appuie sur E pour la ramasser.',
    },
    {
      icon: '🚗',
      title: 'Voiture',
      desc: 'Achète une voiture chez le concessionnaire, approche-toi et appuie sur le bouton 🚗 pour entrer ou sortir.',
    },
  ],

  _step: 0,

  init() {
    const next = document.getElementById('tutorial-next');
    const skip = document.getElementById('tutorial-skip');
    next.addEventListener('click', () => this.next());
    next.addEventListener('touchstart', e => { e.preventDefault(); this.next(); }, { passive: false });
    skip.addEventListener('click', () => this.skip());
    skip.addEventListener('touchstart', e => { e.preventDefault(); this.skip(); }, { passive: false });
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
