# Sandfall — Falling Sand Simulation

A falling-sand (cellular automata) sandbox in pure vanilla HTML/CSS/JavaScript.
No build step, no dependencies — just open `index.html` in a browser.

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

## Using the app

- **Material buttons** (or keys `1`–`4`) pick what you paint: Sand, Water,
  Wall, Acid.
- **Brush size slider** sets the brush radius (in grid cells).
- **Clear canvas** empties the grid. **Pause** (or key `P`) freezes physics.
- **Click & drag** on the canvas to pour material. Keep the button held down
  and the stream keeps pouring even if the pointer stops moving.

## Simulation rules

The world is a 200×200 cell grid rendered onto a 400×400 CSS canvas
(`image-rendering: pixelated` for a crisp 2× upscale). Each frame, one
physics tick scans the grid **from the bottom row up**, moving each particle
at most one cell (a per-tick `moved` flag prevents multi-cell travel).
Every horizontal/diagonal choice randomizes whether left or right is checked
first, so piles and liquids stay centered rather than skewing.

| Material | Behavior |
|---|---|
| **Empty** `#1e1e24` | Void. |
| **Sand** `#e9c46a` | Falls straight down; sinks through Water/Acid (displacing it upward); if blocked below, slides diagonally down-left/right at random. |
| **Water** `#457b9d` | Falls down; if blocked, slides diagonally; if still blocked, spreads horizontally one cell per tick. |
| **Wall** `#6c757d` | Static, impassable. |
| **Acid** `#55ff33` | Flows exactly like Water, but on direct contact (up/down/left/right) with Sand or Wall it dissolves **both** itself and that cell into empty space. |

Each particle also gets a random brightness shade of its material color for a
granular look.

## Project structure

```
index.html              Page layout + script include order
css/style.css           Dark dashboard theme
js/config.js            All tunable constants (grid size, canvas size, ...)
js/materials.js         Material ids and metadata (names, colors)
js/grid.js              Grid state (flat typed arrays), no DOM
js/physics.js           The cellular automaton rules, no DOM
js/renderer.js          ImageData blit of the grid to the canvas
js/input.js             Mouse/pointer painting (brush disc, hold-to-pour)
js/app.js               DOM wiring (buttons, slider, pause) + rAF loop
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
bottom and side contact), and acid flowing like water.

## Tuning

All constants (grid dimensions, canvas size, ticks per frame, color shade
variation, brush defaults) live in `js/config.js`. Change them there; no other
file needs editing.
