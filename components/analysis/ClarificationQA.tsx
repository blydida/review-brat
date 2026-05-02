'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSessionStore } from '@/store/session.store';

interface Props {
  sessionId: string;
  questions: string[];
  onSubmit: (answers: string[]) => void;
  isSubmitting?: boolean;
}

export function ClarificationQA({ questions, onSubmit, isSubmitting }: Props) {
  const { clarificationAnswers, setClarificationAnswer } = useSessionStore();

  const canSubmit = clarificationAnswers.slice(0, questions.length).every((a) => a.trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4"
    >
      <div className="flex items-center gap-2 text-amber-400">
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-semibold">A few clarifying questions</span>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="space-y-2">
            <p className="text-sm font-medium">{q}</p>
            <Textarea
              value={clarificationAnswers[i] ?? ''}
              onChange={(e) => setClarificationAnswer(i, e.target.value)}
              placeholder="Your answer..."
              className="text-sm min-h-[72px] resize-none"
              disabled={isSubmitting}
            />
          </div>
        ))}
      </div>

      <Button
        onClick={() => onSubmit(clarificationAnswers.slice(0, questions.length))}
        disabled={!canSubmit || isSubmitting}
        className="w-full"
      >
        {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
        {isSubmitting ? 'Generating...' : 'Submit and Generate Flow'}
      </Button>
    </motion.div>
  );
}
