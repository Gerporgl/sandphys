/**
 * Test: a single sand grain above empty space falls exactly one cell per
 * tick (no teleporting).
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  grid.set(10, 5, MATERIALS.SAND);

  Physics.tick(grid);

  assert.equal(grid.get(10, 5), MATERIALS.EMPTY, 'origin cell is empty');
  assert.equal(grid.get(10, 6), MATERIALS.SAND, 'sand fell one cell down');
});
