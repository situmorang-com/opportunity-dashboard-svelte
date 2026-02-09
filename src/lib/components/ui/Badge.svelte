<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Variant = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';

	interface Props {
		variant?: Variant;
		class?: string;
		children?: Snippet;
	}

	let { variant = 'gray', class: className, children }: Props = $props();

	const variants: Record<Variant, string> = {
		gray: 'bg-gray-100 text-gray-800',
		blue: 'bg-blue-100 text-blue-800',
		green: 'bg-green-100 text-green-800',
		yellow: 'bg-yellow-100 text-yellow-800',
		red: 'bg-red-100 text-red-800',
		purple: 'bg-purple-100 text-purple-800',
		indigo: 'bg-indigo-100 text-indigo-800'
	};
</script>

<span
	class={cn(
		'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
		variants[variant],
		className
	)}
>
	{@render children?.()}
</span>
