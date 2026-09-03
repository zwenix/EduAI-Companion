import { replaceImagePlaceholders } from './imageReplacer';
import { patchOklchForHtml2canvas } from './pdfHelper';
import { isAndroidApp } from './platform';
// html2pdf.js bundles html2canvas + jsPDF. Imported lazily so server-side
// rendering / non-browser entry points don't try to load it.
// @ts-ignore
import html2pdfLib from 'html2pdf.js';

export interface PrintOptions {
    subject?: string;
    grade?: string;
    contentType?: string;
    date?: string;
    title?: string;
}

/**
 * Extract rendered HTML from an iframe element (such as the live preview
 * in HtmlPreviewFrame). Falls back to the iframe's srcDoc when the iframe
 * is sandboxed/cross-origin or contentDocument is unavailable (common in
 * Android WebView).
 */
function extractIframeHTML(iframe: HTMLIFrameElement | null | undefined): string {
    if (!iframe) return '';
    try {
        // Same-origin rendered DOM
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
            // Inline computed styles for images/tables so the print window looks
            // the same as the preview.
            return doc.body.innerHTML || '';
        }
    } catch {
        // cross-origin / sandboxed — fall through
    }
    // Fallback: use the srcDoc attribute which contains the full document
    const srcDoc = iframe.getAttribute('srcdoc') || '';
    if (srcDoc) {
        const bodyMatch = srcDoc.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        return bodyMatch ? bodyMatch[1] : srcDoc;
    }
    return '';
}

const buildBrandedHeaderHTML = (title: string, options?: PrintOptions): string => {
    const subject = options?.subject || "Administration";
    const grade = options?.grade || "All";
    
    return `
<div class="eduai-branded-header mb-6 pb-2 border-b border-slate-200" style="font-family: 'Inter', system-ui, -apple-system, sans-serif; box-sizing: border-box; width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: 0.65rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; line-height: 1.2;">
  <span>EduAI Companion PRO v2.0 - CAPS Aligned South African Educational Resource</span>
  <span style="font-family: monospace; opacity: 0.85; background-color: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.6rem;">${subject} ${grade !== 'All' && grade !== 'N/A' && grade ? `• Gr ${grade}` : ''}</span>
</div>
`;
};

export function removeLegacyHeader(html: string): string {
    if (!html) return '';
    let cleaned = html;

    cleaned = cleaned.replace(/EduAI\s+Companion(\s|<br\/?>|&nbsp;)*PRO\s+v2\.0(\s|<br\/?>|&nbsp;)*CAPS\s+Aligned\s+South\s+African\s+Educational\s+Resource/gi, '');
    cleaned = cleaned.replace(/Administration\s*(?:<br\s*\/?>)?\s*Gr\s*(?:<br\s*\/?>)?\s*All/gi, '');
    cleaned = cleaned.replace(/Administrative\s+Doc\s+Resource:\s*Notice\s*\|/gi, '');
    cleaned = cleaned.replace(/Date:\s*17\/06\/2026/gi, '');
    cleaned = cleaned.replace(/Learner\s+Name:\s*Date:/gi, '');
    cleaned = cleaned.replace(/Total\s+Marks:\s*\/(\s|_|&nbsp;)*/gi, '');

    return cleaned;
}

function extractHtmlString(input: React.RefObject<HTMLElement | HTMLIFrameElement | null> | HTMLElement | HTMLIFrameElement | string | null): string {
    if (!input) return '';
    if (typeof input === 'string') return input;
    if ('current' in input && input.current) {
        const el = input.current;
        if (el instanceof HTMLIFrameElement) return extractIframeHTML(el);
        return (el as HTMLElement).innerHTML || '';
    }
    if (input instanceof HTMLIFrameElement) return extractIframeHTML(input);
    if (input instanceof HTMLElement) return input.innerHTML || '';
    return '';
}

/**
 * Android (Capacitor WebView): window.open() is silently swallowed and the
 * invisible-iframe print() call also fails in many WebView builds. Detect
 * that scenario and fall back to a PDF download using html2pdf, which works
 * reliably by saving a blob through the filesystem.
 */
function isPrintSupported(): boolean {
    if (typeof window === 'undefined') return false;
    // Android WebView blocks popups and rarely supports window.print() on an
    // iframe; detect it so we take the PDF route instead of silently failing.
    if (isAndroidApp()) return false;
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    if (/Android/i.test(ua) && /wv|WebView/i.test(ua)) return false;
    return true;
}

