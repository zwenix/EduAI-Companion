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

## 9. `Refused to display 'https://perchance.org/' in a frame because it set 'X-Frame-Options' to 'sameorigin'`

**What it was.** Perchance's Image API v1 sample code "warms Cloudflare up"
by loading the bare `perchance.org` homepage in a hidden iframe before the
first image. That homepage answers `X-Frame-Options: SAMEORIGIN`, so the
browser refused to display it and logged the message — once per session, on
the first illustration, every time. The warm-up was also redundant: the
request iframe loads a page on the **same origin**, which is the visit
Cloudflare actually needs.

**Fix.** `warmUpPerchance()` (`src/services/perchanceClient.ts`) no longer
creates an iframe at all. It is a memoised, DOM-free capability check that
resolves `true` in a browser and `false` on the server — the same contract
(`Promise<boolean>`, never throws) so every existing caller keeps working.
`PERCHANCE_WARMUP_URL` was deleted, and the framing allow-list in
`tests/image-providers.test.ts` plus `tests/perchance-client.test.ts` now fail
CI if any code path points an iframe (or a `fetch`) at the bare homepage
again.

> Do **not** "fix" this by dropping the `sandbox` attribute, by proxying the
> homepage through the server, or by re-adding a warm-up frame to a different
> Perchance page — every generator page sends the same header. Only
> `perchance.org/perchance-ai-api` (and its `null.perchance.org` mirror) may
> ever be framed.

---

## 10. `Access to manifest at 'https://vercel.com/sso-api?…' … blocked by CORS policy`

**What it was.** A real defect, and the only one in the batch that the app owns.
Browsers fetch `<link rel="manifest">` **without credentials even when the
manifest is same-origin** (that is what the HTML spec says for a manifest link
without a `crossorigin` attribute). On a Vercel deployment behind **Deployment
Protection**, the unauthenticated request for `/manifest.webmanifest` is
redirected to `vercel.com/sso-api?url=…`, and the browser then refuses the
cross-origin redirect:

