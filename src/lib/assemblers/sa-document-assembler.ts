// ============================================================
// sa-document-assembler.ts
// Unified SA Document Assembly — orchestrates PDF/DOCX/ZIP + HTML
// Merged from CAPS document, integrated with EduAI Companion
// ============================================================

import { DocumentData, RenderedImage, buildFullHTML } from "../templates/sa-html-templates";
import { generatePDF } from "./pdf-assembler";
import { generateDOCX } from "./docx-assembler";
import { createZipPackage, ZipContents } from "./zip-packager";
import { validateCAPSCompliance } from "../compliance/sa-frameworks";

export interface SAAssembleOptions {
  includePDF?: boolean;
  includeDOCX?: boolean;
  includeHTML?: boolean;
  includeJSON?: boolean;
  includeZIP?: boolean;
  filenamePrefix?: string;
  onProgress?: (stage: string, progress: number) => void;
}

export interface SAAssembleResult {
  html?: string;
  pdf?: Buffer | string;
  docx?: Buffer | string;
  json?: string;
  zip?: Buffer | Blob;
  images: RenderedImage[];
  compliance: ReturnType<typeof validateCAPSCompliance>;
  metadata: {
    title: string;
    grade: string;
    subject: string;
    term: number;
    contentType: string;
    generatedAt: string;
    imageCount: number;
    complianceSummary: string;
  };
  files: Array<{ name: string; type: string; size?: number }>;
}

export async function assembleSADocument(
  data: DocumentData,
  images: RenderedImage[] = [],
  options: SAAssembleOptions = {}
): Promise<SAAssembleResult> {
  const {
    includePDF = true,
    includeDOCX = true,
    includeHTML = true,
    includeJSON = true,
    includeZIP = false,
    filenamePrefix,
    onProgress
  } = options;

  const startTime = Date.now();
  console.log("\n🇿🇦 ═══ SA DOCUMENT ASSEMBLY START ═══\n");
  console.log(`  📄 ${data.metadata.title}`);
  console.log(`  📚 ${data.metadata.subject} | ${data.metadata.grade} | Term ${data.metadata.term}`);
  console.log(`  🎨 Images: ${images.length} | Sections: ${data.sections?.length || 0}\n`);

  const prefix = filenamePrefix || `${data.metadata.contentType}_${data.metadata.grade.replace(/\s/g, "")}_T${data.metadata.term}_${Date.now()}`;

  const result: SAAssembleResult = {
    images,
    compliance: validateCAPSCompliance(
      data.metadata.grade,
      data.metadata.subject,
      data.metadata.contentType as any,
      data.metadata.term
    ),
    metadata: {
      title: data.metadata.title,
      grade: data.metadata.grade,
      subject: data.metadata.subject,
      term: data.metadata.term,
      contentType: data.metadata.contentType,
      generatedAt: new Date().toISOString(),
      imageCount: images.filter(i => i.base64Data || i.url).length,
      complianceSummary: ""
    },
    files: []
  };

  try {
    // Step 1: HTML (always generate — base for PDF/DOCX)
    onProgress?.("Generating HTML", 10);
    console.log("  📝 Building SA-branded HTML...");
    const html = buildFullHTML(data, images);
    if (includeHTML) {
      result.html = html;
      result.files.push({ name: `${prefix}.html`, type: "text/html", size: html.length });
      console.log(`  ✅ HTML: ${(html.length / 1024).toFixed(1)} KB`);
    }

    // Step 2: JSON
    onProgress?.("Generating JSON", 25);
    if (includeJSON) {
      const jsonStr = JSON.stringify(data, null, 2);
      result.json = jsonStr;
      result.files.push({ name: `${prefix}.json`, type: "application/json", size: jsonStr.length });
      console.log(`  ✅ JSON: ${(jsonStr.length / 1024).toFixed(1)} KB`);
    }

    // Step 3: PDF
    if (includePDF) {
      onProgress?.("Generating PDF", 40);
      console.log("  📄 Generating SA-branded PDF...");
      try {
        const pdf = await generatePDF(data, images, { filename: `${prefix}.pdf` });
        result.pdf = pdf as any;
        const pdfSize = Buffer.isBuffer(pdf) ? pdf.length : typeof pdf === "string" ? pdf.length : 0;
        result.files.push({ name: `${prefix}.pdf`, type: "application/pdf", size: pdfSize });
        console.log(`  ✅ PDF: ${(pdfSize / 1024).toFixed(1)} KB`);
      } catch (e: any) {
        console.warn(`  ⚠️ PDF generation failed: ${e.message} — continuing with HTML`);
      }
    }

    // Step 4: DOCX
    if (includeDOCX) {
      onProgress?.("Generating DOCX", 60);
      console.log("  📝 Generating SA-branded DOCX...");
      try {
        const docx = await generateDOCX(data, images, { filename: `${prefix}.docx` });
        result.docx = docx as any;
        const docxSize = Buffer.isBuffer(docx) ? docx.length : typeof docx === "string" ? docx.length : 0;
        result.files.push({ name: `${prefix}.docx`, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: docxSize });
        console.log(`  ✅ DOCX: ${(docxSize / 1024).toFixed(1)} KB`);
      } catch (e: any) {
        console.warn(`  ⚠️ DOCX generation failed: ${e.message} — continuing`);
      }
    }

    // Step 5: ZIP bundle (if requested)
    if (includeZIP) {
      onProgress?.("Packaging ZIP", 80);
      console.log("  📦 Creating ZIP bundle...");
      try {
        const zipContents: ZipContents = {
          pdfData: result.pdf as any,
          docxData: result.docx as any,
          htmlContent: result.html || html,
          jsonData: data,
          imageData: images.map(img => ({
            filename: `${img.imageId}.png`,
            data: img.base64Data ? Buffer.from(img.base64Data, "base64") as any : img.url,
            base64: img.base64Data
          })),
          metadata: {
            title: data.metadata.title,
            grade: data.metadata.grade,
            subject: data.metadata.subject,
            term: data.metadata.term,
            contentType: data.metadata.contentType
          }
        };

        const zip = await createZipPackage(zipContents, {
          filename: `${prefix}.zip`,
          includeReadme: true,
          includeComplianceReport: true
        });

        result.zip = zip as any;
        const zipSize = Buffer.isBuffer(zip) ? zip.length : (zip as Blob)?.size || 0;
        result.files.push({ name: `${prefix}.zip`, type: "application/zip", size: zipSize });
        console.log(`  ✅ ZIP: ${(zipSize / 1024).toFixed(1)} KB`);
      } catch (e: any) {
        console.warn(`  ⚠️ ZIP packaging failed: ${e.message}`);
      }
    }

    // Compliance summary
    result.metadata.complianceSummary = result.compliance.summary;
    result.compliance = result.compliance;

    const elapsed = Date.now() - startTime;
    onProgress?.("Complete", 100);

    console.log("\n🇿🇦 ═══ SA DOCUMENT ASSEMBLY COMPLETE ═══");
    console.log(`  ⏱️  Time: ${(elapsed / 1000).toFixed(1)}s`);
    console.log(`  📁 Files: ${result.files.map(f => f.name).join(", ")}`);
    console.log(`  ✅ Compliance: ${result.compliance.summary}`);
    console.log(`  📊 Audit: ${result.compliance.checks.filter(c => c.status === "pass").length}/${result.compliance.checks.length} checks passed\n`);

    return result;

  } catch (e: any) {
    console.error(`SA document assembly failed: ${e.message}`);
    throw e;
  }
}

