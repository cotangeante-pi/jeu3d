(function () {
  // 1. Initialiser le renderer et la scène Three.js
  Render.init();

  // 2. Restaurer la sauvegarde si elle existe
  Save.read();

  // 3. Générer le monde
  World.generate(State.scene);

  // 4. Placer les NPCs
  NPC.init(State.scene);

  // 4b. Initialiser les objets Three.js du joueur
  Player.init();

  // 5. Écouter les contrôles
  Input.init();

  // 6. Initialiser le HUD
  HUD.init();

  // 7. Initialiser les overlays UI
  UI.init();

  // 8. Démarrer la boucle de rendu
  Render.animate();
})();
