function _startGame() {
  Render.init();
  Save.read();
  World.generate(State.scene);
  NPC.init(State.scene);
  Humans.init(State.scene);
  Cars.init(State.scene);
  Player.init();
  Input.init();
  HUD.init();
  UI.init();
  Fountain.init(State.scene);
  Hand.init();
  Render.animate();
}

// Attendre que le SDK de la plateforme soit prêt (Poki, CrazyGames, ou rien)
Poki.init().then(_startGame).catch(_startGame);
