const Player = require('../models/player');
const {tileGenerator} = require('../utils/tiles');
const lodash = require('lodash');
const {INITIAL_TILES_COUNT} = require('../constant/constant');
const {increaseCorporate, getAdjacentPlacedTileList, placeNormalTile} = require('./tileService');
const {getAdjacentCorporate, getCorporationsInDescOrder} = require('./corporateService');
const {ZERO, ONE} = require('../constant/number');
const {updateActivityForMerge, addInitialActivity} = require('./activityService');
const {getMaxAndSecondMaxNumbers} = require('../utils/gameUtil');

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

  startGame() {
    if (this.hasAllPlayerJoined() && !this.game.hasStarted) {
      this.decideOrder();
      this.game.started = true;
      this.setCurrentPlayerState();
      this.setCurrentPlayerStatus();
      addInitialActivity(this.game.activityLog, this.game.currentPlayer.playerName);
      return this.game.started;
    }
  }

  getStatus(playerId) {
    return this.game.getStatus(playerId);
  }

  setPlayerStateAsBuyStocks(state) {
    if (state === 'establish' || state === 'no-corp') {
      const msg = 'You can buy stocks';
      this.game.changePlayerState('buyStocks', msg);
    }
  }

  skip(playerId) {
    if (this.game.currentPlayer.id === playerId) {
      const state = this.game.currentPlayer.state;
      if (state === 'buyStocks') {
        this.game.changePlayerTurn();
      }
      this.setPlayerStateAsBuyStocks(state);
    }
    return this.getStatus(playerId);
  }

  canPlayerPlaceTile(tile, id) {
    this.game.setUnincorporatedGroups();
    const state = this.game.currentPlayer.state;
    const isValidPlayer = this.game.currentPlayer.id === id;
    const isTilePresent = this.game.currentPlayer.hasTile(tile);
    return state === 'placeTile' && isValidPlayer && isTilePresent;
  }

  getCorporateStocks(corporate) {
    return this.game.players.reduce((corporateStock, player) => {
      const stocks = player.getStocks(corporate);
      if (stocks > ZERO) {
        corporateStock.push(stocks);
      }
      return corporateStock;
    }, []);
  }

  giveBonusToMaxStockHolders(bonus, stock, smallCorp) {
    const stockHolders = this.game.getPlayers().filter(player => {
      return player.stocks[smallCorp] === stock;
    });
    const holdersCount = stockHolders.length;
    const totalBonus = bonus.majority + bonus.minority;
    const bonusPerPlayer = totalBonus / holdersCount;
    const msg = `got $${bonusPerPlayer} majority and minority bonus`;
    this.giveBonus(stockHolders, bonusPerPlayer, msg);
  }

  distributeMinority(minority, stock, smallCorp) {
    const stockHolders = this.game.getPlayers().filter(player => {
      return player.stocks[smallCorp] === stock;
    });
    const holdersCount = stockHolders.length;
    const bonusPerPlayer = minority / holdersCount;
    const msg = `got $${bonusPerPlayer} minority bonus`;
    this.giveBonus(stockHolders, bonusPerPlayer, msg);
  }

  giveBonus(stockHolders, bonusPerPlayer, msg) {
    const names = [];
    stockHolders.forEach(player => {
      player.addMoney(bonusPerPlayer);
      player.statusMsg = `You ${msg}`;
      player.bonus = true;
      names.push(player.playerName);
    });
    this.game.activityLog.addLog('bonus', `${names.join(',')} ${msg}`);
  }

  giveBonusToStockHolders(bonus, stocks, smallCorp) {
    const [maxStocks, secondMaxStock] = stocks;
    const majorityHolder = this.game.getPlayers().find(player => {
      return player.stocks[smallCorp] === maxStocks;
    });
    majorityHolder.addMoney(bonus.majority);
    majorityHolder.statusMsg = `You got $${bonus.majority} majority bonus`;
    const name = majorityHolder.playerName;
    const msg = `${name} got $${bonus.majority} majority bonus`;
    this.game.activityLog.addLog('bonus', msg);
    this.game.distributeMinority(bonus.minority, secondMaxStock, smallCorp);
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
    const {majority, minority, isMerged} = this.game.corporations.mergeCorporate(
      bigCorp,
      smallCorp,
      tile
    );
    if (isMerged) {
      const adjacentPlacedTiles = getAdjacentPlacedTileList(this.game.placedTiles, this.game.unincorporatedTiles, tile);
      this.game.corporations.addTiles(bigCorp, adjacentPlacedTiles);
      updateActivityForMerge(this.game.currentPlayer.playerName, bigCorp, smallCorp, this.game.activityLog);
      this.distributeBonus({majority, minority}, smallCorp);
    }
    return isMerged;
  }

  manageTilePlacement(tile) {
    const adjacentCorp = getAdjacentCorporate(this.game.corporations, tile);
    const length = adjacentCorp.length;
    if (length === ZERO) {
      return placeNormalTile(this.game.placedTiles, tile);
    }

    if (length === ONE) {
      return increaseCorporate(this.game.corporations, this.game.placedTiles,
        this.game.unincorporatedTiles, tile, ...adjacentCorp);
    }
    return this.mergeCorporations(tile, adjacentCorp);
  }

  updateActivityForTilePlaced(tile) {
    const tileName = tileGenerator(tile);
    const name = this.game.currentPlayer.playerName;
    const activityMsg = `${name} placed ${tileName}. `;
    this.game.activityLog.addLog('tilePlaced', activityMsg);
  }

  checkCorpEstablishment() {
    const corpsLength = this.game.corporations.getInactiveCorporate().length;
    if (this.game.unincorporatedTiles.length > ZERO) {
      if (corpsLength > ZERO) {
        const msg = 'You can establish a corporation';
        return this.game.changePlayerState('establish', msg);
      }
      return this.game.changePlayerState('no-corps', 'No corporations available');
    }
    return false;
  }

  checkBuyStocks() {
    const corpsLength = this.game.corporations.getActiveCorporate().length;
    if (corpsLength > ZERO) {
      return this.game.changePlayerState('buyStocks', 'You can buy stocks');
    }
    this.game.changePlayerTurn();
    return true;
  }

  checkForState() {
    return this.checkCorpEstablishment() || this.checkBuyStocks();
  }

  placeATile(tile, playerId) {
    if (this.canPlayerPlaceTile(tile, playerId)) {
      const hasMerged = this.manageTilePlacement(tile);
      this.game.setUnincorporatedGroups();
      if (!hasMerged) {
        this.game.currentPlayer.statusMsg = 'Unplayable tile';
        return true;
      }
      this.updateActivityForTilePlaced(tile);
      this.game.currentPlayer.removeTile(tile);
      return this.checkForState();
    }
    return false;
  }
}

module.exports = GameService;
