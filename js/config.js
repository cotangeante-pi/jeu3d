const CONFIG = Object.freeze({
  // Monde
  WORLD_SIZE: 400,
  CITY_RADIUS: 80,
  GRID_STEP: 14,
  BUILDING_SIZE: 8,

  // Joueur
  PLAYER_SPEED: 5,
  JUMP_FORCE: 8,
  GRAVITY: -22,
  SENSITIVITY: 0.002,
  PLAYER_HALF_W: 0.3,
  PLAYER_HALF_H: 0.9,
  PLAYER_EYE_H: 1.6,
  GROUND_Y: 0,

  // Stats
  OXYGEN_MAX: 5,
  OXYGEN_DRAIN: 0.9,    // cercles/s sous l'eau
  OXYGEN_REGEN: 1.5,    // cercles/s à l'air
  HUNGER_DRAIN: 0.06,   // %/s passif (~28 min pour vider)
  HEALTH_REGEN: 0.2,    // %/s si hunger > 30

  // Interactions
  INTERACT_RANGE: 3.5,
  PICKUP_RANGE: 2.5,

  // Économie
  SALARY_INTERVAL: 60,  // secondes entre chaque salaire

  // Sauvegarde
  SAVE_KEY: 'jeu3d_save',
  AUTOSAVE_INTERVAL: 30,

  // Rivière
  RIVER_CENTER_X: -180,
  RIVER_WIDTH: 60,
  RIVER_LENGTH: 200,
});
