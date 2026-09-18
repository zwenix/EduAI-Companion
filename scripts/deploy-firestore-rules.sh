#!/usr/bin/env bash
#
# Deploy the repo's Firestore security rules to the live project.
#
# WHY THIS EXISTS
# ---------------
# The Teacher Dashboard "Interventions sync err: Missing or insufficient
# permissions" (and the same class of error on any newly-added collection)
# happens when the rules *deployed* to the Firebase project are older than the
# `firestore.rules` file in this repo. The live app talks to the AI Studio
# project `gen-lang-client-0448588221` (see firebase-applet-config.json); the
# collection rules for `learner_interventions`, `portfolio_items`,
# `student_records`, etc. only take effect after this file is pushed.
#
# This script does that push. It requires the Firebase CLI and an authenticated
# login with permission on the target project.
#
# Usage:
#   1. npm install -g firebase-tools        (once)
#   2. firebase login                        (once, opens a browser)
#   3. bash scripts/deploy-firestore-rules.sh
#
# You can also target a different project without editing .firebaserc:
#   firebase deploy --only firestore:rules --project <projectId>

set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v firebase >/dev/null 2>&1; then
  echo "error: Firebase CLI not found. Install it with: npm install -g firebase-tools" >&2
  exit 1
fi

PROJECT="$(node -e "const c=require('./.firebaserc');console.log(c.projects.default||'')" 2>/dev/null || true)"

echo "==> Deploying Firestore rules"
[ -n "$PROJECT" ] && echo "    project: $PROJECT"
echo "    rules:   firestore.rules"
echo

# `--non-interactive` fails fast on a missing login instead of hanging.
firebase deploy --only firestore:rules --non-interactive

echo
echo "Done. Rules are live. Reload the app — 'Interventions sync err' should be gone."
echo "Note: the client also keeps a localStorage mirror, so the dashboard keeps"
echo "working even before the rules are deployed."
