<script lang="ts">
	import { onMount } from 'svelte';
	import { Header } from '$lib/components/layout';
	import { KanbanBoard } from '$lib/components/kanban';
	import { Modal } from '$lib/components/ui';
	import { OpportunityForm } from '$lib/components/forms';
	import { toastStore } from '$lib/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { OpportunityWithRelations } from '$lib/stores';

	let { data }: { data: PageData } = $props();

	let showNewOpportunityModal = $state(false);
	let formLoading = $state(false);
	type HygieneFilter = 'all' | 'at_risk' | 'stale' | 'missing_next_step' | 'missing_champion' | 'overdue_close';
	type SavedPipelineView = { id: string; name: string; hygieneFilter: HygieneFilter };
	let hygieneFilter = $state<HygieneFilter>('all');
	let savedViews = $state<SavedPipelineView[]>([]);
	const PIPELINE_VIEWS_KEY = 'srkk-pipeline-saved-views-v1';

	onMount(() => {
		try {
			const raw = localStorage.getItem(PIPELINE_VIEWS_KEY);
			if (!raw) return;
			savedViews = JSON.parse(raw);
		} catch {
			savedViews = [];
		}
	});

	$effect(() => {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(PIPELINE_VIEWS_KEY, JSON.stringify(savedViews));
	});

	function hasReason(opportunity: PageData['opportunities'][number], reason: string) {
		return opportunity.health?.reasons?.includes(reason) ?? false;
	}

	function matchesHygieneFilter(opportunity: PageData['opportunities'][number], filter: HygieneFilter) {
		switch (filter) {
			case 'at_risk':
				return opportunity.health?.status === 'at_risk';
			case 'stale':
				return opportunity.health?.stale === true;
			case 'missing_next_step':
				return hasReason(opportunity, 'Missing next step');
			case 'missing_champion':
				return hasReason(opportunity, 'Missing champion');
			case 'overdue_close':
				return hasReason(opportunity, 'Close date is overdue');
			case 'all':
			default:
				return true;
		}
	}

	const filteredOpportunities = $derived(
		data.opportunities.filter((opp) => matchesHygieneFilter(opp, hygieneFilter))
	);

	const hygieneCounts = $derived({
		atRisk: data.opportunities.filter((opp) => opp.health?.status === 'at_risk').length,
		stale: data.opportunities.filter((opp) => opp.health?.stale).length,
		missingNextStep: data.opportunities.filter((opp) => hasReason(opp, 'Missing next step')).length,
		missingChampion: data.opportunities.filter((opp) => hasReason(opp, 'Missing champion')).length,
		overdueClose: data.opportunities.filter((opp) => hasReason(opp, 'Close date is overdue')).length
	});

	const topRiskDeals = $derived(
		[...data.opportunities]
			.filter((opp) => opp.health && opp.health.status !== 'healthy')
			.sort((a, b) => (a.health?.score ?? 100) - (b.health?.score ?? 100))
			.slice(0, 5)
	);

	async function handleStageChange(opportunityId: number, newStageId: number) {
		const response = await fetch(`/api/opportunities/${opportunityId}/stage`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ stageId: newStageId })
		});

		let result: Record<string, unknown> = {};
		try {
			result = await response.json();
		} catch {
			// ignore parse errors
		}

		if (!response.ok) {
			throw new Error((result?.error as string) || (result?.message as string) || 'Failed to update stage');
		}

		// Redirect to Discovery Assessment when moving to Discovery stage
		if (result.redirectTo) {
			goto(result.redirectTo as string);
		}
	}

	function handleOpportunityClick(opp: OpportunityWithRelations) {
		goto(`/opportunities/${opp.id}`);
	}

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
			// Reload the page to get updated data
			window.location.reload();
		} catch (error) {
			toastStore.add({ type: 'error', message: error instanceof Error ? error.message : 'Failed to create opportunity' });
		} finally {
			formLoading = false;
		}
	}

	function saveCurrentView() {
		const name = window.prompt('Saved view name');
		if (!name?.trim()) return;
		savedViews = [
			{ id: crypto.randomUUID(), name: name.trim(), hygieneFilter },
			...savedViews
		].slice(0, 10);
		toastStore.add({ type: 'success', message: 'Pipeline view saved' });
	}

	function applySavedView(view: SavedPipelineView) {
		hygieneFilter = view.hygieneFilter;
	}

	function deleteSavedView(id: string) {
		savedViews = savedViews.filter((v) => v.id !== id);
	}
