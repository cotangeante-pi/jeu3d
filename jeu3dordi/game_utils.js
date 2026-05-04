// ============================================================
// game_utils.js — Niveaux 1-10 | Tutoriel | Mode En ligne
// ============================================================
const GameUtils = (() => {
'use strict';

// ─── NIVEAUX 1-10 ────────────────────────────────────────────
const RANDOM_CHANCE = [0, 0.95, 0.80, 0.65, 0.45, 0.25, 0.10, 0, 0, 0, 0];
const DEPTH_TABLE   = [0,  1,    1,    1,    2,    2,    2,    2, 3, 4, 5];

let _level = 7;

function getLevel()        { return _level; }
function setLevel(v)       { _level = Math.max(1, Math.min(10, +v || 7)); }
function shouldRandomize() { return Math.random() < RANDOM_CHANCE[_level]; }
function getDepth()        { return DEPTH_TABLE[_level]; }

function createLevelSelector(container, onChange) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;gap:3px;flex-wrap:wrap;justify-content:center;';
  const lbl = document.createElement('span');
  lbl.style.cssText = 'font-size:0.73em;color:#555;margin-right:2px;flex-shrink:0;';
  lbl.textContent = 'Niv.';
  wrap.appendChild(lbl);
  for (let i = 1; i <= 10; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.dataset.lvl = i;
    btn.style.cssText = 'width:24px;height:24px;border-radius:5px;border:1.5px solid;font-size:0.72em;font-weight:bold;cursor:pointer;transition:all 0.12s;padding:0;';
    _applyLevelStyle(btn, i, _level);
    btn.addEventListener('click', () => {
      setLevel(i);
      wrap.querySelectorAll('button[data-lvl]').forEach(b => _applyLevelStyle(b, +b.dataset.lvl, _level));
      if (onChange) onChange(_level);
    });
    wrap.appendChild(btn);
  }
  container.appendChild(wrap);
  return wrap;
}

function _applyLevelStyle(btn, i, current) {
  const on = i === current;
  const c = i <= 3 ? '#2ecc71' : i <= 6 ? '#f1c40f' : i <= 8 ? '#e67e22' : '#e74c3c';
  btn.style.background  = on ? c + '22' : 'rgba(255,255,255,0.03)';
  btn.style.borderColor = on ? c : 'rgba(255,255,255,0.1)';
  btn.style.color       = on ? c : '#444';
}

// ─── TUTORIELS ────────────────────────────────────────────────
const TUTORIALS = {
  echecs: { icon:'♟️', title:'Échecs', rules:[
    '♟ Cliquez sur une pièce blanche pour voir ses coups légaux (cercles verts).',
    '♛ But : mettre le roi adverse en échec et mat.',
    '🏰 Roque, prise en passant et promotion de pion sont supportés.',
    '🤖 Vous jouez les Blancs, l\'IA joue les Noirs après votre coup.',
  ]},
  dames: { icon:'🟫', title:'Jeu de Dames', rules:[
    '🟡 Vous jouez les jetons jaunes (bas), le bot joue rouge (haut).',
    '↗ Déplacez en diagonale vers l\'avant. La prise est obligatoire.',
    '⚔ Capturez en sautant par-dessus un jeton adverse.',
    '♛ Atteignez la rangée adverse pour devenir Dame (déplacement libre).',
  ]},
  p4: { icon:'🔴', title:'Puissance 4', rules:[
    '🟡 Cliquez sur une colonne pour y déposer votre jeton jaune.',
    '4️⃣ Alignez 4 jetons en ligne, colonne ou diagonale pour gagner.',
    '🤖 Le bot rouge joue après vous sur la grille 7×6.',
  ]},
  othello: { icon:'🔵', title:'Othello', rules:[
    '🟡 Posez un jeton jaune pour encadrer des jetons noirs adverses.',
    '🔄 Tous les jetons encadrés se retournent à votre couleur.',
    '⏭ Si vous ne pouvez pas jouer, votre tour est passé automatiquement.',
    '🏆 Plus de jetons à la fin = victoire.',
  ]},
  morpion: { icon:'⭕', title:'Morpion', rules:[
    '✖ Vous jouez les X. Cliquez sur une case pour poser votre symbole.',
    '3️⃣ Alignez 3 symboles en ligne, colonne ou diagonale pour gagner.',
    '🤖 Le bot joue les O après votre coup.',
  ]},
  bataille: { icon:'🃏', title:'Bataille', rules:[
    '▶ Cliquez "Tirer" — chaque joueur retourne sa carte du dessus.',
    '⬆ La carte la plus haute remporte le pli.',
    '⚔ Égalité = GUERRE : 3 cartes cachées + 1 révélée décident.',
    '🏆 Réunissez les 52 cartes pour gagner.',
  ]},
  bataille_navale: { icon:'🎯', title:'Bataille Navale', rules:[
    '⚓ Phase placement : posez vos 5 bateaux. Cliquez pour placer, "Rotation" pour tourner.',
    '💥 Phase combat : cliquez la grille ennemie pour tirer. Rouge = touché, gris = raté.',
    '🚢 Un bateau coulé = toutes ses cases touchées.',
    '🏆 Coulez toute la flotte adverse pour gagner.',
  ]},
  backgammon: { icon:'🎲', title:'Backgammon', rules:[
    '🎲 Lancez les dés, déplacez vos pions blancs de la valeur obtenue.',
    '→ Les blancs avancent vers les points 1-6 (votre maison).',
    '⚔ Un pion adverse seul (blot) peut être frappé et envoyé à la barre.',
    '🏠 Rentrez vos pions dans votre maison avant de les sortir.',
    '🏆 Le premier à sortir tous ses pions gagne.',
  ]},
  monopoly: { icon:'🏦', title:'Monopoly', rules:[
    '🎲 Lancez les dés pour avancer votre pion sur le plateau.',
    '🏠 Atterrissez sur une propriété libre → achetez-la.',
    '💸 Atterrissez sur une propriété adverse → payez le loyer.',
    '🏆 Le dernier joueur encore solvable gagne.',
  ]},
  uno: { icon:'🃏', title:'UNO', rules:[
    '🎴 Posez une carte de même couleur OU même valeur que la carte visible.',
    '🃏 Spéciales : +2 (pioche 2), S (passe), R (sens inverse), Joker/+4 (choix couleur).',
    '📢 "UNO !" est annoncé automatiquement sur votre dernière carte.',
    '🏆 Le premier à vider sa main gagne.',
  ]},
  petits_chevaux: { icon:'🐴', title:'Petits Chevaux', rules:[
    '🎲 Lancez le dé. Un 6 sort un cheval de l\'écurie ou avance de 6.',
    '🐴 Avancez vos chevaux jaunes le long du circuit vers la maison centrale.',
    '⚔ Atterrissez sur un cheval adverse → il retourne à l\'écurie !',
    '🏆 Rentrez vos 4 chevaux en premier pour gagner.',
  ]},
  yams: { icon:'🎰', title:'Yam\'s', rules:[
    '🎲 Lancez les 5 dés. Cliquez sur un dé pour le garder, relancez jusqu\'à 2 fois.',
    '📋 Choisissez ensuite une combinaison dans la feuille de score.',
    '🏆 Maximisez votre score sur 13 manches.',
  ]},
  scrabble: { icon:'🧩', title:'Scrabble', rules:[
    '🔤 Cliquez une lettre dans votre main, puis la case de départ sur le plateau.',
    '→↓ Changez la direction avec le bouton Horizontal/Vertical.',
    '✓ Validez votre mot — il doit toucher une lettre existante (sauf le premier).',
    '🏆 Le plus de points gagne. Les cases de couleur multiplient la valeur.',
  ]},
  billard: { icon:'🎱', title:'Billard 8-Ball', rules:[
    '🎱 Faites glisser depuis la bille blanche pour viser. Relâchez pour tirer.',
    '🟡 Vous jouez les billes pleines (1-7), le bot les rayées (9-15).',
    '8️⃣ Empochéz la noire (8) EN DERNIER après toutes vos billes.',
    '⚠ Empocher la noire trop tôt ou la blanche = défaite !',
  ]}
};

function showTutorial(gameId, onDone) {
  const t = TUTORIALS[gameId];
  if (!t) { if (onDone) onDone(); return; }
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:9000;padding:16px;';
  const box = document.createElement('div');
  box.style.cssText = 'background:#0d1526;border:2px solid #f1c40f;border-radius:16px;padding:22px 26px;max-width:400px;width:100%;text-align:center;';
  box.innerHTML = `
    <div style="font-size:2.4em;margin-bottom:6px">${t.icon}</div>
    <h2 style="color:#f1c40f;font-size:1.15em;margin-bottom:12px">${t.title} — Comment jouer</h2>
    <ul style="text-align:left;padding-left:1.4em;color:#ddd;line-height:1.9;font-size:0.87em;margin-bottom:16px">
      ${t.rules.map(r=>`<li>${r}</li>`).join('')}
    </ul>
    <div style="display:flex;gap:10px;justify-content:center">
      <button id="_ts" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);color:#666;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:0.87em;">Passer ⏭</button>
      <button id="_to" style="background:#f1c40f;color:#0a0e1a;border:none;padding:9px 22px;border-radius:8px;cursor:pointer;font-size:0.87em;font-weight:bold;">Compris ! ✓</button>
    </div>
  `;
  const dismiss = () => { if (ov.parentNode) document.body.removeChild(ov); if (onDone) onDone(); };
  box.querySelector('#_to').onclick = dismiss;
  box.querySelector('#_ts').onclick = dismiss;
  ov.appendChild(box);
  document.body.appendChild(ov);
}

// ─── MODE EN LIGNE (PeerJS chargé à la demande) ───────────────
const BASE_URL = 'https://cotangeante-pi.github.io/jeu3d';
let _peer = null, _conn = null, _isHost = false;

function _loadPeerJS(cb) {
  if (typeof Peer !== 'undefined') { cb(); return; }
  const s = document.createElement('script');
  s.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  s.onload = cb;
  s.onerror = () => alert('Impossible de charger PeerJS. Vérifie ta connexion.');
  document.head.appendChild(s);
}

function createOnlineButton(container, gameId, cbs) {
  const btn = document.createElement('button');
  btn.id = 'gu-online-btn';
  btn.textContent = '🌐 En ligne';
  btn.style.cssText = 'background:rgba(52,152,219,0.10);border:1.5px solid rgba(52,152,219,0.42);color:#5dade2;padding:5px 13px;border-radius:7px;cursor:pointer;font-size:0.80em;font-weight:bold;transition:all 0.15s;flex-shrink:0;';
  btn.addEventListener('click', () => _loadPeerJS(() => _showOnlineModal(gameId, cbs)));
  container.appendChild(btn);
  const room = new URLSearchParams(window.location.search).get('room');
  if (room) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#0d1526;border:1px solid #3498db;color:#5dade2;padding:9px 18px;border-radius:9px;z-index:9200;font-size:0.83em;font-weight:bold;';
    toast.textContent = '🌐 Connexion à la partie en ligne…';
    document.body.appendChild(toast);
    setTimeout(() => _loadPeerJS(() => {
      _joinPeer(room, cbs, null, null);
      setTimeout(() => { if (toast.parentNode) document.body.removeChild(toast); }, 6000);
    }), 600);
  }
  return btn;
}

