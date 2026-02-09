import { json } from "@sveltejs/kit";
import { db, opportunities, activities, stages } from "$lib/server/db";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    // Basic fields
    const title = formData.get("title") as string;
    const clientId = formData.get("clientId") as string;
    const stageId = formData.get("stageId") as string;
    const ownerId = formData.get("ownerId") as string;
    const value = formData.get("value") as string;
    const probability = formData.get("probability") as string;
    const expectedCloseDate = formData.get("expectedCloseDate") as string;
    const description = formData.get("description") as string;

    // Fabric fields
    const fabricWorkloads = formData.get("fabricWorkloads") as string;
    const capacityUnits = formData.get("capacityUnits") as string;
    const estimatedLicenseCost = formData.get("estimatedLicenseCost") as string;
    const estimatedServicesCost = formData.get(
      "estimatedServicesCost",
    ) as string;
    const migrationSource = formData.get("migrationSource") as string;
    const competitor = formData.get("competitor") as string;
    const projectDuration = formData.get("projectDuration") as string;

    // Lead & Partner Info
    const leadSource = formData.get("leadSource") as string;
    const partnerPic = formData.get("partnerPic") as string;

    // Authority (Decision Maker)
    const authorityName = formData.get("authorityName") as string;
    const authorityTitle = formData.get("authorityTitle") as string;
    const authorityContact = formData.get("authorityContact") as string;
    const authorityEmail = formData.get("authorityEmail") as string;

    // Champion
    const championName = formData.get("championName") as string;
    const championTitle = formData.get("championTitle") as string;
    const championContact = formData.get("championContact") as string;
    const championEmail = formData.get("championEmail") as string;

    // Engagement
    const engagementTeam = formData.get("engagementTeam") as string;
    const documentsFolder = formData.get("documentsFolder") as string;
    const immediateNextStep = formData.get("immediateNextStep") as string;
    const timeline = formData.get("timeline") as string;

    // Detailed Info
    const objectives = formData.get("objectives") as string;
    const keyPainPoints = formData.get("keyPainPoints") as string;
    const initiatives = formData.get("initiatives") as string;
    const potentialRoadblocks = formData.get("potentialRoadblocks") as string;
    const engagementSummary = formData.get("engagementSummary") as string;

    if (!title) {
      return json({ error: "Title is required" }, { status: 400 });
    }

    // Get stage probability if not provided
    let oppProbability = probability ? parseInt(probability) : null;
    if (!oppProbability && stageId) {
      const [stage] = await db
        .select()
        .from(stages)
        .where(eq(stages.id, parseInt(stageId)));
      if (stage) {
        oppProbability = stage.probability;
      }
    }

    const [newOpportunity] = await db
      .insert(opportunities)
      .values({
        title,
        clientId: clientId ? parseInt(clientId) : null,
        stageId: parseInt(stageId) || 1,
        ownerId: ownerId || locals.user.id,
        value: value ? parseFloat(value) : 0,
        probability: oppProbability || 0,
        expectedCloseDate: expectedCloseDate || null,
        description: description || null,
        // Fabric fields
        fabricWorkloads: fabricWorkloads ? JSON.parse(fabricWorkloads) : [],
        capacityUnits: capacityUnits ? parseInt(capacityUnits) : null,
        estimatedLicenseCost: estimatedLicenseCost
          ? parseFloat(estimatedLicenseCost)
          : null,
        estimatedServicesCost: estimatedServicesCost
          ? parseFloat(estimatedServicesCost)
          : null,
        migrationSource: migrationSource || null,
        competitor: competitor || null,
        projectDuration: projectDuration || null,
        // Lead & Partner Info
        leadSource: leadSource || null,
        partnerPic: partnerPic || null,
        // Authority
        authorityName: authorityName || null,
        authorityTitle: authorityTitle || null,
        authorityContact: authorityContact || null,
        authorityEmail: authorityEmail || null,
        // Champion
        championName: championName || null,
        championTitle: championTitle || null,
        championContact: championContact || null,
        championEmail: championEmail || null,
        // Engagement
        engagementTeam: engagementTeam || null,
        documentsFolder: documentsFolder || null,
        immediateNextStep: immediateNextStep || null,
        timeline: timeline || null,
        // Detailed Info
        objectives: objectives || null,
        keyPainPoints: keyPainPoints || null,
        initiatives: initiatives || null,
        potentialRoadblocks: potentialRoadblocks || null,
        engagementSummary: engagementSummary || null,
      })
      .returning();

    // Create activity for new opportunity
    await db.insert(activities).values({
      opportunityId: newOpportunity.id,
      userId: locals.user.id,
      type: "note",
      title: "Created opportunity",
    });

    return json(newOpportunity, { status: 201 });
  } catch (error) {
    console.error("Error creating opportunity:", error);
    return json({ error: "Failed to create opportunity" }, { status: 500 });
  }
};
