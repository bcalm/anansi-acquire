const Game = require('../models/game.js');
const GameService = require('../service/GameService');

const hasFields = (...fields) => {
  return (req, res, next) => {
    if (fields.every(field => field in req.body)) {
      return next();
    }
    res.statusCode = 400;
    res.send('Bad Request');
  };
};

const addPlayer = function(req, res, game, sessions) {
  const { gameId, name } = req.body;
  const id = getPlayerId();
  const sessionId = generateSessionId();
  const gameService = new GameService(game);
  gameService.addPlayer(id, name);
  sessions[sessionId] = { gameId, playerId: id, location: '/waiting' };
  res.cookie('sessionId', sessionId).json({ isAnyError: false });
};

const joinGame = function(req, res) {
  const { gameId } = req.body;
  const { games, sessions } = req.app.locals;
  const game = games[gameId];
  if (!game) {
    return res.json({ isAnyError: true, msg: 'Invalid game id' });
  }
  const gameService = new GameService(game);
  if (gameService.hasAllPlayerJoined()) {
    return res.json({ isAnyError: true, msg: 'The game has already started' });
  }
  addPlayer(req, res, game, sessions);
};

const redirectToGame = function(req, res, next) {
  if (req.player) {
    return res.redirect(`/game${req.player.location}`);
  }
  next();
};

const findPlayerWithGame = function(req, res, next) {
  const { sessions, games } = req.app.locals;
  const { sessionId } = req.cookies;
  if (sessionId && sessions[sessionId]) {
    req.player = sessions[sessionId];
    req.game = games[req.player.gameId];
  }
  return next();
};

const generateSequence = function(num) {
  let initialNum = num;
  return () => ++initialNum;
};

const initialPlayerId = 0;
const initialGameID = 1234;
const generateGameId = generateSequence(initialGameID);
const generateSessionId = generateSequence(new Date().getTime());
const getPlayerId = generateSequence(initialPlayerId);

const createGame = function(req, res) {
  const { name, noOfPlayers } = req.body;
  const { sessions, games } = req.app.locals;
  const gameId = generateGameId();
  const sessionId = generateSessionId();
  const game = new Game(gameId, +noOfPlayers);
  games[gameId] = game;
  const id = getPlayerId();
  const gameService = new GameService(game);
  gameService.addPlayer(id, name);
  sessions[sessionId] = { gameId, playerId: id, location: '/waiting' };
  res.cookie('sessionId', sessionId);
  res.redirect('game/waiting');
};

module.exports = {
  joinGame,
  redirectToGame,
  findPlayerWithGame,
  createGame,
  hasFields,
};
