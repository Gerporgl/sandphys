/**
 * Test: fast pointer travel is interpolated — painting with a 10-cell jump
 * between frames leaves a continuous line, not disconnected dots.
 */
'use strict';

const { createSandbox, run } = require('./helpers/sandbox');

const sandbox = createSandbox();

run(sandbox, function () {
  const grid = new Grid(40, 40);
  const canvasStub = {
    addEventListener() {},
    getBoundingClientRect: () => ({ width: 0, height: 0 }),
  };
  const input = new Input(canvasStub, grid);
  input.brushRadius = 1;
  input.material = MATERIALS.SAND;
  input.pointerDown = true;

  // Frame 1: pointer at (5, 10) -> single stamp.
  input.gridX = 5;
  input.gridY = 10;
  input.paint();

  // Frame 2: pointer jumped 10 cells to the right in one frame.
  input.gridX = 15;
  input.gridY = 10;
  input.paint();

  // Every cell between the two positions must have been stamped.
  for (let x = 5; x <= 15; x++) {
    assert.equal(
      grid.get(x, 10),
      MATERIALS.SAND,
      `cell (${x}, 10) must be part of the continuous pour`
    );
  }
});
