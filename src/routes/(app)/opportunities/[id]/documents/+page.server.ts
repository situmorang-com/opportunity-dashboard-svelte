import { error } from '@sveltejs/kit';
import { db, opportunities, opportunityDocuments, clients } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');
  const opportunityId = parseInt(params.id);
  if (isNaN(opportunityId)) error(400, 'Invalid ID');

  const [opp] = await db.select({
    id: opportunities.id, title: opportunities.title, clientId: opportunities.clientId,
  }).from(opportunities).where(eq(opportunities.id, opportunityId));
  if (!opp) error(404, 'Opportunity not found');

  let clientName = '';
  if (opp.clientId) {
    const [client] = await db.select({ name: clients.name }).from(clients).where(eq(clients.id, opp.clientId));
    clientName = client?.name || '';
  }

  const docs = await db.select().from(opportunityDocuments)
    .where(eq(opportunityDocuments.opportunityId, opportunityId))
    .orderBy(opportunityDocuments.createdAt);

  return { opportunity: { ...opp, clientName }, documents: docs };
};
