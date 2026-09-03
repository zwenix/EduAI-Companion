import { replaceImagePlaceholders } from './imageReplacer';
import { patchOklchForHtml2canvas } from './pdfHelper';
import { isAndroidDevice, isNativeApp, supportsSystemPrint } from './platform';
import { deliverFile, notify, triggerWebDownload } from './nativeExport';
import {
  beginExport,
  failExport,
  finishExport,
  isExportCancelled,
  updateExport,
  ExportCancelledError,
} from './exportProgress';
import {
  recommendedScale,
  renderElementToPdfBlob,
  shouldUsePaginatedRenderer,
} from './pdfPaginate';
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

const safeSlug = (value: string, fallback = 'EduAI-Document'): string =>
    (String(value || '').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 60)) || fallback;

/**
 * Sweep the artefacts the PDF libraries leave behind when a render throws.
 *
 * html2pdf builds a full-screen `.html2pdf__overlay` (fixed, inset 0, z-index
 * 1000, opacity 0) and only removes it *after* a successful render. If
 * html2canvas failed — which it routinely did on Android for tall documents —
 * that invisible layer stayed on top of the app and swallowed every tap: the
 * teacher could not close, go back or save anything. This is the "frozen
 * generated-content screen" from the bug report.
 */
export function cleanupExportArtifacts(): void {
    try {
        document.querySelectorAll('.html2pdf__overlay').forEach((node) => node.parentNode?.removeChild(node));
        document.querySelectorAll('iframe.html2canvas-container').forEach((node) => node.parentNode?.removeChild(node));
    } catch {
        /* ignore */
    }
}

/**
 * Give illustrations a moment to decode before rasterising. html2canvas waits
 * for images too, but a bounded pre-pass keeps the page slice count stable and
 * avoids blank artwork in the exported PDF.
 */
async function waitForImages(root: HTMLElement, timeoutMs = 6000): Promise<void> {
    try {
        const pending = Array.from(root.querySelectorAll('img')).filter((img) => !img.complete);
        if (!pending.length) return;
        await Promise.race([
            Promise.all(
                pending.map(
                    (img) =>
                        new Promise<void>((resolve) => {
                            const done = () => resolve();
                            img.addEventListener('load', done, { once: true });
                            img.addEventListener('error', done, { once: true });
                        })
                )
            ),
            new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
        ]);
    } catch {
        /* never block an export on artwork */
    }
}

/**
 * Android (Capacitor WebView *and* Chrome/PWA) cannot print from script:
 * `window.print()` is a no-op there and `window.open('')` is turned into an
 * external browser intent by Capacitor's Bridge — which is what used to drop
 * teachers out of the app with nothing exported. Those runtimes get a real PDF
 * file instead (saved on device + the Android share sheet, which offers Print /
 * Drive / Files / mail / messaging). See `supportsSystemPrint()`.
 */
export const printContent = (
    input: React.RefObject<HTMLDivElement | null> | HTMLElement | string | null, 
    title: string = "EduAI Print",
    options?: PrintOptions
) => {
    try {
        let rawHtml = extractHtmlString(input);
        if (!rawHtml.trim()) {
            console.warn("printContent called with empty content");
            notify('Nothing to print yet — generate or open a document first.', 'info');
            return;
        }

        let cleaned = replaceImagePlaceholders(rawHtml);
        cleaned = removeLegacyHeader(cleaned);

        const headerHtml = buildBrandedHeaderHTML(title, options);
        const html = headerHtml + cleaned;

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

        // Android / WebView: produce a real PDF file and hand it to the OS.
        // NB: pass the *unheadered* markup — downloadAsPDF adds the branded
        // header itself, so passing `html` here would print it twice.
        if (!supportsSystemPrint()) {
            console.log("[Print] Android/WebView detected — routing the print request to a saved PDF instead of a popup window.");
            return downloadAsPDF(cleaned, `${safeSlug(title)}.pdf`, options);
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
                        downloadAsHTML(html, `${safeSlug(title)}.html`, options);
                    }
                    setTimeout(() => {
                        if (iframe.parentNode) {
                            iframe.parentNode.removeChild(iframe);
                        }
                    }, 3000);
                }, 500);
            } else {
                // Last resort: download as HTML
                downloadAsHTML(html, `${safeSlug(title)}.html`, options);
            }
        }
    } catch (e) {
        console.error("Print failed:", e);
        failExport('Printing failed. Please try "PDF Download" instead.');
        notify('Printing failed. Please try "PDF Download" instead.', 'error');
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
            notify('Nothing to export yet — the document is empty.', 'info');
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
        const safeName = filename.endsWith('.html') ? filename : `${filename}.html`;

        if (isNativeApp()) {
            // The WebView drops blob downloads — write the file to the device and
            // open the share sheet instead.
            void deliverFile(blob, safeName, {
                shareTitle: safeName,
                dialogTitle: 'Save or share your document',
                successMessage: null,
            }).then((result) => {
                if (result.ok) {
                    notify(`${safeName} saved${result.location ? ` to ${result.location}` : ''}.`, 'success');
                }
            });
            return;
        }

        triggerWebDownload(blob, safeName);
    } catch (e) {
        console.error("Download failed:", e);
        notify('Could not export the HTML file.', 'error');
    }
};

/**
 * Build a PDF Blob from an offscreen render of `html`.
 *
 * Two engines, chosen automatically:
 *  • html2pdf.js — one big canvas then sliced. Perfect on desktop, but a single
 *    canvas of a whole lesson plan exceeds Android WebView canvas limits.
 *  • `pdfPaginate` — renders page by page (bounded memory, cancellable). Used on
 *    Android and for any document too tall for one canvas.
 */
