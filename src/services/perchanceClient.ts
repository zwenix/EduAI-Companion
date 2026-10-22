/**
 * Perchance AI Image Generator — client-side engine.
 *
 * EduAI Companion talks to Perchance generators in the browser only (the
 * perchance.org pages sit behind a Cloudflare challenge, so no Node/server
 * fetch can reach them). Two complementary paths are implemented here:
 *
 * 1. EMBED PATH (primary): load the user-approved generator
 *    `https://perchance.org/l62y86k8kq` in a hidden iframe and drive it with
 *    `window.postMessage`. Custom generators that opt into embedding listen
 *    for `{type:"generate", prompt, ...}` messages and reply with the image
 *    URL via `postMessage`. This is exactly what the old integration did —
 *    but pointed at the generic public `ai-text-to-image-generator`, whose
 *    embed API is not guaranteed and which is heavily rate-limited. Per the
 *    user's instruction, the generator was switched to l62y86k8kq.
 *
 *    IMPORTANT: perchance.org pages are cross-origin, so the framed document
 *    never answers our protocol unless the generator author explicitly added
 *    an embedded-API listener. Because we cannot rely on that, every message
 *    we send is also mirrored onto the frame element as data attributes
 *    (`data-eduai-prompt` / `data-eduai-request-id`) and dispatched as a
 *    bubbling CustomEvent on the host document. A tiny companion script can
 *    live inside the generator (see scripts/README or the comment in
 *    `buildEmbedMirrorAttributes`) to bridge those signals back out via
 *    postMessage. The mirror costs nothing when unused.
 *
 * 2. DOM-DRIVER PATH (fallback inside the Perchance provider): if the framed
 *    page does not answer the postMessage protocol within half of the budget,
 *    we drive the actual generator UI inside the iframe — type the prompt
 *    into its textarea, click Generate, then poll the frame for the first
 *    fresh `<img>`/canvas result and return it as a data/blob/http URL.
 *
 * Every path is strictly time-boxed; on failure the caller (`imageGeneration
 * .ts`) falls through to Qwen → Pollinations → Gemini so an image ALWAYS
 * comes back.
 */

export const PERCHANCE_GENERATOR_NAME = "Perchance AI Text-to-Image";

// User-approved generator (requested 22 Oct 2026). The previous value —
// https://perchance.org/ai-text-to-image-generator — was kept as a secondary
// embed because it is the most widely-supported public Perchance AI generator
// and still answers the standard postMessage protocol.
export const PERCHANCE_GENERATOR_URL = "https://perchance.org/l62y86k8kq";
export const PERCHANCE_GENERATOR_URL_SECONDARY = "https://perchance.org/ai-text-to-image-generator";

const IFRAME_ID = "perchance-ai-generator-iframe";
let iframeInstance: HTMLIFrameElement | null = null;
let iframeReadyPromise: Promise<void> | null = null;
// Which generator the live frame is actually pointed at. Perchance serves
// both the desktop and `m.` (mobile) variants of a generator under the same
// origin, so we normalise for comparison.
let activeFrameSrc: string | null = null;

const normalizeGeneratorUrl = (url: string): string => url.replace("//m.perchance.org", "//perchance.org");

/**
 * Mirror the generation request onto the iframe element itself. If the hosted
 * generator was built with the EduAI embed bridge (a small script that reads
 * these attributes / listens for `eduai-perchance-generate` on its parent
 * frame element when it detects it is embedded), it can pick the request up
 * even in browsers where direct postMessage delivery to the sandboxed frame
 * is unreliable. Harmless when the generator has no bridge — the DOM driver
 * path below is the fallback in that case.
 */
function buildEmbedMirrorAttributes(iframe: HTMLIFrameElement, prompt: string, requestId: string) {
  try {
    iframe.setAttribute("data-eduai-prompt", prompt);
    iframe.setAttribute("data-eduai-request-id", requestId);
    iframe.dispatchEvent(new CustomEvent("eduai-perchance-generate", { detail: { prompt, requestId }, bubbles: false }));
  } catch {
    /* non-fatal */
  }
}

