import { ImageProvider } from '../contexts/AiContext';

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  seed?: number;
}

export const DEFAULT_IMAGE_PROVIDER: ImageProvider = 'pollinations-flux';

/**
 * Execute single image generation request with exhaustive tracing
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
    `%c[ImageService] 🚀 [Generation Initiated]\n` +
    `  • Prompt: "${cleanPrompt}"\n` +
    `  • Chosen Provider: "${provider}"\n` +
    `  • Dimensions Requested: ${width}x${height}\n` +
    `  • Numerical Seed Value: ${seed}`,
    'color: #3b82f6; font-weight: bold; background-color: rgba(59, 130, 246, 0.1); padding: 4px 8px; border-radius: 6px; line-height: 1.5;'
  );

  // 1. Client-Side short circuit for Pollinations models to reduce latency and maintain maximum up-time
  if (provider.startsWith('pollinations')) {
    console.log(`%c[ImageService] ⚡ [Client-Side Route Intercepted] Detected native Pollinations provider "${provider}". Re-routing to synchronous URL constructor to minimize server-hop latency.`, 'color: #06b6d4; font-weight: bold;');
    
    let pollModel = 'flux';
    if (provider === 'pollinations-turbo') {
      pollModel = 'turbo';
    } else if (provider === 'pollinations-schnell') {
      pollModel = 'flux'; // 'flux' is extremely robust and has maximum up-time
    } else if (provider === 'pollinations-klein') {
      pollModel = 'flux-pro';
    }
    
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&nologo=true&model=${pollModel}&seed=${seed}`;
    const duration = Date.now() - startTime;
    
    console.log(
      `%c[ImageService] ✅ [Response Success] Constructed direct Pollinations secure image reference URL:\n` +
      `  • Generated URL: ${url}\n` +
      `  • Target Model: ${pollModel}\n` +
      `  • Generation Time: ${duration}ms`,
      'color: #10b981; font-weight: bold; background-color: rgba(16, 185, 129, 0.1); padding: 4px 8px; border-radius: 6px; line-height: 1.5;'
    );
    return url;
  }

  // 2. Proxied Image API Generation for key-secured models
  const apiPath = '/api/images/generate';
  const requestBody = { prompt: cleanPrompt, provider, width, height, seed };
  
  console.log(
    `%c[ImageService] 📡 [API Request Construction] Preparing secure proxy transaction:\n` +
    `  • POST Target: ${apiPath}\n` +
    `  • Headers: { "Content-Type": "application/json" }\n` +
    `  • Payload: ${JSON.stringify(requestBody, null, 2)}`,
    'color: #6366f1; font-weight: bold;'
  );

  try {
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const duration = Date.now() - startTime;
    
    console.log(
      `%c[ImageService] 📥 [API Network Response Received] Status code: ${response.status} ${response.statusText} (${duration}ms)`,
      'color: #4f46e5; font-weight: bold;'
    );

    if (!response.ok) {
      const responseText = await response.text();
      console.error(
        `%c[ImageService] ❌ [API Server-Side Failure] Direct fetch request was rejected:\n` +
        `  • HTTP Error: ${response.status}\n` +
        `  • Response Message: "${responseText}"\n` +
        `  • Target Provider: "${provider}"`,
        'color: #ef4444; font-weight: bold; background-color: rgba(239, 68, 68, 0.1); padding: 4px 8px; border-radius: 6px;'
      );
      throw new Error(`Server returned status ${response.status}: ${responseText || 'Unknown Server Error'}`);
    }

    const data = await response.json();
    console.log(
      `%c[ImageService] 📦 [API Payload Parsed Successfully]\n` +
      `  • Raw Keys Returned: ${Object.keys(data).join(', ')}\n` +
      `  • Contains URL Field: ${!!data.url}`,
      'color: #8b5cf6;'
    );

    if (data && data.url) {
      console.log(
        `%c[ImageService] ✅ [Response Success] Secure proxy delivered visual resources:\n` +
        `  • Image URL / Blob: ${data.url.substring(0, 100)}${data.url.length > 100 ? '...' : ''}\n` +
        `  • Total Payload Size: ${JSON.stringify(data).length} bytes\n` +
        `  • Execution Time: ${duration}ms`,
        'color: #10b981; font-weight: bold; background-color: rgba(16, 185, 129, 0.1); padding: 4px 8px; border-radius: 6px; line-height: 1.5;'
      );
      return data.url;
    }

    const payloadError = data.error || 'Server payload parsed successfully but contained no valid "url" field.';
    console.error(
      `%c[ImageService] ❌ [API Payload Malformed] Received empty or invalid payload structure:\n` +
      `  • Error Description: "${payloadError}"`,
      'color: #ef4444; font-weight: bold;'
    );
    throw new Error(payloadError);

  } catch (networkError: any) {
    const duration = Date.now() - startTime;
    console.error(
      `%c[ImageService] 💥 [Network Exception] API proxy request threw an exception:\n` +
      `  • Exception Message: "${networkError.message || networkError}"\n` +
      `  • Total Time Elapsed: ${duration}ms`,
      'color: #dc2626; font-weight: bold; background-color: rgba(220, 38, 38, 0.1); padding: 4px 8px; border-radius: 6px;'
    );
    throw networkError;
  }
}

/**
 * Centralized Image Generation Service
 * Routes request to chosen image model/provider, ensures fallback logic on errors,
 * and maintains unified URL formats with adaptive fallback loops.
 */
