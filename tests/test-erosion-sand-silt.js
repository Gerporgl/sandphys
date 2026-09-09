/**
 * Test: in erosion mode, sand falling into water CONVERTS the water into
 * sand (sedimentation) instead of displacing it. The water cell is sealed
 * with walls and the water-erosion chance is zeroed so nothing else can
 * move and the outcome is deterministic.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  Physics.erosion = true;
  const originalChance = CONFIG.EROSION.WATER_EROSION_CHANCE;
  CONFIG.EROSION.WATER_EROSION_CHANCE = 0; // keep the sealing walls safe

  try {
    const grid = new Grid(40, 40);
    grid.set(10, 5, MATERIALS.SAND);
    grid.set(10, 6, MATERIALS.WATER);
    // Seal the water cell on every side.
    grid.set(9, 6, MATERIALS.WALL);
    grid.set(11, 6, MATERIALS.WALL);
    grid.set(9, 7, MATERIALS.WALL);
    grid.set(10, 7, MATERIALS.WALL);
    grid.set(11, 7, MATERIALS.WALL);

    Physics.tick(grid);

    assert.equal(grid.get(10, 6), MATERIALS.SAND, 'water was converted to sand');
    assert.equal(grid.get(10, 5), MATERIALS.EMPTY, 'sand settled into the water cell');

    // No water should remain anywhere (it was neither displaced nor diluted).
    let water = 0;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (grid.get(x, y) === MATERIALS.WATER) water++;
      }
    }
    assert.equal(water, 0, 'no water displaced out of the sealed cell');
  } finally {
    CONFIG.EROSION.WATER_EROSION_CHANCE = originalChance;
    Physics.erosion = false;
  }
});
