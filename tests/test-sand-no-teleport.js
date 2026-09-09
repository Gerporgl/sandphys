/**
 * Test: a column of 30 stacked sand grains moves at most one cell per tick
 * after a single tick (bottom-to-top processing, no chaining).
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  for (let y = 0; y < 30; y++) {
    grid.set(10, y, MATERIALS.SAND);
  }

  Physics.tick(grid);

  assert.equal(grid.get(10, 0), MATERIALS.EMPTY, 'top cell vacated');
  assert.equal(grid.get(10, 1), MATERIALS.SAND, 'top grain moved down by 1');
  assert.equal(grid.get(10, 29), MATERIALS.SAND, 'grain above the bottom one');
  assert.equal(grid.get(10, 30), MATERIALS.SAND, 'bottom grain moved down by 1');
  assert.equal(
    grid.get(10, 31),
    MATERIALS.EMPTY,
    'nothing fell more than one cell in a single tick'
  );
});
