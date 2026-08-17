/**
 * Perchance AI Image Generator Service
 * Implements connection to Perchance AI generators via iframe postMessage API
 * Updated for maximum reliability and request correlation.
 */

export const PERCHANCE_GENERATOR_NAME = "Perchance AI Text-to-Image";
// Using the most stable and widely-supported Perchance AI generator
export const PERCHANCE_GENERATOR_URL = "https://perchance.org/ai-text-to-image-generator";

const IFRAME_ID = "perchance-ai-generator-iframe";
let iframeInstance: HTMLIFrameElement | null = null;
let iframeReadyPromise: Promise<void> | null = null;

function ensurePerchanceIframe(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Perchance iframe client can only run in a browser environment"));
  }

  if (iframeInstance && document.getElementById(IFRAME_ID)) {
    return iframeReadyPromise || Promise.resolve();
  }

  let existing = document.getElementById(IFRAME_ID) as HTMLIFrameElement | null;
  if (!existing) {
    existing = document.createElement("iframe");
    existing.id = IFRAME_ID;
    existing.src = PERCHANCE_GENERATOR_URL;
    existing.title = PERCHANCE_GENERATOR_NAME;
    // Allow scripts and same-origin to ensure postMessage works correctly
    existing.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
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

  return new Promise((resolve, reject) => {
    let timeoutId: any = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("message", messageHandler);
    };

    const messageHandler = (event: MessageEvent) => {
      // Strict origin check for security
      if (!event.origin.includes("perchance.org")) {
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
        imgUrl = data.url || data.image || data.imageUrl || data.result || data.output || data.data || data.imageData;
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
      seed: generatedSeed,
      requestId: requestId 
    };

    try {
      iframe.contentWindow.postMessage(payload, "*");
    } catch (err) {
      cleanup();
      reject(err);
      return;
    }

    // Timeout as AI generation can take time (shorter on native so the chain
    // falls through to Gemini/Pollinations without stalling every image).
    timeoutId = setTimeout(() => {
      cleanup();
      console.warn(`[Perchance AI] Request ${requestId} timed out after ${timeoutMs}ms. Transitioning to fallback.`);
      reject(new Error("Perchance iframe generation timed out"));
    }, timeoutMs);
  });
}
