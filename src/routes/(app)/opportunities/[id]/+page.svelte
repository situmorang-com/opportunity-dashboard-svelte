<script lang="ts">
	import { Badge, Button, Card, Modal, Input, Select } from '$lib/components/ui';
	import { OpportunityForm } from '$lib/components/forms';
	import { format, formatDistanceToNow } from 'date-fns';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let showEditModal = $state(false);
	let showWonModal = $state(false);
	let showLostModal = $state(false);
	let isSubmitting = $state(false);

	// Destructure data reactively
	const opportunity = $derived(data.opportunity);
	const client = $derived(data.client);
	const stage = $derived(data.stage);
	const owner = $derived(data.owner);
	const activities = $derived(data.activities);
	const stages = $derived(data.stages);
	const clients = $derived(data.clients);
	const users = $derived(data.users);
	const contacts = $derived(data.contacts);

	// Calculated fields
	const expectedRevenue = $derived((opportunity.value || 0) * (opportunity.probability || 0) / 100);
	const licenseCost = $derived(opportunity.estimatedLicenseCost || 0);
	const servicesCost = $derived(opportunity.estimatedServicesCost || 0);
	const totalRevenue = $derived(licenseCost + servicesCost);
	const licensePercent = $derived(totalRevenue > 0 ? (licenseCost / totalRevenue) * 100 : 50);
	const circumference = 2 * Math.PI * 30;

	// Days to close calculation
	const daysToClose = $derived(() => {
		if (!opportunity.expectedCloseDate) return null;
		const closeDate = new Date(opportunity.expectedCloseDate);
		const today = new Date();
		return Math.ceil((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	});

	// Deal health calculation
	const dealHealth = $derived(() => {
		const prob = opportunity.probability || 0;
		const days = daysToClose();

		if (stage?.isWon) return { status: 'Won', color: 'green', bg: 'bg-green-500' };
		if (stage?.isLost) return { status: 'Lost', color: 'red', bg: 'bg-red-500' };
		if (prob >= 70 && days !== null && days > 0 && days <= 30)
			return { status: 'Excellent', color: 'green', bg: 'bg-green-500' };
		if (prob >= 50 && days !== null && days > 0)
			return { status: 'Good', color: 'blue', bg: 'bg-blue-500' };
		if (prob < 30 || (days !== null && days < 0))
			return { status: 'At Risk', color: 'red', bg: 'bg-red-500' };
		return { status: 'Fair', color: 'yellow', bg: 'bg-yellow-500' };
	});

	// Probability gauge color
	const probColor = $derived(() => {
		const prob = opportunity.probability || 0;
		if (prob >= 70) return '#22c55e';
		if (prob >= 40) return '#f59e0b';
		return '#ef4444';
	});

	// Format currency
	function formatCurrency(value: number | null | undefined): string {
		if (!value && value !== 0) return '-';
		if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
		if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
		return `$${value.toFixed(0)}`;
	}

	function formatCurrencyFull(value: number | null | undefined): string {
		if (!value && value !== 0) return '-';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	function formatDate(dateStr: string | null | undefined): string {
		if (!dateStr) return '-';
		try {
			return format(new Date(dateStr), 'MMM d, yyyy');
		} catch {
			return dateStr;
		}
	}

	function formatRelativeTime(date: Date | string | null | undefined): string {
		if (!date) return '';
		try {
			return formatDistanceToNow(new Date(date), { addSuffix: true });
		} catch {
			return '';
		}
	}

	// Activity type colors
	function getActivityColor(type: string): string {
		switch (type) {
			case 'call': return 'bg-blue-500';
			case 'meeting': return 'bg-green-500';
			case 'email': return 'bg-indigo-500';
			case 'demo': return 'bg-purple-500';
			case 'proposal': return 'bg-amber-500';
			case 'stage_change': return 'bg-pink-500';
			default: return 'bg-gray-500';
		}
	}

	async function handleEditSubmit(formData: FormData) {
		isSubmitting = true;
		try {
			const response = await fetch(`/api/opportunities/${opportunity.id}`, {
				method: 'PUT',
				body: formData
			});

			if (response.ok) {
				showEditModal = false;
				window.location.reload();
			} else {
				const error = await response.json();
				alert(error.message || 'Failed to update opportunity');
			}
		} catch (err) {
			console.error('Error updating opportunity:', err);
			alert('Failed to update opportunity');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleMarkWon(e: SubmitEvent) {
		e.preventDefault();
		isSubmitting = true;
		const formData = new FormData(e.target as HTMLFormElement);

		try {
			const response = await fetch(`/api/opportunities/${opportunity.id}/close`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'won',
					date: formData.get('wonDate')
				})
			});

			if (response.ok) {
				showWonModal = false;
				window.location.reload();
			} else {
				alert('Failed to mark as won');
			}
		} catch (err) {
			alert('Failed to mark as won');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleMarkLost(e: SubmitEvent) {
		e.preventDefault();
		isSubmitting = true;
		const formData = new FormData(e.target as HTMLFormElement);

		try {
			const response = await fetch(`/api/opportunities/${opportunity.id}/close`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'lost',
					date: formData.get('lostDate'),
					reason: formData.get('lostReason')
				})
			});

			if (response.ok) {
				showLostModal = false;
				window.location.reload();
			} else {
				alert('Failed to mark as lost');
			}
		} catch (err) {
			alert('Failed to mark as lost');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{opportunity.title} | Opportunity Details</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 -m-6 p-6">
	<!-- Won Banner -->
	{#if stage?.isWon}
		<div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
			<div class="flex items-center gap-4">
				<div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
					<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
					</svg>
				</div>
				<div>
					<h2 class="text-2xl font-bold">Deal Won!</h2>
					<p class="text-green-100">Closed on {formatDate(opportunity.wonDate)} • Final Value: {formatCurrencyFull(opportunity.value)}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Lost Banner -->
	{#if stage?.isLost}
		<div class="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
			<div class="flex items-center gap-4">
				<div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
					<svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div>
					<h2 class="text-2xl font-bold">Deal Lost</h2>
					<p class="text-red-100">Closed on {formatDate(opportunity.lostDate)}</p>
					{#if opportunity.lostReason}
						<p class="text-red-100">Reason: {opportunity.lostReason}</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Hero Section -->
	<div class="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 text-white shadow-xl mb-6">
		<!-- Top Row -->
		<div class="flex items-center justify-between mb-6">
			<button
				onclick={() => goto('/opportunities')}
				class="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors"
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Opportunities
			</button>
			<div class="flex items-center gap-2">
				<Button variant="secondary" onclick={() => (showEditModal = true)} class="bg-white/10 hover:bg-white/20 text-white border-0">
					<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
					Edit
				</Button>
				{#if !stage?.isWon && !stage?.isLost}
					<Button onclick={() => (showWonModal = true)} class="bg-green-500 hover:bg-green-600 border-0">
						<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Mark Won
					</Button>
					<Button onclick={() => (showLostModal = true)} class="bg-red-500 hover:bg-red-600 border-0">
						<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
						Mark Lost
					</Button>
				{/if}
			</div>
		</div>

		<!-- Title & Stage -->
		<div class="mb-6">
			<div class="flex items-center gap-4 mb-2">
				<h1 class="text-3xl font-bold">{opportunity.title}</h1>
				{#if stage}
					<span
						class="px-3 py-1 rounded-full text-sm font-medium"
						style="background-color: {stage.color}; color: white"
					>
						{stage.name}
					</span>
				{/if}
				<span class="px-3 py-1 rounded-full text-sm font-medium {dealHealth().bg}">
					{dealHealth().status}
				</span>
			</div>
			<p class="text-indigo-200">
				{client?.name || 'No client'} • Owner: {owner?.name || 'Unassigned'}
				{#if opportunity.leadSource}
					• Source: {opportunity.leadSource}
				{/if}
			</p>
		</div>

		<!-- Key Metrics -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			<!-- Deal Value -->
			<div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
				<div class="flex items-center justify-between mb-2">
					<span class="text-indigo-200 text-sm">Deal Value</span>
					<div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
				</div>
				<p class="text-2xl font-bold">{formatCurrency(opportunity.value)}</p>
			</div>

			<!-- Expected Revenue -->
			<div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
				<div class="flex items-center justify-between mb-2">
					<span class="text-indigo-200 text-sm">Expected Revenue</span>
					<div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
						</svg>
					</div>
				</div>
				<p class="text-2xl font-bold">{formatCurrency(expectedRevenue)}</p>
				<p class="text-xs text-indigo-300">Value × {opportunity.probability}%</p>
			</div>

			<!-- Probability Gauge -->
			<div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
				<div class="flex items-center justify-between mb-2">
					<span class="text-indigo-200 text-sm">Win Probability</span>
				</div>
				<div class="flex items-center gap-3">
					<!-- SVG Gauge -->
					<div class="relative w-14 h-14">
						<svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
							<circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="8" />
							<circle
								cx="50" cy="50" r="30" fill="none"
								stroke={probColor()}
								stroke-width="8"
								stroke-dasharray={circumference}
								stroke-dashoffset={circumference - ((opportunity.probability || 0) / 100) * circumference}
								stroke-linecap="round"
								class="transition-all duration-500"
							/>
						</svg>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-sm font-bold">{opportunity.probability}%</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Days to Close -->
			<div class="bg-white/10 backdrop-blur-sm rounded-xl p-4">
				<div class="flex items-center justify-between mb-2">
					<span class="text-indigo-200 text-sm">Days to Close</span>
					<div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
				</div>
				{#if daysToClose() !== null}
					{@const days = daysToClose()}
					<p class="text-2xl font-bold" class:text-red-300={(days ?? 0) < 0}>
						{(days ?? 0) < 0 ? 'Overdue' : days}
						{#if (days ?? 0) >= 0}
							<span class="text-lg font-normal">days</span>
						{/if}
					</p>
					<p class="text-xs text-indigo-300">{formatDate(opportunity.expectedCloseDate)}</p>
				{:else}
					<p class="text-2xl font-bold">-</p>
					<p class="text-xs text-indigo-300">No date set</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Stage Progress -->
	<Card class="mb-6">
		<h3 class="text-sm font-medium text-gray-500 mb-4">Deal Progress</h3>
		<div class="flex items-center">
			{#each stages as stageItem, i}
				<div class="flex-1 flex items-center">
					<div class="relative flex flex-col items-center">
						<div
							class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all {
								stageItem.id === stage?.id
									? 'ring-4 ring-indigo-200 text-white'
									: stageItem.order < (stage?.order || 0)
										? 'text-white'
										: 'bg-gray-200 text-gray-500'
							}"
							style={stageItem.id === stage?.id || stageItem.order < (stage?.order || 0)
								? `background-color: ${stageItem.color}`
								: ''}
						>
							{#if stageItem.order < (stage?.order || 0)}
								<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							{:else}
								{i + 1}
							{/if}
						</div>
						<span class="text-xs mt-2 text-center {stageItem.id === stage?.id ? 'text-indigo-600 font-medium' : 'text-gray-400'}">
							{stageItem.name}
						</span>
					</div>
					{#if i < stages.length - 1}
						<div
							class="flex-1 h-1 mx-2 rounded-full transition-all {
								stageItem.order < (stage?.order || 0) ? '' : 'bg-gray-200'
							}"
							style={stageItem.order < (stage?.order || 0) ? `background-color: ${stageItem.color}` : ''}
						></div>
					{/if}
				</div>
			{/each}
		</div>
	</Card>

	<!-- Next Steps Callout -->
	{#if opportunity.immediateNextStep && !stage?.isWon && !stage?.isLost}
		<div class="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 mb-6">
			<div class="flex items-start gap-4">
				<div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
					<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<div>
					<h3 class="font-semibold text-amber-800 mb-1">Immediate Next Step</h3>
					<p class="text-amber-700">{opportunity.immediateNextStep}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left Column -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Revenue Breakdown & Lead Info Row -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<!-- Revenue Breakdown -->
				{#if totalRevenue > 0}
					<Card>
						<h3 class="font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
						<div class="flex items-center gap-6">
							<div class="relative w-24 h-24">
								<svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
									<circle cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" stroke-width="10" />
									<circle cx="50" cy="50" r="35" fill="none" stroke="#3b82f6" stroke-width="10"
										stroke-dasharray="{(licensePercent / 100) * 2 * Math.PI * 35} {2 * Math.PI * 35}"
										stroke-linecap="round" />
									<circle cx="50" cy="50" r="35" fill="none" stroke="#ec4899" stroke-width="10"
										stroke-dasharray="{((100 - licensePercent) / 100) * 2 * Math.PI * 35} {2 * Math.PI * 35}"
										stroke-dashoffset="-{(licensePercent / 100) * 2 * Math.PI * 35}"
										stroke-linecap="round" />
								</svg>
								<div class="absolute inset-0 flex items-center justify-center">
									<span class="text-sm font-bold text-gray-900">{formatCurrency(totalRevenue)}</span>
								</div>
							</div>
							<div class="space-y-2">
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 rounded-full bg-blue-500"></div>
									<span class="text-sm text-gray-600">License</span>
									<span class="font-semibold text-gray-900">{formatCurrency(licenseCost)}</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 rounded-full bg-pink-500"></div>
									<span class="text-sm text-gray-600">Services</span>
									<span class="font-semibold text-gray-900">{formatCurrency(servicesCost)}</span>
								</div>
							</div>
						</div>
					</Card>
				{/if}

				<!-- Lead & Partner Info -->
				<Card>
					<h3 class="font-semibold text-gray-900 mb-4">Lead Information</h3>
					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="text-sm text-gray-500">Lead Source</span>
							<span class="text-sm font-medium text-gray-900">{opportunity.leadSource || '-'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-500">Partner PIC</span>
							<span class="text-sm font-medium text-gray-900">{opportunity.partnerPic || '-'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-500">Engagement Team</span>
							<span class="text-sm font-medium text-gray-900">{opportunity.engagementTeam || '-'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-500">Timeline</span>
							<span class="text-sm font-medium text-gray-900">{opportunity.timeline || '-'}</span>
						</div>
					</div>
				</Card>
			</div>

			<!-- Fabric Details -->
			<Card>
				<h3 class="font-semibold text-gray-900 mb-4">Microsoft Fabric Details</h3>
				{#if opportunity.fabricWorkloads && opportunity.fabricWorkloads.length > 0}
					<div class="mb-4">
						<p class="text-sm text-gray-500 mb-2">Workloads</p>
						<div class="flex flex-wrap gap-2">
							{#each opportunity.fabricWorkloads as workload}
								<span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
									{workload}
								</span>
							{/each}
						</div>
					</div>
				{/if}
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div class="bg-gray-50 rounded-xl p-3">
						<p class="text-xs text-gray-500">Capacity</p>
						<p class="font-semibold text-gray-900">{opportunity.capacityUnits ? `F${opportunity.capacityUnits}` : '-'}</p>
					</div>
					<div class="bg-gray-50 rounded-xl p-3">
						<p class="text-xs text-gray-500">Duration</p>
						<p class="font-semibold text-gray-900">{opportunity.projectDuration || '-'}</p>
					</div>
					<div class="bg-gray-50 rounded-xl p-3">
						<p class="text-xs text-gray-500">Migration From</p>
						<p class="font-semibold text-gray-900">{opportunity.migrationSource || '-'}</p>
					</div>
					<div class="bg-gray-50 rounded-xl p-3">
						<p class="text-xs text-gray-500">Competitor</p>
						<p class="font-semibold text-gray-900">{opportunity.competitor || '-'}</p>
					</div>
				</div>
			</Card>

			<!-- Objectives & Pain Points -->
			{#if opportunity.objectives || opportunity.keyPainPoints}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#if opportunity.objectives}
						<Card class="bg-blue-50 border-blue-100">
							<h3 class="font-semibold text-blue-900 mb-3 flex items-center gap-2">
								<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								Objectives
							</h3>
							<p class="text-sm text-blue-800 whitespace-pre-wrap">{opportunity.objectives}</p>
						</Card>
					{/if}
					{#if opportunity.keyPainPoints}
						<Card class="bg-red-50 border-red-100">
							<h3 class="font-semibold text-red-900 mb-3 flex items-center gap-2">
								<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
								Pain Points
							</h3>
							<p class="text-sm text-red-800 whitespace-pre-wrap">{opportunity.keyPainPoints}</p>
						</Card>
					{/if}
				</div>
			{/if}

			<!-- Initiatives & Roadblocks -->
			{#if opportunity.initiatives || opportunity.potentialRoadblocks}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#if opportunity.initiatives}
						<Card class="bg-green-50 border-green-100">
							<h3 class="font-semibold text-green-900 mb-3 flex items-center gap-2">
								<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
								</svg>
								Initiatives
							</h3>
							<p class="text-sm text-green-800 whitespace-pre-wrap">{opportunity.initiatives}</p>
						</Card>
					{/if}
					{#if opportunity.potentialRoadblocks}
						<Card class="bg-yellow-50 border-yellow-100">
							<h3 class="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
								<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								Roadblocks
							</h3>
							<p class="text-sm text-yellow-800 whitespace-pre-wrap">{opportunity.potentialRoadblocks}</p>
						</Card>
					{/if}
				</div>
			{/if}

			<!-- Engagement Summary -->
			{#if opportunity.engagementSummary}
				<Card>
					<h3 class="font-semibold text-gray-900 mb-3">Engagement Summary</h3>
					<div class="bg-indigo-50 rounded-xl p-4">
						<p class="text-sm text-indigo-900 whitespace-pre-wrap">{opportunity.engagementSummary}</p>
					</div>
				</Card>
			{/if}
		</div>

		<!-- Right Column -->
		<div class="space-y-6">
			<!-- Client Card -->
			{#if client}
				<Card>
					<h3 class="font-semibold text-gray-900 mb-4">Client</h3>
					<div class="flex items-center gap-3">
						<div class="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
							{client.name.charAt(0)}
						</div>
						<div>
							<p class="font-semibold text-gray-900">{client.name}</p>
							{#if client.industry}
								<Badge variant="gray">{client.industry}</Badge>
							{/if}
						</div>
					</div>

					<!-- Decision Maker -->
					{#if opportunity.authorityName}
						<div class="border-t border-gray-100 pt-3 mt-4">
							<p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Decision Maker</p>
							<div class="space-y-1.5 text-sm">
								<div class="flex items-center gap-2 text-gray-900 font-medium">
									<svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									<div>
										<div>{opportunity.authorityName}</div>
										{#if opportunity.authorityTitle}
											<div class="text-xs text-gray-500 font-normal">{opportunity.authorityTitle}</div>
										{/if}
									</div>
								</div>
								{#if opportunity.authorityEmail}
									<a href="mailto:{opportunity.authorityEmail}" class="flex items-center gap-2 text-indigo-600 hover:underline">
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
										{opportunity.authorityEmail}
									</a>
								{/if}
								{#if opportunity.authorityContact}
									<div class="flex items-center gap-2 text-gray-600">
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
										</svg>
										{opportunity.authorityContact}
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Champion / Key Liaison -->
					{#if opportunity.championName}
						<div class="border-t border-gray-100 pt-3 mt-3">
							<p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Champion / Key Liaison</p>
							<div class="space-y-1.5 text-sm">
								<div class="flex items-center gap-2 text-gray-900 font-medium">
									<svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									<div>
										<div>{opportunity.championName}</div>
										{#if opportunity.championTitle}
											<div class="text-xs text-gray-500 font-normal">{opportunity.championTitle}</div>
										{/if}
									</div>
								</div>
								{#if opportunity.championEmail}
									<a href="mailto:{opportunity.championEmail}" class="flex items-center gap-2 text-indigo-600 hover:underline">
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
										{opportunity.championEmail}
									</a>
								{/if}
								{#if opportunity.championContact}
									<div class="flex items-center gap-2 text-gray-600">
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
										</svg>
										{opportunity.championContact}
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</Card>
			{/if}

			<!-- Activity Timeline -->
			<Card>
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-semibold text-gray-900">Activity Timeline</h3>
					<span class="text-xs text-gray-500">{activities.length} activities</span>
				</div>

				{#if activities.length > 0}
					<div class="relative">
						<!-- Vertical line -->
						<div class="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

						<div class="space-y-4">
							{#each activities as { activity, user }}
								<div class="relative flex gap-4">
									<div class="relative z-10 w-10 h-10 rounded-full {getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0">
										<svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											{#if activity.type === 'call'}
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
											{:else if activity.type === 'meeting'}
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
											{:else if activity.type === 'email'}
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
											{:else if activity.type === 'demo'}
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
											{:else if activity.type === 'proposal'}
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											{:else}
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
											{/if}
										</svg>
									</div>
									<div class="flex-1 bg-gray-50 rounded-xl p-3 min-w-0">
										<div class="flex items-start justify-between gap-2">
											<h4 class="font-medium text-gray-900 text-sm">{activity.title}</h4>
											<span class="text-xs text-gray-400 flex-shrink-0">{formatRelativeTime(activity.createdAt)}</span>
										</div>
										{#if activity.description}
											<p class="text-xs text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
										{/if}
										<div class="flex flex-wrap gap-1 mt-2">
											{#if activity.completedAt}
												<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
													{formatDate(activity.completedAt)}
												</span>
											{:else if activity.scheduledAt}
												<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
													{formatDate(activity.scheduledAt)}
												</span>
											{/if}
											{#if activity.pic}
												<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
													{activity.pic}
												</span>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="text-center py-8 text-gray-400">
						<svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<p class="text-sm">No activities yet</p>
					</div>
				{/if}
			</Card>

			<!-- Documents -->
			{#if opportunity.documentsFolder}
				<Card>
					<h3 class="font-semibold text-gray-900 mb-3">Documents</h3>
					<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
						<div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
							<svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
							</svg>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 truncate">{opportunity.documentsFolder}</p>
							<p class="text-xs text-gray-500">Document folder</p>
						</div>
					</div>
				</Card>
			{/if}

			<!-- Timestamps -->
			<div class="text-xs text-gray-400 space-y-1">
				<p>Created: {formatDate(opportunity.createdAt?.toString())}</p>
				<p>Updated: {formatDate(opportunity.updatedAt?.toString())}</p>
			</div>
		</div>
	</div>
</div>

<!-- Edit Modal -->
<Modal title="Edit Opportunity" open={showEditModal} onclose={() => (showEditModal = false)} size="xl">
	<OpportunityForm
		{opportunity}
		{stages}
		{clients}
		{users}
		{contacts}
		onsubmit={handleEditSubmit}
		oncancel={() => (showEditModal = false)}
		loading={isSubmitting}
	/>
</Modal>

<!-- Mark Won Modal -->
<Modal title="Mark as Won" open={showWonModal} onclose={() => (showWonModal = false)} size="sm">
	<form onsubmit={handleMarkWon} class="space-y-4">
		<div class="bg-green-50 rounded-xl p-4 text-center">
			<div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
				<svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
				</svg>
			</div>
			<h3 class="font-semibold text-green-800">Congratulations!</h3>
			<p class="text-sm text-green-600">You're about to mark this deal as won.</p>
		</div>

		<Input type="date" label="Won Date" name="wonDate" value={new Date().toISOString().split('T')[0]} required />

		<div class="flex gap-3">
			<Button type="button" variant="secondary" onclick={() => (showWonModal = false)} class="flex-1">
				Cancel
			</Button>
			<Button type="submit" class="flex-1 bg-green-600 hover:bg-green-700" loading={isSubmitting}>
				Confirm Won
			</Button>
		</div>
	</form>
</Modal>

<!-- Mark Lost Modal -->
<Modal title="Mark as Lost" open={showLostModal} onclose={() => (showLostModal = false)} size="sm">
	<form onsubmit={handleMarkLost} class="space-y-4">
		<Input type="date" label="Lost Date" name="lostDate" value={new Date().toISOString().split('T')[0]} required />

		<Select
			label="Lost Reason"
			name="lostReason"
			options={[
				{ value: '', label: 'Select reason...' },
				{ value: 'Price/Budget', label: 'Price/Budget' },
				{ value: 'Lost to Competitor', label: 'Lost to Competitor' },
				{ value: 'No Decision/Delayed', label: 'No Decision/Delayed' },
				{ value: 'Requirements Not Met', label: 'Requirements Not Met' },
				{ value: 'Relationship/Trust', label: 'Relationship/Trust' },
				{ value: 'Other', label: 'Other' }
			]}
			required
		/>

		<div class="flex gap-3">
			<Button type="button" variant="secondary" onclick={() => (showLostModal = false)} class="flex-1">
				Cancel
			</Button>
			<Button type="submit" variant="danger" class="flex-1" loading={isSubmitting}>
				Confirm Lost
			</Button>
		</div>
	</form>
</Modal>
