import { json } from '@sveltejs/kit';
import { db, clientContacts } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET - List all contacts for a client
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const clientId = Number(params.clientId);
	if (!Number.isFinite(clientId)) {
		return json({ error: 'Invalid client ID' }, { status: 400 });
	}

	try {
		const contacts = await db
			.select()
			.from(clientContacts)
			.where(eq(clientContacts.clientId, clientId))
			.orderBy(clientContacts.isPrimary, clientContacts.name);

		return json(contacts);
	} catch (error) {
		console.error('Error fetching contacts:', error);
		return json({ error: 'Failed to fetch contacts' }, { status: 500 });
	}
};

// POST - Create a new contact
export const POST: RequestHandler = async ({ request, params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const clientId = Number(params.clientId);
	if (!Number.isFinite(clientId)) {
		return json({ error: 'Invalid client ID' }, { status: 400 });
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
				.where(eq(clientContacts.clientId, clientId));
		}

		const [newContact] = await db
			.insert(clientContacts)
			.values({
				clientId,
				name,
				title: title || null,
				email: email || null,
				phone: phone || null,
				role: role || 'other',
				isPrimary: isPrimary || false,
				notes: notes || null
			})
			.returning();

		return json(newContact, { status: 201 });
	} catch (error) {
		console.error('Error creating contact:', error);
		return json({ error: 'Failed to create contact' }, { status: 500 });
	}
};
