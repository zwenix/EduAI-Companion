/**
 * Free FLUX image providers — SERVER SIDE ONLY.
 *
 *   • Cloudflare Workers AI  → @cf/black-forest-labs/flux-1-schnell
 *       env: CLOUDFLARE_API_TOKEN (needs the "Workers AI" permission)
 *            CLOUDFLARE_ACCOUNT_ID
 *   • Hugging Face (free FLUX) → black-forest-labs/FLUX.1-schnell via the
 *       Inference Providers router (HF Inference backend)
 *       env: HF_TOKEN (or HUGGINGFACE_API_KEY)
 *
 * The tokens are only ever read from the server environment and are never sent
 * to the browser / APK: the client calls `/api/images/flux-generate` and gets a
 * `data:` URL back. Keep it that way — a token bundled into the client is a
 * token published to the world.
 */

export type FluxProviderId = 'cloudflare' | 'huggingface';

export interface FluxRequest {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
}

export interface FluxResult {
  /** `data:image/...;base64,...` ready to drop into an <img>. */
  url: string;
  provider: FluxProviderId;
  model: string;
}

/** Error carrying the HTTP status so the route can answer sensibly. */
export class FluxProviderError extends Error {
  constructor(message: string, public readonly status: number = 502, public readonly provider?: FluxProviderId) {
    super(message);
    this.name = 'FluxProviderError';
  }
}

export const CLOUDFLARE_FLUX_MODEL = '@cf/black-forest-labs/flux-1-schnell';
export const HF_FLUX_MODEL = 'black-forest-labs/FLUX.1-schnell';
export const HF_FLUX_ENDPOINT = `https://router.huggingface.co/hf-inference/models/${HF_FLUX_MODEL}`;
const REQUEST_TIMEOUT_MS = 45_000;

type Env = Record<string, string | undefined>;
type FetchLike = (input: string, init?: any) => Promise<any>;