function ensurePerchanceIframe(src: string = PERCHANCE_GENERATOR_URL): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Perchance iframe client can only run in a browser environment"));
  }

  // If a stale frame from an earlier code version points at a DIFFERENT
  // generator than the one we need right now, tear it down and rebuild —
  // otherwise every call silently runs against the wrong engine.
  const existingEl = document.getElementById(IFRAME_ID) as HTMLIFrameElement | null;
  if (
    existingEl &&
    normalizeGeneratorUrl(existingEl.getAttribute("src") || "") !== normalizeGeneratorUrl(src)
  ) {
    try { existingEl.remove(); } catch { /* ignore */ }
    iframeInstance = null;
    iframeReadyPromise = null;
  } else if (iframeInstance && existingEl) {
    return iframeReadyPromise || Promise.resolve();
  }

  let existing = existingEl as HTMLIFrameElement | null;
  if (!existing) {
    existing = document.createElement("iframe");
    existing.id = IFRAME_ID;
    existing.src = src;
    activeFrameSrc = src;
    existing.title = PERCHANCE_GENERATOR_NAME;
    // `allow-same-origin` is required here: the Perchance generator keeps its
    // own cookies/storage ("your cookies/storage for this site got cleared…"),
    // and an opaque origin (no allow-same-origin) makes those throw and
    // breaks the generator. Chrome still prints the generic
    // "allow-scripts + allow-same-origin can escape its sandboxing" notice
    // for this frame — it is a false positive here, because the framed
    // document is a THIRD-PARTY origin (perchance.org) and therefore cannot
    // reach `frameElement` to drop its own sandbox. The srcdoc preview in
    // ContentCreator.tsx has no such exemption, so it is sandboxed with
    // `allow-scripts` only.
    existing.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-modals");
    existing.style.position = "fixed";
    existing.style.width = "1px";
    existing.style.height = "1px";
    existing.style.top = "-9999px";
    existing.style.left = "-9999px";
    existing.style.opacity = "0";
    existing.style.pointerEvents = "none";
    document.body.appendChild(existing);
  }

  iframeInstance = existing;

  iframeReadyPromise = new Promise((resolve) => {
    const onLoad = () => {
      existing?.removeEventListener("load", onLoad);
      resolve();
    };

    if ((existing as any)?.readyState === "complete" || existing?.contentDocument?.readyState === "complete") {
      resolve();
    } else {
      existing?.addEventListener("load", onLoad);
      // Fallback resolve after 4 seconds in case load event is suppressed by sandbox
      setTimeout(resolve, 4000);
    }
  });

  return iframeReadyPromise;
}

// ─── Path 1: postMessage embed protocol ──────────────────────────────────────

function tryPostMessageProtocol(
  iframe: HTMLIFrameElement,
  prompt: string,
  width: number,
  height: number,
  seed: number,
  requestId: string,
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    let timeoutId: any = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("message", messageHandler);
    };

    const messageHandler = (event: MessageEvent) => {
      // Strict origin check for security. The frame may be redirected to
      // m.perchance.org (mobile variant of the same generator), so accept
      // any *.perchance.org origin.
      let originOk = false;
      try {
        const host = new URL(event.origin).hostname;
        originOk = host === "perchance.org" || host.endsWith(".perchance.org");
      } catch {
        originOk = event.origin.includes("perchance.org");
      }
      if (!originOk) {
        return;
      }

      const data = event.data;
      if (!data) return;

      let imgUrl: string | null = null;

      // Perchance may return the URL as a direct string or nested in an object
      if (typeof data === "string") {
        if (data.startsWith("http://") || data.startsWith("https://") || data.startsWith("data:image/")) {
          imgUrl = data;
        }
      } else if (typeof data === "object") {
        // Ignore replies that clearly belong to a different request when the
        // generator echoes requestId back to us.
        const echoedId = data.requestId || data.id;
        if (echoedId && typeof echoedId === "string" && echoedId !== requestId) return;
        imgUrl = data.url || data.image || data.imageUrl || data.result || data.output || data.data || data.imageData;
        if (imgUrl && typeof imgUrl !== "string") imgUrl = null;
      }

      if (imgUrl) {
        console.log(`[Perchance AI] Successfully generated image for request ${requestId}`);
        cleanup();
        resolve(imgUrl);
      }
    };

    window.addEventListener("message", messageHandler);

    // Payload optimized for Perchance's standard AI Text-to-Image generator
    const payload = {
      type: "generate",
      prompt: prompt,
      width: width,
      height: height,
      seed: seed,
      requestId: requestId
    };

    // Mirror the request onto the frame element + host CustomEvent so a
    // generator built with the EduAI embed bridge can pick it up even when
    // direct postMessage delivery into a sandboxed cross-origin frame is
    // swallowed by the browser. See buildEmbedMirrorAttributes().
    buildEmbedMirrorAttributes(iframe, prompt, requestId);

    try {
      iframe.contentWindow?.postMessage(payload, "*");
    } catch (err) {
      cleanup();
      reject(err);
      return;
    }

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Perchance postMessage protocol did not respond"));
    }, timeoutMs);
  });
}

