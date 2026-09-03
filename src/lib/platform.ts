// Single source of truth for "are we running inside the Capacitor native app?".
//
// Several modules used to duplicate this check (and one of them only looked at
// `window.Capacitor`, which is undefined until the bridge finishes injecting).
// Centralising it keeps native detection consistent across services.

import { Capacitor } from '@capacitor/core';

export const isNativeApp = (): boolean => {
  try {
    if (typeof Capacitor !== 'undefined' && typeof Capacitor.isNativePlatform === 'function') {
      if (Capacitor.isNativePlatform()) return true;
    }
  } catch {
    /* ignore — fall through to the global probe below */
  }

  try {
    const g = (globalThis as any)?.Capacitor;
    if (g?.isNativePlatform?.()) return true;
    if (typeof g?.getPlatform === 'function') {
      const platform = g.getPlatform();
      if (platform === 'android' || platform === 'ios') return true;
    }
  } catch {
    /* ignore */
  }

  return false;
};

export const getPlatform = (): string => {
  try {
    if (typeof Capacitor !== 'undefined' && typeof Capacitor.getPlatform === 'function') {
      return Capacitor.getPlatform();
    }
  } catch {
    /* ignore */
  }
  return 'web';
};

export const isAndroidApp = (): boolean => isNativeApp() && getPlatform() === 'android';

const userAgent = (): string => {
  try {
    return typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  } catch {
    return '';
  }
};

/**
 * True on *any* Android device — the Capacitor APK **and** Chrome / installed
 * PWA builds. Used whenever a browser capability (printing, popups) has to be
 * avoided rather than merely the native bridge detected.
 */
export const isAndroidDevice = (): boolean => /android/i.test(userAgent());

/** True when the page is hosted by a WebView (Capacitor APK, in-app browsers). */
export const isWebViewRuntime = (): boolean => isNativeApp() || /wv|WebView/i.test(userAgent());

/**
 * True when the runtime can actually honour a print request.
 *
 * Android cannot, in either flavour:
 *  • Capacitor WebView — `window.print()` is a silent no-op (printing needs the
 *    native `PrintDocumentAdapter`), and `window.open('')` resolves to
 *    `about:blank` which `Bridge.launchIntent()` hands to an external
 *    `ACTION_VIEW` intent. The result is the teacher's *browser* opening on its
 *    last page while the app is left with nothing exported.
 *  • Chrome / PWA — `window.print()` is not implemented on Chrome for Android.
 *
 * Everything below therefore routes Android exports through a real PDF file
 * (see `src/lib/nativeExport.ts`) instead of a popup print window.
 */
export const supportsSystemPrint = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (isNativeApp()) return false;
  if (isAndroidDevice()) return false;
  return true;
};

/**
 * Rough "low memory device" probe. Android WebViews cap canvas size (~16M px on
 * most handsets, 4096×4096 on older ones), so PDF rendering dials its raster
 * scale down when the device reports little RAM.
 */
export const isLowMemoryDevice = (): boolean => {
  try {
    const mem = (navigator as any)?.deviceMemory;
    if (typeof mem === 'number' && mem > 0) return mem <= 3;
  } catch {
    /* not exposed — fall back to hardwareConcurrency below */
  }
  try {
    const cores = (navigator as any)?.hardwareConcurrency;
    if (typeof cores === 'number' && cores > 0) return cores <= 4;
  } catch {
    /* ignore */
  }
  return false;
};
