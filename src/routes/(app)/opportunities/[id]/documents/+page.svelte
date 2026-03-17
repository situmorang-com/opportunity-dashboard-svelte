<script lang="ts">
  import { toastStore } from '$lib/stores';

  let { data } = $props();
  let documents = $state(data.documents);
  let showAddForm = $state(false);
  let saving = $state(false);
  let deleting = $state<number | null>(null);

  let newTitle = $state('');
  let newUrl = $state('');
  let newType = $state('Other');
  let newNotes = $state('');

  const DOC_TYPES = ['SOW', 'Proposal', 'Architecture', 'Contract', 'Meeting Notes', 'Other'];

  const typeColors: Record<string, string> = {
    'SOW': 'bg-blue-100 text-blue-700',
    'Proposal': 'bg-purple-100 text-purple-700',
    'Architecture': 'bg-indigo-100 text-indigo-700',
    'Contract': 'bg-green-100 text-green-700',
    'Meeting Notes': 'bg-amber-100 text-amber-700',
    'Other': 'bg-gray-100 text-gray-700',
  };

  async function addDocument() {
    if (!newTitle.trim() || !newUrl.trim()) return;
    saving = true;
    try {
      const res = await fetch(`/api/opportunities/${data.opportunity.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, url: newUrl, documentType: newType, notes: newNotes }),
      });
      if (res.ok) {
        const doc = await res.json();
        documents = [...documents, doc];
        newTitle = ''; newUrl = ''; newType = 'Other'; newNotes = '';
        showAddForm = false;
        toastStore.add({ type: 'success', message: 'Document added' });
      }
    } catch (e) {
      toastStore.add({ type: 'error', message: 'Failed to add document' });
    } finally {
      saving = false;
    }
  }

  async function deleteDocument(id: number) {
    deleting = id;
    try {
      await fetch(`/api/opportunities/${data.opportunity.id}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      documents = documents.filter((d: any) => d.id !== id);
      toastStore.add({ type: 'success', message: 'Document removed' });
    } finally {
      deleting = null;
    }
  }
</script>

<svelte:head>
  <title>Documents | {data.opportunity.title}</title>
</svelte:head>

<div class="p-6 max-w-3xl mx-auto space-y-6">
  <div class="flex items-center gap-3">
    <a href="/opportunities/{data.opportunity.id}" class="text-gray-400 hover:text-gray-600">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
    </a>
    <div>
      <h1 class="text-xl font-bold text-gray-900">Documents</h1>
      <p class="text-sm text-gray-500">{data.opportunity.title}{data.opportunity.clientName ? ` · ${data.opportunity.clientName}` : ''}</p>
    </div>
    <div class="ml-auto">
      <button onclick={() => showAddForm = !showAddForm}
        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
        + Add Document
      </button>
    </div>
  </div>

  {#if showAddForm}
    <div class="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm space-y-3">
      <h3 class="font-semibold text-gray-900">Add OneDrive / SharePoint Document</h3>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1" for="doc-title">Document Title *</label>
          <input id="doc-title" type="text" bind:value={newTitle} placeholder="e.g. Fabric SOW v2"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1" for="doc-type">Type</label>
          <select id="doc-type" bind:value={newType}
            class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm">
            {#each DOC_TYPES as t}<option value={t}>{t}</option>{/each}
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1" for="doc-url">OneDrive / SharePoint URL *</label>
        <input id="doc-url" type="url" bind:value={newUrl} placeholder="https://..."
          class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1" for="doc-notes">Notes</label>
        <input id="doc-notes" type="text" bind:value={newNotes} placeholder="Optional description..."
          class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
      </div>
      <div class="flex gap-2 justify-end">
        <button onclick={() => showAddForm = false} class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
        <button onclick={addDocument} disabled={saving || !newTitle || !newUrl}
          class="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? 'Adding...' : 'Add Document'}
        </button>
      </div>
    </div>
  {/if}

  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    {#if documents.length === 0}
      <div class="py-12 text-center">
        <div class="text-4xl mb-3">📁</div>
        <p class="text-gray-500 font-medium">No documents yet</p>
        <p class="text-sm text-gray-400 mt-1">Add OneDrive or SharePoint links to keep your deal documents organized</p>
      </div>
    {:else}
      <div class="divide-y divide-gray-100">
        {#each documents as doc}
          <div class="flex items-start gap-3 p-4 hover:bg-gray-50">
            <div class="text-xl mt-0.5">📄</div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                  class="font-medium text-gray-900 hover:text-indigo-600 hover:underline text-sm truncate">
                  {doc.title}
                </a>
                <span class="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium {typeColors[doc.documentType || 'Other'] || 'bg-gray-100 text-gray-700'}">
                  {doc.documentType || 'Other'}
                </span>
              </div>
              {#if doc.notes}
                <p class="text-xs text-gray-500">{doc.notes}</p>
              {/if}
              <p class="text-xs text-gray-400 mt-1 truncate">{doc.url}</p>
            </div>
            <button onclick={() => deleteDocument(doc.id)}
              disabled={deleting === doc.id}
              class="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50" aria-label="Delete document">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
