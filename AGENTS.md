# AGENTS.md — Sandfall (falling sand simulation)

## What this is
A falling-sand cellular-automata sandbox in pure vanilla HTML/CSS/JS. No
build step, no dependencies, no ES modules — plain `<script>` tags so
`index.html` works from `file://`. Run tests with `node tests/run-tests.js`.

## Status (as of last session)
Complete and stable: 18/18 tests passing. Features: 5 paintables (Sand,
Water, Wall, Acid, Eraser=EMPTY), brush slider with pointer interpolation,
pause, clear, keyboard shortcuts (1–5 materials, P pause, E erosion, R rain),
status bar (canvas size / grid size / measured FPS), optional **Erosion** and
**Rain** modes (both off by default; keep them — user approved leaving them; Rain has an **acidity slider**, 0–100% default 0, per-drop water-vs-acid roll via `Rain.acidChance` 0..1),
**Presets** (`js/presets.js`): 5 ASCII-art scenes drawn centered on load and
after Clear (button relabeled "New scene (clear)"); `Presets.random(grid)`
clears then picks one at random (the user curates the art themselves), and a
**sleep/rest system** that skips settled particles (see below).

## Sleep system (performance)
- `Grid.rest` (Uint8Array) counts consecutive ticks a particle failed to
  act. `Physics.tick` skips a cell when `rest >= CONFIG.PHYSICS.SLEEP_AFTER_TICKS`
  (3); `grid.wake(x,y)` zeroes rest in a 3×3 neighborhood.
- **Every mutation must go through `grid.set`/`grid.swap`** — both call
  `wake` on the affected cells. A direct `grid.cells[i] = ...` write
  silently breaks wake-up (asleep neighbors never notice).
- `updateSand/updateLiquid/updateAcid` return a boolean (did anything
  happen?) and the tick loop bumps `rest` accordingly.
- **Water never sleeps in erosion mode** (`Physics.erosion`): its idle
  erosion roll must keep firing. Test `tests/test-sleep.js` covers all of
  this.
- Benchmark (Node, 250×250, settled): water 6.1→0.28 ms/frame, acid
  6.9→0.33, sand 3.3→0.29. Remaining cost is the outer 62,500-cell scan.
- Test gotcha: liquid pools spread laterally until bounded — a "settled
  pool" in a test must be full-width or walled, or its surface cells never
  sleep.
The user actively tunes `js/config.js` themselves (currently 250×250 grid,
500px canvas, 2 ticks/frame) — never revert their config values.

## Key implementation details (easy to break, hard to rediscover)
- **Files are DOM-free on purpose** except `renderer.js`, `input.js`,
  `app.js`. `config.js`, `materials.js`, `grid.js`, `physics.js`,
  `weather.js` must stay loadable in Node — tests depend on that.
- **Tests load the JS files into a `vm` context** (`tests/helpers/sandbox.js`)
  in the same order as `index.html`'s `<script>` tags. If you add a new
  core file, add it to BOTH places. Top-level `const`/`class` declarations
  persist across scripts in the same context, which is how the files share
  globals.
- **Physics invariants** (each has a dedicated test): bottom-to-top row
  scan; `moved` flag caps movement at 1 cell/tick; left/right order
  randomized per particle AND per row (removing either causes skew or
  teleporting). Moves are `Grid.swap`s; acid/erosion dissolves use
  `grid.set(..., EMPTY)` so sleeping neighbors get woken.
- **Texture is a static spatial noise map in the Renderer** (`shadeMap`),
  NOT stored on particles. This was a deliberate fix: per-particle shades
  caused ghost tints on dissolved cells. Do not reintroduce shade storage
  in the grid.
- **Canvas display size** comes from `CONFIG.CANVAS_SIZE` via the
  `--canvas-size` CSS variable set in `app.js` at startup; the CSS value is
  only a fallback. Internal canvas resolution = grid size; CSS upscales
  with `image-rendering: pixelated`.
- **Erosion** lives behind a `Physics.erosion` flag: sand-into-water becomes
  sedimentation (water cell → sand, no displacement); water rolls
  `CONFIG.EROSION.WATER_EROSION_CHANCE` to dissolve sand/wall below (drop
  stays put). Acid is unaffected. **Rain** (`js/weather.js`) spawns in row 0
  only, only into EMPTY cells, once per physics tick; intensity eases toward
  a random target redrawn every `TARGET_CHANGE_EVERY_TICKS`.
- **Painting**: `Input.paint()` runs once per frame (pours while held still)
  and interpolates the brush disc along a line from the last stamped
  position (fast mouse → continuous stream). `lastX/lastY` reset on
  press/release so re-pressing doesn't streak.
- Test trick: probabilistic rules are tested deterministically by overriding
  the chance in the sandbox context (`CONFIG.EROSION.WATER_EROSION_CHANCE =
  0` or `1`) and restoring it in `finally`. Remember Rain/Physics mutable
  state persists across `run()` calls within one test file.

## Conventions
- No magic numbers — everything tunable lives in `js/config.js` (no input
  validation, by design).
- One test file per behavior in `tests/` (`test-*.js`), each independently
  editable; `run-tests.js` auto-discovers them.
- UI state buttons use the `.is-active` class; panel sections in
  `index.html` follow the existing pattern (see Modes/Actions sections).

## Known non-issues (do not "fix")
- Erosion + rain were originally added unprompted but the user explicitly
  asked to keep them.
- Water does not sink through acid and acid does not erode in erosion mode —
  intentional, unspecified by the user, works fine in practice.
- Canvas 400/500 px is CSS size only; the sim runs at grid resolution.
