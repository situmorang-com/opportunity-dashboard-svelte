import { json } from '@sveltejs/kit';
import { db, activities, opportunities } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const meetingId = Number(params.id);
	if (!Number.isFinite(meetingId)) {
		return json({ error: 'Invalid meeting id' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const outcome = typeof body.outcome === 'string' ? body.outcome.trim() : '';
		const nextSteps = typeof body.nextSteps === 'string' ? body.nextSteps.trim() : '';

		if (!outcome) {
			return json({ error: 'Outcome is required' }, { status: 400 });
		}
		if (!nextSteps) {
			return json({ error: 'Next steps are required' }, { status: 400 });
		}

		const [meeting] = await db
			.select({
				id: activities.id,
				opportunityId: activities.opportunityId
			})
			.from(activities)
			.where(eq(activities.id, meetingId));

		if (!meeting) {
			return json({ error: 'Meeting not found' }, { status: 404 });
		}

		await db
			.update(activities)
			.set({
				outcome,
				completedAt: new Date().toISOString(),
				status: 'completed'
			})
			.where(eq(activities.id, meetingId));

		await db
			.update(opportunities)
			.set({
				immediateNextStep: nextSteps
			})
			.where(eq(opportunities.id, meeting.opportunityId));

		return json({ success: true });
	} catch (error) {
		console.error('Error saving meeting outcome:', error);
		return json({ error: 'Failed to save meeting outcome' }, { status: 500 });
	}
};
