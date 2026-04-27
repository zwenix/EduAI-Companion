export const printContent = (contentRef: React.RefObject<HTMLDivElement | null>, title: string = "EduAI Print") => {
    try {
        if (!contentRef.current) return;
        const html = contentRef.current.innerHTML;
        const printWindow = window.open('', '_blank');
        
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${title}</title>
                    <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
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
                <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
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
