/**
 * Input: mouse/pointer painting onto the grid.
 *
 * - Pointer position is converted from CSS pixels to grid coordinates.
 * - While the pointer is held down (even without moving), `paint()` is called
 *   once per frame so streams pour continuously.
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

    canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.pointerDown = true;
      this.updatePosition(event);
    });

    canvas.addEventListener('pointermove', (event) => {
      this.updatePosition(event);
    });

    // Listen on window so releasing the button outside the canvas stops too.
    window.addEventListener('pointerup', () => {
      this.pointerDown = false;
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

  /**
   * Stamp the brush disc of the current material onto the grid.
   * Call once per frame while the pointer is held down.
   */
  paint() {
    if (!this.pointerDown || !this.grid.inBounds(this.gridX, this.gridY)) {
      return;
    }

    const radius = this.brushRadius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const x = this.gridX + dx;
        const y = this.gridY + dy;
        if (this.grid.inBounds(x, y)) {
          this.grid.set(x, y, this.material);
        }
      }
    }
  }
}
