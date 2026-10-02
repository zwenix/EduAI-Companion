/**
 * Frozen AI model registry — regression guard.
 *
 * These assertions mirror the FROZEN table in `AGENTS.md` §1. If someone
 * re-maps, aliases, upgrades or downgrades a model, this suite fails CI before
 * the change can ship. Update AGENTS.md and this file together, deliberately.
 */
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
