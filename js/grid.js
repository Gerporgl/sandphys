/**
 * Grid: pure simulation state, a flat array of cells.
 *
 * - `cells`  : material id per cell (see MATERIALS)
 * - `shades` : per-cell color variation index for a granular look
 * - `moved`  : per-tick flag marking cells whose particle already moved this
 *              tick, so no particle can travel more than one cell per tick.
 *
 * No DOM access here, so the same state is usable from browser and tests.
 */
class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = new Uint8Array(width * height);
    this.shades = new Uint8Array(width * height);
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

  /**
   * Overwrite a cell with `material`. `shade` defaults to a random color
   * variation so freshly created grains look organic.
   */
  set(x, y, material, shade) {
    if (!this.inBounds(x, y)) return;
    const i = this.index(x, y);
    this.cells[i] = material;
    this.shades[i] =
      shade === undefined
        ? (Math.random() * CONFIG.SHADE_VARIATIONS.length) | 0
        : shade;
  }

  /** Exchange two cells (material and shade), used for every move. */
  swap(a, b) {
    const m = this.cells[a];
    this.cells[a] = this.cells[b];
    this.cells[b] = m;
    const s = this.shades[a];
    this.shades[a] = this.shades[b];
    this.shades[b] = s;
  }

  clear() {
    this.cells.fill(MATERIALS.EMPTY);
    this.shades.fill(0);
    this.moved.fill(0);
  }
}