const clean = (value?: string): string => String(value ?? '').trim().replace(/^['"\s]+|['"\s]+$/g, '');

export const resolveCloudflareCredentials = (env: Env = process.env): { token: string; accountId: string } => {
  const token = clean(env.CLOUDFLARE_API_TOKEN) || clean(env.CF_API_TOKEN);
  let accountId = clean(env.CLOUDFLARE_ACCOUNT_ID) || clean(env.CF_ACCOUNT_ID);
  if (!accountId) {
    // The R2 S3 endpoint is https://<account-id>.r2.cloudflarestorage.com
    const endpoint = clean(env.CLOUDFLARE_R2_ENDPOINT) || clean(env.R2_ENDPOINT) || clean(env.S3_ENDPOINT);
    accountId = endpoint.match(/^https?:\/\/([a-f0-9]{32})\./i)?.[1] ?? '';
  }
  return { token, accountId };
};

export const resolveHuggingFaceToken = (env: Env = process.env): string =>
  clean(env.HF_TOKEN) || clean(env.HUGGINGFACE_API_KEY) || clean(env.HUGGING_FACE_HUB_TOKEN);

export const isFluxProviderConfigured = (provider: FluxProviderId, env: Env = process.env): boolean => {
  if (provider === 'cloudflare') {
    const { token, accountId } = resolveCloudflareCredentials(env);
    return Boolean(token && accountId);
  }
  return Boolean(resolveHuggingFaceToken(env));
};

const withTimeout = async <T>(run: (signal: AbortSignal) => Promise<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

/** Sniff the real image type from the first bytes (providers lie about content-type). */
const sniffMime = (bytes: Uint8Array, fallback = 'image/jpeg'): string => {
  if (bytes.length > 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
  if (bytes.length > 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  return fallback;
};

const toDataUrl = (base64: string): string => {
  const bytes = Buffer.from(base64.slice(0, 64), 'base64');
  return `data:${sniffMime(bytes)};base64,${base64}`;
};

const snippet = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').slice(0, 240);

/** Cloudflare caps the prompt at 2048 characters. */
const clampPrompt = (prompt: string, max = 2000): string => {
  const text = String(prompt || '').trim();
  return text.length > max ? text.slice(0, max) : text;
};

export const generateCloudflareFlux = async (
  req: FluxRequest,
  opts: { env?: Env; fetchImpl?: FetchLike } = {},
): Promise<FluxResult> => {
  const { token, accountId } = resolveCloudflareCredentials(opts.env);
  if (!token || !accountId) {
    throw new FluxProviderError('Cloudflare Workers AI is not configured (set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID).', 400, 'cloudflare');
  }
  const doFetch: FetchLike = opts.fetchImpl ?? (fetch as unknown as FetchLike);
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_FLUX_MODEL}`;
  const body: Record<string, unknown> = { prompt: clampPrompt(req.prompt), steps: 4 };
  if (Number.isFinite(req.seed)) body.seed = Math.abs(Math.floor(req.seed as number)) % 2_147_483_647;

  let res: any;
  try {
    res = await withTimeout((signal) =>
      doFetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      }),
    );
  } catch (err: any) {
    throw new FluxProviderError(`Cloudflare Workers AI unreachable: ${err?.message || err}`, 504, 'cloudflare');
  }

  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = null; }

  if (!res.ok || data?.success === false) {
    const apiError = data?.errors?.[0]?.message || snippet(text);
    if (res.status === 401 || res.status === 403) {
      throw new FluxProviderError(
        `Cloudflare rejected the token (HTTP ${res.status}): ${apiError}. The API token needs the "Workers AI" permission.`,
        401,
        'cloudflare',
      );
    }
    throw new FluxProviderError(`Cloudflare Workers AI failed (HTTP ${res.status}): ${apiError}`, res.status === 429 ? 429 : 502, 'cloudflare');
  }

  // REST wraps the model output in `result`; the Worker binding returns it bare.
  const image: string | undefined = data?.result?.image ?? data?.image;
  if (!image) throw new FluxProviderError(`Cloudflare Workers AI returned no image: ${snippet(text)}`, 502, 'cloudflare');
  return { url: toDataUrl(image), provider: 'cloudflare', model: CLOUDFLARE_FLUX_MODEL };
};

const roundTo16 = (n: number | undefined, fallback: number): number => {
  const v = Number.isFinite(n) ? (n as number) : fallback;
  return Math.max(256, Math.min(1024, Math.round(v / 16) * 16));
};

export const generateHuggingFaceFlux = async (
  req: FluxRequest,
  opts: { env?: Env; fetchImpl?: FetchLike } = {},
): Promise<FluxResult> => {
  const token = resolveHuggingFaceToken(opts.env);
  if (!token) throw new FluxProviderError('Hugging Face is not configured (set HF_TOKEN).', 400, 'huggingface');
  const doFetch: FetchLike = opts.fetchImpl ?? (fetch as unknown as FetchLike);

  const parameters: Record<string, unknown> = {
    width: roundTo16(req.width, 1024),
    height: roundTo16(req.height, 768),
    num_inference_steps: 4,
  };
  if (Number.isFinite(req.seed)) parameters.seed = Math.abs(Math.floor(req.seed as number)) % 2_147_483_647;

  let res: any;
  try {
    res = await withTimeout((signal) =>
      doFetch(HF_FLUX_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'image/png, image/jpeg, application/json' },
        body: JSON.stringify({ inputs: clampPrompt(req.prompt, 1500), parameters }),
        signal,
      }),
    );
  } catch (err: any) {
    throw new FluxProviderError(`Hugging Face unreachable: ${err?.message || err}`, 504, 'huggingface');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
      throw new FluxProviderError(`Hugging Face rejected the token (HTTP ${res.status}). Use a token with "Make calls to Inference Providers".`, 401, 'huggingface');
    }
    if (res.status === 402) {
      throw new FluxProviderError('Hugging Face free monthly inference credit is used up (HTTP 402).', 402, 'huggingface');
    }
    throw new FluxProviderError(`Hugging Face failed (HTTP ${res.status}): ${snippet(text)}`, res.status === 429 ? 429 : 502, 'huggingface');
  }

  const type = String(res.headers?.get?.('content-type') || '').toLowerCase();
  if (type.includes('application/json')) {
    // Some backends answer JSON with a base64 / URL payload instead of bytes.
    const data: any = await res.json().catch(() => null);
    const b64: string | undefined = data?.image ?? data?.images?.[0]?.b64_json ?? data?.data?.[0]?.b64_json;
    if (b64) return { url: toDataUrl(b64), provider: 'huggingface', model: HF_FLUX_MODEL };
    const remote: string | undefined = data?.images?.[0]?.url ?? data?.data?.[0]?.url;
    if (remote && /^https:\/\//i.test(remote)) return { url: remote, provider: 'huggingface', model: HF_FLUX_MODEL };
    throw new FluxProviderError(`Hugging Face returned no image: ${snippet(JSON.stringify(data))}`, 502, 'huggingface');
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length < 100) throw new FluxProviderError('Hugging Face returned an empty image.', 502, 'huggingface');
  const mime = sniffMime(bytes, type.startsWith('image/') ? type : 'image/jpeg');
  return { url: `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`, provider: 'huggingface', model: HF_FLUX_MODEL };
};

export const generateFluxImage = (
  provider: FluxProviderId,
  req: FluxRequest,
  opts: { env?: Env; fetchImpl?: FetchLike } = {},
): Promise<FluxResult> =>
  provider === 'cloudflare' ? generateCloudflareFlux(req, opts) : generateHuggingFaceFlux(req, opts);
