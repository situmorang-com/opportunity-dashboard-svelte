import { json } from '@sveltejs/kit';
import { db, opportunities, clients, stages, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { generateProposalDocx, generateProposalPptx } from '$lib/server/proposal-generators';
import { format } from 'date-fns';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  const opportunityId = parseInt(params.id);
  if (isNaN(opportunityId)) return json({ error: 'Invalid ID' }, { status: 400 });

  const { format: outputFormat } = await request.json();
  if (!['docx', 'pptx'].includes(outputFormat)) {
    return json({ error: 'Invalid format. Use "docx" or "pptx"' }, { status: 400 });
  }

  try {
    const [result] = await db
      .select({
        opportunity: opportunities,
        client: clients,
        owner: { id: users.id, name: users.name, email: users.email },
      })
      .from(opportunities)
      .leftJoin(clients, eq(opportunities.clientId, clients.id))
      .leftJoin(users, eq(opportunities.ownerId, users.id))
      .where(eq(opportunities.id, opportunityId));

    if (!result) return json({ error: 'Opportunity not found' }, { status: 404 });

    const proposalData = {
      title: result.opportunity.title,
      clientName: result.client?.name,
      clientIndustry: result.client?.industry,
      ownerName: result.owner?.name,
      ownerEmail: result.owner?.email,
      description: result.opportunity.description,
      objectives: result.opportunity.objectives,
      keyPainPoints: result.opportunity.keyPainPoints,
      initiatives: result.opportunity.initiatives,
      fabricWorkloads: Array.isArray(result.opportunity.fabricWorkloads)
        ? result.opportunity.fabricWorkloads
        : JSON.parse((result.opportunity.fabricWorkloads as string) || '[]'),
      migrationSource: result.opportunity.migrationSource,
      estimatedLicenseCost: result.opportunity.estimatedLicenseCost,
      estimatedServicesCost: result.opportunity.estimatedServicesCost,
      value: result.opportunity.value,
      projectDuration: result.opportunity.projectDuration,
      timeline: result.opportunity.timeline,
      engagementTeam: result.opportunity.engagementTeam,
      immediateNextStep: result.opportunity.immediateNextStep,
      expectedCloseDate: result.opportunity.expectedCloseDate,
      generatedDate: format(new Date(), 'MMMM d, yyyy'),
    };

    let buffer: Buffer;
    let contentType: string;
    let fileName: string;

    if (outputFormat === 'docx') {
      buffer = await generateProposalDocx(proposalData);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileName = `${result.opportunity.title.replace(/\s+/g, '_')}_Proposal.docx`;
    } else {
      buffer = await generateProposalPptx(proposalData);
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      fileName = `${result.opportunity.title.replace(/\s+/g, '_')}_Proposal.pptx`;
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('Proposal generation error:', err);
    return json({ error: 'Failed to generate proposal' }, { status: 500 });
  }
};
