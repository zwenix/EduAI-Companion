/**
 * Frozen AI model registry — regression guard.
 *
 * The last blocks in this file PARSE the FROZEN tables in `AGENTS.md` §1 and
 * assert them against `src/lib/aiModels.ts` value for value, so the binding
 * document and the code can never drift apart. If someone re-maps, aliases,
 * upgrades or downgrades a model — in either place — this suite fails CI before
 * the change can ship. Update AGENTS.md and the registry together, deliberately.
 *
 * Roles asserted here (23 Nov 2026 owner instruction):
 *   reasoning: Nemotron 3 Ultra → DeepSeek V4.1 Flash → Gemini → Lightning
 *   vision:    Nemotron 3.5 Super VL → Llama 3.2 90B Vision → Gemini → OCR.space
 *   Qwen is REMOVED everywhere; DeepSeek V4.1 Flash takes its place.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AI_PROVIDERS,
  AI_PROVIDER_LABELS,
  DEFAULT_AI_PROVIDER,
  DEFAULT_VISION_PROVIDER,
  GEMINI_MODEL_CHAIN,
  GEMINI_PRIMARY_MODEL,
  LEGACY_PROVIDER_IDS,
  LEGACY_PROVIDER_TARGET,
  NEMOTRON_PROVIDERS,
  NIM_VISION_PROVIDERS,
  NVIDIA_BASE_URL,
  NVIDIA_MODELS,
  REASONING_CHAIN,
  VISION_CHAIN,
  VISION_PROVIDERS,
  VISION_PROVIDER_LABELS,
  alternativeProviderFor,
  fallbackChainFor,
  isLegacyProvider,
  isNemotronProvider,
  isNimProvider,
  isNimVisionProvider,
  normalizeProviderId,
  resolveProviderModel,
  visionAttemptOrder,
  visionFallbackChainFor,
} from '../src/lib/aiModels';

describe('frozen provider list (AGENTS.md §1)', () => {
  it('exposes exactly the five permitted reasoning ids, in fallback order', () => {
    expect([...AI_PROVIDERS]).toEqual([
      'nvidia-nemotron-ultra',
      'nvidia-deepseek-flash',
      'gemini',
      'nvidia-nemotron-lightning',
      'nvidia-nemotron-nano',
    ]);
  });

  it('defaults to Nemotron 3 Ultra as the primary engine', () => {
    expect(DEFAULT_AI_PROVIDER).toBe('nvidia-nemotron-ultra');
    expect(AI_PROVIDERS[0]).toBe('nvidia-nemotron-ultra');
  });

  it('gives every permitted provider a UI label', () => {
    for (const id of AI_PROVIDERS) {
      expect(AI_PROVIDER_LABELS[id]).toBeTruthy();
    }
  });

  it('no longer offers Qwen, Groq or OpenRouter as a selectable engine', () => {
    const banned = /qwen|groq|openrouter/i;
    for (const id of AI_PROVIDERS) {
      expect(id).not.toMatch(banned);
    }
  });

  it('keeps text-only engines free of vision slugs and vice versa', () => {
    for (const id of AI_PROVIDERS) {
      expect(id).not.toMatch(/vision|vl/i);
    }
    for (const id of NIM_VISION_PROVIDERS) {
      expect(AI_PROVIDERS as readonly string[]).not.toContain(id);
    }
  });
});

describe('frozen vision/OCR list', () => {
  it('exposes exactly the four permitted vision engines, primary first', () => {
    expect([...VISION_PROVIDERS]).toEqual([
      'nvidia-nemotron-super-vl',
      'nvidia-llama-vision',
      'gemini',
      'ocrspace',
    ]);
  });

  it('defaults to Nemotron 3.5 Super VL as the primary vision engine', () => {
    expect(DEFAULT_VISION_PROVIDER).toBe('nvidia-nemotron-super-vl');
    expect(VISION_PROVIDERS[0]).toBe('nvidia-nemotron-super-vl');
  });

  it('labels every vision engine', () => {
    for (const id of VISION_PROVIDERS) {
      expect(VISION_PROVIDER_LABELS[id]).toBeTruthy();
    }
  });
});

describe('Gemini', () => {
  it('uses gemini-3.8-flash as its primary model', () => {
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

describe('NVIDIA NIM — DeepSeek V4.1 Flash (replaces Qwen 3.8 Max)', () => {
  it('calls deepseek-ai/deepseek-v4.1-flash on the free NIM endpoint', () => {
    expect(NVIDIA_MODELS['nvidia-deepseek-flash']).toBe('deepseek-ai/deepseek-v4.1-flash');
    expect(resolveProviderModel('nvidia-deepseek-flash')).toBe('deepseek-ai/deepseek-v4.1-flash');
    expect(NVIDIA_BASE_URL).toBe('https://integrate.api.nvidia.com/v1');
  });

  it('has no Qwen slug, endpoint or key left anywhere in the registry', () => {
    for (const slug of Object.values(NVIDIA_MODELS)) {
      expect(slug).not.toMatch(/qwen|aliyuncs|model-?studio/i);
    }
    expect(NVIDIA_BASE_URL).not.toMatch(/groq|openrouter|aliyuncs/i);
  });

  it('migrates every retired Qwen id to the DeepSeek engine', () => {
    for (const id of LEGACY_PROVIDER_IDS) {
      expect(normalizeProviderId(id)).toBe('nvidia-deepseek-flash');
    }
    expect(normalizeProviderId('nvidia-nemotron-ultra')).toBe('nvidia-nemotron-ultra');
    expect(normalizeProviderId('not-a-provider')).toBe(DEFAULT_AI_PROVIDER);
  });
});

describe('NVIDIA NIM (Nemotron reasoning)', () => {
  it('routes every Nemotron reasoning id to its exact NIM slug', () => {
    expect(NVIDIA_MODELS['nvidia-nemotron-ultra']).toBe('nvidia/nemotron-ultra-550b-a55b');
    expect(NVIDIA_MODELS['nvidia-nemotron-lightning']).toBe(
      'nvidia/nemotron-3.5-lightning-30b-a3b',
    );
    expect(NVIDIA_MODELS['nvidia-nemotron-nano']).toBe(
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    );
  });

  it('always uses the free NVIDIA NIM endpoint — never Groq/OpenRouter/Alibaba', () => {
    expect(NVIDIA_BASE_URL).toBe('https://integrate.api.nvidia.com/v1');
  });

  it('identifies Nemotron providers and resolves their slugs', () => {
    for (const id of NEMOTRON_PROVIDERS) {
      expect(isNemotronProvider(id)).toBe(true);
      expect(isNimProvider(id)).toBe(true);
      expect(resolveProviderModel(id)).toBe(NVIDIA_MODELS[id]);
    }
    expect(isNemotronProvider('gemini')).toBe(false);
    expect(isNemotronProvider('nvidia-deepseek-flash')).toBe(false);
    expect(isNimProvider('nvidia-deepseek-flash')).toBe(true);
  });
});

describe('NVIDIA NIM (vision / OCR)', () => {
  it('routes Super VL and Llama Vision to their exact NIM slugs', () => {
    expect(NVIDIA_MODELS['nvidia-nemotron-super-vl']).toBe(
      'nvidia/nemotron-3.5-super-vl-120b-a12b',
    );
    expect(NVIDIA_MODELS['nvidia-llama-vision']).toBe('meta/llama-3.2-90b-vision-instruct');
  });

  it('flags the two NIM vision ids as vision engines', () => {
    for (const id of NIM_VISION_PROVIDERS) {
      expect(isNimVisionProvider(id)).toBe(true);
      expect(isNimProvider(id)).toBe(true);
    }
    expect(isNimVisionProvider('nvidia-nemotron-ultra')).toBe(false);
    expect(isNimVisionProvider('gemini')).toBe(false);
  });

  it('permits Llama ONLY as the vision model', () => {
    const llamaSlugs = Object.values(NVIDIA_MODELS).filter((slug) => /llama/i.test(slug));
    expect(llamaSlugs).toEqual(['meta/llama-3.2-90b-vision-instruct']);
    for (const id of AI_PROVIDERS) {
      expect(resolveProviderModel(id)).not.toMatch(/llama/i);
    }
  });
});

describe('reasoning fallback priority (the product contract)', () => {
  it('is Ultra → DeepSeek Flash → Gemini → Lightning', () => {
    expect([...REASONING_CHAIN]).toEqual([
      'nvidia-nemotron-ultra',
      'nvidia-deepseek-flash',
      'gemini',
      'nvidia-nemotron-lightning',
    ]);
  });

  it('walks the chain from the primary engine exactly as specified', () => {
    expect(fallbackChainFor('nvidia-nemotron-ultra')).toEqual([
      'nvidia-deepseek-flash',
      'gemini',
      'nvidia-nemotron-lightning',
    ]);
  });

  it('starts from the selected engine and continues down the same order', () => {
    expect(fallbackChainFor('nvidia-deepseek-flash')).toEqual([
      'gemini',
      'nvidia-nemotron-lightning',
    ]);
    expect(fallbackChainFor('gemini')).toEqual(['nvidia-nemotron-lightning']);
    expect(fallbackChainFor('nvidia-nemotron-nano')).toEqual([
      'nvidia-nemotron-ultra',
      'nvidia-deepseek-flash',
      'gemini',
      'nvidia-nemotron-lightning',
    ]);
  });

  it('gives every engine a fallback and leaves Gemini as the safety net', () => {
    for (const id of AI_PROVIDERS) {
      const chain = fallbackChainFor(id);
      expect(chain, `${id} must have at least one fallback`).not.toHaveLength(0);
      expect(chain).not.toContain(id);
      expect(new Set(chain).size).toBe(chain.length);
      // Gemini is the safety net for every engine EXCEPT Gemini itself (a
      // chain may not contain the engine it starts from).
      if (id !== 'gemini') expect(chain).toContain('gemini');
    }
    // Gemini is no longer a terminal engine, and neither is Lightning: the two
    // wrap to each other so no failure can dead-end a generation.
    expect(fallbackChainFor('gemini')).toEqual(['nvidia-nemotron-lightning']);
    expect(fallbackChainFor('nvidia-nemotron-lightning')).toEqual(['gemini']);
  });

  it('keeps the single-hop helper pointing at the next engine in the chain', () => {
    expect(alternativeProviderFor('nvidia-nemotron-ultra')).toBe('nvidia-deepseek-flash');
    expect(alternativeProviderFor('nvidia-deepseek-flash')).toBe('gemini');
    expect(alternativeProviderFor('gemini')).toBe('nvidia-nemotron-lightning');
  });
});

describe('vision fallback priority (the product contract)', () => {
  it('is Super VL → Llama Vision → Gemini → OCR.space', () => {
    expect([...VISION_CHAIN]).toEqual([
      'nvidia-nemotron-super-vl',
      'nvidia-llama-vision',
      'gemini',
    ]);
    expect(visionFallbackChainFor('nvidia-nemotron-super-vl')).toEqual([
      'nvidia-llama-vision',
      'gemini',
      'ocrspace',
    ]);
  });

  it('gives every vision engine a fallback', () => {
    for (const id of VISION_PROVIDERS) {
      expect(visionAttemptOrder(id)).toHaveLength(VISION_PROVIDERS.length);
      expect(visionAttemptOrder(id)[0]).toBe(id);
      expect(visionAttemptOrder(id)).not.toContain(undefined);
    }
  });

  it('falls back to the primary when the stored value is unknown', () => {
    expect(visionAttemptOrder('not-a-provider')[0]).toBe('nvidia-nemotron-super-vl');
    expect(visionAttemptOrder(undefined)[0]).toBe('nvidia-nemotron-super-vl');
  });
});

describe('legacy provider ids', () => {
  it('are recognised but resolve to DeepSeek V4.1 Flash (Qwen never returns)', () => {
    for (const id of LEGACY_PROVIDER_IDS) {
      expect(isLegacyProvider(id)).toBe(true);
      expect(resolveProviderModel(id)).toBe('deepseek-ai/deepseek-v4.1-flash');
    }
    expect(LEGACY_PROVIDER_TARGET).toBe('nvidia-deepseek-flash');
  });

  it('do not appear in the selectable provider list', () => {
    for (const id of LEGACY_PROVIDER_IDS) {
      expect(AI_PROVIDERS as readonly string[]).not.toContain(id);
    }
  });

  it('migrate the retired alibaba-qwen id instead of breaking saved settings', () => {
    expect(LEGACY_PROVIDER_IDS as readonly string[]).toContain('alibaba-qwen');
  });
});

describe('unknown providers', () => {
  it('resolve to an empty slug so callers fail deliberately', () => {
    expect(resolveProviderModel('not-a-provider')).toBe('');
    expect(resolveProviderModel('')).toBe('');
  });
});

/**
 * AGENTS.md §1 is the binding document for the frozen model list; these blocks
 * exist so the promise made there is enforced by CI rather than trusted.
 */
