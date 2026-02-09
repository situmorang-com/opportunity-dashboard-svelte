import { json } from '@sveltejs/kit';
import { db, clientContacts } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// PATCH - Update a contact
export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const clientId = Number(params.clientId);
	const contactId = Number(params.id);

	if (!Number.isFinite(clientId) || !Number.isFinite(contactId)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const { name, title, email, phone, role, isPrimary, notes } = body;

		if (!name) {
			return json({ error: 'Name is required' }, { status: 400 });
		}

		// If this contact is being set as primary, unset other primary contacts
		if (isPrimary) {
			await db
				.update(clientContacts)
				.set({ isPrimary: false })
				.where(
					and(
						eq(clientContacts.clientId, clientId),
						eq(clientContacts.id, contactId) // Exclude current contact
					)
				);

			// Actually unset all except current
			await db
				.update(clientContacts)
				.set({ isPrimary: false })
				.where(eq(clientContacts.clientId, clientId));
		}

		const [updatedContact] = await db
			.update(clientContacts)
			.set({
				name,
				title: title || null,
				email: email || null,
				phone: phone || null,
				role: role || 'other',
				isPrimary: isPrimary || false,
				notes: notes || null,
				updatedAt: new Date()
			})
			.where(
				and(eq(clientContacts.id, contactId), eq(clientContacts.clientId, clientId))
			)
			.returning();

		if (!updatedContact) {
			return json({ error: 'Contact not found' }, { status: 404 });
		}

		return json(updatedContact);
	} catch (error) {
		console.error('Error updating contact:', error);
		return json({ error: 'Failed to update contact' }, { status: 500 });
	}
};

// DELETE - Delete a contact
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const clientId = Number(params.clientId);
	const contactId = Number(params.id);

	if (!Number.isFinite(clientId) || !Number.isFinite(contactId)) {
		return json({ error: 'Invalid ID' }, { status: 400 });
	}

	try {
		const [deletedContact] = await db
			.delete(clientContacts)
			.where(
				and(eq(clientContacts.id, contactId), eq(clientContacts.clientId, clientId))
			)
			.returning();

		if (!deletedContact) {
			return json({ error: 'Contact not found' }, { status: 404 });
		}

		return json({ success: true, id: deletedContact.id });
	} catch (error) {
		console.error('Error deleting contact:', error);
		return json({ error: 'Failed to delete contact' }, { status: 500 });
	}
};
