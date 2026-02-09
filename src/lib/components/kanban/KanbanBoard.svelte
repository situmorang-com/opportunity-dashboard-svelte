<script lang="ts">
	import type { DndEvent } from 'svelte-dnd-action';
	import KanbanColumn from './KanbanColumn.svelte';
	import { pipelineStore, type OpportunityWithRelations } from '$lib/stores';
	import type { Stage } from '$lib/server/db/schema';
	import { toastStore } from '$lib/stores';

	interface Props {
		stages: Stage[];
		opportunities: OpportunityWithRelations[];
		onOpportunityClick?: (opp: OpportunityWithRelations) => void;
		onStageChange?: (opportunityId: number, newStageId: number) => Promise<void>;
	}

	let { stages, opportunities, onOpportunityClick, onStageChange }: Props = $props();

	// Group opportunities by stage - make this reactive
	let opportunitiesByStage = $state<Map<number, OpportunityWithRelations[]>>(new Map());

	$effect(() => {
		const grouped = new Map<number, OpportunityWithRelations[]>();
		for (const stage of stages) {
			grouped.set(stage.id, []);
		}
		for (const opp of opportunities) {
			const stageOpps = grouped.get(opp.stageId) || [];
			stageOpps.push(opp);
			grouped.set(opp.stageId, stageOpps);
		}
		opportunitiesByStage = grouped;
	});

	function handleDndConsider(stageId: number, e: CustomEvent<DndEvent<OpportunityWithRelations>>) {
		const items = e.detail.items;
		opportunitiesByStage.set(stageId, items);
		opportunitiesByStage = new Map(opportunitiesByStage);
	}

	async function handleDndFinalize(stageId: number, e: CustomEvent<DndEvent<OpportunityWithRelations>>) {
		const items = e.detail.items;
		opportunitiesByStage.set(stageId, items);
		opportunitiesByStage = new Map(opportunitiesByStage);

		// Find which opportunity changed stage
		for (const item of items) {
			if (item.stageId !== stageId) {
				const oldStageId = item.stageId;
				item.stageId = stageId;

				// Update store
				pipelineStore.updateOpportunityStage(item.id, stageId);

				// Persist to server
				if (onStageChange) {
					try {
						await onStageChange(item.id, stageId);
						const newStage = stages.find((s) => s.id === stageId);
						toastStore.add({
							type: 'success',
							message: `Moved "${item.title}" to ${newStage?.name || 'new stage'}`
						});
					} catch (error) {
						// Revert on error
						item.stageId = oldStageId;
						pipelineStore.updateOpportunityStage(item.id, oldStageId);
						toastStore.add({
							type: 'error',
							message: 'Failed to update opportunity stage'
						});
					}
				}
				break;
			}
		}
	}

	function handleOpportunityClick(opp: OpportunityWithRelations) {
		if (onOpportunityClick) {
			onOpportunityClick(opp);
		}
	}
</script>

<div class="flex gap-4 overflow-x-auto pb-4 px-1">
	{#each stages as stage (stage.id)}
		<KanbanColumn
			{stage}
			opportunities={opportunitiesByStage.get(stage.id) || []}
			onDndConsider={(e) => handleDndConsider(stage.id, e)}
			onDndFinalize={(e) => handleDndFinalize(stage.id, e)}
			onOpportunityClick={handleOpportunityClick}
		/>
	{/each}
</div>
