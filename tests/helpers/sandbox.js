/**
 * Test sandbox: loads the DOM-free app files (config, materials, grid,
 * physics) into a Node `vm` context, emulating the browser where they share
 * one global scope. Tests then run snippets inside that context.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const ROOT = path.join(__dirname, '..', '..');

// Load order mirrors <script> tags in index.html (DOM-free files only).
const APP_FILES = [
  'js/config.js',
  'js/materials.js',
  'js/grid.js',
  'js/physics.js',
];

function createSandbox() {
  const context = vm.createContext({ console, assert });
  for (const file of APP_FILES) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(code, context, { filename: file });
  }
  return context;
}

/**
 * Run a function inside the sandbox context. The function body can use
 * `Grid`, `Physics`, `MATERIALS`, `CONFIG` and `assert` directly.
 * Assertions that throw propagate to the caller.
 */
function run(context, fn) {
  const code = `;(${fn.toString()})();`;
  vm.runInContext(code, context, { filename: 'test-snippet' });
}

module.exports = { createSandbox, run };