export async function generateImage(
  prompt: string,
  provider: ImageProvider = DEFAULT_IMAGE_PROVIDER,
  options: ImageGenerationOptions = {}
): Promise<string> {
  const width = options.width || 1024;
  const height = options.height || 1024;
  const seed = options.seed !== undefined ? options.seed : Math.floor(Math.random() * 1000000);

  // Trim and sanitize bracket wrappers (e.g. "[Illustration: Text]")
  let cleanPrompt = prompt.trim();
  cleanPrompt = cleanPrompt.replace(/^\[(?:Illustration|Image|Concept\s+Illustration|Diagram|Graphic|Visual):\s*/i, "");
  cleanPrompt = cleanPrompt.replace(/\]$/, "");
  cleanPrompt = cleanPrompt.trim();

  try {
    console.log(`%c[ImageService] 🔎 [Routing Engine] Intercepting request for provider "${provider}" with options:`, 'color: #1e293b; font-weight: bold;', options);
    // Attempt primary image provider
    return await executeGeneration(cleanPrompt, provider, width, height, seed);
  } catch (primaryError: any) {
    console.warn(
      `%c[ImageService] ⚠️ [Interception Warning] Primary generation with provider "${provider}" failed. Initiating recovery backup retry loop.`,
      'color: #f59e0b; font-weight: bold; background-color: rgba(245, 158, 11, 0.1); padding: 6px 10px; border-radius: 6px;'
    );

    // List of resilient fallback image providers to sequential transition and protect UI
    const fallbackProviders: ImageProvider[] = [
      'pollinations-flux',
      'pollinations-turbo',
      'pollinations-schnell'
    ];

    // Remove the failing provider to avoid pointless recursion loops
    const availableFallbacks = fallbackProviders.filter(p => p !== provider);

    for (const fallbackModel of availableFallbacks) {
      try {
        console.log(
          `%c[ImageService] 🔄 [State Transition] Attempting alternate fallback provider: "${fallbackModel}"...`,
          'color: #8b5cf6; font-weight: bold; background-color: rgba(139, 92, 246, 0.1); padding: 6px 10px; border-radius: 6px;'
        );

        // Try generation with slightly offset seed to output variations
        const recoveryUrl = await executeGeneration(cleanPrompt, fallbackModel, width, height, seed + 1);
        console.log(
          `%c[ImageService] 🎉 [Recovery Action Successful] Alternated generation completed via "${fallbackModel}". Restoring UI rendering state.`,
          'color: #10b981; font-weight: bold; background-color: rgba(16, 185, 129, 0.1); padding: 6px 10px; border-radius: 6px;'
        );
        return recoveryUrl;
      } catch (retryError: any) {
        console.log(`%c[ImageService] ⚠️ Alternate provider "${fallbackModel}" also failed: ${retryError.message || retryError}`, 'color: #f59e0b;');
        continue;
      }
    }

    console.error(
      `%c[ImageService] 🛑 [Ultimate Disaster State] Both initial provider "${provider}" and all fallback recovery models failed. Triggering frontend fail-state.`,
      'color: #dc2626; font-weight: bold; background-color: rgba(220, 38, 38, 0.2); padding: 8px 12px; border-radius: 8px;'
    );
    throw new Error(`Primary and backup image generation pipelines both failed. Last Error: ${primaryError.message || primaryError}`);
  }
}

/**
 * Perform a asynchronous diagnostic check of image provider capabilities
 */
export async function checkProviderHealth(provider: ImageProvider): Promise<boolean> {
  try {
    const testPrompt = "simple education illustration of an apple";
    await generateImage(testPrompt, provider, { width: 128, height: 128, seed: 42 });
    return true;
  } catch (error) {
    console.warn(`[ImageService] Health check failed for "${provider}":`, error);
    return false;
  }
}
