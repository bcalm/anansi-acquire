const {getAdjacentTiles} = require('../utils/tiles');
const {TILE_DELETE_COUNT} = require('../constant/constant');

const placeNormalTile = (placedTiles, tile) => {
  placedTiles.push(tile);
  return true;
};

const increaseCorporate = (corporations, placedTiles, unincorporatedTiles, tile, corporate) => {
  const adjacentPlacedTiles = getAdjacentPlacedTileList(placedTiles, unincorporatedTiles, tile);
  corporations.addTiles(corporate, adjacentPlacedTiles);
  removePlacedTiles(placedTiles, adjacentPlacedTiles);
  corporations.addTiles(corporate, tile);
  return true;
};

const removePlacedTiles = (placedTiles, tiles) => {
  tiles.forEach(tile => {
    const index = placedTiles.indexOf(tile);
    placedTiles.splice(index, TILE_DELETE_COUNT);
  });
};

const getAdjacentPlacedTileList = (placedTiles, unincorporatedTiles, tile) => {
  const adjacentTiles = getAdjacentTiles(placedTiles.slice(), tile);
  return adjacentTiles.reduce((group, adjacentTile) => {
    if (group.includes(adjacentTile)) {
      return group;
    }
    const includeGroup = unincorporatedTiles.find(adjacentGroup =>
      adjacentGroup.includes(adjacentTile)
    );
    if (includeGroup) {
      group.push(...includeGroup);
      return group;
    }
    group.push(adjacentTile);
    return group;
  }, []);
};

module.exports = {
  getAdjacentPlacedTileList,
  removePlacedTiles,
  increaseCorporate,
  placeNormalTile,
};
