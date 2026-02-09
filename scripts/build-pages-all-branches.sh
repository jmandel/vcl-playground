#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PAGES_DIST="${PAGES_DIST:-pages-dist}"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-}"

if [[ -z "$DEFAULT_BRANCH" ]]; then
  DEFAULT_BRANCH="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||' || true)"
fi
if [[ -z "$DEFAULT_BRANCH" ]]; then
  DEFAULT_BRANCH="main"
fi

rm -rf "$PAGES_DIST"
mkdir -p "$PAGES_DIST/branches"

mapfile -t ALL_BRANCHES < <(
  git for-each-ref --format='%(refname:short)' refs/remotes/origin \
    | sed 's|^origin/||' \
    | grep -v '^HEAD$' \
    | sort
)

if [[ ${#ALL_BRANCHES[@]} -eq 0 ]]; then
  echo "No remote branches found under origin/*" >&2
  exit 1
fi

declare -a ORDERED_BRANCHES=()
ORDERED_BRANCHES+=("$DEFAULT_BRANCH")
for b in "${ALL_BRANCHES[@]}"; do
  [[ "$b" == "$DEFAULT_BRANCH" ]] && continue
  ORDERED_BRANCHES+=("$b")
done

slugify() {
  local raw="$1"
  printf '%s' "$raw" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's|[^a-z0-9._-]+|-|g; s|^-+||; s|-+$||'
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

declare -A USED_SLUGS=()
declare -a SUCCESS_NAMES=()
declare -a SUCCESS_SLUGS=()
declare -a SUCCESS_SHAS=()
MAIN_BUILT=0

for branch in "${ORDERED_BRANCHES[@]}"; do
  ref="origin/${branch}"
  if ! git rev-parse --verify --quiet "$ref" >/dev/null; then
    continue
  fi

  base_slug="$(slugify "$branch")"
  if [[ -z "$base_slug" ]]; then
    base_slug="branch"
  fi
  slug="$base_slug"
  i=2
  while [[ -n "${USED_SLUGS[$slug]+x}" ]]; do
    slug="${base_slug}-${i}"
    i=$((i + 1))
  done
  USED_SLUGS[$slug]=1

  sha="$(git rev-parse --short=12 "$ref")"
  wt="$(mktemp -d)"
  echo "Building ${branch} (${sha}) -> ${slug}"
  git worktree add --detach "$wt" "$ref" >/dev/null

  build_ok=0
  if (cd "$wt" && bash build.sh); then
    build_ok=1
  else
    echo "::warning::Build failed for branch ${branch}" >&2
  fi

  if [[ "$build_ok" -eq 1 ]]; then
    target="$PAGES_DIST/branches/$slug"
    rm -rf "$target"
    mkdir -p "$target"
    cp -a "$wt/dist/." "$target/"

    if [[ "$branch" == "$DEFAULT_BRANCH" ]]; then
      rm -rf "$PAGES_DIST"/index.html "$PAGES_DIST"/tutorial.html "$PAGES_DIST"/*.js "$PAGES_DIST"/*.css 2>/dev/null || true
      cp -a "$wt/dist/." "$PAGES_DIST/"
      MAIN_BUILT=1
    fi

    SUCCESS_NAMES+=("$branch")
    SUCCESS_SLUGS+=("$slug")
    SUCCESS_SHAS+=("$sha")
  fi

  git worktree remove --force "$wt" >/dev/null || true
  rm -rf "$wt"
done

if [[ ${#SUCCESS_NAMES[@]} -eq 0 ]]; then
  echo "No branches built successfully." >&2
  exit 1
fi

if [[ "$MAIN_BUILT" -eq 0 ]]; then
  echo "::warning::Default branch ${DEFAULT_BRANCH} did not build; using first successful branch at site root." >&2
  fallback_slug="${SUCCESS_SLUGS[0]}"
  cp -a "$PAGES_DIST/branches/$fallback_slug/." "$PAGES_DIST/"
fi

manifest="$PAGES_DIST/branches.json"
{
  echo "{"
  echo "  \"generatedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
  echo "  \"defaultBranch\": \"$(json_escape "$DEFAULT_BRANCH")\","
  echo "  \"branches\": ["
  for i in "${!SUCCESS_NAMES[@]}"; do
    comma=","
    if [[ "$i" -eq $((${#SUCCESS_NAMES[@]} - 1)) ]]; then
      comma=""
    fi
    name_esc="$(json_escape "${SUCCESS_NAMES[$i]}")"
    slug_esc="$(json_escape "${SUCCESS_SLUGS[$i]}")"
    sha_esc="$(json_escape "${SUCCESS_SHAS[$i]}")"
    path_esc="$(json_escape "branches/${SUCCESS_SLUGS[$i]}/")"
    echo "    {\"name\":\"${name_esc}\",\"slug\":\"${slug_esc}\",\"path\":\"${path_esc}\",\"sha\":\"${sha_esc}\"}${comma}"
  done
  echo "  ]"
  echo "}"
} > "$manifest"

echo "Wrote $(realpath "$manifest")"
