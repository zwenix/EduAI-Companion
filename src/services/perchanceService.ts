/**
 * Perchance AI Image Generator Service
 *
 * Perchance has no REST API; its image engine (the "text-to-image plugin" that
 * powers https://perchance.org/ai-images-generator) only runs inside a browser
 * page. The supported way to use it from another site is to frame a Perchance
 * generator and read its postMessage reply. This client does that with the
 * community "Perchance Image API" generator, which wraps the SAME plugin/engine
 * as the AI Images Generator page:
 *
 *   • Perchance's FAQ (https://perchance.org/embed-generator) says generators may
 *     only be embedded through the `null.perchance.org` subdomain. The plain
 *     `perchance.org` host answers `X-Frame-Options: sameorigin` and is refused
 *     in every browser — that was why every image fell through to the fallbacks.
 *   • Warm-up: a hidden frame visits the AI Images Generator page (null host) once
 *     per session so Cloudflare/ad verification can settle for this browser.
 *   • Per image: frame `…/perchance-ai-api?prompt=…&format=json&id=<random>`; the
 *     page generates in THIS browser, uploads the result to Perchance's file host
 *     and posts back
 *       { api: "perchance-image-api", result: { id, ok, url, dataUrl, seed } }.
 *
 * NOTE: this depends on third-party Perchance pages. If they move, update the
 * constants below; failures fall through to the next provider in the chain.
 */

/** The generator the product owner asked for (opened manually / used for warm-up). */
export const PERCHANCE_GENERATOR_PAGE = "https://perchance.org/ai-images-generator";
/** Perchance only allows embedding through this subdomain. */
export const PERCHANCE_EMBED_HOST = "https://null.perchance.org";
export const PERCHANCE_GENERATOR_NAME = "Perchance AI Images Generator";
export const PERCHANCE_API_URL = `${PERCHANCE_EMBED_HOST}/perchance-ai-api`;
export const PERCHANCE_GENERATOR_URL = PERCHANCE_API_URL;
const PERCHANCE_WARMUP_URL = `${PERCHANCE_EMBED_HOST}/ai-images-generator`;
const API_MARKER = "perchance-image-api";

const HIDDEN_FRAME_STYLE =
  "width:1px;height:1px;border:0;position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;";

let warmedUp = false;
let warmUpPromise: Promise<boolean> | null = null;

/** Visit the AI Images Generator (embed host) once per session. Never throws. */
export function warmUpPerchance(timeoutMs = 15000): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") return Promise.resolve(false);
  if (warmedUp) return Promise.resolve(true);
  if (warmUpPromise) return warmUpPromise;

  warmUpPromise = new Promise<boolean>((resolve) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.title = "Perchance warm-up";
    frame.style.cssText = HIDDEN_FRAME_STYLE;
    frame.src = PERCHANCE_WARMUP_URL;

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
