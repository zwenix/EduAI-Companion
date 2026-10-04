// ============================================================
// docx-assembler.ts
// SA-Branded DOCX Generation — Server-side primary, client fallback
// Merged from CAPS document, adapted for EduAI Companion
// ============================================================

import { buildFullHTML, DocumentData, RenderedImage, SA_COLOURS } from "../templates/sa-html-templates";
import { buildCAPSCode, EDUAI_COMPLIANCE_LABELS, EDUAI_TEMPLATE_FOOTER_LINE, EDUAI_TEMPLATE_HEADER_BASE, stripGeneratedComplianceMarkup } from "../contentTemplate";

export interface DOCXOptions {
  filename?: string;
}

const cleanDocxText = (value: unknown): string => stripGeneratedComplianceMarkup(String(value ?? ""))
  .replace(/<br\s*\/?>(?=\S)/gi, "\n")
  .replace(/<[^>]*>/g, "")
  .trim();

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
      // Return the same canonical HTML fallback rather than an unbranded error
      // page. Word can open the HTML file, and the one banner/footer contract
      // remains intact even when the optional DOCX dependency is omitted.
      return `<!-- DOCX generation requires 'docx' npm package. Install: npm install docx -->\n${buildFullHTML(data, images)}`;
    }

    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel,
      AlignmentType, ShadingType, Header, Footer, Table, TableRow, TableCell, WidthType
    } = docxModule as any;

    const today = data.metadata.generatedDate || new Date().toLocaleDateString("en-ZA");

    const children: any[] = [];

    // ── THE single document banner (Word edition) ────────────────────────────
    // The HTML/PDF template opens every document with ONE two-colour banner
    // carrying the title, every label and the compliance data. Word cannot draw
    // a CSS gradient, so the same banner is built from two shaded rows — navy
    // over blue, i.e. a two-colour VERTICAL band — and nothing else is written
    // above it: no separate school header, no second title, no meta line and no
    // second stamp table repeating the same values.
    const capsCode = buildCAPSCode({
      capsCode: data.metadata.capsCode,
      title: data.metadata.title,
      subject: data.metadata.subject,
      grade: data.metadata.grade,
      term: `Term ${data.metadata.term}`,
      contentType: data.metadata.contentType
    });
    const bannerPills = [
      data.metadata.grade ? `Grade ${data.metadata.grade}` : '',
      data.metadata.subject,
      data.metadata.contentType,
      data.metadata.term ? `Term ${data.metadata.term}` : '',
      `Date: ${today}`,
      data.metadata.duration ? `Duration: ${data.metadata.duration}` : '',
      data.metadata.totalMarks ? `Total: ${data.metadata.totalMarks} marks` : '',
      data.metadata.schoolBranding?.name ? `School: ${data.metadata.schoolBranding.name}` : '',
      data.metadata.capsReference ? `CAPS: ${data.metadata.capsReference}` : '',
      data.metadata.atpWeek ? `ATP: Week ${String(data.metadata.atpWeek).replace(/^week\s*/i, '')}` : '',
    ].filter(Boolean).join('  ·  ');
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.SOLID, color: '1E3A5F' },
                children: [
                  new Paragraph({
                    children: [new TextRun({
                      text: data.metadata.title,
                      bold: true, size: 32, color: 'FFFFFF', font: 'Arial'
                    })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 60, after: 40 }
                  })
                ]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.SOLID, color: '2563EB' },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: bannerPills, size: 18, color: 'FFFFFF', bold: true })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 20, after: 20 }
                  }),
                  new Paragraph({
                    children: [new TextRun({
                      text: `CAPS Code:${capsCode} ${EDUAI_COMPLIANCE_LABELS}`,
                      size: 16, color: 'FFFFFF', bold: true
                    })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 60 }
                  })
                ]
              })
            ]
          })
        ]
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
        const contentLines = cleanDocxText(section.content).split("\n");
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
              children: [new TextRun({ text: cleanDocxText(bp), size: 22 })],
              bullet: { level: 0 },
              spacing: { after: 20 }
            })
          );
        }
      }

      // Differentiation
      if (section.differentiatedContent) {
        const diffLevels = [
          { label: "📗 Core Activity (All Learners)", content: cleanDocxText(section.differentiatedContent.core) },
          { label: "📘 Extended Activity (Advanced)", content: cleanDocxText(section.differentiatedContent.extended) },
          { label: "📙 Simplified Activity (Support)", content: cleanDocxText(section.differentiatedContent.simplified) }
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
                children: [new TextRun({ text: cleanDocxText(diff.content), size: 20 })],
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
              new TextRun({ text: cleanDocxText(section.siasNotes), size: 18, color: "555555", italics: true })
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
            text: "🤝 Inclusive teaching support (SIAS)",
            bold: true, size: 24, color: "333333"
          })],
          shading: { type: ShadingType.SOLID, color: SA_COLOURS.gold.replace("#", "") },
          spacing: { before: 300, after: 80 }
        })
      );
      for (const acc of data.siasSupport.accommodations) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: cleanDocxText(acc), size: 20 })],
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
              new TextRun({ text: cleanDocxText(q.answer), size: 20 }),
              new TextRun({ text: `  [${q.bloomsLevel}]`, color: SA_COLOURS.green.replace("#", ""), size: 16 }),
              new TextRun({ text: `  (${q.marks} marks)`, bold: true, size: 16 })
            ],
            spacing: { after: 40 }
          })
        );
      }
    }

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
              // Brand-only page header on the light-blue wash — the single
              // banner below owns the subject / grade / term / date.
              new Paragraph({
                shading: { type: ShadingType.SOLID, color: 'DBEAFE' },
                children: [
                  new TextRun({ text: EDUAI_TEMPLATE_HEADER_BASE, size: 14, color: '1E3A5F', bold: true })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 20, after: 20 }
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: EDUAI_TEMPLATE_FOOTER_LINE, size: 14, color: "1E3A5F" })
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
