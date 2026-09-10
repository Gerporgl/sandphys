/**
 * Grid: pure simulation state, a flat array of cells.
 *
 * - `cells` : material id per cell (see MATERIALS)
 * - `moved` : per-tick flag marking cells whose particle already moved this
 *             tick, so no particle can travel more than one cell per tick.
 * - `rest`  : consecutive-tick counter per cell; Physics uses it to "sleep"
 *             particles that keep failing to move and skips them until a
 *             neighbor changes (see Physics). Every `set()` wakes the cell
 *             and its 8 neighbors.
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
    this.rest = new Uint8Array(width * height);
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
    const i = this.index(x, y);
    if (this.cells[i] === material) return;
    this.cells[i] = material;
    this.wake(x, y);
  }

  /**
   * Wake a cell and its 8 neighbors by resetting their rest counters, so
   * sleeping particles next to any change start moving again immediately.
   */
  wake(x, y) {
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy;
      if (ny < 0 || ny >= this.height) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        if (nx < 0 || nx >= this.width) continue;
        this.rest[ny * this.width + nx] = 0;
      }
    }
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
    this.rest.fill(0);
  }
}
