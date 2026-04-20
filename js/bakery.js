const Bakery = {
  _steps: [
    { icon: '🌾', label: 'Prendre la farine',      action: 'click'            },
    { icon: '💧', label: "Ajouter de l'eau",        action: 'click'            },
    { icon: '🤲', label: 'Pétrir la pâte',          action: 'hold', duration: 2.5 },
    { icon: '🍞', label: 'Façonner le pain',        action: 'click'            },
    { icon: '🔥', label: 'Mettre au four',           action: 'click'            },
    { icon: '⏳', label: 'Cuisson en cours…',       action: 'wait', duration: 5   },
    { icon: '🥖', label: 'Sortir le pain chaud !',  action: 'click'            },
  ],

  _current: 0,
  _progress: 0,
  _holding: false,

  enter() {
    if (State.inWorkMode) return;
    State.inWorkMode = true;
    this._current = 0;
    this._progress = 0;
    this._holding = false;
    document.getElementById('bakery-overlay').style.display = 'flex';
    this._renderStep();
  },

  exit() {
    if (!State.inWorkMode) return;
    State.inWorkMode = false;
    document.getElementById('bakery-overlay').style.display = 'none';
    Jobs._notify('Tu as quitté la boulangerie.', '#ffaa44');
  },

  tick(delta) {
    if (!State.inWorkMode) return;
    if (this._current >= this._steps.length) return;
    const step = this._steps[this._current];
    const fill = document.getElementById('bk-fill');

    if (step.action === 'hold' && this._holding) {
      this._progress += delta;
      fill.style.width = Math.min(100, this._progress / step.duration * 100) + '%';
      if (this._progress >= step.duration) {
        this._holding = false;
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
    if (this._current >= this._steps.length) return;
    const step = this._steps[this._current];
    document.getElementById('bk-icon').textContent = step.icon;
    document.getElementById('bk-label').textContent = step.label;
    document.getElementById('bk-fill').style.width = '0%';

    const btn = document.getElementById('bk-action-btn');
    if (step.action === 'click') {
      btn.style.display = 'block';
      btn.textContent = 'Faire ça !';
      const h = (e) => { e.preventDefault(); this._doStep(); };
      btn.onmousedown = h;
      btn.ontouchstart = h;
      btn.onmouseup = null;
      btn.ontouchend = null;
      btn.onmouseleave = null;
    } else if (step.action === 'hold') {
      btn.style.display = 'block';
      btn.textContent = 'Maintenir appuyé…';
      const start = (e) => { e.preventDefault(); this._holding = true; };
      const stop  = (e) => {
        e.preventDefault();
        this._holding = false;
        this._progress = 0;
        document.getElementById('bk-fill').style.width = '0%';
      };
      btn.onmousedown = start;
      btn.ontouchstart = start;
      btn.onmouseup = stop;
      btn.ontouchend = stop;
      btn.onmouseleave = stop;
    } else {
      btn.style.display = 'none';
      btn.onmousedown = null;
      btn.ontouchstart = null;
      btn.onmouseup = null;
      btn.ontouchend = null;
    }

    document.querySelectorAll('.bk-dot').forEach((d, i) => {
      d.className = 'bk-dot' + (i < this._current ? ' done' : i === this._current ? ' active' : '');
    });
  },

  _doStep() {
    if (this._steps[this._current].action === 'click') this._advance();
  },

  _advance() {
    this._current++;
    this._progress = 0;
    if (this._current >= this._steps.length) {
      this._complete();
    } else {
      this._renderStep();
    }
  },

  _complete() {
    document.getElementById('bk-icon').textContent = '🎉';
    document.getElementById('bk-label').textContent = 'Pain prêt ! Excellent travail !';
    document.getElementById('bk-action-btn').style.display = 'none';
    document.getElementById('bk-fill').style.width = '100%';
    document.querySelectorAll('.bk-dot').forEach(d => { d.className = 'bk-dot done'; });
    Jobs._completeTask();
    setTimeout(() => this.exit(), 2000);
  },
};
