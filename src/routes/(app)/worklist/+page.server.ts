import { redirect } from '@sveltejs/kit';
import { db, opportunities, clients, stages, activities, worklistActions, users } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { calculateDealHealth } from '$lib/server/deal-health';
import { buildWorklist } from '$lib/server/worklist';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}
	const currentUser = locals.user;

	const canViewOthers = currentUser.role === 'admin' || currentUser.role === 'manager';
	const requestedRepId = url.searchParams.get('rep');
	const targetUserId = canViewOthers && requestedRepId ? requestedRepId : currentUser.id;

	const [allStages, allOpportunities, allMeetings, userWorklistActions, availableUsers] = await Promise.all([
		db.select().from(stages).orderBy(stages.order),
		db
			.select({
				id: opportunities.id,
				title: opportunities.title,
				stageId: opportunities.stageId,
				expectedCloseDate: opportunities.expectedCloseDate,
				immediateNextStep: opportunities.immediateNextStep,
				championName: opportunities.championName,
				authorityName: opportunities.authorityName,
				timeline: opportunities.timeline,
				value: opportunities.value,
				probability: opportunities.probability,
				wonDate: opportunities.wonDate,
				lostDate: opportunities.lostDate,
				updatedAt: opportunities.updatedAt,
				client: {
					id: clients.id,
					name: clients.name
				}
			})
			.from(opportunities)
			.leftJoin(clients, eq(opportunities.clientId, clients.id))
			.where(eq(opportunities.ownerId, targetUserId)),
		db
			.select({
				id: activities.id,
				opportunityId: activities.opportunityId,
				title: activities.title,
				scheduledAt: activities.scheduledAt,
				completedAt: activities.completedAt,
				outcome: activities.outcome,
				status: activities.status,
				opportunity: {
					id: opportunities.id,
					title: opportunities.title
				},
				client: {
					name: clients.name
				},
				stage: {
					name: stages.name
				}
			})
			.from(activities)
			.leftJoin(opportunities, eq(activities.opportunityId, opportunities.id))
			.leftJoin(clients, eq(opportunities.clientId, clients.id))
			.leftJoin(stages, eq(opportunities.stageId, stages.id))
			.where(and(eq(activities.type, 'meeting'), eq(activities.userId, targetUserId))),
		db
			.select()
			.from(worklistActions)
			.where(eq(worklistActions.userId, targetUserId)),
		canViewOthers
			? db
					.select({
						id: users.id,
						name: users.name,
						email: users.email,
						role: users.role
					})
					.from(users)
			: Promise.resolve([
					{
						id: currentUser.id,
						name: currentUser.name,
						email: currentUser.email,
						role: currentUser.role
					}
				])
	]);

	const stageById = new Map(allStages.map((stage) => [stage.id, stage]));
	const opportunitiesWithHealth = allOpportunities.map((opp) => ({
		...opp,
		health: calculateDealHealth(opp, stageById.get(opp.stageId))
	}));

	const rawItems = buildWorklist({
		opportunities: opportunitiesWithHealth,
		meetings: allMeetings,
		stages: allStages
	});

	const actionByItemId = new Map(userWorklistActions.map((action) => [action.itemId, action]));
	const now = new Date();
	const items = rawItems.filter((item) => {
		const action = actionByItemId.get(item.id);
		if (!action) return true;
		if (action.status === 'done') return false;
		if (action.status === 'snoozed' && action.snoozedUntil) {
			const until = new Date(action.snoozedUntil);
			if (!Number.isNaN(until.getTime()) && until > now) return false;
		}
		return true;
	});

	const selectedUser =
		availableUsers.find((user) => user.id === targetUserId) ??
		availableUsers.find((user) => user.id === currentUser.id) ??
		null;

	return {
		user: currentUser,
		viewMode: canViewOthers ? 'manager' : 'self',
		targetUserId,
		selectedUser,
		availableUsers: canViewOthers ? availableUsers : [],
		items,
		summary: {
			total: items.length,
			overdue: items.filter((item) => item.bucket === 'overdue').length,
			today: items.filter((item) => item.bucket === 'today').length,
			atRisk: items.filter((item) => item.type === 'stale_deal' || item.type === 'overdue_close').length,
			missingNextStep: items.filter((item) => item.type === 'missing_next_step').length,
			meetings: items.filter((item) => item.type.startsWith('meeting_') || item.type === 'upcoming_meeting_prep').length
		}
	};
};