```
Access to manifest at 'https://vercel.com/sso-api?url=…manifest.webmanifest…'
from origin 'https://…vercel.app' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

The visible symptom beyond the console is that the PWA manifest never loads on a
protected preview (no install prompt, no icons/theme in DevTools → Application →
Manifest).

**Fix.** `vite.config.ts` now sets `useCredentials: true` on the `VitePWA`
plugin, so the generated tag is:

```html
<link rel="manifest" href="/manifest.webmanifest" crossorigin="use-credentials">
```

The browser then sends the deployment's protection cookie with the manifest
request and Vercel serves it like any other asset. Harmless on unprotected
deployments (same-origin with cookies allowed). `tests/deployment-headers.test.ts`
fails CI if the flag is removed and checks the built tag when `dist/` exists.

> This is a preview-only artefact in practice: production (`eduai-companion.vercel.app`)
> is not behind Deployment Protection, which is why the error shows up on the
> PR preview URL and not on the live domain.

---

## 11. `Error with Permissions-Policy header: Unrecognized feature: 'attribution-reporting'` (×5)

**What it was.** Five lines, one per deprecated/unrecognised feature —
`attribution-reporting`, `private-aggregation`, `join-ad-interest-group`,
`run-ad-auction`, `browsing-topics`. They are **not** produced by this app:
production sends **no `Permissions-Policy` header at all** (verified against the
live deployment's response headers), and neither `vercel.json`, `server.ts`,
`index.html` nor any dependency emits one.

They come from the **preview-protection layer** in front of a protected Vercel
preview URL: that layer serves its own hard-coded policy listing the
Privacy-Sandbox era features, and current Chromium no longer recognises those
names, so it logs one "Unrecognized feature" line per entry — before our bundle
has even run.

**Decision — do not "fix" this by adding our own header.** Setting a
`Permissions-Policy` in `vercel.json` would emit a **second** copy of the same
header alongside the protection layer's; duplicate dictionary keys make the
whole policy fail to parse, which is strictly worse than the existing warnings.
`tests/deployment-headers.test.ts` pins that we stay out of it (and that camera
and microphone are never denied — OCR scanning, QR scanning and avatar capture
depend on them).

**Expected:** these five lines appear on **protected preview URLs only**, and
they disappear on production and on any preview with Deployment Protection
turned off (Vercel project → Settings → Deployment Protection → *Vercel
Authentication* **off**, or use the bypass/automation token).

---

## 12. `identitytoolkit.googleapis.com/v1/accounts:signInWithPassword … 400` + `FirebaseError: Firebase: Error (auth/invalid-credential)`

**What it was.** Not a defect in the app — a wrong email/password (or an account
that does not exist yet). Firebase answers HTTP 400 with
`auth/invalid-credential`; the login form already shows "Invalid email or
password. Please try again!".

The console problem was the **volume**: the form called
`console.error(err)` on every failed attempt, so each typo dumped a full
`FirebaseError` stack trace. On a page with several auth entry points this is
what buries the messages that actually matter.

**Fix.** New `src/lib/consoleDiagnostics.ts`:

* `isExpectedAuthFailure(err)` — recognises the codes a login form explains
  itself (`invalid-credential`, `wrong-password`, `user-not-found`,
  `email-already-in-use`, `weak-password`, `invalid-email`, `missing-email`,
  `too-many-requests`, `popup-closed-by-user`, `cancelled-popup-request`,
  `network-request-failed`), from `code` **or** from the message (older SDKs).
* `logAuthFailure(context, err)` — expected outcome → **one
  `console.info` line** naming the code, no stack; anything else (e.g.
  `auth/unauthorized-domain`, `auth/invalid-api-key`) stays a `console.error`.

Wired into `LoginPage.tsx` (email sign-in, Google sign-in, password reset) and
`PasswordSecurity.tsx`. `tests/console-diagnostics.test.ts` pins both
directions — a wrong password must not log an error, a misconfiguration must.

> If you are testing on a preview and have no account yet, use **Demo login**
> (anonymous auth) or Sign Up — a 400 on `signInWithPassword` just means the
> password does not match an existing user.

---

## 13. `Interventions sync err (falling back to local mirror): FirebaseError: Missing or insufficient permissions.`

Same root cause as §5 (deployed Firestore rules older than this repo's
`firestore.rules`) — but the **repetition** was a second defect. The Teacher
Dashboard's `onSnapshot` listener is recreated on every mount, so a persistent
rule problem printed the identical warning dozens of times per session.

**Fix.** `warnOnce(key, message, detail)` from `src/lib/consoleDiagnostics.ts`
now gates that specific warning: one line per page load, with the error object
still attached for diagnosis. The local-mirror fallback is unchanged.

**Action:** deploy the rules to make the message disappear entirely:

```bash
bash scripts/deploy-firestore-rules.sh
```

---

## 14. `POST https://firestore.googleapis.com/…/channel… TYPE=terminate … net::ERR_BLOCKED_BY_CLIENT`

**What it was.** `ERR_BLOCKED_BY_CLIENT` is the browser reporting that a
**client-side blocker** (an ad/tracker blocker extension, a school content
filter, a corporate proxy extension, or Brave Shields) cancelled the request —
it is not an HTTP status and no server can produce it. Here it hit the
Firestore Listen channel's `TYPE=terminate` teardown at page unload, which is
already best-effort and has no bearing on the app's data (the `onSnapshot`
listeners teardown locally either way).

**No code change is possible or needed.** If live sync itself is blocked
(not just the terminate frame), allow `firestore.googleapis.com` (and
`*.googleapis.com`, `identitytoolkit.googleapis.com`) for the site in the
blocker. Firestore already prefers the WebSocket transport and falls back to
long-polling — see §6.

---

## 15. `Ultra-detailed%20digital%20children's…:1  Failed to load resource: the server responded with a status of 503`

