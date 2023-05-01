const {INITIAL_PRICE} = require('../constant/constant');
const {updateActivityAfterBuyStocks} = require('./activityService');

const updateStocksAfterBuy = (corporations, currentPlayer, corpStocks) => {
  for (const corp in corpStocks) {
    if(corporations.removeStocks(corp, corpStocks[corp])){
      currentPlayer.addStocks(corp, corpStocks[corp]);
    }
  }
};

const getTotalStocks = function(corpStocks) {
  const stocks = Object.values(corpStocks);
  return stocks.reduce((totalStocks, stocks) => {
    return totalStocks + stocks;
  });
};

const isPlayerEligibleToBuyStocks = (corporations, playerMoney, corpStocks) => {
  const totalStocks = getTotalStocks(corpStocks);
  const moneyNeededToBuy = getStocksValue(corporations, corpStocks);
  const hasMoneyToBuyStocks = playerMoney >= moneyNeededToBuy;
  const maxiMumStocks = 3;
  return totalStocks <= maxiMumStocks && hasMoneyToBuyStocks;
};

const getStocksValue = (corporations, corpsStocks) => {
  const corpStocksPair = Object.entries(corpsStocks);
  return corpStocksPair.reduce((total, [corp, stocks]) => {
    const money = corporations.getCorporateStocksPrice(corp);
    const price = money * stocks;
    return total + price;
  }, INITIAL_PRICE);
};

const buyStocks = (activityLog, corporations, currentPlayer, corpStocks, id) => {
  const isValidUser = currentPlayer.getId === id;
  const playerEligibleToBuyStocks = isPlayerEligibleToBuyStocks(corporations, currentPlayer.getMoney, corpStocks);
  if( isValidUser && playerEligibleToBuyStocks) {
    const moneyNeededToBuy = getStocksValue(corporations, corpStocks);
    updateStocksAfterBuy(corporations, currentPlayer, corpStocks);
    updateActivityAfterBuyStocks(activityLog, currentPlayer.name, corpStocks);
    currentPlayer.deductMoney(moneyNeededToBuy);
    return true;
  }
};

module.exports = {buyStocks};
