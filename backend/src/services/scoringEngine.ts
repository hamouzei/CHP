import { Prisma } from '@prisma/client';
import prisma from '../config/db';

export interface ComponentScoreResult {
  componentId: string;
  componentScore: number | null;
  domainId: string;
}

export interface DomainScoreResult {
  domainId: string;
  domainScorePct: number | null;
}

export interface RecalculationResult {
  chpmiScore: number;
  maturityBandLabel: string;
  componentScores: ComponentScoreResult[];
  domainScores: DomainScoreResult[];
}

/**
 * Calculates a component score as the arithmetic mean of its criteria scores.
 * Criteria scores not yet set (null) are excluded from the average.
 */
export function calculateComponentScore(scores: number[]): number | null {
  const validScores = scores.filter((s) => s !== null && s >= 0 && s <= 4);
  if (validScores.length === 0) return null;
  const sum = validScores.reduce((acc, s) => acc + s, 0);
  return sum / validScores.length;
}

/**
 * Calculates the overall CHPMI score as:
 * (Sum of all 30 criteria scores) / 120 * 100
 * Any unscored criteria are treated as 0 in the sum.
 */
export function calculateCHPMI(allCriteriaScores: number[]): number {
  const MAX_TOTAL = 30 * 4; // 120
  const validScores = allCriteriaScores.filter((s) => s !== null && s >= 0 && s <= 4);
  const sum = validScores.reduce((acc, s) => acc + s, 0);
  return (sum / MAX_TOTAL) * 100;
}

/**
 * Recalculates all scores for a given assessment and persists them to the database.
 * Updates Component scores, Domain scores, overall CHPMI, and maturity band.
 */
export async function recalculateAssessment(assessmentId: string): Promise<RecalculationResult> {
  // 1. Fetch the assessment, all responses, and framework structures
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { responses: true },
  });

  if (!assessment) {
    throw new Error(`Assessment not found: ${assessmentId}`);
  }

  // Fetch all domains, components, and criteria
  const domains = await prisma.domain.findMany({
    orderBy: { displayOrder: 'asc' },
    include: {
      components: {
        orderBy: { displayOrder: 'asc' },
        include: { criteria: true },
      },
    },
  });

  // Create a map of criteriaId to response score
  const responseMap = new Map<string, number>();
  for (const resp of assessment.responses) {
    if (resp.score !== null) {
      responseMap.set(resp.criteriaId, resp.score);
    }
  }

  // 2. Compute Component Scores
  const componentScores: ComponentScoreResult[] = [];
  const allCriteriaScores: number[] = [];

  for (const domain of domains) {
    for (const comp of domain.components) {
      const compCriteriaScores: number[] = [];
      for (const crit of comp.criteria) {
        const score = responseMap.get(crit.id);
        if (score !== undefined) {
          compCriteriaScores.push(score);
          allCriteriaScores.push(score);
        }
      }

      const compScore = calculateComponentScore(compCriteriaScores);
      componentScores.push({
        componentId: comp.id,
        componentScore: compScore,
        domainId: domain.id,
      });
    }
  }

  // 3. Compute Domain Scores
  const domainScores: DomainScoreResult[] = [];
  const domainComponentScoresMap = new Map<string, number[]>();

  for (const cs of componentScores) {
    if (cs.componentScore !== null) {
      if (!domainComponentScoresMap.has(cs.domainId)) {
        domainComponentScoresMap.set(cs.domainId, []);
      }
      domainComponentScoresMap.get(cs.domainId)!.push(cs.componentScore);
    }
  }

  for (const domain of domains) {
    const scores = domainComponentScoresMap.get(domain.id) || [];
    let domainScorePct: number | null = null;
    if (scores.length > 0) {
      const avgCompScore = scores.reduce((acc, s) => acc + s, 0) / scores.length;
      domainScorePct = (avgCompScore / 4.0) * 100.0;
    }
    domainScores.push({
      domainId: domain.id,
      domainScorePct,
    });
  }

  // 4. Compute overall CHPMI Score
  const chpmiScore = calculateCHPMI(allCriteriaScores);

  // 5. Look up Maturity Band
  const roundedScore = Math.round(chpmiScore * 100) / 100;
  const band = await prisma.maturityBand.findFirst({
    where: {
      minScore: { lte: new Prisma.Decimal(roundedScore) },
      maxScore: { gte: new Prisma.Decimal(roundedScore) },
    },
    orderBy: { displayOrder: 'asc' },
  });

  if (!band) {
    throw new Error(`No maturity band matching score ${chpmiScore}`);
  }

  // 6. Persist Component and Domain Scores
  for (const domain of domains) {
    // Sort components of this domain to find the "first" component
    const sortedComps = domain.components; // already ordered in findMany
    const firstComp = sortedComps[0];

    const dScore = domainScores.find((ds) => ds.domainId === domain.id);
    const domainScorePct = dScore ? dScore.domainScorePct : null;

    for (const comp of sortedComps) {
      const cScore = componentScores.find((cs) => cs.componentId === comp.id);
      const componentScore = cScore ? cScore.componentScore : null;

      // Only set domain score pct for the first component in the domain
      const isFirst = comp.id === firstComp.id;
      const finalDomainScorePct = isFirst ? domainScorePct : null;

      await prisma.computedScore.upsert({
        where: {
          assessmentId_componentId: {
            assessmentId,
            componentId: comp.id,
          },
        },
        update: {
          componentScore: componentScore !== null ? new Prisma.Decimal(componentScore) : null,
          domainScorePct: finalDomainScorePct !== null ? new Prisma.Decimal(finalDomainScorePct) : null,
          updatedAt: new Date(),
        },
        create: {
          assessmentId,
          componentId: comp.id,
          domainId: domain.id,
          componentScore: componentScore !== null ? new Prisma.Decimal(componentScore) : null,
          domainScorePct: finalDomainScorePct !== null ? new Prisma.Decimal(finalDomainScorePct) : null,
        },
      });

      // Update response table component_score column for references (C01.1, C01.2, C01.3 criteria link back)
      if (componentScore !== null) {
        await prisma.response.updateMany({
          where: {
            assessmentId,
            criterion: {
              componentId: comp.id,
            },
          },
          data: {
            componentScore: new Prisma.Decimal(componentScore),
          },
        });
      }
    }
  }

  // 7. Update Assessment main scores
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      chpmiScore: new Prisma.Decimal(roundedScore),
      maturityBandId: band.id,
      updatedAt: new Date(),
    },
  });

  return {
    chpmiScore: roundedScore,
    maturityBandLabel: band.label,
    componentScores,
    domainScores,
  };
}
