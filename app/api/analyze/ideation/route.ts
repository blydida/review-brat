import { NextResponse } from 'next/server';
import { getSession, updateSessionStatus, setAnalysisResult } from '@/lib/storage/redis';
import { anthropic, DEFAULT_MODEL } from '@/lib/claude/client';
import { buildDesignSystemContext } from '@/lib/claude/prompts/design-system';
import { IDEATION_SYSTEM_PROMPT, buildUnderstandingPrompt, buildGenerationPrompt } from '@/lib/claude/prompts/ideation';
import { parseUnderstandingResponse } from '@/lib/claude/parsers/understanding-card';
import { parseGenerationResponse } from '@/lib/claude/parsers/flow-diagram';
import { analyzeSchema } from '@/lib/utils/schema';

export const maxDuration = 120;

export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId } = analyzeSchema.parse(body);

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (session.mode !== 'ideation') {
    return NextResponse.json({ error: 'Wrong mode' }, { status: 400 });
  }

  const imageUploads = session.uploads.filter((u) => !u.isDesignSystem);
  const dsContext = buildDesignSystemContext(session.designSystem);

  // Extract text content from text uploads (handled client-side as textarea for now)
  const textContent = (body.textContent as string) ?? '';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (phase: string, data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ phase, data })}\n\n`));
      };

      try {
        // Phase 1: Understanding
        await updateSessionStatus(sessionId, 'understanding');
        send('status', 'understanding');

        const understandingMessage = buildUnderstandingPrompt(textContent, imageUploads, dsContext);
        const understandingResponse = await anthropic.messages.create({
          model: DEFAULT_MODEL,
          max_tokens: 1024,
          system: IDEATION_SYSTEM_PROMPT,
          messages: [understandingMessage],
        });

        const understandingText = understandingResponse.content
          .filter((b) => b.type === 'text')
          .map((b) => (b as { type: 'text'; text: string }).text)
          .join('');

        const { understandingCard, needsClarification, clarifyingQuestions } =
          parseUnderstandingResponse(understandingText);

        await setAnalysisResult(sessionId, { understandingCard });
        send('understanding', { understandingCard, needsClarification, clarifyingQuestions });

        if (needsClarification) {
          await updateSessionStatus(sessionId, 'clarifying');
          send('status', 'clarifying');
          controller.close();
          return;
        }

        // Phase 3: Generation (no clarification needed)
        await updateSessionStatus(sessionId, 'generating');
        send('status', 'generating');

        const generationMessage = buildGenerationPrompt(understandingCard, [], dsContext, imageUploads);

        let generationText = '';
        const genStream = await anthropic.messages.stream({
          model: DEFAULT_MODEL,
          max_tokens: 8192,
          system: IDEATION_SYSTEM_PROMPT,
          messages: [understandingMessage, { role: 'assistant', content: understandingText }, generationMessage],
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
