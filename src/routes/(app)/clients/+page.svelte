<script lang="ts">
	import { Header } from '$lib/components/layout';
	import { Card, Button, Badge, Modal } from '$lib/components/ui';
	import { ClientForm, ClientContactForm } from '$lib/components/forms';
	import { toastStore } from '$lib/stores';
	import type { PageData } from './$types';
	import type { ClientContact } from '$lib/server/db/schema';

	let { data }: { data: PageData } = $props();

	// Client modals
	let showNewClientModal = $state(false);
	let formLoading = $state(false);
	let showEditClientModal = $state(false);
	let editLoading = $state(false);
	let selectedClient = $state<PageData['clients'][number] | null>(null);

	// Contacts state
	let clientContacts = $state<ClientContact[]>([]);
	let contactsLoading = $state(false);
	let showContactForm = $state(false);
	let contactFormLoading = $state(false);
	let editingContact = $state<ClientContact | null>(null);
	let activeTab = $state<'info' | 'contacts'>('info');

	async function handleCreateClient(formData: FormData) {
		formLoading = true;
		try {
			const response = await fetch('/api/clients', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to create client');
			}

			toastStore.add({ type: 'success', message: 'Client created successfully' });
			showNewClientModal = false;
			window.location.reload();
		} catch (error) {
			toastStore.add({ type: 'error', message: error instanceof Error ? error.message : 'Failed to create client' });
		} finally {
			formLoading = false;
		}
	}

	function getSizeBadgeVariant(size: string | null): 'gray' | 'blue' | 'purple' {
		if (size === 'enterprise') return 'purple';
		if (size === 'mid-market') return 'blue';
		return 'gray';
	}

	async function openEditClient(client: PageData['clients'][number]) {
		selectedClient = client;
		showEditClientModal = true;
		activeTab = 'info';
		await loadContacts(client.id);
	}

	async function loadContacts(clientId: number) {
		contactsLoading = true;
		try {
			const response = await fetch(`/api/clients/${clientId}/contacts`);
			if (response.ok) {
				clientContacts = await response.json();
			}
		} catch (error) {
			console.error('Failed to load contacts:', error);
		} finally {
			contactsLoading = false;
		}
	}

	async function handleUpdateClient(formData: FormData) {
		if (!selectedClient) return;
		editLoading = true;
		try {
			const response = await fetch(`/api/clients/${selectedClient.id}`, {
				method: 'PATCH',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Failed to update client');
			}

			toastStore.add({ type: 'success', message: 'Client updated successfully' });
			showEditClientModal = false;
			window.location.reload();
		} catch (error) {
			toastStore.add({ type: 'error', message: error instanceof Error ? error.message : 'Failed to update client' });
		} finally {
			editLoading = false;
		}
	}

	function openAddContact() {
		editingContact = null;
		showContactForm = true;
	}

	function openEditContact(contact: ClientContact) {
		editingContact = contact;
		showContactForm = true;
	}

	async function handleSaveContact(contactData: {
		name: string;
		title: string;
		email: string;
		phone: string;
		role: string;
		isPrimary: boolean;
		notes: string;
	}) {
		if (!selectedClient) return;
		contactFormLoading = true;

		try {
			const url = editingContact
				? `/api/clients/${selectedClient.id}/contacts/${editingContact.id}`
				: `/api/clients/${selectedClient.id}/contacts`;

			const response = await fetch(url, {
				method: editingContact ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(contactData)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to save contact');
			}

			toastStore.add({
				type: 'success',
				message: editingContact ? 'Contact updated' : 'Contact added'
			});
			showContactForm = false;
			await loadContacts(selectedClient.id);
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to save contact'
			});
		} finally {
			contactFormLoading = false;
		}
	}

	async function handleDeleteContact(contact: ClientContact) {
		if (!selectedClient) return;
		if (!confirm(`Delete contact "${contact.name}"?`)) return;

		try {
			const response = await fetch(
				`/api/clients/${selectedClient.id}/contacts/${contact.id}`,
				{ method: 'DELETE' }
			);

			if (!response.ok) {
				throw new Error('Failed to delete contact');
			}

			toastStore.add({ type: 'success', message: 'Contact deleted' });
			await loadContacts(selectedClient.id);
		} catch (error) {
			toastStore.add({ type: 'error', message: 'Failed to delete contact' });
		}
	}

	function getRoleBadge(role: string | null) {
		switch (role) {
			case 'decision_maker':
				return { label: 'Decision Maker', variant: 'purple' as const };
			case 'champion':
				return { label: 'Champion', variant: 'green' as const };
			case 'technical':
				return { label: 'Technical', variant: 'blue' as const };
			case 'influencer':
				return { label: 'Influencer', variant: 'yellow' as const };
			default:
				return { label: 'Other', variant: 'gray' as const };
		}
	}
</script>

<Header user={data.user} title="Clients" />

