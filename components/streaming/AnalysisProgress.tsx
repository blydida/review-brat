'use client';

import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import type { AnalysisPhase } from '@/store/session.store';
import type { SessionMode } from '@/types/session';

const IDEATION_STEPS: Array<{ phase: AnalysisPhase; label: string }> = [
  { phase: 'understanding', label: 'Understanding' },
  { phase: 'clarifying', label: 'Clarifying' },
  { phase: 'generating', label: 'Generating' },
  { phase: 'reviewing', label: 'Reviewing' },
];

const FLOW_STEPS: Array<{ phase: AnalysisPhase; label: string }> = [
  { phase: 'analyzing', label: 'Analyzing Flow' },
  { phase: 'reviewing', label: 'Reviewing' },
];

const PHASE_ORDER: Record<AnalysisPhase, number> = {
  idle: -1,
  understanding: 0,
  clarifying: 1,
  generating: 2,
  analyzing: 0,
  reviewing: 3,
  complete: 4,
  error: 5,
};

interface AnalysisProgressProps {
  mode: SessionMode;
  activePhase: AnalysisPhase;
}

export function AnalysisProgress({ mode, activePhase }: AnalysisProgressProps) {
  const steps = mode === 'ideation' ? IDEATION_STEPS : FLOW_STEPS;
  const activeOrder = PHASE_ORDER[activePhase] ?? -1;

  return (
    <div className="flex items-center gap-1">
      {steps.map(({ phase, label }, i) => {
        const stepOrder = PHASE_ORDER[phase] ?? i;
        const isDone = stepOrder < activeOrder;
        const isActive = stepOrder === activeOrder;

        return (
          <div key={phase} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors ${
              isDone
                ? 'text-emerald-500'
                : isActive
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground'
            }`}>
              {isDone ? (
                <CheckCircle className="w-3 h-3" />
              ) : isActive ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
              {label}
            </div>
            {i < steps.length - 1 && (
              <span className="text-muted-foreground/40 text-xs">›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
