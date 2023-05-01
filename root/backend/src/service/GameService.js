class GameService {
  
  constructor(game) {
    this.game = game;
  }

  addPlayer(id, name) {
    this.game.addPlayer(id, name);
  }

  hasAllPlayerJoined() {
    return this.game.hasAllPlayerJoined();
  }
}

module.exports = GameService;
