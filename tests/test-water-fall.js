/**
 * Test: water falls straight down into empty space.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  grid.set(10, 5, MATERIALS.WATER);

  Physics.tick(grid);

  assert.equal(grid.get(10, 5), MATERIALS.EMPTY, 'origin cell is empty');
  assert.equal(grid.get(10, 6), MATERIALS.WATER, 'water fell one cell down');
});
