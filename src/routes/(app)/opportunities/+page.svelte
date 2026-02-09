<script lang="ts">
	import { Header } from '$lib/components/layout';
	import { Card, Button, Badge, Modal } from '$lib/components/ui';
	import { OpportunityForm } from '$lib/components/forms';
	import { formatCurrency, formatDate } from '$lib/utils';
	import { toastStore } from '$lib/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showNewOpportunityModal = $state(false);
	let formLoading = $state(false);

	async function handleCreateOpportunity(formData: FormData) {
		formLoading = true;
		try {
			const response = await fetch('/api/opportunities', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to create opportunity');
			}

			toastStore.add({ type: 'success', message: 'Opportunity created successfully' });
			showNewOpportunityModal = false;
			window.location.reload();
		} catch (error) {
			toastStore.add({ type: 'error', message: error instanceof Error ? error.message : 'Failed to create opportunity' });
		} finally {
			formLoading = false;
		}
	}

	function getStageColor(stageName: string): string {
		const stage = data.stages.find(s => s.name === stageName);
		return stage?.color || '#6b7280';
	}
</script>

<Header
	user={data.user}
	title="Opportunities"
	onNewOpportunity={() => (showNewOpportunityModal = true)}
/>

<div class="p-6">
	<div class="flex justify-between items-center mb-6">
		<p class="text-gray-600">{data.opportunities.length} opportunities</p>
	</div>

	<Card padding="none">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50 border-b border-gray-200">
					<tr>
						<th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
							Opportunity
						</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
							Client
						</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
							Stage
						</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
							Value
						</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
							Probability
						</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
							Expected Close
						</th>
						<th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
							Owner
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each data.opportunities as opp}
						<tr
							class="hover:bg-gray-50 cursor-pointer"
							onclick={() => goto(`/opportunities/${opp.id}`)}
						>
							<td class="px-6 py-4">
								<div class="font-medium text-gray-900">{opp.title}</div>
								{#if opp.fabricWorkloads && opp.fabricWorkloads.length > 0}
									<div class="flex gap-1 mt-1">
										{#each opp.fabricWorkloads.slice(0, 2) as workload}
											<Badge variant="blue" class="text-xs">{workload}</Badge>
										{/each}
										{#if opp.fabricWorkloads.length > 2}
											<Badge variant="gray" class="text-xs">+{opp.fabricWorkloads.length - 2}</Badge>
										{/if}
									</div>
								{/if}
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								{opp.client?.name || '-'}
							</td>
							<td class="px-6 py-4">
								<span
									class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
									style="background-color: {opp.stage?.color}20; color: {opp.stage?.color}"
								>
									<span
										class="w-2 h-2 rounded-full"
										style="background-color: {opp.stage?.color}"
									></span>
									{opp.stage?.name || '-'}
								</span>
							</td>
							<td class="px-6 py-4 text-sm font-medium text-gray-900">
								{formatCurrency(opp.value || 0)}
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								{opp.probability}%
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								{formatDate(opp.expectedCloseDate)}
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								{opp.owner?.name || '-'}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="px-6 py-12 text-center">
								<svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
								</svg>
								<h3 class="text-lg font-medium text-gray-900 mb-2">No opportunities yet</h3>
								<p class="text-gray-500 mb-4">Get started by creating your first opportunity.</p>
								<Button onclick={() => (showNewOpportunityModal = true)}>
									Create Opportunity
								</Button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>
</div>

<Modal
	open={showNewOpportunityModal}
	onclose={() => (showNewOpportunityModal = false)}
	title="New Opportunity"
	size="xl"
>
	<OpportunityForm
		stages={data.stages}
		clients={data.clients}
		users={data.users}
		defaultOwnerId={data.user?.id ?? null}
		onsubmit={handleCreateOpportunity}
		oncancel={() => (showNewOpportunityModal = false)}
		loading={formLoading}
	/>
</Modal>
