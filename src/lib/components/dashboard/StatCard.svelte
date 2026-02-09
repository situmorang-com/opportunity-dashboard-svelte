<script lang="ts">
	import { Card } from '$lib/components/ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		value: string | number;
		subtitle?: string;
		trend?: {
			value: number;
			label: string;
		};
		icon?: Snippet;
		class?: string;
	}

	let { title, value, subtitle, trend, icon, class: className }: Props = $props();
</script>

<Card class={cn('', className)}>
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<p class="text-sm font-medium text-gray-500">{title}</p>
			<p class="mt-2 text-3xl font-bold text-gray-900">{value}</p>
			{#if subtitle}
				<p class="mt-1 text-sm text-gray-500">{subtitle}</p>
			{/if}
			{#if trend}
				<div class="mt-2 flex items-center gap-1">
					{#if trend.value > 0}
						<svg class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
						</svg>
						<span class="text-sm font-medium text-green-600">+{trend.value}%</span>
					{:else if trend.value < 0}
						<svg class="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
						</svg>
						<span class="text-sm font-medium text-red-600">{trend.value}%</span>
					{:else}
						<span class="text-sm font-medium text-gray-500">0%</span>
					{/if}
					<span class="text-sm text-gray-500">{trend.label}</span>
				</div>
			{/if}
		</div>
		{#if icon}
			<div class="p-3 bg-indigo-100 rounded-lg text-indigo-600">
				{@render icon()}
			</div>
		{/if}
	</div>
</Card>
