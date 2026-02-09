import { json } from '@sveltejs/kit';
import { db, opportunities, activities, stages } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const opportunityId = parseInt(params.id);
	if (isNaN(opportunityId)) {
		return json({ error: 'Invalid opportunity ID' }, { status: 400 });
	}

	try {
		const { stageId } = await request.json();

		if (!stageId) {
			return json({ error: 'Stage ID is required' }, { status: 400 });
		}

		// Get the opportunity and stage info
		const [opportunity] = await db
			.select()
			.from(opportunities)
			.where(eq(opportunities.id, opportunityId));

		if (!opportunity) {
			return json({ error: 'Opportunity not found' }, { status: 404 });
		}

		const [oldStage] = await db.select().from(stages).where(eq(stages.id, opportunity.stageId));
		const [newStage] = await db.select().from(stages).where(eq(stages.id, stageId));

		if (!newStage) {
			return json({ error: 'Stage not found' }, { status: 404 });
		}

		// Update the opportunity
		const updateData: Record<string, unknown> = {
			stageId,
			probability: newStage.probability,
			updatedAt: new Date()
		};

		// Set won/lost dates
		if (newStage.isWon) {
			updateData.wonDate = new Date().toISOString().split('T')[0];
		} else if (newStage.isLost) {
			updateData.lostDate = new Date().toISOString().split('T')[0];
		}

		await db
			.update(opportunities)
			.set(updateData)
			.where(eq(opportunities.id, opportunityId));

		// Create activity for stage change
		await db.insert(activities).values({
			opportunityId,
			userId: locals.user.id,
			type: 'stage_change',
			title: `Moved from ${oldStage?.name || 'Unknown'} to ${newStage.name}`
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error updating opportunity stage:', error);
		return json({ error: 'Failed to update stage' }, { status: 500 });
	}
};
