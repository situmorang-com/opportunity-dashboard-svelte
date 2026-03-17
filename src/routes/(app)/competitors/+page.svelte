<script lang="ts">
  import { COMPETITOR_CARDS } from '$lib/data/competitor-cards';

  let activeTabs = $state<Record<string, string>>(
    Object.fromEntries(COMPETITOR_CARDS.map(c => [c.id, 'advantages']))
  );
</script>

<svelte:head>
  <title>Competitor Intelligence</title>
</svelte:head>

<div class="p-6 space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Competitor Intelligence</h1>
    <p class="text-gray-500 mt-1">Battle cards to help you win against the competition</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {#each COMPETITOR_CARDS as card}
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <!-- Card Header -->
        <div class="px-5 py-4 {card.bgColor} border-b border-gray-200">
          <div class="flex items-center gap-3">
            <span class="text-2xl">{card.emoji}</span>
            <div>
              <h3 class="font-bold text-gray-900">{card.name}</h3>
              <p class="text-xs {card.textColor} font-medium">{card.keyWorkloads.slice(0,3).join(' · ')}</p>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-100">
          {#each [['advantages', '✅ Our Wins'], ['strengths', '⚠️ Their Strengths'], ['objections', '💬 Objections'], ['strategy', '🎯 Win Strategy']] as [tab, label]}
            <button
              onclick={() => activeTabs[card.id] = tab}
              class="flex-1 px-2 py-2.5 text-xs font-medium transition-colors
                {activeTabs[card.id] === tab
                  ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}"
            >{label}</button>
          {/each}
        </div>

        <!-- Content -->
        <div class="p-4 min-h-[140px]">
          {#if activeTabs[card.id] === 'advantages'}
            <ul class="space-y-1.5">
              {#each card.ourAdvantages as adv}
                <li class="flex gap-2 text-sm text-gray-700">
                  <span class="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {adv}
                </li>
              {/each}
            </ul>
          {:else if activeTabs[card.id] === 'strengths'}
            <ul class="space-y-1.5">
              {#each card.theirStrengths as s}
                <li class="flex gap-2 text-sm text-gray-700">
                  <span class="text-amber-500 mt-0.5 flex-shrink-0">!</span>
                  {s}
                </li>
              {/each}
            </ul>
          {:else if activeTabs[card.id] === 'objections'}
            <div class="space-y-3">
              {#each card.commonObjections as obj}
                <div class="rounded-lg bg-gray-50 p-3">
                  <p class="text-xs font-semibold text-gray-600 mb-1">"{obj.objection}"</p>
                  <p class="text-xs text-gray-700">{obj.response}</p>
                </div>
              {/each}
            </div>
          {:else if activeTabs[card.id] === 'strategy'}
            <p class="text-sm text-gray-700 leading-relaxed">{card.winStrategy}</p>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
