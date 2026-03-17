<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	type Command = {
		id: string;
		label: string;
		description?: string;
		href?: string;
		action?: () => void;
		keywords?: string[];
	};

	let open = $state(false);
	let query = $state('');
	let selectedIndex = $state(0);

	const commands: Command[] = [
		{ id: 'nav-dashboard', label: 'Go to Dashboard', href: '/dashboard', keywords: ['home', 'metrics'] },
		{ id: 'nav-pipeline', label: 'Go to Pipeline', href: '/pipeline', keywords: ['kanban', 'deals'] },
		{ id: 'nav-worklist', label: 'Go to Worklist', href: '/worklist', keywords: ['tasks', 'queue'] },
		{ id: 'nav-opportunities', label: 'Go to Opportunities', href: '/opportunities', keywords: ['deals', 'list'] },
		{ id: 'nav-meetings', label: 'Go to Meetings', href: '/meetings', keywords: ['calendar', 'schedule'] },
		{ id: 'nav-clients', label: 'Go to Clients', href: '/clients', keywords: ['accounts', 'companies'] },
		{ id: 'nav-contacts', label: 'Go to Contacts', href: '/contacts', keywords: ['people'] },
		{ id: 'nav-reports', label: 'Go to Reports', href: '/reports', keywords: ['analytics', 'forecast'] },
		{ id: 'action-new-opp', label: 'Open Pipeline and Create Opportunity', href: '/pipeline', keywords: ['create', 'new deal'] },
		{ id: 'action-current-opps', label: 'Open Current Opportunity (if on detail page)', action: openCurrentOpportunity, keywords: ['deal', 'current'] }
	];

	function openCurrentOpportunity() {
		const path = $page.url.pathname;
		if (path.startsWith('/opportunities/')) {
			goto(path);
			return;
		}
	}

	const filteredCommands = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return commands;
		return commands.filter((cmd) => {
			const haystack = [
				cmd.label,
				cmd.description || '',
				...(cmd.keywords || [])
			].join(' ').toLowerCase();
			return haystack.includes(q);
		});
	});

	$effect(() => {
		selectedIndex = 0;
	});

	function execute(cmd: Command) {
		open = false;
		query = '';
		if (cmd.action) {
			cmd.action();
			return;
		}
		if (cmd.href) {
			goto(cmd.href);
		}
	}

	function onKeydown(event: KeyboardEvent) {
		const mod = event.metaKey || event.ctrlKey;
		if (mod && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			open = !open;
			return;
		}
		if (!open) return;
		if (event.key === 'Escape') {
			open = false;
			query = '';
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, Math.max(0, filteredCommands.length - 1));
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			selectedIndex = Math.max(0, selectedIndex - 1);
		}
		if (event.key === 'Enter') {
			const cmd = filteredCommands[selectedIndex];
			if (cmd) {
				event.preventDefault();
				execute(cmd);
			}
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<button
	type="button"
	class="hidden lg:inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
	onclick={() => (open = true)}
	title="Open command palette (Cmd/Ctrl+K)"
>
	<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m1.85-5.65a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
	</svg>
	<span>Search / Command</span>
	<span class="rounded border border-gray-200 px-1.5 py-0.5 text-xs text-gray-500">⌘K</span>
</button>

{#if open}
	<div class="fixed inset-0 z-[70] bg-black/30 p-4 sm:p-8" onclick={(e) => e.currentTarget === e.target && (open = false)}>
		<div class="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
			<div class="border-b border-gray-200 p-3">
				<input
					type="text"
					bind:value={query}
					placeholder="Search commands and pages..."
					autofocus
					class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
				<div class="mt-2 text-xs text-gray-500">Tip: use <kbd>↑</kbd> <kbd>↓</kbd> and <kbd>Enter</kbd></div>
			</div>
			<div class="max-h-[60vh] overflow-y-auto p-2">
				{#if filteredCommands.length === 0}
					<div class="px-3 py-6 text-center text-sm text-gray-500">No matching commands</div>
				{:else}
					{#each filteredCommands as cmd, index (cmd.id)}
						<button
							type="button"
							class="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
							class:bg-indigo-50={index === selectedIndex}
							onmouseenter={() => (selectedIndex = index)}
							onclick={() => execute(cmd)}
						>
							<div class="text-sm font-medium text-gray-900">{cmd.label}</div>
							{#if cmd.description}
								<div class="text-xs text-gray-500">{cmd.description}</div>
							{/if}
							{#if cmd.href}
								<div class="text-[11px] text-gray-400 mt-0.5">{cmd.href}</div>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
