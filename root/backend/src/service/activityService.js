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

module.exports = {
  updateActivityAfterBuyStocks,
  updateActivityForMerge
};
