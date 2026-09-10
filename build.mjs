#!/usr/bin/env node
/**
 * Build a shareable single-file version of Sandfall.
 *
 * Usage:
 *   node build.mjs            -> dist/sandfall.html (inlined, unminified)
 *   node build.mjs --minify   -> dist/sandfall.html (inlined + terser-minified)
 *
 * With --minify, the JS is minified with terser (checked for via
 * `npx --no-install`, fetched on demand via `npx --yes` if missing).
 * CSS is inlined as-is (no lightweight CSS-only minifier has a usable CLI).
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = dirname(fileURLToPath(import.meta.url));
const OUT = join(root, 'dist', 'sandfall.html');
const minify = process.argv.includes('--minify');

function fail(msg) {
  console.error(`build: ${msg}`);
  process.exit(1);
}

// --- Read sources -----------------------------------------------------------

let html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css', 'style.css'), 'utf8');

const scriptRe = /<script src="([^"]+)"><\/script>/g;
const srcs = [...html.matchAll(scriptRe)].map((m) => m[1]);
if (srcs.length === 0) fail('no external <script> tags found in index.html');

const jsFiles = new Map();
for (const src of srcs) {
  const code = readFileSync(join(root, src), 'utf8');
  if (code.includes('</script'))
    fail(`${src} contains a "</script" literal — inlining it would break the page`);
  jsFiles.set(src, code);
}

// --- Terser (only with --minify) ---------------------------------------------

let terserPrefix = null;
if (minify) {
  const probe = spawnSync('npx', ['--no-install', 'terser', '--version'], {
    stdio: 'pipe',
  });
  if (probe.status === 0) {
    console.log(`build: terser ${probe.stdout.toString().trim()} found locally`);
  } else {
    console.log('build: terser not installed locally — fetching via npx (one-time)...');
  }
  terserPrefix = probe.status === 0 ? [] : ['--yes'];
}

function terserMinify(code) {
  const dir = mkdtempSync(join(tmpdir(), 'sandfall-build-'));
  const srcFile = join(dir, 'in.js');
  const outFile = join(dir, 'out.js');
  writeFileSync(srcFile, code);
  const r = spawnSync(
    'npx',
    [...terserPrefix, 'terser', srcFile, '--output', outFile],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
  if (r.status !== 0) fail(`terser failed:\n${r.stderr.toString()}`);
  const result = readFileSync(outFile, 'utf8');
  rmSync(dir, { recursive: true, force: true });
  return result;
}

// --- Inline -------------------------------------------------------------------

if (!/<link rel="stylesheet" href="css\/style\.css" \/>/.test(html))
  fail('could not find the stylesheet <link> tag in index.html');
html = html.replace(
  /<link rel="stylesheet" href="css\/style\.css" \/>/,
  `<style>\n${css}\n</style>`
);

html = html.replace(scriptRe, (_m, src) => {
  const code = minify ? terserMinify(jsFiles.get(src)) : jsFiles.get(src);
  return `<script>\n${code}\n</script>`;
});

// --- Write ----------------------------------------------------------------------

if (/<script src=|<link rel="stylesheet"/.test(html))
  fail('build output still references external files — inlining incomplete');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);

const kb = (n) => (n / 1024).toFixed(1);
console.log(
  `build: wrote ${OUT} — ${kb(html.length)} KB (minified: ${minify ? 'yes' : 'no'})`
);
