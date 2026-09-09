/**
 * Test: rain. Disabled -> nothing spawns. Enabled with a forced intensity
 * -> drops appear only in the top row. The wandering intensity target
 * always stays within the configured bounds.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  // 1. Disabled rain must not spawn anything.
  Rain.enabled = false;
  const dry = new Grid(40, 40);
  Rain.update(dry);
  for (let x = 0; x < dry.width; x++) {
    assert.equal(dry.get(x, 0), MATERIALS.EMPTY, 'no drops while disabled');
  }

  // 2. Enabled rain with a forced heavy intensity drops water in row 0
  //    only, never lower and never overwriting existing cells.
  Rain.enabled = true;
  Rain.intensity = 100;
  Rain.targetIntensity = 100;
  Rain.ticksUntilNewTarget = 1000;

  const wet = new Grid(40, 40);
  wet.set(20, 0, MATERIALS.WALL); // occupied cell must not be overwritten
  Rain.update(wet);

  let drops = 0;
  for (let x = 0; x < wet.width; x++) {
    if (wet.get(x, 0) === MATERIALS.WATER) drops++;
  }
  assert.ok(drops > 0, 'rain should spawn water in the top row');
  assert.equal(wet.get(20, 0), MATERIALS.WALL, 'drops do not overwrite material');
  for (let y = 1; y < wet.height; y++) {
    for (let x = 0; x < wet.width; x++) {
      assert.equal(
        wet.get(x, y),
        MATERIALS.EMPTY,
        `nothing below the top row at (${x}, ${y})`
      );
    }
  }

  // 3. The random intensity target always stays within the configured
  //    bounds, and the eased intensity catches up to it over time.
  //    Reset the forced state from part 2 so a fresh in-bounds target
  //    is drawn on the first update.
  Rain.intensity = 0;
  Rain.targetIntensity = 0;
  Rain.ticksUntilNewTarget = 0;
  const wander = new Grid(40, 40);
  for (let t = 0; t < 3000; t++) {
    Rain.update(wander);
    assert.ok(
      Rain.targetIntensity >= CONFIG.RAIN.MIN_DROPS_PER_TICK,
      'target never below minimum'
    );
    assert.ok(
      Rain.targetIntensity <= CONFIG.RAIN.MAX_DROPS_PER_TICK,
      'target never above maximum'
    );
  }
  assert.ok(
    Rain.intensity > CONFIG.RAIN.MIN_DROPS_PER_TICK,
    'intensity wanders above the minimum'
  );
  assert.ok(
    Rain.intensity <= CONFIG.RAIN.MAX_DROPS_PER_TICK,
    'intensity never exceeds the maximum'
  );
});
