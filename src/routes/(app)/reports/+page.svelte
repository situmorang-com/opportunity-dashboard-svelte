<script lang="ts">
	import { Header } from '$lib/components/layout';
	import { Card, Badge } from '$lib/components/ui';

	let { data } = $props();

	const {
		summary,
		pipelineByStage,
		workloadDistribution,
		leadSourceAnalysis,
		competitorAnalysis,
		salesRepLeaderboard,
		clientAnalysis,
		monthlyTrend
	} = data;

	// Format currency
	function formatCurrency(value: number): string {
		if (value >= 1000000) {
			return `$${(value / 1000000).toFixed(1)}M`;
		} else if (value >= 1000) {
			return `$${(value / 1000).toFixed(0)}K`;
		}
		return `$${value.toFixed(0)}`;
	}

	function formatCurrencyFull(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	// Calculate max values for chart scaling
	const maxPipelineValue = Math.max(...pipelineByStage.map((s) => s.totalValue), 1);
	const maxWorkloadCount = Math.max(...workloadDistribution.map((w) => w.count), 1);
	const maxLeadSourceValue = Math.max(...leadSourceAnalysis.map((l) => l.value), 1);
	const maxMonthlyValue = Math.max(...monthlyTrend.map((m) => m.value), 1);

	// Revenue breakdown calculations
	const revenueTotal = summary.totalLicenseCost + summary.totalServicesCost;
	const licensePercent = revenueTotal > 0 ? (summary.totalLicenseCost / revenueTotal) * 100 : 50;
	const servicesPercent = revenueTotal > 0 ? (summary.totalServicesCost / revenueTotal) * 100 : 50;
	const circumference = 2 * Math.PI * 35;

	// Colors for charts
	const chartColors = [
		'#6366f1', // indigo
		'#8b5cf6', // violet
		'#ec4899', // pink
		'#f59e0b', // amber
		'#10b981', // emerald
		'#3b82f6', // blue
		'#ef4444', // red
		'#84cc16' // lime
	];

	const workloadColors: Record<string, string> = {
		Lakehouse: '#3b82f6',
		'Data Warehouse': '#8b5cf6',
		'Data Factory': '#10b981',
		'Power BI': '#f59e0b',
		'Real-Time Intelligence': '#ec4899',
		'Data Science': '#6366f1',
		'Data Activator': '#ef4444',
		Notebooks: '#84cc16',
		Eventstream: '#06b6d4',
		'KQL Database': '#f97316'
	};
</script>

<svelte:head>
	<title>Reports | Sales Dashboard</title>
</svelte:head>

<Header user={data.user} title="Reports & Analytics" />

<div class="p-6 space-y-6 bg-gray-50 min-h-screen">
	<!-- Top KPI Cards -->
	<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
		<!-- Total Pipeline -->
		<div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
			<div class="flex items-center justify-between mb-2">
				<span class="text-indigo-100 text-sm font-medium">Total Pipeline</span>
				<div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
			</div>
			<p class="text-2xl font-bold">{formatCurrency(summary.totalPipelineValue)}</p>
			<p class="text-indigo-200 text-xs mt-1">{summary.totalOpportunities} opportunities</p>
		</div>

		<!-- Weighted Pipeline -->
		<div class="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-200">
			<div class="flex items-center justify-between mb-2">
				<span class="text-violet-100 text-sm font-medium">Weighted Value</span>
				<div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
				</div>
			</div>
			<p class="text-2xl font-bold">{formatCurrency(summary.totalWeightedValue)}</p>
			<p class="text-violet-200 text-xs mt-1">Probability adjusted</p>
		</div>

		<!-- Average Deal Size -->
		<div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-200">
			<div class="flex items-center justify-between mb-2">
				<span class="text-emerald-100 text-sm font-medium">Avg Deal Size</span>
				<div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
					</svg>
				</div>
			</div>
			<p class="text-2xl font-bold">{formatCurrency(summary.avgDealSize)}</p>
			<p class="text-emerald-200 text-xs mt-1">Per opportunity</p>
		</div>

		<!-- Win Rate -->
		<div class="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-200">
			<div class="flex items-center justify-between mb-2">
				<span class="text-amber-100 text-sm font-medium">Win Rate</span>
				<div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
			</div>
			<p class="text-2xl font-bold">{summary.winRate.toFixed(0)}%</p>
			<p class="text-amber-200 text-xs mt-1">{summary.wonCount}W / {summary.lostCount}L</p>
		</div>

		<!-- License Revenue -->
		<div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
			<div class="flex items-center justify-between mb-2">
				<span class="text-blue-100 text-sm font-medium">License Revenue</span>
				<div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
			</div>
			<p class="text-2xl font-bold">{formatCurrency(summary.totalLicenseCost)}</p>
			<p class="text-blue-200 text-xs mt-1">Estimated licenses</p>
		</div>

		<!-- Services Revenue -->
		<div class="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-5 text-white shadow-lg shadow-pink-200">
			<div class="flex items-center justify-between mb-2">
				<span class="text-pink-100 text-sm font-medium">Services Revenue</span>
				<div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</div>
			</div>
			<p class="text-2xl font-bold">{formatCurrency(summary.totalServicesCost)}</p>
			<p class="text-pink-200 text-xs mt-1">Estimated services</p>
		</div>
	</div>

	<!-- Main Charts Row -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Pipeline by Stage -->
		<Card>
			<div class="flex items-center justify-between mb-6">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Pipeline by Stage</h2>
					<p class="text-sm text-gray-500">Value distribution across sales stages</p>
				</div>
				<Badge variant="blue">{summary.totalOpportunities} total</Badge>
			</div>
			<div class="space-y-4">
				{#each pipelineByStage as item, i}
					<div class="group">
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-2">
								<span
									class="w-3 h-3 rounded-full"
									style="background-color: {item.stage.color}"
								></span>
								<span class="text-sm font-medium text-gray-700">{item.stage.name}</span>
								<span class="text-xs text-gray-400">({item.count})</span>
							</div>
							<span class="text-sm font-semibold text-gray-900">{formatCurrencyFull(item.totalValue)}</span>
						</div>
						<div class="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
							<div
								class="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ease-out group-hover:opacity-90"
								style="width: {(item.totalValue / maxPipelineValue) * 100}%; background-color: {item.stage.color}"
							>
								<div class="h-full flex items-center justify-end pr-3">
									{#if item.totalValue / maxPipelineValue > 0.15}
										<span class="text-xs font-medium text-white">{((item.totalValue / summary.totalPipelineValue) * 100).toFixed(0)}%</span>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Fabric Workloads Distribution -->
		<Card>
			<div class="flex items-center justify-between mb-6">
				<div>
					<h2 class="text-lg font-semibold text-gray-900">Microsoft Fabric Workloads</h2>
					<p class="text-sm text-gray-500">Most requested workloads across opportunities</p>
				</div>
			</div>
			{#if workloadDistribution.length > 0}
				<div class="grid grid-cols-2 gap-3">
					{#each workloadDistribution as workload, i}
						<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
							<div
								class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
								style="background-color: {workloadColors[workload.name] || chartColors[i % chartColors.length]}"
							>
								{workload.count}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-gray-900 truncate">{workload.name}</p>
								<div class="w-full h-1.5 bg-gray-200 rounded-full mt-1">
									<div
										class="h-full rounded-full transition-all"
										style="width: {(workload.count / maxWorkloadCount) * 100}%; background-color: {workloadColors[workload.name] || chartColors[i % chartColors.length]}"
									></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 text-gray-400">
					<p>No workload data available</p>
				</div>
			{/if}
		</Card>
	</div>

	<!-- Second Row -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Lead Source Analysis -->
		<Card>
			<div class="mb-6">
				<h2 class="text-lg font-semibold text-gray-900">Lead Sources</h2>
				<p class="text-sm text-gray-500">Where opportunities come from</p>
			</div>
			<div class="space-y-3">
				{#each leadSourceAnalysis as source, i}
					<div class="flex items-center gap-3">
						<div
							class="w-2 h-8 rounded-full"
							style="background-color: {chartColors[i % chartColors.length]}"
						></div>
						<div class="flex-1">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-700">{source.source}</span>
								<span class="text-sm text-gray-500">{source.count} deals</span>
							</div>
							<div class="flex items-center justify-between mt-1">
								<div class="flex-1 h-2 bg-gray-100 rounded-full mr-3">
									<div
										class="h-full rounded-full"
										style="width: {(source.value / maxLeadSourceValue) * 100}%; background-color: {chartColors[i % chartColors.length]}"
									></div>
								</div>
								<span class="text-sm font-semibold text-gray-900">{formatCurrency(source.value)}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Competitor Analysis -->
		<Card>
			<div class="mb-6">
				<h2 class="text-lg font-semibold text-gray-900">Competitive Landscape</h2>
				<p class="text-sm text-gray-500">Who we're competing against</p>
			</div>
			<div class="space-y-3">
				{#each competitorAnalysis as comp, i}
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
						<div class="flex items-center gap-3">
							<div
								class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
								style="background-color: {chartColors[i % chartColors.length]}"
							>
								{comp.count}
							</div>
							<span class="text-sm font-medium text-gray-700">{comp.competitor}</span>
						</div>
						<span class="text-sm font-semibold text-gray-900">{formatCurrency(comp.value)}</span>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Sales Rep Leaderboard -->
		<Card>
			<div class="mb-6">
				<h2 class="text-lg font-semibold text-gray-900">Sales Leaderboard</h2>
				<p class="text-sm text-gray-500">Top performers by pipeline value</p>
			</div>
			<div class="space-y-3">
				{#each salesRepLeaderboard as rep, i}
					<div class="flex items-center gap-3 p-3 {i === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200' : 'bg-gray-50'} rounded-xl">
						<div class="flex items-center justify-center w-8 h-8 rounded-full {i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-gray-600'} font-bold text-sm">
							{i + 1}
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900">{rep.name}</p>
							<p class="text-xs text-gray-500">{rep.count} opportunities</p>
						</div>
						<div class="text-right">
							<p class="text-sm font-bold text-gray-900">{formatCurrency(rep.value)}</p>
							<p class="text-xs text-gray-500">Weighted: {formatCurrency(rep.weightedValue)}</p>
						</div>
					</div>
				{/each}
			</div>
		</Card>
	</div>

	<!-- Client Analysis -->
	<Card>
		<div class="flex items-center justify-between mb-6">
			<div>
				<h2 class="text-lg font-semibold text-gray-900">Client Portfolio</h2>
				<p class="text-sm text-gray-500">Revenue breakdown by client</p>
			</div>
			<Badge variant="gray">{clientAnalysis.length} clients</Badge>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b border-gray-200">
						<th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
						<th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Industry</th>
						<th class="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Opportunities</th>
						<th class="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Value</th>
						<th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pipeline Share</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each clientAnalysis as item, i}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="py-4 px-4">
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
										style="background-color: {chartColors[i % chartColors.length]}"
									>
										{item.client.name.charAt(0)}
									</div>
									<div>
										<p class="font-medium text-gray-900">{item.client.name}</p>
										<p class="text-xs text-gray-500">{item.client.region || 'N/A'}</p>
									</div>
								</div>
							</td>
							<td class="py-4 px-4">
								<Badge variant="gray">{item.client.industry || 'N/A'}</Badge>
							</td>
							<td class="py-4 px-4 text-center">
								<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
									{item.opportunityCount}
								</span>
							</td>
							<td class="py-4 px-4 text-right font-semibold text-gray-900">
								{formatCurrencyFull(item.totalValue)}
							</td>
							<td class="py-4 px-4">
								<div class="flex items-center gap-2">
									<div class="flex-1 h-2 bg-gray-100 rounded-full">
										<div
											class="h-full rounded-full"
											style="width: {(item.totalValue / summary.totalPipelineValue) * 100}%; background-color: {chartColors[i % chartColors.length]}"
										></div>
									</div>
									<span class="text-xs text-gray-500 w-10 text-right">
										{((item.totalValue / summary.totalPipelineValue) * 100).toFixed(0)}%
									</span>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Revenue Split Card -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<Card>
			<div class="mb-6">
				<h2 class="text-lg font-semibold text-gray-900">Revenue Breakdown</h2>
				<p class="text-sm text-gray-500">License vs Services split</p>
			</div>
			<div class="flex items-center justify-center py-4">
				<div class="relative w-48 h-48">
					<!-- Donut Chart -->
					<svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
						<!-- Background circle -->
						<circle cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" stroke-width="12" />

						<!-- License segment -->
						<circle
							cx="50"
							cy="50"
							r="35"
							fill="none"
							stroke="#3b82f6"
							stroke-width="12"
							stroke-dasharray="{(licensePercent / 100) * circumference} {circumference}"
							stroke-linecap="round"
						/>

						<!-- Services segment -->
						<circle
							cx="50"
							cy="50"
							r="35"
							fill="none"
							stroke="#ec4899"
							stroke-width="12"
							stroke-dasharray="{(servicesPercent / 100) * circumference} {circumference}"
							stroke-dashoffset="-{(licensePercent / 100) * circumference}"
							stroke-linecap="round"
						/>
					</svg>
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="text-center">
							<p class="text-2xl font-bold text-gray-900">{formatCurrency(revenueTotal)}</p>
							<p class="text-xs text-gray-500">Total</p>
						</div>
					</div>
				</div>
			</div>
			<div class="flex justify-center gap-8 mt-4">
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-blue-500"></div>
					<div>
						<p class="text-sm font-medium text-gray-700">License</p>
						<p class="text-lg font-bold text-gray-900">{formatCurrency(summary.totalLicenseCost)}</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<div class="w-3 h-3 rounded-full bg-pink-500"></div>
					<div>
						<p class="text-sm font-medium text-gray-700">Services</p>
						<p class="text-lg font-bold text-gray-900">{formatCurrency(summary.totalServicesCost)}</p>
					</div>
				</div>
			</div>
		</Card>

		<!-- Win/Loss Analysis -->
		<Card>
			<div class="mb-6">
				<h2 class="text-lg font-semibold text-gray-900">Win/Loss Analysis</h2>
				<p class="text-sm text-gray-500">Closed deal performance</p>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div class="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
					<div class="flex items-center gap-2 mb-3">
						<div class="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<span class="text-emerald-700 font-semibold">Won</span>
					</div>
					<p class="text-3xl font-bold text-emerald-700">{summary.wonCount}</p>
					<p class="text-sm text-emerald-600 mt-1">{formatCurrency(summary.totalWonValue)}</p>
				</div>
				<div class="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200">
					<div class="flex items-center gap-2 mb-3">
						<div class="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
							<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</div>
						<span class="text-red-700 font-semibold">Lost</span>
					</div>
					<p class="text-3xl font-bold text-red-700">{summary.lostCount}</p>
					<p class="text-sm text-red-600 mt-1">{formatCurrency(summary.totalLostValue)}</p>
				</div>
			</div>
			<div class="mt-6 p-4 bg-gray-50 rounded-xl">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm text-gray-600">Win Rate</span>
					<span class="text-lg font-bold text-gray-900">{summary.winRate.toFixed(0)}%</span>
				</div>
				<div class="h-3 bg-gray-200 rounded-full overflow-hidden">
					<div class="h-full flex">
						<div
							class="bg-emerald-500 transition-all duration-500"
							style="width: {summary.winRate}%"
						></div>
						<div
							class="bg-red-500 transition-all duration-500"
							style="width: {100 - summary.winRate}%"
						></div>
					</div>
				</div>
			</div>
		</Card>
	</div>
</div>
