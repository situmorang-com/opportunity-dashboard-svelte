import { json } from '@sveltejs/kit';
import { db, opportunities, clients, stages, discoveryAssessments } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { analyzeDeal } from '$lib/server/ai/deal-coach';
import { calculateDealHealth } from '$lib/server/deal-health';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const opportunityId = parseInt(params.id);
  if (isNaN(opportunityId)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const [result] = await db.select({
      opportunity: opportunities, client: clients, stage: stages,
    }).from(opportunities)
      .leftJoin(clients, eq(opportunities.clientId, clients.id))
      .leftJoin(stages, eq(opportunities.stageId, stages.id))
      .where(eq(opportunities.id, opportunityId));

    if (!result) return json({ error: 'Not found' }, { status: 404 });

    const [assessment] = await db.select().from(discoveryAssessments)
      .where(eq(discoveryAssessments.opportunityId, opportunityId));

    const health = calculateDealHealth(result.opportunity, result.stage || undefined);

    const opportunityData = {
      title: result.opportunity.title,
      client: result.client?.name,
      clientIndustry: result.client?.industry,
      stage: result.stage?.name,
      stageOrder: result.stage?.order,
      value: result.opportunity.value,
      probability: result.opportunity.probability,
      expectedCloseDate: result.opportunity.expectedCloseDate,
      competitor: result.opportunity.competitor,
      fabricWorkloads: result.opportunity.fabricWorkloads,
      authorityName: result.opportunity.authorityName,
      championName: result.opportunity.championName,
      immediateNextStep: result.opportunity.immediateNextStep,
      objectives: result.opportunity.objectives,
      keyPainPoints: result.opportunity.keyPainPoints,
      potentialRoadblocks: result.opportunity.potentialRoadblocks,
      coSellStatus: result.opportunity.coSellStatus,
      timeline: result.opportunity.timeline,
      dealHealthScore: health.score,
      dealHealthStatus: health.status,
      dealHealthReasons: health.reasons,
      assessmentHighlights: assessment ? {
        businessObjective: assessment.businessObjective,
        technicalReadiness: assessment.technicalReadiness,
        budgetApproved: assessment.budgetApproved,
        risks: assessment.risks,
      } : null,
    };

    const analysis = await analyzeDeal(opportunityData);
    return json(analysis);
  } catch (err) {
    console.error('AI coach error:', err);
    return json({ error: 'AI analysis failed' }, { status: 500 });
  }
};
