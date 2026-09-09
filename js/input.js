/**
 * Input: mouse/pointer painting onto the grid.
 *
 * - Pointer position is converted from CSS pixels to grid coordinates.
 * - While the pointer is held down (even without moving), `paint()` is called
 *   once per frame so streams pour continuously.
 * - Between frames the brush is stamped along a straight line interpolating
 *   from the last painted position to the current one, so fast mouse
 *   movements produce a continuous pour instead of disconnected dots.
 * - The brush is a disc of `brushRadius` cells.
 */
class Input {
  constructor(canvas, grid) {
    this.canvas = canvas;
    this.grid = grid;

    this.material = MATERIALS.SAND;
    this.brushRadius = CONFIG.DEFAULT_BRUSH_RADIUS;

    this.pointerDown = false;
    this.gridX = -1;
    this.gridY = -1;

    // Last cell the brush was stamped at; used to interpolate between
    // consecutive paint positions. Reset on press/release so the first
    // stamp after a (re)press is a single disc, not a long streak.
    this.lastX = -1;
    this.lastY = -1;

    canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.pointerDown = true;
      this.lastX = -1;
      this.lastY = -1;
      this.updatePosition(event);
    });

    canvas.addEventListener('pointermove', (event) => {
      this.updatePosition(event);
    });

    // Listen on window so releasing the button outside the canvas stops too.
    window.addEventListener('pointerup', () => {
      this.pointerDown = false;
      this.lastX = -1;
      this.lastY = -1;
    });

    canvas.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  }

  /** CSS pixel position -> grid cell coordinates. */
  updatePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;

    const x = Math.floor(relX * this.grid.width);
    const y = Math.floor(relY * this.grid.height);

    if (this.grid.inBounds(x, y)) {
      this.gridX = x;
      this.gridY = y;
    }
  }

  /** Stamp one brush disc of the current material at (x, y). */
  stamp(x, y) {
    const radius = this.brushRadius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const px = x + dx;
        const py = y + dy;
        if (this.grid.inBounds(px, py)) {
          this.grid.set(px, py, this.material);
        }
      }
    }
  }

  /**
   * Stamp the brush along the line from (x0, y0) to (x1, y1), covering
   * every intermediate cell so fast pointer travel leaves no gaps.
   */
  stampLine(x0, y0, x1, y1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 1; i <= steps; i++) {
      this.stamp(
        Math.round(x0 + ((x1 - x0) * i) / steps),
        Math.round(y0 + ((y1 - y0) * i) / steps)
      );
    }
  }

  /**
   * Paint for this frame: interpolate from the last stamped position to
   * the current pointer position. Call once per frame.
   */
  paint() {
    if (
      !this.pointerDown ||
      !this.grid.inBounds(this.gridX, this.gridY)
    ) {
      this.lastX = -1;
      this.lastY = -1;
      return;
    }

    if (this.lastX < 0 || this.lastY < 0) {
      this.stamp(this.gridX, this.gridY);
    } else {
      this.stampLine(this.lastX, this.lastY, this.gridX, this.gridY);
    }

    this.lastX = this.gridX;
    this.lastY = this.gridY;
  }
}
