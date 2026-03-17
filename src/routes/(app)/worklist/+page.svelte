<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Header } from '$lib/components/layout';
	import { Badge, Card } from '$lib/components/ui';
	import { formatDateTime } from '$lib/utils';
	import { toastStore } from '$lib/stores';
	import type { PageData } from './$types';

	type FilterKey = 'all' | 'today' | 'overdue' | 'at_risk' | 'missing_next_step' | 'meetings';
	type SavedWorklistView = { id: string; name: string; filter: FilterKey; repId?: string | null };

	let { data }: { data: PageData } = $props();
	let filter = $state<FilterKey>('all');
	let selectedRepId = $state(data.targetUserId);
	let hiddenItemIds = $state<Record<string, boolean>>({});
	let nextStepDrafts = $state<Record<string, string>>({});
	let nextStepExpanded = $state<Record<string, boolean>>({});
	let nextStepSaving = $state<Record<string, boolean>>({});
	let actionSaving = $state<Record<string, boolean>>({});
	let snoozeExpanded = $state<Record<string, boolean>>({});
	let outcomeExpanded = $state<Record<string, boolean>>({});
	let outcomeDrafts = $state<Record<string, { outcome: string; nextSteps: string }>>({});
	let outcomeSaving = $state<Record<string, boolean>>({});
	let selectedItemIds = $state<Record<string, boolean>>({});
	let bulkSaving = $state(false);
	let undoHistory = $state<Array<{
		id: string;
		itemIds: string[];
		status: 'done' | 'snoozed';
		label: string;
		createdAt: number;
	}>>([]);
	let bulkNextStepExpanded = $state(false);
	let bulkNextStepTemplate = $state('');
	let bulkNextStepSaving = $state(false);
	let savedViews = $state<SavedWorklistView[]>([]);
	const WORKLIST_VIEWS_KEY = 'srkk-worklist-saved-views-v1';

	onMount(() => {
		try {
			const raw = localStorage.getItem(WORKLIST_VIEWS_KEY);
			if (!raw) return;
			savedViews = JSON.parse(raw);
		} catch {
			savedViews = [];
		}
	});

	$effect(() => {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(WORKLIST_VIEWS_KEY, JSON.stringify(savedViews));
	});

	function filterItems(items: PageData['items'], key: FilterKey) {
		switch (key) {
			case 'today':
				return items.filter((item) => item.bucket === 'today' || item.bucket === 'overdue');
			case 'overdue':
				return items.filter((item) => item.bucket === 'overdue');
			case 'at_risk':
				return items.filter((item) => item.type === 'stale_deal' || item.type === 'overdue_close');
			case 'missing_next_step':
				return items.filter((item) => item.type === 'missing_next_step');
			case 'meetings':
				return items.filter(
					(item) => item.type === 'meeting_outcome_missing' || item.type === 'upcoming_meeting_prep'
				);
			case 'all':
			default:
				return items;
		}
	}

	const visibleItems = $derived(filterItems(data.items, filter).filter((item) => !hiddenItemIds[item.id]));
	const selectedVisibleCount = $derived(visibleItems.filter((item) => selectedItemIds[item.id]).length);
	const allVisibleSelected = $derived(visibleItems.length > 0 && visibleItems.every((item) => selectedItemIds[item.id]));
	const selectedTotalCount = $derived(Object.values(selectedItemIds).filter(Boolean).length);

	function priorityTone(priority: number): 'red' | 'yellow' | 'blue' {
		if (priority >= 85) return 'red';
		if (priority >= 70) return 'yellow';
		return 'blue';
	}

	function bucketTone(bucket: PageData['items'][number]['bucket']): 'red' | 'yellow' | 'gray' | 'blue' {
		if (bucket === 'overdue') return 'red';
		if (bucket === 'today') return 'yellow';
		if (bucket === 'this_week') return 'blue';
		return 'gray';
	}

	async function persistWorklistAction(
		itemId: string,
		status: 'done' | 'snoozed' | 'open',
		snoozedUntil?: string
	) {
		const response = await fetch('/api/worklist/actions', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ itemId, status, snoozedUntil })
		});
		const payload = await response.json().catch(() => ({}));
		if (!response.ok) {
			throw new Error(payload?.error || 'Failed to save worklist action');
		}
	}

	function pushUndoHistory(entry: { itemIds: string[]; status: 'done' | 'snoozed'; label: string }) {
		undoHistory = [
			{
				id: crypto.randomUUID(),
				createdAt: Date.now(),
				...entry
			},
			...undoHistory
		].slice(0, 5);
	}

	async function markDone(itemId: string) {
		actionSaving = { ...actionSaving, [itemId]: true };
		try {
			await persistWorklistAction(itemId, 'done');
			hiddenItemIds = { ...hiddenItemIds, [itemId]: true };
			selectedItemIds = { ...selectedItemIds, [itemId]: false };
			pushUndoHistory({
				itemIds: [itemId],
				status: 'done',
				label: 'Marked 1 item done'
			});
			toastStore.add({ type: 'success', message: 'Worklist item marked done' });
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to mark item done'
			});
		} finally {
			actionSaving = { ...actionSaving, [itemId]: false };
		}
	}

	function openSnooze(itemId: string) {
		snoozeExpanded = { ...snoozeExpanded, [itemId]: !snoozeExpanded[itemId] };
	}

	async function snooze(itemId: string, mode: '4h' | 'tomorrow' | 'next_week') {
		const now = new Date();
		let until = new Date(now);
		if (mode === '4h') {
			until = new Date(now.getTime() + 4 * 60 * 60 * 1000);
		} else if (mode === 'tomorrow') {
			until = new Date(now);
			until.setDate(until.getDate() + 1);
			until.setHours(9, 0, 0, 0);
		} else {
			until = new Date(now);
			until.setDate(until.getDate() + 7);
			until.setHours(9, 0, 0, 0);
		}

		actionSaving = { ...actionSaving, [itemId]: true };
		try {
			await persistWorklistAction(itemId, 'snoozed', until.toISOString());
			hiddenItemIds = { ...hiddenItemIds, [itemId]: true };
			selectedItemIds = { ...selectedItemIds, [itemId]: false };
			snoozeExpanded = { ...snoozeExpanded, [itemId]: false };
			pushUndoHistory({
				itemIds: [itemId],
				status: 'snoozed',
				label: 'Snoozed 1 item'
			});
			const label = mode === '4h' ? '4 hours' : mode === 'tomorrow' ? 'tomorrow' : 'next week';
			toastStore.add({ type: 'info', message: `Snoozed until ${label}` });
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to snooze item'
			});
		} finally {
			actionSaving = { ...actionSaving, [itemId]: false };
		}
	}

	function toggleNextStep(itemId: string) {
		nextStepExpanded = { ...nextStepExpanded, [itemId]: !nextStepExpanded[itemId] };
	}

	function toggleItemSelection(itemId: string) {
		selectedItemIds = { ...selectedItemIds, [itemId]: !selectedItemIds[itemId] };
	}

	function toggleSelectAllVisible() {
		const next = { ...selectedItemIds };
		const shouldSelect = !allVisibleSelected;
		for (const item of visibleItems) {
			next[item.id] = shouldSelect;
		}
		selectedItemIds = next;
	}

	function clearAllSelections() {
		selectedItemIds = {};
	}

	function getSnoozeUntil(mode: '4h' | 'tomorrow' | 'next_week') {
		const now = new Date();
		let until = new Date(now);
		if (mode === '4h') {
			until = new Date(now.getTime() + 4 * 60 * 60 * 1000);
		} else if (mode === 'tomorrow') {
			until.setDate(until.getDate() + 1);
			until.setHours(9, 0, 0, 0);
		} else {
			until.setDate(until.getDate() + 7);
			until.setHours(9, 0, 0, 0);
		}
		return until;
	}

	function getSelectedItems() {
		return visibleItems.filter((item) => selectedItemIds[item.id]);
	}

	async function bulkMarkDone() {
		const items = getSelectedItems();
		if (items.length === 0) return;
		bulkSaving = true;
		try {
			await Promise.all(items.map((item) => persistWorklistAction(item.id, 'done')));
			hiddenItemIds = {
				...hiddenItemIds,
				...Object.fromEntries(items.map((item) => [item.id, true]))
			};
			selectedItemIds = {
				...selectedItemIds,
				...Object.fromEntries(items.map((item) => [item.id, false]))
			};
			pushUndoHistory({
				itemIds: items.map((item) => item.id),
				status: 'done',
				label: `Marked ${items.length} item${items.length === 1 ? '' : 's'} done`
			});
			toastStore.add({ type: 'success', message: `Marked ${items.length} item(s) done` });
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Bulk action failed'
			});
		} finally {
			bulkSaving = false;
		}
	}

	async function bulkSnooze(mode: '4h' | 'tomorrow' | 'next_week') {
		const items = getSelectedItems();
		if (items.length === 0) return;
		bulkSaving = true;
		try {
			const until = getSnoozeUntil(mode).toISOString();
			await Promise.all(items.map((item) => persistWorklistAction(item.id, 'snoozed', until)));
			hiddenItemIds = {
				...hiddenItemIds,
				...Object.fromEntries(items.map((item) => [item.id, true]))
			};
			selectedItemIds = {
				...selectedItemIds,
				...Object.fromEntries(items.map((item) => [item.id, false]))
			};
			pushUndoHistory({
				itemIds: items.map((item) => item.id),
				status: 'snoozed',
				label: `Snoozed ${items.length} item${items.length === 1 ? '' : 's'}`
			});
			toastStore.add({ type: 'info', message: `Snoozed ${items.length} item(s)` });
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Bulk snooze failed'
			});
		} finally {
			bulkSaving = false;
		}
	}

	async function undoAction(actionId: string) {
		const target = undoHistory.find((a) => a.id === actionId);
		if (!target) return;
		bulkSaving = true;
		try {
			await Promise.all(target.itemIds.map((itemId) => persistWorklistAction(itemId, 'open')));
			hiddenItemIds = {
				...hiddenItemIds,
				...Object.fromEntries(target.itemIds.map((itemId) => [itemId, false]))
			};
			toastStore.add({ type: 'success', message: 'Last worklist action undone' });
			undoHistory = undoHistory.filter((a) => a.id !== actionId);
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to undo action'
			});
		} finally {
			bulkSaving = false;
		}
	}

	function getSelectedDealTargets() {
		const selected = getSelectedItems();
		const uniqueByOpportunity = new Map<number, PageData['items'][number]>();
		for (const item of selected) {
			if (!uniqueByOpportunity.has(item.opportunityId)) {
				uniqueByOpportunity.set(item.opportunityId, item);
			}
		}
		return [...uniqueByOpportunity.values()];
	}

	async function bulkSetNextStep() {
		const immediateNextStep = bulkNextStepTemplate.trim();
		if (!immediateNextStep) {
			toastStore.add({ type: 'error', message: 'Enter a next-step template first' });
			return;
		}
		const targets = getSelectedDealTargets();
		if (targets.length === 0) return;

		bulkNextStepSaving = true;
		try {
			await Promise.all(
				targets.map(async (item) => {
					const response = await fetch(`/api/opportunities/${item.opportunityId}/next-step`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ immediateNextStep })
					});
					const payload = await response.json().catch(() => ({}));
					if (!response.ok) {
						throw new Error(payload?.error || `Failed to update ${item.opportunityTitle}`);
					}
				})
			);

			const selectedIds = new Set(getSelectedItems().map((item) => item.id));
			const missingNextStepItems = visibleItems.filter(
				(item) => selectedIds.has(item.id) && item.type === 'missing_next_step'
			);
			if (missingNextStepItems.length > 0) {
				hiddenItemIds = {
					...hiddenItemIds,
					...Object.fromEntries(missingNextStepItems.map((item) => [item.id, true]))
				};
			}

			toastStore.add({
				type: 'success',
				message: `Updated next step on ${targets.length} deal${targets.length === 1 ? '' : 's'}`
			});
			bulkNextStepExpanded = false;
			bulkNextStepTemplate = '';
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Bulk next step update failed'
			});
		} finally {
			bulkNextStepSaving = false;
		}
	}

	async function saveNextStep(item: PageData['items'][number]) {
		const immediateNextStep = (nextStepDrafts[item.id] || '').trim();
		if (!immediateNextStep) {
			toastStore.add({ type: 'error', message: 'Please enter a next step' });
			return;
		}

		nextStepSaving = { ...nextStepSaving, [item.id]: true };
		try {
			const response = await fetch(`/api/opportunities/${item.opportunityId}/next-step`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ immediateNextStep })
			});

			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(payload?.error || 'Failed to update next step');
			}

			toastStore.add({ type: 'success', message: 'Next step updated' });
			nextStepExpanded = { ...nextStepExpanded, [item.id]: false };
			if (item.type === 'missing_next_step') {
				hiddenItemIds = { ...hiddenItemIds, [item.id]: true };
			}
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to update next step'
			});
		} finally {
			nextStepSaving = { ...nextStepSaving, [item.id]: false };
		}
	}

	function toggleOutcome(itemId: string) {
		outcomeExpanded = { ...outcomeExpanded, [itemId]: !outcomeExpanded[itemId] };
	}

	function getOutcomeDraft(itemId: string) {
		return outcomeDrafts[itemId] || { outcome: '', nextSteps: '' };
	}

	function setOutcomeDraft(itemId: string, patch: Partial<{ outcome: string; nextSteps: string }>) {
		outcomeDrafts = {
			...outcomeDrafts,
			[itemId]: {
				...getOutcomeDraft(itemId),
				...patch
			}
		};
	}

	async function saveMeetingOutcome(item: PageData['items'][number]) {
		if (!item.meetingId) {
			toastStore.add({ type: 'error', message: 'Missing meeting reference' });
			return;
		}
		const draft = getOutcomeDraft(item.id);
		const outcome = draft.outcome.trim();
		const nextSteps = draft.nextSteps.trim();
		if (!outcome || !nextSteps) {
			toastStore.add({ type: 'error', message: 'Outcome and next steps are required' });
			return;
		}

		outcomeSaving = { ...outcomeSaving, [item.id]: true };
		try {
			const response = await fetch(`/api/meetings/${item.meetingId}/outcome`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ outcome, nextSteps })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) {
				throw new Error(payload?.error || 'Failed to save meeting outcome');
			}

			await persistWorklistAction(item.id, 'done');
			hiddenItemIds = { ...hiddenItemIds, [item.id]: true };
			outcomeExpanded = { ...outcomeExpanded, [item.id]: false };
			toastStore.add({ type: 'success', message: 'Meeting outcome logged' });
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to save meeting outcome'
			});
		} finally {
			outcomeSaving = { ...outcomeSaving, [item.id]: false };
		}
	}

	function handleRepChange(event: Event) {
		const nextRepId = (event.currentTarget as HTMLSelectElement).value;
		selectedRepId = nextRepId;
		const params = new URLSearchParams(window.location.search);
		if (!nextRepId) {
			params.delete('rep');
		} else {
			params.set('rep', nextRepId);
		}
		const query = params.toString();
		goto(query ? `/worklist?${query}` : '/worklist');
	}

	function saveCurrentView() {
		const name = window.prompt('Saved worklist view name');
		if (!name?.trim()) return;
		savedViews = [
			{
				id: crypto.randomUUID(),
				name: name.trim(),
				filter,
				repId: data.viewMode === 'manager' ? selectedRepId : null
			},
			...savedViews
		].slice(0, 10);
		toastStore.add({ type: 'success', message: 'Worklist view saved' });
	}

	function applySavedView(view: SavedWorklistView) {
		filter = view.filter;
		if (data.viewMode === 'manager') {
			const repId = view.repId || selectedRepId;
			const params = new URLSearchParams(window.location.search);
			params.set('rep', repId);
			goto(`/worklist?${params.toString()}`);
		}
	}

	function deleteSavedView(id: string) {
		savedViews = savedViews.filter((v) => v.id !== id);
	}
