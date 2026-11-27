/**
 * EduAI Companion — DOCUMENT illustration engine.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `generateImageWithFallback()` (`./imageGeneration`) is the interactive
 * engine: the "Create Image" button, avatars, the AI Image component. It walks
 * the whole provider graph and, when every engine is busy, it deliberately
 * returns a printable SVG placeholder so the UI always has something to paint.
 *
 * Generated CAPS documents are a DIFFERENT problem. Their `<img>` tags are
 * emitted into HTML that is rendered in a dozen places (preview, archive,
 * reader mode, print, PDF export), long before — and far away from — any React
 * component that could generate a picture. Those tags used to be built by
 * `buildDirectImageUrl()`, which points a web build straight at
 * `/api/image-proxy` → **Pollinations**. That is why the app appeared to
 * "bypass Perchance and go straight to Pollinations": the document path never
 * called the browser-only Perchance engine at all.
 *
 * This module is the single entry point for that path. It:
 *   1. always tries the teacher's SELECTED engine first — Perchance by
 *      default (see `DEFAULT_IMAGE_PROVIDER`) — inside the browser, and only
 *      then walks the frozen fallback graph;
 *   2. never paints a URL that bypasses the primary engine before it has been
 *      attempted;
 *   3. remembers what answered (engine telemetry for Settings);
 *   4. resolves synchronously to a *seed* URL (`src`) so the document has a
 *      working picture immediately, while the async pass upgrades it to the
 *      engine-selected result (`data-eduai-resolved`).
 */

import {
  generateImagePerchance,
  generateImageFlux,
  generateImageGemini,
  generateImagePollinations,
  buildPollinationsUrl,
  PollinationsRateLimitError,
} from './imageGeneration';
import {
  DEFAULT_IMAGE_PROVIDER,
  getImageProviderOrder,
  normaliseImageProviderId,
  type ImageProviderId,
} from './imageProviders';
import {
  isPerchanceBenching,
  isPerchanceRuntimeAvailable,
  perchanceFailureInfo,
  resetPerchanceBench,
  type PerchanceFailureInfo,
} from '../services/perchanceClient';

export type DocumentImageEngine = ImageProviderId | 'placeholder';

export interface DocumentIllustration {
  /** Working picture to paint immediately (engine-agnostic seed URL). */
  url: string;
  /** The engine that produced `url`. */
  provider: DocumentImageEngine;
  prompt: string;
  width: number;
  height: number;
}

/** Per-engine counters shown in Settings → AI engines. */
export interface DocumentImageTelemetry {
  attempts: Record<string, number>;
  successes: Record<string, number>;
  lastEngine: DocumentImageEngine | null;
  lastError: string | null;
}

const telemetry: DocumentImageTelemetry = {
  attempts: {},
  successes: {},
  lastEngine: null,
  lastError: null,
};

export const documentImageTelemetry = (): DocumentImageTelemetry => ({
  attempts: { ...telemetry.attempts },
  successes: { ...telemetry.successes },
  lastEngine: telemetry.lastEngine,
  lastError: telemetry.lastError,
});

export const resetDocumentImageTelemetry = (): void => {
  telemetry.attempts = {};
  telemetry.successes = {};
  telemetry.lastEngine = null;
  telemetry.lastError = null;
};

/** Perchance circuit-breaker state (for the honest "why did it fall back?" UI). */
export const perchanceStatus = (): PerchanceFailureInfo => perchanceFailureInfo();

/**
 * Plain-language explanation of the most likely reason Perchance is unavailable.
 *
 * Teachers should not have to read `X-Frame-Options` in a console to learn that
 * the engine is blocked by the site rather than misconfigured by them.
 */
export const describePerchanceProblem = (info: PerchanceFailureInfo = perchanceFailureInfo()): string | null => {
  if (!info.lastError && info.state === 'idle') return null;
  const error = info.lastError || '';
  if (/X-Frame-Options|refused/i.test(error)) {
    return 'Perchance refused to load inside the app (X-Frame-Options), so image generation fell back to another engine. This is a Perchance-side restriction, not a settings problem.';
  }
  if (/timed out/i.test(error)) {
    return 'Perchance did not answer in time (its server can be slow or rate-limited). Generation fell back to another engine.';
  }
  if (/benched/i.test(error)) {
    return 'Perchance is paused after repeated failures. Press "Try again" to give it another attempt.';
  }
  if (info.state === 'benched') {
    return 'Perchance is paused after repeated failures. Press "Try again" to give it another attempt.';
  }
  return error ? `Perchance error: ${error}` : null;
};

/** "Try Again" for illustrations: always hand the PRIMARY engine a fresh turn. */
export const retryPerchanceNow = (): void => {
  resetPerchanceBench();
};

