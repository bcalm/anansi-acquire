const assert = require('chai').assert;
const sinon = require('sinon');
const Game = require('../lib/models/game');

describe('Game', () => {
  before(() => {
    const fake = sinon.fake.returns(0);
    sinon.replace(Math, 'floor', fake);
  });
  after(() => sinon.restore());
  describe('addPlayer', () => {
    it('should add a player with the given id, name and unique tiles', () => {
      const game = new Game(1, 2);
      game.addPlayer(12, 'test');
      game.addPlayer(13, 'test2');
      const expected = {
        name: 'test2',
        assets: {
          money: 6000,
          tiles: [6, 7, 8, 9, 10, 11],
          stocks: {
            phoenix: 0,
            quantum: 0,
            hydra: 0,
            fusion: 0,
            america: 0,
            sackson: 0,
            zeta: 0
          }
        },
        statusMsg: 'Wait for your turn',
        turn: false
      };
      assert.deepStrictEqual(game.getStatus(13).status.player, expected);

      const firstPlayerTiles = game.getStatus(12).status.player.assets.tiles;
      const secondPlayerTiles = game.getStatus(13).status.player.assets.tiles;
      assert.notDeepEqual(firstPlayerTiles, secondPlayerTiles);
    });
  });

  describe('setCurrentPlayerStatus', () => {
    it('should set current player status', () => {
      const game = new Game(1, 1);
      game.addPlayer(12, 'test');
      game.setCurrentPlayerStatus();
      const expected = {
        name: 'test',
        assets: {
          money: 6000,
          tiles: [0, 1, 2, 3, 4, 5],
          stocks: {
            phoenix: 0,
            quantum: 0,
            hydra: 0,
            fusion: 0,
            america: 0,
            sackson: 0,
            zeta: 0
          }
        },
        statusMsg: 'It is your turn, place a tile',
        turn: false
      };
      assert.deepStrictEqual(game.getStatus(12).status.player, expected);
    });
  });

  describe('hasAllPlayerJoined', () => {
    it('should give true when all players has joined', () => {
      const game = new Game(1, 1);
      game.addPlayer(12, 'test');
      assert.ok(game.hasAllPlayerJoined());
    });

    it('should give false when all players has not joined', () => {
      const game = new Game(1, 3);
      game.addPlayer(12, 'test');
      assert.notOk(game.hasAllPlayerJoined());
    });
  });

  describe('placeATile', () => {
    it('should move a tile from player\'s tile to placed tile', () => {
      const game = new Game(1, 1);
      game.addPlayer(12, 'test');
      game.players[0].state = 'placeTile';
      assert.ok(game.placeATile(5));
    });

    it('should not move a tile from player\'s tile to placed tile', () => {
      const game = new Game(1, 1);
      game.addPlayer(12, 'test');
      assert.notOk(game.placeATile('5C'));
    });
  });

  describe('getPlayerStatus', () => {
    it('should give player status of given id', () => {
      const game = new Game(1, 2);
      game.addPlayer(12, 'test');
      game.addPlayer(13, 'test2');
      const expected = {
        name: 'test2',
        assets: {
          money: 6000,
          tiles: [6, 7, 8, 9, 10, 11],
          stocks: {
            phoenix: 0,
            quantum: 0,
            hydra: 0,
            fusion: 0,
            america: 0,
            sackson: 0,
            zeta: 0
          }
        },
        statusMsg: 'Wait for your turn',
        turn: false
      };
      assert.deepStrictEqual(game.getPlayerStatus(13), expected);
    });
  });

  describe('getPlayerNames', () => {
    it('should give list of all players name', () => {
      const game = new Game(1, 2);
      game.addPlayer(12, 'test');
      game.addPlayer(13, 'test2');
      const expected = ['test', 'test2'];
      assert.deepStrictEqual(game.getPlayerNames(), expected);
    });
  });

  describe('requiredPlayers', () => {
    it('should give no of players require for the game', () => {
      const game = new Game(1, 4);
      assert.deepStrictEqual(game.requiredPlayers, 4);
    });
  });
});
