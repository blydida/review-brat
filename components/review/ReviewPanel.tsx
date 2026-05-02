'use client';

import { motion } from 'framer-motion';
import { RoleReviewCard } from './RoleReviewCard';
import type { RoleReview, ReviewRole } from '@/types/session';

const ROLE_ORDER: ReviewRole[] = ['pm', 'design-lead', 'developer'];

interface Props {
  reviews: RoleReview[];
}

export function ReviewPanel({ reviews }: Props) {
  const ordered = ROLE_ORDER.map((role) => reviews.find((r) => r.role === role)).filter(Boolean) as RoleReview[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Team Review
      </h3>
      {ordered.map((review, i) => (
        <motion.div
          key={review.role}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <RoleReviewCard review={review} />
        </motion.div>
      ))}
    </motion.div>
  );
}