/** The engine a document illustration should try first. */
export const selectedImageEngine = (): ImageProviderId => {
  if (typeof window === 'undefined') return DEFAULT_IMAGE_PROVIDER;
  return normaliseImageProviderId(window.localStorage.getItem('eduai_image_provider'));
};

/**
 * A seed URL that needs no generation and is not a dead link.
 *
 * Ordering matters: on the web the same-origin proxy is used (works through
 * school firewalls), on the APK the direct keyless URL is used (no backend).
 * Crucially this is only ever a SEED — the resolver above it replaces it with
 * the primary engine's result as soon as that answers.
 */
export const buildSeedIllustrationUrl = (
  prompt: string,
  width: number,
  height: number,
  seed: number,
): string => buildPollinationsUrl(prompt, width, height, seed);

/**
 * Resolve one document illustration through the engine chain, PRIMARY FIRST.
 *
 * Never throws: the last resort is the seeded URLs, which always render.
 */
export const resolveDocumentIllustration = async (
  prompt: string,
  options: {
    width?: number;
    height?: number;
    seed?: number;
    grade?: string;
    subject?: string;
  } = {},
): Promise<DocumentIllustration> => {
  const width = options.width ?? 800;
  const height = options.height ?? 600;
  const seed = options.seed ?? Math.floor(Math.random() * 100000);

  const preferred = selectedImageEngine();
  const order = getImageProviderOrder(preferred);

  for (const engine of order) {
    telemetry.attempts[engine] = (telemetry.attempts[engine] ?? 0) + 1;
    try {
      let url = '';
      if (engine === 'perchance') {
        // Browser-only, keyless, unlimited — the PRIMARY engine. A bench is
        // respected here (it exists to protect a whole batch) but the doc
        // path reports it so the UI can offer "Try Again".
        if (!isPerchanceRuntimeAvailable()) throw new Error('Perchance needs a browser runtime');
        if (isPerchanceBenching()) throw new Error('Perchance is temporarily benched');
        url = await generateImagePerchance(prompt, width, height, {
          grade: options.grade,
          subject: options.subject,
          saContext: true,
          seed,
        });
      } else if (engine === 'flux') {
        const result = await generateImageFlux(prompt, width, height, {
          grade: options.grade,
          subject: options.subject,
          saContext: true,
        });
        url = result.url;
      } else if (engine === 'gemini') {
        url = await generateImageGemini(prompt, width, height);
      } else if (engine === 'pollinations') {
        url = await generateImagePollinations(prompt, width, height, seed);
      }

      if (!url) throw new Error(`${engine} returned no image`);
      telemetry.successes[engine] = (telemetry.successes[engine] ?? 0) + 1;
      telemetry.lastEngine = engine;
      return { url, provider: engine, prompt, width, height };
    } catch (error: any) {
      telemetry.lastError = `${engine}: ${error?.message || error}`;
      if (error instanceof PollinationsRateLimitError) {
        console.warn(`[Doc Images] ${engine} is rate-limited; moving on.`);
      } else {
        console.warn(`[Doc Images] ${engine} unavailable — trying the next engine.`, error?.message || error);
      }
    }
  }

  // Nothing answered. Never emit a URL that is already known to fail: the
  // seeded URL is engine-agnostic and the recovery net will re-resolve it.
  console.warn('[Doc Images] Every engine failed — emitting a seeded fallback URL.');
  telemetry.lastEngine = 'placeholder';
  return {
    url: buildSeedIllustrationUrl(prompt, width, height, seed),
    provider: 'placeholder',
    prompt,
    width,
    height,
  };
};

/**
 * The Vite/browser bundle has no way to await at `<img>` build time, so a small
 * registry lets `imageReplacer` (and the print/PDF path) find a pending
 * resolution by its request id.
 */
const pending = new Map<string, Promise<DocumentIllustration>>();

export const resolveDocumentIllustrationTracked = (
  requestId: string,
  prompt: string,
  options: { width?: number; height?: number; seed?: number; grade?: string; subject?: string } = {},
): Promise<DocumentIllustration> => {
  const existing = pending.get(requestId);
  if (existing) return existing;
  const run = resolveDocumentIllustration(prompt, options).finally(() => {
    // Keep a short window so repeated renders reuse the same result.
    setTimeout(() => pending.delete(requestId), 30_000);
  });
  pending.set(requestId, run);
  return run;
};

/** Await every tracked resolution (used before rasterising a PDF/print). */
export const settlePendingIllustrations = async (timeoutMs = 20_000): Promise<void> => {
  const runs = [...pending.values()];
  if (!runs.length) return;
  await Promise.race([
    Promise.allSettled(runs),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
};
