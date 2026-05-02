'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RecommendationItem } from './RecommendationItem';
import type { RoleReview } from '@/types/session';

const ROLE_META: Record<string, { label: string; emoji: string; color: string }> = {
  pm: { label: 'Product Manager', emoji: '🎯', color: 'border-violet-500/30 bg-violet-500/5' },
  'design-lead': { label: 'Design Lead', emoji: '🎨', color: 'border-cyan-500/30 bg-cyan-500/5' },
  developer: { label: 'Developer', emoji: '⚙️', color: 'border-emerald-500/30 bg-emerald-500/5' },
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

interface Props {
  review: RoleReview;
}

export function RoleReviewCard({ review }: Props) {
  const [expanded, setExpanded] = useState(true);
  const meta = ROLE_META[review.role] ?? { label: review.role, emoji: '👤', color: 'border-border' };

  const sorted = [...review.recommendations].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  const highCount = review.recommendations.filter((r) => r.priority === 'high').length;

  return (
    <div className={`rounded-xl border ${meta.color} overflow-hidden`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{meta.emoji}</span>
          <div className="text-left">
            <div className="text-sm font-semibold">{meta.label}</div>
            <div className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
              {review.summary}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {highCount > 0 && (
            <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
              {highCount} high
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {review.recommendations.length} issues
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-2">
          {sorted.map((rec) => (
            <RecommendationItem key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
