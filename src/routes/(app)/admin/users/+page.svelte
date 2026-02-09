<script lang="ts">
	import { Header } from '$lib/components/layout';
	import { Card, Button, Badge, Modal, Input, Select, Avatar } from '$lib/components/ui';
	import { toastStore } from '$lib/stores';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let formLoading = $state(false);
	let selectedUser = $state<(typeof data.users)[0] | null>(null);

	// Form fields
	let formName = $state('');
	let formEmail = $state('');
	let formRole = $state('rep');

	const roleOptions = [
		{ value: 'admin', label: 'Admin' },
		{ value: 'manager', label: 'Manager' },
		{ value: 'rep', label: 'Sales Rep' }
	];

	function getRoleBadgeVariant(role: string): 'purple' | 'blue' | 'gray' {
		if (role === 'admin') return 'purple';
		if (role === 'manager') return 'blue';
		return 'gray';
	}

	function openAddModal() {
		formName = '';
		formEmail = '';
		formRole = 'rep';
		showAddModal = true;
	}

	function openEditModal(user: (typeof data.users)[0]) {
		selectedUser = user;
		formName = user.name;
		formEmail = user.email;
		formRole = user.role;
		showEditModal = true;
	}

	function openDeleteModal(user: (typeof data.users)[0]) {
		selectedUser = user;
		showDeleteModal = true;
	}

	async function handleAddUser() {
		formLoading = true;
		try {
			const response = await fetch('/api/admin/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formName,
					email: formEmail,
					role: formRole
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to add user');
			}

			toastStore.add({ type: 'success', message: 'User added successfully' });
			showAddModal = false;
			await invalidateAll();
		} catch (error) {
			toastStore.add({ type: 'error', message: error instanceof Error ? error.message : 'Failed to add user' });
		} finally {
			formLoading = false;
		}
	}

	async function handleEditUser() {
		if (!selectedUser) return;
		formLoading = true;
		try {
			const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: formName,
					email: formEmail,
					role: formRole
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update user');
			}

			toastStore.add({ type: 'success', message: 'User updated successfully' });
			showEditModal = false;
			await invalidateAll();
		} catch (error) {
			toastStore.add({ type: 'error', message: error instanceof Error ? error.message : 'Failed to update user' });
		} finally {
			formLoading = false;
		}
	}

	async function handleDeleteUser() {
		if (!selectedUser) return;
		formLoading = true;
		try {
			const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete user');
			}

			toastStore.add({ type: 'success', message: 'User deleted successfully' });
			showDeleteModal = false;
			await invalidateAll();
		} catch (error) {
			toastStore.add({ type: 'error', message: error instanceof Error ? error.message : 'Failed to delete user' });
		} finally {
			formLoading = false;
		}
	}

	// Stats
	const stats = $derived({
		total: data.users.length,
		admins: data.users.filter((u) => u.role === 'admin').length,
		managers: data.users.filter((u) => u.role === 'manager').length,
		reps: data.users.filter((u) => u.role === 'rep').length
	});

	const isAdmin = $derived(data.user?.role === 'admin');
</script>

<Header user={data.user} title="User Management" />

