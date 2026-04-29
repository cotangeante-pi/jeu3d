# Jeu 3D — RPG de survie en ville (Mobile / Tablette)

Un jeu de survie/RPG 3D en vue FPS jouable directement dans le navigateur, sans installation.

## Jouer

Ouvre simplement `index.html` dans Chrome ou Safari sur mobile. Aucun serveur requis.

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
- **Minimap** (rond, coin) : routes, NPCs (vert), piétons (jaune), police (rouge), joueur (blanc + flèche)
- **Horloge in-game** : 1 s réelle = 60 s in-game — un jour complet = 24 min réelles

### Contrôles tactiles — monde principal
| Contrôle | Action |
|----------|--------|
| **Joystick gauche** | Se déplacer |
| **Glisser à droite** | Regarder / orienter la caméra |
| **Bouton Saut** | Sauter (maintenu contre un mur → escalader) |
| **Bouton Interagir** | Interagir avec un NPC / ramasser un objet |
| **Bouton Poing** | Frapper |
| **Bouton T** | Entrer / quitter un poste de travail |
| **Bouton Voiture** | Monter / descendre d'une voiture |
| **Bouton Boost** | Sprint à pied / boost en voiture (`Shift`) |
| **Tap sur un slot** | Changer de slot dans la hotbar |
| Clavier physique supporté pour tests sur desktop |  |

### Contrôles — voiture
| Contrôle | Action |
|----------|--------|
| **Joystick** | Accélérer / freiner / tourner |
| **Bouton Boost** | Boost |

### Contrôles — Circuit de Vitesse
| Contrôle | Action |
|----------|--------|
| **Joystick haut** | Accélérer |
| **Joystick bas** | Freiner |
| **Joystick gauche / droite** | Virer |

### Inventaire (hotbar)
Les objets ramassés (pommes…) s'empilent dans les 8 slots en bas de l'écran.
Tape sur un slot pour le sélectionner, puis **bouton Interagir** pour manger la nourriture sélectionnée.

---

## Emplois & Mini-jeux

Chaque emploi rapporte un **salaire automatique** toutes les 60 secondes.
Approche la zone de travail marquée, puis appuie sur **T** pour lancer le mini-jeu.

| Emploi | Mini-jeu |
|--------|----------|
| 🍞 **Boulanger** | Monde téléporté — pratique de la boulangerie en 3D |
| 💼 **Comptable** | Overlay bureautique (multi-clic, maintien…) |
| 🔒 **Agent de sécurité** | Overlay (rondes, surveillance) |
| 👨‍🍳 **Chef cuisinier** | Overlay cuisine (couper, saisir, dresser…) |
| 🏥 **Médecin** | Overlay médical |
| 🏦 **Banquier** | Overlay financier |
| 🛒 **Caissier** | Overlay caisse |
| 🏗 **Ouvrier** | Overlay chantier |
| 💉 **Infirmier** | Overlay soins |
| 🚴 **Coach** | Équilibre sur monocycle — maintenir le joystick dans la zone verte |
| 🏃 **Athlète** | Épreuves d'athlétisme individuelles |
| 🏟 **Athlète (Arène)** | Portail arène — Sprint, Saut en longueur, Saut en hauteur, 110 m haies |
| 🏎 **Circuit de Vitesse** | Course automobile 3D (modes Record & Pistes) |
| 🏨 **Gestionnaire d'hôtel** | Accueillir les clients, attribuer les chambres et maintenir leur satisfaction — inspiré de My Perfect Hotel |
| ⚽ **Footballeur** | Mini-jeu de football : tirs, dribbles et matchs |
| 🌾 **Fermier** | Cultiver, récolter et vendre les produits de la ferme |

### Circuit de Vitesse — détail
- **Mode Record** : chrono solo, avec voiture fantôme (ghost) de ta meilleure course
- **Mode Pistes** : contre 1 à 7 adversaires IA avec rubber-band
- **5 pistes** : Ovale · Lac · Montagne · Circuit Urbain · Infini ∞
- Gains selon la place (Pistes) ou selon le record battu (Record)

---

## Voitures

Achète une voiture au concessionnaire, puis approche-toi et appuie sur **Voiture** pour conduire.
**Boost** active le turbo. La caméra passe en vue troisième personne.

---

## Transports légers

Un magasin en ville propose de petits engins de déplacement urbain : vélo, patins à roulettes, skateboard, et d'autres encore. Chaque engin a sa propre maniabilité et sa vitesse. Idéal pour se faufiler dans la ville sans voiture.

---

## Logement

