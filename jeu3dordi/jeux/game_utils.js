/* game_utils.js — shared utility for board games: levels, tutorials, online multiplayer */
const GameUtils = (() => {
  // ── Level system ──────────────────────────────────────────────────────────
  const RANDOM_CHANCE = [0, 0.95, 0.80, 0.65, 0.45, 0.25, 0.10, 0, 0, 0, 0];
  const DEPTH_TABLE   = [0, 1,    1,    1,    2,    2,    2,    2, 3, 6, 9999];
  let _level = 7;

  function getLevel() { return _level; }
  function shouldRandomize() { return Math.random() < RANDOM_CHANCE[_level]; }
  function getDepth() { return DEPTH_TABLE[_level]; }

  function createLevelSelector(container, onChange) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;align-items:center;gap:4px;flex-wrap:wrap;';
    const lbl = document.createElement('span');
    lbl.textContent = 'Niveau :';
    lbl.style.cssText = 'font-size:0.78em;color:#888;white-space:nowrap;';
    wrap.appendChild(lbl);
    const btns = [];
    for (let i = 1; i <= 10; i++) {
      const b = document.createElement('button');
      b.textContent = i;
      const color = i <= 3 ? '#27ae60' : i <= 6 ? '#f39c12' : i <= 8 ? '#e67e22' : '#e74c3c';
      b.style.cssText = `width:26px;height:26px;border-radius:6px;border:1.5px solid ${color};`
        + `background:transparent;color:${color};font-size:0.78em;font-weight:bold;cursor:pointer;transition:background 0.1s;`;
      b.addEventListener('click', () => {
        _level = i;
        btns.forEach((btn, idx) => {
          const c = (idx+1) <= 3 ? '#27ae60' : (idx+1) <= 6 ? '#f39c12' : (idx+1) <= 8 ? '#e67e22' : '#e74c3c';
          btn.style.background = (idx+1) === i ? c : 'transparent';
          btn.style.color      = (idx+1) === i ? '#fff' : c;
        });
        if (onChange) onChange();
      });
      if (i === _level) { b.style.background = color; b.style.color = '#fff'; }
      btns.push(b);
      wrap.appendChild(b);
    }
    container.appendChild(wrap);
  }

  // ── Tutorial system ────────────────────────────────────────────────────────
  const TUTORIALS = {
    p4: {
      title: 'Puissance 4',
      icon: '🔴',
      rules: [
        'Le plateau est une grille de 6 lignes × 7 colonnes.',
        'À ton tour, clique sur une colonne pour y faire tomber ton jeton.',
        "Le premier qui aligne 4 jetons (horizontal, vertical ou diagonal) gagne.",
        "Si la grille est pleine sans alignement, c'est un match nul.",
      ]
    },
    morpion: {
      title: 'Morpion',
      icon: '⭕',
      rules: [
        'La grille est 3×3. Tu joues avec ✕, l\'adversaire avec ○.',
        'Clique sur une case vide pour placer ton symbole.',
        "Aligne 3 symboles identiques en ligne, colonne ou diagonale pour gagner.",
        "Si toutes les cases sont remplies sans gagnant, c'est un match nul.",
      ]
    },
    othello: {
      title: 'Othello',
      icon: '🔵',
      rules: [
        'Tu joues les pions noirs sur un plateau 8×8.',
        "Place un pion de façon à encadrer des pions adverses : ils se retournent.",
        "Si tu ne peux pas jouer, tu passes ton tour.",
        "À la fin, le joueur avec le plus de pions de sa couleur gagne.",
      ]
    },
    echecs: {
      title: 'Échecs',
      icon: '♟️',
      rules: [
        'Tu joues les Blancs. Chaque pièce a ses mouvements propres.',
        'Clique une pièce pour voir ses coups légaux, puis clique la case cible.',
        "L'objectif est de mettre le Roi adverse en échec et mat.",
        'Roque, en passant et promotion de pion sont gérés automatiquement.',
      ]
    },
    dames: {
      title: 'Jeu de Dames',
      icon: '🟫',
      rules: [
        'Tu joues les pions clairs. Les pions avancent en diagonale.',
        'Si tu peux prendre un pion adverse, tu dois le faire.',
        "Les prises multiples sont enchaînées automatiquement.",
        "Un pion qui atteint le bord adverse devient Dame et peut aller et venir.",
      ]
    },
    backgammon: {
      title: 'Backgammon',
      icon: '🎲',
      rules: [
        "Tu joues les pions blancs. Lance les dés en cliquant « Lancer ».",
        "Déplace tes pions dans le sens des aiguilles d'une montre.",
        "Un point occupé par 2 pions adverses ou plus est bloqué.",
        "Le premier joueur à rentrer tous ses pions dans son jan et à les sortir gagne.",
      ]
    },
    bataille_navale: {
      title: 'Bataille Navale',
      icon: '🎯',
      rules: [
        "Place tes bateaux sur ta grille (glisse ou clique pour les orienter).",
        "Clique sur la grille adverse pour tirer : rouge = touché, bleu = raté.",
        "Coule tous les bateaux adverses avant qu'il coule les tiens.",
        "Les bateaux : porte-avions (5), croiseur (4), destroyer (3), sous-marin (3), torpilleur (2).",
      ]
    },
    bataille: {
      title: 'Bataille',
      icon: '🃏',
      rules: [
        "Les 52 cartes sont distribuées équitablement entre toi et l'adversaire.",
        "Chaque tour, vous retournez chacun la carte du dessus.",
        "La carte la plus haute (A > K > Q … > 2) remporte les deux.",
        "En cas d'égalité, il y a bataille : 3 cartes face cachée puis 1 retournée.",
        "Celui qui récupère toutes les cartes gagne.",
      ]
    },
    monopoly: {
      title: 'Monopoly',
      icon: '🏦',
      rules: [
        "Lance les dés pour avancer ton pion sur le plateau.",
        "Achète les propriétés sur lesquelles tu t'arrêtes, ou paie un loyer si elles sont prises.",
        "Construis des maisons puis un hôtel pour augmenter les loyers.",
        "Le dernier joueur non-en-faillite gagne la partie.",
      ]
    },
    uno: {
      title: 'Uno',
      icon: '🃏',
      rules: [
        "Pose une carte de même couleur ou de même valeur que la carte du dessus de la pile.",
        "Les cartes spéciales : +2 (pioche), Passer, Sens inverse, Joker (change couleur), +4.",
        "Quand il te reste 1 carte, dis UNO ! (automatique ici).",
        "Le premier à se débarrasser de toutes ses cartes gagne.",
      ]
    },
    petits_chevaux: {
      title: 'Petits Chevaux',
      icon: '🎠',
      rules: [
        "Lance le dé. Un 6 sort un cheval de l'écurie.",
        "Avance tes chevaux sur le circuit et rentre-les dans ta zone d'arrivée.",
        "Si tu tombes sur un cheval adverse, il retourne à son écurie.",
        "Le premier à rentrer tous ses chevaux dans la zone centrale gagne.",
      ]
    },
    scrabble: {
      title: 'Scrabble',
      icon: '🧩',
      rules: [
        "Place des lettres sur le plateau pour former des mots en français.",
        "Chaque mot doit s'appuyer sur une lettre déjà posée (sauf le premier, au centre).",
        "Les cases de couleur multiplient la valeur de la lettre ou du mot.",
        "Score = somme des valeurs des lettres × multiplicateurs. Passe si tu es bloqué.",
      ]
    },
    billard: {
      title: 'Billard',
      icon: '🎱',
      rules: [
        "Clique et glisse depuis la boule blanche pour viser, relâche pour frapper.",
        "Les pleines (1-7) ou les rayées (9-15) te sont attribuées au premier empochage.",
        "Empoche toutes tes billes puis la noire (8) pour gagner.",
        "Si tu empoches la blanche ou la 8 avant la fin, tu perds.",
      ]
    },
    yams: {
      title: "Yam's",
      icon: '🎰',
      rules: [
        "Tu as 3 lancers par tour. Clique sur les dés pour les conserver.",
        "Après tes lancers, choisis une combinaison dans le tableau de score.",
        "Chaque combinaison ne peut être utilisée qu'une fois.",
        "Combinaisons : Brelan, Carré, Full, Petite suite, Grande suite, Yam's, Chance…",
        "Bonus de 35 points si la somme des 1-6 dépasse 63.",
      ]
    },
  };

  function showTutorial(gameId, onDone) {
    const tuto = TUTORIALS[gameId];
    if (!tuto) { if (onDone) onDone(); return; }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:9999;'
      + 'display:flex;align-items:center;justify-content:center;padding:16px;';

    const box = document.createElement('div');
    box.style.cssText = 'background:#111827;border:1.5px solid rgba(255,255,255,0.15);border-radius:18px;'
      + 'padding:28px 24px 22px;max-width:420px;width:100%;text-align:center;';

    const icon = document.createElement('div');
    icon.style.cssText = 'font-size:2.8em;margin-bottom:10px;';
    icon.textContent = tuto.icon;

    const title = document.createElement('h2');
    title.style.cssText = 'color:#f1c40f;margin-bottom:16px;font-size:1.25em;';
    title.textContent = tuto.title;

    const ul = document.createElement('ul');
    ul.style.cssText = 'text-align:left;padding-left:18px;color:#ccc;font-size:0.9em;line-height:1.7;margin-bottom:22px;';
    tuto.rules.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      ul.appendChild(li);
    });

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;justify-content:center;';

    const btnSkip = document.createElement('button');
    btnSkip.textContent = 'Passer ⏭';
    btnSkip.style.cssText = 'padding:9px 18px;border-radius:9px;border:1px solid rgba(255,255,255,0.18);'
      + 'background:rgba(255,255,255,0.06);color:#aaa;font-size:0.88em;cursor:pointer;';

    const btnOk = document.createElement('button');
    btnOk.textContent = 'Compris ! ✓';
    btnOk.style.cssText = 'padding:9px 22px;border-radius:9px;border:none;'
      + 'background:#f1c40f;color:#111;font-size:0.9em;font-weight:bold;cursor:pointer;';

    const close = () => { overlay.remove(); if (onDone) onDone(); };
    btnSkip.addEventListener('click', close);
    btnOk.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    btnRow.append(btnSkip, btnOk);
    box.append(icon, title, ul, btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // ── Online multiplayer (PeerJS WebRTC) ────────────────────────────────────
  const BASE_URL = 'https://cotangeante-pi.github.io/jeu3d';
  let _peer = null, _conn = null, _host = false, _onMoveCb = null, _onConnectedCb = null;
  let _peerReady = false, _peerLoading = false, _peerCallbacks = [];

  function _loadPeerJS(cb) {
    if (window.Peer) { cb(); return; }
    if (_peerLoading) { _peerCallbacks.push(cb); return; }
    _peerLoading = true;
    _peerCallbacks.push(cb);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
    s.onload = () => { _peerLoading = false; _peerCallbacks.forEach(fn => fn()); _peerCallbacks = []; };
    s.onerror = () => { _peerLoading = false; alert('Impossible de charger PeerJS. Vérifiez votre connexion.'); };
    document.head.appendChild(s);
  }

  function _roomIdFromURL() {
    return new URLSearchParams(window.location.search).get('room');
  }

  function _setupConn(conn) {
    _conn = conn;
    conn.on('data', data => { if (_onMoveCb) _onMoveCb(data); });
    conn.on('close', () => { _conn = null; });
    const _fire = () => { if (_onConnectedCb) _onConnectedCb({ isHost: _host }); };
    if (conn.open) _fire(); else conn.on('open', _fire);
  }

  function _ensurePeer(cb) {
    if (_peer && _peerReady) { cb(_peer); return; }
    _loadPeerJS(() => {
      if (_peer && _peerReady) { cb(_peer); return; }
      const p = new window.Peer();
      _peer = p;
      p.on('open', id => { _peerReady = true; cb(p); });
      p.on('error', err => { alert('Erreur PeerJS : ' + err.message); });
    });
  }

  function _showOnlineModal(gameId) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.82);z-index:9998;'
      + 'display:flex;align-items:center;justify-content:center;padding:16px;';

    const box = document.createElement('div');
    box.style.cssText = 'background:#111827;border:1.5px solid rgba(52,152,219,0.4);border-radius:18px;'
      + 'padding:26px 22px 20px;max-width:400px;width:100%;text-align:center;';

    const title = document.createElement('h2');
    title.style.cssText = 'color:#5dade2;margin-bottom:6px;font-size:1.1em;';
    title.textContent = '🌐 Jouer en ligne';

    const info = document.createElement('p');
    info.style.cssText = 'color:#888;font-size:0.82em;margin-bottom:18px;';
    info.textContent = 'Crée une partie ou rejoins avec un lien.';

    const btnHost = document.createElement('button');
    btnHost.textContent = '🔗 Créer une partie';
    btnHost.style.cssText = 'width:100%;padding:11px;border-radius:10px;border:none;'
      + 'background:#2980b9;color:#fff;font-size:0.95em;font-weight:bold;cursor:pointer;margin-bottom:8px;';

    const divOr = document.createElement('div');
    divOr.style.cssText = 'color:#555;font-size:0.8em;margin:6px 0;';
    divOr.textContent = '— ou —';

    const joinInput = document.createElement('input');
    joinInput.placeholder = 'Colle le lien ici…';
    joinInput.style.cssText = 'width:100%;padding:9px 10px;border-radius:9px;border:1px solid rgba(255,255,255,0.15);'
      + 'background:rgba(255,255,255,0.05);color:#ddd;font-size:0.85em;margin-bottom:8px;box-sizing:border-box;';

    const btnJoin = document.createElement('button');
    btnJoin.textContent = '🎮 Rejoindre';
    btnJoin.style.cssText = 'width:100%;padding:10px;border-radius:10px;border:1px solid rgba(52,152,219,0.5);'
      + 'background:transparent;color:#5dade2;font-size:0.9em;cursor:pointer;margin-bottom:14px;';

    const status = document.createElement('p');
    status.style.cssText = 'color:#aaa;font-size:0.82em;min-height:1.4em;';

    const btnClose = document.createElement('button');
    btnClose.textContent = '✕ Annuler';
    btnClose.style.cssText = 'background:none;border:none;color:#555;font-size:0.8em;cursor:pointer;margin-top:4px;';
    btnClose.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    btnHost.addEventListener('click', () => {
      btnHost.disabled = true;
      btnHost.textContent = '⏳ Connexion…';
      status.textContent = 'Création de la partie…';
      _host = true;
      _ensurePeer(p => {
        const gamePath = window.location.pathname.replace(/.*\/jeu3d\//, '');
        const url = `${BASE_URL}/${gamePath}?room=${p.id}`;
        status.innerHTML = 'Lien à partager :<br><strong style="color:#5dade2;word-break:break-all;">' + url + '</strong>';
        btnHost.textContent = '✓ En attente…';

        // copy to clipboard
        try { navigator.clipboard.writeText(url); status.innerHTML += '<br><small style="color:#27ae60;">Lien copié !</small>'; } catch(e){}

        p.on('connection', conn => {
          _setupConn(conn);
          modal.remove();
        });
      });
    });

    btnJoin.addEventListener('click', () => {
      const val = joinInput.value.trim();
      let roomId = val;
      try {
        const u = new URL(val);
        roomId = new URLSearchParams(u.search).get('room') || val;
      } catch(e) {}
      if (!roomId) { status.textContent = 'Entre un lien valide.'; return; }
      _host = false;
      btnJoin.disabled = true;
      status.textContent = 'Connexion en cours…';
      _ensurePeer(p => {
        const conn = p.connect(roomId);
        _setupConn(conn);
        conn.on('open', () => { modal.remove(); });
        conn.on('error', () => { status.textContent = 'Connexion échouée.'; btnJoin.disabled = false; });
      });
    });

    box.append(title, info, btnHost, divOr, joinInput, btnJoin, status, btnClose);
    modal.appendChild(box);
    document.body.appendChild(modal);
  }

  function createOnlineButton(container, gameId, { onConnected, onMove }) {
    _onConnectedCb = onConnected;
    _onMoveCb = onMove;

    // Auto-join if ?room= param is in URL
    const roomId = _roomIdFromURL();
    if (roomId) {
      _host = false;
      _loadPeerJS(() => {
        const p = new window.Peer();
        _peer = p;
        p.on('open', () => {
          _peerReady = true;
          const conn = p.connect(roomId);
          _setupConn(conn);
        });
      });
    }

    const btn = document.createElement('button');
    btn.textContent = '🌐 En ligne';
    btn.style.cssText = 'padding:7px 13px;border-radius:8px;border:1px solid rgba(52,152,219,0.45);'
      + 'background:rgba(52,152,219,0.1);color:#5dade2;font-size:0.82em;font-weight:bold;cursor:pointer;white-space:nowrap;';
    btn.addEventListener('click', () => _showOnlineModal(gameId));
    container.appendChild(btn);
  }

  function sendMove(data) {
    if (_conn && _conn.open) _conn.send(data);
  }

  function isOnline() { return _conn !== null && _conn.open; }
  function isHost() { return _host; }

  return { getLevel, shouldRandomize, getDepth, createLevelSelector, showTutorial, createOnlineButton, sendMove, isOnline, isHost };
})();
