'use client';

import { motion } from 'framer-motion';
import { Target, TrendingUp, Zap } from 'lucide-react';
import type { UnderstandingCard as UnderstandingCardType } from '@/types/session';

const SECTIONS = [
  { key: 'userGoals' as const, label: 'Цели пользователя', icon: <Target className="w-4 h-4" />, color: 'text-violet-400' },
  { key: 'businessGoals' as const, label: 'Бизнес-цели', icon: <TrendingUp className="w-4 h-4" />, color: 'text-cyan-400' },
  { key: 'keyMechanics' as const, label: 'Ключевые механики', icon: <Zap className="w-4 h-4" />, color: 'text-amber-400' },
];

interface Props {
  data: UnderstandingCardType;
}

export function UnderstandingCard({ data }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 space-y-5"
    >
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Понимание задачи
      </h3>

      <div className="grid gap-4">
        {SECTIONS.map(({ key, label, icon, color }) => (
          <div key={key}>
            <div className={`flex items-center gap-2 mb-2 ${color}`}>
              {icon}
              <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <ul className="space-y-1">
              {data[key].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-foreground/30 shrink-0 mt-0.5">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
