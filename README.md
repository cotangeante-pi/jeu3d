# Jeu 3D — RPG de survie en ville

Un jeu de survie/RPG 3D en vue FPS jouable directement dans le navigateur, sans installation.

## Jouer

Ouvre simplement `index.html` dans Chrome ou Firefox. Aucun serveur requis.

## Gameplay

Survive en ville : mange, travaille, apprends, et ne te noie pas.

### Jauges (bas de l'écran)
| Jauge | Description |
|-------|-------------|
| 🔵 Cercles | Oxygène — diminue sous l'eau, se recharge à l'air |
| 🟠 Nourriture | Diminue avec le temps — achète à manger |
| 🔴 Vie | Se régénère lentement si tu as mangé |

> **Game Over** si l'une des trois jauges atteint zéro.

### HUD
- **Haut gauche** : ton argent ($)
- **Haut droite** : ton QI, tes badges d'emploi, bouton capacités physiques

### Contrôles
| Touche | Action |
|--------|--------|
| `W A S D` | Se déplacer |
| Souris | Regarder / orienter la caméra |
| `Espace` | Sauter |
| `E` | Interagir (entrer dans un bâtiment, parler) |
| Clic droit | Ramasser un objet à portée |
| Clic gauche | Frapper |
| `Échap` | Pause |

### Bâtiments
- 🟠 **Marchands** — achète de la nourriture pour ne pas mourir de faim
- 🔵 **École** — paye des cours pour augmenter ton QI
- 🟡 **Employeurs** — postule à un emploi (nécessite parfois un QI ou une force minimale)

Les maisons privées ont des portes barrées — on ne peut pas entrer.

### Économie
- Démarre avec **50 $**
- Un emploi rapporte un **salaire automatique** toutes les 60 secondes
- Les cours et la nourriture coûtent de l'argent

### Monde
- Zone urbaine centrale avec rues, bâtiments, établissements
- Forêt et nature autour de la ville
- **Rivière à l'ouest** — attention, tu peux te noyer si tu y restes trop longtemps
- Des pommes (objets rouges) sont éparpillées en ville

## Sauvegarde

La progression est **automatiquement sauvegardée** toutes les 30 secondes dans le navigateur (localStorage). Elle est aussi sauvegardée à chaque achat, cours et emploi.

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
│   └── hud.css         # Barres, cercles, badges
└── js/
    ├── three.min.js    # Librairie 3D (locale)
    ├── config.js       # Constantes du jeu
    ├── state.js        # État global
    ├── save.js         # Sauvegarde localStorage
    ├── world.js        # Génération du monde
    ├── npc.js          # Bâtiments et personnages
    ├── player.js       # Mouvement FPS, physique
    ├── input.js        # Clavier et souris
    ├── interactions.js # Actions (achats, emplois)
    ├── jobs.js         # Salaires périodiques
    ├── hud.js          # Interface utilisateur
    ├── ui.js           # Menus, dialogues
    ├── render.js       # Boucle Three.js
    └── init.js         # Démarrage
```
