#!/usr/bin/env node
/**
 * Layout verification: the mobile layout must be width-stable.
 *
 * Regression guard for the "canvas breathing" bug: the stage, canvas
 * frame and status bar must keep an exactly constant width no matter
 * what the FPS text says (and at larger root font sizes), and the page
 * must never overflow the viewport horizontally.
 *
 * This is a browser-based check, NOT a unit test — it is intentionally
 * not in tests/ (run-tests.js auto-discovers test-*.js and runs them in
 * plain Node with no DOM/browser).
 *
 * Requirements: playwright + a Firefox browser
 *   npx playwright install --with-deps firefox
 *   (see the Dockerfile notes in the repo for a system-wide setup)
 *
 * Usage:
 *   node tools/verify-mobile-layout.mjs [path-or-url]
 * Defaults to the repo's index.html. Set NODE_PATH to a directory
 * containing the playwright package if it is not installed locally,
 * e.g. NODE_PATH=$(npm root -g).
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// createRequire (unlike ESM import) honors NODE_PATH, so a globally
// installed playwright is usable without a local node_modules.
const require = createRequire(import.meta.url);

let firefox;
try {
  ({ firefox } = require('playwright'));
} catch {
  console.error(
    'playwright is not resolvable from here.\n' +
    'Install it (npm i -g playwright) and run with NODE_PATH=$(npm root -g),\n' +
    'or install it locally in the repo.'
  );
  process.exit(2);
}

const target =
  process.argv[2] ??
  'file://' +
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');

const VIEWPORT = { width: 390, height: 844 };
const FONT_SIZES = ['16px', '20px'];
const FPS_VALUES = ['9.9', '99.9', '100.0', '123.456'];

const browser = await firefox.launch();
const page = await browser.newPage({ viewport: VIEWPORT });
await page.goto(target);
await page.waitForTimeout(1500); // let the app start and sizes settle

let failures = 0;
const check = (label, cond, detail) => {
  if (cond) {
    console.log(`  ok  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label} — ${detail}`);
  }
};

for (const font of FONT_SIZES) {
  await page.evaluate((f) => {
    document.documentElement.style.fontSize = f;
  }, font);

  const widths = [];
  for (const fps of FPS_VALUES) {
    await page.evaluate((t) => {
      document.getElementById('fps-value').textContent = t;
    }, fps);
    await page.waitForTimeout(150);
    const m = await page.evaluate(() => {
      const rect = (sel) => document.querySelector(sel).getBoundingClientRect();
      return {
        stage: rect('.stage').width,
        frame: rect('.canvas-frame').width,
        bar: rect('.status-bar').width,
        docW: document.documentElement.scrollWidth,
      };
    });
    widths.push(m);
    console.log(
      `font=${font} fps=${fps.padEnd(8)} stage=${m.stage.toFixed(1)} ` +
        `frame=${m.frame.toFixed(1)} bar=${m.bar.toFixed(1)} docW=${m.docW}`
    );
  }

  const same = (key) =>
    widths.every((w) => Math.abs(w[key] - widths[0][key]) < 0.5);
  check(
    `font=${font}: stage/frame/bar width stable across FPS text`,
    same('stage') && same('frame') && same('bar'),
    JSON.stringify(widths)
  );
  check(
    `font=${font}: no horizontal overflow (scrollWidth == ${VIEWPORT.width})`,
    widths.every((w) => w.docW <= VIEWPORT.width),
    JSON.stringify(widths.map((w) => w.docW))
  );
}

await browser.close();

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll layout checks passed');