// ─── Path 2: drive the generator UI inside the iframe directly ───────────────

function getFrameDoc(iframe: HTMLIFrameElement): Document | null {
  try {
    return iframe.contentDocument || iframe.contentWindow?.document || null;
  } catch {
    return null; // cross-origin — DOM driver unavailable
  }
}

function findPromptControl(doc: Document): HTMLTextAreaElement | HTMLInputElement | null {
  const selectors = [
    "textarea#prompt",
    "textarea[name='prompt']",
    "#prompt",
    "textarea",
    "input[type='text']",
    "div[contenteditable='true']",
  ];
  for (const sel of selectors) {
    const el = doc.querySelector(sel) as HTMLTextAreaElement | HTMLInputElement | null;
    if (el && !(el as HTMLInputElement).disabled) return el;
  }
  return null;
}

function findGenerateButton(doc: Document): HTMLElement | null {
  const buttons = Array.from(doc.querySelectorAll("button, input[type='button'], .btn, [role='button']")) as HTMLElement[];
  return (
    buttons.find((b) => /generate/i.test(b.textContent || (b as HTMLInputElement).value || "")) ||
    (doc.querySelector("#generate-btn, #generateButton, [id*='enerate'][class*='btn']") as HTMLElement) ||
    null
  );
}

function setControlValue(el: HTMLTextAreaElement | HTMLInputElement | HTMLElement, value: string) {
  if (el.getAttribute && el.getAttribute("contenteditable") === "true") {
    el.textContent = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  const inputEl = el as HTMLInputElement;
  const proto = inputEl instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(inputEl, value);
  else (inputEl as any).value = value;
  inputEl.dispatchEvent(new Event("input", { bubbles: true }));
  inputEl.dispatchEvent(new Event("change", { bubbles: true }));
}

function extractGeneratedImage(iframe: HTMLIFrameElement, startedAt: number): string | null {
  const doc = getFrameDoc(iframe);
  if (!doc) return null;

  // Perchance AI generators render results into <img> elements (or canvases)
  // inside output/result containers. Prefer images that appeared AFTER we hit
  // generate; fall back to any large rendered image.
  const candidates = Array.from(doc.querySelectorAll("img")) as HTMLImageElement[];
  const usable = candidates.filter((img) => {
    const src = img.currentSrc || img.src || "";
    if (!src) return false;
    if (/icon|logo|avatar|spinner|loading/i.test(src)) return false;
    const isResult =
      src.startsWith("data:image/") ||
      src.startsWith("blob:") ||
      /perchance\.org\/(dl|storage|uploads|api)/i.test(src) ||
      /userusercontent|cloudflarestorage|fileservers|imageproxy/i.test(src);
    return isResult;
  });

  const fresh = usable.find((img) => {
    const natural = img.naturalWidth || 0;
    return natural >= 64 && Number(img.dataset.eduaiStamp || 0) >= startedAt;
  });
  const pick = fresh || usable.find((img) => (img.naturalWidth || 0) >= 64 && img.complete);
  if (!pick) {
    // Canvases (some generators draw straight to canvas)
    const canvas = doc.querySelector("canvas") as HTMLCanvasElement | null;
    if (canvas && canvas.width >= 128) {
      try {
        const url = canvas.toDataURL("image/png");
        if (url && url.length > 5000) return url;
      } catch {
        /* tainted canvas — ignore */
      }
    }
    return null;
  }

  // Tag the element so subsequent polls know it predates nothing newer.
  try {
    (pick as any).dataset.eduaiStamp = String(startedAt);
  } catch {
    /* non-fatal */
  }
  return pick.currentSrc || pick.src;
}

function tryDomDriver(
  iframe: HTMLIFrameElement,
  prompt: string,
  timeoutMs: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = getFrameDoc(iframe);
    if (!doc) {
      reject(new Error("Perchance frame is cross-origin; DOM driver unavailable"));
      return;
    }

    // Cloudflare interstitials ("Just a moment…") render no prompt control at
    // all. Detect them explicitly so logs say WHY Perchance was skipped.
    const title = (doc.title || "").toLowerCase();
    const bodyText = (doc.body?.textContent || "").slice(0, 300).toLowerCase();
    if (/just a moment|checking your browser|verify you are human/.test(title + " " + bodyText)) {
      reject(new Error("Perchance frame is stuck on the Cloudflare verification page"));
      return;
    }

    const control = findPromptControl(doc);
    const button = findGenerateButton(doc);
    if (!control) {
      reject(new Error("Perchance generator UI: no prompt field found (page may still be loading)"));
      return;
    }

    const startedAt = Date.now();
    setControlValue(control as any, prompt);

    // Click Generate if there is a button; otherwise Enter is the universal
    // fallback shortcut on Perchance text-to-image generators.
    if (button) {
      button.click();
    } else {
      control.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
      control.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true }));
    }

    const deadline = startedAt + timeoutMs;
    const poll = setInterval(() => {
      const url = extractGeneratedImage(iframe, startedAt);
      if (url) {
        clearInterval(poll);
        clearTimeout(guard);
        console.log("[Perchance AI] DOM driver captured a generated image.");
        resolve(url);
      } else if (Date.now() > deadline) {
        clearInterval(poll);
        clearTimeout(guard);
        reject(new Error("Perchance DOM driver timed out waiting for an image"));
      }
    }, 750);

    const guard = setTimeout(() => clearInterval(poll), timeoutMs + 2000);
  });
}

