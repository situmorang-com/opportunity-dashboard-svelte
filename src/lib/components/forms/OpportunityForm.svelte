<script lang="ts">
	import { Button, Input, Select } from '$lib/components/ui';
	import ContactSelector from '$lib/components/ContactSelector.svelte';
	import {
		FABRIC_WORKLOADS,
		MIGRATION_SOURCES,
		COMPETITORS,
		PROJECT_DURATIONS,
		LEAD_SOURCES
	} from '$lib/constants';
	import type { Stage, Client, User, Opportunity, ClientContact } from '$lib/server/db/schema';

	interface Props {
		opportunity?: Opportunity | null;
		stages: Stage[];
		clients: Client[];
		users: Pick<User, 'id' | 'name'>[];
		contacts?: ClientContact[];
		defaultOwnerId?: string | null;
		onsubmit: (data: FormData) => Promise<void>;
		oncancel: () => void;
		loading?: boolean;
	}

	let { opportunity, stages, clients, users, contacts = [], defaultOwnerId, onsubmit, oncancel, loading = false }: Props = $props();

	let selectedWorkloads = $state<string[]>(opportunity?.fabricWorkloads || []);
	let selectedClientId = $state<string>(opportunity?.clientId != null ? String(opportunity.clientId) : '');
	let clientContacts = $state<ClientContact[]>(contacts);
	let loadingContacts = $state(false);

	// Authority fields (auto-filled from contact or manual)
	let authorityName = $state(opportunity?.authorityName || '');
	let authorityTitle = $state(opportunity?.authorityTitle || '');
	let authorityContact = $state(opportunity?.authorityContact || '');
	let authorityEmail = $state(opportunity?.authorityEmail || '');
	let selectedAuthorityContactId = $state<number | null>(null);

	// Champion fields (auto-filled from contact or manual)
	let championName = $state(opportunity?.championName || '');
	let championTitle = $state(opportunity?.championTitle || '');
	let championContact = $state(opportunity?.championContact || '');
	let championEmail = $state(opportunity?.championEmail || '');
	let selectedChampionContactId = $state<number | null>(null);

	// Load contacts when client changes
	async function loadClientContacts(clientId: string) {
		if (!clientId) {
			clientContacts = [];
			return;
		}

		loadingContacts = true;
		try {
			const response = await fetch(`/api/clients/${clientId}/contacts`);
			if (response.ok) {
				clientContacts = await response.json();
			} else {
				clientContacts = [];
			}
		} catch {
			clientContacts = [];
		} finally {
			loadingContacts = false;
		}
	}

	function handleClientChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		selectedClientId = target.value;
		loadClientContacts(selectedClientId);
		// Clear contact selections when client changes
		selectedAuthorityContactId = null;
		selectedChampionContactId = null;
	}

	function handleAuthorityContactSelect(contact: ClientContact | null) {
		selectedAuthorityContactId = contact?.id ?? null;
		if (contact) {
			authorityName = contact.name;
			authorityTitle = contact.title || '';
			authorityContact = contact.phone || '';
			authorityEmail = contact.email || '';
		}
	}

	function handleChampionContactSelect(contact: ClientContact | null) {
		selectedChampionContactId = contact?.id ?? null;
		if (contact) {
			championName = contact.name;
			championTitle = contact.title || '';
			championContact = contact.phone || '';
			championEmail = contact.email || '';
		}
	}

	function toggleWorkload(workload: string) {
		if (selectedWorkloads.includes(workload)) {
			selectedWorkloads = selectedWorkloads.filter((w) => w !== workload);
		} else {
			selectedWorkloads = [...selectedWorkloads, workload];
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		formData.set('fabricWorkloads', JSON.stringify(selectedWorkloads));
		// Set authority/champion fields from state (they may be auto-filled)
		formData.set('authorityName', authorityName);
		formData.set('authorityTitle', authorityTitle);
		formData.set('authorityContact', authorityContact);
		formData.set('authorityEmail', authorityEmail);
		formData.set('championName', championName);
		formData.set('championTitle', championTitle);
		formData.set('championContact', championContact);
		formData.set('championEmail', championEmail);
		await onsubmit(formData);
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
	<!-- Basic Info -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h3>

		<Input
			name="title"
			label="Opportunity Title"
			placeholder="e.g., Contoso Data Platform Migration"
			value={opportunity?.title || ''}
			required
		/>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="clientId" class="block text-sm font-medium text-gray-700 mb-1">Client</label>
				<select
					id="clientId"
					name="clientId"
					onchange={handleClientChange}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
					value={selectedClientId}
				>
					<option value="">Select a client</option>
					{#each clients as client}
						<option value={String(client.id)}>{client.name}</option>
					{/each}
				</select>
			</div>

			<Select
				name="ownerId"
				label="Owner"
				options={users.map((u) => ({ value: u.id, label: u.name }))}
				value={opportunity?.ownerId || defaultOwnerId || ''}
				required
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<Select
				name="stageId"
				label="Stage"
				options={stages.map((s) => ({ value: String(s.id), label: s.name }))}
				value={opportunity?.stageId != null ? String(opportunity.stageId) : (stages[0]?.id != null ? String(stages[0].id) : '')}
				required
			/>

			<Input
				name="expectedCloseDate"
				label="Expected Close Date"
				type="date"
				value={opportunity?.expectedCloseDate || ''}
			/>
		</div>
	</div>

	<!-- Lead & Partner Info -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Lead & Partner Info</h3>

		<div class="grid grid-cols-2 gap-4">
			<Select
				name="leadSource"
				label="Lead Source"
				options={[
					{ value: '', label: 'Select source' },
					...LEAD_SOURCES.map((s) => ({ value: s, label: s }))
				]}
				value={opportunity?.leadSource || ''}
			/>

			<Input
				name="partnerPic"
				label="Partner PIC"
				placeholder="e.g., John Doe (Microsoft)"
				value={opportunity?.partnerPic || ''}
			/>
		</div>
	</div>

	<!-- Authority Contact (Decision Maker) -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Authority (Decision Maker)</h3>

		{#if clientContacts.length > 0 || loadingContacts}
			<ContactSelector
				contacts={clientContacts}
				selectedContactId={selectedAuthorityContactId}
				onselect={handleAuthorityContactSelect}
				label="Select from Client Contacts"
				placeholder={loadingContacts ? 'Loading contacts...' : 'Choose a contact or enter manually'}
			/>
		{:else if selectedClientId}
			<p class="text-sm text-gray-500 italic">No contacts found for this client. <a href="/clients" class="text-indigo-600 hover:underline">Add contacts</a></p>
		{/if}

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="authorityName" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
				<input
					id="authorityName"
					type="text"
					placeholder="Decision maker name"
					bind:value={authorityName}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				/>
			</div>

			<div>
				<label for="authorityTitle" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
				<input
					id="authorityTitle"
					type="text"
					placeholder="e.g., Chief Data Officer"
					bind:value={authorityTitle}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="authorityContact" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
				<input
					id="authorityContact"
					type="tel"
					placeholder="+62..."
					bind:value={authorityContact}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				/>
			</div>

			<div>
				<label for="authorityEmail" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
				<input
					id="authorityEmail"
					type="email"
					placeholder="authority@company.com"
					bind:value={authorityEmail}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				/>
			</div>
		</div>
	</div>

	<!-- Champion Contact -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Champion / Key Liaison (Internal Advocate)</h3>

		{#if clientContacts.length > 0 || loadingContacts}
			<ContactSelector
				contacts={clientContacts}
				selectedContactId={selectedChampionContactId}
				onselect={handleChampionContactSelect}
				label="Select from Client Contacts"
				placeholder={loadingContacts ? 'Loading contacts...' : 'Choose a contact or enter manually'}
			/>
		{:else if selectedClientId}
			<p class="text-sm text-gray-500 italic">No contacts found for this client. <a href="/clients" class="text-indigo-600 hover:underline">Add contacts</a></p>
		{/if}

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="championName" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
				<input
					id="championName"
					type="text"
					placeholder="Champion name"
					bind:value={championName}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				/>
			</div>

			<div>
				<label for="championTitle" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
				<input
					id="championTitle"
					type="text"
					placeholder="e.g., Senior Data Analyst"
					bind:value={championTitle}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="championContact" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
				<input
					id="championContact"
					type="tel"
					placeholder="+62..."
					bind:value={championContact}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				/>
			</div>

			<div>
				<label for="championEmail" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
				<input
					id="championEmail"
					type="email"
					placeholder="champion@company.com"
					bind:value={championEmail}
					class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				/>
			</div>
		</div>
	</div>

	<!-- Engagement Info -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Engagement Info</h3>

		<div class="grid grid-cols-2 gap-4">
			<Input
				name="engagementTeam"
				label="Engagement Team"
				placeholder="e.g., Ardian, Gilbert, Azari"
				value={opportunity?.engagementTeam || ''}
			/>

			<Input
				name="documentsFolder"
				label="Documents Folder"
				placeholder="Link or folder name"
				value={opportunity?.documentsFolder || ''}
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<Input
				name="timeline"
				label="Timeline"
				placeholder="e.g., April 2025"
				value={opportunity?.timeline || ''}
			/>

			<Input
				name="immediateNextStep"
				label="Immediate Next Step"
				placeholder="e.g., Schedule discovery call"
				value={opportunity?.immediateNextStep || ''}
			/>
		</div>
	</div>

	<!-- Financials -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Financials</h3>

		<div class="grid grid-cols-3 gap-4">
			<Input
				name="value"
				label="Deal Value ($)"
				type="number"
				placeholder="100000"
				value={opportunity?.value?.toString() || ''}
			/>

			<Input
				name="estimatedLicenseCost"
				label="License Cost ($)"
				type="number"
				placeholder="50000"
				value={opportunity?.estimatedLicenseCost?.toString() || ''}
			/>

			<Input
				name="estimatedServicesCost"
				label="Services Cost ($)"
				type="number"
				placeholder="50000"
				value={opportunity?.estimatedServicesCost?.toString() || ''}
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<Input
				name="probability"
				label="Probability (%)"
				type="number"
				min="0"
				max="100"
				placeholder="50"
				value={opportunity?.probability?.toString() || ''}
			/>

			<Input
				name="capacityUnits"
				label="Fabric Capacity Units"
				type="number"
				placeholder="4"
				value={opportunity?.capacityUnits?.toString() || ''}
			/>
		</div>
	</div>

	<!-- Fabric Details -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Microsoft Fabric Details</h3>

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">Fabric Workloads</label>
			<div class="flex flex-wrap gap-2">
				{#each FABRIC_WORKLOADS as workload}
					<button
						type="button"
						onclick={() => toggleWorkload(workload)}
						class="px-3 py-1.5 text-sm rounded-full border transition-colors {selectedWorkloads.includes(workload)
							? 'bg-indigo-600 text-white border-indigo-600'
							: 'bg-white text-gray-700 border-gray-300 hover:border-indigo-500'}"
					>
						{workload}
					</button>
				{/each}
			</div>
		</div>

		<div class="grid grid-cols-3 gap-4">
			<Select
				name="migrationSource"
				label="Migration Source"
				options={[
					{ value: '', label: 'Select source' },
					...MIGRATION_SOURCES.map((s) => ({ value: s, label: s }))
				]}
				value={opportunity?.migrationSource || ''}
			/>

			<Select
				name="competitor"
				label="Competitor"
				options={[
					{ value: '', label: 'Select competitor' },
					...COMPETITORS.map((c) => ({ value: c, label: c }))
				]}
				value={opportunity?.competitor || ''}
			/>

			<Select
				name="projectDuration"
				label="Project Duration"
				options={[
					{ value: '', label: 'Select duration' },
					...PROJECT_DURATIONS.map((d) => ({ value: d, label: d }))
				]}
				value={opportunity?.projectDuration || ''}
			/>
		</div>
	</div>

	<!-- Detailed Info -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Detailed Information</h3>

		<div>
			<label for="objectives" class="block text-sm font-medium text-gray-700 mb-1">
				Objectives
			</label>
			<textarea
				id="objectives"
				name="objectives"
				rows="3"
				class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				placeholder="What are the customer's objectives?"
			>{opportunity?.objectives || ''}</textarea>
		</div>

		<div>
			<label for="keyPainPoints" class="block text-sm font-medium text-gray-700 mb-1">
				Key Pain Points
			</label>
			<textarea
				id="keyPainPoints"
				name="keyPainPoints"
				rows="3"
				class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				placeholder="What problems is the customer facing?"
			>{opportunity?.keyPainPoints || ''}</textarea>
		</div>

		<div>
			<label for="initiatives" class="block text-sm font-medium text-gray-700 mb-1">
				Initiatives / Proposed Solutions
			</label>
			<textarea
				id="initiatives"
				name="initiatives"
				rows="3"
				class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				placeholder="What solutions are we proposing?"
			>{opportunity?.initiatives || ''}</textarea>
		</div>

		<div>
			<label for="potentialRoadblocks" class="block text-sm font-medium text-gray-700 mb-1">
				Potential Roadblocks
			</label>
			<textarea
				id="potentialRoadblocks"
				name="potentialRoadblocks"
				rows="2"
				class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				placeholder="What might block this deal?"
			>{opportunity?.potentialRoadblocks || ''}</textarea>
		</div>

		<div>
			<label for="engagementSummary" class="block text-sm font-medium text-gray-700 mb-1">
				Engagement Summary
			</label>
			<textarea
				id="engagementSummary"
				name="engagementSummary"
				rows="3"
				class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				placeholder="Summary of what's been discussed..."
			>{opportunity?.engagementSummary || ''}</textarea>
		</div>
	</div>

	<!-- Description -->
	<div>
		<label for="description" class="block text-sm font-medium text-gray-700 mb-1">
			Description
		</label>
		<textarea
			id="description"
			name="description"
			rows="3"
			class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
			placeholder="Describe the opportunity..."
		>{opportunity?.description || ''}</textarea>
	</div>

	<!-- Actions -->
	<div class="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
		<Button type="button" variant="secondary" onclick={oncancel}>
			Cancel
		</Button>
		<Button type="submit" {loading}>
			{opportunity ? 'Update Opportunity' : 'Create Opportunity'}
		</Button>
	</div>
</form>
