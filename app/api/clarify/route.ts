import { NextResponse } from 'next/server';
import { getSession, updateSessionStatus, setAnalysisResult } from '@/lib/storage/redis';
import { anthropic, DEFAULT_MODEL } from '@/lib/claude/client';
import { buildDesignSystemContext } from '@/lib/claude/prompts/design-system';
import { IDEATION_SYSTEM_PROMPT, buildUnderstandingPrompt, buildGenerationPrompt } from '@/lib/claude/prompts/ideation';
import { parseUnderstandingResponse } from '@/lib/claude/parsers/understanding-card';
import { parseGenerationResponse } from '@/lib/claude/parsers/flow-diagram';
import { clarifySchema } from '@/lib/utils/schema';

export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, answers } = clarifySchema.parse(body);

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const imageUploads = session.uploads.filter((u) => !u.isDesignSystem);
  const dsContext = buildDesignSystemContext(session.designSystem);
  const textContent = (body.textContent as string) ?? '';

  // Reconstruct the clarification turn
  const understandingCard = session.analysisResult?.understandingCard;
  if (!understandingCard) {
    return NextResponse.json({ error: 'No understanding card found' }, { status: 400 });
  }

  const existingTurns = session.analysisResult?.clarificationTurns ?? [];
  const lastQuestions = existingTurns.length > 0
    ? existingTurns[existingTurns.length - 1].questions
    : [];

  const newTurn = { questions: lastQuestions, answers };
  const allTurns = [...existingTurns, newTurn];

  await setAnalysisResult(sessionId, { clarificationTurns: allTurns });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (phase: string, data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase, data })}\n\n`));
      };

      try {
        await updateSessionStatus(sessionId, 'generating');
        send('status', 'generating');

        const understandingMessage = buildUnderstandingPrompt(textContent, imageUploads, dsContext);

        // Reconstruct original understanding text (approximate)
        const understandingText = JSON.stringify({
          userGoals: understandingCard.userGoals,
          businessGoals: understandingCard.businessGoals,
          keyMechanics: understandingCard.keyMechanics,
          needsClarification: true,
          clarifyingQuestions: lastQuestions,
        });

        const generationMessage = buildGenerationPrompt(understandingCard, allTurns, dsContext, imageUploads);

        let generationText = '';
        const genStream = await anthropic.messages.stream({
          model: DEFAULT_MODEL,
          max_tokens: 4096,
          system: IDEATION_SYSTEM_PROMPT,
          messages: [
            understandingMessage,
            { role: 'assistant', content: understandingText },
            generationMessage,
          ],
        });

        for await (const chunk of genStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            generationText += chunk.delta.text;
            send('generation_delta', chunk.delta.text);
          }
        }

        const { flowDiagram, screenDescriptions } = parseGenerationResponse(generationText);
        await setAnalysisResult(sessionId, { flowDiagram, screenDescriptions });
        await updateSessionStatus(sessionId, 'reviewing');
        send('generation_complete', { flowDiagram, screenDescriptions });
        send('status', 'reviewing');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Clarification failed';
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
