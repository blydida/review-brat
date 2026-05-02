import { NextResponse } from 'next/server';
import { getSession, updateSessionStatus, setAnalysisResult } from '@/lib/storage/redis';
import { anthropic, DEFAULT_MODEL } from '@/lib/claude/client';
import { buildDesignSystemContext } from '@/lib/claude/prompts/design-system';
import { PM_SYSTEM_PROMPT, PM_REVIEW_INSTRUCTION } from '@/lib/claude/prompts/roles/pm';
import { DESIGN_LEAD_SYSTEM_PROMPT, DESIGN_LEAD_REVIEW_INSTRUCTION } from '@/lib/claude/prompts/roles/design-lead';
import { DEVELOPER_SYSTEM_PROMPT, DEVELOPER_REVIEW_INSTRUCTION } from '@/lib/claude/prompts/roles/developer';
import { parseRoleReview } from '@/lib/claude/parsers/role-review';
import type { ReviewRole, RoleReview } from '@/types/session';

export const maxDuration = 120;

function buildContextSummary(session: Awaited<ReturnType<typeof getSession>>): string {
  if (!session) return '';
  const result = session.analysisResult;
  if (!result) return '';

  const parts: string[] = [];

  if (result.understandingCard) {
    const uc = result.understandingCard;
    parts.push(`USER GOALS: ${uc.userGoals.join('; ')}`);
    parts.push(`BUSINESS GOALS: ${uc.businessGoals.join('; ')}`);
    parts.push(`KEY MECHANICS: ${uc.keyMechanics.join('; ')}`);
  }

  if (result.flowAnalysis) {
    const fa = result.flowAnalysis;
    parts.push(`FLOW SUMMARY: ${fa.logicSummary}`);
    const weakStr = fa.weakSpots.map((w) => `${w.location}: ${w.issue} (${w.severity})`).join('; ');
    if (weakStr) parts.push(`KNOWN WEAK SPOTS: ${weakStr}`);
  }

  if (result.screenDescriptions && result.screenDescriptions.length > 0) {
    const screens = result.screenDescriptions.map((s) => `${s.screenName}: ${s.purpose}`).join(' | ');
    parts.push(`SCREENS: ${screens}`);
  }

  return parts.join('\n');
}

const ROLES: Array<{ role: ReviewRole; system: string; instruction: string }> = [
  { role: 'pm', system: PM_SYSTEM_PROMPT, instruction: PM_REVIEW_INSTRUCTION },
  { role: 'design-lead', system: DESIGN_LEAD_SYSTEM_PROMPT, instruction: DESIGN_LEAD_REVIEW_INSTRUCTION },
  { role: 'developer', system: DEVELOPER_SYSTEM_PROMPT, instruction: DEVELOPER_REVIEW_INSTRUCTION },
];

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId } = body as { sessionId: string };

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const contextSummary = buildContextSummary(session);
  const dsContext = buildDesignSystemContext(session.designSystem);
  const fullContext = [dsContext, contextSummary].filter(Boolean).join('\n\n');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (phase: string, data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase, data })}\n\n`));
      };

      try {
        await updateSessionStatus(sessionId, 'reviewing');
        send('status', 'reviewing');

        // Run all three role reviews in parallel
        const reviewPromises = ROLES.map(async ({ role, system, instruction }) => {
          const contextBlock = {
            type: 'text' as const,
            text: fullContext,
            cache_control: { type: 'ephemeral' as const },
          };
          const instructionBlock = { type: 'text' as const, text: instruction };

          const response = await anthropic.messages.create({
            model: DEFAULT_MODEL,
            max_tokens: 2048,
            system,
            messages: [
              {
                role: 'user' as const,
                content: [contextBlock, instructionBlock] as Parameters<typeof anthropic.messages.create>[0]['messages'][0]['content'],
              },
            ],
          });

          const text = response.content
            .filter((b) => b.type === 'text')
            .map((b) => (b as { type: 'text'; text: string }).text)
            .join('');

          return parseRoleReview(text, role);
        });

        // Stream results as each completes
        const results = await Promise.allSettled(reviewPromises);
        const roleReviews: RoleReview[] = [];

        for (const result of results) {
          if (result.status === 'fulfilled') {
            roleReviews.push(result.value);
            send('role_review', result.value);
          }
        }

        await setAnalysisResult(sessionId, { roleReviews });
        await updateSessionStatus(sessionId, 'complete');
        send('status', 'complete');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Review failed';
        await updateSessionStatus(sessionId, 'error', msg);
        send('error', msg);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
