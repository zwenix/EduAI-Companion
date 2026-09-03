// Self-healing safety net for the PDF libraries.
//
// html2pdf.js covers the whole app with an invisible `.html2pdf__overlay`
// (`position: fixed; inset: 0; z-index: 1000; opacity: 0`) while it renders, and
// only removes it after a *successful* render. When html2canvas fails — routinely
// the case on Android for tall CAPS documents — that layer stays behind and eats
// every tap: the screen looks frozen, nothing can be closed, and the teacher
// cannot get back or save the content. html2canvas can likewise leave a hidden
// `iframe.html2canvas-container` holding a full clone of the document.
//
// Exports now clean up after themselves (`cleanupExportArtifacts()` in
// printUtils), but this watchdog guarantees recovery even for the older call
// sites that call `html2pdf().save()` directly.

import { notify } from './toast';

const OVERLAY_SELECTOR = '.html2pdf__overlay';
const IFRAME_SELECTOR = 'iframe.html2canvas-container';
const CHECK_INTERVAL_MS = 10_000;
const STUCK_AFTER_MS = 90_000;

let installed = false;
const firstSeen = new WeakMap<Element, number>();

const sweep = (selector: string, announcement: string) => {
  let removed = 0;
  document.querySelectorAll(selector).forEach((node) => {
    const now = Date.now();
    const seen = firstSeen.get(node);
    if (!seen) {
      firstSeen.set(node, now);
      return;
    }
    if (now - seen < STUCK_AFTER_MS) return;
    try {
      node.parentNode?.removeChild(node);
      firstSeen.delete(node);
      removed += 1;
    } catch {
      /* ignore */
    }
  });
  if (removed > 0) {
    console.warn(`[ExportSafetyNet] Removed ${removed} stuck ${selector} node(s).`);
    notify(announcement, 'info');
  }
};

export const installExportSafetyNet = () => {
  if (installed || typeof window === 'undefined' || typeof document === 'undefined') return;
  installed = true;

  window.setInterval(() => {
    try {
      sweep(OVERLAY_SELECTOR, 'A stuck export layer was cleared — the app is responsive again.');
      sweep(IFRAME_SELECTOR, 'Cleaned up leftover export memory.');
    } catch (err) {
      console.warn('[ExportSafetyNet] sweep failed:', err);
    }
  }, CHECK_INTERVAL_MS);
};

export default installExportSafetyNet;
