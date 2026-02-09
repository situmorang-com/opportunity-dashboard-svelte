import { json } from '@sveltejs/kit';
import { db, users, opportunities } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';
import { generateId } from '$lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'manager')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Get users with opportunity counts
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

	return json(allUsers);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Only admins can add users' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, email, role } = body;

		if (!name || !email) {
			return json({ error: 'Name and email are required' }, { status: 400 });
		}

		// Check if email already exists
		const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
		if (existing) {
			return json({ error: 'A user with this email already exists' }, { status: 400 });
		}

		const validRoles = ['admin', 'manager', 'rep'];
		if (role && !validRoles.includes(role)) {
			return json({ error: 'Invalid role' }, { status: 400 });
		}

		const newUser = {
			id: generateId(),
			name,
			email: email.toLowerCase(),
			role: role || 'rep',
			passwordHash: null,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await db.insert(users).values(newUser);

		return json({ ...newUser, opportunityCount: 0 });
	} catch (error) {
		console.error('Failed to create user:', error);
		return json({ error: 'Failed to create user' }, { status: 500 });
	}
};
