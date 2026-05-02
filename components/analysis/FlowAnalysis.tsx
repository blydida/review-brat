'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FlowAnalysis as FlowAnalysisType } from '@/types/session';

interface Props {
  data: FlowAnalysisType;
}

const SEVERITY_STYLE = {
  high: 'border-red-500/30 bg-red-500/5 text-red-400',
  medium: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  low: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
};

export function FlowAnalysis({ data }: Props) {
  const sortedWeakSpots = [...data.weakSpots].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-4">
      {/* Logic summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-5"
      >
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Flow Logic
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{data.logicSummary}</p>
      </motion.div>

      {/* Clarity scores */}
      {data.clarityScores.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Clarity Scores
            </h3>
          </div>
          <div className="space-y-3">
            {data.clarityScores.map((cs) => (
              <div key={cs.screenIndex} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Screen {cs.screenIndex + 1}</span>
                  <span className={`text-xs font-bold ${cs.score >= 7 ? 'text-emerald-400' : cs.score >= 4 ? 'text-amber-400' : 'text-red-400'}`}>
                    {cs.score}/10
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${cs.score >= 7 ? 'bg-emerald-500' : cs.score >= 4 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${cs.score * 10}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{cs.rationale}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Weak spots */}
      {sortedWeakSpots.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Weak Spots ({sortedWeakSpots.length})
            </h3>
          </div>
          <div className="space-y-3">
            {sortedWeakSpots.map((ws, i) => (
              <div key={i} className={`p-3 rounded-lg border ${SEVERITY_STYLE[ws.severity]}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold">{ws.location}</span>
                  <Badge variant="outline" className={`text-xs shrink-0 ${SEVERITY_STYLE[ws.severity]}`}>
                    {ws.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{ws.issue}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
