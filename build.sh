#!/usr/bin/env bash
# Build the VCL tutorial:
# 1. Run tests to verify all examples return results and no [object Object]
# 2. Bundle HTML + TS + JSON with bun build
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "Running tests..."
bun test vcl.test.js
echo ""

echo "Building..."
rm -rf dist
bun build vcl-tutorial-template.html --outdir=dist

# Copy built files to project root for serving / GitHub Pages
cp dist/vcl-tutorial-template.html vcl-tutorial.html
cp dist/*.js ./ 2>/dev/null || true

echo ""
echo "Built files:"
ls -lh vcl-tutorial.html dist/*.js
