import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import { getSession, appendUpload, updateSessionStatus } from '@/lib/storage/redis';
import type { Upload } from '@/types/session';

const MAX_FILES = 10;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain'];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    const isDesignSystem = formData.get('isDesignSystem') === 'true';

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 });
    }

    const uploads: Upload[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `File "${file.name}" exceeds 10MB limit` }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `File type "${file.type}" not allowed` }, { status: 400 });
      }

      const ext = file.name.split('.').pop() ?? 'bin';
      const blobName = `${sessionId}/${nanoid()}.${ext}`;
      const blob = await put(blobName, file, { access: 'public' });

      uploads.push({
        id: nanoid(),
        url: blob.url,
        filename: file.name,
        mimeType: file.type,
        order: isDesignSystem ? undefined : i,
        isDesignSystem,
      });
    }

    await appendUpload(sessionId, uploads);
    await updateSessionStatus(sessionId, 'uploading');

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
