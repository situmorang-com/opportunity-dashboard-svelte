import { db, clientContacts, clients, contactActivities } from '$lib/server/db';
import { eq, desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Get all contacts with client info and last activity date
	const contacts = await db
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

	// Get last activity for each contact
	const lastActivities = await db
		.select({
			contactId: contactActivities.contactId,
			lastActivityDate: sql<string>`MAX(${contactActivities.activityDate})`.as('lastActivityDate'),
			lastActivityType: contactActivities.type
		})
		.from(contactActivities)
		.groupBy(contactActivities.contactId);

	// Create a map of contactId -> last activity
	const activityMap = new Map(
		lastActivities.map((a) => [a.contactId, { date: a.lastActivityDate, type: a.lastActivityType }])
	);

	// Merge contacts with their last activity
	const contactsWithActivity = contacts.map((contact) => ({
		...contact,
		lastActivity: activityMap.get(contact.id) || null
	}));

	// Get all clients for the "Add Contact" form
	const allClients = await db.select().from(clients).orderBy(clients.name);

	return {
		user: locals.user,
		contacts: contactsWithActivity,
		clients: allClients
	};
};
