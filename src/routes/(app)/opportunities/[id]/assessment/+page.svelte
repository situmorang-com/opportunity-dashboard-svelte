<script lang="ts">
	import { Badge, Button, Card } from '$lib/components/ui';
	import { goto } from '$app/navigation';
	import { DISCOVERY_CHECKLIST } from '$lib/constants';

	let { data } = $props();

	const opportunity = $derived(data.opportunity);
	const client = $derived(data.client);
	const stage = $derived(data.stage);
	const assessment = $derived(data.assessment);

	// State
	let saving = $state(false);
	let lastSaved = $state<string | null>(null);
	let expandedSections = $state<Record<string, boolean>>({
		technical: true,
		business: false,
		scope: false,
		risk: false,
		resources: false
	});

	// Checklist state
	let checklist = $state<Record<string, boolean>>(
		assessment?.checklist ? { ...(assessment.checklist as Record<string, boolean>) } : {}
	);

	// Form state
	let form = $state({
		currentInfrastructure: assessment?.currentInfrastructure || '',
		dataSources: assessment?.dataSources || ([] as string[]),
		integrationPoints: assessment?.integrationPoints || '',
		securityRequirements: assessment?.securityRequirements || '',
		complianceNeeds: assessment?.complianceNeeds || '',
		technicalReadiness: assessment?.technicalReadiness || 0,
		businessObjective: assessment?.businessObjective || '',
		expectedRoi: assessment?.expectedRoi || '',
		successMetrics: assessment?.successMetrics || '',
		budgetRange: assessment?.budgetRange || '',
		budgetApproved: assessment?.budgetApproved || false,
		stakeholderAlignment: assessment?.stakeholderAlignment || '',
		deliverables: assessment?.deliverables || ([] as string[]),
		outOfScope: assessment?.outOfScope || '',
		assumptions: assessment?.assumptions || '',
		constraints: assessment?.constraints || '',
		risks: assessment?.risks || ([] as Array<{ description: string; impact: string; likelihood: string; mitigation: string }>),
		requiredSkills: assessment?.requiredSkills || '',
		teamSize: assessment?.teamSize || '',
		externalResources: assessment?.externalResources || ''
	});

	// New item inputs
	let newDataSource = $state('');
	let newDeliverable = $state('');

	// Checklist progress
	const totalItems = $derived(DISCOVERY_CHECKLIST.reduce((sum, g) => sum + g.items.length, 0));
	const checkedItems = $derived(Object.values(checklist).filter(Boolean).length);
	const progressPercent = $derived(totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0);

	function toggleSection(key: string) {
		expandedSections[key] = !expandedSections[key];
	}

	async function toggleCheckItem(itemId: string) {
		checklist[itemId] = !checklist[itemId];
		// Auto-save checklist
		try {
			await fetch(`/api/opportunities/${opportunity.id}/assessment`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ checklist })
			});
		} catch (err) {
			console.error('Failed to save checklist:', err);
		}
	}

	function addDataSource() {
		if (newDataSource.trim()) {
			form.dataSources = [...form.dataSources, newDataSource.trim()];
			newDataSource = '';
		}
	}

	function removeDataSource(index: number) {
		form.dataSources = form.dataSources.filter((_s: string, i: number) => i !== index);
	}

	function addDeliverable() {
		if (newDeliverable.trim()) {
			form.deliverables = [...form.deliverables, newDeliverable.trim()];
			newDeliverable = '';
		}
	}

	function removeDeliverable(index: number) {
		form.deliverables = form.deliverables.filter((_s: string, i: number) => i !== index);
	}

	function addRisk() {
		form.risks = [...form.risks, { description: '', impact: 'medium', likelihood: 'medium', mitigation: '' }];
	}

	function removeRisk(index: number) {
		form.risks = form.risks.filter((_r: { description: string }, i: number) => i !== index);
	}

	async function saveAssessment() {
		saving = true;
		try {
			const response = await fetch(`/api/opportunities/${opportunity.id}/assessment`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...form, checklist })
			});

			if (response.ok) {
				lastSaved = new Date().toLocaleTimeString();
			} else {
				const err = await response.json();
				alert(err.error || 'Failed to save assessment');
			}
		} catch (err) {
			console.error('Error saving assessment:', err);
			alert('Failed to save assessment');
		} finally {
			saving = false;
		}
	}

	async function completeAndAdvance() {
		await saveAssessment();
		// Move to Solution Design (stage order 3)
		try {
			const stagesRes = await fetch('/api/opportunities/' + opportunity.id + '/stage', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ stageId: stage && stage.id ? stage.id + 1 : 3 })
			});

			if (stagesRes.ok) {
				goto(`/opportunities/${opportunity.id}`);
			} else {
				const err = await stagesRes.json();
				alert(err.error || err.message || 'Cannot advance stage. Complete required fields first.');
			}
		} catch {
			alert('Failed to advance stage');
		}
	}
