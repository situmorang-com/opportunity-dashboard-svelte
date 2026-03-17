<script lang="ts">
  let { data } = $props();

  const { summary, monthlyData, closingThisMonth, ownerPipeline, winLossTrend } = data;

  function fmt(v: number) {
    if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000) return '$' + Math.round(v / 1_000) + 'K';
    return '$' + Math.round(v);
  }

  const maxMonthly = Math.max(...monthlyData.map((m: any) => m.weighted), 1);
  const maxOwner = Math.max(...ownerPipeline.map((o: any) => o.pipeline), 1);
  const maxWinLoss = Math.max(...winLossTrend.map((m: any) => m.won + m.lost), 1);
</script>

<svelte:head>
  <title>Pipeline Forecast</title>
</svelte:head>

<div class="p-6 space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Pipeline Forecast</h1>
    <p class="text-gray-500 mt-1">Revenue forecast and pipeline analytics</p>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Pipeline</div>
      <div class="text-2xl font-bold text-gray-900 mt-1">{fmt(summary.totalPipeline)}</div>
      <div class="text-xs text-gray-400 mt-1">{summary.openCount} open deals</div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Weighted Forecast</div>
      <div class="text-2xl font-bold text-indigo-600 mt-1">{fmt(summary.weightedForecast)}</div>
      <div class="text-xs text-gray-400 mt-1">Value × probability</div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">This Quarter</div>
      <div class="text-2xl font-bold text-purple-600 mt-1">{fmt(summary.quarterPipeline)}</div>
      <div class="text-xs text-gray-400 mt-1">Weighted forecast</div>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Win Rate</div>
      <div class="text-2xl font-bold text-green-600 mt-1">{summary.winRate}%</div>
      <div class="text-xs text-gray-400 mt-1">Closed won / all closed</div>
    </div>
  </div>

  <!-- Monthly Chart -->
  <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
    <h2 class="text-base font-semibold text-gray-900 mb-4">Monthly Weighted Pipeline (Next 12 Months)</h2>
    <svg viewBox="0 0 720 180" class="w-full" style="height:180px">
      {#each monthlyData as m, i}
        {@const barH = maxMonthly > 0 ? Math.max(2, (m.weighted / maxMonthly) * 130) : 2}
        {@const x = i * 60 + 10}
        <rect x={x} y={150 - barH} width="40" height={barH}
          class="fill-indigo-500 hover:fill-indigo-600 transition-colors" rx="3"
        />
        <text x={x + 20} y="168" text-anchor="middle" font-size="9" class="fill-gray-500">{m.label}</text>
        {#if m.weighted > 0}
          <text x={x + 20} y={145 - barH} text-anchor="middle" font-size="8" class="fill-gray-600">{fmt(m.weighted)}</text>
        {/if}
      {/each}
    </svg>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Closing This Month -->
    <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 class="text-base font-semibold text-gray-900 mb-4">Closing This Month ({closingThisMonth.length})</h2>
      {#if closingThisMonth.length === 0}
        <p class="text-sm text-gray-400 text-center py-6">No opportunities closing this month</p>
      {:else}
        <div class="space-y-2">
          {#each closingThisMonth as opp}
            <a href="/opportunities/{opp.id}" class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
              <div class="min-w-0">
                <div class="text-sm font-medium text-gray-900 truncate">{opp.title}</div>
                <div class="text-xs text-gray-500">{opp.stageName} · {opp.ownerName}</div>
              </div>
              <div class="text-right ml-3 flex-shrink-0">
                <div class="text-sm font-semibold text-gray-900">{fmt(opp.value || 0)}</div>
                <div class="text-xs text-gray-500">{opp.probability}%</div>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- By Owner -->
    <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 class="text-base font-semibold text-gray-900 mb-4">Pipeline by Owner</h2>
      {#if ownerPipeline.length === 0}
        <p class="text-sm text-gray-400 text-center py-6">No data</p>
      {:else}
        <div class="space-y-3">
          {#each ownerPipeline as o}
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="font-medium text-gray-800">{o.name}</span>
                <span class="text-gray-500">{fmt(o.pipeline)} ({o.count})</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-2">
                <div class="bg-purple-500 h-2 rounded-full transition-all" style="width:{Math.round((o.pipeline/maxOwner)*100)}%"></div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Win/Loss Trend -->
  <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
    <h2 class="text-base font-semibold text-gray-900 mb-4">Win/Loss Trend (Last 6 Months)</h2>
    <div class="flex items-end gap-4 h-32">
      {#each winLossTrend as m}
        <div class="flex-1 flex flex-col items-center gap-1">
          <div class="w-full flex gap-1 items-end" style="height:100px">
            {#if m.won > 0}
              <div class="flex-1 bg-green-400 rounded-t transition-all" style="height:{Math.max(4,(m.won/maxWinLoss)*100)}px" title="{m.won} won"></div>
            {:else}
              <div class="flex-1 bg-gray-100 rounded-t" style="height:4px"></div>
            {/if}
            {#if m.lost > 0}
              <div class="flex-1 bg-red-300 rounded-t transition-all" style="height:{Math.max(4,(m.lost/maxWinLoss)*100)}px" title="{m.lost} lost"></div>
            {:else}
              <div class="flex-1 bg-gray-100 rounded-t" style="height:4px"></div>
            {/if}
          </div>
          <span class="text-xs text-gray-400">{m.label}</span>
        </div>
      {/each}
    </div>
    <div class="flex gap-4 mt-3">
      <div class="flex items-center gap-1.5 text-xs text-gray-500"><div class="w-3 h-3 bg-green-400 rounded"></div> Won</div>
      <div class="flex items-center gap-1.5 text-xs text-gray-500"><div class="w-3 h-3 bg-red-300 rounded"></div> Lost</div>
    </div>
  </div>
</div>
