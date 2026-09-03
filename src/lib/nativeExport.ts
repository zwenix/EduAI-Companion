// Device-level file delivery for exports (PDF / HTML / images / anything Blob).
//
// Why this module exists
// ────────────────────────
// Inside the Capacitor Android WebView a classic browser download does nothing:
//   • `<a download href="blob:…">` — the WebView has no `DownloadListener`, and
//     `Bridge.launchIntent()` explicitly returns `false` for `blob:`/`data:`
//     URLs, so the click is swallowed silently. The teacher sees no file at all.
//   • `window.open('')` — resolves to `about:blank`, whose host does not match
//     the app host, so Capacitor fires an external `ACTION_VIEW` intent and the
//     user's *browser* opens on its last page while the export never happens.
//
// So on the native app we write the file through `@capacitor/filesystem` and hand
// it to the Android share sheet with `@capacitor/share` (Save to Files / Drive /
// Print / WhatsApp / email…). On the web we keep the normal anchor download, and
// use the Web Share API when the browser offers file sharing.
//
// Every function degrades gracefully: if the native plugins are missing from an
// older installed APK, we fall back to the browser path and say so on screen
// instead of failing silently.

import { isNativeApp, getPlatform, isAndroidDevice } from './platform';
import { dismissExport } from './exportProgress';
import { notify, TOAST_EVENT, type ToastType } from './toast';

export { notify, TOAST_EVENT };
export type { ToastType };

export type DeliveryMethod =
  | 'filesystem+share'
  | 'filesystem'
  | 'web-share'
  | 'download'
  | 'none';

export interface DeviceExportResult {
  ok: boolean;
  method: DeliveryMethod;
  /** `file://…` on native, `blob:…` when a web download was triggered */
  uri?: string;
  /** Human friendly location, e.g. `Documents/EduAI Companion` */
  location?: string;
  /** The OS share sheet was shown and the user picked a target */
  shared?: boolean;
  /** The user dismissed the share sheet — the file is still saved */
  cancelled?: boolean;
  error?: string;
}

export interface DeliverOptions {
  /** Show the OS share sheet after saving (defaults to true on native). */
  share?: boolean;
  shareTitle?: string;
  dialogTitle?: string;
  /** Override the success toast. Pass `null` to stay quiet. */
  successMessage?: string | null;
  /** Override the failure toast. Pass `null` to stay quiet. */
  failureMessage?: string | null;
  /** Keep the Blob URL alive for the caller to revoke later. */
  keepObjectUrl?: boolean;
}

const EXPORT_FOLDER = 'EduAI Companion';

export const sanitizeFilename = (name: string, fallback = 'eduai-document'): string => {
  const cleaned = String(name || '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return cleaned || fallback;
};

// ── Blob helpers ─────────────────────────────────────────────────────────────

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(reader.error || new Error('Could not read the file into memory'));
      reader.readAsDataURL(blob);
    } catch (err) {
      reject(err);
    }
  });

/**
 * Object URLs are revoked by the code that created them, often synchronously
 * right after `anchor.click()`. On native we therefore keep a small registry of
 * the blobs behind every object URL so the download bridge can still resolve
 * them (see `src/lib/nativeDownloadBridge.ts`).
 */
const blobRegistry = new Map<string, Blob>();
const REGISTRY_LIMIT = 40;

export const rememberBlobUrl = (url: string, blob: Blob) => {
  try {
    if (!url || !blob) return;
    blobRegistry.set(url, blob);
    while (blobRegistry.size > REGISTRY_LIMIT) {
      const oldest = blobRegistry.keys().next();
      if (oldest.done) break;
      blobRegistry.delete(oldest.value);
    }
  } catch {
    /* ignore */
  }
};

export const forgetBlobUrl = (url: string) => {
  try {
    blobRegistry.delete(url);
  } catch {
    /* ignore */
  }
};

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const comma = dataUrl.indexOf(',');
  const meta = comma >= 0 ? dataUrl.slice(0, comma) : '';
  const body = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const isBase64 = /;base64$/i.test(meta);
  const mime = (meta.match(/^data:([^;,]+)/i) || [])[1] || 'application/octet-stream';

  if (!isBase64) {
    return new Blob([decodeURIComponent(body)], { type: mime });
  }
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

