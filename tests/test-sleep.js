'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const context = createSandbox();

// A settled liquid pool goes to sleep: after enough ticks every liquid
// cell's rest counter reaches the threshold.
run(context, () => {
  const grid = new Grid(100, 100);
  grid.clear();
  for (let x = 0; x < 100; x++) for (let y = 80; y < 100; y++) {
    grid.set(x, y, MATERIALS.WATER);
  }

  for (let i = 0; i < CONFIG.PHYSICS.SLEEP_AFTER_TICKS + 5; i++) {
    Physics.tick(grid);
  }

  for (let x = 0; x < 100; x++) {
    for (let y = 80; y < 100; y++) {
      if (grid.get(x, y) !== MATERIALS.WATER) continue;
      assert.ok(
        grid.rest[grid.index(x, y)] >= CONFIG.PHYSICS.SLEEP_AFTER_TICKS,
        'settled water cell is asleep'
      );
    }
  }
});

// Removing the floor under a sleeping pool wakes it: the water falls
// through the gap and fills the removed cells.
run(context, () => {
  const grid = new Grid(100, 100);
  grid.clear();
  for (let x = 0; x < 100; x++) {
    for (let y = 60; y < 80; y++) grid.set(x, y, MATERIALS.WATER);
    grid.set(x, 80, MATERIALS.WALL);
  }

  for (let i = 0; i < CONFIG.PHYSICS.SLEEP_AFTER_TICKS + 5; i++) {
    Physics.tick(grid);
  }
  // Water is asleep on an intact floor: nothing moves.
  assert.equal(grid.get(50, 81), MATERIALS.EMPTY);

  // Punch a hole in the floor.
  grid.set(50, 80, MATERIALS.EMPTY);

  for (let i = 0; i < 40; i++) {
    Physics.tick(grid);
  }
  assert.equal(
    grid.get(50, 81),
    MATERIALS.WATER,
    'water woke up and fell through the gap'
  );
});

// Pouring water onto a sleeping pool wakes the surface: the new water
// sinks into the pool instead of piling up.
run(context, () => {
  const grid = new Grid(100, 100);
  grid.clear();
  for (let x = 0; x < 100; x++) for (let y = 80; y < 100; y++) {
    grid.set(x, y, MATERIALS.WATER);
  }

  for (let i = 0; i < CONFIG.PHYSICS.SLEEP_AFTER_TICKS + 5; i++) {
    Physics.tick(grid);
  }

  // Drop a fresh column of water onto the sleeping surface.
  for (let y = 70; y < 79; y++) grid.set(50, y, MATERIALS.WATER);

  for (let i = 0; i < 40; i++) {
    Physics.tick(grid);
  }
  // The poured water ended up inside the pool: the drop column is empty
  // again and the pool still holds all of it.
  assert.equal(grid.get(50, 70), MATERIALS.EMPTY, 'poured column emptied');
  let count = 0;
  for (const cell of grid.cells) {
    if (cell === MATERIALS.WATER) count++;
  }
  assert.equal(count, 100 * 20 + 9, 'no water lost');
});

// Settled sand sleeps too, and erasing a support cell wakes the grains
// above so they fall.
run(context, () => {
  const grid = new Grid(100, 100);
  grid.clear();
  // A flat single layer of sand on a wider wall floor: every grain is
  // fully blocked (below and both diagonals are wall), so the layer is
  // genuinely stable and goes to sleep.
  for (let x = 20; x < 80; x++) {
    grid.set(x, 80, MATERIALS.WALL);
  }
  for (let x = 30; x < 70; x++) {
    grid.set(x, 79, MATERIALS.SAND);
  }

  for (let i = 0; i < CONFIG.PHYSICS.SLEEP_AFTER_TICKS + 5; i++) {
    Physics.tick(grid);
  }
  for (let x = 30; x < 70; x++) {
    assert.equal(grid.get(x, 79), MATERIALS.SAND, 'asleep sand unmoved');
    assert.ok(
      grid.rest[grid.index(x, 79)] >= CONFIG.PHYSICS.SLEEP_AFTER_TICKS,
      'sand grain is asleep'
    );
  }

  // Erase a floor cell (like the eraser brush); the grain above must
  // wake and fall through. By tick 40 it has reached the bottom row.
  grid.set(50, 80, MATERIALS.EMPTY);

  for (let i = 0; i < 40; i++) {
    Physics.tick(grid);
  }
  assert.equal(grid.get(50, 99), MATERIALS.SAND, 'sand fell through gap');
});

