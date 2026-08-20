import jsPDF from "jspdf";
import { LearningModuleData } from "@/components/LearningModuleReader";

export interface PDFExportOptions {
  skillName: string;
  level: number;
  moduleData: LearningModuleData;
  testResults?: {
    score: number;
    total: number;
    wrongSections?: string[];
  };
  userName?: string;
}

export function downloadModuleNotesPDF({
  skillName,
  level,
  moduleData,
  testResults,
  userName = "Learner",
}: PDFExportOptions) {
  if (!moduleData || !moduleData.sections || moduleData.sections.length === 0) {
    console.warn("Cannot export empty module data to PDF.");
    return;
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Helper to check page bounds & insert new page if needed
  const checkSpace = (needed: number) => {
    if (y + needed > pageHeight - margin - 10) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  };

  // Header and Footer decoration
  const drawHeaderFooter = () => {
    const pages = doc.getNumberOfPages();
    // Top border bar
    doc.setFillColor(0, 240, 255); // #00F0FF
    doc.rect(margin, 8, contentWidth, 1.5, "F");

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `XPedition Adaptive Learning RPG Engine • Page ${pages}`,
      margin,
      pageHeight - 8
    );
    doc.text(
      `https://xpedition77.netlify.app`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    );
  };

  drawHeaderFooter();

  // 1. COVER / HEADER BOX
  doc.setFillColor(13, 13, 26); // Dark charcoal background #0D0D1A
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 240, 255); // Cyan
  doc.text("XPEDITION LEARNING NOTES", margin + 6, y + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  const titleText = doc.splitTextToSize(`${skillName} (Level ${level})`, contentWidth - 12);
  doc.text(titleText, margin + 6, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  const dateStr = new Date().toLocaleDateString();
  doc.text(`Learner: ${userName} • Exported: ${dateStr}`, margin + 6, y + 26);

  y += 38;

  // 2. TEST RESULTS SUMMARY (IF AVAILABLE)
  if (testResults) {
    checkSpace(25);
    const passed = testResults.score >= 7;
    doc.setFillColor(passed ? 10 : 30, passed ? 30 : 10, passed ? 20 : 10);
    doc.setDrawColor(passed ? 0 : 255, passed ? 255 : 0, passed ? 135 : 85);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(passed ? 0 : 255, passed ? 255 : 0, passed ? 135 : 85);
    doc.text(
      `Level Test Result: ${passed ? "PASSED" : "NEEDS PRACTICE"} (${testResults.score}/${testResults.total})`,
      margin + 5,
      y + 8
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(226, 232, 240);

    if (testResults.wrongSections && testResults.wrongSections.length > 0) {
      const wrongList = testResults.wrongSections.join(", ");
      const wrapWrong = doc.splitTextToSize(`⚠️ Sections flagged for revision: ${wrongList}`, contentWidth - 10);
      doc.text(wrapWrong, margin + 5, y + 15);
    } else {
      doc.text("All concepts mastered on first attempt!", margin + 5, y + 15);
    }

    y += 28;
  }

  // 3. SECTIONS LOOP
  moduleData.sections.forEach((sec, idx) => {
    checkSpace(20);

    // Section Heading
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 240, 255);
    doc.text(`${idx + 1}. ${sec.heading}`, margin, y);
    y += 6;

    // Paragraphs
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(240, 240, 240);

    sec.paragraphs.forEach((p) => {
      const splitP = doc.splitTextToSize(p, contentWidth);
      checkSpace(splitP.length * 5 + 3);
      doc.text(splitP, margin, y);
      y += splitP.length * 5 + 2;
    });

    // Code Example Box
    if (sec.codeExample) {
      const codeLines = doc.splitTextToSize(sec.codeExample.code, contentWidth - 10);
      const explLines = doc.splitTextToSize(`Explanation: ${sec.codeExample.explanation}`, contentWidth - 10);
      const boxHeight = (codeLines.length + explLines.length) * 4.5 + 8;

      checkSpace(boxHeight + 5);

      doc.setFillColor(10, 10, 20);
      doc.setDrawColor(0, 240, 255);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");

      doc.setFont("courier", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 240, 255);
      doc.text(codeLines, margin + 5, y + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      doc.text(explLines, margin + 5, y + codeLines.length * 4.5 + 7);

      y += boxHeight + 6;
    }

    y += 4;
  });

  // 4. KEY TAKEAWAYS BOX
  if (moduleData.takeaways && moduleData.takeaways.length > 0) {
    checkSpace(20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(168, 85, 247); // Violet
    doc.text("KEY TAKEAWAYS", margin, y);
    y += 6;

    moduleData.takeaways.forEach((t) => {
      const splitT = doc.splitTextToSize(`• ${t}`, contentWidth - 4);
      checkSpace(splitT.length * 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(255, 255, 255);
      doc.text(splitT, margin + 2, y);
      y += splitT.length * 5 + 2;
    });

    y += 6;
  }

  // 5. GROUNDED SOURCES
  if (moduleData.sources && moduleData.sources.length > 0) {
    checkSpace(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("GROUNDED SOURCES & REFERENCES", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(0, 240, 255);

    moduleData.sources.forEach((src) => {
      checkSpace(6);
      const srcText = doc.splitTextToSize(`${src.title} - ${src.url}`, contentWidth);
      doc.text(srcText, margin, y);
      y += srcText.length * 4 + 2;
    });
  }

  // Trigger Download
  const filename = `${skillName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_level_${level}_notes.pdf`;
  doc.save(filename);
}
