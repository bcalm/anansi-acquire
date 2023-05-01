const Player = require('../models/player');

class GameService {
  
  constructor(game) {
    this.game = game;
  }

  addPlayer(id, name) {
    const players = this.game.getPlayers();
    const clusters = this.game.getClusters();
    players.push(new Player(id, name, clusters.getRandomTiles(6)));
  }

  hasAllPlayerJoined() {
    return this.game.getPlayers().length === this.game.requiredPlayers;
  }

  getPlayerNames() {
    return this.game.getPlayers().map(player => player.playerName);
  }

  remainingPlayers() {
    return this.game.requiredPlayers - this.getPlayerNames().length;
  }

  startGame() {
    if (this.hasAllPlayerJoined() && !this.game.hasStarted) {
      this.game.start();
    }
  }
}

module.exports = GameService;
