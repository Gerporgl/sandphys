/**
 * App: wires the DOM (control panel, canvas) to the simulation and runs the
 * requestAnimationFrame loop.
 *
 * Frame order: paint -> physics ticks -> render, so freshly painted particles
 * already react to gravity in the same frame.
 */
(function () {
  'use strict';

  // Drive the CSS layout from CONFIG so the canvas display size always
  // matches CANVAS_SIZE, no matter how the config is tuned.
  document.documentElement.style.setProperty(
    '--canvas-size',
    `${CONFIG.CANVAS_SIZE}px`
  );

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
    if (event.key === 'e' || event.key === 'E') {
      toggleErosion();
    }
    if (event.key === 'r' || event.key === 'R') {
      toggleRain();
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
    .addEventListener('click', () => Presets.random(grid));

  // ---- Pause ------------------------------------------------------------

  const pauseButton = document.getElementById('pause-btn');
  let paused = false;

  function togglePause() {
    paused = !paused;
    pauseButton.textContent = paused ? '▶  Resume' : '⏸  Pause';
    pauseButton.classList.toggle('is-active', paused);
  }

  pauseButton.addEventListener('click', togglePause);

  // ---- Mode toggles (erosion, rain) -------------------------------------

  const erosionButton = document.getElementById('erosion-btn');
  function toggleErosion() {
    Physics.erosion = !Physics.erosion;
    erosionButton.classList.toggle('is-active', Physics.erosion);
  }
  erosionButton.addEventListener('click', toggleErosion);

  const rainButton = document.getElementById('rain-btn');
  function toggleRain() {
    Rain.enabled = !Rain.enabled;
    rainButton.classList.toggle('is-active', Rain.enabled);
  }
  rainButton.addEventListener('click', toggleRain);

  // ---- Rain acidity slider ---------------------------------------------

  const aciditySlider = document.getElementById('rain-acidity');
  const acidityValue = document.getElementById('rain-acidity-value');
  aciditySlider.min = String(CONFIG.RAIN.MIN_ACID_PERCENT);
  aciditySlider.max = String(CONFIG.RAIN.MAX_ACID_PERCENT);
  aciditySlider.value = String(CONFIG.RAIN.DEFAULT_ACID_PERCENT);

  function applyRainAcidity() {
    Rain.acidChance = Number(aciditySlider.value) / 100;
    acidityValue.textContent = `${aciditySlider.value}%`;
  }

  aciditySlider.addEventListener('input', applyRainAcidity);
  applyRainAcidity();

  // Initial selection + opening scene.
  selectMaterial(MATERIALS.SAND);
  Presets.random(grid);

  // ---- Status bar -------------------------------------------------------

  document.getElementById('size-canvas').textContent = `${CONFIG.CANVAS_SIZE} × ${CONFIG.CANVAS_SIZE}`;
  document.getElementById('size-grid').textContent = `${CONFIG.GRID_WIDTH} × ${CONFIG.GRID_HEIGHT}`;

  const fpsValue = document.getElementById('fps-value');
  const FPS_UPDATE_INTERVAL_MS = 250;
  const FPS_SMOOTHING = 0.1; // EMA factor: blend in each new sample a little.
  let lastFrameTime = performance.now();
  let fpsSmoothed = 0;
  let lastFpsUpdate = 0;

  function updateFps(now) {
    const dt = now - lastFrameTime;
    lastFrameTime = now;
    if (dt > 0) {
      const instantFps = 1000 / dt;
      fpsSmoothed =
        fpsSmoothed === 0
          ? instantFps
          : fpsSmoothed * (1 - FPS_SMOOTHING) + instantFps * FPS_SMOOTHING;
    }
    if (now - lastFpsUpdate >= FPS_UPDATE_INTERVAL_MS) {
      lastFpsUpdate = now;
      fpsValue.textContent = fpsSmoothed.toFixed(1);
    }
  }

  // ---- Main loop --------------------------------------------------------

  function frame(now) {
    updateFps(now);

    input.paint();

    if (!paused) {
      for (let t = 0; t < CONFIG.TICKS_PER_FRAME; t++) {
        Rain.update(grid); // no-op while rain is disabled
        Physics.tick(grid);
      }
    }

    renderer.draw();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
