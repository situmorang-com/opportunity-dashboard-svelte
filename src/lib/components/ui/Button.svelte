<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends HTMLButtonAttributes {
		variant?: Variant;
		size?: Size;
		loading?: boolean;
		class?: string;
	}

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		class: className,
		disabled,
		children,
		...rest
	}: Props = $props();

	const variants: Record<Variant, string> = {
		primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
		secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
		ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
		outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-indigo-500'
	};

	const sizes: Record<Size, string> = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base'
	};
</script>

<button
	class={cn(
		'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
		'focus:outline-none focus:ring-2 focus:ring-offset-2',
		'disabled:opacity-50 disabled:cursor-not-allowed',
		variants[variant],
		sizes[size],
		className
	)}
	disabled={disabled || loading}
	{...rest}
>
	{#if loading}
		<svg
			class="animate-spin h-4 w-4"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			/>
		</svg>
	{/if}
	{@render children?.()}
</button>
