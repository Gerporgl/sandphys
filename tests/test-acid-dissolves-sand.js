/**
 * Test: acid in contact with sand dissolves BOTH itself and the sand.
 * (The sand is walled in so it cannot slide away before the acid is
 * processed.)
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  grid.set(10, 5, MATERIALS.ACID);
  grid.set(10, 6, MATERIALS.SAND);
  // Contain the sand so nothing moves before the acid dissolves.
  grid.set(10, 7, MATERIALS.WALL);
  grid.set(9, 6, MATERIALS.WALL);
  grid.set(11, 6, MATERIALS.WALL);
  grid.set(9, 7, MATERIALS.WALL);
  grid.set(11, 7, MATERIALS.WALL);

  Physics.tick(grid);

  assert.equal(grid.get(10, 5), MATERIALS.EMPTY, 'acid dissolved itself');
  assert.equal(grid.get(10, 6), MATERIALS.EMPTY, 'sand was dissolved');
  // The containing walls must be untouched.
  assert.equal(grid.get(10, 7), MATERIALS.WALL, 'walls below survive');
});
