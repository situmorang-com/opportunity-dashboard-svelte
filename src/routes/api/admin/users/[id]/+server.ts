import { json } from '@sveltejs/kit';
import { db, users, opportunities } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Only admins can update users' }, { status: 401 });
	}

	const { id } = params;

	try {
		const [existingUser] = await db.select().from(users).where(eq(users.id, id));
		if (!existingUser) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const { name, email, role } = body;

		// Check if email is being changed to one that already exists
		if (email && email.toLowerCase() !== existingUser.email) {
			const [emailConflict] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
			if (emailConflict) {
				return json({ error: 'A user with this email already exists' }, { status: 400 });
			}
		}

		const validRoles = ['admin', 'manager', 'rep'];
		if (role && !validRoles.includes(role)) {
			return json({ error: 'Invalid role' }, { status: 400 });
		}

		await db
			.update(users)
			.set({
				name: name || existingUser.name,
				email: email ? email.toLowerCase() : existingUser.email,
				role: role || existingUser.role,
				updatedAt: new Date()
			})
			.where(eq(users.id, id));

		const [updatedUser] = await db.select().from(users).where(eq(users.id, id));
		return json(updatedUser);
	} catch (error) {
		console.error('Failed to update user:', error);
		return json({ error: 'Failed to update user' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Only admins can delete users' }, { status: 401 });
	}

	const { id } = params;

	// Prevent self-deletion
	if (id === locals.user.id) {
		return json({ error: 'You cannot delete yourself' }, { status: 400 });
	}

	try {
		const [existingUser] = await db.select().from(users).where(eq(users.id, id));
		if (!existingUser) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Check if user owns any opportunities
		const userOpportunities = await db.select().from(opportunities).where(eq(opportunities.ownerId, id));
		if (userOpportunities.length > 0) {
			return json(
				{
					error: `Cannot delete user. They own ${userOpportunities.length} opportunities. Reassign these first.`
				},
				{ status: 400 }
			);
		}

		await db.delete(users).where(eq(users.id, id));
		return json({ success: true });
	} catch (error) {
		console.error('Failed to delete user:', error);
		return json({ error: 'Failed to delete user' }, { status: 500 });
	}
};
