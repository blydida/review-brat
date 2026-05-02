import { nanoid } from 'nanoid';
import type { RoleReview, ReviewRole } from '@/types/session';

export function parseRoleReview(text: string, role: ReviewRole): RoleReview {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ?? text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    return {
      role,
      summary: text.slice(0, 300),
      recommendations: [],
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    return {
      role,
      summary: parsed.summary ?? '',
      recommendations: (parsed.recommendations ?? []).map((r: Record<string, unknown>) => ({
        id: nanoid(),
        priority: r.priority ?? 'medium',
        category: r.category ?? 'General',
        issue: r.issue ?? '',
        suggestion: r.suggestion ?? '',
        affectedArea: r.affectedArea,
      })),
    };
  } catch {
    return {
      role,
      summary: text.slice(0, 300),
      recommendations: [],
    };
  }
}
