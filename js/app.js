/**
 * App: wires the DOM (control panel, canvas) to the simulation and runs the
 * requestAnimationFrame loop.
 *
 * Frame order: paint -> physics ticks -> render, so freshly painted particles
 * already react to gravity in the same frame.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('sim-canvas');
  const grid = new Grid(CONFIG.GRID_WIDTH, CONFIG.GRID_HEIGHT);
  const renderer = new Renderer(canvas, grid);
  const input = new Input(canvas, grid);

  // ---- Control panel wiring -------------------------------------------

  const materialButtons = Array.from(
    document.querySelectorAll('[data-material]')
  );

  function selectMaterial(material) {
    input.material = material;
    for (const button of materialButtons) {
      button.classList.toggle(
        'is-active',
        Number(button.dataset.material) === material
      );
    }
  }

  for (const button of materialButtons) {
    const material = Number(button.dataset.material);
    button.addEventListener('click', () => selectMaterial(material));
  }

  // Keyboard shortcuts: 1..4 pick the paintable materials.
  window.addEventListener('keydown', (event) => {
    const shortcutIndex = Number.parseInt(event.key, 10) - 1;
    if (
      Number.isInteger(shortcutIndex) &&
      shortcutIndex >= 0 &&
      shortcutIndex < PAINTABLE_MATERIALS.length
    ) {
      selectMaterial(PAINTABLE_MATERIALS[shortcutIndex]);
    }
    if (event.key === 'p' || event.key === 'P') {
      togglePause();
    }
  });

  const brushSlider = document.getElementById('brush-size');
  const brushValue = document.getElementById('brush-value');
  brushSlider.min = String(CONFIG.MIN_BRUSH_RADIUS);
  brushSlider.max = String(CONFIG.MAX_BRUSH_RADIUS);
  brushSlider.value = String(CONFIG.DEFAULT_BRUSH_RADIUS);

  function applyBrushRadius() {
    input.brushRadius = Number(brushSlider.value);
    brushValue.textContent = String(input.brushRadius);
  }

  brushSlider.addEventListener('input', applyBrushRadius);
  applyBrushRadius();

  document
    .getElementById('clear-btn')
    .addEventListener('click', () => grid.clear());

  // ---- Pause ------------------------------------------------------------

  const pauseButton = document.getElementById('pause-btn');
  let paused = false;

  function togglePause() {
    paused = !paused;
    pauseButton.textContent = paused ? '▶  Resume' : '⏸  Pause';
    pauseButton.classList.toggle('is-active', paused);
  }

  pauseButton.addEventListener('click', togglePause);

  // Initial selection.
  selectMaterial(MATERIALS.SAND);

  // ---- Main loop --------------------------------------------------------

  function frame() {
    input.paint();

    if (!paused) {
      for (let t = 0; t < CONFIG.TICKS_PER_FRAME; t++) {
        Physics.tick(grid);
      }
    }

    renderer.draw();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
