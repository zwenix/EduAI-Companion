/**
 * Frozen AI model registry — regression guard.
 *
 * The last block in this file PARSES the FROZEN table in `AGENTS.md` §1 and
 * asserts it against `src/lib/aiModels.ts` value for value, so the binding
 * document and the code can never drift apart. If someone re-maps, aliases,
 * upgrades or downgrades a model — in either place — this suite fails CI before
 * the change can ship. Update AGENTS.md and the registry together, deliberately.
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
  QWEN_BASE_URL,
  QWEN_DEFAULT_MODEL,
  alternativeProviderFor,
  isLegacyProvider,
  isNemotronProvider,
  resolveProviderModel,
} from '../src/lib/aiModels';

describe('frozen provider list (AGENTS.md §1)', () => {
  it('exposes exactly the five permitted provider ids, in order', () => {
    expect([...AI_PROVIDERS]).toEqual([
      'gemini',
      'alibaba-qwen',
      'nvidia-nemotron-nano',
      'nvidia-nemotron-ultra',
      'nvidia-nemotron-lightning',
    ]);
  });

  it('gives every permitted provider a UI label', () => {
    for (const id of AI_PROVIDERS) {
      expect(AI_PROVIDER_LABELS[id]).toBeTruthy();
    }
  });

  it('does not contain banned / retired engines', () => {
    const banned = /llama|groq|openrouter|deepseek|gpt-|claude/i;
    for (const id of AI_PROVIDERS) {
      expect(id).not.toMatch(banned);
    }
    for (const slug of Object.values(NVIDIA_MODELS)) {
      expect(slug).not.toMatch(banned);
    }
  });
});

describe('Gemini', () => {
  it('uses gemini-3.8-flash as the primary model', () => {
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

  it('never uses a banned outdated default as the primary', () => {
    expect(GEMINI_PRIMARY_MODEL).not.toMatch(/gemini-(1\.5|2\.0|2\.1)/);
  });

  it('resolves the gemini provider id to the primary model', () => {
    expect(resolveProviderModel('gemini')).toBe('gemini-3.8-flash');
  });
});

describe('Alibaba Model Studio (Qwen 3.8)', () => {
  it('calls qwen3.8-max on the workspace-compatible endpoint', () => {
    expect(QWEN_DEFAULT_MODEL).toBe('qwen3.8-max');
    expect(resolveProviderModel('alibaba-qwen')).toBe('qwen3.8-max');
    expect(QWEN_BASE_URL).toMatch(/^https:\/\/.+\/compatible-mode\/v1$/);
  });
});

describe('NVIDIA NIM (Nemotron)', () => {
  it('routes all three Nemotron ids to the exact NIM slugs', () => {
    expect(NVIDIA_MODELS['nvidia-nemotron-nano']).toBe(
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    );
    expect(NVIDIA_MODELS['nvidia-nemotron-ultra']).toBe('nvidia/nemotron-ultra-550b-a55b');
    expect(NVIDIA_MODELS['nvidia-nemotron-lightning']).toBe(
      'nvidia/nemotron-3.5-lightning-30b-a3b',
    );
  });

  it('always uses the free NVIDIA NIM endpoint — never Groq/OpenRouter/Alibaba', () => {
    expect(NVIDIA_BASE_URL).toBe('https://integrate.api.nvidia.com/v1');
    expect(NVIDIA_BASE_URL).not.toMatch(/groq|openrouter|aliyuncs/i);
  });

  it('identifies Nemotron providers and resolves their slugs', () => {
    for (const id of NEMOTRON_PROVIDERS) {
      expect(isNemotronProvider(id)).toBe(true);
      expect(resolveProviderModel(id)).toBe(NVIDIA_MODELS[id]);
    }
    expect(isNemotronProvider('alibaba-qwen')).toBe(false);
    expect(isNemotronProvider('gemini')).toBe(false);
  });
});

describe('legacy provider ids', () => {
  it('are recognised but resolve to the Qwen engine (never resurrected)', () => {
    for (const id of LEGACY_PROVIDER_IDS) {
      expect(isLegacyProvider(id)).toBe(true);
      expect(resolveProviderModel(id)).toBe('qwen3.8-max');
    }
  });

  it('do not appear in the selectable provider list', () => {
    for (const id of LEGACY_PROVIDER_IDS) {
      expect(AI_PROVIDERS as readonly string[]).not.toContain(id);
    }
  });
});

describe('unknown providers', () => {
  it('resolve to an empty slug so callers fail deliberately', () => {
    expect(resolveProviderModel('not-a-provider')).toBe('');
    expect(resolveProviderModel('')).toBe('');
  });

  it('have no sibling fallback engine', () => {
    expect(alternativeProviderFor('not-a-provider')).toBe('');
  });
});

describe('alternative-engine fallback graph', () => {
  it('tries a different engine before spending the Gemini budget', () => {
    expect(alternativeProviderFor('nvidia-nemotron-ultra')).toBe('nvidia-nemotron-lightning');
    expect(alternativeProviderFor('nvidia-nemotron-lightning')).toBe('nvidia-nemotron-nano');
    expect(alternativeProviderFor('nvidia-nemotron-nano')).toBe('alibaba-qwen');
    expect(alternativeProviderFor('alibaba-qwen')).toBe('nvidia-nemotron-lightning');
  });

  it('never returns the provider itself or Gemini', () => {
    for (const id of AI_PROVIDERS) {
      const sibling = alternativeProviderFor(id);
      expect(sibling).not.toBe(id);
      expect(sibling).not.toBe('gemini');
    }
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

  it('pins the Qwen row to Model Studio with its workspace endpoint and key', () => {
    const row = frozenRows.get('alibaba-qwen')!;
    expect(row.modelCell).toContain(QWEN_DEFAULT_MODEL);
    expect(row.endpointCell).toContain(QWEN_BASE_URL);
    expect(row.endpointCell).toContain('ALIBABA_API_KEY');
  });

  it('keeps the banned-provider and legacy-alias rules written down', () => {
    expect(agentsMd).toMatch(/Llama-family models are REMOVED/i);
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
