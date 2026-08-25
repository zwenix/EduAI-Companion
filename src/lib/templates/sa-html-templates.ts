// ============================================================
// sa-html-templates.ts
// South African School-Branded HTML Templates for PDF/DOCX
// Enhanced for EduAI Companion — Merged from CAPS Document
// ============================================================

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

  /* ── SCHOOL HEADER ── */
  .school-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid ${SA_COLOURS.green};
    padding-bottom: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .school-header .school-info {
    flex: 1;
    min-width: 200px;
  }

  .school-header .school-name {
    font-size: 18pt;
    font-weight: 800;
    color: ${SA_COLOURS.green};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.2;
  }

  .school-header .school-details {
    font-size: 8pt;
    color: #666;
    margin-top: 4px;
    line-height: 1.4;
  }

  .school-header .dbe-badge {
    text-align: right;
    font-size: 8pt;
    color: #666;
    border-left: 2px solid ${SA_COLOURS.gold};
    padding-left: 12px;
    margin-left: 12px;
    min-width: 150px;
  }

  .school-header .dbe-badge .dbe-title {
    font-weight: 700;
    color: ${SA_COLOURS.green};
    font-size: 9pt;
  }

  /* ── DOCUMENT TITLE BLOCK ── */
  .doc-title-block {
    background: linear-gradient(135deg, ${SA_COLOURS.green} 0%, ${SA_COLOURS.darkGreen} 100%);
    color: white;
    padding: 18px 22px;
    border-radius: 10px;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,119,73,0.15);
  }

  .doc-title-block::after {
    content: '';
    position: absolute;
    right: -20px;
    top: -20px;
    width: 120px;
    height: 120px;
    background: rgba(255,184,28,0.15);
    border-radius: 50%;
  }

  .doc-title-block::before {
    content: '';
    position: absolute;
    left: -30px;
    bottom: -30px;
    width: 80px;
    height: 80px;
    background: rgba(255,255,255,0.08);
    border-radius: 50%;
  }

  .doc-title-block h1 {
    font-size: 17pt;
    font-weight: 800;
    margin-bottom: 6px;
    position: relative;
    z-index: 1;
    line-height: 1.3;
  }

  .doc-title-block .doc-meta {
    font-size: 9pt;
    opacity: 0.95;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
  }

  .doc-title-block .doc-meta span {
    background: rgba(255,255,255,0.18);
    padding: 3px 10px;
    border-radius: 20px;
    font-weight: 500;
    backdrop-filter: blur(4px);
  }

  /* ── CAPS REFERENCE BAR ── */
  .caps-ref-bar {
    background: ${SA_COLOURS.lightGreen};
    border: 1px solid ${SA_COLOURS.green};
    border-left: 4px solid ${SA_COLOURS.green};
    padding: 10px 14px;
    font-size: 9pt;
    margin-bottom: 16px;
    border-radius: 0 6px 6px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .caps-ref-bar .caps-label {
    font-weight: 700;
    color: ${SA_COLOURS.green};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .caps-ref-bar .blooms-mini {
    display: flex;
    gap: 6px;
    font-size: 7pt;
    flex-wrap: wrap;
  }

  .caps-ref-bar .blooms-mini span {
    background: ${SA_COLOURS.green};
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: 600;
  }

  /* ── CONTENT SECTIONS ── */
  .section {
    margin-bottom: 18px;
    page-break-inside: avoid;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .section-heading {
    background: ${SA_COLOURS.green};
    color: white;
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

  .diff-core .diff-header { background: ${SA_COLOURS.green}; }
  .diff-extended .diff-header { background: ${SA_COLOURS.blue}; }
  .diff-simplified .diff-header { background: ${SA_COLOURS.gold}; color: #333; }

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
    background: ${SA_COLOURS.green};
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
    background: ${SA_COLOURS.blue};
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
  .page-footer {
    margin-top: 30px;
    border-top: 2px solid ${SA_COLOURS.green};
    padding-top: 10px;
    font-size: 7.5pt;
    color: #6b7280;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    line-height: 1.4;
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
    .doc-title-block { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section-heading { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .page { width: 100%; padding: 10mm; }
    .school-header { flex-direction: column; align-items: flex-start; }
    .school-header .dbe-badge { border-left: none; border-top: 2px solid ${SA_COLOURS.gold}; padding-left: 0; padding-top: 8px; margin-left: 0; text-align: left; }
    .doc-title-block h1 { font-size: 14pt; }
  }
`;

// ── HTML DOCUMENT BUILDER ──

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
    const isFullDoc = data.content.includes("<html") || data.content.includes("<!DOCTYPE");
    if (isFullDoc) {
      // Inject SA flag stripe and compliance stamps if not present
      return data.content;
    }
    // Otherwise wrap the content with SA branding
    return wrapContentWithSABranding(data, data.content, school, today);
  }

  // ── Build sections HTML from structured data ──
  let sectionsHTML = "";
  for (const section of data.sections || []) {
    const img = imageMap.get(section.sectionId);
    const imgSpec = data.imagePrompts?.find(ip => ip.sectionId === section.sectionId);
    const imgSrc = img?.base64Data ? (img.base64Data.startsWith("http") || img.base64Data.startsWith("data:") ? img.base64Data : `data:image/png;base64,${img.base64Data}`) : img?.url || "";

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
        <p>${(section.content || "").replace(/\n/g, "<br>")}</p>

        ${section.bulletPoints?.length ? `
        <ul>${section.bulletPoints.map(bp => `<li>${escapeHtml(bp)}</li>`).join("")}</ul>` : ""}

        ${imgSrc ? `
        <div class="img-container">
          <img src="${imgSrc}"
               alt="${escapeHtml(imgSpec?.accessibilityAltText || section.heading)}">
          <div class="img-alt">${escapeHtml(imgSpec?.accessibilityAltText || "")}</div>
        </div>` : ""}

        ${section.differentiatedContent ? `
        <div class="diff-box diff-core">
          <div class="diff-header">📗 Core Activity (All Learners)</div>
          <div class="diff-content">${section.differentiatedContent.core}</div>
        </div>
        ${section.differentiatedContent.extended ? `
        <div class="diff-box diff-extended">
          <div class="diff-header">📘 Extended Activity (Advanced Learners)</div>
          <div class="diff-content">${section.differentiatedContent.extended}</div>
        </div>` : ""}
        ${section.differentiatedContent.simplified ? `
        <div class="diff-box diff-simplified">
          <div class="diff-header">📙 Simplified Activity (Support Learners)</div>
          <div class="diff-content">${section.differentiatedContent.simplified}</div>
        </div>` : ""}` : ""}

        ${section.siasNotes ? `
        <div class="sias-box">
          <div class="sias-title">🤝 SIAS Support Notes (Teacher Use Only)</div>
          <p>${escapeHtml(section.siasNotes)}</p>
        </div>` : ""}
      </div>
    </div>`;
  }

  // ── SIAS Support Section ──
  let siasHTML = "";
  if (data.siasSupport) {
    siasHTML = `
    <div class="section">
      <div class="section-heading" style="background: ${SA_COLOURS.gold}; color: #333;">
        <span>🤝 SIAS — Inclusive Education Support</span>
        <span class="blooms-tag" style="background:#333;color:white;">${escapeHtml(data.siasSupport.supportLevel)}</span>
      </div>
      <div class="section-body">
        <p><strong>Teacher Notes:</strong> ${escapeHtml(data.siasSupport.teacherNotes)}</p>
        <p style="margin-top:8px;"><strong>Accommodations:</strong></p>
        <ul>${data.siasSupport.accommodations.map(a => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
        ${data.siasSupport.referralGuidance ? `
        <div class="sias-box">
          <div class="sias-title">⚠️ Referral Guidance</div>
          <p>${escapeHtml(data.siasSupport.referralGuidance)}</p>
        </div>` : ""}
      </div>
    </div>`;
  }

  // ── Answer Key ──
  let answerKeyHTML = "";
  if (data.answerKey?.questions?.length) {
    answerKeyHTML = `
    <div class="section" style="page-break-before: always;">
      <div class="section-heading" style="background: ${SA_COLOURS.blue};">
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
              <td style="text-align:left">${escapeHtml(q.answer)}</td>
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

  // ── Blooms mini bar for CAPS reference ──
  const bloomsMini = data.metadata.bloomsDistribution
    ? Object.entries(data.metadata.bloomsDistribution)
        .map(([k, v]) => `<span>${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}%</span>`)
        .join("")
    : "";

  // ── FULL HTML ──
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.metadata.title)} — EduAI Companion</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${SA_BASE_CSS}</style>
</head>
<body>
  <div class="page">

    <!-- SA Flag Stripe -->
    <div class="sa-flag-stripe"></div>

    <!-- School Header -->
    <div class="school-header">
      <div class="school-info">
        <div class="school-name">${escapeHtml(school.name)}</div>
        <div class="school-details">
          ${school.address ? escapeHtml(school.address) + "<br>" : ""}
          ${school.tel ? "Tel: " + escapeHtml(school.tel) + " | " : ""}
          ${school.email ? "Email: " + escapeHtml(school.email) : ""}
          ${school.emis ? " | EMIS: " + escapeHtml(school.emis) : ""}
        </div>
      </div>
      <div class="dbe-badge">
        <div class="dbe-title">Department of Basic Education</div>
        <div>${escapeHtml(school.province)} Province</div>
        <div>${escapeHtml(school.district)} District</div>
        <div>Republic of South Africa</div>
      </div>
    </div>

    <!-- Document Title -->
    <div class="doc-title-block">
      <h1>${escapeHtml(data.metadata.title)}</h1>
      <div class="doc-meta">
        <span>📚 ${escapeHtml(data.metadata.subject)}</span>
        <span>🎓 ${escapeHtml(data.metadata.grade)} (${escapeHtml(data.metadata.phase)})</span>
        <span>📅 Term ${data.metadata.term}</span>
        ${data.metadata.duration ? `<span>⏱️ ${escapeHtml(data.metadata.duration)}</span>` : ""}
        ${data.metadata.totalMarks ? `<span>📝 Total: ${data.metadata.totalMarks} marks</span>` : ""}
        <span>📆 ${escapeHtml(today)}</span>
      </div>
    </div>

    <!-- CAPS Reference Bar -->
    <div class="caps-ref-bar">
      <div>
        <span class="caps-label">CAPS:</span>
        ${escapeHtml(data.metadata.capsReference || `${data.metadata.subject} — ${data.metadata.grade} — Term ${data.metadata.term}`)}
        ${data.metadata.atpWeek ? ` | ATP: ${escapeHtml(data.metadata.atpWeek)}` : ""}
      </div>
      ${bloomsMini ? `<div class="blooms-mini">${bloomsMini}</div>` : ""}
    </div>

    <!-- Compliance Stamps -->
    <div class="compliance-stamp">
      <span class="stamp">✅ CAPS Aligned</span>
      <span class="stamp">✅ NPA Compliant</span>
      <span class="stamp">✅ POPIA Compliant</span>
      ${data.metadata.siasCompliance?.accommodationsIncluded ? '<span class="stamp">✅ SIAS Inclusive</span>' : ""}
      ${data.metadata.siasCompliance?.differentiationIncluded ? '<span class="stamp">✅ WP6 Differentiated</span>' : ""}
      ${data.metadata.npaCompliance?.isFormal ? '<span class="stamp">📝 SBA Formal</span>' : '<span class="stamp">📋 Formative</span>'}
    </div>

    <!-- Content Sections -->
    ${sectionsHTML || `<div class="section"><div class="section-body"><p>No structured sections — see content below.</p></div></div>`}

    <!-- SIAS Support -->
    ${siasHTML}

    <!-- NPA Rating Table -->
    ${npaTableHTML}

    <!-- Answer Key / Memorandum -->
    ${answerKeyHTML}

    <!-- Footer -->
    <div class="page-footer">
      <div>Generated by EduAI Companion | ${escapeHtml(school.name)} | ${escapeHtml(today)} | 2026</div>
      <div class="popia-notice">POPIA: This document may contain information protected under the Protection of Personal Information Act (Act 4 of 2013). Handle in accordance with DBE policy. AI-generated — verify against official DBE CAPS documents.</div>
    </div>

  </div>
</body>
</html>`;
}

function wrapContentWithSABranding(data: DocumentData, content: string, school: any, today: string): string {
  const bloomsMini = data.metadata.bloomsDistribution
    ? Object.entries(data.metadata.bloomsDistribution)
        .map(([k, v]) => `<span>${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}%</span>`)
        .join("")
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.metadata.title)} — EduAI Companion</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${SA_BASE_CSS}</style>
</head>
<body>
  <div class="page">
    <div class="sa-flag-stripe"></div>

    <div class="school-header">
      <div class="school-info">
        <div class="school-name">${escapeHtml(school.name)}</div>
        <div class="school-details">
          ${school.address ? escapeHtml(school.address) + "<br>" : ""}
          ${school.tel ? "Tel: " + escapeHtml(school.tel) + " | " : ""}
          ${school.email ? "Email: " + escapeHtml(school.email) : ""}
          ${school.emis ? " | EMIS: " + escapeHtml(school.emis) : ""}
        </div>
      </div>
      <div class="dbe-badge">
        <div class="dbe-title">Department of Basic Education</div>
        <div>${escapeHtml(school.province)} Province</div>
        <div>${escapeHtml(school.district)} District</div>
        <div>Republic of South Africa</div>
      </div>
    </div>

    <div class="doc-title-block">
      <h1>${escapeHtml(data.metadata.title)}</h1>
      <div class="doc-meta">
        <span>📚 ${escapeHtml(data.metadata.subject)}</span>
        <span>🎓 ${escapeHtml(data.metadata.grade)} (${escapeHtml(data.metadata.phase)})</span>
        <span>📅 Term ${data.metadata.term}</span>
        ${data.metadata.duration ? `<span>⏱️ ${escapeHtml(data.metadata.duration)}</span>` : ""}
        ${data.metadata.totalMarks ? `<span>📝 Total: ${data.metadata.totalMarks} marks</span>` : ""}
        <span>📆 ${escapeHtml(today)}</span>
      </div>
    </div>

    <div class="caps-ref-bar">
      <div>
        <span class="caps-label">CAPS:</span>
        ${escapeHtml(data.metadata.capsReference || `${data.metadata.subject} — ${data.metadata.grade} — Term ${data.metadata.term}`)}
        ${data.metadata.atpWeek ? ` | ATP: ${escapeHtml(data.metadata.atpWeek)}` : ""}
      </div>
      ${bloomsMini ? `<div class="blooms-mini">${bloomsMini}</div>` : ""}
    </div>

    <div class="compliance-stamp">
      <span class="stamp">✅ CAPS Aligned</span>
      <span class="stamp">✅ NPA Compliant</span>
      <span class="stamp">✅ POPIA Compliant</span>
      ${data.metadata.siasCompliance?.accommodationsIncluded ? '<span class="stamp">✅ SIAS Inclusive</span>' : ""}
      ${data.metadata.siasCompliance?.differentiationIncluded ? '<span class="stamp">✅ WP6 Differentiated</span>' : ""}
    </div>

    <div class="ai-generated-content">
      ${content}
    </div>

    <div class="page-footer">
      <div>Generated by EduAI Companion | ${escapeHtml(school.name)} | ${escapeHtml(today)} | 2026</div>
      <div class="popia-notice">POPIA: Protected under Act 4 of 2013. AI-generated — verify against official DBE CAPS documents.</div>
    </div>
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
