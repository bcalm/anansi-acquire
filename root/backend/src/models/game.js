const lodash = require('lodash');
const ActivityLog = require('./activityLog');
const Cluster = require('./cluster');
const Corporations = require('./corporations');
const {getAdjacentTiles, tileGenerator} = require('../utils/tiles');
const {
  getAdjacentCorporate,
  getCorporationsInDescOrder
} = require('../service/corporateService');
const {removePlacedTiles} = require('../service/tileService');
const {buyStocks} = require('../service/stockService');
const {ONE, ZERO} = require('../constant/number');

const getGroups = function (groups, tiles) {
  const index = groups.findIndex(grp => tiles.some(tile => grp.includes(tile)));
  if (index >= ZERO) {
    groups[index] = [...new Set(groups[index].concat(tiles))];
    return groups;
  }
  tiles.length > ONE && groups.push(tiles);
  return groups;
};

class Game {
  constructor(id, noOfPlayers) {
    this.id = id;
    this.noOfPlayers = noOfPlayers;
    this.players = [];
    this.currentPlayerNo = 0;
    this.cluster = Cluster.createTiles();
    this.activityLog = new ActivityLog();
    this.placedTiles = [];
    this.started = false;
    this.corporations = new Corporations();
    this.unincorporatedTiles = [];
  }

  get requiredPlayers() {
    return this.noOfPlayers;
  }

  getPlayers() {
    return this.players;
  }

  getClusters() {
    return this.cluster;
  }

  get currentPlayer() {
    return this.players[this.currentPlayerNo];
  }

  setCurrentPlayerStatus() {
    this.currentPlayer.statusMsg = 'It is your turn, place a tile';
  }

  setCurrentPlayerState() {
    let state = 'placeTile';
    this.currentPlayer.toggleTurn();
    const hasUnplayableTile = this.isAnyUnplayableTile().length;
    if (hasUnplayableTile) {
      state = 'unplayableTile';
      this.currentPlayer.statusMsg = 'It is your turn, do you want to replace unplayable tiles?';
    }
    this.currentPlayer.state = state;
  }

  get hasStarted() {
    return this.started;
  }

  changePlayerTurn() {
    this.currentPlayer.addTile(this.cluster.getRandomTiles(ONE).pop());
    this.currentPlayer.toggleTurn();
    this.currentPlayer.state = 'wait';
    this.currentPlayer.statusMsg = 'Wait for your turn';
    this.currentPlayerNo = ++this.currentPlayerNo % this.noOfPlayers;
    this.setCurrentPlayerStatus();
    this.activityLog.addLog('turn', `${this.currentPlayer.playerName}'s turn`);
    this.setCurrentPlayerState();
  }
  setPlacedTiles(orderedTiles) {
    this.placedTiles = this.placedTiles.concat(orderedTiles);
  }

  setPlayers(players) {
    this.players = players;
  }

  getAdjacentCorporate(tile) {
    return getAdjacentCorporate(this.corporations, tile);
  }

  isAnyUnplayableTile() {
    const tiles = this.currentPlayer.getStatus().assets.tiles;
    const unplayableTiles = tiles.filter(tile => {
      const adjacentCorp = this.getAdjacentCorporate(tile);
      if (adjacentCorp.length > ONE) {
        const [, smallCorp] = getCorporationsInDescOrder(adjacentCorp);
        return this.corporations.isStable(smallCorp);
      }
      return false;
    });
    this.unplayableTiles = unplayableTiles;
    return unplayableTiles;
  }

  updateActivityForReplaceUnplayableTiles(tiles) {
    const oldTilesNames = tiles.map(tileGenerator).join(',');
    const name = this.currentPlayer.playerName;
    const msg = `${name} replace ${oldTilesNames} unplayable tiles`;
    this.activityLog.addLog('replaceTile', msg);
  }

  replaceTiles(tiles, playerId) {
    const hasUnplayableTile = lodash.isEqual(this.unplayableTiles, tiles);
    if (this.currentPlayer.getId === playerId && hasUnplayableTile) {
      tiles.forEach(tile => this.currentPlayer.removeTile(tile));
      const tileCount = tiles.length;
      const newTiles = this.cluster.getRandomTiles(tileCount);
      newTiles.forEach(tile => this.currentPlayer.addTile(tile));
      this.currentPlayer.state = 'placeTile';
      this.updateActivityForReplaceUnplayableTiles(tiles);
      this.setCurrentPlayerStatus();
      return true;
    }
  }

  getPlayer(id) {
    return this.players.find(player => player.id === id);
  }

  updateActivityAfterEstablish(corporation) {
    const activityMsg = `${this.currentPlayer.name} established ${corporation}`;
    this.activityLog.addLog('establish', activityMsg);
  }

  canPlayerEstablishCorp(tiles, corporation, playerId) {
    const isValidPlayer = this.currentPlayer.id === playerId;
    if (!isValidPlayer || !tiles) {
      return false;
    }
    return this.corporations.establishCorporate(corporation, tiles);
  }

  establishCorporation(tile, corporation, playerId) {
    const tiles = this.unincorporatedTiles.find(group => group.includes(tile));
    if (this.canPlayerEstablishCorp(tiles, corporation, playerId)) {
      removePlacedTiles(this.placedTiles, tiles);
      if (this.corporations.removeStocks(corporation, ONE)) {
        const player = this.getPlayer(playerId);
        player.addStocks(corporation, ONE);
      }
      this.updateActivityAfterEstablish(corporation);
      this.changePlayerState('buyStocks', 'You can buy stocks');
      return true;
    }
    return false;
  }

  buyStocks(corpStocks, id) {
    const isTransactionHappened = buyStocks(this.activityLog, this.corporations, this.currentPlayer,
      corpStocks, id);
    if (isTransactionHappened) {
      this.changePlayerTurn();
      return true;
    }
  }

  getPlayerStatus(id) {
    for (let index = 0; index < this.noOfPlayers; index++) {
      if (this.players[index].getId === id) {
        return this.players[index].getStatus();
      }
    }
  }

  getPlayerNames() {
    return this.players.map(player => player.playerName);
  }

  changePlayerState(state, msg) {
    this.currentPlayer.statusMsg = msg;
    this.currentPlayer.state = state;
    return true;
  }

  setUnincorporatedGroups() {
    this.unincorporatedTiles = this.placedTiles.reduce((groups, tile) => {
      groups.push(getAdjacentTiles(this.placedTiles.slice(), tile));
      return groups.reduce(getGroups, []);
    }, []);
  }

  getStateData(playerId) {
    const stateData = {
      'establish': {
        availableCorporations: this.corporations.getInactiveCorporate(),
        groups: this.unincorporatedTiles
      },
      'buyStocks': {
        activeCorps: this.corporations.getActiveCorporate(),
      },
      'unplayableTile': {
        unplayableTiles: this.unplayableTiles
      }
    };

    const player = this.getPlayer(playerId);
    const state = player.state;
    return {state, ...stateData[state]};
  }

  getStatus(playerId) {
    return {
      status: {
        placedTiles: this.placedTiles,
        corporations: this.corporations.status,
        player: this.getPlayerStatus(playerId),
        playersProfile: {
          allPlayersName: this.getPlayerNames(),
          currentPlayer: this.currentPlayerNo
        },
        activity: this.activityLog.logs
      },
      action: this.getStateData(playerId)
    };
  }
}

module.exports = Game;