</script>

<svelte:head>
	<title>Discovery Assessment | {opportunity.title}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 -m-6 p-6">
	<!-- Header -->
	<div class="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 text-white shadow-xl mb-6">
		<div class="flex items-center justify-between mb-4">
			<button
				onclick={() => goto(`/opportunities/${opportunity.id}`)}
				class="flex items-center gap-2 text-indigo-200 hover:text-white transition-colors"
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Opportunity
			</button>
			<div class="flex items-center gap-3">
				{#if lastSaved}
					<span class="text-indigo-200 text-sm">Saved at {lastSaved}</span>
				{/if}
				<Button
					onclick={saveAssessment}
					disabled={saving}
					class="bg-white/10 hover:bg-white/20 text-white border-0"
				>
					{#if saving}
						<svg class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
						</svg>
						Saving...
					{:else}
						<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Save Assessment
					{/if}
				</Button>
			</div>
		</div>

		<div class="flex items-center gap-4">
			<div>
				<div class="flex items-center gap-3 mb-1">
					<h1 class="text-2xl font-bold">Discovery Assessment</h1>
					{#if stage}
						<span class="px-3 py-1 rounded-full text-xs font-medium" style="background-color: {stage.color}; color: white">
							{stage.name}
						</span>
					{/if}
				</div>
				<p class="text-indigo-200">{opportunity.title} • {client?.name || 'No client'}</p>
			</div>
		</div>
	</div>

	<!-- Progress Bar -->
	<div class="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
		<div class="flex items-center justify-between mb-2">
			<span class="text-sm font-medium text-gray-700">Discovery Progress</span>
			<span class="text-sm font-bold {progressPercent === 100 ? 'text-green-600' : 'text-indigo-600'}">{progressPercent}%</span>
		</div>
		<div class="w-full bg-gray-200 rounded-full h-3">
			<div
				class="h-3 rounded-full transition-all duration-500 {progressPercent === 100 ? 'bg-green-500' : 'bg-indigo-600'}"
				style="width: {progressPercent}%"
			></div>
		</div>
		<p class="text-xs text-gray-500 mt-1">{checkedItems} of {totalItems} items completed</p>
	</div>

	<!-- Main Content: Checklist + Form -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left: Checklist -->
		<div class="lg:col-span-1">
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
				<h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
					<svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
					</svg>
					Discovery Checklist
				</h2>

				{#each DISCOVERY_CHECKLIST as group}
					{@const groupChecked = group.items.filter(i => checklist[i.id]).length}
					<div class="mb-4">
						<div class="flex items-center justify-between mb-2">
							<h3 class="text-sm font-medium text-gray-700">{group.label}</h3>
							<span class="text-xs text-gray-500">{groupChecked}/{group.items.length}</span>
						</div>
						<div class="space-y-1">
							{#each group.items as item}
								<label class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
									<input
										type="checkbox"
										checked={checklist[item.id] || false}
										onchange={() => toggleCheckItem(item.id)}
										class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
									/>
									<span class="text-sm {checklist[item.id] ? 'text-gray-400 line-through' : 'text-gray-700'}">
										{item.label}
									</span>
								</label>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Right: Assessment Form -->
		<div class="lg:col-span-2 space-y-4">

			<!-- Technical Assessment -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<button
					onclick={() => toggleSection('technical')}
					class="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
				>
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
							<svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<h3 class="font-semibold text-gray-900">Technical Assessment</h3>
					</div>
					<svg class="w-5 h-5 text-gray-400 transition-transform {expandedSections.technical ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if expandedSections.technical}
					<div class="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Current Infrastructure</label>
							<textarea
								bind:value={form.currentInfrastructure}
								rows="3"
								class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
								placeholder="Describe the client's current data infrastructure..."
							></textarea>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Data Sources</label>
							<div class="flex flex-wrap gap-2 mb-2">
								{#each form.dataSources as source, i}
									<span class="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
										{source}
										<button onclick={() => removeDataSource(i)} class="text-blue-400 hover:text-blue-600">
											<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
										</button>
									</span>
								{/each}
							</div>
							<div class="flex gap-2">
								<input
									type="text"
									bind:value={newDataSource}
									onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addDataSource())}
									class="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									placeholder="Add data source and press Enter"
								/>
								<Button onclick={addDataSource} variant="secondary" class="text-sm">Add</Button>
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Integration Points</label>
							<textarea
								bind:value={form.integrationPoints}
								rows="2"
								class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
								placeholder="Systems that need to integrate with the solution..."
							></textarea>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Security Requirements</label>
								<textarea
									bind:value={form.securityRequirements}
									rows="2"
									class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									placeholder="Security requirements..."
								></textarea>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Compliance Needs</label>
								<textarea
									bind:value={form.complianceNeeds}
									rows="2"
									class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									placeholder="Compliance requirements..."
								></textarea>
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Technical Readiness (1-5)</label>
							<div class="flex gap-2">
								{#each [1, 2, 3, 4, 5] as level}
									<button
										onclick={() => form.technicalReadiness = level}
										class="w-10 h-10 rounded-lg font-medium text-sm transition-all {form.technicalReadiness === level ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
									>
										{level}
									</button>
								{/each}
								<span class="text-xs text-gray-500 self-center ml-2">
									{#if form.technicalReadiness === 1}Not ready
									{:else if form.technicalReadiness === 2}Needs work
									{:else if form.technicalReadiness === 3}Moderate
									{:else if form.technicalReadiness === 4}Good
									{:else if form.technicalReadiness === 5}Excellent
									{/if}
								</span>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Business Case -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<button
					onclick={() => toggleSection('business')}
					class="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
				>
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
							<svg class="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h3 class="font-semibold text-gray-900">Business Case</h3>
					</div>
					<svg class="w-5 h-5 text-gray-400 transition-transform {expandedSections.business ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if expandedSections.business}
					<div class="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Business Objective</label>
							<textarea
								bind:value={form.businessObjective}
								rows="3"
								class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
								placeholder="What business problem are we solving?"
							></textarea>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Expected ROI</label>
								<textarea
									bind:value={form.expectedRoi}
									rows="2"
									class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									placeholder="Expected return on investment..."
								></textarea>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Success Metrics</label>
								<textarea
									bind:value={form.successMetrics}
									rows="2"
									class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									placeholder="How will success be measured?"
								></textarea>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
								<input
									type="text"
									bind:value={form.budgetRange}
									class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									placeholder="e.g., $50K - $100K"
								/>
							</div>
							<div class="flex items-end">
								<label class="flex items-center gap-2 pb-2 cursor-pointer">
									<input
										type="checkbox"
										bind:checked={form.budgetApproved}
										class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
									/>
									<span class="text-sm font-medium text-gray-700">Budget Approved</span>
								</label>
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Stakeholder Alignment</label>
							<textarea
								bind:value={form.stakeholderAlignment}
								rows="2"
								class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
								placeholder="Key stakeholders and their positions..."
							></textarea>
						</div>
					</div>
				{/if}
			</div>

			<!-- Project Scope -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<button
					onclick={() => toggleSection('scope')}
					class="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
				>
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
							<svg class="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
						</div>
						<h3 class="font-semibold text-gray-900">Project Scope</h3>
					</div>
					<svg class="w-5 h-5 text-gray-400 transition-transform {expandedSections.scope ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if expandedSections.scope}
					<div class="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Deliverables</label>
							<div class="space-y-1 mb-2">
								{#each form.deliverables as deliverable, i}
									<div class="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
										<span class="text-sm text-purple-700 flex-1">{deliverable}</span>
										<button onclick={() => removeDeliverable(i)} class="text-purple-400 hover:text-purple-600">
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
										</button>
									</div>
								{/each}
							</div>
							<div class="flex gap-2">
								<input
									type="text"
									bind:value={newDeliverable}
									onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
									class="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									placeholder="Add deliverable and press Enter"
								/>
								<Button onclick={addDeliverable} variant="secondary" class="text-sm">Add</Button>
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Out of Scope</label>
							<textarea
								bind:value={form.outOfScope}
								rows="2"
								class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
								placeholder="What is explicitly out of scope..."
							></textarea>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Assumptions</label>
								<textarea
									bind:value={form.assumptions}
									rows="2"
									class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									placeholder="Key assumptions..."
								></textarea>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Constraints</label>
								<textarea
									bind:value={form.constraints}
									rows="2"
									class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									placeholder="Known constraints..."
								></textarea>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Risk Assessment -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<button
					onclick={() => toggleSection('risk')}
					class="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
				>
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
							<svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
						</div>
						<h3 class="font-semibold text-gray-900">Risk Assessment</h3>
						{#if form.risks.length > 0}
							<span class="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">{form.risks.length} risks</span>
						{/if}
					</div>
					<svg class="w-5 h-5 text-gray-400 transition-transform {expandedSections.risk ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if expandedSections.risk}
					<div class="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
						{#each form.risks as risk, i}
							<div class="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium text-gray-700">Risk #{i + 1}</span>
									<button onclick={() => removeRisk(i)} class="text-red-400 hover:text-red-600 text-sm">Remove</button>
								</div>
								<div>
									<input
										type="text"
										bind:value={risk.description}
										class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
										placeholder="Risk description"
									/>
								</div>
								<div class="grid grid-cols-2 gap-3">
									<div>
										<label class="block text-xs font-medium text-gray-600 mb-1">Impact</label>
										<select bind:value={risk.impact} class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm">
											<option value="low">Low</option>
											<option value="medium">Medium</option>
											<option value="high">High</option>
										</select>
									</div>
									<div>
										<label class="block text-xs font-medium text-gray-600 mb-1">Likelihood</label>
										<select bind:value={risk.likelihood} class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm">
											<option value="low">Low</option>
											<option value="medium">Medium</option>
											<option value="high">High</option>
										</select>
									</div>
								</div>
								<div>
									<input
										type="text"
										bind:value={risk.mitigation}
										class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
										placeholder="Mitigation strategy"
									/>
								</div>
							</div>
						{/each}

						<Button onclick={addRisk} variant="secondary" class="w-full">
							<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
							Add Risk
						</Button>
					</div>
				{/if}
			</div>

			<!-- Resource Requirements -->
			<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
				<button
					onclick={() => toggleSection('resources')}
					class="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
				>
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
							<svg class="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</div>
						<h3 class="font-semibold text-gray-900">Resource Requirements</h3>
					</div>
					<svg class="w-5 h-5 text-gray-400 transition-transform {expandedSections.resources ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if expandedSections.resources}
					<div class="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
							<textarea
								bind:value={form.requiredSkills}
								rows="2"
								class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
								placeholder="Skills needed for the engagement..."
							></textarea>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
								<input
									type="text"
									bind:value={form.teamSize}
									class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									placeholder="e.g., 3-5 people"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">External Resources</label>
								<input
									type="text"
									bind:value={form.externalResources}
									class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									placeholder="External consultants, vendors..."
								/>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Action Buttons -->
			<div class="flex items-center justify-between pt-4">
				<Button variant="secondary" onclick={() => goto(`/opportunities/${opportunity.id}`)}>
					Back to Opportunity
				</Button>
				<div class="flex items-center gap-3">
					<Button onclick={saveAssessment} disabled={saving} variant="secondary">
						{saving ? 'Saving...' : 'Save Draft'}
					</Button>
					<Button onclick={completeAndAdvance} disabled={saving} class="bg-green-600 hover:bg-green-700 text-white border-0">
						<svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
						Complete Discovery & Advance
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>
