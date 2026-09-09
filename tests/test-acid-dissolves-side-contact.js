/**
 * Test: acid contacts material on its SIDE (not just below) and dissolves
 * it.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  grid.set(10, 5, MATERIALS.ACID);
  grid.set(11, 5, MATERIALS.WALL);

  Physics.tick(grid);

  assert.equal(grid.get(10, 5), MATERIALS.EMPTY, 'acid dissolved itself');
  assert.equal(grid.get(11, 5), MATERIALS.EMPTY, 'side wall pixel was dissolved');
});
