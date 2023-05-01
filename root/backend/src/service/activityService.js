const updateActivityAfterBuyStocks = (activityLog, playerName, corpStocks) => {
  let activityMsg = `${playerName} bought `;
  for (const corp in corpStocks) {
    activityMsg = `${activityMsg} ${corp} ${corpStocks[corp]}`;
  }
  activityLog.addLog('buy', activityMsg);
};

const updateActivityForMerge = (mergeMaker, bigCorp, smallCorp, activityLog) => {
  const mergeMsg = `${mergeMaker} merged ${smallCorp} with ${bigCorp}`;
  activityLog.addLog('merge', mergeMsg);
};

const addInitialActivity = (activityLog, playerName) => {
  activityLog.addLog('order', 'Order decide based on initial tiles');
  activityLog.addLog('tilePlaced', 'Initial tile placed');
  activityLog.addLog('turn', `${playerName}'s turn`);
};

module.exports = {
  updateActivityAfterBuyStocks,
  updateActivityForMerge,
  addInitialActivity
};
