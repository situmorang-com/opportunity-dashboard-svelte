import { json } from '@sveltejs/kit';
import { db, activities } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

function buildScheduledAt(date: string | null, time: string | null): string | null {
	if (!date) return null;
	if (!time) return date;
	return `${date}T${time}`;
}

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
		const scheduledDate = typeof body.scheduledDate === 'string' ? body.scheduledDate : '';
		const scheduledTime = typeof body.scheduledTime === 'string' ? body.scheduledTime : '';

		if (!scheduledDate) {
			return json({ error: 'Meeting date is required' }, { status: 400 });
		}

		const scheduledAt = buildScheduledAt(scheduledDate, scheduledTime);

		await db
			.update(activities)
			.set({
				scheduledAt,
				status: 'planned'
			})
			.where(eq(activities.id, meetingId));

		return json({ success: true });
	} catch (error) {
		console.error('Error rescheduling meeting:', error);
		return json({ error: 'Failed to reschedule meeting' }, { status: 500 });
	}
};
