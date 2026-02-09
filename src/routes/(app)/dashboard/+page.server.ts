import { db, stages, opportunities, activities, clients, users } from '$lib/server/db';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [allStages, allOpportunities, recentActivities] = await Promise.all([
		db.select().from(stages).orderBy(stages.order),
		db
			.select({
				id: opportunities.id,
				title: opportunities.title,
				value: opportunities.value,
				probability: opportunities.probability,
				stageId: opportunities.stageId,
				clientId: opportunities.clientId,
				ownerId: opportunities.ownerId,
				fabricWorkloads: opportunities.fabricWorkloads,
				expectedCloseDate: opportunities.expectedCloseDate,
				createdAt: opportunities.createdAt,
				client: {
					id: clients.id,
					name: clients.name
				},
				owner: {
					id: users.id,
					name: users.name,
					avatarUrl: users.avatarUrl
				}
			})
			.from(opportunities)
			.leftJoin(clients, eq(opportunities.clientId, clients.id))
			.leftJoin(users, eq(opportunities.ownerId, users.id)),
		db
			.select({
				id: activities.id,
				type: activities.type,
				title: activities.title,
				description: activities.description,
				createdAt: activities.createdAt,
				user: {
					id: users.id,
					name: users.name,
					avatarUrl: users.avatarUrl
				},
				opportunity: {
					id: opportunities.id,
					title: opportunities.title
				}
			})
			.from(activities)
			.leftJoin(users, eq(activities.userId, users.id))
			.leftJoin(opportunities, eq(activities.opportunityId, opportunities.id))
			.orderBy(desc(activities.createdAt))
			.limit(10)
	]);

	return {
		user: locals.user,
		stages: allStages,
		opportunities: allOpportunities,
		activities: recentActivities
	};
};
