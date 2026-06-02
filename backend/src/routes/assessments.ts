import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../config/db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { recalculateAssessment } from '../services/scoringEngine';
import { logAction, logActionFromReq } from '../services/audit';
import { uploadFile, deleteFile, getDownloadUrl } from '../services/storage';
import { sniffMimeType } from '../utils/mimeSniffer';
import { scanBuffer } from '../services/antivirus';

const router = Router();

// Configure multer for memory storage to parse file buffers
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit per individual upload (FR-EV-03)
  },
});

// Zod validation schemas
const createAssessmentSchema = z.object({
  cycleName: z.string().min(3),
  assessmentPeriod: z.string().optional(),
  assessmentType: z.string().default('national'),
  assignedAssessorId: z.string().uuid().optional(),
  assignedReviewerId: z.string().uuid().optional(),
});

const saveResponseSchema = z.object({
  criteriaId: z.string().uuid(),
  score: z.number().int().min(0).max(4),
  justification: z.string().min(20, 'Justification must be at least 20 characters long').max(5000),
});

const updateAssessmentSchema = z.object({
  cycleName: z.string().min(3).optional(),
  assessmentPeriod: z.string().optional(),
  assessmentType: z.string().optional(),
  assignedAssessorId: z.string().uuid().nullable().optional(),
  assignedReviewerId: z.string().uuid().nullable().optional(),
});

// GET /assessments - List assessments (org-scoped unless super_admin)
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    
    let whereClause = {};
    if (user.role !== 'super_admin') {
      if (!user.organizationId) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'User is not associated with any organization' });
      }
      whereClause = { organizationId: user.organizationId };
    }

    const assessments = await prisma.assessment.findMany({
      where: whereClause,
      include: {
        organization: true,
        assignedAssessor: { select: { id: true, fullName: true, email: true } },
        assignedReviewer: { select: { id: true, fullName: true, email: true } },
        maturityBand: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(assessments);
  } catch (error) {
    console.error('Fetch assessments error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch assessments' });
  }
});

// POST /assessments - Create new assessment
router.post('/', authenticate, requireRole('admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const body = createAssessmentSchema.parse(req.body);

    let organizationId = user.organizationId;
    if (user.role === 'super_admin') {
      // Super admin must be associated with the WHO/global org, but we can default or specify an org
      // For this implementation, if super admin creates an assessment, they specify the org in the body or default
      const orgId = req.body.organizationId;
      if (!orgId) {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'organizationId is required for super_admin' });
      }
      organizationId = orgId;
    }

    if (!organizationId) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'No organization scope defined' });
    }

    // Check if the organization exists
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Organization not found' });
    }

    // Find default maturity band for score = 0
    const defaultBand = await prisma.maturityBand.findFirst({
      where: { label: 'Non-Existent' },
    });

    // Create the assessment record
    const assessment = await prisma.assessment.create({
      data: {
        organizationId,
        createdBy: user.id,
        assignedAssessorId: body.assignedAssessorId,
        assignedReviewerId: body.assignedReviewerId,
        cycleName: body.cycleName,
        assessmentPeriod: body.assessmentPeriod,
        assessmentType: body.assessmentType,
        status: 'draft',
        chpmiScore: 0.00,
        maturityBandId: defaultBand?.id || null,
      },
      include: {
        maturityBand: true,
      },
    });

    // Fetch all criteria in database
    const criteria = await prisma.criterion.findMany();

    // Create blank responses for all 30 criteria
    const responsePromises = criteria.map((crit) => {
      return prisma.response.create({
        data: {
          assessmentId: assessment.id,
          criteriaId: crit.id,
          score: null,
          justification: '',
        },
      });
    });
    await Promise.all(responsePromises);

    // Initial scoring recalculation (creates ComputedScores records)
    await recalculateAssessment(assessment.id);

    // Fetch newly populated assessment
    const finalAssessment = await prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: { maturityBand: true },
    });

    // Audit log
    await logAction({
      userId: user.id,
      organizationId: organizationId,
      assessmentId: assessment.id,
      action: 'ASSESSMENT_CREATE',
      entityType: 'assessment',
      entityId: assessment.id,
      newValue: finalAssessment,
    });

    return res.status(201).json(finalAssessment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Validation failed', fields: error.errors });
    }
    console.error('Create assessment error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create assessment' });
  }
});

