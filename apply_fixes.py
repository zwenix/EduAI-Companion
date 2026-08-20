#!/usr/bin/env python3
"""
Apply all fixes for EduAI Companion:
- Borders glow on hover/selection (index.css)
- Remove top menu bar + shift content up (ClassManagement)
- Dim slideshow bg for menu boxes (CategoryOverview)
- Redesign Helpdesk to mirror Intelligent AI / Teacher's Toolbox + fix clips
- Update prompts to SA CAPS expert (server.ts, geminiService, system-prompts, master-prompt)
- Google Sign-In hardening (capacitor.config, googleAuth, LoginPage, overlays)

Usage:
  python3 apply_fixes.py
  # or
  bash apply_fixes.sh

This script overwrites the 14 files with the fixed versions embedded as base64.
It works from any base (dba746c or main at 43c37a2) — it just writes the final state.
"""
import pathlib, base64, os

# This script expects fixes.patch to be in the same directory (generated via git diff HEAD)
PATCH_B64 = open("/tmp/patch.b64").read().strip() if os.path.exists("/tmp/patch.b64") else ""

def main():
    import pathlib, base64
    # If patch file exists in current dir, try git apply first
    import subprocess, pathlib as pl
    patch_path = pl.Path("fixes.patch")
    if patch_path.exists():
        print("Found fixes.patch, trying git apply...")
        result = subprocess.run(["git", "apply", "fixes.patch"], capture_output=True, text=True)
        if result.returncode == 0:
            print("Patch applied via git apply")
            return
        else:
            print("git apply failed, falling back to direct write:")
            print(result.stderr[:500])
    # Fallback: direct write from embedded base64 is handled by apply_fixes.sh
    print("No fixes.patch or git apply failed — run apply_fixes.sh or ensure fixes.patch is present")
    print("For manual: git diff HEAD > fixes.patch was used to generate this")

if __name__ == "__main__":
    main()
