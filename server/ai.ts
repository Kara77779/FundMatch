import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const INTERVIEW_STAGES = [
  'solution',
  'customer',
  'goals',
  'context',
  'barriers',
  'unfair_advantages',
  'credentials',
  'funding',
  'complete'
];

const STAGE_PROMPTS: Record<string, string> = {
  solution: "What problem are you solving, and how does your solution address it? Tell me about your product or service.",
  customer: "Who is your ideal customer? Describe who would benefit most from your solution.",
  goals: "What goals are you trying to achieve? What does success look like for your startup?",
  context: "What's the market context? What trends or changes make this the right time for your solution?",
  barriers: "What barriers or challenges have you faced or expect to face? What's stopping competitors?",
  unfair_advantages: "What unfair advantages do you have? What makes you uniquely positioned to succeed?",
  credentials: "Tell me about your background and the team. What experience makes you the right people for this?",
  funding: "What type of funding are you seeking - equity investment, debt, or both? What's your funding goal?",
};

interface ConversationContext {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentStage: string;
  collected: Record<string, string>;
  projectName: string;
}

export async function processConversation(
  userMessage: string,
  context: ConversationContext
): Promise<{ response: string; newStage: string; collected: Record<string, string>; complete: boolean }> {
  const { messages, currentStage, collected, projectName } = context;

  const systemPrompt = `You are an expert startup advisor helping founders articulate their business through a Jobs-to-be-Done framework interview. You're interviewing the founder of "${projectName}".

Your goal is to collect detailed information through natural conversation. You're currently focused on understanding their ${currentStage.replace('_', ' ')}.

Current stage prompt: "${STAGE_PROMPTS[currentStage] || ''}"

Previously collected information:
${Object.entries(collected).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None yet'}

Guidelines:
1. Ask clarifying follow-up questions if the answer is vague or incomplete
2. Be encouraging but probe for specifics
3. When you have enough information about the current topic, acknowledge what you learned and naturally transition to the next topic
4. Keep responses concise (2-3 sentences max) and conversational
5. Extract and remember key information from their responses
6. When transitioning to a new topic, clearly signal this ("Great! Now let's talk about...")

After gathering sufficient information about a topic, respond with:
[STAGE_COMPLETE: topic_name]
[COLLECTED: key information summarized in 1-2 sentences]

If the interview is fully complete (all topics covered), respond with:
[INTERVIEW_COMPLETE]
[SUMMARY: brief overall summary]`;

  const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-5.1',
    messages: apiMessages,
    max_completion_tokens: 500,
  });

  const assistantMessage = response.choices[0]?.message?.content || '';
  
  // Parse response for stage completion markers
  let newStage = currentStage;
  const newCollected = { ...collected };
  let complete = false;

  if (assistantMessage.includes('[INTERVIEW_COMPLETE]')) {
    complete = true;
    newStage = 'complete';
  } else if (assistantMessage.includes('[STAGE_COMPLETE:')) {
    const stageMatch = assistantMessage.match(/\[STAGE_COMPLETE:\s*(\w+)\]/);
    const collectedMatch = assistantMessage.match(/\[COLLECTED:\s*([^\]]+)\]/);
    
    if (stageMatch && collectedMatch) {
      newCollected[stageMatch[1]] = collectedMatch[1];
      
      // Move to next stage
      const currentIdx = INTERVIEW_STAGES.indexOf(currentStage);
      if (currentIdx >= 0 && currentIdx < INTERVIEW_STAGES.length - 1) {
        newStage = INTERVIEW_STAGES[currentIdx + 1];
      }
    }
  }

  // Clean response of markers for display
  const cleanResponse = assistantMessage
    .replace(/\[STAGE_COMPLETE:[^\]]+\]/g, '')
    .replace(/\[COLLECTED:[^\]]+\]/g, '')
    .replace(/\[INTERVIEW_COMPLETE\]/g, '')
    .replace(/\[SUMMARY:[^\]]+\]/g, '')
    .trim();

  return {
    response: cleanResponse,
    newStage,
    collected: newCollected,
    complete,
  };
}

