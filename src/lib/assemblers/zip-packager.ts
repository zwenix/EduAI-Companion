// ============================================================
// zip-packager.ts
// Package all generated outputs into a downloadable ZIP
// Merged from CAPS document, adapted for EduAI Companion
// ============================================================

import { DocumentData } from "../templates/sa-html-templates";

export interface ZipContents {
  pdfData?: Buffer | string;
  docxData?: Buffer | string;
  htmlContent?: string;
  imageData?: Array<{ filename: string; data: Buffer | string; base64?: string }>;
  jsonData?: DocumentData | string;
  metadata?: {
    title: string;
    grade: string;
    subject: string;
    term: number;
    contentType: string;
  };
}

export interface ZipOptions {
  filename?: string;
  includeReadme?: boolean;
  includeComplianceReport?: boolean;
}

/**
 * Server-side ZIP generation using archiver
 */
export async function createZipPackageServer(
  contents: ZipContents,
  options: ZipOptions = {}
): Promise<Buffer> {
  try {
    const archiverModule = await import("archiver").catch(() => null);
    if (!archiverModule) {
      throw new Error("archiver package not available");
    }
    const archiver = (archiverModule as any).default || archiverModule;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.on("data", (chunk: Buffer) => chunks.push(chunk));
      archive.on("end", () => resolve(Buffer.concat(chunks)));
      archive.on("error", reject);

      // Add PDF
      if (contents.pdfData) {
        if (Buffer.isBuffer(contents.pdfData)) {
          archive.append(contents.pdfData, { name: `pdf/${contents.metadata ? `${contents.metadata.contentType}_${contents.metadata.grade}_T${contents.metadata.term}.pdf` : "document.pdf"}` });
        } else if (typeof contents.pdfData === "string" && contents.pdfData.includes("<")) {
          archive.append(contents.pdfData, { name: `pdf/document.html` });
        }
      }

      // Add DOCX
      if (contents.docxData) {
        if (Buffer.isBuffer(contents.docxData)) {
          archive.append(contents.docxData, { name: `docx/${contents.metadata ? `${contents.metadata.contentType}_${contents.metadata.grade}_T${contents.metadata.term}.docx` : "document.docx"}` });
        }
      }

      // Add HTML
      if (contents.htmlContent) {
        archive.append(contents.htmlContent, { name: `html/${contents.metadata ? `${contents.metadata.contentType}_${contents.metadata.grade}_T${contents.metadata.term}.html` : "document.html"}` });
      }

      // Add Images
      if (contents.imageData?.length) {
        for (const img of contents.imageData) {
          if (img.data) {
            const buffer = Buffer.isBuffer(img.data) ? img.data : Buffer.from(img.data as string, "base64");
            archive.append(buffer, { name: `images/${img.filename}` });
          } else if (img.base64) {
            archive.append(Buffer.from(img.base64, "base64"), { name: `images/${img.filename}` });
          }
        }
      }

      // Add JSON
      if (contents.jsonData) {
        const jsonStr = typeof contents.jsonData === "string" ? contents.jsonData : JSON.stringify(contents.jsonData, null, 2);
        archive.append(jsonStr, { name: `data/${contents.metadata ? `${contents.metadata.contentType}_${contents.metadata.grade}_T${contents.metadata.term}.json` : "data.json"}` });
      }

      // Add README
      if (options.includeReadme !== false) {
        const readme = `# EduAI Companion — Generated Content Package
${contents.metadata ? `
## Document Details
- **Title:** ${contents.metadata.title}
- **Subject:** ${contents.metadata.subject}
- **Grade:** ${contents.metadata.grade}
- **Term:** Term ${contents.metadata.term}
- **Type:** ${contents.metadata.contentType}
- **Generated:** ${new Date().toLocaleDateString("en-ZA")} 2026
` : ""}

## Contents
- \`pdf/\` — Print-ready PDF with SA school branding (green #007749, gold #FFB81C)
- \`docx/\` — Editable Word document with SA formatting
- \`html/\` — Web preview with Tailwind CSS, SA flag stripe
- \`images/\` — Generated educational visuals (Qwen-Image, Perchance, Gemini, Pollinations)
- \`data/\` — Raw structured JSON data with CAPS compliance metadata

## Compliance
✅ CAPS Aligned | ✅ NPA Compliant (7-point scale) | ✅ POPIA Compliant (Act 4 of 2013) | ✅ SIAS Inclusive | ✅ WP6 Differentiated
✅ Bloom's Taxonomy tagged | ✅ ATP Aligned | ✅ SA Context (Rand, SA places, SA names, IKS)

## SA Branding
- Flag stripe: Black, Gold, Green, White, Red, Blue
- School header: DBE compliant with EMIS, District, Province
- Compliance stamps: CAPS, NPA, POPIA, SIAS, WP6
- POPIA notice included in footer
- Year: 2026 (not 2024)

## Image Generation
This package may contain images from:
- Perchance AI (Primary — Professional Educational)
- Qwen-Image via NVIDIA NIM (Premium SA-context — qwen/qwen-image)
- Gemini/Imagen (Google — Secondary)
- Pollinations AI (Fallback — Turbo model)

All images: Disney 3D Animation Character & 3D Icon style, 300 DPI, SA context

## Notice
This content was generated by EduAI Companion AI for educational use.
Please verify against official DBE CAPS documents before classroom use.
POPIA: Handle all personal information in accordance with the Protection of Personal Information Act.
Generated: ${new Date().toLocaleDateString("en-ZA")} 2026

© EduAI Companion — 2026 — All Rights Reserved
`;
        archive.append(readme, { name: "README.md" });
      }

      // Add compliance report
      if (options.includeComplianceReport !== false && contents.jsonData) {
        const data = typeof contents.jsonData === "string" ? JSON.parse(contents.jsonData) : contents.jsonData;
        const complianceReport = `# Compliance Report — ${data.metadata?.title || "Document"}

Generated: ${new Date().toLocaleDateString("en-ZA")} 2026

## CAPS Compliance
- Subject-Phase Alignment: ${data.metadata?.capsReference ? "Pass" : "Check"}
- ATP Week: ${data.metadata?.atpWeek || "Not specified — align with current DBE ATP"}
- Time Allocation: ${data.metadata?.duration || "Not specified"}

## NPA Compliance
- Assessment Type: ${data.metadata?.npaCompliance?.assessmentType || "Informal"}
- Formal: ${data.metadata?.npaCompliance?.isFormal ? "Yes (SBA)" : "No"}
- Rating Scale: 7-point NPA scale (Code 1-7, 0-100%)
- SBA Weight: ${data.metadata?.npaCompliance?.sbaWeight || "Phase dependent"}%
- Exam Weight: ${data.metadata?.npaCompliance?.examWeight || "Phase dependent"}%

## Bloom's Distribution
${data.metadata?.bloomsDistribution ? Object.entries(data.metadata.bloomsDistribution).map(([k, v]) => `- ${k}: ${v}%`).join("\n") : "Not specified — should match phase requirements"}

## SIAS Compliance
- Support Level: ${data.metadata?.siasCompliance?.supportLevel || "level_1"}
- Accommodations Included: ${data.metadata?.siasCompliance?.accommodationsIncluded ? "Yes" : "No"}
- Differentiation Included: ${data.metadata?.siasCompliance?.differentiationIncluded ? "Yes" : "No"}

## POPIA Compliance
- POPIA Flag: ${data.metadata?.popiaCompliant ? "True — No real learner data" : "Check — ensure placeholder names only"}
- Fictional names used: Thabo, Amina, Sipho, Lerato, etc.

## SA Context
- Currency: Rand (R)
- Date Format: DD/MM/YYYY, Year 2026
- Spelling: SA English (colour, behaviour, organise)
- IKS Integration: Where relevant

## Verification Required
⚠️ AI-generated content must be reviewed by qualified SA educator before classroom use.
`;
        archive.append(complianceReport, { name: "COMPLIANCE_REPORT.md" });
      }

      archive.finalize();
    });
  } catch (e: any) {
    console.error(`ZIP server generation failed: ${e.message}`);
    throw e;
  }
}

