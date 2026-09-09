/**
 * Test: in erosion mode, water sitting on sand or wall dissolves the cell
 * below into water (the drop stays in place). The chance is forced to 1.0
 * so the behavior is deterministic.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  Physics.erosion = true;
  const originalChance = CONFIG.EROSION.WATER_EROSION_CHANCE;
  CONFIG.EROSION.WATER_EROSION_CHANCE = 1;

  try {
    // 1. Water above a walled-in sand grain: the grain becomes water.
    const onSand = new Grid(40, 40);
    onSand.set(10, 5, MATERIALS.WATER);
    onSand.set(10, 6, MATERIALS.SAND);
    // Contain the sand so it cannot slide away first.
    onSand.set(9, 7, MATERIALS.WALL);
    onSand.set(10, 7, MATERIALS.WALL);
    onSand.set(11, 7, MATERIALS.WALL);

    Physics.tick(onSand);

    assert.equal(onSand.get(10, 6), MATERIALS.WATER, 'sand below was dissolved into water');
    assert.equal(onSand.get(10, 5), MATERIALS.WATER, 'the drop itself stays in place');

    // 2. Water above a bare wall: the wall pixel becomes water.
    const onWall = new Grid(40, 40);
    onWall.set(10, 5, MATERIALS.WATER);
    onWall.set(10, 6, MATERIALS.WALL);

    Physics.tick(onWall);

    assert.equal(onWall.get(10, 6), MATERIALS.WATER, 'wall below was dissolved into water');
    assert.equal(onWall.get(10, 5), MATERIALS.WATER, 'the drop itself stays in place');
  } finally {
    CONFIG.EROSION.WATER_EROSION_CHANCE = originalChance;
    Physics.erosion = false;
  }
});
