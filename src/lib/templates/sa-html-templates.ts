// ============================================================
// sa-html-templates.ts
// South African School-Branded HTML Templates for PDF/DOCX
// Enhanced for EduAI Companion — Merged from CAPS Document
// ============================================================

import {
  buildTemplateHeaderHTML,
  buildTemplateFooterHTML,
  buildTemplateStyleHTML,
  buildTemplateComplianceBannerHTML,
  cleanGeneratedBodyHTML,
  collapseLeadingChrome,
  mergeMeta,
  EDUAI_BANNER_GRADIENT,
  bannerGradientFor,
  ContentTemplateMeta
} from "../contentTemplate";

export interface RenderedSection {
  sectionId: number;
  heading: string;
  content: string;
  bulletPoints?: string[];
  bloomsLevel?: string | null;
  marks?: number | null;
  siasNotes?: string | null;
  differentiatedContent?: {
    core: string;
    extended?: string | null;
    simplified?: string | null;
  } | null;
}

export interface RenderedImage {
  imageId: string;
  sectionId: number;
  base64Data: string; // base64 or URL
  placement: "header" | "inline" | "full_width" | "sidebar" | string;
  altText?: string;
  url?: string; // direct URL fallback
}

export interface DocumentData {
  metadata: {
    title: string;
    subject: string;
    grade: string;
    phase: string;
    term: number;
    capsReference?: string;
    capsCode?: string;
    atpWeek?: string;
    contentType: string;
    duration?: string | null;
    totalMarks?: number | null;
    bloomsDistribution?: Record<string, number>;
    generatedDate?: string;
    npaCompliance?: {
      assessmentType?: string | null;
      isFormal?: boolean;
      sbaWeight?: number;
      examWeight?: number;
    };
    siasCompliance?: {
      supportLevel?: string;
      accommodationsIncluded?: boolean;
      differentiationIncluded?: boolean;
    };
    schoolBranding?: {
      name?: string;
      district?: string;
      province?: string;
      emis?: string;
      address?: string;
    };
  };
  sections: RenderedSection[];
  imagePrompts?: Array<{
    imageId: string;
    sectionId: number;
    accessibilityAltText?: string;
    prompt?: string;
  }>;
  siasSupport?: {
    supportLevel: string;
    teacherNotes: string;
    accommodations: string[];
    referralGuidance?: string | null;
  } | null;
  answerKey?: {
    questions: Array<{
      questionNumber: number;
      answer: string;
      bloomsLevel: string;
      marks: number;
      cognitiveLevel: string;
    }>;
    totalMarks: number;
  } | null;
  npaRatingTable?: Array<{
    code: number;
    description: string;
    percentage: string;
  }> | null;
  content?: string; // Pre-rendered HTML from AI
}

// ── School branding — defaults, can be overridden via env or metadata ──
const getSchoolBranding = (metadata?: DocumentData["metadata"]) => {
  const fallback = {
    name: metadata?.schoolBranding?.name || "Department of Basic Education",
    district: metadata?.schoolBranding?.district || "District Office",
    province: metadata?.schoolBranding?.province || "Province",
    emis: metadata?.schoolBranding?.emis || "",
    address: metadata?.schoolBranding?.address || "Republic of South Africa",
    tel: "",
    email: "",
    principal: ""
  };

  // Try to read from localStorage if available (client-side school settings)
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("eduai_school_branding");
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...fallback, ...parsed, ...metadata?.schoolBranding };
      }
    } catch {}
  }

  // Try env variables (Vite)
  try {
    const env = (import.meta as any).env || {};
    return {
      name: env.VITE_SCHOOL_NAME || fallback.name,
      district: env.VITE_SCHOOL_DISTRICT || fallback.district,
      province: env.VITE_SCHOOL_PROVINCE || fallback.province,
      emis: env.VITE_SCHOOL_EMIS_NUMBER || fallback.emis,
      address: env.VITE_SCHOOL_ADDRESS || fallback.address,
      tel: env.VITE_SCHOOL_TEL || fallback.tel,
      email: env.VITE_SCHOOL_EMAIL || fallback.email,
      principal: env.VITE_SCHOOL_PRINCIPAL || fallback.principal
    };
  } catch {
    return fallback;
  }
};

