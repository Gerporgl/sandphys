/**
 * Test: a wall is completely static — a tick neither moves nor changes it.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  grid.set(10, 5, MATERIALS.WALL);

  for (let t = 0; t < 5; t++) {
    Physics.tick(grid);
  }

  assert.equal(grid.get(10, 5), MATERIALS.WALL, 'wall is still there');
  // Nothing may have appeared above/below the wall either.
  assert.equal(grid.get(10, 4), MATERIALS.EMPTY, 'cell above wall unchanged');
  assert.equal(grid.get(10, 6), MATERIALS.EMPTY, 'cell below wall unchanged');
});
