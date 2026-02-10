#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

bun install --frozen-lockfile
bash scripts/check-antlr-generated.sh
bun test
find dist -mindepth 1 -delete 2>/dev/null || true
mkdir -p dist
bun build index.html tutorial.html --outdir=dist
