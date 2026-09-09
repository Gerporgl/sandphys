'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const context = createSandbox();

// Every preset draws: valid scale, only the preset materials, centered and
// fitting inside the grid.
run(context, () => {
  const grid = new Grid(CONFIG.GRID_WIDTH, CONFIG.GRID_HEIGHT);
  const expected = new Set([
    MATERIALS.SAND,
    MATERIALS.WATER,
    MATERIALS.WALL,
    MATERIALS.ACID,
  ]);

  for (const preset of Presets.list) {
    grid.clear();
    const scale = Presets.apply(grid, preset);
    assert.ok(
      Number.isInteger(scale) && scale >= 1,
      `${preset.name}: integer scale >= 1`
    );

    let minX = grid.width, maxX = -1, minY = grid.height, maxY = -1, cells = 0;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const m = grid.get(x, y);
        if (m === MATERIALS.EMPTY) continue;
        assert.ok(expected.has(m), `${preset.name}: valid material`);
        cells++;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    assert.ok(cells > 0, `${preset.name}: drew cells`);

    // Centered: bounding box is (nearly) equidistant from both edges.
    const leftMargin = minX;
    const rightMargin = grid.width - 1 - maxX;
    assert.ok(
      Math.abs(leftMargin - rightMargin) <= 1,
      `${preset.name}: horizontally centered`
    );
    const topMargin = minY;
    const bottomMargin = grid.height - 1 - maxY;
    assert.ok(
      Math.abs(topMargin - bottomMargin) <= 1,
      `${preset.name}: vertically centered`
    );
  }
});

// Presets respect the configured size fraction on the standard grid
// (measured on the drawn content, which is what is visible).
run(context, () => {
  const grid = new Grid(CONFIG.GRID_WIDTH, CONFIG.GRID_HEIGHT);
  const maxW = Math.floor(grid.width * CONFIG.PRESETS.MAX_FRACTION);
  const maxH = Math.floor(grid.height * CONFIG.PRESETS.MAX_FRACTION);

  for (const preset of Presets.list) {
    grid.clear();
    Presets.apply(grid, preset);

    let minX = grid.width, maxX = -1, minY = grid.height, maxY = -1;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (grid.get(x, y) === MATERIALS.EMPTY) continue;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    assert.ok(maxX - minX + 1 <= maxW, `${preset.name}: fits width`);
    assert.ok(maxY - minY + 1 <= maxH, `${preset.name}: fits height`);
  }
});

// random() clears the grid first, returns a known preset, and draws it.
// Math.random is pinned to 0 so the choice is deterministic.
run(context, () => {
  const grid = new Grid(250, 250);
  grid.cells.fill(MATERIALS.WATER); // must be wiped by the clear

  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    const preset = Presets.random(grid);
    assert.equal(preset, Presets.list[0]);

    let water = 0, drawn = 0;
    for (const cell of grid.cells) {
      if (cell === MATERIALS.WATER) water++;
      if (cell !== MATERIALS.EMPTY) drawn++;
    }
    assert.equal(water, 0, 'previous content cleared');
    assert.ok(drawn > 0, 'preset content drawn');
  } finally {
    Math.random = originalRandom;
  }
});

// apply() leaves 'empty' ('.') cells untouched: pre-existing material in
// positions the art does not cover survives.
run(context, () => {
  const grid = new Grid(250, 250);
  grid.cells.fill(MATERIALS.WATER);

  const preset = Presets.list.find((p) => p.name === 'Smiley');
  assert.ok(preset, 'smiley preset exists');
  Presets.apply(grid, preset);

  // The grid corner is untouched.
  assert.equal(grid.get(0, 0), MATERIALS.WATER);

  // Bounding box of the drawn ring; its corner cells are '.' in the art,
  // so the water there must survive.
  let minX = grid.width, maxX = -1, minY = grid.height, maxY = -1;
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.get(x, y) === MATERIALS.WALL) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  assert.ok(maxX > minX, 'ring drawn (wall replaced water)');
  assert.equal(grid.get(minX, minY), MATERIALS.WATER, "'.' art cells left as-is");
  assert.equal(grid.get(maxX, maxY), MATERIALS.WATER, "'.' art cells left as-is");
});