// ── SA Flag Colours ──
export const SA_COLOURS = {
  green: "#007749",
  gold: "#FFB81C",
  black: "#000000",
  red: "#DE3831",
  blue: "#002395",
  white: "#FFFFFF",
  lightGreen: "#f0f7f0",
  darkGreen: "#005c3a"
};

// ── CSS Shared Styles — Enhanced for classroom print ──
export const SA_BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Patrick+Hand&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    background: white;
    padding: 0;
    margin: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm 20mm;
    margin: 0 auto;
    background: white;
    position: relative;
  }

  /* ── SA FLAG STRIPE HEADER ── */
  .sa-flag-stripe {
    height: 6px;
    background: linear-gradient(
      to right,
      ${SA_COLOURS.black} 0%, ${SA_COLOURS.black} 16.6%,
      ${SA_COLOURS.gold} 16.6%, ${SA_COLOURS.gold} 33.3%,
      ${SA_COLOURS.green} 33.3%, ${SA_COLOURS.green} 50%,
      ${SA_COLOURS.white} 50%, ${SA_COLOURS.white} 66.6%,
      ${SA_COLOURS.red} 66.6%, ${SA_COLOURS.red} 83.3%,
      ${SA_COLOURS.blue} 83.3%, ${SA_COLOURS.blue} 100%
    );
    width: 100%;
    margin-bottom: 12px;
    border-radius: 3px;
  }

  /* Generated top banners always use the SAME two-colour palette gradient as
     the host-owned banner — published as --eduai-banner-gradient on <body> —
     even when an AI fragment uses a generic header class. */
  .ai-generated-content header:not(.site-header),
  .ai-generated-content .content-banner,
  .ai-generated-content .top-banner,
  .ai-generated-content .header-banner,
  .ai-generated-content .banner,
  .ai-generated-content [class*="banner"] {
    background: var(--eduai-banner-gradient, ${EDUAI_BANNER_GRADIENT}) !important;
    background-image: var(--eduai-banner-gradient, ${EDUAI_BANNER_GRADIENT}) !important;
    color: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .ai-generated-content header:not(.site-header) *,
  .ai-generated-content .content-banner *,
  .ai-generated-content .top-banner *,
  .ai-generated-content .header-banner *,
  .ai-generated-content .banner * { color: inherit; }

  /* Direct generated banners use the complete printable page width. */
  .ai-generated-content > header:not(.site-header),
  .ai-generated-content > .content-banner,
  .ai-generated-content > .top-banner,
  .ai-generated-content > .header-banner,
  .ai-generated-content > .banner {
    width: calc(100% + 40mm) !important;
    max-width: none;
    margin-left: -20mm !important;
    margin-right: -20mm !important;
    box-sizing: border-box;
  }

  /* ── SINGLE DOCUMENT BANNER (see contentTemplate.ts) ──
     Title, every label, the school letterhead, the CAPS reference/ATP week and
     the compliance data all live inside ONE banner now, so the old school
     header, document title block and CAPS reference bar are gone: they each
     repeated information the banner already carries. */

  /* ── CONTENT SECTIONS ── */
  .section {
    margin-bottom: 18px;
    page-break-inside: avoid;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .section-heading {
    /* Two-colour VERTICAL gradient — no band in generated content is ever a
       solid fill (the ONE document banner works the same way). */
    background: linear-gradient(180deg, ${SA_COLOURS.green} 0%, ${SA_COLOURS.darkGreen} 100%);
    background-image: linear-gradient(180deg, ${SA_COLOURS.green} 0%, ${SA_COLOURS.darkGreen} 100%);
    color: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding: 10px 16px;
    font-size: 11.5pt;
    font-weight: 700;
    border-radius: 8px 8px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .section-heading .blooms-tag {
    background: ${SA_COLOURS.gold};
    color: #333;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 0.3px;
  }

  .section-heading .marks-tag {
    background: ${SA_COLOURS.blue};
    color: white;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 8pt;
    font-weight: 700;
  }

  .section-body {
    border: 1px solid #e5e7eb;
    border-top: none;
    padding: 14px 16px;
    border-radius: 0 0 8px 8px;
    background: #fafafa;
  }

  .section-body p {
    margin-bottom: 10px;
    line-height: 1.7;
  }

  .section-body ul, .section-body ol {
    padding-left: 22px;
    margin-bottom: 10px;
  }

  .section-body li {
    margin-bottom: 5px;
    line-height: 1.6;
  }

  /* ── DIFFERENTIATION BOX (WP6) ── */
  .diff-box {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin: 12px 0;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }

  .diff-header {
    padding: 7px 14px;
    font-size: 9.5pt;
    font-weight: 700;
    color: white;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Differentiation bands: the same two-colour VERTICAL gradient treatment. */
  .diff-core .diff-header {
    background: linear-gradient(180deg, ${SA_COLOURS.green} 0%, ${SA_COLOURS.darkGreen} 100%);
    background-image: linear-gradient(180deg, ${SA_COLOURS.green} 0%, ${SA_COLOURS.darkGreen} 100%);
  }
  .diff-extended .diff-header {
    background: linear-gradient(180deg, ${SA_COLOURS.blue} 0%, #001a6e 100%);
    background-image: linear-gradient(180deg, ${SA_COLOURS.blue} 0%, #001a6e 100%);
  }
  .diff-simplified .diff-header {
    background: linear-gradient(180deg, ${SA_COLOURS.gold} 0%, #e0a200 100%);
    background-image: linear-gradient(180deg, ${SA_COLOURS.gold} 0%, #e0a200 100%);
    color: #333;
  }

  .diff-content {
    padding: 10px 14px;
    font-size: 10.5pt;
    background: white;
    line-height: 1.6;
  }

  /* ── SIAS SUPPORT BOX ── */
  .sias-box {
    background: #fffbeb;
    border: 1px solid ${SA_COLOURS.gold};
    border-left: 4px solid ${SA_COLOURS.gold};
    border-radius: 0 8px 8px 0;
    padding: 12px 16px;
    margin: 12px 0;
    font-size: 9.5pt;
    box-shadow: 0 1px 2px rgba(255,184,28,0.1);
  }

  .sias-box .sias-title {
    font-weight: 800;
    color: #92400e;
    margin-bottom: 6px;
    font-size: 10pt;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── NPA RATING TABLE ── */
  .npa-table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 9.5pt;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .npa-table th {
    /* Two-colour vertical gradient, never a flat colour block. */
    background: linear-gradient(180deg, ${SA_COLOURS.green} 0%, ${SA_COLOURS.darkGreen} 100%);
    background-image: linear-gradient(180deg, ${SA_COLOURS.green} 0%, ${SA_COLOURS.darkGreen} 100%);
    color: white;
    padding: 8px 12px;
    text-align: left;
    font-weight: 700;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .npa-table td {
    padding: 7px 12px;
    border-bottom: 1px solid #f3f4f6;
  }

  .npa-table tr:nth-child(even) {
    background: #f9fafb;
  }

  .npa-table tr:hover {
    background: ${SA_COLOURS.lightGreen};
  }

  /* ── MARKS TABLE ── */
  .marks-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9.5pt;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .marks-table th {
    background: linear-gradient(180deg, ${SA_COLOURS.blue} 0%, #001a6e 100%);
    background-image: linear-gradient(180deg, ${SA_COLOURS.blue} 0%, #001a6e 100%);
    color: white;
    padding: 8px 12px;
    text-align: center;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    font-size: 8.5pt;
  }

  .marks-table td {
    padding: 7px 12px;
    text-align: center;
    border: 1px solid #e5e7eb;
  }

  .marks-table tr:nth-child(even) {
    background: #f8fafc;
  }

  /* ── ANSWER LINE / STUDENT SPACE ── */
  .answer-line {
    border-bottom: 1px solid #9ca3af;
    height: 26px;
    margin: 10px 0;
  }

  .answer-space {
    border: 1px dashed #d1d5db;
    min-height: 70px;
    margin: 10px 0;
    border-radius: 6px;
    background: #fcfcfc;
  }

  /* ── IMAGE CONTAINER ── */
  .img-container {
    text-align: center;
    margin: 14px 0;
    page-break-inside: avoid;
  }

  .img-container img {
    max-width: 100%;
    max-height: 400px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    border: 1px solid #f3f4f6;
  }

  .img-container .img-alt {
    font-size: 8pt;
    color: #6b7280;
    font-style: italic;
    margin-top: 6px;
    line-height: 1.4;
  }

  .eduai-illustration-label {
    font-size: 7pt;
    color: #0a0f21;
    opacity: 0.3;
    font-style: italic;
    margin-top: 4px;
    text-align: center;
  }

  /* ── FOOTER ── */
  /* POPIA notice sits directly above the navy EduAI template footer band. */
  .popia-notice-block {
    margin-top: 30px;
    padding: 8px 2px;
    font-size: 7.5pt;
    font-style: italic;
    color: #6b7280;
    line-height: 1.4;
    text-align: center;
  }

  .page-footer .popia-notice {
    font-style: italic;
    color: #9ca3af;
    max-width: 60%;
  }

  /* ── COMPLIANCE STAMP ── */
  .compliance-stamp {
    display: inline-flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 10px 0;
  }

  .compliance-stamp .stamp {
    background: ${SA_COLOURS.lightGreen};
    border: 1px solid ${SA_COLOURS.green};
    color: ${SA_COLOURS.green};
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  /* ── PRINT STYLES ── */
  @media print {
    body { padding: 0; background: white; }
    .page { width: 100%; padding: 10mm 15mm; min-height: auto; margin: 0; box-shadow: none; }
    .section { page-break-inside: avoid; box-shadow: none; }
    .no-print { display: none; }
    .section-heading { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    /* The single document banner keeps its two-colour gradient on paper. */
    .eduai-compliance-banner { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .page { width: 100%; padding: 10mm; }
  }
`;

// ── HTML DOCUMENT BUILDER ──

/**
 * Map SA pipeline document metadata onto the official EduAI LIGHT Template v5
 * so structured CAPS documents carry the same branding as every other
 * generated resource — and so EVERYTHING a reader or auditor needs (title,
 * grade/subject/type/term/duration/marks/date, the school letterhead, the CAPS
 * reference and the compliance labels) ends up inside the ONE document banner
 * instead of being spread across several bands at the top of the page.
 */
function templateMetaFromData(
  data: DocumentData,
  today: string,
  school?: { name?: string; address?: string; tel?: string; email?: string; emis?: string; province?: string; district?: string },
): ContentTemplateMeta {
  const blooms = data.metadata.bloomsDistribution
    ? Object.entries(data.metadata.bloomsDistribution)
        .map(([level, share]) => `${level.charAt(0).toUpperCase() + level.slice(1)}: ${share}%`)
        .join(" · ")
    : "";

  // The school letterhead travels inside the banner, so no second school band
  // repeats the same names, province, district and EMIS number above it. Each
  // part is written once: a value already present is never repeated.
  const withSuffix = (value: string | undefined, suffix: string): string => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    return new RegExp(`${suffix}\\s*$`, "i").test(raw) ? raw : `${raw} ${suffix}`;
  };
  const seen: string[] = [];
  const unique = (value: string): string => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const key = raw.toLowerCase();
    if (seen.some((existing) => existing.includes(key))) return "";
    seen.push(key);
    return raw;
  };
  const letterhead = school
    ? [
        unique(school.name),
        unique(school.address),
        unique(school.tel ? `Tel: ${school.tel}` : ""),
        unique(school.email ? `Email: ${school.email}` : ""),
        unique(school.emis ? `EMIS: ${school.emis}` : ""),
        unique(withSuffix(school.province, "Province")),
        unique(withSuffix(school.district, "District")),
        /basic education/i.test(String(school.name ?? "")) ? "" : "Department of Basic Education",
      ]
        .filter(Boolean)
        .join(" • ")
    : "";

  return {
    title: data.metadata.title,
    subject: data.metadata.subject,
    grade: String(data.metadata.grade ?? ""),
    term: data.metadata.term ? `Term ${data.metadata.term}` : undefined,
    contentType: data.metadata.contentType || "CAPS Educational Resource",
    capsCode: data.metadata.capsCode,
    date: today,
    capsReference: cleanGeneratedText(data.metadata.capsReference),
    atpWeek: data.metadata.atpWeek ? `Week ${String(data.metadata.atpWeek).replace(/^week\s*/i, "")}` : undefined,
    // The merged banner owns phase / duration / total marks as first-class
    // slots now (marks pill + the "Total: ___ / N" record field), so they are
    // no longer smuggled in as extra pills that could duplicate them.
    phase: data.metadata.phase ? withSuffix(data.metadata.phase, "Phase") : undefined,
    duration: data.metadata.duration || undefined,
    totalMarks: data.metadata.totalMarks ?? undefined,
    extraNotes: [letterhead, blooms ? `Bloom's — ${blooms}` : ""].filter(Boolean),
  };
}

/** Remove model-authored compliance/footer text from individual structured fields. */
const cleanGeneratedText = (value: unknown): string => cleanGeneratedBodyHTML(String(value ?? ""))
  .replace(/<br\s*\/?>(?=\S)/gi, "\n")
  .replace(/<[^>]*>/g, "")
  .trim();

const cleanGeneratedFragment = (value: unknown): string =>
  // Differentiation/memo fragments also lose any band they open with, so a
  // school header or CAPS bar repeated inside a section cannot survive either.
  collapseLeadingChrome(cleanGeneratedBodyHTML(String(value ?? ""))).html;

export function buildFullHTML(
  data: DocumentData,
  images: RenderedImage[] = []
): string {
  const school = getSchoolBranding(data.metadata);
  const imageMap = new Map(images.map(img => [img.sectionId, img]));
  const today = data.metadata.generatedDate || new Date().toLocaleDateString("en-ZA", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });

  // If content already contains full HTML (from AI), wrap it with SA branding header/footer
  if (data.content && data.content.includes("<") && data.content.length > 500) {
    // Check if it's already a full HTML document
    // Models sometimes return a complete HTML document with their own
    // compliance badges/footer. Reduce it to a body fragment and let the host
    // template render one canonical compliance banner and footer.
    return wrapContentWithSABranding(data, cleanGeneratedBodyHTML(data.content), school, today);
  }

  // ── Build sections HTML from structured data ──
  let sectionsHTML = "";
  for (const section of data.sections || []) {
    const img = imageMap.get(section.sectionId);
    const imgSpec = data.imagePrompts?.find(ip => ip.sectionId === section.sectionId);
    const imgSrc = img?.base64Data ? (img.base64Data.startsWith("http") || img.base64Data.startsWith("data:") ? img.base64Data : `data:image/png;base64,${img.base64Data}`) : img?.url || "";

    const sectionContent = collapseLeadingChrome(cleanGeneratedBodyHTML(section.content || '')).html.replace(/\n/g, '<br>');
    sectionsHTML += `
    <div class="section">
      <div class="section-heading">
        <span>${escapeHtml(section.heading)}</span>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${section.bloomsLevel ? `<span class="blooms-tag">🧠 ${escapeHtml(section.bloomsLevel)}</span>` : ""}
          ${section.marks ? `<span class="marks-tag">📝 ${section.marks} marks</span>` : ""}
        </div>
      </div>
      <div class="section-body">
        <p>${sectionContent}</p>

        ${section.bulletPoints?.length ? `
        <ul>${section.bulletPoints.map(bp => `<li>${escapeHtml(cleanGeneratedText(bp))}</li>`).join("")}</ul>` : ""}

        ${imgSrc ? `
        <div class="img-container">
          <img src="${imgSrc}"
               alt="${escapeHtml(imgSpec?.accessibilityAltText || section.heading)}">
          <div class="img-alt">${escapeHtml(imgSpec?.accessibilityAltText || "")}</div>
        </div>` : ""}

        ${section.differentiatedContent ? `
        <div class="diff-box diff-core">
          <div class="diff-header">📗 Core Activity (All Learners)</div>
          <div class="diff-content">${cleanGeneratedFragment(section.differentiatedContent.core)}</div>
        </div>
        ${section.differentiatedContent.extended ? `
        <div class="diff-box diff-extended">
          <div class="diff-header">📘 Extended Activity (Advanced Learners)</div>
          <div class="diff-content">${cleanGeneratedFragment(section.differentiatedContent.extended)}</div>
        </div>` : ""}
        ${section.differentiatedContent.simplified ? `
        <div class="diff-box diff-simplified">
          <div class="diff-header">📙 Simplified Activity (Support Learners)</div>
          <div class="diff-content">${cleanGeneratedFragment(section.differentiatedContent.simplified)}</div>
        </div>` : ""}` : ""}

        ${section.siasNotes ? `
        <div class="sias-box">
          <div class="sias-title">🤝 SIAS Support Notes (Teacher Use Only)</div>
          <p>${escapeHtml(cleanGeneratedText(section.siasNotes))}</p>
        </div>` : ""}
      </div>
    </div>`;
  }

  // ── SIAS Support Section ──
  let siasHTML = "";
  if (data.siasSupport) {
    siasHTML = `
    <div class="section">
      <div class="section-heading" style="background: linear-gradient(180deg, ${SA_COLOURS.gold} 0%, #e0a200 100%); background-image: linear-gradient(180deg, ${SA_COLOURS.gold} 0%, #e0a200 100%); color: #333;">
        <span>🤝 Inclusive teaching support (SIAS)</span>
        <span class="blooms-tag" style="background:#333;color:white;">${escapeHtml(data.siasSupport.supportLevel)}</span>
      </div>
      <div class="section-body">
        <p><strong>Teacher Notes:</strong> ${escapeHtml(cleanGeneratedText(data.siasSupport.teacherNotes))}</p>
        <p style="margin-top:8px;"><strong>Accommodations:</strong></p>
        <ul>${data.siasSupport.accommodations.map(a => `<li>${escapeHtml(cleanGeneratedText(a))}</li>`).join("")}</ul>
        ${data.siasSupport.referralGuidance ? `
        <div class="sias-box">
          <div class="sias-title">⚠️ Referral Guidance</div>
          <p>${escapeHtml(cleanGeneratedText(data.siasSupport.referralGuidance))}</p>
        </div>` : ""}
      </div>
    </div>`;
  }

  // ── Answer Key ──
  let answerKeyHTML = "";
  if (data.answerKey?.questions?.length) {
    answerKeyHTML = `
    <div class="section" style="page-break-before: always;">
      <div class="section-heading" style="background: linear-gradient(180deg, ${SA_COLOURS.blue} 0%, #001a6e 100%); background-image: linear-gradient(180deg, ${SA_COLOURS.blue} 0%, #001a6e 100%);">
        <span>📝 Memorandum / Answer Key</span>
        <span class="blooms-tag">Total: ${data.answerKey.totalMarks} marks</span>
      </div>
      <div class="section-body">
        <table class="marks-table">
          <thead>
            <tr>
              <th>Q#</th><th>Answer</th><th>Bloom's Level</th>
              <th>Cognitive Level</th><th>Marks</th>
            </tr>
          </thead>
          <tbody>
            ${data.answerKey.questions.map(q => `
            <tr>
              <td><strong>${q.questionNumber}</strong></td>
              <td style="text-align:left">${escapeHtml(cleanGeneratedText(q.answer))}</td>
              <td>${escapeHtml(q.bloomsLevel)}</td>
              <td>${escapeHtml(q.cognitiveLevel)}</td>
              <td><strong>${q.marks}</strong></td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  // ── NPA Rating Table ──
  let npaTableHTML = "";
  if (data.npaRatingTable?.length) {
    npaTableHTML = `
    <div class="section">
      <div class="section-heading">
        <span>📊 NPA 7-Point Rating Scale (DBE Official)</span>
      </div>
      <div class="section-body">
        <table class="npa-table">
          <thead><tr><th>Code</th><th>Description</th><th>Percentage</th></tr></thead>
          <tbody>
            ${data.npaRatingTable.map(r => `
            <tr><td><strong>${r.code}</strong></td><td>${escapeHtml(r.description)}</td><td>${escapeHtml(r.percentage)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  // ── FULL HTML ──
  // ONE metadata object and ONE banner palette for the whole document: the
  // header, the banner, the repainted generated bands and the footer all read
  // from the same content-type palette (bright two-colour vertical gradient).
  const templateMeta = templateMetaFromData(data, today, school);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.metadata.title)} — EduAI Companion</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${SA_BASE_CSS}</style>
  ${buildTemplateStyleHTML()}
</head>
<body style="--eduai-banner-gradient: ${bannerGradientFor(templateMeta.contentType, templateMeta.palette)};">
  <div class="page">

    <!-- EduAI LIGHT Template v5 — very light blue translucent header bar (brand only) -->
    ${buildTemplateHeaderHTML(templateMeta)}

    <!-- SA Flag Stripe -->
    <div class="sa-flag-stripe"></div>

    <!-- THE single document banner: title, every label, the school letterhead,
         the CAPS reference / ATP week and the compliance data — written once. -->
    ${buildTemplateComplianceBannerHTML(templateMeta)}

    <!-- Content Sections -->
    ${sectionsHTML || `<div class="section"><div class="section-body"><p>No structured sections — see content below.</p></div></div>`}

    <!-- SIAS Support -->
    ${siasHTML}

    <!-- NPA Rating Table -->
    ${npaTableHTML}

    <!-- Answer Key / Memorandum -->
    ${answerKeyHTML}

    <!-- Footer -->
    ${buildTemplateFooterHTML(templateMeta)}

  </div>
</body>
</html>`;
}

function wrapContentWithSABranding(data: DocumentData, content: string, school: any, today: string): string {
  // The AI fragment is reduced to body content first, then every band it opens
  // with (school header, CAPS reference bar, formal header, meta row, a second
  // banner) is absorbed into the ONE document banner below. The band's values
  // are harvested, never rendered twice.
  const collapsed = collapseLeadingChrome(cleanGeneratedBodyHTML(content));
  const templateMeta = mergeMeta(collapsed.meta, templateMetaFromData(data, today, school));
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.metadata.title)} — EduAI Companion</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${SA_BASE_CSS}</style>
  ${buildTemplateStyleHTML()}
</head>
<body style="--eduai-banner-gradient: ${bannerGradientFor(templateMeta.contentType, templateMeta.palette)};">
  <div class="page">
    <!-- EduAI LIGHT Template v5 — very light blue translucent header bar (brand only) -->
    ${buildTemplateHeaderHTML(templateMeta)}

    <div class="sa-flag-stripe"></div>

    <!-- THE single document banner: title, every label, the school letterhead,
         the CAPS reference / ATP week and the compliance data — written once. -->
    ${buildTemplateComplianceBannerHTML(templateMeta)}

    <div class="ai-generated-content">
      ${collapsed.html}
    </div>

    ${buildTemplateFooterHTML(templateMeta)}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildMinimalSADocument(
  title: string,
  subject: string,
  grade: string,
  term: number,
  content: string,
  options: {
    phase?: string;
    capsReference?: string;
    totalMarks?: number;
    duration?: string;
    includeNPA?: boolean;
    includeSIAS?: boolean;
    includeWP6?: boolean;
  } = {}
): DocumentData {
  return {
    metadata: {
      title,
      subject,
      grade,
      phase: options.phase || "Intermediate Phase",
      term,
      capsReference: options.capsReference || `${subject} — ${grade} — Term ${term}`,
      contentType: "worksheet",
      duration: options.duration || null,
      totalMarks: options.totalMarks || null,
      generatedDate: new Date().toLocaleDateString("en-ZA"),
      siasCompliance: {
        accommodationsIncluded: !!options.includeSIAS,
        differentiationIncluded: !!options.includeWP6,
        supportLevel: "level_1"
      },
      npaCompliance: {
        isFormal: !!options.includeNPA,
        assessmentType: options.includeNPA ? "worksheet" : "informal"
      }
    },
    sections: [
      {
        sectionId: 1,
        heading: title,
        content: content,
        bloomsLevel: null,
        marks: options.totalMarks || null
      }
    ]
  };
}

export default {
  SA_BASE_CSS,
  SA_COLOURS,
  buildFullHTML,
  buildMinimalSADocument,
  wrapContentWithSABranding
};
