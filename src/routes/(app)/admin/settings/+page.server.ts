import { db, stages } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const allStages = await db
		.select({
			id: stages.id,
			name: stages.name,
			order: stages.order,
			probability: stages.probability,
			color: stages.color,
			description: stages.description,
			isWon: stages.isWon,
			isLost: stages.isLost,
			opportunityCount: sql<number>`(SELECT COUNT(*) FROM opportunities WHERE stage_id = ${stages.id})`
		})
		.from(stages)
		.orderBy(stages.order);

	return {
		user: locals.user,
		stages: allStages
	};
};
