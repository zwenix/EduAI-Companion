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