// GET /assessments/:id - Fetch details
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        organization: true,
        assignedAssessor: { select: { id: true, fullName: true, email: true } },
        assignedReviewer: { select: { id: true, fullName: true, email: true } },
        maturityBand: true,
        responses: {
          include: {
            criterion: {
              include: {
                component: {
                  include: { domain: true },
                },
                levels: { orderBy: { level: 'asc' } },
              },
            },
            evidenceFiles: true,
          },
        },
        computedScores: {
          include: {
            component: true,
            domain: true,
          },
        },
        reviewComments: {
          include: {
            commentedBy: { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    // Org lock enforcement
    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this assessment' });
    }

    return res.json(assessment);
  } catch (error) {
    console.error('Get assessment error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch assessment details' });
  }
});

// POST /assessments/:id/responses - Save criterion score
router.post('/:id/responses', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const body = saveResponseSchema.parse(req.body);

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    // Role and organization validation
    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    if (user.role === 'viewer' || user.role === 'reviewer') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Viewer and Reviewer roles cannot submit scores' });
    }

    if (assessment.status === 'approved' || assessment.status === 'archived') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Approved or archived assessments cannot be modified' });
    }

    // Find the current response record to keep track of changes for auditing
    const prevResponse = await prisma.response.findUnique({
      where: {
        assessmentId_criteriaId: {
          assessmentId: id,
          criteriaId: body.criteriaId,
        },
      },
    });

    // Upsert response
    const response = await prisma.response.upsert({
      where: {
        assessmentId_criteriaId: {
          assessmentId: id,
          criteriaId: body.criteriaId,
        },
      },
      update: {
        score: body.score,
        justification: body.justification,
        scoredById: user.id,
        scoredAt: new Date(),
      },
      create: {
        assessmentId: id,
        criteriaId: body.criteriaId,
        score: body.score,
        justification: body.justification,
        scoredById: user.id,
        scoredAt: new Date(),
      },
    });

    // Recalculate
    const recResult = await recalculateAssessment(id);

    // Audit log
    await logAction({
      userId: user.id,
      organizationId: assessment.organizationId,
      assessmentId: id,
      action: 'SCORE_SAVE',
      entityType: 'response',
      entityId: response.id,
      previousValue: prevResponse ? { score: prevResponse.score, justification: prevResponse.justification } : null,
      newValue: { score: body.score, justification: body.justification },
    });

    // Update status to 'in_progress' if in 'draft'
    if (assessment.status === 'draft') {
      await prisma.assessment.update({
        where: { id },
        data: { status: 'in_progress' },
      });
    }

    // Get the component score for this response
    const criteria = await prisma.criterion.findUnique({ where: { id: body.criteriaId } });
    const computedCompScore = await prisma.computedScore.findFirst({
      where: { assessmentId: id, componentId: criteria?.componentId },
    });

    return res.json({
      responseId: response.id,
      criteriaId: response.criteriaId,
      score: response.score,
      justification: response.justification,
      componentScore: computedCompScore?.componentScore ? Number(computedCompScore.componentScore) : 0,
      chpmiScore: recResult.chpmiScore,
      maturityBand: recResult.maturityBandLabel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Validation failed', fields: error.errors });
    }
    console.error('Save response error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to save score response' });
  }
});

// POST /assessments/:id/submit - Submit for review
router.post('/:id/submit', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: { responses: true },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    // Enforce condition: all 30 criteria scored and justified
    const incomplete = assessment.responses.filter((r) => r.score === null || !r.justification || r.justification.trim() === '');
    if (assessment.responses.length < 30 || incomplete.length > 0) {
      return res.status(400).json({
        error: 'INCOMPLETE_ASSESSMENT',
        message: `All 30 criteria must be scored and justified. Found ${incomplete.length} incomplete criteria.`,
        incompleteCount: incomplete.length,
      });
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        status: 'under_review',
        submittedAt: new Date(),
      },
    });

    await logAction({
      userId: user.id,
      organizationId: assessment.organizationId,
      assessmentId: id,
      action: 'ASSESSMENT_SUBMIT',
      entityType: 'assessment',
      entityId: id,
      previousValue: { status: assessment.status },
      newValue: { status: 'under_review' },
    });

    return res.json({ message: 'Assessment submitted for review successfully', status: updated.status });
  } catch (error) {
    console.error('Submit assessment error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to submit assessment' });
  }
});

