<script lang="ts">
	import '../app.css';
	import { Toast } from '$lib/components/ui';

	let { children } = $props();
</script>

<svelte:head>
	<title>Fabric Sales CRM</title>
	<meta name="description" content="Sales opportunity dashboard for Microsoft Fabric implementations" />
</svelte:head>

<Toast />

{@render children()}
