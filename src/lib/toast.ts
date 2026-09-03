// Tiny cross-module toast channel.
//
// Library-level code (export pipeline, Android download bridge, safety net) has
// no access to React state, so user-facing messages are dispatched as a window
// event; `App.tsx` listens for `TOAST_EVENT` and renders them with the app's
// normal toast. Kept in its own module so `nativeExport` and `exportProgress`
// can both use it without importing each other.

export type ToastType = 'success' | 'info' | 'error';

export const TOAST_EVENT = 'eduai-toast';

export const notify = (message: string, type: ToastType = 'info') => {
  try {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type } }));
  } catch {
    /* no window (SSR / tests) — ignore */
  }
  try {
    console.info(`[EduAI:${type}] ${message}`);
  } catch {
    /* ignore */
  }
};

export default notify;
