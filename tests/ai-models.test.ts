/**
 * Frozen AI model registry — regression guard.
 *
 * The last block in this file PARSES the FROZEN table in `AGENTS.md` §1 and
 * asserts it against `src/lib/aiModels.ts` value for value, so the binding
 * document and the code can never drift apart. If someone re-maps, aliases,
 * upgrades or downgrades a model — in either place — this suite fails CI before
 * the change can ship. Update AGENTS.md and the registry together, deliberately.
 *
 * Contract as of 24 Nov 2026: NVIDIA Nemotron 3 Ultra is the PRIMARY reasoning
 * engine, DeepSeek V4.1 Flash is SECONDARY, Gemini is TERTIARY and Nemotron 3.5
 * Lightning is the last engine. Qwen / Alibaba Model Studio is removed, and the
 * vision chain is Nemotron 3.5 Super VL → Gemini → Llama 3.2 90B Vision →
 * OCR.space.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AI_PROVIDERS,
  AI_PROVIDER_LABELS,
  GEMINI_MODEL_CHAIN,
  GEMINI_PRIMARY_MODEL,
  LEGACY_PROVIDER_IDS,
  NEMOTRON_PROVIDERS,
  NVIDIA_BASE_URL,
  NVIDIA_MODELS,
  OCR_PROVIDER_LABELS,
  PRIMARY_REASONING_PROVIDER,
  PRIMARY_VISION_PROVIDER,
  REASONING_CHAIN,
  VISION_PROVIDERS,
  VISION_PROVIDER_CHAIN,
  isLegacyProvider,
  isNemotronProvider,
  isNvidiaNimProvider,
  isVisionProvider,
  reasoningFallbacksFor,
  resolveProviderModel,
  visionFallbacksFor,
} from '../src/lib/aiModels';

describe('frozen provider list (AGENTS.md §1)', () => {
  it('exposes exactly the five permitted provider ids, in priority order', () => {
    expect([...AI_PROVIDERS]).toEqual([
      'nvidia-nemotron-ultra',
      'nvidia-deepseek',
      'gemini',
      'nvidia-nemotron-lightning',
      'nvidia-nemotron-nano',
    ]);
  });

  it('gives every permitted provider a UI label', () => {
    for (const id of AI_PROVIDERS) {
      expect(AI_PROVIDER_LABELS[id]).toBeTruthy();
    }
  });

  it('no longer contains any Qwen / Alibaba engine', () => {
    const banned = /qwen|alibaba|aliyuncs/i;
    for (const id of AI_PROVIDERS) {
      expect(id).not.toMatch(banned);
    }
    for (const slug of Object.values(NVIDIA_MODELS)) {
      expect(slug).not.toMatch(banned);
    }
    // The retired ids exist only as aliases and must never be selectable.
    for (const legacy of LEGACY_PROVIDER_IDS) {
      expect(AI_PROVIDERS as readonly string[]).not.toContain(legacy);
    }
  });

  it('does not resurrect the removed Groq / OpenRouter engines', () => {
    for (const id of AI_PROVIDERS) {
      expect(id).not.toMatch(/groq|openrouter/i);
    }
  });
});

describe('reasoning chain (primary → fallbacks)', () => {
  it('is Nemotron 3 Ultra → DeepSeek V4.1 Flash → Gemini → Nemotron 3.5 Lightning', () => {
    expect([...REASONING_CHAIN]).toEqual([
      'nvidia-nemotron-ultra',
      'nvidia-deepseek',
      'gemini',
      'nvidia-nemotron-lightning',
    ]);
    expect(PRIMARY_REASONING_PROVIDER).toBe('nvidia-nemotron-ultra');
    expect(REASONING_CHAIN[0]).toBe(PRIMARY_REASONING_PROVIDER);
  });

  it('gives the primary engine the exact secondary/tertiary/last order', () => {
    expect(reasoningFallbacksFor('nvidia-nemotron-ultra')).toEqual([
      'nvidia-deepseek',
      'gemini',
      'nvidia-nemotron-lightning',
    ]);
  });

  it('wraps around so every engine still has a fallback', () => {
    expect(reasoningFallbacksFor('nvidia-deepseek')).toEqual([
      'gemini',
      'nvidia-nemotron-lightning',
      'nvidia-nemotron-ultra',
    ]);
    expect(reasoningFallbacksFor('gemini')[0]).toBe('nvidia-nemotron-lightning');
    expect(reasoningFallbacksFor('nvidia-nemotron-lightning')).toContain('nvidia-nemotron-ultra');
  });

  it('never returns the provider itself, and covers the whole chain overall', () => {
    for (const id of REASONING_CHAIN) {
      const fallbacks = reasoningFallbacksFor(id);
      expect(fallbacks).not.toContain(id);
      expect(new Set(fallbacks).size).toBe(fallbacks.length);
      for (const other of REASONING_CHAIN) {
        if (other === id) continue;
        expect(fallbacks).toContain(other);
      }
    }
  });

  it('falls back to the whole chain for an engine outside it', () => {
    expect(reasoningFallbacksFor('nvidia-nemotron-nano')).toEqual([...REASONING_CHAIN]);
    expect(reasoningFallbacksFor('not-a-provider')).toEqual([...REASONING_CHAIN]);
  });
});

describe('Gemini (tertiary engine + vision)', () => {
  it('uses gemini-3.8-flash as its model', () => {
    expect(GEMINI_PRIMARY_MODEL).toBe('gemini-3.8-flash');
    expect(GEMINI_MODEL_CHAIN[0]).toBe('gemini-3.8-flash');
  });

  it('keeps the exact fallback chain order', () => {
    expect([...GEMINI_MODEL_CHAIN]).toEqual([
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
    ]);
  });

  it('never uses a banned outdated default', () => {
    expect(GEMINI_PRIMARY_MODEL).not.toMatch(/gemini-(1\.5|2\.0|2\.1)/);
  });

  it('resolves the gemini provider id to the primary model', () => {
    expect(resolveProviderModel('gemini')).toBe('gemini-3.8-flash');
    expect(isNvidiaNimProvider('gemini')).toBe(false);
  });
});

describe('NVIDIA NIM (Nemotron + DeepSeek)', () => {
  it('routes every Nemotron id to the exact NIM slug', () => {
    expect(NVIDIA_MODELS['nvidia-nemotron-ultra']).toBe('nvidia/nemotron-ultra-550b-a55b');
    expect(NVIDIA_MODELS['nvidia-nemotron-lightning']).toBe(
      'nvidia/nemotron-3.5-lightning-30b-a3b',
    );
    expect(NVIDIA_MODELS['nvidia-nemotron-nano']).toBe(
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    );
  });

  it('serves DeepSeek V4.1 Flash from NVIDIA NIM in the old Qwen slot', () => {
    expect(NVIDIA_MODELS['nvidia-deepseek']).toBe('nvidia/deepseek-v4.1-flash');
    expect(resolveProviderModel('nvidia-deepseek')).toBe('nvidia/deepseek-v4.1-flash');
  });

  it('always uses the free NVIDIA NIM endpoint — never Groq/OpenRouter/Alibaba', () => {
    expect(NVIDIA_BASE_URL).toBe('https://integrate.api.nvidia.com/v1');
    expect(NVIDIA_BASE_URL).not.toMatch(/groq|openrouter|aliyuncs|alibaba/i);
  });

  it('identifies NIM providers and resolves their slugs', () => {
    for (const id of NEMOTRON_PROVIDERS) {
      expect(isNemotronProvider(id)).toBe(true);
      expect(isNvidiaNimProvider(id)).toBe(true);
      expect(resolveProviderModel(id)).toBe(NVIDIA_MODELS[id]);
    }
    expect(isNvidiaNimProvider('nvidia-deepseek')).toBe(true);
    expect(isNemotronProvider('nvidia-deepseek')).toBe(false);
  });
});

describe('vision / OCR chain', () => {
  it('is Nemotron 3.5 Super VL → Gemini → Llama 3.2 90B Vision → OCR.space', () => {
    expect([...VISION_PROVIDER_CHAIN]).toEqual([
      'nvidia-nemotron-vl',
      'gemini',
      'nvidia-llama-vision',
      'ocrspace',
    ]);
    expect(PRIMARY_VISION_PROVIDER).toBe('nvidia-nemotron-vl');
  });

  it('registers the exact NVIDIA NIM vision slugs', () => {
    expect(NVIDIA_MODELS['nvidia-nemotron-vl']).toBe('nvidia/nemotron-3.5-super-vl-120b-a12b');
    expect(NVIDIA_MODELS['nvidia-llama-vision']).toBe('meta/llama-3.2-90b-vision-instruct');
    for (const id of VISION_PROVIDERS) {
      expect(isVisionProvider(id)).toBe(true);
      expect(isNvidiaNimProvider(id)).toBe(true);
    }
  });

  it('labels every vision engine for the picker', () => {
    for (const id of VISION_PROVIDER_CHAIN) {
      expect(OCR_PROVIDER_LABELS[id]).toBeTruthy();
    }
  });

  it('orders the fallbacks for the primary vision engine', () => {
    expect(visionFallbacksFor('nvidia-nemotron-vl')).toEqual([
      'gemini',
      'nvidia-llama-vision',
      'ocrspace',
    ]);
    expect(visionFallbacksFor('ocrspace')[0]).toBe('nvidia-nemotron-vl');
  });

  it('never offers the removed Qwen image engine as a vision engine', () => {
    expect(VISION_PROVIDER_CHAIN as readonly string[]).not.toContain('qwen');
  });
});

describe('legacy provider ids', () => {
  it('are recognised but resolve to the DeepSeek engine (never resurrected)', () => {
    for (const id of LEGACY_PROVIDER_IDS) {
      expect(isLegacyProvider(id)).toBe(true);
      expect(resolveProviderModel(id)).toBe('nvidia/deepseek-v4.1-flash');
    }
  });

  it('do not appear in the selectable provider list', () => {
    for (const id of LEGACY_PROVIDER_IDS) {
      expect(AI_PROVIDERS as readonly string[]).not.toContain(id);
      expect(REASONING_CHAIN as readonly string[]).not.toContain(id);
    }
  });

  it('include the removed Qwen ids', () => {
    expect(LEGACY_PROVIDER_IDS as readonly string[]).toContain('alibaba-qwen');
    expect(LEGACY_PROVIDER_IDS as readonly string[]).toContain('groq-qwen');
  });
});

describe('unknown providers', () => {
  it('resolve to an empty slug so callers fail deliberately', () => {
    expect(resolveProviderModel('not-a-provider')).toBe('');
    expect(resolveProviderModel('')).toBe('');
  });
});

/**
 * AGENTS.md §1 is the binding document for the frozen model list; this block
 * exists so the promise made there ("tests/ai-models.test.ts asserts every value
 * in this section against src/lib/aiModels.ts") is enforced by CI rather than
 * trusted.
 */
