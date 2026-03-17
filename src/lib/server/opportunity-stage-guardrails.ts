import type { Opportunity, Stage } from '$lib/server/db/schema';

type FieldRule = {
	key: keyof Opportunity;
	label: string;
};

type GuardrailResult = {
	allowed: boolean;
	missingFields: string[];
	message?: string;
};

const FORWARD_RULES: Array<{ minOrder: number; fields: FieldRule[] }> = [
	{
		minOrder: 2,
		fields: [
			{ key: 'clientId', label: 'Client' },
			{ key: 'value', label: 'Deal value' }
		]
	},
	{
		minOrder: 3,
		fields: [
			{ key: 'championName', label: 'Champion name' },
			{ key: 'keyPainPoints', label: 'Key pain points' }
		]
	},
	{
		minOrder: 4,
		fields: [
			{ key: 'authorityName', label: 'Decision maker (authority)' },
			{ key: 'timeline', label: 'Timeline' },
			{ key: 'immediateNextStep', label: 'Immediate next step' }
		]
	},
	{
		minOrder: 5,
		fields: [{ key: 'engagementSummary', label: 'Engagement summary' }]
	}
];

function isPresent(value: unknown): boolean {
	if (value === null || value === undefined) return false;
	if (typeof value === 'string') return value.trim().length > 0;
	if (typeof value === 'number') return !Number.isNaN(value) && value > 0;
	if (typeof value === 'boolean') return true;
	if (Array.isArray(value)) return value.length > 0;
	return true;
}

export function validateStageTransition(
	opportunity: Opportunity,
	oldStage: Stage | undefined,
	newStage: Stage
): GuardrailResult {
	const missing = new Set<string>();
	const oldOrder = oldStage?.order ?? 0;
	const isForwardMove = newStage.order > oldOrder;

	if (isForwardMove) {
		for (const rule of FORWARD_RULES) {
			if (newStage.order >= rule.minOrder) {
				for (const field of rule.fields) {
					if (!isPresent(opportunity[field.key])) {
						missing.add(field.label);
					}
				}
			}
		}
	}

	if (newStage.isLost && !isPresent(opportunity.lostReason)) {
		missing.add('Lost reason');
	}

	if (newStage.isWon) {
		for (const field of [
			{ key: 'authorityName', label: 'Decision maker (authority)' },
			{ key: 'championName', label: 'Champion name' },
			{ key: 'timeline', label: 'Timeline' }
		] satisfies FieldRule[]) {
			if (!isPresent(opportunity[field.key])) {
				missing.add(field.label);
			}
		}
	}

	const missingFields = [...missing];
	if (missingFields.length === 0) {
		return { allowed: true, missingFields };
	}

	return {
		allowed: false,
		missingFields,
		message: `Complete required fields before moving to "${newStage.name}": ${missingFields.join(', ')}`
	};
}
