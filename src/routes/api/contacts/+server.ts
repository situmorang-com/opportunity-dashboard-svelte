import { json } from '@sveltejs/kit';
import { db, clientContacts, clients } from '$lib/server/db';
import { eq, like, or, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET - List all contacts with client info (supports search)
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const search = url.searchParams.get('search') || '';

	try {
		let query = db
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
					size: clients.size
				}
			})
			.from(clientContacts)
			.leftJoin(clients, eq(clientContacts.clientId, clients.id))
			.orderBy(desc(clientContacts.updatedAt));

		// Apply search filter if provided
		if (search) {
			const searchPattern = `%${search}%`;
			query = query.where(
				or(
					like(clientContacts.name, searchPattern),
					like(clientContacts.email, searchPattern),
					like(clientContacts.title, searchPattern),
					like(clients.name, searchPattern)
				)
			) as typeof query;
		}

		const contacts = await query;

		return json(contacts);
	} catch (error) {
		console.error('Error fetching contacts:', error);
		return json({ error: 'Failed to fetch contacts' }, { status: 500 });
	}
};
