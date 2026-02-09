<script lang="ts">
	import { Header } from '$lib/components/layout';
	import { Card, Button, Badge, Modal, Input } from '$lib/components/ui';
	import { ClientContactForm, ContactActivityForm } from '$lib/components/forms';
	import { toastStore } from '$lib/stores';
	import { formatDistanceToNow, format } from 'date-fns';
	import type { PageData } from './$types';
	import type { ClientContact, ContactActivity } from '$lib/server/db/schema';

	let { data }: { data: PageData } = $props();

	// Search state
	let searchTerm = $state('');

	// Modal states
	let showAddContactModal = $state(false);
	let showContactDetailModal = $state(false);
	let showActivityFormModal = $state(false);
	let selectedContact = $state<(typeof data.contacts)[number] | null>(null);
	let contactActivities = $state<any[]>([]);
	let activitiesLoading = $state(false);
	let formLoading = $state(false);
	let activityFormLoading = $state(false);
	let selectedClientId = $state<number | null>(null);
	let editingActivity = $state<any | null>(null);

	// Filtered contacts based on search
	const filteredContacts = $derived(
		data.contacts.filter((contact) => {
			if (!searchTerm) return true;
			const search = searchTerm.toLowerCase();
			return (
				contact.name.toLowerCase().includes(search) ||
				(contact.email?.toLowerCase().includes(search) ?? false) ||
				(contact.title?.toLowerCase().includes(search) ?? false) ||
				(contact.client?.name?.toLowerCase().includes(search) ?? false)
			);
		})
	);

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

	function getActivityIcon(type: string): string {
		switch (type) {
			case 'call':
				return 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';
			case 'email':
				return 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
			case 'meeting':
				return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
			case 'linkedin':
				return 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z';
			case 'whatsapp':
				return 'M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.07-1.36C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z';
			default:
				return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
		}
	}

	function getActivityColor(type: string): string {
		switch (type) {
			case 'call':
				return 'bg-blue-500';
			case 'email':
				return 'bg-indigo-500';
			case 'meeting':
				return 'bg-green-500';
			case 'linkedin':
				return 'bg-sky-600';
			case 'whatsapp':
				return 'bg-emerald-500';
			default:
				return 'bg-gray-500';
		}
	}

	function formatRelativeTime(dateStr: string | null): string {
		if (!dateStr) return '';
		try {
			return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
		} catch {
			return '';
		}
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '';
		try {
			return format(new Date(dateStr), 'MMM d, yyyy');
		} catch {
			return dateStr;
		}
	}

	async function openContactDetail(contact: (typeof data.contacts)[number]) {
		selectedContact = contact;
		showContactDetailModal = true;
		await loadActivities(contact.id);
	}

	async function loadActivities(contactId: number) {
		activitiesLoading = true;
		try {
			const response = await fetch(`/api/contacts/${contactId}/activities`);
			if (response.ok) {
				contactActivities = await response.json();
			}
		} catch (error) {
			console.error('Failed to load activities:', error);
		} finally {
			activitiesLoading = false;
		}
	}

	async function handleAddContact(contactData: {
		name: string;
		title: string;
		email: string;
		phone: string;
		role: string;
		isPrimary: boolean;
		notes: string;
	}) {
		if (!selectedClientId) {
			toastStore.add({ type: 'error', message: 'Please select a client' });
			return;
		}

		formLoading = true;
		try {
			const response = await fetch(`/api/clients/${selectedClientId}/contacts`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(contactData)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to add contact');
			}

			toastStore.add({ type: 'success', message: 'Contact added successfully' });
			showAddContactModal = false;
			selectedClientId = null;
			window.location.reload();
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to add contact'
			});
		} finally {
			formLoading = false;
		}
	}

	async function handleLogActivity(activityData: {
		type: string;
		title: string;
		description: string;
		outcome: string;
		activityDate: string;
		duration: number | null;
	}) {
		if (!selectedContact) return;

		activityFormLoading = true;
		try {
			const isEditing = !!editingActivity;
			const url = isEditing
				? `/api/contacts/${selectedContact.id}/activities/${editingActivity.id}`
				: `/api/contacts/${selectedContact.id}/activities`;

			const response = await fetch(url, {
				method: isEditing ? 'PATCH' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(activityData)
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'log'} activity`);
			}

			toastStore.add({ type: 'success', message: `Activity ${isEditing ? 'updated' : 'logged'} successfully` });
			showActivityFormModal = false;
			editingActivity = null;
			await loadActivities(selectedContact.id);
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to save activity'
			});
		} finally {
			activityFormLoading = false;
		}
	}

	function openEditActivity(activity: any) {
		editingActivity = activity;
		showActivityFormModal = true;
	}

	async function handleDeleteActivity(activity: any) {
		if (!selectedContact) return;
		if (!confirm(`Delete activity "${activity.title}"?`)) return;

		try {
			const response = await fetch(
				`/api/contacts/${selectedContact.id}/activities/${activity.id}`,
				{ method: 'DELETE' }
			);

			if (!response.ok) {
				throw new Error('Failed to delete activity');
			}

			toastStore.add({ type: 'success', message: 'Activity deleted' });
			await loadActivities(selectedContact.id);
		} catch (error) {
			toastStore.add({ type: 'error', message: 'Failed to delete activity' });
		}
	}
</script>

<Header user={data.user} title="Contacts" />

<div class="p-6">
	<!-- Header with search and add button -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
		<p class="text-gray-600">{filteredContacts.length} contacts</p>

		<div class="flex items-center gap-4">
			<!-- Search -->
			<div class="relative">
				<svg
					class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					type="text"
					placeholder="Search contacts..."
					bind:value={searchTerm}
					class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
				/>
			</div>

			<Button onclick={() => (showAddContactModal = true)}>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Add Contact
			</Button>
		</div>
	</div>

	<!-- Contacts Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each filteredContacts as contact}
			<div
				role="button"
				tabindex="0"
				class="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
				onclick={() => openContactDetail(contact)}
				onkeydown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						openContactDetail(contact);
					}
				}}
			>
				<Card class="hover:shadow-md transition-shadow cursor-pointer h-full">
					<div class="flex items-start gap-3">
						<!-- Avatar -->
						<div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-lg flex-shrink-0">
							{contact.name.charAt(0).toUpperCase()}
						</div>

						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<h3 class="font-semibold text-gray-900 truncate">{contact.name}</h3>
								{#if contact.isPrimary}
									<span class="text-yellow-500" title="Primary Contact">
										<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
											<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
										</svg>
									</span>
								{/if}
							</div>

							{#if contact.title}
								<p class="text-sm text-gray-600 truncate">{contact.title}</p>
							{/if}

							{#if contact.email}
								<div class="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
									</svg>
									<span class="truncate">{contact.email}</span>
								</div>
							{/if}

							{#if contact.phone}
								<div class="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
									</svg>
									<span>{contact.phone}</span>
								</div>
							{/if}

							<div class="flex items-center gap-2 mt-2">
								{#if contact.client}
									<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
										<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
										</svg>
										{contact.client.name}
									</span>
								{/if}
								<Badge variant={getRoleBadge(contact.role).variant} class="text-xs">
									{getRoleBadge(contact.role).label}
								</Badge>
							</div>

							{#if contact.lastActivity}
								<div class="mt-2 text-xs text-gray-400">
									Last: {contact.lastActivity.type} {formatRelativeTime(contact.lastActivity.date)}
								</div>
							{/if}
						</div>
					</div>
				</Card>
			</div>
		{:else}
			<div class="col-span-full text-center py-12">
				{#if searchTerm}
					<svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					<h3 class="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
					<p class="text-gray-500">Try adjusting your search terms.</p>
				{:else}
					<svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
					<h3 class="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
					<p class="text-gray-500 mb-4">Get started by adding contacts from your clients.</p>
					<Button onclick={() => (showAddContactModal = true)}>Add Contact</Button>
				{/if}
			</div>
		{/each}
	</div>
</div>

<!-- Add Contact Modal -->
<Modal
	open={showAddContactModal}
	onclose={() => { showAddContactModal = false; selectedClientId = null; }}
	title="Add Contact"
	size="md"
>
	<div class="space-y-4">
		<!-- Client Selection -->
		<div>
			<label for="clientSelect" class="block text-sm font-medium text-gray-700 mb-1">
				Select Client <span class="text-red-500">*</span>
			</label>
			<select
				id="clientSelect"
				bind:value={selectedClientId}
				class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
			>
				<option value={null}>Select a client...</option>
				{#each data.clients as client}
					<option value={client.id}>{client.name}</option>
				{/each}
			</select>
		</div>

		{#if selectedClientId}
			<ClientContactForm
				onsubmit={handleAddContact}
				oncancel={() => { showAddContactModal = false; selectedClientId = null; }}
				loading={formLoading}
			/>
		{:else}
			<div class="text-center py-8 text-gray-500">
				<p>Please select a client to add a contact.</p>
			</div>
		{/if}
	</div>
</Modal>

<!-- Contact Detail Modal -->
<Modal
	open={showContactDetailModal}
	onclose={() => { showContactDetailModal = false; selectedContact = null; }}
	title=""
	size="lg"
>
	{#if selectedContact}
		<div class="space-y-6">
			<!-- Contact Header -->
			<div class="flex items-start gap-4">
				<div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-2xl flex-shrink-0">
					{selectedContact.name.charAt(0).toUpperCase()}
				</div>
				<div class="flex-1">
					<div class="flex items-center gap-2">
						<h2 class="text-xl font-bold text-gray-900">{selectedContact.name}</h2>
						{#if selectedContact.isPrimary}
							<span class="text-yellow-500" title="Primary Contact">
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							</span>
						{/if}
						<Badge variant={getRoleBadge(selectedContact.role).variant}>
							{getRoleBadge(selectedContact.role).label}
						</Badge>
					</div>
					{#if selectedContact.title}
						<p class="text-gray-600">{selectedContact.title}</p>
					{/if}
					{#if selectedContact.client}
						<p class="text-sm text-gray-500">@ {selectedContact.client.name}</p>
					{/if}
				</div>
			</div>

			<!-- Contact Info -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
				{#if selectedContact.email}
					<a href="mailto:{selectedContact.email}" class="flex items-center gap-3 text-gray-700 hover:text-indigo-600">
						<div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
							<svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<div>
							<p class="text-xs text-gray-500">Email</p>
							<p class="text-sm font-medium">{selectedContact.email}</p>
						</div>
					</a>
				{/if}

				{#if selectedContact.phone}
					<a href="tel:{selectedContact.phone}" class="flex items-center gap-3 text-gray-700 hover:text-indigo-600">
						<div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
							<svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
							</svg>
						</div>
						<div>
							<p class="text-xs text-gray-500">Phone</p>
							<p class="text-sm font-medium">{selectedContact.phone}</p>
						</div>
					</a>
				{/if}

				{#if selectedContact.client}
					<div class="flex items-center gap-3 text-gray-700">
						<div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
							<svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						</div>
						<div>
							<p class="text-xs text-gray-500">Company</p>
							<p class="text-sm font-medium">{selectedContact.client.name}</p>
							{#if selectedContact.client.industry}
								<p class="text-xs text-gray-400">{selectedContact.client.industry}</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			{#if selectedContact.notes}
				<div class="p-4 bg-yellow-50 rounded-xl">
					<p class="text-xs font-medium text-yellow-800 mb-1">Notes</p>
					<p class="text-sm text-yellow-900">{selectedContact.notes}</p>
				</div>
			{/if}

			<!-- Activity Timeline -->
			<div>
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-semibold text-gray-900">Activity Timeline</h3>
					<Button size="sm" onclick={() => (showActivityFormModal = true)}>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Log Touchpoint
					</Button>
				</div>

				{#if activitiesLoading}
					<div class="text-center py-8 text-gray-500">
						<svg class="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						Loading activities...
					</div>
				{:else if contactActivities.length === 0}
					<div class="text-center py-8 bg-gray-50 rounded-xl">
						<svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p class="text-gray-500 mb-3">No activities logged yet</p>
						<Button size="sm" variant="outline" onclick={() => (showActivityFormModal = true)}>
							Log First Touchpoint
						</Button>
					</div>
				{:else}
					<div class="relative">
						<!-- Vertical line -->
						<div class="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

						<div class="space-y-4 max-h-80 overflow-y-auto">
							{#each contactActivities as activity}
								<div class="relative flex gap-4 group">
									<div class="relative z-10 w-10 h-10 rounded-full {getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0">
										<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getActivityIcon(activity.type)} />
										</svg>
									</div>
									<div class="flex-1 bg-gray-50 rounded-xl p-3 min-w-0 relative">
										<div class="flex items-start justify-between gap-2">
											<h4 class="font-medium text-gray-900 text-sm">{activity.title}</h4>
											<span class="text-xs text-gray-400 flex-shrink-0">{formatDate(activity.activityDate)}</span>
										</div>
										{#if activity.description}
											<p class="text-xs text-gray-600 mt-1">{activity.description}</p>
										{/if}
										{#if activity.outcome}
											<div class="mt-2 p-2 bg-white rounded-lg border border-gray-100">
												<p class="text-xs text-gray-500">Outcome:</p>
												<p class="text-xs text-gray-700">{activity.outcome}</p>
											</div>
										{/if}
										<div class="flex flex-wrap gap-2 mt-2">
											{#if activity.duration}
												<span class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
													{activity.duration} min
												</span>
											{/if}
											{#if activity.user?.name}
												<span class="text-xs text-gray-400">
													by {activity.user.name}
												</span>
											{/if}
										</div>
										<!-- Edit/Delete buttons - bottom right, visible on hover -->
										<div class="absolute bottom-2 right-2 hidden group-hover:flex items-center gap-1">
											<button
												type="button"
												onclick={() => openEditActivity(activity)}
												class="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
												title="Edit"
											>
												<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
											</button>
											<button
												type="button"
												onclick={() => handleDeleteActivity(activity)}
												class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
												title="Delete"
											>
												<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</Modal>

<!-- Log Activity Modal -->
<Modal
	open={showActivityFormModal}
	onclose={() => { showActivityFormModal = false; editingActivity = null; }}
	title={editingActivity ? 'Edit Touchpoint' : 'Log Touchpoint'}
	size="md"
>
	<ContactActivityForm
		activity={editingActivity}
		onsubmit={handleLogActivity}
		oncancel={() => { showActivityFormModal = false; editingActivity = null; }}
		loading={activityFormLoading}
	/>
</Modal>