function _showOnlineModal(gameId, cbs) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;z-index:9100;padding:16px;';
  const box = document.createElement('div');
  box.style.cssText = 'background:#0d1526;border:2px solid #3498db;border-radius:16px;padding:22px;max-width:370px;width:100%;';
  box.innerHTML = `
    <h2 style="color:#5dade2;margin-bottom:10px;text-align:center">🌐 Jouer en ligne</h2>
    <p style="color:#777;font-size:0.82em;margin-bottom:14px;text-align:center;line-height:1.5">Crée une partie et partage le lien. Ton adversaire n'a qu'à l'ouvrir !</p>
    <button id="_oh" style="width:100%;background:#3498db;color:#fff;border:none;padding:11px;border-radius:9px;font-size:0.92em;font-weight:bold;cursor:pointer;margin-bottom:8px;">✨ Créer une partie</button>
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <input id="_oc" placeholder="Code d'une partie existante" style="flex:1;background:#0a0e1a;border:1.5px solid #2a3555;color:#fff;padding:9px;border-radius:7px;font-size:0.82em;">
      <button id="_oj" style="background:#27ae60;color:#fff;border:none;padding:9px 13px;border-radius:7px;font-size:0.82em;font-weight:bold;cursor:pointer;">Rejoindre</button>
    </div>
    <div id="_ost" style="text-align:center;font-size:0.79em;color:#888;min-height:16px;"></div>
    <div id="_olb" style="display:none;margin-top:8px">
      <div id="_ol" style="background:#0a0e1a;border:1px solid #3498db55;border-radius:7px;padding:9px;word-break:break-all;font-size:0.72em;color:#5dade2;"></div>
      <button id="_ocp" style="margin-top:6px;width:100%;background:#3498db11;border:1px solid #3498db44;color:#5dade2;padding:7px;border-radius:7px;cursor:pointer;font-size:0.79em;">📋 Copier le lien</button>
    </div>
    <button id="_ocl" style="margin-top:12px;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.11);color:#555;padding:7px;border-radius:7px;cursor:pointer;font-size:0.79em;">✕ Fermer</button>
  `;
  ov.appendChild(box);
  document.body.appendChild(ov);
  const st = box.querySelector('#_ost');
  box.querySelector('#_oh').onclick = async () => {
    st.textContent = 'Création…';
    try {
      const id = await _ensurePeer();
      const path = window.location.pathname.replace(/^\/jeu3d\//, '');
      const url = `${BASE_URL}/${path}?room=${id}`;
      box.querySelector('#_olb').style.display = 'block';
      box.querySelector('#_ol').textContent = url;
      box.querySelector('#_ocp').onclick = () => {
        navigator.clipboard.writeText(url).catch(()=>{});
        box.querySelector('#_ocp').textContent = '✓ Copié !';
        setTimeout(()=>{ box.querySelector('#_ocp').textContent='📋 Copier le lien'; }, 2000);
      };
      st.textContent = `Code : ${id} — En attente d'un adversaire…`;
      _peer.on('connection', conn => {
        _conn = conn; _isHost = true;
        _setupConn(conn, cbs);
        st.textContent = '✅ Adversaire connecté !';
        setTimeout(() => {
          if (ov.parentNode) document.body.removeChild(ov);
          if (cbs.onConnected) cbs.onConnected({ isHost:true, conn });
        }, 700);
      });
    } catch(e) { st.textContent = 'Erreur de connexion. Réessaie.'; }
  };
  box.querySelector('#_oj').onclick = () => {
    const code = box.querySelector('#_oc').value.trim();
    if (!code) { st.textContent = 'Entre un code de partie.'; return; }
    _joinPeer(code, cbs, ov, st);
  };
  box.querySelector('#_ocl').onclick = () => { if (ov.parentNode) document.body.removeChild(ov); };
}

