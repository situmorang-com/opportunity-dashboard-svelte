<script lang="ts">
	import { Button } from '$lib/components/ui';
</script>

<div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center">
	<div class="text-center px-4">
		<div class="mb-8">
			<div class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
				<svg class="w-12 h-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			<h1 class="text-5xl font-bold text-white mb-4">Fabric Sales CRM</h1>
			<p class="text-xl text-indigo-200 max-w-md mx-auto">
				Track and manage your Microsoft Fabric implementation opportunities with our powerful sales pipeline dashboard.
			</p>
		</div>

		<div class="flex justify-center">
			<a href="/login">
				<Button size="lg" class="shadow-lg">
					Sign In with Google
				</Button>
			</a>
		</div>

		<div class="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
			<div class="text-center">
				<div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
					</svg>
				</div>
				<h3 class="text-white font-semibold mb-1">Kanban Pipeline</h3>
				<p class="text-indigo-300 text-sm">Drag & drop deals through stages</p>
			</div>
			<div class="text-center">
				<div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
					</svg>
				</div>
				<h3 class="text-white font-semibold mb-1">Analytics</h3>
				<p class="text-indigo-300 text-sm">Real-time pipeline insights</p>
			</div>
			<div class="text-center">
				<div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-3">
					<svg class="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<h3 class="text-white font-semibold mb-1">Fabric Ready</h3>
				<p class="text-indigo-300 text-sm">Track workloads & capacity</p>
			</div>
		</div>
	</div>
</div>
