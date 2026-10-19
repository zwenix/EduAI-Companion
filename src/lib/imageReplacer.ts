import { collection, onSnapshot, query, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { buildPollinationsUrl, generateImageWithFallback, peekGeneratedImage } from './imageGeneration';
import { EDUCATIONAL_IMAGE_STYLE } from './prompt-priority';

/**
 * EduAI Companion - Custom Image Placeholder Replacer & Firestore Cache
 * Synchronizes with Firestore in real-time to replace raw text placeholders
 * with cached, approved, or customized images stored by South African teachers.
 */

class IllustrationCache {
  private static cache: Record<string, string> = {};
  private static initialized = false;

  public static init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const q = query(collection(db, 'illustrations'));
      onSnapshot(q, (snapshot) => {
        const newCache: Record<string, string> = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.prompt && data.imageUrl) {
            newCache[data.prompt.trim().toLowerCase()] = data.imageUrl;
          }
        });
        this.cache = newCache;
      }, (error) => {
        console.error("Failed to sync Illustration Library cache:", error);
      });
    } catch (e) {
      console.error("Failed to initialize Illustration Library cache:", e);
    }
  }

  public static get(prompt: string): string | undefined {
    this.init();
    return this.cache[prompt.trim().toLowerCase()];
  }

  public static async save(prompt: string, imageUrl: string) {
    this.init();
    const cleanPrompt = prompt.trim();
    const lowerPrompt = cleanPrompt.toLowerCase();
    
    // Check if ready in local cache first to shield quota reads/writes
    if (this.cache[lowerPrompt]) return;

    // Build valid id matching isValidId check (^[a-zA-Z0-9_-]+$)
    const cleanId = lowerPrompt.replace(/[^a-z0-9_-]/g, '_').slice(0, 100);
    if (!cleanId) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        // Cache in local memory to prevent regeneration, but do not write to Firestore
        this.cache[lowerPrompt] = imageUrl;
        return;
      }
      
      const docRef = doc(db, 'illustrations', cleanId);
      
      const payload: any = {
        prompt: cleanPrompt,
        imageUrl: imageUrl,
        createdAt: Timestamp.now()
      };
      
      payload.teacherId = user.uid;
      
      await setDoc(docRef, payload);
      this.cache[lowerPrompt] = imageUrl;
    } catch (e) {
      console.error("Non-blocking failure: Could not cache illustration in Firestore", e);
    }
  }
}

/** 1×1 transparent GIF. An illustration that carries this as its `src` is "pending":
 * the live preview iframe (ContentCreator) and the global hydrator in
 * `imageRecovery.ts` both recognise it and generate the real image through the
 * provider chain (Perchance first). Nothing is requested from any provider until
 * then — in particular, nothing hits Pollinations up front. */
