const fs = require('fs');
const GameService = require('../service/GameService');

const waitPage = fs.readFileSync('root/frontend/private/wait.html', 'utf8');

const serveWaitingPage = function(req, res) {
  const waitingHtml = waitPage.replace('GAME_ID', req.player.gameId);
  const gameService = new GameService(req.game);
  const [hosted] = gameService.getPlayerNames();
  res.send(waitingHtml.replace('HOSTED', hosted));
};

const serveStartGame = function(req, res) {
  const gameService = new GameService(req.game);
  gameService.startGame();
  req.player.location = '/play.html';
  res.redirect('play.html');
};

const replaceTiles = function (req, res, next) {
  const {tiles} = req.body;
  if(req.game.replaceTiles(tiles, req.player.playerId)) {
    return res.json(req.game.getStatus(req.player.playerId));
  }
  next();
};

const buyStocks = function(req, res, next) {
  const { corpsAndStocks } = req.body;
  if (req.game.buyStocks(corpsAndStocks, req.player.playerId)) {
    return res.json(req.game.getStatus(req.player.playerId));
  }
  next();
};

const getReferer = ({ referer }) => referer && referer.split('game')[1];

const redirectToPlayerLocation = function(req, res, next) {
  if (!req.player) {
    return res.redirect('/');
  }
  const location = getReferer(req.headers);
  if (req.player.location === req.url || req.player.location === location) {
    return next();
  }
  res.redirect(`/game${req.player.location}`);
};

const placeATile = function(req, res, next) {
  const { tile } = req.body;
  const gameService = new GameService(req.game);
  const isTilePlaced = gameService.placeATile(tile, req.player.playerId);
  if (isTilePlaced) {
    return res.json(gameService.getStatus(req.player.playerId));
  }
  next();
};

const establishCorporation = function(req, res, next) {
  const { tile, corporation } = req.body;
  if (req.game.establishCorporation(tile, corporation, req.player.playerId)) {
    return res.json(req.game.getStatus(req.player.playerId));
  }
  next();
};

const getGameStatus = function(req, res) {
  const { playerId } = req.player;
  const gameService = new GameService(req.game);
  res.json(gameService.getStatus(playerId));
};

const skipAction = function(req, res) {
  const id = req.player.playerId;
  const gameService = new GameService(req.game);
  res.json(gameService.skip(id));
};

const serveWaitStatus = function(req, res) {
  const gameService = new GameService(req.game);
  const hasJoined = gameService.hasAllPlayerJoined();
  const [, ...joined] = gameService.getPlayerNames();
  const remaining = gameService.remainingPlayers();
  res.json({ hasJoined, joined, remaining });
};

module.exports = {
  serveWaitingPage,
  serveStartGame,
  replaceTiles,
  buyStocks,
  serveWaitStatus,
  skipAction,
  getGameStatus,
  establishCorporation,
  placeATile,
  redirectToPlayerLocation,
};
