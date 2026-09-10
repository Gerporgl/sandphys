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
 *
 * Performance: particles that keep failing to move accumulate a "rest"
 * counter (grid.rest) and sleep after CONFIG.PHYSICS.SLEEP_AFTER_TICKS
 * consecutive idle ticks — settled liquids no longer cost anything. A cell
 * (and its 8 neighbors) wakes whenever its material changes: every mutation
 * goes through `grid.set()` or `move()`, both of which reset rest counters.
 * A sleeping particle is provably blocked, and it can only become movable
 * if a neighbor changes, so no wakes are missed. Exception: in erosion mode
 * water never sleeps, because its idle erosion roll is exactly the kind of
 * "does nothing visible" activity the rest counter would suppress.
 */
const Physics = {
  /**
   * Erosion mode (toggled from the UI / tests): when true, sand falling
   * into water converts the water into sand (sedimentation), and water
   * with sand or wall directly below has a random chance to dissolve it
   * (see CONFIG.EROSION). Acid is unaffected by this mode.
   */
  erosion: false,

  tick(grid) {
    grid.moved.fill(0);
    const { width, height, cells, moved, rest } = grid;
    const sleepAfter = CONFIG.PHYSICS.SLEEP_AFTER_TICKS;

    for (let y = height - 1; y >= 0; y--) {
      // Randomize the row scan direction to cancel any residual bias.
      const leftToRight = Math.random() < 0.5;
      for (let i = 0; i < width; i++) {
        const x = leftToRight ? i : width - 1 - i;
        const index = y * width + x;
        if (moved[index]) continue;

        const cell = cells[index];
        if (cell !== MATERIALS.SAND && cell !== MATERIALS.WATER && cell !== MATERIALS.ACID) {
          continue; // EMPTY and WALL are static
        }

        // Sleeping particles are provably blocked; only a neighbor change
        // (which resets rest) can unblock them. Water is exempt in erosion
        // mode: its idle erosion roll must keep happening.
        if (rest[index] >= sleepAfter && !(this.erosion && cell === MATERIALS.WATER)) {
          continue;
        }

        let didMove;
        switch (cell) {
          case MATERIALS.SAND:
            didMove = this.updateSand(grid, x, y);
            break;
          case MATERIALS.WATER:
            didMove = this.updateWater(grid, x, y);
            break;
          default: // MATERIALS.ACID
            didMove = this.updateAcid(grid, x, y);
            break;
        }
        if (!didMove) rest[index]++;
      }
    }
  },

  /** Randomly ordered horizontal offsets: [-1, 1] or [1, -1]. */
  randomOrder() {
    return Math.random() < 0.5 ? [-1, 1] : [1, -1];
  },

  /**
   * Move a particle from (fx,fy) to (tx,ty), marking both cells as moved
   * and waking both areas so sleeping neighbors of the new arrangement
   * react this same tick.
   */
  move(grid, fx, fy, tx, ty) {
    const from = grid.index(fx, fy);
    const to = grid.index(tx, ty);
    grid.swap(from, to);
    grid.moved[from] = 1;
    grid.moved[to] = 1;
    grid.wake(fx, fy);
    grid.wake(tx, ty);
    return true;
  },

  /**
   * Sand: falls straight down. Without erosion, it sinks through
   * water/acid by swapping (displacing it upward). With erosion enabled,
   * falling into water converts the water cell into sand instead
   * (sedimentation — nothing is displaced). If blocked below, slides
   * diagonally down-left or down-right (random order) into empty space.
   * Returns true if the grain moved (or transformed).
   */
  updateSand(grid, x, y) {
    if (y + 1 >= grid.height) return false;

    const below = grid.get(x, y + 1);
    if (below === MATERIALS.EMPTY) {
      return this.move(grid, x, y, x, y + 1);
    }
    if (below === MATERIALS.WATER) {
      if (this.erosion) {
        // Sedimentation: the water cell becomes sand and the grain
        // settles into it. The source cell simply empties out.
        grid.set(x, y + 1, MATERIALS.SAND);
        grid.set(x, y, MATERIALS.EMPTY);
        grid.moved[grid.index(x, y)] = 1;
        grid.moved[grid.index(x, y + 1)] = 1;
        return true;
      }
      return this.move(grid, x, y, x, y + 1);
    }
    if (below === MATERIALS.ACID) {
      return this.move(grid, x, y, x, y + 1);
    }

    for (const dx of this.randomOrder()) {
      const nx = x + dx;
      if (
        grid.inBounds(nx, y + 1) &&
        grid.get(nx, y + 1) === MATERIALS.EMPTY
      ) {
        return this.move(grid, x, y, nx, y + 1);
      }
    }
    return false;
  },

  /**
   * Water: in erosion mode, first rolls a chance to dissolve the sand or
   * wall cell directly below it (it then stays in place). Otherwise flows
   * per the shared liquid rules below.
   * Returns true if the drop moved (or dissolved something).
   */
  updateWater(grid, x, y) {
    if (
      this.erosion &&
      y + 1 < grid.height &&
      Math.random() < CONFIG.EROSION.WATER_EROSION_CHANCE
    ) {
      const below = grid.get(x, y + 1);
      if (below === MATERIALS.SAND || below === MATERIALS.WALL) {
        // The cell below is dissolved into water; the drop stays put.
        grid.set(x, y + 1, MATERIALS.WATER);
        return true;
      }
    }
    return this.updateLiquid(grid, x, y);
  },

  /**
   * Shared liquid flow (used by water and acid): falls straight down; if
   * blocked, tries diagonally down-left / down-right (random order); if
   * still blocked, spreads horizontally into empty space (random order),
   * one cell per tick.
   * Returns true if the drop moved.
   */
  updateLiquid(grid, x, y) {
    if (y + 1 < grid.height && grid.get(x, y + 1) === MATERIALS.EMPTY) {
      return this.move(grid, x, y, x, y + 1);
    }

    for (const dx of this.randomOrder()) {
      const nx = x + dx;
      if (
        y + 1 < grid.height &&
        grid.inBounds(nx, y + 1) &&
        grid.get(nx, y + 1) === MATERIALS.EMPTY
      ) {
        return this.move(grid, x, y, nx, y + 1);
      }
    }

    for (const dx of this.randomOrder()) {
      const nx = x + dx;
      if (grid.inBounds(nx, y) && grid.get(nx, y) === MATERIALS.EMPTY) {
        return this.move(grid, x, y, nx, y);
      }
    }
    return false;
  },

  /**
   * Acid: flows exactly like water, but first checks its four direct
   * neighbors: if it touches Sand or Wall, both the acid and that neighbor
   * cell dissolve back into empty space.
   * Returns true if the acid moved (or dissolved something).
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
        grid.set(x, y, MATERIALS.EMPTY);
        grid.set(nx, ny, MATERIALS.EMPTY);
        grid.moved[index] = 1;
        return true;
      }
    }

    return this.updateLiquid(grid, x, y);
  },
};
