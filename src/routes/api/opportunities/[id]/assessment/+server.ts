import { json } from '@sveltejs/kit';
import { db, opportunities, discoveryAssessments } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const opportunityId = parseInt(params.id);
	if (isNaN(opportunityId)) {
		return json({ error: 'Invalid opportunity ID' }, { status: 400 });
	}

	const [assessment] = await db
		.select()
		.from(discoveryAssessments)
		.where(eq(discoveryAssessments.opportunityId, opportunityId));

	return json({ assessment: assessment || null });
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const opportunityId = parseInt(params.id);
	if (isNaN(opportunityId)) {
		return json({ error: 'Invalid opportunity ID' }, { status: 400 });
	}

	// Verify opportunity exists
	const [opportunity] = await db
		.select()
		.from(opportunities)
		.where(eq(opportunities.id, opportunityId));

	if (!opportunity) {
		return json({ error: 'Opportunity not found' }, { status: 404 });
	}

	try {
		const data = await request.json();

		// Check if assessment exists
		const [existing] = await db
			.select()
			.from(discoveryAssessments)
			.where(eq(discoveryAssessments.opportunityId, opportunityId));

		const assessmentData = {
			currentInfrastructure: data.currentInfrastructure || null,
			dataSources: data.dataSources || null,
			integrationPoints: data.integrationPoints || null,
			securityRequirements: data.securityRequirements || null,
			complianceNeeds: data.complianceNeeds || null,
			technicalReadiness: data.technicalReadiness || null,
			businessObjective: data.businessObjective || null,
			expectedRoi: data.expectedRoi || null,
			successMetrics: data.successMetrics || null,
			budgetRange: data.budgetRange || null,
			budgetApproved: data.budgetApproved ?? false,
			stakeholderAlignment: data.stakeholderAlignment || null,
			deliverables: data.deliverables || null,
			outOfScope: data.outOfScope || null,
			assumptions: data.assumptions || null,
			constraints: data.constraints || null,
			risks: data.risks || null,
			requiredSkills: data.requiredSkills || null,
			teamSize: data.teamSize || null,
			externalResources: data.externalResources || null,
			checklist: data.checklist || null,
			updatedAt: new Date()
		};

		if (existing) {
			await db
				.update(discoveryAssessments)
				.set(assessmentData)
				.where(eq(discoveryAssessments.opportunityId, opportunityId));
		} else {
			await db.insert(discoveryAssessments).values({
				opportunityId,
				...assessmentData
			});
		}

		const [updated] = await db
			.select()
			.from(discoveryAssessments)
			.where(eq(discoveryAssessments.opportunityId, opportunityId));

		return json({ assessment: updated });
	} catch (error) {
		console.error('Error saving assessment:', error);
		return json({ error: 'Failed to save assessment' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const opportunityId = parseInt(params.id);
	if (isNaN(opportunityId)) {
		return json({ error: 'Invalid opportunity ID' }, { status: 400 });
	}

	try {
		const { checklist } = await request.json();

		// Check if assessment exists
		const [existing] = await db
			.select()
			.from(discoveryAssessments)
			.where(eq(discoveryAssessments.opportunityId, opportunityId));

		if (existing) {
			await db
				.update(discoveryAssessments)
				.set({ checklist, updatedAt: new Date() })
				.where(eq(discoveryAssessments.opportunityId, opportunityId));
		} else {
			await db.insert(discoveryAssessments).values({
				opportunityId,
				checklist,
				updatedAt: new Date()
			});
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error updating checklist:', error);
		return json({ error: 'Failed to update checklist' }, { status: 500 });
	}
};
