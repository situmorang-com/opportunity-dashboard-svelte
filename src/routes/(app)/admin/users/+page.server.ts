import { db, users, opportunities } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const allUsers = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			role: users.role,
			avatarUrl: users.avatarUrl,
			googleId: users.googleId,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
			opportunityCount: sql<number>`(SELECT COUNT(*) FROM opportunities WHERE owner_id = users.id)`
		})
		.from(users)
		.orderBy(users.name);

	return {
		user: locals.user,
		users: allUsers
	};
};
