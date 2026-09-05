# Learner Portfolios, Intervention History & App-Wide Contrast Pass

This document records four pieces of work delivered together:

1. **Intervention Hub** — teachers can now see every learner, their full intervention
   history and all reports.
2. **Learner Portfolio Hub** — teachers can open the Academic Portfolio of *every*
   learner, grouped by class or alphabetically.
3. **IDP visibility & permissions** — IDPs are visible to teachers (editable) and to
   learners/parents (read-only).
4. **Contrast pass** — the Quiz Wizard card was being washed out by its background
   artwork. The whole app was scanned for the same problem and fixed.

---

## 1. Intervention Hub (`src/components/LearnerInterventionHub.tsx`)

The hub previously only exposed the plan *wizard*, a quick-load list, an exercise
library and a hardcoded demo timetable. It had no view of the teacher's learner
register and no consolidated history.

### New tabs

The tab strip is now numbered 1–7:

| # | Tab | What it shows |
|---|-----|---------------|
| 1 | Intervention Wizard | 5-step SIAS plan builder (now with a learner picker) |
| 2 | Quick Load | Existing saved plans |
| 3 | **Learners** (new, sky) | The teacher's full learner register |
| 4 | Strategy Library | Support strategies, filtered by the subjects the teacher actually teaches |
| 5 | **History & Reports** (new, rose) | Every plan, graded assessment and published report in one vault |
| 6 | Exercises | Differentiated exercise bank |
| 7 | Support Timetable | Weekly session schedule derived from real plans |

### Learners register tab

* Stat strip: learners on register · on intervention support · awaiting a first plan ·
  reports on file.
* Search box + class filter (class list is derived from the register, not hardcoded).
* One card per learner showing plan status, a progress bar for the current plan, and
  three actions: **Open ILP**, **New Plan**, **Portfolio**.

### History & Reports vault tab

* Stat strip: history entries · intervention plans · graded assessments · published reports.
* Filter pills: Everything / Plans / Graded / Published, plus free-text search.
* A single descending timeline built from three sources:
  * `learner_interventions` (plans written by this hub),
  * `auto_grading_reports` (OCR auto-grading results),
  * `published_reports` (reports dispatched to parents).
* `toMillis()` normalises Firestore `Timestamp`s, ISO strings and `dd/mm/yyyy`
  strings so the three sources sort correctly together.
* A register-coverage grid shows which learners have plans and which do not.

### Other hub fixes

* **Wizard step 1** now has a learner `<select>` plus quick-pick chips. Choosing a
  learner fills `studentId`, `learnerName` and `grade`, so plans are linked to a real
  learner record instead of a free-typed name.
* **Quick Load** resolves a real learner by first-name match and uses the matched grade.
* **Delete** was previously a no-op button. It is now wrapped in `canManage` and calls
  `handleDeleteProfile()` → `deleteDoc(doc(db, 'learner_interventions', id))`, syncs the
  localStorage mirror and raises a toast.
* **Support Timetable** no longer shows the hardcoded "Sipho / Keira" demo calendar.
  `weeklySchedule` distributes each active plan's `sessionsPerWeek` across Mon–Fri,
  `weeklySessionTotal` and `pendingParentUpdates` are computed from live data, and each
  day renders real session chips.
* The hub accepts a `userRole` prop (`App.tsx` passes the signed-in role,
  `ClassManagement.tsx` passes `"teacher"`). `canManage` gates create/edit/delete so
  learners and parents get read-only access.
* `LearnerInterventionProfile` gained `studentId` and `updatedAt`.

### Related bug fixed elsewhere

`src/components/StudentDevelopmentHub.tsx` read the collection **`interventions`**, but
every writer in the app writes **`learner_interventions`** — so learners never saw the
support plans their teachers built. The hub now also subscribes to
`learner_interventions` (matching on `studentId` or `learnerName`) and merges those
records into its list.

---

## 2. Learner Portfolio Hub

### New modules

* **`src/lib/learnerDirectory.ts`** — one shared learner directory for the whole app:
  types, sorting/grouping helpers (by class, by first name, by surname), and a
  `useLearnerDirectory(role)` hook that subscribes to `students` for the signed-in
  teacher and falls back to a 12-learner demo roster when Firestore is empty
  (demo login uses anonymous auth, so it has no data).
