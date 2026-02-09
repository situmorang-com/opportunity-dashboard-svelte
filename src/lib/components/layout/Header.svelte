<script lang="ts">
	import { Button, Input, Avatar } from '$lib/components/ui';
	import type { User } from 'lucia';
	import type { Snippet } from 'svelte';

	interface Props {
		user: User | null;
		title?: string;
		subtitle?: string;
		onNewOpportunity?: () => void;
		showSearch?: boolean;
		searchValue?: string;
		searchPlaceholder?: string;
		onsearch?: (value: string) => void;
		actions?: Snippet;
	}

	let {
		user,
		title = 'Dashboard',
		subtitle,
		onNewOpportunity,
		showSearch = true,
		searchValue = $bindable(''),
		searchPlaceholder = 'Search...',
		onsearch,
		actions
	}: Props = $props();

	function handleSearch(event: Event) {
		const input = event.target as HTMLInputElement;
		searchValue = input.value;
		onsearch?.(input.value);
	}
</script>

<header class="bg-white border-b border-gray-200 px-6 py-4">
	<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">{title}</h1>
			{#if subtitle}
				<p class="text-sm text-gray-500">{subtitle}</p>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<!-- Custom Actions Slot -->
			{#if actions}
				{@render actions()}
			{/if}

			<!-- Search -->
			{#if showSearch}
				<div class="relative w-full sm:w-64">
					<Input
						type="search"
						placeholder={searchPlaceholder}
						value={searchValue}
						oninput={handleSearch}
						class="pl-10"
					/>
					<svg
						class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
			{/if}

			<!-- New Opportunity Button -->
			{#if onNewOpportunity}
				<Button onclick={onNewOpportunity}>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					New Opportunity
				</Button>
			{/if}

			<!-- Notifications -->
			<button
				type="button"
				class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
				</svg>
				<span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
			</button>

			<!-- User Avatar -->
			{#if user}
				<Avatar name={user.name} src={user.avatarUrl} size="md" />
			{/if}
		</div>
	</div>
</header>
