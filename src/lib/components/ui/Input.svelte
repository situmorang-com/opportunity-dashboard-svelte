<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		label?: string;
		error?: string;
		class?: string;
		value?: string | number | null;
	}

	let { label, error, class: className, id, value = $bindable(''), ...rest }: Props = $props();
</script>

<div class="w-full">
	{#if label}
		<label for={id} class="block text-sm font-medium text-gray-700 mb-1">
			{label}
		</label>
	{/if}
	<input
		{id}
		bind:value
		class={cn(
			'w-full border rounded-lg px-3 py-2 text-sm',
			'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
			'placeholder:text-gray-400',
			error ? 'border-red-500' : 'border-gray-300',
			className
		)}
		{...rest}
	/>
	{#if error}
		<p class="mt-1 text-sm text-red-500">{error}</p>
	{/if}
</div>
