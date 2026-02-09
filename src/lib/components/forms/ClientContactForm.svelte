<script lang="ts">
	import { Button, Input, Select } from '$lib/components/ui';
	import type { ClientContact } from '$lib/server/db/schema';

	interface Props {
		contact?: ClientContact | null;
		onsubmit: (data: {
			name: string;
			title: string;
			email: string;
			phone: string;
			role: string;
			isPrimary: boolean;
			notes: string;
		}) => Promise<void>;
		oncancel: () => void;
		loading?: boolean;
	}

	let { contact, onsubmit, oncancel, loading = false }: Props = $props();

	// Form state
	let name = $state(contact?.name || '');
	let title = $state(contact?.title || '');
	let email = $state(contact?.email || '');
	let phone = $state(contact?.phone || '');
	let role = $state(contact?.role || 'other');
	let isPrimary = $state(contact?.isPrimary || false);
	let notes = $state(contact?.notes || '');

	const roleOptions = [
		{ value: 'decision_maker', label: 'Decision Maker' },
		{ value: 'champion', label: 'Champion' },
		{ value: 'technical', label: 'Technical Contact' },
		{ value: 'influencer', label: 'Influencer' },
		{ value: 'other', label: 'Other' }
	];

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		await onsubmit({
			name,
			title,
			email,
			phone,
			role,
			isPrimary,
			notes
		});
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<!-- Name & Title -->
	<div class="grid grid-cols-2 gap-4">
		<Input
			label="Name"
			placeholder="e.g., John Smith"
			bind:value={name}
			required
		/>

		<Input
			label="Title"
			placeholder="e.g., Chief Information Officer"
			bind:value={title}
		/>
	</div>

	<!-- Email & Phone -->
	<div class="grid grid-cols-2 gap-4">
		<Input
			label="Email"
			type="email"
			placeholder="john@company.com"
			bind:value={email}
		/>

		<Input
			label="Phone"
			type="tel"
			placeholder="+62 21 5306711"
			bind:value={phone}
		/>
	</div>

	<!-- Role & Primary -->
	<div class="grid grid-cols-2 gap-4">
		<Select
			label="Role"
			options={roleOptions}
			bind:value={role}
		/>

		<div class="flex items-end pb-2">
			<label class="flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={isPrimary}
					class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
				/>
				<span class="text-sm text-gray-700">Primary Contact</span>
			</label>
		</div>
	</div>

	<!-- Notes -->
	<div>
		<label for="contact-notes" class="block text-sm font-medium text-gray-700 mb-1">
			Notes
		</label>
		<textarea
			id="contact-notes"
			rows="2"
			class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
			placeholder="Additional notes about this contact..."
			bind:value={notes}
		></textarea>
	</div>

	<!-- Actions -->
	<div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
		<Button type="button" variant="secondary" onclick={oncancel}>
			Cancel
		</Button>
		<Button type="submit" {loading}>
			{contact ? 'Update Contact' : 'Add Contact'}
		</Button>
	</div>
</form>
