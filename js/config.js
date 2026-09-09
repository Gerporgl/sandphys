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
};
