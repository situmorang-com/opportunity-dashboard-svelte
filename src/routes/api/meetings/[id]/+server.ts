import { json } from '@sveltejs/kit';
import { db, activities } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

function buildScheduledAt(date: string | null, time: string | null): string | null {
	if (!date) return null;
	if (!time) return date;
	return `${date}T${time}`;
}

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const meetingId = Number(params.id);
	if (!Number.isFinite(meetingId)) {
		return json({ error: 'Invalid meeting id' }, { status: 400 });
	}

	try {
		const [deletedMeeting] = await db
			.delete(activities)
			.where(and(eq(activities.id, meetingId), eq(activities.type, 'meeting')))
			.returning();

		if (!deletedMeeting) {
			return json({ error: 'Meeting not found' }, { status: 404 });
		}

		return json({ success: true, id: deletedMeeting.id });
	} catch (error) {
		console.error('Error deleting meeting:', error);
		return json({ error: 'Failed to delete meeting' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const meetingId = Number(params.id);
	if (!Number.isFinite(meetingId)) {
		return json({ error: 'Invalid meeting id' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const title = typeof body.title === 'string' ? body.title : '';
		const opportunityId = typeof body.opportunityId === 'string' || typeof body.opportunityId === 'number'
			? String(body.opportunityId)
			: '';
		const scheduledDate = typeof body.scheduledDate === 'string' ? body.scheduledDate : '';
		const scheduledTime = typeof body.scheduledTime === 'string' ? body.scheduledTime : '';
		const description = typeof body.description === 'string' ? body.description : '';
		const duration = typeof body.duration === 'number' ? body.duration : null;

		if (!title.trim()) {
			return json({ error: 'Title is required' }, { status: 400 });
		}

		if (!opportunityId) {
			return json({ error: 'Opportunity is required' }, { status: 400 });
		}

		if (!scheduledDate) {
			return json({ error: 'Meeting date is required' }, { status: 400 });
		}

		const scheduledAt = buildScheduledAt(scheduledDate, scheduledTime);

		const [updatedMeeting] = await db
			.update(activities)
			.set({
				opportunityId: parseInt(opportunityId, 10),
				title: title.trim(),
				description: description?.trim() || null,
				scheduledAt,
				duration
			})
			.where(and(eq(activities.id, meetingId), eq(activities.type, 'meeting')))
			.returning();

		if (!updatedMeeting) {
			return json({ error: 'Meeting not found' }, { status: 404 });
		}

		return json(updatedMeeting);
	} catch (error) {
		console.error('Error updating meeting:', error);
		return json({ error: 'Failed to update meeting' }, { status: 500 });
	}
};
