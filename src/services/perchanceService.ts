/**
 * Perchance AI Image Generator Service
 *
 * Uses the community "Perchance Image API" (https://perchance.org/perchance-ai-api),
 * which is built to be consumed from ANY website — no keys, no backend:
 *
 *   1. Warm up once per session: a hidden iframe visits https://perchance.org so
 *      Cloudflare lets this browser through.
 *   2. For every image, load
 *        https://perchance.org/perchance-ai-api?prompt=…&format=json&id=<random>
 *      in a hidden iframe. The page runs the generation in THIS browser (so it
 *      uses the caller's quota, not ours), uploads the result to Perchance's file
 *      host and posts back
 *        { api: "perchance-image-api", result: { id, ok, url, dataUrl, seed } }
 *      via postMessage. `url` is a permanent user.uploads.dev link.
 *
 * (The older approach framed perchance.org/ai-text-to-image-generator directly,
 * but that page sends `X-Frame-Options: sameorigin` — it can never be embedded,
 * so it always timed out.)
 *
 * NOTE: this depends on a third-party Perchance generator. If its owner changes
 * or removes it, generation fails and the provider chain falls through to the
 * next provider; update PERCHANCE_API_URL below if it moves.
 */

export const PERCHANCE_GENERATOR_NAME = "Perchance AI Image API";
export const PERCHANCE_API_URL = "https://perchance.org/perchance-ai-api";
export const PERCHANCE_GENERATOR_URL = PERCHANCE_API_URL;
const PERCHANCE_HOME_URL = "https://perchance.org";
const API_MARKER = "perchance-image-api";

const HIDDEN_FRAME_STYLE =
  "width:1px;height:1px;border:0;position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;";

let warmedUp = false;
let warmUpPromise: Promise<boolean> | null = null;

/** Visit perchance.org once so Cloudflare passes this browser. Never throws. */
export function warmUpPerchance(timeoutMs = 15000): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") return Promise.resolve(false);
  if (warmedUp) return Promise.resolve(true);
  if (warmUpPromise) return warmUpPromise;

  warmUpPromise = new Promise<boolean>((resolve) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.title = "Perchance warm-up";
    frame.style.cssText = HIDDEN_FRAME_STYLE;
    frame.src = PERCHANCE_HOME_URL;

    const finish = (ok: boolean) => {
      clearTimeout(timer);
      frame.remove();
      if (ok) warmedUp = true;
      warmUpPromise = null;
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    frame.onload = () => setTimeout(() => finish(true), 500);
    document.body.appendChild(frame);
  });
  return warmUpPromise;
}

/** Perchance only renders these four sizes — pick the closest to the request. */
export function pickPerchanceResolution(width: number, height: number): string {
  const ratio = width / Math.max(1, height);
  if (ratio > 1.15) return "768x512";
  if (ratio < 0.87) return "512x768";
  return "768x768";
}

const isPerchanceOrigin = (origin: string): boolean => {
  try {
    const host = new URL(origin).hostname;
    return host === "perchance.org" || host.endsWith(".perchance.org");
  } catch {
    return false;
  }
};

const isUsableImageUrl = (value: unknown): value is string =>
  typeof value === "string" && (/^https:\/\//i.test(value) || /^data:image\//i.test(value));

export async function generatePerchanceImageClient(
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed?: number,
  timeoutMs: number = 60000
): Promise<string> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Perchance image client can only run in a browser environment");
  }

  await warmUpPerchance();

  const generatedSeed = seed ?? Math.floor(Math.random() * 100000);
  const requestId = `eduai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  const params = new URLSearchParams({
    prompt,
    format: "json",
    id: requestId,
    resolution: pickPerchanceResolution(width, height),
    seed: String(generatedSeed)
  });

  console.log(`[Perchance AI] Initiating generation | Request: ${requestId} | Prompt: "${prompt.slice(0, 60)}..."`);

  return new Promise<string>((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.title = PERCHANCE_GENERATOR_NAME;
    // The framed document is a THIRD-PARTY origin (perchance.org); it needs its own
    // storage/cookies to run, so it keeps same-origin *with itself* (not with us).
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
    frame.style.cssText = HIDDEN_FRAME_STYLE;

    let settled = false;
    const finish = (error: Error | null, url?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);
      frame.remove();
      if (error) reject(error);
      else resolve(url as string);
    };

    const onMessage = (event: MessageEvent) => {
      if (!isPerchanceOrigin(event.origin)) return;
      const data = event.data || {};
      if (data.api !== API_MARKER || !data.result || data.result.id !== requestId) return;

      const result = data.result;
      const url = isUsableImageUrl(result.url) ? result.url : isUsableImageUrl(result.dataUrl) ? result.dataUrl : null;
      if (result.ok && url) {
        console.log(`[Perchance AI] Successfully generated image for request ${requestId}`);
        finish(null, url);
      } else {
        finish(new Error(result.error || "Perchance generation failed"));
      }
    };

    // Generation (plus the Cloudflare check) can be slow; the caller chooses how
    // long to wait before the chain moves on to the next provider.
    const timeoutId = setTimeout(() => {
      console.warn(`[Perchance AI] Request ${requestId} timed out after ${timeoutMs}ms. Transitioning to fallback.`);
      finish(new Error("Perchance image generation timed out"));
    }, timeoutMs);

    window.addEventListener("message", onMessage);
    frame.src = `${PERCHANCE_API_URL}?${params.toString()}`;
    document.body.appendChild(frame);
  });
}
