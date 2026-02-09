<script lang="ts">
	import { Badge, Button, Card, Input, Modal, Select } from '$lib/components/ui';
	import { Header } from '$lib/components/layout';
	import { formatCurrency } from '$lib/utils';
	import { addDays, format, isSameDay, isWithinInterval, startOfWeek } from 'date-fns';
	import { toastStore } from '$lib/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let search = $state('');
	let ownerFilter = $state('');
	let stageFilter = $state('');
	let statusFilter = $state('');
	let weekStart = $state(startOfWeek(new Date(), { weekStartsOn: 1 }));
	let selectedMeetingId = $state<number | null>(data.meetings[0]?.id ?? null);
	let showNewMeetingModal = $state(false);
	let formLoading = $state(false);
	let outcomeValue = $state('');
	let nextStepsValue = $state('');
	let outcomeSaving = $state(false);
	let showRescheduleModal = $state(false);
	let rescheduleMeetingId = $state<number | null>(null);
	let rescheduleDate = $state('');
	let rescheduleTime = $state('');
	let rescheduleSaving = $state(false);
	let showEditModal = $state(false);
	let editMeetingId = $state<number | null>(null);
	let editTitle = $state('');
	let editOpportunityId = $state('');
	let editDate = $state('');
	let editTime = $state('');
	let editDescription = $state('');
	let editDuration = $state('');
	let editSaving = $state(false);
	let showDeleteModal = $state(false);
	let deleteMeetingId = $state<number | null>(null);
	let deleteLoading = $state(false);

	type Meeting = PageData['meetings'][number];

	// Duration options in minutes
	const durationOptions = [
		{ value: '15', label: '15 minutes' },
		{ value: '30', label: '30 minutes' },
		{ value: '45', label: '45 minutes' },
		{ value: '60', label: '1 hour' },
		{ value: '90', label: '1.5 hours' },
		{ value: '120', label: '2 hours' }
	];

	function toDate(dateStr: string | null | undefined): Date | null {
		if (!dateStr) return null;
		const parsed = new Date(dateStr);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}

	function hasTime(dateStr: string | null | undefined): boolean {
		if (!dateStr) return false;
		return /\d{2}:\d{2}/.test(dateStr);
	}

	function meetingStatus(meeting: Meeting): 'planned' | 'overdue' | 'completed' | 'unscheduled' {
		if (meeting.completedAt) return 'completed';
		const scheduled = toDate(meeting.scheduledAt);
		if (!scheduled) return 'unscheduled';
		const today = new Date();
		const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		return scheduled < todayStart ? 'overdue' : 'planned';
	}

	function statusBadgeVariant(status: ReturnType<typeof meetingStatus>) {
		switch (status) {
			case 'completed':
				return 'green';
			case 'overdue':
				return 'yellow';
			case 'planned':
				return 'blue';
			default:
				return 'gray';
		}
	}

	const ownerOptions = $derived.by(() => {
		const owners = new Set<string>();
		for (const meeting of data.meetings) {
			if (meeting.owner?.name) owners.add(meeting.owner.name);
		}
		return Array.from(owners).sort().map((name) => ({ value: name, label: name }));
	});

	const stageOptions = $derived.by(() => {
		const stages = new Set<string>();
		for (const meeting of data.meetings) {
			if (meeting.stage?.name) stages.add(meeting.stage.name);
		}
		return Array.from(stages).sort().map((name) => ({ value: name, label: name }));
	});

	const statusOptions = [
		{ value: 'planned', label: 'Planned' },
		{ value: 'overdue', label: 'Overdue' },
		{ value: 'completed', label: 'Completed' }
	];

	const opportunityOptions = $derived.by(() =>
		data.opportunities.map((opportunity) => ({
			value: opportunity.id,
			label: `${opportunity.title}${opportunity.client?.name ? ` • ${opportunity.client.name}` : ''}`
		}))
	);

	const filteredMeetings = $derived.by(() => {
		const term = search.trim().toLowerCase();
		return data.meetings.filter((meeting) => {
			if (!meeting.scheduledAt) return false;

			if (ownerFilter && meeting.owner?.name !== ownerFilter) return false;
			if (stageFilter && meeting.stage?.name !== stageFilter) return false;
			if (statusFilter && meetingStatus(meeting) !== statusFilter) return false;

			if (!term) return true;
			const haystack = [
				meeting.title,
				meeting.description,
				meeting.opportunity?.title,
				meeting.client?.name,
				meeting.owner?.name
			]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();
			return haystack.includes(term);
		});
	});

	const weekDays = $derived.by(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)));

	const weekMeetings = $derived.by(() => {
		const start = weekStart;
		const end = addDays(weekStart, 6);
		return filteredMeetings
			.filter((meeting) => {
				const scheduled = toDate(meeting.scheduledAt);
				if (!scheduled) return false;
				return isWithinInterval(scheduled, { start, end });
			})
			.sort((a, b) => {
				const aTime = toDate(a.scheduledAt)?.getTime() ?? 0;
				const bTime = toDate(b.scheduledAt)?.getTime() ?? 0;
				return aTime - bTime;
			});
	});

	const selectedMeeting = $derived.by(() => {
		return (
			filteredMeetings.find((meeting) => meeting.id === selectedMeetingId) ??
			weekMeetings[0] ??
			null
		);
	});

	$effect(() => {
		if (!selectedMeeting) {
			outcomeValue = '';
			nextStepsValue = '';
			return;
		}
		outcomeValue = selectedMeeting.outcome ?? '';
		nextStepsValue = selectedMeeting.opportunity?.immediateNextStep ?? '';
	});

	const overdueCount = $derived.by(
		() => filteredMeetings.filter((meeting) => meetingStatus(meeting) === 'overdue').length
	);
	const noOutcomeCount = $derived.by(
		() => filteredMeetings.filter((meeting) => meeting.completedAt && !meeting.outcome).length
	);

	function meetingsForDay(day: Date): Meeting[] {
		return weekMeetings.filter((meeting) => {
			const scheduled = toDate(meeting.scheduledAt);
			return scheduled ? isSameDay(scheduled, day) : false;
		});
	}

	function moveWeek(offset: number) {
		weekStart = addDays(weekStart, offset * 7);
	}

	async function handleCreateMeeting(event: SubmitEvent) {
		event.preventDefault();
		formLoading = true;
		try {
			const form = event.currentTarget as HTMLFormElement;
			const formData = new FormData(form);

			const response = await fetch('/api/meetings', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to create meeting');
			}

			toastStore.add({ type: 'success', message: 'Meeting created successfully' });
			showNewMeetingModal = false;
			form.reset();
			window.location.reload();
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to create meeting'
			});
		} finally {
			formLoading = false;
		}
	}

	async function handleSaveOutcome() {
		if (!selectedMeeting) return;
		outcomeSaving = true;
		try {
			const response = await fetch(`/api/meetings/${selectedMeeting.id}/outcome`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					outcome: outcomeValue,
					nextSteps: nextStepsValue
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to save meeting outcome');
			}

			toastStore.add({ type: 'success', message: 'Outcome saved' });
			window.location.reload();
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to save meeting outcome'
			});
		} finally {
			outcomeSaving = false;
		}
	}

	function focusOutcome(meeting: Meeting) {
		selectedMeetingId = meeting.id;
		queueMicrotask(() => {
			document.getElementById('outcome-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	}

	function openReschedule(meeting: Meeting) {
		const scheduledAt = meeting.scheduledAt ?? '';
		const [datePart, timePart] = scheduledAt.split('T');
		rescheduleMeetingId = meeting.id;
		rescheduleDate = datePart ?? '';
		rescheduleTime = timePart ? timePart.slice(0, 5) : '';
		showRescheduleModal = true;
	}

	async function handleReschedule(event: SubmitEvent) {
		event.preventDefault();
		if (!rescheduleMeetingId) return;
		rescheduleSaving = true;
		try {
			const response = await fetch(`/api/meetings/${rescheduleMeetingId}/reschedule`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					scheduledDate: rescheduleDate,
					scheduledTime: rescheduleTime
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to reschedule meeting');
			}

			toastStore.add({ type: 'success', message: 'Meeting rescheduled' });
			showRescheduleModal = false;
			window.location.reload();
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to reschedule meeting'
			});
		} finally {
			rescheduleSaving = false;
		}
	}

	function openEdit(meeting: Meeting) {
		const scheduledAt = meeting.scheduledAt ?? '';
		const [datePart, timePart] = scheduledAt.split('T');
		selectedMeetingId = meeting.id;
		editMeetingId = meeting.id;
		editTitle = meeting.title ?? '';
		editOpportunityId = meeting.opportunity?.id ? String(meeting.opportunity.id) : '';
		editDate = datePart ?? '';
		editTime = timePart ? timePart.slice(0, 5) : '';
		editDescription = meeting.description ?? '';
		editDuration = meeting.duration ? String(meeting.duration) : '';
		showEditModal = true;
	}

	async function handleEditMeeting(event: SubmitEvent) {
		event.preventDefault();
		if (!editMeetingId) return;
		editSaving = true;
		try {
			const response = await fetch(`/api/meetings/${editMeetingId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: editTitle,
					opportunityId: editOpportunityId,
					scheduledDate: editDate,
					scheduledTime: editTime,
					description: editDescription,
					duration: editDuration ? parseInt(editDuration, 10) : null
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to update meeting');
			}

			toastStore.add({ type: 'success', message: 'Meeting updated' });
			showEditModal = false;
			window.location.reload();
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to update meeting'
			});
		} finally {
			editSaving = false;
		}
	}

	function openDelete(meeting: Meeting) {
		deleteMeetingId = meeting.id;
		showDeleteModal = true;
	}

	async function handleDeleteMeeting() {
		if (!deleteMeetingId) return;
		deleteLoading = true;
		try {
			const response = await fetch(`/api/meetings/${deleteMeetingId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to delete meeting');
			}

			toastStore.add({ type: 'success', message: 'Meeting deleted' });
			showDeleteModal = false;
			window.location.reload();
		} catch (error) {
			toastStore.add({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to delete meeting'
			});
		} finally {
			deleteLoading = false;
		}
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		// Don't trigger shortcuts when typing in inputs
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) {
			return;
		}

		switch (event.key) {
			case 'ArrowLeft':
				moveWeek(-1);
				break;
			case 'ArrowRight':
				moveWeek(1);
				break;
			case 'n':
				if (!event.ctrlKey && !event.metaKey) {
					event.preventDefault();
					showNewMeetingModal = true;
				}
				break;
			case 't':
				if (!event.ctrlKey && !event.metaKey) {
					event.preventDefault();
					weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
				}
				break;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Header
	user={data.user}
	title="Planned Meetings"
	subtitle="Week of {format(weekStart, 'MMM d, yyyy')}"
	bind:searchValue={search}
	searchPlaceholder="Search meetings..."
>
	{#snippet actions()}
		<Button variant="outline" size="sm" onclick={() => moveWeek(-1)} title="Previous week (←)">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</Button>
		<Button
			variant="ghost"
			size="sm"
			onclick={() => (weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }))}
			title="Go to today (t)"
		>
			Today
		</Button>
		<Button variant="outline" size="sm" onclick={() => moveWeek(1)} title="Next week (→)">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</Button>
		<Button size="sm" onclick={() => (showNewMeetingModal = true)} title="New meeting (n)">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Meeting
		</Button>
	{/snippet}
</Header>

<div class="p-4 space-y-4">
	{#if data.meetings.length === 0}
		<!-- Empty State -->
		<Card padding="lg">
			<div class="text-center py-12">
				<div class="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
					<svg class="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
				<h2 class="text-xl font-semibold text-gray-900 mb-2">No meetings scheduled</h2>
				<p class="text-gray-500 mb-6 max-w-md mx-auto">
					Start scheduling meetings with your clients to track progress on opportunities and move deals forward.
				</p>
				<div class="flex flex-col sm:flex-row items-center justify-center gap-3">
					<Button onclick={() => (showNewMeetingModal = true)}>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Schedule Your First Meeting
					</Button>
				</div>
				<p class="text-xs text-gray-400 mt-6">
					Tip: Press <kbd class="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">n</kbd> to quickly create a new meeting
				</p>
			</div>
		</Card>
	{:else}
		<!-- Filters -->
		<Card padding="sm">
			<div class="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-3 items-end">
				<div class="grid grid-cols-1 md:grid-cols-3 gap-2">
					<Select
						label="Owner"
						placeholder="All owners"
						options={ownerOptions}
						bind:value={ownerFilter}
					/>
					<Select
						label="Stage"
						placeholder="All stages"
						options={stageOptions}
						bind:value={stageFilter}
					/>
					<Select
						label="Status"
						placeholder="All statuses"
						options={statusOptions}
						bind:value={statusFilter}
					/>
				</div>
				<div class="flex items-center gap-2 lg:justify-end">
					<span class="px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs">
						Overdue {overdueCount}
					</span>
					<span class="px-2 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200 text-xs">
						No outcome {noOutcomeCount}
					</span>
					<button
						type="button"
						class="text-xs font-medium text-indigo-600 hover:text-indigo-700 ml-1"
						onclick={() => {
							search = '';
							ownerFilter = '';
							stageFilter = '';
							statusFilter = '';
						}}
					>
						Reset
					</button>
				</div>
			</div>
		</Card>

	<div class="grid grid-cols-1 xl:grid-cols-12 gap-4">
		<div class="xl:col-span-8 space-y-4">
			<!-- Timeline Week View -->
			<Card padding="sm">
				<div class="flex items-center justify-between mb-3">
					<div>
						<h2 class="text-sm font-semibold text-gray-900">Weekly Timeline</h2>
						<p class="text-xs text-gray-500">{weekMeetings.length} meetings this week</p>
					</div>
				</div>
				<div class="overflow-x-auto">
					<div class="min-w-[900px]">
						<!-- Day Headers -->
						<div class="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200 pb-2 mb-2">
							<div></div>
							{#each weekDays as day}
								{@const isToday = isSameDay(day, new Date())}
								<div class="text-center px-1">
									<p class="text-xs font-medium" class:text-indigo-600={isToday} class:text-gray-500={!isToday}>
										{format(day, 'EEE')}
									</p>
									<p
										class="text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center mx-auto"
										class:bg-indigo-600={isToday}
										class:text-white={isToday}
										class:text-gray-900={!isToday}
									>
										{format(day, 'd')}
									</p>
								</div>
							{/each}
						</div>

						<!-- Time Slots -->
						<div class="relative" style="height: 400px;">
							<!-- Hour lines -->
							{#each [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as hour}
								{@const top = ((hour - 8) / 10) * 100}
								<div class="absolute left-0 right-0 flex items-start" style="top: {top}%;">
									<span class="w-[60px] text-[10px] text-gray-400 -mt-2 pr-2 text-right">
										{hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
									</span>
									<div class="flex-1 border-t border-gray-100"></div>
								</div>
							{/each}

							<!-- Day columns with meetings -->
							<div class="grid grid-cols-[60px_repeat(7,1fr)] h-full">
								<div></div>
								{#each weekDays as day, dayIndex}
									<div class="relative border-l border-gray-100 first:border-l-0">
										{#each meetingsForDay(day) as meeting}
											{@const scheduled = toDate(meeting.scheduledAt)}
											{@const status = meetingStatus(meeting)}
											{@const meetingHour = scheduled ? scheduled.getHours() + scheduled.getMinutes() / 60 : 9}
											{@const topPercent = Math.max(0, Math.min(90, ((meetingHour - 8) / 10) * 100))}
											{@const duration = meeting.duration || 60}
											{@const heightPercent = Math.min(100 - topPercent, (duration / 60 / 10) * 100)}
											<button
												type="button"
												class="absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left overflow-hidden transition-all hover:shadow-md hover:z-10 border-l-2"
												class:bg-blue-50={status === 'planned'}
												class:border-l-blue-500={status === 'planned'}
												class:bg-yellow-50={status === 'overdue'}
												class:border-l-yellow-500={status === 'overdue'}
												class:bg-green-50={status === 'completed'}
												class:border-l-green-500={status === 'completed'}
												class:bg-gray-50={status === 'unscheduled'}
												class:border-l-gray-400={status === 'unscheduled'}
												class:ring-2={selectedMeetingId === meeting.id}
												class:ring-indigo-500={selectedMeetingId === meeting.id}
												style="top: {topPercent}%; height: {heightPercent}%; min-height: 32px;"
												onclick={() => (selectedMeetingId = meeting.id)}
											>
												<p class="text-[10px] font-medium text-gray-900 truncate">{meeting.title}</p>
												<p class="text-[9px] text-gray-500 truncate">
													{scheduled && hasTime(meeting.scheduledAt) ? format(scheduled, 'p') : 'All day'}
													{#if meeting.client?.name}
														• {meeting.client.name}
													{/if}
												</p>
											</button>
										{/each}
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</Card>

		<Card padding="sm">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-sm font-semibold text-gray-900">Agenda</h2>
				<p class="text-xs text-gray-500">{weekMeetings.length} meetings</p>
			</div>
			<div class="space-y-3">
				{#each weekDays as day}
					<div>
						<div class="flex items-center justify-between mb-2">
							<p class="text-xs font-semibold text-gray-700 uppercase tracking-wide">
								{format(day, 'EEEE, MMM d')}
							</p>
							<span class="text-xs text-gray-400">
								{meetingsForDay(day).length} scheduled
							</span>
						</div>
						<div class="space-y-2">
							{#if meetingsForDay(day).length === 0}
								<div class="border border-dashed border-gray-200 rounded-lg p-2 text-xs text-gray-400">
									No meetings planned.
								</div>
							{:else}
								{#each meetingsForDay(day) as meeting}
									{@const scheduled = toDate(meeting.scheduledAt)}
									<button
										type="button"
										class="w-full text-left border border-gray-200 rounded-lg px-3 py-2 hover:border-indigo-300 hover:shadow-sm transition-all"
										onclick={() => (selectedMeetingId = meeting.id)}
									>
										<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
											<div class="flex items-start gap-3">
												<div class="w-16 text-xs text-gray-500">
													{scheduled
														? hasTime(meeting.scheduledAt)
															? format(scheduled, 'p')
															: 'All day'
														: 'TBD'}
												</div>
												<div>
													<p class="text-sm font-semibold text-gray-900">
														{meeting.title}
													</p>
													<p class="text-xs text-gray-500">
														{meeting.client?.name ?? 'Unknown client'}
														• {meeting.opportunity?.title ?? 'Untitled opportunity'}
													</p>
													{#if meeting.owner?.name}
														<p class="text-[11px] text-gray-400">Owner: {meeting.owner.name}</p>
													{/if}
												</div>
											</div>
											<div class="flex flex-col items-start gap-2 md:items-end">
												<div class="flex items-center gap-2">
													{#if meeting.stage?.name}
														<Badge variant="indigo">{meeting.stage.name}</Badge>
													{/if}
													<Badge variant={statusBadgeVariant(meetingStatus(meeting))}>
														{meetingStatus(meeting)}
													</Badge>
												</div>
												<div class="flex items-center gap-2">
													<Button
														size="sm"
														variant="ghost"
														type="button"
														onclick={(event) => {
															event.stopPropagation();
															focusOutcome(meeting);
														}}
													>
														Complete
													</Button>
													<Button
														size="sm"
														variant="outline"
														type="button"
														onclick={(event) => {
															event.stopPropagation();
															openEdit(meeting);
														}}
													>
														Edit
													</Button>
													<Button
														size="sm"
														variant="outline"
														type="button"
														onclick={(event) => {
															event.stopPropagation();
															openReschedule(meeting);
														}}
													>
														Reschedule
													</Button>
													<Button
														size="sm"
														variant="ghost"
														type="button"
														class="text-red-600 hover:text-red-700 hover:bg-red-50"
														onclick={(event) => {
															event.stopPropagation();
															openDelete(meeting);
														}}
													>
														<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</Button>
												</div>
											</div>
										</div>
									</button>
								{/each}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</Card>
		</div>

		<div class="xl:col-span-4 space-y-4 xl:sticky xl:top-4 self-start">
			<Card padding="sm">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-sm font-semibold text-gray-900">Meeting Details</h2>
					{#if selectedMeeting}
						<Button size="sm" variant="outline" type="button" onclick={() => openEdit(selectedMeeting)}>
							Edit
						</Button>
					{/if}
				</div>
			{#if selectedMeeting}
				{@const selectedScheduled = toDate(selectedMeeting.scheduledAt)}
				<div class="space-y-3">
					<div>
						<p class="text-xs uppercase tracking-wide text-gray-400">Opportunity</p>
						<p class="text-sm font-semibold text-gray-900">
							{selectedMeeting.opportunity?.title ?? 'Untitled opportunity'}
						</p>
						<p class="text-xs text-gray-500">
							{selectedMeeting.client?.name ?? 'Unknown client'}
						</p>
					</div>
					<div class="grid grid-cols-2 gap-3 text-xs text-gray-500">
						<div>
							<p class="uppercase tracking-wide text-gray-400">Value</p>
							<p class="text-sm text-gray-900">
								{selectedMeeting.opportunity?.value
									? formatCurrency(selectedMeeting.opportunity.value)
									: '—'}
							</p>
						</div>
						<div>
							<p class="uppercase tracking-wide text-gray-400">Stage</p>
							<p class="text-sm text-gray-900">
								{selectedMeeting.stage?.name ?? '—'}
							</p>
						</div>
						<div>
							<p class="uppercase tracking-wide text-gray-400">Owner</p>
							<p class="text-sm text-gray-900">
								{selectedMeeting.owner?.name ?? '—'}
							</p>
						</div>
						<div>
							<p class="uppercase tracking-wide text-gray-400">Time</p>
							<p class="text-sm text-gray-900">
								{selectedScheduled ? format(selectedScheduled, 'MMM d, p') : 'TBD'}
							</p>
						</div>
					</div>
					{#if selectedMeeting.description}
						<p class="text-sm text-gray-600">{selectedMeeting.description}</p>
					{/if}
				</div>
			{:else}
				<p class="text-sm text-gray-500">Select a meeting to see details.</p>
			{/if}
		</Card>

			<Card padding="sm">
			<h2 id="outcome-panel" class="text-sm font-semibold text-gray-900 mb-4">Log outcome + next steps</h2>
			<div class="space-y-4">
				<Select
					label="Outcome"
					placeholder="Select outcome"
					options={[
						{ value: 'next_step_scheduled', label: 'Next step scheduled' },
						{ value: 'no_show', label: 'No show' },
						{ value: 'blocked', label: 'Blocked' },
						{ value: 'stage_update', label: 'Stage update' }
					]}
					bind:value={outcomeValue}
					disabled={!selectedMeeting}
				/>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1" for="next-steps">
						Next steps
					</label>
					<textarea
						id="next-steps"
						rows="4"
						class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
						placeholder="Capture next steps while it's fresh..."
						bind:value={nextStepsValue}
						disabled={!selectedMeeting}
					></textarea>
				</div>
				<Button
					variant="primary"
					onclick={handleSaveOutcome}
					loading={outcomeSaving}
					disabled={!selectedMeeting}
				>
					Save outcome
				</Button>
			</div>
		</Card>
		</div>
	</div>
	{/if}
</div>

<Modal open={showNewMeetingModal} onclose={() => (showNewMeetingModal = false)} title="New Meeting" size="lg">
	<form class="space-y-4" onsubmit={handleCreateMeeting}>
		<div class="grid grid-cols-1 gap-4">
			<Input label="Title" name="title" placeholder="Discovery call with client" required />
			<Select
				label="Opportunity"
				name="opportunityId"
				placeholder="Select opportunity"
				options={opportunityOptions}
				required
			/>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<Input label="Date" name="scheduledDate" type="date" required />
			<Input label="Time" name="scheduledTime" type="time" />
			<Select
				label="Duration"
				name="duration"
				placeholder="Select duration"
				options={durationOptions}
			/>
		</div>
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1" for="meeting-notes">Notes</label>
			<textarea
				id="meeting-notes"
				name="description"
				rows="4"
				class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				placeholder="Agenda, participants, or prep notes..."
			></textarea>
		</div>
		<div class="flex justify-end gap-2">
			<Button variant="ghost" type="button" onclick={() => (showNewMeetingModal = false)}>
				Cancel
			</Button>
			<Button variant="primary" type="submit" loading={formLoading}>
				Create meeting
			</Button>
		</div>
	</form>
</Modal>

<Modal open={showEditModal} onclose={() => (showEditModal = false)} title="Edit Meeting" size="lg">
	<form class="space-y-4" onsubmit={handleEditMeeting}>
		<div class="grid grid-cols-1 gap-4">
			<Input label="Title" bind:value={editTitle} required />
			<Select
				label="Opportunity"
				placeholder="Select opportunity"
				options={opportunityOptions}
				bind:value={editOpportunityId}
				required
			/>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<Input label="Date" type="date" bind:value={editDate} required />
			<Input label="Time" type="time" bind:value={editTime} />
			<Select
				label="Duration"
				placeholder="Select duration"
				options={durationOptions}
				bind:value={editDuration}
			/>
		</div>
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1" for="edit-meeting-notes">
				Notes
			</label>
			<textarea
				id="edit-meeting-notes"
				rows="4"
				class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
				placeholder="Agenda, participants, or prep notes..."
				bind:value={editDescription}
			></textarea>
		</div>
		<div class="flex justify-end gap-2">
			<Button variant="ghost" type="button" onclick={() => (showEditModal = false)}>
				Cancel
			</Button>
			<Button variant="primary" type="submit" loading={editSaving}>
				Save changes
			</Button>
		</div>
	</form>
</Modal>

<Modal
	open={showRescheduleModal}
	onclose={() => (showRescheduleModal = false)}
	title="Reschedule Meeting"
	size="md"
>
	<form class="space-y-4" onsubmit={handleReschedule}>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<Input label="New date" type="date" bind:value={rescheduleDate} required />
			<Input label="New time" type="time" bind:value={rescheduleTime} />
		</div>
		<div class="flex justify-end gap-2">
			<Button variant="ghost" type="button" onclick={() => (showRescheduleModal = false)}>
				Cancel
			</Button>
			<Button variant="primary" type="submit" loading={rescheduleSaving}>
				Reschedule
			</Button>
		</div>
	</form>
</Modal>

<Modal
	open={showDeleteModal}
	onclose={() => (showDeleteModal = false)}
	title="Delete Meeting"
	size="sm"
>
	<div class="space-y-4">
		<div class="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
			<div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
				<svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
			</div>
			<div>
				<p class="text-sm font-medium text-red-800">This action cannot be undone</p>
				<p class="text-sm text-red-600">The meeting will be permanently deleted.</p>
			</div>
		</div>
		<div class="flex justify-end gap-2">
			<Button variant="ghost" type="button" onclick={() => (showDeleteModal = false)}>
				Cancel
			</Button>
			<Button
				variant="primary"
				class="bg-red-600 hover:bg-red-700"
				onclick={handleDeleteMeeting}
				loading={deleteLoading}
			>
				Delete Meeting
			</Button>
		</div>
	</div>
</Modal>
