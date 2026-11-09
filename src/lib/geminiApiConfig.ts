/**
 * Gemini Developer API configuration shared by the server and native fallback.
 *
 * Pin the stable v1 endpoint explicitly. @google/genai 3.x changed its default
 * from v1beta to v1, and an inherited GOOGLE_GENAI_API_VERSION must not silently
 * route production requests back to the legacy beta endpoint.
 */
export const GEMINI_API_VERSION = 'v1' as const;

/** Gemini Developer API image models; use models.generateContent, not Imagen's Vertex-only generateImages endpoint. */
export const GEMINI_IMAGE_MODELS = [
  'gemini-3.1-flash-image',
  'gemini-3.1-flash-lite-image',
  'gemini-2.5-flash-image',
] as const;

/**
 * Canonical Google Gen AI environment key first, followed by older app/deploy
 * aliases so existing installations continue working during the migration.
 */
const GEMINI_API_KEY_ENV_NAMES = [
  'GOOGLE_API_KEY',
  'GEMINI_API_KEY',
  'VITE_GEMINI_API_KEY',
  'GOOGLE_GENAI_API_KEY',
  'GOOGLE_AI_API_KEY',
] as const;

export const resolveGeminiApiKeyFromEnv = (
  env: Record<string, string | undefined>,
): string => {
  for (const name of GEMINI_API_KEY_ENV_NAMES) {
    const value = String(env[name] || '')
      .trim()
      .replace(/^['"\s]+|['"\s]+$/g, '');
    if (value && value !== 'dummy' && value !== 'undefined') return value;
  }
  return '';
};