describe('AGENTS.md parity (the binding document)', () => {
  const agentsMd = readFileSync(resolve(__dirname, '..', 'AGENTS.md'), 'utf8');

  /** Rows of the "The ONLY allowed models" table, keyed by provider id. */
  const frozenRows = (() => {
    const start = agentsMd.indexOf('### The ONLY allowed models');
    expect(start, 'AGENTS.md §1 frozen model table not found').toBeGreaterThan(-1);
    const end = agentsMd.indexOf('### ', start + 1);
    const section = agentsMd.slice(start, end === -1 ? undefined : end);

    const rows = new Map<string, { modelCell: string; endpointCell: string }>();
    for (const line of section.split(/\r?\n/)) {
      const cells = line.split('|');
      if (cells.length < 5) continue;
      // cells[0] is empty (leading pipe); the id column is cells[1].
      const id = cells[1].match(/`([^`]+)`/)?.[1];
      if (!id) continue;
      rows.set(id, { modelCell: cells[2], endpointCell: cells[3] });
    }
    return rows;
  })();

  it('documents exactly the five frozen providers — no more, no fewer', () => {
    expect([...frozenRows.keys()].sort()).toEqual([...AI_PROVIDERS].sort());
  });

  it('names src/lib/aiModels.ts as the single source of truth', () => {
    expect(agentsMd).toContain('src/lib/aiModels.ts');
  });

  it('publishes the same model slug as the registry, for every provider', () => {
    for (const id of AI_PROVIDERS) {
      const row = frozenRows.get(id);
      expect(row, `no AGENTS.md row for ${id}`).toBeTruthy();
      const documented = row!.modelCell.match(/`([^`]+)`/)?.[1];
      expect(documented, `model cell for ${id} must contain a backticked slug`).toBeTruthy();
      expect(documented, `AGENTS.md vs registry drift for ${id}`).toBe(resolveProviderModel(id));
    }
  });

  it('documents the Gemini fallback chain in the exact registry order', () => {
    const row = frozenRows.get('gemini')!;
    let cursor = -1;
    for (const model of GEMINI_MODEL_CHAIN) {
      const at = row.modelCell.indexOf(model, cursor + 1);
      expect(at, `${model} must appear after the previous chain member`).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  it('pins every Nemotron row to the free NVIDIA NIM endpoint', () => {
    for (const id of NEMOTRON_PROVIDERS) {
      const row = frozenRows.get(id)!;
      expect(row.endpointCell).toContain(NVIDIA_BASE_URL);
      expect(row.endpointCell).toMatch(/NVIDIA_API_KEY/);
      expect(row.endpointCell).not.toMatch(/groq|openrouter/i);
    }
  });

  it('documents the reasoning priority chain and the vision chain', () => {
    expect(agentsMd).toMatch(/reasoning fallback chain/i);
    expect(agentsMd).toMatch(/Vision \/ OCR chain/i);
    for (const id of REASONING_CHAIN) {
      expect(agentsMd, `AGENTS.md must document ${id}`).toContain(id);
    }
    for (const id of VISION_PROVIDER_CHAIN) {
      expect(agentsMd, `AGENTS.md must document ${id}`).toContain(id);
    }
    expect(agentsMd).toContain('nvidia/nemotron-3.5-super-vl-120b-a12b');
    expect(agentsMd).toContain('meta/llama-3.2-90b-vision-instruct');
  });

  it('records that Qwen is removed and its credential is gone', () => {
    expect(agentsMd).toMatch(/Alibaba Qwen is REMOVED/i);
    expect(agentsMd).toMatch(/ALIBABA_API_KEY/);
    expect(agentsMd).toMatch(/nvidia\/deepseek-v4\.1-flash/);
  });

  it('keeps the banned-provider and legacy-alias rules written down', () => {
    expect(agentsMd).toMatch(/Groq and OpenRouter are banned/i);
    for (const legacy of LEGACY_PROVIDER_IDS) {
      expect(agentsMd, `AGENTS.md must document the retired id ${legacy}`).toContain(legacy);
    }
  });

  it('documents the CI gate and the guardrails that protect these rules', () => {
    expect(agentsMd).toMatch(/npm run ci/);
    expect(agentsMd).toMatch(/scripts\/scan-secrets\.mjs/);
    expect(agentsMd).toMatch(/scripts\/deploy-firestore-rules\.sh/);
    expect(agentsMd).toMatch(/RATE_LIMIT_DISABLED/);
  });
});
