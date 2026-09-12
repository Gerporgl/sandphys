/**
 * Drain: an optional bottom-of-grid liquid sink.
 *
 * When enabled, `update()` (called once per physics tick) removes liquid
 * (water or acid) cells from the BOTTOM row of the grid at the configured
 * `rate` (cells per tick). Sand and wall are never drained. Fractional
 * rates are supported: a budget accumulates each tick and whole cells are
 * removed once it reaches 1.
 *
 * Pairing Rain and Drain lets the user keep it raining forever: water
 * reaches the bottom row and is drained instead of filling the grid.
 *
 * No DOM access here, so it is testable in Node like the rest of the core.
 */
const Drain = {
  enabled: CONFIG.DRAIN.ENABLED_BY_DEFAULT,

  /** Cells removed per tick (float; fractional part accumulates). */
  rate: CONFIG.DRAIN.DEFAULT_RATE,

  /** Fractional budget carried over between ticks for sub-1 rates. */
  _budget: 0,

  update(grid) {
    if (!this.enabled) {
      this._budget = 0;
      return;
    }

    this._budget += this.rate;
    let units = Math.floor(this._budget);
    if (units <= 0) return;
    this._budget -= units;

    // Collect the drainable cells in the bottom row, then remove them one
    // by one at random positions (without replacement).
    const y = grid.height - 1;
    const candidates = [];
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.get(x, y);
      if (cell === MATERIALS.WATER || cell === MATERIALS.ACID) {
        candidates.push(x);
      }
    }

    while (units-- > 0 && candidates.length > 0) {
      const i = (Math.random() * candidates.length) | 0;
      const x = candidates[i];
      candidates[i] = candidates[candidates.length - 1];
      candidates.pop();
      grid.set(x, y, MATERIALS.EMPTY); // wakes sleeping neighbors
    }
  },
};
