'use client';

import { Badge } from '@/components/ui/badge';
import { RecommendationItem } from './RecommendationItem';
import type { RoleReview } from '@/types/session';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const PRIORITY_LABEL: Record<string, string> = {
  high: 'критично',
  medium: 'важно',
  low: 'по возможности',
};

interface Props {
  review: RoleReview;
  defaultExpanded?: boolean;
}

export function RoleReviewCard({ review }: Props) {
  const sorted = [...review.recommendations].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );

  const highCount = review.recommendations.filter((r) => r.priority === 'high').length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Summary */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {highCount > 0 && (
              <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                {highCount} критично
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {review.recommendations.length} замечаний
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{review.summary}</p>
      </div>

      {/* Recommendations */}
      <div className="p-4 space-y-2">
        {sorted.map((rec) => (
          <RecommendationItem key={rec.id} rec={rec} priorityLabel={PRIORITY_LABEL[rec.priority]} />
        ))}
      </div>
    </div>
  );
}
