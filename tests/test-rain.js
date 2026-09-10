/**
 * Test: rain. Disabled -> nothing spawns. Enabled with a forced intensity
 * -> drops appear only in the top row. The wandering intensity target
 * always stays within the slider-controlled rate bounds. The per-drop acid
 * roll (acidChance 0 vs 1) yields pure water / pure acid respectively.
 * A rate of 0 keeps the grid dry even while enabled.
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

  // 3. The random intensity target always stays within the rate bounds
  //    [min(1, rate), rate], and the eased intensity catches up to it
  //    over time. Reset the forced state from part 2 so a fresh
  //    in-bounds target is drawn on the first update.
  Rain.setRate(CONFIG.RAIN.MAX_DROPS_PER_TICK);
  Rain.intensity = 0;
  Rain.targetIntensity = 0;
  Rain.ticksUntilNewTarget = 0;
  const wander = new Grid(40, 40);
  for (let t = 0; t < 3000; t++) {
    Rain.update(wander);
    assert.ok(
      Rain.targetIntensity >= Math.min(CONFIG.RAIN.MIN_DROPS_PER_TICK, Rain.rate),
      'target never below minimum'
    );
    assert.ok(
      Rain.targetIntensity <= Rain.rate,
      'target never above the slider rate'
    );
  }
  assert.ok(
    Rain.intensity > Math.min(CONFIG.RAIN.MIN_DROPS_PER_TICK, Rain.rate),
    'intensity wanders above the minimum'
  );
  assert.ok(
    Rain.intensity <= Rain.rate,
    'intensity never exceeds the slider rate'
  );

  // 4. The per-drop acid roll: acidChance 0 -> only water, acidChance 1
  //    -> only acid. (Reset the intensity state from part 3 first.)
  Rain.intensity = 100;
  Rain.targetIntensity = 100;
  Rain.ticksUntilNewTarget = 1000;

  Rain.acidChance = 0;
  const fresh = new Grid(40, 40);
  Rain.update(fresh);
  let waterDrops = 0;
  let acidDrops = 0;
  for (let x = 0; x < fresh.width; x++) {
    const cell = fresh.get(x, 0);
    if (cell === MATERIALS.WATER) waterDrops++;
    if (cell === MATERIALS.ACID) acidDrops++;
  }
  assert.ok(waterDrops > 0, 'acidChance 0 still spawns water drops');
  assert.equal(acidDrops, 0, 'acidChance 0 never spawns acid');

  const sour = new Grid(40, 40);
  Rain.acidChance = 1;
  Rain.update(sour);
  waterDrops = 0;
  acidDrops = 0;
  for (let x = 0; x < sour.width; x++) {
    const cell = sour.get(x, 0);
    if (cell === MATERIALS.WATER) waterDrops++;
    if (cell === MATERIALS.ACID) acidDrops++;
  }
  assert.ok(acidDrops > 0, 'acidChance 1 spawns acid drops');
  assert.equal(waterDrops, 0, 'acidChance 1 never spawns water');

  // 5. setRate() clamps an existing target down to the new rate.
  Rain.setRate(CONFIG.RAIN.MAX_DROPS_PER_TICK);
  Rain.targetIntensity = CONFIG.RAIN.MAX_DROPS_PER_TICK;
  Rain.setRate(3);
  assert.equal(Rain.targetIntensity, 3, 'target clamped to the new rate');

  // 6. Rate 0 keeps the grid dry even while rain is enabled.
  Rain.setRate(0);
  Rain.intensity = 0;
  Rain.ticksUntilNewTarget = 0;
  const still = new Grid(40, 40);
  for (let t = 0; t < 100; t++) {
    Rain.update(still);
    assert.equal(Rain.targetIntensity, 0, 'target is 0 at rate 0');
  }
  assert.equal(Rain.intensity, 0, 'intensity stays 0 at rate 0');
  for (let x = 0; x < still.width; x++) {
    assert.equal(still.get(x, 0), MATERIALS.EMPTY, 'no drops at rate 0');
  }

  // Restore the defaults so later runs start clean.
  Rain.acidChance = 0;
  Rain.setRate(CONFIG.RAIN.DEFAULT_RATE);
});
