import PDFDocument from 'pdfkit';
import prisma from '../config/db';

export async function generateAssessmentPDF(assessmentId: string): Promise<PDFKit.PDFDocument> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      organization: true,
      maturityBand: true,
      responses: {
        include: {
          criterion: {
            include: {
              component: {
                include: { domain: true },
              },
            },
          },
          evidenceFiles: true,
        },
        orderBy: { criterion: { displayOrder: 'asc' } },
      },
      computedScores: {
        include: {
          component: true,
          domain: true,
        },
      },
    },
  });

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Helper colors
  const primaryColor = '#0F172A'; // Slate-900
  const secondaryColor = '#2563EB'; // Blue-600
  const lightBg = '#F8FAFC'; // Slate-50
  const borderColor = '#CBD5E1'; // Slate-300

  // ----------------------------------------------------
  // COVER PAGE
  // ----------------------------------------------------
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0F172A');
  doc.fillColor('#3B82F6').fontSize(14).font('Helvetica-Bold').text('COMMUNITY HEALTH PROGRAMME', 50, 150);
  
  doc.fillColor('#FFFFFF').fontSize(28).font('Helvetica-Bold').text('CHP Maturity Index Assessment', 50, 180, { lineGap: 10 });
  doc.fontSize(18).text(assessment.cycleName, 50, 240);

  doc.rect(50, 300, doc.page.width - 100, 2).fill('#3B82F6');

  // Metadata block
  doc.fillColor('#94A3B8').fontSize(11).font('Helvetica').text('Country / Organization:', 50, 340);
  doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text(assessment.organization.name, 50, 360);

  doc.fillColor('#94A3B8').fontSize(11).font('Helvetica').text('Assessment Period:', 50, 410);
  doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text(assessment.assessmentPeriod || 'N/A', 50, 430);

  doc.fillColor('#94A3B8').fontSize(11).font('Helvetica').text('Report Generated On:', 50, 480);
  doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text(new Date().toLocaleDateString(), 50, 500);

  // Score badge
  const scoreBadgeWidth = 200;
  const scoreBadgeHeight = 120;
  const scoreBadgeX = doc.page.width - 50 - scoreBadgeWidth;
  const scoreBadgeY = doc.page.height - 50 - scoreBadgeHeight - 100;

  doc.rect(scoreBadgeX, scoreBadgeY, scoreBadgeWidth, scoreBadgeHeight).fill('#1E293B');
  doc.fillColor('#94A3B8').fontSize(10).font('Helvetica-Bold').text('OVERALL CHPMI SCORE', scoreBadgeX + 20, scoreBadgeY + 20);
  doc.fillColor('#3B82F6').fontSize(36).font('Helvetica-Bold').text(`${assessment.chpmiScore ? Number(assessment.chpmiScore).toFixed(1) : '0.0'}%`, scoreBadgeX + 20, scoreBadgeY + 35);
  doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text(`Maturity Band: ${assessment.maturityBand?.label || 'Non-Existent'}`, scoreBadgeX + 20, scoreBadgeY + 80);

  doc.addPage({ size: 'A4', margin: 50 });

  // ----------------------------------------------------
  // SECTION 1: EXECUTIVE SUMMARY
  // ----------------------------------------------------
  doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text('1. Executive Summary', 50, 50);
  doc.moveDown(1);
  doc.fontSize(11).font('Helvetica').fillColor('#334155').text(
    `This report presents the findings of the Community Health Programme (CHP) Maturity Index Assessment for ${assessment.organization.name} during the cycle "${assessment.cycleName}". ` +
    `The assessment evaluates the organization across 5 domains and 10 core components to compute an overall CHP Maturity Index (CHPMI) score.`,
    { align: 'justify', lineGap: 4 }
  );

  doc.moveDown(1.5);
  doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Domain Scores Summary');
  doc.moveDown(0.5);

  // Table Headers
  const tableY = doc.y;
  doc.rect(50, tableY, 495, 20).fill(primaryColor);
  doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
  doc.text('Domain Code', 60, tableY + 5);
  doc.text('Domain Description', 160, tableY + 5);
  doc.text('Score (%)', 460, tableY + 5);

  let currentY = tableY + 20;

  // Retrieve unique domain scores
  // Domain scores are represented in computedScores where domainScorePct is not null
  const domainScores = assessment.computedScores.filter((cs) => cs.domainScorePct !== null);

  for (const ds of domainScores) {
    // Draw row background for alternating lines
    doc.rect(50, currentY, 495, 24).fill(currentY % 48 === 0 ? lightBg : '#FFFFFF');
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica');
    doc.text(ds.domain.code, 60, currentY + 7);
    doc.text(ds.domain.name, 160, currentY + 7);
    doc.text(`${Number(ds.domainScorePct).toFixed(1)}%`, 460, currentY + 7);
    
    // Bottom border
    doc.rect(50, currentY + 23, 495, 1).fill('#E2E8F0');
    currentY += 24;
  }

  // ----------------------------------------------------
  // SECTION 2: COMPONENT BREAKDOWN
  // ----------------------------------------------------
  doc.addPage({ size: 'A4', margin: 50 });
  doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text('2. Component Scores', 50, 50);
  doc.moveDown(1);

  // Table Headers for Component Scores
  const compTableY = doc.y;
  doc.rect(50, compTableY, 495, 20).fill(secondaryColor);
  doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
  doc.text('Code', 60, compTableY + 5);
  doc.text('Component Name', 110, compTableY + 5);
  doc.text('Raw Score (0-4)', 390, compTableY + 5);
  doc.text('Percentage', 480, compTableY + 5);

  let compY = compTableY + 20;

  for (const cs of assessment.computedScores) {
    // Page breaking check
    if (compY > doc.page.height - 100) {
      doc.addPage({ size: 'A4', margin: 50 });
      compY = 50;
      doc.rect(50, compY, 495, 20).fill(secondaryColor);
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
      doc.text('Code', 60, compY + 5);
      doc.text('Component Name', 110, compY + 5);
      doc.text('Raw Score (0-4)', 390, compY + 5);
      doc.text('Percentage', 480, compY + 5);
      compY += 20;
    }

    doc.rect(50, compY, 495, 28).fill(compY % 56 === 0 ? lightBg : '#FFFFFF');
    doc.fillColor(primaryColor).fontSize(9).font('Helvetica');
    
    doc.text(cs.component.code, 60, compY + 9);
    doc.text(cs.component.name, 110, compY + 9, { width: 260, height: 18 });
    
    const rawVal = cs.componentScore ? Number(cs.componentScore) : 0;
    doc.text(rawVal.toFixed(2), 390, compY + 9);
    doc.text(`${((rawVal / 4.0) * 100.0).toFixed(1)}%`, 480, compY + 9);

    doc.rect(50, compY + 27, 495, 1).fill('#E2E8F0');
    compY += 28;
  }

  // ----------------------------------------------------
  // SECTION 3: CRITERION-LEVEL DETAIL
  // ----------------------------------------------------
  doc.addPage({ size: 'A4', margin: 50 });
  doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text('3. Criterion-Level Scoring and Justification', 50, 50);
  doc.moveDown(1);

  let critY = doc.y;

  for (const resp of assessment.responses) {
    // Prepare card heights
    const cardHeight = 120;
    if (critY > doc.page.height - 180) {
      doc.addPage({ size: 'A4', margin: 50 });
      critY = 50;
    }

    doc.rect(50, critY, 495, 10).fill(lightBg);
    
    // Draw heading
    doc.fillColor(secondaryColor).fontSize(10).font('Helvetica-Bold');
    doc.text(`Criterion ${resp.criterion.code}: ${resp.criterion.name}`, 55, critY + 12);
    
    // Score Badge
    const scoreVal = resp.score !== null ? resp.score.toString() : 'Unscored';
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica');
    doc.text(`Score: `, 55, critY + 30);
    doc.font('Helvetica-Bold').text(scoreVal, 90, critY + 30);
    
    // Justification
    doc.font('Helvetica-Bold').text(`Justification:`, 55, critY + 45);
    doc.font('Helvetica').fillColor('#475569').text(
      resp.justification || 'No justification provided.',
      55, critY + 58,
      { width: 480, align: 'justify', lineGap: 2 }
    );

    // Evidence attachments
    if (resp.evidenceFiles && resp.evidenceFiles.length > 0) {
      const filesText = resp.evidenceFiles.map((f) => f.fileName).join(', ');
      doc.fillColor(secondaryColor).fontSize(8).font('Helvetica-Oblique').text(`Evidence files: ${filesText}`, 55, critY + 98);
    }

    // Border divider
    doc.rect(50, critY + 115, 495, 1).fill('#CBD5E1');
    critY += 120;
  }

  // Finalize PDF Document
  doc.end();

  return doc;
}
