import { error } from '@sveltejs/kit';
import { db, opportunities, clients, stages, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { format } from 'date-fns';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) error(401, 'Unauthorized');
  const opportunityId = parseInt(params.id);
  if (isNaN(opportunityId)) error(400, 'Invalid ID');

  const [result] = await db.select({
    opportunity: opportunities, client: clients, stage: stages,
    owner: { id: users.id, name: users.name, email: users.email },
  }).from(opportunities)
    .leftJoin(clients, eq(opportunities.clientId, clients.id))
    .leftJoin(stages, eq(opportunities.stageId, stages.id))
    .leftJoin(users, eq(opportunities.ownerId, users.id))
    .where(eq(opportunities.id, opportunityId));

  if (!result) error(404, 'Opportunity not found');
  return { ...result, generatedDate: format(new Date(), 'MMMM d, yyyy') };
};
