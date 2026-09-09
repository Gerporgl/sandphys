/**
 * Test: acid in contact with a wall dissolves itself AND the wall.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  grid.set(10, 5, MATERIALS.ACID);
  grid.set(10, 6, MATERIALS.WALL);

  Physics.tick(grid);

  assert.equal(grid.get(10, 5), MATERIALS.EMPTY, 'acid dissolved itself');
  assert.equal(grid.get(10, 6), MATERIALS.EMPTY, 'wall pixel was dissolved');
});
