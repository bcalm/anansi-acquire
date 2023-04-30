const assert = require('chai').assert;
const Corporations = require('../src/models/corporations.js');

describe('Corporations', () => {
  describe('establishCorporate', () => {
    it('should establish the given corporate when it is inactive', () => {
      const corporations = new Corporations();
      assert.ok(corporations.establishCorporate('zeta', [13, 14]));
    });

    it('should not establish the given corporate when it is active', () => {
      const corporations = new Corporations();
      corporations.establishCorporate('zeta', [13, 14]);
      assert.notOk(corporations.establishCorporate('zeta', [13, 14]));
    });
  });

  describe('mergeCorporate', () => {
    it('should merge two corporate when smaller is not stable', () => {
      const corporations = new Corporations();
      corporations.establishCorporate('zeta', [12, 13, 14]);
      corporations.establishCorporate('sackson', [16, 17]);
      assert.deepStrictEqual(
        corporations.mergeCorporate('zeta', 'sackson', [15]),
        {majority: 2000, minority: 1000, isMerged: true}
      );
    });

    it('should not merge two corporate when smaller is stable', () => {
      const corporations = new Corporations();
      corporations.establishCorporate(
        'zeta', 
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      );
      corporations.establishCorporate('sackson', [24, 36]);
      assert.deepStrictEqual(
        corporations.mergeCorporate('sackson', 'zeta', [15]),
        {isMerged: false}
      );
    });
  });

  describe('getInactiveCorporate', () => {
    it('should return the inactive corporate names', () => {
      const corporations = new Corporations();
      corporations.establishCorporate('zeta', [12, 13, 14]);
      corporations.establishCorporate('sackson', [16, 17]);
      const expected = ['phoenix', 'quantum', 'hydra', 'fusion', 'america'];
      assert.deepStrictEqual(corporations.getInactiveCorporate(), expected);
    });
  });

  describe('getActiveCorporate', () => {
    it('should return the active corporate names', () => {
      const corporations = new Corporations();
      corporations.establishCorporate('zeta', [12, 13, 14]);
      corporations.establishCorporate('sackson', [16, 17]);
      const expected = ['sackson', 'zeta'];
      assert.deepStrictEqual(corporations.getActiveCorporate(), expected);
    });
  });

  describe('getMajorityOfCorp', () => {
    it('should give the majority of the given corporate', () => {
      const corporations = new Corporations();
      assert.deepStrictEqual(corporations.getMajorityOfCorp('zeta'), 0);
    });
  });

  describe('getMinorityOfCorp', () => {
    it('should give the majority of the given corporate', () => {
      const corporations = new Corporations();
      assert.deepStrictEqual(corporations.getMinorityOfCorp('zeta'), 0);
    });
  });

  describe('removeStocks', () => {
    it('should remove the number of stocks of the given corporate', () => {
      const corporations = new Corporations();
      assert.ok(corporations.removeStocks('zeta', 1));
    });

    it('should give false for the given corp if no stock available', () => {
      const corporations = new Corporations();
      assert.notOk(corporations.removeStocks('zeta', 26));
    });
  });

  describe('getAreaOfCorp', () => {
    it('should give area zero for corporation not active', () => {
      const corporations = new Corporations();
      assert.strictEqual(corporations.getAreaOfCorp('zeta'), 0);
    });

    it('should give area zero for corporation having tiles', () => {
      const corporations = new Corporations();
      corporations.zeta.tiles = [2, 3, 4];
      assert.strictEqual(corporations.getAreaOfCorp('zeta'), 3);
    });
  });

  describe('addTiles', () => {
    it('should add tiles to the given corporate', () => {
      const corporations = new Corporations();
      corporations.establishCorporate('zeta', [0, 1]);
      corporations.addTiles('zeta', [2]);
      const expected = [0, 1, 2];
      assert.deepStrictEqual(corporations.status.zeta.tiles, expected);
    });
  });
});
