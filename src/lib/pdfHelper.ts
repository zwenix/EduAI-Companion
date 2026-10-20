/**
 * Reusable helper utility to intercept and patch modern CSS 'oklch' color styles
 * during canvas rendering. Extremely clean, browser-native, and transparent.
 */

let canvasForColorConversion: HTMLCanvasElement | null = null;
let ctxForColorConversion: CanvasRenderingContext2D | null = null;

function convertOklToRgb(cssVal: string): string {
  if (!cssVal || typeof cssVal !== 'string' || (!cssVal.includes('oklch') && !cssVal.includes('oklab'))) {
    return cssVal;
  }

  // Matches any oklch(...) or oklab(...) occurrences
  const oklRegex = /(oklch|oklab)\([^)]+\)/g;

  try {
    if (!canvasForColorConversion) {
      canvasForColorConversion = document.createElement('canvas');
      canvasForColorConversion.width = 1;
      canvasForColorConversion.height = 1;
      ctxForColorConversion = canvasForColorConversion.getContext('2d');
    }

    return cssVal.replace(oklRegex, (match) => {
      if (ctxForColorConversion) {
        ctxForColorConversion.fillStyle = 'rgba(0,0,0,0)';
        ctxForColorConversion.fillStyle = match;
        const resolved = ctxForColorConversion.fillStyle;
        // Verify we got a converted hex or rgb string back from the browser engine
        if (resolved && resolved !== 'rgba(0,0,0,0)' && resolved !== 'transparent' && !resolved.includes('oklch') && !resolved.includes('oklab')) {
          return resolved;
        }
      }
      return 'rgb(244, 244, 245)'; // standard neutral zinc-100 fallback
    });
  } catch (e) {
    return 'rgb(244, 244, 245)';
  }
}

/**
 * Nesting guard. Several export paths patch around the same render (printUtils
 * wraps the whole export, pdfPaginate wraps each render), and every patch wraps
 * `window.getComputedStyle` in a Proxy. Re-entrancy used to stack Proxies and —
 * worse — a single forgotten restore left the Proxy installed for the rest of
 * the session, slowing the entire app down (a big part of the "the app freezes
 * after exporting" report).
 */
let patchDepth = 0;
let activeRestore: (() => void) | null = null;

/**
 * Temporarily overrides window.getComputedStyle to intercept and convert
 * any computed property values containing 'oklch' or 'oklab' values to standard cross-rendered 'rgb'.
 * This successfully prevents html2canvas in ProgressReports and StudentNotes from crashing.
 * 
 * @returns A function to restore the original window.getComputedStyle. Safe to
 *   call multiple times and safe to nest.
 */
export function patchOklchForHtml2canvas(): () => void {
  patchDepth += 1;

  if (patchDepth === 1) {
    activeRestore = installOklchPatch();
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    patchDepth = Math.max(0, patchDepth - 1);
    if (patchDepth === 0 && activeRestore) {
      const restore = activeRestore;
      activeRestore = null;
      restore();
    }
  };
}

function installOklchPatch(): () => void {
  const originalGetComputedStyle = window.getComputedStyle;

  window.getComputedStyle = function (elt, pseudoElt) {
    const style = originalGetComputedStyle.call(this, elt, pseudoElt);
    
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function (propertyName: string) {
            const val = target.getPropertyValue(propertyName);
            if (val && typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
              return convertOklToRgb(val);
            }
            return val;
          };
        }

        const val = Reflect.get(target, prop);
        if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
          return convertOklToRgb(val);
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }
    });
  };

  return () => {
    window.getComputedStyle = originalGetComputedStyle;
  };
}

/**
 * Mount `surface` in the DOM, off-screen, for html2pdf / html2canvas.
 *
 * html2pdf.js CLONES the element it is given — inline styles included — into
 * its own overlay. If that element is `position: absolute|fixed` the clone is
 * taken out of flow, the overlay collapses to 0px tall and html2canvas renders
 * a 717x0 canvas: the "exported PDF is one blank page" bug. So the render
 * surface must stay in normal flow, and the off-screen positioning lives on a
 * separate wrapper that html2pdf never clones. (The wrapper is `absolute`, not
 * `fixed`, so html2canvas' scroll compensation still lines up when the app
 * has been scrolled.)
 *
 * Returns a cleanup function that removes the wrapper again.
 */
export function mountOffscreenSurface(surface: HTMLElement, widthPx = 800): () => void {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.position = 'absolute';
  host.style.left = '-9999px';
  host.style.top = '0';
  host.style.width = `${widthPx}px`;
  host.style.pointerEvents = 'none';
  host.appendChild(surface);
  document.body.appendChild(host);
  return () => {
    if (host.parentNode) host.parentNode.removeChild(host);
  };
}

/**
 * Page-break options shared by every html2pdf export.
 *
 * NEVER use html2pdf's `avoid-all` mode. It forbids a split inside EVERY
 * element and pushes any element that is at most one page tall onto the next
 * page — including the wrapper (`.card`, `.page`, a model-authored container)
 * that holds the whole document. The result was a first page holding only the
 * header + banner followed by a huge blank gap, with the real content starting
 * on page 2 (and blank pages when the same happened again further down).
 *
 * Instead only SMALL blocks are kept whole; anything bigger flows across pages.
 */
export const PDF_PAGEBREAK_OPTIONS = {
  mode: ['css', 'legacy'] as Array<'css' | 'legacy'>,
  avoid: ['tr', 'img', 'figure', 'li', 'blockquote', 'p', 'h1', 'h2', 'h3', 'h4', '.eduai-compliance-banner'],
};

/**
 * Elements that ask for `break-inside: avoid` (card styles, model-authored
 * `page-break-inside: avoid` wrappers, Tailwind `break-inside-avoid`) are only
 * honoured when they are small. A big block with that rule would otherwise be
 * shifted wholesale to the next page, leaving the rest of the current page
 * empty. Call this once the surface is mounted (so heights are measurable).
 */
export function relaxOversizedBreakAvoid(surface: HTMLElement, pageHeightPx = 1000): void {
  const limit = pageHeightPx * 0.3;
  const all = surface.querySelectorAll<HTMLElement>('*');
  all.forEach((el) => {
    try {
      const cs = window.getComputedStyle(el);
      const rule = `${cs.breakInside || ''} ${cs.getPropertyValue('page-break-inside') || ''}`;
      if (!/avoid/.test(rule)) return;
      if (el.getBoundingClientRect().height <= limit) return;
      el.style.setProperty('break-inside', 'auto', 'important');
      el.style.setProperty('page-break-inside', 'auto', 'important');
    } catch {
      /* ignore */
    }
  });
}