// POST /assessments/:id/approve - Approve assessment
router.post('/:id/approve', authenticate, requireRole('admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: user.id,
      },
    });

    // Create approval comment
    await prisma.reviewComment.create({
      data: {
        assessmentId: id,
        commentedById: user.id,
        comment: req.body.comment || 'Assessment approved.',
        commentType: 'approval_note',
      },
    });

    await logAction({
      userId: user.id,
      organizationId: assessment.organizationId,
      assessmentId: id,
      action: 'ASSESSMENT_APPROVE',
      entityType: 'assessment',
      entityId: id,
      previousValue: { status: assessment.status },
      newValue: { status: 'approved' },
    });

    return res.json({ message: 'Assessment approved successfully', status: updated.status });
  } catch (error) {
    console.error('Approve assessment error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to approve assessment' });
  }
});

// POST /assessments/:id/request-revision - Request revision
router.post('/:id/request-revision', authenticate, requireRole('admin', 'reviewer', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const comment = req.body.comment;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'A review comment is required when requesting revisions' });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        status: 'revision_requested',
      },
    });

    // Create revision comment
    await prisma.reviewComment.create({
      data: {
        assessmentId: id,
        commentedById: user.id,
        comment,
        commentType: 'revision_request',
        criteriaId: req.body.criteriaId || null, // Option to link revision note to specific criterion
      },
    });

    await logAction({
      userId: user.id,
      organizationId: assessment.organizationId,
      assessmentId: id,
      action: 'ASSESSMENT_REVISION_REQUEST',
      entityType: 'assessment',
      entityId: id,
      previousValue: { status: assessment.status },
      newValue: { status: 'revision_requested' },
    });

    return res.json({ message: 'Revision requested successfully', status: updated.status });
  } catch (error) {
    console.error('Request revision error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to request revision' });
  }
});

// GET /assessments/:id/audit-log - Fetch audit log
router.get('/:id/audit-log', authenticate, requireRole('admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const logs = await prisma.auditLog.findMany({
      where: { assessmentId: id },
      include: {
        user: { select: { fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(logs);
  } catch (error) {
    console.error('Fetch audit log error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch audit log' });
  }
});

// POST /assessments/:id/responses/:criteriaId/evidence - Upload evidence file
router.post('/:id/responses/:criteriaId/evidence', authenticate, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id, criteriaId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'No file uploaded' });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    if (assessment.status === 'approved' || assessment.status === 'archived') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Approved or archived assessments cannot accept new evidence' });
    }

    // 1. Sniff MIME type from file header
    const sniffResult = sniffMimeType(file.buffer, file.originalname);
    if (!sniffResult.isAllowed) {
      return res.status(400).json({
        error: 'INVALID_FILE_TYPE',
        message: `File type not allowed. Sniffed type: ${sniffResult.mimeType}`,
      });
    }

    // 2. Scan file for viruses (ClamAV)
    const scanResult = await scanBuffer(file.buffer);
    if (!scanResult.clean) {
      return res.status(400).json({
        error: 'SECURITY_THREAT',
        message: `Malware detected in uploaded file: ${scanResult.message}`,
      });
    }

    // 3. Aggregate size check per assessment (limit to 200MB cumulative)
    const aggregate = await prisma.evidenceFile.aggregate({
      where: { assessmentId: id },
      _sum: { fileSizeBytes: true },
    });
    const currentSum = aggregate._sum.fileSizeBytes ? Number(aggregate._sum.fileSizeBytes) : 0;
    const newFileSize = file.size;
    if (currentSum + newFileSize > 200 * 1024 * 1024) {
      return res.status(400).json({
        error: 'LIMIT_EXCEEDED',
        message: `Aggregate file size limit of 200MB exceeded for this assessment. Currently uploaded: ${(currentSum / (1024 * 1024)).toFixed(2)}MB.`,
      });
    }

    // Find the response corresponding to this assessment and criteria
    const response = await prisma.response.findUnique({
      where: {
        assessmentId_criteriaId: {
          assessmentId: id,
          criteriaId,
        },
      },
    });

    if (!response) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Response record not initialized for this criterion' });
    }

    // 4. Upload to storage provider
    const pathPrefix = `evidence/org-${assessment.organizationId}/assess-${id}/crit-${criteriaId}`;
    const { storageKey, storageUrl } = await uploadFile(
      file.buffer,
      file.originalname,
      sniffResult.mimeType,
      pathPrefix
    );

    // Save evidence file details in DB
    const evidence = await prisma.evidenceFile.create({
      data: {
        assessmentId: id,
        responseId: response.id,
        uploadedById: user.id,
        fileName: file.originalname,
        fileTitle: req.body.title || file.originalname,
        fileDescription: req.body.description || '',
        fileType: sniffResult.mimeType,
        fileSizeBytes: BigInt(file.size),
        storageKey,
        storageUrl,
      },
    });

    // Audit log
    await logAction({
      userId: user.id,
      organizationId: assessment.organizationId,
      assessmentId: id,
      action: 'EVIDENCE_UPLOAD',
      entityType: 'evidence_file',
      entityId: evidence.id,
      newValue: { fileName: file.originalname, size: file.size, storageKey },
    });

    return res.status(201).json({
      id: evidence.id,
      fileName: evidence.fileName,
      fileTitle: evidence.fileTitle,
      fileType: evidence.fileType,
      fileSizeBytes: evidence.fileSizeBytes?.toString(),
      storageUrl: evidence.storageUrl,
      uploadedAt: evidence.uploadedAt,
    });
  } catch (error) {
    console.error('Upload evidence error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to upload evidence' });
  }
});

