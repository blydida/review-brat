import type { UnderstandingCard } from '@/types/session';

export interface UnderstandingResponse {
  understandingCard: UnderstandingCard;
  needsClarification: boolean;
  clarifyingQuestions: string[];
}

export function parseUnderstandingResponse(text: string): UnderstandingResponse {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ?? text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) throw new Error('No JSON found in understanding response');

  const parsed = JSON.parse(jsonMatch[1]);

  return {
    understandingCard: {
      userGoals: parsed.userGoals ?? [],
      businessGoals: parsed.businessGoals ?? [],
      keyMechanics: parsed.keyMechanics ?? [],
    },
    needsClarification: parsed.needsClarification ?? false,
    clarifyingQuestions: parsed.clarifyingQuestions ?? [],
  };
}
