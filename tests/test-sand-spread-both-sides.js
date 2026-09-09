/**
 * Test: direction randomization — sand poured continuously onto a wall
 * spreads over time to BOTH sides of the wall, not just one.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  grid.set(10, 10, MATERIALS.WALL);

  // Pour one grain per tick for 200 ticks (pour, then simulate).
  for (let t = 0; t < 200; t++) {
    grid.set(10, 9, MATERIALS.SAND);
    Physics.tick(grid);
  }

  let left = 0;
  let right = 0;
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.get(x, y) !== MATERIALS.SAND) continue;
      if (x < 10) left++;
      else if (x > 10) right++;
    }
  }

  assert.ok(left > 0, 'sand must reach the left side of the wall');
  assert.ok(right > 0, 'sand must reach the right side of the wall');
});
