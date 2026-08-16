// Global recovery net for generated illustrations.
//
// Generated CAPS content is injected with `dangerouslySetInnerHTML` in a dozen
// places (archive, reader, tutor, auto-grading…), so there is no React error
// boundary per <img>. This installs one capture-phase listener that catches any
// illustration whose direct URL failed — typically the backend `/api/image-proxy`
// route, which does not exist inside the Android APK — and re-resolves it
// through the configured provider chain.

import { generateImageWithFallback, buildPollinationsUrl } from './imageGeneration';

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

  // First retry: swap straight to the public image API (fast, no round trip).
  if (attempts === 0) {
    img.src = buildPollinationsUrl(prompt, 800, 600, seed);
    return;
  }

  // Second retry: walk the full provider chain (Gemini client engine, etc.).
  try {
    const result = await generateImageWithFallback({ prompt, width: 800, height: 600, seed: seed + 1 });
    if (result?.url) img.src = result.url;
  } catch (err) {
    console.warn('[Image Recovery] Could not regenerate illustration:', err);
  }
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

      void recover(img);
    },
    true, // capture: <img> error events do not bubble
  );
};
