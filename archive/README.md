# Archive — historical one-off scripts

**Nothing in this folder is part of the application, the build, or CI.**

These files accumulated at the repository root during the early, fast-moving
development of EduAI Companion: one-shot Python/Node scripts that patched a
component in place, temporary probes, provider experiments, and a captured
patch file from a session that could not be pushed at the time.

They were moved here from the repository root on **2 October 2026** as part of
the repository-hygiene work tracked in
[`TECHNICAL_SPECIFICATION.md` §14](../TECHNICAL_SPECIFICATION.md) (item 5) and
§15 (roadmap item 5).

## What moved

| Pattern | Examples | What they were |
| :--- | :--- | :--- |
| `fix_*.py`, `fix_*.cjs` | `fix_notes.py`, `fix_gemini_models.cjs` | In-place source patchers used to correct a component, prompt or colour token. |
| `patch_*.cjs`, `patch_*.js` | `patch_settings.cjs`, `patch_weekly.cjs` | Feature-adding patchers (admin fields, notifications, class management…). |
| `update_*.cjs` | `update_dark_mode.cjs`, `update_models.cjs` | Earlier name for the same idea. |
| `test-*.mjs`, `test_*.ts/js` | `test-hf-video.mjs`, `test-firestore.ts` | Ad-hoc provider/network probes — **not** a test suite. |
| `detect_file_type.ts`, `find_recent.ts` | — | Debug helpers for inspecting the AI Studio container. |
| `apply.sh`, `apply_fixes.py`, `fixes.patch` | — | The apply path for the patch captured in `MANUAL_PUSH.md`, kept for history. |
| `run_build.sh`, `sh-env.js`, `make_pixels.cjs`, `revert_ends.cjs` | — | Small utilities (build shim, env dump, icon pixels, revert helper). |
| `extracted_action_endpoint.txt`, `Improvement_Plan.` | — | A captured endpoint dump and an empty planning file. |

## Conventions

- **Do not import from this folder** and do not reference it from
  `package.json`, CI or application code.
- `tsconfig.json` excludes `archive/`, so archived files are not type-checked.
- Real, maintained developer tooling lives in [`../scripts/`](../scripts) and
  the test suite in [`../tests/`](../tests). If one of these historical scripts
  is still useful, port it there as a reviewed, tested script instead.
- The files are retained (rather than deleted) purely so the project history
  stays recoverable; delete the folder once you are satisfied nothing in it is
  needed.
