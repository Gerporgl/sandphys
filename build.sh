#!/usr/bin/env bash
# Build a shareable single-file version of Sandfall.
#
#   ./build.sh            -> dist/sandfall.html (inlined, unminified)
#   ./build.sh --minify   -> dist/sandfall.html (inlined + minified)
set -euo pipefail
cd "$(dirname "$0")"
exec node build.mjs "$@"
