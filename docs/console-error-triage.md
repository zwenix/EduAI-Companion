# Console-error triage — deployment health checklist

This document walks through every message that appeared in the browser console
of the production deployment and explains what it was, whether it was a real
defect, and what changed.

Use it as a smoke-test checklist after a deploy: open DevTools → Console and
confirm the list at the bottom of this page is clean.

---

## 1. `css2:1  Failed to load resource: net::ERR_CONNECTION_CLOSED`

**What it was.** The app loaded its typefaces from
`https://fonts.googleapis.com/css2?family=…`. On the school networks this
product is built for that host is blocked or unreachable, so the browser
logged a failed request on **every** page load and the entire UI fell back to
the system font stack.

**Fix.** The fonts are now self-hosted.

* `scripts/build-self-hosted-fonts.mjs` copies the latin subsets of the
  `@fontsource/*` packages into `public/fonts/` and writes
  `public/fonts/fonts.css` with the matching `@font-face` rules.
* `src/index.css`, the document-preview iframe
  (`src/components/ContentCreator.tsx`) and the print/PDF pipeline
  (`src/lib/printUtils.ts`) all point at `/fonts/fonts.css`, so every runtime
  surface loads the faces from our own origin.
* `public/fonts/` is a **build artifact** — `npm run build` and `npm run dev`
  regenerate it automatically (`prebuild` / `predev` hooks).
* The service worker caches `/fonts/` at runtime
  (`StaleWhileRevalidate`, `src/sw.js`) instead of precaching all 67 files,
  so a first visit only downloads the faces the page actually renders.

> The standalone export templates (`src/lib/templates/sa-html-templates.ts`,
> `src/lib/templates/foundation/render.ts`) still link Google Fonts on
> purpose: those documents are zipped and opened from disk, where a relative
> `/fonts/…` path would not resolve.

---

## 2. `/_vercel/insights/script.js  Failed to load resource` +
`[Vercel Web Analytics] Failed to load script … Be sure to enable Web Analytics`

**What it was.** `<Analytics />` was mounted unconditionally. It injects
`/_vercel/insights/script.js`, which only exists when Web Analytics is
enabled for the Vercel project — so every deployment without it logged a
failed request.

**Fix.** The component is now mounted only when the deployment opts in with
`VITE_VERCEL_ANALYTICS=true` (see `.env.example`). Leave it unset unless
Web Analytics is actually enabled for the project.

---

## 3. `/api/ai/nvidia-nemotron-nano  504` →
`[AI Routing] Provider nvidia-nemotron-nano unavailable or transitioned (Status: 504)`

**What it was — the most serious one.** The NVIDIA NIM client was created
**without a request timeout**, so a single hung Nemotron call blocked the
serverless function until Vercel killed it at `maxDuration` (60 s). The
platform answered the browser with a bare **HTTP 504**, the client-side
fallback ran, and the built-in Gemini fallback *inside* the server never got
the chance to answer.

**Fix.** A shared, explicit time budget now governs the whole routing chain
(`src/lib/aiRouteBudget.ts`):

| Step | Budget |
| :--- | :--- |
| Total for one `/api/ai/:provider` request | 52 s (Vercel ceiling is 60 s) |
| Gemini reserve (never spent on an upstream) | 15 s |
| One upstream provider attempt | ≤ 28 s |
| Sibling engine attempt | only if ≥ 10 s of budget is left after the reserve |

* The NVIDIA client now has `timeout` + `maxRetries: 0`, and every attempt
  passes a **per-request** timeout derived from the budget.
* The Gemini fallback always receives the reserved slice.
* A final safety-net timer answers **503** (which the client treats as a
  retryable provider failure) instead of letting the platform kill the
  function with a 504.
* `tests/ai-route-budget.test.ts` pins the arithmetic.

Verified locally against a deliberately hanging upstream: the request now
fails over in **28 s** with a readable error instead of dying at 60 s with a
504.

---

## 4. `/api/image-proxy … 402` and `image.pollinations.ai/… 402` — REVERTED

**What it was.** Pollinations' free tier was reported to answer **HTTP 402
(Payment Required)** for the `turbo` model and the `enhance=true` prompt
rewriter, and the proxy forwarded that status verbatim.

**What was tried.** The proxy was rewritten into a gated provider chain
(Pollinations **only when `POLLINATIONS_API_KEY` is set** → Gemini/Imagen →
FLUX.1-schnell on Hugging Face, bounded by an `IMAGE_CHAIN_BUDGET_MS`,
answering 502 when exhausted), and the client was switched from direct
`image.pollinations.ai` URLs to that proxy everywhere.

