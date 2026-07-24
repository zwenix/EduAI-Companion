import { replaceImagePlaceholders } from './imageReplacer';
import { patchOklchForHtml2canvas } from './pdfHelper';

export interface PrintOptions {
    subject?: string;
    grade?: string;
    contentType?: string;
    date?: string;
    title?: string;
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

function extractHtmlString(input: React.RefObject<HTMLDivElement | null> | HTMLElement | string | null): string {
    if (!input) return '';
    if (typeof input === 'string') return input;
    if ('current' in input && input.current) return input.current.innerHTML || '';
    if (input instanceof HTMLElement) return input.innerHTML || '';
    return '';
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
                }
            }, 600);
        } else {
            // Invisible iframe fallback (bypasses browser popup blocks)
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
            const doc = iframe.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(fullDocument);
                doc.close();
                setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                        if (iframe.parentNode) {
                            iframe.parentNode.removeChild(iframe);
                        }
                    }, 3000);
                }, 500);
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

        // Check if html2pdf is globally available
        const win = window as any;
        const html2pdfLib = win.html2pdf || (win.default ? win.default.html2pdf : null);

        if (html2pdfLib) {
            const opt = {
                margin: 0.4,
                filename: pdfFilename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            try {
                await html2pdfLib().set(opt).from(container).save();
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
