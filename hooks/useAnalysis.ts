'use client';

import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/store/session.store';
import type { UnderstandingCard, FlowDiagram, ScreenDescription, FlowAnalysis } from '@/types/session';

interface IdeationEvent {
  phase: string;
  data: unknown;
}

interface UseAnalysisReturn {
  startIdeation: (sessionId: string, textContent: string) => Promise<void>;
  startFlowReview: (sessionId: string, goal: string) => Promise<void>;
  startReview: (sessionId: string) => Promise<void>;
  abort: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const store = useSessionStore();

  const processStream = useCallback(async (
    url: string,
    body: Record<string, unknown>,
    onEvent: (event: IdeationEvent) => void,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) throw new Error('Stream request failed');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6)) as IdeationEvent;
            onEvent(event);
          } catch {
            // skip malformed
          }
        }
      }
    }
  }, []);

  const startIdeation = useCallback(async (sessionId: string, textContent: string) => {
    store.resetGenerationDelta();
    store.setActivePhase('understanding');
    store.setErrorMessage(null);

    await processStream('/api/analyze/ideation', { sessionId, textContent }, (event) => {
      const { phase, data } = event;

      if (phase === 'status') {
        store.setActivePhase(data as ReturnType<typeof store.setActivePhase> extends void ? never : Parameters<typeof store.setActivePhase>[0]);
      } else if (phase === 'understanding') {
        const d = data as { understandingCard: UnderstandingCard; needsClarification: boolean; clarifyingQuestions: string[] };
        if (d.needsClarification) {
          store.setPendingQuestions(d.clarifyingQuestions);
        }
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      } else if (phase === 'generation_delta') {
        store.appendGenerationDelta(data as string);
      } else if (phase === 'generation_complete') {
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      } else if (phase === 'error') {
        store.setActivePhase('error');
        store.setErrorMessage(data as string);
      }
    });

    queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
  }, [processStream, queryClient, store]);

  const startFlowReview = useCallback(async (sessionId: string, goal: string) => {
    store.setActivePhase('analyzing');
    store.setErrorMessage(null);

    await processStream('/api/analyze/flow-review', { sessionId, goal }, (event) => {
      const { phase, data } = event;

      if (phase === 'status') {
        store.setActivePhase(data as Parameters<typeof store.setActivePhase>[0]);
      } else if (phase === 'flow_analysis') {
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      } else if (phase === 'error') {
        store.setActivePhase('error');
        store.setErrorMessage(data as string);
      }
    });

    queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
  }, [processStream, queryClient, store]);

  const startReview = useCallback(async (sessionId: string) => {
    store.setActivePhase('reviewing');
    store.setErrorMessage(null);

    await processStream('/api/review', { sessionId }, (event) => {
      const { phase, data } = event;

      if (phase === 'status') {
        store.setActivePhase(data as Parameters<typeof store.setActivePhase>[0]);
      } else if (phase === 'role_review') {
        queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      } else if (phase === 'error') {
        store.setActivePhase('error');
        store.setErrorMessage(data as string);
      }
    });

    queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
  }, [processStream, queryClient, store]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    store.setActivePhase('idle');
  }, [store]);

  return { startIdeation, startFlowReview, startReview, abort };
}
