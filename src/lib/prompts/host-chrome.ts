/**
 * Current EduAI document chrome contract for every generated content prompt.
 * The renderer in `contentTemplate.ts` remains the single source of truth for
 * the current compact page header, one content banner, and canonical footer.
 */
export const EDUAI_HOST_CHROME_RULE = `
CURRENT EDUAI HOST CHROME — REQUIRED FOR ALL GENERATED CONTENT:
- Return only the useful document body/content fragment. The application renders the current EduAI content header, exactly one branded content banner (including document labels and compliance details), and exactly one canonical footer.
- Do not generate a second page/document header, school letterhead, cover/title banner, metadata badge strip, compliance row, brand/footer line, watermark, or page-level footer. Do not wrap the fragment in <html>, <head>, or <body>, and do not add Tailwind CDN scripts or external stylesheets.
- Begin with the requested educational material. Internal section headings, question labels, lesson steps, answer spaces, signature fields, and blank learner Name/Date fields are body content and may be included when useful; leave blank fields blank. Do not repeat document title, grade, subject, term, date, or other values already shown in the host banner as another top-of-page block.
- Use semantic HTML and the requested output schema. The host owns the page-level layout and print chrome; keep the document body self-contained and print-friendly.`;
