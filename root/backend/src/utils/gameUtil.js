const {ZERO} = require('../constant/number');
const getMaxAndSecondMaxNumbers = function(numbers) {
  const sortedList = numbers.sort((n1, n2) => n2 - n1);
  const max = sortedList.shift();
  if (sortedList[ZERO] === max) {
    return [max];
  }
  return [max, sortedList[ZERO]];
};

module.exports = {
  getMaxAndSecondMaxNumbers
};
