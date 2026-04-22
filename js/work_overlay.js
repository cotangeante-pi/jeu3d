// Mini-jeux immersifs pour tous les métiers hors Boulanger et Coach
const WorkOverlay = {
  _JOBS: {
    chef: {
      title: '👨‍🍳 Cuisine',
      color: '#e67e22',
      payFactor: 0.40,
      rounds: [
        { icon: '🥦', label: 'Couper les légumes',       action: 'multi', count: 4   },
        { icon: '🥩', label: 'Saisir la viande',         action: 'hold',  duration: 3 },
        { icon: '🍲', label: 'Préparer la sauce',        action: 'multi', count: 3   },
        { icon: '🧂', label: 'Assaisonner',              action: 'click'              },
        { icon: '🍽', label: "Dresser l'assiette",       action: 'click'              },
      ],
    },
    consultant: {
      title: '💼 Comptabilité',
      color: '#2980b9',
      payFactor: 0.35,
      rounds: [
        { icon: '📂', label: 'Ouvrir le dossier',        action: 'click'              },
        { icon: '📊', label: 'Analyser les données',     action: 'wait',  duration: 3 },
        { icon: '✏️',  label: 'Rédiger le rapport',      action: 'hold',  duration: 4 },
        { icon: '✅', label: 'Valider et signer',         action: 'click'              },
      ],
    },
    banker: {
      title: '🏦 Opérations bancaires',
      color: '#27ae60',
      payFactor: 0.45,
      rounds: [
        { icon: '💰', label: 'Vérifier les comptes',     action: 'hold',  duration: 3 },
        { icon: '📋', label: 'Analyser la demande',      action: 'wait',  duration: 2 },
        { icon: '✅', label: 'Valider le virement',       action: 'click'              },
        { icon: '🗂', label: 'Archiver le dossier',      action: 'click'              },
      ],
    },
    security: {
      title: '🛡 Surveillance',
      color: '#8e44ad',
      payFactor: 0.35,
      rounds: [
        { icon: '📺', label: 'Surveiller les moniteurs', action: 'wait',  duration: 4 },
        { icon: '🚨', label: 'Alerte ! Intervenir vite', action: 'click'              },
        { icon: '📝', label: 'Rédiger le rapport',       action: 'hold',  duration: 2 },
      ],
    },
    cashier: {
      title: '🛒 Caisse',
      color: '#e74c3c',
      payFactor: 0.30,
      rounds: [
        { icon: '🛒', label: 'Scanner les articles (×6)', action: 'multi', count: 6  },
        { icon: '💳', label: 'Encaisser le paiement',     action: 'click'             },
        { icon: '🧾', label: 'Imprimer le ticket',        action: 'click'             },
      ],
    },
    doctor: {
      title: '🩺 Consultation médicale',
      color: '#16a085',
      payFactor: 0.50,
      rounds: [
        { icon: '👤', label: 'Appeler le patient',        action: 'click'              },
        { icon: '🩺', label: 'Examiner le patient',       action: 'hold',  duration: 3 },
        { icon: '📋', label: 'Analyser les symptômes',    action: 'wait',  duration: 2 },
        { icon: '💊', label: 'Prescrire le traitement',   action: 'click'              },
        { icon: '✅', label: 'Valider la consultation',    action: 'click'              },
      ],
    },
    nurse: {
      title: '💉 Soins infirmiers',
      color: '#2980b9',
      payFactor: 0.40,
      rounds: [
        { icon: '🌡', label: 'Prendre la température',   action: 'hold',  duration: 2 },
        { icon: '❤️',  label: 'Mesurer la tension',       action: 'wait',  duration: 2 },
        { icon: '💉', label: 'Administrer le médicament', action: 'click'              },
        { icon: '📋', label: 'Mettre à jour le dossier', action: 'click'              },
      ],
    },
    worker: {
      title: '🔨 Atelier',
      color: '#7f8c8d',
      payFactor: 0.30,
      rounds: [
        { icon: '⚙️',  label: 'Prendre la pièce',        action: 'click'              },
        { icon: '🔩', label: 'Assembler',                 action: 'hold',  duration: 3 },
        { icon: '🔍', label: 'Contrôle qualité',          action: 'wait',  duration: 2 },
        { icon: '📦', label: 'Emballer (×3)',              action: 'multi', count: 3   },
      ],
    },
  },

  _jobId:     null,
  _current:   0,
  _progress:  0,
  _holding:   false,
  _multiCount: 0,
  _el:        null,

  _build() {
    if (document.getElementById('work-overlay')) return;
    const el = document.createElement('div');
    el.id = 'work-overlay';
    el.style.cssText = [
      'display:none', 'position:fixed', 'inset:0',
      'background:rgba(0,0,0,0.88)',
      'justify-content:center', 'align-items:center', 'z-index:200',
    ].join(';');
    el.innerHTML = `
      <div id="wo-box" style="
        background:#1a1a2e;border:2px solid #4a4a6a;border-radius:16px;
        padding:24px;min-width:340px;max-width:480px;text-align:center;
        font-family:Arial,sans-serif;
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h2 id="wo-title" style="color:#fff;margin:0;font-size:1.25em"></h2>
          <button id="wo-exit" style="
            background:#2c2c44;color:#ccc;border:1px solid #555;
            padding:6px 14px;border-radius:8px;cursor:pointer;font-size:0.9em;
          ">T — Partir</button>
        </div>
        <div id="wo-icon"  style="font-size:3.5em;margin:8px 0;line-height:1"></div>
        <div id="wo-label" style="color:#ddd;margin:8px 0;font-size:1.1em;min-height:1.5em"></div>
        <div style="background:#2c3e50;border-radius:8px;height:16px;margin:12px 0;overflow:hidden">
          <div id="wo-fill" style="height:100%;width:0%;border-radius:8px;transition:width 0.1s"></div>
        </div>
        <button id="wo-btn" style="
          background:#2980b9;color:#fff;border:none;
          padding:12px 28px;border-radius:8px;font-size:1.1em;cursor:pointer;
          display:none;
        ">Faire ça !</button>
        <div id="wo-dots" style="display:flex;justify-content:center;gap:8px;margin-top:16px"></div>
        <div id="wo-earned" style="color:#88ff88;margin-top:10px;font-size:0.9em;min-height:1.2em"></div>
      </div>
    `;
    document.body.appendChild(el);
    this._el = el;
    document.getElementById('wo-exit').addEventListener('click', () => WorkOverlay.exit());
    document.getElementById('wo-exit').addEventListener('touchstart', e => { e.preventDefault(); WorkOverlay.exit(); }, { passive: false });
  },

  enter(jobId) {
    const cfg = this._JOBS[jobId];
    if (!cfg || State.inWorkMode) return;
    this._build();
    State.inWorkMode = true;
    this._jobId      = jobId;
    this._current    = 0;
    this._progress   = 0;
    this._holding    = false;
    this._multiCount = 0;

    document.getElementById('wo-title').textContent  = cfg.title;
    document.getElementById('wo-fill').style.background = cfg.color;
    document.getElementById('wo-earned').textContent = '';
    this._el.style.display = 'flex';
    this._buildDots(cfg);
    this._renderStep();
  },

  exit() {
    if (!State.inWorkMode) return;
    State.inWorkMode = false;
    if (this._el) this._el.style.display = 'none';
    Jobs._notify('Tu as quitté ton poste.', '#ffaa44');
  },

  tick(delta) {
    if (!State.inWorkMode || !this._jobId) return;
    const cfg  = this._JOBS[this._jobId];
    if (!cfg) return;
    const step = cfg.rounds[this._current];

    if (step.action === 'hold' && this._holding) {
      this._progress += delta;
      document.getElementById('wo-fill').style.width = Math.min(100, this._progress / step.duration * 100) + '%';
      if (this._progress >= step.duration) {
        this._holding  = false;
        this._progress = 0;
        this._advance(cfg);
      }
    } else if (step.action === 'wait') {
      this._progress += delta;
      document.getElementById('wo-fill').style.width = Math.min(100, this._progress / step.duration * 100) + '%';
      if (this._progress >= step.duration) {
        this._progress = 0;
        this._advance(cfg);
      }
    }
  },

  _buildDots(cfg) {
    const container = document.getElementById('wo-dots');
    container.innerHTML = '';
    cfg.rounds.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'bk-dot' + (i === 0 ? ' active' : '');
      container.appendChild(d);
    });
  },

  _renderStep() {
    const cfg  = this._JOBS[this._jobId];
    const step = cfg.rounds[this._current];
    document.getElementById('wo-icon').textContent  = step.icon;
    document.getElementById('wo-label').textContent = step.label;
    document.getElementById('wo-fill').style.width  = '0%';

    const btn = document.getElementById('wo-btn');
    if (step.action === 'click') {
      btn.style.display = 'block';
      btn.textContent   = 'Faire ça !';
      const h = (e) => { e.preventDefault(); this._advance(cfg); };
      btn.onmousedown  = h;
      btn.ontouchstart = h;
      btn.onmouseup = btn.ontouchend = btn.onmouseleave = null;
    } else if (step.action === 'multi') {
      btn.style.display = 'block';
      this._multiCount  = 0;
      btn.textContent   = `0 / ${step.count}`;
      const h = (e) => {
        e.preventDefault();
        this._multiCount++;
        btn.textContent = `${this._multiCount} / ${step.count}`;
        document.getElementById('wo-fill').style.width =
          Math.min(100, this._multiCount / step.count * 100) + '%';
        if (this._multiCount >= step.count) this._advance(cfg);
      };
      btn.onmousedown  = h;
      btn.ontouchstart = h;
      btn.onmouseup = btn.ontouchend = btn.onmouseleave = null;
    } else if (step.action === 'hold') {
      btn.style.display = 'block';
      btn.textContent   = 'Maintenir appuyé…';
      const start = (e) => { e.preventDefault(); this._holding = true; };
      const stop  = (e) => {
        e.preventDefault();
        this._holding  = false;
        this._progress = 0;
        document.getElementById('wo-fill').style.width = '0%';
      };
      btn.onmousedown = btn.ontouchstart = start;
      btn.onmouseup = btn.ontouchend = btn.onmouseleave = stop;
    } else {
      btn.style.display = 'none';
    }

    // Dots
    const dots = document.querySelectorAll('#wo-dots .bk-dot');
    dots.forEach((d, i) => {
      d.className = 'bk-dot' +
        (i < this._current ? ' done' : i === this._current ? ' active' : '');
    });
  },

  _advance(cfg) {
    this._current++;
    this._progress   = 0;
    this._multiCount = 0;
    if (this._current >= cfg.rounds.length) {
      this._complete(cfg);
    } else {
      this._renderStep();
    }
  },

  _complete(cfg) {
    const pay = Math.round(State.currentJob.salary * cfg.payFactor);
    Jobs.earnFromWork(pay);

    document.getElementById('wo-icon').textContent  = '✅';
    document.getElementById('wo-label').textContent = `Cycle terminé ! +${pay}$`;
    document.getElementById('wo-btn').style.display = 'none';
    document.getElementById('wo-fill').style.width  = '100%';
    document.getElementById('wo-earned').textContent = 'Appuie sur T pour partir, ou attends pour un nouveau cycle…';

    // Nouveau cycle après 2s
    setTimeout(() => {
      if (!State.inWorkMode || this._jobId === null) return;
      this._current    = 0;
      this._progress   = 0;
      this._buildDots(cfg);
      this._renderStep();
      document.getElementById('wo-earned').textContent = '';
    }, 2000);
  },
};