<div class="p-6">
	<!-- Stats Row -->
	<div class="grid grid-cols-4 gap-4 mb-6">
		<Card class="text-center">
			<p class="text-3xl font-bold text-gray-900">{stats.total}</p>
			<p class="text-sm text-gray-500">Total Users</p>
		</Card>
		<Card class="text-center">
			<p class="text-3xl font-bold text-purple-600">{stats.admins}</p>
			<p class="text-sm text-gray-500">Admins</p>
		</Card>
		<Card class="text-center">
			<p class="text-3xl font-bold text-blue-600">{stats.managers}</p>
			<p class="text-sm text-gray-500">Managers</p>
		</Card>
		<Card class="text-center">
			<p class="text-3xl font-bold text-gray-600">{stats.reps}</p>
			<p class="text-sm text-gray-500">Sales Reps</p>
		</Card>
	</div>

	<!-- Header with Add Button -->
	<div class="flex justify-between items-center mb-6">
		<p class="text-gray-600">{data.users.length} users</p>
		{#if isAdmin}
			<Button onclick={openAddModal}>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Add User
			</Button>
		{/if}
	</div>

	<!-- Users List -->
	<Card>
		<div class="divide-y divide-gray-100">
			{#each data.users as user}
				<div class="flex items-center justify-between py-4 px-2 hover:bg-gray-50">
					<div class="flex items-center gap-4">
						<Avatar name={user.name} src={user.avatarUrl} size="md" />
						<div>
							<div class="flex items-center gap-2">
								<span class="font-medium text-gray-900">{user.name}</span>
								{#if user.googleId}
									<svg class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" aria-label="Google account linked">
										<title>Google account linked</title>
										<path
											fill="currentColor"
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										/>
										<path
											fill="currentColor"
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										/>
									</svg>
								{/if}
							</div>
							<p class="text-sm text-gray-500">{user.email}</p>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<Badge variant={getRoleBadgeVariant(user.role)}>
							{user.role}
						</Badge>
						<span class="text-sm text-gray-500">{user.opportunityCount} opps</span>
						{#if isAdmin && user.id !== data.user?.id}
							<div class="flex gap-1">
								<button
									type="button"
									onclick={() => openEditModal(user)}
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
									onclick={() => openDeleteModal(user)}
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
						{:else if user.id === data.user?.id}
							<span class="text-xs text-gray-400">(You)</span>
						{/if}
					</div>
				</div>
			{:else}
				<div class="py-12 text-center text-gray-500">
					<p>No users found</p>
				</div>
			{/each}
		</div>
	</Card>
</div>

<!-- Add User Modal -->
<Modal open={showAddModal} onclose={() => (showAddModal = false)} title="Add User" size="md">
	<form onsubmit={(e) => { e.preventDefault(); handleAddUser(); }} class="space-y-4">
		<Input name="name" label="Name" placeholder="John Smith" bind:value={formName} required />
		<Input
			name="email"
			type="email"
			label="Email"
			placeholder="john@example.com"
			bind:value={formEmail}
			required
		/>
		<p class="text-xs text-gray-500 -mt-2">This should be their Google account email</p>
		<Select name="role" label="Role" options={roleOptions} bind:value={formRole} />
		<div class="flex justify-end gap-3 pt-4">
			<Button variant="outline" onclick={() => (showAddModal = false)}>Cancel</Button>
			<Button type="submit" loading={formLoading}>Add User</Button>
		</div>
	</form>
</Modal>

<!-- Edit User Modal -->
<Modal open={showEditModal} onclose={() => (showEditModal = false)} title="Edit User" size="md">
	<form onsubmit={(e) => { e.preventDefault(); handleEditUser(); }} class="space-y-4">
		<Input name="name" label="Name" bind:value={formName} required />
		<Input name="email" type="email" label="Email" bind:value={formEmail} required />
		<Select name="role" label="Role" options={roleOptions} bind:value={formRole} />
		<div class="flex justify-end gap-3 pt-4">
			<Button variant="outline" onclick={() => (showEditModal = false)}>Cancel</Button>
			<Button type="submit" loading={formLoading}>Save Changes</Button>
		</div>
	</form>
</Modal>

<!-- Delete Confirmation Modal -->
<Modal open={showDeleteModal} onclose={() => (showDeleteModal = false)} title="Delete User" size="sm">
	<p class="text-gray-600 mb-6">
		Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
	</p>
	<div class="flex justify-end gap-3">
		<Button variant="outline" onclick={() => (showDeleteModal = false)}>Cancel</Button>
		<Button variant="danger" onclick={handleDeleteUser} loading={formLoading}>Delete</Button>
	</div>
</Modal>
