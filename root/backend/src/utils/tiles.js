const {TOTAL_TILES, ROW_SIZE, TILE_INITIAL_POSITION,
  NUMBER_TO_SUB_FOR_CONVERT_NUMBER_TO_INDEX
} = require('../constant/constant');

const getAdjacentTiles = function(placed, tile) {
  const [top, bottom, left, right] = [tile - ROW_SIZE,
    tile + ROW_SIZE, tile - NUMBER_TO_SUB_FOR_CONVERT_NUMBER_TO_INDEX,
    tile + NUMBER_TO_SUB_FOR_CONVERT_NUMBER_TO_INDEX];
  let adjTiles = [tile, top, left, right, bottom];
  if (tile % ROW_SIZE === TILE_INITIAL_POSITION) {
    adjTiles = [tile, top, right, bottom];
  }
  if (tile % ROW_SIZE === ROW_SIZE - NUMBER_TO_SUB_FOR_CONVERT_NUMBER_TO_INDEX) {
    adjTiles = [tile, top, left, bottom];
  }
  return adjTiles.filter(num => num >= TILE_INITIAL_POSITION && num < TOTAL_TILES && placed.includes(num));
};

module.exports = {
  getAdjacentTiles
};
