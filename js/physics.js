/**
 * Physics engine: one `tick` advances the whole grid by one step.
 *
 * Key rules (see README):
 * - The grid is scanned from the BOTTOM row up to the top row, so a falling
 *   particle always lands on an already-processed cell and can never
 *   "teleport" across the screen in a single frame.
 * - For every particle that can drift left or right, the side checked first
 *   is randomized (both per particle and per row scan direction), so sand
 *   and liquid never skew toward one side of the screen.
 * - The `moved` flag caps movement at one cell per tick per particle.
 */
const Physics = {
  tick(grid) {
    grid.moved.fill(0);
    const { width, height } = grid;

    for (let y = height - 1; y >= 0; y--) {
      // Randomize the row scan direction to cancel any residual bias.
      const leftToRight = Math.random() < 0.5;
      for (let i = 0; i < width; i++) {
        const x = leftToRight ? i : width - 1 - i;
        const index = y * width + x;
        if (grid.moved[index]) continue;

        switch (grid.cells[index]) {
          case MATERIALS.SAND:
            this.updateSand(grid, x, y);
            break;
          case MATERIALS.WATER:
            this.updateLiquid(grid, x, y);
            break;
          case MATERIALS.ACID:
            this.updateAcid(grid, x, y);
            break;
          default:
            break; // EMPTY and WALL are static
        }
      }
    }
  },

  /** Randomly ordered horizontal offsets: [-1, 1] or [1, -1]. */
  randomOrder() {
    return Math.random() < 0.5 ? [-1, 1] : [1, -1];
  },

  /** Move a particle from (fx,fy) to (tx,ty), marking both cells as moved. */
  move(grid, fx, fy, tx, ty) {
    const from = grid.index(fx, fy);
    const to = grid.index(tx, ty);
    grid.swap(from, to);
    grid.moved[from] = 1;
    grid.moved[to] = 1;
  },

  /**
   * Sand: falls straight down. Sinks through water/acid (displacing it
   * upward via a swap). If blocked below, slides diagonally down-left or
   * down-right (random order) into empty space.
   */
  updateSand(grid, x, y) {
    if (y + 1 >= grid.height) return;

    const below = grid.get(x, y + 1);
    if (
      below === MATERIALS.EMPTY ||
      below === MATERIALS.WATER ||
      below === MATERIALS.ACID
    ) {
      this.move(grid, x, y, x, y + 1);
      return;
    }

    for (const dx of this.randomOrder()) {
      const nx = x + dx;
      if (
        grid.inBounds(nx, y + 1) &&
        grid.get(nx, y + 1) === MATERIALS.EMPTY
      ) {
        this.move(grid, x, y, nx, y + 1);
        return;
      }
    }
  },

  /**
   * Water: falls straight down; if blocked, tries diagonally down-left /
   * down-right (random order); if still blocked, spreads horizontally into
   * empty space (random order), one cell per tick.
   */
  updateLiquid(grid, x, y) {
    if (y + 1 < grid.height && grid.get(x, y + 1) === MATERIALS.EMPTY) {
      this.move(grid, x, y, x, y + 1);
      return;
    }

    for (const dx of this.randomOrder()) {
      const nx = x + dx;
      if (
        y + 1 < grid.height &&
        grid.inBounds(nx, y + 1) &&
        grid.get(nx, y + 1) === MATERIALS.EMPTY
      ) {
        this.move(grid, x, y, nx, y + 1);
        return;
      }
    }

    for (const dx of this.randomOrder()) {
      const nx = x + dx;
      if (grid.inBounds(nx, y) && grid.get(nx, y) === MATERIALS.EMPTY) {
        this.move(grid, x, y, nx, y);
        return;
      }
    }
  },

  /**
   * Acid: flows exactly like water, but first checks its four direct
   * neighbors: if it touches Sand or Wall, both the acid and that neighbor
   * cell dissolve back into empty space.
   */
  updateAcid(grid, x, y) {
    const index = grid.index(x, y);
    const neighbors = [
      [x, y - 1],
      [x, y + 1],
      [x - 1, y],
      [x + 1, y],
    ];

    for (const [nx, ny] of neighbors) {
      if (!grid.inBounds(nx, ny)) continue;
      const neighbor = grid.get(nx, ny);
      if (
        neighbor === MATERIALS.SAND ||
        neighbor === MATERIALS.WALL
      ) {
        // Both the acid and one pixel of the touched material dissolve.
        grid.cells[index] = MATERIALS.EMPTY;
        grid.cells[grid.index(nx, ny)] = MATERIALS.EMPTY;
        grid.moved[index] = 1;
        return;
      }
    }

    this.updateLiquid(grid, x, y);
  },
};
