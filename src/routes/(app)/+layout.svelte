<script lang="ts">
	import { Sidebar } from '$lib/components/layout';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();
</script>

<div class="flex min-h-screen bg-gray-50">
	<Sidebar user={data.user} />
	<main class="flex-1 overflow-auto">
		{@render children()}
	</main>
</div>
