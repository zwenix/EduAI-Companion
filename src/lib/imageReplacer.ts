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

export function replaceImagePlaceholders(html: string, allowImages: boolean = true): string {
  if (!html) return '';

  // Matches various placeholder formats like [Illustration: ...], [Image: ...], [Diagram: ...]
  const regex = /\[(?:Illustration|Image|Concept\s+Illustration|Diagram|Graphic):\s*([^\]]+)\]/gi;

  let seedCounter = Math.floor(Math.random() * 100000);

  return html.replace(regex, (match, p1) => {
    const cleanPrompt = p1.trim();
    seedCounter += 1;

    if (!allowImages) {
      return `
<div class="my-4 p-4 border border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center text-slate-500 font-medium text-xs">
  📸 Illustration Placeholder: ${cleanPrompt.slice(0, 80)}${cleanPrompt.length > 80 ? '...' : ''}
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
       class="w-full object-cover rounded-[1.8rem] aspect-[4/3] max-h-[360px] border border-slate-100 shadow-inner print:rounded-none print:shadow-none" 
       referrerPolicy="no-referrer" />
  <div class="px-4 py-2 border-t border-dashed border-slate-150 mt-2 bg-slate-50/55 rounded-b-[1.5rem] flex items-center justify-between print:hidden select-none">
    <div class="flex items-center gap-2">
      <span class="text-xs">💾</span>
      <p class="text-[9px] uppercase tracking-widest font-black text-emerald-600 leading-none">
        Cached Library Asset: ${cleanPrompt.slice(0, 45)}${cleanPrompt.length > 45 ? '...' : ''}
      </p>
    </div>
    <span class="text-[8px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold select-none uppercase">Synced</span>
  </div>
</div>
      `;
    }

    // Fallback/First-generation flow
    const provider = typeof window !== 'undefined'
      ? window.localStorage.getItem('eduai_image_provider') || 'pollinations'
      : 'pollinations';

    const enhancedPrompt = `${cleanPrompt}, World-class masterpiece work of art, crisp render, sharp focus, charmingly aesthetic design, 4k, soft lighting, masterpiece emoji-style figurine 3D render, 3D Disney Character render, pure white background, natural beauty`;
    
    // Use the backend proxy to bypass school network firewalls blocking external generation sites
    const imageUrl = `/api/image-proxy?prompt=${encodeURIComponent(enhancedPrompt)}&width=800&height=600&seed=${seedCounter}`;

    // Async save to firestore in background (non-blocking)
    IllustrationCache.save(cleanPrompt, imageUrl);

    return `
<div class="my-6 overflow-hidden rounded-[2rem] border-2 border-dashed border-slate-300 p-2 bg-slate-50/50 hover:bg-slate-100 transition-all duration-300 max-w-full print:break-inside-avoid print:border-none print:p-0 print:m-0 print:shadow-none shadow-sm">
  <img src="${imageUrl}" 
       alt="${cleanPrompt}" 
       class="w-full object-cover rounded-[1.8rem] aspect-[4/3] max-h-[360px] border border-slate-100 shadow-inner print:rounded-none print:shadow-none" 
       referrerPolicy="no-referrer" />
  <div class="px-4 py-2 border-t border-dashed border-slate-200 mt-2 bg-white/50 rounded-b-[1.5rem] flex items-center gap-2 print:hidden select-none">
    <span class="text-xs">🎨</span>
    <p class="text-[9px] uppercase tracking-widest font-black text-slate-500 leading-none">
      CAPS Illustration: ${cleanPrompt.slice(0, 60)}${cleanPrompt.length > 60 ? '...' : ''}
    </p>
  </div>
</div>
    `;
  });
}
