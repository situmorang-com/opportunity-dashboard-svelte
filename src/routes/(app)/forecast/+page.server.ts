import { redirect } from '@sveltejs/kit';
import { db, opportunities, stages, users } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { format, addMonths, subMonths } from 'date-fns';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/login');

  const [allOpportunities, allStages, allUsers] = await Promise.all([
    db.select({
      id: opportunities.id,
      title: opportunities.title,
      value: opportunities.value,
      probability: opportunities.probability,
      expectedCloseDate: opportunities.expectedCloseDate,
      stageId: opportunities.stageId,
      ownerId: opportunities.ownerId,
      wonDate: opportunities.wonDate,
      lostDate: opportunities.lostDate,
      createdAt: opportunities.createdAt,
    }).from(opportunities),
    db.select().from(stages).orderBy(stages.order),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);

  const stageMap = new Map(allStages.map(s => [s.id, s]));
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  // Won/Lost counts
  const wonStages = allStages.filter(s => s.isWon).map(s => s.id);
  const lostStages = allStages.filter(s => s.isLost).map(s => s.id);
  const wonOpps = allOpportunities.filter(o => wonStages.includes(o.stageId));
  const lostOpps = allOpportunities.filter(o => lostStages.includes(o.stageId));
  const openOpps = allOpportunities.filter(o => !wonStages.includes(o.stageId) && !lostStages.includes(o.stageId));

  const winRate = (wonOpps.length + lostOpps.length) > 0
    ? Math.round((wonOpps.length / (wonOpps.length + lostOpps.length)) * 100)
    : 0;

  const totalPipeline = openOpps.reduce((sum, o) => sum + (o.value || 0), 0);
  const weightedForecast = openOpps.reduce((sum, o) => sum + (o.value || 0) * (o.probability || 0) / 100, 0);

  // Monthly weighted pipeline (next 12 months)
  const now = new Date();
  const monthlyData: { month: string; label: string; weighted: number; total: number; count: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const monthDate = addMonths(now, i);
    const monthKey = format(monthDate, 'yyyy-MM');
    const label = format(monthDate, 'MMM yy');
    const monthOpps = openOpps.filter(o => {
      if (!o.expectedCloseDate) return false;
      return o.expectedCloseDate.startsWith(monthKey);
    });
    monthlyData.push({
      month: monthKey,
      label,
      weighted: monthOpps.reduce((s, o) => s + (o.value || 0) * (o.probability || 0) / 100, 0),
      total: monthOpps.reduce((s, o) => s + (o.value || 0), 0),
      count: monthOpps.length,
    });
  }

  // Closing this month
  const thisMonthKey = format(now, 'yyyy-MM');
  const closingThisMonth = openOpps
    .filter(o => o.expectedCloseDate?.startsWith(thisMonthKey))
    .map(o => ({
      ...o,
      stageName: stageMap.get(o.stageId)?.name || 'Unknown',
      ownerName: userMap.get(o.ownerId || '')?.name || 'Unknown',
    }))
    .sort((a, b) => (b.value || 0) - (a.value || 0));

  // Quarter pipeline (current quarter)
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterKeys = [0, 1, 2].map(i => format(new Date(now.getFullYear(), quarterMonth + i, 1), 'yyyy-MM'));
  const closingThisQuarter = openOpps.filter(o => o.expectedCloseDate && quarterKeys.some(q => o.expectedCloseDate!.startsWith(q)));
  const quarterPipeline = closingThisQuarter.reduce((s, o) => s + (o.value || 0) * (o.probability || 0) / 100, 0);

  // By owner
  const ownerPipeline = allUsers.map(u => {
    const ownerOpps = openOpps.filter(o => o.ownerId === u.id);
    return {
      id: u.id,
      name: u.name,
      pipeline: ownerOpps.reduce((s, o) => s + (o.value || 0), 0),
      weighted: ownerOpps.reduce((s, o) => s + (o.value || 0) * (o.probability || 0) / 100, 0),
      count: ownerOpps.length,
    };
  }).filter(o => o.count > 0).sort((a, b) => b.pipeline - a.pipeline);

  // Win/loss trend (last 6 months)
  const winLossTrend = Array.from({ length: 6 }, (_, i) => {
    const m = subMonths(now, 5 - i);
    const key = format(m, 'yyyy-MM');
    return {
      label: format(m, 'MMM'),
      won: wonOpps.filter(o => o.wonDate?.startsWith(key)).length,
      lost: lostOpps.filter(o => o.lostDate?.startsWith(key)).length,
    };
  });

  return {
    user: locals.user,
    summary: { totalPipeline, weightedForecast, quarterPipeline, winRate, openCount: openOpps.length },
    monthlyData,
    closingThisMonth,
    ownerPipeline,
    winLossTrend,
  };
};
