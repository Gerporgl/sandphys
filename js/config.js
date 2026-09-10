/**
 * Global configuration for the falling sand simulation.
 *
 * All tunable constants live here so the rest of the code stays free of
 * magic values. Intended for developer use: no input validation is done.
 */
const CONFIG = {
  /** Number of simulation cells along the X axis. */
  GRID_WIDTH: 250,

  /** Number of simulation cells along the Y axis. */
  GRID_HEIGHT: 250,

  /** Displayed (CSS) size of the canvas in pixels. Internal canvas resolution
   *  is the grid size; the browser upscales with pixelated rendering. */
  CANVAS_SIZE: 500,

  /** Physics ticks executed per animation frame. */
  TICKS_PER_FRAME: 2,

  /** Brightness factors used by the renderer's static, position-fixed
   *  per-cell texture (it does NOT travel with the particles). */
  SHADE_VARIATIONS: [0.78, 0.9, 1.0, 1.1, 1.22],

  /** Brush settings (radius in grid cells). */
  DEFAULT_BRUSH_RADIUS: 4,
  MIN_BRUSH_RADIUS: 1,
  MAX_BRUSH_RADIUS: 20,

  /**
   * Erosion mode: when enabled, sand falling into water turns the water
   * into sand (sedimentation, no displacement), and falling water has a
   * random chance to dissolve the sand/wall cell directly below it.
   */
  EROSION: {
    /** Probability (0..1) per water particle per tick that the sand or
     *  wall cell directly below it is dissolved into water. */
    WATER_EROSION_CHANCE: 0.01,
  },

  /**
   * Sleeping particles: after this many consecutive ticks in which a
   * particle failed to move, it is skipped entirely until one of its
   * neighbors changes (see js/physics.js and Grid.rest).
   */
  PHYSICS: {
    SLEEP_AFTER_TICKS: 3,
  },

  /**
   * Presets: small predefined scenes drawn on the grid at startup and
   * after every Clear, chosen at random (see js/presets.js).
   */
  PRESETS: {
    /** Maximum fraction of the grid width/height a preset may occupy. */
    MAX_FRACTION: 0.75,
  },

  /**
   * Rain mode: when enabled, water drops spawn in the top row every tick.
   * The spawn rate ("intensity") wanders randomly between the bounds
   * below, easing toward a new random target every TARGET_CHANGE_EVERY_TICKS.
   */
  RAIN: {
    MIN_DROPS_PER_TICK: 1,
    MAX_DROPS_PER_TICK: 12,
    /** Ticks between picking a new random intensity target. */
    TARGET_CHANGE_EVERY_TICKS: 240,
    /** How quickly the intensity eases toward the current target (0..1). */
    EASE: 0.02,
    /** Bounds/default for the UI slider giving the probability, in
     *  percent, that a given rain drop is acid instead of water. */
    MIN_ACID_PERCENT: 0,
    MAX_ACID_PERCENT: 100,
    DEFAULT_ACID_PERCENT: 0,
  },
};
