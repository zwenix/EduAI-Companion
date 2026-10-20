import React, { useState } from 'react';
import { buildApiUrl, resetImageProviderHealth } from '../lib/imageGeneration';
import { generatePerchanceImageClient, PERCHANCE_GENERATOR_PAGE } from '../services/perchanceService';

type Row = { id: string; label: string; state: 'idle' | 'running' | 'ok' | 'fail'; message?: string; ms?: number; thumb?: string };

const TEST_PROMPT = 'a friendly red apple on a white background, simple educational illustration';

const INITIAL: Row[] = [
  { id: 'perchance', label: 'Perchance AI Images Generator', state: 'idle' },
  { id: 'cloudflare', label: 'Cloudflare FLUX.1-schnell', state: 'idle' },
  { id: 'huggingface', label: 'Hugging Face FLUX.1-schnell', state: 'idle' },
];

async function testFlux(provider: 'cloudflare' | 'huggingface'): Promise<{ thumb?: string; error?: string }> {
  try {
    const res = await fetch(buildApiUrl('/api/images/flux-generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: TEST_PROMPT, provider, width: 512, height: 512 }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { error: `HTTP ${res.status}: ${data?.error || 'request failed'}` };
    return { thumb: data?.url || data?.imageUrl };
  } catch (err: any) {
    return { error: `Could not reach the server route: ${err?.message || err}` };
  }
}

/**
 * Lets a teacher see WHY an image engine is failing (the console only shows
 * this as a quiet warning). Runs one tiny test image through each engine.
 */
export default function ImageEngineTest() {
  const [rows, setRows] = useState<Row[]>(INITIAL);
  const [busy, setBusy] = useState(false);

  const patch = (id: string, next: Partial<Row>) => setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...next } : r)));

  const run = async () => {
    setBusy(true);
    resetImageProviderHealth();
    setRows(INITIAL.map((r) => ({ ...r, state: 'running' as const })));

    const timed = async (id: string, job: () => Promise<{ thumb?: string; error?: string }>) => {
      const t0 = Date.now();
      const out = await job();
      patch(id, { state: out.error ? 'fail' : 'ok', message: out.error, thumb: out.thumb, ms: Date.now() - t0 });
    };

    await Promise.all([
      timed('perchance', async () => {
        try {
          return { thumb: await generatePerchanceImageClient(TEST_PROMPT, 512, 512, undefined, 45000) };
        } catch (err: any) {
          return {
            error: `${err?.message || err}. If the browser console says "X-Frame-Options" or nothing comes back, Perchance is blocking embedding on this network/browser.`,
          };
        }
      }),
      timed('cloudflare', () => testFlux('cloudflare')),
      timed('huggingface', () => testFlux('huggingface')),
    ]);
    setBusy(false);
  };

  return (
    <div className="mt-5 p-4 rounded-2xl border border-white/10 bg-navy-dark/40 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h5 className="text-white font-bold text-xs">Test image engines</h5>
          <p className="text-[10px] text-slate-400 mt-0.5">Generates one small test image per engine and shows the exact error if it fails.</p>
        </div>
        <div className="flex gap-2">
          <a
            href={PERCHANCE_GENERATOR_PAGE}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-bold text-slate-300 hover:border-white/30"
          >
            Open Perchance generator ↗
          </a>
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-[10px] font-black text-orange-300 disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Testing…' : 'Run test'}
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start gap-3 text-[11px]">
            <span className="w-4 shrink-0 text-center">
              {r.state === 'ok' ? '✅' : r.state === 'fail' ? '❌' : r.state === 'running' ? '⏳' : '○'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold">
                {r.label}
                {typeof r.ms === 'number' && <span className="ml-2 text-slate-500 font-normal">{(r.ms / 1000).toFixed(1)}s</span>}
              </div>
              {r.message && <div className="text-red-300/90 break-words">{r.message}</div>}
              {r.state === 'ok' && <div className="text-emerald-300/90">Working</div>}
            </div>
            {r.thumb && <img src={r.thumb} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/10" referrerPolicy="no-referrer" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
