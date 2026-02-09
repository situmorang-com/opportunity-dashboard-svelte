<script lang="ts">
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import OpportunityCard from './OpportunityCard.svelte';
	import { formatCurrency } from '$lib/utils';
	import type { Stage } from '$lib/server/db/schema';
	import type { OpportunityWithRelations } from '$lib/stores';

	interface Props {
		stage: Stage;
		opportunities: OpportunityWithRelations[];
		onDndConsider: (e: CustomEvent<DndEvent<OpportunityWithRelations>>) => void;
		onDndFinalize: (e: CustomEvent<DndEvent<OpportunityWithRelations>>) => void;
		onOpportunityClick: (opp: OpportunityWithRelations) => void;
	}

	let { stage, opportunities, onDndConsider, onDndFinalize, onOpportunityClick }: Props = $props();

	const flipDurationMs = 200;

	$effect(() => {
		// Keep opportunities reactive
		opportunities;
	});

	const totalValue = $derived(opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0));
</script>

<div class="flex flex-col w-80 flex-shrink-0">
	<!-- Column Header -->
	<div class="flex items-center justify-between mb-3 px-1">
		<div class="flex items-center gap-2">
			<span
				class="w-3 h-3 rounded-full"
				style="background-color: {stage.color}"
			></span>
			<h3 class="font-semibold text-gray-900">{stage.name}</h3>
			<span class="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
				{opportunities.length}
			</span>
		</div>
		<span class="text-sm font-medium text-gray-600">
			{formatCurrency(totalValue)}
		</span>
	</div>

	<!-- Column Body -->
	<div
		class="flex-1 bg-gray-100 rounded-lg p-3 min-h-96 overflow-y-auto"
		use:dndzone={{
			items: opportunities,
			flipDurationMs,
			dropTargetStyle: { outline: '2px dashed #6366f1', outlineOffset: '-2px' }
		}}
		onconsider={onDndConsider}
		onfinalize={onDndFinalize}
	>
		{#each opportunities as opp (opp.id)}
			<div animate:flip={{ duration: flipDurationMs }} class="mb-3 last:mb-0">
				<OpportunityCard
					opportunity={opp}
					onclick={() => onOpportunityClick(opp)}
				/>
			</div>
		{/each}

		{#if opportunities.length === 0}
			<div class="flex flex-col items-center justify-center py-8 text-gray-400">
				<svg class="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
				</svg>
				<p class="text-sm">No opportunities</p>
			</div>
		{/if}
	</div>
</div>
