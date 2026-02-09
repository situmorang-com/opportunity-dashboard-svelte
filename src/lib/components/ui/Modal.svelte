<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	interface Props {
		open?: boolean;
		onclose?: () => void;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		class?: string;
		children?: Snippet;
	}

	let { open = false, onclose, title, size = 'md', class: className, children }: Props = $props();

	const sizes = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl'
	};

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && onclose) {
			onclose();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget && onclose) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center"
		role="dialog"
		aria-modal="true"
		onclick={handleBackdropClick}
		transition:fade={{ duration: 150 }}
	>
		<!-- Backdrop - pointer-events-none allows clicks to pass through to parent -->
		<div class="absolute inset-0 bg-black/50 pointer-events-none"></div>

		<!-- Modal content - restore pointer events -->
		<div
			class={cn(
				'relative w-full mx-4 bg-white rounded-xl shadow-xl pointer-events-auto',
				sizes[size],
				className
			)}
			transition:scale={{ duration: 150, start: 0.95 }}
		>
			{#if title}
				<div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
					<h2 class="text-lg font-semibold text-gray-900">{title}</h2>
					<button
						type="button"
						onclick={onclose}
						class="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
					>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/if}
			<div class="p-6">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
