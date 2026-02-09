<script lang="ts">
	import { Header } from '$lib/components/layout';
	import { Card, Button, Badge, Modal, Input, Avatar } from '$lib/components/ui';
	import { toastStore } from '$lib/stores';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Tab = 'pipeline' | 'profile' | 'general';
	let activeTab = $state<Tab>('pipeline');

	let showAddStageModal = $state(false);
	let showEditStageModal = $state(false);
	let showDeleteStageModal = $state(false);
	let formLoading = $state(false);
	let selectedStage = $state<(typeof data.stages)[0] | null>(null);

	// Form fields for stages
	let stageName = $state('');
	let stageProbability = $state(0);
	let stageColor = $state('#6b7280');
	let stageDescription = $state('');
	let stageIsWon = $state(false);
	let stageIsLost = $state(false);

	const isAdmin = $derived(data.user?.role === 'admin');

	function openAddStageModal() {
		stageName = '';
		stageProbability = 0;
		stageColor = '#6b7280';
		stageDescription = '';
		stageIsWon = false;
		stageIsLost = false;
		showAddStageModal = true;
	}

	function openEditStageModal(stage: (typeof data.stages)[0]) {
		selectedStage = stage;
		stageName = stage.name;
		stageProbability = stage.probability;
		stageColor = stage.color;
		stageDescription = stage.description || '';
		stageIsWon = stage.isWon;
		stageIsLost = stage.isLost;
		showEditStageModal = true;
	}

	function openDeleteStageModal(stage: (typeof data.stages)[0]) {
		selectedStage = stage;
		showDeleteStageModal = true;
	}

	async function handleAddStage() {
		formLoading = true;
		try {
			const response = await fetch('/api/admin/stages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: stageName,
					probability: stageProbability,
					color: stageColor,
					description: stageDescription || null,
					isWon: stageIsWon,
					isLost: stageIsLost
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to add stage');
			}

			toastStore.add({ type: 'success', message: 'Stage added successfully' });
			showAddStageModal = false;
			await invalidateAll();
		} catch (error) {
			toastStore.add({ type: 'error', message: error instanceof Error ? error.message : 'Failed to add stage' });
		} finally {
			formLoading = false;
		}
	}

	async function handleEditStage() {
		if (!selectedStage) return;
		formLoading = true;
		try {
			const response = await fetch(`/api/admin/stages/${selectedStage.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: stageName,
					probability: stageProbability,
					color: stageColor,
					description: stageDescription || null,
					isWon: stageIsWon,
					isLost: stageIsLost
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update stage');
			}

			toastStore.add({ type: 'success', message: 'Stage updated successfully' });
			showEditStageModal = false;
			await invalidateAll();
		} catch (error) {
			toastStore.add({ type: 'error', message: error instanceof Error ? error.message : 'Failed to update stage' });
		} finally {
			formLoading = false;
		}
	}

	async function handleDeleteStage() {
		if (!selectedStage) return;
		formLoading = true;
		try {
			const response = await fetch(`/api/admin/stages/${selectedStage.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete stage');
			}

			toastStore.add({ type: 'success', message: 'Stage deleted successfully' });
			showDeleteStageModal = false;
			await invalidateAll();
		} catch (error) {
			toastStore.add({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete stage' });
		} finally {
			formLoading = false;
		}
	}

	async function moveStage(stage: (typeof data.stages)[0], direction: 'up' | 'down') {
		const currentIndex = data.stages.findIndex((s) => s.id === stage.id);
		const newOrder = direction === 'up' ? stage.order - 1 : stage.order + 1;

		if (newOrder < 1 || newOrder > data.stages.length) return;

		try {
			const response = await fetch(`/api/admin/stages/${stage.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ order: newOrder })
			});

			if (!response.ok) {
				throw new Error('Failed to reorder stage');
			}

			await invalidateAll();
		} catch (error) {
			toastStore.add({ type: 'error', message: 'Failed to reorder stage' });
		}
	}
</script>

<Header user={data.user} title="Settings" />

<div class="p-6">
	<!-- Tabs -->
	<div class="border-b border-gray-200 mb-6">
		<nav class="flex gap-6">
			<button
				type="button"
				onclick={() => (activeTab = 'pipeline')}
				class="pb-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'pipeline'
					? 'border-indigo-600 text-indigo-600'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
			>
				Pipeline Stages
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'profile')}
				class="pb-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'profile'
					? 'border-indigo-600 text-indigo-600'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
			>
				Profile
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'general')}
				class="pb-3 text-sm font-medium border-b-2 transition-colors {activeTab === 'general'
					? 'border-indigo-600 text-indigo-600'
					: 'border-transparent text-gray-500 hover:text-gray-700'}"
			>
				General
			</button>
		</nav>
	</div>

	<!-- Pipeline Stages Tab -->
	{#if activeTab === 'pipeline'}
		<div class="flex justify-between items-center mb-6">
			<div>
				<h2 class="text-lg font-semibold text-gray-900">Pipeline Stages</h2>
				<p class="text-sm text-gray-500">Manage your sales pipeline stages and their order</p>
			</div>
			{#if isAdmin}
				<Button onclick={openAddStageModal}>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Add Stage
				</Button>
			{/if}
		</div>

		<Card>
			<div class="divide-y divide-gray-100">
				{#each data.stages as stage, index}
					<div class="flex items-center justify-between py-4 px-2 hover:bg-gray-50">
						<div class="flex items-center gap-4">
							<div class="flex flex-col gap-1">
								{#if isAdmin}
									<button
										type="button"
										onclick={() => moveStage(stage, 'up')}
										disabled={index === 0}
										class="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
										</svg>
									</button>
									<button
										type="button"
										onclick={() => moveStage(stage, 'down')}
										disabled={index === data.stages.length - 1}
										class="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
										</svg>
									</button>
								{/if}
							</div>
							<div
								class="w-4 h-4 rounded-full"
								style="background-color: {stage.color}"
							></div>
							<div>
								<div class="flex items-center gap-2">
									<span class="font-medium text-gray-900">{stage.name}</span>
									{#if stage.isWon}
										<Badge variant="green">Won</Badge>
									{:else if stage.isLost}
										<Badge variant="red">Lost</Badge>
									{/if}
								</div>
								{#if stage.description}
									<p class="text-sm text-gray-500">{stage.description}</p>
								{/if}
							</div>
						</div>
						<div class="flex items-center gap-4">
							<span class="text-sm text-gray-500">{stage.probability}% probability</span>
							<span class="text-sm text-gray-500">{stage.opportunityCount} opps</span>
							{#if isAdmin}
								<div class="flex gap-1">
									<button
										type="button"
										onclick={() => openEditStageModal(stage)}
										class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
											/>
										</svg>
									</button>
									<button
										type="button"
										onclick={() => openDeleteStageModal(stage)}
										class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<div class="py-12 text-center text-gray-500">
						<p>No stages configured</p>
					</div>
				{/each}
			</div>
		</Card>
	{/if}

	<!-- Profile Tab -->
	{#if activeTab === 'profile'}
		<Card>
			<div class="flex items-center gap-6 mb-6">
				<Avatar name={data.user?.name || ''} src={data.user?.avatarUrl} size="lg" />
				<div>
					<h3 class="text-lg font-semibold text-gray-900">{data.user?.name}</h3>
					<p class="text-gray-500">{data.user?.email}</p>
					<Badge variant="purple" class="mt-2">{data.user?.role}</Badge>
				</div>
			</div>
			<div class="border-t pt-6">
				<p class="text-sm text-gray-500">
					Your profile is managed through your Google account. To update your name or avatar,
					update your Google account settings.
				</p>
			</div>
		</Card>
	{/if}

	<!-- General Tab -->
	{#if activeTab === 'general'}
		<Card>
			<div class="text-center py-12">
				<svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
				<h3 class="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
				<p class="text-gray-500">General settings like notifications, exports, and branding will be available here.</p>
			</div>
		</Card>
	{/if}
</div>

<!-- Add Stage Modal -->
<Modal open={showAddStageModal} onclose={() => (showAddStageModal = false)} title="Add Stage" size="md">
	<form onsubmit={(e) => { e.preventDefault(); handleAddStage(); }} class="space-y-4">
		<Input name="name" label="Name" placeholder="e.g. Qualification" bind:value={stageName} required />
		<div class="grid grid-cols-2 gap-4">
			<Input
				name="probability"
				type="number"
				label="Win Probability (%)"
				min="0"
				max="100"
				bind:value={stageProbability}
			/>
			<div>
				<label for="color" class="block text-sm font-medium text-gray-700 mb-1">Color</label>
				<input
					type="color"
					id="color"
					bind:value={stageColor}
					class="h-10 w-full rounded border border-gray-300 cursor-pointer"
				/>
			</div>
		</div>
		<Input name="description" label="Description" placeholder="Optional description" bind:value={stageDescription} />
		<div class="flex gap-6">
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={stageIsWon} class="rounded border-gray-300 text-indigo-600" />
				<span class="text-sm text-gray-700">Won stage</span>
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={stageIsLost} class="rounded border-gray-300 text-indigo-600" />
				<span class="text-sm text-gray-700">Lost stage</span>
			</label>
		</div>
		<div class="flex justify-end gap-3 pt-4">
			<Button variant="outline" onclick={() => (showAddStageModal = false)}>Cancel</Button>
			<Button type="submit" loading={formLoading}>Add Stage</Button>
		</div>
	</form>
</Modal>

<!-- Edit Stage Modal -->
<Modal open={showEditStageModal} onclose={() => (showEditStageModal = false)} title="Edit Stage" size="md">
	<form onsubmit={(e) => { e.preventDefault(); handleEditStage(); }} class="space-y-4">
		<Input name="name" label="Name" bind:value={stageName} required />
		<div class="grid grid-cols-2 gap-4">
			<Input
				name="probability"
				type="number"
				label="Win Probability (%)"
				min="0"
				max="100"
				bind:value={stageProbability}
			/>
			<div>
				<label for="editColor" class="block text-sm font-medium text-gray-700 mb-1">Color</label>
				<input
					type="color"
					id="editColor"
					bind:value={stageColor}
					class="h-10 w-full rounded border border-gray-300 cursor-pointer"
				/>
			</div>
		</div>
		<Input name="description" label="Description" bind:value={stageDescription} />
		<div class="flex gap-6">
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={stageIsWon} class="rounded border-gray-300 text-indigo-600" />
				<span class="text-sm text-gray-700">Won stage</span>
			</label>
			<label class="flex items-center gap-2">
				<input type="checkbox" bind:checked={stageIsLost} class="rounded border-gray-300 text-indigo-600" />
				<span class="text-sm text-gray-700">Lost stage</span>
			</label>
		</div>
		<div class="flex justify-end gap-3 pt-4">
			<Button variant="outline" onclick={() => (showEditStageModal = false)}>Cancel</Button>
			<Button type="submit" loading={formLoading}>Save Changes</Button>
		</div>
	</form>
</Modal>

<!-- Delete Stage Confirmation Modal -->
<Modal open={showDeleteStageModal} onclose={() => (showDeleteStageModal = false)} title="Delete Stage" size="sm">
	<p class="text-gray-600 mb-6">
		Are you sure you want to delete the <strong>{selectedStage?.name}</strong> stage? This action cannot be undone.
	</p>
	{#if selectedStage && selectedStage.opportunityCount > 0}
		<div class="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg mb-6 text-sm">
			This stage has {selectedStage.opportunityCount} opportunities. Move them to another stage first.
		</div>
	{/if}
	<div class="flex justify-end gap-3">
		<Button variant="outline" onclick={() => (showDeleteStageModal = false)}>Cancel</Button>
		<Button variant="danger" onclick={handleDeleteStage} loading={formLoading}>Delete</Button>
	</div>
</Modal>
