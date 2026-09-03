# Android Export / Print — root causes and the fix

**Reported behaviour (Android app):** after generating content, tapping **Print** or
**Export to PDF** opened the *external web browser* on its last visited page, no file
was produced, and returning to the app left it stuck on the generated-content screen —
frozen, with no way to go back, close or save.

## Why it happened

Five separate defects combined into that experience:

1. **`window.open('', '_blank')` is an external-browser intent in the Capacitor
   WebView.** `Bridge.launchIntent()` (see
   `node_modules/@capacitor/android/.../Bridge.java`) opens an `ACTION_VIEW` intent for
   any URL whose host does not match the app host. A blank popup resolves to
   `about:blank` → the intent goes to the user's browser, which shows whatever page it
   had last. Call sites: `LearnerInterventionHub`, `StudentDashboard`,
   `lib/assemblers/pdf-assembler.ts` (and `printUtils.printContent` on any Android
   build that was not detected as a WebView — Chrome/PWA on Android has no `; wv` UA).
2. **Blob downloads are silently dropped inside the WebView.** Capacitor sets no
   `DownloadListener`, and `launchIntent()` explicitly returns `false` for `blob:` /
   `data:` URLs. Every `<a download href="blob:…">` — including `html2pdf().save()`,
   `jsPDF.save()`, image/video/JSON exports — did nothing at all. Hence "the content is
   nowhere to be seen".
3. **`window.print()` does not exist on Android.** Neither in the WebView (printing
   needs the native `PrintDocumentAdapter`) nor in Chrome for Android. So even when a
   popup survived, nothing printed.
4. **One giant canvas.** `html2pdf.js` renders the whole document into a single canvas
   and then slices it. A full CAPS lesson plan (worksheet + memo + rubric) is easily
   15 000–25 000 CSS px tall; at `scale: 2` that is far past the Android WebView canvas
   ceiling (~4096×4096 / ~16 M px). The render either failed or pinned the renderer in
   an out-of-memory crawl — the "freeze".
5. **Leftovers that block the UI.**
   * html2pdf covers the app with an invisible `.html2pdf__overlay`
     (`position: fixed; inset: 0; z-index: 1000; opacity: 0`) and only removes it after
     a *successful* render. A failed Android render left that layer on top, swallowing
     every tap → nothing could be closed, and the on-screen back/close/save buttons
     appeared dead.
   * `html2canvas` was configured with `removeContainer: false`, leaking a hidden iframe
     holding a **full clone of the document** on every export.
   * `patchOklchForHtml2canvas()` was called without its restore function in
     `printUtils.downloadAsPDF` (and `StudentNotes`), leaving `window.getComputedStyle`
     wrapped in a Proxy for the rest of the session — every style read, every frame,
     forever.

## What changed

### New modules

| File | Purpose |
| :-- | :-- |
| `src/lib/nativeExport.ts` | Writes a Blob to the device with `@capacitor/filesystem` (Documents → app external → cache, large files chunked over the bridge) and hands it to the Android share sheet with `@capacitor/share` (Print / Drive / Files / mail / messaging). On the web it keeps the normal anchor download and optionally uses the Web Share API. |
| `src/lib/pdfPaginate.ts` | Page-by-page HTML → PDF renderer. Break points come from real element boundaries (no text cut mid-line), each `html2canvas` call crops to one A4 page, canvas size is clamped to platform limits, and the loop yields to the UI thread and honours Cancel. |
| `src/lib/nativeDownloadBridge.ts` | Boot-time bridge for the native app: patches `URL.createObjectURL` (so revoked blobs stay resolvable), `HTMLAnchorElement.click` and document-level clicks to route every `<a download>` export through `nativeExport`, and neutralises blank `window.open()` calls before they become browser intents. This fixes *all* existing download call sites (images, video, DOCX, JSON, HTML) without touching them. |
| `src/lib/exportProgress.ts` | Event bus for export sessions (start / progress / done / error / cancel). |
| `src/components/ExportProgressDialog.tsx` | Global overlay: spinner, page-by-page progress, elapsed time, **Stop export**, plus a hard 4-minute guard so the screen can never stay covered. |
| `src/lib/exportSafetyNet.ts` | Watchdog that removes any `.html2pdf__overlay` / `iframe.html2canvas-container` left behind for more than 90 s. |
| `src/lib/toast.ts` | Tiny window-event toast channel so library code can reach the app's toast UI. |

