import { NextResponse } from 'next/server';
import { getSession, updateSessionStatus, setAnalysisResult } from '@/lib/storage/redis';
import { anthropic, DEFAULT_MODEL } from '@/lib/claude/client';
import { buildDesignSystemContext } from '@/lib/claude/prompts/design-system';
import { FLOW_REVIEW_SYSTEM_PROMPT, buildFlowReviewPrompt } from '@/lib/claude/prompts/flow-review';
import { analyzeSchema } from '@/lib/utils/schema';

export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, goal } = analyzeSchema.parse(body);

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.mode !== 'flow-review') {
    return NextResponse.json({ error: 'Wrong mode' }, { status: 400 });
  }

  const imageUploads = session.uploads.filter((u) => !u.isDesignSystem && u.mimeType.startsWith('image/'));
  if (imageUploads.length < 1) {
    return NextResponse.json({ error: 'At least 1 screenshot required' }, { status: 400 });
  }

  const dsContext = buildDesignSystemContext(session.designSystem);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (phase: string, data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase, data })}\n\n`));
      };

      try {
        await updateSessionStatus(sessionId, 'analyzing');
        send('status', 'analyzing');

        const reviewMessage = buildFlowReviewPrompt(imageUploads, goal ?? '', dsContext);

        const response = await anthropic.messages.create({
          model: DEFAULT_MODEL,
          max_tokens: 8192,
          system: FLOW_REVIEW_SYSTEM_PROMPT,
          messages: [reviewMessage],
        });

        const responseText = response.content
          .filter((b) => b.type === 'text')
          .map((b) => (b as { type: 'text'; text: string }).text)
          .join('');

        // Parse flow analysis from response
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ?? responseText.match(/(\{[\s\S]*\})/);
        let flowAnalysis = {
          logicSummary: '',
          clarityScores: [] as Array<{ screenIndex: number; score: number; rationale: string }>,
          weakSpots: [] as Array<{ location: string; issue: string; severity: 'low' | 'medium' | 'high' }>,
        };

        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            flowAnalysis = {
              logicSummary: parsed.logicSummary ?? '',
              clarityScores: parsed.clarityScores ?? [],
              weakSpots: parsed.weakSpots ?? [],
            };
          } catch {
            flowAnalysis.logicSummary = responseText.slice(0, 500);
          }
        }

        await setAnalysisResult(sessionId, { flowAnalysis });
        await updateSessionStatus(sessionId, 'reviewing');
        send('flow_analysis', flowAnalysis);
        send('status', 'reviewing');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Analysis failed';
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