// GET /assessments/evidence/:filename/download - Download evidence file
router.get('/evidence/:filename/download', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { filename } = req.params;

    // Fetch the evidence file by its filename key or UUID
    const evidence = await prisma.evidenceFile.findFirst({
      where: {
        OR: [
          { id: filename },
          { storageKey: filename },
          { storageKey: { endsWith: filename } },
        ],
      },
      include: { assessment: true },
    });

    if (!evidence) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Evidence file not found' });
    }

    // Access check
    if (user.role !== 'super_admin' && evidence.assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';
    if (STORAGE_PROVIDER === 's3') {
      const signedUrl = await getDownloadUrl(evidence.storageKey, evidence.fileName);
      return res.redirect(signedUrl);
    } else {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const filePath = path.join(uploadDir, evidence.storageKey);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Physical file not found on disk' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${evidence.fileName}"`);
      res.setHeader('Content-Type', evidence.fileType || 'application/octet-stream');
      return res.sendFile(path.resolve(filePath));
    }
  } catch (error) {
    console.error('Download evidence error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to download evidence file' });
  }
});

// DELETE /assessments/evidence/:fileId - Delete evidence file
router.delete('/evidence/:fileId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { fileId } = req.params;

    const evidence = await prisma.evidenceFile.findUnique({
      where: { id: fileId },
      include: { assessment: true },
    });

    if (!evidence) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Evidence file record not found' });
    }

    if (user.role !== 'super_admin' && evidence.assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    if (evidence.assessment.status === 'approved' || evidence.assessment.status === 'archived') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Evidence cannot be deleted from finalized assessments' });
    }

    // Delete file from physical storage (S3 or local)
    await deleteFile(evidence.storageKey);

    // Delete record from database
    await prisma.evidenceFile.delete({
      where: { id: fileId },
    });

    // Audit log
    await logAction({
      userId: user.id,
      organizationId: evidence.assessment.organizationId,
      assessmentId: evidence.assessmentId,
      action: 'EVIDENCE_DELETE',
      entityType: 'evidence_file',
      entityId: fileId,
      previousValue: { fileName: evidence.fileName },
    });

    return res.json({ message: 'Evidence file deleted successfully' });
  } catch (error) {
    console.error('Delete evidence error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to delete evidence file' });
  }
});

// PATCH /assessments/:id - Update assessment metadata
router.patch('/:id', authenticate, requireRole('admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const body = updateAssessmentSchema.parse(req.body);

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    if (assessment.status === 'approved' || assessment.status === 'archived') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Cannot update metadata of finalized assessments' });
    }

    const updateData: any = {};
    if (body.cycleName !== undefined) updateData.cycleName = body.cycleName;
    if (body.assessmentPeriod !== undefined) updateData.assessmentPeriod = body.assessmentPeriod;
    if (body.assessmentType !== undefined) updateData.assessmentType = body.assessmentType;
    if (body.assignedAssessorId !== undefined) updateData.assignedAssessorId = body.assignedAssessorId;
    if (body.assignedReviewerId !== undefined) updateData.assignedReviewerId = body.assignedReviewerId;

    const updated = await prisma.assessment.update({
      where: { id },
      data: updateData,
      include: { maturityBand: true },
    });

    await logAction({
      userId: user.id,
      organizationId: assessment.organizationId,
      assessmentId: id,
      action: 'ASSESSMENT_UPDATE',
      entityType: 'assessment',
      entityId: id,
      previousValue: assessment,
      newValue: updated,
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Validation failed', fields: error.errors });
    }
    console.error('Update assessment error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update assessment' });
  }
});

