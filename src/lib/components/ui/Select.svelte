<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLSelectAttributes, 'value'> {
		label?: string;
		error?: string;
		options: Array<{ value: string | number; label: string }>;
		placeholder?: string;
		class?: string;
		value?: string | number | null;
	}

	let { label, error, options, placeholder, class: className, id, value = $bindable(''), name, ...rest }: Props = $props();

	// Normalize to string for consistent comparison
	function normalize(v: string | number | null | undefined): string {
		if (v == null) return '';
		return String(v);
	}

	const currentValue = $derived(normalize(value));
</script>

<div class="w-full">
	{#if label}
		<label for={id} class="block text-sm font-medium text-gray-700 mb-1">
			{label}
		</label>
	{/if}
	{#key currentValue}
		<select
			{id}
			{name}
			bind:value
			class={cn(
				'w-full border rounded-lg px-3 py-2 text-sm bg-white',
				'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
				error ? 'border-red-500' : 'border-gray-300',
				className
			)}
			{...rest}
		>
			{#if placeholder}
				<option value="" disabled selected={currentValue === ''}>{placeholder}</option>
			{/if}
			{#each options as option}
				<option
					value={option.value}
					selected={currentValue === normalize(option.value)}
				>
					{option.label}
				</option>
			{/each}
		</select>
	{/key}
	{#if error}
		<p class="mt-1 text-sm text-red-500">{error}</p>
	{/if}
</div>
