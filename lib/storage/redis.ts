import { createClient } from '@supabase/supabase-js';
import type { Session, SessionStatus, AnalysisResult, Upload } from '@/types/session';
import type { DesignSystemConfig } from '@/types/design-system';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function getSession(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('data')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data.data as Session;
}

export async function setSession(session: Session): Promise<void> {
  await supabase.from('sessions').upsert({
    id: session.id,
    data: session,
    updated_at: new Date().toISOString(),
  });
}

export async function updateSessionStatus(id: string, status: SessionStatus, error?: string): Promise<void> {
  const session = await getSession(id);
  if (!session) return;
  await setSession({ ...session, status, error, updatedAt: new Date().toISOString() });
}

export async function appendUpload(sessionId: string, uploads: Upload[]): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;
  await setSession({
    ...session,
    uploads: [...session.uploads, ...uploads],
    updatedAt: new Date().toISOString(),
  });
}

export async function setDesignSystem(sessionId: string, config: DesignSystemConfig): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;
  await setSession({ ...session, designSystem: config, updatedAt: new Date().toISOString() });
}

export async function setAnalysisResult(sessionId: string, result: Partial<AnalysisResult>): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;
  await setSession({
    ...session,
    analysisResult: { ...session.analysisResult, ...result },
    updatedAt: new Date().toISOString(),
  });
}
