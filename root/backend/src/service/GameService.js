class GameService {
  
  constructor(game) {
    this.game = game;
  }

  addPlayer(id, name) {
    this.game.addPlayer(id, name);
  }
}

module.exports = GameService;
