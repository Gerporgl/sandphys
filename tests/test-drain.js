/**
 * Test: drain mode. Disabled -> nothing removed. Enabled -> only liquid
 * (water and acid) in the BOTTOM row is removed, at the configured rate
 * (cells per tick, fractional rates supported). Sand and wall are never
 * drained, and rows above the bottom row are untouched.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const bottomCount = (grid, material) => {
    let count = 0;
    for (let x = 0; x < grid.width; x++) {
      if (grid.get(x, grid.height - 1) === material) count++;
    }
    return count;
  };

  // 1. Disabled drain must remove nothing.
  Drain.enabled = false;
  const dry = new Grid(20, 10);
  dry.set(5, dry.height - 1, MATERIALS.WATER);
  Drain.update(dry);
  assert.equal(dry.get(5, dry.height - 1), MATERIALS.WATER, 'no drain while disabled');

  // 2. Rate 1 on a full bottom row removes exactly one liquid cell per tick
  //    and never touches cells above the bottom row.
  Drain.enabled = true;
  const full = new Grid(20, 10);
  for (let x = 0; x < full.width; x++) full.set(x, full.height - 1, MATERIALS.WATER);
  full.set(3, full.height - 2, MATERIALS.SAND);
  Drain.rate = 1;
  Drain.update(full);
  assert.equal(bottomCount(full, MATERIALS.EMPTY), 1, 'rate 1 removes one cell per tick');
  assert.equal(bottomCount(full, MATERIALS.WATER), full.width - 1, 'one water cell gone');
  assert.equal(full.get(3, full.height - 2), MATERIALS.SAND, 'rows above the bottom are untouched');

  // 3. Sand and wall in the bottom row are never drained, even at max rate.
  const solid = new Grid(20, 10);
  for (let x = 0; x < solid.width; x++) {
    solid.set(x, solid.height - 1, x % 2 ? MATERIALS.SAND : MATERIALS.WALL);
  }
  Drain.rate = CONFIG.DRAIN.MAX_RATE;
  for (let t = 0; t < 10; t++) Drain.update(solid);
  for (let x = 0; x < solid.width; x++) {
    assert.equal(
      solid.get(x, solid.height - 1),
      x % 2 ? MATERIALS.SAND : MATERIALS.WALL,
      'solids are not drained'
    );
  }

  // 4. Acid drains just like water, and a rate >= row width empties the
  //    whole bottom row in a single tick.
  const sour = new Grid(20, 10);
  for (let x = 0; x < sour.width; x++) sour.set(x, sour.height - 1, MATERIALS.ACID);
  Drain.rate = CONFIG.DRAIN.MAX_RATE;
  Drain.update(sour);
  assert.equal(bottomCount(sour, MATERIALS.ACID), 0, 'acid is drained');
  assert.equal(bottomCount(sour, MATERIALS.EMPTY), sour.width, 'row fully drained in one tick');

  // 5. Fractional rate: 0.5 cells/tick removes one cell every second tick
  //    on a full row (the budget must accumulate, not round to zero).
  const frac = new Grid(20, 10);
  for (let x = 0; x < frac.width; x++) frac.set(x, frac.height - 1, MATERIALS.WATER);
  Drain.rate = 0.5;
  Drain.update(frac);
  assert.equal(bottomCount(frac, MATERIALS.EMPTY), 0, 'half a cell on the first tick removes nothing');
  Drain.update(frac);
  assert.equal(bottomCount(frac, MATERIALS.EMPTY), 1, 'budget accumulates: one cell by the second tick');

  // 6. Rate 0 never drains, and a disabled drain drops its leftover budget.
  const still = new Grid(20, 10);
  for (let x = 0; x < still.width; x++) still.set(x, still.height - 1, MATERIALS.WATER);
  Drain.rate = 0;
  Drain.update(still);
  assert.equal(bottomCount(still, MATERIALS.EMPTY), 0, 'rate 0 drains nothing');

  Drain.enabled = false;
  Drain.rate = CONFIG.DRAIN.DEFAULT_RATE;
});
