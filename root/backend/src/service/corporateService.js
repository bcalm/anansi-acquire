const {getAdjacentTiles} = require('../utils/tiles');
const lodash = require('lodash');
const {ONE} = require('../constant/number');

const getAdjacentCorporate = (corporations, tile) => {
  const activeCorp = corporations.getActiveCorporate();
  const adjacentCorp = [];
  const status = corporations.status;
  activeCorp.forEach(corp => {
    const tiles = status[corp].tiles;
    const adjacentTiles = getAdjacentTiles(tiles, tile);
    if (adjacentTiles.length) {
      adjacentCorp.push(corp);
    }
  });
  return adjacentCorp;
};

const getCorporationsInDescOrder = (corporations) => {
  const areas = corporations.map(corp => {
    return corp.area;
  });
  const areaCorpPair = lodash.zip(areas, corporations);
  const sortedPair = areaCorpPair.sort(([a1], [a2]) => {
    return a2 - a1;
  });
  return lodash.unzip(sortedPair)[ONE];
};

module.exports = {
  getAdjacentCorporate,
  getCorporationsInDescOrder
};
