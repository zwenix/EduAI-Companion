/**
 * Deployment / PWA contract.
 *
 * Both checks below exist because the deployed preview logged real console
 * errors that came from configuration, not from user input:
 *
 *  1. `Access to manifest at 'https://vercel.com/sso-api?…' … blocked by CORS
 *     policy` — browsers fetch `<link rel="manifest">` WITHOUT credentials even
 *     from the same origin. On a Vercel deployment behind Deployment
 *     Protection that request is unauthenticated, so Vercel redirects it to
 *     its SSO endpoint and the cross-origin redirect is refused. The link must
 *     therefore carry `crossorigin="use-credentials"`, which is exactly what
 *     VitePWA emits when `useCredentials: true`.
 *
 *  2. The Permissions-Policy warnings (`Unrecognized feature:
 *     'attribution-reporting'`, `'browsing-topics'`, `'run-ad-auction'`,
 *     `'join-ad-interest-group'`, `'private-aggregation'`) are emitted by the
 *     preview-protection layer, not by this app. The app ships no
 *     Permissions-Policy header at all — adding one here would duplicate the
 *     key and produce *new* parse errors — so the guard is that we stay out of
 *     it, and that the features the product actually uses (camera for OCR/QR
 *     scanning) are never denied.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');
const read = (relative: string) => fs.readFileSync(path.join(repoRoot, relative), 'utf8');

describe('web manifest is fetched with credentials', () => {
  it('configures VitePWA to emit crossorigin="use-credentials"', () => {
    const config = read('vite.config.ts');
    expect(config).toContain('useCredentials: true');
    // The manifest must exist — an absent manifest would silently disable the
    // credential hint and bring the SSO redirect back.
    expect(config).toContain('manifest: {');
  });

  it('ships the attribute in the built index.html when dist/ is present', () => {
    const builtIndex = path.join(repoRoot, 'dist/index.html');
    if (!fs.existsSync(builtIndex)) return; // build not run — CI builds separately
    const html = read('dist/index.html');
    const tag = html.match(/<link rel="manifest"[^>]*>/)?.[0] || '';
    expect(tag).toContain('crossorigin="use-credentials"');
  });
});

describe('Permissions-Policy stays out of the app', () => {
  it('does not hand-roll a Permissions-Policy header anywhere', () => {
    // The preview protection layer owns this header; a second copy would
    // collide. See docs/console-error-triage.md §10.
    const files = ['vercel.json', 'server.ts', 'index.html', 'netlify.toml'];
    for (const file of files) {
      const full = path.join(repoRoot, file);
      if (!fs.existsSync(full)) continue;
      expect(read(file).toLowerCase(), file).not.toContain('permissions-policy');
    }
  });

  it('never denies camera or microphone — OCR, QR scanning and avatar capture need them', () => {
    for (const file of ['vercel.json', 'index.html']) {
      const full = path.join(repoRoot, file);
      if (!fs.existsSync(full)) continue;
      const source = read(file);
      expect(source, file).not.toMatch(/camera=\(\s*\)/);
      expect(source, file).not.toMatch(/microphone=\(\s*\)/);
    }
  });
});
