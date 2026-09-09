/**
 * Test: sand sinks through water by swapping, displacing the water upward.
 * (The water cell is fully walled in so it cannot fall away first.)
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  grid.set(10, 5, MATERIALS.SAND);
  grid.set(10, 6, MATERIALS.WATER);
  // Wall in the water on every side.
  grid.set(9, 6, MATERIALS.WALL);
  grid.set(11, 6, MATERIALS.WALL);
  grid.set(9, 7, MATERIALS.WALL);
  grid.set(10, 7, MATERIALS.WALL);
  grid.set(11, 7, MATERIALS.WALL);

  Physics.tick(grid);

  assert.equal(grid.get(10, 6), MATERIALS.SAND, 'sand sank into the water');
  assert.equal(grid.get(10, 5), MATERIALS.WATER, 'water was displaced upward');
});
