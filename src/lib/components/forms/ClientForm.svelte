<script lang="ts">
	import { Button, Input, Select } from '$lib/components/ui';
	import { INDUSTRIES } from '$lib/constants';
	import type { Client } from '$lib/server/db/schema';

	interface Props {
		client?: Client | null;
		onsubmit: (data: FormData) => Promise<void>;
		oncancel: () => void;
		loading?: boolean;
	}

	let { client, onsubmit, oncancel, loading = false }: Props = $props();

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		await onsubmit(formData);
	}
</script>

<form onsubmit={handleSubmit} class="space-y-6">
	<!-- Basic Info -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Company Information</h3>

		<Input
			name="name"
			label="Company Name"
			placeholder="e.g., Contoso Ltd"
			value={client?.name || ''}
			required
		/>

		<div class="grid grid-cols-2 gap-4">
			<Select
				name="industry"
				label="Industry"
				options={[
					{ value: '', label: 'Select industry' },
					...INDUSTRIES.map((i) => ({ value: i, label: i }))
				]}
				value={client?.industry || ''}
			/>

			<Select
				name="size"
				label="Company Size"
				options={[
					{ value: '', label: 'Select size' },
					{ value: 'smb', label: 'SMB (< 100 employees)' },
					{ value: 'mid-market', label: 'Mid-Market (100-1000)' },
					{ value: 'enterprise', label: 'Enterprise (1000+)' }
				]}
				value={client?.size || ''}
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<Input
				name="region"
				label="Region"
				placeholder="e.g., North America"
				value={client?.region || ''}
			/>

			<Input
				name="website"
				label="Website"
				type="url"
				placeholder="https://example.com"
				value={client?.website || ''}
			/>
		</div>
	</div>

	<!-- Contact Info -->
	<div class="space-y-4">
		<h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider">Primary Contact</h3>

		<div class="grid grid-cols-2 gap-4">
			<Input
				name="primaryContact"
				label="Contact Name"
				placeholder="John Doe"
				value={client?.primaryContact || ''}
			/>

			<Input
				name="contactEmail"
				label="Email"
				type="email"
				placeholder="john@example.com"
				value={client?.contactEmail || ''}
			/>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<Input
				name="contactPhone"
				label="Phone"
				type="tel"
				placeholder="+1 (555) 123-4567"
				value={client?.contactPhone || ''}
			/>

			<Input
				name="address"
				label="Address"
				placeholder="123 Main St, City, Country"
				value={client?.address || ''}
			/>
		</div>
	</div>

	<!-- Notes -->
	<div>
		<label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
			Notes
		</label>
		<textarea
			id="notes"
			name="notes"
			rows="3"
			class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
			placeholder="Additional notes about the client..."
		>{client?.notes || ''}</textarea>
	</div>

	<!-- Actions -->
	<div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
		<Button type="button" variant="secondary" onclick={oncancel}>
			Cancel
		</Button>
		<Button type="submit" {loading}>
			{client ? 'Update Client' : 'Create Client'}
		</Button>
	</div>
</form>