// ─── Public entry point ──────────────────────────────────────────────────────

export async function generatePerchanceImageClient(
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed?: number,
  timeoutMs: number = 15000
): Promise<string> {
  await ensurePerchanceIframe();

  const iframe = iframeInstance || (document.getElementById(IFRAME_ID) as HTMLIFrameElement);
  if (!iframe || !iframe.contentWindow) {
    throw new Error("Perchance iframe could not be initialized");
  }

  const generatedSeed = seed ?? Math.floor(Math.random() * 100000);
  const requestId = `eduai-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[Perchance AI] Initiating generation | Request: ${requestId} | Prompt: "${prompt.slice(0, 60)}..."`);

  // Budget split: half the time on the clean postMessage protocol against the
  // approved l62y86k8kq generator, the other half on the DOM driver (and one
  // quick protocol retry against the secondary generator before giving up).
  const protocolBudget = Math.max(3500, Math.floor(timeoutMs * 0.4));
  const driverBudget = Math.max(6000, timeoutMs - protocolBudget);

  try {
    return await tryPostMessageProtocol(iframe, prompt, width, height, generatedSeed, requestId, protocolBudget);
  } catch (protocolErr) {
    console.warn(`[Perchance AI] postMessage protocol miss (${(protocolErr as Error).message}); driving the generator UI...`);
  }

  try {
    return await tryDomDriver(iframe, prompt, driverBudget);
  } catch (driverErr) {
    console.warn(`[Perchance AI] DOM driver failed (${(driverErr as Error).message}); trying secondary generator protocol...`);
  }

  // Last resort inside the Perchance provider: the classic public generator,
  // which reliably implements the embed postMessage protocol.
  try {
    await reloadIframe(PERCHANCE_GENERATOR_URL_SECONDARY);
    return await tryPostMessageProtocol(
      iframe,
      prompt,
      width,
      height,
      generatedSeed,
      `${requestId}-secondary`,
      Math.max(4000, Math.floor(timeoutMs * 0.5))
    );
  } finally {
    // Restore the approved generator for future calls.
    reloadIframe(PERCHANCE_GENERATOR_URL).catch(() => {});
  }
}

async function reloadIframe(src: string): Promise<void> {
  const iframe = iframeInstance || (document.getElementById(IFRAME_ID) as HTMLIFrameElement);
  if (!iframe) throw new Error("Perchance iframe missing");
  if (normalizeGeneratorUrl(iframe.getAttribute("src") || "") === normalizeGeneratorUrl(src) && activeFrameSrc === src) {
    await new Promise((r) => setTimeout(r, 300));
    return;
  }
  iframeReadyPromise = null;
  activeFrameSrc = src;
  iframe.src = src;
  await new Promise<void>((resolve) => {
    const done = () => {
      iframe.removeEventListener("load", done);
      resolve();
    };
    iframe.addEventListener("load", done);
    setTimeout(done, 4000);
  });
}
