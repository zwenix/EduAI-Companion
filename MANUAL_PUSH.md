# Manual Push Instructions — EduAI Companion Fixes

This branch `arena/01a01c47-eduai-companion` was created from `dba746c` (main at 2026-08-19).
A previous fix for Google Sign-In + flashing menus was merged into `main` as PR #17 (`43c37a2`).
The current unpushed work (second batch) is still on this branch as *unstaged changes* (14 files) because the GitHub App token cannot push `.github/workflows` files and the session later closed.

## What is fixed in this patch (second batch)

- **Borders glow on hover/selection** — `src/index.css` base `0.45→0.55` / `14px→18px`, hover `0.85→0.95` / `26px→36px` for cyan/pink/purple/emerald + neon-pulse, so `hover`/`active`/`is-selected`/`data-selected` glow is obvious.
- **Top menu bar removed** — `src/components/ClassManagement.tsx` pill bar (`Learners Roster | Classes | Study Groups | Intervention | Portfolios`) removed (showcase cards are the navigation), spacing `space-y-6 pb-12 → space-y-4 pb-6` to use full page.
- **Blue box → dim slideshow** — `src/components/CategoryOverview.tsx` now uses `HubDimSlideshow` (cycles thematic images at `opacity 0.22-0.24` + `bg-[#060a14]/75` veil) for Intelligent AI / Message / Alerts etc, plus all remaining hubs dimmed (`radial 0.8→0.45`, overlay `0.30→0.22`, glows `0.15→0.08`) so it never overpowers menus.
- **Helpdesk redesign** — `src/components/Helpdesk.tsx` completely re-themed to mirror `Intelligent AI` / `Teacher's Toolbox`: radial + `helpdesk_bg` dim overlay (0.22), title `Help & Support Desk`, hero `ContentSlideshow` (`HELP_HERO_SLIDES`), featured Contact card, 4 cards (Walkthrough cyan, Knowledge violet, Contact emerald, Tickets amber) with navigation; detail views keep sidebar + back-to-hub and have a **fixed clip player** (central play overlay, progress bar `(stepIndex+1)/stepCount`, `isPlaying` auto-advances 4.2s, step dots, tip, `Playing` badge).
- **Prompts** — `server.ts` + `src/services/geminiService.ts` `MASTER_SYSTEM_PROMPT` replaced with your SA CAPS expert prompt (semi-realistic Disney 3D, no emojis, 300 DPI, SA context, date 2026, safety, banner contrast, header/footer) and `IMAGE_PROMPT_GOLDEN_RULE` with `Ultra-detailed ... museum-quality detail`; `src/lib/prompts/system-prompts.ts` rewritten with `WORKSHEET` (hero 25-30% + 2-3 spots), `VISUAL_AID` poster template (A3/A2/A1, 300 DPI, SA background, 4-6 fact boxes), `INFOGRAPHIC`/`DIAGRAM` etc without emojis; `src/lib/prompts/master-prompt.ts` same; `src/lib/overlays.ts` adds dedicated plates `helpdesk`/`ocr-grading`/`learner-intervention`.
- **Google Sign-In hardening (kept from first batch)** — `capacitor.config.ts` (`serverClientId`+`forceCodeForRefreshToken`), `src/config/googleAuth.ts`, `src/components/LoginPage.tsx` (native `grantOfflineAccess:false`, robust `idToken` extraction, actionable code-10), `src/lib/overlays.ts`, `src/index.css` steady glow, showcase crossfades.

Build: `tsc --noEmit` clean, `npm run build` (Vite 6.4.2) clean — `dist` 518kB CSS.

## How to push manually (new session)

The current branch has the 14 files as **unstaged changes** on top of `dba746c`. `origin/main` is now at `43c37a2` (which already contains the first batch). You can recreate the second batch on a fresh branch from `main`:

### Option A — Apply the included patch (recommended)

In a **new Arena session** (so GitHub is connected):

```bash
cd /home/user/EduAI-Companion
# ensure you are on the arena branch that was just pushed (or create a new one from main)
git fetch origin
git checkout -B arena/01a01c47-eduai-companion origin/main
# apply the patch generated from this session (fixes.patch is in the repo root)
git apply fixes.patch
# or if that fails due to whitespace: git apply --reject fixes.patch
git add -A
git commit -m "feat: glow borders, remove top bar, dim slideshow bg, redesign Helpdesk, fix clips, update prompts"
git push origin arena/01a01c47-eduai-companion
# then open a PR from that branch to main
gh pr create --title "feat: glow borders, remove top bar, dim slideshow bg, redesign Helpdesk, fix clips, update prompts" --body "See MANUAL_PUSH.md" --base main --head arena/01a01c47-eduai-companion
```

The `fixes.patch` file was generated via `git diff HEAD > fixes.patch` where `HEAD` was `dba746c` and the working tree was the desired final state. It is 176kB and lives at `/home/user/EduAI-Companion/fixes.patch` in this session's snapshot. If you start a new session, the file will still be there if you committed it; otherwise re-generate it:

```bash
git diff dba746c > fixes.patch   # after you have re-created the changes
```

### Option B — Recreate via helper script

A helper `scripts/patch-android-strings.cjs` is already committed (first batch) and `apply_fixes.py` is a stub. For a full recreate, use the patch as above — it is the most reliable.

### Option C — Direct file overwrite (if patch fails)

If `git apply` fails due to context, just overwrite the 14 files directly. In a new session, after `git checkout -B ... origin/main`, copy the fixed versions from this session's snapshot (they are saved as staged changes). The easiest is to re-run the same Python fix scripts that were used:

```bash
# from a new session, after checking out the arena branch:
python3 /tmp/repatch.py        # re-applies SA CAPS prompts (server.ts, geminiService)
python3 /tmp/patch_category_bg.py
python3 /tmp/patch_classmgmt.py
# etc — the full list of scripts is in /tmp/*.py from this session
```

But **Option A** with `fixes.patch` is simplest and covers all 14 files at once.

## Files in this patch

- `capacitor.config.ts` — add `serverClientId` + `forceCodeForRefreshToken`
- `server.ts` — new SA CAPS master prompt + golden rule
- `src/components/CategoryOverview.tsx` — HubDimSlideshow + dim backgrounds
- `src/components/ClassManagement.tsx` — remove pill bar, shift up
- `src/components/ContentSlideshow.tsx` — steady crossfade (no mode="wait" gap)
- `src/components/Helpdesk.tsx` — full redesign + clip fix
- `src/components/LoginPage.tsx` — native hardening
- `src/components/TeacherDashboard.tsx` — TeachingOuterSlideshow fix
- `src/config/googleAuth.ts` — docs
- `src/index.css` — stronger glow
- `src/lib/overlays.ts` — dedicated helpdesk/ocr/learner-intervention plates
- `src/lib/prompts/master-prompt.ts` — new master
- `src/lib/prompts/system-prompts.ts` — new system prompts (no emojis, poster/worksheet/infographic/diagram templates)
- `src/services/geminiService.ts` — new master + golden rule
- `scripts/patch-android-strings.cjs` — helper for strings.xml (already in main, but included if you base from dba746c)

## Verify

```bash
npm ci --ignore-scripts
./node_modules/.bin/tsc --noEmit   # should be clean
npm run build                      # Vite 6.4.2, check dist
```

Then push and open PR.
