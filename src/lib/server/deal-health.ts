import type { Opportunity, Stage } from '$lib/server/db/schema';

export type DealHealthStatus = 'healthy' | 'watch' | 'at_risk';

export type DealHealth = {
	score: number;
	status: DealHealthStatus;
	stale: boolean;
	daysSinceUpdate: number;
	reasons: string[];
};

function toDate(value: Date | string | null | undefined): Date | null {
	if (!value) return null;
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(a: Date, b: Date): number {
	return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function hasText(value: string | null | undefined): boolean {
	return !!value && value.trim().length > 0;
}

export function calculateDealHealth(
	opportunity: Pick<
		Opportunity,
		| 'value'
		| 'probability'
		| 'expectedCloseDate'
		| 'updatedAt'
		| 'championName'
		| 'authorityName'
		| 'immediateNextStep'
		| 'timeline'
		| 'wonDate'
		| 'lostDate'
		| 'stageId'
	>,
	stage: Pick<Stage, 'id' | 'name' | 'order' | 'isWon' | 'isLost'> | undefined,
	now = new Date()
): DealHealth {
	if (stage?.isWon) {
		return { score: 100, status: 'healthy', stale: false, daysSinceUpdate: 0, reasons: [] };
	}

	if (stage?.isLost) {
		return { score: 0, status: 'at_risk', stale: false, daysSinceUpdate: 0, reasons: ['Lost deal'] };
	}

	let score = 100;
	const reasons: string[] = [];

	const updatedAt = toDate(opportunity.updatedAt);
	const expectedCloseDate = toDate(opportunity.expectedCloseDate);
	const daysSinceUpdate = updatedAt ? Math.max(0, daysBetween(now, updatedAt)) : 999;

	if (!updatedAt) {
		score -= 25;
		reasons.push('No activity/update timestamp');
	} else if (daysSinceUpdate > 30) {
		score -= 30;
		reasons.push(`No update for ${daysSinceUpdate} days`);
	} else if (daysSinceUpdate > 14) {
		score -= 20;
		reasons.push(`Stale for ${daysSinceUpdate} days`);
	} else if (daysSinceUpdate > 7) {
		score -= 10;
		reasons.push(`No update for ${daysSinceUpdate} days`);
	}

	if (!hasText(opportunity.immediateNextStep)) {
		score -= 20;
		reasons.push('Missing next step');
	}

	if ((stage?.order ?? 1) >= 3 && !hasText(opportunity.championName)) {
		score -= 10;
		reasons.push('Missing champion');
	}

	if ((stage?.order ?? 1) >= 4 && !hasText(opportunity.authorityName)) {
		score -= 15;
		reasons.push('Missing decision maker');
	}

	if ((stage?.order ?? 1) >= 4 && !hasText(opportunity.timeline)) {
		score -= 10;
		reasons.push('Missing timeline');
	}

	if (!opportunity.value || opportunity.value <= 0) {
		score -= 10;
		reasons.push('Deal value not set');
	}

	if (expectedCloseDate) {
		const daysToClose = daysBetween(expectedCloseDate, now);
		if (daysToClose < 0 && (opportunity.probability ?? 0) < 90) {
			score -= 20;
			reasons.push('Close date is overdue');
		} else if (daysToClose <= 7 && !hasText(opportunity.immediateNextStep)) {
			score -= 10;
			reasons.push('Close date near with no next step');
		}
	}

	score = Math.max(0, Math.min(100, score));

	const stale = daysSinceUpdate > 14;
	const status: DealHealthStatus = score >= 75 ? 'healthy' : score >= 45 ? 'watch' : 'at_risk';

	return {
		score,
		status,
		stale,
		daysSinceUpdate,
		reasons: reasons.slice(0, 4)
	};
}