<div class="p-6">
	<div class="flex justify-between items-center mb-6">
		<p class="text-gray-600">{data.clients.length} clients</p>
		<Button onclick={() => (showNewClientModal = true)}>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Client
		</Button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each data.clients as client}
			<div
				role="button"
				tabindex="0"
				class="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
				onclick={() => openEditClient(client)}
				onkeydown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						openEditClient(client);
					}
				}}
			>
				<Card class="hover:shadow-md transition-shadow cursor-pointer">
					<div class="flex items-start justify-between mb-3">
						<div>
							<h3 class="font-semibold text-gray-900">{client.name}</h3>
							{#if client.industry}
								<p class="text-sm text-gray-500">{client.industry}</p>
							{/if}
						</div>
						{#if client.size}
							<Badge variant={getSizeBadgeVariant(client.size)}>
								{client.size}
							</Badge>
						{/if}
					</div>

					{#if client.primaryContact}
						<div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							{client.primaryContact}
						</div>
					{/if}

					{#if client.contactEmail}
						<div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
							{client.contactEmail}
						</div>
					{/if}

					{#if client.region}
						<div class="flex items-center gap-2 text-sm text-gray-600">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							{client.region}
						</div>
					{/if}
				</Card>
			</div>
		{:else}
			<div class="col-span-full text-center py-12">
				<svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
				</svg>
				<h3 class="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
				<p class="text-gray-500 mb-4">Get started by adding your first client.</p>
				<Button onclick={() => (showNewClientModal = true)}>Add Client</Button>
			</div>
		{/each}
	</div>
</div>

<!-- New Client Modal -->
<Modal
	open={showNewClientModal}
	onclose={() => (showNewClientModal = false)}
	title="Add Client"
	size="lg"
>
	<ClientForm
		onsubmit={handleCreateClient}
		oncancel={() => (showNewClientModal = false)}
		loading={formLoading}
	/>
</Modal>

<!-- Edit Client Modal with Tabs -->
<Modal
	open={showEditClientModal}
	onclose={() => (showEditClientModal = false)}
	title="Edit Client"
	size="xl"
>
	{#if selectedClient}
		<!-- Tabs -->
		<div class="flex gap-1 mb-4 border-b border-gray-200">
			<button
				type="button"
				class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors {activeTab === 'info'
					? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => (activeTab = 'info')}
			>
				Company Info
			</button>
			<button
				type="button"
				class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 {activeTab === 'contacts'
					? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
					: 'text-gray-500 hover:text-gray-700'}"
				onclick={() => (activeTab = 'contacts')}
			>
				Contacts
				{#if clientContacts.length > 0}
					<span class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
						{clientContacts.length}
					</span>
				{/if}
			</button>
		</div>

		<!-- Tab Content -->
		{#if activeTab === 'info'}
			<ClientForm
				client={selectedClient}
				onsubmit={handleUpdateClient}
				oncancel={() => (showEditClientModal = false)}
				loading={editLoading}
			/>
		{:else if activeTab === 'contacts'}
			<div class="space-y-4">
				<!-- Add Contact Button -->
				<div class="flex justify-between items-center">
					<p class="text-sm text-gray-600">
						Manage contacts for {selectedClient.name}
					</p>
					<Button size="sm" onclick={openAddContact}>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Add Contact
					</Button>
				</div>

				<!-- Contacts List -->
				{#if contactsLoading}
					<div class="text-center py-8 text-gray-500">
						<svg class="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						Loading contacts...
					</div>
				{:else if clientContacts.length === 0}
					<div class="text-center py-8 bg-gray-50 rounded-lg">
						<svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						<p class="text-gray-500 mb-3">No contacts added yet</p>
						<Button size="sm" variant="outline" onclick={openAddContact}>
							Add First Contact
						</Button>
					</div>
				{:else}
					<div class="space-y-3 max-h-80 overflow-y-auto">
						{#each clientContacts as contact}
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
								<div class="flex items-center gap-3">
									<!-- Avatar -->
									<div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-medium">
										{contact.name.charAt(0).toUpperCase()}
									</div>
									<div>
										<div class="flex items-center gap-2">
											<span class="font-medium text-gray-900">{contact.name}</span>
											{#if contact.isPrimary}
												<span class="text-yellow-500" title="Primary Contact">
													<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
														<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
													</svg>
												</span>
											{/if}
											<Badge variant={getRoleBadge(contact.role).variant}>
												{getRoleBadge(contact.role).label}
											</Badge>
										</div>
										<div class="text-sm text-gray-500">
											{#if contact.title}
												<span>{contact.title}</span>
											{/if}
											{#if contact.title && contact.email}
												<span class="mx-1">•</span>
											{/if}
											{#if contact.email}
												<span>{contact.email}</span>
											{/if}
										</div>
									</div>
								</div>
								<div class="flex items-center gap-1">
									<button
										type="button"
										onclick={() => openEditContact(contact)}
										class="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
										title="Edit contact"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
									</button>
									<button
										type="button"
										onclick={() => handleDeleteContact(contact)}
										class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
										title="Delete contact"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Close button -->
				<div class="flex justify-end pt-4 border-t border-gray-200">
					<Button variant="secondary" onclick={() => (showEditClientModal = false)}>
						Close
					</Button>
				</div>
			</div>
		{/if}
	{/if}
</Modal>

<!-- Contact Form Modal -->
<Modal
	open={showContactForm}
	onclose={() => (showContactForm = false)}
	title={editingContact ? 'Edit Contact' : 'Add Contact'}
	size="md"
>
	<ClientContactForm
		contact={editingContact}
		onsubmit={handleSaveContact}
		oncancel={() => (showContactForm = false)}
		loading={contactFormLoading}
	/>
</Modal>
