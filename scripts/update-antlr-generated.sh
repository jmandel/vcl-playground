#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

mkdir -p antlr-generated
find antlr-generated -mindepth 1 -delete
bunx antlr-ng -Dlanguage=TypeScript -l false -v false -o antlr-generated grammar/VCL.g4
bash scripts/update-grammar-source.sh
