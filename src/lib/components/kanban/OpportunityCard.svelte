<script lang="ts">
	import { Badge, Avatar } from '$lib/components/ui';
	import { formatCurrency, formatDate } from '$lib/utils';
	import type { OpportunityWithRelations } from '$lib/stores';

	interface Props {
		opportunity: OpportunityWithRelations;
		onclick?: () => void;
	}

	let { opportunity, onclick }: Props = $props();

	function getBadgeVariant(workload: string): 'blue' | 'purple' | 'green' | 'yellow' | 'indigo' {
		const variants: Record<string, 'blue' | 'purple' | 'green' | 'yellow' | 'indigo'> = {
			Lakehouse: 'blue',
			'Data Warehouse': 'purple',
			'Power BI': 'yellow',
			'Data Factory': 'green',
			'Real-Time Intelligence': 'indigo'
		};
		return variants[workload] || 'blue';
	}

	function getHealthVariant(status?: string): 'green' | 'yellow' | 'red' {
		if (status === 'healthy') return 'green';
		if (status === 'watch') return 'yellow';
		return 'red';
	}
</script>

<button
	type="button"
	class="kanban-card w-full text-left transition-all hover:shadow-md"
	onclick={onclick}
>
	<div class="flex items-start justify-between gap-2 mb-3">
		<h4 class="font-medium text-gray-900 text-sm line-clamp-2">
			{opportunity.title}
		</h4>
		{#if opportunity.owner?.name}
			<Avatar name={opportunity.owner.name} src={opportunity.owner.avatarUrl} size="sm" />
		{/if}
	</div>

	{#if opportunity.client?.name}
		<p class="text-xs text-gray-500 mb-2">
			{opportunity.client.name}
		</p>
	{/if}

	<div class="flex items-center justify-between mb-3">
		<span class="text-lg font-semibold text-gray-900">
			{formatCurrency(opportunity.value || 0)}
		</span>
		<span class="text-xs text-gray-500">
			{opportunity.probability}%
		</span>
	</div>

	{#if opportunity.health}
		<div class="mb-3 space-y-2">
			<div class="flex items-center justify-between gap-2">
				<Badge variant={getHealthVariant(opportunity.health.status)} class="text-[11px]">
					Health {opportunity.health.score}
				</Badge>
				{#if opportunity.health.stale}
					<span class="text-[11px] font-medium text-red-600">
						Stale ({opportunity.health.daysSinceUpdate}d)
					</span>
				{/if}
			</div>
			{#if opportunity.health.reasons.length > 0}
				<p class="text-[11px] text-gray-500 line-clamp-2">
					{opportunity.health.reasons.join(' • ')}
				</p>
			{/if}
		</div>
	{/if}

	{#if opportunity.fabricWorkloads && opportunity.fabricWorkloads.length > 0}
		<div class="flex flex-wrap gap-1 mb-3">
			{#each opportunity.fabricWorkloads.slice(0, 3) as workload}
				<Badge variant={getBadgeVariant(workload)} class="text-xs">
					{workload}
				</Badge>
			{/each}
			{#if opportunity.fabricWorkloads.length > 3}
				<Badge variant="gray" class="text-xs">
					+{opportunity.fabricWorkloads.length - 3}
				</Badge>
			{/if}
		</div>
	{/if}

	{#if opportunity.expectedCloseDate}
		<div class="flex items-center gap-1 text-xs text-gray-500">
			<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
			<span>Close: {formatDate(opportunity.expectedCloseDate)}</span>
		</div>
	{/if}
</button>
