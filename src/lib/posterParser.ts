export interface ParsedPoster {
  isPoster: boolean;
  bannerHtml?: string;
  heroHtml?: string;
  cardsHtml: string[];
  takeawaysHtml?: string;
  footerHtml?: string;
  outerClasses?: string;
}

export function parsePosterHtml(html: string): ParsedPoster {
  if (!html) return { isPoster: false, cardsHtml: [] };

  // Quick check if this resembles a poster
  if (!html.includes('poster-container') && !html.includes('content-card')) {
    return { isPoster: false, cardsHtml: [] };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const posterContainer = doc.querySelector('.poster-container');
    if (!posterContainer && !doc.querySelector('.content-card')) {
      return { isPoster: false, cardsHtml: [] };
    }

    const outerClasses = posterContainer?.className || "poster-container max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden";
    
    const banner = doc.querySelector('.banner');
    const hero = doc.querySelector('.hero-section') || doc.querySelector('.hero-illustration');
    const cards = Array.from(doc.querySelectorAll('.content-card'));
    const takeaways = doc.querySelector('.takeaways');
    const footer = doc.querySelector('.footer');

    return {
      isPoster: true,
      outerClasses,
      bannerHtml: banner?.innerHTML || '',
      heroHtml: hero?.innerHTML || '',
      cardsHtml: cards.map(c => c.innerHTML),
      takeawaysHtml: takeaways?.innerHTML || '',
      footerHtml: footer?.innerHTML || ''
    };
  } catch (error) {
    console.error("Failed to parse poster HTML:", error);
    return { isPoster: false, cardsHtml: [] };
  }
}
