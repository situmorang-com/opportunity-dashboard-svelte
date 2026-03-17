<script lang="ts">
  let { data } = $props();
  const { opportunity, client, stage, owner, generatedDate } = data;
  let downloading = $state<'docx' | 'pptx' | null>(null);

  function fmt(v: number) {
    if (!v) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
  }

  function printPage() { window.print(); }

  async function downloadProposal(format: 'docx' | 'pptx') {
    downloading = format;
    try {
      const res = await fetch(`/api/opportunities/${opportunity.id}/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${opportunity.title.replace(/\s+/g, '_')}_Proposal.${format}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert(`Failed to download ${format.toUpperCase()}`);
    } finally {
      downloading = null;
    }
  }

  const workloads = Array.isArray(opportunity.fabricWorkloads) ? opportunity.fabricWorkloads :
    (typeof opportunity.fabricWorkloads === 'string' ? JSON.parse(opportunity.fabricWorkloads || '[]') : []);
</script>

<svelte:head>
  <title>Proposal | {opportunity.title}</title>
</svelte:head>

<style>
  @media print {
    .no-print { display: none !important; }
    .print-page { background: white; padding: 0; }
    body { background: white; }
  }
</style>

<!-- Controls (hidden on print) -->
<div class="no-print fixed top-4 right-4 flex gap-2 z-50">
  <a href="/opportunities/{opportunity.id}" class="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg shadow hover:bg-gray-50">
    ← Back
  </a>
  <button onclick={printPage} class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow hover:bg-indigo-700">
    🖨️ Print / Save PDF
  </button>
  <button onclick={() => downloadProposal('docx')} disabled={downloading} class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow hover:bg-blue-700 disabled:opacity-50">
    {downloading === 'docx' ? '⏳' : '📄'} Word
  </button>
  <button onclick={() => downloadProposal('pptx')} disabled={downloading} class="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg shadow hover:bg-orange-700 disabled:opacity-50">
    {downloading === 'pptx' ? '⏳' : '🎬'} PowerPoint
  </button>
</div>

<div class="print-page max-w-4xl mx-auto bg-white min-h-screen p-8 md:p-12">

  <!-- Cover Page -->
  <div class="mb-16 pb-12 border-b-4 border-indigo-600">
    <div class="flex items-center gap-3 mb-12">
      <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
        <span class="text-white font-bold text-lg">F</span>
      </div>
      <span class="text-xl font-bold text-gray-900">Microsoft Fabric</span>
    </div>

    <h1 class="text-4xl font-bold text-gray-900 mb-3">Solution Proposal</h1>
    <h2 class="text-2xl text-indigo-600 font-semibold mb-6">{opportunity.title}</h2>

    <div class="grid grid-cols-2 gap-6 mt-8">
      <div>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Prepared For</p>
        <p class="text-lg font-bold text-gray-900 mt-1">{client?.name || 'Client'}</p>
        {#if client?.industry}<p class="text-sm text-gray-500">{client.industry}</p>{/if}
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Prepared By</p>
        <p class="text-lg font-bold text-gray-900 mt-1">{owner?.name || 'Sales Team'}</p>
        {#if owner?.email}<p class="text-sm text-gray-500">{owner.email}</p>{/if}
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</p>
        <p class="text-base text-gray-900 mt-1">{generatedDate}</p>
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Proposal Stage</p>
        <p class="text-base text-gray-900 mt-1">{stage?.name || 'In Progress'}</p>
      </div>
    </div>
  </div>

  <!-- Executive Summary -->
  {#if opportunity.description || opportunity.objectives}
  <section class="mb-10">
    <h3 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Executive Summary</h3>
    {#if opportunity.description}
      <p class="text-gray-700 leading-relaxed mb-3">{opportunity.description}</p>
    {/if}
    {#if opportunity.objectives}
      <p class="text-gray-700 leading-relaxed">{opportunity.objectives}</p>
    {/if}
  </section>
  {/if}

  <!-- Pain Points & Objectives -->
  {#if opportunity.keyPainPoints}
  <section class="mb-10">
    <h3 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Challenges & Objectives</h3>
    <div class="bg-red-50 rounded-lg p-4 mb-4">
      <h4 class="text-sm font-semibold text-red-700 mb-2">Current Challenges</h4>
      <p class="text-gray-700 text-sm leading-relaxed">{opportunity.keyPainPoints}</p>
    </div>
    {#if opportunity.initiatives}
    <div class="bg-blue-50 rounded-lg p-4">
      <h4 class="text-sm font-semibold text-blue-700 mb-2">Strategic Initiatives</h4>
      <p class="text-gray-700 text-sm leading-relaxed">{opportunity.initiatives}</p>
    </div>
    {/if}
  </section>
  {/if}

  <!-- Proposed Solution -->
  <section class="mb-10">
    <h3 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Proposed Microsoft Fabric Solution</h3>
    {#if workloads.length > 0}
    <div class="mb-4">
      <p class="text-sm font-semibold text-gray-600 mb-2">Solution Components</p>
      <div class="flex flex-wrap gap-2">
        {#each workloads as w}
          <span class="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">{w}</span>
        {/each}
      </div>
    </div>
    {/if}
    {#if opportunity.migrationSource && opportunity.migrationSource !== 'Greenfield'}
    <p class="text-gray-700 text-sm"><strong>Migration from:</strong> {opportunity.migrationSource}</p>
    {/if}
    {#if opportunity.engagementSummary}
    <p class="text-gray-700 text-sm mt-3 leading-relaxed">{opportunity.engagementSummary}</p>
    {/if}
  </section>

  <!-- Investment -->
  <section class="mb-10">
    <h3 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Investment Summary</h3>
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-gray-50 rounded-lg p-4 text-center">
        <p class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">License</p>
        <p class="text-2xl font-bold text-gray-900">{fmt(opportunity.estimatedLicenseCost || 0)}</p>
      </div>
      <div class="bg-gray-50 rounded-lg p-4 text-center">
        <p class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Services</p>
        <p class="text-2xl font-bold text-gray-900">{fmt(opportunity.estimatedServicesCost || 0)}</p>
      </div>
      <div class="bg-indigo-600 rounded-lg p-4 text-center">
        <p class="text-xs text-white/80 font-medium uppercase tracking-wide mb-1">Total Value</p>
        <p class="text-2xl font-bold text-white">{fmt(opportunity.value || 0)}</p>
      </div>
    </div>
  </section>

  <!-- Timeline -->
  {#if opportunity.projectDuration || opportunity.timeline}
  <section class="mb-10">
    <h3 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Implementation Timeline</h3>
    {#if opportunity.projectDuration}
    <p class="text-gray-700"><strong>Estimated Duration:</strong> {opportunity.projectDuration}</p>
    {/if}
    {#if opportunity.timeline}
    <p class="text-gray-700 mt-2">{opportunity.timeline}</p>
    {/if}
  </section>
  {/if}

  <!-- Team & Next Steps -->
  <section class="mb-10">
    <h3 class="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Team & Next Steps</h3>
    {#if opportunity.engagementTeam}
    <p class="text-gray-700 mb-3"><strong>Engagement Team:</strong> {opportunity.engagementTeam}</p>
    {/if}
    {#if opportunity.immediateNextStep}
    <div class="bg-green-50 rounded-lg p-4">
      <p class="text-sm font-semibold text-green-700 mb-1">Immediate Next Step</p>
      <p class="text-gray-700 text-sm">{opportunity.immediateNextStep}</p>
    </div>
    {/if}
    {#if opportunity.expectedCloseDate}
    <p class="text-gray-600 text-sm mt-3">
      <strong>Expected Close Date:</strong>
      {new Date(opportunity.expectedCloseDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
    </p>
    {/if}
  </section>

  <!-- Footer -->
  <div class="mt-16 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
    <p>Confidential · Microsoft Fabric Solution Proposal · {generatedDate}</p>
    <p class="mt-1">{owner?.name || 'Sales Team'}{owner?.email ? ` · ${owner.email}` : ''}</p>
  </div>
</div>
