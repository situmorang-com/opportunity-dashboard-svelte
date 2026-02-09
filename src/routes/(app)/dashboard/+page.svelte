<script lang="ts">
	import { Header } from '$lib/components/layout';
	import { StatCard, PipelineFunnel, RecentActivity } from '$lib/components/dashboard';
	import { formatCurrency } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const metrics = $derived(() => {
		const activeStages = data.stages.filter((s) => !s.isWon && !s.isLost);
		const wonStage = data.stages.find((s) => s.isWon);
		const lostStage = data.stages.find((s) => s.isLost);

		const active = data.opportunities.filter((o) =>
			activeStages.some((s) => s.id === o.stageId)
		);
		const won = wonStage
			? data.opportunities.filter((o) => o.stageId === wonStage.id)
			: [];
		const lost = lostStage
			? data.opportunities.filter((o) => o.stageId === lostStage.id)
			: [];

		const totalValue = active.reduce((sum, o) => sum + (o.value || 0), 0);
		const weightedValue = active.reduce(
			(sum, o) => sum + (o.value || 0) * ((o.probability || 0) / 100),
			0
		);
		const wonValue = won.reduce((sum, o) => sum + (o.value || 0), 0);
		const winRate = won.length + lost.length > 0
			? Math.round((won.length / (won.length + lost.length)) * 100)
			: 0;

		return {
			activeCount: active.length,
			totalValue,
			weightedValue,
			wonValue,
			winRate
		};
	});
</script>

<Header user={data.user} title="Dashboard" />

<div class="p-6">
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		<StatCard
			title="Active Pipeline"
			value={formatCurrency(metrics().totalValue)}
			subtitle="{metrics().activeCount} opportunities"
		>
			{#snippet icon()}
				<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
				</svg>
			{/snippet}
		</StatCard>

		<StatCard
			title="Weighted Pipeline"
			value={formatCurrency(metrics().weightedValue)}
			subtitle="Probability adjusted"
		>
			{#snippet icon()}
				<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
				</svg>
			{/snippet}
		</StatCard>

		<StatCard
			title="Won This Month"
			value={formatCurrency(metrics().wonValue)}
			subtitle="Closed deals"
		>
			{#snippet icon()}
				<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			{/snippet}
		</StatCard>

		<StatCard
			title="Win Rate"
			value="{metrics().winRate}%"
			subtitle="Closed deals"
		>
			{#snippet icon()}
				<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			{/snippet}
		</StatCard>
	</div>

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2">
			<PipelineFunnel stages={data.stages} opportunities={data.opportunities} />
		</div>
		<div>
			<RecentActivity activities={data.activities} />
		</div>
	</div>
</div>
