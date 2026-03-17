import { json } from '@sveltejs/kit';
import { db, opportunities, activities } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const opportunityId = Number(params.id);
	if (!Number.isFinite(opportunityId)) {
		return json({ error: 'Invalid opportunity ID' }, { status: 400 });
	}

	try {
		const body = await request.json();
		const immediateNextStep = typeof body.immediateNextStep === 'string' ? body.immediateNextStep.trim() : '';

		if (!immediateNextStep) {
			return json({ error: 'Immediate next step is required' }, { status: 400 });
		}

		const [updated] = await db
			.update(opportunities)
			.set({
				immediateNextStep,
				updatedAt: new Date()
			})
			.where(eq(opportunities.id, opportunityId))
			.returning({
				id: opportunities.id,
				immediateNextStep: opportunities.immediateNextStep
			});

		if (!updated) {
			return json({ error: 'Opportunity not found' }, { status: 404 });
		}

		await db.insert(activities).values({
			opportunityId,
			userId: locals.user.id,
			type: 'note',
			title: 'Updated next step from worklist',
			description: immediateNextStep
		});

		return json({ success: true, opportunity: updated });
	} catch (error) {
		console.error('Error updating next step from worklist:', error);
		return json({ error: 'Failed to update next step' }, { status: 500 });
	}
};
