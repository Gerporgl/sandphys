/**
 * Global configuration for the falling sand simulation.
 *
 * All tunable constants live here so the rest of the code stays free of
 * magic values. Intended for developer use: no input validation is done.
 */
const CONFIG = {
  /** Number of simulation cells along the X axis. */
  GRID_WIDTH: 200,

  /** Number of simulation cells along the Y axis. */
  GRID_HEIGHT: 200,

  /** Displayed (CSS) size of the canvas in pixels. Internal canvas resolution
   *  is the grid size; the browser upscales with pixelated rendering. */
  CANVAS_SIZE: 400,

  /** Physics ticks executed per animation frame. */
  TICKS_PER_FRAME: 1,

  /** One color variation ("shade") per material is picked randomly for each
   *  particle to give the grains a granular, non-flat look. */
  SHADE_VARIATIONS: [0.78, 0.9, 1.0, 1.1, 1.22],

  /** Brush settings (radius in grid cells). */
  DEFAULT_BRUSH_RADIUS: 4,
  MIN_BRUSH_RADIUS: 1,
  MAX_BRUSH_RADIUS: 20,
};
