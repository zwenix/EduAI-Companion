export const printContent = (contentRef: React.RefObject<HTMLDivElement | null>, title: string = "EduAI Print") => {
    try {
        if (!contentRef.current) return;
        let html = contentRef.current.innerHTML;
        
        try {
            const savedHeader = localStorage.getItem('eduai_print_header');
            if (savedHeader) {
                const headerData = JSON.parse(savedHeader);
                if (headerData && headerData.isEnabled) {
                    const headerHtml = `
<div class="eduai-print-header w-full border-2 border-slate-300 rounded-xl p-4 mb-6 bg-white shrink-0 text-slate-800" style="width: 100%; box-sizing: border-box; border: 2px solid #cbd5e1; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1.5rem; page-break-inside: avoid; background-color: #ffffff; color: #1e293b; font-family: 'Nunito', system-ui, sans-serif; text-align: left;">
  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.375rem; margin-bottom: 0.75rem;">
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <div style="width: 1.25rem; height: 1.25rem; border-radius: 0.25rem; background-color: #00d2ff; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.56rem; font-weight: 800; text-transform: uppercase;">Edu</div>
      <span style="font-size: 0.625rem; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; color: #334155;">EduAI CAPS Assessment Worksheet</span>
    </div>
    <span style="font-size: 0.5rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em;">Republic of South Africa</span>
  </div>
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.625rem 1rem;">
    <div style="display: flex; align-items: flex-end; gap: 0.375rem;">
      <span style="font-size: 0.56rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; white-space: nowrap;">Learner Name:</span>
      <div style="border-bottom: 1.5px solid #cbd5e1; flex-grow: 1; height: 1rem; font-size: 0.75rem; font-weight: 700; color: #0f172a; padding: 0 0.25rem;">
        ${headerData.studentName || '__________________________________________________'}
      </div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 0.375rem;">
      <span style="font-size: 0.56rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; white-space: nowrap;">Grade / Class:</span>
      <div style="border-bottom: 1.5px solid #cbd5e1; flex-grow: 1; height: 1rem; font-size: 0.75rem; font-weight: 700; color: #0f172a; padding: 0 0.25rem;">
        ${headerData.grade || '______________________'}
      </div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 0.375rem;">
      <span style="font-size: 0.56rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; white-space: nowrap;">Assessment Date:</span>
      <div style="border-bottom: 1.5px solid #cbd5e1; flex-grow: 1; height: 1rem; font-size: 0.75rem; font-weight: 700; color: #0f172a; padding: 0 0.25rem;">
        ${headerData.date || '______________________'}
      </div>
    </div>
    <div style="display: flex; align-items: flex-end; gap: 0.375rem;">
      <span style="font-size: 0.56rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; white-space: nowrap;">Total Marks:</span>
      <div style="border-bottom: 1.5px solid #cbd5e1; flex-grow: 1; height: 1rem; font-size: 0.75rem; font-weight: 700; color: #0f172a; padding: 0 0.25rem;">
        ${headerData.totalMarks ? `${headerData.totalMarks} Marks` : '______ / ______'}
      </div>
    </div>
  </div>
</div>
`;
                    html = headerHtml + html;
                }
            }
        } catch (err) {
            console.warn("Could not inject print header", err);
        }

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
                        @media print {
                            @page { margin: 15mm; }
                            body { -webkit-print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body class="p-8 prose max-w-none text-slate-800 bg-white">
                    ${html}
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

export const downloadAsHTML = (contentRef: React.RefObject<HTMLDivElement | null>, filename: string = "EduAI-Document.html") => {
    try {
        if (!contentRef.current) return;
        const html = contentRef.current.innerHTML;
        const completeHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${filename}</title>
            </head>
            <body class="p-8 prose max-w-none text-slate-800 bg-white">
                ${html}
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
