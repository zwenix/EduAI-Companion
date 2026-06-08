import { collection, onSnapshot, query, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

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

export function replaceImagePlaceholders(html: string): string {
  if (!html) return '';

  // Matches various placeholder formats like [Illustration: ...], [Image: ...], [Diagram: ...]
  // Supports: escaped brackets like \[Illustration: ...\], spaces inside/around brackets, colons/dashes/equal signs, and alternative prefixes
  const regex = /\\?\[\s*(?:Illustration|Image|Concept\s+Illustration|Diagram|Graphic|Visual|Picture|Sketch|Photo|Drawing|Chart|Infographic|Map)\s*[:=-]\s*([^\]\\]+)\\?\]/gi;

  let seedCounter = Math.floor(Math.random() * 100000);

  return html.replace(regex, (match, p1) => {
    let cleanPrompt = p1.trim();
    // Safely strip any leading/trailing quote, backslash or space relics
    cleanPrompt = cleanPrompt.replace(/^['"\s\\]+|['"\s\\]+$/g, '').trim();
    
    if (!cleanPrompt) return '';
    
    seedCounter += 1;

    // Direct AI-generation flow (completely bypassing cached library as requested)
    const enhancedPrompt = `${cleanPrompt}, professional children's educational book illustration style, pencil sketch and clean watercolor painting blend, rich vibrant colors, high detail, no text overlays, South African classroom display, 300 DPI`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=800&height=600&nologo=true&model=flux&seed=${seedCounter}`;

    return `
<div class="my-6 overflow-hidden rounded-[2rem] border-2 border-solid border-indigo-400 p-2 bg-indigo-50/20 hover:bg-indigo-50/40 transition-all duration-300 max-w-full print:break-inside-avoid print:border-none print:p-0 print:m-0 print:shadow-none shadow-sm">
  <img src="${imageUrl}" 
       alt="${cleanPrompt}" 
       class="w-full object-cover rounded-[1.8rem] aspect-[4/3] max-h-[360px] border border-indigo-100 shadow-inner print:rounded-none print:shadow-none" 
       referrerPolicy="no-referrer" />
  <div class="px-4 py-2 border-t border-dashed border-indigo-200 mt-2 bg-white/80 rounded-b-[1.5rem] flex items-center gap-2 print:hidden select-none">
    <span class="text-xs animate-pulse">✨</span>
    <p class="text-[9px] uppercase tracking-widest font-black text-indigo-700 leading-none">
      On-the-fly AI Visual: ${cleanPrompt.slice(0, 60)}${cleanPrompt.length > 60 ? '...' : ''}
    </p>
  </div>
</div>
    `;
  });
}
