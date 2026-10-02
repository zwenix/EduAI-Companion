import { defineConfig } from 'vitest/config';

/**
 * Dedicated test configuration.
 *
 * Deliberately does NOT load `vite.config.ts`: the app config pulls in the PWA
 * plugin (which builds a web manifest/service worker) and injects
 * `process.env.GEMINI_API_KEY`. Tests are pure logic — no bundling side effects
 * needed — so a minimal config keeps runs fast and offline-safe.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: process.env.CI ? { junit: 'test-results/junit.xml' } : undefined,
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      include: ['src/lib/**/*.ts', 'src/services/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/lib/prompts/**'],
    },
  },
});