* **`src/lib/portfolioData.ts`** — the portfolio record store: `PortfolioRecord` type,
  localStorage cache, Firestore subscriptions, save/delete helpers and demo record
  generation. Collection: `portfolio_items`.
* **`src/components/LearnerPortfolioHub.tsx`** — the role-aware hub.
* **`src/components/StudentPortfolio.tsx`** — rewritten as a role-aware portfolio with
  teacher CRUD, a read-only IDP section and PDF exports. Accepts `compact` so it can be
  embedded inside the hub's dossier.

### Behaviour by role

| Role | What they get |
|------|---------------|
| Teacher / Admin | Grouped roster (Classes or A–Z), search, full dossier per learner, **edit** rights on portfolio records |
| Learner | Read-only view of their own portfolio + IDP; the dossier auto-opens (no roster) |
| Parent | Read-only view of their children's portfolios + IDPs |

* Grouping toggle: **By Class** (learners grouped under their class/grade) and
  **Alphabetical** (A–Z index with surname sorting).
* `gotRealData` prevents the 6-second demo timeout from overwriting real Firestore data.
* The dossier has two tabs: *Academic Portfolio & IDP* (renders `<StudentPortfolio compact>`)
  and *Reports / Marks / Interventions* (reusable `RecordSection` cards).

### Wiring

* `src/App.tsx` — the `portfolios` tab now renders `<LearnerPortfolioHub>` for every
  role (teacher/admin edit, student/parent read-only) and passes `userRole` to
  `LearnerInterventionHub`. The `<main>` element also carries the `light-theme` class
  used by the contrast net below.
* `src/components/ClassManagement.tsx` — its portfolios tab renders
  `<LearnerPortfolioHub userRole="teacher">`.
* `firestore.rules` — new `portfolio_items` rule mirroring `learner_interventions`:
  read for any signed-in user, create/update for signed-in users, delete only by the
  owning `teacherId`.

### IDP permissions

IDPs live at `students/{id}.idp`. Teachers edit them from the portfolio/IDP lab
(`ProgressReports.tsx`) and from the portfolio dossier. Learners and parents see the
same IDP rendered read-only — no edit affordances are rendered for those roles, and
`canEdit` in `StudentPortfolio.tsx` gates every mutating control.

---

## 3. App-wide contrast pass ("background overwhelms content")

### Root causes found

1. **Menu/showcase cards** paint a slideshow at 0.42–0.52 opacity behind the copy with
   only a thin `slate-900/55` veil. Titles, descriptions and pills sat directly on the
   artwork — this is exactly what made the **Quiz Wizard** card unreadable.
2. **Hero banners** put display type over drifting background plates with no text shadow.
3. **Light & Peach themes** were the worst case: dozens of components hardcode dark-mode
   typography (`text-white`, `text-slate-100/200/300`, `text-<accent>-300`) inside
   containers that flip to `bg-white` / `.glass`, producing literal white-on-white text.

### The fix: an additive legibility system (`src/index.css`)

Nothing was brightened. The UI Design Freeze in `AGENTS.md` was respected — no border,
glow, hover, animation, slideshow-timing or dark-veil value was changed on
`InteractiveShowcaseCard`, `ContentSlideshow`, `ShowcaseCard`,
`TeachingOuterSlideshow` or `ClassroomShowcaseCard`, and `PageOverlay.tsx` /
`src/lib/overlays.ts` remain a dark ambient backdrop.

New CSS utilities:

| Utility | Purpose |
|---------|---------|
| `.art-title` / `.art-body` / `.art-chip` | Navy text shadows for type painted over artwork (heading / body / small-label strengths) |
| `.showcase-scrim` | A radial dark plate inserted **above** the slideshow art and **below** the copy inside a card. Desktop pointers also get a 2px backdrop blur; Android WebView gets the solid plate only (no compositing cost, no flicker) |
| `.copy-plate` | Solid rounded backing for a title + description block |
| `.showcase-pill-row` | Solid backing for a card's sub-action pill row |
| `.hero-copy-plate` | Generic dark plate for hero copy |
| Light/Peach safety net | Scoped remaps: near-white copy → ink, `slate-300/400/500` → readable greys, 17 accent families at the `-200/-300/-400` steps → darker accents, `border-white/*` → navy hairlines, `bg-white/*` chips → faint navy tint. Copy is re-asserted white again inside deliberately dark sub-panels, and the artwork shadows are dropped inside light cards so they never read as a dirty halo |

