const State = {
  // Stats joueur
  health: 100,
  hunger: 100,
  oxygen: 5,
  money: 50,
  iq: 0,
  badges: [],
  physicalStats: { strength: 10, speed: 10, endurance: 10 },
  currentJob: null,

  // Position joueur (démarrer sur une rue sûre x=14, z=14)
  posX: 14,
  posY: CONFIG.GROUND_Y + CONFIG.PLAYER_HALF_H,
  posZ: 14,

  // Vélocité
  velX: 0,
  velY: 0,
  velZ: 0,

  // Caméra
  yaw: 0,
  pitch: 0,

  // Flags
  paused: false,
  gameOver: false,
  isUnderwater: false,
  onGround: false,
  pointerLocked: false,

  // Input
  keys: {},
  mouseDX: 0,
  mouseDY: 0,

  // NPC / objets
  nearNPC: null,
  nearPickup: null,

  // Three.js refs (assignés par render.js)
  scene: null,
  camera: null,
  renderer: null,

  // Données monde (assignées par world.js)
  colliders: [],
  riverBox: null,
  pickups: [],
  npcs: [],

  // Inventaire hotbar
  inventory: Array(8).fill(null),
  selectedSlot: 0,

  // Système de crime (0=innocent, 1=mineur, 2=recherché, 3=très recherché)
  wanted: 0,
  wantedDecayTimer: 0,

  // Tâches de travail
  jobTask: null,       // objet tâche en cours
  jobTaskTimer: 0,     // temps avant la prochaine tâche

  // Mini-jeu boulangerie
  inWorkMode: false,

  // Voiture conduite
  inCar: false,
  drivingCar: null,
  nearCar: null,
  carPositions: {},   // { 'car_basic': {x, z, angle}, ... }

  // Timers
  autoSaveTimer: 0,
  salaryTimer: 0,

  // Escalade
  climbTimer: 0,
  isClimbing: false,

  // Bateaux / ponts
  bridgeZs: [],
  boats: [],

  // Temps de jeu (secondes in-game) — démarre à 08:00 jour 1
  // 1 seconde réelle = 20 secondes in-game → 1h in-game ≈ 3 min réelles
  gameTime: 28800,
};