**What it was.** A **Pollinations** image request
(`image.pollinations.ai/prompt/<the encoded prompt>`) answered **503**. The long,
pre-encoded path is the giveaway that it is a direct Pollinations URL, not one of
our own routes — the prompt is the SA-enhanced illustration prompt from
`contentStyle.ts` (`"Ultra-detailed digital illustration, …"`).

Pollinations' anonymous tier is heavily throttled and answers 402
`FREE_LIMIT` when spent, and 5xx when its own GPU workers are saturated. The
app **already handles this**: a 402/429 puts the engine on cooldown
(`POLLINATIONS_COOLDOWN_MS`), any other failure moves to the next provider, and
if everything fails the teacher still gets the built-in SVG placeholder — never a
broken image (§4 / `AGENTS.md` §7.3d).

**Action:** optional, but the documented cure for repeated 503/402 from
Pollinations is a free key — set `POLLINATIONS_API_KEY` (from
`enter.pollinations.ai`) on the deployment. It removes the per-IP throttle.
`GET /api/images/status` reports whether the key is configured and whether the
upstream hosts are reachable from that deployment.

---

---

## 16. Perchance generates nothing — no error, only a timeout

**What it was — three compounding defects.**

1. **The generation iframe was throttled.** `HIDDEN_FRAME_STYLE` copied the docs
   sample: `width:1px;height:1px;opacity:0;top:-9999px`. But the framed page is
   not a passive widget — **it runs the diffusion model in the browser**, so it
   needs a live rendering pipeline. Chromium throttles exactly that geometry
   (tiny, fully transparent, offscreen), clamping `requestAnimationFrame` and
   the timers the in-page generator polls with. Generation therefore never
   completed, and the only symptom was a timeout with no message.
2. **The budget was too short.** 60 s per image against the docs' own 180 s.
   Slow school laptops and low-end Android could not finish in time, the chain
   fell through to FLUX/Pollinations (usually keyless), and the teacher got the
   placeholder.
3. **Timeouts benched the engine.** `markFailure()` counted *every* rejection,
   so two slow renders put Perchance on a 10-minute circuit break — the "it
   worked yesterday, today there are no images" report.

**Fix.**

* `HIDDEN_FRAME_STYLE` is now a real 320×320 box inside the viewport,
  visually hidden with `clip-path: inset(100%)` and `pointer-events: none`.
  It is never `opacity: 0`, `visibility: hidden`, `display: none`, 1×1, or
  offscreen. `tests/perchance-client.test.ts` asserts all of that.
* `PERCHANCE_TIMEOUT_MS` is **180 s**.
* A timeout no longer counts towards the breaker
  (`isTimeoutError()`), and the breaker now needs **3** real failures inside
  `PERCHANCE_FAILURE_WINDOW_MS`, so isolated hiccups hours apart never add up.
  Host failover (primary → `null.perchance.org`) also only flips after the
  *current* host fails repeatedly.
* Failures are now diagnosable: the timeout message says whether the framed
  page **loaded** (`still rendering — this device is slower than the budget`)
  or **never loaded** (`blocked before it can run`), and `frame.onerror` fails
  immediately instead of waiting out the full budget.
* `getPerchanceDiagnostics()` and `probePerchance()` back a Settings →
  Diagnostics panel and a one-click end-to-end test that renders a real image.

---

## 17. Exported PDFs lose their illustrations (blank or missing artwork)

**What it was.** Two independent canvas problems:

* `allowTaint: true` was set alongside `useCORS: true` on every html2canvas
  call. They are opposites: tainting lets an image in *without* CORS, which
  makes the canvas unreadable, so the following `toDataURL()` throws and the
  export is blank.
* Perchance's permanent `user.uploads.dev` URLs (and Pollinations' output) send
  **no** `Access-Control-Allow-Origin`. They render in an `<img>`, but with
  `allowTaint: false` the exporter simply skips them — so illustrations vanish
  from the PDF.

