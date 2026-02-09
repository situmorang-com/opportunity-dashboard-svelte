import { db, stages, opportunities, clients, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [allStages, allOpportunities, allClients, allUsers] = await Promise.all([
		db.select().from(stages).orderBy(stages.order),
		db
			.select({
				id: opportunities.id,
				title: opportunities.title,
				description: opportunities.description,
				value: opportunities.value,
				probability: opportunities.probability,
				stageId: opportunities.stageId,
				clientId: opportunities.clientId,
				ownerId: opportunities.ownerId,
				fabricWorkloads: opportunities.fabricWorkloads,
				expectedCloseDate: opportunities.expectedCloseDate,
				capacityUnits: opportunities.capacityUnits,
				migrationSource: opportunities.migrationSource,
				competitor: opportunities.competitor,
				createdAt: opportunities.createdAt,
				updatedAt: opportunities.updatedAt,
				client: {
					id: clients.id,
					name: clients.name
				},
				owner: {
					id: users.id,
					name: users.name,
					email: users.email,
					avatarUrl: users.avatarUrl
				}
			})
			.from(opportunities)
			.leftJoin(clients, eq(opportunities.clientId, clients.id))
			.leftJoin(users, eq(opportunities.ownerId, users.id)),
		db.select().from(clients),
		db
			.select({
				id: users.id,
				name: users.name
			})
			.from(users)
	]);

	return {
		user: locals.user,
		stages: allStages,
		opportunities: allOpportunities,
		clients: allClients,
		users: allUsers
	};
};