describe('AGENTS.md parity (the binding document)', () => {
  const agentsMd = readFileSync(resolve(__dirname, '..', 'AGENTS.md'), 'utf8');

  /** Rows of a "| `id` | `model` | endpoint |" table under `heading`. */
  const tableRows = (heading: string) => {
    const start = agentsMd.indexOf(heading);
    expect(start, `AGENTS.md ${heading} table not found`).toBeGreaterThan(-1);
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
  };

  const frozenRows = tableRows('### The ONLY allowed models');
  const visionRows = tableRows('### Vision / OCR');

  it('documents exactly the five frozen reasoning providers — no more, no fewer', () => {
    expect([...frozenRows.keys()].sort()).toEqual([...AI_PROVIDERS].sort());
  });

  it('documents exactly the four frozen vision engines — no more, no fewer', () => {
    expect([...visionRows.keys()].sort()).toEqual([...VISION_PROVIDERS].sort());
  });

  it('names src/lib/aiModels.ts as the single source of truth', () => {
    expect(agentsMd).toContain('src/lib/aiModels.ts');
  });

  it('publishes the same reasoning model slug as the registry, for every provider', () => {
    for (const id of AI_PROVIDERS) {
      const row = frozenRows.get(id);
      expect(row, `no AGENTS.md row for ${id}`).toBeTruthy();
      const documented = row!.modelCell.match(/`([^`]+)`/)?.[1];
      expect(documented, `model cell for ${id} must contain a backticked slug`).toBeTruthy();
      expect(documented, `AGENTS.md vs registry drift for ${id}`).toBe(resolveProviderModel(id));
    }
  });

  it('publishes the same vision model slug as the registry, for every engine', () => {
    for (const id of VISION_PROVIDERS) {
      const row = visionRows.get(id);
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

  it('documents the reasoning chain in the exact registry order', () => {
    const order = REASONING_CHAIN.map((id) => agentsMd.indexOf(`| \`${id}\` |`));
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i], `${REASONING_CHAIN[i]} out of order in AGENTS.md`).toBeGreaterThan(
        order[i - 1],
      );
    }
  });

  it('pins every NIM row to the free NVIDIA NIM endpoint', () => {
    for (const id of [...NEMOTRON_PROVIDERS, 'nvidia-deepseek-flash', ...NIM_VISION_PROVIDERS]) {
      const row = frozenRows.get(id) ?? visionRows.get(id)!;
      expect(row.endpointCell).toContain(NVIDIA_BASE_URL);
      expect(row.endpointCell).toMatch(/NVIDIA_API_KEY/);
      expect(row.endpointCell).not.toMatch(/groq|openrouter|aliyuncs/i);
    }
  });

  it('records that Qwen is removed and DeepSeek replaced it', () => {
    expect(agentsMd).toMatch(/Qwen 3\.8 Max .{0,20}is REMOVED/i);
    expect(agentsMd).toMatch(/deepseek-ai\/deepseek-v4\.1-flash/);
    expect(agentsMd).not.toMatch(/qwen3\.8-max/i);
    expect(agentsMd).not.toMatch(/ALIBABA_API_KEY/);
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