// Acid sleeps while inert, but wakes when wall material is painted next
// to it and starts dissolving.
run(context, () => {
  const grid = new Grid(100, 100);
  grid.clear();
  // Full-width pool on the grid floor: the surface has no empty cell to
  // spread into and nothing around to dissolve, so it is at rest.
  for (let x = 0; x < 100; x++) for (let y = 90; y < 100; y++) {
    grid.set(x, y, MATERIALS.ACID);
  }

  const sleepFor = CONFIG.PHYSICS.SLEEP_AFTER_TICKS + 5;
  for (let i = 0; i < sleepFor; i++) {
    Physics.tick(grid);
  }
  // Sleeping cells stop being processed, so rest freezes at the threshold.
  for (let x = 5; x < 95; x += 7) {
    for (let y = 92; y < 98; y += 2) {
      assert.equal(
        grid.rest[grid.index(x, y)],
        CONFIG.PHYSICS.SLEEP_AFTER_TICKS,
        `inert acid cell asleep at ${x},${y}`
      );
    }
  }

  // Painting wall above the sleeping acid wakes it: it dissolves.
  const countMaterial = (material) => {
    let n = 0;
    for (const cell of grid.cells) {
      if (cell === material) n++;
    }
    return n;
  };
  const acidBefore = countMaterial(MATERIALS.ACID);
  grid.set(49, 89, MATERIALS.WALL);
  for (let i = 0; i < 10; i++) {
    Physics.tick(grid);
  }
  assert.ok(
    countMaterial(MATERIALS.ACID) < acidBefore,
    'acid woke up and dissolved the wall'
  );
});

// In erosion mode water must keep eroding even after the sleep threshold:
// with a 100% erosion chance the sand under the water keeps dissolving
// far past SLEEP_AFTER_TICKS ticks.
run(context, () => {
  const grid = new Grid(100, 100);
  grid.clear();
  for (let x = 0; x < 100; x++) {
    for (let y = 90; y < 100; y++) grid.set(x, y, MATERIALS.SAND);
    for (let y = 80; y < 90; y++) grid.set(x, y, MATERIALS.WATER);
  }

  const originalChance = CONFIG.EROSION.WATER_EROSION_CHANCE;
  Physics.erosion = true;
  CONFIG.EROSION.WATER_EROSION_CHANCE = 1;
  try {
    const countMaterial = (material) => {
      let n = 0;
      for (const cell of grid.cells) {
        if (cell === material) n++;
      }
      return n;
    };

    for (let i = 0; i < CONFIG.PHYSICS.SLEEP_AFTER_TICKS + 5; i++) {
      Physics.tick(grid);
    }
    const sandAfterFirstBatch = countMaterial(MATERIALS.SAND);

    for (let i = 0; i < CONFIG.PHYSICS.SLEEP_AFTER_TICKS + 5; i++) {
      Physics.tick(grid);
    }
    const sandAfterSecondBatch = countMaterial(MATERIALS.SAND);

    assert.ok(
      sandAfterSecondBatch < sandAfterFirstBatch,
      'erosion continues past the sleep threshold'
    );
  } finally {
    Physics.erosion = false;
    CONFIG.EROSION.WATER_EROSION_CHANCE = originalChance;
  }
});
