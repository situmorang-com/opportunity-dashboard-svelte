import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type AutoDiscoveryResult = {
  currentInfrastructure?: string;
  dataSources?: string[];
  integrationPoints?: string;
  securityRequirements?: string;
  complianceNeeds?: string;
  businessObjective?: string;
  expectedRoi?: string;
  successMetrics?: string;
  budgetRange?: string;
  assumptions?: string;
  constraints?: string;
  stakeholderAlignment?: string;
  requiredSkills?: string;
  technicalReadiness?: number;
  checklistItems?: Record<string, boolean>;
  filledCount?: number;
};

export async function extractDiscoveryFromNotes(
  meetingNotes: string,
  context: { title: string; client?: string; stage?: string; workloads?: string[] }
): Promise<AutoDiscoveryResult> {
  const prompt = `You are a Microsoft Fabric sales specialist. Extract structured discovery information from these meeting notes for a sales opportunity.

Opportunity: "${context.title}" ${context.client ? `at ${context.client}` : ''} (Stage: ${context.stage || 'Discovery'})
Fabric Workloads in scope: ${context.workloads?.join(', ') || 'TBD'}

Meeting Notes:
${meetingNotes}

Extract any mentioned information and respond with ONLY valid JSON (no markdown):
{
  "currentInfrastructure": "string or null",
  "dataSources": ["array", "of", "data", "sources"] or null,
  "integrationPoints": "string or null",
  "securityRequirements": "string or null",
  "complianceNeeds": "string or null",
  "businessObjective": "string or null",
  "expectedRoi": "string or null",
  "successMetrics": "string or null",
  "budgetRange": "string or null",
  "assumptions": "string or null",
  "constraints": "string or null",
  "stakeholderAlignment": "string or null",
  "requiredSkills": "string or null",
  "technicalReadiness": number 1-5 or null
}

Only populate fields where the information is clearly mentioned. Use null for fields not covered.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
  const result = JSON.parse(text) as AutoDiscoveryResult;

  // Count filled fields
  const filledCount = Object.values(result).filter(v =>
    v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  ).length;

  return { ...result, filledCount };
}
