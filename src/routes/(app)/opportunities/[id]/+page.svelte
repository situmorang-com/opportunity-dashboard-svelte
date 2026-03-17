<script lang="ts">
	import { Badge, Button, Card, Modal, Input, Select } from '$lib/components/ui';
	import { OpportunityForm } from '$lib/components/forms';
	import { format, formatDistanceToNow } from 'date-fns';
	import { goto } from '$app/navigation';
	import { calculateFabricQualificationScore } from '$lib/utils/fabric-qualification';
	import { getCompetitorCard } from '$lib/data/competitor-cards';
	import { toastStore } from '$lib/stores';

	let { data } = $props();

	let showEditModal = $state(false);
	let showWonModal = $state(false);
	let showLostModal = $state(false);
	let isSubmitting = $state(false);
	let quickSaving = $state(false);
	let quickNextStep = $state('');
	let quickExpectedCloseDate = $state('');
	let quickProbability = $state('');

	// New feature states
	let showBattleCard = $state(false);
	let showAiCoach = $state(false);
	let aiCoachData = $state<any>(null);
	let aiCoachLoading = $state(false);
	let aiCoachError = $state('');
	let aiCoachTab = $state('risks');

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
	const fabricQualification = $derived(
		calculateFabricQualificationScore({
			fabricWorkloads: opportunity.fabricWorkloads,
			migrationSource: opportunity.migrationSource,
			capacityUnits: opportunity.capacityUnits,
			authorityName: opportunity.authorityName,
			championName: opportunity.championName,
			timeline: opportunity.timeline,
			immediateNextStep: opportunity.immediateNextStep,
			competitor: opportunity.competitor,
			value: opportunity.value,
			leadSource: opportunity.leadSource,
			coSellStatus: opportunity.coSellStatus
		})
	);

	$effect(() => {
		quickNextStep = opportunity.immediateNextStep || '';
		quickExpectedCloseDate = opportunity.expectedCloseDate || '';
		quickProbability = String(opportunity.probability ?? 0);
	});

	// Competitor battle card
	const competitorCard = $derived(getCompetitorCard(opportunity.competitor || ''));

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

	async function saveQuickUpdate(payload: Record<string, string | number | null>) {
		quickSaving = true;
		try {
			const response = await fetch(`/api/opportunities/${opportunity.id}/quick-update`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const err = await response.json().catch(() => ({}));
				throw new Error(err?.error || 'Failed to update opportunity');
			}

			window.location.reload();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to update opportunity');
		} finally {
			quickSaving = false;
		}
	}

	async function analyzeWithAI() {
		aiCoachLoading = true;
		aiCoachError = '';
		try {
			const res = await fetch(`/api/opportunities/${opportunity.id}/ai-coach`, { method: 'POST' });
			if (!res.ok) throw new Error('Analysis failed');
			aiCoachData = await res.json();
			aiCoachTab = 'risks';
		} catch (e) {
			aiCoachError = 'Failed to analyze deal. Check your API key configuration.';
		} finally {
			aiCoachLoading = false;
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
				<a href="/opportunities/{opportunity.id}/proposal" class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors border-0">
					📄 Proposal
				</a>
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
				<span class="px-3 py-1 rounded-full text-sm font-medium bg-white/15">
					Fabric Fit: {fabricQualification.score}
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

	<!-- Discovery Assessment Link -->
	{#if stage && stage.order >= 2 && !stage.isWon && !stage.isLost}
		<button
			onclick={() => goto(`/opportunities/${opportunity.id}/assessment`)}
			class="w-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 mb-6 flex items-center justify-between hover:from-indigo-100 hover:to-purple-100 transition-colors text-left"
		>
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
					<svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
					</svg>
				</div>
				<div>
					<p class="font-medium text-indigo-900">Discovery Assessment</p>
					<p class="text-sm text-indigo-600">Technical assessment, business case, project scoping & risk analysis</p>
				</div>
			</div>
			<svg class="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	{/if}

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

	<!-- Quick Inline Updates -->
	{#if !stage?.isWon && !stage?.isLost}
		<Card class="mb-6">
			<div class="flex items-center justify-between mb-4">
				<h3 class="font-semibold text-gray-900">Quick Updates</h3>
				<span class="text-xs text-gray-500">Inline edit key forecast and execution fields</span>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="md:col-span-2">
					<label for="quickNextStep" class="block text-sm font-medium text-gray-700 mb-1">Immediate Next Step</label>
					<div class="flex gap-2">
						<input
							id="quickNextStep"
							type="text"
							bind:value={quickNextStep}
							class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
							placeholder="Define next execution step"
						/>
						<Button type="button" onclick={() => saveQuickUpdate({ immediateNextStep: quickNextStep })} disabled={quickSaving}>
							Save
						</Button>
					</div>
				</div>
				<div>
					<label for="quickProbability" class="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
					<div class="flex gap-2">
						<input
							id="quickProbability"
							type="number"
							min="0"
							max="100"
							bind:value={quickProbability}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
						<Button
							type="button"
							variant="secondary"
							onclick={() => saveQuickUpdate({ probability: Number(quickProbability) })}
							disabled={quickSaving}
						>
							Save
						</Button>
					</div>
				</div>
				<div>
					<label for="quickExpectedCloseDate" class="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
					<div class="flex gap-2">
						<input
							id="quickExpectedCloseDate"
							type="date"
							bind:value={quickExpectedCloseDate}
							class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
						<Button
							type="button"
							variant="secondary"
							onclick={() => saveQuickUpdate({ expectedCloseDate: quickExpectedCloseDate || null })}
							disabled={quickSaving}
						>
							Save
						</Button>
					</div>
				</div>
			</div>
		</Card>
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
							<span class="text-sm text-gray-500">Partner Org</span>
							<span class="text-sm font-medium text-gray-900">{opportunity.partnerOrg || '-'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-500">Microsoft Seller</span>
							<span class="text-sm font-medium text-gray-900">{opportunity.microsoftSellerName || '-'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-500">Co-sell Status</span>
							<span class="text-sm font-medium text-gray-900">{opportunity.coSellStatus || '-'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-500">Funding Status</span>
							<span class="text-sm font-medium text-gray-900">{opportunity.fundingStatus || '-'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-500">Engagement Team</span>
							<span class="text-sm font-medium text-gray-900">{opportunity.engagementTeam || '-'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-sm text-gray-500">Timeline</span>
							<span class="text-sm font-medium text-gray-900">{opportunity.timeline || '-'}</span>
						</div>
						{#if opportunity.coSellNotes}
							<div class="pt-1 border-t border-gray-100">
								<p class="text-sm text-gray-500 mb-1">Co-sell Notes</p>
								<p class="text-sm text-gray-900">{opportunity.coSellNotes}</p>
							</div>
						{/if}
					</div>
				</Card>
			</div>

			<Card>
				<h3 class="font-semibold text-gray-900 mb-4">Fabric Qualification</h3>
				<div class="flex items-center justify-between mb-3">
					<div>
						<p class="text-sm text-gray-500">Qualification Score</p>
						<p class="text-2xl font-bold text-gray-900">{fabricQualification.score}/100</p>
					</div>
					<Badge variant={fabricQualification.band === 'high' ? 'green' : fabricQualification.band === 'medium' ? 'yellow' : 'red'}>
						{fabricQualification.band.toUpperCase()}
					</Badge>
				</div>
				<ul class="space-y-2">
					{#each fabricQualification.reasons as reason}
						<li class="text-sm text-gray-700 flex items-start gap-2">
							<span class="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
							<span>{reason}</span>
						</li>
					{/each}
					{#if fabricQualification.reasons.length === 0}
						<li class="text-sm text-gray-500">Add workload, sponsor, timeline, and next step details to improve qualification confidence.</li>
					{/if}
				</ul>
			</Card>

		<!-- AI Deal Coach -->
		<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
			<button onclick={() => showAiCoach = !showAiCoach}
				class="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
				<div class="flex items-center gap-2">
					<span class="text-lg">🤖</span>
					<span class="font-semibold text-gray-900">AI Deal Coach</span>
				</div>
				<svg class="w-4 h-4 text-gray-400 transition-transform {showAiCoach ? 'rotate-180' : ''}"
					fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
				</svg>
			</button>
			{#if showAiCoach}
				<div class="px-5 pb-5 border-t border-gray-100">
					{#if !aiCoachData && !aiCoachLoading}
						<div class="text-center py-6">
							<p class="text-sm text-gray-500 mb-3">Get AI-powered analysis of this deal including risk factors, next actions, and win strategy.</p>
							<button onclick={analyzeWithAI}
								class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
								✨ Analyze Deal
							</button>
						</div>
					{:else if aiCoachLoading}
						<div class="text-center py-6">
							<div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3"></div>
							<p class="text-sm text-gray-500">Analyzing deal with AI...</p>
						</div>
					{:else if aiCoachError}
						<div class="text-center py-4">
							<p class="text-sm text-red-500">{aiCoachError}</p>
							<button onclick={analyzeWithAI} class="mt-2 text-xs text-indigo-600 hover:underline">Try again</button>
						</div>
					{:else if aiCoachData}
						<div class="pt-4 space-y-4">
							<p class="text-sm text-gray-700 italic border-l-4 border-indigo-200 pl-3">{aiCoachData.dealSummary}</p>
							<div class="flex gap-1">
								{#each [['risks', '⚠️ Risks'], ['actions', '🎯 Actions'], ['strategy', '🏆 Strategy']] as [tab, label]}
									<button onclick={() => aiCoachTab = tab}
										class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
											{aiCoachTab === tab ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}">
										{label}
									</button>
								{/each}
							</div>
							{#if aiCoachTab === 'risks'}
								<div class="space-y-2">
									{#each aiCoachData.riskFactors as r}
										<div class="rounded-lg p-3 {r.severity === 'high' ? 'bg-red-50 border border-red-100' : r.severity === 'medium' ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100'}">
											<div class="flex items-center gap-2 mb-1">
												<span class="text-xs font-semibold uppercase {r.severity === 'high' ? 'text-red-600' : r.severity === 'medium' ? 'text-amber-600' : 'text-gray-500'}">{r.severity}</span>
												<span class="text-sm font-medium text-gray-800">{r.risk}</span>
											</div>
											<p class="text-xs text-gray-600">{r.mitigation}</p>
										</div>
									{/each}
								</div>
							{:else if aiCoachTab === 'actions'}
								<div class="space-y-2">
									{#each aiCoachData.nextActions as a}
										<div class="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
											<span class="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
												{a.priority === 'high' ? 'bg-red-100 text-red-700' : a.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'}">
												{a.priority[0].toUpperCase()}
											</span>
											<div>
												<p class="text-sm font-medium text-gray-800">{a.action}</p>
												<p class="text-xs text-gray-500 mt-0.5">{a.rationale}</p>
											</div>
										</div>
									{/each}
								</div>
							{:else if aiCoachTab === 'strategy'}
								<div class="space-y-3">
									<p class="text-sm text-gray-700 leading-relaxed">{aiCoachData.winStrategy}</p>
									{#if aiCoachData.keyTalkingPoints?.length > 0}
										<div>
											<p class="text-xs font-semibold text-gray-600 mb-2">Key Talking Points:</p>
											<ul class="space-y-1">
												{#each aiCoachData.keyTalkingPoints as point}
													<li class="flex gap-2 text-sm text-gray-700"><span class="text-indigo-400 mt-0.5">•</span>{point}</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							{/if}
							<button onclick={analyzeWithAI} class="text-xs text-gray-400 hover:text-indigo-600">↻ Refresh analysis</button>
						</div>
					{/if}
				</div>
			{/if}
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
						<div class="flex items-center gap-2 flex-wrap">
							<p class="font-semibold text-gray-900">{opportunity.competitor || '-'}</p>
							{#if competitorCard}
								<button onclick={() => showBattleCard = true}
									class="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full font-medium hover:bg-red-200 transition-colors">
									🥊 Battle Card
								</button>
							{/if}
						</div>
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
			<Card>
				<h3 class="font-semibold text-gray-900 mb-3">Documents</h3>
				{#if opportunity.documentsFolder}
					<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
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
				{/if}
				<a href="/opportunities/{opportunity.id}/documents" class="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
					<span class="text-sm font-medium text-gray-700">📁 Manage Documents</span>
					<svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
				</a>
			</Card>

			<!-- Timestamps -->
			<div class="text-xs text-gray-400 space-y-1">
				<p>Created: {formatDate(opportunity.createdAt?.toString())}</p>
				<p>Updated: {formatDate(opportunity.updatedAt?.toString())}</p>
			</div>
		</div>
	</div>
</div>

<!-- Battle Card Modal -->
{#if showBattleCard && competitorCard}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
		onclick={() => showBattleCard = false}
		role="dialog" aria-modal="true" tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && (showBattleCard = false)}>
		<div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
			role="presentation">
			<div class="sticky top-0 {competitorCard.bgColor} px-5 py-4 flex items-center justify-between border-b border-gray-200">
				<div class="flex items-center gap-3">
					<span class="text-2xl">{competitorCard.emoji}</span>
					<div>
						<h3 class="font-bold text-gray-900">{competitorCard.name} Battle Card</h3>
						<p class="text-xs {competitorCard.textColor}">How to win against {competitorCard.name}</p>
					</div>
				</div>
				<button onclick={() => showBattleCard = false} aria-label="Close battle card"
					class="p-1.5 rounded-lg hover:bg-black/10 transition-colors">
					<svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>
			<div class="p-5 space-y-5">
				<div>
					<h4 class="text-sm font-semibold text-green-700 mb-2">✅ Microsoft Fabric Advantages</h4>
					<ul class="space-y-1.5">
						{#each competitorCard.ourAdvantages as adv}
							<li class="flex gap-2 text-sm text-gray-700"><span class="text-green-500 flex-shrink-0">✓</span>{adv}</li>
						{/each}
					</ul>
				</div>
				<div>
					<h4 class="text-sm font-semibold text-amber-700 mb-2">⚠️ Their Strengths (Know These)</h4>
					<ul class="space-y-1.5">
						{#each competitorCard.theirStrengths as s}
							<li class="flex gap-2 text-sm text-gray-700"><span class="text-amber-500 flex-shrink-0">!</span>{s}</li>
						{/each}
					</ul>
				</div>
				{#if competitorCard.commonObjections.length > 0}
					<div>
						<h4 class="text-sm font-semibold text-gray-700 mb-2">💬 Common Objections & Responses</h4>
						<div class="space-y-3">
							{#each competitorCard.commonObjections as obj}
								<div class="rounded-lg bg-gray-50 p-3">
									<p class="text-xs font-semibold text-gray-600 mb-1">"{obj.objection}"</p>
									<p class="text-xs text-gray-700">{obj.response}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}
				<div class="bg-indigo-50 rounded-lg p-4">
					<h4 class="text-sm font-semibold text-indigo-700 mb-2">🎯 Win Strategy</h4>
					<p class="text-sm text-gray-700">{competitorCard.winStrategy}</p>
				</div>
			</div>
		</div>
	</div>
{/if}

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
