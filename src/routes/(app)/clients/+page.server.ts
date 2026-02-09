import { db, clients } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const allClients = await db.select().from(clients);

	return {
		user: locals.user,
		clients: allClients
	};
};
