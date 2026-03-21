# Jeu 3D — RPG de survie en ville

Un jeu de survie/RPG 3D en vue FPS jouable directement dans le navigateur, sans installation.

## Jouer

Ouvre simplement `index.html` dans Chrome ou Firefox. Aucun serveur requis.

## Gameplay

Survive en ville : mange, travaille, explore, et ne te noie pas.

### Jauges (bas de l'écran)
| Jauge | Description |
|-------|-------------|
| 🔵 Cercles | Oxygène — diminue sous l'eau, se recharge à l'air |
| 🟠 Nourriture | Diminue avec le temps — mange pour survivre |
| 🔴 Vie | Se régénère lentement si tu as mangé |

> **Game Over** si l'une des trois jauges atteint zéro.

### HUD
- **Haut gauche** : argent ($)
- **Haut droite** : QI, badges d'emploi, bouton capacités physiques
- **Centre bas** : hotbar inventaire (8 slots style Minecraft)
- **Étoiles jaunes** : niveau de recherche policière (0–3 ★)

### Contrôles
| Touche | Action |
|--------|--------|
| `W A S D` | Se déplacer |
| Souris | Regarder / orienter la caméra |
| `Espace` | Sauter |
| `E` | Interagir (bâtiment, NPC) |
| Clic droit | Ramasser un objet / manger l'item sélectionné |
| Clic gauche | Frapper |
| `1`–`8` | Changer de slot dans la hotbar |
| `F` | Monter / descendre d'une voiture |
| `Shift` | Boost en voiture |
| `Échap` | Pause |

### Inventaire (hotbar)
Les objets ramassés (pommes…) s'empilent dans les 8 slots en bas de l'écran.
Sélectionne un slot avec `1`–`8`, puis **clic droit** pour manger la nourriture sélectionnée.

### Bâtiments & PNJ
- 🍞 **Boulangerie** — emploi boulanger ; missions de livraison de pommes
- 💼 **Cabinet comptable** — emploi comptable ; rester au bureau et maintenir `T`
- **Concessionnaire** — achète des voitures (citadine, berline, sport)
- Marchands, école, et autres établissements en ville

### Emplois & Missions
Chaque emploi rapporte un **salaire automatique** toutes les 60 secondes.
Des missions ponctuelles apparaissent régulièrement :
- **Boulanger** : rapporter X pommes avant la fin du chrono
- **Comptable** : rejoindre le bureau à temps, puis maintenir `T` pendant 20 s

3 missions ratées = **licenciement**.

### Voitures
Achète une voiture au concessionnaire, puis approche-toi et appuie sur `F` pour conduire.
`Shift` active le boost. La caméra passe en vue troisième personne.

### Système policier
Frapper quelqu'un ou commettre un crime monte le niveau de recherche (★).
- ★ : les policiers à pied te poursuivent
- ★★★ : les voitures de police interviennent

Cache-toi 15 secondes hors de vue pour que le niveau baisse. Si un policier t'attrape : amende + dégâts.

### Monde
- Grande zone urbaine (rayon ~320 m) avec rues, bâtiments jusqu'à 54 m, établissements
- 60 piétons, 12 policiers à pied, 6 voitures de police patrouillant en ville
- Forêt dense tout autour avec pommes au sol
- **Rivière à l'ouest** — attention à l'oxygène en nageant

## Sauvegarde

Progression **sauvegardée automatiquement** toutes les 30 secondes (localStorage), et à chaque achat, emploi ou mission accomplie.

## Technologies

- [Three.js](https://threejs.org/) r160 — rendu 3D
- HTML / CSS / JavaScript vanilla — aucune dépendance supplémentaire
- localStorage — sauvegarde locale

## Structure du projet

```
jeu3d/
├── index.html          # Point d'entrée
├── css/
│   ├── style.css       # Layout, overlays
│   └── hud.css         # Barres, cercles, badges, hotbar
└── js/
    ├── three.min.js    # Librairie 3D (locale)
    ├── config.js       # Constantes du jeu
    ├── state.js        # État global
    ├── save.js         # Sauvegarde localStorage
    ├── world.js        # Génération du monde (sol, rivière, ville, forêt)
    ├── npc.js          # Bâtiments et personnages fixes
    ├── humans.js       # Piétons et police (IA, poursuite, wanted)
    ├── cars.js         # Voitures conduisibles (physique, caméra)
    ├── player.js       # Mouvement FPS, physique, survie
    ├── input.js        # Clavier et souris
    ├── interactions.js # Actions (achats, ramassage, manger, frapper)
    ├── jobs.js         # Missions, salaires, renvoi
    ├── hud.js          # Interface utilisateur
    ├── ui.js           # Menus, dialogues
    ├── render.js       # Boucle Three.js
    └── init.js         # Démarrage
```