async function buildPdfBlob(container: HTMLElement, pdfFilename: string): Promise<Blob> {
    const win = window as any;
    const html2pdf = html2pdfLib || win.html2pdf || (win.default ? win.default.html2pdf : null);
    const scale = recommendedScale();
    const paginate = shouldUsePaginatedRenderer(container, scale);

    if (paginate || !html2pdf) {
        if (!html2pdf) console.warn('[PDF] html2pdf not available — using the paginated renderer.');
        return renderElementToPdfBlob(container, {
            format: 'a4',
            orientation: 'portrait',
            margin: [0.4, 0.4, 0.6, 0.4],
            scale,
            jpegQuality: 0.95,
            onPage: (page, totalPages) => {
                updateExport(
                    totalPages > 1 ? `Rendering page ${page} of ${totalPages}…` : 'Rendering page…',
                    Math.round((page / Math.max(1, totalPages)) * 100)
                );
            },
            shouldCancel: isExportCancelled,
        });
    }

    const opt = {
        margin: [0.4, 0.4, 0.6, 0.4],
        filename: pdfFilename,
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: {
            scale,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            imageTimeout: 15000,
            // Must stay true: html2canvas clones the whole document into a hidden
            // iframe per render. Leaving it behind leaks a full DOM clone into the
            // WebView on every export (memory pressure → jank → "app froze").
            removeContainer: true,
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

    updateExport('Rendering document…');
    // html2pdf exports a factory; call it to get a worker, then take the Blob
    // instead of letting it trigger a browser download (which the Android
    // WebView silently discards).
    const worker = typeof html2pdf === 'function' ? html2pdf() : html2pdf;
    const blob = (await worker.set(opt).from(container).output('blob')) as Blob;
    if (!blob || blob.size === 0) throw new Error('PDF renderer produced an empty file');
    return blob;
}

export const downloadAsPDF = async (
    input: React.RefObject<HTMLDivElement | null> | HTMLElement | string | null,
    filename: string = "EduAI-Document.pdf",
    options?: PrintOptions
) => {
    const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    // The oklch shim wraps window.getComputedStyle in a Proxy. It MUST be
    // restored: leaving it installed slows the whole app down permanently
    // (every style read, every frame) — that was a large part of the
    // "app freezes after exporting" report.
    const restoreComputedStyle = patchOklchForHtml2canvas();
    let container: HTMLDivElement | null = null;

    try {
        let rawHtml = extractHtmlString(input);
        if (!rawHtml.trim()) {
            console.warn("downloadAsPDF called with empty content");
            notify('Nothing to export yet — the document is empty.', 'info');
            return;
        }

        let html = replaceImagePlaceholders(rawHtml);
        html = removeLegacyHeader(html);
        const headerHtml = buildBrandedHeaderHTML(options?.title || pdfFilename.replace(/\.pdf$/i, ''), options);
        html = headerHtml + html;

        beginExport(options?.title ? `Exporting “${options.title}”` : 'Exporting your PDF', 'Preparing print layout…');

        // Container element
        container = document.createElement('div');
        container.className = 'p-8 bg-white text-slate-900 prose max-w-none';
        container.style.width = '800px';
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.backgroundColor = '#ffffff';
        container.style.color = '#0f172a';
        container.innerHTML = html;
        document.body.appendChild(container);

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

        await waitForImages(container);
        updateExport('Building PDF pages…');

        const blob = await buildPdfBlob(container, pdfFilename);

        updateExport(isNativeApp() ? 'Saving to your device…' : 'Saving file…');
        const result = await deliverFile(blob, pdfFilename, {
            shareTitle: options?.title || pdfFilename,
            dialogTitle: isNativeApp() ? 'Print, save or share your PDF' : undefined,
            successMessage: null, // we compose the message below (with page/location detail)
        });

        if (result.ok) {
            finishExport(
                result.cancelled
                    ? `${pdfFilename} saved${result.location ? ` to ${result.location}` : ''}.`
                    : isNativeApp()
                        ? 'PDF ready — pick Print, Drive, Files or an app to send it to.'
                        : isAndroidDevice()
                            ? `${pdfFilename} downloaded — open it from the notification to print or share.`
                            : `${pdfFilename} downloaded.`
            );
            return;
        }

        // PDF could not be delivered — never lose the teacher's content.
        console.warn('[PDF] Delivery failed, falling back to an HTML copy:', result.error);
        failExport('Could not save the PDF. Saving an HTML copy instead — you can also use Archive.');
        downloadAsHTML(html, pdfFilename.replace(/\.pdf$/i, '.html'), options);
    } catch (e: any) {
        if (e instanceof ExportCancelledError || /cancel/i.test(String(e?.message || e))) {
            console.info('[PDF] Export cancelled by the user.');
            finishExport();
            notify('Export stopped.', 'info');
        } else {
            console.error("PDF Download failed:", e);
            failExport('PDF export failed. Saving an HTML copy instead.');
            try {
                downloadAsHTML(input, pdfFilename.replace(/\.pdf$/i, '.html'), options);
            } catch (innerErr) {
                console.error('HTML fallback failed too:', innerErr);
                notify('Export failed. Use Archive to keep this document inside EduAI.', 'error');
            }
        }
    } finally {
        restoreComputedStyle();
        if (container && document.body.contains(container)) {
            document.body.removeChild(container);
        }
        // Never leave an invisible html2pdf overlay (or a cloned-iframe DOM copy)
        // sitting on top of the app after a failed/aborted render.
        cleanupExportArtifacts();
    }
};

export default {
    printContent,
    downloadAsHTML,
    downloadAsPDF,
    removeLegacyHeader,
    cleanupExportArtifacts
};
