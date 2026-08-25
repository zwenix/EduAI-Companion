// ============================================================
// docx-assembler.ts
// SA-Branded DOCX Generation — Server-side primary, client fallback
// Merged from CAPS document, adapted for EduAI Companion
// ============================================================

import { DocumentData, RenderedImage, SA_COLOURS } from "../templates/sa-html-templates";

export interface DOCXOptions {
  filename?: string;
}

/**
 * Server-side DOCX generation using 'docx' package
 * Dynamic import to avoid client bundling issues
 */
export async function generateDOCXServer(
  data: DocumentData,
  images: RenderedImage[] = [],
  options: DOCXOptions = {}
): Promise<Buffer | string> {
  const {
    filename = `${data.metadata.contentType}_${data.metadata.grade.replace(/\s/g, "")}_T${data.metadata.term}_${Date.now()}.docx`
  } = options;

  try {
    const docxModule = await import("docx").catch(() => null);
    if (!docxModule) {
      console.warn("docx package not available — returning HTML fallback");
      // Return HTML that can be opened as docx
      return `<!-- DOCX generation requires 'docx' npm package. Install: npm install docx -->
<html><body><h1>${data.metadata.title}</h1><p>DOCX generation not available on this server. Please install 'docx' package.</p></body></html>`;
    }

    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel,
      AlignmentType, ShadingType, Header, Footer, PageNumber
    } = docxModule as any;

    const today = data.metadata.generatedDate || new Date().toLocaleDateString("en-ZA");

    const children: any[] = [];

    // School Header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: (data.metadata.schoolBranding?.name || "Department of Basic Education").toUpperCase(),
            bold: true, size: 28, color: SA_COLOURS.green.replace("#", ""), font: "Arial"
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      })
    );

    // Title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: data.metadata.title,
            bold: true, size: 32, color: SA_COLOURS.green.replace("#", ""), font: "Arial"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 120 }
      })
    );

    // Metadata
    const metaText = [
      `Subject: ${data.metadata.subject}`,
      `Grade: ${data.metadata.grade} (${data.metadata.phase})`,
      `Term: ${data.metadata.term}`,
      data.metadata.duration ? `Duration: ${data.metadata.duration}` : null,
      data.metadata.totalMarks ? `Total: ${data.metadata.totalMarks} marks` : null,
      `Date: ${today}`,
      `CAPS: ${data.metadata.capsReference || `${data.metadata.subject} — ${data.metadata.grade} — Term ${data.metadata.term}`}`
    ].filter(Boolean).join(" | ");

    children.push(
      new Paragraph({
        children: [new TextRun({ text: metaText, size: 20, color: "444444" })],
        spacing: { after: 100 }
      })
    );

    // Compliance stamps
    const stamps = ["CAPS Aligned", "NPA Compliant", "POPIA Compliant"];
    if (data.metadata.siasCompliance?.accommodationsIncluded) stamps.push("SIAS Inclusive");
    if (data.metadata.siasCompliance?.differentiationIncluded) stamps.push("WP6 Differentiated");

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: stamps.map(s => `[✅ ${s}]`).join("  "),
            size: 16, color: SA_COLOURS.green.replace("#", ""), bold: true
          })
        ],
        spacing: { after: 200 }
      })
    );

    // Content Sections
    for (const section of data.sections || []) {
      const headingRuns: any[] = [
        new TextRun({
          text: section.heading,
          bold: true, size: 24, color: "FFFFFF", font: "Arial"
        })
      ];
      if (section.bloomsLevel) {
        headingRuns.push(new TextRun({
          text: `  [${section.bloomsLevel}]`,
          bold: false, size: 18, color: SA_COLOURS.gold.replace("#", "")
        }));
      }
      if (section.marks) {
        headingRuns.push(new TextRun({
          text: `  [${section.marks} marks]`,
          bold: false, size: 18, color: SA_COLOURS.gold.replace("#", "")
        }));
      }

      children.push(
        new Paragraph({
          children: headingRuns,
          shading: { type: ShadingType.SOLID, color: SA_COLOURS.green.replace("#", "") },
          spacing: { before: 200, after: 80 }
        })
      );

      if (section.content) {
        const contentLines = section.content.split("\n");
        for (const line of contentLines) {
          if (line.trim()) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: line, size: 22 })],
                spacing: { after: 40 }
              })
            );
          }
        }
      }

      if (section.bulletPoints?.length) {
        for (const bp of section.bulletPoints) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: bp, size: 22 })],
              bullet: { level: 0 },
              spacing: { after: 20 }
            })
          );
        }
      }

      // Differentiation
      if (section.differentiatedContent) {
        const diffLevels = [
          { label: "📗 Core Activity (All Learners)", content: section.differentiatedContent.core },
          { label: "📘 Extended Activity (Advanced)", content: section.differentiatedContent.extended },
          { label: "📙 Simplified Activity (Support)", content: section.differentiatedContent.simplified }
        ];

        for (const diff of diffLevels) {
          if (diff.content) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: diff.label, bold: true, size: 20 })],
                shading: { type: ShadingType.SOLID, color: "F5F5F5" },
                spacing: { before: 80, after: 20 }
              }),
              new Paragraph({
                children: [new TextRun({ text: diff.content, size: 20 })],
                indent: { left: 360 },
                spacing: { after: 60 }
              })
            );
          }
        }
      }

      if (section.siasNotes) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "🤝 SIAS Support: ", bold: true, size: 18, color: "7B6B00" }),
              new TextRun({ text: section.siasNotes, size: 18, color: "555555", italics: true })
            ],
            shading: { type: ShadingType.SOLID, color: "FFF8E1" },
            spacing: { before: 60, after: 60 }
          })
        );
      }
    }

    // SIAS Support Section
    if (data.siasSupport) {
      children.push(
        new Paragraph({
          children: [new TextRun({
            text: "🤝 SIAS — Inclusive Education Support",
            bold: true, size: 24, color: "333333"
          })],
          shading: { type: ShadingType.SOLID, color: SA_COLOURS.gold.replace("#", "") },
          spacing: { before: 300, after: 80 }
        })
      );
      for (const acc of data.siasSupport.accommodations) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: acc, size: 20 })],
            bullet: { level: 0 },
            spacing: { after: 20 }
          })
        );
      }
    }

    // Answer Key
    if (data.answerKey?.questions?.length) {
      children.push(
        new Paragraph({
          children: [new TextRun({
            text: `📝 Memorandum / Answer Key — Total: ${data.answerKey.totalMarks} marks`,
            bold: true, size: 24, color: "FFFFFF"
          })],
          shading: { type: ShadingType.SOLID, color: SA_COLOURS.blue.replace("#", "") },
          spacing: { before: 300, after: 80 }
        })
      );

      for (const q of data.answerKey.questions) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Q${q.questionNumber}: `, bold: true, size: 20 }),
              new TextRun({ text: q.answer, size: 20 }),
              new TextRun({ text: `  [${q.bloomsLevel}]`, color: SA_COLOURS.green.replace("#", ""), size: 16 }),
              new TextRun({ text: `  (${q.marks} marks)`, bold: true, size: 16 })
            ],
            spacing: { after: 40 }
          })
        );
      }
    }

    // POPIA Footer
    children.push(
      new Paragraph({
        children: [new TextRun({
          text: "POPIA Notice: This document may contain information protected under the Protection of Personal Information Act (Act 4 of 2013). Generated by EduAI Companion. AI-generated content — verify against official DBE records. 2026",
          size: 14, color: "999999", italics: true
        })],
        spacing: { before: 300 }
      })
    );

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 1008, right: 1008 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${data.metadata.subject} | ${data.metadata.grade} | Term ${data.metadata.term} | ${today}`, size: 14, color: "AAAAAA" })
                ],
                alignment: AlignmentType.RIGHT
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "EduAI Companion | CAPS Aligned | POPIA Compliant | Page ", size: 14, color: "AAAAAA" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "AAAAAA" }),
                  new TextRun({ text: " of ", size: 14, color: "AAAAAA" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "AAAAAA" })
                ],
                alignment: AlignmentType.CENTER
              })
            ]
          })
        },
        children
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    console.log(`✅ DOCX generated (server): ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return buffer;
  } catch (e: any) {
    console.error(`DOCX generation failed: ${e.message}`);
    throw e;
  }
}

/**
 * Client-side DOCX fallback — downloads HTML file with .doc extension
 * Works without 'docx' package, using browser Blob
 */
export async function generateDOCXClient(
  data: DocumentData,
  _images: RenderedImage[] = [],
  options: DOCXOptions = {}
): Promise<string> {
  const filename = options.filename || `${data.metadata.contentType}_${data.metadata.grade.replace(/\s/g, "")}_T${data.metadata.term}_${Date.now()}.html`;
  // For client, we generate SA-branded HTML that can be opened in Word
  const { buildFullHTML } = await import("../templates/sa-html-templates");
  const html = buildFullHTML(data, _images);

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(".docx", ".html");
  a.click();
  URL.revokeObjectURL(url);

  console.log(`✅ DOCX fallback (client HTML): ${filename}`);
  return filename;
}

export async function generateDOCX(
  data: DocumentData,
  images: RenderedImage[] = [],
  options: DOCXOptions = {}
): Promise<Buffer | string> {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return generateDOCXClient(data, images, options);
  } else {
    return generateDOCXServer(data, images, options);
  }
}

export default {
  generateDOCX,
  generateDOCXClient,
  generateDOCXServer
};
