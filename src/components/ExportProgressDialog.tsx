import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileDown, Loader2, X } from 'lucide-react';
import {
  EXPORT_PROGRESS_EVENT,
  ExportProgressDetail,
  requestExportCancel,
} from '../lib/exportProgress';

/**
 * Global export overlay.
 *
 * One dialog serves every export path in the app (Content Studio, Print Preview,
 * Archive, Progress Reports, Student Notes…). It exists for two reasons:
 *   1. feedback — a multi-page PDF render takes seconds on a phone, and without
 *      a spinner the app looks hung;
 *   2. an escape hatch — Cancel always hides this overlay and asks cooperative
 *      renderers to stop at the next page, so a teacher can never be trapped on
 *      the generated-content screen by a stuck export.
 */
export default function ExportProgressDialog() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'working' | 'done' | 'error'>('working');
  const [label, setLabel] = useState('Preparing your document');
  const [detail, setDetail] = useState<string>('');
  const [percent, setPercent] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number>(0);
  const hideTimer = useRef<number | null>(null);
  const watchdog = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (watchdog.current) {
      window.clearInterval(watchdog.current);
      watchdog.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearTimers();
    setVisible(false);
    setPercent(null);
    setDetail('');
    setElapsed(0);
  }, [clearTimers]);

  useEffect(() => {
    const onProgress = (event: Event) => {
      const payload = (event as CustomEvent<ExportProgressDetail>).detail;
      if (!payload) return;

      switch (payload.state) {
        case 'start':
          clearTimers();
          startedAt.current = Date.now();
          setStatus('working');
          setLabel(payload.label || 'Preparing your document');
          setDetail(payload.detail || '');
          setPercent(typeof payload.percent === 'number' ? payload.percent : null);
          setElapsed(0);
          setVisible(true);
          watchdog.current = window.setInterval(() => {
            setElapsed(Math.round((Date.now() - startedAt.current) / 1000));
          }, 1000);
          break;

        case 'progress':
          if (payload.detail) setDetail(payload.detail);
          if (typeof payload.percent === 'number') setPercent(Math.max(0, Math.min(100, payload.percent)));
          break;

        case 'done':
          clearTimers();
          setStatus('done');
          setDetail(payload.result || 'Saved to your device.');
          setPercent(100);
          hideTimer.current = window.setTimeout(() => setVisible(false), 4200);
          break;

        case 'error':
          clearTimers();
          setStatus('error');
          setDetail(payload.result || 'Export failed.');
          setPercent(null);
          hideTimer.current = window.setTimeout(() => setVisible(false), 8000);
          break;

        case 'dismiss':
        default:
          close();
          break;
      }
    };

    window.addEventListener(EXPORT_PROGRESS_EVENT, onProgress as EventListener);
    return () => {
      window.removeEventListener(EXPORT_PROGRESS_EVENT, onProgress as EventListener);
      clearTimers();
    };
  }, [clearTimers, close]);

  // Hard safety net: never keep the screen covered forever, even if an export
  // promise is abandoned by a crashed renderer.
  useEffect(() => {
    if (!visible || status !== 'working') return;
    const guard = window.setTimeout(() => {
      setVisible(false);
      clearTimers();
    }, 4 * 60 * 1000);
    return () => window.clearTimeout(guard);
  }, [visible, status, clearTimers]);

  if (!visible) return null;

  const handleCancel = () => {
    requestExportCancel();
    close();
  };

  const showBar = status === 'working' && typeof percent === 'number';

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0b1226]/95 p-6 shadow-2xl shadow-black/60 text-left">
        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border ${
              status === 'done'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                : status === 'error'
                  ? 'bg-rose-500/15 border-rose-400/40 text-rose-300'
                  : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300'
            }`}
          >
            {status === 'done' ? (
              <CheckCircle2 size={22} />
            ) : status === 'error' ? (
              <AlertTriangle size={22} />
            ) : (
              <Loader2 size={22} className="animate-spin" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
              <FileDown size={11} />
              {status === 'working' ? 'Exporting' : status === 'done' ? 'Export complete' : 'Export problem'}
            </p>
            <h3 className="text-base font-black text-white leading-tight mt-1 break-words">{label}</h3>
            {detail && (
              <p className="text-xs font-semibold text-slate-400 mt-1.5 leading-relaxed break-words">{detail}</p>
            )}

            {showBar && (
              <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}

            {status === 'working' && (
              <p className="text-[10px] font-bold text-slate-500 mt-2 tabular-nums">
                {elapsed > 0 ? `${elapsed}s elapsed · ` : ''}Keep the app in the foreground
              </p>
            )}
          </div>

          {status !== 'working' && (
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="shrink-0 p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {status === 'working' && (
          <button
            type="button"
            onClick={handleCancel}
            className="mt-5 w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Stop export
          </button>
        )}
      </div>
    </div>
  );
}
