// Global "document export" progress bus.
//
// PDF/HTML exports used to run with no user feedback at all. On Android that
// meant a long html2canvas pass looked exactly like a frozen app — no spinner,
// no cancel, no way out — while the hardware back button (handled in JS) could
// not run either because the main thread was busy.
//
// Every export path now announces itself through this tiny event bus so a single
// global dialog (`src/components/ExportProgressDialog.tsx`) can show progress,
// expose a Cancel button, and never leave the UI trapped.

import { notify } from './toast';

export const EXPORT_PROGRESS_EVENT = 'eduai-export-progress';

export type ExportState = 'start' | 'progress' | 'done' | 'error' | 'dismiss';

export interface ExportProgressDetail {
  state: ExportState;
  /** Short headline, e.g. "Exporting lesson plan" */
  label?: string;
  /** Longer status line, e.g. "Rendering page 3 of 9…" */
  detail?: string;
  /** 0–100 when known */
  percent?: number;
  /** Message shown on completion / failure */
  result?: string;
  /** Whether the Cancel button should be offered */
  cancellable?: boolean;
}

const emit = (detail: ExportProgressDetail) => {
  try {
    window.dispatchEvent(new CustomEvent<ExportProgressDetail>(EXPORT_PROGRESS_EVENT, { detail }));
  } catch {
    /* no window (SSR) — nothing to notify */
  }
};

/** Thrown by the paginated renderer when the user presses Cancel. */
export class ExportCancelledError extends Error {
  constructor(message = 'Export cancelled') {
    super(message);
    this.name = 'ExportCancelledError';
  }
}

let active = false;
let cancelled = false;
/** Set once the user dismisses/cancels a session so late events stay silent. */
let muted = false;
/**
 * Set when the overlay is hidden while the export is still running — typically
 * because the OS share sheet took over the screen. The completion message then
 * goes to a toast instead of re-showing the overlay.
 */
let dismissedEarly = false;

export const beginExport = (label: string, detail?: string) => {
  active = true;
  cancelled = false;
  muted = false;
  dismissedEarly = false;
  emit({ state: 'start', label, detail, cancellable: true });
};

export const updateExport = (detail: string, percent?: number) => {
  if (!active || muted) return;
  emit({ state: 'progress', detail, percent });
};

export const finishExport = (result?: string) => {
  active = false;
  if (muted) return;
  if (dismissedEarly) {
    dismissedEarly = false;
    if (result) notify(result, 'success');
    return;
  }
  emit({ state: 'done', result });
};

export const failExport = (result: string) => {
  active = false;
  if (muted) return;
  if (dismissedEarly) {
    dismissedEarly = false;
    notify(result, 'error');
    return;
  }
  emit({ state: 'error', result });
};

/**
 * Called by the dialog's Cancel button (and by the Android back button). Always
 * hides the overlay immediately — the user is never trapped by an export — and
 * asks cooperative renderers to stop at their next page boundary.
 */
export const requestExportCancel = () => {
  cancelled = true;
  muted = true;
  active = false;
  dismissedEarly = false;
  emit({ state: 'dismiss' });
};

export const dismissExport = () => {
  if (active) dismissedEarly = true;
  active = false;
  emit({ state: 'dismiss' });
};

export const isExportActive = () => active;
export const isExportCancelled = () => cancelled;

/** Convenience guard for long-running render loops. */
export const throwIfExportCancelled = () => {
  if (cancelled) throw new ExportCancelledError();
};
