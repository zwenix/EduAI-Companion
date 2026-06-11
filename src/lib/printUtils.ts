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
    if (!options) return "";
    
    const styles = getSubjectStyles(options.subject || "");
    const dateStr = options.date || new Date().toLocaleDateString();
    
    return `
<div class="eduai-branded-header mb-8 pb-6 border-b-2 border-slate-200" style="font-family: 'Inter', system-ui, -apple-system, sans-serif; text-align: left; box-sizing: border-box; width: 100%;">
  <!-- Brand bar -->
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <div style="width: 2.75rem; height: 2.75rem; border-radius: 0.75rem; background: ${styles.gradient}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        ${styles.icon}
      </div>
      <div>
        <h3 style="font-size: 1.15rem; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 0.35rem;">
          EduAI Companion <span style="font-size: 0.65rem; font-weight: 900; background-color: #f1f5f9; color: #475569; padding: 0.15rem 0.4rem; border-radius: 0.25rem;">PRO v2.0</span>
        </h3>
        <p style="font-size: 0.7rem; font-weight: 700; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.05em;">
          CAPS Aligned South African Educational Resource
        </p>
      </div>
    </div>
    
    <div style="display: flex; align-items: center; gap: 0.75rem; margin-left: auto;">
      <span style="font-size: 0.7rem; font-weight: 800; background-color: ${styles.badgeBg}; color: ${styles.badgeText}; padding: 0.35rem 0.75rem; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; font-family: monospace;">
        ${styles.category}
      </span>
      ${options.grade ? `
      <div style="width: 3.25rem; height: 3.25rem; border-radius: 9999px; background-color: #0f172a; color: #ffffff; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15);">
        <span style="font-size: 0.5rem; font-weight: 800; text-transform: uppercase; opacity: 0.75; letter-spacing: 0.05em; line-height: 1;">Gr</span>
        <span style="font-size: 1.1rem; font-weight: 900; line-height: 1.1;">${options.grade}</span>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- Main Resource Title Section -->
  <div style="margin-bottom: 1.5rem; border-left: 4px solid ${styles.accentColor}; padding-left: 0.75rem;">
    <h1 style="font-size: 1.75rem; font-weight: 800; letter-spacing: -0.03em; color: #0f172a; margin: 0; line-height: 1.25;">${options.title || title}</h1>
    <p style="font-size: 0.8rem; font-weight: 600; color: #64748b; margin: 4px 0 0 0; display: flex; gap: 0.5rem; align-items: center;">
      <span>Resource: <strong>${options.contentType || 'Activity Worksheet'}</strong></span>
      <span style="color: #cbd5e1;">|</span>
      <span>Date: <strong>${dateStr}</strong></span>
    </p>
  </div>

  <!-- Metadata Student Form Lines -->
  <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1.5rem; border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; padding: 1.25rem 0; margin-bottom: 1.5rem;">
    <div style="display: flex; align-items: flex-end; gap: 0.5rem;">
      <span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; white-space: nowrap;">Learner Name:</span>
      <div style="border-bottom: 2px dotted #94a3b8; flex-grow: 1; height: 1.1rem;"></div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 0.5rem;">
      <span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; white-space: nowrap;">Date:</span>
      <div style="border-bottom: 2px dotted #94a3b8; flex-grow: 1; height: 1.1rem;"></div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 0.5rem;">
      <span style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; white-space: nowrap;">Total Marks:</span>
      <div style="border-bottom: 2px dotted #94a3b8; flex-grow: 1; height: 1.1rem; text-align: right; padding-right: 0.25rem; font-size: 0.75rem; color: #94a3b8; font-weight: 700;">/ _____</div>
    </div>
  </div>
</div>
`;
};

export const printContent = (
    contentRef: React.RefObject<HTMLDivElement | null>, 
    title: string = "EduAI Print",
    options?: PrintOptions
) => {
    try {
        if (!contentRef.current) return;
        let html = replaceImagePlaceholders(contentRef.current.innerHTML);
        
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
                    
                    <footer style="margin-top: 5rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem; text-align: center; font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: flex; justify-content: space-between; align-items: center; page-break-inside: avoid;">
                      <span>EduAI Companion • CAPS Aligned South Africa</span>
                      <span>eduai-companion.github.io</span>
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
                
                <footer style="margin-top: 5rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem; text-align: center; font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: flex; justify-content: space-between; align-items: center;">
                  <span>EduAI Companion • CAPS Aligned South Africa</span>
                  <span>eduai-companion.github.io</span>
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
