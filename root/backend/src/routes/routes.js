const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const {gameRouter} = require('./gameRouter');
const {
  joinGame,
  createGame,
  redirectToGame,
  findPlayerWithGame,
  hasFields
} = require('../handler/handlers');

const app = express();

app.locals.games = {};
app.locals.sessions = {};

app.use(morgan('tiny'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());
app.use(findPlayerWithGame);
app.get([/\/$/, '/Users/bcalm/anansi-acquire/root/frontend/public/host.html',
  '/Users/bcalm/anansi-acquire/root/frontend/public/join.html'], redirectToGame);
app.use('/game', gameRouter);
app.use(express.static('/Users/bcalm/anansi-acquire/root/frontend/public'));
app.post('/joinGame', hasFields('name', 'gameId'), joinGame);
app.post('/hostGame', hasFields('name', 'noOfPlayers'), createGame);

module.exports = {app};
