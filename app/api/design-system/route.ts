import { NextResponse } from 'next/server';
import { getSession, setDesignSystem } from '@/lib/storage/redis';
import { parseFigmaTokens } from '@/lib/claude/prompts/design-system';
import { designSystemSchema } from '@/lib/utils/schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, type, content } = designSystemSchema.parse(body);

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (type === 'figma-tokens') {
      const { componentNames, colorTokens, spacingTokens } = parseFigmaTokens(content);
      await setDesignSystem(sessionId, {
        type: 'figma-tokens',
        componentNames,
        colorTokens,
        spacingTokens,
        rawJson: content,
      });
      return NextResponse.json({ ok: true, componentNames, colorCount: Object.keys(colorTokens).length });
    }

    if (type === 'text') {
      await setDesignSystem(sessionId, { type: 'text', description: content });
      return NextResponse.json({ ok: true });
    }

    if (type === 'preset' && content === 'heroui') {
      await setDesignSystem(sessionId, { type: 'preset', name: 'heroui' });
      return NextResponse.json({ ok: true, componentNames: [], colorCount: 0 });
    }

    return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
