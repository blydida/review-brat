import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { setSession } from '@/lib/storage/redis';
import { createSessionSchema } from '@/lib/utils/schema';
import type { Session } from '@/types/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode } = createSessionSchema.parse(body);

    const id = nanoid(12);
    const now = new Date().toISOString();

    const session: Session = {
      id,
      mode,
      status: 'created',
      createdAt: now,
      updatedAt: now,
      uploads: [],
    };

    await setSession(session);

    return NextResponse.json({ sessionId: id });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