**Fix.**

* `allowTaint: false` everywhere (`printUtils`, `pdfPaginate`,
  `ProgressReports`) — always `useCORS: true`.
* New `/api/image-relay` re-serves those images from our own origin with an
  explicit CORS header. It is a strict allow-list (`user.uploads.dev`,
  `image.pollinations.ai`), `image/*` only, https only, rate-limited like any
  other `/api` route — never a general proxy.
* `toExportableImageUrl()` rewrites document images through the relay during
  export, so generated artwork survives the PDF.

---

---

## 18. Why there is no Cloudflare Worker proxy for Perchance

A patch script (`patch-eduai.sh`) proposed fixing Perchance with a
**Cloudflare Worker** that fetches `https://perchance.org<encoded-prompt>` and
returns the JSON. It cannot work, and adopting any part of it would break the
engine:

* **The URL has no path.** It builds `https://perchance.org{encodeURIComponent(prompt)}`
  — i.e. `https://perchance.orga%20cat…`. The API lives at
  `/perchance-ai-api`, so every request would 404 (or be blocked by Cloudflare).
* **Server-side fetching is blocked and forbidden.** Bare HTTP to
  `perchance.org` is answered by a Cloudflare challenge from data-centre IPs
  (`AGENTS.md` §7.3d, enforced by `tests/image-providers.test.ts`). The API is
  designed for a *browser*: the caller's browser runs the model, which is why
  the response also arrives by `postMessage`, not as a JSON body.
* **There is nothing to proxy.** Results are already permanent, publicly
  cacheable `user.uploads.dev` URLs. A byte relay is only needed so the PDF
  exporter can read their pixels — that is `/api/image-relay`, on our own
  Express app, with no new infrastructure. (§17)
* **The script targets a different repository.** It writes into
  `worker-proxy/`, `eduai-companion/utils/`, `eduai-companion/__tests__/` and a
  `NEXT_PUBLIC_*` env var. This repo is Vite + React + Express on Vercel; there
  is no Next.js and no `worker` target, so the files would be dead code.
* **Its tests encode the wrong contract.** `canvasStaining.test.js` asserts
  `allowTaint` is *enabled* (`Image.prototype.crossOrigin` checks against a
  fake), and `envRouting.test.js` asserts a proxy env var — both the opposite of
  what actually fixes blank exports. The real invariants are covered by
  `tests/image-relay.test.ts`.

What *was* adopted from the script's intent:

* preloading images before rasterising — already present as `waitForImages()` in
  `src/lib/printUtils.ts`, now guaranteed to *succeed* because §17 makes the
  artwork CORS-readable;
* keeping the canvas unstained — fixed properly by removing `allowTaint`;
* device-pixel-ratio aware layout — already handled by html2canvas `scale` and
  the paginated renderer.

---

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
- [ ] `Refused to display 'https://perchance.org/' in a frame …` (no warm-up iframe — see §9)
- [ ] `Access to manifest at 'https://vercel.com/sso-api…' … CORS policy` (manifest fetched with credentials — see §10)
- [ ] `auth/invalid-credential` stack after a typo (now one info line — see §12)
- [ ] `Interventions sync err …` repeated on every mount (now once per session — see §13)

Expected, and **not** fixable in this repo:

- [ ] five `Permissions-Policy … Unrecognized feature` lines — preview-protection layer on protected Vercel previews only (§11)
- [ ] `net::ERR_BLOCKED_BY_CLIENT` on a Firestore `TYPE=terminate` frame — a client-side blocker (§14)
- [ ] a `503`/`402` from `image.pollinations.ai/…` — upstream throttling; key or fallback handles it (§15)
- [ ] Perchance: Settings → Diagnostics shows `runtime · browser`, `circuit · healthy`, and Test renders an image (§16)
- [ ] Exporting a lesson plan **keeps** its illustrations in the PDF (§17)
