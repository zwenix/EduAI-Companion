// ============================================================
// pdf-assembler.ts
// SA-Branded PDF Generation — Client + Server compatible
// Merged from CAPS document, adapted for EduAI Companion
// ============================================================

import { buildFullHTML, DocumentData, RenderedImage, SA_COLOURS } from "../templates/sa-html-templates";

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

  try {
    // Dynamic import html2pdf if available
    const html2pdfModule = await import("html2pdf.js").catch(() => null);
    if (html2pdfModule) {
      const html2pdf = (html2pdfModule as any).default || html2pdfModule;
      // Create temporary container
      const container = document.createElement("div");
      container.innerHTML = html;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      document.body.appendChild(container);

      const opt = {
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format, orientation: landscape ? 'landscape' : 'portrait' }
      };

      await html2pdf().set(opt).from(container).save();
      document.body.removeChild(container);
      console.log(`✅ PDF generated (client): ${filename}`);
      return filename;
    } else {
      // Fallback: open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
        return filename;
      }
      throw new Error("No PDF generator available");
    }
  } catch (e: any) {
    console.error(`PDF client generation failed: ${e.message}`);
    throw e;
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
