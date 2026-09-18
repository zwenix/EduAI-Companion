// ============================================================
// pdf-assembler.ts
// SA-Branded PDF Generation — Client + Server compatible
// Merged from CAPS document, adapted for EduAI Companion
// ============================================================

import { buildFullHTML, DocumentData, RenderedImage, SA_COLOURS } from "../templates/sa-html-templates";
import { EDUAI_DOC_TAILWIND_CSS } from "../docTailwindCompat";
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

  // Extract the document's <style> blocks and body markup WITHOUT executing
  // its <script> tags. `buildFullHTML` embeds the Tailwind CDN runtime for the
  // standalone HTML file; injecting that full document via innerHTML into the
  // live app would (a) run the CDN, which scans and re-styles the ENTIRE app
  // DOM while attached, and (b) compile the document's classes asynchronously
  // — so html2canvas usually captured it before (or without) any styling.
  // Result: corrupted app UI + unstyled/"funny" exported PDFs. The static
  // compatibility layer below covers the utility classes deterministically.
  let bodyHtml = html;
  let docStyles = "";
  if (typeof DOMParser !== "undefined") {
    try {
      const parsed = new DOMParser().parseFromString(html, "text/html");
      docStyles = Array.from(parsed.querySelectorAll("head style"))
        .map((s) => s.textContent || "")
        .join("\n");
      if (parsed.body) bodyHtml = parsed.body.innerHTML;
    } catch {
      // fall back to the raw string (rendered unbranded rather than not at all)
    }
  }

  // Temporary render container (kept off-screen but attached, so layout applies).
  // `position: absolute` — NOT `fixed`: html2canvas compensates for the
  // current page scroll when it clones the document; a fixed offscreen
  // element does not follow that compensation, so a scrolled app cropped the
  // render from the wrong coordinates (blank / shifted PDF pages).
  const container = document.createElement("div");
  container.innerHTML = `<style>${docStyles}</style><style>${EDUAI_DOC_TAILWIND_CSS}</style>${bodyHtml}`;
  container.style.position = "absolute";
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
        // buildFullHTML already contains the single canonical EduAI footer.
        // Do not add Puppeteer's separate footer layer: it duplicated the
        // branding and made the generated footer text disagree with the HTML.
        displayHeaderFooter: false,
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
