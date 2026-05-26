import ExcelJS from 'exceljs';
import prisma from '../config/db';

export async function generateAssessmentExcel(assessmentId: string): Promise<ExcelJS.Workbook> {
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
        orderBy: { component: { displayOrder: 'asc' } },
      },
    },
  });

  if (!assessment) {
    throw new Error('Assessment not found');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CHP Maturity Index Assessment Platform';
  workbook.lastModifiedBy = 'CHP Maturity Index Assessment Platform';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ----------------------------------------------------
  // SHEET 1: Assessment Summary
  // ----------------------------------------------------
  const summarySheet = workbook.addWorksheet('Assessment Summary');
  
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 45 },
  ];

  summarySheet.addRow({ metric: 'Organization Name', value: assessment.organization.name });
  summarySheet.addRow({ metric: 'Assessment Cycle', value: assessment.cycleName });
  summarySheet.addRow({ metric: 'Assessment Period', value: assessment.assessmentPeriod || 'N/A' });
  summarySheet.addRow({ metric: 'Status', value: assessment.status.toUpperCase() });
  
  // Overall CHPMI Score formula: `=AVERAGE('Component Scores'!D2:D${1 + assessment.computedScores.length})/4`
  const overallCellRow = summarySheet.addRow({ 
    metric: 'Overall CHPMI Score', 
    value: { formula: `=AVERAGE('Component Scores'!D2:D${1 + assessment.computedScores.length})/4` } 
  });
  overallCellRow.getCell(2).numFmt = '0.00%';

  summarySheet.addRow({ metric: 'Maturity Band', value: assessment.maturityBand?.label || 'Non-Existent' });
  summarySheet.addRow({ metric: 'System Attributes', value: assessment.maturityBand?.systemAttributes || '' });

  // Formatting summary sheet header row
  const headerRow = summarySheet.getRow(1);
  headerRow.getCell(1).font = { bold: true };
  headerRow.getCell(2).font = { bold: true };
  
  summarySheet.eachRow((row, rowNumber) => {
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F1F5F9' },
    };
    row.border = {
      bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
    };
  });

  summarySheet.addRow([]); // Blank row
  
  // Add Category Scores Header
  summarySheet.addRow(['Domain (Category)', 'Score (%)']);
  const categoryHeaderRowIndex = summarySheet.rowCount;
  const categoryHeaderRow = summarySheet.getRow(categoryHeaderRowIndex);
  categoryHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  categoryHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' },
    };
  });

  // Calculate dynamic rows mapping for Domain scores
  const domainToComponentRows: { [domainCode: string]: number[] } = {};
  for (let i = 0; i < assessment.computedScores.length; i++) {
    const cs = assessment.computedScores[i];
    const domCode = cs.domain.code;
    if (!domainToComponentRows[domCode]) {
      domainToComponentRows[domCode] = [];
    }
    domainToComponentRows[domCode].push(2 + i); // row index (1-based, header is 1)
  }

  // Add Dynamic Domain Score Formulas
  const uniqueDomains: { id: string; code: string; name: string; displayOrder: number }[] = [];
  const domainCodesAdded = new Set<string>();
  for (const cs of assessment.computedScores) {
    if (!domainCodesAdded.has(cs.domain.code)) {
      domainCodesAdded.add(cs.domain.code);
      uniqueDomains.push({
        id: cs.domainId,
        code: cs.domain.code,
        name: cs.domain.name,
        displayOrder: cs.domain.displayOrder,
      });
    }
  }
  uniqueDomains.sort((a, b) => a.displayOrder - b.displayOrder);

  for (const d of uniqueDomains) {
    const componentRows = domainToComponentRows[d.code] || [];
    const minRow = Math.min(...componentRows);
    const maxRow = Math.max(...componentRows);
    const formulaStr = `=AVERAGE('Component Scores'!D${minRow}:D${maxRow})/4`;
    const row = summarySheet.addRow([d.name, { formula: formulaStr }]);
    row.getCell(2).numFmt = '0.00%';
  }

  // ----------------------------------------------------
  // SHEET 2: Scoring Matrix
  // ----------------------------------------------------
  const matrixSheet = workbook.addWorksheet('Scoring Matrix');
  matrixSheet.columns = [
    { header: 'Criterion Code', key: 'code', width: 15 },
    { header: 'Criterion Name', key: 'name', width: 45 },
    { header: 'Score (0-4)', key: 'score', width: 12 },
    { header: 'Justification', key: 'justification', width: 65 },
    { header: 'Evidence Files Attached', key: 'evidence', width: 35 },
  ];

  const matrixHeaderRow = matrixSheet.getRow(1);
  matrixHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  matrixHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2563EB' },
    };
  });

  for (const resp of assessment.responses) {
    const evidenceList = resp.evidenceFiles.map((f) => f.fileName).join(', ') || 'None';
    matrixSheet.addRow({
      code: resp.criterion.code,
      name: resp.criterion.name,
      score: resp.score !== null ? resp.score : 'Unscored',
      justification: resp.justification || '',
      evidence: evidenceList,
    });
  }

  matrixSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.getCell(3).alignment = { horizontal: 'center' };
    row.border = {
      bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
    };
  });

  // ----------------------------------------------------
  // SHEET 3: Component Scores
  // ----------------------------------------------------
  const compSheet = workbook.addWorksheet('Component Scores');
  compSheet.columns = [
    { header: 'Component Code', key: 'code', width: 18 },
    { header: 'Component Name', key: 'name', width: 45 },
    { header: 'Domain Name', key: 'domain', width: 25 },
    { header: 'Computed Score (0-4)', key: 'score', width: 22 },
    { header: 'Percentage (%)', key: 'pct', width: 15 },
  ];

  const compHeaderRow = compSheet.getRow(1);
  compHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  compHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0D9488' },
    };
  });

  let compRowIndex = 2; // header is row 1
  for (let c = 0; c < assessment.computedScores.length; c++) {
    const cs = assessment.computedScores[c];
    const row1 = 2 + c * 3;
    const row3 = 4 + c * 3;

    const row = compSheet.addRow({
      code: cs.component.code,
      name: cs.component.name,
      domain: cs.domain.name,
      score: { formula: `=AVERAGE('Scoring Matrix'!C${row1}:C${row3})` },
      pct: { formula: `=D${compRowIndex}/4` },
    });

    row.getCell(4).numFmt = '0.0000';
    row.getCell(5).numFmt = '0.00%';
    compRowIndex++;
  }

  compSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.border = {
      bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
    };
  });

  // ----------------------------------------------------
  // SHEET 4: Evidence Index
  // ----------------------------------------------------
  const evidenceSheet = workbook.addWorksheet('Evidence Index');
  evidenceSheet.columns = [
    { header: 'Criterion', key: 'criteria', width: 12 },
    { header: 'File Title', key: 'title', width: 30 },
    { header: 'File Name', key: 'fileName', width: 40 },
    { header: 'File Size', key: 'size', width: 15 },
    { header: 'Upload Date', key: 'date', width: 20 },
  ];

  const evHeaderRow = evidenceSheet.getRow(1);
  evHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  evHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'D97706' },
    };
  });

  let fileCount = 0;
  for (const resp of assessment.responses) {
    for (const f of resp.evidenceFiles) {
      fileCount++;
      const sizeKB = f.fileSizeBytes ? `${(Number(f.fileSizeBytes) / 1024).toFixed(1)} KB` : 'N/A';
      evidenceSheet.addRow({
        criteria: resp.criterion.code,
        title: f.fileTitle || '',
        fileName: f.fileName,
        size: sizeKB,
        date: f.uploadedAt.toLocaleDateString(),
      });
    }
  }

  if (fileCount === 0) {
    evidenceSheet.addRow(['No evidence files uploaded for this assessment.']);
  }

  return workbook;
}
