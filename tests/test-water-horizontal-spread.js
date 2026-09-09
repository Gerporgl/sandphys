/**
 * Test: water in a dead-end pocket (no fall, no diagonals) spreads
 * horizontally into empty space — and by at most one cell per tick.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  grid.set(10, 5, MATERIALS.WATER);
  // Block straight down and both diagonals.
  grid.set(10, 6, MATERIALS.WALL);
  grid.set(9, 6, MATERIALS.WALL);
  grid.set(11, 6, MATERIALS.WALL);

  Physics.tick(grid);

  const movedLeft = grid.get(9, 5) === MATERIALS.WATER;
  const movedRight = grid.get(11, 5) === MATERIALS.WATER;
  assert.ok(
    movedLeft !== movedRight,
    'water must spread to exactly one side'
  );
  assert.equal(grid.get(10, 5), MATERIALS.EMPTY, 'water left its original cell');
  assert.equal(
    grid.get(8, 5),
    MATERIALS.EMPTY,
    'water must not travel more than one cell per tick'
  );
  assert.equal(grid.get(12, 5), MATERIALS.EMPTY, 'same on the other side');
});
