'use client';

import { useQuery } from '@tanstack/react-query';
import type { Session } from '@/types/session';

const POLLING_STATUSES = new Set(['uploading', 'understanding', 'clarifying', 'generating', 'analyzing', 'reviewing']);

export function useSession(sessionId: string | null) {
  return useQuery<Session>({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/session/${sessionId}`);
      if (!res.ok) throw new Error('Session not found');
      return res.json();
    },
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && POLLING_STATUSES.has(status) ? 2000 : false;
    },
    staleTime: 0,
  });
}
