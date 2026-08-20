#!/bin/bash
set -e
if [ -f fixes.patch ]; then
  echo "Applying fixes.patch..."
  git apply fixes.patch || git apply --reject fixes.patch
  echo "Done. Now run: git add -A && git commit -m 'feat: glow borders, remove top bar, dim slideshow bg, redesign Helpdesk, fix clips, update prompts' && git push origin HEAD"
else
  echo "fixes.patch not found in current directory"
  echo "Ensure fixes.patch is present (it was generated via git diff HEAD > fixes.patch)"
  exit 1
fi
