#!/usr/bin/env bash
#
# EduAI Companion — full local CI pipeline.
#
# This is the SAME sequence `.github/workflows/ci.yml` runs, so a green
# `npm run ci` locally means a green PR check (network availability aside).
#
# Stages (fail fast, in this order):
#   1. secret scan      — dependency-free, must never find credentials
#   2. type check       — tsc --noEmit (the repo's lint gate)
#   3. unit tests       — vitest (AI routing, models, templates, rules)
#   4. content template — 101-assertion ONCE/GRADIENT/FOOTER contract
#   5. build            — vite client bundle + esbuild server bundle
#
# Usage:
#   npm run ci                 # full pipeline
#   npm run ci -- --skip-build # fast iteration (skips stage 5)
#
set -euo pipefail

cd "$(dirname "$0")/.."

SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

bold()  { printf '\n\033[1m%s\033[0m\n' "$1"; }
ok()    { printf '\033[32m✓ %s\033[0m\n' "$1"; }

START=$(date +%s)

bold "1/5 · Secret scan"
node scripts/scan-secrets.mjs
ok "no credentials outside reviewed exceptions"

bold "2/5 · Type check (tsc --noEmit)"
npx tsc --noEmit
ok "types clean"

bold "3/5 · Unit tests (vitest)"
npx vitest run
ok "unit tests passed"

bold "4/5 · Content template contract"
npx tsx scripts/verify-content-template.ts
ok "template contract verified"

if [ "$SKIP_BUILD" -eq 1 ]; then
  bold "5/5 · Build — SKIPPED (--skip-build)"
else
  bold "5/5 · Production build (vite + esbuild)"
  npm run build
  ok "client and server bundles built"
fi

bold "CI passed in $(( $(date +%s) - START ))s"
