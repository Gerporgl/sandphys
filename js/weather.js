/**
 * Weather: the rain system.
 *
 * When enabled, `update()` (called once per physics tick) spawns water
 * drops in the top row of the grid. The drop rate ("intensity") is not
 * constant: every TARGET_CHANGE_EVERY_TICKS a new random target is picked
 * within the configured bounds (bounded above by `Rain.rate`), and the
 * current intensity eases toward it, so the rain gently thickens and thins
 * over time. `Rain.rate` is driven by the UI slider (0 = no rain even
 * while enabled), so the user can set anything from a drizzle to a downpour.
 *
 * No DOM access here, so it is testable in Node like the rest of the core.
 */
const Rain = {
  enabled: CONFIG.RAIN.ENABLED_BY_DEFAULT,

  /** Current drops-per-tick (float, eased toward targetIntensity). */
  intensity: 0,

  /** Randomly reassigned target intensity. */
  targetIntensity: 0,

  /** Ticks remaining until a new target is picked. */
  ticksUntilNewTarget: 0,

  /** Maximum intensity (drops per tick) set by the UI rate slider. New
   *  random targets are drawn in [0, rate]. */
  rate: CONFIG.RAIN.DEFAULT_RATE,

  /** Set the slider-controlled rate, keeping the current target valid. */
  setRate(rate) {
    this.rate = rate;
    this.targetIntensity = Math.min(this.targetIntensity, rate);
  },

  /** Probability (0..1) that a spawned drop is acid instead of water.
   *  Driven by the UI slider; the sim itself only ever sees the 0..1
   *  probability. */
  acidChance: 0,

  update(grid) {
    if (!this.enabled) {
      this.intensity = 0;
      return;
    }

    if (this.ticksUntilNewTarget <= 0) {
      // Wandering happens in [min, rate]; the min bound only applies when
      // the slider allows at least MIN_DROPS_PER_TICK drops.
      const min = Math.min(CONFIG.RAIN.MIN_DROPS_PER_TICK, this.rate);
      this.targetIntensity =
        min + Math.random() * (this.rate - min);
      this.ticksUntilNewTarget = CONFIG.RAIN.TARGET_CHANGE_EVERY_TICKS;
    }
    this.ticksUntilNewTarget -= 1;

    this.intensity += (this.targetIntensity - this.intensity) * CONFIG.RAIN.EASE;

    const drops = Math.round(this.intensity);
    for (let i = 0; i < drops; i++) {
      const x = (Math.random() * grid.width) | 0;
      // Each drop independently rolls to be acid or water.
      const dropMaterial =
        Math.random() < this.acidChance ? MATERIALS.ACID : MATERIALS.WATER;
      // Only spawn into empty cells so drops don't overwrite material
      // that is already falling through the top row.
      if (grid.get(x, 0) === MATERIALS.EMPTY) {
        grid.set(x, 0, dropMaterial);
      }
    }
  },
};
