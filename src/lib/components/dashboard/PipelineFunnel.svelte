<script lang="ts">
	import { Card } from '$lib/components/ui';
	import { formatCurrency } from '$lib/utils';
	import type { Stage } from '$lib/server/db/schema';
	import type { OpportunityWithRelations } from '$lib/stores';

	interface Props {
		stages: Stage[];
		opportunities: OpportunityWithRelations[];
	}

	let { stages, opportunities }: Props = $props();

	const stageData = $derived(() => {
		const activeStages = stages.filter((s) => !s.isWon && !s.isLost).sort((a, b) => a.order - b.order);
		const maxCount = Math.max(...activeStages.map((s) => opportunities.filter((o) => o.stageId === s.id).length), 1);

		return activeStages.map((stage) => {
			const stageOpps = opportunities.filter((o) => o.stageId === stage.id);
			const count = stageOpps.length;
			const value = stageOpps.reduce((sum, o) => sum + (o.value || 0), 0);
			const widthPercent = Math.max((count / maxCount) * 100, 20);

			return {
				...stage,
				count,
				value,
				widthPercent
			};
		});
	});
</script>

<Card>
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Pipeline Funnel</h3>

	<div class="space-y-3">
		{#each stageData() as stage}
			<div class="relative">
				<div class="flex items-center justify-between mb-1">
					<span class="text-sm font-medium text-gray-700">{stage.name}</span>
					<span class="text-sm text-gray-500">
						{stage.count} · {formatCurrency(stage.value)}
					</span>
				</div>
				<div class="relative h-8 bg-gray-100 rounded overflow-hidden">
					<div
						class="absolute inset-y-0 left-0 rounded transition-all duration-300"
						style="width: {stage.widthPercent}%; background-color: {stage.color}"
					>
						<div class="h-full flex items-center justify-center">
							<span class="text-xs font-medium text-white drop-shadow">
								{stage.probability}%
							</span>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</Card>
