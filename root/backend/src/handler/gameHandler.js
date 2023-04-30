const fs = require('fs');

const waitPage = fs.readFileSync('root/frontend/private/wait.html', 'utf8');

const serveWaitingPage = function(req, res) {
  const waitingHtml = waitPage.replace('GAME_ID', req.player.gameId);
  const [hosted] = req.game.getPlayerNames();
  res.send(waitingHtml.replace('HOSTED', hosted));
};

const serveStartGame = function(req, res) {
  if (req.game.hasAllPlayerJoined() && !req.game.hasStarted) {
    req.game.start();
  }
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
  if (req.game.placeATile(tile, req.player.playerId)) {
    return res.json(req.game.getStatus(req.player.playerId));
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
  res.json(req.game.getStatus(playerId));
};

const skipAction = function(req, res) {
  const id = req.player.playerId;
  res.json(req.game.skip(id));
};

const serveWaitStatus = function(req, res) {
  const hasJoined = req.game.hasAllPlayerJoined();
  const [, ...joined] = req.game.getPlayerNames();
  const remaining = req.game.requiredPlayers - req.game.getPlayerNames().length;
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
