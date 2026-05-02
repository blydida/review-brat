'use client';

import { Badge } from '@/components/ui/badge';
import type { Recommendation } from '@/types/session';

const PRIORITY_STYLE = {
  high: 'text-red-400 border-red-500/30 bg-red-500/5',
  medium: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  low: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
};

interface Props {
  rec: Recommendation;
}

export function RecommendationItem({ rec }: Props) {
  return (
    <div className="p-3 rounded-lg border border-border bg-background/40 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs ${PRIORITY_STYLE[rec.priority]}`}>
            {rec.priority}
          </Badge>
          <span className="text-xs text-muted-foreground">{rec.category}</span>
          {rec.affectedArea && (
            <span className="text-xs text-muted-foreground">· {rec.affectedArea}</span>
          )}
        </div>
      </div>
      <p className="text-sm font-medium leading-snug">{rec.issue}</p>
      <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
        {rec.suggestion}
      </p>
    </div>
  );
}
