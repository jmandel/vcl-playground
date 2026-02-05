#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

bun test vcl.test.js
bun build index.html tutorial.html --outdir=dist
