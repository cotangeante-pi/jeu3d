const Bakery = {
  // Recettes disponibles (inspiré de Vortelli's Pizza : commandes variées, satisfaisantes)
  _RECIPES: [
    {
      name: 'Pain',
      icon: '🍞',
      payFactor: 0.35,
      steps: [
        { icon: '🌾', label: 'Prendre la farine',       action: 'click'              },
        { icon: '💧', label: "Ajouter de l'eau",         action: 'click'              },
        { icon: '🤲', label: 'Pétrir la pâte',           action: 'hold', duration: 2.5 },
        { icon: '🍞', label: 'Façonner le pain',         action: 'click'              },
        { icon: '🔥', label: 'Enfourner',                 action: 'click'              },
        { icon: '⏳', label: 'Cuisson en cours…',        action: 'wait', duration: 4   },
        { icon: '🥖', label: 'Sortir le pain !',         action: 'click'              },
      ],
    },
    {
      name: 'Croissant',
      icon: '🥐',
      payFactor: 0.28,
      steps: [
        { icon: '🧈', label: 'Prendre le beurre',        action: 'click'              },
        { icon: '🌾', label: 'Mélanger la farine',       action: 'click'              },
        { icon: '🤲', label: 'Travailler la pâte',       action: 'hold', duration: 2   },
        { icon: '🥐', label: 'Former le croissant',      action: 'click'              },
        { icon: '⏳', label: 'Cuisson…',                  action: 'wait', duration: 3   },
        { icon: '✨', label: 'Dorer et servir !',         action: 'click'              },
      ],
    },
    {
      name: 'Gâteau',
      icon: '🎂',
      payFactor: 0.50,
      steps: [
        { icon: '🥚', label: 'Casser les œufs (×3)',    action: 'multi', count: 3     },
        { icon: '🍬', label: 'Ajouter le sucre',         action: 'click'              },
        { icon: '🤲', label: 'Battre la préparation',    action: 'hold', duration: 3   },
        { icon: '🎂', label: 'Verser dans le moule',     action: 'click'              },
        { icon: '⏳', label: 'Cuisson…',                  action: 'wait', duration: 5   },
        { icon: '🍰', label: 'Décorer et servir !',      action: 'click'              },
      ],
    },
    {
      name: 'Baguette',
      icon: '🥖',
      payFactor: 0.32,
      steps: [
        { icon: '🌾', label: 'Préparer la pâte',         action: 'click'              },
        { icon: '🤲', label: 'Façonner la baguette',     action: 'hold', duration: 2   },
        { icon: '✂️',  label: 'Grigner (×4)',             action: 'multi', count: 4     },
        { icon: '⏳', label: 'Cuisson…',                  action: 'wait', duration: 3.5 },
        { icon: '🥖', label: 'Livrer la baguette !',     action: 'click'              },
      ],
    },
  ],

  _orders:    [],    // liste des commandes du shift
  _orderIdx:  0,     // commande actuelle
  _current:   0,     // étape actuelle dans la commande
  _progress:  0,
  _holding:   false,
  _multiCount: 0,
  _earned:    0,

  enter() {
    if (State.inWorkMode) return;
    State.inWorkMode = true;

    // Générer 4 commandes aléatoires pour le shift
    this._orders    = [];
    for (let i = 0; i < 4; i++) {
      this._orders.push(this._RECIPES[Math.floor(Math.random() * this._RECIPES.length)]);
    }
    this._orderIdx  = 0;
    this._current   = 0;
    this._progress  = 0;
    this._holding   = false;
    this._multiCount = 0;
    this._earned    = 0;

    document.getElementById('bakery-overlay').style.display = 'flex';
    this._renderStep();
  },

  exit() {
    if (!State.inWorkMode) return;
    State.inWorkMode = false;
    document.getElementById('bakery-overlay').style.display = 'none';
    if (this._earned > 0) {
      Jobs._notify(`Service terminé : +${this._earned}$`, '#88ff88');
    } else {
      Jobs._notify('Tu as quitté la boulangerie.', '#ffaa44');
    }
  },

  tick(delta) {
    if (!State.inWorkMode) return;
    if (this._orderIdx >= this._orders.length) return;
    const step = this._orders[this._orderIdx].steps[this._current];
    const fill = document.getElementById('bk-fill');

    if (step.action === 'hold' && this._holding) {
      this._progress += delta;
      fill.style.width = Math.min(100, this._progress / step.duration * 100) + '%';
      if (this._progress >= step.duration) {
        this._holding  = false;
        this._progress = 0;
        this._advance();
      }
    } else if (step.action === 'wait') {
      this._progress += delta;
      fill.style.width = Math.min(100, this._progress / step.duration * 100) + '%';
      if (this._progress >= step.duration) {
        this._progress = 0;
        this._advance();
      }
    }
  },

  _renderStep() {
    if (this._orderIdx >= this._orders.length) return;
    const recipe = this._orders[this._orderIdx];
    const step   = recipe.steps[this._current];

    // Titre avec numéro de commande
    const h2 = document.querySelector('#bk-header h2');
    if (h2) h2.textContent = `🏪 ${recipe.icon} Commande ${this._orderIdx + 1} / ${this._orders.length} — ${recipe.name}`;

    document.getElementById('bk-icon').textContent  = step.icon;
    document.getElementById('bk-label').textContent = step.label;
    document.getElementById('bk-fill').style.width  = '0%';

    const btn = document.getElementById('bk-action-btn');
    if (step.action === 'click') {
      btn.style.display = 'block';
      btn.textContent   = 'Faire ça !';
      const h = (e) => { e.preventDefault(); this._doStep(); };
      btn.onmousedown  = h;
      btn.ontouchstart = h;
      btn.onmouseup    = null;
      btn.ontouchend   = null;
      btn.onmouseleave = null;
    } else if (step.action === 'multi') {
      btn.style.display = 'block';
      this._multiCount  = 0;
      btn.textContent   = `0 / ${step.count}`;
      const h = (e) => {
        e.preventDefault();
        this._multiCount++;
        btn.textContent = `${this._multiCount} / ${step.count}`;
        document.getElementById('bk-fill').style.width = Math.min(100, this._multiCount / step.count * 100) + '%';
        if (this._multiCount >= step.count) this._advance();
      };
      btn.onmousedown  = h;
      btn.ontouchstart = h;
      btn.onmouseup    = null;
      btn.ontouchend   = null;
      btn.onmouseleave = null;
    } else if (step.action === 'hold') {
      btn.style.display = 'block';
      btn.textContent   = 'Maintenir appuyé…';
      const start = (e) => { e.preventDefault(); this._holding = true; };
      const stop  = (e) => {
        e.preventDefault();
        this._holding  = false;
        this._progress = 0;
        document.getElementById('bk-fill').style.width = '0%';
      };
      btn.onmousedown  = start;
      btn.ontouchstart = start;
      btn.onmouseup    = stop;
      btn.ontouchend   = stop;
      btn.onmouseleave = stop;
    } else {
      btn.style.display = 'none';
    }

    // Indicateurs de progression (dots)
    document.querySelectorAll('.bk-dot').forEach((d, i) => {
      d.className = 'bk-dot' +
        (i < this._current ? ' done' : i === this._current ? ' active' : '');
    });
  },

  _doStep() {
    if (this._orders[this._orderIdx].steps[this._current].action === 'click') this._advance();
  },

  _advance() {
    this._current++;
    this._progress   = 0;
    this._multiCount = 0;
    const recipe = this._orders[this._orderIdx];
    if (this._current >= recipe.steps.length) {
      this._completeOrder();
    } else {
      this._renderStep();
    }
  },

  _completeOrder() {
    const recipe = this._orders[this._orderIdx];
    const pay    = Math.round(State.currentJob.salary * recipe.payFactor);
    this._earned += pay;
    Jobs.earnFromWork(pay);

    document.getElementById('bk-icon').textContent  = '🎉';
    document.getElementById('bk-label').textContent = `${recipe.name} livré ! +${pay}$`;
    document.getElementById('bk-action-btn').style.display = 'none';
    document.getElementById('bk-fill').style.width  = '100%';
    document.querySelectorAll('.bk-dot').forEach(d => { d.className = 'bk-dot done'; });

    this._orderIdx++;
    if (this._orderIdx >= this._orders.length) {
      setTimeout(() => {
        document.getElementById('bk-icon').textContent  = '🏆';
        document.getElementById('bk-label').textContent = `Service terminé ! Tu peux partir (T).`;
      }, 1500);
    } else {
      setTimeout(() => {
        if (!State.inWorkMode) return;
        this._current    = 0;
        this._progress   = 0;
        this._multiCount = 0;
        this._renderStep();
      }, 1800);
    }
  },
};