/** Persist a generated illustration URL to the shared Illustration Library (non-blocking). */
export function cacheGeneratedIllustration(prompt: string, imageUrl: string): void {
  // Firestore rules cap imageUrl at 4096 chars — inline data: URLs never fit.
  if (!prompt || !/^https?:\/\//i.test(imageUrl) || imageUrl.length > 4000) return;
  void IllustrationCache.save(prompt, imageUrl);
}

export const PENDING_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const IMG_W = 800;
const IMG_H = 600;

const PENDING_IMG_REGEX = /<img\b[^>]*\bdata-eduai-pending=["']1["'][^>]*>/gi;

/**
 * Make every still-pending illustration in an exported/printed HTML string
 * loadable. Pending images that were already generated this session are
 * replaced by the generated URL; anything left falls back to a direct
 * Pollinations link (the user's own connection, never the shared server).
 * Synchronous on purpose — print/HTML export must not lose the user gesture.
 */
export function finalizeImagesForExport(html: string): string {
  if (!html || html.indexOf('data-eduai-pending') === -1) return html;
  return html.replace(PENDING_IMG_REGEX, (tag) => {
    const prompt = tag.match(/data-eduai-prompt=["']([^"']*)["']/i);
    const seed = tag.match(/data-eduai-seed=["']([^"']*)["']/i);
    if (!prompt) return tag;
    let decoded = '';
    try { decoded = decodeURIComponent(prompt[1]); } catch { return tag; }
    const url = peekGeneratedImage(decoded, IMG_W, IMG_H)
      || buildPollinationsUrl(decoded, IMG_W, IMG_H, parseInt(seed?.[1] || '0', 10) || 1);
    return tag
      .replace(/\bsrc=["'][^"']*["']/i, `src="${url}"`)
      .replace(/\bdata-eduai-pending=["']1["']/i, '')
      .replace(/\bloading=["']lazy["']/i, 'loading="eager"');
  });
}

/**
 * Generate every pending illustration in an HTML string through the provider
 * chain (Perchance → … ), at most `concurrency` at a time, then return the HTML
 * with real image URLs in place. Used by the async PDF export so the file
 * contains the pictures rather than blank frames. Bounded by `budgetMs`; images
 * that miss the deadline are handled by `finalizeImagesForExport`.
 */
export async function resolvePendingImages(html: string, concurrency = 2, budgetMs = 60000): Promise<string> {
  if (!html || html.indexOf('data-eduai-pending') === -1) return html;
  const prompts = new Map<string, number>();
  for (const tag of html.match(PENDING_IMG_REGEX) || []) {
    const prompt = tag.match(/data-eduai-prompt=["']([^"']*)["']/i);
    const seed = tag.match(/data-eduai-seed=["']([^"']*)["']/i);
    if (!prompt) continue;
    try { prompts.set(decodeURIComponent(prompt[1]), parseInt(seed?.[1] || '0', 10) || 1); } catch { /* skip */ }
  }
  const queue = Array.from(prompts.entries());
  const deadline = Date.now() + budgetMs;
  const worker = async () => {
    while (queue.length && Date.now() < deadline) {
      const [prompt, seed] = queue.shift()!;
      try {
        await generateImageWithFallback({ prompt, width: IMG_W, height: IMG_H, seed });
      } catch (err) {
        console.warn('[Image Resolve] could not generate illustration:', err);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  return finalizeImagesForExport(html);
}

export function replaceImagePlaceholders(html: any, allowImages: boolean = true): string {
  if (!html || typeof html !== 'string') return '';

  const buildImageBlock = (cleanPrompt: string) => {
    // Generate a stable deterministic seed based on the prompt string to prevent flashing/re-rendering
    let promptHash = 0;
    for (let i = 0; i < cleanPrompt.length; i++) {
      promptHash = (promptHash << 5) - promptHash + cleanPrompt.charCodeAt(i);
      promptHash |= 0;
    }
    const seed = Math.abs(promptHash) % 100000;

    if (!allowImages) {
      return `
<div class="my-4 p-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-slate-700 font-medium text-xs shadow-sm print:break-inside-avoid">
  <div class="flex items-center gap-2 mb-1">
    <span class="text-base">📸</span>
    <strong class="eduai-illustration-label font-bold uppercase tracking-wider">Illustration Placeholder & Printable Description:</strong>
  </div>
  <p class="italic text-slate-600 font-serif leading-relaxed">${cleanPrompt}</p>
</div>
      `;
    }

    // Check Firestore reactive cache
    const cachedUrl = IllustrationCache.get(cleanPrompt);
    
    if (cachedUrl) {
      return `
<div class="my-6 overflow-hidden rounded-[2rem] border-2 border-solid border-slate-200 p-2 bg-white hover:bg-slate-50 transition-all duration-300 max-w-full print:break-inside-avoid print:border-none print:p-0 print:m-0 print:shadow-none shadow-sm">
  <img src="${cachedUrl}"
       alt="${cleanPrompt}"
       title="${cleanPrompt}"
       class="w-full object-cover rounded-[1.8rem] aspect-[4/3] max-h-[360px] border border-slate-100 shadow-inner print:rounded-none print:shadow-none"
       referrerPolicy="no-referrer" />
  <p class="hidden print:block text-[11px] text-slate-700 italic mt-1.5 font-serif text-center border-t border-slate-200 pt-1">[Print Visual Description: ${cleanPrompt}]</p>
  <div class="px-3 py-1.5 border-t border-dashed border-slate-150 mt-2 bg-slate-50/55 rounded-b-[1.5rem] flex items-center justify-between print:hidden select-none">
    <div class="flex items-center gap-1.5 opacity-30">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0" aria-hidden="true">
        <path d="M19 11c0-3.5-3-7-7.5-7S5 7.5 5 12v4a2 2 0 0 0 2 2h1v-3h2v3h3v-3h2v3h1a2 2 0 0 0 2-2v-1.2c1.2-.7 2-2 2-3.8V11z"/>
        <path d="M14 4c-.5-1.5-2-2-3.5-2"/>
        <circle cx="10.5" cy="11" r="0.7" fill="currentColor" stroke="none"/>
      </svg>
      <p class="eduai-illustration-label uppercase tracking-widest font-black leading-none text-[8px]">
        EduAI Archive Cached Asset
      </p>
    </div>
    <span class="eduai-illustration-label px-1.5 py-0.5 rounded bg-slate-100 font-bold select-none uppercase text-[8px] opacity-30">Synced</span>
  </div>
</div>
      `;
    }

    // Fallback/First-generation flow. Perchance is the primary generator on
    // every platform (web and native), so the badge reflects that everywhere.
    const defaultProvider = 'perchance';
    const provider = typeof window !== 'undefined'
      ? window.localStorage.getItem('eduai_image_provider') || defaultProvider
      : defaultProvider;
    const providerChain = provider === 'gemini-imagen' || provider === 'gemini'
      ? 'Google Imagen (Tertiary) → Pollinations'
      : provider === 'pollinations'
        ? 'Pollinations → Google Imagen'
        : provider === 'qwen' || provider === 'qwen-image' || provider === 'nvidia-qwen'
          ? 'Qwen-Image (Secondary) → Google Imagen → Pollinations'
          : 'Perchance (Primary) → Google Imagen → Pollinations';

    const isLogoOrStamp = /logo|stamp|seal|crest|badge|signature|certificate|emblem/i.test(cleanPrompt);
    const styleDirective = `, ${EDUCATIONAL_IMAGE_STYLE}, educational, high quality, vibrant colours`;
    const promptWithStyle = cleanPrompt.toLowerCase().includes('disney 3d animation character') && cleanPrompt.toLowerCase().includes('3d cute icon')
      ? cleanPrompt
      : `${cleanPrompt}${styleDirective}`;
    const enhancedPrompt = isLogoOrStamp
      ? `${promptWithStyle}, clean professional vector logo, official school crest stamp seal aesthetic, crisp graphic design, high contrast, pure white background, masterpiece 4k vector graphic`
      : `${promptWithStyle}, professional educational illustration, clean aesthetic design, crisp render, sharp focus, vibrant lighting, pure white background, natural beauty, 4k resolution`;
    
    // Nothing is requested from any provider here. The image starts "pending"
    // (transparent pixel) and is generated on demand through the provider chain
    // (Perchance → Gemini/Imagen → Pollinations …) by the preview iframe /
    // global hydrator — or comes straight from the session cache if this exact
    // illustration was already generated. Previously every placeholder pointed
    // at Pollinations up front, so a few images in, its free-tier limit hit.
    const generatedUrl = peekGeneratedImage(enhancedPrompt, IMG_W, IMG_H);
    const imageUrl = generatedUrl || PENDING_IMAGE_SRC;
    const pendingAttr = generatedUrl ? '' : 'data-eduai-pending="1"';

    return `
<div class="my-6 overflow-hidden rounded-[2rem] border-2 border-dashed border-slate-300 p-2 bg-slate-50/50 hover:bg-slate-100 transition-all duration-300 max-w-full print:break-inside-avoid print:border-none print:p-0 print:m-0 print:shadow-none shadow-sm">
  <img data-eduai-prompt="${encodeURIComponent(enhancedPrompt)}"
       data-eduai-seed="${seed}"
       ${pendingAttr}
       src="${imageUrl}"
       loading="lazy"
       alt="${cleanPrompt}" 
       title="${cleanPrompt}"
       class="eduai-async-image w-full object-cover rounded-[1.8rem] aspect-[4/3] max-h-[360px] border border-slate-100 shadow-inner print:rounded-none print:shadow-none" 
       referrerPolicy="no-referrer" />
  <p class="hidden print:block text-[11px] text-slate-700 italic mt-1.5 font-serif text-center border-t border-slate-200 pt-1">[Print Visual Description: ${cleanPrompt}]</p>
  <div class="px-4 py-2 border-t border-dashed border-slate-200 mt-2 bg-white/50 rounded-b-[1.5rem] flex items-center justify-between print:hidden select-none">
    <div class="flex items-center gap-2">
      <span class="text-xs">🎨</span>
      <p class="eduai-illustration-label uppercase tracking-widest font-black leading-none">
        CAPS Illustration: ${cleanPrompt.slice(0, 45)}${cleanPrompt.length > 45 ? '...' : ''}
      </p>
    </div>
    <span class="eduai-illustration-label px-2 py-0.5 rounded bg-slate-100 font-bold select-none uppercase">Image chain: ${providerChain}</span>
  </div>
</div>
    `;
  };

  const bracketRegex = /\[(?:(?:(?:School|Official|Concept|Mini|Header|Banner|Visual|Insert|Add|Printable)\s+)*(?:Illustration|Image|Diagram|Graphic|Placeholder|Visual|Photo|Picture|Figure|Chart|Map|Infographic|Logo|Stamp|Seal|Icon|Crest|Signature|Drawing|Artwork)(?:\s+(?:Placeholder|Description|Prompt|Aid|of|showing|depicting))?|(?:Illustration|Image|Visual|Graphic|Logo|Stamp|Seal|Photo|Picture|Diagram|Figure|Chart|Map|Crest)\s+Description|Placeholder\s+(?:Image|Illustration|Logo|Stamp|Seal|Photo|Visual|Crest)|Image\s+description|Illustration\s+description)\s*(?::|—|-|\s+of\s+|\s+showing\s+|\s+depicting\s+)?\s*([^\]]+)\]/gi;

  let processed = html.replace(bracketRegex, (match, p1) => {
    return buildImageBlock(p1.trim());
  });

  // Replace markdown images ![alt](url) where url is a placeholder, empty, or #
  processed = processed.replace(/!\[([^\]]*)\]\((?:#|""|''|http:\/\/via\.placeholder|https:\/\/via\.placeholder|placeholder[^)]*|example\.com[^)]*)\)/gi, (match, alt) => {
    if (alt && alt.trim()) {
      return buildImageBlock(alt.trim());
    }
    return '';
  });

  // Replace HTML <img ...> where src is broken/placeholder/empty/via.placeholder/#
  processed = processed.replace(/<img\s+[^>]*src=["'](?:#|""|''|http:\/\/via\.placeholder|https:\/\/via\.placeholder|placeholder[^"']*|example\.com[^"']*)["'][^>]*>/gi, (match) => {
    const altMatch = match.match(/alt=["']([^"']+)["']/i) || match.match(/title=["']([^"']+)["']/i);
    if (altMatch && altMatch[1]) {
      return buildImageBlock(altMatch[1].trim());
    }
    return '';
  });

  return processed;
}
