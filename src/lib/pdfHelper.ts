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
