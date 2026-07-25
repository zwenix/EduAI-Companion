/**
 * Perchance AI Image Generator Service
 * Implements connection to Perchance AI generators via iframe postMessage API
 * Tutorial Reference: https://perchance.org/api-tutorial
 * Configured Generator: "🌌 Image Generator Professional 🌟" (https://perchance.org/image-generator-professional)
 */

export const PERCHANCE_GENERATOR_NAME = "🌌 Image Generator Professional 🌟";
export const PERCHANCE_GENERATOR_URL = "https://perchance.org/image-generator-professional";
const IFRAME_ID = "perchance-generator-professional-iframe";

let iframeInstance: HTMLIFrameElement | null = null;
let iframeReadyPromise: Promise<void> | null = null;

/**
 * Initializes and mounts the singleton hidden Perchance iframe in the document body.
 */
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
      // Fallback resolve after 3 seconds in case load event already fired
      setTimeout(resolve, 3000);
    }
  });

  return iframeReadyPromise;
}

/**
 * Generates an image using Perchance Image Generator Professional via iframe postMessage
 */
export async function generatePerchanceImageClient(
  prompt: string,
  width: number = 1024,
  height: number = 1024,
  seed?: number
): Promise<string> {
  await ensurePerchanceIframe();

  const iframe = iframeInstance || (document.getElementById(IFRAME_ID) as HTMLIFrameElement);
  if (!iframe || !iframe.contentWindow) {
    throw new Error("Perchance iframe could not be initialized");
  }

  const generatedSeed = seed ?? Math.floor(Math.random() * 100000);
  console.log(`[Perchance AI] Initiating generation via ${PERCHANCE_GENERATOR_NAME} | Prompt: "${prompt.slice(0, 60)}..."`);

  return new Promise((resolve, reject) => {
    let timeoutId: any = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("message", messageHandler);
    };

    const messageHandler = (event: MessageEvent) => {
      // Validate origin from perchance.org or iframe source
      if (!event.origin.includes("perchance.org") && event.source !== iframe.contentWindow) {
        return;
      }

      const data = event.data;
      if (!data) return;

      let imgUrl: string | null = null;
      if (typeof data === "string") {
        if (data.startsWith("http://") || data.startsWith("https://") || data.startsWith("data:image/")) {
          imgUrl = data;
        }
      } else if (typeof data === "object") {
        const potentialUrl = data.url || data.image || data.imageUrl || data.result || data.output || data.data;
        if (typeof potentialUrl === "string" && (potentialUrl.startsWith("http") || potentialUrl.startsWith("data:image/"))) {
          imgUrl = potentialUrl;
        }
      }

      if (imgUrl) {
        console.log(`[Perchance AI] Successfully generated image from ${PERCHANCE_GENERATOR_NAME}`);
        cleanup();
        resolve(imgUrl);
      }
    };

    window.addEventListener("message", messageHandler);

    // Send generation command payload following Perchance tutorial conventions
    const payload = {
      action: "generate",
      type: "generate",
      command: "generate",
      prompt: prompt,
      description: prompt,
      width: width,
      height: height,
      seed: generatedSeed,
      user: "EduAI-Companion",
      generator: PERCHANCE_GENERATOR_NAME
    };

    try {
      iframe.contentWindow.postMessage(payload, "*");
    } catch (err) {
      cleanup();
      reject(err);
      return;
    }

    // Set a 12-second timeout to fallback cleanly if iframe is sandboxed or slow
    timeoutId = setTimeout(() => {
      cleanup();
      console.warn(`[Perchance AI] Iframe generation timed out after 12s. Transitioning to backend proxy for ${PERCHANCE_GENERATOR_NAME}.`);
      reject(new Error("Perchance iframe generation timed out"));
    }, 12000);
  });
}