export async function generateOnePager(projectData: any): Promise<string> {
  const prompt = `Generate a professional one-pager document for an investor based on this startup information:

Project: ${projectData.name}
Solution: ${projectData.solution || 'Not provided'}
Target Customer: ${projectData.customer || 'Not provided'}
Goals: ${projectData.goals || 'Not provided'}
Market Context: ${projectData.context || 'Not provided'}
Barriers/Challenges: ${projectData.barriers || 'Not provided'}
Unfair Advantages: ${projectData.unfairAdvantages?.join(', ') || 'Not provided'}
Founder Credentials: ${projectData.credentials || 'Not provided'}
Funding Type: ${projectData.fundingTypeAccepted?.join(', ') || 'Not specified'}
Funding Goal: $${projectData.fundingGoal?.toLocaleString() || 'Not specified'}

${projectData.fundingTypeAccepted?.includes('equity') ? `
Equity Terms:
- Valuation Range: $${projectData.valuationMin?.toLocaleString()} - $${projectData.valuationMax?.toLocaleString()}
- Max Equity: ${projectData.equityMaxPercentage}%
` : ''}

${projectData.fundingTypeAccepted?.includes('debt') ? `
Debt Terms:
- Type: ${projectData.debtType}
- Expected Interest Rate: ${projectData.expectedInterestRate}%
- Repayment Period: ${projectData.repaymentMonths} months
${projectData.debtType === 'revenue_share' ? `- Revenue Share: ${projectData.revenueSharePercentage}% until ${projectData.revenueShareCapMultiple}x cap` : ''}
` : ''}

Create a structured one-pager with these sections:
1. Executive Summary (2-3 sentences)
2. The Problem
3. Our Solution
4. Target Market
5. Competitive Advantage
6. Team
7. Investment Opportunity
8. Use of Funds

Format it in clean markdown. Be compelling but honest. Focus on the value proposition.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-5.1',
    messages: [{ role: 'user', content: prompt }],
    max_completion_tokens: 2000,
  });

  return response.choices[0]?.message?.content || '';
}

export async function analyzeHealthScore(projectData: any): Promise<{
  problem: number;
  solution: number;
  customer: number;
  founder: number;
  market: number;
  suggestions: string[];
}> {
  const prompt = `Analyze this startup and provide health scores (0-100) for each dimension, plus 3-5 specific improvement suggestions.

Project: ${projectData.name}
Solution: ${projectData.solution || 'Not provided'}
Target Customer: ${projectData.customer || 'Not provided'}
Goals: ${projectData.goals || 'Not provided'}
Market Context: ${projectData.context || 'Not provided'}
Barriers/Challenges: ${projectData.barriers || 'Not provided'}
Unfair Advantages: ${projectData.unfairAdvantages?.join(', ') || 'Not provided'}
Founder Credentials: ${projectData.credentials || 'Not provided'}

Score each dimension based on:
- Problem (0-100): Is the problem clearly defined, significant, and urgent?
- Solution (0-100): Is the solution compelling, differentiated, and feasible?
- Customer (0-100): Is the target customer well-defined and accessible?
- Founder (0-100): Does the team have relevant experience and unique insights?
- Market (0-100): Is the market timing right and size appropriate?

Respond in JSON format:
{
  "problem": <score>,
  "solution": <score>,
  "customer": <score>,
  "founder": <score>,
  "market": <score>,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-5.1',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_completion_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content);
}

export async function getNextInterviewPrompt(stage: string, projectName: string): Promise<string> {
  if (stage === 'complete') {
    return "Great job! You've completed the interview. Your responses have been saved. You can now generate your one-pager and publish your project to the marketplace.";
  }
  
  return `Let's talk about your ${stage.replace('_', ' ')}. ${STAGE_PROMPTS[stage] || ''}`;
}