async function _ensurePeer() {
  if (_peer && !_peer.destroyed) {
    return new Promise(r => { if (_peer.id) r(_peer.id); else _peer.on('open', r); });
  }
  return new Promise((resolve, reject) => {
    const id = 'g3d' + Math.random().toString(36).slice(2, 8).toUpperCase();
    _peer = new Peer(id, { debug:0 });
    _peer.on('open', () => resolve(id));
    _peer.on('error', reject);
    setTimeout(() => reject(new Error('timeout')), 12000);
  });
}

function _joinPeer(peerId, cbs, ov, st) {
  const doConnect = () => {
    const conn = _peer.connect(peerId);
    _setupConn(conn, cbs);
    conn.on('open', () => {
      _conn = conn; _isHost = false;
      if (st) st.textContent = '✅ Connecté ! Lancement…';
      setTimeout(() => {
        if (ov && ov.parentNode) document.body.removeChild(ov);
        if (cbs.onConnected) cbs.onConnected({ isHost:false, conn });
      }, 600);
    });
    conn.on('error', () => { if (st) st.textContent = 'Impossible de rejoindre.'; });
  };
  if (!_peer || _peer.destroyed) {
    _peer = new Peer({ debug:0 });
    _peer.on('open', doConnect);
    _peer.on('error', () => { if (st) st.textContent = 'Erreur PeerJS.'; });
  } else { doConnect(); }
}

function _setupConn(conn, cbs) {
  conn.on('data', d => { if (cbs.onMove) cbs.onMove(d); });
  conn.on('close', () => {
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);background:#c0392b;color:#fff;padding:10px 20px;border-radius:10px;z-index:9999;font-size:0.84em;font-weight:bold;';
    b.textContent = '⚠ Connexion avec l\'adversaire perdue.';
    document.body.appendChild(b);
    setTimeout(() => { if (b.parentNode) document.body.removeChild(b); }, 5000);
  });
}

function sendMove(data) { if (_conn && _conn.open) _conn.send(data); }
function isOnline()     { return !!(_conn && _conn.open); }
function isHost()       { return _isHost; }

return {
  getLevel, setLevel, shouldRandomize, getDepth,
  createLevelSelector, showTutorial,
  createOnlineButton, sendMove, isOnline, isHost
};
})();
