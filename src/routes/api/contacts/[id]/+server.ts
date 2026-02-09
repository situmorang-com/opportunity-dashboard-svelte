import { json } from '@sveltejs/kit';
import { db, clientContacts, clients, contactActivities, users } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET - Get single contact with details and recent activities
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const contactId = Number(params.id);
	if (!Number.isFinite(contactId)) {
		return json({ error: 'Invalid contact ID' }, { status: 400 });
	}

	try {
		// Get contact with client info
		const [contact] = await db
			.select({
				id: clientContacts.id,
				clientId: clientContacts.clientId,
				name: clientContacts.name,
				title: clientContacts.title,
				email: clientContacts.email,
				phone: clientContacts.phone,
				role: clientContacts.role,
				isPrimary: clientContacts.isPrimary,
				notes: clientContacts.notes,
				createdAt: clientContacts.createdAt,
				updatedAt: clientContacts.updatedAt,
				client: {
					id: clients.id,
					name: clients.name,
					industry: clients.industry,
					size: clients.size,
					region: clients.region
				}
			})
			.from(clientContacts)
			.leftJoin(clients, eq(clientContacts.clientId, clients.id))
			.where(eq(clientContacts.id, contactId));

		if (!contact) {
			return json({ error: 'Contact not found' }, { status: 404 });
		}

		// Get recent activities for this contact
		const activities = await db
			.select({
				id: contactActivities.id,
				type: contactActivities.type,
				title: contactActivities.title,
				description: contactActivities.description,
				outcome: contactActivities.outcome,
				activityDate: contactActivities.activityDate,
				duration: contactActivities.duration,
				createdAt: contactActivities.createdAt,
				user: {
					id: users.id,
					name: users.name
				}
			})
			.from(contactActivities)
			.leftJoin(users, eq(contactActivities.userId, users.id))
			.where(eq(contactActivities.contactId, contactId))
			.orderBy(desc(contactActivities.activityDate))
			.limit(20);

		return json({ ...contact, activities });
	} catch (error) {
		console.error('Error fetching contact:', error);
		return json({ error: 'Failed to fetch contact' }, { status: 500 });
	}
};

// PATCH - Update contact
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const contactId = Number(params.id);
	if (!Number.isFinite(contactId)) {
		return json({ error: 'Invalid contact ID' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const { name, title, email, phone, role, isPrimary, notes } = body;

		// Get current contact to find clientId
		const [existingContact] = await db
			.select()
			.from(clientContacts)
			.where(eq(clientContacts.id, contactId));

		if (!existingContact) {
			return json({ error: 'Contact not found' }, { status: 404 });
		}

		// If setting as primary, unset other primaries for this client
		if (isPrimary) {
			await db
				.update(clientContacts)
				.set({ isPrimary: false })
				.where(eq(clientContacts.clientId, existingContact.clientId));
		}

		const [updatedContact] = await db
			.update(clientContacts)
			.set({
				name: name ?? existingContact.name,
				title: title ?? existingContact.title,
				email: email ?? existingContact.email,
				phone: phone ?? existingContact.phone,
				role: role ?? existingContact.role,
				isPrimary: isPrimary ?? existingContact.isPrimary,
				notes: notes ?? existingContact.notes,
				updatedAt: new Date()
			})
			.where(eq(clientContacts.id, contactId))
			.returning();

		return json(updatedContact);
	} catch (error) {
		console.error('Error updating contact:', error);
		return json({ error: 'Failed to update contact' }, { status: 500 });
	}
};
