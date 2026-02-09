<script lang="ts">
	import { cn, getInitials } from '$lib/utils';

	interface Props {
		name: string;
		src?: string | null;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { name, src, size = 'md', class: className }: Props = $props();

	let imageError = $state(false);

	const sizes = {
		sm: 'w-8 h-8 text-xs',
		md: 'w-10 h-10 text-sm',
		lg: 'w-12 h-12 text-base'
	};

	// Reset error state when src changes
	$effect(() => {
		if (src) {
			imageError = false;
		}
	});
</script>

{#if src && !imageError}
	<img
		{src}
		alt={name}
		referrerpolicy="no-referrer"
		crossorigin="anonymous"
		class={cn('rounded-full object-cover', sizes[size], className)}
		onerror={() => (imageError = true)}
	/>
{:else}
	<div
		class={cn(
			'rounded-full bg-indigo-100 text-indigo-700 font-medium flex items-center justify-center',
			sizes[size],
			className
		)}
	>
		{getInitials(name)}
	</div>
{/if}