Tu peux devenir propriétaire d'une maison en ville. Une fois acquise, approche-toi de la porte et appuie sur **Interagir** pour l'ouvrir ou la fermer — la porte s'anime à l'ouverture et à la fermeture. Tu peux entrer et sortir librement, et ta maison te sert de refuge.

---

## Monde des Jeux de Société

Au cœur de la ville se dresse une structure monumentale, impossible à ignorer — elle interpelle le regard dès qu'on passe à proximité. Approche-toi et appuie sur **Interagir** pour y entrer : le jeu 3D se met automatiquement en pause et sauvegarde ta progression.

Tu es alors téléporté dans un salon dédié aux jeux de société. Une liste de jeux s'affiche à l'écran — choisis-en un et affronte des adversaires IA. Une fois ta partie terminée, tu reprends ta vie en ville exactement là où tu l'avais laissée.

---

## Système policier

Frapper quelqu'un ou commettre un crime monte le niveau de recherche (★).
- ★ : les policiers à pied te poursuivent
- ★★★ : les voitures de police interviennent

Quand un policier te rattrape, il s'immobilise 5 secondes près de toi. Si tu tentes de courir et qu'il est encore à portée, tu prends des dégâts. Au bout de 5 secondes : amende −100$ et wanted remis à zéro. Cache-toi 15 secondes hors de vue pour que le niveau baisse seul.

---

## Monde

- Grande zone urbaine (rayon ~320 m) avec rues, bâtiments jusqu'à 54 m, établissements
- 60 piétons, 12 policiers à pied, 6 voitures de police patrouillant en ville
- Forêt dense tout autour avec pommes au sol
- **Rivière à l'ouest** — attention à l'oxygène en nageant ; 3 voiliers y naviguent en continu
- **Fontaine** près du spawn — bonus d'argent
- Cycle jour/nuit dynamique (ciel, brouillard, lumières) calé sur l'heure réelle

---

## Sons

Presque toutes les actions du jeu sont accompagnées d'un effet sonore : déplacements, sauts, coups, interactions avec les NPCs, ramassage d'objets, repas, achats, salaires, mini-jeux, et bien d'autres.

---

## Sauvegarde

Progression **sauvegardée automatiquement** toutes les 30 secondes (localStorage), et à chaque achat, emploi ou mission accomplie.

---

## Technologies

- [Three.js](https://threejs.org/) r160 — rendu 3D
- HTML / CSS / JavaScript vanilla — aucune dépendance supplémentaire
- localStorage — sauvegarde locale

---

## Structure du projet

```
jeu3dmobile/
├── index.html              # Point d'entrée
├── css/
│   ├── style.css           # Layout, overlays, boutons tactiles
│   └── hud.css             # Barres, cercles, badges, hotbar
└── js/
    ├── three.min.js        # Librairie 3D (locale)
    ├── config.js           # Constantes du jeu
    ├── state.js            # État global partagé
    ├── save.js             # Sauvegarde / chargement localStorage
    ├── init.js             # Démarrage et initialisation
    ├── render.js           # Boucle Three.js, dispatch des ticks
    ├── input.js            # Joystick tactile, zone regard, boutons action
    ├── world.js            # Génération du monde (sol, rivière, ville, forêt, jour/nuit)
    ├── npc.js              # Bâtiments NPC et personnages fixes
    ├── humans.js           # Piétons et police (IA, poursuite, wanted)
    ├── cars.js             # Voitures conduisibles (physique, caméra TPS)
    ├── player.js           # Mouvement FPS, physique, survie, escalade
    ├── hand.js             # Main 3D visible (animations marche, frappe, saut)
    ├── fountain.js         # Fontaine interactive (bonus $)
    ├── interactions.js     # Actions (achats, ramassage, manger, frapper)
    ├── jobs.js             # Zones d'emploi, salaires, dispatch mini-jeux
    ├── work_overlay.js     # Mini-jeux overlay (chef, comptable, sécurité…)
    ├── bakery.js           # Mini-jeu boulangerie 3D
    ├── athletics.js        # Mini-jeu coach (monocycle, équilibre)
    ├── circuit_vitesse.js  # Mini-jeu course automobile 3D
    ├── monde_teleporte.js  # Portail arène — athlétisme multi-épreuves
    ├── hud.js              # Interface HUD (jauges, hotbar, badges…)
    ├── ui.js               # Menus, dialogues, pause, game over
    ├── tutorial.js         # Tutoriel première connexion
    └── poki.js             # Wrapper SDK Poki / CrazyGames
```
