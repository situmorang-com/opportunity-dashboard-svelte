import { json } from '@sveltejs/kit';
import { db, stages, opportunities } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'manager')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const allStages = await db
		.select({
			id: stages.id,
			name: stages.name,
			order: stages.order,
			probability: stages.probability,
			color: stages.color,
			description: stages.description,
			isWon: stages.isWon,
			isLost: stages.isLost,
			opportunityCount: sql<number>`(SELECT COUNT(*) FROM opportunities WHERE stage_id = ${stages.id})`
		})
		.from(stages)
		.orderBy(stages.order);

	return json(allStages);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Only admins can add stages' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, probability, color, description, isWon, isLost } = body;

		if (!name) {
			return json({ error: 'Name is required' }, { status: 400 });
		}

		// Get max order
		const [maxOrderResult] = await db
			.select({ maxOrder: sql<number>`MAX(${stages.order})` })
			.from(stages);
		const newOrder = (maxOrderResult?.maxOrder || 0) + 1;

		const newStage = {
			name,
			order: newOrder,
			probability: probability ?? 0,
			color: color || '#6b7280',
			description: description || null,
			isWon: isWon ?? false,
			isLost: isLost ?? false
		};

		const result = await db.insert(stages).values(newStage).returning();
		return json(result[0]);
	} catch (error) {
		console.error('Failed to create stage:', error);
		return json({ error: 'Failed to create stage' }, { status: 500 });
	}
};
