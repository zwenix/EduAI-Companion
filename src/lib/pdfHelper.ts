/**
 * Reusable helper utility to intercept and patch modern CSS 'oklch' color styles
 * during canvas rendering. Extremely clean, browser-native, and transparent.
 */

let canvasForColorConversion: HTMLCanvasElement | null = null;
let ctxForColorConversion: CanvasRenderingContext2D | null = null;

function convertOklchToRgb(cssVal: string): string {
  if (!cssVal || typeof cssVal !== 'string' || !cssVal.includes('oklch')) {
    return cssVal;
  }

  // Matches any oklch(...) occurrences
  const oklchRegex = /oklch\([^)]+\)/g;

  try {
    if (!canvasForColorConversion) {
      canvasForColorConversion = document.createElement('canvas');
      canvasForColorConversion.width = 1;
      canvasForColorConversion.height = 1;
      ctxForColorConversion = canvasForColorConversion.getContext('2d');
    }

    return cssVal.replace(oklchRegex, (match) => {
      if (ctxForColorConversion) {
        ctxForColorConversion.fillStyle = 'rgba(0,0,0,0)';
        ctxForColorConversion.fillStyle = match;
        const resolved = ctxForColorConversion.fillStyle;
        // Verify we got a converted hex or rgb string back from the browser engine
        if (resolved && resolved !== 'rgba(0,0,0,0)' && resolved !== 'transparent' && !resolved.includes('oklch')) {
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
 * Temporarily overrides window.getComputedStyle to intercept and convert
 * any computed property values containing 'oklch' values to standard cross-rendered 'rgb'.
 * This successfully prevents html2canvas in ProgressReports and StudentNotes from crashing.
 * 
 * @returns A function to restore the original window.getComputedStyle.
 */
export function patchOklchForHtml2canvas(): () => void {
  const originalGetComputedStyle = window.getComputedStyle;

  window.getComputedStyle = function (elt, pseudoElt) {
    const style = originalGetComputedStyle.call(this, elt, pseudoElt);
    
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function (propertyName: string) {
            const val = target.getPropertyValue(propertyName);
            if (val && typeof val === 'string' && val.includes('oklch')) {
              return convertOklchToRgb(val);
            }
            return val;
          };
        }

        const val = Reflect.get(target, prop);
        if (typeof val === 'string' && val.includes('oklch')) {
          return convertOklchToRgb(val);
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
