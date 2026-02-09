<script lang="ts">
	import { Button, Input, Select } from '$lib/components/ui';

	interface ActivityData {
		id?: number;
		type: string;
		title: string;
		description?: string | null;
		outcome?: string | null;
		activityDate: string;
		duration?: number | null;
	}

	interface Props {
		activity?: ActivityData | null;
		onsubmit: (data: {
			type: string;
			title: string;
			description: string;
			outcome: string;
			activityDate: string;
			duration: number | null;
		}) => Promise<void>;
		oncancel: () => void;
		loading?: boolean;
	}

	let { activity = null, onsubmit, oncancel, loading = false }: Props = $props();

	// Form state - initialize from activity if editing
	let type = $state(activity?.type || 'call');
	let title = $state(activity?.title || '');
	let description = $state(activity?.description || '');
	let outcome = $state(activity?.outcome || '');
	let activityDate = $state(activity?.activityDate || new Date().toISOString().split('T')[0]);
	let duration = $state<string>(activity?.duration?.toString() || '');

	const isEditing = $derived(!!activity?.id);

	const activityTypes = [
		{ value: 'call', label: 'Phone Call' },
		{ value: 'email', label: 'Email' },
		{ value: 'meeting', label: 'Meeting' },
		{ value: 'note', label: 'Note' },
		{ value: 'linkedin', label: 'LinkedIn' },
		{ value: 'whatsapp', label: 'WhatsApp' }
	];

	const durationOptions = [
		{ value: '', label: 'Select duration' },
		{ value: '5', label: '5 minutes' },
		{ value: '15', label: '15 minutes' },
		{ value: '30', label: '30 minutes' },
		{ value: '45', label: '45 minutes' },
		{ value: '60', label: '1 hour' },
		{ value: '90', label: '1.5 hours' },
		{ value: '120', label: '2 hours' }
	];

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		await onsubmit({
			type,
			title,
			description,
			outcome,
			activityDate,
			duration: duration ? parseInt(duration) : null
		});
	}

	function getTypeIcon(t: string): string {
		switch (t) {
			case 'call':
				return 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';
			case 'email':
				return 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
			case 'meeting':
				return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
			case 'note':
				return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
			case 'linkedin':
				return 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z';
			case 'whatsapp':
				return 'M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.07-1.36C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.74 0-3.36-.56-4.68-1.5l-.32-.2-3.36.9.9-3.36-.2-.32A7.95 7.95 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z';
			default:
				return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<!-- Activity Type Selection -->
	<div>
		<label class="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
		<div class="grid grid-cols-3 gap-2">
			{#each activityTypes as actType}
				<button
					type="button"
					onclick={() => (type = actType.value)}
					class="flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors {type === actType.value
						? 'border-indigo-500 bg-indigo-50 text-indigo-700'
						: 'border-gray-200 hover:border-gray-300 text-gray-600'}"
				>
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getTypeIcon(actType.value)} />
					</svg>
					<span class="text-xs font-medium">{actType.label}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Title -->
	<Input
		name="title"
		label="Title"
		placeholder="e.g., Discussed pricing options"
		bind:value={title}
		required
	/>

	<!-- Date and Duration -->
	<div class="grid grid-cols-2 gap-4">
		<Input
			name="activityDate"
			label="Date"
			type="date"
			bind:value={activityDate}
			required
		/>

		<Select
			name="duration"
			label="Duration"
			options={durationOptions}
			bind:value={duration}
		/>
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
			placeholder="What was discussed? Any important notes..."
			bind:value={description}
		></textarea>
	</div>

	<!-- Outcome -->
	<div>
		<label for="outcome" class="block text-sm font-medium text-gray-700 mb-1">
			Outcome
		</label>
		<textarea
			id="outcome"
			name="outcome"
			rows="2"
			class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
			placeholder="e.g., Positive - will schedule demo next week"
			bind:value={outcome}
		></textarea>
	</div>

	<!-- Actions -->
	<div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
		<Button type="button" variant="secondary" onclick={oncancel}>
			Cancel
		</Button>
		<Button type="submit" {loading}>
			{isEditing ? 'Update Activity' : 'Log Activity'}
		</Button>
	</div>
</form>
