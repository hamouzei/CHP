import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateAssessmentPDF } from '../services/pdfReport';
import { generateAssessmentExcel } from '../services/excelReport';
import { logAction } from '../services/audit';
import prisma from '../config/db';

const router = Router();

// POST /assessments/:id/reports/pdf - Generate and download PDF report
router.post('/assessments/:id/reports/pdf', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Scope check
    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const pdfDoc = await generateAssessmentPDF(id);

    // Save report record to DB
    await prisma.report.create({
      data: {
        assessmentId: id,
        generatedById: user.id,
        reportType: 'pdf',
      },
    });

    // Audit log
    await logAction({
      userId: user.id,
      organizationId: assessment.organizationId,
      assessmentId: id,
      action: 'REPORT_GENERATE',
      entityType: 'report',
      entityId: id,
      newValue: { reportType: 'pdf' },
      ipAddress: req.ip || undefined,
      userAgent: req.headers['user-agent'] || undefined,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CHP_Maturity_Report_${id}.pdf"`);

    pdfDoc.pipe(res);
  } catch (error) {
    console.error('PDF report generation error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to generate PDF report' });
  }
});

// POST /assessments/:id/reports/excel - Generate and download Excel report
router.post('/assessments/:id/reports/excel', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Scope check
    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const workbook = await generateAssessmentExcel(id);

    // Save report record to DB
    await prisma.report.create({
      data: {
        assessmentId: id,
        generatedById: user.id,
        reportType: 'excel',
      },
    });

    // Audit log
    await logAction({
      userId: user.id,
      organizationId: assessment.organizationId,
      assessmentId: id,
      action: 'REPORT_GENERATE',
      entityType: 'report',
      entityId: id,
      newValue: { reportType: 'excel' },
      ipAddress: req.ip || undefined,
      userAgent: req.headers['user-agent'] || undefined,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="CHP_Maturity_Matrix_${id}.xlsx"`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error('Excel report generation error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to generate Excel report' });
  }
});

// GET /assessments/:id/reports - List generated reports for an assessment
router.get('/assessments/:id/reports', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const reports = await prisma.report.findMany({
      where: { assessmentId: id },
      include: {
        generatedBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { generatedAt: 'desc' },
    });

    return res.json(reports);
  } catch (error) {
    console.error('List reports error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to list reports' });
  }
});

export default router;
