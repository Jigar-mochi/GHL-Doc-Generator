import groqClient from '../config/groq.js';

const SYSTEM_PROMPT = `You are a senior technical consultant specializing in Go High Level (GHL) CRM implementations. You create formal Technical Approach Documents (TADs) for clients. Based on the client communication provided, extract requirements and generate a comprehensive, professional TAD.

Return ONLY a valid JSON object with this exact structure — no markdown, no explanation, just the JSON:
{
  "clientName": "string",
  "projectName": "string",
  "executiveSummary": "string",
  "projectObjectives": ["string"],
  "currentChallenges": ["string"],
  "proposedSolution": {
    "overview": "string",
    "keyFeatures": ["string"],
    "ghlModulesUsed": ["string"]
  },
  "technicalArchitecture": {
    "overview": "string",
    "components": [{ "name": "string", "description": "string", "implementation": "string" }]
  },
  "implementationPlan": {
    "phases": [{
      "phase": 1,
      "name": "string",
      "duration": "string",
      "tasks": ["string"],
      "deliverables": ["string"]
    }]
  },
  "integrations": [{ "name": "string", "purpose": "string", "method": "string" }],
  "automations": [{ "name": "string", "trigger": "string", "actions": ["string"], "outcome": "string" }],
  "dataManagement": {
    "strategy": "string",
    "dataPoints": ["string"]
  },
  "securityCompliance": ["string"],
  "testingQA": {
    "approach": "string",
    "testCases": ["string"]
  },
  "trainingSupport": {
    "plan": "string",
    "resources": ["string"]
  },
  "timeline": "string",
  "investmentSummary": {
    "setupFee": "string",
    "monthlyRetainer": "string",
    "notes": "string"
  },
  "risksMitigations": [{ "risk": "string", "mitigation": "string" }],
  "successMetrics": ["string"],
  "nextSteps": ["string"]
}

If clientName or projectName were provided by the user, use those values. Otherwise extract them from the content. If truly unknown, use "Client" and "GHL Implementation Project" as defaults. Never leave fields empty — always provide professional, detailed content.`;

function buildUserMessage(clientName, projectName, content) {
  return `Client Name (if provided): ${clientName || 'Not specified'}
Project Name (if provided): ${projectName || 'Not specified'}
Client Communication:
${content}`;
}

async function callGroqForTAD(userMessage) {
  const completion = await groqClient.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.4,
    max_tokens: 8000,
  });

  return completion.choices[0]?.message?.content || '';
}

function parseJSON(raw) {
  // Strip potential markdown code fences
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

export async function generateTAD(clientName, projectName, content) {
  const userMessage = buildUserMessage(clientName, projectName, content);

  let raw = await callGroqForTAD(userMessage);

  try {
    return parseJSON(raw);
  } catch (firstError) {
    console.error('First JSON parse attempt failed:', firstError.message);
    // Retry with a stricter prompt
    const retryMessage = `${userMessage}\n\nIMPORTANT: You MUST return ONLY a raw JSON object. No markdown, no backticks, no explanation. Start your response with { and end with }.`;
    raw = await callGroqForTAD(retryMessage);
    try {
      return parseJSON(raw);
    } catch (secondError) {
      console.error('Second JSON parse attempt failed:', secondError.message);
      console.error('Raw AI response:', raw);
      const err = new Error('AI failed to return valid JSON after two attempts.');
      err.status = 500;
      throw err;
    }
  }
}
