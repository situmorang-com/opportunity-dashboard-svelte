import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type DealCoachResponse = {
  dealSummary: string;
  riskFactors: { risk: string; severity: 'high' | 'medium' | 'low'; mitigation: string }[];
  nextActions: { action: string; priority: 'high' | 'medium' | 'low'; rationale: string }[];
  winStrategy: string;
  keyTalkingPoints: string[];
};

export async function analyzeDeal(opportunityData: Record<string, unknown>): Promise<DealCoachResponse> {
  const prompt = `You are an expert Microsoft Fabric sales coach. Analyze this sales opportunity and provide strategic guidance.

Opportunity Data:
${JSON.stringify(opportunityData, null, 2)}

Respond with ONLY valid JSON (no markdown, no explanation) in exactly this structure:
{
  "dealSummary": "2-3 sentence summary of deal status and outlook",
  "riskFactors": [
    {"risk": "description", "severity": "high|medium|low", "mitigation": "suggested mitigation"}
  ],
  "nextActions": [
    {"action": "specific action", "priority": "high|medium|low", "rationale": "why this matters"}
  ],
  "winStrategy": "paragraph describing the overall strategy to win this deal",
  "keyTalkingPoints": ["point 1", "point 2", "point 3", "point 4"]
}

Provide 3-5 risk factors, 3-5 next actions, and 4-6 talking points. Be specific and actionable.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return JSON.parse(text) as DealCoachResponse;
}
