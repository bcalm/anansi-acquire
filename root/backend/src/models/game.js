const lodash = require('lodash');
const ActivityLog = require('./activityLog');
const Cluster = require('./cluster');
const Corporations = require('./corporations');
const {getAdjacentTiles, tileGenerator} = require('../utils/tiles');
const {getAdjacentCorporate, getCorporationsInDescOrder} = require('../service/corporateService');
const {getAdjacentPlacedTileList, removePlacedTiles, increaseCorporate} = require('../service/tileService');
const {buyStocks} = require('../service/stockService');

const getGroups = function(groups, tiles) {
  const index = groups.findIndex(grp => tiles.some(tile => grp.includes(tile)));
  if (index >= 0) {
    groups[index] = [...new Set(groups[index].concat(tiles))];
    return groups;
  }
  tiles.length > 1 && groups.push(tiles);
  return groups;
};

const getMaxAndSecondMaxNumbers = function(numbers) {
  const sortedList = numbers.sort((n1, n2) => n2 - n1);
  const max = sortedList.shift();
  if (sortedList[0] === max) {
    return [max];
  }
  return [max, sortedList[0]];
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
    const msg = 'It is your turn, place a tile';
    this.currentPlayer.statusMsg = msg;
  }

  setCurrentPlayerState() {
    let state = 'placeTile';
    this.currentPlayer.toggleTurn();
    const hasUnplayableTile = this.isAnyUnplayableTile().length;
    if (hasUnplayableTile) {
      state = 'unplayableTile';
      const msg = 'It is your turn, do you want to replace unplayable tiles?';
      this.currentPlayer.statusMsg = msg;
    }
    this.currentPlayer.state = state;
  }

  get hasStarted() {
    return this.started;
  }
  
  setPlayerStateAsBuyStocks(state) {
    if (state === 'establish' || state === 'no-corp') {
      const msg = 'You can buy stocks';
      this.changePlayerState('buyStocks', msg);
    }
  }
  
  skip(playerId) {
    if (this.currentPlayer.id === playerId) {
      const state = this.currentPlayer.state;
      if (state === 'buyStocks') {
        this.changePlayerTurn();
      }
      this.setPlayerStateAsBuyStocks(state);
    }
    return this.getStatus(playerId);
  }
  
  changePlayerTurn() {
    this.currentPlayer.addTile(this.cluster.getRandomTiles(1).pop());
    this.currentPlayer.toggleTurn();
    this.currentPlayer.state = 'wait';
    this.currentPlayer.statusMsg = 'Wait for your turn';
    this.currentPlayerNo = ++this.currentPlayerNo % this.noOfPlayers;
    this.setCurrentPlayerStatus();
    this.activityLog.addLog('turn', `${this.currentPlayer.playerName}'s turn`);
    this.setCurrentPlayerState();
  }
  
  addInitialActivity() {
    this.activityLog.addLog('order', 'Order decide based on initial tiles');
    this.activityLog.addLog('tilePlaced', 'Initial tile placed');
    this.activityLog.addLog('turn', `${this.currentPlayer.playerName}'s turn`);
  }
  setPlacedTiles(orderedTiles) {
    this.placedTiles = this.placedTiles.concat(orderedTiles);
  }

  setPlayers(players) {
    this.players = players;
  }

  updateActivityForTilePlaced(tile) {
    const tileName = tileGenerator(tile);
    const name = this.currentPlayer.playerName;
    const activityMsg = `${name} placed ${tileName}. `;
    this.activityLog.addLog('tilePlaced', activityMsg);
  }
  
  canPlayerPlaceTile(tile, id) {
    this.setUnincorporatedGroups();
    const state = this.currentPlayer.state;
    const isValidPlayer = this.currentPlayer.id === id;
    const isTilePresent = this.currentPlayer.hasTile(tile);
    return state === 'placeTile' && isValidPlayer && isTilePresent;
  }

  getAdjacentCorporate(tile) {
    return getAdjacentCorporate(this.corporations, tile);
  }

  getAdjacentPlacedTileList(tile) {
    return getAdjacentPlacedTileList(this.placedTiles, this.unincorporatedTiles, tile);
  }

  manageTilePlacement(tile) {
    const adjacentCorp = this.getAdjacentCorporate(tile);
    const length = adjacentCorp.length;
    if (length === 0) {
      return this.placeNormalTile(tile);
    }

    if (length === 1) {
      return increaseCorporate(this.corporations, this.placedTiles, this.unincorporatedTiles, tile, ...adjacentCorp);
    }
    return this.mergeCorporations(tile, adjacentCorp);
  }

  isAnyUnplayableTile() {
    const tiles = this.currentPlayer.getStatus().assets.tiles;
    const unplayableTiles = tiles.filter(tile => {
      const adjacentCorp = this.getAdjacentCorporate(tile);
      if (adjacentCorp.length > 1) {
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

  placeNormalTile(tile) {
    this.placedTiles.push(tile);
    return true;
  }

  getCorporateStocks(corporate) {
    return this.players.reduce((corporateStock, player) => {
      const stocks = player.getStocks(corporate);
      if (stocks > 0) {
        corporateStock.push(stocks);
      }
      return corporateStock;
    }, []);
  }

  giveBonusToMaxStockHolders(bonus, stock, smallCorp) {
    const stockHolders = this.players.filter(player => {
      return player.stocks[smallCorp] === stock;
    });
    const holdersCount = stockHolders.length;
    const totalBonus = bonus.majority + bonus.minority;
    const bonusPerPlayer = totalBonus / holdersCount;
    const msg = `got $${bonusPerPlayer} majority and minority bonus`;
    const names = [];
    stockHolders.forEach(player => {
      player.addMoney(bonusPerPlayer);
      player.statusMsg = `You ${msg}`;
      player.bonus = true;
      names.push(player.playerName);
    });
    this.activityLog.addLog('bonus', `${names.join(',')} ${msg}`);
  }
  
  distributeMinority(minority, stock, smallCorp) {
    const stockHolders = this.players.filter(player => {
      return player.stocks[smallCorp] === stock;
    });
    const holdersCount = stockHolders.length;
    const bonusPerPlayer = minority / holdersCount;
    const msg = `got $${bonusPerPlayer} minority bonus`;
    const names = [];
    stockHolders.forEach(player => {
      player.addMoney(bonusPerPlayer);
      player.statusMsg = `You ${msg}`;
      player.bonus = true;
      names.push(player.playerName);
    });
    this.activityLog.addLog('bonus', `${names.join(',')} ${msg}`);
  }

  giveBonusToStockHolders(bonus, stocks, smallCorp) {
    const [maxStocks, secondMaxStock] = stocks;
    const majorityHolder = this.players.find(player => {
      return player.stocks[smallCorp] === maxStocks;
    });
    majorityHolder.addMoney(bonus.majority);
    majorityHolder.statusMsg = `You got $${bonus.majority} majority bonus`;
    const name = majorityHolder.playerName;
    const msg = `${name} got $${bonus.majority} majority bonus`;
    this.activityLog.addLog('bonus', msg);
    this.distributeMinority(bonus.minority, secondMaxStock, smallCorp);
  }
  
  distributeBonus(bonus, smallCorp) {
    const corporateStocks = this.getCorporateStocks(smallCorp);
    const stocks = getMaxAndSecondMaxNumbers(corporateStocks.slice());
    const [maxStock, secondMaxStock] = stocks;
    if (!secondMaxStock) {
      return this.giveBonusToMaxStockHolders(bonus, maxStock, smallCorp);
    }
    this.giveBonusToStockHolders(bonus, stocks, smallCorp);
  }
  
  mergeCorporations(tile, corporations) {
    const sortedCorp = getCorporationsInDescOrder(corporations);
    const [bigCorp, smallCorp] = sortedCorp;
    const {majority, minority, isMerged} = this.corporations.mergeCorporate(
      bigCorp,
      smallCorp,
      tile
    );
    if (isMerged) {
      const adjacentPlacedTiles = this.getAdjacentPlacedTileList(tile);
      this.corporations.addTiles(bigCorp, adjacentPlacedTiles);
      this.updateActivityForMerge(bigCorp, smallCorp);
      this.distributeBonus({majority, minority}, smallCorp);
    }
    return isMerged;
  }
  
  updateActivityForMerge(bigCorp, smallCorp) {
    const mergeMaker = this.currentPlayer.playerName;
    const mergeMsg = `${mergeMaker} merged ${smallCorp} with ${bigCorp}`;
    this.activityLog.addLog('merge', mergeMsg);
  }
  
  checkCorpEstablishment() {
    const corpsLength = this.corporations.getInactiveCorporate().length;
    if (this.unincorporatedTiles.length > 0) {
      if (corpsLength > 0) {
        const msg = 'You can establish a corporation';
        return this.changePlayerState('establish', msg);
      }
      return this.changePlayerState('no-corps', 'No corporations available');
    }
    return false;
  }
  
  checkBuyStocks() {
    const corpsLength = this.corporations.getActiveCorporate().length;
    if (corpsLength > 0) {
      return this.changePlayerState('buyStocks', 'You can buy stocks');
    }
    this.changePlayerTurn();
    return true;
  }
  
  checkForState() {
    return this.checkCorpEstablishment() || this.checkBuyStocks();
  }

  placeATile(tile, playerId) {
    if (this.canPlayerPlaceTile(tile, playerId)) {
      const hasMerged = this.manageTilePlacement(tile);
      this.setUnincorporatedGroups();
      if (!hasMerged) {
        this.currentPlayer.statusMsg = 'Unplayable tile';
        return true;
      }
      this.updateActivityForTilePlaced(tile);
      this.currentPlayer.removeTile(tile);
      return this.checkForState();
    }
    return false;
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
      if (this.corporations.removeStocks(corporation, 1)) {
        const player = this.getPlayer(playerId);
        player.addStocks(corporation, 1);
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
    const data = { state, ...stateData[state] };
    return data;
  }
  
  getStatus(playerId){
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
