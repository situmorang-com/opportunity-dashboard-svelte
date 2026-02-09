import { json } from '@sveltejs/kit';
import { db, stages, opportunities } from '$lib/server/db';
import { eq, gt, lt, and, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Only admins can update stages' }, { status: 401 });
	}

	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid stage ID' }, { status: 400 });
	}

	try {
		const [existingStage] = await db.select().from(stages).where(eq(stages.id, id));
		if (!existingStage) {
			return json({ error: 'Stage not found' }, { status: 404 });
		}

		const body = await request.json();
		const { name, probability, color, description, isWon, isLost, order } = body;

		// Handle reordering
		if (order !== undefined && order !== existingStage.order) {
			const oldOrder = existingStage.order;
			const newOrder = order;

			if (newOrder > oldOrder) {
				// Moving down: decrement items between old and new
				await db
					.update(stages)
					.set({ order: sql`${stages.order} - 1` })
					.where(and(gt(stages.order, oldOrder), lt(stages.order, newOrder + 1)));
			} else {
				// Moving up: increment items between new and old
				await db
					.update(stages)
					.set({ order: sql`${stages.order} + 1` })
					.where(and(gt(stages.order, newOrder - 1), lt(stages.order, oldOrder)));
			}
		}

		await db
			.update(stages)
			.set({
				name: name ?? existingStage.name,
				probability: probability ?? existingStage.probability,
				color: color ?? existingStage.color,
				description: description !== undefined ? description : existingStage.description,
				isWon: isWon ?? existingStage.isWon,
				isLost: isLost ?? existingStage.isLost,
				order: order ?? existingStage.order
			})
			.where(eq(stages.id, id));

		const [updatedStage] = await db.select().from(stages).where(eq(stages.id, id));
		return json(updatedStage);
	} catch (error) {
		console.error('Failed to update stage:', error);
		return json({ error: 'Failed to update stage' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		return json({ error: 'Only admins can delete stages' }, { status: 401 });
	}

	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid stage ID' }, { status: 400 });
	}

	try {
		const [existingStage] = await db.select().from(stages).where(eq(stages.id, id));
		if (!existingStage) {
			return json({ error: 'Stage not found' }, { status: 404 });
		}

		// Check if stage has opportunities
		const stageOpportunities = await db.select().from(opportunities).where(eq(opportunities.stageId, id));
		if (stageOpportunities.length > 0) {
			return json(
				{
					error: `Cannot delete stage. It has ${stageOpportunities.length} opportunities. Move them first.`
				},
				{ status: 400 }
			);
		}

		// Delete and reorder
		const deletedOrder = existingStage.order;
		await db.delete(stages).where(eq(stages.id, id));

		// Decrement order for stages after the deleted one
		await db
			.update(stages)
			.set({ order: sql`${stages.order} - 1` })
			.where(gt(stages.order, deletedOrder));

		return json({ success: true });
	} catch (error) {
		console.error('Failed to delete stage:', error);
		return json({ error: 'Failed to delete stage' }, { status: 500 });
	}
};
