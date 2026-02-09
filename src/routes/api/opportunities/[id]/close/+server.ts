import { json } from '@sveltejs/kit';
import { db, opportunities, activities, stages } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const opportunityId = parseInt(params.id);
	if (isNaN(opportunityId)) {
		return json({ error: 'Invalid opportunity ID' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const { type, date, reason } = body as {
			type: 'won' | 'lost';
			date: string;
			reason?: string;
		};

		if (!type || !['won', 'lost'].includes(type)) {
			return json({ error: 'Invalid close type. Must be "won" or "lost"' }, { status: 400 });
		}

		if (!date) {
			return json({ error: 'Date is required' }, { status: 400 });
		}

		// Get the current opportunity
		const [currentOpp] = await db
			.select()
			.from(opportunities)
			.where(eq(opportunities.id, opportunityId));

		if (!currentOpp) {
			return json({ error: 'Opportunity not found' }, { status: 404 });
		}

		// Find the appropriate stage (Won or Lost)
		const allStages = await db.select().from(stages);
		let targetStage;

		if (type === 'won') {
			targetStage = allStages.find((s) => s.isWon);
		} else {
			targetStage = allStages.find((s) => s.isLost);
		}

		if (!targetStage) {
			return json(
				{ error: `No ${type === 'won' ? 'Won' : 'Lost'} stage configured` },
				{ status: 400 }
			);
		}

		// Update the opportunity
		const updateData: Record<string, unknown> = {
			stageId: targetStage.id,
			probability: type === 'won' ? 100 : 0,
			updatedAt: new Date()
		};

		if (type === 'won') {
			updateData.wonDate = date;
			updateData.lostDate = null;
			updateData.lostReason = null;
		} else {
			updateData.lostDate = date;
			updateData.lostReason = reason || null;
			updateData.wonDate = null;
		}

		const [updatedOpportunity] = await db
			.update(opportunities)
			.set(updateData)
			.where(eq(opportunities.id, opportunityId))
			.returning();

		// Create activity record
		const activityTitle =
			type === 'won'
				? `Deal Won - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentOpp.value || 0)}`
				: `Deal Lost${reason ? ` - ${reason}` : ''}`;

		await db.insert(activities).values({
			opportunityId: opportunityId,
			userId: locals.user.id,
			type: 'stage_change',
			title: activityTitle,
			description:
				type === 'won'
					? `Opportunity marked as Won on ${date}`
					: `Opportunity marked as Lost on ${date}${reason ? `. Reason: ${reason}` : ''}`,
			completedAt: new Date().toISOString()
		});

		return json({
			success: true,
			opportunity: updatedOpportunity,
			stage: targetStage
		});
	} catch (err) {
		console.error('Error closing opportunity:', err);
		return json({ error: 'Failed to close opportunity' }, { status: 500 });
	}
};
