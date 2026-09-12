# Sandfall — Falling Sand Simulation

A falling-sand (cellular automata) sandbox in pure vanilla HTML/CSS/JavaScript.
No build step required to run — just open `index.html` in a browser.
(An optional single-file build for sharing is available, see below.)

> AI agents: read [`AGENTS.md`](AGENTS.md) first — project status, invariants,
> and pitfalls are documented there.

## Running

**Option 1 (preferred): open directly**

```sh
# From the project root, open index.html in any modern browser.
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

**Option 2: any static file server** (equivalent, e.g. if your browser is
strict about local files)

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

No `npm install`, no dev server needed — the scripts are plain `<script>` tags
(no ES modules), so the app also works from `file://`.

## Try it without cloning

GitHub can't run HTML files in the browser (it serves them as raw text, and
rendered READMEs can't embed live pages), so the fastest way to play is:

1. Open [`dist/sandfall.html`](dist/sandfall.html) in the repo (it's committed
   and minified — no build step needed).
2. Click the **Raw** button, then `Ctrl/Cmd+S` to save the file locally
   (or right-click → *Save link as…*).
3. Double-click the saved file — it's fully self-contained and runs from
   `file://`.

(If you host this repo with GitHub Pages enabled, `dist/sandfall.html` would
be directly playable in the browser — Pages serves real HTML, unlike the repo
file view.)

## Building a single shareable file

To send the app to someone as one self-contained file, build
`dist/sandfall.html` with the stylesheet and all ten scripts inlined (in the
same order as in `index.html`):

```sh
./build.sh            # inlined, readable JS (~62 KB)
./build.sh --minify   # additionally minifies the JS with terser (~41 KB)
```

Requires only Node — no `npm install`. With `--minify`, terser is fetched on
demand via `npx` on first use if it is not already installed (cached after
that). CSS is inlined unmodified. The output works from `file://` exactly like
the source. The minified build is committed at `dist/sandfall.html` (see
*Try it without cloning* above), so rebuild after source changes if you want
the repo copy current.

## Using the app

- **Material buttons** (or keys `1`–`5`) pick what you paint: Sand, Water,
  Wall, Acid, and the Eraser (paints empty space, works on walls too).
- **Brush size slider** sets the brush radius (in grid cells).
- **Clear canvas** empties the grid. **Pause** (or key `P`) freezes physics.
- **Click & drag** on the canvas to pour material. Keep the button held down
  and the stream keeps pouring even if the pointer stops moving. Fast mouse
  movements are interpolated between pointer positions, so the pour stays
  continuous.
- **Modes** (toggle, combinable):
  - **Erosion** (key `E`): sand falling into water *converts* the water into
    sand (sedimentation, no displacement), and water sitting on sand or wall
    has a random chance per tick to dissolve that cell into water.
  - **Rain** (key `R`, on by default): water drops fall from the top of the
    grid at a random intensity that gently thickens and thins over time; a
    rate slider caps it and an acidity slider makes some drops acid.
  - **Drain** (key `D`, on by default): removes water/acid from the bottom
    row at the slider-set speed, so a raining grid doesn't fill up.

## Simulation rules

The world is a `CONFIG.GRID_WIDTH` × `CONFIG.GRID_HEIGHT` cell grid rendered
onto a `CONFIG.CANVAS_SIZE`-pixel CSS canvas (`image-rendering: pixelated`
for a crisp upscale; the display size is injected from the config at startup).
Each frame, `CONFIG.TICKS_PER_FRAME` physics ticks scan the grid **from the
bottom row up**, moving each particle at most one cell per tick (a per-tick
`moved` flag prevents multi-cell travel).
Every horizontal/diagonal choice randomizes whether left or right is checked
first, so piles and liquids stay centered rather than skewing.

| Material | Behavior |
|---|---|
| **Empty** `#1e1e24` | Void. |
| **Sand** `#e9c46a` | Falls straight down; sinks through Water/Acid (displacing it upward); if blocked below, slides diagonally down-left/right at random. |
| **Water** `#457b9d` | Falls down; if blocked, slides diagonally; if still blocked, spreads horizontally one cell per tick. |
| **Wall** `#6c757d` | Static, impassable. |
| **Acid** `#55ff33` | Flows exactly like Water, but on direct contact (up/down/left/right) with Sand or Wall it dissolves **both** itself and that cell into empty space. |
| **Eraser** | Not a material — it stamps Empty space with the brush, for undoing mistakes (including walls). |

In **erosion mode**, the Sand and Water rules change: sand falling into water
turns the water cell into sand (sedimentation), and each water particle with
sand or wall directly below rolls `CONFIG.EROSION.WATER_EROSION_CHANCE`; on
success that cell becomes water. Acid is unaffected. **Rain mode** (independent
of erosion) spawns water in the top row every tick, at a rate that wanders
randomly between `CONFIG.RAIN.MIN_DROPS_PER_TICK` and `MAX_DROPS_PER_TICK`.

A status bar under the canvas shows the canvas size, the grid size, and the
measured FPS (exponential moving average of frame deltas, refreshed 4×/s).

A static per-cell brightness texture (a noise map generated once and fixed to
the canvas) gives the materials a granular look. Because it is attached to
positions rather than particles, the texture never moves with the falling
material — and cells that dissolve (e.g. from acid) are always left as the
uniform background color, never with a stale tint.

## Project structure

```
index.html              Page layout + script include order
css/style.css           Dark dashboard theme
js/config.js            All tunable constants (grid size, canvas size, ...)
js/materials.js         Material ids and metadata (names, colors)
js/grid.js              Grid state (flat typed arrays), no DOM
js/physics.js           The cellular automaton rules (incl. erosion mode), no DOM
js/weather.js           Rain system (random-wandering intensity), no DOM
js/drain.js             Drain system (removes liquid from the bottom row), no DOM
js/presets.js           ASCII-art starting scenes
js/renderer.js          ImageData blit of the grid to the canvas
js/input.js             Mouse/pointer painting (brush disc, hold-to-pour)
js/app.js               DOM wiring (buttons, slider, pause) + rAF loop
build.sh / build.mjs    Optional single-file build (see above)
tests/                  Node-based tests for the physics core
  helpers/sandbox.js    Loads the DOM-free JS files into a vm context
  run-tests.js          Runs every test-*.js file
  test-*.js             One file per behavior, edit independently
```

## Tests

The physics core (`js/grid.js`, `js/physics.js`) is DOM-free, so the tests run
it directly in Node via a `vm` sandbox that loads the files in the same order
as the browser:

```sh
node tests/run-tests.js
```

Covers: sand fall, sand sinking through water, no-teleport (≤1 cell/tick),
sand spreading to both sides (direction randomization), water fall / diagonal
/ horizontal spread, wall immutability, acid dissolving sand & wall (top,
bottom and side contact), acid flowing like water, erosion sedimentation,
water erosion of sand & wall, and rain spawning / intensity bounds.

## Tuning

All constants (grid dimensions, canvas size, ticks per frame, color shade
variation, brush defaults, erosion chance, rain intensity bounds) live in
`js/config.js`. Change them there; no other file needs editing. The canvas
display size follows `CANVAS_SIZE` automatically — the app injects it into
the CSS `--canvas-size` variable at startup.