export const printContent = (
    input: React.RefObject<HTMLDivElement | null> | HTMLElement | string | null, 
    title: string = "EduAI Print",
    options?: PrintOptions
) => {
    try {
        let rawHtml = extractHtmlString(input);
        if (!rawHtml.trim()) {
            console.warn("printContent called with empty content");
            return;
        }

        let html = replaceImagePlaceholders(rawHtml);
        html = removeLegacyHeader(html);
        
        const headerHtml = buildBrandedHeaderHTML(title, options);
        html = headerHtml + html;

        const getParentStyles = () => {
            return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                .map(el => {
                    if (el.tagName.toLowerCase() === 'link') {
                        const href = (el as HTMLLinkElement).href;
                        return `<link rel="stylesheet" href="${href}">`;
                    }
                    return el.outerHTML;
                })
                .join('\n');
        };

        const fullDocument = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                ${getParentStyles()}
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono&display=swap');
                    @media print {
                        @page { margin: 15mm; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .print\\:hidden { display: none !important; }
                    }
                    body {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        padding: 2rem;
                        background-color: #ffffff;
                        color: #0f172a;
                    }
                </style>
            </head>
            <body class="p-8 prose max-w-none text-slate-800 bg-white">
                ${html}
                <footer style="margin-top: 5rem; border-top: 1px dashed #e2e8f0; padding-top: 1rem; text-align: center; font-size: 0.55rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;">
                  <span>EduAI Companion • CAPS Aligned • Developer & Owner: Z. Msuthu © 2026</span>
                  <span>eduai-companion.vercel.app</span>
                </footer>
            </body>
            </html>
        `;

        // Android WebView: no print() or window.open() — fall back to generating
        // a PDF blob and triggering download. The user can then open / print /
        // share the file from the system file picker.
        if (!isPrintSupported()) {
            console.log("[Print] Android/WebView detected — routing print request to PDF download instead.");
            // Build a printable container and hand off to downloadAsPDF
            const container = document.createElement('div');
            container.innerHTML = html;
            // Append doc metadata
            try {
                // Reuse downloadAsPDF's core path by calling it with the HTML string
                return downloadAsPDF(html, `${title.replace(/[^a-z0-9_-]/gi, '_')}.pdf`, options);
            } catch (e) {
                console.warn("[Print] PDF fallback failed, doing HTML download:", e);
            }
        }

        let printWindow: Window | null = null;
        try {
            printWindow = window.open('', '_blank');
        } catch (e) {
            printWindow = null;
        }

        if (printWindow) {
            printWindow.document.write(fullDocument);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                try {
                    printWindow?.print();
                } catch (e) {
                    console.warn("Window print failed, using iframe fallback", e);
                    tryIframeFallback();
                }
            }, 600);
        } else {
            tryIframeFallback();
        }

        function tryIframeFallback() {
            // Invisible iframe fallback (bypasses browser popup blocks)
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.setAttribute('aria-hidden', 'true');
            document.body.appendChild(iframe);
            const doc = iframe.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(fullDocument);
                doc.close();
                setTimeout(() => {
                    try {
                        iframe.contentWindow?.focus();
                        iframe.contentWindow?.print();
                    } catch (printErr) {
                        console.warn("Iframe print also failed; serving as HTML download:", printErr);
                        downloadAsHTML(html, `${title.replace(/[^a-z0-9_-]/gi, '_')}.html`, options);
                    }
                    setTimeout(() => {
                        if (iframe.parentNode) {
                            iframe.parentNode.removeChild(iframe);
                        }
                    }, 3000);
                }, 500);
            } else {
                // Last resort: download as HTML
                downloadAsHTML(html, `${title.replace(/[^a-z0-9_-]/gi, '_')}.html`, options);
            }
        }
    } catch (e) {
        console.error("Print failed:", e);
    }
};

export const downloadAsHTML = (
    input: React.RefObject<HTMLDivElement | null> | HTMLElement | string | null, 
    filename: string = "EduAI-Document.html",
    options?: PrintOptions
) => {
    try {
        let rawHtml = extractHtmlString(input);
        if (!rawHtml.trim()) {
            console.warn("downloadAsHTML called with empty content");
            return;
        }

        let html = replaceImagePlaceholders(rawHtml);
        html = removeLegacyHeader(html);
        
        const headerHtml = buildBrandedHeaderHTML(filename.replace(/\.html$/i, ''), options);
        html = headerHtml + html;
        
        const completeHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${filename}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono&display=swap');
                    body {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        padding: 2.5rem;
                        max-width: 800px;
                        margin: 0 auto;
                        color: #1e293b;
                        background-color: #ffffff;
                        line-height: 1.6;
                    }
                    .print\\:hidden { display: none !important; }
                </style>
            </head>
            <body>
                ${html}
                <footer style="margin-top: 5rem; border-top: 1px dashed #e2e8f0; padding-top: 1rem; text-align: center; font-size: 0.55rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; align-items: center;">
                  <span>EduAI Companion • CAPS Aligned • Developer & Owner: Z. Msuthu © 2026</span>
                  <span>eduai-companion.vercel.app</span>
                </footer>
            </body>
            </html>
        `;
        const blob = new Blob([completeHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Download failed:", e);
    }
};

export const downloadAsPDF = async (
    input: React.RefObject<HTMLDivElement | null> | HTMLElement | string | null,
    filename: string = "EduAI-Document.pdf",
    options?: PrintOptions
) => {
    try {
        patchOklchForHtml2canvas();
        let rawHtml = extractHtmlString(input);
        if (!rawHtml.trim()) {
            console.warn("downloadAsPDF called with empty content");
            return;
        }

        let html = replaceImagePlaceholders(rawHtml);
        html = removeLegacyHeader(html);
        const headerHtml = buildBrandedHeaderHTML(filename, options);
        html = headerHtml + html;

        // Container element
        const container = document.createElement('div');
        container.className = 'p-8 bg-white text-slate-900 prose max-w-none';
        container.style.width = '800px';
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        container.innerHTML = html;
        document.body.appendChild(container);

        const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

        // Use the ES-module import first; fall back to any global that
        // might have been attached by a CDN script tag.
        const win = window as any;
        const html2pdf = html2pdfLib || win.html2pdf || (win.default ? win.default.html2pdf : null);

        // Resolve any relative image URLs in the container to absolute URLs so
        // that html2canvas can fetch them cross-origin (relative /api/image-proxy
        // URLs only resolve from the app's own origin otherwise the canvas
        // taints and html2pdf produces a blank PDF).
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        container.querySelectorAll('img').forEach(img => {
            try {
                const src = img.getAttribute('src') || '';
                if (src && src.startsWith('/') && !src.startsWith('//') && origin) {
                    img.src = origin + src;
                    img.crossOrigin = 'anonymous';
                } else if (src.startsWith('http')) {
                    img.crossOrigin = 'anonymous';
                }
                // Ensure lazy-loaded images don't stay blank in the PDF
                img.loading = 'eager';
                img.decoding = 'sync';
            } catch {}
        });

        if (html2pdf) {
            const opt = {
                margin: [0.4, 0.4, 0.6, 0.4],
                filename: pdfFilename,
                image: { type: 'jpeg', quality: 0.96 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    imageTimeout: 15000,
                    removeContainer: false,
                    foreignObjectRendering: false, // foreignObject breaks on many Android WebViews
                    scrollX: 0,
                    scrollY: 0,
                    windowWidth: 900,
                    onclone: (clonedDoc: Document, clonedNode: HTMLElement) => {
                        // Make sure the cloned doc uses white bg (not dark theme) so PDF is print-safe
                        clonedDoc.body.style.backgroundColor = '#ffffff';
                        clonedDoc.body.style.color = '#0f172a';
                        clonedNode.style.backgroundColor = '#ffffff';
                        clonedNode.style.color = '#0f172a';
                        return clonedNode;
                    }
                },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait', compress: true },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            } as any;
            try {
                // html2pdf exports a factory; call it to get a worker.
                const worker = typeof html2pdf === 'function' ? html2pdf() : html2pdf;
                await worker.set(opt).from(container).save();
            } catch (pdfErr) {
                console.warn("html2pdf error, falling back to HTML download:", pdfErr);
                downloadAsHTML(input, pdfFilename.replace(/\.pdf$/i, '.html'), options);
            }
        } else {
            console.warn("html2pdf library not loaded, using HTML file download fallback");
            downloadAsHTML(input, pdfFilename.replace(/\.pdf$/i, '.html'), options);
        }

        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    } catch (e) {
        console.error("PDF Download failed:", e);
        downloadAsHTML(input, filename.replace(/\.pdf$/i, '.html'), options);
    }
};

export default {
    printContent,
    downloadAsHTML,
    downloadAsPDF,
    removeLegacyHeader
};
