/**
 * Renderer: blits the grid state onto the canvas via ImageData (fast, one
 * putImageData per frame). The canvas internal resolution is the grid size;
 * CSS upscales it to CONFIG.CANVAS_SIZE with `image-rendering: pixelated`.
 */

/** '#rrggbb' -> [r, g, b] */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

class Renderer {
  constructor(canvas, grid) {
    this.canvas = canvas;
    this.grid = grid;

    // Internal resolution = grid resolution for a crisp 1:1 cell mapping.
    canvas.width = grid.width;
    canvas.height = grid.height;

    this.ctx = canvas.getContext('2d');
    this.imageData = this.ctx.createImageData(grid.width, grid.height);

    // Precompute a small palette per material: base color x each shade factor.
    this.palettes = {};
    for (const key of Object.keys(MATERIAL_INFO)) {
      const material = Number(key);
      const [r, g, b] = hexToRgb(MATERIAL_INFO[material].color);
      this.palettes[material] = CONFIG.SHADE_VARIATIONS.map((factor) => [
        Math.min(255, Math.round(r * factor)),
        Math.min(255, Math.round(g * factor)),
        Math.min(255, Math.round(b * factor)),
      ]);
    }
  }

  draw() {
    const { cells, shades } = this.grid;
    const data = this.imageData.data;
    const length = cells.length;

    for (let i = 0; i < length; i++) {
      const [r, g, b] = this.palettes[cells[i]][shades[i]];
      const o = i * 4;
      data[o] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = 255;
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }
}
