/**
 * Optional runtime modules (shorthand ambient declarations).
 *
 * These packages are imported dynamically with `.catch(() => null)` guards in
 * src/lib/assemblers/* as *optional* enhancements — the app degrades gracefully
 * when they are not installed (e.g. server-side DOCX/PDF/ZIP export).
 * Declaring them here lets `tsc --noEmit` (the CI type gate) pass without
 * forcing the heavy deps (notably puppeteer + Chromium) into the runtime image.
 *
 * Import types resolve to `any`; the call sites already cast/guard accordingly.
 */
declare module "docx";
declare module "puppeteer";
declare module "archiver";