### Changed behaviour

* `src/lib/platform.ts` — new `isAndroidDevice()`, `isWebViewRuntime()`,
  `supportsSystemPrint()`, `isLowMemoryDevice()`.
* `src/lib/printUtils.ts` — `printContent` never opens a popup on Android (it builds a
  real PDF instead); `downloadAsPDF` returns a Blob from either engine, delivers it via
  `nativeExport`, reports progress, restores the oklch shim in a `finally`, removes its
  offscreen container, sweeps html2pdf artefacts, and falls back to an HTML copy rather
  than losing content. `downloadAsHTML` writes to the device on native.
* `src/lib/pdfHelper.ts` — `patchOklchForHtml2canvas()` is now reference-counted and
  idempotent, so nesting is safe and a single restore always cleans up.
* `src/components/ContentCreator.tsx` — Print/PDF buttons show a spinner and are
  guarded against double taps; the preview **Close (✕)** button is available even while
  generating and stops the run; a **Stop generation** button was added to the progress
  card; the Android hardware back button now unwinds this page's overlays
  (print preview → share → assign → quality check → fullscreen → editor → generation).
* `src/components/PrintPreviewModal.tsx` — busy states plus Android-aware labels
  ("Print / Save PDF", "Export PDF to device") and a hint about the system sheet.
* `LearnerInterventionHub`, `StudentDashboard`, `lib/assemblers/pdf-assembler.ts`,
  `StudentNotes`, `StudentPractice`, `StudentPortfolio`, `ReaderModeModal`,
  `ProgressReports` — popup printing removed, oklch shim always restored, long documents
  paginated on Android.
* `src/main.tsx` — installs the download bridge and the export safety net at boot.
* `src/App.tsx` — renders `ExportProgressDialog`, listens for library toasts, and lets
  the device back button cancel a running export before anything else.

## New native dependencies

```
@capacitor/filesystem ^6   (write the exported file on the device)
@capacitor/share      ^6   (hand it to the Android print/save/share sheet)
```

Both are already in `package.json` **and** `package-lock.json`. The existing CI workflow
(`.github/workflows/build-android2.yml`) runs `npm ci` → `npx cap add android` →
`npx cap sync android`, and `cap sync` links plugins straight from `node_modules`, so
**no workflow change is required** — the next APK build picks them up automatically.

No new Android permissions are needed: the public-Documents write is attempted first and
transparently falls back to app-private storage (which the generated project's
`FileProvider` paths already cover) on Android 11+, where raw public-storage writes are
denied.

## Manual test checklist (Android APK)

1. Content Studio → generate a lesson plan (long one, with memo + rubric).
2. Tap **PDF Download** → progress overlay shows page-by-page rendering → Android sheet
   opens → choose *Drive / Files / Print* → the PDF is complete, no missing pages, no
   cut lines.
3. Tap **Print** → same sheet (there is no scriptable print dialog on Android); no
   browser window opens.
4. Press the **hardware back button** during the export → the overlay dismisses and the
   screen stays usable; press it again → the preview/modals unwind normally.
5. Generate → tap ✕ mid-generation → generation stops and the panel clears.
6. Repeat an export 3–4 times → the app must stay responsive (no leaked overlay, no
   leaked clone iframe, no `getComputedStyle` Proxy).
7. Other exports (illustration download, video download, archive HTML, progress report)
   now reach the device through the same bridge.
