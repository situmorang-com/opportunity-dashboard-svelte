import { json, error } from "@sveltejs/kit";
import { db, opportunities, activities } from "$lib/server/db";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const PUT: RequestHandler = async ({ request, params, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const opportunityId = parseInt(params.id);
  if (isNaN(opportunityId)) {
    return json({ error: "Invalid opportunity ID" }, { status: 400 });
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

    const [updatedOpportunity] = await db
      .update(opportunities)
      .set({
        title,
        clientId: clientId ? parseInt(clientId) : null,
        stageId: parseInt(stageId) || 1,
        ownerId: ownerId || locals.user.id,
        value: value ? parseFloat(value) : 0,
        probability: probability ? parseInt(probability) : 0,
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
        // Update timestamp
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, opportunityId))
      .returning();

    if (!updatedOpportunity) {
      return json({ error: "Opportunity not found" }, { status: 404 });
    }

    // Create activity for update
    await db.insert(activities).values({
      opportunityId: opportunityId,
      userId: locals.user.id,
      type: "note",
      title: "Updated opportunity",
    });

    return json(updatedOpportunity);
  } catch (err) {
    console.error("Error updating opportunity:", err);
    return json({ error: "Failed to update opportunity" }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const opportunityId = parseInt(params.id);
  if (isNaN(opportunityId)) {
    return json({ error: "Invalid opportunity ID" }, { status: 400 });
  }

  try {
    // Delete related activities first
    await db
      .delete(activities)
      .where(eq(activities.opportunityId, opportunityId));

    // Delete opportunity
    await db.delete(opportunities).where(eq(opportunities.id, opportunityId));

    return json({ success: true });
  } catch (err) {
    console.error("Error deleting opportunity:", err);
    return json({ error: "Failed to delete opportunity" }, { status: 500 });
  }
};
