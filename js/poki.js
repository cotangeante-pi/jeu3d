// Wrapper SDK universel — détecte automatiquement Poki ou CrazyGames
const Poki = {
  _playing: false,
  _platform: null, // 'poki' | 'crazygames' | null

  init() {
    if (typeof PokiSDK !== 'undefined') {
      this._platform = 'poki';
      return PokiSDK.init();
    }
    if (typeof CrazyGames !== 'undefined') {
      this._platform = 'crazygames';
      return CrazyGames.SDK.init();
    }
    return Promise.resolve(); // dev local ou autre plateforme
  },

  start() {
    if (this._playing) return;
    this._playing = true;
    if (this._platform === 'poki')       PokiSDK.gameplayStart();
    if (this._platform === 'crazygames') CrazyGames.SDK.game.gameplayStart();
  },

  stop() {
    if (!this._playing) return;
    this._playing = false;
    if (this._platform === 'poki')       PokiSDK.gameplayStop();
    if (this._platform === 'crazygames') CrazyGames.SDK.game.gameplayStop();
  },

  ad(cb) {
    this.stop();
    if (this._platform === 'poki') {
      PokiSDK.commercialBreak().then(cb);
    } else if (this._platform === 'crazygames') {
      CrazyGames.SDK.ad.requestAd('midgame', { adFinished: cb, adError: cb });
    } else {
      cb(); // pas de SDK → relance directement
    }
  }
};
