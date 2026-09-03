// Native download & popup bridge.
//
// Two Android WebView behaviours break every "Export"/"Download" button in the
// app, and they used to break them *silently*:
//
//   1. `<a download href="blob:…">` clicks are dropped on the floor — the WebView
//      has no `DownloadListener` and Capacitor's `Bridge.launchIntent()` ignores
//      `blob:`/`data:` URLs. Images, videos, worksheets, JSON backups… nothing
//      ever reached the device.
//   2. `window.open('')` resolves to `about:blank`, whose host does not match the
//      app host, so Capacitor launches an external `ACTION_VIEW` intent: the
//      teacher's browser pops open on whatever page it last showed and the app
//      is left mid-export with nothing saved.
//
// This bridge patches both at boot (only while running inside the native app) and
// routes the bytes through `deliverFile()` → Filesystem + the Android share sheet.
// Call sites keep using plain web APIs, so a dozen components are fixed at once.

import { isNativeApp } from './platform';
import { deliverFile, notify, rememberBlobUrl, resolveBlobFromUrl, sanitizeFilename } from './nativeExport';

let installed = false;
const recentExports = new Map<string, number>();

const isBlankUrl = (value: unknown): boolean => {
  const raw = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
  return raw === '' || raw === 'about:blank' || raw === '_blank' || raw === 'about:srcdoc';
};

const guessFilename = (href: string, anchor: HTMLAnchorElement | null): string => {
  const fromAnchor = anchor?.getAttribute('download');
  if (fromAnchor) return sanitizeFilename(fromAnchor);
  const alt = anchor?.textContent?.trim();
  if (alt && alt.length < 80) return sanitizeFilename(`${alt.replace(/\s+/g, '_')}.file`);
  if (/^data:/i.test(href)) {
    const mime = (href.match(/^data:([^;,]+)/i) || [])[1] || '';
    const ext = mime.includes('pdf') ? 'pdf' : mime.includes('html') ? 'html' : mime.includes('json') ? 'json' : mime.startsWith('image/') ? 'png' : 'bin';
    return `eduai-export-${Date.now()}.${ext}`;
  }
  return `eduai-export-${Date.now()}.file`;
};

const exportUrl = async (href: string, filename: string) => {
  const key = `${href.slice(0, 64)}::${filename}`;
  const now = Date.now();
  const last = recentExports.get(key) || 0;
  if (now - last < 1500) return; // both handlers fired for the same click
  recentExports.set(key, now);
  if (recentExports.size > 20) {
    for (const [k, t] of Array.from(recentExports.entries())) {
      if (now - t > 5000) recentExports.delete(k);
    }
  }

  try {
    const blob = await resolveBlobFromUrl(href);
    await deliverFile(blob, filename, {
      shareTitle: filename,
      dialogTitle: 'Save, print or share your file',
    });
  } catch (err: any) {
    console.error('[DownloadBridge] Export failed:', err);
    notify(`Could not save ${filename}. Try again, or use Archive to keep it inside EduAI.`, 'error');
  }
};

export const installNativeDownloadBridge = () => {
  if (installed || typeof window === 'undefined' || typeof document === 'undefined') return;
  installed = true;

  // 1. Remember the Blob behind every object URL. Callers revoke these
  //    synchronously after `.click()`, so a later async read would 404.
  try {
    const originalCreate = URL.createObjectURL.bind(URL);
    URL.createObjectURL = ((object: any) => {
      const url = originalCreate(object);
      try {
        if (isNativeApp() && typeof Blob !== 'undefined' && object instanceof Blob) rememberBlobUrl(url, object);
      } catch {
        /* ignore */
      }
      return url;
    }) as typeof URL.createObjectURL;
  } catch (err) {
    console.warn('[DownloadBridge] Could not patch URL.createObjectURL:', err);
  }

  // 2. Blank popups never reach the OS as a browser intent.
  try {
    const originalOpen = window.open ? window.open.bind(window) : null;
    window.open = ((url?: any, target?: any, features?: any) => {
      try {
        if (isNativeApp() && isBlankUrl(url)) {
          console.warn('[DownloadBridge] Ignored window.open(blank) — the WebView would have opened your external browser.');
          return null;
        }
      } catch {
        /* fall through to the native implementation */
      }
      return originalOpen ? originalOpen(url, target, features) : null;
    }) as typeof window.open;
  } catch (err) {
    console.warn('[DownloadBridge] Could not patch window.open:', err);
  }

  // 3a. Programmatic downloads (`anchor.click()` from JS) — covers detached
  //     anchors, which never reach a document-level listener.
  try {
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function patchedClick(this: HTMLAnchorElement) {
      try {
        if (isNativeApp() && this.hasAttribute('download')) {
          const href = this.getAttribute('href') || '';
          if (/^(blob:|data:)/i.test(href)) {
            void exportUrl(href, guessFilename(href, this));
            return; // swallow — the WebView would drop the click anyway
          }
        }
      } catch (err) {
        console.warn('[DownloadBridge] anchor.click patch fell through:', err);
      }
      return originalClick.call(this);
    };
  } catch (err) {
    console.warn('[DownloadBridge] Could not patch HTMLAnchorElement.click:', err);
  }

  // 3b. Real taps on rendered <a download> elements.
  document.addEventListener(
    'click',
    (event) => {
      try {
        if (!isNativeApp()) return;
        const target = event.target as HTMLElement | null;
        const anchor = target?.closest?.('a') as HTMLAnchorElement | null;
        if (!anchor || !anchor.hasAttribute('download')) return;
        const href = anchor.getAttribute('href') || '';
        if (!/^(blob:|data:)/i.test(href)) return;
        event.preventDefault();
        event.stopPropagation();
        void exportUrl(href, guessFilename(href, anchor));
      } catch (err) {
        console.warn('[DownloadBridge] click listener failed:', err);
      }
    },
    true
  );
};

export default installNativeDownloadBridge;
