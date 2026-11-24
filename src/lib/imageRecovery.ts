// Global recovery net for generated illustrations.
//
// Generated CAPS content is injected with `dangerouslySetInnerHTML` in a dozen
// places (archive, reader, tutor, auto-grading…), so there is no React error
// boundary per <img>. This installs one capture-phase listener that catches any
// illustration whose source failed and re-resolves it through the DOCUMENT
// engine (`./documentImageEngine`), which starts with the teacher's selected
// engine — Perchance Image API v1 — and only then falls back to FLUX, Imagen
// and keyless Pollinations.

import { resolveDocumentIllustration } from './documentImageEngine';

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

  // Walk the document engine chain (PRIMARY engine first, Perchance by
  // default). Pollinations is never retried ahead of a healthy primary.
  try {
    const result = await resolveDocumentIllustration(prompt, { width: 800, height: 600, seed: seed + attempts });
    if (result?.url && result.provider !== 'placeholder') {
      img.src = result.url;
      img.setAttribute('data-eduai-provider', result.provider);
    }
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
