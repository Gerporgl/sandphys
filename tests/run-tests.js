/**
 * Test runner: executes every tests/test-*.js file and reports results.
 *
 * Usage:  node tests/run-tests.js
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const files = fs
  .readdirSync(__dirname)
  .filter((f) => f.startsWith('test-') && f.endsWith('.js'))
  .sort();

let passed = 0;
let failed = 0;

for (const file of files) {
  try {
    require(path.join(__dirname, file));
    console.log(`  \u2713 ${file}`);
    passed++;
  } catch (err) {
    console.error(`  \u2717 ${file}`);
    console.error(`      ${String(err.message).split('\n').join('\n      ')}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed, ${files.length} total`);
process.exit(failed > 0 ? 1 : 0);
