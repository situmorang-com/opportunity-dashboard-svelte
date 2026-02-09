import {
  db,
  activities,
  opportunities,
  clients,
  stages,
  users,
} from "$lib/server/db";
import { asc, eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const [meetings, availableOpportunities] = await Promise.all([
    db
      .select({
        id: activities.id,
        title: activities.title,
        description: activities.description,
        scheduledAt: activities.scheduledAt,
        completedAt: activities.completedAt,
        outcome: activities.outcome,
        status: activities.status,
        duration: activities.duration,
        opportunity: {
          id: opportunities.id,
          title: opportunities.title,
          value: opportunities.value,
          immediateNextStep: opportunities.immediateNextStep,
        },
        client: {
          id: clients.id,
          name: clients.name,
        },
        stage: {
          id: stages.id,
          name: stages.name,
        },
        owner: {
          id: users.id,
          name: users.name,
        },
      })
      .from(activities)
      .leftJoin(opportunities, eq(activities.opportunityId, opportunities.id))
      .leftJoin(clients, eq(opportunities.clientId, clients.id))
      .leftJoin(stages, eq(opportunities.stageId, stages.id))
      .leftJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.type, "meeting"))
      .orderBy(asc(activities.scheduledAt)),
    db
      .select({
        id: opportunities.id,
        title: opportunities.title,
        value: opportunities.value,
        client: {
          id: clients.id,
          name: clients.name,
        },
        stage: {
          id: stages.id,
          name: stages.name,
        },
      })
      .from(opportunities)
      .leftJoin(clients, eq(opportunities.clientId, clients.id))
      .leftJoin(stages, eq(opportunities.stageId, stages.id))
      .orderBy(asc(opportunities.title)),
  ]);

  return {
    user: locals.user,
    meetings,
    opportunities: availableOpportunities,
  };
};
