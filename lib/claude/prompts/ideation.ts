import type { Upload, ClarificationTurn, UnderstandingCard } from '@/types/session';

export const IDEATION_SYSTEM_PROMPT = `You are a senior product strategist and UX architect at a world-class product consultancy. Your role is to analyze product ideas and transform them into structured, actionable product specs.

You think deeply about:
- The real user problem being solved (not just the stated feature)
- Business viability and success metrics
- User flow clarity and cognitive load
- Edge cases and error states

Always respond in valid JSON as instructed. Be specific and concrete — avoid generic platitudes.`;

export function buildUnderstandingPrompt(
  textContent: string,
  imageUploads: Upload[],
  dsContext: string,
): Anthropic.MessageParam {
  const content: Anthropic.ContentBlockParam[] = [];

  if (dsContext) {
    content.push({ type: 'text', text: dsContext });
  }

  content.push({
    type: 'text',
    text: `Analyze the following product input and extract its essence.

${textContent ? `INPUT:\n${textContent}` : ''}

Return a JSON object with this exact structure:
{
  "userGoals": ["string", ...],      // 2-4 specific user goals/jobs-to-be-done
  "businessGoals": ["string", ...],  // 2-3 business objectives
  "keyMechanics": ["string", ...],   // 3-5 core product mechanics/features
  "needsClarification": boolean,     // true if input is too vague to proceed
  "clarifyingQuestions": ["string", ...] // 1-3 questions ONLY if needsClarification=true, else []
}

Be specific. User goals should start with "As a user, I want to..." or similar action-oriented phrasing.`,
  });

  for (const upload of imageUploads) {
    if (upload.mimeType.startsWith('image/')) {
      content.push({
        type: 'image',
        source: { type: 'url', url: upload.url },
      } as Anthropic.ImageBlockParam);
    }
  }

  return { role: 'user', content };
}

export function buildGenerationPrompt(
  understandingCard: UnderstandingCard,
  clarificationTurns: ClarificationTurn[],
  dsContext: string,
  imageUploads: Upload[],
): Anthropic.MessageParam {
  const clarificationContext = clarificationTurns.length > 0
    ? `\n\nCLARIFICATIONS PROVIDED:\n${clarificationTurns.map((t, i) =>
        t.questions.map((q, j) => `Q: ${q}\nA: ${t.answers[j] ?? '(not answered)'}`).join('\n')
      ).join('\n\n')}`
    : '';

  const content: Anthropic.ContentBlockParam[] = [];

  if (dsContext) {
    content.push({ type: 'text', text: dsContext });
  }

  content.push({
    type: 'text',
    text: `Based on this product understanding, generate a user flow diagram and screen specifications.

UNDERSTANDING:
- User Goals: ${understandingCard.userGoals.join('; ')}
- Business Goals: ${understandingCard.businessGoals.join('; ')}
- Key Mechanics: ${understandingCard.keyMechanics.join('; ')}${clarificationContext}

Produce TWO outputs:

1. A Mermaid flowchart in a \`\`\`mermaid code block using "flowchart LR" syntax. Show the complete user journey with decision points and error states.

2. A JSON array of screen descriptions (after the mermaid block):
\`\`\`json
[
  {
    "screenName": "string",           // Short, descriptive name
    "purpose": "string",              // What the user accomplishes here
    "components": ["string", ...],    // UI components used (from DS if available)
    "interactions": ["string", ...],  // Key user interactions
    "notes": "string"                 // Edge cases, empty states, or design notes
  }
]
\`\`\`

Include all screens visible in any uploaded images, plus any logically required screens not shown.`,
  });

  for (const upload of imageUploads) {
    if (upload.mimeType.startsWith('image/')) {
      content.push({
        type: 'image',
        source: { type: 'url', url: upload.url },
      } as Anthropic.ImageBlockParam);
    }
  }

  return { role: 'user', content };
}

// Needed for Anthropic SDK type reference in this file
import type Anthropic from '@anthropic-ai/sdk';
