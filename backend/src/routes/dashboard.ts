import { Router } from 'express';
import prisma from '../config/db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// GET /dashboard/organization/:orgId - Organization-level dashboard data
router.get('/organization/:orgId', authenticate, requireRole('admin', 'super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const { orgId } = req.params;
    const user = req.user!;

    // Org-scope check
    if (user.role !== 'super_admin' && user.organizationId !== orgId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    // 1. Fetch all assessments for the organization
    const assessments = await prisma.assessment.findMany({
      where: { organizationId: orgId },
      include: { maturityBand: true },
      orderBy: { createdAt: 'desc' },
    });

    if (assessments.length === 0) {
      return res.json({
        latestAssessment: null,
        trends: [],
        priorityGaps: [],
        componentScores: [],
        domainScores: [],
      });
    }

    // Latest assessment is the first in the desc list
    const latest = assessments[0];

    // Fetch computed scores for latest assessment
    const computedScores = await prisma.computedScore.findMany({
      where: { assessmentId: latest.id },
      include: {
        component: {
          include: { domain: true },
        },
      },
    });

    // Format component scores (0-4 scaled to 0-100% for radar charts)
    const componentScoresFormatted = computedScores.map((cs) => {
      const rawScore = cs.componentScore ? Number(cs.componentScore) : 0;
      const normalizedScorePct = (rawScore / 4.0) * 100.0;
      return {
        componentId: cs.componentId,
        componentCode: cs.component.code,
        componentName: cs.component.name,
        domainId: cs.domainId,
        domainCode: cs.component.domain.code,
        domainName: cs.component.domain.name,
        rawScore,
        scorePct: Math.round(normalizedScorePct * 100) / 100,
      };
    });

    // Format domain scores
    // Domain scores are stored on the first component of each domain in computedScores table
    const domainScoresFormatted: any[] = [];
    const domains = await prisma.domain.findMany({ orderBy: { displayOrder: 'asc' } });
    
    for (const d of domains) {
      // Find components of this domain
      const compScores = componentScoresFormatted.filter((c) => c.domainId === d.id);
      let domainScorePct = 0;
      
      // Calculate domain average based on components
      const activeScores = compScores.filter((c) => c.rawScore !== null);
      if (activeScores.length > 0) {
        const sum = activeScores.reduce((acc, s) => acc + s.rawScore, 0);
        domainScorePct = ((sum / activeScores.length) / 4.0) * 100.0;
      }

      domainScoresFormatted.push({
        domainId: d.id,
        domainCode: d.code,
        domainName: d.name,
        scorePct: Math.round(domainScorePct * 100) / 100,
      });
    }

    // 2. Trend lines (completed/approved assessments over time)
    const trends = assessments
      .filter((a) => a.status === 'approved' || a.status === 'under_review' || a.status === 'in_progress')
      .reverse()
      .map((a) => ({
        assessmentId: a.id,
        cycleName: a.cycleName,
        chpmiScore: a.chpmiScore ? Number(a.chpmiScore) : 0,
        maturityBand: a.maturityBand?.label || 'Non-Existent',
        date: a.submittedAt || a.approvedAt || a.createdAt,
      }));

    // 3. Priority Gaps (top 3 lowest component scores in the latest assessment)
    const priorityGaps = [...componentScoresFormatted]
      .filter((c) => c.rawScore !== null)
      .sort((a, b) => a.rawScore - b.rawScore)
      .slice(0, 3); // top 3 gaps

    return res.json({
      latestAssessment: {
        id: latest.id,
        cycleName: latest.cycleName,
        status: latest.status,
        chpmiScore: latest.chpmiScore ? Number(latest.chpmiScore) : 0,
        maturityBand: latest.maturityBand?.label || 'Non-Existent',
        updatedAt: latest.updatedAt,
      },
      trends,
      priorityGaps,
      componentScores: componentScoresFormatted,
      domainScores: domainScoresFormatted,
      allAssessments: assessments.map((a) => ({
        id: a.id,
        cycleName: a.cycleName,
        status: a.status,
        chpmiScore: a.chpmiScore ? Number(a.chpmiScore) : 0,
        maturityBand: a.maturityBand?.label || 'Non-Existent',
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Fetch dashboard details error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard metrics' });
  }
});

// GET /dashboard/platform - Platform-wide dashboard for super_admin (all orgs aggregated)
router.get('/platform', authenticate, requireRole('super_admin'), async (req: AuthenticatedRequest, res) => {
  try {
    const organizations = await prisma.organization.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const allAssessments = await prisma.assessment.findMany({
      include: { maturityBand: true, organization: true },
      orderBy: { createdAt: 'desc' },
    });

    if (allAssessments.length === 0) {
      return res.json({
        latestAssessment: null,
        trends: [],
        priorityGaps: [],
        componentScores: [],
        domainScores: [],
        allAssessments: [],
        organizationCount: organizations.length,
      });
    }

    const latest = allAssessments[0];

    const computedScores = await prisma.computedScore.findMany({
      where: { assessmentId: latest.id },
      include: { component: { include: { domain: true } } },
    });

    const componentScoresFormatted = computedScores.map((cs) => {
      const rawScore = cs.componentScore ? Number(cs.componentScore) : 0;
      return {
        componentId: cs.componentId,
        componentCode: cs.component.code,
        componentName: cs.component.name,
        domainId: cs.domainId,
        domainCode: cs.component.domain.code,
        domainName: cs.component.domain.name,
        rawScore,
        scorePct: Math.round((rawScore / 4.0) * 100 * 100) / 100,
      };
    });

    const domains = await prisma.domain.findMany({ orderBy: { displayOrder: 'asc' } });
    const domainScoresFormatted = domains.map((d) => {
      const compScores = componentScoresFormatted.filter((c) => c.domainId === d.id);
      const active = compScores.filter((c) => c.rawScore > 0);
      const domainScorePct = active.length > 0
        ? Math.round(((active.reduce((s, c) => s + c.rawScore, 0) / active.length) / 4.0) * 100 * 100) / 100
        : 0;
      return { domainId: d.id, domainCode: d.code, domainName: d.name, scorePct: domainScorePct };
    });

    const trends = allAssessments
      .filter((a) => a.status === 'approved' || a.status === 'under_review' || a.status === 'in_progress')
      .reverse()
      .map((a) => ({
        assessmentId: a.id,
        cycleName: `${a.organization.name} \u2014 ${a.cycleName}`,
        chpmiScore: a.chpmiScore ? Number(a.chpmiScore) : 0,
        maturityBand: a.maturityBand?.label || 'Non-Existent',
        date: a.submittedAt || a.approvedAt || a.createdAt,
      }));

    const priorityGaps = [...componentScoresFormatted]
      .sort((a, b) => a.rawScore - b.rawScore)
      .slice(0, 3);

    return res.json({
      latestAssessment: {
        id: latest.id,
        cycleName: `${latest.organization.name} \u2014 ${latest.cycleName}`,
        status: latest.status,
        chpmiScore: latest.chpmiScore ? Number(latest.chpmiScore) : 0,
        maturityBand: latest.maturityBand?.label || 'Non-Existent',
        updatedAt: latest.updatedAt,
      },
      trends,
      priorityGaps,
      componentScores: componentScoresFormatted,
      domainScores: domainScoresFormatted,
      organizationCount: organizations.length,
      allAssessments: allAssessments.map((a) => ({
        id: a.id,
        cycleName: `${a.organization.name} \u2014 ${a.cycleName}`,
        status: a.status,
        chpmiScore: a.chpmiScore ? Number(a.chpmiScore) : 0,
        maturityBand: a.maturityBand?.label || 'Non-Existent',
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Fetch platform dashboard error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch platform dashboard' });
  }
});

// GET /analytics/benchmarks - Cross-organization average component scores (anonymized)
router.get('/benchmarks', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    // 1. Fetch all computed scores for approved assessments
    const allApprovedScores = await prisma.computedScore.findMany({
      where: {
        assessment: {
          status: 'approved',
        },
      },
      include: {
        component: true,
      },
    });

    if (allApprovedScores.length === 0) {
      return res.json([]);
    }

    // 2. Group by component and average
    const componentScoresMap = new Map<string, { code: string; name: string; scores: number[] }>();

    for (const score of allApprovedScores) {
      if (score.componentScore !== null) {
        const compId = score.componentId;
        if (!componentScoresMap.has(compId)) {
          componentScoresMap.set(compId, {
            code: score.component.code,
            name: score.component.name,
            scores: [],
          });
        }
        componentScoresMap.get(compId)!.scores.push(Number(score.componentScore));
      }
    }

    const benchmarks: any[] = [];
    for (const [compId, data] of componentScoresMap.entries()) {
      const avgRaw = data.scores.reduce((acc, s) => acc + s, 0) / data.scores.length;
      benchmarks.push({
        componentId: compId,
        componentCode: data.code,
        componentName: data.name,
        averageRawScore: Math.round(avgRaw * 100) / 100,
        averageScorePct: Math.round(((avgRaw / 4.0) * 100.0) * 100) / 100,
      });
    }

    return res.json(benchmarks);
  } catch (error) {
    console.error('Fetch benchmarks error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch benchmark analysis' });
  }
});

export default router;
