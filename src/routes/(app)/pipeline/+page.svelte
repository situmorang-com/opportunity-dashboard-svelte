<script lang="ts">
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

	async function handleStageChange(opportunityId: number, newStageId: number) {
		const response = await fetch(`/api/opportunities/${opportunityId}/stage`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ stageId: newStageId })
		});

		if (!response.ok) {
			throw new Error('Failed to update stage');
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
</script>

<Header
	user={data.user}
	title="Pipeline"
	onNewOpportunity={() => (showNewOpportunityModal = true)}
/>

<div class="p-6">
	<KanbanBoard
		stages={data.stages}
		opportunities={data.opportunities}
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
