import type Anthropic from '@anthropic-ai/sdk';
import type { Upload } from '@/types/session';

export const FLOW_REVIEW_SYSTEM_PROMPT = `You are a senior UX researcher and product analyst specializing in user flow optimization. You evaluate product flows with the same rigor a top-tier usability researcher would apply in a cognitive walkthrough.

You assess:
- Logical coherence of the flow (does each step lead naturally to the next?)
- User cognitive load and clarity at each screen
- Drop-off risks and points of confusion
- Missing states, error handling, and edge cases

Always respond in valid JSON as instructed. Be specific — reference actual screen content, not generic advice.`;

export function buildFlowReviewPrompt(
  uploads: Upload[],
  goal: string,
  dsContext: string,
): Anthropic.MessageParam {
  const sortedUploads = [...uploads].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const content: Anthropic.ContentBlockParam[] = [];

  if (dsContext) {
    content.push({ type: 'text', text: dsContext });
  }

  content.push({
    type: 'text',
    text: `Analyze this user flow as a complete, cohesive scenario.

SCENARIO GOAL: ${goal || 'Not specified — infer from the screens'}

The following ${sortedUploads.length} screens are shown in order (Screen 1 → Screen ${sortedUploads.length}):`,
  });

  for (let i = 0; i < sortedUploads.length; i++) {
    const upload = sortedUploads[i];
    if (upload.mimeType.startsWith('image/')) {
      content.push({
        type: 'text',
        text: `Screen ${i + 1}: ${upload.filename}`,
      });
      content.push({
        type: 'image',
        source: { type: 'url', url: upload.url },
      } as Anthropic.ImageBlockParam);
    }
  }

  content.push({
    type: 'text',
    text: `
Return a JSON object with this exact structure:
{
  "logicSummary": "string",    // 2-3 sentences: what this flow does and the overall logic
  "clarityScores": [
    {
      "screenIndex": number,   // 0-based index
      "score": number,         // 0-10 clarity score
      "rationale": "string"    // Why this score — what's clear or unclear
    }
  ],
  "weakSpots": [
    {
      "location": "string",    // Screen name or transition (e.g., "Screen 2 → Screen 3")
      "issue": "string",       // Specific problem
      "severity": "low" | "medium" | "high"
    }
  ]
}

Evaluate EVERY screen in clarityScores. Focus weakSpots on the 3-5 most impactful issues.`,
  });

  return { role: 'user', content };
}