</script>

<Header
	user={data.user}
	title="Pipeline"
	onNewOpportunity={() => (showNewOpportunityModal = true)}
/>

<div class="p-6">
	<div class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
		<div class="flex flex-col gap-4">
			<div class="flex flex-wrap items-center gap-2">
				<button
					type="button"
					class="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
					onclick={saveCurrentView}
				>
					Save current view
				</button>
				{#each savedViews as view}
					<div class="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50">
						<button
							type="button"
							class="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-l-lg"
							onclick={() => applySavedView(view)}
						>
							{view.name}
						</button>
						<button
							type="button"
							class="px-2 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-r-lg"
							onclick={() => deleteSavedView(view.id)}
							title="Delete saved view"
						>
							✕
						</button>
					</div>
				{/each}
			</div>

			<div class="flex items-center justify-between gap-4">
				<div>
					<h2 class="text-sm font-semibold text-gray-900">Pipeline Hygiene</h2>
					<p class="text-xs text-gray-500">Use filters to focus on risky deals before forecast review.</p>
				</div>
				{#if hygieneFilter !== 'all'}
					<button
						type="button"
						class="text-xs font-medium text-indigo-600 hover:text-indigo-700"
						onclick={() => (hygieneFilter = 'all')}
					>
						Clear filter
					</button>
				{/if}
			</div>

			<div class="grid grid-cols-2 md:grid-cols-5 gap-2">
				<button type="button" class="rounded-lg border px-3 py-2 text-left hover:bg-gray-50" onclick={() => (hygieneFilter = 'at_risk')}>
					<div class="text-xs text-gray-500">At risk</div>
					<div class="text-lg font-semibold text-red-600">{hygieneCounts.atRisk}</div>
				</button>
				<button type="button" class="rounded-lg border px-3 py-2 text-left hover:bg-gray-50" onclick={() => (hygieneFilter = 'stale')}>
					<div class="text-xs text-gray-500">Stale deals</div>
					<div class="text-lg font-semibold text-amber-600">{hygieneCounts.stale}</div>
				</button>
				<button type="button" class="rounded-lg border px-3 py-2 text-left hover:bg-gray-50" onclick={() => (hygieneFilter = 'missing_next_step')}>
					<div class="text-xs text-gray-500">Missing next step</div>
					<div class="text-lg font-semibold text-gray-900">{hygieneCounts.missingNextStep}</div>
				</button>
				<button type="button" class="rounded-lg border px-3 py-2 text-left hover:bg-gray-50" onclick={() => (hygieneFilter = 'missing_champion')}>
					<div class="text-xs text-gray-500">Missing champion</div>
					<div class="text-lg font-semibold text-gray-900">{hygieneCounts.missingChampion}</div>
				</button>
				<button type="button" class="rounded-lg border px-3 py-2 text-left hover:bg-gray-50" onclick={() => (hygieneFilter = 'overdue_close')}>
					<div class="text-xs text-gray-500">Overdue close date</div>
					<div class="text-lg font-semibold text-red-600">{hygieneCounts.overdueClose}</div>
				</button>
			</div>

			{#if topRiskDeals.length > 0}
				<div class="rounded-lg bg-gray-50 p-3">
					<div class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Top Risk Deals</div>
					<div class="space-y-2">
						{#each topRiskDeals as opp}
							<button
								type="button"
								class="flex w-full items-start justify-between gap-3 rounded-md bg-white px-3 py-2 text-left hover:bg-gray-100"
								onclick={() => handleOpportunityClick(opp)}
							>
								<div class="min-w-0">
									<div class="truncate text-sm font-medium text-gray-900">{opp.title}</div>
									<div class="truncate text-xs text-gray-500">
										{opp.client?.name || 'No client'}{#if opp.health?.reasons?.[0]} • {opp.health.reasons[0]}{/if}
									</div>
								</div>
								<div class="shrink-0 text-xs font-semibold {opp.health?.status === 'at_risk' ? 'text-red-600' : 'text-amber-600'}">
									Health {opp.health?.score ?? '-'}
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<KanbanBoard
		stages={data.stages}
		opportunities={filteredOpportunities}
		onStageChange={handleStageChange}
		onOpportunityClick={handleOpportunityClick}
	/>
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
