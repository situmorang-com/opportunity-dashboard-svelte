import { json } from '@sveltejs/kit';
import { db, contactActivities, clientContacts } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// PATCH - Update an activity
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const contactId = Number(params.id);
	const activityId = Number(params.activityId);

	if (!Number.isFinite(contactId) || !Number.isFinite(activityId)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	try {
		// Verify activity exists and belongs to the contact
		const [existingActivity] = await db
			.select()
			.from(contactActivities)
			.where(
				and(
					eq(contactActivities.id, activityId),
					eq(contactActivities.contactId, contactId)
				)
			);

		if (!existingActivity) {
			return json({ error: 'Activity not found' }, { status: 404 });
		}

		const body = await request.json();
		const { type, title, description, outcome, activityDate, duration } = body;

		const [updatedActivity] = await db
			.update(contactActivities)
			.set({
				type: type ?? existingActivity.type,
				title: title ?? existingActivity.title,
				description: description ?? existingActivity.description,
				outcome: outcome ?? existingActivity.outcome,
				activityDate: activityDate ?? existingActivity.activityDate,
				duration: duration ?? existingActivity.duration,
				updatedAt: new Date()
			})
			.where(eq(contactActivities.id, activityId))
			.returning();

		// Update contact's updatedAt timestamp
		await db
			.update(clientContacts)
			.set({ updatedAt: new Date() })
			.where(eq(clientContacts.id, contactId));

		return json(updatedActivity);
	} catch (error) {
		console.error('Error updating activity:', error);
		return json({ error: 'Failed to update activity' }, { status: 500 });
	}
};

// DELETE - Delete an activity
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const contactId = Number(params.id);
	const activityId = Number(params.activityId);

	if (!Number.isFinite(contactId) || !Number.isFinite(activityId)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	try {
		// Verify activity exists and belongs to the contact
		const [existingActivity] = await db
			.select()
			.from(contactActivities)
			.where(
				and(
					eq(contactActivities.id, activityId),
					eq(contactActivities.contactId, contactId)
				)
			);

		if (!existingActivity) {
			return json({ error: 'Activity not found' }, { status: 404 });
		}

		await db
			.delete(contactActivities)
			.where(eq(contactActivities.id, activityId));

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting activity:', error);
		return json({ error: 'Failed to delete activity' }, { status: 500 });
	}
};
