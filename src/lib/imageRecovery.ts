// Global recovery net for generated illustrations.
//
// Generated CAPS content is injected with `dangerouslySetInnerHTML` in a dozen
// places (archive, reader, tutor, auto-grading…), so there is no React error
// boundary per <img>. This installs one capture-phase listener that catches any
// illustration whose direct URL failed — typically the backend `/api/image-proxy`
// route, which does not exist inside the Android APK — and re-resolves it
// through the configured provider chain.

import { generateImageWithFallback } from './imageGeneration';
import { cacheGeneratedIllustration } from './imageReplacer';

const RETRY_ATTR = 'data-eduai-retry';
const MAX_RETRIES = 2;
let installed = false;

const recover = async (img: HTMLImageElement) => {
  const attempts = parseInt(img.getAttribute(RETRY_ATTR) || '0', 10);
  if (attempts >= MAX_RETRIES) return;
  img.setAttribute(RETRY_ATTR, String(attempts + 1));

  const encoded = img.getAttribute('data-eduai-prompt');
  const prompt = encoded ? decodeURIComponent(encoded) : (img.getAttribute('alt') || '').trim();
  if (!prompt) return;

  const seed = parseInt(img.getAttribute('data-eduai-seed') || '0', 10) || Math.floor(Math.random() * 100000);

  // Walk the configured provider graph immediately. This preserves the
  // explicit fallback relationships instead of retrying Pollinations first.
  try {
    // skipCache: the cached URL for this prompt is the one that just failed.
    const result = await generateImageWithFallback({ prompt, width: 800, height: 600, seed: seed + attempts, skipCache: true });
    if (result?.url) img.src = result.url;
  } catch (err) {
    console.warn('[Image Recovery] Could not regenerate illustration:', err);
  }
};

// ── Pending-illustration hydrator ───────────────────────────────────────────
// `replaceImagePlaceholders` emits illustrations as transparent "pending" images
// (data-eduai-pending="1"). Anything rendered into the main document (archive,
// reader, print preview, tutor…) is picked up here and generated through the
// provider chain — Perchance first — a couple at a time, instead of every image
// hammering Pollinations at once. (The ContentCreator preview iframe has its own
// bridge that calls the same generator.)
const HYDRATE_CONCURRENCY = 2;
const hydrateQueue: HTMLImageElement[] = [];
let activeHydrations = 0;

const hydrate = async (img: HTMLImageElement) => {
  if (img.getAttribute('data-eduai-pending') !== '1') return;
  img.setAttribute('data-eduai-pending', 'loading');

  const encoded = img.getAttribute('data-eduai-prompt');
  const prompt = encoded ? decodeURIComponent(encoded) : '';
  if (!prompt) return;
  const seed = parseInt(img.getAttribute('data-eduai-seed') || '0', 10) || Math.floor(Math.random() * 100000);

  try {
    const result = await generateImageWithFallback({ prompt, width: 800, height: 600, seed });
    if (!result?.url) return;
    img.src = result.url;
    img.removeAttribute('data-eduai-pending');
    if (result.provider !== 'pollinations') {
      cacheGeneratedIllustration((img.getAttribute('alt') || '').trim(), result.url);
    }
  } catch (err) {
    console.warn('[Image Hydrate] Could not generate illustration:', err);
  }
};

const pump = () => {
  while (activeHydrations < HYDRATE_CONCURRENCY && hydrateQueue.length) {
    const img = hydrateQueue.shift()!;
    if (!img.isConnected) continue;
    activeHydrations += 1;
    void hydrate(img).finally(() => {
      activeHydrations -= 1;
      pump();
    });
  }
};

const scanForPending = (root: ParentNode) => {
  root.querySelectorAll?.('img[data-eduai-pending="1"]').forEach((node) => {
    const img = node as HTMLImageElement;
    if (!hydrateQueue.includes(img)) hydrateQueue.push(img);
  });
  pump();
};

export const installImageRecovery = () => {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener(
    'error',
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== 'IMG') return;
      const img = target as HTMLImageElement;

      // Only touch generated illustrations — never app chrome / avatars.
      const isGenerated =
        img.hasAttribute('data-eduai-prompt') ||
        img.classList.contains('eduai-async-image') ||
        /image\.pollinations\.ai|\/api\/image-proxy/.test(img.getAttribute('src') || '');
      if (!isGenerated) return;
      // A pending placeholder can't fail (it's an inline pixel) but guard anyway.
      if ((img.getAttribute('src') || '').startsWith('data:image/gif')) return;

      void recover(img);
    },
    true, // capture: <img> error events do not bubble
  );

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) {
          const el = n as Element;
          if (el.matches?.('img[data-eduai-pending="1"]') || el.querySelector?.('img[data-eduai-pending="1"]')) {
            scanForPending(document);
          }
        }
      });
    }
  });
  const start = () => {
    observer.observe(document.body, { childList: true, subtree: true });
    scanForPending(document);
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
};
