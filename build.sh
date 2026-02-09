#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

bun test vcl.test.js
rm -rf dist
bun build index.html tutorial.html --outdir=dist