</script>

<Header
	user={data.user}
	title="Worklist"
	subtitle={data.viewMode === 'manager' && data.selectedUser
		? `Prioritized actions for ${data.selectedUser.name}`
		: 'Prioritized actions to move deals forward today'}
	showSearch={false}
/>

<div class="p-6 space-y-6">
	{#if undoHistory.length > 0}
		<div class="rounded-xl border border-amber-200 bg-amber-50 p-4">
			<div class="mb-2">
				<p class="text-sm font-medium text-amber-900">Recent worklist actions (undo history)</p>
				<p class="text-xs text-amber-700">Last 5 Done/Snooze actions. Undo restores items and resets action status to open.</p>
			</div>
			<div class="space-y-2">
				{#each undoHistory as action}
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-amber-200 bg-white/70 px-3 py-2">
						<div class="text-sm text-amber-900">
							{action.label}
							<span class="ml-2 text-xs text-amber-700">
								{new Date(action.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</span>
						</div>
						<button
							type="button"
							class="inline-flex items-center rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60"
							disabled={bulkSaving}
							onclick={() => undoAction(action.id)}
						>
							Undo
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if data.viewMode === 'manager'}
		<div class="rounded-xl border border-gray-200 bg-white p-4">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 class="text-sm font-semibold text-gray-900">Manager View</h2>
					<p class="text-xs text-gray-500">Inspect a rep's execution queue and unresolved actions.</p>
				</div>
				<div class="flex items-center gap-2">
					<label for="rep-filter" class="text-xs font-medium text-gray-600">Rep</label>
					<select
						id="rep-filter"
						class="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
						value={selectedRepId}
						onchange={handleRepChange}
					>
						{#each data.availableUsers as rep}
							<option value={rep.id}>{rep.name} ({rep.role})</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-2 md:grid-cols-6 gap-2">
		<div class="col-span-2 md:col-span-6 flex flex-wrap items-center gap-2">
			<button
				type="button"
				class="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
				onclick={saveCurrentView}
			>
				Save current view
			</button>
			{#each savedViews as view}
				<div class="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50">
					<button
						type="button"
						class="px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-l-lg"
						onclick={() => applySavedView(view)}
					>
						{view.name}
					</button>
					<button
						type="button"
						class="px-2 py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-r-lg"
						onclick={() => deleteSavedView(view.id)}
						title="Delete saved view"
					>
						✕
					</button>
				</div>
			{/each}
		</div>

		<button type="button" class="rounded-lg border bg-white p-3 text-left hover:bg-gray-50" onclick={() => (filter = 'all')}>
			<div class="text-xs text-gray-500">All items</div>
			<div class="text-lg font-semibold text-gray-900">{data.summary.total}</div>
		</button>
		<button type="button" class="rounded-lg border bg-white p-3 text-left hover:bg-gray-50" onclick={() => (filter = 'today')}>
			<div class="text-xs text-gray-500">Today</div>
			<div class="text-lg font-semibold text-amber-600">{data.summary.today}</div>
		</button>
		<button type="button" class="rounded-lg border bg-white p-3 text-left hover:bg-gray-50" onclick={() => (filter = 'overdue')}>
			<div class="text-xs text-gray-500">Overdue</div>
			<div class="text-lg font-semibold text-red-600">{data.summary.overdue}</div>
		</button>
		<button type="button" class="rounded-lg border bg-white p-3 text-left hover:bg-gray-50" onclick={() => (filter = 'at_risk')}>
			<div class="text-xs text-gray-500">At risk deals</div>
			<div class="text-lg font-semibold text-red-600">{data.summary.atRisk}</div>
		</button>
		<button type="button" class="rounded-lg border bg-white p-3 text-left hover:bg-gray-50" onclick={() => (filter = 'missing_next_step')}>
			<div class="text-xs text-gray-500">Missing next step</div>
			<div class="text-lg font-semibold text-gray-900">{data.summary.missingNextStep}</div>
		</button>
		<button type="button" class="rounded-lg border bg-white p-3 text-left hover:bg-gray-50" onclick={() => (filter = 'meetings')}>
			<div class="text-xs text-gray-500">Meeting actions</div>
			<div class="text-lg font-semibold text-blue-600">{data.summary.meetings}</div>
		</button>
	</div>

	<div class="rounded-xl border border-gray-200 bg-white p-4">
		<div class="flex items-center justify-between gap-3 mb-3">
			<div>
				<h2 class="text-sm font-semibold text-gray-900">Execution Queue</h2>
				<p class="text-xs text-gray-500">
					{visibleItems.length} item{visibleItems.length === 1 ? '' : 's'} in current view
				</p>
			</div>
			{#if filter !== 'all'}
				<button type="button" class="text-xs font-medium text-indigo-600 hover:text-indigo-700" onclick={() => (filter = 'all')}>
					Clear filter
				</button>
			{/if}
		</div>

		{#if visibleItems.length > 0}
			<div class="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
				<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div class="flex items-center gap-3">
						<label class="inline-flex items-center gap-2 text-sm text-gray-700">
							<input
								type="checkbox"
								class="rounded border-gray-300"
								checked={allVisibleSelected}
								onchange={toggleSelectAllVisible}
							/>
							<span>Select all visible</span>
						</label>
						<span class="text-xs text-gray-500">
							{selectedVisibleCount} selected in view
							{#if selectedTotalCount !== selectedVisibleCount}
								• {selectedTotalCount} selected total (across filters)
							{/if}
						</span>
					</div>
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
							disabled={selectedTotalCount === 0}
							onclick={clearAllSelections}
						>
							Clear all selections
						</button>
						<button
							type="button"
							class="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
							disabled={selectedVisibleCount === 0}
							onclick={() => (bulkNextStepExpanded = !bulkNextStepExpanded)}
						>
							Bulk set next step
						</button>
						<button
							type="button"
							class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
							disabled={selectedVisibleCount === 0 || bulkSaving}
							onclick={bulkMarkDone}
						>
							Mark selected done
						</button>
						<button
							type="button"
							class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
							disabled={selectedVisibleCount === 0 || bulkSaving}
							onclick={() => bulkSnooze('4h')}
						>
							Snooze 4h
						</button>
						<button
							type="button"
							class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
							disabled={selectedVisibleCount === 0 || bulkSaving}
							onclick={() => bulkSnooze('tomorrow')}
						>
							Snooze tomorrow
						</button>
						<button
							type="button"
							class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
							disabled={selectedVisibleCount === 0 || bulkSaving}
							onclick={() => bulkSnooze('next_week')}
						>
							Snooze next week
						</button>
					</div>
				</div>

				{#if bulkNextStepExpanded}
					<div class="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
						<div class="flex flex-col gap-2 lg:flex-row lg:items-center">
							<input
								type="text"
								class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
								placeholder="Next-step template for selected deals"
								bind:value={bulkNextStepTemplate}
							/>
							<div class="flex flex-wrap gap-2">
								<button
									type="button"
									class="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
									disabled={selectedVisibleCount === 0 || bulkNextStepSaving}
									onclick={bulkSetNextStep}
								>
									{bulkNextStepSaving ? 'Applying...' : 'Apply to selected deals'}
								</button>
								<button
									type="button"
									class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
									onclick={() => (bulkNextStepExpanded = false)}
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#if visibleItems.length === 0}
			<div class="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
				No worklist items in this filter.
			</div>
		{:else}
			<div class="space-y-3">
				{#each visibleItems as item}
					<Card class="p-4">
						<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
							<div class="min-w-0">
								<div class="flex flex-wrap items-center gap-2 mb-2">
									<label class="inline-flex items-center" title="Select item">
										<input
											type="checkbox"
											class="rounded border-gray-300"
											checked={!!selectedItemIds[item.id]}
											onchange={() => toggleItemSelection(item.id)}
										/>
									</label>
									<Badge variant={priorityTone(item.priority)}>P{item.priority}</Badge>
									<Badge variant={bucketTone(item.bucket)}>{item.bucket.replace('_', ' ')}</Badge>
									{#if item.stageName}
										<Badge variant="gray">{item.stageName}</Badge>
									{/if}
								</div>
								<h3 class="text-sm font-semibold text-gray-900">{item.title}</h3>
								<p class="text-sm text-gray-600 mt-1">{item.reason}</p>
								<p class="text-xs text-gray-500 mt-2">
									{item.clientName || 'No client'} • {item.opportunityTitle}
									{#if item.dueAt} • Due {formatDateTime(item.dueAt)}{/if}
								</p>
								<p class="text-xs font-medium text-indigo-700 mt-1">Suggested: {item.suggestedAction}</p>
							</div>

							<div class="flex items-center gap-2 shrink-0">
								<button
									type="button"
									class="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
									disabled={actionSaving[item.id]}
									onclick={() => markDone(item.id)}
								>
									Done
								</button>
								<button
									type="button"
									class="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
									disabled={actionSaving[item.id]}
									onclick={() => openSnooze(item.id)}
								>
									Snooze
								</button>
								{#if item.type === 'meeting_outcome_missing' && item.meetingId}
									<button
										type="button"
										class="inline-flex items-center rounded-lg border border-blue-300 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
										onclick={() => toggleOutcome(item.id)}
									>
										Log outcome
									</button>
								{/if}
								<button
									type="button"
									class="inline-flex items-center rounded-lg border border-indigo-300 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
									onclick={() => toggleNextStep(item.id)}
								>
									Set next step
								</button>
								<a
									href={item.href}
									class="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
								>
									Open
								</a>
								<a
									href={`/opportunities/${item.opportunityId}`}
									class="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
								>
									Deal
								</a>
							</div>
						</div>
						{#if snoozeExpanded[item.id]}
							<div class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
								<div class="mb-2 text-xs font-medium text-gray-700">Snooze until</div>
								<div class="flex flex-wrap gap-2">
									<button type="button" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50" onclick={() => snooze(item.id, '4h')}>
										4 hours
									</button>
									<button type="button" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50" onclick={() => snooze(item.id, 'tomorrow')}>
										Tomorrow 9AM
									</button>
									<button type="button" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50" onclick={() => snooze(item.id, 'next_week')}>
										Next week
									</button>
									<button type="button" class="rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100" onclick={() => openSnooze(item.id)}>
										Cancel
									</button>
								</div>
							</div>
						{/if}
						{#if outcomeExpanded[item.id]}
							<div class="mt-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
								<div class="grid gap-2">
									<div>
										<label class="block text-xs font-medium text-gray-700 mb-1" for={`outcome-${item.id}`}>Outcome</label>
										<textarea
											id={`outcome-${item.id}`}
											rows="2"
											class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="Summarize what happened in the meeting"
											value={getOutcomeDraft(item.id).outcome}
											oninput={(e) => setOutcomeDraft(item.id, { outcome: (e.currentTarget as HTMLTextAreaElement).value })}
										></textarea>
									</div>
									<div>
										<label class="block text-xs font-medium text-gray-700 mb-1" for={`meeting-next-${item.id}`}>Next steps</label>
										<input
											id={`meeting-next-${item.id}`}
											type="text"
											class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="e.g. Send revised pricing and book technical deep dive"
											value={getOutcomeDraft(item.id).nextSteps}
											oninput={(e) => setOutcomeDraft(item.id, { nextSteps: (e.currentTarget as HTMLInputElement).value })}
										/>
									</div>
									<div class="flex flex-wrap gap-2">
										<button
											type="button"
											class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
											disabled={outcomeSaving[item.id]}
											onclick={() => saveMeetingOutcome(item)}
										>
											{outcomeSaving[item.id] ? 'Saving...' : 'Save outcome'}
										</button>
										<button
											type="button"
											class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
											onclick={() => toggleOutcome(item.id)}
										>
											Cancel
										</button>
									</div>
								</div>
							</div>
						{/if}
						{#if nextStepExpanded[item.id]}
							<div class="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
								<label class="block text-xs font-medium text-gray-700 mb-2" for={`next-step-${item.id}`}>
									Immediate next step
								</label>
								<div class="flex flex-col sm:flex-row gap-2">
									<input
										id={`next-step-${item.id}`}
										type="text"
										class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
										placeholder="e.g. Send revised proposal and confirm review meeting for Friday"
										value={nextStepDrafts[item.id] || ''}
										oninput={(e) =>
											(nextStepDrafts = {
												...nextStepDrafts,
												[item.id]: (e.currentTarget as HTMLInputElement).value
											})}
									/>
									<button
										type="button"
										class="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
										disabled={nextStepSaving[item.id]}
										onclick={() => saveNextStep(item)}
									>
										{nextStepSaving[item.id] ? 'Saving...' : 'Save'}
									</button>
									<button
										type="button"
										class="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
										onclick={() => toggleNextStep(item.id)}
									>
										Cancel
									</button>
								</div>
							</div>
						{/if}
					</Card>
				{/each}
			</div>
		{/if}
	</div>
</div>