// Convenience: download all files in browser
export async function downloadSADocument(result: SAAssembleResult, format: "pdf" | "docx" | "html" | "zip" | "json" = "html") {
  if (typeof window === "undefined") {
    console.warn("downloadSADocument only works in browser");
    return;
  }

  const prefix = `${result.metadata.contentType}_${result.metadata.grade.replace(/\s/g, "")}_T${result.metadata.term}`;

  let blob: Blob | null = null;
  let filename = "";
  let mimeType = "";

  switch (format) {
    case "html":
      if (result.html) {
        blob = new Blob([result.html], { type: "text/html" });
        filename = `${prefix}.html`;
        mimeType = "text/html";
      }
      break;
    case "json":
      if (result.json) {
        blob = new Blob([result.json], { type: "application/json" });
        filename = `${prefix}.json`;
        mimeType = "application/json";
      }
      break;
    case "pdf":
      // PDF already downloaded via html2pdf in browser, or use html fallback
      if (result.html) {
        blob = new Blob([result.html], { type: "text/html" });
        filename = `${prefix}.html`;
      }
      break;
    case "docx":
      if (result.html) {
        blob = new Blob([result.html], { type: "text/html" });
        filename = `${prefix}.html`;
      }
      break;
    case "zip":
      if (result.zip) {
        if (result.zip instanceof Blob) {
          blob = result.zip;
        } else if (Buffer.isBuffer(result.zip)) {
          blob = new Blob([result.zip as any], { type: "application/zip" });
        }
        filename = `${prefix}.zip`;
        mimeType = "application/zip";
      }
      break;
  }

  if (blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`✅ Downloaded: ${filename}`);
  } else {
    console.warn(`No data available for format: ${format}`);
  }
}

export default {
  assembleSADocument,
  downloadSADocument
};