**Why it was rolled back.** The cure was worse than the disease: with no
`POLLINATIONS_API_KEY` configured, Pollinations was skipped outright, and
when Gemini/FLUX had no usable key either, **every** image request ended in a
502 — the app could not generate a single illustration. The whole image
subsystem (`server.ts` image routes, `src/lib/imageGeneration.ts`,
`src/lib/imageReplacer.ts`, `src/components/IllustrationLibrary.tsx` and the
`POLLINATIONS_API_KEY` env entry) has been restored to its earlier working
state. See AGENTS.md §7.3d — do not re-introduce the gated chain.

**If a 402 from Pollinations is ever confirmed again,** fix it by adding a
key to the *existing* direct fetch (or by swapping the `model=` parameter),
not by gating the provider behind one.

---

## 5. `Interventions sync err (falling back to local mirror): FirebaseError: Missing or insufficient permissions.`

**What it was — two separate causes.**

1. The `interventions` collection had **no match block** in `firestore.rules`,
   so every read fell through to the database-wide deny. (The app only reads
   it — `src/components/StudentDevelopmentHub.tsx` — but a deny is a deny.)
2. The rules **deployed** to the Firebase project were older than the rules
   in this repository, so `learner_interventions` was denied as well.

**Fix.**

* `firestore.rules` now has a `match /interventions/{interventionId}` block,
  and `learner_interventions` gained a payload validator
  (`isValidIntervention`) plus a teacher-ownership check on write.
* `tests/firestore-rules.test.ts` now derives the expected collection list
  **from the source code** (every `collection(db, '…')` call) instead of a
  hand-written list — a collection that the client reads but the rules do not
  mention fails CI.
* The dashboard keeps working from its `localStorage` mirror in the meantime.
* To make the deployed rules match the repository, run:

  ```bash
  bash scripts/deploy-firestore-rules.sh   # needs the Firebase CLI + a login
  ```

---

## 6. `css2 …` / Firestore `Listen/channel … ERR_CONNECTION_CLOSED` /
`ERR_TIMED_OUT` / `ERR_BLOCKED_BY_CLIENT`

**What it was.** Network-level noise: the Firestore live-sync channel was
being carried over **forced long-polling** (an `XMLHttpRequest` per
listener), which restrictive proxies and ad blockers routinely kill.

**Fix.** `src/lib/firebase.ts` now uses
`experimentalAutoDetectLongPolling: true`, so the SDK prefers the WebSocket
transport and only falls back to long-polling where the network demands it.
Firestore local persistence stays enabled, so the dashboards keep serving the
last known data when the network is unavailable.

An ad blocker that blocks `firestore.googleapis.com` outright cannot be fixed
in code — allow the domain for the app in that case.

---

## 7. `Banner not shown: beforeinstallpromptevent.preventDefault() called.`

**What it was.** A Chrome DevTools **notice**, not an error. The app cancels
the browser's default install banner on purpose and shows its own install
affordance (the sidebar promo and the Settings panel), calling `prompt()`
from that button — which is the only moment the browser allows it.

No change was needed; the pattern is intentional and the comment in
`src/App.tsx` says so.

---

## 8. `safeJsonParse: Reconstructed truncated JSON response successfully via fallback regex extraction!`

**What it was.** Two things at once.

* The warning was **fired on every partial chunk of a streaming response**,
  where the JSON is incomplete by definition. It was noise, not a diagnosis.
* The real truncation came from an 8192-token output budget on the
  long-form content actions, which is smaller than a full CAPS lesson plan.

**Fix.**

* Partial parses during streaming are now quiet
  (`safeJsonParse(text, { quiet: true })`); the **final** parse of a completed
  response still warns, because there it really does mean the document was
  cut short.
* The content actions now use the same 16384-token budget the alternative
  engines already used (`src/lib/aiOutputBudget.ts`), so one request
  produces the same amount of material whichever engine answered.

---

## Deploy checklist

```bash
npm run ci                     # secret scan · types · tests · template contract · build
bash scripts/deploy-firestore-rules.sh   # only if the Firestore rules changed
```

Then, in the deployed app's DevTools console, expect **no** entries from
this list:

- [ ] `css2:1 … ERR_CONNECTION_CLOSED` (self-hosted fonts)
- [ ] `/_vercel/insights/script.js` (opt-in analytics only)
- [ ] `/api/ai/<provider> … 504` (route budget)
- [ ] illustrations actually render (image routes reverted to the direct Pollinations proxy — see §4)
- [ ] `Interventions sync err … Missing or insufficient permissions` (rules deployed)
- [ ] `Banner not shown: beforeinstallpromptevent.preventDefault()` (expected notice)
