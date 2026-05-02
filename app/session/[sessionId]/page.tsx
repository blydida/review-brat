'use client';

import { use, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, ArrowLeft, Play, Loader2, AlertCircle } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useSessionStore } from '@/store/session.store';
import { DropZone } from '@/components/upload/DropZone';
import { DesignSystemInput } from '@/components/upload/DesignSystemInput';
import { AnalysisProgress } from '@/components/streaming/AnalysisProgress';
import { UnderstandingCard } from '@/components/analysis/UnderstandingCard';
import { ClarificationQA } from '@/components/analysis/ClarificationQA';
import { UserFlowDiagram } from '@/components/analysis/UserFlowDiagram';
import { ScreenDescriptions } from '@/components/analysis/ScreenDescriptions';
import { FlowAnalysis } from '@/components/analysis/FlowAnalysis';
import { ReviewPanel } from '@/components/review/ReviewPanel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default function SessionPage({ params }: PageProps) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { data: session, isLoading } = useSession(sessionId);
  const { startIdeation, startFlowReview, startReview } = useAnalysis();
  const store = useSessionStore();
  const [copied, setCopied] = useState(false);
  const [hasUploads, setHasUploads] = useState(false);
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);

  const copyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartAnalysis = async () => {
    if (!session) return;
    if (session.mode === 'ideation') {
      await startIdeation(sessionId, store.textContent);
    } else {
      await startFlowReview(sessionId, store.flowGoal);
    }
  };

  const handleClarifySubmit = useCallback(async (answers: string[]) => {
    setIsSubmittingClarification(true);
    try {
      const res = await fetch('/api/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers, textContent: store.textContent }),
      });
      if (!res.ok || !res.body) return;

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
              const event = JSON.parse(line.slice(6));
              if (event.phase === 'status') store.setActivePhase(event.data);
              if (event.phase === 'generation_delta') store.appendGenerationDelta(event.data);
            } catch { /* skip */ }
          }
        }
      }
    } finally {
      setIsSubmittingClarification(false);
    }
  }, [sessionId, store]);

  const handleStartReview = () => startReview(sessionId);

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const result = session.analysisResult;
  const isActive = store.activePhase !== 'idle' && store.activePhase !== 'complete' && store.activePhase !== 'error';
  const showOutput = result?.understandingCard || result?.flowAnalysis || result?.screenDescriptions || result?.roleReviews;

  const canStartAnalysis = hasUploads && store.activePhase === 'idle' && session.status !== 'complete';
  const showClarification = store.activePhase === 'clarifying' || session.status === 'clarifying';
  const showReviewButton = (session.status === 'reviewing' || store.activePhase === 'reviewing') && !result?.roleReviews?.length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Badge variant="outline" className="text-xs capitalize">
            {session.mode === 'ideation' ? 'Ideation → Structure' : 'Flow Review'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {isActive && <AnalysisProgress mode={session.mode} activePhase={store.activePhase} />}
          <button
            onClick={copyShareUrl}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left panel — Input */}
        <aside className="w-full lg:w-[380px] lg:border-r border-border p-5 space-y-5 shrink-0">
          {/* Text input for ideation mode */}
          {session.mode === 'ideation' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Product Input
              </label>
              <Textarea
                value={store.textContent}
                onChange={(e) => store.setTextContent(e.target.value)}
                placeholder="Paste your PRD, user story, notes, or describe the feature you want to build..."
                className="min-h-[120px] text-sm resize-none"
                disabled={isActive}
              />
            </div>
          )}

          {/* Goal input for flow review mode */}
          {session.mode === 'flow-review' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Scenario Goal
              </label>
              <Textarea
                value={store.flowGoal}
                onChange={(e) => store.setFlowGoal(e.target.value)}
                placeholder="What is the user trying to accomplish in this flow? e.g. 'User completes onboarding and creates their first project'"
                className="min-h-[80px] text-sm resize-none"
                disabled={isActive}
              />
            </div>
          )}

          {/* File uploads */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {session.mode === 'ideation' ? 'Attachments (optional)' : 'Screenshots'}
            </label>
            <DropZone
              sessionId={sessionId}
              mode={session.mode}
              onUploaded={() => setHasUploads(true)}
            />
          </div>

          {/* Design system */}
          <DesignSystemInput
            sessionId={sessionId}
            onSaved={() => {}}
          />

          {/* Start button */}
          {store.activePhase === 'idle' && session.status !== 'complete' && (
            <Button
              onClick={handleStartAnalysis}
              disabled={!canStartAnalysis && session.mode === 'flow-review'}
              className="w-full"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              {session.mode === 'ideation' ? 'Analyze & Generate Flow' : 'Analyze Flow'}
            </Button>
          )}

          {store.activePhase === 'error' && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {store.errorMessage ?? 'Analysis failed. Please try again.'}
            </div>
          )}
        </aside>

        {/* Right panel — Output */}
        <main className="flex-1 p-5 space-y-5 overflow-y-auto">
          {!showOutput && store.activePhase === 'idle' && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="text-4xl mb-4">
                {session.mode === 'ideation' ? '💡' : '🔍'}
              </div>
              <p className="text-muted-foreground text-sm max-w-xs">
                {session.mode === 'ideation'
                  ? 'Add your product input and optional files, then click Analyze to get started.'
                  : 'Upload your screenshots in order and describe the scenario goal, then click Analyze.'}
              </p>
            </div>
          )}

          {/* Understanding card */}
          {result?.understandingCard && (
            <UnderstandingCard data={result.understandingCard} />
          )}

          {/* Clarification Q&A */}
          {showClarification && store.pendingQuestions.length > 0 && (
            <ClarificationQA
              sessionId={sessionId}
              questions={store.pendingQuestions}
              onSubmit={handleClarifySubmit}
              isSubmitting={isSubmittingClarification}
            />
          )}

          {/* Mode 1 outputs */}
          {result?.flowDiagram && <UserFlowDiagram diagram={result.flowDiagram} />}
          {result?.screenDescriptions && result.screenDescriptions.length > 0 && (
            <ScreenDescriptions screens={result.screenDescriptions} />
          )}

          {/* Mode 2 outputs */}
          {result?.flowAnalysis && <FlowAnalysis data={result.flowAnalysis} />}

          {/* Start review button */}
          {showReviewButton && (
            <div className="flex justify-center py-4">
              <Button onClick={handleStartReview} size="lg">
                <Play className="w-4 h-4 mr-2" />
                Run Team Review (PM + Design + Dev)
              </Button>
            </div>
          )}

          {/* Review panel */}
          {result?.roleReviews && result.roleReviews.length > 0 && (
            <ReviewPanel reviews={result.roleReviews} />
          )}

          {/* Streaming generation preview */}
          {store.generationDelta && store.activePhase === 'generating' && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Generating...
              </h3>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {store.generationDelta}
              </pre>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
