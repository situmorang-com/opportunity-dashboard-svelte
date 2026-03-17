import type { DealHealth } from '$lib/server/deal-health';

export type WorklistItemType =
	| 'overdue_close'
	| 'missing_next_step'
	| 'missing_champion'
	| 'stale_deal'
	| 'meeting_outcome_missing'
	| 'upcoming_meeting_prep';

export type WorklistItem = {
	id: string;
	type: WorklistItemType;
	priority: number;
	title: string;
	reason: string;
	opportunityId: number;
	opportunityTitle: string;
	clientName: string | null;
	stageName: string | null;
	dueAt: string | null;
	meetingId?: number | null;
	href: string;
	suggestedAction: string;
	bucket: 'overdue' | 'today' | 'this_week' | 'backlog';
};

type WorklistOpportunity = {
	id: number;
	title: string;
	stageId: number;
	expectedCloseDate?: string | null;
	immediateNextStep?: string | null;
	championName?: string | null;
	updatedAt?: Date | string | null;
	value?: number | null;
	client?: { name: string | null } | null;
	health?: DealHealth;
};

type WorklistMeeting = {
	id: number;
	opportunityId: number;
	title: string;
	scheduledAt?: string | null;
	completedAt?: string | null;
	outcome?: string | null;
	status?: string | null;
	opportunity?: { id: number; title: string } | null;
	client?: { name: string | null } | null;
	stage?: { name: string | null } | null;
};

type WorklistStage = {
	id: number;
	name: string;
	order: number;
	isWon: boolean;
	isLost: boolean;
};

function hasText(v: string | null | undefined): boolean {
	return !!v && v.trim().length > 0;
}

function parseDate(value: string | Date | null | undefined): Date | null {
	if (!value) return null;
	const d = value instanceof Date ? value : new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function addDays(d: Date, days: number): Date {
	return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function getBucket(dueAt: Date | null, now: Date): WorklistItem['bucket'] {
	if (!dueAt) return 'backlog';
	if (dueAt < now) return 'overdue';
	if (dueAt <= endOfDay(now)) return 'today';
	if (dueAt <= endOfDay(addDays(now, 7))) return 'this_week';
	return 'backlog';
}

export function buildWorklist(params: {
	opportunities: WorklistOpportunity[];
	meetings: WorklistMeeting[];
	stages: WorklistStage[];
	now?: Date;
}): WorklistItem[] {
	const { opportunities, meetings, stages } = params;
	const now = params.now ?? new Date();
	const stageById = new Map(stages.map((s) => [s.id, s]));
	const items: WorklistItem[] = [];

	for (const opp of opportunities) {
		const stage = stageById.get(opp.stageId);
		if (!stage || stage.isWon || stage.isLost) continue;

		const clientName = opp.client?.name ?? null;
		const stageName = stage.name;
		const expectedClose = parseDate(opp.expectedCloseDate);

		if (expectedClose && startOfDay(expectedClose) < startOfDay(now)) {
			const valueWeight = (opp.value ?? 0) >= 1_000_000 ? 20 : (opp.value ?? 0) >= 100_000 ? 10 : 0;
			items.push({
				id: `opp-${opp.id}-overdue-close`,
				type: 'overdue_close',
				priority: 85 + valueWeight,
				title: `Update close plan for ${opp.title}`,
				reason: 'Expected close date is overdue',
				opportunityId: opp.id,
				opportunityTitle: opp.title,
				clientName,
				stageName,
				dueAt: opp.expectedCloseDate ?? null,
				meetingId: null,
				href: `/opportunities/${opp.id}`,
				suggestedAction: 'Update close date and next step',
				bucket: getBucket(expectedClose, now)
			});
		}

		if (!hasText(opp.immediateNextStep)) {
			items.push({
				id: `opp-${opp.id}-missing-next-step`,
				type: 'missing_next_step',
				priority: 80 + (opp.health?.status === 'at_risk' ? 10 : 0),
				title: `Define next step for ${opp.title}`,
				reason: 'Opportunity has no immediate next step',
				opportunityId: opp.id,
				opportunityTitle: opp.title,
				clientName,
				stageName,
				dueAt: null,
				meetingId: null,
				href: `/opportunities/${opp.id}`,
				suggestedAction: 'Set immediate next step',
				bucket: 'backlog'
			});
		}

		if (stage.order >= 3 && !hasText(opp.championName)) {
			items.push({
				id: `opp-${opp.id}-missing-champion`,
				type: 'missing_champion',
				priority: 65,
				title: `Identify champion for ${opp.title}`,
				reason: 'Mid/late-stage deal is missing a champion',
				opportunityId: opp.id,
				opportunityTitle: opp.title,
				clientName,
				stageName,
				dueAt: null,
				meetingId: null,
				href: `/opportunities/${opp.id}`,
				suggestedAction: 'Add champion contact',
				bucket: 'backlog'
			});
		}

		if (opp.health?.stale) {
			items.push({
				id: `opp-${opp.id}-stale`,
				type: 'stale_deal',
				priority: 70 + Math.max(0, 20 - (opp.health.score ?? 0) / 5),
				title: `Re-engage ${opp.title}`,
				reason: `Deal is stale (${opp.health.daysSinceUpdate} days since update)`,
				opportunityId: opp.id,
				opportunityTitle: opp.title,
				clientName,
				stageName,
				dueAt: null,
				meetingId: null,
				href: `/opportunities/${opp.id}`,
				suggestedAction: 'Log outreach or meeting outcome',
				bucket: 'backlog'
			});
		}
	}

	for (const meeting of meetings) {
		const scheduledAt = parseDate(meeting.scheduledAt);
		const completedAt = parseDate(meeting.completedAt);
		const opportunityId = meeting.opportunity?.id ?? meeting.opportunityId;
		const opportunityTitle = meeting.opportunity?.title ?? 'Unknown opportunity';
		const clientName = meeting.client?.name ?? null;
		const stageName = meeting.stage?.name ?? null;

		if ((completedAt || meeting.status === 'completed') && !hasText(meeting.outcome)) {
			items.push({
				id: `meeting-${meeting.id}-outcome`,
				type: 'meeting_outcome_missing',
				priority: 90,
				title: `Log outcome for "${meeting.title}"`,
				reason: 'Completed meeting is missing an outcome',
				opportunityId,
				opportunityTitle,
				clientName,
				stageName,
				dueAt: meeting.completedAt ?? meeting.scheduledAt ?? null,
				meetingId: meeting.id,
				href: `/meetings`,
				suggestedAction: 'Log meeting outcome',
				bucket: getBucket(completedAt ?? scheduledAt, now)
			});
		}

		if (scheduledAt && scheduledAt > now && scheduledAt <= addDays(now, 1)) {
			items.push({
				id: `meeting-${meeting.id}-prep`,
				type: 'upcoming_meeting_prep',
				priority: 60,
				title: `Prep upcoming meeting: ${meeting.title}`,
				reason: 'Meeting is scheduled within 24 hours',
				opportunityId,
				opportunityTitle,
				clientName,
				stageName,
				dueAt: meeting.scheduledAt ?? null,
				meetingId: meeting.id,
				href: `/meetings`,
				suggestedAction: 'Review agenda and desired outcome',
				bucket: getBucket(scheduledAt, now)
			});
		}
	}

	return items.sort((a, b) => {
		if (b.priority !== a.priority) return b.priority - a.priority;
		const aDate = parseDate(a.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
		const bDate = parseDate(b.dueAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
		return aDate - bDate;
	});
}
