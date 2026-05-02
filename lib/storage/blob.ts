import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';
import type { Upload } from '@/types/session';

export async function uploadFile(file: File, options?: { isDesignSystem?: boolean; order?: number }): Promise<Upload> {
  const ext = file.name.split('.').pop() ?? '';
  const filename = `${nanoid()}.${ext}`;

  const blob = await put(filename, file, { access: 'public' });

  return {
    id: nanoid(),
    url: blob.url,
    filename: file.name,
    mimeType: file.type,
    order: options?.order,
    isDesignSystem: options?.isDesignSystem,
  };
}

export async function uploadBuffer(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const blob = await put(filename, buffer, { access: 'public', contentType: mimeType });
  return blob.url;
}