// DELETE /assessments/:id - Delete draft/in-progress assessment
router.delete('/:id', authenticate, requireRole('admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    if (user.role !== 'super_admin' && assessment.status !== 'draft' && assessment.status !== 'in_progress') {
      return res.status(400).json({ error: 'BAD_REQUEST', message: 'Only draft or in-progress assessments can be deleted' });
    }

    await prisma.assessment.delete({
      where: { id },
    });

    await logAction({
      userId: user.id,
      organizationId: assessment.organizationId,
      action: 'ASSESSMENT_DELETE',
      entityType: 'assessment',
      entityId: id,
      previousValue: assessment,
    });

    return res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to delete assessment' });
  }
});

// POST /assessments/:id/recalculate - Force recalculate scores
router.post('/:id/recalculate', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const result = await recalculateAssessment(id);

    await logAction({
      userId: user.id,
      organizationId: assessment.organizationId,
      assessmentId: id,
      action: 'ASSESSMENT_RECALCULATE',
      entityType: 'assessment',
      entityId: id,
    });

    return res.json(result);
  } catch (error) {
    console.error('Recalculate assessment error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to recalculate assessment scores' });
  }
});

// GET /assessments/:id/scores - Get computed scores
router.get('/:id/scores', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        computedScores: {
          include: { component: true, domain: true },
          orderBy: { component: { displayOrder: 'asc' } },
        },
        maturityBand: true,
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    return res.json({
      chpmiScore: assessment.chpmiScore ? Number(assessment.chpmiScore) : 0,
      maturityBand: assessment.maturityBand?.label || 'Non-Existent',
      computedScores: assessment.computedScores.map(cs => ({
        componentId: cs.componentId,
        componentCode: cs.component.code,
        componentName: cs.component.name,
        domainId: cs.domainId,
        domainCode: cs.domain.code,
        domainName: cs.domain.name,
        componentScore: cs.componentScore ? Number(cs.componentScore) : null,
        domainScorePct: cs.domainScorePct ? Number(cs.domainScorePct) : null,
      })),
    });
  } catch (error) {
    console.error('Get assessment scores error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch scores' });
  }
});

// GET /assessments/:id/responses - Get all responses
router.get('/:id/responses', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        responses: {
          include: {
            criterion: {
              include: { component: true },
            },
            evidenceFiles: true,
          },
          orderBy: { criterion: { displayOrder: 'asc' } },
        },
      },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    return res.json(assessment.responses);
  } catch (error) {
    console.error('Get responses error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch responses' });
  }
});

// GET /assessments/:id/responses/:criteriaId - Get single response
router.get('/:id/responses/:criteriaId', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id, criteriaId } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const response = await prisma.response.findUnique({
      where: {
        assessmentId_criteriaId: {
          assessmentId: id,
          criteriaId,
        },
      },
      include: {
        criterion: {
          include: {
            component: true,
            levels: { orderBy: { level: 'asc' } },
          },
        },
        evidenceFiles: true,
      },
    });

    if (!response) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Response not found' });
    }

    return res.json(response);
  } catch (error) {
    console.error('Get single response error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch response' });
  }
});

// GET /assessments/:id/responses/:criteriaId/evidence - Get evidence list
router.get('/:id/responses/:criteriaId/evidence', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id, criteriaId } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const response = await prisma.response.findUnique({
      where: {
        assessmentId_criteriaId: {
          assessmentId: id,
          criteriaId,
        },
      },
      include: {
        evidenceFiles: true,
      },
    });

    if (!response) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Response not found' });
    }

    return res.json(response.evidenceFiles);
  } catch (error) {
    console.error('Get evidence list error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch evidence list' });
  }
});

// GET /assessments/:id/audit-log/export - Export audit log as CSV
router.get('/:id/audit-log/export', authenticate, requireRole('admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Assessment not found' });
    }

    if (user.role !== 'super_admin' && assessment.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const logs = await prisma.auditLog.findMany({
      where: { assessmentId: id },
      include: {
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Timestamp', 'User Name', 'User Email', 'Action', 'Entity Type', 'Entity ID', 'Previous Value', 'New Value'];
    const rows = logs.map(log => [
      log.createdAt.toISOString(),
      log.user?.fullName || 'System',
      log.user?.email || 'N/A',
      log.action,
      log.entityType || '',
      log.entityId || '',
      log.previousValue ? JSON.stringify(log.previousValue).replace(/"/g, '""') : '',
      log.newValue ? JSON.stringify(log.newValue).replace(/"/g, '""') : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="assessment_${id}_audit_log.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Export audit log error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to export audit log' });
  }
});

export default router;
