<script lang="ts">
	import { Card, Avatar, Badge } from '$lib/components/ui';
	import { formatRelativeTime } from '$lib/utils';

	interface ActivityWithRelations {
		id: number;
		type: 'email' | 'call' | 'meeting' | 'note' | 'stage_change' | 'demo' | 'proposal';
		title: string;
		description?: string | null;
		createdAt?: Date | string | null;
		user?: { id: string; name: string; avatarUrl?: string | null } | null;
		opportunity?: { id: number; title: string } | null;
	}

	interface Props {
		activities: ActivityWithRelations[];
	}

	let { activities }: Props = $props();

	function getActivityIcon(type: string) {
		const icons: Record<string, string> = {
			call: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />`,
			email: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />`,
			meeting: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />`,
			note: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />`,
			stage_change: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />`,
			demo: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />`,
			proposal: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />`
		};
		return icons[type] || icons.note;
	}

	function getBadgeVariant(type: string): 'blue' | 'green' | 'purple' | 'yellow' | 'gray' {
		const variants: Record<string, 'blue' | 'green' | 'purple' | 'yellow' | 'gray'> = {
			call: 'blue',
			email: 'purple',
			meeting: 'green',
			note: 'gray',
			stage_change: 'yellow',
			demo: 'blue',
			proposal: 'purple'
		};
		return variants[type] || 'gray';
	}
</script>

<Card>
	<h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>

	{#if activities.length === 0}
		<div class="text-center py-8 text-gray-500">
			<svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<p>No recent activity</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each activities as activity}
				<div class="flex gap-3">
					<div class="flex-shrink-0">
						{#if activity.user}
							<Avatar name={activity.user.name} src={activity.user.avatarUrl} size="sm" />
						{:else}
							<div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
								<svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									{@html getActivityIcon(activity.type)}
								</svg>
							</div>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<span class="text-sm font-medium text-gray-900">
								{activity.user?.name || 'System'}
							</span>
							<Badge variant={getBadgeVariant(activity.type)}>
								{activity.type.replace('_', ' ')}
							</Badge>
						</div>
						<p class="text-sm text-gray-700">{activity.title}</p>
						{#if activity.opportunity}
							<a
								href="/opportunities/{activity.opportunity.id}"
								class="text-xs text-indigo-600 hover:underline"
							>
								{activity.opportunity.title}
							</a>
						{/if}
						<p class="text-xs text-gray-500 mt-1">
							{formatRelativeTime(activity.createdAt!)}
						</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Card>
