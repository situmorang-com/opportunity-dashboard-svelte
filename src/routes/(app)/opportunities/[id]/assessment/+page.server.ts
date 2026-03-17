import { error } from '@sveltejs/kit';
import { db, opportunities, clients, stages, discoveryAssessments } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const opportunityId = parseInt(params.id);
	if (isNaN(opportunityId)) {
		error(400, 'Invalid opportunity ID');
	}

	const [result] = await db
		.select({
			opportunity: opportunities,
			client: clients,
			stage: stages
		})
		.from(opportunities)
		.leftJoin(clients, eq(opportunities.clientId, clients.id))
		.leftJoin(stages, eq(opportunities.stageId, stages.id))
		.where(eq(opportunities.id, opportunityId));

	if (!result) {
		error(404, 'Opportunity not found');
	}

	const [assessment] = await db
		.select()
		.from(discoveryAssessments)
		.where(eq(discoveryAssessments.opportunityId, opportunityId));

	return {
		opportunity: result.opportunity,
		client: result.client,
		stage: result.stage,
		assessment: assessment || null
	};
};
