import { replaceImagePlaceholders } from './imageReplacer';

export interface PrintOptions {
    subject?: string;
    grade?: string;
    contentType?: string;
    date?: string;
    title?: string;
}

const getSubjectStyles = (subject: string = "") => {
    const s = subject.toLowerCase();
    if (s.includes('math')) {
        return {
            gradient: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
            accentColor: "#2563eb",
            textColor: "#1d4ed8",
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
                <line x1="4" y1="12" x2="20" y2="12"></line>
              </svg>`,
            badgeBg: "#dbeafe",
            badgeText: "#1e40af",
            category: "Mathematics"
        };
    } else if (s.includes('science') || s.includes('nature') || s.includes('biology') || s.includes('physics')) {
        return {
            gradient: "linear-gradient(135deg, #064e3b, #10b981)",
            accentColor: "#059669",
            textColor: "#047857",
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="18" r="3"></circle>
                <line x1="12" y1="12" x2="6" y2="18"></line>
                <line x1="12" y1="12" x2="18" y2="18"></line>
                <path d="M12 2v7"></path>
              </svg>`,
            badgeBg: "#d1fae5",
            badgeText: "#065f46",
            category: "Natural Sciences"
        };
    } else if (s.includes('language') || s.includes('literacy') || s.includes('english') || s.includes('afrikaans') || s.includes('isi') || s.includes('read') || s.includes('write')) {
        return {
            gradient: "linear-gradient(135deg, #4c1d95, #8b5cf6)",
            accentColor: "#7c3aed",
            textColor: "#6d28d9",
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>`,
            badgeBg: "#f3e8ff",
            badgeText: "#5b21b6",
            category: "Languages & Literacy"
        };
    } else if (s.includes('life') || s.includes('skill') || s.includes('social') || s.trim() === '') {
        return {
            gradient: "linear-gradient(135deg, #7c2d12, #f97316)",
            accentColor: "#f97316",
            textColor: "#c2410c",
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>`,
            badgeBg: "#ffedd5",
            badgeText: "#9a3412",
            category: "Life Skills"
        };
    } else {
        // Fallback or Admin
        return {
            gradient: "linear-gradient(135deg, #0f172a, #475569)",
            accentColor: "#475569",
            textColor: "#334155",
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>`,
            badgeBg: "#f1f5f9",
            badgeText: "#334155",
            category: subject || "Administration"
        };
    }
};

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

    // Strip legacy hardcoded text from the document body to prevent duplicate watermark headers
    cleaned = cleaned.replace(/EduAI\s+Companion(\s|<br\/?>|&nbsp;)*PRO\s+v2\.0(\s|<br\/?>|&nbsp;)*CAPS\s+Aligned\s+South\s+African\s+Educational\s+Resource/gi, '');
    cleaned = cleaned.replace(/Administration\s*(?:<br\s*\/?>)?\s*Gr\s*(?:<br\s*\/?>)?\s*All/gi, '');
    cleaned = cleaned.replace(/Administrative\s+Doc\s+Resource:\s*Notice\s*\|/gi, '');
    cleaned = cleaned.replace(/Date:\s*17\/06\/2026/gi, '');
    cleaned = cleaned.replace(/Learner\s+Name:\s*Date:/gi, '');
    cleaned = cleaned.replace(/Total\s+Marks:\s*\/(\s|_|&nbsp;)*/gi, '');

    return cleaned;
}

export const printContent = (
    contentRef: React.RefObject<HTMLDivElement | null>, 
    title: string = "EduAI Print",
    options?: PrintOptions
) => {
    try {
        if (!contentRef.current) return;
        let html = replaceImagePlaceholders(contentRef.current.innerHTML);
        html = removeLegacyHeader(html);
        
        // Dynamically prepend our professional subject-specific branding header!
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
        const printWindow = window.open('', '_blank');
        
        if (printWindow) {
            printWindow.document.write(`
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
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
               printWindow.print();
            }, 1000);
        } else {
            console.warn("Print popup blocked by browser.");
            try {
               alert("Print popup blocked by browser. Please allow popups for this site, or open the app in a new window/tab.");
            } catch(e) {}
        }
    } catch (e) {
        console.error("Print failed", e);
    }
};

export const downloadAsHTML = (
    contentRef: React.RefObject<HTMLDivElement | null>, 
    filename: string = "EduAI-Document.html",
    options?: PrintOptions
) => {
    try {
        if (!contentRef.current) return;
        let html = replaceImagePlaceholders(contentRef.current.innerHTML);
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
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Download failed", e);
    }
};
