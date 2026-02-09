<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		children?: Snippet;
		padding?: 'none' | 'sm' | 'md' | 'lg';
	}

	let { class: className, children, padding = 'md' }: Props = $props();

	const paddings = {
		none: '',
		sm: 'p-4',
		md: 'p-6',
		lg: 'p-8'
	};
</script>

<div class={cn('bg-white rounded-xl shadow-sm border border-gray-200', paddings[padding], className)}>
	{@render children?.()}
</div>
