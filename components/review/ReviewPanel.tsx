'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoleReviewCard } from './RoleReviewCard';
import type { RoleReview, ReviewRole } from '@/types/session';

const ROLE_TABS: Array<{ role: ReviewRole; label: string; emoji: string }> = [
  { role: 'pm', label: 'Продакт', emoji: '🎯' },
  { role: 'design-lead', label: 'Дизайн', emoji: '🎨' },
  { role: 'developer', label: 'Разработчик', emoji: '⚙️' },
];

interface Props {
  reviews: RoleReview[];
}

export function ReviewPanel({ reviews }: Props) {
  const availableRoles = ROLE_TABS.filter((t) => reviews.find((r) => r.role === t.role));
  const [activeRole, setActiveRole] = useState<ReviewRole>(availableRoles[0]?.role ?? 'pm');

  const activeReview = reviews.find((r) => r.role === activeRole);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Ревью команды
        </h3>
        {/* Role selector */}
        <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border border-border">
          {availableRoles.map(({ role, label, emoji }) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeRole === role
                  ? 'bg-background text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeReview && (
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <RoleReviewCard review={activeReview} defaultExpanded />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
