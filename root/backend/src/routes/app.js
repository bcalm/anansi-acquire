const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const {gameRouter} = require('./game');
const {
  joinGame,
  createGame,
  redirectToGame,
  findPlayerWithGame,
  hasFields
} = require('../handler/appHandler');

const app = express();

app.locals.games = {};
app.locals.sessions = {};

app.use(morgan('tiny'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());
app.use(findPlayerWithGame);
app.get([/\/$/, '/root/frontend/public/host.html',
  '/root/frontend/public/join.html'], redirectToGame);
app.use('/game', gameRouter);
app.use(express.static('root/frontend/public'));
app.post('/joinGame', hasFields('name', 'gameId'), joinGame);
app.post('/hostGame', hasFields('name', 'noOfPlayers'), createGame);

module.exports = {app};
