import { json } from '@sveltejs/kit';
import { db, worklistActions } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
		const status =
			body.status === 'open' || body.status === 'done' || body.status === 'snoozed'
				? body.status
				: null;
		const snoozedUntil =
			typeof body.snoozedUntil === 'string' && body.snoozedUntil.trim()
				? body.snoozedUntil.trim()
				: null;

		if (!itemId) {
			return json({ error: 'itemId is required' }, { status: 400 });
		}

		if (!status) {
			return json({ error: 'Invalid status' }, { status: 400 });
		}

		if (status === 'snoozed' && !snoozedUntil) {
			return json({ error: 'snoozedUntil is required when snoozing' }, { status: 400 });
		}

		const values = {
			userId: locals.user.id,
			itemId,
			status,
			snoozedUntil: status === 'snoozed' ? snoozedUntil : null,
			updatedAt: new Date()
		};

		const [record] = await db
			.insert(worklistActions)
			.values({
				...values,
				createdAt: new Date()
			})
			.onConflictDoUpdate({
				target: [worklistActions.userId, worklistActions.itemId],
				set: values
			})
			.returning();

		return json({ success: true, action: record });
	} catch (error) {
		console.error('Error saving worklist action:', error);
		return json({ error: 'Failed to save worklist action' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const itemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
		if (!itemId) {
			return json({ error: 'itemId is required' }, { status: 400 });
		}

		await db
			.delete(worklistActions)
			.where(and(eq(worklistActions.userId, locals.user.id), eq(worklistActions.itemId, itemId)));

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting worklist action:', error);
		return json({ error: 'Failed to delete worklist action' }, { status: 500 });
	}
};
