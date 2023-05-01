const Player = require('../models/player');
const {tileGenerator} = require('../utils/tiles');
const lodash = require('lodash');
const {INITIAL_TILES_COUNT} = require('../constant/constant');

class GameService {
  
  constructor(game) {
    this.game = game;
  }

  addPlayer(id, name) {
    const players = this.game.getPlayers();
    const clusters = this.game.getClusters();
    players.push(new Player(id, name, clusters.getRandomTiles(INITIAL_TILES_COUNT)));
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

  decideOrder() {
    const cluster = this.game.getClusters();
    const players = this.game.getPlayers();
    const tiles = cluster.getRandomTiles(this.game.requiredPlayers);
    const tilePlayerPair = lodash.zip(tiles, players);
    tilePlayerPair.forEach(([tile, player]) => {
      const text = `${player.playerName} got ${tileGenerator(tile)}`;
      this.game.activityLog.addLog('gotTile', text);
    });
    const orderedPair = tilePlayerPair.sort(([t1], [t2]) => t1 - t2);
    const [orderedTiles, orderedPlayers] = lodash.unzip(orderedPair);
    this.game.setPlacedTiles(orderedTiles);
    this.game.setPlayers(orderedPlayers);
  }

  setCurrentPlayerState() {
    let state = 'placeTile';
    this.game.currentPlayer.toggleTurn();
    const hasUnplayableTile = this.game.isAnyUnplayableTile().length;
    if (hasUnplayableTile) {
      state = 'unplayableTile';
      this.game.currentPlayer.statusMsg = 'It is your turn, do you want to replace unplayable tiles?';
    }
    this.game.currentPlayer.state = state;
  }

  setCurrentPlayerStatus() {
    this.game.currentPlayer.statusMsg = 'It is your turn, place a tile';
  }

  addInitialActivity() {
    this.game.activityLog.addLog('order', 'Order decide based on initial tiles');
    this.game.activityLog.addLog('tilePlaced', 'Initial tile placed');
    this.game.activityLog.addLog('turn', `${this.game.currentPlayer.playerName}'s turn`);
  }

  startGame() {
    if (this.hasAllPlayerJoined() && !this.game.hasStarted) {
      this.decideOrder();
      this.game.started = true;
      this.setCurrentPlayerState();
      this.setCurrentPlayerStatus();
      this.addInitialActivity();
      return this.game.started;
    }
  }
}

module.exports = GameService;
