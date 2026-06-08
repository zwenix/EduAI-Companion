import { ImageProvider } from '../contexts/AiContext';

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  seed?: number;
}

/**
 * Execute single image generation request
 */
async function executeGeneration(
  cleanPrompt: string,
  provider: ImageProvider,
  width: number,
  height: number,
  seed: number
): Promise<string> {
  const startTime = Date.now();
  console.log(
    `%c[ImageService] [Request Started] Prompt: "${cleanPrompt}" | Provider: "${provider}" | Specs: ${width}x${height} | Seed: ${seed}`,
    'color: #3b82f6; font-weight: bold; background-color: rgba(59, 130, 246, 0.1); padding: 2px 6px; border-radius: 4px;'
  );

  // 1. Client-Side short circuit for Pollinations models to reduce latency and maintain maximum up-time
  if (provider.startsWith('pollinations')) {
    let pollModel = 'flux';
    if (provider === 'pollinations-turbo') {
      pollModel = 'turbo';
    } else if (provider === 'pollinations-klein') {
      pollModel = 'flux-pro';
    }
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&nologo=true&model=${pollModel}&seed=${seed}`;
    
    const duration = Date.now() - startTime;
    console.log(
      `%c[ImageService] [Response Successful] Provider: "${provider}" | Render URL: ${url} (Time: ${duration}ms)`,
      'color: #10b981; font-weight: bold; background-color: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px;'
    );
    return url;
  }

  // 2. Proxied Image API Generation for key-secured models
  const response = await fetch('/api/images/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: cleanPrompt, provider, width, height, seed })
  });

  const duration = Date.now() - startTime;
  if (!response.ok) {
    const responseText = await response.text();
    console.error(
      `%c[ImageService] [Response Error] HTTP ${response.status} | Provider: "${provider}" | Details: ${responseText} (Time: ${duration}ms)`,
      'color: #ef4444; font-weight: bold; background-color: rgba(239, 68, 68, 0.1); padding: 2px 6px; border-radius: 4px;'
    );
    throw new Error(`Server returned status ${response.status}: ${responseText || 'Unknown Server Error'}`);
  }

  const data = await response.json();
  if (data && data.url) {
    console.log(
      `%c[ImageService] [Response Successful] Provider: "${provider}" | Render URL: ${data.url} (Time: ${duration}ms)`,
      'color: #10b981; font-weight: bold; background-color: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px;'
    );
    return data.url;
  }

  const payloadError = data.error || 'No valid image URL was received in proxy payload.';
  console.error(
    `%c[ImageService] [Response Error] Empty Payload | Provider: "${provider}" | Details: ${payloadError} (Time: ${duration}ms)`,
    'color: #ef4444; font-weight: bold; background-color: rgba(239, 68, 68, 0.1); padding: 2px 6px; border-radius: 4px;'
  );
  throw new Error(payloadError);
}

/**
 * Centralized Image Generation Service
 * Routes request to chosen image model/provider, ensures fallback logic on errors,
 * and maintains unified URL formats.
 */
export async function generateImage(
  prompt: string,
  provider: ImageProvider,
  options: ImageGenerationOptions = {}
): Promise<string> {
  const width = options.width || 1024;
  const height = options.height || 1024;
  const seed = options.seed !== undefined ? options.seed : Math.floor(Math.random() * 1000000);

  // Trim and sanitize bracket wrappers as requested by user or server constraints (e.g. "[Illustration: Text]")
  let cleanPrompt = prompt.trim();
  cleanPrompt = cleanPrompt.replace(/^\[(?:Illustration|Image|Concept\s+Illustration|Diagram|Graphic|Visual):\s*/i, "");
  cleanPrompt = cleanPrompt.replace(/\]$/, "");
  cleanPrompt = cleanPrompt.trim();

  try {
    // Attempt primary image provider
    return await executeGeneration(cleanPrompt, provider, width, height, seed);
  } catch (primaryError: any) {
    console.warn(
      `%c[ImageService] [Interception Alert] Primary generation with provider "${provider}" failed. Initiating single-recovery retry.`,
      'color: #f59e0b; font-weight: bold; background-color: rgba(245, 158, 11, 0.1); padding: 2px 6px; border-radius: 4px;'
    );

    // Select alternative robust model/provider
    // If the original was pollinations-turbo, use pollinations-schnell. Otherwise, try pollinations-turbo as a hyper-resilient alternate backup.
    const alternateProvider: ImageProvider = provider === 'pollinations-turbo' ? 'pollinations-schnell' : 'pollinations-turbo';

    console.log(
      `%c[ImageService] [Retry Initiated] Switching to alternative recovery model: "${alternateProvider}"`,
      'color: #8b5cf6; font-weight: bold; background-color: rgba(139, 92, 246, 0.1); padding: 2px 6px; border-radius: 4px;'
    );

    try {
      // Attempt once-off retry using standard seed configuration
      const recoveryUrl = await executeGeneration(cleanPrompt, alternateProvider, width, height, seed + 1);
      console.log(
        `%c[ImageService] [Recovery Completed] Successfully resolved with fallback provider "${alternateProvider}".`,
        'color: #10b981; font-weight: bold; background-color: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px;'
      );
      return recoveryUrl;
    } catch (retryError: any) {
      console.error(
        `%c[ImageService] [Ultimate Critical Error] Primary provider "${provider}" and alternate "${alternateProvider}" both failed. Propagating error to frontend view.`,
        'color: #dc2626; font-weight: bold; background-color: rgba(220, 38, 38, 0.1); padding: 2px 6px; border-radius: 4px;'
      );
      // Rethrow to trigger visible visualization failed state on the UI
      throw new Error(`Both initial and backup image generation failed. Details: ${retryError.message || retryError}`);
    }
  }
}
