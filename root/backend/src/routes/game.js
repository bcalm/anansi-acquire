const express = require('express');
const {
  hasFields,
  
} = require('../handler/appHandler');
const {serveWaitingPage,
  serveStartGame,
  replaceTiles,
  buyStocks,
  serveWaitStatus,
  placeATile,
  getGameStatus,
  establishCorporation,
  skipAction,
  redirectToPlayerLocation,
} = require('../handler/gameHandler');

const game = express();
game.use(redirectToPlayerLocation);
game.use(express.static('root/frontend/private'));
game.get('/waiting', serveWaitingPage);
game.get('/wait', serveWaitStatus);
game.get('/start', serveStartGame);
game.get('/update', getGameStatus);
game.post('/skip', hasFields('action'), skipAction);
game.post('/placeTile', hasFields('tile'), placeATile);
game.post(
  '/establish',
  hasFields('tile', 'corporation'),
  establishCorporation
);
game.post('/buyStocks', hasFields('corpsAndStocks'), buyStocks);
game.post('/replaceTiles', hasFields('tiles'), replaceTiles);

module.exports = { gameRouter: game };
