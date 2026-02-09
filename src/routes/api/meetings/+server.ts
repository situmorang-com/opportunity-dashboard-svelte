import { json } from '@sveltejs/kit';
import { db, activities } from '$lib/server/db';
import type { RequestHandler } from './$types';

function buildScheduledAt(date: string | null, time: string | null): string | null {
	if (!date) return null;
	if (!time) return date;
	return `${date}T${time}`;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const title = (formData.get('title') as string) ?? '';
		const opportunityId = (formData.get('opportunityId') as string) ?? '';
		const scheduledDate = (formData.get('scheduledDate') as string) ?? '';
		const scheduledTime = (formData.get('scheduledTime') as string) ?? '';
		const description = (formData.get('description') as string) ?? '';
		const durationStr = (formData.get('duration') as string) ?? '';
		const duration = durationStr ? parseInt(durationStr, 10) : null;

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

		const [newMeeting] = await db
			.insert(activities)
			.values({
				opportunityId: parseInt(opportunityId, 10),
				userId: locals.user.id,
				type: 'meeting',
				title: title.trim(),
				description: description?.trim() || null,
				scheduledAt,
				duration,
				status: 'planned'
			})
			.returning();

		return json(newMeeting, { status: 201 });
	} catch (error) {
		console.error('Error creating meeting:', error);
		return json({ error: 'Failed to create meeting' }, { status: 500 });
	}
};
