/**
 * CORS-safe artwork.
 *
 * Perchance returns permanent `user.uploads.dev` URLs and Pollinations returns
 * `image.pollinations.ai` URLs. Neither sends `Access-Control-Allow-Origin`, so
 * the browser can DISPLAY the picture but the PDF exporter cannot READ its
 * pixels: `allowTaint: false` skips the image, `allowTaint: true` taints the
 * canvas and `toDataURL()` throws — a blank export either way.
 *
 * `/api/image-relay` re-serves those bytes from our own origin. These tests pin
 * the client-side rewriting and the server-side allow-list.
 */
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toExportableImageUrl } from '../src/lib/imageGeneration';

const repoRoot = path.resolve(__dirname, '..');
const read = (relative: string) => fs.readFileSync(path.join(repoRoot, relative), 'utf8');

afterEach(() => vi.restoreAllMocks());

describe('toExportableImageUrl', () => {
  it('routes Perchance and Pollinations artwork through the relay', () => {
    const perchance = 'https://user.uploads.dev/abc123.jpeg';
    expect(toExportableImageUrl(perchance)).toBe(
      `/api/image-relay?url=${encodeURIComponent(perchance)}`
    );

    const pollinations = 'https://image.pollinations.ai/prompt/a%20frog?width=800';
    expect(toExportableImageUrl(pollinations)).toBe(
      `/api/image-relay?url=${encodeURIComponent(pollinations)}`
    );
  });

  it('leaves images the exporter can already read untouched', () => {
    // Same-origin, relative, data: and blob: URLs all read back fine.
    for (const url of [
      '/api/image-proxy?prompt=frog',
      'https://eduai-companion.vercel.app/api/image-proxy?prompt=frog',
      'data:image/svg+xml;base64,AAAA',
      'blob:https://eduai-companion.vercel.app/1234',
    ]) {
      expect(toExportableImageUrl(url, 'https://eduai-companion.vercel.app'), url).toBe(url);
    }
  });

  it('does not proxy unrelated hosts', () => {
    const other = 'https://example.com/cat.png';
    expect(toExportableImageUrl(other)).toBe(other);
  });

  it('is a no-op for empty input and unparseable strings', () => {
    expect(toExportableImageUrl('')).toBe('');
    expect(toExportableImageUrl('not a url')).toBe('not a url');
  });
});

describe('/api/image-relay', () => {
  const server = read('server.ts');

  it('is a strict allow-list, never an open proxy', () => {
    expect(server).toContain('app.get("/api/image-relay"');
    expect(server).toContain('RELAY_ALLOWED_IMAGE_HOSTS');
    expect(server).toContain('"user.uploads.dev"');
    expect(server).toContain('"image.pollinations.ai"');
    // Rejects anything not https, and anything off the list.
    expect(server).toMatch(/target\.protocol !== "https:"/);
    expect(server).toMatch(/!RELAY_ALLOWED_IMAGE_HOSTS\.has\(target\.hostname\)/);
  });

  it('re-serves the bytes with an explicit CORS header and a cache', () => {
    expect(server).toContain('Access-Control-Allow-Origin');
    expect(server).toContain('Cross-Origin-Resource-Policy');
    // Only image/* is relayed — never HTML/JSON.
    expect(server).toMatch(/!contentType\.startsWith\("image\/"\)/);
  });

  it('is rate-limited like every other /api route', () => {
    // /api is behind the limiter; the relay adds no exemption.
    expect(server).toContain("app.use('/api', (req, res, next) => {");
    expect(server).not.toMatch(/RATE_LIMIT_EXEMPT_PATHS[\s\S]{0,300}image-relay/);
  });
});

describe('PDF export does not taint the canvas', () => {
  it('uses useCORS with allowTaint disabled in every html2canvas call', () => {
    // `allowTaint: true` makes the canvas unreadable, so the following
    // toDataURL() throws and the export silently comes out blank.
    for (const file of [
      'src/lib/printUtils.ts',
      'src/lib/pdfPaginate.ts',
      'src/components/ProgressReports.tsx',
    ]) {
      // Strip comments first: the explanatory text quotes the bad value.
      const code = read(file)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      expect(code, file).not.toMatch(/allowTaint:\s*true/);
    }
  });

  it('rewrites document images to the relay before rasterising', () => {
    const printUtils = read('src/lib/printUtils.ts');
    expect(printUtils).toContain('toExportableImageUrl');
  });
});