The net is scoped to `:is(.light-theme, .peach-theme)` descendants of
`:is(.bg-white, .glass)`, so dark mode and intentionally dark hero panels are untouched.

### Every screen fixed

| File | Fix |
|------|-----|
| `src/index.css` | The whole legibility system (+168 lines) |
| `src/components/CategoryOverview.tsx` | Scrim added inside `InteractiveShowcaseCard` → fixes **all 12 showcase cards at once**: Teacher's Toolbox (**Quiz Wizard**, CAPS Tools Factory, Admin & Reports Cabinet, Media Tools Designer), Classes & Learners (4), Alerts & Diary (3), Help & Support Desk (1). Each card's title+description now sits on a `.copy-plate` and its pills on a `.showcase-pill-row`. Plus 24 headings → `.art-title`, 25 descriptions → `.art-body` (descriptions also lifted `slate-300` → `slate-200`) across the Intelligent AI, Curriculum, Analytics, Classes & Learners, Toolbox and Helpdesk landings |
| `src/components/TeacherDashboard.tsx` | "Teaching Command Center" hero: `.showcase-scrim` over the outer slideshow + `.art-title` on the heading; `ShowcaseCard` title/description → `.art-title` / `.art-body` (`slate-300` → `slate-200`) |
| `src/components/ClassManagement.tsx` | `ClassroomShowcaseCard` (artwork at 0.46 opacity — the brightest card art in the app): subtitle, title and footer stat → `.art-chip` / `.art-title`, stat lifted to `slate-100`. Portfolios tab now renders the new hub |
| `src/components/ContentSlideshow.tsx` | Slide title, description and `01 / 07` counter → `.art-title` / `.art-body` / `.art-chip`; description lifted to `slate-100` |
| `src/components/StudentPractice.tsx` | Practice Zone hero (the Quiz Wizard's destination): title → `.art-title`, description → `.art-body` + `slate-200` |
| `src/components/ProgressReports.tsx` | Analytics & Reports cosmic banner: h1 → `.art-title`, subtitle → `.art-body` + `slate-200` |
| `src/components/CollaborativeWorkspace.tsx` | Same banner treatment |
| `src/components/ContentArchive.tsx` | Gradient header: h1 → `.art-title`, subtitle → `.art-body` + `cyan-50` |
| `src/components/Helpdesk.tsx` | Clip-thumbnail duration badge → solid white + `.art-chip` |
| `src/components/StudentPortfolio.tsx` | Hero already ships `.art-title` / `.art-body` and, in light/peach themes, a solid dark plate so the white display type never lands on the pale page |
| `src/components/LearnerPortfolioHub.tsx` | Theme-aware throughout (every surface has an `isDarkMode` branch) + `.art-title` / `.art-body` on the hub header |

### Checked and found already safe

`IllustrationLibrary` (image captions use `bg-black/50` chips), `AutoGrading` /
`OCRScanner` (media wells), `AITutorPage`, `ContentCreator`, `CurriculumSuite`,
`AdminDashboard`, `StudentDashboard`, `ParentDashboard`, `Settings` — decorative art in
these files sits at 0.10–0.25 opacity behind solid panels, and their hero type already
carries drop shadows. They still benefit from the light/peach safety net.

---

## 4. Verification

```bash
npx tsc --noEmit   # clean — only the 3 pre-existing optional-dep errors in src/lib/assemblers/*
npx vite build     # succeeds; .showcase-scrim / .copy-plate / .art-* all present in dist CSS
npm run dev        # tsx server.ts → 0.0.0.0:3000
```

Manual check list:

1. Teacher → Teacher's Toolbox → confirm the Quiz Wizard title, description and both
   pills are crisp against the slideshow.
2. Teacher → Intervention Hub → **Learners** tab (register + class filter) and
   **History & Reports** tab (timeline + filter pills).
3. Teacher → Portfolios → switch between *By Class* and *Alphabetical*, open a dossier,
   edit a record, view the IDP.
4. Log in as a learner and as a parent → Portfolios shows read-only, no edit controls.
5. Settings → theme → Light and Peach: no white-on-white text anywhere.
