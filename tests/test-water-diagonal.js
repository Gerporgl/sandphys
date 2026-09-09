/**
 * Test: water takes the diagonal path when the cell directly below is
 * blocked but a diagonal-down cell is empty.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  grid.set(10, 5, MATERIALS.WATER);
  grid.set(10, 6, MATERIALS.WALL); // blocks straight down, diagonals open

  Physics.tick(grid);

  assert.equal(
    (grid.get(9, 6) === MATERIALS.WATER) + (grid.get(11, 6) === MATERIALS.WATER),
    1,
    'water must slide diagonally down onto exactly one side'
  );
  assert.equal(grid.get(10, 5), MATERIALS.EMPTY, 'origin cell is empty');
});