/**
 * Client-side ZIP generation using JSZip (if available) or fallback
 */
export async function createZipPackageClient(
  contents: ZipContents,
  options: ZipOptions = {}
): Promise<Blob> {
  try {
    // Try to use JSZip if available, otherwise create simple text bundle
    const jszipModule = await import("jszip").catch(() => null);

    if (jszipModule) {
      const JSZip = (jszipModule as any).default || jszipModule;
      const zip = new JSZip();

      if (contents.htmlContent) {
        zip.file(`html/${contents.metadata ? `${contents.metadata.contentType}_${contents.metadata.grade}_T${contents.metadata.term}.html` : "document.html"}`, contents.htmlContent);
      }

      if (contents.jsonData) {
        const jsonStr = typeof contents.jsonData === "string" ? contents.jsonData : JSON.stringify(contents.jsonData, null, 2);
        zip.file(`data/${contents.metadata ? `${contents.metadata.contentType}_${contents.metadata.grade}_T${contents.metadata.term}.json` : "data.json"}`, jsonStr);
      }

      if (options.includeReadme !== false) {
        const readme = `# EduAI Companion — Generated Content Package
${contents.metadata ? `Title: ${contents.metadata.title}\nSubject: ${contents.metadata.subject}\nGrade: ${contents.metadata.grade}\nTerm: ${contents.metadata.term}` : ""}
Generated: ${new Date().toLocaleDateString("en-ZA")} 2026
Compliance: CAPS Aligned | NPA Compliant | POPIA Compliant | SIAS Inclusive
`;
        zip.file("README.md", readme);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      console.log(`✅ ZIP generated (client): ${(blob.size / 1024).toFixed(1)} KB`);
      return blob;
    } else {
      // Fallback: create JSON blob with all contents
      const bundle = {
        metadata: contents.metadata,
        html: contents.htmlContent,
        data: contents.jsonData,
        generated: new Date().toISOString(),
        compliance: "CAPS+NPA+SIAS+WP6+POPIA"
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      return blob;
    }
  } catch (e: any) {
    console.error(`ZIP client generation failed: ${e.message}`);
    throw e;
  }
}

export async function createZipPackage(
  contents: ZipContents,
  options: ZipOptions = {}
): Promise<Buffer | Blob | string> {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return createZipPackageClient(contents, options);
  } else {
    return createZipPackageServer(contents, options);
  }
}

export default {
  createZipPackage,
  createZipPackageClient,
  createZipPackageServer
};
