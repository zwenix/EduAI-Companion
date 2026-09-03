// ============================================================
// pdf-assembler.ts
// SA-Branded PDF Generation — Client + Server compatible
// Merged from CAPS document, adapted for EduAI Companion
// ============================================================

import { buildFullHTML, DocumentData, RenderedImage, SA_COLOURS } from "../templates/sa-html-templates";
import { cleanupExportArtifacts } from "../printUtils";
import { deliverFile } from "../nativeExport";
import { recommendedScale, renderElementToPdfBlob, shouldUsePaginatedRenderer } from "../pdfPaginate";

export interface PDFOptions {
  filename?: string;
  format?: "A4" | "Letter" | "A3";
  landscape?: boolean;
  printBackground?: boolean;
  includeHeaderFooter?: boolean;
}

/**
 * Client-side PDF generation using html2pdf.js (existing dependency)
 * Falls back to browser print if html2pdf not available
 */
export async function generatePDFClient(
  data: DocumentData,
  images: RenderedImage[] = [],
  options: PDFOptions = {}
): Promise<string> {
  const {
    filename = `${data.metadata.contentType}_${data.metadata.grade.replace(/\s/g, "")}_T${data.metadata.term}_${Date.now()}.pdf`,
    format = "A4",
    landscape = false
  } = options;

  const html = buildFullHTML(data, images);

  // Temporary render container (kept off-screen but attached, so layout applies).
  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "800px";
  container.style.backgroundColor = "#ffffff";

  try {
    document.body.appendChild(container);

    // Dynamic import html2pdf if available
    const html2pdfModule = await import("html2pdf.js").catch(() => null);
    const html2pdf = html2pdfModule ? ((html2pdfModule as any).default || html2pdfModule) : null;

    const opt = {
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', removeContainer: true },
      jsPDF: { unit: 'mm', format, orientation: landscape ? 'landscape' : 'portrait' }
    };

    const scale = recommendedScale();
    // One-shot html2pdf needs a single canvas as tall as the whole document, which
    // exceeds Android WebView canvas limits — paginate instead in that case.
    const paginate = !html2pdf || shouldUsePaginatedRenderer(container, scale);

    let blob: Blob;
    if (!paginate) {
      // Take the Blob instead of calling `.save()`: on Android the WebView drops
      // anchor/blob downloads, so delivery is decided by `deliverFile` below.
      blob = (await html2pdf().set(opt).from(container).output('blob')) as Blob;
    } else {
      // Memory-safe page-by-page renderer. This replaced the old
      // `window.open('') + print()` fallback, which the Android WebView turns into
      // an external browser intent (nothing gets exported).
      blob = await renderElementToPdfBlob(container, {
        format: String(format || 'a4').toLowerCase() as 'a4' | 'a3' | 'letter',
        orientation: landscape ? 'landscape' : 'portrait',
        margin: [0.39, 0.39, 0.59, 0.39],
        scale
      });
    }

    await deliverFile(blob, filename, {
      shareTitle: data?.metadata?.title || filename,
      dialogTitle: 'Save, print or share your document'
    });
    console.log(`✅ PDF generated (client): ${filename}`);
    return filename;
  } catch (e: any) {
    console.error(`PDF client generation failed: ${e.message}`);
    throw e;
  } finally {
    if (document.body.contains(container)) document.body.removeChild(container);
    cleanupExportArtifacts();
  }
}

/**
 * Server-side PDF generation using Puppeteer (if available)
 * This function is intended for server.ts — uses dynamic import to avoid client bundling
 */
export async function generatePDFServer(
  data: DocumentData,
  images: RenderedImage[] = [],
  options: PDFOptions = {}
): Promise<Buffer | string> {
  const html = buildFullHTML(data, images);

  try {
    // Dynamic import puppeteer — only works on server
    const puppeteer = await import("puppeteer").catch(() => null);
    if (!puppeteer) {
      console.warn("Puppeteer not available — returning HTML instead");
      return html;
    }

    const browser = await (puppeteer as any).launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: options.format || "A4",
        landscape: options.landscape || false,
        printBackground: options.printBackground !== false,
        margin: { top: "10mm", bottom: "15mm", left: "10mm", right: "10mm" },
        displayHeaderFooter: options.includeHeaderFooter !== false,
        headerTemplate: `<div></div>`,
        footerTemplate: `
          <div style="width:100%;text-align:center;font-size:8px;color:#999;padding:5px;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            &nbsp;|&nbsp; EduAI Companion &nbsp;|&nbsp; CAPS Aligned &nbsp;|&nbsp; POPIA Compliant &nbsp;|&nbsp; 2026
          </div>`,
      });

      console.log(`✅ PDF generated (server): ${data.metadata.title}`);
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  } catch (e: any) {
    console.error(`PDF server generation failed: ${e.message}`);
    // Return HTML as fallback
    return html;
  }
}

export async function generatePDF(
  data: DocumentData,
  images: RenderedImage[] = [],
  options: PDFOptions = {}
): Promise<string | Buffer> {
  // Detect environment
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return generatePDFClient(data, images, options);
  } else {
    return generatePDFServer(data, images, options);
  }
}

export default {
  generatePDF,
  generatePDFClient,
  generatePDFServer
};
