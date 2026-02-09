import { redirect } from '@sveltejs/kit';
import { db, opportunities, clients, stages, users, activities } from '$lib/server/db';
import { eq, sql, desc, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Get all opportunities with relations for calculations
	const allOpportunities = await db
		.select({
			id: opportunities.id,
			title: opportunities.title,
			value: opportunities.value,
			probability: opportunities.probability,
			stageId: opportunities.stageId,
			clientId: opportunities.clientId,
			ownerId: opportunities.ownerId,
			expectedCloseDate: opportunities.expectedCloseDate,
			fabricWorkloads: opportunities.fabricWorkloads,
			leadSource: opportunities.leadSource,
			competitor: opportunities.competitor,
			estimatedLicenseCost: opportunities.estimatedLicenseCost,
			estimatedServicesCost: opportunities.estimatedServicesCost,
			createdAt: opportunities.createdAt,
			wonDate: opportunities.wonDate,
			lostDate: opportunities.lostDate
		})
		.from(opportunities);

	// Get all stages
	const allStages = await db.select().from(stages).orderBy(stages.order);

	// Get all clients
	const allClients = await db.select().from(clients);

	// Get all users
	const allUsers = await db.select({ id: users.id, name: users.name }).from(users);

	// Get recent activities
	const recentActivities = await db
		.select({
			activity: activities,
			user: { id: users.id, name: users.name }
		})
		.from(activities)
		.leftJoin(users, eq(activities.userId, users.id))
		.orderBy(desc(activities.createdAt))
		.limit(10);

	// === Calculate Analytics ===

	// Pipeline by Stage
	const pipelineByStage = allStages.map((stage) => {
		const stageOpps = allOpportunities.filter((o) => o.stageId === stage.id);
		const totalValue = stageOpps.reduce((sum, o) => sum + (o.value || 0), 0);
		const weightedValue = stageOpps.reduce(
			(sum, o) => sum + (o.value || 0) * ((o.probability || 0) / 100),
			0
		);
		return {
			stage,
			count: stageOpps.length,
			totalValue,
			weightedValue
		};
	});

	// Total Pipeline Metrics
	const totalPipelineValue = allOpportunities.reduce((sum, o) => sum + (o.value || 0), 0);
	const totalWeightedValue = allOpportunities.reduce(
		(sum, o) => sum + (o.value || 0) * ((o.probability || 0) / 100),
		0
	);
	const avgDealSize =
		allOpportunities.length > 0 ? totalPipelineValue / allOpportunities.length : 0;
	const avgProbability =
		allOpportunities.length > 0
			? allOpportunities.reduce((sum, o) => sum + (o.probability || 0), 0) /
				allOpportunities.length
			: 0;

	// Won/Lost Analysis
	const wonOpps = allOpportunities.filter((o) => o.wonDate);
	const lostOpps = allOpportunities.filter((o) => o.lostDate);
	const totalWonValue = wonOpps.reduce((sum, o) => sum + (o.value || 0), 0);
	const totalLostValue = lostOpps.reduce((sum, o) => sum + (o.value || 0), 0);
	const winRate =
		wonOpps.length + lostOpps.length > 0
			? (wonOpps.length / (wonOpps.length + lostOpps.length)) * 100
			: 0;

	// Fabric Workloads Distribution
	const workloadCounts: Record<string, number> = {};
	allOpportunities.forEach((opp) => {
		if (opp.fabricWorkloads && Array.isArray(opp.fabricWorkloads)) {
			opp.fabricWorkloads.forEach((workload: string) => {
				workloadCounts[workload] = (workloadCounts[workload] || 0) + 1;
			});
		}
	});
	const workloadDistribution = Object.entries(workloadCounts)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count);

	// Lead Source Analysis
	const leadSourceCounts: Record<string, { count: number; value: number }> = {};
	allOpportunities.forEach((opp) => {
		const source = opp.leadSource || 'Unknown';
		if (!leadSourceCounts[source]) {
			leadSourceCounts[source] = { count: 0, value: 0 };
		}
		leadSourceCounts[source].count++;
		leadSourceCounts[source].value += opp.value || 0;
	});
	const leadSourceAnalysis = Object.entries(leadSourceCounts)
		.map(([source, data]) => ({ source, ...data }))
		.sort((a, b) => b.value - a.value);

	// Competitor Analysis
	const competitorCounts: Record<string, { count: number; value: number }> = {};
	allOpportunities.forEach((opp) => {
		const competitor = opp.competitor || 'None';
		if (!competitorCounts[competitor]) {
			competitorCounts[competitor] = { count: 0, value: 0 };
		}
		competitorCounts[competitor].count++;
		competitorCounts[competitor].value += opp.value || 0;
	});
	const competitorAnalysis = Object.entries(competitorCounts)
		.map(([competitor, data]) => ({ competitor, ...data }))
		.sort((a, b) => b.count - a.count);

	// Sales Rep Performance (by owner)
	const repPerformance: Record<string, { count: number; value: number; weightedValue: number }> =
		{};
	allOpportunities.forEach((opp) => {
		const ownerId = opp.ownerId;
		if (!repPerformance[ownerId]) {
			repPerformance[ownerId] = { count: 0, value: 0, weightedValue: 0 };
		}
		repPerformance[ownerId].count++;
		repPerformance[ownerId].value += opp.value || 0;
		repPerformance[ownerId].weightedValue += (opp.value || 0) * ((opp.probability || 0) / 100);
	});
	const salesRepLeaderboard = Object.entries(repPerformance)
		.map(([ownerId, data]) => {
			const user = allUsers.find((u) => u.id === ownerId);
			return {
				userId: ownerId,
				name: user?.name || 'Unknown',
				...data
			};
		})
		.sort((a, b) => b.value - a.value);

	// Client Analysis
	const clientAnalysis = allClients
		.map((client) => {
			const clientOpps = allOpportunities.filter((o) => o.clientId === client.id);
			const totalValue = clientOpps.reduce((sum, o) => sum + (o.value || 0), 0);
			return {
				client,
				opportunityCount: clientOpps.length,
				totalValue
			};
		})
		.filter((c) => c.opportunityCount > 0)
		.sort((a, b) => b.totalValue - a.totalValue);

	// Revenue Breakdown (License vs Services)
	const totalLicenseCost = allOpportunities.reduce(
		(sum, o) => sum + (o.estimatedLicenseCost || 0),
		0
	);
	const totalServicesCost = allOpportunities.reduce(
		(sum, o) => sum + (o.estimatedServicesCost || 0),
		0
	);

	// Monthly Pipeline Trend (last 6 months simulated based on created dates)
	const now = new Date();
	const monthlyTrend = [];
	for (let i = 5; i >= 0; i--) {
		const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
		const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

		// For now, distribute opportunities somewhat randomly for demo
		const monthOpps = allOpportunities.filter((o) => {
			if (!o.createdAt) return false;
			const created = new Date(o.createdAt);
			return created >= monthStart && created <= monthEnd;
		});

		monthlyTrend.push({
			month: monthName,
			value: monthOpps.reduce((sum, o) => sum + (o.value || 0), 0),
			count: monthOpps.length
		});
	}

	return {
		user: locals.user,
		summary: {
			totalOpportunities: allOpportunities.length,
			totalPipelineValue,
			totalWeightedValue,
			avgDealSize,
			avgProbability,
			wonCount: wonOpps.length,
			lostCount: lostOpps.length,
			totalWonValue,
			totalLostValue,
			winRate,
			totalLicenseCost,
			totalServicesCost
		},
		pipelineByStage,
		workloadDistribution,
		leadSourceAnalysis,
		competitorAnalysis,
		salesRepLeaderboard,
		clientAnalysis,
		monthlyTrend,
		recentActivities
	};
};
