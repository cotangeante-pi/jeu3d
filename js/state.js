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

  // Timers
  autoSaveTimer: 0,
  salaryTimer: 0,
};
