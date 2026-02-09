import { writable, derived } from 'svelte/store';
import type { Stage, Activity } from '$lib/server/db/schema';

// Types for client-side use - flexible to handle different query shapes
export type OpportunityWithRelations = {
	id: number;
	title: string;
	description?: string | null;
	value?: number | null;
	probability?: number | null;
	stageId: number;
	clientId?: number | null;
	ownerId: string;
	fabricWorkloads?: string[] | null;
	expectedCloseDate?: string | null;
	capacityUnits?: number | null;
	migrationSource?: string | null;
	competitor?: string | null;
	createdAt?: Date | string | null;
	updatedAt?: Date | string | null;
	client?: { id: number; name: string } | null;
	stage?: Stage | null;
	owner?: { id: string; name: string; email?: string; avatarUrl?: string | null } | null;
	activities?: Activity[];
};

export type StageWithOpportunities = Stage & {
	opportunities: OpportunityWithRelations[];
};

// Pipeline store
function createPipelineStore() {
	const { subscribe, set, update } = writable<{
		stages: Stage[];
		opportunities: OpportunityWithRelations[];
		loading: boolean;
		error: string | null;
	}>({
		stages: [],
		opportunities: [],
		loading: false,
		error: null
	});

	return {
		subscribe,
		setStages: (stages: Stage[]) => update((s) => ({ ...s, stages })),
		setOpportunities: (opportunities: OpportunityWithRelations[]) =>
			update((s) => ({ ...s, opportunities })),
		setLoading: (loading: boolean) => update((s) => ({ ...s, loading })),
		setError: (error: string | null) => update((s) => ({ ...s, error })),
		updateOpportunityStage: (opportunityId: number, newStageId: number) =>
			update((s) => ({
				...s,
				opportunities: s.opportunities.map((opp) =>
					opp.id === opportunityId ? { ...opp, stageId: newStageId } : opp
				)
			})),
		addOpportunity: (opportunity: OpportunityWithRelations) =>
			update((s) => ({
				...s,
				opportunities: [...s.opportunities, opportunity]
			})),
		removeOpportunity: (opportunityId: number) =>
			update((s) => ({
				...s,
				opportunities: s.opportunities.filter((opp) => opp.id !== opportunityId)
			})),
		reset: () =>
			set({
				stages: [],
				opportunities: [],
				loading: false,
				error: null
			})
	};
}

export const pipelineStore = createPipelineStore();

// Derived store for opportunities grouped by stage
export const opportunitiesByStage = derived(pipelineStore, ($pipeline) => {
	const grouped = new Map<number, OpportunityWithRelations[]>();

	for (const stage of $pipeline.stages) {
		grouped.set(stage.id, []);
	}

	for (const opp of $pipeline.opportunities) {
		const stageOpps = grouped.get(opp.stageId) || [];
		stageOpps.push(opp);
		grouped.set(opp.stageId, stageOpps);
	}

	return grouped;
});

// Derived store for pipeline metrics
export const pipelineMetrics = derived(pipelineStore, ($pipeline) => {
	const total = $pipeline.opportunities.length;
	const totalValue = $pipeline.opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
	const weightedValue = $pipeline.opportunities.reduce(
		(sum, opp) => sum + (opp.value || 0) * ((opp.probability || 0) / 100),
		0
	);

	const wonStage = $pipeline.stages.find((s) => s.isWon);
	const lostStage = $pipeline.stages.find((s) => s.isLost);

	const won = wonStage
		? $pipeline.opportunities.filter((opp) => opp.stageId === wonStage.id)
		: [];
	const lost = lostStage
		? $pipeline.opportunities.filter((opp) => opp.stageId === lostStage.id)
		: [];
	const active = $pipeline.opportunities.filter(
		(opp) => opp.stageId !== wonStage?.id && opp.stageId !== lostStage?.id
	);

	const winRate = won.length + lost.length > 0
		? (won.length / (won.length + lost.length)) * 100
		: 0;

	return {
		total,
		totalValue,
		weightedValue,
		activeCount: active.length,
		activeValue: active.reduce((sum, opp) => sum + (opp.value || 0), 0),
		wonCount: won.length,
		wonValue: won.reduce((sum, opp) => sum + (opp.value || 0), 0),
		lostCount: lost.length,
		lostValue: lost.reduce((sum, opp) => sum + (opp.value || 0), 0),
		winRate
	};
});

// UI State store
function createUIStore() {
	const { subscribe, update } = writable({
		sidebarOpen: true,
		modalOpen: false,
		modalContent: null as string | null,
		selectedOpportunityId: null as number | null,
		filterOwner: null as string | null,
		filterClient: null as number | null,
		searchQuery: ''
	});

	return {
		subscribe,
		toggleSidebar: () => update((s) => ({ ...s, sidebarOpen: !s.sidebarOpen })),
		openModal: (content: string) => update((s) => ({ ...s, modalOpen: true, modalContent: content })),
		closeModal: () => update((s) => ({ ...s, modalOpen: false, modalContent: null })),
		selectOpportunity: (id: number | null) => update((s) => ({ ...s, selectedOpportunityId: id })),
		setFilterOwner: (ownerId: string | null) => update((s) => ({ ...s, filterOwner: ownerId })),
		setFilterClient: (clientId: number | null) => update((s) => ({ ...s, filterClient: clientId })),
		setSearchQuery: (query: string) => update((s) => ({ ...s, searchQuery: query }))
	};
}

export const uiStore = createUIStore();

// Toast notifications store
export type Toast = {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	message: string;
	duration?: number;
};

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	return {
		subscribe,
		add: (toast: Omit<Toast, 'id'>) => {
			const id = crypto.randomUUID();
			update((toasts) => [...toasts, { ...toast, id }]);

			if (toast.duration !== 0) {
				setTimeout(() => {
					update((toasts) => toasts.filter((t) => t.id !== id));
				}, toast.duration || 5000);
			}

			return id;
		},
		remove: (id: string) => update((toasts) => toasts.filter((t) => t.id !== id)),
		clear: () => update(() => [])
	};
}

export const toastStore = createToastStore();
