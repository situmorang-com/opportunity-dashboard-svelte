import { json } from '@sveltejs/kit';
import { db, opportunities, clients, stages } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { extractDiscoveryFromNotes } from '$lib/server/ai/auto-discovery';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const opportunityId = parseInt(params.id);
  if (isNaN(opportunityId)) return json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const { meetingNotes } = await request.json();
    if (!meetingNotes?.trim()) return json({ error: 'Meeting notes required' }, { status: 400 });

    const [result] = await db.select({
      opportunity: opportunities, client: clients, stage: stages,
    }).from(opportunities)
      .leftJoin(clients, eq(opportunities.clientId, clients.id))
      .leftJoin(stages, eq(opportunities.stageId, stages.id))
      .where(eq(opportunities.id, opportunityId));

    if (!result) return json({ error: 'Not found' }, { status: 404 });

    const workloads = Array.isArray(result.opportunity.fabricWorkloads)
      ? result.opportunity.fabricWorkloads
      : JSON.parse(result.opportunity.fabricWorkloads as string || '[]');

    const extracted = await extractDiscoveryFromNotes(meetingNotes, {
      title: result.opportunity.title,
      client: result.client?.name,
      stage: result.stage?.name,
      workloads,
    });

    return json(extracted);
  } catch (err) {
    console.error('Auto-discovery error:', err);
    return json({ error: 'AI extraction failed' }, { status: 500 });
  }
};
