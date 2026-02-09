import { error } from '@sveltejs/kit';
import { db, opportunities, clients, stages, users, activities, clientContacts } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const opportunityId = parseInt(params.id);
	if (isNaN(opportunityId)) {
		error(400, 'Invalid opportunity ID');
	}

	// Load opportunity with ALL fields + related data
	const [result] = await db
		.select({
			opportunity: opportunities,
			client: clients,
			stage: stages,
			owner: {
				id: users.id,
				name: users.name,
				email: users.email
			}
		})
		.from(opportunities)
		.leftJoin(clients, eq(opportunities.clientId, clients.id))
		.leftJoin(stages, eq(opportunities.stageId, stages.id))
		.leftJoin(users, eq(opportunities.ownerId, users.id))
		.where(eq(opportunities.id, opportunityId));

	if (!result) {
		error(404, 'Opportunity not found');
	}

	// Load activities for this opportunity
	const opportunityActivities = await db
		.select({
			activity: activities,
			user: {
				id: users.id,
				name: users.name
			}
		})
		.from(activities)
		.leftJoin(users, eq(activities.userId, users.id))
		.where(eq(activities.opportunityId, opportunityId))
		.orderBy(desc(activities.createdAt));

	// Load stages for edit form
	const allStages = await db.select().from(stages).orderBy(stages.order);

	// Load clients for edit form
	const allClients = await db.select().from(clients).orderBy(clients.name);

	// Load users for edit form
	const allUsers = await db
		.select({ id: users.id, name: users.name })
		.from(users)
		.orderBy(users.name);

	// Load contacts for the opportunity's client (if client exists)
	let contacts: typeof clientContacts.$inferSelect[] = [];
	if (result.opportunity.clientId) {
		contacts = await db
			.select()
			.from(clientContacts)
			.where(eq(clientContacts.clientId, result.opportunity.clientId))
			.orderBy(clientContacts.name);
	}

	return {
		opportunity: result.opportunity,
		client: result.client,
		stage: result.stage,
		owner: result.owner,
		activities: opportunityActivities,
		stages: allStages,
		clients: allClients,
		users: allUsers,
		contacts
	};
};
