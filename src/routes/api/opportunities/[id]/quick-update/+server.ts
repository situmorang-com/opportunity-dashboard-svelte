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
		const updates: Record<string, unknown> = { updatedAt: new Date() };
		const changed: string[] = [];

		if ('immediateNextStep' in body) {
			updates.immediateNextStep =
				typeof body.immediateNextStep === 'string' && body.immediateNextStep.trim()
					? body.immediateNextStep.trim()
					: null;
			changed.push('next step');
		}

		if ('expectedCloseDate' in body) {
			updates.expectedCloseDate =
				typeof body.expectedCloseDate === 'string' && body.expectedCloseDate.trim()
					? body.expectedCloseDate.trim()
					: null;
			changed.push('expected close date');
		}

		if ('probability' in body) {
			const probability =
				typeof body.probability === 'number' ? body.probability : Number(body.probability);
			if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
				return json({ error: 'Probability must be between 0 and 100' }, { status: 400 });
			}
			updates.probability = Math.round(probability);
			changed.push('probability');
		}

		if (changed.length === 0) {
			return json({ error: 'No supported fields provided' }, { status: 400 });
		}

		const [updated] = await db
			.update(opportunities)
			.set(updates)
			.where(eq(opportunities.id, opportunityId))
			.returning();

		if (!updated) {
			return json({ error: 'Opportunity not found' }, { status: 404 });
		}

		await db.insert(activities).values({
			opportunityId,
			userId: locals.user.id,
			type: 'note',
			title: `Updated ${changed.join(', ')} (inline)`
		});

		return json(updated);
	} catch (error) {
		console.error('Error in quick opportunity update:', error);
		return json({ error: 'Failed to update opportunity' }, { status: 500 });
	}
};
