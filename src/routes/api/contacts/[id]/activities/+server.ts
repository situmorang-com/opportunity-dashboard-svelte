import { json } from '@sveltejs/kit';
import { db, contactActivities, users, clientContacts } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET - List all activities for a contact
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const contactId = Number(params.id);
	if (!Number.isFinite(contactId)) {
		return json({ error: 'Invalid contact ID' }, { status: 400 });
	}

	try {
		const activities = await db
			.select({
				id: contactActivities.id,
				contactId: contactActivities.contactId,
				type: contactActivities.type,
				title: contactActivities.title,
				description: contactActivities.description,
				outcome: contactActivities.outcome,
				activityDate: contactActivities.activityDate,
				duration: contactActivities.duration,
				createdAt: contactActivities.createdAt,
				updatedAt: contactActivities.updatedAt,
				user: {
					id: users.id,
					name: users.name
				}
			})
			.from(contactActivities)
			.leftJoin(users, eq(contactActivities.userId, users.id))
			.where(eq(contactActivities.contactId, contactId))
			.orderBy(desc(contactActivities.activityDate));

		return json(activities);
	} catch (error) {
		console.error('Error fetching activities:', error);
		return json({ error: 'Failed to fetch activities' }, { status: 500 });
	}
};

// POST - Create a new activity/touchpoint
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const contactId = Number(params.id);
	if (!Number.isFinite(contactId)) {
		return json({ error: 'Invalid contact ID' }, { status: 400 });
	}

	try {
		// Verify contact exists
		const [contact] = await db
			.select()
			.from(clientContacts)
			.where(eq(clientContacts.id, contactId));

		if (!contact) {
			return json({ error: 'Contact not found' }, { status: 404 });
		}

		const body = await request.json();
		const { type, title, description, outcome, activityDate, duration } = body;

		if (!type || !title || !activityDate) {
			return json({ error: 'Type, title, and activity date are required' }, { status: 400 });
		}

		const [newActivity] = await db
			.insert(contactActivities)
			.values({
				contactId,
				userId: locals.user.id,
				type,
				title,
				description: description || null,
				outcome: outcome || null,
				activityDate,
				duration: duration || null
			})
			.returning();

		// Update contact's updatedAt timestamp
		await db
			.update(clientContacts)
			.set({ updatedAt: new Date() })
			.where(eq(clientContacts.id, contactId));

		return json(newActivity, { status: 201 });
	} catch (error) {
		console.error('Error creating activity:', error);
		return json({ error: 'Failed to create activity' }, { status: 500 });
	}
};
