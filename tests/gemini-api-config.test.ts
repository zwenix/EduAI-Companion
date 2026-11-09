import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GEMINI_API_VERSION, GEMINI_IMAGE_MODELS, resolveGeminiApiKeyFromEnv } from '../src/lib/geminiApiConfig';

const rootFile = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('current Gemini Developer API configuration', () => {
  it('pins the stable v1 endpoint in the shared client and server clients', () => {
    expect(GEMINI_API_VERSION).toBe('v1');
    expect(rootFile('server.ts')).toContain('apiVersion: GEMINI_API_VERSION');
    expect(rootFile('src/services/geminiClient.ts')).toContain('apiVersion: GEMINI_API_VERSION');
  });

  it('prefers the current GOOGLE_API_KEY and keeps legacy environment aliases working', () => {
    expect(resolveGeminiApiKeyFromEnv({
      GOOGLE_API_KEY: '  "new-google-key"  ',
      GEMINI_API_KEY: 'old-gemini-key',
    })).toBe('new-google-key');
    expect(resolveGeminiApiKeyFromEnv({ GEMINI_API_KEY: 'legacy-gemini-key' })).toBe('legacy-gemini-key');
    expect(resolveGeminiApiKeyFromEnv({ GOOGLE_GENAI_API_KEY: 'old-genai-key' })).toBe('old-genai-key');
  });

  it('uses supported Gemini Developer API image models via generateContent, not Imagen generateImages', () => {
    expect(GEMINI_IMAGE_MODELS).toEqual([
      'gemini-3.1-flash-image',
      'gemini-3.1-flash-lite-image',
      'gemini-2.5-flash-image',
    ]);
    const server = rootFile('server.ts');
    const client = rootFile('src/services/geminiClient.ts');
    expect(server).toContain('for (const m of GEMINI_IMAGE_MODELS)');
    expect(client).toContain('for (const m of GEMINI_IMAGE_MODELS)');
    expect(`${server}${client}`).not.toMatch(/\.generateImages\s*\(/);
    expect(server).not.toContain('imagen-3.0-generate-002');
    expect(client).not.toContain('imagen-4.0-generate-001');
  });

  it('ignores placeholders and confirms the SDK/runtime requirements are aligned', () => {
    expect(resolveGeminiApiKeyFromEnv({ GOOGLE_API_KEY: 'dummy', GEMINI_API_KEY: 'undefined' })).toBe('');
    const pkg = JSON.parse(rootFile('package.json'));
    expect(pkg.dependencies['@google/genai']).toBe('^3.0.0');
    expect(pkg.engines.node).toBe('>=22');
    expect(rootFile('vite.config.ts')).not.toContain('process.env.GEMINI_API_KEY');
  });
});
