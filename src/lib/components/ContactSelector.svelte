<script lang="ts">
	import type { ClientContact } from '$lib/server/db/schema';

	interface Props {
		contacts: ClientContact[];
		selectedContactId?: number | null;
		onselect: (contact: ClientContact | null) => void;
		label?: string;
		placeholder?: string;
	}

	let {
		contacts,
		selectedContactId = null,
		onselect,
		label = 'Select Contact',
		placeholder = 'Choose from client contacts...'
	}: Props = $props();

	let isOpen = $state(false);
	let searchTerm = $state('');

	const filteredContacts = $derived(
		contacts.filter((c) => {
			const search = searchTerm.toLowerCase();
			return (
				c.name.toLowerCase().includes(search) ||
				(c.title?.toLowerCase().includes(search) ?? false) ||
				(c.email?.toLowerCase().includes(search) ?? false)
			);
		})
	);

	const selectedContact = $derived(contacts.find((c) => c.id === selectedContactId) ?? null);

	function handleSelect(contact: ClientContact | null) {
		onselect(contact);
		isOpen = false;
		searchTerm = '';
	}

	function handleClear() {
		onselect(null);
		searchTerm = '';
	}

	function getRoleBadgeColor(role: string | null): string {
		switch (role) {
			case 'decision_maker':
				return 'bg-purple-100 text-purple-800';
			case 'champion':
				return 'bg-green-100 text-green-800';
			case 'technical':
				return 'bg-blue-100 text-blue-800';
			case 'influencer':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function formatRole(role: string | null): string {
		if (!role) return 'Other';
		return role
			.split('_')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}
</script>

<div class="relative">
	{#if label}
		<label class="block text-sm font-medium text-gray-700 mb-1">{label}</label>
	{/if}

	<!-- Selected Contact Display / Trigger -->
	<div
		role="combobox"
		aria-expanded={isOpen}
		aria-haspopup="listbox"
		tabindex="0"
		onclick={() => (isOpen = !isOpen)}
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isOpen = !isOpen; }}}
		class="w-full text-left border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors cursor-pointer"
	>
		{#if selectedContact}
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2 min-w-0">
					<span class="font-medium text-gray-900 truncate">{selectedContact.name}</span>
					{#if selectedContact.title}
						<span class="text-gray-500 text-sm truncate">- {selectedContact.title}</span>
					{/if}
					<span class="px-2 py-0.5 text-xs rounded-full {getRoleBadgeColor(selectedContact.role)}">
						{formatRole(selectedContact.role)}
					</span>
				</div>
				<button
					type="button"
					aria-label="Clear selection"
					onclick={(e) => {
						e.stopPropagation();
						handleClear();
					}}
					class="text-gray-400 hover:text-gray-600"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		{:else}
			<span class="text-gray-500">{placeholder}</span>
		{/if}
	</div>

	<!-- Dropdown -->
	{#if isOpen}
		<!-- Backdrop -->
		<button type="button" class="fixed inset-0 z-10" onclick={() => (isOpen = false)} aria-label="Close dropdown"></button>

		<div class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
			<!-- Search Input -->
			<div class="p-2 border-b border-gray-100">
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Search contacts..."
					class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				/>
			</div>

			<!-- Contact List -->
			<div class="max-h-48 overflow-y-auto">
				{#if filteredContacts.length === 0}
					<div class="px-4 py-3 text-sm text-gray-500 text-center">
						{contacts.length === 0 ? 'No contacts available' : 'No matching contacts'}
					</div>
				{:else}
					{#each filteredContacts as contact}
						<button
							type="button"
							onclick={() => handleSelect(contact)}
							class="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors {contact.id === selectedContactId ? 'bg-indigo-50' : ''}"
						>
							<div class="flex items-center justify-between">
								<div class="min-w-0">
									<div class="flex items-center gap-2">
										<span class="font-medium text-gray-900">{contact.name}</span>
										{#if contact.isPrimary}
											<svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
											</svg>
										{/if}
									</div>
									{#if contact.title}
										<p class="text-sm text-gray-500">{contact.title}</p>
									{/if}
									{#if contact.email}
										<p class="text-xs text-gray-400">{contact.email}</p>
									{/if}
								</div>
								<span class="px-2 py-0.5 text-xs rounded-full {getRoleBadgeColor(contact.role)}">
									{formatRole(contact.role)}
								</span>
							</div>
						</button>
					{/each}
				{/if}
			</div>

			<!-- Manual Entry Option -->
			<div class="border-t border-gray-100 p-2">
				<button
					type="button"
					onclick={() => handleSelect(null)}
					class="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-2"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
					Enter manually instead
				</button>
			</div>
		</div>
	{/if}
</div>
