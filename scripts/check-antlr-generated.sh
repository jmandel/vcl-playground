#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

tmp_before="$(mktemp -d)"
tmp_after="$(mktemp -d)"
cleanup() {
  rm -rf "$tmp_before" "$tmp_after"
}
trap cleanup EXIT

mkdir -p "$tmp_before/antlr-generated" "$tmp_after/antlr-generated"
mkdir -p "$tmp_before/generated" "$tmp_after/generated"

cp -a antlr-generated/. "$tmp_before/antlr-generated/" 2>/dev/null || true
cp -a generated/vcl-grammar-source.ts "$tmp_before/generated/" 2>/dev/null || true

bash scripts/update-antlr-generated.sh

cp -a antlr-generated/. "$tmp_after/antlr-generated/" 2>/dev/null || true
cp -a generated/vcl-grammar-source.ts "$tmp_after/generated/" 2>/dev/null || true

if ! diff -ru "$tmp_before/antlr-generated" "$tmp_after/antlr-generated" >/dev/null; then
  echo "ANTLR generated parser is out of date."
  echo "Run: bash scripts/update-antlr-generated.sh"
  diff -ru "$tmp_before/antlr-generated" "$tmp_after/antlr-generated" || true
  exit 1
fi

if ! diff -u "$tmp_before/generated/vcl-grammar-source.ts" "$tmp_after/generated/vcl-grammar-source.ts" >/dev/null 2>&1; then
  echo "Embedded grammar source is out of date."
  echo "Run: bash scripts/update-antlr-generated.sh"
  diff -u "$tmp_before/generated/vcl-grammar-source.ts" "$tmp_after/generated/vcl-grammar-source.ts" || true
  exit 1
fi
