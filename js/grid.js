/**
 * Grid: pure simulation state, a flat array of cells.
 *
 * - `cells` : material id per cell (see MATERIALS)
 * - `moved` : per-tick flag marking cells whose particle already moved this
 *             tick, so no particle can travel more than one cell per tick.
 *
 * Visual texture is NOT stored here: it is a static, position-fixed noise
 * map owned by the Renderer (see renderer.js), so it never moves with the
 * particles and no stale color values can linger when cells dissolve.
 *
 * No DOM access here, so the same state is usable from browser and tests.
 */
class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = new Uint8Array(width * height);
    this.moved = new Uint8Array(width * height);
  }

  index(x, y) {
    return y * this.width + x;
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  get(x, y) {
    return this.cells[this.index(x, y)];
  }

  set(x, y, material) {
    if (!this.inBounds(x, y)) return;
    this.cells[this.index(x, y)] = material;
  }

  /** Exchange two cells, used for every move. */
  swap(a, b) {
    const m = this.cells[a];
    this.cells[a] = this.cells[b];
    this.cells[b] = m;
  }

  clear() {
    this.cells.fill(MATERIALS.EMPTY);
    this.moved.fill(0);
  }
}
