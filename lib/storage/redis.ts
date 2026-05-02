import { Redis } from '@upstash/redis';
import type { Session, SessionStatus, AnalysisResult, Upload } from '@/types/session';
import type { DesignSystemConfig } from '@/types/design-system';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const SESSION_TTL = 60 * 60 * 24; // 24 hours
const key = (id: string) => `session:${id}`;

export async function getSession(id: string): Promise<Session | null> {
  const data = await redis.get<Session>(key(id));
  return data;
}

export async function setSession(session: Session): Promise<void> {
  await redis.set(key(session.id), session, { ex: SESSION_TTL });
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