/** Resolve a `blob:`/`data:` URL to a Blob, using the registry first. */
export const resolveBlobFromUrl = async (url: string): Promise<Blob> => {
  const remembered = blobRegistry.get(url);
  if (remembered) return remembered;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not read the file (${response.status})`);
  return response.blob();
};

// ── Web (browser) delivery ───────────────────────────────────────────────────

export const triggerWebDownload = (blob: Blob, filename: string): string | undefined => {
  try {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = sanitizeFilename(filename);
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    // Revoke late enough for the browser to have picked the download up.
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* ignore */
      }
    }, 60_000);
    return url;
  } catch (err) {
    console.warn('[Export] Browser download failed:', err);
    return undefined;
  }
};

const webShareFile = async (blob: Blob, filename: string, title?: string): Promise<'shared' | 'cancelled' | 'unavailable'> => {
  try {
    const nav = navigator as any;
    if (typeof nav?.share !== 'function' || typeof File !== 'function') return 'unavailable';
    const file = new File([blob], sanitizeFilename(filename), { type: blob.type || 'application/octet-stream' });
    if (typeof nav.canShare === 'function' && !nav.canShare({ files: [file] })) return 'unavailable';
    await nav.share({ files: [file], title: title || filename });
    return 'shared';
  } catch (err: any) {
    const message = String(err?.message || err || '');
    if (/abort|cancel/i.test(message)) return 'cancelled';
    return 'unavailable';
  }
};

// ── Native (Capacitor) delivery ──────────────────────────────────────────────

type DirectoryEnum = Record<string, string>;

const loadFilesystem = async (): Promise<{ Filesystem: any; Directory: DirectoryEnum } | null> => {
  try {
    const mod: any = await import('@capacitor/filesystem');
    const Filesystem = mod?.Filesystem || mod?.default?.Filesystem;
    const Directory = mod?.Directory || mod?.default?.Directory;
    if (!Filesystem || typeof Filesystem.writeFile !== 'function' || !Directory) return null;
    return { Filesystem, Directory };
  } catch (err) {
    console.warn('[Export] @capacitor/filesystem unavailable:', err);
    return null;
  }
};

const loadShare = async (): Promise<any | null> => {
  try {
    const mod: any = await import('@capacitor/share');
    return mod?.Share || mod?.default?.Share || null;
  } catch (err) {
    console.warn('[Export] @capacitor/share unavailable:', err);
    return null;
  }
};

/**
 * Directory preference order. Public Documents first (visible in the Files app),
 * then the app's own external folder and finally the cache — both of which are
 * covered by the generated project's FileProvider paths, so they can still be
 * shared even though they are app-private.
 */
const directoryPlan = (Directory: DirectoryEnum): Array<{ dir: string; label: string }> => {
  const isAndroid = getPlatform() === 'android';
  if (isAndroid) {
    return [
      { dir: Directory.Documents, label: `Documents/${EXPORT_FOLDER}` },
      { dir: Directory.External, label: `Device storage/${EXPORT_FOLDER}` },
      { dir: Directory.Cache, label: `Temporary app storage/${EXPORT_FOLDER}` },
    ];
  }
  return [
    { dir: Directory.Documents, label: `Documents/${EXPORT_FOLDER}` },
    { dir: Directory.Library, label: `Documents/${EXPORT_FOLDER}` },
    { dir: Directory.Cache, label: `Temporary app storage/${EXPORT_FOLDER}` },
  ];
};

/**
 * Bridge messages carrying many megabytes of base64 can fail on some devices, so
 * large payloads are written in chunks. Chunks are split on 4-character
 * boundaries: base64 maps 3 bytes → 4 chars, so each piece decodes to whole bytes
 * and appending them reproduces the original file exactly.
 */
const BRIDGE_CHUNK_CHARS = 1_200_000; // ≈ 0.9 MB of binary per message

const writeBase64ToDevice = async (
  Filesystem: any,
  directory: string,
  path: string,
  base64: string
): Promise<string> => {
  if (base64.length <= BRIDGE_CHUNK_CHARS) {
    const written = await Filesystem.writeFile({ path, data: base64, directory, recursive: true });
    return written?.uri || '';
  }

  const chunkSize = Math.floor(BRIDGE_CHUNK_CHARS / 4) * 4;
  let uri = '';
  for (let offset = 0; offset < base64.length; offset += chunkSize) {
    const chunk = base64.slice(offset, offset + chunkSize);
    if (offset === 0) {
      const written = await Filesystem.writeFile({ path, data: chunk, directory, recursive: true });
      uri = written?.uri || '';
    } else {
      await Filesystem.appendFile({ path, data: chunk, directory });
    }
  }
  return uri;
};

export const saveToDevice = async (
  blob: Blob,
  filename: string,
  options: DeliverOptions = {}
): Promise<DeviceExportResult> => {
  const safeName = sanitizeFilename(filename);
  const fs = await loadFilesystem();

  if (!fs) {
    return { ok: false, method: 'none', error: 'file-plugin-unavailable' };
  }

  let base64: string;
  try {
    base64 = await blobToBase64(blob);
  } catch (err: any) {
    return { ok: false, method: 'none', error: String(err?.message || err) };
  }

  const { Filesystem, Directory } = fs;
  const path = `${EXPORT_FOLDER}/${safeName}`;
  let uri: string | undefined;
  let location: string | undefined;
  let lastError: any;

  for (const candidate of directoryPlan(Directory)) {
    try {
      const writtenUri = await writeBase64ToDevice(Filesystem, candidate.dir, path, base64);
      if (!writtenUri) throw new Error('No file URI returned');
      uri = writtenUri;
      location = candidate.label;
      break;
    } catch (err) {
      lastError = err;
      // Android 11+ denies raw writes into the public Documents folder; the next
      // candidate is app-private and always writable.
      console.warn(`[Export] writeFile failed for ${candidate.dir}:`, err);
    }
  }

  if (!uri) {
    return { ok: false, method: 'none', error: String(lastError?.message || lastError || 'Could not save the file') };
  }

  const wantsShare = options.share !== false;
  let shared = false;
  let cancelled = false;

  if (wantsShare) {
    const Share = await loadShare();
    if (Share) {
      // The share sheet is a native activity that covers the app: hide our
      // progress overlay first so the screen is immediately usable on return
      // (the confirmation arrives as a toast instead).
      dismissExport();
      try {
        const can = await Share.canShare();
        if (can?.value !== false) {
          await Share.share({
            title: options.shareTitle || safeName,
            files: [uri],
            dialogTitle: options.dialogTitle || 'Save, print or share your document',
          });
          shared = true;
        }
      } catch (err: any) {
        const message = String(err?.message || err || '');
        if (/cancel/i.test(message)) {
          cancelled = true;
        } else {
          // Sharing is a bonus — the file itself is already on the device.
          console.warn('[Export] Share sheet failed:', message);
        }
      }
    }
  }

  return {
    ok: true,
    method: shared || cancelled ? 'filesystem+share' : 'filesystem',
    uri,
    location,
    shared,
    cancelled,
  };
};

// ── Universal entry point ────────────────────────────────────────────────────

/**
 * Save a Blob to the device using whatever the current runtime supports, and
 * tell the user what happened.
 */
export const deliverFile = async (
  blob: Blob,
  filename: string,
  options: DeliverOptions = {}
): Promise<DeviceExportResult> => {
  const safeName = sanitizeFilename(filename);

  if (!blob || blob.size === 0) {
    const message = options.failureMessage === null ? '' : 'Nothing to export yet — the document is empty.';
    if (message) notify(message, 'error');
    return { ok: false, method: 'none', error: 'empty-blob' };
  }

  if (isNativeApp()) {
    const result = await saveToDevice(blob, safeName, options);

    if (result.ok) {
      const message =
        options.successMessage === null
          ? ''
          : options.successMessage ||
            (result.cancelled
              ? `${safeName} saved${result.location ? ` to ${result.location}` : ''}.`
              : `${safeName} ready — choose Print, Drive, Files or an app to send it to.`);
      if (message) notify(message, 'success');
      return result;
    }

    // Older APK builds without the file plugins: fall back to the browser path
    // (which is a silent no-op inside the WebView) and be honest about it.
    console.warn('[Export] Native save failed, falling back to browser download:', result.error);
    const uri = triggerWebDownload(blob, safeName);
    const message =
      options.failureMessage === null
        ? ''
        : 'Could not write to device storage. Update the app to the latest APK to save files directly, or use Archive to keep this document inside EduAI.';
    if (message) notify(message, 'error');
    return { ok: false, method: uri ? 'download' : 'none', uri, error: result.error };
  }

  // ── Web / mobile browser ───────────────────────────────────────────────────
  const wantsShare = options.share === true;
  const uri = triggerWebDownload(blob, safeName);

  if (wantsShare) {
    dismissExport();
    const shareResult = await webShareFile(blob, safeName, options.shareTitle);
    if (shareResult === 'shared' || shareResult === 'cancelled') {
      if (options.successMessage !== null && shareResult === 'shared') {
        notify(options.successMessage || `${safeName} downloaded.`, 'success');
      }
      return {
        ok: true,
        method: 'web-share',
        uri,
        shared: shareResult === 'shared',
        cancelled: shareResult === 'cancelled',
      };
    }
  }

  if (uri) {
    if (options.successMessage !== null) {
      notify(
        options.successMessage ||
          (isAndroidDevice()
            ? `${safeName} downloaded — open it from the notification to print or share.`
            : `${safeName} downloaded.`),
        'success'
      );
    }
    return { ok: true, method: 'download', uri };
  }

  const message = options.failureMessage === null ? '' : `Could not export ${safeName}.`;
  if (message) notify(message, 'error');
  return { ok: false, method: 'none', error: 'download-failed' };
};

export default { deliverFile, saveToDevice, notify, blobToBase64, triggerWebDownload };

